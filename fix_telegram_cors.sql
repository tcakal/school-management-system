-- Transaction
BEGIN;

-- Create a secure function to send Telegram messages via usage of pg_net extension
-- This allows the browser to call Supabase -> Supabase calls Telegram
-- Bypassing CORS isues.

CREATE OR REPLACE FUNCTION send_telegram_message(p_chat_id TEXT, p_message TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with permission of creator (postgres), allows reading settings
AS $$
DECLARE
    v_bot_token TEXT;
    v_url TEXT;
    v_body JSONB;
    v_request_id INT;
BEGIN
    -- 1. Get Bot Token from Settings (Securely)
    SELECT telegram_bot_token INTO v_bot_token FROM system_settings LIMIT 1;
    
    IF v_bot_token IS NULL OR v_bot_token = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bot token not found in settings');
    END IF;

    -- 2. Validate Inputs
    IF p_chat_id IS NULL OR p_chat_id = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Chat ID is required');
    END IF;

    -- 3. Construct URL and Body
    v_url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage';
    v_body := jsonb_build_object(
        'chat_id', p_chat_id,
        'text', p_message,
        'parse_mode', 'Markdown'
    );

    -- 4. Send Request using pg_net (Async)
    -- pg_net requests are asynchronous by default, but we can return success immediately
    -- Note: We can't easily get the *response* body synchronously from pg_net in standard RPC without polling
    -- But for a 'fire and forget' usage (notification), this is acceptable.
    PERFORM net.http_post(
        url := v_url,
        body := v_body
    );

    -- Return success immediately (assuming queued correctly)
    RETURN jsonb_build_object('success', true, 'message', 'Message queued for delivery');
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMIT;
