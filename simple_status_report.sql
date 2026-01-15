-- Detailed Status Report with Time Verification
SELECT 
    log_time AT TIME ZONE 'Europe/Istanbul' as "Log Zamanı (TR)",
    message as "İşlem",
    details->>'target' as "Hedef Zaman (Sistem)",
    to_char((details->>'current')::timestamp, 'YYYY-MM-DD HH24:MI:SS') as "Şu An (Sistem)",
    concat(round((details->>'diff_minutes')::numeric, 1), ' dk') as "Fark"
FROM debug_notification_logs 
ORDER BY id DESC 
LIMIT 15;
