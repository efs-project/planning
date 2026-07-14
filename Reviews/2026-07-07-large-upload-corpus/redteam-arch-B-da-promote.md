# Red team — Architecture B (DA-transport + permanence promotion)

**Target:** `uploads/arch-B-da-promote.md`. **Method:** attacked against its own substrate — Architecture A (`native-manifest-chunk-submission.md`, which B reuses verbatim), the source thesis doc (`forward-compat-da.md`, which B grafts A onto), `auth-models-one-sig-many-chunks.md`, `ops-doctrine.md` (mortality invariant + censorship floor), `read-lens-spec`, `codex-*`. All gas figures are B's own UNMEASURED estimates unless noted.

**One-line verdict.** B is intellectually honest, never corrupts, and never lies at read time — its read-layer and promotion-lifecycle contributions are worth adopting. But its **central novel thesis — the blob DA-transport rail with later "ride-the-cost-curve" promotion — does not hold.** On every axis (durability, cost, portability, neutrality, failure-mode) the blob rail is **dominated** by the two options B itself keeps on the menu: A-direct-to-SSTORE2 and Arweave-mirror-at-upload. It also **breaks a fixed mission end** (self-submit floor / no trusted intermediary) for the blob rail specifically, and it **adds net-negative Etched surface** (`attestBlobPublication`). Not fatal to *safety*; fatal to the blob rail as a shippable v2 mechanism. **Recommendation: take B's read grades + promotion protocol + mirror audit, put them on A + Arweave-mirror, and drop the blob transport rail — reverting to A's already-correct posture (reserve tier-3-blob, ship the machinery only once blob bytes are made durable).**

---

## 0. The shared root (three of the "fatal" findings are one bug)

Everything downstream in B needs the blob bytes to be **(a) durable** and **(b) self-submittable by an ordinary user**. Blobs are **neither**: pruned at 4096 epochs ≈ 18 days, and postable only via a type-3 transaction that no 2026 stock wallet builds. Every property B advertises that requires durable or self-served bytes — permanence, "ride the cost curve," portability, the censorship/self-submit floor — fails at the blob tier. F1/F2/F3 below are three faces of this one root. I list them separately because the brief asks per-vector, but the fix is singular: **don't make an ephemeral, infra-gated buffer your transport rail.**

---

## 1. Does the blob rail earn its place? (the dominated-option proof) — **FATAL to the thesis**

B keeps three write strategies on the menu (§13): **A-direct-SSTORE2**, **Arweave-mirror-at-upload**, and its own new **blob→promote**. Compare blob→promote against the other two on the use cases B claims for it.

**Use case R2 "large media, cheapest upload" (B's headline niche):** B's *own recommended default* here is **mirror-at-upload (Arweave)**, which B says "sidesteps the [18-day] window entirely" (§5.3) — i.e. **does not use blobs.** So B's flagship use case is served by a path that routes around B's flagship mechanism.

**Use case "contract-readable on-chain bytes eventually, but cheap now":** the only genuinely-neutral durable tier is **state (SSTORE2)** — the A path. Blob→SSTORE2 vs A-direct-SSTORE2:
- Both must pay the ~258M-gas/MB SSTORE2 cost (B §11). Blob→promote pays that **plus** blob-transport cost on top. It is strictly *more* total gas for the identical end state.
- A-direct writes each chunk **into permanent state immediately**, with **no deadline** — resume is free and unbounded (A §5). Blob→promote must finish the durable promotion **within 18 days** or the un-promoted bytes evaporate.
- A-direct's partial progress is **durable** (chunks 0..k are in state forever). Blob→promote's partial progress is **ephemeral** (chunks 0..k are in blobs that vanish).

So for the on-chain-bytes case A-direct **dominates**: same or lower cost, no deadline, no vanishing, no blob infra.

**The "cheap transport hop" defense, killed by keccak-verify.** B's remaining justification is "blobs are the cheapest way to move bytes to a promoter." But the promoter **re-keccak-verifies every chunk against the author's signed `chunksRoot` regardless of transport** (B §3.2, §5.2). That makes the delivery channel **integrity-irrelevant**: handing the promoter bytes over plain HTTP (or the SDK holding them locally, the common case B admits in §3.1) is *exactly as safe* as a blob and needs no blob infra, no 18-day fuse, no KZG≠keccak gap. The mission's SDK boundary already puts fetch/resolution in the SDK — an off-chain byte channel is in-scope and free. **Blobs buy nothing over "any channel + keccak-verify."**

**B's strongest counter, quoted and rebutted.** `forward-compat-da` §10 (B's source) pre-empts "why not just Arweave/A" with three differentiators. All three fail *for B*:
1. *"Arweave is external trust."* True — which is why the only credibly-neutral durable tier is **state = the A path**. This *reinforces* the dominance: if you reject Arweave for trust, your target is SSTORE2 and blob→SSTORE2 loses to A-direct; if you accept Arweave, you don't need blobs. Either branch, blobs lose.
2. *"Blobs ride Ethereum's scaling curve."* The curve blobs ride is a **transport** curve (throughput/cost of moving bytes into an 18-day buffer), not a **permanence** curve. The bytes still evaporate. The curve that matters for permanence is the **state-cost** curve (EIP-7907 etc.), and **A and B ride that identically** — it is the SSTORE2 write cost, paid by promotion (B) or directly (A). The transport-curve benefit is the thing keccak-verify just made irrelevant.
3. *"Blobs give a censorship-resistant, no-added-trust, self-submittable cheap-upload path."* Three of the four adjectives are **false for B in 2026** (see F3 below): not self-submittable (no stock type-3 wallet), not more censorship-resistant (fewer, more-identifiable blob-capable submitters), and the fetch/rescue path is *not* no-added-trust (leans on blob-archive services). Only "cheap-upload" survives, and it is the dominated hop.

**Fix inside the architecture?** Only by deletion. Dropping the blob rail and keeping B's tier-agnostic contributions on A+Arweave *is* the fix — it is inside the design space but it removes B's reason to exist as a separate architecture. Notably this returns to **A's existing, more-correct posture**: A already *reserved* tier-3-blob and declined to ship it "until the precompiles/opcodes land" (A §4). A was right to wait; B ships it prematurely.

---

## 2. Permanence: the 18-day window vs the multi-year cost curve — **FATAL to the "bank now, ride down later" claim**

B's forward-compat pitch (§0, §5.2, §10.3): *"A file uploaded blob-cheap in 2026 can be promoted into L1 state in 2030 when it's affordable — same `chunksRoot`, same signature."* For that sentence to be true, **the bytes must still exist in 2030 to promote.** Blobs prune in **18 days.** So:

- To reach 2030, the bytes must first be promoted to a **durable** tier **within 18 days**, at **2026 prices**. There is no "wait for cheap" — the expensive durable write happens now or the bytes are gone.
- Once on a durable tier (Arweave/SSTORE2), the 2030 "promote to L1" step promotes **from that durable tier, not from blobs**, and you already paid for durable storage in 2026.

So the only cost-curve you can actually ride runs **between durable tiers** (Arweave-2026 → L1-2030), which **has nothing to do with blobs** — you'd ride it identically on an A+Arweave file. **Blobs are not a station on the cost curve you can wait at; they are an 18-day departure lounge.** B conflates "cheap first-hop transport" with "riding the durability cost curve." The forward-compat thesis — the doc's primary stated driver — is therefore **largely illusory** for anything whose bytes need to outlive 18 days.

**Timescale mismatch, stated once:** B's thesis needs a promotion horizon of **years/decades** (wait for state to get cheap). B's transport gives a promotion horizon of **18 days**. These are incompatible. The mismatch is not a tuning parameter — it is the difference between "availability" and "storage" that B's own §8 says is the whole game.

**Fix inside the architecture?** No. The window is a protocol constant (`MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS`); PeerDAS/danksharding explicitly do **not** change it (B §4.2). The only "fix" is a *durable* DA (EthStorage-style proof-of-storage), at which point you are no longer on blobs — you are on a mirror tier that A already supports.

*(State-expiry / The Purge — the other named permanence risk — is **not** a B-specific finding: it threatens A's SSTORE2 bytes-in-state identically, is future/unscheduled, and both designs hedge it the same way, via replication + resurrection witnesses. It is a wash between A and B and does not weigh against B. I flag it only to confirm it was checked and dismissed as non-differentiating.)*

---

## 3. Relayer abuse / censorship / self-submit floor — **FATAL for the blob rail's neutrality**

The mission fixes: *"cypherpunk (no trusted intermediaries; self-submit floor)."* `ops-doctrine` makes it doctrine: *"the mortality invariant is format-level — no signed byte ever names a submission channel; permissionless submission means a censor must stop every submitter."* B leans on this floor by name (§3, §9). It does not hold for the blob rail.

- **Self-submit requires infra ordinary users lack.** Posting a blob needs a **type-3 transaction** — KZG-committing the blob, building the sidecar, and a node/RPC that accepts type-3s. **No 2026 stock wallet does this.** B admits it twice (§9 floor row: "self-posting blobs needs a blob-capable wallet/node — a real UX gap"; §12.3). B's stated fallback is: *"self-commit + self-promote via SSTORE2/calldata directly (skipping the blob rail), which is the A path."* **So B's self-submit floor is not B — it is Architecture A.** The blob rail has no floor of its own; it is structurally infra-gated.
- **Censorship surface is *worse*, not better.** `ops-doctrine`'s floor works because *any* EOA can submit, so a censor must stop everyone. But the set of **blob-capable submitters** is small, specialized, and identifiable (block builders, a few relay services). A censor targeting the blob rail has *far fewer chokepoints* than one targeting A's any-EOA floor. The rail B calls "censorship-resistant" is **more** censorable at the submission layer than the thing it is layered over.
- **The fetch/rescue path adds trust.** Third-party promotion after any elapsed time depends on **fetching a blob by versioned hash**. Within 18 days consensus nodes serve recent blobs for sync; fetching an *arbitrary* historical blob by versioned hash is not a first-class p2p operation, so B leans on "EL sidecars / blob-archive services" (§3.1) — i.e. **trusted, off-chain, unguaranteed infrastructure** (blobscan et al.). That is exactly the trusted intermediary the mission refuses, smuggled into the rescue path.

**Self-pay is not one prompt, and the blob post is *always* delegated.** B's §9 self-pay rows admit it: EIP-5792 batching gives "~1 confirmation … **plus** the blob-carrying type-3 tx is a separate wrinkle … effectively 2 clicks + delegated blob posting." A 5792 batch carries **execution-gas calls**, not a type-3 blob tx — the blob post **cannot ride the batch** and is **always** handed to blob infra. So even a modern-wallet user **cannot fully self-serve the blob rail**; the blob post is a permanent delegation to a (business-trust) blob-capable party.

**Fix inside the architecture?** No — it is inherent to type-3 UX and blob p2p semantics in 2026. The honest statement B should make: *"the blob rail's self-submit floor is Architecture A; the blob rail itself requires trusted blob infrastructure."*

---

## 4. Deferred SILENT failure vs A's LOUD-at-upload cost — **SERIOUS** (gas economics + permanence)

B's own §8 names it: the blob-permanence trap "works in the demo" — the tx succeeds, reads fine for 18 days, "then — with no error, no event, no on-chain trace — the bytes are gone forever." B's defense is auto-promote-by-default + read grades. But **auto-promote still requires someone to pay B's own ~258M gas/MB (§11) within 18 days.** At mainnet gas that is ≈ **7.7 ETH per megabyte** (~$23k/MB at 30 gwei / $3k ETH — B's UNMEASURED gas figure, checked arithmetically) — a five-figure-USD-per-MB bill, due **within 18 days** or the bytes vanish. This is exactly the cost B tells you to *defer* to "the cheapest tier available then" (§5.2) — but the 18-day clock **denies you the wait for "then"** (F2): you pay near-full L1 price now, or you lose the bytes. B sold the user a "blob-cheap upload"; the permanence bill arrives silently, later, at full price, on a deadline.

Contrast A: the cost is **paid at upload, in full view**, and **partial progress is already permanent.** A file that stalls at chunk k on A is a durable BYTES-PARTIAL(k,n) that **anyone can finish anytime, forever, from any byte source**. A file that stalls on B is an **ephemeral** partial whose window is closing. **B converts A's loud, at-upload, fail-safe cost into a silent, deferred, fail-deadly one** — a regression on the "never a false present" spirit, dodged only if an out-of-scope funding mechanism (SDK auto-promote / bounty) actually fires. B routes "who pays" to SDK/economics (§5.3, §14 Q4) — so **the permanence B promises is only as real as an economics layer B does not provide.**

**Fix inside the architecture?** No — funding is explicitly out of scope, and the read grade (honest as it is) does not *prevent* the loss, it only *labels* it after the fuse blows.

---

## 5. Partial-upload griefing / chunk-withholding — **SERIOUS** (a permanent-PARTIAL that can never complete)

The proof games B inherits from A are genuinely closed: can't forge a chunk (second-preimage on `chunksRoot`), can't bind a wrong `n` (count-at-apex), huge `chunkCount` allocates zero state (sparse bitmap). **State-bloat griefing of the accumulator is bounded** — credit where due. But the blob rail opens a failure A does not have:

**Fractional withholding → permanent stranding.** A relayer posts blobs for chunks 0..k, **withholds** the blob(s) for chunks k+1..n (or simply dies after posting a prefix). The promoter promotes 0..k → **BYTES-PARTIAL(k,n)**. At t>18d the withheld blobs prune. Now the missing chunks' bytes exist **nowhere**: never in a durable tier, pruned from DA. The file is **permanently stuck at PARTIAL** — and unlike A, it **can never be completed**, because completion needs bytes no one has.

This needs **no malice**: even B's benign default (the author's own SDK posts blobs then auto-promotes) strands the file if the SDK is **interrupted between blob-post and durable-completion** — laptop closed, process killed, offline for a stretch — because the 18-day clock keeps running while the SDK is down. Malicious fractional withholding by a third-party relayer is merely the sharp-edged version. The kill combo is **B's own UX pitch**: "instant cheap upload, forget it, permanence lands minutes later." A user who took that pitch and **deleted the local copy** cannot re-supply the missing chunks. So a relayer withholding *one blob out of ten*, or dying mid-post, plus the "forget-it" UX, **permanently corrupts availability** in a way that is strictly worse than plain non-promotion (which at least yields a clean, re-suppliable BYTES-UNAVAILABLE). On A, the same dead-relayer leaves chunks 0..k **durable in state** and only k+1..n to re-supply — and there is no clock.

**Fix inside the architecture?** No — the mitigation is an SDK/ops discipline ("retain local bytes until promotion is confirmed complete"), which lives outside the Etched surface and directly contradicts the "forget-it" UX B markets.

---

## 6. Minimal-path vs permissionless-promotion — an internal contradiction — **SERIOUS** (relayer/censorship + permanence)

B wants two virtues that are **mutually exclusive per upload**:

- **§3.1 "minimal path (recommended)":** the blob tx "does **not** need to call the kernel at all," and the chunk↔blob mapping is carried **off-chain** by the SDK. Virtue claimed: *zero new Etched interaction for transport.*
- **§5.2 permissionless LOCKSS promotion:** *any* third party can fetch the blobs and promote. Virtue claimed: *no dependence on the original uploader.*

You cannot have both on the same upload. If the mapping is off-chain (minimal path), then **only the party holding that off-chain map can find the bytes** — a third-party rescuer does not know which versioned hashes belong to this `chunksRoot`. B's fix is to emit `attestBlobPublication`'s `BlobPublished` event (§3.3) so a rescuer can discover the mapping — but that is **an on-chain kernel call inside the blob tx**, which **negates the "minimal path adds no kernel interaction" virtue.** So per upload you pick: *minimal-but-not-third-party-promotable*, or *third-party-promotable-but-not-minimal.* B advertises both as simultaneous properties of the recommended path; they are not.

And even with the event, third-party rescue still needs the **trusted blob-archive fetch** of §3 above. So the "LOCKSS, anyone can promote" property — B's headline (§5.2, cited as the whole reason the carrier decision is priced on replication) — is, on the blob tier, either **off** (minimal path) or **trust-dependent** (archive infra). LOCKSS's premise is that copies are self-serving and cheap to make; a copy you can only make within 18 days via a specialized fetch of a specialized post is not that.

**Fix inside the architecture?** Partially — mandate the receipt event on every blob upload (giving up the "minimal, no-kernel-call" claim) and accept the archive-fetch trust. That is a real narrowing of B's advertised properties, not a clean fix.

---

## 7. The new Etched surface: `attestBlobPublication` is net-negative — **SERIOUS** (bug-blast-radius)

B's genuinely-new surface is one entrypoint. It is worse than useless.

- **It records an *unverified* binding.** `attestBlobPublication(chunksRoot, firstIndex, blobCount)` reads `blobhash(i)` from the current tx and asserts `chunksRoot ↔ these versioned hashes`. The EVM **cannot** check that the posted blobs actually contain `chunksRoot`'s bytes (KZG≠keccak — B §3.3, forward-compat §5). So the binding is **anyone-asserts-anything.**
- **It is a receipt-pollution grief vector, and it *cannot* be fixed by authenticating it.** `msg.sender` is not checked; anyone can call it with a **victim's** `chunksRoot` while posting **garbage blobs**, appending `(victimChunksRoot, garbage-vh)` to the opt-in `blobReceipts[victimChunksRoot]` (permanent SSTORE) **and** to the default event stream. A third-party promoter reading receipts to locate bytes must now **fetch-and-keccak-verify every polluting entry** before finding the real one (if any). The "accountability hook" becomes a **DoS amplifier for the rescue path**, and the opt-in SSTORE variant is **attacker-writable permanent state under a victim's key.** Crucially, you **cannot** author-bind the receipt to fix this: the versioned hashes do not exist until the blobs are posted, which is *after* the author signs, so binding `(chunksRoot, versioned-hashes)` to the author requires **a second author signature over the versioned hashes** — which would break B's headline one-signature claim (§9). So the receipt is *structurally condemned* to be unauthenticated, hence pollutable.
- **It cannot do the job it is justified by.** B introduces it for "promotion bounties/accountability" (§3.3, §9), then immediately concedes it proves "a blob with commitment C was included," **not** that the file's bytes are available (garbage-blob attack). So a bounty **cannot** key on the receipt — it must key on keccak-verified promotion success, which needs no receipt at all. The receipt proves the wrong thing for its only use case.

Beyond this one entrypoint, note B's blast radius is **A's entire Etched surface plus this** — B reuses `chunksRoot`/accumulator/`submitChunk`/`verifyChunk`/`storeId` wholesale and adds no independent check on them. **B is a strict superset of A's Etched risk**, for a rail that is dominated.

**Fix inside the architecture?** Yes, cleanly: **drop `attestBlobPublication` entirely.** If a publication receipt is ever wanted, keep it **off-chain** (a signed relayer log), where an unverified assertion belongs. B already lists the entrypoint as "droppable" — take that option. This is the one finding whose fix is fully inside the architecture and costless.

---

## 8. Cross-chain replication of a partial (blob-only) file — **SURVIVABLE but a mission-end dent**

Mission end: *"portable/substrate-independent — write once, anyone copies to any chain."* For a **promoted** file B delivers this well (identical `chunksRoot`, trustless re-proof — genuinely better than v1's unsigned-mirror binding). For a **blob-only** file it does not: on a new chain there are **no bytes** (blobs are per-consensus and pruned), so the replicated commitment resolves **BYTES-UNAVAILABLE on the target** — a portable pointer to nothing. To seed bytes on chain Y you must **have the bytes and upload them to Y**, which is just **A-on-Y** (or re-post blobs on Y via blob infra + re-pay). B concedes this (§10.2: "cross-chain seeding after the window is from a durable tier, not from blobs"). So the blob tier's bytes are **non-portable**; portability reaches the bytes only *after* a durable promotion — i.e. only for the parts of B that are not blob-specific.

**Fix inside the architecture?** N/A — it is honest and inherent; it just means the portability win belongs to the durable tiers (A/Arweave), not to blobs.

---

## 9. Does the "one signature" claim hold? — **SURVIVABLE overclaim; the count is genuinely 1 for authorization**

Credit: for **authorization**, one `eth_signTypedData_v4` over `{DATA, chunks-manifest-PIN, placement}` genuinely covers the whole lifecycle. The blob post and every promotion are `msg.sender`'s own txs, needing no author key (author-from-signature; proof-authenticated chunks). auth-models' "authoring prompts = number of signed roots = 1" holds. I do **not** find a hidden second *authorization*.

But the headline **"one signature authorizes the entire … lifecycle … including blob posting"** overreaches on two counts:
1. **"Authorizes blob posting" is vacuous.** Blob posting is **permissionless DA** — it needs *no* authorization from anyone, and the manifest signature grants none and *withholds* none (it cannot stop a malicious blob post either). The signature authorizes **attribution + integrity**, not the transport acts. Saying it "authorizes blob posting" dresses a no-op as a feature.
2. **"One prompt" is only literally true in the full-relay path.** By B's own §9 table, self-pay is **~2 interactions** (sign + batch-approve) **plus an always-delegated blob post** (type-3 can't ride a 5792 batch, §3 above). So "one prompt" is purchased with a **business-trust blob relayer**, and the moment you want to self-serve you drop to A. The honest headline: *"one signature for authorship; the blob rail's one-prompt UX requires a trusted blob-capable relayer."*

Minor related stitch: B cites auth-models' "`count` is uint32 → ~100 TB per envelope," but auth-models counts **chunks as envelope records** (one big record tree), whereas B/A put chunks in a **separate `chunksRoot` tree** and keep the envelope tiny. The size bound instead comes from the manifest's `chunkCount` (uint32) — same order, but B is stitching two different substrate structures and should cite its own.

**Fix inside the architecture?** Yes — reword the claim. Cheap, cosmetic.

---

## 10. Also noted (SURVIVABLE)

- **tier-unbound (`storageTier = 0xFF`).** A binds tier into `storeId` so the file's store is author-committed and front-run-proof (A §3.1). B leaves tier unbound at signing (§2.3), so a file has **multiple valid storeIds** (one per tier the promoter picks) and the manifest pins none. Consequences: (a) a resolver must **scan tiers** to grade byte-availability — new surface for a **false BYTES-UNAVAILABLE** if it misses a tier; (b) B depends on **A's frozen manifest validation *accepting* `0xFF`** on the **irreversible** surface. If A freezes `storageTier ∈ {0,1,2,3-reserved}` with canonical-payload rejection of unknown values (A's "any trailing byte rejects" discipline), B's `0xFF` is **rejected** and B is DOA on the shared row. B flags this as an open synthesis item (§2.3, §14 Q1) — so acknowledged, but it is a **freeze-ordering hazard on the Etched surface**, not a free reconciliation.
- **B is heavier than either parent.** B = `forward-compat-da`'s promote thesis (which used a *single* one-level `contentHash`, lighter) **+ A's entire two-level accumulator** **+ a new entrypoint**. It is the **most** Etched-surface expression of an already-careful source doc, spent on the dominated rail. The synthesis should prefer the lighter expressions.

---

## 11. What B gets right (keep these — they are tier-agnostic and survive dropping blobs)

- **The read grades.** EPHEMERAL-BYTES currency flag, BYTES-PARTIAL(k,n) and chunk-granular BYTES-UNAVAILABLE, 206-for-partial serving. These **refuse the permanence trap at read time** and never serve a false present/absent. They are inherited from `forward-compat-da` §4.1 and are **transport-independent** — they belong on A+Arweave regardless of whether blobs exist.
- **The promotion lifecycle as a pattern.** Permissionless, keccak-verified-against-the-signed-root, resumable via A's bitmap, LOCKSS-shaped. This is A's accumulator + "fetch from any source, verify, re-submit." It is valuable **and works with an off-chain byte channel or a mirror as the source** — it does not need blobs.
- **The mirror-liveness audit** (challenge a random chunk vs `chunksRoot`, Filecoin-PDP-style, as a read-lens confidence signal). Genuinely nice; keep.
- **Intellectual honesty.** B flags its own #1 risk and most of the above weaknesses. This red team largely **follows B's own caveats to their conclusion** — which is precisely why the conclusion is that the blob rail should not ship.

---

## 12. Recommendation to synthesis

1. **Adopt** B's read grades (EPHEMERAL-BYTES, BYTES-PARTIAL(k,n), chunk-granular BYTES-UNAVAILABLE, 206-serving) and the mirror-liveness audit into the read-lens layer, on top of **Architecture A + Arweave-mirror-at-upload**.
2. **Adopt** the promotion-lifecycle framing (permissionless, keccak-verified, resumable) as an **SDK pattern over any byte source** — off-chain channel, mirror, or a *future* durable DA — **not** blobs.
3. **Drop the blob transport rail** from v2. Revert to **A's existing posture**: reserve tier-3-blob, ship the machinery **only** once blob bytes are made durable (EthStorage-style proof-of-storage, or a protocol change to retention). A was right to wait.
4. **Drop `attestBlobPublication`.** If a publication receipt is ever wanted, keep it off-chain; on-chain it is an unverified-assertion grief surface.
5. If James specifically wants the blob rail anyway (e.g. an EthStorage integration where the "blob" is durable-by-proof), then it is **a mirror tier, not a transport-to-nowhere**, and the 18-day fuse / self-submit-floor / dominance findings above dissolve — because it is no longer a blob, it is a durable mirror A already supports.

**Net:** B's *lens* (permanence = commitment; bytes = graded, promotable, honestly-labeled) is the right mental model and should govern the synthesis. B's *mechanism* (blobs as the transport rail) is the wrong instrument for that lens, dominated by options B keeps on its own menu, and it breaks the self-submit-floor mission end. Keep the lens; drop the rail.
