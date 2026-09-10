-- Heart Connect admin control-plane foundation.
-- IMPORTANT: this migration is intentionally additive. It does not change discovery,
-- messaging, calls, authentication, or existing production RLS policies.
-- Apply only after the security-stabilization work is reconciled and reviewed.

create table if not exists public.hc_admin_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null check (role in (
    'super_admin','admin','moderator','senior_moderator','safety_specialist',
    'payment_specialist','support_agent','content_manager','verification_specialist','finance'
  )),
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists hc_admin_staff_email_lower_idx on public.hc_admin_staff (lower(email));
create index if not exists hc_admin_staff_role_status_idx on public.hc_admin_staff (role,status);

create table if not exists public.hc_user_admin_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','restricted','suspended','banned','deletion_pending')),
  suspension_reason text,
  suspended_until timestamptz,
  featured_on_home boolean not null default false,
  featured_in_discover boolean not null default false,
  internal_note text,
  last_action_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hc_user_admin_state_status_idx on public.hc_user_admin_state (status,updated_at desc);
create index if not exists hc_user_admin_state_featured_home_idx on public.hc_user_admin_state (featured_on_home) where featured_on_home;
create index if not exists hc_user_admin_state_featured_discover_idx on public.hc_user_admin_state (featured_in_discover) where featured_in_discover;

create table if not exists public.hc_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text,
  action text not null,
  target text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists hc_admin_audit_created_idx on public.hc_admin_audit_log (created_at desc);
create index if not exists hc_admin_audit_actor_idx on public.hc_admin_audit_log (actor_user_id,created_at desc);
create index if not exists hc_admin_audit_action_idx on public.hc_admin_audit_log (action,created_at desc);

create table if not exists public.hc_admin_markets (
  code text primary key check (char_length(code) between 2 and 12),
  country text not null,
  currency text not null,
  status text not null default 'beta' check (status in ('coming_soon','invite_only','beta','live','paused')),
  registration_enabled boolean not null default true,
  discovery_enabled boolean not null default true,
  payments_enabled boolean not null default false,
  legal_version text,
  support_route text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_cms_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 220),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text check (excerpt is null or char_length(excerpt) <= 700),
  body text not null default '',
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  featured_media_id uuid,
  seo_title text check (seo_title is null or char_length(seo_title) <= 220),
  seo_description text check (seo_description is null or char_length(seo_description) <= 500),
  publish_channels jsonb not null default '{"website":true,"facebook":false,"tiktok":false,"google_business":false}'::jsonb,
  channel_results jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  published_at timestamptz,
  author_user_id uuid references auth.users(id) on delete set null,
  last_editor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hc_cms_posts_status_publish_idx on public.hc_cms_posts (status,published_at desc);
create index if not exists hc_cms_posts_scheduled_idx on public.hc_cms_posts (scheduled_for) where status='scheduled';

create table if not exists public.hc_cms_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.hc_cms_posts(id) on delete set null,
  media_type text not null check (media_type in ('image','video','thumbnail','gallery')),
  storage_path text not null,
  public_url text,
  mime_type text,
  width integer,
  height integer,
  duration_seconds numeric(10,2),
  alt_text text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_path)
);
create index if not exists hc_cms_media_post_idx on public.hc_cms_media (post_id,created_at);

alter table public.hc_cms_posts
  drop constraint if exists hc_cms_posts_featured_media_id_fkey;
alter table public.hc_cms_posts
  add constraint hc_cms_posts_featured_media_id_fkey foreign key (featured_media_id) references public.hc_cms_media(id) on delete set null;

create table if not exists public.hc_notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  message text not null check (char_length(message) between 1 and 2000),
  audience jsonb not null default '{"type":"all"}'::jsonb,
  channels jsonb not null default '{"in_app":true,"email":false,"push":false}'::jsonb,
  status text not null default 'draft' check (status in ('draft','scheduled','sending','sent','cancelled','failed')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  result_summary jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hc_notification_campaigns_status_idx on public.hc_notification_campaigns (status,created_at desc);

create table if not exists public.hc_site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  category text not null default 'general',
  is_sensitive boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists hc_site_settings_category_idx on public.hc_site_settings (category,key);

-- Admin tables are server-control-plane data. Browser clients do not receive direct grants.
alter table public.hc_admin_staff enable row level security;
alter table public.hc_user_admin_state enable row level security;
alter table public.hc_admin_audit_log enable row level security;
alter table public.hc_admin_markets enable row level security;
alter table public.hc_cms_posts enable row level security;
alter table public.hc_cms_media enable row level security;
alter table public.hc_notification_campaigns enable row level security;
alter table public.hc_site_settings enable row level security;

revoke all on public.hc_admin_staff from anon, authenticated;
revoke all on public.hc_user_admin_state from anon, authenticated;
revoke all on public.hc_admin_audit_log from anon, authenticated;
revoke all on public.hc_admin_markets from anon, authenticated;
revoke all on public.hc_cms_posts from anon, authenticated;
revoke all on public.hc_cms_media from anon, authenticated;
revoke all on public.hc_notification_campaigns from anon, authenticated;
revoke all on public.hc_site_settings from anon, authenticated;

grant all on public.hc_admin_staff to service_role;
grant all on public.hc_user_admin_state to service_role;
grant all on public.hc_admin_audit_log to service_role;
grant all on public.hc_admin_markets to service_role;
grant all on public.hc_cms_posts to service_role;
grant all on public.hc_cms_media to service_role;
grant all on public.hc_notification_campaigns to service_role;
grant all on public.hc_site_settings to service_role;

comment on table public.hc_admin_staff is 'Heart Connect least-privilege admin/staff role registry. Accessed only from the server-side admin control plane.';
comment on table public.hc_user_admin_state is 'Administrative account state and feature flags kept separate from the core dating profile schema.';
comment on table public.hc_admin_audit_log is 'Append-oriented audit trail for admin reads and actions. Financial/safety audit history should not be casually deleted.';
comment on table public.hc_cms_posts is 'Blog/CMS content with slug, scheduling, SEO and optional external publishing channel state.';
comment on table public.hc_cms_media is 'CMS media metadata. public_url should only be populated for intentionally public CMS assets.';
