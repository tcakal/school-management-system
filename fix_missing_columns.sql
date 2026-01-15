-- Transaction
BEGIN;

-- Add telegram_chat_id to Teachers
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Add telegram_chat_id to Students (Just in case)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

COMMIT;
