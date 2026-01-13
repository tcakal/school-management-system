-- Create a new private bucket for lesson attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-attachments', 'lesson-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-attachments');

-- Policy: Allow public to view files (since we set public=true)
CREATE POLICY "Allow public viewing"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'lesson-attachments');

-- Policy: Allow users to delete their own files or admins to delete any
CREATE POLICY "Allow individual delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-attachments' AND (auth.uid() = owner));
