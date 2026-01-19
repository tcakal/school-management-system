-- DEEP DIVE DEBUG
-- 1. Check Teachers - Are they linked? Do they have School IDs?
SELECT 
    name, 
    telegram_chat_id, 
    school_id, 
    CASE WHEN telegram_chat_id IS NOT NULL THEN 'LINKED' ELSE 'UNLINKED' END as status
FROM teachers;

-- 2. Check the "Manual" or "Scheduled" Templates
-- specifically looking at target_roles to ensure 'teacher' is included
SELECT id, message_template, trigger_type, target_roles, school_id 
FROM notification_templates 
WHERE is_active = true;

-- 3. Check recent Logs (Last 10) to see if ANY attempt was made for teachers
SELECT sent_at, recipient_role, recipient_chat_id 
FROM notification_logs 
ORDER BY sent_at DESC 
LIMIT 10;

-- 4. Check School Data (to match IDs)
SELECT id, name FROM schools;
