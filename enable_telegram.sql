-- Add telegram_chat_id to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Add telegram_bot_token to system_settings table
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;

-- Allow students to have telegram_chat_id too (for future parent notifications)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
