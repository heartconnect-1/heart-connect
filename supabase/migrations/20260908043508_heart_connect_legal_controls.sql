create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.account_profiles add column if not exists terms_version text;
alter table public.account_profiles add column if not exists privacy_version text;
alter table public.account_profiles add column if not exists community_guidelines_version text;

create table if not exists public.legal_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('terms','privacy','community_guidelines','cookie_policy','safety_policy')),
  version text not null,
  effective_at timestamptz not null default now(),
  source_reference text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(document_type, version)
);

create table if not exists public.legal_acceptance_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  document_version text not null,
  action text not null default 'accepted' check (action in ('accepted','acknowledged')),
  source text not null default 'web' check (source in ('web','ios','android','admin_migration','api')),
  created_at timestamptz not null default now(),
  foreign key (document_type, document_version) references public.legal_document_versions(document_type, version)
);

create table if not exists public.consent_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  marketing_email boolean not null default false,
  marketing_sms boolean not null default false,
  marketing_push boolean not null default false,
  analytics boolean not null default false,
  ai_personalization boolean not null default true,
  location_features boolean not null default false,
  contact_matching boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('marketing_email','marketing_sms','marketing_push','analytics','ai_personalization','location_features','contact_matching','cookies')),
  granted boolean not null,
  policy_version text,
  source text not null default 'web' check (source in ('web','ios','android','admin_migration','api')),
  created_at timestamptz not null default now()
);

create table if not exists public.privacy_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discoverable boolean not null default true,
  profile_visibility text not null default 'standard' check (profile_visibility in ('standard','incognito','paused')),
  photo_visibility text not null default 'everyone' check (photo_visibility in ('everyone','matches','private')),
  show_online boolean not null default true,
  show_distance boolean not null default true,
  show_last_seen boolean not null default true,
  read_receipts boolean not null default true,
  show_travel boolean not null default true,
  search_indexing boolean not null default false,
  verified_only_messaging boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.reports drop constraint if exists reports_category_check;
alter table public.reports add constraint reports_category_check check (category in ('fake_profile','harassment','scam','spam','underage','explicit_content','offline_safety','impersonation','threat','financial_fraud','minor_safety','sexual_exploitation','other'));
alter table public.reports add column if not exists target_type text not null default 'profile';
alter table public.reports add column if not exists message_id uuid references public.messages(id) on delete set null;
alter table public.reports add column if not exists media_id uuid references public.profile_media(id) on delete set null;
alter table public.reports add column if not exists priority text not null default 'normal';
alter table public.reports add column if not exists escalated_at timestamptz;
alter table public.reports add column if not exists updated_at timestamptz not null default now();
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in ('profile','message','media'));
alter table public.reports drop constraint if exists reports_priority_check;
alter table public.reports add constraint reports_priority_check check (priority in ('normal','high','critical'));
alter table public.reports drop constraint if exists reports_target_reference_check;
alter table public.reports add constraint reports_target_reference_check check (
  (target_type='profile' and message_id is null and media_id is null) or
  (target_type='message' and message_id is not null and media_id is null) or
  (target_type='media' and media_id is not null and message_id is null)
);

create table if not exists public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports(id) on delete cascade,
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  subject_type text not null check (subject_type in ('profile','message','media')),
  priority text not null default 'normal' check (priority in ('normal','high','critical')),
  status text not null default 'queued' check (status in ('queued','in_review','actioned','dismissed','escalated','closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  queue_reason text,
  action_taken text,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.account_enforcements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('warning','feature_restriction','visibility_restriction','temporary_suspension','permanent_suspension','verification_removal','content_removal')),
  reason_code text not null,
  reason_summary text not null check (char_length(reason_summary) <= 1000),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  lifted_at timestamptz,
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.enforcement_appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  enforcement_id uuid not null references public.account_enforcements(id) on delete cascade,
  reason text not null check (char_length(reason) between 10 and 4000),
  status text not null default 'submitted' check (status in ('submitted','in_review','upheld','overturned','partially_overturned','closed')),
  reviewer_id uuid references auth.users(id) on delete set null,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(user_id, enforcement_id)
);

create table if not exists public.child_safety_cases (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports(id) on delete cascade,
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'urgent_review' check (status in ('urgent_review','evidence_preserved','escalated','reported_to_authority','closed_no_issue','closed_actioned')),
  severity text not null default 'critical' check (severity='critical'),
  reason text not null,
  evidence_preservation_until timestamptz,
  external_authority_reference text,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  escalated_at timestamptz,
  closed_at timestamptz
);

create table if not exists public.data_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  format text not null default 'json' check (format in ('json','zip')),
  status text not null default 'requested' check (status in ('requested','processing','ready','completed','failed','cancelled')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  failure_reason text
);

create table if not exists public.compliance_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  object_type text not null,
  object_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.is_compliance_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('moderator','admin','super_admin')
  );
$$;
revoke all on function private.is_compliance_staff() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_compliance_staff() to authenticated;

create or replace function private.audit_compliance_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  oid uuid;
  uid uuid;
begin
  uid := (select auth.uid());
  begin
    oid := (to_jsonb(new)->>'id')::uuid;
  exception when others then
    oid := null;
  end;
  insert into public.compliance_audit_log(actor_user_id,event_type,object_type,object_id,metadata)
  values(uid, lower(tg_op)||':'||tg_table_name, tg_table_name, oid, jsonb_build_object('operation',tg_op));
  return new;
end;
$$;
revoke all on function private.audit_compliance_change() from public, anon, authenticated;

create or replace function private.sync_legal_acceptance()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.document_type='terms' then
    update public.account_profiles set terms_accepted_at=coalesce(terms_accepted_at,new.created_at), terms_version=new.document_version, updated_at=now() where user_id=new.user_id;
  elsif new.document_type='privacy' then
    update public.account_profiles set privacy_accepted_at=coalesce(privacy_accepted_at,new.created_at), privacy_version=new.document_version, updated_at=now() where user_id=new.user_id;
  elsif new.document_type='community_guidelines' then
    update public.account_profiles set community_guidelines_version=new.document_version, updated_at=now() where user_id=new.user_id;
  end if;
  return new;
end;
$$;
revoke all on function private.sync_legal_acceptance() from public, anon, authenticated;

create or replace function private.queue_report_case()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  p text;
begin
  p := case
    when new.category in ('underage','minor_safety','sexual_exploitation','threat') then 'critical'
    when new.category in ('scam','financial_fraud','harassment','impersonation','offline_safety') then 'high'
    else coalesce(new.priority,'normal')
  end;
  update public.reports set priority=p, escalated_at=case when p='critical' then coalesce(escalated_at,now()) else escalated_at end, updated_at=now() where id=new.id;
  insert into public.moderation_cases(report_id,subject_user_id,subject_type,priority,status,queue_reason)
  values(new.id,new.reported_user_id,new.target_type,p,case when p='critical' then 'escalated' else 'queued' end,new.category)
  on conflict (report_id) do nothing;
  if new.category in ('underage','minor_safety','sexual_exploitation') then
    insert into public.child_safety_cases(report_id,subject_user_id,status,severity,reason,evidence_preservation_until,escalated_at)
    values(new.id,new.reported_user_id,'urgent_review','critical',new.category,now()+interval '90 days',now())
    on conflict (report_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.queue_report_case() from public, anon, authenticated;

insert into public.legal_document_versions(document_type,version,effective_at,source_reference,active)
values
 ('terms','2026-09-08-v1',now(),'Heart Connect Terms / iubenda site 4671580',true),
 ('privacy','2026-09-08-v1',now(),'iubenda policy 84026166',true),
 ('community_guidelines','2026-09-08-v1',now(),'Heart Connect Legal & Safety Center',true),
 ('cookie_policy','2026-09-08-v1',now(),'iubenda policy 84026166',true),
 ('safety_policy','2026-09-08-v1',now(),'Heart Connect Legal & Safety Center',true)
on conflict (document_type,version) do update set active=excluded.active, source_reference=excluded.source_reference;

alter table public.legal_document_versions enable row level security;
alter table public.legal_acceptance_events enable row level security;
alter table public.consent_preferences enable row level security;
alter table public.consent_events enable row level security;
alter table public.privacy_preferences enable row level security;
alter table public.moderation_cases enable row level security;
alter table public.account_enforcements enable row level security;
alter table public.enforcement_appeals enable row level security;
alter table public.child_safety_cases enable row level security;
alter table public.data_export_requests enable row level security;
alter table public.compliance_audit_log enable row level security;

drop policy if exists legal_document_versions_read_active on public.legal_document_versions;
create policy legal_document_versions_read_active on public.legal_document_versions for select to anon, authenticated using (active=true);
drop policy if exists legal_acceptance_select_own on public.legal_acceptance_events;
create policy legal_acceptance_select_own on public.legal_acceptance_events for select to authenticated using ((select auth.uid())=user_id or private.is_compliance_staff());
drop policy if exists legal_acceptance_insert_own on public.legal_acceptance_events;
create policy legal_acceptance_insert_own on public.legal_acceptance_events for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists consent_preferences_own on public.consent_preferences;
create policy consent_preferences_own on public.consent_preferences for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists consent_events_select_own on public.consent_events;
create policy consent_events_select_own on public.consent_events for select to authenticated using ((select auth.uid())=user_id or private.is_compliance_staff());
drop policy if exists consent_events_insert_own on public.consent_events;
create policy consent_events_insert_own on public.consent_events for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists privacy_preferences_own on public.privacy_preferences;
create policy privacy_preferences_own on public.privacy_preferences for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports for insert to authenticated with check (
  reporter_id=(select auth.uid()) and reported_user_id<>(select auth.uid()) and
  (
    target_type='profile' or
    (target_type='message' and exists (
      select 1 from public.messages m join public.matches mt on mt.id=m.match_id
      where m.id=message_id and m.sender_id=reported_user_id and m.sender_id<>(select auth.uid())
        and ((mt.user_a=(select auth.uid())) or (mt.user_b=(select auth.uid())))
    )) or
    target_type='media'
  )
);

drop policy if exists moderation_cases_staff on public.moderation_cases;
create policy moderation_cases_staff on public.moderation_cases for all to authenticated using (private.is_compliance_staff()) with check (private.is_compliance_staff());
drop policy if exists account_enforcements_select on public.account_enforcements;
create policy account_enforcements_select on public.account_enforcements for select to authenticated using ((select auth.uid())=user_id or private.is_compliance_staff());
drop policy if exists account_enforcements_staff_write on public.account_enforcements;
create policy account_enforcements_staff_write on public.account_enforcements for all to authenticated using (private.is_compliance_staff()) with check (private.is_compliance_staff());
drop policy if exists enforcement_appeals_select on public.enforcement_appeals;
create policy enforcement_appeals_select on public.enforcement_appeals for select to authenticated using ((select auth.uid())=user_id or private.is_compliance_staff());
drop policy if exists enforcement_appeals_insert_own on public.enforcement_appeals;
create policy enforcement_appeals_insert_own on public.enforcement_appeals for insert to authenticated with check ((select auth.uid())=user_id and exists(select 1 from public.account_enforcements e where e.id=enforcement_id and e.user_id=(select auth.uid())));
drop policy if exists enforcement_appeals_staff_update on public.enforcement_appeals;
create policy enforcement_appeals_staff_update on public.enforcement_appeals for update to authenticated using (private.is_compliance_staff()) with check (private.is_compliance_staff());
drop policy if exists child_safety_cases_staff on public.child_safety_cases;
create policy child_safety_cases_staff on public.child_safety_cases for all to authenticated using (private.is_compliance_staff()) with check (private.is_compliance_staff());
drop policy if exists data_export_requests_own on public.data_export_requests;
create policy data_export_requests_own on public.data_export_requests for select to authenticated using ((select auth.uid())=user_id or private.is_compliance_staff());
drop policy if exists data_export_requests_insert_own on public.data_export_requests;
create policy data_export_requests_insert_own on public.data_export_requests for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists data_export_requests_staff_update on public.data_export_requests;
create policy data_export_requests_staff_update on public.data_export_requests for update to authenticated using (private.is_compliance_staff()) with check (private.is_compliance_staff());
drop policy if exists compliance_audit_staff on public.compliance_audit_log;
create policy compliance_audit_staff on public.compliance_audit_log for select to authenticated using (private.is_compliance_staff());

revoke all on public.legal_document_versions, public.legal_acceptance_events, public.consent_preferences, public.consent_events, public.privacy_preferences, public.moderation_cases, public.account_enforcements, public.enforcement_appeals, public.child_safety_cases, public.data_export_requests, public.compliance_audit_log from anon, authenticated;
grant select on public.legal_document_versions to anon, authenticated;
grant select,insert on public.legal_acceptance_events to authenticated;
grant select,insert,update on public.consent_preferences to authenticated;
grant select,insert on public.consent_events to authenticated;
grant select,insert,update on public.privacy_preferences to authenticated;
grant select,update on public.moderation_cases to authenticated;
grant select,insert,update on public.account_enforcements to authenticated;
grant select,insert,update on public.enforcement_appeals to authenticated;
grant select,update on public.child_safety_cases to authenticated;
grant select,insert,update on public.data_export_requests to authenticated;
grant select on public.compliance_audit_log to authenticated;
grant select,insert,update,delete on all tables in schema public to service_role;

create index if not exists legal_acceptance_user_created_idx on public.legal_acceptance_events(user_id,created_at desc);
create index if not exists consent_events_user_created_idx on public.consent_events(user_id,created_at desc);
create index if not exists reports_message_id_idx on public.reports(message_id);
create index if not exists reports_media_id_idx on public.reports(media_id);
create index if not exists reports_priority_status_idx on public.reports(priority,status,created_at desc);
create index if not exists moderation_cases_subject_idx on public.moderation_cases(subject_user_id,status,created_at desc);
create index if not exists moderation_cases_assigned_idx on public.moderation_cases(assigned_to,status);
create index if not exists account_enforcements_user_idx on public.account_enforcements(user_id,active,created_at desc);
create index if not exists account_enforcements_created_by_idx on public.account_enforcements(created_by);
create index if not exists enforcement_appeals_user_idx on public.enforcement_appeals(user_id,status,created_at desc);
create index if not exists enforcement_appeals_reviewer_idx on public.enforcement_appeals(reviewer_id);
create index if not exists child_safety_subject_idx on public.child_safety_cases(subject_user_id,status,created_at desc);
create index if not exists child_safety_reviewer_idx on public.child_safety_cases(reviewed_by);
create index if not exists data_export_user_idx on public.data_export_requests(user_id,requested_at desc);
create index if not exists audit_actor_idx on public.compliance_audit_log(actor_user_id,created_at desc);
create index if not exists audit_object_idx on public.compliance_audit_log(object_type,object_id,created_at desc);

drop trigger if exists trg_legal_acceptance_sync on public.legal_acceptance_events;
create trigger trg_legal_acceptance_sync after insert on public.legal_acceptance_events for each row execute function private.sync_legal_acceptance();
drop trigger if exists trg_reports_queue on public.reports;
create trigger trg_reports_queue after insert on public.reports for each row execute function private.queue_report_case();

drop trigger if exists trg_audit_legal_acceptance on public.legal_acceptance_events;
create trigger trg_audit_legal_acceptance after insert on public.legal_acceptance_events for each row execute function private.audit_compliance_change();
drop trigger if exists trg_audit_consent_events on public.consent_events;
create trigger trg_audit_consent_events after insert on public.consent_events for each row execute function private.audit_compliance_change();
drop trigger if exists trg_audit_consent_preferences on public.consent_preferences;
create trigger trg_audit_consent_preferences after insert or update on public.consent_preferences for each row execute function private.audit_compliance_change();
drop trigger if exists trg_audit_privacy_preferences on public.privacy_preferences;
create trigger trg_audit_privacy_preferences after insert or update on public.privacy_preferences for each row execute function private.audit_compliance_change();
drop trigger if exists trg_audit_reports on public.reports;
create trigger trg_audit_reports after insert or update on public.reports for each row execute function private.audit_compliance_change();
drop trigger if exists trg_audit_moderation_cases on public.moderation_cases;
create trigger trg_audit_moderation_cases after insert or update on public.moderation_cases for each row execute function private.audit_compliance_change();
drop trigger if exists trg_audit_enforcements on public.account_enforcements;
create trigger trg_audit_enforcements after insert or update on public.account_enforcements for each row execute function private.audit_compliance_change();
drop trigger if exists trg_audit_appeals on public.enforcement_appeals;
create trigger trg_audit_appeals after insert or update on public.enforcement_appeals for each row execute function private.audit_compliance_change();
drop trigger if exists trg_audit_child_safety on public.child_safety_cases;
create trigger trg_audit_child_safety after insert or update on public.child_safety_cases for each row execute function private.audit_compliance_change();
drop trigger if exists trg_audit_exports on public.data_export_requests;
create trigger trg_audit_exports after insert or update on public.data_export_requests for each row execute function private.audit_compliance_change();
