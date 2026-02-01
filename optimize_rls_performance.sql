-- Optimizing RLS Policies to fix "auth_rls_initplan" warnings
-- Replaces direct calls to auth.uid() and auth.role() with (select auth.uid()) and (select auth.role())

-- 1. Table: students
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON students;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON students;

CREATE POLICY "Enable insert access for authenticated users" ON students 
FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON students 
FOR UPDATE USING ((select auth.role()) = 'authenticated');


-- 2. Table: lessons
DROP POLICY IF EXISTS "Enable update for authorized teachers" ON lessons;

CREATE POLICY "Enable update for authorized teachers" ON lessons
FOR UPDATE TO authenticated
USING (
    -- 1. Own lesson
    (select auth.uid()) = teacher_id 
    OR 
    -- 2. Assigned to class group
    EXISTS (
        SELECT 1 FROM teacher_assignments ta
        WHERE ta.teacher_id = (select auth.uid()) 
        AND ta.class_group_id = lessons.class_group_id
    )
    OR
    -- 3. Admin check
    EXISTS (
        SELECT 1 FROM teachers t
        WHERE t.id = (select auth.uid())
        AND t.role = 'admin'
    )
);


-- 3. Table: seasons
DROP POLICY IF EXISTS "Seasons are editable by admins" ON seasons;

CREATE POLICY "Seasons are editable by admins" ON seasons FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = (select auth.uid()) AND role = 'admin')
);


-- 4. Table: school_season_stats
DROP POLICY IF EXISTS "School stats viewable by users linked to school or admins" ON school_season_stats;
DROP POLICY IF EXISTS "School stats editable by admins" ON school_season_stats;

CREATE POLICY "School stats viewable by users linked to school or admins" ON school_season_stats FOR SELECT USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = (select auth.uid()) AND (role = 'admin' OR school_id = school_season_stats.school_id))
    OR 
    EXISTS (SELECT 1 FROM schools WHERE id = (select auth.uid()) AND id = school_season_stats.school_id)
);

CREATE POLICY "School stats editable by admins" ON school_season_stats FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = (select auth.uid()) AND role = 'admin')
);


-- 5. Table: school_periods
DROP POLICY IF EXISTS "Periods viewable by users linked to school or admins" ON school_periods;
DROP POLICY IF EXISTS "Periods editable by admins" ON school_periods;
DROP POLICY IF EXISTS "Periods insertable by school managers" ON school_periods;
DROP POLICY IF EXISTS "Periods updatable by school managers" ON school_periods;
DROP POLICY IF EXISTS "Periods deletable by school managers" ON school_periods;

-- View Policy
CREATE POLICY "Periods viewable by users linked to school or admins" ON school_periods FOR SELECT USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = (select auth.uid()) AND (role = 'admin' OR school_id = school_periods.school_id))
    OR 
    EXISTS (SELECT 1 FROM schools WHERE id = (select auth.uid()) AND id = school_periods.school_id)
);

-- Admin Full Access
CREATE POLICY "Periods editable by admins" ON school_periods FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = (select auth.uid()) AND role = 'admin')
);

-- Manager Insert Access
CREATE POLICY "Periods insertable by school managers" ON school_periods FOR INSERT WITH CHECK (
    (select auth.uid()) = school_id 
    OR 
    EXISTS (SELECT 1 FROM teachers WHERE id = (select auth.uid()) AND role = 'admin')
);

-- Manager Update Access
CREATE POLICY "Periods updatable by school managers" ON school_periods FOR UPDATE USING (
    (select auth.uid()) = school_id 
    OR 
    EXISTS (SELECT 1 FROM teachers WHERE id = (select auth.uid()) AND role = 'admin')
);

-- Manager Delete Access
CREATE POLICY "Periods deletable by school managers" ON school_periods FOR DELETE USING (
    (select auth.uid()) = school_id 
    OR 
    EXISTS (SELECT 1 FROM teachers WHERE id = (select auth.uid()) AND role = 'admin')
);
