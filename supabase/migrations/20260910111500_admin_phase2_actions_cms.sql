-- Heart Connect Admin Phase 2
-- Additive only. This migration is intentionally NOT coupled to discovery, messaging,
-- calls, or authentication flows. Apply only after the security branch is reconciled.

alter table public.reports
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text,
  add column if not exists resolution jsonb not null default '{}'::jsonb;

alter table public.verification_requests
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists review_note text;

create table if not exists public.hc_admin_user_action_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('activate','restrict','suspend','ban','deletion_pending','feature_update')),
  previous_state jsonb not null default '{}'::jsonb,
  next_state jsonb not null default '{}'::jsonb,
  reason text,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text,
  created_at timestamptz not null default now()
);
create index if not exists hc_admin_user_action_history_user_idx on public.hc_admin_user_action_history(user_id,created_at desc);
create index if not exists hc_admin_user_action_history_actor_idx on public.hc_admin_user_action_history(actor_user_id,created_at desc);

create table if not exists public.hc_cms_post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.hc_cms_posts(id) on delete cascade,
  revision_number integer not null,
  snapshot jsonb not null,
  editor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(post_id,revision_number)
);
create index if not exists hc_cms_post_revisions_post_idx on public.hc_cms_post_revisions(post_id,revision_number desc);

create table if not exists public.hc_admin_ai_usage (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text,
  workspace text not null,
  prompt_chars integer not null default 0,
  provider text not null,
  outcome text not null check (outcome in ('success','unavailable','failed','rate_limited')),
  created_at timestamptz not null default now()
);
create index if not exists hc_admin_ai_usage_created_idx on public.hc_admin_ai_usage(created_at desc);
create index if not exists hc_admin_ai_usage_actor_idx on public.hc_admin_ai_usage(actor_user_id,created_at desc);

alter table public.hc_admin_user_action_history enable row level security;
alter table public.hc_cms_post_revisions enable row level security;
alter table public.hc_admin_ai_usage enable row level security;

revoke all on public.hc_admin_user_action_history from anon, authenticated;
revoke all on public.hc_cms_post_revisions from anon, authenticated;
revoke all on public.hc_admin_ai_usage from anon, authenticated;

grant all on public.hc_admin_user_action_history to service_role;
grant all on public.hc_cms_post_revisions to service_role;
grant all on public.hc_admin_ai_usage to service_role;

-- Public CMS assets are uploaded only by the server-side admin control plane.
-- The bucket is public because published blog/site media must be directly renderable.
insert into storage.buckets (id,name,public)
values ('hc-cms-public','hc-cms-public',true)
on conflict (id) do update set public=excluded.public;

comment on table public.hc_admin_user_action_history is 'Append-only operational history for reversible user account state and feature actions.';
comment on table public.hc_cms_post_revisions is 'CMS revision snapshots captured before edits so content can be reviewed or restored later.';
comment on table public.hc_admin_ai_usage is 'Privacy-minimized Admin AI telemetry. Prompts and generated content are intentionally not stored here.';
