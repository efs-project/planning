# Cross-harness role research

**Date checked:** 2026-09-03
**Status:** source-backed design input; not native-harness runtime validation.

## What the primary sources support

| Source | Observed mechanism | EFS consequence |
|---|---|---|
| [Codex project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | Codex discovers AGENTS.md through its instruction hierarchy; discovery is bounded and includes at most one matching instruction file per directory. Alternate names require configuration. | Keep root routing short. A SOUL filename or chat title is not an automatic role loader. Explicitly read the selected brief. Do not load all roles globally. |
| [Claude Code memory/instructions](https://code.claude.com/docs/en/memory#agentsmd) | Claude Code loads CLAUDE.md, not AGENTS.md directly, and documents an import of AGENTS.md for shared instructions. External imports can require approval. | Add a same-repo import wrapper. Do not treat local memory as the shared project record. In sibling code repos, explicit reading of the assigned planning checkout is the portable fallback. |
| [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) | Native custom subagents use project .claude/agents definitions with platform-specific metadata and a prompt body. | A future native adapter can point to the shared brief; there is no reason to maintain another independently authored role body now. Native availability is distinct from a user's named main task. |
| [Antigravity rules](https://antigravity.google/docs/ide/rules/) | Workspace rules use .agents/rules, with backward compatibility for .agent/rules. Activation can be manual, always-on, model-decided or glob-based; the UI creates rules. References are relative to the rule file. | Document a manual UI-created project rule that points to the shared entry point, or use the universal explicit-read prompt. Do not write global GEMINI.md, guess activation frontmatter, or silently enable always-on roles. |
| [Antigravity subagents](https://antigravity.google/docs/subagents) | Native role discovery uses .agents/agents Markdown/YAML files. Tools/model/command policies are platform-specific; the docs warn malformed tool names can hang execution. | Defer generated native-role adapters until requested and smoke-tested. A portable SOUL does not grant runtime capabilities. |
| [Antigravity workflows](https://antigravity.google/docs/ide/workflows/) | The current documentation announces a workflow-to-skills migration/deprecation path. | Do not anchor long-lived EFS role identity on a workflow feature. Recheck vendor docs when enabling an adapter. |

## Engineering evidence, not team-size hype

[Anthropic's production research account](https://www.anthropic.com/engineering/multi-agent-research-system) describes a coordinating lead and parallel research workers, with explicit task boundaries, output expectations, and substantial coordination/token costs. This is a vendor report about research, not a measured EFS coding outcome. Adopt bounded assignments and evidence handoffs; do not infer that every coding task deserves several agents.

[Google Research's controlled study](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) compares agent configurations across several tool-use/reasoning benchmarks and finds task structure matters: parallel decomposition can help while sequential tasks can suffer. It is not an evaluation of this repository or these role files. Adopt independent reviewers/researchers where useful and one integration owner for dependent implementation. Do not quote its benchmark percentages as an EFS productivity forecast.

## Empirical caution about instruction files

Two relevant empirical preprints argue against treating additional prose as a proven productivity improvement. [Evaluating AGENTS.md](https://arxiv.org/abs/2602.11988) reports that repository context files did not generally improve task success and increased inference cost by over 20% on average; its abstract distinguishes useful nonstandard coding practices from unhelpful repository overviews. [Guardrails Beat Guidance](https://arxiv.org/abs/2604.11088) finds benefits from rules on a discriminative coding-task subset, but shuffled and mismatched rules performed similarly to curated ones, suggesting context priming rather than simply better advice. Its observed advantage for negative constraints is not a universal rule against positive instructions.

Neither study evaluates EFS or cross-harness role portability. Our inference is narrower: load the selected role, preserve concrete project boundaries and source routes, and avoid repeating generic tutorials or architecture. These briefs are an operating-consistency experiment, not a demonstrated coding-performance improvement. Before expanding them, compare a few representative EFS tasks with and without the selected-role layer, recording correctness, verification quality, unnecessary reads/tool calls, elapsed time, and user corrections. No automated evaluation service is introduced here.

## Review synthesis

Two read-only experts reviewed the platform evidence and local role/authority conventions. The architecture reviewer additionally checked product maps: Files versus platform, SDK versus protocol contracts, distribution versus activation, and media versus Booru must remain explicit. Both rejected a new permission system, role database, or duplicated private session memory. The existing role-ID versus model/harness distinction needs prospective correction; old model-shaped commit slugs cannot be reliably reclassified.

## Practical choices

- Ship readable operating documents and a read-only alias/launch/check helper; do not require a service or API subscription.
- Keep identity stable, current task state explicit, and startup context narrow.
- A missing branch-only map is a source-resolution problem, not permission to fall back to old v1 designs. Resolve the assigned branch/commit through the task handoff.
- Start with existing role names as aliases; new SDK engineering, integration, and security-review definitions are on-demand, not additional tasks running without an assignment.
- Keep a clear future-human boundary: shared briefs contain professional project knowledge; credentials, personal context and authority do not follow role names. No human onboarding or access-control scheme is implemented here.

## Verification boundary and follow-up

At this rollout's main-derived base (`8ae846a`), the SDK v2 and Data Explorer maps are branch-visible rather than present on main: `Designs/sdkv2/README.md` on the SDK PM work branch and `Designs/data-explorer/README.md` on the Data Explorer PM work branch. Existing local worktrees/refs were inspected. These are dated observations, not durable branch defaults; launch instructions must resolve the current assigned revision through the real task handoff.

Source review establishes documented loading routes, not that James's installed app versions have executed them. This pass can test shell helper behavior and fresh-context role interpretation inside Codex. Native main-session startup in Claude Code and Antigravity remains a separate manual smoke test, recorded by harness/version/revision when actually run.

For the next few real tasks, record only useful friction: time or extra questions before productive work, wrong-source starts, lost handoff facts, duplicate edits, and end-to-end defects caught. There is no background telemetry and no claimed improvement percentage. If the roster does not reduce those costs, simplify it instead of adding more agents.
