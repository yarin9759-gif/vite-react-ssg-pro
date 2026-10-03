import { servicesById, type BookingStatus } from '../../src/data/booking';
import {
  addDays,
  israelDateTime,
  type AvailabilityRule,
  type BookingSettings,
} from '../../src/lib/booking-time';

export interface BookingRow {
  id: string;
  token_hash: string;
  service_id: string;
  date: string;
  time: string;
  requested_date: string;
  requested_time: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: BookingStatus;
  admin_message: string | null;
  created_at: string;
  updated_at: string;
}

// Statuses that hold their slot (mirrors the bookings_active_slot index)
export const ACTIVE_STATUSES = "('pending', 'approved', 'proposed')";

export async function loadSettings(db: D1Database): Promise<BookingSettings> {
  const { results } = await db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
  const map = new Map(results.map((r) => [r.key, Number(r.value)]));
  return {
    slotMinutes: map.get('slot_minutes') ?? 60,
    minNoticeHours: map.get('min_notice_hours') ?? 12,
    maxDaysAhead: map.get('max_days_ahead') ?? 30,
  };
}

export async function loadRules(db: D1Database): Promise<AvailabilityRule[]> {
  const { results } = await db
    .prepare('SELECT weekday, start_time AS start, end_time AS end FROM availability_rules ORDER BY weekday, start_time')
    .all<AvailabilityRule>();
  return results;
}

export async function loadBlockedDates(db: D1Database, from: string, to: string) {
  const { results } = await db
    .prepare('SELECT date, reason FROM blocked_dates WHERE date BETWEEN ? AND ? ORDER BY date')
    .bind(from, to)
    .all<{ date: string; reason: string | null }>();
  return results;
}

// Everything needed to compute free slots from today until the booking horizon.
export async function loadSchedule(db: D1Database, nowMs: number) {
  const settings = await loadSettings(db);
  const today = israelDateTime(nowMs).date;
  const last = addDays(today, settings.maxDaysAhead);
  const [rules, blocked, taken] = await Promise.all([
    loadRules(db),
    loadBlockedDates(db, today, last),
    db
      .prepare(`SELECT date, time FROM bookings WHERE date BETWEEN ? AND ? AND status IN ${ACTIVE_STATUSES}`)
      .bind(today, last)
      .all<{ date: string; time: string }>(),
  ]);
  return {
    settings,
    rules,
    blockedDates: new Set(blocked.map((b) => b.date)),
    takenSlots: new Set(taken.results.map((b) => `${b.date} ${b.time}`)),
    nowMs,
  };
}

// What the visitor sees on their private status page.
export function publicBooking(row: BookingRow) {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: servicesById.get(row.service_id)?.name ?? row.service_id,
    date: row.date,
    time: row.time,
    requestedDate: row.requested_date,
    requestedTime: row.requested_time,
    name: row.name,
    status: row.status,
    adminMessage: row.admin_message,
    createdAt: row.created_at,
  };
}

// Full record for the admin area.
export function adminBooking(row: BookingRow) {
  return { ...publicBooking(row), phone: row.phone, email: row.email, notes: row.notes, updatedAt: row.updated_at };
}

export function getBooking(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<BookingRow>();
}
