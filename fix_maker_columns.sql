-- Fix Missing Columns in Maker Fair Tables

-- 1. Add missing 'maker_fair_date' to maker_projects
ALTER TABLE maker_projects
ADD COLUMN IF NOT EXISTS maker_fair_date TIMESTAMP WITH TIME ZONE;

-- 2. Verify/Add other potentially missing columns just in case
-- maker_project_students table
CREATE TABLE IF NOT EXISTS maker_project_students (
    project_id UUID REFERENCES maker_projects(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, student_id)
);

-- maker_project_updates table
CREATE TABLE IF NOT EXISTS maker_project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES maker_projects(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- maker_project_documents table
CREATE TABLE IF NOT EXISTS maker_project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES maker_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Re-apply permissions just in case table was recreated (though unlikely with IF NOT EXISTS)
ALTER TABLE maker_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE maker_project_documents DISABLE ROW LEVEL SECURITY;

GRANT ALL ON maker_projects TO anon, authenticated, service_role;
GRANT ALL ON maker_project_students TO anon, authenticated, service_role;
GRANT ALL ON maker_project_updates TO anon, authenticated, service_role;
GRANT ALL ON maker_project_documents TO anon, authenticated, service_role;
