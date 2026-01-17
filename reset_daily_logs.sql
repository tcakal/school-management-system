-- RESET DAILY LOGS
-- Clears the memory of "Already Sent Today" so we can re-test.

DELETE FROM public.notification_logs 
WHERE sent_at::date = CURRENT_DATE;

INSERT INTO public.debug_trace_logs (message) VALUES ('MANUAL RESET: Daily logs cleared. Ready to re-fire.');
