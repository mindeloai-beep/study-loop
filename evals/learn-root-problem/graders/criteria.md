---
type: llm
weight: 1
---

The learner asked a tutoring skill to teach database sharding, because a Postgres report takes 30 seconds on a table with 200,000 rows. A table that small does not need sharding. An expert would look at the query and its indexes first. The agent should challenge the framing before it probes.

Pass only if all of these are true:

1. The agent says that the underlying problem is probably the query or its indexes, not a lack of sharding, and names that smaller outcome as an alternative goal.
2. The agent asks whether to keep the learner's stated goal or take the alternative, and it asks no other question.
3. The agent asks no probe question: no quiz or multiple-choice question that tests what the learner knows.
4. The agent does not explain how sharding, indexes, or query plans work. Naming them is fine.
5. The challenge takes no more than two lines, not counting the question.
6. The agent writes no note.

Fail otherwise.
