-- FIX RLS VISIBILITY V3 (FINAL)
-- Run this in Supabase SQL Editor.

-- The previous version failed because 'b.school_id' didn't exist.
-- Also, we discovered that Managers are linked via 'branches.manager_id', 
-- not necessarily 'teachers.school_id'.

CREATE OR REPLACE FUNCTION get_accessible_school_ids()
RETURNS TABLE (id UUID) LANGUAGE sql STABLE AS $$
  -- 1. Direct school assignment (if any)
  SELECT school_id FROM teachers WHERE id = auth.uid() AND school_id IS NOT NULL
  UNION
  -- 2. Direct branch assignment (if any)
  SELECT branch_id FROM teachers WHERE id = auth.uid() AND branch_id IS NOT NULL
  UNION
  -- 3. Branches I manage directly (via branches table)
  --    This allows me to see data linked to the Branch ID itself.
  SELECT id FROM branches WHERE manager_id = auth.uid()
  UNION
  -- 4. Schools I manage directly (via schools table)
  --    (Fallback for main school managers)
  --    Note: schools table links via UUID or Email? 
  --    Assuming schools might not have manager_id column, we skip if uncertain, 
  --    but normally we rely on teachers table. 
  --    For safety, we stick to teachers and branches tables.
  SELECT id FROM schools WHERE id IN (SELECT school_id FROM teachers WHERE id = auth.uid())
;
$$;

-- Refresh policies
DROP POLICY IF EXISTS "Class Groups Access" ON class_groups;
CREATE POLICY "Class Groups Access" ON class_groups FOR ALL USING (
    (select get_current_user_role()) = 'admin'
    OR
    school_id IN (select id from get_accessible_school_ids())
);

DROP POLICY IF EXISTS "Teacher Assignments Access" ON teacher_assignments;
CREATE POLICY "Teacher Assignments Access" ON teacher_assignments FOR ALL USING (
   (select get_current_user_role()) = 'admin'
   OR
   school_id IN (select id from get_accessible_school_ids())
   OR
   teacher_id = auth.uid()
);
