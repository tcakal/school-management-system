-- Add attachments column to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN lessons.attachments IS 'List of attached files and links for the lesson';
