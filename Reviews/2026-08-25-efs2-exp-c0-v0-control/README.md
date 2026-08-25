# EXP-C0/v0 executable control — scope and residuals

**Status:** disposable partial invariant control; non-durable, non-conformant,
not deployed, and not production evidence

This directory pressure-tests selected EXP-C0/v0 candidate invariants. It does
not implement all 61 sealed traces, a public Realm, a complete Core reader, a
production contract, or a protocol conformance suite. `trace-coverage.json` is
the claim ledger. Its legacy `EXECUTABLE_CONTROL` machine status is retained for
the existing coverage consumer, but every such row is now explicitly scoped
`PARTIAL_INVARIANT_CONTROL`, and `exactExecutableTraceReplayCount` remains zero.

## Query/projection control

`src/query-projection-v0.cjs` is independent of `src/model.cjs`. It provides:

- the exact 28-row projection collection key/value ABI registry, including
  retained Principal, verifier, Plan, destination-witness, and interpretation
  descriptor preimages;
- canonical ABI decode/re-encode checks and canonical projection ordering;
- omission, substitution, duplication, and reordering detection against a
  separately supplied expected projection;
- a deliberately synthetic fixture with at least one row in every collection;
- a `fullStateReconstruction` label only when all 28 collection kinds are
  accounted for by canonical rows or explicit non-overlapping declared-empty
  kinds, the supplied projection exactly matches the expected projection, and
  the caller explicitly claims that scope;
- exact source/destination `SIGN` digests plus retained Plan/effect/Operation,
  Admission/base-posting ordinal, verifier-transcript, withdrawal, Binding,
  query-activation/posting/counter, and obvious foreign-key closure checks;
- terminal query validation over exact Realm, revision, QueryProfile,
  generation, order, activation/coverage high-waters, count, independently
  recomputed postings root, declared domain, and authenticated observer basis;
- `EXACT_BYTES_FIELD` validation against a retained exact Type, BYTES field,
  posting Record, and the domain-separated Type/field/canonical-value key;
- a strict maximum page limit of 32; and
- mismatch rejection for every one of the 11 exact `CursorV0` coordinates.

The synthetic 28-collection fixture is a **full populated-collection invariant
control**, not reconstruction from actual complete Realm state. Any matched
subset is labelled `PARTIAL_INVARIANT_CONTROL`.

`HELLO_FILES_V0` separately demonstrates a **full declared-collection
control**: 27 kinds are populated and kind 16 `WITHDRAWALS` is explicitly empty
because the story performs no withdrawal. Unknown, duplicate, or populated
declared-empty kinds reject.

## Raw point handoff

The raw point validator consumes `src/result-v0.cjs` unchanged. It validates the
literal `ResultV0`, exact registry key, `PointPayloadV0`, canonical projection
value bytes, and `rawRetention`; it does not rebuild a friendlier result.

All 28 collection kinds use the generic literal mapping
`subjectKind = COLLECTION_ENTRY` and
`subject = abi.encode(uint8 collectionKind, bytes canonicalKey)`. The validator
checks that composite subject exactly, so two collections with identical key
bytes cannot be substituted. Narrow semantic helpers may still use `RECORD`,
`OCCURRENCE`, or another semantic subject kind; they are not the generic raw
collection seam exercised here.

## Literal ResultV0 vectors

`vectors/result-v0.json` pins three disposable cross-language candidate results:

- `POINT/FOUND` with authenticated observer basis and retained record bytes;
- rejected `MUTATION/NOT_COMMITTED_PROVEN` with an exact same-root canonical
  effect receipt; and
- bootstrap `MUTATION/COMMITTED` with `REALM` subject, no OperationId, and an
  exact changing-root canonical effect receipt.

`scripts/build-result-vector.cjs` is an independent emitter. It duplicates the
disposable ABI contract and imports no model, `src/result-v0.cjs`, Solidity
source, or generated semantic helper. `test/result-vector-v0.test.cjs` proves
emitter -> pinned JSON -> implementation decode/re-encode/commit parity.
`src-sol/ExpC0ResultCodec.sol` independently decodes the pinned bytes,
re-encodes them byte-for-byte, and reproduces the same domain-separated result
commitments in Solidity. These are **NON-DURABLE**, **NON-CONFORMANT** controls,
not ceremony-final golden vectors or a stable contract ABI.

The result control also preserves every `uint64` as JavaScript `bigint` and a
canonical decimal string at a JSON boundary, including max-`uint64` cases. A
direct RPC can report `SOURCE_OBSERVED` only with an attributed nonzero
block/state observation and `UNPROVEN` finality; the supplementary observation
packet cannot upgrade that source response into an authenticated state proof.

## Exact Plan/Effect/Operation vectors

`vectors/plan-operation-v0.json` binds every candidate `AdmissionPlan`, ordered
`EffectV0[]`, committed `Operation`, and their domain-separated IDs.
`scripts/build-plan-vector.cjs` is an independent emitter;
`src/plan-v0.cjs` and `src-sol/ExpC0PlanCodec.sol` independently reproduce the
same IDs and reject coordinate substitutions. This removes the old ambiguity
between an authorized Plan, its effect set, and the operation that actually
committed while keeping signature, account submission, and canonical effect as
separate evidence layers. Every effect is a closed tagged union: inactive
coordinates must be zero, effects are supplied in strict `(kind,targetKey)`
order without normalization, duplicates reject, and query targets bind both
profile and generation. Occurrence IDs remain in source leaf order rather than
being sorted as opaque hashes.

## Closed Type interpreter

`src/type-interpreter-v0.cjs`, `src-sol/ExpC0TypeInterpreter.sol`, and
`type-interpreter-v0.json` pressure the exact `T_NOTE` Type and canonical Record
bodies pinned by `vectors/essential-v0.json`. Its generator defines the complete
corpus from that upstream vector plus explicit metadata and case lists; it never
reads its own output. An independent regeneration test poisons a prior output
with a sentinel and proves the sentinel cannot survive. The independent
`vectors/type-envelope-v0.json` corpus pins the bounded outer
`abi.encode(uint16 codecVersion, bytes payloadBytes)` wire, codec-free v0
payload, Type identity preimage, opaque codec-1 retention, and malformed,
noncanonical, limit, mutation, and wrong-key cases. Validation is deliberately two
pass: pass one recomputes a finite inventory of up to 16 Types and 16 Records
without following references; pass two canonical-decodes bodies. Every role
pins `SELF_TYPE_RECORD` or an exact nonzero target Type ID, and the target Record
must exist with that Type. The accepted T_NOTE fixture therefore proves Record
B's field-2 self-Type reference closes to Record A. An acyclic two-Type control
accepts; wrong/missing Types or Records reject. Cross-Type A↔B recursion remains
unsupported because C0/v0 defines no placeholder or group codec.

Kind 3 stores the exact outer envelope bytes rather than wrapping or decoding
them into another projection tuple. Readers canonicalize that outer envelope
before dispatch. Unknown canonical codecs retain their exact raw bytes and ID,
but remain `UNSUPPORTED`, `UNPROVEN`, and semantically `INCOMPLETE`; the C0
transition rejects them with zero effect. A malformed outer or codec-0 payload,
an unknown codec-0 coordinate, and a wrong Type key remain distinct failures.

Both implementations reject noncanonical offsets or field order, hidden
nonzero values in absent optionals, malformed/trailing ABI bytes, unknown or
wrong-Type reference targets, field/reference limits, oversize payload bytes,
duplicate or zero-reserved field keys, malformed roles, and unknown scalar,
reference-target, or representation codes. Decode followed by byte-identical
re-encode happens before semantic interpretation.

The selected generic `ABI_TUPLE_V0` mapping is executable in JavaScript: fields
are components in ascending `fieldKey`; `U64`, `BOOL`, `BYTES`, and `RECORD_ID`
map to `uint64`, `bool`, `bytes`, and `bytes32`; required fields use bare `T`;
optional fields use `(bool present,T value)`; absent values must be the scalar's
zero/empty value, while present zero/empty values remain legal. The Solidity
control intentionally implements only the literal T_NOTE tuple and a simple
one-role exact parent/file tuple used for parity and dependency-order tests. It
does not claim to interpret the four-field HELLO Files body. A generic runtime
Solidity tuple parser remains M1 implementation work, not evidence for a wider
Type grammar or production freeze. Prior whole-test gas numbers are stale after
the finite multi-Type repair and are not carried forward as a production
estimate.

## Bounded Lens control

`src/lens-v0.cjs` and `src-sol/ExpC0LensControl.sol` implement the selected
`FIRST_FOUND_AFTER_PROVED_ABSENCE` combiner over exact immutable
`ResolutionPlanV0` inputs. The controls prove 1/8/32/64-Principal bounds,
ordered unique Principals, same-basis fallback after proved absence, and an
immediate stop on `UNKNOWN`, `CONFLICT`, `UNSUPPORTED`, or basis mismatch.
Full-width purpose, subject, order, and combiner substitutions change the Plan
ID; purpose, subject, and field role are nonzero and cannot alias through
narrowed integer coordinates. Both reads and the evidence write control accept
Plan ID plus field role, reload the retained Plan, derive Position themselves,
and reject a Principal outside that Plan; no raw-Position escape hatch remains.

`lens-gas-v0.json` retains the disposable last-found measurements. The
64-Principal path costs 616,577 on the first measured resolve and 220,280 on
the immediately repeated resolve in this harness. This
selects a useful candidate ceiling to measure during M3; it does not establish
a production cap or make a rich social Lens an onchain obligation.

## Supplementary byte-acquisition control

`src/read-request-v0.cjs` supplies canonical `SourceEndpointV0`,
`SourceDescriptorV0`, and `ByteReadRequestV0` preimages. Acquisition and source
observation packets retain those raw bytes, recompute their nonzero
commitments, and cross-link chain, Realm/revision, Record/digest, range, source,
and requested basis. Endpoint eligibility is itself committed and must equal
the attempt bit; `start + length` cannot exceed `uint32`.

`src/acquisition-evidence-v0.cjs` binds the exact request and Result
commitments to an ordered list of carrier attempts, eligibility, expected and
observed digests, ranges, observer bases, outcomes, and evidence pointers.
The exercised path rejects a corrupt eligible primary and accepts a later
verified eligible fallback without rewriting the semantic `FOUND` fact. The
selected verified attempt must match the final Result block hash, state root,
source kind, finality, and freshness exactly; failed earlier candidates may
retain a different basis.
Carrier evidence remains outside Core state and cannot create identity,
admission, or authority. Terminal unavailable and partial literal `BYTES`
Results remain implementation work.

## `HELLO_FILES_V0` vertical control

`hello-files-v0.json`, `src/hello-files-v0.cjs`, and its mutation suite compose
one literal story across four ordinary Files Types/Records, a two-leaf
Publication and atomic Plan, directory-scoped full-width Bindings, a closed
typed backlink, one-Principal ResolutionPlans, corrupt-primary then
verified-fallback acquisition, all 28 accounted projection collections, and
raw-retaining SDK/Explorer adapter views. The deterministic fixture contains 57
projection entries, declares kind 16 empty, and declares its own canonical
payload checksum. It pins every projection entry triple, the full acquisition
packet/final linkage, and an encoded and committed `SourceObservationEvidenceV0`
so a consumer needs no Core builder to reconstruct the handoff. Substituting a cross-
link, authority/descriptor preimage, role/scope, BaseKind, acquisition fact,
projection row, or raw adapter field fails the control.
The serialized portable section carries each exact Type envelope, payload, ID,
and support/validation/reconstruction grades. SDK and Explorer adapters point
to that same raw map; they cannot substitute a decoded-only façade.

Launch retains exact canonical OriginLineage and ComponentDescriptor
preimages, with runtime code bytes kept outside the 4,096-byte descriptor and
checked against its hash. Origin/component/Realm/revision coordinates flow
transitively into the canonical SourceDescriptor and ByteReadRequest. The exact
source-observation profile remains weak (`SOURCE_REPORTED`, no proof) and
rejects known-but-stronger self-grading, declared proof, or availability drift.
The exported `RealmBootstrap` is exactly the six-field canonical preimage:
origin lineage, genesis, Core and initial-revision commitments, initial
revision ID, and disclosed powers. The wider derivation input exists only as a
local independent-formula control; it is never serialized as Realm state.

The two stable ObjectGenesis Records commit creator Principal, salt, and
charter—not mutable labels. Same creator+salt retries and exact cross-Realm
copies preserve identity; another creator differs; renaming only changes the
file-entry Record. Creator bytes are merely a claim until the generated Files
validator ties them to the signed Publication author/source actor. Exact roles
pin parent to Directory, child/FileRevision to File, and the sole query derives
its exact-bytes index key from `DirectoryFileEntryC0` field 2 (`name`). C0/v0
file and `BytesPayloadV0` digests are explicitly Keccak-256; agility is
successor-profile work.

This is an integration control, not a 62nd sealed trace, a production Files
profile, or evidence that a live Core/SDK/browser implementation exists. Its
exact trace replay delta is zero.

## Machine-readable build handoff

`handoff-v0.json` names the selected disposable laws, source semantic seal,
one owner choice, delegated product default, engineering work, evidence
commands, and SHA-256 locks for the pinned vector/measurement files.
`test/handoff-v0.test.cjs` fails if a
locked file drifts or if the handoff claims conformance, durability, production
readiness, deployment, or freeze authority. It is an integration checkpoint for
the SDK and Explorer PM lanes, not a protocol manifest.

## Clean-room consumer contract

`consumer-contract-v0.json` is the generated, serialized boundary for an SDK
or Explorer consumer that must not import this experiment's `src/`, `scripts/`,
or `test/` trees. `scripts/build-consumer-contract.cjs` is allowed to read the
experiment implementation and emits canonical JSON plus one trailing LF. The
artifact carries the exact `ResultV0` and `BytesPayloadV0` ABI, complete enum
registry, domains and commitment preimages, full decoded HELLO result with
decimal-string `uint64` values, Type outer-envelope and codec-0 contracts,
opaque codec-1 grading, required JSON pointers, HELLO semantic facts, Explorer
dependency ceilings, and the byte-identical same-source receipt schema.

`test/consumer-contract-v0.test.cjs` is intentionally clean-room: it uses only
Node, ethers, and serialized JSON. It resolves every required pointer,
decode/re-encodes and recommits Result and Bytes payloads, recomputes Type IDs
for codec 0 and opaque codec 1, verifies raw SHA-256 locks and the canonical
HELLO payload hash, and rejects placeholder, stale ABI/enum/domain/fact,
pointer, grading, dependency, and receipt mutations. The handoff pins the
contract's raw SHA-256. These are current disposable packet locks, not permanent
protocol bytes or identifiers.

## Evidence commands

From this directory:

```sh
node --test test/query-projection-v0.test.cjs
node --test test/result-vector-v0.test.cjs
node --test test/type-interpreter-v0.test.cjs
node --test test/type-interpreter-vector-generator.test.cjs
node --test test/type-envelope-v0.test.cjs test/type-envelope-vector-v0.test.cjs
node --test test/consumer-contract-v0.test.cjs test/handoff-v0.test.cjs
node --test test/*.test.cjs
node --check scripts/build-consumer-contract.cjs
forge test --match-contract ExpC0ResultCodecTest
forge test --match-contract ExpC0TypeInterpreterTest -vv
forge test --match-contract ExpC0TypeEnvelopeTest -vv
forge test
```

The JavaScript and Foundry aggregates include partial controls with different
scope; they are not two complete implementations of EFS Core. Passing either
suite does not upgrade `trace-coverage.json` by implication.

## Remaining work

- Exact request/result/pre/post bundles for each claimed sealed trace.
- Literal PAGE `ResultV0` and QueryProfile activation/backfill transitions for
  Q1–Q4.
- Reconstruction from genuinely complete serialized state, independently
  replayed by the model and Solidity SUT.
- A generic Solidity `ABI_TUPLE_V0` runtime parser and a wider multi-Type
  closure corpus; this control closes only literal T_NOTE in Solidity.
- Exact EOA/ERC-1271 verifier transcripts, plan authorization, submission
  recovery, terminal unavailable/partial byte Results, authenticated observers,
  and literal Lens Result bundles.
- Deployment and independently cold no-wallet browser evidence remain later
  implementation/deployment gates.

## V2-E1 Principal-surface comparator

`principal-comparator-v0.json`, `src/principal-comparator-v0.cjs`, and
`src-sol/ExpC0PrincipalComparator.sol` preserve both disposable arms:

- uniform full-width `PrincipalId`, using the exact EXP-C0/v0
  `Principal(uint8 authorityKind, bytes originLineage, address account)` tuple;
- tagged `AuthorRef(uint8 kind, bytes32 value)`, using the historical disposable
  bakeoff author-key domain.

The pinned disposable EOA and ERC-1271 cases cross-check JavaScript and Solidity IDs and
signature bindings. Both arms use zero pre-write setup transactions and both
still require a retained historical verifier basis. The tagged `ACCOUNT` ref
does not itself distinguish EOA from ERC-1271; the selected verifier profile
must bind that distinction and must not be inferred from current code.

Exact ABI measurements are 160 bytes for the uniform EOA descriptor, 192 bytes
for the fixture ERC-1271 descriptor, 32 bytes for a steady-state uniform author
key, and 64 bytes for a tagged author ref. Both signature preimages are 160
bytes after binding the selected author key and verifier profile.

Pinned `solc 0.8.30`, Osaka, optimizer 200, via-IR gas report:

| Operation | Uniform | Tagged |
|---|---:|---:|
| identity/key derivation, average | 1,089 | 481 |
| first keyed write, average | 44,700 | 44,893 |
| representative post-write read, average | 2,496 | 2,708 |
| managed association write | 66,889 | 67,892 |

These are disposable harness call costs, not aggregate admission or production
gas. They exclude signature verification and first-use PrincipalRecord
persistence. The comparator provisionally recommends the uniform arm for the
MVP surface because setup ties, its API is one word, authority class is
identity-bound, steady keyed operations do not cost more here, and managed
association retains one keyspace without rewriting old IDs. The tagged arm
remains executable. Reopen the recommendation if aggregate first-admission
descriptor persistence/verification or developer complexity fails its budget.

### Comparator ambiguities kept explicit

- The historical `enum AuthorRefKind { ACCOUNT, PRINCIPAL }` does not pin an
  independent wire registry. This comparator uses Solidity's natural `0/1`
  values only inside its disposable domain; it does not reserve production
  enum codes.
- The fixture ERC-1271 `originLineage` is explicit test bytes, not a final
  chain-reference selection.
- The association test proves only prospective key continuity and zero history
  rewrites. It does not implement managed authority, recovery, delegation, or
  succession policy.
