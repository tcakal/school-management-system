-- Force Fix Log Permissions

-- 1. Enable RLS (Security Best Practice)
ALTER TABLE debug_notification_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop any potentially conflicting/broken policies
DROP POLICY IF EXISTS "Allow Read Debug Logs" ON debug_notification_logs;
DROP POLICY IF EXISTS "Allow Delete Debug Logs" ON debug_notification_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON debug_notification_logs;

-- 3. Create a Simple, Permissive Policy for Log Reading
-- Allow ANY logged-in user (authenticated) to READ logs
CREATE POLICY "Allow Read Debug Logs"
ON debug_notification_logs
FOR SELECT
TO authenticated
USING (true);

-- 4. Create Policy for Deleting (Cleaning) Logs
CREATE POLICY "Allow Delete Debug Logs"
ON debug_notification_logs
FOR DELETE
TO authenticated
USING (true);

-- 5. Grant explicit permissions (just in case)
GRANT SELECT, DELETE ON debug_notification_logs TO authenticated;
GRANT SELECT, DELETE ON debug_notification_logs TO service_role;

-- 6. Verify: List policies again to confirm creation
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'debug_notification_logs';
