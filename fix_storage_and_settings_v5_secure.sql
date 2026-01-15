-- Transaction to ensure atomic execution
BEGIN;

-- =================================================================
-- 1. STORAGE: 'school-assets' (SECURE MODE)
-- =================================================================

-- Ensure bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop previous policies
DROP POLICY IF EXISTS "school_assets_select_public_v4" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_insert_public_v4" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_delete_authenticated_v4" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_select_public_v5" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_insert_admin_v5" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_delete_admin_v5" ON storage.objects;

-- Create SECURE Policies (V5)

-- 1. VIEW: Everyone (Still public for logo to work on login page)
CREATE POLICY "school_assets_select_public_v5"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'school-assets');

-- 2. UPLOAD: ADMINS ONLY
-- Verify user claims or join with teachers table
CREATE POLICY "school_assets_insert_admin_v5"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'school-assets' AND
    (
        -- Check if user is an admin in teachers table
        EXISTS (
            SELECT 1 FROM public.teachers
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
);

-- 3. DELETE: ADMINS ONLY
CREATE POLICY "school_assets_delete_admin_v5"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'school-assets' AND
    (
        EXISTS (
            SELECT 1 FROM public.teachers
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
);


-- =================================================================
-- 2. SETTINGS (SECURE MODE)
-- =================================================================

-- Drop previous policies
DROP POLICY IF EXISTS "settings_select_public_v4" ON system_settings;
DROP POLICY IF EXISTS "settings_update_authenticated_v4" ON system_settings;
DROP POLICY IF EXISTS "settings_insert_public_v4" ON system_settings;
DROP POLICY IF EXISTS "settings_select_public_v5" ON system_settings;
DROP POLICY IF EXISTS "settings_update_admin_v5" ON system_settings;
DROP POLICY IF EXISTS "settings_insert_admin_v5" ON system_settings;

-- 1. VIEW: Everyone
CREATE POLICY "settings_select_public_v5"
ON system_settings FOR SELECT
TO public
USING (true);

-- 2. UPDATE: ADMINS ONLY
CREATE POLICY "settings_update_admin_v5"
ON system_settings FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.teachers
        WHERE id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teachers
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- 3. INSERT: ADMINS ONLY (or bootstrapped via script)
CREATE POLICY "settings_insert_admin_v5"
ON system_settings FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teachers
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Ensure row exists (safe idempotent insert)
INSERT INTO system_settings (id, system_name, logo_url)
SELECT uuid_generate_v4(), 'OkulYönetim', NULL
WHERE NOT EXISTS (SELECT 1 FROM system_settings);

COMMIT;
