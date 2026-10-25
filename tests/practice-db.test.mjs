import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'study-loop-practice';
const IMAGE = 'postgres:17.11-alpine';
const USER_A = '00000000-0000-0000-0000-00000000000a';
const skip = spawnSync('docker', ['info'], { stdio: 'ignore' }).status !== 0
  ? 'docker is not available'
  : false;

const docker = (args, input) =>
  spawnSync('docker', args, { input, encoding: 'utf8' });
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const psql = (sql, extra = []) =>
  docker(['exec', '-i', NAME, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1',
    '-v', 'VERBOSITY=verbose', ...extra], sql);
const out = (r) => `${r.stdout}${r.stderr}`;

function start() {
  docker(['rm', '-f', NAME]);
  const run = docker(['run', '-d', '--rm', '--name', NAME, '-e', 'POSTGRES_PASSWORD=practice', IMAGE]);
  assert.strictEqual(run.status, 0, out(run));
  for (let i = 0; i < 30; i++) {
    if (docker(['exec', NAME, 'pg_isready', '-U', 'postgres']).status === 0) return;
    sleep(1000);
  }
  assert.fail('pg_isready never succeeded');
}
const stop = () => docker(['stop', NAME]);
const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
const loadStub = () => {
  const r = psql(read('skills', 'practice', 'references', 'supabase-stub.sql'));
  assert.strictEqual(r.status, 0, out(r));
};
const asUser = (query) => psql(
  `begin; set local role authenticated; select set_config('request.jwt.claims', '{"sub":"${USER_A}","role":"authenticated"}', true); ${query}; rollback;`);

test('start replaces a stale container', { skip }, () => {
  docker(['rm', '-f', NAME]);
  const stale = docker(['run', '-d', '--name', NAME, IMAGE, 'sleep', '600']);
  assert.strictEqual(stale.status, 0, out(stale));
  start();
  assert.strictEqual(docker(['exec', NAME, 'pg_isready', '-U', 'postgres']).status, 0);
  stop();
});

test('missing column grant raises 42501', { skip }, () => {
  start();
  loadStub();
  const f = psql(read('tests', 'fixtures', 'db', 'missing-column-grant.sql'));
  assert.strictEqual(f.status, 0, out(f));
  const r = asUser("insert into public.employers (name, city, logo_url) values ('a', 'b', 'c')");
  assert.match(out(r), /42501/);
  stop();
});

test("rls leak returns another user's rows", { skip }, () => {
  start();
  loadStub();
  const f = psql(read('tests', 'fixtures', 'db', 'rls-leak.sql'));
  assert.strictEqual(f.status, 0, out(f));
  const r = asUser('select count(*) from public.notes');
  assert.strictEqual(r.status, 0, out(r));
  assert.match(r.stdout, /^\s*2\s*$/m);
  stop();
});

test('stop removes the container', { skip }, () => {
  start();
  stop();
  let listed = '';
  for (let i = 0; i < 10; i++) {
    listed = docker(['ps', '-a', '-q', '--filter', `name=^${NAME}$`]).stdout.trim();
    if (!listed) break;
    sleep(500);
  }
  assert.strictEqual(listed, '');
});
