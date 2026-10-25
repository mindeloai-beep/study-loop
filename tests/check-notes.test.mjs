import { test } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
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
const AUTH = 'What does auth.uid() return-.md';

// Copies the valid fixture to a temp folder, applies one change, returns the problems.
function mutate(change) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'study-loop-notes-'));
  try {
    fs.cpSync(valid, root, { recursive: true });
    change(root);
    return checkNotes(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
const edit = (file, fn) => fs.writeFileSync(file, fn(fs.readFileSync(file, 'utf8')));
const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};
// Asserts exactly one problem, that it names the file, and that it matches the pattern.
function one(problems, file, pattern) {
  assert.strictEqual(problems.length, 1, problems.join('\n'));
  assert.ok(problems[0].includes(file), problems[0]);
  assert.match(problems[0], pattern);
}

test('valid folder has no problems', () => {
  assert.deepStrictEqual(checkNotes(valid), []);
});

test('rule 1 wrong topic', () => {
  one(mutate((r) => edit(path.join(ideas(r), TAUGHT), (t) => t.replace('topic: postgres-grants', 'topic: other'))), TAUGHT, /topic/);
});

test('rule 2 known and scheduled', () => {
  one(mutate((r) => edit(path.join(ideas(r), KNOWN), (t) => t.replace('known: true', 'known: true\nnext_practice: 2026-10-26'))), KNOWN, /known/);
});

test('rule 2 bad date', () => {
  one(mutate((r) => edit(path.join(ideas(r), TAUGHT), (t) => t.replace('2026-10-26', '2026-13-40'))), TAUGHT, /next_practice/);
});

test('rule 3 broken link', () => {
  one(mutate((r) => fs.appendFileSync(path.join(ideas(r), TAUGHT), '\n[[Nothing here]]\n')), TAUGHT, /Nothing here/);
});

test('rule 3 ignores links inside code', () => {
  const out = mutate((r) => fs.appendFileSync(path.join(ideas(r), TAUGHT), '\nUse `[[1,2]]` here.\n```\n[[wiki]]\n```\n'));
  assert.deepStrictEqual(out, []);
});

test('rule 4 duplicate title', () => {
  const out = mutate((r) => {
    const copy = path.join(r, 'other-topic', 'ideas', KNOWN);
    write(copy, fs.readFileSync(path.join(ideas(r), KNOWN), 'utf8').replace('topic: postgres-grants', 'topic: other-topic'));
  });
  one(out, KNOWN, /duplicate/);
});

test('rule 5 illegal character', () => {
  // Windows cannot create a file name with "?", so the test uses "#", which is also illegal.
  const name = 'Another claim #1.md';
  one(mutate((r) => fs.copyFileSync(path.join(ideas(r), KNOWN), path.join(ideas(r), name))), name, /illegal/);
});

test('rule 5 caps the name at 100 characters before the extension', () => {
  const diagrams = (r) => path.join(r, 'postgres-grants', 'diagrams');
  assert.deepStrictEqual(mutate((r) => write(path.join(diagrams(r), `${'a'.repeat(100)}.svg`), '<svg/>')), []);
  one(mutate((r) => write(path.join(diagrams(r), `${'a'.repeat(101)}.svg`), '<svg/>')), 'aaaa', /illegal/);
});

test('rule 6 session link outside sessions', () => {
  const out = mutate((r) => edit(path.join(ideas(r), TAUGHT), (t) => t.replace('[[2026-10-25 postgres-grants]]', '[[Privilege checks run before row-level security]]')));
  one(out, TAUGHT, /sessions/);
});

test('rule 6 block-list sessions form', () => {
  const block = (link) => (t) => t.replace(/sessions: .*/, `sessions:\n  - "[[${link}]]"`);
  assert.deepStrictEqual(mutate((r) => edit(path.join(ideas(r), TAUGHT), block('2026-10-25 postgres-grants'))), []);
  one(mutate((r) => edit(path.join(ideas(r), TAUGHT), block('Privilege checks run before row-level security'))), TAUGHT, /sessions/);
  one(mutate((r) => edit(path.join(ideas(r), TAUGHT), block('Missing session'))), TAUGHT, /Missing session/);
});

test('frontmatter accepts quoted values and a BOM', () => {
  const out = mutate((r) => {
    edit(path.join(ideas(r), TAUGHT), (t) => `﻿${t.replace('topic: postgres-grants', 'topic: "postgres-grants"').replace('type: idea', "type: 'idea'")}`);
    edit(path.join(ideas(r), KNOWN), (t) => t.replace('known: true', 'known: "true"'));
  });
  assert.deepStrictEqual(out, []);
});

test('rule 7 missing next to learn', () => {
  one(mutate((r) => fs.rmSync(path.join(r, 'Next to learn.md'))), 'Next to learn', /Next to learn/);
});

test('rule 8 empty claim', () => {
  one(mutate((r) => edit(path.join(ideas(r), KNOWN), (t) => t.replace(/\n---\n[\s\S]*$/, '\n---\n'))), KNOWN, /claim/);
});

test('format: type must be idea', () => {
  one(mutate((r) => edit(path.join(ideas(r), TAUGHT), (t) => t.replace('type: idea', 'type: note'))), TAUGHT, /type/);
});

test('format: sessions key is required', () => {
  one(mutate((r) => edit(path.join(ideas(r), KNOWN), (t) => t.replace(/sessions: .*\n/, ''))), KNOWN, /sessions/);
});

test('format: idea note needs frontmatter', () => {
  one(mutate((r) => write(path.join(ideas(r), KNOWN), 'A claim with no frontmatter.\n')), KNOWN, /no frontmatter/);
});

test('format: topic folder is lowercase with hyphens', () => {
  const out = mutate((r) => {
    for (const n of [TAUGHT, KNOWN, AUTH]) edit(path.join(ideas(r), n), (t) => t.replace('topic: postgres-grants', 'topic: Postgres-Grants'));
    fs.renameSync(path.join(r, 'postgres-grants'), path.join(r, 'Postgres-Grants'));
  });
  one(out, 'Postgres-Grants', /lowercase/);
});

test('format: idea note outside ideas is misplaced', () => {
  const name = 'Stray idea.md';
  one(mutate((r) => fs.copyFileSync(path.join(ideas(r), KNOWN), path.join(r, 'postgres-grants', 'sessions', name))), name, /misplaced/);
});

test('scope: unrelated vault content is not checked', () => {
  const out = mutate((r) => {
    write(path.join(r, 'Unrelated.md'), 'See [[Dangling]].\n');
    write(path.join(r, '.obsidian', 'odd  name #1.json'), '{}');
    write(path.join(r, 'Journal', 'Bad  Name #1.md'), '---\ntype: idea\n---\nSee [[Dangling]].\n');
  });
  assert.deepStrictEqual(out, []);
});

test('scope: study-loop notes may link to vault notes but not into dot-directories', () => {
  const link = (r) => fs.appendFileSync(path.join(ideas(r), TAUGHT), '\n[[Vault note]]\n');
  assert.deepStrictEqual(mutate((r) => { write(path.join(r, 'Journal', 'Vault note.md'), 'x'); link(r); }), []);
  one(mutate((r) => { write(path.join(r, '.obsidian', 'Vault note.md'), 'x'); link(r); }), TAUGHT, /Vault note/);
});

test('command form: missing folder and missing argument', () => {
  const run = (...args) => spawnSync(process.execPath, [path.join(here, 'check-notes.mjs'), ...args], { encoding: 'utf8' });
  const missing = run(path.join(os.tmpdir(), 'study-loop-no-such-folder'));
  assert.strictEqual(missing.status, 1);
  assert.match(missing.stdout, /^notes folder not found: /);
  const none = run();
  assert.strictEqual(none.status, 2);
  assert.match(none.stderr, /usage/);
  assert.strictEqual(run(valid).status, 0);
});
