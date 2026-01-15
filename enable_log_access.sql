-- Enable RLS on the debug table (good practice)
ALTER TABLE debug_notification_logs ENABLE ROW LEVEL SECURITY;

-- Create Policy: Allow READ access to Authenticated Users (Admins/Teachers)
DROP POLICY IF EXISTS "Allow Read Debug Logs" ON debug_notification_logs;

CREATE POLICY "Allow Read Debug Logs"
ON debug_notification_logs
FOR SELECT
TO authenticated
USING (true);

-- (Optional) Allow Delete if we want clean up button later
CREATE POLICY "Allow Delete Debug Logs"
ON debug_notification_logs
FOR DELETE
TO authenticated
USING (true);

-- Grant Access just in case
GRANT SELECT, DELETE ON debug_notification_logs TO authenticated;
GRANT SELECT, DELETE ON debug_notification_logs TO service_role;
