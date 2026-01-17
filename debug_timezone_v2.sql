-- DEBUG TIMEZONE SETTINGS (BETTER VERSION)

-- 1. Check current server configuration
SHOW timezone;

-- 2. Check Raw Time vs UTC vs Offset
SELECT 
    now() as raw_now,
    current_setting('TIMEZONE') as server_timezone,
    now() AT TIME ZONE 'UTC' as explicit_utc,
    (now() AT TIME ZONE 'UTC' + interval '3 hours') as tr_time_plus_3,
    (now() AT TIME ZONE 'UTC' + interval '8 hours') as tr_time_plus_8;
