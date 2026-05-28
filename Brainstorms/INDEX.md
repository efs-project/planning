# Brainstorms index

PM-maintained map of brainstorms by area and status. Excludes `obsolete` by default — see git history if you need pruned items.

Conventions: [[brainstorm-system]].

## By area

### Client
- 2026-05-26 [`2026-05-26-pm-client-os-architecture`](./2026-05-26-pm-client-os-architecture.md) — `reference` — Gemini-collaborated OS spec. Ring architecture, SES, OCap. Primary input for future Client design thread.

### SDK
- 2026-05-26 [`2026-05-26-bs-os-sdk-capability-surface-v1-ring3-app-api-surface`](./2026-05-26-bs-os-sdk-capability-surface-v1-ring3-app-api-surface.md) — `raw` — ~50 capabilities across 9 namespaces. 15 cross-cutting questions.
- 2026-05-26 [`2026-05-26-bs-sdk-package-layout-v1-three-sdk-packaging-directions`](./2026-05-26-bs-sdk-package-layout-v1-three-sdk-packaging-directions.md) — `raw` — 3 directions, comparison table, 5 decisions for James. Direction 3 → 2 easiest reversal.
- 2026-05-26 [`2026-05-26-bs-third-party-dev-ux-v1-dev-friction-walkthroughs`](./2026-05-26-bs-third-party-dev-ux-v1-dev-friction-walkthroughs.md) — `raw` — 5 hypothetical apps. Sharpest finding: `efs.write` = 8-prompt MetaMask detonation. Surprise: Ring 3 apps had FEWER friction points than standalones.

### Contracts
- 2026-05-26 [`2026-05-26-bs-contract-decomposition-v1-contract-decomposition-directions`](./2026-05-26-bs-contract-decomposition-v1-contract-decomposition-directions.md) — `raw` — 5 directions: James's 3-contract model, current Lists reality, 2-contract kernel (dead per bytecode), lifetime-split (novel), per-layer strict.
- 2026-05-26 [`2026-05-26-bs-schema-coverage-audit-v1-schema-gap-map`](./2026-05-26-bs-schema-coverage-audit-v1-schema-gap-map.md) — `raw` — 30-item gap catalog. Refined typed-edge to "1 of 8 roles actually breaks." PROPERTY more strained than TAG, SDK-fixable.
- 2026-05-26 [`2026-05-26-bs-schema-freeze-recommendation-v1-schema-set-recommendations`](./2026-05-26-bs-schema-freeze-recommendation-v1-schema-set-recommendations.md) — `raw` — Per-schema freeze calls. **MIRROR / SORT_INFO: freeze-for-sepolia. Anchor / DATA: freeze-for-mainnet-soon. PROPERTY / TAG / PIN: blocked on ADR-0041 being written.** Lists: hold with fallback. 2 new schemas proposed (EVENT/TRANSITION, COMMITMENT).
- 2026-05-26 [`2026-05-26-bs-contract-upgradeability-v1-per-contract-upgrade-story`](./2026-05-26-bs-contract-upgradeability-v1-per-contract-upgrade-story.md) — `raw` — Per-contract upgrade story for all 13+ Lists-branch contracts. **Key finding: schema-wired addresses make merging contracts impossible but splitting cheap** — biases hard toward "split more before launch, never merge after." Resolver→indexer interfaces de facto frozen.
- 2026-05-26 [`2026-05-26-bs-lifetime-split-deepdive-v1-lifetime-based-contract-architecture`](./2026-05-26-bs-lifetime-split-deepdive-v1-lifetime-based-contract-architecture.md) — `raw` — Deep dive on Direction 4. **Holds up but doesn't dominate.** Unique win: mechanical verifiability of permanence guarantee. Failure mode: 10-15% gas tax on cross-boundary writes. Forces decision on PROPERTY's etched-vs-mutable nature.
- 2026-05-26 [`2026-05-26-bs-bytecode-budget-v1-eip-170-headroom-analysis`](./2026-05-26-bs-bytecode-budget-v1-eip-170-headroom-analysis.md) — `raw` — Real measurements from compiled artifacts. EFSIndexer 14,912 bytes (60.7% of EIP-170). **Direction 3 (2-contract kernel) confirmed dead-on-arrival at 144% of limit even with all optimizations. Direction 1 tight but feasible.** Directions 2, 4, 5 comfortable.
- 2026-05-26 [`2026-05-26-bs-system-design-perspectives-v1-contract-surface-from-n-angles`](./2026-05-26-bs-system-design-perspectives-v1-contract-surface-from-n-angles.md) — `raw` — 8 perspectives (L2 sequencer, indexer node, hardware wallet, search engine, privacy preserver, cross-chain bridge, archival node, lens curator). **Sharpest architectural ask: `EFSUploadGateway` wrapper** — single change addressing 8-prompt detonation + L2 amortization + AA bundling.

### Meta / cross-cutting
- 2026-05-26 [`2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries`](./2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries.md) — `raw` — 15 use cases. Upstream for many subsequent brainstorms.
- 2026-05-26 [`2026-05-26-bs-vocab-coherence-audit-v1-cross-repo-vocab-drift-audit`](./2026-05-26-bs-vocab-coherence-audit-v1-cross-repo-vocab-drift-audit.md) — `raw` — 7 High + 4 Medium + 2 Low drift instances + 14 Glossary gaps. **Sharpest finding: two branches each minted a different ADR-0043 (renumbering conflict).**
- 2026-05-26 [`2026-05-26-bs-rot-audit-v1-first-formal-rot-audit`](./2026-05-26-bs-rot-audit-v1-first-formal-rot-audit.md) — `raw` — 16 rot items (4H/7M/5L). **Surprising:** `contracts/main` hasn't moved in 40 days; specs about to detonate at Lists merge. Recommends `#status/shelved` vocab addition.
- 2026-05-28 [`2026-05-28-pm-design-process-synthesis`](./2026-05-28-pm-design-process-synthesis.md) — `raw` (James-commissioned) — Streamlined EFS design lifecycle synthesized from the Lists `design-lessons.md` retrospective. **Core principle: human attention at frame (early) + gate (late), AI in between.** 6-stage lifecycle, 8 reusable AI techniques, internal-vs-external review guidance. Proposes formalizing as `Onboarding/design-process.md`. Surfaced to For-James.

## By status

### Raw (awaiting curation)
All 11 brainstorms except `pm-client-os-architecture` (reference) and partial surfaces (see below).

### Surfaced (PM has flagged)
- typed-edge finding (from `bs-divergent-usecases-v1`, refined by `bs-schema-coverage-audit-v1`) → For-James (downgraded)
- ADR-0041 / ADR-0043 phantom-ADR problem (from `bs-schema-freeze-recommendation-v1` + `bs-contract-upgradeability-v1` + `bs-vocab-coherence-audit-v1`) → For-James (active)
- spec drift → Kanban
- EFS-in-Postgres indexer pattern → Kanban
- EFSUploadGateway exploration → Kanban
- `main` spec sync planning → Kanban
- `#status/shelved` vocab → Kanban
- LAUNCH_CHECKLIST.md staleness → Kanban

### Integrated (folded into a real artifact)
*(none yet)*

### Reference (durable context)
- 2026-05-26-pm-client-os-architecture

## Integrated history
*(brainstorms that became designs/decisions/cards land here with `→` pointer)*

## Notes for the PM (curation log)

- **batch-1** (3 subagents): ~155k tokens, ~3.5 min. Foundational. Surfaced 1 to For-James.
- **batch-2** (3 subagents): ~244k tokens, ~7 min. Contract decomp + schema audit + dev UX. Refined typed-edge. Surfaced 2 to Kanban.
- **batch-3** (7 subagents): ~682k tokens, ~14 min (longest agent). Schema freeze rec + upgradeability + lifetime deepdive + bytecode + N perspectives + vocab + rot. Multiple surfaces to both For-James (1: ADR phantom problem) and Kanban (4 new + 2 expanded).
- **Cumulative cost across 3 batches**: ~1.08M tokens, 13 brainstorms.
- **Cost trajectory**: 155 → 244 → 682k. Batch-3 was 4.4× batch-1 — but had 7 agents not 3, and per-agent cost was actually flatter (60–131k each). The 131k system-design-perspectives took 14 min; high value but the most expensive single agent so far.
- **Pattern observation**: brainstorms that DO things (bs-bytecode-budget compiled artifacts, bs-vocab-coherence-audit ran 77 greps) produce more grounded output than purely-generative ones. Worth seeding more "go look at the actual data" prompts.
- **Triage structure (added 2026-05-26 between batch-2 and batch-3) worked**: all batch-3 brainstorms produced clear `## Controversial human design choices / Unknown questions / Blockers / concerns` sections. Curation was much faster as a result.
- **WIP cap**: ≤2 surfaces/week to For-James. Used 1 this week (typed-edge refinement) + 1 (ADR phantom problem). At cap.
