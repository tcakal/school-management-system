-- Drop table and all its dependents (policies etc)
DROP TABLE IF EXISTS system_settings CASCADE;

-- Re-create table
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  system_name TEXT DEFAULT 'Atölye Vizyon',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- 1. Read access for everyone authenticated
CREATE POLICY "Allow read access to all users" ON system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Insert access for everyone authenticated (needed for first save)
CREATE POLICY "Allow insert access to all authenticated users" ON system_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Update access for everyone authenticated
CREATE POLICY "Allow update access to all authenticated users" ON system_settings
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Insert default row immediately so the app has something to read/update
-- This avoids the 'insert' path in the app most of the time
INSERT INTO system_settings (id, system_name)
VALUES (gen_random_uuid(), 'Atölye Vizyon');

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
