SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('lessons', 'teacher_assignments');

SELECT * FROM pg_policies WHERE tablename IN ('lessons', 'teacher_assignments');
