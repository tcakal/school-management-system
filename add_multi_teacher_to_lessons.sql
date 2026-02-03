-- SUPPORT MULTIPLE TEACHERS PER LESSON
-- Run this in Supabase SQL Editor.

-- 1. Add teacher_ids column as UUID array
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS teacher_ids UUID[] DEFAULT '{}';

-- 2. Migrate existing teacher_id to the new array for all records
UPDATE public.lessons 
SET teacher_ids = ARRAY[teacher_id] 
WHERE teacher_id IS NOT NULL AND (teacher_ids IS NULL OR cardinality(teacher_ids) = 0);

-- 3. Update RLS policies to allow access if teacher is in the array
--    First, find the policy name. Usually "Lessons Access" or similar.
--    Based on fix_rls_v3.sql, it might not be explicitly named there, 
--    but we will create/replace a comprehensive one.

DROP POLICY IF EXISTS "Lessons Access" ON public.lessons;
CREATE POLICY "Lessons Access" ON public.lessons 
FOR ALL USING (
    (select get_current_user_role()) = 'admin'
    OR
    school_id IN (select id from get_accessible_school_ids())
    OR
    teacher_id = auth.uid()
    OR
    auth.uid() = ANY(teacher_ids)
);

-- 4. Clean up any existing duplicates (Optional but recommended)
--    If we have two lessons for the same class/time/date but different teachers, 
--    this script doesn't merge them automatically (too risky for existing topics/attendance).
--    New lessons created by generateLessons will be merged.
