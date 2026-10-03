-- Consultations last 90 minutes (src/data/booking.ts), so each slot is 90 minutes.
-- Sunday–Thursday 07:00–17:00 -> 07:00, 08:30, 10:00, 11:30, 13:00, 14:30. Friday 07:00–13:00 -> 4 slots.
UPDATE settings SET value = '90' WHERE key = 'slot_minutes';
