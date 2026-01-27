
-- Drop the existing constraint if it exists (usually just a check constraint on the column or none if simple text)
-- Re-add with new allowed values
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_type_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_type_check CHECK (type IN ('regular', 'makeup', 'extra'));
