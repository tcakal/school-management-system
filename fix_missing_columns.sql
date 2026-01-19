-- Add missing columns to students table
-- This fixes the error: "Could not find the 'discount_percentage' column"

ALTER TABLE students ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Add other potential missing columns based on frontend usage
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS grade_level INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Refresh the schema cache
NOTIFY pgrst, 'reload config';
