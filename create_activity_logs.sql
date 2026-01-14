-- Create Activity Logs Table
create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null, -- Can be UUID or 'super-admin'
  user_name text,
  user_role text,
  action text not null,
  details text,
  entity_type text, -- 'student', 'teacher', 'payment', 'school', 'system'
  entity_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table activity_logs enable row level security;

-- Create Policy (Allow all for now in Dev, similar to others)
create policy "Enable access to all users" on activity_logs for all using (true);

-- Create Index for faster sorting/filtering
create index if not exists idx_activity_logs_created_at on activity_logs(created_at desc);
create index if not exists idx_activity_logs_user_role on activity_logs(user_role);
create index if not exists idx_activity_logs_action on activity_logs(action);
