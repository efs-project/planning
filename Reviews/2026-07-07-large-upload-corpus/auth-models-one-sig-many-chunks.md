# One authorization → N chunk-submission transactions

**Role:** map every way ONE user authorization covers the N transactions a large on-chain file upload MUST span, ranked by MetaMask reality. Storage tiers, read grades, and the envelope crypto are settled upstream; this doc designs the *write-authorization UX layer* on top of them.

**Ground truth consulted:** `codex-envelope.md` (adopted core + amendments), `envelope-replay-domain.md` (base: registration + `submitOne`, §5.2 idempotence, the submission ADR), `codex-kernel.md` (entrypoints, `submit`/`submitSubset`, author-from-signature), `carrier-decision.md` Q4 (the 1-sig portable-write ruling), `ops-doctrine.md` (relayer mortality invariant, censorship floor), `read-lens-spec.md` (partial-upload reads as graded states), `contracts/specs/overview.md` (v1 SSTORE2/`data:`/EIP-7617 reality: "~10+ txs" today).

> **All gas/latency numbers are estimates, flagged `[UNMEASURED]`. All wallet-version claims are as of a Jan-2026 knowledge cutoff and MUST be re-verified against the live wallet at ship time — wallets move fast on 5792/7702/7715.**

---

## 0. TL;DR — the reframing that collapses the problem

**The chunks are not separate authored records. They are leaves under ONE manifest Merkle root, and the author signs the root exactly once.** Therefore **no scheme in this document authorizes chunks.** Every scheme differs only on *who broadcasts the N gas-paying transactions and how many wallet prompts that costs.* Authorization and submission are two orthogonal axes:

| Axis | What it is | Cost in EFS v2 | Set by |
|---|---|---|---|
| **Authoring** (identity/consent) | "this content is mine" | **exactly 1** raw-ECDSA `eth_signTypedData_v4` over the envelope, **for any file up to ~100 TB** (see §2) | the envelope spec — *fixed, not a design variable* |
| **Submission** (gas + nonce + broadcast) | "these bytes land on chain" | 1 register tx + N chunk txs, **submitter = anyone** (`msg.sender` ignored) | the schemes (a)–(f) below — *the entire design space* |

The envelope makes this exact split load-bearing (`envelope-replay-domain.md`):
- **§3.7 / line 21:** *"`msg.sender` never appears in any authentication or identity path. The recovered-and-matched author word is the only identity input."*
- **line 279:** first contact registers the envelope, signature verified **once** (`ecrecover ≈ 3k`); **subsequent `submitOne` skips signature re-verification (proof-only, ≈ log₂N keccaks, < 10k gas/leaf).**
- **line 285:** an already-admitted envelope makes `submit` a no-op success, so "relayer races and LOCKSS resubmission [are] harmless and front-running someone's submission *beneficial* (their state lands, they didn't pay)."

So the ranked answer, up front:

1. **Literally ONE prompt on stock MetaMask today** = **author-from-signature relaying** (§a) or its trustless-local twin, a **faucet-dripped burner** (§e). User signs one typed-data manifest; a relayer/burner fires the register tx + all N chunk txs. Zero transaction prompts.
2. **As AA matures** = **ERC-7715 session key on a 7702-upgraded EOA** (§b+§d): one `wallet_grantPermissions`, then a local agent auto-submits N with no further prompts, scoped to kernel-submit-only + gas-capped + minutes-boxed. This removes the *relayer* from #1 without adding prompts.
3. **The irreducible floor** = **self-submit** (§ censorship floor): the user's own EOA sends 1 register + N chunk txs = **N+1 prompts** on stock MetaMask, needing nobody. Everything above is pure UX improvement over this floor and **none of them weakens it** — the signed manifest is always self-submittable by anyone, forever.

**`msg.sender`-ignoring is the whole game.** It means the envelope *is already a meta-transaction scheme* with a **zero-trust** forwarder — which is why ERC-2771 (§f) is a redundant anti-pattern here, and why every submission-side key (relayer, burner, session key) has a **blast radius of gas only — never authorship, never the user's funds.**

---

## 1. The canonical large-file flow (what "N transactions under one signature" concretely is)

Let a file be `S` bytes, chunked into `N = ceil(S / CHUNK)` chunks (CHUNK = 24 KB for SSTORE2 under EIP-170; larger for inline/blob tiers). Records in the envelope: `M = N + k`, where the `k` non-chunk records are the `DATA` identity record, the placement `PIN`, the `mirrors` reserved-key edge(s), and `contentHash`/`size`/`contentType` VAL edges. `count` is `uint32`, so `M ≤ 4.29e9` — **one envelope holds every chunk of any file up to ~103 TB at 24 KB/chunk. Multi-envelope splitting is never forced by size, so one signature is always enough.** `[check: 4.29e9 × 24 KB ≈ 103 TB]`

```
CLIENT (local, no wallet, no gas):
  1. chunk the file → N chunk records; build the k identity/placement/mirror/property records
  2. build ONE positional Merkle tree over all M records → recordsRoot        (codex-envelope Merkle rules)
  3. seq = TID (microsecond clock + device bits; NON-unique, no coordination)  (envelope §3.7)

USER (exactly one interaction):
  4. eth_signTypedData_v4 over Envelope{author, seq, prev, recordsRoot, count=M}
     under domain ("EFS","1")  — no chainId, no verifyingContract              ← THE ONLY PROMPT

SUBMITTER (relayer / burner / session-key agent / the user's own EOA — anyone):
  5. REGISTER tx: submit the header + sig once. ecrecover ~3k, store
     envelopeId → {author, seq, recordsRoot, count, admittedBitmap}.           (envelope line 279)
     O(1) gas, independent of N. (Or fold registration into the first submitOne.)
  6. N CHUNK txs: submitOne(header, chunkRecord_i, index_i, proof_i)
     — proof-only, no ecrecover, no user key, < 10k gas + body storage.
     ANY submitter, ANY order, idempotent, resumable, parallelizable.          (envelope lines 279–286, 354–356)
```

Properties that fall out of the substrate (each cited, not asserted):

- **Resume is free, zero new signatures.** A `submit` overlapping prior partial admissions "skips admitted leaves and atomically admits the remainder" (envelope line 286); `submitOne` cherry-picks any missing leaf (line 354). A half-uploaded file is finished by re-running `submitOne` for the un-set bits of `admittedBitmap` — **the original signature still covers them.** Interrupted uploads, flaky relayers, and cross-session resume cost nothing.
- **Parallel is free, and CREATE2 makes it coordination-free.** Chunk-store addresses are salt/content-derived, not nonce/mined-order-derived (mission substrate), so N deploys shard across M submitter accounts with **zero cross-tx dependency**. Throughput scales ~M-fold by adding submitter accounts.
- **Ordering is free.** Parents-first is enforced against *chain state at admission*, not batch order (envelope line 355); a chunk whose parent `DATA` isn't yet on-chain reverts *now* and admits after the parent lands — "delaying, order-free, convergent." Only constraint: land the `DATA`/`PIN` parent before or with the chunks (or accept the retry).
- **A hostile or racing submitter can only help.** Idempotent no-op on re-submit ⇒ front-running your upload just means someone else paid your gas (envelope line 285). The worst omission attack (drop chunks) yields a *graded partial read*, never a forged file and never a false "absent" (see §6).

**Naming note for later phases:** `codex-kernel.md` calls the verbs `submit` / `submitSubset`; `envelope-replay-domain.md` calls them `submit` / `submitOne`. Same two entrypoints. Reconcile the name once in the frozen chapter; this doc uses `submit` (full batch) and `submitOne` (proof-carrying single leaf).

---

## 2. Why the authoring prompt is exactly 1 and cannot be 0 in v2 (the hard floor)

The AA schemes below **cannot reduce the authoring signature below one per signed manifest**, because the envelope's own adopted-core rules forbid the two tricks that would:

- **No ERC-1271.** `codex-envelope.md` adopted core: *"ERC-1271 never admissible."* Signatures must be raw secp256k1 (0x01) that `ecrecover` to the `author` word (P-256/WebAuthn reserved). So a smart-account **session key cannot *author*** via contract-signature validation — it can only *submit*.
- **No delegated authoring pre-KEL.** The `successor`/scoped-key story is the reserved KEL era (~2030); `codex-kinds.md` amendment 7 demotes `successor` to reserved-not-active with "hostile MUST-NOT-authorize" language. There is no v2 key hierarchy that lets a hot key sign manifests *as* the user.

**Consequence (sharp):** in v2, `authoring prompts = number of distinct signed envelope roots`. For a **bounded, known file that is one envelope, that is exactly 1** — for any size, because `count` is uint32 (§1). You reach literally-one-prompt by making submission free (relayer/burner), never by making authoring zero. Zero-prompt authoring is a KEL-era purchase (a pre-authorized authoring sub-key), explicitly out of v2 scope, and it collides with the "user = ONE address" identity rule if you try to fake it by letting a burner be the author.

**The one case that needs more than one authoring prompt: streaming / unbounded input.** If you cannot compute the whole tree before signing (a live capture, an append-only log of unknown length), you cannot sign one covering root. Options, cheapest first: (i) **chunk into a few large envelopes** and sign each root (a *few* prompts, not N — e.g. sign per-GB); (ii) **KEL-era delegated authoring key** signs future roots unattended (post-v2). Flag this as the single exception to "one signature covers everything."

---

## 3. Storage tier × submission scheme are orthogonal (N is set by the tier, prompts by the scheme)

The number of on-chain transactions `N` is a **storage-tier** property; the number of wallet prompts is a **submission-scheme** property. They do not interact. One signature works at every tier.

| Storage tier (settled upstream) | Bytes location | ~Write cost | On-chain txs `N` | EIP-170 chunking? | Portable? |
|---|---|---|---|---|---|
| **Inline signed body** (calldata) | in the record body, hash-in-state | ~40 gas/byte (EIP-7623 floor) `[UNMEASURED]` | ∝ size / calldata-per-tx | no 24 KB cap | **yes** (bytes travel in the envelope) |
| **SSTORE2** (`EFSBytesStore`, ADR-0057) | bytes = contract code, in state, `extcodecopy`-readable | ~200 gas/byte + deploy `[UNMEASURED]` | 1 store + N≈ceil(S/24KB) chunk deploys | **yes, forces 24 KB** | no (re-deploy per chain) |
| **`data:` inline mirror** (ADR-0063, ≤4 KB) | RFC-2397 `data:` URI in the mirror edge | trivial | folds into the manifest (0 extra) | n/a | yes |
| **Merkle-leaf + off-chain mirror** (ipfs/ar/https) | off-chain; only root/leaf on-chain | ~0 on-chain | ~1 (manifest) | n/a | **yes**; contract can verify any chunk handed to it |

Read-side complement (do not re-invent): multi-chunk on-chain files are paged for reading by **EIP-7617 chunk pagination** against `EFSBytesStore` (`contracts/specs/overview.md`; dual ERC-5219 so bare `web3://<store>` resolves in stock web3:// clients). v1 already ships this; v2 keeps it.

**The clean result:** the one-signature manifest is a **storage-independent commitment** — it commits to chunk *hashes*, not to a storage mechanism. So (a) you can mix tiers under one signature (e.g. a permanent SSTORE2 archive copy *and* a cheap `ar://` mirror leaf, both committed by the same root), and (b) future scaling tiers plug in underneath the *unchanged* authoring UX (§8).

---

## 4. The six schemes, each dissected

For each: mechanism, **exact MetaMask prompt count**, what the user signs, trust model (who can grief / who can steal), self-submit floor, MetaMask reality.

### (a) Author-from-signature relaying — THE stock-today winner

**Mechanism.** User does step 4 (one `signTypedData_v4`) and hands the signed manifest to a relayer over any channel (HTTP POST, p2p, `/.well-known/relayer` per ops-doctrine). The relayer runs steps 5–6: register tx + N `submitOne` txs, paying all gas from its own account. The kernel recovers `author` from the manifest signature; the relayer's `msg.sender` is ignored.

**MetaMask prompts: 1.** One off-chain typed-data signature. **Zero transaction prompts, zero gas from the user, no AA, no 7702, works on the most basic EOA MetaMask that exists.** This is the direct realization of the carrier-decision Q4 ruling ("one sig over the DAG… relay/sponsor/replicate all fall out of one mechanism") and its experiment (c): "sign an 8-record file DAG with one `eth_signTypedData_v4`, relay from a different account, assert recovered author (not relayer) recorded."

**What the user signs (precise):** `Envelope{author, seq, prev, recordsRoot, count}` — a 5-field struct whose `recordsRoot` binds *every* record of the upload (file identity, all chunks, placement, mirrors, hashes). Clear-signing should surface: filename, byte size, chunk count, content hash, destination path. The user is consenting to **the entire file and where it goes**, once.

**Trust model — the relayer is a pure gas/bandwidth utility:**
- **Cannot** forge authorship (author from sig; relayer key never enters), **cannot** alter a byte (every leaf hash-committed under the signed root — a changed byte fails its Merkle proof and that `submitOne` reverts), **cannot** steal/redirect (`DATA` owned by author+salt, `PIN` authored), **cannot** attribute to itself, **cannot** front-run harmfully (idempotent; front-run = free publication, envelope line 285).
- **Can grief only by omission:** stall, drop chunks, reorder, go offline. Every omission is (i) *user-recoverable* — anyone finishes the missing `submitOne`s from the same signature, and (ii) *honestly graded* on read — a partial file reads as `BYTES-UNAVAILABLE` / incomplete, **never a broken file, never a false absent** (read-lens §2.4, §5.1). Relayer death is, per ops-doctrine, "a UX event, never a data/identity event" — because "no signed byte ever names a submission channel."
- **Business-trust only:** a paid relayer could overcharge or refuse. Not a security property — switch relayers; the manifest is portable to any of them (or to a burner, §e).

**Self-submit floor:** perfect. The same signed manifest the relayer holds is self-submittable by the user (or anyone) at any time — that is exactly the censorship floor (§ below). Relaying never removes it.

**Sub-variants (all identical to MetaMask — 1 prompt):** hosted service relayer; the app's own submitter contract; a p2p courier swarm (LOCKSS-style, harmless dup); **sponsored gas** where a lens-vouched author's uploads are paid by a sponsor (ops-doctrine amendment 9 notes lens-vouching can gate sponsorship). On devnet, the hackathon **gasless faucet-drip** *is* this scheme with the faucet as relayer/funder.

### (b) Session keys / delegated keys — ERC-7715 grant + ERC-7710 redemption

**Mechanism.** User grants ONCE a scoped permission (`wallet_grantPermissions`, ERC-7715) to a local/agent key: "may call `EFSKernel.submitOne` / `submit`, value = 0, up to `G` gas total, until `T`." A local agent then auto-signs the N chunk txs with the session key — no further prompts. Redemption/enforcement via the ERC-7710 delegation framework on the account.

**MetaMask prompts: 1 grant, then 0 per chunk** (plus the 1 authoring `signTypedData_v4`, which can be produced in the same UX moment or folded into the grant flow → **effectively 1–2 up front, then unattended**).

**What the user signs:** (i) the manifest (authoring, §2 — irreducible), and (ii) the permission grant (submission authority for the session key). The grant is *submission* authority only; by §2 the session key still cannot author.

**Scope that makes it upload-only (the ERC-7715 permission fields to set):**
- `target = EFSKernel` address (and the `EFSBytesStore` factory) — nothing else callable.
- `selector ∈ {submit, submitOne}` — no other kernel methods.
- `value = 0` — uploads never move ETH; a nonzero-value call is outside scope.
- `gasLimit`/native-token budget cap `G` — bounds total spend to the upload's gas.
- `expiry T` — minutes-to-hours; one upload session, not standing authority.

**Trust model — blast radius is *gas only*, doubly bounded:**
- By the substrate: a submission key **cannot author** (§2), so even an unscoped upload key that leaks lets the thief only *spend the gas budget re-broadcasting already-authored envelopes* — it cannot mint content as the user or touch funds.
- By the scope: value=0 + gas cap + target-lock + expiry means a leaked key's worst case is "burns ≤ G gas calling submit until T." This is the strongest session-key safety profile in dapp-land, and it is a *consequence of `msg.sender`-ignoring*, not of the scoping.

**Self-submit floor:** intact — grant is additive; the manifest remains self-submittable.

**MetaMask reality:** ERC-7715/7710 are **emerging, not stock-default** as of cutoff — available via the MetaMask Delegation Toolkit / experimental smart-account flows, and they generally presuppose a smart account or a 7702-upgraded EOA (§d). **Rank: the "as AA matures" answer, not the "today on vanilla MetaMask" answer.** `[verify wallet support at ship time]`

### (c) EIP-5792 `wallet_sendCalls` batching

**Mechanism.** One `wallet_sendCalls` request carries an array of calls; the wallet shows ONE approval and executes them, advertising support via `wallet_getCapabilities`. Two execution modes matter and they behave very differently for large files:
- **Atomic** (all calls in one tx): requires the account to be a smart account or **7702-upgraded** (§d). **Cannot hold a large file** — one tx can't exceed one block's gas, which is the entire reason the upload spans many blocks. So atomic 5792 only helps *small* files or *sub-batches*.
- **Sequential** (wallet fires the calls as separate txs): one approval → many on-chain txs across many blocks. **This is the mode that matters for large uploads.**

**MetaMask prompts: 1 approval** for the batch (plus the authoring sig, or fold the whole envelope-submit into the batch if the account is the submitter). But: a plain EOA cannot do atomic batching, and **practical per-request call-count limits** mean a very large `N` may not fit one `wallet_sendCalls`. So for big files you get **one approval per *bounded batch of chunks*, not necessarily one approval for the whole file** — you may issue several `sendCalls` (a few prompts) or pair with a session key (§b) for truly unattended completion.

**What the user signs:** the batch approval (submission). Authoring sig still separate per §2.

**Trust model:** wallet-custodied — the wallet holds the key and executes; no third-party relayer, so no external grief vector beyond the wallet/RPC. Self-submit floor intact (this *is* self-submission, batched).

**MetaMask reality:** `wallet_sendCalls`/`getCapabilities` **shipped in MetaMask through 2024–2025**; atomic requires 7702/SCA. **Rank: good "today-ish" for moderate chunk counts (tens), one approval; does not reach one-prompt for arbitrarily large N without a session key.** `[verify exact call-count limits + EOA sequential behavior against live MetaMask at ship time]`

### (d) EIP-7702 — EOA delegates to a batching/session contract

**Mechanism.** The user signs one 7702 authorization setting their EOA's code to a delegate (a batch-executor / delegation manager). The EOA can then (i) atomic-batch via 5792, and (ii) host a scoped session key (§b) **without migrating to a separate smart-account address** — the user keeps their address (aligns with the "user = ONE address" identity rule).

**MetaMask prompts: 1 authorization** (often one-time per account, reusable across many uploads), then it *enables* (b)/(c). It is not a standalone submission scheme — it's the substrate that lets a **vanilla EOA** get session keys and atomic batching. For a large file you still combine it with (b) for unattended N-chunk submission.

**What the user signs:** the 7702 delegation authorization (once) + the manifest (per upload) + optionally the session grant. The delegate is *submission* machinery; §2 still forbids it from authoring.

**Trust model:** the delegate contract is trusted for its *own* correctness (standard smart-account risk) but, again, **cannot author** — worst case it mis-spends gas or bricks the account's batching. Choose an audited delegate. Self-submit floor intact.

**MetaMask reality:** 7702 live since Pectra (mainnet ~May 2025); MetaMask supports EOA upgrade. **Rank: the enabling layer for the "as AA matures" recommendation** — pair 7702 (once) + 7715 session key (per upload session) → one grant, then unattended, on the user's own address. `[verify]`

### (e) Burner / hot key — the zero-infra self-hosted relayer

**Mechanism.** A local ephemeral EOA holds a little gas and auto-signs all submission txs. Because submission ≠ authorization, **the burner is just scheme (a)'s relayer, running locally under the user's control** — no third party.

**MetaMask prompts:**
- **Faucet-dripped burner: 1** (only the authoring `signTypedData_v4`; the faucet funds the burner, 0 funding prompts) — **ties scheme (a) for literally-one-prompt and removes the external relayer.** This is the hackathon devnet path.
- **Self-funded burner: ~2** (authoring sig + one funding transfer to the burner). Still O(1), not O(N).

**Pre-sign-all-nonces-and-blast (the throughput question, answered):** yes. The burner pre-signs submission txs for sequential tx-nonces `0..N-1` and broadcasts them in parallel. Limits and mitigations `[UNMEASURED; client/RPC-dependent]`:
- **Geth defaults:** `txpool.accountslots ≈ 16` (pending executable per account), `txpool.accountqueue ≈ 64` (queued future-nonce per account), `globalslots ≈ 5120`, `globalqueue ≈ 1024`. So one burner keeps ~16 executable + up to ~64 queued in flight; beyond that, later nonces are rejected until earlier ones mine. Public RPCs are often *stricter* and may rate-limit. **Verify against the target chain's actual mempool policy.**
- **Nonce-gap stall:** if an early-nonce tx is dropped/underpriced, all later nonces block. Mitigate with adequate EIP-1559 tips + replace-by-fee, or eliminate the shared nonce lane entirely by **sharding across M burners** — CREATE2's salt-derived chunk addresses make this coordination-free (§1), giving ~M×(accountslots) parallel in-flight chunk txs and ~M-fold throughput.

**Trust model — custody risk is *gas only*.** The burner's compromise leaks *only the gas sitting in it* — never authorship (it's not the author key), never the user's main funds, never content integrity (leaves hash-committed). Keep the burner balance small; treat it as disposable. This is a fundamentally milder custody risk than a normal hot wallet precisely because of the auth/submission split.

**Self-submit floor:** the burner *is* self-submission with a helper key. Floor fully intact; nothing external required.

**MetaMask reality:** no MetaMask feature needed at all beyond the one authoring signature — the burner is app-managed (this is the scaffold-eth "burner wallet" pattern). **Rank: co-winner for one-prompt-today, and the most cypherpunk (no trusted relayer, no AA dependency).**

### (f) Meta-transactions / ERC-2771 — redundant anti-pattern here

**Mechanism (and why it doesn't fit).** ERC-2771 has a *trusted forwarder* append the real user's address to calldata so the recipient reads it via `_msgSender()`. It exists to solve "a relayer sent the tx but the contract must know the real user." **EFS already solved that at a deeper layer:** the record signature *is* the authorship proof, and the kernel recovers `author` from it while ignoring `msg.sender` entirely (envelope §3.7). The envelope is therefore *already a meta-transaction scheme with a zero-trust forwarder.*

Adding ERC-2771 would **reintroduce a trusted forwarder** (trusted to set the right `_msgSender()`) to recover a property EFS gets for free and more safely — a strict regression against "verify-don't-trust." It also violates the envelope's master rule that `msg.sender` never enters any identity path.

**MetaMask prompts:** n/a — don't build it. **Trust model:** worse than every other scheme (adds a trusted forwarder). **Verdict: do not use.** The one legitimate residual reason to know the gas-payer (fee accounting/refunds) is deliberately excluded by EFS's "no `msg.sender` in any semantic path" rule; handle relayer economics off-chain instead.

---

## 5. The censorship / self-submit floor (invariant under all six schemes)

Every scheme above is a UX *convenience over* a floor that must never be removed, and none removes it:

- **The floor:** the user's own EOA submits the register tx + N `submitOne` txs directly. **Stock MetaMask cost: N+1 prompts** (one confirmation per tx) — bad UX, but it needs *nobody*: no relayer, no session key, no AA.
- **Why it survives censorship (ops-doctrine, with costs):** permissionless submission means "a censor must stop *every* submitter, not just the author." On Stage-1+ rollups with working force-inclusion it is delay-not-denial (bounded ~hours–1 day); on L3s/validiums it is weaker/absent (the trusted-chain list carries a force-inclusion column). The signed manifest is portable, so a censored user re-submits on any other carrying chain — write-once-copy-forward.
- **Why the floor is cheap to keep:** because resume is free (§1), the user can *start* with a relayer/burner and *finish* the tail themselves if the relayer defects, or vice-versa — the same signature covers any mix of submitters. There is never a lock-in to one submission channel ("the mortality invariant is format-level — no signed byte ever names a submission channel").

**Design rule for the SDK:** ship the relayer/burner path as the default UX **and** always expose a "submit it yourself" fallback that walks the `admittedBitmap` and fires the missing `submitOne`s from the user's own account. LC6 (read-lens §8.1) already binds the SDK to ship *no* default relayer endpoint that fails silently — the self-submit path is the honest floor behind it.

---

## 6. Partial uploads read as graded states, never as broken files (why omission-grief is safe)

A large upload is, by construction, *incomplete until the last chunk lands.* The read-lens spec makes in-progress and partially-relayed files first-class rather than broken:
- Un-submitted chunk leaves → the file's placement is present but bytes are incomplete → `BYTES-UNAVAILABLE` flag ("authentic pointer, bytes absent here", read-lens §2.4), reachable as a *graded partial*, and a GATE read requiring the bytes fails closed (never serves a truncated file as whole).
- A missing chunk is **UNKNOWN**, never **PROVEN-ABSENT** (read-lens §2.1) — so a resolver never falsely reports "this file/chunk doesn't exist" during an in-flight or stalled upload; it reports "not known at this venue yet."
- Completeness is venue-relative and carries its currency qualifier; a checkpoint over the author's state bounds "how much of this file is known here."

So the worst a hostile/dead submitter achieves is "the file reads as partially-available, honestly labeled, and anyone can complete it" — which is exactly the read-grade discipline the mission requires (partial ≠ broken ≠ false-absent).

---

## 7. Ranked recommendation

| Rank | Scheme | MetaMask prompts (stock, today) | On-chain txs | Who submits the N | Blast radius if submitter key leaks | Maturity |
|---|---|---|---|---|---|---|
| **1 (today)** | **(a) author-from-sig relaying** | **1** (typed-data) | 1 register + N chunk | relayer/service/faucet | relayer's own gas only | **ships on any EOA now** |
| **1 (today, cypherpunk)** | **(e) faucet-dripped burner** | **1** (typed-data) | 1 register + N chunk | local burner | gas in burner only | **ships now, zero infra** |
| 2 | (e) self-funded burner | ~2 (sig + fund) | 1 + N | local burner | gas in burner only | ships now |
| 3 (today-ish, moderate N) | (c) EIP-5792 sequential | 1 approval per bounded batch (+sig) | 1 + N | the wallet | n/a (wallet custody) | MetaMask 2024–25 `[verify]` |
| **4 (as AA matures)** | **(b)+(d) ERC-7715 session key on 7702 EOA** | **1 grant, then 0/chunk** (+sig) | 1 + N | local agent w/ session key | gas budget cap only | emerging `[verify]` |
| Floor (always) | self-submit | **N+1** | 1 + N | user EOA | n/a | universal |
| Never | (f) ERC-2771 | — | — | trusted forwarder | reintroduces trust | anti-pattern |

**Two-line verdict.**
- **Literally one prompt on stock MetaMask today:** user signs one `eth_signTypedData_v4` manifest; a **relayer or a faucet-dripped burner** fires the register tx + all N `submitOne` chunk txs. No AA, no 7702, works on the most basic EOA. (Devnet: the faucet-drip *is* this.)
- **One prompt as AA matures, relayer-free on the user's own address:** **7702-upgrade the EOA once**, then **one ERC-7715 grant** of a kernel-submit-only, value-0, gas-capped, minutes-boxed session key; a local agent completes the upload unattended. Same one-prompt feel, no third party, blast radius = gas.

Everything between (5792 sequential, self-funded burner) is a graceful-degradation ladder; the self-submit floor sits under all of it, permanently.

---

## 8. Forward-compatibility (bigger blocks, blobs, danksharding/PeerDAS) without giving up permanence

The authoring UX is **frozen against future scaling** because the one signature commits to chunk *hashes*, not to a storage venue (§3). Future capacity plugs in as a **new chunk-leaf storage tier under the unchanged manifest**:

- **Bigger blocks / lower calldata floor** → more chunks per `submitOne`, smaller N, same one signature. Pure win, no UX change.
- **EIP-4844 blobs / PeerDAS** → a chunk leaf can commit to a blob's **KZG versioned hash**; the kernel verifies the versioned hash on submit; the same one-signature manifest references it. This makes the *initial availability* of a large file far cheaper. **Permanence caveat (state loudly):** blobs are pruned (~18 days), so a blob-tier chunk is *on-chain-committed* (the commitment persists) but *not bytes-in-state*. For the 100-year archive, the manifest should reference **both** a permanent tier (SSTORE2/inline — bytes-in-state) *and* an optional cheap blob/mirror tier for fast serving — both committed by the same root. Blobs are an *availability accelerator, not a permanence tier*.
- **Danksharding** → same as blobs at larger scale; same leaf-commitment trick.

Because the submission axis is already "anyone, any tx, any order, resumable," none of these require re-authorization: you re-`submitOne` the same leaves onto a cheaper tier whenever it arrives, under the *original* signature. **The write-authorization design never has to change again.**

---

## 9. Adversarial pass — trying to break my own proposal

1. **"One sig can't really cover millions of chunks."** It covers the *root*; `count` is uint32 (4.29e9 ≥ any file's chunk count to ~103 TB). The client's cost is local tree-building (CPU/IO), not a wallet cost. ✔ holds. *Residual:* the client must buffer/stream-hash the whole file before the single signature — fine for bounded files; **streaming/unbounded input is the genuine exception** (§2) and needs a-few-prompts or KEL-era delegated authoring. Flagged, not hidden.
2. **"The relayer can still ruin the upload."** Only by omission, always user-recoverable (free resume), always honestly graded on read (§6). It cannot forge, alter, steal, or misattribute. ✔ holds — the trust is liveness-only.
3. **"Session/burner keys are the usual dapp foot-gun."** Not here: a submission key **cannot author** (no ERC-1271, no delegated authoring, §2), so its blast radius is gas only — categorically milder than a normal session key that can act as you. ✔ holds; scope (value=0/target-lock/expiry) is defense-in-depth on top.
4. **"5792 gives one prompt for the whole file."** Only atomically, which can't exceed one block — false for large files. Sequential 5792 is the real large-file mode and may need several approvals for very large N. I down-ranked it accordingly and paired it with session keys. ✔ corrected in-text.
5. **"Nonce blasting will just work."** It's mempool-limited (~16 executable/~64 queued per account on geth defaults; stricter on public RPCs) and nonce-gap-fragile. Mitigations (RBF, tips, shard-across-burners via CREATE2) are real but `[UNMEASURED]`. Honest: throughput needs *multiple submitter accounts*, not one blasting account. ✔ flagged.
6. **"Registration is a mined-dependency that serializes everything."** The first `submitOne` can self-register, but then it's a special ordering constraint. Cleaner: one tiny dedicated register tx (O(1) gas, carries the sig) *then* N fully-parallel proof-only chunk txs. One extra tx, full parallelism. ✔ addressed as a design choice.
7. **"Front-running the manifest is an attack."** The envelope makes it a *no-op benefit* (line 285) — the attacker pays to publish your already-authored content, attributed to you. ✔ not an attack.
8. **"What if the DATA parent lands after chunks?"** Chunks revert *now*, admit after the parent (delaying, order-free, convergent, envelope line 355). SDK sequences parent-first; worst case is a retry, never a corrupt state. ✔ holds.
9. **Weakest genuine point:** relayer/sponsor **economics** (who pays for a 100 GB upload, how a paid relayer is metered without putting `msg.sender` in a semantic path). This doc solves *authorization UX*, not *gas markets*; ops-doctrine's per-identity budgets + lens-vouched sponsorship is the hook, but pricing a multi-terabyte archival write is an open economic question, not an auth question. Flagged for the ops/economics phase.

---

## 10. Handoffs / open items for later phases

- **[SDK]** Ship the `submitOne` uploader: build tree → 1 `signTypedData_v4` → register tx → parallel `submitOne` blast with `admittedBitmap`-driven **resume**, defaulting to relayer/faucet-burner and always exposing the **self-submit floor** (LC6). Shard across M burners via CREATE2 for throughput.
- **[Codex/naming]** Reconcile `submitSubset` (kernel doc) vs `submitOne` (envelope base) to one frozen verb name.
- **[Contracts]** Confirm the register-then-`submitOne` gas profile (`ecrecover` once ~3k; per-leaf < 10k excl. body storage — envelope I13) with a real snapshot; decide dedicated-register-tx vs first-contact-registers for max parallelism.
- **[Wallet-reality, ship time]** Re-verify against live wallets: 5792 EOA-sequential behavior + call-count limits; 7715/7710 availability in stock MetaMask; 7702 upgrade UX. All flagged `[verify]`.
- **[Ops/economics — the real open question]** Relayer/sponsor gas markets for large archival writes (metering without `msg.sender` in any semantic path); per-identity budgets + lens-vouched sponsorship as the starting hook.
- **[Streaming]** Decide the a-few-envelopes vs KEL-delegated-authoring answer for unbounded input (the one case one-signature does not cover).
- **[Forward-compat]** Reserve a blob/KZG-versioned-hash chunk-leaf tier so the *availability accelerator* plugs in under the unchanged manifest; keep a permanent (bytes-in-state) tier alongside for the 100-year pledge.
