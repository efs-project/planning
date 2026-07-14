# FS Pass — Completeness critic: gaps, contradictions, fatal triage, and THE consolidated freeze-sensitive reservation set

**Role:** completeness critic over the whole 2026-07-10 filesystem-features pass (7 lane reports + 5 red-team reports).
**Inputs read:** fable-fs-kickoff.md and fs-feature-space.md (coverage baselines); all 12 pass files in this directory (lane digests cross-checked against files; attack reports read in full where fatal-class claims live).
**Date:** 2026-07-10

---

## 0. Verdict in one paragraph

**The pass survives consolidated review and is strong.** All nine kickoff questions received answers with cause; the meta-sorting (essential vs artifact) is near-complete, with a short named remainder (§1); no mission end was breached anywhere; no lane's central ruling was destroyed by red team. Four fatal-class findings exist and **all four are real** (§3) — but every one is repairable before the ceremony, and two of them (keyWrap A1/A2) live in a red-team file that is **absent from the digest layer**, which is itself the pass's sharpest process hazard (§1-G0). One blessed pattern is overturned (B3-public collaborative documents), one previously-accepted verification item is corrected with double independent confirmation (verify-time-model fix 6 → recency beacon), and one lane-vs-lane Etched contradiction (path grammar) must be reconciled before any vector is cut — including a value discrepancy (MAX_NAME_BYTES 255 vs 512) that the boundary red team **mis-reported as agreement**. The pass's most load-bearing output is the consolidated reservation set in §4. The pass's biggest systemic risk is not any single row — it is **convention-dialect fragmentation**: ~20 explicit convention-not-row rulings with no consolidated registry, no named conformance-vector owner, and one unwritten Durable spec (the lens-object encoding) that at least five results now lean on.

---

## 1. GAPS — territory nobody covered, or covered without an owner

Checked against the kickoff's feature-space map (11 clusters + long tail + cross-cutting) and wider. Cluster coverage is complete: every kickoff cluster has a lane, every lane was red-teamed (the deletion-privacy lane's red team exists as a file even though it never made the digest layer). The gaps below are what remains.

### G0. The digest layer silently dropped the deletion-privacy red team (process-fatal if uncaught)
`attack-privacy.md` (red team on deletion-trash-privacy) exists on disk and contains **two FATALs (A1 occurrence-key recipient oracle; A2 keyWrap dual-role PIN contradicting deterministic-ids §5/§13) plus seven serious findings (S1–S7)** — none of which appear in any digest handed downstream. A synthesis that works from digests alone Etches the keyWrap row broken. **Rule for the synthesis: the file set, not the digest set, is the record.** Diff every digest against its file before ruling.

### G1. The lens-object canonical encoding — the most-depended-on unwritten spec in the pass
The access lane flagged it (correctly) as CONVENTION-not-row: no normative encoding exists for a lens as data — ordering, subtree scoping, deny-set reference, `MAX_LENS_INCLUDE_DEPTH`, and (new this pass) a **canonical lens identity** stable enough to cite. It is now load-bearing for at least: (1) team membership and the remove-member sweep; (2) delegated `act` expansion and its completeness rule (attack-access-mount A2); (3) the authority-STALE exclusion rule (attack-access-mount A5); (4) **snapshot/fold lens-binding** — attack-collab C requires `lensIdentity` in every fold-snapshot frontier descriptor, and attack-time-versioning A4 requires basis records to declare retrospective-vs-as-experienced view parameters — both need a canonical way to *name* a lens; (5) the P9 roaming payload, which *is* this object encrypted. **Gap = no owner and no doc.** Not freeze-bound, but ship-order-critical: it must exist before any third-party client ships teams, snapshots, or bases, or dialects fork exactly where the kickoff warned. Recommendation: commission it as the first entry of the conventions registry (G2), co-owned by read-lens-spec + SDK, with vectors.

### G2. No conventions registry / conformance-suite owner
The pass produced on the order of twenty explicit convention-not-row rulings (§4-H), each individually correct, each carrying "dialect risk accepted" — and no consolidated home, no registry document, no named owner of the conformance vectors that every lane invokes as the mitigation. This is the pass's #1 recurring risk restated as a deliverable gap. Recommendation: one `efs-conventions` registry doc (cookbook-adjacent, Durable) enumerating every blessed convention key shape + its vectors; the synthesis names an owner. Without it, the freeze-safety the row-vs-convention discipline bought is spent on fragmentation instead.

### G3. Gas measurement is a blocking prerequisite nobody owns as a task
Every cost-bearing ruling in the pass — the A2 bundle (spine + tag index + target index + admittedAt + revokedAt), FS-3's 0-to-~22k/claim spread, the AND cost model (already shown miscalibrated ~2× on rejection-heavy shapes), eager-compaction pricing — rides estimates. The freeze-gates B gas snapshot must be commissioned and land **before** the James decision memos are written, or the memos ship numbers two red teams already flagged as unratifiable. Named task, named owner, sequenced before §5's decision sheet.

### G4. Unsorted long-tail remainder (the meta-question's residue)
The essential-vs-artifact sorting is otherwise complete (access lane's POSIX table, consistency's 18-row table, deletion dispositions, timestamps, hardlinks, locking). Still unsorted — each needs one stated answer, none is hard:
- **`contentEncoding` / compression** — feature-space §11 names it "reserved-key territory"; no lane ruled row-vs-convention and no `contentEncoding` row exists in the reserved table. Recommend: CONVENTION (fold into contentType parameters or a user-key VAL), stated explicitly.
- **Copy / duplicate / reflink semantics** — "copy = new DATA + PINs (or sameAs edge)" was a feature-space [reasoned] foothold no lane confirmed. The real question is provenance: a copy mints a new owned identity (citations/backlinks don't follow), vs a re-PIN shares identity. One cookbook paragraph; matters for "Save As" UX.
- **`sameAs`** — zero mentions across all 12 files. Settled base, but the copy/dedup/alias story brushes it; the synthesis should confirm its render-only status survives the pass's new link semantics unchanged.
- **REF-to-property annotation role** — kickoff listed it as an already-reserved slot worth checking; no lane consumed or confirmed it. One-line confirmation at the ceremony that its reservation shape is still wanted.
- **Genesis well-known namespace** — attack-privacy S6's (correct) WHITEOUT re-encoding introduces a genesis TAGDEF object (`/.well-known/whiteout`). If adopted, the genesis manifest acquires a well-known-objects namespace **by accretion**. Rule it once: is there a reserved `efs.well-known` genesis subtree, what else lives there, and is its membership ceremony-frozen? Freeze-adjacent (manifest rows are now-or-never).

### G5. Multi-venue watch composition
The watch pattern is specced per-venue (three cursors + logs + hints). The OS will watch N venues and must merge cursors, dedupe claims seen at multiple venues, and grade cross-venue "new." All the pieces exist (claimId identity, earliest-admittedAt); the composed pattern is unwritten. Indexer-lane/cookbook grade; name it in the handoff so it isn't rediscovered as a bug.

### G6. What is now covered that the kickoff feared wasn't
For the record, these are NOT gaps (checked): streaming/range/mmap (consistency #8, re-homed transport); sparse files (gone); directory listing semantics (mount M3 fixes); watch/inotify (query lane + W1 demotion); schema/CREATE CONSTRAINT (query lane); backlinks (R1); path grammar (two lanes — over-covered, see §2-C2); the FS-5 beacon and FS-6 basis, which the time lane flagged as un-red-teamed, **have now both been attacked** (attack-time-versioning tried and failed to break the beacon; basis drew A4/A5 with fixes) — the residual is only the beacon's chain-dependence (blockhash lookback), already named.

---

## 2. CONTRADICTIONS between lanes, with recommended resolutions

Ordered by consequence. "Resolution" = what the synthesis should write; items marked ⚖ go on the James sheet instead.

**C1. Freshness anchor: os-contract + consistency bind verify-time-model fix 6; the owning time lane proved it fail-open and reversed it.** (attack-boundary-os Z1; independently re-verified by attack-time-versioning, which tried to rehabilitate fix 6 and failed — any venue's admittedAt lower-bounds signing time, so admission-anchored freshness fails open at home too.) **Resolution:** adopt the time lane's direction split everywhere: `admittedAt` = existence-since only (cooldowns from this venue's own admission; predate upper bounds; write-once per venue); the **recency beacon** (FS-5) = the freshness anchor; replica admittedAt never. One-line edits to os-contract fence 4, G8 ("freshness" out), FM-O1, consistency §6.2 — before the read-lens revision lands.

**C2. Path-segment grammar: consistency lane admits leading `~` and pins MAX_NAME_BYTES=255; namespaces lane rejects leading 0x7E, adds bidi/Cf-control rejection per a pinned IDNA2008/UTS-46 profile, and recommends MAX_NAME_BYTES=512.** Both are loud Etched recommendations on the same tagId-derivation surface, neither cites the other — and the boundary red team's reconciliation (Z2) **mis-reported the length cap as agreed at 255**. Three-layer defect: two lanes disagree on two axes (tilde, cap) and the red team hid one axis. **Resolution:** one pre-ceremony grammar pin: adopt the namespaces **reject-set** superset (empty / `.` / `..` / U+002F / C0+DEL / leading 0x7E / bidi + Cf controls per pinned profile / unassigned codepoints), byte-exact case after NFC, Unicode-version pin confirmed, kernel-vs-SDK NFC enforcement sentence reconciled — and an **explicit cap ruling**: recommend **255** (POSIX NAME_MAX Schelling point, smaller state; the namespaces 512 rationale is thin), decided in the pin with one paragraph, vectors including a boundary case. Ceremony-blocking.

**C3. claimedAt shape and semantics: time lane FS-2 "always present, 0 = absent" vs os lane "optional trailing word" vs the falsifier/scheduled-publication self-contradiction (attack-time-versioning A3).** **Resolution:** FS-2's shape wins (always-present uint64, 0 = no testimony, second-to-last trailing word before expiresAt, ASSERT PIN/TAG bodies only, REVOKE excluded); semantics = **performed-at only** (≤ signing time); "scheduled-for" is payload content per FS-8's own validity-windows-are-content logic; falsifier runs forward only (`claimedAt > earliestAdmittedAt + slack` = proven false), backward is a labeled heuristic rendered "unproven-early" never "detected backdate" (also fixes os-contract P13(a)/§6.3, Z5); derive the slack constant rather than borrowing 600s unexamined. The deletion lane's privacy rider (private tier SHOULD write claimedAt=0) composes cleanly with always-present. ⚖ The row itself is the A.8b James decision; this is the recommended shape.

**C4. "Merge latest = admission-time" (kickoff lean) vs FOLD-2 (collab) + comparator fences (time lane).** The kickoff explicitly wired the blessed collab pattern to admission-time recency; the collab lane refuted it (venue-relative document state breaks replication convergence) and the time lane independently fenced admittedAt out of all comparators. **Resolution:** the correction is pass-canon: admission time is evidence and basis-selection input, never a fold input or supersession key. Additionally **restore verify-time-model fix 4** (the comparator fence sentence), which the time lane argued for and then silently dropped from its shipping set (attack-time-versioning A1): add to FS-3 + handoff, worded to permit venue-labeled as-of filtering and existed-by evidence.

**C5. WHITEOUT encoding: deletion lane F6(a) "reserved sentinel target word, zero kernel semantics" vs attack-privacy S6 (self-contradictory — a new legal targetKind class IS kernel surface) vs mount lane's union-mask semantic ask.** **Resolution:** adopt S6's cleaner encoding — genesis reserved TAGDEF object (`/.well-known/whiteout`) + ordinary REF-PIN targeting it; no change to the closed targetKind enumeration; read behavior genuinely Durable; only the genesis manifest row is now-or-never. Attach the mount lane's one-sentence union semantics (honored whiteouts mask graft-lower names in the R-A2 union). Cross-author tombstone stays a deny-advisory convention (both lanes agree — no second removal spelling). Correct the freeze-gates §C "additive-later" label accordingly. Triggers G4's well-known-namespace ruling.

**C6. keyWrap: deletion lane F2 (dual-role PIN+TAG; occurrence key = H(recipientEncKeyId)) vs deterministic-ids §5/§13 (explicit cardinality-1 exclusion) and vs its own L3 anonymity mitigation (A1 oracle).** **Resolution:** do not Etch F2 as written. Default recommendation: **TAG-only** exactly as deterministic-ids routed it, owner escrow = a wrap TAG with a reserved self-occurrence-key (costs one extra slot read, zero freeze conflict); occurrence keys **random by default in the private tier** (granter keeps a local recipient→occurrenceKey map; recipient trial-decrypts at the O(wraps) cost L3 already accepts), `H(recipientEncKeyId)` demoted to a public-sharing convenience with the oracle named in the row spec. ⚖ If the O(1) PIN escrow is still wanted, that is an explicit James override of a stated exclusion with an amendment line in deterministic-ids — never a silent pin.

**C7. B3 public documents: collab lane blesses appendOnly-public for public/adversarial docs; attack-collab proves the public case impossible (fatal, §3-F1) and appendOnly-public a DoS amplifier.** **Resolution:** adopt the red team wholesale: strike "public" from B3's envelope; public / open-world / churning-membership documents route to B2 (revision-DAG + human merge, DoS-resistant by construction); B3 survives only on blinded, capability-gated, stable-membership containers with the reader-cost model corrected to O(causal closure); FOLD input redefined as causal closure of the trusted set ("lens masks content, never membership"); mergeRule must additionally pin `clientId = f(authorWord, deviceBits)` (attack D), which raises P10 to FOLD-1-correctness-blocking; snapshot recipes become lens-bound (lensIdentity in the frontier; ≥2 independent snapshotters for long-lived docs); §7's edit-war resolver corrected from merge to curation (a covering merge ends quiescent forks; an active war is ended only by curation). Note the structural corollary for James's privacy instinct: **the privacy tier is availability infrastructure**, not just confidentiality — blinding is what makes fine-grained collaboration buildable at all. ⚖ Ratify the demotion (it reverses a lane's blessed pattern and re-scores the kickoff's "highest-value question": the CRDT dismissal was right about the kernel AND substantially right about the read layer for op-dependent CRDTs; what's genuinely reclaimed is the op-independent family — B4, counters, OR-sets — plus records-vs-views).

**C8. View-parameter pinning: the same defect independently in two lanes.** Collab snapshots omit the lens from the frontier descriptor (attack-collab C); time-lane bases pin creation-time (Thursday's) lens/deny/evidence for a Tuesday anchor and never rule the grading clock (attack-time-versioning A4). **Resolution:** one pass-wide rule: every materialized-view artifact (fold snapshot, basis, manifest) declares its **view parameters** — lens identity, deny reference, evidence anchor, and whether parameters are retrospective (today's lens over Tuesday's data) or as-experienced (the viewer's own on-EFS lens claims anchored through the same asOf machinery) — plus the anchor clock. GATE consumption of historical folds: the gate picks the lens (closed author set the gate declares) and re-folds; EXACT/venue-conjoined anchors only for audit gates (attack-time-versioning A5: BASIS-OPEN is author-forgeable backward — rename the caveat "author-mutable past," conjoin `admittedAt ≤ block` at the recorded venue). Depends on G1 (a canonical lens identity to pin).

**C9. P10 device-bit allocation: os lane (roster-assigned lowest-free, random fallback, re-enroll-on-clone) vs collab lane (persistent random + collision-regeneration).** **Resolution:** one SDK-normative convention, os shape (roster-assigned; random IS the fallback), carrying the collab lane's launch-blocking flag, attack-D's clientId derivation rule, and the private-roster variant (public `device:<name>:<id>` labels are a fingerprinting surface). One owner: the SDK spec.

**C10. authorHead as a watch cursor: query lane presents it complete; codex-kernel calls it a venue-local hint; out-of-order admission (submitSubset resume, couriers) makes head-diffing silently miss backfills including late REVOKEs.** **Resolution:** demote to hint; per-author completeness = venue spine cursor (claimCount + filtered delta scan) or the log lane.

**C11. Admission-order neutrality: consistency §1.3.9/§2.2 and os-contract G8 say "not gameable"/"trustworthy cutoff"; the sequencer/relayer/builder manipulates order at creation (reorder, delay, censor) within the batching window.** **Resolution:** tamper-evident-but-not-neutral qualifier everywhere the claim appears; precedence/cutoff-sensitive apps submit multi-venue and anchor on earliest admittedAt; auction-grade neutrality is a venue-selection criterion, not a protocol property.

**C12. Batch atomicity: os-contract G4 "all-or-nothing per venue, resumable in chunks" is internally contradictory; submitSubset partial admission is first-class, so batches tear at the writing venue for the whole resume window.** **Resolution:** scope the guarantee to single-transaction full-envelope submit; "torn at any venue including home"; cookbook resume flow puts the manifest/root record in the final chunk. Feeds the OS pending/confirmed/final taxonomy (handoff §6).

**C13. Offer/accept pattern holes (X1–X3) + quiet P1 dependency.** Contingency invisible to the grade vocabulary (offer halves MUST live under app-vocabulary keys, never reserved/FS-semantic slots); post-acceptance expiry decay (default fix: consolidation re-assert on acceptance; the admittedAt-window alternative is another P1 rider); unilateral post-acceptance revocation (joint facts are evidentiary-permanent, currency-unilateral; escrows condition on admission facts, never instantaneous LIVE state). **Resolution:** cookbook entry with vectors, all three rules; list the X2 rider in the P1 memo.

**C14. Label collision: "P12" used for both the housekeeping banners item and the discovery-index gas sign-off.** **Resolution:** rename all discovery-index sign-off references to "freeze-gates A2 kernel-state-cost sign-off." Editorial, but in the decision-tracking surface.

**Recorded agreements worth keeping visible (not contradictions):** act vs persona-link as distinct relations (os + access converge — anti-laundering); P7 citation-pinning from two directions (os + namespaces); the exclusion hunt returning empty three ways (consistency, access, attack-access-mount); revoke-echo/lock/coupled-admission/batchId/quorum-grade rejects confirmed under attack; delegate-set completeness (attack-access-mount A2's fix) is the same rule persona stitching needs in wallet-and-actions — write it once.

---

## 3. FATAL TRIAGE — real vs overclaimed

Four fatal-class claims exist across the five red teams. **All four are real; none destroys the pass; all are repairable pre-ceremony.** No under-called fatals found, but three SERIOUS items are elevated to ceremony-blocking below.

**F1. attack-collab E — public, permissionless, convergent sequence-CRDT documents are impossible. REAL, correctly scoped.** The four-property impossibility ((i) public container, (ii) permissionless writes [mission end], (iii) cross-reader convergence, (iv) bounded reader cost) is sound: (ii)+(iii) force full-container causal folding — a sequence insert names other authors' item IDs, and per-reader op-selection breaks convergence between honest authors — and (i)+(ii) let a vandal inflate every reader's mandatory fold without bound; appendOnly makes spray unrevokable from enumeration. The red team's own scoping is honest: fatal to one advertised capability, not to collaboration (B1/B2/B4 survive and cover the real workload). **Triage: accept; adopt the C7 resolution.** The deepest consequence is doctrinal: blinding is an availability prerequisite, which strengthens James's pull-privacy-into-this-pass call.

**F2. attack-boundary-os Z1 — os-contract normatively binds fix 6 (freshness via admittedAt), which is fail-open. REAL as a defect; "fatal" describes the counterfactual shipped state.** Two independent verifications (the time lane's original attack narratives; attack-time-versioning's failed rehabilitation) settle the direction question. In-pass, the replacement (beacon + direction split) is already written and endorsed by both red teams. **Triage: mandatory correction (C1), not a design fatal — but treat as ceremony-blocking for the read-lens revision because three docs cite fix 6 as bound.**

**F3. attack-privacy A1 — the H(recipientEncKeyId) occurrence key is a public O(1) recipient-set confirmation oracle, defeating the lane's own anonymous-wrap mitigation. REAL freeze hazard.** With encryptionKey published per identity (the lane's own F3 row), anyone confirms "is Bob a recipient of F from Alice" by one slot probe. The lane failed to apply its own confirmation-oracle lesson to its own recipe, and proposed the recipe as frozen row semantics. **Triage: real; fix trivial and in-design (random occurrence keys default, C6); ceremony-blocking for the keyWrap row.**

**F4. attack-privacy A2 — keyWrap dual-role PIN overturns a stated exclusion (deterministic-ids §5/§13) framed as housekeeping. REAL process-grade fatal.** The dual-role design might still be defensible on its merits (O(1) owner escrow), but a ceremony that trusts the "row exists, pin the role" framing Etches a cardinality the owning doc explicitly argued against, uncited. **Triage: real; resolution C6 (TAG-only default; explicit James override path if dual-role is wanted).**

**Elevated to ceremony-blocking despite SERIOUS labels:** (a) **Z2/C2 path grammar** — an Etched contradiction plus a red-team misreport; vectors cut against an ambiguous pin are cut twice; (b) **M1 movedTo evaluator** — the row-amendment vectors MUST include the nested-move/Denied/STALE/budget cases or the freeze bakes in exactly the resolver divergence the amendment exists to prevent; (c) **R3 event re-cut** — verified mandatory (the drafted event set falsifies the log-only-sync pledge); it is bytecode, now-or-never.

**Overclaim check:** none of the five red teams manufactured a fatal. attack-collab correctly did NOT claim the records/views framing or B4 broken (it explicitly credits them); attack-time-versioning and attack-access-mount explicitly returned no-fatal; the boundary team's "fatal-as-written" is fair given three documents normatively bound the broken anchor. The red-team layer of this pass is trustworthy.

---

## 4. THE CONSOLIDATED FREEZE-SENSITIVE RESERVATION SET

One list, all lanes, deduped, red-team corrections folded in. Status: **ADOPT** (synthesis can ratify), **⚖ NEEDS-JAMES**, **REJECT** (record loudly so silence doesn't decide). Every item here is either Etched surface, a genesis-manifest row, or a wire-breaking change; everything else the lanes produced is in §4-H (explicit conventions) or Durable batches.

### A. Envelope / wire (must precede the envelope lock)
| # | Item | Status |
|---|---|---|
| A1 | **FS-1 `seq`→`order` rename** (EIP-712 typeHash string; regenerate digest + 42 golden vectors + wallet label) | **⚖ NEEDS-JAMES (A.8a)** — recommend ADOPT; mechanism-inert, wire-breaking |
| A2 | **FS-2 `claimedAt`** trailing claim-body word: uint64 seconds, always present, 0 = absent, second-to-last before expiresAt; ASSERT PIN/TAG only; REVOKE bodies stay exactly `bytes32 claimId`. Semantics: performed-at only; forward-only falsifier; scheduled-for is payload (C3). Obligations: S7 extension, VAL-tail fuzz widening, trailing-word vectors, privacy rider (private tier writes 0) | **⚖ NEEDS-JAMES (A.8b)** — recommend ADOPT with this shape |
| A3 | Envelope `summaryHash` word (P5.1 hashed-into variant) | **REJECT** (recordsRoot already commits every summary input; wire-breaking for zero gain) |
| A4 | Vector-clock / causal envelope fields; co-signed cross-author envelopes | **REJECT** (confluence; chain-layer) |

### B. Kernel stored state + read ABI (the A2 gas bundle — price as ONE decision)
| # | Item | Status |
|---|---|---|
| B1 | **FS-3 `admittedAt[claimId]`** stored uint64, **write-once per venue**, `getAdmission(claimId[])` batch read; fenced out of every comparator/supersession/cross-chain ordering (fix 4 restored, C4); direction split: existence-since only, never data-freshness (C1) | **⚖ NEEDS-JAMES (P1)** — four lanes +1, sharpened by access A3 (renewal-lapse wipe without it); the single highest-leverage Etched decision; must precede the A2 gas snapshot ratification |
| B2 | **FS-4 revocation G-set value = `revokedAt` uint64** (admission time of the REVOKE), **write-once per venue at first pair admission** (attack-time-versioning A2) | **ADOPT** — rides B1, zero marginal storage |
| B3 | **R1 target-keyed discovery index** (`discoverByTarget` + one postings word/claim): **REF-layout targets only as default trim**; VAL-target postings optional in pricing; reserve-selector as the floor; privacy-lane sign-off inside the bundle (correlation-economics caveat carried on R1) | **⚖ NEEDS-JAMES (inside A2 bundle)** — recommend ADD-with-trim |
| B4 | **R2 postings entry layout** `author(160)|spineIdx(64)|flags(32)` (ERC-7201) | **ADOPT** (survived attack; the author pre-filter probe-cap is a reason to keep the author word) |
| B5 | Revoke-echo postings append (R4) | **REJECT** (confirmed; state the O(container) reconciliation read cost; add Durable `isRevokedBatch` view) |
| B6 | `isAdmitted(claimId[])` batch | **NOT Etched** — view-contract recipe (kernel minimality) |
| B7 | Etched discovery-index growth for author-filtered op enumeration | **REJECT** (redeployable view / indexer) |

### C. Reserved-key rows to MINT now
| # | Item | Status |
|---|---|---|
| C1 | **`lang`** (BCP-47, VAL; grammar validated read-side) | **ADOPT** |
| C2 | **`dir`** (ltr/rtl/auto; rides lang) | **ADOPT** |
| C3 | **`encryptionKey`** (PIN VAL, ADDRESS-parent, algo-tagged multi-key blob) — with a **separate KEM/KEX algoTag registry** (never identity's signature registry; attack-privacy S1) and per-persona-key guidance (V3) | **ADOPT** — correctness row, not UX row; convention here fails as silent mis-encryption |
| C4 | **SHA-256 per-chunk word** in EFSBytes manifests (before EFSBytes vectors freeze) | **ADOPT** (P11; painful retrofit; web3:// safelist liaison needs a named owner ⚖) |

### D. Rows/shapes to RESERVE now (layout + vectors; machinery stays read-side/Durable)
| # | Item | Status |
|---|---|---|
| D1 | **`act` delegation row**: TAG, ADDRESS-parent, target = delegate address word (OPAQUE forbidden), VAL = frozen canonical scope grammar + vectors, expiresAt = window, weight = precedence. All resolution semantics Durable; delegate-set completeness rule (checkpoint-bounded, fail-closed to team-authored-only) is Durable text | **ADOPT** (access lane owns shape; os P4(a) concurs; reject client-only-forever) |
| D2 | **Persona-link pair** (`efs.os/persona` TAG + `efs.os/primary` PIN) + `label` word — DISTINCT from act (laundering defense); keyed on the primary address word so KEL backs it additively | **ADOPT** |
| D3 | **Salted TAGDEF family, fully pinned**: DOMAIN_ANCHOR_SALTED derivation + **blinded-name-in-body** rule + salted-family NFC validation variant + vectors + **the salted/blinded variant resolver reserved in the registry resolver-gate set** (attack-privacy S7 — without the gate reservation the family ships dead) + wording that **permits deterministic HKDF salts** (P9 device-loss recovery check) | **ADOPT** — under-reserving this is the "activation proves impossible post-freeze" case |
| D4 | **Blinded-disclosure record shape** (name, salt, parentId, kindTag) + vector; docs carry the salt-compulsion caveat (V2) | **ADOPT** |
| D5 | **FS-5 recency-beacon word** in the checkpoint body (chainRef, blockNumber, blockHash), optional — the freshness anchor replacing fix 6; now red-teamed twice and standing; residual = chain-dependent verifiability, labeled | **ADOPT** before checkpoint vectors freeze |
| D6 | **WHITEOUT self-slot assertive absence — re-encoded** per C5: genesis `/.well-known/whiteout` TAGDEF object + ordinary REF-PIN; union-mask sentence attached; freeze-gates §C label corrected; cross-author form = deny convention | **ADOPT** (replaces the deletion lane's sentinel-targetKind variant, which is REJECTED as self-contradictory) |
| D7 | P4(c) **0x02/0x03 un-reservation schedule**, decoupled from KEL | **ADOPT** |

### E. Amendments / confirmations to existing Etched surface (before vectors are cut)
| # | Item | Status |
|---|---|---|
| E1 | **movedTo follow-policy column re-word**: serve-on-PRESENT / follow-on-PROVEN-ABSENT / stop-on-UNKNOWN; vectors MUST include attack M1's evaluator cases (nested-move, Denied, STALE, budget accounting) + the three base cases | **ADOPT — ceremony-blocking** (as-written vectors bake in broken lazy moves) |
| E2 | **symlink/movedTo legal-targetKind sets** must admit TAGDEF targets across container roots (KIND_GENERIC + KIND_DATA minimum) | **CONFIRM** before table freeze (cross-container grafting dies in a table cell otherwise) |
| E3 | **MAX_AUTO_FOLLOWS re-cut per-segment** (8 per segment, global visited-set) — frozen-constant shape | **ADOPT** |
| E4 | **Path-segment grammar pin** per C2: namespaces superset reject-set + MAX_NAME_BYTES ruling (recommend 255) + Unicode/NFC reconciliations + golden vectors | **ADOPT — ceremony-blocking** |
| E5 | **keyWrap role/cardinality** per C6: TAG-only + reserved self-occurrence-key escrow + random-default occurrence keys (private tier); H(recipientEncKeyId) = public-convenience only, oracle named in row text | **⚖ NEEDS-JAMES** only if dual-role PIN override is wanted; otherwise ADOPT TAG-only |
| E6 | **contentEncryption**: keep row; **pin PIN/cardinality-1** (V1); resolve the S4 intern-fingerprint (prefer folding format into the AEAD ciphertext header; if an on-chain tag stays, per-file entropy) | **ADOPT** |
| E7 | **LIST charter struct**: confirm closed-vs-extensible + whether a LIST can charter VAL-layout (auto-interned) entries — gates collab Option A and B3-private's container | **CONFIRM** before kind-table freeze |
| E8 | **Merge-rule declaration** (fold identity): Option A charter configBytes / B reserved `mergeRule` PIN / C convention+registry — must not be silent; whichever wins must ALSO pin `clientId = f(authorWord, deviceBits)` and forbid session-random client-ids (attack D) | **⚖ NEEDS-JAMES** (with E7 as input; urgency reduced by B3's demotion but 100-year replay still requires it) |
| E9 | **R3 event-set re-cut**: full record bodies incl. expiresAt (and claimedAt if adopted) in claim events; delete deleted-kind events + OwnedConflict/ListFull; add SeqCollision/RefusedAppendOnly; genesis event parity | **ADOPT — ceremony-blocking, verified mandatory** |
| E10 | **R7 base-text storage survival check** (tagParent/tagChildren, per-author KEEP set through the amendment-2 re-cut) — the traversal + per-author-backlink results lean on it | **CONFIRM** |
| E11 | **propertyId preimage check**: interning must be value-only (key-independent) or the VAL-target selection payoff shrinks — verify before citing | **CONFIRM** |
| E12 | Genesis well-known namespace ruling (G4; triggered by D6) | **ADOPT** (one manifest-scope paragraph) |

### F. Explicit REJECTS (every one recorded so silence doesn't decide)
Kernel delegated revocation (revoker==author survives; KEL subsumes) · any write-time membership/ACL/write-gate/pre-auth-counter/quota/cap admission state (master confluence invariant; re-affirmed ×3) · lock/lease reserved row (advisory expiring-PIN convention; key shape named once in cookbook) · coupled-admission "atomic pair" (REJECT LOUDLY) · batchId row ((author, order) cohort suffices) · mount reserved row (dual spelling of symlink) · pinned-graft row / asOf word on symlink bodies (pinning is link-layer + P7 manifests) · new record kind for CRDT ops (TAGs + interning) · validity-interval words valid-from/valid-to (content, not metadata; reinforced by C3's scheduled-for ruling) · quorum/LIVE-below-threshold grade (reader policy, never a grade) · `?venue=` URL key (home-hint UX instead) · WHITEOUT-as-new-sentinel-targetKind (superseded by D6) · second cross-author tombstone row (deny convention) · handler-binding row, freshness-beacon key row, receipt/grant row (P2 conventions with named re-check triggers) · kernel causal DAG / prev-fence relaxation (stands) · revoke-echo (B5) · summaryHash (A3).

### G. Cross-cutting dependency flags for the ceremony sheet
- B1 (admittedAt) is load-bearing for: windowed delegation/membership (access), P13 defenses + update cooldowns (os), basis venue-conjunction (time), offer/accept expiry rule X2 (consistency), watch ordering. **If refused, each has a priced degradation** — the refusal memo must list them (live-window-only + mandatory approval sweeps; heuristic-only P13; EXACT-anchor-only gates; consolidation re-assert as the only offer/accept fix).
- A2 (claimedAt) rides E9's event re-cut if adopted; adds 8 bytes/claim forever; VAL-tail fuzz is the #1 engineering risk — re-open only on fuzz evidence.
- D3/D4 (salted family) underpin: private folders, lens-config roaming (P9), B3-private containers (C7), coercion-sensitive content — the widest-reach reservation in the set.
- E1/E4 vectors and the reserved-key table vectors must be cut in one ceremony batch or they get cut twice.

### H. Explicit CONVENTION-NOT-ROW rulings (the registry G2 must own; all ADOPT as rulings)
Lens-object encoding **(elevated: write first — G1)** · membership/lens-entry/approval shapes (approval-sweep = curator re-PIN for path views, approval-TAGs for accumulation only — attack A1 fix) · union multi-target mount (`efs.fs/union`, re-check trigger = OS handler-chain grounding) · snapshot/basis records (with C8 view-parameter rules) · pedigree/basedOn · batch-undo inverse (winner-guards per attack A6) · offer/accept (X1–X3 rules) · advisory lock key shape · mirror-health attestation · shredded attestation · device-bit allocation + clientId derivation (SDK-normative, launch-blocking) · handler-binding · freshness-beacon key (distinct from D5, which is the checkpoint word) · receipt/grant (the act row IS the grant) · padding/buckets, randomize-sensitive-VALs (MUST-level; cannot cover contentEncryption — E6), anon/dummy wraps, PQ-hybrid MUST (HNDL: land before real private data) · claimedAt=0 privacy rider · `.efs-bundle` format + pre-signed revoke-all abort artifact · `efs.collab/*` citation edges · saved searches/virtual folders · contentEncoding + copy/reflink dispositions (G4 — to be written).

---

## 5. Doc-set shape for the synthesis + what genuinely needs James

### Recommended doc set (six artifacts; lane files are superseded, never edited)
1. **`fs-pass-synthesis.md`** — the ruling record: corrected canon (C1–C14 resolutions), the merged dispositions master table (every classic-FS feature: native / re-homed(how) / gone(why)), the consistency statement, the query line, the five-want access decomposition, the collab pattern table with B3 demoted, the time model as corrected. Includes a **corrections annex**: every red-team finding adopted, keyed to the lane sentence it supersedes — the lanes stay untouched as the adversarial record.
2. **`fs-pass-freeze-reservations.md`** — §4 of this report formatted as ceremony input for freeze-gates §C: each item with surface class, vectors owed, dependency flags, status. This is the "reserve before the ceremony" set the pass exists to produce.
3. **`fs-pass-james-decisions.md`** — the decision sheet (below), one page per decision, each with the recommended ruling AND the priced degradation-if-refused. Sequenced AFTER the gas snapshot (G3).
4. **read-lens-spec revision batch** (Durable, one change-list): P3 qualifiers, ANCHORED + ENCRYPTED-NO-KEY flags, history/asOf/since vocabulary, mount rules R-A1/2/3 + M1 evaluator + M2 spine-set walk + M3 listing rules, anti-fallthrough hop sentence, delegate-set completeness + authority-STALE rule, FOLD rules as corrected, comparator fences (fix 4 restored), fence-4/G8 freshness corrections.
5. **conventions registry + cookbook additions** (G2): lens-object encoding first; then §4-H, each with conformance vectors and an owner.
6. **`os-pass-handoff.md`** — §6 below.

### What genuinely needs James (nine items; everything else the synthesis decides)
1. **The P1/A2 bundle as one priced decision** — admittedAt + revokedAt + spine + tag index + target index (with trim ladder), after real gas numbers. The pass's biggest lever; refusal degradations enumerated (§4-G).
2. **claimedAt row (A.8b)** — recommend ADOPT with the C3 shape.
3. **seq→order rename (A.8a)** — formality, but wire-breaking; ratify.
4. **The dual-posture ruling** — public archive stays public-by-default; the OS personal tier is private-by-default ("permanent ≠ public"). Ecosystem-norm-setting; strengthened by F1's blinding-is-availability finding.
5. **keyWrap dual-role override or TAG-only** — because dual-role overturns a stated exclusion (F4); recommend TAG-only.
6. **Merge-rule declaration** Option A/B/C (+E7 charter question as input).
7. **B3 demotion ratification** — reverses a lane's blessed pattern; sets external messaging about "Google-Docs-on-EFS."
8. **Channel-observatory commissioning** — adopting P6 doctrine without funding the monitor recreates the CT failure it cites; explicitly a resourcing decision.
9. **web3:// safelist liaison owner** — a name, not a design.

The synthesis (not James) decides: all correction propagation, the grammar superset + cap recommendation, WHITEOUT re-encoding, occurrence-key defaults, falsifier direction, fence restorations, P10 unification, G4/G12 scoping edits, authorHead demotion, R1 trim shape, offer/accept and undo repairs, lens-object commissioning, conventions-registry creation.

---

## 6. Handoff note to the OS pass

**What changed under you while this pass ran:**
- **P1 is recommended-ADOPT with fences you must respect:** admittedAt is existence-since evidence only (cooldowns from a venue's own admission, predate bounds); it is NEVER a freshness anchor — the checkpoint recency beacon is (your pressure report's fix-6 framing is dead; G8/fence-4 as you received them are corrected). It is fenced out of all comparators and all folds.
- **G4 is scoped:** batches tear at the writing venue mid-resume. You own a pending/confirmed/final UX taxonomy or GATE reads will consume soft state; the manifest-root-last rule is your commit marker.
- **Public fine-grained collaborative documents do not exist.** Route open-world docs to revision-DAG + curation (B2) or OR-set containers (B4); op-fold docs (B3) require the blinded/capability-gated container — the privacy tier is availability infrastructure for you, not a nice-to-have. Ejection in B3 is content-only, never cost-reducing; churning-membership surfaces are B2.
- **"Write permission" is retired.** Your sharing UX decomposes into: visibility (curation — and the remove-member verb MUST ship the approval-sweep-as-curator-re-PIN affordance, or teams lose work or keep thieves), authority (act rows, dual-attributed "Bob for ACME", GATE never expands implicitly), read-exclusion (caps/keys with the forward-only law surfaced at grant time), write-exclusion (gone), retraction (prospective now; windowed semantics only where P1 lands — without it, the 90-day-expiry default causes renewal-lapse history wipes unless paired with sweeps).
- **Timestamps:** claimedAt = performed-at testimony, always-present-0-allowed; render backdate suspicion as "unproven-early," never "detected"; private tier writes 0. Admission order is tamper-evident but not neutral at creation — precedence UX must not promise sequencer neutrality; multi-venue earliest-admission is the anchor.
- **Watch:** authorHead is a hint; completeness is the venue spine cursor; watcher silence is UNKNOWN; multi-venue cursor composition is unwritten (G5) — expect to specify it with the indexer lane.
- **Reserved surface you can rely on:** lang/dir minted; persona-link + label reserved; act reserved; encryptionKey minted (separate KEM registry); salted family fully pinned with HKDF salts legal (your P9 roaming design is confirmed); WHITEOUT ships as `/.well-known/whiteout` REF-PIN; per-chunk SHA-256 in EFSBytes.
- **Your P10 convention got harder requirements:** device bits are now FOLD-1-correctness-blocking (clientId = f(author, deviceBits)); one SDK convention, roster-assigned, private-roster variant available.

**What you must adjudicate next:** the pending/confirmed/final taxonomy; the lens-object encoding (you are its biggest consumer — co-own it with the SDK); GATE consumption of folds/snapshots (gate-picks-the-lens rule) and of anchored/as-of reads (ANCHORED flag, never-current); S0–S3 risk classes composed with act dual-attribution in preflights; the Trash/undelete surfaces with the "deletions are public history" disclosure; conflict-copy UX for EQUIVOCAL and self-concurrent multi-device merges; private-by-default onboarding (born-shreddable files, explicit share/publish acts, the forward-only law at grant time); device enrollment ceremony (roster + clientId + re-enroll-on-clone); snapshot/restore UX over the basis/manifest tri-split (my-writes / my-view / canonical); and the venue-selection doctrine (finality heterogeneity, sequencer neutrality as a selection criterion, home-hint rendering).

**Dependencies you should watch at the ceremony:** P1/A2 bundle (your cooldowns, precedence defenses, and windowed delegation ride it); claimedAt (your timeline UX); the target index (your cited-by/what-links-here surfaces — if trimmed to REF-only you keep them; if refused entirely they are indexer-shaped); the merge-rule declaration (only if you ship B3-private surfaces).

---

## 7. One-line summary

The pass held: nothing broke the mission ends, every fatal is repairable pre-freeze, the reservation set (§4) is complete and internally consistent after the C1–C14 reconciliations — the remaining dangers are a digest layer that hid two fatals (work from files), an unwritten lens-object spec that five results lean on, and twenty conventions with no registry; fix those three and the ceremony input is sound.
