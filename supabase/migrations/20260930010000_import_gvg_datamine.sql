-- Keep full source metadata without forcing per-leader rules into global modifiers.
alter table public.gym_challenges add column datamine jsonb;
create unique index gym_challenges_datamine_source_idx
  on public.gym_challenges (gym_id, (datamine->'source'->>'path'))
  where datamine is not null;

create function public.import_gvg_datamine(p_gym_id uuid, p_metadata jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_leader jsonb;
  v_round jsonb;
begin
  if coalesce(p_metadata->>'name', '') = ''
    or coalesce(p_metadata->'source'->>'path', '') = ''
    or coalesce(jsonb_array_length(p_metadata->'leaders'), 0) <> 8
    or coalesce(jsonb_array_length(p_metadata->'rounds'), 0) <> 30
    or coalesce(jsonb_array_length(p_metadata->'modifiers'), 0) <> 3 then
    raise exception 'Incomplete datamine payload';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_gym_id::text, 0));
  select id into v_id from public.gym_challenges
    where gym_id = p_gym_id and datamine->'source'->>'path' = p_metadata->'source'->>'path'
    for update;
  if v_id is null then
    insert into public.gym_challenges(gym_id, name, notes, datamine)
      values(p_gym_id, p_metadata->>'name', p_metadata->>'notes', p_metadata)
      returning id into v_id;
  else
    -- Keep curated notes, assignments and leader IDs on repeat imports.
    if exists (
      select 1 from public.gym_challenge_leaders l
      join jsonb_to_recordset(p_metadata->'leaders') as n(slot_number integer, leader_name text)
        on n.slot_number = l.slot_number
      where l.challenge_id = v_id and l.leader_name <> n.leader_name
    ) then raise exception 'Leader identity changed; review the source before reimporting'; end if;
    update public.gym_challenges set datamine = p_metadata where id = v_id;
  end if;
  for v_leader in select value from jsonb_array_elements(p_metadata->'leaders') loop
    insert into public.gym_challenge_leaders(challenge_id, slot_number, leader_name, boss_type, weakness_type, battle_1_effect, battle_2_effect, battle_3_effect)
    values(v_id, (v_leader->>'slot_number')::integer, v_leader->>'leader_name', v_leader->>'boss_type', v_leader->>'weakness_type', v_leader->>'battle_1_effect', v_leader->>'battle_2_effect', v_leader->>'battle_3_effect')
    on conflict (challenge_id, slot_number) do update set
      leader_name = excluded.leader_name, boss_type = excluded.boss_type, weakness_type = excluded.weakness_type,
      battle_1_effect = excluded.battle_1_effect, battle_2_effect = excluded.battle_2_effect, battle_3_effect = excluded.battle_3_effect;
  end loop;
  insert into public.gym_challenge_modifiers(challenge_id, modifier_1, modifier_2, modifier_3)
    values(v_id, p_metadata->'modifiers'->>0, p_metadata->'modifiers'->>1, p_metadata->'modifiers'->>2)
    on conflict(challenge_id) do update set modifier_1 = excluded.modifier_1, modifier_2 = excluded.modifier_2, modifier_3 = excluded.modifier_3;
  delete from public.gym_challenge_round_stats where challenge_id = v_id;
  for v_round in select value from jsonb_array_elements(p_metadata->'rounds') loop
    insert into public.gym_challenge_round_stats
    select * from jsonb_populate_record(null::public.gym_challenge_round_stats, v_round || jsonb_build_object('challenge_id', v_id));
  end loop;
  if (select count(*) from public.gym_challenge_leaders where challenge_id = v_id) <> 8
    or (select count(*) from public.gym_challenge_round_stats where challenge_id = v_id) <> 30 then
    raise exception 'Invalid leader or round slots';
  end if;
  return v_id;
end;
$$;
revoke all on function public.import_gvg_datamine(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.import_gvg_datamine(uuid, jsonb) to service_role;
