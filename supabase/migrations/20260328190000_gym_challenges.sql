create table public.gym_challenges (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  name text not null,
  notes text not null default '',
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gym_challenge_leaders (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.gym_challenges (id) on delete cascade,
  slot_number smallint not null,
  leader_name text not null,
  weakness_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, slot_number),
  check (slot_number between 1 and 8)
);

create table public.gym_challenge_modifiers (
  challenge_id uuid primary key references public.gym_challenges (id) on delete cascade,
  modifier_1 text not null,
  modifier_2 text not null,
  modifier_3 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index gym_challenges_one_current_per_gym_idx
on public.gym_challenges (gym_id)
where is_current;

create index gym_challenges_gym_name_idx on public.gym_challenges (gym_id, name);
create index gym_challenge_leaders_challenge_slot_idx on public.gym_challenge_leaders (challenge_id, slot_number);

drop trigger if exists set_gym_challenges_updated_at on public.gym_challenges;
create trigger set_gym_challenges_updated_at
before update on public.gym_challenges
for each row
execute function public.set_updated_at();

drop trigger if exists set_gym_challenge_leaders_updated_at on public.gym_challenge_leaders;
create trigger set_gym_challenge_leaders_updated_at
before update on public.gym_challenge_leaders
for each row
execute function public.set_updated_at();

drop trigger if exists set_gym_challenge_modifiers_updated_at on public.gym_challenge_modifiers;
create trigger set_gym_challenge_modifiers_updated_at
before update on public.gym_challenge_modifiers
for each row
execute function public.set_updated_at();

alter table public.gym_challenges enable row level security;
alter table public.gym_challenge_leaders enable row level security;
alter table public.gym_challenge_modifiers enable row level security;

create policy "members can view gym challenges"
on public.gym_challenges
for select
to authenticated
using (gym_id = public.current_gym_id());

create policy "members can view challenge leaders"
on public.gym_challenge_leaders
for select
to authenticated
using (
  exists (
    select 1
    from public.gym_challenges gc
    where gc.id = gym_challenge_leaders.challenge_id
      and gc.gym_id = public.current_gym_id()
  )
);

create policy "members can view challenge modifiers"
on public.gym_challenge_modifiers
for select
to authenticated
using (
  exists (
    select 1
    from public.gym_challenges gc
    where gc.id = gym_challenge_modifiers.challenge_id
      and gc.gym_id = public.current_gym_id()
  )
);

create or replace function public.save_gym_challenge(
  p_challenge_id uuid,
  p_name text,
  p_notes text,
  p_leaders jsonb,
  p_modifier_1 text,
  p_modifier_2 text,
  p_modifier_3 text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_id uuid;
  v_challenge_id uuid;
  v_existing_gym_id uuid;
  v_leader_count integer;
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

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Challenge name is required';
  end if;

  if coalesce(trim(p_modifier_1), '') = '' or coalesce(trim(p_modifier_2), '') = '' or coalesce(trim(p_modifier_3), '') = '' then
    raise exception 'All three modifiers are required';
  end if;

  select count(*)
  into v_leader_count
  from jsonb_to_recordset(coalesce(p_leaders, '[]'::jsonb)) as leaders(
    slot_number integer,
    leader_name text,
    weakness_type text
  );

  if v_leader_count <> 8 then
    raise exception 'Exactly 8 leaders are required';
  end if;

  if p_challenge_id is null then
    insert into public.gym_challenges (gym_id, name, notes)
    values (v_gym_id, trim(p_name), coalesce(p_notes, ''))
    returning id into v_challenge_id;
  else
    select gym_id
    into v_existing_gym_id
    from public.gym_challenges
    where id = p_challenge_id;

    if v_existing_gym_id is null then
      raise exception 'Challenge not found';
    end if;

    if v_existing_gym_id <> v_gym_id then
      raise exception 'Challenge does not belong to the current gym';
    end if;

    update public.gym_challenges
    set
      name = trim(p_name),
      notes = coalesce(p_notes, '')
    where id = p_challenge_id;

    v_challenge_id := p_challenge_id;

    delete from public.gym_challenge_leaders
    where challenge_id = v_challenge_id;

    delete from public.gym_challenge_modifiers
    where challenge_id = v_challenge_id;
  end if;

  insert into public.gym_challenge_leaders (challenge_id, slot_number, leader_name, weakness_type)
  select
    v_challenge_id,
    leaders.slot_number,
    trim(leaders.leader_name),
    trim(leaders.weakness_type)
  from jsonb_to_recordset(coalesce(p_leaders, '[]'::jsonb)) as leaders(
    slot_number integer,
    leader_name text,
    weakness_type text
  )
  where leaders.slot_number between 1 and 8
    and coalesce(trim(leaders.leader_name), '') <> ''
    and coalesce(trim(leaders.weakness_type), '') <> '';

  if (select count(*) from public.gym_challenge_leaders where challenge_id = v_challenge_id) <> 8 then
    raise exception 'Each leader slot must have a name and weakness type';
  end if;

  insert into public.gym_challenge_modifiers (challenge_id, modifier_1, modifier_2, modifier_3)
  values (
    v_challenge_id,
    trim(p_modifier_1),
    trim(p_modifier_2),
    trim(p_modifier_3)
  );

  return v_challenge_id;
end;
$$;

create or replace function public.set_current_gym_challenge(
  p_challenge_id uuid
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

  update public.gym_challenges
  set is_current = (id = p_challenge_id)
  where gym_id = v_gym_id;
end;
$$;

revoke all on function public.save_gym_challenge(uuid, text, text, jsonb, text, text, text) from public;
revoke all on function public.set_current_gym_challenge(uuid) from public;
grant execute on function public.save_gym_challenge(uuid, text, text, jsonb, text, text, text) to authenticated;
grant execute on function public.set_current_gym_challenge(uuid) to authenticated;

grant select on public.gym_challenges to authenticated;
grant select on public.gym_challenge_leaders to authenticated;
grant select on public.gym_challenge_modifiers to authenticated;
