# Writes test settings and a "Next to learn" note with one existing row in the run's working directory.
set -e
mkdir -p .study-loop notes
printf '%s\n' '{"notes_dir": "./notes", "practice_repos": []}' > .study-loop/settings.json
printf '%s\n' '| Question | Serves | Times raised | Added | Verdict |' '|---|---|---|---|---|' '| How do Postgres indexes speed up a query? | reading slow query plans | 2 | 2026-01-05 | not rated |' > "notes/Next to learn.md"
