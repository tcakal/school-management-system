-- Run this in Supabase SQL Editor to see the logs
-- even if the Website UI hasn't updated yet.

SELECT 
    log_time AT TIME ZONE 'Europe/Istanbul' as log_time_tr, 
    message, 
    details 
FROM debug_notification_logs 
ORDER BY id DESC 
LIMIT 20;
