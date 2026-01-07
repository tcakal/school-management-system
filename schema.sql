-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Schools Table
create table schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  logo text,
  default_price numeric,
  payment_terms text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Class Groups Table
create table class_groups (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  name text not null,
  schedule text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Students Table
create table students (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  class_group_id uuid references class_groups(id) on delete set null,
  name text not null,
  phone text,
  parent_name text,
  parent_phone text,
  status text check (status in ('Active', 'Left')) default 'Active',
  joined_date date default CURRENT_DATE,
  left_date date,
  left_reason text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Teachers Table
create table teachers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  email text,
  specialties text[], -- Array of strings
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Teacher Assignments Table (Optional based on current usage, but good to have)
create table teacher_assignments (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid references teachers(id) on delete cascade not null,
  school_id uuid references schools(id) on delete cascade not null,
  class_group_id uuid references class_groups(id) on delete set null,
  day_of_week integer,
  start_time time,
  end_time time,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments Table
create table payments (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  -- student_id removed as per latest requirements
  amount numeric not null,
  date date default CURRENT_DATE,
  type text check (type in ('Tuition', 'Book', 'Uniform', 'Other')),
  method text check (method in ('Cash', 'CreditCard', 'Transfer')),
  notes text,
  month text, -- e.g. '2025-10'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
-- For now, we allow public access to simplify development. 
-- IN PRODUCTION, YOU MUST ENABLE RLS AND ADD POLICIES.
alter table schools enable row level security;
alter table class_groups enable row level security;
alter table students enable row level security;
alter table teachers enable row level security;
alter table payments enable row level security;

-- Open Policy (Allow All for Anon - DEV MODE ONLY)
create policy "Enable access to all users" on schools for all using (true);
create policy "Enable access to all users" on class_groups for all using (true);
create policy "Enable access to all users" on students for all using (true);
create policy "Enable access to all users" on teachers for all using (true);
create policy "Enable access to all users" on payments for all using (true);
