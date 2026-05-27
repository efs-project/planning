# Brainstorms index

PM-maintained map of brainstorms by area and status. Excludes `obsolete` by default — see git history if you need pruned items.

Conventions: [[brainstorm-system]].

## By area

### Client
- 2026-05-26 [`2026-05-26-pm-client-os-architecture`](./2026-05-26-pm-client-os-architecture.md) — `reference` — Full Gemini-collaborated OS spec captured by PM. Ring architecture (Bootstrapper / Kernel / Shell / Apps), SES sandboxing, OCap security. Primary input for the future Client design thread.

### SDK
- 2026-05-26 [`2026-05-26-bs-os-sdk-capability-surface-v1-ring3-app-api-surface`](./2026-05-26-bs-os-sdk-capability-surface-v1-ring3-app-api-surface.md) — `raw` — ~50 capabilities across 9 namespaces. 15 cross-cutting questions. For: Client/OS design thread blank-slate prevention.
- 2026-05-26 [`2026-05-26-bs-sdk-package-layout-v1-three-sdk-packaging-directions`](./2026-05-26-bs-sdk-package-layout-v1-three-sdk-packaging-directions.md) — `raw` — Three equal-weight directions, comparison table, 5 specific decisions for James. Direction 3 → 2 noted as easiest-reversal.
- 2026-05-26 [`2026-05-26-bs-third-party-dev-ux-v1-dev-friction-walkthroughs`](./2026-05-26-bs-third-party-dev-ux-v1-dev-friction-walkthroughs.md) — `raw` — 5 hypothetical apps walked through cold-start. **Sharpest finding:** `efs.write` is an 8-attestation MetaMask detonation. Surprise: Ring 3 sandboxed apps had FEWER friction points than standalones because OS owns wallet/network/storage.

### Contracts
- 2026-05-26 [`2026-05-26-bs-contract-decomposition-v1-contract-decomposition-directions`](./2026-05-26-bs-contract-decomposition-v1-contract-decomposition-directions.md) — `raw` — 5 contract decomposition directions: (1) James's 3-contract model, (2) current Lists-branch reality, (3) 2-contract kernel+gateway (least promising, EIP-170), (4) lifetime-based split (most novel — worth design-thread engagement), (5) strict per-layer. Flagged spec drift: `edition`/`lens`, `TagResolver`/`EdgeResolver`, contract-count mismatch in `overview.md`.
- 2026-05-26 [`2026-05-26-bs-schema-coverage-audit-v1-schema-gap-map`](./2026-05-26-bs-schema-coverage-audit-v1-schema-gap-map.md) — `raw` — 30-item prioritized gap catalog. **Refines the typed-edge finding** from `bs-divergent-usecases-v1`: only 1 of 8 TAG-overload roles actually breaks (state-transition/event edges with payload). Not a Lists-blocker; deserves EVENT/TRANSITION schema before *mainnet* shape freeze. PROPERTY more pervasively strained than TAG, but SDK-fixable. Top urgency: G04 (MIRROR cap), G15 (Lists per-entry metadata — cheap now / expensive later), G14 (`ISortFunc` reference).

### Meta / cross-cutting
- 2026-05-26 [`2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries`](./2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries.md) — `raw` — 15 use cases. Observations remain primary upstream for many subsequent brainstorms. **Note**: typed-edge finding here has been refined by `bs-schema-coverage-audit-v1` — read both for full picture.

## By status

### Raw (awaiting curation)
- All 6 brainstorms above except `pm-client-os-architecture` (reference) and the typed-edge surface (now `surfaced` via For-James).

### Surfaced (PM has flagged)
- 2026-05-26-bs-divergent-usecases-v1 — typed-edge finding (then refined by bs-schema-coverage-audit-v1)
- 2026-05-26-bs-contract-decomposition-v1 — spec drift → Kanban card
- 2026-05-26-bs-third-party-dev-ux-v1 — EFS-in-Postgres indexer pattern → Kanban card

### Integrated (folded into a real artifact)
*(none yet)*

### Reference (durable context)
- 2026-05-26-pm-client-os-architecture

## Integrated history
*(brainstorms that became designs/decisions/cards land here with `→` pointer)*

## Notes for the PM (curation log)

- **2026-05-26 batch-1** (3 subagents): ~155k tokens, 3.5 min. Foundational use cases + OS SDK surface + SDK packaging. Surfaced 1 to For-James (typed-edge).
- **2026-05-26 batch-2** (3 subagents): ~244k tokens, ~7 min. Contract decomposition + schema audit + third-party dev UX. Refined the typed-edge finding (sharper, less urgent). Surfaced 2 to Kanban (spec drift + EFS-in-Postgres indexer pattern). Important PM-data correction: prior "5 contracts on custom-lists" was the count of contracts *changed* by Lists; actual total is ~11 contracts (BlobResolver, EFSFileView, EFSIndexer, EFSRouter, EFSSortOverlay, FileResolver, MirrorResolver, PropertyResolver, SchemaNameIndex, TagResolver→EdgeResolver, TopicResolver) plus interfaces/stubs.
- **Cumulative cost so far**: ~400k tokens across 6 brainstorms. Spend trajectory: batch-2 was 1.6× batch-1; future batches should target ≤200k unless specifically justified.
- **WIP discipline reminder**: surface cap is ≤2/week to For-James. Used 1 this week (typed-edge refinement); Kanban surfaces don't count against this cap.
