-- Check Server Time vs Local Time assumption
SELECT 
    now() as server_now_utc,
    now() AT TIME ZONE 'Europe/Istanbul' as server_now_istanbul,
    current_setting('TIMEZONE') as db_timezone;

-- Check if Cron is actually running (requires access to cron schema)
-- WARNING: You might not have permission to view cron.job_run_details, 
-- if this errors, ignore it and look at the logs table.
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;

-- Check Notification Logs (Did it try to send anything?)
SELECT * FROM public.notification_logs ORDER BY sent_at DESC LIMIT 10;

-- count active templates
SELECT count(*) as active_templates_count FROM public."NotificationTemplates" WHERE "isActive" = true;
