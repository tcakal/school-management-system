-- Add Payment Tracking Columns to Students Table

ALTER TABLE students
ADD COLUMN IF NOT EXISTS last_payment_status text DEFAULT 'pending', -- 'paid', 'claimed', 'pending'
ADD COLUMN IF NOT EXISTS last_payment_date date,
ADD COLUMN IF NOT EXISTS last_claim_date date;

-- Add check constraint for status
ALTER TABLE students
ADD CONSTRAINT check_payment_status 
CHECK (last_payment_status IN ('paid', 'claimed', 'pending'));
