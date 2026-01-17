-- Add last_telegram_update_id to system_settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS last_telegram_update_id BIGINT DEFAULT 0;

-- Function to PROCESS ALL UPDATES
CREATE OR REPLACE FUNCTION process_telegram_updates()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bot_token TEXT;
    v_last_update_id BIGINT;
    v_response_status INTEGER;
    v_response_body TEXT;
    v_updates JSONB;
    v_update JSONB;
    v_update_id BIGINT;
    v_message_text TEXT;
    v_chat_id BIGINT;
    v_contact_phone TEXT;
    v_processed_count INT := 0;
    v_matched_count INT := 0;
    v_failed_count INT := 0;
    
    v_teacher_id UUID;
    v_teacher_name TEXT;
    v_student_id UUID;
    v_student_name TEXT;
    v_school_id UUID;
    v_school_name TEXT;
    
    v_reply_text TEXT;
    v_keyboard JSONB;
BEGIN
    -- 1. Get Settings
    SELECT telegram_bot_token, COALESCE(last_telegram_update_id, 0)
    INTO v_bot_token, v_last_update_id
    FROM system_settings LIMIT 1;
    
    IF v_bot_token IS NULL OR v_bot_token = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bot token not configured.');
    END IF;

    -- 2. Fetch Updates
    SELECT status, content::text
    INTO v_response_status, v_response_body
    FROM extensions.http_get(
        'https://api.telegram.org/bot' || v_bot_token || '/getUpdates?offset=' || (v_last_update_id + 1)
    );
    
    IF v_response_status != 200 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Telegram API Error: ' || v_response_status);
    END IF;

    v_updates := (v_response_body::jsonb) -> 'result';

    IF v_updates IS NULL OR jsonb_array_length(v_updates) = 0 THEN
         RETURN jsonb_build_object('success', true, 'message', 'No new messages.', 'processed', 0);
    END IF;

    -- 3. Loop Updates
    FOR v_update IN SELECT * FROM jsonb_array_elements(v_updates)
    LOOP
        v_update_id := (v_update ->> 'update_id')::bigint;
        v_message_text := v_update -> 'message' ->> 'text';
        v_chat_id := (v_update -> 'message' -> 'chat' ->> 'id')::bigint;
        v_contact_phone := v_update -> 'message' -> 'contact' ->> 'phone_number';
        
        v_processed_count := v_processed_count + 1;
        v_keyboard := NULL;
        v_reply_text := NULL;

        -- CASE A: Contact Shared
        IF v_contact_phone IS NOT NULL THEN
            -- Normalize Phone (Last 10 digits)
            -- Remove all non-digits, take right 10 chars
            v_contact_phone := RIGHT(REGEXP_REPLACE(v_contact_phone, '[^0-9]', '', 'g'), 10);
            
            -- 1. Search Teachers (includes Admins)
            -- Note: Teachers phone format in DB might vary. We try to match last 10 digits too.
            SELECT id, name INTO v_teacher_id, v_teacher_name
            FROM teachers 
            WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = v_contact_phone
            LIMIT 1;
            
            -- 2. Search Students (Parents)
            IF v_teacher_id IS NULL THEN
                SELECT id, name INTO v_student_id, v_student_name
                FROM students
                WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = v_contact_phone
                LIMIT 1;
            END IF;
            
            -- 3. Search Schools (Managers)
            IF v_teacher_id IS NULL AND v_student_id IS NULL THEN
                SELECT id, name INTO v_school_id, v_school_name
                FROM schools
                WHERE RIGHT(REGEXP_REPLACE(manager_phone, '[^0-9]', '', 'g'), 10) = v_contact_phone
                LIMIT 1;
            END IF;
            
            -- UPDATE & REPLY
            IF v_teacher_id IS NOT NULL THEN
                UPDATE teachers SET telegram_chat_id = v_chat_id::text WHERE id = v_teacher_id;
                v_reply_text := '✅ Merhaba Öğretmenim/Yöneticim (' || v_teacher_name || ')! Numaranız doğrulandı ve hesabınız eşleştirildi.';
                v_matched_count := v_matched_count + 1;
            ELSIF v_student_id IS NOT NULL THEN
                UPDATE students SET telegram_chat_id = v_chat_id::text WHERE id = v_student_id;
                v_reply_text := '✅ Merhaba Sayın Veli (' || v_student_name || '). Numaranız doğrulandı ve hesabınız eşleştirildi.';
                v_matched_count := v_matched_count + 1;
            ELSIF v_school_id IS NOT NULL THEN
                UPDATE schools SET telegram_chat_id = v_chat_id::text WHERE id = v_school_id;
                v_reply_text := '✅ Merhaba Okul Müdürü (' || v_school_name || '). Numaranız doğrulandı, kurumsal bildirimler buraya gelecek.';
                 v_matched_count := v_matched_count + 1;
            ELSE
                 v_reply_text := '❌ Bu telefon numarası (' || v_contact_phone || ') sistemde kayıtlı hiçbir kullanıcı ile eşleşmedi. Lütfen okul yönetimiyle iletişime geçin.';
                 v_failed_count := v_failed_count + 1;
            END IF;
            
            -- Remove keyboard after contact share
            v_keyboard := jsonb_build_object('remove_keyboard', true);


        -- CASE B: Text Message (Try code or Ask for Contact)
        ELSE
             -- Try Code Match First (Legacy support + safety)
             v_message_text := trim(v_message_text);
             IF v_message_text LIKE '/start %' THEN v_message_text := trim(substring(v_message_text from 8)); END IF;
             
             -- ... (Keep existing code logic if desired, or skip it. Let's keep it for fallback)
             SELECT id, name INTO v_teacher_id, v_teacher_name FROM teachers WHERE connect_code = v_message_text AND connect_code_expires > NOW();
             IF v_teacher_id IS NULL THEN
                SELECT id, name INTO v_student_id, v_student_name FROM students WHERE connect_code = v_message_text AND connect_code_expires > NOW();
             END IF;
             
             IF v_teacher_id IS NOT NULL THEN
                  UPDATE teachers SET telegram_chat_id = v_chat_id::text, connect_code = NULL, connect_code_expires = NULL WHERE id = v_teacher_id;
                  v_reply_text := '✅ Kod ile giriş başarılı! Merhaba ' || v_teacher_name;
                  v_matched_count := v_matched_count + 1;
             ELSIF v_student_id IS NOT NULL THEN
                  UPDATE students SET telegram_chat_id = v_chat_id::text, connect_code = NULL, connect_code_expires = NULL WHERE id = v_student_id;
                  v_reply_text := '✅ Kod ile giriş başarılı! Merhaba ' || v_student_name;
                  v_matched_count := v_matched_count + 1;
             ELSE
                  -- NO CODE MATCH -> ASK FOR CONTACT
                  v_reply_text := 'Sisteme kaydolmak için lütfen aşağıdaki butona tıklayarak telefon numaranızı paylaşın.';
                  v_keyboard := jsonb_build_object(
                      'keyboard', jsonb_build_array(
                          jsonb_build_array(
                              jsonb_build_object(
                                  'text', '📱 Telefon Numaramı Paylaş',
                                  'request_contact', true
                              )
                          )
                      ),
                      'resize_keyboard', true,
                      'one_time_keyboard', true
                  );
             END IF;
        END IF;

        -- Send Message (using http_post directly to support keyboard)
        IF v_reply_text IS NOT NULL THEN
            PERFORM extensions.http_post(
                'https://api.telegram.org/bot' || v_bot_token || '/sendMessage',
                jsonb_build_object(
                    'chat_id', v_chat_id,
                    'text', v_reply_text,
                    'reply_markup', v_keyboard
                ),
                'application/json'
            );
        END IF;

        -- Update Offset
        IF v_update_id > v_last_update_id THEN
            v_last_update_id := v_update_id;
        END IF;
        
    END LOOP;

    -- 4. Update Settings
    UPDATE system_settings SET last_telegram_update_id = v_last_update_id WHERE TRUE;

    RETURN jsonb_build_object(
        'success', true, 
        'processed', v_processed_count, 
        'matched', v_matched_count
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
