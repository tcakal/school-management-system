
-- UI LOG ACCESS FIX
-- Veritabanında loglar VAR ama UI çekemiyor.
-- Muhtemelen "debug_trace_logs" tablosunun güvenlik ayarları (RLS) eksik kaldı.

-- 1. RLS Güvenliğini Aç
ALTER TABLE public.debug_trace_logs ENABLE ROW LEVEL SECURITY;

-- 2. Herkese Okuma İzni Ver (UI'ın okuyabilmesi için şart)
DROP POLICY IF EXISTS "Allow public read access" ON public.debug_trace_logs;
CREATE POLICY "Allow public read access" ON public.debug_trace_logs FOR SELECT USING (true);

-- 3. Yazma İzni de Ver (Sistem/Test için)
DROP POLICY IF EXISTS "Allow public insert access" ON public.debug_trace_logs;
CREATE POLICY "Allow public insert access" ON public.debug_trace_logs FOR INSERT WITH CHECK (true);

-- 4. Anonim kullanıcılara (Frontend) izinleri onayla
GRANT SELECT, INSERT ON public.debug_trace_logs TO anon, authenticated, service_role;

-- 5. Test (Manuel) - Bu sorgu zaten çalışıyordu ama UI için Policy önemli.
SELECT count(*) as log_sayisi FROM public.debug_trace_logs;
