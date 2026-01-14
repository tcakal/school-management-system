-- Fix strict folder policy that fails for root files
BEGIN;

-- Drop the previous strict policy
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- Create a simpler policy that works for files in the root folder
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-attachments');

COMMIT;
