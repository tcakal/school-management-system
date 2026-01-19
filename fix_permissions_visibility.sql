-- FIX PERMISSIONS (Data Visibility Issue)
-- The issue is likely that "Teachers" do not have permission to INSERT new schools or classes.
-- This script enables access for ALL users to ALL tables.

-- 1. Enable RLS on all tables (Standard Practice)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_evaluations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable access to all users" ON schools;
DROP POLICY IF EXISTS "Enable all access" ON schools;
DROP POLICY IF EXISTS "Enable access to all users" ON students;
DROP POLICY IF EXISTS "Enable access to all users" ON class_groups;
DROP POLICY IF EXISTS "Enable access to all users" ON teachers;
DROP POLICY IF EXISTS "Enable access to all users" ON teacher_assignments;
DROP POLICY IF EXISTS "Enable access to all users" ON lessons;
DROP POLICY IF EXISTS "Enable access to all users" ON attendance;
DROP POLICY IF EXISTS "Enable access to all users" ON payments;
DROP POLICY IF EXISTS "Enable access to all users" ON teacher_leaves;
DROP POLICY IF EXISTS "Enable access to all users" ON student_evaluations;
DROP POLICY IF EXISTS "Enable access to all users" ON teacher_evaluations;

-- 3. Create PERMISSIVE policies (Allow everything for everyone - Dev Mode)
CREATE POLICY "Enable all access" ON schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON class_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON teacher_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON lessons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON teacher_leaves FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON student_evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON teacher_evaluations FOR ALL USING (true) WITH CHECK (true);

