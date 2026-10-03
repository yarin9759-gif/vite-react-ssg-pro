import { asString, clientIpHash, fail, isUniqueViolation, json, randomToken, readJson, sha256, type Handler } from '../../_lib/http';
import { loadSchedule } from '../../_lib/db';
import { servicesById } from '../../../src/data/booking';
import { israelDateTime, isSlotBookable, normalizePhone, validateBookingInput } from '../../../src/lib/booking-time';

// Basic spam protection (see docs/booking.md)
const MIN_FILL_MS = 3_000;
const MAX_REQUESTS_PER_IP_PER_HOUR = 5;
const MAX_OPEN_REQUESTS_PER_PHONE = 2;

interface Body {
  serviceId?: unknown;
  date?: unknown;
  time?: unknown;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  notes?: unknown;
  // Honeypot - hidden from people, bots tend to fill it
  website?: unknown;
  // When the form was opened (ms), to reject instant bot submissions
  startedAt?: unknown;
}

// POST /api/booking/requests - create a pending booking request
export const onRequestPost: Handler = async ({ request, env }) => {
  const body = await readJson<Body>(request);
  if (!body) return fail(400, 'הבקשה אינה תקינה');

  const now = Date.now();
  const startedAt = Number(body.startedAt);
  if (asString(body.website) !== '' || !Number.isFinite(startedAt) || now - startedAt < MIN_FILL_MS) {
    return fail(400, 'לא הצלחנו לאמת את הבקשה. המתינו רגע ונסו לשלוח שוב.');
  }

  const input = {
    serviceId: asString(body.serviceId),
    date: asString(body.date),
    time: asString(body.time),
    name: asString(body.name).trim(),
    phone: asString(body.phone),
    email: asString(body.email).trim(),
    notes: asString(body.notes).trim(),
  };
  const errors = validateBookingInput(input, servicesById);
  if (Object.keys(errors).length > 0) return fail(422, 'יש לתקן את השדות המסומנים', { fields: errors });
  const phone = normalizePhone(input.phone)!;

  const ipHash = await clientIpHash(request, env);
  const hourAgo = new Date(now - 3_600_000).toISOString();
  const today = israelDateTime(now).date;
  const [byIp, byPhone] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS n FROM bookings WHERE ip_hash = ? AND created_at > ?').bind(ipHash, hourAgo).first<{ n: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM bookings WHERE phone = ? AND status IN ('pending', 'proposed') AND date >= ?")
      .bind(phone, today)
      .first<{ n: number }>(),
  ]);
  if ((byIp?.n ?? 0) >= MAX_REQUESTS_PER_IP_PER_HOUR) {
    return fail(429, 'נשלחו יותר מדי בקשות. נסו שוב מאוחר יותר או צרו קשר בטלפון.');
  }
  if ((byPhone?.n ?? 0) >= MAX_OPEN_REQUESTS_PER_PHONE) {
    return fail(409, 'כבר יש בקשות פתוחות למספר הטלפון הזה. נחזור אליכם בהקדם.');
  }

  const schedule = await loadSchedule(env.DB, now);
  if (!isSlotBookable(input.date, input.time, schedule)) {
    return fail(409, 'המועד שבחרתם כבר אינו פנוי. בחרו מועד אחר.', { code: 'slot_unavailable' });
  }

  const id = crypto.randomUUID();
  const token = randomToken();
  const createdAt = new Date(now).toISOString();
  try {
    await env.DB.prepare(
      `INSERT INTO bookings (id, token_hash, service_id, date, time, requested_date, requested_time,
         name, phone, email, notes, status, ip_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    )
      .bind(id, await sha256(token), input.serviceId, input.date, input.time, input.date, input.time,
        input.name, phone, input.email || null, input.notes || null, ipHash, createdAt, createdAt)
      .run();
  } catch (error) {
    // Someone else took the slot between the check and the insert
    if (isUniqueViolation(error)) {
      return fail(409, 'המועד שבחרתם נתפס הרגע. בחרו מועד אחר.', { code: 'slot_unavailable' });
    }
    throw error;
  }

  return json({ id, token, status: 'pending' }, 201);
};
