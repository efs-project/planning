# EFS Data Explorer — concise product spine

**Status:** draft set — separate typed-data workspace; no product implementation, packaging, route grammar, view ABI, or protocol choice is authorized
**Target repos:** planning, client, sdk
**Depends on:** [[../sdkv2/mvp-interface]], [[../web-client-os/README]], [[../efsv2/disposable-mvp-profile]]
**Inputs:** product and architecture evidence distilled from `origin/codex/data-explorer-pm` at `8d90ecbf85390f1151fa1b2dbf93852a1bfc8448`; its full roadmap, legacy result/experiment wire shapes, and branch-local rulings are not imported
**Reviewers:** —
**Last touched:** 2026-09-03

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/efsv2 #topic/read-path #topic/graph-queries #topic/app-model

## Read this on a phone

**Product:** a general EFS typed-data workspace for inspecting exact resources,
finite typed inventories, relationships, provenance, failures, and raw evidence.

**Boundary:** Data Explorer is an Inspector/view consumer over the shared SDK
Reader and action contracts. It is not the gateway for File Browser or exact
App routes, and it does not implement a second resolver, verifier, planner,
wallet flow, submitter, or read-back stack.

**Sequence:** File Browser remains the first thin guest and write-capable
journey. Data Explorer packaging is outside the MVP0 gate. Later Explorer work
may add configurable table, card, gallery, and graph views only after the same
raw-preserving qualified input works across multiple resource families.

## Product contract

The workspace owns navigation, tabs, selection, compare state, local layout,
view choice, and safe presentation. It consumes:

- exact read and scoped page results from [[../sdkv2/mvp-interface]];
- verified byte handles when a selected resource has bytes;
- the shared Inspector contract containing exact identifiers, canonical raw
  bytes, domain/basis, coverage, support, validation, authority, currentness,
  finality, integrity, availability, returned-byte state, effect, evidence,
  source observations, canonicality, and causal diagnostics; and
- optional shared action requests and receipts, if a later product gate enables
  writes.

The first useful workspace is deliberately small:

1. open an exact typed resource or finite scoped page;
2. show a safe built-in summary while retaining the full qualification matrix;
3. inspect raw bytes, identifiers, provenance, source attempts, and reasons;
4. export an exact citation/evidence handle; and
5. switch among only those built-in projections that accept the exact input.

Unknown or unsupported Types remain visible through raw inspection. A partial
page stays partial. A view that displays zero matching rows cannot turn
incomplete input into an empty authoritative result.

## Later view family

| View | Product value | Boundary |
|---|---|---|
| table | exact-Type rows and qualified finite inventories | filtering/sorting inherits input coverage; unsupported rows remain inspectable |
| card/gallery | human-scale browsing and verified passive previews | MIME, layout, and thumbnail availability confer no authority or integrity |
| graph | bounded typed references and competing evidence | layout and traversal do not create parentage, direction, completeness, or trust |
| raw/Inspector | durable fallback for known and unknown inputs | always available without optional projections or extensions |

Exact view schemas, queries, saved-view publication, executable extensions,
and domain-specific reducers remain future design work. None is required for
MVP0 and none may redefine the shared read or result law.

## Ownership and routing laws

1. An exact File Browser route calls the shared Reader directly and opens File
   Browser even if Data Explorer is missing, broken, or uninstalled.
2. A general typed-data route may choose Data Explorer explicitly, but that is
   product routing rather than protocol resolution or correctness authority.
3. Data Explorer may propose intent and render the shared action lifecycle; the
   SDK owns planning, authorization verification, submission, and canonical
   read-back. File Browser is the first product to exercise that path.
4. A view changes presentation only. It cannot change identity, basis,
   coverage, authority, currentness, integrity, availability, or effect.
5. Local workspace state and caches remain non-authoritative and removable.

## Explicitly outside the MVP0 gate

- Data Explorer packaging, default-route policy, and production deployment;
- rich table/card/gallery/graph behavior or editable typed data;
- saved/published views, extensions, executable renderers, and package flows;
- a new query grammar, Type identity, result enum, write stack, or wallet path;
  and
- claims that one Files fixture proves a general typed-data product.

## Open questions

No owner decision is requested by this contraction. A later Explorer gate must
choose one multi-family disposable corpus and view usability test before any
packaging or product-default claim.

## Pre-promotion checklist

- [ ] `**Target repos:**` confirmed
- [ ] Shared Inspector preserves every imported qualification axis and raw bytes
- [ ] Exact File Browser routes pass with Data Explorer absent
- [ ] Any write UI demonstrably reuses the SDK action/read-back seams
- [ ] At least one independent product-boundary review is recorded
