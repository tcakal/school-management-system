-- FIX FOREIGN KEY ERROR
-- Run this in Supabase SQL Editor.

-- This command syncs your Branches into the 'schools' table.
-- This is required because assignments currently only accept 'schools' IDs.
-- By copying branches here, we satisfy the database rule.

INSERT INTO schools (id, name, type, address, phone, color)
SELECT 
  id, 
  name, 
  'branch', 
  address, 
  phone, 
  color
FROM branches
WHERE id NOT IN (SELECT id FROM schools)
ON CONFLICT (id) DO NOTHING;
