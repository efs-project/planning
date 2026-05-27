---
agent: bs-contract-decomposition-v1
date: 2026-05-26
status: raw
anchors:
  - area: contracts
  - area: sdk
---

# Contract decomposition directions for EFS

EFS is approaching a "shape freeze": individual contracts will be upgradeable, but the *set* of contracts — how concerns are sliced across deployable units — wants to be settled before mainnet. Two starting positions are on the table and they disagree in interesting ways. James's mental model proposes three contracts (indexer, graph, data/filesystem), which reads as a clean conceptual carve-up that maps to the three-layer model. The `custom-lists` branch reality is five contracts (`EFSIndexer`, `EFSRouter`, `EFSFileView`, `EdgeResolver`, `MirrorResolver`) plus `EFSSortOverlay` and several near-empty resolver stubs left over from earlier iterations. The structural gap between "three concept-aligned contracts" and "what the code actually grew into" is the brainstorm fodder. The directions below treat both positions as legitimate, then push outward into a few less-obvious decompositions so the future Contract Architecture design thread has a real menu rather than a binary.

A note on terminology: the Glossary uses "lens" where the architecture spec still says "edition" (per ADR-0043, renamed), and "PIN/TAG" where the schema spec still says "TAG" (per ADR-0041, cardinality split). I use the Glossary terms below and assume PIN+TAG are the post-freeze schema reality, even though the spec hasn't been updated yet. If that assumption is wrong, several of these directions tighten or loosen significantly.

## Direction 1: James's 3-contract model (indexer + graph + data)

### Layout

- **`EFSIndexer`** — EAS-level indexer. Tracks `refUID` relationships, revocations, schema-blind discovery indices. Doesn't know about paths, tags, mirrors, or files specifically. Mirrors the existing `Indexer.sol` shape but with EFS's append-only-by-design discipline.
- **`EFSGraph`** — the relationship overlay. Hosts edge schemas (PIN, TAG), the `_activeByAttesterAndSchema` swap-and-pop index, edge counts, edition/lens-scoped aggregations, `_qualifyingFolders` and `_containsAttestations` propagation. Also hosts SORT_INFO overlay (sorts are graph-shaped: per-parent ordered lists of edges).
- **`EFSData`** — the filesystem-facing surface. Hosts DATA, ANCHOR, MIRROR, PROPERTY schemas and their resolvers; hosts the `web3://` router (ERC-5219); hosts `EFSFileView` directory listing. Schema-aware about what a "file" actually means.

### Upgrade boundaries

- `EFSIndexer` is the most "kernel-like" — closest to a pure EAS-relationship store. Frozen tight. Any upgrade rewrites the foundation; treat it as Etched.
- `EFSGraph` is the most upgrade-likely contract: edge cardinality (PIN/TAG split), edition-scoping rules, sort overlay, and qualifying-folder logic all live here, and all have changed mid-flight already.
- `EFSData` rides on top — it can be redeployed (URI breakage aside) more freely because it's a reader/router rather than a state owner.
- Schema UIDs encode resolver addresses, so any contract whose address is in a registered schema is effectively frozen for that schema's lifetime. In this layout, `EFSIndexer` and `EFSGraph` are both schema-wired; `EFSData`'s router is not.

### Migration from current Lists-branch state

- `Indexer.sol` (the generic EAS-relationship store) → becomes the core of new `EFSIndexer`. Drop the legacy `EFSIndexer.sol` *as a separate contract* and fold its non-graph indices into the new `EFSIndexer`; move its graph-aware parts (qualifying folders, contains propagation, edition aggregations) into `EFSGraph`.
- `EdgeResolver` (PIN + TAG) → absorbed into `EFSGraph`. The resolver hook stays, but `EdgeResolver`-as-separate-contract goes away.
- `EFSSortOverlay` → absorbed into `EFSGraph`. Sort overlay is just another graph view.
- `MirrorResolver`, `PropertyResolver`, `FileResolver`, `BlobResolver`, `TopicResolver` → either folded into `EFSData` or retired entirely if they were stubs. The active validation logic (URI allowlist, anchor ancestry check) moves into `EFSData`.
- `EFSFileView` → folded into `EFSData` (it's a view layer over kernel reads).
- `EFSRouter` → folded into `EFSData` (router is a serialization layer over data lookups).
- `SchemaNameIndex` → retired or moved to `EFSData` as an optional helper.

### Schema set implications

- No new schemas required. ANCHOR, DATA, MIRROR, PROPERTY, PIN, TAG, SORT_INFO all map cleanly to one of the three contracts as their resolver/host:
  - ANCHOR → `EFSData` (it's a path identifier)
  - DATA → `EFSData`
  - MIRROR → `EFSData`
  - PROPERTY → `EFSData`
  - PIN → `EFSGraph`
  - TAG → `EFSGraph`
  - SORT_INFO → `EFSGraph`
- Risk: collapsing PIN+TAG resolvers into a single `EFSGraph` contract pins both schemas' UIDs to that one address forever. If you ever want to upgrade PIN's resolver semantics without touching TAG's, you can't.
- The `/tags/` and `/transports/` reserved-folder conventions are unchanged — those live in attestation data, not contract code.
- Reserved root anchors (`/tags/`, `/transports/`, plus future ones like `/sorts/` if needed) become deploy-time concerns of `EFSData`, even though they're "graph-adjacent." Acceptable but worth noting.

### Third-party dev surface friction

- **Elegant**: a third-party SDK can describe EFS in three sentences. "Want to know about attestations and their relationships? Call `EFSIndexer`. Want to traverse the graph or list a folder? Call `EFSGraph`. Want to fetch a file or serve a `web3://` URL? Call `EFSData`." That is a *teachable* surface.
- **Friction**: any non-trivial read (e.g., "list this folder, edition-scoped, with sort overlay applied, returning content types") crosses contract boundaries. SDK has to compose calls across all three; gas for staticcalls compounds. The current Lists-branch lets `EFSRouter` and `EFSFileView` orchestrate that composition internally.
- **Awkward**: where does "PIN at this path for this lens" live? It uses indexer relationships, is hosted by graph, and needs data context to interpret. The boundary between graph and data gets blurry in exactly the places third-party devs will be writing read paths.

### Tradeoffs vs. alternatives

- **Gained**: conceptual clarity matching the three-layer mental model; clean upgrade story (graph and data layers can evolve independently from the kernel); the three-contract surface is genuinely smaller than what's there now.
- **Lost**: the current Lists-branch already has working separations along *different* lines (per-resolver contracts, per-schema resolvers). Collapsing PIN+TAG+SORT into one contract means a single PIN bug or a single SORT bug is now a "graph contract is compromised" event. The blast radius per upgrade is larger.
- **Open question**: where does the router live? Calling it part of `EFSData` is the natural place, but it's also the contract most exposed to the outside world and most likely to need iteration. Keeping it folded means `EFSData` is doing two distinct jobs (state-holding for resolvers + URL parsing).
- **Cost note**: `EFSGraph` becomes the largest single contract by far — it holds PIN+TAG state, SORT_INFO overlay state, qualifying-folder index, contains propagation, edition aggregation. Bytecode-size pressure (EIP-170 / EIP-3860) is a real concern; may force library extraction.
- **Boundary subtlety**: "indexer = schema-blind, graph = schema-aware" sounds clean, but in practice many EFSIndexer operations today *are* schema-aware (e.g., the qualifying-folder write-time index from ADR-0008 fires specifically on ANCHOR writes). Either those move to `EFSGraph` (breaking the clean split) or `EFSIndexer` carries a schema-aware exception (breaking the abstraction).

## Direction 2: Current 5-contract Lists-branch reality

### Layout

- **`EFSIndexer`** — append-only kernel. Path resolution, revocation tracking, qualifying-folder index, contains-attestations propagation, schema-blind discovery indices.
- **`EFSRouter`** — `web3://` URI resolution (ERC-5219), edition-scoped content serving, transport selection, content-type assembly.
- **`EFSFileView`** — stateless directory listing views over the kernel.
- **`EdgeResolver`** — PIN + TAG schema resolver. Singleton-by-slot for PIN, cardinality-N with weights for TAG. Hosts active-edge maps, edge counts, edge-hash discovery indices.
- **`MirrorResolver`** — MIRROR schema resolver. URI scheme allowlist, transport ancestry check, length caps.
- *(implicit sixth)* **`EFSSortOverlay`** — per-parent linked-list sort overlay; spec lists it among the core six even if the task framing names five.

### Upgrade boundaries

- `EFSIndexer`, `EdgeResolver`, `MirrorResolver`, `EFSSortOverlay`: all schema-wired and effectively frozen post-freeze. Upgrades happen via proxy or not at all (mainnet pattern per ADR-0030 is no upgrades; devnet pattern per the open Tier-2 question is TransparentUpgradeableProxy).
- `EFSRouter` and `EFSFileView`: stateless and not schema-wired. Redeployable, though `web3://` URLs bake the router address so a redeploy is a URI-namespace break.
- Each schema's resolver can be upgraded narrowly (proxy or supersession) without disturbing other schemas. This is the structural payoff: a TAG-resolver bug doesn't reach into mirror state.

### Migration from current Lists-branch state

- Trivially: this *is* the current state. Migration is "ratify and clean up."
- Retire the dead stubs (`BlobResolver`, `FileResolver`, `PropertyResolver`, `TopicResolver`, `YourContract`, possibly `SchemaNameIndex` and `Indexer` if those were exploration). Delete from the contracts dir; don't deploy.
- Decide whether PROPERTY needs a dedicated resolver (current `PropertyResolver` is a no-op) or whether validation can happen in `EFSIndexer` index hooks. If PROPERTY ever grows reserved-key constraints (`contentType` sanitization per ADR-0024 already), splitting it back out becomes attractive — so leave the seam.
- Document the six (or seven, if a PROPERTYresolver is needed) contracts as the canonical set in `specs/overview.md` and update the "Core contracts" table to match.

### Schema set implications

- No schema changes required. This is the layout the schemas were designed around. Each schema has a clear primary contract:
  - ANCHOR → `EFSIndexer` (kernel hosts the most fundamental schema)
  - DATA → `EFSIndexer` (also kernel — DATA is content identity, append-only)
  - MIRROR → `MirrorResolver`
  - PIN → `EdgeResolver`
  - TAG → `EdgeResolver`
  - PROPERTY → currently no-op resolver; either a dedicated `PropertyResolver` or fold validation into `EFSIndexer`
  - SORT_INFO → `EFSSortOverlay`
- The cardinality split (PIN vs TAG) is baked into `EdgeResolver` already — both schemas live in one contract but with separate on-wire shapes. That's a deliberate choice that this direction inherits.
- PROPERTY needs a deploy-time decision: ship the no-op resolver, fold into `EFSIndexer` indexing, or build out a real validator. Currently the no-op means PROPERTY validation rules (e.g., reserved keys, content-type sanitization per ADR-0024) live in the calling layer, not at the resolver hook — which is a missed enforcement point.

### Third-party dev surface friction

- **Elegant**: each schema has at most one contract that knows about its semantics. An SDK author can write a "PIN/TAG client" by talking only to `EdgeResolver`, a "mirror client" by talking only to `MirrorResolver`. Cleaner narrower interfaces.
- **Friction**: "what contracts make up EFS?" is now a six-item list and growing. SDK surface needs orchestration helpers (which is what `EFSRouter` and `EFSFileView` already do for reads — but writes are still N-contract dances).
- **Awkward**: the resolver split is invisible to most callers because attestations are submitted through EAS, not through the resolvers directly. So third-party devs see "submit to EAS, the right resolver fires." The contract count is mostly an *operator* concern (deploy scripts, address books, ABI bundles) rather than a *caller* concern. That softens the friction but also makes the count creep harder to notice.

### Tradeoffs vs. alternatives

- **Gained**: narrowest possible upgrade blast radius per schema; cleanest test isolation; matches how EAS itself is structured (one resolver per schema). Already shipped, already tested, already debugged.
- **Lost**: the headline "EFS is six contracts" is a less satisfying pitch than "EFS is three contracts." For a project that wants to be teachable and embeddable, count matters for adoption optics. Also: every cross-schema concern (sort overlay reading edges, router reading mirrors + properties + tags) is a cross-contract call.
- **Open question**: is `EFSSortOverlay` part of the canonical set, or is it the first instance of a *pattern* (per-overlay separate contract) that will accumulate more overlays (custom-lists overlay, ranking overlay, social-graph overlay) over time? If the latter, this direction is really "5 core + N overlays" and the count keeps growing.
- **Hidden cost of "do nothing"**: ratifying the status quo locks in whatever accidental couplings already exist. The `EdgeResolver` reaches into `EFSIndexer` via `IEFSIndexerForEdges` (index, indexRevocation, getParent, propagateContains, clearContains) — that interface freezes too. Future work that wants to change `EFSIndexer`'s internal shape pays an interface-stability tax.
- **Operator perspective**: six contracts means six addresses in the address book, six ABIs in the SDK bundle, six items in every deploy script. Each step is small, but it accumulates. Devnet vs mainnet address parity also gets harder to track at six than at three.

## Direction 3: Kernel + Resolvers (2 contracts logically, N as overlays)

### Layout

- **`EFSKernel`** — single contract holding: all schema resolvers (ANCHOR, DATA, MIRROR, PROPERTY, PIN, TAG, SORT_INFO), all indices, all aggregations. The entire write+state surface of EFS in one deployment.
- **`EFSGateway`** — single contract holding: router (`web3://`), file view, directory listings, mirror selection, sort-application, edition/lens resolution. The entire read surface in one deployment.
- Overlays (custom lists, ranking, etc.) deploy *as separate contracts* outside the canonical pair — they're not "part of EFS" in the freeze sense, they're third-party extensions that happen to be written by the EFS team.

### Upgrade boundaries

- `EFSKernel` is frozen hard. It owns every schema UID and every piece of state. No upgrades.
- `EFSGateway` is freely redeployable; URLs change with it.
- Overlays are individually upgradeable / replaceable / addable post-freeze without touching either canonical contract.

### Migration from current Lists-branch state

- `EFSIndexer`, `EdgeResolver`, `MirrorResolver` → merged into `EFSKernel`. All resolver logic, all indices, one address.
- `EFSRouter`, `EFSFileView` → merged into `EFSGateway`. All read/serve logic, one address.
- `EFSSortOverlay` → moved *out* of the canonical set. Becomes "the first official overlay," sitting alongside any future custom-lists contract. SORT_INFO schema's resolver still has to be wired somewhere — likely a thin SORT_INFO-only resolver inside `EFSKernel` that *delegates* shape questions to the registered overlay address.
- Stubs all retired.
- Internal logic preserved via libraries: the merge isn't "rewrite everything," it's "extract per-resolver code into Solidity `library` units, link into one contract." `EdgeLib`, `MirrorLib`, `IndexLib`, `PathLib` keep code organized; the *address* count drops to 2 even though the *file* count is similar.
- The big practical question: does the linked-library `EFSKernel` fit under EIP-170's 24KB ceiling? If not, this direction is dead-on-arrival without EIP-3860 or some other size relaxation being available on the target chain.

### Schema set implications

- No schema changes, but a subtle one: if the sort overlay moves out, the SORT_INFO schema's resolver address (which is `EFSSortOverlay` today) needs to either be `EFSKernel` (forcing kernel to know about sorts) or stay `EFSSortOverlay` (forcing the overlay back into the canonical set). The cleanest answer is: SORT_INFO's resolver is a thin shim in `EFSKernel` that calls out to a *registry* of overlay addresses, but that adds a layer of indirection the rest of EFS doesn't have.
- Risk: this direction wants to draw a sharp line at "kernel = etched, gateway = ephemeral" and that line cuts through the sort overlay awkwardly.

### Third-party dev surface friction

- **Elegant**: "EFS is two contracts" is the easiest possible pitch. Address books are tiny. ABI bundles are tiny. Deploy scripts are tiny.
- **Friction**: `EFSKernel` is a *huge* contract by Solidity standards. Bytecode-size limits (24KB EIP-170, or 48KB with EIP-3860) become a real concern. The current `EFSIndexer` is already large; absorbing `EdgeResolver` and `MirrorResolver` may not fit, period.
- **Awkward**: any bug found in any schema's resolver post-freeze is "the entire kernel needs a proxy upgrade." The mainnet-permanence ADR (0030) says no upgrades on mainnet; if `EFSKernel` is the one frozen thing and it has a TAG resolver bug, the fix path is "redeploy EFS and migrate." Brutal.

### Tradeoffs vs. alternatives

- **Gained**: maximum simplicity of the canonical surface; maximum extensibility outside it (overlays are first-class); cleanest "what is EFS, exactly?" answer.
- **Lost**: largest single-contract risk surface; bytecode-size pressure; loss of per-schema upgrade narrowness; the sort overlay sits in an awkward in-or-out position.
- **Open question**: does putting all resolvers in one contract violate any EAS assumption? (EAS allows it — a resolver can handle multiple schemas — but the patterns in the EAS ecosystem assume per-schema resolvers, so tooling may be surprised.)
- **Overlay-as-first-class implication**: if custom-lists, sort, ranking, etc., are all overlays, then EFS needs a *convention* for how overlays register themselves and how clients discover them. That convention is a contract-level surface even if it's not itself a contract — and pinning it down before freeze is harder than pinning down the canonical pair.
- **Real-world precedent**: Uniswap V4 is going this direction (singleton + hooks). EAS itself is closer to per-resolver. EFS would be picking a side without a clean ecosystem template — both work, neither is "right."

## Direction 4: Separation by attestation lifetime / mutability

### Layout

- **`EFSPermanence`** — owns the non-revocable schemas (ANCHOR, DATA) and their indices. Append-only by *schema*, not just by convention. Path resolution, content-hash dedup, hierarchical walks.
- **`EFSMutable`** — owns the revocable schemas (MIRROR, PROPERTY, PIN, TAG, SORT_INFO) and their indices. Singleton/cardinality logic, edition-scoped reads, revocation tracking, the "current state" view.
- **`EFSRouter`** — read/serve layer that composes the two (file fetch = stable identity from Permanence + current placement from Mutable).
- **`EFSSortOverlay`** stays separate (it's an overlay, not a schema host).

### Upgrade boundaries

- `EFSPermanence` is the *truly* Etched contract. Its data is mathematically irreversible; never upgrade.
- `EFSMutable` is Durable. It holds revocation state and current-best-attester views — those have already been re-thought multiple times (lenses, PIN cardinality split, qualifying folders). Upgrade-friendly proxy candidate.
- `EFSRouter` ephemeral, redeploy at will.
- `EFSSortOverlay` durable, its own upgrade boundary.

### Migration from current Lists-branch state

- `EFSIndexer` is split along the schema-lifetime seam:
  - anchor + data indices + content-key dedup → `EFSPermanence`
  - mirror discovery, qualifying folders, contains propagation, edge state, edition aggregations → `EFSMutable`
- `EdgeResolver`, `MirrorResolver`, `PropertyResolver` (if real) → all folded into `EFSMutable`.
- `EFSRouter`, `EFSFileView` → unchanged in role; `EFSFileView` may merge into `EFSRouter` or stay separate.
- `EFSSortOverlay` → unchanged (its own contract, own upgrade boundary).
- Stubs retired.
- Cross-contract reads: `EFSMutable` queries against `EFSPermanence` to validate that referenced ANCHORs and DATAs exist before recording an edge. That's a single staticcall per write; not free but not catastrophic.

### Schema set implications

- No schema changes, but it forces a useful discipline: the *lifetime* of an attestation determines which contract hosts its state. If someone proposes making ANCHOR revocable later, this layout says "no" much more loudly than the others.
- The contains-attestations propagation logic (which fires on PIN/TAG writes but mutates state about ANCHORs) becomes a cross-contract write. That's a real cost.

### Third-party dev surface friction

- **Elegant**: maps to a mental model that's genuinely useful — "did this fact ever exist?" goes to Permanence; "does this fact apply right now?" goes to Mutable. For an SDK that wants to expose `wasEverTagged` vs `isCurrentlyTagged`, the contract split mirrors the query split.
- **Friction**: writes that span both (creating an ANCHOR + a PIN to it in the same multiAttest) now touch two contracts. EAS will call both resolvers, so the user doesn't see it directly, but cross-contract reentrancy and ordering get more subtle.
- **Awkward**: PROPERTY is the borderline case — revocable per the schema, but used in practice as "the file's content type, written once." If `contentType` PROPERTY ends up living in `EFSMutable` it conceptually feels misplaced.

### Tradeoffs vs. alternatives

- **Gained**: a real architectural invariant emerges (lifetime → contract). Makes the "Etched vs Durable vs Ephemeral" permanence tiers from the Glossary load-bearing rather than aspirational.
- **Lost**: `EFSMutable` ends up doing a lot — five schemas' worth of resolvers and indices. Whatever simplicity wins came from splitting on lifetime, the complexity wins come from cramming five concerns together.
- **Open question**: is the lifetime distinction actually load-bearing for callers, or only for contract authors? If only for authors, the split is internal architecture and doesn't need to be a deployment boundary.
- **Auditor's perspective**: an auditor would love this layout — "permanence invariants live in one contract you can verify in isolation; everything that can change lives in another." Reduces what has to be 50-year-test-correct vs what can iterate.
- **Tension with ADR-0009**: the append-only-indices ADR says revocation sets `_isRevoked` flags but never mutates; under this layout, the revocation flag would be in `EFSMutable` even though it refers to entries that *exist* in `EFSPermanence`. That's not wrong, but it's a cross-contract invariant the design needs to spell out carefully.

## Direction 5: Per-layer-of-the-three-layer-model (paths, data, retrieval), strictly

### Layout

- **`EFSPaths`** — owns ANCHOR, hosts path resolution, qualifying-folder propagation, the `/transports/`, `/tags/`, and root-anchor conventions. Nothing about content or mirrors.
- **`EFSContent`** — owns DATA, PROPERTY, PIN, TAG. Content identity, file placement, labeling. The "what files exist and where" surface.
- **`EFSRetrieval`** — owns MIRROR, the `web3://` router, transport priority, edition-scoped mirror selection, SSTORE2 chunk reading. The "how do I fetch this" surface.
- **`EFSSortOverlay`** stays separate, talks to `EFSContent` (since sort overlays are mostly about ordering PINs/TAGs).
- **`EFSFileView`** stays separate, composes across all three.

### Upgrade boundaries

- `EFSPaths` is the most fundamental — it defines the tree structure. Freeze hard.
- `EFSContent` is the highest-churn — placement logic, cardinality, edition scoping. Upgrade-likely.
- `EFSRetrieval` is medium-churn — transport priorities and URI parsing have changed, MIRROR semantics have not.
- Each can be upgraded narrowly within its layer.

### Migration from current Lists-branch state

- `EFSIndexer` is split *three* ways along the layer seam:
  - path resolution (`resolvePath`, anchor parent walks, depth limits) → `EFSPaths`
  - data identity (`dataByContentKey`, DATA discovery) + edge state (PIN/TAG indices, qualifying folders, contains propagation) + property indexing → `EFSContent`
  - mirror discovery, transport-anchor validation, URI lookup indices → `EFSRetrieval`
- `EdgeResolver` → `EFSContent`.
- `MirrorResolver` → `EFSRetrieval`.
- `EFSRouter` → folded into `EFSRetrieval` (router *is* the retrieval surface).
- `EFSFileView` → stays separate as the cross-layer composer; it's the "give me a directory listing with everything" convenience contract.
- `EFSSortOverlay` → stays separate (talks to `EFSContent` for edges, to `EFSPaths` for parent anchor lookups).
- Stubs retired.
- The qualifying-folder index is the tricky one: it fires on ANCHOR writes (Paths layer) but answers queries about content placement (Content layer). Either Paths exposes a hook that Content subscribes to, or the index relocates to Content with a Paths→Content callback on every ANCHOR write. Both work; both have nontrivial cost.

### Schema set implications

- Strongly reinforces the three-layer story. ANCHOR's resolver is `EFSPaths`. DATA/PIN/TAG/PROPERTY's resolver is `EFSContent`. MIRROR's resolver is `EFSRetrieval`. SORT_INFO's resolver is `EFSSortOverlay`.
- A new schema proposal has to declare which layer it belongs to. That's a useful design pressure.
- Cross-layer indices (e.g., "files at this path") have to be reconstructable from kernel reads across two contracts. Either `EFSPaths` knows about content placement (violating the layer) or `EFSFileView` does the join.

### Third-party dev surface friction

- **Elegant**: the contract names *teach the three-layer model*. You cannot use EFS without internalizing paths/content/retrieval. That's pedagogically valuable for SDK design.
- **Friction**: `EFSFileView` as the universal joiner has to know about all three layers. It becomes the de facto "easy" API and the per-layer contracts become "advanced" APIs. Most SDKs will only ever call `EFSFileView`.
- **Awkward**: PROPERTY can live on either an Anchor or a DATA. Which layer is it in? Currently the spec says it's content metadata, so `EFSContent` — but a PROPERTY on an Anchor (e.g., folder description) feels more like a path-layer concern. Either layer ends up bending.

### Tradeoffs vs. alternatives

- **Gained**: tightest mapping between conceptual architecture and deployment architecture. Future agents and devs cannot get the layers confused because the contract boundaries enforce them.
- **Lost**: the four (or five with overlays and view) contracts is not noticeably smaller than the status quo. The per-layer narrowing is more about *clarity* than *count*.
- **Open question**: does the boundary between Content and Retrieval survive the addition of new transports? web3:// retrieval is partially on-chain (SSTORE2), which means `EFSRetrieval` may need to read content-bytes state, which arguably puts SSTORE2 chunk indexing in the Content layer. If so, `EFSRetrieval` is mostly empty.
- **Naming dividend**: contract names that mirror the conceptual layers (`EFSPaths`, `EFSContent`, `EFSRetrieval`) are themselves documentation. The Glossary's "three-layer model" entry stops needing prose to explain it because the deployed contracts *are* the three layers.
- **Failure mode**: layer-strictness can become layer-dogmatism. The reality of EFS today is that many operations cross layers (sort overlays, file views, edition-scoped reads). If the design thread interprets "strict" too strictly, every cross-layer helper becomes a contortion. Best read as "layers are the default; document the exceptions explicitly."

## Cross-cutting tensions

The directions above pull on a small set of underlying axes. Every direction makes a particular bet on each one.

- **Count vs. blast radius.** Fewer contracts → smaller pitch, smaller address book, larger per-contract bug blast radius. More contracts → wider pitch, narrower per-schema upgrade, more orchestration cost. Direction 3 (2 contracts) and Direction 2 (5–6 contracts) sit at the ends.
- **Schema UID immutability.** Every resolver address is hashed into a schema UID at registration. Any contract that hosts a resolver is effectively frozen for that schema's life. The merge/split decisions are *not symmetric*: splitting a contract later is easy (deploy a new one), merging two contracts later requires re-registering all involved schemas (which orphans every existing attestation). This biases strongly toward "split more now, merge later if needed."
- **Where does the router live?** The router is the most user-visible surface, the most upgrade-eager, and the least state-holding. It can be merged into a big read contract (Direction 3, 4, 5) or kept separate (Direction 1, 2). Keeping it separate preserves URL stability (router address is in every web3:// URL); merging it makes redeploys more disruptive.
- **Sort overlay's position.** Is `EFSSortOverlay` (a) a core contract, (b) the first of many overlays, or (c) a piece of the graph layer that shouldn't be its own contract? Each direction answers differently. The answer interacts with custom-lists: if custom-lists is "another overlay," that argues for (b); if it's a fundamental graph operation, that argues for (c).
- **Schema-aware vs schema-blind kernel.** Direction 1's `EFSIndexer` is closer to the legacy `Indexer.sol` (purely EAS-relationship, no schema knowledge). Direction 2's `EFSIndexer` knows about anchors, tags, qualifying folders, contains propagation. The trade is reusability (schema-blind kernels could index *any* EAS schema set) vs. on-chain efficiency (schema-aware kernels can maintain the right indices at write time).
- **Where PIN+TAG live.** Either together (one resolver, the EdgeResolver pattern) or apart (one resolver per cardinality). Together is shipped and works; apart would let cardinality semantics evolve independently. The cardinality split (ADR-0041) already chose "two schemas, one resolver"; this is a settled-enough question that re-litigating it isn't free.
- **The number of contracts a third-party SDK has to import.** From a JS/TS perspective, importing one ABI vs five is materially different for bundle size and onboarding friction. The SDK can paper over the count (one façade with internal multi-contract calls), but the underlying contracts surface determines what the SDK has to wire.
- **Devnet upgrade pattern interaction.** The open Tier-2 question on TransparentUpgradeableProxy vs UUPS interacts with this: more contracts → more proxies to manage → more upgrade ceremonies. The 2-contract direction is the cheapest to operate; the 6-contract direction is the most flexible.
- **What "extension" means.** Some directions (3, 4) cleanly separate "the canonical thing" from "overlays/extensions." Others (1, 5) keep extensions inline. The question of whether third-party developers should write *new schemas+resolvers* or *new contracts that read EFS* is partly answered by which decomposition you pick.
- **Test surface.** Per-contract test isolation is cleaner the more contracts you have, but cross-contract integration tests become more complex. Direction 2 has the most independent tests today; Direction 3 would consolidate them; the others sit between.
- **`web3://` URL stability.** The router address is in every URL ever issued. Any direction that lets the router live alone (1 with `EFSData` carrying it, 2 with `EFSRouter` separate, 5 with `EFSRetrieval` as router) preserves the option to redeploy the router with URI migration. Direction 3 entangles the router with `EFSGateway` such that any gateway change is a URL break.
- **Deploy-before-register ordering.** ADR-0027 requires resolver addresses be known before schemas are registered. Every direction inherits this, but the directions that put resolvers behind proxies (any of them, when devnet upgradeability lands) need to settle whether the *proxy* address or the *implementation* address is what's baked into the schema UID. The fewer schema-wired contracts, the fewer places this question has to be answered.
- **Where custom-lists lands.** None of the directions above explicitly host a custom-lists contract because custom-lists is still in design. But each direction implies a *home* for it: Direction 1 puts it in `EFSGraph`; Direction 2 makes it the seventh contract; Direction 3 makes it the second canonical overlay; Direction 4 puts it in `EFSMutable`; Direction 5 puts it in `EFSContent` or as a sibling overlay. The fact that custom-lists' home is implicit-but-different across directions is itself a useful design pressure.
- **The "what is canonical EFS?" question.** A third party building on EFS needs to know which contracts they're depending on for the protocol's behavior vs which are conveniences. Directions 3 and 4 draw sharp canonical/non-canonical lines; Directions 1, 2, and 5 leave the question ambiguous (is `EFSFileView` canonical? It's listed in the spec but it's stateless and replaceable). Worth deciding explicitly during freeze rather than implicitly.

## Curator notes

- **Most promising to me**: Direction 5 (strict three-layer) feels like the highest pedagogical payoff. It teaches the three-layer model through the deployment boundaries, which is a force multiplier for SDK docs and third-party adoption. But it's also nearly as many contracts as Direction 2, so the "ratify the status quo" pitch competes hard.
- **Least promising to me**: Direction 3 (2-contract kernel + gateway). Concentrating all resolver logic in one contract collides head-on with the bytecode-size ceiling and the mainnet-no-upgrades constraint. A single TAG bug being "the kernel is broken" is an unacceptable failure mode for a credibly-neutral protocol.
- **Surprise**: Direction 4 (split by lifetime) wasn't in the original two-position framing and feels genuinely novel. The Glossary's three permanence tiers (Etched / Durable / Ephemeral) want to be load-bearing somewhere, and this is the direction where they would be. Worth the design thread engaging with even if it doesn't get picked.
- **Underdiscussed**: the migration cost of "split now, merge later vs. merge now, split later" asymmetry. Schema UIDs being baked at registration time means merging is functionally impossible without a re-deploy migration; this should be a *much* stronger argument for "err on the side of more contracts at freeze" than I see in either starting position.
- **Spec gap noticed**: the architecture spec (`01-System-Architecture.md`) still describes `EFSTagResolver` (renamed to `EdgeResolver`), references "editions" rather than "lenses," and doesn't mention the PIN/TAG cardinality split. The Glossary has the newer terms; the spec is stale. Worth a sweep before the contract architecture design thread starts, otherwise the design thread will have to constantly reconcile vocabulary.
- **Ambiguity in the task framing**: "the current 5-contract reality" undersells what's on the branch — there are also `EFSSortOverlay` (in the canonical six per `overview.md`) and several no-op stub resolvers. Whether to call this 5, 6, or 7 contracts depends on whether you count stubs and overlays as "the set." I treated overlay as part of the set and stubs as retirable; flagging in case the design thread wants to draw the line differently.
- **Tension worth naming explicitly**: the most fundamental fork is "schema-blind kernel vs schema-aware kernel" (Direction 1 vs Direction 2). That fork shows up *inside* every other direction too. If the design thread can resolve that one axis first, the rest of the decomposition mostly falls out.
- **What I deliberately didn't propose**: a "per-attestation-schema" decomposition (one contract per schema, 6+ contracts). It's the natural endpoint of Direction 2's logic, but the cross-schema coupling in EFS (mirror selection reads PIN/TAG state, sort overlay reads PIN/TAG state, qualifying folder index fires on ANCHOR but is read by PIN logic) makes that endpoint impractical. Worth noting it exists in case the design thread wants to engage with it.
- **Question for James**: the three-contract pitch is conceptually clean but doesn't map to where the code actually went. Was the divergence intentional (you're aware the implementation grew past three and that's fine) or accidental (the implementation drifted and the freeze is a chance to pull it back)? The answer changes how heavily Direction 1 should be weighted in the upcoming design thread.
