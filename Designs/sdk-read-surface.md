# SDK read surface — value-first, progressive disclosure

**Status:** review
**Target repos:** sdk, contracts (view-layer additions), client
**Depends on:** [[sdk-architecture]]
**Supersedes:** —
**Reviewers:** 2026-06-19 — feasibility (vs deployed contracts + viem) + adversarial DX, 2 expert subagents. Findings folded into v2.
**Last touched:** 2026-06-19 — sdk-designer

#status/review #kind/design

## Problem

Define the EFS **read** surface for the TypeScript SDK (with the Solidity SDK's read verbs kept in lockstep). Two priorities at once:

1. **Easy + fast defaults** — a hobbyist gets the value they want in one line, no knowledge of EAS/attestations/lenses/pagination/batching.
2. **Expert APIs** — bulk/perf devs control payload, projection, depth, batching, and pagination predictably — *on the same surface*, not a parallel client.

EFS-specific constraints: **keep the trust layer intact** (never silently trust-blind), **abstract EAS but keep raw records reachable**, and **work for both off-chain web clients and on-chain contract clients**.

## Proposal

### Design principles (survey: Stripe, Prisma, Supabase, Drizzle, GraphQL/Relay, Apollo, TanStack, viem, ethers, AWS SDK v3, Octokit, Azure/GCP — sources in Revision log)

1. **Opt-in expansion, not opt-out trimming** (Stripe `expand`, Prisma `include`).
2. **Projection (`fields`) and depth (`expand`) are separate composable knobs** (Prisma `select` vs `include`) — never one mode enum.
3. **Plain serializable results; "lazy" is an explicit re-fetch, never a handle baked into a result** (AWS inert DTOs). *Pure decode* over already-fetched bytes is fine; *network I/O hidden in a result method* is the footgun.
4. **Items-by-default iterator + `.byPage()` + bounded `.toArray({limit})`** (Azure/Stripe); collect-all requires an explicit cap.
5. **Same-tick concurrency is a correctness requirement, not a nicety.** Multicall coalescing only helps reads fired in the same tick → every internal bulk path MUST issue reads via `Promise.all`. (Promoted to a principle per review — the difference between batching working and silently doing nothing.)
6. **One surface; expert control as optional arguments — not a second client** (Stripe per-request options).
7. **Layered `fs` → `eas` → `raw`, each built on the one below; lower tiers tree-shakeable** (AWS/viem).

### The read verbs

| Verb | Returns | Notes |
|---|---|---|
| `read(pathOrRef, opts?)` | `EfsFile` | The file's content. Accepts a path **or** a `DataRef` (folds in the old `fetch(ref)` — avoids colliding with the platform `fetch`). `EfsFile` has `bytes` + **pure** `.text()`/`.json()` (no I/O) + `verification` + `hashAuthor`. |
| `readText` / `readBytes` / `readJson(path, opts?)` | `string` / `Uint8Array` / `T` | Hobbyist sugar → the bare value. **Fail-closed:** throw `ContentHashMismatch` on a verification mismatch by default (`{verify:false}` to opt out). The bare-value path has nowhere to surface a status, so it must throw — this is how the one-liner stays trust-safe. |
| `locate(path, opts?)` | `ReadResult \| null` | The pointer: which DATA/version + winning attester, no bytes. Renamed from `resolve` (which collided with `Promise.resolve` and with the low-level `resolvePath`→`Hex`). `null` when absent. |
| `info(path, opts?)` | `FileInfo` | Standard metadata bundle (+ `fields`/`expand`). Always returns; absence via `exists`. Replaces `stat`/`FileStat` (one name everywhere). |
| `getProperties(path, names[], opts?)` | `Record<string,string>` | Stringly-typed long-tail projection. *Not* interchangeable with `info({fields})` (which gives typed fields) — documented sibling, not alias. |
| `exists(path, opts?)` | `boolean` | Cheap probe. Never throws except on network error. |
| `list(dir, opts?)` | `EfsList<DirEntry>` | Async-iterable (items by default) + `.byPage({limit,cursor})` + `.toArray({limit})`. |

**Cardinality rule (one stated convention, per review):** point reads that can be legitimately absent return `T | null` (`locate`); `read`/`readText` **throw `NotFound`** (you asked for bytes that aren't there); `info` always returns with `exists`; `getProperties` omits absent keys. `exists()` is the cheap pre-check. An empty lens resolution is **normal → `null`/`exists:false`, never an error.**

**Cross-SDK naming:** TS verbs and Solidity verbs match where the medium allows. **Enumerated exception:** the on-chain view *function* is `getFileInfo(anchor, lenses)` (view-contract get-convention) while the TS verb is `info` — documented here, not a silent footnote. `getProperties` is identical on both. On-chain `read`-for-bytes only works for content stored on-chain (`web3://`/`data:`).

### Value-first results + provenance (always on, non-projectable)

Every read result is a **plain, serializable DTO** carrying lightweight provenance — the value path is never trust-blind, and **provenance is NOT projectable** (`fields` narrows only the content/property payload, never the trust envelope):

```ts
type FileInfo = {
  exists: boolean
  contentType?: string
  size?: bigint                // NB: bigint isn't JSON-native — see open Qs (serializer vs string)
  name?: string
  properties?: Record<string,string>   // custom keys requested via `fields` land here (not typed slots)
  ref?: DataRef
  // provenance — ALWAYS present, never projected away:
  resolvedBy: Address
  verified: VerificationStatus // matches-author | no-claim | malformed-claim | mismatch | revoked | unchecked
  sourceUIDs: { placement?: Hex; contentType?: Hex; size?: Hex; /* per field */ }
  // present ONLY when expand: ['attestations'] was requested (plain data, serializable):
  attestations?: { placement?: Attestation; contentType?: Attestation; /* … */ }
}
```

### Two orthogonal knobs

```ts
type ReadOpts = {
  lens?: Lens | Address
  fields?: string[]                 // PROJECTION — which properties (reserved → typed slots; custom → .properties bag)
  expand?: ExpandToken[]            // DEPTH — opt into raw records / nested resolved data
  verify?: boolean                  // default true; fail-closed on the value-sugar path
}
type ExpandToken = 'attestations' | 'mirrors' | 'redirects' | 'attestations.schema'  // fixed typed union, max depth 2
```

- **`fields`** — reserved keys (`contentType`/`size`/`name`) populate typed slots; **custom keys land in `properties: Record<string,string>`**; if a custom PROPERTY collides with a reserved name, the **reserved/structured meaning wins** (documented precedence).
- **`expand`** — a **fixed, typed union** (not free strings), **max depth 2** (tighter than Stripe's 4 because each level is a multicall round-trip, not a DB join); inlines raw records as plain data.
- **`list` + `expand`/`fields`:** allowed, but each page's expansions are **one coalesced multicall**, and `toArray({limit})`'s mandatory cap bounds the fan-out. (Prevents the O(N) RPC blow-up Stripe warns about for list+expand.)

### Type narrowing (review P1-5 — decision pending)

Citing Prisma `select`/`include` sets an expectation of **return-type narrowing**. Two options:
- **(rec) Narrow on `expand` only:** `info<E extends ExpandToken[]>(path, {expand?:E}): FileInfo & (… 'attestations' ∈ E ? {attestations: …} : {})` so `expand:['attestations']` makes `attestations` non-optional. `fields` stays runtime projection over a wide type (full Prisma-style field narrowing is heavy TS for modest gain here).
- **Honest wide type:** drop the Prisma framing, document "runtime projection, static wide type." Less DX, simpler types.

### Trust escalation without breaking serialization

- **Inline (request-time):** `expand: ['attestations']` → records are plain data on the DTO.
- **Batched hydrate (after the fact):** `efs.eas.attestationsFor(items)` → one multicall of `eas.getAttestation(uid)` over many items (verified buildable; `allowFailure:true` so a revoked/absent UID degrades per-item as `{error,status:'failure'}`).
- No result object performs network I/O on access. **Exception (documented):** the `EfsList` iterator from `list()` deliberately holds a live client (like AWS/Azure paginators); the *items it yields* are inert. Only materialized `.toArray()`/`.byPage().items` serialize.

```ts
// hobbyist
const text = await efs.fs.readText('/notes.md')           // → string (throws on hash mismatch)
const m    = await efs.fs.info('/photo.png')              // value + provenance, batched
for await (const e of efs.fs.list('/album')) { … }        // items; paging hidden; coalesced

// expert
await efs.fs.info('/photo.png', { fields: ['contentType','license'] })
const m = await efs.fs.info('/photo.png', { expand: ['attestations'] })
const page = await efs.fs.list('/album').byPage({ limit: 100, cursor })
const all  = await efs.fs.list('/album').toArray({ limit: 1000 })   // cap REQUIRED
const proofs = await efs.eas.attestationsFor(page.items)            // one multicall
```

### Error model (mapped to the typed tree, per review)

| Situation | `read`/`readText` | `locate`/`info`/`exists` |
|---|---|---|
| path/bytes absent | throw `NotFound` | `locate`→`null`; `info`→`exists:false`; `exists`→`false` |
| winning attestation revoked | throw `Revoked` (distinct from absent) | surfaced as `verified:'revoked'` |
| lens resolves nothing | `NotFound` | `null`/`exists:false` (normal, not an error) |
| malformed contentHash claim | `verified:'malformed-claim'` on `EfsFile`; sugar throws `MalformedClaim` | `verified:'malformed-claim'` |
| hash mismatch | `verified:'mismatch'` on `EfsFile`; sugar throws `ContentHashMismatch` | `verified:'mismatch'` |
| network/RPC | `NetworkError` (never conflated with absent) | `NetworkError` |

New codes to add to the tree: `NotFound`, `Revoked`, `ContentHashMismatch`, `MalformedClaim`.

### Pagination

`EfsList<DirEntry>`: async-iterable (items, paging internal) + `.byPage({limit,cursor}) → { items, cursor? }` (opaque cursor, ADR-0036) + `.toArray({limit})` (mandatory cap). Open: **partial-failure within a page** (throw whole page vs return items + per-item errors — lean: per-item status like AWS) and **ordering stability** across a mid-pagination view redeploy (cursor is an encoded kernel index → stable; state it).

### Batching (viem specifics, corrected)

The SDK-constructed public client sets `batch: { multicall: true }` (viem default is **OFF**; `batchSize` is **1024 bytes** of calldata, `wait` **0ms** = flush at end of microtask). Concurrent `readContract`s coalesce into one Multicall3 `aggregate3`; needs HTTP transport + a `multicall3` address on the chain (present for Sepolia/mainnet). The `multicall()` result discriminant is `status: 'success' | 'failure'` (field `result`/`error`). **Caveat:** only applies to the SDK-constructed client — when the dev passes their own `publicClient`, batching is their responsibility (document it). And per principle 5, internal bulk paths must `Promise.all` or coalescing is moot.

### Tiering

`efs.fs.*` (curated) → `efs.eas.*` (raw EAS + `attestationsFor` hydrate) → `efs.raw` (contract/RPC escape hatch). `fs` built on `eas` built on `raw` (no parallel reimplementations); `eas`/`raw` tree-shakeable so a hobbyist bundle ships only `fs`.

### Contracts view-layer additions (non-frozen — ADR-0030 lists EFSFileView as redeployable)

Round-trip reducers (not correctness prerequisites — every verb is backable today via `getFilesAtPath` + `getActivePinSlot`/`getActivePinTarget` + `getAttestation`), and they serve on-chain clients in one call:
- `getFileInfo(bytes32 anchorUID, address[] lenses) → (bool exists, bytes32 dataUID, address resolvedBy, bytes32 placementPinUID, string contentType, uint256 size, bytes32 contentTypeUID, bytes32 sizeUID, bytes32 contentHashUID)` — values **+ per-field source UIDs** (incl. `placementPinUID`, available today via `getActivePinSlot`).
- `getProperties(bytes32 dataUID, string[] names, address attester) → (string[] values, bytes32[] uids)` — values **+ parallel UIDs** so projected fields keep provenance.
- Bundle returns **values + UIDs, not raw structs** — `expand:['attestations']` hydrates via the same `attestationsFor` multicall (keeps the default lean; verified the better tradeoff).
- SDK fetch path must use lens-scoped **`getDataMirrorsByAttester`** (added in ADR-0056's lens-scoping fix), not the unscoped `getDataMirrors`.

## Open questions

- [x] **Type narrowing** (P1-5) → **narrow on `expand` only** (James, 2026-06-19). `expand:['attestations']` makes `.attestations` non-optional via generics; `fields` stays runtime projection over a wide type (full Prisma field-narrowing not worth the TS machinery).
- [x] **`size` serialization** → **keep `bigint`** (James, 2026-06-19) — matches viem / ethers v6 / web3.js v4 (all native `bigint` in the API surface; strings only at the JSON-RPC/serialization boundary). Document the bigint serializer for JSON/TanStack-persist boundaries. No `Date` objects in DTOs (epoch number) for query-key stability.
- [x] **`locate` + `read(pathOrRef)` overload** → **confirmed** (James, 2026-06-19). `locate` (not `resolve`); one `read` verb accepting a path or a `DataRef`.
- [x] **Cross-doc reconciliation** → done: `sdk-architecture.md` updated (`read`→`EfsFile`+sugar, `info`, `locate`, `exists`, `.byPage()`/`.toArray()`, `FileInfo`) with a pointer marking this doc authoritative.
- [ ] **`list` partial-failure** shape (throw page vs per-item status) — leaning per-item status (AWS posture); finalize during build.

## Pre-promotion checklist

- [ ] Open questions resolved or explicitly deferred
- [ ] `**Target repos:**` confirmed (sdk, contracts, client)
- [x] Verified buildable against deployed contracts + viem (feasibility subagent)
- [x] Adversarial DX review folded in
- [ ] sdk-architecture.md reconciled (no contradictory verb signatures)
- [ ] One human round of `#status/review`

## Implementation notes

```
- [ ] sdk#NNN — rename cat→read (accept path|ref), stat→info, resolve→locate; add readText/Bytes/Json (+fail-closed verify), exists
- [ ] sdk#NNN — plain-DTO results + always-on non-projectable provenance (keep the propertyUID readReservedProperty already fetches); fields + expand (typed union, depth 2)
- [ ] sdk#NNN — list: items-by-default + .byPage() + .toArray({limit}); add batch:{multicall:true} to SDK-constructed client; Promise.all bulk paths
- [ ] sdk#NNN — efs.eas.attestationsFor (multicall hydrate); switch fetch to getDataMirrorsByAttester
- [ ] sdk#NNN — error tree: add NotFound/Revoked/ContentHashMismatch/MalformedClaim + the per-verb matrix
- [ ] sdk#NNN — reconcile sdk-architecture.md verb signatures
- [ ] contracts#NNN — view-layer getFileInfo + getProperties(names[]) returning values+UIDs (non-frozen)
```

## Revision log

- 2026-06-19 v2 — sdk-designer — folded two expert passes. Feasibility: BUILDABLE as written; corrections — viem `batch.multicall` is opt-in (not default), `batchSize` is 1024 *bytes*, failure discriminant `status:'failure'`; tighten view sigs to return source UIDs incl. `placementPinUID`; `ListReader.sol` (not `EFSListReader`); use `getDataMirrorsByAttester`. DX (P1s): `read().text()` must be pure-decode (reconcile vs architecture doc's network `read.text`); rename `fetch(ref)`→`read(pathOrRef)` overload and `resolve`→`locate` (platform-name collisions); `info`/`getFileInfo` cross-SDK exception documented; verification must be fail-closed on the value-sugar (one-liner was trust-blind); provenance non-projectable; cardinality rule stated; error matrix added; `expand` a typed union w/ depth-2 cap; type-narrowing flagged as the one real open decision.
- 2026-06-19 v1 — initial draft; key reversal from chat: dropped `attestations: none|lazy|eager` enum + lazy `.attestations()` method (serialization + axis-conflation) for plain DTOs + `expand`/`fields` + batched `attestationsFor`.
- Sources: Stripe (expand, auto-pagination), Prisma (select/include, satisfies/GetPayload narrowing), Supabase (single/maybeSingle), Drizzle (columns/with), Relay (fragments/masking), Apollo (fetchPolicy), TanStack (staleTime/defaults), viem (multicall/batch — verified), ethers (batching), AWS SDK v3 (commands/paginators/DTOs), Octokit (paginate), Azure (byPage), GCP (autoPaginate).
