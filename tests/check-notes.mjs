// Checks a study-loop notes folder against the notes-format contract.
// Usage: node tests/check-notes.mjs "NOTES_DIR"
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ILLEGAL = /[\\/:*?"<>|#^[\]]/;
const HEADER = '| Question | Serves | Times raised | Added | Verdict |';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

// Flat "key: value" frontmatter only. Returns { fm, body }.
function parse(text) {
  const m = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: {}, body: text };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fm, body: m[2] };
}

function realDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

// Strips |alias and #heading from a link.
const target = (raw) => raw.split('|')[0].split('#')[0].trim();

export function checkNotes(notesDir) {
  const problems = [];
  const rel = (f) => path.relative(notesDir, f).split(path.sep).join('/');
  const files = walk(notesDir);
  const byName = new Map(); // lowercase file name -> paths
  for (const f of files) {
    const k = path.basename(f).toLowerCase();
    byName.set(k, [...(byName.get(k) ?? []), f]);
  }
  const find = (name) => byName.get(name.toLowerCase()) ?? [];

  // Rule 7: Next to learn.md with the exact header.
  const ntl = path.join(notesDir, 'Next to learn.md');
  if (!fs.existsSync(ntl)) problems.push('Next to learn.md is missing at the notes folder root');
  else if (!fs.readFileSync(ntl, 'utf8').split(/\r?\n/).includes(HEADER))
    problems.push(`Next to learn.md: the header line must be exactly: ${HEADER}`);

  const ideas = new Map(); // lowercase title -> paths
  for (const f of files) {
    const stem = path.basename(f).replace(/\.md$/, '');

    // Rule 5: file names.
    if (ILLEGAL.test(stem)) problems.push(`${rel(f)}: illegal character in file name`);
    if (/ {2,}/.test(stem) || stem !== stem.trim() || stem.length > 100)
      problems.push(`${rel(f)}: illegal file name (repeated, leading, or trailing space, or over 100 characters)`);

    if (!f.endsWith('.md')) continue;
    const { fm, body } = parse(fs.readFileSync(f, 'utf8'));
    const parts = rel(f).split('/');
    const isIdea = parts.length === 3 && parts[1] === 'ideas';

    // Rule 3: every link and embed resolves.
    for (const m of `${fm.sessions ?? ''}\n${body}`.matchAll(/(!?)\[\[([^\]]+)\]\]/g)) {
      const t = target(m[2]);
      if (!find(m[1] || t.endsWith('.md') ? t : `${t}.md`).length)
        problems.push(`${rel(f)}: broken link [[${m[2]}]]`);
    }

    if (!isIdea) continue;
    const title = stem.toLowerCase();
    ideas.set(title, [...(ideas.get(title) ?? []), f]);

    // Rule 1: topic matches the folder.
    if (fm.topic !== parts[0])
      problems.push(`${rel(f)}: topic "${fm.topic}" must equal the folder name "${parts[0]}"`);

    // Rule 2: known or scheduled.
    if (fm.known === 'true') {
      if ('next_practice' in fm || 'interval_days' in fm)
        problems.push(`${rel(f)}: a known idea must not have next_practice or interval_days`);
    } else {
      if (!realDate(fm.next_practice))
        problems.push(`${rel(f)}: next_practice must be a real YYYY-MM-DD date`);
      if (!/^[1-9]\d*$/.test(fm.interval_days ?? ''))
        problems.push(`${rel(f)}: interval_days must be a positive integer`);
    }

    // Rule 6: sessions links point into a sessions folder.
    for (const m of (fm.sessions ?? '').matchAll(/\[\[([^\]]+)\]\]/g)) {
      const hits = find(`${target(m[1])}.md`);
      if (hits.length && !hits.some((h) => rel(h).split('/')[1] === 'sessions'))
        problems.push(`${rel(f)}: sessions link [[${m[1]}]] must point at a note in a sessions folder`);
    }

    // Rule 8: the body holds a claim.
    const claim = body.split('\n').filter((l) => !/^\s*Rests on:/.test(l)).join('').trim();
    if (!claim) problems.push(`${rel(f)}: the idea note has no claim in its body`);
  }

  // Rule 4: idea titles are unique.
  for (const [title, paths] of ideas)
    if (paths.length > 1) problems.push(`duplicate idea title "${title}": ${paths.map(rel).join(', ')}`);
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkNotes(process.argv[2]);
  for (const p of problems) console.log(p);
  process.exit(problems.length ? 1 : 0);
}
