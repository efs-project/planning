# Portable EFS agent roles implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make EFS roles reusable and handoffs reliable across James's agent harnesses.
**Architecture:** One Markdown registry, focused SOUL briefs, a shared launch contract, and optional read-only shell routing/checks. Existing authority, boards, history and product spines remain canonical.
**Tech Stack:** Markdown, bash 3.2, standard Unix tools. No npm/Python or new dependencies.
**Spec:** [design.md](./design.md)

## Global Constraints

- Work only in the assigned isolated planning worktree. No code-repo edits, persistent task creation, automatic agents, account/config edits, deployed artifacts, ACLs, or design promotion.
- All IDs, table columns, role boundaries and source-of-truth rules are defined in the spec. Established/on-demand is not running/approved.
- Preserve `Agents/pm.md` and `Agents/pm-launch.md` paths; no rewritten Git history or retroactive role attribution.
- Relative paths in committed files; source links where research informs behavior; no copied private memory or local/session IDs in durable briefs.
- Baseline open-decisions and tri-sync pass. Run them before each commit plus `git diff --check`; do not modify unrelated findings.
- Commit only exact task-owned paths with Agent/Harness/actual model trailers. No pushes by workers; controller publishes after review.

### Task 1: Implement the shared role documents and coherent entry points

**Files:**
- Modify `Agents/README.md`, `Agents/pm.md`, `Agents/pm-launch.md`, `AGENTS.md`, `Onboarding/conventions.md`, `Onboarding/start-here.md`, `Kanban.md`, `Decisions.md`, `Retirements.md`, `Daily Notes/agent-status.md`, `.gitignore`.
- Create `Agents/launch.md`, `Agents/handoff-template.md`, `Agents/harnesses.md`, the fifteen `Agents/<role-id>/SOUL.md` files other than `pm` listed in the spec, and `CLAUDE.md`.

**Interfaces:** Consumes design.md and research.md in this review folder. Produces the registry table with the exact five columns/markers from the spec. Brief headings for new SOULs: `## Mission`, `## Owns`, `## Does not own`, `## Deliverables`, `## Collaborators`, `## Decisions`, `## Start here`, `## Working style`. Existing PM can keep its richer headings; helper will treat it explicitly as legacy shape with role-specific headings. Shared launch owns cross-role start, scope, handoff and collision rules.

- [ ] Read the existing entry points and relevant design maps, not whole design corpora. If SDK/Data Explorer maps are only on branches, route honestly through the existing task/branch handoff; never create dead Markdown links or embed local worktree names. Clarify branch-visible versus main-visible sources without importing product designs.
- [ ] Write roster with all 16 spec IDs. Add exact old role names as aliases, semicolon-delimited, including names without EFS prefix. Mark only last three roles on-demand. Make Media/Booru split and personal library dual hat explicit. No duplicate metadata database.
- [ ] Write concise new SOULs using exact headings. Give each role concrete inputs/deliverables and at least one domain-specific failure to watch. Link shared launch so authority/concurrency rules are not copied wholesale sixteen times.
- [ ] Write launch/handoff/harness guides. Launch must support fresh start and resume, explicit scope and source revision, narrow reading, same-harness instances, offline mode and no-op unassigned start. Handoff fields and one short worked synthetic example demonstrate local-vs-pushed-vs-merged. Native startup matrix labels document-verified and not runtime-tested; manual universal prompt works without shell. CLAUDE.md imports `@AGENTS.md` only plus minimal wrapper note; no all-role imports or tool config. Antigravity manual rule uses documented file referencing through its UI, not guessed frontmatter. Add ignored local preferences/bindings paths only, never files with secrets.
- [ ] Repair material PM contradictions minimally: name-stable ops lifecycle (not numbered promotion), actual session identity not harness watermark, bash3.2 script requirement, no GitHub API fallback under planning rules, no duplicating design rulings into Decisions, no role status as design freeze. Preserve useful PM voice/history. Update prospective role trailer examples/concurrency in conventions and root AGENTS, adding a short roster route; don't expand onboarding into an all-roles prompt.
- [ ] Record only the user's actual approval in Decisions as a dated vault-process entry. Resolve the old PM SOUL numbering/promotion card as operating-document supersession, not human design promotion. Add targeted Retirements entries for killed instructions and run needs-integration; do not repair unrelated output. Append this session's status once. Do not restructure owner inbox or unrelated cards.
- [ ] Self-review for ID/path ambiguity, dead links, ownership/permission inflation and duplicate truth. Run `./scripts/open-decisions.sh --check`, `./scripts/tri-sync-check.sh`, `git diff --check`. Commit exact paths and provide report.

### Task 2: Add optional read-only role routing and adversarial validation

**Files:** Create `scripts/agent-role.sh`, `scripts/test-agent-role.sh`; modify `scripts/README.md`, `Agents/README.md`, `Agents/harnesses.md` only for usage/verification instructions. Record evidence in this review folder's `verification.md` after tests. Do not add native role definitions or a database.

**Interfaces:** Consumes the canonical Markdown table from Task 1. `bash scripts/agent-role.sh list` prints IDs/names/brief paths; `bash scripts/agent-role.sh launch ROLE_OR_EXACT_ALIAS` prints a portable prompt that selects the canonical ID and actual brief plus `Agents/launch.md`; `bash scripts/agent-role.sh check` checks roster integrity and brief reachability/required headings. All operations are read-only, no network, no invoking agent binaries, no shell-evaluating document contents. Resolve vault root from script location, so commands work outside repo cwd and on paths with spaces. Exit 0 success, 1 invalid registry/unknown role, 2 usage/runtime error. No root-override CLI or environment hook: tests exercise the real script copied into a controlled temporary fixture tree.

- [ ] Write behavioral shell fixtures before the helper. Use bash3.2 and real temporary fixture trees with literal expected IDs; shell-generated test data is allowed as test runtime, but author files with apply_patch. A minimal fail/succeed fixture loop should call the actual script and compare status/stdout and snapshot file contents before/after, not grep production source.
- [ ] Observe RED for missing routing behavior and retain the command/output in the worker report. Test unknown roles and invalid data by observable rejection, not one exact error wording.
- [ ] Implement minimal parsing with awk/shell, no dependencies or eval. Validate markers, header/table shape and at least one row; unique case-insensitive routing across ID/name/alias; valid ID/use; safe in-Agents relative brief path and existing regular file (reject escaping symlinks too); required headings. PM special case checks its actual mission/autonomy/start equivalents without rewriting its whole brief. Check nonempty required sections, not just heading tokens. Never treat an empty scope as pass. Report counts and explicit limits: checker does not prove semantics, locks, permission enforcement, runtime support or all project links.
- [ ] Test at least: valid list/launch/check; exact alias resolution; unknown role; duplicate ID; alias/ID collision across rows; name collision; missing brief; traversal/escaping symlink; empty registry; malformed header/row; missing section; empty section; path with spaces; arbitrary working directory; no writes; PM legacy brief. A corrupted unrelated row should prevent trusted launch output too. Add focused regression tests for actual bugs found.
- [ ] Document helper and tests in scripts index. Provide copy/paste no-shell fallback. Run tests under `/bin/bash` on macOS and report version. Run syntax checks, real roster check and launch of Contracts, Files and PM, open-decisions/tri-sync, and whitespace checks. Evidence distinguishes source/helper/consumer review from unrun native Claude/Antigravity sessions. Commit exact paths and report RED/GREEN results.

## Final gate

Read-only fresh-context reviewers run scenario reasoning on the shipped instructions and review the complete diff; controller reruns real checks. Address important findings, then publish the named branch and prove remote reachability. No merge of unrelated v2 design branches. If main integration is safe and authorized by the vault's direct-push workflow, it remains a separate explicit integration step with current Git checks. Do not claim another harness sees unpushed work.
