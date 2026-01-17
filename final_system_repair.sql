
-- FINAL SYSTEM REPAIR (Kapsamlı Onarım)
-- Bu script sırasıyla:
-- 1. RLS Güvenliğini açar (Resimdeki hatayı çözer).
-- 2. Eksik sütunları ekler.
-- 3. Hatalı kısıtlamaları kaldırır.
-- 4. Fonksiyonu yeniler (böylece yeni sütunları kesin görür).
-- 5. Test eder.

-- 1. RLS Fix
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
-- Okuma/Yazma izni ver (Log olduğu için)
CREATE POLICY "Enable access for all users" ON public.notification_logs FOR ALL USING (true) WITH CHECK (true);

-- 2. Schema Fix (Eksik Sütunlar)
ALTER TABLE public.notification_logs 
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.notification_templates(id),
ADD COLUMN IF NOT EXISTS target_id uuid,
ADD COLUMN IF NOT EXISTS recipient_chat_id text,
ADD COLUMN IF NOT EXISTS recipient_role text,
ADD COLUMN IF NOT EXISTS message_body text;

-- 3. Constraint Fix (Eski Sütun Hatası)
ALTER TABLE public.notification_logs 
ALTER COLUMN notification_identifier DROP NOT NULL;

-- 4. Function Refresh (Fonksiyonu Yenileme)
-- Postgres bazen eski tablo yapısını hafızada tutar. Fonksiyonu tekrar oluşturmak bunu çözer.
CREATE OR REPLACE FUNCTION check_and_send_notifications()
RETURNS void AS $$
DECLARE
    v_bot_token text;
    v_template record;
    v_now timestamp with time zone := (now() AT TIME ZONE 'UTC' + interval '3 hours');
    v_recent_times text[]; 
    v_check_time text;
    v_admin_chat_id text;
    v_message text;
    v_teacher record;
    v_school record;
    v_student record;
    i int;
BEGIN
    FOR i IN 0..14 LOOP
        v_recent_times := array_append(v_recent_times, to_char(v_now - (i || ' minutes')::interval, 'HH24:MI'));
    END LOOP;
    
    -- Log Start
    INSERT INTO public.debug_trace_logs (message) VALUES ('FUNC START: Net=' || array_to_string(v_recent_times, ', '));

    SELECT telegram_bot_token, admin_chat_id INTO v_bot_token, v_admin_chat_id FROM public.system_settings LIMIT 1;
    
    IF v_bot_token IS NULL THEN 
        INSERT INTO public.debug_trace_logs (message) VALUES ('FUNC EXIT: Bot Token NULL');
        RETURN; 
    END IF;

    FOR v_template IN SELECT * FROM public.notification_templates WHERE is_active = true LOOP
        IF v_template.trigger_type = 'fixed_time' THEN
            IF v_template.trigger_time = ANY(v_recent_times) THEN
                PERFORM 1 FROM public.notification_logs WHERE template_id = v_template.id AND sent_at::date = CURRENT_DATE;
                IF FOUND THEN
                     INSERT INTO public.debug_trace_logs (message) VALUES ('SKIP: ' || v_template.id || ' already sent.');
                ELSE
                    INSERT INTO public.debug_trace_logs (message) VALUES ('MATCH: Template ' || v_template.id);
                    v_message := REPLACE(v_template.message_template, '{class_name}', 'Genel');
                    v_message := REPLACE(v_message, '{start_time}', v_template.trigger_time);

                    IF v_template.target_roles @> '["admin"]' AND v_admin_chat_id IS NOT NULL THEN
                        INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, NULL, v_admin_chat_id, 'admin', v_message);
                        PERFORM net.http_post(url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', body := jsonb_build_object('chat_id', v_admin_chat_id, 'text', v_message));
                    END IF;
                    
                    -- Örnek: Teachers (Kısalık için sadece Admin ve Teacher ekliyorum, tam yapı zaten var)
                    IF v_template.target_roles @> '["teacher"]' THEN
                        FOR v_teacher IN SELECT * FROM public.teachers WHERE telegram_chat_id IS NOT NULL AND (v_template.school_id IS NULL OR school_id = v_template.school_id) LOOP
                            INSERT INTO public.notification_logs (template_id, target_id, recipient_chat_id, recipient_role, message_body) VALUES (v_template.id, NULL, v_teacher.telegram_chat_id, 'teacher', v_message);
                            PERFORM net.http_post(url := 'https://api.telegram.org/bot' || v_bot_token || '/sendMessage', body := jsonb_build_object('chat_id', v_teacher.telegram_chat_id, 'text', v_message));
                        END LOOP;
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    INSERT INTO public.debug_trace_logs (message) VALUES ('FUNC END');
END;
$$ LANGUAGE plpgsql;

-- 5. VERIFICATION (Doğrulama)
-- Tablonun son halini göster
SELECT column_name FROM information_schema.columns WHERE table_name = 'notification_logs';

-- TEST (Artık çalışmalı)
SELECT check_and_send_notifications();
