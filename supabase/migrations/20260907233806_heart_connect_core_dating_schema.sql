create table if not exists public.dating_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  headline text check (headline is null or char_length(headline) <= 160),
  bio text check (bio is null or char_length(bio) <= 2000),
  age smallint check (age is null or age between 18 and 120),
  gender text,
  country text,
  city text,
  relationship_intention text,
  occupation text,
  education text,
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  is_discoverable boolean not null default true,
  profile_completion smallint not null default 0 check (profile_completion between 0 and 100),
  verification_level text not null default 'unverified' check (verification_level in ('unverified','email','phone','photo','identity')),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  media_type text not null default 'photo' check (media_type in ('photo','video')),
  position smallint not null default 0 check (position between 0 and 20),
  is_primary boolean not null default false,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, storage_path)
);
create unique index if not exists profile_media_one_primary_per_user on public.profile_media(user_id) where is_primary;
create index if not exists profile_media_user_position_idx on public.profile_media(user_id, position);

create table if not exists public.discovery_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  min_age smallint not null default 18 check (min_age between 18 and 120),
  max_age smallint not null default 99 check (max_age between 18 and 120 and max_age >= min_age),
  genders text[] not null default '{}',
  countries text[] not null default '{}',
  relationship_intentions text[] not null default '{}',
  max_distance_km integer check (max_distance_km is null or max_distance_km between 1 and 20000),
  global_mode boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.swipe_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('like','pass','super_like')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (actor_id <> target_id),
  unique (actor_id, target_id)
);
create index if not exists swipe_actions_target_action_idx on public.swipe_actions(target_id, action);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','unmatched','blocked')),
  matched_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_a <> user_b)
);
create unique index if not exists matches_unique_pair_idx on public.matches (least(user_a,user_b), greatest(user_a,user_b));
create index if not exists matches_user_a_idx on public.matches(user_a, last_activity_at desc);
create index if not exists matches_user_b_idx on public.matches(user_b, last_activity_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  message_type text not null default 'text' check (message_type in ('text','image','video','audio','system')),
  media_path text,
  reply_to_id uuid references public.messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  check (body is not null or media_path is not null or message_type = 'system')
);
create index if not exists messages_match_created_idx on public.messages(match_id, created_at desc);
create index if not exists messages_sender_idx on public.messages(sender_id, created_at desc);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked_idx on public.blocks(blocked_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('fake_profile','harassment','scam','spam','underage','explicit_content','offline_safety','other')),
  details text check (details is null or char_length(details) <= 4000),
  status text not null default 'new' check (status in ('new','reviewing','actioned','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);
create index if not exists reports_reported_status_idx on public.reports(reported_user_id, status, created_at desc);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verification_type text not null check (verification_type in ('photo','identity','phone','email')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  evidence_path text,
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists verification_requests_user_status_idx on public.verification_requests(user_id, status, submitted_at desc);

alter table public.dating_profiles enable row level security;
alter table public.profile_media enable row level security;
alter table public.discovery_preferences enable row level security;
alter table public.swipe_actions enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.verification_requests enable row level security;

create trigger dating_profiles_touch before update on public.dating_profiles for each row execute function public.touch_updated_at();
create trigger profile_media_touch before update on public.profile_media for each row execute function public.touch_updated_at();
create trigger discovery_preferences_touch before update on public.discovery_preferences for each row execute function public.touch_updated_at();
create trigger swipe_actions_touch before update on public.swipe_actions for each row execute function public.touch_updated_at();
create trigger matches_touch before update on public.matches for each row execute function public.touch_updated_at();
create trigger reports_touch before update on public.reports for each row execute function public.touch_updated_at();
create trigger verification_requests_touch before update on public.verification_requests for each row execute function public.touch_updated_at();

revoke all on public.dating_profiles, public.profile_media, public.discovery_preferences, public.swipe_actions, public.matches, public.messages, public.blocks, public.reports, public.verification_requests from anon;

grant select, insert, update on public.dating_profiles to authenticated;
grant select, insert, update, delete on public.profile_media to authenticated;
grant select, insert, update on public.discovery_preferences to authenticated;
grant select, insert, update on public.swipe_actions to authenticated;
grant select on public.matches to authenticated;
grant select, insert, update on public.messages to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert on public.reports to authenticated;
grant select, insert on public.verification_requests to authenticated;

grant all on public.dating_profiles, public.profile_media, public.discovery_preferences, public.swipe_actions, public.matches, public.messages, public.blocks, public.reports, public.verification_requests to service_role;

create policy dating_profiles_select_own on public.dating_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy dating_profiles_insert_own on public.dating_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy dating_profiles_update_own on public.dating_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy profile_media_select_own on public.profile_media for select to authenticated using ((select auth.uid()) = user_id);
create policy profile_media_insert_own on public.profile_media for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profile_media_update_own on public.profile_media for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy profile_media_delete_own on public.profile_media for delete to authenticated using ((select auth.uid()) = user_id);

create policy discovery_preferences_select_own on public.discovery_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy discovery_preferences_insert_own on public.discovery_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy discovery_preferences_update_own on public.discovery_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy swipe_actions_select_own on public.swipe_actions for select to authenticated using ((select auth.uid()) = actor_id);
create policy swipe_actions_insert_own on public.swipe_actions for insert to authenticated with check ((select auth.uid()) = actor_id);
create policy swipe_actions_update_own on public.swipe_actions for update to authenticated using ((select auth.uid()) = actor_id) with check ((select auth.uid()) = actor_id);

create policy matches_select_participant on public.matches for select to authenticated using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

create policy messages_select_match_participant on public.messages for select to authenticated using (exists (select 1 from public.matches m where m.id = match_id and (m.user_a = (select auth.uid()) or m.user_b = (select auth.uid()))));
create policy messages_insert_match_participant on public.messages for insert to authenticated with check (sender_id = (select auth.uid()) and exists (select 1 from public.matches m where m.id = match_id and m.status = 'active' and (m.user_a = (select auth.uid()) or m.user_b = (select auth.uid()))));
create policy messages_update_own on public.messages for update to authenticated using (sender_id = (select auth.uid())) with check (sender_id = (select auth.uid()));

create policy blocks_select_own on public.blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy blocks_insert_own on public.blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy blocks_delete_own on public.blocks for delete to authenticated using (blocker_id = (select auth.uid()));

create policy reports_select_own on public.reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy reports_insert_own on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));

create policy verification_requests_select_own on public.verification_requests for select to authenticated using (user_id = (select auth.uid()));
create policy verification_requests_insert_own on public.verification_requests for insert to authenticated with check (user_id = (select auth.uid()));
