
-- COMPREHENSIVE REPAIR: Ensure ALL required columns exist
-- The table seems to be missing multiple columns expected by the new logic.

ALTER TABLE public.notification_logs 
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.notification_templates(id),
ADD COLUMN IF NOT EXISTS target_id uuid,
ADD COLUMN IF NOT EXISTS recipient_chat_id text,
ADD COLUMN IF NOT EXISTS recipient_role text,
ADD COLUMN IF NOT EXISTS message_body text;

-- Create index for performance on new columns if needed
CREATE INDEX IF NOT EXISTS idx_logs_template_id ON public.notification_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_logs_sent_date ON public.notification_logs(sent_at);

-- VERIFY: Show columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notification_logs';

-- RETRY: Manual Run
SELECT check_and_send_notifications();
