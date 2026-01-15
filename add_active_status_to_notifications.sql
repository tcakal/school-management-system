-- Add is_active column to notification_templates
ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
