-- Deep Diagnose Maker Fair
-- 1. Try to INSERT a test project via SQL (as anon) to confirm permissions work
DO $$
BEGIN
    INSERT INTO maker_projects (id, school_id, name, description, status, created_at)
    VALUES (gen_random_uuid(), 'test-school-id', 'Test Project SQL', 'Created via SQL Diagnosis', 'active', now());
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Insert failed: %', SQLERRM;
END $$;

-- 2. Select all projects (to see if any exist and what their school_id is)
SELECT id, school_id, name, created_at FROM maker_projects;

-- 3. Check Policies again
SELECT * FROM pg_policies WHERE tablename = 'maker_projects';
