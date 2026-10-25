create table public.employers (
  id uuid primary key default gen_random_uuid(),
  name text,
  city text,
  logo_url text
);
revoke insert on public.employers from authenticated;
grant insert (name, city) on public.employers to authenticated;
