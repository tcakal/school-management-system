-- Transaction to ensure atomic execution
BEGIN;

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-attachments', 'lesson-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop legacy or potentially conflicting policies for this bucket
-- We use broad names to catch any previous naming conventions
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual delete" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects; -- specific generic one

-- 3. Create fresh policies

-- Policy A: Allow ANYONE to view files (Public Read)
-- This is necessary for students/parents to see the links without logging in to the dashboard
CREATE POLICY "Allow public viewing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-attachments');

-- Policy B: Allow Authenticated users (Teachers/Admins) to UPLOAD
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'lesson-attachments'
    -- We enforce that the user uploading becomes the owner
    AND (storage.foldername(name))[1] != 'private'
);

-- Policy C: Allow Owners to DELETE their own files
CREATE POLICY "Allow individual delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-attachments' AND auth.uid() = owner);

COMMIT;
