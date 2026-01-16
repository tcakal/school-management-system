-- Fetch the full error message
SELECT id, log_time, message, details 
FROM debug_notification_logs 
WHERE message = 'Error in Loop'
ORDER BY id DESC 
LIMIT 1;
