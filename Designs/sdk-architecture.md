# EFS SDK Architecture

**Status:** review
**Target repos:** sdk (new — TypeScript SDK), contracts OR sdk (Solidity library — Q1), planning
**Depends on:** [[0001-design-system]], [[brainstorm-system]], ADR-0031 (lenses), ADR-0041 (PIN/TAG), ADR-0044 (Lists — pending merge)
**Supersedes:** —
**Reviewers:** expert subagent passes 2026-05-28 (SDK API/DX + contract-fidelity; wallet/EIP-5792 + attribution + security); awaiting James frame-review
**Last touched:** 2026-05-28 (on-chain/off-chain reframe — see Revision log)

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

### Two deliverables, two languages, two audiences

EFS ships two SDKs (the third — the OS SDK — is deferred). They are **not** two packages of one TypeScript library; they are different artifacts for different developers:

| | **On-chain SDK** | **Off-chain SDK** |
|---|---|---|
| Language | **Solidity** | **TypeScript** |
| Form | A **library** (+ optional inheritable base contract) | An npm package (`@efs/sdk`) |
| Runs | *Inside* a transaction, as part of the consuming contract | In a browser / Node / a script |
| Audience | Smart-contract developers whose own contracts write to EFS | App, backend, and tooling developers |
| Value-add | Collapses the multi-attestation dance into one Solidity call **while keeping the caller's contract as the EAS attester** | Collapses the same dance into one method, one wallet prompt, plus reads/queries/lenses |

**Why the on-chain SDK must be a library, not a deployed helper (load-bearing).** EAS records `msg.sender` as the attester, and the attester address is the spine of the read model — lenses key on it (ADR-0031) and PROPERTY-value PINs are cardinality-1 *per attester* (ADR-0041). If a smart-contract dev called a *separately deployed* EFS helper contract, that helper would be `msg.sender` when it called EAS, so every consuming app's content would be attributed to the **helper**, not to the app — collapsing all of them into one identity and breaking lens resolution. (This is the exact defect the off-chain `EFSUploadGateway` analysis surfaced.) A Solidity **library** (`internal` functions inlined into the caller, or `using EFS for …`) and an **inheritable base contract** both execute in the *consuming contract's* context, so `msg.sender` stays the consuming contract — the correct attester. Decision (James, 2026-05-28): **the on-chain SDK is a Solidity library + inheritable base, never a deployed singleton.**

The two SDKs share *concepts* (paths, DATA/MIRROR, PIN/TAG/PROPERTY, Lists, lenses) and the schema-UID constants, but not code. The rest of this doc designs the TypeScript off-chain SDK in depth (it is the larger surface and the debug-client parity target), then specifies the Solidity on-chain library.

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
| M11a | Manage MIRRORs on existing DATA (list/add/remove); multiple transports per DATA | core primitive (multi-MIRROR per DATA); archival redundancy use cases |
| M11b | Sort surface for folders AND lists: discover/declare sorts, read sorted (lens-filtered), and maintain the overlay (`process`/`reposition`) after modification | spec 06/07; lists must be re-sorted after entry changes |
| M11c | Per-call lens override on every read (not just client-level lens stack) | compare-views use cases; avoids client-state mutation |
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
| N7 | `lenses.discover()` — lens discovery (reverse lookup; needs external indexing — `NotImplemented` shim in v1) | dev-friction: cookbook curator |
| N8 | `watch(path)` — change subscription (fall back to polling when subscribe denied) | dev-friction: sports stats live feed |
| N9 | Multi-chain config support | dev-friction: birding L2 wall |
| N10 | `snapshot.cite()` — permanent URL + content hash + block for citation | dev-friction: museum scholar paper |

#### DEFERRED (explicit non-scope for v1)

| # | Requirement | Why deferred |
|---|---|---|
| D1 | External index for reverse-lookups (timeline, descendants, lens discovery, search) | Major scope, own design thread (Kanban Backlog). The SDK does NOT bundle indexing infrastructure (per James, 2026-05-28); affected methods ship as `NotImplemented` shims so their shape is visible. |
| D2 | EFSUploadGateway *contract* (opt-in `via: 'gateway'` path) | Contract is backlog work. Single-signature batching ships via EIP-5792/ERC-4337 (Q5 — see batch section); the gateway is **not** a single-signature mechanism (delegated attestation costs one signature per attestation) and is opt-in only, added when built without an API change. |
| D3 | PROPERTY-by-value aggregation queries | Requires D1 |
| D4 | EFS OS SDK (Ring 3 sandboxed app surface) | Explicitly out of scope (PM brief) |
| D5 | Lens partition-by-domain (trust attester only for firmware) | Post-v1 lens design |
| D6 | Historical/point-in-time reads (query at block N) | Requires EFSRouter changes |
| D7 | `efs.search()` full-text | Requires D1; also a community expectation mismatch — needs prominent "EFS is not a search engine" in README |

#### On-chain SDK (Solidity) requirements

The MUST/NICE/DEFERRED tables above are the **off-chain** (TypeScript) surface — the debug-client parity target. The on-chain library is a separate, narrower deliverable. Its anchor requirement: **a smart-contract dev can perform any EFS write from inside their own contract in one call, with their contract recorded as the attester, without hand-assembling EAS payloads.**

| # | Requirement |
|---|---|
| O1 | `pinFile`/`tag`/`setProperty`/`place`/`createList`+`addEntry` as one Solidity call each, composing the correct EAS attestation sequence (ADR-0041/0044) |
| O2 | The consuming contract is always the EAS attester (library/base executes in caller context — no separately deployed helper in the write path) |
| O3 | Path-anchor resolution/creation (`anchorAt(path)`) usable on-chain |
| O4 | O(1) reads only: `propertyValue(keyAnchor, attester)`, `activePin(definition, attester)`. Enumeration (children/tags) is explicitly **out of scope on-chain** — impractical/unbounded gas; that's the off-chain SDK's job |
| O5 | Schema UIDs + core contract addresses exposed as Solidity constants/immutables (the on-chain analogue of M11) |
| O6 | Raw escape hatch: the EFS core contract interfaces + schema constants remain directly callable; the library is sugar, never a wall |

Note there is **no batching/single-signature concern on-chain**: the whole library call runs inside one transaction (the consuming contract's function call), so N attestations happen in that one tx with no per-attestation wallet prompt. Batching (Q5) is a purely off-chain problem.

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
| Add/remove a MIRROR on existing DATA | 1 attest/revoke, but dev must know scheme allowlist (ADR-0023) + transport priority | Scheme validation, transport tagging, lens-scoped ordered read | **Wrap** |
| Sort a folder/list after modification | `processItems` with hand-computed left/right hints; multicall sort keys; handle `StaleStartIndex` + already-processed no-ops; honor tie-break + key-padding rules | Computes hints client-side, batches, retries on concurrency, exposes staleness — none of which is feasible to hand-roll correctly | **Wrap — high value** |
| Schema UIDs, contract addresses | Hardcoded hex strings | Typed constants module, version-checked | **New primitive — SDK only** |
| Lens management | URL query param only (ADR-0031) | Client-side state, visible default, ENS resolution, multi-lens composition | **New primitive — SDK only** |
| Raw contract calls (EFSIndexer, EFSFileView, etc.) | `new Contract(ADDR, ABI, signer)` — verbose | `efs.raw.indexer` — pre-wired instance | **Thin wrap** |

**What EAS already does well (don't re-wrap, just expose):**
- `eas.attest()` / `eas.multiAttest()` / `eas.revoke()` / `eas.multiRevoke()`
- `eas.getAttestation(uid)`, `eas.getSchemaUID()`
- Schema registry operations

---

### Package Structure

Two artifacts in two languages: **one TypeScript package** (`@efs/sdk`) and **one Solidity library**. The earlier "two TS packages (`onchain`/`offchain`)" layout was a misread of deliverable #1 — corrected here.

**The TypeScript off-chain SDK** — a single npm package. ABI types are generated from `contracts/` at build time (`wagmi generate`/`typechain`) so the schema/address constants stay in sync.

```
@efs/sdk/                      (the one package devs `npm install`)
  src/
    client.ts        EFSClient class + instantiation/lens resolution
    fs.ts            file read/write/stat/list + mirror management
    graph.ts         Anchor tree, TAG/PIN traversal, referencing/decode bridge
    props.ts         PROPERTY typed access
    lists.ts         LIST + LIST_ENTRY
    sorts.ts         sort overlay: discover/declare/read + processItems hinting
    lenses.ts        lens management (client-side)
    batch.ts         batch builder → EIP-5792 / 4337 / sequential
    eas.ts           efs.EAS — raw EAS SDK exposure
    raw.ts           efs.raw — contract escape hatches
    decode.ts        efs.decode — raw attestation → typed entry
    cache.ts         read-through content cache (IPFS/Arweave/HTTPS)
    constants.ts     schema UIDs, contract addresses, sort-func addresses (generated)
    index.ts         re-exports
  examples/
    node-server/     server-side hot-wallet write example
    browser-react/   MetaMask read/write example
```

**The Solidity on-chain SDK** — a library + inheritable base contract (`EFS.sol` library, `EFSWriter` base, `EFSConstants`/interfaces). Specified in the "On-chain SDK (Solidity)" section below.

> **Q1 — REOPENED by the 2026-05-28 reframe.** The original Q1 ("single `sdk/` repo") was resolved when *both* SDKs were assumed to be TypeScript. Now that the on-chain SDK is **Solidity tightly coupled to the immutable contracts**, its natural home is arguably `contracts/` (same Foundry/Hardhat toolchain, imports the core interfaces, deploys/verifies alongside, version-locked to the schemas it encodes) rather than a separate `sdk/` repo. The TypeScript SDK clearly lives in its own `sdk/` repo regardless. **The live fork is only: where does the Solidity library live — `contracts/` (co-located, recommended) or `sdk/contracts/` (with the TS SDK)?** See Open Questions Q1.

**Consumer install:**
```bash
npm install @efs/sdk                       # off-chain (TypeScript) — the normal install
forge install efs/contracts                # on-chain (Solidity) — for smart-contract devs
```

---

### API Surface

#### Instantiation

```ts
import { EFSClient } from '@efs/sdk'

const efs = new EFSClient({
  rpc: "https://eth-sepolia.g.alchemy.com/v2/...",
  chainId: 11155111,

  // Lenses: OPTIONAL. If omitted, the lens stack defaults to the connected
  // wallet's own address — you see your own content first. Pass an explicit
  // stack to view through others' lenses (precedence order matters).
  lenses?: ["alice.eth", "0xBob..."],

  // Signer: optional at construction. Required for writes — and, when no
  // explicit `lenses` are given, the source of the default lens (see below).
  signer?: ethers.Signer | viem.WalletClient,
})

// Late-bind a signer (MetaMask flow). On connect, if no explicit lenses were
// set, the default lens becomes the connected wallet's address.
await efs.connect(walletClient)
```

**Design note on lens defaulting (Q4 resolved):** The *original* bug was that the current client silently uses the **deployer's** lens — so users saw the deployer's content, not their own or a chosen author's ("why am I seeing the deployer's carbonara?"). The fix is not "force everyone to declare a lens" (that taxes every hello-world); it's **default to the connected wallet's own address**. Your own wallet is always a safe default — you see what *you* published, never a stranger's. Resolution order for the effective lens stack on any read:

1. The per-call `opts.lenses` override, if given.
2. The client's explicit `lenses`, if set at construction / via `efs.lenses`.
3. Otherwise, **the connected wallet's address** (single-element stack).
4. If none of the above — read-only client with no wallet and no explicit lenses — a read throws `LensRequired` with a message telling the dev to either connect a wallet or pass `lenses`. (A read with no lens is meaningless: there's no attester to resolve content from.)

This keeps "install, connect wallet, read your own files" zero-config while making cross-author viewing an explicit, visible choice.

---

#### Naming conventions (the verb contract)

Q2 resolved toward resource-oriented namespaces *with a consistent verb vocabulary*. That promise is only worth making if it's mechanical, so here is the exact contract every leaf method obeys. A dev (or agent) who learns these eight verbs can predict the method name for any namespace:

| Verb | Meaning | Returns | Examples |
|---|---|---|---|
| `get(key)` | Retrieve the namespace's **primary resource** by key | that resource's natural shape, or `null`/`undefined` if absent | `props.get`→value · `pins.get`→`PinEntry` · `lists.get`→`ListSpec` · `EAS.getAttestation`→attestation |
| `list(container)` | Enumerate the namespace's **primary collection** | `AsyncIterable` (or `Promise<Array>` only when inherently bounded — see below) | `fs.list` · `tags.list` · `props.list` · `mirrors.list` · `sorts.list` |
| `set(key, value)` | Bind a **singleton** (cardinality-1); supersedes the prior binding | the new attestation UID | `props.set` · `pins.set` · `sorts.setDefault` · `lenses.set` |
| `add(target, …)` | Append a **cardinality-N** edge/member | the new attestation UID | `tags.add` · `lists.add` · `mirrors.add` · `lenses.add` |
| `remove(uid)` | Revoke a cardinality-N edge/member | `Promise<void>` | `tags.remove` · `lists.remove` · `mirrors.remove` · `lenses.remove` |
| `clear(key)` | Revoke a **singleton** binding | `Promise<void>` | `pins.clear` (and `unplace`, its file-placement alias) |
| `create(spec)` | Mint a brand-new resource | the new resource UID | `lists.create` |
| `declare(parent, concept)` | Register a **shared concept** others can implement | naming-anchor + impl UID | `sorts.declare` |

Note `get` is deliberately polymorphic in *return type* but monomorphic in *meaning*: it always retrieves "the one thing this namespace is named for" — for `efs.props` that thing is a value, for `efs.graph.pins` it's a PIN. The return type differs because the resources differ; the verb does not.

**Relationship traversals keep relationship names** rather than collapsing to `list`: `graph.children`, `graph.subtree`, `graph.versions.ancestors`, `graph.versions.descendants`, and `lists.entries`. These name a *specific* graph relation, not generic enumeration, so a descriptive name is clearer than `list` (the same reason Prisma keeps `findMany` distinct from relation accessors). `lenses.active()` is state inspection, not enumeration, so it is not `list` either.

**Eager array vs `AsyncIterable` — the rule:** a read returns `Promise<Array>` **only** when the result is inherently bounded and small (the PROPERTYs on one UID, the MIRRORs on one DATA, the sort concepts on one container). Anything that can grow without bound (directory children, tags on a popular target, sorted reads) returns `AsyncIterable` and is paginated. Each method states which it is; the rule lets you predict it.

---

#### `efs.fs` — Filesystem (primary surface)

```ts
// Every read accepts an optional per-call lens override. When omitted, the client's
// lens stack (set at construction / via efs.lenses) is used. This lets a caller read
// one path through a different lens without mutating client state (e.g. compare views).
type ReadOpts = { lenses?: Address[] }
type ListOpts = ReadOpts & { limit?: number; cursor?: Hex; sort?: Hex | string; schema?: Hex }

// Read
efs.fs.read(path: string, opts?: ReadOpts): Promise<Uint8Array>
efs.fs.read.text(path: string, opts?: ReadOpts): Promise<string>
efs.fs.read.json<T>(path: string, opts?: ReadOpts & { schema?: ZodSchema<T> }): Promise<T>

// List directory — always AsyncIterable (never an eager array).
// `sort` accepts a SORT_INFO UID or a sort name (resolved via efs.sorts discovery);
// omitting it returns kernel insertion order. See efs.sorts for sorted reads + maintenance.
efs.fs.list(path: string, opts?: ListOpts): AsyncIterable<DirEntry>

// Stat (metadata without reading the payload)
efs.fs.stat(path: string, opts?: ReadOpts): Promise<FileStat>
// returns: { anchorUID, dataUID, attester, contentType, size, mirrors[], time }

// Resolve path → anchor UID (lower-level; useful when you need the UID)
efs.fs.resolve(path: string): Promise<Hex>

// Mirrors — retrieval URIs for a DATA. Multiple transports per DATA (ADR-0011/0012);
// reads are lens-scoped (ADR-0013). First-class because adding redundancy mirrors
// (ipfs/arweave) to existing content is a core archival operation, not just a write-time concern.
efs.fs.mirrors.list(dataUID: Hex, opts?: ReadOpts): Promise<MirrorEntry[]>
// MirrorEntry: { uid, uri, transport, attester } — ordered by transport priority (ADR-0012)
efs.fs.mirrors.add(dataUID: Hex, uri: string): Promise<Hex>   // attest MIRROR; validates scheme (ADR-0023)
efs.fs.mirrors.remove(mirrorUID: Hex): Promise<void>          // revoke

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
// WriteReceipt: {
//   anchorUID, dataUID, placementPinUID, txHashes, totalGas,
//   attestationCount,   // EAS attestations (DATA + MIRROR + contentType triple + PIN + visibility TAGs + new anchors)
//   chunkDeployCount,   // SSTORE2 ~24KB chunk CONTRACTS deployed for on-chain (web3://) content — NOT attestations
// }
// On-chain storage is two cost classes: attestations AND chunk-contract deploys. They're reported
// separately because a 2MB file is ~10 attestations but ~80 chunk deploys — the gas lives in the chunks.
```

**Design note on `fs.list` vs array:** The brainstorm found a sports-stats dev tried `list("/mlb/2025", { recursive: true })` and got a 60-second stall or a `QueryTooLargeError`. `list` is always `AsyncIterable` with explicit pagination; consuming all results requires `collect(efs.fs.list(path))`. A `collect()` helper is exported for small folders.

**Design note on resumable pagination (cursors):** `for await` auto-paginates, but a server rendering page 2 of a feed needs to *resume* from where page 1 stopped — across requests, with no live iterator in memory. So every `AsyncIterable`-returning read has a `.page()` companion that surfaces the cursor:

```ts
type Page<T> = { items: T[]; nextCursor: Hex | null }   // nextCursor === null ⇒ exhausted

const p1 = await efs.fs.list("/feed").page({ limit: 50 })
// ...later request, different process:
const p2 = await efs.fs.list("/feed").page({ limit: 50, cursor: p1.nextCursor })
```

The bare iterable threads the cursor internally; `.page()` exposes it. This is the Stripe/Prisma pattern (`page.nextCursor`) and is what keeps devs from dropping to raw EAS for "give me the next 50." The cursor is opaque (an encoded kernel index + filter state), stable across redeploys of stateless contracts, and validated on use — a stale cursor throws `CursorInvalid` rather than silently skipping items.

---

#### `efs.graph` — Graph traversal (Tags, Pins, Anchors)

```ts
// Anchor tree navigation
efs.graph.children(anchor: Hex, opts?: PaginateOpts): AsyncIterable<AnchorEntry>
efs.graph.path(anchor: Hex): Promise<string>       // UID → "/foo/bar/baz"
efs.graph.subtree(anchor: Hex, opts?: { depth?: number }): AsyncIterable<AnchorEntry>

// Attestations that reference a given UID, optionally filtered by schema. First-class wrapper
// over EFSIndexer.getReferencingAttestationUIDs (debug-client parity, M-level). Yields decoded
// edges; pass `raw: true` to get bare UIDs for hand-off to efs.EAS. Reverse of `pins`/`tags`.
efs.graph.referencing(uid: Hex, opts?: PaginateOpts & {
  schema?: Hex            // e.g. SCHEMAS.PIN, SCHEMAS.TAG; omit for all
  raw?: boolean           // true → AsyncIterable<Hex>; default → decoded edges
}): AsyncIterable<EdgeEntry | Hex>

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

// Time-ordered stream of everything touching an anchor.
// Needs external indexing infrastructure (see note) → throws NotImplemented in v1.
efs.graph.timeline(anchor: Hex): AsyncIterable<TimelineEvent>
// TimelineEvent: { type: 'tag'|'pin'|'property'|'data'|'mirror', uid, attester, time, ... }

// previousVersion version DAG helpers.
// ancestors walks the on-chain previousVersion pointer (works in v1).
efs.graph.versions.ancestors(dataUID: Hex): AsyncIterable<Hex>
// descendants is reverse-lookup → needs external indexing → throws NotImplemented in v1.
efs.graph.versions.descendants(dataUID: Hex): AsyncIterable<Hex>
```

**Design note on lens scoping in `efs.graph`:** `efs.fs` is the lens-*resolving* path — `fs.read`/`fs.stat` apply the first-attester-wins fallback across the lens stack (ADR-0031/0041) to pick the winning content. `efs.graph` is deliberately lower-level: `pins.get(definition, { attester })` reads exactly one attester's PIN in O(1) (no fallback), and `tags.list(target, { allAttesters })` enumerates raw edges. This is intentional — graph methods expose the unresolved edge data; if you want lens-resolved placement, use `fs`. A dev calling `graph.pins.get` without specifying `attester` gets the client's primary (first) lens, not a fallback walk. Documented so nobody assumes `graph` silently applies lens precedence.

**Design note on reverse-lookup reads (`graph.timeline`, `graph.versions.descendants`, `lenses.discover`):** these are *reverse* lookups ("who points AT this?", "what happened across time?") that EFS's on-chain data can't answer efficiently without an external index — and per James's 2026-05-28 steer, **the SDK does not bundle or build indexing infrastructure** (no The-Graph integration, no packaged Postgres mirror). We keep these few methods in the typed surface as **`NotImplemented` shims** so the intended shape is visible and stable, rather than pretending or hand-waving — calling one throws `NotImplemented` with a message naming the capability it needs. Everything that *can* be answered from the chain directly (forward reads, `versions.ancestors`, `graph.referencing` via `getReferencingAttestationUIDs`) works in v1 without any external tool. A packaged external index is explicitly DEFERRED (D1) to its own design thread.

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
// Create a List (returns listUID).
// PRE-FLIGHT: the SDK rejects opt combinations ListResolver would revert on (ADR-0044 §3) before
// signing — notably appendOnly && allowsDuplicates && maxEntries === 0 → ListConstraintViolation.
efs.lists.create(opts: {
  allowsDuplicates: boolean
  appendOnly: boolean
  targetType: 'ANY' | 'ADDR' | 'SCHEMA'
  targetSchema?: Hex    // required if targetType === 'SCHEMA'
  maxEntries?: number   // 0 = unbounded
}): Promise<Hex>

// Add entry to a list (returns LIST_ENTRY UID).
// `target` is dispatched by the list's targetType (ADR-0044 §2 — no in-band polymorphism):
//   ADDR   → an Address; encoded into EAS `recipient` with on-chain target = bytes32(0)
//   ANY/SCHEMA → a UID (Hex); encoded into the `target` field
// The SDK reads the list's targetType and routes encoding accordingly; passing the wrong kind throws.
// `weight` is the LIST_ENTRY's int256 weight — SIGNED (negatives are valid, e.g. downvotes/ranking).
// `reSort` (default: the list's default sort if one is set) folds the new entry into the
// sort overlay after the insert confirms — see the design note on sort-after-modification.
efs.lists.add(listUID: Hex, target: Hex | Address, opts?: {
  weight?: bigint                 // int256, signed
  properties?: Record<string, string>   // PROPERTYs scoped to the LIST_ENTRY UID (ADR-0044 §7)
  reSort?: Hex | string | false   // sort to maintain after insert; false = skip
}): Promise<Hex>

// Remove entry (revokes LIST_ENTRY, rejected if appendOnly).
// Removal is a no-op for the overlay (revoked nodes are skipped at read time), so no re-sort needed.
// NOTE: this does NOT reclaim space — the entry's UID stays in the append-only kernel array
// (ADR-0009) and in the sorted linked list forever; staleness and traversal cost don't shrink.
efs.lists.remove(entryUID: Hex): Promise<void>

// Iterate entries of a list (lens-scoped). With `sort`, returns sorted order via the overlay
// (efs.sorts.read under the hood); without it, kernel insertion order.
efs.lists.entries(listUID: Hex, opts?: ListOpts): AsyncIterable<ListEntry>
// ListEntry: { uid, target, weight, attester, properties, attestedAt }

// Get the LIST declaration
efs.lists.get(listUID: Hex): Promise<ListSpec>

// Place a list at a path anchor (creates PIN from anchor → list)
efs.lists.placeAt(path: string, listUID: Hex): Promise<Hex>
```

**Design note on sort-after-modification:** A list is a directory; entries live in the kernel in insertion order, and ordering is the shared **sort overlay** (`efs.sorts`), not a property of the LIST. Because `processItems` validates each item against its post-insert kernel position, the overlay can only be advanced *after* the LIST_ENTRY attestation confirms — re-sorting is therefore inherently a second phase, not part of the insert's `multiAttest`. `efs.lists.add(..., { reSort })` orchestrates this: it appends the entry, waits for confirmation, then calls `efs.sorts.process(listAnchor, reSort)` to fold the entry into place. Sorting is a shared public good (any caller can advance any sort), so a reader can also bring a stale list current itself via `efs.sorts.process` — the SDK never assumes the writer is the only one maintaining order.

---

#### `efs.sorts` — Sort overlay (folders **and** lists)

Ordering in EFS is a lazy, caller-paid **overlay** keyed by `(sortInfoUID, parentAnchor)`, shared across all viewers (spec 06/07). The kernel stores children/entries in insertion order; a sort is a linked list folded forward by `processItems`, which takes client-computed insertion hints. Reads are lens-filtered. The same surface serves directory sorting and list sorting because a list *is* a directory.

```ts
// Discover sort concepts available on a container (folder or list anchor).
// Resolves naming anchors (local children with anchorSchema=SORT_INFO + global /sorts/),
// then the best SORT_INFO implementation per the lens hierarchy.
efs.sorts.list(parent: Hex | string, opts?: ReadOpts): Promise<SortConcept[]>
// SortConcept: { namingAnchor, name, sortInfoUID, sortFunc, targetSchema?, scope: 'local'|'global' }

// The per-lens default sort (a `defaultSort` PROPERTY on the parent), if any.
efs.sorts.default(parent: Hex | string, opts?: ReadOpts): Promise<SortConcept | null>
efs.sorts.setDefault(parent: Hex | string, sort: Hex | string): Promise<Hex>

// Declare a sort on a container: creates the naming anchor (anchorSchema=SORT_INFO) if absent,
// then attests this attester's SORT_INFO implementation of that concept. `sortFunc` is an
// ISortFunc address — built-ins exported as SORT_FUNCS.BY_NAME / BY_TIMESTAMP / BY_WEIGHT.
efs.sorts.declare(parent: Hex | string, opts: {
  name: string                 // shared human label, e.g. "ByDate"
  sortFunc: Address
  // sourceType controls which kernel items the sort folds in (SORT_INFO field, spec 07):
  //   'all'    (0) — every child of the parent (default)
  //   'schema' (1) — only children of `targetSchema`; `targetSchema` REQUIRED in this mode
  // Higher values revert on-chain (reserved). Defaults to 'all'.
  sourceType?: 'all' | 'schema'
  targetSchema?: Hex           // required when sourceType === 'schema'; ignored otherwise
}): Promise<{ namingAnchor: Hex; sortInfoUID: Hex }>

// Read a container's children/entries in sorted order, lens-filtered
// (getSortedChunkByAddressList). `maxTraversal` bounds node walks per call (ADR sparse-filter cap).
efs.sorts.read(parent: Hex | string, sort: Hex | string, opts?: ListOpts & {
  showRevoked?: boolean
  maxTraversal?: number
}): AsyncIterable<Hex>

// How far the overlay lags the kernel (kernelCount - lastProcessedIndex). 0 = fully sorted.
efs.sorts.staleness(parent: Hex | string, sort: Hex | string): Promise<number>

// Fold all unprocessed kernel items into the sorted overlay — THE "sort after modification" call.
// Computes hints client-side (multicall ISortFunc.getSortKey → local sort → binary-search
// positions), submits processItems in batches, and transparently handles concurrency:
// StaleStartIndex → refresh getLastProcessedIndex and resubmit; already-processed → silent no-op.
// Resolves when staleness reaches 0. For small lists it can use the on-chain computeHints path.
efs.sorts.process(parent: Hex | string, sort: Hex | string, opts?: {
  maxBatch?: number            // items per processItems tx (gas tuning)
  onProgress?(done: number, total: number): void
}): Promise<SortProcessReceipt>
// SortProcessReceipt: { itemsProcessed, txHashes, finalStaleness }

// Move one item whose sort key changed (mutable content). Idempotent: no-op if already ordered.
efs.sorts.reposition(parent: Hex | string, sort: Hex | string, itemUID: Hex): Promise<void>
```

**Design note on hint computation (the core value-add):** `processItems` deliberately pushes comparison work off-chain — the contract only does O(1) `isLessThan` validation per item, never an N² sort. The SDK owns the matching client side: fetch `getSortKey` for new items via multicall, sort locally, binary-search each into the current ordered list to derive `(leftHint, rightHint)`, then submit. ISortFunc keys append the item UID for deterministic tie-breaking, and numeric keys are fixed-width left-padded so JS lexicographic comparison matches on-chain byte comparison — the SDK's hint utility must honor both rules or it will compute wrong positions. This is precisely the kind of error-prone multi-step that belongs in the SDK, not in every dev's app.

> **Flagged for the schema freeze:** the SORT_INFO field string is inconsistent across specs. `specs/02` §5 and `specs/07` both define it with three fields — `"address sortFunc, bytes32 targetSchema, uint8 sourceType"` — and `specs/07` is the only spec that defines `sourceType` semantics (0 = all children, 1 = schema-filtered by `targetSchema`, 2+ reverts). `specs/06` §2 still shows the stale two-field version `"address sortFunc, bytes32 targetSchema"`. These hash to different schema UIDs. The current evidence (2-of-3 specs, plus the only one defining the field's meaning) favors the **three-field version**; `specs/06` looks like the lagging copy. The SDK is designed against three fields — `efs.sorts.declare` exposes `sourceType` so schema-filtered sorts are expressible, since `targetSchema` only takes effect when `sourceType = 1` (spec 07). Contracts must reconcile `specs/06` to the three-field string and freeze it before the 9-schema freeze (a SORT_INFO field change = a new UID). Surfaced to contracts.

---

#### `efs.lenses` — Lens management

```ts
// Read current lens state
efs.lenses.active(): Address[]     // currently active lenses (client-side)

// Mutate (all client-side; no on-chain tx). All async for a uniform await-able surface —
// add/set must resolve ENS, and remove is async too so callers never mix sync/async on this object.
efs.lenses.add(addr: Address | string): Promise<void>    // resolves ENS
efs.lenses.remove(addr: Address | string): Promise<void>
efs.lenses.set(addrs: (Address | string)[]): Promise<void>

// Discover lenses — reverse lookup; needs external indexing → throws NotImplemented in v1.
efs.lenses.discover(opts?: {
  topic?: string          // filter by topic anchor path
  minAttestations?: number
}): Promise<LensInfo[]>
// LensInfo: { address, ens?, label?, attestationCount, topicPaths[] }
```

**Design note on lens semantics:** Lenses (formerly "editions") are client-side state per ADR-0031. The SDK propagates them through every read. `efs.lenses.add("alice.eth")` resolves ENS and prepends to the active list. This is NOT an on-chain action — the doc must say this clearly and early, because three of the five walkthrough devs burned time searching for the "follow" transaction. When no explicit lenses are set, `efs.lenses.active()` returns the connected wallet's address (the Q4 default); `add`/`set` switch the client to an explicit stack from then on.

---

#### `efs.batch()` — Write batching (primary write UX)

The single most important value-add. A single `efs.fs.write()` compiles into ~6–10 attestations (DATA + MIRROR + the 3-attestation contentType property + placement PIN + folder-visibility TAGs + any new path anchors) — *plus* the SSTORE2 chunk-contract deploys for on-chain content (one per ~24KB; a large file dominates here). The batch builder makes this visible, composable, and limited to one wallet prompt.

```ts
// Fluent builder pattern
const receipt = await efs
  .batch()
  .fs.write("/recipes/pasta/carbonara", bytes, { contentType: "text/markdown" })
  .props.set(dataUID, PROP_KEYS.PREVIOUS_VERSION, prevUID)
  .lists.add(myListUID, dataUID)
  .execute()

// Or via callback (auto-executes — preferred; can't forget .execute())
const receipt = await efs.batch(b => {
  b.fs.write("/birding/obs/2026-05-28/robin-001", jsonBytes).as("robin1")
  b.fs.write("/birding/obs/2026-05-28/robin-002", jsonBytes2).as("robin2")
  b.props.set(anchor1, PROP_KEYS.NAME, "Robin #1")
})

// Estimate before executing
const estimate = await efs.batch(b => {
  for (const obs of observations) b.fs.write(pathFor(obs), toBytes(obs))
}).estimate()
// estimate: { attestationCount, chunkDeployCount, txCount, signatureCount, mechanism, estimatedGasUnits, estimatedUSD? }
// mechanism: 'eip5792' | 'erc4337' | 'sequential' (automatic) | 'gateway' (opt-in only) — see Q5 note below.
// signatureCount reflects the chosen mechanism: 1 for eip5792/erc4337, N for sequential, N for gateway-by-delegation.

// BatchReceipt
type BatchReceipt = {
  txHashes: Hex[]
  results: OperationResult[]    // one per op
  partialFailure?: OperationResult[]   // only populated for the non-atomic 'sequential' mechanism, where
                                       // the user can abandon midway; eip5792/erc4337 are atomic (all-or-nothing)
                                       // so partialFailure is always undefined for them
}

// Each queued op carries a STABLE id so partial-failure results correlate back to the op that
// produced them — order-based indexing breaks when the SDK reorders/dedups/chunks ops internally.
// The id is auto-assigned (op0, op1, …) or caller-supplied via .as("uploadRobin1"); every builder
// method returns the builder for chaining and records the id.
type OperationResult = {
  id: string                  // matches the queued op
  kind: 'write'|'pin'|'tag'|'property'|'list'|'mirror'|'sort'
  ok: boolean
  uid?: Hex                   // the produced attestation UID, when ok
  txHash?: Hex
  error?: { code: EFSErrorCode; message: string }   // when !ok
}
```

**Design note on the two forms:** the callback form (`efs.batch(b => {...})`) auto-executes and is the **recommended** default — there's nothing to forget. The fluent form (`efs.batch().…`) is lazy and only fires on `.execute()`/`.estimate()`; the builder is typed so a batch that's constructed but never executed is a `#[must_use]`-style dangling value (lint + a dev-mode runtime warning on GC of an unexecuted builder), closing the "silently did nothing" footgun the review flagged.

**Batching strategy:**
- Compile all operations to attestation payloads
- Check existing DATA by `contentHash` (skip re-attest if dedup applies)
- Pick a **submission mechanism** by capability detection (next note) to minimize signatures
- Report `signatureCount` AND `txCount` up-front so the dev can warn users accurately
- On partial failure, report which operations succeeded and which failed with errors

**Design note on single-signature writes (Q5 resolved — a core value, with one hard constraint):** A logical write spans multiple EAS schemas (DATA, MIRROR, PROPERTY, PIN, TAG, ANCHOR), and `EAS.multiAttest` batches only *within* a schema — so the naive path is several `multiAttest` calls = several wallet signatures. Collapsing that to **one signature** is core SDK value, so `efs.batch()` owns mechanism selection rather than exposing a flag.

⚠️ **The hard constraint: attestation attribution.** EAS records `msg.sender` as the attester on every `attest`/`multiAttest`. The attester address is **load-bearing for the entire read model** — lenses key on it (ADR-0031), and PROPERTY-value PINs are cardinality-1 *per attester*. So any mechanism that changes who `msg.sender` is **silently corrupts reads**: content gets attributed to the wrong address, and every user of a shared relayer collides in the same PIN slot, each write superseding the last. A batching mechanism is only acceptable if it preserves the **connected wallet** as the attester. This rules out the naive "thin aggregator contract" idea — when a contract calls EAS, the *contract* is the attester, not the user. EAS's fix (`multiAttestByDelegation`) restores correct attribution but requires **one EIP-712 signature per attestation** (per-attester nonce in `EIP1271Verifier`), which defeats single-signature. The mechanisms that deliver **both** one approval **and** correct attribution are EIP-5792 and ERC-4337 only.

At execute time the SDK detects capabilities (`wallet_getCapabilities` for 5792; smart-account detection for 4337) and picks, in preference order:

1. **EIP-5792 `wallet_sendCalls`** — when the wallet advertises atomic batched calls via `wallet_getCapabilities` (a growing share do). All attest calls go up as one batch the user approves once; `msg.sender` stays the user's wallet, so attribution is correct. No EFS contract needed. **Preferred path.**
2. **ERC-4337** — if the signer is a smart account, bundle the calls into one UserOperation (one signature). The account is the attester, which is the correct address for a smart-account user.
3. **Automatic fallback: N sequential `multiAttest` signatures** — for plain EOAs on wallets without 5792. Attribution is trivially correct (the EOA signs each batch). The SDK reports `signatureCount` so the UI can say "this needs 3 signatures," and uses partial-failure semantics if the user abandons midway. This is the **default fallback** — a transparent, no-extra-trust path.
4. **Opt-in only: SDK-owned `EFSUploadGateway` via `multiAttestByDelegation`** — *not* a single-signature mechanism (it costs one EIP-712 signature per attestation) and *not* in the automatic path. A gateway can still add value (sponsored gas, a single on-chain `tx` even if multiple off-chain signatures) but it puts an **SDK-owned upgradeable contract in the signing path**, so it must be **explicitly opted into** (`efs.batch({ via: 'gateway' })`), never selected silently. It is an SDK-owned convenience contract, **NOT EFS-core immutable** — it relays via delegation so the *user* remains the attester (a plain non-delegated aggregator would break attribution and is never used).

The dev sees one API (`efs.batch(...)`); by default the SDK delivers the fewest signatures the wallet allows **without ever changing the attester or introducing trusted contracts silently**. `opts.via` can pin a mechanism for testing or to opt into the gateway (`'eip5792' | 'erc4337' | 'sequential' | 'gateway'`).

**Batch consent & op-integrity:** because one approval can cover many operations, the SDK exposes `batch.preview()` returning a human-readable manifest (every op, target path, and attester) plus an integrity hash; the calls submitted to the wallet are the exact preview set (preview↔execute hash match enforced), so a UI can show the user what they're signing and nothing can be smuggled in between preview and execute.

**SSTORE2 note:** bundling SSTORE2 chunk deploys into one EIP-5792/4337 batch requires the chunk addresses to be pre-derivable — i.e. deployed through a **CREATE2 factory** so the MIRROR/DATA attestations can reference them within the same batch. With plain `CREATE`, chunk addresses aren't known until mined, forcing a second signature; the SDK uses the CREATE2 factory path so large writes stay single-approval where the wallet supports batching.

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

#### `efs.decode` — the bridge back up

`efs.EAS` and `efs.raw` are downward escape hatches, but the review found the cliff is *one-directional*: a dev who drops to `efs.EAS.getAttestation(uid)` to run one query gets a raw EAS attestation and then has to hand-decode it back into the SDK's typed world. `efs.decode` is the return path — it turns a raw attestation (or UID) into the same typed `*Entry` objects the high-level reads return, so dropping down for one call doesn't strand you in raw-land.

```ts
// Decode a raw EAS attestation (from efs.EAS / efs.raw) into a typed SDK entry.
// Dispatches on the attestation's schema UID; throws SchemaMismatch if it isn't an EFS schema.
efs.decode(att: Attestation): AnchorEntry | DataEntry | MirrorEntry | TagEntry | PinEntry | PropEntry | ListEntry

// Or fetch-and-decode in one step (uid → typed entry), when you only have a UID.
efs.decode.byUID(uid: Hex): Promise<DecodedEntry>

// Schema-specific decoders when you already know the type (no dispatch, narrower return):
efs.decode.pin(att: Attestation): PinEntry
efs.decode.tag(att: Attestation): TagEntry
efs.decode.property(att: Attestation): PropEntry
// ... one per EFS schema
```

**Design note on the round-trip:** this closes the "conveniences, not a walled garden" promise in both directions — `efs.EAS`/`efs.raw` let you step *out* of the typed surface; `efs.decode` lets you step back *in*. The `raw: true` flag on reads like `efs.graph.referencing` and the decoders share the same `*Entry` types, so a dev can mix levels in one flow (raw query for reach, decode for ergonomics) without a type impedance mismatch.

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
PROP_KEYS.DEFAULT_SORT         // per-lens default sort for a container (spec 06)

// Built-in ISortFunc implementations (addresses, version-checked like SCHEMAS)
SORT_FUNCS.BY_NAME            // AlphabeticalSort — anchor name
SORT_FUNCS.BY_TIMESTAMP      // TimestampSort — attestation.time
SORT_FUNCS.BY_WEIGHT         // ranks by edge/entry weight (lists, votes)

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
  LensRequired,            // read attempted with no explicit lenses AND no connected wallet (Q4)
  AnchorNameInvalid,       // name fails ADR-0025 validation
  AnchorDepthExceeded,     // path depth > MAX_ANCHOR_DEPTH (ADR-0021)
  MaxLensesExceeded,       // lenses.active().length > MAX_LENSES (ADR-0026)
  BatchSizeExceeded,       // internal — SDK auto-chunks; surfaced only if unchunkable
  NotImplemented,          // called a reverse-lookup method that needs external indexing (v1 shim)
  PartialBatchFailure,     // some ops in a batch failed; BatchReceipt.partialFailure populated
  ListAppendOnlyViolation, // tried to remove entry from appendOnly list
  ListCapExceeded,         // maxEntries reached
  MirrorSchemeRejected,    // URI scheme not in allowlist (ADR-0023)
  CursorInvalid,           // a .page() cursor is stale/unparseable; caller should restart pagination
  ListConstraintViolation, // LIST opts rejected by ListResolver (e.g. appendOnly+allowsDuplicates+maxEntries==0)
  SortKeyConventionError,  // ISortFunc key violates tie-break/padding rules → hints would be wrong
  // Note: processItems StaleStartIndex and already-processed no-ops are handled internally by
  // efs.sorts.process (refresh+retry / silent success), never surfaced as errors.
}
```

---

### Auth / Signer Handling

```ts
// Server-side (Node, hot wallet): no explicit lenses → defaults to the hot wallet's
// own address. You read and write your own content with zero lens config.
const efs = new EFSClient({
  rpc, chainId,
  signer: new ethers.Wallet(process.env.HOT_KEY),
})

// Browser (MetaMask, late-bind): viewing a specific author → explicit lens.
const efs = new EFSClient({ rpc, chainId, lenses: ["alice.eth"] })
// ...later, after MetaMask connect:
await efs.connect(walletClient)   // viem WalletClient OR ethers Signer

// Browser, view-your-own: omit lenses; on connect the lens becomes the user's address.
const efs = new EFSClient({ rpc, chainId })
await efs.connect(walletClient)   // efs.fs.read() now reads the connected user's content

// Pure read-only of a known author (no wallet): lenses REQUIRED.
const efs = new EFSClient({ rpc, chainId, lenses: ["alice.eth"] })
// efs.fs.read() works; efs.fs.write() throws WalletRequired.
// Omitting both signer and lenses → efs.fs.read() throws LensRequired (no attester to resolve).
```

**Design note:** The brainstorm found the server-side (Node hot-wallet) path is "underdocumented." The SDK should have a first-class Node/server example in the README alongside the browser example, not hidden in a footnote.

---

### TypeScript DX

All returns are fully typed — no `any`. The SDK exports:

```ts
// Core types (tree-shakeable)
export type {
  Hex, Address,
  AnchorEntry, DataEntry, DirEntry, FileStat,
  TagEntry, PinEntry, EdgeEntry,
  PropEntry, PropView,
  DecodedEntry,
  ListSpec, ListEntry,
  LensInfo,
  SortConcept, SortProcessReceipt,
  MirrorEntry,
  WriteReceipt, BatchReceipt,
  OperationResult,
  TimelineEvent,
  ReadOpts, ListOpts, PaginateOpts,
  Page,
  MirrorSpec, WritePhase,
}

// Zod schemas for runtime validation (optional peer dep)
export { AnchorEntrySchema, FileStatSchema, ... } from '@efs/sdk/schemas'
```

**Inspiration citations:**
- **viem** — type-safety for contract interactions; we adopt their `Hex` / `Address` branded types
- **Prisma** — fluent typed reads with optional includes; the `efs.fs.read.json<T>()` pattern
- **Stripe** — resource-namespaced API (`stripe.customers`, `stripe.charges`) → our `efs.fs`, `efs.graph`, `efs.lists`, `efs.sorts`
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
| `EASx.getReferencingAttestationUIDs(uid, schema, ...)` | `efs.graph.referencing(uid, { schema })` (first-class wrapper) |
| `EASx.indexAttestation(uid)` | `efs.raw.indexer.write.indexAttestation([uid])` |
| `EFS.connect(signer)` | `await efs.connect(signer)` |
| Hardcoded `contractConstants.ts` | `import { SCHEMAS, CONTRACTS } from '@efs/sdk/constants'` |

All debug-client capabilities are directly covered; the few that touch raw attestations have a first-class wrapper (`efs.graph.referencing`) and a decode path (`efs.decode`) so parity never requires hand-rolling against `efs.EAS` / `efs.raw`.

---

## On-chain SDK (Solidity)

Everything above is the TypeScript SDK. This section specifies the **separate Solidity deliverable** for smart-contract developers whose own contracts write to EFS (e.g. a DAO archiving proposals, an NFT contract pinning metadata, a registry recording provenance).

### Form: library + inheritable base (never a deployed singleton)

Two ways to consume it, both executing in the **caller's** context so the caller's contract is the EAS attester (the load-bearing constraint from "Two deliverables" above):

```solidity
// (1) Inheritable base — holds the EAS address + schema constants, exposes _efs* helpers.
import {EFSWriter} from "efs-contracts/sdk/EFSWriter.sol";

contract MyDAO is EFSWriter {
    constructor(IEAS eas) EFSWriter(eas) {}

    function archiveProposal(uint256 id, bytes calldata doc) external {
        // one call composes DATA + MIRROR + contentType-PROPERTY triple + placement PIN
        // + folder-visibility TAGs; MyDAO is msg.sender → MyDAO is the attester.
        _efsPinFile(string.concat("/dao/proposals/", _toString(id)), doc, "application/pdf");
    }
}

// (2) Library with `using` — for contracts that can't or don't want to inherit.
import {EFS} from "efs-contracts/sdk/EFS.sol";

contract MyApp {
    using EFS for IEAS;
    IEAS constant eas = IEAS(0x4200...);   // canonical EAS

    function save(bytes calldata content) external {
        eas.pinFile("/app/blobs/latest", content, "application/octet-stream");
    }
}
```

A Solidity `library` with `internal` functions is **inlined** into the consuming contract (no separate deployment, no delegatecall hop); the inheritable base compiles in the same way. Either path keeps `msg.sender == address(consumingContract)` when EAS is called. A *separately deployed* helper called via a normal `CALL` would make the **helper** the attester and is therefore never offered.

### Write surface (the value-add: one call ⟶ the correct attestation sequence)

```solidity
library EFS {
    // Compose a file write: DATA (+ MIRROR for the content), contentType PROPERTY triple,
    // placement PIN at the path's file-anchor, and folder-visibility TAGs for new ancestors.
    // Returns the DATA UID and the placement PIN UID.
    function pinFile(IEAS eas, string memory path, bytes memory content, string memory contentType)
        internal returns (bytes32 dataUID, bytes32 pinUID);

    // Lower-level placement: PIN(refUID = dataUID, definition = fileAnchor). Singleton; supersedes.
    function place(IEAS eas, bytes32 fileAnchor, bytes32 dataUID) internal returns (bytes32 pinUID);

    // Cardinality-N labelled/weighted edge (ADR-0041). weight is signed int256 (negatives valid).
    function tag(IEAS eas, bytes32 target, bytes32 definition, int256 weight) internal returns (bytes32 tagUID);

    // PROPERTY value as the 3-attestation singleton rebind (key ANCHOR if new + PROPERTY + binding PIN).
    function setProperty(IEAS eas, bytes32 keyAnchor, bytes memory value)
        internal returns (bytes32 propUID, bytes32 bindingPinUID);

    // Resolve (creating if absent) the anchor chain for a path; returns the leaf anchor UID.
    function anchorAt(IEAS eas, string memory path) internal returns (bytes32 anchorUID);

    // Lists (ADR-0044): create a LIST, then append entries.
    function createList(IEAS eas, ListConfig memory cfg) internal returns (bytes32 listUID);
    function addEntry(IEAS eas, bytes32 listUID, bytes32 target, int256 weight) internal returns (bytes32 entryUID);
}
```

### Read surface — O(1) only

```solidity
    // The active PROPERTY value for a key, as seen by one attester. O(1) via getActivePin (ADR-0041).
    function propertyValue(IEAS eas, bytes32 keyAnchor, address attester) internal view returns (bytes memory);

    // The active PIN for a definition, by attester. O(1).
    function activePin(IEAS eas, bytes32 definition, address attester) internal view returns (bytes32);
```

**Enumeration (children, tags-on-a-target, sorted reads) is deliberately absent on-chain** — it is unbounded-gas and impractical inside a transaction. A contract that needs to *react to* graph contents reads a specific O(1) value (a PROPERTY or a PIN) it was given the key for; broad traversal belongs to the off-chain SDK. Lenses are likewise an off-chain read-time concept: on-chain reads name an explicit `attester` rather than walking a precedence stack.

### Constants & escape hatch

```solidity
import {EFSConstants} from "efs-contracts/sdk/EFSConstants.sol";
// EFSConstants.ANCHOR_SCHEMA, .DATA_SCHEMA, .PIN_SCHEMA, … as `bytes32 constant`,
// generated from the deployed registry and version-locked to the contracts release.

// Escape hatch: the helpers are sugar over EAS + these constants. Any contract can bypass the
// library and call eas.attest(...) / eas.multiAttest(...) directly with the raw schema encodings —
// the library never hides state and never gates access.
```

### No batching / signature problem on-chain

Unlike the off-chain SDK (where multiple attestations across schemas mean multiple wallet prompts — the whole Q5 problem), an on-chain library call runs **inside one transaction** already: the consuming contract makes N attestation calls during its own execution, triggered by a single user transaction to *that contract*. There is no per-attestation prompt and nothing to batch. The single-signature machinery (EIP-5792 / 4337 / sequential) is purely an off-chain concern.

### Open question on packaging

Where the Solidity source lives (`contracts/` vs `sdk/contracts/`) is the reopened **Q1** — see Open Questions. The recommendation is `contracts/`: a library that imports the core contract interfaces and encodes their schema UIDs is naturally version-locked to, built with, and deployed/verified alongside the contracts.

---

## Open Questions

- [ ] **Q1 (repo packaging) — REOPENED by the 2026-05-28 on-chain/off-chain reframe.** The prior resolution ("everything in one `sdk/` repo") assumed *both* SDKs were TypeScript. They aren't: the TS SDK (`@efs/sdk`) lives in its own `sdk/` repo (settled), but the **Solidity** on-chain library now has a real choice of home. **(a) `contracts/`** — co-located with the immutable contracts it imports and version-locks to; same Foundry/Hardhat build; deployed/verified together. **(b) `sdk/contracts/`** — kept with the TS SDK so "the SDK" is one repo. PM rec: **(a) `contracts/`** — a Solidity library that imports the core interfaces and hardcodes their schema UIDs is a contracts-repo artifact; splitting it from the contracts invites version skew. TS-side ABI/const generation already crosses the repo boundary cleanly either way.

- [x] **Q2 (namespace naming) — RESOLVED (James, 2026-05-28): confirmed (a) + the codified verb contract.** domain-model namespaces (`efs.fs`, `efs.graph`, `efs.props`, `efs.lists`, `efs.sorts`, `efs.lenses`, `efs.EAS`, `efs.raw`) vs verb-first (`efs.read/write/query/attest`). An expert SDK-design review (2026-05-28) found **(a) is the de-facto industry standard** — *resource-oriented design*, codified in Google's API Design Guide and embodied by Stripe (`stripe.customers.create`), Prisma (`prisma.user.findMany`), Twilio, Supabase, GitHub Octokit. **No widely-respected SDK uses a top-level verb-namespace tree.** The field splits between resource.action namespacing (multi-resource domains — EFS's case) and flat verb methods (single-resource domains like EAS/ethers). Verb-first also fails EFS specifically because `graph` and `lenses` are resource models, not actions, and don't reduce to a single verb. **Refinement adopted from the review:** keep (a)'s noun tree but enforce a *consistent verb vocabulary* on the leaves — this pairs resource-oriented design with Google's "standard methods" discipline, giving both a domain map and predictable operation names. An expert SDK-design review (2026-05-28) noted the first draft *claimed* this consistency but did not deliver it (`get` was used for three different things; enumeration used five different verbs). That is now fixed: the eight-verb contract is codified in **"Naming conventions (the verb contract)"** above and every leaf method conforms. **Recommendation: confirm (a) + the codified verb contract.**

- [x] **Q3 (reverse-lookup reads in v1) — RESOLVED + REFRAMED (James, 2026-05-28).** Original framing ("ship an off-chain index / reference EFS-in-Postgres example") was dropped: per James, the SDK does **not** bundle or build indexing infrastructure (nothing to do with The Graph). The handful of reverse-lookup methods (`graph.timeline`, `graph.versions.descendants`, `lenses.discover`) stay in the typed surface as **`NotImplemented` shims** so their shape is visible and stable; everything answerable directly from the chain works in v1. A packaged external index is DEFERRED (D1) to its own thread. (Renamed `OffchainIndexRequired` → `NotImplemented`; removed the `examples/reference-index/` project.)

- [x] **Q4 (lens default) — RESOLVED (James, 2026-05-28): default the lens to the connected wallet's address.** Don't always require an explicit lens — that taxes hello-world. Instead default the lens stack to the **connected wallet's own address**, and require an explicit lens *only* when no wallet is connected (a read with no attester is meaningless → `LensRequired`). The deployer default was the original bug; the user's own wallet is a safe default. See "Design note on lens defaulting" in Instantiation for the four-step resolution order.

- [x] **Q5 (single-signature writes) — RESOLVED (James, 2026-05-28; corrected after 2nd expert review).** No placeholder flag. `efs.batch()` delivers one signature where the wallet allows, constrained by the hard rule that **the connected wallet must stay the attester** (lenses + cardinality-1 PINs key on it). Only EIP-5792 `wallet_sendCalls` and ERC-4337 deliver one approval AND correct attribution; the **automatic fallback for plain EOAs is transparent sequential signing** (not a contract). The SDK-owned upgradeable `EFSUploadGateway` is **opt-in only** (`via: 'gateway'`), uses `multiAttestByDelegation` to keep the user as attester, and is explicitly **not** a single-signature mechanism. See "Design note on single-signature writes" in the batch section.

**Status: one open fork (Q1 repo home for the Solidity library) — otherwise resolved.** The 2026-05-28 on-chain/off-chain reframe reopened Q1; Q2–Q5 remain resolved. Held at `#status/review` per design mode; not self-promoting. James's two calls: (1) the Q1 fork, and (2) promote vs. revise on the reframed doc.

---

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred — Q2–Q5 RESOLVED; **Q1 reopened** by the on-chain/off-chain reframe (Solidity library repo home)
- [ ] `**Target repos:**` — TS SDK in new `sdk/` repo (settled); Solidity library repo home is Q1 (open); planning — design doc only
- [x] `**Depends on:**` chain — design-system accepted ✅; brainstorm-system in review; ADR-0031 accepted ✅; ADR-0041 accepted ✅; ADR-0044 pending Lists merge (implementation gated, not design gated)
- [x] No `<!-- AGENT-Q: -->` comments left in the design body
- [x] At least one round of `#status/review` — expert subagent review pass (2026-05-28) + James Q1–Q5 resolutions

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

---

### Revision log

**2026-05-28 — expert subagent review pass (James-requested, pre-frame-review).** Two parallel expert reviewers (SDK API/DX, and contract-fidelity against the `custom-lists` specs/ADRs) audited the draft. Both validated the *frame* (namespaces, layering, batch-as-value-add, lens model, PIN/TAG/PROPERTY semantics, sort-overlay mechanics — the last verified faithful in detail). Findings folded in:
- **Verb contract codified.** The draft *claimed* a consistent verb vocabulary but didn't deliver (`get` meant three things; enumeration used five verbs). Added the eight-verb "Naming conventions" contract and made every leaf conform.
- **SORT_INFO flag corrected + `sourceType` exposed.** Fidelity check found specs 02 + 07 both carry the 3-field version (only spec 06 is stale), and that `targetSchema` is inert without `sourceType=1`. `sorts.declare` now exposes `sourceType`; the freeze flag points contracts at the 3-field string.
- **Resumable cursors.** Added `Page<T>` + `.page()` companion on every `AsyncIterable` read, and stated the eager-array-vs-iterable rule explicitly.
- **Bidirectional escape hatch.** Added `efs.decode` (raw attestation → typed entry) and a first-class `efs.graph.referencing` wrapper (debug-client parity), closing the one-way cliff into raw-land.
- **Lists fidelity (ADR-0044).** Pre-flight rejection of `appendOnly+allowsDuplicates+maxEntries==0`, ADDR-mode `recipient` encoding, signed `int256` weight, removal-doesn't-reclaim-space note.
- **Write cost honesty.** `WriteReceipt`/`estimate` now separate `attestationCount` from `chunkDeployCount` (SSTORE2 chunk deploys aren't attestations and dominate large-file gas).
- **Smaller:** `lenses.remove` made async; `OperationResult` carries a stable op id (+ `.as()`); callback batch marked preferred with an unexecuted-builder guard; lens-precedence behavior of `efs.graph` documented.

These are all within-frame refinements — none changed the architecture. The doc remains at `#status/review` for James's promote/revise call.

**2026-05-28 — Q1–Q5 resolved (James), folded in one pass.** Q1 (single `sdk/` repo) and Q2 (resource-oriented namespaces) confirmed as already designed. Three design changes:
- **Q3:** off-chain-index methods stay and throw `OffchainIndexRequired`; added a runnable reference index example (`examples/reference-index/`) so the throw points at real code.
- **Q4:** dropped "explicit lens always required." The lens now **defaults to the connected wallet's own address** (your own content is a safe default; the deployer default was the original bug). Explicit lens required only when no wallet is connected (`LensRequired`). New four-step resolution order documented in Instantiation.
- **Q5:** removed the placeholder `gateway` flag. `efs.batch()` now owns single-signature delivery by capability detection — EIP-5792 → ERC-4337 → SDK-owned upgradeable `EFSUploadGateway` (explicitly not EFS-core) → sequential fallback — reporting `signatureCount`/`mechanism`.

All five open questions are now RESOLVED; the doc is held at `#status/review` per design mode.

**2026-05-28 — second expert review (3 agents: wallet/EIP-5792, EAS-attribution fidelity, security/authz) caught a Q5 correctness defect; corrected.** The first-pass Q5 design listed an `EFSUploadGateway` aggregator as automatic mechanism #3. The fidelity reviewer flagged this as **flat wrong**: when a contract calls EAS, EAS records the *contract* as `msg.sender`/attester — so a plain aggregator attributes all content to the gateway address, collapsing every user into one cardinality-1 PIN slot and breaking lens resolution. EAS's `multiAttestByDelegation` restores the user as attester but costs **one signature per attestation** — so it is not a single-signature mechanism at all. Corrections folded in:
- **Only EIP-5792 and ERC-4337 deliver one approval AND correct attribution.** Stated the "attester is load-bearing" hard constraint explicitly in the Q5 note.
- **Demoted the gateway to opt-in (`via: 'gateway'`), never automatic;** it relays by delegation (user stays attester) and is explicitly not single-signature. **Promoted transparent sequential signing to the automatic EOA fallback** (security: don't put an upgradeable SDK-owned contract in the signing path silently).
- **Capability detection named:** `wallet_getCapabilities` for 5792; smart-account detection for 4337.
- **Batch consent/op-integrity:** added `batch.preview()` returning a manifest + integrity hash with preview↔execute hash enforcement (closes the op-smuggling gap a single approval otherwise opens).
- **SSTORE2 + CREATE2:** documented that bundling chunk deploys into one batch needs a CREATE2 factory (addresses must be pre-derivable) to stay single-approval.
- **`partialFailure` scoped** to the non-atomic sequential path only (5792/4337 are all-or-nothing).

This is the only architecture-touching change since the frame review and it is a *correctness* fix, not a scope change. Remaining lower-severity review notes (read-path content-hash verification on mirrors, mutable ENS lens-membership, the connect-time lens self-default surfacing in `efs.batch.preview` rather than silently) are tracked as implementation-notes refinements and don't block the frame decision. Doc remains at `#status/review` for James's promote/revise call.

**2026-05-28 — on-chain/off-chain reframe (James clarification).** James clarified two framing errors carried since the PM brief: (1) the **on-chain SDK is a Solidity deliverable** — a *library* (+ inheritable base) that smart-contract devs use *from their own contracts*, not a TypeScript package; and (2) **"off-chain SDK" just means "the TypeScript SDK"** — it has nothing to do with The Graph / a packaged indexer. Changes folded in:
- **New "Two deliverables" framing** at the top of the Proposal, plus an **On-chain SDK (Solidity)** section specifying the library/base API (`pinFile`, `tag`, `setProperty`, `place`, `createList`/`addEntry`, O(1) reads, constants, escape hatch).
- **Why a library, not a deployed helper:** the same attester-fidelity rule from the Q5 review applies on-chain — a separately deployed helper would be `msg.sender` and capture every consumer's attestations. A library/base executes in the consuming contract's context, so the consuming contract stays the attester. James confirmed the library form.
- **No batching on-chain:** a library call runs inside one transaction already; the Q5 single-signature machinery is off-chain-only. Stated explicitly.
- **Package structure corrected:** one TS package (`@efs/sdk`) + one Solidity library — not two TS packages. Added on-chain (O1–O6) requirements.
- **Stripped the indexer framing:** the SDK does not bundle/build indexing. Reverse-lookup methods (`graph.timeline`, `versions.descendants`, `lenses.discover`) become `NotImplemented` shims (renamed from `OffchainIndexRequired`); removed the `examples/reference-index/` "EFS-in-Postgres" project; D1 reworded; Q3 reframed.
- **Q1 reopened:** the single-repo decision assumed both SDKs were TS. The Solidity library's home (`contracts/` vs `sdk/contracts/`) is now a live fork — PM rec `contracts/`.

This reopened one question (Q1) and did not change Q2–Q5. Doc held at `#status/review`.
