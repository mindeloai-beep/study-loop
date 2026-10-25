# Rating what to learn

Read this file before you rate a topic, a course, a video, a book, or the rows of `Next to learn.md`.

## Find the goal

A topic with no goal cannot be rated. The goal is what the learner would do with the topic. If the learner's message already says what they do with it, such as "I review Python that agents write", treat that as the goal and rate without asking. Ask what they would do with it only when the message gives no use. For a row of `Next to learn.md`, the Serves cell is the goal, so ask only when that cell is empty.

## Choose rows when there is no topic

Read `Next to learn.md`. If the table has no rows, say so in one line and ask what the learner wants to learn. Otherwise, rate up to three rows, chosen in this order:

1. Rows that block a current goal.
2. Rows with the highest Times raised.
3. The oldest rows by Added.

Recommend one row for today's session. Show the five answers and the card for that row, and one line with the verdict for each other row you rated.

## The five questions

Answer each question from the evidence it names:

| Question | What it checks | Evidence |
|---|---|---|
| Does it block something? | A current goal cannot progress without it | The learner's goals, "Next to learn", and current session plans |
| How often will the learner use it? | How often it appears in real work | The configured repositories (files and commits by language or tool, last 90 days) and how often it came up as a tangent |
| Does the learner write it or review it? | If agents write it, the learner needs reading-level knowledge only | The learner's answer |
| How much does the learner already know? | Overlap with existing idea notes, including concepts that transfer from another language or tool | Idea notes and a short probe |
| Will it still be true in a year? | Concepts last. Setup steps, menus, and shortcuts go stale | Your judgment |

Gather the evidence from these places:

- **Goals and plans:** the Serves column of `Next to learn.md`, and the Plan section of the newest session notes.
- **Repositories:** for each path in `practice_repos`, count files by extension with Glob. If you can run git, count the last 90 days of commits with `git -C "REPO_PATH" log --since=90.days --name-only --format=`. With no repositories configured, say so.
- **Tangents:** the Times raised column.
- **Known ideas:** the idea notes on the topic, plus concepts the learner holds in another language or tool.

When evidence is missing, answer from what you have, name what is missing, and mark the answer as a guess. Do not stop to ask, except for the goal. Offer a short probe after the card only when its answer could change the verdict.

## Verdict rules

Apply these rules in order, and stop at the first one that fits:

1. If the gap is action, not knowledge, there is no session. Name the action. The verdict is `skip`.
2. If it blocks a current goal, learn the blocking slice now. The verdict is `now`.
3. If it is used often, or at review level, learn the reading slice soon, as a step inside the topic that needs it. The verdict is `partial`.
4. Otherwise, park it in "Next to learn" (`park`), or skip it (`skip`).

The verdict is always a slice with a time estimate, never the whole course, video, or book. The one exception is an action gap: its verdict names the action instead of a slice. Size the slice in sessions of 30, 60, or 90 minutes. Put everything outside the slice on the Skip line: setup steps, menus, and shortcuts, and basics the learner already holds or can transfer from a language or tool they know.

## The card

Save the verdict first, as the next section says. Then write one final message: the five questions with a one-line answer each, then the card. For `now`, the offer to start the learn session follows the card in that message. Print the card exactly in this form, inside a `text` code block:

```text
Topic:     NAME (TYPE, LENGTH)
Serves:    GOALS OR PROJECTS
Blocks:    WHAT IT BLOCKS, OR "nothing now"
Verdict:   now | partial | park | skip - SLICE NAME, about N min, WHERE IT GOES
Skip:      PARTS TO SKIP
Saved to:  Next to learn (or "not saved")
```

Fill in the card with these rules:

- Replace each uppercase placeholder. Keep the labels and their spacing.
- `TYPE` is topic, course, video, or book. `LENGTH` is its length, or `unknown`.
- Where a line offers a choice, keep one option: one verdict word, `nothing now` or what it blocks, and `Next to learn` or `not saved`.

After the card, invite the learner in one line to correct any answer.

## Save the verdict

Save without asking, and say where you saved it:

- `now`, `partial`, or `park`: add a row to `Next to learn.md`, or update the row you rated. Set the Verdict cell to the card's Verdict text and the Serves cell to the goal. For `now`, the offer to start the learn session on the slice closes the final message, after the card.
- `skip`: save nothing for a new topic. For a row you rated, set its Verdict cell to the skip verdict.
