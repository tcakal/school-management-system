-- Re-install Cron Job Forcefully

-- 1. Remove any existing job with this name (Clean Slate)
SELECT cron.unschedule('check-notifications-job');

-- 2. Schedule New Job (Every 5 Minutes)
SELECT cron.schedule(
    'check-notifications-job',           -- Unique Job Name
    '*/5 * * * *',                       -- Schedule: Every 5th minute
    'SELECT check_and_send_notifications()' -- Function to run
);

-- 3. Verify: Show me the job list now
SELECT jobid, schedule, command, active FROM cron.job;

-- 4. Manual Trigger Validation
-- Run one more time manually to populate logs IMMEDIATELY so we can debug right now
SELECT check_and_send_notifications();
