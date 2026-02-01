-- FIX BRANCH MANAGER VISIBILITY
-- Run this in Supabase SQL Editor to restore access to Branch data.

-- 1. Create a helper to get ALL accessible school IDs (Main School + Branch)
CREATE OR REPLACE FUNCTION get_accessible_school_ids()
RETURNS TABLE (id UUID) LANGUAGE sql STABLE AS $$
  SELECT school_id FROM teachers WHERE id = auth.uid()
  UNION
  SELECT branch_id FROM teachers WHERE id = auth.uid() AND branch_id IS NOT NULL;
$$;

-- 2. Update Class Groups Policy
DROP POLICY IF EXISTS "Class Groups Access" ON class_groups;
CREATE POLICY "Class Groups Access" ON class_groups FOR ALL USING (
    (select get_current_user_role()) = 'admin'
    OR
    school_id IN (select id from get_accessible_school_ids())
);

-- 3. Update Lessons Policy
DROP POLICY IF EXISTS "Lessons Access" ON lessons;
CREATE POLICY "Lessons Access" ON lessons FOR ALL USING (
    (select get_current_user_role()) = 'admin'
    OR
    school_id IN (select id from get_accessible_school_ids())
    OR
    teacher_id = auth.uid()
);

-- 4. Update Students Access
DROP POLICY IF EXISTS "Students Access" ON students;
CREATE POLICY "Students Access" ON students FOR ALL USING (
    (select get_current_user_role()) = 'admin'
    OR
    school_id IN (select id from get_accessible_school_ids())
);

-- 5. Update Teacher Assignments Access (if RLS is enabled)
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teacher Assignments Access" ON teacher_assignments;
CREATE POLICY "Teacher Assignments Access" ON teacher_assignments FOR ALL USING (
   (select get_current_user_role()) = 'admin'
   OR
   school_id IN (select id from get_accessible_school_ids())
   OR
   teacher_id = auth.uid()
);

-- Verify
SELECT * FROM pg_policies WHERE tablename = 'class_groups';
