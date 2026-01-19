
-- Function to shift future lessons for a school
-- Used for handling holidays or semester breaks by moving all scheduled lessons forward

CREATE OR REPLACE FUNCTION shift_school_schedule(
    p_school_id UUID,
    p_start_date DATE,
    p_days_to_shift INT
) RETURNS JSONB AS $$
DECLARE
    v_updated_count INT;
BEGIN
    -- Update lessons that are scheduled on or after the start date
    -- Exclude completed or cancelled lessons to preserve history if any exists in that future range (unlikely but safe)
    WITH updated_rows AS (
        UPDATE lessons
        SET date = (date + (p_days_to_shift || ' days')::INTERVAL)::DATE
        WHERE school_id = p_school_id
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

-- Grant execute permission to authenticated users (managers)
GRANT EXECUTE ON FUNCTION shift_school_schedule(UUID, DATE, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION shift_school_schedule(UUID, DATE, INT) TO service_role;
