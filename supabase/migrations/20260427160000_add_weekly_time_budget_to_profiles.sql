-- Weekly hours budget for production tracking + Idea Pressure Cooker (server-side source of truth).

alter table public.profiles
add column if not exists weekly_time_budget_hours double precision not null default 2
check (weekly_time_budget_hours >= 0.5);
