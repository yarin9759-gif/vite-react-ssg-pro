// Slot calculation and form validation for consultation bookings.
// Shared by the site (src/) and the API (functions/): the server re-runs every check, the browser
// only uses them for instant feedback. All dates/times are wall-clock values in Israel time.
// No '@/' imports here: the API bundle (functions/) does not resolve that alias.

const TIME_ZONE = 'Asia/Jerusalem';

export interface AvailabilityRule {
  // 0 = Sunday ... 6 = Saturday
  weekday: number;
  start: string;
  end: string;
}

export interface BookingSettings {
  slotMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
}

export interface DaySlots {
  date: string;
  times: string[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value);
}

const israelFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Wall-clock date and time in Israel for a given instant (DST handled by Intl).
export function israelDateTime(ms: number): { date: string; time: string } {
  const parts = Object.fromEntries(israelFormat.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** @internal Exported for tests */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

// Slot start times for one weekday, from all of its availability ranges.
/** @internal Exported for tests */
export function slotsForWeekday(weekday: number, rules: AvailabilityRule[], slotMinutes: number): string[] {
  const times = new Set<string>();
  for (const rule of rules) {
    if (rule.weekday !== weekday) continue;
    const end = toMinutes(rule.end);
    for (let t = toMinutes(rule.start); t + slotMinutes <= end; t += slotMinutes) {
      times.add(fromMinutes(t));
    }
  }
  return [...times].sort();
}

interface AvailabilityContext {
  rules: AvailabilityRule[];
  settings: BookingSettings;
  blockedDates: Set<string>;
  // "YYYY-MM-DD HH:MM" of slots already held by a pending, approved or proposed booking
  takenSlots: Set<string>;
  nowMs: number;
}

// Earliest wall-clock minute that can still be booked, as "YYYY-MM-DD HH:MM" (rounded up).
function bookingCutoff(nowMs: number, minNoticeHours: number) {
  const cutoff = israelDateTime(Math.ceil((nowMs + minNoticeHours * 3_600_000) / 60_000) * 60_000);
  return `${cutoff.date} ${cutoff.time}`;
}

// Free slots for every bookable day, starting today (Israel time).
export function computeAvailability(ctx: AvailabilityContext): DaySlots[] {
  const today = israelDateTime(ctx.nowMs).date;
  const cutoff = bookingCutoff(ctx.nowMs, ctx.settings.minNoticeHours);
  const days: DaySlots[] = [];

  for (let i = 0; i <= ctx.settings.maxDaysAhead; i++) {
    const date = addDays(today, i);
    if (ctx.blockedDates.has(date)) continue;
    const times = slotsForWeekday(weekdayOf(date), ctx.rules, ctx.settings.slotMinutes).filter((time) => {
      const key = `${date} ${time}`;
      return key >= cutoff && !ctx.takenSlots.has(key);
    });
    if (times.length > 0) days.push({ date, times });
  }
  return days;
}

export function isSlotBookable(date: string, time: string, ctx: AvailabilityContext): boolean {
  return computeAvailability(ctx).some((day) => day.date === date && day.times.includes(time));
}

// Admins may propose any future time, even outside the regular hours.
export function isFutureSlot(date: string, time: string, nowMs: number): boolean {
  const now = israelDateTime(nowMs);
  return `${date} ${time}` > `${now.date} ${now.time}`;
}

// ---------- Form validation ----------

export interface BookingInput {
  serviceId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export type BookingErrors = Partial<Record<keyof BookingInput, string>>;

export const LIMITS = { name: 60, email: 254, notes: 1000 };

// Israeli phone to local digits, e.g. "+972 54-123-4567" -> "0541234567". Returns null when invalid.
export function normalizePhone(value: string): string | null {
  let digits = value.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+972')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('972')) digits = `0${digits.slice(3)}`;
  return /^0(5\d{8}|7\d{8}|[2-489]\d{7})$/.test(digits) ? digits : null;
}

// International format for wa.me links, e.g. "0541234567" -> "972541234567"
export function phoneToWhatsapp(phone: string): string {
  return `972${phone.replace(/^0/, '')}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBookingInput(input: BookingInput, knownServices: { has(id: string): boolean }): BookingErrors {
  const errors: BookingErrors = {};
  if (!knownServices.has(input.serviceId)) errors.serviceId = 'יש לבחור סוג פגישה';
  if (!isValidDate(input.date)) errors.date = 'יש לבחור תאריך';
  if (!isValidTime(input.time)) errors.time = 'יש לבחור שעה';

  const name = input.name.trim();
  if (name.length < 2) errors.name = 'יש להזין שם מלא';
  else if (name.length > LIMITS.name) errors.name = `השם ארוך מדי (עד ${LIMITS.name} תווים)`;

  if (!input.phone.trim()) errors.phone = 'יש להזין מספר טלפון';
  else if (!normalizePhone(input.phone)) errors.phone = 'מספר הטלפון אינו תקין (לדוגמה 050-1234567)';

  const email = input.email.trim();
  if (email && (email.length > LIMITS.email || !EMAIL_RE.test(email))) errors.email = 'כתובת האימייל אינה תקינה';

  if (input.notes.length > LIMITS.notes) errors.notes = `ההערות ארוכות מדי (עד ${LIMITS.notes} תווים)`;
  return errors;
}

// ---------- Display helpers ----------

const dayFormat = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const shortDayFormat = new Intl.DateTimeFormat('he-IL', { weekday: 'short', timeZone: 'UTC' });
const shortMonthFormat = new Intl.DateTimeFormat('he-IL', { month: 'short', timeZone: 'UTC' });

// "יום שלישי, 6 באוקטובר" - dates are wall-clock values, so format them as UTC to avoid shifting
export function formatDate(date: string): string {
  return dayFormat.format(new Date(`${date}T00:00:00Z`));
}

export function formatWeekdayShort(date: string): string {
  return shortDayFormat.format(new Date(`${date}T00:00:00Z`));
}

export function formatMonthShort(date: string): string {
  return shortMonthFormat.format(new Date(`${date}T00:00:00Z`));
}
