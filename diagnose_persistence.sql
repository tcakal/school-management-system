-- Diagnose Maker Fair and Inventory Tables
-- Check if tables exist and what permissions they have

SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('maker_projects', 'maker_project_students', 'inventory_items');

SELECT * FROM pg_policies 
WHERE tablename IN ('maker_projects', 'maker_project_students', 'inventory_items');
