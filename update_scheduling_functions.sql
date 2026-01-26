
-- Update shift_school_schedule to support optional class_group_id
CREATE OR REPLACE FUNCTION shift_school_schedule(
    p_school_id UUID,
    p_start_date DATE,
    p_days_to_shift INT,
    p_class_group_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_updated_count INT;
BEGIN
    -- Update lessons that are scheduled on or after the start date
    WITH updated_rows AS (
        UPDATE lessons
        SET date = (date + (p_days_to_shift || ' days')::INTERVAL)::DATE
        WHERE school_id = p_school_id
          AND (p_class_group_id IS NULL OR class_group_id = p_class_group_id)
          AND date >= p_start_date
          AND status = 'scheduled'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_updated_count FROM updated_rows;

    RETURN jsonb_build_object(
        'success', true,
        'updated_count', v_updated_count,
        'message', format('%s lessons shifted by %s days starting from %s', v_updated_count, p_days_to_shift, p_start_date)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Update set_school_schedule_start to support optional class_group_id
CREATE OR REPLACE FUNCTION set_school_schedule_start(
    p_school_id UUID,
    p_target_week_date DATE,
    p_class_group_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_current_start DATE;
    v_days_diff INT;
    v_shift_result JSONB;
BEGIN
    -- 1. Find current start date (earliest scheduled lesson)
    SELECT MIN(date) INTO v_current_start
    FROM lessons
    WHERE school_id = p_school_id
      AND (p_class_group_id IS NULL OR class_group_id = p_class_group_id)
      AND status = 'scheduled';

    IF v_current_start IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No scheduled lessons found for this criteria.');
    END IF;

    -- 2. Calculate the difference in weeks (using date_trunc to align to Monday)
    -- Postgres date_trunc('week', date) returns the Monday of that week
    v_days_diff := date_part('day', date_trunc('week', p_target_week_date) - date_trunc('week', v_current_start));

    -- 3. If no shift needed
    IF v_days_diff = 0 THEN
        RETURN jsonb_build_object('success', true, 'message', 'Schedule is already in the target week.', 'updated_count', 0);
    END IF;

    -- 4. Call the shift function with the new parameter
    v_shift_result := shift_school_schedule(p_school_id, v_current_start, v_days_diff::INT, p_class_group_id);

    RETURN v_shift_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;
