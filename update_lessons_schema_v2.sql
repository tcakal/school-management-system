
-- Make school_id and class_group_id nullable to support custom events
ALTER TABLE lessons ALTER COLUMN school_id DROP NOT NULL;
ALTER TABLE lessons ALTER COLUMN class_group_id DROP NOT NULL;

-- Add custom_location column if it doesn't exist
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS custom_location TEXT;

-- Verify
SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'lessons';
