# RED TEAM — Architecture C (Thin Kernel + Authorization Layer)

**Role:** adversary. Target = `uploads/arch-C-thin-kernel-auth.md`. Mandate: destroy it, or fail to and say what survives.
**Method:** read arch-C against the settled substrate (`codex-envelope`, `codex-kernel`, `codex-kinds`, `read-lens-spec`), the composability research, the sibling `auth-models` doc it claims parity with, and v1 `contracts/specs` (SSTORE2/`EFSBytesStore`/EIP-7617). Every gas figure below is **`[UNMEASURED]`**; where I correct arch-C's numbers I say by how much and why.

**One-line verdict.** The *architecture* is buildable and several of its instincts are correct (bytes off the enumeration spine; forgery-impossibility; author-death survivability). But the *document's central thesis* — "thin is **more permanent** and **more fixable** because it freezes less" — is **false as argued**, and two headline claims (**"one signature,"** **"from-state-alone reconstruction holds"**) do not survive contact. arch-C does not add zero frozen surface; it **relocates a frozen crypto surface (the chunk-Merkle construction) from Etched to a *weaker-change-controlled* tier and mislabels it "forever fixable,"** and it makes the permanent read path depend on a store-code version it never commits. Net: the comparative case for C over a fat kernel **collapses to a kernel-LoC argument**, which is real but far smaller than advertised.

---

## 0. Severity legend & scorecard

- **FATAL** = destroys a claim the doc is built on / breaks a mission-end as written. (None force abandoning the *architecture*; two destroy the *thesis* and are freeze-blocking.)
- **SERIOUS** = headline overclaim or a real defect that must be fixed before freeze; fix may or may not be inside the architecture.
- **SURVIVABLE** = wording/overclaim or an inherent cost shared with all designs; correctness holds.

| # | Finding | Named vector | Severity | Fix inside arch? |
|---|---|---|---|---|
| F1 | Chunk-Merkle construction is **de-facto Etched** (frozen on first signature); "Durable, forever fixable" is a category error that guts the thesis | Etched blast-radius | **FATAL (thesis)** | Yes — but the fix *removes C's claimed advantage* |
| F2 | **From-state reconstruction is underdetermined**: `storeAddr = CREATE2(factory, chunksRoot)` needs a store-**initcode version** that is never in the signed commitment | Permanence | **FATAL (§10 claim)** | Yes — but the honest fix couples commitment to transport, contradicting the thesis |
| S1 | **"One signature" hides a second prompt** in the only self-funded-unattended rail (session-key grant = 2 prompts); relayer "1 sig / 0 gas" only holds if a **third party pays** | One-signature | **SERIOUS** | No (floor is 2 for self-funded; funding is exogenous) |
| S2 | **Completeness is not on-chain-verifiable** for large files: `complete` reduces to *trust the store codehash* or pay **O(n)** gas; the real R1 concession is bigger than "tiny pure verifier" | Chunk/proof games | **SERIOUS** | Partial — bounded to large-file GATE gating |
| S3 | **Funding, not authorization, is the hard part.** One sig solves *who's allowed*; nothing solves *who pays ~260M gas/MB*. Default outcome of an unfunded large upload is a permanent GATE-broken PARTIAL | Gas economics | **SERIOUS (framing)** | No (economics, punted) |
| S4 | **Blob tier is not archival**: no promoter ⇒ bytes evaporate at ~18d; "committed now, in-state after promote" elides "promote = maybe never" | Permanence | **SERIOUS (claim)** | Correctness yes; permanence no |
| S5 | **Verifier plurality**: "anyone deploys the blessed instance / inline ~20 lines / no single Etched verifier" — link-the-wrong-lib accepts forged chunks; a *worse* shape than one kernel verifier for naive R1 consumers | Etched blast-radius | **SERIOUS** | Partial (codehash Schelling) |
| M1 | **"Always completable by anyone from the signed root" is an overclaim** — completable only by someone who *has the bytes*; a sole-holder withholder permanently strands the file | Chunk-withholding / partial-grief | **MEDIUM** | No (a DA problem, punted) |
| M2 | **Byte-layer self-submit floor has an unflagged precondition** the kernel-native floor lacks: a **canonical store must already exist** on the chain (bytes go to `store.put`, not the always-present Etched kernel) | Relayer/self-submit floor | **MEDIUM** | Yes (genesis-deploy factory) |
| M3 | **Per-chunk index registration (~22k SSTORE) does not dedup** across differing files; "instant complete with zero byte-txs" holds only for an **identical** `chunksRoot`; "no bitmap needed" conflates content-dedup with index-presence | Partial-grief / state bloat | **MEDIUM (accounting)** | Yes (honest restatement) |
| M4 | **Relayer partial-completion grief**: upload n−1, withhold 1 ⇒ forces user onto self-submit for exactly the censored chunk(s) | Relayer censorship | **MEDIUM** | Yes (store.missing) |
| L1 | **Manifest-replay namespace pollution**: replay a popular author's signed manifest across N chains, each shows "their file, bytes pending forever" | Cross-chain partial | **LOW (inherent)** | Inherent to permissionless replication |
| L2 | **Streaming/unbounded input** silently breaks "one signature for any file" (can't pre-hash the root); arch-C omits the caveat the sibling doc flags | One-signature | **LOW/omission** | Out of scope (per-envelope sig) |

---

## 1. FATAL-to-thesis findings

### F1 — The chunk-Merkle construction is **de-facto Etched**; "Durable, forever fixable" is the doc's load-bearing lie

arch-C's whole reason to exist (§0 thesis, §13 headline, §14 verdict) is: *freeze only the commitment; keep the byte-plumbing liquid so it rides the scaling curve.* §2.2 files the chunk-Merkle construction under **Durable** and calls its verifier **"a redeployable library, forever fixable, not Etched."** §15 residual #4 softens it to "a Durable-but-painful mistake."

This is a **category error**, and it is the hinge of the entire document:

1. **The commitment *is* the chunk-Merkle root.** The thesis says "freeze the commitment." The commitment is `chunksRoot`, which is *defined by* the construction (`leaf_i`, `fold`, apex, count-bind). **You cannot freeze the commitment without freezing the construction** — they are the same object. So the claim "we freeze only the commitment, the construction stays liquid" is self-contradictory.

2. **The construction is irreversibly frozen the instant the first author signs a root under it.** The author's one `eth_signTypedData_v4` is over an envelope whose `chunks` value contains `chunksRoot`. That signature is immutable. A construction change re-derives a *different* `chunksRoot` from the same bytes ⇒ the old signature no longer matches ⇒ **every already-signed file breaks**, and a **dead author cannot re-sign** (owned-kind identity binds the author; the whole point of the 100-year archive is that authors go away). So a *construction/spec* bug is **exactly as unfixable as an Etched bug** — in both thin and fat designs.

3. **What is actually fixable is only the verifier *implementation*, not the construction.** §2.2 conflates the two. If a deployed verifier lib has an impl bug (doesn't match spec), C can redeploy it — a genuine but *narrow* advantage. If the **spec** has a bug (e.g., the fold rule admits two chunk-sequences to one root), redeploying the verifier does nothing; the signatures already committed to the broken root. Fat kernels share this exact exposure. So "forever fixable" is true for impl bugs and **false for construction bugs**, and the doc sells the broad version.

4. **Moving it to Durable makes it *less* controlled, not safer.** Etched artifacts get the non-negotiable external-review freeze gate (`codex-envelope` verification-gates section; `freeze-gates` B). Durable specs (`read-lens-spec` header) are *"versioned + amendable with compat discipline."* For a **content-address that must never change**, "amendable with compat discipline" is a *downgrade* in change-control versus Etched immutability. arch-C has taken the one surface that most needs Etched-grade freeze rigor and put it in the tier explicitly designed to be amendable.

5. **Consequence for the comparison table (§14).** The row "Permanence bet: C = keccak+ecrecover+extcodecopy+frozen construction; A = same + the frozen chunk subsystem must also survive 100 years" is **fake parity dressed as a C win**. Both freeze the same construction for 100 years. C's only real delta is *where the verifier code lives* (redeployable lib vs kernel), which buys impl-hotfixability at the cost of **verifier plurality** (S5). The "minimum irreversible surface" headline is therefore **not supported by the doc's own mechanics**: C's irreversible *crypto* surface equals A's; C's irreversible *kernel* surface is smaller. That's a real but much narrower claim than "thin is more permanent."

**Severity:** FATAL to the thesis (the doc's comparative recommendation does not follow from its mechanics). **Not** fatal to the architecture: the construction can simply be frozen with the same golden-vector + Solidity↔TS differential-fuzz rigor as the envelope Merkle rules (§15 #4 gestures at this). But once you do that, **C stops being "zero frozen crypto surface"** and becomes "the same frozen crypto surface, in a weaker-controlled tier, plus a smaller kernel." James should see that honestly stated.

*Break-my-own-attack:* is the construction *really* as frozen as Etched? Could a future file just adopt a v2 construction (`efs.file.chunkleaf.v2`) while old files keep v1? Yes — **new** files can migrate. But that doesn't rescue the thesis: it means the construction is a *versioned frozen surface* (v1 permanent for all v1-signed files, forever), which is exactly what "Etched with a version tag" is. Per-version immutability is immutability. The thesis needs "liquid," and per-file-frozen-forever is not liquid.

### F2 — From-state-alone reconstruction is **underdetermined**: the store-initcode version is load-bearing and uncommitted

§10 pledges the mission-critical property: *"From-state-alone reconstruction holds… decode `chunks` → `chunksRoot`/`chunkCount` → `storeAddr = CREATE2(factory, chunksRoot)` → read `chunkAddr(0..n-1)` → extcodecopy → reassemble → re-derive and verify. No event dependence on the permanent read path."* §4.1 makes `storeAddr` derivation the *trustless* anchor and demotes the signed `mirrors` value to "a redundant discovery hint, not a trust anchor."

The derivation is `storeAddr = CREATE2(FILE_STORE_FACTORY, salt=chunksRoot, init=FILE_STORE_INITCODE)`. For a *fixed* address you need a *fixed* `FILE_STORE_INITCODE`. But §4/§4.2/§11 **require the store code to evolve** ("the store packs bigger physical chunks" post-EIP-7907; "physical packing is store code"; "adding a blob tier later is a new store"). Evolving store code ⇒ **different initcode ⇒ different `storeAddr` for the same `chunksRoot`.** Therefore, over a century with multiple store versions:

- A from-state reconstructor holding only the manifest (`chunksRoot`, `chunkCount`, `chunkSize`, `totalSize`, `codec` — **no store-version field**) **cannot deterministically derive `storeAddr`.** It must *guess-and-check* every historical initcode it happens to know, and it **fails** for any store version outside its catalog (a version deployed after its knowledge cutoff, or a niche third-party store). That is not "from-state-alone"; it's "from-state-plus-an-out-of-band-registry-of-all-store-initcodes-ever."
- The robust path — read `storeAddr` from the **in-state, author-signed `mirrors` value** — *does* work from state alone (the manifest's `mirrors` claim is in the spine). **But arch-C explicitly demotes `mirrors` to a non-authoritative hint** and names re-derivation as the permanent read path. The doc has demoted the one mechanism that actually satisfies its own pledge.

This is a direct collision between two of arch-C's pillars: **forward-compat (§11: store code evolves) vs permanence (§10: single-formula re-derivation from state).** They cannot both be true with an uncommitted store version.

**Fixes, all inside the architecture, all with a cost the doc hides:**
- (a) **Commit `storeInitcodeHash` (or a store-version tag) in the signed `FileChunks`.** Restores determinism — but now the *frozen commitment* embeds a *transport detail*, directly violating the thesis ("the commitment is transport-independent," §0/§13). And it re-keys dedup to `(bytes, chunkSize, storeVersion)`, further shrinking the dedup claim.
- (b) **Name the in-state `mirrors` value as the authoritative reconstruction anchor** (undo the §4.1 demotion). Clean and cheap — but then §4.1's "front-run-proof, same on every chain, derivable before mining" trustless-binding narrative is doing *cross-chain* work only, and cross-chain same-address still needs store-version agreement (M-class).
- (c) **Forbid store-code evolution for the derivation** (one eternal canonical initcode). Kills §11's forward-compat headline.

Any of the three is freeze-blocking and each **costs a different pillar.** As written, §10's pledge is false.

**Severity:** FATAL to the §10 claim and to the "SOLID / 100-year reconstructible" mission-end *as written*. Fixable, but not for free and not without denting the thesis.

---

## 2. The eight named attack vectors

### (1) Partial-upload griefing — who bloats state, who strands an upload

**What's genuinely sound (credit):** bytes never become enumeration-spine claims. This is arch-C's best structural contribution and it is *correct* — the sibling `auth-models` doc, which encodes chunks as **envelope leaves**, would put N chunk claims (~22–27k gas each) into `allClaims` (~1.1B gas of spine for a 1 GB file `[UNMEASURED]`), swamping every from-state walk. arch-C's §1 diagnosis is right and its off-spine routing is the right call. Keep this.

**Attacks that land:**
- **Manifest spam (LOW).** A manifest is ~5 permanent spine claims for ~150–300k gas `[UNMEASURED]` and can advertise a *nominal* 1 TB file (`chunkCount` up to `uint32` ≈ 4.29e9) while supplying zero bytes. This bloats the spine, but no worse than any 5-record spam — it is **generic spine spam, not upload-specific**, and it is the same on the fat design. Not differential. The *read-side* corollary bites: any view that iterates `chunkCount` (`missing(0, n)`, `readFile`) over an attacker-chosen `n` is a DoS unless paginated. arch-C paginates (`maxScan`, `maxChunks`) — so LOW, inside.
- **Index-registration state is real and non-dedupable (MEDIUM — see M3).** Even *honestly completed* uploads deposit ~22k/chunk of permanent store state (the `chunkAddr(i)` map — confirmed by v1 `EFSBytesStore.chunkAddress(i)`). This is not grief, but it refutes the "content-addressing = no bookkeeping" elegance and it is state that persists forever.
- **Stranding (MEDIUM — see M1).** The party who can strand an upload is *whoever is the sole holder of a chunk's plaintext.* Content-addressing lets anyone *verify* bytes; it does not let anyone *produce* bytes they don't have. arch-C's "always completable by anyone from the same signed root" is an overclaim (M1).

**Verdict:** off-spine bytes = genuine win; "no third-party impact from partial uploads" holds for BYTES but the doc oversells completability and under-discloses per-chunk index state. Fix mostly inside (honest restatement); the sole-holder-withholding case is a DA problem the architecture punts.

### (2) Chunk-withholding + proof games

**Sound (credit):** forgery is genuinely impossible — content-addressed CREATE2 (`salt = keccak(chunkBytes)`) plus index-committed leaf verified against the signed root means a flipped byte either reverts `put` or lands at a different address; count-bind at the apex kills the CVE-2012-2459 duplicate-leaf / length-extension family and the OZ multiproof CVE is excluded by single-leaf-proofs-only. This is defensively designed. Front-running only *helps*. Racing relayers resolve to first-wins/no-op. All hold.

**Attacks that land:**
- **Completeness is not cheaply verifiable on-chain (SERIOUS — S2).** `readFile(...)` returns a `complete` bool **computed by the store**. To *not* trust it, an on-chain consumer must re-derive `chunksRoot` from all n reassembled chunks = **O(n) keccak+extcodecopy in one tx** — infeasible for large n. So "complete" reduces to **trusting the store codehash**. The fat kernel's `isComplete()` is Etched-guaranteed (it counted chunks at write-time admission). arch-C's §14 row concedes *direction* ("A's advantage") but not *magnitude*: the concession is not "a tiny pure verifier at read time," it is "**you cannot trustlessly gate on the completeness of a large file without O(n) gas or a codehash trust assumption.**" Bounded — large files aren't R1-composed anyway (they're human/R2 reads, per the composability research) — so the practical bite is small-to-medium files where O(n) is affordable. But the doc understates it.
- **Verify gas is understated (LOW).** `put` must `keccak256` the full ~24 KB chunk on-chain to form the leaf (~4.6k gas for the 768-word hash alone `[UNMEASURED]`) plus ~ceil(log2 n)≈16 node hashes; arch-C's "~4k gas/chunk verify" is low by ~2–3×. Immaterial next to the ~4.92M code-deposit, and flagged unmeasured anyway.
- **Non-canonical store lies about the index map (folds into S2/M-class).** A store that returns chunk j's address for query i makes a *complete* file read PARTIAL/CONTENT-MISMATCH. Defended **only** by the canonical codehash (CREATE2 binds code to the canonical address). Residual = the codehash Schelling assumption, which arch-C admits (§15) but which is the same trust the completeness bool leans on.

### (3) Relayer abuse / censorship + the self-submit floor

**Sound (credit):** because the kernel recovers author-from-signature and ignores `msg.sender` (`codex-envelope` adopted core; `codex-kernel` entrypoints), a relayer/burner **can never become the author** and its blast radius is **gas only** — value=0 byte-deploys, no authorship, no funds. This is inherited correctly from the envelope and it is real. Chunk-level censorship is genuinely weak for the attacker: content-addressed addresses mean a censor can only *not-include* a tx (routed around by any submitter), never forge or misplace.

**Attacks that land:**
- **The byte-layer self-submit floor has an extra precondition the doc never flags (MEDIUM — M2).** In the sibling `auth-models` model, the self-submit floor is *"user EOA sends register + N `submitOne` **kernel** txs"* — and the Etched kernel **always exists** on the chain. In arch-C, bytes go to **`store.put`**, i.e., to a **Durable store that must already be deployed** at the canonical CREATE2 address. If no canonical store exists on this chain yet, the floor first requires **deploying the store** (a Durable contract), and if the canonical factory/initcode isn't genesis-present the user must also obtain/deploy *that*. So arch-C's byte self-submit floor is **strictly weaker** than the kernel-native floor it claims parity with (§6: "identical to the auth-lens ranking"). Fix inside (genesis-deploy the factory like the kernel's own Codex chunks) — but it is an unflagged dependency and it means the §6 parity claim is not clean.
- **Partial-completion grief (MEDIUM — M4).** A relayer uploads 42,999/43,000 chunks and withholds one. The file is GATE-broken PARTIAL. `store.missing` tells the user *which* chunk — good — but the user must now self-submit exactly the censored chunk(s), which requires they **kept the bytes** and have gas. Recoverable, but the relayer successfully forced the punishing path for the specific content it wanted to suppress.
- **The floor is punishing for large files (LOW, inherent).** Self-submit of a 1 GB file on a legacy wallet ≈ thousands of confirmations. Same on every design.

### (4) Gas economics + who pays across N blocks (and if never funded)

**This is the vector arch-C is quietest about, and it is the actual hard problem.**

- **One signature solves authorization; it funds nothing (SERIOUS — S3).** arch-C's headline (§0, §6: "the N-transaction reality… is fully absorbed behind that single authorization") conflates *who is allowed* with *who pays*. For a real large on-chain file the physics is brutal: §12's own estimate is **~5.2–6.0M gas per 24 KB state chunk** and **~225–260M gas/MB** `[UNMEASURED]`. **No relayer eats that altruistically.** The "1 signature, 0 gas" relayer rail is real only when *a third party absorbs the whole cost*, and for large on-chain files that cost *is* the entire problem. The `auth-models` sibling is more honest here — its §9 names "who pays for a 100 GB upload" as "the weakest genuine point… an open economic question."
- **If never funded, the default outcome is a permanent GATE-broken file.** Because completion is permissionless-but-unfunded, an authorized-but-unpaid large upload sits at BYTES-PARTIAL forever. arch-C grades this *honestly* (no false "complete") — correctness is preserved — but the **mission goal** ("make large on-chain uploads *excellent*") is not met by an architecture whose default large-upload endpoint is "authorized, unaffordable, permanently partial." The architecture has **no escrow, no incentive, no completion bond** — funding is exogenous and unsolved.

**Severity:** SERIOUS as framing. Not differential vs the fat design (identical physics), and arch-C correctly punts economics — but the doc should not headline "excellent large uploads" when it has solved the *authorization* sub-problem and left the *funding* sub-problem (the binding constraint) untouched.

### (5) Permanence failure — blob pruning, state expiry, dead relayer mid-upload

- **Dead relayer / dead author (SOUND — credit).** Resume is a pure function of on-chain state (`store.missing`); any submitter continues; the signed manifest is self-submittable by anyone even after the author dies (msg.sender ignored). Genuinely robust. Keep it. *(Caveat: "continues" still needs someone with the bytes + gas — see S3/M1.)*
- **Blob tier is not archival (SERIOUS — S4).** §11's "blob-ingest → promote" markets "committed now, in-state after promote." If **no promoter runs within ~18 days**, the blob prunes, the bytes evaporate everywhere on-chain, and you are left with a **permanent commitment to bytes that no longer exist.** Nothing in the architecture *guarantees* promotion. arch-C grades a never-promoted blob file BYTES-UNAVAILABLE (correctness preserved — no silent loss), but "bank the commitment now, migrate the bytes up later" is a **permanence trap dressed as a cost saving**: for a 100-year archive, a blob-only file is worthless after 18 days. The doc should label the blob path **"fast provisional upload, NOT an archival tier,"** which it half-does in §10 but undercuts with the §11 forward-compat headline.
- **State expiry (SURVIVABLE — overclaim).** §10 asserts SSTORE2 bytes "sit in the permanent state set" and leans on EIP-4444 touching only history. True today. But **state expiry / statelessness is on the very roadmap §11 cites for scaling**, and it would evict cold SSTORE2 code exactly like a pruned blob. §10's "permanent state set" is overconfident. *However*, this is where arch-C's read-grade discipline quietly *wins*: an evicted-state file degrades to BYTES-PARTIAL and is re-suppliable from the signed root — arguably **more** robust than a fat design that assumes permanent state. So: wording overclaims, architecture degrades gracefully. Survivable, and the doc should *claim the graceful-degradation strength instead of the false permanence*.

### (6) Cross-chain replication — partial vs complete

- **Sound (credit):** the manifest re-verifies from the chain-free signature with no re-signing; a partial or complete file re-materializes by re-proving each chunk against the same root — trustless, a flipped byte fails, a lazy copier yields an honest PARTIAL. This is a real improvement over v1's unsigned attester mirror-claim.
- **Same-address portability is load-bearing on store-version agreement (MEDIUM).** §9 calls "same store code everywhere" a "Schelling convenience," but per F2 it is **load-bearing** for the same-`storeAddr`-on-every-chain property (and for `mirrors` values, which are chain-relative per `read-lens` infra demand #3). Undersold.
- **"Dedup travels" is an accounting overclaim (MEDIUM — M3).** Cross-chain, chunk **bytes** dedup (same `keccak(bytes)` → same address, skip the ~4.92M deposit) — real. But a new chain's store starts with an **empty index map**; every chunk still costs ~22k to register `chunkAddr(i)` even when the bytes pre-exist. "Instant complete with zero byte-txs" (§5 Dedup) is true **only for an identical `chunksRoot` already complete on that chain** — i.e., "the same file is already there," which is trivial. Files that merely *share chunks* pay full index registration.
- **Manifest-replay namespace pollution (LOW — L1).** Anyone can replay a popular author's signed manifest onto N chains and supply zero bytes; each chain then shows "Alice's file, bytes pending forever." Honest grade, no forgery, but it is namespace pollution attributable to Alice on chains she never touched. Inherent to permissionless replication (not upload-specific); worth a doc sentence.

### (7) The new Etched surface's bug-blast-radius

- **Kernel surface is genuinely ~zero (credit, accurate).** ≤1 opaque reserved-key row (dial B) or zero (dial A, user key-TAGDEF) — consistent with `codex-kinds` permissionless key-TAGDEF extension and the existing reserved-key table. The *kernel* accounting is honest.
- **But the frozen crypto surface is not zero (FATAL — F1 above).** The chunk-Merkle construction is a new frozen crypto surface, relocated (not eliminated) and mislabeled.
- **Verifier plurality is a new, worse-shaped blast radius (SERIOUS — S5).** §2.2/§8 invite consumers to "link the blessed instance" or "inline the ~20 lines," and §15 admits "no single Etched-blessed verifier." A fat kernel has **exactly one** verifier, reviewed at the Etched freeze gate. arch-C has **many** verifier instances of varying provenance. A consumer that links a **subtly-broken or malicious** verifier (deployed at a plausible address, or a bad inline copy) will **accept forged chunks** — a failure mode the single-kernel-verifier design *structurally cannot have*. For the unsophisticated R1 consumer (the exact audience of the "link a lib" ergonomics), this is plausibly **more** dangerous than a single audited Etched verifier, not less. arch-C frames read-time verification as strictly "the same verify-don't-trust posture as all EFS reads" — but EFS's other reads verify against **one Etched kernel**, not against a pluralistic lib ecosystem. The analogy is false.

### (8) Does "one signature" hold, or hide a second prompt?

**Holds** — in exactly one rail, with a hidden funder:
- **Relayer / faucet-burner:** genuinely 1 `signTypedData_v4`, 0 tx prompts — **iff a third party pays the gas.** For large on-chain files that "iff" is the whole cost (S3). So the claim is "one signature to *authorize*," true; "one signature to *complete a large on-chain file*," false unless someone funds ~260M gas/MB.

**Hides a second prompt** — in the only self-funded-unattended rail:
- **Session key (ERC-7715 on 7702):** arch-C's own §6 table reads *"1 grant, then 0/chunk (+ the 1 authoring sign)"* = **two prompts** (the permission grant *is* a signed authorization) plus a one-time 7702 upgrade. Confirmed irreducible by `auth-models` §2: **no ERC-1271, no delegated authoring pre-KEL**, so a hot key can *submit* but never *author*. Therefore the headline "one signature authorizes the entire multi-block upload" collapses to **two** the moment the user wants to self-fund unattended. The second prompt is disclosed in the table but contradicted by the headline. Not reducible below 2 in v2.

**Silently assumes bounded input (LOW — L2):**
- "One signature for any file up to ~100 TB" assumes you can **pre-compute the covering `chunksRoot` before signing.** For **streaming / unbounded input** (live capture, append-only log of unknown length) you cannot, so it is **not one signature** — it is per-envelope (a few) or KEL-era delegated authoring. The sibling `auth-models` §2/§9.1 flags this explicitly as "the single exception"; **arch-C omits it entirely.** A red-team-honest doc names its exceptions.

**No other hidden *user signature*:** a fresh destination path needs TAGDEF records, but they ride the *same* envelope under the *same* one signature (parents-first is within-batch by dependency order, `codex-kernel`) — so no extra prompt, though the "~5 records" manifest is really "~5 + path-depth TAGDEFs" for a new folder. The store-deploy is a tx, not a user prompt (relayable). So the honest answer: **one signature is real for authorization in the relayer rail; it is two for self-funded-unattended; and it presumes bounded, pre-hashable input.**

---

## 3. What is genuinely sound (do not "fix" these)

1. **Bytes off the enumeration spine.** Correct, and better than the chunks-as-leaves substrate of the sibling auth doc. This is C's real contribution.
2. **Forgery-impossibility of chunks.** Content-addressed CREATE2 + index-committed leaves + count-bind at the apex + single-leaf-proofs-only is a defensively-designed construction; the named Merkle CVEs are closed.
3. **Author-death & relayer-death survivability.** Manifest self-submittable by anyone post-death; resume is pure on-chain state. Robust.
4. **Relayer blast radius = gas only.** Correctly inherited from author-from-signature; the burner-as-cypherpunk-default is right.
5. **Graceful partial grading.** BYTES-PARTIAL(k,n) as a refinement of the existing BYTES-UNAVAILABLE flag is a clean read-lens addition; "complete ⟺ present==n with bound n, GATE fails closed" is the right discipline (modulo S2's caveat that a large-file consumer must trust the store codehash to *evaluate* it cheaply).
6. **Dial A/B honesty on the *kernel* row.** The ≤1-opaque-row kernel accounting is accurate.

A red team that pretends these don't hold would be lying; the destruction is aimed at the *thesis and the headlines*, which oversell a design whose actual, defensible pitch is narrower.

---

## 4. The honest re-statement arch-C should be forced to make

If C survives to synthesis, its claims must be re-cut to:

- **Not** "zero frozen surface / more permanent." **Instead:** "same frozen *crypto* surface as the fat design (the chunk-Merkle construction), relocated to a Durable-but-vector-frozen spec; **smaller frozen *kernel* surface** (≤1 opaque row vs a fat kernel's row + entrypoints + mappings + constants + tier enum)." The advantage is **kernel-LoC / EIP-170 budget**, full stop — real, but not "permanence."
- **Not** "from-state reconstruction holds by re-derivation." **Instead:** "reconstruction anchors on the **in-state signed `mirrors` value**; re-derivation is a same-chain convenience valid only within one store-initcode version." (Undo the §4.1 mirror demotion, or commit `storeInitcodeHash` and accept the thesis dent.)
- **Not** "one signature authorizes the entire upload." **Instead:** "one signature to **authorize** (relayer rail, third-party-funded); **two** for self-funded-unattended (session grant); **bounded input only**; and **funding the N-block gas is unsolved and exogenous.**"
- **Not** blob-ingest as a forward-compat permanence win. **Instead:** "blob = fast provisional availability; archival requires a promoter that may never run."
- **Add** the verifier-plurality risk (S5) and the byte-layer self-submit precondition (M2) to §15's residual list.

None of these kills the architecture. All of them shrink the marketing to what the mechanics support — which is the point of a red team.

---

## 5. Trying to break my own attacks (self-adversarial pass)

- **"F1 is pedantic — a versioned construction is fine."** Rebuttal held: per-version-frozen-forever *is* immutability; the thesis needs "liquid," and it doesn't have it for the commitment. The doc's own §14 permanence-parity row is the tell.
- **"F2 is solved by `mirrors`."** Partly — but the doc *demotes* `mirrors` and *names re-derivation* as the permanent path, so as-written the pledge is false; the fix is real but costs a pillar. If James says "mirrors is authoritative," F2 downgrades to SERIOUS (a §4.1/§10 re-cut), not FATAL. I flag that conditional explicitly.
- **"S2 completeness — large files aren't R1 anyway."** Conceded and incorporated: the practical bite is small/medium files where O(n) is cheap; it remains SERIOUS only because the doc *understates* it, not because it's catastrophic.
- **"S3 funding is out of scope, so it's unfair."** Not unfair to the *doc's framing*: the doc headlines "excellent large uploads" and "the N-tx reality is absorbed." Solving authorization while the binding constraint is funding is a scope sleight the doc invites by its own headline. The finding is against the *claim*, not the (legitimate) scope choice.
- **"Am I over-crediting the off-spine win?"** Checked against `auth-models` (chunks-as-leaves ⇒ N spine claims) and `codex-kernel` (allClaims append-only ~22–27k/record): the win is real and differential. Credit stands.

**Bottom line for the orchestrator:** No finding forces abandoning Architecture C. Two findings (F1, F2) **destroy the document's comparative thesis and its permanence pledge as written** and are freeze-blocking. The remaining SERIOUS findings are headline overclaims (one-signature, completeness, funding, blob-archival, verifier-plurality) that must be re-cut before C can be fairly weighed against the fat design. Weighed honestly, C's case reduces to **"a smaller Etched kernel at the cost of moving completeness-guarantees and one frozen crypto surface into a pluralistic, weaker-controlled read-time layer"** — a legitimate trade for a kernel at EIP-170's edge, but **not** the "more permanent, forever-fixable, one-signature" design the document advertises.
