-- Sunday–Thursday 08:30–20:30 (same as the opening hours in src/data/site.ts). Friday and Saturday unchanged.
-- With 90-minute slots: 08:30, 10:00, 11:30, 13:00, 14:30, 16:00, 17:30, 19:00.
DELETE FROM availability_rules WHERE weekday BETWEEN 0 AND 4;
INSERT INTO availability_rules (weekday, start_time, end_time) VALUES
  (0, '08:30', '20:30'), (1, '08:30', '20:30'), (2, '08:30', '20:30'), (3, '08:30', '20:30'), (4, '08:30', '20:30');
