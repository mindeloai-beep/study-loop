---
type: llm
weight: 1
---

The learner is busy with other work and used a tutoring skill to save a topic for later: how Postgres connection pooling works, for keeping a small app from running out of connections. `notes/Next to learn.md` already holds one row about Postgres indexes. The agent should save the topic and stop.

Pass only if all of these are true:

1. The agent writes a new row to `notes/Next to learn.md` whose Question is about connection pooling, whose Serves is about the small app running out of connections, whose Times raised is 1, whose Added is a date in `YYYY-MM-DD` form, and whose Verdict is `not rated`.
2. The row about Postgres indexes stays unchanged.
3. The agent's final message confirms the save in one line.
4. The agent asks the learner no question and makes no offer. It does not ask about time or goals, and it does not offer a session.
5. The agent teaches nothing about connection pooling, and it does not rate the topic or show a rating card.
6. The agent writes no other note.

Fail otherwise.
