DO $$
DECLARE
    v_school_id uuid;
BEGIN
    -- 1. Find the school
    SELECT id INTO v_school_id FROM schools WHERE name = 'Gebze Emlak Konut İlkokulu' LIMIT 1;
    
    IF v_school_id IS NOT NULL THEN
        RAISE NOTICE 'Cleaning up school: %', v_school_id;

        -- 2. Delete Logs linked to this school's templates
        -- (If we delete templates, logs might block it)
        DELETE FROM notification_logs 
        WHERE template_id IN (SELECT id FROM notification_templates WHERE school_id = v_school_id);

        -- 3. Delete Notification Templates (The BLOCKER: 11 records found)
        DELETE FROM notification_templates 
        WHERE school_id = v_school_id;

        -- 4. Delete Teacher Assignments (Just in case)
        DELETE FROM teacher_assignments WHERE school_id = v_school_id;

        -- 5. Delete Class Groups (Just in case)
        DELETE FROM class_groups WHERE school_id = v_school_id;

        -- 6. Finally Delete School
        DELETE FROM schools WHERE id = v_school_id;
        
        RAISE NOTICE 'School deleted successfully.';
    ELSE
        RAISE NOTICE 'School not found.';
    END IF;
END $$;
