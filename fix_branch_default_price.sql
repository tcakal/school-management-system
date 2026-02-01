-- Add default_price column to branches table for pricing branch students
-- Run this in Supabase SQL Editor

ALTER TABLE branches ADD COLUMN IF NOT EXISTS default_price NUMERIC(10,2) DEFAULT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'branches' AND column_name = 'default_price';
