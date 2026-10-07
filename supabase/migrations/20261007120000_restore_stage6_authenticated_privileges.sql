-- Restore the intended PostgREST privileges for authenticated Stage 6 members.
-- RLS remains the authorization boundary; these grants only allow the authenticated
-- role to reach the policies already defined on each table.

grant select on public.stage6_communities to authenticated;

grant select, insert, update, delete on public.stage6_community_members to authenticated;
grant select, insert, update, delete on public.stage6_date_plans to authenticated;
grant select, insert, update, delete on public.stage6_event_rsvps to authenticated;
grant select, insert, update on public.stage6_events to authenticated;
grant select, insert, update, delete on public.stage6_memories to authenticated;
grant select, insert, update, delete on public.stage6_moments to authenticated;
grant select, insert, update, delete on public.stage6_relationships to authenticated;
grant select, insert, update, delete on public.stage6_user_state to authenticated;

grant select, insert on public.stage6_date_feedback to authenticated;
grant select, insert on public.stage6_event_checkins to authenticated;
grant select, insert, update on public.stage6_introductions to authenticated;
grant select, insert, update on public.stage6_private_sparks to authenticated;
grant select, insert on public.stage6_reports to authenticated;
grant select, insert on public.stage6_safety_escalations to authenticated;

-- Responding to an introduction updates only a participant's consent/status.
drop policy if exists "stage6 introductions participant update" on public.stage6_introductions;
create policy "stage6 introductions participant update"
on public.stage6_introductions
for update to authenticated
using (
  (select auth.uid()) = introducer
  or (select auth.uid()) = first_user
  or (select auth.uid()) = second_user
)
with check (
  (select auth.uid()) = introducer
  or (select auth.uid()) = first_user
  or (select auth.uid()) = second_user
);

-- stage4 second-chance reads a member's own activity.
grant select on public.stage4_activity to authenticated;
