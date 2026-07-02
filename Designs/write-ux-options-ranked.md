---
title: EFS write-UX — full options rundown, ranked
status: review
tags: [status/review, sdk, ux, contracts-coordination, research]
related: [[sdk-minimal-clicks]], [[sdk-one-signature-writes]], [[sdk-write-ux]], [[write-ux-options-ranked]]
target-repos: [sdk, contracts]
last-touched: 2026-06-22
---

# EFS write-UX — every option to cut popups + latency, ranked

Six parallel expert passes (account-abstraction, on-chain routines, alternative IDs, EAS-protocol/backends,
storage latency, cross-protocol prior art). This is the consolidated, ranked map — including ADR-breaking
and high-effort options, per James's ask for a full rundown.

## The two-axis frame (everything reduces to this)
**Clicks and latency are SEPARATE problems with SEPARATE levers. Don't conflate them.**

- **Clicks (signatures):** the floor on a plain MetaMask EOA is the **DAG depth** (3–4), because EAS UIDs embed
  `block.timestamp` (+ collision `bump`) and can't be precomputed, so dependent layers can't share one
  signed batch. Getting below the DAG depth to **1 signature** requires running a UID-threading routine
  **in the user's own account context** (EIP-7702 / ERC-4337) — there is no plain-EOA path to 1 click without
  either that or changing how IDs work.
- **Latency (wall-clock):** dominated by (a) sequential block waits between dependent layers, and (b) sequential
  storage-chunk deploys. Levers: faster blocks (L2), pipelining independent txs, soft-confirm, and collapsing
  the DAG into one tx.
- **Gas** is a third, orthogonal axis (paymaster / delegated submit) — a separate win, never a click/latency lever.

**Hard invariant every option is graded against:** the EAS `attester` must stay the user's wallet (or the app's
own contract for publisher content). Lenses/visibility key on it. This kills shared relayers, Multicall3-style
batchers, ERC-2771 forwarders, and plain 4337/Safe (where the smart-account contract is `msg.sender`). It is
*preserved* by 7702 (code runs at the EOA's address), 4337 (the SA address *is* the user), and delegated
attestation (signer is recorded as attester).

---

## Master ranking (leverage-adjusted: impact ÷ effort ÷ risk)

### TIER 0 — No contracts, any wallet, user stays attester. ✅ SHIPPED in contracts PR #36 (2026-06-23). See [[Decisions-debug-ui-minimal-clicks]].
| # | Option | Clicks after | Latency after | Effort | Breaks |
|---|---|---|---|---|---|
| 0a | **Layered `multiAttest`** (one tx per DAG layer, thread mined UIDs) | 11 → **3–4** | 3–4 blocks | S (built) | none |
| 0b | **Pipeline chunk deploys** (fire-all, await-all; or burner `nonceManager` → 0 popups) | storage N (unchanged) | N×12s → **~1–2 blocks** | S | none |
| 0c | **`data:` URI mirror** for ≤~6KB files (bytes inline in MIRROR; no SSTORE2) | drops 2 deploys → **0 storage** | 0 storage blocks | S | soft ADR-0011 (new `/transports/data`) |
| 0d | **Client-side compression** (brotli/gzip + `contentEncoding` PROPERTY) | fewer chunks (multiplier) | proportional | S–M | none |

→ Together: overview save ~12 → ~3–6 clicks; 1 MB file ~11 min → ~75s. This is the current PR.

### TIER 1 — The real "1 popup, 1 block" win. Needs an in-account routine; MetaMask-capable via 7702.
| # | Option | Clicks | Latency | Effort | Breaks | Coverage |
|---|---|---|---|---|---|---|
| 1a | **EIP-7702 + EIP-5792 `sendCalls` over an EFS write-routine** (MetaMask Smart Account executes EFSLib-style in-memory UID threading; storage deploys + all attestations in one atomic call; optional paymaster) | **1** | **1 block** | M–L (routine + audit; client 5792 + capability-gate + Tier-0 fallback) | none (EFSLib is compile-in ADR-0003; no new frozen surface) | MetaMask v12+ (7702), Coinbase SW, Ambire, Safe — broad & growing; graceful fallback to Tier-0 |
| 1b | **ERC-4337 smart account runs EFSLib** (one userOp; paymaster-sponsored) | **1** | **1 block** | L (account infra) | none | embedded/SA users (Privy/Coinbase/ZeroDev/Biconomy) — not injected MetaMask EOAs |
| 1c | **ERC-7579 Smart Sessions / session key** scoped to the EFS routine | **0 after a 1-time grant** | 1 block | L–XL | none (session key never recorded as attester) | greenfield 7579 accounts only |

→ 1a is the convergent #1 across the AA, contracts, and prior-art lanes: the *only* path that takes the
MetaMask-first majority to one signature while preserving the attester, breaking no freeze. The write-routine
it needs is the shared dependency for 1b/1c too. Sequence: ship Tier-0 fallback first, then 1a behind
`wallet_getCapabilities` (`atomic: supported`).

### TIER 2 — Latency infrastructure (orthogonal; multiplies everything above).
| # | Option | Clicks | Latency | Effort | Breaks |
|---|---|---|---|---|---|
| 2a | **Deploy EFS on an OP-Stack L2** (Base/OP — EAS is a canonical predeploy at `0x42…0021`; ~2s blocks + soft-confirm; cheap gas → trivial sponsorship) | unchanged | **dramatic** (4×2s≈8s vs 4×12s≈48s; perceived ~instant) | S–M (ADR-0060 already anticipates) | none; keeps full EAS ecosystem compat |
| 2b | **Soft-confirm pipelining** (thread next layer on sequencer soft-confirm, not finality) | unchanged | perceived ~1 block | M | none (sequencer-trust, fine early) |

### TIER 3 — Storage engineering (large-file clicks + latency).
| # | Option | Clicks (1MB) | Latency | Effort | Breaks |
|---|---|---|---|---|---|
| 3a | **One-tx CREATE2 multi-chunk factory** (emits the canonical `EFSBytesStore` so ERC-5219/router parity holds) | 42 → **~1** (≤~0.5–0.7MB/tx, EIP-7623 calldata cap) | 1 block | M (new contract + ADR) | tension w/ ADR-0057 (Tier-2, write ADR) |
| 3b | **CREATE2 deterministic chunk addresses** (precompute → parallelize, skip manager serialization, **idempotent dedup** of repeat content) | dedup removes repeat-content deploys | −1 block | M | none |
| 3c | **Arweave / Irys / Storacha transport** for large files (opt-in/auto-fallback above on-chain cap) | 0 storage popups | off-chain upload + 1 attest | M/transport | none (new transport anchor; needs funded uploader) |

### TIER 4 — Optimistic / off-chain-first UX ("feels instant", bigger shift).
| # | Option | Clicks | Latency | Effort | Breaks |
|---|---|---|---|---|---|
| 4a | **EAS offchain attestations + periodic `multiTimestamp`** (Ceramic/Snapshot model: client-set time ⇒ UIDs ARE precomputable ⇒ DAG self-references with zero glue; sign all ~11 in one pass, render immediately, anchor a Merkle root lazily) | sign-only, ~1 pass | **perceived instant** | L–XL | EFS owns DA + read resolution; on-chain *enforcement timing* shifts to anchor — not how EFS reads today |
| 4b | **CCIP-read (ERC-3668) gateway** (one on-chain resolver anchor; per-save DAG served off-chain as user-signed attestations, verified on read; settle lazily) | reads instant/free | lazy writes | L–XL | centralized gateway trust (or L2 to avoid) |

→ These are how Farcaster/Lens/Snapshot/Ceramic feel instant. They fit the SDK-owns-resolution boundary, but
EFS's "content IS the on-chain attestation" thesis means they're a **tiered draft/commit** layer, not a core-path
replacement. Strong research bet for "drafts feel instant, publish on demand."

### TIER 5 — Determinism / backend redesign (ADR-breaking; v2-grade leverage).
| # | Option | Clicks | Latency | Effort | Breaks / Sacrifices |
|---|---|---|---|---|---|
| 5a | **Content-address DATA (EFSID = CID/contentHash)** — the *honest* deterministic id for content edges; whole DAG precomputable ⇒ one `multiAttest` on a plain EOA; free dedup; kernel can still *validate* (recomputes the hash) | **1** | **1 block** | XL | **reopens ADR-0049** (DATA = pure identity) + frozen DATA/MIRROR resolver edit; supersede moves to REDIRECT |
| 5b | **Wildcard: predeclared-address DATA via `recipient` + CREATE2 store** — reach ~1–2 popups using *already-frozen* seams (`EdgeResolver` address-targeting + CREATE2 store address as content handle) | **1–2** | 1 block | M | soft ADR-0049 tension (read-convention handle); MIRROR may still pin one mined DATA UID |
| 5c | **Read-time EFSID stitching** (edges store deterministic EFSIDs; joined off-chain) | **1** | **1 block** | L | sacrifices on-chain invariant enforcement (cardinality/mirror-validation/injection-protection move off-chain) — EFS becomes a log + index |
| 5d | **EFS-native deterministic registry alongside EAS** (deterministic ids on the hot path; async-mirror to EAS for ecosystem) | **1** | **1 block** | XL | softens ADR-0032 (EAS = *a* target, not *the* foundation); partial/deferred EAS compat |
| 5e | **Salted/nonce'd DATA** (enabler — keeps empty DATAs unique+predictable under any deterministic-UID scheme) | n/a alone | n/a | S (rider on 5a/5d) | changes DATA schema (needs salt field) |

### TIER 6 — Rejected / worst effort:payoff (enumerated so nobody re-chases them).
| Option | Why rejected |
|---|---|
| **Fork EAS for deterministic UIDs** | XL; destroys the core "EFS = canonical EAS, readable by eas-sdk/easscan" value prop; forces new SchemaRegistry → **all 9 schema UIDs change**, full re-freeze + re-bootstrap; and a naive timestamp-drop *breaks* EFS's empty-DATA identity (you must re-add a salt anyway → that's 5a/5d without the ecosystem). Payoff ~90% reproducible via 7702+L2. Fork last, if ever. |
| **Upstream EAS deterministic-UID change** | Correct in principle; no community demand found; governance-bound, multi-quarter-to-never, not EFS-controlled. File as a long-shot; don't gate roadmap. |
| **Migrate to Verax / Sign Protocol / Ceramic registry** | No alternative offers precomputable dependent-ID batching EAS lacks; all cost, breaks ADR-0032, different tooling. Dual-write = *more* popups. |
| **Coordinate-address the content edges (MIRROR/placement → path)** | Silent corruption — content edges mean "these exact bytes"; pointing at a path re-points when bytes change. James-ruled out. |
| **ERC-2771 trusted forwarder / meta-tx** | EAS isn't 2771-aware → forwarder becomes attester → identity collapse. |
| **Shared batcher / Multicall3 over CALL** | Batcher becomes `msg.sender`/attester → every user collapses into one lens. |
| **App-contract-as-attester for *user* content** | Publisher-only; collapses all users into the app's lens. Fine for app-published content, wrong for user files. |
| **`multiAttestByDelegation` for click reduction** | 1 EIP-712 sig per attestation (MetaMask doesn't batch typed-data) → *more* clicks; can't pre-sign dependent refUIDs. (Keep it for **gas sponsorship only**.) |
| **EIP-4844 blobs for storage** | ~18-day pruning violates the permanence thesis; hybrid-cache only, never default. |
| **Calldata-only storage** | Not `extcodecopy`-readable → breaks zero-infra web3:// serving; EIP-7623 raised its cost. |
| **ENS-style commit-reveal** | Adds a tx + forced delay; defends scarce-name claims EFS doesn't have. |

---

## Recommended portfolio (sequencing)
1. **Now (done):** Tier-0 — layered multiAttest + pipelined storage + `data:` URI + compression. Universal, zero-risk.
2. **Next headline win:** **Tier-1a** — 7702 + 5792 `sendCalls` over the EFSLib write-routine, behind capability
   detection with Tier-0 fallback. The one-signature/one-block payoff on MetaMask-first, attester preserved,
   no freeze break. (Routine = the shared dependency; reuse for 1b/1c.)
3. **Latency multiplier, in parallel:** **Tier-2a** — stand up EFS on an OP-Stack L2 (ADR-0060). Cheap gas makes
   the faucet-drip/paymaster trivial; perceived latency → near-instant; full EAS compat.
4. **Large files:** **Tier-3a + 3b + 3c** — CREATE2 one-tx factory (router-parity-safe) + dedup, Arweave for big media.
5. **Research bet for "feels instant":** **Tier-4a** offchain-attest + `multiTimestamp` as a draft/optimistic layer.
6. **v2, only if a hard plain-EOA-one-tx requirement survives 7702:** **Tier-5a** content-address DATA (CID).
7. **Never:** Tier-6.

## Convergent cross-lane lesson (from Farcaster/Lens/Snapshot/Ceramic)
Consult the wallet/identity layer **rarely**; run the high-frequency layer on a **pre-authorized key whose
signatures resolve back to the user** (Farcaster app-keys, Lens session keys, EAS delegated/offchain). And the
universal "feels instant" trick: **render the save as done the moment the user signs; settle in the background.**
EFS is unusual only in that its *content* is the on-chain attestation — so it adopts the *structure* (in-account
routine, optimistic render) rather than moving content fully off-chain.

## Prior-art index (sources)
EIP-7702 (Pectra) · EIP-5792 `wallet_sendCalls` / `getCapabilities` · ERC-4337 · ERC-7579 Smart Sessions
(Rhinestone/ZeroDev/Biconomy) · ERC-7715/7710 permissions · EAS `multiAttest` / `attestByDelegation` /
offchain + `multiTimestamp` · Farcaster Signed Key Request + Snapchain · Lens v3 session keys / delegated
executors / Momoka · Ceramic streams + Anchor Service · Karma GAP (EAS dependency-DAG SDK) · Gitcoin Passport
move-onchain · ENS namehash + CREATE2 + commit-reveal (anti-pattern) + CCIP-read (ERC-3668) · Snapshot
sign-not-send · ERC-7683 intents · SSTORE2/SSTORE3 · EIP-4844 blobs (18-day) · EIP-7623 calldata cost ·
Arweave/Irys/Walrus/Storacha.
