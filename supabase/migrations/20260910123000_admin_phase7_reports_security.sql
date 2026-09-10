-- Heart Connect Admin Phase 7: advanced reporting, privacy-safe exports, security review and reconciliation evidence.
-- ADDITIVE ONLY. Do not apply to the shared Supabase project until the security branch is reconciled and reviewed.

create table if not exists public.hc_admin_export_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text,
  dataset text not null check (dataset in (
    'users','moderation','verification','payments','notifications','audit','incidents'
  )),
  format text not null default 'csv' check (format in ('csv')),
  row_count integer not null default 0 check (row_count >= 0),
  filters jsonb not null default '{}'::jsonb,
  redaction_policy text not null default 'phase7_allowlist',
  created_at timestamptz not null default now()
);
create index if not exists hc_admin_export_log_created_idx on public.hc_admin_export_log(created_at desc);
create index if not exists hc_admin_export_log_actor_idx on public.hc_admin_export_log(actor_user_id,created_at desc);

create table if not exists public.hc_admin_security_reviews (
  id uuid primary key default gen_random_uuid(),
  review_type text not null check (review_type in ('permissions','export_privacy','reconciliation')),
  status text not null check (status in ('passed','needs_action','blocked')),
  findings jsonb not null default '[]'::jsonb,
  note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewer_email text,
  reviewer_role text,
  reviewed_at timestamptz not null default now()
);
create index if not exists hc_admin_security_reviews_type_idx on public.hc_admin_security_reviews(review_type,reviewed_at desc);

create table if not exists public.hc_admin_report_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  dataset text not null check (dataset in (
    'overview','users','moderation','verification','payments','notifications','audit','incidents'
  )),
  config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hc_admin_report_presets_dataset_idx on public.hc_admin_report_presets(dataset,updated_at desc);

insert into public.hc_admin_readiness_checks(key,category,label,description,required,status)
values
  ('admin_permissions_review','security','Admin permissions reviewed','Owner/super-admin has reviewed the admin role matrix and active staff assignments after Phase 7.',true,'pending'),
  ('admin_export_privacy_review','security','Admin export privacy reviewed','Privacy-safe export allowlists and audit logging have been reviewed before production enablement.',true,'pending'),
  ('admin_reconciliation_plan_reviewed','testing','Admin reconciliation plan reviewed','The final admin/security reconciliation checklist has been reviewed against the latest security branch checkpoint.',true,'pending')
on conflict(key) do nothing;

alter table public.hc_admin_export_log enable row level security;
alter table public.hc_admin_security_reviews enable row level security;
alter table public.hc_admin_report_presets enable row level security;

revoke all on public.hc_admin_export_log from anon, authenticated;
revoke all on public.hc_admin_security_reviews from anon, authenticated;
revoke all on public.hc_admin_report_presets from anon, authenticated;

grant all on public.hc_admin_export_log to service_role;
grant all on public.hc_admin_security_reviews to service_role;
grant all on public.hc_admin_report_presets to service_role;

comment on table public.hc_admin_export_log is 'Append-oriented audit evidence for privacy-safe admin CSV exports. Export contents are not stored here.';
comment on table public.hc_admin_security_reviews is 'Owner/super-admin security review evidence for permissions, export privacy and reconciliation readiness.';
comment on table public.hc_admin_report_presets is 'Reusable non-secret report filter presets. Do not store credentials, message bodies, identity evidence or other sensitive content in config.';
