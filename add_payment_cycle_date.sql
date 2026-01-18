-- Add payment_cycle_start_date to schools table
-- This date acts as the anchor for 4-week payment periods.

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS payment_cycle_start_date DATE DEFAULT CURRENT_DATE;

COMMENT ON COLUMN schools.payment_cycle_start_date IS 'Anchor date for calculating 4-week payment cycles';
