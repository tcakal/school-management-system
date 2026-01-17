-- REPAIR DATABASE SCHEMA
-- The table 'notification_logs' exists but is missing the 'message_body' column from previous versions.
-- This caused the automation to crash.

ALTER TABLE public.notification_logs 
ADD COLUMN IF NOT EXISTS message_body text;

-- Verify it works now
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notification_logs';
