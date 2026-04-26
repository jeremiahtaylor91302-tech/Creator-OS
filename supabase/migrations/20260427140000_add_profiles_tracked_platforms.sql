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
