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

create trigger set_user_access_updated_at
before update on public.user_access
for each row execute procedure public.handle_updated_at();

alter table public.user_access enable row level security;

create policy "Users can view their own access"
on public.user_access
for select
using (auth.uid() = user_id);

create policy "Users can insert their own access"
on public.user_access
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own access"
on public.user_access
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
