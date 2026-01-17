
-- DOĞRULAMA (VERIFICATION)
-- 1. Tabloda hiç veri var mı kontrol et.
SELECT count(*) as toplam_log_sayisi FROM public.debug_trace_logs;

-- 2. Son 10 logu getir (Varsa)
SELECT * FROM public.debug_trace_logs ORDER BY log_time DESC LIMIT 10;

-- 3. Elle (Manuel) bir log ekle (TEST İÇİN)
INSERT INTO public.debug_trace_logs (message) VALUES ('MANUEL TEST: DB Erişim Kontrolü ' || now());

-- 4. Tekrar Kontrol Et (Eklediğimiz geldi mi?)
SELECT * FROM public.debug_trace_logs ORDER BY log_time DESC LIMIT 5;
