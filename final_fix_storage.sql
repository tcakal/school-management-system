-- Final Fix: Open bucket to public because the app uses custom Auth, not Supabase Auth.
-- This allows the 'anon' Supabase client to upload/delete files.

BEGIN;

-- 1. Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson-attachments', 'lesson-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop all previous restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual delete" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Debug" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;

-- 3. Create OPEN policies (Custom Auth workaround)

-- Public View: Everyone can see the files
CREATE POLICY "Public View"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-attachments');

-- Public Upload: Anonymous uploads allowed (since app doesn't use Supabase Auth)
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'lesson-attachments');

-- Public Delete: Anonymous deletes allowed
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'lesson-attachments');

COMMIT;
