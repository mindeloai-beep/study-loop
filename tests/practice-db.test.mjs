import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'study-loop-practice';
const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
// One source of truth: the image tag lives in practice-db.md.
const IMAGE = (read('skills', 'practice', 'references', 'practice-db.md')
  .match(/^postgres:17\.\d+-alpine$/m) || [])[0];
if (!IMAGE) throw new Error('image tag not found in practice-db.md');
// The Bash readiness check: one docker command whose loop runs inside the container.
// Take the whole command line under the Start heading, then drop the outer quotes,
// so a quote inside the command does not break the extraction.
const START_SECTION = (read('skills', 'practice', 'references', 'practice-db.md')
  .split(/^## Start$/m)[1] || '').split(/^## /m)[0];
const READY_ARG = (START_SECTION
  .match(/^docker exec study-loop-practice sh -c (.+)$/m) || [])[1];
const READY_LOOP = READY_ARG && READY_ARG.length > 2 && READY_ARG.startsWith("'") && READY_ARG.endsWith("'")
  ? READY_ARG.slice(1, -1)
  : null;
if (!READY_LOOP) throw new Error('readiness check not found in the Start section of practice-db.md');
const USER_A = '00000000-0000-0000-0000-00000000000a';
const skip = spawnSync('docker', ['info'], { stdio: 'ignore' }).status !== 0
  ? 'docker is not available'
  : false;

const docker = (args, input) =>
  spawnSync('docker', args, { input, encoding: 'utf8' });
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const psql = (sql) =>
  docker(['exec', '-i', NAME, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1',
    '-v', 'VERBOSITY=verbose'], sql);
const out = (r) => `${r.stdout}${r.stderr}`;
const listed = () =>
  docker(['ps', '-a', '-q', '--filter', `name=^${NAME}$`]).stdout.trim();
// --rm removal is asynchronous: wait (a few seconds at most) until the name is free.
const waitGone = () => {
  for (let i = 0; i < 20 && listed(); i++) sleep(500);
  return listed();
};
const ready = () =>
  docker(['exec', NAME, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']).status === 0;

function start() {
  docker(['rm', '-f', NAME]);
  waitGone();
  const run = docker(['run', '-d', '--rm', '--name', NAME, '-e', 'POSTGRES_PASSWORD=practice', IMAGE]);
  assert.strictEqual(run.status, 0, out(run));
  const wait = docker(['exec', NAME, 'sh', '-c', READY_LOOP]);
  assert.strictEqual(wait.status, 0, `pg_isready never succeeded: ${out(wait)}`);
}
function stop() {
  docker(['stop', NAME]);
  return waitGone();
}
const loadStub = () => {
  const r = psql(read('skills', 'practice', 'references', 'supabase-stub.sql'));
  assert.strictEqual(r.status, 0, out(r));
};
const asUser = (query) => psql(
  `begin; set local role authenticated; select set_config('request.jwt.claims', '{"sub":"${USER_A}","role":"authenticated"}', true); ${query}; rollback;`);

test('start replaces a stale container', { skip }, (t) => {
  t.after(stop);
  docker(['rm', '-f', NAME]);
  waitGone();
  const stale = docker(['run', '-d', '--name', NAME, IMAGE, 'sleep', '600']);
  assert.strictEqual(stale.status, 0, out(stale));
  start();
  assert.ok(ready());
  const cmd = docker(['inspect', '-f', '{{json .Config.Cmd}}', NAME]);
  assert.strictEqual(cmd.status, 0, out(cmd));
  assert.doesNotMatch(cmd.stdout, /sleep/);
});

test('missing column grant raises 42501', { skip }, (t) => {
  t.after(stop);
  start();
  loadStub();
  const f = psql(read('tests', 'fixtures', 'db', 'missing-column-grant.sql'));
  assert.strictEqual(f.status, 0, out(f));
  // Positive control: granted columns insert, so the failure is column-specific.
  const ok = asUser("insert into public.employers (name, city) values ('a', 'b')");
  assert.strictEqual(ok.status, 0, out(ok));
  const r = asUser("insert into public.employers (name, city, logo_url) values ('a', 'b', 'c')");
  assert.match(out(r), /42501/);
});

test("rls leak returns another user's rows", { skip }, (t) => {
  t.after(stop);
  start();
  loadStub();
  const f = psql(read('tests', 'fixtures', 'db', 'rls-leak.sql'));
  assert.strictEqual(f.status, 0, out(f));
  const r = asUser('select count(*) from public.notes');
  assert.strictEqual(r.status, 0, out(r));
  assert.match(r.stdout, /^\s*2\s*$/m);
});

test('stop removes the container', { skip }, (t) => {
  t.after(stop);
  start();
  assert.strictEqual(stop(), '');
});
