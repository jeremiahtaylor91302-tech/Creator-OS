create type public.feedback_type as enum ('feature', 'bug');

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

create policy "Authenticated users can insert feedback"
on public.feedback
for insert
to authenticated
with check (true);

create policy "Users can read their own feedback"
on public.feedback
for select
to authenticated
using (auth.uid() = user_id);
