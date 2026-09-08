alter table public.account_profiles add column if not exists appdeploy_user_id text;
create unique index if not exists account_profiles_appdeploy_user_id_uq on public.account_profiles(appdeploy_user_id) where appdeploy_user_id is not null;
alter table public.legal_acceptance_events add column if not exists source_event_id text;
create unique index if not exists legal_acceptance_source_event_uq on public.legal_acceptance_events(user_id,source_event_id) where source_event_id is not null;
alter table public.consent_events add column if not exists source_event_id text;
create unique index if not exists consent_events_source_event_uq on public.consent_events(user_id,source_event_id) where source_event_id is not null;
alter table public.data_export_requests add column if not exists source_request_id text;
create unique index if not exists data_export_source_request_uq on public.data_export_requests(user_id,source_request_id) where source_request_id is not null;
