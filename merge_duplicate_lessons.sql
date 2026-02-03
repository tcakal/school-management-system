-- Existing duplicate lessons merging logic
-- This script finds lessons with same class_group_id, date, and start_time, 
-- merges their teacher_ids into one, and deletes the duplicates.

DROP TABLE IF EXISTS tmp_merged_lessons;

CREATE TEMP TABLE tmp_merged_lessons AS
WITH duplicate_slots AS (
    SELECT class_group_id, date, start_time
    FROM lessons
    WHERE status = 'scheduled'
    GROUP BY class_group_id, date, start_time
    HAVING COUNT(*) > 1
)
SELECT 
    l.class_group_id, 
    l.date, 
    l.start_time,
    array_agg(DISTINCT t_id) as all_teacher_ids,
    min(l.id::text)::uuid as primary_lesson_id
FROM lessons l
JOIN duplicate_slots d ON l.class_group_id = d.class_group_id AND l.date = d.date AND l.start_time = d.start_time
CROSS JOIN unnest(l.teacher_ids) as t_id
WHERE l.status = 'scheduled'
GROUP BY l.class_group_id, l.date, l.start_time;

-- Update the primary lesson with merged teacher_ids
UPDATE lessons
SET teacher_ids = m.all_teacher_ids
FROM tmp_merged_lessons m
WHERE lessons.id = m.primary_lesson_id;

-- Delete the non-primary duplicate lessons
DELETE FROM lessons
WHERE id IN (
    SELECT l.id
    FROM lessons l
    JOIN tmp_merged_lessons m ON l.class_group_id = m.class_group_id AND l.date = m.date AND l.start_time = m.start_time
    WHERE l.id != m.primary_lesson_id
    AND l.status = 'scheduled'
);

DROP TABLE tmp_merged_lessons;
