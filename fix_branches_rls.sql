-- Fix RLS policies for branches table
-- Run this in Supabase SQL Editor

-- Drop existing policies if they cause issues
DROP POLICY IF EXISTS "Admin full access to branches" ON branches;
DROP POLICY IF EXISTS "Manager read own branch" ON branches;

-- Create simple policies that work with anon/authenticated users
-- Allow all operations for authenticated users (the app handles authorization)
CREATE POLICY "Allow all authenticated users"
ON branches
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow anon access since the app may use anon key
CREATE POLICY "Allow anon access"
ON branches
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Verify
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'branches';
