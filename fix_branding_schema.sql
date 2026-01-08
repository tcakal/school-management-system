-- Ensure branding columns exist in the schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Notify PostgREST to reload the schema cache
-- This ensures Supabase API picks up the new columns immediately
NOTIFY pgrst, 'reload schema';
