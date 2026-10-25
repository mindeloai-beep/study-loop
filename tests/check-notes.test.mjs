import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkNotes } from './check-notes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const valid = path.join(here, 'fixtures', 'notes', "My Vault (Test's)", 'Learning');
const ideas = (root) => path.join(root, 'postgres-grants', 'ideas');
const TAUGHT = 'Column privileges are checked per named column.md';
const KNOWN = 'Privilege checks run before row-level security.md';

// Copies the valid fixture to a temp folder, applies one change, returns the problems.
function mutate(change) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'study-loop-notes-'));
  try {
    fs.cpSync(valid, root, { recursive: true });
    change(root);
    return checkNotes(root).join('\n');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
const edit = (file, fn) => fs.writeFileSync(file, fn(fs.readFileSync(file, 'utf8')));

test('valid folder has no problems', () => {
  assert.deepStrictEqual(checkNotes(valid), []);
});

test('rule 1 wrong topic', () => {
  const out = mutate((r) => edit(path.join(ideas(r), TAUGHT), (t) => t.replace('topic: postgres-grants', 'topic: other')));
  assert.match(out, /topic/);
});

test('rule 2 known and scheduled', () => {
  const out = mutate((r) => edit(path.join(ideas(r), KNOWN), (t) => t.replace('known: true', 'known: true\nnext_practice: 2026-10-26')));
  assert.match(out, /known/);
});

test('rule 2 bad date', () => {
  const out = mutate((r) => edit(path.join(ideas(r), TAUGHT), (t) => t.replace('2026-10-26', '2026-13-40')));
  assert.match(out, /next_practice/);
});

test('rule 3 broken link', () => {
  const out = mutate((r) => fs.appendFileSync(path.join(ideas(r), TAUGHT), '\n[[Nothing here]]\n'));
  assert.match(out, /Nothing here/);
});

test('rule 4 duplicate title', () => {
  const out = mutate((r) => {
    fs.mkdirSync(path.join(r, 'other-topic', 'ideas'), { recursive: true });
    fs.copyFileSync(path.join(ideas(r), KNOWN), path.join(r, 'other-topic', 'ideas', KNOWN));
  });
  assert.match(out, /duplicate/);
});

test('rule 5 illegal character', () => {
  // Windows cannot create a file name with "?", so the test uses "#", which is also illegal.
  const out = mutate((r) => fs.renameSync(path.join(ideas(r), KNOWN), path.join(ideas(r), 'Privilege checks run before row-level security #1.md')));
  assert.match(out, /illegal/);
});

test('rule 6 session link outside sessions', () => {
  const out = mutate((r) => edit(path.join(ideas(r), TAUGHT), (t) => t.replace('[[2026-10-25 postgres-grants]]', '[[Privilege checks run before row-level security]]')));
  assert.match(out, /sessions/);
});

test('rule 7 missing next to learn', () => {
  const out = mutate((r) => fs.rmSync(path.join(r, 'Next to learn.md')));
  assert.match(out, /Next to learn/);
});

test('rule 8 empty claim', () => {
  const out = mutate((r) => edit(path.join(ideas(r), KNOWN), (t) => t.replace(/\n---\n[\s\S]*$/, '\n---\n')));
  assert.match(out, /claim/);
});
