# Agent coordination — prior art and our patterns

Synthesis of 2024–2025 writing on multi-agent software-development coordination, and how our planning vault relates to the emerging conventions. Compiled 2026-05-21 from web research on patterns adopted by Anthropic, OpenAI, the Linux Foundation, and the agent-tooling community.

This is a reference doc — descriptive of the field, not a binding protocol. The binding protocols are [[design-system]] and the [[conventions|Onboarding/conventions]] file.

## What our vault is

A shared markdown coordination layer for multiple AI coding agents working in parallel across sibling git repos, with a single human as PM/reviewer. Filesystem-only contract (no APIs). Obsidian-rendered for the human; plain-markdown-readable for any agent or web viewer.

## What's standard practice (2024–2025)

### Three-altitude artifact layering

Mainstream engineering shops use three distinct artifacts that look superficially redundant but operate at different altitudes:

- **Durable** — design proposals / RFCs / ADRs. The "why" of architectural decisions, with a lifecycle (proposed → accepted → superseded). Used at Airbnb, Spotify, Rust, Meta, and many open-source projects. Once accepted, ADRs are immutable; supersede rather than edit.
- **Flow** — Kanban board with WIP limits. Tracks current work-stream state with one card = one identifiable unit of work, owned by one entity. The discipline comes from limiting WIP, not from the file format. (Per [Workamajig's Kanban-vs-task-board](https://www.workamajig.com/blog/kanban-methodology-guide/kanban-vs-test-board): *"True Kanban is defined not by the software used but by adherence to its six core practices: visualize work, limit WIP, manage flow, make process policies explicit, implement feedback loops, and improve collaboratively."*)
- **Detail** — task checkboxes inside a Kanban card or inside a design's `## Open questions`. Execution-level items, often ephemeral.

Shape Up (Basecamp) is an outlier: no backlogs, no sprints, no tasks. Not applicable to our agent-swarm setup. Scrum and traditional Kanban both retain task-level detail inside their flow units.

The single most-cited failure mode in 2025 writing: **letting the same fact live in two altitudes and drift.** Pick one canonical location per fact; reference, don't duplicate.

### Shared markdown file as the coordination substrate

Multiple 2024–2025 writeups converge on the same pattern for multi-agent coordination: a shared markdown file (or files) in a git repo, where agents read and write state. From [Fastio on Claude Flow](https://fast.io/resources/claude-cowork-multi-agent-orchestration/): *"Agents don't talk to each other directly; instead, they read and write to a shared file on disk, making the file itself the communication layer."*

[MindStudio's writeup on Claude Code's shared task list](https://www.mindstudio.ai/blog/claude-code-agent-teams-shared-task-list) names the three ingredients:

1. **Status flags that lock work claims** — once an agent claims a task, others see it's taken.
2. **Git worktrees for write isolation** — agents work in separate branches/directories, no edit collisions on code.
3. **Dependency markers** — explicit "blocked-on" relationships so work that can't parallel sequences correctly.

Our vault implements all three: name-first drafts with status flags, `/efs/<repo>/.worktrees/<slug>` convention, `#blocked-on/<thing>` and `#depends-on/<thing>` tags.

### AGENTS.md as the universal agent brief

Released by OpenAI in August 2025, AGENTS.md has been [adopted by 60,000+ projects](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) as the universal filename for agent onboarding. Codex CLI, Cursor, Devin, Copilot, Claude Code, and others all auto-detect it. The Linux Foundation's Agentic AI Foundation is consolidating this as a standard.

Our vault adopted this convention (`AGENTS.md` at root) for parity. The canonical docs stay in `README.md` and `Onboarding/`; `AGENTS.md` is a brief entry point with hard rules and a where-to-find-things table.

### WIP limits on human-review columns

[MindStudio's "Iterative Kanban" pattern](https://www.mindstudio.ai/blog/iterative-kanban-pattern-ai-agents-feedback-loop) for AI agents identifies a specific failure mode: *"Teams often add WIP limits to agent-side columns but forget to limit the human review columns, even though human attention is also a constrained resource."*

With one human and N parallel agents, the review queue is structurally the bottleneck. Limiting WIP there is the only way to make the bottleneck visible without bottlenecking the agents producing work.

Our convention: 3 in `#status/ready-for-promotion`, 5 in `Under Review`, 2 In Flight per agent. Agent-honored, not mechanically enforced.

### Orchestrator/subagent contract (Anthropic)

[Anthropic's multi-agent research-system writeup](https://www.anthropic.com/engineering/multi-agent-research-system) names what an orchestrator must give a dispatched subagent: *"an objective, an output format, guidance on which tools and sources to use, and clear task boundaries. Miss any of the four and the subagent drifts."*

Applies most directly to within-session subagent dispatch (which we do regularly in this conversation). The same four-element contract is implicit in our design protocol: every design has Problem (objective), template structure (output format), Target repos (tool guidance), and Implementation notes (boundaries).

## Prior-art systems worth knowing about

- **[TICK.md](https://www.tick.md/)** — single-file multi-agent coordination via git. Atomic claims via file locks, status flags, dependency markers. Smaller scale than us (one file) but the discipline is similar.
- **[ccswarm](https://github.com/nwiizo/ccswarm)** — orchestrator over Claude Code with worktree isolation and a message bus. More heavyweight than we need.
- **GNAP (Git-Native Agent Protocol)** — coordinates AI agents via 4 JSON files in a git repo. No server.
- **MULTI_AGENT_PLAN.md / STATUS.md / tasks.json patterns** — emerging in the Claude Code community.
- **Obsidian-vault-as-AI-memory** — [Jason-Cyr/ai-agent-workflow](https://github.com/Jason-Cyr/ai-agent-workflow) (Obsidian + Linear), [Ar9av/obsidian-wiki](https://github.com/Ar9av/obsidian-wiki) (agents maintaining an Obsidian wiki). Closest in shape to our vault.

We are at the leading edge of this pattern, not blazing it alone. The combination *Obsidian Kanban + Tasks plugin + ADR lifecycle + agent-writable git repo* doesn't have a widely-cited prior writeup, but each element has independent precedent.

## What we deliberately diverge from

- **No central orchestrator.** Our agents pull work from Kanban via decision tree; no controlling orchestrator dispatches them. Simpler, more agent-tool-agnostic, fits our scale.
- **No JSON or YAML status files separate from the human-readable doc.** Some systems (ccswarm, GNAP) maintain machine-readable state in separate files. We keep one source of truth per fact (the design file, the Kanban card) and let agents parse it.
- **No mechanical enforcement.** We don't have CI hooks enforcing tri-sync or pre-commit hooks rejecting self-numbered drafts. Convention-only for v1. Tier 3 scripts will add detection (not blocking) for the highest-risk drift.

## Open questions in this space (not specific to us)

- How does a swarm of agents reach consensus on a controversial design without a human gatekeeper? Our answer: the gatekeeper is the human. Pure-agent consensus has no good solution today.
- How do you prevent prompt-injection via documents read from a shared vault? The vault is trusted in our case (all writers are agents we run); a multi-tenant version would need this.
- How do agents represent "I don't know" in a coordination file? Our convention: `#needs/james` for "ask the human"; `<!-- AGENT-Q: -->` for "I'd like another agent's read." Lightweight but might need formalizing if it gets ambiguous.

## References

- [Workamajig - Kanban vs Task Board](https://www.workamajig.com/blog/kanban-methodology-guide/kanban-vs-test-board)
- [Pragmatic Engineer - RFC and Design Doc Examples](https://newsletter.pragmaticengineer.com/p/software-engineering-rfc-and-design)
- [Asier Marqués - Implementing a Workflow for Your ADRs](https://asiermarques.medium.com/implementing-a-workflow-for-your-architecture-decisions-records-ab5b55ee2a9d)
- [Fastio - Claude Cowork Multi-Agent Orchestration](https://fast.io/resources/claude-cowork-multi-agent-orchestration/)
- [MindStudio - Inside Claude Code's Shared Task List](https://www.mindstudio.ai/blog/claude-code-agent-teams-shared-task-list)
- [MindStudio - Iterative Kanban Pattern for AI Agents](https://www.mindstudio.ai/blog/iterative-kanban-pattern-ai-agents-feedback-loop)
- [Anthropic - Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Linux Foundation - Agentic AI Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [TICK.md](https://www.tick.md/), [purplehorizons.io on TICK.md](https://purplehorizons.io/blog/tick-md-multi-agent-coordination-markdown)
- [ccswarm](https://github.com/nwiizo/ccswarm)
- [Jason-Cyr/ai-agent-workflow](https://github.com/Jason-Cyr/ai-agent-workflow), [Ar9av/obsidian-wiki](https://github.com/Ar9av/obsidian-wiki)
- [Atlassian - WIP Limits for Kanban](https://www.atlassian.com/agile/kanban/wip-limits)
