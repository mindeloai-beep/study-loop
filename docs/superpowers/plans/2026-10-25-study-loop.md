# study-loop implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship study-loop, a public plugin of two agent skills (`learn`, `practice`) that turns Claude Code or Codex into a tutor that saves what you learn as linked markdown notes.

**Architecture:** The product is prose: two `SKILL.md` files plus reference files the skills load on demand. The only shipped code is one SQL setup script for hands-on practice. Development tests use Node's built-in test runner with no npm dependencies. Skill behavior is tested two ways: graded single-turn cases with `claude plugin eval`, and multi-turn sessions that the builder drives as the learner with `claude -p --resume` and `codex exec resume`.

**Tech Stack:** Agent Skills (`SKILL.md`), Claude Code and Codex plugin manifests, Docker with the official `postgres` image, Node 18 or later (`node:test`, development only).

**Spec:** `docs/superpowers/specs/2026-10-25-study-loop-design.md`

## Global constraints

- Host tools: Claude Code and Codex. Skills use the `SKILL.md` format, which both read.
- Billing: set entirely by the host tool's login. study-loop never handles a login or key.
- Clean-room: no code, prompts, or text from LearnHarness. Do not open the LearnHarness repository or its in-app prompts.
- Licence: MIT.
- Optional dependencies: Obsidian (graph view) and Docker (hands-on practice). Without Docker, practice uses reading questions only.
- Writing style: the README and all skill prose follow the Google developer documentation style guide.
- Skills never write into the study-loop repository. Notes, settings, and practice material stay on the learner's machine.
- Hands-on practice runs only on a throwaway local database that the session creates and removes. It never connects to any other database, and never reads connection strings from the learner's repositories.
- Every message stays short. Practice never gives the answer unless the learner asks for it. The learner predicts before each explanation.
- No machine-specific paths, names, or secrets in any committed file. This plan and the spec are committed too, so they follow the same rule.
- No npm dependencies. Tests import only Node built-ins.

## Review focus

1. A notes folder whose path has spaces, parentheses, and an apostrophe, as many Obsidian vault names do. Every file operation and shell command quotes the path, and notes land in that folder. Pinned in Task 4 (driven session L3).
2. Docker is installed but not running. Practice says Docker is unavailable in one message and continues with reading questions, without hanging. Pinned in Task 5 (driven session P5).
3. A `study-loop-practice` container left over from a crashed session. Starting a new one removes it first and succeeds. Pinned in Task 2.
4. The past-mistake migration depends on tables created by earlier migrations. Practice loads those first, and the hole still proves itself. Pinned in Task 5 (fixture repository and driven session P3).
5. An idea title with characters that are illegal in filenames or Obsidian links (`?`, `:`, `/`, `#`). The filename is sanitized and links still resolve. Pinned in Task 3 (checker rule 5).

## Placeholders used in commands

- `REPO`: the study-loop repository root.
- `SCRATCH`: a new empty folder outside the repository, for example under the system temp folder. Driven sessions run with `SCRATCH` as the working directory.
- `SESSION_ID`: the `session_id` value from the previous `claude -p --output-format json` result.

---

### Task 1: Plugin skeleton and host installs

**Files:**
- Create: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- Create: `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`
- Create: `skills/learn/SKILL.md`, `skills/practice/SKILL.md` (frontmatter and one line each, filled in later)
- Create: `LICENSE`, `.gitignore`, `.gitattributes`
- Create: `tests/manifests.test.mjs`, `tests/README.md`

**Interfaces:**
- Produces: plugin name `study-loop`; marketplace name `study-loop`; skill folders `skills/learn` and `skills/practice`; the verified host commands recorded in `tests/README.md`, which every later task uses.

Values:

- Description, used in all four manifests: `A tutor inside Claude Code or Codex: probes what you know, teaches one step at a time, runs spaced practice, and saves what you learn as linked notes.`
- Author: `{"name": "mindeloai-beep"}`. Repository: `https://github.com/mindeloai-beep/study-loop`.
- `.claude-plugin/marketplace.json`: `name` `study-loop`, `owner` the author, one plugin `{"name": "study-loop", "source": "./", "description": DESCRIPTION}`.
- `.codex-plugin/plugin.json`: `name`, `version` `0.1.0`, `description`, `author`, `repository`, `"skills": "./skills/"`, `"interface": {"displayName": "study-loop"}`.
- `.agents/plugins/marketplace.json`: `name` `study-loop`, `interface.displayName` `study-loop`, one plugin with `"source": {"source": "local", "path": "./"}`, `"policy": {"installation": "AVAILABLE", "authentication": "ON_INSTALL"}`, `"category": "Productivity"`.
- `skills/learn/SKILL.md` frontmatter: `name: learn`; `description: Use when the learner wants to learn or understand a topic, asks what to learn next, or asks whether a course, video, or book is worth their time. Runs a tutoring session that checks the goal, probes, plans, teaches, and saves linked notes.`
- `skills/practice/SKILL.md` frontmatter: `name: practice`; `description: Use when the learner wants to practice what they have learned, or asks what is due for review. Runs adaptive practice with minimal hints, hands-on PostgreSQL practice in Docker when available, and updates practice dates.`
- `LICENSE`: MIT, `Copyright (c) 2026 mindeloai-beep`.
- `.gitignore`: `evals/results/`, `node_modules/`, `.study-loop/`, `tests/runs/`.
- `.gitattributes`: `* text=auto eol=lf`.

- [ ] **Step 1: Write the failing test** `tests/manifests.test.mjs` with these tests:
  - `manifests parse and name the plugin study-loop`: all four JSON files parse, and each top-level `name` is `study-loop`.
  - `codex manifest points at the skills folder`: `.codex-plugin/plugin.json` has `skills` equal to `./skills/`.
  - `marketplaces list the plugin from the repo root`: the Claude marketplace plugin `source` is `./`, and the Codex marketplace plugin `source` deep-equals `{"source": "local", "path": "./"}`.
  - `every skill has a matching name and a description`: for each folder in `skills/`, `SKILL.md` frontmatter `name` equals the folder name and `description` is non-empty.
  - `licence is MIT`: the first line of `LICENSE` is `MIT License`.

- [ ] **Step 2: Run the test and confirm it fails**

  Run: `node --test tests/`
  Expected: FAIL, because the manifest files do not exist.

- [ ] **Step 3: Create the files listed above with the values above.**

- [ ] **Step 4: Run the test and confirm it passes**

  Run: `node --test tests/`
  Expected: PASS, 5 tests.

- [ ] **Step 5: Verify that Claude Code loads the plugin from the folder**

  Run in `SCRATCH`: `claude --plugin-dir "REPO" -p "List the skills you can use whose names start with study-loop. Names only."`
  Expected: output contains `study-loop:learn` and `study-loop:practice`.

- [ ] **Step 6: Verify that Codex installs the plugin from the folder**

  Run: `codex plugin marketplace add "REPO"`, then `codex plugin add study-loop@study-loop`, then in `SCRATCH`: `codex exec --skip-git-repo-check -C "SCRATCH" "List the skills you can use whose names start with study-loop. Names only."`
  Expected: output names both skills. If a command fails, read `codex plugin --help` and `codex plugin marketplace --help` and use the form they document.

- [ ] **Step 7: Record the verified commands in `tests/README.md`**

  The file lists, for each host: how to load or install the plugin from `REPO`, how to pick up an edited skill (Codex keeps a cached copy, so record the upgrade or reinstall command that works), how to start a driven session, and how to continue it. Use these forms and correct them to what Steps 5 and 6 proved:

  ```
  claude --plugin-dir "REPO" -p --output-format json --allowedTools "Read Write Edit Glob Grep Skill Bash(docker:*) Bash(git:*)" "MESSAGE"
  claude --plugin-dir "REPO" -p --output-format json --allowedTools "Read Write Edit Glob Grep Skill Bash(docker:*) Bash(git:*)" --resume SESSION_ID "MESSAGE"
  codex exec --skip-git-repo-check -C "SCRATCH" --sandbox danger-full-access "MESSAGE"
  codex exec resume --last --skip-git-repo-check -C "SCRATCH" "MESSAGE"
  ```

  - `MESSAGE`: the learner's next message.
  - `--sandbox danger-full-access` is used only in `SCRATCH`, because hands-on practice needs the Docker socket.

- [ ] **Step 8: Commit**

  ```bash
  git add .claude-plugin .codex-plugin .agents skills LICENSE .gitignore .gitattributes tests
  git commit -m "Add plugin skeleton and manifests for Claude Code and Codex"
  ```

---

### Task 2: Practice database kit

**Files:**
- Create: `skills/practice/references/supabase-stub.sql`
- Create: `skills/practice/references/practice-db.md`
- Create: `tests/practice-db.test.mjs`
- Create: `tests/fixtures/db/missing-column-grant.sql`, `tests/fixtures/db/rls-leak.sql`

**Interfaces:**
- Produces, for the `practice` skill:
  - Container name `study-loop-practice`.
  - Image `postgres:17.N-alpine`, where `N` is the newest 17 minor on Docker Hub when you build. Write the exact tag into `practice-db.md`.
  - The command sequences below, written into `practice-db.md` in both a Bash form and a PowerShell form.

Command sequences:

- **Start:** `docker rm -f study-loop-practice` (an error that the container does not exist is fine), then `docker run -d --rm --name study-loop-practice -e POSTGRES_PASSWORD=practice IMAGE`, then repeat `docker exec study-loop-practice pg_isready -U postgres` once a second until it exits 0, for at most 30 tries. No port is published.
- **Load a file:** send it on standard input. Never copy files into the container or pass container paths, because Git Bash rewrites them on Windows.
  - Bash: `docker exec -i study-loop-practice psql -U postgres -v ON_ERROR_STOP=1 -v VERBOSITY=verbose < "FILE"`
  - PowerShell: `Get-Content -Raw "FILE" | docker exec -i study-loop-practice psql -U postgres -v ON_ERROR_STOP=1 -v VERBOSITY=verbose`
- **Query as a user:** run this in one transaction: `begin; set local role authenticated; select set_config('request.jwt.claims', '{"sub":"USER_UUID","role":"authenticated"}', true); QUERY; rollback;`
- **Stop:** `docker stop study-loop-practice`. Because of `--rm`, this also removes the container.

`supabase-stub.sql` creates:

- Roles `anon` and `authenticated` (`nologin noinherit`), and `service_role` (`nologin noinherit bypassrls`).
- Schemas `auth` and `extensions`, with extensions `uuid-ossp` and `pgcrypto` in `extensions`.
- Table `auth.users (id uuid primary key default gen_random_uuid(), email text)`.
- Functions written for this project, all reading `current_setting('request.jwt.claims', true)`:
  - `auth.jwt() returns jsonb`
  - `auth.uid() returns uuid`, which returns the `sub` claim
  - `auth.role() returns text`, which returns the `role` claim
- `usage` on schemas `public`, `auth`, and `extensions`, and `execute` on the three functions, granted to all three roles.
- Default privileges in `public`: `all` on tables, sequences, and functions to all three roles. This matches Supabase's grant-by-default behavior.

- [ ] **Step 1: Write the fixtures**
  - `missing-column-grant.sql` creates `public.employers (id uuid primary key default gen_random_uuid(), name text, city text, logo_url text)`, then runs `revoke insert on public.employers from authenticated` and `grant insert (name, city) on public.employers to authenticated`.
  - `rls-leak.sql` creates `public.notes (id uuid primary key default gen_random_uuid(), owner uuid not null, body text)`, enables row-level security, creates `notes_read` for select to `authenticated` `using (true)`, and inserts one row owned by `00000000-0000-0000-0000-00000000000a` and one by `00000000-0000-0000-0000-00000000000b`.

- [ ] **Step 2: Write the failing test** `tests/practice-db.test.mjs`. It skips every test when `docker info` exits non-zero. It runs the command sequences above through `child_process` with standard input, not a shell:
  - `start replaces a stale container`: first `docker run -d --name study-loop-practice IMAGE sleep 600`, then the start sequence. Expect `pg_isready` to exit 0.
  - `missing column grant raises 42501`: load the stub, then `missing-column-grant.sql`. Then, as user `00000000-0000-0000-0000-00000000000a`, run `insert into public.employers (name, city, logo_url) values ('a', 'b', 'c')`. Expect the output to contain `42501`.
  - `rls leak returns another user's rows`: load the stub, then `rls-leak.sql`. As user `...0a`, run `select count(*) from public.notes`. Expect `2`.
  - `stop removes the container`: after the stop sequence, `docker ps -a -q --filter "name=^study-loop-practice$"` prints nothing.

- [ ] **Step 3: Run the test and confirm it fails**

  Run: `node --test tests/practice-db.test.mjs`
  Expected: FAIL, because `supabase-stub.sql` does not exist.

- [ ] **Step 4: Write `supabase-stub.sql` and `practice-db.md`**

  `practice-db.md` holds the image tag, the four sequences in both shell forms, and the query-as-user pattern. It also states the rule: never run `psql` with `-h`, never run `supabase db` commands, and never read `.env` files or any file that holds a connection string.

- [ ] **Step 5: Run the test and confirm it passes**

  Run: `node --test tests/practice-db.test.mjs`
  Expected: PASS, 4 tests, with Docker running.

- [ ] **Step 6: Commit**

  ```bash
  git add skills/practice/references tests/practice-db.test.mjs tests/fixtures/db
  git commit -m "Add throwaway PostgreSQL kit with Supabase-style roles for practice"
  ```

---

### Task 3: Notes contract and checker

**Files:**
- Create: `skills/learn/references/notes-format.md` and an identical `skills/practice/references/notes-format.md`
- Create: `skills/learn/references/session-rules.md` and an identical `skills/practice/references/session-rules.md`
- Create: `tests/check-notes.mjs`, `tests/check-notes.test.mjs`, `tests/shared-refs.test.mjs`
- Create: `tests/fixtures/notes/My Vault (Test's)/Learning/...` (a valid notes folder)

**Interfaces:**
- Produces: `checkNotes(notesDir: string): string[]`, exported from `tests/check-notes.mjs`. It returns one message per problem, and an empty array means the folder is valid. As a command: `node tests/check-notes.mjs "NOTES_DIR"` prints the problems and exits 1 if there are any.
- Produces, for both skills: the two reference files. Both copies must stay byte-identical.

`notes-format.md` fixes these rules. They come from the spec's "Calls made during design" section, plus the additions marked as new:

- **Settings:** read `./.study-loop/settings.json`, then `~/.study-loop/settings.json`. The schema is `{"notes_dir": string, "practice_repos": string[]}`. A missing file or malformed JSON triggers first-run setup.
- **Layout:** `NOTES_DIR/Next to learn.md`, `NOTES_DIR/TOPIC/ideas/`, `NOTES_DIR/TOPIC/sessions/`, `NOTES_DIR/TOPIC/diagrams/`. `TOPIC` is lowercase with hyphens.
- **Filenames (new):** replace each of `\ / : * ? " < > | # ^ [ ]` with `-`, collapse repeated spaces, trim, and cap at 100 characters. A link uses the same text as the filename. Idea titles are unique across the whole notes folder.
- **Idea note:** flat frontmatter with these keys:
  - `type: idea` and `topic: TOPIC`.
  - Either `known: true`, or `next_practice: YYYY-MM-DD` and `interval_days: N`.
  - `verified: false` only when the claim is unverified.
  - `sessions: ["[[SESSION NOTE NAME]]"]`.

  The body is the claim in one or two sentences, then a `Rests on: [[A]], [[B]]` line when it has premises. Before creating an idea note, search the existing idea notes for the same claim, and link to the existing note if there is one.
- **Session notes:** `YYYY-MM-DD TOPIC.md` for a learn session and `YYYY-MM-DD TOPIC practice.md` for a practice session (new). A second session on the same day appends ` 2`. A learn note holds the goal, the time available, what the probe found, the plan, the confusions fixed, and the ideas added. A practice note holds the ideas practiced, the results, and a `Findings` section.
- **Diagrams:** for visual topics, write SVG files to `TOPIC/diagrams/` and embed them in the idea note with `![[NAME.svg]]`.
- **"Next to learn":** the table header is exactly `| Question | Serves | Times raised | Added | Verdict |`.
- **Practice timing:** a newly taught idea gets `interval_days: 1` and `next_practice` set to the session date plus 1. A clean recall (solved with no hint) doubles `interval_days` and sets `next_practice` to today plus the new interval. A struggle (a hint used, or not solved) resets `interval_days` to 1 and `next_practice` to today plus 1. A known idea that turns out shaky becomes a taught idea with `interval_days: 1`. Dates use the learner's local date.

`session-rules.md` fixes these rules:

- **First-run setup:** ask for the notes folder, then for practice repositories (optional). Create the folder and `Next to learn.md` with the header, then write `~/.study-loop/settings.json`. Tests override settings by placing `./.study-loop/settings.json` in the working directory, which is read first.
- **Picker:** if a multiple-choice question tool is available, use it, then ask for the learner's thinking. Otherwise show numbered options and ask for the number and the thinking in one reply.
- **Message length:** one question per message, and at most 120 words per explanation.
- **Teaching order:** the learner predicts before each explanation. Practice never reveals an answer unless the learner asks for it explicitly.
- **Verification ladder:** take the spec's three-step order (run it, check a primary source, or say "unverified" aloud). In Claude Code, run the documentation check with the Agent tool on model `haiku`.
- **Tangents:** sort each into one of the spec's three kinds.
- **Paths:** quote every path in shell commands, and never write inside the study-loop plugin folder.

- [ ] **Step 1: Write the valid fixture folder.** It contains:
  - `Next to learn.md` with the header.
  - Topic `postgres-grants` with one taught idea, `Column privileges are checked per named column.md`.
  - One known idea, `Privilege checks run before row-level security.md`.
  - One idea whose title had a `?` removed: `What does auth.uid() return-.md`.
  - The session note `2026-10-25 postgres-grants.md`.
  - Links between all of them.

- [ ] **Step 2: Write the failing tests** in `tests/check-notes.test.mjs`. Each mutation test copies the valid fixture to a temp folder, changes one thing, and asserts that the returned messages include the quoted text:
  - `valid folder has no problems`: `checkNotes(valid)` deep-equals `[]`.
  - `rule 1 wrong topic`: set `topic: other` in a postgres idea. Expect `topic`.
  - `rule 2 known and scheduled`: add `next_practice` to the known idea. Expect `known`.
  - `rule 2 bad date`: set `next_practice: 2026-13-40`. Expect `next_practice`.
  - `rule 3 broken link`: add `[[Nothing here]]`. Expect `Nothing here`.
  - `rule 4 duplicate title`: copy an idea into a second topic's `ideas` folder. Expect `duplicate`.
  - `rule 5 illegal character`: rename an idea to include `?`. Expect `illegal`.
  - `rule 6 session link outside sessions`: point `sessions` at an idea note. Expect `sessions`.
  - `rule 7 missing next to learn`: delete `Next to learn.md`. Expect `Next to learn`.
  - `rule 8 empty claim`: empty the body of an idea. Expect `claim`.

  In `tests/shared-refs.test.mjs`, the test `reference copies are identical` asserts that both copies of `notes-format.md` match byte for byte, and both copies of `session-rules.md` match byte for byte.

- [ ] **Step 3: Run the tests and confirm they fail**

  Run: `node --test tests/check-notes.test.mjs tests/shared-refs.test.mjs`
  Expected: FAIL, because `check-notes.mjs` and the reference files do not exist.

- [ ] **Step 4: Implement `checkNotes` and write both reference files**

  `checkNotes` resolves links by basename, case-insensitively, anywhere under `notesDir`. Before resolving, it strips `|alias` and `#heading` from the link, and it resolves `![[file.svg]]` embeds to that exact file. It parses the flat frontmatter defined above, and needs no YAML library.

- [ ] **Step 5: Run the tests and confirm they pass**

  Run: `node --test tests/`
  Expected: PASS, all tests.

- [ ] **Step 6: Commit**

  ```bash
  git add skills/learn/references skills/practice/references tests
  git commit -m "Add notes format, session rules, and notes checker"
  ```

---

### Task 4: The learn skill

**Files:**
- Modify: `skills/learn/SKILL.md` (full skill)
- Create: `skills/learn/references/rating.md`
- Create: `evals/learn-first-run/`, `evals/learn-action-gap/`, `evals/learn-first-probe/`, `evals/learn-rate-course/` (each holds `prompt.md` and `graders/criteria.md`)

**Interfaces:**
- Consumes: `notes-format.md` and `session-rules.md` (Task 3), and `checkNotes` (Task 3).
- Produces: notes that `practice` reads (Task 5).

`SKILL.md` sections, in order:

1. **Before you start:** load `references/session-rules.md` and `references/notes-format.md`, then read settings or run first-run setup.
2. **Modes:** a topic starts a session. No topic means rate the top "Next to learn" rows. A course, video, or book means rate it. Both rating modes use `references/rating.md`.
3. **Stage 1, goal:** ask what the knowledge is for, run the knowledge-or-action check, and ask how much time the learner has. Sizing:

   | Time | Probe questions, at most | Teach steps, at most |
   |---|---|---|
   | 30 minutes | 5 | 3 |
   | 60 minutes | 6 | 5 |
   | 90 minutes | 8 | 8 |

4. **Stage 2, probe:** read existing idea notes on the topic first. Ask one question at a time. Stop when every prerequisite of the goal is classed as known or unknown, or when you reach the cap.
5. **Stage 3, plan:** show the numbered steps, then wait for the learner to accept or change them.
6. **Stage 4, teach:** predict, then explain (at most 120 words), then check. Fix any confusion before moving on, and handle tangents per `session-rules.md`.
7. **Stage 5, save:** follow `notes-format.md`.

`rating.md` holds the spec's five questions and evidence table, the four verdict rules, and this card, which the skill prints exactly:

```text
Topic:     NAME (TYPE, LENGTH)
Serves:    GOALS OR PROJECTS
Blocks:    WHAT IT BLOCKS, OR "nothing now"
Verdict:   now | partial | park | skip - SLICE NAME, about N min, WHERE IT GOES
Skip:      PARTS TO SKIP
Saved to:  Next to learn (or "not saved")
```

Above the card, the skill shows the five questions with one-line answers.

- [ ] **Step 1: Write the four eval cases.** Start each from `claude plugin eval init --bare NAME` and keep its frontmatter fields. Set `max_turns: 10` and allow the tools `Read, Write, Glob, Grep, Skill`. Where a case needs settings, use a `scaffold_script` that writes `.study-loop/settings.json` with `notes_dir` set to `./notes`, and creates `./notes/Next to learn.md` with the header. Cases and grader criteria:
  - `learn-first-run`: no scaffold. Prompt: `/study-loop:learn postgres grants`. The grader passes only if the first thing the agent asks for is the notes folder, and it asks nothing about the topic yet.
  - `learn-action-gap`: prompt `/study-loop:learn get better at sales. It's for closing more deals for my web agency. I have 30 minutes.` The grader passes only if the agent says the gap is mostly action, names at least one concrete action, offers to teach only a narrow piece, and asks no probe question.
  - `learn-first-probe`: prompt `/study-loop:learn postgres grants and RLS. Goal: read a migration and spot missing grants or RLS holes. I have 30 minutes.` The grader passes only if the agent asks exactly one multiple-choice question (a picker call, or numbered options), asks for the learner's thinking, and explains nothing before the question.
  - `learn-rate-course`: prompt `/study-loop:learn Is this course worth my time? "Python for AI", about 6 hours. Chapters: install Python, VS Code setup and themes, workspaces, virtual environments, pip, Jupyter, variables, strings, booleans, if/else, loops, lists, dictionaries, functions, imports, APIs with requests, pandas and matplotlib. I review Python that agents write; my main products are TypeScript.` The grader passes only if the agent shows the five questions with answers, prints the card, gives a partial slice with a time estimate, and lists the setup chapters under Skip.

- [ ] **Step 2: Run the evals and confirm they fail**

  Run: `claude plugin eval "REPO" --no-publish --scaffold --runs 1 --ablation none`
  Expected: the cases score below threshold, because `SKILL.md` is still a stub.

- [ ] **Step 3: Write `SKILL.md` and `rating.md` as specified above.**

- [ ] **Step 4: Run the evals and confirm they pass**

  Run: `claude plugin eval "REPO" --no-publish --scaffold --runs 3`
  Expected: every case scores 1.0. Read the ablation delta in the report: each case should score higher with the plugin than without it.

- [ ] **Step 5: Run driven session L3 in Claude Code**

  Set `SCRATCH/.study-loop/settings.json` to `{"notes_dir": "./My Vault (Test's)/Learning", "practice_repos": []}`. Play this learner persona: knows `SELECT`, `INSERT`, `UPDATE`, and what a table is; has heard of roles; does not know column-level grants, that privilege checks run before RLS, or how `USING` differs from `WITH CHECK`. Open with `/study-loop:learn postgres grants and RLS. Goal: read a migration and spot missing grants or RLS holes. I have 30 minutes.` After teach step 1, send `quick one: what is a Docker container?` After teach step 2, send `how does Docker really work under the hood, and how do I use it better?` Save each reply to `tests/runs/` (ignored by git).

  Pass criteria, all required:
  - Probe questions show numbered options (`-p` mode has no picker).
  - The plan is shown, and the session waits for acceptance.
  - Every explanation is 120 words or fewer, and a prediction is asked before each one.
  - The small tangent gets an answer of three lines or fewer, then the session returns to the step.
  - The big tangent gets one line, and a row is added to "Next to learn".
  - `node tests/check-notes.mjs "SCRATCH/My Vault (Test's)/Learning"` exits 0.
  - Each taught note has `interval_days: 1` and `next_practice` equal to the session date plus 1.
  - The session note exists.
  - `git -C "REPO" status --porcelain` shows no change made by the session.

- [ ] **Step 6: Run driven session L4 in Claude Code**

  In the same `SCRATCH`, start a new session with `/study-loop:learn`.
  Expected: the five answers, then the card, for the Docker row from L3.

- [ ] **Step 7: Fix what failed, rerun the failed cases and sessions, and commit**

  ```bash
  git add skills/learn evals
  git commit -m "Add learn skill with topic rating and eval cases"
  ```

---

### Task 5: The practice skill

**Files:**
- Modify: `skills/practice/SKILL.md` (full skill)
- Create: `skills/practice/references/finding-past-mistakes.md`
- Create: `tests/make-fixture-repo.mjs`, `tests/make-fixture-repo.test.mjs`
- Create: `evals/practice-due-selection/` (holds `prompt.md`, `graders/criteria.md`, and a scaffold that copies the Task 3 fixture notes with dates set relative to the run date)

**Interfaces:**
- Consumes: the practice database kit (Task 2), the notes contract and `checkNotes` (Task 3), and notes written by `learn` (Task 4).
- Produces: `makeFixtureRepo(dir: string): void`, exported from `tests/make-fixture-repo.mjs`.

`makeFixtureRepo` creates a git repository with a local identity (`fixture`, `fixture@example.com`) and four commits, one migration each, under `supabase/migrations/`:

1. `20260101000000_notes.sql` creates `public.notes (id uuid primary key default gen_random_uuid(), owner uuid not null, body text)` and enables row-level security.
2. `20260102000000_notes_policy.sql` creates `notes_read` for select to `authenticated` `using (true)`. This is the past mistake.
3. `20260103000000_fix_notes_policy.sql` drops `notes_read` and recreates it `using (owner = auth.uid())`. This is the fix.
4. `20260104000000_profiles.sql` creates `public.profiles (id uuid primary key, display_name text)` without enabling row-level security. This is a live hole in current code.

`finding-past-mistakes.md` fixes these rules:

- Read only `supabase/migrations/**` or another `migrations/` folder.
- List fixes with: `git -C "REPO_PATH" log --date=short --format="%H %ad %s" -G "grant|GRANT|revoke|REVOKE|policy|POLICY|row level security|ROW LEVEL SECURITY" -- "MIGRATIONS_DIR"`
  - `REPO_PATH`: a path from `practice_repos`.
  - `MIGRATIONS_DIR`: the migrations folder inside it.
- The past mistake is the migration a later fix changed. Load the migrations that create its referenced tables first, in filename order, then the mistake.
- If a load fails on a missing object, add the migration that creates that object and retry, at most 3 times.
- If no past mistake is found, plant one change in a current migration and tell the learner: remove a column from a `grant` list, change a policy to `using (true)`, or drop the `enable row level security` line.
- A live hole goes into the practice session note's `Findings` section. Never edit the learner's repository.

`SKILL.md` sections, in order:

1. **Before you start:** load the shared references and settings.
2. **Choose ideas:** with no topic, take the ideas whose `next_practice` is today or earlier. With a topic, take that topic's ideas. Use at most 5 ideas per session.
3. **Pose problems:** one problem per message. Never name the idea or quote its title. Vary how many ideas a problem combines and how familiar the situation looks.
4. **Hints:** give the smallest hint that moves the learner forward. After two hints, offer a choice between another hint and the answer. Reveal the answer only on an explicit request.
5. **Hands-on:** run `docker info` first. If it fails, say Docker is unavailable in one message and switch to reading questions. Otherwise follow `practice-db.md` and `finding-past-mistakes.md`, prove each answer, and run the stop sequence at the end of every session, including one the learner ends early.
6. **Schedule:** apply the timing rules in `notes-format.md`.
7. **Save:** write the practice session note.

- [ ] **Step 1: Write the failing test** `tests/make-fixture-repo.test.mjs` with the test `creates four commits and the live hole`. It runs `makeFixtureRepo` in a temp folder, and asserts that `git log --oneline` has 4 lines and that `20260104000000_profiles.sql` contains no `enable row level security`.

- [ ] **Step 2: Run the test and confirm it fails**

  Run: `node --test tests/make-fixture-repo.test.mjs`
  Expected: FAIL, because `make-fixture-repo.mjs` does not exist.

- [ ] **Step 3: Implement `makeFixtureRepo`**

- [ ] **Step 4: Run the test and confirm it passes**

  Run: `node --test tests/make-fixture-repo.test.mjs`
  Expected: PASS.

- [ ] **Step 5: Write the eval case `practice-due-selection`**

  The scaffold copies the Task 3 fixture notes. It sets one taught idea's `next_practice` to yesterday, and the other to 30 days from the run date. Prompt: `/study-loop:practice`. The grader passes only if the single problem targets the due idea, does not contain the idea's title, and does not reveal the answer.

- [ ] **Step 6: Write `SKILL.md` and `finding-past-mistakes.md` as specified above.**

- [ ] **Step 7: Run the eval and confirm it passes**

  Run: `claude plugin eval "REPO" --no-publish --scaffold --runs 3 --case practice-due-selection`
  Expected: score 1.0.

- [ ] **Step 8: Run driven sessions P1 to P5 in Claude Code**

  Reuse the L3 notes, after editing every taught note's `next_practice` to yesterday. For P3 and P4, run `makeFixtureRepo("SCRATCH/fixture-repo")` and add that path to `practice_repos`. Pass criteria:

  | Session | What you send | Passes when |
  |---|---|---|
  | P1 due selection | `/study-loop:practice` | Problems cover only due ideas and never name them |
  | P2 stuck learner | `I don't know` twice, then `show me the answer` | Two minimal hints with no answer, then the answer only after the explicit request |
  | P3 hands-on | `/study-loop:practice postgres-grants`, then find the hole | The agent finds `20260102000000_notes_policy.sql`, loads `20260101000000_notes.sql` first, and proves the leak by showing the other user's row. Afterwards `docker ps -a -q --filter "name=^study-loop-practice$"` prints nothing |
  | P4 dates and findings | Solve one problem with no hint, then need a hint on another | The clean idea's `interval_days` doubled. The hinted idea's `interval_days` is 1, with `next_practice` set to today plus 1. The practice session note's `Findings` section lists `public.profiles` without RLS. `git -C "SCRATCH/fixture-repo" status --porcelain` prints nothing. `check-notes` exits 0 |
  | P5 Docker down | Run with `DOCKER_HOST=tcp://127.0.0.1:1` set for the `claude` process | Within one message, the agent says Docker is unavailable and poses a reading question |

- [ ] **Step 9: Fix what failed, rerun the failed sessions, run `node --test tests/`, and commit**

  ```bash
  git add skills/practice tests evals
  git commit -m "Add practice skill with hands-on PostgreSQL practice and scheduling"
  ```

---

### Task 6: Codex parity

**Files:**
- Modify: `skills/learn/SKILL.md`, `skills/practice/SKILL.md`, and the references, only where Codex runs expose a problem
- Modify: `tests/README.md` (record the Codex results)

**Interfaces:**
- Consumes: the verified Codex commands (Task 1) and the driven-session criteria (Tasks 4 and 5).
- Produces: two facts for the README: whether Codex has a multiple-choice question tool, and the exact Codex skill syntax.

- [ ] **Step 1: Pick up the current skills in Codex** with the upgrade or reinstall command recorded in `tests/README.md`.

- [ ] **Step 2: Check for a question tool**

  Run: `codex exec --skip-git-repo-check -C "SCRATCH" "List the names of every tool you can call, one per line, and mark any that shows the user multiple-choice options."`
  Also check the Codex documentation or changelog for a user-question tool. Record both results in `tests/README.md`.

- [ ] **Step 3: Run driven sessions in Codex,** in a fresh `SCRATCH`, using the same criteria as in Claude Code: first-run setup, L3 with `$study-loop:learn` and the same persona, P1, and P3. During P3, the Codex sandbox and the Windows shell are the likely problems. The PowerShell form in `practice-db.md` exists for this run.

- [ ] **Step 4: Fix what failed, rerun until all pass, and rerun the Claude Code evals**

  Run: `claude plugin eval "REPO" --no-publish --scaffold --runs 1`
  Expected: all cases still score 1.0, so the Codex fixes did not break Claude Code.

- [ ] **Step 5: Commit**

  ```bash
  git add skills tests/README.md
  git commit -m "Make both skills work the same in Codex"
  ```

---

### Task 7: README, privacy check, and publish

**Files:**
- Create: `README.md`
- Create: `tests/privacy.test.mjs`

**Interfaces:**
- Consumes: the Codex facts (Task 6) and the verified install commands (Task 1).
- Produces: the public repository `mindeloai-beep/study-loop`.

`README.md` sections, in order:

1. What it is.
2. Requirements.
3. Install, for Claude Code and for Codex.
4. Commands, as a table for both hosts.
5. Who pays: the billing table from the spec, with other Codex providers marked untested.
6. First run.
7. Where your notes go.
8. Hands-on practice and Docker, including that practice never connects to your own databases.
9. The Codex picker result.
10. Credits: link Eero Alvar's video, and state that study-loop contains no LearnHarness code or prompts.
11. Licence.

`tests/privacy.test.mjs` scans the content of every file that `git ls-files` lists, except itself, and fails on any of these:

- A Windows home path: a drive letter and colon, then `\Users\` and a folder name.
- A macOS or Linux home path: `/Users/` or `/home/` followed by a folder name and a slash.
- An email address not at `example.com`.
- A key-shaped string: one of the prefixes `sk-ant-`, `sk-proj-`, `sb_secret_`, `sb_publishable_`, `eyJhbGciOi`, `ghp_`, or `github_pat_`, followed by at least 20 key characters. Matching the prefix alone would flag this plan.
- Any line of the optional file `~/.study-loop-dev/blocklist.txt`, matched case-insensitively. This file is never committed.

- [ ] **Step 1: Write the failing test** `tests/privacy.test.mjs` with the test `tracked files contain no personal data or secrets`. Prove it can fail: temporarily add a tracked file containing a made-up Windows home path, run the test, see it fail, then remove the file.

- [ ] **Step 2: Ask the owner for the blocklist.** Ask the owner for client, project, and personal names. Write them to `~/.study-loop-dev/blocklist.txt`, outside the repository.

- [ ] **Step 3: Write `README.md`,** then run `node --test tests/`.
  Expected: PASS, all tests, including privacy.

- [ ] **Step 4: Get the owner's yes before publishing.** Show the owner three things:
  - The `git ls-files` list.
  - The commit author email, from `git log --format="%ae" | sort -u`.
  - A note that the repository becomes public.

  Ask whether to keep that email or use their GitHub noreply address. If they choose noreply, set it with `git config user.email` in this repository. Then, because nothing has been pushed yet, run `git rebase --root --exec "git commit --amend --no-edit --reset-author"`.

- [ ] **Step 5: Create the repository and push**

  Run: `gh repo create mindeloai-beep/study-loop --public --source . --remote origin --push --description "A tutor inside Claude Code or Codex that saves what you learn as linked notes."`
  Then run `gh repo view mindeloai-beep/study-loop --json visibility`.
  Expected: `"visibility":"PUBLIC"`.

- [ ] **Step 6: Install from GitHub in both hosts,** in a fresh `SCRATCH`, using the README's commands exactly.
  Expected: each host lists both skills. If a README command fails, fix the README, commit, and push.

- [ ] **Step 7: Commit and push any README fixes**

  ```bash
  git add README.md tests/privacy.test.mjs
  git commit -m "Add README and privacy check"
  git push
  ```

---

### Task 8: Owner acceptance

**Files:**
- Modify: whatever the acceptance sessions show is broken, then `README.md` if behavior changed

**Interfaces:**
- Consumes: the published plugin (Task 7).

- [ ] **Step 1: Day 1. The owner runs their real first session in Claude Code.** In an interactive session, they run `/study-loop:learn postgres grants and RLS`. First-run setup takes their real vault's `Learning` folder and their chosen practice repositories. The builder stays available, and does not drive.

- [ ] **Step 2: Check day 1**
  - Run `node tests/check-notes.mjs "OWNER_LEARNING_FOLDER"`. Expected: exit 0. `OWNER_LEARNING_FOLDER` is the `notes_dir` from the owner's settings file. The checker only reads.
  - The owner confirms that the picker appeared for probe questions.
  - The owner confirms that Obsidian's graph view, filtered to `path:Learning` with Arrows on, shows the ideas connected.

- [ ] **Step 3: Day 2. The owner runs their first real practice session in Codex,** with `$study-loop:practice`.

- [ ] **Step 4: Check day 2**
  - `check-notes` exits 0, and the dates changed per the timing rules.
  - `docker ps -a -q --filter "name=^study-loop-practice$"` prints nothing.
  - Every practice repository's `git status --porcelain` output is unchanged from before the session.

- [ ] **Step 5: Fix, verify, and push.** For each problem the owner reports: fix it, run `node --test tests/` and the affected eval or driven session, then commit and push.

- [ ] **Step 6: Report the definition of done.** Go through every line of the spec's "Definition of done" and give the evidence for each: a command output, an eval score, or the owner's confirmation. State plainly any line without evidence.
