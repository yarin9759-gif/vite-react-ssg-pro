-- Consultation booking schema (Cloudflare D1 / SQLite).
-- Apply with: pnpm db:migrate:local  (dev)  or  pnpm db:migrate:remote  (production)

-- Scheduling settings, editable from the admin area.
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES
  ('slot_minutes', '60'),
  ('min_notice_hours', '12'),
  ('max_days_ahead', '30');

-- Weekly opening ranges. A weekday may have several ranges (e.g. morning and evening).
-- Empty on purpose: no slots are offered until hours are set in the admin area.
CREATE TABLE availability_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL CHECK (end_time > start_time)
);

CREATE TABLE blocked_dates (
  date TEXT PRIMARY KEY,
  reason TEXT
);

CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  -- SHA-256 of the private status-link token; the token itself is never stored
  token_hash TEXT NOT NULL,
  service_id TEXT NOT NULL,
  -- Current slot (Israel wall-clock). Changes when an alternative time is proposed.
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  -- Slot the visitor originally asked for
  requested_date TEXT NOT NULL,
  requested_time TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'proposed', 'cancelled')),
  -- Optional message from the admin, shown to the visitor on the status page
  admin_message TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- One active booking per slot. Enforced by the database, so two simultaneous requests can't both win.
CREATE UNIQUE INDEX bookings_active_slot ON bookings (date, time)
  WHERE status IN ('pending', 'approved', 'proposed');
CREATE INDEX bookings_by_date ON bookings (date);
CREATE INDEX bookings_by_ip ON bookings (ip_hash, created_at);
CREATE INDEX bookings_by_phone ON bookings (phone, status);

-- Failed admin logins, for rate limiting.
CREATE TABLE login_attempts (
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX login_attempts_by_ip ON login_attempts (ip_hash, created_at);
