-- Comprehensive Health Check

-- 1. Check Time
SELECT now() AT TIME ZONE 'Europe/Istanbul' as current_time_istanbul;

-- 2. Check Data Existence for Today
SELECT count(*) as count_lessons_today FROM lessons WHERE date = '2026-01-15'::date;
SELECT count(*) as count_templates_active FROM notification_templates WHERE is_active = true;

-- 3. Check Recent Debug Logs (Crucial: Are errors gone?)
SELECT 
    id, 
    log_time AT TIME ZONE 'Europe/Istanbul' as time_tr, 
    message, 
    CAST(details AS TEXT) as details_text 
FROM debug_notification_logs 
ORDER BY id DESC 
LIMIT 10;
