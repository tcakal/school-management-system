-- DEBUG TIMEZONE & AUTOMATION

SELECT 
    now() as server_utc_time,
    (now() AT TIME ZONE 'UTC' + interval '3 hours') as calculated_turkey_time,
    to_char((now() AT TIME ZONE 'UTC' + interval '3 hours'), 'YYYY-MM-DD HH24:MI:SS') as turkey_time_formatted;

-- Check if the New Job (ID 7) ran yet?
SELECT jobid, runid, start_time, status, return_message 
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 5;

-- Check latest Notification logs
SELECT * FROM public.notification_logs ORDER BY sent_at DESC LIMIT 5;
