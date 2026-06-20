# web3:// standards compliance — production ERC-5219 EFSBytesStore

**Status:** review
**Target repos:** contracts, sdk
**Depends on:** [[sdk-read-surface]], ADR-0056 (mirror scheme gate removed)
**Reviewers:** —
**Last touched:** 2026-06-19 — sdk-designer

#status/review #kind/design

## Problem

EFS's on-chain content storage should be readable by **any standard `web3://` client/library/gateway** (the EIP-4804 / ERC-6860 / ERC-5219 ecosystem — `web3protocol`, w3link, evm-browser, eth.limo web3:// support), not just by EFS's own router and SDK. Verified state (2026-06-19):

- **`EFSRouter` IS standard** — `resolveMode() → "5219"`, implements ERC-5219 `request()`. So `web3://<router>/<path>` already resolves EFS content in any standard client. ✓
- **The stored MIRROR pointer is NOT standalone-standard.** A `web3://` mirror points at the bare chunk store (`MockChunkedFile`), which exposes only `chunkCount()`/`chunkAddress()` — **no `resolveMode`/`request`**. Only the router (or the SDK reader, replicating it) knows the reassembly convention. The router's read branch is also literally commented `"(Mocking EXTCODECOPY)"` and the contract is named `Mock…` — i.e. **the on-chain-storage path is mock-grade, not productionized.**

So a generic client handed one of our `web3://<store>` mirrors cannot fetch the bytes. We're standards-compliant at the router but not at the stored-content level.

## Proposal

Productionize the on-chain byte store as a standards-compliant web3:// resource, as part of the already-planned `MockChunkedFile → EFSBytesStore` rename:

1. **`EFSBytesStore` implements ERC-5219** (`resolveMode() → "5219"` + a `request()` that returns the reassembled file bytes with the correct `Content-Type` header) **in addition to** `chunkCount()`/`chunkAddress()` (kept for the router's efficient `extcodecopy` path). Net: `web3://<EFSBytesStore>` resolves to the exact file bytes in any standard web3:// client — no EFS-specific code on the reader's side. The agent picks the EIP-4804/5219 mechanism that correctly serves **arbitrary binary** content (this is the one subtlety — ERC-5219's `string body` vs binary; validate against the spec + a real client).
2. **Finalize the router's `web3://` read branch** if the `"(Mocking EXTCODECOPY)"` path is placeholder-grade — make it production (or have the router read via the store's standard interface). `EFSRouter` is redeployable (not frozen), so this is safe.
3. **Freeze-safety:** `EFSBytesStore` is a per-file *deployable helper* — its address is never hashed into a schema UID (only the target of a `web3://` mirror string). So creating/replacing it touches nothing frozen. The router is also redeployable.
4. **SDK slice (localized, do later):** once `EFSBytesStore` is ERC-5219, re-vendor its creation bytecode into `packages/sdk/src/writes/onchain-bytecode.ts`, and either keep the direct chunk reader (`src/mirror/web3.ts`) or switch it to the standard `request()` path. The reader + bytecode are isolated, so this is a small, low-risk follow-up — the SDK is decoupled from the contract internals by the mirror/fetch boundary.

## Open questions

- [ ] **Binary over ERC-5219.** Confirm the exact mechanism for returning arbitrary bytes (ERC-5219 `request` body encoding, content-type header) so a standard client gets the raw file, not a mangled string. Test against the `web3protocol` library.
- [ ] **Router read path.** Is the `"(Mocking EXTCODECOPY)"` branch placeholder or final? Productionize if needed.
- [ ] **Multi-chunk over the standard interface** — `request()` must reassemble all chunks (the SDK caps at one chunk for now; the contract should handle N).

## Pre-promotion checklist

- [ ] Verified `web3://<EFSBytesStore>` resolves in a real standard web3:// client (`web3protocol` / w3link)
- [ ] Router web3:// branch productionized (or confirmed final)
- [ ] Freeze-safety confirmed (no schema-UID/address coupling)
- [ ] SDK re-vendor + reader path follow-up filed

## Implementation notes

Contracts-led; the SDK follows. Coordinate with the freeze agent (the `EFSBytesStore` rename is already in their queue — this upgrades it from rename to "production ERC-5219 store"). No deploy by the building agent (James runs deploys). ADR-first (Durable surface).

```
- [ ] contracts#NNN — EFSBytesStore (ERC-5219 + chunk interface) + router web3 finalize + tests + ADR
- [ ] sdk#NNN — re-vendor EFSBytesStore bytecode; reader uses standard path (localized)
```
