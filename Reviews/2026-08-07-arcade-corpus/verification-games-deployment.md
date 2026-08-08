# Verification: /games dataset deployment status & receipts

Purpose: determine whether the web-games ("EFS Arcade") dataset is actually deployed, on which chains, with what receipts — and define what a complete receipt convention should look like.

Evidence grades: **A** = verified from source/primary (file read, on-chain RPC query, hash computed locally); **B** = strong inference from A evidence; **C** = uncertain / unverified.

Verification date: 2026-08-07. All chain reads were read-only (`eth_call` / `eth_getLogs` / `eth_getCode`) via the public endpoint `https://ethereum-sepolia-rpc.publicnode.com` and the devnet RPC `https://178.104.79.94.nip.io/rpc`. No writes, no API keys.

---

## 1. Bottom line

| Environment | /games deployed? | Evidence |
|---|---|---|
| **Real Sepolia (11155111)** | **YES — all 15 games live** | A (direct RPC queries, below) |
| **Devnet 26001993** | **NO** — chain is up but has no EFS core at the frozen addresses | A (`eth_getCode` = `0x`) |
| **Local-only** | Seeder tooling exists but is **unmerged/uncommitted**; no local receipts committed anywhere | A (git status / branch archaeology) |

**Receipts: zero committed anywhere.** The only authoritative record of the seed is the chain itself. The web-games README's own promise — "Retrieval/seeding addresses … get recorded in an `ADDRESSES.md` here once we pin" ([../../../content/datasets/web-games/README.md](../../../content/datasets/web-games/README.md) line 60) — was never fulfilled. This file is currently the closest thing to a receipt that exists.

---

## 2. On-chain verification: /games IS live on real Sepolia (grade A)

Queried the frozen EFSIndexer proxy `0xc4DeaBB482C2FA74690629eEa662efb166BD658a` (address + ABI from [../../../contracts/packages/hardhat/deployments/sepolia/Indexer.json](../../../contracts/packages/hardhat/deployments/sepolia/Indexer.json); schema UIDs from [../../../contracts/docs/SEPOLIA_FREEZE_TABLE.md](../../../contracts/docs/SEPOLIA_FREEZE_TABLE.md) lines 13–21) and EAS `0xC2679fBD37d54388Ce493F1DB75320D236e1815e`.

- `rootAnchorUID()` = `0x152ff2d9027128109ea1922c3b9563ea282c4dac6b1cc146078e391b8a693de6`
- `resolvePath(root, "games")` = **`0xe11dfbe2a942eed3fa441951e21a06c6f5e29c51dd14702dda987a62a25b4fcc`** (folder anchor, generic `forSchema=0`)
- The /games anchor attestation: schema = ANCHOR `0xf818abd7…c921a`, **attester `0x11CbE1b619bb9fe79e2F4C22c9A62412b3E79912`** (the curator EOA), time **2026-06-23T23:31:00Z**, refUID = root, not revoked.
- **All 15/15 game file anchors resolve** via `resolveAnchor(gamesUID, "<name>.html", DATA_SCHEMA_UID)` (DATA = `0xa3400cec…41b3c`). Example UIDs:
  - `snake.html` → `0x6accf851ee33d784bee52c6e99ed0dbc3325c1f929774c2c79ebe60320235eb6` (attested 2026-06-23T23:31:36Z)
  - `tetris.html` → `0x9950145b5b3683a2f55c6389202d5339e963dc4d0f9f05e130cbb31a7035ae6a`
  - `dante.html` → `0x735cc0b72e6a754456e32e7c39da7075ea8c150781ce2e1d519557395da6abf1`
  - (full 15-name list confirmed one by one; zero misses)
- Note a resolver gotcha: `resolvePath(gamesUID, "<file>")` returns 0 for files — file anchors are DATA-schema-keyed (per the anchor forSchema rules), so `resolveAnchor(..., DATA_SCHEMA_UID)` is required. Any future receipt-verification script must use the schema-keyed call.

### Seed run footprint (EAS `Attested` logs, curator-filtered, grade A)

Binary-searched the seed timestamp to block **11126061** and scanned blocks 11126061–11146061:

- **324 distinct transactions, 1,078 attestations** by curator `0x11CbE1…9912`, blocks **11126061 → 11139297** (≈ 2026-06-23T23:31Z through ~44h later). This window covers /games *and* the sibling seeds (`/whitepapers` anchor attested 2026-06-24T00:35:36Z; `/cypherpunk` also exists — same curator).
- Per-schema counts: ANCHOR 323, DATA 69, MIRROR 69, PROPERTY 207, PIN 276, TAG 134.
- First tx `0xb8ed4e8cab47a9eee7a811e365969aac1045032145ce8149dd9c9e010436d824`; last tx `0x32ccae605c3a51a77e4a73f8a984759032d0be7794dfcc5eceea60cc53378042`.
- MIRROR = DATA = 69 → **exactly one mirror per file** (grade B): only the seeder's own IPFS pin was written on-chain; the upstream gist/raw-GitHub mirror URLs listed in [../../../datasets/web-games/manifest.json](../../../datasets/web-games/manifest.json) `mirrors` arrays were not attested.

### Content integrity spot-check (snake.html, grade A)

- On-chain MIRROR: `uri=ipfs://bafkreiearitxfztizwp4lwbxgf2bprg2bqf4m6rqhnteyffcswos76txiy` (uid `0xaade380f…6797`, block 11126063, tx `0xc465be72f7f4e651473839cb7396d607597735b292a181cd5569e5f357ea279c`).
- Locally computed CIDv1-raw-sha256 of [../../../datasets/web-games/snake.html](../../../datasets/web-games/snake.html) = **identical CID** → the on-chain mirror points at exactly the staged bytes.
- Gateway availability today: `ipfs.io` → HTTP 200; devnet VPS gateway `https://178.104.79.94.nip.io/ipfs/…` → HTTP 200; `dweb.link` → 301 (subdomain redirect). Content is retrievable, but the pin's origin is the **single devnet VPS Kubo node** (`IPFS_API_URL=https://178.104.79.94.nip.io/api/v0` per [../../../datasets/deploy/docs/DEPLOYMENT.md](../../../datasets/deploy/docs/DEPLOYMENT.md) lines 211–228) — one machine is the durability anchor (grade B).
- On-chain PROPERTYs for snake.html: `contentType=text/html`, `size=4123` (matches local file exactly), `contentHash=0x8778567d6fa04823d5ce3ba80f2b9837fa2392aa3ec8d223cc14258bf4603f6c`.

### ⚠ Cross-lane finding: the live data's contentHash is **keccak256** (grade A)

`keccak256(snake.html)` = `0x8778567d…03f6c` — exactly the on-chain PROPERTY value; `sha256` = `808a2772…7746` (≠). Source: the seeder hard-codes it — [../../../datasets/deploy/packages/hardhat/scripts/seed-dataset.ts](../../../datasets/deploy/packages/hardhat/scripts/seed-dataset.ts) line 257: `contentHash: keccak256(bytes)`. So the **only real production data on Sepolia uses a third contentHash variant**, contradicting both the canonical spec (`f1220<sha256>` multibase-multihash, [../../../contracts/specs/10-file-metadata-encoding.md](../../../contracts/specs/10-file-metadata-encoding.md), ADR-0064) and the SDK's bare-sha256 ([../../../sdk/docs/adr/0006-content-hash-bare-sha256.md](../../../sdk/docs/adr/0006-content-hash-bare-sha256.md)). `computeContentHash` in [../../../contracts/packages/nextjs/utils/efs/transports.ts](../../../contracts/packages/nextjs/utils/efs/transports.ts) (keccak256) is **not dead code in practice** — its twin was executed by the seeder and its output is attested on Sepolia. Migrating to the ratified format now means the deployed dataset's hashes won't verify under the spec.

### Visibility

The curator EOA is wired into the explorer as the default content lens: `EFS_CONTENT_LENS = "0x11CbE1b619bb9fe79e2F4C22c9A62412b3E79912"` at [../../../contracts/packages/nextjs/utils/efs/containers.ts](../../../contracts/packages/nextjs/utils/efs/containers.ts) line 314 (grade A). So /games is visible by default in the app, not only via `?lenses=`.

---

## 3. Devnet 26001993: NOT deployed (grade A)

- RPC `https://178.104.79.94.nip.io/rpc` is live: `eth_chainId` = `0x18cc249` (26001993), head = `0xa32289` (**10,691,209**) — i.e. the devnet was reset to a Sepolia fork at FORK_BLOCK=10691000 (cf. worktree commit `bc48c18` "regen deployedContracts.ts at FORK_BLOCK=10691000") and has mined only ~209 blocks since.
- `eth_getCode` at the frozen Sepolia Indexer proxy `0xc4De…658a` → **`0x`** (no code). The real-Sepolia core was evidently deployed after block 10691000, so the fork predates it, and no CREATE3 re-deploy has been run on the fork since the reset.
- `eth_getCode` at the legacy April devnet `EFSIndexer` `0x85554083b691219C1F2556bA52D4fDEe5d76a01f` (from [../../../devnet/docs/ops/deployed-addresses.md](../../../devnet/docs/ops/deployed-addresses.md), snapshot dated 2026-04-18) → also **`0x`** — that snapshot is stale; the state it describes was wiped by the reset.
- No games/dataset/seed references anywhere in the devnet repo: `grep -ril 'web-games|/games|seed'` over [../../../devnet/](../../../devnet/) scripts and docs → zero hits. `shared_logs/` is empty.
- Caveat (grade C): the memory note "identical addresses/UIDs on devnet" describes the intended post-deploy state; it is **not currently true on-chain**.

---

## 4. Where the tooling and staging actually live (grade A)

- **The seeder was never merged.** `seed-dataset.ts` / `seed-dataset-lib.ts` / `tasks/seedDataset.ts` / tests exist only as **untracked files** in the git worktree [../../../datasets/deploy/](../../../datasets/deploy/) (branch `codex/content-deploy-checkout`, a worktree of the contracts repo — `git status` shows them under `??`), plus one archive commit `a1e75c5` "chore: archive dataset seeder work in progress" reachable only from branch `pm/archive-contracts-wip-2026-06-23`. Main has none of it (no `seed-dataset*` in [../../../contracts/packages/hardhat/scripts/](../../../contracts/packages/hardhat/scripts/)).
- The runbook is [../../../datasets/deploy/docs/DEPLOYMENT.md](../../../datasets/deploy/docs/DEPLOYMENT.md) §"Dataset seeding" (lines ~205–236): dry-run by default, `--execute --pin` for real runs, Sepolia command targets `--manifest ../datasets/web-games/manifest.json`, and instructs the operator to "record the `[seed-dataset] signer=0x...` line in the operator notes" — **no such operator notes exist in any repo** (searched contracts, datasets, devnet, content, hackathon).
- The `deploy/10_seed_demo_tree.ts` path (the /docs //images //shared demo seed) is explicitly gated to localhost/hardhat only ([../../../contracts/packages/hardhat/deploy/10_seed_demo_tree.ts](../../../contracts/packages/hardhat/deploy/10_seed_demo_tree.ts) lines 26–29) and is unrelated to /games — confirmed by Sepolia reads: `/docs`, `/images`, `/shared` do NOT resolve on Sepolia.
- **Two divergent copies of the dataset.** The seeded copy is [../../../datasets/web-games/](../../../datasets/web-games/) (mtimes Jun 18–20; the manifest the runbook points at). The canonical content-repo copy [../../../content/datasets/web-games/](../../../content/datasets/web-games/) was edited **after** the Jun 23 seed (mtimes Jun 26): `diff -rq` shows **6 games differ** (bomberman, doodle-jump, frogger, infernal-throne, pong, tetris) plus README.md and manifest.json; snake.html et al. are byte-identical. ⇒ **What's on-chain/IPFS is the pre-Jun-26 bytes; the content repo's "current" versions of 6 games were never re-seeded** (grade A for the diff; B for "never re-seeded" — no later curator MIRROR/DATA activity found past block 11139297 in the scanned window, and no tooling run is recorded anywhere).
- Stale status trackers: [../../../hackathon/READY.md](../../../hackathon/READY.md) line 21 still shows "Seed the sample datasets onto Sepolia" as an **unchecked** TODO ("seeder designed, not built") — both claims are outdated; the seeder was built and the seed happened 2026-06-23/24.

## 5. Receipt convention: sibling datasets don't have receipts either

- [../../../content/datasets/crypto-whitepapers/ADDRESSES.md](../../../content/datasets/crypto-whitepapers/ADDRESSES.md) is **pre-seed mirror research** (which upstream CIDs already exist; dated 2026-06-10), not a deployment receipt. Its own line 65–67 anticipates recording self-pinned CIDs "back into this file" — never done, even though `/whitepapers` is live on Sepolia (verified above).
- cypherpunk-canon and ethereum-eips (both content/ and datasets/ copies): **no ADDRESSES.md, no receipts at all**, despite `/cypherpunk` being live on Sepolia.
- The only committed deployment records anywhere are **contract**-level: [../../../contracts/packages/hardhat/deployments/sepolia/](../../../contracts/packages/hardhat/deployments/sepolia/) (hardhat-deploy JSON: addresses/ABIs/txs for the core+views) — nothing at the dataset/content layer.

## 6. Receipt completeness scorecard for /games (vs the checklist)

| Receipt element | Committed anywhere? | Recoverable from chain? |
|---|---|---|
| Chain (11155111) | ❌ | ✅ (this doc, §2) |
| Path (`/games` + 15 children) | ❌ | ✅ |
| UIDs (folder anchor, file anchors, DATA/MIRROR/PROPERTY/PIN/TAG) | ❌ | ✅ (enumerated via EAS logs) |
| CIDs + mirrors | ❌ | ✅ (MIRROR attestations; 1 ipfs:// mirror per file, no upstream https mirrors attested) |
| Tx hashes | ❌ | ✅ (324 txs, first/last recorded above) |
| Blocks | ❌ | ✅ (11126061–11139297) |
| Signer | ❌ (runbook told operator to note it; not done) | ✅ (`0x11CbE1b619bb9fe79e2F4C22c9A62412b3E79912`) |
| Tooling version | ❌ — **unrecoverable**: the seeder is uncommitted worktree code; no commit hash can ever be tied to the run | ❌ |
| Pin location / durability plan | ❌ (single VPS Kubo, inferable only from the runbook env vars) | partial |

Score: **0/9 committed**. 8/9 were reconstructable only because the chain is public and this review did the archaeology; the tooling version is permanently lost.

## 7. What a complete Arcade receipt convention should be (recommendation)

One `ADDRESSES.md` (or `RECEIPT.md`) **per dataset, committed in the dataset directory next to `manifest.json`**, written by the seeder itself at `--execute` time (machine-generated section + human sign-off line), containing:

1. **Chain**: chainId + network name; EAS + Indexer proxy addresses used.
2. **Anchor path + UID**: `/games` → folder-anchor UID, root UID at time of seed.
3. **Per-file table**: name → file-anchor UID, DATA UID, contentHash (algorithm named explicitly!), size, contentType, MIRROR UID(s) + full `ipfs://` CID + any upstream mirror URIs, PIN UID, TAG UIDs.
4. **Txs + blocks**: first/last block, tx count, and per-file tx hash (or the multiAttest tx grouping).
5. **Signer**: curator EOA + a statement of which lens config makes it visible (e.g. `EFS_CONTENT_LENS`).
6. **Tooling version**: git commit hash of the seeder actually executed (hard-fail the seeder if the working tree is dirty, or embed `git describe --dirty`), plus the exact CLI invocation and env (RPC, IPFS API host).
7. **Pin custody**: which node(s) pinned the CIDs, and re-pin instructions.
8. **Manifest digest**: sha256 of the `manifest.json` used, so staged-copy drift (the Jun-26 divergence in §4) is detectable mechanically.
9. **Idempotency note**: what a re-run would skip/repair (the seeder already computes this — `plan skip … contentHash already active`, seed-dataset.ts lines 322–358 — so it can emit a drift report against the receipt for free).

Also: mark the seeded snapshot immutable (tag the datasets/ copy or record the content-repo commit), and update stale trackers (hackathon/READY.md line 21, devnet deployed-addresses.md) when a seed lands.

---

## Appendix: exact verification commands

Node scripts run via `node` with `ethers` from `contracts/packages/hardhat/node_modules`, all read-only against `https://ethereum-sepolia-rpc.publicnode.com`:

- `rootAnchorUID()` / `resolvePath(root,"games")` / `resolveAnchor(gamesUID, name, DATA_SCHEMA_UID)` on Indexer `0xc4DeaBB482C2FA74690629eEa662efb166BD658a`
- `getAttestation(uid)` on EAS `0xC2679fBD37d54388Ce493F1DB75320D236e1815e`
- `eth_getLogs` topic-filtered on `Attested(address,address,bytes32,bytes32)` with attester `0x11CbE1…9912`, blocks 11126061–11146061
- Devnet: `curl -X POST https://178.104.79.94.nip.io/rpc` `eth_chainId` / `eth_blockNumber` / `eth_getCode`
- Local: `shasum -a 256`, `keccak256` via ethers, CIDv1-raw reconstruction (`0x01551220`+sha256, base32)
- Gateway checks: `curl -o /dev/null -w "%{http_code}" https://ipfs.io/ipfs/bafkreiearitxfztizwp4lwbxgf2bprg2bqf4m6rqhnteyffcswos76txiy` → 200
