-- Transaction to ensure atomic execution
BEGIN;

-- =================================================================
-- SYSTEM ARCHITECTURE NOTE:
-- The application uses custom client-side authentication (Zustand).
-- It does NOT use Supabase Auth users.
-- Therefore, 'auth.uid()' is not available in RLS policies.
-- We must allow PUBLIC access for the application to function.
-- Security is enforced at the Client UI level.
-- =================================================================

-- 1. STORAGE: 'school-assets' (Permissive)
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop secure/conflicting policies
DROP POLICY IF EXISTS "school_assets_select_public_v5" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_insert_admin_v5" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_delete_admin_v5" ON storage.objects;

-- Create Permissive Policies (V6)
CREATE POLICY "school_assets_select_public_v6"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'school-assets');

CREATE POLICY "school_assets_insert_public_v6"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'school-assets');

CREATE POLICY "school_assets_delete_public_v6"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'school-assets');


-- 2. SETTINGS (Permissive)
DROP POLICY IF EXISTS "settings_select_public_v5" ON system_settings;
DROP POLICY IF EXISTS "settings_update_admin_v5" ON system_settings;
DROP POLICY IF EXISTS "settings_insert_admin_v5" ON system_settings;

CREATE POLICY "settings_select_public_v6"
ON system_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "settings_update_public_v6"
ON system_settings FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "settings_insert_public_v6"
ON system_settings FOR INSERT
TO public
WITH CHECK (true);

-- Ensure row
INSERT INTO system_settings (id, system_name, logo_url)
SELECT uuid_generate_v4(), 'OkulYönetim', NULL
WHERE NOT EXISTS (SELECT 1 FROM system_settings);

COMMIT;
