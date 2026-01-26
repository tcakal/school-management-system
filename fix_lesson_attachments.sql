-- Fix Lesson Attachments Persistence
-- 1. Ensure 'attachments' column exists in 'lessons' table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 2. Ensure RLS policies allow 'anon' role (which the app uses for Logic) to UPDATE lessons
-- Specifically, we need to ensure teachers can update the lessons they are assigned to.

-- Drop existing restrictive update policy if exists (to be safe and replace it)
DROP POLICY IF EXISTS "Lessons updatable by teachers" ON lessons;
DROP POLICY IF EXISTS "Lessons updatable by everyone" ON lessons;

-- Create a permissive update policy for 'anon' (since app handles auth logic)
-- or restricted to the specific lesson teacher if we want to be stricter, 
-- but consistent with current "anon" architecture:

CREATE POLICY "Lessons updatable by everyone" ON lessons
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Also ensure Insert is allowed if not already
CREATE POLICY "Lessons insertable by everyone" ON lessons
FOR INSERT
WITH CHECK (true);
