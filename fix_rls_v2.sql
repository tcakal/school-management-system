-- FIX RLS VISIBILITY V2
-- Run this in Supabase SQL Editor.

-- 1. Create a smarter helper to get ALL accessible school IDs
-- This now includes the PARENT SCHOOL of any branch you manage.
CREATE OR REPLACE FUNCTION get_accessible_school_ids()
RETURNS TABLE (id UUID) LANGUAGE sql STABLE AS $$
  -- 1. Direct school assignment
  SELECT school_id FROM teachers WHERE id = auth.uid()
  UNION
  -- 2. Direct branch assignment
  SELECT branch_id FROM teachers WHERE id = auth.uid() AND branch_id IS NOT NULL
  UNION
  -- 3. If assigned to a Branch (either via school_id or branch_id), 
  --    also grant access to the Parent School ID (so you can see Classes linked to Main School)
  SELECT b.school_id 
  FROM branches b
  JOIN teachers t ON (t.school_id = b.id OR t.branch_id = b.id)
  WHERE t.id = auth.uid();
$$;

-- 2. Force refresh of policies to use the new function logic
-- (No need to drop/recreate policies if they already use get_accessible_school_ids(), 
--  but we can explicitly verify/reload if needed. The function replacement is usually enough.)

-- Just in case, let's re-apply the Class Groups policy to be sure
DROP POLICY IF EXISTS "Class Groups Access" ON class_groups;
CREATE POLICY "Class Groups Access" ON class_groups FOR ALL USING (
    (select get_current_user_role()) = 'admin'
    OR
    school_id IN (select id from get_accessible_school_ids())
);
