# FS Pass — RED TEAM: attack on multi-writer-collab.md (the CRDT re-test)

**Lane:** Red team against the collaboration lane's CRDT-as-lens-fold ruling
**Target:** `multi-writer-collab.md` — which **blessed CRDT-merge as a read-time fold** and advertised **"lens-scoped convergence"** as a primitive EFS is "structurally ahead" of the CRDT literature on.
**Read against:** codex-envelope, codex-kernel, read-lens-spec (full), time-alternatives, fable-fs-kickoff, plus the target report in full.
**Last touched:** 2026-07-10

---

## 0. Verdict (one page)

**The target's headline ruling is half-right in a way that inverts the interesting half. It correctly reclaims the op-*independent* CRDT algebra (G-set, LWW-register, OR-set, counters) — but that is exactly the algebra EFS already had and the dismissal already blessed. The genuinely novel thing it claims to reclaim — the op-*dependent* (sequence / text / RGA / Yjs) document, its "B3" pattern — reproduces every reason the original dismissal existed, and the report's own FOLD-SUB rule refutes the "lens-scoped convergence" novelty it markets on top of it.**

The single load-bearing error: the report treats "a CRDT document read is the identical shape to a lens fold" as one claim over "a finer state algebra" (§0, §2.2, §3.1). But CRDTs split cleanly into two classes with opposite properties under lens filtering:

- **Op-independent CRDTs** (state converges as a function of the *set* of ops, each op self-contained: grow-only sets, LWW-registers, PN-counters, OR-sets). Here the fold **is** genuinely lens-scoped — `fold over {op : author ∈ L}` is well-defined, cheap, and per-reader. This is B4 (shared folder), collaborative counters, approval sets. **The report is right, and it is not new**: this is the trivial CRDT EFS already is (time-alternatives confirms: "G-set + LWW-register + confluent union"). The dismissal never touched it.

- **Op-dependent CRDTs** (each op is *defined relative to a baseline of other ops* — a sequence insert names `leftOrigin`/`rightOrigin` item IDs created by other authors). Here **the fold cannot be lens-scoped and convergent at the same time.** To integrate a trusted author's op you must retain the (possibly untrusted) ops its anchors name, or the op dangles and rendering becomes implementation-defined (FOLD-1 broken). The report's own **FOLD-SUB** admits this — "excluded ops remain fold inputs as tombstoned items." That sentence *is* the refutation: excluded (untrusted) ops **do** enter the fold; the lens masks their *content*, never their *membership*. So "merge over the authors I trust," "lens gives per-reader op-set selection for free," "vandal ops never enter the fold" (W1.5), and "spam absorbed at the writer's gas, invisible outside spammers' lenses" (F6) are all **false for sequence CRDTs, and false by the report's own mechanism.**

Everything cascades from that:

1. **The novelty evaporates (§1/Attack A).** What survives is "an ordinary CRDT fold plus a per-reader content-visibility filter." That is not "structurally ahead of the CRDT literature"; it is CRDT + a rendering mask. The advertised primitive does not exist for the algebra that would make it interesting.
2. **The cost model is wrong (§2/Attack B).** Read cost is **O(all ops any trusted op transitively anchors on)**, not O(trusted ops); with permissionless writes and no write-gate, an adversary inflates it without bound. F6 ("invisible spam") and the §5.4 table (which prices only *writes*) both miss the dominant cost.
3. **Public convergent sequence-CRDT docs are impossible on EFS (§5/Attack E — the one FATAL).** Permissionless writes (a mission end) + must-fold-all-structure-to-converge = any vandal who knows the container id inflates every reader's fold. There is no in-kernel fix (a write-gate contradicts a mission end). The only mitigation — a blinded/capability-gated container — forfeits the "public team notes / open doc" use case B3 is sold for and makes the privacy tier a **prerequisite for B3 availability**, not a composition option.
4. **Snapshots don't rescue it (§3/Attack C).** Snapshot bytes are the *snapshotter's* fold under the *snapshotter's* lens. For any reader whose lens differs on any author ≤ frontier, the snapshot neither byte-matches nor accelerates — they fold from genesis. This breaks the O(tail) claim, breaks FOLD-4 GATE re-verification (folds are lens-relative, so "re-fold and byte-compare" has no canonical target across lenses), and makes snapshot **poisoning undetectable across lenses** (F4's detection assumes a canonical fold that the report's own thesis denies exists).
5. **FOLD-1 is under-specified (§4/Attack D).** Off-the-shelf sequence CRDTs tie-break interleaving on a **non-content-derived client-id** (Yjs: a random 32-bit int per doc-open). Two conforming implementations of the same `mergeRule` produce different byte output. FOLD-1 requires the merge-rule spec to pin a *content-derived* client-id — which ties it hard to P10 (client-id must be author-word ⊕ device-bits, or two devices of one author corrupt the CRDT).

**Net:** the design is not destroyed — **B1 (curated), B2 (revision-DAG + human merge), and B4 (OR-set container) survive intact and cover the overwhelming majority of real collaboration**, and the honest-boundary section (§10) is well-drawn and pre-concedes the genuinely impossible cases. What is overturned is the pass's highest-stakes *positive* claim: **B3 (op-fold document) as a blessed, lens-scoped, public-capable pattern.** The original dismissal was *more right than the report concedes* — it should be demoted to a narrow, private-container-only, effectively-closed-membership, honestly-DoS-warned option, or folded back into B2 for most cases. The report's inversion ("dismissed by association, shouldn't have been") reclaims the safe algebra and re-blesses the dangerous one under a novelty that its own FOLD-SUB rule disproves.

One FATAL (scoped to a capability, rooted in a mission end), five SERIOUS, four SURVIVABLE. Every serious finding has an in-design fix; all the fixes are "restate honestly + narrow scope + correct the cost model," none add kernel surface.

---

## 1. Attack A — "lens-scoped convergence" does not exist for sequence CRDTs (the flagship)

**Target claims:** §0 ("merge over the authors I trust… a collaboration primitive the CRDT literature wants and doesn't have deployed… EFS is structurally ahead"); §2.5 ("the op-set entering the merge is selected by trust, per reader"); §3.1 ("fold = CRDT join" subsumed under one sentence); W1.5 ("Mallory ∉ lens, her ops never enter the fold").

**The mechanism, stated precisely.** A sequence CRDT (RGA, Yjs/YATA, Logoot, Fugue) represents an insert as an item carrying references to neighboring items: Yjs `Item(id, origin=leftItemID, rightOrigin=rightItemID, content)`. Integration of an op is *defined* by locating `origin` and `rightOrigin` in the current item set and inserting between them, with concurrent inserts at the same gap ordered by a tie-break. **If `origin` names an item not present in the fold input, integration is undefined** — a conforming CRDT either drops the op, buffers it forever, or falls back to an implementation-specific position. All three violate FOLD-1 (byte-identical output across implementations).

**Therefore:** for reader R to integrate a *trusted* author A's op whose `origin` was authored by *untrusted* Z, R must retain Z's item. R's fold input is not `{op : author ∈ L}`. It is the **causal closure**: `{op : op is transitively named as an origin by some op with author ∈ L} ∪ {op : author ∈ L}`. The report's FOLD-SUB says exactly this ("excluded ops remain fold inputs as tombstoned items") — which means **the report's mechanism and the report's marketing contradict each other.** The mechanism is correct (retain-for-structure, mask-for-content). The marketing ("lens-scoped op-selection is free," "vandal ops never enter the fold") is false.

**Consequence — the adversary controls the fold-input set.** In collaborative text, anchoring is automatic: whenever an honest author types adjacent to text that exists in their editor, their op's `origin` is whatever item is there — including a vandal's. So a vandal is pulled into every reader's structural fold the instant any trusted author edits near vandal-authored text. W1.5's "nothing happens to any team reader" is only true if **no trusted author ever anchored on Mallory** — and, per Attack B/E, convergence *forces* honest clients to edit against the full container, which *guarantees* they can anchor on Mallory.

**Why you cannot escape by folding lens-first at write time.** The obvious "fix" — each author edits against their own lens-folded baseline, so they never reference untrusted items — **breaks cross-reader convergence.** If Alice anchors against her lens-folded view and Bob against his (different) lens-folded view, Alice's `origin` may be an item that does not exist in Bob's baseline, and vice-versa. Their ops no longer compose into one convergent document; FOLD-1 fails *between two honest trusted authors*. The only baseline every reader can reproduce identically is the **full admitted op-set** (differing only by partial replication, graded AS-OF). So convergence forces full-container editing, which forces vandal-referenceability. **This is not an implementation wart; it is a theorem about op-dependent CRDTs under per-reader op-selection.**

**Severity:** SERIOUS (overturns the pass's highest-stakes positive claim; partially vindicates the dismissal). Combined with Attack E it produces the one fatal capability loss.
**Fix inside design?** Yes, as honesty + scope, not as capability. State plainly: *for op-dependent CRDTs the lens is a content-visibility mask over a lens-independent structural fold; there is no free per-reader op-set selection; the fold input is the causal closure of the trusted set.* Delete the "structurally ahead / merge over authors I trust / invisible spam" claims. This demotes B3's novelty to "CRDT + visibility filter" and forces the cost/DoS corrections below.
**Minimal fix:** rewrite §0, §2.5, W1.5, F6; correct FOLD's input definition from "author ∈ L" to "causal closure of {author ∈ L}"; add the full-container-baseline conformance rule.

---

## 2. Attack B — the cost model prices the wrong thing; op-tail growth is unbounded and reader-borne

**Target claims:** §5.4 cost table (prices *writes* only); F6 ("ops-container spam: absorbed at writer's gas; invisible outside spammers' lenses; discovery pagination bounds reads"); §3.2 corollary ("missing data makes the doc older, never wronger").

**The attack.** Following Attack A, cold-start read cost for a B3 doc is **O(|causal closure of the trusted set|)** records fetched *and* CRDT-integrated, per reader, per venue, uncached. On a public container the closure is inflated at will:

- **Griefing without a live session.** Mallory publishes 10⁶ ops into the public container, each anchored to plausible positions in the live text (she reads the doc, she can craft valid `origin`s pointing at real items). She never needs the team's cooperation — permissionless writes (settled) let her spray directly. Because honest clients must fold the full container to converge (Attack A), every reader now fetches and integrates 10⁶ tombstones to render a two-paragraph doc. F6's "absorbed at the writer's gas, invisible" is false: the cost lands on **every reader**, forever, and the writer paid once.
- **Discovery pagination does not bound it.** §5.4 leans on `discover(tagId, cursor, limit≤256)`. Discovery paginates *enumeration*; it does not let a folder skip structurally-referenced ops. To fold you need the whole closure, not a page of it.
- **"Older not wronger" is the wrong reassurance.** F9/§3.2 says partial replication only makes the doc older (monotone). True — but the DoS is not about staleness; it is about the **mandatory work to reach *any* rendered state.** A doc you cannot afford to fold is not "older," it is unreadable.

**No write-gate can stop this** — permissionless writes is a mission end. `maxEntries` is a read-time filter (envelope amendment 1), so it caps *rendered entries*, not *folded structure*: a capped ops-LIST still admits and must still fold every entry for causal structure. appendOnly (the report's recommended container flavor for public/adversarial docs, §5.2(i)) makes it *worse* — you cannot even revoke the spam entries out of enumeration.

**Severity:** SERIOUS (this is the "op-tail growth / gas" vector the re-test was told to attack; the cost model hides the dominant term).
**Fix inside design?** Partial. (a) Correct the cost model to O(causal closure), reader-borne. (b) The *only* real mitigation is container-blinding (Attack E) so vandals cannot find the container to spray — which forfeits public B3. (c) Snapshots help *within one lens* only (Attack C). There is no fix that preserves public + bounded + permissionless + convergent simultaneously.
**Minimal fix:** rewrite F6 and the §5.4 table to price reader-side fold over the causal closure; state that public B3 has unbounded reader-borne cost and requires container-blinding to be viable.

---

## 3. Attack C — snapshots are lens-relative, so they break the O(tail) claim, GATE re-verification, citation, and poisoning-detection

**Target claims:** §5.3 (snapshot `S` = fold output at frontier `F`; readers "resolve the most recent trusted snapshot, then fold only ops beyond F"; frontier descriptor = "state vector + contentHash"); §2.3 level 2 ("cite a snapshot claim… verifiable by re-fold"); FOLD-4 (GATE consumes a snapshot "whose fold they have re-verified"); F4 ("detection: re-fold and byte-compare").

**The attack.** A fold is lens-relative — that is the report's central thesis. Therefore the snapshot bytes `S` encode the **snapshotter's lens decisions** about every author ≤ F (whose content is masked, whose is shown, whose is denied). The report drops the lens from the frontier descriptor (`F` = state vector + contentHash only). This is the bug, and it cascades:

1. **O(tail) is false across lenses.** A reader whose lens differs from the snapshotter's on any single author ≤ F cannot use `S`: folding "ops beyond F" on top of `S` gives a document that reflects the snapshotter's masking, not the reader's. To get *their own* document they must fold from genesis. In an open, multi-lens system (the whole EFS thesis) lenses routinely differ. So the snapshot accelerates reads **only within a single curator's audience** — precisely the bounded-closed setting, not the open one B3 is sold for.
2. **FOLD-4 GATE has no canonical target.** "A snapshot whose fold they have re-verified" — re-verified under *whose* lens? If the gate uses its own lens, honest snapshots fail verification (different lens → different bytes) and no multi-author doc is ever GATE-consumable. If the gate must adopt the snapshotter's lens, then the gate is trusting the snapshotter's trust decisions wholesale, which is just "trust the snapshotter" — the verify-don't-trust property FOLD-4 claimed to preserve is gone.
3. **Citation (§2.3 level 2) is unverifiable unless it pins the lens.** read-lens §1.2 citation-form *does* carry `?lenses=`, so the fix is available — but §5.3's snapshot recipe omits it, so a snapshot claim as specified cannot be verified by a differently-lensed reader.
4. **Snapshot poisoning (F4) is undetectable across lenses.** F4's detection = "re-fold and byte-compare." A reader with a lens ≠ the snapshotter's *legitimately* gets different bytes on an honest snapshot — so they cannot distinguish "honest snapshot under a different lens" from "poisoned snapshot." Detection only works same-lens. A malicious snapshotter can therefore publish poison that only same-lens auditors can catch.

**Bonus: the snapshot-provider ejection cliff.** §5.3 says "resolve the most recent *trusted* snapshot." If a long-lived doc has a single active snapshotter P and R later ejects P (P turned malicious), R has **no trusted snapshot** and must fold the entire history — O(100-year archive). Snapshots create a hidden dependency on the continued trustedness of the snapshotter; ejecting them is a cost cliff the report never prices.

**Severity:** SERIOUS (breaks the compaction protocol's headline benefit and FOLD-4's GATE safety in exactly the open/multi-lens setting).
**Fix inside design?** Yes. Make the snapshot recipe **lens-bound**: `snapshot = (bytes, frontier state-vector, mergeRule, lensIdentity, contentHash)`. State that a snapshot is a verifiable acceleration **only for readers using that lens**, and a citation of a collaborative doc must pin the lens (as citation-form already can). For GATE, the consumable object is "a snapshot under a *closed author set the gate itself declares*," folded/verified by the gate — i.e. the gate picks the lens, the snapshotter is irrelevant. Require ≥2 independent snapshotters for long-lived docs to avoid the ejection cliff (a governance cost, name it).
**Minimal fix:** add `lensIdentity` to `F`; rewrite §5.3, §2.3.2, FOLD-4, F4 to be explicit that fold/verify/poison-detection are all lens-relative.

---

## 4. Attack D — FOLD-1 is under-specified: off-the-shelf CRDTs break byte-determinism on client-id

**Target claims:** FOLD-1 ("same admitted set + lens + deny set + fold spec (algorithm and version) ⇒ byte-identical view state on every conforming implementation"); §12.2 (`mergeRule` = `<family>/<algo>-v<major>`, e.g. `crdt/yjs-v2`).

**The attack.** Sequence-CRDT convergence orders concurrent inserts at the same gap by a **client-id tie-break**. In Yjs the client-id is a **random 32-bit integer chosen at document open** — not content-derived, not stable, not a function of the author. Two conforming implementations of `crdt/yjs-v2`, or the same implementation across two sessions, assign different client-ids to the same author → different tie-break → different interleaving → **different bytes from the identical trusted op-set.** FOLD-1 fails though every input the report names (admitted set, lens, deny set, mergeRule version) is identical. Automerge's actorId has the same property. The report's F3 ("fold-version skew") notices *version* skew but misses *client-id* skew, which occurs *within one version*.

This is not academic: it is the difference between "the mergeRule word is enough for interop" (what §12.2 assumes) and "the mergeRule spec must additionally pin the client-id derivation as a content function." Without the latter, two honest EFS clients render the same trusted data as different documents — the per-client-dialect failure at its worst, in the exact place users check "do we see the same doc?" (F3's own framing).

**The tie to P10.** The fix — client-id must be a content function of the author (e.g. `clientId = authorWord ⊕ deviceBits`, or derived from the op's claimId) — collides with multi-device: if `clientId = authorWord` alone, an author's two devices share a client-id, and two items with the same (client, clock) but different content corrupt the CRDT (this is worse than the EQUIVOCAL slot case — it silently mis-integrates). So `clientId` **must** incorporate the P10 device bits, and P10's allocation convention becomes a determinism dependency, not just an EQUIVOCAL-avoidance one. This raises P10 from "collaboration-launch-blocking" (the report's §12.8 framing) to "FOLD-1-correctness-blocking."

**Severity:** SERIOUS (silent cross-implementation non-convergence; undermines the "100-year replayable archive" promise for B3, since a 2126 re-folder needs the client-id rule, not just the algorithm).
**Fix inside design?** Yes — the merge-rule declaration (§12.2) and the self-hosted fold spec (§5.3) must pin client-id as `f(authorWord, deviceBits)` and forbid session-random client-ids. No kernel surface.
**Minimal fix:** amend FOLD-1 and §12.2 to require a content-derived, P10-coupled client-id in every blessed mergeRule; add a conformance vector.

---

## 5. Attack E — public, permissionless, convergent sequence-CRDT collaboration is impossible on EFS (the FATAL, scoped)

**Target claim:** §8.2 B3 archetypes ("team notes, whiteboards, structured co-owned state"); the implicit assumption throughout §5 that a B3 ops-container can be a public, discoverable TAGDEF/LIST; §11 framing of container-blinding as a *privacy* composition, not an availability prerequisite.

**The attack, assembled from A + B + D.** For a sequence-CRDT document to be (i) **public/discoverable** (a known container id anyone can read), (ii) **permissionlessly writable** (mission end — anyone can ASSERT ops into it), (iii) **convergent across readers** (FOLD-1 — everyone with the same records+lens sees the same doc), and (iv) **bounded in reader cost** — all four cannot hold. (ii)+(iii) force full-container structural folding (Attack A). (i)+(ii) let any vandal spray unbounded structural mass into the closure (Attack B). So (iv) fails. Dropping (iii) gives non-convergent per-lens garbage; dropping (ii) requires a write-gate that does not exist and cannot (mission end); dropping (i) — a **blinded/capability-gated container** (§11's salted TAGDEF, so vandals cannot find it to spray) — is the *only* survivable choice, and it forfeits public collaboration.

**This is fatal, and it is rooted in a mission end, so there is no in-kernel fix.** The report's granularity theorem (§8.1) gestures at the boundary ("fine grain affordable only inside a bounded, semi-trusted set") but understates it in two ways: (a) it treats "bounded, semi-trusted" as sufficient, when the real requirement is **container-unlinkability** — a *bounded* set whose *container is public* is still DoS-able by an outside vandal who finds the id; (b) it presents container-blinding as a Pass-2 privacy nicety (§11), when for B3 it is **load-bearing for availability**, not confidentiality. A public B3 whiteboard is not merely "less private" than a blinded one — it is *unbuildable*.

**Worked failure (W1 re-run adversarially).** W1 declares the ops-LIST under doc `D` with `appendOnly`. If `D` and its ops-container are public (discoverable — the whole point of an on-chain filesystem), Mallory enumerates the container and sprays 10⁶ anchored ops overnight. appendOnly means the team cannot even revoke them from enumeration. Every team reader's next cold fold is 10⁶ records. W1.5's "nothing happens to any team reader" is precisely inverted: *everything* happens to every team reader, and the only escape (§5.2's fallback to the private child-TAGDEF flavor) requires abandoning appendOnly *and* blinding the container — i.e. leaving the public, gaslight-proof configuration the report recommended for "public/adversarial" docs. **The report recommends appendOnly-public for adversarial docs; adversarial-public is exactly where appendOnly-public is a DoS amplifier.**

**Severity:** FATAL for the capability "public convergent sequence-CRDT document," which B3 is advertised to provide. Not fatal to EFS or to collaboration-on-EFS (B1/B2/B4 survive).
**Fix inside design?** No fix preserves the capability (a mission end blocks the only kernel remedy). The honest resolution: **remove "public" from B3's envelope.** B3 is viable *only* on a blinded, capability-gated, effectively-closed-membership container. Public open-world documents are B2 (revision-DAG + human merge + coarse-grain exclusion), which the report already blesses and which is DoS-resistant because a revision is one record and exclusion is a DAG-filter, not a structural fold.
**Minimal fix:** state that B3 requires a blinded container (privacy tier is a *prerequisite*); move all public/open-world document archetypes from B3 to B2; strike "public/adversarial → appendOnly B3" from §5.2 — public/adversarial → B2, full stop.

---

## 6. Attack F — the wiki edit-war: merging does not resolve an *active* war, only curation does

**Target claims:** §7 ("any editor can end the fork by publishing a covering merge (citation-coverage dominance is deterministic and trust-free)"); §8.2 B2 "refuses: automatic merge" but claims edit wars "survivable."

**The attack.** In B2, page state under lens L = the head-set of the revision DAG restricted to L-trusted authors. A covering merge `r_m` cites the current heads `{r_a, r_b}` as parents, collapsing them to `{r_m}` — *if `r_a`, `r_b` are still the heads.* But in an **active** edit war, Alice publishes `r_a' ` (child of `r_a`) the moment she sees `r_m`; now heads = `{r_m, r_a'}` — `r_a'` is not covered by `r_m`. Merging is a **liveness race the appending adversary wins by continuing to append.** "Citation-coverage dominance is deterministic and trust-free" is true for a *quiescent* fork and false for the *active* war that is the whole phenomenon of an edit war. The report's §7 claim over-promises: it says merging ends forks; it does not, against a live opponent.

What actually ends an edit war is **curation** — a lens/moderator that ejects one warrior, or a curator who publishes a head-pick. The report says this elsewhere ("communities that want one answer appoint curators," §10.6), so the design *has* the answer; §7 just states the wrong mechanism as the resolver. This matters because the task named the wiki edit-war as a case to test the blessed patterns against, and the blessed B2 narrative claims a resolution path (merge) that does not work.

**Severity:** SERIOUS-to-SURVIVABLE (the design resolves it via curation; the report attributes resolution to the wrong mechanism, which would mislead a builder into a losing merge race).
**Fix inside design?** Yes — the resolver is curation, already in the design.
**Minimal fix:** amend §7: "a covering merge ends a *quiescent* fork; an *active* edit war is ended only by curation — ejecting a warrior from the lens, or a curator publishing a head-pick — never by merging, which an appending opponent out-races."

---

## 7. Attack G — two-device-one-author: the idempotence claim is wrong, and P10 alone is insufficient

**Target claims:** §5.2 ("byte-identical op replay dedupes structurally, same value → same propertyId → same slot; CRDT idempotence falls out of the interning machinery"); §4.3/§12.8 (P10 device bits fix the self-EQUIVOCAL collision).

**Two distinct problems the report conflates.**

1. **Replay-idempotence vs concurrent-duplicate-suppression.** The interning machinery dedupes *byte-identical* VAL payloads. That gives **replay-idempotence** (re-submitting the *same* op blob cross-chain → same propertyId → no duplicate) — genuinely useful, and it is what cross-chain replay needs. But the report frames it as "CRDT idempotence," implying it prevents duplicate *insertion*. It does not. Two devices of one author typing the same letter produce **different** op blobs (different client-id/clock inside the blob) → they do **not** intern → both insert → the character appears twice. CRDT sequence idempotence is about re-delivering the *same item ID*, which interning does handle — but the report's phrasing ("same value → same slot") suggests same *content* dedupes, which is false and would mislead an implementer into thinking concurrent same-content edits are safe.

2. **P10 is necessary but not sufficient.** Persistent distinct device bits stop the self-EQUIVOCAL `(author, order)` collision (F1) — good. But (a) per Attack D, the CRDT client-id must incorporate those device bits or FOLD-1 breaks; and (b) an author editing the same doc on two offline devices still generates two genuinely-concurrent op streams that merge with interleaving/duplication of *their own* text — inherent to offline multi-device, not fixed by P10. The report's "P10 solves the collaboration multi-device story" (§4.3) oversells: P10 solves the self-DoS, not self-concurrent-merge quality, and P10 must be wired into the client-id derivation to solve determinism.

**Severity:** SURVIVABLE (correctness of the *claims*, not a break of the substrate; but §5.2's idempotence phrasing is a load-bearing correctness statement stated wrong).
**Fix inside design?** Yes.
**Minimal fix:** split §5.2's claim into "replay-idempotence (real, via interning)" and "concurrent same-content edits are NOT suppressed"; tie P10 (§12.8) to the client-id derivation (Attack D) and downgrade "P10 solves multi-device collaboration" to "P10 + content-derived client-id solve the determinism and self-DoS halves; self-concurrent merge quality is inherent."

---

## 8. Attack H — ejection does not reduce fold cost or structural exposure (the archetype/weakness collision)

**Target claims:** §7 ("eject the vandal → their revisions leave your DAG → the page re-renders pre-vandalism, instantly, per-reader" — stated for B2, but the report implies the same clean ejection for B3 via FOLD-SUB); §8.2 B3 archetypes ("team notes, whiteboards" — exactly the docs people eject departed collaborators from).

**The attack.** For **B2** (revisions), ejection is clean and cheap: a revision is a whole record; ejecting an author filters whole revisions out of the DAG; heads recompute; cost drops. The report's §7 wiki story is correct *for B2*.

For **B3** (op-fold), ejection is neither clean nor cheap, and the report's §3.2/FOLD-SUB quietly concede it: ejecting an author **retains their ops as tombstones** (else causal holes). So ejection **hides their rendered content but keeps their full structural mass in every reader's fold** — cost does not drop, and the ejected author's structural influence (where everyone else's text sits) persists forever. The B3 archetypes are exactly the surfaces with membership churn (a teammate leaves; a whiteboard collaborator is removed). So B3's flagship use cases (§8.2) collide head-on with B3's flagship weakness: **in B3 you can never fully leave, and removing someone never makes the doc cheaper or structurally cleaner — only visually cleaner.** The report presents ejection as a uniform win across B2/B3; it is a win only in B2.

**Severity:** SERIOUS (the report's own B3 archetypes are the worst case for B3's ejection semantics; a builder choosing B3 for "team notes with people joining and leaving" gets monotonically-growing fold cost and permanent structural entanglement with everyone who ever edited).
**Fix inside design?** Partial. Snapshots can "bake in" the tombstone skeleton so a consuming reader need not re-fetch ejected authors' raw ops — but the snapshot is lens-relative (Attack C), so this only works for readers sharing the snapshotter's lens. For genuinely-churning membership, the honest answer is B2, not B3.
**Minimal fix:** state in §8.1/§8.2 that B3 ejection is content-only, never cost- or structure-reducing; route "membership-churning documents" to B2; reserve B3 for *stable*-membership bounded sets.

---

## 9. Attack I — trusted content is availability-hostage to untrusted authors' data

**Target claim:** F5 ("withheld-middle ops… render-with-pending… a chronic withholder is lens-ejection material. Not a correctness break"); §4.2 (offline replay integrates cleanly).

**The attack.** Carol (trusted) signs ops Monday whose `origin`s reference items authored by X. If X was ejected Tuesday (left the team) or is a vandal, Carol's trusted ops still *structurally depend* on X's items. At any venue lacking X's ops (partial replication, or X withholds them), Carol's anchors dangle → Carol's contribution **pends invisibly** until X's (untrusted, ejected) ops replicate. So **the availability of a trusted author's content is causally coupled to the data-availability of an untrusted author.** F5 says "a chronic withholder is lens-ejection material" — but here the withholder is *already ejected*, so ejection does nothing; the reader is hostage to an untrusted party's willingness to publish. This is a censorship lever: X can suppress Carol's trusted work at any venue by withholding the ops Carol anchored on.

**Severity:** SURVIVABLE (availability, not correctness — but a real censorship coupling the report dismisses too quickly).
**Fix inside design?** Partial and self-conflicting: the fix is snapshots that embed the structural skeleton (so Carol's contribution is renderable from the snapshot without X's raw ops) — but snapshots are lens-relative (Attack C), so this only closes the gap for same-lens readers, and a fresh venue with no trusted snapshot is still hostage. The deeper fix (authors re-anchor only to trusted baselines) reintroduces the convergence break of Attack A.
**Minimal fix:** acknowledge the coupling in F5/§10; recommend frequent multi-party snapshots that embed the skeleton as the mitigation; note it does not fully close at fresh venues.

---

## 10. Minor / prior-art over-claims

- **Kleppmann-2022 BFT-CRDT "already implemented by EFS" (§2.5, §15) is overstated.** Kleppmann's Byzantine-tolerant convergence relies on a **first-class causal hash-DAG** — each op names its causal predecessors by hash, and the convergence proof traverses that DAG. EFS deliberately **fences `prev` to evidence-only, never read** (codex-envelope) and **REJECTS causal metadata as kernel/envelope fields** (§12.7), relegating all causal references to *inside opaque op blobs* the kernel never inspects. So EFS has the ingredients (content-addressed sigs) but not Kleppmann's construction: the BFT convergence is an **app-layer promise inside the blobs, unenforced and unverifiable by the substrate**, and its correctness rides entirely on FOLD-1 — which Attack D shows is under-specified. Claim should read "EFS has the cryptographic primitives; the BFT-convergence property is an app-layer obligation, not a substrate guarantee."
- **"CRDT idempotence falls out of interning" (§5.2)** — see Attack G; it's replay-idempotence, not concurrent-duplicate-suppression.
- **§2.2's "Yjs/Automerge functions are commutative/associative/idempotent by construction, so venue convergence of the document follows"** is true only for a *fixed* op-set; it silently assumes away interleaving anomalies (Attiya et al. 2016 — sequence CRDTs interleave concurrent runs; convergent but semantically corrupt), which EFS's long settlement latency (offline-Monday-admit-Thursday, §4.2) *amplifies* by widening concurrency windows far beyond live-session CRDTs. Not a determinism break, but a merge-*quality* regression the report presents as clean ("Carol's text integrates at its Monday anchors") when a whole session integrating against a week-diverged tree is exactly the worst case for RGA-family merge quality. Pushes more real cases to B2 than the report admits.

---

## 11. What survives (fair credit — the attack is targeted, not total)

- **The two-layer records/views framing (§3.1)** is sound and valuable: "everything written is a single-author signed record; everything merged is a view" correctly subsumes slot resolution, folder listings, and op-independent CRDTs. The rebuttal to "merged state breaks author = recovered signer" (§2.1 — the invariant governs records, not views) is **correct**.
- **B4 (shared folder as OR-set, §6)** is fully sound. It is an op-*independent* CRDT; the fold *is* lens-scoped, cheap, and needs no new machinery. This is the report's best result and it holds against every attack above (no causal anchoring → no tombstone-mass → no DoS amplification → no client-id determinism gap). Collaborative counters and approval sets are in the same safe class.
- **B1 (curated) and B2 (revision-DAG + human merge)** survive intact and are DoS-resistant (a revision is one record; exclusion is a DAG-filter, not a structural fold). B2 is the correct home for *all* public/open-world/churning-membership documents — including the wiki, the case the report itself works best.
- **The honest-boundary section (§10)** is excellent and pre-concedes the genuinely impossible cases (live transport, OT central-sequencer, write-time exclusion, cross-author atomicity, portable cross-author recency, one-true-doc-without-a-curator). I could not construct a "proves EFS unusable" app that isn't already refused here — the completeness story for what it *claims* is honest.
- **The E2EE argument (§11)** — read-time fold runs client-side post-decryption; kernel-side merge would need plaintext — is **correct and important**, and (unremarked by the report) it is *also* the argument for why B3 must be private: the same blinding that enables encrypted collaboration is the DoS mitigation of Attack E. The report has the mechanism; it just files it under confidentiality instead of availability.
- **Zero kernel change, and the freeze-sensitive reservations (§12)** are handled well: the REJECTs (new kind, vector-clock fields, co-signed envelopes, lock word) are all correct, and the one real decision (§12.2 merge-rule declaration) is correctly identified as the freeze-window ask — though Attack D shows it must pin *more* than the report thinks (client-id derivation, not just algorithm+version).
- **The `admittedAt`-out-of-the-fold correction (§4.1, FOLD-2)** is a genuine improvement over the kickoff lean and survives — a fold that read venue-local admission order would break replication convergence, exactly as the report argues.

---

## 12. Severity table and minimal fixes

| # | Finding | Severity | Fix in design? | Minimal fix |
|---|---|---|---|---|
| E | Public convergent sequence-CRDT docs impossible (permissionless + full-structural-fold) | **FATAL** (scoped to the capability; rooted in a mission end) | No fix preserves the capability | Remove "public" from B3; public/open-world docs → B2; B3 only on blinded containers |
| A | "Lens-scoped convergence" novelty refuted by FOLD-SUB; fold input = causal closure, not trusted set | SERIOUS (overturns the pass's top positive claim) | Yes, as honesty+scope | Delete the novelty/invisible-spam claims; redefine fold input as causal closure; state lens = content mask only |
| B | Cost model prices writes only; reader fold cost O(closure), adversary-inflatable | SERIOUS | Partial (only container-blinding truly mitigates) | Reprice §5.4/F6 to reader-side fold over the closure |
| C | Snapshots are lens-relative → break O(tail), GATE re-verify, citation, poison-detection | SERIOUS | Yes | Lens-bind the snapshot recipe; snapshots accelerate/verify only same-lens; ≥2 snapshotters |
| D | FOLD-1 breaks on non-content-derived client-id (Yjs random actorId) | SERIOUS | Yes | mergeRule must pin client-id = f(author, deviceBits); ties P10 to determinism |
| F | Merging doesn't end an *active* edit war; only curation does | SERIOUS→SURV | Yes (curation is in the design) | Correct §7's resolver from merge to curation |
| H | B3 ejection is content-only, never cost/structure-reducing; collides with B3's own archetypes | SERIOUS | Partial (snapshots, lens-limited; else B2) | State B3 ejection ≠ cost reduction; route churning-membership → B2 |
| G | Interning = replay-idempotence, not concurrent-dup-suppression; P10 alone insufficient | SURVIVABLE | Yes | Split the §5.2 claim; wire P10 into client-id |
| I | Trusted content availability-hostage to untrusted authors' ops (censorship coupling) | SURVIVABLE | Partial (skeleton-embedding snapshots, lens-limited) | Acknowledge in F5/§10; recommend skeleton snapshots |
| J | Kleppmann-BFT "already implemented" overstated; substrate lacks the causal DAG the proof needs | SURVIVABLE | Yes | Restate as app-layer obligation, not substrate guarantee |

---

## 13. Net ruling on the highest-stakes claim

The re-test asked whether the early CRDT dismissal was wrong. The report answered "right about the kernel, wrong about the read layer — CRDT-merge is a blessed read-time fold with a novel lens-scoped-convergence primitive." **This red team's ruling: the dismissal was right about the kernel *and* substantially right about the read layer for the only algebra that made the reclamation interesting.**

- For **op-independent CRDTs** (B4, counters, OR-sets, approvals) the report is correct — but this is the trivial CRDT EFS already was; nothing was dismissed and nothing is novel.
- For **op-dependent CRDTs** (B3 sequence/text documents) the report's central claims are refuted by its own FOLD-SUB rule: the fold is not lens-scoped (Attack A), the cost model is wrong and adversary-inflatable (Attack B), the compaction protocol is lens-relative and doesn't compose across the open world (Attack C), determinism is under-specified (Attack D), ejection buys visibility not cost (Attack H), and the public case is outright impossible (Attack E, fatal, mission-end-rooted).

The design is **not destroyed** — B1/B2/B4 plus the honest-boundary section carry real collaborative work, and the wiki/edit-war and two-device cases resolve (via curation and P10+client-id respectively) once the report's over-claims are corrected. But **B3-as-blessed-public-pattern must be overturned**: demote it to a narrow, private-container, stable-membership, honestly-DoS-and-cost-warned option, and send every public/open-world/churning document to B2. The report's advertised structural lead over the CRDT literature does not exist; what exists is a correct, unremarkable "CRDT + per-reader visibility mask," carrying an unbounded adversarial cost the report priced at zero.
