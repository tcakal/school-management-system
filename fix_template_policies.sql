-- FIX: Notification Templates RLS Policies
-- The user cannot delete templates. This is likely due to missing or restrictive RLS policies.
-- We will reset the policies to allow full access for Admins and School Managers.

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Templates viewable by everyone" ON notification_templates;
DROP POLICY IF EXISTS "Templates editable by admins" ON notification_templates;
DROP POLICY IF EXISTS "Templates full access for system users" ON notification_templates;
DROP POLICY IF EXISTS "Templates viewable by school users" ON notification_templates;

-- 1. View Policy: Everyone can see templates (or at least linked ones)
CREATE POLICY "Templates viewable by school users" ON notification_templates FOR SELECT USING (
    -- Global templates (school_id is null)
    school_id IS NULL
    OR
    -- Templates for my school
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND (school_id = notification_templates.school_id OR role = 'admin'))
    OR
    EXISTS (SELECT 1 FROM schools WHERE id = auth.uid() AND id = notification_templates.school_id)
);

-- 2. Edit/Delete Policy: Admins have full access
CREATE POLICY "Templates editable by admins" ON notification_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Edit/Delete Policy: School Managers can edit their OWN school templates
CREATE POLICY "Templates editable by school managers" ON notification_templates FOR ALL USING (
    -- Can edit if I am a teacher-manager of this school
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND school_id = notification_templates.school_id)
    -- Or if I am logged in directly as the school account
    OR (auth.uid() = school_id)
);

-- 4. Insert Policy
CREATE POLICY "Templates insertable by school managers" ON notification_templates FOR INSERT WITH CHECK (
    -- Admin
    EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Manager inserting for their school
    (school_id IS NOT NULL AND (
        EXISTS (SELECT 1 FROM teachers WHERE id = auth.uid() AND school_id = notification_templates.school_id)
        OR (auth.uid() = school_id)
    ))
);
