// Creates a practice repository with one past mistake, its fix, and one live hole.
// Usage: import { makeFixtureRepo } from './make-fixture-repo.mjs'; makeFixtureRepo(dir);
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// [file, commit subject, SQL], one commit each, in order.
const MIGRATIONS = [
  ['20260101000000_notes.sql', 'Add notes table', `create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,
  body text
);

alter table public.notes enable row level security;
`],
  // The past mistake: every signed-in user can read every note.
  ['20260102000000_notes_policy.sql', 'Add notes read policy', `create policy notes_read on public.notes
  for select to authenticated
  using (true);
`],
  ['20260103000000_fix_notes_policy.sql', 'Fix notes read policy to check the owner', `drop policy notes_read on public.notes;

create policy notes_read on public.notes
  for select to authenticated
  using (owner = auth.uid());
`],
  // The live hole: row-level security is never enabled.
  ['20260104000000_profiles.sql', 'Add profiles table', `create table public.profiles (
  id uuid primary key,
  display_name text
);
`],
];

export function makeFixtureRepo(dir) {
  const git = (args, env = {}) =>
    execFileSync('git', ['-C', dir, ...args], { stdio: 'pipe', env: { ...process.env, ...env } });
  const migrations = path.join(dir, 'supabase', 'migrations');
  fs.mkdirSync(migrations, { recursive: true });
  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.name', 'fixture']);
  git(['config', 'user.email', 'fixture@example.com']);
  git(['config', 'commit.gpgsign', 'false']);
  MIGRATIONS.forEach(([file, subject, sql], i) => {
    fs.writeFileSync(path.join(migrations, file), sql);
    git(['add', '--', `supabase/migrations/${file}`]);
    // Commit dates follow the migration dates, so the history reads in order.
    const date = `2026-01-0${i + 1}T12:00:00Z`;
    git(['commit', '-q', '-m', subject], { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });
  });
}
