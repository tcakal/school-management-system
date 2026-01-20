-- MASTER CHECK SCRIPT
-- Runs safely to ensure all tables exist.
-- Ignored if they already exist.

-- 1. MAKER FAIR TABLES & COLUMNS
ALTER TABLE schools ADD COLUMN IF NOT EXISTS maker_fair_date DATE;

CREATE TABLE IF NOT EXISTS maker_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    maker_fair_date DATE, -- This was the missing column
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

CREATE TABLE IF NOT EXISTS maker_project_students (
    project_id UUID REFERENCES maker_projects(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, student_id)
);

CREATE TABLE IF NOT EXISTS maker_project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES maker_projects(id) ON DELETE CASCADE,
    week_number INTEGER,
    title TEXT,
    content TEXT,
    requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maker_project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES maker_projects(id) ON DELETE CASCADE,
    title TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maker Fair RLS
ALTER TABLE maker_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_documents ENABLE ROW LEVEL SECURITY;

-- Maker Fair Policies (Drop to ensure update)
DROP POLICY IF EXISTS "Enable read access for all users" ON maker_projects;
CREATE POLICY "Enable read access for all users" ON maker_projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for teachers and admins" ON maker_projects;
CREATE POLICY "Enable insert for teachers and admins" ON maker_projects FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for teachers and admins" ON maker_projects;
CREATE POLICY "Enable update for teachers and admins" ON maker_projects FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for teachers and admins" ON maker_projects;
CREATE POLICY "Enable delete for teachers and admins" ON maker_projects FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON maker_project_students;
CREATE POLICY "Enable read access for all users" ON maker_project_students FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all access for teachers and admins" ON maker_project_students;
CREATE POLICY "Enable all access for teachers and admins" ON maker_project_students FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON maker_project_updates;
CREATE POLICY "Enable read access for all users" ON maker_project_updates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all access for teachers and admins" ON maker_project_updates;
CREATE POLICY "Enable all access for teachers and admins" ON maker_project_updates FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON maker_project_documents;
CREATE POLICY "Enable read access for all users" ON maker_project_documents FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all access for teachers and admins" ON maker_project_documents;
CREATE POLICY "Enable all access for teachers and admins" ON maker_project_documents FOR ALL USING (true);

-- 2. STORAGE (Maker Fair)
INSERT INTO storage.buckets (id, name, public) VALUES ('maker-fair-assets', 'maker-fair-assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Give public access to maker fair assets" ON storage.objects;
CREATE POLICY "Give public access to maker fair assets" ON storage.objects FOR SELECT USING (bucket_id = 'maker-fair-assets');
DROP POLICY IF EXISTS "Enable upload for everyone" ON storage.objects;
CREATE POLICY "Enable upload for everyone" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'maker-fair-assets');
DROP POLICY IF EXISTS "Enable update for everyone" ON storage.objects;
CREATE POLICY "Enable update for everyone" ON storage.objects FOR UPDATE USING (bucket_id = 'maker-fair-assets');
DROP POLICY IF EXISTS "Enable delete for everyone" ON storage.objects;
CREATE POLICY "Enable delete for everyone" ON storage.objects FOR DELETE USING (bucket_id = 'maker-fair-assets');

-- 3. INVENTORY TABLES
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    category TEXT, 
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.inventory_items;
CREATE POLICY "Enable read access for authenticated users" ON public.inventory_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.inventory_items;
CREATE POLICY "Enable insert for authenticated users" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.inventory_items;
CREATE POLICY "Enable update for authenticated users" ON public.inventory_items FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.inventory_items;
CREATE POLICY "Enable delete for authenticated users" ON public.inventory_items FOR DELETE TO authenticated USING (true);

-- Grant permissions for inventory
GRANT ALL ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
