import { base64url, type Env } from './http';

// Admin session: a signed, HttpOnly cookie "<expiry>.<HMAC>". No session state is stored.
const COOKIE_NAME = '__Host-admin_session';
const SESSION_HOURS = 12;

export const MIN_PASSWORD_LENGTH = 10;
export const MIN_SECRET_LENGTH = 32;

export function authConfigError(env: Env): string | null {
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) {
    return `לא הוגדרה סיסמת ניהול (ADMIN_PASSWORD, לפחות ${MIN_PASSWORD_LENGTH} תווים)`;
  }
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < MIN_SECRET_LENGTH) {
    return `לא הוגדר מפתח התחברות (SESSION_SECRET, לפחות ${MIN_SECRET_LENGTH} תווים)`;
  }
  return null;
}

function hmacKey(secret: string, usage: 'sign' | 'verify') {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}

function fromBase64url(value: string): Uint8Array | null {
  try {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function createSessionCookie(env: Env): Promise<string> {
  const expires = Date.now() + SESSION_HOURS * 3_600_000;
  const key = await hmacKey(env.SESSION_SECRET!, 'sign');
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`admin.${expires}`));
  const value = `${expires}.${base64url(new Uint8Array(signature))}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAdmin(request: Request, env: Env): Promise<boolean> {
  if (authConfigError(env)) return false;
  const cookie = request.headers.get('Cookie') ?? '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const [expires, signature] = match[1].split('.');
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const bytes = fromBase64url(signature);
  if (!bytes) return false;

  const key = await hmacKey(env.SESSION_SECRET!, 'verify');
  return crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(`admin.${expires}`));
}
