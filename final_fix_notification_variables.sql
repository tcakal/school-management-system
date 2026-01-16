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
    v_recipient RECORD;
    v_day_of_week INT;
BEGIN
    -- Log Start
    INSERT INTO debug_notification_logs (message) VALUES ('Cron Job Started (Final Variable Fix)');

    -- 1. TIMEZONE FIX (Istanbul)
    v_now := now() AT TIME ZONE 'Europe/Istanbul';
    v_today_text := to_char(v_now, 'YYYY-MM-DD');
    v_day_of_week := EXTRACT(DOW FROM v_now);
    
    INSERT INTO debug_notification_logs (message, details) 
    VALUES ('Time Check', jsonb_build_object('now', v_now, 'day', v_day_of_week));

    -- Get Settings
    SELECT * INTO v_settings FROM system_settings LIMIT 1;
    IF v_settings.telegram_bot_token IS NULL OR v_settings.telegram_bot_token = '' THEN
        INSERT INTO debug_notification_logs (message) VALUES ('Error: No Bot Token');
        RETURN;
    END IF;

    -- Create Temp Table
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_recipients (
        chat_id TEXT
    ) ON COMMIT DELETE ROWS;

    -- ==========================================
    -- LOOP 1: LESSON BASED
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
            WHERE l.date = v_today_text::date
            AND l.school_id = v_template.school_id
            AND (v_template.class_group_id IS NULL OR l.class_group_id = v_template.class_group_id)
            AND l.status != 'cancelled'
        LOOP
            BEGIN
                -- Clear Temp Table
                DELETE FROM temp_recipients;

                -- Calc Time (FIXED: Uses v_lesson instead of l)
                IF v_template.trigger_type = 'lesson_start' THEN
                    v_target_time := (v_lesson.date::text || ' ' || v_lesson.start_time)::TIMESTAMP + (COALESCE(v_template.offset_minutes, 0) || ' minutes')::INTERVAL;
                ELSE
                    v_target_time := (v_lesson.date::text || ' ' || v_lesson.end_time)::TIMESTAMP + (COALESCE(v_template.offset_minutes, 0) || ' minutes')::INTERVAL;
                END IF;

                SELECT EXTRACT(EPOCH FROM (v_now - v_target_time))/60 INTO v_diff_minutes;
                
                -- Log Calculation
                INSERT INTO debug_notification_logs (message, details) 
                VALUES ('Lesson Match Found', jsonb_build_object(
                    'lesson_id', v_lesson.id, 
                    'target_time', v_target_time, 
                    'diff_minutes', v_diff_minutes
                ));

                -- Check Time Window
                IF v_diff_minutes >= 0 AND v_diff_minutes <= 60 THEN
                    v_identifier := v_lesson.id || '-' || v_template.id;
                    
                    IF NOT EXISTS (SELECT 1 FROM notification_logs WHERE notification_identifier = v_identifier) THEN
                        
                        -- COLLECT RECIPIENTS logic...
                        IF v_template.target_roles::jsonb ? 'student' THEN
                            INSERT INTO temp_recipients (chat_id)
                            SELECT telegram_chat_id FROM students WHERE class_group_id = v_lesson.class_group_id AND telegram_chat_id IS NOT NULL;
                        END IF;

                        IF v_template.target_roles::jsonb ? 'teacher' AND v_lesson.teacher_chat_id IS NOT NULL THEN
                             INSERT INTO temp_recipients (chat_id) VALUES (v_lesson.teacher_chat_id);
                        END IF;
                        
                        IF v_template.target_roles::jsonb ? 'manager' AND v_lesson.school_id IS NOT NULL THEN
                             INSERT INTO temp_recipients (chat_id)
                             SELECT telegram_chat_id FROM schools WHERE id = v_lesson.school_id AND telegram_chat_id IS NOT NULL;
                        END IF;

                        IF v_template.target_roles::jsonb ? 'admin' AND v_settings.admin_chat_id IS NOT NULL THEN
                            INSERT INTO temp_recipients (chat_id) VALUES (v_settings.admin_chat_id);
                        END IF;

                        -- Prepare Message
                        v_message := v_template.message_template;
                        v_message := replace(v_message, '{class_name}', v_lesson.group_name);
                        v_message := replace(v_message, '{start_time}', v_lesson.start_time);
                        v_message := replace(v_message, '{end_time}', v_lesson.end_time);

                        -- Send Unique
                        FOR v_recipient IN SELECT DISTINCT chat_id FROM temp_recipients LOOP
                            PERFORM net.http_post(
                                url := 'https://api.telegram.org/bot' || v_settings.telegram_bot_token || '/sendMessage',
                                body := json_build_object('chat_id', v_recipient.chat_id, 'text', v_message)::jsonb
                            );
                        END LOOP;

                        INSERT INTO notification_logs (notification_identifier) VALUES (v_identifier);
                        INSERT INTO debug_notification_logs (message, details) VALUES ('✅ Message Sent', jsonb_build_object('id', v_identifier));
                    ELSE
                         -- Already sent
                    END IF;
                ELSE
                    -- Log Skip Reason (Verbose)
                    IF abs(v_diff_minutes) < 120 THEN
                        INSERT INTO debug_notification_logs (message, details) VALUES ('⏳ Timing Wait', jsonb_build_object('diff', v_diff_minutes, 'target', v_target_time));
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                INSERT INTO debug_notification_logs (message, details) VALUES ('Error in Loop', jsonb_build_object('err', SQLERRM));
            END;
        END LOOP;
    END LOOP;
    
    -- ==========================================
    -- LOOP 2: FIXED TIME notifications
    -- ==========================================
    FOR v_template IN SELECT * FROM notification_templates WHERE is_active = true AND trigger_type = 'fixed_time' LOOP
         -- Day Filter
        IF v_template.days_filter IS NOT NULL AND NOT (v_template.days_filter::jsonb @> to_jsonb(v_day_of_week)) THEN
             CONTINUE;
        END IF;

        IF v_template.trigger_time IS NOT NULL THEN
            DELETE FROM temp_recipients;

            v_target_time := (v_today_text || ' ' || v_template.trigger_time)::TIMESTAMP;
            SELECT EXTRACT(EPOCH FROM (v_now - v_target_time))/60 INTO v_diff_minutes;
            
            INSERT INTO debug_notification_logs (message, details) 
            VALUES ('Fixed Time Check', jsonb_build_object('time', v_template.trigger_time, 'diff', v_diff_minutes));

            IF v_diff_minutes >= 0 AND v_diff_minutes <= 60 THEN
                v_identifier := 'fixed-' || v_template.id || '-' || v_today_text;
                
                IF NOT EXISTS (SELECT 1 FROM notification_logs WHERE notification_identifier = v_identifier) THEN
                    -- Roles Logic for Fixed Time (School Wide)
                     -- Student / Parent
                    IF v_template.target_roles::jsonb ? 'student' THEN
                        INSERT INTO temp_recipients (chat_id)
                        SELECT s.telegram_chat_id 
                        FROM students s
                        JOIN class_groups cg ON s.class_group_id = cg.id
                        WHERE cg.school_id = v_template.school_id 
                        AND s.telegram_chat_id IS NOT NULL;
                    END IF;

                    -- Teacher
                    IF v_template.target_roles::jsonb ? 'teacher' THEN
                        INSERT INTO temp_recipients (chat_id)
                        SELECT t.telegram_chat_id
                        FROM teachers t
                        WHERE t.school_id = v_template.school_id 
                        AND t.telegram_chat_id IS NOT NULL;
                    END IF;
                    
                    -- Manager
                    IF v_template.target_roles::jsonb ? 'manager' THEN
                         INSERT INTO temp_recipients (chat_id)
                         SELECT telegram_chat_id FROM schools WHERE id = v_template.school_id AND telegram_chat_id IS NOT NULL;
                    END IF;

                    -- Admin
                    IF v_template.target_roles::jsonb ? 'admin' AND v_settings.admin_chat_id IS NOT NULL THEN
                        INSERT INTO temp_recipients (chat_id) VALUES (v_settings.admin_chat_id);
                    END IF;

                    v_message := v_template.message_template;
                    v_message := replace(v_message, '{class_name}', 'Genel Duyuru'); 
                    v_message := replace(v_message, '{start_time}', v_template.trigger_time);

                    FOR v_recipient IN SELECT DISTINCT chat_id FROM temp_recipients LOOP
                         PERFORM net.http_post(
                            url := 'https://api.telegram.org/bot' || v_settings.telegram_bot_token || '/sendMessage',
                            body := json_build_object('chat_id', v_recipient.chat_id, 'text', v_message)::jsonb
                        );
                    END LOOP;
                    
                    INSERT INTO notification_logs (notification_identifier) VALUES (v_identifier);
                    INSERT INTO debug_notification_logs (message, details) VALUES ('✅ Fixed Notif Sent', jsonb_build_object('id', v_identifier));
                END IF;
            END IF;
        END IF;
    END LOOP;


    INSERT INTO debug_notification_logs (message) VALUES ('Cron Job Finished');
END;
$$;
