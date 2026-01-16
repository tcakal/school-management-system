-- Check Active Templates and their Targets
SELECT 
    id, 
    trigger_type, 
    offset_minutes, 
    left(message_template, 30) as msg_preview, 
    target_roles 
FROM notification_templates 
WHERE is_active = true;
