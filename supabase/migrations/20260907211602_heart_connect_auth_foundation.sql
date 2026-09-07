create extension if not exists pgcrypto;

create table if not exists public.account_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  date_of_birth date,
  gender text,
  country text,
  city text,
  relationship_intention text,
  signup_phone text,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  age_confirmed_at timestamptz,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_profiles_adult_check check (date_of_birth is null or date_of_birth <= (current_date - interval '18 years')::date)
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','support_agent','moderator','admin','super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_security_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  suspicious_login_alerts boolean not null default true,
  security_email_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  device text not null default 'Unknown device',
  browser text not null default 'Unknown browser',
  approximate_location text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(user_id, session_id)
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table public.account_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.account_security_settings enable row level security;
alter table public.session_devices enable row level security;
alter table public.security_events enable row level security;

revoke all on public.account_profiles from anon, authenticated;
revoke all on public.user_roles from anon, authenticated;
revoke all on public.account_security_settings from anon, authenticated;
revoke all on public.session_devices from anon, authenticated;
revoke all on public.security_events from anon, authenticated;

grant select on public.account_profiles to authenticated;
grant update (first_name, gender, country, city, relationship_intention, onboarding_complete, updated_at) on public.account_profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update on public.account_security_settings to authenticated;
grant select, insert, update, delete on public.session_devices to authenticated;
grant select on public.security_events to authenticated;

create policy account_profiles_select_own on public.account_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy account_profiles_update_own on public.account_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy user_roles_select_own on public.user_roles for select to authenticated using ((select auth.uid()) = user_id);
create policy security_settings_select_own on public.account_security_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy security_settings_insert_own on public.account_security_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy security_settings_update_own on public.account_security_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy session_devices_select_own on public.session_devices for select to authenticated using ((select auth.uid()) = user_id);
create policy session_devices_insert_own on public.session_devices for insert to authenticated with check ((select auth.uid()) = user_id);
create policy session_devices_update_own on public.session_devices for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy session_devices_delete_own on public.session_devices for delete to authenticated using ((select auth.uid()) = user_id);
create policy security_events_select_own on public.security_events for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger account_profiles_touch before update on public.account_profiles for each row execute function public.touch_updated_at();
create trigger user_roles_touch before update on public.user_roles for each row execute function public.touch_updated_at();
create trigger account_security_settings_touch before update on public.account_security_settings for each row execute function public.touch_updated_at();

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  dob date;
  provider_name text;
  accepted_terms boolean;
  accepted_privacy boolean;
  age_confirmed boolean;
begin
  provider_name := coalesce(new.raw_app_meta_data ->> 'provider', '');
  begin
    dob := nullif(new.raw_user_meta_data ->> 'date_of_birth','')::date;
  exception when others then
    dob := null;
  end;
  accepted_terms := coalesce((new.raw_user_meta_data ->> 'terms_accepted')::boolean, false);
  accepted_privacy := coalesce((new.raw_user_meta_data ->> 'privacy_accepted')::boolean, false);
  age_confirmed := coalesce((new.raw_user_meta_data ->> 'age_confirmed')::boolean, false);

  if provider_name in ('email','phone') then
    if dob is null or dob > (current_date - interval '18 years')::date or not age_confirmed or not accepted_terms or not accepted_privacy then
      raise exception 'Heart Connect registration requires verified 18+ age and acceptance of Terms and Privacy.';
    end if;
  end if;

  insert into public.account_profiles(
    user_id, first_name, date_of_birth, gender, country, city, relationship_intention, signup_phone,
    terms_accepted_at, privacy_accepted_at, age_confirmed_at
  ) values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name',''),
    dob,
    nullif(new.raw_user_meta_data ->> 'gender',''),
    nullif(new.raw_user_meta_data ->> 'country',''),
    nullif(new.raw_user_meta_data ->> 'city',''),
    nullif(new.raw_user_meta_data ->> 'relationship_intention',''),
    nullif(new.raw_user_meta_data ->> 'signup_phone',''),
    case when accepted_terms then now() else null end,
    case when accepted_privacy then now() else null end,
    case when age_confirmed then now() else null end
  ) on conflict (user_id) do nothing;

  insert into public.user_roles(user_id, role) values (new.id, 'user') on conflict (user_id) do nothing;
  insert into public.account_security_settings(user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

create index if not exists session_devices_user_last_active_idx on public.session_devices(user_id, last_active_at desc);
create index if not exists security_events_user_time_idx on public.security_events(user_id, occurred_at desc);
