# Red team — frontier-integration lanes (stealth, ZK, read-path)

**Lane:** RED TEAM for frontier-stealth, frontier-zk, read-privacy (deep privacy pass, 2026-07-11)
**Charge:** try to destroy the three frontier lanes' proposals; per-finding SEVERITY + failure scenario + repair; per-lane verdict; freeze-reservation sufficiency/over-reservation audit.
**Targets read in full:** frontier-stealth.md, frontier-zk.md, read-privacy.md.
**Ground truth re-read:** privacy.md, fs-pass-freeze-reservations.md, identity.md, codex-kinds.md, read-lens-spec (§0/§1/§2/§3.4/§8 LC1–LC6), attack-privacy.md (2026-07-10).
**Citations re-verified this pass (primary):** ERC-5564 text (view-tag 6×, 128→124, funding-MUST, p_stealth formula, announcer 0x…5564); Fileverse `zk-granular-permissions` repo (no circom/noir/snarkjs; voprf-ts + OZ merkle-tree + AES only); YPIR eprint 2024/270 (12.1 GB/s/core, 2.5 MB, 32 GB, no hint); Umbra paper 2308.01703 (48.5/25.8/65.7/52.6%); Base ZKP benchmark (Groth16 347,665 gas / UltraHonk 2,396,575 gas); Semaphore docs (ceremony 2024-07-13, 400+); ERC-5564 spam externality (nerolation/PSE ecosystem sources).
**Date:** 2026-07-11.

---

## 0. Verdict in one paragraph

All three lanes are strong and mostly survive. Their headline rulings hold: **stealth = RESERVE with zero kernel change** (verified admissible), **ZK = narrow-yes/broad-no as sidecar evidence never admission gate** (verified against the master invariant), **read-path = the frozen surface is already sufficient, defend two existing reservations plus one REJECT-guard** (math re-derived, holds). The frontier-zk lane is the cleanest — its Fileverse-has-no-ZK correction is **VERIFIED true** and load-bearing, and its reservation minimalism is correct. But I land **three findings that bite** and a batch of NOTEs. The sharpest is against stealth: **the single permanent genesis announce feed (R2) is a scanner-DoS amplifier on a 100-year archive, and the lane priced only the submitter side.** Because privacy *forbids* keying announcements to the recipient, every scanner must process the entire ever-growing global feed; an attacker pays ~$500 once to inflict unbounded, permanent per-scanner cost — the exact ERC-5564 externality, made worse by permanence and unprunability. Second: the **disclosed-fleet collaboration mechanism collides with the lens-disclosure law (LC1/LC2)** — a shared/published lens that trusts a stealth fleet *publicly enumerates and clusters that fleet*, defeating the unlinkability it was supposed to provide. Third, a genuine **over-reservation**: stealth R3 (scheme-tag registry as a ceremony ROW) is inconsistent with the lane's own R4 reasoning and should be Durable, not Etched. Nothing is FATAL. Every lane is REPAIRABLE-or-better with named repairs below.

---

## STEALTH LANE

### SF-1 — SERIOUS — the permanent single genesis announce feed is a scanner-DoS amplifier; the lane priced only the submitter

**Claim under attack.** §B2b: "EFS announcements cost real admission gas (~22–27k+), which is a stronger anti-spam economics than a bare event." §B4/R2: mint ONE genesis `/.well-known/stealth/announce` TAGDEF as *the* canonical feed, "the strongest now-or-never item in the whole lane," because a single feed maximizes the anonymity set. §B4 also mandates **random occurrence keys** for announcements (A1 recipient-oracle defense).

**The attack — the two mandates collide into an unbounded permanent externality.** The gas cost the lane cites is what the *submitter* pays. It says nothing about what the *scanner* pays, and the scanner is the victim of spam. Chain the lane's own facts:

1. Privacy **forbids** addressing an announcement to its recipient (random occurrence keys MUST, else A1 oracle). Therefore a recipient **cannot** do a keyed lookup; they **must scan the whole feed** and trial-derive.
2. The feed is a single **canonical, permanent, unprunable** genesis TAGDEF (that is the whole point of R2 — one Schelling feed, ceremony-frozen).
3. Attacker economics: injecting one garbage announcement costs ~22–27k gas ≈ **$0.0005–$0.005 on L2** (the read-path lane's own figure). **1,000,000 garbage announcements ≈ $500–$5,000, one time.**
4. Scanner economics: for each garbage entry, 1 view-tag check (1 ecMUL+1 hash) for 255/256, full derivation for 1/256. 1M garbage ⇒ ~1M ecMUL + ~4,000 full derivations **per scan, per device, forever** — and the cost only grows, because the permanent feed never shrinks and every new device re-scans from genesis.

**This is exactly the ERC-5564 externality** — re-verified from the ecosystem this pass: "parsing announcement events consumes computational resources that are not compensated with gas… spamming can lead to longer parsing times." But ERC-5564's standard mitigations are **ignore/de-prioritize spammers, prune by block range, filter on indexed `caller`** — all of which are *pruning/filtering* moves that EFS's permanent-canonical-verify-don't-trust feed **structurally fights**: you cannot "ignore" history in an archive that promises anyone can rebuild it, and de-prioritization is an indexer policy, not available to a verify-don't-trust self-scanner. Default-on minting (Decision 2) makes it worse: the feed becomes the union of *all OS users'* invites, maximizing both anonymity set (the intended good) and scan volume (the unpriced bad).

**Why the lane's own mitigations don't answer it.** §B4's enumeration rider ("P12/B3 make the feed enumerable + paginated") only speeds *fetching* the garbage; the scanner still trial-derives every entry. The view tag gives 256× on parse but does not reduce the number of entries touched. Neither reduces permanent growth.

**Severity: SERIOUS.** Not fatal — the feature still works — but the lane sells R2's single permanent feed as its "strongest now-or-never item" while under-pricing that this exact choice maximizes an unbounded permanent griefing surface, and Decision 2 (default-on) compounds it.

**Repair (named).** Three parts, none freeze-blocking:
1. **Demote announced-stealth to a rare counterparty-init primitive; make self-fleets (no scanning) the documented default** — which the lane already leans toward (§B3-i, §B6). Sell announcements as "for the occasional invite," never as a general mailbox you poll.
2. **Time-bucket the feed by convention** (e.g. announcements carry/land in coarse epochs) so incremental scanners process only since-last-scan; new-device cost is still O(history) but steady-state is O(delta). This is a Durable encoding choice inside R2's body spec — addable, but should be reserved as a *position in the body* now if wanted (see reservations).
3. **Honesty line:** state in R2's row text that the announce feed is a permanent unprunable scan surface, that scan cost is O(total feed) and grows forever, and that this is the price of the single-feed anonymity set. Do not let Decision 2 (default-on) proceed without pricing the scan externality it creates.
4. **Reconsider R2's "genesis" necessity** (see SF-4 / reservations) — a convention feed can be time-sharded or rotated without ceremony pre-commitment.

### SF-2 — SERIOUS — disclosed-fleet collaboration collides with the lens-disclosure law (LC1/LC2); a shared lens publicly enumerates the fleet

**Claim under attack.** §B3-ii ("BLESS as the collaboration mechanism"): a collaborator "extends *their* lens with your disclosed fleet; your writes in the shared workspace resolve as trusted for them; public observers see unlinked authors." §C R5 rejects a persona-link *row* precisely to avoid an existence-leak, keeping the fleet map as encrypted content.

**The attack.** A lens is a trusted-AUTHOR list, and read-lens-spec is emphatic that **lenses are disclosed**: §1 "A lens is data (a LIST) or client config; either way it is disclosed (§8 LC1)"; **LC2** "a client's shipped default lens MUST be a published lens ON EFS — inspectable, subscribable, forkable"; **LC1** "any shared-namespace read displays the active lens chain." For a *shared workspace* — the actual collaboration case — the natural and often necessary pattern is a **shared, published lens** so every collaborator resolves the same view. The moment that lens is published on EFS (or even shared out-of-band and re-published by any member), it **lists the stealth fleet's addresses as trusted** — which:
- **clusters the fleet** (all N one-time authors named together in one artifact), and
- **ties the cluster to the disclosing collaborator** (whoever authored/subscribes the lens).

So the disclosed-fleet mechanism, composed with the lens-disclosure law, **publicly re-links exactly the fleet it was meant to keep unlinkable**, to any observer who reads the shared lens. The lane's "public observers see unlinked authors" is false whenever the collaboration uses a published lens — which is the common case.

**Severity: SERIOUS.** The lane's flagship collaboration path (ii) leaks its own secret in its most natural deployment, and the lane never engages LC1/LC2.

**Repair (named).**
1. **Fleet-trust must live in per-viewer CLIENT-CONFIG lenses, never in a published-on-EFS LIST** — explicitly carve stealth-fleet extensions out of LC2's "default lens must be published" rule (they are *personal* extensions, not shipped defaults, so LC2 does not force publication; state this so no one publishes them).
2. For *group* workspaces where a shared view is needed, the disclosed fleet is shared **as encrypted content** (the fleet map already is, per R5) and each member installs it into their **local** lens config — the trust is replicated by capability, not by a public LIST. The shared workspace's public lens references only the workspace container author, not the fleet members.
3. State the residual honestly: any collaborator *can* choose to publish a lens naming the fleet (disclosure is forever — the lane's own §B3-ii rider), so fleet unlinkability against a *collaborator* is a trust assumption, not a guarantee — same register as the disclosure-is-forever law.

### SF-3 — NOTE — announced-stealth recovery cost after device loss is a full permanent-feed re-scan; the lane's "re-derivable" framing covers only self-fleets

**Claim under attack.** §C req 7 and §B5 sell fleet recovery as HKDF re-derivation ("re-derivable after device loss"). §B6 asserts the self-vs-announced asymmetry but does not state the recovery asymmetry.

**The attack.** For **announced** stealth (counterparty-derived), the stealth key is `p_stealth = p_spend + s_h` where `s_h = h(p_view · P_e)` — it is **not** HKDF-derived from your seed; it depends on each sender's ephemeral. To recover the set after losing local scan state you must **re-scan the entire permanent announce feed** with your view+spend key and recompute every `s_h`. That is possible (the feed is permanent — SF-1's curse is here a blessing) but it is O(total feed) work, i.e. the same unbounded quantity SF-1 identifies, paid at recovery. The lane's "re-derivable" is true for self-fleets (seed → keys) and misleadingly broad for announced fleets (seed alone is insufficient; you need the feed + a scan).

**Severity: NOTE.** Recovery is possible; the cost is just mis-stated. Repair: split req 7 — self-fleet = seed re-derivation (cheap); announced-fleet = seed + full-feed re-scan (bounded by feed size, another reason to prefer self-fleets).

### SF-4 — NOTE — R2's "genesis is required for canonicality" claim is weaker than stated; Schelling feeds form by convention (see reservations)

**Claim under attack.** §B4/R2: genesis membership is "the only ceremony-frozen ingredient" that makes ONE feed the Schelling point rather than fragmented per-app feeds; called "the strongest now-or-never item."

**The attack.** Canonical anchors routinely form by **convention, not protocol**: ERC-5564's own announcer singleton at `0x55649E…5564` is a deployed convention, not a consensus primitive; ENS, the 4337 EntryPoint, and every "well-known" registry became Schelling points by adoption. A post-freeze TAGDEF minted by EFS.eth under a blessed path would be exactly as canonical as a genesis one — the *only* thing genesis buys is sitting under the ceremony-frozen `efs.well-known` prefix (E12), which is load-bearing **only if** clients hard-code "trust announce feeds only under `/.well-known/`." That is itself a convention choice. So R2's necessity is overstated.

**Severity: NOTE** (this is a reservation-scrutiny item; see Freeze-sensitive reservations). It does not block reserving R2 — one manifest line is cheap — but James should not be told R2 is uniquely now-or-never when a convention feed (which is also more reshardable per SF-1's repair) is a live alternative.

### Stealth — what survives (steelman)

- **B1 zero-kernel-change admission: VERIFIED SOUND.** A stealth address is an ordinary secp256k1 point → address-shaped word; `recovered == author`; msg.sender ignored. No admission rule can distinguish it. Re-checked against codex-envelope line 18. Correct and important.
- **The `p_stealth = p_spend + s_h` single-leak→master-recovery footgun (§B5): CONFIRMED.** Algebraically immediate from the ERC-5564 formulas I re-verified this pass. A leaked stealth key plus the view-key-derivable `s_h` yields `p_spend`. This is a genuinely sharp catch; the sign-and-discard / spend-master-at-primary-custody rule is correct. (Note it applies to *announced* stealth; self-fleet HKDF keys don't have this additive structure.)
- **Meta-address poisoning is well-defended: SOUND.** `stealthMeta` is authored by the identity's own key (recovered signer = the identity), keyed `(author, key)`, LWW — nobody can write *your* stealthMeta slot but you. The residual (a sender deriving to the *wrong* identity because human-name→address binding is a lens problem) is inherent to all key discovery, correctly out of scope. NOTE only: silent-loss on wrong-identity derivation should be named in the row text.
- **PQ retro-linkability honesty (§B6): VERIFIED SOUND and admirably honest.** Archived ephemeral pubkey + archived view pubkey → one ECDH → CRQC relinks every announced author to its meta-address, all at once, permanently. Self-fleets (no on-chain DH material) genuinely escape this. The "time-locked pseudonymity, not anonymity" framing is correct. One rider: **default-on minting (Decision 2) maximizes the CRQC blast radius** — every default-on user carries a permanent public view key, so *every* announcement ever sent to *any* default-on user becomes retro-linkable at CRQC, including users who never knowingly used stealth. Classical-anonymity-set benefit vs quantum-retro-linkage surface is a real tradeoff Decision 2 should name.
- **View-tag math (128→124 bits, ~6×, 1/256 FP): VERIFIED** against EIP text.
- **Relayer-as-trust-locus honesty (§B2): SOUND.** The funding-linkage closure is real (authors never transact), and the lane is honest that a behavioral submission-linkage channel replaces it and that self-submission is unenforceable-by-SDK and catastrophic-if-done. The batching-within-fleet convention (R9a) is a real catch.

**STEALTH VERDICT: REPAIRABLE.** Core ruling (RESERVE, zero kernel change) is SOUND. Repairs required before shipping doctrine: SF-1 (price the scan externality; demote announced-stealth to rare-invite; time-bucket; gate Decision 2 on this), SF-2 (fleet-trust in client-config lenses, carve out of LC2; never a published fleet LIST), SF-3 (split recovery-cost framing), SF-4 (soften R2 necessity claim).

---

## ZK LANE

### ZF-1 — NOTE — nullifier-as-read-layer-evidence mis-renders legitimate multi-publisher redundancy as duplicity

**Claim under attack.** §2.3 N-1 + §3(b): per-member dedup for anonymous attestation is "nullifier evidence at the read layer" — "two records, same nullifier, same scope" treated like SeqCollision/EQUIVOCAL. Scope = `keccak(scopeDomain, definitionId, epoch)` where definitionId is the group's root container (publisher-independent). §2.5/§3(b) also blesses **multiple publishers of the same group** as censorship-resistance ("two publishers… are two lens entries").

**The attack — these two rulings conflict.** Because scope is **publisher-independent** (keyed on the group's definitionId, not the publisher key), the *same* member legitimately submitting the *same* assertion through *two* publishers (exactly the censorship-resistance the lane wants) produces the **same nullifier under the same scope in two records**. The read layer's N-1 rule then flags this as duplicate-nullifier evidence — i.e. renders honest multi-publisher redundancy as EQUIVOCAL-shaped duplicity. That is a false positive: the member did one thing, mirrored; it is not a double-signal abuse. Conversely, if the intent is "one signal per member per group, ever," then multi-publisher redundancy is *by design* impossible without tripping the evidence flag — so the two blessed features (dedup + multi-publisher) cannot both hold as specified.

**Severity: NOTE** (semantic under-specification, read-layer/Durable, fixable post-freeze — the lane is right that grade flags are Durable). But it should be resolved in the convention text so implementers don't ship a resolver that garbles legitimate redundancy.

**Repair.** Pick one: (a) bind scope to the publisher (`scope = keccak(scopeDomain, publisherAuthor, definitionId, epoch)`) so each publisher has an independent nullifier space and multi-publisher is clean — but then a member *can* double-signal across publishers (usually fine for advisories, which are monotone presence signals); or (b) keep publisher-independent scope and define same-nullifier-same-scope as **idempotent mirror** (merge, not evidence) rather than duplicity — duplicity is only meaningful when the *messages* differ. Option (b) is cleaner: for anonymous advisories, two identical nullified assertions are a mirror; only differing messages under one nullifier are noteworthy.

### ZF-2 — NOTE — "broken circuit = redeploy the sibling" is glib about consuming-contract damage in use-case (d)

**Claim under attack.** §2.1 P-B / §2.2: sibling verifiers are "honestly replaceable — a broken circuit means 'redeploy the sibling,' not 'the archive is wrong.'"

**The attack.** For read-path/evidence uses (b/c/e) this is exactly right and is the lane's strongest structural point — a broken circuit only mis-grades DISCOVERY/flags, never admits a forgery, because R1 keeps ZK out of admission. But for use-case (d) **gated on-chain actions**, a soundness bug lets a non-member forge membership and trigger the gated action (mint, unlock, vote, withdraw) in the *consuming* contract. Redeploying the sibling verifier does **not** reverse those effects — the funds are gone, the vote is cast. "Redeploy, not archive-wrong" is true for EFS's archive but understates that a broken gate circuit can cause irreversible damage in whatever contract consumes it. This is inherent to all ZK gating, not EFS-specific, but the convention for (d) should say it plainly.

**Severity: NOTE.** Repair: in the (d) convention, state that sibling-verifier gates inherit standard ZK-gate risk (a soundness bug is exploitable against consuming contracts and is not reversible by redeploy); recommend transparent/audited circuits and value caps for high-stakes gates, and note the R1 fence protects only the *archive*, not downstream contract state.

### ZF-3 — NOTE — R1 "frozen sentence" is redundant with the master admission invariant (harmless, but call it what it is)

**Claim under attack.** §4-R1 / D2: "one frozen sentence" — "ZK state never gates admission" — demanded as Etched Codex text, "the fence that makes everything else safe."

**The attack.** The master admission invariant ("nothing may permanently reject what another kernel could accept" + "no admission check reads revocable/non-monotone state") **already** forbids ZK-gated admission: a proof-conditioned admission couples the admitted set to circuit choice and chain-local precompile behavior, so two kernels with different verifier vintages diverge — precisely the disease the invariant kills. R1 is therefore a *clarifying instance*, not a new constraint. The lane half-acknowledges this ("it instantiates the master invariant") but still frames it as a distinct "demand." That's fine — a doctrine sentence costs no bytes and pollutes nothing — but it should be logged as **commentary on an existing invariant**, not a new reservation, so the ceremony sheet doesn't treat it as independent surface.

**Severity: NOTE** (bookkeeping). No repair needed beyond labeling.

### ZK — what survives (steelman)

- **Fileverse-has-no-ZK correction: VERIFIED TRUE and important.** I re-read the repo: dependencies are `viem`, `@cloudflare/voprf-ts`, `@openzeppelin/merkle-tree`, `@fileverse/crypto`, `js-base64` — **no circom, noir, snarkjs, or verifier anywhere**; the "Merkle proof" is a key-derivation input, never verified; membership = ability-to-decrypt. The acknowledgments say "inspired from… vOPRF R&D… on the semaphore protocol and zkemail" — inspiration, not usage. privacy.md §7's framing of this as ZK-membership's "live production instance" is **wrong**, and the correction is well-founded. This matters: it removes a false premise (that ZK membership is production-proven via Fileverse) that could have justified more aggressive ZK reservations.
- **The narrow-yes/broad-no line is correct.** §2.4's shielded-pool-fights-every-mission-end argument is airtight: verify-don't-trust needs public path recomputability; hyperlinks need public dereferenceable names; composability needs contract-readable public state — a shielded graph forfeits all three. The vault-pattern escape hatch (whole private subtree in one ciphertext, zero new surface) is the honest maximum and correctly identified. VERIFIED reasoning.
- **Gas/proving numbers: VERIFIED.** Groth16 347,665 / UltraHonk 2,396,575 (6–7×) confirmed against the Base benchmark; Noir 5–50× faster proving confirmed. VAL ≤ 8192 carries Groth16 (~128–256 B) inline, Honk/WHIR go EFSBytes — correct, no new surface.
- **Nullifier cross-chain replay (N-1): SOUND.** Records are portable, so a nullifier consumed on chain A signals again against chain B's sibling — the lane correctly rules scope must bind the verifier's chain/address when once-per-member matters. Correct and non-obvious.
- **Reservation minimalism: SOUND** (see Freeze-sensitive section — this lane's reservation discipline is the model).
- **PQ asymmetry: VERIFIED reasoning.** Groth16 perfect-ZK ⇒ past-proof anonymity survives CRQC (HNDL-safe); soundness rests on pairings ⇒ proof *authority* and nullifier *uniqueness* degrade at epoch E like everything else. Poseidon nullifiers don't deanonymize post-CRQC (hash, not pairing). Correct.
- **(f) SSE split: SOUND and sharp.** Single-user blind-index = safe/cheap; multi-user shared SSE = REJECT, grounded correctly in the leakage-abuse canon, with the killer EFS-specific point that **permissionless-write is the file-injection attack's ideal habitat** and a permanent chain makes every leaked access pattern harvestable forever. Correct.

**ZK VERDICT: SOUND.** No finding rises above NOTE. Resolve ZF-1 (nullifier multi-publisher semantics) and ZF-2 (name the sibling-gate damage) in the convention text; log ZF-3 as invariant-commentary not a new reservation. The lane's reservation asks are correct and minimal.

---

## READ-PATH LANE

### RF-1 — NOTE — rung 2 (OHTTP/mixnet-fronted RPC) is effectively vapor at launch; the ladder table reads as more available than the lane's own evidence supports

**Claim under attack.** §4 ladder: rung 2 is "the best available for thin clients today." Status column: "client half shippable now."

**The attack.** The lane's own evidence guts rung-2 availability *today*: (i) "**could not verify that any public Ethereum RPC provider offers an OHTTP endpoint**" (found none); (ii) **RPCh — the one purpose-built private-RPC product — is development-paused**, with the lane's own lesson "a privacy transport with no sustainable funding model dies"; (iii) OHTTP requires a **non-colluding relay+gateway pair run by independent well-funded operators** — exactly the sustainability problem that killed RPCh, and hard for a no-token project. So for a real 2026 thin client, rung 2 is not "available" — it is "client code exists, pointed at nothing." The honest thin-client ladder at launch is: rung 0/1 (trust a provider, integrity-verified) or nothing, until someone stands up and *sustains* a relay/gateway pair. The lane discloses all of this in prose but the ladder's Status column ("shippable now") over-reads it.

**Severity: NOTE** (the prose is honest; the summary table oversells). Repair: mark rung 2 Status as "client half shippable; **no operational relay/gateway pair exists or is funded as of 2026-07** — dark until one is stood up and sustained," and repeat the RPCh-died sustainability warning in the table, not just the footnote. Do not let Decision 1(c) imply rung 2 lights up for free.

### RF-2 — NOTE — PIR queries/second is optimistic at the high end; throughput is memory-bandwidth-bound whole-DB-scan

**Claim under attack.** §5.3: "a $150–400/month cloud box sustains roughly 5–25 queries/second on 16 cores" for a 30 GB slot DB.

**The attack.** YPIR throughput (12.1 GB/s/core, re-verified) is **whole-DB linear scan per query at ~83% of memory bandwidth**. 16 cores × 12.1 GB/s = ~194 GB/s aggregate ÷ 30 GB = **~6.4 queries/s**, and only if the full DB is resident and bandwidth scales linearly across cores (it does not perfectly — memory bandwidth saturates before core count does). So the low end (5 q/s) is right; **25 q/s is not reachable at 30 GB on 16 cores** — it would need ~8 GB DB or ~64 cores. The per-query compute cost (~$0.00003) and the "thousands of reads per dollar" conclusion are fine; only the top of the q/s range is optimistic. The §5.2 arithmetic (30 GB / 12.1 = ~2.5 core-seconds/query) is **correct**.

**Severity: NOTE.** Repair: cap the stated range at ~5–7 q/s per 16-core box at 30 GB (or scale the box), and note throughput is memory-bandwidth-bound so q/s falls linearly as the DB grows — which matters because the DB grows monotonically on a permanent archive.

### RF-3 — NOTE — the Piano-as-preprocessing synthesis under-prices hint refresh on a mutating slot DB

**Claim under attack.** §5 "Piano-class synthesis": a phone streams the 20 GB slot snapshot once, keeps a ~√n hint, then does sublinear online queries — "the ladder's rungs compose rather than compete."

**The attack.** Client-preprocessing PIR (Piano/RotPIR) assumes a **static** DB per preprocessing epoch; the hint is invalidated by DB mutation. EFS slots are **not append-only** — LWW supersessions and revocations mutate existing slot cells continuously. So the √n hint must be refreshed as slots change, and for the sensitive currency/deny/lens slots (the highest-value reads) mutation is exactly where the action is. The "stream once" framing hides a "re-stream on refresh cadence" cost. For a mostly-append corpus the delta is small, but the lane should price the refresh, not imply one-shot preprocessing.

**Severity: NOTE.** Repair: state that Piano preprocessing amortizes only against the mutation rate of the queried slice; hint refresh is periodic re-streaming of (at least) the changed shard; sublinear online holds between refreshes.

### RF-4 — SUSPECTED→dismissed — is there a hidden freeze-sensitive index-shape issue the lane missed?

I tried to find a read-path capability that secretly needs frozen surface. **None found; the lane's NONE-NEW conclusion holds.** Checked: (a) PIR needs the DB rebuildable off-chain → RP-1 (bodies-in-state) + RP-2 (`allClaims/claimCount`), both already on the sheet — verified `allClaims(i)/claimCount()` is in the read-lens-spec §0 P8 ABI pin. (b) PIR/snapshots are *indifferent* to the B4 postings redesign because every PIR scheme surveyed **preprocesses its own index** off-chain — verified against the schemes cited (YPIR/SimplePIR/Respire/ChalametPIR/Piano all preprocess; none consumes the server's source layout). (c) The REJECT-guard (no read-side on-chain state, ever) is correctly motivated by the master confluence invariant and by read-permissionlessness. So RP-3's "kernel storage layout cannot foreclose PIR" is **correct**, and the lane neither missed a real freeze issue nor invented a fake one. **Dismissed** — this is a genuinely clean lane on freeze surface.

### Read-path — what survives (steelman)

- **The fee-metered growth bound: VERIFIED arithmetic.** 2×10⁹ records/TB × 25k gas = 5×10¹³ gas × (0.005–0.05 gwei) × $4000/ETH = **$1M–$10M/TB** — reproduced, correct. The structural claim ("EFS state cannot outgrow consumer hardware without someone burning millions/year") is sound and is the lane's best contribution. The 500 B/record average is hedged (VAL-heavy runs larger — line 66); directionally the dollar-meter argument holds regardless.
- **Verify-don't-trust makes read privacy cheap (§3.3): SOUND and the deepest synthesis in the corpus.** Self-authenticating envelopes + re-derivable IDs + recomputable slots + head/checkpoint freshness anchors mean *any* untrusted channel (torrent, mirror, PIR server) serves verifiable data; a hostile server can only omit/stale-serve, both detectable/graded, never forge. Correct, and correctly the opposite of the write path.
- **The RPC-provider-is-the-dominant-leak doctrine: SOUND and correctly prioritized.** The Infura IP+wallet-address collection is VERIFIED history; "any cryptography added while the logging default stays is theater" is the right first sentence. The API-key-through-a-relay-is-theater rule (§2.2.3) is the sharp catch that makes OHTTP-cleanliness real.
- **PIR numbers: VERIFIED** (YPIR 12.1 GB/s/core, 2.5 MB, 32 GB, no hint; Apple ships keyword PIR). Slot reads are genuinely near-ideal PIR shape (client-derivable keys, small fixed answers). The "PIR the pointer graph, snapshot/replicate the bytes" verdict is right.
- **Freeze conclusion: VERIFIED sufficient** (RF-4). RP-1 no-body-elision is correctly identified as a *second independent* load-bearing argument (late-joining replicas must rebuild from state post-EIP-4444) — a real contribution to the ceremony sheet.

**READ-PATH VERDICT: SOUND.** No finding above NOTE. Repairs are honesty-tightening: RF-1 (mark rung 2 dark-at-launch in the table, not just prose), RF-2 (cap q/s claim), RF-3 (price Piano hint refresh). The freeze analysis is clean and the growth-bound math is the pass's best quantitative result.

---

## Freeze-sensitive reservations

The lanes' reservation asks, audited for **sufficiency** (does shipping later actually work?) and **over-reservation** (does it pollute the frozen surface without a credible activation path?).

### Over-reservation to CUT/DOWNGRADE

**OR-1 — stealth R3 (scheme-tag registry as a ceremony ROW) → DOWNGRADE to Durable + a one-line namespace reservation.**
The lane rules R3 a ceremony ROW ("registry constant, same batch as the C3 KEM registry") but rules R4 (derivation-domain constant) **Durable** with the argument: *nothing kernel-side recomputes it; it is client-interop text, so it versions in the registry, not the ceremony.* **That exact argument applies to R3.** A stealth scheme tag is interpreted by SDKs/wallets scanning the feed and by clients reading the `stealthMeta` blob — **the kernel never recomputes or gates on it.** The scheme tags live *inside* a VAL blob under the R1 reserved row and *inside* the R2 announcement body encoding, both of which are Durable/registry-versioned. Even identity's own signature algoTags use **deferred minting** (the PQ tag is added when it exists), and C3's KEM registry is likewise extensible — so "same batch as C3" does not imply ceremony-frozen *values*. **What is actually now-or-never for R3 is only:** (a) that `stealthMeta` blobs and announcement bodies are **scheme-tagged** (a field position) — already covered by R1/R2's body shape; and (b) that the stealth-scheme namespace is **distinct** from the signature and KEM registries (the S1 category-error lesson) — one sentence, not a ceremony constant table. **Recommendation: fold R3 into R1/R2 as "scheme-tagged, in a distinct namespace" and make the tag *values* a Durable registry.** This removes a junk ceremony item by the lane's own R4 logic. (Confidence: high — this is an internal inconsistency, not a judgment call.)

**OR-2 — stealth R2 (genesis announce TAGDEF) → KEEP but downgrade the necessity claim; consider a Durable convention feed.**
Reserving one genesis manifest line is cheap, so I do not recommend cutting it outright. But per SF-4, the lane's "genesis is *required* for canonicality / strongest now-or-never" is **overstated** — Schelling feeds form by convention (ERC-5564's own announcer is a deployed convention). And per SF-1, a single *permanent* feed is the scan-DoS-maximizing choice; a **convention feed can be time-sharded/rotated** without ceremony pre-commitment, which the genesis-frozen `efs.well-known` member cannot (E12 membership is frozen). **Recommendation for James:** either (a) reserve R2 as the lane asks *and* reserve a **time-epoch field position** in the announcement body now so the feed can be incrementally scannable (SF-1 repair 2), or (b) decline R2 and let the canonical feed be a post-freeze blessed convention TAGDEF that is reshardable. Reserving is cheap; the necessity rhetoric should not drive the decision.

### Sufficiency — where the lanes' reservations HOLD (verified addable)

**Stealth R1 (`stealthMeta` PIN/VAL/ADDRESS-parent/card-1): SUFFICIENT.** Shipping needs: canonical location ✓ (row); PQ/ML-KEM entries later ✓ (scheme-tagged VAL blob, ML-KEM ~1.2 KB fits VAL ≤ 8192); rotation ✓ (supersession); KEL additive backing ✓ (ADDRESS-parent family). Mirrors C3 exactly. **Add to the row text:** silent-loss-on-wrong-identity-derivation note (meta-address poisoning residual), and per-persona guidance (a shared `stealthMeta` across public personas links them — the attack-privacy V3 lesson, which the lane already cites).

**Stealth R2 body encoding: SUFFICIENT** *if* the SF-1 time-bucket repair reserves an epoch field position now (otherwise incremental scanning is a Durable add that may not have a clean body position later — flag this as the one place R2's Durable-body claim could bite). Variable-length ephemeral field for PQ ✓.

**ZK reservations: SUFFICIENT and correctly minimal.**
- **R1-zk (ZK-inertness sentence):** log as **commentary on the master invariant** (ZF-3), not new surface. Sufficient (it is a prohibition).
- **R5-zk (key-privacy sentence in the KEM registry text):** NECESSARY and sufficient — without it a non-key-private KEM suite rebuilds the A1 recipient oracle one layer down. This is the same edit attack-privacy S1/F12 demands; **it rides the C3/E5 row text, so it must land in the ceremony batch that cuts those rows.** Confirmed real.
- **R2-zk/R3-zk/R4-zk (genesis ZK rows / envelope scheme byte / group-derivation domain): correctly REJECTED.** Verified: group roots/commitments are ordinary VAL claims under permissionless user key-TAGDEFs (no correctness-row argument — a wrong root fails *loudly* via proof rejection, unlike silent mis-encryption); nullifiers never belong on EFS (sibling/read-layer per R1); native group authorship rides the **already-reserved digest-shaped author space + peer-kernel mechanism** (verified against identity.md's frozen core — `ReservedAuthorShape` reserves the space, peer kernel can assign any admission predicate). Reserving a scheme byte or group-derivation domain now would be pre-committing shape for an unbuilt spec — the exact KEL-registry-address trap the design already rejected. **This lane's REJECTs are correct.**

**Read-path RP-1/RP-2 (bodies-in-state, spine enumeration): SUFFICIENT — CO-SIGN, do not re-mint.** Both already on the sheet. RF-4 verified they cover every ladder rung (replica/snapshot/PIR all rebuild from these + D5 recency beacon + C4 SHA-256, all reserved/minted). The read-path lane's **second independent argument for no-body-elision** (late-joining replicas post-4444) should be recorded on the refusal memo next to onchain-completeness's.

**Read-path RP-7 (REJECT-guard: no read-side on-chain state ever): KEEP as a standing REJECT.** Correctly motivated (read-receipts/reader-registration/query-metering would create the surveillance surface the lane exists to kill, and violate the master confluence invariant). Recording it so silence doesn't decide is correct discipline.

### Net freeze delta from the frontier lanes, after this red team

- **Stealth:** R1 row (KEEP) + R2 genesis line (KEEP, with an epoch field position added per SF-1, OR downgrade to convention per OR-2 — **James call**) + R3 **DOWNGRADED to Durable** (OR-1). Net ceremony surface: **one row + one manifest line (+ optional epoch field), NOT a third registry constant.**
- **ZK:** **zero new rows.** One invariant-commentary sentence (R1-zk) + one KEM-registry-text sentence (R5-zk, which rides the already-scheduled C3/E5 batch).
- **Read-path:** **zero new.** Co-sign RP-1/RP-2; keep the RP-7 REJECT-guard.

---

## Decisions for James

1. **Price the announced-stealth scan externality before blessing default-on (SF-1 + Decision 2 interaction).** A single permanent canonical announce feed means every scanner processes an ever-growing global feed forever, and an attacker pays ~$500 once to grief it permanently. Default-on minting maximizes both the anonymity set (good) and the scan/CRQC-retro-linkage surface (bad). Do you (a) keep the single genesis feed + default-on and accept the externality with the "prefer self-fleets, announcements are rare invites" doctrine, or (b) reserve a time-epoch field so the feed is incrementally scannable, or (c) make the feed a reshardable post-freeze convention instead of genesis? Recommend (b): cheap, preserves the anonymity-set argument, bounds steady-state scan cost.

2. **Cut or downgrade stealth R3 (OR-1).** The scheme-tag registry does not need to be a ceremony constant — by the lane's own R4 reasoning it is Durable client-interop text. Reserve only that stealth blobs are scheme-tagged in a distinct namespace. This is a clean removal of a junk ceremony item; recommend adopting it.

3. **Ratify the fleet-trust-is-client-config carve-out (SF-2).** Stealth-fleet trust must live in per-viewer local lens config and be explicitly exempt from LC2's "default lens must be published on EFS" rule; a shared workspace's *public* lens names only the container author, never the fleet. Without this ruling the flagship collaboration path leaks the fleet through the lens-disclosure law. One doctrine sentence; recommend adopting.

4. **Confirm the ZK reservation minimalism (zero new rows).** The frontier-zk lane asks for no genesis rows, correctly. The only freeze-batch edit is the one-sentence key-privacy requirement in the KEM registry text (R5-zk), which also serves attack-privacy S1. Everything else (native group authorship, proof-carrying admission) rides the already-reserved digest-author space + peer kernel. Recommend ratifying "ZK adds evidence, never rows."

5. **Accept the read-path NONE-NEW finding and record the second no-body-elision argument.** No new frozen surface for any read-privacy rung; the act required at the ceremony is *not deleting* bodies-in-state (RP-1) and spine enumeration (RP-2), plus keeping the no-read-side-state REJECT-guard. Recommend co-signing.

---

## Confidence

**VERIFIED (primary source read / arithmetic reproduced this pass):**
- ERC-5564 text: Final; view-tag = MSB of `s_h`, ~6× parse speedup, 128→124-bit margin, funding-wallet-MUST-NOT-be-connected, `p_stealth = p_spend + s_h` / `P_stealth = P_spend + S_h`, announcer at `0x55649E01B5Df198D18D95b5cc5051630cfD45564`.
- Fileverse `zk-granular-permissions`: dependencies `viem` / `@cloudflare/voprf-ts` / `@openzeppelin/merkle-tree` / `@fileverse/crypto` / `js-base64`; no circom/noir/snarkjs/verifier; acknowledgments = "inspired from… vOPRF R&D… on the semaphore protocol and zkemail." The lane's Fileverse-has-no-ZK correction is confirmed true.
- YPIR (eprint 2024/270): 12.1 GB/s/core, 2.5 MB total comm, 32 GB DB, no offline hint, 8× CT-audit reduction.
- Umbra paper (2308.01703): 48.5/25.8/65.7/52.6% deanonymization (mainnet/Polygon/Arbitrum/Optimism).
- Base ZKP benchmark: Groth16 347,665 gas, UltraHonk 2,396,575 gas (6–7×), Noir 5–50× faster proving.
- Semaphore ceremony completed 2024-07-13, 400+ participants (docs).
- ERC-5564 scan/spam externality is a known, acknowledged ecosystem problem; standard mitigations are prune/ignore/de-prioritize/`caller`-filter (which fight a permanent verify-don't-trust feed).
- Read-path arithmetic: $1M–$10M/TB fee-metered bound; 30 GB/12.1 = ~2.5 core-sec/query; 16-core aggregate ≈ 6.4 q/s at 30 GB — all reproduced.
- EFS-internal: `allClaims(i)/claimCount()` in read-lens-spec §0 P8; lens-disclosure LC1/LC2 (§1/§8); closed-but-Durable grade set (§2); `recovered == author` + address-shaped requirement (codex-envelope 18); digest-shaped `ReservedAuthorShape` (identity.md); OPAQUE legal in user charters / forbidden in reserved rows (codex-kinds K5); C3/E5/E6/D2/D3 shapes; master admission invariant.

**PLAUSIBLE (recalled or single-source; would not change verdicts if off 2–3×):**
- L2 gas $0.0005–$0.005/record (read-path lane's figure, taken as given for SF-1 economics); cloud pricing.
- ML-KEM-768 ephemeral ~1.2 KB (FIPS-203 recall); keccak vs SHA-256 in-circuit constraint ratio; Groth16 perfect-ZK ⇒ HNDL-safe (standard result).
- spartan-ecdsa ~8k constraints / browser-seconds, unaudited (repo-claimed).
- Piano/RotPIR static-DB preprocessing assumption (RF-3 rests on the general client-preprocessing-PIR property; I did not read the RotPIR 2026 paper body).

**Could not verify (named):**
- Whether any public Ethereum RPC offers OHTTP today (found none — supports RF-1's dark-at-launch reading; absence claim, weakly held).
- Exact steady-state q/s of a specific 16-core box at 30 GB (RF-2 is an aggregate-bandwidth estimate, not a benchmark).
- Whether Semaphore's publisher-independent scope is actually the intended anonymous-advisory configuration (ZF-1 is a spec-consistency reading of the lane's own §2.3+§2.5; I did not find an external spec resolving the multi-publisher-vs-dedup tension).
- Real EFS announce-feed size trajectories (SF-1's DoS magnitude scales with adoption; the asymmetry is structural regardless of the exact numbers).
