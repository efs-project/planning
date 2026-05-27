# Brainstorms index

PM-maintained map of brainstorms by area and status. Excludes `obsolete` by default — see git history if you need pruned items.

Conventions: [[brainstorm-system]].

## By area

### Client
- 2026-05-26 [`2026-05-26-pm-client-os-architecture`](./2026-05-26-pm-client-os-architecture.md) — `reference` — Full Gemini-collaborated OS spec captured by PM. Ring architecture (Bootstrapper / Kernel / Shell / Apps), SES sandboxing, OCap security. Primary input for the future Client design thread.

### SDK
- 2026-05-26 [`2026-05-26-bs-os-sdk-capability-surface-v1-ring3-app-api-surface`](./2026-05-26-bs-os-sdk-capability-surface-v1-ring3-app-api-surface.md) — `raw` — ~50 capabilities across 9 namespaces (`efs.fs`, `efs.attestations`, `efs.wallet`, `efs.network`, `efs.storage`, `efs.ui`, `efs.events`, `efs.lens`, `efs.crypto`, `efs.meta`). Each entry: TS signature, permission token, abuse risk. 15 cross-cutting questions. Most useful for: blank-slate prevention when Client/OS design thread starts.
- 2026-05-26 [`2026-05-26-bs-sdk-package-layout-v1-three-sdk-packaging-directions`](./2026-05-26-bs-sdk-package-layout-v1-three-sdk-packaging-directions.md) — `raw` — Three equal-weight directions (independent repos / monorepo / single-package-namespaced). Comparison table, 5 specific decisions James needs to make. Direction 3 → Direction 2 noted as the easiest-reversal path.

### Meta / cross-cutting
- 2026-05-26 [`2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries`](./2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries.md) — `raw` — 15 use cases (botanical specimens, legal discovery, vintage CAD, citizen-science birding, recipe forks, oral histories, OSS firmware, sports stats, RPG homebrew, medical records, museum provenance, podcasts, coffee supply chains, fanfiction, grid telemetry). **High-value Observations section** surfaces: typed-edge schema gap, daemon/service tier need, MIRROR cap pressure, lens-granularity need, PROPERTY indexing universality.

### Contracts
*(none yet — but the typed-edge finding from bs-divergent-usecases-v1 is contracts-relevant; flagged in For-James)*

## By status

### Raw (awaiting curation, may have surfaceable bits)
- 2026-05-26-bs-os-sdk-capability-surface-v1 — surfaced ¼ items (the capability questions are post-OnionDAO material; PM will hold)
- 2026-05-26-bs-sdk-package-layout-v1 — surfaced ¼ items (PM-questions section is post-OnionDAO material; PM will hold)
- 2026-05-26-bs-divergent-usecases-v1 — **1 item surfaced** (typed-edge finding → For-James)

### Surfaced (PM has flagged to James or another agent)
- 2026-05-26-bs-divergent-usecases-v1 (partial — typed-edge finding surfaced 2026-05-26)

### Integrated (folded into a real artifact)
*(none yet)*

### Reference (durable context)
- 2026-05-26-pm-client-os-architecture

## Integrated history
*(brainstorms that became designs/decisions/cards land here with `→` pointer)*

## Notes for the PM (curation log)

- **2026-05-26 batch**: 3 subagent-generated brainstorms (cost: ~155k tokens / 3.5 min parallel). High signal-to-noise on all three. Most actionable finding: typed-edge schema gap (bs-divergent-usecases-v1). Other findings are post-OnionDAO material, intentionally not surfaced now to protect James's focus on Lists.
- **WIP discipline reminder**: surface limit is ≤2/week to For-James. Surfaced 1 item this week (typed-edge). Have headroom for one more if something urgent emerges.
