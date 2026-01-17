-- AUDIT TEMPLATE QUERY
-- This script updates the function to log exactly what it sees in the database.

CREATE OR REPLACE FUNCTION check_and_send_notifications()
RETURNS void AS $$
DECLARE
    v_bot_token text;
    v_template record;
    v_now timestamp with time zone := (now() AT TIME ZONE 'UTC' + interval '3 hours');
    v_current_time_str text;
    v_active_count int;
BEGIN
    v_current_time_str := to_char(v_now, 'HH24:MI');
    
    INSERT INTO public.debug_trace_logs (message) VALUES ('FUNC START: System Time=' || v_current_time_str);

    -- 1. Check Settings
    SELECT telegram_bot_token INTO v_bot_token FROM public.system_settings LIMIT 1;
    IF v_bot_token IS NULL THEN 
        INSERT INTO public.debug_trace_logs (message) VALUES ('EXIT: Bot Token IS NULL');
        RETURN; 
    END IF;
    INSERT INTO public.debug_trace_logs (message) VALUES ('SETTINGS: Token Found.');

    -- 2. Count Active Templates (Diagnostic)
    SELECT count(*) INTO v_active_count FROM public.notification_templates WHERE is_active = true;
    INSERT INTO public.debug_trace_logs (message) VALUES ('DB CHECK: Found ' || v_active_count || ' active templates.');

    -- 3. Iterate
    FOR v_template IN SELECT * FROM public.notification_templates WHERE is_active = true LOOP
        INSERT INTO public.debug_trace_logs (message) VALUES ('LOOP: Processing ' || v_template.id || ' Type=' || v_template.trigger_type);
        
        IF v_template.trigger_type = 'fixed_time' THEN
             INSERT INTO public.debug_trace_logs (message) VALUES (' > CHECK TIME: ' || v_template.trigger_time || ' vs ' || v_current_time_str);
             
             -- (Send logic matches previous steps, simplified here for audit)
             IF v_template.trigger_time = v_current_time_str THEN
                INSERT INTO public.debug_trace_logs (message) VALUES (' > MATCH!!!');
                -- Real logic would go here
             END IF;
        END IF;
    END LOOP;
    
    INSERT INTO public.debug_trace_logs (message) VALUES ('FUNC END');
END;
$$ LANGUAGE plpgsql;
