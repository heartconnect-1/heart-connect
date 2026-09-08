create index if not exists legal_acceptance_document_version_idx on public.legal_acceptance_events(document_type,document_version);
create index if not exists enforcement_appeals_enforcement_idx on public.enforcement_appeals(enforcement_id);

drop policy if exists account_enforcements_staff_write on public.account_enforcements;
drop policy if exists account_enforcements_staff_insert on public.account_enforcements;
create policy account_enforcements_staff_insert on public.account_enforcements for insert to authenticated with check (private.is_compliance_staff());
drop policy if exists account_enforcements_staff_update on public.account_enforcements;
create policy account_enforcements_staff_update on public.account_enforcements for update to authenticated using (private.is_compliance_staff()) with check (private.is_compliance_staff());
