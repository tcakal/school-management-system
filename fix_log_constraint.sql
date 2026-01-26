-- Fix: Allow Deleting Templates with Logs
-- The error "violates foreign key constraint" happens because you have sent messages using this template.
-- The logs (notification_logs) are preventing the deletion of the template.
-- This script updates the rule to automatically delete the relevant logs when a template is deleted (CASCADE).

ALTER TABLE notification_logs
DROP CONSTRAINT IF EXISTS notification_logs_template_id_fkey;

ALTER TABLE notification_logs
ADD CONSTRAINT notification_logs_template_id_fkey
FOREIGN KEY (template_id)
REFERENCES notification_templates(id)
ON DELETE CASCADE;
