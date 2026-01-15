-- Transaction
BEGIN;

-- Redefine Function with BOTH Fixed Time AND Lesson Logic + Timezone Fix + Debugging
CREATE OR REPLACE FUNCTION check_and_send_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_now TIMESTAMP;
    v_today_text TEXT;
    v_settings RECORD;
    v_template RECORD;
    v_lesson RECORD;
    v_target_time TIMESTAMP;
    v_diff_minutes INT;
    v_identifier TEXT;
    v_message TEXT;
    v_student RECORD;
    v_day_of_week INT;
BEGIN
    -- Log Start
    INSERT INTO debug_notification_logs (message) VALUES ('Cron Job Started (Full Logic)');

    -- 1. TIMEZONE FIX (Istanbul)
    v_now := now() AT TIME ZONE 'Europe/Istanbul';
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

    -- ==========================================
    -- LOOP 1: LESSON BASED (Start/End) - RESTORED
    -- ==========================================
    FOR v_template IN SELECT * FROM notification_templates WHERE is_active = true AND trigger_type IN ('lesson_start', 'lesson_end') LOOP
        
        -- Day Filter
        IF v_template.days_filter IS NOT NULL AND NOT (v_template.days_filter::jsonb @> to_jsonb(v_day_of_week)) THEN
            CONTINUE;
        END IF;

        -- Find lessons
        FOR v_lesson IN 
            SELECT l.*, g.name as group_name, t.telegram_chat_id as teacher_chat_id
            FROM lessons l
            JOIN class_groups g ON l.class_group_id = g.id
            LEFT JOIN teachers t ON l.teacher_id = t.id
            WHERE l.date = v_today_text
            AND l.school_id = v_template.school_id
            AND (v_template.class_group_id IS NULL OR l.class_group_id = v_template.class_group_id)
            AND l.status != 'cancelled'
        LOOP
            -- Calculate Target Time
            -- Validating if 'start_time' is HH:MM is important, but for now assuming clean data or standard Postgres casting
            BEGIN
                IF v_template.trigger_type = 'lesson_start' THEN
                    v_target_time := (l.date || ' ' || l.start_time)::TIMESTAMP + (COALESCE(v_template.offset_minutes, 0) || ' minutes')::INTERVAL;
                ELSE
                    v_target_time := (l.date || ' ' || l.end_time)::TIMESTAMP + (COALESCE(v_template.offset_minutes, 0) || ' minutes')::INTERVAL;
                END IF;

                SELECT EXTRACT(EPOCH FROM (v_now - v_target_time))/60 INTO v_diff_minutes;
                
                -- Debug Log for Lesson
                -- INSERT INTO debug_notification_logs (message, details) VALUES ('Check Lesson', jsonb_build_object('lesson_id', v_lesson.id, 'target', v_target_time, 'diff', v_diff_minutes));

                IF v_diff_minutes >= 0 AND v_diff_minutes <= 60 THEN
                    v_identifier := v_lesson.id || '-' || v_template.id;
                    
                    IF NOT EXISTS (SELECT 1 FROM notification_logs WHERE notification_identifier = v_identifier) THEN
                        v_message := v_template.message_template;
                        v_message := replace(v_message, '{class_name}', v_lesson.group_name);
                        v_message := replace(v_message, '{start_time}', v_lesson.start_time);
                        v_message := replace(v_message, '{end_time}', v_lesson.end_time);

                        -- Send logic (Students)
                        IF v_template.target_roles::jsonb ? 'student' THEN
                            FOR v_student IN SELECT telegram_chat_id FROM students WHERE class_group_id = v_lesson.class_group_id AND telegram_chat_id IS NOT NULL LOOP
                                PERFORM net.http_post(
                                    url := 'https://api.telegram.org/bot' || v_settings.telegram_bot_token || '/sendMessage',
                                    body := json_build_object('chat_id', v_student.telegram_chat_id, 'text', v_message)::jsonb
                                );
                            END LOOP;
                        END IF;

                        -- Teacher
                        IF v_template.target_roles::jsonb ? 'teacher' AND v_lesson.teacher_chat_id IS NOT NULL THEN
                             PERFORM net.http_post(
                                url := 'https://api.telegram.org/bot' || v_settings.telegram_bot_token || '/sendMessage',
                                body := json_build_object('chat_id', v_lesson.teacher_chat_id, 'text', v_message)::jsonb
                            );
                        END IF;
                        
                        -- Admin
                        IF v_template.target_roles::jsonb ? 'admin' AND v_settings.admin_chat_id IS NOT NULL THEN
                            PERFORM net.http_post(
                                url := 'https://api.telegram.org/bot' || v_settings.telegram_bot_token || '/sendMessage',
                                body := json_build_object('chat_id', v_settings.admin_chat_id, 'text', '[DERS] ' || v_message)::jsonb
                            );
                        END IF;

                        INSERT INTO notification_logs (notification_identifier) VALUES (v_identifier);
                        INSERT INTO debug_notification_logs (message, details) VALUES ('Lesson Notif Sent', jsonb_build_object('id', v_identifier));
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                INSERT INTO debug_notification_logs (message, details) VALUES ('Lesson Calc Error', jsonb_build_object('err', SQLERRM, 'lesson', v_lesson.id));
            END;
        END LOOP;
    END LOOP;

    -- ==========================================
    -- LOOP 2: FIXED TIME (Existing)
    -- ==========================================
    FOR v_template IN SELECT * FROM notification_templates WHERE is_active = true AND trigger_type = 'fixed_time' LOOP
        -- (Logic remains same as previous working version)
        IF v_template.days_filter IS NOT NULL AND NOT (v_template.days_filter::jsonb @> to_jsonb(v_day_of_week)) THEN
             CONTINUE;
        END IF;

        IF v_template.trigger_time IS NOT NULL THEN
            v_target_time := (v_today_text || ' ' || v_template.trigger_time)::TIMESTAMP;
            SELECT EXTRACT(EPOCH FROM (v_now - v_target_time))/60 INTO v_diff_minutes;

            IF v_diff_minutes >= 0 AND v_diff_minutes <= 60 THEN
                v_identifier := 'fixed-' || v_template.id || '-' || v_today_text;
                
                IF NOT EXISTS (SELECT 1 FROM notification_logs WHERE notification_identifier = v_identifier) THEN
                    v_message := v_template.message_template;
                    v_message := replace(v_message, '{class_name}', 'Tüm Sınıflar'); 
                    v_message := replace(v_message, '{start_time}', v_template.trigger_time);

                    IF v_settings.admin_chat_id IS NOT NULL THEN
                         PERFORM net.http_post(
                            url := 'https://api.telegram.org/bot' || v_settings.telegram_bot_token || '/sendMessage',
                            body := json_build_object('chat_id', v_settings.admin_chat_id, 'text', '[SABİT] ' || v_message)::jsonb
                        );
                    END IF;
                    -- (Ideally other roles too, but for testing Admin is key)
                    
                    INSERT INTO notification_logs (notification_identifier) VALUES (v_identifier);
                    INSERT INTO debug_notification_logs (message, details) VALUES ('Fixed Notif Sent', jsonb_build_object('id', v_identifier));
                END IF;
            END IF;
        END IF;
    END LOOP;

    INSERT INTO debug_notification_logs (message) VALUES ('Cron Job Finished');
EXCEPTION WHEN OTHERS THEN
    INSERT INTO debug_notification_logs (message, details) VALUES ('CRITICAL ERROR', jsonb_build_object('error', SQLERRM));
END;
$$;

COMMIT;
