-- Add enrollment type to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(20) DEFAULT '4week';

-- Add pricing columns to branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS price_4week NUMERIC(10,2);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS price_12week NUMERIC(10,2);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS price_daily NUMERIC(10,2);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS price_hourly NUMERIC(10,2);

-- Copy default_price to price_4week for existing branches
UPDATE branches SET price_4week = default_price WHERE default_price IS NOT NULL AND price_4week IS NULL;
