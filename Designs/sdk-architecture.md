# EFS SDK Architecture

**Status:** review
**Target repos:** sdk (new — both the TypeScript SDK and the Solidity library; Q1 RESOLVED 2026-06-10, ADR-0001), planning
**Depends on:** [[0001-design-system]], [[brainstorm-system]], ADR-0031 (lenses), ADR-0041 (PIN/TAG), ADR-0044 (Lists — pending merge)
**Supersedes:** —
**Reviewers:** expert subagent passes 2026-05-28 (SDK API/DX + contract-fidelity; wallet/EIP-5792 + attribution + security); awaiting James frame-review
**Last touched:** 2026-06-20 (reconciled to the built surface + manifest + review backlog — see Revision log)

#status/review #kind/design #repo/sdk #repo/planning

---

> **📍 Contracts-side coordination note — 2026-06-19 (from the schema-freeze / deploy agent)**
>
> **EFS is live on Sepolia** — deployed, all 9 schemas frozen + registered, all 10 contracts (7 impls + 3 views) verified on Etherscan. Canonical addresses + UIDs: `contracts/docs/CHAINS.md`.
>
> **Gap check of this design's on-chain (Solidity) library vs the deployed contracts → no frozen-contract change is needed.** The kernel already exposes the bounded read surface the library specs: `EFSIndexer.getChildrenCount`/`getChildAt` + lens-scoped (`getChildrenByAttesterAt`/`…Count`) + schema-scoped (`getChildBySchemaAt`/`getChildCountBySchema`) enumeration; `containsAttestations(target, attester)` (O(1)); `resolvePath`. Point reads: `EdgeResolver.getActivePin`/`getActivePinTarget`. Lists: `ListReader.entries`/`length`/`getMode`/`countOf`. Directory pages: `EFSFileView.getDirectoryPage*`. **No resolver gates the attester** (no EOA / `code.length` / `tx.origin` check), so a contract writes as its own lens — the library's core premise holds. `getAttestersAt` is absent, matching this doc's "needs external index, out of scope" call.
>
> **Open contracts-side leftovers (all non-blocking, no deadline):** the 3 ADR candidates the identity work surfaced — (1) attester = address's *current controller* + immutable system-lens trust roots, (2) ERC-1271 in delegated attestation **[already VERIFIED ✅]**, (3) provenance (timestamp/refUID/revocation) as a first-class read; the parity checklist belongs in the contracts/EFS spec; and confirm a lens-scoped `propertyValue` getter exists — if not it's a **view-layer add** (views are freely redeployable, NOT frozen).
>
> **No burn timeline.** James keeps the upgrade keys until EFS is audited and explicitly approved for immutability — no date. Disregard any "≥14-day soak / July 3" burn schedule (never approved; it was a *minimum precondition*, not a plan). The kernel stays upgradeable, so nothing here is deadline-gated. Flag any deployed-contract gap in the vault and the contracts side will handle it.

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
| Audience | Smart-contract developers whose own contracts read AND write EFS | App, backend, and tooling developers |
| Value-add | Collapses the multi-attestation dance into one Solidity call **while keeping the caller's contract as the EAS attester**; plus lens-scoped reads, bounded enumeration, and list reads | Collapses the same dance into one method, one wallet prompt, plus reads/queries/lenses |

**A smart contract is a first-class client.** It is not a write-only stub: a contract reads files (lens-scoped, so it resolves the *right* attestation), reads lists, reads the first N children of a folder, and creates files and folders — essentially the full client surface. **Lenses are load-bearing for on-chain reads, not just writes**: without the caller-supplied lens stack a contract would resolve the wrong content. The single difference from the TS client is gas: on-chain enumeration is a **bounded window** (`start`, `count` — "first 10") rather than an open `AsyncIterable`, and the caller owns the gas of the window. Forward enumeration reads through the core on-chain view contracts (`EFSIndexer`/`EFSFileView`); only reverse-lookups (cross-history references, timelines, lens *discovery*) need an external index and are out of scope for both SDKs in v1.

**Why the on-chain SDK must be a library, not a deployed helper (load-bearing).** EAS records `msg.sender` as the attester, and the attester address is the spine of the read model — lenses key on it (ADR-0031) and PROPERTY-value PINs are cardinality-1 *per attester* (ADR-0041). If a smart-contract dev called a *separately deployed* EFS helper contract, that helper would be `msg.sender` when it called EAS, so every consuming app's content would be attributed to the **helper**, not to the app — collapsing all of them into one identity and breaking lens resolution. (This is the exact defect the off-chain `EFSUploadGateway` analysis surfaced.) A Solidity **library** (`internal` functions inlined into the caller, or `using EFSLib for …`) and an **inheritable base contract** both execute in the *consuming contract's* context, so `msg.sender` stays the consuming contract — the correct attester. Decision (James, 2026-05-28): **the on-chain SDK is a Solidity library + inheritable base, never a deployed singleton.**

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
| M12 | Expose a clean raw-EAS surface (efs.eas — viem-native helpers + vendored ABIs, no eas-sdk/ethers dep per SDK ADR-0002) without requiring devs to know the internals | PM brief; dev-friction: drop-to-raw-EAS pattern |
| M13 | Expose the raw contract instances as an escape hatch (EFS.raw) | PM brief |
| M14 | Lens model: explicit, visible default; not silent | dev-friction: "SDK silently used the deployer lens" |
| M15 | Signer/wallet handling: constructor injection + `.connect()` for MetaMask late-bind | client: `EFS.connect(signer)` |
| M16 | Emit partial-failure receipts from multi-step operations | dev-friction: 8-tx partial abort |

#### NICE (support if cheap; design must not preclude)

| # | Requirement | Source |
|---|---|---|
| N1 | `readJson<T>()` and `readText()` helpers | dev-friction: sports stats, recipe |
| N2 | Gas/cost estimation before write | dev-friction: birding ($20k/day surprise) |
| N3 | `batch.estimate()` — attestation count + tx count | dev-friction: batch sizing opacity |
| N4 | Property helpers for well-known keys (`contentType`, `previousVersion`, `name`) | dev-friction: "where do PROPERTY keys come from?" |
| N5 | `graph.timeline(anchor)` — time-ordered everything on an anchor | dev-friction: museum provenance |
| N6 | `graph.versions(dataUID)` — `previousVersion` ancestor/descendant chain | dev-friction: recipe forker |
| N7 | `lenses.discover()` — lens discovery (reverse lookup; needs external indexing — `NotImplemented` shim in v1) | dev-friction: cookbook curator |
| N8 | `watch(path)` — change subscription (fall back to polling when subscribe denied) | dev-friction: sports stats live feed |
| N9 | Multi-chain config support | dev-friction: birding L2 wall |
| N10 | `snapshot.cite()` — permanent URL + the author's attested SHA-256 contentHash (trust-relative, ADR-0006) + block for citation | dev-friction: museum scholar paper |

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

The MUST/NICE/DEFERRED tables above are the **off-chain** (TypeScript) surface — the debug-client parity target. The on-chain library is a separate deliverable in a different language, but it is **not** a narrow write-only subset: a smart contract is a first-class EFS client. Its anchor requirement: **a smart-contract dev can perform any EFS read or write from inside their own contract in one call — lens-scoped reads, list reads, bounded folder enumeration, file/folder creation, pin/tag/set-property — with their contract recorded as the attester, without hand-assembling EAS payloads.** It differs from the TS SDK only in form (synchronous `view` calls; bounded enumeration windows the caller sizes; no async/iterator), never in *capability* — see the parity contract below.

| # | Requirement |
|---|---|
| O1 | `pinFile`/`tag`/`setProperty`/`place`/`createList`+`addEntry` as one Solidity call each, composing the correct EAS attestation sequence (ADR-0041/0044) |
| O2 | The consuming contract is always the EAS attester (library/base executes in caller context — no separately deployed helper in the write path) |
| O3 | Path-anchor resolution/creation (`anchorAt(path)`) usable on-chain |
| O4 | **A contract is a first-class reader, not write-only.** O(1) point reads (`propertyValue`, `activePin`, `read`) **plus bounded-window enumeration** — `read(path, lenses)`, `readList(...)`, `listChildren(path, start, count, lenses)` ("first 10 files of a folder"). Lenses are passed in by the contract exactly as a TS client passes them, because they decide *which* attestation is the right one. The only on-chain difference from the TS client is the gas boundary: enumeration is a caller-bounded window (`start`/`count`), not an open iterator |
| O4b | **Folder/file creation on-chain:** a contract can create anchors/folders (`mkdir(path)`) and place files, not just mutate existing ones — the full create surface, mirroring the TS `fs` namespace |
| O5 | Schema UIDs + core contract addresses exposed as Solidity constants/immutables (the on-chain analogue of M11) |
| O6 | Raw escape hatch: the EFS core contract interfaces + schema constants remain directly callable; the library is sugar, never a wall |

Note there is **no batching/single-signature concern on-chain**: the whole library call runs inside one transaction (the consuming contract's function call), so N attestations happen in that one tx with no per-attestation wallet prompt. Batching (Q5) is a purely off-chain problem.

---

### Inverted-Framing Pass

**Question per operation: what does our SDK add OVER raw EAS SDK + a direct contract call?**

This pass determines what to WRAP vs. what to EXPOSE-AS-IS.

| Operation | Raw EAS alone | EFS SDK adds | Verdict |
|---|---|---|---|
| Get one attestation by UID | `eas.getAttestation(uid)` ✅ trivial | Nothing | **Expose via efs.eas** |
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
    eas.ts           efs.eas — viem-native raw-EAS helpers + vendored ABIs (no eas-sdk/ethers; ADR-0002)
    raw.ts           efs.raw — contract escape hatches
    decode.ts        efs.decode — raw attestation → typed entry
    cache.ts         read-through content cache (IPFS/Arweave/HTTPS)
    constants.ts     schema UIDs, contract addresses, sort-func addresses (generated)
    index.ts         re-exports
  examples/
    node-server/     server-side hot-wallet write example
    browser-react/   MetaMask read/write example
```

**The Solidity on-chain SDK** — a library + inheritable base contract (`EFSLib.sol` library, `EFSWriter` base, `EFSConstants`/interfaces; package `@efs/solidity`, ADR-0003). Specified in the "On-chain SDK (Solidity)" section below.

> **Q1 — RESOLVED (James, 2026-06-10; ADR-0001): both SDKs live in the `sdk/` repo.** The 2026-05-28 reframe briefly reopened this (the Solidity SDK's coupling to the contracts made `contracts/` look like a natural home). It is now settled the other way: the Solidity SDK is a **compile-in library consumed via npm** (`@efs/solidity`), not a contract EFS deploys — so distribution, not deployment-coupling, decides, and it ships alongside the TypeScript SDK in the one `sdk/` repo. Version-lock to the frozen schema UIDs is handled by pinning, not co-location. See Open Questions Q1.

**Consumer install:**
```bash
npm install @efs/sdk                       # off-chain (TypeScript) — the normal install
npm i @efs/solidity                        # on-chain (Solidity) — for smart-contract devs (ADR-0003)
# then add a Foundry remapping so imports resolve, e.g.:
#   @efs/solidity/=node_modules/@efs/solidity/src/
```

---

### API Surface

> **Authoritative-detail pointers (this doc predates two refactors).** The read verbs
> below (`read`/`info`/`list`/`locate` + value-first DTOs, always-on provenance,
> `fields`/`expand`, fail-closed verify) are specified in detail in **[[sdk-read-surface]]** —
> treat it as canonical where it and this section differ. Instantiation + the signer/lens
> model are specified in **[[sdk-wallet-architecture]]**: the built client is
> `createEfsClient({ provider, chain, account? })` (an **EIP-1193 provider + EIP-155 chain**,
> not the `new EFSClient({ rpc, chainId, signer })` sketch shown below), with write capability
> **type-gated** (no `account`/`walletClient` ⇒ no `write`/`preview`/`batch`). The pseudo-code
> in this section keeps the original shape for reasoning continuity; the two linked docs are the
> current truth. See also the **Implemented vs Designed** manifest below for what actually runs today.

#### Implemented vs Designed (manifest — updated 2026-06-20 to the `chore/scaffold` built surface)

This doc is mostly **design**, but the **built** surface has grown well past the original single
vertical slice: as of branch `chore/scaffold` it covers reads, the Tier-1 write, edge/value/list
writes, REDIRECT, the escape hatches, and a Solidity compile-in lib. The table below grounds every
major surface against `packages/sdk/src/index.ts` + `packages/solidity/src/`, so a reader knows what
runs today vs. what is still a sketch. (Earlier manifest snapshot: 2026-06-19 comprehensive review.)
Legend: ✅ built · ◑ stubbed (present in the typed surface, throws `NotImplemented`) · **D** designed-only (no code yet).

| Surface | State | Notes |
|---|---|---|
| Read — `fs.read`/`readText`/`readBytes`/`readJson` (path → bytes, lens-scoped) | ✅ | The strong core. Value-first DTOs, always-on provenance, fail-closed verify (see [[sdk-read-surface]]). |
| Read — `fs.info`/`exists`/`locate` | ✅ | *Bug (P1-1): `info().verified` returns `matches-author` without hashing bytes — must be `unchecked`.* |
| Read — `fs.list` (directory pages) | ✅ | But `list({ excludes })` **throws `InvalidDirectoryQuery`** though typed + `SAFETY_EXCLUDES` exported (P1-6) — wire or hide. |
| Read — `fs.overview`/`setOverview` | ◑ | `NotImplemented` (tracking ADR-0011); read the `README.md` directly for now. |
| Write — `fs.write` (Tier-1, multi-signature; on-chain SSTORE2 store + `web3://` mirror) | ✅ | The one fully-built write flow. *Bug (P1-2): ancestor-walk visibility TAGs deferred, so the author's own write doesn't show in their own lens listing.* |
| Write — `createParents` default `true` | ✅ | Kept `true` by decision (object-storage mental model; review "Reconsider — RESOLVED"). |
| Write — `fs.preview` (cost estimate) | ◑ | `NotImplemented`; call `write()` directly for now. |
| AA-ready Submitter seam (`detect → select → submit`; `efs.account.capabilities()`) | ✅ | `Tier1Submitter` is the built path; the seam detects account capabilities + selects a submission strategy, so EIP-5792/4337 routing can drop in without reshaping the write surface. |
| `efs.batch()` — one-signature batching (EIP-5792 / 4337 / sequential) | ◑ → **D** | `batch()` throws `NotImplemented`. The headline one-signature UX is still **type-present, behavior-absent**; resume likewise. (The Submitter seam above is the groundwork.) |
| Edge/value writes — `graph.tags.{add,remove,active,list}`, `props.{set,get,list}`, `graph.pins.{place,unplace,active}` | ✅ | Built on the client (author as the connected wallet). *Correctness fix this round: PROPERTY key-anchors now use `PROPERTY_SCHEMA_UID` as `forSchema` (was generic `0`) — see note below.* |
| Lists — read `lists.{get,entries,length,has}` + write `lists.{create,add,remove}` | ✅ | LIST/LIST_ENTRY frozen + wrapped both directions. |
| Sorts — `sorts.*` | ◑ (`@experimental`) | Stubbed `@experimental`; **SORT_INFO is deferred from the frozen 9** (unfrozen field string), so the surface stays designed-only until the schema ships. |
| Mirrors — `fs.mirrors.list/add/remove` | **D** | Read backed by `getDataMirrors` (lens-scoped) when built. |
| Escape hatches — `efs.eas.*` | ✅ | Built: `encoder`/`computeUID`/`verifyUID`/`abi`/`attestationsFor` **plus** `attest`/`multiAttest`/`revoke`/`getAttestation`. |
| Escape hatches — `efs.raw.*` | ✅ | Built: `deployment()`/`verifyDeployment()` (schema-UID integrity gate, see Constants) **plus** pre-wired `indexer`/`router`/`fileView` contract handles. |
| `efs.decode` (raw attestation → typed entry) | ✅ | The "bridge back up": raw `Attestation` (or a UID, via `getAttestation`) → typed entry. |
| Lens model — default-to-connected-wallet; `SYSTEM_LENS` | ✅ (partial) | `SYSTEM_LENS` exported; *no-wallet/no-lens read still throws `LensRequired` instead of falling back (P1-5).* |
| Constants — schemas/contracts/transports (the **frozen 9**) | ✅ | `deployments.ts` carries the frozen-9 `EfsSchemaUIDs`. *Trust gate (P1-9) NOW BUILT: `efs.raw.verifyDeployment()` checks schema-UID match, not just bytecode presence.* |
| Solidity SDK — `@efs/solidity` compile-in lib | ✅ | `EFSReader` (`resolveAnchor`/`resolvePath`/`activePin`/`propertyValue`/`listChildren`/`listEntries` + `redirectTarget`/`resolveWithRedirects`) + `EFSLib`/`EFSWriter` write wrappers (`writeFile`/`anchorAt`/`tag`/`setProperty`/`place`/`createList`/`addEntry`/`addAddressEntry`/`setRedirect`). A first-class on-chain client now, not write-only parity stubs. *Deferred: path-level symlink following (matches the TS opt-out default).* |
| REDIRECT (ADR-0050) — write `redirects.{set,get,remove}` + read-time following | ✅ | Following is opt-out by default via `{ followRedirects }` on `locate`/`read`/`info`; cycle-detected, bounded hops, `result.via` provenance. *Resolution spec is unpinned — see note: the SDK fail-closes on a cycle vs the ADR's lowest-UID-in-SCC; path-level symlink following deferred.* |
| Reverse-lookups — `graph.timeline`, `versions.descendants`, `lenses.discover` | ◑ (by design) | `NotImplemented` shims; need the external index (D1), deferred on both SDKs. |
| WHITEOUT (ADR-0055), multi-chunk on-chain | **D** | Deferred-OK; schemas frozen / designed, SDK support unbuilt. |

**Bottom line:** the gap to "a dev can do *everything* easily" has closed substantially. Reads, the
Tier-1 write, the full edge/value surface (tag/property/pin), lists (read + write), REDIRECT (write +
read-time following), the escape hatches (`raw`/`eas`/`decode`), and a Solidity compile-in lib all run
today. Still designed-only: **sorts** (gated on SORT_INFO leaving the deferred set), **mirrors** writes,
WHITEOUT, multi-chunk on-chain, and the headline **one-signature batch UX** (`batch()`/resume are
type-present, behavior-absent — though the AA-ready Submitter seam is the groundwork). The design is
additive, so these land as new namespaces without reshaping the surface.

**Two items worth flagging from this round (both load-bearing for trust/correctness):**

- **PROPERTY `forSchema` correctness fix.** The Solidity lib was anchoring PROPERTY key-anchors with a
  generic `forSchema = 0` instead of `PROPERTY_SCHEMA_UID`. The effect: property values were **invisible
  to spec-conformant readers** (they looked under the typed bucket, found nothing). Two independent expert
  investigations surfaced it; the SDK now uses `PROPERTY_SCHEMA_UID` as the `forSchema` bucket. This is a
  silent-data-loss-class bug, not cosmetic — worth a contracts-side glance to confirm no on-chain lib
  shares the same defect.
- **ADR-0050 redirect resolution spec is unpinned.** Read-time following is built and bounded, but the
  resolver-spec for resolving a cycle isn't frozen: the SDK **fail-closes on a detected cycle**, whereas
  the ADR gestures at *lowest-UID-in-SCC* as the canonical resolution. These diverge; the SDK chose the
  conservative behavior so it's safe today, but the ADR needs pinning before the two can be guaranteed to
  agree. **Path-level symlink following is deferred** on both SDKs (opt-out by default). Surfaced upstream
  to contracts/ADR, not an SDK-only call.

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

1. The per-call `opts.lens` override, if given (a single `Lens` encodes the ordered first-wins stack).
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
// The option is SINGULAR `lens`: a single `Lens` value already encodes the ordered,
// first-wins stack (built via lens([...])), so one field carries the whole precedence
// chain — there is no `lenses` array on the per-call option (matches types.ts ReadOptions).
type ReadOpts = { lens?: Lens | Address }
type ListOpts = ReadOpts & {
  limit?: number; cursor?: Hex; sort?: Hex | string; schema?: Hex
  // On-chain directory filtering (ADR-0011). `excludes` is a set of folder-visibility
  // TAG concepts (def-UIDs, or human labels resolved to /tags/<name>); a sibling is
  // hidden if it carries any of them at >= the paired `minWeights` threshold. A
  // non-empty `excludes` routes the listing to EFSFileView.getDirectoryPageFiltered;
  // an empty/absent one keeps the unfiltered sibling. Cursors stay opaque + method-bound.
  excludes?: readonly (Hex | string)[]
  minWeights?: readonly bigint[]   // 1:1 with `excludes`; omitted ⇒ all-zero (any weight)
}

// Read — [[sdk-read-surface]] is the AUTHORITATIVE detail (value-first plain DTOs,
// always-on provenance, fields/expand knobs, fail-closed verify, batching). Summary:
efs.fs.read(pathOrRef: string | DataRef, opts?: ReadOpts): Promise<EfsFile>  // bytes + pure .text()/.json() + verification
efs.fs.readText(path: string, opts?: ReadOpts): Promise<string>              // sugar; throws ContentHashMismatch on mismatch ({verify:false} to opt out)
efs.fs.readBytes(path: string, opts?: ReadOpts): Promise<Uint8Array>
efs.fs.readJson<T>(path: string, opts?: ReadOpts & { schema?: ZodSchema<T> }): Promise<T>

// List directory — async-iterable (yields items) + .byPage()/.toArray({limit}).
// `sort` accepts a SORT_INFO UID or a sort name (resolved via efs.sorts discovery);
// omitting it returns kernel insertion order. See efs.sorts for sorted reads + maintenance.
efs.fs.list(path: string, opts?: ListOpts): EfsList<DirEntry>

// Info (metadata without reading the payload) — renamed from `stat`; accepts fields/expand.
efs.fs.info(path: string, opts?: ReadOpts): Promise<FileInfo>
// FileInfo: { exists, contentType, size, name, ref, resolvedBy, verified, sourceUIDs, properties?, attestations? }
efs.fs.exists(path: string, opts?: ReadOpts): Promise<boolean>

// Locate path → the winning pointer (DATA/version + attester, no bytes). Renamed from
// `resolve` (collided with Promise.resolve + the low-level resolvePath). For the raw UID, use resolvePath.
efs.fs.locate(path: string, opts?: ReadOpts): Promise<ReadResult | null>

// Mirrors — retrieval URIs for a DATA. Multiple transports per DATA (ADR-0011/0012);
// reads are lens-scoped (ADR-0013). First-class because adding redundancy mirrors
// (ipfs/arweave) to existing content is a core archival operation, not just a write-time concern.
efs.fs.mirrors.list(dataUID: Hex, opts?: ReadOpts): Promise<MirrorEntry[]>
// Backed by EFSFileView.getDataMirrors(dataUID, attester, start, length) — LENS-SCOPED
// (the winning lens' active mirrors). Cross-attester discovery is the separate
// getDataMirrorsAllAttesters; there is no `getDataMirrorsByAttester`.
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
// WriteReceipt (field names match types.ts) — a durable, resumable write session: {
//   contentHash: ContentHash,      // branded SHA-256 of the written bytes (ADR-0006)
//   data?: DataRef,                // the resolved DATA ref once minted
//   steps: { id, uid?, done }[],   // idempotent per id; a resume skips only mined work
//   signatureCount,
//   mechanism: WriteMechanism,     // 'sequential'|'eip5792'|'erc4337'|'gateway'
//   status?: CallStatus,           // 'partial'/'reverted' flag a half-written file
// }
// Cost shape (the attestations-vs-chunk-deploys split) is reported by efs.batch().estimate()
// (WriteEstimate.attestations / chunkDeploys): on-chain storage is two cost classes — EAS attestations
// AND SSTORE2 ~24KB chunk-contract deploys for web3:// content. They're separated because a 2MB file is
// ~10 attestations but ~80 chunk deploys — the gas lives in the chunks (NOT attestations).

// Folder Overview — a folder's README.md, read by EXACT path (never a directory scan).
// `none` if absent; `binary`/`too-large` guard the markdown-only display contract.
efs.fs.overview(path: string, opts?: ReadOpts): Promise<OverviewResult>
// OverviewResult (discriminated): { kind: 'none' }
//   | { kind: 'markdown'; text: string; anchorUID: Hex; attester: Address }
//   | { kind: 'binary'; contentType?: string; dataUID: Hex }
//   | { kind: 'too-large'; size: number }

// Set a folder's Overview: uploads `markdown` via the normal write pipeline, applies the
// `system` TAG BEFORE placement (so it never flashes as a visible untagged sibling), then
// places it at [...container, 'README.md']. Folder-scoped; authored on the top lens.
efs.fs.setOverview(container: string, markdown: string, opts?: { onProgress?(phase: WritePhase): void }): Promise<WriteReceipt>
```

**Design note on `fs.list` vs array:** The brainstorm found a sports-stats dev tried `list("/mlb/2025", { recursive: true })` and got a 60-second stall or a `QueryTooLargeError`. `list` is always `AsyncIterable` with explicit pagination; consuming all results requires `collect(efs.fs.list(path))`. A `collect()` helper is exported for small folders.

**Design note on resumable pagination (cursors):** `for await` auto-paginates, but a server rendering page 2 of a feed needs to *resume* from where page 1 stopped — across requests, with no live iterator in memory. So every iterable-returning read is an `EfsList<T>` with a `.byPage()` companion that surfaces the cursor, plus a bounded `.toArray({ limit })` collect-all (the mandatory cap guards against unbounded on-chain enumeration). See [[sdk-read-surface]]:

```ts
type Page<T> = { items: T[]; nextCursor: Hex | null }   // nextCursor === null ⇒ exhausted

const p1 = await efs.fs.list("/feed").byPage({ limit: 50 })
// ...later request, different process:
const p2 = await efs.fs.list("/feed").byPage({ limit: 50, cursor: p1.nextCursor })
```

The bare iterable threads the cursor internally; `.byPage()` exposes it. This is the Stripe/Prisma pattern (`page.nextCursor`) and is what keeps devs from dropping to raw EAS for "give me the next 50." The cursor is opaque (an encoded kernel index + filter state), stable across redeploys of stateless contracts, and validated on use — a stale cursor throws `CursorInvalid` rather than silently skipping items.

**Design note on on-chain directory filtering (`excludes`, ADR-0011):** `fs.list` exposes the contracts' view-layer filter (`EFSFileView.getDirectoryPageFiltered`) through `ListOpts` rather than a new verb. `excludes` names folder-visibility TAG concepts (the same TAGs that already gate sibling visibility) and `minWeights` pairs a threshold to each; the contract evaluates the exclusion as a **union over the viewed lenses and over the exclude pairs** (a sibling is hidden if any viewed lens tagged it with any excluded concept at or above its weight). A non-empty `excludes` routes the listing to the filtered call; an empty or absent one keeps the unfiltered sibling — so filtering is fully opt-in and there is **no default hiding**. The cursors the filtered call returns are opaque and method-bound (they encode filter state), so a cursor from a filtered list is only valid back into the same filtered call. Callers wanting the common "hide system/nsfw" policy can pass the exported `SAFETY_EXCLUDES = ['system', 'nsfw']` — itself opt-in, never applied automatically.

**Design note on folder Overviews (ADR-0011):** a folder Overview is a `README.md` anchor placed in the folder (or an address-container root) and tagged `system`. There is **no new schema, contract, or reserved key** — `README.md` as the well-known name plus the existing `/tags/system` folder-visibility TAG are the *entire* convention, so an Overview is just an ordinary file that tooling agrees to treat specially. `fs.overview(path)` resolves it by **exact path** (`[...container, 'README.md']`), never a directory scan, and returns a discriminated result — `none` when absent (the common case, carried cleanly by a dedicated verb), `markdown` for the displayable case, and `binary`/`too-large` to keep the markdown-only display contract honest. `fs.setOverview(container, markdown)` composes the normal upload pipeline and applies the `system` TAG **before** placement, so the README never briefly appears as a visible untagged sibling; it is folder-scoped and authored on the top lens. File-anchor Overviews were considered and dropped — Overviews are folder-scoped only. (The `system` TAG is one of the `SAFETY_EXCLUDES` above, so a list filtered with that policy already hides the Overview from its own folder listing.)

---

#### `efs.graph` — Graph traversal (Tags, Pins, Anchors)

```ts
// Anchor tree navigation
efs.graph.children(anchor: Hex, opts?: PaginateOpts): AsyncIterable<AnchorEntry>
efs.graph.path(anchor: Hex): Promise<string>       // UID → "/foo/bar/baz"
efs.graph.subtree(anchor: Hex, opts?: { depth?: number }): AsyncIterable<AnchorEntry>

// Attestations that reference a given UID, optionally filtered by schema. First-class wrapper
// over EFSIndexer.getReferencingAttestationUIDs (debug-client parity, M-level). Yields decoded
// edges; pass `raw: true` to get bare UIDs for hand-off to efs.eas. Reverse of `pins`/`tags`.
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

**Design note on lens scoping in `efs.graph`:** `efs.fs` is the lens-*resolving* path — `fs.read`/`fs.info` apply the first-attester-wins fallback across the lens stack (ADR-0031/0041) to pick the winning content. `efs.graph` is deliberately lower-level: `pins.get(definition, { attester })` reads exactly one attester's PIN in O(1) (no fallback), and `tags.list(target, { allAttesters })` enumerates raw edges. This is intentional — graph methods expose the unresolved edge data; if you want lens-resolved placement, use `fs`. A dev calling `graph.pins.get` without specifying `attester` gets the client's primary (first) lens, not a fallback walk. Documented so nobody assumes `graph` silently applies lens precedence.

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
PROP_KEYS.CONTENT_HASH        // "contentHash" — bare SHA-256 (lowercase hex; SDK ADR-0006). Reserved key.
PROP_KEYS.SIZE                // "size"        — byte length of the content. Reserved key.
PROP_KEYS.CONTENT_TYPE        // "contentType"
PROP_KEYS.NAME                // "name"
PROP_KEYS.DESCRIPTION         // "description"
PROP_KEYS.PREVIOUS_VERSION    // "previousVersion"
// ... extensible; community-contributed keys can be added via SDK version bumps
```

`contentHash`, `size`, and `contentType` are **reserved-key PROPERTYs bound to the DATA UID** — they are *not* fields inside the DATA attestation. Per ADR-0049 the **DATA schema's field string is empty** (DATA carries no inline metadata); all of a file's metadata is attested as separate, lens-scoped PROPERTYs on the DATA UID. See the content-hashing design note in the batch section for the verification semantics.

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
// WriteEstimate (field names match types.ts): {
//   attestations, transactions, signatureCount, chunkDeploys, gas: bigint,
//   usd?: { min; max; priceSource?; asOf? },   // range, not a bare scalar (A4 / future-proofing.md §5)
//   warnings: string[]
// }
// mechanism (WriteMechanism literal): 'sequential' | 'eip5792' | 'erc4337' | 'gateway' — see Q5 note below.
// signatureCount reflects the chosen mechanism: 1 for eip5792/erc4337, N for sequential, N for gateway-by-delegation.

// BatchReceipt (field names match types.ts)
type BatchReceipt = {
  results: OperationResult[]    // one per op
  signatureCount: number
  mechanism: WriteMechanism
  status?: CallStatus           // 'partial' when some ops landed and some did not
  partialFailure?: boolean      // true only for the non-atomic 'sequential' mechanism, where the user
                                // can abandon midway; eip5792/erc4337 are atomic so it stays false/undefined
  txHashes?: Hex[]              // the tx hashes produced, in delivery order
}

// Each queued op carries a STABLE id so partial-failure results correlate back to the op that
// produced them — order-based indexing breaks when the SDK reorders/dedups/chunks ops internally.
// The id is auto-assigned (op0, op1, …) or caller-supplied via .as("uploadRobin1"); every builder
// method returns the builder for chaining and records the id.
type OperationResult = {
  id: string                  // matches the queued op
  kind: OperationKind         // 'write'|'pin'|'tag'|'property'|'list'|'mirror'|'sort'
  ok: boolean
  uid?: Hex                   // the produced attestation UID, when ok
  txHash?: Hex
  error?: EfsError            // a typed EFS error (carries .code), not a bare Error — when !ok
}
```

**Design note on the two forms:** the callback form (`efs.batch(b => {...})`) auto-executes and is the **recommended** default — there's nothing to forget. The fluent form (`efs.batch().…`) is lazy and only fires on `.execute()`/`.estimate()`; the builder is typed so a batch that's constructed but never executed is a `#[must_use]`-style dangling value (lint + a dev-mode runtime warning on GC of an unexecuted builder), closing the "silently did nothing" footgun the review flagged.

**Design note on content hashing (decided 2026-06-10 — SDK ADR-0006):** a file's `contentHash` is a **bare SHA-256** digest (lowercase hex, matches `sha256sum`) recorded as a reserved-key PROPERTY (`contentHash`); `size` and `contentType` are sibling PROPERTYs. The PROPERTY *key* is the algorithm tag — no multihash/CID/keccak in the value. Two expert passes rejected multihash (its future-proofing is illusory; the IPFS-CID rationale is false). Because `contentHash` is a *lens-scoped* PROPERTY anyone can attest, **verification is trust-relative, not absolute**: the SDK checks fetched bytes against the hash attested by the lens that won placement (`resolvedBy`) and reports `matches-author` / `mismatch` / `no-claim` — never a bare "verified." Full spec: the SDK repo's `docs/specs/content-hash.md`. (Surfaced upstream as an ADR-0049 follow-up.)

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

#### `efs.eas` — EAS SDK exposure

```ts
// Direct access to EFS's viem-native EAS helpers (no eas-sdk/ethers dependency — SDK ADR-0002).
// efs.eas is a thin helper namespace over viem + vendored EAS ABIs, connected to efs's signer.
efs.eas

// Same verbs as raw EAS attestation, but viem-native (encoding via the vendored EAS ABIs)
efs.eas.attest({ schema, data: { ... } })
efs.eas.multiAttest([...])
efs.eas.getAttestation(uid)
efs.eas.revoke({ schema, data: { uid } })
// ... the full EAS attestation surface, expressed in viem
```

**Design rationale:** Every non-trivial dev drops to raw EAS queries within day one (the museum researcher, the sports-stats dev, the recipe forker). Instead of fighting this, we make it first-class. `efs.eas` is *not* buried in `.raw` — it's a top-level, visible surface. Per SDK ADR-0002 the SDK does **not** depend on `@ethereum-attestation-service/eas-sdk` or ethers; `efs.eas` is **viem-native helpers over vendored EAS ABIs**, so the promise — "you can always speak EAS fluently" — is kept without pulling in the eas-sdk/ethers stack. Our wrappers are conveniences, not a walled garden.

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

`efs.eas` and `efs.raw` are downward escape hatches, but the review found the cliff is *one-directional*: a dev who drops to `efs.eas.getAttestation(uid)` to run one query gets a raw EAS attestation and then has to hand-decode it back into the SDK's typed world. `efs.decode` is the return path — it turns a raw attestation (or UID) into the same typed `*Entry` objects the high-level reads return, so dropping down for one call doesn't strand you in raw-land.

```ts
// Decode a raw EAS attestation (from efs.eas / efs.raw) into a typed SDK entry.
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

**Design note on the round-trip:** this closes the "conveniences, not a walled garden" promise in both directions — `efs.eas`/`efs.raw` let you step *out* of the typed surface; `efs.decode` lets you step back *in*. The `raw: true` flag on reads like `efs.graph.referencing` and the decoders share the same `*Entry` types, so a dev can mix levels in one flow (raw query for reach, decode for ergonomics) without a type impedance mismatch.

---

#### Typed constants

```ts
import { SCHEMAS, CONTRACTS, PROP_KEYS, TRANSPORT } from '@efs/sdk/constants'

// The schema UIDs the SDK keys against (typed, version-checked against the chainId).
// FROZEN SET = the canonical **9** (Sepolia freeze, contracts `docs/SEPOLIA_FREEZE_TABLE.md`,
// mirrored in the SDK's `chain/deployments.ts` `EfsSchemaUIDs`). REDIRECT is a frozen
// first-class schema (ADR-0050, resolver = AliasResolver, self-derives its UID via
// `redirectSchemaUID()`); resolution is NOT in EFSRouter. BLOB and NAMING were dropped in
// the freeze reconciliation (ADR-0012). SORT_INFO is DEFERRED — addable later without
// orphaning, so it is NOT in the frozen 9 (the `efs.sorts` surface above is designed-only
// until SORT_INFO ships). See [[sdk-read-surface]] for the authoritative read detail.
SCHEMAS.ANCHOR         // `0x...` as const
SCHEMAS.DATA           // field string is EMPTY (ADR-0049) — metadata lives in PROPERTYs on the DATA UID
SCHEMAS.PROPERTY
SCHEMAS.PIN
SCHEMAS.TAG
SCHEMAS.MIRROR
SCHEMAS.LIST           // post-ADR-0044
SCHEMAS.LIST_ENTRY     // post-ADR-0044
SCHEMAS.REDIRECT       // frozen first-class schema (ADR-0050; resolver = AliasResolver)
// (9 total. SORT_INFO is deferred — not registered in the freeze; BLOB/NAMING were dropped.)

// Contract addresses
CONTRACTS.INDEXER
CONTRACTS.ROUTER
CONTRACTS.FILE_VIEW
CONTRACTS.SORT_OVERLAY

// Well-known property keys (reserved keys are PROPERTYs bound to a DATA UID, not DATA fields)
PROP_KEYS.CONTENT_HASH         // bare SHA-256, lowercase hex (SDK ADR-0006) — reserved key on DATA
PROP_KEYS.SIZE                 // content byte length — reserved key on DATA
PROP_KEYS.CONTENT_TYPE         // reserved key on DATA
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
  CursorInvalid,           // a .byPage() cursor is stale/unparseable; caller should restart pagination
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
  AnchorEntry, DataEntry, DirEntry, FileInfo,
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
export { AnchorEntrySchema, FileInfoSchema, ... } from '@efs/sdk/schemas'
```

**Inspiration citations:**
- **viem** — type-safety for contract interactions; we adopt their `Hex` / `Address` branded types
- **Prisma** — fluent typed reads with optional includes; the `efs.fs.readJson<T>()` pattern
- **Stripe** — resource-namespaced API (`stripe.customers`, `stripe.charges`) → our `efs.fs`, `efs.graph`, `efs.lists`, `efs.sorts`
- **EAS** — the `efs.eas` helper namespace mirrors EAS's attestation verbs, but is implemented **viem-native over vendored EAS ABIs** (no `@ethereum-attestation-service/eas-sdk` / ethers dependency, per SDK ADR-0002)

**What we don't borrow:**
- **wagmi** (React hooks) — too framework-coupled for a framework-agnostic SDK. React bindings belong in a separate `@efs/react` package, post-v1.
- **ethers.js** v5 provider coupling — we accept both ethers v6 and viem to avoid forcing a choice.

---

### SDK Coverage of the Debug Client

The debug client's capabilities mapped to SDK calls:

| Debug client | SDK equivalent |
|---|---|
| `TopicStore.createTopic(name, parentUid)` | `efs.batch().fs.mkdir(parent, name).execute()` |
| `TopicStore.getById(uid)` | `efs.fs.info(path)` or `efs.raw.indexer.read...` |
| `TopicStore.getChildren(topic)` | `efs.graph.children(anchor)` |
| `TopicStore.getPath(topic)` | `efs.graph.path(anchor)` |
| `EASx.getAttestation(uid)` | `efs.eas.getAttestation(uid)` |
| `EASx.getReferencingAttestationUIDs(uid, schema, ...)` | `efs.graph.referencing(uid, { schema })` (first-class wrapper) |
| `EASx.indexAttestation(uid)` | `efs.raw.indexer.write.indexAttestation([uid])` |
| `EFS.connect(signer)` | `await efs.connect(signer)` |
| Hardcoded `contractConstants.ts` | `import { SCHEMAS, CONTRACTS } from '@efs/sdk/constants'` |

All debug-client capabilities are directly covered; the few that touch raw attestations have a first-class wrapper (`efs.graph.referencing`) and a decode path (`efs.decode`) so parity never requires hand-rolling against `efs.eas` / `efs.raw`.

---

## On-chain SDK (Solidity)

Everything above is the TypeScript SDK. This section specifies the **separate Solidity deliverable** for smart-contract developers whose own contracts write to EFS (e.g. a DAO archiving proposals, an NFT contract pinning metadata, a registry recording provenance).

### Form: inheritable base (primary) + library (escape hatch); never a deployed singleton

Two ways to consume it, both executing in the **caller's** context so the caller's contract is the EAS attester (the load-bearing constraint from "Two deliverables" above). **The documented happy path is the inheritable `EFSWriter` base** — a contract author is already writing a new contract and usually inheriting (`ERC721`, `Governor`, `Ownable`), so a base that takes `IEAS` once in the constructor removes the boilerplate of threading `eas` through every call (this is the OpenZeppelin mental model — you inherit `ERC20`, you don't `using` it). The **`using EFSLib for IEAS` library form is the escape hatch** for contracts that can't add a base (proxy/diamond patterns, inheritance conflicts) or want to pass a per-call EAS instance (multi-instance/testing).

```solidity
// (1) Inheritable base — holds the EAS address + schema constants, exposes _efs* helpers.
import {EFSWriter} from "@efs/solidity/EFSWriter.sol";

contract MyDAO is EFSWriter {
    constructor(IEAS eas) EFSWriter(eas) {}

    function archiveProposal(uint256 id, bytes calldata doc) external {
        // one call composes DATA + MIRROR + contentType-PROPERTY triple + placement PIN
        // + folder-visibility TAGs; MyDAO is msg.sender → MyDAO is the attester.
        _efsPinFile(string.concat("/dao/proposals/", _toString(id)), doc, "application/pdf");
    }
}

// (2) Library with `using` — for contracts that can't or don't want to inherit.
import {EFSLib} from "@efs/solidity/EFSLib.sol";

contract MyApp {
    using EFSLib for IEAS;
    IEAS constant eas = IEAS(0x4200...);   // canonical EAS

    function save(bytes calldata content) external {
        eas.pinFile("/app/blobs/latest", content, "application/octet-stream");
    }
}
```

**Why this preserves the attester (the precise condition).** A Solidity `library` with `internal` functions is **inlined** into the consuming contract's bytecode; the inheritable base compiles in the same way. The EAS calls therefore originate from the consuming contract, so `msg.sender == address(consumingContract)` at EAS. The one pattern that breaks this is a **separately deployed helper invoked via a normal `CALL`** — then the helper is `msg.sender`/attester (the off-chain gateway defect, on-chain). Note that even a *deployed* library reached via `DELEGATECALL` (what the compiler emits if any library function is `public`/`external`) would still preserve `msg.sender`, since delegatecall runs in the caller's context — so the rule is "no plain `CALL` to a separate contract in the write path," not "no delegatecall." We keep all write helpers `internal` regardless, so they inline and need no linking/deployment.

### Write surface (the value-add: one call ⟶ the correct attestation sequence)

```solidity
library EFSLib {
    // Compose a file write: DATA (+ MIRROR for the content), contentType PROPERTY triple,
    // placement PIN at the path's file-anchor, and folder-visibility TAGs for new ancestors.
    // Returns the DATA UID and the placement PIN UID.
    function pinFile(IEAS eas, string memory path, bytes memory content, string memory contentType)
        internal returns (bytes32 dataUID, bytes32 pinUID);

    // Batch convenience: pin many files in one tx (e.g. an NFT contract minting a metadata set).
    // Still one transaction; loops internally. Lengths must match.
    function pinFiles(IEAS eas, string[] memory paths, bytes[] memory contents, string memory contentType)
        internal returns (bytes32[] memory dataUIDs, bytes32[] memory pinUIDs);

    // Lower-level placement: PIN(refUID = dataUID, definition = fileAnchor). Singleton; supersedes.
    function place(IEAS eas, bytes32 fileAnchor, bytes32 dataUID) internal returns (bytes32 pinUID);
    // Clear a placement (revoke the active PIN at a file-anchor). Mirrors TS efs.graph.unplace.
    function unplace(IEAS eas, bytes32 fileAnchor) internal;

    // Cardinality-N labelled/weighted edge (ADR-0041). weight is signed int256 (negatives valid).
    function tag(IEAS eas, bytes32 target, bytes32 definition, int256 weight) internal returns (bytes32 tagUID);

    // PROPERTY value as the 3-attestation singleton rebind (key ANCHOR if new + PROPERTY + binding PIN).
    function setProperty(IEAS eas, bytes32 keyAnchor, bytes memory value)
        internal returns (bytes32 propUID, bytes32 bindingPinUID);

    // Resolve (creating if absent) the anchor chain for a path; returns the leaf anchor UID.
    function anchorAt(IEAS eas, string memory path) internal returns (bytes32 anchorUID);
    // Folder creation, mirroring TS efs.fs.mkdir: create the ancestor anchor chain + folder-visibility
    // TAGs for a directory path. Sugar over anchorAt for the "create a folder" intent. Idempotent.
    function mkdir(IEAS eas, string memory path) internal returns (bytes32 folderAnchor);

    // Lists (ADR-0044): create a LIST, then append entries.
    function createList(IEAS eas, ListConfig memory cfg) internal returns (bytes32 listUID);
    function addEntry(IEAS eas, bytes32 listUID, bytes32 target, int256 weight) internal returns (bytes32 entryUID);
}

// LIST configuration (ADR-0044). Mirrors the TS ListSpec; the resolver rejects invalid combos
// (e.g. appendOnly && allowsDuplicates && maxEntries == 0) — see the TS lists section.
struct ListConfig {
    bool appendOnly;
    bool allowsDuplicates;
    uint256 maxEntries;     // 0 = unbounded
    uint8 targetMode;       // UID | ADDR (ADDR encodes the target into EAS recipient)
}
```

**Intra-transaction ordering (an implementer must honor this).** EAS validates that a referenced UID already exists when an attestation is created, so the composition functions must emit attestations in **dependency order within the one tx**: DATA before the placement PIN that sets `refUID = dataUID`; the key ANCHOR before the PROPERTY before the binding PIN; ancestor ANCHORs before the leaf. `pinFile`/`setProperty` encode this ordering internally — it is not the caller's concern, but it is a correctness constraint on the library, not a free choice.

**Gas boundary on large writes (SSTORE2 + EIP-7825).** For on-chain (`web3://`) content the DATA bytes are stored as SSTORE2 chunk-contracts (~24KB each, the code-size cap), and the whole library call runs inside the consuming contract's single transaction — which is itself capped at **~16.7M gas per tx (EIP-7825, live since Fusaka)**. Chunking content under that per-tx cap is a **protocol-contracts invariant the library inherits**, not a knob it sets: the lib emits the chunk deploys + DATA/MIRROR attestations the contracts define, and a write whose chunk set would exceed the cap must be split across transactions at the contracts layer. The lib does not paper over the cap.

**Payable resolvers (EAS `value` is forwarded).** EAS attestations can carry a `value` to fund a payable schema resolver; the composition functions **forward that value through to `eas.attest`/`eas.multiAttest`** rather than swallowing it (the planned `buildMultiAttest` payload builder threads it through), so a schema with a payable resolver works from the library write path unchanged. *(Write surface currently ships as `NotImplemented` parity stubs, B3 — this is the contract those bodies must honor.)*

### Read surface — a contract is a first-class reader

A smart contract is a client, not a write-only stub. It reads files, lists, and folder children — and it does so **through lenses**, because lenses decide *which* attestation is the canonical one for a given viewer (ADR-0031). The contract passes a `lenses` array exactly as a TS client would; reads resolve through that precedence stack rather than naming a bare `attester`. The single on-chain-specific constraint is gas: traversal is a **bounded window** the caller sizes (`start`/`count`), not an open iterator — the caller owns the gas of the window it asks for.

```solidity
    // A lens stack is just an ordered list of attester addresses (first-attester-wins, ADR-0031),
    // capped at MAX_LENSES (ADR-0026). Passing a single-element array == "read this one attester".
    //   address[] memory lenses;

    // --- Ergonomic read verbs (the 80% case; see "On-chain identity & the default lens" below) ---

    // read(path) with NO lens defaults to the consuming contract's own data — lens = [address(this)].
    // Safe, predictable, AA-proof: "read my own files." Never silently reads someone else.
    // Returns `exists` so a MISSING file (your namespace is usually empty) is distinguishable
    // from a present one — a bare read returning nothing is a footgun otherwise.
    function read(IEAS eas, string memory path) internal view returns (bool exists, bytes32 dataUID);

    // readAs(path, who): read a SPECIFIC author's view. `who` is any address you name explicitly —
    // msg.sender (your direct caller), a DAO/registry address, or a user you have AUTHENTICATED
    // yourself (Aave-style onBehalfOf / a verified EIP-712 signature). Never tx.origin.
    function readAs(IEAS eas, string memory path, address who) internal view returns (bool exists, bytes32 dataUID);

    // --- O(1) point reads (raw lens-stack form — the power escape hatch) ---

    // The active PROPERTY value for a key, resolved through the lens stack. O(1) per lens via getActivePin.
    function propertyValue(IEAS eas, bytes32 keyAnchor, address[] memory lenses) internal view returns (bytes memory);

    // The active PIN for a definition, resolved through the lens stack. O(lenses).
    function activePin(IEAS eas, bytes32 definition, address[] memory lenses) internal view returns (bytes32);

    // Resolve a path to the DATA UID that wins under these lenses. The on-chain analogue of efs.fs.read.
    function read(IEAS eas, string memory path, address[] memory lenses) internal view returns (bytes32 dataUID);

    // --- Bounded enumeration (the caller owns the gas of the window) ---

    // "The first `count` children of a folder, starting at `start`, as resolved under these lenses."
    // Reads through the core on-chain view contracts (EFSIndexer/EFSFileView) for forward enumeration.
    function listChildren(IEAS eas, string memory path, uint256 start, uint256 count, address[] memory lenses)
        internal view returns (bytes32[] memory childAnchors);

    // A windowed read of a LIST's entries under these lenses (ADR-0044). Same bounded-window contract.
    function readList(IEAS eas, bytes32 listAnchor, uint256 start, uint256 count, address[] memory lenses)
        internal view returns (bytes32[] memory entries);
```

#### On-chain identity & the default lens (decided 2026-05-28, web-research-backed)

A lens is keyed on an **address**, so "whose data do I read?" is really "which address?" — and on-chain that question is subtler than it looks. The decision below was made after a three-agent web-research pass on current (2025–2026) EVM identity; sources in the revision log.

**The rules:**

1. **`tx.origin` is never used.** It is an auth anti-pattern (phishing, SWC-115); EIP-7702 (live on mainnet since the Pectra fork, 2025-05-07) broke its last use (the "is this a plain EOA?" check); and under ERC-4337 it is the *bundler's* address, not the user's. The SDK offers no helper that touches it.

2. **`read(path)` defaults to `address(this)` — "read my own files."** Safe, predictable, and account-abstraction-proof. A bare read never silently resolves to someone else's data (this is the on-chain form of the off-chain "carbonara" default bug — avoided by construction). *One honest footgun:* `address(this)`'s namespace is usually **empty**, so a dev who mentally modeled `read()` as "read the *caller's* file" gets nothing back rather than an error — silent-empty looks like "file doesn't exist." The read verbs therefore return an explicit `(bool exists, …)` so a missing file is distinguishable from an empty one, and the docs state loudly: the default is *your own* namespace, not the caller's.

3. **Reading anyone else is always explicit: `readAs(path, who)`.** The `who` is an address the dev names on purpose — `msg.sender` (their direct caller), a DAO/registry, or an authenticated end user.

**Two different "defaults" — don't conflate them.** The off-chain Q4 default lens (the connected **wallet's** address — "see your own files") and the on-chain `read(path)` default (`address(this)` — the consuming contract's own files) are the same *principle* ("default to your own namespace"), each resolved to the right self for its context. Neither is the **deployer**: the deployer appears only as the *tail* of ADR-0039's `systemLenses[]` default chain (the bootstrap shared default), never as the head/primary default — that deployer-as-primary behavior was the original "carbonara" bug both defaults exist to avoid.

**Why this is address-keyed and AA-compatible (not "AA-native magic").** Under both ERC-4337 (`bundler → EntryPoint → smart account → your contract`) and EIP-7702, **the `msg.sender` your contract sees is the user's smart-*account address*** — not the bundler, not the paymaster. Account abstraction breaks the assumption "`msg.sender` is a human EOA"; EFS never needs that assumption, because lenses key on *an address* regardless of whether it is an EOA, a Safe, or a 4337/7702 account. **The honest caveat:** the account address is not the same thing as "the human owner's key." Session keys, ERC-7579/6900 executor modules, and re-delegated accounts mean the address that authored an attestation may today be controlled by a different key or different code than when it wrote. EFS resolves *which address* canonically — it does not and cannot certify *who currently controls that address*. Lens trust is trust in an address's **current controller**, which can change; for durability, prefer lens entries that point at immutable contracts over EOAs, and treat attestation provenance (timestamp, `refUID`, revocation state) as the freshness signal.

**The one hard limit, stated honestly.** A contract *cannot* reach **through** a middleman to the true end user: if Alice calls a Router that calls your contract, your `msg.sender` is the Router, not Alice, and nothing on-chain recovers Alice safely (`tx.origin` is dead). This is an EVM reality, not an EFS gap. The industry answer — which the SDK documents rather than papers over — is to **pass the user explicitly and prove it**: an Aave-style `onBehalfOf` parameter gated by on-chain authorization, or an **EIP-712** signature the dev verifies (using **ERC-1271** for smart-contract-wallet signers, since `ecrecover` only works for EOAs). When the SDK documents that signature path it must carry the now-standard hardening, not a naïve `ecrecover`: **ERC-7739** nested-712 rehashing to stop a single owner's signature replaying across the multiple smart accounts it controls; `verifyingContract` + `chainId` + a contract-tracked `nonce` in the EIP-712 domain; and — because an EOA can *become* a contract mid-life under 7702 — re-checking code-presence per call rather than caching "EOA vs contract." The SDK deliberately ships **no `readAsEndUser`** helper — inferring the end user through middlemen can't be done safely, so we make the explicit, authenticated path easy instead of faking the magic one (a `readAsEndUser` would just be `tx.origin` in a nicer coat).

**EFS-wide implications (this is a protocol stance, not an SDK detail).** James asked to think about this holistically, and it is right to: *attester address = identity* is EFS's single load-bearing invariant — PIN/TAG/PROPERTY, lenses, and lists all key on it. The identity rules above don't *introduce* that; they restate it honestly under modern account abstraction. Three consequences ripple past this SDK and are surfaced to the PM as candidate **contracts-side ADR** material (not resolved here):

1. **"Attester identity is the address's *current controller*, not a durable principal."** EIP-7702 makes an EOA's controlling code mutable between transactions, so the protocol's "an attester is a stable who" assumption is weaker than when EFS was designed. This should be stated explicitly at the protocol level, and EFS's own trust roots — the ADR-0039 `systemLenses[]` tail (deployer + bootstrap curator) — should be **immutable contracts / multisigs, not bare EOAs**, so the roots of trust can't be silently re-delegated.

2. **Delegated attestation is already the sanctioned "act on behalf of."** EAS's `attestByDelegation`/`multiAttestByDelegation` records the *recovered signer* as attester — exactly the EIP-712 path above. The open protocol question: **does EFS's pinned EAS version verify ERC-1271 (smart-account) signers in delegated attestation, or only `ecrecover` EOAs?** If only EOAs, smart-wallet users **cannot** use any `onBehalfOf`/gateway/delegated flow — a real gap that gates the off-chain SDK's batch story (Q5) for the fastest-growing wallet class. Flagged for contracts verification.

3. **Provenance/freshness is a cross-SDK read concern.** Because a resolved value's author-address may have changed controllers, *both* SDKs (not just on-chain) should expose attestation provenance — timestamp, `refUID`, revocation state — alongside resolved values, so a consumer can judge freshness. The off-chain default-lens chain (ADR-0039) inherits the same caveat its on-chain cousin does.

**What is genuinely out of scope on-chain is *unbounded reverse-discovery*, not enumeration — and the boundary is sharper than "no reverse-lookup."** Three things a multi-team integrator wants, and where each actually lands against the view contracts (`EFSIndexer`/`EFSFileView`):

| Question | On-chain? | Mechanism |
|---|---|---|
| "List the child anchors under `/apps/`" (forward) | **Yes**, bounded window | `getChildrenCount` + `getChildAt(parent, idx)` |
| "Did *known* attester `A` write at this path / target?" | **Yes**, O(1) | `containsAttestations(target, A)` / `getChildrenByAttesterCount(anchor, A)` |
| "Enumerate the *unknown set* of every attester who wrote here" | **No** | no `getAttestersAt(anchor)` primitive — needs an external index |

So a contract that already knows whose config it wants (the common case — App B reads App A, address known from a registry or out-of-band) is fully served on-chain. What requires the deferred external index (D1, `NotImplemented` in both SDKs) is the **open-ended** "who else is here that I've never heard of," plus cross-history timelines and lens *discovery*. The off-chain SDK adds ergonomics (open `AsyncIterable`, no caller-sized window, eventually that index); the *functional* read surface — lens-scoped reads, list reads, folder enumeration, known-attester checks — is available to a contract too.

**Gas boundary (the caller owns it).** Every read is a `view`, but a contract that *calls* these from inside its own transaction pays the gas, and a lens-scoped enumeration is `O(count × lenses)` with `lenses` capped at `MAX_LENSES` (the renamed `MAX_EDITIONS = 20`, ADR-0026/0043). Keep `count` small; a window that's too large reverts mid-call and burns the caller's gas. The signatures therefore take an explicit `count` rather than ever returning "all" — there is no unbounded list on-chain.

### Events & custom errors

EAS emits its own `Attested` events, but those are keyed on attestation UIDs, not the consumer's domain. A DAO's subgraph or a registry's indexer wants to react to *domain* events (a proposal archived at a path), so the `EFSWriter` base **emits EFS-level events keyed on the human path**, and uses Solidity **custom errors** (cheaper than `require` strings; the modern idiom):

```solidity
abstract contract EFSWriter {
    event EFSFilePinned(string indexed path, bytes32 indexed dataUID, bytes32 pinUID);
    event EFSPropertySet(bytes32 indexed keyAnchor, bytes32 propUID);
    event EFSTagged(bytes32 indexed target, bytes32 indexed definition, int256 weight);

    error EFSPathInvalid(string path);             // fails ADR-0025 name / ADR-0021 depth
    error EFSMirrorSchemeRejected(string scheme);  // not in the ADR-0023 allowlist
    error EFSListConstraintViolation();            // invalid ListConfig combo
    // ... mirrors the relevant subset of the TS EFSErrorCode enum
}
```

The `using EFSLib for IEAS` library form cannot emit events on the consumer's behalf (events must be declared in the emitting contract), so event emission is a property of the **base**; library users who want domain events declare and emit their own. This is one more reason the base is the documented happy path.

### Constants & escape hatch

```solidity
import {EFSConstants} from "@efs/solidity/EFSConstants.sol";
// EFSConstants.ANCHOR_SCHEMA, .DATA_SCHEMA, .PIN_SCHEMA, … as `bytes32 constant`,
// generated from the deployed registry and version-locked to the contracts release.

// Escape hatch: the helpers are sugar over EAS + these constants. Any contract can bypass the
// library and call eas.attest(...) / eas.multiAttest(...) directly with the raw schema encodings —
// the library never hides state and never gates access.
```

### No batching / signature problem on-chain

Unlike the off-chain SDK (where multiple attestations across schemas mean multiple wallet prompts — the whole Q5 problem), an on-chain library call runs **inside one transaction** already: the consuming contract makes N attestation calls during its own execution, triggered by a single user transaction to *that contract*. There is no per-attestation prompt and nothing to batch. The single-signature machinery (EIP-5792 / 4337 / sequential) is purely an off-chain concern.

### Two SDKs, one functional spec (the parity contract)

A smart contract is a first-class EFS client, so the on-chain and off-chain SDKs expose the **same functional primitives** — read a file under lenses, read a list, enumerate a folder, create files/folders, pin/tag/set-property. They differ only in *form*, not in *capability*:

| Concern | Off-chain (TS) | On-chain (Solidity) |
|---|---|---|
| Enumeration shape | open `AsyncIterable` / cursor | bounded window (`start`, `count`) — caller owns the gas |
| Async | `Promise` | synchronous `view`/state calls |
| Attester | connected wallet (Q4 default) | always the consuming contract (`msg.sender`) |
| Reverse-lookups | `NotImplemented` shim (D1) | `NotImplemented` (out of scope) |

**Drift risk is real and must be managed, not assumed away.** Because the two SDKs ship in different languages (though in the same `sdk/` repo — Q1 RESOLVED), a primitive added to one can be forgotten in the other. The mitigation is a **shared functional-primitive checklist** — a single source-of-truth list of EFS operations (the rows of the parity table, expanded) that both SDKs are measured against. Adding an operation means adding a row; a row unimplemented on one side is a tracked gap (acceptable: e.g. reverse-lookups are `NotImplemented` on both), never a silent omission. This checklist lives with the contracts/EFS spec, not inside either SDK, precisely so neither SDK "owns" the definition of parity. *(This is a process artifact for implementation, flagged here so the eventual plan carries it; see Process feedback.)*

### Shared-namespace conventions (multiple teams, one filesystem)

EFS is a shared namespace where unrelated teams' contracts read and write side-by-side — like multiple apps on one OS. The mechanism handles this cleanly, but the mental model is **not** Unix, and a dev who assumes single-owner paths will get burned. This subsection is the contract the SDK owes multi-team integrators; most of it is convention (docs/README), and one piece is a genuinely open protocol question flagged for James.

**1. Paths are global; writes are attester-keyed. There is no clobbering — and that itself is the footgun.** When App A and App C both `pinFile("/shared/config")`, they do **not** overwrite each other: each write lands in a slot keyed by `(definition, attester)`, so A and C occupy *parallel overlays at the same path string*. A reader sees one of them only by naming it in their lens stack. The danger is the inverse of clobbering: a dev expects to "share a file" and instead writes into a private overlay nobody else reads. State plainly in the README: *you can only ever write your own overlay; readers see your write only if they lens through your address.*

**2. Everything on EFS is public; the axis is *who authors a path*, not private-vs-shared.** EFS is for data you want **publicly readable in a standard, navigable structure** — if data were truly private you'd keep it in your own contract storage and not use EFS at all. So there is no "private" tier. There are two authoring patterns, both fully public, and namespacing is a *navigation/attribution* nicety, **not** a collision-avoidance mechanism (attester-keying already prevents clobbering — §1):

- **Single-author** (your app publishes its own files/config for others to read) → namespace under a prefix you control, **`/apps/<reverse-dns>/…`** (e.g. `/apps/com.aave.v3/risk-params`) or address-rooted `/0x…/`. This gives clean **attribution + discoverability** and avoids accidental name clashes in the global tree; readers reach it by lensing *your* address. Not required for correctness — purely to keep the permanent (ADR-0030) path tree legible.
- **Multi-author at a shared path** (the interesting case) → a **deliberately common, well-known path** like `/swaps/maxSlippage` that many apps read together. You do **not** namespace per-app — the whole point is the shared path. Disambiguation is by **lens, not by path**: the reader chooses *whose value to trust.*

**3. For shared config, the dev chooses the lens — there is no automatic answer, and that's fine.** Reading `/swaps/maxSlippage`, a contract decides which overlay it believes by what it passes as `lenses`:

- **the end-user caller** — `read("/swaps/maxSlippage", [msg.sender])` → "this user's own slippage setting";
- **the DAO / feature owner** — `read("/swaps/maxSlippage", [daoGovernanceAddr])` → "the value governance set for everyone";
- **itself** — `read("/swaps/maxSlippage", [address(this)])` → "my app's default".

Choosing among these is **the dev's call**, application logic — the SDK's job is only to make passing the chosen lens trivial, not to decide for them. To read a *specific* known team's value, pass their address (`[aaveAddr]`, known from a constant or out-of-band); `containsAttestations(target, aaveAddr)` is the O(1) "have they written here yet?" check.

**4. There is no shared-lens registry today — and the SDK is not where one would be built.** For unrelated teams to *agree* on one canonical overlay (a token registry everyone reads through the same lens) you'd want a blessed-lens / lens-list registry. EFS has none: ADR-0031 deferred on-chain lens lists ("the URL is the list"); ADR-0039's `systemLenses[]` default tail (the deployer, via `EFSRouter.DEPLOYER()`) is the only built-in shared default, and it's off-chain. Until EFS designs a good registry, **picking the lens is the dev's responsibility** (per #3), and a registry — if one is ever built — is a **contracts/protocol artifact, never an SDK one**. The SDK would consume a registry, not provide it. Whether v1 needs that primitive is **surfaced to James** as a protocol question (Open Questions Q6); it does not gate this SDK.

**5. Reading untrusted data is the caller's responsibility.** Another team's config is attacker-controlled bytes. On-chain reads return a `bytes32` UID or raw `bytes` (PROPERTY value) with no decode/validation helper — the consuming contract must decode and bounds-check before acting (the lending protocol reading foreign risk params must not trust them blindly). The TS side has `efs.decode` + Zod; the Solidity side deliberately returns raw bytes (typed on-chain decoders are a NICE, not v1). Documented as a sharp edge, not hidden.

**6. The permission model is capability-style and ungriefable — with known limits.** "You write only your own overlay; readers ignore you unless they lens you in" is a complete, clean coexistence model: no one can overwrite your slot or inject a mirror/content-type onto your DATA. What it lacks, for later: **write delegation** ("App A authorizes App B to write A's overlay") and an explicit **"this is the official version" signal**. Both are post-v1; both largely reduce to the same blessing primitive as #4.

### Packaging (Q1 RESOLVED — `sdk/` repo)

Where the Solidity source lives was the reopened **Q1**; it is now **RESOLVED (2026-06-10, ADR-0001): the Solidity SDK lives in the `sdk/` repo alongside the TS SDK**, shipped as a compile-in `@efs/solidity` package consumed via npm (not a contract EFS deploys). Distribution — devs `npm install` both halves — decided it over deployment-coupling; version-lock to the frozen schema UIDs is by pinning, not co-location. See Open Questions Q1.

---

## Identity, lenses & the signer model (decided 2026-06-10)

These decisions came out of a long working session on identity, multi-device wallets, and click-reduction. They are the load-bearing shape of the SDK; capturing them here so they survive.

### 1. A lens is a *configurable hierarchy*, not an address

This reconciles a misread: ADR-0031:35 ("the URL is the list") describes the **override transport**, not what a lens *is*. The **default** lens is a composed chain — **ADR-0039's priority hierarchy**, already Accepted:

```
connectedAddress → viewedAddress → webOfTrust[] → systemLenses[] (tail: bootstrap curator + deployer)
```

- **Building this chain is an SDK job** (the multi-step assembly the SDK exists for). TS: a `resolveLens(config)` utility. Solidity: helpers so a contract can assemble the `address[]` cheaply (`lensSelf()`, `lensFollowing(parent)`, `lensWithDefaults(...)`), bounded by `MAX_LENSES = 20`.
- **`?lenses=` (or an explicit array) is a wholesale override** — pins exactly that list, shareable, no prepend/append (ADR-0039:31).
- **ENS resolution and "(you)" expansion are SDK utilities**, kept simple and inspectable — not buried API magic.

### 2. The "account group" (multi-device identity) = `webOfTrust[]` content

A user's device/burner keys are modeled as a **LIST the parent (ENS) wallet attests** — no new schema (LIST_ENTRY ADDR mode already stores a bare address: `ListEntryResolver.sol:155`; verified in the freeze set). Reading "jamescarnley.eth" = ENS→parent→read key-set→feed into the `webOfTrust[]` tier. ADR-0039:18,37 **explicitly reserved this slot** ("adding it later is a config change, not a plumbing change"). Properties verified against contracts:
- **Trust direction sound** — only the parent can edit its own key-set; a device can't add itself (membership keyed `[listUID][identityKey][attester]`).
- **Retroactive** — a burner's past writes resolve under the identity the moment its address is added; no migration (resolution is attester-keyed at read time).
- **First-attester-wins ⇒ list order is the conflict winner** → **main wallet must be index 0**.

**v2 security gates (deferred, but the stance is flagged now because retrofitting after content exists is painful):** per-key capability scoping (a stolen burner currently = full identity authority); time-aware revocation (bind membership to block ranges; ignore a key's writes after its revocation); proof-of-control before adopting an address (not unilateral parent assertion); ENS-transfer / EIP-7702-controller re-verification at resolution time; a privacy opt-out (the key-set publicly links all burners to one identity).

### 3. v1 ships the *seam*, not the feature — and it must stay non-breaking

v1 APIs take an **opaque identity/lens abstraction** (an address is just the simplest identity); the trivial resolver (`addr → [addr]`) ships now, key-set expansion drops in later **additively**. Three invariants make that true (from adversarial review):
1. **One async discipline for all constructors** — don't ship a sync `lens()` then an async `identity()`; resolve at **read time** (also fixes cache staleness; support `{ blockTag }`).
2. **Resolved-set order is a documented contract** (first-wins makes order an API surface).
3. **Identity stays opaque** — N-vs-1 never leaks into a return type. Also: **reject bare ENS strings** (`{ as: "james.eth" }` must not silently mean literal — force `EFS.identity(...)`); throw on `MAX_LENSES` overflow rather than silently truncating.

### 4. The SDK is signer-agnostic → the burner-vs-real-wallet call is deferred

Two separate abstractions: the **signer** (*who writes* — MetaMask EOA, burner, or smart account; the SDK just takes one) and the **lens hierarchy** (*who you read as*). Because the SDK abstracts the signer, **it serves all wallet strategies without changing** — so James can ship v1, watch how bad popups actually are with batching, and decide burners later from real data. Rule: never bake "burner"/"MetaMask" assumptions into the API. Smart wallets confirmed first-class (EAS uses OZ `SignatureChecker`, `EIP1271Verifier.sol:123` — ERC-1271 works in both direct and delegated attestation). Posture: defer AA/recovery to wallet devs; lean on ENS for naming; burners are an optional optimization, not a requirement.

### 5. Static vs dynamic references — match the pointer to the link's intent

EFS has two pointer kinds, and using the wrong one is silent data corruption, not a style choice:

- **Static reference (UID)** = "*these exact bytes / this exact version*." Mandatory whenever the link is semantically specific. **MIRROR→DATA is the canonical case:** a mirror serves the bytes of *one* DATA attestation; if it referenced a path instead, re-pinning new content there would make the mirror silently lie about what it serves. PIN→DATA is likewise static.
- **Dynamic reference (path / Anchor)** = "*whatever's active here now*" (`/efs/logo` → newest). Safe **only when you're fine with the target moving under you** (navigation, "latest").

**The clean model insight:** EFS gets its URL-like dynamic behaviour by **indexing which static link is currently active — never by making an individual link fuzzy.** A path resolves "dynamically" because the *active-pin pointer* moves; each pin is still a precise static statement. Updating = mint a new static pin. So **dynamism lives in "which static link is active," never in a fuzzy link.** Choosing a path for a semantically-static link is a latent bug that fires when the data later changes.

**SDK consequence (this hazard bites third-party devs too).** Expose the two as **distinct, explicit types that never silently interconvert** — `DataRef` (UID-backed, static, "this exact version") vs `PathRef`/`AnchorRef` (path-backed, dynamic, re-resolved to "latest"). A contract-fidelity validation (2026-06-10) confirmed the principle holds across the codebase (no live violations) and named the two edges most at risk of being mis-referenced, which the SDK's types must guard:
- **REDIRECT (ADR-0050; schema frozen, SDK support designed-only):** one `kind` field separates `sameAs`/`supersededBy` (static UID target) from `symlink` (deliberately dynamic path target). The SDK must surface these as different return types, not one "redirect" blob — following a `symlink` expecting a fixed identity is the trap.
- **Name-resolved alias anchors as fake permalinks:** a `web3://<router>/<schemaUID>` URL resolves through a *dynamic* name lookup whose anchor contents are lens-scoped and mutable. A dev who stores it as a "permalink" is holding a `PathRef`, not a `DataRef`. Conversely, storing a `DataRef` and expecting `?lenses=` to yield "latest" gets frozen identity — the opposite mistake.

Same "make the dangerous distinction visible" discipline as the identity seam (§3). (Read-time REDIRECT multi-hop/cycle handling is an unfrozen resolver-spec gap — noted upstream, not an SDK concern.)

### 6. Click-reduction is an SDK-owned priority (see [[sdk-minimal-clicks]])

Default to **efficient multi-attestation signing**. Verified crux: EAS UIDs include `block.timestamp` (`EAS.sol:704`), so a UID can't be predicted before mining — meaning any intra-write attestation that references another by **UID-refUID** forces sequential signing (the "8 popups"). **Validated outcome (2026-06-10): click count is a function of the write's dependency depth, which is driven by how many PROPERTYs the write carries — not a fixed headline number.** The SDK sends one `EAS.multiAttest` per dependency layer (mint DATA → then the mirror/placement/property attestations that reference its now-mined UID). A **bare file** (DATA + MIRROR + placement PIN, no metadata PROPERTYs) is **2 layers ⟶ 2 clicks**; adding metadata PROPERTYs (`contentHash`/`size`/`contentType`, each a key-ANCHOR→PROPERTY→binding-PIN triple) adds the property layer for **~3 clicks**. This is SDK-only, no contract change. One-click was investigated and **rejected** (self-placing DATA can't include the mirror and would reopen the Etched ADR-0049), so **there is no schema-freeze dependency** for click-reduction. Full investigation in [[sdk-minimal-clicks]].

## Open Questions

- [x] **Q1 (repo packaging) — RESOLVED (James, 2026-06-10): both SDKs live in the `sdk/` repo.** The Solidity SDK is a **compile-in library consumed via npm**, not a contract EFS deploys — so it ships alongside the TS SDK as one package/repo. (This overrides the earlier PM rec of `contracts/`: James's framing is that distribution, not deployment-coupling, is the deciding factor — devs `npm install` both halves.) Version-lock to the frozen schema UIDs is handled by pinning, not co-location.

- [x] **Q2 (namespace naming) — RESOLVED (James, 2026-05-28): confirmed (a) + the codified verb contract.** domain-model namespaces (`efs.fs`, `efs.graph`, `efs.props`, `efs.lists`, `efs.sorts`, `efs.lenses`, `efs.eas`, `efs.raw`) vs verb-first (`efs.read/write/query/attest`). An expert SDK-design review (2026-05-28) found **(a) is the de-facto industry standard** — *resource-oriented design*, codified in Google's API Design Guide and embodied by Stripe (`stripe.customers.create`), Prisma (`prisma.user.findMany`), Twilio, Supabase, GitHub Octokit. **No widely-respected SDK uses a top-level verb-namespace tree.** The field splits between resource.action namespacing (multi-resource domains — EFS's case) and flat verb methods (single-resource domains like EAS/ethers). Verb-first also fails EFS specifically because `graph` and `lenses` are resource models, not actions, and don't reduce to a single verb. **Refinement adopted from the review:** keep (a)'s noun tree but enforce a *consistent verb vocabulary* on the leaves — this pairs resource-oriented design with Google's "standard methods" discipline, giving both a domain map and predictable operation names. An expert SDK-design review (2026-05-28) noted the first draft *claimed* this consistency but did not deliver it (`get` was used for three different things; enumeration used five different verbs). That is now fixed: the eight-verb contract is codified in **"Naming conventions (the verb contract)"** above and every leaf method conforms. **Recommendation: confirm (a) + the codified verb contract.**

- [x] **Q3 (reverse-lookup reads in v1) — RESOLVED + REFRAMED (James, 2026-05-28).** Original framing ("ship an off-chain index / reference EFS-in-Postgres example") was dropped: per James, the SDK does **not** bundle or build indexing infrastructure (nothing to do with The Graph). The handful of reverse-lookup methods (`graph.timeline`, `graph.versions.descendants`, `lenses.discover`) stay in the typed surface as **`NotImplemented` shims** so their shape is visible and stable; everything answerable directly from the chain works in v1. A packaged external index is DEFERRED (D1) to its own thread. (Renamed `OffchainIndexRequired` → `NotImplemented`; removed the `examples/reference-index/` project.)

- [x] **Q4 (lens default) — RESOLVED (James, 2026-05-28): default the lens to the connected wallet's address.** Don't always require an explicit lens — that taxes hello-world. Instead default the lens stack to the **connected wallet's own address**, and require an explicit lens *only* when no wallet is connected (a read with no attester is meaningless → `LensRequired`). The deployer default was the original bug; the user's own wallet is a safe default. See "Design note on lens defaulting" in Instantiation for the four-step resolution order.

- [x] **Q5 (single-signature writes) — RESOLVED (James, 2026-05-28; corrected after 2nd expert review).** No placeholder flag. `efs.batch()` delivers one signature where the wallet allows, constrained by the hard rule that **the connected wallet must stay the attester** (lenses + cardinality-1 PINs key on it). Only EIP-5792 `wallet_sendCalls` and ERC-4337 deliver one approval AND correct attribution; the **automatic fallback for plain EOAs is transparent sequential signing** (not a contract). The SDK-owned upgradeable `EFSUploadGateway` is **opt-in only** (`via: 'gateway'`), uses `multiAttestByDelegation` to keep the user as attester, and is explicitly **not** a single-signature mechanism. See "Design note on single-signature writes" in the batch section.

- [x] **Q6 (canonical shared config / shared-lens registry) — RESOLVED (James, 2026-05-28): no registry today; the dev picks the lens; the SDK is not where a registry would be built.** For unrelated teams sharing a config path (e.g. `/swaps/maxSlippage`), there is no canonical lens and **no shared-lens registry in EFS today** (ADR-0031 deferred on-chain lens lists). James's resolution: that's acceptable — a contract reading shared config chooses *whose* value to trust as **application logic** (the end-user caller `[msg.sender]`, the DAO/feature owner `[daoAddr]`, or itself `[address(this)]`); the SDK's job is only to make passing the chosen lens trivial. **A shared-lens registry, if EFS ever builds one, is a contracts/protocol artifact — never an SDK one; the SDK would consume it, not provide it.** So nothing here gates the SDK. (Kept on the radar as a *future protocol* possibility, not an SDK open question — see the Shared-namespace conventions §3–4.)

**Status: Q1–Q6 all RESOLVED.** Q1 closed 2026-06-10 (both SDKs in `sdk/` repo). One call left for James: **promote vs. revise**. Held at `#status/review` per design mode; not self-promoting. See the **Identity, lenses & the signer model** section for the 2026-06-10 decisions, and **[[sdk-minimal-clicks]]** for the live batched-write investigation.

> **Reviewer baseline (read before raising "these schemas don't exist").** This doc targets the in-flight EFS model on the `custom-lists` / `pin-tag-split` / `editions-to-lenses` branches — **ADR-0033 through ADR-0045**: PIN/TAG cardinality split (0041), editions→**lenses** rename (0043), LIST/LIST_ENTRY (0044), default-lenses chain (0039), edge-constraint callbacks (0045). On `main` (currently `94217b5`) the highest ADR is 0032 and placement is still TAG-based (ADR-0003) with no PIN/LIST/`getActivePin` — so a reviewer on a stale `main` checkout will (correctly) find none of this and (incorrectly) conclude the doc is fictional. It is not: it builds on the branch the contracts dev is actively merging. `MAX_LENSES` is the renamed `MAX_EDITIONS = 20` (ADR-0026 + 0043).

---

## Pre-promotion checklist

- [x] All `## Open questions` resolved or explicitly deferred — Q1–Q6 all RESOLVED (Q1 closed 2026-06-10: both SDKs in the `sdk/` repo, ADR-0001)
- [x] `**Target repos:**` — both SDKs in the `sdk/` repo (Q1 RESOLVED, ADR-0001); planning — design doc only
- [x] `**Depends on:**` chain — design-system accepted ✅; brainstorm-system in review; ADR-0031 accepted ✅; ADR-0041 accepted ✅; ADR-0044 pending Lists merge (implementation gated, not design gated)
- [x] No `<!-- AGENT-Q: -->` comments left in the design body
- [x] At least one round of `#status/review` — expert subagent review pass (2026-05-28) + James Q1–Q5 resolutions

---

## Implementation notes

> **Review backlog.** The 2026-06-19 comprehensive review (`sdk/docs/reviews/2026-06-19-comprehensive-review.md`)
> found the built surface is ~35% of this design and surfaced concrete P1/P2/P3 items. Those open items are
> tracked as work in **[[sdk-review-backlog]]** (correctness/docs/trust P1s, the completeness-roadmap P2s, polish P3s)
> so they aren't lost in a review file. The **Implemented vs Designed** manifest under API Surface is the
> at-a-glance built/stubbed/designed view.

This document is mostly DESIGN; the SDK is scaffolded and partially built (see the manifest above) — the read-a-file / write-a-file core runs today, most protocol primitives do not yet.

The implementation thread (Kanban Backlog: "Implement OnionDAO subset of sdk-architecture") is gated on:
1. James frame-review of this doc (this card's purpose)
2. Lists → Sepolia deploy (schema freeze: 9 schemas)

Q1 (repo layout) — RESOLVED (2026-06-10, ADR-0001): **both SDKs live in the `sdk/` repo.** The TS SDK and the Solidity library (a compile-in `@efs/solidity` package, not a contract EFS deploys) ship together; the implementation thread can assume the single `sdk/` repo.

---

## Process feedback for the PM

**Was the process guidance clear and useful, or in the way?**

Clear and useful. The frame-first directive ("read corpus → distill requirements → inverted-framing pass → THEN design") was the right order and prevented me from jumping to API signatures before I understood what the SDK actually needs to do. The "anchor requirement" (debug client parity) gave me a concrete floor to design from rather than speculating. The inverted-framing pass was particularly valuable — it's how I concluded that `efs.eas` should be a first-class top-level surface rather than buried in `.raw`, because the corpus showed devs drop to raw EAS immediately and that's load-bearing behavior we should embrace rather than fight.

**Did the requirements-first / inverted-framing steps add value, or feel like overhead?**

Real value. The requirements step forced me to distinguish between "what the debug client does" (concrete) and "what devs wish for" (aspirational), and the MUST/NICE/DEFERRED structure gave a clear signal for what to include in the API surface vs. what to defer. Without it I'd have included `graph.versions.descendants` as a MUST, buried it in an implementation corner, and produced a false promise — the inverted framing showed it requires an off-chain index that doesn't exist yet, so it becomes a surface-that-throws with a clear upgrade path.

**Roughly how many tokens / rounds did you spend before reaching review-ready? Was it proportional?**

One round — this document. The corpus reading (10+ files in parallel) was the most token-intensive part, but it was load-bearing: the dev-friction brainstorm alone contained the key design insight (devs drop to raw EAS on day one, so make efs.eas a feature not a failure mode). A shorter corpus would have produced a worse design. Token spend felt proportional to the scope.

**What would you change about the process for the next design thread?**

One friction point: the process says "read the corpus" but doesn't specify which files are load-bearing vs. background. In this case, the dev-friction brainstorm (`bs-third-party-dev-ux-v1`) was 10× more valuable than the OS-SDK brainstorm for this design. Future design prompts should mark files as `[CRITICAL]`, `[CONTEXT]`, `[BACKGROUND]` so the agent can prioritize and skip background-only reads when time is short.

Second: the process says "stop at review" but doesn't say what "review-ready" looks like. I interpret it as: requirements locked, inverted-framing pass done, API surface sketched, open questions named, doc is readable by a non-agent human in under 20 minutes. A one-line definition of "review-ready" in the process doc would help future threads calibrate when to stop vs. when to keep refining.

---

### Revision log

**2026-06-20 (later) — manifest re-grounded to the `chore/scaffold` build round.** The SDK agent shipped a large batch since the morning reconciliation; the **Implemented vs Designed** manifest was updated to match the committed surface (verified against `packages/sdk/src/index.ts` + `packages/solidity/src/`). Newly ✅: schema-UID integrity gate (`efs.raw.verifyDeployment`, closes review P1-9); escape hatches (`efs.raw.*` contract handles, `efs.eas.*` attest/multiAttest/revoke/getAttestation, `efs.decode`); AA-ready Submitter seam (`Tier1Submitter` + `efs.account.capabilities()`); edge/value writes (`graph.tags.*`, `props.*`, `graph.pins.*`); lists read + write; **REDIRECT** (ADR-0050) write + opt-out read-time following (cycle-detected, bounded hops, `result.via` provenance); and the `@efs/solidity` compile-in lib (`EFSReader`/`EFSLib`/`EFSWriter`, a first-class on-chain client, no longer write-only stubs). Still flagged: **sorts** stubbed `@experimental` (SORT_INFO unfrozen); `batch()`/resume type-present-behavior-absent; mirrors writes / WHITEOUT / multi-chunk designed-only. Two load-bearing items added to the manifest bottom-line: (1) the **PROPERTY `forSchema` correctness fix** — key-anchors now use `PROPERTY_SCHEMA_UID` not generic `0` (they were invisible to spec-conformant readers; found by two expert investigations; worth a contracts-side check); (2) **ADR-0050 redirect resolution spec is unpinned** — SDK fail-closes on a cycle vs the ADR's lowest-UID-in-SCC, and path-level symlink following is deferred (surfaced upstream). Test counts ~416 TS + ~48 forge; ~27 kB gzip (budget 36). No frame change. (Other agents — wallet one-sig routine, gasless faucet drip — are separate, audit-/agent-gated, untouched here.)

**2026-06-20 — reconciled the doc to the BUILT surface (post-2026-06-19 comprehensive review).** The 5-pass review flagged this doc as the least-trustworthy design doc: it overstated current capability and carried stale facts. Surgical corrections (no frame change):
- **Schema count → the frozen 9.** The Typed-constants block listed **11** with BLOB/NAMING and (wrongly) claimed "there is NO REDIRECT schema." Corrected to the canonical 9 (ANCHOR, PROPERTY, DATA, PIN, TAG, MIRROR, LIST, LIST_ENTRY, **REDIRECT**); BLOB/NAMING **dropped** in the freeze reconciliation (ADR-0012); **SORT_INFO deferred** (not in the frozen set), so the `efs.sorts` surface is designed-only until it ships. Source: SDK `chain/deployments.ts` `EfsSchemaUIDs` + `docs/SEPOLIA_FREEZE_TABLE.md`.
- **`getDataMirrors` naming.** Pointed `efs.fs.mirrors.list` at the real lens-scoped `EFSFileView.getDataMirrors(dataUID, attester, start, length)` (cross-attester discovery = the separate `getDataMirrorsAllAttesters`); there is no `getDataMirrorsByAttester`.
- **Stale read/instantiation flows.** Added an authoritative-detail banner under API Surface pointing reads to **[[sdk-read-surface]]** and instantiation/signer to **[[sdk-wallet-architecture]]** — the built client is `createEfsClient({ provider, chain, account? })` (EIP-1193 + EIP-155, type-gated writes), not the `new EFSClient({ rpc, chainId, signer })` sketch. REDIRECT relabeled "schema frozen, SDK support designed-only" (was "unimplemented").
- **New "Implemented vs Designed" manifest** (under API Surface) — ✅/◑/**D** per major surface, grounded in `packages/sdk/src/index.ts` + the review's completeness matrix, so a reader sees the ~35%-built reality.
- **New [[sdk-review-backlog]]** + a pointer in Implementation notes — the open P1/P2/P3 review items tracked as work. No architecture change; facts reconciled to reality. Doc held at `#status/review`.

**2026-06-10 (session) — identity/lens/signer model captured + Q1 closed + minimal-clicks investigation.** Long working session, decisions written down so they survive: (1) **Q1 RESOLVED** — both SDKs in the `sdk/` repo (Solidity is compile-in via npm, not deployed by us). (2) New **"Identity, lenses & the signer model"** section: a lens is the **ADR-0039 configurable hierarchy** (not an address), built by the SDK, with `?lenses=` as wholesale override; the account-group/key-set = `webOfTrust[]` content (the reserved slot, no new schema — verified `ListEntryResolver.sol:155`); v1 ships the opaque-identity **seam** not the feature, under 3 non-breaking invariants; the SDK is **signer-agnostic** so the burner-vs-real-wallet call is deferred; smart wallets confirmed first-class (`EIP1271Verifier.sol:123`). (3) **Minimal-clicks** spun out to **[[sdk-minimal-clicks]]** — 3-agent deep pass found the write is a 2–3-deep UID-refUID DAG; EAS UIDs embed `block.timestamp` (`EAS.sol:704`) so one client-side `multiAttest` can't self-reference. **Validated outcome:** 8→2–3 clicks, SDK-only, **zero contract change and no schema-freeze dependency** (one `multiAttest` per DAG layer). One-click (self-placing DATA) investigated and **rejected** — MIRROR→DATA must stay UID-static + it reopens Etched ADR-0049; deferred to post-burn FUTURE_WORK. Write-through identity contract **dropped** (folds into per-user smart accounts, already first-class via ERC-1271). The `EFSUploadGateway` wrapper ruled out (collapses attester). Added the static-vs-dynamic reference rule (§5) + identity/lens/signer model. Doc held at `#status/review`.


**2026-05-28 (entry 1 of 10) — expert subagent review pass (James-requested, pre-frame-review).** Two parallel expert reviewers (SDK API/DX, and contract-fidelity against the `custom-lists` specs/ADRs) audited the draft. Both validated the *frame* (namespaces, layering, batch-as-value-add, lens model, PIN/TAG/PROPERTY semantics, sort-overlay mechanics — the last verified faithful in detail). Findings folded in:
- **Verb contract codified.** The draft *claimed* a consistent verb vocabulary but didn't deliver (`get` meant three things; enumeration used five verbs). Added the eight-verb "Naming conventions" contract and made every leaf conform.
- **SORT_INFO flag corrected + `sourceType` exposed.** Fidelity check found specs 02 + 07 both carry the 3-field version (only spec 06 is stale), and that `targetSchema` is inert without `sourceType=1`. `sorts.declare` now exposes `sourceType`; the freeze flag points contracts at the 3-field string.
- **Resumable cursors.** Added `Page<T>` + `.page()` companion on every `AsyncIterable` read, and stated the eager-array-vs-iterable rule explicitly.
- **Bidirectional escape hatch.** Added `efs.decode` (raw attestation → typed entry) and a first-class `efs.graph.referencing` wrapper (debug-client parity), closing the one-way cliff into raw-land.
- **Lists fidelity (ADR-0044).** Pre-flight rejection of `appendOnly+allowsDuplicates+maxEntries==0`, ADDR-mode `recipient` encoding, signed `int256` weight, removal-doesn't-reclaim-space note.
- **Write cost honesty.** `WriteReceipt`/`estimate` now separate `attestationCount` from `chunkDeployCount` (SSTORE2 chunk deploys aren't attestations and dominate large-file gas).
- **Smaller:** `lenses.remove` made async; `OperationResult` carries a stable op id (+ `.as()`); callback batch marked preferred with an unexecuted-builder guard; lens-precedence behavior of `efs.graph` documented.

These are all within-frame refinements — none changed the architecture. The doc remains at `#status/review` for James's promote/revise call.

**2026-05-28 (entry 2 of 10) — Q1–Q5 resolved (James), folded in one pass.** Q1 (single `sdk/` repo) and Q2 (resource-oriented namespaces) confirmed as already designed. Three design changes (*Q1, Q3 and the Q5 mechanism order below were later superseded — see entries 3 and 4*):
- **Q3:** off-chain-index methods stay and throw `OffchainIndexRequired`; added a runnable reference index example (`examples/reference-index/`) so the throw points at real code. *(Superseded by entry 4: renamed `NotImplemented`; example removed; SDK does not bundle indexing.)*
- **Q4:** dropped "explicit lens always required." The lens now **defaults to the connected wallet's own address** (your own content is a safe default; the deployer default was the original bug). Explicit lens required only when no wallet is connected (`LensRequired`). New four-step resolution order documented in Instantiation.
- **Q5:** removed the placeholder `gateway` flag. `efs.batch()` now owns single-signature delivery by capability detection — EIP-5792 → ERC-4337 → SDK-owned upgradeable `EFSUploadGateway` (explicitly not EFS-core) → sequential fallback — reporting `signatureCount`/`mechanism`. *(Superseded by entry 3: the gateway is not single-signature and was demoted to opt-in; sequential is the automatic fallback.)*

All five open questions are now RESOLVED; the doc is held at `#status/review` per design mode.

**2026-05-28 (entry 3 of 10) — second expert review (3 agents: wallet/EIP-5792, EAS-attribution fidelity, security/authz) caught a Q5 correctness defect; corrected.** The first-pass Q5 design listed an `EFSUploadGateway` aggregator as automatic mechanism #3. The fidelity reviewer flagged this as **flat wrong**: when a contract calls EAS, EAS records the *contract* as `msg.sender`/attester — so a plain aggregator attributes all content to the gateway address, collapsing every user into one cardinality-1 PIN slot and breaking lens resolution. EAS's `multiAttestByDelegation` restores the user as attester but costs **one signature per attestation** — so it is not a single-signature mechanism at all. Corrections folded in:
- **Only EIP-5792 and ERC-4337 deliver one approval AND correct attribution.** Stated the "attester is load-bearing" hard constraint explicitly in the Q5 note.
- **Demoted the gateway to opt-in (`via: 'gateway'`), never automatic;** it relays by delegation (user stays attester) and is explicitly not single-signature. **Promoted transparent sequential signing to the automatic EOA fallback** (security: don't put an upgradeable SDK-owned contract in the signing path silently).
- **Capability detection named:** `wallet_getCapabilities` for 5792; smart-account detection for 4337.
- **Batch consent/op-integrity:** added `batch.preview()` returning a manifest + integrity hash with preview↔execute hash enforcement (closes the op-smuggling gap a single approval otherwise opens).
- **SSTORE2 + CREATE2:** documented that bundling chunk deploys into one batch needs a CREATE2 factory (addresses must be pre-derivable) to stay single-approval.
- **`partialFailure` scoped** to the non-atomic sequential path only (5792/4337 are all-or-nothing).

This is the only architecture-touching change since the frame review and it is a *correctness* fix, not a scope change. Remaining lower-severity review notes (read-path content-hash verification on mirrors, mutable ENS lens-membership, the connect-time lens self-default surfacing in `efs.batch.preview` rather than silently) are tracked as implementation-notes refinements and don't block the frame decision. Doc remains at `#status/review` for James's promote/revise call.

**2026-05-28 (entry 4 of 10) — on-chain/off-chain reframe (James clarification).** James clarified two framing errors carried since the PM brief: (1) the **on-chain SDK is a Solidity deliverable** — a *library* (+ inheritable base) that smart-contract devs use *from their own contracts*, not a TypeScript package; and (2) **"off-chain SDK" just means "the TypeScript SDK"** — it has nothing to do with The Graph / a packaged indexer. Changes folded in:
- **New "Two deliverables" framing** at the top of the Proposal, plus an **On-chain SDK (Solidity)** section specifying the library/base API (`pinFile`, `tag`, `setProperty`, `place`, `createList`/`addEntry`, O(1) reads, constants, escape hatch).
- **Why a library, not a deployed helper:** the same attester-fidelity rule from the Q5 review applies on-chain — a separately deployed helper would be `msg.sender` and capture every consumer's attestations. A library/base executes in the consuming contract's context, so the consuming contract stays the attester. James confirmed the library form.
- **No batching on-chain:** a library call runs inside one transaction already; the Q5 single-signature machinery is off-chain-only. Stated explicitly.
- **Package structure corrected:** one TS package (`@efs/sdk`) + one Solidity library — not two TS packages. Added on-chain (O1–O6) requirements.
- **Stripped the indexer framing:** the SDK does not bundle/build indexing. Reverse-lookup methods (`graph.timeline`, `versions.descendants`, `lenses.discover`) become `NotImplemented` shims (renamed from `OffchainIndexRequired`); removed the `examples/reference-index/` "EFS-in-Postgres" project; D1 reworded; Q3 reframed.
- **Q1 reopened:** the single-repo decision assumed both SDKs were TS. The Solidity library's home (`contracts/` vs `sdk/contracts/`) is now a live fork — PM rec `contracts/`.

This reopened one question (Q1) and did not change Q2–Q5. Doc held at `#status/review`.

**2026-05-28 (entry 5 of 10) — expert review + brainstorm on the reframe (2 agents: Solidity/EAS fidelity, SDK coherence + on-chain ergonomics).** The fidelity agent confirmed the attester thesis is **correct** (an `internal` library inlines into the consuming contract; even a delegatecall-linked library preserves `msg.sender` — only a plain `CALL` to a separate deployed helper breaks it) and the Solidity signatures are sound. Required fixes (folded in):
- **Intra-tx refUID ordering** made explicit (DATA before placement PIN; key-ANCHOR before PROPERTY before binding PIN; ancestors before leaf) — a correctness constraint on the library.
- **`ListConfig` struct defined** (was referenced but undefined).
- **Attester claim sharpened** to "no plain `CALL` to a separate contract," not "no delegatecall."
The coherence agent caught a real straggler — the Implementation-notes section still asserted "Q1 resolved: single `sdk/` repo," contradicting the reopened Q1 (**fixed**) — and flagged the same-date revision-log entries as ambiguous in ordering (**fixed**: entries now numbered + superseded bullets tagged). Ergonomics adds from the brainstorm: **base-first** documented as the happy path (library = escape hatch); **EFS-level events + custom errors** on the `EFSWriter` base (the biggest gap for the DAO/registry audience — EAS events are UID-keyed, not domain-keyed); `unplace`, `fileAt` read-back, and a `pinFiles` batch convenience added. No architecture change; all within-frame. Doc held at `#status/review`.

**2026-05-28 (entry 6 of 10) — on-chain SDK is a first-class *client*, not write-only (James correction).** James corrected a scope error in entry 4/5: I had framed the on-chain library as write-centric with O(1) point reads only, treating lenses + enumeration as off-chain concepts. Wrong. A smart contract is a full client — it reads files **through lenses** (lenses decide *which* attestation is canonical; ADR-0031), reads lists, enumerates the first N children of a folder, and creates files/folders. The only on-chain-specific difference is gas: enumeration is a **bounded window** (`start`/`count`) the caller sizes, not an open iterator. Changes folded in:
- **O4 rewritten** + new **O4b** (folder/file creation on-chain); read-surface signatures now take `address[] lenses` and add `read(path, lenses)`, `listChildren(path, start, count, lenses)`, `readList(...)`; `mkdir(path)` added to the write surface.
- **"Read surface — O(1) only" → "a contract is a first-class reader"**: the old "enumeration/lenses are off-chain-only" paragraph was flat wrong and is replaced; what is genuinely out of scope on-chain is **reverse-lookup**, not forward enumeration (forward reads through the core view contracts).
- **New "Two SDKs, one functional spec (the parity contract)" subsection** addressing James's drift concern (entry-5 era): a shared functional-primitive checklist, owned by the EFS spec not either SDK, so a primitive added to one side isn't silently dropped on the other. No architecture change; scope-of-on-chain corrected. Doc held at `#status/review`.

**2026-05-28 (entry 7 of 10) — multi-team / shared-namespace review (James-requested: "imagine what on-chain contracts need; multiple unrelated teams sharing config like apps on a computer"). 3 agents: integrator persona, Solidity/EAS/gas fidelity, multi-tenant namespace architect.** All three independently raised a "the schemas don't exist in the contracts" alarm — which turned out to be a **false alarm from a stale `main` checkout**: the PIN/TAG/Lists/lenses model lives on the `custom-lists`/`pin-tag-split`/`editions-to-lenses` branches (ADR-0033–0045), not yet merged to `main` (HEAD `94217b5`, ADRs stop at 0032). Verified directly against the branch — the view contracts (`getChildAt`, `getChildrenByAttesterCount`, `containsAttestations`, `isActivePinEdge`) and ADR-0039's `systemLenses[]` default chain are real there. Added a **Reviewer baseline** note so this false alarm isn't re-raised. Genuine multi-team findings folded in:
- **New "Shared-namespace conventions (multiple teams, one filesystem)" subsection** — the biggest gap the review found. Covers: attester-keyed overlays vs. the Unix single-owner mental model (the "you think you're sharing but you're in a private overlay" footgun); recommended `/apps/<reverse-dns>/` namespacing (anchors are permanent, ADR-0030); reading another team's config by lensing their known address (`containsAttestations` for the O(1) check); untrusted-read safety (raw bytes, caller must decode/validate); and the capability-style permission model + its post-v1 limits (no delegation, no "official version" signal).
- **Discovery boundary sharpened** — replaced the blanket "reverse-lookup out of scope" with a table: forward child enumeration **and** known-attester checks *are* on-chain (view contracts); only enumerating the *unknown set* of writers + cross-history + lens discovery need the deferred external index. The earlier framing over-claimed the limitation.
- **Gas note added** to the read surface: `O(count × lenses)`, `MAX_LENSES = 20` (renamed `MAX_EDITIONS`, ADR-0026/0043), keep `count` small, caller owns gas and can revert mid-window.
- **New Q6** (canonical shared config / on-chain blessed-lens registry) added to Open Questions as a **protocol-level, non-blocking** fork — the one finding I can't resolve in the SDK layer; surfaced to James rather than silently omitted. No architecture change. Doc held at `#status/review`.

**2026-05-28 (entry 8 of 10) — James corrected the shared-config framing + closed Q6.** James pointed out that the namespacing guidance was half-wrong: for *shared* config (his example `/swaps/maxSlippage`) apps deliberately use a **common** path and disambiguate by **lens, not by path** — reading the end-user caller's, the DAO/feature-owner's, or their own overlay, as application logic. Namespacing (`/apps/<reverse-dns>/`) is therefore a *human-navigation nicety for private data*, **not** a collision-avoidance mechanism (attester-keying already prevents clobbering). He also confirmed there is **no shared-lens registry today and the SDK is not the layer that would build one** — a registry, if ever built, is a contracts/protocol artifact the SDK would only consume. Changes folded in: rewrote conventions §2 into private-vs-shared patterns; rewrote §3 around the caller/DAO/self lens choice with the `/swaps/maxSlippage` example; rewrote §4 to state plainly that the dev picks the lens and no registry exists. **Q6 closed RESOLVED** (was open) — it is not an SDK question. Status drops to one open fork (Q1). Doc held at `#status/review`.

**2026-05-28 (entry 9 of 10) — "no private tier" reframe + on-chain identity / default-lens decision (web-research-backed).** Two folded together:
- **EFS is always public** (James): dropped the "private data" framing from conventions §2 — there is no private tier (truly private data belongs in your own contract storage, not EFS). Reframed the axis as *single-author vs multi-author at a path*, both fully public; namespacing is attribution/navigation, never privacy or collision-safety.
- **On-chain identity decided** after a 3-agent web-research pass (James-requested) on current 2025–2026 EVM identity. Key findings: `tx.origin` is dead (auth anti-pattern + EIP-7702, live mainnet since Pectra 2025-05-07, broke the "is-EOA" check + it's the bundler under ERC-4337); under both 4337 and 7702 the `msg.sender` a contract sees **is** the user's account address, so EFS's address-keyed lenses are AA-native (EFS never relied on "msg.sender is a human EOA"); reaching *through* a middleman to the true end user is impossible on-chain and the industry answer is explicit `onBehalfOf` + EIP-712 (with ERC-1271 for smart-wallet signers). **Decision folded in** as a new "On-chain identity & the default lens" subsection + ergonomic read verbs: `read(path)` defaults to `address(this)` ("my own files", safe/AA-proof); `readAs(path, who)` for any explicit address; **no `readAsEndUser`** (can't be done safely); never `tx.origin`. Sources: EIP-7702, ERC-4337, EIP-2771, EIP-712, ERC-1271, SWC-115, OpenZeppelin v5 metatx, Aave v3 `onBehalfOf`, EAS delegated-attestation docs, ethereum.org Pectra/7702 guidance. **Cross-cutting flag:** this identity stance is an *EFS-wide* principle (attester semantics, lens resolution, delegated attestation), not SDK-only — surfaced to the PM for a possible contracts-side ADR (see Process feedback / For-James). Doc held at `#status/review`.

**2026-05-28 (entry 10 of 10) — adversarial security review of the identity decision (James-requested), folded in.** A fourth review agent attacked the entry-9 decision with web-verification (ERC-4337 v0.7/0.8 sender semantics, EIP-7702 mainnet behavior, ERC-7579/6900 modular accounts, ERC-7739, ERC-1271 replay). Verdict: **core decision sound** (never-`tx.origin`, explicit cross-identity reads, no `readAsEndUser` all confirmed correct); the *claims around it* were over-precise. Findings folded in:
- **(BLOCKER) EIP-7702 mutable controller.** An EOA's code/controller can change between txs, so an address that attested yesterday may be controlled by different code today. Lenses key on address, which EFS treated as stable identity. Added explicit text: lens trust is trust in an address's *current controller* (can change); prefer immutable-contract lens entries over EOAs for durability; use attestation provenance (timestamp/`refUID`/revocation) as the freshness signal.
- **(SHOULD-FIX) "AA-native" over-claimed.** `msg.sender` is the smart-*account address*, not "the human owner's key" — session keys and ERC-7579/6900 executor modules separate the two. Reworded "AA-native magic" → "address-keyed, AA-compatible"; EFS resolves *which address*, not *who currently controls it*.
- **(SHOULD-FIX) ERC-1271 hardening named.** The EIP-712/ERC-1271 path now explicitly requires ERC-7739 nested-712 rehashing (cross-account replay), `verifyingContract`+`chainId`+contract-tracked `nonce` in the domain, and per-call code-presence re-checks (7702 EOA→contract transition).
- **(SHOULD-FIX) `read(path)` silent-empty footgun.** `address(this)`'s namespace is usually empty; a dev expecting caller-data gets silent nothing. Read verbs now return `(bool exists, bytes32 dataUID)` so missing is distinguishable from present, with a loud doc note that the default is *your own* namespace.
Sources added: ERC-4337 EntryPoint explainer, Trail of Bits "Six mistakes in ERC-4337 smart accounts" (2026), Halborn EIP-7702 security, ERC-7579, ERC-6900, ERC-7739, Alchemy ERC-1271 replay writeup. No architecture change — all claim-sharpening + one return-type fix. Doc held at `#status/review`.
