import { asString, fail, isUniqueViolation, json, readJson, type Handler } from '../../../_lib/http';
import { adminBooking, getBooking } from '../../../_lib/db';
import type { BookingStatus } from '../../../../src/data/booking';
import { isFutureSlot, isValidDate, isValidTime } from '../../../../src/lib/booking-time';

const MAX_MESSAGE = 500;

// Which admin actions are allowed from which status
const allowedFrom: Record<string, BookingStatus[]> = {
  approve: ['pending', 'proposed'],
  reject: ['pending', 'proposed', 'approved'],
  propose: ['pending', 'proposed', 'approved'],
};

// POST /api/admin/bookings/:id { action: 'approve' | 'reject' | 'propose', date?, time?, message? }
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const id = asString(params.id, 64);
  const body = await readJson<{ action?: unknown; date?: unknown; time?: unknown; message?: unknown }>(request);
  if (!body) return fail(400, 'הבקשה אינה תקינה');

  const action = asString(body.action);
  const from = allowedFrom[action];
  if (!from) return fail(400, 'פעולה לא מוכרת');

  const message = asString(body.message, MAX_MESSAGE + 1).trim();
  if (message.length > MAX_MESSAGE) return fail(422, `ההודעה ארוכה מדי (עד ${MAX_MESSAGE} תווים)`);

  const row = await getBooking(env.DB, id);
  if (!row) return fail(404, 'הבקשה לא נמצאה');
  if (!from.includes(row.status)) return fail(409, 'לא ניתן לבצע פעולה זו במצב הנוכחי של הבקשה');

  const now = new Date().toISOString();
  let statement: D1PreparedStatement;
  if (action === 'propose') {
    const date = asString(body.date);
    const time = asString(body.time);
    if (!isValidDate(date) || !isValidTime(time)) return fail(422, 'יש לבחור תאריך ושעה תקינים');
    if (!isFutureSlot(date, time, Date.now())) return fail(422, 'המועד המוצע כבר עבר');
    if (date === row.date && time === row.time) return fail(422, 'המועד המוצע זהה למועד הנוכחי');
    statement = env.DB.prepare(
      "UPDATE bookings SET status = 'proposed', date = ?, time = ?, admin_message = ?, updated_at = ? WHERE id = ? AND status = ?",
    ).bind(date, time, message || null, now, id, row.status);
  } else {
    const status: BookingStatus = action === 'approve' ? 'approved' : 'rejected';
    statement = env.DB.prepare('UPDATE bookings SET status = ?, admin_message = ?, updated_at = ? WHERE id = ? AND status = ?')
      .bind(status, message || null, now, id, row.status);
  }

  try {
    const { meta } = await statement.run();
    if (meta.changes === 0) return fail(409, 'הבקשה עודכנה בינתיים. רעננו את הרשימה.');
  } catch (error) {
    if (isUniqueViolation(error)) return fail(409, 'המועד הזה כבר תפוס על ידי בקשה אחרת');
    throw error;
  }

  return json({ booking: adminBooking((await getBooking(env.DB, id))!) });
};
