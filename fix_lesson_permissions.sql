-- 1. Fix Lessons RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop restrictive policies
DROP POLICY IF EXISTS "Enable update for teachers" ON lessons;
DROP POLICY IF EXISTS "Enable update for own lessons" ON lessons;
DROP POLICY IF EXISTS "Enable update for authorized teachers" ON lessons;

-- Create new comprehensive update policy for lessons
CREATE POLICY "Enable update for authorized teachers" ON lessons
FOR UPDATE TO authenticated
USING (
    -- 1. Own lesson
    auth.uid() = teacher_id 
    OR 
    -- 2. Assigned to class group
    EXISTS (
        SELECT 1 FROM teacher_assignments ta
        WHERE ta.teacher_id = auth.uid() 
        AND ta.class_group_id = lessons.class_group_id
    )
    OR
    -- 3. Admin/Manager check (optional but safest if policies exist for schools)
    EXISTS (
        SELECT 1 FROM schools s 
        WHERE s.id = lessons.school_id 
        AND s.created_by = auth.uid()
    )
);

-- 2. Ensure Teacher Assignments is Readable
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for authenticated" ON teacher_assignments;
CREATE POLICY "Enable read for authenticated" ON teacher_assignments
FOR SELECT TO authenticated
USING (true);
