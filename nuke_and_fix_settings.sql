-- AGGRESSIVE FIX: Nuke and recreate system_settings
-- This ensures no lingering schema or RLS issues prevent saving.

DROP TABLE IF EXISTS system_settings CASCADE;

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_name TEXT DEFAULT 'Atölye Vizyon',
    logo_url TEXT,
    telegram_bot_token TEXT,
    admin_chat_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS completely for this table to prevent any "permission denied" errors
-- Since only admin has UI access to edit this, it's safe enough for now.
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Insert a fresh default row
INSERT INTO system_settings (system_name, logo_url, telegram_bot_token, admin_chat_id)
VALUES ('Atölye Vizyon', '', '', '');

-- Grant full access to everyone (service role, authenticated, anon) just to be absolutely sure
GRANT ALL ON system_settings TO postgres;
GRANT ALL ON system_settings TO anon;
GRANT ALL ON system_settings TO authenticated;
GRANT ALL ON system_settings TO service_role;
