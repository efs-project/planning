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

The active draft is [[requirements-and-boundaries]]. The completed
[[2026-08-07-efs-v2-to-15-deep-dive]] found that 1.5 is a viable contraction,
but not an SDK alias: it needs sibling 1.5 EAS schemas pointing to one immutable
semantic router/registry-index/view authority while frozen v1 receipts
remain legacy evidence.
The draft now records the finite freeze/prototype gates and the debts that
would force KEL or native v2 forward.

## One-screen boundary

- **Keep:** EAS's chain-local attester authentication/provenance, block time,
  revocation, shared schemas, resolver validation, and ecosystem
  interoperability where useful.
- **Change now:** semantic links, references, routes, slots, and indexes name
  predictable EFS objects rather than mined EAS attestation UIDs. Native EAS
  audit events and revocation calls still use typed receipt UIDs.
- **Deploy additively:** new 1.5 payloads carry EFS IDs and semantic references;
  native EAS `refUID` is normally zero; the shared router recomputes IDs through
  shared realm state. Semantic state groups lineage, exact-record, and edge
  receipts separately and then resolves
  slot heads with a stored admission ordinal. Do not reinterpret frozen v1
  schemas.
- **Keep four semantic roles:** shared TAGDEF, stable owned DATA lineage,
  cardinality-one PIN, and cardinality-many TAG. Exact typed bytes receive a
  body-bound RecordVersionId; LIST remains conditional.
- **Preserve shared schemas:** publisher-qualified universal TypeId and
  encoding-only ShapeId remain distinct from origin-scoped physical EAS schema
  references and versioned validator/admission-policy bindings; anyone may
  reuse a registered type.
- **Keep exact links exact:** stable paths/channels may move by PIN, while
  immutable RecordVersionIds, citations, byte digests, and transport locators
  stay distinct.
- **Read honestly:** realm, basis, unknown/partial/completeness, truncation, and
  policy source are explicit; hostile content cannot choose the policy that
  authorizes itself.
- **Keep simple for the MVP:** one visible authoring address per identity and
  explicit address/principal entries in lenses.
- **Do not copy blindly:** the exact five-kind v2 table and deterministic-ID
  formulas are reopened drafts. EFS 1.5 must re-derive an Arcade-grounded
  subset and publish its own vectors.
- **Do not promise:** portable historical authorship, globally current
  cross-chain state, KEL recovery/delegation, or automatic identity merging.
- **Do not replace v2:** 1.5 is a product bridge and source of evidence. Native
  portable v2 remains a separate long-term design track.
- **Keep Arcade above the core:** game project/release/package shapes, slugs,
  mirrors/provenance, runner capabilities, and curator principal are an Arcade
  portable profile/deployment over generic typed-reference and graph seams.

## Current spine

| File | Status | Purpose |
|---|---|---|
| [[requirements-and-boundaries]] | draft | Requirements, identity/lens simplification, EAS sibling profile, semantic graph/schema/read/file boundaries, freeze gates, and debt register |
| [[efs-id-1-candidate]] | draft spec | Concrete object/type/record/slot/binding candidate, exact on-chain type descriptor and EAS schema spelling, coherent `/Arcade/` smoke vectors, receipt/slot fold, and independent-review/fork gates before freeze |
| [[2026-08-07-efs-v2-to-15-deep-dive]] | completed review | V2 disposition, v1/live feasibility, product traces, implementation order, and the one next action |
| [`v2-to-1.5 corpus`](../../Reviews/2026-08-07-efs-v2-to-15-corpus/README.md) | supporting review | Detailed disposition, migration, traces, and adversarial audit trail |

There is no EFS 1.5 owner inbox yet. The deep dive deliberately did not create
a broad decision queue. Designers can close the ID/schema/receipt/fork gates
first. The owner needs a narrow choice of stable official Arcade curator
principal/realm only before the first valuable durable write.

## Current implementation boundary

Architecture is ready for a bounded freeze/prototype pass, not a production
deploy. The standalone [[efs-id-1-candidate]] now makes the object, type,
record, field, binding, schema-string, and module-call byte choices concrete
and includes recomputed smoke vectors. The highest-leverage next step is one
independent Solidity/TypeScript differential and fuzz harness over that whole
freeze surface. The generic typed-reference index, receipt/read fold, and
schema revocability/canonical-ABI table must close with it. Then a fork of the
actual Sepolia deployment must prove the
sibling schema profile, atomic graph write, rollback, races, receipt folding,
state reconstruction, and v1 coexistence.

Guest Arcade browse/play UI may continue behind an adapter. Any v1 seed made
before those gates is explicitly disposable/reseedable; v1 DATA cannot be
promised a lossless author-preserving migration.

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

## Live-state warning

The point-in-time deep-dive read at Sepolia block `11,441,982` found 1,654 v1
records, including 107 DATA from seven attesters. That does not prove the data
is valuable production state, but it disproves “empty.” It must be classified
before abandonment. Live resolver behavior also differs from current source in
at least one measured constant (`MAX_ANCHOR_DEPTH` is `32` live and `256` on
current main), so deployed bytecode remains the migration authority.
