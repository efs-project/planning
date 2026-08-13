# Controlled bakeoff specification — cells, confounds, and decision rules
**Stage A chapter — post-red-team repair; not landed, adopts nothing.**

Assembly Lane A of the Stage A commissioned pass (2026-08-12). This chapter is PM
deliverable 4: the controlled bakeoff specification that separates the seven kickoff
axes and identifies the unavoidable interactions. It adopts and formalizes the intake
audit's 9-cell fractional design with declared confounds (audit-lanes.json, BAKEOFF
lane, findings 1–10 — all citations below VERIFIED against that record and against the
eight B0 chapter files in `scratchpad/stage-a/chapters/`, read in full).

One sentence of position: the kickoff's literal instruction "keep one baseline fixed
and vary each axis independently" (fable-efs2-core-engineering-kickoff.md line 71,
VERIFIED) **is unsatisfiable as written**, because the axes are not orthogonal — and
this spec is the amendment that says exactly where they touch, what is measured
anyway, and how each verdict stays attributable to one axis.

Label key (PM-mandated): [OWNER RULING] / [DERIVED INVARIANT] / [PROPOSAL] /
[HYPOTHESIS] / [REJECTED]. Factual claims marked VERIFIED (exact text read) or
PLAUSIBLE. The experimental design itself is one large [PROPOSAL] grounded in the
BAKEOFF audit lane; individual gates cite their own authority.

---

## 0. Position, inputs, and the amendment

**Inputs.** B0 means the repaired SR-1..SR-18 configuration, not the
pre-red-team parallel drafts. It is exact across eight chapters:
`b0-encoding-and-ids.md` (Lane 1), `b0-authorship-envelope.md` (Lane 2),
`b0-principal-authority.md` (Lane 3), `b0-realm-admission.md` (Lane 4),
`b0-indexes.md` (Lane 5), `b0-binding.md` (Lane 6), `b0-lens.md` (Lane 7),
`b0-content-locators.md` (Lane 8). Every flip cell below is defined as a **delta
against named sections of those chapters** — never as a fresh design. Every
cell inherits the repaired exact identities, ABI widths, lifecycle overlay,
schema on-ramp, and SR-18 vocabularies. A stale owning-chapter repair blocks the
cell; it is never a cell-local choice.

**The amendment [PROPOSAL — amends kickoff line 71; evidence: BAKEOFF lane findings
1–2, both SERIOUS, VERIFIED].** Three facts break literal one-axis-at-a-time:

1. **Axis 5 is nested inside axis 1's Envelope arm.** Axis 5 (inline canonical Record
   leaves vs RecordId leaves) is a property of the Envelope's leaf carriage
   (candidate lines 171–174; b0-authorship-envelope.md §2.1/§5.3 step 5). Under
   axis 1's self-contained arm there is no Envelope and no leaf to encode. The valid
   design space is therefore `2^6 (Envelope arm) + 2^5 (self-contained arm) = 96`
   cells, not `2^7 = 128`.
2. **Axis 3's portable arm is specified over Envelope coordinates.** AdmissionIntent
   and Occurrence identity are defined over `(EnvelopeId, leafIndex)`
   (b0-authorship-envelope.md §3.1, §5.1; candidate lines 143–149, 176–177). A naive
   axis-1 flip silently drags axis 3. §3.2 gives the required re-expression so the F1
   cell holds axis 3 at its baseline arm.
3. **Five axis pairs interact through measurement even where semantically
   independent** (§1.3): 1×7, 1×2, 4×7, 3×5, 6×7. Each gets exactly one of three
   treatments: a dedicated interaction cell (1×7 → X17), arithmetic recovery (1×2,
   4×7), or a shared vector suite / written analysis (3×5, 6×7).

The kickoff's prohibition that matters is preserved intact: **no two cells differ in
more than one axis except the two declared compound cells (F1, X17), and no
comparison is ever made between two monoliths varying all seven axes** [DERIVED
INVARIANT — kickoff lines 85–86, VERIFIED].

**Scope note (measure vs specify).** Per the intake SPINE lane's BLOCKING finding,
this spec is written to work under either reading of the kickoff: it fully specifies
cells, statistics, and decision rules now (Stage A), and the measurement runs are
Stage B / prototype-phase work on a disposable contracts worktree (PM directive line
20). Nothing here deploys, seeds, or promotes [DERIVED INVARIANT — kickoff lines
169–173, VERIFIED].

---

## 1. The axis lattice

### 1.1 Axes and arm notation

Arm letters used throughout (baseline arm listed first, per the B0 spine pins):

| Axis | Question | B0 arm | Alternative arm |
|---|---|---|---|
| 1 | Record shape | **E** — immutable shared PublicationEnvelope | **S** — self-contained Record headers |
| 2 | Author surface | **U** — uniform bytes32 PrincipalId + intrinsic account Principal | **T** — tagged `Account \| Principal` |
| 3 | Publication domain | **P** — portable authored Envelope + separate Realm-bound AdmissionIntent | **R** — deliberately Realm-bound authored Envelope |
| 4 | Type/query identity | **A** — one TypeSchemaId hashing meaning+shape+validation+roles+index obligations | **B** — split TypeId/ShapeId/IndexProfileId + coverage state machine |
| 5 | Envelope leaf | **I** — inline canonical Record leaves (bodies carried at admission) | **L** — RecordId leaves + separately-available bodies |
| 6 | Physical deployment | **M** — one atomic Core, modules as internal libraries | **D** — narrow cooperating physical contracts |
| 7 | Index pointer | **O** — packed stable-ordinal postings (uint48 lanes, 5/slot) | **W** — full RecordId/EnvelopeId postings |

A cell is written as a 7-vector, e.g. B0 = `(E,U,P,A,I,M,O)`. Axis 5 is written `–`
under arm S (nonexistent, not "held fixed").

### 1.2 Dependency structure, stated honestly

- **5 ⊂ 1E.** Axis 5 exists only in the Envelope arm (§0 fact 1). Consequence: the
  axis-1 flip cell F1 is **by necessity a compound cell** that flips axis 1 AND
  collapses axis 5. This confound is declared on every F1 measurement (§3.2): F1-vs-B0
  deltas are NOT a pure axis-1 main effect on any statistic where leaf encoding
  contributes (calldata, extraction, per-leaf storage amortization). [PROPOSAL —
  adopts BAKEOFF finding 1's recommendation verbatim.]
- **3 is re-expressible under 1S.** The portability question — where realm-binding
  lives: inside the signed publication vs in a separate Realm-bound intent — is
  conceptually independent of record shape, but no spine doc specifies the
  self-contained re-expression (BAKEOFF finding 2, PLAUSIBLE half). §3.2 specifies it
  as part of the F1 cell spec, holding axis 3 at arm P so F1 isolates axis 1 (plus the
  declared axis-5 collapse) rather than flipping axes 1 and 3 together.
- **Lattice size.** Valid cells: 96 (= 2^6 + 2^5). Prototyped cells: 9. The 9-cell
  fraction is a one-factor-at-a-time star around B0 plus one interaction cell plus one
  thin variant — the smallest design in which every axis has a measured or
  vector-decided contrast and the one sign-risk interaction is directly observed.
  [PROPOSAL — BAKEOFF finding 6.]

### 1.3 The five measured interactions

[VERIFIED components per BAKEOFF finding 4; the claim that these are the only strong
interactions is PLAUSIBLE and is itself red-team surface.]

| Pair | Mechanism of interaction | Treatment |
|---|---|---|
| **1×7** | Posting/log cost sits inside the same aggregate calldata/SSTORE totals that decide axis 1; envelope amortization changes per-posting volume (b0-indexes.md §2.2's 2-log-slots-per-occurrence and §9 totals). The **sign** of the axis-7 verdict could flip with Record shape. | Dedicated interaction cell **X17** (§3.9); interaction contrast `I_17` (§4.7). |
| **1×2** | The author surface appears once per Envelope under arm E (b0-authorship-envelope.md §2.1 field 2) but once per Record under arm S — header repetition amplifies any tagged-union byte/gas delta. | **Conditional arithmetic recovery**: `Δ_1×2 = (records per publication − 1) × δ_tag` may be used only after trace decomposition demonstrates the F2 tag component is isolated and unchanged in F1; otherwise the interaction is UNMEASURED and cannot decide an arm. |
| **4×7** | Variant B's backfill writes postings for historical records (candidate lines 294–298), so backfill gas depends on the posting encoding (13.4k amortized packed vs ~2×22.1k wide; b0-indexes.md §9, §10). | Measure backfill in F4 **on baseline packed ordinals only**; derive the wide-posting delta from F7 only after trace decomposition proves the reused append component is isolated. Otherwise label 4×7 UNMEASURED and do not decide from it. |
| **3×5** | Subset-carriage vectors behave differently for inline-carried vs reference-only leaves (what the wire must reveal vs what admission requires present). | **Shared vector suite**: the subset-carriage suite (b0-authorship-envelope.md §7, §12 cat. 4) runs unchanged in B0, F3, AND F5; results reported per cell, never pooled. |
| **6×7** | Ordinal assignment needs one strictly-increasing counter shared by Admission (assigns; b0-realm-admission.md §5.3), Index (appends postings keyed by it; b0-indexes.md §2.3), and Binding (stamps heads; b0-binding.md §3.4). Under arm D that counter crosses a physical contract boundary. | **Written analysis in the F6 report** (§3.7): note that arm W (RecordId postings) removes the shared-counter coupling ordinals impose on the modular arm — i.e., a D+W combination is architecturally easier than D+O — plus the measured per-boundary overhead. No cell. |

### 1.4 The eighth row — dispositioned out of the matrix

The candidate's alternatives table has eight rows; the kickoff commissions seven axes
(BAKEOFF finding 3, VERIFIED: candidate line 413 "Type schema identity |
publisher-qualified namespace | semantic spec commitment…" maps to no kickoff axis).
Disposition: **ANALYSIS-ONLY**, already executed — `b0-encoding-and-ids.md` §8 carries
the full analysis, the S-with-qualifier recommendation [PROPOSAL there, unadopted],
and the pinning golden-vector pair `T-CONV`/`T-QUAL`. §5.1 states its acceptance
criteria. No gas or fixture measurement discriminates "collision of meaning vs
convergence of shared standards"; building a cell for it would spend an engine on a
governance argument. [PROPOSAL — adopts BAKEOFF finding 3's recommendation.]

---

## 2. The cell matrix

| Cell | Name | Axis vector | Build form | Decides / feeds |
|---|---|---|---|---|
| B0 | SPINE | (E,U,P,A,I,M,O) | Engine α, trunk | baseline for every contrast; hosts all build-once subsystems |
| F1 | FLATCARD | (S,U,P′,A,–,M,O) | Engine β, trunk | axis 1 (with declared compound confound) |
| F2 | TAGGED | (E,**T**,P,A,I,M,O) | thin branch of α | axis 2 result D5 (D1–D4 are vectors/inspection) |
| F3 | REALMBOUND | (E,U,**R**,A,I,M,O) | branch of α | axis 3 four-vector matrix + overhead tiebreak |
| F4 | SPLIT-ID | (E,U,P,**B**,I,M,O) | Engine γ | axis 4 fracture-vs-backfill + coverage hard gate |
| F5 | REF-LEAF | (E,U,P,A,**L**,M,O) | branch of α | axis 5 one-call gate + endorsement crossover |
| F6 | MODULAR | (E,U,P,A,I,**D**,O) | Engine δ | axis 6 size gate + overhead + partial-failure matrix |
| F7 | WIDE-POST | (E,U,P,A,I,M,**W**) | branch of α | axis 7 append/page numbers |
| X17 | FLATCARD-WIDE | (S,U,P′,A,–,M,**W**) | branch of β | 1×7 interaction; axis-7 sign confirmation |

`P′` = axis 3 arm P re-expressed under self-contained headers (§3.2). Bold marks the
flipped axis. "Engine" and "branch" per §7.

---

## 3. Per-cell specifications

Each cell: exact delta vs the B0 chapters (cited), what is rebuilt vs shared, and its
declared confounds. "Shared" always includes, unless stated otherwise: the MC/1 codec
and ID family (b0-encoding-and-ids.md §1–§2), AccountPrincipal/AuthorityVerifier
(b0-principal-authority.md §2–§3), RealmDescriptor/receipts/reconstruction
(b0-realm-admission.md), the Binding state machine (b0-binding.md), the Lens resolver
(b0-lens.md), the content Type family (b0-content-locators.md), and the frozen fixture
corpus + workload scripts (§6). Thus every cell inherits the exact seven-field
`InitConfig`, controller-reference/revision/transition and EIP-1967 read facts;
the exact BindingSet/Tombstone/Withdrawal Types and Admission-only
`ValidatedOccurrenceLifecycleEffect`; the three-field `ResolvedTarget`; and
ArtifactClosure's STRING(255) member-name shape. Cell deltas may not redefine
those interfaces. Multi-leaf admission also inherits the static
expected-revision association, ascending point-in-order shadow, fixed
`TargetRecordCommitment(typeSchemaId,bodyHash)` evidence, and assert-only
before/after commit journal; a never-admitted target creates no body/index/head
state.

### 3.1 B0 — SPINE

The eight chapters repaired to SR-1..SR-18; no delta. Two obligations
specific to this spec:

**Arm-choice provenance [PROPOSAL — required by BAKEOFF finding 5 so the memo states
which pins are candidate-ratified vs auditor/lane-chosen]:**

| Axis | B0 arm | Provenance |
|---|---|---|
| 1 | E | candidate's whole sketch is Envelope-based (lines 21–34) — candidate-leaning |
| 2 | U | candidate line 259 names uniform "Bakeoff baseline" — candidate-ratified as baseline |
| 3 | P | candidate lines 155–158 ("syntax is not allowed to discard portable signed evidence accidentally") — candidate-leaning |
| 4 | A | **choice of convenience** (single-ID simpler arm; candidate lines 88–95 explicitly refuse to choose) — both variants still built |
| 5 | I | **choice of convenience** (satisfies the one-call dependent-write gate trivially) — both variants still built |
| 6 | M | candidate lines 358–360 lean fewer physical contracts — candidate-leaning |
| 7 | O | candidate layout step 2 lists full-width-safe ordinal first — candidate-leaning |

**Baseline instrumentation.** B0's measurement run additionally records the corpus's
observed **publication batch-size distribution** (records per authored publication
event, per fixture trace) — the axis-1 and axis-5 decision rules consume its median
and shape (§4.1, §4.5) — and the **read/write ratio** per postings family (§4.7).

### 3.2 F1 — FLATCARD (axis-1 flip; declared compound cell)

**Concept.** One self-contained signed publication card per Record: header + exactly
one (TypeSchemaId, canonicalBody). No shared Envelope, no leaves.

**Exact delta vs B0 (Engine β rebuild of Lane 2's surface):**

- `PublicationEnvelope/1` (b0-authorship-envelope.md §2.1) → `PublicationCard/1`:
  fields 1–6 unchanged (profile, principalId, authorityRef=0, authEpoch=0, pubNonce,
  notAfter — the reserved authority-basis seam §6 is preserved verbatim), field 7
  `recordIds[]` replaced by `typeSchemaId bytes32` + the RecordId of the single body.
  Wire carries the one body + witness. The exact EIP-712 type/domain/digest is
  `b0-authorship-envelope.md` §2.4; the wrap word is the registered
  `DOM_BAKEOFF_F1_CARD = keccak256("efs2/bakeoff/f1-card/1")`.
- `CardId = keccak256(abi.encode(DOM_BAKEOFF_F1_CARD, eip712CardDigest))` — the §2.3
  single-source-identity rule carried unchanged. `RecordId` formula untouched
  (axis 4 arm A shared).
- **Occurrence identity adapter (the load-bearing line).** `OccurrenceRef ≡ (CardId,
  leafIndex = 0)`; `occKey` formula unchanged with `leafIndex` fixed at 0. Every
  build-once subsystem (Binding CAS predecessor pairs — b0-binding.md §3.2/§3.3;
  occLife; index postings; Lens head reads) runs **unmodified** through this adapter.
  [PROPOSAL — realizes the audit's "per-cell adapters only where occurrence identity
  differs", BAKEOFF finding 10.]
- **Axis 3 held at arm P (the P′ re-expression).** The card stays portable — signed
  under the chain-free constant domain with the same §2.4 argument — and admission
  still requires a separate Realm-bound `AdmissionIntent/1` (b0-authorship-envelope.md
  §5.1) with `envelopeId=CardId`, `leafMask=1`, and `action=0`. **No field is
  dropped and no type string is adjusted**: the entire SR-3 intent remains
  byte-identical. Intent nonces,
  PrincipalId descriptor carriage and verification carry unchanged;
  `admitAsSender` remains legal only for cards with no kernel effect;
  BindingSet/Tombstone cards require the exact one-item SR-3
  `expectedRevisions[]`, while Withdrawal cards require explicit intent with an
  empty revision list. [PROPOSAL —
  adopts BAKEOFF finding 2's recommendation: F1 isolates axis 1.]
- Admission algorithm (§5.3): steps unchanged except the leaf loop degenerates to one
  iteration; the envelope spine mappings (§10) become a card spine
  (`cardPrincipal`, `cardMeta`, one RecordId — no vector). Receipts: one receipt per
  card; its one newly accepted occurrence receives the next SR-10 ordinal and
  is read through the shared occKey lifecycle overlay. No base/leaf arithmetic
  survives merely because `leafIndex = 0`.
- The B0 shadow walk degenerates to one leaf per Core call. In an F1 atomic
  aggregator, later cards see state committed by earlier subcalls and any later
  failure reverts the outer transaction; F1 must not claim B0's stronger
  *single-Core-call* all-prewrite property across cards. The SHADOW fixtures run
  through the aggregator and report this axis-1 boundary explicitly while
  preserving identical final success/revert state.
- **Exact axis-1 comparison transaction.** For every frozen integer `k=1..64`,
  `G_B0(k)` is one EVM transaction making one ordinary Core `publish` call with
  one independently signed envelope containing exactly k Record leaves.
  `G_F1(k)` is one EVM transaction through a pinned, disposable, stateless, test-only
  `F1AtomicAggregator` carrying k independently signed one-Record cards. The
  aggregator loops over the cards, makes exactly k ordinary Core `publish`
  calls, and bubbles any failure so the outer transaction reverts all earlier
  subcalls. It creates no Core batch entrypoint and is never a production
  mechanism. Both comparison units are `MUST_FIT_ATOMIC`, keep
  `splitFactor=1`, and report `OVER_CAP` at that exact k rather than splitting.
  `G_F1(k)` includes the aggregator's execution overhead; every row separately
  reports `coreCallCount` and `aggregatorGas` (outer-frame gas exclusive of
  Core subcall frames). Deployment gas is one-time harness setup, not G(k).

**Rebuilt:** Lane 2 signing/wire/admission surface; card spine storage.
**Shared:** everything else, including indexes (postings unchanged; `EnvelopeMeta` →
`CardMeta` with `leafCount ≡ 1`), Binding, Lens, Realm machinery, principal record.

**Declared confounds (must appear on every F1 report):**
1. Axis-5 collapse — F1-vs-B0 is axis 1 + axis 5 jointly on calldata/extraction/
   storage-amortization statistics (§1.2).
2. Witness repetition — n cards mean n signature verifications vs 1 per Envelope
   (3k/ecrecover; up to 200k/1271 — b0-principal-authority.md §3.7). Reported as a
   separate line so the header-vs-witness contributions are distinguishable.
3. Subset carriage is trivially moot (a card IS the minimal subset); F1 runs no
   subset-carriage suite.
4. Test-only aggregator overhead is not attributed to Core: it is included in
   total transaction gas for an honest one-tx comparison and exposed separately
   as `aggregatorGas` on every F1 M-K row.

### 3.3 F2 — TAGGED (axis-2 thin ABI variant; NOT a full build)

Per b0-principal-authority.md §7 (the sketch is already exact enough): `AuthorRef
{uint8 kind; bytes32 value}` replaces `principalId` in the Envelope header, in every
author-bearing ABI, and in every author-keyed storage/index key. The only F2
author key is:

```text
DOM_BAKEOFF_AUTHOR_KEY = keccak256("efs2/bakeoff/author-key/1")
authorKey = keccak256(abi.encode(
  DOM_BAKEOFF_AUTHOR_KEY, uint256(kind), value))
```

This live domain is the `bakeoff`-class row in the closed registry
(`b0-encoding-and-ids.md` §1.3): it exists only in the disposable F2 arm, is
not a Core semantic key/id, is excluded from `codexConstantsHash`, and is
included in `corpusDomainManifestBytes` and H-DOMTABLE.

There is no two-level-mapping or packed/raw-concatenation alternative. ACCOUNT
arm authors by address (ecrecover/1271); PRINCIPAL arm is a registered author
object.

**Build form:** a compile-time branch of Engine α touching only (a) the Envelope
header field + type string, (b) author-key derivation in `LibIndex`/`LibBinding`,
(c) the verifier entry (address vs principal dispatch). No other subsystem changes.
[PROPOSAL — BAKEOFF finding 8: "Build F2 as a thin variant sharing B0's engine, not a
full cell."]

**Measured:** only D5 (per-write gas/calldata delta; the B0-side prediction is ≤120
gas hash + ≈160 B calldata ≈ 2,560 L1 calldata gas, b0-principal-authority.md §7.2 —
harness confirms). **Not measured, resolved by vectors/inspection:** D1–D4 (§4.2).

**Declared confound:** none — the branch flips exactly axis 2. The 1×2 interaction is
recovered arithmetically from D5 + F1's repetition count (§1.3).

### 3.4 F3 — REALMBOUND (axis-3 flip)

Per the exact seam in `b0-authorship-envelope.md` §2.4, F3 signs
`PublicationEnvelopeBound(...)ExpectedRevision(...)` under the full
`EFS2-Envelope-Bound` EIP-712 domain and wraps the digest with the registered
`DOM_BAKEOFF_F3_ENVELOPE = keccak256("efs2/bakeoff/f3-envelope/1")`. The
exact field order, nested-array hashing, and formulas there are normative for
the cell. There is **no separate AdmissionIntent**.

**Exact rebuild list:**
- Signing profile (§2.4) → realm-bound; exact id is
  `keccak256(abi.encode(DOM_BAKEOFF_F3_ENVELOPE,eip712F3Digest))`.
- Admission (§5.3): steps 3–8 replaced — the envelope itself is the Realm consent;
  since the envelope now HAS local effects, it must carry the replay defense the
  intent carried: the 2-D nonce pair (`nonceKey`, `nonceSeq` — §5.2) moves INTO the
  signed envelope. `admitAsSender` keeps its role (sender-consent path).
- AccountPrincipal descriptor carriage and
  `computePrincipalId(descriptor) == header.principalId` still precede witness
  verification exactly as SR-13/SR-14 require.
- **Binding CAS carriage (declared confound).** B0 carries per-leaf
  `expectedRevision` in the Realm-bound intent precisely to keep Realm-local state
  out of portable bytes (b0-binding.md §3.2 [PROPOSAL there]). F3 has no intent, so
  the entire SR-3 `expectedRevisions[]` commitment — the exact
  `ExpectedRevision(uint16 leafIndex,uint32 revision)` array hash, ordering,
  cardinality, and selected BindingSet/Tombstone coverage rules—including
  structural association for ACTIVE duplicates and no item for Withdrawal—moves into the signed
  Realm-bound envelope (legitimate there — the envelope is already Realm-bound).
  This is a real design difference that rides
  the flip; the F3 report must note that CAS ergonomics differ across arms for
  reasons downstream of axis 3 itself.

**Shared:** everything else — Engine α branch.

**Measured/decided:** the §4.3 four-vector matrix (decisive) + per-admission overhead
comparison as tiebreak: B0 pays one extra signature verification + one intent nonce
slot + intent calldata per authorized admission; F3 pays zero intent overhead but
must re-sign per Realm. Both numbers come from the same fixture traces.

### 3.5 F4 — SPLIT-ID (axis-4 flip; distinct engine)

Per the exact Variant B cell interface in `b0-encoding-and-ids.md` §3.6, the
registered bakeoff domains are `DOM_BAKEOFF_F4_TYPE`,
`DOM_BAKEOFF_F4_SHAPE`, `DOM_BAKEOFF_F4_INDEX_PROFILE`, and
`DOM_BAKEOFF_F4_RECORD`. The exact formulas there are normative for the cell;
structured inputs enter through exactly one nested hash.

**Exact rebuild list (why this is Engine γ, not a branch):**
- The schema object may separate semantic, shape, and index-profile
  commitments, but enters state as a `TypeSchemaGroup/1` Record through the
  sole ordinary `publish` entrypoint. F4 may not introduce a second Core
  registration function or a two-step materialization path.
- Index population keys postings by `(IndexProfileId, …)` instead of the
  Variant-A `(TypeSchemaId, specOrdinal, …)` of b0-indexes.md §2.1/§4.3.
- **Coverage state machine (new state, the heart of the arm):** the exact
  active+pending bound, `F4CoverageState`, CAS backfill ABI, fixed
  `F4_BACKFILL_SCAN_MAX=16`, transition rules, historical/live partitions,
  coverage-revision cursor binding, and `F4PageResult` are
  `b0-indexes.md` §10. A second pending profile rejects; one admission writes
  to at most two profile sets. `PARTIAL` never proves absence.
- **Backfill unit:** every call is one `SPLITTABLE_THROUGHPUT` campaign unit
  bounded by 16 admission ordinals; no call mints an admission ordinal. The
  campaign may span transactions only between successful CAS steps. The fixed
  cap, not schedule-derived record estimates, is what Stage B executes.

**Shared:** Envelope/admission machinery, Binding, Lens, principal, content types
(their Type declarations published under the split formulas by the harness).

**Declared confound (4×7):** backfill gas measured on packed ordinals only; the wide
delta computed from F7 (§1.3).

### 3.6 F5 — REF-LEAF (axis-5 flip; branch of α)

**Honesty preamble.** Lane 2's B0 design already commits leaves as RecordIds
(b0-authorship-envelope.md §2.1: "the leaf commitment is the RecordId itself") — so
the identity layer is shared between the arms, and the axis-5 contrast as-built is
**carriage + admission availability policy**, narrower than the candidate's original
"inline Record bytes vs RecordId" framing. The spec states this narrowing rather than
hiding it; the EnvelopeId formula is identical in both arms, which is precisely what
makes F5 a lean branch.

**Exact delta:**
- B0 rule (§5.3 step 5): bodies MUST be carried for every leaf being admitted. F5
  rule: a leaf is admissible iff its body is bundled in the same call **or** its
  RecordId is already admitted in the Record spine — the same-tx availability path
  the audit lane names. (This generalizes the REF-SAT dependent-reference rule of
  b0-realm-admission.md §5.4 from references to the leaves themselves.)
- Wire: `carriedLeafIndexes`/`bodies` may be a strict subset of admitted leaves.
- Everything else — EnvelopeId, intent, occurrence state machine, indexes — shared.

**Optional sub-variant F5m [not measured unless §4.5's direct endpoint-weighted
result is inconclusive]:**
`leavesHash` as a positional Merkle root enabling single-leaf proofs
(b0-encoding-and-ids.md §4.2 bakeoff sketch). Kept out of the primary cell to avoid
compounding carriage with commitment structure.

**Measured/decided:** the §4.5 one-call gate (decisive) + fresh-vs-re-endorsement
calldata crossover; the subset-carriage suite runs here too (3×5, §1.3).

### 3.7 F6 — MODULAR (axis-6 flip; distinct engine)

Physical split per the candidate's module list (core-architecture-candidate.md lines
349–361, VERIFIED): `Codex` (constants/profile), `RecordStore` (bodies + envelope
spine), `Admission` (verifier + receipts + ordinals; the single write entrypoint),
`Index` (postings), `Binding` (heads/history), `LensResolve` (plans + resolution).

**Exact rebuild list:**
- The internal-library seams that B0 pins as in-process calls become external
  interfaces: `LibBinding.applyBind` → `IBinding.applyBind` (b0-binding.md §8);
  withdrawal passes the same exact ten-field
  `ValidatedOccurrenceLifecycleEffect` from Admission to Index and Binding,
  never evidence bytes or a witness/authority/author verifier. Admission first
  computes the complete point-in-order shadow and exact typed Binding/index
  before/after journals; module commit calls accept only those frozen operations,
  assert each prestate, and store the after-state without re-derivation;
  `LibIndex.appendPosting` plus status-aware activation/withdrawal folds consume
  the shared SR-10 overlay → `IIndex.*` (b0-indexes.md "Internal seam").
  `KIND_BINDING_HIST` remains
  RAW_AUDIT and uses that overlay only for hydrated status/revocation, never
  filtering or decrement. Lens's `recordBody`/`bindingHead` reads
  (b0-lens.md §5.2) become cross-contract STATICCALLs.
- Wiring: immutable addresses fixed at deployment, codehash pinned in the Realm
  descriptor's genesisCommitment (extended to commit all six codehashes —
  b0-realm-admission.md §2.4 gains a module-set hash [PROPOSAL — cell-local]).
- Access control: only `Admission` may call state-mutating module functions
  (onlyAdmission modifiers) — a new attack surface B0 does not have.
- Atomicity: `Admission` orchestrates; any module revert bubbles and reverts the
  whole call. The adversarial matrix (§4.6) attacks exactly this claim.

**Shared:** all logic bodies (the libraries recompile behind facades); fixtures,
vectors, corpus.

**6×7 analysis obligation (no cell — §1.3):** the F6 report must include the written
analysis that the ordinal counter (`countersSlot`, b0-indexes.md §2.4) forces either
(a) counter custody in `Admission` with the ordinal passed into every `Index`/
`Binding` call (the F6 design), or (b) a counter-fetch call per append; and that arm
W would dissolve the coupling by keying postings on ids rather than ordinals.

### 3.8 F7 — WIDE-POST (axis-7 flip; branch of α)

Per the arm sketch in b0-indexes.md §10 ("Bakeoff arm F7"): each posting is one
32-byte `EnvelopeId` plus a paired word carrying `leafIndex` — 2 slots per
posting, no packing, no ordinal indirection; liveness comes only from the
shared occKey SR-10 overlay (there is no paired-word revocation fold); the `typeOrd`/`principalOrd`
local-ordinal reverse maps (§2.2) are deleted. The external page ABI (§5) is
layout-independent by design, retains uint64 public ordinals, and does not
change — the arm swaps `LibIndex` internals
only. The admission log's role as the globally-ordered page source is retained
(ordinals still exist for ordering and receipts; the flip is what postings *store*).

**Measured/decided:** the §4.7 three numbers; verdict sign confirmed in X17.

### 3.9 X17 — FLATCARD-WIDE (interaction cell)

Engine β (F1) with F7's wide postings — a branch of β, sharing F1's card surface and
F7's `LibIndex` internals (postings store `CardId` directly; the paired word's
`leafIndex` is structurally 0).

**Why this exact cell [PROPOSAL — BAKEOFF finding 4]:** 1×7 is the one interaction
where the axis-7 verdict's **sign** could flip with Record shape: under arm S every
publication is one card, so per-item log/meta amortization disappears and the
relative weight of posting appends in the aggregate rises; simultaneously the
ordinal→id dereference that packed postings pay at read time changes cost because
hydration has no envelope vector to walk.

**Measured:** the axis-7 three numbers re-run under the S shape; the axis-1
aggregate re-run at every frozen integer `k=1..64` under §3.2's exact B0/F1
transaction units; and the standard 2×2 interaction contrast

```text
I_17 = (G_X17 − G_F1) − (G_F7 − G_B0)
```

computed per workload (G = aggregate snapshot gas). `|I_17|` small ⇒ additivity
holds and single-flip verdicts compose; `|I_17|` large ⇒ the axis-1 and axis-7
verdicts must be decided jointly on the {B0, F1, F7, X17} square, and the memo says
so instead of presenting main effects. [PROPOSAL — decision rule.]

**Declared confounds:** inherits F1's compound confounds 1–2 (§3.2).

---

## 4. Per-axis falsifier statistics and decision rules

Named statistics are SMALL-CAPS identifiers so reports and the traceability table can
cite them. Every gas statistic is measured under §6.3's ground rules; every "returns
to James" invocation is the kickoff's measurement gate [OWNER-PROCESS RULE — kickoff
lines 106–107, VERIFIED: "If an adopted outcome fails the total budget, return that
exact tradeoff to James; do not silently remove it"].

### 4.1 Axis 1 — Record shape (B0 vs F1, confirmed in X17)

Statistics:
- `KSTAR_1` — smallest measured integer k in `[1,64]` at which total
  transaction gas satisfies `G_B0(k) < G_F1(k)`, using §3.2's exact
  transaction units. The frozen corpus executes every integer k, regardless
  of earlier results; `{1,3,10,64}` may be display labels only. If no measured
  point crosses, report `NO_OBSERVED_CROSSING_WITHIN_1_64`. Never interpolate,
  bisect, extrapolate, add a result-dependent point, or mutate corpus inputs.
  Every pair has the same `MUST_FIT_ATOMIC` class, Realm profile, ordered
  fixture prefix, and corpusVersion; each `OVER_CAP` result remains the exact
  k observation. F1 total includes the test aggregator, with
  `aggregatorGas` and `coreCallCount=k` reported separately; B0 reports
  `aggregatorGas=0` and `coreCallCount=1`.
- `PREMIUM_1` — the k=1 premium ratio `G_B0(1) / G_F1(1)`.
- `RECON_1` — pass/fail: **both** arms complete the state-only reconstruction walk
  (b0-realm-admission.md §8.1 W-0..W-10; for F1 with the card-spine re-expression of
  W-3..W-5) with zero recourse to logs. It reconstructs canonical unsigned
  carriers and uses receipts/batches for historical admission basis; it never
  claims to recover or replay a discarded main witness. [DERIVED INVARIANT as a hard gate —
  candidate falsifier 10, VERIFIED: "state-only reconstruction needs old logs" is
  rejection.]
- `DIST_1` — the corpus's observed batch-size distribution (median and mass below
  `KSTAR_1`), instrumented on B0 (§3.1).

Decision rule [PROPOSAL — adopts BAKEOFF finding 7]: when a measured crossing
exists, the Envelope arm survives only if `KSTAR_1 ≤ median(DIST_1)` AND
`RECON_1` passes for it. If no crossing is observed within 1..64, the report
uses the direct corpus-weighted measured totals and keeps the no-crossing label;
it does not invent a threshold. If the Envelope arm loses
at k=1 by more than its batch savings recoup in expectation over `DIST_1` (i.e.
`E_corpus[G_B0 − G_F1] > 0`), the self-contained arm wins the axis — and that verdict
is returned as the tradeoff, not silently adopted, because axis-3/5 machinery
re-expression costs ride it (§3.2 confounds). An arm failing `RECON_1` is rejected
outright regardless of gas.

### 4.2 Axis 2 — author surface (B0 vs F2)

Five results, four of which need no gas prototype [PROPOSAL — adopts BAKEOFF finding
8; the table's construction-status column is b0-principal-authority.md §7.2's,
VERIFIED]:

| # | Statistic | Kind | Uniform (B0) status |
|---|---|---|---|
| `D1_2` | setup txs before first write | conformance vector | 0 by construction (§2.7 first-use record rides the first admission) |
| `D2_2` | graduation vector: same id, prospective governance, zero rewritten history | scripted fixture (G1–G4, §6.2) | passes by construction; tagged arm fails-or-forks (history keyed under `ACCOUNT‖addr`) |
| `D3_2` | EIP-7702 three-point classification | conformance vector (§4 of that chapter) | passes under the versioned verifier; bare tag must grow a sub-kind byte (converges to B0) |
| `D4_2` | author-enumeration keyspace count | inspection | 1; tagged = 2 |
| `D5_2` | per-write gas/calldata delta | **measured** (F2 thin variant) | predicted ≤120 gas + ≈2,560 calldata gas |

Decision rule: adopt uniform iff `D1_2 = 0` ∧ `D2_2` passes with zero rewritten
historical Occurrences ∧ `D3_2` classifies all three points ∧ `D5_2` fits the
aggregate budget. Tagged is **rejected outright** if `D4_2 = 2` (author enumeration
probing two keyspaces = the candidate's "fractures portable EOA authorship" rejection
condition, candidate lines 261–263, VERIFIED). Present status: D1–D4 resolve in
uniform's favor by construction/inspection; the axis stays open only on `D5_2`.

### 4.3 Axis 3 — publication domain (B0 vs F3)

The four-vector matrix, run in BOTH cells [PROPOSAL — adopts BAKEOFF finding 9;
vector sources: b0-authorship-envelope.md §8 matrix + §12 categories 2–4]:

| # | Vector | Pass condition (per cell) |
|---|---|---|
| `V3_REPLAY` | cross-Realm replay of the signed publication | creates **zero** destination truth without destination admission/consent |
| `V3_SUBSET` | subset carriage of publication leaves | verifier concludes exactly the §7 CAN/CANNOT lists; truncated/reordered vectors MUST-FAIL |
| `V3_DOMAIN` | domain confusion between publication and intent/consent signatures | every §8 matrix row MUST-FAIL as specified |
| `V3_COPY` | copied signed evidence presented at a destination Realm | remains **verifiable** at the destination (authorship checkable from the bytes + public state) |

**Outright-rejection rule:** if the Realm-bound arm cannot keep copied signed
evidence verifiable at a destination (`V3_COPY` fails for F3), F3 is rejected
regardless of any gas advantage [DERIVED INVARIANT — candidate lines 155–158,
VERIFIED: "candidate syntax is not allowed to discard portable signed evidence
accidentally"].

**Tiebreaker (only if both arms pass all four):** `OVH_3` = per-authorized-admission
overhead of the separate intent (signature verify + nonce slot + intent calldata,
measured) vs F3's per-Realm re-signing cost on the cross-Realm fixture trace. If
B0's intent overhead breaks the aggregate budget, the required move is redesigning
the intent (the same-tx `admitAsSender` path already eliminates it for
sender-submitted writes — b0-authorship-envelope.md §5.4) before conceding the axis;
concession returns to James.

### 4.4 Axis 4 — Type/query identity (B0 vs F4)

Scripted event: ONE index-evolution event (a Type gains a canonical index) mid-way
through the Git and Arcade fixture timelines, executed in both cells.

Statistics:
- `FRAC_4` (scores Variant A) — fracture count: number of semantically identical
  Records with divergent RecordIds across schema generations after the event, plus a
  boolean: do cross-generation fixture queries need `TypeSuccessor/1`/
  `TypeEquivalence/1` evidence (b0-encoding-and-ids.md §6) **on the hot read path**
  (as opposed to display-time enrichment)?
- `BACKGAS_4` (scores Variant B) — backfill gas per historical record, measured on
  packed ordinals, wide-posting delta computed from F7 (declared 4×7 confound), plus
  the campaign length in transactions from §3.5's arithmetic.
- `GATE_4` (hard gate on Variant B) — the coverage vector suite: no sequence of
  reads during `DECLARED`/`BACKFILLING` may ever let backfill incompleteness answer
  as absence — every such read returns `PARTIAL` (or UNSUPPORTED-with-basis), never
  `COMPLETE`-empty. [DERIVED INVARIANT as a hard gate — candidate falsifier 6,
  VERIFIED: "index incompleteness can appear as absence" is rejection; the
  PARTIAL-until-proven-complete wording is candidate lines 294–298, VERIFIED.]

Decision rule [PROPOSAL — adopts BAKEOFF finding, axis-4 entry]: Variant B is
rejected outright if any `GATE_4` vector fails. Variant A is rejected if `FRAC_4`
shows cross-generation dedup breaking badly enough that equivalence evidence lands on
the hot read path of ordinary fixture queries. If both survive, decide by
`BACKGAS_4`-vs-`FRAC_4` weighed against the corpus's observed index-evolution
frequency — and since that frequency is a judgment call over a 50-year horizon, this
axis is a likely candidate for the "irreducible fork returned to James with evidence"
outcome rather than a self-deciding number.

### 4.5 Axis 5 — Envelope leaf carriage (B0 vs F5)

Statistics:
- `ONECALL_5` (hard gate, both arms) — the dependent-graph one-call fixture:
  Project → Release → Locator with dependent references admitted in ONE transaction
  in a FRESH Realm (bodies bundled or pre-admitted; b0-realm-admission.md §5.4
  REF-SAT). An arm that cannot do this fails the axis decisively [DERIVED
  INVARIANT — kickoff "one-call dependent writes" line 56 + constitution
  one-transaction gate, VERIFIED]. This trace is `MUST_FIT_ATOMIC`: over-cap
  fails the gate with `splitFactor=1`; the harness may not convert it into
  split throughput.
- `FRESH_5` — measured calldata + gas delta for fresh-unique publication.
- `REENDORSE_5` — measured calldata + gas delta for the ten-curator
  re-endorsement trace (candidate lines 176–181; ten Occurrences of one
  already-admitted Record).
- `DERIVED_FSTAR_5` — optional break-even endorsement frequency derived from
  `FRESH_5` and `REENDORSE_5` only under an explicit linear-mixture assumption.
  It is a derived model, never an observed crossover. The direct adoption
  statistic remains the corpus-weighted sum of measured endpoint rows.
- `SUBSET_5` — the subset-carriage suite result in F5 (3×5 interaction; §1.3).

Decision rule: if F5 fails `ONECALL_5`, B0's inline arm wins decisively.
Otherwise decide from the direct corpus-weighted measured total using the
observed fresh/re-endorsement mix. `DERIVED_FSTAR_5` may explain the result only
with its linear-mixture assumption shown. If the observed mix is not
representative, report both endpoints and return the surviving fork; do not
interpolate a verdict. Storage dedup
is explicitly OUT of scope — admitted Record bodies are state-readable in both arms
[DERIVED INVARIANT — candidate lines 172–174, VERIFIED], so only carriage and
admission-path costs differ.

### 4.6 Axis 6 — physical deployment (B0 vs F6)

- `SIZE_6` (**week-one compile gate — run before any other measurement**): compile
  B0's monolith with the pinned compiler/optimizer settings; compare runtime
  bytecode size against EIP-170's 24,576-byte limit [standards FACT — EIP-170
  binds; EIP-7907 did not ship in Fusaka: PLAUSIBLE per the STANDARDS audit lane,
  re-verify at run time]. If the monolith exceeds the limit of the intended Realm
  profile, **the axis is decided (modular or split forced) before any bakeoff
  runs** — and conversely each F6 module must individually fit. [PROPOSAL — adopts
  BAKEOFF finding, axis-6 entry.]
- `OVH_6` — per-admission gas overhead of the module boundaries: `G_F6 − G_B0` on
  identical fixture traces, decomposed per boundary (expected order: ~2.6k cold
  account access + calldata re-encode per crossing; arithmetic preview only —
  measured value governs).
- `PFAIL_6` (hard gate) — the adversarial matrix: reentrancy across modules
  (malicious 1271 account re-entering `Admission` during witness verification;
  cross-module callback attempts), partial-commit probes (forced revert in `Index`
  after `Binding` wrote — any observable partially-committed Core write is
  rejection), malformed/unbounded returndata from a module, and module-substitution
  (wrong-address wiring caught by codehash pinning). Any partially-committed write
  ⇒ the modular arm is rejected or redesigned [DERIVED INVARIANT — candidate lines
  351–353 "all commit or all revert", VERIFIED; kickoff attack list lines 112–113].
- `ANALYSIS_6×7` — the §3.7 written coupling analysis (obligatory report section).

Decision rule: `SIZE_6` can decide the axis alone in week one. Otherwise B0's
monolith survives unless `PFAIL_6` finds a monolith-specific failure (none is
expected — the matrix mostly attacks F6) AND F6 is adopted only if `OVH_6` is within
the aggregate budget and `PFAIL_6` is clean.

### 4.7 Axis 7 — index pointer (B0 vs F7, sign-checked in X17)

Three numbers [PROPOSAL — adopts BAKEOFF finding, axis-7 entry]:

- `APPEND_7` — amortized gas per posting append (packed: predicted ≈13.4k
  amortized; wide: ≈2 SSTORE-new ≈44k — b0-indexes.md §9/§10, PLAUSIBLE schedule;
  measured values govern).
- `PAGE100_7` — gas per 100-item page read **including** the ordinal→RecordId
  dereference for the packed arm (which the wide arm partly avoids), raw and
  hydrated, cold.
- `EXH_7` — exhaustion horizon: **imported arithmetic, already done — no prototype
  needed** (b0-indexes.md §1.1, VERIFIED): uint32 exhausts at a sustained 1.36
  writes/s over a century → [REJECTED — that section's arithmetic]; uint48 gives
  891.9 years at a sustained 10,000 admissions/s (5 ordinals/slot); uint64 doubles
  slot usage for headroom no EVM Realm can use. The packed arm's `EXH_7` is
  therefore closed by analysis; the wide arm has no exhaustion dimension.

Decision rule: compute the corpus's read/write ratio per postings family (B0
instrumentation, §3.1); the century-cost comparison is
`w · ΔAPPEND_7 + r · ΔPAGE100_7/100` per item with (w, r) from the corpus. Adopt the
sign — **but only after X17 confirms the sign holds under the S record shape**
(`I_17` small, or same-sign per-workload deltas), since posting cost sits inside the
same aggregate totals that decide axis 1 (§1.3). If the signs disagree across shapes,
the axis-7 verdict is published conditionally on the axis-1 outcome.

---

## 5. Analysis-only items — moved OUT of the prototype matrix

Each item below consumes no engine and no cell; each has named acceptance criteria so
"analysis-only" is a deliverable, not a shrug. [PROPOSAL — adopts BAKEOFF finding
"deliverable (d) consolidated"; this directly serves the kickoff's
smallest-responsible-prototype framing.]

1. **Axis 8 — Type-identity qualification (namespace vs spec commitment).**
   Executed: b0-encoding-and-ids.md §8 (analysis + labeled recommendation
   S-with-qualifier). Acceptance criteria: (a) the written analysis names both
   options' failure modes with evidence; (b) golden vectors `T-CONV`/`T-QUAL` exist
   and pin whichever arm is adopted; (c) adoption is a James decision after the
   bakeoff round — silence adopts nothing [PM directive, VERIFIED]. Status: (a) and
   (b)-specification done; (c) open.
2. **Axis 7 exhaustion component.** Executed: b0-indexes.md §1.1 (the arithmetic
   table with derivations in-chapter). Acceptance criteria: rates stated as named
   assumptions (10,000 admissions/s sustained); uint32 rejection recorded with its
   kill arithmetic; revert-not-wrap behavior specified (`ERR_ORDINAL_EXHAUSTED`).
   Status: done; the harness only re-checks the stated rates against fixture reality.
3. **Axis 6 code-size gate.** `SIZE_6` is a compile-time fact, not a prototype
   measurement — but it is scheduled INSIDE the matrix as the week-one gate (§4.6)
   because its outcome can delete cells. Acceptance criteria: sizes reported per
   contract at the pinned compiler settings; the EIP-170 figure re-verified against
   the intended Realm profile at run time.
4. **Most of axis 2.** D1–D4 are conformance vectors, a scripted fixture, and an
   inspection (§4.2) — no engine. Acceptance criteria: each vector exists in the
   corpus with pass/fail wired to the named statistic; only `D5_2` consumes harness
   time (on the F2 thin branch).

---

## 6. Build-once subsystems and the frozen-corpus rule

### 6.1 Build-once subsystems (axis-invariant; per BAKEOFF finding 10)

Built exactly once, on B0, and reused by every cell via the §3.2 occurrence-identity
adapter where needed (F1/X17 only):

| Subsystem | Source of truth | Per-cell variation |
|---|---|---|
| Binding/Withdrawal state machine (T1–T9, exact kernel Type schemas, CAS, no-resurrection, absence predicate, Admission-only lifecycle context, point-in-order shadow + assert-only journal) | b0-binding.md §3–§6; b0-authorship-envelope.md §3.2–§5.3; b0-indexes.md lifecycle seam | none except the OccurrenceRef adapter (F1/X17), F1's one-leaf degeneration/aggregator rollback boundary, and `expectedRevision` carriage (F3, §3.4); error 17, fixed TargetRecordCommitment evidence, and closed role-class/KIND_DIGEST split are shared |
| LensResolver (`ResolutionPlan/1`, three-field `ResolvedTarget`, combiners, resolve algorithm, risk-bearer ABI) | b0-lens.md §3–§8 | none — plans are Records in every cell; head reads cross a boundary only in F6 |
| AuthorityVerifier/1 + AccountPrincipal/1 | b0-principal-authority.md §2–§3 | none except F2's AuthorRef entry |
| Realm descriptor / receipts / reconstruction walk (seven-field InitConfig, authority ref/transitions, EIP-1967 facts) | b0-realm-admission.md §2, §5, §7–§8 | card-spine re-expression of W-3..W-5 in F1/X17; module-set genesis hash in F6; no cell may hide or reinterpret controller state |
| Content Type family + 50 GB client machine (ArtifactClosure STRING(255), structural/profile split) | b0-content-locators.md | none (client-side; not a gas cell) |
| **Lens benchmarks** | b0-lens.md §9 + hf §2.5 | **run ONCE on B0**: Core `N={1,8,32,64}`; separately TS/RS client `N={50,100,256}` on pinned mobile+desktop profiles, never as 100/256-entry on-chain Plans. A single N=64 spot-check inside F6's `OVH_6` captures the head-read boundary crossing. |

### 6.2 The frozen-corpus rule [PROPOSAL — binding harness discipline]

**No cell is measured before the fixture corpus and workload scripts are frozen.**
Concretely:

1. The corpus = the kickoff's generic workload fixtures (kickoff lines 120–144:
   Arcade trace, Git/Markdown trace, Nanda, contract configuration, universal
   Topic/ownerless literal, sensitive-Record vectors, 50 GB staged-verification
   trace, EAP **provisional and non-gating** per the PM directive) + the adversarial
   workloads of the measurement gate (lines 102–107: hot values, spam, decades of
   churn, withdrawals, revocations) + every chapter's golden-vector categories
   (b0-encoding-and-ids.md §10; b0-authorship-envelope.md §12;
   b0-principal-authority.md §10; b0-binding.md vectors; b0-lens.md §12;
   b0-content-locators.md §13) + the axis vectors named in §4.
2. The fixtures/measurement lane publishes a **corpus manifest**: a content hash over
   every fixture file, workload script, compiler version, optimizer setting, and EVM
   profile. Every cell report embeds the manifest hash it ran against.
3. **Any corpus change invalidates every previously measured cell** — cross-cell
   deltas are attributable to the flipped axis only if literally everything else is
   byte-identical. Re-running is the only cure; no "the change was small" waivers.
4. The corpus is instrumented once, on B0, for the decision-rule inputs that describe
   the workload itself: `DIST_1` (batch sizes), endorsement frequency (§4.5), and
   read/write ratios (§4.7).

### 6.3 Measurement ground rules

- **One aggregate snapshot per cell.** The mandatory bundle (baseline families +
  reference families + digest lookup + author index + revocation-aware counters +
  best-locator view) is priced as ONE gas snapshot per cell against the corpus, never
  as per-capability line items to be individually bargained away [DERIVED
  INVARIANT — onchain-completeness.md §4 via b0-indexes.md §9, VERIFIED: "the
  gas-cheapest do-nothing is always the Tier-3 outcome"]. Writer opt-out is not a
  cost lever in any cell [OWNER RULING — mandatory automatic indexing,
  owner-rulings.md 2026-07-15 item 12, VERIFIED via b0-indexes.md §0].
- **EIP-7825 arithmetic accompanies every batch/page bound.** The cap is 16,777,216
  gas per transaction, live L1 since Fusaka 2025-12-03 [standards FACT — VERIFIED
  via the intake audit]. Existing chapter arithmetic carried into the harness:
  worst-case B0 publish ≈12.9M (b0-realm-admission.md §5.6) / ≈13.1M
  (b0-authorship-envelope.md §2.5) — the two models are reconciled by the
  synthesizer, and the harness replaces both; index-only leaf ceilings ≈25 worst /
  ≈86 typical per tx (b0-indexes.md §9); F4 backfill scans the exact maximum
  16 admission ordinals per CAS step (§3.5); page maxima §5.3 of
  b0-indexes.md. Axis 1 executes every frozen
  integer `k=1..64`; each exact k reports measured fit or `OVER_CAP` under its
  unchanged `MUST_FIT_ATOMIC` class. Per-Realm caps may differ; every report states the assumed profile
  [DERIVED INVARIANT — venue-conditional physics, CARRY-IN lane, VERIFIED].
- **Pinned toolchain.** One solc version + optimizer setting + EVM version
  (Fusaka-level so 7825/7623 semantics hold) across ALL cells, recorded in the
  corpus manifest. Values TBD by the harness lane — what decides them: latest stable
  foundry/solc at freeze time.
- **Schedule-derived figures in the chapters are inputs, not results.** Every gas
  number quoted from a chapter above is [PLAUSIBLE/HYPOTHESIS] until the harness
  replaces it; decision rules bind on measured values only. Every affected
  write/read cost is repriced after SR-10's extra OccStatus write and the
  repaired index/log layout; no pre-repair derived value may survive as a
  Stage B observation.

---

## 7. Engine count and construction discipline

**~4 distinct engines cover all 9 cells** [PROPOSAL — adopts BAKEOFF findings 6 and
"analysis-only", which shrink "9 cells" to "roughly four engines"]:

| Engine | Cells | Contents |
|---|---|---|
| **α** | B0 + branches F2, F3, F5, F7 | the reconciled eight-chapter spine; branches touch, respectively: author-key derivation (F2), signing/consent path (F3), leaf-availability rule (F5), `LibIndex` internals (F7) |
| **β** | F1 + branch X17 | the FLATCARD card surface (§3.2); X17 swaps `LibIndex` internals |
| **γ** | F4 | split-ID schema publication + coverage machine + backfill |
| **δ** | F6 | the physical six-contract deployment |

**Lean compile-time branches, NOT runtime parameterization** [PROPOSAL — BAKEOFF
finding 6's construction rule]: each branch is a separate compiled artifact of the
same codebase (feature-flagged at compile time / separate source directories), never
one engine with runtime mode switches. Rationale: a runtime-parameterized engine
carries dispatch and storage-indirection overhead in EVERY cell, polluting every gas
number with abstraction cost that no production deployment would pay; compile-time
branches keep each cell's bytecode honest while sharing tests, fixtures, and the
harness. The corollary discipline: shared code paths must be byte-identical across
branches (assertable by comparing compilation artifacts of untouched modules), so a
branch's delta is provably confined to its flipped axis.

Engines are disposable prototypes on a throwaway contracts worktree; nothing deploys
beyond local/test chains, seeds durable data, or becomes a product dependency
[DERIVED INVARIANT — kickoff lines 169–171 + PM directive line 20, VERIFIED].

---

## 8. Reporting format and adoption protocol

Each cell produces one report: {cell id, axis vector, corpusVersion from the
restricted-JCS manifest and exact domain bytes,
engine + branch commit, aggregate snapshot per fixture trace, state-growth
table (slots per trace), `atomicityClass/overCap/splitFactor`, canonical
binary-registry `resultSchemaId/resultDigest`, typed outcome namespace/code/
argument digest, logical `stateDigest`, `crossImplEqual`, exact
Realm/basis/high-water/coverage metadata, the axis's named statistics (§4),
declared confounds restated, vector-suite pass/fail lists}. Axis-1 reports the
complete 64-row B0/F1 table, `coreCallCount`, and `aggregatorGas`; omitting any
integer k or selecting points after observing results invalidates the report.
Every affected report carries the atomic schema-group cap result plus the
`CV-SPARSE-ADMIT`, `CV-PREWITHDRAW`/`T4-MAX-BODY`, `CV-SHADOW`, `CV-DIGEST-LOOKUP`,
`WL-DEAD-LOCATOR`, and `CV-LAST-LIVE-COUNT` outcomes; a cell that cannot
implement the repaired semantic test is blocked rather than silently omitted.
The per-axis verdict section applies §4's decision rules and ends
in exactly one of:

1. **arm survives** (baseline retained — nothing is thereby adopted; the B0 pin
   simply stands un-falsified);
2. **arm rejected** (names the kill statistic/gate — enters the [REJECTED] register
   with the report as kill source);
3. **irreducible fork → James** (both arms survive their gates and the deciding
   weight is a value judgment — expected for axis 4, possible for axes 1 and 7; the
   report carries both arms' full numbers per the return-to-James rule).

Silence never adopts; no cell result promotes a design; James is asked only at
genuine irreducible forks after evidence [PM directive, VERIFIED — final line].

---

## Interfaces exposed

The compact contract other chapters and the harness lane rely on:

- **Cell identifiers and axis vectors** (§2 table): `B0, F1, F2, F3, F4, F5, F6, F7,
  X17` with arms `(1:E/S, 2:U/T, 3:P/R, 4:A/B, 5:I/L/–, 6:M/D, 7:O/W)`. Any future
  cell must declare its vector and its confounds in this notation.
- **The amendment**: one-flip discipline everywhere except the two declared compound
  cells F1/X17; valid lattice = 96 cells; interactions 1×7 (cell), 1×2 (arithmetic),
  4×7 (arithmetic), 3×5 (shared suite), 6×7 (analysis).
- **Occurrence-identity adapter** for arm S: `OccurrenceRef ≡ (CardId, leafIndex=0)`,
  `occKey` formula unchanged — the seam that lets Binding/Lens/indexes build once.
- **Named decision statistics** (harness output schema): `KSTAR_1, PREMIUM_1,
  RECON_1, DIST_1; D1_2..D5_2; V3_REPLAY, V3_SUBSET, V3_DOMAIN, V3_COPY, OVH_3;
  FRAC_4, BACKGAS_4, GATE_4; ONECALL_5, FRESH_5, REENDORSE_5,
  DERIVED_FSTAR_5, SUBSET_5; SIZE_6, OVH_6, PFAIL_6;
  APPEND_7, PAGE100_7, EXH_7; I_17`.
- **Axis-1 measurement surface:** every integer `k=1..64` is frozen and run;
  B0 is one tx/one Core publish/one k-leaf envelope, while F1 is one atomic tx
  through the stateless harness aggregator making k ordinary Core publishes.
  Both are `MUST_FIT_ATOMIC`; F1 aggregator overhead is a separate row field.
- **Hard gates that reject regardless of gas**: `RECON_1` (state-only
  reconstruction, both arms), `V3_COPY` (copied-evidence verifiability), `GATE_4`
  (PARTIAL never reads as absence), `ONECALL_5` (one-call dependent writes),
  `PFAIL_6` (no partially-committed Core write), plus `SIZE_6` as a
  forced-decision compile gate. `ONECALL_5`, the exact FX-GIT 20-ref/21-leaf
  push unit,
  TypeSchemaGroup validation/cache materialization, every concrete publish,
  and poison/full-revert vectors are `MUST_FIT_ATOMIC`; over-cap never converts
  to a throughput split.
- **Frozen-corpus rule** (§6.2): corpus manifest hash embedded in every report; any
  corpus change invalidates all measured cells.
- **Build-once list** (§6.1) incl. separate run-once Lens grids: Core
  1/8/32/64 and client 50/100/256 on mobile/desktop reference profiles.
- **Engine map** (§7): α{B0,F2,F3,F5,F7}, β{F1,X17}, γ{F4}, δ{F6}; compile-time
  branches; untouched-module byte-identity assertion.
- **Report/verdict protocol** (§8): survives / rejected(kill source) / fork→James.

## Open items

1. **Corpus manifest implementation and the fixtures/measurement lane's ownership** of the
   freeze mechanics (§6.2) — this spec pins the rule, not the file format. Closed
   by: harness lane.
2. **Toolchain pin values** (solc version, optimizer runs, EVM version string) —
   §6.3. Closed by: harness lane at freeze time.
3. **F5m Merkle sub-variant** — measured only if the direct
   `FRESH_5`/`REENDORSE_5` corpus-weighted result is inconclusive or the
   subset-proof cost becomes decision-relevant (§3.6). Closed by: axis-5 first-round
   numbers.
4. **F6 spot-check scope** — whether one N=64 Plan-walk spot-check suffices to bound
   the Lens boundary overhead or the full 1/8/32/64 matrix must re-run on δ (§6.1).
   Closed by: `OVH_6` decomposition quality on first measurement.
5. **EAP fixture** — provisional and non-gating per the PM directive; if the durable
   brief lands before corpus freeze, it enters the manifest; afterwards, it waits
   for the next full re-run. Closed by: Codex brief + harness lane.
6. **Additivity risk beyond the five named interactions** — the claim that 1×7,
   1×2, 4×7, 3×5, 6×7 exhaust the strong interactions is PLAUSIBLE (BAKEOFF finding
   4); the red team is invited to name a sixth pair with a mechanism, which would
   cost either a cell or an arithmetic-recovery argument. Closed by: red-team round.
7. **Axis-4 fork anticipation** — §4.4 predicts axis 4 ends as an irreducible fork;
   if so, the James packet needs the index-evolution frequency assumption made
   explicit (50-year horizon judgment). Closed by: Stage B numbers + synthesis.
