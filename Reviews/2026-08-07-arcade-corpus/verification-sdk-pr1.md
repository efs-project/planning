# Verification — SDK PR #1 as v1 tooling for Arcade seeding/reading

Purpose: assess whether github.com/efs-project/sdk PR #1 ("Scaffold the EFS SDK monorepo") is safe to pin as the Arcade seeder/reader toolchain, with special attention to the contentHash encoding divergence.

Evidence grades: **A** = verified from source/primary (gh API output, file reads, local test run), **B** = strong inference, **C** = uncertain.

## 1. PR state facts (grade A, via gh CLI 2026-08-07)

- State **OPEN**, `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, not draft. Author JamesCarnley. Base `main`, head `chore/scaffold` @ `5e6d64dfaad90e65e29c783d139f7884840ec333`. Created 2026-06-10, last updated 2026-08-07T22:19Z. 141 commits.
- CI: all 3 checks **pass** (run 28011663002) — "Changeset present", "Solidity (build, test, fmt)", "TypeScript (build, typecheck, test, lint)".
- Review threads: **146 total, 141 resolved, 5 unresolved** (4×P1, 1×P2). `reviewDecision` empty (no formal approval recorded). Zero issue comments.
- The 5 unresolved threads (paths + gist):
  1. **P1** `packages/sdk/src/content/hash.ts` — align contentHash with the ratified v1 `f1220` encoding (contracts specs/10 supersedes SDK ADR-0006). ← the exact divergence this review targets.
  2. **P1** `packages/sdk/src/reads/resolve.ts` — canonicalize anchor segments (NFC + canonical percent-encoding per contracts specs/02).
  3. **P1** `packages/sdk/src/writes/redirects.ts` — `redirects.set()` output not discoverable by `redirects.get()` (reverse-fan-in index not populated).
  4. **P1** `packages/sdk/src/reads/redirects.ts` — provisional follower diverges from ratified redirect-resolution spec (contracts specs/09: only `symlink` navigational).
  5. **P2** `packages/sdk/src/chain/deployments.ts` — stale Sepolia view addresses (confirmed below, §5).
- This is the **only** open PR on the repo.

## 2. Local checkout parity + tests (grade A)

- Local [`../../../sdk/`](../../../sdk/) is on branch `chore/scaffold` at `5e6d64d` — **exactly the PR head**, 0 commits apart (141 commits ahead of `origin/main`, matching the PR's commit count).
- Test suite run locally 2026-08-07: `pnpm --filter @efs/sdk test` → **593 passed, 3 skipped, 0 failed** (28 files + 1 skipped), ~5 s. No install fights; node_modules already present.

## 3. Capability/gap table vs an Arcade seeder's needs (grade A from source reads)

Client is namespaced (`efs.fs/lenses/eas/raw/lists/graph/props/...`); writes are type-gated on `walletClient` ([`../../../sdk/packages/sdk/src/index.ts`](../../../sdk/packages/sdk/src/index.ts)).

| Arcade need | SDK today | Status |
|---|---|---|
| Connect by chainId (Sepolia 11155111 / devnet 26001993) | Deployments registry seeds both; devnet = `{...SEPOLIA, chainId: 26001993}` (`chain/deployments.ts:135,144-145`) | ✅ (but see §5 stale views) |
| Resolve path → anchor | `reads/resolve.ts` (`resolvePathToAnchor`) | ✅ implemented (P1 thread: segment canonicalization missing) |
| List directory | `reads/list.ts`, on-chain `excludes` filter, overviews (`reads/overview.ts`) | ✅ |
| Fetch + verify bytes | `reads/fetch.ts` (`read/readBytes/readText/readJson`), verify fail-closed by default (`errors.ts:330-351` — `{verify:false}` to bypass) | ✅ but verification keyed to **bare-sha256** claims only (§4) |
| Write file (upload + placement + metadata + mkdir -p parents) | `writes/file.ts` (`writeFileTier1`): plans parents, computes contentHash, size, contentType; SSTORE2 on-chain auto-store under `write.onchainAutoLimit` | ✅ |
| Set properties / tags / pins / lists | `writes/props.ts`, `tags.ts`, `pins.ts`, `lists.ts`, `mirrors.ts`, `graph.ts` | ✅ |
| Receipts | `fs.write` returns `WriteReceipt`; receipt waits + partial-failure wrapping (changesets `guard-file-write-planning-and-receipt-waits`, `wrap-midwrite-abort...`) | ✅ |
| Mirror transports | `mirror/transport.ts`: `web3` (owned), `ipfs`/`ar`/`https` (gateway adopt), `data:` inline | ✅ for reads |
| **Gap:** default `web3://` write on Sepolia | `SEPOLIA.transports` intentionally absent — per-scheme `/transports/<scheme>` anchor UIDs are runtime EAS UIDs not in `docs/CHAINS.md`; a no-mirrors write needs `WriteOptions.transportDefinition` or throws `MissingTransport` (`chain/deployments.ts:87-91` comment) | ⚠️ seeder must supply the UID manually |
| **Gap:** `fs.preview()`, `efs.batch()`, `createEfsClient({fetch})`, `{verifier}`, sorts | throw `NotImplemented` (`index.ts:637,643,938,1001,1112`) | ⚠️ signature-locked stubs |
| **Gap:** write under a lens ≠ connected wallet | fails fast `NotImplemented` (`writes/file.ts` ~line 304-312) | acceptable — Arcade seeder signs as itself |
| **Gap:** indexer/reverse lookups | out of scope for v1 (overview.md "Doesn't (yet)") | acceptable |

Package: `@efs/sdk` v0.0.0, **not published to npm** (release workflow exists; PR unmerged) — pinning means pinning the git ref (grade A).

## 4. contentHash divergence assessment (grade A) — now THREE encodings

Canonical (James-ratified ADR-0064, 2026-06-20): `f1220<sha256-hex>` multibase-multihash — [`../../../contracts/specs/10-file-metadata-encoding.md`](../../../contracts/specs/10-file-metadata-encoding.md).

PR #1 **embeds the bare-sha256 divergence end-to-end**, not just in the ADR:

- **Constructor:** `hashContent()` returns viem `sha256` with `0x` stripped — bare 64-hex ([`../../../sdk/packages/sdk/src/content/hash.ts`](../../../sdk/packages/sdk/src/content/hash.ts) lines 22-24), branded type `ContentHash`.
- **Coercer:** `asContentHash()` regex `/^[0-9a-f]{64}$/` (hash.ts:29) — rejects `f1220…` (69 chars) and `0x…` (66 chars).
- **Verify path:** `verifyContent()` (hash.ts:45-55) classifies any non-bare-64-hex claim as `'malformed-claim'`; `readBytes` **fails closed** on that (`errors.ts:330-338`). So the SDK reading a file whose contentHash was written per the **canonical f1220 spec** → `malformed-claim` → read throws unless `{verify:false}`.
- **Write path:** `writes/file.ts:324` computes and `:411-416` emits the bare digest verbatim as the `contentHash` PROPERTY value.
- **Docs double down:** [`../../../sdk/docs/specs/content-hash.md`](../../../sdk/docs/specs/content-hash.md) — "no multihash, no CID"; ADR-0006 status still "Accepted" (dated 2026-06-10, predating the contracts ratification).
- The alignment demand is already an **unresolved P1 review thread on the PR itself** (§1 item 1).

**Third encoding in the wild (grade A):** the datasets seeder writes `contentHash: keccak256(bytes)` — 0x-prefixed keccak — [`../../../datasets/deploy/packages/hardhat/scripts/seed-dataset.ts`](../../../datasets/deploy/packages/hardhat/scripts/seed-dataset.ts) line 257 (`normalizeHash` in `seed-dataset-lib.ts:219` only trims/lowercases). This matches the nextjs `computeContentHash` keccak convention ([`../../../contracts/packages/nextjs/utils/efs/transports.ts`](../../../contracts/packages/nextjs/utils/efs/transports.ts):106 — no callers found, possibly dead) but matches **neither** the canonical f1220 nor the SDK's bare-sha256. `grep f1220` over datasets/ finds nothing.

Consequence matrix (grade B): content seeded with datasets tooling (keccak) is **unverifiable by the SDK** (`malformed-claim`, fail-closed) and non-compliant with specs/10; content seeded with SDK (bare sha256) is verifiable by the SDK but **non-compliant with specs/10**, so any future spec-compliant reader (or the client v2) will flag it malformed. No pairing of today's tools is spec-compliant.

## 5. Stale Sepolia view addresses (grade A — confirms the P2 thread)

`chain/deployments.ts` SEPOLIA vs [`../../../contracts/docs/CHAINS.md`](../../../contracts/docs/CHAINS.md) (June-23 hardened views, CHAINS.md:54-56):

| Contract | SDK deployments.ts | contracts CHAINS.md |
|---|---|---|
| fileView | `0x141D9FdbadCd9f6e6928A4842FF00094502CC146` | `0x76B10909Ff10b53c54387C66B083b1613E2276d3` |
| router | `0x4EF216e1096237dA8A962157Ed13ea1B3FcC5E17` | `0x44D5F6803127B442218e9aA0481A9931444dc82c` |
| listReader | `0x689AA70BF6a8b22BE4E959dcf33A40ea03F85Bd5` | `0xCc182611B572b5C162a3D96674E821C61ac658FC` |

SDK reads routed through these views would hit the **pre-hardening** deployments. Views are stateless/redeployable and overridable at the client (deployments.ts:84-85 comment), so the workaround is a `deployments` override — but the shipped defaults are wrong for Sepolia AND for devnet 26001993 (which inherits SEPOLIA's addresses verbatim). Devnet forked post-June-23 would have the hardened views at the CHAINS.md addresses (grade B).

## 6. Recommendation (grade B)

**Do not pin PR #1 as-is. Pin it WITH a small named patch — it is the best available base.** The alternatives are worse: datasets/ tooling writes keccak contentHash (also non-canonical, and invisible to any sha-based verifier); the nextjs utils' `computeContentHash` is keccak and apparently dead code; client/ v1 is hibernating.

Named patch — **"arcade-pin patch"**, 2 files + docs, small and test-covered:
1. `packages/sdk/src/content/hash.ts` — `hashContent` emits `f1220` + sha256-hex; `asContentHash`/`verifyContent` accept canonical `f1220…` (optionally ALSO accept legacy bare-64-hex during transition, but never emit it). Update `docs/specs/content-hash.md` + mark ADR-0006 Superseded by contracts specs/10 / ADR-0064. This is exactly unresolved P1 thread #1, so it also unblocks the PR.
2. `packages/sdk/src/chain/deployments.ts` — refresh SEPOLIA fileView/router/listReader to the CHAINS.md hardened addresses (unresolved P2 thread). Alternatively pass a `deployments` override in the Arcade seeder config without patching.

Residual risks if pinned with the patch:
- **Transports gap:** Sepolia registry lacks per-scheme transport UIDs; a default on-chain `web3://` write needs `WriteOptions.transportDefinition` — the Arcade seeder must look up/record the `/transports/web3` anchor UID once (or the games ship with explicit mirrors).
- Unresolved P1s #2-#4 (segment canonicalization, redirect lifecycle/algorithm) — low impact for Arcade if game paths are plain ASCII lowercase and no REDIRECTs are seeded; **constrain the manifest to ASCII-safe names** and avoid redirects for September.
- Package unpublished (v0.0.0): pin the git SHA `5e6d64d` + patch commit, build from source via pnpm workspace.
- 141-commit single PR, no formal review approval recorded — merge state is clean but the PR has never been merged anywhere; treat the pin as a vendored snapshot, not a released dependency.
- If the datasets/ tooling is used for ANY Arcade seeding alongside the SDK, its keccak `contentHash` (seed-dataset.ts:257) must be fixed to f1220 too, or the two tools will write mutually unverifiable content.


---

> **Update (2026-08-07, later the same day):** a concurrent SDK session has begun exactly this reconciliation in the sdk worktree (uncommitted at review time): `hashContent` now emits canonical `f1220`, verification decodes at digest level (base32 accepted-on-read), and a new **ADR-0016** supersedes ADR-0006 per specs/10. The findings above describe the PR-head state `5e6d64d` as committed; re-verify the SDK's committed state before pinning — the "arcade-pin patch" §6 recommends may land upstream on its own.
