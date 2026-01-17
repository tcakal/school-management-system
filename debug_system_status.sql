
-- CHECK: Are there ANY logs?
SELECT count(*) as total_logs, max(log_time) as last_log FROM public.debug_trace_logs;

-- CHECK: Is the Cron Job scheduled?
SELECT * FROM cron.job;

-- CHECK: recent Run History (Errors?)
-- Note: 'cron.job_run_details' might require privileges, but let's try.
SELECT jobid, runid, database, status, return_message, start_time, end_time 
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 5;

-- TEST: Manual Run
-- This will force a run and should definitely create a log entry if the function works.
SELECT check_and_send_notifications();

-- CHECK AGAIN after manual run
SELECT * FROM public.debug_trace_logs ORDER BY log_time DESC LIMIT 5;
