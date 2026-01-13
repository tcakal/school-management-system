
-- 1. Student Evaluations: Drop Foreign Key constraint first!
do $$
begin
    -- Check for the constraint regarding evaluator_id and drop it if it exists
    -- The name is usually 'student_evaluations_evaluator_id_fkey', but let's be safe
    if exists (select 1 from information_schema.table_constraints where constraint_name = 'student_evaluations_evaluator_id_fkey') then
        alter table student_evaluations drop constraint student_evaluations_evaluator_id_fkey;
    end if;
end $$;

-- 2. Student Evaluations: Add or Update Column
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'student_evaluations' and column_name = 'evaluator_id') then
        alter table student_evaluations add column evaluator_id text;
    else
        -- If already exists (e.g. as UUID), change it to TEXT
        alter table student_evaluations alter column evaluator_id type text;
    end if;
end $$;

-- 3. Teacher Evaluations: Create or Update
create table if not exists teacher_evaluations (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references teachers(id) on delete cascade not null,
  evaluator_id text, -- Text type for flexible admin IDs
  score integer check (score >= 0 and score <= 100),
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Teacher Evaluations: Drop FK if exists (in case it was created with FK before)
do $$
begin
    if exists (select 1 from information_schema.table_constraints where constraint_name = 'teacher_evaluations_evaluator_id_fkey') then
        alter table teacher_evaluations drop constraint teacher_evaluations_evaluator_id_fkey;
    end if;
    
    -- Ensure evaluator_id is text
    if exists (select 1 from information_schema.columns where table_name = 'teacher_evaluations' and column_name = 'evaluator_id') then
         alter table teacher_evaluations alter column evaluator_id type text;
    end if;
end $$;

-- 5. Enable RLS and Policies (Safe to re-run)
alter table student_evaluations enable row level security;
alter table teacher_evaluations enable row level security;

-- Drop and recreate policies to ensure they are correct
drop policy if exists "Enable all for authenticated users" on student_evaluations;
create policy "Enable all for authenticated users" on student_evaluations for all using (true);

drop policy if exists "Enable all for authenticated users" on teacher_evaluations;
create policy "Enable all for authenticated users" on teacher_evaluations for all using (true);
