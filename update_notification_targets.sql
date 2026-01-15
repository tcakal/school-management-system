-- Add target_roles to notification_templates
ALTER TABLE notification_templates 
ADD COLUMN target_roles JSONB DEFAULT '["student"]'::jsonb;

-- Add telegram_chat_id to schools (for Managers)
ALTER TABLE schools
ADD COLUMN telegram_chat_id TEXT;
