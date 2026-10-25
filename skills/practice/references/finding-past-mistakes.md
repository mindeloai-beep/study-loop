# Finding past mistakes

Use this file to find hands-on practice material in the learner's own repositories: a migration as it was before a later migration fixed it.

## Rules

Follow these rules in every repository:

- Read only `supabase/migrations/**`, or another folder named `migrations/`, in each path in `practice_repos`. Never read `.env` files or any file that holds a connection string.
- Never edit the learner's repository. Do not write, commit, check out, stash, or reset anything in it. Read its history only with `git log` and `git show`.
- Load migration text only into the `study-loop-practice` container, as `practice-db.md` says.

## Find a fixed mistake

Run these steps:

1. For each path in `practice_repos`, find the migrations folder: `supabase/migrations/`, or else another folder named `migrations/`. Skip a repository that has neither.
2. List the commits that changed a grant, a policy, or row-level security (RLS):

   ```bash
   git -C "REPO_PATH" log --date=short --format="%H %ad %s" -G "grant|GRANT|revoke|REVOKE|policy|POLICY|row level security|ROW LEVEL SECURITY" -- "MIGRATIONS_DIR"
   ```

   Replace these placeholders:

   - `REPO_PATH`: a path from `practice_repos`.
   - `MIGRATIONS_DIR`: the migrations folder inside it.

3. Pick a fix from the list: a commit that adds a missing grant, narrows a policy, or turns on RLS for something an earlier migration created. Read its diff with `git -C "REPO_PATH" show "COMMIT" -- "MIGRATIONS_DIR"`.
4. The past mistake is the migration a later fix changed: the file the fix edits, or the earlier migration that created the grant, policy, or table that the fix corrects.
5. Take every file as it was at the fix's parent commit, `COMMIT^`, so the learner gets the version before the fix.

## Load the mistake

Load the migrations that create the tables the mistake references first, in filename order, then the mistake. Use a fresh container with the stub loaded, and pipe each file from git:

```bash
git -C "REPO_PATH" show "COMMIT^:FILE_PATH" | docker exec -i study-loop-practice psql -U postgres -v ON_ERROR_STOP=1 -v VERBOSITY=verbose
```

Replace these placeholders:

- `COMMIT`: the fix commit.
- `FILE_PATH`: the migration's path from the repository root, with forward slashes.

In PowerShell, print the file with `git -C "REPO_PATH" show "COMMIT^:FILE_PATH"`, then send its text in a here-string, as the PowerShell query form in `practice-db.md` does.

If a load fails on a missing object, find the migration that creates that object, add it to the list in filename order, and load the list again in a fresh container: run the stop sequence, the start sequence, and the stub load. Retry at most 3 times. If the load still fails, plant a change instead.

## Plant a change

If no past mistake is found, plant one change in a current migration, and tell the learner that you planted it. Make one of these changes:

- Remove a column from a `grant` list.
- Change a policy to `using (true)`.
- Drop the `enable row level security` line.

Make the change only in the text you load into the container, with the heredoc form in `practice-db.md`. Never edit the file. Load the migrations it depends on first, as the previous section says.

If no path in `practice_repos` has a migrations folder, write a short migration of your own with one of these holes, and tell the learner that you wrote it.

## Live holes

A live hole is a hole in the current migrations that no later migration fixed. Check each repository once per session with two searches of its migrations folder: one for `create table`, and one for `enable row level security`. A `public` table with no matching `enable row level security` line has RLS turned off. Also note a policy `using (true)` that no later migration replaced.

A live hole goes into the practice session note's `Findings` section, for the learner to check. Never fix it, and never edit the learner's repository.
