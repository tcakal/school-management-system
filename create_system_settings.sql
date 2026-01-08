-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  system_name TEXT DEFAULT 'Atölye Vizyon',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default record if not exists (we only need one row)
INSERT INTO system_settings (id, system_name)
SELECT gen_random_uuid(), 'Atölye Vizyon'
WHERE NOT EXISTS (SELECT 1 FROM system_settings);

-- Add RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (authenticated)
DROP POLICY IF EXISTS "Allow read access to all users" ON system_settings;
CREATE POLICY "Allow read access to all users" ON system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow update access only to admins
DROP POLICY IF EXISTS "Allow update access to all authenticated users" ON system_settings;
CREATE POLICY "Allow update access to all authenticated users" ON system_settings
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Allow insert access (required for initial setup)
DROP POLICY IF EXISTS "Allow insert access to all authenticated users" ON system_settings;
CREATE POLICY "Allow insert access to all authenticated users" ON system_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access to all authenticated users" ON system_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
