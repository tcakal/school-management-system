-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Log Table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_identifier TEXT NOT NULL, 
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Function Definition (Full Logic)
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
    -- Set time to Istanbul
    v_now := (now() AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Istanbul';
    v_today_text := to_char(v_now, 'YYYY-MM-DD');
    v_day_of_week := EXTRACT(DOW FROM v_now); -- 0=Sun, 6=Sat

    -- Get Settings
    SELECT * INTO v_settings FROM system_settings LIMIT 1;
    IF v_settings.telegram_bot_token IS NULL OR v_settings.telegram_bot_token = '' THEN
        RETURN; 
    END IF;

    -- ==========================================
    -- LOOP 1: LESSON BASED (Start/End)
    -- ==========================================
    FOR v_template IN SELECT * FROM notification_templates WHERE is_active = true AND trigger_type IN ('lesson_start', 'lesson_end') LOOP
        
        -- Day Filter Check
        IF v_template.days_filter IS NOT NULL AND NOT (v_template.days_filter::jsonb @> to_jsonb(v_day_of_week)) THEN
            CONTINUE;
        END IF;

        -- Find relevant lessons for today
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
            IF v_template.trigger_type = 'lesson_start' THEN
                v_target_time := (l.date || ' ' || l.start_time)::TIMESTAMP + (v_template.offset_minutes || ' minutes')::INTERVAL;
            ELSE
                v_target_time := (l.date || ' ' || l.end_time)::TIMESTAMP + (v_template.offset_minutes || ' minutes')::INTERVAL;
            END IF;

            -- Calc Diff
            SELECT EXTRACT(EPOCH FROM (v_now - v_target_time))/60 INTO v_diff_minutes;

            IF v_diff_minutes >= 0 AND v_diff_minutes <= 60 THEN
                v_identifier := v_lesson.id || '-' || v_template.id;
                
                IF NOT EXISTS (SELECT 1 FROM notification_logs WHERE notification_identifier = v_identifier) THEN
                    v_message := v_template.message_template;
                    v_message := replace(v_message, '{class_name}', v_lesson.group_name);
                    v_message := replace(v_message, '{start_time}', v_lesson.start_time);

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
                            body := json_build_object('chat_id', v_settings.admin_chat_id, 'text', v_message)::jsonb
                        );
                    END IF;

                    INSERT INTO notification_logs (notification_identifier) VALUES (v_identifier);
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    -- ==========================================
    -- LOOP 2: FIXED TIME (Every Day / Specific Days)
    -- ==========================================
    FOR v_template IN SELECT * FROM notification_templates WHERE is_active = true AND trigger_type = 'fixed_time' LOOP
        
        -- Day Filter Check
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

                    -- Send (Generalized for fixed time - assume based on templates target roles logic, but here simplifying to all relevant users logic would be complex.
                    -- For fixed time, usually it's "All Students in School" or "All Teachers".
                    -- Current logic implementation for Fixed Time needs to iterate differently.
                    
                    -- A. ALL STUDENTS IN SCHOOL (if class_group_id is null) OR SPECIFIC CLASS
                    IF v_template.target_roles::jsonb ? 'student' THEN
                        FOR v_student IN 
                            SELECT telegram_chat_id FROM students 
                            WHERE school_id = v_template.school_id 
                            AND (v_template.class_group_id IS NULL OR class_group_id = v_template.class_group_id)
                            AND telegram_chat_id IS NOT NULL 
                        LOOP
                            PERFORM net.http_post(
                                url := 'https://api.telegram.org/bot' || v_settings.telegram_bot_token || '/sendMessage',
                                body := json_build_object('chat_id', v_student.telegram_chat_id, 'text', v_message)::jsonb
                            );
                        END LOOP;
                    END IF;

                    -- B. ADMIN
                    IF v_template.target_roles::jsonb ? 'admin' AND v_settings.admin_chat_id IS NOT NULL THEN
                        PERFORM net.http_post(
                            url := 'https://api.telegram.org/bot' || v_settings.telegram_bot_token || '/sendMessage',
                            body := json_build_object('chat_id', v_settings.admin_chat_id, 'text', v_message)::jsonb
                        );
                    END IF;

                    INSERT INTO notification_logs (notification_identifier) VALUES (v_identifier);
                END IF;
            END IF;
        END IF;
    END LOOP;

END;
$$;

-- 4. Schedule (Idempotent)
SELECT cron.schedule('check_notifications_job', '*/5 * * * *', 'SELECT check_and_send_notifications()');
