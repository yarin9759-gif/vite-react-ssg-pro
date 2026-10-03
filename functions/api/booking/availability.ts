import { json, type Handler } from '../../_lib/http';
import { loadSchedule } from '../../_lib/db';
import { computeAvailability } from '../../../src/lib/booking-time';

// GET /api/booking/availability - free slots for every bookable day (Israel time)
export const onRequestGet: Handler = async ({ env }) => {
  const schedule = await loadSchedule(env.DB, Date.now());
  return json({ days: computeAvailability(schedule), slotMinutes: schedule.settings.slotMinutes });
};
