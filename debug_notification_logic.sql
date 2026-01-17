-- DEBUG NOTIFICATION LOGIC SIMULATION
-- Runs the same logic as the automation but PRINTS results instead of sending.

DO $$
DECLARE
    v_now timestamp with time zone := (now() AT TIME ZONE 'UTC' + interval '8 hours'); -- Turkey Time calculation
    v_template record;
    v_lesson record;
    v_target_time timestamp with time zone;
    v_diff_minutes int;
    v_should_send boolean;
BEGIN
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'DEBUG START';
    RAISE NOTICE 'Server UTC Time: %', now() AT TIME ZONE 'UTC';
    RAISE NOTICE 'Calculated Turkey Time (+8h): %', v_now;
    RAISE NOTICE 'Current HH:MI: %', to_char(v_now, 'HH24:MI');
    RAISE NOTICE '---------------------------------------------------';

    FOR v_template IN SELECT * FROM public.notification_templates WHERE is_active = true LOOP
        RAISE NOTICE 'Template Found: ID=% | Type=% | TriggerTime=% | Offset=%', 
            left(v_template.id::text, 8), v_template.trigger_type, v_template.trigger_time, v_template.offset_minutes;

        -- 1. FIXED TIME LOGIC
        IF v_template.trigger_type = 'fixed_time' THEN
            RAISE NOTICE '  -> Checking Fixed Time: Template(%) vs Now(%)', v_template.trigger_time, to_char(v_now, 'HH24:MI');
            
            IF to_char(v_now, 'HH24:MI') = v_template.trigger_time THEN
                RAISE NOTICE '  -> ✅ MATCH! Condition Met.';
            ELSE
                RAISE NOTICE '  -> ❌ NO MATCH. Time matches not.';
            END IF;
        
        -- 2. LESSON LOGIC
        ELSIF v_template.trigger_type IN ('lesson_start', 'lesson_end', '15_min_before', 'last_lesson_end') THEN
            RAISE NOTICE '  -> Checking Lessons for Trigger: %', v_template.trigger_type;
            
            -- Simulate Lesson Loop
            FOR v_lesson IN 
                SELECT l.*, g.name as class_name 
                FROM public.lessons l
                JOIN public.class_groups g ON l.class_group_id = g.id
                WHERE l.status != 'cancelled'
                AND l.date::date >= CURRENT_DATE - 1 
                AND l.date::date <= CURRENT_DATE + 1
            LOOP
                 -- Calculate Target
                v_target_time := (v_lesson.date || ' ' || v_lesson.start_time)::timestamp with time zone;
                IF v_template.trigger_type IN ('lesson_end', 'last_lesson_end') THEN
                     v_target_time := (v_lesson.date || ' ' || v_lesson.end_time)::timestamp with time zone;
                END IF;

                -- Apply Offset
                v_target_time := v_target_time + (v_template.offset_minutes || ' minutes')::interval;

                -- Diff
                v_diff_minutes := EXTRACT(EPOCH FROM (v_now - v_target_time)) / 60;
                
                -- Check Logic (0 to 2 mins)
                v_should_send := (v_diff_minutes >= 0 AND v_diff_minutes <= 2);

                IF v_should_send THEN
                    RAISE NOTICE '    -> ✅ LESSON MATCH! LessonID=% | Target=% | Now=% | Diff=% min', 
                        left(v_lesson.id::text, 8), v_target_time, v_now, v_diff_minutes;
                END IF;
            END LOOP;
        END IF;
        
        RAISE NOTICE '---------------------------------------------------';

    END LOOP;

    IF NOT FOUND THEN
        RAISE NOTICE 'No Active Templates Found!';
    END IF;
    
    RAISE NOTICE 'DEBUG END';
END$$;
