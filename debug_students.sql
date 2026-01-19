-- DEBUG SCRIPT: Check Student Data
-- Run this in Supabase SQL Editor to see if students exist in the database.

-- 1. Total Count
SELECT 'Total Students' as metric, count(*) as value FROM students;

-- 2. Count by School
SELECT s.name as school_name, count(st.id) as student_count
FROM students st
LEFT JOIN schools s ON st.school_id = s.id
GROUP BY s.name;

-- 3. Last 5 Students Added
SELECT 
    name as student_name, 
    phone, 
    created_at 
FROM students 
ORDER BY created_at DESC 
LIMIT 5;
