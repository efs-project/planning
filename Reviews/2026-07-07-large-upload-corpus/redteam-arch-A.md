# Red team — Architecture A (Native Manifest + Proof-Streamed Bytes)

**Target:** `uploads/arch-A-manifest-native.md`
**Method:** attack the eight vectors the brief names; for each, severity + whether the fix is inside the architecture; then break my own red-team.
**Grounding read:** `codex-envelope`, `codex-kernel`, `codex-kinds`, `read-lens-spec`, `research-onchain-composability`, and arch-A's predecessor `native-manifest-chunk-submission.md`.
**Gas/latency numbers are order-of-magnitude, UNMEASURED, and price-dependent — flagged inline.**

---

## 0. Bottom line up front

The **crypto core is sound** and I could not break it. `chunksRoot`'s count-at-apex binding, single-leaf proof admission, the monotone bitmap accumulator, content-addressed dedup, and `n`-authentication-per-chunk all hold — because `submitChunk` reuses the envelope's already-red-teamed `verifyLeaf` primitive with disjoint domain constants. There is **no fatal flaw** in the mechanism.

The failures are elsewhere, and they cluster into one structural theme the document never states:

> **Arch-A decouples the byte pool from the record layer (separate `EFSBytes`, permissionless pool, no manifest side-effect, tier not committed) and presents every facet of that decoupling as pure upside. But decoupling discards, for bytes, the two properties the record kernel was carefully designed to provide: author-attribution and revocation. And the "one signature" that commits the *content identity* does not — cannot, under this design — commit the *permanence tier* or *guarantee completion*. For a permanence-first mission that markets "SOLID permanent on-chain bytes under one signature," these are not footnotes.**

Two entries in the doc's own §11 self-adversarial table are **factually wrong** (revocation "not served"; permissionless-pool spam "linear cost, no amplification" — misses content-liability and attribution). A "destroy it" review that finds the self-attack section contains false claims has found the softest spot in the armor.

Nothing here says "don't build arch-A." Most fixes are inside the architecture. But the headline oversells, several threat-table verdicts are wrong, and the recommended default configuration (permissionless pool, tier-not-committed) ships the sharpest problems.

---

## 1. Vector: partial-upload griefing (never-completed files bloating state; who can strand an upload)

### 1.1 The doc's claim, and where it breaks
§3.1 / §3.3 / §11: "sparse by construction… a manifest that lies about a huge count allocates **zero** state"; "Author never supplies bytes → harms only the author's own file, **zero third-party impact**."

The zero-allocation claim is **true** (mappings are sparse; `n` binds only from a valid chunk). The "zero third-party impact" claim is **false**, and the falseness matters for a permanence system.

**Attack 1a — guaranteed-useless permanent bloat.** A griefer submits chunks `0..k-1` of an `n`-chunk file to tier 0, then stops. Each chunk is a real `CREATE2` SSTORE2 deploy = permanent contract **code**. Post-EIP-6780 there is no `SELFDESTRUCT` for these (not same-tx-created), so the code is **unreclaimable forever**. The store never completes, so it is never served, never dedup-hit, never useful — it is pure dead weight that every full node and future validator carries for the life of the chain. The griefer pays linear gas once; the network pays storage in perpetuity. "No amplification" is true; "no third-party impact" is not — this is precisely the tragedy-of-the-commons state-growth that motivates state-rent proposals, now at **megabyte-per-store granularity** rather than the base kernel's ~KB record bodies.
- **Severity: survivable**, but the doc's explicit "zero third-party impact" wording is wrong and should be relabeled "bounded to linear attacker cost, but permanent and network-borne" (consistent with residual-weakness #1).
- **Fix inside?** No honest one that preserves the mission — reclamation/rent contradicts permanence. Truth-in-labeling is the only fix, and it is inside the doc.

**Attack 1b — "resume is free, anyone resumes" is only true for byte-holders.** §5.1 sells the bitmap as "the resumable session — global (a different relayer resumes an abandoned upload)." But resuming means submitting the *missing* chunks, whose bytes are by definition **not on-chain**. Anyone can read *present* chunks (tier 0/1 are in state); nobody can reconstruct *missing* bytes they do not possess. So a stalled upload whose original submitter held the only copy is **permanently stranded** — "global resumability" is global only among parties who already have the file. This directly undercuts the "sign once and forget" UX (§9): the safe operating procedure is "retain local bytes until you have personally verified `BYTES-COMPLETE@STATE`," which the headline discourages.
- **Severity: survivable** (inherent — you cannot resume bytes you lack), but it is an unstated precondition that contradicts the frictionless framing.
- **Fix inside?** SDK discipline only (retain bytes until verified complete). Inside, but it deletes the "forget" half of "sign and forget."

### 1.2 Who can strand an upload — the real answer
Nobody can strand via a forged `n` (count-at-apex defeats it — verified). Nobody can strand by front-running (content-addressed — verified). The stranding vectors that **do** work are all liveness/economics, not crypto: (a) the submitter defects with the last chunk (§2.2 below); (b) funding runs out mid-stream (§4.2 below); (c) censorship of the specific completing chunk on a floorless chain (§3.3). None have an in-architecture cure because the architecture provides **no completion bond, escrow, or incentive** — completion is unbacked liveness.

---

## 2. Vector: chunk-withholding + proof games

### 2.1 `submitChunkRun` — novel un-upgradeable consensus crypto for a single-digit-percent gain
§5.2 introduces a contiguous-run batch proof. The doc argues it is safe ("run internals recomputed from complete data; only a single ordinary path is attacker-supplied") and **names its own soundness fuzz as the #1 freeze obligation** (§5.2, §11, open-Q5). Read that admission back: arch-A adds **novel, Etched (permanent, un-upgradeable), consensus-critical Merkle-batch verification** — the exact code class of the OpenZeppelin multiproof CVE — and cannot yet prove it sound.

What does it buy? The doc's own estimate (§12): "for tier 0 the bytes dominate, so runs mainly save proof + tx overhead (**modest, ~5–15%**)." Tier 0 is the permanence default and the dominant-cost tier. So the design spends its single most dangerous permanent surface to shave 5–15% off the tier where bytes already dwarf proof overhead.

The interaction that makes me most nervous is **odd-node promotion × count-at-apex wrap**: a "power-of-two aligned run" is only a clean subtree if that alignment survives promotion at every level below where `boundaryProof` starts, for arbitrary non-power-of-two `n`. The doc relies on "a bad run just fails to reproduce `chunksRoot` and reverts" — which is the trap, not the defense (the CVE also "should have reverted").
- **Severity: serious.** Unproven, permanent, global crypto.
- **Fix inside? Yes, cleanly: drop `submitChunkRun`.** `submitChunk`/`submitChunks` reuse the envelope's already-fuzzed `verifyLeaf` and deliver every functional property (parallel, resumable, idempotent). The run path is a pure optimization; removing it eliminates *all* novel crypto in `EFSBytes` and collapses the blast radius (see §7). This is the highest-value single change in this review.

### 2.2 Withholding is "honest" but completion is unbonded — the sign-and-forget liveness hole
§6 grades a withheld file `BYTES-PARTIAL(n-1, n)` and calls it honest. It is honest; it is also **stranded**. Combine three doc properties: (i) the relayer is "liveness-only," (ii) the recommended default (§9) is "author signs once, hands bytes to a relayer, does nothing further," (iii) resume requires byte possession (§1.1b). A relayer that completes 99% and defects on the final chunk leaves a permanent `PARTIAL(n-1,n)`; if the author took the UX at its word and discarded local bytes, **the file is unrecoverable by anyone** and the author may never know (they signed and left). There is no bond, escrow, watchdog, or incentive to place the last chunk.
- **Severity: serious** for the UX/mission story (the headline "the file lands" has a liveness hole); survivable at protocol level *iff* bytes are retained.
- **Fix inside?** Partial: SDK must (a) retain bytes until `COMPLETE@STATE` is verified and (b) surface completion to the author. Guaranteed completion needs crypto-economics (completion bond / escrowed promoter bounty) that the arch explicitly defers as out-of-scope.

### 2.3 Proof-ratio floor's "non-final chunk" carve-out — checked, not exploitable
The anti-dust floor exempts the final chunk (which may be 1 byte). Only one index (`n-1`) qualifies per store and it must still prove against `chunksRoot`, so it cannot be used for cross-chunk dust amplification. **No finding** — correctly designed.

---

## 3. Vector: relayer abuse / censorship + the self-submit floor

### 3.1 The submitter — not the author — decides permanence (the tier is not in the signature)
This is the sharpest relayer-trust finding and it falls straight out of the doc's proudest departure from the discovery pass. §1 / §4.2: the manifest commits `chunksRoot` **but not tier**; `preferredTier` is "ADVISORY… NON-BINDING." Tier is "a pure submission-rail choice." Therefore the **submitter chooses where the bytes land**. An author who wants tier-0 in-state permanence, and hands `{signed manifest + bytes}` to a relayer, gets whatever tier the relayer picks — and the relayer's incentive is the **cheapest** tier (tier 2 calldata ≈ 44M gas/MB vs tier 0 ≈ 258M gas/MB, per §12). The file then reads `BYTES-COMPLETE@OFFCHAIN` (archival, EIP-4444-prunable) — **not** the `@STATE` permanence the author intended.

§11's threat table asks only *"can someone PREVENT a tier-0 fill?"* (answer: no) and omits the question that actually bites: *"can the author COMPEL a tier-0 fill with their one signature?"* — answer: **also no.** For a permanence-first mission this is the gap. "One signature authorizes the entire multi-block upload" is true for *authorization*; "one signature makes the permanent on-chain file exist" is **false** — permanence is delegated to a submitter's tier choice the author cannot bind or verify at sign time.
- **Severity: serious** (headline-vs-mission gap; the doc's own §4.1 commitment-durability-vs-bytes-durability split is the honest fine print, but the marketing outruns it).
- **Fix inside?** Only by reintroducing a tier commitment (e.g., a signed *minimum permanence tier* / "permanence floor") — which **kills the transparent-promotion feature the whole design is built around.** This is a genuine **trilemma: {one signature, transparent no-resign promotion, author-bound permanence} — pick two.** Arch-A silently picks the first two and sacrifices the third. The doc should state the trilemma, not hide it.

### 3.2 The self-submit "censorship floor" is economically aspirational for large files
§9 calls self-submit "the censorship floor: needs nobody." True for records and small files. For *large* files at the permanence tier it is a different animal: 1 GB tier-0 ≈ **~264 billion gas** (§12 × 1024), i.e. ~7,000+ L1 blocks — **roughly a day of monopolizing every block, realistically multi-day of block-sharing** — and on the order of **~1,000+ ETH at 5 gwei** `[UNMEASURED, price-dependent]`. The censored user — censored precisely because no friendly relayer will carry them — is the least able to self-fund thousands of deploy transactions. The floor is *technically* intact and *economically* out of reach at the scale the mission targets.
- **Severity: survivable** (inherent to on-chain bytes), but "needs nobody" must be qualified with "needs nobody but your own gas, which for large files is prohibitive."
- **Fix inside?** No — it is the physics of bytes-on-chain. Honest framing only.

### 3.3 Censoring the single completing chunk is cheaper than censoring a record
A record is all-or-nothing (drop the envelope). A file can be censored by dropping exactly one tx — the last chunk (`index n-1`, publicly known) — yielding a permanent `PARTIAL(n-1,n)` on a floorless venue. Multi-venue re-submission (the substrate's standing answer) applies.
- **Severity: survivable / inherited.** Fix is the substrate's force-inclusion + multi-venue broadcast, inside.

---

## 4. Vector: gas economics + who pays across N blocks (and if never funded)

### 4.1 The "one signature, zero gas from author" headline obscures an unsolved, large, unfunded bill
§9's default rail: author pays nothing; "a relayer or app-managed burner pays gas." The gas does not vanish — for 1 GB tier-0 it is ~264B gas / ~1,000+ ETH-order `[UNMEASURED]`. **The doc never says who pays that or why they would.** Its predecessor (`auth-models` §9.9) names this exactly: relayer/sponsor **economics** for large archival writes is "the weakest genuine point… an open economic question." Arch-A inherits that open question and the one-signature UX actively hides it from the person best positioned to care (the author feels it is free).

On devnet the "faucet-dripped burner" (the hackathon gasless path) **is** the funder — and per the user's own memory note (`efs-devnet-drain-accepted`), faucets are drainable by design. A single large-file upload is a *legitimate* faucet drain that can exhaust the gasless path for every other user. On mainnet there is no answer in this document.
- **Severity: serious** as an honesty/scope matter (not a mechanism flaw). The headline is true but incomplete; completion depends on that unnamed funding continuing across all N blocks.
- **Fix inside?** No — it is economics, deferred by design. The fix is to stop implying the problem is handled and to make the SDK surface the true cost to whoever authorizes/pays.

### 4.2 Cross-block funding fragility over a multi-hour-to-multi-day upload
A burner pre-signs N nonced txs and blasts. A 1 GB L1 tier-0 upload spans thousands of blocks / a day-plus. Over that window gas price volatility is large; a burner funded for 5 gwei stalls when gas spikes, blocking all later nonces (nonce-gap stall, per `auth-models` §5). Resume then requires a human operational event the "signed once and left" author never sees. "One signature covers a multi-block upload" is true; "one signature covers a *reliable* multi-day upload" is a liveness+funding assumption that grows more fragile the longer the file.
- **Severity: survivable-to-serious** (inherent to large on-chain files, but the doc underplays the *duration* — it cites "~7 L1 blocks per MB" without extrapolating that GB-scale is days).
- **Fix inside?** Partial: shard across M burners (the doc's own throughput answer) reduces per-account nonce risk but multiplies the funding-management surface. No clean cure.

### 4.3 The permanence tier and the affordability tier are in tension — and it lands the mission on L2s
The doc admits (§12) "large on-chain files are primarily an L2/L3 play; L1 the premium tier." Follow that to its conclusion: L1 gives the strongest 100-year permanence but cannot afford GB files; L2/L3 afford them but their **own** 100-year survival is far less certain than L1's (an L2 that stops posting or shuts down takes its SSTORE2 code with it unless reconstructable). So the mission's "bytes genuinely in state, permanent for 100+ years" for *large* files effectively requires committing to an L2/L3 whose century-scale permanence is unproven — the exact substrate-mortality the composability research warns about for *other* infrastructure.
- **Severity: serious** for the mission claim (permanence-first meets its hardest case — large files — on its weakest permanence substrate).
- **Fix inside?** No — intrinsic. The hedge (LOCKSS replication across chains) is real but is an unfunded perpetual re-upload obligation (§5.2).

---

## 5. Vector: permanence failure (blob pruning, state expiry, dead-relayer mid-upload)

### 5.1 From-state-alone reconstruction — the load-bearing kernel pledge — holds ONLY for tiers 0/1
The kernel's core promise is "from-state-alone reconstruction" (codex-kernel adopted-core; the reason the enumeration spine exists). Arch-A's §8 walks that reconstruction — but **only for tier 0** ("`chunkPtr[storeId][0..n-1]` → `extcodecopy` each → reassemble"). Now read the storage layout (§3.1): **tier 2 (calldata-published) persists *no bytes* — "bytes ride the `ChunkPublished` event"; tier 3 (blob) persists only a versioned hash.** Events and blobs are history/DA, explicitly **not** the permanent read path and EIP-4444/18-day-prunable. Therefore:

> For tier-2 and tier-3 files, from-state-alone reconstruction is **impossible**. The bytes are not in state.

Cross-reference §4.3: the economics push most large files *off* tier 0 (unaffordable at scale) onto tier 2. So the mission's "state-reconstructible 100-year archive" is delivered **only by the tier nobody can afford at scale**, and the cheap tier that large files will actually use silently fails the kernel's headline pledge. The grades (`@OFFCHAIN`/`@EPHEMERAL`) are honest per-file, but the *system-level pledge* is stated unconditionally and quietly holds only for tiers 0/1.
- **Severity: serious.** A load-bearing pledge with an unstated tier precondition.
- **Fix inside?** Yes, honestly: (a) restrict the reconstruction pledge to tiers 0/1 in writing, and (b) bias the SDK to tier 0/1 for anything claiming permanence. Both inside; neither closes the affordability tension.

### 5.2 Tier 3 blob pruning requires a timed, unfunded rescue or the data is lost
§4.3 is honest that blobs prune (~18 days) and "MUST be promoted." But promotion requires *someone* to (a) notice the 18-day clock, (b) fetch all n chunks before prune, (c) pay the tier-0/1 bill. Nobody is incentivized to. Behind the "sign once and leave" UX, a non-expert who lands on tier 3 has signed up for **silent total data loss unless an unfunded actor performs a timed rescue.** "The grade tells the truth" — but truth-telling does not preserve bytes. For a 100-year archive, offering a default-to-loss tier behind a frictionless UX is a footgun.
- **Severity: survivable** (tier 3 is reserved/unshipped; the doc never calls blob-only permanent).
- **Fix inside?** Yes: SDK must never default to tier 3 and must auto-schedule promotion when it is used. Inside.

### 5.3 State expiry ("The Purge") hits tier-0's large cold-code footprint hardest
§8 correctly notes EIP-4444 spares state/code and correctly defers state-expiry as "the only threat, hedge with replication, don't architect around it." Add one observation the doc omits: a future Verkle/statelessness state-expiry regime would expire *cold contract code*, and a 1 GB file is an enormous cold-code footprint — a prime expiry target whose resurrection proof scales with the expired data. Tier-0 large files are **differentially** exposed to state expiry vs the base kernel's small records.
- **Severity: survivable / inherited.** Fix (replication) is the substrate's, inside, but perpetual and unfunded.

---

## 6. Vector: cross-chain replication of a partial vs a complete file

### 6.1 Replicability depends on the SOURCE tier — tier-2/3 sources are byte-unreplicable
§8 sells "write once, anyone copies to any chain" and walks the tier-0 case (read each SSTORE2 pointer off the source, re-submit on target — trustless, correct). But a copier must **possess the bytes** to re-prove them on the target. If the source reads `COMPLETE` at **tier 2** (bytes only in the source's history/events) or **tier 3** (blob, possibly pruned), the copier may be **unable to fetch the bytes** — the manifest replicates fine (tiny, re-verifies from signature) but the file is **byte-unreplicable**. So a file that reads "complete" on a weak-tier source can be **impossible to copy forward**, contradicting the portability mission end. §8 states the portability claim unconditionally and only demonstrates the tier-0 path.
- **Severity: serious** for the portability claim; the substrate-independence end is fully delivered only for tier-0/1 sources.
- **Fix inside?** Honesty: state that trustless replication requires a source tier whose bytes remain fetchable (0/1, or 2/3 while their off-chain copies survive). Inside.

### 6.2 The `BYTES-*` flags do not actually carry the read-lens "currency" axis
§6 asserts the byte grades "compose onto the existing read-lens grade `(position-state | disposition, currency, flags)`." They do not carry **currency**. The read-lens currency machinery (HOME-LIVE / AS-OF(N) / UNKNOWN-CURRENCY, checkpoints, non-inclusion proofs, `authorHead`) is built on the **record kernel**. `EFSBytes` has **no checkpoint, no `authorHead`, no revocation, no currency surface** — `isComplete(storeId)` is a raw bool of foreign contract state. So a cross-chain reader asking "is this file complete on its home chain?" gets **no graded-currency answer** for bytes; `isComplete=false` cannot be distinguished as "incomplete everywhere" vs "incomplete *here*."

The mitigating truth (and why this is survivable, not serious): byte-completeness is **monotone and content-addressed**, so it is genuinely milder than revocable record currency — a present chunk is provably correct at any venue, and completeness only grows. The honest cross-chain answer is exactly the composability research's thesis: **replicate the bytes** (copy to the reader's chain, then it is a native read), not prove them. That is consistent — but the doc should *say* the flags are venue-local-monotone rather than implying checkpoint-bounded currency they do not have.
- **Severity: survivable.** Fix inside: restate precisely.

### 6.3 Truncation-across-chains defense holds
`complete ⟺ bound ∧ received==n`, `n` bound by `chunksRoot`, `isComplete` computed not claimed, `readFile` stops at first gap, GATE fails closed. A copier filling only `k<n` yields an honest foreign `PARTIAL(k,n)`. **Verified sound** — no finding.

---

## 7. Vector: the new Etched surface's bug-blast-radius

### 7.1 Separation is sold as blast-radius reduction; it is also blast-radius CONCENTRATION
§0.2 / §3 / residual-#2 frame the separate `EFSBytes` as pure risk *reduction*: "eliminates a cross-contract-reentrancy class," "independent freeze/review," "own EIP-170 budget." The reentrancy claim is **correct** (no write-time cross-calls; SSTORE2's CREATE2 init-stub makes no external call — verified). But the doc omits the other half of the ledger:

- **`EFSBytes` is a SINGLE GLOBAL contract holding EVERY file's bytes on the chain** — the doc explicitly moves *away* from v1's *per-file* `EFSBytesStore` ("contrast v1's per-file store"). v1 isolated a store bug to one file. Arch-A's global store means a soundness or storage-layout bug **poisons every file on the chain at once.**
- **It is Etched** (no proxy, no admin, byte-identical, un-upgradeable — same discipline as the kernel). A bug found in year 3 of a 100-year archive **cannot be patched**; the only recovery is deploy `EFSBytes-v2` and **re-upload every file's bytes** (re-paying all that gas) while every reader relearns a new canonical address.

So separation trades one blast-radius axis (cross-contract reentrancy — real, now removed) for another (single global un-upgradeable soundness-critical contract — new, now concentrated). Residual-#2/#3 reduce this to "two codehashes to verify," which **undercounts the stakes of a permanent global crypto surface.**
- **Severity: serious** (highest-stakes surface in the proposal, under-analyzed).
- **Fix inside? Yes, and it is the same fix as §2.1:** minimize novel surface — **drop `submitChunkRun`** so `EFSBytes` contains *no* novel crypto beyond a domain-retargeted, already-fuzzed `verifyLeaf`; keep the named independent external review; and reconsider whether the per-file-isolation that v1 had is worth re-adopting for the SSTORE2 tier specifically.

### 7.2 Reader-verification now spans two canonical artifacts
From-state reconstruction and codehash-verification now require knowing **two** canonical addresses + codehashes + frozen ERC-7201 layouts (kernel + `EFSBytes`). The doc admits this (residual-#2). It compounds §5.1: the reader must verify both artifacts *and* the reconstruction only works for tiers 0/1.
- **Severity: survivable / disclosed.** Fix: genesis vectors for both (named). Inside.

---

## 8. Vector: does "one signature" hold, or hide a second prompt?

### 8.1 For AUTHORIZATION: it holds. Verified.
The signed envelope `{DATA, chunks-PIN(manifest), placement-PIN}` is one `eth_signTypedData_v4`. Chunks carry **no signature** (proof-authenticated; `msg.sender` ignored). Envelope submission needs no author key (relayer). I traced every post-signature step and found **no hidden second signature** for a bounded file. The core authorization claim is real, and it is the design's genuine achievement. The streaming/unbounded-input exception (§9) is correctly flagged.

### 8.2 But "one signature" ≠ "one interaction" ≠ "the permanent file exists"
Three things the headline blurs, none of them a *signature* but all of them friction or unmet outcome the one signature does not cover:

1. **Permanence tier is not bound** (§3.1). Getting to tier-0 in-state permanence needs either expensive self-submit (§3.2) or a later **promotion** — and promotion, while signature-free, is a *second action* by *some* actor who may have to be the author and may have to fund it. §9's exception list names only "streaming input"; it omits "reaching permanence when your relayer chose a cheap tier." That is the hidden second interaction.
2. **`wallet_sendCalls` self-pay is not one prompt for large N.** §9's own row admits "very large N may need a few batch approvals or a session key… effectively ~2 clicks." The session-key row is "**1 grant + 1 sign**" = two up-front interactions. The *literally-one-prompt* experience exists **only** in the relayer and faucet-burner rails — both of which require a trusted or funded third party to eat the gas. Pure self-custody of a large file is one signature **plus many gas confirmations**.
3. **Completion is not guaranteed by the signature** (§2.2, §4.1) — it is guaranteed by liveness + funding the signature does not provide.

So: **one signature of consent, yes. "One signature and the permanent, complete, in-state file exists," no** — that outcome rides an uncontrolled tier choice, an unbonded liveness assumption, and an unfunded gas bill.
- **Severity: serious** as headline-vs-reality (the §9 table is mostly honest in its footnotes; the bolded headline and the doc's title framing oversell).
- **Fix inside?** Framing (state the three caveats beside the headline) + the §3.1 trilemma disclosure. Inside.

---

## 9. Two factually wrong entries in the doc's own §11 self-adversarial table

A "destroy it" pass should note where the self-attack is not just incomplete but **wrong**:

### 9.1 "Revoke manifest, bytes remain → bytes orphaned, **not served**" (line 435) is FALSE
§7 (line 364) defines `~store:<chunksRoot>` serving that resolves **directly** to `readFile` at the best tier — and states the native store "takes **top transport priority** over external mirrors when present and complete." That path takes `chunksRoot`/`storeId`; it **never consults the manifest slot.** Manifest revocation tombstones the *record-kernel slot*; it does nothing to `EFSBytes`. Therefore:

> A revoked file's bytes remain **fully served** via `~store:<chunksRoot>` — and are the *preferred* transport. Revocation is trivially bypassed by addressing the store directly.

Only the `~data:`/path form (which walks the manifest) honors revocation. This is an **internal contradiction** between §7 and §11, and it exposes the deeper problem: **there is no content-erasure primitive.** Bytes are permanent + content-addressed + directly addressable + decoupled from the revocable record layer. An author who uploads a secret/mistake/illegal-in-hindsight file and revokes the manifest has hidden the *pointer*, not the *content* — anyone with the `chunksRoot` (which is inside the signed manifest, replicated everywhere) reads and serves the bytes forever.
- **Severity: serious.** A stated security property ("not served") is false, and the erasure gap is real for a system explicitly built to host files.
- **Fix inside?** Only by gating `~store:` serving on ≥1 unrevoked manifest referencing the `chunksRoot` — which **reintroduces the record↔bytes coupling and breaks the permissionless-pool/pre-staging model.** Genuine tension; at minimum the doc must correct the claim and choose a side.

### 9.2 "Permissionless-pool byte spam → linear-cost, no amplification" (line 438) misses the two dimensions that matter
§3.3 makes the byte pool **permissionless**: anyone fills any `storeId` with proving bytes, **no manifest, no signature, no author.** The doc removed the discovery pass's `_openChunkStore` side-effect specifically to enable this (§0.3) — so arch-A is *more* exposed here than its own predecessor. The threat table considers only **gas-spam** and concludes "linear cost, no amplification." It omits:

- **Unattributed permanent inscription.** The record kernel attributes every body to a **recovered author** and supports **G-set revocation**. The byte pool has **neither.** Anyone can permanently inscribe **arbitrary bytes** (tier-0 SSTORE2 = permanent code) into the canonical `EFSBytes` on every EFS chain, associated with **no author** (`msg.sender` ignored; no signature) and **removable by no one** (Etched + monotone + content-addressed). This is the base-layer "arbitrary data inscription" abuse surface (CSAM, malware, leaked data, doxx) — **supercharged**: permanent *state* (not prunable calldata), content-addressed, and on a substrate marketed as a *filesystem*. (Caveat for honesty: the *transaction* still records a gas-payer in history, so it is not forensically anonymous — but that payer is a trivial burner, it is prunable history not state, and the **protocol** attributes the content to no one, which is the property that matters for liability and for the record layer's careful author-binding.)
- **No revocation** for that content (§9.1).

The record kernel spent real design effort on author-from-signature attribution and monotone revocation. `EFSBytes`'s permissionless pool **discards both** and the threat table does not notice.
- **Severity: serious** (the closest thing in this review to fatal for a *real-world deployment*; for credibly-neutral base-layer purposes it is arguably acceptable neutrality, so I do not rate it fatal — but the doc must reckon with it, not mislabel it as gas-spam).
- **Fix inside?** Yes but it reverses a headline recommendation: the `require(manifestOpened[storeId])` gate the doc **names and declines** (§3.3) would at least bind an author + revocable manifest before permanent tier-0 persistence. The doc recommends *against* it (to keep pre-staging/dedup). At minimum: gate the *permanent* tiers (0/1) on a referencing signed manifest while leaving ephemeral tiers open; that preserves dedup/pre-staging for cheap tiers and restores attribution+revocation for the permanent ones.

**Common root of 9.1 + 9.2:** decoupling the byte pool from the record layer buys pre-staging/dedup/promotion at the cost of **attribution and revocation for bytes.** The doc presents only the benefits.

---

## 10. Minor / survivable (real, mostly framing)

- **`chunkSize` C is baked into the signature and fragments the content-address space.** C is committed inside `chunksRoot` (repartitioning changes the root). The forward-compat lever "bigger C once EIP-7907 lands" (§4.3) means the *same bytes* at C=24KB vs C=64KB produce **different `chunksRoot`s → different stores → no dedup**, and a C larger than a chain's code limit **forecloses tier-0 there, permanently** (re-chunking = new signature = the thing being avoided). So the forward-compat lever **conflicts with the portability/dedup lever at C**; residual-#4 undersells it as a per-chain foreclosure. Fix inside: SDK pins C to the smallest code limit — which forgoes the EIP-7907 benefit for portable files. **Survivable.**
- **CONTENT-MISMATCH is only detectable after fetching + reassembling + decoding all n chunks.** `contentHash` is over the *decoded whole file*; a contract cannot decode gzip/zstd on-chain. So the R1 composability case (a contract gating on cheap `isComplete`) gets **byte-completeness but not content-validity** — "contract-readable file" means "readable bytes that might not decode to the committed content." Self-harm and detectable, but not as cheaply as §6/§11 imply. **Survivable.**
- **Read-lens is a Durable doc with a CLOSED grade vocabulary** ("a conforming reader MUST NOT invent grades"; §2 of read-lens-spec). Arch-A introduces six new flag values as a "refinement." That requires an actual **read-lens amendment** (Durable revision with vectors), not assertion. Process/coordination. **Survivable.**
- **"Committed" ≠ "stored" in UX.** §10 rightly says the file is "committed" after the envelope lands, "before any bytes arrive." A UI that tells a user "your file is committed!" may read as "stored." The commitment-durability/bytes-durability split (§4.1) is correct in the spec; the SDK must not let the word leak into user copy. **Minor.**

---

## 11. Breaking my own red-team (adversarial pass on the findings)

1. **"§1.1a bloat is no worse than any complete on-chain file."** Partly fair — a complete junk file bloats equally. The distinguishing claim I keep: partial stores are *guaranteed-useless* bloat (never served, never dedup-hit) and the doc's "zero third-party impact" is still literally false. I downgraded it to survivable accordingly. **Finding survives, softened.**
2. **"§3.1 tier-not-bound is defended by §4.1's commitment-vs-bytes-durability split."** The doc *does* make that distinction, which is its best defense — so I did **not** rate this fatal. But the split lives in fine print while the title and headline sell "permanent on-chain bytes under one signature," and §11 omits the "can the author compel tier-0" question entirely. The gap between fine print and headline is the finding. **Survives as serious framing/threat-analysis gap.**
3. **"§9.2 unattributed inscription is just Ethereum's neutrality; not arch-A's problem."** Strongest counter. For a *credibly-neutral base layer* permissionless inscription may be a feature, and the base chain already permits arbitrary calldata. That is exactly why I did **not** rate it fatal. What survives: (a) it is strictly worse than the record layer arch-A sits beside (permanent state vs prunable calldata; no author vs recovered author; no revocation vs G-set), and (b) the §11 table **mislabels** it as gas-spam. A red-team's job is to catch the mislabel. **Survives as serious, explicitly not fatal.**
4. **"§9.1 revocation-bypass — maybe `~store:` is *meant* to be raw content-addressed and only `~data:` respects revocation."** That is a coherent design choice — but then §11 line 435's "not served" is still wrong, and the doc must *say* "revocation hides the pointer, never the content; bytes are unretractable." As written it claims erasure it does not deliver. **Survives — it is a factual correction regardless of which side the doc picks.**
5. **"§5.1 reconstruction — tier 2/3 being non-state-reconstructible is obvious from the storage layout."** Obvious to a careful reader; but the *pledge* in §8 is stated unconditionally and only the tier-0 walk is shown, so a reader takes the pledge as system-wide. The finding is that the pledge needs an explicit tier precondition. **Survives.**
6. **"Drop `submitChunkRun` loses real throughput."** The doc's own number is ~5–15% on tier 0 where bytes dominate. Against a permanent, global, un-upgradeable, self-admittedly-unproven crypto surface, that trade is bad. If measurement later shows a large gain on tiers 2/3, revisit — but ship the frozen surface without it and add it later behind its own review if justified (additive, non-breaking). **Survives.**
7. **Did I overstate any gas number?** Yes-risk: the ~1,000 ETH / 264B-gas figures are order-of-magnitude, L1 cold-slot, price-dependent, and flagged `[UNMEASURED]`. They are used only to show *impracticality-at-GB-scale on L1*, which the doc itself concedes ("primarily an L2/L3 play"). The *direction* is not in dispute; I have flagged the magnitude as unmeasured. **Findings do not depend on the exact number.**
8. **Is there a fatal I am missing by being too charitable?** I re-examined `submitChunk` soundness (inherits fuzzed `verifyLeaf` — sound), the `bound` first-writer race (single-threaded, tier in storeId — sound), and count-at-apex (second-preimage-hard — sound). The only novel crypto is `submitChunkRun`, which is serious-but-droppable, not fatal. I am confident **there is no fatal crypto or mechanism flaw.** The serious findings are all framing, threat-mis-analysis, decoupling-cost, and unbonded-liveness — real, but fixable inside the architecture or honest to disclose.

---

## 12. Verdict on "is the fix inside the architecture?" (summary)

| # | Finding | Severity | Fix inside? |
|---|---|---|---|
| 3.1 | One signature does not bind permanence tier (trilemma hidden) | serious | Only by re-committing tier (kills promotion) — disclose the trilemma |
| 5.1 | From-state reconstruction holds only tiers 0/1 | serious | Yes — scope the pledge + SDK bias to 0/1 |
| 9.1 | Revocation bypassed for bytes; no erasure primitive (§11 false) | serious | Partial — gate `~store:` on unrevoked manifest (breaks permissionless) |
| 9.2 | Permissionless pool = unattributed permanent inscription (§11 mislabeled) | serious | Yes — manifest-gate the permanent tiers (reverses recommendation) |
| 2.1/7.1 | `submitChunkRun` novel un-upgradeable crypto for ~5–15%; global blast radius | serious | Yes, cleanly — drop `submitChunkRun` |
| 2.2 | Completion is unbonded liveness; sign-and-forget strands files | serious | Partial — SDK retains bytes; guarantee needs economics |
| 4.1 | "Zero gas from author" hides an unsolved large unfunded bill | serious | No — economics deferred; stop implying it is handled |
| 4.3 | Permanence tier vs affordability tier → mission lands on L2 permanence | serious | No — intrinsic; disclose |
| 6.1 | Tier-2/3 sources are byte-unreplicable | serious | Yes — scope the portability claim |
| 8.2 | "One signature" ≠ permanent complete file exists | serious | Yes — framing + trilemma disclosure |
| 1.1a | "Zero third-party impact" of abandoned partials is false | survivable | Yes — relabel |
| 3.2 | Self-submit floor economically out of reach for large files | survivable | No — physics; qualify framing |
| 6.2 | `BYTES-*` flags lack a currency axis | survivable | Yes — restate as venue-local monotone |
| 10 | C fragments content-address space; forward-compat vs portability conflict | survivable | Yes — SDK pins C (forgoes EIP-7907 gain) |
| 10 | CONTENT-MISMATCH detectable only after full reassembly | survivable | No — disclose R1 limit |
| 10 | Six new grades need a read-lens amendment | survivable | Yes — coordinate |

**No fatal findings.** The mechanism is sound. Ship it — but drop `submitChunkRun`, gate the permanent tiers on a signed manifest (restoring attribution + revocation for permanent bytes), scope the reconstruction and portability pledges to tiers 0/1 in writing, correct the two false §11 entries, and rewrite the headline so "one signature" advertises what it truly delivers (consent + content-identity + commitment-durability) and not what it does not (author-bound permanence, guaranteed completion, or a funded bill).
