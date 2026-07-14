# Red team — attack on the time/versioning lane report

**Target:** `fspass/time-versioning.md` (lane report, 2026-07-10)
**Ground truth consulted:** [[verify-time-model]] (all six fixes re-checked one by one), [[time-alternatives]], [[codex-envelope]] (adopted core + amendments, master invariant, 600s fence, G-set), [[codex-kernel]] (comparator, spine, read ABI, subset re-admission), [[codex-kinds]] (expiresAt word, reserved rows, refusal semantics), [[read-lens-spec]] (§1.3, §2, §3.1–3.4, §5.1–5.4, §9.B/9.C, RR1–12), [[freeze-gates]] §A.8/§C, [[client-os-pressure-report]] P1/P13, [[fable-fs-kickoff]].
**Date:** 2026-07-10

---

## 0. Verdict in one paragraph

**SURVIVES WITH REPAIRS — no fatal, seven serious defects, each with a minimal fix available inside the report's own machinery.** The report's spine holds under attack: per-envelope `order` is the right granularity (though its Datomic justification overreaches — see A7), the reversal of verify-time-model's fix 6 is *correct and a genuine strengthening* (I tried to rehabilitate fix 6 and failed: any venue's `admittedAt` is a lower bound on signing time, so `now − admittedAt` understates checkpoint age whenever submission is delayed — fail-open at home too, not just on replicas), the beacon is sound as a freshness anchor, and the freeze-sensitive reservations in §6 are properly flagged with no unflagged frozen-surface renames. But: the report **silently dropped verify-time-model's fix 4** (the `admittedAt` comparator fence) while adding machinery that makes the fence more necessary; its `revokedAt` word omits the write-once rule whose absence the report itself names as an attack one paragraph earlier (FM-J); its headline falsifier correction is internally contradictory (the forward falsifier and the "future `claimedAt` is legal testimony" bullet cannot both ship); the directory-snapshot design pins *Thursday's* lens/deny/evidence for a "Tuesday" snapshot — the as-written/as-seen split it names for data is never applied to the view-parameters themselves; BASIS-OPEN snapshots are not merely "improvable" but **author-forgeable backward** (and their portability claim is overstated); and the inverse-batch undo algorithm clobbers later writes and resurrects superseded content in two named corner cases. All fixes are local. Details, severities, and minimal fixes below.

---

## 1. Method

Each attack: **target → attack → severity (FATAL / SERIOUS / SURVIVABLE) → fix-exists-inside-design? → minimal fix.** The six mandated attack surfaces are covered: lens-membership change vs snapshots (A4), checkpoint gaps for lazy authors (A5), the verify-time-model fix audit (A1, plus the fix-6 reversal verification in §3), the `claimedAt` row ruling vs the freeze pledge (§4), per-envelope `order` vs multi-device/offline (A6, A7), and the frozen-surface rename audit (§4). I attempted and failed to break: the fix-6 reversal, the beacon construction as a freshness anchor, the per-envelope granularity ruling itself, the FS-2 body-shape spec, the §3.1 venue-anchor revocation conjunction, and the empty-on-revoke consistency of the tri-split restore. Those survive; the failures are recorded where they sharpen a finding.

---

## 2. The attacks

### A1. SERIOUS — verify-time-model fix 4 was silently dropped: the `admittedAt` comparator fence is gone

**Target:** §2.2, §2.5, FS-3, §8.

**Attack.** [[verify-time-model]] §3.1 / fix 4 demands a normative fence *mirroring the `prev` hard-fence*: "`admittedAt` MUST NOT enter any slot comparator, supersession decision, or cross-chain ordering. It is per-venue evidence only, always venue-qualified." Audit of the lane report against the six fixes:

| verify fix | carried? | where |
|---|---|---|
| 1 rename reframe (wire-breaking) | YES | FS-1 |
| 2 claimedAt placement + canonicality stack | YES (sharpened to always-present) | FS-2 |
| 3 P13 extension + falsifier + citation-edge limit | YES (direction corrected — legitimate) | §2.6 Q3, §8.3 |
| 4 **comparator fence** | **NO — only the venue-qualification and non-portability halves survive** (§2.3, §2.2 table, §2.5.5). The normative fence sentence appears nowhere: not in FS-3, not in FM catalog, not in the §8 handoff queue | — |
| 5 stored + priced | YES | FS-3, §9 |
| 6 freshness re-anchor | explicitly REVERSED with argument + FM-D — legitimate red-team-of-the-verifier behavior, and correct (§3 below) | §2.6 |

§2.2 argues at length *why* transaction-time must never key supersession — and then never states the obligation. This is exactly the failure verify-time-model's fence was written to prevent, and the report makes it *worse* while dropping it: FS-4 (`revokedAt`) and §3.1 (venue-anchored as-of reads that filter by `admittedAt ≤ T`) put admission-time reads directly adjacent to slot resolution. An implementer of `asOf(venue T)` is one refactor away from "which is newer = later admittedAt." The fence is the guard rail, and the report removed it from the shipping set at the moment it built the road next to the cliff.

**Fix exists inside the design:** yes — trivially. **Minimal fix:** add the fence sentence to FS-3 (freeze-bound, since it constrains the stored word's legal consumers) and to the §8 handoff list, worded to permit the two legitimate uses the report itself defines (venue-labeled as-of filtering; Q1 existed-by evidence) while banning comparator/supersession/cross-chain-ordering use. One paragraph.

### A2. SERIOUS — `revokedAt` lacks the write-once rule; the report's own FM-J attack applies to it verbatim

**Target:** §2.5.2, FS-4, FM-J.

**Attack.** FS-3 specifies write-once for `admittedAt[claimId]` and FM-J names the attack it closes ("age-refresh-by-replay"). FS-4 — the immediately adjacent word — specifies no write-once for `revokedAt[(revoker, claimId)]`. Carriage is permissionless: **anyone** holding the author's old signed REVOKE envelope can re-submit it (that is the portability model; and [[codex-kernel]]'s "subset re-admission skips already-admitted claimIds" does not obviously cover REVOKEs, which have no claimId — so a naive implementation re-stamps the G-set value on every re-admission). Consequence: an adversary — or the author, in a dispute — moves `revokedAt` **later** at will. Every venue as-of read the report builds on the word (§3.1 row 3: "was this revoked as of T," conjoining `admittedAt ≤ T ∧ revokedAt ≤ T`) then flips from *revoked-at-T* to *not-yet-revoked-at-T*. Concrete failure: an audit gate asks "was the malicious config already revoked on the audit date?"; the counterparty re-submits the old REVOKE envelope the day before the query; the venue now answers no. The §4.5 basis-selection bridge ("transaction-time selects") is corrupted the same way: Tuesday's anchor selection at the trusted venue silently changes after a re-submission.

**Fix exists inside the design:** yes — the report already invented it for the sibling word. **Minimal fix:** one sentence in FS-4: "`revokedAt` is set at first admission of the pair at this venue; re-admission of the same pair (any carriage) MUST NOT update it." Add the FM-J wording "…and revokedAt" so the failure mode covers both words.

### A3. SERIOUS — the forward falsifier and "future `claimedAt` is legal testimony" contradict each other; the +600s is underived

**Target:** §2.6 Q3 (Correction 2 and the bullet after it), FS-2.

**Attack.** Two normative statements four lines apart:

1. "`claimedAt > earliestKnownAdmittedAt(sameRecord) + 600s` is **proven false testimony** — the record demonstrably existed before the author claims to have authored it."
2. "**Future `claimedAt` is legal testimony** ('scheduled for publication') — no cap; … render as asserted-future."

These cannot both hold. A post signed and admitted on Jan 1 carrying `claimedAt = Feb 1` ("scheduled") satisfies the falsifier's condition (claimedAt exceeds earliest admission by ≫ 600s) and is simultaneously declared legal by bullet 2. The root cause is a semantic fork inside one field: FS-2 defines `claimedAt` as "when they did that action" (past-directed, performed-at), and bullet 2 quietly adds a second semantic (future intent). One uint64 cannot carry both and stay falsifiable — any caught liar retro-claims the "scheduled" reading, and the falsifier (one of the lane's three headline corrections) dies.

Secondary defect: the **+600s slack is underived**. The 600s constant is the *order/tidTime* future fence; `claimedAt` has no cap, so the fence constant has no business in its falsifier. The honest slack is block-timestamp skew (seconds-to-minutes), not the envelope's anti-max-out bound. The report prides itself on writing down the 600s derivation for the fence (§2.4) and then transplants the number somewhere its derivation doesn't apply.

**Fix exists inside the design:** yes — FS-8 already contains it. FS-8 rejects validity intervals as record metadata because "a fact's validity window is *content*." Scheduled-publication time is exactly a validity-window-shaped fact. **Minimal fix:** (i) define `claimedAt` strictly as performed-at, with the normative rule `claimedAt ≤ signing time` as author obligation; (ii) delete the "future claimedAt is legal testimony" bullet and route scheduled-for semantics to the payload per FS-8's own logic; (iii) keep the falsifier with a small skew tolerance (state it as block-timestamp skew, e.g. minutes, and derive it — or reuse 600s but *say* it is borrowed as a generous skew allowance, not inherited from the fence).

### A4. SERIOUS — "restore to Tuesday" pins Thursday's lens: the snapshot design never bitemporalizes the view-parameters

**Target:** §4.1–4.2, §4.4 case 2, §4.6 — the mandated lens-membership attack.

**Attack.** §4.1 correctly states the folder's rendered state is `F(admittedSets, L, D, E, t)` and concludes "a snapshot needs to pin exactly those inputs." But the basis, created Thursday for a Tuesday anchor, pins **Thursday's values of L, D, and E** with Tuesday's *data* anchors:

- **Lens membership.** If C was added to the viewer's lens Wednesday, the "Tuesday" basis includes C's Tuesday-era content — content the viewer *never saw* on Tuesday. If B was ejected Wednesday, Tuesday's actual view contained B; the basis omits B. "Restore MY VIEW to Tuesday" (tri-split case 2) then shows a Tuesday that never happened.
- **Deny set:** same shape — Thursday's advisory subscriptions filter "Tuesday's" render.
- **Evidence:** the basis pins the evidence hash *at creation* — so a duplicity proof learned Wednesday re-grades Tuesday's view EQUIVOCAL, though the viewer saw it LIVE on Tuesday. FM-H covers evidence drift *at replay*, not the creation-time capture being the wrong epoch for the question asked.
- **Clock:** the report never says which clock grades the at-anchor read. A claim with `expiresAt` = Wednesday was LIVE on Tuesday; graded with Friday's clock it renders STALE inside the "Tuesday" snapshot. F takes `t`; the basis stores a venue block; the replay rule for `t` is unstated.

The report does the hard conceptual work of naming as-written vs as-seen **for data** (§3.1) and then serves a snapshot that is as-written for records but silently now-valued for the lens, deny set, evidence, and (ambiguously) the clock. There are two legitimate questions — *retrospective* ("what would my current trust say about Tuesday's data" — Thursday parameters, arguably the safer default) and *as-experienced* ("what did I actually see Tuesday" — Tuesday parameters) — and the design answers the first while its language ("restore /projects to Tuesday," "your view, any Tuesday, reproducibly") promises the second.

**Fix exists inside the design:** yes — every part is already on the shelf. The report's own P9 synergy puts the viewer's lens/deny config on-chain as the viewer's *own claims*; those slots have their own supersession history; the same asOf machinery therefore reconstructs Tuesday's lens. **Minimal fix:** (i) name the two questions in §4.2 and make the basis declare which it answers (one enum word in the encoding); (ii) for as-experienced, anchor the viewer too — include the viewer's own anchor in the vector and resolve L/D *through it* (only available where lens config lives on EFS; state that limit honestly — client-config-only lenses get retrospective snapshots, full stop); (iii) rule the at-anchor grading clock (recommend: grade with the anchor's clock, i.e. `t = venue block time` for venue anchors and `min(now, selection-venue T)` for bridge-selected anchors, with current STALE status carried by the now-overlay like every other later-fact).

### A5. SERIOUS — BASIS-OPEN is not "drift," it is an author-rewritable past; and its portability claim is overstated (the lazy-author attack)

**Target:** §4.2 (EXACT vs OPEN, portability bullet), §3.1 (as-written retroactivity), §3.4 (ANCHORED gate rule), §9 residuals — the mandated checkpoint-gap attack.

**Attack, part 1 — backward forgeability.** The report describes order-anchored replay divergence as "as-written retroactivity" and "a late-arriving old-ordered record **retroactively improves** the answer," and grades BASIS-OPEN with an "improvable-answer caveat." That is the benign reading. The adversarial reading: `order` is **past-unbounded by design** (replication requires it — [[codex-envelope]] adopted core). So author B — or B's stolen key — can mint a *brand-new* claim on Friday carrying `order < o₃` (below the Tuesday anchor), submit it anywhere, and every future replay of the "Tuesday" basis now includes content that did not exist on Tuesday. This is not late *arrival* of old truth; it is late *manufacture* of fake past. An ORDER anchor pins a bound over a set the author can still grow downward forever. The report's own P13 discipline ("backdating is inherently unfalsifiable") applies word-for-word, yet §4 never connects it: a BASIS-OPEN snapshot serves backdatable content *as Tuesday's state* without the P13 caution. Consequence chain: §3.4 allows ANCHORED results to be consumed by "gates whose semantics are explicitly historical (audit gates)" — an audit gate consuming a BASIS-OPEN position is consuming author-forgeable history as historical fact.

Note the design *already carries the closing field and doesn't use it*: the basis stores `venue: (chainId, blockNumber)`. At that venue, conjoining `admittedAt ≤ block` with the order filter defeats Friday-minted backdates (they carry Friday admission). The report never states this conjunction; and off-venue it is unavailable, which must then be said.

**Attack, part 2 — overstated portability.** §4.2: "a basis is replayable on any venue holding the covered records — the snapshot survives its home chain." For BASIS-OPEN this is doubly wrong: (i) an ORDER anchor has no defined "covered records" — no set, only a bound (the report says this itself one bullet earlier); (ii) absence cannot be resolved: on any non-total venue, an order-anchored author position with an empty slot is **UNKNOWN**, and the anti-fallthrough rule (read-lens §2.1, RR-2) stops resolution — so a replayed BASIS-OPEN folder listing dies at the first key the checkpoint-less author never touched. Only BASIS-EXACT (checkpoint non-inclusion proofs) is genuinely portable. Since checkpointing is optional hygiene most authors will skip (the report's own §9 residual), the realistic launch-day basis is OPEN, and the headline promise — "your view, any Tuesday, reproducibly, with provenance" — mostly does not hold as stated.

**Severity:** SERIOUS for audit/GATE use and for the portability claim; the underlying EXACT/OPEN split is sound and absorbs the fix. **Fix exists inside the design:** yes. **Minimal fix:** (i) rename the OPEN caveat from "improvable" to *author-mutable-past* and cite P13; (ii) specify the venue-conjunction rule (at the basis's recorded venue, replay conjoins `admittedAt ≤ blockNumber`; elsewhere OPEN positions render with the forgeability label); (iii) restrict §3.4's historical-gate consumption to EXACT (checkpoint) or venue-conjoined anchors — never bare ORDER anchors; (iv) scope the portability bullet to BASIS-EXACT and state the UNKNOWN-stop behavior of OPEN replays on partial venues.

### A6. SERIOUS — the inverse-batch undo algorithm clobbers newer writes and resurrects superseded content

**Target:** §3.3 (NORMATIVE-CANDIDATE, SDK).

**Attack.** Two unguarded corner cases in the algorithm as written:

1. **Clobber.** `p = pre-B winner (order < O)`; the inverse asserts `p.body` **at fresh top order O′**. If any write landed on slot `s` after B — the author's other device (offline race; the exact case §2.4 blesses machinery for), or simply a later envelope C — the current winner is not B's record, and "undo B" force-reverts `s` past C's newer content. "Undo my last operation" silently destroys operations it was never asked to touch. The write-ahead inverse (`(slot, priorClaimId)` captured at compose time) makes this *worse*, not better: it bakes in the pre-B state and never re-checks.
2. **Resurrect.** `for each REVOKE v in B targeting claim c → emit ASSERT(c.body)`. If `v` was a *stale* revoke — c already superseded when revoked, a no-op per §1.3 ("a stale REVOKE naming a non-winner changes nothing") — the inverse turns a no-op into a state change: it asserts c's old body at top order, resurrecting superseded content over the current winner. Undoing nothing produces something.

Both are the git-revert conflict case, and git's answer (detect, stop, ask) is the right prior art the section itself invokes ("this is git-revert, not git-reset") without importing its conflict rule. For an SDK-normative pattern published in the lane whose FM catalog exists to prevent exactly this class of footgun, shipping it unguarded is a defect, not a nit.

**Fix exists inside the design:** yes. **Minimal fix:** a winner-guard on both loops — emit an inverse for slot `s` only if the current winner of `s` is the record B put there (for ASSERTs) / only if `v` was effective (emptied the slot) at undo time (for REVOKEs); otherwise flag the slot as conflicted and require explicit confirmation. Three lines of pseudocode and one FM entry (suggested: FM-K `undo-clobbers-the-concurrent-write`).

### A7. SERIOUS (lower bound MODERATE) — per-envelope `order` survives, but the multi-device case is under-confronted and the Datomic precedent overreaches

**Target:** §2.1, §2.4 — the mandated multi-device / offline-batch attack.

**Attack, part 1 — the precedent overreach.** §2.1's ground 1: "Datomic stamps one `t` per transaction" — true, but Datomic has a **single serializing transactor**; two transactions of one logical writer cannot be concurrent, so per-transaction `t` never inverts intra-writer intent. An EFS author with two unsynced devices is precisely the case the precedent cannot speak to. The conclusion (per-envelope) still stands on grounds 2–3, but the report's strongest-sounding argument is its weakest, and a reader who spots this discounts the ruling. Say the limit.

**Attack, part 2 — the unnamed inversion.** Phone (clock +2min skew) writes v1 to a slot offline at true 12:00 → order ≈ 12:02. Laptop writes v2 at true 12:01 → order 12:01. Both admit; **the later edit silently loses LWW**. No collision (different orders), no EQUIVOCAL, no label — FM-G covers only same-coordinate collisions; the ordinary cross-device *mis-ordering* is absent from the FM catalog entirely, and the per-author HLC floor only helps *after* a sync event. This is the classic LWW anomaly and it is inherent — but the lane's charter is that inherent limits get *named*, and the author's own SDK can detect it post-sync (it holds both devices' local histories, sees that a later-performed write is SUPERSEDED by an earlier-performed one, and can offer a re-assert).

**Attack, part 3 — the unexamined alternative for offline batches.** The report inherits "batching collapses many actions under one order" as a fact of nature and patches it with `claimedAt`. But envelopes are chain-free: an offline device can **sign one envelope per action at action time** (order = then; past-unbounded admission makes late submission legal) and submit the queue on reconnect. That preserves true per-action supersession order across devices at zero protocol cost — the batch-at-sync pattern is a *choice* trading temporal fidelity for atomicity and gas, not a constraint. §2.1's granularity ruling is materially strengthened by this observation (per-record `order` is even less needed than argued), and the SDK doctrine needs the ruling: which is the default offline pattern, and when is each appropriate? Relatedly, the mandated same-slot coalesce quietly contradicts §3.3's honesty line "nothing is ever lost": intermediate offline edits to one slot are *never signed* and are gone — the one place in the design where history is destroyed by mandate. One honest sentence required.

**Fix exists inside the design:** yes for all three. **Minimal fix:** scope the Datomic cite ("per-transaction, single-transactor — the concurrent-device case is argued by grounds 2–3, not by precedent"); add FM-K′ `cross-device-LWW-inversion` with the post-sync SDK detection as the blessed mitigation; add the sign-at-action-time-offline vs batch-at-sync tradeoff to §8.5's SDK queue with a default; add the coalesce-destroys-intermediates sentence to §3.3.

### A8. SURVIVABLE — the bitemporal refutation attacks the weak form of its own hypothetical; the conclusion survives via a repaired attack

**Target:** §2.2.

**Attack.** The refutation supposes "a portable, trustworthy, per-record transaction-time" and then has the replayed v1 "carry the later admission stamp" — i.e., it assumes per-venue re-stamping, which is the *non-portable* version, contradicting the hypothetical. Under the strong form (a global, verifiable *first*-admission time), replays are harmless: v1's earliest admission predates v2's, LWW-by-earliest-tx-time picks v2, and `order` would in fact evaporate — the kickoff's framing would win.

**Repair (the conclusion still holds).** The strong form dies to a different member of the same family: **withheld originals**. Author signs v1, never submits it, signs and submits v2; the leaked/withheld v1 later gets its *first* admission after v2 and wins under any carriage-derived key. Only an author-signed revision key defeats content whose carriage the author never performed. So §2.2's headline — the supersession key MUST be authorship-signed, hence MUST NOT be any transaction-time — is correct, but its printed proof is the weak-form attack and a careful reader can "refute the refutation" as written. (Also note the strong form is incoherent under the mission anyway — global first-admission consensus *is* the portable-currency impossibility — which is worth one line as the second, independent kill.)

**Minimal fix:** swap the worked attack for the withheld-original variant (or add it), and add the incoherence line. Same section, same length.

### A9. SURVIVABLE — beacon residuals: "fall back labeled" is incoherent for on-chain GATEs; the beacon never fixes the ladder's slot capture; digest-retention doesn't defang a thief

**Target:** §2.6 (beacon fix), FM-C, §9.

**Attack.** Three edges, none fatal because §9 partially owns them:

1. §2.6: "On-chain gates verify the beacon against a stored blockhash/beacon oracle where available, **else fall back labeled**." GATEs cannot label — §3.3's consolidated rule gives machine gates consume-or-fail semantics only. As written this sentence licenses an on-chain gate to consume the `tidTime` anchor "with a label" no contract can render. And the on-chain reality is harsher than §9 admits: EVM blockhash lookback is 256 blocks (EIP-2935: ~8191), so a weekly checkpoint's beacon is *never* natively verifiable by read time — on-chain freshness gating against a forward-dating author is oracle-dependent, full stop. Say it in one sentence and rule the GATE fallback (fail closed, or explicit policy constant accepting the named assumption).
2. The beacon repairs freshness *grading* but not the ladder's **slot capture** (FM-C's own second half): ladder entries with future orders still outrank honest checkpoints in the cardinality-1 PIN slot by up to the fence bound, continuously re-armed. Horizon policies "prefer beacon age *where present*" — present on the *winner*, which is the ladder entry. The report knows this (§9 residual) but the fix section's rhetoric ("defeats pre-signed ladders") oversells: it defeats the freshness half only.
3. SDK doctrine "retain digests so pre-revocation stays possible" defangs the author's own CI foolishness, not a **stolen key**: the thief mints fresh ladder entries whose digests the true author never had. Pre-KEL this collapses into the same-key war (read-lens §2.5) — a known global limit, but the doctrine paragraph should cite it rather than imply digest hygiene covers theft.

**Minimal fix:** three sentences, one per edge, in §2.6/§9; adjust "defeats pre-signed ladders" to "defeats the ladder's freshness half; the slot-capture half remains bounded-but-real (FM-C)."

### A10. SURVIVABLE — accumulated smaller defects

1. **`claimedAt` on checkpoint claims vs the REVOKE-exclusion rationale.** FS-2 rejects `claimedAt` on REVOKE partly because "pre-signed revoke ladders would carry misleading testimony" — but checkpoints are ordinary PIN claims (P7) and therefore *do* carry `claimedAt`, and pre-signed checkpoint ladders are the report's own FM-C. The rationale proves too much; the load-bearing REVOKE reason is format minimalism (Etched body = `bytes32 claimId`). Tighten the stated reason; optionally note that beacon-vs-claimedAt on checkpoints is another reason the beacon, not testimony, anchors freshness.
2. **The basis `venue` field's role is underspecified** — "the as-seen anchor + admission-order tiebreak context": admission order never enters §3 resolution (it orders discovery only). Either specify what the tiebreak context means operationally or cut the phrase. (Its *real* highest use is A5's conjunction rule.)
3. **Checkpoint-dependency on freeze-gates A1.** BASIS-EXACT, the §4.5 bridge, and the beacon all ride the checkpoint row, which is *pending James's A1 ratification* (read-lens P7). §6 never lists this dependency; a one-line note keeps the reservation set honest.
4. **FS-2 decided solo.** [[time-alternatives]] Q3 and the kickoff both say the `claimedAt` row-vs-convention call should be decided *with* the P2 candidates. The report rules it unilaterally. The ruling itself is well-argued and loudly flagged, so this is process, not substance — but §6 should state "to be co-adjudicated with the P2 batch" so the OS-pass designer doesn't inherit a fait accompli.
5. **verify-fix-2 deviation not called out as such.** FS-2's "always present" (vs verify's "optional trailing word") is a deliberate sharpening with a good reason (parsing ambiguity), but it should cite that it deviates from the verified spec text, since golden-vector generation reads these documents literally.

---

## 3. The fix-6 reversal, independently verified (attack attempted and failed)

Because reversing a verified fix is the report's boldest move, I attacked the reversal itself. Verify fix 6 said: route freshness through `admittedAt` "where the claim's home is reachable," `tidTime` as fallback. Rehabilitation attempt: on *home*, the author submits promptly, so home-`admittedAt` ≈ signing time and is neither backdatable nor forward-datable — a strictly better anchor than `tidTime`. **The rehabilitation fails on two grounds.** (i) Promptness is not a protocol property: anyone can carry a signed checkpoint to home late (carriage is permissionless even at home), and `admittedAt ≥ signing time` always — so `now − admittedAt` **understates** age under any submission delay, which is fail-open in exactly the direction freshness gating must not fail. (ii) If home is reachable for a live read, the checkpoint is moot (HOME-LIVE) — fix 6's own precondition dissolves its use case. The report's Correction 1 ("effectively nowhere") is right, FM-D is the correct generalization, and the beacon precedence (`beacon > tidTime-labeled > never replica-admittedAt`) is the sound replacement — subject to A9's edges. The report also correctly preserves `admittedAt`'s *opposite-direction* soundness (Q1 existed-by), which verify had conflated. This is the lane's best work; it survives.

Also verified sound against attack: the per-envelope granularity ruling's grounds 2–3 (the interleaving anomaly is real; per-record ordinals genuinely still need a testimony word); the FS-2 body shape (matches the `expiresAt` family and the frozen "expiresAt is the last word" sentence; scope exclusion of objects parallels `expiresAt`; REVOKE body stays Etched-minimal); the §3.1 venue-anchor revocation conjunction (both words filtered by one axis — correct, and the pre-revocation stamping rule composes with lazy effectiveness); the 53-bit/285-year and 600s-band arithmetic; and the §2.4 master-invariant gloss (the future fence reads `block.timestamp`, which is not *revocable state*, and its rejection is retryable-monotone — a documentation obligation, not a reshape; correctly handled as such).

---

## 4. Freeze-sensitivity audit (mandated): renames/reshapes of frozen-surface words

Checked every frozen-surface touch in the report against [[freeze-gates]] §C and the Codex docs:

| Touch | Flagged? | Verdict |
|---|---|---|
| `seq → order` (EIP-712 typeHash string) | FS-1, wire-breaking stated | CLEAN — matches verify fix 1 |
| `claimedAt` body word (every PIN/TAG ASSERT reshaped) | FS-2, ROW, vectors/S7/fuzz obligations inherited | CLEAN as a flag; substance attacked in A3/A10.4/A10.5 |
| `admittedAt[claimId]` storage + `getAdmission` ABI (ERC-7201 + frozen read ABI) | FS-3, ROW, priced-into-A2 | CLEAN as a flag; **fix-4 fence missing** (A1) |
| G-set value bool → `revokedAt` uint64 (Etched kernel storage encoding) | FS-4, ROW | flag CLEAN; **write-once missing** (A2) |
| checkpoint body beacon word (reserved-row vectors) | FS-5, freeze-adjacent | CLEAN; note the A1-ratification dependency (A10.3) |
| basis / pedigree / batch-undo / ANCHORED | FS-6/7/9/10 CONVENTION-or-Durable with explicit rulings; FS-8 explicit REJECT | CLEAN — the convention-not-row rulings are stated, not silent, as the pass rules require |
| master-invariant "one scoped clock-read" gloss | §2.4, named as a documentation obligation | CLEAN — gloss, not reshape |

**Result: no unflagged frozen-surface rename or reshape found.** The §6 discipline is genuinely good — the report's freeze hygiene is its strongest compliance surface. The two serious §6 defects are *omissions inside properly-flagged rows* (A1's fence, A2's write-once), not missing flags.

---

## 5. Consolidated fix list (all minimal, all inside the design)

1. **FS-3 + §8:** add the `admittedAt` comparator/supersession/cross-chain-ordering fence (mirror `prev`), worded to permit venue-labeled as-of filtering and Q1 evidence. (A1)
2. **FS-4:** `revokedAt` write-once per venue; extend FM-J to both words. (A2)
3. **§2.6/FS-2:** `claimedAt` = performed-at only, `≤ signing time`; delete the future-testimony bullet (route scheduled-for to payload per FS-8); derive or re-label the falsifier's skew tolerance. (A3)
4. **§4.2/§4.4:** basis declares retrospective vs as-experienced; as-experienced anchors the viewer's own lens/deny claims through the same machinery (P9 synergy), with the client-config limit stated; rule the at-anchor grading clock. (A4)
5. **§4.2/§3.4:** OPEN = author-mutable-past (cite P13); venue-conjunction rule at the recorded venue; historical-gate consumption requires EXACT or venue-conjoined anchors; portability claim scoped to EXACT with the UNKNOWN-stop behavior of OPEN stated. (A5)
6. **§3.3:** winner-guards on both inverse loops + conflict flag; new FM `undo-clobbers-the-concurrent-write`. (A6)
7. **§2.1/§2.4/§8.5:** scope the Datomic cite; name cross-device LWW inversion + post-sync SDK detection; rule sign-at-action-time vs batch-at-sync offline default; one sentence on coalesce destroying intermediates. (A7)
8. **§2.2:** swap in the withheld-original attack; add the strong-form-incoherence line. (A8)
9. **§2.6/§9:** GATE beacon fallback = fail-closed-or-explicit-policy (no "labeled" for contracts); "defeats ladders" scoped to the freshness half; theft carve-out on digest retention. (A9)
10. **§6/FS-2/FS-5:** tighten the REVOKE-exclusion rationale; specify or cut the basis `venue` tiebreak phrase; note the A1-ratification dependency; mark FS-2 for co-adjudication with the P2 batch and note the deviation from verify's "optional" wording. (A10)

## 6. What this red team did NOT find

No fatal. No broken frozen math. No convergence violation (every proposed word is venue-local or signed-body; slot state stays a pure function of the admitted set). No unflagged freeze surface. The three-field model, the per-envelope granularity, the fix-6 reversal, the beacon direction, the tri-split restore decomposition, and the EXACT/OPEN basis split all survive adversarial pressure. The report's defects cluster where it built *new* machinery fastest (the §4 snapshot suite, §3.3 undo, the falsifier correction) — consistent with its own §9 admission that the beacon and basis encodings "should get the same red-team treatment the time model got." They now have.
