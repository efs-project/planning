# EFS 2.0 — Disposable MVP-C0 Core/Files profile

**Status:** draft — bounded Stage B control, not a protocol or product profile
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[core-architecture-candidate]], [[hierarchical-files-and-folders]], and the [Stage A corpus](../../Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md)
**Companion:** [[mvp-c0-genesis-manifest]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-09-03

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/content #topic/read-path #topic/coherence

> **Authority boundary.** This profile exercises the already permitted
> disposable Core Stage B comparison. It does not authorize Web Client or
> product implementation, public or permanent deployment, durable user data,
> promotion, or a semantic freeze. The controlling correction is the
> [[2026-09-02-efs2-coherence-and-mvp-readiness-review-errata|coherence review
> errata]]; the review remains evidence rather than authority.

## Problem

The EFS v2 design has enough exact proposal-stage material to run a useful
Core/Files experiment, but no single document currently says which temporary
choices compose one runnable control. The result is either paralysis while
permanent bakeoffs remain open or accidental adoption because the first code
silently picks a Type model, carrier, Principal, signature ceremony, or result
vocabulary.

MVP-C0 is the smallest write-capable control that closes those experiment-only
gaps. It is deliberately namespaced and disposable. Its output is evidence for
the permanent bakeoffs, not the winner of them.

## 1. Experiment contract

### 1.1 Included

One MVP-C0 run contains:

- one fresh local EVM Realm and one atomic experimental Core;
- one synthetic bootstrap EOA represented by the B0 intrinsic account
  Principal, with relayer/payer kept separate;
- the B0 bundled Type/index-identity arm, extended inside the C0 namespace with
  the genesis-only `KIND_BINDING_SCOPE` capability required to prove complete
  directory listing;
- exact Type admission through Stage A SR-17;
- one root Directory, one namespace Plan, one content Plan, one public Mount,
  and one Route established by [[mvp-c0-genesis-manifest]];
- point lookup, bounded complete listing, exact file read, and verified byte
  range read at one committed Realm basis;
- create-empty-directory, create-small-file, and publish-file-revision, each by
  one Principal and one atomic Core transaction;
- one normal EOA `WritePlan` approval per write, one direct-EOA transaction
  fallback per write, and one bounded smart/session permission path; and
- canonical read-back plus a second implementation's state-only reconstruction
  of Types, Records, Occurrences, admissions, Bindings, scope postings, Files
  roots, and retained EOA witnesses.

The first run uses only synthetic names and bytes. A public testnet run, even a
disposable one, is a separately authorized follow-up because public state
cannot be destroyed.

### 1.2 Excluded

MVP-C0 does not include:

- Arcade or any other founding product, public corpus, steward, or brand;
- a shipped File Browser, EFS OS, Data Explorer, native mount, service worker,
  or production repository choice;
- rename, move, unlink, overwrite certification, cross-Principal atomicity, or
  `FILES_PRECONDITION_CERTIFIED`;
- cross-Realm mutation or a Commons dependency;
- managed Principals, KEL, recovery, persona linkage, account migration, or a
  claim that lost keys can be recovered;
- a permanent byte tier, custody promise, numeric file-size limit, Type/query
  identity choice, Realm venue, upgrade policy, contract topology, or release
  ABI; or
- mainnet, permanent deployment, migration, v1 compatibility, or production
  security/conformance claims.

### 1.3 Namespacing and non-adoption

Every C0-only domain string, Type name, contract name, fixture ID, generated
package, receipt, and exported manifest begins with or commits to
`efs2/mvp-c0/2026-09-03`. Each run adds a random `runId` and a source/toolchain
commitment. A value without both markers is not an MVP-C0 artifact.

No C0 Realm is upgraded in place to change semantics. A change to canonical
bytes, Type/index capability, WritePlan grammar, authority behavior, carrier,
or result interpretation creates a new `runId`, new experiment commitment,
new contracts, and new Realm. Older runs remain readable evidence and are
marked retired; they are never relabeled conformant.

## 2. Temporary control choices

| Surface | MVP-C0 control | What remains open |
|---|---|---|
| Type/query identity | Stage A B0 bundled `TypeSchemaId`, including all declared index obligations; `KIND_BINDING_SCOPE` is added to the same C0-only bundle at genesis | layered semantic Type/shape/representation/validation/QueryProfile split |
| Principal | intrinsic account Principal; EOA first, Realm-qualified smart account/session experiment second | tagged author surface, managed Principal, succession, recovery, portable contract identity |
| Realm | fresh local EVM chain, one atomic Core, immutable for the run | venue, upgradeability, Commons, physical module split |
| Files | root Directory; one-Principal namespace/content Plans; bounded complete listing; create directory/file/revision | multi-Principal writes, certified exclusivity, rename/move/delete, private and cross-Realm mounts |
| bytes | separate state-readable small-byte carrier selected and bounded per run | production carrier mix, economic tier, permanent maximum, long-term custody |
| authorization | one composite EIP-712 `WritePlan` for the normal relayed EOA path | detachable realm-neutral authorship grammar and permanent delegation/account profile |
| results | four-outcome point law plus orthogonal qualification dimensions | product-specific presentation enums and a permanent wire ABI |

The Type/query seam stays explicit in SDK-facing data even though C0 implements
only the bundled arm:

```text
TypeProfileRef =
  BUNDLED_B0_C0 { typeSchemaId }
  | SPLIT_FUTURE { semanticTypeId, representationId, queryProfileId }
```

`SPLIT_FUTURE` is a reserved adapter shape, not a decodable C0 value and not
evidence that those identifiers have been designed. Code that assumes
`queryProfileId == typeSchemaId`, omits the discriminator, or exposes a second
mutable index identity fails the C0 seam test.

## 3. Principal honesty

The bootstrap and normal EOA arm use the Stage A intrinsic account Principal.
It requires no prior registration transaction. The Principal is the semantic
author reference; actual signer, relayer, payer, Realm, authority basis, and
verification profile remain separately inspectable. The proposal-stage source
is [Stage A's Principal/authority chapter](../../Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md).

For the EOA arm, Core persists the exact canonical `WritePlan` bytes and the
accepted low-s secp256k1 witness needed for a second implementation to recover
the signer. Reconstruction must independently recompute the typed-data digest,
recover the EOA, derive the account Principal, and compare all four with the
admission receipt. A stored `valid=true` bit or event is not sufficient.

This does not solve key loss. Until a separately reviewed managed-Principal or
account-migration profile exists, loss or theft of the EOA can strand or
capture that Principal's current Bindings. C0 uses synthetic data precisely so
that this known limitation creates no user dependency.

For contract accounts, retained call bytes and the historical authority/code
basis show what Core accepted, but a later reader cannot replay a time-varying
ERC-1271 verdict as timeless authorship. Such evidence is labelled
Realm-and-basis-qualified. C0 never promotes it to detachable portable proof.

## 4. One-approval write law

### 4.1 One composite approval

The normal EOA path presents exactly one wallet approval: one EIP-712 signature
over `WritePlan/1`. A relayer or other payer submits the resulting transaction;
the EOA is not then asked to approve a second transaction.

The typed value commits to two separately recomputable meanings:

```text
C0RealmEffects/1 {
  realmId                bytes32
  core                   address
  routeConfigId          bytes32
  operationKind          uint8
  envelopeId             bytes32
  leafMask               uint64
  expectedRevisionsHash  bytes32
  stateByteStore         address
  byteCommitment         bytes32
}

realmEffectsDigest = keccak256(abi.encode(
  keccak256("efs2/mvp-c0/realm-effects/1"), realmId, core, routeConfigId,
  operationKind, envelopeId, leafMask, expectedRevisionsHash,
  stateByteStore, byteCommitment))

WritePlan/1 {
  c0ProfileId          bytes32
  publicationDigest   bytes32
  realmId              bytes32
  realmEffectsDigest  bytes32
  executor             address
  executorCodeHash     bytes32
  nonceKey             uint192
  nonceSeq             uint64
  notAfter             uint64
}

EIP712Domain {
  name              = "EFS2-MVP-C0-WritePlan"
  version           = "1"
  chainId           = selected C0 chain
  verifyingContract = selected C0 Core
}

WRITE_PLAN_TYPESTRING =
  "WritePlan(bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)"
WRITE_PLAN_TYPEHASH = keccak256(bytes(WRITE_PLAN_TYPESTRING))
writePlanStructHash = keccak256(abi.encode(
  WRITE_PLAN_TYPEHASH, c0ProfileId, publicationDigest, realmId,
  realmEffectsDigest, executor, executorCodeHash,
  nonceKey, nonceSeq, notAfter))
writePlanDigest = keccak256(0x1901 || domainSeparator || writePlanStructHash)
```

`operationKind` is closed for C0:

```text
1 = ADMIT_TYPE_GROUP
2 = CREATE_DIRECTORY
3 = ADMIT_RESOLUTION_PLANS
4 = ADMIT_MOUNT_CONFIG
5 = ADMIT_MOUNT
6 = ADMIT_ROUTE_CONFIG
7 = ADMIT_BOOTSTRAP_SEAL
8 = CREATE_SMALL_FILE
9 = PUBLISH_FILE_REVISION
```

Zero and all other values reject. Kinds 1 and 3–6 are legal only before the
bootstrap seal; kind 7 is legal exactly once; kinds 2, 8, and 9 are the runtime
Files subset. `routeConfigId` is exactly zero for pre-Route bootstrap kinds
1–6, and it is the manifest-pinned nonzero Route for the seal and every later
write. `stateByteStore` is always the manifest-pinned carrier. The byte
commitment is nonzero only for the two byte-writing kinds and exactly zero for
the others. `expectedRevisionsHash` commits the strictly ordered CAS vector,
including an exact empty-vector hash when none applies.

`publicationDigest` is the portable digest of the exact Principal, ordered
Record leaves, and publication context. `realmEffectsDigest` commits to the
exact Realm, Core, selected leaves, expected Binding revisions, operation kind,
Route, byte-store commitment when present, nonce lane, and expiry. The Core
recomputes both before mutation; omission, reordering, substitution, expiry,
wrong executor/code, stale CAS, or a different byte commitment reverts the
whole call.

One signature therefore approves both the publication and its exact local
effects without collapsing their meanings. Because the EIP-712 domain is
Realm/chain/Core-bound, this arm does **not** claim an independently detachable
realm-neutral authorship signature. That stronger property requires either:

1. an additional author signature over the realm-neutral publication digest;
   or
2. a prior bounded delegation whose signed scope explicitly authorizes the
   publication profile.

Neither is smuggled into the one-prompt claim. The second option is the session
experiment in §4.3, not a permanent delegation design.

### 4.2 Separate meanings and receipts

The SDK and any Inspector preserve these stages separately:

| Evidence | Means | Does not mean |
|---|---|---|
| authorship/publication receipt | the signer approved the exact publication digest as part of this composite C0 plan | detachable realm-neutral authorship |
| authorization receipt | Core accepted the WritePlan witness for the exact Realm effects under the named authority basis | transaction inclusion, effect, or finality |
| submission receipt | one transaction/user-operation was submitted by the named payer through the named transport | EFS admission or canonical state |
| EVM transaction receipt | that transaction executed or reverted at one chain basis | canonical IDs/read results, byte availability, or finality |
| admission/effect receipts | Core committed the selected Occurrences and exact Binding/index effects atomically | verified external bytes or product success |
| canonical read-back | an independent read recomputed IDs and observed the expected post-state at a committed basis | permanence, global currentness, or future availability |

The operation is reported successful only after canonical read-back agrees with
the plan and admission/effect receipts. Wallet acknowledgement, signature
creation, a relay job ID, transaction hash, and even a successful transaction
receipt are earlier evidence states, not canonical EFS success.

### 4.3 Smart/session-wallet path

A smart account may approve one initial bounded and revocable session grant.
The grant binds at least:

- C0 profile, Realm, Core, executor/code hash, and session public key;
- allowed operation kinds: create directory, create small file, publish
  revision;
- allowed root/Route and Principal;
- per-operation and aggregate byte/value/gas ceilings;
- nonce domain, expiry, and an on-chain revocation location; and
- whether a relayer or paymaster may submit.

After that grant is canonical and independently read back, the session key may
sign routine WritePlans without a wallet prompt. The target is zero routine
wallet prompts, not zero signatures, zero policy checks, or zero receipts. The
client rechecks expiry, revocation, scope, executor code, and ceilings before
each signature and Core checks them again. A wallet acknowledgement or bundler
receipt never substitutes for canonical read-back.

If the grant is missing, expired, revoked, over budget, or unavailable at the
required basis, the client returns `UNKNOWN` or a typed authorization failure;
it does not silently fall back to a broader wallet permission.

### 4.4 Direct EOA fallback

When relaying or typed-data support is unavailable, the same EOA may call the
C0 Core directly in one transaction prompt. Calldata contains the exact
publication and Realm-effect plan; Core requires `msg.sender` to derive the
named account Principal and applies the same validation, CAS, atomicity, and
read-back rules.

This is a different and weaker authorship evidence profile. The EVM transaction
signature proves a chain-local transaction sender, while Core state records
the resulting Realm-qualified admission; it does not retain a separate
portable publication signature. The UI and receipt say
`DIRECT_EOA_TRANSACTION_AUTHORSHIP`, never `PORTABLE_AUTHORSHIP`. The fallback
must not first ask for a WritePlan signature and then ask for a transaction;
that would violate the one-prompt target.

## 5. State-readable small-byte carrier

C0 deploys a separate `MvpC0StateByteStore`, not a new File or Record identity.
It accepts exact bytes, checks the committed `ChunkTree/1`/digest, and exposes
bounded `read` and `readRange` from current contract state. Reconstruction uses
state/code and proofs, never old calldata, logs, a gateway database, or an
operator's private cache. This instantiates the optional
[Stage A byte-store seam](../../Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md#11-the-venue-byte-store-seam-sketch-only--not-part-of-b0-core)
only inside the C0 namespace.

The identities remain distinct:

```text
File Object         stable logical file
FileRevision        immutable selected generation
ChunkTree/digest    exact byte identity and range geometry
carrier handle      where this run stored those bytes
Locator             authored claim connecting retrieval to the carrier
availability        observed ability to obtain and verify bytes at a basis
```

Finding a File or Locator does not imply available bytes. Missing carrier data
is `bytes=UNAVAILABLE` or `bytes=UNKNOWN`, never `ABSENT_PROVEN` for the File.
The carrier address/code hash and exact capability are committed by the run
manifest and Route evidence; the carrier never becomes a hidden singleton.

There is no permanent numeric file cap. Each run measures candidate sizes and
records `maxStateFileBytes` and `maxReadRangeBytes` in its immutable experiment
parameters. The contract enforces those run-local values. The selected size is
the largest tested candidate that satisfies the declared transaction-gas,
state-growth, cold-read, proof, and client-memory margins. Changing it creates
a new run/profile commitment; C0 evidence cannot be quoted as a protocol limit.

## 6. Canonical point-result law

Every C0 point read returns exactly one top-level outcome:

```text
FOUND | ABSENT_PROVEN | UNKNOWN | CONFLICT
```

This contracts the proposal-stage
[B0 Lens outcomes](../../Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md)
without discarding their fail-closed basis and completeness discipline.

It also returns orthogonal qualification dimensions; they are never folded
into the outcome or into one `ok` bit:

```text
PointResult<T> {
  outcome
  value?       // present only for FOUND
  domain       // exact Realm, query/profile, subject and key
  basis        // block hash/state root/Realm revision/admission high
  coverage     // COMPLETE | PARTIAL | UNKNOWN
  support      // SUPPORTED | UNSUPPORTED | UNKNOWN
  validation   // VALID | INVALID | UNKNOWN
  bytes        // NOT_APPLICABLE | AVAILABLE_VERIFIED | UNAVAILABLE | UNKNOWN
  effect       // NOT_APPLICABLE | PLANNED | AUTHORIZED | SUBMITTED |
               // ADMITTED | READ_BACK_VERIFIED | REVERTED | UNKNOWN
  evidenceCommitment
  reasonCode?
}
```

Rules:

1. `FOUND` means one value is selected under the named point rule at the exact
   basis. It does not imply bytes, finality, currentness elsewhere, or write
   success.
2. `ABSENT_PROVEN` requires supported and valid evaluation over complete
   coverage of the whole named domain at the committed basis.
3. `UNKNOWN` covers unavailable basis/evidence, incomplete coverage,
   unsupported profile, indeterminate validation, resource exhaustion, and
   unavailable required authority history. It never falls through to a lower
   source or becomes absence.
4. `CONFLICT` preserves incompatible values/evidence that the named rule cannot
   lawfully collapse. It never becomes either value or absence.
5. A merged result is `ABSENT_PROVEN` only when **every** input is
   `ABSENT_PROVEN`, complete, supported, and valid for the **same committed
   basis and domain**. Any basis/domain mismatch, `PARTIAL`, `UNKNOWN`, invalid
   input, or unsupported input makes the merged result `UNKNOWN`; any material
   unresolved disagreement is `CONFLICT`.
6. An empty page, zero value, missing RPC response, missing Locator, or failed
   provider is not proof of absence.

Files-specific states such as not-a-directory, malformed selected evidence,
masked, resource limit, or byte-integrity failure remain typed reason/effect/
validation/bytes detail around this point law. They do not grow a second
competing universal point-outcome enum.

## 7. Stop and destruction rules

Stop the run before further writes if any of these occurs:

- independent code computes a different Type, Record, Envelope, Principal,
  WritePlan, Realm, receipt, File, Plan, Mount, Route, or post-state digest;
- a point or merged read turns incomplete/unavailable evidence into absence;
- Type or index admission can occur outside the committed C0 bundle, or a
  writer can bypass mandatory indexing;
- `BindingScope` was not active before the first Files Binding;
- normal EOA or direct fallback needs more than one user prompt;
- a session write escapes its grant, continues after revocation/expiry, or is
  reported successful before canonical read-back;
- EOA witness reconstruction depends on logs, historical calldata, or trust in
  Core's stored verdict;
- carrier reads cannot be verified from state or conflate availability with
  File identity; or
- the measured gas/state/read budget has no bounded passing file size.

On stop or completion:

1. disable the run in every client/SDK manifest and mark its RealmId retired;
2. revoke every session grant and stop relayers/paymasters;
3. retain exact non-secret source refs, toolchains, manifests, vectors,
   receipts, measurements, and falsification evidence;
4. delete disposable local keys, funded-account secrets, local chain state,
   caches, gateways, and deployments that are actually erasable; and
5. state explicitly that public-chain bytes, if a later authorized testnet run
   occurs, cannot be destroyed by this procedure. `SELFDESTRUCT`, endpoint
   shutdown, or lost keys are never described as chain-data erasure.

No run becomes a default, dependency, seed, or production migration source
merely because it passed.

## Open questions

- [ ] **Evidence gate:** run the declared byte-size/gas/state/read sweep and
  record the selected per-run caps before a valid genesis manifest is sealed.
- [ ] **Evidence gate:** independently implement the composite WritePlan digest,
  direct fallback, retained EOA witness verification, and revocable session
  path; stop on any divergent digest or prompt count.
- [ ] **Evidence gate:** prove complete listing from genesis-time
  `BindingScope`; if it fails, relabel listing `PARTIAL` and do not substitute a
  hosted index.
- [ ] **Evidence gate:** complete the state-only second-reader reconstruction
  and Realm-retirement drill before C0 evidence can inform a permanent design.

No permanent Type/query-axis answer, carrier limit, Principal model, product
choice, or freeze decision is required merely to run these gates.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [x] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies accepted or landed
- [x] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

MVP-C0 is disposable Stage B evidence. Use a new isolated implementation
worktree and local Realm per semantic revision. The future SDK and File Browser
acceptance overlay consume this profile but do not inherit implementation
authorization from it.
