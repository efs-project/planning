# Red team — attack report on query-graph-boundary, consistency-atomicity-longtail, os-contract

**Role:** adversarial verification of three lane reports: `fspass/query-graph-boundary.md` (the query/graph line), `fspass/consistency-atomicity-longtail.md` (consistency/locking/atomicity), `fspass/os-contract.md` (P1–P13 adjudication + OS-facing contract).
**Ground truth checked directly:** codex-kernel (read ABI, submitSubset, authorHead-is-a-hint, spine gas), codex-envelope pointers, read-lens-spec (§7 discovery doctrine, LC5, the `(author, definitionId, targetId)` TAG slot key at read-lens-spec:218), client-os-pressure-report (P1, P12, P13 definitions), freeze-gates (§C additive list incl. `DOMAIN_ANCHOR_SALTED`; the A2 gas-snapshot line), fable-next-pass-scope (the multi-tag ask), apps-cookbook:30 (partial-admission first-class), fable-fs-kickoff. Sibling lanes cross-read for dependency honoring: time-versioning.md, multi-writer-collab.md, namespaces-mounts-federation-move.md, deletion-trash-privacy.md (grep), access-delegation.md (not deep-read; noted).
**Date:** 2026-07-10

---

## 0. Verdict

**SURVIVES-WITH-FIXES.** No lane's central ruling falls: the one-enumeration line holds under attack (and its strongest support — the hash-probe against the `(author, definitionId, targetId)` slot key — verified against read-lens-spec:218); the locking hunt's empty return is independently corroborated by the multi-writer lane; the kernel-coupling REJECT for cross-author atomicity came out *stronger* under pressure; the P1 adoption chain is coherent across four lanes. But the pass has **one fatal-class cross-lane defect** (the os-contract lane normatively binds verify-time-model fix 6 — freshness via `admittedAt` — which the owning time lane has since proven fail-open and reversed), **one Etched-surface contradiction between lanes** (path-segment tilde grammar: admit vs reject, both loud, both freeze-recommendations), and a set of serious overclaims in normative text (batch atomicity "per venue", admission-order "not gameable", authorHead as a complete watch cursor, the raw-AND variant, three holes in the offer/accept cookbook pattern). Every one has a fix inside the design, most of them one-paragraph edits; none require new Etched surface. Details, severity, and minimal fixes below.

---

## 1. Attacks on the multi-tag AND cost model (query-graph-boundary §2–§3)

### A1. The rejection path breaks the A_eff ≈ 1–2 assumption — SERIOUS (fix inside design)

The cost formula `G ≈ P·2.1k + C·10k + C·(k−1)·A_eff·7k` uses A_eff ≈ 1.5 (early exit on first LIVE hit). Early exit only helps candidates that **match**. A candidate that *fails* a conjunct costs a probe of **every** lens author on the failing conjunct before rejection — A probes, not 1.5. For the stated SDK maxima (lens ≤ 8 authors) on a *selective* query (most candidates fail — the common shape for a 3-tag AND):

- medium row re-run: P = 1,024, C = 300, 280 of them rejected on the first probe conjunct → 280·8·7k ≈ 15.7M just in rejection probes, + 20 matchers ·2·1.5·7k ≈ 0.4M, + resolve 3M + scan 2.15M ≈ **21M vs the reported 11.5M** (~2×);
- the "large" row under the same shape lands ≈ 55–60M vs the reported 29M (~2×, over the 50M cap in one call).

The report claims its conclusions "survive ±2× error" — the selective-query-with-full-lens case sits exactly at, and past, that boundary. The *shape* of the line survives (pagination still bounds every call), but the SDK defaults are miscalibrated: `k ≤ 4, drive ≤ 4 pages, lens ≤ 8` is not one budget, because probe cost is `C·A`, and A=8 doubles-to-quadruples the worked numbers.

**Minimal fix:** make the budget formula the SDK default, not the constants — cap `pages × lens` jointly (e.g. `P·2.1k + C·(k−1)·A·7k ≤ cap` computed before the call, pessimistic A), and state A_eff honestly as "1–2 for match-heavy, = |lens| for rejections." No design change.

### A2. Postings inflation is economically trivial on the venues EFS targets — SERIOUS (fix exists, should be promoted)

FM-Q3 absorbs junk at "~27k gas per junk entry (writer-pays)" vs 2.1k/entry to skip. On mainnet that asymmetry has teeth. On the cheap L2s / community devnets EFS actually targets (cf. the devnet docs; gas ≈ cents per Mgas), 20,000 junk entries ≈ 540M gas ≈ **single-digit dollars** — and that forces every AND driven by the poisoned conjunct into multi-call pagination forever, permanently (postings are append-only; there is no compaction). Every conjunct of a *public* tag is inflatable, so "drive the rarest conjunct" degrades to "drive the least-poisoned conjunct," which the attacker also controls. The mitigation the report names in passing — **drive the AND from a curated LIST/moderated container instead of a raw public tag** — is correct and sufficient (a curator's list is only inflatable by lens-admitted authors), but it appears only inside FM-Q3.

One genuine strength found while attacking this: the **author pre-filter caps adversarial *probe* amplification for the lens-graded variant** — junk from non-lens authors costs 2.1k/skip and never reaches the 7k-probe stage; only lens-trusted authors can force probes. So the attacker controls scan cost linearly but cannot touch probe cost. Worth stating as a property; it is the actual reason the design survives this attack.

**Minimal fix:** promote "curated-driver for public tags" from failure-mode footnote to the SDK default for `selectAND` over non-curated containers (warn or require explicit `driver=` choice), and re-state the cheap-case claim honestly: *cheap for curated/private/uncontested containers; attacker-degradable to paginated-or-indexer for contested public tags, at cents per thousand junk entries on cheap venues.* James's "2–3-tag AND over small containers" ask survives, but "small" must mean *curated-or-uncontested*, not just currently-small.

### A3. The raw-AND variant has no legal on-chain algorithm — SERIOUS (spec gap, fix trivial)

§3.1 blesses two variants: lens-graded AND and *raw AND* (any author, LC5-labeled). The §3.2 algorithm's probe side is `for a in lensAuthors` — it **requires a closed author set**. Raw AND has none: "does ANY author tag X into Tj" is not a point read (the slot key includes the author), so a raw AND inside the view collapses to intersecting k enumerations — precisely the "second dependent enumeration" §0's line forbids. As written, the report blesses a variant its own line outlaws and its own algorithm cannot compute.

**Minimal fix:** one sentence — *raw AND is never a view-contract read; it is a client-side join of k independent `discover()` streams (each call spends its one enumeration; the client intersects locally) or an indexer query.* This is fully consistent with the line; it just was not said.

### A4. Stateless pagination can re-emit targets across pages — SURVIVABLE

"Deduped by target" cannot hold across cursor continuations: the view is stateless, and a target legitimately appears multiple times in a driving postings list (re-assertions, supersessions by the same author each append an entry). Cross-page duplicates will reach clients. Fix: state that dedup-by-target is per-call; cross-page dedup is the client's (one set). Footnote-grade.

### A5. What held

The intersection-key precision (targets not claimIds), the hash-probe-beats-galloping-intersection argument (verified: the TAG slot key point-membership oracle is real, read-lens-spec:218), NOT-as-declared-gone (open-world negation reasoning is sound), the DISCOVERY-inheritance rule for derived enumerations, and the witness shape (re-verification ≤ k·A point reads) all survived direct attack. The one-word postings layout (R2) is the right call and its spam arithmetic is correct *given* A2's honesty fix.

---

## 2. The backlink index-key decision (kickoff Q6), attacked both directions

### B1. If ADOPTED (the report's R1 recommendation)

- **Hot-key economics for VAL targets — SURVIVABLE, supports the trim.** VAL claims post under interned `propertyId`. Global-scale keys (`contentType = image/png`) accumulate postings no on-chain reader can ever usefully walk (millions of entries → indexer anyway), yet every writer pays ~27k per claim forever to maintain them. The "value-keyed selection for free" payoff is real only for *selective* values; for the commonest values it is pure dead weight. This is a direct argument for the report's own **trimmed middle (REF-layout targets only)** — the trim should be the default recommendation, with VAL-target postings the optional extra, not vice versa.
- **Privacy interaction — SURVIVABLE but must be flagged in R1 itself (privacy is pulled into this pass).** A target-keyed index makes "every claim by anyone referencing X" a free trustless point-walk. Today a claim whose *container* is private (salted TAGDEF — definitionId unguessable) is discoverable only by scanning the spine or the author's log; the target index republishes it under the public target's key, cheap for anyone. Nothing secret leaks (the claim was always public state), but the *economics of correlation* change: reference graphs, annotation patterns, and who-organizes-what become one-probe reads. The query lane flagged the salted-TAGDEF/postings interaction only for the *watch* lane (§13.4). **Fix: carry the caveat on R1 explicitly and require the privacy lane's sign-off inside the A2 bundle decision.** (Deletion and time lanes were grepped: no stance on backlinks — no conflict, but also nobody else has priced this.)
- **Index growth/DoS:** same containment as the tag index (poisoning contained to one key; writer-pays; pagination); no new attack class found. The "who revoked X" postings key is sound (revocation is already public and enumeration-transparency is arguably a feature).
- **Arithmetic quibble — SURVIVABLE:** at the 150k low end of "typical record," spine+tag+target ≈ 76–81k is ~35–40% of the *total*, above the stated "~15–35%." Restate the range against total-including-indexes before handing James one number.
- **`_allReferencing` demotion:** the report reopens a kernel-round demotion ("never a read index," native-kernel §4.3) in bounded form. This is legal under pass rules (overturn with cause; the demotion was a default port, not an adversarial ruling) and R1 flags it loudly. Attack fails; process is clean.

### B2. If REJECTED

The report's honesty about what dies is accurate and was verified against the OS asks: cited-by/what-links-here become RPC-provider-shaped; **list-containment ("which lists contain X") and reverse placement ("all names/paths of this DATA" — the hardlink enumeration) lose any trustless live answer** — and note the second one quietly degrades the `fsck`/link-audit story the consistency lane's §5.2 mirror-sweep does NOT need but the namespaces lane's hardlink disposition ("many PINs → one DATA") implicitly leans on for auditability. No adjudicated OS ask (P1–P13) hard-depends on backlinks — os-contract N6 correctly defers — so rejection strands *app* asks (Roam/Obsidian-grade, citation graphs), not OS-contract clauses. The reserve-the-selector fallback is cheap and correct insurance either way.

**Net:** the ADD recommendation survives, but the decision memo James gets should be: **ADD with REF-only default trim + privacy-lane sign-off; VAL-target postings optional; reserve-selector as the floor.**

---

## 3. Watch/poll under relayer batching (query-graph-boundary §6)

### W1. `authorHead` is not a complete cursor — SERIOUS (the table says it is; the kernel doc says it isn't)

§6.1's cursor table: "Author cursor: `authorHead(a)` … catches **any** new admission by *a* at this venue." False under out-of-order admission, which is *routine*, not exotic: `submitSubset` resume, replication couriers carrying old envelopes, and relayers batching whatever arrives. `authorHead` is the **highest order admitted** (codex-kernel:47 — and the kernel doc itself calls it "a venue-local hint and never currency machinery"). Admitting an envelope with order *lower* than the head does not move the head: a watcher diffing `authorHead` silently misses every backfilled claim — including late-arriving REVOKEs riding an old-order envelope of a courier. The query lane promoted a documented hint into a completeness primitive.

**Minimal fix:** demote the author cursor to a *hint* in the table (exactly the kernel doc's word); completeness per author = venue spine cursor (`claimCount` + delta scan filtered by author) or the log lane. The venue and slot cursors are unaffected; the pattern survives.

### W2. Reconciliation cost of the revoke-echo REJECT (R4) is under-priced — SURVIVABLE (ruling stands)

The zero-Etched-cost alternative (watchers poll `isRevoked` over the container's known claimIds) is O(container) point reads per reconciliation tick: a 5,000-entry container costs ~10.5M gas of free-but-slow `eth_call` per sweep. At the horizon cadence (hourly, not per-block) this is absorbable, and the log lane covers the interactive case at RPC trust — so the REJECT is still right on admission-minimalism grounds. But the ruling text says "(a) covers the need at zero Etched cost" without stating the read-side cost it shifts. State it, so R4 isn't re-litigated by someone who finds the cost first. A batched `isRevokedBatch` view (Durable, trivial) halves the pain; add it to the §P1.2-style view-recipe appendix.

### W3. Admission order is manipulable at creation — SERIOUS (overclaim shared with the consistency lane; see C2)

Relayer batching is not just a latency question for watchers; it is an *ordering authority*. Whoever batches/sequences (relayer, builder, L2 sequencer) chooses intra-window cross-author admission order and can delay arbitrary envelopes (they are bearer artifacts; nothing obliges prompt relay). Consequences inside this lane: discovery-index order — which P13's social pattern makes the feed order and the consistency lane calls "the only cross-author 'newer' that is not gameable" — **is gameable at creation** within the batching/censorship window (delay Alice, admit her rival first; precedence stolen). It is *tamper-evident after the fact* (can't be rewritten) but not *neutral at creation*. Multi-venue submission bounds the window by the fastest honest venue, and earliest-`admittedAt`-across-venues is the sound anchor — the design already contains its own fix; the prose just overclaims. Fix under C2.

Watch mechanics per se (cursor monotonicity, reorg discipline via `(blockHash, index)`, hint-never-truth, reconciliation-at-horizon) survived attack; the reserved-key-fan expansion (§6.3b) is correct and necessary.

---

## 4. The consistency statement — over/under-claiming (consistency lane §1, §3; os-contract G4)

### C1. "All-or-none at that venue" is false during subset submission — SERIOUS (normative text, trivial fix)

§1.3 MAY-assume item 3 ("A full-envelope `submit` admits all records of the batch or none at that venue") is accurate *as scoped* — but §3.2 then frames tearing as a *downstream/replication* phenomenon ("a batch can be legally torn **downstream**"), and os-contract **G4** hardens the overclaim into the OS contract: "Atomic authored batches … all-or-nothing per venue, **resumable in chunks by anyone**." Those two halves of G4 contradict each other: resumable-in-chunks (`submitSubset`; apps-cookbook:30 calls partial-admission semantics *first-class*) means a batch is partially admitted **at the writing venue** for the entire resume window — hours for a large upload, forever if the resume dies. An OS that reads G4 as "if I see one record of a batch at a venue, the rest are there" builds exactly the torn-state bug the manifest pattern exists to prevent — at home, not just on replicas.

**Minimal fix:** G4 and §1.3.3 scope the guarantee to *single-transaction full-envelope submit*; §3.2's "torn downstream" becomes "torn at any venue — including the writing venue mid-resume"; the manifest/root-pointer pattern is already the complete answer (flip the root last — the cookbook's resume flow should say the root record goes in the final chunk). No semantic change anywhere; three sentences.

### C2. "Admission order is not gameable" — SERIOUS (shared overclaim; fix is one caveat)

Consistency §1.3 item 9 ("the only cross-author 'newer' that is **not gameable**"), §2.2's auction row ("a **trustworthy**, deterministic, venue-local cutoff"), and os-contract G8 all treat venue admission order as adversarially clean. It is clean *retrospectively* (append-only, unrewritable) but **manipulable at creation** by the sequencer/relayer/builder: reorder within the window, delay, censor at auction close (the oldest MEV story there is; on an L2 the sequencer is a single party). The auction-close pattern in §2.2 needs this stated: the cutoff is deterministic but its *contents* are subject to the venue's censorship characteristics — a bid submitted before T can be excluded by B; on sequenced L2s that is one operator's choice. Neither report says it.

**Minimal fix:** add the qualifier everywhere the claim appears: *admission order is tamper-evident and non-rewritable, but its formation is subject to the venue's sequencing/censorship window; precedence- or cutoff-sensitive apps submit to multiple venues and anchor on earliest admission; auction-grade neutrality is a venue-selection criterion, not a protocol property.* This is fully compatible with the model — it is the same honesty the docs already apply to RPC trust.

### C3. Smaller consistency nits — SURVIVABLE

- §1.5 durability: on reorg, re-admission changes `admittedAt` and discovery position — "nothing is lost but the venue-local fact of admission" should note that *venue bookkeeping (order, admittedAt) is re-stamped*, which matters to P13 precedence displays below finality. One clause.
- §1.3.7's consistent-cut rule and §1.2's confluence statement survived attack (slot state is genuinely arrival-order-free; venue bookkeeping is correctly excluded from the confluence claim).
- The locking hunt (§2) held under attack, and independently: the multi-writer lane reached the identical REJECT for lock/lease rows and the identical chain-layer redirect for true exclusion. The advisory expiring-PIN convention (consistency) vs "no blessed pattern needs exclusion" (multi-writer) are compatible (advisory ≠ exclusion) — but the *advisory-lock convention key shape* should be named once, in one lane, or apps get two dialects. Assign to the cookbook.

---

## 5. The cross-author-atomicity punt vs a real two-party app (consistency §3.4)

The punt's core — kernel coupling is confluence-violating and REJECTED; the hash-cycle impossibility of mutual citation — is **sound and survived**; attacking it strengthened it. The offer/accept *cookbook pattern*, however, has three holes a real two-party app falls into. All fixable in doctrine; none touch the kernel.

### X1. Contingency is invisible to the grade vocabulary — SERIOUS

"Alice signs the offer half, worded to be inert alone." Inert *to whom*? The grade vocabulary has no CONTINGENT disposition, and slot resolution doesn't read wording. If the offer half is a claim under any key a generic resolver interprets — a placement PIN, `movedTo`, any reserved row — it **wins Alice's slot and renders as her current state** everywhere, immediately, unaccepted. Offer/accept therefore only works for claims under *app-vocabulary keys* whose consumers implement the conjunction read. The report's worked prose never states this restriction, and the phrase "worded to be inert" invites exactly the mistake: contingent claims in FS-semantic slots.
**Minimal fix (one rule in the cookbook entry):** *offer halves MUST live under app-convention keys, never reserved rows or FS-semantic slots; the joint fact is app-interpreted; anything a generic resolver consumes cannot carry contingency.* For FS-visible two-party changes (swap placements), the honest tools are sequencing single-author acts (movedTo → place, torn state degrades to a dangling redirect = honest UNKNOWN) or Pattern A for UX simultaneity.

### X2. Post-acceptance expiry decay — SERIOUS (semantic hole in the recommended expiry discipline)

"Apps that need a crisp window put `expiresAt` on the offer (stale offers can't be accepted into a LIVE conjunction under GATE rules)." Expiry is evaluated **at read time**: an acceptance admitted well inside the window still yields a conjunction whose offer half goes STALE the moment `expiresAt` passes — the accepted deal *expires retroactively* for every subsequent GATE read. As written, the discipline makes every time-boxed offer/accept pair self-destruct.
**Minimal fix, two options (state one):** (a) *consolidation re-assert* — upon acceptance, Alice re-asserts a non-expiring joint record citing both halves (the pair becomes bootstrap evidence; the consolidated record is the durable fact); or (b) an *acceptance-window read rule* — the offer's expiry is checked against the **acceptance's `admittedAt`**, not the reader's clock (requires P1; another quiet P1 dependency worth listing). (a) is implementable today and should be the default.

### X3. Unilateral revocation of "joint" facts — SERIOUS (the punt's honesty gap)

"Revocability composes: Alice revokes her offer *before acceptance is admitted*…" — but revocation has no deadline. Alice can revoke her half **after** acceptance, forever, and the conjunction reads broken from every venue that sees the revoke. So offer/accept never yields durable mutual commitment as *LIVE state*; what is durable is the **evidence** (both signatures exist, permanently, REVOKED-but-provable). Two different products, and the report sells the first while the substrate delivers the second. The concrete victim is **Pattern B (escrow)**: an escrow releasing payment on a kernel point read of Bob's LIVE grant pays out, then Bob revokes — buyer paid for state that now reads EMPTY. Nothing in §3.4 names this.
**Minimal fix:** the cookbook entry states the split — *joint facts are evidentiary-permanent and currency-unilateral; an accepted pair proves "this agreement was signed," never "this agreement is still honored"* — and Pattern B gets the rule: **escrows condition on admission facts (claim admitted, spine-provable — irreversible) or hold funds across a warranty window with revocation re-checks; never on instantaneous LIVE state as if durable.** Where ongoing performance is bought (mirror hosting), expiry+recurring payment is the shape — the design already has the vocabulary; connect it.

Residual check — the two-generals framing for symmetric no-proposer commitment, and portable cross-venue atomicity as correctly-excluded — both sound. The punt survives; its cookbook entry as sketched does not, and the consistency lane's own §7 risk ("or every app will hand-roll a subtly broken variant") applies to the sketch itself.

---

## 6. P1–P13 adjudications — cross-checks against codex rulings and sibling lanes

### Z1. FATAL-CLASS: os-contract binds verify-time-model fix 6, which the owning time lane has proven fail-open and reversed

os-contract P1.3 fence 4: "Route freshness through `admittedAt` where home is reachable, `tidTime` as the labeled fallback (fix 3.4) … **must land in the same revision**." Also FM-O1 ("defused by P1.3 + freshness re-anchoring (verify-time-model fix 6)") and G8 ("It anchors cooldowns, **freshness**, backdate detection, and precedence claims"). The consistency lane co-signs: §6.2 ("the freshness-anchoring fix (verify-time-model fix 6) … ride[s] on it").

The time-versioning lane — which os-contract's own dependency table names as the owner — found and fixed two defects that invalidate this as bound:
- **Replica direction is fail-open:** replica `admittedAt` = courier arrival time; a late courier makes a 40-day-old checkpoint read `age ≈ 0`, and a GATE passes on stale absence-of-revocation (time-versioning Correction 1: "`admittedAt` MUST NOT be a freshness anchor anywhere except the venue of prompt first submission — and since promptness is unprovable, effectively nowhere").
- **Even home is defeated by pre-signed checkpoint ladders** (sign now, submit later: home `admittedAt` is fresh, content is old). The time lane's replacement is the **recency beacon** in the checkpoint body (sign over a recent L1 blockhash; age ≥ 0 sound), with precedence beacon > labeled `tidTime` > never replica-`admittedAt`.

The failure scenario if this ships as os-contract wrote it: the OS builds update-cooldown and deny-set-freshness gates (P6's 24h floor) on an anchor an attacker refreshes by re-submission timing — the exact "gameable-or-indexer-trusting" degradation P1 was adopted to prevent. **Severity: fatal as-written for that normative fence** — but the fix already exists inside the pass (adopt the time lane's split): `admittedAt` is sound for the *existence-since* direction (cooldowns measured from this venue's own admission; predate/precedence upper bounds — note the time lane's write-once-per-venue rule makes re-submission unable to refresh it) and **never** for the *data-freshness* direction (staleness of checkpoints/heads), which the beacon owns. os-contract's fence 4, FM-O1, G8's word "freshness," and consistency §6.2 all need the one-line correction before the read-lens revision lands. Dependency notes were honored in *form* (shape deferred to the time lane) but violated in *substance* (fix 6 was bound as mandatory).

### Z2. Etched grammar contradiction between lanes — SERIOUS (must reconcile before vectors)

Consistency lane §5.5.14/§5.3: reject-set = {empty, `.`, `..`, U+002F, C0/DEL}; "**everything else admits — including `~`-leading names** (the URL layer's `~name:` escape already disambiguates)." Namespaces lane §5: "**leading `~` (0x7E) — REJECT as first byte** — collides with the `~prefix:` sigil grammar; mid-path a literal name spelled `~tag:…` would be undisambiguable." Two loud, opposite, decision-grade recommendations on the **same Etched tagId-derivation surface**, neither citing the other. The namespaces lane also covers holes the consistency reject-set omits (bidi/format controls, unassigned codepoints — the latter it reports as settled base). If both reach James unreconciled, the golden vectors get cut against an ambiguous pin — the consistency lane's own §7 "grammar pin timing" risk, realized between the two lanes writing it.
**Minimal fix:** one reconciliation ruling pre-ceremony. On the merits the namespaces lane is right: it engaged the sigil grammar specifically (the consistency lane's "`~name:` escapes it" argument covers *rendering* but not the mid-path `~tag:…` parse ambiguity), and rejecting one leading byte is the cheapest total fix. Adopt: namespaces reject-set ⊇ consistency reject-set + leading-0x7E + the bidi/format-control decision made explicitly. Both lanes' `MAX_NAME_BYTES = 255` and byte-exact-case agree — only the tilde and the control-set breadth diverge.

### Z3. The "P12" label collision — SURVIVABLE (editorial, but in the decision-tracking surface)

Pressure-report P12 = *housekeeping/v1-doc banners* (client-os-pressure-report:149), and os-contract §2 adjudicates it as such. But os-contract's §5 conditional table says "Cross-author enumeration (discovery index) | **P12 gas sign-off**," and query-graph-boundary §1 says "Discovery index (**pending James, P12**)" and R6 "dependent on P12." The discovery-index sign-off is a **freeze-gates item** (the A2-adjacent gas bundle; freeze-gates:17,35), not P12 — grep of freeze-gates and fable-next-pass-scope confirms no P12 numbering exists for it. A later phase ticking "P12: decided" can mark banners done and believe the index is signed off, or vice versa. Fix: rename the reference in both docs ("freeze-gates kernel-state-cost sign-off (A2 bundle)").

### Z4. P10 device-bit convention: two dialects inside one pass — SURVIVABLE (reconcile into one SDK-normative shape)

os-contract §P10: roster-assigned lowest-free deviceId at enrollment, random fallback, re-enroll-on-clone. multi-writer lane §145: "persistent random device-bit assignment at key-import plus collision-regeneration" — and it upgrades P10 to *launch-blocking* for collaboration. The mechanisms are compatible (random is os-contract's own fallback) but the defaults differ, and os-contract's F15 itself warns that forked allocation "returns the collision through the side door." One convention, one owner (SDK spec), with the multi-writer lane's launch-blocking flag attached. Also note (privacy, minor): os-contract P10.2 extends the *public* persona-label grammar to `device:<name>:<id>` — publishing a device roster is a fingerprinting surface (device count, enrollment cadence) beyond the N8 residual; offer the private-persona variant (salted-anchor roster) alongside.

### Z5. P13 falsifier direction — SERIOUS (os-contract text conflicts with the owning lane's correction)

os-contract P13(a) and worked example §6.3 present `claimedAt`-vs-`admittedAt` as backdate *detection* ("earliest known `admittedAt` is 2026 ⇒ … carries the **backdate flag**"). Time lane Correction 2: **backdating is inherently unfalsifiable** (envelopes legally circulate off-chain pre-admission; a 2019-claimed record admitted 2026 may be genuine); the *sound* falsifier runs forward only (`claimedAt > earliestAdmittedAt + 600s` = proven false testimony); the backward check is a labeled heuristic, and the correct render for unproven-early is "**unproven**," not "detected backdate." os-contract's rule text ("checkable against admittedAt, anchored on the earliest/home admittedAt") is direction-ambiguous and its example uses the unsound direction as if probative. Fix: import the time lane's wording verbatim into P13(a) and re-caption §6.3 (Mallory's claim renders *unproven-early + caution*, and her feed position is where it admitted — which is the actual defense).

### Z6. Adjudications that were attacked and held

- **P1.1/P1.2/P1.3 core:** consistent with codex-kernel's frozen ABI and the store-it-or-lose-it argument; the EQUIVOCAL discovery-vs-verification caveat is exactly right. Time lane concurs (ADOPT-stored) and adds write-once-per-venue + the G-set-value upgrade — additive, no conflict.
- **P2.1/P2.2 rows, P2.3/P2.4/P2.5 conventions:** row-test application checks out; the handler-binding "no type author exists for a row to designate" argument is decisive and verified against the unowned-TAGDEF model. No codex conflict found.
- **P5.1 summaryHash REJECT:** sound (recomputability from `recordsRoot` is real); guards the Etched envelope correctly.
- **P7 closure-resolution discipline:** genuinely stronger than the atomic-op ask; consistent with the namespaces lane's independent "don't put the pin in the graph" ruling (mountPinned reject) — two lanes converging on citation-pinning from opposite directions is good evidence it's right.
- **P9 lens-config design:** `DOMAIN_ANCHOR_SALTED` reservation exists (freeze-gates:46); the deterministic-salt wording check is correctly routed to the privacy lane; the recovery walkthrough (§6.1) is sound given that check. One addendum from B1: if the target index ships, confirm VAL-PIN target postings don't add an enumeration path onto salted-anchor claims (they don't, per my analysis — interned ciphertext propertyIds are unique and meaningless — but the privacy lane should own that sentence).
- **P6 quorum-never-a-grade, F16/F18 closed-set guards:** consistent with read-lens-spec's closed vocabulary; pre-emptive rejects are well-placed.
- **os-contract N6:** will need a one-word update (per-tagId → per-key enumeration) if R1 ships; the deferral to the search lane is honored.

### Z7. Query-lane subgraph findings (F1–F3) — VERIFIED as real

Spot-checked against native-kernel §7's own acceptance test ("zero eth_calls during sync") and the kinds re-cut: F1 (events lack `expiresAt`/body) does contradict the ported test as drafted; F2's deleted-kind event vocabulary would indeed freeze embarrassments into Etched bytecode. R3 is correctly classified as a mandatory pre-freeze fix, not an option. No attack lands; endorse.

---

## 7. Severity table (all findings, most severe first)

| # | Finding | Where | Severity | Fix inside design? | Minimal fix |
|---|---|---|---|---|---|
| Z1 | Fix-6 freshness-via-`admittedAt` bound normatively; fail-open (courier lag + checkpoint ladders) | os-contract P1.3(4), FM-O1, G8; consistency §6.2 | **FATAL as-written** | **Yes — time lane's beacon + direction split, already written** | Correct fence 4 + G8 "freshness" + FM-O1 + consistency §6.2 to: `admittedAt` = existence-since only; beacon = freshness; never replica-`admittedAt` |
| Z2 | Etched grammar contradiction (leading `~`: admit vs reject; control-set breadth) | consistency §5.3/§5.5.14 vs namespaces §5 | SERIOUS (Etched, pre-vector) | Yes | One reconciliation ruling; adopt namespaces' reject-set (superset) |
| C1 | "All-or-nothing per venue" false mid-`submitSubset` at the writing venue | os-contract G4; consistency §3.2 | SERIOUS (normative contract text) | Yes — manifest pattern already covers | Scope atomicity to single-tx full submit; "torn at any venue incl. home"; root-record-last in resume flow |
| X1–X3 | Offer/accept holes: contingency invisible to resolvers; post-acceptance expiry decay; unilateral post-acceptance revocation (escrow revoke-after-payment) | consistency §3.4 | SERIOUS (cookbook pattern as sketched is the "subtly broken variant" it warns about) | Yes | App-key-only rule; consolidation re-assert (or admittedAt-window rule, +P1 dep); evidentiary-vs-currency split + escrow-conditions-on-admission-facts rule |
| C2/W3 | Admission order "not gameable"/"trustworthy cutoff" — sequencer/relayer manipulation window unstated | consistency §1.3.9, §2.2; os-contract G8; P13 pattern | SERIOUS (overclaim in normative text) | Yes | Tamper-evident-not-neutral qualifier; multi-venue earliest-admission anchor; auction censorship caveat |
| W1 | `authorHead` presented as complete watch cursor; misses out-of-order/backfilled admissions | query lane §6.1 | SERIOUS | Yes | Demote to hint (kernel doc's own word); completeness = spine cursor |
| Z5 | P13 falsifier direction (backdate "detection" is unsound; forward-only falsifier) | os-contract P13(a), §6.3 | SERIOUS | Yes — time lane correction exists | Import time-lane wording; re-caption example as "unproven-early" |
| A1 | AND rejection-path probe cost = |lens|, not A_eff 1.5; SDK constants miscalibrated (~2–4× on selective queries, 8-author lens) | query lane §3.3 | SERIOUS | Yes | Budget-formula SDK default (`pages × lens` joint cap); honest A_eff statement |
| A2 | Postings inflation ≈ cents/1k entries on cheap L2s; public-tag AND attacker-degradable | query lane §3.3/FM-Q3 | SERIOUS | Yes | Curated-driver as SDK default for public tags; restate cheap-case claim; note the pre-filter probe-cap property |
| A3 | Raw-AND variant has no legal on-chain algorithm (violates the one-enumeration line) | query lane §3.1/§3.2 | SERIOUS (spec gap) | Yes | Raw AND = client-side k-stream join or indexer; one sentence |
| B1a | R1 VAL/propertyId hot-key postings: paid forever, unwalkable for common values | query lane §5.2 | SURVIVABLE (supports trim) | Yes | REF-only trim as default; VAL-targets optional |
| B1b | Target index cheapens cross-author correlation incl. salted-container claims; privacy caveat missing from R1 | query lane §5/R1 | SURVIVABLE (privacy pulled into pass) | Yes | Carry caveat on R1; privacy-lane sign-off inside A2 bundle |
| W2 | R4 echo-reject under-prices O(container) reconciliation reads | query lane §6.3 | SURVIVABLE (ruling stands) | Yes | State the cost; add `isRevokedBatch` to view-recipe appendix |
| Z3 | "P12" label collision (banners vs discovery-index gas sign-off) | os-contract §5 table; query lane §1/R6 | SURVIVABLE | Yes | Rename to "freeze-gates A2 kernel-state-cost sign-off" |
| Z4 | P10 allocation dialects across lanes; public device-roster fingerprint | os-contract §P10 vs multi-writer §145 | SURVIVABLE | Yes | One SDK-normative convention + launch-blocking flag; private-roster variant |
| A4 | selectAND cross-page dedup impossible statelessly | query lane §3.2 | SURVIVABLE | Yes | Per-call dedup only; client dedups across pages |
| B1c | Index-bundle % understated at low end (~35–40% of total at 150k) | query lane §5.3/R1 | SURVIVABLE | Yes | Restate range vs total incl. indexes |
| C3 | Reorg re-stamps venue bookkeeping (admittedAt/order position) | consistency §1.5 | SURVIVABLE | Yes | One clause |

## 8. Freeze-sensitive reservations touched by this attack (pass rule 2 — loud)

| Item | Surface | Disposition (this report's position) |
|---|---|---|
| Path-segment grammar pin (tilde + control-set) | Etched (tagId derivation) | **Must reconcile Z2 pre-vector; adopt the namespaces superset reject-set (REJECT leading 0x7E; explicit bidi/format-control ruling).** One pin, one vector set — not two lane recommendations |
| `admittedAt` (F1) | Etched storage + ABI | ADOPT stands — **with the time lane's write-once-per-venue rule and the fence-4 correction (Z1) folded in before wording freezes**; the G-set revoke-time upgrade rides the same A2 line |
| Recency-beacon word in checkpoint body | freeze-adjacent (reserved-row vectors) | **SUPPORT the time lane's NORMATIVE-CANDIDATE** — it is the replacement for the fatal fix-6 binding; without it the freshness story has no sound anchor |
| Target-keyed discovery index (R1) | Etched, now-or-never | ADD survives red team **as: REF-only default trim + privacy-lane sign-off + reserve-selector floor**; VAL-target postings optional in the A2 pricing |
| Postings entry layout (R2) | Etched (ERC-7201) | CONFIRM — survived attack; the author-prefilter probe-cap property is a reason to keep the author word in the entry |
| Event re-cut (R3) | Etched bytecode | CONFIRM mandatory (verified against the log-only-sync acceptance test) |
| Revoke-echo (R4), lock rows, coupled-admission, batchId, summaryHash, quorum grade | various | All REJECTs **confirmed** under attack; no re-opening warranted |

## 9. Classic-FS dispositions altered by this report (pass rule 3)

No lane disposition is overturned. Two are sharpened: **watch/inotify** — the author-cursor leg of the re-home is demoted to hint (W1; completeness lives on the venue spine cursor); **cross-author both-or-neither** — the re-home splits into *evidentiary-permanent* (native: both signatures provable forever) vs *durable joint LIVE state* (**declared gone** — unilateral revocability is constitutive; apps wanting irrevocable mutual commitment hold it at the chain layer or accept currency-unilateral semantics, X3).

## 10. What this red team could not check

access-delegation.md was not deep-read (os-contract's P4 handoff requirements were not verified against it); the A2 gas numbers are estimates on both sides — every cost conclusion above inherits the pending freeze-gates gas snapshot, and A1/A2's multipliers should be re-run against real measurements; the `deletion-trash-privacy` lane was only grepped for backlink/revocation-enumeration stances (none found — the "who revoked X" postings key should still get that lane's explicit nod inside the R1 decision).
