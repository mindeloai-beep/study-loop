# study-loop design

**Date:** 2026-10-25
**Status:** Draft, awaiting owner approval
**Owner:** mindeloai-beep

## Summary

study-loop is a set of agent skills that turns Claude Code or Codex into a personal tutor.
It finds where your understanding stops, plans the shortest path to your goal, teaches one
reasoning step at a time, and runs practice sessions on later days. What you learn is saved
as linked markdown notes, which Obsidian can draw as a graph. It runs on whatever the host
tool is signed in with: a Claude subscription, a ChatGPT subscription, or an API key.

## Background and intent

The method comes from Eero Alvar's video
[Agent Harness for Learning Things](https://www.youtube.com/watch?v=nfTDljFG2g0)
(2026-10-23). His app, LearnHarness, is a desktop app that calls model APIs with the
learner's own keys, so every session costs money per use. It is licensed AGPL-3.0.

The owner wants the same learning method with three differences:

- **No per-use cost.** It runs on a subscription the learner already pays for, starting
  with Claude Max.
- **No new app.** It runs inside the agent tool the learner already uses every day.
- **Public.** Anyone can install it, on Claude Code or Codex, on any login.

The first learner is a solo developer working at a laptop. The first topic is PostgreSQL
grants and row-level security (RLS). The goal for that topic is to read a database
migration and spot a missing grant or an RLS hole. The second topic is machine learning
from beginner level.

### The method in brief

The video's method has these parts, all of which study-loop keeps:

- **Two processes.** Teaching installs understanding. Practice makes it usable, by
  widening the situations in which the right idea comes to mind.
- **Thinking, not only answers.** The learner explains their reasoning in their own words
  at almost every turn. Two people can give the same wrong answer for different reasons,
  and only the thinking shows which.
- **Teaching loop.** Probe the edge of what the learner knows, plan the smallest set of
  steps from there to the goal, then teach each step as predict, explain, check.
- **Practice.** Problems that do not name the topic, so the learner has to recall the right
  idea without being told which one. Minimal hints, never the answer outright.
- **A lasting record.** What was taught is stored as single claims linked to the claims
  they rest on. Later sessions read it instead of starting from scratch.

## Goals

The first version does the following:

1. Runs the teaching loop: goal check, probe, plan, teach, save.
2. Runs practice sessions, hands-on where the topic allows it.
3. Keeps a growing set of linked idea notes that Obsidian can show as a graph.
4. Helps the learner decide what to learn and when.
5. Handles tangent questions without derailing the session.
6. Runs in Claude Code and Codex, on a subscription or an API key.
7. Ships as a public, MIT-licensed repository that installs with one command per tool.

## Non-goals

The first version does not include:

- A browser, desktop, or phone app.
- More than one user, accounts, or a view for a trainer.
- Any code that calls a model API directly, or that reads, stores, or forwards a login or
  key.
- Mastery scores. The only per-idea state is the next practice date.
- Importing existing notes.
- Interactive demos or dictation. The learner can use their operating system's dictation.

## Anti-goals

The tool fails, even if it technically works, if any of these happen:

- **It skips the struggle.** Long explanations or handed-over answers create the feeling of
  learning without the learning. Every message stays short, practice never gives the
  answer unless the learner asks for it, and the learner predicts before each explanation.
- **It teaches when the gap is action.** If the learner already knows enough, or the goal
  needs doing rather than knowing, the tool says so and stops.
- **It presents an unverified claim as verified.** See
  [Getting facts right](#getting-facts-right).
- **Choosing what to do takes longer than a few seconds.** Picking today's session must be
  one command.
- **It touches a real database.** Hands-on practice runs only on a throwaway local
  database that the session creates and removes.
- **It leaks the learner's data.** Skills never write into the study-loop repository.
  Notes, settings, and practice material stay on the learner's machine.

## Constraints

- **Host tools:** Claude Code and Codex. Skills use the `SKILL.md` format, which both read.
- **Billing:** Set entirely by the host tool's login. study-loop never handles a login or
  key.
- **Clean-room:** No code, prompts, or text from LearnHarness. The builder does not open
  the LearnHarness repository or its in-app prompts. The ideas in the video and its README
  are free to use.
- **Licence:** MIT.
- **Optional dependencies:** Obsidian (for the graph view) and Docker (for hands-on
  practice). Without Obsidian, notes are plain markdown. Without Docker, practice uses
  reading questions only.
- **Writing style:** The README and all skill prose follow the Google developer
  documentation style guide.

## Decided with the owner

### Where it runs

Sessions run in the host tool's terminal. There is no separate app.

### Commands

study-loop has two skills:

| Skill | Claude Code | Codex | What it does |
|---|---|---|---|
| `learn` | `/study-loop:learn [topic]` | `$study-loop:learn [topic]` | Runs a teaching session. With no topic, suggests what to learn next |
| `practice` | `/study-loop:practice [topic]` | `$study-loop:practice [topic]` | Runs a practice session. With no topic, picks the ideas that are due |

Either skill runs first-time setup if no settings file exists.

### The learn session

A learn session runs these stages in order:

1. **Goal and knowledge-or-action check.** Ask what the knowledge is for: the concrete
   outcome the learner wants. Judge whether the gap is knowledge or action, and say so
   plainly. For an action gap, name the action and offer to teach only the narrow part
   that is knowledge. Ask how much time the learner has, and size the session to fit.
2. **Probe.** Read the learner's existing idea notes on the topic first, so probing starts
   near the edge of what they know. Ask multiple-choice questions that narrow down where
   understanding stops on each idea the goal depends on. After each question, the learner
   gives their thinking and states their confidence in their own words. Stop probing when
   the plan can be built.
3. **Plan.** Show the short list of steps from the learner's edge to the goal. The learner
   accepts it or changes it.
4. **Teach.** For each step: the learner predicts the next move, the tool explains in a few
   lines, then checks with one question. Fix any confusion before moving on. Handle
   tangents as described in [Tangents](#tangents).
5. **Save.** Write idea notes and a session note, and update the "Next to learn" note.

### The answer picker

Each skill says: if the host tool has a multiple-choice question tool, use it; if not,
show numbered options as text. The model checks which tools it has at run time.

- **Claude Code:** The learner picks from the picker, then types their thinking as the
  next message.
- **Codex:** If Codex has a question tool, use it. Otherwise the learner replies with the
  number and their thinking in one message, for example: "2, because I think column grants
  only cover reads."

### Practice sessions

A practice session works as follows:

- With no topic, it picks idea notes whose next practice date has passed. With a topic, it
  uses that topic's idea notes.
- Problems do not name the idea they test. Difficulty changes in two ways: how many ideas
  one problem combines, and how familiar the situation looks.
- The learner thinks out loud. When stuck, they get the smallest hint that moves them
  forward.
- **Hands-on practice for database topics.** The material is the learner's own past
  mistakes: real migrations from their project repositories, as they were before a later
  migration fixed them. The session starts a throwaway PostgreSQL container, loads one
  such migration, and asks the learner to find the hole. Running the SQL then proves the
  answer. The container is removed at the end of the session. The session never connects
  to any other database, and never reads connection strings from the learner's
  repositories. The designer's calls on how this works are in
  [Hands-on practice mechanics](#hands-on-practice-mechanics).
- After each problem, the next practice date of every idea it tested is updated.

### Tangents

When the learner asks a side question, the tool sorts it by size and says which way it
went:

- **Small, and needed to continue:** Answer in two or three lines, then return to the
  step. Save the answer as an idea note linked to the step where it came up.
- **Big, and not needed for today's goal:** Give a one-line answer and add the question to
  "Next to learn" for a full session later.
- **A gap that blocks today's goal:** Add it to the plan as a new step.

The learner can override with "go deep on this now."

### What to learn next

`learn` with no topic reads "Next to learn" and suggests one item for today's session.
When the learner proposes a new topic, or a course, video, or book, the tool rates it the
same way.

`learn later: TOPIC, for GOAL` saves a topic from an unrelated session. It adds a `not
rated` row to "Next to learn", or adds 1 to the row's count, confirms in one line, and
stops. The next `learn` with no topic rates the row.

First, the tool turns the topic into a goal by asking what the learner would do with it.
A topic with no goal cannot be rated. Then it answers five questions, each from evidence
it can read:

| Question | What it checks | Evidence |
|---|---|---|
| Does it block something? | A current goal cannot progress without it | The learner's goals, "Next to learn", and current session plans |
| How often will the learner use it? | How often it appears in real work | The configured repositories (files and commits by language or tool, last 90 days) and how often it came up as a tangent |
| Does the learner write it or review it? | If agents write it, the learner needs reading-level knowledge only | The learner's answer |
| How much does the learner already know? | Overlap with existing idea notes, including concepts that transfer from another language or tool | Idea notes and a short probe |
| Will it still be true in a year? | Concepts last. Setup steps, menus, and shortcuts go stale | The tool's judgment |

The verdict follows these rules, in order:

1. If the gap is action, not knowledge, there is no session. The tool names the action.
2. If it blocks a current goal, learn the blocking slice now.
3. If it is used often, or at review level, learn the reading slice soon, as a step inside
   the topic that needs it.
4. Otherwise, park it in "Next to learn", or skip it.

The verdict is always a slice with a time estimate, never "the whole course". The tool
shows the answers to all five questions, so the learner can see why and disagree. Each
"Next to learn" row records its verdict and the goal it serves.

### Public repository

The repository is `mindeloai-beep/study-loop`, public, MIT-licensed. The README credits
Eero Alvar's video for the method and states that study-loop contains no LearnHarness code
or prompts. The repository is created only after the owner approves this document.

## Calls made during design

The owner heard these and did not object. They are the designer's calls, not the owner's.

### Notes layout

The learner's notes folder is set in settings. Inside it, study-loop keeps this layout:

```
NOTES_DIR/
  Next to learn.md
  TOPIC/
    ideas/IDEA_TITLE.md
    sessions/YYYY-MM-DD TOPIC.md
    diagrams/NAME.svg
```

- `NOTES_DIR`: the folder named in settings, for example a `Learning` folder inside an
  Obsidian vault.
- `TOPIC`: a short folder name per topic, for example `postgres-grants`.
- `IDEA_TITLE`: the claim itself, shortened to a title.

An idea note holds one claim in one or two sentences, links to the claims it rests on, and
practice state. For example:

```markdown
---
type: idea
topic: postgres-grants
next_practice: 2026-10-27
interval_days: 2
sessions: ["[[2026-10-25 postgres-grants]]"]
---
An INSERT that names a column the role has no INSERT privilege on fails with
"permission denied" (SQLSTATE 42501), even if every other column is granted.

Rests on: [[Column privileges are checked per named column]], [[Privilege checks run before row-level security]]
```

Links point from a claim to the claims it rests on. With **Arrows** turned on in
Obsidian's graph view settings, the graph shows the direction of reasoning.

Before writing a new idea note, the tool searches existing notes for the same claim. If it
finds one, it links to that note instead of creating a near-duplicate.

Every `Rests on` link points at a note that exists, so the graph has no unresolved nodes.
Claims get notes in two ways:

- **Taught:** The claim was taught in a session. It enters the practice schedule.
- **Known:** The probe showed the learner already holds the claim, or it is a premise of
  a taught claim. The note sets `known: true` and has no `next_practice` date, so it never
  fills the practice queue. Later probes read known notes to start near the learner's
  edge. If practice shows a known claim is shaky, it becomes a taught claim with a
  practice date.

A session note holds the goal, the time available, what the probe found, the plan, the
confusions that were fixed, and links to the ideas added. It is a summary, not a
transcript.

"Next to learn" is a table with one row per item: the question, the project or goal it
serves, how many times it has come up, the date added, and its verdict from
[What to learn next](#what-to-learn-next).

### Practice timing

The first practice is due one day after an idea is taught. A clean recall doubles
`interval_days`. A struggle resets it to one day. If this feels wrong in use, replace it
with the FSRS algorithm (MIT-licensed) later.

### Getting facts right

The tool verifies specific claims before teaching them: exact behaviour, error codes,
syntax, defaults, numbers, and anything that changed between versions. Long-established
fundamentals, such as what a matrix product is, are taught without a lookup. It verifies
in this order:

1. Prove the claim by running it: SQL in the throwaway database, or a few lines of Python
   in a container. Many beginner machine learning claims are runnable this way, for
   example computing a gradient or fitting a line.
2. Otherwise, check a primary source. For PostgreSQL and Supabase, that is their official
   documentation. For machine learning, that is library documentation (for example,
   scikit-learn or PyTorch) or a widely used open textbook or university course notes. If
   the host tool has subagents, run the check in a subagent on a smaller model to save the
   learner's usage allowance.
3. If neither works, the tool may still teach the claim, but it says out loud that it
   could not verify it, and marks the idea note `verified: false`.

### Hands-on practice mechanics

- **Finding past mistakes.** The tool searches the git history of the configured
  repositories for a migration that a later migration fixed, for example by adding a
  missing `GRANT` or replacing a policy. The learner gets the version before the fix. If
  history has too few, the tool plants one break in a current migration and says that it
  did.
- **Supabase-style migrations.** Most learner repositories are expected to use Supabase,
  whose migrations need the `anon`, `authenticated`, and `service_role` roles, an `auth`
  schema, and `auth.uid()`. The container is the official `postgres` image plus a short
  setup script that creates those roles and that schema, with `auth.uid()` reading the
  user ID from a session setting. The tool loads one migration and the tables it depends
  on, not the whole migration history.
- **Proof.** A missing grant proves itself with the real error (SQLSTATE 42501). An RLS
  hole proves itself by querying as the affected role and user and showing the rows that
  come back but should not.
- **A real hole in current code.** Practice targets past, fixed mistakes. If the learner
  or the tool spots what looks like a live hole in current code, the tool writes it to the
  session note as a finding for the learner to check, and does not fix it.

### Diagrams

For visual topics, such as machine learning, the tool writes SVG files to the topic's
`diagrams` folder and embeds them in idea notes. Obsidian displays them.

### Two skills, not three

During the design conversation, a separate `next` skill was mentioned. It is folded into
`learn` with no topic, because a separate skill would only read one note.

## Repository layout

The repository uses one plugin layout, which installs in both Claude Code and Codex from
one repository:

```
study-loop/
  README.md
  LICENSE
  .claude-plugin/plugin.json
  .claude-plugin/marketplace.json
  .codex-plugin/plugin.json
  .agents/plugins/marketplace.json
  skills/learn/SKILL.md
  skills/practice/SKILL.md
  docs/superpowers/specs/2026-10-25-study-loop-design.md
```

The README documents installation for each host tool. Run these to install:

```
claude plugin install study-loop --marketplace https://github.com/mindeloai-beep/study-loop.git
codex plugin marketplace add https://github.com/mindeloai-beep/study-loop.git
codex plugin add study-loop@study-loop
```

## Left to the builder

- The wording of every stage's instructions.
- The probe's stopping rule and the maximum number of probe questions.
- Where the settings file lives and its format. It holds the notes folder and the list of
  project repositories used for practice material.
- How the two skills share the notes format and teaching rules. Both need them, and a
  relative path between skill folders might not resolve in every host tool.
- The PostgreSQL image and version for practice, pinned to an exact tag, and the container
  naming and cleanup.
- Whether Codex has a multiple-choice question tool, and the exact Codex skill syntax.
  Check both against Codex itself and record the result in the README.
- Whether Codex supports other API providers through its own settings. If it is not
  tested, the README says it is untested.

## Definition of done

Verification runs in two stages:

- **Builder testing:** The builder runs every skill end to end against a scratch notes
  folder, never the owner's vault, and fixes what fails.
- **Owner acceptance:** The owner, at the keyboard, runs their real first PostgreSQL
  session in Claude Code, saved into their real Obsidian vault. The next day, their first
  real `practice` session runs in Codex, also in the vault. The builder prepares both
  sessions and stays available, but the owner drives them.

The first version is done when all of these are verified, with evidence:

- The plugin installs with the documented commands in Claude Code and in Codex, and a new
  session lists both skills.
- A full `learn` session on PostgreSQL grants in Claude Code uses the picker and produces
  idea notes whose links show as a connected graph in Obsidian.
- A `practice` session loads a real migration into a throwaway container, gives a hint
  without the answer, updates next practice dates, and removes the container.
- `learn` with no topic suggests an item from "Next to learn".
- The `learn` flow works in Codex, with Codex's picker or the numbered fallback.
- The knowledge-or-action check answers "mostly action" for a goal like "get better at
  sales".
- A search of the repository finds no personal paths, client names, or secrets.
