-- FIX CRON CONNECTION HOST
-- Updates the nodename to 127.0.0.1 to avoid localhost/IPv6 issues.

UPDATE cron.job
SET nodename = '127.0.0.1'
WHERE jobid = 12;

-- Confirm the change
SELECT * FROM cron.job WHERE jobid = 12;
