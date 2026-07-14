# Lane report — Versioning, snapshots, history, undo + the time model under pressure

**Pass:** EFS v2 filesystem-features (Pass 1), lane: time/versioning
**Reads with:** [[fable-fs-kickoff]], [[verify-time-model]], [[time-alternatives]], [[state-brief]], [[codex-envelope]], [[codex-kinds]], [[codex-kernel]], [[read-lens-spec]], [[freeze-gates]] §A.8/§C, [[client-os-pressure-report]] P1/P13
**Status:** lane output — spec-grade where marked NORMATIVE-CANDIDATE; everything overturnable with cause except mission ends
**Date:** 2026-07-10

---

## 0. Verdict in one paragraph

The three-field time model **survives pressure with its shape intact and its story corrected**. Per-envelope `order` is the *right* granularity (Datomic precedent: one `t` per transaction; per-datom times don't exist there either), and `claimedAt` is **not a patch** — it is the valid-time axis that would exist even under per-record ordinals. The bitemporal reduction in the kickoff ("`order` is a portability patch that would evaporate if transaction-time could travel") is **refuted**: keying supersession on any transaction-time — even a magically portable one — reopens the replay-as-rollback attack the tombstone comparator was built to close, because carriage is permissionless. `order` is the *authorship-sovereignty revision key*, not a patch. Three genuine defects were found and fixed in this lane: (a) verify-time-model's `claimedAt` falsifier runs the wrong direction — backdating is inherently unfalsifiable (off-chain circulation is legal); only *forward*-inconsistency is provable; (b) its fix-6 freshness routing through replica `admittedAt` is **fail-open** (a late courier makes stale data look fresh) and must be reversed; (c) **pre-signed checkpoint ladders defeat the current freshness anchor entirely** — fixed with a recency-beacon word in the checkpoint body. P1 is adjudicated **ADOPT-stored** (with a free upgrade: encode the revocation G-set value as the revoke's admission time instead of a bool). Directory snapshot/restore is **not gone**: it re-homes as *basis vectors* (per-author checkpoint anchors under a pinned lens) + *manifests* (materialized citation trees), with restore split three honest ways. Freeze-sensitive shapes converge in §6.

---

## 1. Method and scope

This lane (1) specs the history/undo/as-of read vocabulary, (2) gives directory snapshot/restore a concrete design, (3) attacks the time model's shape (granularity, bitemporality, clock vocabulary, generation rigor, P1), and (4) converges the freeze-sensitive reserved shapes now, per the staging rule ([[fable-next-pass-scope]]: staging the design does not stage the reservations). Every classic-FS feature touched carries a stated disposition: **native / re-homed (how) / gone (why)** — consolidated in §5. Adversarial targets: the [refined-with-James] time-model shape, the verify-time-model fixes themselves (a verification can be wrong), and the kickoff's own bitemporal framing.

---

## 2. The time model under pressure

### 2.1 Per-envelope vs per-record `order` — KEEP per-envelope [adjudicated]

The suspicion ([[time-alternatives]] Q1): `claimedAt` was invented to recover the per-action granularity batching destroys — a smell that the granularity of `order` is wrong. **Refuted, on three grounds:**

1. **The transaction precedent.** Datomic — the most convergent prior design ([[fs-feature-space]] §10) — stamps one `t` per *transaction*; datoms share their tx's `t`, and per-fact time ("valid time") is modeled as ordinary data on the fact. That is exactly `order` (per signed envelope = per transaction) + `claimedAt` (per record = per fact). The batch *is* the atomic act ([[codex-kernel]]: single revert scope; the strongest atomicity in the design). One ordinal per act is not a compromise; it is what makes the envelope a transaction.
2. **Per-record `order` adds a real anomaly and buys nothing.** With per-record ordinals, one signature could carry orders {5, 9} while a second envelope carries {6, 8}: the author's write-history interleaves *across* atomic acts in supersession space. "Undo my last operation" loses its natural boundary (§3.3); the envelope stops being a serialization unit. And a per-record ordinal is still backdatable and still ordinal — it would *not* say when an action happened, so journals would still need an asserted-time word. You pay ~8 signed bytes per leaf forever and still need `claimedAt`.
3. **`claimedAt` is a different axis, not a patch.** git carries author-date and commit-date on every commit *and* orders by the DAG — three separated concerns in the most successful content-addressed system ever shipped. ATProto separates `rev` (TID, per commit) from `createdAt` (per record, asserted). Systems that separate authorship from carriage converge on this decomposition; EFS arriving at it via "batching loses per-action time" was the *discovery path*, not the *justification*.

**Two obligations fall out (NORMATIVE-CANDIDATE, SDK spec):**

- **The same-slot-same-envelope hazard.** Nothing forbids one batch containing two claims to the same slot; they share `order`, so the winner is max `recordDigest` — semantically arbitrary. The SDK MUST coalesce same-slot writes within a batch (last state per slot before signing). A conforming validator SHOULD warn on envelopes violating this. Intra-batch "sequence" is a fiction on-chain; do not let apps believe otherwise.
- **Leaf position is the only within-batch tiebreak for display** (already noted in [[verify-time-model]] §4): journals sort by `claimedAt`, tiebreak by leaf index, never by anything invented per-client.

### 2.2 The bitemporal reduction — REFUTED; `order` does not evaporate

The kickoff's sharpest framing: `claimedAt` = valid time, `admittedAt` = transaction time, and `order` = "a portability patch that exists only because transaction-time can't travel; if it could, would `order` evaporate?" **No — and the proof is an attack, not a taste call.**

Suppose the impossible: a portable, trustworthy, per-record transaction-time that any venue can verify. Key supersession on it (LWW by admission-time). Now:

> **Stale-envelope resurrection.** Alice signs v1, later signs v2. Both envelopes are, by design, replayable by anyone forever (replication IS re-submission — [[time-alternatives]] constraint 1). An adversary — any relayer, any archivist, anyone who ever saw v1 — submits v1 *after* v2 is admitted. Under transaction-time LWW, v1 carries the later admission stamp and **wins the slot**. Every superseded version of every record becomes a permanent resurrection weapon held by whoever has a copy. Under `order`-LWW, v1 has the lower signed ordinal and loses regardless of arrival, forever.

This is precisely the **arch-D replay-as-rollback fatal** that the tombstone comparator was verified to close ([[codex-kernel]] adopted core). Transaction-time is a fact about *carriage*; `order` is a fact about *authorship*, bound into the signature. In a system where carriage is permissionless and replay is legal, **the supersession key MUST be author-signed, hence MUST NOT be any transaction-time, portable or not.** Datomic can fuse revision-order with tx-time only because its transactor is the sole trusted write path; EFS has no transactor.

So the clean model is: **two temporal axes plus one non-temporal revision key** —

| axis | field | class | prior-art name |
|---|---|---|---|
| valid time | `claimedAt` | testimony (author-asserted, untrusted) | Datomic valid-time; git author-date |
| transaction time | `admittedAt` | measurement (venue-stamped, trustworthy, non-portable) | Datomic tx-time; git committer-date (loosely) |
| revision key | `order` | authorship-sovereign ordinal (signed, portable, not a time) | Datomic `t`* / ATProto `rev` / git DAG position |

\* with the stated caveat that Datomic's `t` is also its tx-time; EFS must keep them separate for the reason above. **Adopt the bitemporal vocabulary for documentation** (it tells every database-literate developer what each field is for), and state the refutation alongside it so nobody "simplifies" the model post-freeze. The no-cross-chain-currency ruling and the existence of `order` are *related but not identical* facts: even with portable currency, `order` survives.

### 2.3 What may be called a clock — vocabulary ruling [NORMATIVE-CANDIDATE, string catalog]

- **`admittedAt`** — the only thing ever called a clock, always with its qualifier: "**the venue's clock**." Never "the clock."
- **`order`** — "revision key" / "supersession rank" (per [[verify-time-model]] §1's residual caveat). After `claimedAt` exists, `tidTime(order)` MUST NOT be rendered as a time in any UI string; its one legitimate time-flavored read is the freshness fallback (§2.6), always labeled.
- **`claimedAt`** — "asserted time" / "testimony." The name is kept (over `authoredAt`) precisely because "claimed" screams untrustedness — the P13 footgun is mis-trust, and the name is the first line of defense.
- **`expiresAt`** — "currency fuse," never "TTL" (TTL implies deletion; expiry is stale-not-dead).

One-liner for the docs, extending James's: *"EFS has one clock per venue (`admittedAt`), one testimony per action (`claimedAt`), and one revision key per signature (`order`). Nothing else is a time, and no time is global."*

### 2.4 Generation rigor — the 600s / 10-bit numbers, and a correction to the HLC framing

**Correction: `order` generation is Snowflake/TID-family, not HLC-family.** HLC's defining feature is the receive rule (`max(physical, received)+logical`) riding a message channel; EFS writers have no channel at write time ([[time-alternatives]] constraint 2), and the TID has no logical component — it is physical-µs + node bits, i.e., a Snowflake/TSID/ATProto-TID construction. The distinction matters because it tells you exactly where HLC *does* apply:

- **The one causal channel an author has is their own devices syncing.** Bless a per-author HLC receive rule in the SDK (P10 answer): on sync, a device sets `localFloor = max(deviceClock, tidTime(ownHead observed anywhere) + 1µs)` and mints above it. Costs nothing, requires no protocol change, and restores per-author monotonicity after sync — the property ATProto's `rev` spec demands per repo. Only true offline-simultaneity can then collide.
- **10 device bits:** allocation = 10 random bits per device install (SDK convention, vectored), plus the HLC floor above. Collision requires same author, same microsecond, same random bits — and its blast radius is *bounded and self-healing*: admit-both + `SeqCollision` stains only that `(author, order)` coordinate ([[read-lens-spec]] §3.1 `disposition()` checks the winner's coordinate only); the author's next write at a fresh order is clean LIVE. The failure is a recoverable labeled state, not corruption. 10 bits is enough *given* the backstop; without admit-both it would not be. Say both halves.
- **The 600s future fence sits in the deployed band** — Kerberos max skew 5min, Farcaster future-clamp 10min, common Nostr relay policy ~15min. Both failure modes are bounded: too-small ⇒ honest skewed devices get *retryable* rejection (self-heals as time advances); too-large ⇒ a future-dated write (own mistake or thief) holds the win position until wall-clock catches up, ≤ cap. Keep 600s; write this derivation down so the number stops looking hand-picked.
- **53-bit microseconds** covers ≈285 years from epoch (through ≈year 2255) — clears the 100-year horizon with margin. State it.
- **Precision on "clock-free admission":** admission is clock-free for *semantics* (expiry never checked at admission) but reads `block.timestamp` for exactly one check — the future fence. This is legal under the master invariant because the rejection is **retryable and time-monotone** (the acceptable set only grows as real time advances; nothing is permanently rejected that another kernel could accept). Two venues may momentarily disagree; both converge. Document this as the invariant's one scoped clock-read so nobody "discovers" it as a contradiction later.
- **The cap's honest limit (feeds §2.6):** the fence bounds `tidTime` relative to *admission*, not to *signing*. Sign-and-hold defeats any freshness inference from `tidTime` (an author can mint a future `tidTime`, hold the envelope, and submit when the clock catches up). This is not fixable at the fence and must be handled at the read layer (§2.6).

### 2.5 P1 adjudicated: `admittedAt` — ADOPT, stored, with a free upgrade

**Ruling this lane recommends: P1 path (a).** Store `admittedAt[claimId] = uint64 block.timestamp` in kernel state, `eth_getProof`-provable, exposed in the read ABI; plus the batched admission read. Every temporal feature in this lane needs it or is strengthened by it: venue as-of selection (§3.1), the basis-selection bridge (§4.5), the `claimedAt` falsifier (§2.6), the P13 predate defense, birthtime/ctime (§5), and the freshness reconciliation (§2.6). Without it the trustworthy axis exists only via archival nodes (an infra assumption a 100-year archive must not make) or logs (fails Helios + EIP-4444 — P1's own argument). It is store-it-or-lose-it: views cannot mint state the kernel didn't store.

Specifics (NORMATIVE-CANDIDATE, freeze-bound — see §6):

1. **Write-once per venue.** `admittedAt` is set at *first* admission of a claimId at this venue; re-submission/subset re-admission (a no-op today) MUST NOT update it — otherwise replaying an old envelope refreshes its apparent age (a small but real attack).
2. **The revocation G-set gets it for free.** Encode the G-set value as the revoke's admission time: `revokedAt[(revoker, claimId)] = uint64 block.timestamp` instead of a bool. A word is a word — **zero marginal storage** — and it is what makes venue as-of reads able to answer "was this revoked as of T" (§3.1). Pre-revocation pairs stamp when the REVOKE admitted, not when the pair completes (effectiveness stays lazy; the as-of read conjoins both words).
3. **ABI shape:** one batched read serves P1 items 2+3 together: `getAdmission(claimId[]) → (admitted bool, admittedAt uint64)[]`; `getClaim`/`getSlot` MAY also surface the word. ERC-7201 layout addition; frozen.
4. **Cost honesty:** if the per-claim metadata slot has ≥64 spare bits next to `expiresAt` (both uint64 — 128 bits spare in a shared word), the marginal cost is near zero; if it needs its own slot, it is another ~22k cold SSTORE per record, i.e., comparable to the spine itself. Measure in the A2 gas snapshot before citing numbers ([[freeze-gates]] B); this lane's recommendation stands at either price, but the price must be *known*.
5. **The cross-chain trail** (James's proposal in P1) falls out automatically: every venue stamps its own word; "earliest known admission" is a client-side min over venues consulted. No extra surface.

### 2.6 Temporal soundness — the three questions, their sound anchors, and two corrections to verify-time-model

There are exactly three temporal questions, and each has exactly one sound anchor. Conflating them is where every prior fix went subtly wrong.

**Q1 — "existed by" (the backdate defense; P13 fake predictions).**
Sound anchor: **earliest known `admittedAt`** across venues. Admission proves existence-by; nothing can prove existence *before* its earliest admission. A "prediction" with no old admission anywhere is unproven, full stop. This is the sharpest argument for P1 and it survives.

**Q2 — "signed no earlier than" (freshness; the pre-signing defense).** This is where two corrections land:

- **Correction 1 — verify-time-model fix 6 is fail-open and must be reversed.** Fix 6 said: route freshness through `admittedAt` where home is reachable. But on any venue that is not where the author promptly submits, `admittedAt` = when the *courier* arrived. A late courier makes a 40-day-old checkpoint show `age ≈ 0` — the gate passes on stale absence-of-revocation. Replica `admittedAt` systematically *understates* age. **Rule: `admittedAt` MUST NOT be a freshness anchor anywhere except the venue of prompt first submission — and since promptness is unprovable, effectively nowhere.** (Its sound role is Q1, the opposite direction.)
- **The pre-signed ladder attack (new, this lane).** The current anchor `age = now − tidTime(checkpoint.order)` ([[read-lens-spec]] §5.2/§9.C) is defeated by sign-and-hold: an author (or their compromised key, or their over-clever CI) pre-signs a year of weekly checkpoints with future `tidTime`s; a relayer submits each as wall-clock catches up (the 600s fence permits it at that moment). Each shows age ≈ 0. If the author meanwhile revoked something, the pre-signed state roots omit it — replicas holding the ladder serve non-inclusion "proofs" of not-revoked against genuinely revoked claims, with a *fresh-looking* bound. Worse, the ladder's future orders **outrank the author's own honest fresh checkpoints** in the PIN slot until wall-clock passes them (the author can mint at most now+600s), and unsubmitted ladder entries can only be defanged by pre-revocation *by claimId* — which requires having retained the digests. §5.2's "backdatable only against the author's own freshness grade (fail-safe)" is therefore only half the story: it is fail-safe against *back*dating and **fail-open against forward-date-and-hold**.
- **The fix — a recency beacon (NORMATIVE-CANDIDATE).** A signature cannot prove recency by itself; signing over an unpredictable recent value can. Add an optional word to the checkpoint body encoding: `beacon = (chainRef, blockNumber, blockHash)` of any long-lived chain (default: Ethereum L1). A checkpoint committing to block B provably post-dates B: `age ≥ 0` is now sound as `now − time(B)`, immune to ladders. Freshness anchor precedence becomes: **beacon (sound) > `tidTime(order)` (labeled assumption: "author does not forward-date-and-hold") > never replica-`admittedAt`**. SDK checkpoint-writers SHOULD include the beacon by default; horizon policies (§5.3/§9.C) SHOULD prefer beacon age where present. On-chain gates verify the beacon against a stored blockhash/beacon oracle where available, else fall back labeled. This lands in the checkpoint body *format*, which is freeze-adjacent (reserved-row vectors) — flagged in §6.
- **SDK doctrine (companion):** never mint future `tidTime` (mint at `now`, cap is a fence not a target); retain signed-envelope digests (or derive deterministically) so pre-revocation of leaked/unsubmitted envelopes stays possible — this also answers P5.4's leaked-bundle question: **a future-dated unsubmitted envelope cannot be defanged by supersession until wall-clock catches up; revocation-by-claimId is the only defense, and it requires the digest.**

**Q3 — "when does the author say it happened" (display).** Anchor: `claimedAt`. Testimony, never proof, never a comparator input.

- **Correction 2 — the `claimedAt` falsifier direction ([[verify-time-model]] §2.3 is half-wrong).** It says a `claimedAt` preceding the `admittedAt` of a causally-prior record is "a detectable backdate." Not as *proof*: envelopes circulate off-chain legally before admission (they are chain-free by design), so the cited record may have genuinely existed long before its admission, and the citing author may genuinely have seen it then. That check is a *heuristic* (render a caution), not a falsifier. The **sound falsifier runs the other way**: `claimedAt > earliestKnownAdmittedAt(sameRecord) + 600s` is **proven false testimony** — the record demonstrably existed (was admitted) before the author claims to have authored it. Backdated `claimedAt` is inherently unfalsifiable; the defense is the P13 rule (never order/gate on it) plus citation edges, exactly as already ruled. P13's text should name `claimedAt`, state the sound falsifier (forward direction), and demote the backward check to a labeled heuristic.
- **Future `claimedAt` is legal testimony** ("scheduled for publication") — no cap; it is in no comparator; render as asserted-future.
- **Cross-author / cross-chain causal order** remains unestablishable by any field — citation edges only ([[verify-time-model]] §2.3, confirmed).

---

## 3. The read vocabulary for history (Datomic `asOf` / `since` / `history`, honestly scoped)

All of §3 is **Durable** ([[read-lens-spec]] revision + SDK), zero kernel surface beyond §2.5. Grade words stay within the closed set; one new *flag* is recommended (§3.4).

### 3.1 The three verbs

**`history(author, key, venue) → [claim…]`** — the slot's full version chain, ordered by `(order, recordDigest)`, each entry graded (LIVE / SUPERSEDED / REVOKED / STALE) with its provenance tuple `(order, claimedAt?, admittedAt@venue, expiresAt, supersessionCount)`. Mechanics: `getSlot` gives O(1) last-step (`supersessionCount + priorClaimId`); the full chain is a spine walk or indexer job ([[codex-kernel]]: per-slot history arrays are deliberately NOT kept). State the cost shape plainly: **last version O(1), full history O(spine-filter)** — a view-contract/indexer lane, consistent with no-query-language.

**`asOf(author, key, anchor) → slot-state@anchor`** — anchor is one of:

| anchor | semantics | trust class | portable? |
|---|---|---|---|
| `order o` | claims by A with `order ≤ o`; revokes by A whose REVOKE-record `order ≤ o`; then the §1.3 primitive | author-asserted coordinates | **yes** (replayable anywhere the records replicated) |
| `checkpoint N` | as `order ≤ N.throughOrder`, with inclusion/non-inclusion provable against N's state root | author-signed, **set-pinning** (commits the exact claim set, not just a bound) | yes |
| `venue block B / time T` | historical state proof at B (archival), or filter by `admittedAt ≤ T` **and** `revokedAt ≤ T` (§2.5.2 — this is why the G-set word matters) | venue-stamped, trustworthy | **no** (venue-labeled) |

The revocation subtlety is load-bearing and easy to get wrong: an as-of read applies **empty-on-revoke at the anchor** — winner-at-anchor revoked-by-anchor ⇒ EMPTY; revoked-*after*-anchor ⇒ PRESENT at the anchor (with the now-overlay, below). Both claims and revokes filter by the same anchor axis, never mixed axes.

**`as-written vs as-seen (name it or apps will confuse them).`** `asOf(order)` is a pure function of the *current* admitted set filtered by order — so a late-arriving old-ordered record **retroactively improves** the answer (Datomic's asOf never moves; EFS's order-anchored asOf can). `asOf(venue T)` is what this venue would have answered on Tuesday — it never moves. These are the bitemporal literature's valid-time-slice vs transaction-time-slice, and EFS genuinely has both:
- **as-written** (`order`/checkpoint anchors): portable, replayable, retroactively completable. Checkpoint anchors close the completability gap by pinning the *set* (state root), not just the bound — this is why the high-grade snapshot anchor is a checkpoint, not an order (§4.2).
- **as-seen** (venue anchors): frozen forever, venue-labeled, dies with the venue's archival access unless `admittedAt`/`revokedAt` words exist (they survive in current state — another P1 dividend).

**`since(anchor, venue) → delta stream`** — venue-global: the spine cursor (`allClaims(i)` from a checkpointed index — admission-ordered, the venue's reflog); per-author: `authorHead(author)` polling + order-range filter. This is the blessed poll/watch substrate (the inotify lane owns the pattern; this lane owns the primitive naming: **the spine is `since`**).

**Now-overlay rule (NORMATIVE-CANDIDATE).** Every anchored read dual-grades: the state *at the anchor* plus the served claim's *current* disposition (`later-REVOKED`, `later-SUPERSEDED`, `still-LIVE`). Rationale: an as-of-Tuesday view legitimately shows content the author has since revoked (that is what Tuesday looked like); rendering it without the overlay invites acting on withdrawn content. Datomic's asOf UIs converge on the same convention.

### 3.2 Undo — two verbs, one footgun

- **`revert(slot → prior)` = re-assert the prior claim's body at a fresh `order`.** This is undo. The reflog move. Chainable (redo = revert again; no state is ever lost). Note honestly: the restored version is a **new claim with a new claimId** — citations to the old version still resolve to the old (SUPERSEDED) claim; that is correct behavior, not a bug.
- **`retract(claim)` = REVOKE.** This is delete (slot reads EMPTY). **It is not undo.**
- **FM-B, the sharpest footgun in this lane:** *revoking your current version does not restore your prior — it empties your slot, and on a home venue EMPTY = PROVEN-ABSENT = the reader's lens falls through to the **next author**.* "I undid my edit" can mean "I handed the position to Bob" if the UI wires undo to REVOKE. Empty-on-revoke ([[read-lens-spec]] P2) makes this unambiguous at the protocol layer; the SDK MUST wire undo to `revert`, never `retract`, and the apps cookbook MUST carry this warning.
- **Un-revoke** = re-assert (a new claim). The old claimId stays REVOKED forever (G-set is monotone). Trash-restore UIs re-assert the revoked claim's body; the disposition history remains honest.

### 3.3 Batch undo — the inverse-batch algorithm [NORMATIVE-CANDIDATE, SDK]

"Undo my last operation" where the operation was one envelope `B` at order `O` with N records:

```
for each ASSERT r in B on slot s:
    p = pre-B winner of s        // winner over {author's claims on s with order < O}
    if p exists      → emit ASSERT(p.body) at fresh order O′   // revert
    else             → emit REVOKE(claimId(r))                  // r created the slot; retract
for each REVOKE v in B targeting claim c:
    → emit ASSERT(c.body) at fresh order O′                     // un-revoke by succession
objects (TAGDEF/DATA/LIST) minted in B: NO inverse — permanent by design.
all emitted records → ONE envelope → atomic undo.
```

- **Write-ahead inverse (blessed pattern):** computing `p` later needs a history walk; the SDK SHOULD capture `(slot, priorClaimId | EMPTY)` per record at compose time, making the inverse O(1). (Local state, or embedded in the app's own value payload — convention, never a reserved word.)
- **Honesty line:** undo restores *claim state*; it never un-mints identity (objects are permanent) and never un-happens history (the undone batch remains in the spine, disposition SUPERSEDED/REVOKED). This is git-revert, not git-reset — and that is the correct semantics for an archive.

### 3.4 Grades and flags for temporal reads

No new grade words needed (the closed set holds): anchored positions render with the existing AS-OF currency machinery per position. **One flag recommended** (Durable vocabulary revision, alongside the P3 batch): **`ANCHORED`** — set on every result of an explicit `asOf`/basis read. Rules: an ANCHORED result never satisfies HOME-LIVE; never GATE-consumable *as current*; consumable by gates whose semantics are explicitly historical ("was X true at T" — audit gates), which must declare so. This closes FM-I (basis replay consumed as currency) with one word.

---

## 4. Directory snapshot / restore — the hard case, given a concrete design

### 4.1 What a folder's state IS

Under lens `L`, deny set `D`, at venue `V` with evidence set `E` (known duplicity proofs) and clock `t`, the folder's rendered state is a **pure function** `F(admittedSets(V), L, D, E, t)` — slot state is a pure function of the admitted set ([[read-lens-spec]] §1.3), resolution is deterministic (§3.1 property 1), and grading consumes `E` and `t`. Therefore a snapshot needs to pin exactly those inputs, and nothing else. This is Datomic's "the database is a value," generalized: **EFS's database-value is per-author, so the basis is a vector, not a scalar.**

### 4.2 Species 1 — the **basis** (coordinate snapshot) [NORMATIVE-CANDIDATE encoding, Durable]

A basis is a small signed record pinning the inputs of `F`:

```
basis/v1 {
  root:      tagId                      // subtree root
  lens:      [authorWord …]             // ordered
  deny:      [authorWord …]
  anchors:   [(author, kind, value) …]  // for every author in lens ∪ deny
             // kind ∈ { CHECKPOINT(claimId)   — set-pinning, EXACT
             //          ORDER(o)              — bound-pinning, OPEN
             //          HEAD(o)@venue         — observed head, OPEN }
  venue:     (chainId, blockNumber)     // the as-seen anchor + admission-order tiebreak context
  evidence:  keccak(sorted duplicity-proof ids) | 0
  spec:      resolution-spec version
}
```

Published as a VAL PIN under the snapshotter's own namespace (e.g. `/…/snapshots/tuesday`), body ≤ 8192 bytes (≈100+ authors fits; larger lenses put the body in a DATA and PIN it — the mirrors pattern). **Convention, not a reserved row** — see §6.

- **EXACT vs OPEN, and why checkpoints beat orders.** An `ORDER(o)` anchor is only a *bound*: replaying on a venue holding more (or fewer) of that author's old records reconstructs differently — as-written retroactivity (§3.1). A `CHECKPOINT` anchor pins the **exact set** via the state root: inclusion/non-inclusion are provable, and replay is byte-deterministic on any venue that can fetch the covered records. So: basis grade = **BASIS-EXACT** iff every anchor is a checkpoint; else **BASIS-OPEN**, rendered with the improvable-answer caveat. The kickoff's guess — "per-lens snapshot = the vector of per-author checkpoints" — is **confirmed**, with the sharpened reason: checkpoints pin sets, orders pin only bounds.
- **Deny authors are anchored too** (advisories are claims; an unanchored deny set makes the replayed *filtering* drift), and the **evidence pin** keeps grading reproducible (a duplicity proof learned later would otherwise flip a replayed EQUIVOCAL). If omitted, replay is legal but labeled grade-divergent (FM-H).
- **Portability:** a basis is replayable on any venue holding the covered records — the snapshot survives its home chain. This is a genuinely stronger property than ZFS ever had, and it costs O(k authors), not O(subtree).

### 4.3 Species 2 — the **manifest** (materialized snapshot)

Resolve the subtree *now* under your lens; publish the result as your own authored tree: a DATA (or LIST) enumerating `(path → claimId)` citation pins for every resolved winner. This is the lockfile pattern ([[read-lens-spec]] §9.B step 6), the git tag, the vendored release. O(subtree) cost; self-contained (claim bodies are state-resident and content-addressed); trust = the snapshotter's signature. Use a manifest when you need the snapshot to be *consumable as an artifact* (app releases, P7's resolve-closure-at-pinned-root is exactly a manifest); use a basis when you need it cheap and lens-faithful. They compose: a manifest MAY embed the basis it was materialized from (audit trail).

### 4.4 Restore — the tri-split (what "restore /projects to Tuesday" MEANS)

1. **Restore MY contributions** (author = restorer) — **NATIVE, the only restore that is a write.** For each of my slots under the subtree: compute `asOf(anchor)`; if it differs from current, re-assert the anchored body at fresh order; if anchored state was EMPTY and current is not, REVOKE. All in **one envelope — atomic subtree restore**, needing nobody's permission. (Restore-by-revoke is forbidden — FM-B; restore always re-asserts.)
2. **Restore MY VIEW** — **RE-HOMED onto the lens.** I cannot rewrite Bob's slots and must not want to. Applying the basis as a read filter *is* the restore: a **time-scoped lens** (pin this subtree to basis `X`). Durable, instant, reversible, per-viewer — and honest: results carry ANCHORED + per-position AS-OF + the now-overlay; a time-scoped view is never consumable as current. Synergy: basis records under the user's address are exactly the P9 "lens/trust config must survive device loss" vehicle for view state.
3. **Restore the CANONICAL view** (the team folder others see) — **RE-HOMED onto curation.** Whoever curates the canonical lens either (a) re-asserts their own placements (case 1 at the curator's slots — the git-maintainer move), or (b) publishes the basis-pinned lens (lenses are LISTs; a published lens entry MAY carry a basis annotation) so subscribers' views roll back together. Deliberate, visible, authored — as a shared restore should be.

**Declared GONE, with the honest substitutes:**
- **Cross-author restore-as-write** ("make Bob's slot show Tuesday's value"): gone — it is a write-gate over Bob, contradicting permissionless writes. Substitute: 2 and 3 above.
- **Global "everything as of Tuesday":** gone — no portable global `t` (the mission fence). Substitute: as-seen at a single named venue (`admittedAt ≤ T@V`), venue-labeled; or a basis, which is per-author-anchored by construction. Apps MUST NOT promise Time Machine; they can promise something better-scoped: *your* view, any Tuesday, reproducibly, with provenance.
- **O(1) whole-subtree COW snapshot (ZFS/btrfs):** gone — no shared mutable root to copy-on-write. Substitute: basis (O(authors)) or manifest (O(subtree)). Note the inversion: EFS pays at *snapshot-read* time what ZFS pays at *write* time — the archive already retains everything, so a "snapshot" is only ever a set of coordinates.

### 4.5 Choosing "Tuesday" — the bridge between the axes [the keystone rule]

"Tuesday" is a wall-clock concept; the only trustworthy wall-clock is per-venue. The construction:

> **Transaction-time selects; order replays.** At a venue you trust (normally home), select each author's basis anchor by `admittedAt ≤ Tuesday` (trustworthy selection — claims *and* revokes, via the G-set word). Record the anchors as checkpoints/orders (portable coordinates). The basis then replays on any venue, forever, without ever trusting a foreign clock.

This is the practical resolution of the whole per-chain-clock tension for the versioning cluster: the untrusted-but-portable axis and the trusted-but-local axis each do the one job they are sound for, at different phases.

### 4.6 Worked example

`/projects` under viewer lens `[A, B, C]`, home venue Base. Tuesday 18:00 UTC = block 21,504,300.
- A placed `plan.md` v2 Monday (order o₁), v3 Thursday (o₂); checkpoint N_A Tuesday 17:50.
- B placed `budget.xlsx` v1 Monday (o₃), REVOKED it Wednesday (revoke order o₄). No checkpoints.
- C placed `logo.png` Friday last week (o₅); checkpoint N_C Tuesday.

**Snapshot (Tuesday, taken Thursday):** at Base, select by `admittedAt ≤ T(block 21,504,300)`: A → CHECKPOINT(N_A); B → ORDER(o₃) (no checkpoint ⇒ OPEN); C → CHECKPOINT(N_C). Basis = `{root: /projects, lens [A,B,C], anchors as above, venue (Base, 21504300), evidence: 0}` → grade **BASIS-OPEN** (B's anchor is order-grade). Published as `/…/snapshots/tuesday`.

**Read the snapshot (Friday):** `plan.md` → A asOf N_A = **v2**, ANCHORED, AS-OF(N_A), now-overlay `later-SUPERSEDED (v3 current)`. `budget.xlsx` → B asOf o₃: the Wednesday revoke has order o₄ > o₃ ⇒ filtered out ⇒ **v1 PRESENT at the anchor**, now-overlay `later-REVOKED` — Tuesday's truth, honestly overlaid. `logo.png` → v… unchanged, `still-LIVE`.

**Restores:** A runs case-1: one envelope re-asserting v2's body at fresh order (plan.md current becomes v2′; v3 remains reachable, SUPERSEDED). B's file for *B*: case-1 re-asserts v1 (un-revoke by succession). The viewer alone: case-2 time-scoped lens — sees Tuesday, changes nothing on-chain. Nobody could "restore" C's slot but C — and nobody needed to.

---

## 5. Classic-FS dispositions (rule 3 — every feature touched, stated)

| Classic feature | Disposition | How / why |
|---|---|---|
| Version history per file | **NATIVE** | supersession chain; O(1) last step, spine/indexer for full chain (§3.1) |
| Undo / redo | **NATIVE** | revert = re-assert prior at fresh order; nothing ever lost; FM-B guard (§3.2) |
| Undo a multi-file operation | **NATIVE (pattern)** | inverse-batch in one envelope (§3.3); objects excluded (permanent) |
| Trash / restore-from-trash | **NATIVE** | REVOKE / re-assert; trash = a view over revoked placements; un-revoke mints a successor claim |
| Snapshot a directory | **RE-HOMED** | basis (coordinates, O(authors)) or manifest (materialized, O(subtree)) (§4.2–4.3) |
| Restore directory to time T | **RE-HOMED (tri-split)** | my-writes (atomic envelope) / my-view (time-scoped lens) / canonical (curation) (§4.4) |
| O(1) COW subtree snapshot | **GONE** | no shared mutable root; the archive already retains everything — snapshots are coordinates |
| Global time-travel ("everything at T") | **GONE** | no portable global t (mission fence); substitute: as-seen at a named venue, or a basis |
| Restore other authors' content | **GONE** | write-gate over others; substitute: view-scoping + curation |
| mtime | **RE-HOMED** | `claimedAt` (testimony, labeled) for author-time; `admittedAt` (venue-labeled) for venue-time; never one trusted global mtime |
| ctime / birthtime | **RE-HOMED** | earliest known `admittedAt` = proven existed-by (P1); venue-labeled |
| atime | **GONE** | reads leave no trace — a privacy feature; state it proudly |
| fs journal / crash recovery | **NATIVE** | the chain is the journal; the spine is the venue reflog; `since` = spine cursor (§3.1) |
| git-grade tamper-evident version DAG | **RE-HOMED (convention)** | pedigree convention: version records cite prior claimId in payload / relatedVersion edge; kernel never reads it (`prev` stays hard-fenced — confluence); enables fork/concurrency detection at read time |
| Datomic asOf / since / history | **NATIVE (scoped)** | per-author + per-venue anchors; as-written vs as-seen named; basis = vector-valued asOf (§3–4) |

---

## 6. FREEZE-SENSITIVE RESERVATIONS — LOUD SECTION

Everything in this section touches the one-final-freeze pledge ([[freeze-gates]] §C) or reserved-row vectors. Each item: **ROW / CONVENTION / REJECT** with the reason. These shapes must converge before the ceremony even where semantics keep iterating.

**FS-1. `seq` → `order` rename — ROW-EQUIVALENT (envelope wire), ADOPT.** The name is inside the EIP-712 typeHash string: mechanism-inert, **wire-format-breaking** — new envelope digest, all 42 golden vectors regenerate, wallet label changes ([[verify-time-model]] §1, confirmed). Must land before the envelope locks. Docs gloss: "revision key / supersession rank," never "chronological order."

**FS-2. `claimedAt` — MINT THE ROW (body word), exact shape:**
- **uint64, UNIX seconds, always present, `0 = absent`** — the `expiresAt` family exactly. Seconds, not microseconds: it is testimony for humans, not an ordering key (leaf index breaks intra-batch ties); matching `expiresAt`'s unit keeps one trailing-words parser and prevents unit bugs. (µs considered and rejected; apps needing finer testimony put it in their payload.)
- **Position: second-to-last trailing word of every ASSERT claim body — `…, claimedAt, expiresAt`** — preserving the frozen sentence "expiresAt is the last word of every claim body." Always-present kills optional-word parsing ambiguity.
- **Scope: PIN/TAG ASSERT bodies only.** Objects never carry it (identity is timeless — parallel to expiresAt). **REVOKE bodies: REJECT** — REVOKE stays exactly `bytes32 claimId` (minimalism is load-bearing; pre-signed revoke ladders would carry misleading testimony anyway; retraction timelines use `admittedAt`). Explicit rejected-row, not silence.
- **Inherited obligations:** pin the canonical trailing-word order + vectors; extend the S7 canonical-word check; widen the VAL-tail differential fuzz (the kinds ruling's #1 engineering risk grows by one word — priced, accepted).
- **Why row, not convention:** timelines/journals interoperate only if the word is uniform; the P13 honesty rule needs one named field to police; the canonicality machinery is already built for `expiresAt`; kernel-inert (in no comparator — verified). Cost: +8 bytes/claim forever — accepted.

**FS-3. `admittedAt[claimId]` stored word + `getAdmission(claimId[])` — ROW (read ABI + ERC-7201 storage), ADOPT (P1 path (a)).** Write-once per venue (re-admission MUST NOT refresh it — replay-refresh attack). Pack next to `expiresAt` if the layout allows (both uint64); price into the A2 gas bundle either way. Views cannot recover it later: store-it-or-lose-it.

**FS-4. Revocation G-set value = `revokedAt` uint64 (admission time of the REVOKE) instead of bool — ROW (storage encoding), ADOPT with FS-3.** Zero marginal storage (a word is a word); buys venue as-of revocation reads (§3.1) and revocation timelines. Pre-revocation pairs stamp REVOKE admission; effectiveness stays lazy.

**FS-5. Checkpoint body encoding: optional `beacon` word (chainRef, blockNumber, blockHash) — FREEZE-ADJACENT (reserved-row vectors), ADOPT before checkpoint vectors freeze.** The only sound freshness anchor (§2.6); defeats pre-signed ladders. Optional in the body; SDK writes it by default.

**FS-6. Snapshot/basis records — CONVENTION, not row.** User-key TAGDEF (e.g. `efs.fs/snapshot`) + a canonical Durable encoding (§4.2) in read-lens-spec/SDK so clients interoperate. No lens-legibility need crosses apps the way `mirrors` does; bodies are app-shaped and still iterating. Explicit ruling: convention.

**FS-7. Pedigree / `basedOn` version-parent — CONVENTION, not row; kernel DAG REJECT.** Prior-claimId citations ride the payload or `relatedVersion`; the comparator must never read causal links (confluence — the `prev` fence stands, re-affirmed under pressure from the git comparison).

**FS-8. Validity intervals (SQL:2011 valid-from/valid-to) — REJECT as record metadata.** A fact's validity window is *content* (the asserted thing), not envelope metadata; `claimedAt` timestamps the act of assertion only. Guards the trailing-words surface against scope creep.

**FS-9. Batch-undo / write-ahead inverse — CONVENTION (SDK).** No protocol surface.

**FS-10. `ANCHORED` flag + `asof` URL generalization (basis refs) — DURABLE** (read-lens-spec revision; no freeze surface; listed for completeness because it is the read-side of FS-2/3).

Dependency note for the other lanes (flagged per the kickoff): the multi-writer collaboration pattern's "whose edit is newer" and this lane's basis-selection both ride FS-3; decide P1 with this input, not before it.

---

## 7. Named failure modes

- **FM-A `revoke-as-undo`:** expecting resurrection from REVOKE; empty-on-revoke means re-assert or nothing.
- **FM-B `undo-hands-off-the-position`:** revoking your current version yields your slot; the reader's lens falls through to the next author. Undo MUST be revert, never retract (§3.2).
- **FM-C `pre-signed ladder`:** future-dated checkpoint ladders keep stale absence-of-revocation looking fresh and outrank the author's own honest checkpoints until wall-clock passes them; unsubmitted entries defangable only by revocation-by-claimId (§2.6).
- **FM-D `replica-admittedAt freshness`:** using a replica's admission time as a freshness anchor is fail-open (late courier ⇒ stale looks fresh). Reverses verify-time-model fix 6.
- **FM-E `sort-by-claimedAt`:** feed/thread ordering by testimony ⇒ backdate-to-top (P13 redux; the falsifier only catches forward lies).
- **FM-F `same-slot-twice-per-batch`:** intra-batch same-slot writes resolve by recordDigest — arbitrary; SDK coalesces (§2.1).
- **FM-G `device-collision self-EQUIVOCAL`:** two offline devices, same µs, same random bits — bounded to one coordinate, self-heals at next write; per-author HLC sync floor makes it offline-simultaneity-only (§2.4).
- **FM-H `unpinned evidence on replay`:** basis replay without the evidence pin can flip grades (a later duplicity proof re-grades a position); pin or label.
- **FM-I `anchored-as-current`:** consuming an as-of/basis read as live currency; closed by the ANCHORED flag + GATE rule (§3.4).
- **FM-J `age-refresh-by-replay`:** if admittedAt were updatable on re-submission, replaying old envelopes would refresh their apparent age; closed by write-once (§2.5.1).

## 8. Handed to Durable specs (read-lens-spec revision queue)

1. New §temporal-reads: `history`/`asOf`/`since`, as-written vs as-seen, the now-overlay rule, ANCHORED flag (with P3's batch).
2. §5.2/§5.3/§9.C freshness re-anchor: beacon > tidTime-with-labeled-assumption > never replica-admittedAt; checkpoint-age wording updated; §9.C's `age = now − tidTime(N)` gains the beacon path.
3. P13 extension: name `claimedAt`; the sound forward falsifier; backward check demoted to heuristic; "never order/gate on testimony" restated with the field name.
4. URL surface: `asof=<order|claimId(checkpoint)|basis-ref>`; `?venue-time=` explicitly rejected as a portable query key (venue-relative only).
5. SDK: undo verbs (revert/retract), inverse-batch, same-slot coalesce, per-author HLC floor, device-bit allocation vectors, never-mint-future-orders + retain-digests doctrine, snapshot/manifest encodings.
6. Apps cookbook: FM catalog above; the tri-split restore pattern; manifest-as-lockfile; P7's pinned-root closure named as a manifest instance.

## 9. Risks and residuals

- **Gas unknowns:** FS-3 cost ranges from ~0 (packed) to ~22k/claim (own slot) — the A2 snapshot must decide; this lane's ADOPT stands at either price but James should see the number ([[freeze-gates]] B).
- **Beacon verifiability on-chain** is chain-dependent (blockhash lookback windows / beacon oracles); off-chain verification is always possible. The precedence order degrades gracefully but the degraded (`tidTime`) anchor carries a named assumption — residual risk if authors forward-date-and-hold *and* omit beacons.
- **Full-history walks are indexer-lane** — acceptable under no-query-language, but the first "show all versions" UX will hit it; view-contract pagination over the spine should be prototyped early.
- **BASIS-OPEN drift** (order anchors on authors without checkpoints) is inherent; the mitigation is social (checkpointing becomes hygiene) — worth one line in ops doctrine.
- **claimedAt+8-bytes-forever** and the widened VAL-tail fuzz surface are accepted, priced costs; if the differential fuzz turns red, FS-2's fallback is optional-with-presence-flag (worse; re-open only on evidence).
- Untested-by-adversary: the beacon design (FS-5) and the basis encoding (FS-6) are this lane's new constructions — they should get the same red-team treatment the time model got.
