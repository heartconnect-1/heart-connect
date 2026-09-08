drop index if exists public.legal_acceptance_source_event_uq;
alter table public.legal_acceptance_events drop constraint if exists legal_acceptance_events_user_source_key;
alter table public.legal_acceptance_events add constraint legal_acceptance_events_user_source_key unique(user_id,source_event_id);
drop index if exists public.consent_events_source_event_uq;
alter table public.consent_events drop constraint if exists consent_events_user_source_key;
alter table public.consent_events add constraint consent_events_user_source_key unique(user_id,source_event_id);
drop index if exists public.data_export_source_request_uq;
alter table public.data_export_requests drop constraint if exists data_export_requests_user_source_key;
alter table public.data_export_requests add constraint data_export_requests_user_source_key unique(user_id,source_request_id);
