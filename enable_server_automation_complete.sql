-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;

-- Create Notification Logs Table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id uuid,
    target_id uuid, -- Lesson ID or other target entity ID
    recipient_chat_id text,
    recipient_role text,
    message_body text,
    sent_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'sent', -- 'sent', 'failed' (though pg_net is async)
    request_id bigint -- pg_net request id
);

-- Main Function to Check and Send Notifications
CREATE OR REPLACE FUNCTION check_and_send_notifications()
RETURNS void AS $$
DECLARE
    v_bot_token text;
    v_template record;
    v_lesson record;
    v_now timestamp with time zone := now();
    v_target_time timestamp with time zone;
    v_diff_minutes int;
    v_message text;
    v_chat_id text;
    v_student record;
    v_teacher record;
    v_school_manager_chat_id text;
    v_admin_chat_id text;
    v_request_id bigint;
    v_log_id uuid;
    v_should_send boolean;
BEGIN
    -- 1. Get Bot Token & Admin Chat ID
    SELECT "telegramBotToken", "adminChatId" INTO v_bot_token, v_admin_chat_id FROM public."SystemSettings" LIMIT 1;
    
    IF v_bot_token IS NULL THEN
        RAISE WARNING 'Telegram Bot Token not set in SystemSettings';
        RETURN;
    END IF;

    -- 2. Iterate Over Active Templates
    FOR v_template IN SELECT * FROM public."NotificationTemplates" WHERE "isActive" = true LOOP
        
        -- A. Lesson Based Triggers (lesson_start, lesson_end, 15_min_before, last_lesson_end)
        IF v_template."triggerType" IN ('lesson_start', 'lesson_end', '15_min_before', 'last_lesson_end') THEN
            
            FOR v_lesson IN 
                SELECT l.*, g.name as class_name, s.name as school_name 
                FROM public.lessons l
                JOIN public."ClassGroups" g ON l."classGroupId" = g.id
                JOIN public.schools s ON l."schoolId" = s.id
                WHERE l.status != 'cancelled'
                -- Filter by School/Class if specified in template
                AND (v_template."schoolId" IS NULL OR l."schoolId" = v_template."schoolId")
                AND (v_template."classGroupId" IS NULL OR l."classGroupId" = v_template."classGroupId")
                -- Check date (Today or close to today logic handled by time diff, but optimization helps)
                AND l.date::date >= CURRENT_DATE - 1 
                AND l.date::date <= CURRENT_DATE + 1
            LOOP
                -- Calculate Target Time
                v_target_time := (v_lesson.date || ' ' || v_lesson."startTime")::timestamp with time zone;
                
                IF v_template."triggerType" = 'lesson_end' OR v_template."triggerType" = 'last_lesson_end' THEN
                     v_target_time := (v_lesson.date || ' ' || v_lesson."endTime")::timestamp with time zone;
                END IF;

                -- Apply Offset (v_template."offsetMinutes" can be negative)
                v_target_time := v_target_time + (v_template."offsetMinutes" || ' minutes')::interval;

                -- Calculate Diff
                v_diff_minutes := EXTRACT(EPOCH FROM (v_now - v_target_time)) / 60;

                -- Logic: Send if within 0-2 mins past target time (and allow 1 min drift)
                -- Accept: diff between 0 and 2.
                v_should_send := (v_diff_minutes >= 0 AND v_diff_minutes <= 2);

                -- EXTRA CHECK FOR 'last_lesson_end': Ensure it IS the last lesson of the day for that group
                IF v_template."triggerType" = 'last_lesson_end' AND v_should_send THEN
                    -- Check if there is any later lesson for this group/school today
                    PERFORM 1 FROM public.lessons l2 
                    WHERE l2."classGroupId" = v_lesson."classGroupId" 
                    AND l2.date = v_lesson.date 
                    AND l2."endTime" > v_lesson."endTime"
                    AND l2.status != 'cancelled';
                    
                    IF FOUND THEN
                        v_should_send := false; -- Not the last lesson
                    END IF;
                END IF;

                IF v_should_send THEN
                    -- Check Log (Idempotency) using TemplateID + LessonID
                    PERFORM 1 FROM public.notification_logs 
                    WHERE template_id = v_template.id AND target_id = v_lesson.id;
                    
                    IF NOT FOUND THEN
                        -- Prepare Message
                        v_message := REPLACE(v_template."messageTemplate", '{class_name}', v_lesson.class_name);
                        v_message := REPLACE(v_message, '{start_time}', v_lesson."startTime");
                        -- Add more variables if needed

                        -- Send to Recipients
                        
                        -- 1. Students / Parents
                        IF v_template."targetRoles" @> '{"student"}' THEN
                            FOR v_student IN SELECT * FROM public.students WHERE "classGroupId" = v_lesson."classGroupId" AND "telegramChatId" IS NOT NULL LOOP
                                v_chat_id := v_student."telegramChatId";
                                -- Record Log First
                                INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body)
                                VALUES (v_template.id, v_lesson.id, v_chat_id, 'student', v_message);

                                -- Send API Request
                                PERFORM net.http_post(
                                    url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                                    body := jsonb_build_object('chat_id', v_chat_id, 'text', v_message)
                                );
                            END LOOP;
                        END IF;

                         -- 2. Teachers
                        IF v_template."targetRoles" @> '{"teacher"}' THEN
                             -- Lesson Teacher
                             SELECT * INTO v_teacher FROM public.teachers WHERE id = v_lesson."teacherId";
                             IF v_teacher."telegramChatId" IS NOT NULL THEN
                                v_chat_id := v_teacher."telegramChatId";
                                INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body)
                                VALUES (v_template.id, v_lesson.id, v_chat_id, 'teacher', v_message);

                                PERFORM net.http_post(
                                    url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                                    body := jsonb_build_object('chat_id', v_chat_id, 'text', v_message)
                                );
                             END IF;
                        END IF;
                        
                        -- 3. Managers
                         IF v_template."targetRoles" @> '{"manager"}' THEN
                             SELECT "telegramChatId" INTO v_school_manager_chat_id FROM public.schools WHERE id = v_lesson."schoolId";
                             IF v_school_manager_chat_id IS NOT NULL THEN
                                v_chat_id := v_school_manager_chat_id;
                                INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body)
                                VALUES (v_template.id, v_lesson.id, v_chat_id, 'manager', v_message);

                                PERFORM net.http_post(
                                    url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                                    body := jsonb_build_object('chat_id', v_chat_id, 'text', v_message)
                                );
                             END IF;
                        END IF;

                         -- 4. Admin
                         IF v_template."targetRoles" @> '{"admin"}' AND v_admin_chat_id IS NOT NULL THEN
                            v_chat_id := v_admin_chat_id;
                            INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body)
                            VALUES (v_template.id, v_lesson.id, v_chat_id, 'admin', v_message);

                            PERFORM net.http_post(
                                url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                                body := jsonb_build_object('chat_id', v_chat_id, 'text', v_message)
                            );
                        END IF;

                    END IF; -- End Log Check
                END IF; -- End Should Send
            END LOOP; -- End Lesson Loop
        
        -- B. Fixed Time Trigger
        ELSIF v_template."triggerType" = 'fixed_time' THEN
            -- Check if current time matches trigger time (HH:MM)
            IF to_char(v_now, 'HH24:MI') = v_template."triggerTime" THEN
                -- Create a synthetic "Target ID" using Date + TemplateID to allow sending once per day
                -- Actually we can just query the log for today.
                
                PERFORM 1 FROM public.notification_logs 
                WHERE template_id = v_template.id 
                AND sent_at::date = CURRENT_DATE;

                IF NOT FOUND THEN
                    v_message := REPLACE(v_template."messageTemplate", '{class_name}', 'Genel');
                    v_message := REPLACE(v_message, '{start_time}', v_template."triggerTime");

                    -- Send to Admins (Example logic, can be expanded for other roles if ClassGroup is null)
                    -- For fixed time, if classGroupId is NULL, it might be system-wide. 
                    -- If classGroupId is SET, we find students of that class.
                    
                    -- Simple implementation for now: Admin Only or expanded later.
                    -- Let's support Admin + Managers at least.
                    
                    IF v_template."targetRoles" @> '{"admin"}' AND v_admin_chat_id IS NOT NULL THEN
                        INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body)
                        VALUES (v_template.id, NULL, v_admin_chat_id, 'admin', v_message); -- Target ID null for fixed time

                         PERFORM net.http_post(
                            url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                            body := jsonb_build_object('chat_id', v_admin_chat_id, 'text', v_message)
                        );
                    END IF;

                     -- Add other roles logic for Fixed Time here if needed (iterating students is heavy but possible)
                END IF;
            END IF;
        END IF;

    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the Job (Every Minute)
SELECT cron.schedule('check_notifications_job', '* * * * *', 'SELECT check_and_send_notifications()');
