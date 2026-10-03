import { asString, clientIpHash, fail, json, readJson, safeEqual, type Handler } from '../../_lib/http';
import { authConfigError, createSessionCookie } from '../../_lib/auth';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60_000;

// POST /api/admin/login { password }
export const onRequestPost: Handler = async ({ request, env }) => {
  const configError = authConfigError(env);
  if (configError) return fail(503, configError);

  const body = await readJson<{ password?: unknown }>(request);
  if (!body) return fail(400, 'הבקשה אינה תקינה');

  const now = Date.now();
  const ipHash = await clientIpHash(request, env);
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE ip_hash = ? AND created_at > ?')
    .bind(ipHash, now - WINDOW_MS)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= MAX_FAILURES) return fail(429, 'יותר מדי ניסיונות התחברות. נסו שוב בעוד 15 דקות.');

  if (!(await safeEqual(asString(body.password, 256), env.ADMIN_PASSWORD!))) {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO login_attempts (ip_hash, created_at) VALUES (?, ?)').bind(ipHash, now),
      env.DB.prepare('DELETE FROM login_attempts WHERE created_at < ?').bind(now - 24 * 3_600_000),
    ]);
    return fail(401, 'הסיסמה שגויה');
  }

  await env.DB.prepare('DELETE FROM login_attempts WHERE ip_hash = ?').bind(ipHash).run();
  return json({ authenticated: true }, 200, { 'Set-Cookie': await createSessionCookie(env) });
};
