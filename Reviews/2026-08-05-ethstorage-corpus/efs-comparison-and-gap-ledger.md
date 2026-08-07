# EFS comparison and gap ledger

**Status:** review-layer crosswalk; validates and pressures current drafts but adopts no design, carrier, product boundary, or requirement

#kind/review #status/done #repo/planning #topic/efsv2 #topic/storage #topic/preservation

## The comparison in one example

For a photograph or Git packfile:

**EthStorage can plausibly provide:**

- Ethereum-committed storage metadata;
- economical large-byte placement;
- provider storage proofs;
- byte retrieval through an EthStorage-aware endpoint;
- local commitment verification;
- SDK, FlatDirectory, and `web3://` integration.

**EFS must add or prove, if it is to exist as a separate system:**

- an object/repository identity that survives changing chain, contract, key, and carrier;
- authority history, delegation, rotation, recovery, and migration;
- paths, schemas, relationships, provenance, versions, tags, and claims;
- explicit reader policy and explainable selection among competing records/mirrors;
- several placement types with distinct capabilities and evidence;
- active monitoring, repair, migration, export, and clean-room reconstruction;
- ordinary application and Git interoperability;
- an optional safe OS/app experience that does not become the only implementation.

If the second list remains mostly design prose and an EFS deployment simply points at one EthStorage key, EthStorage has won the comparison and EFS should narrow or stop.

## Layer-by-layer ledger

| Job | EthStorage today | Current EFS direction | Standing after this review |
|---|---|---|---|
| Large immutable/mutable chunks | real provider/blob path and FlatDirectory tooling | plural placement and chunk-manifest drafts | **Use EthStorage as candidate rail; do not duplicate** |
| Ethereum commitment | storage metadata and blob-derived commitment | signed records plus carrier-independent digest | **Complementary; preserve full EFS digest** |
| Consensus-EVM payload read | not supported for provider payload | EVM state/bytecode tier remains possible | **Distinct capability; keep separate** |
| Provider proof | real sampled proof/reward mechanism | availability evidence/repair doctrine incomplete | **Borrow evidence; do not overstate it** |
| Stable file identity | caller/contract/key-scoped location | portable deterministic identity is central | **EFS differentiation, still to prove** |
| Authority evolution | application/contract roles and admins | KEL/delegation/recovery draft | **EFS differentiation, still draft** |
| Schemas and relationships | application-specific | portable schema/validator pass still owed | **EFS goal, not delivered by EthStorage** |
| Paths/filesystem/mount | FlatDirectory and thin drive examples | generic FS and mount drafts | **Different semantic layer** |
| Reader policy/lenses | application/gateway defaults | candidate lens system | **Different layer, still draft** |
| Multi-carrier preservation | one network plus its providers/archiver | explicit plural carriers and walk-away | **Core EFS test; implementation incomplete** |
| Verified frontend | functioning EthStorage prototype | EFS verified package/response ambitions | **EthStorage prior art; reuse/interoperate** |
| Git transport/storage | GoE remote helper and contracts | Git priority brief, no EFS implementation | **Direct overlap; see separate review** |
| Forge collaboration | not provided | portable issue/patch/review later scope | **Open EFS product/library space** |
| OS/app environment | not provided | Client v2/OS drafts | **Potential product layer, boundary unresolved** |

## Existing EFS requirements this validates

The comparison mostly strengthens existing generic requirements rather than justifying new kernel fields:

- [[assumptions-and-requirements]] **R-M4:** carrier failure must not change authorship or content identity.
- **R-M5:** every durability claim must name whether it covers records, state, bytes, indexes, keys, or availability.
- **R-D7:** semantic identity is independent of carrier, relayer, arrival order, and foreign replication.
- **E-6:** large carriers must remain economically repairable without a mandatory EFS incentive layer.
- **O-2:** monitoring, repair, renewal, migration, budgets, and drills need actual operators.
- [[large-file-uploads]] already separates file identity from physical bytes and leaves proof-bearing external storage as a future mirror class.
- [[human-overview]] already describes portable records, authority, lenses, filesystem semantics, and plural read/placement behavior—but those are draft intent, not shipped evidence.

The review does not prove a new EthStorage-specific record kind, field, read method, or kernel dependency.

## Candidate generic placement boundary

An external-storage adapter should be able to produce a generic placement observation/receipt containing enough information to verify and migrate it without teaching the EFS kernel EthStorage's API.

Candidate information, kept outside Etched identity unless an existing generic field already carries it:

- EFS object/version identifier and full canonical content digest;
- carrier family, network, contract, and implementation/protocol version;
- carrier-specific caller/namespace/key or manifest;
- carrier commitment and decoding/encoding mode;
- declared byte length/chunk layout;
- submission transaction and payment evidence;
- proof observation, provider/miner, block/time, and proof parameters;
- last independent retrieval and verifier result;
- known complete replica/failure-domain observations;
- expiry/renewal/economic assumptions or `UNKNOWN`;
- retrieval hints that may be replaced without changing identity;
- migration/supersession link to later placements.

This is a review hypothesis. The placement-design owner decides representation after the benchmark shows which fields are actually generic and necessary.

## Differentiation tests

### EFS passes if

- the same EFS file/repository moves among EthStorage, EVM bytecode, IPFS/Filecoin, Arweave, and local storage without changing identity or authority;
- independently implemented clients can verify and reconstruct it from documented records/exports;
- paths, schemas, relationships, history, and Git refs remain valid after removing any one carrier;
- carrier facts are honest enough to distinguish proof, retrieval, replication, contract readability, expiry, and unknown state;
- a new operator can restore the service without EFS domains, private databases, or signing infrastructure;
- the official OS is replaceable and the fast public path does not require it to initialize completely.

### EFS fails or should narrow if

- its canonical IDs embed one EthStorage deployment/key or another provider URL;
- an EFS-operated index is the only record of paths, authority, versions, or forge collaboration;
- “multi-carrier” means several gateways into the same failure/admin domain;
- no independent implementation can rebuild the read/write path;
- EFS duplicates provider mining/proofs without a requirement that EthStorage cannot meet;
- the only additional value is a nicer browser UI over EthStorage;
- the OS becomes mandatory to interpret or recover the underlying data.

## Product positioning under pressure

Weak positioning:

> EFS is permanent onchain storage, decentralized Dropbox, or a web3 file host.

EthStorage, ArDrive, IPFS/Filecoin products, and other specialists already occupy those claims with more shipped evidence.

Candidate stronger positioning:

> EFS is a portable semantic and authority layer for durable public files and applications. It lets identities, links, schemas, histories, policies, and recovery survive movement across Ethereum-aligned and other storage carriers.

That sentence is still too broad to be a marketing claim until demonstrated. It is a design/falsification target.

## OS boundary

The OS can be strategically important without being EFS's only reason to exist.

The future design should preserve three separable layers:

1. **Portable EFS substrate:** formats, IDs, authority, validation, relationships, export, and verification.
2. **Libraries/services:** placement adapters, Git profile, indexers, gateways, preservation agents, and application SDK.
3. **Official OS/client:** guest-first browser, file manager, app runtime, capability UX, authenticated workspace, and recovery UI.

It remains open whether the organization calls all three “EFS” or calls the third “EFS OS.” The protocol/API boundary should allow another OS or ordinary command-line client to implement layers one and two.

## Claims requiring correction when their owning docs are next revised

- `web3://` is not generically synonymous with onchain, permanent, or content-addressed bytes; it is an EVM-call URI standard.
- EthStorage should not be called a “trusted holder.” It is an external proof-bearing provider network with economic, liveness, admin, license, and retrieval assumptions.
- “EthStorage-class storage is future” should mean “not yet validated/integrated by EFS,” not “the external technology does not exist.”
- GoE is not design-only; it has a public CLI, remote helper, contracts, Sepolia deployment, and observed use.
- GoE's “fully compatible” wording needs qualification: it requires a custom helper and wallet and does not provide stock HTTPS/SSH, full refs, or forge behavior.
- Petabyte-scale architecture is not evidence of petabytes of live useful data.
- A successful sampled provider proof is not an object-level independent-replica count.

These corrections belong in future owning-doc revisions. This review does not rewrite historical brainstorms, accepted ADRs, or active v2 design bodies piecemeal.

## Gaps this review leaves open

No EthStorage-specific protocol gap is proven. The following generic work remains necessary:

- a machine-readable availability/capability evidence vocabulary;
- a generic external-placement adapter interface;
- complete `.efs-bundle`/export and walk-away procedure;
- independent verifier and repair tooling;
- measured storage economics and retrieval performance;
- portable schemas/validators;
- the Git profile/library in the separate review;
- product-level resolution of EFS versus EFS OS naming/boundary.

The validation program should decide which of these are library/client conventions and which, if any, expose a missing generic substrate primitive.
