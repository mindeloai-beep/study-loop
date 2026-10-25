# Host commands

This file records the commands that load study-loop, refresh it after an edit, and drive a scripted session in Claude Code and Codex. Each command was run against Claude Code 2.1.310 and codex-cli 0.163.0.

Placeholders used in this file:

- `REPO`: the absolute path of this repository.
- `SCRATCH`: an empty folder outside the repository, used as the working directory for driven sessions.
- `SESSION_ID`: the session ID that a Claude Code run returns.
- `MESSAGE`: the learner's next message.

## Run the unit tests

Run the tests from `REPO`:

```bash
node --test
```

On Node 24, `node --test tests/` fails with a module-not-found error because the runner treats `tests/` as a file. Run `node --test` with no path instead.

## Claude Code

Load the plugin from `REPO` for one run. Run the command in `SCRATCH`:

```bash
claude --plugin-dir "REPO" -p -- "List the skills you can use whose names start with study-loop. Names only."
```

The output lists `study-loop:learn` and `study-loop:practice`.

Pick up an edited skill by starting a new `claude` process. The `--plugin-dir` flag reads the folder at launch, so an edit to a `SKILL.md` file shows up in the next run without a reinstall. A running session does not reload the file.

Start a driven session. Run the command in `SCRATCH`:

```bash
claude --plugin-dir "REPO" -p --output-format json --allowedTools "Read Write Edit Glob Grep Skill Bash(docker:*) Bash(git:*)" -- "MESSAGE"
```

The JSON output has a `session_id` field and a `result` field.

Continue the session:

```bash
claude --plugin-dir "REPO" -p --output-format json --allowedTools "Read Write Edit Glob Grep Skill Bash(docker:*) Bash(git:*)" --resume SESSION_ID -- "MESSAGE"
```

**Caution:** `--allowedTools` accepts many values. Without the `--` separator before `MESSAGE`, the flag consumes the message and the run fails with "Input must be provided either through stdin or as a prompt argument". The resume run keeps the same `session_id`.

## Codex

Install the plugin from `REPO`:

```bash
codex plugin marketplace add "REPO"
codex plugin add study-loop@study-loop
```

Confirm the install, and check that Codex sees both skills. Run the second command in `SCRATCH`:

```bash
codex plugin list
codex exec --skip-git-repo-check -C "SCRATCH" "List the skills you can use whose names start with study-loop. Names only."
```

The list shows `study-loop@study-loop` as installed and enabled. The `codex exec` output names `study-loop:learn` and `study-loop:practice`.

Codex runs skills from a cached copy of the plugin. Pick up an edited skill by running the add command again:

```bash
codex plugin add study-loop@study-loop
```

The command copies the current files into the cache without a version bump. The `codex plugin marketplace upgrade` command does not work here, because it only refreshes Git marketplaces and returns "is not configured as a Git marketplace" for a local one.

Start a driven session. Run the command from any folder:

```bash
codex exec --skip-git-repo-check -C "SCRATCH" --sandbox danger-full-access "MESSAGE"
```

Continue the most recent session. Run the command with `SCRATCH` as the working directory:

```bash
codex exec resume --last --skip-git-repo-check "MESSAGE"
```

**Note:** The `codex exec resume` subcommand has no `-C` flag and no `--sandbox` flag. It finds the last session for the current working directory, so change into `SCRATCH` first. The resumed run answered a question about the first message, which confirms it continues the same session.

Use `--sandbox danger-full-access` only in `SCRATCH`, because hands-on practice needs the Docker socket.
