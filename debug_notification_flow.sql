-- DEBUG NOTIFICATION FLOW
-- 1. Check Teachers
SELECT id, name, phone, school_id, telegram_chat_id FROM teachers;

-- 2. Check Active Templates
SELECT id, school_id, trigger_type, trigger_time, target_roles, is_active FROM notification_templates WHERE is_active = true;

-- 3. Check Logs (Who got what?)
SELECT id, recipient_role, sent_at, message_body FROM notification_logs ORDER BY sent_at DESC LIMIT 20;

-- 4. Check System Settings
SELECT telegram_bot_token, admin_chat_id FROM system_settings;
