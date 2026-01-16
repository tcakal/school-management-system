-- Check if logs actually exist in the DB
SELECT count(*) as total_logs FROM debug_notification_logs;

-- Check last 5 logs
SELECT id, log_time, message 
FROM debug_notification_logs 
ORDER BY id DESC 
LIMIT 5;

-- Check RLS Policies on the log table
SELECT * FROM pg_policies WHERE tablename = 'debug_notification_logs';
