-- DIAGNOSTICS AS A TABLE (Visible Results)
WITH vars AS (
    SELECT 
        (now() AT TIME ZONE 'UTC' + interval '3 hours') as checking_time,
        (SELECT admin_chat_id FROM public.system_settings LIMIT 1) as sys_admin_id
)
SELECT 
    t.id as template_id,
    t.trigger_time,
    to_char(v.checking_time, 'HH24:MI') as system_time_now,
    CASE 
        WHEN t.trigger_time = to_char(v.checking_time, 'HH24:MI') THEN 'MATCH!' 
        ELSE 'WAITING' 
    END as status,
    t.target_roles as roles_json,
    CASE
        -- Admin Check
        WHEN t.target_roles @> '["admin"]'::jsonb THEN 
            CASE WHEN v.sys_admin_id IS NOT NULL THEN 'ADMIN_OK' ELSE 'FAIL: ADMIN ID NULL' END
        
        -- Teacher Check
        WHEN t.target_roles @> '["teacher"]'::jsonb THEN
            (SELECT 'TEACHERS FOUND: ' || count(*) FROM public.teachers WHERE telegram_chat_id IS NOT NULL AND (t.school_id IS NULL OR school_id = t.school_id))
            
        -- Student Check
        WHEN t.target_roles @> '["student"]'::jsonb THEN
            (SELECT 'STUDENTS FOUND: ' || count(*) FROM public.students WHERE telegram_chat_id IS NOT NULL AND (t.school_id IS NULL OR school_id = t.school_id))
            
        ELSE 'UNKNOWN ROLE'
    END as logic_check
FROM public.notification_templates t, vars v
WHERE t.is_active = true AND t.trigger_type = 'fixed_time'
ORDER BY t.trigger_time ASC;
