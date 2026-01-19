-- CHECK TEACHER DATA INTEGRITY
SELECT 
    t.name, 
    t.telegram_chat_id, 
    t.school_id, 
    s.name as school_name
FROM teachers t
LEFT JOIN schools s ON t.school_id = s.id;

-- CHECK ASSIGNMENTS (Source of Truth)
SELECT 
    t.name as teacher_name, 
    s.name as assigned_school_name,
    ta.school_id as assignment_school_id
FROM teacher_assignments ta
JOIN teachers t ON ta.teacher_id = t.id
JOIN schools s ON ta.school_id = s.id;
