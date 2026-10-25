---
type: idea
topic: postgres-grants
next_practice: 2026-10-26
interval_days: 1
sessions: ["[[2026-10-25 postgres-grants]]"]
---
An INSERT that names a column the role has no INSERT privilege on fails with "permission denied" (SQLSTATE 42501), even if every other column is granted.

Rests on: [[Privilege checks run before row-level security]]
