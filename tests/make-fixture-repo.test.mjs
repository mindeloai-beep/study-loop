import { test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeFixtureRepo } from './make-fixture-repo.mjs';

test('creates four commits and the live hole', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-loop-repo-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  makeFixtureRepo(dir);
  const git = (...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  assert.strictEqual(git('log', '--oneline').trim().split('\n').length, 4);
  assert.strictEqual(git('status', '--porcelain'), '');
  const profiles = fs.readFileSync(path.join(dir, 'supabase', 'migrations', '20260104000000_profiles.sql'), 'utf8');
  assert.doesNotMatch(profiles, /enable row level security/i);
});
