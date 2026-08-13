# Golden-vector categories & falsifier matrix
**Stage A chapter — post-red-team revision; not landed, adopts nothing.**

Assembly Lane C of the Stage A commissioned pass (2026-08-12) — PM deliverable 6
("exact golden-vector categories and falsifiers"). Inputs read in full: all eight
B0 chapters (`b0-encoding-and-ids`, `b0-authorship-envelope`,
`b0-principal-authority`, `b0-realm-admission`, `b0-binding`, `b0-lens`,
`b0-indexes`, `b0-content-locators`), the intake audit
(`audit-lanes.json` — SURVIVORS lane in full; CARRY-IN/STANDARDS/RULINGS/BAKEOFF
claims), `core-architecture-candidate.md` (the 14 falsifiers, VERIFIED),
`fable-efs2-core-engineering-kickoff.md` (attack list + golden-vector gate,
VERIFIED), `system-constitution.md`, and the PM Stage A directive (VERIFIED).

This chapter delivers three things: (1) the golden-vector **taxonomy** — every
category with purpose, exact input/output shape in the chapters' own encodings,
the three implementations that must agree, and pass criteria; (2) the
consolidated **falsifier matrix** — the candidate's 14 falsifiers, the kickoff
attack list, and the audit additions, each mapped to the cell/fixture/vector
that detects it and its abort-vs-redesign consequence; (3) the explicit
**Stage A / Stage B boundary** — what this deliverable deliberately does NOT
produce.

---

## 0. Conventions and cross-cutting rules

### 0.1 The three implementations and the agreement rule

- [DERIVED INVARIANT — kickoff Required technical gates, VERIFIED: "Produce
  cross-language golden bytes, IDs, signatures, and page keys in Solidity,
  TypeScript, and Rust, including invalid, unknown-version, replay, cross-Realm,
  subset-carriage, duplicate, partial-failure, and upgrade vectors"] Every
  category below binds three independent implementations:
  1. **SOL** — the disposable prototype Core (internal libraries `EfsCodec`,
     `EfsIds`, `LibBinding`, `LibIndex`, `LensResolve`, `ChunkTreeVerify` and
     the external ABI), executed under a Foundry-class test harness;
  2. **TS** — a standalone TypeScript library implementing the same codecs,
     id formulas, and deterministic folds as pure functions;
  3. **RS** — a standalone Rust library, ditto, written without reading the TS
     source (independence is the point; shared test *data* only).
- **Agreement rule [PROPOSAL]:** a vector passes iff all three implementations
  produce byte-identical outputs for valid members, AND fail with the **exact
  named error code** for MUST-FAIL members ("any revert" is not a pass — typed
  rejection equality is part of the contract; every chapter ships a closed
  error table for exactly this reason).
- **State-machine categories** (GV-9/10/12/17/18): SOL runs the real state
  machine; TS/RS implement the deterministic fold over the Realm's **total
  event order** (admissions ⊎ intent applications, `b0-realm-admission` §5.4 /
  W-6) as pure functions and must reproduce SOL's end state. Equality is
  checked via a canonical **state digest** (definition = open item O7)
  plus spot read-back through the §0.2 rule.

### 0.2 Cross-cutting rule: every write pairs with a read-back

[DERIVED INVARIANT — the dominant historical EFS bug shape is writes that
confirm on-chain and never read back (project memory
`efs-confirms-but-unreadable-class`; independently restated in
`b0-encoding-and-ids` §10 preamble and `b0-authorship-envelope` §3.3
red-team note)] Every admission-class vector member includes post-state
assertions through the **public read ABI** (`getRecord`, `getOccurrence`,
`occurrenceStateOf`, `readHead`, `pagePostings`, `receiptOf`, …), never through
internal state peeks alone. A vector that only checks "the call succeeded" is
malformed by definition of this taxonomy.

### 0.3 Cross-cutting rule: two axes, never collapsed

[DERIVED INVARIANT — assumptions-and-requirements §10 via the SURVIVORS lane
("never compress to a Boolean valid"), carried by `b0-lens` §7.2 and
`b0-realm-admission` §4.2] Every resolution/page/coverage vector asserts BOTH
axes of its result — presence (`FOUND/ABSENT/CONFLICT/UNKNOWN/UNSUPPORTED`)
AND basis/grade (`BasisReport`, `BasisGrade`, coverage vocabulary) — and
includes at least one member where collapsing the axes would flip the
assertion (e.g. FOUND-at-stale-basis vs FOUND-current; UNKNOWN-basis vs
ABSENT).

### 0.4 Vector-record container (shape only; harness lane finalizes)

[PROPOSAL — dependsOn the fixture/measurement-harness chapter, which owns the
frozen file format] One vector = one record:

```text
Vector {
  id            : "GV-<cat>/<seq>"        -- stable, never reused
  category      : GV identifier (§2)
  description   : one sentence
  inputs        : named hex/JSON fields in the owning chapter's encoding
  expect        : { ok: true, outputs: named hex fields }
                | { ok: false, error: named error code }
  readback      : post-state assertions per §0.2 (admission-class only)
  reconciles    : list of RP-* ids (§1) this vector's bytes depend on
  impls         : subset of {SOL, TS, RS} when a tier is out of scope
                  (e.g. SDK-only STRUCT-FULL members exclude SOL)
}
```

### 0.5 Tier notation

- **CORE** members run on-chain semantics (SOL authoritative, TS/RS replicate).
- **SDK** members are client-tier conformance (STRUCT-FULL Unicode, off-chain
  resolve grading, acquisition machine): TS/RS authoritative, SOL exempt.
- **FIXTURE** members are workload traces (Arcade, Git/Markdown, Nanda,
  contract-config, privacy, 50 GB, mount; EAP **provisional** until a durable
  brief lands [PM directive, VERIFIED]) — they consume the categories rather
  than define them.

---

## 1. Reconciliation preconditions (blocking inputs to vector minting)

The eight chapters were written in parallel and disagreed in places. At draft
time no byte vector could be minted until each RP below was resolved — a golden
vector minted against the losing variant would freeze a defect. **Resolution
note (2026-08-13): every RP is now resolved by a seam pin in [[b0-overview]] §2
(post-red-team revision)** — each row's first cell names its resolving SR pin.
Rows 13–18 were discovered by the seven-lane red team (RP-16 is the predicted
13th seam); where a lane's recommended repair differed from the landed pin,
THE SR PIN WINS (adjudication recorded in corpus `redteam-findings.md`). The
conflict text is kept as history. [Each original row: VERIFIED conflict — both
texts read in this lane.]

| RP → resolving SR pin | Conflict (as flagged at draft time) | Chapters |
|---|---|---|
| RP-1 → **SR-1** | **ID-family instantiation**: `b0-encoding-and-ids` §1.3 hashes the domain string into a word first (`DOM_X = keccak256(ascii)`, preimage = `abi.encode(DOM_X, …)`); `b0-binding` §1.1, `b0-lens` §2/§5.1, `b0-realm-admission` §2.2 prepend the **raw ASCII** (`keccak256("efs2/…/1" ‖ abi.encode(…))`). Different preimages ⇒ different ids for the same logical formula. One discipline must win everywhere. | encoding vs binding/lens/realm |
| RP-2 → **SR-2** | **EnvelopeId formula**: encoding §4.2 (`DOM_ENVELOPE, profile, principalId, replayCommit, leafCount, leavesHash` with per-leaf `leafCommit_i`) vs authorship §2.3 (`keccak256("efs2/envelope/1" ‖ abi.encode(eip712EnvelopeDigest))` over header incl. `authorityId/authEpoch/pubNonce/notAfter` + raw `recordIds[]` array hash). Incompatible preimage structures; the authorship variant carries the reserved authority seam (G7) that Lane 3 requires. | encoding vs authorship vs principal (G7) |
| RP-3 → **SR-3** | **AdmissionIntent**: authorship §5.1 (`realmId, action u8, envelopeId, leafMask u64, nonceKey, nonceSeq, notAfter`; EIP-712 chainId+verifyingContract domain; 2-D nonces) vs realm §5.4 (`realmId, principalId, action, actionData, intentNonce, expiryBlock, refs[]`; `IntentId = keccak256("efs2/intent/1" ‖ body)`; consumed-set registry) vs encoding §1.3 (`DOM_INTENT = "efs2/admission-intent/1"`, formula `(DOM_INTENT, realmId, envelopeId, H(intentBody))`). Three shapes, three domains, two replay disciplines. Binding §3.2 additionally requires a per-leaf `expectedRevision` array none of the three carries. | authorship vs realm vs encoding vs binding |
| RP-4 → **SR-4** | **`AdmissionOrdinal` width**: uint64 (encoding §4.3, authorship, binding, realm receipts) vs **uint48** (indexes §1, packed 5/slot, whole postings layout). | indexes vs the rest |
| RP-5 → **SR-5** | **Envelope leaf/body bounds**: `MAX_ENVELOPE_LEAVES` = 1,024 (encoding §2.6) vs 64 (authorship §2.5, matched to `leafMask uint64`; realm §5.6) vs `MAX_BIND_LEAVES_PER_ENVELOPE` = 128 (binding §3.6 — exceeds the 64 cap it rides in). `MAX_ENVELOPE_BODY_BYTES` = 16,384 (encoding) vs 8,192 (authorship/realm). `MAX_BODY_BYTES`: encoding pins 8,192; content §8.4 assumes ≈16 KiB and derives `MAX_CLOSURE_MEMBERS` from it. | encoding vs authorship vs realm vs binding vs content |
| RP-6 → **SR-6** | **BindingKey/PositionKey domains**: binding §1.1 `"efs2/bindingkey/1"` + `abi.encode(principalId, positionKey)`; lens §2 `"efs2/binding-key/1"` + raw concatenation; encoding §1.3 `DOM_BINDING = "efs2/binding/1"`, `DOM_POSITION = "efs2/position/1"` under the RP-1 hashed-domain discipline. Three spellings of one formula. | binding vs lens vs encoding |
| RP-7 → **SR-7** | **AuthorityBasis shape**: principal §3.5 one packed `AuthorityBasisWord` (kind‖verifierVersion‖witnessProfile‖basisBlock‖delegateOrZero) + conditional codehash slot vs authorship §4.4 struct `{verifierVersion u16, witnessKind u8, codeState u8, codehash b32}` vs indexes §2.4 `authorityBasisCode uint16 + authEpoch uint32` in `EnvelopeMeta` vs realm §5.1 one opaque `bytes32` slot. | principal vs authorship vs indexes vs realm |
| RP-8 → **SR-8** | **BindingHead shape**: binding §2.1 (revision u64, no authorityBasis on head, state UNSET/BOUND/TOMBSTONED, 3 Entry slots) vs lens §5.2 assumed (revision u32, `authorityBasis` ON the head, NEVER_SET/PRESENT/TOMBSTONE) vs indexes §2.4 (state/revision u32/currentOrdinal u48, no target on the head word). Lens gas rows and the GV-13 combiner members depend on whichever wins. | binding vs lens vs indexes |
| RP-9 → **SR-9** | **Withdrawal authority mismatch behavior**: authorship §3.3 — wrong-author withdrawal **admits as inert evidence** (no revert; anti-griefing) vs binding §3.5/§4 — `ErrWithdrawNotAuthor` **reverts the whole envelope**. Opposite behaviors for the same input; GV-9/GV-18 members encode whichever wins. | authorship vs binding |
| RP-10 → **SR-10** | **Occurrence lifecycle overlay**: authorship §3.2 `occState` word (status+ordinal+receiptRef) vs binding §2.2 `occLife` word (status+withdrawnOrdinal) vs indexes §2.2 `revokedAtOrdinal` in `logSlotB` — three stores for one fact; the no-double-decrement and liveness vectors need the merged single owner. | authorship vs binding vs indexes |
| RP-11 → **SR-11** | **Kernel Type recognition**: binding-class leaves recognized by pinned TypeSchemaIds (`TYPE_BINDING_SET_V1` …, binding §3.2) whose values need encoding+type formulas closed first; authorship §5.3 step 10 keys on `WITHDRAWAL_TYPE_ID` only. The closed set of kernel-known Types must be one list. | binding vs authorship vs encoding |
| RP-12 → **SR-12** | **Realm entrypoint & admission consent**: realm §5.4 `publish` is **permissionless** (anyone submits any signed envelope; evidence-grade) vs authorship §5.4 **author-only** admission (intent witness must authenticate the envelope's own principal; third-party carriage rejected). Direct contradiction on who may admit; GV-6/GV-7 members differ under each. | realm vs authorship |
| RP-13 → **SR-13** | **Authorship identity chain** (red-team BLOCKING, crypto/identity + write-path lanes): no chapter carried the assertion `computePrincipalId(carried descriptor) == header.principalId`, and the `AccountPrincipal` descriptor had no calldata channel into admission — verifier signatures diverged (struct-taking, principal §3.2, vs bytes32-taking, authorship §4.4 / realm §5.3), leaving authorship forgery of any declared PrincipalId open to a literal build. | principal vs authorship vs realm |
| RP-14 → **SR-14** | **PrincipalId preimage structure** (red-team BLOCKING): encoding §4 `(DOM_PRINCIPAL, uint256 scheme, keccak256(descriptorBytes))` vs principal §2.4 raw-ascii prefix over inline dynamic `abi.encode(kind, bytes, bytes)` — two inequivalent formulas unresolved by RP-1's domain discipline; worked examples A/B hang on the loser. | encoding vs principal |
| RP-15 → **SR-15** | **Duplicate semantics** (red-team SERIOUS): binding §3.4/§3.5 whole-call reverts (`ErrDuplicateOccurrence`/`ErrAlreadyWithdrawn`) vs realm §5.5 / authorship §3.2 idempotent no-op for the SAME event — forks legitimate subset-admission retries and voids binding's stated no-resurrection mechanism. | binding vs realm vs authorship |
| RP-16 → **SR-16** | **RealmRevisionId — the predicted 13th seam** (red-team SERIOUS): different domain spelling AND different preimage field set (encoding §4 generation + descriptor hash vs realm §2.5 ordinal + codehash + policyCommitment + block, under `efs2/realm-revision/1` vs `efs2/realmrev/1`); GV-3/GV-17 vectors would have frozen one of two incompatible formulas. | encoding vs realm |
| RP-17 → **SR-17** | **Schema on-ramp** (red-team SERIOUS): standalone non-Record registration function (encoding §3.4) vs Types-are-Records-of-the-bootstrap-meta-Type walk (realm §8.1 W-5) vs schemas-admitted-as-Occurrences (indexes §2.4) — three mechanisms, no pinned path, reconstruction-walk claim broken under two of them. | encoding vs realm vs indexes |
| RP-18 → **SR-18(a)–(e)** | **Shared vocabularies** (red-team SERIOUS, several lanes): digest algorithm-code widths forked three ways (u16 multihash / u8 EFS algTag / u32 index algId); Completeness enum numeric encodings conflict (UNKNOWN=0 fail-closed vs UNKNOWN=4); TWO normative best-locator algorithms (idx §7 single-score vs cont §10.3 evidence fold); unique-Records-by-Type decrement semantics; missing per-leaf REF-instance bound (`REF_INSTANCES_MAX`) that all index arithmetic assumed. | encoding vs content vs indexes vs realm |

**Rule [PROPOSAL, amended post-red-team]:** every minted vector lists its
`reconciles` RP ids; the Stage B harness refuses to mint a vector until the
CHAPTER REPAIRS to each listed RP's resolving pin have landed (the pins
themselves are landed in [[b0-overview]] §2; residual chapter text
contradicting a pin is a defect against the overview). This keeps the
conflict table executable rather than advisory.

---

## 2. Golden-vector taxonomy

Format per category: **Purpose · Shape (input → output) · Impl · Pass
criteria · Members** (valid ∪ MUST-FAIL). Member lists name the governing
chapter section; they are exhaustive at category level, enumerable-but-open at
member level (Stage B may add members, never remove).

### GV-1 Canonical body encode/decode (MC/1)

- **Purpose:** the one bounded body codec is byte-deterministic and fail-closed
  in three languages; malformed bodies are rejected structurally with the exact
  error code. [Anchors kickoff gate "Reject malformed canonical bodies
  structurally", VERIFIED.]
- **Shape:** input = `(TypeSchemaBlob bytes, body bytes)`; output =
  `errCode uint16` (0 = OK; closed table `b0-encoding-and-ids` §2.7) plus, for
  valid members, `extractWord(fieldIdx)` / `extractRefs(roleId)` results
  (E1 static extraction).
- **Impl:** SOL (`EfsCodec.validateBody/extractWord/extractRefs`), TS, RS.
- **Pass:** identical errCode; identical extraction bytes; for every valid
  member, re-encode(decode(body)) == body (canonical-form uniqueness, rule E2).
- **Members:** every field kind at boundary widths; `BOOL`/`OPTION` flag bytes
  `0x02..0xFF` → `ERR_BOOL`/`ERR_OPTION_FLAG`; truncation → `ERR_TRUNCATED`;
  trailing bytes → `ERR_TRAILING`; length over schema bound → `ERR_BOUND`;
  MAP ascending ok / equal-key / descending → `ERR_MAP_ORDER`, plus the
  documented length-first consequence member (`"z" < "aa"`); invalid UTF-8 →
  `ERR_UTF8`; DIGEST unknown algo / wrong length → `ERR_DIGEST`; REF sentinel
  or zero in body → `ERR_SENTINEL_IN_BODY`; nesting depth 5 → `ERR_DEPTH`;
  count over bound → `ERR_COUNT`; body at exactly `MAX_BODY_BYTES` (valid) and
  +1 (fail); [SDK tier] NFC composed/decomposed pairs (SDK converges,
  chain accepts both as distinct bytes — both facts asserted), unassigned
  codepoints rejected, NAME_PROFILE rejections. `reconciles: RP-5`.

### GV-2 TypeSchema parsing, groups, recursion, evolution

- **Purpose:** Type bootstrap has no hash fixed point; recursive/mutual schemas
  and unknown versions behave deterministically; schema registration is
  idempotent; evolution evidence round-trips. [Anchors candidate falsifier 11.]
- **Shape:** input = `groupBytes`; output = `errCode` from
  `validateTypeSchemaGroup`, plus `groupHash` and `TypeSchemaId_k` per member;
  E1 offset classes per field.
- **Impl:** SOL/TS/RS.
- **Pass:** identical ids, identical offset-class tables, identical typed
  rejections; re-registration returns the same ids with no state delta.
- **Members:** standalone group-of-1; `SELF` recursion (Comment/1-shape);
  mutual pair via `GROUP_REF`; R3 malformations (`GROUP_REF(own index)`,
  `GROUP_REF(k ≥ memberCount)`, group-of-1 using `GROUP_REF`) →
  `ERR_SCHEMA_MALFORMED`; unknown `metaCodecVersion` → deterministic reject;
  role/field binding violations (unbound REF field, doubly-bound role,
  OCCREF with non-OCCURRENCE class); IndexSpec eligibility violations
  (redundant BACKLINK → `ERR_SPEC_REDUNDANT`, disabled COMPOUND →
  `ERR_COMPOUND_DISABLED`, indexes §4.1); the four §6 evolution Records
  (`TypeSuccessor/1`, `TypeEquivalence/1` incl. the `a < b` canonical-order
  conformance member, `TypeFamilyGenesis/1`, `TypeFamilyMembership/1`)
  round-tripped; assertion that admitting evolution evidence changes **no**
  Realm admission/index behavior (encoding §6 reading rule).

### GV-3 The ID formula family

- **Purpose:** every deterministic id derives identically offline in three
  languages, with domain separation, full-width preservation, and the
  migration seam proven structurally. [Anchors constitution "Universal
  identity"; SURVIVORS R-D2.]
- **Shape:** input = named preimage fields per formula; output = 32-byte id.
  Formulas covered (post-RP-1/2/3/6 reconciliation): `TypeSchemaId`,
  `RecordId`, `EnvelopeId`, `leafCommit`, `OccurrenceKey`/`occKey`,
  `PrincipalId`, `RealmId`, `RealmRevisionId`, `profileId`,
  `genesisCommitment`, `PositionKey`, `BindingKey`, `PlanId`, `IntentId`,
  `AuthorityBasis`, `pk()` postings keys and `targetKey`/`valueKey` rules
  (indexes §2.1/§3.5/§4.1), `purposeAndScope` (lens §3.3), `ChainRef/1`.
- **Impl:** SOL (`EfsIds` + chapter libraries), TS, RS.
- **Pass:** byte equality; one-word sensitivity (flip any single preimage
  word ⇒ different id) per formula; sentinel-space outputs never occur/accepted.
- **Members:** ≥1 fully-spelled valid vector per formula; RecordId
  Envelope-independence (same Record in two envelopes ⇒ same RecordId,
  different OccurrenceKeys — candidate falsifier 3's structural proof);
  same body under two Types ⇒ different RecordIds; **PID-LOW160** — two
  PrincipalIds agreeing in their low 160 bits, injected synthetically via a
  test-only harness (a real pair is a ~2^80 search — `b0-principal-authority`
  §2.6, VERIFIED honesty note), driven end-to-end through storage keys,
  `pk()`, BindingKey, plan entries, and receipts; any path that re-derives
  identity from a 160-bit address fails the category by construction;
  migration-seam pair (identical preimage under `efs2/record/1` vs
  hypothetical `efs2/record/2` ⇒ different ids); sentinel-space registration
  rejection; worked PrincipalId examples A/B (principal §2.5 — candidate seed
  values pending RP-1) and C (blocked on Lane 4 chainRef). `reconciles:
  RP-1,2,3,6`.

### GV-4 Namespace-vs-spec-commitment pin pair (axis 8)

- **Purpose:** pin whichever axis-8 arm wins with a two-vector pair so the
  choice is frozen as bytes, not prose. [Anchors the BAKEOFF lane's
  analysis-only disposition and encoding §8.]
- **Shape:** input = two `TypeSchemaBlob`s + two publisher PrincipalIds;
  output = TypeSchemaIds + registration state.
- **Impl:** SOL/TS/RS.
- **Pass (S-with-qualifier arm, the B0 recommendation):** `T-CONV` — two
  distinct publishers, byte-identical blobs, `namespaceQualifier = 0` ⇒ SAME
  TypeSchemaId, idempotent second registration; `T-QUAL` — same blobs except
  qualifier = P1 vs P2 ⇒ DIFFERENT ids, both valid, neither canonical. Under a
  pure-P arm the expected outputs invert for T-CONV; the pair is the pinning
  instrument either way [PROPOSAL].

### GV-5 Envelope signing & authorship witnesses

- **Purpose:** authorship verification is deterministic across account shapes;
  witnesses never enter identity; account-state changes never reinterpret
  history. [Anchors kickoff attacks: smart-account code changes, 7702
  classification; constitution authority-history trace.]
- **Shape:** input = `(EnvelopeWire | header fields, witness bytes,
  AccountPrincipal, VerifyContext)`; output = `(ok | typed error,
  AuthorityBasisWord [, contractCodehash], EnvelopeId)`. The program-wide
  verifier signature is SR-13's `verify(AccountPrincipal calldata p,
  bytes32 digest, bytes calldata witness, VerifyContext memory ctx) →
  (AuthorityBasisWord, bytes32 codehashOrZero)`; the bytes32-principalId-taking
  shapes are superseded.
- **Impl:** SOL (verifier library + admission path), TS, RS (signature +
  digest reconstruction; 1271 members SOL-authoritative with TS/RS asserting
  transcript bytes).
- **Pass:** identical digests, ids, basis words, typed errors; witness
  variation never moves EnvelopeId (identity excludes witness — kel §8.1
  lesson, VERIFIED via authorship §2.3/principal AUTH-INV-7).
- **Members:**
  - EOA: valid low-S; high-S → `AUTH_SIG_MALLEABLE`; v = 29; wrong recovered
    address; ecrecover zero-address.
  - ERC-1271: magic accept; wrong magic → `AUTH_1271_REJECTED`; account
    reverts; gas-bomb capped at `ERC1271_VERIFY_GAS`; >32-byte
    returndata-bomb bounded; no-code counterfactual → `AUTH_1271_NO_CODE`;
    ERC-6492 wrapper rejected as admission witness [STANDARDS lane, VERIFIED];
    **pinned-codehash replay** — account upgrades/self-destructs after
    admission; recorded basis (codehash + block) byte-unchanged.
  - EIP-7702 **three-point vector** (principal §4): E1 pre-delegation
    (`delegateOrZero = 0`), E2 delegated to D1, E3 re-delegated to D2 — one
    PrincipalId, three persisted bases, no retro-grading; defensive
    `AUTH_EOA_UNEXPECTED_CODE`; kind-1-vs-kind-2 distinct-Principal member for
    one delegated account.
  - P-256 (RFC 6979 A.2.5 key; high-s reject; off-curve key rejected at V4)
    and RSA (2048-bit accept; e ≠ 65537 reject; wrong-length sig).
  - Struct validation V1–V6 (incl. V6 non-minimal ABI re-encode rejection).
  - **PrincipalId-mismatch forgery (SR-13's load-bearing assertion):** a VALID
    witness over the attacker's own `AccountPrincipal` descriptor, presented
    with `header.principalId` = a different (victim) id → MUST-FAIL
    `E_PRINCIPAL_MISMATCH`, asserted BEFORE witness verification — a valid
    witness for the attacker's key can never be attributed to another declared
    principalId; twin member: first-use PrincipalRecord persistence takes its
    preimage only from the verified calldata descriptor.
  - Re-signed identical envelope ⇒ same EnvelopeId ⇒ idempotent re-admission
    (authorship §2.3) — dependsOn RP-2.
  - [SDK/Stage-B live] stock `eth_signTypedData_v4` reproduction of the
    chain-free envelope domain against current wallets (authorship O6 — July
    evidence is aging; category defined here, run at Stage B).
  `reconciles: RP-2,7`.

### GV-6 Rail substitution (R-D8)

- **Purpose:** authorship never derives from the submission rail; identical
  authorship via any rail. [Anchors SURVIVORS finding 6: "relayer/paymaster/
  account-adapter substitution vectors", VERIFIED absence in the kickoff, now
  closed here.]
- **Shape:** input = one `(EnvelopeWire, intent, intentWitness)` byte triple,
  submitted by (a) the author's own EOA, (b) an unrelated relayer EOA, (c) a
  4337 bundler + paymaster; output = persisted
  `(EnvelopeId, occKeys, PrincipalId, AuthorityBasis)` per rail.
- **Impl:** SOL authoritative (three harness rails); TS/RS assert that no
  rail-derived field exists in any preimage (static input audit re-derivation,
  authorship §9).
- **Pass:** byte-identical persisted authorship across rails;
  `AdmissionOrdinal`/`basisBlock` MAY differ (venue-relative facts, never
  authorship); first-acceptance-wins + later no-op (T2) leaves identical end
  state whichever rail lands first. A rail that can mint or alter any
  authorship-bearing field fails the category.
- **Members:** the three-rail triple; `admitAsSender` vs explicit-intent
  equivalence (identical persisted state, only `intentKind` differs —
  authorship §5.4); msg.sender-as-diagnostic-only assertion (enters no id, no
  receipt identity, no read path). `reconciles: RP-3,12`.

### GV-7 Replay, cross-Realm, and domain confusion

- **Purpose:** the complete cross-signature confusion matrix holds; a portable
  envelope creates zero effects anywhere without a Realm-bound intent; the
  intent is worthless outside its Realm. [Anchors kickoff "cross-Realm
  replay/domain confusion"; authorship §8 matrix.]
- **Shape:** input = signed blobs presented in wrong roles/venues; output =
  MUST-FAIL typed errors, or (for envelope replay) MUST-SUCCEED-with-zero-
  effects assertions.
- **Impl:** SOL authoritative; TS/RS reproduce digest inequality proofs
  (distinct `typeHash` + distinct domain ⇒ digests differ).
- **Pass:** every §8 matrix row holds as its own member; zero state delta on
  the no-effect members.
- **Members:** intent digest verified as envelope signature (and vice versa)
  → fail; envelope replayed to a second Realm → verifiable evidence, **no**
  destination truth/effects without destination admission (constitution
  cross-Realm trace); intent replayed cross-Realm → `E_REALM_MISMATCH` /
  `E_INTENT_REALM_MISMATCH`; intent replayed in-Realm → nonce consumed
  (`E_NONCE` / `E_INTENT_REPLAY`); ID-vs-digest byte-space disjointness
  (ascii-prefixed structural ids never begin a `0x1901` transcript —
  authorship §1); EFS-712 signature into a foreign protocol's flow and the
  converse → fail; expired envelope vs expired intent distinguished
  (`E_EXPIRED_ENVELOPE` vs `E_EXPIRED_INTENT`); CREATE2 same-address
  second-chain deployment still separates (domain chainId + realmId check).
  `reconciles: RP-2,3,12`.

### GV-8 Subset carriage

- **Purpose:** strict-subset carriage and subset admission preserve exactly
  the eight can/cannot conclusions of authorship §7. [Anchors kickoff
  subset-carriage gate; BAKEOFF 3×5 interaction — this suite runs in cells
  B0, F3, and F5.]
- **Shape:** input = `header + FULL recordIds vector + bodies for a subset +
  witness [+ intent leafMask]`; output = verification verdict, admitted
  occurrence set, conclusions checklist.
- **Impl:** SOL/TS/RS (verification is pure given the wire bytes).
- **Pass:** valid subset verifies; each MUST-FAIL fails typed; the
  cannot-conclude items are asserted as absent claims (no API reports them).
- **Members:** full-vector + partial bodies verify; truncated RecordId vector
  → fail; reordered vector → fail (leaf commitments are index-committed);
  wrong-position body → `E_BODY_MISMATCH`; `leafMask` bit ≥ count →
  `E_LEAF_RANGE`; admit-selected-then-admit-remainder later (unselected
  leaves stay UNSEEN, admissible under a fresh intent); envelope-is-not-an-
  application-transaction assertion (conclusion 7 — candidate falsifier 13's
  structural half); **privacy caveat member**: a low-entropy unrevealed leaf's
  RecordId is dictionary-guessable — asserted as a documented property, not a
  defense (feeds GV-15). `reconciles: RP-2,3,5`.

### GV-9 Duplicate postings, idempotent retry, occurrence lifecycle

- **Purpose:** retries converge without error handling; duplicates never
  double-post; withdrawal and no-resurrection hold at the occurrence tier.
  [Anchors constitution one-transaction/idempotency clauses; kickoff
  "duplicate postings" attack.]
- **Shape:** input = admission call sequences; output = state machine
  transitions (authorship §3.2 T1–T6), `PublishResult.outcome`, postings
  heads.
- **Impl:** SOL authoritative; TS/RS fold-replay.
- **Pass:** T1–T6 exactly as tabled; postings `appendPosting` strict-ascending
  invariant never violated; `liveCount ≤ count` always; no double-decrement.
- **Members:** duplicate admit (T2 no-op, existing receipt returned;
  `ALREADY_ADMITTED` outcome at the realm ABI); duplicate leaves in one
  envelope (same RecordId at two indexes ⇒ two occurrences, distinct
  leafCommits); pre-withdrawal (T4) then admit attempt → `E_WITHDRAWN`
  (no-resurrection); double withdrawal (T5 no-op / `ErrAlreadyWithdrawn` per
  RP-9 resolution); withdrawal by non-author (inert-vs-revert per RP-9 —
  member minted after resolution); retry-consumes-nonce client rule
  (authorship §5.3 note): re-submitting the same intent after success fails at
  the nonce step and the SDK converts it to a read. `reconciles:
  RP-3,9,10`.

### GV-10 Partial-failure atomicity

- **Purpose:** one EVM call is one atomicity domain: any leaf failing any
  guard reverts everything; no admitted-but-unindexed state can exist; module
  boundaries add no partial-commit window. [Anchors kickoff
  "reentrancy/module partial failure" and "unbounded returndata"; realm §5.4.]
- **Shape:** input = multi-leaf envelopes with one poisoned leaf per error
  class; output = full-revert proof (state digest before == after) + the
  named error.
- **Impl:** SOL authoritative; TS/RS assert the fold rejects identically
  (no partial fold output).
- **Pass:** zero state delta on every MUST-FAIL; nonce lanes unconsumed on
  revert; mandatory-index postings and admission writes are inseparable (an
  accepted occurrence is present in every applicable family in the same call —
  indexes guarantee list).
- **Members:** one member per typed revert in the realm §5.5 list
  (`E_STRUCTURAL`, `E_UNKNOWN_TYPE`, `E_AUTHORITY`, `E_REF_UNSATISFIED`
  forward-reference member, `E_CAS_CONFLICT`, `E_BOUNDS`, `E_POLICY`);
  REF-SAT dependent-graph one-call member (Project → Release → Locator in one
  tx, precomputed ids — constitution one-transaction trace); 1271 witness
  attempting reentry into `admit` during verification → blocked (STATICCALL);
  returndata-bomb during verification → bounded copy; `publishBatch`
  all-or-nothing; **F6 MODULAR cell**: the same suite re-run across physical
  module boundaries — any partially-committed Core write rejects the arm
  (BAKEOFF axis-6 decision rule). `reconciles: RP-3,10`.

### GV-11 Time/order honesty (R-D9)

- **Purpose:** author-side numbers are testimony, never trusted chronology or
  uniqueness; venue order is the only ordering primitive; misleading clocks
  cannot move any deterministic outcome. [Anchors SURVIVORS finding 3
  (VERIFIED absence in the kickoff, closed here); assumptions-and-requirements
  §12.7 equivocation-rule removal, REJECTED import honored.]
- **Shape:** input = bodies/envelopes with adversarial claimed-time fields and
  order-shaped inputs; output = deterministic algorithm results + SDK display
  tuples.
- **Impl:** SOL + TS + RS for every deterministic fold; SDK tier for display
  honesty.
- **Pass:** no claimed-time field (`observedAtClaim`, `probedAtClaim`,
  `horizonClaim`, envelope `notAfter`-as-testimony) influences any
  deterministic selection, index, or resolution outcome; admission-vs-claimed
  divergence surfaces as two labeled facts, never merged.
- **Members:** absurd `probedAtClaim` (future date, epoch 0) does not move the
  best-locator `SelectionKey` (which uses highest AdmissionOrdinal — content
  §10.3); `observedAtClaim` manipulation never reorders locator evidence;
  same-principal same-leaves two `pubNonce`s ⇒ two distinct authored events
  (multiplicity is legal — the §12.7 removal honored: no same-(principal,
  order) kernel rule exists to violate); same `pubNonce` re-sign ⇒ same event
  (GV-5 overlap); `notAfter` gates admissibility only — expired envelope still
  verifies as portable evidence; claimedAt-vs-admittedAt divergence member:
  a Record claiming 2019 admitted in 2026 displays both with their labels
  (SDK assertion); AdmissionOrdinal monotonicity + gap-free assignment
  (realm §5.3) as the only order primitive. `reconciles: RP-4`.

### GV-12 Upgrade vectors

- **Purpose:** later upgrades never silently reinterpret old admissions —
  Realm revisions, verifier versions, and account changes all classify
  historical data under the recorded basis. [Anchors candidate falsifier 7;
  constitution authority-history trace; V2-E5.]
- **Shape:** input = scripted revision/verifier/account transitions over a
  populated Realm; output = per-admission recorded bases + read-back
  classifications.
- **Impl:** SOL authoritative; TS/RS re-derive classifications from state.
- **Pass:** every pre-transition admission reads back byte-identically after
  the transition; `revisionAt(ordinal)` binary search deterministic;
  U-1..U-6 rules hold.
- **Members:** allowed upgrade (U-1) appends a revision (U-2) with
  `firstAdmissionOrdinal` recorded; admissions before/after classify under
  their own `revisionOrdinal` (U-4); verifier v1→v2 (adds
  `WP_P256_WEBAUTHN`): old `(kind=1, ver=1)` bases untouched, new admissions
  record ver 2; breaking change reuses RealmId → detected by C-5/C-6
  (GV-17 overlap; U-3); Realm freeze (U-6): admissions revert forever, reads
  live; graduation seam stub assertions G1–G8 (principal §6.2 — deferred
  members until a managed design exists, category slot reserved);
  authority-backdating probe: a key removed/rotated later cannot cause an
  earlier-signed, later-submitted envelope to classify under the old basis —
  admission-time validation stamps the basis at ITS admission, and read paths
  never re-evaluate (kel lesson via CARRY-IN (a)). `reconciles: RP-7`.

### GV-13 ResolutionPlan bytes, adversarial corpus, combiners (R-L1/R-L3)

- **Purpose:** the contract-Lens plan encoding and resolution semantics are
  cross-language deterministic; the adversarial plan corpus rejects fail-closed;
  authority-callback abuse and beneficiary self-authorization are structurally
  impossible. [Anchors SURVIVORS finding 5 (R-L1/R-L3 vector demand, closed
  here); candidate falsifier 8.]
- **Shape:** input = `ResolutionPlan/1` packed frames (lens §3.2) + head-state
  fixtures at a pinned basis; output = `ResolveResult` (presence, reasonCode,
  value, winner, counts, BasisReport) or validation `rejectCode`.
- **Impl:** SOL (`resolve`/`validatePlan`), TS, RS (pure fold over the same
  head fixture).
- **Pass:** byte-identical plan frames and PlanIds; identical ResolveResults
  on every member; identical rejectCodes; resolution gas independent of any
  principal's account code (no external calls on the read path — measured
  invariance member).
- **Members:**
  - Valid frames at N ∈ {1, 8, 32, 64} for each combiner.
  - **Adversarial corpus** — one member per rejection code 1–13 (lens §3.5):
    incl. `DUPLICATE_PRINCIPAL`, `BAD_ENTRY_COUNT` (N = 0 and N = 65 — the
    limit-overflow member), `BAD_COMBINER` (malformed/unknown tag),
    `ENTRIES_NOT_ASCENDING`, `BAD_THRESHOLD` (k = 0, k > N),
    `RESERVED_NONZERO`, `SINGLETON_BIT_FALSE`, `AUTH_FLOOR_UNSUPPORTED`,
    `BAD_LENGTH` frame-length attacks. **Cycle/diamond import members do not
    arise in B0** — plans are flat with no import grammar; the R-L1
    differential-compiler corpus (rich lens → plan compilation, incl. cycles)
    attaches to the client compiler tier when it exists [PROPOSAL — recorded
    as open item O6 so R-L1 is visibly parked, not dropped].
  - Combiner transitions T1–T10, each its own member; two-value THRESHOLD
    conflict at k ≤ N/2; tombstone-contributes-absent;
    `ALL_TIERS_SINGLETON` early-exit legality (set vs unset);
    equal-tier full-scan conflict detection.
  - Anti-fallthrough: an ungradeable-PRESENT head (SDK tier; B0 on-chain is
    constant AUTH_OK) → `UNKNOWN(REASON_AUTHORITY_UNGRADEABLE)`, resolution
    STOPS, never yields to a lower tier.
  - Off-chain grading members: `REASON_BASIS_UNAVAILABLE`,
    `REASON_COVERAGE_PARTIAL`, plan-unavailable → UNKNOWN never ABSENT.
  - **LENS-NEG-1** (beneficiary self-authorization, lens §8): attacker plan
    P2 = [M]; (a) `G.act` consults only pinned plan — no plan parameter
    exists; (b) `setApprovedPlan(P2)` from M reverts; (c) direct
    `resolve(P2, pos)` succeeds as a view with zero G state change.
  - Challenge-window commit/abort/finalize triple (lens §11): in-window head
    flip forces abort, never wrong acceptance; decision-scoped recheck
    (value + winner identity) survives unrelated churn at busy positions
    (LR-3(ii) repair).
  - `purposeAndScope` mismatch member: display plan pinned into a gate is
    refused by the conforming consumer check.
  `reconciles: RP-1,6,8`.

### GV-14 Page-key / cursor determinism & completeness honesty

- **Purpose:** every enumeration is deterministic, resumable, basis-stable,
  and honest about truncation and coverage; index incompleteness can never
  read as absence. [Anchors candidate falsifier 6; constitution honest-query
  trace; kickoff "page keys" gate.]
- **Shape:** input = `(pk components | log range, PageRequest{cursor,
  maxItems, basisOrdinal})`; output = `PageResult{realmBasis,
  highWaterOrdinal, cursor, items, coverage, completeness}`.
- **Impl:** SOL authoritative; TS/RS recompute pages from reconstructed state.
- **Pass:** identical item sequences and cursors; paging in one call vs
  resumed across k calls yields the identical concatenated sequence; the
  §0.3 two-axis assertions on every member.
- **Members:** `pk()` derivation vectors per KIND_* (GV-3 overlap); cursor
  resume equality; `CURSOR_END` exhaustion; **one-basis discipline** — a
  revocation landing between page 1 and page 2 does not ghost page 1 at the
  pinned basis, and admissions after `H` do not phantom in (`liveAt(ord, H)`
  fold, indexes §2.2/§5.2 rule 4); **never-empty rule** — a scan window of
  all-dead entries returns `PARTIAL` + cursor with empty items, never empty
  COMPLETE; empty + COMPLETE only as proven Realm-local absence;
  undeclared index → `UNSUPPORTED` (never silent-empty — the
  declared-vs-empty distinction member); unknown `indexKind` → UNSUPPORTED;
  `coverage ≥ items.length` dead-entry visibility (spray-degradation
  honesty); clamped `maxItems` never reverts; hydrated-vs-raw page
  consistency (`pagePostingsHydrated` items match raw ordinals hydrated
  one-by-one); `counts()` liveCount vs a client fold over pages at the same
  basis agree. `reconciles: RP-4,10`.

### GV-15 Dictionary / existence-oracle checks

- **Purpose:** content-derived identifiers do not become confirmation oracles
  where the design promises unlinkability, and ARE convergent where declared
  public; the oracle surface is enumerated, not accidental. [Anchors kickoff
  "privacy dictionary leakage"; CARRY-IN dictionary/correlation-oracle lesson
  set (VERIFIED in audit); encoding §1.5 salt rule.]
- **Shape:** input = plaintext/body corpora with and without salts/qualifiers;
  output = derived-id linkability verdicts per identifier family.
- **Impl:** TS/RS authoritative (oracle checks are offline computations); SOL
  for on-chain-visible members.
- **Pass:** for every content-derived identifier family (`RecordId`,
  `TypeSchemaId` + qualifier, ObjectGenesis-charter ObjectId, `PositionKey`
  purpose strings, envelope preimages), the category asserts EITHER
  "convergent by declared intent" (guessable, and that is the design — e.g.
  public `ByteDigest/1`) OR "salted per §1.5" (≥128-bit CSPRNG entropy; a
  dictionary attacker cannot confirm a candidate plaintext).
- **Members:** low-entropy public body ⇒ RecordId guessable — documented
  convergence member; same plaintext salted twice ⇒ two unlinkable ids;
  pure public-input-derived salt (content hash, path, counter) → REJECTED at
  conformance (encoding §1.5); `T-QUAL` persona qualifier unlinkability
  (GV-4 overlap); ObjectGenesis zero-salt = declared publicly-derivable
  (encoding §6 `TypeFamilyGenesis` note); subset-carriage RecordId oracle
  (GV-8 member cross-listed): unrevealed low-entropy leaves are guessable —
  subset carriage is NOT a confidentiality mechanism, asserted as
  documentation; high-entropy `pubNonce` denies a fully-guessable envelope
  preimage (authorship §2.6 hook); [FIXTURE] the privacy fixture's
  equal-low-entropy-plaintext public/private pair does not share an
  oracle-friendly id (constitution privacy trace).

### GV-16 Content & byte layer: digests, chunk trees, closures, selection

- **Purpose:** exact-byte commitments verify range-wise with second-preimage
  resistance; closures commit FINAL member sets; deterministic best-locator
  selection is implementation-independent. [Anchors kickoff "closure
  substitution" attack; constitution Large-content trace; owner ruling item C.]
- **Shape:** per content §13 — `ByteDigestValue` codecs; `verifyChunk(root,
  n, chunkSize, totalSize, index, chunk, proof) → bool`; closure bodies;
  `LocatorEvidence` fold + `SelectionKey` total order.
- **Impl:** SOL (`ChunkTreeVerify`, `selectBestLocator`), TS, RS.
- **Pass:** identical booleans/selections; every MUST-FAIL proof rejected;
  two implementations, one Plan, one basis ⇒ byte-identical selection.
- **Members:** digest table round-trips + multihash/ni: projections +
  wrong-length + reserved-tag `0x04` rejection; ChunkTree n ∈ {1, 2, 3, 5,
  256} (promotion cases), last-chunk-short, `chunkCount ≠
  ceil(totalSize/chunkSize)` rejected, tampered chunk, wrong-index proof,
  padded proof (trailing-hash rejection), truncated proof, chunk-as-node /
  node-as-chunk cross-role preimages fail (LEAF/NODE domain tags); same bytes
  at two chunk sizes ⇒ distinct RecordIds (documented non-convergence);
  closure: unsorted / duplicate-name / `/` / `.` / `..` / 256-byte name
  rejected, kind-target mismatch, `member.size` mismatch → `CLOSURE_MALFORMED`
  at walk (write-side convenience gets a read-side check — §0.2 rule),
  nested dedup, walk-depth PARTIAL; name-not-in-closure = the ONLY provable
  absence this layer grounds; selection: candidate-page truncation ⇒
  PARTIAL-labeled result, all-MISMATCH ⇒ `CONTENT_MISMATCH` not a selection,
  claimed-time manipulation does not move ranking (GV-11 cross-list);
  [FIXTURE] Arcade tampered-primary trace (A2 MISMATCH rotation → fallback →
  A3), resume-from-different-client, executable gate refuses at k = n−1.
  `reconciles: RP-5`.

### GV-17 Realm descriptor, bootstrap, confusion attacks, reconstruction

- **Purpose:** a fresh qualifying L3 bootstraps with no registry; every
  deployment/profile-confusion attack is detected by the C-checks; a second
  implementation rebuilds everything from state alone. [Anchors V2-E5 (PM
  in-scope); candidate falsifiers 2 and 10; SPINE lane finding 2.]
- **Shape:** input = `RealmDescriptor/1` + live/forged Realm state; output =
  C-1..C-7 verdicts, recomputed ids, and the W-0..W-10 walk result.
- **Impl:** TS + RS authoritative (two independent client reconstructions —
  this category IS the independent-rebuild acceptance trace); SOL supplies the
  Realm under test.
- **Pass:** both clients reach identical verdicts and identical reconstructed
  state digests; every A-* attack member is detected by its named C-check;
  the walk needs **zero** event logs (harness runs with logs disabled).
- **Members:** RealmId / profileId / genesisCommitment / RealmRevisionId
  recomputation vectors; A-1 wrong-chain (C-1); A-2 lookalike Core with
  divergent canonicalization — caught by C-6's recompute-one-envelope
  semantic spot-check; A-3 profile spoof → `UNSUPPORTED_PROFILE`, client MUST
  NOT best-effort-decode (C-4); A-4 descriptor substitution (C-2/C-3); A-5
  lying endpoint → C-7 disclosure conformance ("single-endpoint, unproven"
  labeling — the stale/omitting-RPC attack's honest floor); A-6 upgrade
  smuggling → C-5 revision-history check; W-0..W-10 full walk incl. W-8/W-9
  index+binding fold replay (pure function of the total event order);
  `UNAVAILABLE_SOURCE_BASIS` wording assertions H-1..H-5 (never absence,
  never silent fallthrough, never promoted local copy); section-C hints
  never enter any preimage (tamper member: altered rpcUrls change nothing).
  `reconciles: RP-1,4`.

### GV-18 Binding state machine, CAS, absence, anti-fallthrough

- **Purpose:** the Binding head machine is exact (T1–T9), races are typed
  errors, no-resurrection holds at the head tier, and absence discipline is
  enforced at the resolver boundary. [Anchors constitution honest-mutation
  block; owner ruling item F posture; JR-5 four sources via CARRY-IN.]
- **Shape:** input = admitted BindingSet/BindingTombstone/Withdrawal leaf
  sequences + `expectedRevision` intent params; output = head states,
  history entries, typed errors, absence verdicts.
- **Impl:** SOL authoritative; TS/RS fold-replay over the total event order.
- **Pass:** transition table exact; revisions and ordinals strictly increase;
  an occurrence produces at most one head state ever; `readHistory` pages
  reconstruct the full chain; the four-source absence rules hold at the SDK
  tier.
- **Members:** T1–T9 each; CAS race — two writers, same predecessor: one
  admits, the other's whole envelope reverts `ErrCasPredecessor` with the
  actual head occurrence + revision in revert data (re-read without extra
  RPC); stale `expectedRevision` → `ErrCasRevision`; wildcard-free rule (no
  sentinel accepted); T5 rebind-after-tombstone is not resurrection (fresh
  occurrence, greater ordinal); withdrawal-of-head tombstones — the
  downgrade-attack anti-vector: withdrawal can never SELECT an older value
  (no revert-to-predecessor transition exists); `ErrWithdrawTargetKind`
  (withdrawals are terminal); zero head word on authoritative in-Realm state
  = proven ABSENT (source 1); TOMBSTONED ≠ ABSENT (outcome vocabulary
  members FOUND / NONE_EXPLICIT / NONE_WITHDRAWN / ABSENT / UNKNOWN);
  [SDK] `PARTIAL(cursor)` manifest scope never yields absence; budget
  exhaustion / bare `eth_getStorageAt` zero never grounds absence;
  anti-fallthrough — UNKNOWN at a higher tier stops resolution (GV-13
  cross-list); challenge-window re-check = one SLOAD on `revision`
  (cost-shape member). `reconciles: RP-6,8,9,10,11`.

### Category-to-requirement traceability (compact)

| Requirement / demand | Category |
|---|---|
| R-D2 low-160 full-width | GV-3 (PID-LOW160), GV-13, GV-18 |
| R-D8 rail substitution | GV-6 |
| R-D9 time/order honesty + §12.7 removal | GV-11 |
| R-L1/R-L3 plan determinism + adversarial corpus | GV-13 (+ O6 client-compiler attach) |
| §10 grade axis never-collapse | §0.3 rule; GV-13/14/17/18 members |
| Kickoff golden-vector gate (invalid, unknown-version, replay, cross-Realm, subset, duplicate, partial-failure, upgrade) | GV-1/2, GV-2, GV-7, GV-7, GV-8, GV-9, GV-10, GV-12 respectively |
| V2-E5 descriptor/bootstrap/finality/reconstruction | GV-17 |
| Two-Principals pair (constitution) | GV-3 |
| Axis-8 pin pair | GV-4 |

---

## 3. Consolidated falsifier matrix

### 3.1 Consequence vocabulary [PROPOSAL]

- **ABORT-ARM** — the bakeoff cell exhibiting it is killed; B0 (or the rival
  arm) proceeds. Cells per the BAKEOFF lane: `B0 SPINE`, `F1 FLATCARD`,
  `F2 TAGGED`, `F3 REALMBOUND`, `F4 SPLIT-ID`, `F5 REF-LEAF`, `F6 MODULAR`,
  `F7 WIDE-POST`, `X17 FLATCARD-WIDE`.
- **REDESIGN-B0** — the spine itself is wrong; the affected chapter(s) reopen
  before Stage B continues. Detection at Stage A is by construction/argument;
  the vector re-detects regressions forever.
- **RETURN-TO-JAMES** — a budget/capability tradeoff; escalate with the exact
  numbers, never silently absorb [kickoff lines 106–107, VERIFIED].
- **RESERVED-SEAM** — cannot be closed inside B0; recorded as a named threat
  with the seam that must not foreclose it, so the freeze posture is honest
  [PM directive: deferred-but-reserved seams must be enumerated].

### 3.2 The candidate's 14 falsifiers (core-architecture-candidate.md, VERIFIED)

| # | Falsifier (reject/redesign if…) | Detected by | Consequence |
|---|---|---|---|
| CF-1 | first EOA/smart-account authorship needs a separate registration block | GV-5 + principal D1 probe (setup txs = 0; first-use record rides the first admission); every FIXTURE first-write | REDESIGN-B0 (axis 2; F2 comparison data) |
| CF-2 | a fresh supported Realm requires Commons or another chain to write or resolve | GV-17 bootstrap members (no-registry walk); fresh-L3 FIXTURE trace | REDESIGN-B0 (realm chapter) |
| CF-3 | moving a Record between Envelopes changes RecordId | GV-3 Envelope-independence member | REDESIGN-B0 (identity layer) — currently held by construction |
| CF-4 | identical Records from two issuers lose distinct Occurrences/provenance | GV-9 duplicate-leaf + ten-curators FIXTURE (Arcade) | REDESIGN-B0 |
| CF-5 | a Type creator can make admission or reads unbounded | GV-1/GV-2 grammar bounds; GV-14 hot-key members; indexes §8 limits table asserted as vectors | REDESIGN-B0 (encoding/indexes grammar) |
| CF-6 | index incompleteness can appear as absence | GV-14 never-empty + UNSUPPORTED members; AA-5 (F4 cell) | REDESIGN-B0; for the F4 arm, ABORT-ARM |
| CF-7 | smart-account/Core upgrades reinterpret historical admission | GV-12 (all members); GV-5 pinned-codehash replay | REDESIGN-B0 |
| CF-8 | contract Lens reads call arbitrary authority callbacks per Principal | GV-13 gas-invariance member + static no-external-call inspection (= AA-2) | REDESIGN-B0 (lens layer) |
| CF-9 | an application needs a custom Core contract or private index for ordinary typed references/membership/comments/releases/evidence | FIXTURE tier: Arcade, Git/Markdown, Nanda, EAP (provisional), contract-config traces built from generic Types only; content chapter falsifier (a) | REDESIGN-B0 (architecture-level; kickoff names it a candidate falsifier of the whole design) |
| CF-10 | state-only reconstruction needs old logs or an EFS-operated database | GV-17 W-walk with logs disabled | REDESIGN-B0 |
| CF-11 | Type bootstrap or recursive references create hash fixed points | GV-2 SELF/GROUP_REF members | REDESIGN-B0 (encoding) |
| CF-12 | a mutable parent changes already-admitted child meaning | GV-2 evolution-inertness member; GV-12 schema-immutability; GV-16 closure FINAL-commitment members | REDESIGN-B0 |
| CF-13 | one batch accidentally promises application-level atomicity it cannot provide | GV-8 conclusion-7 member; GV-10 all-or-nothing vs FIXTURE Git multi-ref typed-transaction trace | REDESIGN-B0 (envelope semantics; the typed transaction Record is the sanctioned path) |
| CF-14 | aggregate gas/state for the mandatory index bundle is not economically credible on the intended L2/L3 profile | Stage B measurement harness: the ONE aggregate bundle snapshot (indexes §9) over the frozen fixture corpus; not a byte-vector matter | RETURN-TO-JAMES (then possibly ABORT of specific obligations, each named) |

### 3.3 Kickoff attack list (fable-efs2-core-engineering-kickoff.md lines 112–116, VERIFIED)

| # | Attack | Detected by | Consequence |
|---|---|---|---|
| KA-1 | reentrancy / module partial failure | GV-10 (reentry, batch, poisoned-leaf members); F6 MODULAR adversarial matrix | ABORT-ARM (F6) if the modular arm partially commits; REDESIGN-B0 if B0 does |
| KA-2 | malformed canonical bodies | GV-1 full MUST-FAIL set | REDESIGN-B0 if any malformed body admits |
| KA-3 | unbounded returndata | GV-5 1271 returndata-bomb; GV-10 bounded-copy member | REDESIGN-B0 |
| KA-4 | duplicate postings | GV-9 (strict-ascending append, T2 no-op, no-double-decrement) | REDESIGN-B0 |
| KA-5 | authority backdating | GV-12 backdating probe (admission-time validation + persisted basis); GV-18 ordinal monotonicity | REDESIGN-B0 |
| KA-6 | smart-account code changes | GV-5 pinned-codehash replay; GV-12 | REDESIGN-B0 |
| KA-7 | EIP-7702 classification | GV-5 three-point vector + anti-vector (hasCode dispatch fails E2) | REDESIGN-B0 (verifier) |
| KA-8 | cross-Realm replay / domain confusion | GV-7 full matrix | REDESIGN-B0 |
| KA-9 | stale / omitting RPCs | GV-17 C-7 conformance (cross-check / proof / labeled-unproven); GV-14 basis honesty at SDK tier | REDESIGN of client conformance rules (Core is not the detection point — an RPC lie is outside Core's trust boundary; the falsifier is a *client* that presents unproven endpoint answers as proof) |
| KA-10 | privacy dictionary leakage | GV-15 oracle checklist; privacy FIXTURE | REDESIGN-B0 (privacy profiles / salt rules) |
| KA-11 | closure substitution | GV-16 proof + cross-role + closure members; RepresentationBinding false-binding detectability | REDESIGN-B0 (content layer) |
| KA-12 | resurrection | GV-9 (occurrence tier) + GV-18 (head tier: no revert-to-predecessor input exists) | REDESIGN-B0 |

### 3.4 Audit additions

| # | Threat | Detected by / recorded as | Consequence |
|---|---|---|---|
| AA-1 | **Timed equivocation against contract gates** — attacker signs the good value, waits for the gate to act, then signs the conflict; any kernel collision bit only catches clumsy simultaneous equivocation [OWNER RULING — item F, owner-rulings 2026-07-15, VERIFIED via three chapters' verbatim carriage] | GV-13 challenge-window triple (in-window flip ⇒ abort, never wrong-accept); GV-18 CAS-visibility members; the kernel collision bit stays [REJECTED — item F, TOCTOU-defeated] | Consumer-pattern conformance; exact window mechanics UNFROZEN per PM directive — any future kernel duplicity state must first overcome the recorded TOCTOU refutation |
| AA-2 | **Lens authority-callback abuse** — a read path invoking account code per Principal (gas bombs, state-dependence, backdating re-entry) | GV-13 gas-invariance + zero-external-call inspection; overlaps CF-8 | REDESIGN-B0 |
| AA-3 | **Beneficiary self-authorization** — a caller supplies the trust policy that authorizes that caller | LENS-NEG-1 (GV-13); structural claim: no state-changing conforming consumer reads a caller-supplied plan id | REDESIGN of consumer conformance profile; Core `resolve` stays a neutral view |
| AA-4 | **Deployment/profile confusion** — wrong chain, lookalike Core, profile spoof, descriptor substitution, upgrade smuggling | GV-17 A-1..A-6 members, each tied to its C-check | REDESIGN-B0 (descriptor) if any A-* evades all C-checks |
| AA-5 | **PARTIAL-backfill-reads-as-absence** — under axis-4 Variant B, a not-yet-complete backfill answers as complete absence | F4 SPLIT-ID cell coverage vectors (start-basis + PARTIAL-until-proven discipline); GV-14 UNSUPPORTED/coverage members guard the Variant A structural case | ABORT-ARM (F4) — the BAKEOFF lane's own decision rule: Variant B is rejected outright if any coverage vector lets a PARTIAL backfill read as absence |
| AA-6 | **Succession: "old suite becomes forgeable"** — the signature suite or hash weakens before the archive dies (R-K10/O-3 cluster; SURVIVORS finding 1, VERIFIED absence in the kickoff) | RESERVED-SEAM. The seams that must not foreclose it, each already pinned: append-only `authorityKind` enum + verifier versioning (principal §2.2/§3.1), `AuthorityBasis` as the frozen interpretation key, the hash-migration playbook + domain-bump structure (GV-3 migration member is the structural half), reserved witness kinds `0x03–0x7F`, `ALG_SUCCESSOR_RESERVED` | RESERVED-SEAM — cannot be closed in B0; MUST appear in the freeze-posture/deferred-seams list; the EIP-8130-style probe (principal §8) is the standing drill |
| AA-7 | **Succession: "two kernels admit"** — during any succession, two active kernels/Realms both admit under one claimed identity (R-K12) | RESERVED-SEAM. Pinned posture: U-3 (breaking = NEW RealmId; Core has no successor pointer, no admin successor bit), one-contract-one-Realm, successor claims as ordinary Lens-graded evidence; sketch detection: a successor-evidence fixture where old and new Realms both admit — clients MUST present two Realm-qualified truths, never one merged CURRENT (R-K11 check) | RESERVED-SEAM — any future same-identity succession design must add a single-active-kernel vector class before freeze |

[Each AA row: label as stated; AA-1's ruling is OWNER RULING; AA-5's decision
rule is the BAKEOFF lane's PROPOSAL adopted here as the detection contract;
AA-6/AA-7 statements are DERIVED from the SURVIVORS lane's verified
register rows (R-K10/R-K12/O-3), with the seam inventory VERIFIED against the
chapters cited.]

### 3.5 Coverage note

Every kickoff attack, all 14 candidate falsifiers, and all six audit additions
map to at least one detection row above; conversely every GV category serves
at least one matrix row (GV-4 serves the axis-8 pin; GV-6 serves R-D8, which
the kickoff omitted and the audit added; GV-11 serves R-D9, ditto). The
red team should attack the *mapping*, not just the lists: a falsifier whose
detection row cannot actually fire (e.g. because an RP conflict makes the
vector unmintable) is a defect of this chapter.

---

## 4. What Stage A does NOT produce (the Stage B boundary)

Explicit, so the deliverable cannot be over-read [PROPOSAL — boundary
statement; PM directive: Stage A stops for review]:

1. **No expectation bytes.** Not one hex output value in this chapter is
   frozen. The two worked PrincipalId examples (principal §2.5 A/B) are
   candidate seeds only — they were computed under the raw-ascii-domain
   variant and are void if RP-1 resolves the other way. Stage B mints all
   byte vectors from the reconciled formulas.
2. **No implementations.** Neither the Solidity prototype Core nor the TS/RS
   libraries exist yet. Stage A defines what they must agree on.
3. **No differential runs, no CI harness.** The vector-record container
   (§0.4) is a shape proposal; the harness lane freezes the format and the
   runner.
4. **No measured gas.** Every gas figure in every chapter is schedule
   arithmetic labeled PLAUSIBLE/HYPOTHESIS; the measurement harness replaces
   them (CF-14 cannot fire until then).
5. **No fixture corpus data.** Arcade/Git/Nanda/contract-config/privacy/50 GB/
   mount traces are named, not built; EAP remains provisional until Codex
   supplies a durable brief [PM directive].
6. **No wallet-signability run.** GV-5's `eth_signTypedData_v4` member is
   defined here; the live re-run against current wallets is Stage B
   (authorship O6 — the July confirmation is aging evidence).
7. **No frozen TBD constants.** `WITHDRAWAL_TYPE_ID`, `TYPE_BINDING_SET_V1`,
   `TYPE_BINDING_TOMBSTONE_V1`, `TYPE_RESOLUTION_PLAN_1`, final `chainRef`
   bytes, `UNICODE_PIN`, `ERC1271_VERIFY_GAS` — all await their owning
   chapters' closure; vectors touching them carry the dependency.
8. **No client-compiler corpus.** The R-L1 rich-lens differential-compilation
   corpus (incl. cycle/diamond imports) attaches when that compiler exists;
   B0's flat plans cannot host it (GV-13 note; open item O6).
9. **No succession vectors.** AA-6/AA-7 are recorded as reserved-seam threats
   with their seam inventory; designing their vector classes is future work
   that gates freeze, not Stage B.
10. **Minting order [PROPOSAL]:** after synthesis resolves RP-1..RP-12:
    ids (GV-3/4) → codec (GV-1/2) → envelope/witness (GV-5/6/7/8) → state
    machines (GV-9/10/12/18) → folds and pages (GV-13/14/16) → realm walk
    (GV-17) → oracle checks (GV-15) — each stage's vectors feed the next
    stage's fixtures.

---

## Interfaces exposed

The compact contract other chapters (and the Stage B harness) rely on:

- **Category identifiers** `GV-1 … GV-18` with owning chapters:
  GV-1/2/3/4 encoding (+3 spans all id-bearing chapters); GV-5/6/7/8
  authorship + principal; GV-9/10 authorship + realm + indexes; GV-11
  cross-cutting (R-D9); GV-12 realm + principal; GV-13 lens (+binding);
  GV-14 indexes; GV-15 privacy-facing (encoding + authorship + content);
  GV-16 content; GV-17 realm; GV-18 binding. Stage B may add member vectors
  within a category but may not delete a category or member class without a
  labeled ruling.
- **Falsifier identifiers** `CF-1..14`, `KA-1..12`, `AA-1..7` with the
  detection mapping of §3 and the consequence vocabulary
  {ABORT-ARM, REDESIGN-B0, RETURN-TO-JAMES, RESERVED-SEAM}.
- **Cross-cutting rules** every vector obeys: three-implementation agreement
  with typed-error equality (§0.1); write-pairs-with-read-back (§0.2);
  two-axis never-collapse (§0.3); tier notation CORE/SDK/FIXTURE (§0.5).
- **Reconciliation preconditions** `RP-1..RP-12` (§1) — the synthesizer's
  checklist; the `reconciles` field makes them machine-enforceable at minting
  time. No vector freezes while its RPs are open.
- **Stage boundary** (§4): Stage A = categories, members, pass criteria,
  detection mapping; Stage B = bytes, implementations, runs, measurements.

## Open items

1. **RP-1..RP-12 resolution** — the synthesizer must rule each conflict
   (or route irreducible ones per the PM's evidence-first rule) before any
   vector is minted; this chapter's member lists are stable across
   resolutions, only the bytes change.
2. **Vector container format** — §0.4 shape is a proposal; the
   fixture/measurement-harness chapter (PM deliverable 5) freezes it.
   Closed by: harness lane + synthesizer.
3. **PID-LOW160 injection harness** — the test-only storage path that injects
   synthetic colliding PrincipalIds must be designed so it cannot exist in
   production builds (compile-time gate). Closed by: harness lane.
4. **State-digest definition** (§0.1 O7 reference) — the canonical digest of
   Realm state used for fold-equality and zero-delta revert assertions;
   candidates: the realm chapter's optional `stateDigest` accumulator
   [HYPOTHESIS there] or a harness-side storage-dump hash. Closed by: harness
   lane; must not become a Core obligation silently.
5. **EAP fixture** — provisional per the PM directive; GV members referencing
   it are conditional until the durable brief lands. Closed by: Codex brief.
6. **R-L1 client-compiler corpus attach point** — cycle/diamond/import
   adversarial compilation vectors parked until the rich-lens compiler
   exists; visibly parked here so R-L1 is not silently dropped. Closed by:
   the client/lens-compiler lane.
7. **R-L4 lens scale (50/100/256)** — a measurement matter, not a byte-vector
   matter: GV-13's N ∈ {1,8,32,64} covers Core; the client-tier 50/100/256
   principal-count benchmarks belong to the harness lane's matrix and are
   flagged there per the SURVIVORS lane so the scale requirement is parked,
   not lost. Closed by: harness lane.
8. **Presence/Binding outcome vocabulary mapping** — GV-18's five-value
   position-state set vs GV-13's `Presence` enum vs GV-14's `Completeness`
   must be mapped onto the SDK result model's two axes before SDK-tier
   members mint (binding open item 5). Closed by: read-model/SDK chapter +
   synthesizer.
9. **Wallet re-verification run** (GV-5 member; authorship O6) — Stage B,
   against then-current major wallets. Closed by: Stage B execution.
10. **Succession vector classes** (AA-6/AA-7) — reserved; designing them is a
    named freeze gate, not Stage B scope. Closed by: a future succession
    design round with its own owner review.
