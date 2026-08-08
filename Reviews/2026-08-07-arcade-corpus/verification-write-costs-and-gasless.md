# Verification: write costs + gasless/burner state for v1 (Sepolia)

Purpose: evidence-based costs for seeding games and writing comments on live Sepolia, plus the real state of the gasless/faucet/burner stack — inputs for the arcade comments + submissions design.

Evidence grades: **A** = verified from source / primary (code read, live Sepolia RPC read, tx receipt), **B** = strong inference from source, **C** = uncertain / unverified.

Live-chain reads in this file were made 2026-08-07 against `https://ethereum-sepolia-rpc.publicnode.com` (head block 11,441,252). Sepolia contract addresses from [deployedContracts.ts](../../../contracts/packages/nextjs/contracts/deployedContracts.ts) (chain `11155111` block starts at line 8590; Indexer `0xc4DeaBB482C2FA74690629eEa662efb166BD658a`) and [SEPOLIA_FREEZE_TABLE.md](../../../contracts/docs/SEPOLIA_FREEZE_TABLE.md) (schema UIDs, lines 13–18).

---

## 1. Headline findings

1. **[A] `data:` inline mirrors do NOT work on live Sepolia.** Live read: `Indexer.resolvePath(transportsUID, "data")` → `0x0` (transports anchor `0x936fb4c6…8cc3` resolves; its `data` child does not). The bootstrap (14-anchor tx `0xad31b1…da173`, block 11,095,760, 9.29M gas) predates ADR-0063 (2026-06-22); [ADR-0063](../../../contracts/docs/adr/0063-data-uri-inline-mirror-transport.md) explicitly anticipates this: "Already-frozen chains (live Sepolia …) may lack `/transports/data`; until the path exists, the client transparently falls back to SSTORE2." So on Sepolia **every** on-chain-bytes write is SSTORE2, and the "~5 tx small-file path" in [specs/overview.md](../../../contracts/specs/overview.md) does not exist there today. (Anchors are permissionless — anyone could create `/transports/data` on Sepolia; nobody has.)
2. **[A] None of the 15 games fits the 4 KB inline cap anyway.** `DATA_URI_MAX_BYTES = 4096` raw bytes ([uploadOnchainFile.ts:143](../../../contracts/packages/nextjs/lib/efs/uploadOnchainFile.ts), gate at line 694). Smallest game is snake.html at **4,123 bytes** — 27 bytes over. Inline path is moot for the arcade even after `/transports/data` exists, unless games are minified.
3. **[A] The web-games dataset is ALREADY seeded on live Sepolia** — with `ipfs://` mirrors only, no on-chain bytes. Live reads: `/games` anchor = `0xe11dfb…4fcc`; `resolveAnchor(games, "snake.html", DATA_UID)`, `tetris.html`, `infernal-throne.html` all resolve. Seeding txs: curator EOA `0x11cbe1b619bb9fe79e2f4c22c9a62412b3e79912`, blocks ~11,126,061–11,126,270 (≈2026-06-25), matching the [seed-dataset.ts](../../../datasets/deploy/packages/hardhat/scripts/seed-dataset.ts) pattern exactly (it pins to IPFS and writes `ipfs://<cid>` mirrors — lines 368–402; it never writes SSTORE2 or `data:`).
4. **[A] Measured cost ≈ 11.1M gas (~0.013 ETH at ~1.2 gwei) per game** for the IPFS-mirror seed path — no bytes on chain. Receipts below.
5. **[A] Funding is a non-issue for James-side seeding: the Sepolia bootstrap deployer `0xacf4c2950107ef9b1c37faa1f9a866c8f0da88b9` holds 682.23 SepoliaETH** (live balance read, 2026-08-07). The "hundreds of Sepolia ETH" claim is verified. Curator EOA holds 2.12 ETH.
6. **[B] The Sepolia HTTP drip faucet is built and client-integrated but almost certainly NOT deployed today.** Code + integration are all merged; the service is an optional Docker-profile container that defaults to the devnet chain, and the hackathon checklist that would have stood it up for Sepolia was never completed (buildathon wound down 2026-07-01 per the planning Decisions log). Visitor gasless writes on Sepolia are therefore **not live right now** — one env var + one container away, not a build project.

---

## 2. Gasless / faucet / burner stack — what exists, what runs where

### Faucet service (devnet repo)

[devnet/faucet/README.md](../../../devnet/faucet/README.md) + [config.ts](../../../devnet/faucet/src/config.ts):

- **[A]** `POST /drip {address}` → sends fixed SepoliaETH. Defaults (config.ts:122–160): **0.01 ETH per drip**, **0.03 ETH lifetime cap per address**, **24 h cooldown**, skip if balance ≥ one drip, **20 req/min per IP**, 0.005 ETH reserve floor. Per-address lock + global send queue (serialized nonces — the faucet itself is a 1-tx-at-a-time bottleneck).
- **[A]** This is explicitly "**v1 drip**: it just sends ETH"; the true zero-ETH delegated-attestation relayer (`multiAttestByDelegation`) is a documented later upgrade (README lines 8–10). No relayer code exists anywhere.
- **[A]** Deployment: ships in [devnet/docker-compose.yml](../../../devnet/docker-compose.yml) behind the `faucet` compose profile — **off by default**. Default wiring is the devnet anvil (chain 26001993, anvil account #9, worthless forked ETH). Real-Sepolia mode requires `FAUCET_RPC_URL=<sepolia rpc>` + `FAUCET_CHAIN_ID=11155111` in `.env` + a funded `FAUCET_PRIVATE_KEY` in `faucet.secret.env` (compose lines 117–130).
- **[C]** Whether the container is running with Sepolia config on the VPS right now: not verifiable from the repos. Given [hackathon/READY.md](../../../hackathon/READY.md) still has the "Sepolia faucet link" as an unchecked placeholder task (lines 16–17) and the buildathon was wound down, the working assumption is **not running**.

### Client integration (contracts/nextjs, merged)

- **[A]** [faucet.ts](../../../contracts/packages/nextjs/utils/scaffold-eth/faucet.ts): HTTP drip client. Enabled only when `NEXT_PUBLIC_FAUCET_URL` is set AND wallet is on the faucet chain (default **live Sepolia 11155111**). Unset ⇒ fully disabled. The deployed app build must have baked the env var in — a static export without it has no faucet at all.
- **[A]** PR #39 "instant Sepolia burner session" (merged 2026-06-24, commit 57e221a; hardening in #41): [instantBurner.ts](../../../contracts/packages/nextjs/utils/scaffold-eth/instantBurner.ts) + [useAutoFaucetDrip.ts](../../../contracts/packages/nextjs/hooks/scaffold-eth/useAutoFaucetDrip.ts). Fresh-user flow on Sepolia: visitor clicks **"Enable promptless edits"** → Scaffold-ETH burner wallet (locally generated pk in localStorage, `burnerWallet.pk`) connects with no popup → **one automatic drip** fires (per chain×address, per page load) → header shows "funding…" until the 0.01 ETH lands. Page-load reconnects and real-wallet connects do NOT auto-drip; a manual "Get test ETH" menu item remains. The whole affordance is hidden when `NEXT_PUBLIC_FAUCET_URL` is unset (`isInstantBurnerSessionEnabled`, instantBurner.ts:11–20).
- **[A]** Fork chains (local 31337, devnet 26001993) don't use the HTTP faucet at all — [DevnetAutoFund.tsx](../../../contracts/packages/nextjs/components/DevnetAutoFund.tsx) silently sends **1 ETH** from the node's unlocked account. Zero infra, devnet/local only.
- **Net [B]:** "gasless" on Sepolia = *faucet-subsidized burner EOA*, not gasless. Every write is still a normal EOA tx paid by the visitor's burner from a 0.01 ETH drip, capped at 0.03 ETH lifetime per address (trivially evaded by clearing localStorage — new burner address; accepted per the devnet-drain posture).

---

## 3. Measured write costs (live Sepolia receipts — grade A)

Per-file seed cycle for one game (snake.html, blocks 11,126,061–11,126,068, curator EOA, eff. gas price 1.05–1.27 gwei). Tx pattern matches seed-dataset.ts (`attestOne` DATA → stage `multiAttest` → file anchor → commit `multiAttest`):

| Tx (attestations) | Gas used | Receipt |
|---|---|---|
| Dataset root ANCHOR `/games` (1× ANCHOR) | 784,306 | `0xb8ed4e8c…6824` |
| DATA (1× empty DATA) | 273,140 | `0x0e72aec5…5bed` |
| Stage multiAttest (1 MIRROR + 3 key ANCHOR + 3 PROPERTY) | 3,762,740 | `0xc465be72…279c` |
| File ANCHOR (1× ANCHOR) | 911,670 | `0x75b95849…66c4` |
| Tag-definition ANCHOR (1× ANCHOR, amortized across files) | 806,599 | `0x23eb051f…e10e` |
| Commit multiAttest (4 PIN + 3 TAG) | 6,127,352 | `0xaa6940fd…2fd4` |

- **Per-game core (4 tx): ≈ 11.07M gas ≈ 0.013 ETH at 1.2 gwei.** With amortized tag-def anchors: ~11–13M. Whole 15-game dataset ≈ **~170M gas ≈ ~0.2 SepoliaETH** — noise against 682 ETH, but **17+ drips** of faucet budget, i.e. *a visitor cannot seed a game from one 0.01 ETH drip unless gas is ≤ ~0.9 gwei*.
- Notable unit costs: a single ANCHOR ≈ **0.78–0.91M gas**; empty DATA ≈ **0.27M**; the PIN-heavy commit averages **~875k/attestation** (placement PIN propagation + property-bind PINs dominate; cf. [ADR-0068](../../../contracts/docs/adr/0068-lower-max-anchor-depth-to-256-for-propagation-gas.md): ~4 cold SSTOREs ≈ ~90k/level of first-placement ancestor propagation — shallow here, so most cost is EAS + indexer + resolver bookkeeping).
- **[B] Tx counts vs spec:** the spec's "~5 tx small file" assumes the `data:` inline path (absent on Sepolia). The **observed** IPFS-mirror path is **4–6 tx / 9–12 attestations per file**. An SSTORE2 path adds 1 manager + N chunk-deploy txs on top.

### SSTORE2 add-on estimate (grade B — no on-chain sample; ~200 gas/byte code deposit + create + calldata ≈ ~220–250 gas/byte, ~24 KB max/chunk)

| Game class | Bytes | Chunks | Extra gas for bytes | Extra ETH @1.2 gwei |
|---|---|---|---|---|
| snake.html (smallest) | 4,123 | 1 | ~1.0–1.3M (+ manager deploy) | ~0.0015 |
| median game (~10 KB) | ~10,000 | 1 | ~2.5M | ~0.003 |
| dante.html | 37,383 | 2 | ~9M | ~0.011 |
| infernal-throne.html | 199,630 | 9 | ~45–50M (10+ txs) | ~0.055 |

## 4. Game sizes and storage-path classification (grade A — `ls -la` of [content/datasets/web-games/](../../../content/datasets/web-games/))

| Path | Bytes | ≤4096 inline? | SSTORE2 chunks |
|---|---|---|---|
| snake.html | 4,123 | **No (over by 27 B)** | 1 |
| doodle-jump.html | 5,721 | No | 1 |
| breakout.html | 6,322 | No | 1 |
| helicopter.html | 6,360 | No | 1 |
| tetris.html | 7,526 | No | 1 |
| sokoban.html | 8,419 | No | 1 |
| frogger.html | 8,843 | No | 1 |
| block-dude.html | 9,444 | No | 1 |
| missile-command.html | 10,047 | No | 1 |
| bomberman.html | 10,520 | No | 1 |
| puzzle-bobble.html | 12,522 | No | 1 |
| tiny-yurts.html | 17,599 | No | 1 |
| pong.html | 20,982 | No | 1 |
| dante.html | 37,383 | No | 2 |
| infernal-throne.html | 199,630 | No | 9 |

**Zero games fit `data:` inline** (and Sepolia lacks the transport anchor anyway). All 15 are 1-chunk SSTORE2 except dante (2) and infernal-throne (9). All 15 are currently IPFS-mirror-only on Sepolia (seeded ~2026-06-25); mirrors in [manifest.json](../../../content/datasets/web-games/manifest.json) also list raw-gist HTTPS fallbacks.

## 5. Comment-write cost model (grade B — composed from measured unit costs)

On Sepolia today comment text can't ride a `data:` mirror (§1.1). The cheap on-chain-text primitive is the non-revocable **PROPERTY string** + an edge.

| Model | Attestations | Est. gas | ETH @1.2 gwei | Notes |
|---|---|---|---|---|
| Comment = PROPERTY + PIN under a reserved key anchor | key ANCHOR (once per target per key, ~0.8M) + PROPERTY (~0.3M) + PIN (~0.9M) | **~1.2–2.0M** (2.0 incl. anchor) | ~0.0014–0.0024 | PIN slot is cardinality-1 per (attester, definition, targetSchema) — **one comment per user per target**, re-attest replaces. Wrong shape for threads. |
| Comment = PROPERTY + TAG | PROPERTY (~0.3M) + TAG (~0.6–0.9M) | **~0.9–1.2M** | ~0.0011–0.0014 | Cardinality-N — many comments per user per target. Weight usable for votes. |
| Comment = full file upload (DATA+MIRROR+props+ANCHOR+PIN) | 9–12 atts, 4–6 tx | ~11M | ~0.013 | The measured game-seed cost; overkill for comments. |
| First-comment ancestor visibility TAGs | +1 TAG per untagged ancestor (`/games`, game anchor) | +0.6–0.9M each, first write only | — | Steady-state zero (walk exits at first existing TAG, per overview.md upload-flow step 7). |
| 1 faucet drip (0.01 ETH) buys | — | ~8.3M gas @1.2 gwei | — | ≈ **6–8 TAG-model comments**, or ~4 PIN-model, or **most-but-not-all of one game seed**. Lifetime cap 0.03 ETH ≈ ~20 comments/address. Sepolia gas spikes (>10 gwei happen) cut this 10×. |

Batching: the debug UI already batches via layered `multiAttest` (commit 5119b2b), so a comment is realistically **1–2 tx** regardless of attestation count.

## 6. Read-side reality (RPC limits) for ~100 visitors

- **[A]** [.env.example](../../../contracts/packages/nextjs/.env.example) (`NEXT_PUBLIC_SEPOLIA_RPC_URL` block): the explorer runs **~45 `useScaffoldReadContract` block-watchers per visitor**; against a public RPC these starve under the browser's ~6-connections-per-host cap and the explorer "hangs on Loading System…". A dedicated provider is "STRONGLY RECOMMENDED" and was verified to fix it.
- **[A]** Default RPC: viem's public Sepolia endpoint with the **bundled shared Scaffold-ETH Alchemy key** as fallback ([scaffold.config.ts:159–163](../../../contracts/packages/nextjs/scaffold.config.ts), [wagmiConfig.tsx:26–30](../../../contracts/packages/nextjs/services/web3/wagmiConfig.tsx) — own key flips Alchemy to primary).
- **[B]** Load math: 45 watchers × 1 poll/12 s ≈ ~3.75 req/s per open tab → **100 concurrent visitors ≈ ~375 req/s** — far beyond a free/shared Alchemy tier. A public arcade page must NOT be the stock explorer per visitor: needs a dedicated funded RPC key, aggressive client caching (read-cache PR #38 exists but is unquantified here), or reads proxied through one cached origin. Playing an already-loaded game costs zero RPC (single-file HTML in an iframe); the load is directory listing + comment reads.
- **[B]** Write throughput for a comment burst: chain-side trivial (a 30M-gas Sepolia block fits ~25–30 TAG-model comments; blocks every 12 s). The real bottlenecks are the faucet (serialized send queue, 20 drips/min/IP, one drip per address per 24 h) and each burner EOA's sequential nonce (1 tx/block ≈ 5 comments/min/user — fine).

## 7. Implications for the comments/submissions design

1. **Burner + faucet on Sepolia is feasible and cheap** (drip = 6–8 comments; refill blocked 24 h — an acceptable natural rate limit), **but the faucet service must actually be stood up**: enable the compose `faucet` profile with `FAUCET_CHAIN_ID=11155111` + a key funded from the 682-ETH deployer, and rebuild/redeploy the static app with `NEXT_PUBLIC_FAUCET_URL` baked in. No new code needed. Until then there is **no visitor write path on Sepolia** short of bring-your-own faucet ETH.
2. **Model comments as PROPERTY + TAG** (cardinality-N), not PROPERTY + PIN (one-comment-per-user) — or LIST/LIST_ENTRY if ordering/curation matters (unpriced here; LIST_ENTRY ≈ PIN-class cost).
3. **Don't plan on `data:` inline anywhere in the arcade on Sepolia** until someone creates `/transports/data` there (permissionless, one ANCHOR tx ≈ 0.8M gas — cheap, and worth doing, but note ADR-0063 seeded it via SystemAccount on fresh chains; on Sepolia it would be an ordinary-attester anchor).
4. **Games are already live at `/games` on Sepolia via IPFS mirrors** — the seeding cost question for the arcade is only about *adding* SSTORE2 permanence (≈ +1–2.5M gas/game for 13 of 15 games) or new submissions (~11–13M gas each, ~0.015 ETH — deployer-fundable at 4 orders of magnitude of headroom).
5. **Read scaling, not write funding, is the binding constraint for "100 visitors"**: dedicate an RPC key (or same-origin caching proxy) before publicizing anything.
