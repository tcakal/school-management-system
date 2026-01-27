
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('schools', 'class_groups', 'lessons') 
ORDER BY table_name, ordinal_position;
