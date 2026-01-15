-- 1. List ALL Lessons for TODAY (15 Jan 2026)
SELECT 
    l.id as lesson_id, 
    l.date, 
    l.start_time, 
    l.end_time,
    l.school_id, 
    s.name as school_name,
    l.class_group_id, 
    cg.name as group_name,
    l.status
FROM lessons l
LEFT JOIN schools s ON l.school_id = s.id
LEFT JOIN class_groups cg ON l.class_group_id = cg.id
WHERE l.date = '2026-01-15'::date;

-- 2. List ALL Active Lesson Templates
-- Replaced t.title with t.message_template
SELECT 
    t.id as template_id, 
    LEFT(t.message_template, 30) as template_preview, 
    t.trigger_type, 
    t.school_id, 
    s.name as school_name,
    t.class_group_id, 
    cg.name as target_group
FROM notification_templates t
LEFT JOIN schools s ON t.school_id = s.id
LEFT JOIN class_groups cg ON t.class_group_id = cg.id
WHERE t.is_active = true 
AND t.trigger_type IN ('lesson_start', 'lesson_end');
