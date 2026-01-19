-- Add missing columns to students table
-- This fixes the error: "Could not find the 'discount_percentage' column"

ALTER TABLE students ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;

-- Also ensuring payment_status exists as it is often used with discount
ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Refresh the schema cache (handled automatically usually, but good to know)
NOTIFY pgrst, 'reload config';
