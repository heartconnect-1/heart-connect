-- Heart Connect Admin <-> Security reconciliation.
-- This migration is intentionally applied AFTER Admin Phases 1-7.
-- It connects the Admin Control Plane to the security branch without weakening
-- authentication, match, messaging, call, media, privacy, or RLS protections.

-- Preserve the member's own discovery preference while an administrative
-- restriction temporarily forces the account out of discovery.
alter table public.hc_user_admin_state
  add column if not exists member_discoverable_before_enforcement boolean;

-- Bootstrap the native Admin Control Plane from trusted roles that already exist
-- in the reconciled Heart Connect database. Explicit hc_admin_staff rows win.
insert into public.hc_admin_staff(
  user_id,email,display_name,role,status,created_by,created_at,updated_at
)
select
  ur.user_id,
  lower(u.email),
  coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'),''), nullif(trim(u.raw_user_meta_data->>'name'),''), split_part(u.email,'@',1)),
  case ur.role
    when 'content_editor' then 'content_manager'
    when 'support_agent' then 'support_agent'
    when 'moderator' then 'moderator'
    when 'admin' then 'admin'
    when 'super_admin' then 'super_admin'
  end,
  'active',
  null,
  now(),
  now()
from public.user_roles ur
join auth.users u on u.id=ur.user_id
where ur.role in ('content_editor','support_agent','moderator','admin','super_admin')
  and u.email is not null
on conflict(user_id) do nothing;

-- Capture the user's own discoverability choice only when entering an
-- administrative restriction from the active state. This lets activation restore
-- the previous preference instead of assuming everyone should be discoverable.
create or replace function heart_private.capture_admin_discoverability_v1()
returns trigger
language plpgsql
security definer
set search_path='public','pg_temp'
as $$
begin
  if new.status <> 'active' then
    if tg_op='INSERT' or old.status='active' then
      select dp.is_discoverable
        into new.member_discoverable_before_enforcement
      from public.dating_profiles dp
      where dp.user_id=new.user_id;
    elsif new.member_discoverable_before_enforcement is null then
      new.member_discoverable_before_enforcement := old.member_discoverable_before_enforcement;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function heart_private.capture_admin_discoverability_v1() from public;

drop trigger if exists hc_admin_state_capture_discoverability on public.hc_user_admin_state;
create trigger hc_admin_state_capture_discoverability
before insert or update on public.hc_user_admin_state
for each row execute function heart_private.capture_admin_discoverability_v1();

-- Synchronize Admin Control Plane state with the security branch's canonical
-- account_enforcements table. Only enforcements whose reason_code starts with
-- admin_control_plane_ are lifted by this bridge; unrelated safety/security
-- enforcements are never changed by an Admin reactivation.
create or replace function heart_private.sync_admin_enforcement_v1()
returns trigger
language plpgsql
security definer
set search_path='public','pg_temp'
as $$
declare
  v_action text;
  v_code text;
  v_reason text;
begin
  if tg_op='UPDATE'
     and new.status is not distinct from old.status
     and new.suspended_until is not distinct from old.suspended_until
     and new.suspension_reason is not distinct from old.suspension_reason then
    return new;
  end if;

  update public.account_enforcements
     set active=false,
         lifted_at=coalesce(lifted_at,now())
   where user_id=new.user_id
     and active=true
     and reason_code like 'admin_control_plane_%';

  if new.status='active' then
    if new.member_discoverable_before_enforcement is not null then
      update public.dating_profiles
         set is_discoverable=new.member_discoverable_before_enforcement,
             updated_at=now()
       where user_id=new.user_id;
    end if;
    return new;
  end if;

  v_action := case new.status
    when 'restricted' then 'feature_restriction'
    when 'suspended' then 'temporary_suspension'
    when 'banned' then 'permanent_suspension'
    when 'deletion_pending' then 'visibility_restriction'
    else null
  end;

  v_code := case new.status
    when 'restricted' then 'admin_control_plane_restricted'
    when 'suspended' then 'admin_control_plane_suspended'
    when 'banned' then 'admin_control_plane_banned'
    when 'deletion_pending' then 'admin_control_plane_deletion_pending'
    else null
  end;

  if v_action is not null then
    v_reason := left(coalesce(nullif(trim(new.suspension_reason),''),'Administrative account control'),1000);
    insert into public.account_enforcements(
      user_id,action,reason_code,reason_summary,starts_at,ends_at,active,created_by,created_at
    ) values (
      new.user_id,
      v_action,
      v_code,
      v_reason,
      now(),
      case when new.status='suspended' then new.suspended_until else null end,
      true,
      new.last_action_by,
      now()
    );
  end if;

  return new;
end;
$$;

revoke all on function heart_private.sync_admin_enforcement_v1() from public;

drop trigger if exists hc_admin_state_sync_enforcement on public.hc_user_admin_state;
create trigger hc_admin_state_sync_enforcement
after insert or update on public.hc_user_admin_state
for each row execute function heart_private.sync_admin_enforcement_v1();

-- The security branch already had notifications before Admin Phase 5. CREATE TABLE
-- IF NOT EXISTS therefore could not install these two new foreign keys. Add them
-- now after both campaign and delivery tables exist.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.notifications'::regclass
      and conname='notifications_campaign_id_fkey'
  ) then
    alter table public.notifications
      add constraint notifications_campaign_id_fkey
      foreign key(campaign_id) references public.hc_notification_campaigns(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.notifications'::regclass
      and conname='notifications_delivery_id_fkey'
  ) then
    alter table public.notifications
      add constraint notifications_delivery_id_fkey
      foreign key(delivery_id) references public.hc_notification_delivery_queue(id) on delete set null;
  end if;
end
$$;

-- Align defaults with the Admin-compatible notification shape while preserving the
-- security branch's existing member-visible fields.
alter table public.notifications alter column event_type set default 'system';
alter table public.notifications alter column body set default '';

-- Phase 5 installs canonical hc_* own-row policies. Remove the older duplicate
-- names only after those policies exist. RLS stays enabled and authenticated users
-- still have only SELECT plus column-scoped read-state updates.
drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own on public.notifications;

comment on column public.hc_user_admin_state.member_discoverable_before_enforcement is
  'Member discoverability preference captured before an admin restriction so activation can restore it without overriding the member choice.';
comment on function heart_private.sync_admin_enforcement_v1() is
  'Bridges Admin Control Plane account state into security account_enforcements. It lifts only admin_control_plane_* enforcement rows.';
