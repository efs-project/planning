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
`expectedRevisions` is **required for every Binding-class leaf selected by
`leafMask`** — the Binding machine bans wildcard/blind realm-local writes; it
is empty only when no Binding-class leaf is selected.
`IntentId = keccak256(abi.encode(DOM_INTENT, …))`,
`DOM_INTENT = keccak256("efs2/admission-intent/1")`. Replay control is the
2-D nonce discipline: per-`nonceKey` **sequential lanes** (`lastSeq + 1`),
which realizes the realm chapter's consumed-intent registry. The realm
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
kinds. This word IS the receipt's authority-basis slot and IS what the
envelope-meta index row stores (the compressed `authorityBasisCode u16`
projection is retired). The authorship chapter's four-field struct is
superseded and regenerates against the word. `authEpoch` lives in the envelope
header (SR-2), not in the basis word.

**SR-8 — BindingHead layout (RP-8, S7).** Two slots.
Slot 0 (meta): `state u8 (0 = UNSET — the zero word IS absence, 1 = BOUND,
2 = TOMBSTONED) ‖ revision u32 ‖ currentOrdinal u48 ‖ targetKind u8 ‖
tombstoneCause u8 ‖ targetLeaf u16 ‖ reserved u112`. Slot 1:
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
mistaken author, since all leaves share one authenticated principal. Under
`publishBatch` (all-or-nothing composition of independent envelopes) any
element failure — this one included — aborts the batch; batch aggregation is
opt-in composition and aggregators pre-validate elements, as they already
must for expired intents and CAS conflicts. Rationale for revert: deterministic
all-or-nothing admission, and no inert kernel-class state (the
confirms-but-unreadable defect class).

**SR-10 — occurrence lifecycle store (RP-10, S6) — REPAIRED.** The single
owner is an **occKey-addressable status overlay**, not the ordinal-keyed log:
`mapping(occKey => OccStatus)` with
`OccStatus = { status u8 (0 = NEVER_ADMITTED, 1 = ACTIVE, 2 = WITHDRAWN,
3 = PRE_WITHDRAWN), ordinal u48 (0 = none; ordinals start at 1),
revokedAtOrdinal u48 }`. The ordinal-keyed admission log keeps the
pages/hydration role with **restored u48 widths**:
`{ occKeyRef, leafIndex u16, typeOrd u48, principalOrd u48 }`. Ordinals are
assigned **per accepted occurrence in submission order** — the
`base + k` consecutive-ordinal law is retired because leafMask subset and
staged admission (SR-3/SR-12) make it unsound. **Pre-withdrawal (T4) is
preserved and now implementable:** withdrawing a never-admitted occKey
requires presenting the target envelope's authenticated header (fields +
signature, no bodies) so admission recomputes `EnvelopeId`, verifies the
target's author equals the withdrawer, and sets `PRE_WITHDRAWN` — the
leaked-envelope defense with an evaluable author guard. `WITHDRAWN` and
`PRE_WITHDRAWN` permanently block (re-)admission of that occKey
(no-resurrection, SR-15). The one-way status flip drives the exactly-once
index decrement.

**SR-11 — kernel-known Types (RP-11).** The closed B0 list is exactly
`{ TYPE_BINDING_SET_V1, TYPE_BINDING_TOMBSTONE_V1, TYPE_WITHDRAWAL_V1 }`.
`ResolutionPlan/1` is deliberately NOT kernel-known. Concrete constants mint
in Stage B; the list is closed here and owned by the encoding chapter's
constants table. Binding-class body conventions must be legal under the
encoding chapter's REF/sentinel rules (first-write predecessor uses the
explicit NONE encoding, never raw 0).

**SR-12 — entrypoint and admission consent (RP-12, S1).** One permissionless
entrypoint `publish(envelopeBytes, principal, intentBytes, intentWitness)`:
anyone may carry a signed envelope, but admission-with-effects requires an
AdmissionIntent witnessed by the envelope's own Principal — author-only
consent over a permissionless rail (R-D8-clean). `admitAsSender` implicit
intent (msg.sender is the Principal's own account) is legal **only when the
envelope contains no Binding-class leaves**; Binding-class leaves always
require an explicit intent carrying `expectedRevisions` (SR-3). Uninvited
third-party carriage without an author intent is not local admission; copied
foreign evidence enters only through the import/Recognition lane as
source-qualified evidence (`AUTH_FOREIGN_ORIGIN` range), never destination
truth.

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
admission), not by duplicate reverts.

**SR-16 — RealmRevisionId (the predicted 13th seam).**
`RealmRevisionId = keccak256(abi.encode(DOM_REALM_REVISION, realmId,
keccak256(revisionDescriptorBytes)))`,
`DOM_REALM_REVISION = keccak256("efs2/realm-revision/1")`; the realm chapter
owns `revisionDescriptorBytes`. The encoding chapter's variant is superseded;
the encoding chapter also gains the `codexConstantsHash` definition and a
state-readable `codexConstants()` that the realm chapter's `profileId` and
`genesisCommitment` consume.

**SR-17 — schema on-ramp.** TypeSchemas enter state **as Records of the
bootstrap meta-Type through ordinary admission** (the realm chapter's
reconstruction-walk model wins — one uniform state-readable spine); the
registration entrypoint is a thin wrapper that admits the schema Record and
materializes the parsed-schema cache. The encoding chapter's standalone
non-Record registration function is superseded. Group registration
(recursion) rides the same path; the maximal-group-vs-tx-cap cross-check is a
named harness case.

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
an unbounded scan — THE LINE); the content chapter's richer
CandidateSet/SelectionKey profile is the client-tier `SELECT_PROFILE_V2`,
explicitly deferred. (d) Unique-Records-by-Type live count decrements only
when a Record's **last live occurrence** withdraws (per-Record live-occurrence
fold), so the count means "unique Records with at least one live occurrence."
(e) Per-leaf total REF-instance bound `REF_INSTANCES_MAX = 16` is a
structural validation rule in the encoding chapter (ARRAY(REF) role counts
included), so index fan-out is bounded and backlink completeness holds.

## 3. The Stage A doc set → PM deliverables

| PM deliverable | Where |
|---|---|
| 1 Exact implementable B0 | [[b0-encoding-and-ids]], [[b0-authorship-envelope]], [[b0-principal-authority]], [[b0-realm-admission]], [[b0-indexes]], [[b0-binding]], [[b0-lens]], [[b0-content-locators]] + this overview's SR pins |
| 2 Smallest semantic model + alternatives | §1 above; per-chapter alternative sketches; [[bakeoff-spec]] cells |
| 3 Traceability with labels | [[traceability]] (149 rows) |
| 4 Controlled bakeoff spec | [[bakeoff-spec]] (9-cell fractional design, declared confounds) |
| 5 Frozen fixture/harness interfaces | [[harness-and-fixtures]] (10 fixtures, measurement schema; "frozen" = fixed before Stage B measurement, not protocol-frozen) |
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
4. Axis-4 (Variant A/B) and axis-8 (namespace qualifier) arms: both fully
   sketched; adoption is bakeoff-evidence-then-James.
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
