-- Run against local Supabase after importing No. 4. All changes roll back.
begin;
do $$
declare
  challenge public.gym_challenges;
  before_ids uuid[];
  after_ids uuid[];
  returned_id uuid;
  broken jsonb;
begin
  select * into strict challenge from public.gym_challenges
    where datamine->'source'->>'path' = '2.73/🥊 Pasio Gym Battle No. 4.txt';
  select array_agg(id order by slot_number) into before_ids
    from public.gym_challenge_leaders where challenge_id = challenge.id;
  returned_id := public.import_gvg_datamine(challenge.gym_id, challenge.datamine);
  select array_agg(id order by slot_number) into after_ids
    from public.gym_challenge_leaders where challenge_id = challenge.id;
  if returned_id <> challenge.id or before_ids <> after_ids then
    raise exception 'Reimport changed challenge or leader identity';
  end if;
  broken := jsonb_set(challenge.datamine, '{rounds,29,round_number}', '1');
  begin
    perform public.import_gvg_datamine(challenge.gym_id, broken);
    raise exception 'Invalid import unexpectedly succeeded';
  exception when unique_violation then null;
  end;
  if (select count(*) from public.gym_challenge_round_stats where challenge_id = challenge.id) <> 30
    or (select datamine from public.gym_challenges where id = challenge.id) <> challenge.datamine then
    raise exception 'Failed import did not roll back';
  end if;
  if has_function_privilege('authenticated', 'public.import_gvg_datamine(uuid,jsonb)', 'execute')
    or has_function_privilege('anon', 'public.import_gvg_datamine(uuid,jsonb)', 'execute') then
    raise exception 'Importer exposed to frontend roles';
  end if;
end;
$$;
rollback;
