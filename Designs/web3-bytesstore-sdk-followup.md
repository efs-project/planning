# EFSBytesStore — SDK follow-up hand-off (re-vendor + reader decision)

**Status:** handoff (ready for `@efs/sdk`)
**Target repo:** sdk (`efs-project/sdk`)
**Produced by:** contracts agent on branch `claude/web3-erc5219-bytes-store`
**Depends on:** contracts ADR-0057 (Production ERC-5219 on-chain byte store), `[[web3-standards-compliance]]`, `[[sdk-read-surface]]`
**Date:** 2026-06-20

#status/handoff #kind/design

> This is the localized SDK slice of `[[web3-standards-compliance]]`. The contracts work (rename + ERC-5219 productionization + tests) is done on the branch above; this doc is the exact, self-contained hand-off so the SDK agent can act without re-deriving anything. **Nothing in the SDK repo was edited by the contracts agent** (per task boundary).

---

## 1. Compiled artifact + creation bytecode

**Artifact path (contracts repo):**
```
contracts/packages/hardhat/artifacts/contracts/EFSBytesStore.sol/EFSBytesStore.json
```
Compiler: solc `0.8.26`, optimizer on (runs 200), `viaIR: true` (the repo's standard settings — bytecode is solc-deterministic for fixed source + settings).

**Constructor (CHANGED from the old `MockChunkedFile`):**
```solidity
constructor(address[] chunks, string contentType_)
```
The old contract took only `address[]`. The new one takes a second `string` argument (the MIME the store reports on its ERC-5219 path; empty ⇒ served as `application/octet-stream`). The ABI input name is `contentType_` (trailing underscore avoids shadowing the `contentType()` getter); it's positional, so the deploy call just passes a second arg. **The writer's deploy call must encode the new 2-arg constructor.**

**Creation bytecode** — `artifact.bytecode`, **4159 bytes**, **sha256 `a7093cc6afaa4f36c07bd54f65eb2cecaecfe82277bf783e922a02bc741c4b6d`**.

> **Re-vendor instruction (do NOT trust a pasted blob — lift from the artifact):**
> ```bash
> # contracts repo, on the merged branch:
> cd packages/hardhat && npx hardhat compile
> node -e "const a=require('./artifacts/contracts/EFSBytesStore.sol/EFSBytesStore.json'); \
>   const c=require('crypto'); \
>   console.log('sha256', c.createHash('sha256').update(a.bytecode).digest('hex')); \
>   console.log(a.bytecode);"
> ```
> Confirm the printed sha256 equals `a7093cc6…4b6d`, then copy `a.bytecode` into `EFS_BYTES_STORE_BYTECODE`. The bytecode embeds a solc metadata hash, so it changes whenever the source or compiler settings change — always re-derive from the artifact of the exact merged commit. (This spec deliberately does **not** embed the hex: an earlier draft's pasted blob drifted twice during review. The sha256 above is the authoritative pin.)

### Function selectors (verified)

| Function | Selector | Used by |
|---|---|---|
| `chunkCount()` | `0xf91f0937` | router probe + SDK chunk reader |
| `chunkAddress(uint256)` | `0x2bfedae0` | router + SDK chunk reader |
| `contentType()` | `0x36ebffca` | (convenience getter) |
| `resolveMode()` | `0xdd473fae` | generic ERC-5219 clients |
| `request(string[],(string,string)[])` | `0x1374c460` | generic ERC-5219 clients |

---

## 2. ERC-5219 `request` interface — how a standard client fetches the file

The store now exposes the standard manual-mode (5219) surface so a **bare `web3://<store>` URL resolves in any EIP-4804/6860/5219 client** (`web3protocol-js`, w3link, eth.limo, evm-browser) with no EFS-specific code:

```solidity
function resolveMode() external pure returns (bytes32);          // returns "5219"
struct KeyValue { string key; string value; }
function request(string[] resource, KeyValue[] params)
    external view
    returns (uint16 statusCode, bytes body, KeyValue[] headers);
```

**`request()` is EIP-7617 paginated — one chunk per call.** This is the important change for an SDK reader: a single `request([], [])` does **not** return the whole file; it returns chunk 0 plus a `web3-next-chunk` header chaining to the next chunk. (This is so large files resolve under gateway `eth_call` caps. See ADR-0057 §"Why per-chunk".)

How a standard client reads the bytes (this is what `web3protocol-js` does internally):
1. Call `resolveMode()` → `bytes32("5219")` (`0x3532313900…00`) ⇒ use the 5219/manual flow.
2. Call `request([], [])`. Decode `(uint16 statusCode, bytes body, (string,string)[] headers)`:
   - `statusCode == 200`, `body` = **chunk 0's raw bytes** (binary-safe `bytes`, no base64/UTF-8 transform).
   - headers: `Content-Type` (from this first response), and **`web3-next-chunk: /?chunk=1`** iff more chunks remain.
3. While a `web3-next-chunk` header is present, re-call with the chunk param it encodes — the value is `/?chunk=<n>` (**leading slash**), which the client rewrites to `web3://<store>:<chainId>/?chunk=<n>` and parses into `request([], [("chunk","<n>")])`. Append each `body`. Stop when a response has no `web3-next-chunk`. Concatenated bodies = the whole file; the Content-Type is from step 2.
   - **Single-chunk store:** step 2 returns the whole (only) chunk with no next header — one call.
   - **Errors (no `web3-next-chunk`, so the client stops):** no-code chunk → `(500, "Chunk contract has no code")`; explicit out-of-bounds index → `(404, "Chunk out of bounds")`; empty store → `(200, "", [Content-Type])`.

> **Verified empirically:** the real `web3protocol@0.6.3` client paginated a multi-chunk store to the exact bytes (3 `request` calls, embedded `0x00` preserved), and `/?chunk=` (leading slash) is **required** — a bare `?chunk=` throws in the client's URL parser.

> **Selector note:** the EIP-5219 *text* declares the body as `string`; we return `bytes`. This does **not** change the selector (`request(string[],(string,string)[])` = `0x1374c460` either way — selectors ignore return types). statusCode is `uint16` to match the reference decoder.

> **chainId caveat:** a bare `web3://<store>` defaults to **chainId 1** (mainnet) per EIP-4804. For Sepolia/devnet the shared URL must carry the chain: `web3://<store>:<chainId>`.

The contracts repo proves both paths round-trip (single + multi-chunk pagination chain + interleaved-empty-chunk + non-UTF-8 binary with `0x00` + 404/500 edges): `contracts/packages/hardhat/test/EFSBytesStore.test.ts` (18 tests). The router still serves `web3://<router>/<path>` for an on-chain-stored file: `EFSRouter.test.ts` (61).

---

## 3. Precise `@efs/sdk` changes

> File line numbers below are from the SDK repo at the time of writing — confirm by symbol, not line, since the SDK may have moved.

### 3a. Re-vendor `EFS_BYTES_STORE_BYTECODE` + thread `contentType` through the deploy — **required**

**File `packages/sdk/src/writes/onchain-bytecode.ts`:**
- Replace `EFS_BYTES_STORE_BYTECODE` with the new artifact bytes (§1; lift from the artifact, verify sha256 `a7093cc6…4b6d`). The current constant is still the **old `MockChunkedFile` compile** (1-arg constructor, solc 0.8.28, no `resolveMode`/`request`/`contentType`).
- Drop the now-stale `AGENT-NOTE` ("kept verbatim, functionally identical") — it is no longer identical: the constructor ABI changed and `resolveMode`/`request`/`contentType` were added.

**File `packages/sdk/src/writes/onchain.ts` (the writer) — three coupled edits, all required or it won't typecheck:**
1. **The inline ABI.** The deploy ABI is `EFS_BYTES_STORE_ABI`, defined **inline in `onchain.ts`** (~L157), and its constructor is `inputs: [{ name: 'chunks', type: 'address[]' }]`. Add the second input: `{ name: 'contentType_', type: 'string' }`. (There is no separate `efsBytesStoreAbi` symbol — edit the inline constant.)
2. **The typed client interface.** `OnchainWalletClient.deployContract` (~L119–125) hard-types `args: readonly [readonly Address[]]` — a 1-tuple. Widen to `readonly [readonly Address[], string]`, or the deploy call won't typecheck.
3. **The deploy call + plumbing.** `storeOnchain(...)` (~L202) currently takes no `contentType` param and the deploy call (~L217–222) is `args: [[chunkAddress]]`. Add a `contentType` parameter to `storeOnchain` (thread it from the caller, which already computes the MIME for the lens-scoped `contentType` PROPERTY — single source of the value), and change the call to `args: [[chunkAddress], contentType]`. Empty string is acceptable (⇒ `application/octet-stream`).

viem deploy shape after the edits:
```ts
const hash = await walletClient.deployContract({
  abi: EFS_BYTES_STORE_ABI,                  // inline const, now 2-input constructor
  bytecode: EFS_BYTES_STORE_BYTECODE,
  args: [chunkAddresses, contentType],       // <-- NEW second arg
  account, chain,
})
```

This unblocks the SDK writing **standards-compliant** stores: every file the SDK uploads becomes a bare `web3://<store>` that resolves in any web3:// client, not just via the EFS router/SDK.

### 3b. Reader path: `src/mirror/web3.ts` — **KEEP the direct chunk reader (A). Do NOT switch to `request()`.**

Recommendation: **keep `chunkCount`/`chunkAddress` + `getCode`** as-is. Reasoning (brainstormed + reviewed, verified against the actual `web3.ts`):

- **Router parity is the binding invariant.** `web3.ts` exists to mirror `EFSRouter.sol`'s read branch *exactly*, and the router **kept** its extcodecopy path in ADR-0057 — it does **not** call `request()`. Switching the SDK to `request()` would make SDK and router read the same bytes via *different* code paths (raw chunk concat vs. the store's server-side reassembly + header logic) — a new divergence surface, the opposite of the stated invariant.
- **`request()` is now per-chunk paginated — it buys nothing over the direct reader.** Since `request()` returns one chunk per call (EIP-7617), reading a file through it means an even *more* involved walk than the direct path: call `request`, parse the `web3-next-chunk` header, decode `/?chunk=<n>`, re-call, concat — i.e. ~1 call per chunk **plus** header-parsing, vs. the direct reader's `chunkCount` + `chunkAddress(i)` + `getCode(i)`. The old "one `request()` call = whole file" performance argument is gone; switching would be *more* code for no win.
- **Router parity (restated).** The router reads via `chunkCount`/`chunkAddress` + `extcodecopy`, and `web3.ts` mirrors that exactly. Both the router and the direct SDK reader use the chunk interface; `request()`'s pagination is a *third* code path that only external generic clients need. Keeping the SDK on the chunk interface preserves the SDK↔router byte-for-byte parity invariant.
- **`request()` adds an untrusted content-type to discard.** The SDK's content-type is the lens-scoped PROPERTY; the `Web3Reader` seam deliberately returns only `Uint8Array`. `request()`'s `Content-Type` is the store's own constructor MIME — exactly the value the SDK must ignore. Importing it is a confusing second source of truth for zero benefit.
- **The direct reader already handles N chunks** (`MAX_CHUNKS=4096`) and is correct/tested — the brief's "SDK caps at one chunk" assumption is outdated. No reason to rewrite a proven path.

**No change to `web3.ts` is required now.** `parseWeb3Uri` already tolerates a trailing `/path` suffix, so it's forward-compatible.

**Future (only when it's real):** if/when the SDK needs to read *external* ERC-5219 resources or the router's `web3://<router>/<path>` form (neither exists in any current write path), add a **separate** `request()`-based reader behind the existing `transport.ts` `web3://` seam, **keyed on URI shape** (bare `web3://<addr>` → chunk reader; `web3://<addr>/<path…>` or flagged external → `request()` reader). Never make `request()` a silent fallback for the bare-store path. When you do, use `readContract` against an ERC-5219 ABI (let viem encode `0x1374c460`), **follow the `web3-next-chunk` pagination chain** (start `params=[]`, then `[("chunk", n)]` parsed from each `/?chunk=<n>` header, concat bodies until no next header), reject `statusCode !== 200` as `Web3ReadError`, `hexToBytes(body)` per page, and **ignore** the `Content-Type` header. Worth a short SDK ADR recording "router parity > ERC-5219 dogfooding, until external/router-path resources exist."

### 3c. (Optional, separate) nextjs debug-UI upload path

Out of scope for `@efs/sdk`, noted for completeness: `contracts/packages/nextjs/lib/efs/sstore2.ts` + `uploadOnchainFile.ts` (+ `components/explorer/CreateItemModal.tsx`) also vendor the **old** `MOCK_CHUNKED_FILE_BYTECODE`/ABI (1-arg). Browser uploads still work (the router reads by interface), but the stores they deploy are **not** standalone ERC-5219 until that path is re-vendored too — same swap as 3a. Tracked as Ephemeral debug-UI work; do it whenever the SDK seam lands or sooner if browser-deployed stores must be standalone-resolvable.

---

## 4. Checklist for the SDK PR

- [ ] `EFS_BYTES_STORE_BYTECODE` re-vendored from the new artifact (sha256 `a7093cc6…4b6d` verified)
- [ ] `EFS_BYTES_STORE_ABI` (inline in `onchain.ts`) constructor gains the `contentType_` string input
- [ ] `OnchainWalletClient.deployContract` arg type widened to `[readonly Address[], string]`
- [ ] `storeOnchain` takes a `contentType` param; deploy call passes `args: [[chunkAddress], contentType]`
- [ ] Stale `AGENT-NOTE` in `onchain-bytecode.ts` removed
- [ ] `web3.ts` reader left on the direct chunk path (A) — no change (record the decision, optionally as an SDK ADR)
- [ ] A round-trip test: SDK writes a multi-chunk on-chain file, reads it back, contentHash verifies
- [ ] Changeset added (touches the published package)
