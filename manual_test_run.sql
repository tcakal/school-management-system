-- MANUAL TRIGGER TEST
-- This runs the function directly, bypassing Cron.
-- If this fails, we will see the SQL Error.

DO $$
BEGIN
    RAISE NOTICE '--- STARTING MANUAL RUN ---';
    PERFORM public.check_and_send_notifications();
    RAISE NOTICE '--- MANUAL RUN FINISHED SUCCESSFULLY ---';
    RAISE NOTICE 'Check your phone now!';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '!!! ERROR DURING MANUAL RUN !!!';
    RAISE NOTICE '% %', SQLERRM, SQLSTATE;
END;
$$;
