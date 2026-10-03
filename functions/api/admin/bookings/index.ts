import { json, type Handler } from '../../../_lib/http';
import { adminBooking, type BookingRow } from '../../../_lib/db';
import { israelDateTime } from '../../../../src/lib/booking-time';

// GET /api/admin/bookings?scope=upcoming|past
export const onRequestGet: Handler = async ({ request, env }) => {
  const past = new URL(request.url).searchParams.get('scope') === 'past';
  const today = israelDateTime(Date.now()).date;
  const query = past
    ? 'SELECT * FROM bookings WHERE date < ? ORDER BY date DESC, time DESC LIMIT 200'
    : 'SELECT * FROM bookings WHERE date >= ? ORDER BY date, time LIMIT 500';
  const { results } = await env.DB.prepare(query).bind(today).all<BookingRow>();
  return json({ bookings: results.map(adminBooking) });
};
