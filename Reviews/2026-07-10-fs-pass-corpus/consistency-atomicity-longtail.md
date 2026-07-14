# Lane report — Consistency model, locking, atomicity, quotas, and the long tail

**Pass:** EFS v2 filesystem-features (Pass 1)
**Lane:** consistency / locking / atomicity / quotas / long-tail dispositions
**Ground truth read:** fable-fs-kickoff, fs-feature-space, state-brief, codex-envelope, codex-kernel, codex-kinds, read-lens-spec (full), verify-time-model, freeze-gates (§C additive list, §D reconciliation)
**Status:** design-pass output — normative where marked NORMATIVE; everything overturnable with cause except mission ends
**Date:** 2026-07-10

---

## 0. Executive summary

1. **The consistency model has a precise, citable name:** EFS is **per-venue serializable over admitted state, strongly-eventually-consistent across venues (confluent), and never globally linearizable.** Section 1 writes the statement the OS pass should quote, including the MAY-assume / MUST-NOT-assume lists, the durability-is-finality rule, and the snapshot-read rule ("one venue, one block height" is EFS's consistent cut).
2. **Locking:** after a serious hunt (§2), **no application's correctness requires write-time exclusion at the EFS layer.** Every candidate decomposes into: native-already (identity uniqueness, per-author sequencing), venue-admission-order (auction close, take-a-number), chain-layer contract (global names, money-bearing scarcity), or genuinely-gone (flock, mandatory locks). The one real write-time coordination problem EFS has is **self**-coordination (device-bit allocation against self-equivocation, P10) — a per-author convention, not a lock.
3. **Atomicity:** the single-signature Merkle batch is **stronger than POSIX at write time** — but it is *admission* atomicity at one venue, **not a portable property of the record set** (subset re-admission legally tears batches downstream). Atomic *meaning* comes from the manifest/root-pointer pattern (P7's shape), not the batch. Cross-author atomicity is **correctly not expressible** — an admission rule coupling two envelopes would violate the Etched master confluence invariant — and §3.4 designs the punt: the **offer/accept pattern** (one-way content-addressed citation; mutual citation is provably impossible), venue-local **co-submission**, and **chain-layer escrow** for value. Most "both-or-neither" needs dissolve into offer/accept, which needs no atomicity at all.
4. **Quotas:** gas is the quota (native); `maxEntries` stays a read filter; subtree accounting is an indexer job; one named failure mode (cap-queue back-dating) confirms caps are curation conveniences, never scarcity — scarcity is chain-layer.
5. **Long tail:** §5 gives every assigned feature a stated disposition. Two need real design and get it: the **mirror-health sweep** (availability-fsck, §5.2) and the **path-segment grammar completeness** ruling (§5.3 — the lane's one hard freeze-sensitive item: name-length cap and reserved-segment reject-set must be pinned before the derivation freezes).
6. **Freeze-sensitive reservations** are consolidated in §6 — one Etched grammar pin needed (path segments), one Etched add supported (P1 `admittedAt`, which this lane's consistency statement leans on), five explicit convention-not-row rulings, and two loud REJECTs (lock rows, atomic-pair admission coupling).

---

## 1. THE consistency-model statement (NORMATIVE — the section the OS pass quotes)

### 1.1 The model in one paragraph

> **EFS is per-venue consistent, eventually replicated, and never globally linearizable.** The unit of state is a venue's **admitted set** — a grow-only set of signed records, revocations (a G-set), and duplicity evidence. Every read answer (slot winner, grade, listing) is a **deterministic pure function** of (admitted set, lens, clock, evidence): same inputs, same answer, on every conforming implementation, forever. Within one venue, the chain totally orders admissions, so reads are serializable and a read at one block height is a consistent snapshot. Across venues there is no shared truth to be consistent *with*: two venues holding the same records compute **identical** state regardless of arrival order (confluence — the convergence theorem holds without carve-outs), and two venues holding *different* records are simply different vantage points, graded honestly by currency (HOME-LIVE / AS-OF(N) / UNKNOWN-CURRENCY). Nothing in the protocol can express, and nothing in any app may assume, a global "latest."

### 1.2 Formal characterization (with prior art)

- **Base state is monotone; derivations are not — by design.** Admitted records, the revocation G-set, and duplicity evidence only ever grow. Every non-monotone thing (LWW slot winners, empty-on-revoke, STALE) is a *read-time deterministic function over the monotone base*, never admission state. This is the **CALM** discipline (Hellerstein/Alvaro: logically monotone programs need no coordination): EFS achieves coordination-free convergence by pushing all non-monotonicity to the read layer. The Etched master admission invariant ("no admission check reads revocable state except through the comparator; nothing permanently rejects what another kernel could accept") is CALM enforced as law.
- **Cross-venue: Strong Eventual Consistency (SEC).** In Shapiro's CRDT sense, a venue's state is a join-semilattice (set union of records ∪ G-set revocations ∪ evidence), and slot resolution `argmax by (order, recordDigest)` is the deterministic query over it. EFS's kernel *is* a coarse CvRDT: replicas that exchange records converge, order-free. (The tombstone-slot semilattice was the fix that closed arch-D's replay-as-rollback; it is property-test-gated in codex-kernel.)
- **Per-venue: serializable admission, snapshot reads.** The venue's consensus totally orders transactions; admission order is a real total order *at that venue* — trustworthy, venue-labeled, and deliberately never an input to slot resolution (the comparator uses author-asserted `order` so that winners are portable; admission order and `admittedAt` are venue bookkeeping).
- **Never globally linearizable — and not as a deficiency.** Every full-currency ("is this the global latest / is this globally revoked") mechanism died under red team; portability = replication (snapshot, not feed). Datomic gets a global `t` from its single transactor; EFS trades that for permissionless multi-writer and multi-venue survival. git is the right intuition pump: authenticity travels with the object; "which ref is current" is a per-remote question.

### 1.3 What apps MAY assume (NORMATIVE)

1. **Determinism.** Same admitted set + lens + deny set + clock + evidence ⇒ byte-identical resolution result, every client, every time (read-lens-spec RR1/test 16).
2. **Confluence.** Any two venues holding the same records agree on all slot state, in any admission order. Replication can only *add* knowledge; it can never produce a third answer.
3. **Atomic single-author admission.** A full-envelope `submit` admits all records of the batch or none at that venue (single revert scope). See §3.2 for what this does *not* promise downstream.
4. **Idempotent, at-least-once writes.** Replay is legal and wanted; re-admission of an already-admitted claimId is skipped (monotone replication). Exactly-once *effect* falls out of content-addressed claimIds: submit as many times, to as many venues, as you like.
5. **Read-your-writes at the writing venue,** once the admitting transaction is final. Before admission, a client's optimistic view is a disclosed PENDING-LOCAL overlay (client-side, P3 territory), never protocol truth.
6. **Per-author monotonic writes, portably.** An author's higher-`order` claim supersedes their lower one on every venue that holds both (comparator is portable).
7. **Consistent multi-slot snapshots at one (venue, blockNumber).** All point reads executed against a single block height form a consistent cut — EFS's snapshot-isolation analog. (Blessed rule: **a multi-slot read that must be internally consistent pins one block height**; `eth_call` at a block / `eth_getProof` at a block gives it trustlessly.)
8. **Authenticity everywhere, unconditionally.** Any venue, any copy, any century: signature verification never degrades (§5.1 of read-lens-spec) — "certainly this key."
9. **A total, trustworthy cross-author order *per venue*:** admission order (discovery index) and, if P1 lands, `admittedAt` — venue-labeled, non-portable, and the only cross-author "newer" that is not gameable.

### 1.4 What apps MUST NOT assume (NORMATIVE)

1. **No global "latest."** There is no cross-chain currency, no is-this-revoked-everywhere, no fresh-anywhere ⇒ fresh-everywhere. Currency grades (HOME-LIVE / AS-OF(N) / UNKNOWN-CURRENCY) are the only honest vocabulary.
2. **No cross-author happens-before from record contents.** `order` values of different authors are unrelated clocks; `claimedAt` is an untrusted claim. Cross-author/cross-chain causal order needs **citation edges** (cite the exact claimId), never timestamps (verify-time-model fix 3).
3. **No slot stability.** A slot read can change PRESENT→EMPTY→PRESENT over time at one venue (higher-order arrival, revoke, re-assert). Apps may assume convergence, never quiescence.
4. **No monotonic reads across venues.** Switching venues can move you "back in time." A session that hops venues must carry its as-of bound (checkpoint N) or accept the downgrade. Within a venue, reads are monotone modulo finality.
5. **No writes-follow-reads across venues.** You may cite a claim your reader's venue lacks; the anti-fallthrough rule (UNKNOWN stops, only PROVEN-ABSENT yields) is the safety net, and apps must tolerate `Unresolved`.
6. **No atomicity across two signatures** (§3.4), and no permanence of batch co-location (§3.2).
7. **No exclusion.** Nobody can prevent any write by anyone (§2).
8. **No durability below finality** (§1.5).
9. **No meaning in admission order beyond its venue.** Discovery-index order and counts are venue bookkeeping — never GATE-consumable, never slot-resolution input, never a cross-chain truth.

### 1.5 Durability = finality (the fsync analog) (NORMATIVE)

"Admitted" in every statement above means **admitted at a block the venue considers final**. Before finality, admission is provisional: a reorg can un-admit a record at that venue (it remains a valid signed artifact and can be re-submitted — nothing is lost but the venue-local fact of admission). Rules:

- **fsync ≡ wait for venue finality.** An app that acts irreversibly on a read (GATE) must read at ≥ the venue's finality depth. On fast-finality chains this is seconds; on probabilistic-finality chains it is the app's chosen depth.
- Pre-finality state is a legitimate INTERACTIVE render with a pending label; it is **not GATE-consumable**.
- Reorg handling is mechanical: the admitted set is monotone *modulo finality*; a client that cached pre-final state re-syncs like any chain client. No EFS-specific machinery needed — but the OS pass should surface "pending vs final" in its PENDING-LOCAL overlay taxonomy (P3), because users will write on L2s where the sequencer-ack vs L1-final gap is minutes to hours.

### 1.6 Session-guarantee table (Bayou/Terry vocabulary, for the OS pass)

| Guarantee | EFS answer |
|---|---|
| Read-your-writes | YES at the writing venue after finality; client PENDING-LOCAL overlay before that; NO at other venues until replicated |
| Monotonic reads | YES per venue (modulo finality); NO across venues — carry an as-of bound when hopping |
| Monotonic writes | YES per author, portably (`order` comparator) |
| Writes-follow-reads | NO across venues — cite claimIds; readers grade missing dependencies UNKNOWN and stop |

### 1.7 Named failure modes (consistency)

- **FM-C1 Venue-hop rollback illusion.** A user reads v5 at home, opens the same path via a replica, sees v4 rendered plain. Defense: currency grades are mandatory render surface (RR6); sessions carry as-of.
- **FM-C2 Admission-order-as-truth.** An app sorts a cross-author feed by one venue's admission order and calls it "the" timeline. Defense: venue-label the ordering (P13); it is *a* trustworthy order, not *the* order.
- **FM-C3 Pre-finality gate.** An installer acts on a slot read from an unconfirmed block; reorg makes the decision unauditable. Defense: §1.5 rule; GATE reads pin finalized heights.
- **FM-C4 Cross-author LWW by claimed time.** "Whose edit is newer" computed from `order`/`claimedAt` is back-datable (past is unbounded by design). Defense: cross-author newness is admission-anchored (`admittedAt`/discovery order, venue-labeled) — flagged as the collaboration lane's dependency on P1.
- **FM-C5 Torn batch on a replica** — see §3.2; defense is the manifest pattern.

---

## 2. Locking — the hunt for write-time exclusion

### 2.1 Why locks have no referent (structural, restated once)

A lock coordinates writers around one shared mutable cell. EFS has no shared mutable cell: slots are `(author, key)`; two authors cannot race for a slot by construction; one author's own writes are ordered by their own `order`. Optimistic concurrency is not a policy choice here — it is the only shape the substrate has. The question is whether any app's **correctness** (not comfort) requires exclusion.

### 2.2 The hunt (every candidate, with its honest answer)

| Candidate | What exclusion was for | Honest EFS answer | Disposition |
|---|---|---|---|
| **Unique-name registration** ("only one alice") | prevent second registrant | TAGDEF nodes are unowned Schelling points — there is nothing to win. *Name→referent binding* is per-lens (curated name-grant lists, the §9.B registry shape): "who is `foo`" is the reader's curator's answer. **Global** unique names with transferable ownership = a chain-layer registrar contract (ENS; the Pass-3 bridge). | re-homed (lens-curation) + chain-layer for global |
| **Identity/file squatting** | prevent forging my file's id | already native: DATA is owned (author+salt in the preimage, unforgeable/unsquattable); claimIds content-addressed | native |
| **Auction close** ("no bids after T") | a moment when writes stop | Nobody can stop the writes — but nobody needs to: close = "bids **admitted at venue V by block B**" — a trustworthy, deterministic, venue-local cutoff (admission order is serializable, §1.2; back-dated `order` is irrelevant because the cutoff is admission-anchored). Settlement and money are chain-layer (escrow contract reading kernel point reads, EFSGate shape) — EFS deliberately carries no value. | re-homed (venue admission cutoff) + chain-layer settlement |
| **Sequence numbering, single-author** (invoice #42 once) | serialized counter | native: the author's own log is totally ordered (`order`); an appendOnly LIST with the charter read-filter (min-(order, recordDigest)) gives a deterministic, verifiable sequence | native |
| **Sequence numbering, cross-author** ("take a global ticket") | linearize many writers | per-venue: admission order IS a total cross-author order — "ticket = admission position at venue V," well-defined, venue-labeled. Portable/global: gone; a counter contract at chain layer if truly needed. | re-homed (venue-local) / chain-layer (global) |
| **Scarcity caps** ("only 100 entries") | stop write #101 | `maxEntries` is a read filter (Etched by amendment; a write-time cap breaks confluence). Deterministic per admitted set; venue-relative under partial replication. **Real scarcity — anything money-bearing — is chain-layer (ERC-721 etc.).** See FM-Q1 (§4.2). | re-homed (read filter) + chain-layer for real scarcity |
| **"Only one CI job publishes `latest`"** | mutex around a pointer | Two jobs racing under one author key = two claims in one slot; LWW by (order, recordDigest) resolves deterministically; the "wrong" winner is repaired by one re-assert. Correctness never needed the mutex — *the app-layer mutex was an artifact of non-idempotent publish*, and EFS publishes are idempotent + supersedable. Residual risk is **self-equivocation** (same order, different digest from two runners) → §2.3. | gone (artifact), with §2.3 convention |
| **Advisory co-editing lock** ("Alice is editing") | social signal, not exclusion | correctness never depends on it; UX may want it. Blessed **convention**: an expiring PIN under an app key (e.g. `…/locks/<path>` user TAGDEF, `expiresAt` = minutes). Purely advisory, lens-graded, auto-lapses (stale-not-dead is perfect here). NOT a reserved row. | re-homed (convention) |
| **Mandatory locks / lease-based fencing** (POSIX mandatory locking, fencing tokens) | stop a stale writer from committing | The problem mandatory locks solve — a stale writer corrupting the shared cell — cannot occur: a stale writer produces a *superseded claim*, harmless and auditable. Fencing dissolves. | gone (artifact of the one-mutable-cell world) |

**Finding (state it plainly): the hunt returns empty.** No app's correctness requires write-time exclusion *at the EFS layer*. Everything that smelled like a lock is either (a) already unforgeable identity, (b) a deterministic read-time resolution, (c) a venue-admission-anchored cutoff, or (d) a chain-layer contract because it was really about money or global registry — which EFS's mission deliberately excludes. "Locking" as a cluster is **declared gone**, with two small re-homes (advisory-lock convention; admission-cutoff pattern).

### 2.3 The one real write-coordination problem: yourself (P10)

The nearest true "lock" need in EFS is **per-author**: two of *your* devices minting the same `order` with different digests makes you self-EQUIVOCAL (admit-both + SeqCollision evidence — the read layer treats your log as forked). The TID carries 10 device bits for exactly this, but no allocation convention exists (P10). This lane's recommendation to the OS pass: bless a **device-bit allocation convention** (SDK-assigned stable device ids per key, collision-checked at first sync) as the *only* write-time coordination EFS ships doctrine for. It is a convention, not kernel surface, and it belongs in the SDK spec. (Decision owner: OS/SDK pass; flagged here because people will ask for "locks" and this is the real thing they need.)

---

## 3. Atomicity

### 3.1 Native single-author atomicity — stronger than POSIX (say it precisely)

One EIP-712 signature over a Merkle `recordsRoot` commits an arbitrarily large batch; `submit` admits it under a single revert scope. "mkdir -p a 50-file tree, place every file, tag them all, revoke three old placements" is **one atomic act at one venue**. POSIX has no multi-file atomic operation at all (`rename(2)` is its one atom; everything else is fsync-and-pray). This is the highest-confidence property in the design and the FS story should advertise it.

Two precise limits, so the claim stays honest:

### 3.2 Batch atomicity is admission atomicity, not a portable property (NORMATIVE distinction)

`submitSubset` admits *proved leaves individually*, and re-admission skips already-admitted claimIds — deliberately, for monotone replication. Consequence: **a batch can be legally torn downstream.** A cherry-picker can carry 1 of your 200 records to another venue; readers there see a fragment. So:

- **The envelope batch gives you atomic *admission*; it does not give you atomic *meaning*.**
- **Atomic meaning comes from the manifest/root-pointer pattern:** publish one root record (a manifest DATA, or a placement PIN of it) whose body commits to the closure (hashes/claimIds of everything it depends on), and make consumers resolve *through the root*. A reader on a torn venue then hits a cited-but-absent record ⇒ UNKNOWN ⇒ stop (anti-fallthrough does the safety work for free). This is exactly P7's "atomic resolve-closure-at-pinned-root" for app packages — this lane confirms it as the *general* FS pattern, not an app-package special case. POSIX's write-temp-then-rename atomic-publish idiom re-homes here: build the closure, then flip one root pointer.
- Blessed one-liner for the docs: *"the batch is your transaction; the manifest is your commit."*

### 3.3 Batch-cohort addressing (undo my last operation)

All records of one envelope share one `order`. Therefore a batch is **post-hoc addressable as the (author, order) cohort** — enumerable from the author's log with no new machinery. "Undo my last operation" = revoke the cohort (one new envelope of N REVOKEs — itself atomic at the venue, per §3.1). No `batchId` reservation is needed; the identifier already exists. Caveat: under a SeqCollision (two same-order envelopes) the cohort is ambiguous — but that state is already EQUIVOCAL-flagged and the author's problem to repair. **Ruling: convention, not row.**

### 3.4 Cross-author atomicity ("Alice AND Bob or neither")

**Why the kernel must not offer it (loud):** any admission rule of the form "admit A only if B" reads cross-record state at admission and lets arrival order decide permanent outcomes — it is precisely the disease the Etched master confluence invariant exists to kill ("nothing may permanently reject what another kernel could accept"). A coupled-pair admission rule is not a missing feature; it is a **forbidden** one. Do not reserve a slot for it. (§6 records this as an explicit REJECT.)

Is it a real FS need? Examine what people actually want:

**Pattern C — offer/accept (THE blessed punt; dissolves most of the need).**
Content-addressed claimIds are computable offline *before admission* (`claimId = keccak(DOMAIN_CLAIM_V1, author, order, recordDigest)`). So the second signer can cite the first signer's exact claimId inside their signed body. The reverse is impossible: **mutual citation is a hash cycle** (A's digest would have to commit to claimId(B) which commits to B's digest which commits to claimId(A) — a keccak fixed point, the same impossibility argument the envelope spec uses for self-revocation). One-way citation is therefore not a limitation to apologize for; it is the structure of commitment itself:

1. **Alice signs the offer half** — worded to be inert alone ("I co-sign S *contingent on* a counterpart citing this claim"). An offer alone, on any venue, in any century, means only "offered."
2. **Bob signs the acceptance half citing Alice's claimId.** The acceptance is the commit point.
3. Readers evaluate the conjunction: the joint fact is LIVE iff both halves resolve under the lens. An acceptance whose cited offer is absent at the venue ⇒ UNKNOWN ⇒ not consumable (anti-fallthrough again does the work). An offer never accepted ⇒ just an offer.

This is **torn-safe on every venue by construction** — no atomicity required, because the *semantics* carries the pairing. Prior art: this is how contract law has always worked (offer/acceptance; counterparts clauses), and how git merges work (the merge commit cites both parents; nobody co-signs). Revocability composes: Alice revokes her offer before acceptance is admitted at her home ⇒ readers grade the pair broken from that venue's vantage; apps that need a crisp window put `expiresAt` on the offer (stale offers can't be accepted into a LIVE conjunction under GATE rules).

**Pattern A — venue-local co-submission (when simultaneity is genuinely wanted).**
Anyone may relay, so a coordinator (an EOA or a contract) calls `submit(envA); submit(envB)` in **one transaction**: both-or-neither at that venue, by ordinary tx atomicity. Two caveats, named: (FM-A1) a signed envelope is bearer authority — if either half leaks pre-submission, anyone can admit it alone; the pattern requires envelope secrecy until co-submission. (FM-A2) the co-location is venue-local only — replicas can still carry one half (mitigate by combining with Pattern C's citation so tearing is detectable/inert). Use A for UX simultaneity, never for correctness.

**Pattern B — chain-layer escrow (when one side is value).**
"Payment iff placement" / swaps / auctions: an escrow contract conditions fund release on kernel **point reads** (closed author set, GATE rules, home venue, finalized height — never lens-walking; the EFSGate/§9.C shape). The contract cannot make Bob sign; it can only condition on the admitted result of his signing. This is the correct boundary: EFS carries facts; the chain layer carries value and conditional custody. Deliberate mission alignment, not a gap.

**Residual, genuinely gone:** (a) *symmetric simultaneous commitment with no proposer* — no distributed system without a coordinator has this either (it's two-generals); offer/accept or a chain-layer contract is the answer everywhere else in computing too; (b) *portable cross-venue atomicity* — excluded by the same ruling that excluded cross-chain currency, and correctly.

### 3.5 Dispositions (atomicity cluster)

| Feature | Disposition |
|---|---|
| Multi-record single-author atomic write | **native** (venue admission atomicity; stronger than POSIX) |
| Durable "these records are one unit" | **re-homed** → manifest/root-pointer pattern (P7 generalized) |
| Atomic publish (write-temp-rename idiom) | **re-homed** → build closure, flip root pointer |
| Batch undo | **native** via (author, order) cohort; convention, no row |
| Cross-author both-or-neither | **re-homed** → offer/accept (semantic), co-submission (venue-local UX), escrow contract (value); kernel coupling **rejected** as confluence-violating |
| Distributed transactions / 2PC | **gone** (artifact of shared mutable state + a coordinator with authority; EFS has neither and needs neither) |

---

## 4. Quotas / accounting / resource limits

### 4.1 Gas is the quota (native)

Every writer pays their own venue's gas for their own records (~22–27k gas/record spine cost, pending the A2 gas sign-off). There is no shared pool to exhaust, no per-user allocation, no quota daemon, no reservation system: **the entire POSIX quota apparatus is declared gone because the economic layer already meters writes.** Spam is absorbed at the writer's gas; poisoning is contained to one container (discovery-index doctrine). Replication is priced to the replicator. Rate limiting = the venue's gas market plus whatever edges (relayers/gateways) choose — edge-only filtering, byte pool stays permissionless.

### 4.2 maxEntries, and the scarcity honesty rule

`maxEntries` is a **pure read-time filter** (Etched by envelope amendment 1; a write-time cap provably breaks replication convergence — two venues filling a capped list in different orders admit disjoint, never-unionable sets). The filter (first *m* slots by min-(order, recordDigest)) is a pure function of the admitted set: convergent under full replication, venue-relative under partial.

- **FM-Q1 — cap-queue back-dating (named failure mode):** `order` is author-asserted and past-unbounded, so a later writer can craft a low `order` to sort into the first-*m*. Within one author this is self-competition (harmless); for any cross-author reading of a cap it is gameable. Consequence, stated as doctrine: **charter caps are curation conveniences and honesty labels (`beyond-charter-cap`), never scarcity.** Anything where cap-position carries value ("only 100 will ever exist" as a sellable fact) is a chain-layer contract — which is where value already lives (§3.4 Pattern B). This is consistent with, not additional to, the no-cross-chain-currency ruling.

### 4.3 Accounting: du / statfs / df

- **"How much under /projects" (du):** an indexer/The-Graph aggregation job over the log-sync event set. Consistent with the no-query-language non-goal. **Counts are never GATE-consumable** (indexer artifacts) — an accounting number is a report, not a truth a contract may act on.
- **"Free space" (df/statfs):** doesn't exist. The namespace is unbounded; the constraint is your gas balance at your venue. `df ≡ balance / gasPrice`. Declared gone with a smile.
- **Per-container bounded counts:** the discovery index gives bounded, paginated, venue-labeled enumeration (≤256/page) — enough for honest UI counts ("N entries known to this venue"), never for gates.

### 4.4 What stays unsolved on purpose

**Archive sustainability** — who pays to keep 100-year bytes alive with no token — is a different question from write metering and is explicitly out of scope for this pass (policy pass). One sentence in the FS docs should keep the two from being conflated. The mirror-health pattern (§5.2) is the *observability* half of that story and ships now; the *funding* half does not.

### 4.5 Storage-growth honesty

Never-destroy means the spine and version chains grow monotonically forever; that is the product (100-year archive), priced per-record at write time. No pruning primitive exists by design; EIP-4444-style log pruning is survivable because bodies live in state (from-state-alone reconstruction pledge). No action for this lane beyond stating it.

---

## 5. The long tail — dispositions table (nothing silent)

Legend: **native** (already falls out), **re-homed** (essential semantics, new home stated), **gone** (artifact of the one-mutable-cell world; declared, not simulated).

| # | Classic feature | Disposition | The stated answer |
|---|---|---|---|
| 1 | **xattrs / resource forks / alternate data streams** | **native, better** | VAL-layout reserved-key and user-key edges (`contentType`, `contentHash`, `size`, …) *are* xattrs — per-author, signed, revocable, ≤8192 bytes each. Multi-stream files (forks/ADS) = additional DATA children or reserved rows under the file node; the authorship boundary (§4.2 read-lens-spec) keeps foreign "streams" honestly attributed. `lang`/`dir` row-vs-convention is the P2 adjudication (other lane). |
| 2 | **Content-addressed dedup** | **split: native at bytes, deliberately absent at identity** | Bytes dedup by CID/chunksRoot (two files with identical bytes can share every mirror and every on-chain chunk); interned VALs are fully content-addressed (values dedup perfectly). File **identity** is never content-derived (ADR-0049): two identical uploads are two owned DATA objects. Say it loudly for CAS-minded devs: *equality of bytes is checkable; identity of files is owned.* |
| 3 | **Journaling / crash consistency** | **gone as a problem** | The chain **is** the journal: envelopes are the WAL records, admission is the commit, state is a materialized view reconstructible from a state dump alone (spine + bodies-in-state). There is no partial-write corruption class: malformed bodies revert; batches admit whole (§3.1); "half-written file" cannot exist. |
| 4 | **fsck** | **split: integrity native; availability re-homed** | Integrity-fsck = recompute: re-verify signatures, re-derive ids, re-run slot resolution from state (the dead-chain fire drill) — nothing can be corrupt, only absent. Availability-fsck = "are my mirrors alive?" — a real, different check: the **mirror-health sweep**, designed in §5.2. Repair is permissionless re-seeding (integrity travels with contentHash; anyone can host and TAG an additional mirror). |
| 5 | **atime** | **gone — and it's a feature** | Reads leave no trace at the data layer: no read receipts, no access-time surveillance surface, nothing for a subpoena to find in the protocol. Any "seen-by" is an app-layer claim someone *chooses* to sign. Privacy caveat for the privacy thread of this pass: atime-absence is a *data-model* win; **transport-level read privacy (gateway/RPC logs) is a separate surface** (P8 read-path-privacy) and must not be oversold by this bullet. |
| 6 | **mtime / ctime / birthtime** | **re-homed onto the time trio** | mtime ≈ `claimedAt` (author-claimed, untrusted, back-datable); ctime ≈ `admittedAt` (trustworthy, per-venue, non-portable; P1); birthtime ≈ the DATA mint's admission at its home. There is no POSIX-equivalent single number and clients MUST NOT render one (P13). Owned by the time-model lane; this table just refuses to leave the row silent. |
| 7 | **Sparse files / holes** | **gone** | No block allocation exists; `size` is a metadata claim; bytes are mirror-pointers + optional chunks. "Holes read as zeros / usage < size" has no referent. Apps with sparse payloads (VM images) encode sparsity inside their format — an encoding concern, not FS surface. |
| 8 | **Range reads / streaming / mmap** | **re-homed (transport)** | Chunked large files verify incrementally (chunksRoot; resumable-by-anyone uploads exist). Range service = HTTP Range on mirrors / per-chunk reads on-chain. mmap is meaningless without a kernel page cache — client concern. No protocol surface needed. |
| 9 | **File modes: r / w / x, setuid, sticky, umask** | **gone, with three honest redirects** | **r** → read-side: lenses select, they don't secure; *secrecy* is encryption (Pass-2 tier: salted TAGDEFs, contentEncryption/keyWrap — already reserved). **w** → no referent (permissionless writes; §2). **x** → execution is a *client* act: re-homes to `contentType` + the handler-binding P2 candidate (open-with routing) — a read-time fact, never a mode bit. setuid/sticky/umask → gone with no residue (no processes, no default-permission machinery, nothing to default). |
| 10 | **Special files (devices, FIFOs, sockets)** | **gone** | No live I/O endpoints in a permanent archive. The nearest "socket" want is watch/notify — a pull/poll world with a blessed poll pattern (other lane, feature-space §10). Declared out, 9P-style: dropping these is what keeping the model small looks like. |
| 11 | **Max name length** | **OPEN — must pin before freeze** | No cap is currently pinned in the codex docs. Unbounded names are admission-cost surface and a cross-client rendering hazard. **Recommend pinning `MAX_NAME_BYTES = 255` (UTF-8 bytes, post-NFC)** — the POSIX NAME_MAX Schelling point. Freeze-sensitive (name validation sits on the tagId-derivation surface): §6 item 1. |
| 12 | **Max path depth** | **native (cost gradient), no protocol limit** | Each segment is a TAGDEF mint (gas per segment); resolution/parent-walk cost is linear in depth; `MAX_AUTO_FOLLOWS=8` bounds redirect chains, not depth. No PATH_MAX, no fixed buffers. Durable resolver guidance may cap *display* depth; the kernel should not care. |
| 13 | **Case sensitivity** | **settled: byte-exact after NFC** | No case folding, ever (case rules are locale-political; byte-exact is the only credibly neutral choice — ZFS/ext4 semantics, not HFS+/NTFS). Two names differing in case are distinct tagIds. Confusable-name rendering (case pairs, Unicode confusables) is a client/lens legibility concern, not kernel. |
| 14 | **Reserved names** | **re-homed: tiny structural reject-set at kernel; everything else admits** | Recommend the kernel rejects exactly the *structurally ambiguous* set — empty segment, `.`, `..`, any segment containing U+002F or C0 controls/DEL — as grammar well-formedness (same class as NFC, credibly neutral: syntax, not content judgment). Everything else admits — including `~`-leading names (the URL layer's `~name:` escape already disambiguates), 64-hex lookalikes (classifier §6.3 handles them; SDK warns), and Windows device names (not our platform's problem). Freeze-sensitive: §6 item 1. |
| 15 | **flock / byte-range locks** | **gone** | §2. Advisory expiring-PIN convention available for UX; correctness never needs it. |
| 16 | **fsync / durability** | **re-homed** | Durability = venue finality (§1.5). |
| 17 | **O_TMPFILE / anonymous files** | **native, elegant** | A DATA object with no placement PIN is an anonymous file — identity without a name. "linkat" later = assert a placement. Falls out for free; worth a cookbook line. |
| 18 | **statfs / df / quota reporting** | **gone / re-homed** | §4.3. |

### 5.2 The blessed mirror-health sweep (availability-fsck) — designed

**Ruling: convention, not row.** Zero kernel surface. Adjacent to (but not dependent on) the freshness-beacon P2 candidate.

**Inputs:** a scope (own placements via authorHead + log walk; a container via `discover()`; or an explicit DATA set), a venue, a lens.

**Algorithm (NORMATIVE for the SDK verb, e.g. `efs fsck --availability`):**
1. Enumerate scope. Discovery entries obey DISCOVERY rules (lens-grade before treating as yours to care about).
2. Per DATA object: resolve the mirror set under the lens — `mirrors` PIN (primary) ∪ active `mirrors` TAGs (additional), owner-lens default.
3. Per mirror URI: fetch (HEAD/range-probe for cheap liveness; full fetch for verification), **verify bytes against `contentHash`/chunksRoot** — verify-don't-trust means health checking needs no trusted prober.
4. Grade per object: **AVAILABLE** (≥1 mirror verifies) / **DEGRADED** (primary fails, a secondary verifies) / **BYTES-UNAVAILABLE** (none — the existing read-lens flag, reused verbatim).
5. Output a local report (default). **Optional publication:** an expiring VAL TAG under an app-convention key (e.g. a user TAGDEF `…/health/mirrors`), author = the checker, target = dataId, value = compact status, `expiresAt` ≤ sweep cadence (health is freshness-critical by nature; a health claim that can't go stale is a lie waiting to happen). Subscribers pick checkers by lens, like any advisory author.
6. **Repair:** re-seed the bytes on any transport, assert your own additional-mirror TAG. The owner may re-PIN the primary. Integrity is byte-verified regardless of who hosts — repair is permissionless.

**Named failure modes:** FM-F1 health-claim spam → writer-pays gas + lens grading (identical to every other claim). FM-F2 stale health data → `expiresAt` mandatory in the convention; STALE health claims label, GATE readers ignore. FM-F3 lying checker ("mirror dead" when alive, or vice versa) → health claims are advisory only, and any consumer can re-verify a disputed mirror with one fetch — the claim is a hint, the bytes are the proof.

### 5.3 Path-segment grammar completeness (the lane's hard freeze item)

Current state: NFC canonical-name enforcement is kernel-pinned (attack-envelope C4); nothing else about segment grammar is. Because name validation feeds the Etched tagId derivation surface, the following must be **ruled before the ceremony** (not designed later):

1. **Reject-set** (recommend): empty segment, `.`, `..`, any segment containing U+002F `/` or C0 controls / U+007F. Rationale: these are *syntactically* load-bearing in every path grammar and URL surface; admitting them creates unresolvable ambiguity, and rejecting them is grammar well-formedness, not content policy — kernel neutrality survives.
2. **Length cap** (recommend): `MAX_NAME_BYTES = 255` UTF-8 bytes post-NFC.
3. **Case rule** (confirm as settled): byte-exact, no folding.
4. Everything else admits; SDK warns on confusables/64-hex-lookalikes/`~`-leading (Durable, iterates freely).

---

## 6. FREEZE-SENSITIVE RESERVATIONS (dedicated section — row vs convention vs reject, each)

1. **Path-segment grammar completeness** (reject-set + `MAX_NAME_BYTES` + case rule, §5.3) — **ETCHED GRAMMAR PIN REQUIRED** (the "row"-class item of this lane). It sits on the tagId-derivation/validation surface; leaving it unpinned ships an ambiguous derivation. Needs golden vectors (reject-set vectors + a 255-byte boundary vector) alongside the reserved-key table's.
2. **P1 `admittedAt` (stored, getProof-provable, per-claim)** — **SUPPORT ADD** (decision owned elsewhere; this lane registers a hard dependency). The consistency statement's only trustworthy cross-author order (§1.3 item 9, FM-C4) and the freshness-anchoring fix (verify-time-model fix 6) both ride on it. Must be **stored state** (not log-only), priced into the A2 gas bundle, and **fenced out of every comparator/portable ordering** (mirror the `prev` fence).
3. **Lock / lease reserved row** — **REJECT ROW.** Write-time exclusion is anti-mission (§2 hunt returned empty); the advisory soft-lock is an expiring PIN under a user key. **Explicit ruling: convention, not row** — recorded so the absence is a decision, not silence.
4. **Atomic-pair / coupled-admission rule (any "admit A only with B")** — **REJECT LOUDLY.** Violates the Etched master confluence invariant by construction (§3.4). Pairing semantics are fully served by the offer/accept convention (one-way claimId citation + optional pairing VAL property). No reserved surface of any kind.
5. **`batchId` / batch-cohort marker** — **REJECT ROW; convention.** The (author, order) cohort already identifies a batch post-hoc (§3.3); minting a field would duplicate derivable structure on the frozen envelope surface.
6. **Quota / cap / counter admission state** (any write-time cap, incl. hard maxEntries) — **REJECT.** Re-affirms the existing Etched read-filter ruling; a scarcity app is chain-layer (FM-Q1).
7. **`mirrorHealth` / availability-attestation key** — **CONVENTION, NOT ROW** (§5.2). Expiring VAL TAG by the checker; graded like any claim; reuses the BYTES-UNAVAILABLE vocabulary. Does not need (and should not wait for) the freshness-beacon P2 outcome.
8. **Time-field shapes consumed here** (`order` per-envelope; optional `claimedAt` per-record) — decided in the time lane; this lane's statement is **robust to either `claimedAt` outcome** (nothing in §1 consumes it as truth) but does consume the `order` comparator and, per item 2, `admittedAt`. Flagged so the trio converges with the FS input on record.
9. **Device-bit allocation convention (P10)** — **convention (SDK doctrine), no kernel surface**; named here because it is the real answer to every "can I have a lock" request (§2.3).

---

## 7. Risks and open edges

- **The consistency statement leans on P1.** If `admittedAt` is refused, cross-author "newer" degrades to discovery-index admission position only (still venue-trustworthy, but log-shaped and not getProof-provable) and the freshness-anchor fix reverts to untrusted `tidTime(order)`. The statement survives; two MAY-assume items weaken. Surface this in the P1 adjudication.
- **Finality is venue-heterogeneous.** §1.5's "wait for finality" is clean on L1s/fast-finality L2s and murky on optimistic rollups (soft-confirm vs L1-final gap of hours). The OS pass owns the UX taxonomy (pending / confirmed / final); the FS layer only owes the rule.
- **The offer/accept pattern needs a cookbook entry with vectors** (offer wording, expiry discipline, the conjunction read, torn-venue rendering) or every app will hand-roll a subtly broken variant — this is doctrine-shaped work, cheap, Durable.
- **Grammar pin timing:** §5.3 is small but Etched; if the reserved-key golden-vector work starts without it, the derivation vectors get cut twice.
- **Nothing in this lane reopens a ruled invariant.** Empty-on-revoke, clock-free admission, permissionless writes, read-filter caps, and the master invariant all held under this lane's pressure; the one place the lane pushed hard (cross-author atomicity) ended in a stronger argument *for* the invariant.

## 8. Declared-gone rollup (the honest "what this gives up" list, FS-clothing edition)

Locks and leases; mandatory locking and fencing; distributed transactions/2PC across authors; global linearizability and any global "latest"; write-time quotas and enforced scarcity; free-space accounting; atime; sparse files; mode bits, setuid, umask; special files; PATH_MAX; exactly-once delivery (replaced by idempotent at-least-once); durability below venue finality. Each is an artifact of the one-mutable-cell (or one-trusted-clock, or one-shared-pool) world — and each has a stated re-home or a stated reason it should not be simulated.
