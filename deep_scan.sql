-- DEEP SCAN DIAGNOSTIC

-- 1. TIME CHECK
SELECT 
    now() AT TIME ZONE 'UTC' as raw_utc,
    (now() AT TIME ZONE 'UTC' + interval '3 hours') as turkey_time,
    to_char((now() AT TIME ZONE 'UTC' + interval '3 hours'), 'HH24:MI:SS') as turkey_clock;

-- 2. CRON HISTORY (Last 3 runs)
SELECT 
    start_time, 
    status, 
    return_message
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 3;

-- 3. TEMPLATE LOGIC CHECK
WITH current_time_check AS (
    SELECT (now() AT TIME ZONE 'UTC' + interval '3 hours') as t_now
)
SELECT 
    t.trigger_time as template_time,
    to_char(ct.t_now, 'HH24:MI') as current_time,
    CASE 
        WHEN to_char(ct.t_now, 'HH24:MI') = t.trigger_time THEN '✅ MATCH'
        ELSE '❌ NO MATCH' 
    END as status,
    t.offset_minutes
FROM public.notification_templates t, current_time_check ct
WHERE t.is_active = true AND t.trigger_type = 'fixed_time';
