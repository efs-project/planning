# EFS 1.5 — the EAS-backed product bridge

**Status:** reference — map for a new draft design set; no contract or SDK change is accepted by this file
**Target repos:** planning, contracts, sdk, client
**Last reconciled:** 2026-08-07

#status/reference #kind/note #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efs15

EFS 1.5 is the shortest credible route from the deployed v1 system to real
Nanda and Arcade use without making the unresolved native v2 redesign an MVP
dependency. It deliberately keeps EAS as the carrier while backporting the two
v2 concepts James considers load-bearing now:

1. universal, carrier-independent EFS IDs; and
2. a bounded, tag-oriented graph vocabulary.

The first draft is [[requirements-and-boundaries]]. It records what is owner
direction, what is merely an MVP assumption, what can wait, and which debts
would force KEL or native v2 forward.

## One-screen boundary

- **Keep:** EAS's chain-local attester authentication/provenance, block time,
  revocation, shared schemas, resolver validation, and ecosystem
  interoperability where useful.
- **Change now:** semantic links, references, routes, slots, and indexes name
  predictable EFS objects rather than mined EAS attestation UIDs. Native EAS
  audit events and revocation calls still use typed receipt UIDs.
- **Keep simple for the MVP:** one visible authoring address per identity and
  explicit address/principal entries in lenses.
- **Do not copy blindly:** the exact five-kind v2 table and deterministic-ID
  formulas are reopened drafts. EFS 1.5 must re-derive an Arcade-grounded
  subset and publish its own vectors.
- **Do not promise:** portable historical authorship, globally current
  cross-chain state, KEL recovery/delegation, or automatic identity merging.
- **Do not replace v2:** 1.5 is a product bridge and source of evidence. Native
  portable v2 remains a separate long-term design track.

## Current spine

| File | Status | Purpose |
|---|---|---|
| [[requirements-and-boundaries]] | draft | Requirements, identity/lens simplification, debt register, and deep-dive questions |

There is no EFS 1.5 owner inbox yet. The next deep dive should first turn the
open questions into a small answerable packet; creating a queue before that
would make James review raw design work.

## Source precedence

Two different questions need two different ladders.

### What v1 actually does today

1. deployed bytecode, deployment records, and the [Sepolia freeze table](../../../contracts/docs/SEPOLIA_FREEZE_TABLE.md);
2. current contract code and tests;
3. [contract specs](../../../contracts/specs/) and accepted ADRs; then
4. current SDK implementation and specs.

### What EFS 1.5 is intended to become

1. James's recorded direction in [[Decisions]];
2. any future promoted EFS 1.5 design and landed target-repo ADR;
3. the current draft spine above;
4. deployed v1 evidence; then
5. v2 and client-v2 drafts as design inputs only.

Citing a v2 document does not import it into 1.5. EFS 1.5 also does not
supersede v2. Where a v2 file warns that it needs a coordinated re-cut, reuse
its invariant or failure analysis, not its literal formula.

## Primary inputs

- [[deterministic-ids]] — why EAS UIDs fail as object identity; formulas are
  explicitly not freeze-ready.
- [[codex-kinds]] and the
  [kind-set ruling](../../Reviews/2026-07-07-efsv2-corpus/kinds-ruling.md) —
  evidence for the bounded tag-core, not an adopted 1.5 byte layout.
- [[efs-account-system]] — historical one-account/many-signers design; useful
  because it keeps one EAS attester, but not wholesale authority.
- [[kel]] — the upgrade target and the list of capabilities 1.5 is deferring.
- [[wallet-and-actions]] — the weaker bilateral linked-address display
  convention and its limits.
- [[fable-handoff-portable-schemas-and-validators]] — the regression test for
  preserving EAS's good schema, discovery, resolver, and interoperability
  properties.
- [ADR-0026](../../../contracts/docs/adr/0026-max-lenses.md),
  [ADR-0031](../../../contracts/docs/adr/0031-lenses-url-param-model.md),
  [ADR-0041](../../../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md),
  and [ADR-0053](../../../contracts/docs/adr/0053-system-account-write-identity.md)
  — deployed-v1 evidence for lenses, edge cardinality, and contract-attester
  behavior.

## Environmental assumption to verify

James reports that no meaningful user data depends on the current v1 identity
model. That makes a resolver/schema redeploy plausible, but it is an
environmental assumption, not permission to destroy anything. The deep dive
must inventory live Sepolia data and dependent apps before choosing migration,
replacement, or compatibility behavior.
