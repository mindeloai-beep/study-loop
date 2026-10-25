# Writes test settings and an empty "Next to learn" note in the run's working directory.
set -e
mkdir -p .study-loop notes
printf '%s\n' '{"notes_dir": "./notes", "practice_repos": []}' > .study-loop/settings.json
printf '%s\n' '| Question | Serves | Times raised | Added | Verdict |' '|---|---|---|---|---|' > "notes/Next to learn.md"
