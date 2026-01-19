-- Add Maker Fair Date to Schools
ALTER TABLE schools ADD COLUMN IF NOT EXISTS maker_fair_date DATE;

-- Maker Projects Table
CREATE TABLE IF NOT EXISTS maker_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID -- ID of the creator (teacher/admin)
);

-- Maker Project Students (Many-to-Many)
CREATE TABLE IF NOT EXISTS maker_project_students (
    project_id UUID REFERENCES maker_projects(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, student_id)
);

-- Maker Project Updates (Weekly logs)
CREATE TABLE IF NOT EXISTS maker_project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES maker_projects(id) ON DELETE CASCADE,
    week_number INTEGER,
    title TEXT,
    content TEXT,
    requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maker Project Documents
CREATE TABLE IF NOT EXISTS maker_project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES maker_projects(id) ON DELETE CASCADE,
    title TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE maker_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_documents ENABLE ROW LEVEL SECURITY;

-- Policies for maker_projects
DROP POLICY IF EXISTS "Enable read access for all users" ON maker_projects;
CREATE POLICY "Enable read access for all users" ON maker_projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for teachers and admins" ON maker_projects;
CREATE POLICY "Enable insert for teachers and admins" ON maker_projects FOR INSERT WITH CHECK (true); -- Ideally restrict by school authentication logic in app

DROP POLICY IF EXISTS "Enable update for teachers and admins" ON maker_projects;
CREATE POLICY "Enable update for teachers and admins" ON maker_projects FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for teachers and admins" ON maker_projects;
CREATE POLICY "Enable delete for teachers and admins" ON maker_projects FOR DELETE USING (true);

-- Policies for maker_project_students
DROP POLICY IF EXISTS "Enable read access for all users" ON maker_project_students;
CREATE POLICY "Enable read access for all users" ON maker_project_students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for teachers and admins" ON maker_project_students;
CREATE POLICY "Enable all access for teachers and admins" ON maker_project_students FOR ALL USING (true);

-- Policies for maker_project_updates
DROP POLICY IF EXISTS "Enable read access for all users" ON maker_project_updates;
CREATE POLICY "Enable read access for all users" ON maker_project_updates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for teachers and admins" ON maker_project_updates;
CREATE POLICY "Enable all access for teachers and admins" ON maker_project_updates FOR ALL USING (true);

-- Policies for maker_project_documents
DROP POLICY IF EXISTS "Enable read access for all users" ON maker_project_documents;
CREATE POLICY "Enable read access for all users" ON maker_project_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for teachers and admins" ON maker_project_documents;
CREATE POLICY "Enable all access for teachers and admins" ON maker_project_documents FOR ALL USING (true);

-- Storage bucket for maker fair documents (reuse school-assets or create new?)
-- Let's reuse 'school-assets' for now or create 'maker-fair-documents' if better isolation needed.
-- Creating a specific bucket is cleaner.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maker-fair-assets', 'maker-fair-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy
CREATE POLICY "Give public access to maker fair assets" ON storage.objects FOR SELECT USING (bucket_id = 'maker-fair-assets');
CREATE POLICY "Enable upload for everyone" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'maker-fair-assets');
CREATE POLICY "Enable update for everyone" ON storage.objects FOR UPDATE USING (bucket_id = 'maker-fair-assets');
CREATE POLICY "Enable delete for everyone" ON storage.objects FOR DELETE USING (bucket_id = 'maker-fair-assets');
