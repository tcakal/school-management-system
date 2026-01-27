
-- 1. Update Schools Table
ALTER TABLE schools ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'school'; -- 'school' or 'event'
ALTER TABLE schools ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS notes TEXT; -- General event notes

-- 2. Update Teachers Table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'regular'; -- 'regular' or 'guest'

-- 3. Verify Columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('schools', 'teachers') AND column_name IN ('type', 'event_date', 'notes');
