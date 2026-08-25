# EFS v2 — contract-readiness program

**Status:** draft — one-week disposable design and validation mission; no production implementation or freeze authority
**Target repos:** planning, disposable experiments, contracts and SDK only after the gates below pass
**Depends on:** [[README]], [[system-constitution]], [[core-architecture-candidate]], [[layered-type-system-and-data-abi]], [[hierarchical-files-and-folders]], [[ethereum-standards-and-execution-profile]]
**Supersedes:** —
**Reviewers:** @codex-gpt-5 (Core, evidence, and product red teams; 2026-08-22)
**Evidence baseline:** Stage A corpus plus the local B0, Git P6, Type/Data-ABI, application-pressure, reconstruction, and pinned EIP/ERC standards screens
**Last touched:** 2026-08-25

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #topic/efsv2 #topic/readiness

## Verdict

EFS v2 now has one current, integrated **disposable Core control** and an exact
candidate handoff. It is close to a `GO-CODE` recommendation, but the current
disposition is **`CONTINUE-DISPOSABLE`** while the SDK and Data Explorer consume
that same source lock. It is not ready for durable contract implementation, a
century-scale freeze, or deployment.

The requirements and conceptual separations are unusually strong. The
2026-08-25 `EXP-C0/v0` packet now composes exact candidate structures,
preimages, bounded result/query/Lens/projection laws, independent JavaScript and
Solidity controls, and one literal `HELLO_FILES` vertical. Earlier evidence also
covers portable identities, exact Records and authored Occurrences,
Realm-qualified admission, atomic multi-leaf application writes, Binding
CAS/history, bounded postings, and application fit without private Core nouns.
Those are real results, not merely prose.

The packet deliberately makes a narrower claim than a finished Core. Its claim
ledger still reports **zero of 61 sealed semantic traces** with complete literal
request/result/pre-state/post-state replay bundles. The monolithic SUT, generic
Type interpreter, verifier/submission transitions, QueryProfile backfill, and
state-derived reconstruction remain candidate engineering work. Final physical
topology, production caps, independent clean-room conformance, and ceremony
bytes remain `GO-FREEZE` work.

The immediate readiness gate is therefore not another architecture tournament.
The raw-preserving SDK fixture and no-wallet Explorer fixture must consume the
exact same Core handoff and return any truth mismatch to Core. Until that
cross-lane check is green, this program must not emit `RECOMMEND-GO-CODE` and
V2-C1 must not be placed in the owner's answerable queue. If it stays green,
V2-C1 becomes the one build-start choice; only the owner's recorded ruling can
authorize real candidate contract engineering.

## Current provisional control — `EXP-C0`

The 2026-08-23 work direction authorizes agents to make reversible engineering
selections while the project owner is traveling, preserve the losing
alternatives and their falsifiers, and return only genuine product or value
forks later. It is **not** an owner ratification of protocol law, `GO-CODE`, or
permission to write production contracts.

Use one integrated control rather than treating every plausible architecture as
a co-equal implementation:

| Surface | `EXP-C0` selection | Reopen only if |
|---|---|---|
| Type | Flat exact nominal `TypeSchema`: meaning, canonical shape/representation, intrinsic accepted-value constraints, and closed reference roles share one identity. Query/index policy lives in a separate `QueryProfile`. Layered descriptors and Views remain compiler/catalog outputs and comparison arms. | Exact-Type evolution creates unacceptable fragmentation and a layered arm independently preserves bounded work, identical rejection behavior, historical interpretation, and non-self-authorizing mappings. |
| Record and carrier | Immutable author-neutral Record; portable ordered `PublicationSet` plus source witness; per-leaf Occurrence; destination-specific `AdmissionPlan` and witness. | Carriage changes Record/Occurrence identity, loses subset closure, enables replay, or permits a partial multi-leaf effect. |
| Principal | One full-width `PrincipalId` API with zero-setup account Principals, Realm-qualified EOA/ERC-1271 verification, and retained historical verifier transcript. | It adds setup, hides authority basis, truncates identity, breaks portable authorship, or is materially worse than a tagged author surface. |
| Realm | Self-authenticating immutable bootstrap plus append-only `RealmRevision` for code, execution profile, policy, verifier, and possible administration powers. Bare `chainId` is never identity. | The named genesis/deployment/fork/chain-ID cases create ambiguous identity, replay, or historical reads. |
| Mutation | One atomic append-only state machine for multi-leaf admission, receipts, Binding CAS/history/tombstone, Withdrawal, exact effects, and no resurrection. | The independent model and SUT disagree, a failed action leaves effects, retry changes identity, or channel loss is mistaken for success. |
| Query | Exact-Type QueryProfiles with Realm-qualified activation authority/cost basis, generation, covered interval, postings commitment, pages, and `COMPLETE/PARTIAL/UNKNOWN`; complete BindingScope enumeration is separate from a point read. | A required complete answer needs an unbounded scan, event-only/mutable private table, or hosted indexer, or any incomplete path reports absence. |
| Lens | Immutable finite point `ResolutionPlan`; the risk bearer selects it; run 1/8/32/64-Principal experimental caps. | The beneficiary can self-authorize, work/results become unbounded, or independent implementations disagree. |
| Realization | Independent pure state model plus one deliberately monolithic disposable Solidity SUT. | The semantics pass but the monolith exceeds a named execution profile; only then compare physical topologies. |

`EXP-C0` chooses the next thing to falsify. It freezes no hash, codec, ABI,
limit, storage layout, deployment topology, Realm, Commons, upgrade law, or
product release.

## Three different finish lines

### A. `GO-CODE` — ready to begin real candidate contract engineering

This means the semantic state machine, signed inputs, read contract, failure
states, reconstruction obligations, interpretation boundaries, and provisional
safety bounds are exact enough that engineers are implementing a known design
in the real repositories. The implementation remains explicitly nondeployable
and uses a candidate namespace until later gates pass. Possible admin and
upgrade powers must already be visible.

`GO-CODE` does **not** require ceremony-final identifier bytes, the final
physical contract split, independent SDK conformance, exhaustive application
traces, final century-width caps, or a production deployment manifest. Those
belong to `GO-FREEZE`. It **does** require one exact, versioned, explicitly
disposable candidate codec, ID domain/preimage set, bounds sheet, and golden
trace corpus for every state-bearing value. Candidate engineering measures
whether those bytes and bounds deserve the permanent namespace; it does not
improvise them silently.

An experiment report can only **recommend** `GO-CODE`. Starting real contract
work requires an explicitly recorded project-owner ruling approving the
semantic candidate and its named deferrals. The current travel-period
authorization covers prose, sealed traces, and throwaway experiments only.

### B. `GO-FREEZE` — ready for a century-scale semantic freeze

This is stricter. It additionally requires independent encoders and readers,
golden vectors, adversarial review, measured gas/code/state ceilings, recovery
from all supported carriers, explicit hash/codec/Realm succession paths,
contract and SDK conformance, an owner-ratified freeze manifest, and a public
statement of every consciously deferred capability.

### C. `GO-DEPLOY` — ready for an operational deployment

This adds deployment-specific security, administration, venue, monitoring,
incident, migration/coexistence, reproducibility, source-verification, and
operations gates. `GO-FREEZE` does not select a Commons or authorize a mainnet
deployment by itself.

The week targets the **largest completed prefix** of G0–G6 and produces the
evidence map for the remaining gates. `GO-CODE` is evidence-gated, not
calendar-gated; valuable progress may honestly end at `CONTINUE-DISPOSABLE`.

## Starting evidence and its honest limits

| Evidence | What it supports | What it does not support |
|---|---|---|
| Stage A corpus | Broad requirements, fixtures, traceability, candidate formulas, and falsifiers | Executable conformance or selected bytes |
| B0 micro-spine | Selected cross-language identities, EOA admission, basic indexes, small reconstruction, gas and code-size signals | Current layered Type semantics, generic multi-leaf Core, Lens, KEL, or complete queries |
| G1 Task1C carrier oracle at `ae9d75bd` | Sealed acyclic portable source-witness graph versus destination PlanCore/Admission DAG traces and pure G1 fact grades | `EXPERIMENT_SELECTED` is not adoption or protocol conformance; OccurrenceKey conversion, revision literals, closure body, and independent Task4 comparator remain open |
| [[Reviews/2026-08-23-efs2-exp-c0-semantic-seal/README|`EXP-C0` symbolic semantic seal]] | One integrated 61-trace transition/read/authority/query/Lens/reconstruction contract plus declared future minimum comparators and lossless result profiles | Exact disposable bytes/digests, pure-model or Solidity execution, measured bounds, protocol conformance, or a G2 pass |
| [`EXP-C0/v0` exact disposable control](../../Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md) | One exact candidate data/result/codec handoff, selected JavaScript/Solidity controls, a declared 28-collection projection, and one literal `HELLO_FILES` integration fixture | Complete replay of any of the 61 sealed traces, a live SDK/browser path, protocol adoption, durable bytes, a production Core, or deployment |
| Git P6 | Atomic application-shaped 21-leaf write, retry/rollback pressure, real Git object distinctions | A generic Core rather than a fixture-specific harness |
| Type/Data-ABI experiments | Exact Types, stable Objects, representations, Views, QueryProfiles, evolution, package closure, and application fit | Permanent bytes, full Core admission, production compiler, or settled View authority |
| Files design | Concrete need for `BindingScope`, honest absence, and operation-bound routed consent | A working implementation or acceptable aggregate gas |
| Application passes | Nanda, achievements, packages, media, Files, and Git fit ordinary application Types without new Core nouns | That every shared Core seam is integrated, safe, or affordable |
| [Pinned EIP/ERC screens](../../Reviews/2026-08-23-efs2-core-eip-erc-pressure/README.md) | Complete official-corpus inventory plus Core/read/Realm/verifier/realization constraints and negative controls | Target-chain activation or support, EFS adoption, exact profiles/bytes, or conformance |

Existing reports must be labeled by the source commit, experiment commit,
fixture digest, toolchain, dirty state, known defects, rerun status, and claim
scope. Grade both **observed result at its pinned commit** and **currency against
the current candidate**: an old fixture can be `PASS` and `STALE` at the same
time. “Stage B has not run” should be corrected to “narrow disposable B0 runs
exist; current-greenfield integrated Stage B and freeze evidence do not.”
Branch-only results stay evidence until intentionally reconciled.

## The readiness gates

### G0 — authority and evidence baseline

Before adding mechanisms:

- pin the current owner rulings, constitution, active candidate documents, and
  correction register;
- source-lock the standards receipt: planning commit; official EIP/ERC source
  revisions; corpus-index digest; proposal number/title/status/created/requires
  metadata; EFS disposition; constraint gate; conformance owner; target
  profile; fixture/result digest; claim scope and non-claims. Reuse one receipt
  downstream rather than rerunning or copying its inventory at every gate;
- grade adjacent CAIP, ENSIP, WalletConnect, external JSON-RPC, W3C/IETF, and
  browser-wallet standards passes `UNRUN` unless separately pinned; the EIP/ERC
  corpus does not silently cover them;
- inventory every local experiment branch, result, toolchain, and known defect;
- grade the sealed `ae9d75bd` Task1C carrier evidence before reusing
  `PublicationEnvelope`, `Occurrence`, source-witness graph, PlanCore, or
  Admission-DAG shorthand; preserve its `EXPERIMENT_SELECTED`,
  `protocolConformance=false`, and `notAdopted=true` ceiling;
- build one requirements-to-fixture-to-result ledger with separate observed-
  result (`PROVED`, `REFUTED`, `PARTIAL`, `UNRUN`, `OUT-OF-SCOPE`) and
  current-candidate (`CURRENT`, `STALE`, `CONFLICTING`) grades;
- freeze only the disposable experiment corpus and error vocabulary for the
  week, not protocol IDs or production bytes;
- require all reports to distinguish direct observation from inference.

**Pass:** two reviewers can independently say what is current, what was
actually executed, and which claim each artifact supports.

**Current state:** `G0-PARTIAL`, but **candidate-sufficient for this `GO-CODE`
handoff**. The 2026-08-23 Core pressure screen is the reusable standards source
lock for the disposable candidate:

- planning input `e4180cca2d13df205b05bb886a60969e084a9fc3`;
- official EIP source `f767a1e8078e17c9b381a91d35a09492189ede1b`;
- official ERC source `9c718c7c02372a6b7e300990511cd6fdff7f1dfa`;
- shared corpus-index SHA-256
  `4315e018d019c409b56e4cb2b60ca708b7dc32d4768faad2a7f4f0293502995f`.

That receipt's proposal status, target activation/support, EFS disposition, and
non-adoption boundaries remain intact. A standards delta refresh is required
before `GO-FREEZE`, whenever the pinned corpus advances or a known correction
lands, or when candidate code introduces a standards-sensitive seam not covered
by the receipt. It is not a recurring pre-`GO-CODE` ritual while this exact
source lock is unchanged. The complete independently reviewed G0 evidence
ledger and the sealed Task1C/current-candidate reconciliation remain useful
evidence-hygiene work, but neither is an unresolved semantic input to the exact
`EXP-C0/v0` build-start handoff.

### G1 — semantic and identity candidate

Settle an exact candidate for the distinctions contracts and SDKs cannot repair
later:

- exact TypeSchema, QueryProfile, Record, stable Object, PublicationSet,
  Occurrence, and Admission identities; layered semantic/shape/representation/
  View identities remain explicit comparison outputs;
- exact reference targets: Record, Object, Occurrence, exact Type, closed Type
  group, and a tightly bounded existence target where justified; View targets
  remain a comparison arm;
- `SELF`, mutually recursive groups, open-reader unions, unknown variants, and
  cross-version references without ambient reinterpretation;
- hash domains, canonical preimages, codec/version tags, byte limits, and a
  coexistence path for future hashes and codecs;
- Principal identity across EOAs and contract accounts without truncating
  `bytes32` or pretending chain-dependent contract authority is universal;
- Realm identity versus Realm implementation/policy/execution revision; a
  versioned origin/lineage commitment is stronger than current `chainId`;
- public/private identity-domain separation and the rule that batching alone
  never creates application meaning or safely mixes linkable public/private
  material.

`EXP-C0` provisionally selects the first practical arm for each of the four
ABI-shaping seams below. The exact packet, narrowed controls, and application
pressure make those selections candidate-sufficient for the build-start
handoff; they do not make them permanent winners. Candidate code measures the
named falsifiers, and only a triggered falsifier justifies a full losing-arm
implementation:

1. uniform `PrincipalId` versus a tagged `Account | Principal` author surface;
2. self-contained Records versus shared Envelope/immutable Context using the
   same accepted values and real application fixtures;
3. portable authored publication plus destination Realm admission versus an
   intentionally Realm-bound publication profile;
4. a self-contained `RealmDescriptor`/bootstrap artifact carrying chain/genesis
   identity, component commitments, policy/verifier revisions, possible admin
   powers, and the boundary between admission basis and later finality evidence.

The Realm arm includes same addresses/code on different genesis states, two
Core deployments on one chain, a chain-ID change on one continuing lineage,
and divergent forks that retain one chain ID. Every later observer envelope for
an admission or offchain dynamic read names an exact block hash. An onchain
admission or Lens call records/uses its atomic execution coordinate,
RealmRevision, and high-water but cannot know its eventual inclusion-block
hash. Canonicality/finality remain separate observer evidence.
Pass only if identity, branch-qualified currentness, replay, and succession are
unambiguous.

The old 1–64 Envelope/Flatcard run is reduced and confounded. It is useful prior
evidence, not the carrier decision. A survivor must preserve portable evidence,
subset-carriage rules, replay safety, extraction, reconstruction, and
application-level atomicity before its gas/storage advantage counts.

The Type comparison is not “maximum expressiveness at any cost.” EFS should
support arbitrary application meaning through permissionless exact Types and
ordinary relations, while the onchain structural language remains small,
bounded, deterministic, and non-executable. Rich validation and behavior may be
compiled, run offchain, or published as evidence; Type authors do not inject
callbacks into Core.

Identity and codec tests include hostile names, four-byte collisions, Unicode
lookalikes, external address/display encodings, absent-versus-canonical-zero,
retired field/variant keys, unknown or out-of-range selectors, and proof
coordinate changes. External registry keys or interface selectors enter no EFS
identity preimage without a separately frozen EFS profile.

The selected `EXP-C0` hypothesis to falsify is a **flat exact nominal Type**:
every intrinsic constraint that changes accepted values and every closed
reference role remains in exact Type identity, while query/index policy lives
in a separate QueryProfile. Layered SemanticSpec/Shape/Representation IDs are
useful compiler, catalog, and ablation outputs but have not earned permanent
Core identity. Committed and detached ViewBindings remain adversarial
comparators; neither is an assumed production default.

**Pass:** TypeScript, Rust, and Solidity independently reproduce all IDs and
reject all malformed or noncanonical twins. Changing meaning, shape, or
representation cannot silently preserve an exact identity. A new compatible
Type can be added without changing old bytes or letting an open reader grant
authority. Each selected ABI-shaping arm passes its minimal sealed comparator
without ambiguous IDs, signatures, storage, or reads. A losing arm needs a full
implementation only after the selected arm reaches its falsifier.

**Current state:** `G1-PARTIAL`, but **candidate-sufficient for the build-start
handoff**. The packet selects exact nominal Types with split QueryProfiles, a
uniform full-width Principal surface, author-neutral Records plus portable
PublicationSets and destination Plans, and a self-authenticating Realm
bootstrap/revision shape. The bounded closed-Type control and application
pressure have not exposed a Core-level falsifier. A wider Type grammar,
fragmentation/churn measurements, exhaustive malformed twins, Rust and second
clean-room encoders, hidden-power topology, and final succession/profile law are
candidate-engineering or `GO-FREEZE` work; none may be represented as already
proved or frozen.

### G2 — integrated mutation and query state machine

Build three independent artifacts in this order:

1. a prose transition specification plus sealed input/output traces;
2. a pure state-model oracle that does not import the Solidity implementation;
3. a disposable monolithic Solidity system under test (SUT) as the first
   physical control.

The first artifact's symbolic semantic layer is sealed in the
[[Reviews/2026-08-23-efs2-exp-c0-semantic-seal/README|`EXP-C0` semantic trace packet]].
The exact disposable C0/v0 data/result/codec profiles and focused executable
controls now exist under `Reviews/2026-08-25-efs2-exp-c0-v0-control/`.
Independent emitters, JavaScript, and Solidity agree on the current essential,
Plan/Effect/Operation, and three-Result vector subsets. Query, projection,
Principal, Lens, acquisition, and transition invariants also run. This does not
authorize a broad trace-agreement claim: the control ledger still reports zero
of 61 traces with the complete literal request/result/pre/post bundle.

The model and SUT contain the G1 survivor semantics for:

- bootstrap and ordinary Type validation with statically bounded reference
  extraction;
- append-only RealmRevision/accepted-execution-profile activation with exact
  start/terminal high-waters and no retroactive reinterpretation, plus a
  separate observer result for ambient chain-rule/profile mismatch that Core
  bytecode may not be able to detect or stop;
- the selected Record/Context, authored-publication, multi-leaf Occurrence, and
  Realm-admission shapes, including nonce, expiry, subset, and replay rules;
- explicit target-existence and expected-revision evidence;
- Principal-qualified Binding CAS, tombstones, Withdrawal, history, and no
  resurrection;
- `BindingScope` or a demonstrably better generic mechanism for complete
  unknown-name enumeration;
- exact-Type and finite-inventory View queries, QueryProfile generations,
  exact-block/high-water bases, pages/cursors, bounded return/error ABIs,
  coverage, and honest completion;
- the adopted generic query obligations: exact Type/Record/Occurrence/admission
  reads, exact typed-scalar equality, typed references/backlinks and reverse
  membership, content-digest lookup, authored-data enumeration,
  revocation-aware current counts, and deterministic bounded locator selection;
- public reads sufficient to reconstruct all authoritative state.

QueryProfile testing must include active/pending generations, dual writes,
interrupted backfill, cursor invalidation, Types added before/during/after
backfill, 99–100% dead-posting dilution, hostile self-implementation spam,
large simulated backfill, reconstruction, and exact authority for declaring
terminal coverage. Any generic query obligation that cannot fit the aggregate
gas/state budget returns to the project owner; it is not silently dropped.

Point proofs, logs, RPC/archive responses, table events, and optional indexers
remain qualified inputs. Compare ERC-7208, ERC-7813, and ERC-8100 as data/query
precedent while proving that mutable or event-only tables and self-declared
schema/XML completeness cannot establish EFS semantic identity, authority, or
`COMPLETE`. A successful point proof never proves enumeration; empty, short,
timed-out, pruned, or cursor-invalid transport results remain `PARTIAL` or
`UNKNOWN` unless the declared finite domain's terminal completion law passes.

Effectful operations additionally bind one exact canonical plan/effect-set
commitment: Principal, Realm, operation, executor and code/dependency basis,
nonce, expiry, preconditions, maximum cost, atomicity, and exact effects.
Human, agent, extension-host, TypeScript, and Solidity derivations must produce
the same digest. A batch Envelope does **not** itself claim application-semantic
atomic meaning; that comes only from a typed transaction Record or an explicit
bounded profile rule.

Sealed traces distinguish an EFS plan signature from any EIP-712 presentation,
wallet batch, user operation, delegation, relayer/payer authorization,
transaction receipt, and canonical effect. Replay protection remains an EFS
domain/Realm/nonce/expiry responsibility. Partial wallet-batch or receipt
success cannot upgrade an unobserved Core effect.

Define one normative facts matrix and lossless Core/Solidity/SDK/Explorer
crosswalk. Keep at least these axes separate:

```text
presence:       FOUND | ABSENT_PROVEN | UNKNOWN | CONFLICT | OPAQUE | MASKED | NOT_APPLICABLE
coverage:       COMPLETE | PARTIAL | NOT_APPLICABLE
support:        SUPPORTED | UNSUPPORTED | LIMIT_EXCEEDED | NOT_APPLICABLE
validation:     STRUCTURALLY_VALID | SEMANTICALLY_VALID | INVALID | UNPROVEN | NOT_APPLICABLE
authority:      AUTHORIZED | DENIED | UNPROVEN | NOT_APPLICABLE
lifecycle:      ADMITTED | WITHDRAWN | CARRIED_ONLY | UNPROVEN | NOT_APPLICABLE
selection:      CURRENT | NOT_CURRENT | CONFLICT | UNKNOWN | NOT_APPLICABLE
observation:    exact Realm/block/policy/code basis + separate finality/freshness
bytes:          VERIFIED_AVAILABLE | PARTIAL | UNAVAILABLE | INTEGRITY_FAILED | NOT_APPLICABLE
effect:         NOT_APPLICABLE | COMMITTED | NOT_COMMITTED_PROVEN | UNKNOWN
projection:     MATCHED | MISSING_REQUIRED_ITEM | INTEGRITY_FAILED | NOT_APPLICABLE
```

`NOT_APPLICABLE` is legal only when the result kind genuinely does not speak to
that axis. It cannot hide an unavailable, unsupported, unproven, or failed
check.

Applications may project these dimensions for users, but Core and the SDK must
not collapse `UNKNOWN` into absence, `PARTIAL` into complete, failed retrieval
into missing data, admission into finality, recorded basis into currentness, or
evidence into authority. Cross-language vectors cover every legal state and
reject illegal combinations.

Pure G1 identity/carrier/structural results always use
`authority=UNPROVEN`, `lifecycle=CARRIED_ONLY`, and
`effect=NOT_APPLICABLE`, whether accepted or rejected structurally. A G1
rejection is not proof that some external state stayed unchanged.
`NOT_COMMITTED_PROVEN` is reserved for G2+ effect recovery over a declared
state transition and exact basis.

**Pass:** differential, model-based, property, and fuzz tests make the pure
model and Solidity SUT agree on sealed traces they did not generate jointly;
every atomic failure leaves zero partial effects; idempotent retry returns the
same operation identity; a lost submission channel can be recovered as
`COMMITTED`, proved `NOT_COMMITTED`, or `UNKNOWN`; canonical read-back mismatch
never becomes success; fixed-basis pagination is stable; and terminal absence
is possible only after the declared complete domain has been exhausted.

**Current state:** `G2-PARTIAL`. The symbolic seal, exact disposable profiles,
cross-language preimage controls, literal Result vectors, all-28 collection
registry, terminal-query/cursor controls, and partial monolithic mutation SUT
exist. Remaining G2 work is ordinary candidate engineering: the complete Type
interpreter's generic Solidity realization and multi-Type closure,
QueryProfile activation/backfill transitions, exact verifier/submission flows,
genuinely complete state reconstruction, and literal bundles for any trace
promoted from partial invariant evidence. See
[[mvp-build-start-packet]] for the recommended contraction.

### G3 — identity, Realm, and authority security

Pressure the independent model and Solidity SUT with:

- EOA and ERC-1271 Principals, relayers, distinct payers, contract upgrades,
  EIP-7702 code changes, wrong-chain and wrong-Realm replay, nonce lanes,
  expiry, ERC-191/ERC-2098/ERC-8111 encoding and malleability cases, ERC-5267
  domain mismatch, simulation-to-admission substitution, and reentrancy;
- hostile ERC-1271 witnesses that revert, return malformed values, consume the
  verifier gas cap, reenter, or change code/authority between observation and
  admission;
- actor versus semantic Principal versus submitter distinctions;
- a self-authenticating Realm bootstrap/descriptor that commits chain/genesis,
  component addresses and runtime code hashes, policy/validator/authority-
  verifier revisions, possible admin/upgrade powers, and admission basis;
- state-readable historical verifier/policy semantics, not merely a hash whose
  defining bytes or dependency graph may disappear;
- an exact historical verifier transcript: digest/preimage and domain,
  signer/account reference, any suite-specific key bytes, signature bytes,
  suite revision and normalization policy, verifier code and
  declared dependencies, Realm revision, execution coordinate, later exact
  inclusion basis, gas/return-data policy, and result. Pure suites replay from
  retained inputs. A stateful controller call needs a retained witness/profile
  or remains a recorded Realm transition; never re-call current ERC-1271 code
  to reinterpret an old admission;
- in the initial EFS candidate, ERC-6492 only as an optional offchain/pre-
  admission adapter—even though the ERC also permits contract callers—not an
  admitted authority result; Final ERC-7913 as a disposable address-less second-verifier interface,
  not Principal identity; EIP-7951 P-256 edge vectors plus a simulated
  EIP-8151-style ambient `ecrecover` change that must not alter old results;
- cross-Realm copying versus destination admission and recognition;
- one disposable managed-Principal/succession profile and one second signature-
  verifier profile proving additive rotation/recovery/delegation and algorithm
  agility without retroactively graduating or reinterpreting old Occurrences;
- operation- and executor-bound consent for routers that claim a plural action
  such as rename, move, or multi-ref Git update.

**Pass:** no caller can substitute a Principal, Realm, Binding/View mapping,
Lens, operation, executor, dependency, or basis after authorization. Old
Occurrences remain interpretable after account or implementation change;
unknown verifier profiles fail closed; full-width Principal keys survive every
ABI/storage/index path; and possible administrative powers are exact even if
the eventual operator addresses remain undecided.

**Current state:** `G3-PARTIAL`. The uniform full-width Principal arm now wins
the disposable steady-state API/key comparator over tagged `Account |
Principal`, with the tagged arm and falsifier preserved. Realm/Core/genesis/
disclosed-power identity sensitivity and exclusive-expiry/nonce controls run.
Exact EOA/ERC-1271/EIP-7702 verifier transitions, historical transcript replay,
hidden implementation-power topology, and branch-qualified observer cases
remain candidate engineering/security work.

### G4 — Lens and honest read contract

Build the smallest contract Lens needed to prove the constitutional promise:

- immutable or content-addressed Resolution Plans;
- the risk bearer selects or approves the Plan;
- exact, finite candidate Principals and bounded point resolution;
- an onchain result exposing Realm/revision, execution block number,
  applicable admission high-water, policy/code/execution profile, coverage,
  conflict, and result; a separate observer envelope adds exact block hash,
  source authentication, canonicality, and finality;
- `FOUND`, `ABSENT_PROVEN`, `CONFLICT`, `UNKNOWN`, and `UNSUPPORTED` outcomes;
- deterministic losing-evidence/provenance reads where promised;
- rich personal/social policy compiled outside Core, never arbitrary onchain
  graph walking.

Run the owner-required cold/warm 1/8/32/64-Principal matrix for first, last,
absent, conflict, unknown, and risk-bearer-selected outcomes. Then run the
50-Principal Files plan as a separate application workload. Include conflicting
catalogs, disappeared publishers/indexers, partial history, unknown Types, and
hostile evidence.

Finality and reorg observation live in a separate client observer harness, not
inside Core truth. Fork/reorg tests must prove that pages or Lens inputs from
different block bases are rejected rather than merged.

EIP-1186-style point proofs remain an optional observer adapter. The observer,
not the Lens contract, independently authenticates any header/state-root and
exact key derivation and must not treat a point proof as enumeration coverage.
Block numbers and tags may locate a block; only the accepted exact hash/state
basis joins multiple offchain dynamic observations into one answer. One
onchain transaction instead gets atomic EVM state by construction and never
pretends to know its current block hash.

**Pass:** the same inputs and basis produce the same result in independent
implementations; no untrusted caller chooses the policy that authorizes itself;
all loops and result sizes are statically bounded.

**Current state:** `G4-PARTIAL`. Independent JavaScript and mapping-backed
Solidity controls agree on immutable 1/8/32/64-Principal point resolution:
proved absence permits fallback and unknown/conflict/unsupported/mixed basis
stops. The 64-principal last-found path measured 616,577 gas on its first
resolve and 220,280 on its immediately repeated resolve in the disposable solc
0.8.30 Osaka harness. Literal Lens Result bundles,
Core storage integration, conflict/observer profiles, and the separate
50-Principal Files workload remain.

### G5 — EVM realization and reconstruction

Measure the integrated semantics before choosing architecture:

1. monolithic state owner as the semantic control;
2. immutable facet/router split with pinned state and selector ownership;
3. narrow state-owning modules only if the measured pressure justifies them.

“Monolithic” means one logical state machine and the first Solidity topology,
not the source of expected truth. If that topology exceeds EIP-170 or other
Realm ceilings, it falsifies the physical monolith—not the independently
specified semantics.

For identical fixtures measure deployed/runtime bytecode, cold/warm gas,
calldata, state slots, event bytes, worst-case rollback, pagination, and growth.
Attack storage collisions, selector collisions, reentrancy, stale dependencies,
upgrade/reinterpretation paths, and denial-of-service at every cap.

Before measurement, pin supported Realm/EVM assumptions and numeric acceptance
budgets for runtime/initcode margin, transaction gas, calldata, validator work,
page size, state growth, and aggregate application flows. Add a 100-year model
covering ordinal/counter/cursor/nonce/expiry widths, checked overflow and
terminal behavior, Type/index spam, worst-case churn, hash/codec coexistence,
and long-lived deployment margins.

Kill a physical arm against a **named Realm execution profile**, not a
century-wide constant. Run at least one conservative control from rules
actually activated in a disposable reference EVM environment and one
separately named future sensitivity profile. Passing the control neither
selects a venue nor declares the environment a qualifying Realm. Track
runtime/initcode ceilings, per-transaction
and block gas, calldata and block-byte bounds, warm/cold access, state creation
and writes, user-net versus gross/block accounting, activated precompiles, and
deployment facilities. A fork-planning or “scheduled” document is scenario
evidence, not activation or freeze authority.

Replay a compatible and a semantics-breaking ambient fork transition. The test
must not pretend the fork itself invokes an EFS profile update. Record what the
immutable Core can enforce, what only an external observer can qualify as
`PROFILE_MISMATCH/UNKNOWN`, and which change forces explicit Realm succession.

Physical negative controls include ERC-7201 versus ERC-8042 namespace/formula
mismatch; ERC-1167 dependency loss; mutable ERC-1967/ERC-2535 routes; runtime-
only or optimistic module manifests; and self-declared selector/interface
mismatch. Core durability/currentness cannot depend on `SELFDESTRUCT`,
transient or proposed expiring storage, `PREVRANDAO`, last-written metadata,
historical log/body availability, or blobs. EIP-1014/code-hash observations and
factories support deployment evidence only; none becomes semantic authority.

Give an independent reader codebase one immutable Realm bootstrap artifact plus
an independently authenticated exact/finalized block header and state root and
declared chain/RPC and carrier configuration. It must derive the canonical
inventory/closure/count/root under Core rules, discover the committed
components, and reconstruct Types, Records, PublicationSets/source graphs,
Occurrences, retained source/destination witness sidecars required by the
selected profile, AdmissionPlans, admission receipts, indexes, Binding
histories/scopes, Withdrawal state, Lens inputs, and completeness evidence
without a manually supplied private ABI, module-address list, EFS-operated
indexer, or writer-side database.

The recipe records `RealmId`, `RealmRevision`, exact block hash/number and state
root, source commitment and authentication method,
execution/projection/codec/hash/verifier profiles, canonical inventory closure
and item count, and projection digest/root. Two independently written
reconstructors prove projection determinism—not source authority or domain
completeness—by rejecting missing preimages, duplicate keys, noncanonical
order, malformed lengths, trailing bytes, and items falsely included inside the
declared canonical projection domain, and by producing identical authoritative
bytes. Unrelated chain state outside that domain is not surplus input. Repeat
through reorg rollback/replay with old bodies, receipts, logs,
trie-node-by-hash retrieval, and blob bytes unavailable. If authoritative
reconstruction then needs historical data, the candidate fails its state-only
promise; that dependency is an exact falsifier, not a passing `UNKNOWN`.

**Pass:** at least one topology fits conservative EVM ceilings with safety
margin, the source and finite projection domain are independently authenticated
under the declared Core rules, and two independent state-only reconstructors
produce the same authoritative bytes. Otherwise revise semantics or bounds
before selecting contracts.

**Current state:** `G5-PARTIAL`. The disposable monolithic controls and declared
28-collection projection make the state/reconstruction obligation exact enough
to engineer against; they are not reconstruction from a complete live Core.
Implementing state-derived enumeration, running two independent reconstructors,
measuring the integrated monolith, and selecting any permanent physical
topology are candidate-engineering and `GO-FREEZE` work. Physical topology is
therefore not an unanswered owner design fork at build start.

### G6 — developer and product proof

Replay unchanged **logical** application fixtures and expected outcomes through
the same contract and SDK boundary while retaining each arm's raw carrier bytes
separately:

- Git P6 including atomic multi-ref update, stale-CAS rollback, expiry retry,
  checkpoint/export, and reconstruction;
- Files directory churn including tombstone-first names, rename/move/copy,
  `BindingScope`, 50-Principal Lens, complete pagination, bytes unavailable,
  and operation-bound consent;
- one typed table/spreadsheet view, exact raw/provenance inspection, export,
  and an arbitrary untrusted stub emitting only an inert action intent; the
  trusted Explorer host must regenerate the canonical plan. Replay ERC-7813-
  and ERC-8100-shaped inputs through optional adapters while retaining raw
  state, fixed basis, `PARTIAL/UNKNOWN`, and no authority or completeness from
  a schema/XML declaration;
- Nanda typed request/response/evidence with unknown method/capability and
  disappeared-provider behavior;
- package/release finite closure with conflicting catalogs and no implicit
  install, grant, or execution;
- achievement issue/status/holder/reader separation and basis-qualified
  current-point query;
- media/large bytes with partial verification, unavailable carriers, and no
  confusion between content identity and locator availability.

Run Data Explorer's same fixture twice: once against a deterministic fake source
for UI isolation and once in a cold browser through the real disposable SDK
adapter and direct public reads. Require semantic parity, dependency/network
tracing, optional-indexer removal, fixed-basis pagination, raw fallback,
verified bytes, and cold reconstruction with no wallet, account, Commons,
hosted indexer, package catalog, Kernel, OS boot, profile hydration, or warm
cache.

Run blinded, independent TypeScript and Solidity developer tasks: generate and
evolve two representative Types, preserve an unknown future Type, perform point
and paged reads, prepare and recover an effectful operation, and consume an
exact Type onchain. Measure manual IDs/preimages/calldata, protocol literals,
incorrect state collapses, completion/errors, and raw-escape use against the
raw ABI baseline. A compiler emitting two languages is convenience, not an
independent conformance implementation.

For every Ethereum-facing feature, the SDK and Explorer distinguish the
Realm's accepted profile (`REQUIRED | OPTIONAL | FORBIDDEN | UNKNOWN_PROFILE`)
from observed endpoint/wallet/client support (`SUPPORTED | UNSUPPORTED |
DEGRADED | FAILED | NOT_OBSERVED`) and the canonical EFS effect. Unknown
methods, return shapes, verifier suites, precompiles, and capabilities fail
closed without erasing portable data.

Every SDK/Explorer failure returns a pressure packet with the unchanged
fixture, expected and actual qualified facts, the smallest missing semantic,
alternatives attempted at SDK/Realm/Lens/product layers, permanence cost, and
an exact falsifier. A truth failure reopens G1–G5; an ergonomic failure stays
outside Core.

**Pass:** none of the named workloads exposes a need for a private Core noun or
index; each preserves raw unknown data, provenance, basis, and completeness;
the facts-matrix crosswalk is lossless; the safe SDK path is measurably easier
than raw protocol construction; the direct guest route works without ambient
services; and the Explorer explains results without inventing authority.
Executable-extension sandbox security is not claimed by an inert week-one
stub.

**Current state:** `G6-PARTIAL` and the remaining pre-recommendation gate. The
Core-side literal `HELLO_FILES` fixture exists, but the SDK and Data Explorer
have not yet consumed its exact source lock unchanged. Their disposable
adapters must preserve raw values, basis, coverage, acquisition evidence, and
the no-wallet/no-ambient-service path. A P0/P1 truth mismatch reopens the owning
Core seam; an ergonomic or implementation gap becomes named candidate work.

Clean-browser Arcade, broader Git/Markdown/forge-social, three-host mounted
filesystem, privacy/domain-separation, cross-Realm, and complete large-content
traces remain `GO-FREEZE` gates if they do not fit the week. Their absence need
not block `GO-CODE` only when the frozen candidate preserves an explicit
additive path and no related byte/signature decision remains open.

## Ordered week lanes — not calendar gates

The seven lanes are dependency-ordered. Research, fixture preparation, and PM
design can run in parallel, but a later implementation lane does not declare a
pass over an unfinished earlier gate. The week ends with the largest completed
prefix, even if that is only G1 or partial G2.

**Current checkpoint:** lanes 1–5 have produced a candidate-sufficient Core
source-lock packet plus explicitly deferred engineering/freeze work, not full
gate passes. Lane 6's same-source-lock SDK/Explorer consumption is next. Lane 7
may emit `RECOMMEND-GO-CODE` only after that check and a final cross-lane audit;
the disposition remains `CONTINUE-DISPOSABLE` until then.

### Lane 1 — reconcile, do not reinvent

- inventory and replay existing B0, Type, Git, Files, application, and
  reconstruction evidence on pinned commits;
- repair the two-axis status ledger and isolate stale or overclaimed results;
- freeze a disposable corpus, facts matrix, limits registry, and exact
  toolchains for the week;
- pin one reusable standards-disposition/support receipt and current versus
  future Realm execution-profile drafts; do not copy the full corpus into
  later gates;
- publish the transition spec, independent-model plan, and Solidity-SUT plan
  before implementation.

**Exit:** every planned test maps to a constitutional requirement or named
falsifier; no duplicate experiment is scheduled without a stated reason.

### Lane 2 — Type, carrier, Principal, and Realm bakeoffs

- implement the flat exact-Type/split-QueryProfile `EXP-C0` semantics in sealed
  traces and run one minimal bundled/layered/View comparator with identical
  accepted-value semantics, caller-supplied binding, exact issuer/basis,
  projection bytes, and state effects;
- run one minimal sealed comparator for the selected uniform Principal, shared
  PublicationSet, portable publication/destination AdmissionPlan, and
  RealmDescriptor/bootstrap arms; expand a losing arm only on falsification;
- run Realm origin/fork/chain-ID collisions and Type evolution/selectors/
  absent-versus-zero/noncanonical twins under the same candidate bytes;
- decide candidate semantics for `SELF`, closed groups, bounded existence
  references, exact Views, QueryProfile coverage, public/private domains, and
  batch versus application meaning;
- extend independent ID/preimage vectors, malformed twins, and hash/codec
  succession.

**Exit:** `EXP-C0` survives each minimal comparator, or a named falsifier
reopens the relevant arm and a replacement must separately pass. Document
losing arms and freeze no permanent bytes. If no survivor exists, stay in this
lane.

### Lane 3 — transition spec, pure model, and Solidity SUT

- seal the prose state transitions and expected traces independently;
- implement the pure model for generic Type/reference validation,
  publication/admission, Binding/Withdrawal, scopes, query coverage, and exact
  effect commitments;
- implement the simplest monolithic Solidity SUT without optimization;
- differentially test success, failure atomicity, retry, dropped-response
  recovery, and illegal facts-matrix combinations.

**Exit:** the independent model and SUT agree on the small sealed corpus. A
monolith size failure is recorded as a topology result, not “fixed” by changing
expected semantics inside the SUT.

### Lane 4 — Realm and authority security

- run EOA, ERC-1271, EIP-7702, managed-Principal/succession, second-verifier,
  relayer/payer, replay, code-change, reentrancy, and verifier-gas cases;
- prove self-authenticating Realm bootstrap and state-readable historical
  verifier/policy basis with a retained exact transcript and no current-state
  recall;
- prove executor/operation/dependency/cost-bound plural consent and exact public
  effect recovery.

**Exit:** no authority or historical-interpretation P0 remains. Lens semantics
do not stabilize before this exit.

### Lane 5 — completeness, queries, Lens, applications, and reconstruction

- run the full QueryProfile failure matrix and every adopted generic query
  capability under aggregate cost;
- implement `BindingScope`, known-name versus complete-directory semantics, and
  the 1/8/32/64 contract Lens matrix;
- run Git P6, Files churn, the separate 50-Principal Files Plan, and conflicting
  or disappeared evidence;
- reconstruct the full test Realm from one bootstrap artifact in an independent
  reader with canonical count/root and hostile extra/missing/reordered inputs;
  run reorg/finality tests and unavailable-history/proof-source cases in the
  client observer.

**Exit:** absence is proved only at a terminal complete basis; no constructor-
preloaded application Types/targets, writer oracle, manual module list, or
private ABI is required.

### Lane 6 — SDK and Data Explorer pressure

- generate raw-preserving TypeScript artifacts and Solidity internal helpers
  for two representative Types while retaining independent encoders;
- run blinded developer tasks and compare against the raw ABI baseline;
- run Data Explorer's guest/read/table/raw/provenance fixture against both the
  deterministic fake and the cold direct integrated path;
- expose accepted Realm profile versus observed endpoint/wallet/client support
  and canonical effect as separate SDK/Explorer results;
- use only an inert untrusted extension-intent stub; the trusted host
  regenerates and verifies any canonical action plan;
- route every truth failure backward through a pressure packet.

**Exit:** unknowns and provenance remain accessible, direct-guest dependencies
are proven, effect outcomes recover after channel loss, and no generated helper
or product adapter becomes mutable hidden authority.

### Lane 7 — measurement, red team, and readiness packet

- run the achieved corpus in genuinely independent implementations;
- measure the monolith, then only topology alternatives justified by the same
  state projection, under named activated-current and future-scenario profiles;
- run security, database/query, EVM, SDK, product, and long-horizon reviews;
- produce the implementation spec, transition tables, ABI draft, limits sheet,
  vector manifest, reconstruction recipe, threat model, known failures,
  deferred capabilities, and owner packet.

**Exit:** `CONTINUE-DISPOSABLE`, `REDESIGN`, or `RECOMMEND-GO-CODE`, with the
exact highest completed gate. There is no `GO WITH HOLDS` for a must-be-exact
item. Only a recorded project-owner ruling can turn a recommendation into
`GO-CODE`; `GO-FREEZE` and `GO-DEPLOY` remain separate ceremonies.

## SDK PM charter and boundary

The SDK is a separate product and protocol-consumer authority, not generated
after contracts are already fixed. Its week-one design must cover:

- a small raw-preserving TypeScript runtime for exact bytes, provenance,
  authority, basis, coverage, unknown values, and receipts;
- a deterministic compiler that emits TypeScript DTOs/codecs/validators/query
  builders/docs/vectors and Solidity `internal` exact-Type helpers;
- transport-independent capability semantics across direct RPC, indexed reads,
  gateways, simulation, and future transports;
- plan commitments and recoverable outcomes for effectful calls when a channel
  drops after submission, preserving `COMMITTED`, proved `NOT_COMMITTED`, and
  `UNKNOWN` rather than guessing from transport success;
- independent encoder/decoder conformance and version-skew handling;
- optional deployed helpers only when stateless or bound to a finite immutable
  dependency/basis contract and justified by measurement.

The SDK must never hide `UNKNOWN`, turn discovery into authority, depend on one
hosted service, or let a mutable generated/helper dependency reinterpret an old
operation.

Wallet, provider, ENS/URI/resource, account-abstraction, and browser adapter
details remain owned by
[[Designs/web-client-os/ethereum-standards-and-interop]]. The Core readiness
program consumes that layer's qualified evidence receipt at G6; it does not
copy those matrices into G1–G5 or apply Web contribution gates to protocol-only
experiments.

## Data Explorer PM charter and boundary

Data Explorer is a standalone guest-first typed-data workbench. It is not the
Web Client/OS shell, the SDK, a package manager, or merely a prettier Files
screen. Its architecture must support:

- familiar tree, list, grid, sorting, search/filter, selection, details,
  history, copy/move/rename/delete/restore, drag/drop, previews, and keyboard
  accessibility where the underlying evidence permits them;
- exact raw bytes, Type/Record/Occurrence/Admission separation, provenance,
  Realm/basis/completeness, conflicts, unavailable carriers, and export;
- configurable table/spreadsheet, gallery, timeline, graph, diff, and
  application-defined Views over typed data;
- a useful core with all extensions disabled;
- sandboxed, capability-limited extensions that receive explicit inputs and
  return derived projections or inert action intents which the trusted host
  must independently re-derive before consent;
- one shared consent/sign/submit/read-back pipeline for built-in and extension
  actions;
- modular adapters over the SDK so presentation never becomes protocol truth.

The initial prototype should be read-heavy and reversible. Executable
extensions, spreadsheet mutation semantics, collaborative formulas, app
installation, and broad OS integration remain later research unless the
pressure pass proves a freeze-sensitive Core requirement.

The direct-guest gate is an end-to-end transport test, not an in-memory UI
fixture: a cold browser must reach the disposable Realm through public reads and
the real SDK adapter with optional services removed, while retaining raw
fallback, basis, completeness, verified bytes, and dependency traces.

## What must be exact before candidate contract engineering (`GO-CODE`)

- one selected semantic noun set and interpretation boundary;
- one exact, versioned, non-durable candidate codec, ID preimage/domain set,
  bounds sheet, and golden trace/vector corpus for every state-bearing value;
- exact transition tables for Type/Record validation, publication/admission,
  Binding, Withdrawal, scopes, query coverage, Lens, and history;
- signed-input domains and replay rules precise enough that no actor, author,
  Realm, operation, effect set, nonce, expiry, or expected revision can be
  substituted;
- a lossless facts/error model, page/cursor/basis semantics, and the rule that
  `UNKNOWN` or `PARTIAL` never becomes proved absence or success;
- statically bounded validation/reference extraction and provisional safety
  ceilings sufficient to show the candidate is not obviously impossible;
- minimum risk-bearer-selected contract Lens semantics;
- authoritative reconstruction obligations and the state that must expose
  them, without selecting a final optimized ABI or physical topology;
- historical Realm/verifier/policy interpretation and every *possible*
  administration, upgrade, or succession power; and
- sealed expected traces plus an independent model that real candidate code
  must match.

No semantic ambiguity in this list may be carried as a `GO-CODE` hold. Exact
ceremony bytes and final optimization evidence may. The project owner's
recorded ratification remains the final gate to work in the real contracts
repository.

## What must additionally be exact before century freeze (`GO-FREEZE`)

- every ceremony-final ID preimage, hash domain, canonical codec byte, version
  tag, signature profile, and malformed-input rejection precedence, including
  the explicit decision to adopt or replace each disposable candidate byte;
- final Type grammar, reference roles, QueryProfile declarations, Record/
  Publication/Occurrence carrier, and all hard caps;
- final RealmDescriptor, component/code/policy commitments, execution/read/
  verifier profiles, activation and succession law, and historical receipts;
- final operation/effect-set, consent, idempotency, recovery, and read-back ABI;
- the adopted query/index bundle and measured aggregate state/gas budget;
- final Lens grammar and cap;
- state-readable reconstruction ABI and indexes, independently replayed;
- storage ownership, immutable or explicitly governed upgrade law, and final
  contract topology;
- measured conservative bytecode, gas, calldata, validator-work, returndata,
  state-growth, century-width, and worst-case ceilings under named profiles;
- independent cross-language encoders/readers, golden vectors, SDK raw
  conformance, and clean-room regeneration; and
- adversarial, application, shutdown, and recovery evidence required by the
  freeze manifest.

## What may remain versioned or deferred

- rich social and private Lenses beyond the minimal bounded contract profile;
- a full KEL, default recovery composition, delegation UX, post-quantum suites,
  and additional smart-account profiles, provided the disposable managed-
  Principal and second-verifier profiles prove their identity/witness seams;
- search, ranking, analytics, global catalogs, reputation algorithms, and
  arbitrary joins;
- Commons venue choice, cross-chain aggregation policy, relays, gateways, and
  hosted indexers;
- new application Types, Views, QueryProfiles, projections, and SDK generators;
- rich Data Explorer extensions and collaborative spreadsheet behavior;
- private payload conventions and future ZK/PIR profiles that do not require
  changing the frozen public semantic model.

Deferral is safe only when the current design proves an additive, versioned
path and does not reserve a single vendor or mutable pointer as the escape
hatch.

## Kill criteria and mandatory redesign triggers

Stop and revise the candidate if any experiment shows that:

- a malformed or substituted ViewBinding/reference can authorize a value;
- open Type discovery, `ANY`, or unknown variants can grant authority or cause
  effects;
- a query reports absence or currentness without a complete declared domain and
  exact basis;
- a tombstone, Withdrawal, reorg, or missing page resurrects older state;
- historical Occurrences change meaning after account, Realm, policy, codec,
  helper, or implementation change;
- historical ERC-1271 or other stateful authority evidence is re-called against
  current code/state instead of preserving the admitted transcript/result and
  any reproduction witness required by its selected profile;
- a self-declared interface, registry, metadata/schema declaration, proof,
  endpoint, wallet capability, or proposal status becomes EFS authority,
  semantic identity, target support, or query completeness;
- the Realm cannot authenticate its own components and historical policy/
  verifier semantics from one bootstrap artifact;
- an action plan, signer, executor, effect set, cost bound, dependency basis, or
  read-back can be substituted, or an unknown effect outcome becomes success;
- ordinary validation needs unbounded recursion, arbitrary callbacks, or an
  application-private Core kind/index;
- a required query capability or century-scale width/churn case cannot meet its
  predeclared budget without losing honest completeness;
- the authoritative state cannot be reconstructed without an EFS-operated
  database, event-only body, or writer oracle;
- no conservative EVM topology fits the integrated semantics;
- the safe SDK workflow is materially harder than bypassing it, or different
  generated implementations disagree on exact bytes;
- Data Explorer must conceal basis, provenance, conflict, or incompleteness to
  remain usable.

## End-of-week packet

The owner packet should be small enough to review and exact enough to build:

1. one-page verdict and confidence ledger;
2. survivor architecture and explicit losing alternatives;
3. exact semantic state machine and read-result tables;
4. identity/preimage/codec/signature manifest and vectors;
5. ABI and storage-ownership draft;
6. caps and measured worst-case costs;
7. reconstruction proof and recipe;
8. security model and unresolved high-risk items;
9. application, SDK, and Data Explorer pressure results;
10. freeze-now, version-later, and explicitly-out lists;
11. pinned standards disposition/status/dependency manifest plus accepted and
    observed Realm execution/read/verifier support profiles;
12. owner decisions that cannot be derived from evidence;
13. implementation sequence with tests carried forward unchanged.

The packet records `CONTINUE-DISPOSABLE`, `REDESIGN`, or
`RECOMMEND-GO-CODE`. It does not self-authorize implementation. Only after the
project owner records `GO-CODE` may candidate contract engineering begin in the
real repository, from the tested transition spec and golden corpus. It does not
begin by copying the disposable Solidity SUT's storage layout. Freeze and
deployment remain later, separately ratified gates.

## Open questions

- [x] Which arms lead the disposable integrated control? — `EXP-C0` selects
  flat exact Type plus split QueryProfile, uniform full-width `PrincipalId`,
  shared portable PublicationSet, destination-bound AdmissionPlan, and a
  self-authenticating Realm bootstrap. This selects what to test, not a winner.
- [x] Is the Type arm sufficient to start candidate engineering? — Yes for the
  bounded exact nominal/split-QueryProfile candidate: the closed-Type control
  and application passes exposed no Core falsifier. Wider grammar,
  fragmentation/churn, layered/View clean-room comparison, and permanent bytes
  remain engineering or `GO-FREEZE` work.
- [x] Are Principal, carrier, publication-domain, and Realm shapes sufficient
  to start candidate engineering? — Yes as disposable structures and selected
  defaults. Exact verifier transitions, hidden-power attacks, observer branch
  cases, succession, and independent conformance remain security engineering
  or `GO-FREEZE` work.
- [x] Are `BindingScope`, QueryProfile coverage, Withdrawal, and minimum Lens
  semantics exact enough to engineer? — Yes: their candidate structures,
  failure vocabulary, bounded controls, and Lens measurements are explicit.
  Integrated transitions and aggregate budgets are code tasks; a measured
  constitutional failure is the falsifier that reopens design.
- [x] Must physical topology be chosen before `GO-CODE`? — No. Start from the
  monolithic semantic control, measure it, and split only against the same state
  projection. Permanent topology and storage ownership remain `GO-FREEZE`.
- [ ] Do the SDK and Data Explorer preserve the exact Core source lock without
  exposing a P0/P1 truth or read-ABI mismatch? — This is the sole remaining
  cross-lane gate before this program may issue `RECOMMEND-GO-CODE`.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred with evidence
- [ ] `**Target repos:**` confirmed after the experiment phase
- [ ] Dependency chain reconciled against the active greenfield authority
- [ ] No production byte, ID, limit, contract split, or deployment claim rests
  on a synthetic or stale fixture
- [ ] At least one independent security, EVM, database/query, SDK, and product
  review has attacked the integrated candidate
- [ ] The project owner has reviewed the GO/NO-GO packet; no calendar deadline
  has been treated as promotion authority

## Implementation notes

This draft is being prepared in an isolated planning worktree. Experiment code
belongs in the existing local disposable Stage B repository or a clean child
worktree. No real-contract PR should be opened until the project owner has
explicitly recorded `GO-CODE`. The 2026-08-23 travel-period authorization
permits design convergence, sealed fixtures, and throwaway experiments only.
