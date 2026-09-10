-- Heart Connect Admin Phase 3: operations, analytics, settings, pages, staff and publishing readiness.
-- ADDITIVE ONLY. Do not apply to the shared Supabase project until the security branch is reconciled.

create table if not exists public.hc_site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 220),
  page_type text not null default 'content' check (page_type in ('home','content','legal','help','landing')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  content jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hc_site_pages_type_status_idx on public.hc_site_pages(page_type,status,updated_at desc);

create table if not exists public.hc_notification_delivery_queue (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.hc_notification_campaigns(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  channel text not null check (channel in ('in_app','email','push')),
  status text not null default 'queued' check (status in ('queued','sending','sent','failed','skipped','cancelled')),
  provider text,
  provider_reference text,
  error_code text,
  attempt_count integer not null default 0 check (attempt_count between 0 and 20),
  next_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id,recipient_user_id,channel)
);
create index if not exists hc_notification_delivery_queue_status_idx on public.hc_notification_delivery_queue(status,next_attempt_at,created_at);
create index if not exists hc_notification_delivery_queue_campaign_idx on public.hc_notification_delivery_queue(campaign_id,status);

create table if not exists public.hc_social_connections (
  provider text primary key check (provider in ('facebook','tiktok','google_business')),
  status text not null default 'not_connected' check (status in ('not_connected','configured','needs_reauth','disabled')),
  external_account_id text,
  external_account_name text,
  capabilities jsonb not null default '{}'::jsonb,
  credential_location text not null default 'cloudflare_secret',
  last_tested_at timestamptz,
  last_error_code text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_admin_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  metric_key text not null,
  metric_value bigint not null default 0,
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(snapshot_date,metric_key,dimensions)
);
create index if not exists hc_admin_metric_snapshots_lookup_idx on public.hc_admin_metric_snapshots(metric_key,snapshot_date desc);

alter table public.hc_admin_markets
  add column if not exists default_language text,
  add column if not exists timezone text,
  add column if not exists distance_unit text check (distance_unit is null or distance_unit in ('km','mi')),
  add column if not exists legal_review_status text not null default 'pending' check (legal_review_status in ('pending','reviewed','approved','blocked'));

alter table public.hc_notification_campaigns
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

insert into public.hc_social_connections(provider,status,capabilities)
values
 ('facebook','not_connected','{"page_posts":false}'::jsonb),
 ('tiktok','not_connected','{"content_posting":false}'::jsonb),
 ('google_business','not_connected','{"business_posts":false}'::jsonb)
on conflict(provider) do nothing;

alter table public.hc_site_pages enable row level security;
alter table public.hc_notification_delivery_queue enable row level security;
alter table public.hc_social_connections enable row level security;
alter table public.hc_admin_metric_snapshots enable row level security;

revoke all on public.hc_site_pages from anon, authenticated;
revoke all on public.hc_notification_delivery_queue from anon, authenticated;
revoke all on public.hc_social_connections from anon, authenticated;
revoke all on public.hc_admin_metric_snapshots from anon, authenticated;

grant all on public.hc_site_pages to service_role;
grant all on public.hc_notification_delivery_queue to service_role;
grant all on public.hc_social_connections to service_role;
grant all on public.hc_admin_metric_snapshots to service_role;

comment on table public.hc_site_pages is 'Editable public site/page content controlled only through the audited admin server plane.';
comment on table public.hc_notification_delivery_queue is 'Delivery queue only. A queued row never means an email, push, or in-app notification was successfully delivered.';
comment on table public.hc_social_connections is 'Connection metadata only. Provider access tokens and secrets must stay in Cloudflare secrets, never in this table.';
comment on table public.hc_admin_metric_snapshots is 'Privacy-minimized aggregate metric snapshots; do not store private message bodies or sensitive profile traits here.';
