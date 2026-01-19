-- Find the school ID first
WITH target_school AS (
    SELECT id, name FROM schools WHERE name = 'Gebze Emlak Konut İlkokulu' LIMIT 1
)
-- Check counts of related tables
SELECT 
    (SELECT name FROM target_school) as school_name,
    (SELECT count(*) FROM students WHERE school_id = (SELECT id FROM target_school)) as student_count,
    (SELECT count(*) FROM class_groups WHERE school_id = (SELECT id FROM target_school)) as class_count,
    (SELECT count(*) FROM payments WHERE school_id = (SELECT id FROM target_school)) as payment_count,
    (SELECT count(*) FROM lessons WHERE school_id = (SELECT id FROM target_school)) as lesson_count,
    (SELECT count(*) FROM teacher_assignments WHERE school_id = (SELECT id FROM target_school)) as assignment_count,
    (SELECT count(*) FROM notification_templates WHERE school_id = (SELECT id FROM target_school)) as template_count;
