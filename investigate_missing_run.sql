-- INVESTIGATE MISSED RUN (21:55)

-- 1. CRON HISTORY: Did it run at 21:55?
SELECT 
    start_time, 
    status, 
    return_message, 
    end_time 
FROM cron.job_run_details 
WHERE start_time >= (now() - interval '30 minutes') -- Check last 30 mins
ORDER BY start_time DESC;

-- 2. DB LOGS: Did it write to DB?
SELECT created_at, action, details 
FROM public.activity_logs 
WHERE created_at >= (now() - interval '30 minutes')
ORDER BY created_at DESC;

-- 3. SERVER LOGS
SELECT sent_at, message_body, status 
FROM public.notification_logs 
WHERE sent_at >= (now() - interval '30 minutes')
ORDER BY sent_at DESC;
