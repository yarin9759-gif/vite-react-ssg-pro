-- Sunday–Thursday meetings until 19:00 (was 17:00). Friday and Saturday unchanged.
-- With 90-minute slots: 07:00, 08:30, 10:00, 11:30, 13:00, 14:30, 16:00, 17:30.
UPDATE availability_rules SET end_time = '19:00'
WHERE weekday BETWEEN 0 AND 4 AND start_time = '07:00' AND end_time = '17:00';
