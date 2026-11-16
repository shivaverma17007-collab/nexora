-- Starter schema for NEXORA. Run in Supabase SQL editor after creating project.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.backup_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  local_time time,
  timezone text not null default 'Asia/Kolkata',
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.backup_preferences enable row level security;
create policy "profiles: own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "user_data: own row" on public.user_data for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "backup_preferences: own row" on public.backup_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
