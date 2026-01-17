-- Supabase Database Cron Job Kurulumu (Düzeltilmiş)
-- 'could not find valid entry' hatasını önlemek için silme komutu kaldırıldı.

-- 1. pg_cron eklentisini aktif et
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Dakikada bir çalışacak job'ı oluştur
-- Her dakika (*) process_telegram_updates() fonksiyonunu çağırır.
SELECT cron.schedule(
    'telegram-bot-check-auto', -- Görev adı
    '* * * * *',               -- Zamanlama (Her dakika)
    'SELECT process_telegram_updates()'
);

-- 3. Job'ın başarıyla oluştuğunu kontrol et
SELECT * FROM cron.job;
