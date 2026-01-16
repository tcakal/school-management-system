-- Simulate Frontend Access (JSON Fixed)

-- 1. Insert a test log (Correct JSON format)
INSERT INTO debug_notification_logs (message, details) 
VALUES ('TEST LOG ENTRY', '{"info": "RLS Check"}'::jsonb);

-- 2. Switch to "authenticated" role
SET ROLE authenticated;

-- 3. Try to Read logs
SELECT * FROM debug_notification_logs ORDER BY id DESC LIMIT 5;

-- 4. Reset Role
RESET ROLE;
