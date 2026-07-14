# Red team II — the REAL os-private-tier.md (Deep Privacy Pass repair round, 2026-07-11)

**Lane:** RED TEAM — OS private tier, second pass. Replaces the round-1 red team's open obligation (attack-os-tier.md §0: it could only attack a reconstruction; `os-private-tier.md` did not exist then). This pass attacks the ACTUAL numbered design of record.
**Charge:** repair-audit round-1 findings against the real steps; replay W1–W6 for bookkeeping; adjudicate GAP-3 (FEK rotation) and GAP-4 (collab transport) with concurrency schedules; attack dirnode CRDT merge; sweep the new surface (config classes, enrollment MITM, publish partial-failure, Shamir games, fleet map); check canon + kill list.
**Bound by:** critic.md (rulings/kill list/freeze table), layer1-crypto.md, metadata-adversary.md, fs-pass-synthesis C1–C14, freeze-reservations, codex-kinds, identity.
**Status:** draft — adversarial record. #status/draft #kind/review #topic/privacy #pass/deep-privacy

---

## 0. Headline verdict

The design genuinely closes every round-1 finding — the salted-resolver launch trap is *designed out* (encrypted dirnodes, nothing writes the resolver), the recover⊕shred contradiction is split into two honest tiers, the wrong-persona guard and unlinkable-persona conjunction are normative defaults, cap-URL transport routes through wrapped shares, and lazy re-key is priced at removal. The GAP-3 team re-key ratification (R-GAP3) is a genuine piece of work and its anti-(B) derivation (a removed member can compute any deterministic function of state they held) is **correct and important**.

But the new surface introduced since round 1 carries **one FATAL-class hole and a cluster of SERIOUS ones that the round-1 reconstruction could not have seen because the machinery did not exist yet**:

1. **FATAL (shreddable tier) — the shred keyring has NO concurrency discipline, and unlike the team case it CANNOT be given a deterministic-convergence one.** Concurrent shreds from two devices fork the ring; fresh non-re-derivable epoch keys (mandatory, because shred = key destruction) cannot converge and cannot be transferred atomically. Result: device lockout and/or silently-ineffective shreds. R-GAP3's escape hatch (derive from a persistent root) is unavailable here by construction. The shred ring needs single-writer serialization and the design never states one.
2. **SERIOUS — inbound accepted shares are not recoverable after total device loss**, contradicting the WA-2 walkaway claim and the whole `private-recoverable` promise: wraps are sealed to per-device KEM keys that §4.2 says are non-phrase-derivable, and the share-ack/self-index store the wrap *recordId*, not a phrase-openable DEK.
3. **SERIOUS — R-GAP3 only proves the SAME-removal race converges.** Concurrent *different*-member removals, a single curator self-racing before confirmation, and the undefined roster-merge semantics all leak through; the roster-independent epoch-key derivation makes a botched concurrent removal *re-admit* both removed members. The §5.4 fixture does not exercise this.
4. **SERIOUS — removing a member does not evict them from an in-progress live collab session** (§5.6 is silent on mid-session re-key); the removed member reads live deltas and stale-epoch checkpoints until the session re-announces.

Nothing here demands new frozen bytes (the "zero ceremony bytes" claim survives). The FATAL is scoped to the shreddable tier, which G-2 already gates separately from launch — so **launch (recoverable tier) is not blocked**, but the shreddable tier must not ship until its concurrency discipline exists, and the WA-2 inbound-share gap must be closed before the walkaway gate can pass honestly.

---

## 1. Repair audit — every round-1 attack-os-tier finding vs the real design

| Round-1 finding | Repair claimed | Landed? | Evidence / residual |
|---|---|---|---|
| **W2/W3 launch expectation** (salted resolver post-freeze) | encrypted dirnodes at launch; salted family reserved-but-post-freeze | **LANDED (clean)** | §0.3 inventory: salted family "used by NOTHING at launch." §2 builds folders as dirnodes; §2.4 upgrade path. §4.6 private persona = fleet-map ciphertext with "no on-chain edge of any kind to the primary" — stronger than round-1's suggested "unpublished dataId." Nothing writes the resolver. |
| **W5/W6 recover⊕shred** | split `private-recoverable` / `private-shreddable` | **LANDED (clean)** | §0.2 table; recoverable "can never retroactively become shreddable (escrow wrap on-chain forever)"; W1.7 shred only in shreddable tier. Honest. |
| **§3.3 concurrent FEK race** | R-GAP3 discipline | **HALF-LANDED** | Team case ratified (§5.4) and the anti-(B) derivation is correct. But only the SAME-removal race is proven; different-removal / self-race / roster-merge unclosed (see §3). And the shred ring — the OTHER cardinality-1 rotation — got NO discipline (see §6, FATAL). |
| **§4.1 wrong-persona promptless write** | loud guard breaks promptless path | **LANDED** | §4.4 normative: private-tier write under mismatched public persona "breaks the promptless path with a loud System-Chrome interstitial (S3)." |
| **§4.2 unlinkable-persona conjunction** | relayed/sponsored flush default + refuse linked funding | **LANDED, one residual** | §4.6 enforces six defaults; §4.4 relayed default + refuse/warn top-up. Residual: *who sponsors* the flush is unstated — sponsored flush relocates funding-provenance linkage to the sponsor, an unstated non-logging trust party (memory bars a shared relayer → per-persona sponsors?). NOTE below. |
| **§2 cap-URL leaks** | wrap durable shares; raw caps same-device only | **LANDED** | W1.3: durable share wrapped to recipient; raw caps QR-then-clear; composer detect-and-upgrade. |
| **§3.1/§6 lazy re-key economics** | priced per-removal choice, forward-only at removal | **LANDED** | W1.5 lazy renders "readable by Bob until next edited"; §5.4 step 5 numbers; §5.5 economics; law surfaced at removal AND grant. |

**Net:** 6 of 7 clean; §3.3 half-landed (team half sound, shred-ring half absent). No regressions.

---

## 2. Walkthrough replay W1–W6 (bookkeeping against codex-kinds + freeze-reservations + critic §3)

Every record checked against a mintable/reserved row. **No walkthrough writes a genuinely nonexistent, unblessed, and unflagged record.** Two dependencies flagged.

| WT | Records | Verdict |
|---|---|---|
| **W1** file lifecycle | DATA (salt) / EFSBytes+C4 / contentEncryption PIN E6 / keyWrap TAG E5+F-4 occ_self / dirnode edit | **SOUND** |
| **W2** dirnode | anchor DATA / `efs.os/dirnode` pointer PIN under KIND_DATA parent / version DATA / contentEncryption | **SOUND, ONE CAVEAT** — the pointer PIN's legality depends on codex-kinds am.8 admitting a PIN with a *user-TAGDEF* definitionId under a KIND_DATA parent. The design self-flags this (Confidence: COULD-NOT-VERIFY) with a fallback (re-home under a per-user random-name TAGDEF parent, +1 record). Flagged, not fatal. Route to kinds owner. |
| **W3** private persona | none new — fleet-map ciphertext (§4.6) | **SOUND** |
| **W4** enrollment / multi-device | D2 persona/primary pair / C3 encryptionKey supersession / optional D1 act / optional vault DATA | **SOUND** |
| **W5** team | anchor+version+contentEncryption+pointer+5 epoch wraps+self-escrow (10 rec) | **REPAIRABLE** — rows all exist; the GAP-3 residual (§3) is a discipline gap, not a nonexistent record. |
| **W6** recovery | reads only (point-reads + own-author spine scan) | **REPAIRABLE** — no write; but the WA-2 *claim* is false for inbound shares (§4). |

Nomenclature flag (NOTE): W2.3/W5.3 lean on reading a slot's "recent slot history (superseded/losing claims) via the spine cursor / **priorClaimId chain**." No per-slot `priorClaimId` linked structure is frozen; recovering losing claims = filtering an author's spine by (definitionId, subject) via RP-2 spine enumeration. The capability exists; the "chain" wording implies a structure that does not. Restate against the real read ABI, because the merge's soundness depends on it (§5).

---

## 3. GAP-3 adjudication — concurrency schedules against R-GAP3

R-GAP3 (§5.4) ratifies: rotation single-writer curator-primary checkpoint (3.1); curator's two devices converge via deterministic derivation from `teamSeed_T` (3.2); re-keys are version-creating not in-place (3.3). The anti-(B) derivation is **CONFIRMED correct**: a removed member holds all epoch-e state, so any deterministic f(held-state, public-epoch) is computable by them — exclusion needs entropy they never held. Good.

**But the convergence proof (R-GAP3.2) covers only the SAME removal.** Three schedules break through:

**Schedule A — concurrent DIFFERENT removals (SERIOUS, potentially FATAL if curator spans two primary-signing devices).**
Curator device D1 executes `remove(Eve)`, D2 executes `remove(Frank)`, both from epoch e.
`teamKeypair_{e+1} = HKDF(teamSeed_T, LE64(e+1))` depends on **e+1 only, not the roster**. So D1 and D2 derive the *same* keypair — but D1 wraps it to {B,C,D,Frank} and D2 wraps it to {B,C,D,Eve}. The union of recipients of epoch e+1 includes **both** Eve and Frank. The epoch bumped and **excluded no one**. The roster-independent derivation, which makes 3.2's same-removal case converge, here guarantees the *worst* outcome: a botched concurrent different-removal re-admits both targets to the new epoch.

R-GAP3.4 addresses "two *co-curators* racing different removals" (EQUIVOCAL, human-resolved) but NOT one curator's two devices. Which model is real is itself ambiguous: R-GAP3.2 assumes two devices both derive+sign rotations, yet W4.1 says only the desktop holds the primary signing key and "the phone never holds or reconstructs the primary key." If W4.1 holds strictly, rotations are serialized by single-key custody and Schedule A needs a two-hardware-wallet setup; if a full-enrolled phone can sign primary rotations, Schedule A is live. **Resolve the inconsistency, then close A explicitly.**

**Schedule B — single curator self-races before confirmation (SERIOUS).** One desktop, user clicks remove(Eve) then remove(Frank) fast, or an offline queue holds both; both prepared from epoch e → both target pointer version e+1. Same author, cardinality-1 pointer slot → LWW keeps one; the other removal's version *loses the slot*. Per W2.3 the loser is meant to merge, but roster is **table-level metadata**, and W2.3 specifies OR-set add-wins for *child entries* only — roster merge is undefined. Add-wins-union → both members back; naive LWW → one removal silently dropped. Either way a removal is silently lost.

**Repair for A+B:** rotation MUST be read-your-latest-epoch serialized — a rotation prepared from a stale epoch is refused and rebased onto the current epoch (so the second removal composes as e+2, not a colliding e+1). Roster state MUST be LWW-by-rotation-order with removes monotone (a remove at epoch e+k is never undone by a concurrent stale roster), NOT OR-set-union. The §5.4 fixture MUST add: D1 remove(Eve) ∥ D2 remove(Frank) → assert exactly one linear epoch history, both removed, neither re-admitted, and no epoch-(e+1) wrap reaches Eve or Frank.

**Schedule C — removed member races the re-key (HANDLED).** Eve writes permissionless records at the anchor; W5.3 ignores non-roster authors' pointer slots in the merge. Curated out. ✓. Eve still reads epoch-e content forever (forward-only, stated). ✓.

**Schedule D — device offline a month, resumes stale (HANDLED for members).** Returning member picks up e+1/e+2 wraps from its mailbox; own offline edits CRDT-merge (add-wins). Convergence holds for member edits. ✓. (Rotation is the only unsafe op, per A/B.)

**Walkaway fixture adequacy:** the §5.4 fixture is good for same-removal idempotence + the anti-(B) assertion (4), but is **inadequate**: no different-removal case (A), no self-race case (B), no roster-merge assertion. Add them.

---

## 4. Inbound-share recovery gap — the WA-2 honesty hole (SERIOUS)

The `private-recoverable` promise (§0.2: "Lose ALL devices, have phrase → full recovery §6.3") and WA-2 ("accepted shares re-open via the recorded wrap refs") are **false for inbound shares** as specified.

Trace: a share to Bob is `keyWrap` sealed to "each current `kem` entry in Bob's blob" = Bob's **per-device** KEM keys (W1.3, §4.2). §4.2 states device KEM keys are "per-device random, never derived from rootSecret." The share-ack (W1.4 step 4) and self-index (§2.5) store `{fileId, wrap recordId, granter}` — a *pointer*, not the DEK. So after total device loss:
- phrase → archiveRoot → scanRoot re-derives `occ_self` → recovers **own** files ✓ (WA-1 sound);
- phrase → locates inbound wrap records via the self-index ✓;
- phrase **cannot open them** ✗ — every device KEM secret they were sealed to is dead and non-phrase-derivable.

WA-2's "re-open via wrap refs" has no key to open with. The only phrase-derivable KEM key is `recoveryKemSeed` (§0.4), used for *self-escrow of own files* — and W1.3 does not target it for inbound shares.

**Repair (pick one):** (a) mandate `recoveryKemSeed`'s public key be a published `kem` entry in every blob so every inbound wrap also hits the phrase-derivable key (costs +1 wrap/share, and every share is then recoverable) — cleanest; or (b) at accept time, the SDK re-wraps the accepted DEK to `recoveryKemSeed` and stores THAT in the share-ack (the ack becomes the recovery vehicle, not just a locator). Until one lands, the walkaway gate (JD-12/WA) cannot honestly pass for the shared-content half, and the tier-split table overstates recoverable-tier recovery.

---

## 5. Dirnode CRDT concurrency (GAP-3 metadata half)

**Personal (single-author) dirnode: SOUND.** The reader is the author; merge-on-read scans the author's own spine (bounded by own writes); OR-set add-wins never loses a file; repair-on-write converges. The offline-a-week case merges (basedOn causal set), no loss. ✓.

**Multi-writer team dirnode (W5.3): SERIOUS invisibility window.** Each member holds their OWN cardinality-1 pointer slot; readers "resolve all roster members' pointer slots" — i.e. the *winners*. If member Bob races his own two devices (phone adds X → pointer version pB1; desktop adds Y → pB2), LWW keeps one, say pB2; **pB1 is only in Bob's spine, not his pointer slot.** Other readers (Alice, Carol) read Bob's slot = pB2 = {…,Y} and **never see X** — they do not scan other members' spines for superseded pointer versions. Only Bob's own client repairs (any of Bob's devices reads Bob's full spine → merges → pB3). So X is invisible to the team until Bob next syncs, and permanently stranded if Bob never re-syncs.

This is the exact tension between W2.3 ("read the pointer slot PLUS its recent slot history") and W5.3 ("resolve all roster members' pointer **slots**"). If W2.3's slot-history read is meant per-member in the team case, it is sound but O(N members × their pointer history) — W5.3 undersells the cost as O(N) slot reads. If only winners are read (W5.3 literal), there is a child-invisibility window and a stranding risk. **Repair:** state explicitly that team-folder resolution reads each roster member's pointer slot *and* that member's superseded pointer versions (via spine filter), OR document the "a member's own device-race converges only on that member's next sync; other readers miss those entries meanwhile" window as an accepted limit. Also bound "recent slot history": the merge is only complete if it reads ALL causally-concurrent losing versions, not a recency window — an old-but-concurrent loser dropped from a window IS lost data.

**Add-wins masks a remove (NOTE, accepted):** desktop trashes X while phone concurrently edits X → add-wins keeps X. Defensible ("never lose a file"); state it so "I deleted this and it came back" isn't a surprise.

---

## 6. Shred keyring concurrency — the FATAL new surface (shreddable tier)

The shred keyring (W1.7, JD-27) is **new machinery the round-1 reconstruction never saw** and it has **no concurrency discipline** — and it is a cardinality-1 rotation, the exact §3.3 hazard class.

Mechanism: one ring DATA = encrypted `{fileId→DEK}` table under `K_ring_e`; `K_ring` is enclave-only, **fresh CSPRNG per rotation** (W1.7 step 1: "fresh `K_ring_{e+1}`"), never on-chain, transferred device-to-device at enrollment. Shred = remove DEK + rotate to fresh key + erase old key everywhere. Ring pointer PIN is cardinality-1.

**Why fresh keys are mandatory and why that is fatal under concurrency:** shred = key *destruction*, so the epoch key must be non-re-derivable — it CANNOT be `HKDF(shredRoot, e)` (a persistent-root derivation would let any device re-derive the destroyed key and re-open shredded DEKs, defeating shred). So R-GAP3.2's escape hatch (deterministic convergence from a persistent curator root) is **structurally unavailable** to the shred ring. The anti-(B) logic bites the design itself here: convergence needs entropy shared in advance; a destroyable key must not be re-derivable; the two are irreconcilable → **the shred ring MUST be single-writer, full stop.**

**The break (concurrent shred from two devices):**
- D1 shreds X: fresh `K_ring_{e+1}^{D1}`, table minus X, pointer→that version, erases `K_ring_e`.
- D2 concurrently shreds Y: fresh `K_ring_{e+1}^{D2}`, table minus Y, pointer→that version, erases `K_ring_e`.
- Cardinality-1 pointer LWW keeps one (say D1's). D2's version loses.
- D2's enclave holds `K_ring_{e+1}^{D2}` and has erased `K_ring_e`; it does **not** hold `K_ring_{e+1}^{D1}` and there is **no on-chain wrap** to obtain it (shred keys never touch chain). **D2 is locked out of the ring.** And Y's DEK — D2 removed it from D2's losing table, but D1's *winning* table still contains Y's DEK (D1 never shredded Y). **Y is not shredded although the user was shown "shredded".** Symmetrically if D2 wins, X survives.

Either device can also be left the sole holder of the live epoch key with no propagation path, or the ring forks into two undecryptable-by-the-other versions. This is silent data-access loss AND silent shred failure — both fatal for the tier whose entire purpose is honest destruction.

**Grade:** FATAL for the shreddable tier; SERIOUS overall (recoverable tier unaffected; G-2 already gates the shreddable tier separately from launch). **Repair:** the shred ring MUST have an explicit single-writer serialization discipline (a designated shred-committer device, or a checkpoint-serialized shred op with read-your-latest-ring-epoch refusal of stale rotations), stated as loudly as R-GAP3.1 — and the design must state that no deterministic-convergence discipline is available for it and why. Add a concurrent-shred fixture asserting: exactly one live ring epoch, every enrolled device can derive it, every intended shred is effective (target DEK absent from ALL on-chain ring versions decryptable under a live key), no device lockout.

**Corollary honesty gap (SERIOUS):** because team epoch keys derive from the curator's persistent `archiveRoot` (§5.1, always re-derivable), **shared/team folders can never be in the shreddable tier** — the curator root is a standing skeleton key to all epochs. The §0.2 tier table and the §3.2 config table imply a per-file/subtree shreddable choice without stating that shared content is recoverable-only and that a removed member's access to cold shared files is forever forward-only-lazy, never shreddable. State it.

---

## 7. Collab transport (GAP-4, §5.6)

- Relay outage / reorder / replay / withhold: **HANDLED** — degrades to offline Yjs, AAD=(roomId,seq) blocks splice/replay, CRDT idempotence absorbs replays. ✓
- **Member removed mid-session — NOT handled (SERIOUS).** `K_sess` is sealed to the team epoch pk at session start; the removed member (Eve) already holds `K_sess` and all `K_send`. §5.6 is silent on mid-session re-key, so Eve keeps reading live deltas until the session tears down and re-announces under epoch e+1. Worse, a checkpoint written mid-rotation is "wrapped to the current team epoch" — a saver who hasn't seen the rotation wraps to epoch e, and Eve reads that brand-new content. **Repair:** on epoch rotation, live sessions MUST re-announce `K_sess` under e+1 (best-effort connection eviction since the relay is untrusted) and checkpoints MUST wrap to the latest epoch the saver can confirm; if eviction is only best-effort, the removal ceremony MUST state "a removed member retains live-session access until the current session ends." This is the collab analog of lazy re-key and is currently undocumented.
- **Relay sees the collaborating clique at the network layer (NOTE).** §5.6 honesty lists IP/presence "unless via OHTTP/Tor" but understates it: without OHTTP a malicious relay learns the set of collaborating endpoints = the team, the Playbook-1 clique re-identified off-chain. State it as loudly as the on-chain clique leak.
- **Intra-session forged deltas → saver signs smuggled content (NOTE).** §5.6 admits member-forged deltas are possible; the downstream consequence — the saver unknowingly signs a version containing another member's smuggled content under the *saver's* EFS authorship — should be spelled out.

---

## 8. New-surface sweep

- **Config class (a) sync (SERIOUS).** OAuth refresh tokens / session tokens / TOTP seeds are correctly NEVER-ON-CHAIN (§3.1), but the sync story is "device mesh + opportunistic sync over the §5.6 relay rails." The §5.6 relay is **stateless and requires both devices simultaneously online**; class-(a) secrets therefore have **no path** between devices that are never co-online, and single-device users have zero backup with "recovery: none, by design." "Re-issuable at the provider" understates the friction (full re-auth to every provider after device loss). **Repair:** make the platform-keychain vendor-escrow path (named per-item, iCloud/Google) the *default* recommendation for re-auth-expensive tokens rather than a permitted aside, and state the co-online requirement for mesh sync.
- **Enrollment MITM (§4.3): adequate-with-flag (NOTE).** QR carries pubkeys only; SAS comparison (step 3) is a standard MITM defense and catches a QR swap *iff* the auth string is over the full offer (incl. kem pk) and is long enough — both deferred to G-6. Confirm the SAS commits to the full offer (a swap that changes the kem pk the desktop wraps `rootSecret` to must change the string). The full-device evil-app risk (a malicious client receiving `rootSecret`) is inherent and stated (W4.5).
- **Publish partial-failure (NOTE).** Idempotent resume is handled (W1.6), but aborting a partial tree publish still leaves already-submitted plaintext nodes **public forever**. Warn before the FIRST envelope, not just at completion: "once any part lands, that part is public permanently."
- **Shamir games (NOTE).** 3-of-5 is sound against two colluding friends (they hold 2 shares, need a third). Unstated threats: (a) **any k friends can silently reconstruct your archive root without you and without on-chain trace** (they decrypt shares they already hold + combine off-chain) — the threshold IS your trust assumption; (b) shares are **permanent on-chain X-Wing-wrapped ciphertext** = a 100-year standing reconstruction target requiring k friend-key compromises (HNDL applies, bounded by the hybrid). State both.
- **Sponsored-flush linkage (NOTE, refines §4.6).** The unlinkable persona's `flush:relayed-only, funding:sponsored-only` relocates the funding-provenance linkage (Playbook 7) to the *sponsor*; a logging or shared sponsor re-links the personas. Memory bars a shared relayer — so this implies per-persona sponsors or a non-logging trust assumption that the fleet map should name.
- **Fleet map vs playbooks: honest.** §4.6 states the residual (behavioral/timing correlation "starved, not solved"). ✓

---

## 9. Canon + kill-list check

No canon breach and no killed claim reinstated:
- Forward secrecy: never claimed (§0.1 uses "forward-only re-key + crypto-shred"). ✓
- recover⊕shred single tier: split (§0.2). ✓
- claimedAt=0 as timing privacy: explicitly denied (§0.3/§0.4, C-G). ✓
- Coupling rule / G9: all key roots random-CSPRNG; `teamSeed_T`, `occ_self`, `recoveryKemSeed` derive from the encryption/archive branch, never the signing key; wrap targets independent. ✓
- No write-time gates: membership is read-side curation (W5.3). ✓
- keyWrap TAG-only, opaque occurrence keys (F-3), no dual-role PIN: upheld throughout. ✓
- No Etched scan index: scanning rides three lanes + spine + P8. ✓
- atime-gone marketed correctly and bounded (W1.4). ✓

**One concentration-of-secret NOTE (not a breach):** R-GAP3.2's determinism means the curator's single recovery phrase re-derives ALL team epoch keys for ALL epochs, past and future — a skeleton key to all team content forever (HNDL: harvested team ciphertext + one future curator-phrase compromise = everything). Inherent to curator-rooted convergence; state it in the team-creation ceremony next to "curator device theft is a re-key event."

---

## Freeze-sensitive reservations

**Confirmed: this design demands zero new frozen bytes, and none of my findings changes that** — every repair is convention/SDK/spec, not ceremony surface. Specific freeze-adjacent items:

1. **codex-kinds am.8 coverage (CONFIRM — the one possible frozen-surface touch).** The `efs.os/dirnode` pointer PIN (cardinality-1, user-TAGDEF definitionId, KIND_DATA parent) must be legal under the frozen attachment matrix. The design's own COULD-NOT-VERIFY flag + fallback (per-user random-name TAGDEF parent, +1 record) means this is not now-or-never, but the kinds owner must rule it before dirnode vectors are cut. Private folders at launch depend on it.
2. **F-3 / F-4 / F-5 are CONSUMED dependencies (already in the critic's C3/E5 ceremony batch).** This design is non-conforming without "opaque" (not "random") occurrence keys (F-3 — every occ key here is structured: occ_self, mailbox chains, team scans, share-acks, ring pointers), owner-derived self-escrow (F-4 — WA-1's point-read), and the typed multi-key `encryptionKey` blob with kem+scan roles (F-5 — multi-device, mailboxes, enrollment). Confirm they land as ruled; nothing new to add.
3. **No shred-ring, dirnode-merge, collab-relay, or recovery-kem fix touches the frozen surface** — all convention/SDK. The recovery-kem fix (§4) is a published-blob-content convention (recommend recoveryKem as a standing `kem` entry), not a row.

Over-reservation guard: honored. No stealth/ZK/group row is requested. ✓

---

## Decisions for James

Only new ones; refinements cite the JD/finding they touch.

**JD-31 (new; FATAL-gated) — Shred-ring concurrency discipline before the shreddable tier ships.** The shred keyring (§6) has no concurrency discipline and, unlike the team case, cannot be given a deterministic one (a destroyable key must be non-re-derivable). Options: (a) ship the shreddable tier only after a single-writer/designated-shred-committer serialization discipline + concurrent-shred fixture exist (recommended — recoverable tier ships now regardless); (b) ship shreddable single-device-only at launch and add multi-device later (honest, narrow); (c) ship it as-is (rejected — silent shred failure + device lockout). *Recommend (a), with (b) as the interim if a multi-device shreddable story is demanded early.*

**JD-32 (new; SERIOUS) — Close the inbound-share recovery gap before the walkaway gate is claimed.** Inbound accepted shares are not phrase-recoverable as specified (§4). Options: (a) publish `recoveryKemSeed`'s pubkey as a standing `kem` entry so every inbound wrap also hits the phrase-derivable key (recommended; +1 wrap/share); (b) SDK re-wraps accepted DEKs to the recovery key inside the share-ack (recommended alternate; makes the ack the recovery vehicle); (c) accept that shared content is not recoverable after total device loss and correct the §0.2/WA-2 promise (rejected — guts the recoverable tier). *Recommend (a) or (b); do not let WA-2 assert inbound-share recovery until one lands.*

**JD-33 (new; SERIOUS) — Rotation serialization for team AND shred, and the roster-merge rule.** Ratify: rotation (team epoch, shred ring) is read-your-latest-epoch serialized (stale-epoch rotations refused/rebased); roster state is LWW-by-rotation-order with monotone removes (never OR-set-union — union re-admits removed members, §3 Schedule A). Extend the §5.4 fixture with concurrent-different-removal and self-race cases. *Recommend ratify; this closes the half of GAP-3 R-GAP3 left open.*

**JD-34 (new; SERIOUS) — Live-collab session eviction on member removal.** Decide whether epoch rotation forces live sessions to re-announce `K_sess` under the new epoch (best-effort connection eviction) or whether removal is honestly stated as taking effect only at next session (§7). *Recommend: force re-announce + checkpoint-to-latest-epoch, AND state the residual (relay is untrusted, so eviction is best-effort) — never let "removed" imply live-session eviction it can't guarantee.*

**JD-35 (new; refines §3.2) — Class-(a) secret sync + the "team folders can't be shreddable" honesty.** (i) Name the platform-keychain vendor-escrow path as the default backup for re-auth-expensive tokens (the stateless relay can't sync co-offline devices, §8). (ii) State in the tier tables that shared/team content is recoverable-only (curator-root-derived epochs are always re-derivable, §6 corollary) — the per-file shreddable choice does not extend to shared files. *Recommend both as doc/normative fixes.*

---

## Confidence

**VERIFIED (read in full this session; reasoning reproduced against the texts):** os-private-tier.md (all six walkthroughs + R-GAP3 + config classes + §5.6 + recovery ladder), critic.md (rulings, kill list, freeze table), attack-os-tier.md (all seven round-1 findings mapped to the real steps), layer1-crypto.md (§1 wrap, §2 scan lanes, §4.2 P9 tree incl. per-device-random KEM keys and recoveryKemSeed, §5.3 dirnodes, §7 shred/nonce, §8 X-Wing), metadata-adversary.md (Playbooks 1/5/7/8, §6 residual), fs-pass-freeze-reservations.md (C3/E5/E6/D1/D2/D3/D6/§H), codex-kinds.md (am.8 attachment matrix, PIN/TAG cardinality, permissionless user key-TAGDEFs), identity.md (G9, bare-EOA, per-device keys), fs-pass-synthesis.md (C1–C14, master invariant, LWW).

**LOAD-BEARING DERIVATIONS (mine, internally verified — re-run these):**
- **Shred-ring FATAL (§6):** the fresh-key-mandatory / no-deterministic-convergence argument is my derivation from W1.7 ("fresh `K_ring_{e+1}`") + the destroy-requires-non-re-derivability requirement + the no-on-chain-wrap transfer model. If K_ring is actually derived from a persistent root (contradicting W1.7 and defeating shred), re-open; otherwise the fork/lockout holds. High confidence.
- **Inbound-share recovery gap (§4):** rests on §4.2's "device KEM keys per-device random, never derived from rootSecret" + W1.3's wrap targets = device kem entries + the share-ack storing recordId not DEK. If the published blob is intended to carry recoveryKem as a standing entry (not stated), the gap narrows to a documentation fix. High confidence in the gap as written.
- **R-GAP3 Schedule A/B (§3):** the roster-independent `teamKeypair_{e+1}=HKDF(teamSeed_T,LE64(e+1))` (§5.1) is the crux; verified from the text. The severity hinges on whether two devices can sign primary rotations (W4.1 says no for the phone) — flagged as an internal inconsistency to resolve. High confidence the gap exists; severity conditional on the custody model.
- **Multi-writer dirnode invisibility window (§5):** rests on W5.3 "resolve all roster members' pointer **slots**" (winners) vs W2.3 "slot plus history." Depends on which reading is normative; both readings surface a real gap. High confidence.

**PLAUSIBLE (inherited / directional):** all gas/dollar figures (±5× band); Yjs CRDT merge properties at checkpoint boundaries (standard, not re-verified against a version); enclave key-erasure guarantees (the design already caps this at "a claim about key custody"); the SAS/enrollment threat model (standard, specifics deferred to G-6).

**COULD-NOT-VERIFY:** whether codex am.8 covers the PIN-under-KIND_DATA/user-TAGDEF shape byte-exactly (kinds owner's call; fallback exists); the real custody model for team-rotation signing (W4.1 vs R-GAP3.2 inconsistency); whether `recoveryKemSeed` is intended as a published blob entry.
