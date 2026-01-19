-- FIX STORAGE PERMISSIONS (School Assets & Others)
-- The app uses custom auth (not Supabase Auth), but we need to allow uploads.
-- This script ensures 'school-assets' bucket exists and is OPEN for everyone.

BEGIN;

-- 1. Create/Ensure 'school-assets' bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create/Ensure 'lesson-attachments' bucket exists (just in case)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson-attachments', 'lesson-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Drop restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual delete" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- 4. Create PERMISSIVE policies for ALL buckets (Simplest for this use case)
-- We want anyone to view, upload, and delete from these specific buckets.

-- VIEW
CREATE POLICY "Public View"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('school-assets', 'lesson-attachments'));

-- UPLOAD (INSERT)
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id IN ('school-assets', 'lesson-attachments'));

-- UPDATE (Overwrite)
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id IN ('school-assets', 'lesson-attachments'));

-- DELETE
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id IN ('school-assets', 'lesson-attachments'));

COMMIT;
