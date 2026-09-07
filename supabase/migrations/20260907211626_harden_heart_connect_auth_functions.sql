alter function public.touch_updated_at() set search_path = '';
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
