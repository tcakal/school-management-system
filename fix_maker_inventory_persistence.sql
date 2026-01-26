-- Fix Persistence for Maker Fair & Inventory
-- The app uses custom auth (anon role). We need to explicitly allow 'anon' to read/write to these tables.

-- 1. MAKER PROJECTS
ALTER TABLE maker_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Maker Projects full access" ON maker_projects;
CREATE POLICY "Maker Projects full access" ON maker_projects FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. MAKER PROJECT STUDENTS
ALTER TABLE maker_project_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Maker Students full access" ON maker_project_students;
CREATE POLICY "Maker Students full access" ON maker_project_students FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. MAKER PROJECT UPDATES
ALTER TABLE maker_project_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Maker Updates full access" ON maker_project_updates;
CREATE POLICY "Maker Updates full access" ON maker_project_updates FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. MAKER PROJECT DOCUMENTS
ALTER TABLE maker_project_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Maker Docs full access" ON maker_project_documents;
CREATE POLICY "Maker Docs full access" ON maker_project_documents FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. INVENTORY ITEMS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inventory full access" ON inventory_items;
CREATE POLICY "Inventory full access" ON inventory_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. Ensure 'anon' can USAGE sequences if serial IDs are used (though UUIDs are preferred)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
