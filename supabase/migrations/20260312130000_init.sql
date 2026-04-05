create extension if not exists "pgcrypto";

create type public.pair_rarity as enum (
  'general',
  'poke_fair',
  'master_fair',
  'seasonal',
  'variety'
);

create type public.pair_role as enum (
  'strike',
  'tech',
  'support',
  'sprint',
  'field',
  'multi'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.gym_members (
  gym_id uuid not null references public.gyms (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (gym_id, profile_id)
);

create table public.sync_pairs (
  id text primary key,
  trainer_name text not null,
  trainer_alt text,
  pokemon_name text not null,
  role public.pair_role not null,
  rarity public.pair_rarity not null default 'general',
  type text not null,
  region text not null,
  created_at timestamptz not null default now()
);

create table public.roster_submissions (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  submitted_at timestamptz not null default now(),
  source text not null default 'sync_pairs_tracker',
  raw_payload jsonb not null,
  notes text
);

create table public.roster_entries (
  submission_id uuid not null references public.roster_submissions (id) on delete cascade,
  pair_id text not null references public.sync_pairs (id) on delete restrict,
  sync_level integer,
  is_ex boolean not null default false,
  ex_role public.pair_role,
  is_favorite boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  primary key (submission_id, pair_id)
);

create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.gyms enable row level security;
alter table public.gym_members enable row level security;
alter table public.sync_pairs enable row level security;
alter table public.roster_submissions enable row level security;
alter table public.roster_entries enable row level security;

create policy "profiles can view gym peers"
on public.profiles
for select
using (
  id = public.current_profile_id()
  or exists (
    select 1
    from public.gym_members gm_self
    join public.gym_members gm_other on gm_other.gym_id = gm_self.gym_id
    where gm_self.profile_id = public.current_profile_id()
      and gm_other.profile_id = profiles.id
  )
);

create policy "profiles can update self"
on public.profiles
for update
using (id = public.current_profile_id())
with check (id = public.current_profile_id());

create policy "profiles can insert self"
on public.profiles
for insert
with check (id = public.current_profile_id());

create policy "members can view gyms they belong to"
on public.gyms
for select
using (
  exists (
    select 1
    from public.gym_members gm
    where gm.gym_id = gyms.id
      and gm.profile_id = public.current_profile_id()
  )
);

create policy "members can view their gym memberships"
on public.gym_members
for select
using (
  profile_id = public.current_profile_id()
  or exists (
    select 1
    from public.gym_members gm
    where gm.gym_id = gym_members.gym_id
      and gm.profile_id = public.current_profile_id()
  )
);

create policy "catalog is readable by authenticated users"
on public.sync_pairs
for select
using (public.current_profile_id() is not null);

create policy "members can view submissions in their gym"
on public.roster_submissions
for select
using (
  exists (
    select 1
    from public.gym_members gm
    where gm.gym_id = roster_submissions.gym_id
      and gm.profile_id = public.current_profile_id()
  )
);

create policy "members can create their own submissions"
on public.roster_submissions
for insert
with check (
  profile_id = public.current_profile_id()
  and exists (
    select 1
    from public.gym_members gm
    where gm.gym_id = roster_submissions.gym_id
      and gm.profile_id = public.current_profile_id()
  )
);

create policy "members can view roster entries for visible submissions"
on public.roster_entries
for select
using (
  exists (
    select 1
    from public.roster_submissions rs
    join public.gym_members gm on gm.gym_id = rs.gym_id
    where rs.id = roster_entries.submission_id
      and gm.profile_id = public.current_profile_id()
  )
);

create policy "members can insert roster entries for their own submissions"
on public.roster_entries
for insert
with check (
  exists (
    select 1
    from public.roster_submissions rs
    where rs.id = roster_entries.submission_id
      and rs.profile_id = public.current_profile_id()
  )
);

create index gym_members_profile_idx on public.gym_members (profile_id);
create index roster_submissions_gym_idx on public.roster_submissions (gym_id, submitted_at desc);
create index roster_submissions_profile_idx on public.roster_submissions (profile_id, submitted_at desc);
create index roster_entries_pair_idx on public.roster_entries (pair_id);

