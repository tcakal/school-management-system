-- =====================================================
-- DERSLER TAŞIMA SCRIPTI
-- Bu script tüm "scheduled" dersleri siler ve 
-- 2 Şubat haftasından itibaren yeniden oluşturulmasını sağlar
-- =====================================================

-- 1. ADIM: Sadece OKUL derslerini sil (etkinlikleri değil)
-- Etkinlik olmayan okulların scheduled derslerini sil
DELETE FROM lessons 
WHERE status = 'scheduled'
AND school_id IN (
    SELECT id FROM schools WHERE type = 'school' OR type IS NULL
);

-- 2. ADIM: Etrafta kalan eski etkinlik derslerini de temizle (opsiyonel)
-- Etkinlik derslerini de temizlemek isterseniz bu satırı da çalıştırın:
-- DELETE FROM lessons WHERE status = 'scheduled' AND school_id IN (SELECT id FROM schools WHERE type = 'event');

-- Kontrol: Kalan dersleri görüntüle
SELECT 
    l.id,
    l.date,
    l.start_time,
    l.status,
    s.name as school_name,
    s.type as school_type
FROM lessons l
JOIN schools s ON l.school_id = s.id
WHERE l.status = 'scheduled'
ORDER BY l.date
LIMIT 20;
