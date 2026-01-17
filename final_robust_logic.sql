-- FINAL ROBUST LOGIC (15-Minute Catch-Up)
-- Problem: Cron skips multiple minutes (e.g. jumps from 01:19 to 01:24).
-- Solution: Look back 15 minutes. If a template was scheduled in that window, fire it.
-- Safety: 'sent_at::date = CURRENT_DATE' prevents duplicates.

CREATE OR REPLACE FUNCTION check_and_send_notifications()
RETURNS void AS $$
DECLARE
    v_bot_token text;
    v_template record;
    v_now timestamp with time zone := (now() AT TIME ZONE 'UTC' + interval '3 hours');
    v_recent_times text[]; -- Array to hold last 15 minutes
    v_check_time text;
    v_admin_chat_id text;
    v_message text;
    v_teacher record;
    v_school record;
    v_student record;
    i int;
BEGIN
    -- 1. Build the "Time Net" (Last 15 minutes)
    FOR i IN 0..14 LOOP
        v_recent_times := array_append(v_recent_times, to_char(v_now - (i || ' minutes')::interval, 'HH24:MI'));
    END LOOP;
    
    INSERT INTO public.debug_trace_logs (message) VALUES ('FUNC START: Net=' || array_to_string(v_recent_times, ', '));

    -- 2. Get Settings
    SELECT telegram_bot_token, admin_chat_id INTO v_bot_token, v_admin_chat_id FROM public.system_settings LIMIT 1;
    
    IF v_bot_token IS NULL THEN 
        INSERT INTO public.debug_trace_logs (message) VALUES ('FUNC EXIT: Bot Token NULL');
        RETURN; 
    END IF;

    -- 3. Iterate Active Templates
    FOR v_template IN SELECT * FROM public.notification_templates WHERE is_active = true LOOP
        
        -- B. Fixed Time Trigger
        IF v_template.trigger_type = 'fixed_time' THEN
            -- Check if trigger time is in our "Time Net"
            -- We use ANY() for array check
            IF v_template.trigger_time = ANY(v_recent_times) THEN
                
                -- Check Idempotency (Crucial: Don't send if already sent today)
                PERFORM 1 FROM public.notification_logs WHERE template_id = v_template.id AND sent_at::date = CURRENT_DATE;
                
                IF FOUND THEN
                     -- Silent skip to avoid spamming logs for old templates
                     INSERT INTO public.debug_trace_logs (message) VALUES ('SKIP: ' || v_template.id || ' already sent.');
                ELSE
                    INSERT INTO public.debug_trace_logs (message) VALUES ('CATCH-UP MATCH: Template ' || v_template.id || ' Time: ' || v_template.trigger_time);
                    
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
    INSERT INTO public.debug_trace_logs (message) VALUES ('FUNC END');
END;
$$ LANGUAGE plpgsql;
