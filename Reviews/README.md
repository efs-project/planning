# Reviews

Analysis, critique, and build-record artifacts produced by review/architecture agents. Date-prefixed (`YYYY-MM-DD-<slug>.md`). These are point-in-time outputs — reference them as history; the canonical decisions they fed into live in the relevant repo's ADRs and in [[Decisions]].

## Contents

### Schema-freeze build record (2026-06-02) — the contracts schema-freeze design arc
These four are one cohesive set (plan → critique → synthesis → blueprint) behind the Sepolia schema freeze. Canonical decisions landed as `contracts/docs/adr/` ADR-0048–0055 + the `schema-freeze` branch freeze table.
- [`2026-06-02-schema-freeze-build-plan.md`](./2026-06-02-schema-freeze-build-plan.md) — implementation plan (r2)
- [`2026-06-02-schema-freeze-plan-critique.md`](./2026-06-02-schema-freeze-plan-critique.md) — critique synthesis of the plan
- [`2026-06-02-contracts-api-review-synthesis.md`](./2026-06-02-contracts-api-review-synthesis.md) — contracts + API review synthesis
- [`2026-06-02-sepolia-deployment-blueprint.md`](./2026-06-02-sepolia-deployment-blueprint.md) — Sepolia deployment blueprint (mainnet-forward)

### Workspace holistic review (2026-06-10)
- [`2026-06-10-holistic-review.md`](./2026-06-10-holistic-review.md) — all-four-repos review (security / gas / architecture / dev-UX / user-UX / hygiene), 79 findings with stable IDs (`SEC-*`, `GAS-*`, `ARCH-*`, `DX-*`, `UX-*`, `ENG-*`). Tracked via the "Act on holistic review" Kanban card.
