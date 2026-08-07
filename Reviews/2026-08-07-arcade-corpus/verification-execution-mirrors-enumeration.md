# Verification, Mirror Fallback, and Enumeration — EFS v1 actual behavior

Purpose: verify what EFS v1 actually does today for (a) byte verification before execution, (b) mirror failure/fallback, (c) safe bounded enumeration — and derive the RPC budget and gap list for the Arcade acceptance criteria.

Evidence grades: **A** = verified from source/primary, **B** = strong inference from source, **C** = uncertain.

---

## 1. Verification before execution

### 1.1 `verifyContentHash` has zero callers anywhere (A)

- Defined at [transports.ts:111](../../../contracts/packages/nextjs/utils/efs/transports.ts) (`verifyContentHash(data, expected)` → compares `keccak256(data)` to `expected`).
- Full-tree grep (`verifyContentHash|computeContentHash`) across `contracts/packages/nextjs`, `client/`, and `sdk/` (node_modules/.next/dist excluded): `verifyContentHash` appears **only** at its definition and its internal self-reference (transports.ts:111–112). No render, fetch, or test path calls it.
- **Correction to prior intake note:** `computeContentHash` is **not** dead code — it has two live *write-path* callers:
  - [CreateItemModal.tsx:318, 360](../../../contracts/packages/nextjs/components/explorer/CreateItemModal.tsx) — paste/upload preview hash.
  - [uploadOnchainFile.ts:677](../../../contracts/packages/nextjs/lib/efs/uploadOnchainFile.ts) — the hash attested as the `contentHash` PROPERTY at upload.
  What has no callers is the **verify** (read-side) half only. And since `computeContentHash` = keccak256 `0x…` hex, every contentHash attested through the debug UI today is in the **non-canonical** format (specs/10 canonical is multibase-multihash `f1220<sha2-256>`; keccak alternate would be `f1b20…`). Raw `0x…` keccak is not even the spec's keccak encoding — a spec-10 verifier cannot classify it. (Cross-lane tie-in with the contentHash-conflict finding.)

### 1.2 No render path verifies fetched bytes (A)

The entire read pipeline is:

1. [fetchFileContent.ts:148–301](../../../contracts/packages/nextjs/utils/efs/fetchFileContent.ts) — calls `EFSRouter.request()`, reassembles SSTORE2 chunks, or follows `message/external-body` → `resolveGatewayUrl` → `globalThis.fetch(gatewayUrl)` (line 220). Bytes are size-capped (`maxBytes`) but **never hashed or compared to anything**. They are also cached for 60 s (lines 64–67, 108–126) — a tampered fetch is cached and re-served.
2. [FileBrowser.tsx:780–874](../../../contracts/packages/nextjs/components/explorer/FileBrowser.tsx) — component wrapper; bytes → blob URL or text (lines 853–860), zero verification.
3. Render: unverified bytes go straight into a sandboxed iframe — HTML via `srcDoc` at [FileBrowser.tsx:2135–2141](../../../contracts/packages/nextjs/components/explorer/FileBrowser.tsx) (`sandbox="allow-scripts"`, no `allow-same-origin` — the ADR-0056 render-isolation half **is** implemented), PDF via blob URL iframe at 2109–2116, second render site at 2263–2280. Images/video/audio via blob/data URLs (2086–2128).
4. [useItemOverview.ts:75–86](../../../contracts/packages/nextjs/hooks/efs/useItemOverview.ts) — same util, same absence of verification, for the auto-loading Overview pane.

The v1 `client/` repo (hibernating Vite/Lit) has **no byte-fetch or render path at all** — `src/` contains only topic browsing (`src/libefs/topic.ts`), kernel/wallet glue, and generated ABIs; the only `contentHash` hits are ABI strings in `src/libefs/generated/deployedContracts.ts` (A).

So: **isolation yes, integrity no.** A mirror (gateway, HTTPS host, or IPFS gateway man-in-the-middle) can serve arbitrary bytes and they will execute (scripts enabled) in the sandbox.

### 1.3 Structural obstacle: the render path never learns the DATA UID (A)

`EFSRouter.request()` returns only `(statusCode, body, headers)` — see the serving path at [EFSRouter.sol:386–402](../../../contracts/packages/hardhat/contracts/EFSRouter.sol). The DATA UID and winning attester (both needed to look up the lens-scoped `contentHash` PROPERTY) are resolved internally by `_findDataAtPath` (EFSRouter.sol:1076 region) and **discarded**. The client-side `fetchFileContent` therefore cannot verify even if it wanted to, without a parallel resolution:

- `EFSFileView.getFilesAtPath(anchorUID, attesters, schema, cursor, maxItems)` ([EFSFileView.sol:1091](../../../contracts/packages/hardhat/contracts/EFSFileView.sol)) returns the DATA UID **and the winning placement attester** (`bufAttesters`, lines 1155–1161) — exactly the pair needed to then read `contentHash` via `resolveAnchor(dataUID, "contentHash", PROPERTY_SCHEMA_UID)` → `EdgeResolver.getActivePinTarget` → `eas.getAttestation` (the same 3-read pattern the router uses for contentType at EFSRouter.sol:1300–1317).

### 1.4 Where verification must be inserted (B)

- **Choke point:** `fetchFileContent()` in [fetchFileContent.ts](../../../contracts/packages/nextjs/utils/efs/fetchFileContent.ts) — both render surfaces (preview pane + Overview) flow through it, and its docstring already says it is shaped toward the planned SDK `fetch(ref, opts)`. Insert after byte assembly (~line 293, before the cache write at line 299): resolve `(dataUID, attester)` via `getFilesAtPath`, read the attested `contentHash` PROPERTY, decode per specs/10 (`f1220`→sha2-256, `f1b20`→keccak-256), hash the assembled bytes, reject on mismatch **before** caching or returning. Also verify before *serving from* the 60 s cache is unnecessary if the cache is only ever populated post-verification.
- **Long-term owner:** the SDK (per specs/10 §"Who verifies, and when": verification is the consumer's job at read time; and the standing SDK-boundary ruling that fetch/resolution/hashing move into the SDK). The nextjs util is the interim host; the Arcade client should call whichever wrapper enforces verify-before-return.
- **Scope note:** on-chain SSTORE2 bodies come from chain consensus (integrity from the RPC's honesty only — a lying RPC is out of scope for v1); the mandatory-verify surfaces are gateway-fetched mirrors (ipfs/ar/https) and, cheaply, `data:` inline mirrors.

## 2. Mirror failure and fallback

### 2.1 How a mirror is picked (A)

Selection happens **on-chain, per request, one winner**: `EFSRouter._getBestMirrorURI(dataUID, attester)` at [EFSRouter.sol:1225–1292](../../../contracts/packages/hardhat/contracts/EFSRouter.sol):

- Scans the append-only per-attester mirror index in pages of 50, capped at `MAX_PAGES = 10` → **500 mirrors max scanned** (lines 1237–1244; ADR-0020).
- Priority ladder web3(0) > ar(1) > ipfs(2) > magnet(3) > everything-else(4) (lines 1266–1270).
- One liveness check exists **only for same-chain web3:// mirrors**: a dead store (`candidate.code.length == 0`) is skipped so a lower-priority mirror can serve (lines 1276–1284, ADR-0058). That is the *only* fallback in the system.
- Returns a **single URI**. 404 if no mirrors, 500 "Stored mirror URI is invalid" if mirrors exist but none resolvable (EFSRouter.sol:400–402).

### 2.2 What happens when the chosen mirror 404s or hangs (A)

Client side, [fetchFileContent.ts:220–224](../../../contracts/packages/nextjs/utils/efs/fetchFileContent.ts):

```ts
const gatewayResp = await globalThis.fetch(gatewayUrl);
if (!gatewayResp.ok) throw new Error(`Gateway ${gatewayUrl} returned HTTP ${gatewayResp.status} …`);
```

- **HTTP error → immediate throw.** No retry, no alternate gateway, no fallback to the attester's next-priority mirror. The throw propagates to [FileBrowser.tsx:862–868](../../../contracts/packages/nextjs/components/explorer/FileBrowser.tsx) → `setFetchError(message)` → error panel. **Broken UI for that file**, even when the same attester has a healthy lower-priority mirror on-chain.
- **Timeout: none.** The `fetch` has no `AbortSignal`/timeout — a black-holing gateway hangs the preview until browser-default socket timeout (minutes). Cancellation exists only for "user clicked a different file" (`fetchIdRef`, FileBrowser.tsx:786, 836).
- The on-chain winner is re-evaluated per router call, so the only way a dead ar:// mirror stops being chosen is the attester revoking it. The client has no "skip this one" lever against the router.
- [MirrorsPanel.tsx](../../../contracts/packages/nextjs/components/explorer/MirrorsPanel.tsx) lists all mirrors via `getDataMirrorsAllAttesters` (line 42/155) — display/debug only, not a fetch path (and cross-attester, so per the lens-scoping invariant it must never become the trusted fetch path).

### 2.3 Fallback fix surface (B)

The on-chain reader for a client-side retry ladder already exists: `EFSFileView.getDataMirrors(dataUID, attester, …)` ([EFSFileView.sol:1267](../../../contracts/packages/hardhat/contracts/EFSFileView.sol)) — the lens-scoped mirror enumeration. A verifying client can enumerate the winning attester's mirrors, order by the same priority ladder, and try each with timeout + hash-verify; with verification in place, even mirror *ordering* stops being trust-relevant (any mirror producing bytes that hash correctly is acceptable — tampered mirror rejected, next mirror tried). No contract change needed.

## 3. Enumeration — what v1 can list safely and boundedly

### 3.1 On-chain caps (A)

[EFSFileView.sol](../../../contracts/packages/hardhat/contracts/EFSFileView.sol):

| Cap | Value | Line |
|---|---|---|
| `MAX_ATTESTERS_PER_QUERY` | 20 lenses per view call | 264 |
| `MAX_EXCLUDE_TAGS_PER_QUERY` | 8 exclude-tag predicates | 272 |
| `_FOLDER_SCAN_BUDGET_PER_CALL` (phase 0) | 2048 entries inspected/call | 291 |
| `_FILE_SCAN_BUDGET_PER_CALL` (phase 1) | 2048 entries inspected/call | 304 |
| Router mirror scan | 500 (10 pages × 50) | EFSRouter.sol:1241 |
| Router `MAX_LENSES` | 20 | EFSRouter.sol:187 |

- `getDirectoryPageBySchemaAndAddressList(parent, schema, attesters, cursor, maxItems)` (line 351) and `getDirectoryPageFiltered` (line 571) are opaque-cursor paginated (ADR-0036); `maxItems` bounds result size, the scan budgets bound work; a budget-burned page can legitimately return 0 items + non-empty cursor.
- `getFilesAtPath` (line 1091) is O(lenses): one O(1) PIN read per attester (line 1169), cursor = attester index.
- Each returned `FileSystemItem` (struct at lines 127–139) already carries `uid, name, parentUID, isFolder, hasData, childCount, propertyCount, timestamp, attester, schema` — built in `_buildFileSystemItems` (line 1024) at ~4 external reads per item **inside one eth_call** (`getAttestation` + 3 count reads, lines 1034–1044). Note `contentHash` in the struct is always `bytes32(0)` (line 1057) — vestigial post-ADR-0049.

### 3.2 Client hook (A)

[useLensesDirectoryPage.ts](../../../contracts/packages/nextjs/hooks/efs/useLensesDirectoryPage.ts): default `pageSize = 50n` (line 90), auto-advances budget-burned empty pages up to `MAX_AUTO_ADVANCE_PAGES = 20` (line 82), one `readContract` per page (lines 237–259).

**So yes: a catalog of 15–50 games in one folder is one or two `eth_call`s** for the listing itself (grade A). A fresh small directory won't burn phase budgets; 15–50 items fit one `pageSize=50` page.

### 3.3 Per-card metadata is where v1 explodes (A)

No multicall anywhere: `createClient` in [wagmiConfig.tsx:33–41](../../../contracts/packages/nextjs/services/web3/wagmiConfig.tsx) sets no `batch.multicall` and no http-batch option; every `readContract` is one HTTP round-trip. Grep for `multicall` across the nextjs package: only ABI entries in `deployedContracts.ts`.

Per-item property read patterns in use today:

- **Display name** ([useDisplayName.ts:157–243](../../../contracts/packages/nextjs/hooks/efs/useDisplayName.ts)): `PROPERTY_SCHEMA_UID` + `resolveAnchor(uid,"name")` + `getEAS` + per-lens (`getActivePinTarget` + `getAttestation`) — **3 + 2L sequential calls per target** (L = lenses). Used by TopicTree per node; FileBrowser rows use the anchor `name` from the listing struct instead (no per-row hook).
- **Any PROPERTY (order/label/description)** ([ListPreviewPane.tsx:542–577](../../../contracts/packages/nextjs/components/explorer/ListPreviewPane.tsx) `readEntryProperty`): `resolveAnchor` → `getActivePinTarget` → `getAttestation` = **up to 3 sequential calls per (container, key, lens)**. Its own comment concedes: "the codebase has no multicall helper here" (line 627–629).
- **contentType**: never read at listing time — only arrives in the router response headers when a file is opened (fetchFileContent.ts:208–209, 274).
- **Descriptive TAG filtering** ([FileBrowser.tsx:486–569](../../../contracts/packages/nextjs/components/explorer/FileBrowser.tsx) `resolveTagSet`): efficient set-shaped read — per tag name ≈ 1 `resolvePath` + per lens per bucket (`getActiveTagsCount` + paged `getActiveTagEntries`∥`getActiveTargetsByAttesterAndSchema`) ≈ **1 + 2·L·(1+~2) calls per tag**, NOT per item. On-chain exclusion via `getDirectoryPageFiltered` costs zero extra client calls (ADR-0054).

### 3.4 RPC budgets (B — counts from cited code; assumptions stated)

Assumptions: single folder, 2 lenses (`[user, system]`), no phase-budget burns, warm boot constants excluded (~6–10 one-time cached reads: schema UIDs, contract addresses), no JSON-RPC batching (verified absent).

**(i) Catalog page, 20 games incl. card metadata**

| Piece | Calls |
|---|---|
| Path walk to `/web-games/` (resolvePath per segment) | ~1–2 |
| Directory listing (name/isFolder/timestamp/attester included) | **1–2** |
| One "games" include-TAG set (optional) | ~7 |
| contentType badge per card (3-read pattern × 20) | +60 |
| PROPERTY display-name per card (useDisplayName pattern × 20, L=2) | +140 |
| Thumbnail per card (full router fetch each) | +20–100 eth_calls + ≤20 gateway fetches |

Bare catalog (names from anchor, no badges): **~4–10 calls — genuinely cheap.** Rich cards with today's per-item sequential patterns: **~70–210 calls**, dominated by the unbatched 3-read PROPERTY pattern. A rich Arcade catalog needs either JSON-RPC/multicall batching (config-level, 1 line in wagmiConfig + Promise.all restructuring), an aggregated view function, or cards that use only listing-struct fields.

**(ii) One game page (open + run one HTML file)**

- `data:` inline mirror (≤4 KB): 1 router eth_call, bytes inline → **~2–3 calls** total with path resolution.
- SSTORE2 on-chain: 1 eth_call per ~24 KB chunk (EIP-7617 loop, fetchFileContent.ts:168–194) → 100 KB game ≈ **~5–7 calls**.
- External mirror (ipfs/ar/https): 1 router eth_call + 1 gateway HTTP fetch → **~3 calls + 1 fetch**.
- +1 router call for the Overview `README.md` probe (useItemOverview fires on selection).
- Adding verify-before-execute as in §1.4: +1 `getFilesAtPath` + 3 property reads = **+4 calls** per game open.

**(iii) Comment thread, 50 entries**

- LIST/LIST_ENTRY-based (the shape ListPreviewPane implements): `getMode` + `getListAttesters` + `entries` page (PAGE=200, so 1 call) ≈ 4 calls; enrichment order+label = 50 × 2 × ≤3 = **≤300 calls** (ListPreviewPane.tsx:630–636); comment *bodies* as a third per-entry PROPERTY ≈ +150, or as DATA fetched via router ≈ +50 eth_calls (+gateway). **Total today: ~350–500 sequential RPC calls.** Unusable without batching; fine (~4–10 round-trips) with multicall since every read is a view call.
- TAG-based (comments as weighted TAGs on the game's anchor/DATA): membership+weights come set-shaped ≈ ~5 calls per lens (resolveTagSet pattern), but per-comment author/timestamp needs `getAttestation` per tagUID (+50) and bodies still need per-comment DATA fetches (+50 router calls). **~105+ calls** — better skeleton, same per-entry body problem.

## 4. Gap list vs Arcade acceptance criteria

| Acceptance criterion | v1 status | Gap / fix | Where it belongs |
|---|---|---|---|
| Verify bytes vs attested contentHash before execution | **Absent.** `verifyContentHash` uncalled; no render path hashes bytes (§1.1–1.2) | Insert verify in the fetch choke point post-assembly/pre-cache; needs parallel `(dataUID, attester)` resolution via `getFilesAtPath` since router discards them (§1.3–1.4) | SDK (owns fetch/hash per boundary ruling); interim: `fetchFileContent.ts`. No contract change. |
| Tampered-mirror rejection | **Absent** — follows from above; tampered gateway bytes execute in sandbox (isolation ≠ integrity) | Same fix; reject + surface "mirror failed verification" + try next mirror | Same as above |
| Fallback to next mirror on failure | **Absent.** Router returns 1 URI; client throws on `!ok`; no timeout at all (§2.2) | Client-side ladder over `EFSFileView.getDataMirrors(dataUID, attester)` with per-mirror timeout (AbortSignal) + verify; only same-chain dead-web3-store skip exists today (§2.1) | Client/SDK fetch layer. On-chain reader already exists; no contract change. |
| Verifiable hash format | **Broken at the write path**: attested hashes are raw `0x` keccak ([uploadOnchainFile.ts:677](../../../contracts/packages/nextjs/lib/efs/uploadOnchainFile.ts)), not specs/10 `f1220` sha2-256 — a spec-conformant verifier can't even classify them (§1.1) | Fix `computeContentHash` write path to emit `f1220<sha2-256>`; verifier accepts `f1220`/`f1b20`, treats bare `0x` as unverifiable-legacy | Client write path now; SDK canonically. (Overlaps the contentHash-conflict lane.) |
| Bounded catalog enumeration | **Present and solid**: cursor pagination, scan budgets, lens caps (§3.1); 20-game listing = 1–2 eth_calls | None for the listing itself | — |
| Rich card metadata at reasonable cost | **Weak**: no multicall/batch anywhere; 3-read-per-property sequential patterns → ~70–210 calls for 20 rich cards, ~350–500 for a 50-entry thread (§3.3–3.4) | Enable viem `batch.multicall`/http batch (wagmiConfig) and/or an aggregated card-metadata view function; all reads are view calls so batching is purely a client/config change | Client config + SDK read API; optional new stateless view contract (redeployable, not Etched) |
| No shared trusted fetch service required | Consistent with v1 design: everything above is client/RPC-side; a new server-side service is **not** needed for any criterion | — | — |

**One-line verdict:** v1 enumerates safely and cheaply, but executes whatever the single router-chosen mirror serves — unverified, unretried, and untimed; all three Arcade acceptance gaps close in the client/SDK fetch layer with zero contract changes, and the write-path hash format must be fixed to make verification meaningful.
