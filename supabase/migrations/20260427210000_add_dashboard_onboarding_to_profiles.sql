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
