# EFS 2.0 Stage A — B0 baseline overview and seam resolutions

**Stage A chapter — post-red-team revision; not landed, adopts nothing.**
**Role:** the umbrella over the Stage A doc set. It pins the cross-chapter seam
resolutions (SR-1..SR-18), states the B0 arm configuration, and maps the doc
set onto the PM's eight Stage A deliverables. Where a chapter's text disagrees
with an SR pin below, **the SR pin wins**; chapters are repaired to match, and
any residue is a defect. Revision note: the first pin set (SR-1..SR-12) was
red-teamed by seven adversarial lanes; two pins (SR-9, SR-10) were repaired,
four amended (SR-1/3/5/8/12), and six added (SR-13..SR-18). The findings are
archived in the pass corpus.

**Correction note (2026-08-13 — independent post-Fable repair evidence).** A
fresh packed-word arithmetic sweep found that SR-8's named Slot 0 fields total
120 bits (`8 + 32 + 48 + 8 + 8 + 16`), so its reserved tail is 136 bits, not
112. This corrects packing only; no field, width, meaning, evidence label, or
architecture choice changes. The same sweep rechecked SR-7's
`AuthorityBasisWord` at 256 bits (`8 + 16 + 8 + 64 + 160`), SR-10's
`OccStatus` fields at 104 bits (`8 + 48 + 48`) and its admission-log metadata
beside the separate full `EnvelopeId` word at 112 bits (`16 + 48 + 48`),
leaving 144 reserved bits, and SR-4's five packed `u48` ordinals at 240 bits.
Follow-up consistency review clarified three existing pins without choosing a
new arm: SR-10 now names the reversible two-word hydration layout; SR-3 spells
the complete EIP-712 commitment for `expectedRevisions`; and SR-11/SR-12/SR-17
separate the intrinsic bootstrap Type from the three application-effect Types
while keeping schema admission and cache materialization on ordinary `publish`.

#status/draft #kind/design #topic/efsv2

## 1. What B0 is

B0 ("SPINE") is the exact, implementable baseline configuration of the EFS 2.0
Core candidate — the fixed point the controlled bakeoff varies around. It is a
[PROPOSAL] in its entirety: buildable, attackable, disposable. Nothing here is
ratified; James rules only when evidence leaves a genuine irreducible fork.

The semantic model in one paragraph: a **TypeSchema** gives typed meaning,
shape, constraints, reference roles, and index obligations; a **Record** is
author-neutral exact typed content (`RecordId = H(dom, typeSchemaId,
canonicalBody)`); a **PublicationEnvelope** is one Principal's signed
publication of an ordered vector of Records; an **Occurrence** `(EnvelopeId,
leafIndex)` is the authored event "this Principal published this Record"; an
**AdmissionReceipt** is one Realm's acceptance of an Occurrence under a named
policy/implementation revision and authority basis, at a global
**AdmissionOrdinal**; a **Binding** is one Principal's current CAS-guarded
answer at one logical position; mandatory **indexes** make every admitted item
queryable in bounded gas; a **ResolutionPlan** (product name: Lens) is a
bounded, immutable, contract-evaluable trust policy resolving one position
across an ordered set of Principals with honest
FOUND/ABSENT/CONFLICT/UNSUPPORTED/UNKNOWN outcomes.

### B0 arm pins (the bakeoff baseline)

| Axis | B0 arm |
|---|---|
| 1 Record shape | immutable shared PublicationEnvelope |
| 2 Author surface | uniform `bytes32 PrincipalId` + intrinsic zero-setup account Principal |
| 3 Publication domain | portable authored Envelope + separate Realm-bound AdmissionIntent |
| 4 Type identity | Variant A — one TypeSchemaId over meaning+shape+validation+roles+index specs |
| 5 Envelope leaves | inline canonical Record bodies, identity-committed via RecordId vector (SR-2) |
| 6 Deployment | one atomic physical Core; narrow logical modules as internal libraries |
| 7 Index pointer | packed stable ordinals (uint64 ABI / uint48 physical, SR-4) |

## 2. Seam resolutions (SR-1..SR-18)

The design lanes flagged their cross-chapter conflicts honestly (harness S1–S8
= vectors RP-1..RP-12, plus red-team discoveries). These are the synthesizer's
pins, revised after the adversarial round. Every pin is [PROPOSAL] unless
labeled otherwise.

**SR-1 — ID-family discipline (RP-1).** One two-level discipline everywhere:
`DOM_X = keccak256("efs2/<name>/<version>")` (printable ASCII; the closed
table lives in [[b0-encoding-and-ids]] §1.3 and, post-repair, contains EVERY
domain string minted anywhere in the set — multi-segment names are legal);
preimage = `abi.encode(DOM_X, …fields)` where every field is a fixed-width
word and **any variable-length or structured component enters as its own
`keccak256` hash** (exactly one nesting level); id = `keccak256(preimage)`.
Raw ASCII-prefix concatenation is retired; the binding, lens, realm, and index
chapters' formulas regenerate under this discipline. Where a retired-form
formula admits two compliant regenerations, the regenerated form is pinned
explicitly here: PrincipalId by SR-14, RealmRevisionId by SR-16; all others
regenerate field-for-field with no structural change.

**SR-2 — EnvelopeId and leaf commitment (RP-2, S8).** The authorship chapter's
structure wins, expressed under SR-1: the signed EIP-712 envelope struct
commits `profile`, `principalId`, the reserved authority seam
(`authorityRef bytes32` = 0 and `authEpoch uint64` = 0 in B0 — the KEL
graduation seam), the replay commitment (`pubNonce`/`notAfter`), and the
ordered **`recordIds[]` vector** (leaf commitment = RecordId, positional,
hashed per EIP-712 array rules).
`EnvelopeId = keccak256(abi.encode(DOM_ENVELOPE, eip712EnvelopeDigest))`.
Record **bodies ride inline in calldata** (axis-5 B0 arm) and admission
verifies `recordIdOf(typeSchemaId_i, body_i) == recordIds[i]` for every
selected leaf. Witness/signature bytes never enter EnvelopeId
([DERIVED INVARIANT — kel §8.1]). B0 signs the envelope under the chain-free
constant EIP-712 domain [PROPOSAL — argued in [[b0-authorship-envelope]] §2.3
with its replay-defense relocation table; re-verified against live wallets in
Stage B (GV-5)]. The encoding chapter's §4.2 formula — also
RecordId-committed, but a plain struct hash without the authority seam — is
re-labeled a sub-variant sketch, not B0. Re-signing the identical struct
yields the same EnvelopeId (idempotent re-admission); a new `pubNonce` is a
new publication event by design.

**SR-3 — AdmissionIntent/1 (RP-3, S2).** One merged shape:
`{ realmId, envelopeId, leafMask uint64, action uint8 (MBZ = 0 = ADMIT in B0),
expectedRevisions[] of (leafIndex uint16, revision uint32), nonceKey uint192,
nonceSeq uint64, notAfter uint64 }`, signed under a full Realm-bound EIP-712
domain (chainId + verifyingContract, realmId in the struct).
`expectedRevisions` is strictly leaf-index ordered and is **required for every
selected CAS-bearing `BindingSet/1` or `BindingTombstone/1` leaf**, including
an already-ACTIVE duplicate; `Withdrawal/1` has no entry. A static shape pass
associates and consumes every item before the ascending effect walk. Only a
fresh source compares its associated revision and body predecessor against the
point-in-order shadow head. This bans wildcard/blind realm-local writes without
letting mixed retries drift the carriage cursor; the array is empty only when
no CAS-bearing Binding mutation is selected.
The exact EIP-712 types and array commitment are:

```text
ExpectedRevision(uint16 leafIndex,uint32 revision)
AdmissionIntent(bytes32 realmId,bytes32 envelopeId,uint64 leafMask,uint8 action,ExpectedRevision[] expectedRevisions,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)ExpectedRevision(uint16 leafIndex,uint32 revision)

EXPECTED_REVISION_TYPEHASH = keccak256("ExpectedRevision(uint16 leafIndex,uint32 revision)")
expectedRevisionsHash = keccak256(concat(
  keccak256(abi.encode(EXPECTED_REVISION_TYPEHASH, item.leafIndex, item.revision))
  for item in expectedRevisions, in array order
))
INTENT_TYPEHASH = keccak256("AdmissionIntent(bytes32 realmId,bytes32 envelopeId,uint64 leafMask,uint8 action,ExpectedRevision[] expectedRevisions,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)ExpectedRevision(uint16 leafIndex,uint32 revision)")
intentStructHash = keccak256(abi.encode(
  INTENT_TYPEHASH, realmId, envelopeId, leafMask, action,
  expectedRevisionsHash, nonceKey, nonceSeq, notAfter
))
DS_INT = keccak256(abi.encode(
  keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
  keccak256("EFS2-AdmissionIntent"), keccak256("1"),
  chainId, verifyingContract
))
eip712IntentDigest = keccak256(0x1901 ‖ DS_INT ‖ intentStructHash)
IntentId = keccak256(abi.encode(DOM_INTENT, eip712IntentDigest))
```

Here `concat` is the EIP-712 concatenation of the 32-byte element struct
hashes; the empty array hashes the empty byte string. Under SR-1,
`DOM_INTENT = keccak256("efs2/admission-intent/1")`. Replay control is the
2-D nonce discipline: per-`nonceKey` **sequential lanes** (`lastSeq + 1`),
which realizes the realm chapter's consumed-intent registry. Every accepting
AdmissionBatch stores an enumerable `batchIntentLane` word: explicit intent =
`(uint256(nonceKey)<<64)|nonceSeq` with `nonceSeq>=1`; implicit sender = zero.
The state-readable `admissionBatchIntentLane(batchId)` walk reconstructs every
explicit `(principalId,nonceKey)->lastSeq` and compares it with
`intentNonceOf`; an all-selected-ACTIVE retry appends neither a batch nor a
lane word. The realm
chapter's separate action/actionData table is retired for B0: admission
effects are **leaf-Type-driven** (SR-11). The portable `predecessorOccurrence`
CAS in the Binding body is unchanged (dual CAS stands).

**SR-4 — AdmissionOrdinal width (RP-4, S4).** `uint64` at every ABI, receipt,
and vector; `uint48` as the physical packed representation inside postings and
log words (5 per slot), with an explicit `U48_GUARD` revert at `2^48 − 1` and
a successor-realm seam. At a sustained 10,000 admissions/sec, 2^48 lasts
≈ 892 years. Ordinals start at 1; 0 is the none-sentinel (SR-10).

**SR-5 — size constants (RP-5, S5).** B0 pins, all [HYPOTHESIS] to be
re-derived by the Stage B harness against per-Realm gas caps (EIP-7825's
16,777,216 on L1): `MAX_ENVELOPE_LEAVES = 64` is the **structural** cap
(matches `leafMask uint64`); whether a maximal envelope admits in one
transaction is a **measured Stage B output, not a claimed property** — the
authorship chapter's `c_occ` budget inequality is the shared formula, the
harness owns the number, and a lower measured cap shrinks the constant and
returns to James. `MAX_ENVELOPE_BODY_BYTES = 8,192`, `MAX_BODY_BYTES = 8,192`
(one leaf may fill the envelope), `MAX_BIND_LEAVES_PER_ENVELOPE = 64`. The
content chapter re-derives `MAX_CLOSURE_MEMBERS` from the pinned 8,192.

**SR-6 — Position/Binding key domains (RP-6, S3).** Under SR-1:
`PositionKey = keccak256(abi.encode(DOM_POSITION, purpose, subject,
fieldRole))`, `DOM_POSITION = keccak256("efs2/position/1")`;
`BindingKey = keccak256(abi.encode(DOM_BINDING, principalId, positionKey))`,
`DOM_BINDING = keccak256("efs2/binding/1")`. The spellings
`efs2/bindingkey/1` and `efs2/binding-key/1` are retired. `purpose` stays
free `bytes32` per the binding chapter's ruling.

**SR-7 — AuthorityBasis representation (RP-7).** The principal chapter owns
it: one packed `AuthorityBasisWord` (bytes32) =
`kind u8 ‖ verifierVersion u16 ‖ witnessProfile u8 ‖ basisBlock u64 ‖
delegateOrZero u160`, plus one conditional codehash slot for contract-account
kinds. The exact pair belongs to each non-idempotent accepting `publish` call:
one `AdmissionBatch` stores it, and every newly accepted occurrence in that
call resolves its immutable `AdmissionReceipt/1` through that batch. A later
staged admission of the same Envelope is reverified and may therefore record a
different basis block, delegate, or codehash. `EnvelopeMeta` owns no
authoritative singular basis (and the compressed `authorityBasisCode u16`
projection is retired). The authorship chapter's four-field struct is
superseded and regenerates against the word. `authEpoch` lives in the envelope
header (SR-2), not in the basis word.

**SR-8 — BindingHead layout (RP-8, S7).** Two slots.
Slot 0 (meta): `state u8 (0 = UNSET — the zero word IS absence, 1 = BOUND,
2 = TOMBSTONED) ‖ revision u32 ‖ currentOrdinal u48 ‖ targetKind u8 ‖
tombstoneCause u8 ‖ targetLeaf u16 ‖ reserved u136`. Slot 1:
`targetRef bytes32` (zero when tombstoned). `tombstoneCause` distinguishes
explicit tombstones from withdrawal-driven ones (the graded
`NONE_EXPLICIT` / `NONE_WITHDRAWN` outcomes); `targetLeaf` carries the
OCCURRENCE-target leaf index. `authorityBasis` is NOT on the head: B0
account-Principal grading is constant `AUTH_OK`; managed-Principal grading
later follows `currentOrdinal` into the admission log. Probe costs:
proved-absent = 1 cold SLOAD; present = 2 SLOADs. `revision` is u32 with a
typed guard error at `2^32 − 1` and a named successor seam (a bricked
(principal, position) migrates by explicit successor-position evidence — the
same seam class as U48_GUARD).

**SR-9 — wrong-author Withdrawal (RP-9).** **Revert the envelope**
(`ErrWithdrawNotAuthor`); the admit-as-inert-evidence arm is [REJECTED] for
B0. Scope honestly stated: within one envelope this punishes only the
mistaken author, since all leaves share one authenticated principal. Under the
optional non-Core atomic router, sequential `publish` calls over independently
precomputed Envelopes share one outer EVM transaction; any later element
failure — this one included — reverts every earlier call. Every router element
uses explicit intent, and same-lane elements use consecutive `nonceSeq` values
in call order. Rationale for revert: deterministic
all-or-nothing admission, and no inert kernel-class state (the
confirms-but-unreadable defect class).

**SR-10 — occurrence lifecycle store (RP-10, S6) — REPAIRED.** The single
owner is an **occKey-addressable status overlay**, not the ordinal-keyed log:
`mapping(occKey => OccStatus)` with
`OccStatus = { status u8 (0 = NEVER_ADMITTED, 1 = ACTIVE, 2 = WITHDRAWN,
3 = PRE_WITHDRAWN), ordinal u48 (0 = none; ordinals start at 1),
revokedAtOrdinal u48 }`. The ordinal-keyed admission log keeps the
pages/hydration role with **restored u48 widths** as exactly two words per
accepted occurrence: word A is the full `EnvelopeId bytes32`; word B is
metadata `leafIndex u16 ‖ typeOrd u48 ‖ principalOrd u48 ‖ reserved u144`.
The log stores no `occKey`: hydration returns the reversible OccurrenceRef
`(EnvelopeId, leafIndex)`, and readers recompute
`occKey = keccak256(abi.encode(DOM_OCCURRENCE, EnvelopeId,
uint256(leafIndex)))` under SR-1. Ordinals are
assigned **per accepted occurrence in submission order** — the
`base + k` consecutive-ordinal law is retired because leafMask subset and
staged admission (SR-3/SR-12) make it unsound. **Current-envelope OCCREF is
forbidden:** for each selected leaf in the ascending write-free shadow,
Admission resolves its Type descriptor from persisted or earlier staged Type
cache (or the kernel-known intrinsic TypeSchemaGroup/1 branch), structurally
validates the body, extracts every bounded OCCREF, and
rejects `E_SELF_ENVELOPE_OCCREF(sourceLeafIndex,targetLeafIndex)` before source
activation or any effect when the referenced EnvelopeId equals the current one.
An earlier selected TypeSchemaGroup may therefore define the descriptor safely
used by a later selected leaf. Unselected carriage is not semantically
inspected; same-envelope RecordId REF DAGs remain legal. **Pre-withdrawal (T4) is preserved:** withdrawing a
never-admitted external occKey always requires bounded
`TargetEnvelopeEvidence` (selected Withdrawal leaf, signed header, full
RecordId vector, fixed `TargetRecordCommitment(typeSchemaId,bodyHash)`, typed
Principal descriptor, and witness; never the target body). Admission
recomputes `EnvelopeId`, checks the target range and
`keccak256(abi.encode(DOM_RECORD,typeSchemaId,bodyHash))` against the signed
target RecordId, checks descriptor equality, and verifies target witness and
author before classifying the target effect. It constructs typed
`ValidatedOccurrenceLifecycleEffect`, and passes that same context to the
status owner (`LibIndex`) and head owner (`LibBinding`); proof bytes and
witness/authority/author validation never cross either seam. It then sets
`PRE_WITHDRAWN`. The
accepting Withdrawal's ordinal durably keys the canonical ABI re-encoding of
the exact bounded evidence; the target overlay's `revokedAtOrdinal` points back
to it. Retained evidence supplies `recordId`, `typeSchemaId`, and `principalId`
for W-7/W-9 and occurrence reads but never makes the target body readable. The
current Envelope is staged only for persistence, never occurrence-target
resolution; no staged commitment can replace or be discarded instead of the
mandatory retained evidence. A later Withdrawal leaf targeting the same
external now-terminal occurrence reuses the same-call planned evidence;
callers neither resupply nor replace it, and target-specific evidence never
becomes generic staged availability.
`WITHDRAWN` and `PRE_WITHDRAWN`
permanently block (re-)admission of that occKey (no-resurrection, SR-15). The
only external rejection is Admission/Authorship's
`E_NO_RESURRECTION(bytes32 envelopeId,uint16 leafIndex)`, emitted during
write-free preflight before effects or commit. `LibIndex` reports typed terminal
source status to Admission and `LibBinding` consumes only prevalidated state;
their commit paths treat a terminal source as an assert-only internal invariant
and expose no alternate selector. The
commitment pair is fixed 64 bytes; maximal legal evidence is exactly 7,808 ABI
bytes (`32+384+2,080+1,184+4,128`) under the 8,192-byte aggregate and
16,384-byte whole-wire caps, independent of a legal 8,192-byte target body.
For NEVER_ADMITTED, authenticated `typeSchemaId` only classifies the closed
effect kind and rejects a Withdrawal target: Core derives no body semantics,
Binding key/head transition, posting, Record-live, or unique-by-Type delta.
The mandatory T4-MAX-BODY vector freezes this boundary.
The
one-way ACTIVE status flip drives the exactly-once index decrement, except
`KIND_BINDING_HIST`: that family is RAW_AUDIT, never decremented,
liveness-filtered, or compacted; reads hydrate occurrence status and
`revokedAtOrdinal` separately.

**SR-11 — kernel Type recognition (RP-11).** The closed B0 list of
**application Types with kernel admission effects** is exactly
`{ TYPE_BINDING_SET_V1, TYPE_BINDING_TOMBSTONE_V1, TYPE_WITHDRAWAL_V1 }`.
Separately, the intrinsic bootstrap meta-Type `TypeSchemaGroup/1` is known to
Core for structural validation and deterministic schema-cache materialization
only (SR-17); it is not a fourth application-effect Type and does not dispatch
Binding or Withdrawal behavior. `ResolutionPlan/1` is deliberately not
kernel-known. Concrete constants mint in Stage B; both the three effect-Type
IDs and the intrinsic bootstrap Type ID live in the encoding chapter's
constants table. Binding-class body conventions must be legal under that
chapter's REF/sentinel rules (first-write predecessor uses the explicit NONE
encoding, never raw 0).

The three schemas are exact MC/1 Types: `BindingSet/1` is the three position
words plus `targetRecord OPTION(REF RECORD)`, `targetOccurrence
OPTION(OCCREF OCCURRENCE)`, and `predecessor OPTION(OCCREF OCCURRENCE)`;
exactly one target option is present or Admission emits structural error 17.
`BindingTombstone/1` has the three position words plus predecessor and no
target. `Withdrawal/1` is one direct OCCREF with a 34-byte canonical body.
Dense roles/backlinks cover each reference exactly once. ReferenceRole target
classes are only RECORD/TYPESCHEMA/PRINCIPAL/OCCURRENCE/OBJECT; digest lookup
uses the separate `KIND_DIGEST=0x09` value family, never an ADDRESS or digest
reference class. Concrete kernel TypeSchemaIds remain Stage B outputs.

**SR-12 — entrypoint and admission consent (RP-12, S1).** One permissionless
entrypoint `publish(envelopeBytes, principal, intentBytes, intentWitness)`:
anyone may carry a signed envelope, but admission-with-effects requires an
AdmissionIntent witnessed by the envelope's own Principal — author-only
consent over a permissionless rail (R-D8-clean). `admitAsSender` implicit
intent (msg.sender is the Principal's own account) is legal **only when the
selected set contains none of the three kernel-effect Types**. BindingSet and
BindingTombstone require explicit intent plus `expectedRevisions`; Withdrawal
requires explicit intent but no revision entry (SR-3). Uninvited
third-party carriage without an author intent is not local admission; copied
foreign evidence enters only through the import/Recognition lane as
source-qualified evidence (`AUTH_FOREIGN_ORIGIN` range), never destination
truth. `publish` is the sole Core write entrypoint: any schema-registration
helper is SDK/convenience code that constructs and calls this same entrypoint,
not a second Core primitive (SR-17).

Every non-idempotent `publish` uses one bounded point-in-order preflight, not
independent checks against a stale storage snapshot. After authenticating the
current Envelope and selected body commitments, Admission stages the
header/vector for persistence only and walks selected leaves in ascending index
order through a
memory shadow of prospective counters/ordinals, occurrence status, target
commitments/planned evidence, Type cache, Binding heads/exact sources, posting
heads/live counts, Record/unique liveness, and an exact leaf journal. At each
leaf it first resolves the descriptor from persisted/earlier-staged cache,
or the intrinsic TypeSchemaGroup/1 branch, validates and extracts OCCREF,
applies the current-envelope guard, classifies
the closed effect, and associates semantic carriage. A fresh TypeSchemaGroup
stages its member caches for later leaves; only then is a fresh source
shadow-activated before its closed `NONE | BIND_SET |
BIND_TOMBSTONE | WITHDRAWAL` effect; later legal siblings see the result. One
Envelope may therefore contain two Withdrawals targeting one prior external
occurrence: the first is effective and the second sees terminal shadow state.
Successful bind→withdraw or sequential same-key Binding chains instead use
independently precomputed Envelopes through the optional atomic router. Both
semantic-carriage cursors must exhaust. Only after every fallible
author/policy/reference/bounds/CAS/lifecycle check succeeds does commit replay
the frozen before/after journal in the same order, asserting each prestate and
making no new decision. Therefore every user-controlled failure occurs before
any real nonce, ordinal, evidence, Envelope, Record, receipt, index, cache, or
Binding write. The all-selected-ACTIVE shortcut first runs a smaller write-free
guard over persisted selected Type descriptors/bodies/OCCREFs (with the
intrinsic branch for a selected TypeSchemaGroup/1), then returns
before effects, policy, CAS, target evidence, expiry, intent, or nonce checks;
it stages no missing cache and appends no batch/lane word.

**SR-13 — the authorship identity chain (red-team BLOCKING).** The write path
carries the `AccountPrincipal` descriptor explicitly:
`publish(envelopeBytes, AccountPrincipal calldata principal, intentBytes,
intentWitness)`. Admission asserts
`computePrincipalId(principal) == envelope.header.principalId` **before**
witness verification — a valid witness for the attacker's own key can never
be attributed to a different declared principalId. One verifier signature
program-wide:
`verify(AccountPrincipal calldata p, bytes32 digest, bytes calldata witness,
VerifyContext memory ctx) → (AuthorityBasisWord, bytes32 codehashOrZero)`.
The bytes32-only verifier shapes in the authorship and realm chapters are
superseded. First-use PrincipalRecord persistence takes its preimage from
this calldata channel.

**SR-14 — PrincipalId formula (red-team BLOCKING).**
`PrincipalId = keccak256(abi.encode(DOM_PRINCIPAL, uint256(kind),
keccak256(descriptorBytes)))` with
`DOM_PRINCIPAL = keccak256("efs2/principal/1")`. `descriptorBytes` is the
per-kind canonical descriptor owned by [[b0-principal-authority]] (fixed
layout per kind; no dynamic-tail ABI ambiguity reaches the outer preimage).
The inline `abi.encode(kind, originRef, accountOrKey)` variant is retired.
Worked examples regenerate.

**SR-15 — duplicate semantics (red-team SERIOUS).** Idempotent **no-op at
occurrence granularity** everywhere: re-admission of an already-ACTIVE occKey
returns its existing receipt (ALREADY_ADMITTED) and writes nothing;
re-withdrawal of a WITHDRAWN occKey is a no-op success. The binding chapter's
`ErrDuplicateOccurrence` / `ErrAlreadyWithdrawn` whole-call reverts are
[REJECTED] — they break legitimate subset-admission retries. No-resurrection
is enforced by the SR-10 status guard (WITHDRAWN / PRE_WITHDRAWN block
admission through the sole external
`E_NO_RESURRECTION(bytes32 envelopeId,uint16 leafIndex)`), not by duplicate
reverts or downstream fold-library errors.
For a multi-leaf `publish`, after bounded structural/wire checks and envelope
identity/authentication, an all-selected-ACTIVE set returns before semantic
`targetEvidence` cardinality/effect checks, expiries, or intent replay state.
This makes exact original evidence-bearing retry a true no-op. A mixed/new set
does not take the shortcut: its static pass still consumes revision carriage
for selected ACTIVE BindingSet/Tombstone members, those members remain
effect-free, and fresh members use a new intent plus exactly the caller target
evidence required at their point in the ordered shadow walk.

**SR-16 — RealmRevisionId (the predicted 13th seam).**
`RealmRevisionId = keccak256(abi.encode(DOM_REALM_REVISION, realmId,
keccak256(revisionDescriptorBytes)))`,
`DOM_REALM_REVISION = keccak256("efs2/realm-revision/1")`; the realm chapter
owns `revisionDescriptorBytes`. The encoding chapter's variant is superseded;
the encoding chapter also gains the `codexConstantsHash` definition and a
state-readable `codexConstants()` that the realm chapter's `profileId` and
`genesisCommitment` consume. The index chapter owns one exact version-1
`indexCodexBytes` module (closed query/status codes, semantic limits, cursor
layouts, context selectors, and continuation rules); encoding embeds it once
as `u32 length || bytes` inside `codexConstantsBytes`. There is no second
index hash: state readers reconstruct the module from the existing Codex bytes
and verify the one outer hash.

Realm bootstrap is byte-exact: B0 is protocol 0.0 and `InitConfig/1` is
`abi.encode(uint16(1),uint8 finalityRuleKind,uint32 finalityParam,uint8
upgradeAuthorityKind,bytes32 upgradeAuthorityRef,uint64 declaredTxGasLimit,bytes32
initialPolicyCommitment)`, with `initConfigHash=keccak256(initConfigBytes)`.
The ref is zero iff kind NONE; otherwise it is the canonical nonzero
zero-extended controller address. Revision 1 uses that initial policy and
genesis authority exactly. Each controller change atomically appends one
RealmRevision plus one chained `AuthorityTransition`; current authority
reconstructs from genesis and the enumerable transition chain, never hidden
admin state. Direct/NONE deployments have zero EIP-1967 implementation/admin
slots; B0 UUPS-style kinds use the Codex-owned implementation slot, zero admin
slot, and state-readable implementation/current-authority getters.
`genesisFacts()` returns the full
`GenesisFactsView` needed to re-encode InitConfig and independently recompute
profileId, genesisCommitment, and RealmId; no hidden config enters identity.

**SR-17 — schema on-ramp.** TypeSchemas enter state **as Records of the
bootstrap meta-Type through ordinary admission** (the realm chapter's
reconstruction-walk model wins — one uniform state-readable spine). When
ordinary `publish` admits a `TypeSchemaGroup/1` Record, Core recognizes the
intrinsic bootstrap Type, validates `groupBytes` with
`validateTypeSchemaGroup` (R1–R3, E1 offset-class precomputation, and SR-18e's
REF-instance bound), derives every member `TypeSchemaId`, and **atomically
materializes the parsed-schema cache keyed by each derived TypeSchemaId** in
the same admission; validation or materialization failure reverts the
admission. The cache is deterministic derived state from the admitted Record,
not a second truth or application effect, and re-admission is idempotent.
`registerTypeSchemaGroup(...)` names only an SDK/convenience wrapper that
constructs this Record/envelope/intent and calls the one SR-12 `publish`
entrypoint; it is not a Core entrypoint. The encoding chapter's standalone
non-Record registration function and two-step admit-then-materialize path are
superseded. Group registration (recursion) rides the same path; the
maximal-group-vs-tx-cap cross-check is a named harness case.

**SR-18 — shared vocabularies.** (a) Digest algorithms: one `u16`
multihash-compatible `algCode` table (encoding chapter owns it) used
everywhere — in `DIGEST` values, ByteDigest bodies, and index keys
(zero-extended); the content chapter's `u8 algTag` and the index chapter's
`u32 algId` are retired. (b) Completeness enum on every external ABI:
`UNKNOWN = 0, COMPLETE = 1, PARTIAL = 2, UNSUPPORTED = 3` — zero-initialized
results fail closed (the index chapter's argument wins; the realm chapter
regenerates). (c) Best-locator selection: the index chapter owns the B0
on-chain bounded algorithm (single declared score field) **with the
examination budget bounding TOTAL postings visited, live or dead** (a
spray of self-revoked postings degrades to honest `PARTIAL` + cursor, never
an unbounded scan — THE LINE). Its `SelectSpec` requires one nonzero trusted
full-width `principalId`, binds it into the SelectCursor context, and skips
every differently authored occurrence before scoring; untrusted spray can
cost windows but can never win. B0 eligibility is only structural + exact
Principal + live-at-basis + declared Type/role/score. URI syntax,
reachability, content-profile conformance, and health remain client-tier
checks. Selection tracks winner presence separately:
no winner returns `(ordinal=0,score=0)`, while a real score-zero winner has a
nonzero ordinal; the content chapter's richer
CandidateSet/SelectionKey profile is the client-tier `SELECT_PROFILE_V2`,
explicitly deferred. (d) Unique-Records-by-Type live count decrements only
when a Record's **last live occurrence** withdraws (per-Record live-occurrence
fold), so the count means "unique Records with at least one live occurrence."
(e) Per-leaf total REF-instance bound `REF_INSTANCES_MAX = 16` is a
structural validation rule in the encoding chapter. DIRECT and
ARRAY_STRUCT_MEMBER ReferenceRole selectors (including
`ArtifactClosure.members[*].content`) count extracted instances, so index
fan-out is bounded and backlink completeness holds.

**SR-18f — generic page continuations.** `PageRequest.cursor` stays the
existing `uint256` page ABI, not an SDK-only opaque value. `b0-indexes.md`
§5.1a owns the two closed v1 encodings: ordinary `PageCursorV1` carries
`nextPosition`, `claimedEnd`, `basisOrdinal`, version 1, a 103-bit context tag,
and a zero reserved bit; `UniqueTypeCursorV1` substitutes exact
`outerNextIndex` plus `innerPlusOne` (`0` between Records; otherwise next inner
index + 1). Each tag binds exactly its family-specific §5.1a preimage:
ordinary includes query and endpoint mode, admission includes neither, and
unique-by-Type includes mode and Type. The separate `basisOrdinal` field binds
`H`; all tag preimages include Realm and exact `realmBasisAt(H)`.
`KIND_UNIQUE_BY_TYPE` alone selects the nested family. The endpoint recomputes
the tag and canonical end, range-checks every resume position, and rejects
wrong version, reserved bit, family-specific context, basis, end, range, nested
position, or input `CURSOR_END` with `ErrPageCursor(uint256)`. Initial zero
basis resolves once;
every resume supplies that encoded nonzero basis exactly. `maxItems` clamps to
at least one, scan/item stop order is fixed, and each PARTIAL result encodes the
exact next physical or outer/inner state, including empty dead-only pages;
COMPLETE alone returns `CURSOR_END`. This preserves MeasurementRow's existing
`uint256 nextCursor` identity and requires byte-identical SOL/TS/RS progress.
The admission family has exactly one enumerator, `admissionLogPage(PageRequest)
→ PageResult`; `admissionAt(uint64)` remains a point read. No parallel uint64
range cursor/result tuple is part of the Core ABI or result registry.

A Lens result carries `ResolvedTarget(targetKind,targetA,targetLeaf)` as one
indivisible value. NONE/RECORD require leaf zero; OCCURRENCE preserves the
leaf. Combiners, strict returns, and challenge rechecks compare all three, so
two leaves of one Envelope never alias.

## 3. The Stage A doc set → PM deliverables

| PM deliverable | Where |
|---|---|
| 1 Exact implementable B0 | [[b0-encoding-and-ids]], [[b0-authorship-envelope]], [[b0-principal-authority]], [[b0-realm-admission]], [[b0-indexes]], [[b0-binding]], [[b0-lens]], [[b0-content-locators]] + this overview's SR pins |
| 2 Smallest semantic model + alternatives | §1 above; per-chapter alternatives; exact mandatory cell interfaces in [[bakeoff-spec]] |
| 3 Traceability with labels | [[traceability]] (151 rows; 127 COVERED / 20 DEFERRED / 4 GAP) |
| 4 Controlled bakeoff spec | [[bakeoff-spec]] (9-cell fractional design, declared confounds) |
| 5 Frozen fixture/harness interfaces | [[harness-and-fixtures]] (10 fixtures; restricted-JCS manifest/vector container; binary result registry/outcomes; logical state projection; canonical measurement rows keyed by exact source/case/vector/step/input; "frozen" = fixed before Stage B measurement, not protocol-frozen) |
| 6 Golden-vector categories + falsifiers | [[vectors-and-falsifiers]] (GV-1..GV-18 + consolidated falsifier matrix) |
| 7 Proposed spine edits (no shared-file edits made) | corpus `proposed-spine-edits.md` (16 items, A1–D1) |
| 8 Durable evidence for journal-only claims | corpus `standards-audit.md`, `carry-in-register.md`, `intake-findings.md`, `redteam-findings.md` |

## 4. Stage boundary

Stage A contains **no byte vectors, no measurements, no prototype code, and
no deployed contracts**. Every gas number in the chapters is
schedule-derived arithmetic and is a [HYPOTHESIS] the Stage B harness
replaces; every size constant is re-derivable; the SR pins are proposals.
V2-E6 (Web Client slice) and V2-E7 (Commons venue) are out of scope; this
pass generates evidence for V2-E1..E5 and the V2-E8 seam, feeding V2-F1.

## 5. Open items rolled up to review

1. Per-Realm scope of the chains-don't-die assumption: **one disposition,
   set-wide** — the realm chapter's qualifying-Realm assumptions and
   `UNAVAILABLE_SOURCE_BASIS` behavior are designed to work under either
   answer; the question is surfaced to James **only** through the proposed
   spine edits (item A2), not asked now. The realm and content chapters'
   divergent phrasings are repaired to this disposition.
2. The revocation-aware-counter tradeoff returns to James only after the one
   aggregate Stage B gas snapshot ([OWNER RULING] — pay for it — stands).
3. EAP fixture provisional until the Codex durable brief lands.
4. Axis-4 (Variant A/B) and axis-8 (namespace qualifier) arms have exact
   executable cell interfaces; adoption remains bakeoff-evidence-then-James.
5. Challenge-window mechanics remain deliberately unfrozen ([OWNER RULING]
   item F preserved **in substance** — the realm chapter's "verbatim" claim is
   corrected to "substance-faithful paraphrase"; the ratified sentence itself
   is quoted in the proposed spine edits).

## Interfaces exposed

The SR-1..SR-18 pins are the cross-chapter interface contract. The vectors
chapter's `reconciles:` gates lift when the chapter repairs land.

## Open items

See §5. Residual chapter text contradicting an SR pin after repair is a
defect to file against this overview.
