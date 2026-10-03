-- Default meeting hours = the business hours shown on the site (src/data/site.ts):
-- Sunday–Thursday 07:00–17:00, Friday 07:00–13:00, Saturday closed.
-- Editable afterwards in the admin area ("זמינות"). Skipped if hours were already set.
WITH hours (weekday, start_time, end_time) AS (
  VALUES (0, '07:00', '17:00'), (1, '07:00', '17:00'), (2, '07:00', '17:00'),
         (3, '07:00', '17:00'), (4, '07:00', '17:00'), (5, '07:00', '13:00')
)
INSERT INTO availability_rules (weekday, start_time, end_time)
SELECT weekday, start_time, end_time FROM hours
WHERE NOT EXISTS (SELECT 1 FROM availability_rules);
