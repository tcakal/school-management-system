-- CHECK CRON HISTORY ONLY
-- Focuses on finding out if the job actually ran at the expected minutes.

SELECT 
    jobid,
    runid,
    to_char(start_time, 'YYYY-MM-DD HH24:MI:SS') as start_time_utc,
    status,
    return_message
FROM cron.job_run_details 
WHERE start_time > (now() AT TIME ZONE 'UTC' - interval '45 minutes')
ORDER BY start_time DESC;

-- Also check if the job is still active
SELECT * FROM cron.job;
