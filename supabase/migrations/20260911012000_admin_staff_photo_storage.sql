-- Heart Connect Admin Staff Photos v46
-- Additive admin-only photo storage for Staff & Roles.

alter table public.hc_admin_staff
  add column if not exists photo_storage_path text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'admin-staff-photos',
  'admin-staff-photos',
  false,
  5000000,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on column public.hc_admin_staff.photo_storage_path is
  'Private Supabase Storage path for the optional admin staff directory photo. Accessed only through the server-side admin control plane.';
