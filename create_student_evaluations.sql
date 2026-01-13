
-- Create student_evaluations table
create table if not exists student_evaluations (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade not null,
  teacher_id uuid references teachers(id) on delete set null,
  score integer check (score >= 0 and score <= 100),
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table student_evaluations enable row level security;

-- Policy
create policy "Enable all for authenticated users" on student_evaluations for all using (true);
