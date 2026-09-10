-- Heart Connect Admin Phase 5: Admin AI, native in-app notifications, and safe automation.
-- ADDITIVE ONLY. Do not apply this migration to the shared Supabase project until
-- security-stabilization-2026-09-10 has been reconciled and reviewed.
--
-- This phase intentionally enables only Heart Connect's native in-app notification
-- delivery. Email, push, Facebook, TikTok, and Google Business remain unavailable
-- until real provider adapters, credentials, consent checks, and delivery evidence
-- are implemented.

-- Compatibility table for the native notification reader in the security branch.
-- CREATE IF NOT EXISTS plus additive ALTERs allow reconciliation if another branch
-- already introduced the table before this migration is applied.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null default 'system',
  title text,
  body text not null default '',
  actor_id uuid references auth.users(id) on delete set null,
  profile_id uuid,
  is_read boolean not null default false,
  read_at timestamptz,
  campaign_id uuid references public.hc_notification_campaigns(id) on delete set null,
  delivery_id uuid references public.hc_notification_delivery_queue(id) on delete set null,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  source_key text,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists event_type text not null default 'system',
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists actor_id uuid,
  add column if not exists profile_id uuid,
  add column if not exists is_read boolean not null default false,
  add column if not exists read_at timestamptz,
  add column if not exists campaign_id uuid,
  add column if not exists delivery_id uuid,
  add column if not exists action_url text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists source_key text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists notifications_user_created_idx
  on public.notifications(user_id,created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id,is_read,created_at desc);
-- PostgreSQL UNIQUE indexes allow multiple NULL values. Keeping this index
-- non-partial lets PostgREST safely use `on_conflict=source_key` for idempotency.
create unique index if not exists notifications_source_key_uidx
  on public.notifications(source_key);

-- Users may read only their own notification rows and may update only read state.
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (is_read,read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;

drop policy if exists hc_notifications_select_own on public.notifications;
create policy hc_notifications_select_own
  on public.notifications for select to authenticated
  using ((select auth.uid())=user_id);

drop policy if exists hc_notifications_mark_read_own on public.notifications;
create policy hc_notifications_mark_read_own
  on public.notifications for update to authenticated
  using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);

-- Runtime automation controls. Only server-side admin code may mutate these rows.
create table if not exists public.hc_admin_automation_settings (
  key text primary key check (key in (
    'notification_scheduler',
    'native_in_app_delivery',
    'external_email_delivery',
    'external_push_delivery'
  )),
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  locked boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.hc_admin_automation_settings(key,enabled,config,locked)
values
  ('notification_scheduler',true,'{"max_campaigns_per_run":10,"max_recipients_per_campaign":500}'::jsonb,false),
  ('native_in_app_delivery',true,'{"batch_size":100,"max_attempts":5}'::jsonb,false),
  ('external_email_delivery',false,'{"reason":"provider_adapter_not_implemented"}'::jsonb,true),
  ('external_push_delivery',false,'{"reason":"provider_adapter_not_implemented"}'::jsonb,true)
on conflict(key) do nothing;

create table if not exists public.hc_admin_automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_key text not null check (automation_key in (
    'notification_scheduler',
    'native_in_app_delivery',
    'phase5_run_all'
  )),
  trigger_source text not null check (trigger_source in ('cron','admin','system')),
  status text not null default 'running' check (status in ('running','completed','partial','failed','disabled')),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  scanned_count integer not null default 0,
  processed_count integer not null default 0,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  skipped_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  error_summary text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists hc_admin_automation_runs_created_idx
  on public.hc_admin_automation_runs(started_at desc);
create index if not exists hc_admin_automation_runs_key_idx
  on public.hc_admin_automation_runs(automation_key,started_at desc);

-- AI outputs remain advisory. Saving one creates a draft only; it never performs
-- moderation, verification, payment, deletion, suspension, or delivery actions.
create table if not exists public.hc_admin_ai_drafts (
  id uuid primary key default gen_random_uuid(),
  draft_type text not null check (draft_type in (
    'operations_brief',
    'notification',
    'cms',
    'moderation_note',
    'verification_note',
    'payment_note'
  )),
  workspace text not null,
  title text,
  content text not null check (char_length(content) between 1 and 12000),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index if not exists hc_admin_ai_drafts_created_idx
  on public.hc_admin_ai_drafts(created_at desc);
create index if not exists hc_admin_ai_drafts_type_idx
  on public.hc_admin_ai_drafts(draft_type,status,created_at desc);

alter table public.hc_admin_ai_usage
  add column if not exists task_type text,
  add column if not exists model text,
  add column if not exists context_rows integer not null default 0,
  add column if not exists output_chars integer not null default 0,
  add column if not exists correlation_id uuid;

alter table public.hc_admin_automation_settings enable row level security;
alter table public.hc_admin_automation_runs enable row level security;
alter table public.hc_admin_ai_drafts enable row level security;

revoke all on public.hc_admin_automation_settings from anon, authenticated;
revoke all on public.hc_admin_automation_runs from anon, authenticated;
revoke all on public.hc_admin_ai_drafts from anon, authenticated;

grant all on public.hc_admin_automation_settings to service_role;
grant all on public.hc_admin_automation_runs to service_role;
grant all on public.hc_admin_ai_drafts to service_role;

comment on table public.notifications is 'Member-visible Heart Connect notification inbox. Native admin campaign inserts use an idempotent source_key and remain user-readable only through RLS.';
comment on table public.hc_admin_automation_settings is 'Server-only operational automation controls. External delivery adapters remain locked until implemented.';
comment on table public.hc_admin_automation_runs is 'Append-oriented evidence for manual and scheduled admin automation runs.';
comment on table public.hc_admin_ai_drafts is 'Explicitly saved AI-generated admin drafts. Drafts are advisory and are never automatic platform actions.';
