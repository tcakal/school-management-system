-- Transaction not needed for SELECT
-- 1. Check Lessons for TODAY (2026-01-15)
SELECT id, date, start_time, school_id, class_group_id, status 
FROM lessons 
WHERE date = '2026-01-15'::date;

-- 2. Check Active Lesson Templates
SELECT id, title, school_id, class_group_id, trigger_type 
FROM notification_templates 
WHERE is_active = true 
AND trigger_type IN ('lesson_start', 'lesson_end');

-- 3. Check School Names (to match IDs)
SELECT id, name FROM schools;

-- 4. Check Group Names
SELECT id, name, school_id FROM class_groups;
