-- Add 'is_active' column to teachers for access control
-- Default to true for existing users
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure Students have 'status' column (already exists, but good to double check constraint if needed)
-- Students table typically has status 'Active'/'Left'.
