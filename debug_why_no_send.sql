-- DIAGNOSE WHY NOTIFICATION IS NOT SENDING (V2 - Corrected Syntax)

DO $$
DECLARE
    v_now timestamp with time zone := (now() AT TIME ZONE 'UTC' + interval '3 hours');
    v_template record;
    v_count_teacher int;
    v_count_manager int;
    v_count_student int;
    v_admin_chat_id text;
    v_current_time_str text;
BEGIN
    v_current_time_str := to_char(v_now, 'HH24:MI');
    RAISE NOTICE '--- SYSTEM DIAGNOSTIC START ---';
    RAISE NOTICE 'System Time (Turkey): %', v_current_time_str;

    -- Get System Settings
    SELECT admin_chat_id INTO v_admin_chat_id FROM public.system_settings LIMIT 1;
    RAISE NOTICE 'System Admin Chat ID: %', COALESCE(v_admin_chat_id, 'NULL (!!!)');

    -- Loop to check templates
    FOR v_template IN SELECT * FROM public.notification_templates WHERE is_active = true AND trigger_type = 'fixed_time' LOOP
        RAISE NOTICE '------------------------------------------------';
        RAISE NOTICE 'Checking Template ID: %', v_template.id;
        RAISE NOTICE 'Trigger Time: %', v_template.trigger_time;
        RAISE NOTICE 'Raw Target Roles: %', v_template.target_roles; 
        
        -- Force check logic
        IF v_template.trigger_time = v_current_time_str OR TRUE THEN 
            RAISE NOTICE '>> Time Match (Simulated)';
            
            -- CHECK ADMIN
            -- Corrected Syntax: ["admin"]
            IF v_template.target_roles @> '["admin"]'::jsonb THEN
                IF v_admin_chat_id IS NOT NULL THEN
                    RAISE NOTICE '   [ADMIN] Ready to send to Super Admin.';
                ELSE
                    RAISE NOTICE '   [ADMIN] FAIL: Target includes Admin, but Admin Chat ID is NULL.';
                END IF;
            END IF;

            -- CHECK TEACHERS
            IF v_template.target_roles @> '["teacher"]'::jsonb THEN
                SELECT count(*) INTO v_count_teacher 
                FROM public.teachers 
                WHERE telegram_chat_id IS NOT NULL 
                AND (v_template.school_id IS NULL OR school_id = v_template.school_id);
                
                RAISE NOTICE '   [TEACHER] Found % valid recipients.', v_count_teacher;
            END IF;

             -- CHECK MANAGERS
            IF v_template.target_roles @> '["manager"]'::jsonb THEN
                SELECT count(*) INTO v_count_manager 
                FROM public.schools 
                WHERE telegram_chat_id IS NOT NULL 
                AND (v_template.school_id IS NULL OR id = v_template.school_id);
                
                RAISE NOTICE '   [MANAGER] Found % valid recipients.', v_count_manager;
            END IF;
            
            -- CHECK STUDENTS
            IF v_template.target_roles @> '["student"]'::jsonb THEN
                SELECT count(*) INTO v_count_student 
                FROM public.students 
                WHERE telegram_chat_id IS NOT NULL 
                AND (v_template.school_id IS NULL OR school_id = v_template.school_id);
                
                RAISE NOTICE '   [STUDENT] Found % valid recipients.', v_count_student;
            END IF;

        ELSE
            RAISE NOTICE '>> Time Check: NO MATCH (Template: %, System: %)', v_template.trigger_time, v_current_time_str;
        END IF;

    END LOOP;
    RAISE NOTICE '--- END DIAGNOSTIC ---';
END;
$$;
