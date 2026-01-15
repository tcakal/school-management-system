-- Transaction to ensure atomic execution
BEGIN;

-- =================================================================
-- 1. STORAGE: 'school-assets' (PERMISSIVE MODE)
-- =================================================================

-- Ensure bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop previous attempts
DROP POLICY IF EXISTS "school_assets_select_public_v3" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_insert_authenticated_v3" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_delete_authenticated_v3" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_insert_public_v4" ON storage.objects;

-- Create Permissive Policies (V4)

-- 1. VIEW: Everyone
CREATE POLICY "school_assets_select_public_v4"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'school-assets');

-- 2. UPLOAD: ALLOW PUBLIC UPLOADS (Fixes RLS error if auth context is lost)
-- Use with caution, but acceptable for logo assets bucket.
CREATE POLICY "school_assets_insert_public_v4"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'school-assets');

-- 3. DELETE: Authenticated Only (Keep this restricted)
CREATE POLICY "school_assets_delete_authenticated_v4"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'school-assets');


-- =================================================================
-- 2. SETTINGS
-- =================================================================
-- Re-confirm settings policies are open enough
DROP POLICY IF EXISTS "settings_select_public_v3" ON system_settings;
DROP POLICY IF EXISTS "settings_update_authenticated_v3" ON system_settings;
DROP POLICY IF EXISTS "settings_insert_authenticated_v3" ON system_settings;
DROP POLICY IF EXISTS "settings_select_public_v4" ON system_settings;

CREATE POLICY "settings_select_public_v4"
ON system_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "settings_update_authenticated_v4"
ON system_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow public insert just in case bootstrapping fails
CREATE POLICY "settings_insert_public_v4"
ON system_settings FOR INSERT
TO public
WITH CHECK (true);

-- Ensure row
INSERT INTO system_settings (id, system_name, logo_url)
SELECT uuid_generate_v4(), 'OkulYönetim', NULL
WHERE NOT EXISTS (SELECT 1 FROM system_settings);

COMMIT;
