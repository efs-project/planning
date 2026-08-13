# Requirement-to-test traceability
**Stage A chapter — post-red-team repaired draft; not landed, adopts nothing.**

Traceability lane of the Stage A commissioned pass (2026-08-12) — PM deliverable 3
("requirement-to-test traceability with owner-ruling, derived-invariant, proposal,
hypothesis, and rejected labels"). Inputs read for this lane, all VERIFIED (exact
text read): `system-constitution.md` (every requirement bullet + the 16-row
acceptance-test table), `owner-rulings.md` (complete, 2026-07-10 through
2026-08-12), `core-architecture-candidate.md`, the PM Stage A directive, the
intake audit `audit-lanes.json` (SURVIVORS lane in full; CARRY-IN and RULINGS
summaries), the survivor register `assumptions-and-requirements.md` (targeted
R/A/E/O/D rows and §10/§12 re-read at their cited lines), the owner decision
inbox (V2-E1..E8, V2-F1/F2 gate texts), and ALL eleven Stage A chapters
(`b0-encoding-and-ids`, `b0-authorship-envelope`, `b0-principal-authority`,
`b0-realm-admission`, `b0-indexes`, `b0-binding`, `b0-lens`,
`b0-content-locators`, `bakeoff-spec`, `harness-and-fixtures`,
`vectors-and-falsifiers`).

This chapter is the audit surface the independent reviewers read first. Every row
answers: what is required, on whose authority, where the B0 baseline realizes it,
which golden-vector category tests it, which fixture exercises it, which
falsifier guards it, and whether it is COVERED, DEFERRED with a named home, or a
GAP with a disposition proposal.

---

## 0. Conventions

### 0.1 Columns and identifier vocabularies

- **Requirement** — terse restatement + source citation (doc § or line).
- **Label** — exactly one of [OWNER RULING] (cited to owner-rulings.md date/item),
  [DERIVED INVARIANT] (evidence doc + section), [PROPOSAL], [HYPOTHESIS],
  [REJECTED]. The label grades the *requirement/mechanism claim itself*, not this
  table.
- **B0 realization** — chapter + section of the eight B0 lane chapters
  (`enc` = b0-encoding-and-ids, `auth` = b0-authorship-envelope,
  `prin` = b0-principal-authority, `realm` = b0-realm-admission,
  `idx` = b0-indexes, `bind` = b0-binding, `lens` = b0-lens,
  `cont` = b0-content-locators) or of the assembly chapters
  (`bk` = bakeoff-spec, `hf` = harness-and-fixtures, `vf` = vectors-and-falsifiers).
- **Vector** — `GV-1..GV-18` (vf §2), cross-cutting rules `vf §0.2/§0.3`,
  conformance suites `CV-*` (hf §2.0.3), or bakeoff decision statistics
  (bk §4: `KSTAR_1 … FRESH_5/REENDORSE_5 … I_17`) when the test is a
  measurement, not a byte vector.
- **Fixture** — `FX-ARC, FX-GIT, FX-EAP [PROVISIONAL], FX-NANDA, FX-LENS,
  FX-TOPIC, FX-PRIV, FX-50GB, FX-MOUNT (canonical raw-manifest input seam only), FX-BROWSE` and
  workloads `WL-SPRAY / WL-CHURN / WL-HOT / WL-DEAD-LOCATOR` (hf §2/§4).
  "all" = every fixture's
  write path exercises it.
- **Falsifier** — `CF-1..14` (candidate's 14, vf §3.2), `KA-1..12` (kickoff
  attack list, vf §3.3), `AA-1..7` (audit additions, vf §3.4), or a bakeoff
  hard gate (bk §4: `RECON_1, V3_COPY, GATE_4, ONECALL_5, PFAIL_6, SIZE_6`).
- **Status** — one of:
  - **COVERED** — specified in B0 at the exactness bar AND wired to at least one
    vector/fixture/falsifier. (Stage B still has to *run* everything; see §0.2.)
  - **DEFERRED(home)** — deliberately not closed in Stage A; the named home is
    the lane/gate that owes it. A DEFERRED row with no home would be a GAP.
  - **GAP** — nothing in the eleven chapters realizes, tests, or names it. Every
    GAP carries a one-line disposition in §7.
  - **Counting rule:** a row's status for §8 tallies is its FIRST status token;
    where a row notes a residual half ("seam COVERED; X DEFERRED"), the
    residual is tracked in the pointed-to row or §7 entry, never lost.

[PROPOSAL — the row-ID scheme, three-valued status vocabulary, and the
split-row discipline of §0.3; rationale: reviewers need mechanical
checkability, and a fourth "partial" status hides exactly the ambiguity this
table exists to remove.]

### 0.2 What COVERED does and does not claim

Stage A produced **specifications, categories, and detection mappings — zero
runs, zero measured gas, zero minted byte vectors** (vf §4 boundary, VERIFIED).
COVERED therefore means "an engineer can implement it and the test that would
catch its violation is named and specified." Rows whose evidence is inherently
a measurement (gas/state budgets) say so via a bakeoff statistic and remain
open at Stage B — most prominently CF-14, which cannot fire until the harness
runs. Every COVERED status is conditional on VERIFIED SR-1..SR-18
owning-chapter repairs, the vector `requiresPins` gate, and the Task 6
retired-form residue checks (vf §1; hf §1.3). Historical
RP-1..RP-18/S1–S8 identifiers preserve provenance but cannot authorize bytes
by themselves.

### 0.3 Split-row discipline

Where a requirement is half Core / half client-or-later-lane, it is split into
sub-rows (a/b) so each carries one honest status, instead of one row averaging
COVERED and DEFERRED into mush.

---

## 1. Constitution — system-layer obligations

Source: system-constitution.md "System layers" (VERIFIED).

| ID | Requirement (source) | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-LY-1 | Fresh qualifying L3 deploys Core, authors/reads locally, bounded contract queries, reconstructs without Commons/canonical chain/OS/indexer (const. "EFS Core") | [OWNER RULING — 2026-08-12 boundary] | realm §2 (registry-free descriptor), §4 (QR-1..8), §8 (walk) | GV-17 | CV-RECON; FX-NANDA.E | CF-2, CF-10, RECON_1 | COVERED |
| C-LY-2a | Direct guest read path: open explicit Realm/link unauthenticated, verify bytes, before wallet/OS boot (const. "Web Client") — Core read semantics | [OWNER RULING — 2026-08-12 "direct guest File Browser path is required"] | realm §3 C-1..C-7 client checks; read ABIs across idx/bind/lens/cont | GV-17, GV-14 | FX-NANDA.E, FX-BROWSE | CF-2 | COVERED |
| C-LY-2b | The self-hostable Web Client build itself (reader/verifier/File-Browser modules) | [OWNER RULING — same] | not a Stage A artifact | — | — | — | DEFERRED(V2-E6 vertical slice) |
| C-LY-3 | EFS OS optional; consumes Core, never required by it | [OWNER RULING — 2026-08-12 boundary] | no chapter depends on OS; guest fixtures run without it | — | FX-NANDA.E, FX-BROWSE | CF-2 | COVERED |
| C-LY-4 | Commons optional; never mints identity, sole index, execution authority, or gate on direct access; venue needs CROPS review | [OWNER RULING — 2026-08-12 "No Commons home chain is selected"] | nothing in B0 references a Commons; venue params live in RealmProfile (hf §3.3) | GV-17 | FX-NANDA.E | CF-2 | COVERED for Core-independence; venue selection DEFERRED(V2-E7, out of this pass's scope) |

## 2. Constitution — core requirement bullets

Source: system-constitution.md "Core constitutional requirements" — every bullet,
in document order (VERIFIED).

### 2.1 Universal identity without false equivalence

| ID | Requirement | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-UI-1 | IDs deterministic, domain-separated, versioned, generatable without mining a receipt/tx | [DERIVED INVARIANT — const. Universal identity; no-mined-UID direction, owner-rulings 2026-08-12] | enc §1.3 (pinned printable domains), §4 (ID family); skeleton ID rule | GV-3 | all (ids precomputed offline in every script) | CF-1; GV-3 one-word sensitivity | COVERED |
| C-UI-2 | Chain, deployment, carrier, receipt, block, URL, mirror, submitter, gas payer never change portable identity | [DERIVED INVARIANT — const.; R-D7 register:161] | enc §4 (venue-free preimages); auth §2.3 (witness excluded from EnvelopeId); realm §5.1 (receipt separate from identity) | GV-3 (envelope-independence), GV-5, GV-6 | CV-RAIL, CV-XREALM | CF-3; KA-8 | COVERED |
| C-UI-3 | Stable subjects, exact immutable data, authored publication, moving selections are distinct concepts | [DERIVED INVARIANT — const.; candidate "crucial separations", VERIFIED] | enc §4.1 (RecordId, ObjectGenesis); auth §3 (Occurrence); bind §1–3 (moving heads) | GV-3, GV-9, GV-18 | FX-ARC (project/release/selection), FX-TOPIC | CF-4 | COVERED |
| C-UI-4 | Chain-independent ID ≠ global current authority; Realm/policy/basis qualify admission, order, revocation, currentness | [DERIVED INVARIANT — const.; R-K11 register:181] | realm §4.2 (BasisGrade), §5 (Realm-qualified receipts); bind §6; lens §7.2 | GV-7, GV-17; vf §0.3 rule | CV-XREALM; FX-NANDA.D (two catalog answers, never merged) | KA-8; AA-7 | COVERED |
| C-UI-5 | External references self-describing (profile, kind, algorithm, origin) | [DERIVED INVARIANT — const.; foreign-digest rule, skeleton] | enc §2.4 (algorithm-tagged DIGEST); cont §1 (pinned algorithm table), §3 (Locator profile) | GV-1 (DIGEST members), GV-16 | FX-GIT (native OIDs foreign-only, adversarial iv) | GV-16 reserved-tag rejection | COVERED |

### 2.2 Minimal typed data

| ID | Requirement | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-TD-1 | EAS's developer outcomes without EAS: shared Types, precise shapes, named validation/admission, browsable-by-Type, app Types need no Core upgrade | [OWNER RULING — 2026-08-12 acceptance-obligation clause ("Shared Types and validation")] | enc §3/§3.4 + realm §8.1: `TypeSchemaGroup/1` is an intrinsic Record admitted by ordinary `publish`; SR-17 validation + cache materialization are atomic; idx §3.3 unique-by-Type | GV-2; SR-17 | all (phase-A `PUBLISH_SCHEMA_GROUP`); CV-SCHEMA-CAP | CF-9; atomic schema-cap gate | COVERED |
| C-TD-2 | Canonical Records store only defining bytes; derivable fields not repeated as payload | [DERIVED INVARIANT — const. Minimal typed data] | enc §2.5 (body layout); cont §3 (Locator author = Occurrence, not a body field) | GV-1 (canonical-form uniqueness) | all | KA-2 | COVERED |
| C-TD-3 | Immutable descriptors/context may share repeated data; mutable ambient parents never retroactively reinterpret children | [DERIVED INVARIANT — const.] | auth §2 (immutable Envelope amortizes); enc §6 (evolution evidence is inert on old admissions) | GV-2 (evolution-inertness), GV-12 | FX-ARC.E, FX-GIT.D (index-evolution events) | CF-12 | COVERED |
| C-TD-4 | Exact content separable from authored Occurrence and Realm receipt; identical content from several authors keeps distinct provenance | [DERIVED INVARIANT — const.; candidate ten-curator trace] | enc §4.1 + auth §3.1 + realm §5.1 (three distinct objects/keys) | GV-3 (same Record, two envelopes), GV-9 (duplicate leaves) | FX-ARC.22 (ten endorsements), FX-TOPIC (convergence twins) | CF-4 | COVERED |
| C-TD-5 | Types declare zero+ bounded typed reference roles; n-ary relations never forced into a fake owner | [DERIVED INVARIANT — const.] | enc §3.1 (referenceRoles, groups); cont §2 (ownerless ByteDigest/ChunkTree) | GV-1 (extractRefs), GV-2 (role binding) | FX-TOPIC (Topic + ownerless UnitValue) | CF-9 | COVERED |

### 2.3 Authorship and authority

| ID | Requirement | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-AA-1 | Semantic author, signing actor, submitter/relayer, payer are distinct roles | [DERIVED INVARIANT — const.; R-D8 register:162] | auth §2.1 (principal vs witness), §9 (rail invariant); prin §1 | GV-5, GV-6 | CV-RAIL | vf §3 R-D8 mapping; KA via GV-6 | COVERED |
| C-AA-2 | EOA and ERC-1271 authorship work in a fresh Realm without another chain's identity service; descriptor identity cannot be forged | [DERIVED INVARIANT — const.; V2-E5 gate text; SR-13/SR-14] | prin §3.4 (per-kind semantics), §5 (1271/6492 policy); auth/realm write path checks computed PrincipalId before any witness | GV-5 | CV-AUTHCHAIN; FX-ARC (C2 = 1271 curator), FX-LENS cast | CF-1, CF-2; SR-13 mismatch attack | COVERED |
| C-AA-3 | Historical admission records authority + implementation basis; later account/controller/Core changes never silently reinterpret | [DERIVED INVARIANT — const.; kel admission-time lesson via CARRY-IN] | prin §3.5 (AuthorityBasis persisted); auth §4.3 (admission-time, not read-time); realm §7 (U-1..U-6) | GV-12; GV-5 (pinned-codehash replay) | CV-7702 | CF-7; KA-5, KA-6 | COVERED |
| C-AA-4 | Rotation, delegation, recovery, organizations, future suites are extension requirements; no full custom KEL frozen into the MVP | [OWNER RULING — 2026-07-10 "KEL — design it" as reopened by 2026-08-12 reset; const. wording] | prin §6 (graduation seam, G1–G8 invariants), §2.2 (append-only kinds); auth §6 (reserved authority seam) | GV-12 (GRAD-SEAM slot, members deferred) | — | AA-6, AA-7 (RESERVED-SEAM) | COVERED as reserved seam; the managed-Principal design itself DEFERRED(future KEL/succession round — vf open item 8) |
| C-AA-5 | One PrincipalId author surface + intrinsic zero-setup account Principal — explicitly prototype, not constitutional law | [PROPOSAL — B0 axis-2 pin; V2-E1 open] | prin §2 (AccountPrincipal/1); bk §3.3/§4.2 F2 uses the one hashed-domain/fixed-word `DOM_BAKEOFF_AUTHOR_KEY` formula | GV-3 (PID-DERIVE) | all | bk axis-2 rejection conditions (fractured authorship kills either arm) | COVERED as bakeoff arm |
| C-AA-6 | Full bytes32 PrincipalId through every ID, ABI, storage key, index key, Binding, Lens; low-160-collision pair distinct end to end | [DERIVED INVARIANT — R-D2 register:156; const.] | skeleton rule; prin §2.4/§2.6; bind §1.1; lens §3.2 (32-byte entries); idx §2.1 | GV-3 (PID-LOW160) | CV-PID160; FX-LENS (entries 63–64) | category-fails-by-construction on any 160-bit re-derivation | COVERED |

### 2.4 One transaction and honest mutation

| ID | Requirement | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-TX-1 | Precomputed dependent IDs; bounded dependency graph in one EVM transaction; all-commit-or-all-revert; no second block to learn an id | [DERIVED INVARIANT — const.; kickoff line 56] | realm §5.4 point-in-order write-free shadow + assert-only journal, intrinsic TypeSchemaGroup → earlier-staged descriptor resolution, REF-SAT same-envelope RecordId DAG; auth §5.3 current-envelope OCCREF rejection before activation plus persisted-Type retry guard; optional non-Core atomic router composes independent precomputed Envelopes; §5.6 EIP-7825 fit; hf §3.3 `MUST_FIT_ATOMIC` | GV-10 (REF-SAT, ROUTER-BIND-WITHDRAW, ROUTER-BIND-REBIND, STAGED-TYPE-OCCREF/E_SELF_OCCREF, DUP-WITHDRAW-EXTERNAL) | CV-SHADOW; FX-ARC phase C | ONECALL_5 (hard gate; over-cap fails with splitFactor=1); KA-1 | COVERED |
| C-TX-2 | Identical-content retry idempotent; mutable state uses explicit predecessor/CAS | [DERIVED INVARIANT — const.] | SR-15 occurrence-granular no-op; auth §5.3 static revision association; realm §5.4/§5.5; bind §3.2–§3.5 sequential shadow head/source | GV-9, GV-18 | CV-SPARSE-ADMIT; CV-SHADOW; FX-GIT races | KA-4 | COVERED |
| C-TX-3 | History append-only; authenticated pre-withdrawal/withdrawal/revocation/tombstone/replacement never erase bytes or resurrect older values | [DERIVED INVARIANT — const.] | bind §3.4/§4; auth §2.2/§3.2–3.3 every effective external T4 retains complete bounded TargetRecordCommitment evidence + Admission-only lifecycle context; idx §2.3/§3 RAW_AUDIT sequential journal | GV-9, GV-18 | CV-WITHDRAW; CV-PREWITHDRAW/T4-MAX-BODY; CV-SHADOW; FX-EAP.C, FX-NANDA.D | KA-12 | COVERED |
| C-TX-4 | Signed Envelope ≠ application-semantic transaction; multi-ref atomicity lives in one typed transaction Record or bounded profile rule | [DERIVED INVARIANT — const.] | auth §7 (conclusion 7); GitPushTransaction/1 (hf §2.2); hf §3.3 `MUST_FIT_ATOMIC` | GV-8 (conclusion-7 member), GV-10 | FX-GIT `PUSH-WORST-20`: exactly 20 ref updates + transaction Record = 21 leaves, never repacked/split | CF-13 | COVERED |

### 2.5 On-chain graph and indexes

| ID | Requirement | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-IX-1 | Core is a graph database; required contract reads in bounded gas from Realm state | [DERIVED INVARIANT — onchain-completeness §6 "THE LINE" via idx §0] | idx §0 (acceptance rule), §3, §5 | GV-14 | mandatory read matrix (hf §3.1); WL-HOT flatness | CF-5 | COVERED |
| C-IX-2 | Baseline automatic reads: exact Types, Records, Occurrences, receipts, global admission order, unique-by-Type, Occurrences by Type/Record/Principal | [DERIVED INVARIANT — const.; 2026-08-12 "remain automatic"] | idx §3.1–§3.4; SR-18a u16 digest key and SR-18d last-live count | GV-14; GV-3 (pk()) | CV-DIGEST-LOOKUP; CV-LAST-LIVE-COUNT; hf §3.1 read matrix | CF-14 (aggregate) | COVERED |
| C-IX-3 | Type creator declares bounded index set; once admitted, every matching item auto-indexed; no writer opt-out | [OWNER RULING — 2026-07-15 item 12 (opt-in REJECTED); re-carried 2026-08-12] | idx §0/§4.1 exact 2-byte IndexSpec; enc §3.1 closed ReferenceRole target classes + selectors + bounded ArtifactClosure nested extraction; digest equality is KIND_DIGEST, not a reference class; F4 exact profile/coverage cell in idx §10 | GV-2 (selector + 16/17 + exact IndexSpec, kernel Type blobs/error 17), GV-14 (F4 coverage) | FX-ARC.E | CF-6; AA-5 | COVERED |
| C-IX-4 | Paginated typed backlinks by role/target; hot values, spam, dead history never turn point reads or locator selection into unbounded scans | [DERIVED INVARIANT — const.; owner ruling item A] | idx §3.5/§7/§8; every B0 selector posting visited consumes the cap and returns cursor honestly | GV-14 | WL-SPRAY, WL-HOT, WL-CHURN, WL-DEAD-LOCATOR | CF-5; dead-spray total-visit bound | COVERED |
| C-IX-5 | Physical layout replaceable until frozen; the semantic query contract (typed keys, basis, cursor, coverage, completeness) is durable | [DERIVED INVARIANT — const., quoted verbatim in idx §0] | idx §0, §5 (page ABI as the durable surface); axis-7 arms swap physics under one ABI | GV-14 (ABI-level, arm-independent) | — | axis-7 verdict cannot change the ABI (bk §4.7) | COVERED |
| C-IX-6 | Adopted generic query outcomes (reverse membership/cited-by, digest lookup, author enumeration, revocation-aware counts, best-locator) remain costed gates; budget failure returns to James | [OWNER RULING — 2026-07-15 items A/B/C/D/E/13; 2026-08-12 obligation clause] | idx §3.4/§3.5/§6; idx §7 bounded selector with explicit winnerPresent and `(0,0)` no-winner; cont §10.3 richer client tier | GV-14 zero-score/no-winner; GV-16 | CV-DIGEST-LOOKUP; CV-LAST-LIVE-COUNT; WL-DEAD-LOCATOR; M-AGG | CF-14 → RETURN-TO-JAMES | COVERED at spec level; price is Stage B |
| C-IX-7 | Range, prefix, collation, full text, global ranking/analytics, arbitrary joins stay off-chain until a real workload proves one | [OWNER RULING — 2026-07-15 item 15] | idx §4.1 (grammar excludes them), §10 (rejected alternatives) | GV-14 (UNSUPPORTED member) | — | boundary; no mechanism to falsify | COVERED |

### 2.6 Lenses for contracts and people

| ID | Requirement | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-LN-1 | Lenses required: one graph, multiple explicit attributable reader trust policies | [OWNER RULING — 2026-08-12 "Smart-contract-usable Lenses remain a Core requirement"] | lens §3 (plans are authored admitted Records) | GV-13 | FX-LENS | CF-8 | COVERED |
| C-LN-2a | Bounded deterministic contract point-resolution profile with FOUND/ABSENT/CONFLICT/UNSUPPORTED/UNKNOWN | [DERIVED INVARIANT — const.] | lens §5–§7: indivisible `ResolvedTarget(targetKind,targetA,targetLeaf)`, combiners T1–T10, algorithm + Presence enum | GV-13 incl. non-alias vectors for two already-admitted OccurrenceRefs that share an EnvelopeId but differ by leaf | FX-LENS grid (V2-E2) | CF-8; AA-2 | COVERED |
| C-LN-2b | Separately benchmarked bounded-depth path profile may build on it | [PROPOSAL — deferral, lens §10] | lens §10 (resolvePath stub reserved) | — | — | — | DEFERRED(post-B0 lens round; stub pinned so it is not foreclosed) |
| C-LN-3a | Rich OS/Commons Lens compiles to an immutable Core-compatible Plan; Core never runs arbitrary policy code or unbounded social graphs on read | [DERIVED INVARIANT — const.] | lens §4 (plans admitted on the spine), §7 (zero external calls on read path) | GV-13 (gas-invariance member) | FX-LENS | CF-8; AA-2 | COVERED |
| C-LN-3b | The rich-lens → Plan compiler and its determinism corpus (R-L1) | [DERIVED INVARIANT — R-L1 register:200] | not built in B0 (flat plans; no import grammar) | GV-13 note; vf open item 5 | — | — | DEFERRED(client/lens-compiler lane — visibly parked, not dropped) |
| C-LN-4 | Risk-bearer selects/approves the Lens; a caller cannot choose the trust list that authorizes itself | [DERIVED INVARIANT — const. Lenses] | lens §8 (view/state ABI split, admin-written plan pin) | GV-13 (LENS-NEG-1 three-way negative) | FX-LENS adversarial | AA-3 | COVERED |
| C-LN-5a | Contract-visible Lenses are public | [DERIVED INVARIANT — const.] | lens §4 (plans = admitted spine Records, full-body state-readable) | GV-13 | FX-LENS | — | COVERED |
| C-LN-5b | Private personal trust policy stays local/encrypted (ZK profiles later research) | [DERIVED INVARIANT — const.; §12 item 8 of the register] | no Core mechanism (correctly — nothing forces personal policy on-chain) | — | — | — | DEFERRED(OS/client lens lane; constitution itself assigns it there) |

### 2.7 Honest reads and reconstruction

| ID | Requirement | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-HR-1 | Every enumeration hard-bounded; exposes Realm, policy/code basis, high-water, cursor, coverage, COMPLETE/PARTIAL/UNSUPPORTED/UNKNOWN; UNKNOWN never absence | [DERIVED INVARIANT — const.; R-L6 register:205] | idx §5 (PageResult + completeness rules); realm §4.2 (H-1); bind §6; hf §3.2 explicitly records realmId/realmBasis/basis/highWater/coverage/completeness/cursor plus canonical result digest | GV-14 (never-empty, one-basis, UNSUPPORTED members); vf §0.3 | every read row carries resultSchemaId/resultDigest, typedErrorCode, crossImplEqual, context fields, and exact N/A sentinels | CF-6 | COVERED |
| C-HR-2 | Canonical Type/Record/Occurrence/admission/index/current-fold bytes stay state-readable; never hash-only elision, event logs, or private DBs | [OWNER RULING — 2026-07-15 items 17 (full-body spine, "PAY IT") + 18 (no elision, "ETCH IT")] | enc §2.6 full Record-body spine; idx §2 preamble + §2.4 log/meta words (the two-slot admission log stores EnvelopeId + metadata, not bodies); enumerable AdmissionBatch intent-lane words plus point nonce getter; lens §4.1 | GV-17 (walk with logs disabled) | CV-RECON | CF-10 | COVERED |
| C-HR-3 | Second implementation reconstructs Types, Records, Occurrences, admissions, indexes, current folds from Realm state + byte carriers, no EFS service | [DERIVED INVARIANT — R-M2 register:146; const.] | realm §8 W-0..W-10 including W-4a + §8.2; batch walk reconstructs explicit nonce lanes; retained target commitment reconstructs record/type/principal while never inventing the never-admitted body/index/head | GV-17 (two independent client rebuilds = the acceptance trace) | CV-RECON after every fixture; CV-PREWITHDRAW/T4-MAX-BODY; FX-GIT.E walk-away | CF-10; RECON_1 (hard gate, both axis-1 arms) | COVERED |
| C-HR-4 | Early upgrades fix code/add capability but the interpretation of already-admitted data stays identifiable; evolution via versioned Types + successor/redirect evidence | [DERIVED INVARIANT — const.; V2-E5] | realm §7 (revision history, U-1..U-6, freeze U-6); enc §6 (successor/equivalence Records) | GV-12, GV-2 | FX-ARC.E, FX-GIT.D | CF-7, CF-12 | COVERED |

### 2.8 Files, bytes, and large content

| ID | Requirement | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-FB-1 | Locator/URL is a claim of where bytes may be, not content identity; one mutable URL → several immutable observations | [DERIVED INVARIANT — const.] | cont §3 (Locator/1 with optional observation group) | GV-16 | FX-50GB P1/P2 | KA-11 | COVERED |
| C-FB-2 | Exact identity only after exact representation/closure known; 50 GB paste need not block on whole-file hashing | [DERIVED INVARIANT — const. 50 GB trace] | cont §8.1 (publication ladder P0–P4, monotone accretion) | GV-16 | FX-50GB (P1 = the phone-paste headline row) | KA-11 | COVERED |
| C-FB-3 | Digests, sizes, media types, CIDs, manifests, provenance, rights, compatibility, availability are distinct facts; none forced into identity | [DERIVED INVARIANT — const.] | cont §2 (Type family split), §6 (RepresentationBinding), §10 (grades/observations) | GV-16 | FX-ARC 8/13–14/20–21 | GV-16 two-chunk-size non-convergence member | COVERED |
| C-FB-4 | Executable bytes verify before execution; chunk/Merkle closure verifies arbitrary ranges; partial/resume exposes verified coverage, never claims complete early | [DERIVED INVARIANT — const.; R-M4 register:148] | cont §5 (ChunkTree + proofs), §8.2 (acquisition machine), §8.3 (executable gate) | GV-16 (proof MUST-FAIL set) | FX-50GB (resume, hostile mirror), FX-ARC adversarial i/iii | KA-11; CF-9 | COVERED |
| C-FB-5 | Content identity independent of storage provider; Locators plural; shared-gateway ≠ independent custody | [DERIVED INVARIANT — const.; owner ruling item C for the selection view] | idx §7 owns B0 `B0_SELECT` (one declared score/latest mode, total-visit bound); cont §3/§10.1 owns evidence and deferred TS/RS `SELECT_PROFILE_V2` | GV-16 split suites | FX-ARC, FX-50GB; WL-DEAD-LOCATOR | GV-16 claimed-time + dead-spray members | COVERED |

### 2.9 Privacy, safety, and execution

| ID | Requirement | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-PS-1 | Public on-chain metadata is public; encryption never erases authorship/timing/graph/endpoint leakage | [OWNER RULING — 2026-07-15 item 12 privacy boundary ("on-chain = metadata-exposed, full stop")] | idx §0 (mandatory indexing makes this structural); prin §6.3; FX-PRIV.6 (index neutrality) | GV-15 | FX-PRIV | KA-10 | COVERED as honesty boundary |
| C-PS-2a | Public by default; sensitive/opted plaintext encrypted BEFORE signing or publication; contracts consume public values, never secrets | [OWNER RULING — 2026-07-10 public-by-default + 2026-07-15 item 14] | FX-PRIV.1 (plaintext-never-signed byte-scan) | GV-15; M-CONF | FX-PRIV | KA-10 | COVERED |
| C-PS-2b | The sensitivity-policy layer itself (class defaults, inheritance, "make private") | [OWNER RULING — 2026-07-10 named deliverable; "client/OS convention, NOT freeze-bound"] | out of Core by the ruling's own terms | — | — | — | DEFERRED(client/OS lane; V2-E6 adjacency) |
| C-PS-3 | Opaque/ciphertext bodies legal; private profiles use distinct domains and salted/ciphertext bodies — no plaintext-derived dictionary oracle | [DERIVED INVARIANT — enc §1.5 salt rule + CARRY-IN oracle checklist] | enc §1.5 (≥128-bit CSPRNG salts; public-input-derived salts REJECTED); EncryptedRecord/1 (hf §2.0.2) | GV-15 (incl. MUST-FAIL unsalted twin) | FX-PRIV.2 | KA-10 | COVERED |
| C-PS-4a | Encrypted-body profile seams: versioned encProfile, AEAD-transplant rejection vector, batch-linkage rejection | [DERIVED INVARIANT — R-P6 register:220; const.] | FX-PRIV.3/.4 (seam tests against the profile stub) | GV-15; M-CONF | FX-PRIV | KA-10 | COVERED as seam |
| C-PS-4b | The pinned AEAD/KEM construction, canonical associated-data transcript, key-role separation (sign/KEM/archive/scan/wrap/shred), KAT suite; signature-derived archive keys forbidden | [DERIVED INVARIANT — R-P6/R-P7 register:220–221; §12 item 9] | not pinned in B0 (deliberate — hf §2.7 scope note) | — | — | — | DEFERRED(Stage-B crypto round; hf open item 5 names it; R-P7's forbidden rule must be restated there) |
| C-PS-5 | Sensitivity defaults are explicit client policy; public and private material never share a signed batch/context that creates permanent linkage | [DERIVED INVARIANT — const.; R-P5/R-P8 half; CARRY-IN PC-11] | FX-PRIV.4 (SDK refuses mixed envelope; chain non-enforcement stated honestly) | GV-15; M-CONF | FX-PRIV | KA-10 | COVERED as client-conformance rule |
| C-PS-6 | Retrieval integrity never implies interest privacy; clients disclose who can observe object/query | [DERIVED INVARIANT — R-P9 register:222; const.] | FX-PRIV.5 (observer named in client result); FX-BROWSE (guest disclosure) | M-CONF | FX-PRIV, FX-BROWSE | KA-9 (client conformance side) | COVERED |
| C-PS-7 | Discovery/presentation metadata never authorize execution; untrusted app code gets no ambient signing/wallet/secrets/network/decrypt/write authority | [DERIVED INVARIANT — const.; R-O1/R-O2 lineage] | cont §8.3 (executable gate: request ≠ grant); FX-NANDA adversarial (capability-injection canary) | GV-16 (gate refusal at k=n−1) | FX-NANDA, FX-ARC iii | CF-9 | COVERED for the Core/read seam; the OS capability cage itself is V2-E6/OS scope (constitution assigns) |
| C-PS-8 | Permanent-public-data tools warn / may refuse obvious hazard classes at the client edge; Core stays neutral | [DERIVED INVARIANT — const. Privacy block] | cont §3 client policy MUST warn before publishing URI fragments/capabilities into permanent public Records; Core remains neutral | client-policy conformance assertion | FX-PRIV/publication UI seam | — | COVERED at B0/client-policy interface; UI implementation DEFERRED(V2-E6) |

### 2.10 Filesystem and application expressibility

| ID | Requirement | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| C-FS-1 | Same pinned resolved view projectable read-only on Linux/macOS/Windows: honest absence, stable handles, verified reads, portable names, bounded metadata | [OWNER RULING — 2026-07-22 mount requirement (adopted); R-O10 register:236] | hf §2.9 specifies only GoldenView/1 + canonical raw-name ResolvedManifest/1 input bytes; it explicitly excludes portable collision mapping, stable host handles, mounted-I/O semantics, and host adapters | M-CONF (raw-manifest byte identity ×2 impls ×3 langs) | FX-MOUNT | — | DEFERRED(mount lane; V2-F2 trace) — only the canonical raw-manifest input seam is specified here |
| C-FS-2 | Bounded public scalars → read-only xattrs/EAs; lossless paged control/API surface for the full graph/provenance/grades | [OWNER RULING — 2026-07-22 ("xattrs are not the canonical property model")] | the generic Core read ABI and raw ResolvedManifest are candidate inputs; hf §2.9 explicitly excludes xattr/EA projection and host control-surface transport | GV-14 (Core read input only) | FX-MOUNT | — | DEFERRED(mount lane) — xattr/EA mapping and the lossless host control/API surface are not specified as complete here |
| C-FS-3 | Generic Types/indexes express Arcade, Git/Markdown history, EAP, Nanda, comments/collaboration, anonymous browse, contract config, Topics, large-file Locators — zero app-specific Core contracts or private indexes | [DERIVED INVARIANT — const.; kickoff fixture rule] | hf §0 rule (fixture unable to express generically = reportable falsifier finding, never a corpus patch); all ten fixtures built from generic surface | all GV via fixtures | FX-ARC, FX-GIT, FX-EAP [PROVISIONAL], FX-NANDA, FX-TOPIC, FX-BROWSE, FX-LENS, FX-50GB | CF-9 (architecture-level) | COVERED |
| C-FS-4 | Git keeps native OIDs and SWHIDs where the standard applies; EFS adds repo identity, collaboration, placement, authority, availability, bounded queries — no renaming Git objects | [DERIVED INVARIANT — constitution Git bullet + native Git interoperability; the 2026-08-07 owner ruling protects forge expressibility, not this carrier mechanism] | FX-GIT application-profile `GitObject/1` exact BLOB/TREE/COMMIT/TAG preimages + nested complete `GitObjectClosure/1`; foreign algorithm-tagged OIDs never become EFS identity; SWHID v1 projection is SHA-1-only | GV-16; CV-GIT-STOCK; CV-CLOCK | FX-GIT | CF-9; FX-GIT adversarial iv/vi/vii | COVERED at specification/interface level; product Git surfaces are AT-9b |

---

## 3. Constitution — architecture-level acceptance tests

Source: system-constitution.md acceptance-test table, all 16 rows in order
(VERIFIED). These are trace-level; each is COVERED when its full trace is
specified and wired, DEFERRED when its executing lane is out of this pass.

| ID | Trace | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|
| AT-1 | Fresh qualifying L3: deploy Core + fixtures; clean self-hosted client opens Realm as guest, no Commons/account/wallet/OS/indexer | realm §2–§4; C-1..C-7 | GV-17 | FX-NANDA.E, FX-BROWSE | CF-2 | COVERED at Core/read level; the Web Client build is V2-E6 (see C-LY-2b) |
| AT-2 | Malformed body fails structural validation; bounded version-identified policy evaluates semantic/profile conformance without changing portable RecordId; receipt exposes basis | enc §2.7 STRUCT-EVM; cont §2.1 admitted-but-PROFILE_MALFORMED boundary, incl. ArtifactClosure STRING(255): empty structurally legal/profile-malformed and exact 298/4,770/27/16 bounds; realm §5.1–§5.5 | GV-1, GV-10, GV-12, GV-16 split structural/profile cases | corpus MUST-FAIL plus profile-ineligible members | KA-2 | COVERED |
| AT-3 | Precompute IDs offline; atomically publish related Records+Occurrences; idempotent retries; explicit races | realm §5.4/§5.5 point-in-order shadow + prewrite failure; intrinsic TypeSchemaGroup stages descriptors for later leaves; same-envelope RecordId REF DAG; current-envelope OCCREF rejected in staged and persisted-retry paths; auth §5.3; optional atomic router for cross-envelope occurrence-dependent composition; bind §3.3 sequential CAS; hf `MUST_FIT_ATOMIC` | GV-9, GV-10, GV-18 | CV-SPARSE-ADMIT; CV-SHADOW legal router/STAGED-TYPE-OCCREF/duplicate-external traces; FX-ARC phase C; FX-GIT races | ONECALL_5 over-cap fails, never splits; KA-1/KA-4 | COVERED |
| AT-4 | Delete all caches; second implementation reconstructs from Realm state + declared carriers | realm §8 | GV-17 (logs disabled) | CV-RECON; FX-GIT.E | CF-10; RECON_1 | COVERED |
| AT-5 | Type/scalar/backlink/set/Lens reads paginate at a pinned basis; truncation/missing coverage → PARTIAL/UNKNOWN, never empty | idx §5/§7; lens §7.2 | GV-14, GV-13 | read matrix; WL-SPRAY; WL-DEAD-LOCATOR (total visits + cursor) | CF-6 | COVERED |
| AT-6 | EOA + ERC-1271 writes preserve author/actor/payer separation; forged descriptor/header chains fail before witness verification; later account/Core upgrades never alter recorded basis | prin §3–§5; auth §4; realm §7; SR-13/SR-14 | GV-5, GV-6, GV-12 | CV-AUTHCHAIN, CV-RAIL, CV-7702 | CF-7; KA-5/6/7 | COVERED |
| AT-7 | Contract resolves one slot through 1/8/32/64-Principal plans in bounded gas; beneficiary-supplied plan cannot authorize the beneficiary | lens §7–§9 | GV-13 | FX-LENS grid + LENS-NEG-1 | CF-8; AA-3 | COVERED (gas rows are Stage B measurement by design) |
| AT-8a | Arcade generic Core/profile seam: Project, Release, exact closure, two locators, curator selection, evidence, tampered-primary rejection/fallback, and a specified unauthenticated no-ambient-authority launch boundary need no Arcade Core primitive | hf §2.1 phases A–G; `RuntimeRequest/1` is request not authority | GV-16 | FX-ARC (tampered primary, fake release, gate refusal, guest boundary) | CF-9; KA-11 | COVERED at specification/interface level |
| AT-8b | The self-hostable guest Arcade player, disposable runner, and capability cage execute the phase-G interface | not a Stage A artifact | — | FX-ARC.G supplies the future conformance script | — | DEFERRED(V2-E6 / Stage B client lane) |
| AT-9a | Git/Markdown data/profile seam: stable repo id, exact native BLOB/TREE/COMMIT/TAG bytes and OIDs, SHA-1-only SWHID v1, closure-before-advertise, stock clone/fetch conformance, replay-safe authored ref transaction, atomic multi-ref, wiki/collaboration history, and walk-away reconstruction — no Git Core primitive | hf §2.2 (`GitObject/1`, nested complete `GitObjectClosure/1`, `MUST_FIT_ATOMIC` ref unit); product surface excluded | GV-16; CV-GIT-STOCK; CV-CLOCK; CV-RECON | FX-GIT | CF-9, CF-13 | COVERED at specification/interface level; execution is Stage B |
| AT-9b | Production stock-push/intake gateway, guest file/commit/diff UI, opted-in EFS workspace UX, and general import/export workflows | not a Stage A or Core artifact; data interop seam is AT-9a | — | FX-GIT explicitly names the boundary | — | DEFERRED(V2-E6 / Git client-profile lane) |
| AT-10 | EAP: definitions/awards/lifecycle/local gate generic; hostile subject spam cannot unbound the authoritative point check | hf §2.3 (issuer-Binding O(1) gate design) | GV-18 | FX-EAP + WL-SPRAY (2,000-spam assertion, gate gas ±1 SLOAD) | CF-9 | COVERED **[PROVISIONAL — PM directive: excluded from adopt/kill until the durable Codex brief lands; hf FR-6]** |
| AT-11 | Nanda: provider/service/skill, plural catalogs, yanking, guest inspection; discovery never grants execution | hf §2.4 | GV-16 gate member | FX-NANDA | CF-9 | COVERED |
| AT-12 | 50 GB Locator before hashing; additive closure; partial/resume, funding/durability grades, gateway fallback, range proof; unverified executables never run | cont §8; hf §2.8 | GV-16 | FX-50GB | KA-11 | COVERED |
| AT-13 | Same portable Record (+source Occurrence) copied into two Realms; admissions/bindings differ; clients show source vs destination authority, never invented global state | realm §4.2; auth §8 | GV-7, GV-17 | CV-XREALM | KA-8; V3_COPY (hard gate) | COVERED |
| AT-14 | One golden pinned view through shell + GUI on three hosts, portable names, stable handles, verified ranges, visible UNKNOWN, bounded xattrs, lossless control surface, mutations fail | hf §2.9 supplies only the canonical raw-manifest input seam; portable names/collisions, handles, mounted-I/O verification, xattrs/control surface, read-only enforcement, host adapters, and execution are excluded | M-CONF raw-manifest byte identity only | FX-MOUNT | — | DEFERRED(mount lane — the complete three-host interface and execution remain open) |
| AT-15 | Web Files and OS Files produce the same canonical resolved manifest for same Realm/policy/basis | hf §2.9 specifies the canonical raw-manifest equality input, not either product package | M-CONF ×2 manifest implementations ×3 languages | FX-MOUNT | — | COVERED at raw-manifest specification level; Web/OS product implementations DEFERRED(V2-E6) |
| AT-16 | Privacy fixture: encrypt-before-sign, indexes reveal only accepted metadata, no cross-profile oracle for equal low-entropy plaintext; key-role misuse, AEAD transplant, batch linkage, observer disclosure all tested | hf §2.7; enc §1.5 | GV-15 | FX-PRIV | KA-10 | COVERED at seam level; constructions DEFERRED per C-PS-4b (key-role misuse vectors bind when the profile pins) |

## 4. Constitution — not-frozen list, freeze discipline, open questions

**Deliberately-not-frozen list (10 items, VERIFIED against the constitution).**
Cross-check that Stage A froze none of them: EAS carrier (adapter seam only —
enc §9, realm §8.3, prin §9; loss-map deferred V2-E8 per PM directive); exact
Record/Occurrence/Envelope/receipt/binding/withdrawal bytes (B0 pins are labeled
bakeoff arms, vf §4 "no expectation bytes"); the name `TypeRevision` (renamed
TypeSchema, a working name); Principal/KEL formula (reserved seam, prin §6);
Lens grammar/limits (B0 profile + open cap constants, lens §3.4 PROPOSAL);
hash suite/codec/URI spelling (enc §7 migration seam; MC/1 is the B0 arm);
physical index layout/ordinal width (axis 7 + RP-4 open); Commons chain
(untouched, V2-E7); Web-vs-OS packaging (untouched, V2-E6); application Types
(fixture-pack schemas are corpus content, NOT protocol — hf FR-4). **Result:
zero violations found.** [VERIFIED by this lane against the eleven chapters.]

**Freeze discipline (5 steps).** Step 1 (smallest encoding/domain/identity rules
+ 3-language vectors) = enc + GV-1..4, Stage B minting; step 2 (Record-vs-Envelope
prototype) = bk axes 1/5 cells; step 3 (minimal Core + mandatory indexes; EAS
optional adapter) = B0 + idx + enc §9 seam; step 4 (this Fable pass + independent
review) = in progress, red team next; step 5 (freeze only after ambiguity
resolved/versioned) = V2-F1, out of Stage A. All five traceable; none skipped.

**Constitution open questions (10)** map onto: PrincipalId-vs-tagged → axis 2
(V2-E1); smallest contract Lens → lens + V2-E2; safe Type/index declarations →
idx §4/§8 + V2-E4; Type identity scope → axis 4; Occurrence portability → axis 3;
normalization bakeoff → axes 1/5; Realm descriptor → realm §2 (V2-E5); query
promises vs budget → CF-14 (V2-E4); Commons process → V2-E7 (out of scope);
Web Client scope → V2-E6 (out of scope). No constitution question is unowned.

---

## 5. Owner rulings with engineering content

Every adopted ruling in owner-rulings.md that binds engineering, in ledger
order. (Process/sequencing entries with no engineering content — the 2026-07-16
course-correction note, the 2026-07-23 decision-routing note — are omitted as
rows but were read.) The 2026-08-12 reset governs: mechanism-level rulings are
evidence unless re-earned; requirement-level content survives. Labels below are
[OWNER RULING] unless the greenfield reset demoted the mechanism, noted inline.

| ID | Ruling (date, item) | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|
| OR-1 | Historical chains-don't-die ruling: drop broad dead-chain machinery; keep cross-Realm reach + pruning insurance (2026-07-10) | realm §4 carries qualifying-Realm assumptions, honest `UNAVAILABLE_SOURCE_BASIS`, no broad survival machinery, and the separately motivated pruning/reach seams. Applying the historical assumption independently to every qualifying Realm is A2's unadopted proposal, not part of this owner ruling; B0 behaves honestly under either later scope answer | GV-17 | — | AA-4 | COVERED for the historical DROP/KEEP ruling; A2 remains unadopted and does not block Stage B |
| OR-2 | KEL: design it; bare-EOA day-one; adversarial track before freeze (2026-07-10; mechanism reopened 2026-08-12) | prin §6 seam + §2.2 append-only kinds; day-one = AccountPrincipal/1 | GV-12 GRAD-SEAM slot | — | AA-6/AA-7 | DEFERRED(future succession/KEL round with its own owner review — vf open item 8); the graduation seam itself COVERED now (C-AA-4) |
| OR-3 | Lens scale concern: ~50+ attesters normal; MAX_LENSES=20 conflict; lens-object canonical encoding needed (2026-07-10) | Plan encoding = lens §3.2; Core cap/grid = 64 and 1/8/32/64; separate TS/RS client grid = 50/100/256 on mobile+desktop (hf §2.5) | GV-13 | FX-LENS two grids | — | COVERED at Stage-A interface level; execution is Stage B |
| OR-4 | Public by default + named sensitivity-policy layer; client/OS convention, not freeze-bound (2026-07-10) | invariant half in FX-PRIV.1; layer itself out of Core by the ruling's own terms | GV-15 | FX-PRIV | KA-10 | Invariant COVERED; layer DEFERRED(client/OS lane — see C-PS-2b) |
| OR-5 | Storage direction: on-chain + Arweave now; durability tiering on-chain > Arweave > grant-pinned > volunteer (2026-07-10) | cont §10.1 (DurabilityGrade custody classes mirror the tiering), §11 (venue byte-store seam); no venue frozen | GV-16 | FX-50GB (FUNDED_PINNED vs BEST_EFFORT) | — | COVERED as evidence vocabulary; venue/economics DEFERRED(A-5/E-6 validation, ops lane) |
| OR-A | Backlinks incl. predicate-typed: ON-CHAIN, indexed (2026-07-15 A) | idx §3.5 (general + predicate backlink families; postings carry the predicate — the v1 no-definitionId defect named in idx §0 is the kill evidence) | GV-14 | FX-ARC/FX-TOPIC backlink reads | CF-14 aggregate | COVERED |
| OR-B | Reverse membership + cited-by: ON-CHAIN (2026-07-15 B) | idx §3.5 | GV-14 | FX-NANDA catalogs; FX-TOPIC | CF-14 | COVERED |
| OR-C | Best-mirror ranking ON-CHAIN, zero new state beyond declared evidence (2026-07-15 C) | idx §7 `B0_SELECT` is the bounded on-chain single-score/latest selector; cont §10.3's richer evidence fold is `SELECT_PROFILE_V2`, client-tier/deferred | GV-16 split suites | FX-ARC/FX-50GB B0 rows; WL-DEAD-LOCATOR | CF-14 | COVERED |
| OR-D | Self-enumeration: PENDING then adopted as acceptance obligation ("authored-data enumeration", 2026-08-12) | idx §3.4 (Occurrences-by-Principal family) | GV-14 | M-PAGE author enumeration under WL-CHURN (10-year author) | CF-14 | COVERED |
| OR-E | Live counts revocation-aware — PAY for it; not advisory (2026-07-15 E) | idx §6 (counter design, spray analysis, per-write cost) | GV-14 (counts-vs-fold agreement) | FX-EAP, WL-SPRAY (K_REVOKE_FRACT) | CF-14 | COVERED |
| OR-F | Equivocation: sign the limitation; NO kernel collision bit [REJECTED — TOCTOU-defeated]; closed author sets or challenge windows (2026-07-15 F) | bind §5; lens §11; auth §2.4 table + §8 replay/domain rows — the RULINGS-lane SERIOUS "item-F silent drop" is closed | GV-13 (window triple), GV-18 (CAS visibility) | FX-LENS adversarial | AA-1 | COVERED |
| OR-G | `act` delegation: authorization reads bounded grant ABI, never inferred from permissionless labels (2026-07-15 G, KEL-downstream) | no `act` primitive exists in B0 (nothing to misuse); grant ABI = managed-Principal seam | — | — | AA-6 | DEFERRED(KEL round; prin §6.2 G-invariants must carry the labels-never-authorize rule) |
| OR-12a | MANDATORY automatic indexing; EAS opt-in REJECTED bundle-wide; client-only = the sole opt-out (2026-07-15 item 12) | idx §0 (verbatim carriage incl. the [REJECTED] classification) | GV-2/GV-14 | all | CF-6; AA-5 | COVERED |
| OR-12b | Schema/type-list enumeration: records-by-Type on-chain (ruled); a paginated ALL-TypeSchemas index = "James's call", still unanswered | records-by-Type = idx §3.3; getTypeSchema point read = idx §3.1; a paginated all-schemas enumeration is not in the B0 index list | GV-14 | — | — | Ruled half COVERED; the all-schemas index remains an open owner call → carried to the synthesizer packet (not a design gap: cheap additive family; disposition in §7 G-6) |
| OR-13 | contentHash → file keyed lookup ON-CHAIN; global dedup sweep off-chain (2026-07-15) | idx §3.5 (lookupByDigest family); cont §1 | GV-14, GV-16 | FX-ARC/FX-50GB digest lookups | CF-14 | COVERED |
| OR-14 | Contracts operate on PUBLIC data; on-chain decryption impossible; keyWrap recipient sets off-chain (2026-07-15) | boundary honored: no key material in any B0 state; EncryptedRecord/1 opaque; lens reads public heads only | GV-15 | FX-PRIV | KA-10 | COVERED |
| OR-15 | Ranked/full-text/aggregate search off-chain (2026-07-15) | idx §4.1/§10 | GV-14 UNSUPPORTED | — | — | COVERED |
| OR-16 | "If a contract can't read it in bounded gas, it's off-chain"; file BYTES = DA-tier, honestly graded; contracts read metadata (2026-07-15) | idx §0 THE LINE (the definition, operationalized); cont §11 (byte custody graded, never contract-read) | GV-14, GV-16 | FX-50GB grades | CF-5 | COVERED |
| OR-17 | Full-body spine — PAY IT (2026-07-15) | enc §2.6 owns state-readable Record bodies; idx §2 preamble + §2.4 own the separate two-word admission log/meta layout | GV-17 | CV-RECON | CF-10 | COVERED |
| OR-18 | No body-elision — ETCH IT (record bodies, not file bytes) (2026-07-15) | enc §2.6 [OWNER RULING constant]; lens §4.1 (plans full-body) | GV-17 (walk needs zero logs) | CV-RECON | CF-10 | COVERED |
| OR-P | Persona model: one-root mainstream recovery default; unlinkable personas opt-in; true isolation = separate roots (2026-07-15/16; mechanism reopened) | prin §6.3 (unlinkable-persona probe against the graduation seam; reconciles with OR-12a metadata boundary) | — | — | AA-6 | DEFERRED(KEL round, same home as OR-2); the §6.3 probe COVERED now |
| OR-R | Passkey-sync mainstream recovery + independent cold factor; lone synced passkey REJECTED as sole root (2026-07-16) | KEL-round composition question; no B0 surface | — | — | — | DEFERRED(KEL round — recovery composition is convention, not Etched, per the ruling itself) |
| OR-M | Three-host read-only mount REQUIRED; FUSE = adapter not canonical API; xattrs bounded; Plan 9 precedent only (2026-07-22) | see C-FS-1/C-FS-2; only the canonical raw-manifest input seam is specified now | M-CONF raw-manifest equality | FX-MOUNT | — | DEFERRED(mount lane) — host projection/interface semantics and execution are not closed by Stage A |
| OR-X | 2026-07-23 corrections: cross-chain bridges/hubs/locators UNDECIDED (research stop rule, not prohibition); not-every-chain is NOT a requirement | B0 builds no bridge/hub; cross-Realm = copy + destination grading (realm §4.2) — the undecided space is left genuinely open | GV-7 | CV-XREALM | — | COVERED (boundary honored, nothing foreclosed) |
| OR-G2 | GitHub-class collaboration stays expressible; freeze work must keep showing forge objects expressible; fixtures carry forge objects (2026-08-07) | FX-GIT collaboration cluster (Issue/PR/Review/Reaction/Team/Edit history, all clonable) | CV-RECON (collab data rebuilt with the code) | FX-GIT.C/.E | CF-9 | COVERED |
| OR-B1 | 2026-08-12 greenfield boundary: one successor; evidence-not-baseline; label discipline | every chapter's header + label key; this table | — | — | — | COVERED (process, observable in the artifacts) |
| OR-B2 | 2026-08-12 acceptance obligations: shared Types/validation, automatic queryability, backlinks/reverse membership, revocation-aware counts, digest lookup, authored-data enumeration, full state-readable bodies, bounded contract reads — droppable only by James after the aggregate cost pass | idx §0 acceptance rule names exactly this clause; the ONE-bundle snapshot prices them together | GV-14/16/17 | M-AGG (hf §3.5) | CF-14 → RETURN-TO-JAMES | COVERED |
| OR-B3 | Core/Commons/clients boundary; fresh-L3 standalone; no global home chain revived | realm §2/§4; C-LY-1..4 | GV-17 | FX-NANDA.E | CF-2 | COVERED |
| OR-B4 | No Commons home chain selected; CROPS review precedes any candidate; Core does not wait | Core-independence realized (nothing venue-bound; RealmProfile parameterized hf §3.3) | — | — | — | Core half COVERED; venue matrix DEFERRED(V2-E7, explicitly out of this pass) |
| OR-B5 | Contract-usable Lenses = Core requirement; grammar/limits are engineering questions | lens chapter entire | GV-13 | FX-LENS | CF-8 | COVERED |
| OR-B6 | Type creators choose bounded fields/index modes; Realm admission makes indexing automatic; A-vs-B identity placement = 50-year bakeoff question, not ruled | idx §4 grammar; axis 4 (bk §4.4) keeps the identity-placement question open exactly as ruled | GV-2 | FX-ARC.E | AA-5; GATE_4 | COVERED |
| OR-B7 | Direct guest File Browser path required; "guest" = unauthenticated, not anonymous | C-LY-2a/2b; FX-BROWSE guest-disclosure honesty | GV-17 | FX-NANDA.E, FX-BROWSE | CF-2 | COVERED at Core level (client build V2-E6) |
| OR-B8 | Open-not-ruled: PrincipalId API everywhere; Web/OS packaging; Commons details; all candidate primitives/bytes | bakeoff report protocol (bk §8: survives/rejected/fork-to-James; silence never adopts) | — | — | — | COVERED (process) |

---

## 6. Intake-audit SURVIVORS rows

Every R/A/E/O/D row and section finding the SURVIVORS lane flagged (VERIFIED
against audit-lanes.json and re-checked against the register's own text at the
cited lines). Rows the lane certified as well-carried are included so the
mapping is affirmative, not just defect-driven — per that lane's own
recommendation that this table "affirm these clusters … rather than re-arguing
them".

### 6.1 Certified-carried clusters (SURVIVORS finding 0)

| ID | Register row | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| S-RD1 | R-D1 signed semantics + logical IDs stable across venue copies (:155) | [DERIVED INVARIANT] | enc §4; auth §2.3 | GV-3, GV-7 | CV-XREALM | CF-3 | COVERED |
| S-RD2 | R-D2 full bytes32 principal everywhere (:156) | [DERIVED INVARIANT] | = C-AA-6 | GV-3 PID-LOW160 | CV-PID160 | by-construction category fail | COVERED |
| S-RD3 | R-D3 bodies/reconstruction state-readable, not log-only (:157) | [OWNER RULING — items 17/18 lineage] | = C-HR-2 | GV-17 | CV-RECON | CF-10 | COVERED |
| S-RD5 | R-D5 limits fail explicitly/deterministically; nothing silently truncates (:159) | [DERIVED INVARIANT] | enc §2.6/§2.7 typed errors; idx §5.2 (clamped maxItems never reverts, truncation labeled); every chapter's closed error table | GV-1, GV-14 | corpus MUST-FAIL members | CF-5 | COVERED |
| S-RD6 | R-D6 unknown kinds/suites/profiles fail closed (:160) | [DERIVED INVARIANT] | enc §2 (unknown metaCodecVersion), prin §3.3 (unknown witness kinds), realm §3 C-4 (UNSUPPORTED_PROFILE, no best-effort decode) | GV-1/2/5/17 | — | KA-2 | COVERED |
| S-RD7 | R-D7 identity independent of arrival order/carrier/relayer/replication (:161) | [DERIVED INVARIANT] | = C-UI-2 | GV-3/6/7 | CV-RAIL/CV-XREALM | KA-8 | COVERED |
| S-RD8 | R-D8 authority never from msg.sender/relayer/paymaster/rail; one exact actor witness (:162; EIP-8130 note :165) | [DERIVED INVARIANT] | auth §9 (the invariant section); prin §8 (EIP-8130 falsifier probe: native tx context can never satisfy it) | GV-6 (closed the kickoff's verified omission) | CV-RAIL | vf §3.5 note: GV-6 exists BECAUSE the audit added it | COVERED |
| S-RD9 | R-D9 order ≠ nonce/chronology; claimedAt testimony; admittedAt venue-relative (:163) + §12.7 same-(principal,order) rule REMOVED (:533) | [DERIVED INVARIANT — includes retired §12.7 rule] | auth §2.6 (pubNonce semantics honor the rejected §12.7 rule's removal — multiplicity legal); cont §10.3 (ordinal-ordered folds); realm §5.3 | GV-11 (closed the kickoff's verified omission); CV-CLOCK | FX-GIT commit timestamps; FX-50GB horizonClaim | vf §3.5 | COVERED |
| S-RM2 | R-M2 independent reconstruction without hosted indexer (:146) | [DERIVED INVARIANT — adopted direction] | = C-HR-3 | GV-17 | CV-RECON | CF-10, RECON_1 | COVERED |
| S-RM4 | R-M4 carrier failure never changes authorship/content identity (:148) | [DERIVED INVARIANT] | cont §8.2 (MISMATCH indicts the locator, never the content) | GV-16 | FX-ARC i (tampered primary → verified fallback), FX-50GB hostile mirror | KA-11 | COVERED |
| S-RK3 | R-K3/R-K4 revoked actor cannot backdate strongest-grade records; strongest grade binds to external canonical order (:170–171) | [DERIVED INVARIANT — load-bearing per register] | auth §4.3 (admission-time validation); realm §5.3 (ordinal = the canonical order); prin §3.5 (basis stamped at admission) | GV-12 (backdating probe) | — | KA-5 | COVERED |
| S-RK7 | R-K7 authority transitions prospective; past evidence never rewritten (:176) | [DERIVED INVARIANT] | prin §6.2 (G-invariants); GV-12 U-rules | GV-12 | CV-7702 | CF-7 | COVERED |
| S-RK9 | R-K9 gates never treat signature-only/stale foreign evidence as current authority (:178) | [DERIVED INVARIANT — required safety invariant] | lens §7.2 (grade axis), §8 (FOUND-only gate masks), §11 (challenge window); realm §4.2 H-2/H-4 | GV-13 (strict masks, off-chain grading members) | FX-LENS | AA-1; KA-9 | COVERED |
| S-RK11 | R-K11 two domains never both claim unqualified CURRENT for one principal (:181) | [DERIVED INVARIANT] | realm §4.2; FX-NANDA.D two-catalog display rule | GV-7, GV-17 | CV-XREALM | AA-7 (the R-K11 check is its sketch detection) | COVERED |
| S-RL5 | R-L5 exact point queries + bounded candidate enumeration from state for the adopted list (:204) + D-9 "works on-chain" definition (:461–463) | [OWNER RULING — item 16; D-9 supplies derived interpretation] | idx §3/§5; D-9's recommended reading is exactly idx §0 THE LINE | GV-14 | read matrix | CF-14 | COVERED |
| S-RL6 | R-L6 absence/completeness name venue and basis; omission ≠ absence (:205) | [DERIVED INVARIANT] | idx §5.2; bind §6 (four sources); realm §4.2 | GV-14, GV-18 | — | CF-6 | COVERED |
| S-RX2 | R-X2/R-X3 evidence-vs-snapshot-vs-current distinguishable; every result names domain/basis/proof/freshness (:189–190) | [DERIVED INVARIANT] | realm §4.2 (BasisGrade); lens §7.2 (BasisReport); vf §0.3 (two-axis rule on every vector) | GV-13/14/17 members with axis-flip assertions | CV-XREALM | KA-9 | COVERED — final grade-name mapping to the register's five §10 grades = vf open item 6 (see S-G10) |
| S-RX4 | R-X4 foreign local storage never silently a second authority history (:191) | [DERIVED INVARIANT] | realm §4.2 (UNAVAILABLE wording: MUST NOT promote local copy) | GV-17 H-wording assertions | CV-XREALM | KA-8 | COVERED |
| S-RP1 | R-P1 sensitive plaintext encrypted before signing/publication (:214) | [DERIVED INVARIANT — adopted direction] | FX-PRIV.1 | GV-15 | FX-PRIV | KA-10 | COVERED |
| S-RP5 | R-P5 personas not co-batched/linked by operational defaults (:218) | [DERIVED INVARIANT] | FX-PRIV.4 (batch linkage); prin §6.3 (persona probe) | GV-15 | FX-PRIV | KA-10 | COVERED at seam |
| S-RP6 | R-P6 canonical AD, deterministic parsing, transplant resistance, KATs (:220) | [DERIVED INVARIANT] | = C-PS-4a/4b split | GV-15 | FX-PRIV.3 | KA-10 | Seam COVERED; construction+KATs DEFERRED(Stage-B crypto) |
| S-RP7 | R-P7 key-role separation; signature-derived archive roots forbidden (:221) | [DERIVED INVARIANT — required safety invariant] | named only via the C-PS-4b deferral | — | — | — | DEFERRED(Stage-B crypto round — the forbidden-rule must be restated verbatim there; flagged so it cannot soften) |
| S-RP9 | R-P9 integrity ≠ interest privacy; observer modes disclosed (:222) | [DERIVED INVARIANT] | = C-PS-6 | M-CONF | FX-PRIV.5, FX-BROWSE | KA-9 | COVERED |
| S-RO10 | R-O10 three-host mount adopted (:236) | [OWNER RULING — 2026-07-22] | = C-FS-1 | M-CONF | FX-MOUNT | — | DEFERRED(mount lane) — seam COVERED now (= C-FS-1) |

### 6.2 Flagged absences and their Stage A disposition (SURVIVORS findings 1–8)

| ID | Register row / finding | Label | B0 realization | Vector | Fixture | Falsifier | Status |
|---|---|---|---|---|---|---|---|
| S-SUCC | Finding 1 (SERIOUS): succession cluster R-K10 (:180), R-K12 (:182), R-M3 (:147), O-3 (:273), D-7 (:449–453) — suite renewal, single-active-kernel, cryptographic-renewal drills | [DERIVED INVARIANT — the cluster's rows] | Closed as **named reserved seams**: AA-6 ("old suite forgeable") + AA-7 ("two kernels admit") with full seam inventory (prin §2.2 append-only kinds, §3.1 verifier versioning, AuthorityBasis as frozen interpretation key, enc §7 hash-migration playbook, reserved witness kinds, realm U-3 breaking=new-RealmId + no-successor-pointer [the mutable-admin surface refused], R-K11 two-truth display) | GV-3 migration member (structural half); succession vector classes = vf open item 8, a named FREEZE gate | successor-evidence sketch fixture (AA-7) | AA-6, AA-7 (RESERVED-SEAM); prin §8 EIP-8130 probe = standing drill | DEFERRED(future succession design round with its own owner review; freeze-blocking, per vf §4 item 9 — the finding's demanded disposition, satisfied) |
| S-RL4a | Finding 2 (SERIOUS): lens scale — Core resolution at scale (R-L4 :203, A-7 :250, D-10 :466) | [OWNER RULING — 50+ concern 2026-07-10; 256 = measured unknown] | lens §3.4 Core cap 64; FX-LENS exact `N={1,8,32,64}` Core grid | GV-13 | FX-LENS Core grid | — | COVERED for Core at Stage-A interface level |
| S-RL4b | Same finding: client-side 50/100/256 mobile/desktop benchmarks (§15:595 demand) | [DERIVED INVARIANT — register acceptance evidence] | hf §2.5/§3.2 specifies distinct TS/RS `N={50,100,256}` grid on pinned mobile/desktop profiles with wall, peak memory, RPC/page counts, resultDigest/crossImplEqual, UNKNOWN/PARTIAL, and basis/high-water/coverage; no on-chain 100/256 Plan | M-CLIENT | FX-LENS client grid | — | COVERED at Stage-A interface level; execution remains Stage B |
| S-RD9F | Finding 3 (SERIOUS): R-D9 time/order vectors + §12.7 equivocation-removal carriage | [DERIVED INVARIANT — includes rejected §12.7 import] | = S-RD9: GV-11 + CV-CLOCK exist specifically to close this; the imported §12.7 rule remains rejected | GV-11 | CV-CLOCK | — | COVERED (finding satisfied) |
| S-G10 | Finding 4: §10 authorization/freshness grade axis (:378–392) must not compress into presence vocabulary | [DERIVED INVARIANT — "never compress to a Boolean valid"] | vf §0.3 (two-axis rule, with axis-flip members); realm §4.2 BasisGrade; lens §7.2 BasisReport | every GV-13/14/17/18 member asserts both axes | — | — | COVERED structurally; the exact five-grade name mapping (PORTABLE-EVIDENCE/AUTHORITY-ADMITTED/SNAPSHOT@H/CURRENT@H/FOREIGN-LOCAL) onto the SDK result model = vf open item 6, owner: SDK/result-model chapter + synthesizer |
| S-RL1 | Finding 5: R-L1 (:200) / R-L3 (:202) plan determinism + adversarial corpus | [DERIVED INVARIANT] | GV-13 (byte-determinism ×3 languages; rejection-code corpus 1–13; combiner corpus); B0 has no import grammar, so cycle/diamond members attach to the client compiler | GV-13 | FX-LENS malformed-plan set | CF-8 | COVERED for B0's flat plans; compiler corpus DEFERRED(client/lens-compiler lane — vf open item 5, = C-LN-3b) |
| S-RD8F | Finding 6: R-D8 relayer/paymaster substitution vectors missing from kickoff | [DERIVED INVARIANT] | = S-RD8; GV-6 minted for exactly this | GV-6 | CV-RAIL | — | COVERED (finding satisfied) |
| S-RK6 | Finding 7: R-K6 (:175) recovery cannot silently seize funds or decrypt merely by recovering identity | [DERIVED INVARIANT — required safety boundary] | **absent** — prin §6.2's G-invariant list does not carry the identity/funds/encryption separation; §12 item 9's same rule also unstated | — | — | — | GAP → §7 G-2 |
| S-RP3 | Finding 7: R-P3 (:216) recoverable vs shreddable tiers; R-P8 (:222) KEM generations/rotation/rewrap lifecycle; D-16 (:503–509) | [DERIVED INVARIANT — DI-9; related launch language remains proposed] | **absent** — FX-PRIV's scope note covers constructions but names no tier split or KEM lifecycle seam; no launch adoption is implied | — | — | — | GAP → §7 G-3 |
| S-RX5 | Finding 7: R-X5 (:192) foreign contract uses remote authority only via explicit adapter or local commitment; R-X7 (:194) local-commitment profile discloses updater/auth/monotonicity/lag/expiry/trust class | [DERIVED INVARIANT — physical boundary / required invariant] | **absent** — realm §8.3/enc §9 specify only the EAS adapter seam; no foreign-contract adapter or local-commitment profile seam is named | — | — | — | GAP → §7 G-4 |
| S-RO8 | Finding 7: R-O8 (:234) pending/outbox state never masquerades as confirmed (SDK truth boundary) | [DERIVED INVARIANT — required truth boundary] | **absent** — no chapter states an outbox/pending display rule; SR-15's idempotent retry semantics do not define SDK outbox presentation | — | — | — | GAP → §7 G-5 |
| S-E2 | Finding 7: E-2 (:261) inclusion despite censoring relayers/sponsors | [DERIVED INVARIANT — external assumption] | deferred with the venue by the register's own terms; GV-6 proves rail-substitutability (any rail CAN carry), which is the Core-side floor; inclusion guarantees are venue properties | GV-6 (floor only) | — | — | DEFERRED(V2-E7 venue matrix — force-inclusion column already named in that gate's text) |
| S-D2D5 | Finding 8: §9/§17 fixed-authority-domain hypothesis vs the Realm frame; D-2/D-5 disposition unverified by the audit | [REJECTED as target architecture — superseded; kept as comparison evidence] | **Confirmed by this lane against owner-rulings.md 2026-08-12 (exact text read):** "'Fresh L3' means a qualifying EVM Realm can stand alone; it does not promise prebuilt support for every chain or revive a global home chain" + no-Commons-venue. §17's fixed domain is thereby a superseded comparison baseline, not the target. Honesty note: this is disposition **by supersession**; no explicit D-2/D-5 answer is recorded in the ledger, so R-K11 remains a live check on the Realm design (carried: AA-7, CV-XREALM) rather than a settled premise — exactly the audit's fallback demand | GV-7/17 | CV-XREALM | AA-7 | COVERED (verification the audit requested, performed here) |

---

## 7. GAP and resolution register

| # | Gap | Disposition proposal (one line each) |
|---|---|---|
| G-1 | **RESOLVED** — the former C-PS-8 false gap claimed no client-edge hazard rule | cont §3 already requires warning before URI fragments/capabilities enter permanent public Records. C-PS-8 now marks that interface COVERED; actual UI tooling remains V2-E6. Excluded from active GAP count. |
| G-2 | R-K6 identity/funds/encryption recovery separation absent from the graduation seam | One-sentence synthesizer edit: append to prin §6.2's G-invariant list "G9: graduation/recovery of identity never implicitly transfers funds custody or decryption capability (R-K6); the three roots stay separable" — cost ≈ 1 line, keeps the seam honest before any managed-Principal round starts. [PROPOSAL] |
| G-3 | R-P3/R-P8/D-16 recoverable-vs-shreddable tiers + KEM lifecycle unnamed in the privacy seams | Extend hf §2.7's scope note: the encProfile stub must reserve a tier byte (RECOVERABLE vs SHREDDABLE) and name KEM-generation/rewrap as Stage-B crypto deliverables; carried as a named reserved seam so the crypto round inherits it explicitly. [PROPOSAL] |
| G-4 | R-X5/R-X7 foreign-contract adapter + local-commitment disclosure profile unnamed | Add to realm's seam list (beside §8.3's EAS seam): "foreign-consumer adapter seam — a non-Realm contract consumes EFS state only via an explicit adapter or a local commitment whose profile names updater, auth source, monotonicity, lag, expiry, trust class (R-X7 fields)"; interface stub only, no B0 build; home: realm chapter open items + V2-E8-adjacent adapter work. [PROPOSAL] |
| G-5 | R-O8 outbox/pending truth boundary unowned | Assign to the SDK/result-model chapter that vf open item 6 already presupposes: one conformance rule ("pending/outbox rows render only with an explicit UNCONFIRMED grade; no read API returns them as admitted") + one GV-9-adjacent SDK vector; home: SDK lane. [PROPOSAL] |
| G-6 | OR-12b all-TypeSchemas paginated enumeration — owner call never answered, not in the B0 index list | Carry as a one-line question in the synthesizer's James packet (it is additive, cheap, and non-blocking: the schema-Record spine already stores admitted groups; an enumeration family can be added without RecordId impact under Variant A admission) — do NOT silently add or drop it. [PROPOSAL] |
| G-7 | (Near-gap, recorded for honesty) AT-16's "key-role misuse" sub-clause has no vector until the C-PS-4b crypto round lands | Already implied by C-PS-4b's deferral; listed so the acceptance-test row cannot be read as fully covered; home: Stage-B crypto round. [PROPOSAL] |

No other active GAP was found: every other constitutional bullet, acceptance trace,
engineering-content ruling, and audit-flagged row lands as COVERED or DEFERRED
with a named home in §§1–6.

---

## 8. Coverage summary

Counts over §§1–6, tallied by the §0.1 counting rule (first status token per
row; each a/b sub-row counted separately; the §4 checklists are prose
cross-checks, not rows):

| Row family | Rows | COVERED | DEFERRED (named home) | GAP |
|---|---|---|---|---|
| §1 Layer obligations (C-LY, incl. a/b split) | 5 | 4 | 1 (C-LY-2b → V2-E6) | 0 |
| §2 Constitution bullets (C-UI 5, C-TD 5, C-AA 6, C-TX 4, C-IX 7, C-LN 8, C-HR 4, C-FB 5, C-PS 10, C-FS 4) | 58 | 51 | 7 (C-LN-2b/3b/5b, C-PS-2b/4b, C-FS-1/2) | 0 |
| §3 Acceptance traces (AT-1..16, with AT-8a/b and AT-9a/b split) | 18 | 15 (AT-10 PROVISIONAL) | 3 (AT-8b/AT-9b → V2-E6 client/profile lanes; AT-14 → mount lane) | 0 |
| §5 Owner rulings (OR) | 33 | 28 | 5 (OR-2, OR-G, OR-P, OR-R, OR-M) | 0 (OR-12b's open owner call tracked as G-6) |
| §6.1 SURVIVORS certified rows | 24 | 22 | 2 (S-RP7, S-RO10) | 0 |
| §6.2 SURVIVORS flagged rows | 13 | 7 | 2 (S-SUCC, S-E2) | 4 (S-RK6, S-RP3, S-RX5, S-RO8 → G-2..G-5) |
| **Total** | **151** | **127** | **20** | **4** |

Notes on the count: (i) split rows mean one *requirement* can appear as one
COVERED and one DEFERRED row — including the Arcade and Git product halves
split in AT-8a/b and AT-9a/b — so "127 COVERED"
must never be quoted as "127 requirements fully done"; (ii) the four active
GAP rows map to G-2..G-5; G-1 is retained as a resolved historical key, while
G-6 (an unanswered owner call) and G-7 (a deferral annotation on AT-16) are register-only entries without their own
GAP-status rows; (iii) every DEFERRED home is one of: V2-E6 (client slice),
V2-E7 (venue), V2-E8-adjacent (adapters), mount lane, KEL/succession round,
Stage-B crypto round, SDK/result-model chapter,
client/lens-compiler lane — eight named homes, no orphan deferrals; (iv) S-RP7
reads DEFERRED but its forbidden-rule (no signature-derived archive roots) is
restated nowhere yet — G-3's disposition explicitly carries it, which is the
strictest honest reading.

The item-F RULINGS-lane drop and three SERIOUS SURVIVORS absences (succession,
lens scale, R-D9) trace to explicit closures above (OR-F, S-SUCC, S-RL4a/b,
S-RD9F). OR-1 carries the historical chains-don't-die DROP/KEEP ruling while
leaving its per-Realm extension explicitly unadopted as A2; it is no longer
presented as silently closed. The remaining active GAP risk is exactly G-2..G-5;
G-1 is resolved, and G-6/G-7 remain register-only routing/deferral annotations.

## 9. Gate-coverage map

What this Stage A pass evidences toward the owner-decision-inbox gates
(V2-E1..E5 + E8-partial feeding V2-F1; V2-E6/E7 out of scope — PM directive
scope, VERIFIED):

| Gate | Evidence produced by this pass | Where |
|---|---|---|
| V2-E1 Principal surface | Uniform-vs-tagged fully specified as axis 2: D1–D4 close by construction/vector/inspection; F2 authorKey has one exact hashed-domain/fixed-word formula; only D5_2 awaits measurement; rejection conditions pinned both ways | prin §2–§7; bk §3.3/§4.2; GV-3/5/6 |
| V2-E2 Contract Lens floor | ResolutionPlan/1 exact `u16(frameLen)‖frame` body/parser offset/4,194-byte maximum, indivisible three-field ResolvedTarget, combiners and non-alias vectors, risk-bearer ABI, LENS-NEG-1, challenge-window pattern; separate Core/client grids with honest UNKNOWN/PARTIAL | enc §3.4; lens (all); GV-13; FX-LENS; hf §2.5; bk §6.1 |
| V2-E3 Record/context bakeoff | Exact F1 card+unchanged SR-3 intent and F3 signed carrier; every k=1..64 under same-atomicity units; F1 aggregator overhead; restricted-JCS corpus/vector/result/state interfaces plus uniquely keyed source/case/vector/step/input measurement rows prevent adaptive or attribution drift; CV-SHADOW uses legal cross-carrier router traces, STAGED-TYPE-OCCREF with staged/persisted-retry current-carrier guard/no-state, and one-carrier duplicate Withdrawals while reporting F1's one-leaf/outer-rollback boundary rather than claiming B0's single-Core-call preflight | auth §2.4/§5.3; bk §3–§4/§6; hf §§1.4,2.0.3,3.1–3.2a, FR-1..6 |
| V2-E4 Type/index budget | Closed 2-byte IndexSpec and ReferenceRole selector grammar; fan-out/16-ref bound; page ABI; selector sentinel; exact F4 identity/coverage/backfill/page cell; ONE bundle and adversarial workloads; budget number remains Stage B | enc §3; idx §§4–10; GV-2/GV-14; hf §3–§4 |
| V2-E5 Realm bootstrap & authority history | RealmDescriptor/1 plus exact protocol 0.0 seven-field InitConfig/hash/GenesisFactsView/revision-1 policy+authority; canonical authority ref; direct/UUPS EIP-1967 facts and getters; enumerable paired revision/AuthorityTransition history and packed AdmissionBatch intent lanes; C-1..C-7, QR-1..8, admission/finality split, U-1..6, and unsigned-carrier/receipt/lane-grounded reconstruction including W-4a | realm (all); GV-17; CV-RECON; hf §3.2a |
| V2-E8 (partial) | Adapter seam specified from three sides (schema-string mapping + UID non-identity, enc §9; receipt projection, realm §8.3; principal mapping, prin §9); recursive-Type safety (GV-2); no-callback rule (enc §2.8); loss-map itself deferred to V2-E8 proper per PM directive | enc §9/§2.8; realm §8.3; prin §9 |
| V2-E6 / V2-E7 | Out of scope by directive; DEFERRED rows above name them as homes. C-PS-8's client-policy seam is COVERED, while its UI implementation, FX-ARC guest player/runner (AT-8b), and Git gateway/guest/workspace/import-export product surfaces (AT-9b) remain V2-E6/client-profile work | — |
| **V2-F1 feed** | The freeze gate consumes: this table + the eleven chapters + Stage B's minted vectors/measurements + the §7 gap closures + the succession vector classes (vf open item 8, freeze-blocking) + independent review. Stage A's claim is exactness, not freeze-readiness | — |

---

## Interfaces exposed

The compact contract other chapters (synthesizer, red team, Stage B) rely on:

- **Row identifiers** `C-LY-*, C-UI-*, C-TD-*, C-AA-*, C-TX-*, C-IX-*, C-LN-*,
  C-HR-*, C-FB-*, C-PS-*, C-FS-*` (constitution), `AT-1..16` including
  `AT-8a/b` and `AT-9a/b` (acceptance
  traces), `OR-*` (owner rulings), `S-*` (SURVIVORS rows), `G-1..G-7` (gaps) —
  stable citation keys for review findings and Stage B reports.
- **Status vocabulary** {COVERED, DEFERRED(home), GAP(disposition)} with the
  split-row discipline (§0.3) and the COVERED-is-conditional-on-verified-SR-
  repairs/residue-gates caveat (§0.2).
- **Measurement-evidence contract** (hf §§1.4, 3.1–3.4): one restricted-JCS
  corpus/vector manifest, binary result-schema registry and canonical outcome,
  logical state projection/digest, and one canonical measurement file whose
  unique row key names exact source/case/vector/step/input; every claimed
  output has a typed error, cross-implementation equality, and
  Realm/basis/high-water/coverage fields with exact N/A sentinels; axis 1 has
  all 64 fixed integer rows, explicit F1 aggregator overhead, and enumerable
  explicit/implicit batch-intent lane reconstruction/cost rows.
- **The GAP/resolution register** (§7): four active gaps (G-2..G-5), resolved
  historical G-1, and register-only G-6/G-7.
- **The named-homes list** (§8 note iii): the eight legal destinations for any
  DEFERRED status; a deferral naming no home from this list is a table defect.
- **The gate map** (§9): which chapters evidence which V2-E gate, and that
  V2-F1 additionally blocks on Stage B execution + the succession vector
  classes + independent review.

## Open items

1. **G-2..G-5 seam edits** — proposed one-to-few-line insertions (prin §6.2 G9;
   hf §2.7 tier byte; realm adapter-seam stub; SDK outbox rule); adopting them
   is a synthesizer/red-team action, not this lane's authority. Closed by:
   synthesizer with red-team review.
2. **G-6 owner call** (all-TypeSchemas enumeration) — carry into the James
   packet at the next genuine-fork presentation; do not batch prematurely (PM
   directive: silence never adopts, and James is asked only at evidenced
   forks). Closed by: synthesizer packet assembly.
3. **S-G10 grade-name mapping** — the register's five §10 grades vs
   BasisGrade/BasisReport vs the Binding outcome vocabulary must merge in the
   SDK/result-model chapter before SDK-tier vectors mint (vf open item 6).
   Closed by: SDK/result-model lane + synthesizer.
4. **AT-10 provisional status** — FX-EAP rows excluded from adopt/kill until
   the Codex durable brief lands (PM directive; hf FR-6); flip the AT-10
   annotation when it does. Closed by: Codex brief.
5. **Count drift** — §8's counts are mechanically tallied over this document; if the
   red team adds/splits rows, the summary table must be re-tallied in the same
   edit (a stale count is itself a table defect). Closed by: whoever edits.

## Final requirements/honesty assembly report — 2026-08-13

This repair is confined to Stage A candidate and assembly artifacts. It adopts
no mechanism, changes no shared `Designs/efsv2/` spine file, adds no Git or
Arcade Core primitive, and makes no product-completion claim.

- FX-GIT now carries exact native BLOB/TREE/COMMIT/TAG preimages through
  ordinary `GitObject/1` Records, generic `ChunkTree/1` byte commitments, and
  nested FINAL `GitObjectClosure/1` Records. `CV-GIT-STOCK` specifies clean
  second-implementation reconstruction, `git fsck --full`, stock clone, later
  push/fetch, OID/tree equality, closure-before-advertise, and SHA-1-only SWHID
  v1 projections. Production Git UI, gateway/intake, workspace, and
  import/export workflows remain AT-9b/V2-E6 client-profile work. [PROPOSAL —
  application-profile carrier and fixture mechanism.]
- FX-ARC phase G now specifies the unauthenticated guest/player boundary with
  no wallet, OS, Commons, or ambient authority; its Web Client, disposable
  runner, and capability-cage implementation remain AT-8b/V2-E6 work.
  [DERIVED INVARIANT — acceptance-trace honesty repair.]
- FX-MOUNT is narrowed to a canonical raw-manifest input seam. Portable host
  names/collisions, stable handles, xattrs/control API, mounted-I/O semantics,
  read-only enforcement, and three-host execution remain explicitly deferred.
  [DERIVED INVARIANT — split-row honesty repair.]
- OR-1 now separates James's historical chains-don't-die DROP/KEEP ruling from
  A2's unadopted per-Realm scope proposal; the parsed schema cache and exact Git
  carrier mechanisms retain proposal rather than owner authority. [DERIVED
  INVARIANT — authority-scope audit against the cited ruling and A2.]

The AT-8 and AT-9 product halves were split rather than hidden inside COVERED
rows. The mechanical trace tally is therefore **151 rows / 127 COVERED / 20
DEFERRED / 4 GAP**. The four active GAPs remain exactly G-2..G-5; none of this
assembly report closes or adopts them.
