create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  dob date;
  accepted_terms boolean := false;
  accepted_privacy boolean := false;
  age_confirmed boolean := false;
  initial_role text := 'user';
begin
  begin
    dob := nullif(coalesce(new.raw_user_meta_data ->> 'date_of_birth', new.raw_user_meta_data ->> 'dob'), '')::date;
  exception when others then
    dob := null;
  end;

  begin
    accepted_terms := coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false)
      or nullif(new.raw_user_meta_data ->> 'terms_accepted_at', '') is not null;
  exception when others then
    accepted_terms := nullif(new.raw_user_meta_data ->> 'terms_accepted_at', '') is not null;
  end;

  begin
    accepted_privacy := coalesce((new.raw_user_meta_data ->> 'privacy_accepted')::boolean, false)
      or nullif(new.raw_user_meta_data ->> 'privacy_accepted_at', '') is not null;
  exception when others then
    accepted_privacy := nullif(new.raw_user_meta_data ->> 'privacy_accepted_at', '') is not null;
  end;

  begin
    age_confirmed := coalesce((new.raw_user_meta_data ->> 'age_confirmed')::boolean, false);
  exception when others then
    age_confirmed := false;
  end;

  if lower(coalesce(new.email,'')) in ('jonathankenyanya4@gmail.com','jkenyanya97@gmail.com') then
    initial_role := 'super_admin';
  end if;

  insert into public.account_profiles(
    user_id, first_name, date_of_birth, gender, country, city,
    relationship_intention, signup_phone,
    terms_accepted_at, privacy_accepted_at, age_confirmed_at
  ) values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name',''),
    dob,
    nullif(new.raw_user_meta_data ->> 'gender',''),
    nullif(new.raw_user_meta_data ->> 'country',''),
    nullif(new.raw_user_meta_data ->> 'city',''),
    nullif(new.raw_user_meta_data ->> 'relationship_intention',''),
    coalesce(nullif(new.raw_user_meta_data ->> 'signup_phone',''), nullif(new.phone,'')),
    case when accepted_terms then now() else null end,
    case when accepted_privacy then now() else null end,
    case when age_confirmed then now() else null end
  ) on conflict (user_id) do nothing;

  insert into public.user_roles(user_id, role)
  values (new.id, initial_role)
  on conflict (user_id) do update set role = excluded.role, updated_at = now();

  insert into public.account_security_settings(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$function$;
