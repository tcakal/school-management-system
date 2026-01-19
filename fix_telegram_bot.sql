-- FIX TELEGRAM BOT
-- Key Issue: The bot relies on the 'http' extension to talk to Telegram servers.
-- If this extension is missing, the bot fails silently.

-- 1. Create Extension (Schema 'extensions' is best practice)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Grant Permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 3. Fix System Settings Permissions (just in case)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access" ON system_settings;
CREATE POLICY "Enable all access" ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- 4. Reset Update ID (Optional - uncomment if bot is stuck and not reading NEW messages)
-- UPDATE system_settings SET last_telegram_update_id = 0;

-- 5. Test Run (This will output the result in the query result window)
SELECT process_telegram_updates();
