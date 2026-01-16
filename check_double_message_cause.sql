-- Diagnose Double Message Cause

-- 1. Check for DUPLICATE Templates
-- Do we have multiple active templates with the same trigger type and offset?
SELECT 
    id, 
    trigger_type, 
    offset_minutes, 
    school_id, 
    class_group_id, 
    target_roles,
    message_template 
FROM notification_templates 
WHERE is_active = true 
ORDER BY trigger_type, offset_minutes;

-- 2. Check where your Chat ID appears
-- Replace this ID with the one you are seeing in the logs or your known ID
-- For now, I will list ALL chat IDs in the system to see if there are duplicates
SELECT 'Admin' as role, admin_chat_id as chat_id FROM system_settings
UNION ALL
SELECT 'Teacher (' || name || ')', telegram_chat_id FROM teachers WHERE telegram_chat_id IS NOT NULL
UNION ALL
SELECT 'Student (' || first_name || ' ' || last_name || ')', telegram_chat_id FROM students WHERE telegram_chat_id IS NOT NULL;
