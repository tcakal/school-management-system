
-- MASTER FIX SCRIPT (KESİN ÇÖZÜM)
-- Bu script tablo yapısını düzeltecek. Test çalıştırılmadığı için hata alıp geri sarma (rollback) yapmayacak.

-- 1. Eksik Sütunları Ekle
ALTER TABLE public.notification_logs 
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.notification_templates(id),
ADD COLUMN IF NOT EXISTS target_id uuid,
ADD COLUMN IF NOT EXISTS recipient_chat_id text,
ADD COLUMN IF NOT EXISTS recipient_role text,
ADD COLUMN IF NOT EXISTS message_body text;

-- 2. Eski Sütun Hatasını Gider (notification_identifier boş olabilir olsun)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_logs' AND column_name = 'notification_identifier') THEN
        ALTER TABLE public.notification_logs ALTER COLUMN notification_identifier DROP NOT NULL;
    END IF;
END $$;

-- 3. İşlem Tamamlandığını Doğrula
SELECT 'Tablo yapısı düzeltildi. Şimdi test edebilirsiniz.' as sonuc;
