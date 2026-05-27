---
agent: bs-contract-upgradeability-v1
date: 2026-05-26
status: raw
anchors:
  - area: contracts
  - brainstorm: 2026-05-26-bs-contract-decomposition-v1
---

# Per-contract upgrade story for EFS

EFS plans to be "upgradeable to fix bugs but adding or removing `.sol` files is much harder." This brainstorm walks contract-by-contract through what that promise actually constrains. The core framing: every contract sits somewhere on the spectrum from *etched* (its address is hashed into a schema UID at registration time, so any address change orphans every attestation under that schema) to *ephemeral* (stateless reader, freely redeployable, but URL or ABI continuity may still matter).

Devnet currently lacks an accepted proxy pattern (open Tier-2 question in `docs/QUESTIONS.md`); mainnet is fully immutable per ADR-0030. The work below assumes that whatever lives on a proxy on devnet *also* lives on a proxy with the same storage layout on mainnet — otherwise devnet upgradeability is not actually rehearsing the mainnet shape, just papering over the absence of one.

Repeating language used throughout:
- **Schema-wired** = the contract's address appears inside a registered EAS schema UID. Address change = re-register = old attestations orphaned.
- **State-bearing** = holds storage that other contracts read or that future upgrades must preserve.
- **URL-baked** = the contract's address appears inside `web3://` URLs ever issued (only EFSRouter today).
- **Stub** = no implementation worth migrating; the contract exists but its absence would be invisible.

## Per-contract analysis

### EFSIndexer (1188 LOC, schema-wired x4, state-bearing, deepest storage)

1. **Upgrade pattern**: Transparent proxy with strict storage-layout enforcement (`hardhat-upgrades` plugin). UUPS is tempting for gas (this is *the* hot path) but the upgrade auth logic living inside the implementation makes a bricking-upgrade more dangerous on the highest-stakes contract. Transparent's per-call delegatecall + admin SLOAD (~2.6k gas) is the wrong place to economize.
2. **Can change freely**: internal helpers (`_pushChild`, name-validation logic, depth-walk caps), view methods that synthesize from existing indices, gas-optimization rewrites that preserve storage slot positions, new view methods appended to the ABI, new fields *after* existing storage in new mappings, new error types.
3. **Frozen by external commitments**:
   - Address: baked into ANCHOR/DATA/PROPERTY/BLOB schema UIDs at registration (`SchemaResolver` base sets `_easRecipient`).
   - Storage layout: every existing `mapping`, `bytes32 public rootAnchorUID`, every immutable. Adding fields must append, never reorder.
   - Event signatures: `AnchorCreated`, `DataCreated`, `MirrorCreated`, `PropertyCreated`, `AttestationRevoked`, `AttestationIndexed`, `RevocationIndexed` — every off-chain indexer (Graph nodes, the prod client) keys on these.
   - The append-only-indices invariant (ADR-0009): an upgrade is not allowed to introduce code that mutates or compacts `_children`, `_schemaAttestations`, `_qualifyingFolders`, etc. Even a "fix" that removes a wrong entry violates the invariant.
   - The `wireContracts()`-once + `setSortsAnchor()`-once gates (ADR-0030). Upgrade cannot resurrect these; the storage values they wrote are part of the load-bearing state.
4. **Migration for breaking changes**: schema-field changes are not a proxy upgrade — they require a full re-deploy with new schema UIDs and orphan every existing attestation. There is no in-place migration story for ANCHOR/DATA shape. For *index-shape* changes that don't touch schemas (e.g. new lookup mapping for a new query pattern), a proxy upgrade plus a one-shot backfill function called by anyone is the only path; the backfill must be idempotent and rate-limited or pageable so a single tx isn't required.
5. **Cross-contract coupling**: TagResolver, MirrorResolver, EFSSortOverlay all call into EFSIndexer via narrow interfaces (`IEFSIndexerForTag`, `IEFSIndexerForMirror`, the `EFSIndexer` import in SortOverlay). Any function-signature change in those interfaces is a coordinated upgrade across all four contracts. The interfaces themselves are effectively frozen — *adding* methods is safe, *changing* them requires all consumers to upgrade in the same window.

### TagResolver / EdgeResolver (401 LOC, schema-wired, deep state)

1. **Upgrade pattern**: Transparent proxy. State-bearing (`_activeTag`, `_isApplied`, `_activeCount`, `_activeByAAS`, `_activeByAASIndex`, discovery mappings), schema-wired, and called by every TAG/PIN attestation. Treated identically to EFSIndexer for upgrade-safety purposes.
2. **Can change freely**: definition-validation logic, internal index-maintenance helpers, view methods, additional discovery indices appended after current storage, the count/swap-and-pop bookkeeping if existing slot positions are preserved.
3. **Frozen by external commitments**:
   - Address: TAG schema UID hashes it in.
   - The `_activeByAAS` swap-and-pop layout (ADR-0007) — the position-plus-one encoding is documented; consumers may inline that knowledge.
   - The contains-attestations sticky propagation contract (ADR-0010): one-way set, no clearing once a folder ever qualified. An upgrade that "fixes" this by adding clearing breaks ADR-0010 and is Tier-1.
   - The singleton-per-`(attester, target, definition)` semantic (`_activeTag` overwrite behavior). Behavioral change here breaks the cardinality contract.
   - The cardinality split between PIN (1) and TAG (N) — once code differentiates them, the per-cardinality state machines are part of the ABI.
4. **Migration for breaking changes**: If TAG semantics need to change (e.g. introducing a new applies-state beyond bool, or moving to per-`(attester, target)` non-`definition`-keyed singleton), the only path is a new schema UID + new resolver address. Old TAGs live on under the old schema forever and are invisible to the new resolver. There is no "migrate old TAGs into new shape" — EAS attestations are not mutable.
5. **Cross-contract coupling**: EFSIndexer (calls `propagateContains` / `clearContains` / `getParent` / `index` / `indexRevocation`). EFSFileView reads `isActivelyTagged` and `getActiveTargetsByAttesterAndSchema`. EFSRouter reads `getActiveTargetsByAttesterAndSchema`. Adding a new view method is free; removing or changing one breaks all three consumers.

### MirrorResolver (127 LOC, schema-wired, ~minimal state)

1. **Upgrade pattern**: Transparent proxy. Storage is shallow (`transportsAnchorUID`, the `_deployer` immutable, the `indexer` immutable). The body is mostly validation logic — the kind of code that *does* need post-launch fixing as URI parsing edge cases turn up.
2. **Can change freely**: scheme-allowlist contents (after careful ADR supersession — ADR-0023 governs), MAX_URI_LENGTH, MAX_TRANSPORT_DEPTH, the descent-walk implementation, internal helpers. Adding new allowed schemes is the most likely real upgrade.
3. **Frozen by external commitments**:
   - Address: MIRROR schema UID hashes it in.
   - The DATA-targeting rule (refUID must be DATA): callers and off-chain indexers depend on this.
   - The `setTransportsAnchor`-once gate.
   - The reject-on-bad-scheme behavior (consumers know revoked-or-rejected mirrors are absent from the kernel index).
4. **Migration for breaking changes**: changing the MIRROR schema fields (e.g. add a priority hint field) means a new schema. Soft-upgrade path: ship a *second* MIRROR-like schema alongside, give it a different resolver, have EFSRouter prefer the new one. Mirror state in the old schema stays usable.
5. **Cross-contract coupling**: EFSIndexer (calls `index`, `indexRevocation`, reads `DATA_SCHEMA_UID`, `ANCHOR_SCHEMA_UID`, `getParent`). EFSRouter reads mirror attestations through EFSIndexer's `getReferencingAttestations`, not MirrorResolver directly — so a MirrorResolver upgrade is a single-edge coordination, not a fan-out.

### EFSSortOverlay (678 LOC, schema-wired, large overlay state)

1. **Upgrade pattern**: Transparent proxy. Holds the most algorithmically subtle state in the system (per-`(sortInfoUID, parentAnchor)` doubly linked lists, `_lastProcessedIndex` cursors, reentrancy guard). High likelihood of needing optimization or bugfix passes during the devnet phase.
2. **Can change freely**: list-walking and chunking heuristics, MAX_PAGE_SIZE / DEFAULT_MAX_TRAVERSAL constants (semver concern but not invariant), reentrancy-guard implementation, internal `_insertAt` / `_advance` style helpers, event field additions *iff* moved to a new event (not modifying existing ones), new view methods.
3. **Frozen by external commitments**:
   - Address: SORT_INFO schema UID hashes it in.
   - The lazy-processing model (anyone can call `processItems`, gas-is-a-public-good per spec §07): callers wrote on the assumption that the next caller absorbs the cost. Changing to a permissioned processor breaks the third-party-extensibility story.
   - Linked-list storage layout: per-key `_next` / `_prev` mappings, the `_lastProcessedIndex` cursor positions. Migrating these is essentially "re-sort from scratch" and is gas-prohibitive at scale.
   - `ItemSorted` / `ItemRepositioned` event signatures: any external sort-tracker keys on them.
   - The reentrancy-guard semantics: external `ISortFunc` calls are explicitly out-of-trust; weakening the guard is a security regression.
4. **Migration for breaking changes**: a new sort algorithm = a new SORT_INFO attestation pointing at a different `sortFunc` (NameSort, TimestampSort, etc., or a new comparator). The schema itself doesn't have to change. A new sort *overlay shape* (e.g. switch from linked lists to skip lists) means a new contract, new schema UID, and re-attestation of every SORT_INFO. Old sorts continue to function but receive no upgrade benefit — accept the orphan.
5. **Cross-contract coupling**: EFSIndexer (reads `_children` / `_childrenBySchema`, calls `getChildren` / `getChildAt`). User-supplied `ISortFunc` contracts (NameSort, TimestampSort, and any third-party) — these are external trust boundaries, not coordination partners. EFSSortOverlay upgrades can be done without touching the comparators, and vice versa.

### EFSRouter (634 LOC, *not* schema-wired, *URL-baked*, stateless)

1. **Upgrade pattern**: **Not a proxy — redeploy.** Router holds no state worth migrating; ABI surface is the `IDecentralizedApp.request` function and a handful of view helpers. The catch is that the router's address is in every `web3://<router>/...` URL ever issued, so redeploy is a URL-namespace break, not a behavior break.
2. **Can change freely**: URL parsing, mirror-priority arbitration logic, edition-fallback chain, content-type assembly, chunk pagination logic, all of `_findDataAtPath` and `_getBestMirrorURI`, constants (MAX_PAGES, MAX_EDITIONS subject to ADR supersession). Any view-method addition.
3. **Frozen by external commitments**:
   - The `IDecentralizedApp.request` ERC-5219 ABI — external clients (any `web3://` resolver implementation) depends on it. Adding methods is fine; changing `request` signature breaks the standard.
   - The URL grammar accepted by `request` (path segments + `?editions=` + `?caller=` per ADR-0017): URLs in the wild assume this.
   - The single `message/external-body` content-type-header decision (ADR-0018): changing it would change how clients dispatch responses.
   - First-attester-wins fallback semantics (ADR-0031) — though this is currently flagged as a possible future change in QUESTIONS.md.
4. **Migration for breaking changes**: deploy a new EFSRouter alongside the old one. Both serve the same kernel state, so content is reachable from either; only the URL changes. The router address in URLs is a stable lookup, so old URLs continue to resolve at the old router until clients re-issue. This is the *only* contract in the system where a "soft fork" via parallel deployment works without orphaning attestations.
5. **Cross-contract coupling**: reads EFSIndexer, TagResolver (`ITagResolverForRouter`), implicitly any MIRROR / PROPERTY attestation via EFSIndexer. Upgrade of router does not require coordination with other contracts; *downgrades* in any other contract's view-method surface break router builds.

### EFSFileView (489 LOC, *not* schema-wired, stateless)

1. **Upgrade pattern**: **Not a proxy — redeploy.** Same story as EFSRouter but without URL baking, so redeploy is purely an address-book update. The internal Next.js debug UI and the production client at `efs-project/client` consume this; both can be pointed at a new address by config.
2. **Can change freely**: every directory-listing strategy, edition-merge logic, joining across TagResolver + EFSIndexer + (eventually) PropertyResolver, batched-read helpers, gas-optimization sweeps, all view methods.
3. **Frozen by external commitments**: only the *most heavily depended-on* view-method signatures (whatever the production client wires to). Even those can change — clients regenerate types and re-bundle. There's no on-chain commitment to any FileView ABI.
4. **Migration for breaking changes**: redeploy + client config update. Zero on-chain cost. The friction is purely "every consumer must learn the new address."
5. **Cross-contract coupling**: reads EFSIndexer + TagResolver. Adds no write surface. Easiest contract to evolve in the system.

### BlobResolver (22 LOC, schema-wired via BLOB_SCHEMA_UID, stub)

1. **Upgrade pattern**: Transparent proxy *if* BLOB is going to remain a distinct schema, otherwise retire. As a pure pass-through (`onAttest` returns true, `onRevoke` returns true) the upgrade question is "what would you upgrade it *to*?"
2. **Can change freely**: literally anything — there's no behavior to preserve.
3. **Frozen by external commitments**: address is baked into BLOB_SCHEMA_UID. That's it.
4. **Migration for breaking changes**: if BLOB needs real validation logic, an upgrade can introduce it without re-registering the schema. If BLOB needs *fields* added or removed, that's a new schema — re-deploy the resolver and a new schema with the new resolver address.
5. **Cross-contract coupling**: none currently. Indexed via EFSIndexer's `BLOB_SCHEMA_UID` immutable but no resolver-side interaction.

### FileResolver (22 LOC, *not* schema-wired in current deploy, stub)

1. **Upgrade pattern**: **Retire.** Not referenced by EFSIndexer's immutable schema UIDs; pure leftover from an earlier shape where files were a schema instead of DATA+PIN.
2. **Can change freely**: n/a — should be removed from the deploy script.
3. **Frozen by external commitments**: none (assuming truly unused — verify by grepping deploy scripts and the schema-registration list).
4. **Migration for breaking changes**: there's nothing to migrate.
5. **Cross-contract coupling**: none.

### PropertyResolver (22 LOC, **needed** but currently a stub)

1. **Upgrade pattern**: Transparent proxy if it grows real validation; otherwise the question is whether PROPERTY validation should be inlined into EFSIndexer's `onAttest` for the PROPERTY schema (currently EFSIndexer is itself the resolver for PROPERTY via `PROPERTY_SCHEMA_UID`). The on-disk `PropertyResolver.sol` stub is dead code, distinct from the *role*.
2. **Can change freely**: ADR-0024 (content-type sanitization) and any reserved-key constraints could land here or in EFSIndexer. If broken out, the resolver becomes the natural enforcement point.
3. **Frozen by external commitments**: if PROPERTY's resolver address is to be moved off EFSIndexer onto a dedicated PropertyResolver, that's a *schema re-registration* (Tier-1 in `agent-workflow.md`) and the old PROPERTY attestations become invisible. Hard fork.
4. **Migration for breaking changes**: the split-off decision should happen *now*, before launch, while PROPERTY's address isn't yet load-bearing. Post-launch, PROPERTY's resolver address is whatever it was at registration — moving it is equivalent to re-launching EFS.
5. **Cross-contract coupling**: EFSRouter reads PROPERTY for content-type assembly; EFSFileView reads PROPERTY for listing decorations. Both go through EFSIndexer's `getReferencingAttestations` today, not through PropertyResolver, so internal split is invisible to consumers.

### TopicResolver (124 LOC, not in canonical six)

1. **Upgrade pattern**: **Retire or excise.** Not part of the canonical contract set per `specs/overview.md`. The IRI-component validation logic inside it is the only re-usable piece.
2. **Can change freely**: irrelevant — should not deploy.
3. **Frozen by external commitments**: only if some external schema actually wired it. The default deploy script presumably does not; verify.
4. **Migration for breaking changes**: if any deployed schema wires TopicResolver, that schema's data goes orphan on retirement. Confirm none does.
5. **Cross-contract coupling**: none.

### SchemaNameIndex (37 LOC, optional helper)

1. **Upgrade pattern**: Redeploy. Stateful (`schemaNames` mapping) but the state is purely cosmetic ("nice name for schema X"); losing it is recoverable by re-indexing the underlying naming attestations.
2. **Can change freely**: conflict-resolution policy (current is "last write wins"), additional event fields, validation rules. Already not part of the spec's canonical six.
3. **Frozen by external commitments**: only if something external relies on `schemaNames(uid)` returning what's there today. Off-chain tools can recompute.
4. **Migration for breaking changes**: redeploy + re-call `indexAttestation` for every NAMING attestation. Stateless from the protocol's perspective.
5. **Cross-contract coupling**: none — it only reads EAS directly.

### Indexer.sol (legacy, 357 LOC, *not* in canonical set)

1. **Upgrade pattern**: **Retire.** This is the schema-blind precursor to EFSIndexer. Direction 1 of the decomposition brainstorm proposes resurrecting it as the kernel; the current Lists branch has moved past it.
2. **Can change freely**: n/a.
3. **Frozen by external commitments**: none if not deployed.
4. **Migration for breaking changes**: only relevant if Direction 1 is chosen post-freeze.
5. **Cross-contract coupling**: none.

### ImportHelper / MockChunkedFile / YourContract (test or scaffolding)

1. **Upgrade pattern**: not on the deploy critical path. ImportHelper is a build-time include. MockChunkedFile is test fixture. YourContract is Scaffold-ETH template. None ship to mainnet.
2-5: n/a.

### sorts/NameSort, sorts/TimestampSort + interfaces/ISortFunc

1. **Upgrade pattern**: Redeploy. Per ADR-0030 "Contracts that *can* be redeployed independently without data loss: ... comparators (NameSort, TimestampSort)." Each new comparator deploys as a new contract; SORT_INFO attestations pick a comparator by address.
2. **Can change freely**: comparator logic — but only by deploying a *new* contract. A given comparator address must continue to behave the same forever (existing SORT_INFO attestations rely on it).
3. **Frozen by external commitments**: per-deployed-address, the `ISortFunc.isLessThan` semantics are frozen. The interface itself (`ISortFunc`) is frozen by SortOverlay's call site.
4. **Migration for breaking changes**: deploy a new comparator at a new address; existing SORT_INFO attestations that want the new behavior must be re-attested with the new sortFunc address.
5. **Cross-contract coupling**: EFSSortOverlay calls them via `ISortFunc`. The reentrancy guard in SortOverlay treats comparators as untrusted, so the coupling is one-way and weak.

## Comparison matrix

| Contract | Pattern | Schema-wired | URL-baked | State depth | Storage layout frozen | Event sigs frozen | Cross-contract fan-out | Worst-case migration |
|---|---|---|---|---|---|---|---|---|
| EFSIndexer | Transparent proxy | yes (4 schemas) | no | deep | yes | yes | high (resolvers + views) | Full redeploy + orphan |
| TagResolver | Transparent proxy | yes (TAG, PIN) | no | deep | yes | weak (few events) | high (indexer + views) | New schema + orphan |
| MirrorResolver | Transparent proxy | yes (MIRROR) | no | shallow | yes | none | low (indexer only) | Parallel new MIRROR schema |
| EFSSortOverlay | Transparent proxy | yes (SORT_INFO) | no | deep (linked lists) | yes | yes | low (indexer + comparators) | New sort contract, re-attest |
| EFSRouter | Redeploy | no | yes | none | n/a | n/a | reads many | Parallel deploy, URL break |
| EFSFileView | Redeploy | no | no | none | n/a | n/a | reads two | Address-book update |
| BlobResolver | Proxy or retire | yes (BLOB) | no | none | n/a | n/a | none | Add real logic or retire |
| FileResolver | Retire | no (if unused) | no | none | n/a | n/a | none | Delete from deploy |
| PropertyResolver | Decide before freeze | TBD | no | none | n/a | n/a | none | Frozen post-launch |
| TopicResolver | Retire | no (verify) | no | minimal | n/a | n/a | none | Delete from deploy |
| SchemaNameIndex | Redeploy | no | no | shallow | no | weak | none | Re-index |
| Indexer.sol | Retire | no | no | n/a | n/a | n/a | none | — |
| NameSort/TimestampSort | New deploy per change | no (but referenced by SORT_INFO data) | no | none | n/a | n/a | called by SortOverlay | Re-attest SORT_INFO with new addr |

## Cross-cutting upgradeability patterns

- **Every resolver couples its event signatures to indexer ABI.** TagResolver, MirrorResolver, EFSSortOverlay, and EFSIndexer itself all emit events that off-chain indexers (the production client at `efs-project/client`, future Graph subgraphs) wire to. Adding fields to existing events is a soft break — typed parsers reject. Strategy: only *add new events* in upgrades, never modify existing ones.
- **The `wire-once` gates are upgrade traps.** `EFSIndexer.wireContracts()`, `setSortsAnchor()`, `MirrorResolver.setTransportsAnchor()` all use deployer-only-once patterns. An upgrade can introduce a *new* once-gate (for a newly-added partner contract), but cannot reset an existing one. Anyone who proposes "let's re-wire to point at the new TagResolver" is proposing an ADR-0030 violation.
- **Schema-wired addresses make merging impossible, splitting cheap.** Brainstorm v1 (contract decomposition) called this out as a general principle: you can split a contract post-launch by deploying a new sibling that handles a subset of work (e.g. carve PROPERTY off EFSIndexer eventually by deploying PropertyResolver alongside and migrating *new* PROPERTY writes there — but old ones are stuck). You *cannot* merge two contracts because both have their own schema-UID-baked addresses. Bias for splitting more contracts now.
- **The interface-as-contract trap.** Each resolver imports a "minimal" interface for EFSIndexer (`IEFSIndexerForTag`, `IEFSIndexerForMirror`). These interfaces become *de facto frozen* because the resolver implementation has the interface compiled into its bytecode. Upgrading EFSIndexer to *remove* one of these methods breaks the resolver call at runtime — even if the new EFSIndexer is otherwise compatible.
- **Append-only invariants forbid bug-fix-by-overwrite.** ADR-0009 says indices stay append-only. A proxy upgrade can change *future* writes but cannot retroactively prune. The fix-shape that comes naturally to other contracts ("write a one-shot to clean up the corrupted entries") is illegal here. The only legal fix shape is "future writes filter out the bad ones at read time" — which means readers must internalize the bug forever.
- **Initializer guards must replace constructors on proxy.** Every contract with a constructor (all of them) needs the constructor's logic moved to an `initialize()` with `initializer` modifier when wrapped in a proxy. Storage layout reservation gaps (`uint256[50] private __gap`) should be added to every state-bearing contract *before* devnet launch — adding them later changes layout.
- **EFSRouter is the only contract with a working "soft fork" upgrade path.** Because it's not schema-wired and is stateless, you can deploy v2 alongside v1, and clients pick a router by URL prefix. This is uniquely valuable. Avoid designs that would erode that property (e.g. moving any persistent state into EFSRouter).
- **Per-call gas overhead asymmetry.** A proxy in front of EFSIndexer adds ~2.6k gas to every attestation in the system (every TAG, every MIRROR, every PIN triggers EFSIndexer index/propagate calls). A proxy in front of EFSSortOverlay only costs gas to processItems callers. A proxy in front of MirrorResolver only costs gas at MIRROR attestation time. The cost-per-flexibility differs by an order of magnitude across contracts; uniform proxy treatment is wasteful.
- **Storage gaps cost devnet flexibility.** Conventional OZ advice is to add `uint256[N] __gap` arrays for each contract slot reservation. EFSIndexer's storage shape is heterogeneous (mappings of mappings, immutables) — gap placement requires care. If gaps aren't added before *any* state lands on devnet, the gap option is lost.
- **ABI-compatible bug fixes are the realistic upgrade target.** The realistic devnet upgrade scenarios are: scheme allowlist tweaks, MAX_* constant adjustments (subject to ADR supersession), validation off-by-one fixes, performance rewrites of view methods. None of these require storage changes. A simpler-than-OZ upgrade pattern (e.g. swap the implementation via a manual ERC-1967 storage slot) might be enough for most realistic fixes; full TransparentUpgradeableProxy scaffolding may be over-engineering for the small upgrade surface that actually has to happen.
- **The PROPERTY-resolver-location decision is irreversible after schema registration.** PROPERTY's resolver address is EFSIndexer's today (PROPERTY_SCHEMA_UID is registered with EFSIndexer as the resolver). Moving PROPERTY validation into a dedicated PropertyResolver post-launch requires a new PROPERTY schema, orphaning all existing PROPERTY attestations. This decision is Tier-1 and needs to land before devnet relaunch if it's going to land at all.

## Controversial human design choices

- **Choice:** Which proxy pattern for devnet (and by extension what mainnet would deploy *if* mainnet ever permits upgrades)?
  - **Options:** TransparentUpgradeableProxy (OZ default) / UUPS / Beacon / per-contract custom ERC-1967 minimal / no proxy (just redeploy when needed and accept devnet data loss).
  - **Tentative read:** Transparent for the schema-wired four (EFSIndexer, TagResolver, MirrorResolver, EFSSortOverlay) because the upgrade-bricking risk is highest there; no proxy at all for EFSRouter / EFSFileView / SchemaNameIndex (just redeploy); skip BlobResolver / PropertyResolver decision pending the freeze.
  - **Why controversial:** Transparent's per-call gas hit lands hardest on EFSIndexer which is on the hot path. UUPS halves the gas but moves upgrade auth into the implementation, where a bad initialize-of-the-implementation can brick. James has not picked yet (QUESTIONS.md tier-2 still open).

- **Choice:** Does mainnet inherit the proxy pattern or stay direct-deploy per ADR-0030?
  - **Options:** Direct-deploy mainnet (current ADR), proxied mainnet (supersede ADR-0030).
  - **Tentative read:** Keep ADR-0030 as written. Credibly-neutral archive narrative is the load-bearing differentiator; an admin upgrade key on mainnet collapses it. Devnet/Sepolia exist precisely to absorb the iteration cost so mainnet doesn't have to.
  - **Why controversial:** A genuinely critical mainnet bug post-launch means full re-deploy and data orphan. The asymmetry between "devnet upgradeable, mainnet not" is also a *test* asymmetry — bugs that only emerge under upgrade-state-shape edge cases never get exercised pre-mainnet.

- **Choice:** Does PROPERTY get its own resolver (PropertyResolver) before launch, or stay folded into EFSIndexer?
  - **Options:** Split now and accept the extra contract / leave folded and accept that PROPERTY can never be split later without orphaning.
  - **Tentative read:** Split now. The cost of one more contract is small; the cost of being stuck with PROPERTY-in-EFSIndexer forever is potentially large (PROPERTY is the most likely schema to grow reserved-key constraints, content-type sanitization, MIME-allowlist, etc., all of which want resolver-side enforcement).
  - **Why controversial:** Adds work right before freeze; PROPERTY's current no-op behavior may be all it ever needs.

- **Choice:** Storage gap reservation strategy (`uint256[N] __gap`) — add to every state-bearing contract or rely on append-only patterns?
  - **Options:** Add gaps to all four schema-wired contracts before devnet / rely entirely on append-only field discipline / mixed (gaps in EFSIndexer + TagResolver, none in others).
  - **Tentative read:** Gaps in EFSIndexer + TagResolver + EFSSortOverlay (the three deepest-state contracts). MirrorResolver's storage is shallow enough that append-only works. The cost of gaps is one slot per gap entry × number of gaps, which is essentially zero.
  - **Why controversial:** Gaps are OZ orthodoxy but Solidity inheritance + mappings make them less load-bearing than they look; some teams have stopped using them. Disagreement could land either way.

- **Choice:** Retire the stubs (BlobResolver, FileResolver, PropertyResolver-as-stub, TopicResolver, YourContract, Indexer.sol) before or after freeze?
  - **Options:** Delete from repo entirely before freeze / leave in repo but exclude from deploy / formal deprecation note inside each file.
  - **Tentative read:** Delete before freeze. Every stub is a foot-gun for future agents who don't know it's dead. Git history preserves them.
  - **Why controversial:** James may want to keep some (e.g. BlobResolver if BLOB schema is still on the roadmap; TopicResolver if Topic-as-Anchor pattern is being revisited).

## Unknown questions for future brainstorms

- **Question:** What's the smallest realistic devnet upgrade surface — i.e. across the bugs / changes EFS has actually shipped in the last 6 months, how many would have *required* a storage-layout-affecting upgrade vs being implementation-swap-only?
  - **Brainstorm shape that would answer it:** a `bs-historical-upgrades-v1` brainstorm walking git history of EFSIndexer / TagResolver / EFSSortOverlay and categorizing each non-trivial commit as (a) implementation-only, (b) added storage, (c) reordered storage, (d) changed event/ABI.
  - **What it would unlock:** the decision between full TransparentUpgradeableProxy ceremony vs a much simpler "manually update an implementation pointer" pattern. If historical evidence shows 90% of fixes were implementation-only, the simpler pattern is justified.

- **Question:** What's the gas penalty of TransparentUpgradeableProxy on the *full* upload flow (8 transactions per file per `overview.md` §upload flow), end-to-end?
  - **Brainstorm shape that would answer it:** a `bs-proxy-gas-walkthrough-v1` brainstorm that traces a representative upload (DATA + MIRROR + PROPERTY + ANCHOR + TAG) and adds 2.6k × n_resolver_calls overhead, comparing to current totals.
  - **What it would unlock:** a numerical anchor for the proxy-pattern decision (and for the devnet/mainnet asymmetry argument).

- **Question:** Can EFSSortOverlay's linked-list storage be made "self-migrating" — i.e. on upgrade, lazily walk the list at read time and convert to the new shape, without a one-shot backfill?
  - **Brainstorm shape that would answer it:** a `bs-sort-overlay-migration-v1` brainstorm focused on the linked-list-to-skip-list (or any future restructure) migration mechanic.
  - **What it would unlock:** confidence that EFSSortOverlay can be upgraded *meaningfully* without losing the existing sort state. If "no", SortOverlay's upgrade story collapses to "redeploy + accept loss."

- **Question:** What's the right ABI for "I will be a future resolver of schema X" — should every resolver expose a probe interface (e.g. `function isResolverFor(bytes32 schemaUID) external view returns (bool)`) so off-chain tooling can verify schema-resolver wiring without trusting the schema registry?
  - **Brainstorm shape that would answer it:** a `bs-resolver-introspection-v1` brainstorm.
  - **What it would unlock:** safer deploy scripts, less risk of mis-wiring during the deploy-before-register dance (ADR-0027).

- **Question:** Should EFSRouter v2 / v3 / ... be discoverable on-chain (a registry) or off-chain (client config)?
  - **Brainstorm shape that would answer it:** a `bs-router-versioning-v1` brainstorm exploring URL-stability over a multi-router future.
  - **What it would unlock:** the "soft fork via parallel deploy" property either stays free (off-chain config) or becomes contentious (on-chain registry implies governance).

## Blockers / concerns

- **What's blocked:** Any devnet upgradeability implementation work. **The blocker:** the open Tier-2 question in `docs/QUESTIONS.md` about TransparentUpgradeableProxy vs UUPS. **Who/what could unblock:** James, with a one-line answer. The default-if-not-answered is Transparent + hardhat-upgrades, but no work has actually started against the default.

- **What's blocked:** Confidence in the per-contract upgrade story above. **The blocker:** the contract-decomposition design thread is unresolved (`bs-contract-decomposition-v1` lists 5 directions, none chosen). If Direction 3 (2-contract kernel + gateway) is chosen, most of this brainstorm's per-contract analysis is moot. **Who/what could unblock:** James + a contract-architecture design promotion. This brainstorm assumed Direction 2 (status quo Lists branch) as the most-likely freeze shape.

- **What's blocked:** PROPERTY-resolver split-or-fold decision. **The blocker:** Tier-1 — schema re-registration is the only way to move PROPERTY's resolver address post-launch. **Who/what could unblock:** James, with a freeze-time decision (split-now-or-never).

- **What's blocked:** Storage-gap addition to existing contracts. **The blocker:** must happen *before* devnet state lands; once `_children`, `_activeByAAS`, etc. have real data, the gap position is fixed wherever it currently isn't. **Who/what could unblock:** a Tier-3 implementation pass on the four schema-wired contracts, ideally in the same window as the proxy-pattern decision.

- **What's blocked:** Stub-retirement cleanup. **The blocker:** confirmation that nothing in the current devnet deploy script wires BlobResolver, FileResolver, PropertyResolver-stub, TopicResolver. **Who/what could unblock:** a quick grep of deploy scripts + a James confirm. Not architecturally blocked, just attention-blocked.

- **What's blocked:** Cross-contract interface freeze. **The blocker:** no single document declares which methods on EFSIndexer are part of the resolver-facing ABI vs the view-facing ABI vs internal. Without that, an "ABI-additive" upgrade discipline is enforced by goodwill, not by anything checkable. **Who/what could unblock:** an `Interfaces/` directory or a section in `specs/03-Onchain-Indexing-Strategy.md` enumerating frozen-vs-free methods.

- **Concern:** The mainnet-permanence ADR (0030) and the devnet-upgradeability ambition are in tension. Devnet upgrades exercise *upgrade-state-shape* invariants that mainnet (which never upgrades) never tests. A bug that only surfaces under upgrade *would* surface in devnet and never on mainnet — which is fine. But the inverse: any upgrade-related code complexity (initializers, gaps, storage-versioning helpers) lives in mainnet bytecode without ever being exercised. Worth a future brainstorm on whether to compile mainnet without that complexity at all (separate proxy-aware and proxy-free builds).
