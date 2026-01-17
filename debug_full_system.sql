-- DEBUG FULL SYSTEM STATUS
-- 1. Check if Cron Job ran recently (Look for start_time around 21:55)
SELECT jobid, runid, start_time, status, return_message 
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 5;

-- 2. Check if Logs exist in DB but are hidden from UI (Row Level Security Check)
-- We use a raw select. If this returns rows but UI doesn't, it's an RLS issue.
SELECT * FROM public.activity_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check System Automation Logs
SELECT * FROM public.notification_logs 
ORDER BY sent_at DESC 
LIMIT 10;

-- 4. Check Database Time again (Just to be sane)
SELECT now() AT TIME ZONE 'UTC' + interval '3 hours' as checks_turkey_time;
