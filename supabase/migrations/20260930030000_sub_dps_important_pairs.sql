alter table public.gym_challenge_leader_pairs
  drop constraint gym_challenge_leader_pairs_damage_category_check;

alter table public.gym_challenge_leader_pairs
  add constraint gym_challenge_leader_pairs_damage_category_check
  check (damage_category in ('physical', 'special', 'both', 'sub_dps', 'unclassified'));
