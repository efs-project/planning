---
agent: bs-system-design-perspectives-v1
date: 2026-05-26
status: raw
anchors:
  - area: contracts
  - area: sdk
  - brainstorm: 2026-05-26-bs-contract-decomposition-v1
---

# EFS contract surface from N system-design angles

The contract decomposition brainstorm (`bs-contract-decomposition-v1`) frames the shape-freeze as a *count* question — three contracts vs five vs two — but the count is downstream of who's being served. The third-party-dev brainstorm covered one consumer: a TypeScript jockey reading and writing in a browser. That's the dominant case but not the only one, and several of the consumers below are weight-bearing for credible neutrality, archive-grade permanence, or cross-chain trust — properties EFS sells. This file walks through eight system-design perspectives that *aren't* "a person hand-coding `efs.read()`": automated pipelines, off-chain mirrors, infrastructure operators, and protocol-level consumers. Each one looks at the same kernel + resolvers + indexer + router surface and sees different bones.

Throughout I'll use Glossary terms (lens, PIN/TAG, qualifying folder) and assume the current Lists-branch five-or-six-contract layout (`EFSIndexer`, `EFSRouter`, `EFSFileView`, `EdgeResolver`, `MirrorResolver`, `EFSSortOverlay`) as the baseline surface a consumer sees. Where a perspective would *change* if Direction 1 (3-contract) or Direction 3 (2-contract) won, I'll note it inline.

## Perspective 1: L2 sequencer (rollup operator)

**Who they are.** Operator of an EVM rollup (Optimism-style, Arbitrum-style, or a Stage-0 app-chain). Their job is to take a stream of user transactions, order them, execute them in a deterministic VM, and post a state-root + a compressed transaction batch to L1. Some of those transactions are EFS attestations made by users who chose this rollup as their EFS deployment target.

**What they want from EFS.** Predictable per-attestation gas. Cheap calldata. A way to *batch-validate* many EFS attestations in one execution pass without crossing the L1 bridge. They want the resolver hooks to be cheap (so the rollup's per-block budget isn't dominated by EFS writes) and they want to be able to advertise EFS attestation throughput as a number they can defend ("our chain does 50 EFS uploads per second").

**What works well.**
- EAS is just a contract; the sequencer doesn't have to know about it specifically.
- The append-only kernel pattern means no in-resolver `delete` ops or O(N) compaction — every write has a roughly predictable cost ceiling.
- Edge schemas with bounded `MAX_ANCHOR_DEPTH = 32` mean the gas envelope per attestation is computable from schema alone.
- Multi-attest is supported by EAS, so an upload sequence can land in one tx.
- Resolver hooks are normal contract calls — the sequencer treats them as standard EVM execution, no special handling needed.

**What's painful or impossible.**
- The `_qualifyingFolders` write-time index (ADR-0008) fires on every ANCHOR creation and walks ancestors — gas cost depends on tree depth, which depends on user behavior, which the sequencer can't bound a priori.
- The `propagateContains` walk on PIN writes is the same shape.
- `_activeByAAS` swap-and-pop has predictable cost but every PIN supersession costs an SSTORE + a couple of array ops on a hot mapping shared by all attesters at that slot — contention isn't a problem on rollups today but becomes one if EFS gets popular.
- Batch validation across the resolver chain (EAS → `EdgeResolver` → `EFSIndexer` → ancestor walk → propagation) costs CALLs that don't compress well into the rollup's calldata budget; nothing in the resolver chain is designed to be DA-friendly.
- The sequencer cannot pre-validate "will this batch of 100 attestations fit in this block" without simulating the full resolver chain, which is wasted work if anything reverts.
- No "fee on attestation" hook means the sequencer can't charge EFS-specific pricing for the resource-heaviest writes — it's all bundled into base gas.

**Architectural ask.** A *quoted-gas API* on each resolver: `quoteAttestGas(schema, encodedData, parents) → uint256` that returns a tight upper bound without state mutation. Lets the sequencer admit/reject candidates pre-execution. Failing that, a published per-schema cost table the sequencer can hardcode (with worst-case assumptions for tree depth). Also: a batch-attest fast path that amortizes resolver overhead — e.g., a `multiAttestSameParent(ANCHOR_SCHEMA, parent, names[])` that does one ancestor walk for all anchors instead of N. Bonus: a compressed-calldata variant of multi-attest that the sequencer can advertise as a chain-native primitive ("EFS-aware compression on Optimism").

**Where the friction concentrates.** Anything that walks the tree at write time. The `_qualifyingFolders` walk is a worst-case-O(MAX_ANCHOR_DEPTH) operation, which is 32 SSTOREs in the pathological case — about 700k gas just for the index update, ignoring the actual attestation cost. A user uploading into `/users/alice/photos/2026/05/26/cat.jpg` pays for that ancestor walk every time. Multiply by the number of users on a busy rollup and the EFS-induced gas budget on the rollup becomes a planning concern, not an afterthought.

**Shape-freeze influence.** Argues for *fewer* contracts on the hot path (each cross-contract CALL is observable in the gas profile) but *more* contracts off the hot path (separate resolvers don't matter to the sequencer once the call lands). Strongly argues for Direction 3 (2-contract kernel) *if* bytecode size allows. Argues against Direction 5's strict per-layer split because each cross-layer write is a cross-contract CALL the sequencer pays for. Independently: argues for *publishing* a gas envelope as part of the freeze, not just contract addresses — a rollup operator needs to know the worst-case cost of an attestation before they recommend EFS to their users, and "go simulate it" isn't an answer they can put in a docs page.

## Perspective 2: Indexer node (third-party off-chain mirror)

**Who they are.** Operator of a service that runs an off-chain mirror of EFS state. Could be a Graph subgraph, an Envio indexer, a custom Postgres pipeline ("EFS-in-Postgres" per the flag in `bs-third-party-dev-ux-v1`), or an internal data warehouse at a company that wants fast queries against EFS without per-call RPC roundtrips. They subscribe to events, replay them into a relational or graph model, and expose a query API (GraphQL, REST, SQL) to downstream consumers.

**What they want from EFS.**
- A complete, ordered, lossless event stream that lets them reconstruct any view EFS exposes on-chain.
- Idempotency keys on every event so replay is safe.
- Schema-tagged events so they don't have to decode EAS attestation calldata to know what they're looking at.
- A way to detect when their mirror has fallen behind ("am I caught up to chain head?").
- Per-schema indexed fields tuned to the dominant JOIN keys their downstream consumers actually use (definition + attester for PIN, parent + attester for ANCHOR, etc.).

**What works well.**
- `EFSIndexer` already emits structured events with indexed fields chosen for off-chain consumption (`AnchorCreated`, `DataCreated`, `MirrorCreated`, `PropertyCreated`, plus `AttestationRevoked` and `RevocationIndexed`).
- `DataCreated` includes `contentHash` directly so the off-chain mirror doesn't have to decode the DATA attestation to populate a content-hash index.
- `EFSSortOverlay.ItemSorted` includes neighbour pointers, which means the off-chain mirror can rebuild the linked-list order without scanning siblings.
- Events are emitted from resolver hooks, so they cover the schema-aware index writes, not just raw EAS attestations.
- The kernel's `index()` and `indexBatch()` public APIs let third-party schemas plug into the same discovery indices — so the off-chain mirror only has to wire one event stream, not one per schema.

**What's painful or impossible.**
- PIN/TAG attestations don't have their own kernel-emitted event today — they go through `EdgeResolver` which calls `indexer.index(uid)`, which emits a generic `AttestationIndexed`. The indexer node has to do a follow-up EAS read to decode the PIN/TAG fields. That's an extra RPC per edge.
- The `_qualifyingFolders` and `_containsAttestations` propagation walks emit nothing — the off-chain mirror has to re-derive ancestor flags by walking parents itself, duplicating on-chain work.
- Lens-scoped views (the heart of EFS) require an extra computation pass: the off-chain mirror has to materialize per-lens views from raw attestations because no event says "here's the canonical content under lens X at path Y."
- Revocation events come in two flavors (`AttestationRevoked` from native schemas vs `RevocationIndexed` from externally-resolved schemas) and the mirror has to subscribe to both, with no single firehose.
- The `SchemaNameIndex`/router parsing logic is off-chain-only and the indexer node can't reuse it without re-implementing the URL parser.
- Sort overlay state changes via `processItems` emit per-item events but no "batch boundary" marker — the mirror can't tell when a sort-overlay rebuild is "complete enough to serve queries from."

**Architectural ask.** Per-schema structured events: `PinCreated(definitionUID, targetUID, attester, weight)` and `TagCreated(...)`, emitted from `EdgeResolver`, indexed on the fields people actually filter by (definition + attester is the dominant join). Or — more ambitiously — every resolver should emit a `<Schema>Changed(uid, attester, ...domain fields...)` event on every state-mutating call. Also: a `SortOverlayResynced(parentUID)` event when `processItems` adds items, with the list of UIDs added in order, so the off-chain mirror can match the lazy on-chain rebuild without re-running the sort comparator. And a documented "minimum event set to reconstruct full state" — analogous to ERC-20's `Transfer`-event-only state model, where a node can rebuild balances purely from log subscription.

**The Postgres-shape pain.** The "EFS-in-Postgres" pattern flagged by the third-party-dev brainstorm is the dominant indexer node shape today. Postgres wants typed columns; EAS attestation calldata is bytes that has to be decoded with an ABI. Without per-schema events with already-decoded indexed fields, the indexer node ends up with a Postgres column called `raw_data BYTEA` and a worker process that decodes it row-by-row. The fix is upstream (more typed events) rather than downstream (every indexer reimplements ABI decoding).

**Catching up after downtime.** An indexer node that goes offline for a day has to catch up by re-scanning every block of events. Today that means subscribing to a heterogeneous mix of events from 5-6 contracts and reordering them by block. A "firehose" event from a known address (the kernel) makes this much easier — but the current event surface isn't designed as a firehose, it's designed as a per-contract emission. Some indexer implementations end up subscribing to the EAS `Attested` event instead and re-implementing all of EFS's resolver logic off-chain. That's the *opposite* of what EFS wants.

**Shape-freeze influence.** Argues for *more* schema-aware events, which is independent of the contract count axis. But: if more contracts are kept (Direction 2 or 5), each one needs its own event taxonomy and the off-chain mirror's wiring grows linearly. If fewer contracts (Direction 3), event names can be consolidated. Either way, the *count and quality of events is more load-bearing for this perspective than the count of contracts*. Argues strongly for treating events as part of the frozen ABI — not "nice to have" but "any consumer downstream depends on these signatures forever."

## Perspective 3: Hardware wallet user (per-attestation signer)

**Who they are.** A user holding their keys on a Ledger or Trezor. Every EFS write requires a tx signature, which means a USB unlock, a button press, and a screen-by-screen review of calldata on a tiny embedded display. They're not a developer; they're an end-user who wants the security properties of cold storage while still being able to upload a file to EFS.

**What they want from EFS.** As few signatures as possible per logical operation. Human-readable confirmation prompts: the hardware wallet display should say "Upload file `cat.jpg` to `/photos/`" not "Sign attestation with calldata 0xabcd…". Atomicity: if a 3-tx sequence fails halfway, they don't want orphaned anchors littering EFS forever. Fee predictability: the wallet should be able to show total fee before they start signing.

**What works well.** Honestly, not much. EAS supports `multiAttest`, so a six-attestation upload *can* land in one transaction if the wallet supports the EIP-712 multi-attest payload. Some hardware wallets do; many don't.

**What's painful or impossible.**
- A new file upload is six-to-eight attestations (DATA, MIRROR, PROPERTY contentType, PROPERTY name, ANCHOR, PIN, sometimes more) per `bs-third-party-dev-ux-v1`. Each one signed individually means six-to-eight button presses on a Ledger.
- EAS calldata renders as opaque hex on hardware wallet displays because there's no EIP-712 schema descriptor that translates EFS attestation data to human-readable fields. The hardware wallet has no way to know "this is an EFS upload" vs "this is a random EAS attestation" — they look identical at the calldata level.
- Anchor creation is non-revocable: a partial upload (anchor + data, no PIN yet) leaves a permanent dead anchor in the tree. There's no rollback.
- The `?lenses=` URL param model means the *reader* picks lenses, but the *writer*'s perspective on "who am I writing for" is implicit (they write as themselves and trust that readers will choose them as a lens) — fine in concept, confusing on a wallet display.
- Total upload fee cannot be displayed before signing the first transaction because each subsequent attestation depends on the UID of the prior one (DATA UID feeds into MIRROR's `refUID`, etc.). The wallet can't show "this upload will cost 0.003 ETH total" up front; it can only show one tx at a time.
- Multi-attest payloads, where supported, render as a single jumbo calldata blob — better than N prompts but still opaque hex on the wallet display.

**Architectural ask.** A canonical EIP-712 "Upload" struct that bundles the full attestation set under one signature: one `efs.uploadFile({path, contentHash, mirrors, properties})` typed-data payload that the resolver chain unpacks into the underlying attestations. Lets the hardware wallet render "Upload `cat.jpg` (1.2 MB) to `/photos/`, signed by 0xabc…" in one screen. Alternatively, a stronger commitment: a wrapper contract `EFSUploadGateway` that takes a single signed payload and emits the full attestation cascade itself, charging one signature instead of N. Also: revocability for orphaned anchors created by a failed upload (controversial — breaks ADR's append-only-anchor stance, but otherwise a hardware-wallet user who aborts mid-upload is leaving permanent litter in the tree forever).

**The deeper UX problem.** Even with a single signature, the hardware wallet has to display *something*. Today there's no EAS metadata registry that says "schema UID 0x1234… is EFS DATA, here are the field names." A Ledger app written for EAS could parse and display attestation fields if EAS had a manifest standard, but it doesn't. EFS could ship one: a deploy-time PROPERTY attestation under `/manifest/` that names each schema's fields, which a Ledger app could fetch and use to render uploads. That's a small contract-surface ask with a large UX payoff.

**Adjacent user: smart-contract wallets / 4337.** Account-abstraction wallets (Safe, Argent, ERC-4337) face a similar but milder version: they can bundle attestations into a single UserOperation, but the bundler still pays for each resolver hook. The "1 signature, N attestations" gap closes for AA users but the per-attestation gas cost doesn't. The two user populations — hardware wallet (UX-bottlenecked) and AA wallet (gas-bottlenecked) — both benefit from the same gateway design but for different reasons. The gateway answer doesn't have to choose between them.

**Shape-freeze influence.** This perspective is mostly orthogonal to the contract-count axis — even a 2-contract kernel doesn't reduce the signature count, because the count comes from how many distinct EAS attestations are needed to represent an upload. The fix lives one layer up (an upload-gateway contract that doesn't exist yet). Argues for *adding* a gateway contract pre-freeze rather than picking from existing ones. Argues against any decomposition that *increases* per-upload contract surface (Direction 5's strict per-layer split would mean ANCHOR creation, DATA + PROPERTY writes, and PIN writes hit three separate contracts — even more cross-contract reentrancy paths to fit into one signed bundle).

## Perspective 4: Search engine / crawler

**Who they are.** A crawler trying to discover EFS content by topic, build an inverted index, and answer queries like "files about carbonara, sorted by recency, filtered to my web-of-trust." Could be a dedicated EFS search engine, a general-purpose web crawler that learned to follow `web3://` URLs, or a vertical search tool (recipe search, image search) that wants EFS as a corpus.

**What they want from EFS.** A way to enumerate "all DATAs with contentType `text/markdown`" without scanning every attestation. A topic discovery surface — "what topics exist under `/recipes/`?" "what files have the `#carbonara` TAG?" Lens-aware result ranking: the crawler should be able to surface results filtered to a user's lens set. Cheap "has this changed?" probes so re-indexing is incremental.

**What works well.**
- `getReferencingAttestations(targetUID, TAG_SCHEMA_UID, ...)` lets the crawler find "what targets have been tagged" once it knows the definition Anchor.
- `dataByContentKey` provides content-addressed dedup so the crawler can skip re-indexing duplicate content.
- `getAnchorsBySchemaAndAddressList` lets the crawler filter directory children by schema (e.g., "DATA-shaped children only, from these attesters").
- Topic discovery is implicit in the path structure — `/recipes/italian/pasta/` is itself a topic hierarchy.
- The `/tags/` convention gives a known "where to look for tags" entry point — limited but real.

**What's painful or impossible.**
- No global "all DATAs" enumeration — `_attestationsBySchema[DATA_SCHEMA_UID]` exists but is unbounded. The crawler has to paginate through hundreds of thousands of entries to do a single full pass.
- No "content type" index — to find all `text/markdown` files, the crawler has to enumerate all DATAs and then for each one fetch the contentType PROPERTY, which is O(N) of contract calls.
- No "what tags exist" enumeration that's not scoped to a specific definition; the crawler has to enumerate `/tags/`'s children, then for each definition enumerate `_taggedTargets`.
- No "this changed" cheap probe — the crawler either subscribes to events (heavyweight) or re-paginates everything.
- PROPERTY-by-value lookups (find all files with `previousVersion = X`) are unsupported at any layer.
- The reserved `/tags/` folder is a convention, not an index, so a crawler relying on it has to hope users haven't put files in `/tags/foo` that are actually tag definitions vs tagged content.
- Lens-aware ranking is up to the crawler entirely — the on-chain surface gives raw attestations, not ranked results.
- Topic discovery across attesters has no native primitive — "what topics does alice attest under" requires walking alice's outgoing attestations and grouping by parent anchor, which is an O(alice's-attestation-count) operation.

**Architectural ask.** A schema-aware secondary index keyed by (schema, indexedField) where the schema author can declare an indexable field (e.g., PROPERTY's `key`, MIRROR's URI scheme, DATA's contentHash prefix). Reads become `getAttestationsByField(schemaUID, fieldName, fieldValue, start, length)`. Failing that: an off-chain indexer event firehose with field-by-field structured events (cf. Perspective 2). Also: a `lastChangedBlock(targetUID)` lookup so the crawler can do efficient incremental crawls. Topic discovery would benefit from a published "tag taxonomy" convention beyond `/tags/` (per-language tags, tag hierarchies, tag aliasing) — though this is partly off-chain UX, not contract surface.

**Ranking adjacency.** A search engine's hardest problem is ranking, not retrieval. EFS gives the crawler raw attestations; ranking signals (popularity, freshness, trust) have to come from somewhere. The lens model is partial: it lets users specify "rank by these attesters" but doesn't give the crawler a global signal. A future "implicit weight from follow graph" mechanism (cf. Perspective 8) would help, but it doesn't exist. In the meantime the crawler resorts to off-chain signals — attestation count, timestamp, address activity — that are all gameable. The credibly-neutral framing actually *complicates* search ranking, because the crawler can't lean on any centralized authority signal.

**Cold-start crawl.** First-time indexing of EFS is the hardest case: the crawler has no prior state, has to discover everything from scratch, and has to paginate through every schema's append-only array. With no cursor checkpoint format published, every crawler implementation does this slightly differently and reaches different "fully synced" states. A canonical "snapshot index" — a hash of all attestation UIDs up to a given block — would let crawlers compare notes and detect drift. None exists today.

**Shape-freeze influence.** Argues for explicit *indexable-field declarations* in the schema set, which is a schema-level concern more than a contract-count concern. But: if a search engine is a credible consumer, the contract surface has to *not* preclude this kind of indexing. Direction 3 (kernel + gateway) makes adding crawler-friendly indices in the future easiest (one contract to extend); Direction 5 (strict per-layer) makes it hardest (which layer does a content-type index live in?). Independently: argues for treating the off-chain event ABI as canonical, since the crawler is the consumer most dependent on it.

## Perspective 5: Privacy preserver (commit-without-reveal)

**Who they are.** A user (or app) who wants to participate in EFS without exposing the *content* of their attestations. Could be a journalist who wants to commit to having seen a document at time T without revealing the document. Could be a private file-share tool building on EFS for permanence but encrypting the bytes. Could be a researcher who wants to publish a hash of a hypothesis (commit-then-reveal). Could be an enterprise that wants EFS audit-trail properties without leaking IP.

**What they want from EFS.** A way to attest "I have something at this path with this hash" without attaching public retrievable bytes. Encrypted MIRRORs that the router serves as ciphertext, with off-chain key distribution. Time-locked reveals: commit now, reveal in N blocks. Selective disclosure: prove to a verifier that a given DATA matches a Merkle proof of some claim without revealing the rest. Plausible deniability for the existence of certain paths (harder under append-only semantics).

**What works well.**
- EFS already separates content identity (DATA = `contentHash` + `size`) from retrieval (MIRROR = URI). A user can attest a DATA without ever attesting a MIRROR — the DATA stands alone as a commitment.
- ContentHash is the only required field; nothing about the bytes is on-chain unless a `web3://` mirror is added.
- The lens model means a private user can attest under their own lens without polluting anyone else's view.
- MIRROR's URI scheme allowlist (ADR-0023) doesn't preclude future encrypted-transport schemes.
- The `size` field on DATA can be a small lie (claim 1024, actual is 1023) and nobody notices unless they fetch the bytes — minor metadata-flexibility win.

**What's painful or impossible.**
- Path *existence* is public. Even if the bytes are private, an Anchor at `/personal/diary/2026-05-26` is visible to any chain observer, including the fact that the user attested at this time.
- Anchors are non-revocable so a one-off mistake (creating `/projects/secret-acquisition/` and then thinking better of it) is permanent.
- The `_qualifyingFolders` index makes "who has created anchors here" trivially queryable for any folder.
- PROPERTY (e.g., `contentType`) is plaintext — even encrypted bytes leak their MIME type.
- The lens model is *opt-in for the viewer* but not *opt-out for the writer*: anyone can read any lens by including the address in their `?lenses=` param, so private content under a known address is discoverable.
- There's no "shielded pool" notion — every attestation is identified by attester address and that's public.
- Time-locked reveals require an off-chain commitment scheme; the on-chain surface doesn't have a "reveal this attestation at block X" primitive.
- Selective disclosure of a Merkle proof requires the user to have committed to a Merkle root, which doesn't fit any existing schema cleanly.

**Architectural ask.** A `SEALED` schema flag (or a sibling schema set) for attestations whose `data` field is treated as opaque ciphertext that the resolver doesn't try to parse. A blinded-anchor convention where a path segment is `keccak256(salt || name)` rather than the name itself, so the path tree is structurally visible but semantically opaque without the salt. A `commit(commitmentHash, schemaUID)` + `reveal(uid, plaintext, salt)` flow at the EFSIndexer level. None of these exist today and most would require new schemas, not just new contracts.

**The leakage map.** Every EFS attestation leaks (a) which schema, (b) which attester, (c) which `refUID`, (d) the timestamp via block inclusion, and (e) the data payload in cleartext. The minimum metadata a credibly-neutral protocol can leak is (a) + (d) — a privacy preserver would want (b) hidden under a stealth-address scheme, (c) hidden under a Pedersen commitment, (e) hidden under symmetric encryption with off-chain key distribution. The on-chain surface today doesn't fight any of these leakages; the privacy preserver has to layer privacy *on top* using off-chain tools, and they pay the leakage cost of the layering itself (the presence of an encrypted blob says "this attester had something to hide").

**Zero-knowledge adjacency.** A more ambitious privacy preserver wants ZK proofs of EFS membership: "I can prove I attested a DATA with a contentHash matching this Merkle root, without revealing the DATA's UID." This needs hooks the kernel doesn't have — specifically, a proof-verifying entry point that can credit an attester for a commitment without naming which attestation matches. This isn't unique to EFS (every protocol has this kind of ZK-ification demand) but the append-only kernel pattern makes it harder than usual: every attestation has to be enumerated to prove non-membership, which is expensive in ZK circuits.

**Shape-freeze influence.** This perspective doesn't strongly prefer a particular contract count, but it does argue *against* freezing the schema set without a privacy-shaped schema slot reserved. The decomposition brainstorm assumes the six schemas are settled; this perspective says "what about a seventh that's commit-shaped?" Direction 4 (split by lifetime) is interesting here: a commit-then-reveal pattern wants Etched commits (the hash is permanent) but Ephemeral reveals (the plaintext could be kept off-chain and re-attached later) — that maps cleanly to Permanence vs Mutable split. Direction 1's `EFSData` would host the privacy schemas, but the merge with the rest of EFSData means a privacy-schema bug is an EFSData-contract event. Direction 2's per-resolver split would put a SEALED resolver in its own contract — cleanest blast radius for an experimental privacy schema.

## Perspective 6: Cross-chain bridge (mirror EFS state elsewhere)

**Who they are.** Operator of a cross-chain message bridge (LayerZero, Hyperlane, Wormhole, native rollup bridges, optimistic message bridges) trying to either (a) mirror EFS state from chain A to chain B so a user on B can read EFS content originally written to A, or (b) support *dual attestation*, where a single user action results in equivalent attestations on both chains. Could also be an operator running multiple EFS deployments and wanting a way to merge their state at the read layer.

**What they want from EFS.** A canonical serialization of EFS state at a given block, so a Merkle proof of "this DATA exists at this path under this lens" can be verified on a remote chain. A way to express "this attestation was originally made on chain X" so a remote-chain replica doesn't lose provenance. Idempotent re-attestation so the same logical attestation made on two chains doesn't produce two distinct UIDs at the indexer level. Block-height-anchored reads ("show me the state of `/recipes/` at L1 block 19500000") for replayable proofs.

**What works well.**
- EAS attestations are content-addressed by UID, and the UID is a deterministic hash of attestation fields. If the same attestation is made on two chains (same schema UID, same data, same attester), it gets the same UID — *if* the schema UIDs match across chains, which requires careful deploy coordination but is achievable.
- The append-only kernel means there's no "current state" race condition; the state at block N is fully determined by attestations up to block N.
- ContentHash on DATA is chain-independent — a bridge can verify content equivalence across chains without any EFS-specific machinery.
- MIRROR's `web3://` transport is chain-bound (it points to a chunk-manager contract on a specific chain), but other transports (ipfs://, ar://) are chain-independent — useful for cross-chain content portability even without state-mirroring.

**What's painful or impossible.**
- Schema UIDs hash in resolver addresses, which are different on different chains, so the same logical EFS schema (e.g., DATA) has *different UIDs* on Sepolia vs Optimism. A cross-chain bridge cannot treat them as equivalent without a translation table.
- The `_qualifyingFolders` index is built per-chain from local attestations; a mirror of attestation events from chain A to chain B won't reconstruct B's index correctly unless the bridge replays the resolver hook logic exactly.
- The `propagateContains` walk is similarly per-chain — and depends on the tree shape, which depends on the order of arrival of attestations, which the bridge can't preserve perfectly.
- There's no canonical "snapshot at block N" surface — a remote chain reading EFS state has to either trust an oracle or run a light client of the source chain.
- The lens model assumes addresses are equivalent across chains (alice.eth on Sepolia *is* alice.eth on Optimism for ownership purposes), but EFS doesn't enforce that anywhere; an attacker could write under alice's address on chain B even if alice has never deployed there.
- Storage proof generation for EFS state is theoretically possible but the index layout (nested mappings, swap-and-pop arrays, propagated flags) makes the proofs huge.
- Content-addressed dedup (`dataByContentKey`) is per-chain: the same DATA written on Sepolia and Optimism has two different canonical UIDs, and bridges have no way to merge them post-hoc.

**Architectural ask.** A `getStateRoot(blockNumber) → bytes32` view on `EFSIndexer` that commits to the full index state at that block, suitable for Merkle inclusion proofs. A "canonical EFS schema set" registry that maps schema UIDs across chains, ideally maintained on a shared registry contract (could itself be on L1). A `claimAttestationFromChain(sourceChainId, sourceTxHash, attestationData, proof)` primitive on each EFS deployment, letting bridges replay verified-from-source attestations as native attestations on the target chain. A way to query EFS at a historical block (not currently supported — `EFSIndexer`'s state is always current). Lens-equivalence: an opt-in "I am alice on chain B, here's my proof from chain A" attestation that lets cross-chain lens resolution actually work.

**The dual-write pattern.** A simpler form of cross-chain doesn't require bridges at all: a user writes the *same* attestation on two chains directly, and consumers query whichever chain they prefer. This works *if* the schema UIDs match (the same attestation produces the same UID on both chains). With CREATE2-deterministic resolver addresses, this is achievable. Without, the user is making two distinct attestations with no on-chain link between them, and any consumer who wants to verify "alice said the same thing on both chains" has to compare data fields manually. Cross-chain bridges are downstream of the schema-UID alignment question.

**Reorg and finality.** EFS deployments on different chains have different finality assumptions: a Sepolia attestation finalizes in epochs (~12 min); an Optimism attestation has a 7-day challenge period in the worst case. A bridge mirroring Optimism state to Polygon has to decide: do they mirror unfinalized state (fast but reorg-risky) or wait for full finality (slow)? The kernel doesn't expose any finality signal — `EFSIndexer.getAnchorCount()` returns the same value regardless of how reorg-safe the underlying state is. Bridges have to layer their own finality oracle, which couples them to the source chain's finality machinery. Less of a contract surface ask, more an operational reality the freeze should acknowledge in docs.

**Shape-freeze influence.** Argues strongly for the schema-UID problem to be solved at freeze time, not deferred — every cross-chain consumer pays compounding pain otherwise. Argues for Direction 3 (2-contract kernel) because it minimizes the cross-chain coordination surface (fewer addresses to align). Argues against any decomposition with many small contracts (Direction 2, Direction 5) because each one's address has to match across chains for schema UIDs to align, and each redeployment on each chain has to happen in lockstep. Independently: argues for treating "cross-chain replicability" as a first-class freeze concern, which it currently is not.

## Perspective 7: Archival node (50-year-test reader)

**Who they are.** Operator of a long-running archival service whose job is to preserve EFS state for posterity — internet-archive-style. They sync EFS data from chain, store it durably across multiple physical media, and serve historical reads decades into the future. They expect their reads to outlive any specific RPC provider, indexer service, or even potentially Ethereum mainnet in its current form. They might be a library, a national archive, a paranoid individual with a basement full of hard drives, or a DAO funded to do this.

**What they want from EFS.** A self-describing on-chain state that can be reconstructed *purely from chain data*, without depending on off-chain documentation, ABI files, or any third-party service. Stable contract addresses that resolve forever. Stable schema UIDs that resolve forever. A way to verify "the bytes I have for DATA UID X actually match the on-chain contentHash" without trusting anyone. Predictable storage costs: they want to know what they have to back up.

**What works well.**
- EFS's "Etched" tier per the Glossary makes this perspective load-bearing — mainnet contracts are permanent per ADR-0030, schema UIDs are immutable, append-only indices stay append-only per ADR-0009.
- ContentHash on DATA gives the archival node a content-integrity check independent of EFS contracts.
- SSTORE2 chunks stored as raw bytecode mean the on-chain bytes are recoverable as long as the chain is.
- The `web3://` URL stability invariant means historical URLs keep resolving.
- No admin keys, no upgradeability, no migrations — the archival surface has the same shape forever.

**What's painful or impossible.**
- ABI files are off-chain — the archival node has to either store them out-of-band or reverse-engineer them from bytecode. Event signatures are part of the ABI; same problem.
- Cross-contract reads (`EFSRouter` calls `EFSIndexer` calls `EdgeResolver`) mean the archive needs *all* the bytecode, not just one address.
- Off-chain mirror URIs (ipfs://, ar://, https://) point to content that may rot — the archival node has to either re-mirror all of it themselves or accept that some content is on-chain only.
- There's no "this is the canonical bytecode hash for this contract address" verification — the archival node has to trust their local snapshot of mainnet for that.
- Schema field strings are stored in EAS, which is great, but the *semantics* of those fields ("what does PROPERTY's `key` field mean?") are off-chain documentation.
- The router URL parsing logic is in `EFSRouter` bytecode but not in any human-readable form on-chain.
- Index reconstruction from raw EAS attestations is possible but requires running the exact resolver logic — which means having the resolver bytecode, not just the indexer's.

**Architectural ask.** An on-chain "manifest" attestation set: deploy-time attestations that record (a) all canonical contract addresses for this deployment, (b) the schema UID set, (c) the ABI hash for each contract, (d) the human-readable semantics for each schema field. Make EFS *self-describing* at the chain layer. Use ENS or a reserved root anchor (`/manifest/`) as the convention. Also: a stable, on-chain documented event format that's part of the freeze. Also: a "this contract's bytecode hash" attestation made at deploy time so future readers can verify their local snapshot matches what was originally deployed.

**The "what if Ethereum forks" question.** A truly long-horizon archival node has to consider that Ethereum mainnet itself may fork, sunset, or be superseded. EFS state under a hard fork branches: which branch is canonical? EAS's contract address might exist on multiple branches with diverging post-fork states. The archival node's job becomes "preserve state across all credible branches" — a much harder problem than "preserve state on the canonical chain." Nothing about EFS makes this worse than the underlying chain, but nothing makes it better either. A hash-tree commitment to EFS state at a given block, signed by a community of archival nodes, becomes valuable as a "if all the chains die, we can still verify what EFS *was*" attestation.

**Off-chain content rot.** Even with perfect on-chain preservation, EFS's `https://`, `ipfs://`, and `magnet:` mirrors point to off-chain bytes that *will* rot. The archival node has to either re-mirror everything (expensive) or accept that some content becomes unrecoverable over time. The contentHash on DATA at least lets them detect rot ("the IPFS gateway returned bytes that don't match"). A future "content-attestation freshness" schema could help — an attester re-attests "I confirm this mirror is still serving the correct bytes at block N" — but that's a new schema, not in the current set.

**Shape-freeze influence.** Argues for *fewer* contracts (smaller archive surface, fewer addresses to verify), in line with Direction 3. But also argues for *more* on-chain documentation regardless of contract count. Independently: argues for the schema set to be considered Etched (which it already is) and for the *manifest* of the canonical set to also be Etched — currently the spec lives in markdown, which is Ephemeral. The freeze should produce an on-chain commitment to the spec, not just a Git tag.

## Perspective 8: Lens curator marketplace operator

**Who they are.** Operator of a service that helps users discover and follow lenses (cf. Glossary). Could be a Lens-protocol-style social graph, an editorial team running "the EFS New York Times" (curated science / news / fiction lenses), a recommendation engine learning who-watches-whom, or a marketplace where curators charge for their lens.

**What they want from EFS.** Discovery of "who is curating what" — find all attesters who have written under `/recipes/italian/` and rank them by attestation volume, recency, or follower-count proxies. A canonical way to *follow* a lens that an SDK can query ("is alice following bob?"). Composition: combine lenses with weights ("70% alice, 30% bob"). Reputation primitives: count of attestations, frequency, distinctiveness. Discovery of *new* lenses that share a topic with a lens the user already follows.

**What works well.**
- Lenses are addresses, which means anything an address can do (sign, attest, hold tokens) composes with lens identity.
- Per-attester indices (`_referencingByAttester`, `_childrenByAttester`) give the curator marketplace a per-lens activity surface.
- Reserved `/tags/` folder makes tag-by-attester queries possible — "alice's tags" is enumerable.
- ENS resolution composes naturally with lens addresses — `?lenses=alice.eth` is a sensible URL even before any on-chain follow primitive.
- Append-only indices mean a curator's contribution history is permanent and verifiable — important for reputation systems.

**What's painful or impossible.**
- Following is *not on-chain* — `?lenses=alice` is just a client-side URL param per ADR-0031. There's no `EFS.follow(alice)` primitive, so the marketplace operator can't even count followers without running their own off-chain database.
- Lens composition is "ordered list, first-wins" — there's no weighted-merge primitive, no "majority vote across these N lenses," no "weighted by stake."
- Cross-lens discovery requires the marketplace to maintain its own inverted index ("who has attested under this topic?").
- Curator reputation has no canonical signal — attestation count is gameable, recency is gameable, content originality is hard to detect on-chain.
- There's no way to *delegate* lens authority ("alice trusts bob to curate `/recipes/`") short of writing TAG attestations on alice's behalf, which requires sharing keys.
- No "lens manifest" — a curator can't publish "here's what I curate, here are my topics, here's my style" in a structured way that the marketplace can ingest.

**Architectural ask.** A `FOLLOW` schema (or similar) that lets one address attest to following another, with optional topic-scoping (`alice follows bob for /recipes/`). A weighted-merge primitive at the router level or as a separate overlay contract: `?lenses=alice:0.7,bob:0.3` with overlay-level merging logic. A delegation primitive that lets alice grant bob "TAG-on-behalf" rights for a topic without giving bob alice's keys (this is hard — wants account abstraction). A reputation-emitting event set so off-chain indexers can compute "lens X's contribution to topic Y" cheaply.

**The "first-wins" tension.** ADR-0031 chose first-wins fallback semantics for lens resolution: with `?lenses=alice,bob`, alice's content always shadows bob's where both exist. That's clean for routing but bad for a marketplace: a user who wants "alice's recipes plus bob's images" can't express that with a single URL, because alice's empty recipe list will fall through to bob, but alice's existing image will shadow bob's image. The marketplace operator either has to multiplex URLs (one per topic the user follows) or push for a `?merge=newest`-style param (already flagged as a Tier 2 question in `docs/QUESTIONS.md`). Either way, the lens model wants more than first-wins.

**Curation as a market.** A real marketplace needs payment rails. If alice charges to follow her lens, that's a subscription primitive (recurring payment for read access) or a one-time payment for an attestation that grants follow rights. Neither maps to existing EFS schemas. EFS doesn't have to be opinionated about this — the marketplace can build payment outside — but the lens model has to *not preclude* it. Today, follow is off-chain (URL param), so attaching payment to it means the marketplace runs its own server. That's the centralized infrastructure the architecture spec warns against.

**Shape-freeze influence.** Strongly argues for treating overlays as first-class (Direction 3's overlay model fits this best). Argues that the schema set is *under-specified* for social use cases — the brainstorm-decomposition assumed six schemas, this perspective wants at least seven (a FOLLOW schema) and ideally more. Argues against any decomposition that puts lens-related logic in the kernel: lens composition should live in an overlay contract that can be replaced without touching the kernel. Direction 3's clean kernel-vs-overlay split is the natural home; Direction 1 / 2 / 5 would have to bolt this on.

## Cross-cutting tensions

Where perspectives pull against each other. These tensions are what makes the freeze decision hard — there is no shape that satisfies all eight, so the freeze is a choice about which perspectives win. Naming them up front lets the freeze be deliberate about who it disappoints, rather than discovering disappointment after deployment.

- **Event richness vs gas budget.** The indexer node (P2), search engine (P4), and lens curator (P8) all want *more* events, with richer indexed fields, emitted from more places. The L2 sequencer (P1) and hardware wallet user (P3) want *fewer* events because every LOG opcode costs gas that's paid per attestation. A `PinCreated(definitionUID, targetUID, attester, weight)` event costs ~1.5k gas; multiply by every PIN write and the off-chain ergonomic gain comes out of the per-attestation gas budget.

- **Contract count: indexer wants more, archive wants fewer.** The indexer node (P2) is mostly indifferent to contract count because it's reading events anyway. The cross-chain bridge (P6), archival node (P7), and L2 sequencer (P1) all want *fewer* contracts — easier to coordinate across chains, easier to verify bytecode for posterity, easier to budget gas. The lens curator (P8) wants *more* overlay contracts because overlays are how their feature lives. This tension is the contract-decomposition brainstorm's core tension, reframed: "fewer contracts" wins for infrastructure operators; "more contracts" wins for ecosystem extensibility. The freeze picks one side.

- **Signature count vs atomicity.** Hardware wallet user (P3) wants *fewer signatures* per upload. The current 6-8 attestations per upload is grim on a Ledger. But the lens curator (P8) and search engine (P4) benefit from the *granularity* of those attestations — each one is independently queryable, indexable, citable. Collapsing them into a single signed `EFSUpload` payload reduces signature count but obscures the fine-grained event stream. A wrapper contract that re-emits the granular events can paper over this, but the wrapper itself becomes an extra address on the freeze surface.

- **Privacy vs discovery.** Privacy preserver (P5) wants path existence to be obscurable; search engine (P4) wants path enumeration to be efficient. The qualifying-folders index, which enables "find folders with content under this attester" in O(1), is what the search engine needs and what the privacy preserver wants disabled. They cannot both win without per-attestation opt-out flags (which add complexity to the kernel and break the "every attestation is uniform" abstraction).

- **Schema flexibility vs cross-chain UID stability.** Lens curator (P8) and privacy preserver (P5) want *new* schemas added (FOLLOW, SEALED). Cross-chain bridge (P6) and archival node (P7) want the schema set frozen so UIDs are stable across chains and across time. Adding a schema post-freeze is technically possible (schemas are EAS-level) but a schema added on chain A and not on chain B is a discontinuity the bridge has to handle. The freeze decision is partly "do we lock the schema set to six (forcing all future use cases to fit) or leave it open (forcing all consumers to handle new schemas appearing)?"

- **Determinism vs lazy evaluation.** L2 sequencer (P1) wants every attestation's gas to be pre-quotable. Sort overlay (P8 indirectly) and `propagateContains` walks are *lazy* — costs depend on tree shape at submission time, not at schema definition time. Sort overlay also has explicit "you can call processItems whenever" lazy semantics, which is fine for users but means the sequencer can't know when those calls land. Lazy evaluation makes for cleaner write-time hot paths but harder gas modeling.

- **Self-description vs simplicity.** Archival node (P7) wants on-chain manifests, on-chain ABI hashes, on-chain semantic documentation. Every one of these is an additional attestation set, more storage, more complexity. The L2 sequencer (P1) and hardware wallet user (P3) would prefer the *bare minimum* of on-chain state to keep gas tight. The freeze decision needs to commit to a level of on-chain self-description — none, some, or full — and currently it's *none*.

- **State-root commitments vs append-only.** Cross-chain bridge (P6) wants `getStateRoot(blockNumber)` for Merkle proofs. The append-only kernel pattern (ADR-0009) means the state at block N is *fully determined* by attestations up to N, which is great for replicability, but the state isn't *committed to a single hash* anywhere on-chain — the bridge would have to compute the root themselves, which requires walking the entire index. Adding a state-root commitment on every block is gas-prohibitive; doing it lazily (compute-on-request) is fine but pushes work to the reader.

- **Where does PROPERTY get indexed.** Search engine (P4) wants PROPERTY-by-value lookups (find all files with `contentType=text/markdown`). Today PROPERTY is indexed by target UID, not by value. Adding a value index costs every PROPERTY write some extra gas (perspective P1's concern) and adds another mapping the archival node (P7) has to preserve and the cross-chain bridge (P6) has to reconcile. None of those perspectives want it; only the search engine does. A common pattern would be "indexable PROPERTY keys are declared at deploy time and indexed only for declared keys" — but that's a new mechanism, not in the current schema.

- **Lens following: on-chain or off-chain.** Lens curator (P8) wants follow attestations on-chain so they can count followers. Privacy preserver (P5) wants following to be private (followers shouldn't be enumerable). Both can't be true without a SEALED follow primitive. The current model (off-chain following via URL param) sidesteps the choice; making it on-chain forces the privacy-vs-discovery tension to be resolved.

- **The router as choke point.** Cross-chain bridge (P6), search engine (P4), and archival node (P7) all care about router stability — the URL is a forever artifact. Lens curator (P8) wants the router to support new query params (weighted lenses, follow-graph composition). L2 sequencer (P1) doesn't care because the router isn't on the write hot path. The router is the single contract under the most cross-perspective tension and is also the most likely to need iteration — which is the exact argument for keeping it as a separate, redeployable contract (with the cost of URL breakage on redeploy).

- **Append-only vs orphan cleanup.** Hardware wallet user (P3) wants the option to clean up orphaned anchors from failed uploads. Archival node (P7) needs append-only to be a hard invariant — any "delete" capability breaks 50-year-test integrity. Privacy preserver (P5) also benefits from being able to retract a path (mistakenly created `/personal/diary/`). The append-only stance is a feature for some perspectives and a bug for others; the freeze has to commit to it being a hard invariant or a soft convention.

- **Where lens composition lives.** Lens curator (P8) wants overlay-level composition (weighted merge, follow-graph synthesis). The router currently does first-wins fallback only. If composition lives in the router, every weighting change is a router redeploy and URL break. If composition lives in a separate overlay, the URL has to address it (`?lensOverlay=0xabc&lenses=alice,bob`), which makes URLs uglier. If composition lives in a client-side library, lens semantics aren't actually on-chain — which undercuts the "credibly-neutral" claim for resolution.

- **Multi-attestation atomicity.** L2 sequencer (P1) and hardware wallet user (P3) want atomic upload bundles: if any of the 6-8 attestations in an upload fails, all rollback. EAS's `multiAttest` provides this *if* every attestation goes through EAS — which is the current pattern. But the proposed `EFSUploadGateway` would emit attestations via the gateway, and the rollback semantics of "gateway internal failure" vs "external EAS failure" become important. The freeze needs to commit to whether atomicity is a property of the wrapping pattern or of the underlying primitive.

- **Pagination ceilings.** Every read function in the kernel takes `(start, length)` — a sensible pattern for unbounded arrays. But the *consumers* differ wildly in what pagination they want: indexer node (P2) wants to fetch in 10k-row chunks, search engine (P4) wants to firehose, hardware wallet user (P3)'s frontend wants 20-row pages. Today the kernel imposes some hard caps (`MAX_PAGES = 10` mirror scan cap, sort overlay's `limit ≤ 100`). Different perspectives want different ceilings. The freeze should at minimum document the ceilings as part of the public API.

## Exit triage

Per brainstorm-system § Exit triage.

### Controversial human design choices

- **Choice:** Add an upload-gateway contract pre-freeze, or leave per-attestation signing as the canonical user-write pattern.
  - **Options:**
    - A: Add `EFSUploadGateway` that takes a single typed-data payload and emits the cascade. Adds a contract, adds an event surface, but solves the hardware wallet problem and the new-user-onboarding problem in one shot.
    - B: Document the per-attestation pattern as canonical; expect wallets and SDKs to evolve to render it well over time.
    - C: Defer until post-freeze; treat the gateway as a non-canonical convenience contract third parties can build.
  - **Tentative read:** A. The signature-count friction is the single most cited problem across the user-facing perspectives (P3, and implicitly P1's batch-validation argument), and the gateway is small enough to fit under any of the decomposition directions without breaking them.
  - **Why controversial:** B is the "EFS is infrastructure, not product" answer and fits the ADR-0030 / credibly-neutral stance well — adding a gateway is *opinionated* in a way the rest of EFS deliberately isn't. C punts the question, which is reasonable for freeze timing but risks the third-party SDK pattern calcifying around per-attestation signing. The cost of A is dragging another contract into the freeze surface; the cost of B is bounded user adoption; the cost of C is third parties shipping their own gateways that diverge and fragment the upload experience.

- **Choice:** On-chain "manifest" attestations at deploy time, or freeze with off-chain spec only.
  - **Options:**
    - A: Deploy-time attestation set that records canonical addresses, schema UIDs, ABI hashes, and a pointer to the spec. EFS becomes self-describing on-chain.
    - B: Keep the manifest in markdown / git tag / external doc and trust the off-chain spec to remain accessible.
    - C: Halfway: deploy-time attestation set with addresses + schema UIDs only (no ABI hashes, no spec pointer).
  - **Tentative read:** C. Full self-description (A) is appealing for the archival perspective but expands the freeze surface (now the manifest schema is also Etched). Pure off-chain (B) leaves credibly-neutral archival weak. The address+schema-UID manifest is small, cheap, and unblocks the highest-value verification.
  - **Why controversial:** A purist's view of "EFS is infrastructure" says the spec is *off-chain* on purpose — pulling spec-pointer attestations on-chain creates a precedent for putting *more* meta-documentation on-chain. B's cost is borne entirely by future readers, who aren't here to vote.

- **Choice:** Freeze the schema set at six, or reserve slots for predictable additions (FOLLOW, SEALED, EVENT, etc.).
  - **Options:**
    - A: Freeze at six. New schemas can be added post-freeze (EAS allows it) but are *not part of canonical EFS*.
    - B: Freeze at six but explicitly reserve names and intended semantics for FOLLOW, SEALED, EVENT in the spec.
    - C: Add one or more of the predicted schemas before freeze, even if their resolver semantics aren't fully worked out.
  - **Tentative read:** B. Freezing at six matches the current decomposition brainstorm's assumption and avoids cramming in half-baked schemas. But explicitly *naming* the expected future additions in the spec gives consumers (especially the lens curator and privacy preserver perspectives) a signal that EFS expects to grow here, so they don't build workarounds that calcify.
  - **Why controversial:** A is the cleanest freeze story ("six schemas, forever"). C is the most aggressive ("we know we'll need FOLLOW, ship it now"). B is the wishy-washy middle — and "reserved for future use" promises in protocol design have a long history of being either ignored or weaponized.

- **Choice:** Cross-chain schema-UID coordination strategy.
  - **Options:**
    - A: Accept that schema UIDs differ across chains; consumers handle the mapping.
    - B: Use CREATE2 deterministic deployment so resolver addresses match across chains, making schema UIDs match.
    - C: Maintain a canonical schema-UID registry contract (on L1) that all chains reference.
  - **Tentative read:** B. CREATE2 with a salt derived from the deploy version is a one-time engineering cost that makes the cross-chain story actually work. C is too coordination-heavy. A pushes the cost to every consumer.
  - **Why controversial:** B couples EFS deployments to specific deployer key management; if a private key is ever lost or rotated, the cross-chain alignment breaks. A is the "we're not doing cross-chain at MVP" answer, which is defensible but commits to a future migration pain.

- **Choice:** Treat events as part of the frozen ABI, or as a "nice to have."
  - **Options:**
    - A: Events are part of the freeze. Event signatures cannot change post-freeze. Off-chain consumers can rely on them forever.
    - B: Events are documented but treated as ephemeral. A future upgrade may add or rename them.
    - C: Events are frozen *per event*: some are designated stable (the ones consumers depend on), others are designated experimental.
  - **Tentative read:** A. The indexer node perspective (P2) is load-bearing for the entire "no centralized infrastructure" story per `01-System-Architecture.md`. If events aren't frozen, the off-chain mirror has to constantly chase ABI changes, which kills the credibly-neutral indexer ecosystem.
  - **Why controversial:** A constrains future kernel evolution significantly — adding a new index requires adding events without renaming existing ones. C is more flexible but introduces a "which events are real" two-tier system that's a footgun.

### Unknown questions for future brainstorms

- **Question:** What does the upload gateway actually look like — wrapper contract, EIP-712 schema, EAS multiAttest variant?
  - **Brainstorm shape that would answer it:** `bs-upload-gateway-design-v1` — a focused brainstorm comparing 3-4 concrete gateway implementations (wrapper contract pattern, account-abstraction-based payload, EAS multiAttest customizations, off-chain bundler with on-chain verification).
  - **What it would unlock:** the controversial choice above can become a real decision; freeze can include or exclude the gateway specifically.

- **Question:** What's the minimum on-chain manifest that's worth adding?
  - **Brainstorm shape that would answer it:** `bs-onchain-manifest-design-v1` — explores 3-4 manifest shapes (addresses only, addresses + schema UIDs, full ABI hashes, ENS-anchored manifest) with cost and verification trade-offs.
  - **What it would unlock:** clarity on whether the manifest deserves a freeze slot or is a future-work backlog item.

- **Question:** What does cross-chain EFS look like operationally — same chain id with bridged state, separate deployments with merged reads, or shared L1 registry with chain-specific overlays?
  - **Brainstorm shape that would answer it:** `bs-cross-chain-efs-patterns-v1` — surveys how other cross-chain protocols (EAS itself, Lens Protocol, Farcaster) handle this and proposes 2-3 patterns for EFS.
  - **What it would unlock:** the CREATE2-vs-registry choice above; also informs whether `chainId` should be in any schema's data fields.

- **Question:** What's the right event taxonomy if we treat events as canonical?
  - **Brainstorm shape that would answer it:** `bs-event-abi-audit-v1` — enumerates every event currently emitted, identifies missing events (per-schema structured events for PIN/TAG, propagation events, sort-resync events), and proposes a stable taxonomy with indexed-field rationale per event.
  - **What it would unlock:** event signatures become part of the freeze; off-chain mirror authors get a stable contract to write to.

- **Question:** What does a SEALED / commit-then-reveal schema look like if we wanted to ship it pre-freeze?
  - **Brainstorm shape that would answer it:** `bs-privacy-schemas-v1` — explores 3-4 privacy primitives (sealed attestations, blinded anchors, commit-reveal flows, zk-attestation hooks) and what fits EFS today.
  - **What it would unlock:** the schema-count-six freeze decision can be made with eyes open about what gets reserved or shipped.

- **Question:** Should there be a FOLLOW or SUBSCRIBE schema for lens curation, and if so, what does on-chain follow look like?
  - **Brainstorm shape that would answer it:** `bs-lens-follow-design-v1` — comparison with Lens Protocol's follow-NFT, Farcaster's follow, and several lighter-weight alternatives.
  - **What it would unlock:** the lens-curator perspective stops being a "future overlay" handwave; the freeze can either reserve slot for it or commit to not having one.

- **Question:** How big can `EFSIndexer` actually get under EIP-170 if we collapsed into the 2-contract Direction 3 layout?
  - **Brainstorm shape that would answer it:** `bs-kernel-bytecode-budget-v1` — measure current per-contract bytecode, model the merged contract size, evaluate library-extraction strategies, identify what would have to be cut to fit.
  - **What it would unlock:** Direction 3 in the decomposition brainstorm becomes credible-or-not based on real numbers instead of speculation.

- **Question:** What does an L2-sequencer-friendly gas-quote API look like, and is it worth adding to the kernel?
  - **Brainstorm shape that would answer it:** `bs-gas-quote-api-v1` — what's the minimum viable surface (per-schema worst-case constant? `quoteAttestGas` view function? off-chain gas oracle?), what does each cost the kernel, and what does each unlock for rollup operators.
  - **What it would unlock:** a freeze-time decision on whether EFS should be "predictable gas" infrastructure or "best-effort cost" infrastructure. Right now it's the latter by default.

- **Question:** How would EFS-on-multiple-chains actually work — same deployment everywhere via CREATE2, federated deployments with a shared registry, or chain-local deployments with explicit bridges?
  - **Brainstorm shape that would answer it:** `bs-multi-chain-deployment-v1` — survey of how EAS, ENS, and Safe handle multi-chain, applied to EFS's append-only kernel and content-addressed dedup.
  - **What it would unlock:** the schema-UID-across-chains decision; also clarifies whether `dataByContentKey` should be per-chain or aspirationally global.

### Blockers / concerns

- **What's blocked:** The decomposition brainstorm's curator note flagged Direction 5 as "highest pedagogical payoff" but it forces the question of where the qualifying-folders index lives (paths layer vs content layer). This brainstorm's L2 sequencer perspective adds that the qualifying-folders write-time cost is *already* the sequencer's biggest gas surprise. Either layer that hosts it pays the cost.
  - **The blocker:** No analysis of the qualifying-folders index's actual gas profile vs alternatives. The decomposition decision is being made without knowing how heavy this index is.
  - **Who/what could unblock:** A gas-profile brainstorm or a measured benchmark from the contracts repo.

- **What's blocked:** The indexer-node perspective's "events as canonical ABI" ask is large — if accepted, it constrains every future contract change. But not accepting it leaves the off-chain indexer ecosystem on shifting sand, which contradicts `01-System-Architecture.md`'s "no centralized infrastructure" claim.
  - **The blocker:** No principle has been articulated about whether events are part of the freeze. The current spec is silent on event stability.
  - **Who/what could unblock:** James deciding (or a follow-up brainstorm reaching consensus), then an ADR being written.

- **What's blocked:** Cross-chain consumers (P6) cannot plan around EFS until the schema-UID-across-chains story is articulated. Today the answer is "use the same chain or build a translation table." That works for an MVP but doesn't fit EFS's credibly-neutral pitch — EFS on Optimism *should* feel like the same protocol as EFS on Sepolia.
  - **The blocker:** No design exists for cross-chain schema-UID alignment. The decomposition brainstorm assumes a single deployment.
  - **Who/what could unblock:** A `bs-cross-chain-efs-patterns-v1` brainstorm (per Unknown questions above), then an ADR.

- **What's blocked:** The hardware-wallet perspective's signature-count problem makes EFS unusable for cold-storage users today. That's a non-trivial fraction of high-value Ethereum users, including exactly the kind of long-term archival users EFS most wants. Without a fix, EFS adoption is bounded to hot-wallet users.
  - **The blocker:** No upload-gateway design exists. The current 6-8-attestation upload pattern is canonical and inherits all of EAS's signing UX.
  - **Who/what could unblock:** A `bs-upload-gateway-design-v1` brainstorm followed by a James decision on whether to add the gateway pre- or post-freeze.

- **What's blocked:** Several perspectives (P2, P4, P8) want PROPERTY-by-value or per-field indices. The decomposition brainstorm doesn't address this because it's a schema/index question, not a contract-count question. But the freeze locks in whatever per-field indexing the kernel does today.
  - **The blocker:** No principle exists for "what fields are worth a secondary index." Today's choices (`dataByContentKey` for DATA, parent for ANCHOR, target for PIN/TAG) feel ad-hoc.
  - **Who/what could unblock:** A `bs-secondary-indices-policy-v1` brainstorm that articulates which fields get indexed and why.

- **What's blocked:** The "EFS is six schemas, contracts wrap them" model assumes schemas are settled. Five of the eight perspectives here imply *new* schemas (FOLLOW for P8, SEALED for P5, manifest attestations for P7, follow-graph for P8 again, event/transition for P2). If even one ships, the freeze "schema set" is moving target.
  - **The blocker:** No commitment to whether the schema set is closed at six or open. The architecture spec and decomposition brainstorm both assume closed, but no ADR says so.
  - **Who/what could unblock:** An ADR — "the canonical EFS schema set is closed at N; additions are non-canonical extensions."

- **What's blocked:** Pagination and limit constants are scattered across the codebase (`MAX_PAGES = 10`, `MAX_ANCHOR_DEPTH = 32`, `MAX_EDITIONS = 20`, sort overlay's `limit ≤ 100`, etc.) with no consolidated "public API contract" document. Different perspectives (P2 wants firehose, P3 wants small pages, P4 wants giant pages) need different ceilings and currently can't tell which are negotiable.
  - **The blocker:** No single source of truth for "what are EFS's public API limits and what do they mean for downstream consumers."
  - **Who/what could unblock:** A spec section (probably in `02-Data-Models-and-Schemas.md` or a new `09-Public-API-Limits.md`) that enumerates every limit, its ADR origin, its consumer implications, and whether it's negotiable.

- **What's blocked:** The lens model is half on-chain (every TAG attestation is on-chain, scoped to an attester) and half off-chain (the URL `?lenses=` parameter is client-side). This split is fine for routing but undercuts every perspective that wants on-chain lens *operations* (P8's marketplace, P6's cross-chain lens-equivalence). Whether lens following is on-chain or off-chain is not just a feature question — it's a design philosophy question.
  - **The blocker:** No ADR articulates the principle. ADR-0031 says lenses are URL-param-scoped but doesn't say *why following must be off-chain*.
  - **Who/what could unblock:** Either a Lens follow brainstorm (per Unknown questions above) followed by an ADR, or an explicit ADR re-confirming "lenses are off-chain follow, on-chain attestation; this is permanent."
