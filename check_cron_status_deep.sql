-- Deep Cron Inspection

-- 1. Check if Extension is active
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 2. List Scheduled Jobs
SELECT * FROM cron.job;

-- 3. Check System-Level Run Details (Why did it fail?)
SELECT jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- 4. Check if we can run it manually (Smoke Test)
SELECT check_and_send_notifications();
