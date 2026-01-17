
-- FIX: Create missing 'teacher_leaves' table
-- Error 404 in console -> Table is missing.

CREATE TABLE IF NOT EXISTS public.teacher_leaves (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES public.teachers(id),
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_leaves ENABLE ROW LEVEL SECURITY;

-- Allow access (Adjust as strict/open as needed, putting open for now to fix 404)
CREATE POLICY "Enable read access for all users" ON public.teacher_leaves FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.teacher_leaves FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.teacher_leaves FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.teacher_leaves FOR DELETE USING (true);

GRANT ALL ON public.teacher_leaves TO anon, authenticated, service_role;
