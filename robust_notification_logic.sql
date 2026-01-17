-- ROBUST NOTIFICATION LOGIC (Catch-Up Support)
-- This version adds a "Tolerance Window".
-- It checks both the CURRENT minute AND the PREVIOUS minute.
-- If cron runs late (e.g., 01:17:05), it will still catch the 01:16 schedule.

CREATE OR REPLACE FUNCTION check_and_send_notifications()
RETURNS void AS $$
DECLARE
    v_bot_token text;
    v_template record;
    v_now timestamp with time zone := (now() AT TIME ZONE 'UTC' + interval '3 hours');
    v_current_time_str text;
    v_prev_time_str text; -- NEW: Previous minute
    v_admin_chat_id text;
    v_message text;
    v_teacher record;
    v_school record;
    v_student record;
BEGIN
    v_current_time_str := to_char(v_now, 'HH24:MI');
    v_prev_time_str := to_char(v_now - interval '1 minute', 'HH24:MI'); -- NEW
    
    INSERT INTO public.debug_trace_logs (message) VALUES ('FUNC START: System Time=' || v_current_time_str || ', Looking back to ' || v_prev_time_str);

    -- 1. Get Settings
    SELECT telegram_bot_token, admin_chat_id INTO v_bot_token, v_admin_chat_id FROM public.system_settings LIMIT 1;
    
    IF v_bot_token IS NULL THEN 
        INSERT INTO public.debug_trace_logs (message) VALUES ('FUNC EXIT: Bot Token NULL');
        RETURN; 
    END IF;

    -- 2. Iterate Active Templates
    FOR v_template IN SELECT * FROM public.notification_templates WHERE is_active = true LOOP
        
        -- B. Fixed Time Trigger
        IF v_template.trigger_type = 'fixed_time' THEN
            -- Check (Verbose)
            INSERT INTO public.debug_trace_logs (message) VALUES ('CHECK TEMPLATE: ' || v_template.trigger_time || ' vs (' || v_current_time_str || ', ' || v_prev_time_str || ')');

            -- NEW: Check BOTH current and previous minute
            IF v_template.trigger_time = v_current_time_str OR v_template.trigger_time = v_prev_time_str THEN
                INSERT INTO public.debug_trace_logs (message) VALUES ('MATCH FOUND (Catch-Up): Template ' || v_template.id || ' Time: ' || v_template.trigger_time);

                -- Check Idempotency
                PERFORM 1 FROM public.notification_logs WHERE template_id = v_template.id AND sent_at::date = CURRENT_DATE;
                
                IF FOUND THEN
                     INSERT INTO public.debug_trace_logs (message) VALUES ('SKIP: Already Sent Today');
                ELSE
                    INSERT INTO public.debug_trace_logs (message) VALUES ('PROCESS: Sending Now...');
                    v_message := REPLACE(v_template.message_template, '{class_name}', 'Genel');
                    v_message := REPLACE(v_message, '{start_time}', v_template.trigger_time);

                    -- 1. ADMIN
                    IF v_template.target_roles @> '["admin"]' AND v_admin_chat_id IS NOT NULL THEN
                        INSERT INTO public.debug_trace_logs (message) VALUES ('SENDING: Admin');
                        INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, NULL, v_admin_chat_id, 'admin', v_message);
                        PERFORM net.http_post(url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', body := jsonb_build_object('chat_id', v_admin_chat_id, 'text', v_message));
                        INSERT INTO public.activity_logs (user_id, user_name, user_role, action, details, entity_type, entity_id) VALUES ('system-auto', 'Sistem Otomasyonu', 'system', 'BILDIRIM_GONDER', 'Admine Zamanlı: ' || left(v_message, 30), 'notification', v_template.id);
                    END IF;

                    -- 2. TEACHERS
                    IF v_template.target_roles @> '["teacher"]' THEN
                        INSERT INTO public.debug_trace_logs (message) VALUES ('SENDING: Teachers');
                        FOR v_teacher IN SELECT * FROM public.teachers WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR school_id = v_template.school_id) LOOP
                            INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, NULL, v_teacher.telegram_chat_id, 'teacher', v_message);
                            PERFORM net.http_post(url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', body := jsonb_build_object('chat_id', v_teacher.telegram_chat_id, 'text', v_message));
                        END LOOP;
                    END IF;

                    -- 3. MANAGERS
                    IF v_template.target_roles @> '["manager"]' THEN
                        INSERT INTO public.debug_trace_logs (message) VALUES ('SENDING: Managers');
                         FOR v_school IN SELECT * FROM public.schools WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR id = v_template.school_id) LOOP
                            INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, NULL, v_school.telegram_chat_id, 'manager', v_message);
                            PERFORM net.http_post(url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', body := jsonb_build_object('chat_id', v_school.telegram_chat_id, 'text', v_message));
                        END LOOP;
                    END IF;

                    -- 4. STUDENTS
                    IF v_template.target_roles @> '["student"]' THEN
                        INSERT INTO public.debug_trace_logs (message) VALUES ('SENDING: Students');
                         FOR v_student IN SELECT * FROM public.students WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR school_id = v_template.school_id) LOOP
                             INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, NULL, v_student.telegram_chat_id, 'student', v_message);
                            PERFORM net.http_post(url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', body := jsonb_build_object('chat_id', v_student.telegram_chat_id, 'text', v_message));
                        END LOOP;
                    END IF;

                END IF;
            END IF;
        END IF;

    END LOOP;
END;
$$ LANGUAGE plpgsql;
