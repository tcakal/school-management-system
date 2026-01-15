-- Transaction
BEGIN;

-- 1. Create Debug Table
CREATE TABLE IF NOT EXISTS debug_notification_logs (
    id SERIAL PRIMARY KEY,
    log_time TIMESTAMPTZ DEFAULT NOW(),
    message TEXT,
    details JSONB
);

-- 2. Cleanup old logs (optional, keep last 1000)
DELETE FROM debug_notification_logs WHERE id < (SELECT MAX(id) - 1000 FROM debug_notification_logs);

-- 3. Redefine Function with Logging (FIXED SCHEMA ERROR)
CREATE OR REPLACE FUNCTION check_and_send_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_now TIMESTAMP;
    v_today_text TEXT;
    v_settings RECORD;
    v_template RECORD;
    v_target_time TIMESTAMP;
    v_diff_minutes INT;
    v_identifier TEXT;
    v_message TEXT;
    v_day_of_week INT;
    v_log_details JSONB;
BEGIN
    -- Log Start
    INSERT INTO debug_notification_logs (message) VALUES ('Cron Job Started');

    -- Set Time
    v_now := (now() AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Istanbul';
    v_today_text := to_char(v_now, 'YYYY-MM-DD');
    v_day_of_week := EXTRACT(DOW FROM v_now);
    
    INSERT INTO debug_notification_logs (message, details) 
    VALUES ('Time Check', jsonb_build_object('now_istanbul', v_now, 'date', v_today_text, 'day', v_day_of_week));

    -- Get Settings
    SELECT * INTO v_settings FROM system_settings LIMIT 1;
    IF v_settings.telegram_bot_token IS NULL OR v_settings.telegram_bot_token = '' THEN
        INSERT INTO debug_notification_logs (message) VALUES ('Error: No Bot Token');
        RETURN;
    END IF;

    -- Loop Fixed Time Templates
    FOR v_template IN SELECT * FROM notification_templates WHERE is_active = true AND trigger_type = 'fixed_time' LOOP
        
        -- REMOVED 'title' field to prevent errors if column missing
        INSERT INTO debug_notification_logs (message, details) 
        VALUES ('Checking Template', jsonb_build_object('id', v_template.id, 'time', v_template.trigger_time, 'type', v_template.trigger_type));
        
        -- Day Filter
        IF v_template.days_filter IS NOT NULL AND NOT (v_template.days_filter::jsonb @> to_jsonb(v_day_of_week)) THEN
             INSERT INTO debug_notification_logs (message, details) VALUES ('Skipped: Day Filter mismatch', jsonb_build_object('template_days', v_template.days_filter, 'today', v_day_of_week));
             CONTINUE;
        END IF;

        IF v_template.trigger_time IS NOT NULL THEN
            v_target_time := (v_today_text || ' ' || v_template.trigger_time)::TIMESTAMP;
            SELECT EXTRACT(EPOCH FROM (v_now - v_target_time))/60 INTO v_diff_minutes;

            INSERT INTO debug_notification_logs (message, details) 
            VALUES ('Time Diff Calc', jsonb_build_object('target', v_target_time, 'current', v_now, 'diff_minutes', v_diff_minutes));

            IF v_diff_minutes >= 0 AND v_diff_minutes <= 60 THEN
                v_identifier := 'fixed-' || v_template.id || '-' || v_today_text;
                
                IF EXISTS (SELECT 1 FROM notification_logs WHERE notification_identifier = v_identifier) THEN
                     INSERT INTO debug_notification_logs (message) VALUES ('Skipped: Already Sent');
                ELSE
                    -- Attempt Send
                    INSERT INTO debug_notification_logs (message) VALUES ('Condition Met: Sending...');
                    
                    v_message := v_template.message_template;
                    v_message := replace(v_message, '{class_name}', 'Tüm Sınıflar'); 
                    v_message := replace(v_message, '{start_time}', v_template.trigger_time);

                    -- Admin Only Send for Test
                    IF v_settings.admin_chat_id IS NOT NULL THEN
                         PERFORM net.http_post(
                            url := 'https://api.telegram.org/bot' || v_settings.telegram_bot_token || '/sendMessage',
                            body := json_build_object('chat_id', v_settings.admin_chat_id, 'text', v_message)::jsonb
                        );
                        INSERT INTO debug_notification_logs (message) VALUES ('Sent to Admin');
                    ELSE
                        INSERT INTO debug_notification_logs (message) VALUES ('Error: No Admin Chat ID');
                    END IF;
                    
                    INSERT INTO notification_logs (notification_identifier) VALUES (v_identifier);
                END IF;
            ELSE
                 INSERT INTO debug_notification_logs (message, details) VALUES ('Skipped: Time window mismatch', jsonb_build_object('diff', v_diff_minutes));
            END IF;
        END IF;
    END LOOP;

    INSERT INTO debug_notification_logs (message) VALUES ('Cron Job Finished');
EXCEPTION WHEN OTHERS THEN
    INSERT INTO debug_notification_logs (message, details) VALUES ('CRITICAL ERROR', jsonb_build_object('error', SQLERRM));
END;
$$;

COMMIT;
