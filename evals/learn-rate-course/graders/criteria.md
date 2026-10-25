---
type: llm
weight: 1
---

The learner asked a tutoring skill whether a 6-hour "Python for AI" course is worth their time. They said they review Python that agents write, and their main products are TypeScript.

Pass only if all of these are true:

1. The agent shows five questions, each with a short answer: whether the topic blocks something, how often the learner will use it, whether the learner writes it or reviews it, how much the learner already knows, and whether it will still be true in a year.
2. The five questions and their answers appear above the card, not below it.
3. The agent prints a card with the lines Topic, Serves, Blocks, Verdict, Skip, and Saved to.
4. The Verdict line is `partial` and names a slice of the course with a time estimate, not the whole course.
5. The Skip line names at least two of these setup chapters: installing Python, VS Code setup and themes, and workspaces. An equivalent grouping, such as "editor and environment setup", counts as naming them.
6. The agent rates the course without first asking what the learner will do with it.

Fail otherwise.
