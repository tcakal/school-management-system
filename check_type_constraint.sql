
SELECT
    pg_attribute.attname AS column_name,
    format_type(pg_attribute.atttypid, pg_attribute.atttypmod) AS data_type,
    pg_get_constraintdef(pg_constraint.oid) AS constraint_definition
FROM pg_attribute
LEFT JOIN pg_constraint ON pg_constraint.conrelid = pg_attribute.attrelid AND pg_attribute.attnum = ANY(pg_constraint.conkey)
WHERE pg_attribute.attrelid = 'lessons'::regclass
AND pg_attribute.attname = 'type';
