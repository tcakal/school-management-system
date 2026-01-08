-- Allow public read access (authenticated + anon) for system_settings
DROP POLICY IF EXISTS "Allow read access to all users" ON system_settings;

CREATE POLICY "Allow read access to all users" ON system_settings
  FOR SELECT USING (true); -- 'true' means everyone including anon can read

-- Ensure insert/update is still restricted to authenticated (already set, but good to keep in mind)
-- (No change needed for update/insert policies)

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
