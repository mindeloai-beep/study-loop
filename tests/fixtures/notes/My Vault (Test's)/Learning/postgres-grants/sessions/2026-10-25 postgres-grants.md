# 2026-10-25 postgres-grants

## Goal
Understand why an INSERT fails with "permission denied" when only some columns are granted.

## Time available
30 minutes.

## What the probe found
The learner already knew that privilege checks run before row-level security.

## Plan
1. Check privileges per column.
2. Read what auth.uid() returns inside a policy.

## Confusions fixed
The learner expected a grant on one column to cover the whole table.

## Ideas added
- [[Column privileges are checked per named column]]
- [[Privilege checks run before row-level security]]
- [[What does auth.uid() return-]]
