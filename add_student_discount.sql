-- Add discount_percentage column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

-- Comment on column
COMMENT ON COLUMN students.discount_percentage IS '0 = Full Pay, 100 = Free, 1-99 = Discounted';
