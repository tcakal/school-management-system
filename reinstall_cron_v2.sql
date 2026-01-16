-- Re-install Cron Job (Robust Version)

-- 1. Safe Unschedule (Ignores error if job doesn't exist)
DO $$
BEGIN
    PERFORM cron.unschedule('check-notifications-job');
EXCEPTION WHEN OTHERS THEN
    -- Optimization: Ignore "could not find valid entry" error
    RAISE NOTICE 'Job did not exist, skipping unschedule.';
END $$;

-- 2. Schedule New Job (Every 5 Minutes)
SELECT cron.schedule(
    'check-notifications-job',           
    '*/5 * * * *',                       
    'SELECT check_and_send_notifications()' 
);

-- 3. Verify: Show me the job list now
SELECT jobid, jobname, schedule, active FROM cron.job;

-- 4. Manual Trigger (To confirm Logic works immediately)
SELECT check_and_send_notifications();
