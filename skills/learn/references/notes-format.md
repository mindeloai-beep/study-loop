# Notes format

Read this file before you read or write any note. Every rule here is checked by `tests/check-notes.mjs`.

## Settings

Read `./.study-loop/settings.json` first, then `~/.study-loop/settings.json`. Use the first file that parses. The schema is:

```json
{"notes_dir": "NOTES_DIR", "practice_repos": ["REPO_PATH"]}
```

- `NOTES_DIR`: the notes folder. A relative path resolves against the current working directory. First-run setup always writes an absolute path.
- `REPO_PATH`: a practice repository. The list can be empty.

If both files are missing or contain malformed JSON, run first-run setup from `session-rules.md`.

## Layout

Keep this layout inside `NOTES_DIR`:

```text
NOTES_DIR/
  Next to learn.md
  TOPIC/
    ideas/IDEA_TITLE.md
    sessions/SESSION_NAME.md
    diagrams/NAME.svg
```

`TOPIC` is lowercase with hyphens, for example `postgres-grants`.

## File names

Apply these rules to every file name and to every link:

- Replace each of `\ / : * ? " < > | # ^ [ ]` with `-`.
- Collapse repeated spaces into one space, and trim leading and trailing spaces.
- Cap the name at 100 characters before `.md`.
- Write a link with the same text as the file name, without `.md`.
- Keep idea titles unique across the whole notes folder.

## Idea notes

An idea note holds one claim. Start it with flat frontmatter:

```markdown
---
type: idea
topic: TOPIC
next_practice: YYYY-MM-DD
interval_days: N
sessions: ["[[SESSION_NAME]]"]
---
CLAIM

Rests on: [[IDEA_TITLE]], [[IDEA_TITLE]]
```

- `type` is `idea`. `topic` equals the topic folder name.
- A taught idea has `next_practice` (a real date) and `interval_days` (a positive integer).
- A known idea has `known: true` and neither practice key.
- Add `verified: false` only when you could not verify the claim.
- `CLAIM` is one or two sentences.
- Add the `Rests on:` line only when the claim has premises. Every link on it points at an existing note.

Before you create an idea note, search the existing idea notes for the same claim. If one exists, link to it.

## Session notes

Name a learn session `YYYY-MM-DD TOPIC` and a practice session `YYYY-MM-DD TOPIC practice`. A second session on the same day appends ` 2` to the name.

- A learn note holds the goal, the time available, what the probe found, the plan, the confusions fixed, and links to the ideas added.
- A practice note holds the ideas practiced, the results, and a `Findings` section.

## Diagrams

For a visual topic, write an SVG file to `TOPIC/diagrams/` and embed it in the idea note with `![[NAME.svg]]`.

## Next to learn

`NOTES_DIR/Next to learn.md` holds a table. The header line is exactly:

```markdown
| Question | Serves | Times raised | Added | Verdict |
```

## Practice timing

Use the learner's local date. Apply these rules:

- A newly taught idea gets `interval_days: 1` and `next_practice` set to the session date plus 1.
- A clean recall (solved with no hint) doubles `interval_days` and sets `next_practice` to today plus the new interval.
- A struggle (a hint used, or not solved) resets `interval_days` to 1 and `next_practice` to today plus 1.
- A known idea that turns out shaky becomes a taught idea with `interval_days: 1`.
