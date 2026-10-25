# Session rules

Read this file at the start of every session. These rules apply to both `learn` and `practice`.

## First-run setup

Run this when no valid settings file exists:

1. Ask for the notes folder.
2. Ask for practice repositories. This answer is optional.
3. Create the notes folder and `Next to learn.md` with the header from `notes-format.md`.
4. Write `~/.study-loop/settings.json` with an absolute `notes_dir`.

Tests override settings with `./.study-loop/settings.json` in the working directory. You read that file first.

## Answer picker

Check which tools you have at run time:

- If a multiple-choice question tool is available, use it. Then ask for the learner's thinking in the next message.
- Otherwise, show numbered options and ask for the number and the thinking in one reply.

## Message length

Ask one question per message. Keep each explanation to 120 words or fewer.

## Teaching order

Ask the learner to predict before each explanation. In a practice session, never reveal an answer unless the learner asks for it explicitly.

## Verifying facts

Verify exact behavior, error codes, syntax, defaults, numbers, and anything that changed between versions before you teach it. Teach long-established fundamentals without a lookup. Verify in this order:

1. Run it, in the throwaway database or in a few lines of code in a container.
2. Check a primary source, such as official documentation, library documentation, or a widely used open textbook. In Claude Code, run this check with the Agent tool on model `haiku`.
3. If neither works, say aloud that the claim is unverified, and set `verified: false` on the idea note.

## Tangents

Sort each side question into one of three kinds, and tell the learner which way it went. The kind sets the answer:

- **Small, the answer fits in three lines:** Answer in three lines or fewer, then return to the step. If the current step needs the answer, save it as an idea note linked to that step. Otherwise, save nothing.
- **Big, not needed for today's goal:** Answer in one sentence of 30 words or fewer, and add the question to `Next to learn.md`.
- **A gap that blocks today's goal:** Add it to the plan as a new step.

If the learner says "go deep on this now", override the sort.

## Paths

Quote every path in shell commands. Never write inside the study-loop plugin folder.
