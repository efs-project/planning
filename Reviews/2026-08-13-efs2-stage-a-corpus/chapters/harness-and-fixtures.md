# B0 harness & fixtures — fixture and measurement-harness interfaces
**Stage A chapter — post-red-team repair; not landed, adopts nothing.**

Assembly Lane B of the Stage A commissioned pass (2026-08-12). PM deliverable 5:
"frozen fixture and measurement-harness interfaces." This chapter delivers (1) each
fixture as an interface — object graph in B0 terms, workload script, measurements
fed; (2) the measurement-harness interface — measured quantities, one reporting
schema, Realm gas profiles, workload knobs; (3) the spam/churn/hot-value
adversarial workloads as named scripts; (4) the fixture-freeze rule.

**What "frozen" means here (say-so required by the PM deliverable):** frozen =
**fixed before Stage B measurement**, so every bakeoff cell is measured against
byte-identical inputs and cross-cell deltas are attributable to the flipped axis
alone. It is NOT protocol-frozen: nothing in the corpus — fixture-pack Type
Schemas included — becomes EFS protocol surface by being in it, and the corpus is
versioned and replaceable between measurement campaigns (§5). [PROPOSAL — the
freeze discipline itself; rationale: the intake BAKEOFF lane's comparability
requirement ("Freeze the fixture corpus and workload scripts before the first
measurement so every cross-cell delta is attributable to its flipped axis" —
audit-lanes.json BAKEOFF, VERIFIED).]

Chapters consumed (all read in full, VERIFIED): `b0-encoding-and-ids` (Lane 1),
`b0-authorship-envelope` (Lane 2), `b0-principal-authority` (Lane 3),
`b0-realm-admission` (Lane 4), `b0-indexes` (Lane 5), `b0-binding` (Lane 6),
`b0-lens` (Lane 7), `b0-content-locators` (Lane 8). Spine sources: PM Stage A
directive, kickoff, system-constitution, core-architecture-candidate (VERIFIED);
intake audit `audit-lanes.json` (VERIFIED). Owner-ruling citations below are made
via the chapter that verified them (this lane did not re-read owner-rulings.md;
such claims are PLAUSIBLE-via-cited-chapter unless marked otherwise).

---

## 0. Scope and posture

- The harness measures **candidate implementations of the 9 bakeoff cells** (B0
  "SPINE", single-flip cells F1–F7, interaction cell X17 — audit BAKEOFF lane,
  VERIFIED) against **one frozen corpus** of fixtures and workloads. Nothing here
  ratifies a cell.
- [DERIVED INVARIANT — kickoff "Measure aggregate calldata, SSTORE/state growth,
  cold/warm write and read gas, not isolated happy-path functions" (VERIFIED,
  Required technical gates)] Every measurement in this chapter is trace-level or
  bundle-level; no isolated happy-path function numbers are reportable results.
- [DERIVED INVARIANT — kickoff fixture rule "An application needing a custom Core
  kind, contract, or private index for an ordinary typed relationship is a
  candidate falsifier" (VERIFIED)] Every fixture below is built ONLY from the B0
  chapters' generic surface plus corpus-owned application Type Schemas (§2.0.2).
  A fixture that cannot be expressed that way is reported as a falsifier finding,
  never patched with bespoke Core surface.
- No product builds: no forge, no OS, no production mounts, no full Arcade
  [DERIVED INVARIANT — kickoff "Do not build a forge, OS, three production
  mounts, or full Arcade inside this pass", VERIFIED]. FX-MOUNT is a read-only
  golden-view interface only (§2.9).
- Prototypes driven by this harness are disposable; no deployment, no durable
  seeding [DERIVED INVARIANT — kickoff Outputs section + PM directive line 20,
  VERIFIED].

---

## 1. Harness architecture

### 1.1 The abstract fixture-op language (FixOp)

[PROPOSAL — the repaired SR-1..SR-18 interface is the B0 contract. Scripts stay
in abstract ops so bakeoff cells can flip one axis through a `CellAdapter`
without changing corpus intent. The adapter must prove that every B0 op maps to
the repaired interface rather than choosing among historical conflicts.]

Closed op set (a script is an ordered list of these; every op names the acting
principal from the fixture cast):

```text
-- write plane --
GEN_PRINCIPAL(castId, authorityKind)            -- Lane 3 AccountPrincipal/1
PUBLISH_SCHEMA_GROUP(castId, schemaGroupRef)     -- TypeSchemaGroup/1 Record;
                                                 --   ordinary publish + atomic cache
PUBLISH(castId, leaves[], packHint)              -- sign + admit one envelope;
                                                 --   leaves = (typeRef, bodySpec)[]
BIND(castId, purpose, subject, fieldRole,        -- Lane 6 BindingSet/1 leaf +
     targetSpec, expectedRevision)               --   intent CAS carriage
TOMBSTONE(castId, purpose, subject, fieldRole, expectedRevision)
WITHDRAW(castId, targetOccRef)                   -- Lane 6/2 Withdrawal/1
-- read plane (each maps to a named chapter ABI; §3.1 read matrix) --
READ_POINT(what, key...)                         -- getRecord/getEnvelope/getOccurrence/
                                                 --   readHead/getBindingHead/counts...
READ_PAGE(family, key..., PageRequest)           -- Lane 5 pagePostings/admissionLogPage/...
RESOLVE(planRef, positionKey [, strictMask])     -- Lane 7 resolve/resolveStrict
SELECT_LOCATOR(targetKey, spec, basis)           -- Lane 5 §7 B0_SELECT; TS/RS SELECT_PROFILE_V2 is separate
VERIFY_RANGE(chunkTreeRef, range, locatorSet)    -- Lane 8 §8.2 client machine
RECONSTRUCT()                                    -- Lane 4 §8 walk W-0..W-10, 2nd impl
-- control plane --
EXPECT(assertion)                                -- typed assertion incl. MUST-FAIL(err)
M_K_POINT(k, orderedLeaves[64])                  -- frozen axis-1 comparison; §3.1
ADVANCE(blocks | seconds)
SNAPSHOT(label) / REVERT_TO(label)               -- EVM test-node state bookmarks
AS_REALM(realmInstance)                          -- multi-Realm scripts (CV-XREALM)
INJECT_PID(rawPrincipalId)                       -- test-only low-160 injection, Lane 3 §2.6
```

Every write op and every enclosing trace carries:

```text
atomicityClass = MUST_FIT_ATOMIC | SPLITTABLE_THROUGHPUT
splitBoundary  = NONE | BETWEEN_INDEPENDENT_ENVELOPES
```

Each concrete `PUBLISH`, `PUBLISH_SCHEMA_GROUP`, `BIND`, `TOMBSTONE`, and
`WITHDRAW` call is `MUST_FIT_ATOMIC`. Workload campaigns may be
`SPLITTABLE_THROUGHPUT` only at explicitly declared independent-envelope
boundaries (§3.3); the class never changes when an op exceeds a Realm cap.

`PUBLISH.packHint` interacts with the `K_BATCH` knob (§3.4): the deterministic
packer `PACK(k)` groups the script's pending logical leaves into envelopes of at
most `k` leaves in script order, never reordering across a `BARRIER` pseudo-op.
The packer, not the script, decides ordinary workload envelope boundaries.
`PACK(k)` may form envelopes only inside a `SPLITTABLE_THROUGHPUT` campaign;
every resulting envelope remains one `MUST_FIT_ATOMIC` call. An over-cap
`PACK(k)` point is reported `OVER_CAP` for that exact k, never silently replaced
with smaller envelopes. Axis-1 `M-K` does not reuse this throughput behavior:
`M_K_POINT` has the fixed all-or-nothing B0/F1 transaction shapes in §3.1.
[PROPOSAL]

### 1.2 Determinism and seeding

[PROPOSAL — every run of the corpus is byte-reproducible across the three
languages, or golden vectors are meaningless]

- One corpus master seed `CORPUS_SEED = keccak256("efs2/fixture-corpus-seed/1")`.
- All fixture randomness (principal keys, salts, pubNonces, spam payloads, Zipf
  draws) comes from a deterministic DRBG:
  `draw(i) = keccak256(abi.encode(CORPUS_SEED, keccak256(utf8(fixtureId)),
  uint256(i)))`, consumed in declared order. All tuple fields are fixed-width or
  hash-normalized; cross-language bytes are identical.
- Honesty note for FX-PRIV: Lane 1 §1.5 requires ≥128-bit CSPRNG-grade salts.
  Corpus salts are DRBG-derived and therefore *publicly derivable by anyone
  holding the corpus* — acceptable for measurement and for MUST-FAIL vectors,
  but the dictionary-oracle PASS vectors treat `CORPUS_SEED` as the "user-held
  secret": the attacker model in those vectors is explicitly denied the seed.
  Stated in the vector docs so nobody mistakes fixture salts for a production
  pattern. [PROPOSAL]
- Principal cast: kinds drawn per fixture table; keys derived from the DRBG (no
  real user keys). The Lane 3 worked-example EOA (dev account #0) appears only in
  the `PID-DERIVE` golden vectors, never in workload measurement (avoids warm/
  cold pollution from vector reuse). [PROPOSAL]

### 1.3 Resolved seam aliases and executable repair gates

S1–S8 remain stable historical aliases, but every row is **RESOLVED** by the
post-red-team SR target. A `CellAdapter` has no discretion to revive a losing
shape:

| Alias | Status | Winning pin | Harness consequence |
|---|---|---|---|
| S1 | RESOLVED | SR-12, with SR-13 descriptor carriage | one permissionless `publish(envelopeBytes, AccountPrincipal, intentBytes, intentWitness)`; author consent; implicit sender forbidden when any of the three kernel-effect Types is selected |
| S2 | RESOLVED | SR-3 | exact EIP-712 AdmissionIntent with leafMask; one ordered `expectedRevisions[]` item per selected BindingSet/Tombstone including ACTIVE duplicates, none for Withdrawal; u192/u64 nonce lane; action MBZ=ADMIT |
| S3 | RESOLVED | SR-6 under SR-1 | hashed domain words + fixed-word `abi.encode` PositionKey/BindingKey formulas |
| S4 | RESOLVED | SR-4 | u64 external/reporting ordinals, u48 physical guard |
| S5 | RESOLVED | SR-5 | 64 leaves; 8,192-byte envelope/body caps; fit remains measured |
| S6 | RESOLVED | SR-10 and SR-15 | one occKey lifecycle overlay; per-new-occurrence ordinals; idempotent duplicates |
| S7 | RESOLVED | SR-8 | exact two-slot BindingHead; one-SLOAD absence/two-SLOAD present probe |
| S8 | RESOLVED | SR-2 | EIP-712-digest-wrapped EnvelopeId with ordered RecordId vector and authority seam |

Additional red-team repair gates cover seams the old table missed:

- SR-9: wrong-author Withdrawal reverts the whole envelope.
- SR-13/SR-14: explicit descriptor carriage, pre-verification PrincipalId
  equality, and the one PrincipalId formula.
- SR-16: one RealmRevisionId formula.
- SR-17: schema groups are Records admitted by ordinary `publish`, with cache
  materialization in the same atomic call.
- SR-18(a-e): shared u16 digest vocabulary, fail-closed Completeness values,
  total-posting locator visit bounds, last-live unique counts, and the
  `REF_INSTANCES_MAX = 16` bound.
- Reference extraction consumes the exact three-byte
  `(fieldIdx,selectorKind,memberIdx)` tail; only DIRECT and
  ARRAY_STRUCT_MEMBER exist, and the Arcade closure vector extracts
  `ArtifactClosure/1.members[*].content` through the latter.
- ResolutionPlan bodies include the `u16(frameLen)` prefix and parsers begin at
  offset 2; N=64 therefore exercises the 4,194-byte body, not a raw frame.
- Realm setup consumes the exact seven-field fixed-width `InitConfig/1`, B0
  protocol 0.0, and checks `GenesisFactsView`, genesis controller,
  revision-1 policy/authority, EIP-1967 facts, and transition history.
- Binding history is RAW_AUDIT: never liveness-filtered/decremented/compacted;
  reads hydrate occurrence status and `revokedAtOrdinal`.
- Admission alone validates Withdrawal target evidence and passes the exact
  ten-field `ValidatedOccurrenceLifecycleEffect` to both LibIndex and
  LibBinding; no opaque evidence bytes or repeated verifier crosses either seam.
- `TargetEnvelopeEvidence` carries a fixed
  `TargetRecordCommitment(typeSchemaId,bodyHash)`, never the target body, and
  authenticates it by recomputing the signed RecordId with `DOM_RECORD`.
  Maximal evidence is 7,808 bytes (`32+384+2,080+1,184+4,128`); the aggregate
  cap is 8,192 and whole-wire cap 16,384. A same-Envelope target derives the
  pair from its RecordId-matched carried body. Retained reads expose the signed
  recordId/type/principal but no body, postings, live fold, or Binding head for
  a never-admitted target.

The corpus ABI shape is exact: `TargetRecordCommitment = (bytes32
typeSchemaId,bytes32 bodyHash)` and `TargetEnvelopeEvidence = (uint16
withdrawalLeafIndex,EnvelopeHeader header,bytes32[] recordIds,
TargetRecordCommitment targetCommitment,AccountPrincipal targetPrincipal,bytes
witness)`. Any prior LeafBody-bearing evidence encoding is invalid.
- Non-idempotent admission uses one ascending, bounded point-in-order shadow.
  A static pass associates revision items, prospective ordinals and all
  lifecycle/Binding/index effects are journaled sequentially, and every
  user-controlled error occurs before state. Commit only asserts and replays
  the frozen before/after journal.
- Content tests separate structural admission from profile eligibility: URI,
  cross-field/chunk math, sorted/unique members, and kind-target checks may make
  a structurally admitted Record ineligible, but Core does not reject them.
  ArtifactClosure names are STRING(255): Core accepts empty but the profile
  rejects it; maximal member/body arithmetic is 298/4,770/27, with the
  16-reference budget governing.
- IndexSpec vectors use exactly `u8 indexKind|u8 target`; selector vectors use
  explicit `winnerPresent`, with no winner `(0,0)` and a real zero-score winner
  carrying a nonzero ordinal.
- Reconstruction persists/returns canonical **unsigned** envelope bytes;
  AdmissionReceipts and batches retain historical validation basis.

Harness/vector execution is blocked until every consumed pin is VERIFIED in
all owning chapters and the Task 6 retired-form residue search passes. The
adapter `PUBLISH_SCHEMA_GROUP` may call SDK helper
`registerTypeSchemaGroup(...)`, but it must prove the helper constructs the
intrinsic Record and calls the sole Core `publish`; no second entrypoint or
two-step materialization is permitted. [PROPOSAL]

### 1.4 Canonical corpus and vector source bytes

All corpus-owned JSON uses RFC 8785 JCS, UTF-8, no BOM, and no trailing
newline, with this restricted profile: JSON numeric tokens are forbidden;
integers are minimal unsigned decimal strings; binary values are lowercase
even-length `0x` hex (full width where fixed); protocol names/enums are
printable ASCII; human text is NFC and control-free; unknown/duplicate keys,
duplicate IDs/paths, invalid UTF-8, symlinks, and platform separators reject.
Arrays retain semantic order unless a field below specifies sorting. Solidity
never parses JSON. [PROPOSAL — exact harness interface]

The freeze tree has exactly these top-level directories:
`domains/`, `fixtures/`, `interfaces/`, `profiles/`, `scripts/`, `toolchain/`,
and `vectors/`. Every regular descendant is included. Generated manifests,
cell implementations, builds, reports, measurements, caches, and VCS metadata
are excluded. Relative POSIX paths match `[a-z0-9][a-z0-9._/-]*`, with no
empty, dot, dot-dot, leading, or trailing segment.

`corpus-manifest.json` has exactly:

```json
{"domainManifest":"0x<exact corpusDomainManifestBytes>","entries":[{"bytes":"<u64 decimal>","keccak256":"0x<bytes32>","path":"<path>"}],"format":"efs2-stage-b-corpus/1"}
```

Entries sort by unsigned-ASCII path bytes; `bytes` is exact file length and
the digest is `keccak256(fileBytes)`. The manifest itself is not an input file
and does not contain its own version.

```text
canonicalCorpusBytes = RFC8785(corpus-manifest object)
corpusVersion = keccak256(abi.encode(
  DOM_FIXTURE_CORPUS, keccak256(canonicalCorpusBytes)))
```

Every `vectors/*.json` root has exactly `format`, `resultRegistryHash`,
`setups`, and `vectors`; format is `efs2-stage-b-vectors/1`. Setups sort by
`(cellId,id)` and vectors by `(category,id,cellId)` in unsigned ASCII.

```text
Setup { cellId; id; Step[] steps }
Vector {
  atomicityClass; category; cellId; description; id; impls;
  reconciles; requiresPins; setupId; stateDigest; Step[] steps; tier
}
Step { actor; args; expect; opName }
Success { bytes; kind="success"; resultSchemaId }
Failure {
  arguments; code; kind="error"; namespace; resultSchemaId
}
```

Cell IDs are exactly B0, F1..F7, X17. `impls` is an ordered subset of SOL, TS,
RS; tier is CORE, SDK, or FIXTURE; atomicity is MUST_FIT_ATOMIC,
SPLITTABLE_THROUGHPUT, or N/A. Categories are GV-1..GV-18 or named CV/H cases.
Setup IDs are globally unique with cellId; vector IDs are stable printable
ASCII and never reused; `setupId` references the same cell or is `-`.
Descriptions are NFC. Arguments/success bytes are canonical ABI tuples in lowercase hex. Error
arguments exclude the selector; code is minimal-decimal nonzero u32 other than
`2^32-1`. `reconciles` and `requiresPins` sort numerically. Every write is
followed by explicit public reads. State-machine vectors carry a non-null
digest; stateless vectors carry null. At freeze no expected output or required
digest may remain null. `resultRegistryHash=keccak256(resultSchemaRegistryBytes)`;
a mismatch rejects before execution.

Every executed Vector step emits exactly one base CONFORMANCE
`MeasurementRow` with `fixtureId` equal to the exact `GV-*`, `CV-*`, or `H-*`
source, `caseId` equal to its stable member id, `vectorId=Vector.id`, and
`stepIndex` equal to its zero-based position. Supplemental cold/warm or gas
rows may share that vector only when their temperature/profile/key fields
differ. A row whose vector id, case id, step index, opName, canonical input, or
expected state cannot be joined back to exactly one frozen Vector rejects.

Mandatory freeze checks are executable corpus members:

- **H-JCS/H-MANIFEST:** reject JSON numbers, BOM/newline, non-NFC, duplicate or
  unknown keys, invalid/symlink/dot paths, wrong ordering/length/digest, and
  excluded artifacts entering the manifest; TS/RS reproduce identical bytes
  and corpusVersion. The same check rejects a measurement report with bare
  `fixtureId="CV"`, an invalid/missing `caseId`, mismatched `vectorId` or
  `stepIndex`, invalid signed-state-growth spelling, duplicate
  `MeasurementRowKey`, unsorted rows, unknown/missing row keys, or a root/row
  corpusVersion/resultRegistryHash mismatch or mixed/wrong-filename cell ids.
- **H-RESULTREG:** every ABI/FixOp/read/cell operation appears exactly once;
  any name/schema/error change moves registry hash and corpusVersion; actual
  revert selector+arguments match its namespace/code entry. Every row
  independently re-derives the exact nonzero `inputDigest` from the registered
  input tuple; a one-bit argument, opName, or schema change must move it.
- **H-OUTCOME:** success, typed error including zero arguments, and N/A rows
  produce exact bytes/digests/sentinels; an assertion cannot substitute for an
  operation result. `inputDigest`, `resultDigest`, and `stateDigest` are tested
  as three distinct fields/preimages and cannot alias one another. Missing,
  extra, or semantically unequal language rows under one ComparisonKey reject.
- **H-STATE:** insertion-order and physical-layout permutations normalize to
  one within-cell digest; changing a nonce, dead posting, retained evidence,
  history status, receipt basis, or F4 coverage changes it; reverted calls do
  not, while log/cache-only changes are excluded. Each state-bearing vector's
  terminal row equals its `Vector.stateDigest`; intermediate rows carry their
  exact post-step digest. A stateless/null-state vector row has zero
  `stateDigest`, and swapping either form fails before report acceptance.
- **H-DOMTABLE:** all six F1/F3/F4 domains occur once in the corpus manifest
  and never in `codexConstantsHash`; retired spellings reject.
- **H-CELLS:** F1's SR-3 intent bytes remain B0-exact with CardId/mask=1; F3
  has the one bound type/digest and no intent object; F4 enforces one pending,
  CAS, scan-16, single revision increment, cursor invalidation, two-profile
  fan-out, and COMPLETE/retirement semantics.

---

## 2. Fixture interfaces

### 2.0 Common conventions

**2.0.1 Fixture anatomy.** Every fixture is `(cast, types, objectGraph,
script, adversarial, measurements)`. Script phases are named `A, B, …`; steps
`FX-XXX.B3` are citable by the red team and by measurement rows. Every write
step names its author; every read step names its expected outcome **including
completeness/basis fields** — a read asserted without its honesty fields is a
corpus defect [DERIVED INVARIANT — constitution honest-reads block, VERIFIED].

**2.0.2 Fixture-pack Type Schemas (corpus content, not protocol).** All are MC/1
`TypeSchemaBlob`s (Lane 1 §3.1) with `namespaceQualifier = 0` (convergent) unless
noted; published as intrinsic `TypeSchemaGroup/1` Records by
`PUBLISH_SCHEMA_GROUP` in each fixture's phase A; their TypeSchemaIds
are corpus golden vectors. Reused protocol-adjacent schemas come from the
chapters: `ObjectGenesis/1`, `TypeSuccessor/1` etc. (Lane 1 §§4.1, 6);
`BindingSet/1`, `BindingTombstone/1`, `Withdrawal/1` (Lane 6 §3.2); the Lane 8
content family; `ResolutionPlan/1` (Lane 7 §3). Fixture-pack additions
[PROPOSAL — field kinds per Lane 1 §2.2; roles get REF_BACKLINK indexes unless
"no idx"]:

The kernel fixtures consume these exact owner schemas, never a corpus-local
projection: BindingSet's fields are `(purpose,subject,fieldRole,
targetRecord OPTION(REF RECORD),targetOccurrence OPTION(OCCREF OCCURRENCE),
predecessor OPTION(OCCREF OCCURRENCE))`; exactly one target option is present
or the write returns `E_STRUCTURAL(...,17)`. Tombstone is the three position
words plus predecessor and no target. Withdrawal is one direct OCCREF whose
body is exactly 34 bytes. Dense ReferenceRoles and REF_BACKLINK specs cover
each reference exactly once. Legal target classes are exactly RECORD,
TYPESCHEMA, PRINCIPAL, OCCURRENCE, OBJECT; ADDRESS/REALM/BYTEDIGEST reject.
Digest equality uses `KIND_DIGEST=0x09` with `DOM_VK_DIGEST`. The three
concrete TypeSchemaIds and every dependent expected byte remain Stage B
outputs over these frozen blobs.

| Type | Fields | Roles (class) |
|---|---|---|
| `Comment/1` | body STRING(2048) | target REF(ANY); replyTo OPTION(OCCREF)(OCCURRENCE) |
| `CatalogMembership/1` | note OPTION(STRING(256)) | catalog REF(OBJECT); member REF(OBJECT) |
| `Compatibility/1` | runnerProfile BYTES_FIXED(32); verdict UINT(1) [1..3] | release REF(RECORD, expected ArtifactRelease/1) |
| `RightsEvidence/1` | rightsKind UINT(1); uri OPTION(STRING(2048)) | subject REF(ANY) |
| `GitPushTransaction/1` | updates ARRAY(STRUCT{refName STRING(255), oldOid OPTION(DIGEST), newOid DIGEST}, max 64) | repo REF(OBJECT) |
| `WikiPageRev/1` | note OPTION(STRING(256)) | page REF(OBJECT); content REF(RECORD); prev OPTION(OCCREF)(OCCURRENCE) |
| `Issue/1` | title STRING(256); body STRING(4096) | repo REF(OBJECT) |
| `PullRequest/1` | title STRING(256); baseRef STRING(255) | repo REF(OBJECT); patch REF(RECORD) |
| `Review/1` | verdict UINT(1) [1..3]; body STRING(4096) | pr REF(RECORD) |
| `Reaction/1` | glyph STRING(16) | target OCCREF(OCCURRENCE) |
| `TeamMembership/1` | — | team REF(OBJECT); member: PRINCIPAL field, SCALAR_EQ idx |
| `Edit/1` | — | target OCCREF(OCCURRENCE); replacement REF(RECORD) |
| `AchievementDefMeta/1` | name STRING(128); criteria STRING(2048) | def REF(OBJECT) |
| `AchievementAward/1` | subject: PRINCIPAL field, SCALAR_EQ idx; note OPTION(STRING(512)) | def REF(OBJECT); evidence OPTION(REF)(ANY) |
| `Topic/1` | name STRING(128) NAME_PROFILE | — (ownerless; unique-by-Type read) |
| `TopicTag/1` | — | topic REF(RECORD, expected Topic/1); target REF(ANY) |
| `UnitValue/1` | quantity UINT(8); unit STRING(32) | — (ownerless literal) |
| `EncryptedRecord/1` | encProfile UINT(2); ct BYTES(4096) | — (opaque body; baseline idx only) |
| `DatasetMeta/1` | license STRING(64); note STRING(1024) | dataset REF(OBJECT) |
| `ServiceMeta/1` | name STRING(128); endpointHint OPTION(STRING(2048)) | service REF(OBJECT); provider REF(OBJECT) |

Repeated nested references use the closed ReferenceRole path grammar. In
particular `ArtifactClosure/1.members[*].content` uses
`ARRAY_STRUCT_MEMBER(memberIdx=content)`; ordinary top-level roles use DIRECT.
`expectedType` remains one Type id or a named sentinel. Small multi-Type sets
and semantic kind-target claims are profile checks, never implicit Core
callbacks or an unbounded fixture exception.

**2.0.3 Cross-cutting conformance suite CV-\*** — run once per bakeoff cell,
before that cell's workload measurement; all are pass/fail gates feeding M-CONF:

- **CV-RAIL** — Lane 2 §9 / Lane 3 AUTH-INV-4 rail substitution: identical
  envelope+intent bytes via (a) author EOA, (b) unrelated relayer, (c) 4337-style
  bundler → byte-identical persisted authorship; ordinal/block MAY differ.
- **CV-PID160** — injected low-160-colliding PrincipalIds (Lane 3 §2.6
  `PID-LOW160`) exercised through storage, postings keys, Binding heads, plan
  entries, and page results end to end.
- **CV-AUTHCHAIN** — GV-5 / SR-13/SR-14: a valid attacker witness plus
  attacker descriptor presented with victim `header.principalId` fails
  `AUTH_PRINCIPAL_MISMATCH` before envelope or intent witness verification;
  first-use PrincipalRecord bytes may come only from the verified descriptor.
- **CV-XREALM** — two Realm instances; copy one signed envelope from source to
  destination; destination shows evidence-not-truth (grades per Lane 4 §4.2);
  intent replay across Realms MUST-FAIL (`E_REALM_MISMATCH`-class); constitution
  cross-Realm acceptance trace (VERIFIED).
- **CV-SUBSET** — Lane 2 §7 subset carriage: full RecordId vector + partial
  bodies verifies; truncated vector / reordered vector / wrong-position body
  MUST-FAIL; unrevealed-leaf dictionary caveat vector (low-entropy body guessed
  from its RecordId — documents, not defends).
- **CV-CLOCK** — R-D9 misleading-clock vectors (audit SURVIVORS lane, VERIFIED):
  absurd `observedAtClaim`/`probedAtClaim`/`horizonClaim` values (year 1970,
  year 9999) never move B0's declared u64 score/latest-ordinal selection; if
  `SELECT_PROFILE_V2` is separately run in TS/RS, they never move that
  profile's admitted-evidence ordering either; same-author same-content
  multiple occurrences at one
  position remain distinct occurrences (no equivocation rule resurrect —
  [REJECTED mechanism per Lane 6 §5, cited there]).
- **CV-7702** — Lane 3 §4 three-point vector (before/under/after delegation) +
  kind-1-vs-kind-2 distinct-Principal check.
- **CV-WITHDRAW** — Lane 2 §3.2 T1–T6 + Lane 6 T1–T9 state machines,
  including no-resurrection, wrong-author whole-envelope revert, and
  idempotent double withdrawal. Binding history remains RAW_AUDIT: physical
  revisions/counts never decrement or filter, while hydrated status and
  `revokedAtOrdinal` change through the occurrence overlay. Admission builds
  the exact lifecycle context `(target,targetOccKey,targetPrincipalId,
  priorStatus,priorOrdinal,priorRevokedAtOrdinal,evidenceOrdinal,
  targetEffectKind,targetBindingKey,targetIsCurrentBindingHead)`; Index and
  Binding consume byte-identical copies and never parse evidence. A static
  pass consumes one ordered revision item per selected BindingSet/Tombstone,
  including ACTIVE duplicates; only fresh sources compare the item against the
  current point-in-order shadow head, and Withdrawal has no item.
- **CV-SPARSE-ADMIT** — GV-8/GV-9, SR-10/SR-15: admit leaves `{0,3,7}`, then
  the remainder; verify per-new-occurrence submission-order ordinals,
  reversible hydration, no holes/derived base law, and duplicate no-op.
- **CV-PREWITHDRAW** — GV-9, SR-9/SR-10/SR-15: authenticated target
  header/vector + `TargetRecordCommitment(typeSchemaId,bodyHash)` + signature,
  with no target body, creates `PRE_WITHDRAWN` at target ordinal 0; the
  `DOM_RECORD` recomputation and both commitment-word flips are checked. Later
  admission fails; wrong/forged author reverts with zero delta; repeat succeeds
  using retained evidence. `T4-MAX-BODY` proves an 8,192-byte target body is
  absent from wire/state: its EOA/65-byte-witness evidence is exactly 800 bytes,
  and the maximal legal evidence shape is 7,808 bytes under the aggregate cap.
  Retained reads return recordId/typeSchemaId/principalId but no target body or
  never-created index/head state. Admission alone constructs the lifecycle
  context; neither downstream owner receives evidence bytes. A same-Envelope
  target instead derives the pair from its authenticated header/vector and
  RecordId-matched carried body and rejects duplicate caller evidence.
- **CV-SHADOW** — GV-9/GV-10/GV-18, SR-3/SR-10/SR-15: run the four owner-pinned
  same-call traces. (1) bind→withdraw nets its normal posting/live delta to zero,
  tombstones the head, and appends both RAW_AUDIT revisions; (2) sequential
  same-key binds use `(NONE,xr=0)` then `((E,0),xr=1)` and finish revision 2,
  while stale/reversed CAS has zero state delta; (3) withdraw-before-later-target
  stages PRE_WITHDRAWN then fails the later source's no-resurrection with nonce,
  counters, Envelope/evidence/receipt/index/head unchanged; (4) duplicate
  external prewithdraw consumes one evidence item, reuses its planned retained
  bytes for the terminal sibling, admits both sources consecutively, and stores
  exactly one evidence value; a second caller item fails prewrite. Compare the
  exact final occurrence, Binding, posting-head, Record-live, unique-zero-crossing,
  and RAW_AUDIT journal outcomes in SOL/TS/RS.
- **CV-DIGEST-LOOKUP** — GV-14/GV-16, SR-18a/b: publish and query one
  digest-bearing Record with the same u16 `algCode`; legacy u8/u32 encodings
  are typed-unsupported/rejected and can never produce `COMPLETE`-empty.
- **CV-LAST-LIVE-COUNT** — GV-9/GV-14, SR-18d: two live occurrences of one
  Record; first withdrawal leaves unique-by-Type count 1, last withdrawal
  makes it 0, and retries do not change it.
- **CV-SCHEMA-CAP** — GV-2, SR-17: `PUBLISH_SCHEMA_GROUP` is
  `MUST_FIT_ATOMIC`; validation and deterministic cache materialization occur
  in the same call. Test the maximal legal group against each Realm cap. An
  over-cap result is a hard on-ramp observation with `splitFactor = 1`, never
  a staged group commitment.
- **CV-RECON** — `RECONSTRUCT()` (Lane 4 §8 walk) executed by the second
  implementation after every fixture's final phase; it re-encodes the exact
  seven-field InitConfig/genesis facts, checks direct/UUPS EIP-1967 slot
  invariants and implementation/current-authority getters, folds the chained
  AuthorityTransitions into the latest revision, reads canonical unsigned envelopes, and treats
  receipts/batches as historical validation evidence without claiming to
  recover discarded main witnesses. It decodes retained prewithdraw evidence,
  recomputes the signed target RecordId from TypeSchemaId/bodyHash, and confirms
  that a never-admitted target has no body/posting/live/head state. Any §3.2a
  state mismatch fails the cell.

[PROPOSAL — suite composition; each member cites its owning chapter's vector
category and exists so the fixture scripts stay workload-shaped instead of
smuggling conformance into every trace.]

---

### 2.1 FX-ARC — Arcade (post-verification release lane)

Per the candidate's worked example ("Worked example: Arcade without Arcade Core
code", core-architecture-candidate.md lines 363–388, VERIFIED): Locator and
observation evidence may precede exact closure; verification adds the closure
and exact Release without rewriting earlier Records.

**Cast:** `P_pub` (publisher, EOA), `C1`,`C2` (curators; C1 EOA, C2 ERC-1271
contract account — exercises Lane 3 kind 2 in a real trace), `P_c` (commenter,
KEY_P256), `P_r` (rights attester, EOA), `P_evil` (hostile publisher, EOA),
10 endorsement principals `E1..E10` (EOA).

**Object graph (logical writes, in order; packing by PACK(k)):**

| # | Record / action | Type (owner) |
|---|---|---|
| 1 | GameProject genesis (salted charter) | ObjectGenesis/1 (Lane 1 §4.1) |
| 2 | Project metadata — **no dedicated GameMetadata type is minted**: display metadata rides `ArtifactRelease/1.notes` (any-Record role, Lane 8 §9) + a `Topic/1` tag | [PROPOSAL — falsifier probe: if Arcade display turns out to need a dedicated metadata type, that is a reportable finding, not a corpus patch] |
| 3 | Pre-verification: `Locator/1` (uri = primary mirror, NO observation group) targeting the project genesis | Lane 8 §3 |
| 4 | Pre-verification: `Locator/1` with observation group (digest+size+claim) | Lane 8 §3 |
| 5–6 | `ChunkTree/1` ×2 (game.wasm 96 MiB @ CHUNK_SIZE_DEFAULT; assets.pak 512 MiB synthetic) | Lane 8 §5 |
| 7 | `ArtifactClosure/1` {game.wasm EXEC_FILE, assets.pak FILE} | Lane 8 §7 |
| 8 | `RepresentationBinding/1` (sha2-256 whole-file ↔ closure) | Lane 8 §6 |
| 9 | `RuntimeRequest/1` (wasm profile, 2 capabilities) | Lane 8 §9 |
| 10 | `ArtifactRelease/1` v1.0 (subject=1, artifact=7, runtime=9, custodyFloor=2) | Lane 8 §9 |
| 11–12 | `Locator/1` ×2 targeting the closure (primary + fallback mirror) | Lane 8 §3 |
| 13–14 | `AvailabilityObservation/1` + `DurabilityGrade/1` (class FUNDED_PINNED) for each locator | Lane 8 §10 |
| 15–16 | `CatalogMembership/1` by C1 and C2 (their catalogs = own ObjectGenesis records) | fixture pack |
| 17 | C1 Binding: SelectedRelease — `BIND(C1, purpose="release-head" (Lane 8 §9), subject=projectId, fieldRole=0, target=release v1.0, xr=0)` | Lane 6 T1 |
| 18–19 | `Comment/1` on release + threaded reply (replyTo = comment occurrence) | fixture pack |
| 20 | `Compatibility/1` (runner profile, verdict COMPATIBLE) | fixture pack |
| 21 | `RightsEvidence/1` by P_r | fixture pack |
| 22 | 10 endorsement occurrences of the SAME release RecordId by E1..E10 (ten envelopes, one Record — the candidate's ten-curator trace, VERIFIED lines 176–181) | re-publication |
| 23 | Release v1.1 (new closure) + C1 REBIND (T2, CAS xr=1) | Lane 6 T2 |

**Script:** A: cast+types+1–2. B: 3–4 (pre-verification lane; project readable
with zero content claims). C: 5–14 (verification lane; run at K_BATCH curve —
this phase is the axis-1/5 k\*-crossover trace). D: 15–22 (curation/social).
E: **index-evolution event** — mint `Comment/2` (adds one SCALAR_EQ IndexSpec),
publish `TypeSuccessor/1{Comment/1→Comment/2, COMPATIBLE_SUPERSET}`, write 5
comments under /2, re-read old and new (BAKEOFF lane: "script one
index-evolution event mid-way through the Git and Arcade fixture timelines",
VERIFIED; under cell F4 this exercises IndexProfile coverage instead). F: 23.

**Adversarial:** (i) tampered primary — primary locator serves one corrupted
chunk: `VERIFY_RANGE` hits MISMATCH, rotates to fallback, completes A3; asserts
Lane 8 §8.2 rotation and that MISMATCH indicts the locator, never the content;
(ii) `P_evil` publishes a fake release + own locator for the project; guest read
shows both releases author-qualified; C1's Binding and a 1-entry plan resolve
only the curated one (no "official bit" — candidate, VERIFIED); (iii) executable
gate refusal at coverage n−1 (Lane 8 §8.3); (iv) `B0_SELECT` runs through the
index §7 declared-score/latest ABI with physical-visit accounting; a separate
TS/RS-only `SELECT_PROFILE_V2` run may compare health-first and grade-first
client profiles across the tampered trace, but is labeled deferred and never
substitutes for the B0 Core result.

**Measurements fed:** M-K (frozen 64-point comparison, phase C), M-AGG (full-trace bundle),
M-PAGE (Project→Releases, target→Comments, Artifact→Locators backlinks),
M-SEL (`B0_SELECT` SOL/TS/RS plus separately labeled client-profile rows), M-COUNT
(endorsement liveCount before/after one E-principal withdraws), M-CLIENT
(tampered-fallback wall time), M-STATE. Axis relevance: 1, 5, 7; Lane 7 §8
LENS-NEG-1 runs in FX-LENS, not here.

---

### 2.2 FX-GIT — Git/Markdown

**Cast:** `M1`,`M2` (maintainers, EOA), `D1..D4` (contributors: 2 EOA, 1
KEY_P256, 1 ERC-1271), `Team` (ObjectGenesis + TeamMembership records),
`P_evil` (replay attacker).

**Object graph:**

| Cluster | Records |
|---|---|
| Repo identity | `ObjectGenesis/1` RepoId — stable across all history [satisfies "stable repo identity"] |
| Native objects | `ByteDigest/1{ALG_GIT_SHA1_OBJECT}` per commit/tree/blob OID touched (foreign digests only — Lane 8 §1.1; never EFS identity, Lane 1 §2.4) |
| Content | Markdown/wiki page bytes as `ChunkTree/1` (+ `RepresentationBinding/1` git-blob ↔ chunk tree, Lane 8 §6 Git interop) |
| Push | `GitPushTransaction/1` — ONE typed Record carrying all ref updates of a push = the atomic multi-ref transaction Record [DERIVED INVARIANT — constitution: "Git multi-ref and similar all-or-nothing meaning lives in one typed transaction Record", VERIFIED] |
| Ref heads | per ref: Binding at `(purpose = TypeSchemaId(GitPushTransaction/1), subject = RepoId, fieldRole = keccak256(abi.encode(DOM_FIELDROLE, keccak256(utf8(refName)))))`, `DOM_FIELDROLE = keccak256("efs2/fieldrole/1")` (Lane 6 §1.1–1.2), targeting the push Record; SR-3 `expectedRevisions[]` = replay-safe authenticated push |
| Wiki history | `WikiPageRev/1` chain (prev = predecessor occurrence) + per-page current-rev Binding |
| Collaboration | `Issue/1`, `Comment/1` (reused), `PullRequest/1`, `Review/1`, `ArtifactRelease/1` (repo releases), `Reaction/1`, `TeamMembership/1`, `Edit/1` (edit history on comments/issues) — all clonable: plain Records + occurrences, no Core primitive |
| Issue status | maintainer Binding at `(purpose = TypeSchemaId(Issue/1), subject = issueRecordId-as-subject, fieldRole = 1)` → open/closed head |

**Script:** A: cast/types/repo genesis/team. B: base history — 30 commits as six
five-commit pushes. P1–P5 each update only `refs/heads/main`; P6 is the one
designated `PUSH-WORST-20` below. Wiki: 8 page revisions across 2 pages. C:
collaboration — 6 issues (2 closed via Binding), 3 PRs (patch closures,
2 reviews each, 1 merged → push), 1 release, 12 reactions, 3 edits (edit-history
reads must show both versions with provenance). D: index-evolution event
(`Issue/2` + successor evidence, as FX-ARC.E). E: **walk-away reconstruction** —
delete every client cache/db; second implementation runs `RECONSTRUCT()`; then
re-derives a stock-git-clonable tree (commits/blobs from content bytes +
RepresentationBindings) and byte-compares against the original working tree;
issues/PRs/reviews/comments/reactions/teams/edit history all rebuilt from state
alone [DERIVED INVARIANT — constitution Git/Markdown acceptance trace, VERIFIED].

**Adversarial:** (i) replayed push intent (same signed intent twice) MUST-FAIL
nonce/consumption; (ii) racing pushes — D1 and D2 race one ref with the same
`expectedRevision`: exactly one admits, loser gets `ErrCasPredecessor`-class
typed revert carrying the current head (Lane 6 §3.5); (iii) forged-author push
(witness/principal mismatch) MUST-FAIL; (iv) SHA-1 honesty — two distinct EFS
Records carrying the same (synthetically colliding) foreign OID digest coexist;
EFS identity unaffected; the read layer shows the digest as foreign-only
[DERIVED INVARIANT — Lane 1 §1.1 foreign-digest rule]; (v) CV-CLOCK applied to
commit-claimed timestamps.

`PUSH-WORST-20` is frozen as exactly 20 ref updates in one
`GitPushTransaction/1`: `refs/heads/main` moves from P5's tip to P6's tip, and
the 19 refs `refs/heads/bench/01` through `refs/heads/bench/19` are created
from absent `oldOid` to that same P6 tip. Its update array is bytewise
ref-name order (`bench/01`…`bench/19`, then `main`). No other push is called
worst-case, and no workload may resize or repack this designated trace.

The Git push semantic unit — its `GitPushTransaction/1` Record plus the
declared ref-head Binding updates — is `MUST_FIT_ATOMIC`. It is never retried as
separate ref updates. **EIP-7825 arithmetic (in-chapter, per the exactness bar):** worst corpus push =
20 ref updates ⇒ 1 GitPushTransaction leaf + 20 Binding leaves. Using Lane 6
§3.6's ≤90k/Binding-leaf estimate + Lane 2 §2.5's model: 21 leaves ≈ 20×90,000 +
(1 push-record leaf ≈ 60k storage+postings) + G_FIXED 150k ≈ **2.07M gas ≈ 12.3%
of the 16,777,216 cap** — single-tx atomic. Ceiling: gas, not the leaf cap —
⌊(16.78M − 150k)·0.9 / 90k⌋ ≈ 166 ref updates/tx on RP-L1, so SR-5's 64-leaf
structural cap is the predicted limiter. [HYPOTHESIS — the measured
`MUST_FIT_ATOMIC` row governs; an over-cap trace fails rather than splitting.]

**Measurements fed:** M-AGG (including the exact 20-ref/21-leaf atomic push),
M-K (the separate fixed ordinary-Record comparison slice; `PUSH-WORST-20` is
never repacked), M-PAGE (issues by repo,
comments by issue, occurrences by author D1 = author enumeration under churn),
M-COUNT (open-issue live counts), M-REC (reconstruction pass/fail + wall time),
M-STATE (state growth per year of simulated history via WL-CHURN §4), plus the
Lane 5 COMPOUND gate probe: assert every ref-head and issue-list read needs ≤ 2
page reads with single-key indexes; if any needs more, that is the evidence
Lane 5 open item 3 awaits.

---

### 2.3 FX-EAP — achievements [PROVISIONAL]

**[PROVISIONAL — PM directive line 19: "Treat EAP as provisional until Codex
supplies a durable brief" (VERIFIED). This fixture's rows are measured and
reported but excluded from adopt/kill decisions until the brief lands; its
interface is designed to survive brief-driven renaming.]**

**Cast:** `Issuer` (game/org, ERC-1271), `S1..S3` (subjects, EOA),
`P_spam` ×20 (hostile principals), `Gate` (consumer contract).

**Object graph:** `ObjectGenesis/1` per achievement definition +
`AchievementDefMeta/1`; awards = `AchievementAward/1` occurrences (def role,
subject PRINCIPAL field); lifecycle: revoke = `Withdrawal/1` of the award
occurrence; **gate-grade point read** = Issuer Binding at
`(purpose = TypeSchemaId(AchievementAward/1), subject = defObjectId,
fieldRole = keccak256(abi.encode(DOM_FIELDROLE, subjectPrincipalId)))`, where
`DOM_FIELDROLE = keccak256("efs2/fieldrole/1")` → head targets the current
award Record (or TOMBSTONED). [PROPOSAL — award-as-occurrence carries
the evidence and enumeration; issuer-Binding carries the O(1) authoritative
check. Rationale: BindingKey embeds the ISSUER principal (Lane 6 §1.3), so no
volume of hostile third-party awards can touch the gate's read path.]

**Script:** A: types + 3 defs. B: 8 awards across S1..S3 (occurrence + issuer
bind per award). C: lifecycle — revoke one award (Withdrawal ⇒ T7 tombstone of
its head + count decrement), re-award later (fresh occurrence, T5 rebind — not
resurrection, Lane 6 §3.4). D: `Gate` resolves "does S1 hold live award of def
D?" via a 1-entry ResolutionPlan over the issuer's head — `resolveStrict`,
FOUND-only mask.

**Adversarial (hostile subject-targeting spam):** `P_spam` publish 2,000
`AchievementAward/1` occurrences naming S1 (they cannot bind the Issuer's keys —
Lane 6 §1.3). Assertions: (i) the Gate's point check gas is UNCHANGED (±1 cold
SLOAD) vs the clean state — the authoritative check is bounded regardless of
spam [DERIVED INVARIANT — constitution EAP acceptance trace: "hostile
subject-targeting spam cannot make the authoritative point check unbounded",
VERIFIED]; (ii) enumeration of awards-naming-S1 pages honestly with
PARTIAL+cursor and visible `coverage` dilution (Lane 5 §5.2); (iii) WL-SPRAY
(§4) runs on this key-space for its economics measurement.

**Measurements fed:** M-LENS (1-entry plan resolve cold/warm), M-PAGE under
spam, M-COUNT (revocation-aware award counts — [OWNER RULING — item E,
revocation-aware counts "PAY for it", cited via b0-indexes §6]), M-CONF
(lifecycle machine), WL-SPRAY economics.

---

### 2.4 FX-NANDA — provider/service/skill discovery

**Cast:** `Prov` (provider, ERC-1271), `Cat1`,`Cat2` (rival catalog curators,
EOA), `Guest` (unauthenticated reader — no principal at all), `Consumer`
(execution-side client).

**Object graph:** `ObjectGenesis/1` for Provider, Service, and each catalog;
`ServiceMeta/1` (service+provider roles); skill releases = `ArtifactRelease/1` +
`ArtifactClosure/1` + `ChunkTree/1` + `RuntimeRequest/1` (Lane 8 §§5–9); plural
catalogs = `CatalogMembership/1` occurrences by Cat1 and Cat2 independently;
per-catalog selected-release Binding by each curator (as FX-ARC.17 — 2 curators
⇒ 2 independent heads, never one global winner, Lane 6 §7); evidence =
`AvailabilityObservation/1` + `DurabilityGrade/1` + `Compatibility/1`.

**Script:** A: genesis + metadata. B: skill v1 release chain + locators +
evidence. C: both catalogs admit membership; both curators bind selections.
D: **yanking** — Prov withdraws release v1's occurrence (Withdrawal); Cat1
tombstones its selection (T3); Cat2 does nothing. Reads at a pinned basis show:
Cat1 view = NONE_EXPLICIT-class head, Cat2 view = still-bound head over a
WITHDRAWN-graded occurrence — two catalog-qualified answers, displayed
separately, never merged [DERIVED INVARIANT — constitution cross-Realm/currency
honesty; Lane 6 §6.1 outcome set]. Skill v2 released; Cat2 rebinds. E: **guest
inspection** — `Guest` performs Lane 4 §3 C-1..C-7 realm checks, then browses
provider→services→releases→closures→evidence entirely via read ABI: zero
principal, zero wallet interaction, zero Commons dependency [OWNER RULING —
fresh-Realm standalone usefulness, 2026-08-12, cited via b0-realm-admission §2].

**Adversarial (discovery-never-authorizes):** `Consumer` holds catalog
membership + release + RuntimeRequest but NO Lens resolution and incomplete
coverage: the executable gate MUST refuse (Lane 8 §8.3 — request ≠ grant;
[DERIVED INVARIANT — constitution "Discovery and presentation metadata never
authorize execution", VERIFIED]). Then with a risk-bearer-pinned plan + A3
coverage, execution proceeds. A crafted `CatalogMembership/1` with maximal
glyph/note fields attempts metadata-driven capability injection — inert by
construction (no field of any discovery Record reaches the grant path); asserted
by code inspection + a canary capability check. [PROPOSAL — fixture assertion]

**Measurements fed:** M-PAGE (catalog membership pages at basis; plural-catalog
disagreement reads), M-COUNT (yank propagation: liveCount drops at the fold,
basis-pinned pages before the fold unaffected — FSP-BASIS-1 discipline, Lane 5
§5.2), M-CONF (guest checklist C-1..C-7; discovery-never-authorizes), M-CLIENT
(guest cold-open wall time: descriptor → verified first page).

---

### 2.5 FX-LENS — contract configuration (V2-E2 benchmark)

**Cast:** Core plan principals `Q1..Q64` (56 EOA, 4 KEY_P256, 2 KEY_RSA, 2
ERC-1271 — exercises every Lane 3 authority kind on the resolve path's
admission side), plus corpus-only client principal fixtures `Q65..Q256`;
`GateAdmin`; `M` (beneficiary attacker); the two CV-PID160 injected principals
appear as plan entries 63–64 of the N=64 plan.

**Object graph:** config positions `PositionKey(purpose = "config/point" tag
per Lane 7 §3.3, subject = protocolObjectId, fieldRole ∈ {feeBps, oracle,
pauseFlag})`; `BindingSet/1` heads by plan principals; `ResolutionPlan/1`
Records at N ∈ {1, 8, 32, 64} for each combiner (EXACT, PRIORITY_FIRST_PRESENT
with 2 tiers, THRESHOLD k = ⌈N/2⌉) — 12 plans; `ExampleGate`-pattern consumer
(Lane 7 §8) pinning one plan.

**Core script + measurement grid:** for each plan × each outcome class
{first-present, last-present, all-absent, conflict, tombstone-contributes-
absent, threshold-met, threshold-split}: `RESOLVE` measured COLD then WARM
(same-tx repeat) — this is the constitution's 1/8/32/64 acceptance benchmark
(VERIFIED) realized on the real head layout, replacing Lane 7 §9's schedule
arithmetic [HYPOTHESIS there — closed here]. Plan-load vs probe cost split
reported per row (drives Lane 7 open item 4, PLAN-STORE-B decision rule).
Combiner transition coverage: every T1–T10 asserted once (golden), then
measured. Every result and gate snapshot carries the full
`ResolvedTarget(targetKind,targetA,targetLeaf)`. Add two non-alias vectors:
RECORD vs OCCURRENCE with equal `targetA`, and two OCCURRENCE targets sharing
one EnvelopeId but different leaves; exact/threshold combiners must report
conflict rather than collapse them. Challenge finalize compares all three
fields plus winner identity. The Core grid remains exactly
`N={1,8,32,64}`. [PROPOSAL]

**Distinct client-tier grid (never submitted as an on-chain Plan):** TS and RS
resolve `N={50,100,256}` from paged B0 reads on two corpus-pinned reference
profiles, `MOBILE_REF` and `DESKTOP_REF`. Each profile records hardware model,
OS/runtime version, logical cores, RAM, RPC transport, and local/remote endpoint
mode in the frozen manifest. Every `(N, profile, lang)` row reports wall time,
peak memory, RPC count, page count, result digest/equality, and propagation of
`UNKNOWN`/`PARTIAL`. No test constructs a 100- or 256-entry on-chain
`ResolutionPlan/1`, and the client grid does not imply a Core cap above 64.

**Adversarial:** LENS-NEG-1 exactly as Lane 7 §8 (beneficiary self-authorization
three-way negative); purpose-mismatch (display plan pinned into a gate rejects
on `purposeAndScope` check); challenge-window commit → equivocating rebind
inside window → finalize ABORT (decision-scoped recheck, Lane 7 §11); malformed
plans — one MUST-FAIL vector per rejection code 1–13 (Lane 7 §3.5).

**Measurements fed:** M-LENS (Core grid — THE V2-E2 deliverable), M-CLIENT
(50/100/256 mobile+desktop grid), M-CONF
(LENS-NEG-1, window pattern, rejection codes); M-LENS also records a gated
batch of 5 resolves in one tx for warm amortization. Feeds Lane 7 §3.4 cap confirmation and the
`readHeadBatch` cost row (Lane 6 open item 6).

---

### 2.6 FX-TOPIC — universal Topic + ownerless typed literal

**Cast:** `A1`,`A2` (independent authors, EOA), plus WL-HOT's spray cast.

**Object graph & script:** A: `Topic/1{"solarpunk"}` published independently by
A1 and A2 ⇒ **same RecordId, two Occurrences** (record-level convergence twin of
Lane 1's T-CONV vector; asserts author-neutral exact content, candidate
falsifier 4 held); `UnitValue/1{299792458, "m/s"}` likewise — the ownerless
typed literal with no fake owner [DERIVED INVARIANT — constitution "Relations
with no natural single subject must not be forced into a fake owner/object",
VERIFIED]. B: 40 `TopicTag/1` occurrences from both authors tagging FX-ARC and
FX-GIT objects (cross-fixture references — the corpus is one graph). C: reads —
topic backlink pages ("everything tagged solarpunk"), unique-Records-by-Type
page for Topic/1, counts.

**Adversarial:** WL-HOT (§4) uses `Topic/1{"solarpunk"}`'s RecordId as its
canonical hot key; WL-SPRAY runs its spray-then-self-revoke pass here too.
Assert THE LINE: per-page read cost flat in total key cardinality (Lane 5 §8).

**Measurements fed:** M-PAGE (hot-key paging curves), M-COUNT (live counts
under spray), M-STATE, convergence golden vectors.

---

### 2.7 FX-PRIV — sensitive encrypted Record

Scope note: B0 pins no AEAD/KEM construction (privacy constructions are
carried-in proposals — audit CARRY-IN privacy findings, VERIFIED there). The
fixture tests the SEAMS the chapters own; `EncryptedRecord/1.encProfile`
versions the construction so Stage-B crypto work slots in without corpus churn.
[PROPOSAL]

**Cast:** `P_priv` (author, EOA), `P_obs` (retrieval observer / hostile RPC),
`P_dict` (dictionary attacker holding the public corpus minus CORPUS_SEED).

**Script & assertions:**

1. **Plaintext-never-signed:** the harness instruments the signing path: the
   sensitive plaintext byte-string appears in NO signed transcript, NO canonical
   body, NO calldata — encryption precedes signing [DERIVED INVARIANT —
   constitution: sensitivity policy "encrypts sensitive or explicitly private
   plaintext before signing or publication", VERIFIED]. Assertion = byte-scan of
   every artifact the trace produced.
2. **Dictionary/oracle checks:** the same low-entropy plaintext (`"true"`, a
   16-bit counter value) published (a) as a public `UnitValue/1`-class Record
   and (b) inside an `EncryptedRecord/1` with a §1.2-seeded salt: RecordIds are
   unrelated; `P_dict` enumerating the guessable plaintext space against public
   ids gets zero private hits [DERIVED INVARIANT — Lane 1 §1.5 salt rule +
   CARRY-IN dictionary-oracle checklist, VERIFIED there]. MUST-FAIL twin: a
   deliberately unsalted low-entropy private body IS matched — proving the test
   has teeth.
3. **AEAD-transplant rejection:** ciphertext lifted from Record X's body into a
   new Record Y (different id/AAD context): decryption MUST fail under any
   conforming `encProfile`. Runs as a client-conformance vector against the
   profile stub. [PROPOSAL — seam test; exact AAD transcript is Stage-B crypto
   work]
4. **Batch-linkage rejection:** an envelope mixing one public leaf and one
   `EncryptedRecord/1` leaf is rejected by SDK conformance (separate envelopes
   per tier — CARRY-IN PC-11, VERIFIED there); the harness asserts the SDK
   refuses to build it AND documents that the chain itself does not enforce it
   (client-policy boundary stated honestly) [DERIVED INVARIANT — constitution:
   "Public and private material must not share a signed batch or context…",
   VERIFIED].
5. **Retrieval-observer disclosure:** reads via `P_obs`'s endpoint: the client
   result names the observing party and what it could see (object identity +
   query pattern), per constitution "Retrieval integrity never implies interest
   privacy" (VERIFIED). Assertion on the client result model fields.
6. **Index neutrality:** the encrypted Record gets baseline indexes only; no
   scalar/backlink family exists that leaks body structure (its Type declares
   none). M-STATE row compares its fan-out F(leaf)=4 against a public leaf.

**Measurements fed:** M-CONF (1–5), M-STATE (6); no gas grid — privacy costs
ride the ordinary write path by design (the "no frozen kernel surface"
hypothesis, CARRY-IN, re-verified structurally here).

---

### 2.8 FX-50GB — staged large content with durability/funding grades

**Byte-plane honesty [PROPOSAL]:** the harness never moves 50 GB through CI.
Chunk bytes come from a deterministic byte oracle `stream(i) =
DRBG(fixtureId="FX50", i)` generated on demand; the full-scale trace runs the
LADDER and SELECTION at true parameters (`totalSize = 53,687,091,200`,
`chunkCount = 204,800` @ CHUNK_SIZE_DEFAULT — Record-plane only, bodies are
tiny); the byte-plane acquisition machine runs at reduced scale (512 MiB real
verification) plus arithmetic extrapolation. Gas rows are exact (Record plane);
client wall-time rows are labeled `SCALED`.

**Cast:** `P_pub` (EOA), `Relayer` (builds the ChunkTree — not the author;
proves the tree has no author-secret inputs, Lane 8 §8.1), `Mirror1`,`Mirror2`,
`Prober`, `Funder`.

**Script (Lane 8 §8.1 ladder, phase per rung):**
P0: `ObjectGenesis/1`. P1: `Locator/1` (bare URL — the phone-paste write; ONE
small record [DERIVED INVARIANT — constitution 50 GB trace, VERIFIED]).
P2: observation-group `Locator/1` + whole-file `ByteDigest/1`.
P3: `ChunkTree/1` (by Relayer) + `RepresentationBinding/1` (P2 digest ↔ tree);
earlier Records byte-unchanged (monotone accretion asserted by RecordId
equality). P4: `ArtifactRelease/1` with `custodyFloor = FUNDED_PINNED`.
Evidence: two mirrors' `Locator/1`; `DurabilityGrade/1` (Mirror1
FUNDED_PINNED + fundingUri; Mirror2 BEST_EFFORT); `AvailabilityObservation/1`
by Prober (Mirror1 COMPLETE; Mirror2 PARTIAL k<n).
Acquisition: A0→A3 at 512 MiB scale — arbitrary ranges (`VERIFY_RANGE` at
offsets crossing chunk boundaries + the short last chunk), partial/resume (kill
client at 40% coverage, resume from persisted bitmap; resume on a SECOND client
from public Records + fresh bitmap), per-range proof verification.
Grades: `custodyFloor` gate — release reads `BYTES_COMPLETE` only once a
COMPLETE observation at class ≥ FUNDED_PINNED exists (Lane 8 §9); before the
Funder's grade lands the read yields `BYTES_PARTIAL`-grade honesty.

**Adversarial:** Mirror1 turns hostile mid-acquisition (serves wrong bytes) —
MISMATCH rotation to Mirror2 without emitting one unverified byte; STALLED state
reports PARTIAL(k, n) and never absence, never early COMPLETE (Lane 8 §8.2 A4);
funding-oracle: absurd `horizonClaim` ignored by ranking (CV-CLOCK member).

**Measurements fed:** M-AGG (ladder Record-plane gas — the pasted-URL P1 write
is its own headline row), M-SEL (`B0_SELECT`; optional TS/RS
`SELECT_PROFILE_V2` rows are separate and profile-tagged),
M-CLIENT (range-verify throughput MB/s per language; resume latency), M-CONF
(coverage vocabulary + custodyFloor gating + never-claims-complete).

---

### 2.9 FX-MOUNT — pinned three-host golden view (interface ONLY)

**No mount is built in this pass** (kickoff prohibition, VERIFIED; task
directive). The fixture freezes the INTERFACE that any later mount consumes:

```text
GoldenView/1 = (realmId, basisOrdinal, planId, rootClosureRecordId)

ResolvedManifest/1 (canonical bytes; MC/1-style packed, u16-prefixed):
  u16 version = 1
  bytes32 realmId ‖ u64 basisOrdinal ‖ bytes32 planId ‖ bytes32 rootClosure
  u32 entryCount ‖ Entry × entryCount, sorted by full path bytewise:
    Entry = u16 pathLen ‖ path (joined member names, '/' separator)
          ‖ u8 kind (FILE|EXEC_FILE|SUBCLOSURE)
          ‖ u64 size ‖ u16 algCode ‖ digest
          ‖ u8 bytesGrade (BYTES_* per Lane 8 §8.2)
          ‖ u8 durabilityClass (§10.1 ordinal; 0 if ungraded)
          ‖ u8 presence (Lane 7 Presence enum for the entry's provenance reads)
          ‖ u8 provenancePresent
          ‖ bytes32 provenanceEnvelopeId ‖ u16 provenanceLeafIndex
             -- reversible OccurrenceRef; both fields zero iff not present
  u16 unknownCount ‖ UnknownEntry × unknownCount   -- UNKNOWNs are LISTED, never elided
```

[PROPOSAL — field set chosen so the manifest carries exactly what the
constitution's three-host trace requires visible: honest absence/UNKNOWN, exact
enumeration, verified sizes/digests, provenance, grades. Name-collision policy,
xattr projection, and host semantics are the mount lane's later work and are
explicitly NOT in this interface — the manifest commits raw member names (Lane 8
§7 rule 2).]

**Script:** build GoldenView over FX-ARC's release closure at a pinned basis;
two implementations independently materialize `ResolvedManifest/1` —
**byte-identical output is the pass criterion** (this is also the Files/Web/OS
parity seam: same manifest for same (Realm, policy, basis) — constitution,
VERIFIED). Re-materialize at a later basis after FX-ARC.F (rebind): manifest
differs only in the expected entries; the old-basis manifest is reproduced
exactly (basis-pinned determinism).

**Measurements fed:** M-CLIENT (materialization read count + wall time), M-CONF
(byte-identity ×2 implementations ×3 languages; UNKNOWN listing).

The `u16 algCode` and reversible provenance fields are corpus-interface bytes;
implementing this repaired layout requires the FR-3 corpus-version bump before
any measurement is compared.

---

### 2.10 FX-BROWSE — anonymous/guest dataset browse

**Decision required by the task: is this subsumed by Nanda guest inspection?
Ruling: partially subsumed — retained as a THIN named fixture.** [PROPOSAL]
Justification: (a) the constitution names "anonymous dataset browsing" as its
own expressibility requirement, and the intake SPINE lane flagged its missing
fixture (VERIFIED) — silent subsumption would re-open that finding; (b) the read
SHAPES differ: FX-NANDA.E exercises catalog/point/discovery reads, while
dataset browse exercises guest bulk-content RANGE reads and a Files-style
listing over a closure — the FX-50GB/FX-MOUNT machinery under a guest, which
FX-NANDA never touches; (c) marginal cost is one short script reusing existing
graphs. What IS subsumed and not repeated: the C-1..C-7 realm checks and the
no-wallet-prompt assertions import FX-NANDA.E's checklist by reference.

**Object graph:** dataset = `ObjectGenesis/1` + `DatasetMeta/1` +
`ArtifactClosure/1` of 4 `ChunkTree/1` CSV shards + `TopicTag/1` links +
locators/grades (reuses FX-50GB types at small scale, 64 MiB).

**Script:** `Guest` (no principal): realm checks (imported) → dataset discovery
via topic backlink → closure listing (FX-MOUNT manifest path) → ranged read of
shard 3 rows 1000–2000 with per-range verification → provenance display (who
published, which grades) — zero wallet, zero account, zero Commons; "guest"
means unauthenticated, not network-anonymous, and the retrieval-observer
disclosure (FX-PRIV.5) is displayed to the guest too [DERIVED INVARIANT —
constitution Web Client guest definition, VERIFIED].

**Measurements fed:** M-CLIENT (guest cold-open → first verified row), M-CONF.

---

## 3. The measurement-harness interface

### 3.1 Measured quantities (exact definitions)

Per the task: aggregate calldata, SSTORE/state-growth deltas, cold/warm
read+write gas, per-op and per-fixture-trace totals. Definitions [PROPOSAL —
each is mechanically extractable from a standard EVM test node trace]:

| Metric | Definition |
|---|---|
| `gasTotal` | receipt gas used of the tx (or `eth_call` gas for reads) |
| `gasCalldata` | intrinsic calldata gas under the profile's pricing (EIP-7623 floor applied when the profile says so) |
| `gasExec` | `gasTotal − gasCalldata − 21,000` |
| `calldataBytes` | raw tx input length |
| `sstoreNew` / `sstoreMod` | count of SSTOREs to zero-valued / nonzero-valued slots (trace-derived) |
| `sloadsCold` / `sloadsWarm` | EIP-2929 classification from the trace |
| `stateGrowthBytes` | 32 × (net new nonzero slots) + deployed code bytes; refund-cleared slots subtract |
| `returndataBytes`, `itemsReturned`, `completeness` | read-plane honesty fields |
| `realmId`, `realmBasis`, `basisOrdinal`, `highWaterOrdinal`, `coverage` | exact Realm/query context returned or fixed for the operation; `coverage` is examined-entry count |
| `resultSchemaId`, `resultDigest`, `typedErrorCode`, `crossImplEqual` | canonical output/error artifact and differential-equality fields (§3.2) |
| `postingsVisited`, `nextCursor` | physical selector work and resumability; dead/boundary reads included exactly as the endpoint reports |
| `wallMs`, `peakMemoryBytes`, `rpcCount`, `pageCount` | client-plane quantities (M-CLIENT rows; language + profile tagged) |

Metric bundles (referenced by fixtures): **M-AGG** per-fixture-trace totals and
the §3.5 aggregate bundle; **M-K** the fixed 64-point axis-1 transaction
comparison and derived k\*; **M-PAGE** paged
reads cold/warm at declared page sizes; **M-COUNT** `counts()` + fold costs;
**M-LENS** the FX-LENS grid; **M-SEL** selection determinism + gas; **M-REC**
reconstruction pass/fail + walk cost; **M-CONF** conformance pass/fail;
**M-STATE** state growth; **M-CLIENT** client-plane timings.

**Exact M-K comparison unit.** Each contributing fixture declares one ordered
`MK64` list of exactly 64 independent non-Binding Record leaves in the frozen
corpus manifest. Point `k` consumes the first `k` leaves; all 64 integer points
`k = 1..64` execute regardless of earlier results. `{1,3,10,64}` may be chart
labels only. It never controls execution, adds a point, or changes corpus
bytes.

- `G_B0(k)`: one EVM transaction, one ordinary Core `publish`, one independently
  signed envelope containing exactly `k` leaves.
- `G_F1(k)`: one EVM transaction to the pinned, disposable, test-only
  `F1AtomicAggregator`, carrying exactly `k` independently signed one-Record
  cards. Its stateless loop makes exactly `k` ordinary Core `publish` calls and
  bubbles any revert so the outer transaction is all-or-nothing. It adds no
  Core entrypoint or production mechanism.
- Both rows are `MUST_FIT_ATOMIC`, always have `splitFactor=1`, and record
  `OVER_CAP` at the exact k rather than splitting or substituting another
  transaction. B0 reports `coreCallCount=1, aggregatorGas=0`; F1 reports
  `coreCallCount=k` and `aggregatorGas` as outer-frame gas exclusive of the k
  Core subcall frames. The aggregator codehash is pinned in the toolchain
  manifest; deployment gas is excluded from G(k) and reported once as harness
  setup metadata.

Every pair has identical fixture prefix, Realm profile, `corpusVersion`, and
atomicity class. `KSTAR_1` is computed only after the full 64-point table: the
smallest measured k satisfying `G_B0(k) < G_F1(k)`, or
`NO_OBSERVED_CROSSING_WITHIN_1_64`. No interpolation, bisection, adaptive
measurement, or result-dependent corpus mutation is permitted.

**The mandatory read matrix.** Every named external read in the eight chapters
is measured cold AND warm at least once per cell — including the baseline reads
the intake SPINE lane found uncosted (admission-order pages under churn,
unique-Records-by-Type, Occurrences by Type/Record/Principal — VERIFIED
finding): `getTypeSchema, getRecord, getEnvelope, getEnvelopeBytes, getOccurrence,
getOccurrenceByOrdinal, getReceipt, admissionLogPage, pagePostings,
pagePostingsHydrated, counts, lookupByDigest, getBindingHead, getBindingAtBasis,
selectBestLocator` (Lane 5); `readHead, readHeadBatch, readHistory,
readOccurrenceStatus` (Lane 6); `resolve, resolveStrict, validatePlan`
(Lane 7); `envelopeHeaderOf, envelopeRecordIdsOf, occurrenceStateOf` (Lane 2);
`preWithdrawalEvidenceAt` with exact TargetRecordCommitment decoding (Lane 2);
`genesisFacts, implementationAddress, currentUpgradeAuthorityRef,
revisionCount/revisionAt/currentRevision, authorityTransitionCount/
authorityTransitionAt` and the remainder of Lane 4 §8.2 (CV-RECON). Every
result-registry entry uses the final seven-field/three-target-field ABI; prior
omitted-authority-ref and single-word-target schemas are absent. [PROPOSAL]

### 3.2 The reporting schema — one row shape for every cell × fixture × workload

```text
MeasurementRow {
  corpusVersion   bytes32     -- §5; rows with different values never compared
  cellId          string      -- "B0" | "F1".."F7" | "X17"
  fixtureId       string      -- exact source id: FX-* | CV-* | GV-* | H-* | WL-* | CORPUS;
                              -- bare "CV" is forbidden
  caseId          string      -- stable corpus case/member id; never "-"
  vectorId        string      -- exact Vector.id, or "-" when no vector owns the row
  stepIndex       uint32      -- zero-based step within that vector/script; STEP_NA otherwise
  workloadId      string      -- "-" or WL-SPRAY/WL-CHURN/WL-HOT/WL-DEAD-LOCATOR + knob hash
  realmProfileId  string      -- §3.3
  clientProfileId string      -- MOBILE_REF | DESKTOP_REF | "-"
  phase           string      -- "C", "P3", …
  opClass         enum        -- WRITE | READ_POINT | READ_PAGE | RESOLVE | SELECT
                              --  | VERIFY | RECONSTRUCT | AGGREGATE | CONFORMANCE
  opName          string      -- FixOp or ABI function name
  atomicityClass  enum        -- MUST_FIT_ATOMIC | SPLITTABLE_THROUGHPUT | N/A
  overCap         bool        -- true iff the exact measured unit exceeds txGasCap
  splitFactor     uint16      -- MUST_FIT_ATOMIC always 1; campaign split count otherwise
  coreCallCount   uint16      -- B0 M-K=1; F1 M-K=k; 0 when no Core call
  aggregatorGas   uint64      -- F1 outer-frame gas excluding Core subcall frames; 0 otherwise
  k               uint16      -- batch size (writes) / page size (reads) / plan N
  n               uint32      -- repetition count aggregated into this row
  temperature     enum        -- COLD | WARM | MIXED
  gasTotal, gasExec, gasCalldata          uint64
  calldataBytes, returndataBytes          uint32
  sstoreNew, sstoreMod, sloadsCold, sloadsWarm  uint32
  stateGrowthBytes  int64
  inputDigest     bytes32     -- canonical invocation digest; always nonzero
  resultPresent   bool        -- true for an encoded success or typed-error artifact
  resultSchemaId  bytes32     -- frozen ResultSchema/1 id; zero iff !resultPresent
  resultDigest    bytes32     -- tagged canonical outcome digest; zero iff !resultPresent
  errorNamespace  bytes32     -- frozen error-vocabulary id; zero for success/N/A
  typedErrorCode  uint32      -- ERROR_NONE=0; ERROR_NA=2^32-1; otherwise exact table code
  errorDataDigest bytes32     -- hash of canonical typed-error arguments; zero for none/N/A
  crossImplEqual  enum        -- NOT_APPLICABLE=0 | FALSE=1 | TRUE=2
  stateDigest     bytes32     -- exact §3.2a post-step digest; zero only when state is N/A
  realmId         bytes32     -- zero only when the op has no Realm context
  realmBasis      bytes32     -- RealmRevisionId; zero when N/A
  basisOrdinal    uint64      -- exact requested/resolved basis; ORDINAL_NA when N/A
  highWaterOrdinal uint64     -- exact returned high-water; ORDINAL_NA when N/A
  coverage        uint32      -- examined-entry count; COVERAGE_NA when N/A
  itemsReturned   uint16      -- exact count; ITEMS_NA when N/A
  completeness    enum        -- UNKNOWN=0|COMPLETE=1|PARTIAL=2|UNSUPPORTED=3|N/A=255
  postingsVisited uint16      -- selector total reads; POSTINGS_NA when N/A
  cursorApplicable bool       -- false only when cursor semantics do not apply
  nextCursor      uint256     -- exact cursor/CURSOR_END when applicable; 0 iff !cursorApplicable
  assertionStatus enum        -- NOT_APPLICABLE=0 | FAIL=1 | PASS=2
  wallMs          uint32      -- 0 unless M-CLIENT
  peakMemoryBytes uint64      -- 0 unless M-CLIENT
  rpcCount        uint32      -- 0 unless M-CLIENT
  pageCount       uint32      -- 0 unless M-CLIENT
  lang            string      -- "sol" | "ts" | "rs" | "-"
  note            string      -- ≤ 128 chars; SCALED / PROVISIONAL flags here
}
```

`fixtureId` names the exact corpus source, not merely its family. The closed
values are the ten `FX-*` ids in §2, the fifteen `CV-*` ids in §2.0.3,
`GV-1..GV-18`, `H-JCS`, `H-MANIFEST`, `H-RESULTREG`, `H-OUTCOME`, `H-STATE`,
`H-DOMTABLE`, `H-CELLS`, the four `WL-*` ids in §4, and `CORPUS` for a
corpus-wide bundle/compile statistic. A row with `fixtureId="CV"` is malformed.
`caseId` uses `[A-Za-z0-9][A-Za-z0-9._/-]{0,127}` and identifies the exact
member or script step (`CV-SHADOW/SHADOW-1`, `GV-1/MAX-BODY-PLUS-1`,
`FX-ARC.C3`, `H-JCS/JSON-NUMBER`, `SIZE_6`). `vectorId` is the byte-identical
`Vector.id` from §1.4 when a vector owns the row and `-` otherwise. In a
vector-owned row there is no independent naming choice:
`fixtureId=Vector.category`, `caseId=Vector.category || "/" || Vector.id`, and
`stepIndex` is the zero-based index into `Vector.steps`. In a
fixture/workload script, `caseId` is its printed citable step id and
`stepIndex` is the zero-based index in that exact script.
`STEP_NA = 2^32-1` is legal only for aggregate/compile/report-only rows. These
fields are corpus data: renaming or reassigning one triggers FR-3.

For every row, `opName` resolves through the frozen result registry even when
`resultPresent=false`. Let `operationSchemaId` be that operation's
`resultSchemaId`, and let `canonicalInputBytes` be the canonical ABI tuple
under its registered input type (aggregate operations register the ordered
child-row-key tuple they consume):

```text
inputDigest = keccak256(abi.encode(
  DOM_MEASUREMENT_RESULT, uint256(0), operationSchemaId,
  keccak256(canonicalInputBytes)))
```

The discriminator word keeps invocation evidence disjoint from the existing
result and state preimages without minting another domain. `inputDigest` is
always nonzero. `resultDigest` remains the canonical outcome digest below and
MUST NOT be substituted for either `inputDigest` or `stateDigest`.

**Canonical measurement report bytes [PROPOSAL — exact].** Each Stage B cell
emits one `measurements/<cellId>.json` restricted-JCS file whose root has exactly
`{corpusVersion,format,resultRegistryHash,rows}` and whose format is
`efs2-stage-b-measurements/1`. Root `corpusVersion` and
`resultRegistryHash` equal every row/the frozen corpus, and every row's
`cellId` equals the filename cell; a mismatch rejects.
Every row object has exactly the fields in `MeasurementRow` above; missing,
unknown, or duplicate keys reject. JSON booleans are booleans; strings are
NFC/control-free; bytes32 values are full-width lowercase `0x` hex; unsigned
integers are minimal unsigned decimal strings; `stateGrowthBytes` alone is a
fixed-width lowercase two's-complement `0x` plus 16 hex digits; enum values are
their exact printed ASCII names; no value is null. The report has UTF-8, no
BOM, and no trailing newline.

Rows sort by this typed key (strings/bytes by unsigned byte order, integers by
numeric value, enums by their declared numeric code):

```text
MeasurementRowKey := (
  corpusVersion, cellId, fixtureId, caseId, vectorId, stepIndex,
  workloadId, realmProfileId, clientProfileId, phase,
  opClass, opName, atomicityClass, k, temperature, lang, inputDigest)
```

Two rows with the same key reject; repetitions of the same invocation are
folded into `n`, never emitted as duplicate rows. The root `rows` array is in
strict ascending key order. `canonicalMeasurementReportBytes` is RFC 8785 JCS
of that exact object. Derived charts and prose reports are computed from this
file and are not alternate evidence stores. This closes the one-flat-table
claim: an independent runner can join every row back to one frozen case,
vector step, input, outcome, and (where applicable) logical post-state.

`ComparisonKey` is `MeasurementRowKey` with only `lang` removed. For each
vector step, the report contains exactly the implementations named by
`Vector.impls`, one row per language with the same ComparisonKey; a missing or
extra implementation row rejects. `crossImplEqual=TRUE` iff their registered
schema, input digest, canonical outcome/error fields, Realm/basis/context
fields, and applicable state digest are byte-identical. Gas, wall-time,
memory, RPC, and language fields are deliberately excluded from semantic
equality. Any FALSE member fails conformance rather than becoming a measured
tradeoff.

Result artifacts use exact, corpus-versioned schemas:

```text
DOM_RESULT_SCHEMA = keccak256("efs2/harness-result-schema/1")
resultSchemaId = keccak256(abi.encode(
  DOM_RESULT_SCHEMA, keccak256(canonicalResultSchemaBytes)))

DOM_MEASUREMENT_RESULT = keccak256("efs2/harness-result/1")
resultDigest = keccak256(abi.encode(
  DOM_MEASUREMENT_RESULT, resultSchemaId,
  keccak256(canonicalResultBytes)))
```

Both domains are live `evidence`-class rows in the closed registry
(`b0-encoding-and-ids.md` §1.3). They are harness-only Stage B artifact domains,
not Core semantic IDs: neither enters `codexConstantsHash`; both enter
`corpusDomainManifestBytes` and H-DOMTABLE.

The restricted-JCS registry source is `interfaces/result-registry.json`.
Namespaces are exactly `authority`, `authorship`, `binding`, `codec`,
`content`, `harness`, `index`, `lens`, `realm`, serialized in that ASCII order.
Empty per-cell namespaces remain present. Their ids and typed codes are:

```text
errorNamespace(name) = keccak256(abi.encode(
  DOM_RESULT_SCHEMA, uint256(1), keccak256(ascii(name))))
```

Within a namespace, canonical Solidity error signatures sort by unsigned ASCII
and receive consecutive u32 codes 1..N. Code 0 is ERROR_NONE and `2^32-1` is
measurement-only ERROR_NA. Actual revert bytes must be selector
`bytes4(keccak256(ascii(signature)))` plus `abi.encode(error arguments...)`.

```text
resultSchemaRegistryBytes :=
  u16(1) || u16(namespaceCount) ||
  for each namespace:
    u16(nameLen)||ascii(name)||bytes32(errorNamespace)||u16(errorCount)||
    for each error: u32(code)||u16(signatureLen)||ascii(signature) ||
  u16(operationCount) ||
  for each operation sorted by ASCII opName:
    u32(schemaLen)||canonicalResultSchemaBytes

canonicalResultSchemaBytes :=
  u16(1) || u16(opNameLen)||ascii(opName) ||
  u8(executionKind) ||
  u16(inputTypeLen)||ascii(canonical ABI input tuple) ||
  u16(successTypeLen)||ascii(canonical ABI success tuple) ||
  u16(allowedErrorCount) ||
  sorted (bytes32 errorNamespace || u32 typedErrorCode)*
```

Execution kinds are 1 PURE, 2 VIEW, 3 TX, 4 FOLD, 5 HARNESS. `()` is the
two-byte empty tuple spelling, never zero length. Operation names have one
grammar: external ABI `sol:<canonical function signature>`, FixOp
`fix:<UPPER_SNAKE_ENUM>/1`, pure fold `pure:<lower-kebab-name>/1`, harness
`harness:<lower-kebab-name>/1`, debug `debug:<lower-kebab-name>/1`. Aliases
reject. The inventory is every FixOp, mandatory read, CellAdapter write,
selector/reconstruction/Lens operation, F4 control/read, state projection, and
debug read, with every reachable/bubbled error. Missing or duplicate entries,
unknown errors, noncanonical ABI spellings, and unlisted actual reverts fail
freeze.

This inventory is regenerated after owner commit `a18e571`: codec/kernel-Type
members include structural code 17; lifecycle folds consume the ten-field
typed context; Lens successes encode the three-field `ResolvedTarget` in both
`resolve` and `resolveStrict`; Realm entries use seven-field InitConfig,
authority-bearing revisions, both authority-transition enumeration reads, and
implementation/authority getters. ArtifactClosure Type/Record expectations use
STRING(255). These changes intentionally move `resultRegistryHash`,
`corpusVersion`, affected Type/Record IDs, and every dependent expected result;
their concrete bytes are Stage B outputs, not values guessed in Stage A.

Owner commits `c48f252`/`4983843` further change frozen corpus inputs and
expected outcomes: publish-wire fixtures encode the fixed
`TargetRecordCommitment(typeSchemaId,bodyHash)` evidence shape; publish errors
cover commitment mismatch, exact evidence/revision cardinality, sequential CAS,
and later-sibling no-resurrection before state; occurrence reads for a retained
never-admitted target expose recordId/typeSchemaId/principalId but no body; and
CV-SHADOW final states encode the exact sequential lifecycle/Binding/index
journal result. These move `resultRegistryHash`, `corpusVersion`, affected
expected result/state digests, and dependent IDs; concrete bytes remain Stage B
outputs.

```text
successPayload = abi.encode(success outputs...)
canonicalResultBytes(success) = u8(0)||u32(len(successPayload))||successPayload
canonicalResultBytes(error) =
  u8(1)||bytes32(errorNamespace)||u32(typedErrorCode)||
  u32(len(canonicalErrorArguments))||canonicalErrorArguments
```

`resultPresent=true` for either encoded arm. For success, namespace/code/error
digest are zero. For error, `errorDataDigest=keccak256(canonicalErrorArguments)`;
a zero-argument error hashes empty bytes, not zero. For no artifact, both ids
and digests are zero and the N/A sentinels apply. `crossImplEqual=TRUE` means
all required implementations produced the same schema/result/error/context
fields, including `inputDigest` and a nonzero state-bearing `stateDigest`, not
merely a Boolean assertion. A vector-owned state-machine row carries the exact
post-step digest, and its terminal row MUST equal the non-null
`Vector.stateDigest`; a stateless vector or an operation with no logical
post-state records zero. A revert row records the byte-identical pre-call
digest when the vector asserts atomic no-change, rather than zero.

N/A sentinels are closed: `ORDINAL_NA = 2^64−1` (legal protocol ordinals are
u48), `COVERAGE_NA = 2^32−1`, `ITEMS_NA = 2^16−1`,
`POSTINGS_NA = 2^16−1`, `ERROR_NA = 2^32−1`, `Completeness.N/A = 255`, zero `realmId/realmBasis` only where their context is
absent, and `cursorApplicable=false` with `nextCursor=0` only where cursor
semantics do not apply. An applicable protocol cursor is recorded exactly,
including zero if zero is a legal returned value. Successful
operations use `ERROR_NONE=0`; a typed failure uses its nonzero frozen error
code and nonzero `errorNamespace`; a row with `resultPresent=false` uses
`ERROR_NA`. `STEP_NA=2^32−1`; zero `stateDigest` means state N/A only, while
`inputDigest` has no N/A form. These sentinels are measurement vocabulary, not
protocol ABI values.

One flat table; every report in Stage B is a set of these rows plus derived
charts computed FROM rows (k\* curves, ratios). Nothing is reported outside the
row shape — that is what makes cell × fixture × workload grids diffable.
[PROPOSAL — the single-shape rule is the deliverable's core]

### 3.2a Canonical logical-state projection

State digests compare logical behavior across SOL/TS/RS **within one cell**, not
physical layouts across cells:

```text
canonicalStateBytes :=
  u16(1)||u8(cellCode)||bytes32(realmId)||u64(basisOrdinal)||
  u32(entryCount)||StateEntry*
StateEntry :=
  u8(componentTag)||bytes32(resultSchemaId)||
  u32(argsLen)||canonical ABI input bytes||
  u32(resultLen)||canonicalResultBytes(success)
stateDigest = keccak256(abi.encode(
  DOM_MEASUREMENT_RESULT, STATE_PROJECTION_SCHEMA_ID,
  keccak256(canonicalStateBytes)))
```

Cell codes are B0=0, F1=1, F2=2, F3=3, F4=4, F5=5, F6=6, F7=7, X17=8.
Entries sort by `(componentTag,resultSchemaId,args bytes)`; duplicates reject;
only success artifacts are legal. `STATE_PROJECTION_SCHEMA_ID` is the registry
id for `harness:state-projection/1`, input `(uint8,bytes32,uint64)`, output
`(bytes)`, kind HARNESS, no errors.

The closed component schedule is: 0x01 exact `genesisFacts`, Codex bytes,
EIP-1967 implementation/admin words, `implementationAddress`,
`currentUpgradeAuthorityRef`, `revisionAt(1..revisionCount)`, then every
`authorityTransitionAt(1..authorityTransitionCount)` in ordinal order; 0x02 admission/envelope/card/batch/Type/Principal
counters, every used `(principalId,nonceKey)`, and cell control counters; 0x03
Principals by full bytes32 id with descriptors/ordinals; 0x04
Types/shapes/profiles by bytes32 id with exact definitions and schema-cache
digest; 0x05 Records by id with type/shape, canonical body, and first-admission
metadata; 0x06 **unsigned** persisted envelopes/cards by id plus ordered
RecordIds; 0x07 admission log/receipts `1..H`, Occurrences by reversible ref,
and batches in batch order; 0x08 retained pre-withdrawal evidence keyed by
effective withdrawal ordinal, decoded to the exact signed header/vector,
TypeSchemaId/bodyHash commitment, descriptor, and witness (never a target
body); 0x09 postings keys sorted bytes32 with every
logical ordinal including dead entries, head/counts/liveness/digest state;
0x0a Binding keys sorted bytes32 with decoded heads plus complete RAW_AUDIT
revision order and hydrated occurrence status/revoked ordinal; 0x0b F4
profile/coverage and historical/live partitions (empty elsewhere).
Transient preflight shadow/journal memory is excluded; its conformance is the
all-prewrite error result plus the exact final 0x02–0x0a state after mechanical
commit. A never-admitted prewithdraw target therefore appears in 0x07/0x08 but
not as a 0x05 body, 0x09 posting/live contribution, or 0x0a head source.

The disposable SOL build exposes only these harness reads:

```text
debug:intent-nonce/1        (bytes32,uint192) -> (uint64)
debug:schema-cache-digest/1 (bytes32) -> (bytes32)
debug:logical-postings/1    (bytes32) -> (uint64[],uint64,uint64,uint64)
```

The final debug tuple is `(appendOrderOrdinals,totalCount,liveCount,lastOrdinal)`
and normalizes packed/wide physical storage; none of these debug reads is a
production ABI.

Reconstruction, not a private DB, closes the key universe: ids from the
state-readable spine; posting keys from admitted schemas/bodies; Binding keys
and nonce lanes from accepted Records/intents. Include immutable state, caches
that affect future calls, nonces, retained evidence, lifecycle, dead postings,
counts, RAW_AUDIT history, F4 coverage, receipt/admission/code bases. Exclude
physical slots/packing, gas warmness/payment, balances/account nonces, tx hashes,
logs, bookmarks/caches, compiler metadata, memory, and code bytes except recorded
codehashes. A revert is byte-identical pre/post. `getEnvelopeBytes` contributes
the canonical unsigned header+RecordId vector; receipts/batches, not replay of a
discarded signature witness, ground historical validation.

### 3.3 Realm gas profiles

```text
RealmProfile {
  realmProfileId    string
  txGasCap          uint64      -- per-tx ceiling the harness enforces
  initConfigBytes   bytes       -- exact seven-field InitConfig/1 ABI tuple
  calldataFloor7623 bool
  eip170CodeLimit   uint32 = 24,576
  p256Precompile    bool        -- EIP-7951 availability (Lane 3 kind 3 gate)
  scheduleTag       string      -- gas schedule the node runs
}
```

| Profile | txGasCap | Notes |
|---|---|---|
| `RP-L1` | **16,777,216** | EIP-7825 cap, live L1 since Fusaka 2025-12-03 [standards FACT — VERIFIED via intake STANDARDS lane]. 7623 on; 7951 on. **The pinned conservative default**: every B0 constant was sized against it (Lane 2 §2.5, Lane 4 §5.6, Lane 5 §5.3, Lane 6 §3.6, Lane 8 §8.4), and it equals Lane 4's QR-5 `REALM_MIN_TX_GAS`. |
| `RP-L2` | parameter (default 30,000,000) | [HYPOTHESIS — representative rollup execution cap; default falsified/replaced by the adopted venue's real profile] |
| `RP-L3` | parameter (default 100,000,000) | app-chain profile; DA/calldata pricing divergence noted per venue |

Rules [PROPOSAL]:

0. Every profile uses B0 protocol 0.0 and encodes
   `abi.encode(uint16(1),uint8 finalityRuleKind,uint32 finalityParam,uint8
   upgradeAuthorityKind,bytes32 upgradeAuthorityRef,uint64 declaredTxGasLimit,bytes32
   initialPolicyCommitment)`. `declaredTxGasLimit=txGasCap`; the policy
   commitment is corpus-pinned/nonzero. The ref is zero iff kind NONE;
   otherwise it is a canonical nonzero address word. Initialization and
   `genesisFacts()` round-trip all bytes/hash, revision-1 policy, and genesis
   controller exactly. Profiles also pin valid implementation/admin slot words
   and controller-transition scripts; changing any is a corpus-version bump.
1. `MUST_FIT_ATOMIC`: one semantic unit executes in one EVM call under the
   selected Realm cap. `overCap=true` is a failing hard-gate observation,
   `splitFactor=1`, and the harness never retries pieces.
2. `SPLITTABLE_THROUGHPUT`: a logical campaign may contain several independent
   atomic units. The adapter may split only at declared envelope boundaries
   and reports the actual factor. It may never split inside a Record,
   AdmissionIntent, one selected occurrence's admission effects, or one atomic
   schema group.
3. A `PACK(k)` point that exceeds the cap is `OVER_CAP` for that exact k;
   replacing it with smaller envelopes is not a measurement of k.
4. Minimum `MUST_FIT_ATOMIC` set: `ONECALL_5`; one FX-GIT push unit; one
   `TypeSchemaGroup/1` admission plus deterministic cache materialization;
   every concrete `publish` and tested all-or-nothing `publishBatch`; every
   poisoned-leaf/full-revert conformance vector.
5. Minimum `SPLITTABLE_THROUGHPUT` set: F4 backfill campaigns, staged
   large-content acquisition, churn/spray population, and workload-level PACK
   campaigns between independent envelopes. An over-cap maximal schema group
   reports a schema-on-ramp failure; Task 6 never invents staged commitment.
6. All cross-cell decisions read RP-L1 rows; RP-L2/L3 rows are context. Profile
   constants live in the corpus, so a venue-profile change is a corpus-version
   bump.

### 3.4 Workload knobs (closed set, frozen defaults)

| Knob | Values (frozen) | Used by |
|---|---|---|
| `K_BATCH` | every integer `1..64` | PACK(k); all 64 frozen M-K points. `{1,3,10,64}` are chart labels only |
| `K_CHURN_YEARS` | {1, 10, 50} | WL-CHURN (50 = the 50-year panel's number) |
| `K_WRITE_RATE` | {100, 1,000} writes/day | WL-CHURN volume |
| `K_SPAM_RATIO` | {1, 10, 100} spam:legit | WL-SPRAY |
| `K_REVOKE_FRACT` | {0.0, 0.5, 1.0} | WL-SPRAY self-revoke pass |
| `K_HOT_SKEW` | Zipf s ∈ {0, 1.0, 1.5} | WL-HOT target draw |
| `K_PAGE` | {16, 256, 512} | READ_PAGE maxItems |
| `K_PLAN_CORE_N` | {1, 8, 32, 64} | FX-LENS Core grid |
| `K_PLAN_CLIENT_N` | {50, 100, 256} | FX-LENS TS/RS client grid on MOBILE_REF + DESKTOP_REF |
| `K_RW_RATIO` | {10:1, 100:1} | read/write weighting for axis-7 verdicts |

[PROPOSAL — value sets; each ties to a named consumer. Extending a knob's value
set is a corpus version bump (§5).]

### 3.5 The ONE aggregate bundle snapshot

[DERIVED INVARIANT — onchain-completeness §4 via b0-indexes §9 (VERIFIED
there): the mandatory-index bundle is priced as ONE gas snapshot, because
per-item the gas-cheapest do-nothing always wins] Per cell, the harness emits
exactly one `opClass = AGGREGATE` row per fixture (fixture-trace total) and one
corpus-wide bundle row: total write gas, total state growth, and the read
matrix summary for the complete corpus at frozen knob defaults. **Adopt/kill
decisions and any return-to-James tradeoff cite bundle rows, never single-op
rows** [OWNER-PROCESS RULE — kickoff "If an adopted outcome fails the total
budget, return that exact tradeoff to James" (VERIFIED); FX-EAP rows carry
`note = PROVISIONAL` and are excluded from adopt/kill citations until the Codex
brief lands (PM directive, VERIFIED)].

### 3.6 Cross-language golden-vector execution

The harness executes every chapter-owned vector category in Solidity,
TypeScript, and Rust (kickoff gate, VERIFIED) and reports them as CONFORMANCE
rows: Lane 1 §10 categories 1–12; Lane 2 §12 categories 1–10; Lane 3 §10
`PID-DERIVE … GRAD-SEAM`; Lane 4 §3/§8 checks C-1..C-7 + walk W-0..W-10; Lane 5
page/liveness vectors; Lane 6 T1–T9 + key-derivation vectors; Lane 7 §12 plan/
combiner/LENS-NEG-1 vectors; Lane 8 §13 categories 1–5. Emission is blocked
on VERIFIED repair status for every consumed SR pin plus the retired-form
residue check in §1.3. Vector files are corpus content (§5); the corpus adds only the
cross-fixture vectors defined in this chapter (CV-\*, convergence twins,
ResolvedManifest/1 byte-identity).

---

## 4. Adversarial workloads — named scripts

All four run against NAMED key-spaces in the frozen corpus (not synthetic
stand-alone graphs), so their numbers compose with fixture rows. Each script's
falsifier names the [HYPOTHESIS] it closes. [PROPOSAL — script set]

### WL-SPRAY — spam / spray-then-self-revoke

```text
targets: FX-TOPIC hot topic; FX-EAP victim subject S1; FX-ARC release comment key
for ratio in K_SPAM_RATIO:
  1. baseline: measure clean-key page read (K_PAGE each), counts(), point reads
  2. spray: ratio × legit-count spam occurrences from fresh DRBG principals
     (attacker pays admission + fan-out — record attacker gas)
  3. measure: reader page cost, coverage field, counts()   -- inflated totalCount,
     honest liveCount unchanged for non-legit? (spam IS live until revoked)
  4. revoke pass: K_REVOKE_FRACT of spam self-revokes (attacker pays fold)
  5. measure steady state: page cost at equal LIVE yield vs step-1 baseline;
     liveCount returns to truth; basis-pinned pages before the fold unaffected
report: attacker gas per entry vs defender marginal cost per page; dilution ratio
```

Closes: Lane 5 §8 spray-degradation [HYPOTHESIS] (falsifier: steady-state reader
cost > 2× clean-key cost at equal page yield); Lane 5 §6.2 count honesty; FX-EAP
bounded-gate assertion.

### WL-CHURN — decades of churn

```text
target: FX-GIT (pushes, issues, edits, withdrawals); FX-ARC rebinds
for years in K_CHURN_YEARS, rate in K_WRITE_RATE:
  simulate years × rate writes with the fixture's op mix
  (70% publish / 15% bind-CAS / 10% withdraw / 5% tombstone)
  SCALING RULE [PROPOSAL]: execute N_sim = min(total, 100,000) real ops with
  per-op metrics sampled at 10k/50k/100k checkpoints; assert per-op marginal
  cost is volume-flat (THE LINE — Lane 5 §0) BEFORE extrapolating state growth
  arithmetically to the full volume; a non-flat curve is itself a finding and
  blocks extrapolation.
measure: state growth (extrapolated + measured), admission-log pages at old and
  new bases, binding history pages, author enumeration for a 10-year author,
  ordinal-consumption arithmetic vs width pin (S4)
```

Closes: kickoff "decades of churn" gate; Lane 4 §5.3 ordinal arithmetic check;
axis-7 read/write weighting input.

### WL-HOT — hot-value skew

```text
target: FX-TOPIC topics (Zipf-weighted tag targets), FX-ARC popular release
for s in K_HOT_SKEW:
  draw 20,000 TopicTag/TocComment references across 1,000 targets by Zipf(s)
  measure per-target: page read cost at K_PAGE, counts(), best-locator on the
  hottest target, binding point reads on hot vs cold keys
assert: per-page cost curves FLAT across target cardinality (THE LINE,
  mechanically: no read's cost is a function of total key cardinality)
```

Closes: Lane 5 §8 hot-value bound; feeds axis-7 (packed vs wide postings under
skew) and the F7/X17 comparison.

### WL-DEAD-LOCATOR — selector-specific dead-posting spray

```text
target: FX-ARC's release/closure locator key under B0_SELECT
1. publish 65 Locator/1 occurrences targeting the same key (more than two
   LOCATOR_POSTINGS_VISIT_MAX windows), using the B0-declared score mode
   (`SCORE_LATEST` for repaired `Locator/1`)
2. self-withdraw every occurrence; assert the one-way SR-10 status flips
3. call selectBestLocator(target, spec, basis, cursor=0), then follow only the
   returned cursor until CURSOR_END
4. on every call assert:
     postingsVisited counts all boundary probes + every live/dead sequential
       posting visited and stays <= LOCATOR_TOTAL_POSTING_READ_MAX
     an unexhausted suffix returns PARTIAL + nextCursor, even with no live item
     only the terminal page returns COMPLETE; no call scans ahead for liveness
5. report gas/wall per page and cursor-chain length; compare against the same
   fixed call bounds before spray
```

This is not substitutable by comment/EAP spray: it attacks the B0 selector's
physical posting budget directly and wires GV-14/SR-18c to M-CONF + M-SEL.

---

## 5. The fixture-freeze rule

**FR-1 (corpus identity).** The corpus is exactly §1.4's seven-directory tree,
restricted-JCS manifest, domain-manifest bytes, result registry, profiles,
scripts/toolchain, fixtures, and vectors. `canonicalCorpusBytes` and
`corpusVersion` use §1.4's byte-exact formula. Unknown paths, symlinks,
noncanonical JSON, or registry-hash mismatch reject. [PROPOSAL — exact SR-1
discipline for a non-protocol artifact].

**FR-2 (freeze point).** The corpus is frozen — corpusVersion computed and
recorded — BEFORE the first Stage B measurement of ANY bakeoff cell. All 9
cells are measured against one corpusVersion. Rationale: cross-cell
comparability — a delta between cells must be attributable to the flipped axis
alone, which is impossible if the inputs moved (audit BAKEOFF lane, VERIFIED;
this is the single reason the rule exists).

**FR-3 (change = version = full re-run).** Any change — a fixed typo in a body,
a knob default, a script step — mints corpusVersion+1 and **invalidates every
cell's rows**: rows with different corpusVersions are never compared, so a
corpus bump re-runs all cells, not just the one being debugged. Consequence,
embraced: the corpus is deliberately small enough that a full 9-cell re-run is
routine (target: single-digit hours on one machine — an explicit corpus design
constraint). [PROPOSAL]

**FR-4 (measurement-freeze ≠ protocol-freeze).** Restated as a rule: nothing
gains protocol status from corpus membership. Fixture-pack TypeSchemaIds are
golden vectors of the corpus, not reserved protocol ids; the GoldenView/1
manifest is a harness interface until a mount lane adopts it through its own
process. [PROPOSAL — prevents the corpus becoming a back-door spec]

**FR-5 (cells adapt, the corpus doesn't).** Per-cell differences (F1/X17
occurrence-identity re-expression, F4 index-profile mechanics) live in
CellAdapters — cell content, outside the corpus hash. The corpus references
only abstract FixOps and chapter-level semantics. A cell that cannot implement
a FixOp faithfully FAILS that fixture (a reportable result), rather than
bending the corpus. [PROPOSAL]

**FR-6 (provisional members).** FX-EAP is corpus content (so its bytes are
frozen like everything else) but flagged PROVISIONAL end-to-end (§3.5); when
the Codex brief lands, its replacement is an ordinary FR-3 version bump.

---

## Interfaces exposed

The compact contract other chapters and Stage B rely on:

- **FixOp language** (§1.1, closed set) + `PACK(k)` + fixed
  `M_K_POINT(k=1..64)` + DRBG seeding (§1.2):
  the ONLY vocabulary fixtures/workloads are written in; bakeoff cells supply
  `CellAdapter: FixOp → concrete ABI`; `PUBLISH_SCHEMA_GROUP` must reduce to
  the sole Core `publish` entrypoint.
- **Fixture IDs and interfaces** (§2): FX-ARC, FX-GIT, FX-EAP [PROVISIONAL],
  FX-NANDA, FX-LENS, FX-TOPIC, FX-PRIV, FX-50GB, FX-MOUNT (GoldenView/1 +
  ResolvedManifest/1 byte layout — interface only), FX-BROWSE (retained thin;
  guest checks imported from FX-NANDA.E). Cross-cutting suite CV-RAIL /
  CV-PID160 / CV-AUTHCHAIN / CV-XREALM / CV-SUBSET / CV-CLOCK / CV-7702 /
  CV-WITHDRAW / CV-SPARSE-ADMIT / CV-PREWITHDRAW / CV-SHADOW / CV-DIGEST-LOOKUP /
  CV-LAST-LIVE-COUNT / CV-SCHEMA-CAP / CV-RECON runs once per cell.
- **MeasurementRow** (§3.2): the one table shape for every cell × fixture ×
  workload, with exact `fixtureId/caseId/vectorId/stepIndex`, canonical
  `inputDigest`, binary result-registry/outcome encoding, logical
  `stateDigest`, restricted-JCS report bytes, strict row ordering/uniqueness,
  typed error,
  cross-implementation equality, Realm/basis/high-water/coverage, exact N/A
  sentinels, Core-call count, and F1 aggregator overhead; metric definitions
  §3.1; the mandatory read matrix (every named chapter read, cold+warm).
- **RealmProfile** (§3.3): RP-L1 pinned at txGasCap = 16,777,216 (EIP-7825);
  RP-L2/RP-L3 parameterized; decisions cite RP-L1 rows;
  `MUST_FIT_ATOMIC` over-cap traces fail with `splitFactor=1`, while declared
  throughput campaigns split only between independent envelopes.
- **Knob set** (§3.4), all 64 frozen M-K integer points, the exact
  FX-GIT `PUSH-WORST-20`, distinct Lens grids (Core 1/8/32/64; TS/RS client
  50/100/256 on pinned mobile/desktop profiles), and **named adversarial
  workloads** WL-SPRAY / WL-CHURN / WL-HOT / WL-DEAD-LOCATOR (§4).
- **Aggregate-bundle rule** (§3.5): adopt/kill and return-to-James cite bundle
  rows only; FX-EAP rows excluded while PROVISIONAL.
- **Freeze rules FR-1..FR-6** (§5): corpusVersion discipline; measurement-freeze
  ≠ protocol-freeze.
- **Obligations on other lanes:** all consumed SR-1..SR-18 owning-chapter
  repairs and retired-form residue checks verify before golden-vector
  emission; the closed ReferenceRole/content-profile boundary is reflected in
  fixture schemas before vector minting; measured rows replace the chapters' schedule-arithmetic
  [HYPOTHESIS] tables (Lane 2 §2.5, Lane 4 §5.6, Lane 5 §5.3/§9, Lane 6 §3.6,
  Lane 7 §9, Lane 8 §8.4).

## Open items

1. **FX-EAP durable brief** — PM-directed provisional status; Codex's brief
   closes it (FR-6 bump). Excluded from adopt/kill citations meanwhile.
2. ~~**Fixture-pack role grammar.**~~ **CLOSED:** ReferenceRole selectors are
   DIRECT or ARRAY_STRUCT_MEMBER with one bounded member index; the
   `ArtifactClosure/1.members[*].content` role uses the latter. Shape/content
   conformance remains profile policy, not a new Core target-set callback.
3. **RP-L2/RP-L3 default caps** — [HYPOTHESIS] placeholders until a venue
   profile is adopted (V2-E5 descriptor carries the real cap; Lane 4 §2.1 B).
4. **WL-CHURN scaling rule** — the 100k-op cap + flatness-gated extrapolation is
   [PROPOSAL]; if any cell shows non-flat per-op cost, full-volume runs (or a
   bigger cap) replace extrapolation for that cell — red team may demand a
   higher floor now.
5. **FX-PRIV encProfile stub** — AEAD/KEM constructions are Stage-B crypto work
   (carried-in proposals); the fixture tests seams only; transplant/batch-linkage
   vectors bind to the profile once pinned.
6. **Corpus size vs FR-3 full re-run budget** — the "single-digit hours"
   target is unmeasured until the first B0 dry run; if missed, the corpus
   shrinks (version bump), never the comparability rule.
7. **Client-plane wallMs comparability** — M-CLIENT rows are machine-dependent;
   the corpus pins `MOBILE_REF`/`DESKTOP_REF` hardware/runtime manifests, but cross-campaign wallMs
   comparisons remain weaker than gas rows (stated honestly in the schema docs).
8. **Cross-fixture graph coupling** — FX-TOPIC tags FX-ARC/FX-GIT objects;
    convenient for realism, but it means fixture execution order is part of the
    corpus (pinned: ARC, GIT, EAP, NANDA, LENS, TOPIC, PRIV, 50GB, MOUNT,
    BROWSE, then CV/WL). Red team should confirm no fixture's assertions depend
    on another's adversarial residue beyond what its script declares.
