create policy account_profiles_insert_own
on public.account_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);
