# study-loop

## What it is

study-loop is a plugin of two agent skills, `learn` and `practice`, that turns Claude Code or Codex into a personal tutor. It finds where your understanding stops, plans the shortest path to your goal, and teaches one reasoning step at a time. On later days, it runs practice sessions on what you learned.

What you learn is saved as linked markdown notes, one claim per note. Obsidian can draw the links as a graph.

study-loop runs inside the tool you already use. It has no app, no server, and no code that calls a model API.

## Requirements

Install these before you start:

- Claude Code or Codex, signed in.
- Obsidian (optional). Without it, your notes are plain markdown files. With it, you get the graph view.
- Docker (optional). Hands-on practice for database topics needs it. Without Docker, practice uses reading questions only.

Node is a development dependency only. You need it to run the repository's tests, not to use the plugin.

## Install

### Claude Code

Add the marketplace, then install the plugin:

```bash
claude plugin marketplace add mindeloai-beep/study-loop
claude plugin install study-loop@study-loop
```

Start a new Claude Code session. The skills `study-loop:learn` and `study-loop:practice` appear in the session.

### Codex

Add the marketplace, then install the plugin:

```bash
codex plugin marketplace add mindeloai-beep/study-loop
codex plugin add study-loop@study-loop
```

Start a new Codex session. The skills `study-loop:learn` and `study-loop:practice` appear in the session.

## Commands

The two skills take an optional topic. Use the form for your tool:

| Skill | Claude Code | Codex | With a topic | Without a topic |
|---|---|---|---|---|
| `learn` | `/study-loop:learn [topic]` | `$study-loop:learn [topic]` | Runs a teaching session on the topic | Suggests the next item from your "Next to learn" note |
| `practice` | `/study-loop:practice [topic]` | `$study-loop:practice [topic]` | Practices the ideas you saved for the topic | Picks the ideas whose practice date has passed |

Replace `[topic]` with the subject, for example `postgres grants`. In Codex, start the message with the `$` form. The `/` form does not work there.

## Who pays

Your host tool's login sets the billing. study-loop never handles a login or a key, so it adds no cost of its own:

| You sign in to the host tool with | You pay |
|---|---|
| A Claude subscription (Claude Code) | Your Claude subscription, within its usage limits |
| A ChatGPT subscription (Codex) | Your ChatGPT subscription, within its usage limits |
| An API key (either tool) | Per-use API pricing, set by the provider |

Codex can use other model providers, which you configure in Codex's own settings. study-loop is untested with them.

## First run

The first time you run either skill, it finds no settings file and asks you two questions:

1. Where to keep your notes. This is a folder, for example a `Learning` folder inside an Obsidian vault.
2. Which project repositories to use as practice material. This answer is optional.

The skill creates the notes folder and a `Next to learn.md` note, then writes your answers to the settings file. What happens next depends on the skill. `learn` continues with your request and starts with its first question about your goal. `practice` has nothing to practice until a `learn` session saves ideas, so on a first run it says that no idea is due and stops. On later runs, the skill reads the settings file and skips these questions.

## Where your notes go

The skills write the settings file at `~/.study-loop/settings.json`. A file at `./.study-loop/settings.json` in the current folder overrides it. The file holds this:

```json
{"notes_dir": "NOTES_DIR", "practice_repos": ["REPO_PATH"]}
```

Replace these placeholders:

- `NOTES_DIR`: the absolute path of your notes folder.
- `REPO_PATH`: the path of a project repository to mine for practice material. The list can be empty.

Inside `NOTES_DIR`, study-loop keeps this layout:

```text
NOTES_DIR/
  Next to learn.md
  TOPIC/
    ideas/IDEA_TITLE.md
    sessions/SESSION_NAME.md
    diagrams/NAME.svg
```

In this layout, the names mean:

- `TOPIC`: a short folder name for each topic, for example `postgres-grants`.
- `IDEA_TITLE`: the claim itself, shortened to a title. Each idea note holds one claim and links to the claims it rests on.
- `SESSION_NAME`: the date and topic of a session.

In Obsidian, turn on **Arrows** in the graph view settings to see the direction of reasoning. The skills never write into this repository. Your notes, settings, and practice material stay on your machine.

## Hands-on practice and Docker

For database topics, `practice` can use your own past mistakes as material. It searches the git history of your practice repositories for a migration that a later migration fixed, and gives you the version from before the fix. It starts a throwaway PostgreSQL container, loads the migration, and asks you to find the hole. Running the SQL then proves your answer.

Hands-on practice follows these rules:

- It creates and removes only the container named `study-loop-practice`, from the image `postgres:17.11-alpine`.
- It publishes no ports and removes the container at the end of the session.
- It never connects to your own databases. It never reads connection strings, `.env` files, or any host or URL outside the container.

If Docker is not installed, practice uses reading questions only.

**Note:** In Claude Code, a `Bash(docker:*)` permission rule lets the practice commands run without a prompt per command. In Codex, hands-on practice needs a sandbox mode that can reach the Docker socket.

## The Codex picker result

Both skills ask multiple-choice questions. They check at run time whether the host tool has a question tool, and use it if it does. Otherwise they show numbered options as text.

Codex 0.163.0 has a multiple-choice question tool named `request_user_input`. In every scripted Codex session that was tested, the agent showed numbered options in its message and did not call the tool. In Codex, reply with the number and your thinking in one message, for example: "2, because I think column grants only cover reads."

In Claude Code, you pick from the picker, then type your thinking as the next message.

## Credits

The method comes from Eero Alvar's video [Agent Harness for Learning Things](https://www.youtube.com/watch?v=nfTDljFG2g0). study-loop contains no LearnHarness code or prompts. It is a separate, clean-room implementation of the ideas the video describes.

## Licence

MIT. See [LICENSE](LICENSE).
