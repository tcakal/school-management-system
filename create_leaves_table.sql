create table teacher_leaves (
  id uuid primary key,
  teacher_id uuid references teachers(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  type text check (type in ('sick', 'vacation', 'other')),
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table teacher_leaves enable row level security;

-- Policy (Simple open policy for now as per other tables structure assumption, or authenticated)
create policy "Enable all access for authenticated users" on teacher_leaves
  for all using (auth.role() = 'authenticated');
