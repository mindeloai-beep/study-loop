// Checks a study-loop notes folder against the notes-format contract.
// Usage: node tests/check-notes.mjs "NOTES_DIR"
// Only study-loop content is checked: "Next to learn.md" at the root and every file inside a
// topic folder (a top-level folder holding ideas/, sessions/, or diagrams/). Dot-directories
// are skipped, so a notes folder can be a whole Obsidian vault.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ILLEGAL = /[\\/:*?"<>|#^[\]]/;
const HEADER = '| Question | Serves | Times raised | Added | Verdict |';
const TOPIC_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SUBFOLDERS = ['ideas', 'sessions', 'diagrams'];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.'))
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

const unquote = (v) => v.replace(/^(["'])(.*)\1$/, '$2');

// Flat frontmatter only: "key: value" scalars and "key:" followed by "- item" lines.
// Returns { fm, body }; fm is null when the note has no frontmatter.
function parse(text) {
  const lines = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').split('\n');
  const end = lines[0] === '---' ? lines.indexOf('---', 1) : -1;
  if (end < 0) return { fm: null, body: lines.join('\n') };
  const fm = {};
  let key = null;
  for (const line of lines.slice(1, end)) {
    const item = /^\s*-\s+(.*)$/.exec(line);
    const kv = /^([^\s:][^:]*):\s*(.*)$/.exec(line);
    if (item && key) fm[key] = [...(Array.isArray(fm[key]) ? fm[key] : []), unquote(item[1].trim())];
    else if (kv) fm[(key = kv[1].trim())] = unquote(kv[2].trim());
  }
  return { fm, body: lines.slice(end + 1).join('\n') };
}

function realDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

const target = (raw) => raw.split('|')[0].split('#')[0].trim(); // strip |alias and #heading
const links = (text) => [...text.matchAll(/(!?)\[\[([^\]]+)\]\]/g)];
const withoutCode = (text) => text.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, '').replace(/`[^`\n]*`/g, '');

export function checkNotes(notesDir) {
  if (!fs.existsSync(notesDir) || !fs.statSync(notesDir).isDirectory())
    return [`notes folder not found: ${notesDir}`];
  const problems = [];
  const rel = (f) => path.relative(notesDir, f).split(path.sep).join('/');
  const all = walk(notesDir);
  const byName = new Map(); // lowercase file name -> paths; links resolve against every note
  for (const f of all) {
    const k = path.basename(f).toLowerCase();
    byName.set(k, [...(byName.get(k) ?? []), f]);
  }
  const find = (name) => byName.get(name.toLowerCase()) ?? [];

  // One scoping step: the topic folders, then the files the rules apply to.
  const topics = new Set(all.map((f) => rel(f).split('/')).filter((p) => p.length >= 3 && SUBFOLDERS.includes(p[1])).map((p) => p[0]));
  const scoped = all.filter((f) => rel(f) === 'Next to learn.md' || topics.has(rel(f).split('/')[0]) && rel(f).includes('/'));

  // Rule 7: Next to learn.md with the exact header.
  const ntl = path.join(notesDir, 'Next to learn.md');
  if (!fs.existsSync(ntl)) problems.push('Next to learn.md is missing at the notes folder root');
  else if (!fs.readFileSync(ntl, 'utf8').split(/\r?\n/).includes(HEADER))
    problems.push(`Next to learn.md: the header line must be exactly: ${HEADER}`);

  for (const t of topics)
    if (!TOPIC_NAME.test(t)) problems.push(`${t}: topic folder name must be lowercase with hyphens`);

  const ideas = new Map(); // lowercase title -> paths
  for (const f of scoped) {
    const parts = rel(f).split('/');
    const stem = path.parse(f).name;

    // Rule 5: file names, with the 100-character cap before the extension.
    if (ILLEGAL.test(stem)) problems.push(`${rel(f)}: illegal character in file name`);
    if (/ {2,}/.test(stem) || stem !== stem.trim() || stem.length > 100)
      problems.push(`${rel(f)}: illegal file name (repeated, leading, or trailing space, or over 100 characters)`);

    if (!f.endsWith('.md')) continue;
    const { fm, body } = parse(fs.readFileSync(f, 'utf8'));
    const isIdea = parts.length === 3 && parts[1] === 'ideas';
    const sessions = Array.isArray(fm?.sessions) ? fm.sessions.join('\n') : fm?.sessions ?? '';

    // Rule 3: every link and embed resolves.
    for (const [, embed, raw] of links(`${sessions}\n${withoutCode(body)}`)) {
      const t = target(raw);
      if (!find(embed || t.endsWith('.md') ? t : `${t}.md`).length)
        problems.push(`${rel(f)}: broken link [[${raw}]]`);
    }

    if (!isIdea) {
      if (fm?.type === 'idea') problems.push(`${rel(f)}: misplaced idea note, it belongs in ${parts[0]}/ideas/`);
      continue;
    }
    if (!fm) { problems.push(`${rel(f)}: no frontmatter`); continue; }
    const title = stem.toLowerCase();
    ideas.set(title, [...(ideas.get(title) ?? []), f]);

    if (fm.type !== 'idea') problems.push(`${rel(f)}: type must be idea`);
    // Rule 1: topic matches the folder.
    if (fm.topic !== parts[0])
      problems.push(`${rel(f)}: topic "${fm.topic}" must equal the folder name "${parts[0]}"`);
    // Rule 2: known or scheduled.
    if (fm.known === 'true') {
      if ('next_practice' in fm || 'interval_days' in fm)
        problems.push(`${rel(f)}: a known idea must not have next_practice or interval_days`);
    } else {
      if (!realDate(fm.next_practice)) problems.push(`${rel(f)}: next_practice must be a real YYYY-MM-DD date`);
      if (!/^[1-9]\d*$/.test(fm.interval_days ?? '')) problems.push(`${rel(f)}: interval_days must be a positive integer`);
    }
    // Rule 6: sessions links point into a sessions folder.
    if (!('sessions' in fm)) problems.push(`${rel(f)}: missing sessions key`);
    for (const [, , raw] of links(sessions)) {
      const hits = find(`${target(raw)}.md`);
      if (hits.length && !hits.some((h) => rel(h).split('/')[1] === 'sessions'))
        problems.push(`${rel(f)}: sessions link [[${raw}]] must point at a note in a sessions folder`);
    }
    // Rule 8: the body holds a claim.
    if (!body.split('\n').filter((l) => !/^\s*Rests on:/.test(l)).join('').trim())
      problems.push(`${rel(f)}: the idea note has no claim in its body`);
  }

  // Rule 4: idea titles are unique.
  for (const [title, paths] of ideas)
    if (paths.length > 1) problems.push(`duplicate idea title "${title}": ${paths.map(rel).join(', ')}`);
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) {
    console.error('usage: node tests/check-notes.mjs "NOTES_DIR"');
    process.exit(2);
  }
  const problems = checkNotes(process.argv[2]);
  for (const p of problems) console.log(p);
  process.exit(problems.length ? 1 : 0);
}
