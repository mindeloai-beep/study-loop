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

**Note:** Under this `--allowedTools` string, Claude Code runs a Bash command only when every part of it matches a granted prefix, so a `docker` command chained to `for`, `cat`, or `echo` is denied. It also denies input redirection (`<`) from a file outside `SCRATCH`, and every PowerShell form of the practice kit that was tried. The Bash forms in `practice-db.md`, and a `git show` piped into `docker exec -i`, pass.

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

Start a driven session. The `-C` flag sets the working folder for `codex exec`, so you can run the command from any folder:

```bash
codex exec --skip-git-repo-check -C "SCRATCH" --sandbox danger-full-access "MESSAGE"
```

Continue the most recent session. The `codex exec resume` command has no `-C` flag, so run it from `SCRATCH`. Set the sandbox mode again with `-c`:

```bash
codex exec resume --last --skip-git-repo-check -c sandbox_mode='"danger-full-access"' "MESSAGE"
```

**Important:** A resumed Codex run does not keep the sandbox mode of the first run. Without the `-c` setting, the resumed run reported `read-only` and `docker info` failed with a permission error on the Docker pipe. With the setting, the resumed run reported `danger-full-access` and `docker info --format "{{.ServerVersion}}"` returned the server version. Pass the `-c` setting on every resume.

**Note:** The `codex exec resume` command has no `--sandbox` flag, which is why the `-c` setting is required. The `--last` option picks the newest recorded session, and `codex exec resume --help` states that `--all` turns off filtering by working folder. This behavior implies that `--last` filters by the current folder. The test runs did not try a second folder to confirm it. The resumed run kept the same session ID as the first run.

Use `danger-full-access` only in `SCRATCH`, because hands-on practice needs the Docker socket.

### Codex session ID and standard input

Resume a session by its ID instead of `--last`, so another session in the same folder cannot be picked. The first run prints `session id: SESSION_ID` in its output header. Run the command from any folder:

```bash
codex exec resume SESSION_ID --skip-git-repo-check -c sandbox_mode='"danger-full-access"' -o OUTPUT_FILE "MESSAGE" < /dev/null
```

Replace these placeholders:

- `SESSION_ID`: the session ID from the first run's output header.
- `OUTPUT_FILE`: a file path for the agent's last message. The `-o` flag (`--output-last-message`) writes only that message to the file.

In the 15-turn learn session (turns 2 to 15 resumed by session ID), this form kept one session and reported `danger-full-access` on every turn.

**Caution:** When `codex exec` runs from a script or from Git Bash without a terminal, it prints "Reading additional input from stdin..." and waits. Append `< /dev/null` to every `codex exec` command, first run and resume, so the run does not hang.

### Invoke a skill in Codex

Start a skill with `$study-loop:learn` or `$study-loop:practice` at the start of the message, for example `$study-loop:learn postgres grants`. Codex loaded the skill from the plugin cache on every such message. The Claude Code form `/study-loop:learn` is not used in Codex.

### Codex tools and the shell

The prompt "List the names of every tool you can call, one per line, and mark any that shows the user multiple-choice options." produced a list that includes `request_user_input`, which the agent marked as the multiple-choice tool. The list also names `exec_command`, `apply_patch`, `collaboration.*` agent tools, and many connector tools from the host's configuration.

The Codex repository agrees with this. The tool is `request_user_input`, and it asks the user one to three questions. The tool was first limited to Plan mode, and a change allows it in Default mode as well, behind the feature `default_mode_request_user_input`. Sources: `https://github.com/openai/codex/pull/12706` for the tool name, the two modes, and the feature, and `https://github.com/openai/codex/pull/9472` for the one-to-three question limit.

In every driven `codex exec` session, the agent showed numbered options in its message and never called `request_user_input`. The session rules already cover this: they say to use a question tool when one is available and to show numbered options otherwise.

On Windows, Codex ran every command through Windows PowerShell 5.1 (`powershell.exe`). In the practice session, it used the PowerShell forms from `practice-db.md`: the readiness loop, the stub load with `Get-Content`, and a here-string piped to `docker exec -i`. It read file text from an older commit with `git show` and a here-string. Docker worked under `danger-full-access` in both the first run and every resumed run.

### Codex results

Codex 0.163.0, run on 2026-10-25 in fresh scratch folders:

| Session | Result |
|---|---|
| First-run setup | The agent asked only for the notes folder, then wrote `settings.json` with an absolute `notes_dir`, and created `Next to learn.md` with the exact header. The setup creates `~/.study-loop/`, so remove it after this session. |
| Learn session | All nine Task 4 criteria passed with the same persona, including the small tangent (answered, no idea note) and the big tangent (one sentence and a "Next to learn" row). |
| Practice, due ideas, stuck learner | Problems covered due ideas only. Two hints, then a choice between another hint and the answer, then the answer after "show me the answer". |
| Practice, hands-on | The agent found the fix commit, loaded the earlier migrations in order, showed another user's row, and reported a live hole as a finding. The container was gone afterwards. |
