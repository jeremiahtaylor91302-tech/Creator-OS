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
