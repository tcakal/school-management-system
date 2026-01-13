ALTER TABLE students 
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS medical_notes TEXT,
ADD COLUMN IF NOT EXISTS grade_level TEXT;

-- Ensure RLS allows inserts for authenticated users
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON students;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON students;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON students;

CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON students FOR UPDATE USING (auth.role() = 'authenticated');
