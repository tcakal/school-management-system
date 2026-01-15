-- Add missing columns to notification_templates
ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS class_group_id UUID REFERENCES class_groups(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS trigger_time TEXT,
ADD COLUMN IF NOT EXISTS days_filter JSONB;
