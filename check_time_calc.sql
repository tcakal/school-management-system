-- CHECK TIME CALCULATIONS EXACTLY
SELECT 
    to_char(now() AT TIME ZONE 'UTC' + interval '3 hours', 'HH24:MI') as turkey_time_str,
    to_char(now() AT TIME ZONE 'UTC' + interval '3 hours', 'YYYY-MM-DD') as turkey_date_str,
    to_char(now(), 'YYYY-MM-DD HH24:MI:SS') as server_raw_time,
    current_setting('TIMEZONE') as server_timezone_setting;
