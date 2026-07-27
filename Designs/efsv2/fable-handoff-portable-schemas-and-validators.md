# Fable handoff — portable schemas, validators, and EAS interoperability

**Status:** draft handoff — ready to launch; no architecture adopted here
**Target repos:** planning, contracts, sdk
**Depends on:** [[codex-envelope]], [[codex-kinds]], [[codex-kernel]], [[onchain-completeness]], [[read-lens-spec]], [[joined-pass-synthesis]]
**Owner steering:** James, 2026-07-27
**Last touched:** 2026-07-27

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #topic/efsv2

## Why this pass exists

Portability was meant to remove EAS's chain/deployment coupling, not its useful developer model.

James's regression test:

- developers can publish and reuse shared data schemas;
- users can browse and search for schema/types;
- applications and contracts can efficiently find records by type;
- contracts can enforce shape and application rules before treating data as valid;
- independently written applications can exchange data by agreeing on schemas; and
- real EAS data and tooling should remain interoperable where that does not weaken the portable model.

The current v2 corpus only partially demonstrates those properties. Do not answer this pass with "TAGDEF exists" or "the kernel validates records." Prove the full developer and contract-consumer loop.

## The key correction: EAS bundled concerns that v2 must separate

EAS combines:

1. a schema declaration;
2. a chain-local schema UID;
3. an opaque attestation payload associated with that UID;
4. an optional resolver callback that may apply arbitrary on-chain logic;
5. a chain-local attestation UID and stored attestation; and
6. optional indexes and explorer infrastructure.

One nuance matters: base EAS associates opaque `bytes data` with a schema UID; `EAS.sol` does not automatically decode the schema string and prove that the bytes match it. SDK codecs and, when present, the schema resolver supply that enforcement. EFS should preserve the useful developer contract while making the enforcement boundary explicit.

That bundling is convenient but causes the portability defect: EAS's schema UID hashes the schema string, resolver address, and revocability, while the attestation UID includes chain-produced time and the chain-local schema UID. The same semantic data does not naturally keep the same identity across venues.

EFS should investigate a layered model:

```text
portable schema descriptor ──> portable schemaId
                                  │
portable signed record ───────────┼──> portable claimId
                                  │
                     ┌────────────┴────────────┐
                     │                         │
          deterministic shape check   venue/app admission policy
          same answer everywhere      stateful, basis-labeled answer
                     │                         │
                     └────────────┬────────────┘
                                  │
                        validation/admission receipt
                                  │
                   indexes + lenses + EAS projections
```

The resolver or validator address, chain ID, admission time, and venue result must not enter the portable `schemaId` or `claimId`.

## What survived in current v2, and what did not

| Desired property | Current v2 analogue | Preliminary finding for Fable to verify |
|---|---|---|
| Shared semantic names | permanent, unowned `TAGDEF`s | **Survived for predicates/namespaces.** A TAGDEF is a shared Schelling point used for property keys, paths, categories, and typed edges. |
| Find records of type X | claims carry `definitionId`; forward and reverse indexes are being frozen around it | **Mostly survived for graph predicates.** Bounded pagination by a known definition is first-class. |
| Browse all available types | global schema enumeration is currently classified as off-chain; `owner-rulings` separately says a cheap paginated definitions index is James's call | **Contradictory/incomplete.** Full-text search can be off-chain, but canonical definition enumeration and point verification need an explicit answer. |
| Define an arbitrary application record shape | no clearly current portable schema descriptor beyond the five protocol kinds and TAGDEF vocabulary | **Not demonstrated.** A shared predicate is not automatically a typed multi-field record schema. |
| Enforce the declared shape | fixed kernel validation plus datatype/reserved-key rules | **Only protocol shapes survived.** Permissionless application-defined structural validation is not clearly present. |
| Enforce application rules | EAS-style arbitrary write-time resolver callbacks were removed; kernel instead requires admission confluence | **Intentionally removed from universal admission, but no complete replacement is documented.** |
| Contract composability | point reads, `definitionId` indexes, authority lane, receipts | **Strong ingredients, unfinished composition.** Contracts still need a standard "schema + validator + result + basis" surface. |
| EAS ecosystem access | a permissionless `EASExporter` is named | **One-way and underspecified.** Import, semantic mapping, resolver reuse, and native per-schema projections are open. |

The likely regression is precise: the five-kind/tag-core model may be a good universal **meta-model**, but it has not yet shown that independent developers can declare, validate, discover, and consume application-level data shapes as easily as they can with EAS.

## Requirements to lock before evaluating mechanisms

### R1 — Portable schema identity

A schema has a deterministic identity independent of chain, contract address, mutable resolver deployment, registrar, and discovery service. Canonicalization and hash-agility/versioning must be specified, not left to SDK convention.

### R2 — Shared and forkable

Anyone can reuse a schema without permission. Anyone can fork or extend it without overwriting history. Successor, compatibility, implements, and migration relationships are explicit data, not one mutable global pointer.

### R3 — Contract-decodable shape

The schema describes enough structure for SDKs and contracts to agree on canonical encoding, field names/types, optionality, bounds, and references. If the on-chain contract surface supports only a bounded subset, that subset and the richer off-chain profile must be explicit.

### R4 — Validation has named grades

Do not use one ambiguous word, "valid," for all of these:

- **well-formed:** envelope/signature/body are canonical;
- **schema-valid:** data deterministically conforms to the portable schema;
- **venue-admitted:** a named on-chain policy accepted it at a named state basis;
- **endorsed/trusted:** a lens or application accepts the schema, validator, author, or receipt; and
- **currently effective:** revocation, expiry, authority, and lens rules pass now.

Each result must say which layer produced it and against what basis.

### R5 — Portable structural validation

At least one validation profile must be deterministic and side-effect-free so the same schema and record produce the same answer in every implementation and venue. Validator code/spec identity must be portable and independently verifiable.

### R6 — Stateful contract admission without identity capture

Applications still need EAS-resolver-class rules: allowlists, balances, authority, payment, proof checks, uniqueness within a realm, side effects, and revocation policy. Those checks may legitimately differ by chain state. Their result therefore cannot define the portable record's identity or universal existence.

The design must show how a contract:

1. names a policy/validator;
2. checks a portable record;
3. records or exposes the result and state basis;
4. prevents replay/equivocation where relevant; and
5. upgrades or supersedes policy without changing the underlying record.

### R7 — Discoverable types and type use

Users can:

- page canonical schema/definition records;
- look up an exact `schemaId`;
- find schemas by publisher/namespace and declared relationships;
- search human metadata through replaceable indexers, then verify every result against canonical records; and
- page records using a known schema/type on-chain where the query is bounded.

Ranked/full-text global search does not need to run in a contract. "Search is off-chain" must not mean "types have no canonical enumerable catalog."

### R8 — Spam does not become endorsement

Registration and enumeration are permissionless. Search and defaults are lens-curated. A schema being present or popular never makes it official, safe, compatible, or trusted.

### R9 — EAS interoperability is loss-aware

Real EAS attestations can be preserved and referenced without pretending a chain-local EAS UID is portable semantic identity. EFS records can be projected into real EAS without pretending an exporter is the original author.

### R10 — Simple developer path

The happy path must remain approximately:

1. find or define a schema;
2. generate types/codec from it;
3. create a signed portable record;
4. optionally submit it to one or more venues/policies; and
5. query by `schemaId` and inspect validation provenance.

If developers must understand the five kernel kinds, several TAGDEF conventions, a lens, a validator registry, and an index layout for a basic shared record, the design has failed even if the primitives are technically expressive.

## Candidate architecture to attack, not assume

### A. Portable schema object

Create a canonical schema descriptor with a portable `schemaId`. Compare at least:

1. enrich `TAGDEF` so a definition can carry a shape;
2. add a dedicated `SCHEMA` object kind;
3. keep five kinds and represent a schema as a canonical DATA/manifest object referenced by a TAGDEF; and
4. keep schemas outside the kernel but standardize a portable registry adapter.

Measure byte/gas cost, contract decode cost, canonicalization risk, upgrade story, discovery, and whether each preserves one fact/one encoding.

Do not quietly equate a predicate definition with a record schema. Prove when they are the same abstraction and when they are not.

### B. Two validation lanes plus read-time policy

Explore:

- **portable validator:** pure/deterministic structural and semantic checks, pinned by spec hash, code hash, or a constrained validation program;
- **venue admission validator:** may read venue state, charge value, create side effects, or enforce realm rules; produces a basis-labeled admission receipt; and
- **lens/application policy:** decides which schemas, publishers, validators, receipts, and authors the reader trusts.

This is the central portability move. A stateful validator may say "not admitted here" without changing whether the signed portable artifact exists or what its ID is.

Determine whether portable validators are:

- a constrained declarative schema language;
- pure EVM contracts callable through `staticcall`;
- content-addressed Wasm modules;
- a small validation VM;
- generated Solidity plus conformance vectors; or
- profiles combining more than one of these.

Do not invent a VM unless existing standards or a much smaller mechanism fail the requirements.

### Prior art that must constrain the invention budget

Use existing systems as falsification targets, not as a shopping list:

- [EAS](https://docs.attest.org/docs/welcome) for the minimal schema + attestation + hook developer model;
- [AT Protocol Lexicons](https://atproto.com/guides/lexicon) for shared record schemas, generated types, validation, references/unions, and independent application interoperability;
- [IPLD Schemas](https://ipld.io/docs/schemas/) for typed content-addressed data and schema/data separation;
- [Verax portals and modules](https://docs.ver.ax/verax-documentation/core-concepts/high-level-overview) for separating application entrypoints, reusable validation modules, and the shared attestation registry; and
- ABI/EIP-712, JSON Schema, and CDDL as candidate existing shape/encoding vocabularies before proposing an EFS-specific language.

For each, state both the mechanism worth copying and the authority, portability, or contract-cost assumption EFS cannot inherit.

### C. Validation/admission receipts

Test a receipt that binds at least:

- portable `claimId`;
- portable `schemaId`;
- validator/policy identity and version/code hash;
- venue/realm;
- result;
- state basis or admission position;
- side-effect/result commitment where applicable; and
- authority provenance.

The receipt may be a native record, authority-lane state, or a queryable derived fact. It must not be confused with the portable claim itself.

### D. Definition and schema discovery

Resolve the corpus contradiction explicitly:

- bounded "records using known type X" is already a core indexed query;
- canonical "page definitions/schemas" appears cheap and was requested by James;
- ranked/full-text/global analytical search stays off-chain; and
- off-chain results remain verifiable by `schemaId`.

Specify what the kernel, a redeployable view/index contract, log indexers, and the SDK each own.

## Real EAS compatibility directions to prototype

### 1. EAS → EFS preservation

Wrap a real EAS attestation as a foreign-origin portable record carrying:

- origin chain ID;
- EAS contract;
- EAS UID and schema UID;
- full attestation fields/data or a durable commitment plus proof;
- the EAS schema record;
- resolver result/provenance where provable; and
- an optional explicit mapping to a portable EFS `schemaId`.

The wrapper's ID should be deterministic, but origin-scoped. It proves "this EAS attestation existed at this origin," not "this was originally a chain-free EFS claim."

### 2. EFS → EAS generic mirror

Register a generic EAS schema such as:

```text
bytes32 claimId, bytes32 portableSchemaId, bytes32 envelopeHash, string uri
```

The EAS attestation is a discoverable venue receipt/mirror. The exporter is honestly the EAS attester unless the original author explicitly produces an EAS delegation.

### 3. EFS → EAS native schema projection

For high-use portable schemas, optionally register an EAS-native schema and codec mapping so existing EAS applications can decode fields directly. Treat `schemaUID ↔ portableSchemaId` as an explicit, versioned, many-to-one mapping. The EAS schema UID is a venue locator, never the semantic schema identity.

### 4. EAS resolver as an admission adapter

Test whether an existing EAS resolver can validate an EFS portable payload submitted through an EAS projection. Its outcome is an EAS-venue admission result/receipt, not portable universal validity.

### 5. EAS attestations as references

Retain a foreign-reference target mode or typed origin record so EFS graph edges can point to EAS attestations without copying or reinterpreting them. Compare this with full preservation wrappers and specify when each is safe.

## Terminology collision to fix

The corpus currently uses **resolver** for two different mechanisms:

- an EAS-style write-time schema hook that admits/rejects and may cause side effects; and
- an EFS read-lens resolver that combines evidence and returns a graded view.

The pass should recommend distinct terms. Working vocabulary:

- **schema validator / admission policy** for write-time checks; and
- **read resolver** for lens evaluation.

Without this split, design discussions will accidentally move guarantees between write time and read time.

## Adversarial questions Fable must answer

1. Are TAGDEFs actually sufficient for arbitrary multi-field application records? Show three non-filesystem examples with generated codecs and on-chain consumers.
2. Does EFS validate canonical encoding and shape, or merely associate opaque bytes with a type name?
3. Which checks are deterministic across venues, and which depend on mutable state?
4. Can a stateful failure poison cross-chain replication or whole-envelope atomicity?
5. Can a malicious validator reenter, consume unbounded gas, censor a schema, or make records permanently non-portable?
6. How does a validator upgrade without changing `schemaId`? When should a new schema version be required instead?
7. How are backward/forward compatibility, unknown fields, unions, and schema migration expressed?
8. Can a contract cheaply answer "give me/page records of schema X," and can a user browse the schema catalog?
9. How are spam schemas separated from trusted/recommended schemas without centralizing registration?
10. Can schema names be squatted? If names are only labels, does content identity remain usable?
11. Does the schema descriptor itself remain readable and verifiable if its original publisher disappears?
12. What happens when two schemas have identical shape but different semantics?
13. Can private/encrypted records disclose their schema without unacceptable metadata leakage? If not, what is the honest private profile?
14. Can existing EAS data round-trip without losing attester, recipient, refUID, revocation, resolver, and origin semantics?
15. Does the easy SDK path feel simpler than EAS, not merely more correct?

## Required grounding workloads

Build design-level traces for:

1. **Shared profile:** two unrelated apps reuse a profile schema and one adds a compatible optional field.
2. **Credential with proof:** a resolver verifies a ZK proof or issuer allowlist before venue admission.
3. **Marketplace listing:** structural validation is portable; venue policy checks ownership and prevents duplicate live listings.
4. **Moderated social record:** record exists portably; a community policy admits/endorses it; a different community refuses it.
5. **Package manifest:** contract and SDK decode the same versioned dependency schema and query packages by type.
6. **Foreign EAS credential:** preserve a real EAS attestation, map its schema when possible, and query/reference it from EFS.
7. **EAS explorer export:** project an EFS-native claim into EAS and show exactly which provenance is original versus derived.
8. **Cross-chain replay:** same signed record and schema land on two chains where a stateful admission policy produces different results; identities stay the same and the difference is explicit.

## Deliverables

Fable should return:

1. a requirements verdict and any required corrections to this handoff;
2. a property-by-property EAS → current-v2 → proposed-v2 comparison;
3. at least three candidate architectures, including the smallest additive option;
4. threat models for schema canonicalization, validators, discovery spam, and interop;
5. complete traces for the eight workloads;
6. a recommended schema/validator/discovery architecture with rejected alternatives;
7. a freeze-impact table: new kind/body/ID/index/ABI/reserved-key surface versus Durable adapters;
8. an EAS import/export/projection specification outline;
9. SDK and contract-consumer happy paths;
10. executable-vector and prototype plan; and
11. a small owner decision packet only after the evidence converges.

## Primary EAS sources

- [EAS contracts repository](https://github.com/ethereum-attestation-service/eas-contracts)
- [SchemaRegistry.sol](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/SchemaRegistry.sol) — permissionless registration; schema UID includes schema string, resolver address, and revocability
- [EAS.sol](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/EAS.sol) — chain-produced attestation storage/UID and resolver invocation
- [SchemaResolver.sol](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/resolver/SchemaResolver.sol) and [resolver guide](https://docs.attest.org/docs/tutorials/resolver-contracts) — arbitrary schema-level validation/side effects
- [Indexer.sol](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/Indexer.sol) — paginated attestations by schema/attester/recipient; it does not itself enumerate registered schema definitions
- [EAS core concepts](https://docs.attest.org/docs/welcome)

## Launch note

This pass overlaps the scheduled lens/resolver work only in terminology and trust composition. Keep the scopes distinct:

- this pass owns **shared application schemas, structural validation, write-time admission, type discovery, and EAS interoperability**;
- the lens pass owns **how readers choose and combine evidence**.

They should exchange inputs, but neither should silently absorb the other.

**Sequencing recommendation:** run this as a bounded pass immediately before the read-lens resolver pass. It can change the Etched kind/body/ID/index surface, while the lens pass should consume its schema-trust and admission-grade vocabulary. If both run concurrently, this pass must deliver that interface contract first.

## Open questions

- [ ] James confirms the sequencing recommendation: schema/validator pass immediately before the read-lens resolver pass.
- [ ] Is a schema catalog an Etched kernel index, a redeployable view/index contract, or both?
- [ ] Is the smallest viable portable schema language ABI-like fields only, or does v2 need richer constraints?
- [ ] Must every venue admit all structurally valid records to the evidence lane, with policy results separate?

## Pre-promotion checklist

- [ ] Current v2 authority and historical EAS claims reverified against source
- [ ] All eight workloads traced
- [ ] Freeze-impact table complete
- [ ] Dedicated adversarial review
- [ ] Owner packet compressed and sequencing hold respected
