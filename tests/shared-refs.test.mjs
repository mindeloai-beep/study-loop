import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('reference copies are identical', () => {
  for (const name of ['notes-format.md', 'session-rules.md', 'practice-db.md', 'supabase-stub.sql']) {
    const a = fs.readFileSync(path.join(root, 'skills', 'learn', 'references', name));
    const b = fs.readFileSync(path.join(root, 'skills', 'practice', 'references', name));
    assert.ok(a.equals(b), `${name} differs between the two skills`);
  }
});
