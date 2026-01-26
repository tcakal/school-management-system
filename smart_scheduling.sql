
-- Function to set the start week of a schedule
-- It calculates the shift required to move the current FIRST scheduled lesson 
-- to the same day of the week within the target week.
CREATE OR REPLACE FUNCTION set_school_schedule_start(
    p_school_id UUID,
    p_target_week_date DATE
) RETURNS JSONB AS $$
DECLARE
    v_current_start DATE;
    v_days_diff INT;
    v_updated_count INT;
    v_shift_result JSONB;
BEGIN
    -- 1. Find current start date (earliest scheduled lesson)
    SELECT MIN(date) INTO v_current_start
    FROM lessons
    WHERE school_id = p_school_id
      AND status = 'scheduled';

    IF v_current_start IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No scheduled lessons found for this school.');
    END IF;

    -- 2. Calculate the difference in weeks (using date_trunc to align to Monday)
    -- Postgres date_trunc('week', date) returns the Monday of that week
    v_days_diff := date_part('day', date_trunc('week', p_target_week_date) - date_trunc('week', v_current_start));

    -- 3. If no shift needed
    IF v_days_diff = 0 THEN
        RETURN jsonb_build_object('success', true, 'message', 'Schedule is already in the target week.', 'updated_count', 0);
    END IF;

    -- 4. Call the existing shift function
    -- We cast the diff to integer accurately
    v_shift_result := shift_school_schedule(p_school_id, v_current_start, v_days_diff::INT);

    RETURN v_shift_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Function to append a lesson (Restore/Extend)
-- Adds a new lesson 1 week after the LAST scheduled lesson
-- Copies properties from the last lesson
CREATE OR REPLACE FUNCTION append_lesson_to_schedule(
    p_school_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_last_lesson lessons%ROWTYPE;
    v_new_date DATE;
    v_new_id UUID;
BEGIN
    -- 1. Get the last scheduled lesson
    SELECT * INTO v_last_lesson
    FROM lessons
    WHERE school_id = p_school_id
      AND status = 'scheduled'
    ORDER BY date DESC
    LIMIT 1;

    IF v_last_lesson.id IS NULL THEN
        -- Try to find ANY lesson if no scheduled ones exist (e.g. all completed)
        SELECT * INTO v_last_lesson
        FROM lessons
        WHERE school_id = p_school_id
        ORDER BY date DESC
        LIMIT 1;
    END IF;

    IF v_last_lesson.id IS NULL THEN
         RETURN jsonb_build_object('success', false, 'error', 'No lessons found to copy from.');
    END IF;

    -- 2. Calculate new date
    v_new_date := v_last_lesson.date + INTERVAL '7 days';

    -- 3. Insert new lesson
    INSERT INTO lessons (
        school_id,
        class_group_id,
        teacher_id,
        date,
        start_time,
        end_time,
        status,
        type,
        topic,
        notes
    ) VALUES (
        v_last_lesson.school_id,
        v_last_lesson.class_group_id,
        v_last_lesson.teacher_id,
        v_new_date,
        v_last_lesson.start_time,
        v_last_lesson.end_time,
        'scheduled',
        v_last_lesson.type,
        v_last_lesson.topic,
        v_last_lesson.notes
    ) RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_lesson_id', v_new_id,
        'new_date', v_new_date,
        'message', 'Added new lesson to the end of schedule.'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Permissions
GRANT EXECUTE ON FUNCTION set_school_schedule_start(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION set_school_schedule_start(UUID, DATE) TO service_role;

GRANT EXECUTE ON FUNCTION append_lesson_to_schedule(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION append_lesson_to_schedule(UUID) TO service_role;
