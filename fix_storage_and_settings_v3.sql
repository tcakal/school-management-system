-- Transaction to ensure atomic execution
BEGIN;

-- =================================================================
-- 1. STORAGE: 'school-assets'
-- =================================================================

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop diverse policy names to ensure clean slate
DROP POLICY IF EXISTS "Public View Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Assets" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Assets" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_select_public" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_delete_authenticated" ON storage.objects;

-- Create Policies with new, unique names (v3)
-- 1. VIEW: Everyone can see
CREATE POLICY "school_assets_select_public_v3"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'school-assets');

-- 2. UPLOAD: Authenticated users can upload
CREATE POLICY "school_assets_insert_authenticated_v3"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'school-assets');

-- 3. DELETE: Authenticated users can delete
CREATE POLICY "school_assets_delete_authenticated_v3"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'school-assets');


-- =================================================================
-- 2. SETTINGS: 'system_settings'
-- =================================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_name TEXT DEFAULT 'OkulYönetim',
    logo_url TEXT,
    telegram_bot_token TEXT,
    admin_chat_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Public Read Settings" ON system_settings;
DROP POLICY IF EXISTS "Admin Update Settings" ON system_settings;
DROP POLICY IF EXISTS "Admin Insert Settings" ON system_settings;
DROP POLICY IF EXISTS "settings_select_public" ON system_settings;
DROP POLICY IF EXISTS "settings_update_authenticated" ON system_settings;
DROP POLICY IF EXISTS "settings_insert_authenticated" ON system_settings;

-- Create Policies (v3)
CREATE POLICY "settings_select_public_v3"
ON system_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "settings_update_authenticated_v3"
ON system_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "settings_insert_authenticated_v3"
ON system_settings FOR INSERT
TO authenticated
WITH CHECK (true);


-- =================================================================
-- 3. BOOTSTRAP DATA
-- =================================================================
INSERT INTO system_settings (id, system_name, logo_url)
SELECT uuid_generate_v4(), 'OkulYönetim', NULL
WHERE NOT EXISTS (SELECT 1 FROM system_settings);

COMMIT;
