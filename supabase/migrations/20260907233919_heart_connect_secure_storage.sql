insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-media','profile-media',false,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']),
  ('verification-documents','verification-documents',false,15728640,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile_media_storage_select_own" on storage.objects
for select to authenticated
using (bucket_id = 'profile-media' and owner_id = (select auth.uid()::text));

create policy "profile_media_storage_insert_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "profile_media_storage_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'profile-media' and owner_id = (select auth.uid()::text))
with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "profile_media_storage_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'profile-media' and owner_id = (select auth.uid()::text));

create policy "verification_storage_select_own" on storage.objects
for select to authenticated
using (bucket_id = 'verification-documents' and owner_id = (select auth.uid()::text));

create policy "verification_storage_insert_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'verification-documents' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "verification_storage_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'verification-documents' and owner_id = (select auth.uid()::text))
with check (bucket_id = 'verification-documents' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "verification_storage_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'verification-documents' and owner_id = (select auth.uid()::text));
