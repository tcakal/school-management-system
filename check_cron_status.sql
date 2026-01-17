-- Check Scheduled Jobs
SELECT * FROM cron.job;

-- Check Job Run Details (Last 10 runs)
-- Note: 'cron.job_run_details' helps us see if it failed or succeeded.
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Check Generated Logs
SELECT * FROM public.notification_logs ORDER BY sent_at DESC LIMIT 5;
SELECT * FROM public.activity_logs WHERE user_id = 'system-auto' ORDER BY created_at DESC LIMIT 5;
