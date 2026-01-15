-- 1. Check Settings (Is Admin ID set properly?)
SELECT 
    system_name, 
    COALESCE(telegram_bot_token, 'NULL') as bot_token_status, 
    COALESCE(admin_chat_id, 'NULL') as admin_chat_id_status 
FROM system_settings;

-- 2. Clear 'Already Sent' logs for today so we can RETRY immediately
DELETE FROM notification_logs 
WHERE sent_at > (now() - interval '1 day');

-- 3. Run the check manually (to force a send NOW)
SELECT check_and_send_notifications();

-- 4. Check the debug logs immediately
SELECT 
    log_time AT TIME ZONE 'Europe/Istanbul' as log_time_tr, 
    message, 
    details 
FROM debug_notification_logs 
ORDER BY id DESC 
LIMIT 10;
