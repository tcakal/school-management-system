-- FIX: find_available_teachers function uses non-existent 'branch' column
-- It should use 'specialties' instead.
-- We must DROP the function first because we are changing the return type (table structure).

DROP FUNCTION IF EXISTS public.find_available_teachers(date, text, text);

CREATE OR REPLACE FUNCTION public.find_available_teachers(
    p_date date,
    p_start_time text,
    p_end_time text
)
RETURNS TABLE (
    id uuid,
    name text,
    specialties text[],
    phone text
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.specialties, t.phone
    FROM public.teachers t
    WHERE t.id NOT IN (
        -- 1. Exclude teachers with LESSONS overlapping the time slot
        SELECT l.teacher_id 
        FROM public.lessons l
        WHERE l.date = p_date
          AND l.status != 'cancelled'
          AND l.teacher_id IS NOT NULL
          AND (
              (l.start_time < p_end_time AND l.end_time > p_start_time) -- Standard Overlap Logic
          )
    )
    AND t.id NOT IN (
        -- 2. Exclude teachers with LEAVES covering this date
        SELECT tl.teacher_id
        FROM public.teacher_leaves tl
        WHERE tl.status = 'approved'
          AND p_date BETWEEN tl.start_date AND tl.end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT EXECUTE ON FUNCTION public.find_available_teachers(date, text, text) TO anon, authenticated, service_role;
