-- DUMP ALL TEMPLATES
SELECT 
    id, 
    trigger_type, 
    trigger_time, 
    is_active, 
    target_roles,
    CASE WHEN school_id IS NULL THEN 'GLOBAL' ELSE 'SCHOOL SPECIFIC' END as scope
FROM public.notification_templates;
