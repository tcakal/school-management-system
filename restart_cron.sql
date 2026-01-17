-- RESTART CRON JOB FORCEFULLY
-- The job appears active but is not running. We will remove it and re-add it.

-- 1. Unschedule ALL instances of our job (just in case)
SELECT cron.unschedule('check_notifications_job');
SELECT cron.unschedule(7); -- Also try ID directly if known

-- 2. Wait a moment (simulated by separate statement order) and Re-Schedule
-- Running every minute: * * * * *
SELECT cron.schedule('check_notifications_job', '* * * * *', 'SELECT check_and_send_notifications()');

-- 3. Verify it's back
SELECT * FROM cron.job;
