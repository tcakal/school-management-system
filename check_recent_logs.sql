-- Check recent system logs
SELECT * FROM public.system_logs 
ORDER BY created_at DESC 
LIMIT 10;
