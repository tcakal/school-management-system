-- Migration: Create branches table
-- Run this in Supabase SQL Editor

-- 1. Create branches table
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    manager_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add branch_id to class_groups (for branch-specific classes)
ALTER TABLE class_groups 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- 3. Add branch_id to students (for branch students)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- 4. Add branch_id to lessons (for branch lessons)
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- 5. Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for branches
-- Admins can do everything
CREATE POLICY "Admin full access to branches" ON branches
    FOR ALL
    USING ((SELECT auth.role()) = 'authenticated' AND EXISTS (
        SELECT 1 FROM teachers WHERE id = (SELECT auth.uid()) AND role = 'admin'
    ));

-- Managers can view their own branch
CREATE POLICY "Manager view own branch" ON branches
    FOR SELECT
    USING (manager_id = (SELECT auth.uid()));

-- Managers can update their own branch (limited fields)
CREATE POLICY "Manager update own branch" ON branches
    FOR UPDATE
    USING (manager_id = (SELECT auth.uid()))
    WITH CHECK (manager_id = (SELECT auth.uid()));

-- 7. Index for performance
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON branches(manager_id);
CREATE INDEX IF NOT EXISTS idx_class_groups_branch_id ON class_groups(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_branch_id ON students(branch_id);
CREATE INDEX IF NOT EXISTS idx_lessons_branch_id ON lessons(branch_id);

-- Done!
-- After running, add branch_id to teachers table for linking managers to branches
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_teachers_branch_id ON teachers(branch_id);
