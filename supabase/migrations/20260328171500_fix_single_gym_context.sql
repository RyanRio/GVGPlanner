create or replace function public.current_gym_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select g.id
  from public.gyms g
  order by g.created_at
  limit 1
$$;
