-- Prevent accounts with an active deletion request from continuing member activity.
-- The same guard is enforced live in Supabase as part of the 2026-10-06 audit.

create or replace function heart_private.user_restricted(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select p_user is null
    or exists (
      select 1
      from public.account_enforcements e
      where e.user_id = p_user
        and e.active = true
        and e.action in (
          'temporary_suspension',
          'permanent_suspension',
          'visibility_restriction',
          'feature_restriction'
        )
        and (e.ends_at is null or e.ends_at > now())
    )
    or exists (
      select 1
      from public.account_deletion_requests d
      where d.user_id = p_user
        and d.status in ('requested', 'processing')
    );
$function$;

drop policy if exists profile_media_storage_insert_own on storage.objects;
create policy profile_media_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = (select (auth.uid())::text)
  and not heart_private.user_restricted(auth.uid())
);

drop policy if exists profile_media_storage_update_own on storage.objects;
create policy profile_media_storage_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-media'
  and owner_id = (select (auth.uid())::text)
  and not heart_private.user_restricted(auth.uid())
)
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = (select (auth.uid())::text)
  and not heart_private.user_restricted(auth.uid())
);

drop policy if exists verification_storage_insert_own on storage.objects;
create policy verification_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = (select (auth.uid())::text)
  and not heart_private.user_restricted(auth.uid())
);

drop policy if exists verification_storage_update_own on storage.objects;
create policy verification_storage_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'verification-documents'
  and owner_id = (select (auth.uid())::text)
  and not heart_private.user_restricted(auth.uid())
)
with check (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = (select (auth.uid())::text)
  and not heart_private.user_restricted(auth.uid())
);
