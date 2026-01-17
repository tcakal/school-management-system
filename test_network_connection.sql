-- TEST NETWORK CONNECTION
-- Attempts to reach Telegram API directly to verify pg_net is working.

DO $$
DECLARE
    v_bot_token text;
    v_request_id int;
BEGIN
    SELECT telegram_bot_token INTO v_bot_token FROM public.system_settings LIMIT 1;
    
    IF v_bot_token IS NULL THEN
        RAISE NOTICE 'FAIL: No Bot Token found.';
        RETURN;
    END IF;

    RAISE NOTICE 'Testing connection to Telegram API...';
    
    -- Sync request is not possible with pg_net usually, so we just fire it and assume if no error, it's queued.
    -- But we can use http extension if available, or just check if performs without error.
    
    PERFORM net.http_get(
        url := 'https://api.telegram.org/bot' || v_bot_token || '/getMe'
    );
    
    RAISE NOTICE 'Request Sent. Check pg_net tables for status if possible, or check if you receive any response traces if configured.';
    
    -- Insert a log entry to confirm we tried
    INSERT INTO public.debug_trace_logs (message) VALUES ('MANUAL NETWORK TEST: Fired getMe request');
END;
$$;
