-- Enable HTTP extension for synchronous API calls
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Add connection code columns to teachers table (Idempotent)
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS connect_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS connect_code_expires TIMESTAMP WITH TIME ZONE;

-- Add connection code columns to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS connect_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS connect_code_expires TIMESTAMP WITH TIME ZONE;

-- Function to generate a random 6-digit code (Polymorphic)
CREATE OR REPLACE FUNCTION generate_telegram_code(p_entity_id UUID, p_type TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
BEGIN
    -- Validate Type
    IF p_type NOT IN ('teacher', 'student') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid type. Must be teacher or student.');
    END IF;

    -- Generate 6 digit random code
    v_code := floor(random() * (999999 - 100000 + 1) + 100000)::text;
    
    -- Update record based on type
    IF p_type = 'teacher' THEN
        UPDATE teachers 
        SET connect_code = v_code,
            connect_code_expires = NOW() + INTERVAL '5 minutes'
        WHERE id = p_entity_id;
    ELSIF p_type = 'student' THEN
        UPDATE students
        SET connect_code = v_code,
            connect_code_expires = NOW() + INTERVAL '5 minutes'
        WHERE id = p_entity_id;
    END IF;
    
    RETURN jsonb_build_object('success', true, 'code', v_code);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to check Telegram updates and link user (Polymorphic)
CREATE OR REPLACE FUNCTION verify_telegram_connection(p_entity_id UUID, p_type TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bot_token TEXT;
    v_code TEXT;
    v_expires TIMESTAMP WITH TIME ZONE;
    v_response_status INTEGER;
    v_response_body TEXT;
    v_updates JSONB;
    v_update JSONB;
    v_message_text TEXT;
    v_chat_id BIGINT;
    v_found BOOLEAN := false;
    v_sender_username TEXT;
BEGIN
     -- Validate Type
    IF p_type NOT IN ('teacher', 'student') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid type. Must be teacher or student.');
    END IF;

    -- 1. Get Active Code based on Type
    IF p_type = 'teacher' THEN
        SELECT connect_code, connect_code_expires 
        INTO v_code, v_expires
        FROM teachers 
        WHERE id = p_entity_id;
    ELSIF p_type = 'student' THEN
        SELECT connect_code, connect_code_expires 
        INTO v_code, v_expires
        FROM students 
        WHERE id = p_entity_id;
    END IF;
    
    IF v_code IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active code found. Generate one first.');
    END IF;
    
    IF v_expires < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Code expired. Generate a new one.');
    END IF;

    -- 2. Get Bot Token
    SELECT telegram_bot_token INTO v_bot_token FROM system_settings LIMIT 1;
    
    IF v_bot_token IS NULL OR v_bot_token = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bot token not configured.');
    END IF;

    -- 3. Call Telegram getUpdates via HTTP extension
    SELECT status, content::text
    INTO v_response_status, v_response_body
    FROM extensions.http_get('https://api.telegram.org/bot' || v_bot_token || '/getUpdates');
    
    IF v_response_status != 200 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Failed to contact Telegram API. Status: ' || v_response_status);
    END IF;

    v_updates := (v_response_body::jsonb) -> 'result';

    -- 4. Iterate updates
    IF v_updates IS NULL OR jsonb_array_length(v_updates) = 0 THEN
         RETURN jsonb_build_object('success', false, 'message', 'No updates found from Telegram.');
    END IF;
    
    FOR v_update IN SELECT * FROM jsonb_array_elements(v_updates)
    LOOP
        v_message_text := v_update -> 'message' ->> 'text';
        
        -- Check if message contains the code
        IF v_message_text IS NOT NULL AND (
            v_message_text = v_code OR 
            v_message_text = ('/start ' || v_code)
        ) THEN
            -- FOUND MATCH!
            v_chat_id := (v_update -> 'message' -> 'chat' ->> 'id')::bigint;
            v_sender_username := v_update -> 'message' -> 'from' ->> 'username';
            
            -- Update the record
            IF p_type = 'teacher' THEN
                UPDATE teachers 
                SET telegram_chat_id = v_chat_id::text,
                    connect_code = NULL,
                    connect_code_expires = NULL
                WHERE id = p_entity_id;
            ELSIF p_type = 'student' THEN
                UPDATE students 
                SET telegram_chat_id = v_chat_id::text,
                    connect_code = NULL,
                    connect_code_expires = NULL
                WHERE id = p_entity_id;
            END IF;
            
            v_found := true;
            EXIT;
        END IF;
    END LOOP;
    
    IF v_found THEN
        RETURN jsonb_build_object(
            'success', true, 
            'chat_id', v_chat_id,
            'username', v_sender_username
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Code not found in recent messages yet.');
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
