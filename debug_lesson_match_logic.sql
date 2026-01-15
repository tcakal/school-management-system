CREATE OR REPLACE FUNCTION debug_lesson_matching()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_lesson RECORD;
    v_template RECORD;
    v_log TEXT;
BEGIN
    INSERT INTO debug_notification_logs (message) VALUES ('--- DEBUGGING STARTED ---');

    -- Loop through ALL lessons for today
    FOR v_lesson IN 
        SELECT id, school_id, class_group_id, start_time 
        FROM lessons 
        WHERE date = CURRENT_DATE
    LOOP
        INSERT INTO debug_notification_logs (message, details) 
        VALUES ('Checking Lesson', json_build_object('time', v_lesson.start_time, 'school', v_lesson.school_id));

        -- Loop through ALL templates
        FOR v_template IN 
            SELECT id, school_id, class_group_id, trigger_type 
            FROM notification_templates 
            WHERE is_active = true AND trigger_type IN ('lesson_start', 'lesson_end')
        LOOP
            IF v_lesson.school_id = v_template.school_id THEN
                IF v_template.class_group_id IS NULL OR v_lesson.class_group_id = v_template.class_group_id THEN
                    v_log := '✅ MATCH FOUND!';
                ELSE
                    v_log := '❌ Group Mismatch';
                END IF;
            ELSE
                v_log := '❌ School Mismatch';
            END IF;

            INSERT INTO debug_notification_logs (message, details) 
            VALUES (v_log, json_build_object(
                'lesson_school', v_lesson.school_id,
                'template_school', v_template.school_id,
                'lesson_group', v_lesson.class_group_id,
                'template_group', v_template.class_group_id
            ));
        END LOOP;
    END LOOP;

    INSERT INTO debug_notification_logs (message) VALUES ('--- DEBUGGING FINISHED ---');
END;
$$;

SELECT debug_lesson_matching();
