-- 1. ADD MISSING COLUMN (The cause of the crash/spam)
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- 2. MIGRATE DATA (Try to find their school from assignments)
UPDATE public.teachers t
SET school_id = (
    SELECT school_id 
    FROM public.teacher_assignments ta 
    WHERE ta.teacher_id = t.id 
    LIMIT 1
)
WHERE t.school_id IS NULL;

-- 3. FIX LOGIC: Re-create the function with SAFETY and correct logic
CREATE OR REPLACE FUNCTION check_and_send_notifications()
RETURNS void AS $$
DECLARE
    v_bot_token text;
    v_template record;
    v_now timestamp with time zone := (now() AT TIME ZONE 'UTC' + interval '3 hours');
    v_recent_times text[]; 
    v_admin_chat_id text;
    v_message text;
    v_teacher record;
    v_school record;
    v_student record;
    i int;
    v_sent_count int;
BEGIN
    -- Wrap in block to catch errors and prevent infinite retries (SPAM prevention)
    BEGIN
        -- 1. Build the "Time Net" (Last 15 minutes)
        FOR i IN 0..14 LOOP
            v_recent_times := array_append(v_recent_times, to_char(v_now - (i || ' minutes')::interval, 'HH24:MI'));
        END LOOP;
        
        -- 2. Get Settings
        SELECT telegram_bot_token, admin_chat_id INTO v_bot_token, v_admin_chat_id FROM public.system_settings LIMIT 1;
        
        IF v_bot_token IS NULL OR v_bot_token = '' THEN 
            RETURN; 
        END IF;

        -- 3. Iterate Active Templates
        FOR v_template IN SELECT * FROM public.notification_templates WHERE is_active = true LOOP
            
            -- B. Fixed Time Trigger
            IF v_template.trigger_type = 'fixed_time' THEN
                -- Check if trigger time is in our "Time Net"
                IF v_template.trigger_time = ANY(v_recent_times) THEN
                    
                    -- Check Idempotency (Are we sure we didn't send this today?)
                    PERFORM 1 FROM public.notification_logs WHERE template_id = v_template.id AND sent_at::date = CURRENT_DATE;
                    
                    IF NOT FOUND THEN
                        v_message := REPLACE(v_template.message_template, '{class_name}', 'Genel');
                        v_message := REPLACE(v_message, '{start_time}', v_template.trigger_time);

                        -- 1. ADMIN
                        IF v_template.target_roles @> '["admin"]' AND v_admin_chat_id IS NOT NULL THEN
                             -- Log FIRST to secure idempotency
                            INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) 
                            VALUES (v_template.id, NULL, v_admin_chat_id, 'admin', v_message);
                            
                            PERFORM extensions.http_post(
                                'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', 
                                jsonb_build_object('chat_id', v_admin_chat_id, 'text', v_message)::text,
                                'application/json'
                            );
                        END IF;

                        -- 2. TEACHERS (Now safe with school_id)
                        IF v_template.target_roles @> '["teacher"]' THEN
                            FOR v_teacher IN SELECT * FROM public.teachers WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR school_id = v_template.school_id) LOOP
                                INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) 
                                VALUES (v_template.id, NULL, v_teacher.telegram_chat_id, 'teacher', v_message);
                                
                                PERFORM extensions.http_post(
                                    'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                                    jsonb_build_object('chat_id', v_teacher.telegram_chat_id, 'text', v_message)::text,
                                    'application/json'
                                );
                            END LOOP;
                        END IF;

                        -- 3. STUDENTS
                        IF v_template.target_roles @> '["student"]' THEN
                             FOR v_student IN SELECT * FROM public.students WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR school_id = v_template.school_id) LOOP
                                INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) 
                                VALUES (v_template.id, NULL, v_student.telegram_chat_id, 'student', v_message);
                                
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
    EXCEPTION WHEN OTHERS THEN
        -- Insert into debug log if possible, but mainly DO NOT FAIL transaction completely to prevent infinite rollback loops
        INSERT INTO public.debug_trace_logs (message) VALUES ('ERROR in Notification Job: ' || SQLERRM);
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
