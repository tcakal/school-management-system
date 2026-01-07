-- Add notes column to lessons table
alter table lessons add column if not exists notes text;

-- Create Notification Templates table
create table if not exists notification_templates (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  trigger_type text, -- 'lesson_start', 'lesson_end', '15_min_before', etc.
  message_template text, -- "Dersiniz başlıyor: {class_name}"
  offset_minutes integer, -- -15, 0, 15
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for new table
alter table notification_templates enable row level security;
create policy "Enable access to all users" on notification_templates for all using (true) with check (true);
