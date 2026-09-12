# Claude-side lead — acknowledgement and coordination note

**Lane:** Claude conversation 1 (Road B, compact EFS challenger) and Claude-side lead for Road C delegation. **Written by:** Fable (Claude Fable 5.1, harness claude-code, session label `fable-path-decision-20260912`, roster role `integration-test-lead`). **Read the README Coordinator checkpoint at:** 2026-09-12 (planning `2552962`).

## Acknowledgement

Read: `AGENTS.md`, the sprint README (`2552962`), `overhead-and-selection.md`. Understood: 24–48 h decision sprint, three roads, no EAS implementation, no waivers, no production/freeze, same-guarantee comparison, one heavy compiler/Anvil slot held by Codex, no run granted, finite bounded-history runs only, 15 GB scratch / 50 GB reserve. My September 11 figures (7.69M createFile etc.) are superseded by the brief's qualified costs and pins; I will not quote them as current.

## Checkout / HEAD / dirty state (verified at acknowledgement)

| checkout | branch | HEAD | dirty |
| --- | --- | --- | --- |
| `planning` (this note's checkout) | `main` | `2552962` | clean |
| `planning-fable-files-browser` (prototype worktree, shared with Codex yesterday) | `fable/2026-09-09-files-browser` | `e38b5e3` | 1 untracked: `Reviews/2026-09-09-files-browser-mvp/v21-use-case-brainstorm-2026-09-11.json` (my brainstorm output, preserved, unpublished) |
| `planning-mvp-c0` (Codex, read-only for me) | `codex/mvp-c0-coherence` | `aae282d` | clean |

Fuller control `ebc7d54`, native source `b8c2775`, evidence `d269e55` noted; I have not touched those worktrees.

## Agent ownership and capacity (actual)

- This session cannot create persistent independent Claude sessions. It can run **bounded in-session subagents** (context-isolated, background, optionally in their own git worktree) and can offer James a one-click spawn of a separate session. Road C is therefore an **independent in-session specialist** whose context contains none of my Road B thinking; its agent id is recorded below when launched. If James prefers a fully separate conversation for Road C, the spawn route is available and I will hand over the same brief.
- Capacity: this session plus up to ~10 concurrent bounded specialists for reading, design and code preparation. **No compiler/Anvil use** until a run slot is handed off here.
- Road B author: Fable (this session). Road C author: `road-c-mud-specialist` (subagent, launched with the README's Road C prompt verbatim plus the rule to record its proposal before reading `mud-source-preflight.md`, `road-b.md` or any Road A material). Bounded specialist `evidence-extractor`: reads the overnight/canonical evidence to tabulate pins, receipts and dropped guarantees for Road B's cost centers; no design authority.

## Assigned paths and branches

- Docs on `main` only: `Reviews/2026-09-12-efs-path-decision/{claude-pm.md, road-b.md, road-c.md}`. Staged exactly; nothing else.
- Proposed isolated code area (empty until the shortlist): `Reviews/2026-09-12-efs-path-decision/lab-b/` on a branch `fable/2026-09-12-road-b-lab` in its own worktree, own Foundry root, build outputs under run-owned scratch (`EFS_TEST_BUILD_ROOT`), no migration of existing prototypes.
- Git publication: I commit only my owned files from the `planning` main checkout, run `./scripts/open-decisions.sh --check`, pull with rebase of *my own* commits only, push, never force. If Codex also publishes from this checkout, I pull before each commit and stop on any conflict touching his files.

## Next checkpoint

Within 3 h of this acknowledgement: independent `road-b.md` (architecture, cost centers, strongest objection, one discriminating experiment) and independent `road-c.md`, both written before cross-reading. Then reconcile fixture and shortlist with Codex here and in the README.

## Requests and material questions

1. Heavy run: none requested. I will request a bounded run here after the shortlist, naming the exact experiment, scratch path and watchdog.
2. Publication serialization: confirm whether Codex commits from the same `planning` checkout; if so, a simple rule (pull-before-commit, exact-path staging, no rebase of the other's work) is what I will follow.
3. No material requirement question yet. Candidate for consolidation later: the always-on versus declared index boundary (kernel ingestion vs separate index contract) — James indicated yes-in-principle on September 11; the exact set is for the shortlist, with plain examples, not now.

## Log

- 2026-09-12: acknowledged; Road C specialist and evidence extractor launched; Road B note in progress.
