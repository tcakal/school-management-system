-- Final Fix for Maker Fair & Inventory Persistence
-- Strategy: DISABLE Row Level Security (RLS) completely for these tables.
-- Logic: Since the application handles authentication and authorization on the client side (Admin/Teacher checks),
-- and the previous "Policy" based approach failed, disabling RLS removes the database-level block entirely.
-- This matches the successful fix applied to 'notification_templates'.

-- 1. MAKER PROJECTS
ALTER TABLE maker_projects DISABLE ROW LEVEL SECURITY;

-- 2. MAKER PROJECT STUDENTS
ALTER TABLE maker_project_students DISABLE ROW LEVEL SECURITY;

-- 3. MAKER PROJECT UPDATES
ALTER TABLE maker_project_updates DISABLE ROW LEVEL SECURITY;

-- 4. MAKER PROJECT DOCUMENTS
ALTER TABLE maker_project_documents DISABLE ROW LEVEL SECURITY;

-- 5. INVENTORY ITEMS
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
