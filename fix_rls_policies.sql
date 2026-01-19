-- FIX RLS POLICIES for Teachers
-- Ensure Authenticated users (Managers, Admins) can SEE all teachers and their Chat IDs

-- 1. Enable RLS (just in case)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies (Best effort)
DROP POLICY IF EXISTS "Public teachers are viewable by everyone" ON public.teachers;
DROP POLICY IF EXISTS "Teachers viewable by authenticated" ON public.teachers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.teachers;

-- 3. Create PERMISSIVE Select Policy
-- We want Managers/Admins to see all teacher data for notifications
CREATE POLICY "Enable read access for authenticated users"
ON public.teachers
FOR SELECT
TO authenticated
USING (true);

-- 4. Also ensure Notification Logs are writable
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for authenticated users"
ON public.notification_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users"
ON public.notification_logs
FOR SELECT
TO authenticated
USING (true);

-- 5. System Settings (for Admin Chat ID)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for authenticated users"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);
