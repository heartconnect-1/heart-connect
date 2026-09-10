-- Heart Connect Admin v50 security hardening
-- Retire public execution of the legacy role-by-email SECURITY DEFINER bridge.

revoke all on function public.heart_connect_role_for_email(text) from public;
revoke execute on function public.heart_connect_role_for_email(text) from anon;
revoke execute on function public.heart_connect_role_for_email(text) from authenticated;
grant execute on function public.heart_connect_role_for_email(text) to service_role;

comment on function public.heart_connect_role_for_email(text) is
  'Legacy server-side compatibility helper. Execution is restricted to service_role; browser roles must not call this SECURITY DEFINER function.';
