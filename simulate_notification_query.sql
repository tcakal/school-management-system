-- Diagnose WHY the lesson is not matched
-- We'll select the Lesson and the Template side-by-side

WITH my_lesson AS (
    SELECT id, school_id, class_group_id, start_time 
    FROM lessons 
    WHERE date = '2026-01-15'::date 
    LIMIT 1
),
my_template AS (
    SELECT id, school_id, class_group_id, trigger_type 
    FROM notification_templates 
    WHERE is_active = true AND trigger_type IN ('lesson_start', 'lesson_end') 
    LIMIT 1
)
SELECT 
    'Comparison' as check_type,
    l.school_id as "Dersin Okulu",
    t.school_id as "Şablonun Okulu",
    CASE WHEN l.school_id = t.school_id THEN '✅ Eşleşti' ELSE '❌ UYUMSUZ' END as "Okul Durumu",
    
    l.class_group_id as "Dersin Grubu",
    t.class_group_id as "Şablonun Grubu",
    CASE 
        WHEN t.class_group_id IS NULL THEN '✅ Genel Şablon (Herkes)'
        WHEN l.class_group_id = t.class_group_id THEN '✅ Eşleşti' 
        ELSE '❌ UYUMSUZ' 
    END as "Grup Durumu"
FROM my_lesson l
CROSS JOIN my_template t;
