
-- DEBUG: View function definition to find the crash cause
SELECT pg_get_functiondef('public.process_telegram_updates'::regproc);
