-- Heart Connect Admin: exact-email staff account resolution.
-- Server-side only. This function is callable only by service_role and returns
-- the minimum identity data needed to assign an existing Heart Connect user.

create or replace function public.hc_admin_resolve_auth_user_by_email(p_email text)
returns table (
  user_id uuid,
  email text,
  display_name text
)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select
    u.id as user_id,
    lower(u.email)::text as email,
    coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'first_name'), ''),
      split_part(lower(u.email), '@', 1)
    )::text as display_name
  from auth.users u
  where u.email is not null
    and lower(u.email) = lower(btrim(p_email))
  limit 1;
$$;

revoke all on function public.hc_admin_resolve_auth_user_by_email(text) from public;
revoke all on function public.hc_admin_resolve_auth_user_by_email(text) from anon;
revoke all on function public.hc_admin_resolve_auth_user_by_email(text) from authenticated;
grant execute on function public.hc_admin_resolve_auth_user_by_email(text) to service_role;

comment on function public.hc_admin_resolve_auth_user_by_email(text) is
  'Service-role-only exact email lookup used by the Heart Connect Admin Control Plane to assign existing users as staff without exposing auth.users or requiring UUID entry.';
