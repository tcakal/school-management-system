-- Add admin_chat_id to system_settings
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS admin_chat_id TEXT;
