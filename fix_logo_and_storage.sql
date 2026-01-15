-- Transaction to ensure atomic execution
BEGIN;

-- 1. Create/Ensure 'school-assets' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies for school-assets to start fresh
-- Drop ALL variations to be safe
DROP POLICY IF EXISTS "Public View Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Assets" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Assets" ON storage.objects; 

-- 3. Create fresh policies for school-assets
-- Allow ANYONE to view files (Public Read) - Critical for Logo
CREATE POLICY "Public View Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'school-assets');

-- Allow Authenticated users (Admins) to UPLOAD
CREATE POLICY "Authenticated Upload Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'school-assets'
);

-- Allow Authenticated users to DELETE (Cleaning up old logos)
CREATE POLICY "Authenticated Delete Assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'school-assets');


-- 4. Ensure System Settings Table & Policies
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_name TEXT DEFAULT 'OkulYönetim',
    logo_url TEXT,
    telegram_bot_token TEXT,
    admin_chat_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow access
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies for settings
DROP POLICY IF EXISTS "Enable read access for all users" ON system_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON system_settings;
DROP POLICY IF EXISTS "Enable update for admins only" ON system_settings;
DROP POLICY IF EXISTS "Public Read Settings" ON system_settings;
DROP POLICY IF EXISTS "Admin Update Settings" ON system_settings;
DROP POLICY IF EXISTS "Admin Insert Settings" ON system_settings;

-- Create permissive policies
-- Everyone (even anon/login page) needs to see the Logo/System Name
CREATE POLICY "Public Read Settings"
ON system_settings FOR SELECT
TO public
USING (true);

-- Only Admins (or authenticated for now) can update
CREATE POLICY "Admin Update Settings"
ON system_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow Insert if empty (bootstrapping)
CREATE POLICY "Admin Insert Settings"
ON system_settings FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Helper: Ensure at least one row exists
INSERT INTO system_settings (id, system_name, logo_url)
SELECT uuid_generate_v4(), 'OkulYönetim', NULL
WHERE NOT EXISTS (SELECT 1 FROM system_settings);

COMMIT;
