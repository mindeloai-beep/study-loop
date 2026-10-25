create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,
  body text
);
alter table public.notes enable row level security;
create policy notes_read on public.notes for select to authenticated using (true);
insert into public.notes (owner, body) values
  ('00000000-0000-0000-0000-00000000000a', 'mine'),
  ('00000000-0000-0000-0000-00000000000b', 'theirs');
