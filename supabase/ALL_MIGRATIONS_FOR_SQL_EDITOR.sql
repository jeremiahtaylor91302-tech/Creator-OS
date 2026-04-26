--
-- 20260426083000_create_platform_connections.sql
--

create extension if not exists "pgcrypto";

do $$
begin
  create type platform_name as enum ('youtube', 'tiktok', 'instagram', 'twitter');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type platform_connection_status as enum ('pending', 'connected', 'failed');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform platform_name not null,
  external_account_id text,
  external_username text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  status platform_connection_status not null default 'pending',
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

create index if not exists idx_platform_connections_user_id
  on public.platform_connections(user_id);

create index if not exists idx_platform_connections_platform
  on public.platform_connections(platform);

create or replace function public.handle_platform_connections_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_platform_connections_updated_at on public.platform_connections;
create trigger set_platform_connections_updated_at
before update on public.platform_connections
for each row
execute function public.handle_platform_connections_updated_at();

alter table public.platform_connections enable row level security;

drop policy if exists "Users can select their own platform connections" on public.platform_connections;
create policy "Users can select their own platform connections"
on public.platform_connections
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own platform connections" on public.platform_connections;
create policy "Users can insert their own platform connections"
on public.platform_connections
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own platform connections" on public.platform_connections;
create policy "Users can update their own platform connections"
on public.platform_connections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own platform connections" on public.platform_connections;
create policy "Users can delete their own platform connections"
on public.platform_connections
for delete
using (auth.uid() = user_id);

--
-- 20260426101000_add_podcast_platform.sql
--

alter type platform_name add value if not exists 'podcast';

--
-- 20260426101500_create_handle_updated_at_function.sql
--

-- Shared trigger target for tables that use a plain `updated_at` column.
-- Referenced by google_calendar_connections and user_access migrations.

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

--
-- 20260426112000_create_google_calendar_connections.sql
--

do $$
begin
  create type public.google_calendar_connection_status as enum ('pending', 'connected', 'failed');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.google_calendar_connection_status not null default 'pending',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  oauth_state text,
  connected_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists idx_google_calendar_connections_user_id
  on public.google_calendar_connections(user_id);

drop trigger if exists set_google_calendar_connections_updated_at on public.google_calendar_connections;
create trigger set_google_calendar_connections_updated_at
before update on public.google_calendar_connections
for each row execute function public.handle_updated_at();

alter table public.google_calendar_connections enable row level security;

drop policy if exists "Users can view their google calendar connection" on public.google_calendar_connections;
create policy "Users can view their google calendar connection"
on public.google_calendar_connections
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their google calendar connection" on public.google_calendar_connections;
create policy "Users can insert their google calendar connection"
on public.google_calendar_connections
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their google calendar connection" on public.google_calendar_connections;
create policy "Users can update their google calendar connection"
on public.google_calendar_connections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

--
-- 20260426130000_create_user_access_table.sql
--

create table if not exists public.user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  lifetime_access boolean not null default false,
  lemon_order_id text,
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_access_user_id on public.user_access(user_id);

drop trigger if exists set_user_access_updated_at on public.user_access;
create trigger set_user_access_updated_at
before update on public.user_access
for each row execute function public.handle_updated_at();

alter table public.user_access enable row level security;

drop policy if exists "Users can view their own access" on public.user_access;
create policy "Users can view their own access"
on public.user_access
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own access" on public.user_access;
create policy "Users can insert their own access"
on public.user_access
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own access" on public.user_access;
create policy "Users can update their own access"
on public.user_access
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

--
-- 20260426143000_create_feedback_table.sql
--

do $$
begin
  create type public.feedback_type as enum ('feature', 'bug');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  type public.feedback_type not null,
  message text not null,
  page_url text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_created_at on public.feedback(created_at desc);
create index if not exists idx_feedback_user_id on public.feedback(user_id);

alter table public.feedback enable row level security;

drop policy if exists "Authenticated users can insert feedback" on public.feedback;
create policy "Authenticated users can insert feedback"
on public.feedback
for insert
to authenticated
with check (true);

drop policy if exists "Users can read their own feedback" on public.feedback;
create policy "Users can read their own feedback"
on public.feedback
for select
to authenticated
using (auth.uid() = user_id);

--
-- 20260426150000_create_profiles.sql
--

-- Public profile per auth user (full name at signup + future edits).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_id on public.profiles (id);

create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_profiles_updated_at();

-- Sync row when a user is created (email signup, OAuth, etc.).
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      ''
    )
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

--
-- 20260427093000_ensure_google_calendar_connections.sql
--

-- Idempotent: safe if 20260426112000 already ran. Fixes remote DBs where the table
-- was never created (e.g. missing handle_updated_at when the original migration ran).

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  create type public.google_calendar_connection_status as enum ('pending', 'connected', 'failed');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.google_calendar_connection_status not null default 'pending',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  oauth_state text,
  connected_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists idx_google_calendar_connections_user_id
  on public.google_calendar_connections(user_id);

drop trigger if exists set_google_calendar_connections_updated_at on public.google_calendar_connections;
create trigger set_google_calendar_connections_updated_at
before update on public.google_calendar_connections
for each row execute function public.handle_updated_at();

alter table public.google_calendar_connections enable row level security;

drop policy if exists "Users can view their google calendar connection" on public.google_calendar_connections;
create policy "Users can view their google calendar connection"
on public.google_calendar_connections
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their google calendar connection" on public.google_calendar_connections;
create policy "Users can insert their google calendar connection"
on public.google_calendar_connections
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their google calendar connection" on public.google_calendar_connections;
create policy "Users can update their google calendar connection"
on public.google_calendar_connections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

--
-- 20260427140000_add_profiles_tracked_platforms.sql
--

-- Which channels appear in the app for metrics / connections (user-controlled).
-- Default: existing five OAuth platforms; Pinterest & Substack are opt-in toggles.

alter table public.profiles
add column if not exists tracked_platforms text[] not null default array[
  'youtube',
  'tiktok',
  'instagram',
  'twitter',
  'podcast'
]::text[];

update public.profiles
set tracked_platforms = array['youtube', 'tiktok', 'instagram', 'twitter', 'podcast']::text[]
where cardinality(tracked_platforms) = 0;

--
-- 20260427160000_add_weekly_time_budget_to_profiles.sql
--

-- Weekly hours budget for production tracking + Idea Pressure Cooker (server-side source of truth).

alter table public.profiles
add column if not exists weekly_time_budget_hours double precision not null default 2
check (weekly_time_budget_hours >= 0.5);

--
-- 20260427164000_create_academy_waitlist.sql
--

create table if not exists public.academy_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  signed_up_at timestamptz not null default now()
);

alter table public.academy_waitlist enable row level security;

drop policy if exists "Authenticated users can insert academy waitlist" on public.academy_waitlist;
create policy "Authenticated users can insert academy waitlist"
on public.academy_waitlist
for insert
with check (auth.role() = 'authenticated');

--
-- 20260427210000_add_dashboard_onboarding_to_profiles.sql
--

-- Dashboard onboarding checklist (per-user, stored on profiles).

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step_platform boolean not null default false,
  add column if not exists onboarding_step_direction boolean not null default false,
  add column if not exists onboarding_step_idea boolean not null default false,
  add column if not exists onboarding_step_explore boolean not null default false,
  add column if not exists creator_goal text,
  add column if not exists onboarding_dashboard_visits integer not null default 0,
  add column if not exists onboarding_dashboard_seconds integer not null default 0;

comment on column public.profiles.creator_goal is 'Creator goal / north star text (e.g. from Direction roadmap form).';

--
-- 20260427220000_backfill_missing_profiles.sql
--

-- Users who signed up before on_auth_user_created_profile existed have no profile row.
insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    ''
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

