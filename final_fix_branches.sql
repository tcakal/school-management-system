-- Reset RLS for branches to fix "hanging" update issue
-- Run this in Supabase SQL Editor

-- Ensure RLS is enabled
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Drop all likely existing policies to start fresh
DROP POLICY IF EXISTS "Admin full access to branches" ON branches;
DROP POLICY IF EXISTS "Manager view own branch" ON branches;
DROP POLICY IF EXISTS "Manager update own branch" ON branches;
DROP POLICY IF EXISTS "Allow all authenticated users" ON branches;
DROP POLICY IF EXISTS "Allow anon access" ON branches;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON branches;

-- Create a permissive policy for development (Allows Insert/Update/Delete/Select)
CREATE POLICY "Enable all access for authenticated users"
ON branches
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anonymous read access
CREATE POLICY "Enable read access for anon"
ON branches
FOR SELECT
TO anon
USING (true);
