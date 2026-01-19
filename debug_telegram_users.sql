-- DEBUG: Check Teacher Telegram Connections
-- Lists all teachers and whether they have a linked Telegram Chat ID.

SELECT 
    name, 
    phone, 
    CASE 
        WHEN telegram_chat_id IS NOT NULL THEN '✅ BAĞLI (' || telegram_chat_id || ')'
        ELSE '❌ BAĞLI DEĞİL' 
    END as status,
    school_id
FROM teachers
ORDER BY telegram_chat_id DESC NULLS LAST, name ASC;

-- Also check how many total users are connected
SELECT 'Total Connected Teachers' as metric, COUNT(*) as count FROM teachers WHERE telegram_chat_id IS NOT NULL
UNION ALL
SELECT 'Total Connected Students', COUNT(*) FROM students WHERE telegram_chat_id IS NOT NULL;
