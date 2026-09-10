-- Heart Connect Admin Phase 4: safe trash / restore lifecycle.
-- ADDITIVE ONLY. Do not apply to the shared Supabase project until the active
-- security-stabilization branch has been reconciled and reviewed.
--
-- Permanent purge is intentionally NOT provided for payments, audit logs,
-- moderation reports, verification records, user-action history, or notification
-- delivery history. Those records may be needed for safety, finance, disputes,
-- compliance, and incident review.

alter table public.hc_cms_posts
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists delete_reason text;
create index if not exists hc_cms_posts_deleted_idx on public.hc_cms_posts(deleted_at) where deleted_at is not null;

alter table public.hc_cms_media
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists delete_reason text;
create index if not exists hc_cms_media_deleted_idx on public.hc_cms_media(deleted_at) where deleted_at is not null;

alter table public.hc_site_pages
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists delete_reason text;
create index if not exists hc_site_pages_deleted_idx on public.hc_site_pages(deleted_at) where deleted_at is not null;

alter table public.hc_site_settings
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists delete_reason text;
create index if not exists hc_site_settings_deleted_idx on public.hc_site_settings(deleted_at) where deleted_at is not null;

alter table public.hc_notification_campaigns
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists delete_reason text;
create index if not exists hc_notification_campaigns_deleted_idx on public.hc_notification_campaigns(deleted_at) where deleted_at is not null;

create table if not exists public.hc_admin_trash_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('cms_post','cms_media','page','setting','notification_campaign')),
  entity_id text not null,
  action text not null check (action in ('trash','restore','purge')),
  reason text,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists hc_admin_trash_events_entity_idx on public.hc_admin_trash_events(entity_type,entity_id,created_at desc);
create index if not exists hc_admin_trash_events_created_idx on public.hc_admin_trash_events(created_at desc);

alter table public.hc_admin_trash_events enable row level security;
revoke all on public.hc_admin_trash_events from anon, authenticated;
grant all on public.hc_admin_trash_events to service_role;

comment on table public.hc_admin_trash_events is 'Append-only record of reversible trash and tightly controlled purge actions. It is not itself purgeable from the admin UI.';
comment on column public.hc_notification_campaigns.deleted_at is 'Soft-delete marker only. Delivery/audit history is retained even when a campaign is removed from the normal admin list.';
