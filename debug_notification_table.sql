-- DEBUG NOTIFICATION LOGIC (TABLE OUTPUT)
-- This script returns a table of what the system IS SEEING right now.

WITH calculated_time AS (
    SELECT (now() AT TIME ZONE 'UTC' + interval '8 hours') as turkey_time
),
active_templates AS (
    SELECT * FROM public.notification_templates WHERE is_active = true
),
lessons_to_check AS (
    SELECT l.*, g.name as class_name 
    FROM public.lessons l
    JOIN public.class_groups g ON l.class_group_id = g.id
    WHERE l.status != 'cancelled'
    AND l.date::date >= CURRENT_DATE - 1 
    AND l.date::date <= CURRENT_DATE + 1
)
SELECT 
    to_char(ct.turkey_time, 'YYYY-MM-DD HH24:MI:SS') as SYSTEM_TIME_TURKEY,
    t.trigger_type as TEMPLATE_TYPE,
    t.trigger_time as FIXED_TIME_TRIGGER,
    l.date || ' ' || l.start_time as LESSON_START,
    (l.date || ' ' || l.start_time)::timestamp + (t.offset_minutes || ' minutes')::interval as TARGET_SEND_TIME,
    EXTRACT(EPOCH FROM (ct.turkey_time - ((l.date || ' ' || l.start_time)::timestamp + (t.offset_minutes || ' minutes')::interval))) / 60 as DIFF_MINUTES,
    CASE 
        WHEN (EXTRACT(EPOCH FROM (ct.turkey_time - ((l.date || ' ' || l.start_time)::timestamp + (t.offset_minutes || ' minutes')::interval))) / 60) BETWEEN 0 AND 2 THEN '✅ SENDING NOW'
        ELSE 'WAITING' 
    END as STATUS
FROM active_templates t
CROSS JOIN calculated_time ct
LEFT JOIN lessons_to_check l ON t.trigger_type IN ('lesson_start', 'lesson_end', '15_min_before', 'last_lesson_end')
WHERE t.trigger_type != 'fixed_time' -- Focus on Lesson triggers first for rows

UNION ALL

-- Fixed Time Triggers
SELECT 
    to_char(ct.turkey_time, 'YYYY-MM-DD HH24:MI:SS'),
    t.trigger_type,
    t.trigger_time,
    NULL, -- No lesson
    NULL, -- No target calc
    NULL, -- No Diff
    CASE 
        WHEN to_char(ct.turkey_time, 'HH24:MI') = t.trigger_time THEN '✅ SENDING NOW'
        ELSE 'WAITING (Current: ' || to_char(ct.turkey_time, 'HH24:MI') || ')'
    END
FROM active_templates t
CROSS JOIN calculated_time ct
WHERE t.trigger_type = 'fixed_time'

ORDER BY STATUS DESC;
