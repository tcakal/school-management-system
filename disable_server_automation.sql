-- Disable server side automation to avoid conflicts
SELECT cron.unschedule('check_notifications_job');
DROP FUNCTION IF EXISTS check_and_send_notifications();
