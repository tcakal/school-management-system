
-- FIX: Add missing 'template_id' column to notification_logs
ALTER TABLE public.notification_logs 
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.notification_templates(id);

-- Optional: Create an index for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_template_date 
ON public.notification_logs (template_id, sent_at);

-- TEST: Verify the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notification_logs';

-- TEST: Manual Run again to confirm it works now
SELECT check_and_send_notifications();
