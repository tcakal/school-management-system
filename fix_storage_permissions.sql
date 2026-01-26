-- Fix Storage Permissions for PDF Uploads
-- The app uses custom auth, so all database interactions happen as 'anon' role.
-- We need to ensure the 'lesson-attachments' bucket exists and is accessible for 'anon' users.

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-attachments', 'lesson-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow 'anon' role to INSERT (Upload) to this specific bucket
DROP POLICY IF EXISTS "Anon Upload Attachments" ON storage.objects;
CREATE POLICY "Anon Upload Attachments" ON storage.objects FOR INSERT TO anon 
WITH CHECK (bucket_id = 'lesson-attachments');

-- 3. Allow 'anon' role to SELECT (Download/View) from this specific bucket
DROP POLICY IF EXISTS "Anon Select Attachments" ON storage.objects;
CREATE POLICY "Anon Select Attachments" ON storage.objects FOR SELECT TO anon 
USING (bucket_id = 'lesson-attachments');

-- 4. Allow 'anon' role to UPDATE (if needed)
DROP POLICY IF EXISTS "Anon Update Attachments" ON storage.objects;
CREATE POLICY "Anon Update Attachments" ON storage.objects FOR UPDATE TO anon 
USING (bucket_id = 'lesson-attachments');

-- 5. Allow 'anon' role to DELETE (Remove)
DROP POLICY IF EXISTS "Anon Delete Attachments" ON storage.objects;
CREATE POLICY "Anon Delete Attachments" ON storage.objects FOR DELETE TO anon 
USING (bucket_id = 'lesson-attachments');
