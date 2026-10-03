// Helpers shared by the API routes. Files in functions/_lib export no onRequest handlers,
// so Cloudflare Pages does not expose them as routes.

export interface Env {
  DB: D1Database;
  // Set as encrypted Pages secrets (never in code) - see docs/booking.md
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
}

export type Handler = PagesFunction<Env>;

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export function fail(status: number, message: string, extra: Record<string, unknown> = {}) {
  return json({ error: message, ...extra }, status);
}

const MAX_BODY_BYTES = 16 * 1024;

// Parses a JSON body. Requiring the JSON content type also blocks cross-site form posts (CSRF),
// since browsers can't send it cross-origin without a CORS preflight, which this API never allows.
export async function readJson<T>(request: Request): Promise<T | null> {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return null;
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    const data: unknown = JSON.parse(text);
    return data && typeof data === 'object' ? (data as T) : null;
  } catch {
    return null;
  }
}

const encoder = new TextEncoder();

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomToken(bytes = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

// Compares two strings without leaking where they differ.
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

// Visitor IP, hashed so raw addresses are never stored.
export function clientIpHash(request: Request, env: Env): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  return sha256(`${env.SESSION_SECRET ?? ''}:${ip}`);
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}

export function asString(value: unknown, maxLength = 2000): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}
