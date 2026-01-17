-- CLEANUP CRON JOBS
-- We found duplicate jobs (ID 3 and ID 7). We need to remove the old one (ID 3).

-- 1. Unschedule the old 5-minute job
SELECT cron.unschedule(3);

-- 2. Validate that only Job ID 7 remains for 'check_and_send_notifications'
SELECT * FROM cron.job;
