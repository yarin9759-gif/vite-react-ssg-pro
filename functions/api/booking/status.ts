import { asString, fail, json, readJson, safeEqual, sha256, type Handler } from '../../_lib/http';
import { getBooking, publicBooking, type BookingRow } from '../../_lib/db';
import type { BookingStatus } from '../../../src/data/booking';

// The visitor proves ownership with the private token they got when submitting.
async function authorize(env: Parameters<Handler>[0]['env'], id: string, token: string): Promise<BookingRow | null> {
  if (!id || !token) return null;
  const row = await getBooking(env.DB, id);
  if (!row) return null;
  return (await safeEqual(await sha256(token), row.token_hash)) ? row : null;
}

// GET /api/booking/status?id=...&token=...
export const onRequestGet: Handler = async ({ request, env }) => {
  const url = new URL(request.url);
  const row = await authorize(env, asString(url.searchParams.get('id'), 64), asString(url.searchParams.get('token'), 128));
  if (!row) return fail(404, 'לא מצאנו את הבקשה. בדקו שהקישור הועתק במלואו.');
  return json({ booking: publicBooking(row) });
};

// Which visitor actions are allowed from which status
const transitions: Record<string, { from: BookingStatus[]; to: BookingStatus }> = {
  accept: { from: ['proposed'], to: 'approved' },
  decline: { from: ['proposed'], to: 'cancelled' },
  cancel: { from: ['pending', 'approved'], to: 'cancelled' },
};

// POST /api/booking/status { id, token, action: 'accept' | 'decline' | 'cancel' }
export const onRequestPost: Handler = async ({ request, env }) => {
  const body = await readJson<{ id?: unknown; token?: unknown; action?: unknown }>(request);
  if (!body) return fail(400, 'הבקשה אינה תקינה');
  const row = await authorize(env, asString(body.id, 64), asString(body.token, 128));
  if (!row) return fail(404, 'לא מצאנו את הבקשה. בדקו שהקישור הועתק במלואו.');

  const transition = transitions[asString(body.action)];
  if (!transition) return fail(400, 'פעולה לא מוכרת');
  if (!transition.from.includes(row.status)) return fail(409, 'לא ניתן לבצע פעולה זו במצב הנוכחי של הבקשה. רעננו את הדף.');

  const { meta } = await env.DB.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ? AND status = ?')
    .bind(transition.to, new Date().toISOString(), row.id, row.status)
    .run();
  if (meta.changes === 0) return fail(409, 'הבקשה עודכנה בינתיים. רעננו את הדף.');

  return json({ booking: publicBooking((await getBooking(env.DB, row.id))!) });
};
