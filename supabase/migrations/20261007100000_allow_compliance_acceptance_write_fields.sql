-- Allow the authenticated compliance gate to persist only its own legal-acceptance fields.
-- RLS still requires auth.uid() = user_id, so this does not grant cross-account access.
grant insert (
  user_id,
  terms_accepted_at,
  privacy_accepted_at,
  age_confirmed_at,
  terms_version,
  privacy_version,
  community_guidelines_version,
  updated_at
) on public.account_profiles to authenticated;

grant update (
  terms_accepted_at,
  privacy_accepted_at,
  age_confirmed_at,
  terms_version,
  privacy_version,
  community_guidelines_version,
  updated_at
) on public.account_profiles to authenticated;
