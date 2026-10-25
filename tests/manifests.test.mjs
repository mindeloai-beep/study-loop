import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const files = [
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  '.agents/plugins/marketplace.json',
];

test('manifests parse and name the plugin study-loop', () => {
  for (const f of files) assert.strictEqual(readJson(f).name, 'study-loop', f);
});

test('codex manifest points at the skills folder', () => {
  assert.strictEqual(readJson('.codex-plugin/plugin.json').skills, './skills/');
});

test('marketplaces list the plugin from the repo root', () => {
  assert.strictEqual(readJson('.claude-plugin/marketplace.json').plugins[0].source, './');
  assert.deepStrictEqual(readJson('.agents/plugins/marketplace.json').plugins[0].source, {
    source: 'local',
    path: './',
  });
});

test('every skill has a matching name and a description', () => {
  const dir = path.join(root, 'skills');
  const folders = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory());
  assert.ok(folders.length > 0);
  for (const d of folders) {
    const text = fs.readFileSync(path.join(dir, d.name, 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n');
    const m = text.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(m, `${d.name} has frontmatter`);
    const field = (k) => (m[1].match(new RegExp(`^${k}:[ \t]*(.*)$`, 'm')) || [])[1];
    assert.strictEqual(field('name'), d.name);
    assert.notStrictEqual(field('description'), undefined, `${d.name} has no description`);
    assert.ok(field('description').trim().length > 0, `${d.name} description is empty`);
  }
});

test('licence is MIT', () => {
  const first = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8').split(/\r?\n/)[0];
  assert.strictEqual(first, 'MIT License');
});
