---
type: idea
topic: postgres-grants
next_practice: 2026-10-26
interval_days: 1
sessions: ["[[2026-10-25 postgres-grants]]"]
---
In Supabase, auth.uid() returns the user id from the request's JWT claims as a uuid, and returns null when the request carries no JWT.

Rests on: [[Privilege checks run before row-level security]]
