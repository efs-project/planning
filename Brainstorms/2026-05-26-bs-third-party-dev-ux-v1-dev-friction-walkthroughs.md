---
agent: bs-third-party-dev-ux-v1
date: 2026-05-26
status: raw
anchors:
  - area: sdk
  - area: contracts
  - brainstorm: 2026-05-26-bs-divergent-usecases-v1
  - brainstorm: 2026-05-26-bs-os-sdk-capability-surface-v1
---

# Third-party dev UX — friction walkthroughs

A worked-example pass at what it *feels like* to be a third-party developer building on EFS without prior context. The dev is some combination of: a TypeScript jockey with Ethers/Viem fluency, a half-day of patience for SDK quirks, and an empty `npm init` project. They've read the EFS landing page, they understand "files on Ethereum, attestations under the hood," and that's it. They have not read `specs/`, they have not read any ADR, and they will not be sandboxed in the EFS OS — these are standalone tools talking to mainnet/devnet from Node or a regular browser SPA. Where the OS SDK is the right lens (an app shipped *into* the Client/Shell) I'll call it out, but the default audience here is the non-sandboxed integrator. The hypothetical SDK is `@efs/sdk` — I'm imagining a single client-side package that wraps EAS plus EFS-specific conventions.

## App 1: Recipe Forker (`fork.cooking`)

**Description.** A web SPA where home cooks browse, fork, and remix recipes. Every recipe is a markdown DATA placed under a topical Anchor like `/recipes/italian/pasta/carbonara`. Forks set a `previousVersion` PROPERTY pointing at the parent DATA UID, producing a version DAG. Users see "Mom's lineage," diff two forks, save personal cookbooks as Lists. Read-heavy with bursty writes when a user saves a fork. Lens used: standalone tool, browser-side SDK + connected MetaMask.

**Primary operations.**
1. Browse recipes at `/recipes/italian/pasta/carbonara` and render the canonical edition.
2. Read all forks of a given recipe (forward and reverse walk of `previousVersion`).
3. Save a forked recipe under the user's own lens at the same path.
4. Add the forked recipe to a personal cookbook List.
5. Subscribe to one curator's lens (Marcella Hazan estate, say).

**Walkthrough.**

```ts
// Day 1, hour 1. README says: "EFS is a filesystem on Ethereum."
import { EFS } from "@efs/sdk";

const efs = new EFS({ rpc: "https://...", chainId: 11155111 });

// "Read the canonical carbonara." Easy, right?
const file = await efs.read("/recipes/italian/pasta/carbonara");
// → returns what? Bytes? A DATA UID? A "file" object?
// SDK doc says: Promise<Uint8Array>. OK.
const md = new TextDecoder().decode(file);
// But wait — whose edition? The dev didn't pass anything about lenses.
// README mentions "lenses" once. Buried link to ADR-0031. Closes tab.
// SDK silently used the EFS deployer address as the default lens.
// Dev ships this and a week later a user complains: "why am I seeing
// the deployer's carbonara, not the popular one?"

// Operation 2: walk forks. The DAG lives in `previousVersion` PROPERTYs.
// SDK has efs.read but no efs.properties. Dev greps the docs.
// Finds efs.attestations.query — typed for raw EAS shape.
const dataUID = await efs.resolveToData("/recipes/italian/pasta/carbonara");
const props = await efs.attestations.query({
  schema: "PROPERTY",
  refUID: dataUID,
});
const prev = props.find(p => p.decoded.key === "previousVersion")?.decoded.value;
// The dev is now hand-decoding EAS attestations from JSON.
// `decoded` is `any`. There's no typed PROPERTY helper.

// Walk backward N times. Loop. No depth limit warning.
// Forward walk (find children that point at THIS dataUID) is much worse:
// nothing in the SDK indexes "PROPERTY by value." Dev opens a GitHub issue
// titled "How do I find all forks of a recipe?"
// Maintainer reply: "subscribe to the EFSIndexer event stream and build
// a derived index off-chain." Dev cries.

// Operation 3: save a fork. The dev has new markdown bytes + parent DATA UID.
// SDK has efs.write(path, bytes). Tries it:
await efs.write("/recipes/italian/pasta/carbonara", newBytes);
// MetaMask pops up *eight times* (DATA, MIRROR onchain, PROPERTY contentType,
// PROPERTY previousVersion?? — wait, did write set that? No. TAG, ANCHOR, etc.)
// Dev didn't realize this was an 8-tx atomic upload pattern. Each prompt
// shows a raw EAS attestation calldata blob. User aborts on prompt 4.
// Dev re-reads docs. Finds `efs.write` actually supports `{ properties: {} }`
// to bundle previousVersion. Also finds it supports multiAttest batching —
// but only if the user's wallet supports it (MetaMask doesn't natively).
// Falls back to manual sequencing. Gas cost on Sepolia: $0.04. On mainnet,
// projected: $30. Dev considers off-chain mirror only.

// Operation 4: add to personal cookbook List.
// Docs page on Lists is "coming soon." Schema in spec but no SDK surface.
// Dev hand-rolls a TAG attestation with a `/lists/my-cookbook/` Anchor.
// Has to first attest the `/lists/my-cookbook/` Anchor. Two-step pattern.
// Trips on validation: anchor name validation rejects spaces (ADR-0025
// the dev hasn't read).

// Operation 5: subscribe to a curator's lens.
// "Lens" is just a URL query param at the router level. The SDK exposes
// `efs.setLenses([address])` — but it's a *client-side* preference, the
// SDK passes it on every call. Dev assumed it was on-chain state. Wastes
// 90 min trying to find the "follow lens" transaction. There is none.
```

**Friction points.**
- The "what's a lens?" gap. Without an opinionated default, the dev silently uses the deployer lens and confuses users. Without explicit doc, the dev assumes lenses are followable on-chain (they are not). The mental model of "viewer sovereignty via URL param, propagated through the SDK" is *not obvious*.
- `efs.write` is an 8-tx submarine. The dev's first wallet prompt experience is "MetaMask wants to sign 8 things in a row." Even with `multiAttest`, MetaMask UI shows opaque calldata. The SDK has no story for explaining the bundle in human terms.
- PROPERTY is untyped at the SDK layer. `previousVersion` is just a string-typed key the dev has to know about. Discoverability of "well-known property keys" is poor.
- Reverse-traversal of PROPERTY-value DAGs is unsupported at the SDK level. The "show me all forks of this recipe" feature, central to the app, requires either an off-chain indexer or accepting that it doesn't work.
- Lists schema is half-shipped. Dev hand-rolls TAG plumbing because the high-level surface isn't there. Once Lists lands, the dev's code will break.
- Anchor name validation (no spaces, length cap, etc.) trips the dev silently when they pass user input through.

**Raw EAS temptation.** Strong. Once the dev has had to drop to `efs.attestations.query` once, they tend to stay there because it's the only way to get exactly what they want. The dev would rather speak EAS fluently than learn EFS's path-shaped abstractions piecemeal.

**APIs they'd wish for.**
```ts
efs.properties.get(dataUID, "previousVersion"): Promise<string | undefined>
efs.properties.set(dataUID, "previousVersion", prevUID): Promise<TxReceipt>
efs.versions.ancestors(dataUID): AsyncIterable<DATA>
efs.versions.descendants(dataUID): AsyncIterable<DATA> // requires off-chain index
efs.write(path, bytes, { previousVersion, contentType, mirrors, properties })
  : Promise<{ dataUID, txHashes, totalGas, prompt: 'single' | 'batched' }>
efs.lenses.list(): string[]   // currently active
efs.lenses.add(addr): void    // pure client-side; doc clearly that this is local
efs.lenses.discover(opts): Promise<{ lens: string, label: string, attestationCount }[]>
efs.lists.create(name): Promise<List>
efs.lists.add(list, dataUID): Promise<TagReceipt>
```

## App 2: Sports Stats Nerd (`boxscore.live`)

**Description.** A read-heavy tabular UI over the MLB box-score corpus. Per-game stats are DATAs with deep PROPERTY metadata; the UI is leaderboards, career splits, season filters. The data set is large (~250k games × 30 stats), so the dev's choices about indexing and pagination dominate. Lens: standalone Next.js app with server-side rendering; talks to chain through a server-side `@efs/sdk` instance with a private RPC.

**Primary operations.**
1. List all games in `/mlb/2025/boston/`.
2. Render a single box score (one DATA + ~30 PROPERTYs + roster TAGs).
3. Compute "season leaders in OPS" — aggregation across thousands of DATAs.
4. Filter "career home runs for player X across all seasons."
5. Page through the firehose of new game DATAs as they're attested in-season.

**Walkthrough.**

```ts
// Server-side Next.js route. Dev expects this to feel like Prisma.
import { EFS } from "@efs/sdk";
const efs = new EFS({ rpc: process.env.RPC, lens: "elias.stats.eth" });

// Operation 1: list a folder. Documented as efs.list.
const games = await efs.list("/mlb/2025/boston");
// → DirEntry[]: name, anchorUID, type ("file"|"folder"), tagger
// No pagination by default. Dev didn't realize this could return 162 entries.
// For some folders (a 30-year team archive) it could be 4900+ entries.
// Doc footnote: "use { limit, cursor } for large folders." Cursor opaque blob.
// Dev wraps it in a hand-rolled async iterator. Works fine.

// Operation 2: render a single box score.
const data = await efs.read("/mlb/2025/boston/2025-04-12-vs-nyy");
// Returns Uint8Array. Dev was expecting JSON. Re-reads docs.
// contentType is "application/json" — the SDK doesn't auto-decode.
// efs.read returns raw bytes. There's an efs.readJSON helper, hidden under
// "convenience methods." Dev finds it after 20 minutes.
const stats = await efs.readJSON("/mlb/2025/boston/2025-04-12-vs-nyy");
// stats is `any`. No schema validation. JSON shape is set by the
// attester (Elias). Dev writes a Zod schema by hand for the box-score shape.
// This Zod schema is now coupled to whatever Elias decides to publish.
// If Elias changes the JSON shape next season, dev's app silently breaks.

// PROPERTY-style metadata: SDK has it, but only as raw KV.
const props = await efs.properties.list(stats.dataUID);
// → [{ key: "homeWP", value: ".237" }, { key: "wxr", value: "..." }, ...]
// All values are strings. Numeric parsing is the dev's problem.

// Operation 3: season leaders in OPS. The killer query.
// Dev tries the obvious:
const allGames = await efs.list("/mlb/2025", { recursive: true });
// → throws QueryTooLargeError, or worse, returns a 60-second-stall promise.
// SDK has no aggregation primitive. Sort overlay is a thing the spec mentions,
// but the SDK surface for "give me the top N by PROPERTY value" is missing.
// Dev opens GitHub issue: "How do I do leaderboards?"
// Maintainer reply: "Use SORT_INFO. There's a draft helper at efs.sort.* ..."
// Dev finds `efs.sort.attach(parent, sortFunc, targetSchema)` — but sortFunc
// is an *address* of an on-chain ISortFunc comparator contract. Dev now has
// to write Solidity to compute leaderboards. Cries.
// Realistic outcome: dev gives up on on-chain aggregation, runs their own
// off-chain indexer that watches EFSIndexer events and maintains a Postgres
// table of PROPERTYs. The SDK becomes the write-side only.

// Operation 4: career home runs for player X.
// Same problem — no PROPERTY-value query. Dev's off-chain indexer handles it.

// Operation 5: subscribe to new games as they're attested.
// efs.watch("/mlb/2025/boston") — documented as "AsyncIterable of FsChangeEvent".
for await (const ev of efs.watch("/mlb/2025/boston")) { ... }
// What does ev contain? Dev has to TS-inspect; type is a union of seven
// shapes (anchorAdded, tagAdded, tagRemoved, propertyChanged, dataAttested,
// mirrorAdded, mirrorRevoked). Documentation: "see types." Each variant
// has different fields. Dev writes a giant switch.
// Worse: the watch is a WebSocket to the dev's own RPC node — and most
// hosted RPC providers don't support eth_subscribe past a per-connection
// limit. Dev hits Infura's cap at 100 concurrent subscriptions.
```

**Friction points.**
- `efs.list` lacks an obvious default for "this folder might be huge." First-call experience must either auto-paginate or warn loudly.
- `efs.read` returning `Uint8Array` is technically right but punishes the common case (JSON, text). The split between `read` and `readJSON` is invisible until you trip on it.
- No schema validation for DATA payloads. The dev is at the mercy of the attester's JSON shape. Lens curation is the *answer* but there's no story for "this lens guarantees this JSON schema."
- Aggregation queries are the dev's responsibility 100%. SORT_INFO is too low-level for a TS dev — writing Solidity comparators is a different skill stack.
- `efs.watch` exposes a fat union type and chain-subscribe limits that the dev only discovers in production. The SDK should abstract "fall back to polling when subscribe is denied."
- Off-chain derived indexing is *implied* but not packaged. Every serious dev will build the same Postgres mirror. This should ship.

**Raw EAS temptation.** Moderate. The dev mostly stays in the SDK because the path-shaped reads (`efs.list`, `efs.read`) genuinely match the box-score mental model. But for aggregation, the dev abandons EFS abstractions entirely and treats the chain as a stream-of-attestations event source.

**APIs they'd wish for.**
```ts
efs.list(path, { limit?, cursor?, sortInfoUID?, schema? }): AsyncIterable<DirEntry>
  // make iteration the default, not array-return
efs.read.json<T>(path, schema?: ZodSchema<T>): Promise<T>
efs.read.text(path): Promise<string>
efs.read.bytes(path): Promise<Uint8Array>
efs.properties.query({ key, valuePredicate, refUID? }): Promise<...>
  // off-chain-indexed; document the trust boundary
efs.aggregate.topN({ path, by: PROPERTY_KEY, n: 10, ascending? }): Promise<...>
efs.indexer.ensureLocal({ subscribeFrom: blockNumber }): IndexerHandle
  // packaged "spin up a local Postgres mirror" pattern
efs.watch(path, { events?: ('tag' | 'data')[] }): AsyncIterable<FsChangeEvent>
  // narrowable type by event filter
```

## App 3: Citizen-Science Birding (`flock.observer`) — headless ingest

**Description.** A native iOS/Android app posts birding observations as it's used in the field; a headless Node service receives observations from the mobile client (which doesn't itself sign txs) and writes them to EFS in batches. High write volume — a single user might log 200 observations in a morning; a popular county feed might see 10k/day across users. The headless service holds a hot wallet for batched signing. Lens: pure server-side standalone tool; no Client/OS at all.

**Primary operations.**
1. Accept observation from mobile (species, time, geo, optional media URL); write as attestation under `/birding/observations/2026/05/27/<observer>/`.
2. Batch 50 observations into a single tx to amortize gas.
3. Attach photo MIRROR pointing at the dev's own S3 bucket plus an IPFS mirror.
4. Re-resolve a species name (the user typed "Am Robin") to the canonical `/species/turdus-migratorius/` Anchor UID.
5. Aggregate a daily county checklist as a List.

**Walkthrough.**

```ts
// Server: Node 20, Express, a hot wallet, the @efs/sdk.
import { EFS } from "@efs/sdk";
const efs = new EFS({ rpc, signer: new ethers.Wallet(process.env.HOT_KEY) });

// Operation 1 + 2 fused: batch insert observations.
// Naive first cut:
for (const obs of pendingObservations) {
  await efs.write(pathFor(obs), JSON.stringify(obs));
}
// 200 sequential writes = 200 × 8 attestations = 1600 attestations.
// At 50ms RPC latency each: 80 seconds for one user's morning batch.
// At ~80k gas per attestation × 1600 × 50 gwei: ~$300 / morning. NOPE.

// Dev finds efs.batch(). Docs say: "atomic bundle via EAS multiAttest."
const tx = await efs.batch(builder => {
  for (const obs of pendingObservations) {
    builder.write(pathFor(obs), JSON.stringify(obs));
  }
});
// → Throws: "batch exceeds MAX_BUNDLE_SIZE (96 attestations)." Wait, what?
// Dev reads source: EAS multiAttest has practical limits, and EFS adds
// its own (anchor depth, qualifying-folder propagation cost). Each write
// is still 5–8 atts. So the dev's 50-obs batch is 250–400 atts, way over.
// Dev re-implements as: chunk(observations, 10) → batch per chunk.
// Now: 5 batches × ~1 tx each = 5 txs / 50 obs = 100 ms/obs. Tolerable.
// But: gas now $0.10 per observation × 200/morning × 1k users = $20k/day.
// Dev moves to an L2. SDK config: change `rpc` and `chainId`. Hope schemas
// are deployed there. They are not. Dev opens issue.

// Operation 3: photo MIRRORs.
// efs.write supports { mirrors: [{ transport, uri }] }. Easy?
await efs.write(path, json, {
  mirrors: [
    { transport: "https", uri: "https://birding-cdn.../photo.jpg" },
    { transport: "ipfs", uri: "ipfs://Qm..." },
  ],
});
// But — wait — these are mirrors for the *observation JSON*, not the *photo*.
// The dev wants a separate DATA for the photo bytes, with multiple MIRRORs
// to that photo DATA. The flat `mirrors:` field is misleading.
// Dev rereads spec. Realizes they need to:
//   1. Attest a separate DATA for the photo (with photo's contentHash).
//   2. Attest MIRRORs pointing to that photo DATA.
//   3. Put the photo's DATA UID into the observation JSON as `photoUID`.
//   4. Attest the observation DATA with the JSON.
// This is now ~4 more attestations per observation with media. Gas doubles.

// Operation 4: resolve "Am Robin" → species anchor UID.
// SDK has efs.resolve(path). Dev wants alias/lookup. Not in SDK.
// The dev's app needs a local SQLite table of common name → anchor UID.
// They build it once by walking `/species/` and reading the `commonNames`
// PROPERTY on each species anchor. 18k species → ~18k reads → batched.

// Operation 5: daily checklist as a List.
// Lists schema in progress. Dev uses TAG-as-list pattern.
// Each observation in today's checklist gets a TAG against
// /lists/county/middlesex/2026-05-27. Works, but exposing this through a
// "List" abstraction is left to the dev.
```

**Friction points.**
- Batch sizing is opaque. `MAX_BUNDLE_SIZE` shows up only as a runtime error, with no compile-time hint. The dev can't estimate batch capacity without trial-and-error.
- "Write a file with attached media" is a *multi-DATA* operation but `efs.write({ mirrors })` makes it look like a single-DATA op. The naming punishes the natural mental model.
- Gas economics for high-frequency use cases bite immediately. SDK does not surface "you're about to spend $X/day at this rate." A `efs.estimateMonthly({ writes/day })` would be life-saving.
- L2 story is non-existent at this snapshot. The dev hits a wall trying to move to a cheaper chain.
- Alias/lookup tables (common name → species anchor) are 100% the dev's problem. A standard pattern + helper would prevent every app from rebuilding this.
- Lists are still vapor; serious devs hand-roll, then will rework when Lists ships.
- Hot-wallet operation with the EFS deployer's burner pattern is awkward — the SDK assumes browser-side MetaMask in too many places; the Node/server signer path is underdocumented.

**Raw EAS temptation.** Very strong on the write path. The dev would rather drop to `eas.multiAttest(...)` with hand-coded EFS-shaped attestations than fight the SDK's well-meaning bundle abstractions. The dev only needs the SDK for read-side resolution.

**APIs they'd wish for.**
```ts
efs.batch.write(observations: WriteSpec[], opts?: {
  maxAttestationsPerTx?: number,   // dev controls chunking
  onProgress?(done, total): void,
}): Promise<BatchReceipt>
efs.batch.estimate(specs: WriteSpec[]): {
  attestationCount, txCount, estimatedGas, estimatedUSD
}
efs.media.write(bytes, contentType, mirrors[]): Promise<{ dataUID, mirrorUIDs }>
  // explicitly the "make a DATA + mirrors" primitive separate from "place at path"
efs.media.attach(parentDataUID, mediaDataUID, key: string): Promise<void>
  // semantic: this DATA has this child media
efs.alias.register({ table: "species.common", key: "Am Robin", anchor: "0x..." })
efs.alias.lookup("species.common", "Am Robin"): Promise<string | undefined>
efs.chain.list(): { chainId, rpc, schemasDeployed: boolean }[]
  // make multi-chain support legible
```

## App 4: Museum Provenance Researcher (`provenance.scholar`)

**Description.** A heavy-read SPA for art-history scholars. Each museum object is an Anchor; ownership transfers, exhibitions, condition reports, and scientific analyses are TAGs and DATAs attached over time by different attesters (museums, auction houses, scholars, source-country agencies). The UI is a provenance timeline: who claimed what about this object, when. The point is *making disagreement legible*, not collapsing it. Lens: standalone web SPA + connected wallet for the scholars who add their own attestations.

**Primary operations.**
1. Load all attestations attached to one object Anchor, across all attesters, time-ordered.
2. Render the timeline grouped by attester with diff highlighting on conflicting PROPERTYs.
3. Add a new scholarly note (PROPERTY) under the logged-in scholar's lens.
4. Compute "objects in dispute" — Anchors where two or more reputable lenses disagree on a key PROPERTY value.
5. Export a citation-grade snapshot (URL + content hashes + block number) for a published paper.

**Walkthrough.**

```ts
import { EFS } from "@efs/sdk";
const efs = new EFS({ rpc, lens: [] }); // dev wants the firehose; no lens
// Wait — SDK requires at least one lens? Reading docs.
// "Empty lens list defaults to EFS deployer." But dev wants *all* attesters.
// There's no "show me everything from everyone." The whole system is built
// on viewer sovereignty; the deployer's view is just one. Dev gets confused
// about the difference between "no lens" (defaults to deployer) vs
// "every lens" (which isn't a thing — you'd enumerate attesters somehow).

// Operation 1: all attestations on this object.
const anchorUID = await efs.resolve("/museum/objects/the-night-watch");
const all = await efs.attestations.query({
  anyRefUID: [anchorUID, /* and every DATA UID descended from it */],
});
// efs.attestations.query takes filters but doesn't let you say "anything
// touching this anchor's subtree." Dev has to:
//   1. List children Anchors of the anchorUID.
//   2. For each child, query attestations targeting it.
//   3. Recurse.
// Tens of round-trips. Caching isn't documented. Dev caches by hand.

// Operation 2: time-ordered iteration grouped by attester.
// efs.attestations.query returns Attestation[] sorted by... block number?
// Time? Insertion? Doc is unclear. Dev `console.log(arr[0].time)` to find out.
// Looks like seconds since epoch; non-strict (multiple atts can share time).
// Stable-sort by (time, uid) themselves.

// "Conflicting PROPERTYs" — for a given (key, refUID) pair, multiple
// attesters may set different values. SDK has:
const props = await efs.properties.list(dataUID);
// → Returns *only the active edition's PROPERTY*. Edition-scoped lookup
// (ADR-0014). Dev wanted ALL PROPERTYs from ALL attesters. Has to drop
// to raw attestations.query and dedup by (attester, key).
// This is the central feature of the app and the SDK obstructs it.

// Operation 3: add scholarly note.
await efs.properties.set(dataUID, "scholar-note-2026", "Likely overcleaned...");
// Works. One tx. Fine.

// Operation 4: "objects in dispute."
// Requires PROPERTY-by-value comparison across attesters across objects.
// SDK has no aggregation primitive. Dev builds local index again.
// (At this point the dev realizes every nontrivial EFS app ships with
// a Postgres mirror of the chain. Considers consulting opportunity:
// "Postgres-backed EFS query layer as a service.")

// Operation 5: citation snapshot.
// Dev wants: a permanent URL the journal can cite that resolves to the
// exact bytes/properties as of block N.
// efs.snapshot({ anchor, asOf: blockNumber }) → not in SDK.
// Dev writes a manual: "the canonical citation URL is
// web3://{router}/{path}?lenses=...&block={N}". But the router doesn't
// actually support a block query param (it resolves to head). Dev opens
// long GitHub thread proposing it. Maintainer: "interesting, would need
// historical state, costly to support, see ADR." There is no ADR.
```

**Friction points.**
- The SDK's edition-scoped defaults (helpful for normal apps) actively obstruct apps whose value proposition is *exposing* multiple lenses' disagreement. Need an explicit "raw multi-lens" mode and prominent docs.
- Walking an Anchor subtree to gather "everything touching this object" requires manual recursion. A `efs.subtree.attestations(anchor)` would be obvious.
- Result ordering of queries is not documented at the SDK level. Stability matters for citation work.
- Point-in-time / historical queries are absent. EFS is "permanent" in the sense that DATAs don't go away, but the *view* at a given block is not first-class. For provenance research, this is the table-stakes feature.
- Per-attester PROPERTY views ("show me Carol's notes vs. Alice's notes on this object") are not surfaced — the dev has to drop to raw attestations.
- Citation-grade exports (URL + content hash + block) are not a primitive but should be.

**Raw EAS temptation.** Extreme. This dev abandons EFS path-shaped reads almost entirely and treats `@efs/sdk` as a writer-only library. They consume chain data through their own indexer + raw EAS queries.

**APIs they'd wish for.**
```ts
efs.subtree.attestations(anchorUID, opts?: {
  schemas?: SchemaName[], byAttester?: boolean,
}): AsyncIterable<Attestation>
efs.properties.allViews(dataUID, key: string): Promise<{
  [attester: string]: { value: string, attestedAt: number }
}>
efs.snapshot.cite({ path, lenses?: string[], asOfBlock?: number }): {
  url: string, dataHash: string, anchorUID: string,
  citation: string,  // pre-formatted Chicago/MLA blob
}
efs.lens.discover({ topic?: string, minAttestations?: number }): Promise<...>
efs.timeline(anchorUID): AsyncIterable<TimelineEvent>
  // pre-merged time-ordered everything-attached-to-this-anchor stream
```

## App 5: Open-Source Firmware Mirror (`fw.archive`) — Ring 3 sandboxed app

**Description.** A small UI app *shipped into the EFS Client/OS Shell* — the user runs it inside the sandboxed Ring 3 environment. It lets the user browse archived firmware by device, verify signatures against a known signing key, download via the user's preferred transport, and pin a copy to IPFS. Lens: **OS SDK** (`efs.*`), per the OS capability-surface brainstorm. The dev is writing a manifest, requesting permissions, and consuming the proxy.

**Primary operations.**
1. Browse `/firmware/openwrt/gl-ar750/` — list available releases.
2. Read PROPERTY metadata (version, sha256, signing key) for a release DATA.
3. Verify signature using `efs.crypto.verify`.
4. Fetch the firmware blob via best mirror, with user-visible transport choice.
5. Pin the user's chosen build to IPFS via the user's pinning service (network fetch).

**Walkthrough.**

```ts
// fw-archive/src/main.ts — inside the Ring 3 sandbox.
// First file the dev writes is manifest.json.
{
  "name": "fw-archive",
  "permissions": [
    "efs.fs.read",                       // scope? Subtree scope mandatory?
    "efs.fs.read:/firmware/*",           // OK, narrow it down. But the user
                                         // might browse outside that...
    "efs.attestations.read",             // for verifying PROPERTY signatures
    "efs.network.fetch:https://api.pinata.cloud",  // per-origin allowlist
    "efs.network.ipfs"
  ]
}
// Dev: "Wait, what's the syntax for subtree scope? Glob? Anchor UID?"
// Docs in OS SDK brainstorm say "left for the design thread." Dev guesses
// glob, ships, breaks in next OS version when syntax is decided.

// Operation 1: list releases.
const dir = await efs.fs.list("/firmware/openwrt/gl-ar750");
// → DirEntry[] per the OS SDK surface. Each entry has name, dataUID, attester.
// But the *fs.list* surface is documented as taking { schema?, limit?, cursor?,
// sortInfoUID? }. Where does the dev get sortInfoUID values from?
// No discovery API listed. Dev hardcodes the empty default = unsorted.

// Operation 2: read PROPERTY metadata.
// efs.attestations.query, filtered by schemaUID=PROPERTY, refUID=dataUID.
// Wait — does the OS SDK even expose efs.properties.list? Reading brainstorm:
// no. Only efs.attestations.{get, query, write, ...}. Dev has to know the
// PROPERTY schema UID. Where do they get it from?
// Probably efs.meta.schemas() — not listed in brainstorm. Dev hardcodes UID
// from a copy-pasted Slack message. Works locally, breaks in dev when devnet
// is redeployed and UID changes.

// Operation 3: verify signature.
const sig = props.find(p => p.key === "signature")?.value;
const signer = props.find(p => p.key === "signedBy")?.value;
const blob = await efs.network.fetchMirror(dataUID);
const ok = await efs.crypto.verify(sig, blob, signer);
// → crypto.verify takes signature, payload, address per brainstorm.
// What format is `sig`? Hex string? Bytes? typed-data envelope?
// Doc says "signature verification utility." Dev has to read source.
// Dev's firmware uses a non-standard signature format (PGP detached sig).
// efs.crypto.verify is ECDSA-only. Dev has to bundle their own PGP library —
// but the sandbox CSP blocks dynamic-import-from-CDN. Dev has to inline-bundle
// 400 KB of OpenPGP.js into their app bundle, blowing the install size budget.

// Operation 4: transport choice.
// efs.network.fetchMirror takes { preferTransport? } per the brainstorm.
// Dev wants the user to pick. Has to first enumerate available mirrors.
const stat = await efs.fs.stat("/firmware/openwrt/gl-ar750/22.03.5");
// stat returns { mirrors[] } per brainstorm. Each is { transport, uri }.
// Dev renders a picker. User picks "magnet:". Dev calls fetchMirror with
// { preferTransport: 'magnet' }. The Kernel's mirror picker honors it
// (we hope). But — what if magnet: fetch fails (no peers)? Does fetchMirror
// fall back? Doc unclear. Dev wraps in try/catch and reorders preferences.

// Operation 5: pin to user's Pinata.
// efs.network.fetch:https://api.pinata.cloud — granted at install.
// But the dev needs the user's Pinata API key. The OS SDK has no
// "user secrets" namespace. efs.storage stores app-local data — but
// asking the user to type their key into a Ring 3 app means the app
// sees the plaintext key. Dev wishes for efs.secrets.request("pinata-key")
// where the Shell stores and injects via header.
const formData = new FormData();
formData.append("file", new Blob([blob]));
await efs.network.fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
  method: "POST",
  body: formData,
  headers: { Authorization: `Bearer ${userKey}` },  // user key plaintext in app
});
```

**Friction points (OS SDK lens).**
- Manifest permission *syntax* is hand-wavy across the OS SDK brainstorm — every install-time decision the dev makes is provisional.
- Subtree scope (`efs.fs.read:/firmware/*`) breaks the moment the user wants to browse outside it. The Ring 3 model is fundamentally at odds with "user-driven navigation" unless `efs.ui.pickFile` is universally used. Many apps want both.
- The OS SDK exposes `efs.attestations.*` raw but no `efs.properties.list(dataUID)` helper. Devs have to learn EAS internals to read a content type.
- Well-known schema UIDs (PROPERTY, TAG, etc.) are not exposed via `efs.meta`; devs hardcode.
- `efs.crypto.verify` is single-algorithm (ECDSA). Devs needing other signature systems have to inline-bundle crypto libraries, conflicting with sandbox bundle-size and CSP constraints.
- No "user secrets" surface. Apps that talk to third-party services with user-owned credentials force plaintext-into-app.
- `efs.network.fetchMirror` fallback semantics on mirror failure are undocumented.

**Raw EAS temptation.** Low — the dev is in the sandbox, they don't have a chain RPC of their own, the proxy is the only path. But the dev *resents* having to use the proxy for things that would be one line of Viem outside the sandbox.

**APIs they'd wish for (OS SDK).**
```ts
efs.properties.get(refUID, key): Promise<{ value, attester } | undefined>
efs.properties.list(refUID, opts?: { allAttesters?: boolean }): Promise<...>
efs.meta.schemas(): { ANCHOR: string, DATA: string, PROPERTY: string, ... }
  // schema UIDs by name, never hardcode
efs.crypto.verify(sig, payload, signer, alg?: 'ecdsa' | 'ed25519' | 'pgp'): ...
  // pluggable algorithm OR an extension hook for custom verifiers
efs.secrets.request(name: string, prompt: { reason }): Promise<{ handle: SecretHandle }>
efs.secrets.use(handle, request: FetchRequest): Promise<Response>
  // Shell injects header without app ever seeing the secret
efs.network.fetchMirror(dataUID, opts?: { preferTransport?, fallback?: TransportPriority[] }):
  Promise<{ bytes, transport: TransportName, attempts: TransportName[] }>
efs.fs.pickPath({ start?: string }): Promise<string>
  // canonical pattern for "let me browse outside my scoped subtree"
```

## Cross-cutting friction patterns

Patterns that recur across the five walkthroughs. Boilerplate-amenable problems are SDK-layer fixes; architecture-level ones can't be papered over by helpers alone.

- **The 8-attestation upload bundle is the first wall every dev hits.** Recipes, birding, fanfic, podcast — anyone writing files trips on this. The pattern is sound (atomic, dedup, content-addressed), but the wallet UX, gas surprise, and "what's actually in this bundle" opacity hit *immediately*. This is a writer-side SDK + Shell concern; no amount of TS sugar fixes the MetaMask UX without wallet cooperation.

- **PROPERTY by value is the missing query primitive.** Recipe forks (`previousVersion`), sports leaderboards, museum disputes, birding aliases — at least four of five apps want "find/aggregate DATAs by PROPERTY value." The chain doesn't index this and probably shouldn't; but the SDK punts entirely. Every serious app ships with the same off-chain Postgres mirror. **The "EFS local indexer" should be a packaged thing, not a re-implementation exercise.**

- **Lens defaults are silently load-bearing.** When the dev doesn't think about lenses, the SDK picks the deployer. This is fine for "hello world" but actively wrong for production apps (recipe forker user complaint, museum researcher who wants the firehose). The SDK should make the default *visible* and probably require an explicit declaration.

- **Edition-scoped reads are correct for most apps and wrong for explorer/curator apps.** A `efs.read.allLenses(...)` escape hatch needs to be obvious. Right now, the museum app dev drops to raw EAS and probably re-implements edition logic incorrectly.

- **High-level vs. low-level surface confusion.** Devs bounce between `efs.read/list/write` (path-shaped, opinionated) and `efs.attestations.{get,query,write}` (raw EAS shape). When they bounce, they're already losing — they wanted the high-level surface and it didn't have what they needed. The SDK should grow the high-level surface, not just expose the low one.

- **Lists schema is shipped half-done at the spec layer; devs hand-roll it.** Recipe cookbooks, RPG compendiums, fanfic rec lists, daily birding checklists, museum exhibition lists — Lists is omnipresent. Until it ships, every dev's "lists" code is throwaway.

- **Schema UIDs and other on-chain identifiers are dev-facing magic strings.** Schema UIDs, transport definition Anchors, well-known Anchor paths (`/transports/`, `/tags/`, `/lists/`) all need a typed, version-checked constants module exposed via the SDK.

- **L2 / multi-chain story is missing.** Birding hit it immediately; sports stats will hit it on launch day. The SDK's `chainId` config is single-valued; there's no "this anchor is on Arbitrum, this one is on Optimism" story. If EFS plans to live on multiple chains, the SDK has to model it explicitly.

- **Async iteration vs. eager arrays inconsistency.** `efs.list` returns an array; `efs.watch` returns an AsyncIterable. Big folders should be iterable. The convention should be "all read-many operations are AsyncIterable, with a `.toArray()` for small cases."

## Mental-model gaps

Places where the dev needs internal docs to do something they expect to be obvious. Each is a design or doc bug.

- **"What's a lens, and why didn't the SDK ask me?"** First-encounter friction. Lens model is a load-bearing concept that's exposed implicitly through a default. Devs assume "follow" is an on-chain action and waste hours.

- **"Why did MetaMask just pop up 8 times?"** The upload-flow bundle is documented in the spec but not on the SDK doc surface. The dev's first transaction is bewildering.

- **"Where do PROPERTY keys come from?"** `contentType`, `previousVersion`, `description` — there's no enumerated namespace, no typed helper, no auto-complete. The dev has to know the magic strings.

- **"Where's the search?"** Devs from Web2 expect `efs.search("carbonara")`. There is no search; there's only path-shaped traversal + manual indexing. This needs an up-front "EFS is not a search engine" disclaimer in the README, or it needs search.

- **"How do I get all forks of this DATA?"** Reverse-traversal of `previousVersion` requires off-chain indexing. Forward-traversal is fine. The asymmetry is invisible until the dev needs the reverse direction.

- **"How do I cite an EFS URL in a paper?"** Permanent URLs are EFS's headline promise, but the citation pattern (URL + lens set + block height) isn't a published convention. Academic users will demand this.

- **"Why is my batch failing at exactly 96 attestations?"** Batch-size limits live inside resolver constraints, not in a documented constant. Discoverable only by hitting the wall.

- **"What schema UID is PROPERTY this week?"** Devnet redeploys change UIDs. Production apps need a typed, version-pinned constants module. Devs currently hardcode.

- **"Why can't I pick the firmware to install — my app's permission only covers /firmware/openwrt/?"** Sandbox subtree scoping conflicts with user-driven navigation. The capability-by-selection pattern (`efs.ui.pickFile` granting ambient read) exists in the OS SDK brainstorm but isn't surfaced as *the* primary pattern.

- **"What signature algorithms does `efs.crypto.verify` support?"** Cryptographic helpers are framed as "convenience" but devs treat them as the contract — bundled algorithms become a hard dependency.

- **"How do I know if my read came from a trusted source?"** Lens attribution is in the API but easily ignored. Apps that *care* about provenance (firmware, medical, museum, legal) need provenance baked into every read result by default.

## Curator notes

- **The single sharpest friction finding:** **`efs.write` is an 8-attestation submarine that detonates on the user's wallet.** Across four of the five apps, the first dev experience of writing to EFS is "MetaMask popped up 8 times and the user gave up." The combined gas-cost surprise, opaque per-prompt calldata, and lack of a "summary of what's about to happen" Shell surface is the single most consequential UX wall. Fix this and adoption probably doubles; don't fix this and every onboarding session is the dev apologizing for the wallet UX.

- **What surprised me about the dev's perspective:** how *quickly* a non-trivial app dev abandons the high-level SDK surface and drops to raw EAS queries. Across recipe forker, sports stats, and museum researcher, the dev started with `efs.read/list/write` and was using `efs.attestations.query` by the end of day one. This means: (a) the high-level surface is too thin, (b) the low-level surface is *correct* and useful, (c) the gap between them is where every nontrivial app lives, and (d) every nontrivial app will reinvent the same off-chain indexer + edition logic + lens enumeration. **There is a "EFS-in-Postgres" SDK that should ship before launch**, and it probably matters more than polishing the path-shaped abstractions.

- **The "Ring 3 OS SDK" vs. "standalone" distinction is genuinely two different SDKs.** The OS app dev's friction is shaped by sandbox-and-permissions issues (manifest syntax, scope, CSP, missing user secrets); the standalone dev's friction is shaped by absent helpers, gas surprises, and missing off-chain indexer. They share roughly 40% of the surface and the rest diverges. Treating them as one library with one README will confuse both audiences. **Two packages: `@efs/sdk` (standalone) and `@efs/app-sdk` (Ring 3) likely deserves a design discussion**, with a shared `@efs/core` for schema constants and codec.

- **The brainstorm couldn't address:** (a) Wallet-level UX changes needed to make multi-tx bundles legible — that's an Ethereum-ecosystem problem requiring MetaMask/Rabby cooperation, not solvable in `@efs/sdk` alone. (b) Pricing model for the eventual off-chain indexer service — someone runs the Postgres mirror and charges per query, this becomes a centralization vector, demanding its own design pass. (c) Specific schema-validation conventions for DATA payloads (the sports-stats Zod problem) — this is a "EFS Application Profiles" idea that's larger than this brainstorm. (d) The right balance between *aggressive defaults* (low surface area, opinionated, easy onboarding) and *escape hatches* (necessary for serious apps) — a Karpathy-style minimal SDK risks being useless for the museum researcher, while a kitchen-sink SDK overwhelms the recipe dev. This tension is real and unresolved.

- **A finding I didn't expect:** the OS SDK app (firmware mirror) ran into *fewer* friction points overall than the standalone apps. Sandboxing is constraining but it also means the OS owns wallet/network/storage problems on the app's behalf. The standalone-dev experience is much wilder — they're a regular Web3 dev plus all of EFS's idiosyncrasies. **If onboarding has a default lane, it might be "build inside the Client first" with the standalone SDK as the harder, more powerful path.** That's an inversion of the natural assumption (Ring 3 is the harder thing because of sandboxing).
