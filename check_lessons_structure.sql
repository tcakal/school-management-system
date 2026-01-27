
SELECT
    table_name, 
    column_name, 
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'lessons' AND column_name IN ('school_id', 'custom_location');
