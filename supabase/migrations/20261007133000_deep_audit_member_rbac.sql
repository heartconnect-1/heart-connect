-- Deep-audit RBAC restoration.
-- These grants align the member APIs with the existing owner-scoped RLS policies.
-- Do not grant member INSERT/UPDATE on matches: match creation remains server-controlled.

grant select, insert, delete on public.saved_profiles to authenticated;

grant select, insert, update, delete on public.stage4_profile_details to authenticated;

grant select, insert, update on public.stage7_records to authenticated;

grant select, insert, delete on public.stage7_subscriptions to authenticated;
