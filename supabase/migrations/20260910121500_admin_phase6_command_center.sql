-- Heart Connect Admin Phase 6: command center, incidents, health snapshots, and readiness gates.
-- ADDITIVE ONLY. Do not apply to the shared Supabase project until
-- security-stabilization-2026-09-10 has been reconciled and reviewed.

create table if not exists public.hc_admin_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_key text unique,
  category text not null check (category in (
    'system','security','payments','moderation','verification','notifications','cms','integration','operations'
  )),
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  source text not null default 'manual' check (source in ('manual','health_check','automation')),
  title text not null check (char_length(title) between 1 and 220),
  summary text not null default '' check (char_length(summary) <= 4000),
  metadata jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  resolution_note text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists hc_admin_incidents_status_idx on public.hc_admin_incidents(status,severity,last_seen_at desc);
create index if not exists hc_admin_incidents_category_idx on public.hc_admin_incidents(category,status,last_seen_at desc);

create table if not exists public.hc_admin_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  overall_status text not null check (overall_status in ('healthy','degraded','critical','setup_required')),
  source text not null default 'cron' check (source in ('cron','admin','system')),
  checks jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id) on delete set null,
  captured_at timestamptz not null default now()
);
create index if not exists hc_admin_health_snapshots_time_idx on public.hc_admin_health_snapshots(captured_at desc);
create index if not exists hc_admin_health_snapshots_status_idx on public.hc_admin_health_snapshots(overall_status,captured_at desc);

create table if not exists public.hc_admin_readiness_checks (
  key text primary key,
  category text not null check (category in ('configuration','database','security','testing','operations','launch')),
  label text not null,
  description text,
  required boolean not null default true,
  status text not null default 'pending' check (status in ('pending','passed','blocked','waived')),
  evidence text,
  note text,
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists hc_admin_readiness_status_idx on public.hc_admin_readiness_checks(required,status,category,key);

insert into public.hc_admin_readiness_checks(key,category,label,description,required,status)
values
  ('admin_service_role','configuration','Admin service role configured','SUPABASE_SERVICE_ROLE_KEY is configured as a Cloudflare secret.',true,'pending'),
  ('owner_allowlist','configuration','Owner access configured','At least one owner/admin email is configured in Cloudflare secrets/vars.',true,'pending'),
  ('admin_migrations_reviewed','database','Admin migrations reviewed','Admin migrations have been reviewed in order against the latest security branch schema.',true,'pending'),
  ('security_branch_reconciled','security','Security branch reconciled','Latest security-stabilization changes are present in the combined candidate without being overwritten.',true,'pending'),
  ('admin_worker_ci','testing','Admin Worker CI passing','Admin branch isolation, syntax, safeguards and Wrangler dry-run are passing.',true,'pending'),
  ('combined_preview_tested','testing','Combined Cloudflare preview tested','Combined security + admin candidate has passed preview smoke tests before production.',true,'pending'),
  ('operational_queues_healthy','operations','Operational queues healthy','Moderation, verification, notification and automation queues are within acceptable operating thresholds.',true,'pending'),
  ('production_merge_approved','launch','Production merge approved','Owner/super-admin has explicitly approved the tested combined candidate for merge to main.',true,'pending'),
  ('workers_ai_binding','configuration','Workers AI binding configured','Optional Admin AI binding is configured when Admin AI will be used.',false,'pending'),
  ('external_social_adapters','configuration','External social adapters connected','Optional Facebook, TikTok and Google Business adapters are approved and tested before enabling auto-publish.',false,'pending')
on conflict(key) do nothing;

alter table public.hc_admin_incidents enable row level security;
alter table public.hc_admin_health_snapshots enable row level security;
alter table public.hc_admin_readiness_checks enable row level security;

revoke all on public.hc_admin_incidents from anon, authenticated;
revoke all on public.hc_admin_health_snapshots from anon, authenticated;
revoke all on public.hc_admin_readiness_checks from anon, authenticated;

grant all on public.hc_admin_incidents to service_role;
grant all on public.hc_admin_health_snapshots to service_role;
grant all on public.hc_admin_readiness_checks to service_role;

comment on table public.hc_admin_incidents is 'Admin-only incident registry. Automatic health checks may open/reopen incidents but never perform user, payment, moderation, verification, or deletion actions.';
comment on table public.hc_admin_health_snapshots is 'Privacy-minimized operational health evidence. Never store message bodies, credentials, private media, identity evidence, or sensitive profile traits.';
comment on table public.hc_admin_readiness_checks is 'Pre-production readiness gates. Required launch gates cannot be waived from the Admin Phase 6 API.';
