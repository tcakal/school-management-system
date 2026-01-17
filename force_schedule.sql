-- FORCE SCHEDULE (CLEAN)
-- Skip specific ID errors. Just make sure it runs.

-- 1. Try to unschedule by name (Safest, usually doesn't error if not found, but returns boolean)
SELECT cron.unschedule('check_notifications_job');

-- 2. Create the schedule freshly
SELECT cron.schedule('check_notifications_job', '* * * * *', 'SELECT check_and_send_notifications()');

-- 3. Confirm
SELECT * FROM cron.job;
