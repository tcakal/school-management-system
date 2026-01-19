-- FIX NOTIFICATION SENDING
-- The previous logic relied on 'net.http_post' (pg_net extension) which might not be enabled.
-- We are standardizing on the 'http' extension (extensions.http_post) which we know is set up.

CREATE OR REPLACE FUNCTION check_and_send_notifications()
RETURNS void AS $$
DECLARE
    v_bot_token text;
    v_template record;
    v_now timestamp with time zone := (now() AT TIME ZONE 'UTC' + interval '3 hours');
    v_recent_times text[]; 
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
    
    -- 2. Get Settings
    SELECT telegram_bot_token, admin_chat_id INTO v_bot_token, v_admin_chat_id FROM public.system_settings LIMIT 1;
    
    IF v_bot_token IS NULL OR v_bot_token = '' THEN 
        -- Log failure (if debugging table exists)
        RETURN; 
    END IF;

    -- 3. Iterate Active Templates
    FOR v_template IN SELECT * FROM public.notification_templates WHERE is_active = true LOOP
        
        -- B. Fixed Time Trigger
        IF v_template.trigger_type = 'fixed_time' THEN
            -- Check if trigger time is in our "Time Net"
            IF v_template.trigger_time = ANY(v_recent_times) THEN
                
                -- Check Idempotency (Crucial: Don't send if already sent today)
                PERFORM 1 FROM public.notification_logs WHERE template_id = v_template.id AND sent_at::date = CURRENT_DATE;
                
                IF NOT FOUND THEN
                    v_message := REPLACE(v_template.message_template, '{class_name}', 'Genel');
                    v_message := REPLACE(v_message, '{start_time}', v_template.trigger_time);

                    -- 1. ADMIN
                    IF v_template.target_roles @> '["admin"]' AND v_admin_chat_id IS NOT NULL THEN
                        INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, NULL, v_admin_chat_id, 'admin', v_message);
                        
                        -- FIX: Use extensions.http_post
                        PERFORM extensions.http_post(
                            'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', 
                            jsonb_build_object('chat_id', v_admin_chat_id, 'text', v_message)::text,
                            'application/json'
                        );
                    END IF;

                    -- 2. TEACHERS
                    IF v_template.target_roles @> '["teacher"]' THEN
                        FOR v_teacher IN SELECT * FROM public.teachers WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR school_id = v_template.school_id) LOOP
                            INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, NULL, v_teacher.telegram_chat_id, 'teacher', v_message);
                            PERFORM extensions.http_post(
                                'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                                jsonb_build_object('chat_id', v_teacher.telegram_chat_id, 'text', v_message)::text,
                                'application/json'
                            );
                        END LOOP;
                    END IF;

                    -- 3. MANAGERS
                    IF v_template.target_roles @> '["manager"]' THEN
                         FOR v_school IN SELECT * FROM public.schools WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR id = v_template.school_id) LOOP
                            INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, NULL, v_school.telegram_chat_id, 'manager', v_message);
                            PERFORM extensions.http_post(
                                'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                                jsonb_build_object('chat_id', v_school.telegram_chat_id, 'text', v_message)::text,
                                'application/json'
                            );
                        END LOOP;
                    END IF;

                    -- 4. STUDENTS
                    IF v_template.target_roles @> '["student"]' THEN
                         FOR v_student IN SELECT * FROM public.students WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR school_id = v_template.school_id) LOOP
                             INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, NULL, v_student.telegram_chat_id, 'student', v_message);
                            PERFORM extensions.http_post(
                                'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                                jsonb_build_object('chat_id', v_student.telegram_chat_id, 'text', v_message)::text,
                                'application/json'
                            );
                        END LOOP;
                    END IF;

                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TEST FUNCTION (Allows you to send a test message immediately)
CREATE OR REPLACE FUNCTION send_test_telegram_message(p_chat_id text, p_message text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bot_token text;
    v_status integer;
    v_content text;
BEGIN
    SELECT telegram_bot_token INTO v_bot_token FROM public.system_settings LIMIT 1;
    
    IF v_bot_token IS NULL THEN 
        RETURN jsonb_build_object('success', false, 'error', 'No bot token found'); 
    END IF;

    SELECT status, content::text INTO v_status, v_content FROM extensions.http_post(
        'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', 
        jsonb_build_object('chat_id', p_chat_id, 'text', p_message)::text,
        'application/json'
    );
    
    RETURN jsonb_build_object('success', v_status = 200, 'status', v_status, 'response', v_content);
END;
$$;
