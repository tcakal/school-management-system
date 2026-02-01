-- EMERGENCY FIX: Disable RLS for branches table
-- Use this if updates are still failing or hanging

ALTER TABLE branches DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'branches';
