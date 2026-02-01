-- Fix: Allow NULL school_id for branch-only students
-- Run this in Supabase SQL Editor

ALTER TABLE students ALTER COLUMN school_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'school_id';
