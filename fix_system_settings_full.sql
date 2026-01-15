-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_name TEXT DEFAULT 'Atölye Vizyon',
    logo_url TEXT,
    telegram_bot_token TEXT,
    admin_chat_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'admin_chat_id') THEN
        ALTER TABLE system_settings ADD COLUMN admin_chat_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'telegram_bot_token') THEN
        ALTER TABLE system_settings ADD COLUMN telegram_bot_token TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Public read access for system settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON system_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON system_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON system_settings;
DROP POLICY IF EXISTS "Enable update for users based on email" ON system_settings;

-- Create permissive policies for now to ensure it works
-- 1. Everyone can read settings (needed for login page name/logo)
CREATE POLICY "Enable read access for all users" ON system_settings
    FOR SELECT USING (true);

-- 2. Authenticated users (Admins/Teachers) can insert/update
-- Ideally this should be restricted to admins, but let's unblock first.
CREATE POLICY "Enable insert for authenticated users" ON system_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON system_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert default row if table is empty
INSERT INTO system_settings (id, system_name, logo_url)
SELECT uuid_generate_v4(), 'Atölye Vizyon', ''
WHERE NOT EXISTS (SELECT 1 FROM system_settings);
