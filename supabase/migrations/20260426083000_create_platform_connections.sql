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
