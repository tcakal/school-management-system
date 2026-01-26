-- NUCLEAR OPTION for Maker & Inventory Permissions
-- This script forcefully ensures that ANYONE (anon/service_role/authenticated) can do ANYTHING to these tables.

BEGIN;

-- 1. MAKER PROJECTS
ALTER TABLE maker_projects DISABLE ROW LEVEL SECURITY;
GRANT ALL ON maker_projects TO anon, authenticated, service_role;

-- 2. MAKER PROJECT STUDENTS
ALTER TABLE maker_project_students DISABLE ROW LEVEL SECURITY;
GRANT ALL ON maker_project_students TO anon, authenticated, service_role;

-- 3. MAKER PROJECT UPDATES
ALTER TABLE maker_project_updates DISABLE ROW LEVEL SECURITY;
GRANT ALL ON maker_project_updates TO anon, authenticated, service_role;

-- 4. MAKER PROJECT DOCUMENTS
ALTER TABLE maker_project_documents DISABLE ROW LEVEL SECURITY;
GRANT ALL ON maker_project_documents TO anon, authenticated, service_role;

-- 5. INVENTORY ITEMS
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
GRANT ALL ON inventory_items TO anon, authenticated, service_role;

-- 6. SEQUENCES (If any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

COMMIT;
