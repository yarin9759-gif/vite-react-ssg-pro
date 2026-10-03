import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { servicesById } from '../src/data/booking';
import {
  addDays,
  computeAvailability,
  isFutureSlot,
  isSlotBookable,
  isValidDate,
  israelDateTime,
  normalizePhone,
  slotsForWeekday,
  validateBookingInput,
  weekdayOf,
} from '../src/lib/booking-time';

// 2026-10-04 is a Sunday. 09:00 Israel summer time (UTC+3) = 06:00 UTC.
const SUNDAY_9AM = Date.parse('2026-10-04T06:00:00Z');

const baseCtx = () => ({
  rules: [{ weekday: 0, start: '09:00', end: '12:00' }],
  settings: { slotMinutes: 60, minNoticeHours: 0, maxDaysAhead: 7 },
  blockedDates: new Set<string>(),
  takenSlots: new Set<string>(),
  // 30 seconds after the 09:00 slot started
  nowMs: SUNDAY_9AM + 30_000,
});

describe('Israel time', () => {
  it('converts instants to Israel wall-clock time across DST', () => {
    assert.deepEqual(israelDateTime(SUNDAY_9AM), { date: '2026-10-04', time: '09:00' });
    // Winter time (UTC+2)
    assert.deepEqual(israelDateTime(Date.parse('2026-12-01T22:30:00Z')), { date: '2026-12-02', time: '00:30' });
  });

  it('handles calendar arithmetic', () => {
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(weekdayOf('2026-10-04'), 0);
    assert.equal(isValidDate('2026-02-30'), false);
    assert.equal(isValidDate('2026-02-28'), true);
  });
});

describe('slots', () => {
  it('builds slots that fit inside each range', () => {
    assert.deepEqual(slotsForWeekday(0, [{ weekday: 0, start: '09:00', end: '11:30' }], 60), ['09:00', '10:00']);
    assert.deepEqual(slotsForWeekday(1, [{ weekday: 0, start: '09:00', end: '11:00' }], 60), []);
  });

  it('hides past slots, taken slots and blocked days', () => {
    const ctx = baseCtx();
    ctx.takenSlots.add('2026-10-04 11:00');
    const days = computeAvailability(ctx);
    // 09:00 already started, 11:00 is taken
    assert.deepEqual(days[0], { date: '2026-10-04', times: ['10:00'] });
    assert.deepEqual(days[1], { date: '2026-10-11', times: ['09:00', '10:00', '11:00'] });

    ctx.blockedDates.add('2026-10-11');
    assert.equal(computeAvailability(ctx).length, 1);
  });

  it('respects minimum notice and the booking horizon', () => {
    // Exactly 2 hours before 11:00 - still bookable
    const ctx = { ...baseCtx(), nowMs: SUNDAY_9AM, settings: { slotMinutes: 60, minNoticeHours: 2, maxDaysAhead: 6 } };
    assert.deepEqual(computeAvailability(ctx), [{ date: '2026-10-04', times: ['11:00'] }]);
    assert.equal(isSlotBookable('2026-10-04', '10:00', ctx), false);
    assert.equal(isSlotBookable('2026-10-04', '11:00', ctx), true);
    assert.equal(isSlotBookable('2026-10-11', '09:00', ctx), false);
  });

  it('only allows future proposals', () => {
    assert.equal(isFutureSlot('2026-10-04', '08:59', SUNDAY_9AM), false);
    assert.equal(isFutureSlot('2026-10-04', '09:01', SUNDAY_9AM), true);
  });
});

describe('services', () => {
  it('consultation price matches the product catalog', async () => {
    // products.ts imports icons, so load it lazily only in this test
    const { productsById } = await import('../src/data/products');
    assert.equal(servicesById.get('project-consultation')?.price, productsById.get('project-consultation')?.price);
  });
});

describe('validation', () => {
  const valid = {
    serviceId: 'project-consultation',
    date: '2026-10-11',
    time: '09:00',
    name: 'ישראל ישראלי',
    phone: '050-123-4567',
    email: '',
    notes: '',
  };

  it('accepts a valid request', () => {
    assert.deepEqual(validateBookingInput(valid, servicesById), {});
  });

  it('reports each invalid field', () => {
    const errors = validateBookingInput(
      { ...valid, serviceId: 'nope', name: 'א', phone: '123', email: 'bad', time: '25:00' },
      servicesById,
    );
    assert.deepEqual(Object.keys(errors).sort(), ['email', 'name', 'phone', 'serviceId', 'time']);
  });

  it('normalizes Israeli phone numbers', () => {
    assert.equal(normalizePhone('+972 54-123-4567'), '0541234567');
    assert.equal(normalizePhone('03-1234567'), '031234567');
    assert.equal(normalizePhone('0541234'), null);
  });
});
