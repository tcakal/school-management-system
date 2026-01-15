
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to process notifications
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE;
    v_today_date DATE;
    v_current_time TIME;
    v_settings RECORD;
    v_lesson RECORD;
    v_template RECORD;
    v_recipients TEXT[];
    v_message TEXT;
    v_chat_id TEXT;
    v_response_id BIGINT;
    v_id_key TEXT;
    v_already_sent BOOLEAN;
BEGIN
    -- Get current Istanbul time
    v_now := NOW() AT TIME ZONE 'Europe/Istanbul';
    v_today_date := v_now::DATE;
    v_current_time := v_now::TIME;

    -- Get System Settings (Bot Token)
    SELECT * INTO v_settings FROM system_settings LIMIT 1;
    
    IF v_settings.telegram_bot_token IS NULL OR v_settings.telegram_bot_token = '' THEN
        RAISE NOTICE 'Bot token missing';
        RETURN;
    END IF;

    -- 1. LOOP THROUGH ACTIVE TEMPLATES
    FOR v_template IN SELECT * FROM notification_templates WHERE is_active = true LOOP
        
        -- A. LESSON START TRIGGERS
        IF v_template.trigger_type = 'lesson_start' THEN
            FOR v_lesson IN 
                SELECT l.*, g.name as group_name, t.telegram_chat_id as teacher_chat_id
                FROM lessons l
                JOIN class_groups g ON l.class_group_id = g.id
                LEFT JOIN teachers t ON l.teacher_id = t.id
                WHERE l.date = v_today_date::TEXT
                AND l.school_id = v_template.school_id
                AND (v_template.class_group_id IS NULL OR l.class_group_id = v_template.class_group_id)
                AND l.status != 'cancelled'
            LOOP
                -- Calculate trigger time
                -- (Simplification: assuming offset is 0 or handled by window check)
                -- We check if lesson start time is roughly NOW (within 5 mins window)
                -- Need rigorous time math here in SQL...
                -- Skipping complex math for brevity in this scratchpad, will implement fully in file.
            END LOOP;
        END IF;

    END LOOP;

END;
$$;
