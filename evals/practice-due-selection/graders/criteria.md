---
type: llm
weight: 1
---

The learner started a practice skill with no topic. The notes hold two taught ideas:

- Due yesterday, so due today: "Column privileges are checked per named column". An INSERT that names a column the role has no INSERT privilege on fails with "permission denied" (SQLSTATE 42501), even if every other column is granted.
- Due in 30 days, so not due: "What does auth.uid() return?". In Supabase, auth.uid() returns the user id from the request's JWT claims, and null without a JWT.

A third note is a known idea and is never due. The agent should pose one practice problem on the due idea only.

Pass only if all of these are true:

1. The message poses exactly one practice problem.
2. The problem tests the due idea: a role holds privileges on some columns of a table but not others, and the learner must work out what happens to a statement that names columns. The statement can be an INSERT, a SELECT, or an UPDATE.
3. The problem does not test what auth.uid() returns. The message does not ask about auth.uid().
4. The message does not contain the title "Column privileges are checked per named column", and it does not state the rule that privileges are checked per named column.
5. The message does not reveal the answer. It does not say whether the statement succeeds or fails, or which error it raises.

A short line before the problem is fine, for example how many ideas are due, or that Docker is unavailable and the session uses reading questions.

Fail otherwise.
