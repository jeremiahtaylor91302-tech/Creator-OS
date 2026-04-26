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
