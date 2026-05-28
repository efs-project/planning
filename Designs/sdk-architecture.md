# EFS SDK Architecture

**Status:** review
**Target repos:** sdk (new), planning
**Depends on:** [[0001-design-system]], [[brainstorm-system]], ADR-0031 (lenses), ADR-0041 (PIN/TAG), ADR-0044 (Lists — pending merge)
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-05-28

#status/review #kind/design #repo/sdk #repo/planning

---

## Problem

Third-party developers need to build on EFS without reading 9 EAS schemas, 44+ ADRs, and the Indexer ABI. The current state forces every dev to:

- Hand-attest 8 transactions to write a single file (the "8-tx submarine" from `bs-third-party-dev-ux-v1`)
- Hardcode schema UIDs that change on devnet redeploy
- Drop to raw EAS queries on day one because the high-level surface is too thin
- Build their own Postgres mirror of chain state to do anything non-trivial
- Guess what a lens is, assume it's on-chain, and waste hours

The anchor requirement: **a dev given this SDK can do everything the current debug client does, easily.** The debug client's capabilities set the floor; the brainstormed use cases (recipes, sports stats, provenance, high-frequency telemetry) reveal the ceiling.

---

## Proposal

### Requirements

Distilled from: `bs-third-party-dev-ux-v1` (dev friction walkthroughs), `bs-divergent-usecases-v1` (15 industry use cases), the debug client source (`client/src/libefs/`), and ADRs 0031/0041/0044.

#### MUST (SDK ships without these → no SDK)

| # | Requirement | Source |
|---|---|---|
| M1 | Resolve a path string to an Anchor UID | client: `TopicStore.getById` + path ops |
| M2 | Create an Anchor at a path (validate name per ADR-0025) | client: `TopicStore.createTopic` |
| M3 | List an Anchor's children, paginated, as AsyncIterable | client: `TopicStore.getChildren` |
| M4 | Walk ancestors of an Anchor (path → root) | client: `TopicStore.getPath` |
| M5 | Read a file (path → Uint8Array) through the lens stack | client: `EASx.getAttestation` + resolution |
| M6 | Write a file (path + bytes → on-chain) in one user action, not 8 wallet prompts | dev-friction: 8-tx submarine |
| M7 | Place/unplace a file at a path via PIN (singleton-edge); set/get any PIN | ADR-0041: file placement is a PIN |
| M8 | Add/remove a descriptive label or folder-visibility TAG (many-edge, weighted) | ADR-0041: TAG is cardinality-N |
| M9 | Set/get a PROPERTY value by key (key-anchor + PROPERTY + binding PIN; a 3-attestation singleton rebind) | client: PROPERTY schema; ADR-0041 §1; dev-friction |
| M10 | Create and populate a LIST; iterate its entries | ADR-0044 (Lists) |
| M11 | Expose schema UIDs and contract addresses as typed constants (never hardcode) | dev-friction: "what schema UID is PROPERTY this week?" |
| M12 | Expose the raw EAS SDK cleanly (EFS.EAS) without requiring devs to know the SDK internals | PM brief; dev-friction: drop-to-raw-EAS pattern |
| M13 | Expose the raw contract instances as an escape hatch (EFS.raw) | PM brief |
| M14 | Lens model: explicit, visible default; not silent | dev-friction: "SDK silently used the deployer lens" |
| M15 | Signer/wallet handling: constructor injection + `.connect()` for MetaMask late-bind | client: `EFS.connect(signer)` |
| M16 | Emit partial-failure receipts from multi-step operations | dev-friction: 8-tx partial abort |

#### NICE (support if cheap; design must not preclude)

| # | Requirement | Source |
|---|---|---|
| N1 | `read.json<T>()` and `read.text()` helpers | dev-friction: sports stats, recipe |
| N2 | Gas/cost estimation before write | dev-friction: birding ($20k/day surprise) |
| N3 | `batch.estimate()` — attestation count + tx count | dev-friction: batch sizing opacity |
| N4 | Property helpers for well-known keys (`contentType`, `previousVersion`, `name`) | dev-friction: "where do PROPERTY keys come from?" |
| N5 | `graph.timeline(anchor)` — time-ordered everything on an anchor | dev-friction: museum provenance |
| N6 | `graph.versions(dataUID)` — `previousVersion` ancestor/descendant chain | dev-friction: recipe forker |
| N7 | `lenses.discover()` — off-chain indexed lens discovery | dev-friction: cookbook curator |
| N8 | `watch(path)` — change subscription (fall back to polling when subscribe denied) | dev-friction: sports stats live feed |
| N9 | Multi-chain config support | dev-friction: birding L2 wall |
| N10 | `snapshot.cite()` — permanent URL + content hash + block for citation | dev-friction: museum scholar paper |

#### DEFERRED (explicit non-scope for v1)

| # | Requirement | Why deferred |
|---|---|---|
| D1 | Off-chain indexer / "EFS-in-Postgres" packaged pattern | Major scope; own design thread (Kanban Backlog) |
| D2 | EFSUploadGateway single-tx write (AA-wallet bundling) | Requires new contracts work (Kanban Backlog) |
| D3 | PROPERTY-by-value aggregation queries | Requires D1 |
| D4 | EFS OS SDK (Ring 3 sandboxed app surface) | Explicitly out of scope (PM brief) |
| D5 | Lens partition-by-domain (trust attester only for firmware) | Post-v1 lens design |
| D6 | Historical/point-in-time reads (query at block N) | Requires EFSRouter changes |
| D7 | `efs.search()` full-text | Requires D1; also a community expectation mismatch — needs prominent "EFS is not a search engine" in README |

---

### Inverted-Framing Pass

**Question per operation: what does our SDK add OVER raw EAS SDK + a direct contract call?**

This pass determines what to WRAP vs. what to EXPOSE-AS-IS.

| Operation | Raw EAS alone | EFS SDK adds | Verdict |
|---|---|---|---|
| Get one attestation by UID | `eas.getAttestation(uid)` ✅ trivial | Nothing | **Expose via EFS.EAS** |
| Multi-attest (batch) | `eas.multiAttest([...])` — low-level, requires hand-assembled payloads | Compiles human operations into attestation payloads; validates; retries; splits if >MAX_BUNDLE_SIZE | **Wrap — high value** |
| Create Anchor at path | 1 attest call — but dev must know schema UID, encode data, pick refUID from prior resolution | Path resolution (string → UID chain), name validation per ADR-0025, caching | **Wrap** |
| List Anchor's children | `eas.getReferencingAttestationUIDs(uid, ANCHOR_SCHEMA)` + decode each | Pagination abstraction, AsyncIterable, caching, typed return | **Wrap** |
| Read file at path | Router resolution (3 contract calls) + MIRROR selection + fetch | Single `read(path)` call; handles lenses, fallbacks, transport | **Wrap — high value** |
| Write file (path + bytes) | 8+ sequential attestations: ANCHOR (if new) + DATA (if new) + MIRROR + contentType triple (key ANCHOR + PROPERTY + binding PIN) + **placement PIN** (`PIN(refUID=DATA, definition=fileAnchor)`, ADR-0041) + folder-visibility TAGs for uncovered ancestors | One `write(path, bytes)` that compiles all to `multiAttest`; single wallet prompt | **Wrap — highest value** |
| Get PROPERTY value by key | `getActivePin(keyAnchor, attester)` → resolve target PROPERTY → decode (O(1), ADR-0041) — but dev must resolve the key anchor and know the PIN-binding convention | 3 lines vs. 15; typed return; lens-scoped; hides the key-anchor + PIN-binding indirection | **Wrap** |
| Set PROPERTY value | **3 attestations** (key ANCHOR if new + PROPERTY value + binding PIN) — a singleton rebind, NOT one call (ADR-0041 §1) | Hides the 3-attestation singleton-rebind entirely; this is real multi-step value, not a thin wrapper | **Wrap; expose in batch** |
| Place a file at a path (singleton) | `PIN(refUID=DATA, definition=fileAnchor)` — 1 attest, but dev must know placement is a PIN not a TAG, and encode it | Schema UID + encoding + supersession semantics; the single most-confused primitive | **Wrap; expose in batch** |
| Descriptive label / folder visibility (cardinality-N) | `TAG(refUID=target, definition, weight)` — 1 attest/revoke | Schema UID + encoding; weight semantics; lens-scoped read | **Thin wrap; expose in batch** |
| Create LIST + add entries | 1 LIST attest + N LIST_ENTRY attests | High-level API hides the schema encoding complexity; enforces mode-specific target encoding | **Wrap** |
| Schema UIDs, contract addresses | Hardcoded hex strings | Typed constants module, version-checked | **New primitive — SDK only** |
| Lens management | URL query param only (ADR-0031) | Client-side state, visible default, ENS resolution, multi-lens composition | **New primitive — SDK only** |
| Raw contract calls (EFSIndexer, EFSFileView, etc.) | `new Contract(ADDR, ABI, signer)` — verbose | `efs.raw.indexer` — pre-wired instance | **Thin wrap** |

**What EAS already does well (don't re-wrap, just expose):**
- `eas.attest()` / `eas.multiAttest()` / `eas.revoke()` / `eas.multiRevoke()`
- `eas.getAttestation(uid)`, `eas.getSchemaUID()`
- Schema registry operations

---

### Package Structure

Two packages (OS SDK deferred), living in a single `sdk/` repo (Direction 2 from `bs-sdk-package-layout-v1`). **Q1 decided by James 2026-05-28: everything lives in the new `sdk/` repo** — the on-chain SDK does NOT co-locate in `contracts/`. ABI types are generated from `contracts/` at build time (e.g. `wagmi generate`/`typechain`) so they stay in sync without sharing a repo.

```
/Users/james/Code/EFS/sdk/     (new repo)
  package.json                  (workspace root, private)
  pnpm-workspace.yaml
  packages/
    onchain/    → npm: @efs/sdk-onchain
      src/
        batch.ts         compiled batch builder → EAS.multiAttest
        fs.ts            file read/write/stat/list
        graph.ts         Anchor tree, TAG/PIN traversal
        props.ts         PROPERTY typed access
        lists.ts         LIST + LIST_ENTRY
        lenses.ts        lens management
        raw.ts           contract escape hatches
        constants.ts     schema UIDs, contract addresses
        index.ts         EFSClient class + re-exports
    offchain/   → npm: @efs/sdk   (the primary package devs install)
      src/
        cache.ts         read-through cache (IPFS/Arweave/HTTPS)
        graph/
          timeline.ts    time-ordered event stream
          versions.ts    previousVersion DAG walk
          subtree.ts     recursive anchor traversal
        watch.ts         change subscription with polling fallback
        index.ts         re-exports @efs/sdk-onchain + adds offchain surface
```

> **Q1 — RESOLVED (James, 2026-05-28):** Everything lives in the new `sdk/` repo. ABI types generated from `contracts/` at build time.

**Consumer install:**
```bash
npm install @efs/sdk               # off-chain (the normal install)
npm install @efs/sdk-onchain       # on-chain only (unusual; for smart-contract devs)
```

---

### API Surface

#### Instantiation

```ts
import { EFSClient } from '@efs/sdk'

const efs = new EFSClient({
  rpc: "https://eth-sepolia.g.alchemy.com/v2/...",
  chainId: 11155111,

  // Lenses: EXPLICIT required. No silent deployer default.
  // Pass [] to opt into "deployer only" with acknowledgement.
  lenses: ["alice.eth", "0xBob..."],

  // Signer: optional at construction. Required for writes.
  signer?: ethers.Signer | viem.WalletClient,
})

// Late-bind a signer (MetaMask flow):
await efs.connect(walletClient)
```

**Design note on lenses:** The current client silently uses the deployer lens. The brainstorm found this breaks apps in production ("why am I seeing the deployer's carbonara, not the popular one?"). The SDK requires an explicit lens declaration. Passing `lenses: []` gives the deployer as the only lens but names the choice explicitly.

---

#### `efs.fs` — Filesystem (primary surface)

```ts
// Read
efs.fs.read(path: string, opts?: ReadOpts): Promise<Uint8Array>
efs.fs.read.text(path: string, opts?: ReadOpts): Promise<string>
efs.fs.read.json<T>(path: string, opts?: ReadOpts & { schema?: ZodSchema<T> }): Promise<T>

// List directory — always AsyncIterable (never an eager array)
efs.fs.list(path: string, opts?: ListOpts): AsyncIterable<DirEntry>
// opts: { limit?, cursor?, sortInfoUID?, schema? }

// Stat (metadata without reading the payload)
efs.fs.stat(path: string, opts?: ReadOpts): Promise<FileStat>
// returns: { anchorUID, dataUID, attester, contentType, size, mirrors[], time }

// Resolve path → anchor UID (lower-level; useful when you need the UID)
efs.fs.resolve(path: string): Promise<Hex>

// Write (sugar over efs.batch().fs.write().execute())
efs.fs.write(
  path: string,
  bytes: Uint8Array,
  opts?: {
    contentType?: string
    mirrors?: MirrorSpec[]
    properties?: Record<string, string>   // attached PROPERTY keys
    previousVersion?: Hex                 // for version DAGs
    onProgress?(phase: WritePhase): void
  }
): Promise<WriteReceipt>
// WriteReceipt: { anchorUID, dataUID, placementPinUID, txHashes, attestationCount, totalGas }
```

**Design note on `fs.list` vs array:** The brainstorm found a sports-stats dev tried `list("/mlb/2025", { recursive: true })` and got a 60-second stall or a `QueryTooLargeError`. `list` is always `AsyncIterable` with explicit pagination; consuming all results requires `collect(efs.fs.list(path))`. A `collect()` helper is exported for small folders.

---

#### `efs.graph` — Graph traversal (Tags, Pins, Anchors)

```ts
// Anchor tree navigation
efs.graph.children(anchor: Hex, opts?: PaginateOpts): AsyncIterable<AnchorEntry>
efs.graph.path(anchor: Hex): Promise<string>       // UID → "/foo/bar/baz"
efs.graph.subtree(anchor: Hex, opts?: { depth?: number }): AsyncIterable<AnchorEntry>

// PIN operations — singleton edges per ADR-0041 ("this slot holds exactly one thing").
// File placement is a PIN: each (attester, file anchor) slot holds exactly one DATA.
efs.graph.pins.get(definition: Hex, opts?: { attester?: Address }): Promise<PinEntry | null>
// PinEntry: { pinUID, target, attester } — O(1) read via getActivePin, no newest-by-time scan
efs.graph.pins.set(definition: Hex, target: Hex): Promise<Hex>                   // returns pinUID; supersedes prior
efs.graph.pins.clear(definition: Hex): Promise<void>                             // revoke the active PIN

// Sugar for the placement PIN (the most common PIN): place DATA at its file anchor
efs.graph.place(fileAnchor: Hex, dataUID: Hex): Promise<Hex>     // PIN(refUID=dataUID, definition=fileAnchor)
efs.graph.unplace(fileAnchor: Hex): Promise<void>

// TAG operations — many/weighted edges per ADR-0041 ("this category contains N things").
// Descriptive labels (#nsfw, #favorites) and folder visibility. NOT file placement.
efs.graph.tags.list(target: Hex, opts?: { allAttesters?: boolean }): AsyncIterable<TagEntry>
efs.graph.tags.add(target: Hex, definition: Hex, weight?: bigint): Promise<Hex>  // returns tagUID
efs.graph.tags.remove(tagUID: Hex): Promise<void>

// Time-ordered stream of everything touching an anchor (off-chain)
efs.graph.timeline(anchor: Hex): AsyncIterable<TimelineEvent>
// TimelineEvent: { type: 'tag'|'pin'|'property'|'data'|'mirror', uid, attester, time, ... }

// previousVersion version DAG helpers (off-chain)
efs.graph.versions.ancestors(dataUID: Hex): AsyncIterable<Hex>
efs.graph.versions.descendants(dataUID: Hex): AsyncIterable<Hex>  // requires off-chain index
```

**Design note on `graph.timeline` and `graph.versions.descendants`:** These require an off-chain index (the EFS-in-Postgres pattern). They are intentionally on the `@efs/sdk` (off-chain) package, not `@efs/sdk-onchain`. When no off-chain index is configured, they throw `OffchainIndexRequired` with a message explaining how to configure one. They are **not removed from the surface** — a weak "here's a read-through cache, here's how to add a real indexer" story is better than forcing devs to hand-roll the same thing.

---

#### `efs.props` — Properties

```ts
// Get the active PROPERTY value for a key on a UID, lens-scoped.
// Resolves the key anchor under `uid`, reads its binding PIN (O(1), ADR-0041), decodes the PROPERTY value.
efs.props.get(uid: Hex, key: string): Promise<string | undefined>

// Get PROPERTY value from all attesters (museum researcher, firmware verifier)
efs.props.allViews(uid: Hex, key: string): Promise<Record<Address, PropView>>
// PropView: { value: string, attestedAt: number, revoked: boolean }

// Set a PROPERTY value (a 3-attestation singleton rebind: key ANCHOR if new + PROPERTY + binding PIN).
// Compiles into batch; executes immediately unless inside a batch.
efs.props.set(uid: Hex, key: string, value: string): Promise<Hex>

// List all active PROPERTYs on a UID, lens-scoped
efs.props.list(uid: Hex): Promise<PropEntry[]>
// PropEntry: { key: string, value: string, attester: Address, uid: Hex }
```

**Well-known keys** (as constants, not magic strings):

```ts
import { PROP_KEYS } from '@efs/sdk/constants'
PROP_KEYS.CONTENT_TYPE        // "contentType"
PROP_KEYS.NAME                // "name"
PROP_KEYS.DESCRIPTION         // "description"
PROP_KEYS.PREVIOUS_VERSION    // "previousVersion"
// ... extensible; community-contributed keys can be added via SDK version bumps
```

**Design note on the PROPERTY model (ADR-0041):** A PROPERTY value is not a single attestation. Per ADR-0041 §1 and `specs/02` §PIN, a key/value pair is three attestations: (1) an ANCHOR naming the key under the target (e.g. a `contentType` anchor under a DATA), (2) a PROPERTY carrying the value, (3) a **PIN** binding the value to the key anchor (`PIN(refUID=propertyUID, definition=keyAnchor)`). The PIN is what makes the value a singleton — a rebind is a new PROPERTY + new PIN that supersedes the old PIN, read in O(1) via `getActivePin`. This is exactly the kind of multi-step indirection `efs.props` exists to hide; devs never touch the key anchor or the binding PIN directly. This also corrects a pre-ADR-0041 model (`overview.md`, still stale on `main`) where PROPERTY rebinds were assumed to be newest-by-time scans — that model was found to be incorrect (ADR-0041 Context).

---

#### `efs.lists` — Lists (post-ADR-0044)

```ts
// Create a List (returns listUID)
efs.lists.create(opts: {
  allowsDuplicates: boolean
  appendOnly: boolean
  targetType: 'ANY' | 'ADDR' | 'SCHEMA'
  targetSchema?: Hex    // required if targetType === 'SCHEMA'
  maxEntries?: number
}): Promise<Hex>

// Add entry to a list (returns LIST_ENTRY UID)
efs.lists.add(listUID: Hex, target: Hex | Address, opts?: {
  weight?: bigint
  properties?: Record<string, string>
}): Promise<Hex>

// Remove entry (revokes LIST_ENTRY, rejected if appendOnly)
efs.lists.remove(entryUID: Hex): Promise<void>

// Iterate active entries of a list (lens-scoped)
efs.lists.entries(listUID: Hex, opts?: PaginateOpts): AsyncIterable<ListEntry>
// ListEntry: { uid, target, weight, attester, properties, attestedAt }

// Get the LIST declaration
efs.lists.get(listUID: Hex): Promise<ListSpec>

// Place a list at a path anchor (creates PIN from anchor → list)
efs.lists.placeAt(path: string, listUID: Hex): Promise<Hex>
```

---

#### `efs.lenses` — Lens management

```ts
// Read current lens state
efs.lenses.active(): Address[]     // currently active lenses (client-side)

// Mutate (all client-side; no on-chain tx)
efs.lenses.add(addr: Address | string): Promise<void>    // resolves ENS
efs.lenses.remove(addr: Address): void
efs.lenses.set(addrs: (Address | string)[]): Promise<void>

// Discover lenses via off-chain index
efs.lenses.discover(opts?: {
  topic?: string          // filter by topic anchor path
  minAttestations?: number
}): Promise<LensInfo[]>
// LensInfo: { address, ens?, label?, attestationCount, topicPaths[] }
```

**Design note on lens semantics:** Lenses (formerly "editions") are client-side state per ADR-0031. The SDK propagates them through every read. `efs.lenses.add("alice.eth")` resolves ENS and prepends to the active list. This is NOT an on-chain action — the doc must say this clearly and early, because three of the five walkthrough devs burned time searching for the "follow" transaction.

---

#### `efs.batch()` — Write batching (primary write UX)

The single most important value-add. A single `efs.fs.write()` compiles into ~6–10 attestations (DATA + MIRROR + the 3-attestation contentType property + placement PIN + folder-visibility TAGs + any new path anchors). The batch builder makes this visible, composable, and limited to one wallet prompt.

```ts
// Fluent builder pattern
const receipt = await efs
  .batch()
  .fs.write("/recipes/pasta/carbonara", bytes, { contentType: "text/markdown" })
  .props.set(dataUID, PROP_KEYS.PREVIOUS_VERSION, prevUID)
  .lists.add(myListUID, dataUID)
  .execute()

// Or via callback (auto-executes)
const receipt = await efs.batch(b => {
  b.fs.write("/birding/obs/2026-05-28/robin-001", jsonBytes)
  b.fs.write("/birding/obs/2026-05-28/robin-002", jsonBytes2)
  b.props.set(anchor1, PROP_KEYS.NAME, "Robin #1")
})

// Estimate before executing
const estimate = await efs.batch(b => {
  for (const obs of observations) b.fs.write(pathFor(obs), toBytes(obs))
}).estimate()
// estimate: { attestationCount, txCount, estimatedGasUnits, estimatedUSD? }

// BatchReceipt
type BatchReceipt = {
  txHashes: Hex[]
  results: OperationResult[]    // one per op in builder order
  partialFailure?: { opIndex: number; error: string }[]
}
```

**Batching strategy:**
- Compile all operations to attestation payloads
- Check existing DATA by `contentHash` (skip re-attest if dedup applies)
- Chunk into groups where each chunk fits within EAS `multiAttest` practical limits
- Each chunk = one wallet prompt (one tx)
- Report `txCount` up-front so dev can warn users ("this will require 3 wallet signatures")
- On partial failure, report which operations succeeded and which failed with errors

**Design note on EFSUploadGateway (D2 from Deferred):** If the EFSUploadGateway wrapper contract ships, the batch builder can route through it for single-tx + single-signature writes. The SDK API is designed so this is a config option (`efs.batch({ gateway: true })`), not a breaking change.

---

#### `efs.EAS` — EAS SDK exposure

```ts
// Direct access to the underlying EAS SDK instance
efs.EAS          // type: EAS (from @ethereum-attestation-service/eas-sdk)

// Fully typed, fully connected (same signer as the EFSClient)
efs.EAS.attest({ schema, data: { ... } })
efs.EAS.multiAttest([...])
efs.EAS.getAttestation(uid)
efs.EAS.revoke({ schema, data: { uid } })
// ... all EAS SDK methods available
```

**Design rationale:** Every non-trivial dev drops to raw EAS queries within day one (the museum researcher, the sports-stats dev, the recipe forker). Instead of fighting this, we make it first-class. `EFS.EAS` is *not* buried in `.raw` — it's a top-level, visible surface. The promise to the dev: "You can always speak EAS fluently. Our wrappers are conveniences, not a walled garden."

---

#### `efs.raw` — Contract escape hatch

```ts
// Pre-wired contract instances (viem/ethers, connected to efs's signer)
efs.raw.indexer      // EFSIndexer
efs.raw.router       // EFSRouter
efs.raw.fileView     // EFSFileView
efs.raw.sortOverlay  // EFSSortOverlay
// ... all deployed contracts

// Usage
const count = await efs.raw.indexer.read.getReferencingAttestationUIDCount([uid, schemaUID])
```

---

#### Typed constants

```ts
import { SCHEMAS, CONTRACTS, PROP_KEYS, TRANSPORT } from '@efs/sdk/constants'

// Schema UIDs (typed, version-checked against the connected chainId)
SCHEMAS.ANCHOR         // `0x...` as const
SCHEMAS.DATA
SCHEMAS.TAG
SCHEMAS.PIN
SCHEMAS.PROPERTY
SCHEMAS.LIST           // post-ADR-0044
SCHEMAS.LIST_ENTRY     // post-ADR-0044
SCHEMAS.MIRROR
SCHEMAS.SORT_INFO

// Contract addresses
CONTRACTS.INDEXER
CONTRACTS.ROUTER
CONTRACTS.FILE_VIEW
CONTRACTS.SORT_OVERLAY

// Well-known property keys
PROP_KEYS.CONTENT_TYPE
PROP_KEYS.NAME
PROP_KEYS.DESCRIPTION
PROP_KEYS.PREVIOUS_VERSION

// Transport identifiers (ADR-0011)
TRANSPORT.WEB3
TRANSPORT.ARWEAVE
TRANSPORT.IPFS
TRANSPORT.MAGNET
TRANSPORT.HTTPS
```

**Design note on version-checking:** When the EFSClient is constructed, it reads the on-chain schema registry to verify that the SDK's compiled `SCHEMAS` constants match what's deployed on the given chainId. If they don't match (devnet redeployment), it throws `SchemaMismatchError` with a diff. This is the fix for "what schema UID is PROPERTY this week?"

---

### Error & Partial-Failure Semantics

```ts
// All errors are typed
class EFSError extends Error { code: EFSErrorCode; context: unknown }

enum EFSErrorCode {
  SchemaMismatch,          // SCHEMAS constants don't match on-chain
  WalletRequired,          // write attempted without signer
  AnchorNameInvalid,       // name fails ADR-0025 validation
  AnchorDepthExceeded,     // path depth > MAX_ANCHOR_DEPTH (ADR-0021)
  MaxLensesExceeded,       // lenses.active().length > MAX_LENSES (ADR-0026)
  BatchSizeExceeded,       // internal — SDK auto-chunks; surfaced only if unchunkable
  OffchainIndexRequired,   // called a method that needs the off-chain indexer
  PartialBatchFailure,     // some ops in a batch failed; BatchReceipt.partialFailure populated
  ListAppendOnlyViolation, // tried to remove entry from appendOnly list
  ListCapExceeded,         // maxEntries reached
}
```

---

### Auth / Signer Handling

```ts
// Server-side (Node, hot wallet):
const efs = new EFSClient({
  rpc, chainId,
  lenses: [],
  signer: new ethers.Wallet(process.env.HOT_KEY),
})

// Browser (MetaMask, late-bind):
const efs = new EFSClient({ rpc, chainId, lenses: ["alice.eth"] })
// ...later, after MetaMask connect:
await efs.connect(walletClient)   // viem WalletClient OR ethers Signer

// Read-only (no signer, no writes):
const efs = new EFSClient({ rpc, chainId, lenses: [] })
// efs.fs.read() works; efs.fs.write() throws WalletRequired
```

**Design note:** The brainstorm found the server-side (Node hot-wallet) path is "underdocumented." The SDK should have a first-class Node/server example in the README alongside the browser example, not hidden in a footnote.

---

### TypeScript DX

All returns are fully typed — no `any`. The SDK exports:

```ts
// Core types (tree-shakeable)
export type {
  Hex, Address,
  AnchorEntry, DirEntry, FileStat,
  TagEntry, PinEntry,
  PropEntry, PropView,
  ListSpec, ListEntry,
  LensInfo,
  WriteReceipt, BatchReceipt,
  OperationResult,
  TimelineEvent,
  ReadOpts, ListOpts, PaginateOpts,
  MirrorSpec, WritePhase,
}

// Zod schemas for runtime validation (optional peer dep)
export { AnchorEntrySchema, FileStatSchema, ... } from '@efs/sdk/schemas'
```

**Inspiration citations:**
- **viem** — type-safety for contract interactions; we adopt their `Hex` / `Address` branded types
- **Prisma** — fluent typed reads with optional includes; the `efs.fs.read.json<T>()` pattern
- **Stripe** — resource-namespaced API (`stripe.customers`, `stripe.charges`) → our `efs.fs`, `efs.graph`, `efs.lists`
- **EAS SDK** — the embedded instance (`efs.EAS`) follows the same pattern as the SDK's own `new EAS(address)` instantiation

**What we don't borrow:**
- **wagmi** (React hooks) — too framework-coupled for a framework-agnostic SDK. React bindings belong in a separate `@efs/react` package, post-v1.
- **ethers.js** v5 provider coupling — we accept both ethers v6 and viem to avoid forcing a choice.

---

### SDK Coverage of the Debug Client

The debug client's capabilities mapped to SDK calls:

| Debug client | SDK equivalent |
|---|---|
| `TopicStore.createTopic(name, parentUid)` | `efs.batch().fs.mkdir(parent, name).execute()` |
| `TopicStore.getById(uid)` | `efs.fs.stat(path)` or `efs.raw.indexer.read...` |
| `TopicStore.getChildren(topic)` | `efs.graph.children(anchor)` |
| `TopicStore.getPath(topic)` | `efs.graph.path(anchor)` |
| `EASx.getAttestation(uid)` | `efs.EAS.getAttestation(uid)` |
| `EASx.getReferencingAttestationUIDs(uid, schema, ...)` | `efs.EAS.getAttestation` + `efs.raw.indexer` |
| `EASx.indexAttestation(uid)` | `efs.raw.indexer.write.indexAttestation([uid])` |
| `EFS.connect(signer)` | `await efs.connect(signer)` |
| Hardcoded `contractConstants.ts` | `import { SCHEMAS, CONTRACTS } from '@efs/sdk/constants'` |

All debug-client capabilities are either directly covered or covered via `efs.EAS` / `efs.raw`.

---

## Open Questions

- [x] **Q1 (repo packaging) — RESOLVED (James, 2026-05-28):** Everything lives in the new `sdk/` repo; the on-chain SDK does NOT co-locate in `contracts/`. ABI types are generated from `contracts/` at build time (`wagmi generate`/`typechain`) so they stay in sync without sharing a repo.

- [x] **Q2 (namespace naming) — RESOLVED toward (a), pending James's confirm:** domain-model namespaces (`efs.fs`, `efs.graph`, `efs.props`, `efs.lists`, `efs.lenses`, `efs.EAS`, `efs.raw`) vs verb-first (`efs.read/write/query/attest`). An expert SDK-design review (2026-05-28) found **(a) is the de-facto industry standard** — *resource-oriented design*, codified in Google's API Design Guide and embodied by Stripe (`stripe.customers.create`), Prisma (`prisma.user.findMany`), Twilio, Supabase, GitHub Octokit. **No widely-respected SDK uses a top-level verb-namespace tree.** The field splits between resource.action namespacing (multi-resource domains — EFS's case) and flat verb methods (single-resource domains like EAS/ethers). Verb-first also fails EFS specifically because `graph` and `lenses` are resource models, not actions, and don't reduce to a single verb. **Refinement adopted from the review:** keep (a)'s noun tree but enforce a *consistent verb vocabulary* on the leaves (`read/write/list/stat` on `fs`; `get/set/list` on `props`; `pin/unpin/add/remove` on `graph`) — this pairs resource-oriented design with Google's "standard methods" discipline, giving both a domain map and predictable operation names. **Recommendation: confirm (a) + consistent-verb refinement.**

- [ ] **Q3 (off-chain index in v1):** Methods that require an off-chain index (`graph.timeline`, `graph.versions.descendants`, `lenses.discover`) are on the `@efs/sdk` surface but throw `OffchainIndexRequired` by default. Should we (a) include them and throw — signals intent, lets devs wire their own index; (b) exclude them entirely from v1 — cleaner surface, but devs have no model; or (c) include them with a bundled minimal SQLite-backed local indexer — best DX, much more implementation scope? **Recommendation: (a), with a reference index implementation as a companion example project.**

- [ ] **Q4 (lenses require explicit declaration):** The design requires `lenses: [...]` at construction — no silent deployer default. This is deliberately more friction than the current client. Is this the right call? Rationale: the brainstorm found silent defaults caused production bugs. Counter-argument: it raises the barrier for "hello world" demos. **Alternative: keep `lenses: []` as a valid constructor, but issue a loud console.warn on first read if lenses is empty.**

- [ ] **Q5 (EFSUploadGateway timing):** The batch API is designed to optionally route through an EFSUploadGateway contract (single tx, single signature). Should the SDK design explicitly reserve the `batch({ gateway: true })` option even though the gateway contract isn't built yet, or leave it for a later version bump?

---

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (sdk — new; planning — design doc only)
- [ ] `**Depends on:**` chain — design-system accepted ✅; brainstorm-system in review; ADR-0031 accepted ✅; ADR-0041 accepted ✅; ADR-0044 pending Lists merge (implementation gated, not design gated)
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

---

## Implementation notes

This is a DESIGN-ONLY document. No SDK code or repo scaffolding exists yet.

The implementation thread (Kanban Backlog: "Implement OnionDAO subset of sdk-architecture") is gated on:
1. James frame-review of this doc (this card's purpose)
2. Lists → Sepolia deploy (schema freeze: 9 schemas)

Q1 (repo layout) resolved 2026-05-28: single `sdk/` repo.

---

## Process feedback for the PM

**Was the process guidance clear and useful, or in the way?**

Clear and useful. The frame-first directive ("read corpus → distill requirements → inverted-framing pass → THEN design") was the right order and prevented me from jumping to API signatures before I understood what the SDK actually needs to do. The "anchor requirement" (debug client parity) gave me a concrete floor to design from rather than speculating. The inverted-framing pass was particularly valuable — it's how I concluded that `efs.EAS` should be a first-class top-level surface rather than buried in `.raw`, because the corpus showed devs drop to raw EAS immediately and that's load-bearing behavior we should embrace rather than fight.

**Did the requirements-first / inverted-framing steps add value, or feel like overhead?**

Real value. The requirements step forced me to distinguish between "what the debug client does" (concrete) and "what devs wish for" (aspirational), and the MUST/NICE/DEFERRED structure gave a clear signal for what to include in the API surface vs. what to defer. Without it I'd have included `graph.versions.descendants` as a MUST, buried it in an implementation corner, and produced a false promise — the inverted framing showed it requires an off-chain index that doesn't exist yet, so it becomes a surface-that-throws with a clear upgrade path.

**Roughly how many tokens / rounds did you spend before reaching review-ready? Was it proportional?**

One round — this document. The corpus reading (10+ files in parallel) was the most token-intensive part, but it was load-bearing: the dev-friction brainstorm alone contained the key design insight (devs drop to raw EAS on day one, so make EFS.EAS a feature not a failure mode). A shorter corpus would have produced a worse design. Token spend felt proportional to the scope.

**What would you change about the process for the next design thread?**

One friction point: the process says "read the corpus" but doesn't specify which files are load-bearing vs. background. In this case, the dev-friction brainstorm (`bs-third-party-dev-ux-v1`) was 10× more valuable than the OS-SDK brainstorm for this design. Future design prompts should mark files as `[CRITICAL]`, `[CONTEXT]`, `[BACKGROUND]` so the agent can prioritize and skip background-only reads when time is short.

Second: the process says "stop at review" but doesn't say what "review-ready" looks like. I interpret it as: requirements locked, inverted-framing pass done, API surface sketched, open questions named, doc is readable by a non-agent human in under 20 minutes. A one-line definition of "review-ready" in the process doc would help future threads calibrate when to stop vs. when to keep refining.
