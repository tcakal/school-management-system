-- READ TRACE LOGS
-- Shows the internal execution steps of the notification function.
SELECT 
    log_time::time as time, 
    message 
FROM public.debug_trace_logs 
ORDER BY log_time DESC 
LIMIT 50;
