# EFS v2 SDK — MVP-C0 interface contraction

**Status:** draft — disposable five-seam consumer contract, not a public SDK or wire freeze
**Target repos:** planning, sdk, client
**Depends on:** [[../efsv2/disposable-mvp-profile]], [[../efsv2/mvp-c0-genesis-manifest]]
**Consumers:** [[../web-client-os/mvp0-acceptance]], [[../data-explorer/README]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-09-03

#status/draft #kind/design #repo/planning #repo/sdk #repo/client #topic/efsv2 #topic/read-path #topic/coherence

## Problem

The product needs a small stable consumption boundary without promoting the
disposable MVP-C0 mechanism into a permanent SDK. Older SDK work usefully
separated raw evidence, generated conveniences, read qualification, wallet
transport, and effect recovery, but it also carried a larger architecture and
an old universal result wire shape that this control does not need.

This design imports rather than redefines the exact `WritePlan`, Principal,
byte-carrier, ordered genesis, point-result, and receipt semantics in
[[../efsv2/disposable-mvp-profile]] and
[[../efsv2/mvp-c0-genesis-manifest]].

## Proposal

### One non-loss product result rule

Product APIs return operation-specific typed results. They do **not** freeze
one oversized wire enum. Exact, page, and byte read families expose or import
the upstream `PointResult` law and retain, directly or through an inspectable
evidence handle:

- the imported point outcome `FOUND | ABSENT_PROVEN | UNKNOWN | CONFLICT`;
- exact domain and committed basis;
- coverage, support, and validation;
- authority, currentness, and finality;
- integrity, availability, returned-byte state, and effect;
- evidence commitment and typed reason code; and
- exact canonical input/output bytes, source observations, canonicality and
  proof/receipt/history-availability evidence when those were obtained.

A compact product card may summarize these facts, but it cannot overwrite or
drop them. Decoded or generated DTOs are views over retained bytes. Unknown
fields and unsupported variants remain exportable and must survive cache,
worker, storage, and adapter round trips.

Write-stage families do not synthesize a point outcome or canonical effect.
They retain handles to every source read and its full qualification, the exact
plan bytes/digest and predicted effects, then add only their own separate
authorship, authorization, submission, EVM, and admission/effect receipts and
operation stage. Only canonical read-back adds new qualified point/page/byte
reads and may establish the imported canonical effect verdict.

The product-facing families are deliberately separate:

```text
ExactReadResult<T>      = imported PointResult<T> + rawEvidence
ScopedPageResult<T>     = exact page contract + qualified items + rawEvidence
VerifiedByteResult      = semantic point + range + attempts + verified bytes?
PlannedWrite            = source-read evidence handles + exact WritePlan bytes/digest + preview + roles
AuthorizedWrite         = PlannedWrite + authorship/authorization receipt + stage; no point/effect verdict
SubmittedWrite          = AuthorizedWrite + submission/EVM/admission progress receipts + stage; no point/effect verdict
CanonicalReadBack<T>    = planned effects + new qualified independent reads + comparison verdict
```

These are semantic families, not adopted TypeScript names or serialized bytes.
An implementation may use distinct per-Type façades as long as the non-loss
contract is mechanically tested.

### The five seams

#### 1. Exact read

Input names the exact chain/Realm, Core/profile, subject and key, accepted
capabilities, and committed read basis. Output is one imported
`PointResult<T>` plus retained canonical bytes/evidence. A convenience method
may decode a known Type, but neither a provider response nor a zero value can
become `ABSENT_PROVEN`. Basis, support, validation, authority, currentness,
finality, and evidence availability remain inspectable.

#### 2. Scoped page read

Input names the finite scope/query profile, ordering, page bound, coverage
requirement, exact basis, and optional opaque continuation. Every continuation
is valid only for the same scope, ordering, high-water/revision and basis.
Mixed-basis pages open a comparison; they are never merged into one inventory.

Output retains qualified items, raw page evidence, attempted sources,
continuation, observed coverage, and the conditions under which the scope is
closed. Empty or terminal pages prove absence only when the imported complete-
domain rule permits `ABSENT_PROVEN`. Partial, unavailable, invalid, or
unsupported coverage remains `PARTIAL`/`UNKNOWN` on its own axis.

#### 3. Verified byte read

Input pins the selected semantic File/FileRevision, `ChunkTree`/digest, range,
Route/carrier evidence, exact basis, and resource limits. The SDK tries only
eligible carriers, records every bounded attempt, and verifies the returned
bytes against the committed byte identity before exposing them as verified.

The output keeps File identity, byte range, carrier handle/Locator evidence,
availability, integrity, returned-byte state, and raw attempts distinct.
Unavailable bytes do not make the File absent. Returned but mismatching bytes
are available and returned with failed integrity; they are never emitted as
verified bytes. MVP-C0 run-local byte limits remain manifest facts, not SDK or
protocol defaults.

#### 4. Plan / authorize / submit

Planning is deterministic and wallet-free. It consumes the pinned File Browser
intent and read context and returns the exact imported C0 `WritePlan`
bytes/digest, predicted identifiers/effects, Principal and actual signer
relationship, relayer/submitter/payer roles, CAS expectations, carrier effects,
limits, expiry, and a human/agent preview. Any relevant context drift requires
a new plan.

Authorization has three explicit profiles:

| Profile | Routine wallet prompts | Required evidence |
|---|---:|---|
| relayed EOA, normal | 1 | one EIP-712 signature over the exact imported `WritePlan`; authorship/publication and Realm-effect authorization meanings remain separate |
| direct EOA fallback | 1 transaction prompt | no preceding `WritePlan` signature prompt; calldata carries the same plan and the receipt says `DIRECT_EOA_TRANSACTION_AUTHORSHIP`, never portable authorship |
| same-Principal delegated session | 0 after grant | the bootstrap EOA's bounded, revocable grant is canonical and independently read back; the session signs under `C0_DELEGATED_SESSION_V1`, retains its actual signer and grant/admission basis, and leaves Principal, immutable Plans, File and head Binding author/key unchanged |

These are routine budgets after explicit connection/network and, when needed,
grant setup. Preserve the separately linked setup/routine/revocation provider
logs and call/prompt totals, including full first-use and lifecycle totals,
required by [[../web-client-os/mvp0-acceptance#Setup and full first-use accounting]].
Setup is never free or charged to another run; guest reads and planning still
touch no wallet. Session verification imports the distinct alternative path
in [[../efsv2/disposable-mvp-profile#4.3 Same-Principal delegated-session path]],
not direct EOA recovery equality, arbitrary smart-wallet compatibility, or AA.

The SDK never widens a missing, expired, revoked, over-budget, or unavailable
session grant into ambient wallet authority. It returns a typed authorization
failure or `UNKNOWN` as required by the imported law.

Submission accepts only the unchanged authorized plan. It preserves the
authorship/publication, authorization, submission, EVM transaction, and
admission/effect receipts as separate evidence. A wallet confirmation, relay
job, bundler/user-operation acknowledgement, transaction hash, or successful
transaction receipt advances operation progress only; `effect` remains
`UNKNOWN` until the next seam proves otherwise.

#### 5. Canonical read-back

Read-back independently re-reads the exact predicted Files/Core state at a
committed basis, recomputes the required identifiers and byte commitments, and
compares every planned effect with the admission/effect evidence. It uses the
ordinary exact/page/byte seams, not optimistic UI state, an indexer's derived
row, or submitter memory.

Only a matching read-back may produce `READ_BACK_VERIFIED` and
`effect=COMMITTED`. Mismatch, unavailable evidence, incomplete coverage, reorg,
or basis disagreement stays explicit and cannot be renamed success. Read-back
does not claim future availability, permanence, or currentness at another
basis.

### Implementation ownership

| Owner | Owns | Must not own |
|---|---|---|
| SDK | exact codecs and raw retention; five seams; deterministic planning; authorization verification; submission adapters; receipt linkage; canonical read-back | product navigation, UI truth, ambient wallet/provider choice, or hidden protocol defaults |
| File Browser | the thin direct guest route; folder/file/revision intent; trusted preview and prompt journey; presentation of qualified results | a second codec, resolver, verifier, write planner, receipt law, or optimistic success rule |
| Data Explorer | general typed-data workspace; selection/layout; later table/card/gallery/graph projections; shared Inspector and result rendering | an exact File Browser route gateway, a second write stack, identity recomputation, or authority/completeness claims from a view |

File Browser is the first thin write-capable journey. Data Explorer may later
submit an explicit action request through the same SDK action seam and render
its receipts, but it neither owns nor forks that machinery. Exact File Browser
and exact App routes remain usable when Data Explorer is absent.

### Failure and replacement rules

- An unavailable provider, historical basis, proof, carrier, grant, or receipt
  remains causally qualified; it never falls through to empty or success.
- A cache or index may accelerate a seam only while retaining exact source,
  basis, coverage, raw bytes, and independent verification.
- An implementation that cannot preserve any imported qualification axis or
  exact raw bytes is incompatible with this interface.
- A future permanent SDK may replace every illustrative family above. It must
  either preserve the same information or record an explicit, reviewable loss.

## Open questions

No permanent mechanism is chosen here. The experiment must determine whether
the five seams are sufficient without freezing product DTO names or one wire
envelope.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred
- [ ] `**Target repos:**` confirmed
- [ ] Upstream MVP-C0 dependencies accepted or explicitly retained as disposable inputs
- [ ] No `<!-- AGENT-Q: -->` comments remain
- [ ] Independent fixture shows every qualification axis and raw byte survives all five seams
- [ ] File Browser and Data Explorer owners review the ownership split

## Implementation notes

No production implementation is authorized. The first permitted use is a
disposable consumer fixture against one exact MVP-C0 run.
