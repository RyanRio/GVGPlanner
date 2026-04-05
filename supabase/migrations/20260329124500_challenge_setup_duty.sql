create table public.gym_challenge_setup_duty_members (
  challenge_id uuid not null references public.gym_challenges (id) on delete cascade,
  member_slug text not null,
  created_at timestamptz not null default now(),
  primary key (challenge_id, member_slug)
);

create index gym_challenge_setup_duty_members_challenge_idx
on public.gym_challenge_setup_duty_members (challenge_id);

alter table public.gym_challenge_setup_duty_members enable row level security;

create policy "members can view challenge setup duty members"
on public.gym_challenge_setup_duty_members
for select
to authenticated
using (
  exists (
    select 1
    from public.gym_challenges gc
    where gc.id = gym_challenge_setup_duty_members.challenge_id
      and gc.gym_id = public.current_gym_id()
  )
);

create or replace function public.set_challenge_setup_duty_members(
  p_challenge_id uuid,
  p_member_slugs text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_id uuid;
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

  if not exists (
    select 1
    from public.gym_challenges
    where id = p_challenge_id
      and gym_id = v_gym_id
  ) then
    raise exception 'Challenge not found for current gym';
  end if;

  delete from public.gym_challenge_setup_duty_members
  where challenge_id = p_challenge_id;

  insert into public.gym_challenge_setup_duty_members (challenge_id, member_slug)
  select
    p_challenge_id,
    trimmed.value
  from (
    select distinct trim(value) as value
    from unnest(coalesce(p_member_slugs, array[]::text[])) as value
  ) as trimmed
  where trimmed.value <> ''
    and exists (
      select 1
      from public.gym_roster_members grm
      where grm.member_slug = trimmed.value
        and grm.gym_id = v_gym_id
        and grm.is_active = true
    );
end;
$$;

revoke all on function public.set_challenge_setup_duty_members(uuid, text[]) from public;
grant execute on function public.set_challenge_setup_duty_members(uuid, text[]) to authenticated;
grant select on public.gym_challenge_setup_duty_members to authenticated;
