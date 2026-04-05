create table public.gym_challenge_leader_setup_pairs (
  leader_id uuid not null references public.gym_challenge_leaders (id) on delete cascade,
  pair_id text not null references public.sync_pairs (id) on delete restrict,
  setup_category text not null default 'rebuff',
  created_at timestamptz not null default now(),
  primary key (leader_id, pair_id, setup_category),
  check (setup_category = 'rebuff')
);

create table public.gym_challenge_setup_pairs (
  challenge_id uuid not null references public.gym_challenges (id) on delete cascade,
  pair_id text not null references public.sync_pairs (id) on delete restrict,
  setup_category text not null,
  created_at timestamptz not null default now(),
  primary key (challenge_id, pair_id, setup_category),
  check (setup_category in ('physical_breaks', 'special_breaks', 'debuffs_chip'))
);

create index gym_challenge_leader_setup_pairs_pair_idx
on public.gym_challenge_leader_setup_pairs (pair_id);

create index gym_challenge_setup_pairs_challenge_idx
on public.gym_challenge_setup_pairs (challenge_id, setup_category);

alter table public.gym_challenge_leader_setup_pairs enable row level security;
alter table public.gym_challenge_setup_pairs enable row level security;

create policy "members can view challenge leader setup pairs"
on public.gym_challenge_leader_setup_pairs
for select
to authenticated
using (
  exists (
    select 1
    from public.gym_challenge_leaders gcl
    join public.gym_challenges gc on gc.id = gcl.challenge_id
    where gcl.id = gym_challenge_leader_setup_pairs.leader_id
      and gc.gym_id = public.current_gym_id()
  )
);

create policy "members can view challenge setup pairs"
on public.gym_challenge_setup_pairs
for select
to authenticated
using (
  exists (
    select 1
    from public.gym_challenges gc
    where gc.id = gym_challenge_setup_pairs.challenge_id
      and gc.gym_id = public.current_gym_id()
  )
);

drop function if exists public.save_gym_challenge(uuid, text, text, jsonb, text, text, text);

create or replace function public.save_gym_challenge(
  p_challenge_id uuid,
  p_name text,
  p_notes text,
  p_leaders jsonb,
  p_modifier_1 text,
  p_modifier_2 text,
  p_modifier_3 text,
  p_setup_pairs jsonb
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
    weakness_type text,
    important_pair_ids jsonb,
    rebuff_pair_ids jsonb
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

    delete from public.gym_challenge_setup_pairs
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
    weakness_type text,
    important_pair_ids jsonb,
    rebuff_pair_ids jsonb
  )
  where leaders.slot_number between 1 and 8
    and coalesce(trim(leaders.leader_name), '') <> ''
    and coalesce(trim(leaders.weakness_type), '') <> '';

  if (select count(*) from public.gym_challenge_leaders where challenge_id = v_challenge_id) <> 8 then
    raise exception 'Each leader slot must have a name and weakness type';
  end if;

  insert into public.gym_challenge_leader_pairs (leader_id, pair_id)
  select
    gcl.id,
    important_pair_ids.value
  from jsonb_to_recordset(coalesce(p_leaders, '[]'::jsonb)) as leaders(
    slot_number integer,
    leader_name text,
    weakness_type text,
    important_pair_ids jsonb,
    rebuff_pair_ids jsonb
  )
  join public.gym_challenge_leaders gcl
    on gcl.challenge_id = v_challenge_id
   and gcl.slot_number = leaders.slot_number
  cross join lateral jsonb_array_elements_text(coalesce(leaders.important_pair_ids, '[]'::jsonb)) as important_pair_ids(value)
  join public.sync_pairs sp on sp.id = important_pair_ids.value;

  insert into public.gym_challenge_leader_setup_pairs (leader_id, pair_id, setup_category)
  select
    gcl.id,
    rebuff_pair_ids.value,
    'rebuff'
  from jsonb_to_recordset(coalesce(p_leaders, '[]'::jsonb)) as leaders(
    slot_number integer,
    leader_name text,
    weakness_type text,
    important_pair_ids jsonb,
    rebuff_pair_ids jsonb
  )
  join public.gym_challenge_leaders gcl
    on gcl.challenge_id = v_challenge_id
   and gcl.slot_number = leaders.slot_number
  cross join lateral jsonb_array_elements_text(coalesce(leaders.rebuff_pair_ids, '[]'::jsonb)) as rebuff_pair_ids(value)
  join public.sync_pairs sp on sp.id = rebuff_pair_ids.value;

  insert into public.gym_challenge_setup_pairs (challenge_id, pair_id, setup_category)
  select
    v_challenge_id,
    setup_pairs.value,
    setup_pairs.setup_category
  from (
    select 'physical_breaks'::text as setup_category, value
    from jsonb_array_elements_text(coalesce(p_setup_pairs -> 'physical_breaks', '[]'::jsonb))
    union all
    select 'special_breaks'::text as setup_category, value
    from jsonb_array_elements_text(coalesce(p_setup_pairs -> 'special_breaks', '[]'::jsonb))
    union all
    select 'debuffs_chip'::text as setup_category, value
    from jsonb_array_elements_text(coalesce(p_setup_pairs -> 'debuffs_chip', '[]'::jsonb))
  ) as setup_pairs
  join public.sync_pairs sp on sp.id = setup_pairs.value;

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

revoke all on function public.save_gym_challenge(uuid, text, text, jsonb, text, text, text, jsonb) from public;
grant execute on function public.save_gym_challenge(uuid, text, text, jsonb, text, text, text, jsonb) to authenticated;

grant select on public.gym_challenge_leader_setup_pairs to authenticated;
grant select on public.gym_challenge_setup_pairs to authenticated;
