create table public.member_rosters (
  id uuid primary key default gen_random_uuid(),
  member_slug text not null unique,
  display_name text not null,
  raw_payload jsonb not null,
  imported_pairs jsonb not null default '[]'::jsonb,
  unmatched_keys jsonb not null default '[]'::jsonb,
  premium_counts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_member_rosters_updated_at
before update on public.member_rosters
for each row
execute function public.set_updated_at();

alter table public.member_rosters enable row level security;

create policy "public can read member rosters"
on public.member_rosters
for select
to anon, authenticated
using (true);

create policy "public can insert member rosters"
on public.member_rosters
for insert
to anon, authenticated
with check (true);

create policy "public can update member rosters"
on public.member_rosters
for update
to anon, authenticated
using (true)
with check (true);

create policy "public can delete member rosters"
on public.member_rosters
for delete
to anon, authenticated
using (true);

create index member_rosters_display_name_idx on public.member_rosters (display_name);
