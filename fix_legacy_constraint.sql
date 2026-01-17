
-- FIX: "notification_identifier" Column Error
-- Sorun: 'notification_identifier' adında eski bir sütun var ve BOŞ (NULL) olamaz diye ayarlanmış.
-- Çözüm: Bu kısıtlamayı kaldırıyoruz ki yeni sistemimiz çalışabilsin.

ALTER TABLE public.notification_logs 
ALTER COLUMN notification_identifier DROP NOT NULL;

-- Eğer bu sütun için bir 'default' değer yoksa, ve ilerde lazım olursa diye (opsiyonel):
-- ALTER TABLE public.notification_logs ALTER COLUMN notification_identifier SET DEFAULT gen_random_uuid();

-- TEST: Bildirim fonksiyonunu tekrar manuel çalıştır
SELECT check_and_send_notifications();
