-- Diagnose Active Templates
-- This script will inspect all ACTIVE templates and log their 'days_filter' status to the System Logs.
-- You can view these logs in Ayarlar -> Sistem Logları.

INSERT INTO debug_notification_logs (message, details)
VALUES ('--- TEMPLATE DIAGNOSIS START ---', '{}'::jsonb);

DO $$
DECLARE
    v_t RECORD;
BEGIN
    FOR v_t IN SELECT * FROM notification_templates WHERE is_active = true LOOP
        INSERT INTO debug_notification_logs (message, details)
        VALUES (
            'Template Check', 
            jsonb_build_object(
                'id', v_t.id,
                'days_filter', v_t.days_filter,
                'trigger_time', v_t.trigger_time,
                'message_preview', substring(v_t.message_template from 1 for 20)
            )
        );
    END LOOP;
END $$;

INSERT INTO debug_notification_logs (message, details)
VALUES ('--- TEMPLATE DIAGNOSIS END ---', '{}'::jsonb);
