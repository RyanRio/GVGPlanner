create table public.gym_challenge_manual_assignments (
  challenge_id uuid not null references public.gym_challenges (id) on delete cascade,
  leader_slot_number smallint not null,
  primary_member_slug text,
  secondary_member_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (challenge_id, leader_slot_number),
  check (leader_slot_number between 1 and 8)
);

create index gym_challenge_manual_assignments_challenge_idx
on public.gym_challenge_manual_assignments (challenge_id, leader_slot_number);

drop trigger if exists set_gym_challenge_manual_assignments_updated_at on public.gym_challenge_manual_assignments;
create trigger set_gym_challenge_manual_assignments_updated_at
before update on public.gym_challenge_manual_assignments
for each row
execute function public.set_updated_at();

alter table public.gym_challenge_manual_assignments enable row level security;

create policy "members can view challenge manual assignments"
on public.gym_challenge_manual_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.gym_challenges gc
    where gc.id = gym_challenge_manual_assignments.challenge_id
      and gc.gym_id = public.current_gym_id()
  )
);

create or replace function public.set_challenge_manual_assignment(
  p_challenge_id uuid,
  p_leader_slot_number integer,
  p_primary_member_slug text,
  p_secondary_member_slug text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_id uuid;
  v_primary_member_slug text;
  v_secondary_member_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.current_profile_role() <> 'admin' then
    raise exception 'Admin role required';
  end if;

  v_gym_id := public.current_gym_id();
  if v_gym_id is null then
    raise exception 'Current user is not assigned to a gym';
  end if;

  if p_leader_slot_number not between 1 and 8 then
    raise exception 'Leader slot must be between 1 and 8';
  end if;

  if not exists (
    select 1
    from public.gym_challenges
    where id = p_challenge_id
      and gym_id = v_gym_id
  ) then
    raise exception 'Challenge not found for current gym';
  end if;

  v_primary_member_slug := nullif(trim(coalesce(p_primary_member_slug, '')), '');
  v_secondary_member_slug := nullif(trim(coalesce(p_secondary_member_slug, '')), '');

  if v_primary_member_slug is not null and not exists (
    select 1
    from public.gym_roster_members grm
    where grm.member_slug = v_primary_member_slug
      and grm.gym_id = v_gym_id
      and grm.is_active = true
  ) then
    raise exception 'Primary member does not belong to current gym';
  end if;

  if v_secondary_member_slug is not null and not exists (
    select 1
    from public.gym_roster_members grm
    where grm.member_slug = v_secondary_member_slug
      and grm.gym_id = v_gym_id
      and grm.is_active = true
  ) then
    raise exception 'Secondary member does not belong to current gym';
  end if;

  if v_primary_member_slug is null and v_secondary_member_slug is null then
    delete from public.gym_challenge_manual_assignments
    where challenge_id = p_challenge_id
      and leader_slot_number = p_leader_slot_number;
    return;
  end if;

  insert into public.gym_challenge_manual_assignments (
    challenge_id,
    leader_slot_number,
    primary_member_slug,
    secondary_member_slug
  )
  values (
    p_challenge_id,
    p_leader_slot_number,
    v_primary_member_slug,
    v_secondary_member_slug
  )
  on conflict (challenge_id, leader_slot_number) do update
  set
    primary_member_slug = excluded.primary_member_slug,
    secondary_member_slug = excluded.secondary_member_slug,
    updated_at = now();
end;
$$;

revoke all on function public.set_challenge_manual_assignment(uuid, integer, text, text) from public;
grant execute on function public.set_challenge_manual_assignment(uuid, integer, text, text) to authenticated;
grant select on public.gym_challenge_manual_assignments to authenticated;
