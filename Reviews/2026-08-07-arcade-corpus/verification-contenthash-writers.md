# Verification: contentHash writers and verifiers (hash-writers lane)

Purpose: audit every code path in EFS v1 that computes, writes, or verifies a `contentHash`, establish each one's format against the canonical convention, determine whether durable (real-Sepolia) data already diverges, and give the smallest safe reconciliation order before `/games` is (re-)seeded durably.

Evidence grades: **A** = verified from source or primary on-chain data (file read, `cast call` against real Sepolia); **B** = strong inference from verified evidence; **C** = uncertain / not fully verified.

---

## 1. The authoritative convention

**[A]** [`../../../contracts/specs/10-file-metadata-encoding.md`](../../../contracts/specs/10-file-metadata-encoding.md) — Status: **Accepted, James-ratified 2026-06-20** (header, lines 1–15; ratification restated at §2.1 and §2.3). Canonical `contentHash` value:

```
"f" + lowerhex(0x12 || 0x20 || sha2-256-digest)   →   f1220<64 lowercase hex>
```

- sha2-256 is canonical/default; keccak-256 is an *optional alternate* the format can carry (`f1b20…`), never the default (§2.1).
- Writers MUST emit base16 (`f`); readers SHOULD accept `f` (base16) and `b` (base32) and dispatch on the multihash code (§2.2).
- `size` = base-10 ASCII, no leading zeros (§3). `cid` = CIDv1 `cid.toString()` (base32, `bafk…`); a writer adding an `ipfs://` MIRROR **SHOULD** also attach the matching `cid` PROPERTY (§4.2).
- Decision record: [`../../../contracts/docs/adr/0064-content-hash-self-describing-encoding.md`](../../../contracts/docs/adr/0064-content-hash-self-describing-encoding.md) (Accepted).
- The spec's own motivation (§1): PROPERTY values are **non-revocable** (ADR-0052) — a value minted under a wrong format is permanent; "This spec MUST be pinned before any durable data is seeded under these keys."

**[A]** No code anywhere in the workspace emits `f1220`. `grep -rl f1220` across contracts, sdk, client, content, datasets, devnet, hackathon hits **only** spec/ADR/FUTURE_WORK prose (contracts repo + one worktree copy). There is currently **zero conformant writer**.

---

## 2. Writer / verifier inventory

| # | Code path | Role | Format emitted/expected | Callers / trigger | Live or dead | Grade |
|---|---|---|---|---|---|---|
| W1 | [`../../../contracts/packages/nextjs/utils/efs/transports.ts`](../../../contracts/packages/nextjs/utils/efs/transports.ts) `computeContentHash` (line 106) | compute | **keccak-256, `0x`-prefixed 64-hex** | `lib/efs/uploadOnchainFile.ts:40,677` (upload flow); `components/explorer/CreateItemModal.tsx:16,318,360` (paste/import flow) | **LIVE** — *not* dead code (the "no callers" report checked only `utils/efs/`; the impl lives in `lib/efs/` and `components/`) | A |
| W2 | [`../../../contracts/packages/nextjs/lib/efs/uploadOnchainFile.ts`](../../../contracts/packages/nextjs/lib/efs/uploadOnchainFile.ts) lines 315, 362–376, 383, 677, 774 | write (PROPERTY `contentHash`) | `0x`-keccak string bound via key-anchor + PROPERTY + PIN (line 383 pushes it into `reservedKeys`) | Debug-UI file upload; the UI is multi-chain (fork 31337 / devnet 26001993 / **real Sepolia 11155111**) | LIVE. Also feeds the hash as `bytes32` to the legacy `dataByContentKey` read (lines 362–376, log-only) — that read breaks typewise the moment the value stops being `0x`+32-byte | A |
| W3 | [`../../../contracts/packages/nextjs/components/explorer/CreateItemModal.tsx`](../../../contracts/packages/nextjs/components/explorer/CreateItemModal.tsx) lines 318, 360, 954, 976 | write | same `0x`-keccak (falls back to `ZeroHash` when no bytes) | Debug-UI "create item" paste path | LIVE | A |
| W4 | [`../../../datasets/deploy/packages/hardhat/scripts/seed-dataset.ts`](../../../datasets/deploy/packages/hardhat/scripts/seed-dataset.ts) line 257 `contentHash: keccak256(bytes)`; written as PROPERTY at line 389 | write | **keccak-256, `0x`-prefixed** | `seed:dataset` hardhat task ([`tasks/seedDataset.ts`](../../../datasets/deploy/packages/hardhat/tasks/seedDataset.ts)); runbook path in [`docs/DEPLOYMENT.md`](../../../datasets/deploy/docs/DEPLOYMENT.md) §"Dataset seeding" incl. `--network sepolia` | **LIVE — this is the `/games` seeder, and it already ran against real Sepolia** (see §3). Its idempotence check `decideSeedFileAction` ([`seed-dataset-lib.ts:145-156`](../../../datasets/deploy/packages/hardhat/scripts/seed-dataset-lib.ts)) compares raw strings (`normalizeHash` = trim+lowercase only) — switching the writer to `f1220` makes every already-seeded file read as `content-hash-changed` and re-seed | A |
| W5 | [`../../../sdk/packages/sdk/src/content/hash.ts`](../../../sdk/packages/sdk/src/content/hash.ts) `hashContent` (lines 21–24) | compute | **bare sha2-256, 64-hex, no `0x`** | SDK write path: [`writes/submitter.ts:50,102`](../../../sdk/packages/sdk/src/writes/submitter.ts), [`writes/props.ts:57`](../../../sdk/packages/sdk/src/writes/props.ts) | LIVE in the SDK (SDK itself is post-hackathon; no durable data written by it yet) | A |
| W6 | [`../../../contracts/packages/hardhat/scripts/simulate-file-browser.ts:156`](../../../contracts/packages/hardhat/scripts/simulate-file-browser.ts), `simulate-transports.ts:167`, `simulate-sort-overlay.ts:155` | compute (test fixtures) | keccak-256 | localhost-only simulation scripts | LIVE but **fork-only** (disposable) | A |
| W7 | [`../../../contracts/packages/hardhat/scripts/seed-impl.ts`](../../../contracts/packages/hardhat/scripts/seed-impl.ts) (demo tree) via [`deploy/10_seed_demo_tree.ts`](../../../contracts/packages/hardhat/deploy/10_seed_demo_tree.ts) | (non-)writer | **writes NO contentHash** — mints empty DATA only (lines 165–186); explicitly deferred as "future PROPERTY/SDK work" | every `yarn deploy` | Gated `localhost`/`hardhat` only (10_seed_demo_tree.ts:25–28) — cannot touch Sepolia | A |
| V1 | `transports.ts` `verifyContentHash` (line 111) | verify | keccak equality | **no callers anywhere** outside its own module | **DEAD** read path | A |
| V2 | [`../../../sdk/packages/sdk/src/content/hash.ts`](../../../sdk/packages/sdk/src/content/hash.ts) `verifyContent` + `asContentHash` (regex `^[0-9a-f]{64}$`, line 29) | verify | bare sha256 **only** — rejects both `0x…` (66 ch) and `f1220…` (69 ch) as `malformed-claim`; [`errors.ts:330`](../../../sdk/packages/sdk/src/errors.ts) says "not a bare SHA-256" | SDK `read()`/`readVerified()` | LIVE — today it would classify **both** the existing Sepolia data **and** future canonical values as malformed | A |
| V3 | `client/` (v1 Vite/Lit) | — | computes/verifies **nothing**; the only `contentHash` hits are generated ABI field names in [`../../../client/src/libefs/generated/deployedContracts.ts`](../../../client/src/libefs/generated/deployedContracts.ts) (legacy `bytes32 contentHash` outputs in view ABIs) | — | no hash code | A |
| V4 | `EFSFileView.getCanonicalData(bytes32)` (frozen, deployed; referenced in [`../../../sdk/packages/sdk/src/chain/abi/fileView.ts:235`](../../../sdk/packages/sdk/src/chain/abi/fileView.ts)) + `Indexer.dataByContentKey` | on-chain reader | `bytes32` key | legacy dedup index — **no longer written** since ADR-0049 (DATA is empty) | dead on-chain (frozen contract surface; harmless) | A |
| — | Manifests ([`../../../content/datasets/web-games/manifest.json`](../../../content/datasets/web-games/manifest.json), `manifest.schema.json`, `scripts/validate-manifests.mjs`) | — | contain **no hash fields** (chain-neutral by design) — hashes are computed at seed time | — | — | A |

Conflicting-spec docs: [`../../../sdk/docs/adr/0006-content-hash-bare-sha256.md`](../../../sdk/docs/adr/0006-content-hash-bare-sha256.md) (Accepted, **2026-06-10**) and [`../../../sdk/docs/specs/content-hash.md`](../../../sdk/docs/specs/content-hash.md) mandate bare sha256 — both **predate** the 2026-06-20 contracts ratification and are now contradicted by it. The stale copy of the contracts repo inside `datasets/deploy/` (its `specs/overview.md` still says "`contentHash` (e.g. keccak256)") predates specs/10 entirely, which is how W4 was written keccak in good faith.

**Three-way divergence, zero conformance**: debug UI + dataset seeder write `0x`-keccak; SDK writes/verifies bare sha256; the ratified canon is `f1220` sha256 multihash. No two of the three interoperate.

---

## 3. Durable Sepolia contamination — CONFIRMED (the central finding)

All queries below were run 2026-08-07 against **real Sepolia** (public RPC `ethereum-sepolia-rpc.publicnode.com`) using the frozen-deployment records in [`../../../datasets/deploy/packages/hardhat/deployments/sepolia/`](../../../datasets/deploy/packages/hardhat/deployments/sepolia/) — Indexer `0xc4DeaBB482C2FA74690629eEa662efb166BD658a`, EdgeResolver `0xD6643DB36B20895E3E46aD08cdD4ED4BC1dBB7F1`, EAS `0xC2679fBD37d54388Ce493F1DB75320D236e1815e`.

**[A] `/games` exists on real Sepolia and is fully seeded with keccak contentHash values:**

- Root anchor `0x152ff2d9…93de6` → `games` anchor `0xe11dfbe2a942eed3fa441951e21a06c6f5e29c51dd14702dda987a62a25b4fcc`; `getChildCountBySchema(games, DATA_SCHEMA)` = **15** (all 15 games).
- `snake.html`: file anchor `0x6accf851…35eb6` → placement DATA `0xd9bef0af…3a406` → `contentHash` key anchor `0x327a274f…281f4` → bound PROPERTY UID `0x27391d51…ba975` with value string **`0x8778567d6fa04823d5ce3ba80f2b9837fa2392aa3ec8d223cc14258bf4603f6c`** — byte-identical to `keccak256` of `datasets/web-games/snake.html`. Attester (curator EOA) **`0x11CbE1b619bb9fe79e2F4C22c9A62412b3E79912`**, attested **2026-06-23T23:31:24Z** — i.e. **three days AFTER James ratified `f1220`** (2026-06-20).
- `tetris.html`: same walk; on-chain value `0x02b911a9…00f57f` = local keccak (local sha256 differs: `557384e8…`). Second independent confirmation.
- **[B]** The other 13 game values are keccak too (same seeder, same run — mechanism identical; only 2/15 were decoded).

**[A] The contamination is not limited to `/games`.** All four dataset anchors from the manifests exist on Sepolia with DATA-typed children: `/games` **15**, `/whitepapers` **40**, `/standards` **10**, `/cypherpunk` **2** — **67 files** total seeded through W4. **[B]** all 67 carry `0x`-keccak `contentHash` PROPERTYs.

**[A] Permanence:** PROPERTY is non-revocable (ADR-0052) — the 67 keccak strings are permanently interned on Sepolia. Only the PIN *binding* is revocable/supersedable; remediation happens at the binding, exactly as ADR-0052 designed.

**[A] Mitigating fact — the canonical digests are already on-chain.** The seeder pinned with `cid-version=1` ([`seed-dataset-lib.ts:192`](../../../datasets/deploy/packages/hardhat/scripts/seed-dataset-lib.ts)); snake's MIRROR (UID `0xaade380f…76797`) carries `ipfs://bafkreiearitxfztizwp4lwbxgf2bprg2bqf4m6rqhnteyffcswos76txiy`, whose decoded bytes are `0x01 0x55 0x12 0x20` + digest `808a2772e668cd9fc5d837317417c4da0c0bc67a303b664c14a2959d2ffa7746` = **exactly `sha256(snake.html bytes)`** (verified). So every file's canonical `f1220` value is derivable trustlessly from its already-attested CIDv1 raw mirror — no dependence on local files for remediation. (This also empirically falsifies SDK ADR-0006's "the IPFS-interop rationale is false" claim for the raw-codec small-file case: here the CID digest *is* `sha256(file bytes)`.)

**[A] The tracked assumption is falsified.** [`../../../contracts/docs/FUTURE_WORK.md`](../../../contracts/docs/FUTURE_WORK.md) lines 137–139 track the writer gap but say "the debug UI runs on the weekly-reset devnet, so this is pre-mainnet hardening, **not a permanent-data emergency**." That was written without knowledge of the 2026-06-23 real-Sepolia dataset seeding; 67 durable non-canonical values now exist. (The seed run also was never recorded in [`../../../content/deployments/`](../../../content/deployments/README.md), which contains only its README — the suggested `deployments/<chain-id>/<dataset>.json` records were never committed.)

**[A] Local/fork writes (disposable, no action needed):** simulate scripts (W6), demo-tree seed (W7 — writes no hashes anyway), debug-UI use on 31337/26001993. Devnet 26001993 resets weekly by design.

Side observation **[A]**: the seeded copy `datasets/web-games/` differs from `content/datasets/web-games/` in 8 files (README, bomberman, doodle-jump, frogger, infernal-throne, manifest, pong, tetris — `diff -q`). A re-seed from `content/` will mint new DATA + hashes for those regardless of the format question; which copy is source-of-truth for the arcade should be settled first (other lane's concern; noted because the hash-skip logic interacts with it).

---

## 4. Smallest safe reconciliation

Principle: the *values* on Sepolia can't be deleted, but nothing reads them today (V1 dead, V2 rejects everything non-bare, client verifies nothing, router never touches `contentHash`). So there is no runtime breakage — the emergency is only that **every further durable write compounds the cleanup**. Fix writers before any more durable seeding; remediate bindings at leisure.

**Ordered plan (smallest change set per step):**

1. **[Gate for `/games` durable work — datasets/deploy repo]** Fix W4 before any further `seed:dataset --execute` on Sepolia or devnet:
   - `seed-dataset.ts:257`: `keccak256(bytes)` → `"f1220" + sha256hex(bytes)` (node `crypto`, no new dep).
   - `seed-dataset-lib.ts` `decideSeedFileAction`/`normalizeHash`: compare **digest-equivalence across formats** (extract digest from `f1220…`/`f1b20…`/`0x…`/bare forms; a legacy on-chain keccak value should compare via keccak, not force a false `content-hash-changed` rewrite of all 67 files — or, if re-binding is *wanted* (step 4), make that an explicit `--rebind-hash` decision, not an accident).
   - While in there: also emit the `cid` PROPERTY (specs/10 §4.2 SHOULD — the seeder already has the CID in hand at `seed-dataset.ts:368`).
2. **[contracts repo — Ephemeral, but it can write real Sepolia]** Fix W1–W3: `computeContentHash` → return canonical `f1220` string (type widens from `` `0x${string}` `` to `string`); drop the dead `dataByContentKey` read (`lib/efs/uploadOnchainFile.ts:362–376`) which needs a `bytes32` and dies with the new format; update `CreateItemModal` paste path + the zero-sentinel checks (`contentHash !== zeroHash` at lines 362/383 become empty-string checks). This is already tracked in FUTURE_WORK.md:137–139 — execute it.
3. **[sdk repo]** Supersede ADR-0006 (see §5): `hashContent` → `f1220`-prefixed; `asContentHash` → accept `f1220`+64hex (canonical) and optionally `f1b20`/`b…` per specs/10 read rules; `verifyContent` dispatches on multihash code; decide explicitly whether the 67 legacy Sepolia keccak values verify as a tolerated legacy form (`f1b20`-equivalent semantics) or report `malformed-claim`. Update `docs/specs/content-hash.md`. Must land before the SDK writes or verifies anything durable — not strictly before `/games` seeding.
4. **[Remediation of existing Sepolia data — optional, no deadline]** From curator EOA `0x11CbE1b6…9912`, for each of the 67 DATAs: attest a new PROPERTY `f1220<digest>` (digest extractable from the file's own on-chain CIDv1 mirror, §3) and re-PIN the `contentHash` key slot (cardinality-1 supersession, O(1)). Old keccak values stay interned but unbound — the ADR-0052-sanctioned outcome. ~134 attestations. Doable in the fixed seeder as a `--rebind-hash` pass.
5. **[hygiene]** Correct FUTURE_WORK.md:137's "not a permanent-data emergency" framing; record the 2026-06-23 seed run (and any re-run) under `content/deployments/11155111/`; refresh the stale specs snapshot inside `datasets/deploy/` (its `specs/overview.md` still prescribes keccak by example).

**What MUST land before seeding `/games` durably: step 1 only.** Steps 2–3 must land before their respective surfaces (debug UI on Sepolia for content work; SDK writes/verified reads) are used in anger; step 4 is cleanup that can ride the same seeder run.

---

## 5. Does SDK ADR-0006 need supersession? — YES

- It directly contradicts the later, James-ratified upstream canon (contracts ADR-0064 + specs/10, 2026-06-20 vs. ADR-0006's 2026-06-10) on the exact question it decides.
- Its own Consequences section anticipated this: it surfaced the choice upstream "as an ADR-0049 follow-up … so EFS stays consistent rather than the SDK diverging." Upstream then decided the *other way*. Under the project's own governance ("specs are authoritative"; ADRs immutable → supersede), the SDK must write a superseding ADR adopting the multibase-multihash format and mark 0006 `Superseded by ADR-00NN`; `docs/specs/content-hash.md` is rewritten to point at contracts specs/10 as the format authority.
- The superseding ADR should note the empirical corrections: (a) for CIDv1 raw-codec content the CID digest **is** `sha256(file bytes)` (verified on-chain, §3), so the interop benefit ADR-0006 dismissed is real for the small-file/raw case; (b) 67 legacy `0x`-keccak values exist durably on Sepolia and the read path needs an explicit stance on them.

---

*Correction to the orchestrator's context: `computeContentHash` is NOT dead code. The grep that found "no callers" searched only `utils/efs/`; the uploader implementation lives at `packages/nextjs/lib/efs/uploadOnchainFile.ts` (line 677) and `packages/nextjs/components/explorer/CreateItemModal.tsx` (lines 318/360), both of which call it and bind the result on-chain.*


---

> **Update (2026-08-07, later the same day):** step 3 (SDK supersession) is in flight — a concurrent SDK session's working tree already emits `f1220` from `hashContent`, verifies at digest level, and adds ADR-0016 superseding ADR-0006. Steps 1 (datasets seeder — THE gate), 2 (debug-UI writer), 4 (rebind), and 5 (hygiene/receipts) remain open as written.
