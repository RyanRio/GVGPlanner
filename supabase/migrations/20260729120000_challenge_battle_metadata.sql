create table if not exists public.gym_challenge_round_stats (
  challenge_id uuid not null references public.gym_challenges (id) on delete cascade,
  round_number integer not null check (round_number between 1 and 30),
  points integer not null default 0,
  cumulative_points bigint not null default 0,
  middle_hp bigint not null default 0,
  middle_offenses integer not null default 0,
  middle_defenses integer not null default 0,
  middle_speed integer not null default 0,
  side_hp bigint not null default 0,
  side_offenses integer not null default 0,
  side_defenses integer not null default 0,
  side_speed integer not null default 0,
  primary key (challenge_id, round_number)
);

alter table public.gym_challenge_leaders
  add column if not exists boss_type text not null default '',
  add column if not exists battle_1_effect text not null default '',
  add column if not exists battle_2_effect text not null default '',
  add column if not exists battle_3_effect text not null default '';

create index if not exists gym_challenge_round_stats_challenge_idx
on public.gym_challenge_round_stats (challenge_id, round_number);

alter table public.gym_challenge_round_stats enable row level security;

drop policy if exists "members can view challenge round stats" on public.gym_challenge_round_stats;
create policy "members can view challenge round stats"
on public.gym_challenge_round_stats
for select
to authenticated
using (
  exists (
    select 1
    from public.gym_challenges gc
    where gc.id = gym_challenge_round_stats.challenge_id
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
  p_modifier_3 text,
  p_setup_pairs jsonb,
  p_round_stats jsonb default null
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
    boss_type text,
    weakness_type text,
    battle_1_effect text,
    battle_2_effect text,
    battle_3_effect text,
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

    if p_round_stats is not null then
      delete from public.gym_challenge_round_stats
      where challenge_id = v_challenge_id;
    end if;
  end if;

  insert into public.gym_challenge_leaders (
    challenge_id,
    slot_number,
    leader_name,
    boss_type,
    weakness_type,
    battle_1_effect,
    battle_2_effect,
    battle_3_effect
  )
  select
    v_challenge_id,
    leaders.slot_number,
    trim(leaders.leader_name),
    coalesce(trim(leaders.boss_type), ''),
    trim(leaders.weakness_type),
    coalesce(trim(leaders.battle_1_effect), ''),
    coalesce(trim(leaders.battle_2_effect), ''),
    coalesce(trim(leaders.battle_3_effect), '')
  from jsonb_to_recordset(coalesce(p_leaders, '[]'::jsonb)) as leaders(
    slot_number integer,
    leader_name text,
    boss_type text,
    weakness_type text,
    battle_1_effect text,
    battle_2_effect text,
    battle_3_effect text,
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
    boss_type text,
    weakness_type text,
    battle_1_effect text,
    battle_2_effect text,
    battle_3_effect text,
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
    boss_type text,
    weakness_type text,
    battle_1_effect text,
    battle_2_effect text,
    battle_3_effect text,
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
    union all
    select 'off_type'::text as setup_category, value
    from jsonb_array_elements_text(coalesce(p_setup_pairs -> 'off_type', '[]'::jsonb))
  ) as setup_pairs
  join public.sync_pairs sp on sp.id = setup_pairs.value;

  insert into public.gym_challenge_modifiers (challenge_id, modifier_1, modifier_2, modifier_3)
  values (
    v_challenge_id,
    trim(p_modifier_1),
    trim(p_modifier_2),
    trim(p_modifier_3)
  );

  if p_round_stats is not null then
    insert into public.gym_challenge_round_stats (
      challenge_id,
      round_number,
      points,
      cumulative_points,
      middle_hp,
      middle_offenses,
      middle_defenses,
      middle_speed,
      side_hp,
      side_offenses,
      side_defenses,
      side_speed
    )
    select
      v_challenge_id,
      stats.round_number,
      coalesce(stats.points, 0),
      coalesce(stats.cumulative_points, 0),
      coalesce(stats.middle_hp, 0),
      coalesce(stats.middle_offenses, 0),
      coalesce(stats.middle_defenses, 0),
      coalesce(stats.middle_speed, 0),
      coalesce(stats.side_hp, 0),
      coalesce(stats.side_offenses, 0),
      coalesce(stats.side_defenses, 0),
      coalesce(stats.side_speed, 0)
    from jsonb_to_recordset(coalesce(p_round_stats, '[]'::jsonb)) as stats(
      round_number integer,
      points integer,
      cumulative_points bigint,
      middle_hp bigint,
      middle_offenses integer,
      middle_defenses integer,
      middle_speed integer,
      side_hp bigint,
      side_offenses integer,
      side_defenses integer,
      side_speed integer
    )
    where stats.round_number between 1 and 30;
  end if;

  return v_challenge_id;
end;
$$;

revoke all on function public.save_gym_challenge(uuid, text, text, jsonb, text, text, text, jsonb, jsonb) from public;
grant execute on function public.save_gym_challenge(uuid, text, text, jsonb, text, text, text, jsonb, jsonb) to authenticated;

grant select on public.gym_challenge_round_stats to authenticated;
