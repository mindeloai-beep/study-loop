---
type: llm
weight: 1
---

The learner asked a tutoring skill to teach postgres grants and row-level security (RLS), gave a goal (read a migration and spot missing grants or RLS holes), and gave 30 minutes. The agent should now probe what the learner already knows.

Pass only if all of these are true:

1. The agent asks exactly one question, and it is multiple-choice: a picker call, or numbered options in the text. A request for the chosen number together with the learner's thinking counts as part of that one question.
2. The agent asks for the learner's thinking or reasoning, not only the chosen option.
3. The agent explains nothing about the topic before the question. It does not teach how grants, privileges, or RLS work. A one-line note about the goal, the knowledge-or-action verdict, or the session size is fine.

Fail otherwise.
