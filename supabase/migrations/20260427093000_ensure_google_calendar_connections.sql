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
