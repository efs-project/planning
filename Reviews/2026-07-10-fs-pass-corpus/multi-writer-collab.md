# FS Pass — Lane report: Multi-writer collaboration (the CRDT re-test)

**Lane:** Multi-writer collaboration — adversarial re-test of the early CRDT dismissal
**Status:** lane report for Pass 1 synthesis; spec-grade where marked NORMATIVE-CANDIDATE
**Ground truth read against:** fable-fs-kickoff, fs-feature-space §2, codex-envelope, codex-kinds, codex-kernel, read-lens-spec, freeze-gates §A.8/§C, client-os-pressure-report P1/P2/P4/P7/P9/P10/P13, time-alternatives, verify-time-model, state-brief
**Last touched:** 2026-07-10

---

## 0. Verdict (one page)

**The early CRDT dismissal was right about the kernel and wrong about the read layer — and the two halves must be separated loudly, because they were dismissed as one thing.**

What was actually (and correctly) dismissed: *rich convergence machinery in the kernel* — merge functions in admission, causal metadata as kernel fields, vector clocks in the envelope, a shared mutable document cell. All of that stays dismissed, for the original reasons plus two new ones this lane found (E2EE-incompatibility of kernel-side merge, §11; fold-versioning risk on Etched surface, §14-F3).

What was dismissed by association and should not have been: **CRDT-merge as a read-time fold**. Examined mechanically, it is not merely *compatible* with lens resolution — it is **the same construction applied to a finer state algebra**. The kernel is already a CRDT (G-set revocation, LWW-register slots, confluent set-union admission — time-alternatives says this verbatim). A lens read is already a deterministic pure fold over the union of trusted authors' claims. A CRDT document read is the identical shape: `state = fold(merge, ∅, { ops : op.author ∈ L, op admitted at V, op LIVE })`. Nothing new is asked of the kernel; nothing about `author = recovered signer` breaks, because **the merged document is a view, not a record** — exactly the epistemic class of a lens-resolved folder listing, which also has no single author and never needed one. Where a signed artifact *is* needed (citation, GATE consumption, checkpointing), any author may sign a **snapshot** whose recipe is verifiable by re-folding — git's "who signs the merge? the merger" answer, made verify-don't-trust.

The genuinely novel result: **lens-scoped convergence**. Plain CRDTs have no trust model (Automerge/Yjs assume benevolent replicas; Byzantine-tolerant CRDTs were only formalized ~2022, via exactly the signed-hash-DAG construction EFS already has). EFS's lens gives per-reader op-set selection for free: *merge over the authors I trust*. That is a collaboration primitive the CRDT literature wants and doesn't have deployed. EFS is not late to CRDTs; it is structurally ahead on the part CRDTs are weakest at.

The honest boundaries that remain (§10): live-session transport is not EFS's job (EFS is the settlement/archive layer; per-keystroke on-chain ops are refused on cost, ~§5.4); cross-author LWW-by-wall-clock is refused *inside any fold* (it is either causal, curatorial, or venue-relative — never portable-and-trusted, §4); write-time exclusion, global linearizability, and "one true document for everyone with no curator" remain refused — they were artifacts of the one-mutable-cell world.

One kickoff lean is **corrected with cause** (§4.1): "the blessed multi-writer pattern must define *latest* as admission-time" is only half right — admission-time inside a merge rule would make document state **venue-relative**, breaking replication convergence. The fold must read only signed content; `admittedAt` belongs in the *evidence/dispute layer* around the fold, never inside it.

Kernel changes required: **zero**. Freeze-sensitive reservations surfaced: **one real decision** (merge-rule declaration: charter-word vs reserved row vs convention — §12.2), plus consumed/endorsed existing reservations (WHITEOUT, `claimedAt`, `admittedAt`, P10 device bits) and five explicit REJECT/convention rulings so nothing is decided by silence.

---

## 1. Substrate recap (what the fold stands on — one paragraph each)

- **Records:** five kinds; ops ASSERT/REVOKE; every claim is a single-author EIP-712-signed, content-addressed (`claimId = H(DOMAIN_CLAIM_V1, author, order, recordDigest)`), replayable artifact. TAG is cardinality-N (accumulates; slot = `(author, definitionId, targetId)`); VAL-layout TAGs auto-intern their value (`≤ MAX_VALUE_BYTES = 8192`) — byte-identical values intern to one propertyId. [settled]
- **Admission:** confluent and monotone; admitted state is a join-semilattice under set union; nothing permanently rejects what another kernel could accept; no clock at admission. [settled — master invariant]
- **Reads:** per-viewer lenses; deterministic resolution (RR1); grades closed; deny-sets subtract after resolution; discovery index enumerates all authors' claims per container, DISCOVERY-flagged. [settled; read-lens-spec is Durable]
- **Time:** `order` (portable per-envelope LWW rank, untrusted as clock), `claimedAt` (optional per-record untrusted user claim, pending A.8), `admittedAt` (per-chain trustworthy, non-portable, pending P1). [refined-with-James; verified sound-with-fixes]

Everything below composes these; nothing below modifies them.

---

## 2. The re-test: the five alleged breaks, examined

The dismissal was never written down as an argument; reconstructing it charitably, it packs five distinct objections. Each is examined against the actual mechanism.

### 2.1 "The merged state has no author — it breaks author = recovered signer"

**Premature.** The invariant `author = recovered signer` governs **records** (signed artifacts entering admission). It has never governed **views**. A lens-resolved folder listing is a derived state that no one signed: it is the output of a deterministic function over many authors' claims, and its honesty guarantee is *determinism plus per-item provenance* (RR1 + the U1 attribution chip), not a signature over the composite. A CRDT-folded document is the same object type. Its per-op provenance is *stronger* than a folder listing's: every character run in the rendered doc traces to a specific signed op by a specific recovered signer — EFS's natively-reified edges make "show authorship" (Google Docs' colored-text mode) a cryptographic fact rather than a UI courtesy.

Where a *signed* composite is genuinely needed — citing the doc, GATE-consuming it, archiving a moment — the answer is git's, made verifiable: **any author signs a snapshot** (a DATA whose bytes are the fold output at a stated frontier, plus a claim citing that frontier). The snapshot has one author: the snapshotter, who vouches for a *recomputable* claim. Any reader can re-run the fold over the cited frontier and byte-compare. Verify-don't-trust holds end to end. (§5.3.)

### 2.2 "A merge function in the read path breaks kernel confluence"

**Wrong premise.** Confluence is a property of *admission* (the admitted set converges under record exchange, in any order). The fold runs strictly downstream of the admitted set. If the merge function is a proper CRDT join (commutative, associative, idempotent over op-sets — which Yjs/Automerge/RGA-family functions are by construction), then the fold output is a pure function of `(admitted set ∩ lens)`, and venue convergence of the *document* follows from venue convergence of the *set*. The kernel neither knows nor cares. Formally: the composition of a monotone set-union semilattice with a deterministic fold is exactly how the slot comparator already works — `argmax by (order, recordDigest)` *is* a tiny fold. B3 (§5) replaces `argmax` with a bigger fold over more claims. Same math, larger algebra.

### 2.3 "Merged state can't be cited, graded, or gated"

**Half right; answered, not fatal.** A fold output has no claimId, so citation-form (`~claim:`) cannot pin it directly. Three honest citation levels:

1. **Cite the recipe:** (doc identity, mergeRule, frontier descriptor, lens, venue-as-of) — reproducible, like citing "this folder listing as of N." Verbose but exact.
2. **Cite a snapshot claim** — one claimId, one author, verifiable by re-fold. The blessed default for quoting a collaborative doc.
3. **Cite an individual op/revision** — for provenance disputes ("Alice inserted this sentence": cite Alice's op claim).

Grading: a fold output takes the **worst-of-inputs composite grade** — precisely the "composite closure grade" the client-OS report already requests (P3 item 3) for app closures; collaborative docs are a second consumer of the same rule, which strengthens the case for P3 rather than adding new vocabulary. GATE reads: a machine may consume (a) a snapshot claim it re-verified by folding, or (b) nothing. A GATE consumer that trusts an unverified fold output is the F10 failure mode (§14) and is banned by rule FOLD-4 (§3.3).

### 2.4 "CRDT metadata costs are absurd on-chain"

**Correct — and this is where the dismissal earns permanent respect.** Automerge's historical per-op overhead ran ~2 orders of magnitude over document size before columnar compression; Yjs items carry (client, clock, leftOrigin, rightOrigin, parent) per insert run. Per-keystroke records at ~22–27k gas/record spine cost plus calldata is not a design, it's a bonfire. The dismissal is upheld **as a transport-layer verdict**: EFS never carries live editing traffic. The repair is the granularity ladder (§5.1): live sessions run over any ephemeral channel (WebRTC/relay — where Yjs providers already live); EFS receives **session-grade signed update batches** — and here CRDT math itself cooperates: Yjs/Automerge update blobs are *merge-composable*, so a batch of 400 keystrokes is one op in the algebra, not 400. One TAG per save-point/session, ≤8192 B VAL inline or REF→DATA above that. Cost table in §5.4.

### 2.5 "CRDTs have no answer to vandals, and open-world EFS is all vandals"

**Backwards — this is EFS's strongest ground.** Plain CRDTs converge over *whatever ops arrive*; excluding a malicious replica after the fact is an open research problem in that world. EFS ops are author-signed claims and the reader's fold is **lens-scoped**: the op-set entering the merge is selected by trust, per reader, revisable at any time, with deny-sets subtracting after. Kleppmann's Byzantine-CRDT construction (2022) — hash-DAG + signatures makes equivocation detectable and convergence Byzantine-tolerant — is *already implemented* by EFS's content-addressed claimIds + SeqCollision/EQUIVOCAL machinery. The one real technical problem exclusion creates — causal holes when a trusted author's ops anchor on an excluded author's ops — has a clean, deterministic answer (exclusion-as-deletion, §3.2) borrowed from the CRDTs' own tombstone semantics.

**Net:** objections 1, 2, 3, 5 dissolve or convert into design rules; objection 4 survives as a transport boundary, not a model boundary.

---

## 3. The architecture: records, views, folds (NORMATIVE-CANDIDATE rules)

### 3.1 The two-layer statement

> **Everything written is a single-author signed record. Everything merged is a view.** A view is a deterministic pure function of (admitted set, lens, deny set, fold spec). Views are never admitted, never signed, never records. Any author may re-materialize a view as a record by signing a snapshot whose recipe is stated and recomputable.

This subsumes slot resolution (fold = argmax), folder listings (fold = union+grade), and CRDT documents (fold = CRDT join) under one sentence. It is the multi-writer analog of "the database is a value."

### 3.2 The subtraction theorem (exclusion-as-deletion)

The fold input is trust-filtered, and trust changes. Three subtraction events can remove ops from a fold that other live ops causally depend on: (i) the author **revokes** an op; (ii) the reader's **deny set** hits an op; (iii) the reader **ejects an author** from the lens. Text CRDTs are not closed under arbitrary op deletion — an insert anchored between an excluded author's items loses its origin.

Candidate rules, adjudicated:

- **(a) Causal-cone removal** (drop everything transitively anchored on excluded ops): deterministic but destroys innocent bystander edits; rejected as default.
- **(b) Re-anchoring heuristics**: non-deterministic across implementations; **refused outright** (breaks fold determinism, FOLD-1).
- **(c) Exclusion-as-deletion** (**adopted**): excluded ops are retained *for structure* and treated as *deleted for content* — precisely what the CRDT's own tombstones do for ordinary deletes. Causal anchors survive; the vandal's inserted text renders as removed; innocents' edits keep their positions.

**Rule (NORMATIVE-CANDIDATE):**
> **FOLD-SUB:** In an op-fold view, every subtraction — REVOKE, deny hit, lens ejection — renders as *deletion of the excluded ops' content*, never as *un-happening of their structure*. Excluded ops remain fold inputs as tombstoned items.

This is the collaboration-lane sibling of empty-on-revoke ("revocation clears; it never resurrects") and of deny composition ("subtract after resolution, never re-open resolution"). One principle, third appearance: **subtraction is forward-only and content-scoped.** It also means a revoked op cannot create a causal hole — same machinery, no special case.

Corollary worth stating: because CRDT ops carry per-author contiguous clocks *inside* the blobs, a venue holding ops 1–5 and 9–12 of one author **knows** 6–8 are missing (unlike slot reads, where absence needs a checkpoint to prove). The fold holds dependent ops pending and the view renders "N ops pending missing dependencies" — an anti-fallthrough discipline that falls out of the CRDT math itself. Missing data makes the doc *older*, never *wronger* — the fold is monotone, so late arrivals only add. This is strictly better behavior under partial replication than slot resolution has, and should be said in the doc's currency labeling (worst-of-inputs, venue-qualified).

### 3.3 Fold conformance rules (NORMATIVE-CANDIDATE, extends read-lens-spec §8 — Durable, zero Etched cost)

- **FOLD-1 (determinism):** same admitted set + lens + deny set + fold spec (algorithm **and version**) ⇒ byte-identical view state on every conforming implementation. The fold spec identity is part of the input (see §12.2). *This extends RR1 to fold outputs.*
- **FOLD-2 (content-only inputs):** the fold reads **only signed record content** (op bytes, `order`, claimIds, citation edges). It MUST NOT read `admittedAt`, venue admission order, discovery-index order, or any venue-local fact. (§4.1 — this keeps document state portable and replication-convergent; mirror of the `prev` and `admittedAt` fences.)
- **FOLD-3 (subtraction):** FOLD-SUB above.
- **FOLD-4 (GATE):** machine gates consume a collaborative doc only via a snapshot claim whose fold they have re-verified (or by running the fold themselves under a closed author set). An unverified fold output is never GATE-consumable. Composite grade = worst-of-inputs (rides P3 item 3).
- **FOLD-5 (provenance):** conforming renderers can attribute every content range to its op claimId/author (the attribution chip, fine-grained). Enumeration ≠ endorsement applies to fold inputs sourced from discovery.
- **FOLD-6 (EQUIVOCAL):** ops inside a duplicity-evidenced `(author, order)` region are never folded as LIVE (RR3 applies); the view renders the region as contested with both branches available. See F1 (§14) for why this makes P10 urgent.

---

## 4. Time, admission, and the offline-replay trace (the admittedAt dependency, corrected)

### 4.1 Correcting the kickoff lean [correction, with cause]

The kickoff (and fs-feature-space §2) says: *"any multi-writer merge rule that depends on 'latest wins' must define latest as admission-time, not claimed-time, or it's gameable"* — and that the blessed pattern is therefore "downstream of the P1 admittedAt decision."

Half of this survives; half breaks under its own constraint set. `admittedAt` and admission order are **venue-local**. A merge rule that reads them produces **different document states on different venues holding the same records** — violating exactly the convergence property that makes replication-as-portability work (a copied doc would silently re-merge differently on the replica). The fold cannot be both admission-anchored and portable. So:

> **Cross-author recency is never a merge input.** Inside a fold, ordering is either **causal** (an op cites/covers what it has seen — provable from content) or **deterministically arbitrary** (op-ID tie-breaks for true concurrency). Outside the fold, `admittedAt` is the **evidence layer**: it falsifies back-dating claims, bounds ages, and settles human disputes — it never moves a character.

Where this leaves each field:

- **`order`** — used as-is for what it already does: per-author slot LWW (op supersession within one author's slot; snapshot-claim recency per author). Never compared across authors inside a fold.
- **`claimedAt`** — display/journal only, labeled untrusted, falsifiable against earliest-known `admittedAt` per verify-time-model §2.3. Op blobs usually carry their own internal timestamps (Automerge change `time`), so `claimedAt` is *not load-bearing* for B3; it is mildly useful for B2 revision claims (uniform "author says written at"). Mild support for freeze-gates A.8(b); not a blocker either way.
- **`admittedAt` (P1)** — this lane **supports storing it** (state-resident, getProof-provable) for the evidence layer: the fake-prediction/back-dating defense (P13), "first admitted anywhere" dispute bounds, and snapshot-freshness display. With the explicit fence (verify-time-model fix 4): never in any comparator, never in a fold.

What of true cross-author LWW *fields* (a doc title, a formatting mark, a config value co-owned by a team)? Three honest options, in order of preference:
1. **MVR (multi-value register):** concurrent writes surface as a visible conflict; any editor resolves by writing a covering op (one that causally cites both). Rare in practice; honest always. **Blessed default.**
2. **Causal dominance:** an op that has *seen* the rival (cites it in its causal context) wins over it; only true concurrency remains ambiguous → MVR render.
3. **Designated-home admission order:** the doc declares a home venue; that venue's admission order arbitrates. Trustworthy and gameproof, but the doc's merged state is then only computable with home access (replicas degrade to AS-OF) — acceptable for org-internal docs, refused as the ecosystem default. If chosen, it must be declared in the merge rule so readers know the doc is venue-anchored.

Note what is *rejected*: app-layer wall-clock LWW (Automerge's default LWW-by-change-timestamp for maps). Those timestamps aren't even +600s-capped (the kernel cap binds `order`, not bytes inside op blobs). An app that insists on them should at minimum enforce `opTime ≤ tidTime(order) + 600s` (inheriting the envelope's future fence) and accept that back-dating loses nothing — which is exactly why it's not a defense, just hygiene.

### 4.2 The offline-replay trace (P13 in collaboration clothing)

Scenario: Alice, Bob, Carol co-edit `/team/design.md` (B3 pattern). Carol goes offline Monday, edits locally, and her device replays the signed op-batch **Thursday** — after Alice and Bob have moved on. Trace:

1. **Position of Carol's text:** determined by her ops' causal anchors (they cite the Monday state's item IDs). The CRDT integrates them where Monday's context now lives — standard concurrent-merge behavior, deterministic on every venue (FOLD-2: the fold reads only content). No venue disagreement, no gaslighting surface.
2. **"Whose edit is newer":** *not asked by the fold at all.* Alice's Tuesday edits and Carol's Monday-signed-Thursday-admitted edits are causally concurrent; the fold merges both; tie-breaks are op-ID-deterministic. Nobody "wins" by being newer — there is nothing to win.
3. **The dispute layer:** Carol claims she wrote it Monday (`claimedAt` = Mon). Verify-time-model rules apply: `admittedAt` (Thu, earliest known across venues) is an **upper bound on age only** — it can prove a *forger* who claims Monday but signed Thursday only if some admission precedes the claim... precisely: a **real** Monday authorship is *consistent with* Thursday admission (offline is legal); a **fake** "I predicted X on Monday" is *refuted* only when X's own record shows the claimed-early record was admitted **after** X became known. The client renders: "claims Mon 14:02 (author-asserted); first admitted Thu 09:15 (this venue/earliest known)." Both facts, no adjudication. This is P13's fake-prediction defense verbatim, and it is why P1 matters to collaboration — as **evidence, not as merge input**.
4. **Edit-after-reply gaslighting inside a doc:** impossible to hide — ops are append-only signed history; a client renders per-range edit history on demand (P13's render-edit-history defense, native here).

### 4.3 The multi-device hazard (P10, upgraded to urgent by this lane)

Collaborative editing is *the* multi-device-heavy workload: the same author's laptop and phone flush op-batches independently. If both mint the same `order` with different digests → SeqCollision → the whole `(author, order)` region grades EQUIVOCAL → **FOLD-6 excludes those ops from LIVE folding** → the user's own edits vanish-with-flag from their team's doc. This is a self-inflicted denial-of-collaboration triggered by two devices and a coincidence. The 10 device bits exist to prevent it; **no allocation convention exists** (P10). This lane's input: P10 stops being a nice-to-have SDK item and becomes a **launch-blocking dependency of the collaboration story**. (An SDK convention — e.g. persistent random device-bit assignment at key-import plus collision-regeneration — suffices; no Etched surface.)

---

## 5. Case A — the collaborative document (B3: op-fold document)

### 5.1 The granularity ladder (and where each rung lives)

| Rung | Quantum on EFS | Merge | Verdict |
|---|---|---|---|
| 0 | whole-doc versions per author | none — curation picks one | **native today** (B1/B2); no CRDT |
| 1 | **session/save-point CRDT update batches** (composable blobs) | read-time fold | **the blessed B3 rung** |
| 2 | per-keystroke ops | read-time fold | **refused** — cost (§2.4), spam surface, zero benefit over rung 1 (updates compose) |
| live | keystrokes over WebRTC/relay | library-native | **out of EFS entirely** — ephemeral transport; EFS is settlement |

The load-bearing fact for rung 1: CRDT update encodings (Yjs updates, Automerge changes) are **closed under composition** — a merged batch of a session's ops is itself a valid op. So the EFS record quantum is an *economic* choice, not a semantic one; convergence is identical at any batching.

### 5.2 The record shapes (all existing kinds; zero new surface)

- **Doc identity:** a DATA `D` (owned, author+salt). ADR-0049 is a *perfect* fit here, better than for static files: the document's **identity is stable while its state converges** — "a file's identity is its DATA record, not its bytes" was built for this without knowing it.
- **Ops container:** either
  - **(i) an appendOnly LIST** `opsL` (owned by the doc creator; charter: appendOnly, targetKind per the frozen table's VAL-entry rule — *needs confirmation against the frozen charter shape, flagged §12.2/§12.6*): entries are TAGs with `definitionId = listId`. AppendOnly makes the op history **gaslight-proof**: an author cannot silently retract "I never wrote that" (revoke-of-entry is the inert `RefusedAppendOnly`); retraction is a **compensating op** (a CRDT delete), which is the CRDT-idiomatic move anyway and never creates causal holes. K1 applies: entry edges carry `expiresAt = 0`. **Recommended for anything public/adversarial.**
  - **(ii) a child TAGDEF under `D`** (children under KIND_DATA parents are legal, kinds amendment 8): ops are TAGs into it; revocation of one's own ops is possible (renders via FOLD-SUB as deletion). **Acceptable for cooperative/private docs** where regret-retraction matters more than gaslight-proofing. The Pass-2 note: for truly sensitive content the real retraction is crypto-shredding, not revocation (§11).
- **Ops:** TAG, VAL layout for blobs ≤ 8192 B (auto-interned — with a free bonus: **byte-identical op replay dedupes structurally**, same value → same propertyId → same slot; CRDT idempotence falls out of the interning machinery); REF layout → a DATA + `mirrors` for larger blobs. Each blob is a composable CRDT update carrying its own causal metadata (state-vector deltas, item origins) — **causality lives inside op payloads, never in kernel fields** [confirms the time-alternatives lean; vector-clock kernel fields stay rejected].
- **Merge-rule declaration:** the one interop-critical word — which fold interprets this op-set. Options and the freeze question in §12.2.
- **Snapshots:** §5.3.

### 5.3 Snapshot + op-tail (the compaction protocol)

- Any author MAY publish: a DATA `S` (bytes = compacted CRDT state at frontier `F`) + a claim under a `snapshot` convention key on the ops container, whose body carries `F` as a **state vector** (per-author high-water clocks — the CRDT's native compact frontier descriptor) + `contentHash` of `S`.
- Readers: resolve the most recent **trusted** snapshot (lens-graded like any claim; first-attester-wins among snapshot publishers the reader trusts), then fold only ops beyond `F`. Cold-start cost drops from O(history) to O(tail).
- **Verification:** any reader MAY re-fold from genesis (or from an earlier verified snapshot) and byte-compare — snapshots are *verifiable accelerations, not trusted truths*. A GATE consumer MUST verify (FOLD-4). A poisoned snapshot is therefore a detectable equivocation-with-evidence, not an attack that sticks (F4, §14).
- Old ops are never deleted (permanence; the 100-year archive *is* the op log). Snapshots only short-circuit reads. Note the shape rhyme with P7's "atomic resolve-closure-at-pinned-root": a snapshot+frontier is the collaboration instance of resolve-closure — one consistent pair, no version-mixing.
- **The 100-year replay obligation:** an op log is only an archive if the fold that interprets it is preserved. The merge-rule declaration SHOULD cite a **spec-or-implementation DATA on EFS** (self-hosting the fold the way the Codex self-hosts the rules; a content-addressed WASM fold is the natural endgame — handoff note for the OS pass, which wants deterministic view-functions-as-content anyway). Without this, B3 documents rot into uninterpretable op soup by 2050. This is the single strongest argument that the merge rule cannot be a silent convention (§12.2).

### 5.4 Cost model (honest, order-of-magnitude; against the ~22–27k gas/record spine + calldata on an L2/L3)

| Workload | Records | Verdict |
|---|---|---|
| typing session (400 keystrokes, ~1–3 KB composed update) | 1 op-TAG per save-point | ~50–120k gas ≈ cents on L2/L3 — **viable** |
| active co-authoring day (3 authors × ~10 flushes) | ~30 records/day | **viable**; comparable to a busy git repo |
| per-keystroke | 100s records/min | **refused** (rung 2) |
| snapshot (50 KB doc) | 1 DATA + mirrors (bytes off-chain or EFSBytes) + 1 claim | amortized, publisher-paid — viable |
| enumeration read (cold) | discovery pages ≤256/page + client filter by lens | fine for docs with ≤ ~10³ ops; beyond that snapshot+tail or indexer-lane |

Two read-path notes: (a) "all ops by *one* author in a container" without scanning all authors is an indexer-lane job (subgraph) — acceptable, labeled; an author-filtered discovery view is a **redeployable view contract** if wanted (Durable, explicitly NOT Etched — do not grow the frozen index for this). (b) An op spilled to REF+DATA whose bytes are unfetchable renders BYTES-UNAVAILABLE → the fold holds it and its dependents pending (render-with-pending, §3.2 corollary) — availability, not correctness.

### 5.5 Worked example W1 (three authors, exclusion, replay)

Setup: doc `D`, appendOnly ops LIST, merge rule `crdt/yjs-v2` declared. Lens of the team's readers: `[Alice, Bob, Carol]`.

1. Alice creates `D`, ops container, merge-rule declaration, snapshot `S0` (empty doc), all in **one atomic envelope** (native batch atomicity — the create-a-collaborative-doc act is one signature).
2. Mon: Carol (offline) signs ops `c1,c2` (order=O_c, claimedAt=Mon, blob cites Monday state-vector). Tue: Alice publishes `a1`, Bob `b1` (concurrent with Carol's unseen work).
3. Thu: Carol's batch admits. Fold (any venue, any reader with the team lens): `merge(S0, a1, b1, c1, c2)` — deterministic; Carol's text integrates at its Monday anchors; concurrent-insert tie-breaks by op ID. Every venue holding these five claims renders the identical doc (FOLD-1/2).
4. Dispute: Bob thinks Carol post-hoc-edited to dodge his Tue comment. Client shows: `c1 claimedAt Mon 14:02; first admittedAt Thu 09:15 (venue-labeled)`. Consistent-with-offline; not proof of Monday. Bob's comment `b1` admitted Tue — if Carol's `c2` textually responds to `b1`'s content yet claims Monday, that's a *human-visible* inconsistency (admittedAt evidence), still not a fold input. The doc itself is unaffected either way.
5. Vandal: Mallory (permissionless) sprays ops into the container. **Nothing happens** to any team reader: Mallory ∉ lens, her ops never enter the fold. Cost absorbed at her gas. A public-lens reader who *did* include her ejects her → FOLD-SUB tombstones her content; Bob's edits *inside* Mallory's paragraph survive at their anchors, rendered against the now-deleted context.
6. Carol revokes `c2` — **refused inert** (appendOnly): the record of refusal is enumerable; she publishes a compensating delete op instead; history shows both. (Container flavor (ii) would have allowed the revoke; FOLD-SUB would render it as deletion.)

---

## 6. Case B — the shared folder (B4: OR-set container)

**Finding: the shared folder needs no text-CRDT and no new machinery — it already *is* a CRDT, and naming it as one settles the design.** In CRDT vocabulary, a shared folder under a lens is an **observed-remove set with per-author add/remove and reader-scoped third-party remove**:

- **Add** = author PINs a placement under the shared container (per-author slot; accumulates across authors).
- **Remove (own)** = REVOKE your placement (slot EMPTY; re-add = re-assert; trash semantics free).
- **Remove (someone else's)** = *not expressible as destruction, correctly* — it is a **WHITEOUT/deny-shaped claim**: teammate B asserts "treat A's placement as removed"; readers whose deny set (or team lens config) subscribes to B's whiteouts subtract it after resolution (§3.4 machinery verbatim). Per-reader, non-destructive, revocable, portable. This is the OverlayFS whiteout made per-viewer — and it is exactly what the additive-reserved WHITEOUT slot should promise (§12.4).
- **The one canonical listing** = the team **publishes its lens** (a LIST: ordered member set + subscribed whiteout authors). Members and visitors resolving under the team lens see the **identical listing** (RR1 determinism) — canonical-as-published-artifact, inspectable/forkable/diffable (LC2 spirit), not canonical-as-global-truth. There is no listing-of-record without a lens-of-record; that is the honest answer and it is enough.
- **Name conflicts** (Alice and Bob both place `plan.md`): first-attester-wins by team-lens order + the §4.4 multi-claimant marker ("1 other version"). **Move conflicts** (A moves file → `/x`, B → `/y`): two authors' `movedTo` slots; same resolution; a team norm ("mover re-PINs at destination under the team's curator") is a cookbook line, not machinery.
- **Cross-author atomicity** (A-and-B-both-or-neither): **declared-gone** — single-author batches are atomic (stronger than POSIX); cross-author transactions are a chain-layer (smart-contract escrow) concern EFS correctly refuses. No collaboration pattern in the ten-app grounding or this lane's three cases actually requires it; the folder patterns above never do.

Worked example W2 (compressed): 4-person team folder; Dave (member) places malware-lookalike; Alice (curator) whiteouts it → all team-lens readers lose it from the listing (labeled DENIED-subtracted, inspectable); Dave's own view of his own namespace still shows it (his lens, his truth); Dave leaves team → curator ships lens v(N+1) without Dave; pin-and-diff (§4.5) prompts subscribers on the removal; Dave's *past* placements remain visible-if-unwhiteouted (removal is prospective un-endorsement — same honest limit as P4's persona un-labeling; retroactive sweeps are an explicit curator act of whiteouting each entry, renderable as an audit trail).

---

## 7. Case C — the wiki (B2: revision-DAG document)

The wiki wants: multi-editor pages, full history, edit wars survivable, vandalism reversible, per-community canonical view. Fine-grain CRDT is the *wrong* granularity here (adversarial, open-world — see the granularity theorem, §8.1); the right shape is git's, expressed in EFS kinds:

- **Revision** = a DATA (bytes = full page text or a stated diff format) + the author's placement PIN at the page node + **`prev` citation edges** (REF TAGs, cardinality-N, citing parent revision *claimIds* — content-addressed, immutable at signing; a merge revision cites ≥2 parents). The DAG is **read-time-only**: the kernel never reads it (the `prev`-fence philosophy holds; this is time-alternatives Q2 option (b), adopted here as an app convention, not kernel surface).
- **Who signs the merge? The merger** — a human (or their tool) publishes a merge revision citing both heads; it is an ordinary signed record; readers verify both parents are in their trusted DAG. git's answer transplants without residue.
- **The rendered page** under lens L = the head-set of the DAG restricted to L-trusted authors' revisions. One head → render it. Multiple heads (true fork/edit war) → **the page is honestly forked**: render first-attester's head by lens order + the multi-claimant marker; any editor can end the fork by publishing a covering merge (citation-coverage dominance is deterministic and trust-free). "Latest revision wins across authors" is *never* a timestamp question — it is causal (covers) or curatorial (lens order). [§4.1 applied]
- **Vandalism / rollback, lens-scoped:** eject the vandal (or subscribe to a moderator's deny feed) → their revisions leave your DAG → heads recompute → the page re-renders pre-vandalism, **instantly, per-reader, non-destructively**. The vandal's fork of the wiki still exists under their own authorship (freedom-of-fork; credible neutrality intact); the community's view is clean. This is strictly better than MediaWiki's global admin revert: revert-power is held by every reader and every community independently, and no history is destroyed.
- **The coarse-granularity honesty cost:** excluding a vandal removes their *claims*, not their *influence* — an innocent's revision built on vandalized text still contains the vandalism in its bytes (as in git). Clients SHOULD taint-flag revisions descending from denied revisions ("descends from a denied revision"); the community practice is revert-then-continue (a clean revision citing the pre-vandal parent). Cookbook line, not machinery.
- **Edit wars** that never merge: the page stays visibly forked under neutral lenses — which is the *true state of the community* and EFS declines to lie about it. Communities that want one answer appoint curators (publish a lens); that is governance, correctly priced.

Worked example W3 (compressed): `/wiki/pizza.md`, editors {A,B,C}, vandal V. r1(A) ← r2(B) ← r3(V, vandalism) ← r4(C, innocent typo fix on top). Moderator M publishes deny on r3. Readers subscribing M: DAG = {r1,r2,r4}; r4 taint-flagged (parent denied); C publishes r5 citing r2 (revert-and-redo); heads = {r5}; clean. Readers not subscribing M: heads = {r4}; they see the vandalized-then-fixed lineage — their choice of moderator, their view. V's "pizza is a hoax" wiki persists under V's authorship for V's audience of none.

---

## 8. Blessed patterns (the deliverable table)

### 8.1 The granularity theorem [reasoned, this lane]

> **Trust boundary and op granularity must move together.** Coarse grains (whole revisions) make *exclusion clean* (filter the DAG) but *excision blunt* (influence persists in descendants) — right for **open/adversarial** surfaces. Fine grains (CRDT ops) make *excision surgical* (tombstone exactly the vandal's content) but *entangle structure* (FOLD-SUB needed) — affordable only inside a **bounded, semi-trusted** collaborator set. Choosing fine granularity on an open surface buys maximal entanglement with maximal adversaries: refuse it.

### 8.2 The four blessed patterns

| # | Pattern | Mechanism | Merge | Archetypes | Refuses |
|---|---|---|---|---|---|
| **B1** | Curated versions | owner's PIN is the doc; others write suggestion-TAGs; owner merges by re-PIN | human, owner-signed | specs, blog posts, config, package metadata | co-ownership |
| **B2** | Revision-DAG doc | revision DATAs + `prev` citation edges + merge revisions; heads per lens | human, merger-signed | wikis, legal docs, handbooks, any open-world doc | automatic merge |
| **B3** | Op-fold doc | session-batched CRDT op-TAGs + snapshot/op-tail + lens-scoped fold + FOLD rules | automatic, read-time, lens-scoped | team notes, whiteboards, structured co-owned state among ≤ ~dozens of semi-trusted authors | live transport; open-world editing |
| **B4** | Shared container | per-author placements + own-revoke + WHITEOUT/deny subtraction + published team lens | set-union, native | shared folders, playlists, registries, inboxes | destructive delete; cross-author atomicity |

Plus the two already-native shapes the kickoff names (accumulation; curation) which B1/B4 formalize. An app picks by two questions: *is the collaborator set bounded and semi-trusted?* (no → B2/B4) and *is the state text-like convergent or set-like?* (set → B4; text+bounded → B3; text+open → B2).

---

## 9. What stays kernel, what stays app (the lean, tested)

**The lean holds, sharpened:** the kernel stays the trivial CRDT (G-set + LWW-register + confluent union) and **must** stay it — two arguments beyond cost that this lane adds:

1. **E2EE-compatibility (privacy pull-in, §11):** a read-time fold runs client-side *after decryption*; a kernel-side merge would require the kernel to see inside ops, structurally killing encrypted collaboration. The app-layer ruling is what makes private collaborative docs possible at all.
2. **Fold evolvability:** merge algorithms improve and get security-patched (Matrix state-resolution v1→v2 is the cautionary tale — a deployed deterministic fold with a flaw is agony to migrate; theirs lived in the protocol). EFS folds live in the Durable/app layer, versioned by declaration (§12.2), evolvable per-document without touching Etched surface. Freezing any fold richer than `argmax` would be a self-inflicted Matrix.

Richer convergence is **app-layer-on-op-records**: confirmed, with the one interop-critical word (the merge-rule identity) needing a decided home (§12.2) — the only place where "app-layer" risks per-client dialects that a 100-year archive cannot absorb.

---

## 10. The honest boundary: collaboration shapes EFS refuses

Stated once, prominently (the P13c "what this gives up" register):

1. **Live-session transport.** No sub-second convergence, no presence/awareness (cursors, who's-typing). EFS is the settlement and archive layer under a local-first stack; sessions ride ephemeral channels. (Local-first/Ink-&-Switch positioning: EFS is the trust-and-permanence substrate local-first apps lack, not their wire.)
2. **OT-style central-sequencer collaboration** (Google Docs' actual algorithm): requires a total-ordering server; EFS has no sequencer and wants none. CRDT-family only.
3. **Write-time exclusion and locks.** "Only we can write here" is a read-fact (lens), never a write-gate. No lock primitive exists; apps needing mutual exclusion (unique-name auctions, exactly-one-winner) belong on the chain layer. [declared-gone, artifact of one-mutable-cell]
4. **Cross-author atomicity** (A-and-B-sign-or-neither): not expressible in one envelope; chain-layer escrow if truly needed; no blessed pattern requires it. [declared-gone / punted with cause]
5. **Portable trusted cross-author recency.** "Whose edit is newer" as a portable, trustworthy, cross-author fact **does not exist** (the deliberately-empty cell of the time model). Folds use causality; disputes use venue-labeled admission evidence; curation uses lenses. Anything promising more is lying.
6. **One true document for everyone with no curator.** Canonical-ness is per-lens or curator-published, always. The wiki fork that never merges renders as forked. EFS declines to manufacture consensus it doesn't have.
7. **Global linearizability / consistency statement:** EFS collaboration is **per-venue convergent, per-lens deterministic, eventually consistent under record exchange, monotone (ops accrete)** — never globally linearizable. (Extends the §7-locking cluster's consistency statement to the collab case.)
8. **Retroactive secrecy and true erasure of op history** — permanence applies to ops; see §11 for the crypto-shred seam.

---

## 11. Privacy composition (pulled into Pass 1 per James)

The collaboration patterns compose with the privacy tier as follows — and one architectural result matters beyond this lane:

> **Read-time merge is what makes encrypted collaboration possible.** Ops encrypt like any payload (`contentEncryption`/`keyWrap` to a per-doc group key; blobs opaque to kernel and public); the fold runs client-side post-decryption. Any kernel- or venue-side merge would have required plaintext. The app-layer ruling and the privacy requirement are the same decision seen from two sides.

Specifics:
- **Private doc:** ops container under a **salted/blinded TAGDEF** (already additive-reserved — consumed here, not modified): the container is unlinkable without the capability (fragment-carried, per read-lens §6.5). Op blobs encrypted to the group key. Snapshots likewise.
- **What stays public, honestly:** author words, record timing/sizes, the container's existence under traffic analysis, funding trails — the P9 four-layer honesty applies verbatim: *content* privacy yes; *authorship/timing* privacy no ("privacy-possible, not private-by-default, never anonymous"). A team that needs unlinkable membership needs personas (one persona per doc is the blessed hygiene; the persona-linkage privacy machinery is P9's).
- **Membership change:** add member = share key (re-wrap) + add to team lens. Remove = rotate group key (future ops unreadable to removed member) + lens ejection (their future ops unfolded). **Past ops remain readable to them forever** (they held the key) — no retroactive secrecy; say it.
- **Regret/erasure:** for encrypted docs, **crypto-shredding the group key** is the only true kill — and it kills the doc for *everyone* without a re-encrypted successor; the blessed exit is "fork-to-new-key, shred the old." For plaintext ops, revocation/compensation hides-not-destroys (Pass-2 dependency, named).
- **appendOnly tension:** gaslight-proofing (appendOnly ops) vs regret-retraction pulls opposite ways; §5.2 gives both container flavors and the selection rule (public/adversarial → appendOnly; private/encrypted → plain container + crypto-shred as the real eraser).

---

## 12. FREEZE-SENSITIVE RESERVATIONS (the loud section)

Everything this lane needs or explicitly declines from the Etched surface. Every non-minted item is an explicit *convention-not-row* ruling, not silence. **Net new Etched surface requested: zero rows mandatory; one decision (12.2) that may consume a charter word or one reserved row.**

### 12.1 New record kind for CRDT ops — **REJECT**
Ops are TAGs (VAL ≤8192 or REF→DATA). The five kinds suffice; a sixth kind would push app semantics into admission, enlarge the hottest read path, and violate the cardinality-is-slot-identity simplicity for nothing the TAG shape doesn't already give (including free idempotent replay via interning). *No new kind, with prejudice.*

### 12.2 Merge-rule declaration (`mergeRule` / fold identity) — **the one real decision: charter-word vs reserved row vs convention. Recommendation: bind it into the LIST charter if configBytes can carry it; else mint ONE reserved row. Do NOT leave it a silent convention.**
- **Why it can't be silent:** FOLD-1 makes the fold spec part of the view's identity; the op bytes are permanent; a 2126 reader replaying a 2026 op-log must know *which fold* renders it (§5.3's 100-year replay obligation). Two clients folding one op-set under different algorithms render **different documents from identical trusted data** — the per-client-dialect risk at its worst, in the exact place users check "do we see the same doc?"
- **Option A (preferred if legal): the ops-LIST charter carries the merge-rule word.** `listId` already folds `keccak(configBytes)` — the declaration becomes **cryptographically immutable and identity-bound** (same-container-different-merge-rule impossible by derivation), zero new rows, zero kernel reads. **The freeze-sensitive check this requires NOW:** is the charter `configBytes` struct closed (appendOnly, targetKind, maxEntries only) or extensible/opaque-suffix-tolerant? If closed, opening it is a derivation-math decision that must precede the ceremony. Also confirm VAL-layout entries are charter-legal (targetKind semantics for auto-interned values) — needed by §5.2(i) regardless.
- **Option B: one reserved PIN row (`mergeRule`, VAL: an identifier + a citation to a spec/impl DATA)** under DATA/LIST containers, authored by the container owner. Cheap row + vector; kernel never reads it; lens-legible and uniform.
- **Option C (fallback ruling if A and B are both refused): a blessed convention key (`efs.collab/mergeRule`) + a cookbook registry of fold identifiers** — explicitly ruled, with the dialect risk accepted on record.
- Value grammar in all options: `<family>/<algo>-v<major>` + optional `~data:` citation of the self-hosted fold spec (§5.3).

### 12.3 Revision-DAG edges (`prev`/`mergeParent`) and suggestion edges — **CONVENTION, explicitly ruled (no rows)**
Citation-form REF TAGs under user keys (`efs.collab/prev`, `efs.collab/suggests`). Never auto-followed (citation semantics; no follow-budget interaction), interpreted only by the app family that owns the docType, so uniform-vector pressure is low. `relatedVersion`/`supersededBy` reserved rows are the wrong shape (forward-pointing / author-of-old-record; a DAG child must cite parents at signing time). Ruling: convention, revisit only if cross-app revision-DAG interop demonstrably fragments.

### 12.4 WHITEOUT — **keep the existing additive reservation; this lane pins what it must promise**
Consumed by B4 as the cross-author remove. It must promise: *subtractive, per-reader (honored only by lenses/deny-sets that subscribe the whiteout author), graded like any claim (revocable = un-remove, deniable, stale-able), never destructive, never a write-gate.* It must NOT promise: removal from anyone's view who doesn't subscribe; byte deletion; retroactivity beyond render. Mechanically it may simply be a standardized deny-advisory key ("removed" as distinct from "dangerous" severity) — if so, fold it into the §3.4 machinery rather than new machinery. (Shared with the trash/mount lanes; not minted here.)

### 12.5 Time words — **positions, not new asks**
- `order` rename + `claimedAt` (freeze-gates A.8): this lane **mildly supports** A.8(b) `claimedAt` (uniform per-action time for B2 revision claims; B3 op blobs self-carry time, so not load-bearing). No new shape requested.
- `admittedAt` (P1): **support storing as state**, with the verify-time-model fence *plus this lane's addition*: **`admittedAt` and venue admission order MUST NOT be inputs to any document fold** (FOLD-2) — fold portability requires content-only inputs. The kickoff's "merge latest = admission-time" lean is corrected accordingly (§4.1): admission is the *evidence* layer, never the *merge* layer.

### 12.6 Charter/targetKind confirmation for VAL-entry lists — **freeze-sensitive check, shared with 12.2A**
B3's appendOnly ops container assumes a LIST can charter VAL-layout (auto-interned) entries. Confirm against the frozen kind-attachment matrix / targetKind enumeration before the table freezes; if not legal, B3's container is the child-TAGDEF flavor only (acceptable; loses charter-bound appendOnly + Option A).

### 12.7 Explicit REJECTs (so silence doesn't decide)
- **Vector-clock / causal metadata as kernel or envelope fields** — REJECT (stays inside op payloads; time-alternatives' trap analysis confirmed by this lane).
- **Co-signed / cross-author atomic envelopes** — REJECT for v2 (chain-layer; KEL-era multi-key identity is a different thing and stays reserved as-is).
- **Lock/lease reserved word** — REJECT (no blessed pattern needs write-time exclusion; §10.3).
- **Kernel/discovery-index growth for author-filtered op enumeration** — REJECT (redeployable view or indexer-lane; Durable).
- **Per-keystroke/fine-op on-chain format** — REJECT (rung 2, §5.1).

### 12.8 P10 device-bit allocation — **SDK convention, urgency upgraded**
Not Etched, but launch-coupled to collaboration: self-EQUIVOCAL device collisions taint op batches out of LIVE folding (§4.3, F1). Needs the SDK allocation convention + a self-equivocation conformance vector before any B3 app ships.

---

## 13. Classic-FS/collab feature dispositions (pass rule 3)

| Feature | Disposition |
|---|---|
| File locking (flock, byte-range, mandatory) | **declared-gone** — artifact of one shared mutable cell; per-author slots are optimistic-by-construction; read-time reconciliation replaces exclusion; true mutual exclusion → chain layer |
| Group write permission (chmod g+w) | **re-homed** → curated-view membership (published team lens) + delegated authorship (P4 reserved, not built) + deny subtraction; "write permission" retired as a primitive |
| Conflicted copies (Dropbox) | **re-homed** → both versions first-class per-author; multi-claimant marker / MVR render; never silent forks |
| Merge (diff3 / git merge) | **re-homed** → B2 merger-signed merge revisions (human); B3 lens-scoped CRDT fold (automatic); the merge result is a view unless snapshot-signed |
| Cross-author delete in shared dir | **re-homed** → WHITEOUT/deny subtraction, per-reader, non-destructive |
| Oplocks / cache-coherence leases | **declared-gone** — no shared cache to keep coherent; poll/watch is the reactive-query lane's blessed pattern |
| Presence / awareness / who's-editing | **declared-gone from EFS** — ephemeral transport layer above |
| Atomic save (write-temp + rename) | **native, stronger** — one envelope batches new DATA + re-PIN (+ snapshot) atomically |
| Multi-writer append log (syslog) | **native** — per-author TAG accumulation; per-venue admission order; appendOnly LIST for tamper-evidence |
| Track changes / suggestions | **native-ish** → suggestion-TAGs + owner merge (B1); per-range cryptographic authorship exceeds Word |
| Version history of a co-owned doc | **native** — the op log / revision DAG *is* the history; nothing is ever destroyed; per-author as-of via checkpoints |
| "Who edited this and when" | **re-homed with honesty split** — who: cryptographic (per-op signer); when: `claimedAt` untrusted / `admittedAt` venue-trusted (never a fold input) |

---

## 14. Named failure modes

- **F1 self-EQUIVOCAL device collision:** two devices, same `(author, order)`, different digests → region EQUIVOCAL → user's ops excluded from LIVE folds (FOLD-6). *Fix:* P10 allocation convention (§12.8); conformance vector.
- **F2 app-layer wall-clock LWW gaming:** intra-doc LWW-by-timestamp fields are future-datable without kernel bound. *Fix:* MVR/causal-dominance defaults (§4.1); hygiene bound vs `tidTime(order)+600s`.
- **F3 fold-version skew (the Matrix lesson):** two clients, one op-set, different fold versions → different documents. *Fix:* merge-rule declaration is part of view identity (12.2); FOLD-1 conformance tests; self-hosted fold spec for the archive horizon.
- **F4 snapshot poisoning:** a trusted snapshot publisher signs a state ≠ fold(frontier). *Detection:* re-fold and byte-compare (snapshots are verifiable); a caught forger is evidence-backed lens-ejection material. GATE consumers must verify (FOLD-4).
- **F5 withheld-middle ops:** an author ships ops 1–5, 9–12; dependents pend. *Behavior:* render-with-pending (§3.2 corollary); the gap is provable from CRDT clocks; a chronic withholder is lens-ejection material. Not a correctness break (monotone fold).
- **F6 ops-container spam:** absorbed at writer's gas; invisible outside spammers' lenses; discovery pagination bounds reads; heavy public docs go snapshot+tail or indexer-lane.
- **F7 giant-op griefing:** 8192-B VAL cap forces spillover to REF+DATA (payer-priced); fold holds BYTES-UNAVAILABLE deps pending — availability degradation only.
- **F8 back-dated `claimedAt` / fake-first-authorship:** defused by earliest-`admittedAt` upper-bound evidence (P13/§4.2); never a fold input, so text position is unaffected.
- **F9 partial-replica fold:** older state, correctly labeled (worst-of-inputs currency); never wrong state — fold monotonicity is the defense slot-resolution needs anti-fallthrough for.
- **F10 GATE-on-unverified-fold:** an app treats a client's fold output as machine truth. *Ban:* FOLD-4; the consumable artifacts are verified snapshots or self-computed folds.

---

## 15. Prior-art scorecard (what each system settles for EFS)

- **dat/hypercore autobase** (the kickoff's "closest, under-studied" — confirmed): N single-writer signed append-only logs + deterministic local linearizer + materialized views with checkpoints ≙ author claim-streams + fold + snapshot. Autobase's writer set is *owner-managed*; EFS's is *reader-managed* (lens) — EFS's one genuine improvement, and the load-bearing one. Autobase's pain points (view rebase on late writes, indexer determinism) are F5/F3 in this report's terms; their existence in the closest cousin validates treating both as first-class.
- **Kleppmann 2022, Byzantine-fault-tolerant CRDTs:** hash-DAG + signatures ⇒ equivocation-detectable convergence among untrusted replicas — the academic license for §2.5; EFS's claimId/SeqCollision machinery is this construction deployed.
- **Automerge / Yjs:** metadata-cost reality (→ rung refusal, §5.1); composable update encodings (→ the session-batch quantum); state vectors (→ frontier descriptors); tombstones (→ FOLD-SUB's mechanism); Automerge's LWW-by-change-timestamp (→ the F2 anti-pattern to *not* import).
- **git:** merger-signs-the-merge (→ B2); revert-then-continue culture (→ §7); influence-vs-claims exclusion honesty (→ coarse-grain cost).
- **Matrix state resolution:** a deployed deterministic fold over a federated signed event DAG — the strongest existence proof for B2/B3's whole shape at internet scale, and (v1→v2 state resets) the strongest argument for fold-versioning outside Etched surface (§9, F3).
- **Farcaster:** coarse app-shaped deltas over signed logs with LWW/OR-set convergence at scale (→ B4's family works in production; bounded timestamps are a pattern, not a hack).
- **Perkeep:** permanode+signed-claims ≅ DATA+PIN/TAG (independent reinvention); it stopped at attribute-LWW and never did fine-grain merge — a caution that B3 is the ambitious rung, and B1/B4 alone already exceed Perkeep.
- **Datomic:** accretion-only as collaboration substrate (→ ops accrete; conflicts are queries); its single transactor is precisely the global sequencer EFS refuses — the honest trade named in §10.7.
- **RDF named graphs:** the vocabulary — per-speaker assertion sets, trust-scoped union — for documenting lens-scoped folds to DB-literate readers.
- **Google Docs / OT:** central-sequencer dependence (→ refusal §10.2); its "show authors" UX (→ FOLD-5's cryptographic upgrade).

---

## 16. Dependencies on other lanes / open questions for James

1. **12.2 decision** (charter word vs `mergeRule` row vs explicit convention) — the lane's one freeze-window ask; requires the 12.6 charter-shape confirmation either way.
2. **P1 admittedAt** — endorsed (evidence layer), with the FOLD-2 fence added to the verify-time-model fence list.
3. **A.8 claimedAt** — mild pro-row data point from B2; not load-bearing.
4. **P10 device bits** — SDK convention, collaboration-launch-blocking (F1).
5. **WHITEOUT spec** (trash/mount lanes) — B4 consumes it; the §12.4 promise-list is this lane's requirement statement.
6. **P3 composite-closure grades** (read-lens revision) — fold outputs are a second consumer; adopt once, serve both.
7. **OS-pass handoff:** content-addressed deterministic view functions (self-hosted fold specs, plausibly WASM) generalize beyond collaboration — the OS's "view = pure function over records" wants the same primitive (§5.3).
8. **Cookbook additions:** B1–B4 patterns, the archetype selector (§8.2), the refusal list (§10), the F-series failure modes — Durable, no freeze coupling.
