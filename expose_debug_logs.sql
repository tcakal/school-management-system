-- EXPOSE DEBUG LOGS TO UI
-- This allows the Frontend to query 'debug_trace_logs' directly.

-- 1. Enable RLS
ALTER TABLE public.debug_trace_logs ENABLE ROW LEVEL SECURITY;

-- 2. Allow Read Access (Public for debugging)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.debug_trace_logs;
CREATE POLICY "Enable read access for all users" ON public.debug_trace_logs
    FOR SELECT USING (true);

-- 3. Allow Insert Access (For manual tests from UI if needed, or system)
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.debug_trace_logs;
CREATE POLICY "Enable insert access for all users" ON public.debug_trace_logs
    FOR INSERT WITH CHECK (true);

-- 4. Grant Permissions (Just to be sure)
GRANT ALL ON public.debug_trace_logs TO anon, authenticated, service_role;

INSERT INTO public.debug_trace_logs (message) VALUES ('SYSTEM: UI Access Enabled via RLS');
