-- Add color column to branches table
ALTER TABLE branches ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#f97316'; -- Default orange-500
