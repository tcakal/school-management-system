-- TELEGRAM LOGS FINAL FIX
-- 1. Ensure debug_trace_logs has 'details' column
ALTER TABLE public.debug_trace_logs ADD COLUMN IF NOT EXISTS details JSONB;

-- 2. Ensure RLS is open for UI to read
ALTER TABLE public.debug_trace_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.debug_trace_logs;
CREATE POLICY "Allow public read access" ON public.debug_trace_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access" ON public.debug_trace_logs;
CREATE POLICY "Allow public insert access" ON public.debug_trace_logs FOR INSERT WITH CHECK (true);

-- 3. Grant permissions to anon/authenticated roles
GRANT SELECT, INSERT ON public.debug_trace_logs TO anon, authenticated, service_role;

-- 4. Update check_and_send_notifications with tracing
CREATE OR REPLACE FUNCTION check_and_send_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := (now() AT TIME ZONE 'UTC' + interval '3 hours');
    v_today_text TEXT;
    v_recent_times TEXT[];
    v_settings RECORD;
    v_template RECORD;
    v_lesson RECORD;
    v_target_time TIMESTAMP;
    v_diff_minutes INT;
    v_identifier TEXT;
    v_message TEXT;
    v_recipient RECORD;
    v_day_of_week INT;
    v_bot_token TEXT;
    i INT;
BEGIN
    v_today_text := to_char(v_now, 'YYYY-MM-DD');
    v_day_of_week := EXTRACT(DOW FROM v_now);

    -- Log Start
    INSERT INTO public.debug_trace_logs (message, details) 
    VALUES ('Cron Job Started', jsonb_build_object('time_istanbul', v_now, 'day', v_day_of_week));

    FOR i IN 0..14 LOOP
        v_recent_times := array_append(v_recent_times, to_char(v_now - (i || ' minutes')::interval, 'HH24:MI'));
    END LOOP;

    SELECT telegram_bot_token, admin_chat_id INTO v_bot_token, v_settings.admin_chat_id FROM public.system_settings LIMIT 1;
    
    IF v_bot_token IS NULL OR v_bot_token = '' THEN 
        INSERT INTO public.debug_trace_logs (message) VALUES ('Error: No Bot Token found in settings');
        RETURN; 
    END IF;

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_recipients (chat_id TEXT, role TEXT) ON COMMIT DELETE ROWS;

    FOR v_template IN SELECT * FROM public.notification_templates WHERE is_active = true LOOP
        IF v_template.days_filter IS NOT NULL AND NOT (v_template.days_filter::jsonb @> to_jsonb(v_day_of_week)) THEN CONTINUE; END IF;

        IF v_template.trigger_type = 'fixed_time' THEN
            IF v_template.trigger_time = ANY(v_recent_times) THEN
                PERFORM 1 FROM public.notification_logs WHERE template_id = v_template.id AND sent_at::date = v_now::date;
                IF NOT FOUND THEN
                    DELETE FROM temp_recipients;
                    IF v_template.target_roles::jsonb ? 'manager' THEN INSERT INTO temp_recipients (chat_id, role) SELECT telegram_chat_id, 'manager' FROM schools WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR id = v_template.school_id); END IF;
                    IF v_template.target_roles::jsonb ? 'branch_manager' THEN INSERT INTO temp_recipients (chat_id, role) SELECT t.telegram_chat_id, 'branch_manager' FROM branches b JOIN teachers t ON b.manager_id = t.id WHERE t.telegram_chat_id IS NOT NULL; END IF;
                    IF v_template.target_roles::jsonb ? 'teacher' THEN INSERT INTO temp_recipients (chat_id, role) SELECT telegram_chat_id, 'teacher' FROM teachers WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR school_id = v_template.school_id); END IF;
                    IF v_template.target_roles::jsonb ? 'admin' AND v_settings.admin_chat_id IS NOT NULL THEN INSERT INTO temp_recipients (chat_id, role) VALUES (v_settings.admin_chat_id, 'admin'); END IF;
                    IF v_template.target_roles::jsonb ? 'student' THEN INSERT INTO temp_recipients (chat_id, role) SELECT telegram_chat_id, 'student' FROM students WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR school_id = v_template.school_id); END IF;

                    v_message := replace(replace(v_template.message_template, '{class_name}', 'Genel Duyuru'), '{start_time}', v_template.trigger_time);
                    FOR v_recipient IN SELECT DISTINCT chat_id, role FROM temp_recipients LOOP
                        INSERT INTO public.notification_logs (template_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, v_recipient.chat_id, v_recipient.role, v_message);
                        PERFORM net.http_post(url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', body := json_build_object('chat_id', v_recipient.chat_id, 'text', v_message)::jsonb);
                    END LOOP;
                    INSERT INTO public.debug_trace_logs (message, details) VALUES ('Sent fixed_time notification', jsonb_build_object('template_id', v_template.id));
                END IF;
            END IF;
        ELSIF v_template.trigger_type IN ('lesson_start', 'lesson_end', '15_min_before', 'last_lesson_end') THEN
            FOR v_lesson IN 
                SELECT l.*, g.name as group_name, s.telegram_chat_id as school_manager_chat_id, bt.telegram_chat_id as branch_manager_chat_id
                FROM public.lessons l
                JOIN public.class_groups g ON l.class_group_id = g.id
                LEFT JOIN public.schools s ON l.school_id = s.id
                LEFT JOIN public.branches b ON g.branch_id = b.id
                LEFT JOIN public.teachers bt ON b.manager_id = t.id -- NOTE: corrected v6 join to bt.id
                WHERE l.date = v_today_text::date AND (v_template.school_id IS NULL OR l.school_id = v_template.school_id) AND (v_template.class_group_id IS NULL OR l.class_group_id = v_template.class_group_id) AND l.status != 'cancelled'
                AND (v_template.trigger_type != 'last_lesson_end' OR l.end_time = (SELECT MAX(end_time) FROM public.lessons WHERE date = l.date AND school_id = l.school_id AND status != 'cancelled'))
            LOOP
                BEGIN
                    DELETE FROM temp_recipients;
                    IF v_template.trigger_type IN ('lesson_start', '15_min_before') THEN v_target_time := (v_today_text || ' ' || v_lesson.start_time)::TIMESTAMP + (COALESCE(v_template.offset_minutes, 0) || ' minutes')::INTERVAL;
                    ELSE v_target_time := (v_today_text || ' ' || v_lesson.end_time)::TIMESTAMP + (COALESCE(v_template.offset_minutes, 0) || ' minutes')::INTERVAL; END IF;
                    SELECT EXTRACT(EPOCH FROM (v_now - v_target_time))/60 INTO v_diff_minutes;
                    IF v_diff_minutes >= 0 AND v_diff_minutes <= 60 THEN
                        v_identifier := v_lesson.id || '-' || v_template.id;
                        IF NOT EXISTS (SELECT 1 FROM public.notification_logs WHERE notification_identifier = v_identifier) THEN
                            IF v_template.target_roles::jsonb ? 'teacher' THEN
                                INSERT INTO temp_recipients (chat_id, role) 
                                SELECT telegram_chat_id, 'teacher' 
                                FROM teachers 
                                WHERE telegram_chat_id IS NOT NULL 
                                AND id = ANY(v_lesson.teacher_ids);
                            END IF;
                            IF v_template.target_roles::jsonb ? 'student' THEN INSERT INTO temp_recipients (chat_id, role) SELECT telegram_chat_id, 'student' FROM students WHERE class_group_id = v_lesson.class_group_id AND telegram_chat_id IS NOT NULL; END IF;
                            IF v_template.target_roles::jsonb ? 'manager' AND v_lesson.school_manager_chat_id IS NOT NULL THEN INSERT INTO temp_recipients (chat_id, role) VALUES (v_lesson.school_manager_chat_id, 'manager'); END IF;
                            IF v_template.target_roles::jsonb ? 'branch_manager' AND v_lesson.branch_manager_chat_id IS NOT NULL THEN INSERT INTO temp_recipients (chat_id, role) VALUES (v_lesson.branch_manager_chat_id, 'branch_manager'); END IF;
                            IF v_template.target_roles::jsonb ? 'admin' AND v_settings.admin_chat_id IS NOT NULL THEN INSERT INTO temp_recipients (chat_id, role) VALUES (v_settings.admin_chat_id, 'admin'); END IF;
                            
                            v_message := replace(replace(replace(v_template.message_template, '{class_name}', v_lesson.group_name), '{start_time}', v_lesson.start_time), '{end_time}', v_lesson.end_time);
                            FOR v_recipient IN SELECT DISTINCT chat_id, role FROM temp_recipients LOOP
                                INSERT INTO public.notification_logs (template_id, recipient_chat_id, recipient_role, message_body, notification_identifier) VALUES (v_template.id, v_recipient.chat_id, v_recipient.role, v_message, v_identifier);
                                PERFORM net.http_post(url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', body := json_build_object('chat_id', v_recipient.chat_id, 'text', v_message)::jsonb);
                            END LOOP;
                            INSERT INTO public.debug_trace_logs (message, details) VALUES ('Sent lesson notification', jsonb_build_object('lesson_id', v_lesson.id, 'template_id', v_template.id));
                        END IF;
                    END IF;
                EXCEPTION WHEN OTHERS THEN INSERT INTO public.debug_trace_logs (message) VALUES ('Logic Error: ' || SQLERRM || ' Lesson: ' || v_lesson.id); END;
            END LOOP;
        END IF;
    END LOOP;
    
    INSERT INTO public.debug_trace_logs (message) VALUES ('Cron Job Finished');
END;
$$;
