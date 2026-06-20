# EFSBytesStore — SDK follow-up hand-off (re-vendor + reader decision)

**Status:** hand-off (ready for `@efs/sdk`)
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

**Creation bytecode** — `artifact.bytecode`, **3248 bytes**, **sha256 `acef9afbd9d1a1bb7459e858243ca44fefd6fb5fa9a82ced52715065179419d6`**.

> **Re-vendor instruction (do NOT trust a pasted blob — lift from the artifact):**
> ```bash
> # contracts repo, on the merged branch:
> cd packages/hardhat && npx hardhat compile
> node -e "const a=require('./artifacts/contracts/EFSBytesStore.sol/EFSBytesStore.json'); \
>   const c=require('crypto'); \
>   console.log('sha256', c.createHash('sha256').update(a.bytecode).digest('hex')); \
>   console.log(a.bytecode);"
> ```
> Confirm the printed sha256 equals `acef9afb…419d6`, then copy `a.bytecode` into `EFS_BYTES_STORE_BYTECODE`. The bytecode embeds a solc metadata hash, so it changes whenever the source or compiler settings change — always re-derive from the artifact of the exact merged commit. (This spec deliberately does **not** embed the hex: an earlier draft's pasted blob drifted twice during review. The sha256 above is the authoritative pin.)

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

How a standard client reads the bytes:
1. Call `resolveMode()` → `bytes32("5219")` (`0x3532313900…00`) ⇒ use the 5219/manual flow.
2. Call `request([], [])` (path segments + query params; **the store ignores both** — a byte store is one file, any path resolves to the whole file).
3. Decode the return as `(uint16 statusCode, bytes body, (string,string)[] headers)`.
   - `statusCode == 200`.
   - `body` is the **raw file bytes** — `bytes`, binary-safe, no base64 / UTF-8 transform. (Verified against the `web3protocol-js` reference decoder `src/mode/5219.js`, which decodes the return as `[{uint16},{bytes},{tuple[]}]` and enqueues the body via `hexToBytes(...)` as raw bytes — see ADR-0057 §"binary over ERC-5219".)
   - `headers` contains exactly one entry: `Content-Type` = the store's constructor MIME (or `application/octet-stream` if empty).
   - **Error path:** if any chunk address has no deployed code (`extcodesize == 0` — a corrupt/incomplete store), `request()` returns `(500, "Chunk contract has no code", [])` rather than a silently truncated 200 — matching the router's "Storage contract has no code" 500. A 1-byte STOP-only chunk is a *valid* empty payload (contributes nothing, still 200). Standard clients should treat `statusCode != 200` as a failed fetch.

> **Selector note:** the EIP-5219 *text* declares the body as `string`; we return `bytes`. This does **not** change the selector (`request(string[],(string,string)[])` = `0x1374c460` either way — selectors ignore return types), so we are call-compatible with standard clients, and every real client already decodes `bytes` (that's the whole point — `string` mangles binary). statusCode is `uint16` to match the reference decoder exactly.

> **chainId caveat:** a bare `web3://<store>` defaults to **chainId 1** (mainnet) per EIP-4804. For the store on Sepolia/devnet, the shared URL must carry the chain: `web3://<store>:<chainId>` (e.g. `:11155111`). ADR-0057 uses the `:<chainId>` form.

The contracts repo proves both paths round-trip (single + multi-chunk + interleaved-empty-chunk + non-UTF-8 binary with embedded `0x00` + the no-code 500 guard): `contracts/packages/hardhat/test/EFSBytesStore.test.ts` (13 tests). The router still serves `web3://<router>/<path>` for an on-chain-stored file: `EFSRouter.test.ts`.

---

## 3. Precise `@efs/sdk` changes

> File line numbers below are from the SDK repo at the time of writing — confirm by symbol, not line, since the SDK may have moved.

### 3a. Re-vendor `EFS_BYTES_STORE_BYTECODE` + thread `contentType` through the deploy — **required**

**File `packages/sdk/src/writes/onchain-bytecode.ts`:**
- Replace `EFS_BYTES_STORE_BYTECODE` with the new artifact bytes (§1; lift from the artifact, verify sha256 `acef9afb…419d6`). The current constant is still the **old `MockChunkedFile` compile** (1-arg constructor, solc 0.8.28, no `resolveMode`/`request`/`contentType`).
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
- **Priority order is correctness → DX → performance.** `request()`'s only win is fewer RPCs (1 call vs. 1+2N). The current reader is already correct and **already handles N chunks** (`MAX_CHUNKS=4096`) — the brief's "SDK caps at one chunk" assumption is outdated. Trading a proven, router-identical path for an RPC-count optimization inverts the priorities.
- **`request()` weakens the hostile-input bound.** Today `MAX_CHUNKS` caps work *before* materializing bytes, and each `getCode` is naturally ~24 KB. A hostile `request()` returns an arbitrarily large `body` in one `eth_call` that crosses the wire and ABI-decodes in memory *before* the engine's post-fetch size cap can fire.
- **`request()` adds an untrusted content-type to discard.** The SDK's content-type is the lens-scoped PROPERTY; the `Web3Reader` seam deliberately returns only `Uint8Array`. `request()`'s `Content-Type` is mirror-supplied — exactly the value the SDK must ignore. Importing it is a confusing second source of truth for zero benefit.
- **Large-file robustness.** A streams chunk-by-chunk under predictable `eth_getCode` sizes; `request()` materializes the whole file in one `eth_call`, subject to node response-size/gas caps that can hard-fail large reassembly on public RPCs.

**No change to `web3.ts` is required now.** `parseWeb3Uri` already tolerates a trailing `/path` suffix, so it's forward-compatible.

**Future (only when it's real):** if/when the SDK needs to read *external* ERC-5219 resources or the router's `web3://<router>/<path>` form (neither exists in any current write path), add a **separate** `request()`-based reader behind the existing `transport.ts` `web3://` seam, **keyed on URI shape** (bare `web3://<addr>` → chunk reader; `web3://<addr>/<path…>` or flagged external → `request()` reader). Never make `request()` a silent fallback for the bare-store path. When you do, use `readContract` against an ERC-5219 ABI (let viem encode `0x1374c460`), reject `statusCode !== 200` as `Web3ReadError`, `hexToBytes(body)`, and **ignore** the `Content-Type` header. Worth a short SDK ADR recording "router parity > ERC-5219 dogfooding, until external/router-path resources exist."

### 3c. (Optional, separate) nextjs debug-UI upload path

Out of scope for `@efs/sdk`, noted for completeness: `contracts/packages/nextjs/lib/efs/sstore2.ts` + `uploadOnchainFile.ts` (+ `components/explorer/CreateItemModal.tsx`) also vendor the **old** `MOCK_CHUNKED_FILE_BYTECODE`/ABI (1-arg). Browser uploads still work (the router reads by interface), but the stores they deploy are **not** standalone ERC-5219 until that path is re-vendored too — same swap as 3a. Tracked as Ephemeral debug-UI work; do it whenever the SDK seam lands or sooner if browser-deployed stores must be standalone-resolvable.

---

## 4. Checklist for the SDK PR

- [ ] `EFS_BYTES_STORE_BYTECODE` re-vendored from the new artifact (sha256 `acef9afb…419d6` verified)
- [ ] `EFS_BYTES_STORE_ABI` (inline in `onchain.ts`) constructor gains the `contentType_` string input
- [ ] `OnchainWalletClient.deployContract` arg type widened to `[readonly Address[], string]`
- [ ] `storeOnchain` takes a `contentType` param; deploy call passes `args: [[chunkAddress], contentType]`
- [ ] Stale `AGENT-NOTE` in `onchain-bytecode.ts` removed
- [ ] `web3.ts` reader left on the direct chunk path (A) — no change (record the decision, optionally as an SDK ADR)
- [ ] A round-trip test: SDK writes a multi-chunk on-chain file, reads it back, contentHash verifies
- [ ] Changeset added (touches the published package)
