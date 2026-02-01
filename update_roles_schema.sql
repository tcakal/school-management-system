-- Migration to support 3-tier Role Hierarchy: Admin, Manager, Teacher

-- 1. Ensure 'role' column exists and has proper check constraint
-- First, try to drop existing constraint if possible (we guess the name, or just alter column type)
DO $$
BEGIN
    ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_role_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add/Ensure column exists (Idempotent)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'teacher';

-- Add new constraint
ALTER TABLE teachers 
ADD CONSTRAINT teachers_role_check 
CHECK (role IN ('admin', 'manager', 'teacher'));


-- 2. Ensure 'school_id' is present for linking Managers to Schools
-- (Teachers already had school_id in teacher_assignments, but Managers might need a direct link 
-- OR we use the existing relationship. 
-- Schema shows 'teacher_assignments' table links teachers to schools.
-- PROPOSAL: For Managers, we might want a direct 'school_id' on the teachers table for easier lookup, 
-- or we can treat them as "Assigned to School X" via the same assignments table.
-- HOWEVER, 'teacher_assignments' implies "teaching classes".
-- A Manager manages a school.
-- Let's add 'school_id' explicitly to 'teachers' table for primary affiliation.)

ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

-- 3. Migration: Update existing Admins (if any needs specific handling, but unlikely)
-- Default is 'teacher' if null.
UPDATE teachers SET role = 'teacher' WHERE role IS NULL;

-- 4. Set RLS Policies (Drafting here, but will do in separate file or block)
-- We will do policies in the next step.
