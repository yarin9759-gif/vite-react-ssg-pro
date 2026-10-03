import { asString, fail, json, readJson, type Handler } from '../../_lib/http';
import { loadBlockedDates, loadRules, loadSettings } from '../../_lib/db';
import { israelDateTime, isValidDate, isValidTime } from '../../../src/lib/booking-time';

// GET /api/admin/availability - settings, weekly hours and upcoming blocked dates
export const onRequestGet: Handler = async ({ env }) => {
  const today = israelDateTime(Date.now()).date;
  const [settings, rules, blockedDates] = await Promise.all([
    loadSettings(env.DB),
    loadRules(env.DB),
    loadBlockedDates(env.DB, today, '9999-12-31'),
  ]);
  return json({ settings, rules, blockedDates });
};

interface Body {
  settings?: { slotMinutes?: unknown; minNoticeHours?: unknown; maxDaysAhead?: unknown };
  rules?: unknown;
  blockedDates?: unknown;
}

function intInRange(value: unknown, min: number, max: number): number | null {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max ? (value as number) : null;
}

// PUT /api/admin/availability - replaces settings, weekly hours and blocked dates in one transaction.
// Existing bookings are kept even if they fall outside the new hours.
export const onRequestPut: Handler = async ({ request, env }) => {
  const body = await readJson<Body>(request);
  if (!body || !Array.isArray(body.rules) || !Array.isArray(body.blockedDates) || !body.settings) {
    return fail(400, 'הבקשה אינה תקינה');
  }

  const slotMinutes = intInRange(body.settings.slotMinutes, 15, 240);
  const minNoticeHours = intInRange(body.settings.minNoticeHours, 0, 168);
  const maxDaysAhead = intInRange(body.settings.maxDaysAhead, 1, 180);
  if (slotMinutes === null || slotMinutes % 5 !== 0) return fail(422, 'אורך משבצת: 15–240 דקות, בקפיצות של 5');
  if (minNoticeHours === null) return fail(422, 'התראה מראש: 0–168 שעות');
  if (maxDaysAhead === null) return fail(422, 'טווח הזמנה: 1–180 ימים');

  if (body.rules.length > 50) return fail(422, 'יותר מדי טווחי שעות');
  const rules = [];
  for (const raw of body.rules as Record<string, unknown>[]) {
    const weekday = intInRange(raw?.weekday, 0, 6);
    const start = asString(raw?.start);
    const end = asString(raw?.end);
    if (weekday === null || !isValidTime(start) || !isValidTime(end) || start >= end) {
      return fail(422, 'אחד מטווחי השעות אינו תקין (שעת הסיום חייבת להיות אחרי שעת ההתחלה)');
    }
    rules.push({ weekday, start, end });
  }

  if (body.blockedDates.length > 400) return fail(422, 'יותר מדי ימים חסומים');
  const blocked = new Map<string, string>();
  for (const raw of body.blockedDates as Record<string, unknown>[]) {
    const date = asString(raw?.date);
    if (!isValidDate(date)) return fail(422, 'אחד הימים החסומים אינו תאריך תקין');
    blocked.set(date, asString(raw?.reason, 100).trim());
  }

  const db = env.DB;
  await db.batch([
    db.prepare('DELETE FROM availability_rules'),
    ...rules.map((r) =>
      db.prepare('INSERT INTO availability_rules (weekday, start_time, end_time) VALUES (?, ?, ?)').bind(r.weekday, r.start, r.end),
    ),
    db.prepare('DELETE FROM blocked_dates'),
    ...[...blocked].map(([date, reason]) =>
      db.prepare('INSERT INTO blocked_dates (date, reason) VALUES (?, ?)').bind(date, reason || null),
    ),
    ...Object.entries({ slot_minutes: slotMinutes, min_notice_hours: minNoticeHours, max_days_ahead: maxDaysAhead }).map(([key, value]) =>
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').bind(key, String(value)),
    ),
  ]);

  return onRequestGet({ env } as Parameters<Handler>[0]);
};
