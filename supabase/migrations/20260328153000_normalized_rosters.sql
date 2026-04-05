create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'app_role'
  ) then
    create type public.app_role as enum ('admin', 'member');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'pair_premium_category'
  ) then
    create type public.pair_premium_category as enum (
      'general',
      'poke_fair',
      'master_fair',
      'arc_fair',
      'seasonal',
      'variety',
      'special_costume'
    );
  end if;
end
$$;

drop table if exists public.member_rosters cascade;
drop table if exists public.roster_entries cascade;
drop table if exists public.roster_submissions cascade;
drop table if exists public.member_current_roster cascade;
drop table if exists public.roster_imports cascade;
drop table if exists public.gym_roster_members cascade;
drop table if exists public.sync_pairs cascade;

alter table public.profiles
  add column if not exists app_role public.app_role not null default 'member',
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table public.sync_pairs (
  id text primary key,
  display_label text not null,
  trainer_name text not null,
  trainer_alt text,
  pokemon_name text not null,
  pokemon_form text,
  role_category public.pair_role not null,
  role_label text not null,
  ex_role_category public.pair_role,
  ex_role_label text,
  star_rarity smallint,
  premium_category public.pair_premium_category not null default 'general',
  acquisition text not null,
  type text not null,
  weakness text,
  region text not null,
  release_date date,
  primary_image_path text,
  image_paths jsonb not null default '[]'::jsonb,
  themes jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gym_roster_members (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  member_slug text not null,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, member_slug)
);

create table public.roster_imports (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  member_id uuid not null references public.gym_roster_members (id) on delete cascade,
  imported_by uuid not null references public.profiles (id) on delete restrict,
  source text not null default 'sync_pairs_tracker',
  raw_payload jsonb not null,
  unmatched_keys jsonb not null default '[]'::jsonb,
  matched_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.member_current_roster (
  member_id uuid not null references public.gym_roster_members (id) on delete cascade,
  pair_id text not null references public.sync_pairs (id) on delete restrict,
  sync_level integer not null,
  is_ex boolean not null default false,
  last_import_id uuid not null references public.roster_imports (id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (member_id, pair_id),
  check (sync_level between 1 and 5)
);

drop trigger if exists set_sync_pairs_updated_at on public.sync_pairs;
create trigger set_sync_pairs_updated_at
before update on public.sync_pairs
for each row
execute function public.set_updated_at();

drop trigger if exists set_gym_roster_members_updated_at on public.gym_roster_members;
create trigger set_gym_roster_members_updated_at
before update on public.gym_roster_members
for each row
execute function public.set_updated_at();

drop trigger if exists set_member_current_roster_updated_at on public.member_current_roster;
create trigger set_member_current_roster_updated_at
before update on public.member_current_roster
for each row
execute function public.set_updated_at();

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
as $$
  select p.app_role
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.current_gym_id()
returns uuid
language sql
stable
as $$
  select gm.gym_id
  from public.gym_members gm
  where gm.profile_id = auth.uid()
  order by gm.joined_at
  limit 1
$$;

create or replace function public.import_member_roster(
  p_member_slug text,
  p_display_name text,
  p_raw_payload jsonb,
  p_imported_pairs jsonb,
  p_unmatched_keys jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_gym_id uuid;
  v_member_id uuid;
  v_import_id uuid;
begin
  v_profile_id := auth.uid();
  if v_profile_id is null then
    raise exception 'Authentication required';
  end if;

  v_gym_id := public.current_gym_id();
  if v_gym_id is null then
    raise exception 'Current user is not assigned to a gym';
  end if;

  if coalesce(trim(p_member_slug), '') = '' then
    raise exception 'Member slug is required';
  end if;

  if coalesce(trim(p_display_name), '') = '' then
    raise exception 'Display name is required';
  end if;

  insert into public.gym_roster_members (gym_id, member_slug, display_name)
  values (v_gym_id, p_member_slug, p_display_name)
  on conflict (gym_id, member_slug) do update
    set display_name = excluded.display_name,
        is_active = true
  returning id into v_member_id;

  insert into public.roster_imports (
    gym_id,
    member_id,
    imported_by,
    raw_payload,
    unmatched_keys,
    matched_count
  )
  values (
    v_gym_id,
    v_member_id,
    v_profile_id,
    p_raw_payload,
    coalesce(p_unmatched_keys, '[]'::jsonb),
    coalesce(jsonb_array_length(p_imported_pairs), 0)
  )
  returning id into v_import_id;

  delete from public.member_current_roster
  where member_id = v_member_id;

  insert into public.member_current_roster (
    member_id,
    pair_id,
    sync_level,
    is_ex,
    last_import_id,
    metadata
  )
  select
    v_member_id,
    pairs.pair_id,
    greatest(1, least(5, coalesce(pairs.sync_level, 1))),
    coalesce(pairs.is_ex, false),
    v_import_id,
    case
      when pairs.raw_value is null then '{}'::jsonb
      else jsonb_build_object('raw_value', pairs.raw_value)
    end
  from jsonb_to_recordset(coalesce(p_imported_pairs, '[]'::jsonb)) as pairs(
    pair_id text,
    sync_level integer,
    is_ex boolean,
    raw_value text
  )
  join public.sync_pairs sp on sp.id = pairs.pair_id;

  return v_import_id;
end;
$$;

create or replace function public.delete_roster_member(
  p_member_slug text
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

  delete from public.gym_roster_members
  where gym_id = v_gym_id
    and member_slug = p_member_slug;
end;
$$;

drop policy if exists "profiles can view gym peers" on public.profiles;
drop policy if exists "profiles can update self" on public.profiles;
drop policy if exists "profiles can insert self" on public.profiles;
drop policy if exists "members can view gyms they belong to" on public.gyms;
drop policy if exists "members can view their gym memberships" on public.gym_members;
drop policy if exists "catalog is readable by authenticated users" on public.sync_pairs;

alter table public.profiles enable row level security;
alter table public.gyms enable row level security;
alter table public.gym_members enable row level security;
alter table public.sync_pairs enable row level security;
alter table public.gym_roster_members enable row level security;
alter table public.roster_imports enable row level security;
alter table public.member_current_roster enable row level security;

create policy "profiles can read self or admin can read all"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.current_profile_role() = 'admin'
);

create policy "profiles can update self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "members can view current gym"
on public.gyms
for select
to authenticated
using (id = public.current_gym_id());

create policy "members can view gym memberships"
on public.gym_members
for select
to authenticated
using (gym_id = public.current_gym_id());

create policy "authenticated can read sync pair catalog"
on public.sync_pairs
for select
to authenticated
using (true);

create policy "admin can manage sync pair catalog"
on public.sync_pairs
for all
to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

create policy "members can view roster members"
on public.gym_roster_members
for select
to authenticated
using (gym_id = public.current_gym_id());

create policy "members can view roster imports"
on public.roster_imports
for select
to authenticated
using (gym_id = public.current_gym_id());

create policy "members can view current roster"
on public.member_current_roster
for select
to authenticated
using (
  exists (
    select 1
    from public.gym_roster_members grm
    where grm.id = member_current_roster.member_id
      and grm.gym_id = public.current_gym_id()
  )
);

revoke all on function public.import_member_roster(text, text, jsonb, jsonb, jsonb) from public;
revoke all on function public.delete_roster_member(text) from public;
grant execute on function public.import_member_roster(text, text, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.delete_roster_member(text) to authenticated;

grant select on public.sync_pairs to authenticated;
grant select on public.gym_roster_members to authenticated;
grant select on public.roster_imports to authenticated;
grant select on public.member_current_roster to authenticated;
grant select on public.gyms to authenticated;
grant select on public.gym_members to authenticated;
grant select, update on public.profiles to authenticated;

create index sync_pairs_display_label_idx on public.sync_pairs (display_label);
create index sync_pairs_premium_category_idx on public.sync_pairs (premium_category);
create index gym_roster_members_gym_display_idx on public.gym_roster_members (gym_id, display_name);
create index roster_imports_member_created_idx on public.roster_imports (member_id, created_at desc);
create index member_current_roster_pair_idx on public.member_current_roster (pair_id);
