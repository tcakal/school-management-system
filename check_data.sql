
SELECT count(*) as student_count FROM students;
SELECT id, name FROM classes;
SELECT id, title, class_id, teacher_id, start_time FROM lessons WHERE teacher_id = '1' LIMIT 5;
SELECT * FROM students WHERE class_id IN (SELECT class_id FROM lessons WHERE teacher_id = '1');
