# EFS foundation: qualified reads, continuity and independent recovery

## Assessment

The current EFS v2 direction has useful primitives: exact typed content,
separate authored occurrences and current Bindings, explicit Realm acceptance,
and bounded Lens resolution. Local differential, browser and populated-upgrade
experiments support continuing with those primitives. They do not certify the
whole architecture, arbitrary application rules or fifty years of operation.

The next foundational work is to join qualified consumption, affordable current
enumeration, identity continuity, historical rule evidence, private visibility
and recoverable storage. These are interacting contracts, not independent feature
checkboxes. A better SDK cannot repair an index with an undefined completeness
domain; a state proof cannot recover missing ciphertext; recovery of signing
authority cannot recover a lost decryption key.

The recommendations below are integrated into existing drafts, not promoted
protocol choices. No new Core noun, identity preimage, ABI, permanent limit,
chain, carrier vendor, recovery administrator or public deployment is selected.
Prototype implementation is reserved for a separately agreed next pass.

## Evidence and review scope

| Source | Exact inspected revision and scope |
| --- | --- |
| PM design branch, `codex/mvp-c0-coherence` | `cf352ed6bd5e2396550cbba068f56c1986d069c6`, before this documentation pass |
| Files browser, `fable/2026-09-09-files-browser` | `5ec070ceaaaf93b7c7c870ba20b2a1d82e25897d`; `Reviews/2026-09-09-files-browser-mvp/` |
| Acceptance lab, `codex/programmable-acceptance` | `e358ad66bb6471e1d89b1327d03c5ba7a286b116`; `Reviews/2026-09-10-programmable-acceptance/` |
| Prior comparative research | [[2026-09-09-mud-and-validation-research]], with pinned MUD/EAS sources; its earlier implementation inventory is historical |
| Advisory input | Fable's high-level assessment supplied in the September 10 conversation; evaluated as review feedback, not authority |

Three independent read-only Astra reviewers covered qualified reads/indexes,
identity/evolution, and privacy/carrier/recovery. The integrating review checked
programmable acceptance, source claims and cross-domain consistency. External
sources were read September 10, 2026; unversioned documentation is point-in-time
evidence, not an immutable release contract. EAS source is pinned to
`e6e970286ff18bbdfc5d8eff2742c5ece46040e4`. No runtime suites, exploits or new
performance experiments were executed in this pass. Measurements below are
retained results at the named source revisions, not newly reproduced outcomes.

The second review inspected the integrated wording. It required explicit
serialized-coverage revalidation, prospective authorization of same-ID recovery,
residual privacy leakage, actual AEAD context checks and the outer-transaction
rollback exception. Those corrections are included. The qualified-read/index,
identity and privacy/carrier reviewers found no remaining blocking issue in
their documentation scopes; this is not an audit or runtime approval.

## What the Fable assessment gets right, and what needs qualification

| Claim | Source-grounded disposition |
| --- | --- |
| Consumers can detach values from the qualifications that make them meaningful | Confirmed defect class. Files `web/app.mjs:755–761` turns non-FOUND tags into an empty array and displays “No current tags.” This includes UNKNOWN. Source-confirmed here, not browser-reproduced. Existing reader unions already distinguish FOUND/value from UNKNOWN, so adding a wrapper alone is insufficient. |
| Enumeration depends on lifetime names | Correct for the tested audit-inventory path: lifetime distinct roles across selected Principal scopes, not every mutation. Repeatedly changing one role does not create a new scope anchor each time. |
| Aggregation is the obvious fix and changes Core storage | Useful comparison, not established conclusion. A read-only aggregate helper can reduce RPC hydration without changing stored state or lifetime work. A maintained current-candidate index changes write/storage obligations. Compare them separately. |
| Identity is a first-come bytes32 registry | True of the Files fixture, not the intended model. Current architecture already proposes derived, zero-setup account Principals. The joined identity/Lens/recovery implementation remains missing. |
| Privacy has no evidence | No joined private-folder evidence in these inspected labs. Existing drafts already address encrypted bodies, key separation and metadata leakage; unexamined here does not mean no prior design work. |
| 8.7M gas means payload storage must change | Cost is a serious issue, but causality is not established. The router test creates a 16-byte file, measures its router transaction, then stages bytes separately. Metadata, indexes and admission amplification must be priced too. |
| Exports need proof rather than a transcript | Correct for claims authenticated independently of the exporter/RPC. Storage proofs alone do not prove arbitrary computed queries, omitted rows, historical rule execution or the trustworthiness of the anchor. |
| Mutable EAS-style callbacks inherently reinterpret old data | Too broad. EAS stores old attestations; its getter does not rerun the current resolver. Callbacks need exact execution qualification in EFS, not blanket exclusion. |
| Indexes, codegen and SDK shape can all wait as implementation details | Too broad. Physical layouts and tools can evolve, but index coverage and consumption semantics affect durable API promises. They need design pressure now. |

Fable's export repair supersedes the older missing-commitment-comparison defect
in [[2026-09-10-data-readiness-reconciliation]]. The current verifier recomputes
internal Record/content/path relationships. However, `verify-export.mjs:287–290`
explicitly says it does not match the resolution/head/posting reads needed for
currency or listing completeness. Some concluding transcript/currency language
remains stronger than the executed checks. Replay also needs an interpreter that
connects authenticated answers to the claimed selection, not just more requests.

## Qualified consumption and enumeration

### Make the normal path safe, without claiming language-level impossibility

The ordinary API should carry data with its exact scope, Plans/profiles,
observation and relevant evidence dimensions. Constructors and checked
composition should make false empty/complete claims difficult, including in
renderers and exporters. Raw extraction remains possible, but has no authority
to mint a qualified result. TypeScript explicitly permits unsound behavior;
assertions, JavaScript, deserialization and semantic mistakes escape types.
Runtime checks and independent consumer tests remain necessary.[^ts]

Do not collapse this into a universal verified Boolean. A fully enumerated set
of positions can contain unresolved positions. A known File can have unavailable
bytes. A valid signed record can be untrusted by a consumer. A private mount can
be visible while its children remain opaque. Each conclusion needs its own
qualifications, with plain-language product presentation.

For example, “show confirmed ocean tags” may omit unknown tag results if that
limitation is visible. “Show items not tagged ocean” needs a closed candidate
universe and evidence of nonmembership for every included item. Complementing
the first query's Boolean map is unsound. An exact count or export similarly
needs a claim about its resulting domain, not inherited input completeness.

Continuation must bind the logical observation: Realm/Core, block or equivalent
committed basis, implementation and query generation, inventory high-water,
scope, predicate and exact selected Plans. Never combine a sealed prefix with
different history after a reorg. EIP-1898 offers block-hash reads and a canonical
check by the node; it does not establish perpetual finality or authenticate a
malicious node's returned values.[^1898]

### Three enumeration approaches

| Approach | Improvement | Cost and remaining limitation |
| --- | --- | --- |
| Bounded canonical aggregate pages over audit inventory | Fewer round trips and repeated record/occurrence hydration; may require no new stored index | Lifetime candidate work remains; bound inspected anchors, storage reads, memory and return bytes, not only output rows |
| Atomically maintained current-candidate index per Principal/scope | Current browse can avoid irrelevant retired roles | More write/state cost; retain masks and unresolved candidates; prove generation/backfill and preserve separate history |
| Verified local snapshot/delta accelerator | Fast repeat browsing, richer local queries and replaceable acquisition services | Cold rebuild and omission detection remain; needs same-basis closure, rollback/reorg and offline recovery |

The first is the smallest call-amplification experiment; the second is the
actual lifetime-churn comparison. The third complements both. None justifies a
single globally preferred Lens. A current index must retain a whiteout that
suppresses another Principal's value; deleting it as “not a live file” resurrects
hidden data. Per-Principal candidate union and Lens resolution can still cost
more than the final displayed output. Any Plan-specific materialization must
price enrollment, update fan-out and its finite scope.

MUD's generated table libraries offer useful typed ergonomics over generic
bytes.[^mud-codegen] Its reverse index explicitly adds write overhead and excludes
pre-installation entries; it illustrates why installation is not backfill.[^mud-index]
Database practice independently reinforces stable ordering, common snapshots
and separately validated online index builds.[^pg-page][^pg-snapshot][^pg-index]
Do not copy database vacuum as permission to erase EFS history, or a whole-array
lookup as evidence of bounded onchain pagination.

Retained `evidence/churn-perf.json` reports 512 lifetime names / 48 live files /
page 32: 2,988 RPC requests, 2,325,852 response bytes and 12,313.1 ms at synthetic
50-ms delay. Three hundred live names require 3,410 requests and 13,289 ms. The
benchmark drains `openDirectory`; it is not first-useful-result latency or a
measured first-write critical path. Raised budgets are experimental controls,
not evidence that this slope is acceptable for long-lived applications.

## Identity, permission evolution and historical authority

The current account-Principal derivation is not the fixture's arbitrary-ID
claiming mechanism. Onboarding must independently derive authors and create or
select writable scopes without reserved accounts. Publication and inclusion in
another consumer's Lens remain distinct actions.

Three continuity approaches deserve the same recovery trace: explicit successor
Principals for key-bound identity; same-ID Realm-local managed graduation; and
portable managed genesis with independently admitted authority transitions.
Smart-account-native recovery may avoid a new custom identity engine. A uniform
Principal API does not logically require the same ID through every transition.
Same-ID continuity requires previously authorized policy, exact ordering and
visible Realm divergence. A bare EOA with no retained/recovery authority cannot
authorize a migration after its only key is lost.

ERC-1271 allows state-dependent verification and arbitrary external calls.
Historical admission, replayable historical authorization, and current authority
are different claims.[^1271] The dated Stage A proposal chapter
`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md:1165–1171`
overstates what codehash plus block establishes. Proxy/module/storage changes,
external calls and intermediate transaction state can matter. The chapter is
proposal evidence referenced by C0, not adopted current-spine authority; it is
preserved unchanged, with this correction carried into the current candidate.

ERC-4337 supplies account-selected validation and transaction infrastructure,
not a portable identity or recovery policy.[^4337] EIP-7702 prevents code presence
from being a sufficient EOA-versus-contract authority discriminator.[^7702]
ERC-7579 and ERC-7710 are Draft at inspection; use their modular-account and
delegation interfaces as adapter research, not a universal permission calculus.
ERC-7913 is Final and concerns addressless signature verifiers, not stable
Principal identity.[^7579][^7710][^7913]

AT Protocol offers a particularly important distinction: unknown ordinary data
can be preserved, but an entire permission declaration with unknown parameters
must be ignored for authorization because those parameters may restrict it.[^at-permission]
For EFS, reject the affected grant/action rather than erase the unfamiliar
restriction. Pin grant semantics; widened authority requires fresh authorization.
A data schema or installed Type package never grants authority by itself.

AT Protocol's separation of handles from DIDs is useful; domain-backed identity
and DID PLC's server-ordered, recovery-key hierarchy are not drop-in EFS
authority defaults.[^at-did][^plc] Recovery histories, shared funding, grants and
succession links also correlate personas. Local account-management convenience
must not require publishing those links.

## Programmable acceptance without address-as-meaning

The existing acceptance draft already recommends an exact Type committing its
mandatory RuleId, plus a separate local activation and historical receipt. The
standalone lab demonstrates that arm with immutable executors, explicit
activations, bounded read-only/stateful calls, ordered rollback and generated
consumers. It does not demonstrate the whole upgradeable Files acceptance path
or general equivalence of arbitrary dependency graphs.

EAS supplies a real non-bypassable resolver precedent. Its registry identifies
schemas using the schema string, resolver and revocability; the attestation
entrypoints execute resolver hooks and refuse false verdicts. Stored old
attestations are returned without rerunning today's resolver. Thus callback
support is not itself the portability failure: deployment-address identity,
mutable dependencies and missing historical context are the relevant EFS
differences.[^eas][^eas-schema]

Keep arbitrary developer logic, with honest qualification. Read-only STATICCALL
prevents state changes, not state-dependent meaning or resource exhaustion.[^214]
Stateful acceptance uses ordinary guarded CALL with atomic local rollback, not
developer delegatecall into Core. A matching runtime hash or a binding getter
does not prove that undeclared proxy/configuration dependencies are immutable or
equivalent. Verification profiles must state what they establish; local mutable
dependencies remain explicit policy rather than a fake cross-chain theorem.

Rollback means participating application effects and Core replay nonces inside
the reverting execution boundary. It does not undo outer transaction nonces,
protocol fees, already committed staging or EIP-7702 pre-execution delegation
processing. Blob fees also survive execution failure. Wallet/sponsor adapters
must expose their distinct accounting instead of promising that every part of a
user workflow reverses with one rejected acceptance.[^7702][^4844]

The lab includes gas limits in its Rule commitment. Compare operational budgets
in activation instead of permanent semantic identity before freezing that choice.
Gas-sensitive code and EVM fork changes mean the move is not automatically
semantics-preserving. Pin the actual execution profile, resource policy, local
dependency bindings and ordered action context. A timeout, a returned rejection
and missing binding evidence all refuse acceptance but deserve different
diagnostics. Gas forwarding rules are part of the implementation context.[^150]

Record bytes, fixed rule definition, local activation, historical acceptance,
current eligibility and destination acceptance remain separate. A new action
does not inherit eligibility from an old accepted body; a destination does not
inherit local uniqueness, payment or authority by copying the source receipt.

## Privacy, storage and verification

### Privacy options and visibility-qualified completeness

| Profile arm | Useful capability | Explicit limitation |
| --- | --- | --- |
| Public metadata with encrypted payload | Public discovery, tags and queries over disclosed fields | Public classification, relations and traffic metadata remain |
| Neutral sealed object/directory | Conceals inner Type, names, references and values | Traversal requires keys and authenticated manifests; no ordinary public semantic query of hidden fields |
| Selective disclosure or bounded proof | Establishes a named predicate without disclosing every input | Requires exact statement/verifier/public inputs, prover cost, replay controls and relevant state/authority evidence |

Tahoe-LAFS separates ciphertext custody and integrity checking from read/write
capabilities and ongoing repair. That is a useful precedent for delegating
storage verification without granting decryption, not a selected EFS crypto or
filesystem format.[^tahoe][^tahoe-caps]

A complete public listing can include a locked private mount without knowing
its child universe. Missing keys, unsupported encryption, corrupt ciphertext,
unavailable content and an authenticated empty private manifest are different
results. Opacity must not allow a negative tag match or silent Lens fallthrough.
The private result names its authenticated manifest/root, scope and key epoch,
without publishing secret capabilities. The selected profile must authenticate
its declared object/context and recipient/key-wrap authorization where required,
rejecting unauthorized transplantation while preserving intentional
multi-recipient sharing. AEAD does not invent bindings that its caller omits.

Separate signing-authority recovery, ciphertext retrieval and decryption-key
recovery. None implies the others. Rotation can protect future content, not
recall plaintext/keys already copied. Randomized encryption can sacrifice
deduplication deliberately; a public plaintext-derived ID can leak guesses.
Proofs must establish the specific hidden-data rule over its commitment and
state, not just that ciphertext has an acceptable shape. No private application
validity guarantee follows from public envelope validation alone.

### Carrier and economic comparison

Retain the state-readable canonical Core graph as the current requirement.
Bulk content may use different state/code or external carriers while keeping
exact content identity. Calldata/events are not ordinary future EVM getters;
blob payloads have a distinct retention/fee model and are not directly readable
by the EVM as persistent content.[^storage][^4844] Moving required canonical
Record/admission/index bodies out of state changes the contract-readable promise;
it needs an explicit alternative design, not an unnoticed optimization.

The Files router measurement around 8.7M gas precedes separate byte staging in
`test/router.test.mjs:46–53`; the receipt helper reports router gas at
`test/router-fixture.mjs:116`. Price creation, reuse, staging, index/Binding writes
and retention separately. Neither payload-carrier replacement nor RPC batching
alone explains or fixes the aggregate cost.

| Cost group | Required observations |
| --- | --- |
| Fixture | Exact source/profile, compiler/EVM fork, payload size, graph shape, historical churn, cold/warm/reuse conditions |
| Admission | Setup, signature/transaction requests, gas by write component, calldata, state growth, rollback and retry |
| Carriage | Payload versus contract-query inputs, staging fees, custody/failure domains, retention window, retrieval and repair |
| Reading/recovery | Inspected work, RPC/proof bytes, first useful and complete latency, CPU/memory, historical state/trie availability |
| Responsibility | Sponsor/reader/publisher costs, custody and key holders, renewal obligations and recovery assumptions |

Several gateways to one origin are not independent retained copies. Current gas
or custody prices are not fifty-year cost guarantees; retain quantities and
assumptions so later venues can be evaluated without redefining the data model.

### Authenticated recovery is claim-specific

CAR permits arbitrary blocks; roots need not imply a complete graph. Define EFS
closure rules, descriptors, excluded scopes and missing dependencies explicitly
rather than treating container validity as a completeness certificate.[^car]

Recovery needs an independently accepted chain/Realm anchor, then authenticated
facts and enough verified semantics to reconstruct the claimed selection.
EIP-1186 supplies account/storage proofs, not a proof of an arbitrary `eth_call`
return or a complete folder. Row inclusion without authenticated inventory
coverage cannot prove omitted rows absent.[^1186] Pin code, storage interpretation,
relevant proxy/dependency state and query basis; separate invalid evidence from
missing evidence. A declaration of the anchor, even a correctly rehashed header,
does not establish that it is the intended chain state.

Ethereum light-client operation itself needs external network configuration and
a trusted checkpoint. A proof bundle must identify its trust input.[^light]
Historical flat-state access and historical trie proofs are separate retention
capabilities in Geth.[^geth] EIP-4444 remains Draft at inspection, not evidence
that its proposed pruning has universally occurred.[^4444] These distinctions
reject an unconditional “one RPC endpoint forever” claim. Retained data, code,
proof material, a verifiable anchor and surviving keys must be named separately.

## Integration and discriminating next tests

| Design home | Integrated requirement | Next falsifier; not executed here |
| --- | --- | --- |
| [[Designs/efsv2/core-architecture-candidate#Qualified composition and independent verification]] | Checked claim composition; runtime trust-boundary validation; evidence per claim | Unknown tags/opaque mounts render as empty; filter/export changes scope but retains COMPLETE; genuine header with fabricated answers passes |
| [[Designs/efsv2/core-architecture-candidate#Indexes]] and [[Designs/efsv2/layered-type-system-and-data-abi#7. Query profile]] | Aggregate audit pages versus current candidates; explicit online coverage | Fixed 48 live names at 64/512/4096 lifetime roles; same-role churn control; 1/8/32/64-Principal whiteouts; backfill/reorg/write-behind-frontier |
| [[Designs/efsv2/core-architecture-candidate#Principal]] | Derived onboarding, prospective recovery and unknown-restriction refusal | Two fresh wallets, no reserved slot; previously configured recovery; revoked/unknown grant refuses; Realm divergence remains explicit |
| [[Designs/efsv2/programmable-type-acceptance]] | Exact rule/binding/execution policy; resource and dependency honesty | Every accepting path including migration/privileged paths; changed dependency/config; gas/fork difference; ordered payment/nonce/index rollback |
| [[Designs/efsv2/layered-type-system-and-data-abi#Private or encrypted data]] | Visibility-qualified completeness and hidden-rule guarantee boundary | Encrypted subtree omitted as absent; wrong-key/transplant; private data leaks via public index or diagnostics; restored identity but missing data key |
| [[Designs/efsv2/core-architecture-candidate#Content and Locators]] | Canonical state versus bulk bytes; all-in costs and independent custody | Same graph across carrier arms; live versus recovered data; correlated gateway failure; purported cheap operation excludes staging |
| [[Designs/efsv2/data-model-readiness]] | Current evidence separated from old assessments and unrun work | A reported isolated pass is mislabeled joined/product-ready |

The first joined prototype remains two fresh users creating, sharing, upgrading
and reloading a generated contract-validated Note. Run enumeration/cost and
qualified recovery comparisons alongside that work where independent; settle
privacy visibility and authority-continuity semantics before claiming the
foundation is ready to freeze. These are existing E1–E8/F1/F2 evidence inputs,
not a new immediate owner questionnaire or authorization to start code here.

Not selected: a global identity service, automatic cross-chain program
equivalence, one global Lens index, a mandatory hosted query service, universal
zero-knowledge execution, or wholesale adoption of a peer system's format.
Every additional experiment should discriminate a named design choice; passing
tests are not a reason to expand the framework indefinitely.

## Sources

[^ts]: Microsoft, [TypeScript type compatibility and soundness](https://www.typescriptlang.org/docs/handbook/type-compatibility).
[^1898]: Ethereum, [EIP-1898: block-hash JSON-RPC reads](https://eips.ethereum.org/EIPS/eip-1898).
[^mud-codegen]: Lattice, [MUD table libraries](https://mud.dev/store/table-libraries).
[^mud-index]: Lattice, [Keys with Value module](https://mud.dev/world/modules/keyswithvalue).
[^pg-page]: PostgreSQL, [LIMIT and OFFSET](https://www.postgresql.org/docs/current/queries-limit.html).
[^pg-snapshot]: PostgreSQL, [Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).
[^pg-index]: PostgreSQL, [CREATE INDEX and concurrent builds](https://www.postgresql.org/docs/current/sql-createindex.html).
[^1271]: Ethereum, [ERC-1271: contract signature validation](https://eips.ethereum.org/EIPS/eip-1271), Final at inspection.
[^4337]: Ethereum, [ERC-4337: account abstraction](https://eips.ethereum.org/EIPS/eip-4337), Final at inspection.
[^7702]: Ethereum, [EIP-7702: set code for EOAs](https://eips.ethereum.org/EIPS/eip-7702), Final at inspection.
[^7579]: Ethereum, [ERC-7579: minimal modular smart accounts](https://eips.ethereum.org/EIPS/eip-7579), Draft at inspection.
[^7710]: Ethereum, [ERC-7710: smart contract delegation](https://eips.ethereum.org/EIPS/eip-7710), Draft at inspection.
[^7913]: Ethereum, [ERC-7913: signature verifiers](https://eips.ethereum.org/EIPS/eip-7913), Final at inspection.
[^at-permission]: Bluesky, [AT Protocol permissions](https://atproto.com/specs/permission); see also [Lexicon permission fields](https://atproto.com/specs/lexicon).
[^at-did]: Bluesky, [AT Protocol DIDs](https://atproto.com/specs/did).
[^plc]: DID PLC, [v0.1 specification](https://web.plc.directory/spec/v0.1/did-plc).
[^eas]: Ethereum Attestation Service, [EAS.sol at e6e9702](https://github.com/ethereum-attestation-service/eas-contracts/blob/e6e970286ff18bbdfc5d8eff2742c5ece46040e4/contracts/EAS.sol), stored getters and resolver execution.
[^eas-schema]: Ethereum Attestation Service, [SchemaRegistry.sol at e6e9702](https://github.com/ethereum-attestation-service/eas-contracts/blob/e6e970286ff18bbdfc5d8eff2742c5ece46040e4/contracts/SchemaRegistry.sol).
[^214]: Ethereum, [EIP-214: STATICCALL](https://eips.ethereum.org/EIPS/eip-214).
[^150]: Ethereum, [EIP-150: gas costs and forwarding](https://eips.ethereum.org/EIPS/eip-150).
[^tahoe]: Tahoe-LAFS, [Architecture, including repair](https://tahoe-lafs.readthedocs.io/en/latest/architecture.html).
[^tahoe-caps]: Tahoe-LAFS, [Capability URI specification](https://tahoe-lafs.readthedocs.io/en/latest/specifications/uri.html).
[^storage]: Ethereum, [Blockchain data storage strategies](https://ethereum.org/developers/docs/data-availability/blockchain-data-storage-strategies/).
[^4844]: Ethereum, [EIP-4844: blob transactions](https://eips.ethereum.org/EIPS/eip-4844).
[^car]: IPLD, [CARv1 specification](https://ipld.io/specs/transport/car/carv1/).
[^1186]: Ethereum, [EIP-1186: account/storage Merkle proofs](https://eips.ethereum.org/EIPS/eip-1186).
[^light]: Ethereum consensus specifications, [Light-client operation](https://ethereum.github.io/consensus-specs/specs/altair/light-client/light-client/).
[^geth]: Geth, [Archive modes](https://geth.ethereum.org/docs/fundamentals/archive).
[^4444]: Ethereum, [EIP-4444: bound historical data](https://eips.ethereum.org/EIPS/eip-4444), Draft at inspection.
