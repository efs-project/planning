# EFS v2 Core EIP/ERC pressure screen

**Status:** complete pinned corpus ingestion/classification plus selected proposal-level design integration; not a standalone per-proposal seam/edit/hazard/action matrix, and no proposal, profile, ABI, byte format, Core primitive, deployment, or support claim is adopted
**Scope:** contract-readiness implications of the complete official EIP/ERC corpus indexed on 2026-08-22
**Feeds:** [[Designs/efsv2/ethereum-standards-and-execution-profile]], [[Designs/efsv2/v2-contract-readiness-program]], [[Designs/efsv2/system-constitution]], [[Designs/efsv2/core-architecture-candidate]], [[Designs/efsv2/layered-type-system-and-data-abi]]
**Evidence base:** [[Reviews/2026-08-22-web-client-os-eip-erc-screen/README]] and its [[Reviews/2026-08-22-web-client-os-eip-erc-screen/corpus-index.tsv]]
**Classification authority:** the numbered A–E lists below plus the exact canonical class-F remainder, joined by `(corpus, number)` to the shared index
**Reviewers:** @eip-exhaustive-audit, @erc-exhaustive-audit, @g1-task1c-impl (2026-08-23)
**Reviewed:** 2026-08-23

#status/done #kind/review #repo/planning #repo/contracts #repo/sdk #topic/efsv2 #topic/read-path #topic/identity #topic/types #topic/reconstruction #topic/ethereum-standards

## Verdict

The corpus supports EFS v2's direction, but it also exposes one missing design
layer: Core cannot honestly target an undifferentiated thing called “the EVM.”
A candidate Realm needs a pinned accepted execution profile for activated fork
rules, precompiles, verifier suites, and resource ceilings; observers need a
separate pinned read/evidence profile for chain history, RPC/read features,
proof assumptions, and finality actually used.

No EIP or ERC replaces EFS's Type, Record, Occurrence, Admission, Principal,
Binding, Lens, QueryProfile, Realm, completeness, or reconstruction semantics.
That is a positive result. EFS is not overlooking a modern standard that makes
its generic data model unnecessary. The strongest standards instead sharpen
the boundaries around that model:

1. chain ID is not sufficient Realm identity;
2. exact block-hash/state-root evidence is the minimum coherent basis for
   offchain or multi-call dynamic observations;
3. a proof or log page does not prove complete enumeration;
4. historical and byte availability are independent of semantic identity;
5. signature validity is suite-, code-, policy-, gas-, and block-basis
   qualified;
6. future fork proposals are scenario inputs until activated by a supported
   Realm; and
7. external standards enter through versioned adapters unless a separately
   reviewed EFS profile deliberately adopts them.

The complete corpus classification found **no standards-driven requirement for
a new Core noun**. It did find mandatory readiness fixtures for Realm identity,
exact reads, query completeness, verifier history, Type evolution, EVM resource
ceilings, and independent reconstruction. Those are integrated into the
companion design and G0–G6 readiness program.

This closes the pinned corpus screen, not G0. Readiness remains `G0-PARTIAL`
until a committed, independently reviewed disposition receipt is reconciled
with the sealed Task1C evidence and current candidate.

## Pinned corpus and reuse boundary

This pass deliberately reuses the exhaustive official-source ingestion rather
than generating a competing standards inventory.

The EFS planning input was source-locked at
[`efs-project/planning@e4180cc`](https://github.com/efs-project/planning/commit/e4180cca2d13df205b05bb886a60969e084a9fc3),
the `main` revision containing the corrected shared corpus screen when this
Core pass began.

| Corpus | Pinned official revision | Source files | Unique substantive proposals |
|---|---|---:|---:|
| EIPs | [`ethereum/EIPs@f767a1e`](https://github.com/ethereum/EIPs/commit/f767a1e8078e17c9b381a91d35a09492189ede1b) | 949 | 584 |
| ERCs | [`ethereum/ERCs@9c718c7`](https://github.com/ethereum/ERCs/commit/9c718c7c02372a6b7e300990511cd6fdff7f1dfa) | 612 | 611 |

The EIP lane includes 365 `Moved` ERC stubs. The ERC lane includes one support
copy of `eip-1.md`. The shared index therefore covers 1,561 Markdown source
files and 1,195 unique substantive proposals. Its recorded SHA-256 is:

```text
4315e018d019c409b56e4cb2b60ca708b7dc32d4768faad2a7f4f0293502995f
```

The Web Client/OS screen reviews product and interoperability boundaries. This
supplement asks a different question of the same corpus: **what can invalidate
or materially improve a century-scale EFS Core, its contract implementation,
and the evidence required before implementation?**

## Method

Every canonical EIP and ERC received a Core-pressure classification after the
shared complete ingestion. High-value candidates were then read against the
active EFS v2 constitution, Core candidate, layered Type/Data ABI, and contract
readiness gates. Classification is about design pressure, not proposal merit or
target-chain support.

| Class | Meaning in this review |
|---|---|
| **A — direct Core constraint** | Must shape a Core invariant, exact profile, or readiness fixture before `GO-CODE`. |
| **B — contract/SDK boundary** | Must shape realization, evidence, reads, deployment, or adapters; normally not a Core semantic noun. |
| **C — adversarial precedent** | Supplies a useful attack, evolution, reconstruction, or interoperability fixture. |
| **D — reserve/watch candidate** | Possible future execution physics, interface, or realization to model without depending on, adopting, or promising it. |
| **E — explicit non-dependency** | Attractive mechanism that EFS must not silently require for correctness or permanence. |
| **F — application/out of scope** | Legitimate standard or proposal with no demonstrated generic Core consequence. |

The dispositions are intentionally conservative. A proposal's EIP-1 status is
recorded in the shared index but does not decide its class. `Final` does not
mean activated or supported, while a Draft proposal can still provide a sharp
falsifier.

## Coverage ledger

Every one of the 1,195 canonical source texts was ingested and screened. The
Core pass then performed proposal-level specification/security reading on 128
EIPs and 99 ERCs. The other 456 EIPs and 512 ERCs remain hash-addressed class-F
screen results, not a claim of equal paragraph-by-paragraph commentary. The 99
ERC deep reads are exactly classes A–E. The EIP deep reads include all 122 A–E
items plus six class-F negative controls: EIP-3030 (BLS Remote Signer HTTP
API), EIP-7542 (eth/70 available-blocks-extended), EIP-7639 (ceasing pre-PoS
history service), EIP-7643 (pre-PoS history accumulator), EIP-8256 (blob
streaming), and EIP-8268 (storage roots in block access lists). They remained F
because their useful hazards did not justify a generic EFS Core dependency.

| Corpus | Living | Final | Last Call | Review | Draft | Stagnant | Withdrawn | Deep read | Screen-only |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| EIPs | 3 | 138 | 5 | 34 | 131 | 238 | 35 | 128 | 456 |
| ERCs | 0 | 141 | 14 | 64 | 221 | 162 | 9 | 99 | 512 |

Titles, dates, status, dependencies, source filenames, hashes, and full-text
screen tags for every proposal remain in the shared `corpus-index.tsv` rather
than being copied here. The numbered A–E lists below are the complete Core
disposition overlay; F is the exact canonical remainder. High-value seam,
hazard, and gate conclusions follow after the lists, while the companion design
maps them into G0–G6.

### EIPs

All 584 canonical substantive EIPs were screened. The Core-pressure split is:

| Class | Count |
|---|---:|
| A | 25 |
| B | 25 |
| C | 30 |
| D | 29 |
| E | 13 |
| F | 462 |

**A — direct Core constraint (25):** 155, 695, 1344, 234, 658, 1898,
170, 3541, 3860, 2028, 2929, 3529, 7623, 7825, 7934, 3607, 7702,
4444, 4938, 7642, 6049, 6780, 7823, 7883, 7951.

**B — contract/SDK boundary (25):** 712, 1014, 7997, 1052, 1186,
1474, 1559, 1901, 7910, 8123, 2124, 2255, 2696, 5792, 6963, 2537,
2930, 2935, 4788, 3076, 3155, 4881, 7966, 8072, 7975.

**C — adversarial precedent (30):** 1767, 1959, 1965, 2294, 3534,
2718, 6873, 6953, 7495, 7688, 7916, 8016, 7577, 7713, 7745, 8304,
7792, 7843, 7906, 7928, 7949, 8025, 8101, 8146, 8159, 8189, 8250,
8266, 8272, 8347.

**D — reserve/watch candidate (29):** 7773, 8081, 2780, 3298,
7778, 7954, 7976, 7981, 8037, 8038, 8075, 8295, 8296, 6800, 7864,
8297, 7666, 7932, 8051, 8052, 8130, 8141, 8164, 8197, 8202, 8310,
8252, 8337, 8371.

**E — explicit non-dependency (13):** 1153, 8125, 1681, 1962,
3220, 4399, 4844, 7594, 5345, 7749, 7896, 8151, 8188.

The remaining 462 EIPs are class F for this Core pass. They remain in the
shared hash-indexed corpus; class F does not erase them or prevent a future
application profile from using them.

### ERCs

All 611 unique ERCs were screened. The Core-pressure split is:

| Class | Count |
|---|---:|
| A | 1 |
| B | 17 |
| C | 24 |
| D | 46 |
| E | 11 |
| F | 512 |

**A — direct Core constraint (1):** 1271.

**B — contract/SDK boundary (17):** 165, 191, 2098, 5267, 7913,
1167, 2771, 4337, 6492, 4361, 3668, 4804, 5219, 5564, 6538, 7950,
8001.

**C — adversarial precedent (24):** 1319, 1577, 5169, 1820, 5269,
1900, 1921, 2157, 3224, 5018, 5625, 7053, 5732, 7201, 7208, 7509,
8042, 7588, 7627, 7744, 7813, 8100, 8167, 8328.

**D — reserve/watch candidate (46):** 5573, 5639, 7710, 7746,
5164, 6170, 7786, 7841, 6372, 7828, 7930, 7964, 8111, 6860, 6944,
7087, 7617, 7618, 7774, 7406, 7412, 7506, 7677, 7821, 7836, 7846,
7871, 7902, 7920, 7738, 7996, 8074, 8119, 8004, 8048, 8122, 8084,
8121, 8143, 8152, 8153, 8179, 8180, 8257, 8273, 8326.

**E — explicit non-dependency (11):** 1967, 2535, 5630, 6224,
7820, 7585, 7827, 7831, 8049, 8126, 8196.

The remaining 512 ERCs are class F for this Core pass.

## High-value findings

### 1. Realm identity must be stronger than `chainId`

[EIP-155](https://eips.ethereum.org/EIPS/eip-155) gives transaction replay
protection a chain identifier. [EIP-1344](https://eips.ethereum.org/EIPS/eip-1344)
exposes it to contracts. Neither identifies a genesis, activated fork schedule,
Core deployment, component code, policy revision, verifier suite, finality
model, or possible upgrade authority.

An EFS `RealmId` therefore cannot be merely `chainId`, and an EFS read basis
cannot be merely `chainId + blockNumber`. The candidate Realm
bootstrap/revision closure must bind chain/genesis identity, exact Core
component commitments, the accepted execution profile, and authority/policy
discovery. Exact placement across stable `RealmId`, bootstrap, and revision is a
G1 comparison; mutable revision and observation basis remain separate from
stable Realm identity.

### 2. Exact block hashes are the offchain coherent-read floor

[EIP-1898](https://eips.ethereum.org/EIPS/eip-1898) and
[EIP-234](https://eips.ethereum.org/EIPS/eip-234) supply the right shape for
pinning dependent calls and logs to one block hash. Block numbers alone can be
reorg-ambiguous; repeated `latest` calls can combine states that never
coexisted. One onchain call already sees atomic current state, but the contract
cannot know its current block hash; a later/offchain envelope supplies exact
block/state evidence for portable or multi-call observations.

[EIP-1186](https://eips.ethereum.org/EIPS/eip-1186) point proofs are useful
only with independently trusted header/state-root and finality evidence. A
point proof does not establish that all matching keys or events were enumerated.
The offchain read result therefore needs an exact basis and a separate coverage
claim; a direct onchain result needs its atomic execution basis and coverage.
Neither can infer `COMPLETE` from successful transport responses.

### 3. Completeness is a protocol result, not a transport mood

Ethereum JSON-RPC calls, logs, proofs, archive nodes, and indexers expose data
under different limits and retention. None provides generic closed-world
enumeration for EFS Types, backlinks, Bindings, or history.

Every paged EFS query must bind a finite domain or pinned high-water, retain a
stable basis, expose continuation and coverage, and reserve terminal
`COMPLETE` for an independently checkable completion condition. Timeout,
truncation, pruning, unavailable proof data, or optional-indexer absence is
`PARTIAL` or `UNKNOWN`, never empty or absent.

### 4. Chain history and byte availability are not permanence

[EIP-4444](https://eips.ethereum.org/EIPS/eip-4444),
[EIP-7642](https://eips.ethereum.org/EIPS/eip-7642), and
[EIP-4938](https://eips.ethereum.org/EIPS/eip-4938) pressure clients to assume
that historical bodies, receipts, logs, or arbitrary trie nodes may not remain
universally served.
[EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) blobs are explicitly
temporary data availability, not a century-scale EFS carrier.

Core authority and reconstruction commitments must remain state-readable or
have an exact, independently reproducible availability contract. A content hash
surviving in state proves expected bytes, not available bytes. Cache or RPC
failure proves neither semantic absence nor revocation.

### 5. Verifier behavior must be profile-pinned and historically honest

[ERC-1271](https://eips.ethereum.org/EIPS/eip-1271) is the sole ERC in the
direct-Core class because fresh Realms must support contract Principals. Its
result is dynamic contract behavior: code, storage, dependencies, gas, and
block basis matter. Current revalidation cannot rewrite what an earlier Realm
admission accepted.

[EIP-7951](https://eips.ethereum.org/EIPS/eip-7951) makes P-256 a practical
candidate suite on activated Realms. [EIP-8151](https://eips.ethereum.org/EIPS/eip-8151)
is negative evidence: ambient `ecrecover` behavior or address-encoding
assumptions must not leak into a nominally different verifier profile.

Each admission therefore binds a versioned verifier suite, execution coordinate,
transcript/result, and later exact observation basis. Verification has bounded
gas and return data; unknown suites fail closed. Historical evidence preserves
enough verifier semantics and dependencies either to replay a pure result or to
audit the recorded stateful Realm transition without consulting current state.

### 6. Current and future EVM physics must stay distinct

EIP-170 runtime size, EIP-3860 initcode, EIP-2028/7623 calldata, EIP-2929 cold
access, EIP-3529 refunds, EIP-7825 transaction gas, EIP-7823/7883 modexp, and
EIP-7934 block-level limits affect topology and bounds today on particular
activated profiles.

Draft scheduling or fork-inclusion documents are not activation evidence.
[EIP-7773](https://eips.ethereum.org/EIPS/eip-7773) and candidates including
EIP-7954, EIP-7976, EIP-7981, EIP-8037, EIP-8038, EIP-7928, and EIP-7997
belong in separately named future scenarios. EFS should measure against at
least one conservative current profile and selected future profiles without
making Core correctness depend on those futures.

A hard fork changes execution beneath deployed bytecode; it does not invoke an
EFS profile transition. The accepted profile is therefore a commitment and
conformance claim, not a mechanism that can automatically stop unknown ambient
semantics. Freeze review must identify the stable EVM subset, observer-detected
profile mismatch, and changes that require explicit Realm succession.

### 7. Type evolution needs hostile codec precedents

EIP-7495, EIP-7688, EIP-7916, and EIP-8016 expose recurring evolution hazards:
defaults that change meaning, optional fields, unknown variants, inactive
fields, and representation transitions. They do not imply that EFS should
adopt SSZ or another consensus codec.

They do justify adversarial Type/Data fixtures: unknown fields preserved,
explicit versions, no representation-dependent silent identity reuse,
canonical defaults, rejection of noncanonical twins, and successor/projection
evidence rather than mutable reinterpretation.

### 8. Reconstruction requires an independently derivable state projection

EIP-4881 and EIP-8347 are useful reconstruction precedents: commitments need
an exact derivation procedure, not merely a root that the writer claims. EFS's
independent reader must start from an independently authenticated Realm
bootstrap and exact/finalized block-state basis plus declared public
chain/carrier configuration, derive and check the finite canonical inventory
under Core rules, and reproduce the projection without a writer database,
private ABI, manual module list, or hosted indexer. Agreement between two
readers proves deterministic projection only; it does not authenticate their
source or establish domain completeness by itself.

### 9. The historical dType family validates EFS's restraint

ERC-1900, ERC-1921, and ERC-2157 explored registry-backed runtime data typing.
They are strong prior art and negative evidence. EFS should preserve their
developer goal—shared data interpretation—without a globally governed type
registry, mutable meaning, or executable Type callbacks inside Core. Exact,
permissionless, non-executable Type revisions plus optional catalogs and
explicit projections remain the safer candidate.

### 10. Deployment and modularity are realization choices

EIP-1014 and `Review` EIP-7997 inform reproducible deployment. EIP-1052
informs runtime-code observation. ERC-7201 informs explicit storage namespaces.
ERC-2535, ERC-1167, registries, factories, and module standards are topology or
adapter precedents, not EFS semantic identity or upgrade authority.

ERC-8153 changed from Draft to Review between the recovered 2026-08-13 and
pinned 2026-08-22 snapshots. That delta is useful refresh evidence, but Review
status still establishes neither target support nor an EFS dependency.

No proxy, facet registry, factory, or canonical address is allowed to mutate
the meaning of already admitted data. The monolith, immutable-facet, and
narrow-state-owner arms must be measured against one sealed semantic oracle.

## Readiness-gate consequences

| Gate | Standards pressure now required |
|---|---|
| G0 | Pin the official corpus, exact source revisions, proposal statuses, and accepted current/future execution scenarios. Record activation/support separately from EIP-1 status. |
| G1 | Make Realm identity stronger than chain ID. Add hostile Type evolution vectors and exact execution/verifier profile identities without freezing their final bytes. |
| G2 | Define exact block-hash bases, finite query domains, high-waters, continuation, `PARTIAL/COMPLETE`, proof dependencies, and bounded result/error ABIs. |
| G3 | Bind verifier suite, code/dependency/policy/gas/basis; test ERC-1271 and EIP-7702 change across time; prevent ambient verifier substitution. |
| G4 | Reject mixed-basis Lens inputs. Treat proof/log/RPC/indexer coverage as qualified evidence, not authority or completeness. |
| G5 | Measure at least one conservative activated EVM profile and explicit future scenarios; independently reconstruct without relying on historical body/log availability. |
| G6 | SDK and Explorer expose accepted versus observed chain/profile support, raw evidence, degraded reads, and adapter failures without changing EFS facts. |

## Nomenclature and corpus corrections

This screen found several small citation drifts in active EFS prose:

- ERC-1271, ERC-4337, ERC-6492, ERC-2535, and ERC-7617 belong to the ERC
  corpus even though their canonical public URLs retain `/EIPS/eip-N`.
- EIP-7907 is not an activated universal 64 KiB runtime-code rule. Runtime
  limits must come from the accepted Realm execution profile; larger-code
  candidates remain scenario evidence.
- No official ERC-8168 or ERC-8213 existed in the pinned corpus. References to
  “ERC-8168-style” or an “ERC-8213 shape” must be explicitly labeled as
  external/historical proposal shorthand, not official standards evidence.

These are documentation corrections, not judgments about the usefulness of
the underlying ideas.

## Explicit non-adoptions

This review does **not** adopt:

- one canonical chain, fork, finality model, RPC, archive provider, or indexer;
- EIP-1186 as a generic enumeration or completeness proof;
- blobs, calldata history, logs, transient storage, `SELFDESTRUCT`,
  `PREVRANDAO`, or a mutable proxy as a permanence dependency;
- SSZ, dType, table schemas, token metadata, registries, or agent reputation as
  EFS Core semantics;
- ERC-1271 current-state revalidation as historical admission truth;
- Draft/Review/Last Call proposal behavior merely because it appears in a
  future fork planning document; or
- any exact EFS profile ID, ABI, limit, address, byte encoding, or contract
  topology.

## Falsifiers and required fixtures

The standards profile is inadequate if any of these survives the G0–G6 pass:

1. two chains with the same `chainId` or two deployments on one chain can be
   mistaken for one Realm;
2. a page assembled from different block hashes can be reported as coherent;
3. a point proof, log range, indexer response, or timeout can manufacture
   `ABSENT_PROVEN` or `COMPLETE`;
4. later ERC-1271 code/storage or EIP-7702 delegation can change the recorded
   meaning of an earlier accepted Occurrence;
5. an unknown verifier, precompile, fork rule, result shape, or capability
   silently falls back to a nearby supported one;
6. an activated profile limit can invalidate a legal Core state transition or
   make its worst-case result unbounded;
7. Type evolution drops unknown data or preserves an exact Type identity while
   changing accepted values or interpretation;
8. a fresh independent reader needs a writer database, private ABI, manually
   supplied module graph, historical provider, or EFS-operated indexer to
   reconstruct authoritative state; or
9. SDK/product adapters report support inferred from EIP-1 status instead of
   observed target behavior.

## Limitations and refresh rule

This is complete corpus ingestion/classification plus selected proposal-level
design integration at the two pinned repository revisions, not a standalone
per-proposal action matrix or a claim of permanent currency. Proposal text,
status, repository layout, fork plans, and deployed-chain support can change.
Before `GO-CODE`, re-pin the official repositories and diff all A–E candidates
plus new proposals. Before `GO-FREEZE`, repeat the complete ingestion, classify
deltas, pin supported Realm profiles from primary chain evidence, and run
independent conformance.

The classification itself is planning evidence. Only a promoted EFS design,
owner-ratified freeze manifest, and passing executable fixtures can make a
standards behavior normative for EFS.
