// Scans every tracked file for personal data and secrets. Node built-ins only.
// The scan uses `git ls-files`, so it covers tracked files only. Stage a new file
// (`git add`) before it is scanned.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'tests/privacy.test.mjs';
const BLOCKLIST = join(homedir(), '.study-loop-dev', 'blocklist.txt');

export const RULES = [
  ['Windows home path', /\b[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s"'`]+/i],
  // The lookbehind skips a drive-letter /Users path, which the Windows rule already reports.
  // /home stays strict: the Windows rule never matches it.
  ['macOS or Linux home path', /(?:(?<!\b[A-Za-z]:[\\/]*)\/Users|\/home)\/[^/\s]+\//],
  ['key-shaped string', /(?:sk-ant-|sk-proj-|sb_secret_|sb_publishable_|eyJhbGciOi|ghp_|github_pat_)[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}|sk_live_[A-Za-z0-9_-]{20,}|-----BEGIN(?: [A-Z]+)* PRIVATE KEY-----/],
];
const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g;

// Builds one regex that matches any line of a blocklist as a whole word or phrase.
export function blocklistRegex(lines) {
  const parts = lines
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
  if (parts.length === 0) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${parts.join('|')})(?![\\p{L}\\p{N}_])`, 'iu');
}

function trackedFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: REPO, encoding: 'utf8' });
  return out.split('\0').filter((f) => f && f !== SELF);
}

test('tracked files contain no personal data or secrets', (t) => {
  const blocklist = existsSync(BLOCKLIST)
    ? blocklistRegex(readFileSync(BLOCKLIST, 'utf8').split(/\r?\n/))
    : null;
  if (!blocklist) t.diagnostic('blocklist check skipped: no entries in ~/.study-loop-dev/blocklist.txt');
  const problems = [];
  for (const file of trackedFiles()) {
    const path = join(REPO, file);
    if (!existsSync(path) || !statSync(path).isFile()) continue; // deleted, or a submodule or directory
    const text = readFileSync(path, 'utf8');
    text.split(/\r?\n/).forEach((line, i) => {
      const where = `${file}:${i + 1}`;
      for (const [name, re] of RULES) if (re.test(line)) problems.push(`${where}: ${name}`);
      for (const m of line.matchAll(EMAIL)) {
        if (m[1].toLowerCase() !== 'example.com') problems.push(`${where}: email address`);
      }
      if (blocklist && blocklist.test(line)) problems.push(`${where}: blocklist match`);
    });
  }
  assert.deepEqual(problems, []);
});

test('blocklist lines match whole words only', () => {
  const re = blocklistRegex(['# comment', '', 'Acme', 'Blue Fin', "O'Neil Co."]);
  for (const s of ['Acme Corp', 'ACME', 'the blue fin team', "ask O'Neil Co. today"]) {
    assert.ok(re.test(s), `should match: ${s}`);
  }
  for (const s of ['acmeco-beep', 'bluefins', 'Acme_two', 'comment', "O'Neil Cox", "O'Neil Co!"]) {
    assert.ok(!re.test(s), `should not match: ${s}`);
  }
  assert.equal(blocklistRegex(['# only a comment', '  ']), null);
});

const hits = (s) => RULES.filter(([, re]) => re.test(s)).map(([name]) => name);

test('a drive-letter home path reports once', () => {
  assert.deepEqual(hits('C:/Users/x/a'), ['Windows home path']);
  assert.deepEqual(hits('C:\\Users\\x\\a'), ['Windows home path']);
  assert.deepEqual(hits('/home/x/a'), ['macOS or Linux home path']);
  assert.deepEqual(hits('/Users/x/a'), ['macOS or Linux home path']);
  assert.deepEqual(hits('scp box:/Users/alice/x'), ['macOS or Linux home path']);
  assert.deepEqual(hits('see /Users/alice/x'), ['macOS or Linux home path']);
  assert.deepEqual(hits('scp box:/home/alice/x'),['macOS or Linux home path']);
  assert.deepEqual(hits('see /home/alice/x'), ['macOS or Linux home path']);
});

test('key-shaped rule catches AWS, Stripe and PEM shapes', () => {
  // Samples are built at runtime so this file never holds a matching literal.
  const caught = [
    'AK' + 'IA' + 'A'.repeat(16),
    'sk_' + 'live_' + 'a'.repeat(20),
    '-----' + 'BEGIN ' + 'RSA ' + 'PRIVATE KEY-----',
    '-----' + 'BEGIN ' + 'PRIVATE KEY-----',
  ];
  for (const s of caught) assert.deepEqual(hits(s), ['key-shaped string'], s);
  for (const s of ['AK' + 'IA' + 'A'.repeat(15), 'sk_' + 'live_' + 'a'.repeat(5), '-----' + 'BEGIN PUBLIC KEY-----']) {
    assert.deepEqual(hits(s), [], s);
  }
});
