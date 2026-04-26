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
