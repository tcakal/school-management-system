-- Fix check constraint to allow 'active' or update status logic
ALTER TABLE school_periods DROP CONSTRAINT IF EXISTS school_periods_status_check;

ALTER TABLE school_periods 
ADD CONSTRAINT school_periods_status_check 
CHECK (status IN ('active', 'pending', 'partial', 'paid', 'overdue', 'void'));

-- Drop ALL related policies to avoid conflicts
DROP POLICY IF EXISTS "Periods editable by admins" ON school_periods;
DROP POLICY IF EXISTS "Periods editable by school users" ON school_periods;
DROP POLICY IF EXISTS "Periods insertable by school managers" ON school_periods;
DROP POLICY IF EXISTS "Periods updatable by school managers" ON school_periods;
DROP POLICY IF EXISTS "Periods deletable by school managers" ON school_periods;
DROP POLICY IF EXISTS "Periods viewable by users linked to school or admins" ON school_periods; -- existing policy

-- Re-create policies
-- 1. View Policy (Everyone in the school or admins)
CREATE POLICY "Periods viewable by users linked to school or admins" ON school_periods FOR SELECT USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND (role = 'admin' OR school_id = school_periods.school_id))
    OR 
    EXISTS (SELECT 1 FROM schools WHERE id = auth.uid() AND id = school_periods.school_id)
);

-- 2. Admin Full Access
CREATE POLICY "Periods editable by admins" ON school_periods FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Manager Insert Access
CREATE POLICY "Periods insertable by school managers" ON school_periods FOR INSERT WITH CHECK (
    auth.uid() = school_id 
    OR 
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Manager Update Access
CREATE POLICY "Periods updatable by school managers" ON school_periods FOR UPDATE USING (
    auth.uid() = school_id 
    OR 
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Manager Delete Access
CREATE POLICY "Periods deletable by school managers" ON school_periods FOR DELETE USING (
    auth.uid() = school_id 
    OR 
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND role = 'admin')
);
