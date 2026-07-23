# EFS v2 — Solana and substrate portability investigation

**Status:** draft — research and architecture pressure test; no venue selected
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[assumptions-and-requirements]], [[codex-envelope]], [[codex-kernel]], [[kel]], [[onchain-completeness]], [[read-lens-spec]], [[large-file-uploads]], [SDK boundaries](../clientv2/sdk-boundaries.md)
**Related research:** [[ethereum-first-efs-and-os]], [[mountable-filesystem-semantics]]
**Supersedes:** —
**Reviewers:** @efs-architecture-audit, @metadata-mapping, @cross-platform-mounts (2026-07-22 cross-track gap audit)
**Last touched:** 2026-07-22

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client

## Executive judgment

**Design for Solana now; do not promise interchangeable authority venues.** The portable data and lens thesis survives this pass and becomes clearer under pressure:

The broader product relationship is intentionally left open in [[ethereum-first-efs-and-os]]: Solana is a pressure test and possible future profile, while Ethereum remains the first-class EFS/composability prior and the OS may reach users through weaker local/network modes.

The adopted Linux/macOS/Windows read-only mount requirement is a separate host-integration track in [[mountable-filesystem-semantics]]. Its first required data source is Ethereum/EVM EFS. Passing or failing a host adapter neither selects nor rejects Solana; Solana support is evaluated by the capability ladder below.

> **EFS data and lens semantics can be substrate-portable; substrate guarantees cannot. Portability means the same authenticated artifacts and the same result from the same evidence—not that a local folder, S3 bucket, IPFS pin, Ethereum contract, and Solana program all prove the same things.**

The word “filesystem” currently hides several independent roles. Once those roles are separated, the likely support levels are:

| Solana role | Feasibility | Difficulty | Judgment |
|---|---|---:|---|
| Byte mirror | feasible | low technically, poor economics for bulk bytes | bounded carrier only |
| Portable evidence replica | feasible | medium | good first target |
| Conforming reader/lens source | feasible | medium | good first target if grades stay honest |
| Full record venue with bounded indexes | plausible | high | needs a real program/layout/cost spike |
| Authoritative KEL/admission domain | plausible | very high | a separate authority profile, not a contract port |
| Facts consumable by an Ethereum contract | research-grade | extreme | explicit bridge, light-client, oracle, or local-commitment project |

A bounded first comparison—not an adopted product scope—is therefore:

1. prototype Ethereum/Base as the first authority-profile candidate while [[owner-decision-inbox#Decide after evidence — do not answer yet|E1]] remains open;
2. freeze artifact, signer, lens, authority, evidence, proof, and byte-store boundaries before freezing EVM-shaped wire assumptions;
3. use a Solana support-level L1/L2 vertical slice plus a local bundle backend as the portability conformance test; and
4. make Solana an L3 authority domain only if its state layout, bounded queries, proof profile, cost, wallet flow, and operations pass the gates below.

This investigation informs the N1/E1 owner decisions. It does **not** choose independent realms, a cross-chain authority hub, or one unqualified principal with simultaneous Ethereum and Solana authority.

## 1. The question, sharpened

The original question was directionally right but “make the filesystem swappable” is too broad to test. The actionable version is:

> Evaluate each substrate separately as (a) a blob store, (b) an exact signed-artifact store, (c) an evidence-admission venue, (d) an authoritative KEL/admission home, (e) a query/index provider, and (f) a same-chain contract/program gate. For each role, identify which EFS guarantees it preserves without trust, which require a named operator or proof adapter, and which it cannot provide. Never infer equivalent guarantees from a shared storage API.

This framing also covers local files, SQLite, object storage, content-addressed networks, future L2s, and non-EVM chains without making Solana a special case in the portable core.

## 2. Support is a ladder, not a boolean

| Level | Name | Required behavior |
|---|---|---|
| **L0** | Byte carrier | Store and fetch bytes against a content commitment; report availability and retention basis. |
| **L1** | Evidence replica | Preserve exact canonical signed artifacts, logical IDs, signatures, and provenance without promoting them to authority. |
| **L2** | Conforming reader | Reconstruct evidence and resolve typed lenses with explicit basis, completeness, and grades. |
| **L3** | Authority profile | Admit records, order KEL and revocation, maintain required bounded indexes, and issue independently verifiable receipts. |
| **L4** | Foreign-program composability | A program on another authority venue consumes a verified current fact through an installed adapter or local commitment. |

Local files, SQLite, object stores, and IPFS naturally provide subsets of L0–L2. Solana plausibly provides L0–L3. L4 is a cross-chain verification system and must not be bundled into the phrase “Solana support.”

## 3. What is actually portable

These invariants belong above every adapter and should be added to the coordinated v2 recut.

1. Canonical record/envelope bytes and logical IDs are independent of chain ID, contract or program ID, relayer, payer, bucket, path, inode, and arrival order.
2. An adapter preserves the exact signed artifact. It may attach venue metadata but never silently re-encodes the signed bytes.
3. Transaction sender, Solana fee payer, cloud credential, local OS user, and IPFS provider are never inferred to be the record author.
4. A signature proves exact historical authorship. Current authorization, admission, truth, availability, and time require separate evidence.
5. Current authority is always named by authority domain and basis. There is no cross-venue last-write-wins clock.
6. A PDA, EVM storage slot, object key, filesystem path, or CID is a locator, not a logical EFS identity.
7. `admittedAt` is venue-relative existence evidence, not a universal timestamp or lens comparator.
8. `UNKNOWN` never becomes `PROVEN_ABSENT`. Missing accounts, partial replicas, incomplete pages, and unavailable providers cannot cause lens fallthrough.
9. Every index answer carries a basis and completeness statement. A cursor is bound to the query identity, realm/code basis, immutable evidence basis, and index version; the terminal page provides positive closure/high-watermark evidence. Missing or mismatched pages are `UNKNOWN`. Indexes nominate evidence; they do not create authority.
10. Lens compilation and evaluation are deterministic functions of evidence, typed policy, context, limits, an explicit basis vector, and an evaluation-time input. A reproducible snapshot pins that time input rather than silently changing when a wall clock crosses an expiry.
11. Content authority is selected before transport. Every fetched byte stream is checked against the selected commitment.
12. Logical revoke/withdraw/supersede is distinct from physical deletion, Solana account closure, S3 deletion, IPFS garbage collection, or local eviction.
13. Atomicity means atomic **visibility** of a committed envelope. A venue may stage bytes, but staged material is noncanonical until one commit marker succeeds.
14. Unsupported limits fail explicitly. An adapter never truncates an enumeration or downgrades a proof silently.
15. Copying evidence into another store does not create authoritative admission there.
16. Native key formats do not change principal semantics. A Solana Ed25519 key is an actor/key descriptor, not automatically the stable principal and not automatically linked to an Ethereum address.
17. Path grammar and Unicode normalization happen before adapter-specific mapping.

These refine [[assumptions-and-requirements]] R-D1/R-D7 and R-X1–R-X7; they do not replace them.

## 4. Do not build one `FilesystemBackend`

One convenient façade is fine for applications, but its internal capabilities must remain separate and typed. The minimum conceptual ports are:

```ts
interface ArtifactCodec {
  encode(value: PortableArtifact): Uint8Array;
  decode(bytes: Uint8Array): PortableArtifact;
  identify(bytes: Uint8Array): LogicalId;
}

interface SignerSuite {
  prepare(artifact: Uint8Array, actor: ActorDescriptor): SigningRequest;
  verify(artifact: Uint8Array, witness: SignatureWitness): ActorDescriptor;
}

interface EvidenceReplica {
  putExact(bytes: Uint8Array): Promise<EvidenceObservation>;
  get(id: LogicalId, basis?: ReplicaBasis): Promise<EvidenceObservation>;
  export(selection: Selection, basis: ReplicaBasis): Promise<PortableBundle>;
}

interface AuthorityVenue {
  capabilities(): VenueCapabilities;
  submitOrStage(bundle: PortableBundle): Promise<SubmissionState>;
  commit(bundleRoot: Digest, witness: CommitWitness): Promise<AdmissionReceipt[]>;
  authorityAt(principal: PrincipalId, basis: VenueBasis): Promise<AuthorityObservation>;
  checkpoint(): Promise<VenueBasis>;
}

interface QueryProjection {
  point(key: QueryKey, basis: VenueBasis): Promise<GradedObservation>;
  page(query: BoundedQuery, cursor: Cursor, basis: VenueBasis): Promise<GradedPage>;
}

interface ProofVerifier {
  verify(observation: GradedObservation, profile: ProofProfile): VerificationResult;
}

interface ByteStore {
  putVerified(bytes: ByteStream, commitment: Digest): Promise<ByteReceipt>;
  get(locator: Locator, range?: ByteRange): Promise<ByteObservation>;
  stat(locator: Locator): Promise<RetentionObservation>;
}
```

Implementations may combine ports. Callers must still see the distinct guarantees. A useful composite capability is `AUTHORITY_COLOCATED_ADMISSION`: the venue can validate actor authority and mint authoritative admission in one local total order, preserving the current KEL requirement without pretending every replica is an authority home.

Every observation should name at least:

```ts
type ObservationBasis = {
  venueId: string;
  realmOrGenesisId: string;
  locator: string;
  basis: VenueBasis | ReplicaBasis;
  proofProfile: string;
  finality: string;
  completeness: "PROVEN" | "DECLARED" | "UNKNOWN";
  durability: string;
  retention: string;
  trustClass: string;
  observedAt: string;
};
```

The OS may expose a friendly `venue` or “save to” object over these ports. Its types must make authority-only operations unavailable when the selected profile lacks them.

## 5. The lens is the stable OS abstraction

The filesystem/world view should be modeled as a projection, not as the storage API:

```text
EvidenceSet + BasisVector + LensPolicy + CapabilityProfile
                              |
                              v
                 Graded ResolvedView + diagnostics
```

Consequences:

- the same evidence, policy, limits, and basis must resolve to the same view on Ethereum, Solana, local bundles, and cloud replicas;
- a partial store may return a useful view, but it must preserve `UNKNOWN`, provenance, freshness, and completeness grades;
- typed interactive lenses can run client-side at 50/100/256 principals once benchmarked;
- contract/program gates should use deliberately small pinned policies or materialized commitments, not attempt the entire interactive lens language on every VM; and
- a view cached in the OS is derived state. It never becomes authority merely because it is fast or local.

This is the portable heart of the OS use case. Storage can change without changing the world model, while evidence quality remains visible.

## 6. Solana feasibility map

Solana is not EVM storage with different RPC names. Programs are stateless; persistent state lives in accounts, and only an account’s owner program may modify its data. Accounts use 32-byte addresses and can currently hold up to 10 MiB; account allocation and growth are rent- and instruction-bounded. ([accounts](https://solana.com/docs/core/accounts))

| EFS concept | Likely Solana representation | Portability rule |
|---|---|---|
| logical object/claim ID | canonical EFS `bytes32` | never derive identity from cluster or program ID |
| record locator | PDA such as `['claim', claimId]` | PDA is a program-bound locator only |
| exact signed record | immutable claim account or immutable segment | preserve canonical bytes verbatim |
| current slot winner | deterministic slot-state PDA | comparator remains EFS-defined, never Solana arrival order |
| principal/KEL head | per-principal authority PDA | only authoritative inside the named domain/basis |
| admission receipt | immutable receipt account plus finalized basis | receipt binds cluster, program/code basis, and slot |
| enumeration | explicit sharded page PDAs | do not make RPC scans part of contractual completeness |
| large bytes | external `ByteStore` by default; segmented accounts only when required | portable commitment, venue-specific storage |
| payer/relayer | Solana transaction signer | never inferred to be author |

[Program-derived addresses](https://solana.com/docs/core/pda) are deterministically derived from seeds and a program ID and are off the Ed25519 curve. That is useful for locating EFS state, but the program-ID dependency is exactly why a PDA cannot be the portable EFS identity.

### 6.1 Encoding and signatures

The current envelope baseline uses chain-free EIP-712 bytes, Keccak, and a 65-byte secp256k1 witness. Solana exposes Keccak and secp256k1 recovery syscalls, while native verification programs cover Ed25519, secp256k1, and P-256. ([hash and crypto syscalls](https://solana.com/docs/core/programs/syscall-reference), [precompiles](https://solana.com/docs/core/programs/precompiles)) This makes the current envelope **technically verifiable** on Solana; it does not settle the permanent codec/signature choice.

**Design-time recommendation:** make the coordinated recut suite-agile and reserve a canonical Ed25519 actor path now. Actor descriptors should domain-separate `(suite, publicKey)` before binding to a full-width stable principal; raw Ed25519 keys, EVM-address-derived values, and arbitrary 32-byte hashes must not share an untyped namespace.

Prototype both verification paths before the coordinated recut:

1. compute the canonical digest and recover the existing secp256k1 actor inside the EFS program; and
2. use a top-level signature-verification instruction plus strict instruction introspection for future Ed25519/P-256 suites.

The program must bind the verified key, exact message, signature, offsets, and intended EFS instruction. Test sibling-instruction substitution, offset tricks, multiple-verification ambiguity, high-S/recovery edge cases, and CPI wrappers.

A Solana wallet’s transaction signature is **not** automatically a portable EFS signature. Native-wallet UX needs either a canonical Ed25519 actor suite with real wallet support or an explicit bootstrap/delegation from the stable principal. Fee-payer and wallet convenience must never leak into authorship semantics.

### 6.2 Transaction size and staged commit

Solana transactions are atomic but currently limited to 1,232 bytes, and their instructions share transaction-level account and compute limits. ([transactions](https://solana.com/docs/core/transactions), [compute budgets](https://solana.com/docs/core/fees/compute-budget)) An EFS record can carry an 8 KiB value today, so “put the whole envelope in one instruction” is not a viable general mapping.

Use a stage-then-commit protocol:

```text
create bounded staging state
        |
upload immutable chunks in small transactions
        |
verify exact length + canonical digest/Merkle root + actor witness
        |
one atomic COMMIT marks the envelope/record visible and writes indexes
```

Required properties:

- interrupted staging is invisible to canonical reads and safely reclaimable;
- retry is idempotent;
- committed bytes cannot be reclaimed or rewritten;
- the commit transition is the only admission point;
- per-record admission remains possible where the current envelope permits it; and
- parent/dependency and authority checks are evaluated against one explicit commit basis.

This preserves portable atomic visibility without requiring one substrate transaction to carry all bytes. It also provides a reusable model for object stores and resumable local/cloud publication.

### 6.3 State layouts to prototype

| Layout | Strength | Failure pressure | Initial judgment |
|---|---|---|---|
| PDA per claim | simple point reads, immutable ownership, native composability | rent/account overhead and account explosion | baseline correctness prototype |
| Sharded append-only segments | denser state, fewer accounts | locator complexity, growth limits, write locks, state-only rebuild | benchmark challenger |
| Compressed Merkle roots | low on-chain state cost | full bodies live elsewhere; depends on index/data availability | not conforming as the primary archive under current R-D3/R-M2 direction |

Solana currently limits individual account data and per-instruction growth, so very large segments require carefully bounded reallocation. ([accounts](https://solana.com/docs/core/accounts)) One global writable spine or index head would also serialize writers; shard state by principal, definition, target, slot, and page as appropriate.

Traditional Solana state compression keeps a Merkle commitment in ordinary account state while applications reconstruct leaf data from ledger/off-chain indexing. ([state compression](https://solana.com/developers/courses/state-compression/generalized-state-compression)) It may become an evidence/cache tier, but it is not a canonical full-body spine unless EFS separately standardizes and guarantees that data-availability layer.

Committed permanent accounts should have no close/drain path. If reclamation is required for abandoned staging, the protocol must make the staged/committed distinction mechanically impossible to confuse.

### 6.4 Queryability and state-only reconstruction

Standard [`getProgramAccounts`](https://solana.com/docs/rpc/http/getprogramaccounts) can scan program-owned accounts with filters, but it is not the contractual answer to bounded queryability or proven completeness. The program should store the same logical indexes demanded by [[onchain-completeness]] as explicit, paginated accounts:

- point reads for objects, claims, slots, revocation, KEL state, and receipts;
- author enumeration;
- predicate-qualified backlinks;
- target/definition pages;
- reverse membership/cited-by where required; and
- an explicit reconstruction spine or equivalent normative export.

Clients can fetch known accounts in bounded batches—standard [`getMultipleAccounts`](https://solana.com/docs/rpc/http/getmultipleaccounts) currently accepts up to 100 addresses—but Solana programs cannot discover arbitrary accounts during execution. The caller must pass every account a gate needs, making small pinned program-gate policies even more important.

That difference is constitutional for same-venue composability, not merely an SDK inconvenience. A Solana gate pays for the accounts it is given, signature checks, loaded account data, and program computation inside the transaction budget; the current documented maximum is 1.4 million compute units per transaction, with a configurable loaded-account-data cap up to 64 MiB. ([compute budget](https://solana.com/docs/core/fees/compute-budget), [program limits](https://solana.com/docs/programs/limitations)) A naïve 50-principal interactive filesystem lens is therefore not a credible program-gate ABI. Prototype 1/8/32/50-principal pinned policies and materialized view commitments, then specify the largest autonomous policy EFS can honestly support without a trusted indexer or unconstrained account fan-out.

Historical transactions and logs are not the durable record layer. RPC nodes may purge old ledger data; the standard API exposes each node’s [`minimumLedgerSlot`](https://solana.com/docs/rpc/http/minimumledgerslot) and [`getFirstAvailableBlock`](https://solana.com/docs/rpc/http/getfirstavailableblock). Required bodies and reconstruction indexes therefore live in account state or in a separately normative durable export, never only in log history.

### 6.5 Proofs, finality, and honest grades

As of 2026-07-22, the documented standard [`getAccountInfo`](https://solana.com/docs/rpc/http/getaccountinfo) response returns account value plus an observed slot, but no cryptographic account-membership proof. **Inference:** a standard RPC response alone earns an RPC-observed trust grade, not the strongest independently verified state-proof grade. A stronger Solana profile needs a specified checkpoint/light-client/proof mechanism, multiple-provider strategy, or an explicit trust assumption.

A Solana venue basis should name at least:

- cluster/realm identity or genesis identifier;
- program ID;
- program code/version or successor basis;
- runtime/feature-set profile where it can change program execution or limits;
- commitment/finality rule and observed slot;
- account proof or RPC trust profile;
- completeness/index version; and
- observation time/freshness.

An upgradeable program is not an Etched semantic root merely because its address stays constant. Solana supports upgrade authorities and irreversible final deployment; reproducible verified builds can compare deployed program data with source, but neither substitutes for an EFS code-basis/successor rule. ([deployment and finalization](https://solana.com/docs/programs/deploying), [verified builds](https://solana.com/docs/programs/verified-builds))

### 6.6 Authority and sovereignty

A full Solana authority profile would co-order per-principal KEL events and authoritative record admissions in the same program/domain, then mint immutable receipts. That is feasible in principle and matches Solana’s per-account write serialization well for a single principal.

The cross-chain problem does not disappear:

- Ethereum contracts cannot query Solana accounts synchronously.
- Solana programs cannot query Ethereum state synchronously.
- Solana slots and Ethereum blocks do not form one total order.
- two venues cannot both silently answer unqualified `CURRENT` for the same principal.

Therefore one of these must be explicit:

1. **one fixed EFS authority profile** — Solana is evidence/reader/storage unless selected as that fixed profile;
2. **independent realms** — the same portable evidence may appear in both, but authority is realm-qualified; or
3. **an installed cross-chain verification system** — local commitment, bridge, light client, ZK/finality proof, or oracle with named updater, rollback, freshness, challenge, and failure semantics.

This is the owner choice already represented by N1 and E1. A generic adapter must not manufacture a fourth option by merging the latest values it happened to observe.

### 6.7 Large bytes

Solana account storage can hold bounded bytes, but rent deposits, transaction chunking, account growth, and read fan-out make it an unattractive default bulk store. The EVM-specific `EFSBytes`/SSTORE2/CREATE2 mechanism in [[large-file-uploads]] is a venue adapter, not part of the portable byte model.

The portable contract is instead:

1. the signed artifact names a content commitment and size;
2. one or more `ByteStore` observations advertise location, availability, retention, and trust class;
3. the reader verifies every fetched byte against the selected commitment; and
4. missing bytes yield `BYTES-UNAVAILABLE` or `BYTES-PARTIAL`, never false absence or altered identity.

Solana state, EVM state, Arweave, IPFS, S3, and local files can all be byte carriers under that contract. They are not interchangeable preservation guarantees.

### 6.8 What a native host would mount

A Linux/macOS/Windows adapter would not mount “the SVM” as a raw disk. It would mount one declared EFS resolved view:

```text
host adapter -> shared EFS resolver -> Solana realm/replica adapter
                                      -> program accounts + explicit page accounts + byte stores
```

- An **L1 evidence replica** can back an offline/snapshot mount only when a bundle or closure manifest proves which records, pages, and bytes are included. Missing closure remains `UNKNOWN`.
- An **L2 conforming reader** can back a useful read-only mount when its point reads, basis-bound pages, KEL/evidence observations, and byte commitments reproduce the shared resolver vectors.
- An **L3 authority realm** can additionally support realm-qualified current reads when its KEL/admission, finality/proof, code-basis, and completeness contracts pass their own gates.
- No Ethereum↔Solana bridge is required for a user’s host to read and mount that view. A bridge or local commitment is required only when a program/contract on one venue must consume a current fact from the other.

The first required cross-platform mount remains an EVM EFS view. A later Solana mount should reuse the shared resolver and host adapters; if it needs a second filesystem implementation, the portability boundary has failed.

## 7. Capability matrix beyond Solana

| Capability | Ethereum/EVM profile | Solana profile | Local FS/SQLite | S3-like object store | IPFS/CAS |
|---|---|---|---|---|---|
| Exact signed bytes | yes, expensive | yes, rent-funded | yes | yes | yes |
| Content verification | hash/contract | hash/program | local hash | client hash/checksum | CID verifies content |
| Shared canonical admission order | chain-relative | cluster-relative | only a declared local realm | no public consensus | no |
| Public current authority | KEL contract possible | KEL program possible | device/operator trust | IAM/operator trust | no |
| Atomic bundle visibility | transaction/gas bounded | transaction or staged commit | DB transaction/rename protocol | bundle/head protocol | immutable DAG plus mutable publication |
| Native same-venue gates | yes | yes | no | no | no |
| Independently verified point read | proof-profile dependent | separate proof profile needed | local custody | provider trust | integrity only, not currency/availability |
| Complete bounded enumeration | explicit indexes | explicit page accounts | straightforward | LIST plus manifest/basis | only under a known complete DAG root |
| Physical deletion | normally unavailable | possible unless program forbids closure | yes | yes unless retention policy | caches/providers can garbage-collect |
| Bulk bytes | poor/expensive | poor/expensive | good | excellent | good while pinned/provided |
| Availability basis | replicated chain state | rent-funded account state | device/backups | SLA, account, operator | provider/pin set |
| Observer model | public chain + RPC | public chain + RPC | local/sync/backup operators | account/provider logs | public CID/provider/DHT metadata |

S3 provides strong read-after-write and LIST consistency, but atomicity remains per key and Object Lock/versioning are account policies, not public consensus or portable authority. ([S3 consistency](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html), [Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html))

IPFS content addressing lets readers verify returned blocks, but a CID names content rather than a storage location and continued availability requires pinning/providers. ([content addressing](https://docs.ipfs.tech/concepts/content-addressing/), [persistence and pinning](https://docs.ipfs.tech/concepts/persistence/))

The practical composition may therefore be:

```text
Ethereum authority + Solana evidence replica + local workspace/cache
                   + Arweave/IPFS/S3 byte replicas
                   + one pure lens engine over graded observations
```

That is modular without pretending the components have equal authority.

## 8. Main traps this architecture must prevent

- **Authority laundering:** copied evidence becomes “current” because it is stored by a prestigious venue.
- **Ordering leakage:** lens winners depend on block, slot, object timestamp, local mtime, or discovery order.
- **Identity leakage:** PDAs, addresses, buckets, or paths enter portable IDs.
- **Submitter confusion:** payer/relayer/provider becomes author.
- **False absence:** a missing RPC account, page, pin, or cache entry triggers fallthrough.
- **Index poisoning:** a popular target creates one globally hot writable page or an unbounded predicate-blind scan.
- **History dependence:** logs or compressed off-chain payloads become the only reconstructable source.
- **Program mutability:** an upgraded program silently changes the meaning of old receipts.
- **Runtime drift:** a stable program ID is evaluated under a changed cluster feature/runtime profile without that code basis appearing in the receipt or replay rules.
- **Deletion confusion:** account closure or object deletion is treated as EFS revocation.
- **Privacy flattening:** “decentralized” is treated as private despite RPC, provider, DHT, and access-log observers.
- **Cost flattening:** gas, rent deposits, storage/egress, pinning, and local quota are exposed as one misleading `writeCost`.
- **Bridge creep:** foreign-program reads arrive through an unnamed oracle/bridge and are presented as native EFS proof.

## 9. Recommended design-time reservations

These are valuable now even if no Solana code ships in v2:

1. **Canonical artifact layer:** one normative byte-level conformance bundle with chain-free IDs and no EVM address truncation.
2. **Signature suite registry:** bind suite, key descriptor, exact transcript, canonicality rules, and vectors; keep transaction signing separate.
3. **Authority domain descriptor:** realm/genesis, venue code basis, finality, proof profile, and successor rules are explicit inputs to authority APIs.
4. **Capability-bearing adapters:** split codec, signer, evidence, authority, query/proof, bytes, and workspace boundaries in [[sdk-boundaries]].
5. **Basis-bearing lens API:** resolution consumes explicit evidence/completeness/basis/evaluation time and returns grades plus diagnostics; page cursors and positive closure are tied to the same immutable query basis.
6. **Portable staged-commit semantics:** define canonical visibility independently of transaction count.
7. **Normative bundle/export format:** exact signed artifacts plus separately labeled venue receipts, proof material, indexes/manifests, and bytes.
8. **No locator-shaped identity:** full-width principals and logical IDs at every boundary; program/contract locators live only in profiles.
9. **State-only completeness contract:** required bodies and bounded indexes cannot rely only on logs or a hosted indexer.
10. **Honest feature vocabulary:** `evidenceReplica`, `authoritativeAdmission`, `nativeProgramReadable`, `proofProfile`, `completeEnumeration`, and `retention` replace one boolean `supported`.

## 10. Effort and sequence

These are order-of-magnitude engineering estimates, not commitments. They assume the coordinated envelope/KEL/lens semantics settle first; changing the canonical codec or authority topology later invalidates much of the work.

| Phase | Deliverable | Rough effort | Exit condition |
|---|---|---:|---|
| 0 | portable ports, golden vectors, `.efs-bundle`, local/SQLite reference backend | 3–6 experienced engineer-weeks | exact bytes/IDs/views match across implementations |
| 1 | Solana support-level L1 evidence replica + L2 conforming reader, secp path, staged 8 KiB record | +4–8 engineer-weeks | state-only replay and honest grades work on testnet |
| 2 | three Solana layouts, required indexes, cost/contention/finality/proof benchmarks | +8–16 engineer-weeks | one layout passes every bounded query and no trusted-indexer gate |
| 3 | production L3 authority profile, KEL/admission receipts, wallet flow, code succession, audits and ops | roughly 3–6+ engineer-months | security review, failure drills, budgets, and owner E1 acceptance |
| 4 | L4 Ethereum↔Solana program verification | separate 6–12+ month/security program | explicit bridge/light-client threat model and ongoing operations |

The bounded comparison sequence is Phase 0 plus the narrowest credible Phase 1 spike. Phase 2 would supply evidence for E1. Phase 3 is not a launch promise until that evidence exists. Phase 4 should not become a hidden dependency of the OS.

## 11. Falsification plan

1. **Cross-carrier golden vector:** sign once; Ethereum, Solana, local bundle, S3, and IPFS recover identical canonical bytes, IDs, principal, and lens result.
2. **PDA independence:** redeploy under another program ID; every PDA changes while every logical ID/signature remains identical.
3. **Permutation/confluence:** ingest records in every order with retries and same-order collisions; the resolved view remains byte-identical.
4. **Unknown/absence attack:** omit the highest-priority evidence from an RPC page or partial replica; resolution stops at `UNKNOWN` instead of falling through.
5. **Submitter substitution:** change EVM sender, Solana payer, cloud credential, IPFS provider, and local user; authorship never changes.
6. **Signature-substitution corpus:** malicious offsets, wrong sibling instruction, wrong message, double hash, ambiguous multiple verifications, CPI wrapper, and recovery edge cases all fail.
7. **Interrupted staged commit:** crash after every upload step; no subset is canonical before commit, retry is idempotent, and abandoned staging is reclaimable.
8. **Closure/rent attack:** every attempt to close or drain a committed permanent record account fails.
9. **Upgrade-basis attack:** change program code; old receipts remain tied to the old basis and readers do not silently equate versions.
10. **State-only rebuild:** remove transaction history and hosted indexers; reconstruct bodies and required indexes from surviving state plus normative exports.
11. **Hot-target spam:** direct a large adversarial corpus at one tag/target; measure writable-account contention, rent, page size, and bounded read cost.
12. **Cross-home revoke:** change authority at the selected home after a replica snapshot; replica reads become `AS-OF`/`UNKNOWN-CURRENCY` and gates fail closed.
13. **Mirror-loss:** remove every byte provider while keeping metadata; report authenticated commitment plus `BYTES-UNAVAILABLE`, not absence or corruption.
14. **Native-key collision:** full-width distinct principals and actor keys remain distinct across all adapters.
15. **Lens differential:** two independent implementations with the same evidence, policy, clock, limits, and basis vector produce the same result and grades.
16. **Walk-away drill:** with no EFS-operated service, rebuild and resolve a representative OS tree from public state and exported bundles.
17. **Cost falsifier:** price a small file, folder listing, backlinks, 50-principal lens inputs, KEL rotation, and large-record commit. Reject Solana L3 if a core capability needs a trusted indexer or a globally hot writable account.

If Phase 0 vectors do not match, the portable artifact freeze is blocked. If Solana fails the Phase 2 state/query/cost gates, keep L1/L2 support and explicitly decline L3 authority.

## 12. Owner decisions this pass must not make

- [ ] **N1/E1 topology:** fixed Ethereum/Base authority profile, independent Solana realm, or another measured fixed profile. This investigation recommends measuring before choosing.
- [ ] **Canonical signing artifact:** retain EIP-712/ABI/Keccak as a deliberately chain-neutral transcript with tagged secp256k1/Ed25519/P-256 suites, or adopt another neutral codec/transcript in the coordinated recut.
- [ ] **Profile parity:** must every L3 profile supply identical native program queries, or may capability grades differ while portable lens results remain equal given the same evidence?
- [ ] **Durability baseline:** does the current on-chain + Arweave ruling stay mandatory while local/cloud/IPFS remain additive, or may another profile replace it?
- [ ] **`nativeProgramReadable`:** is the product requirement EVM-contract-readable specifically, or same-venue program-readable under a named profile?
- [ ] **Local/cloud authority:** are these ever valid authority domains, or only workspaces, caches, byte stores, replicas, and declared private realms?

## Open questions

- [ ] Freeze the minimum `VenueCapabilities`, observation basis, and error/grade vocabulary.
- [ ] Decide the canonical transcript independently from the signature-suite registry; a tagged Ed25519 actor path and full-width principal binding must be represented either way before envelope freeze.
- [ ] Prototype Solana syscall recovery versus precompile+introspection and benchmark both.
- [ ] Prototype PDA-per-claim and sharded-segment layouts with the complete [[onchain-completeness]] index bundle.
- [ ] Specify the minimum independently verifiable Solana proof/finality profile; do not award strongest grade to standard RPC by default.
- [ ] Test real Solana wallet support for canonical message signing and the stable-principal bootstrap/delegation flow.
- [ ] Define `.efs-bundle` exact bytes, manifests, receipt/proof sidecars, completeness statement, and import rules.
- [ ] Route any change to N1/E1 or the on-chain durability baseline through [[owner-decision-inbox]] and [[owner-rulings]].

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] Phase 0 cross-carrier vectors run in at least two independent implementations
- [ ] Solana state/query/cost prototype includes every mandatory index, not a point-read-only demo
- [ ] Independent Solana program security review completed before any L3 claim
- [ ] At least one round of `#status/review` with another agent or human comment

## Research basis

This pass combined the current EFS v2 constitutional documents with independent architecture, backend-capability, and Solana-runtime reviews on 2026-07-22. External technical claims link to the relevant official Solana, AWS, and IPFS documentation at the point of use. Product conclusions remain EFS design judgments, not claims made by those sources.
