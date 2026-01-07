-- Enable RLS on all tables (good practice to be explicit, though usually default)
alter table schools enable row level security;
alter table students enable row level security;
alter table class_groups enable row level security;
alter table teachers enable row level security;
alter table teacher_assignments enable row level security;
alter table lessons enable row level security;
alter table attendance enable row level security;
alter table payments enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Enable access to all users" on schools;
drop policy if exists "Enable access to all users" on students;
drop policy if exists "Enable access to all users" on class_groups;
drop policy if exists "Enable access to all users" on teachers;
drop policy if exists "Enable access to all users" on teacher_assignments;
drop policy if exists "Enable access to all users" on lessons;
drop policy if exists "Enable access to all users" on attendance;
drop policy if exists "Enable access to all users" on payments;

-- Create permissive policies for Development (Allows anon users to do everything)
create policy "Enable access to all users" on schools for all using (true) with check (true);
create policy "Enable access to all users" on students for all using (true) with check (true);
create policy "Enable access to all users" on class_groups for all using (true) with check (true);
create policy "Enable access to all users" on teachers for all using (true) with check (true);
create policy "Enable access to all users" on teacher_assignments for all using (true) with check (true);
create policy "Enable access to all users" on lessons for all using (true) with check (true);
create policy "Enable access to all users" on attendance for all using (true) with check (true);
create policy "Enable access to all users" on payments for all using (true) with check (true);
