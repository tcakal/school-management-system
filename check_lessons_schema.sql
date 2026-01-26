-- Check lessons table schema and RLS policies
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lessons' AND column_name = 'attachments';

SELECT * FROM pg_policies WHERE tablename = 'lessons';
