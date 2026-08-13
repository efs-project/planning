# EFS 1.5 — historical EAS-bridge evidence

**Status:** reference — superseded implementation target; preserved design evidence
**Target repos:** planning, contracts, sdk, client
**Last reconciled:** 2026-08-12

#status/reference #kind/note #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efs15 #topic/efsv2

EFS 1.5 was a one-day contraction exercise: keep EAS as a carrier while adding
universal semantic IDs, a bounded graph, shared portable Types, admission
evidence, and honest reads. James's August 8 greenfield ruling superseded it as
an implementation and freeze target. There is no v1 support, migration,
coexistence, legacy-read, sibling-schema, or EAS-carrier requirement in EFS
2.0.

Do not implement these documents, route new product work to them, or treat
their exact IDs and vectors as the successor namespace. Read the active
[[../efsv2/README|EFS 2.0 spine]] instead.

## Why this work is still valuable

The deep dive remains unusually concrete evidence for the greenfield design:

- why mined EAS UIDs fail as semantic object IDs;
- how stable subjects, exact Record versions, carrier receipts, slots, and
  authored edges differ;
- the developer value of reusable Types/shapes, validators, by-Type queries,
  and loss-aware EAS interoperability;
- exact graph cardinality, retry, CAS, revocation, no-resurrection, basis,
  completeness, and pagination requirements;
- the cost and redundancy of carrying an EAS resolver prefix in every Record;
- cross-language ID vectors, deployment-origin qualification, module/binding
  evidence, and hostile-receiver implementation warnings;
- Arcade Project/Release/Artifact separation and the need for generic typed
  references/backlinks; and
- the finding that EAS can carry one-transaction semantic references only after
  EFS builds its own identity/router/index layer—evidence for keeping EAS an
  optional adapter rather than Core.

## Evidence map

| File | Standing | Use |
|---|---|---|
| [[requirements-and-boundaries]] | superseded design | Detailed survivor requirements, EAS feasibility, graph/read semantics, and debt ledger. Mechanisms are historical. |
| [[efs-id-1-candidate]] | superseded candidate spec | Exact formulas, Type/Shape/reference work, EAS schema spellings, vectors, receipt folds, and freeze hazards to attack or reuse only under new domains. |
| [[2026-08-07-efs-v2-to-15-deep-dive]] | completed review | V2/v1 disposition, implementation feasibility, and product traces at the time. |
| [`v2-to-1.5 corpus`](../../Reviews/2026-08-07-efs-v2-to-15-corpus/README.md) | supporting review | Independent feasibility, invariants, product, schema, and adversarial lanes. |

## Rules for reuse

1. Reuse a requirement, test, or failure analysis only after mapping it to
   [[../efsv2/system-constitution]].
2. Do not reuse an ID domain with a changed preimage. New semantic bytes require
   a new version/domain and fresh vectors.
3. Do not copy the seven-word EAS carrier prefix, physical SchemaUID/binding,
   sibling-schema architecture, v1 receipt mapping, or fork/deployment plan.
4. Treat EAS support as an optional import/export/projection profile that must
   demonstrate a named user or contract benefit.
5. Preserve the review corpus and live-state observations as history; do not
   rewrite them to sound greenfield.

The current work order is in [[../efsv2/core-architecture-candidate]], not here.
