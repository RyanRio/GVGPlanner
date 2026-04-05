create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.app_role
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.current_gym_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select gm.gym_id
  from public.gym_members gm
  where gm.profile_id = auth.uid()
  order by gm.joined_at
  limit 1
$$;

drop policy if exists "profiles can read self or admin can read all" on public.profiles;
create policy "profiles can read self or admin can read all"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.current_profile_role() = 'admin'
);

drop policy if exists "profiles can update self" on public.profiles;
create policy "profiles can update self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "members can view current gym" on public.gyms;
create policy "members can view current gym"
on public.gyms
for select
to authenticated
using (id = public.current_gym_id());

drop policy if exists "members can view gym memberships" on public.gym_members;
create policy "members can view gym memberships"
on public.gym_members
for select
to authenticated
using (gym_id = public.current_gym_id());

drop policy if exists "members can view roster members" on public.gym_roster_members;
create policy "members can view roster members"
on public.gym_roster_members
for select
to authenticated
using (gym_id = public.current_gym_id());

drop policy if exists "members can view roster imports" on public.roster_imports;
create policy "members can view roster imports"
on public.roster_imports
for select
to authenticated
using (gym_id = public.current_gym_id());

drop policy if exists "members can view current roster" on public.member_current_roster;
create policy "members can view current roster"
on public.member_current_roster
for select
to authenticated
using (
  exists (
    select 1
    from public.gym_roster_members grm
    where grm.id = member_current_roster.member_id
      and grm.gym_id = public.current_gym_id()
  )
);
