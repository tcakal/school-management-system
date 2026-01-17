-- MANUAL TRIGGER TEST
-- This runs the logic IMMEDIATELY without waiting for the minute to tick.

BEGIN;

    -- 1. Run the function
    SELECT check_and_send_notifications();

    -- 2. Check if it generated any logs right now
    SELECT * FROM public.activity_logs 
    WHERE user_id = 'system-auto' 
    ORDER BY created_at DESC 
    LIMIT 5;

COMMIT;
