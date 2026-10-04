-- Local Supabase integration test. Creates an isolated challenge and rolls it back.
begin;
do $$
declare
  admin_id uuid;
  pair_ids text[];
  leaders jsonb;
  v_challenge_id uuid;
  categories text[];
begin
  select id into strict admin_id from public.profiles where app_role = 'admin' limit 1;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  select array_agg(id order by id) into pair_ids from (select id from public.sync_pairs order by id limit 5) p;
  if array_length(pair_ids, 1) <> 5 then raise exception 'Catalog fixture missing'; end if;
  select jsonb_agg(jsonb_build_object(
    'slot_number', slot, 'leader_name', 'Test ' || slot, 'weakness_type', 'Normal',
    'important_pair_ids', case when slot = 1 then to_jsonb(pair_ids) else '[]'::jsonb end,
    'important_pairs', case when slot = 1 then jsonb_build_array(
      jsonb_build_object('pair_id', pair_ids[1], 'damage_category', 'physical'),
      jsonb_build_object('pair_id', pair_ids[2], 'damage_category', 'special'),
      jsonb_build_object('pair_id', pair_ids[3], 'damage_category', 'both'),
      jsonb_build_object('pair_id', pair_ids[4], 'damage_category', 'unclassified'),
      jsonb_build_object('pair_id', pair_ids[5], 'damage_category', 'sub_dps')
    ) else '[]'::jsonb end
  ) order by slot) into leaders from generate_series(1, 8) slot;
  v_challenge_id := public.save_gym_challenge(null, 'Damage category integration test', '', leaders, 'A', 'B', 'C', '{}', null);
  -- Save a second time, covering the existing delete/reinsert behavior.
  perform public.save_gym_challenge(v_challenge_id, 'Damage category integration test', '', leaders, 'A', 'B', 'C', '{}', null);
  select array_agg(p.damage_category order by p.pair_id) into categories
    from public.gym_challenge_leader_pairs p join public.gym_challenge_leaders l on l.id = p.leader_id
    where l.challenge_id = v_challenge_id;
  if categories is distinct from array['physical', 'special', 'both', 'unclassified', 'sub_dps'] then
    raise exception 'Damage categories did not survive save: %', categories;
  end if;
  begin
    perform public.save_gym_challenge(v_challenge_id, 'Invalid category', '',
      jsonb_set(leaders, '{0,important_pairs,0,damage_category}', '"invalid"'), 'A', 'B', 'C', '{}', null);
    raise exception 'Invalid category unexpectedly accepted';
  exception when check_violation then null;
  end;
  if (select name from public.gym_challenges where id = v_challenge_id) <> 'Damage category integration test' then
    raise exception 'Failed save did not roll back';
  end if;
end;
$$;
rollback;
