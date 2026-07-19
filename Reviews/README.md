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

### EFS v2 lens architecture review (2026-07-11)

- [`2026-07-11-efsv2-lens-architecture-and-scale-review.md`](./2026-07-11-efsv2-lens-architecture-and-scale-review.md) — foundational lens/trust review: typed compiled policy model, 50–256-principal on-chain cost analysis, canonical identifiers/encoding, privacy/UX, freeze ledger, and adversarial test plan. Supporting Foundry model in [`2026-07-11-efsv2-lens-review-corpus/`](./2026-07-11-efsv2-lens-review-corpus/).

### EFS v2 KEL and account foundation (2026-07-11)

- [`2026-07-11-kel-identity-foundation-review.md`](./2026-07-11-kel-identity-foundation-review.md) — deep identity/account verdict: freeze-breaking flaws in the old reservation, candidate comparison, native-EFS architecture, UX and cross-system consequences, owner choices, and external gates.
- [`2026-07-11-kel-research-corpus/`](./2026-07-11-kel-research-corpus/) — archived precedent, Ethereum-account/passkey, cryptographic red-team, and integration/completeness research behind the canonical `Designs/efsv2/kel.md` draft.

### Base native account abstraction impact (2026-07-19)

- [`2026-07-19-base-native-aa-impact.md`](./2026-07-19-base-native-aa-impact.md) — point-in-time review of Base's EIP-8130/Cobalt announcement against EFS v1 write attribution, the v2 envelope/KEL boundary, SDK/client submission rails, sponsorship, and large uploads; recommends a Vibenet compatibility spike while keeping Draft EIP constants out of Etched EFS formats.
