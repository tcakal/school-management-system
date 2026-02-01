-- RLS Deployment for 3-Tier Architecture
-- Roles: 'admin', 'manager', 'teacher'
-- Context: 'manager' and 'teacher' are linked to a specific school via 'school_id' (or assignments).

-- Helper function to get current user's role and school safely
-- (Optimized to avoid repetition in policies)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT role FROM teachers WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_current_user_school()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT school_id FROM teachers WHERE id = auth.uid();
$$;

-- 1. SCHOOLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Schools Access" ON schools;

CREATE POLICY "Schools Access" ON schools FOR ALL USING (
    -- Admin sees all
    (select get_current_user_role()) = 'admin' 
    OR 
    -- Manager/Teacher sees own
    id = (select get_current_user_school())
);


-- 2. TEACHERS
-- Managers need to see ALL teachers to find substitutes/extras.
-- Teachers sees self (and maybe others? restricting to self for now for privacy).
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers Access" ON teachers;

CREATE POLICY "Teachers Access - Admin/Manager View All" ON teachers FOR SELECT USING (
    (select get_current_user_role()) IN ('admin', 'manager')
    OR
    id = auth.uid() -- Teacher sees self
);

CREATE POLICY "Teachers Edit - Admin/Manager Own" ON teachers FOR UPDATE USING (
    (select get_current_user_role()) = 'admin'
    OR
    ( (select get_current_user_role()) = 'manager' AND school_id = (select get_current_user_school()) )
);

CREATE POLICY "Teachers Insert/Delete - Admin Only" ON teachers FOR INSERT WITH CHECK (
    (select get_current_user_role()) = 'admin'
);
-- (Managers might need to insert teachers? If so, enable below)
-- CREATE POLICY "Teachers Insert - Manager" ON teachers FOR INSERT WITH CHECK (
--     (select get_current_user_role()) = 'manager' AND school_id = (select get_current_user_school())
-- );


-- 3. STUDENTS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students Access" ON students;

CREATE POLICY "Students Access" ON students FOR ALL USING (
    (select get_current_user_role()) = 'admin'
    OR
    school_id = (select get_current_user_school())
);


-- 4. LESSONS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lessons Access" ON lessons;

CREATE POLICY "Lessons Access" ON lessons FOR ALL USING (
    (select get_current_user_role()) = 'admin'
    OR
    school_id = (select get_current_user_school()) 
    OR
    teacher_id = auth.uid() -- Teachers see their own lessons (even if at another school? Depends on logic. Safe to include.)
);


-- 5. PAYMENTS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payments Access" ON payments;

CREATE POLICY "Payments Access" ON payments FOR ALL USING (
    (select get_current_user_role()) = 'admin'
    OR
    ( (select get_current_user_role()) = 'manager' AND school_id = (select get_current_user_school()) )
);
-- Note: Teachers exclude from Payments entirely.


-- 6. CLASS GROUPS
ALTER TABLE class_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Class Groups Access" ON class_groups;

CREATE POLICY "Class Groups Access" ON class_groups FOR ALL USING (
    (select get_current_user_role()) = 'admin'
    OR
    school_id = (select get_current_user_school())
);
