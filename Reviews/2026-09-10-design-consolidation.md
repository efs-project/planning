# Design documents returned to planning/main

**Date:** 2026-09-10
**Scope:** owner-requested documentation consolidation and design-branch cleanup; no prototype migration, new experiment, protocol promotion or deployment

Ordinary designs and documentation belong on `main`, where the shared Obsidian
vault and other agents can see them. This pass reconciles committed source
documents, not whole mixed code branches or Fable's uncommitted work.

## Main-visible design map

| Read on main | Retained source and reconciliation |
|---|---|
| [[Designs/efsv2/README|Core and Files]] | September Core/MVP design lineage at `aae282df72f214d791963aeac1cf3c38d162c56e`; preserve the newer testnet plan, acceptance requirements, and data-readiness map. |
| [[Designs/efsv2/owner-rulings|Owner rulings]] | September ledger at `aae282df` plus the unique September 10 tag/indexing entries at `c833ecd508643852aea372400bd44a771f50641c`; earlier mandatory-validation direction remains. The unanswered indexing question is still unanswered. |
| [[Designs/efsv2/programmable-acceptance-experiment|Acceptance experiment note]] | `e358ad66bb6471e1d89b1327d03c5ba7a286b116`; a separate bounded experiment, not integrated prototype or production proof. |
| [[Designs/sdkv2/README|SDK]] | The already-landed September 10 spine through `0b5ac89b5c6cc4b27bb46f1ac1c94dee7e670342` is preserved, with the September five-seam [[Designs/sdkv2/mvp-interface|consumer contract]] added alongside it. |
| [[Designs/data-explorer/README|Data Explorer]] | Eight-document corpus at `df0ddd3b77fad7dae4e84c3cde6b009d703cc0cb`, reconciled with the later separate-workspace/File-Browser-independent boundary. August result bytes and experiment gates remain historical. |
| [[Designs/web-client-os/mvp0-acceptance|Web Client MVP0]], [[Designs/open-web-app-store/architecture|App Store]], [[Designs/media-library/query-and-indexing|media queries]] | September product-seam corrections from `aae282df`; broader roadmaps remain available, without replacing the narrower MVP gate. |
| [[Designs/efsv2/ethereum-standards-and-execution-profile|Standards]] and [[Designs/efsv2/mvp-build-start-packet|August readiness packet]] | Unique designs from `2573f08b170bf3eb855ad5a68c31ee7b0215272d`, plus its dated large-upload/operations/standards corrections. The older EXP-C0 profile is retained evidence, not a replacement for September MVP-C0. |
| [[2026-09-02-efs2-coherence-and-mvp-readiness-review|September coherence review]] and [[2026-09-02-efs2-coherence-and-mvp-readiness-review-errata|errata]] | Historical report and corpus index; full lane evidence remains at the exact linked source. Not a new audit or current status report. |

Existing current main content wins over older alternate spines unless a
specific, documented reconciliation above applies. In particular, the August
[Core/Type/constitution alternatives](https://github.com/efs-project/planning/tree/2573f08b170bf3eb855ad5a68c31ee7b0215272d/Designs/efsv2)
remain inspectable history; their experiment defaults and old owner queue are
not silently imported over newer decisions. Drafts remain drafts.

## Prototype and supporting evidence left in place

These links open exact committed snapshots, not a claim about an active
worker's latest files. Supporting executable files, fixtures, manifests,
reports and reproduction commands stay in their existing closures.

| Evidence family | Exact source |
|---|---|
| MVP convergence and repository/SDK/browser rehearsal | [September convergence](https://github.com/efs-project/planning/tree/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-04-mvp-convergence), [rehearsal](https://github.com/efs-project/planning/tree/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-04-mvp-rehearsal) |
| Foundation and data-readiness research | [Foundation review](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-10-foundation-design-review.md), [data readiness](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-10-data-readiness-reconciliation.md), [reply after economics](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-10-foundation-reply-after-economics.md) |
| MUD and programmable acceptance | [Prior-art research](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-09-mud-and-validation-research.md), [acceptance experiment](https://github.com/efs-project/planning/tree/e358ad66bb6471e1d89b1327d03c5ba7a286b116/Reviews/2026-09-10-programmable-acceptance) |
| Fable's economics, indexes and tags | [Committed prototype/research closure](https://github.com/efs-project/planning/tree/c833ecd508643852aea372400bd44a771f50641c/Reviews/2026-09-09-files-browser-mvp) |
| August Core source lock | [Readiness evidence](https://github.com/efs-project/planning/tree/2573f08b170bf3eb855ad5a68c31ee7b0215272d/Reviews/2026-08-25-efs2-exp-c0-v0-control); retains ancestor `b9088d6a24f4d40bcca6ba300523b25cc7c608d2` used by the SDK/Explorer checkers |
| Explorer's August fixtures | [Exact consumption closure](https://github.com/efs-project/planning/tree/df0ddd3b77fad7dae4e84c3cde6b009d703cc0cb/Reviews/2026-08-25-data-explorer-exp-c0-consumption); main carries its explanatory README only |

The readiness, MVP, programmable-acceptance, active Fable and historical
tournament code branches are excluded from branch cleanup. Their designs are
now routed from main where applicable; their code, worktrees and source pins
are not moved or retargeted.

Obsolete design-branch names may be retired only after main is published and
their unique source history is preserved. Clean design worktrees can retain
their exact files at detached source checkpoints; they are not future design
destinations. Ordinary subsequent planning writes use the shared `main` after
coordination. Branch exceptions need an explicit scope and return-to-main
handoff; no new agent tooling is introduced.

Recovery refs are published under `archive/planning-designs-2026-09-10/`:
`data-explorer` (`df0ddd3`), `type-data-abi` (`e295bbc`), `testnet-plan`
(`6c3f271`), and `coherence-review` (`d8076d0`). Agent-role and SDK source
history already reaches main. These tags preserve original commits and their
full evidence; they do not select a protocol version or move prototype files.

**Cleanup completed:** the design integration is published on main at
`1afd01a9673b6ea3c7147600d43843aab614e59d`. Retired the local/remote branch
names where present: `codex/agent-role-system`, `codex/sdkv2-pm`,
`codex/type-data-abi`, `codex/data-explorer-pm`,
`codex/testnet-files-mvp-plan`, and
`claude/efsv2-coherence-mvp-review-eslcr8`. All four existing design worktrees
retain their exact files at detached checkpoints; no directory was removed.
The five excluded code/evidence branches remain. Source tags and main were
verified on origin before deletion; original commits remain recoverable.
