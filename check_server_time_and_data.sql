-- Diagnostics for Time and Data

-- 1. Server Time Settings
SELECT current_setting('TIMEZONE') as server_timezone;

-- 2. Time Comparison
SELECT 
    now() as raw_now, 
    now() AT TIME ZONE 'Europe/Istanbul' as manual_istanbul_conversion,
    current_timestamp as current_ts;

-- 3. Check the Lesson Data (User said they added one 5 mins ago, so it's likely the latest ID)
SELECT l.id, l.date, l.start_time, l.created_at 
FROM lessons l 
ORDER BY l.created_at DESC 
LIMIT 1;

-- 4. Check the Template Offsets
SELECT id, trigger_type, offset_minutes, message_template 
FROM notification_templates 
WHERE is_active = true;
