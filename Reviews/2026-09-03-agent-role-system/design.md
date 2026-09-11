# Portable EFS agent roles — implementation contract

> Historical, superseded by James's later 2026-09-03 simplification. Do not reimplement this tooling contract. Current directory: [Agents/README.md](../../Agents/README.md).

**Status:** owner-approved direction; operating-document implementation, not an EFS protocol design or permission system.
**Date:** 2026-09-03

James approved the lightweight roster/SOUL/handoff proposal and requested additional expert review followed by implementation. Scope is his current single-owner workflow across Codex, Claude Code, Antigravity, and future harnesses. No other human authority is created. No production EFS implementation, task creation, deployment, personal configuration, or automatic agent scheduling is included.

## Outcomes

1. Start a named EFS role without reconstructing its job from a chat.
2. Change models/harnesses without losing the assignment, evidence, or next action.
3. Make ownership and cross-product interfaces explicit without requiring permission for every reversible edit.
4. Prevent obvious routing mistakes and expose incomplete branch/context visibility.
5. Keep project instructions shareable without exporting private conversations, credentials, local paths, or account bindings.

## Small structure

- `Agents/README.md`: the sole roster of stable role IDs, names, aliases, brief paths, and established/on-demand classification. Classification means role definition, not a live task or design approval. All human authority remains in `Onboarding/authority.md`.
- `Agents/<role-id>/SOUL.md`: concise operating briefs (normally under 100 lines), with mission, owns, does-not-own, deliverables, collaborators, decisions, reading, and style. Preserve `Agents/pm.md` as the General PM's canonical existing brief; do not duplicate or move it.
- `Agents/launch.md`: one portable start/resume contract. Existing `pm-launch.md` remains a compatible PM entry point.
- `Agents/handoff-template.md`: an optional small handoff for a real task, stored next to the task's canonical work or in dated notes. No per-role shadow Kanban or mandatory empty handoffs.
- `Agents/harnesses.md`: verified loading instructions and an honest support matrix. Add a thin `CLAUDE.md` importing the existing root `AGENTS.md`; add role routing there via the shared entry point. Antigravity receives a documented manual workspace-rule route plus the universal explicit-read launch. Do not invent rule activation syntax or install personal rules.
- `scripts/agent-role.sh`: optional read-only list/launch/check helper consuming the Markdown roster. No new runtime dependency, worker launcher, state writer, role generator, or network access.

## Registry contract

One table between literal `<!-- role-registry:start -->` and `<!-- role-registry:end -->` markers. Columns: `Role ID | Name | Aliases | Brief | Use`.

IDs are lowercase kebab-case, names are human-facing, aliases are semicolon-separated case-insensitive exact names (not fuzzy matching), Brief is a relative Markdown link from `Agents/README.md`, and Use is `established` or `on-demand`. All IDs, names, and aliases must route unambiguously; repeating a role's own name as an alias is unnecessary. The registry owns identity/routing; SOULs own detailed scope. Detailed source facts are linked rather than copied. Human-readable prose and normal Markdown remain the API; the helper is optional.

Sixteen definitions:

| ID | Name | Boundaries |
|---|---|---|
| pm | EFS Project Manager | General coordination, Devcon and owner attention; not protocol/product design or implementation. |
| v2-pm | EFS v2 PM | Core/protocol coherence and MVP integration; not portfolio PM or unilateral freeze. |
| web-client-os-pm | EFS Web Client / OS PM | Host shell/runtime/platform; not ownership of every app. |
| sdk-pm | EFS SDK PM | TypeScript and consumer Solidity SDK experience; not protocol contract semantics. |
| git-forge-pm | EFS Git / Forge PM | Git/forge product and portable developer artifacts; not new Core nouns. |
| arcade-pm | EFS Arcade PM | Game distribution/play journeys; not runtime permission authority. |
| native-filesystem-pm | EFS Drive / Native Filesystem PM | Host filesystem adapters; alias OS Drivers PM; not arbitrary web OS plugins. |
| app-store-pm | EFS Open Web App Store PM | Distribution/catalogs/package handoff; host decides activation. |
| data-explorer-pm | EFS Files / Data Explorer PM | Files app plus rich data views; no universal intermediary for exact app routes. |
| media-library-pm | EFS Media Library PM | Shared media infrastructure and provisional personal-library/playback product hat; explicit internal separation. |
| booru-pm | EFS Booru PM | Tagged-gallery/discovery/curation; shared media facts stay coordinated with media-library-pm. |
| contracts-dev | EFS Contracts Dev | Protocol Solidity engineering within approved design; no implicit deployment. |
| web-client-dev | EFS Web Client Dev | Platform and assigned app implementation; each task names one acceptance owner. |
| sdk-dev | EFS SDK Dev | On-demand SDK implementation lane. |
| integration-test-lead | EFS Integration & Test Lead | On-demand end-to-end seams, reproducibility, negative traces; not protocol authority. |
| security-reviewer | EFS Security Reviewer | On-demand independent read-only review; changes need a separate repair assignment. |

Preserve previous display names as aliases. Do not map generic historical model labels (`codex-gpt-5`, `fable`, `claude-opus-*`) to one role: they were used in multiple roles. Preserve history unchanged. Do not rename app tasks. A second human can reuse the briefs but does not acquire James's authority or accounts; future human onboarding is deferred.

## Shared operating contract

- At start, resolve role explicitly, identify task, planning/code repository and branch/revision, read local repo instructions, roster row, one SOUL, and only relevant current maps/inboxes/rulings. Do not load all roles or an entire research corpus. Design routes may exist only on a working branch: inspect/obtain the assigned revision; do not substitute legacy v1 docs or claim missing maps mean no work exists.
- A role is not an assignment or permission grant. Maintain current project authority and runtime tool limits. Take initiative on authorized reversible work. Do not convert review/status requests into writes or create long-lived tasks merely because a role exists.
- Role ID goes in `Agent:` prospectively, actual harness in `Harness:`, actual known model in `Co-authored-by:`. Session identity is separate; use a non-secret human-readable unique session label in the existing card/status/handoff. Never infer same session from same harness.
- Before writes inspect local dirty state, existing task/card/status and related branches. Distinct scopes may proceed independently in isolated worktrees. Overlap requires an agreed split or handoff; preserve others' changes. A status note is advisory, not a cross-machine lock; no note is not proof of no writer. Apply existing card TTL rules; no new timeout automatically seizes work.
- Git-sync rules do not authorize rebasing another worker's branch, stashing unrelated dirty files, or force-pushing. Sync safely in owned isolation. Offline work can continue locally within an authorized independent scope; label freshness/visibility and do not invent remote state.
- Handoff identifies objective, role/session, exact repo refs/commits, canonical sources, approval basis, completed/remaining work, dirty/uncommitted changes, commands/results/not-run checks, risks, and next action. Distinguish local committed, remote reachable, and merged. Do not duplicate decision queues or copy private chat histories. Cross-harness state needs a commit visible to the receiving checkout or an explicit secure transfer.
- One acceptance owner per implementation task, named collaborators/reviewers for interfaces. Review disagreement is evidence, not a vote; independent reviewers inspect actual artifacts. Bound specialist tasks, stop when done, and report a falsifier/repro instead of spawning endless committees.
- Role owners can refine their operational notes within scope; ownership, authority, cross-role boundary, and global workflow changes need owner approval. General PM curates the roster. Role documents are name-stable living ops docs, never numbered/promoted protocol designs.

## Explicit choices and non-goals

Markdown-only wins over a YAML database or independently maintained per-harness personas: it is directly readable and avoids competing truth. A small shell checker is justified by actual alias/link drift, not orchestration ambitions. Optional native custom-agent adapters can be added after runtime smoke tests; this version changes no tool permissions or selected models.

No autonomous loops, scheduler, cost budgets, telemetry, lock service, CODEOWNERS, RBAC, team-wide private memory, or all-roles-always-on prompt. No new product priorities, repo selection, milestones, deployments, or Core semantic decisions. New roles do not mean new running agents.

## Verification

- Structural checks and adversarial fixtures: valid roster, empty/malformed table, duplicate IDs and cross-role alias/name collisions, missing briefs/required sections, unsafe escaping/traversal, unknown role, stable launch by alias, path with spaces, no filesystem changes from helper.
- Fresh-context scenario review: Files/OS split; shared media/Booru split; SDK/contract boundary; same-harness collision; offline stale branch; attempted role self-expansion; review request without write permission.
- Native Codex/Claude/Antigravity startup results must be labeled separately from source/document and local helper validation. Do not claim native cross-harness runtime testing from a Codex subagent reading Markdown.
- Measure improvement with a small future comparison: orientation time/extra questions, wrong-source or wrong-role starts, handoff restart/rework, duplicate edits, and cross-component failures caught. No invented productivity percentage.

## Expert input

Two independent read-only reviews supported the minimal shape. Both warned against role/model conflation and authority inflation. One preferred flat briefs; registry paths allow preserving PM while new roles use explicit SOUL filenames. Both required current context outside durable prompts. Boundary review found shared media versus Booru and platform versus Files to be load-bearing. This contract selects one optional helper rather than native role copies, and leaves all existing EFS design authority unchanged.
