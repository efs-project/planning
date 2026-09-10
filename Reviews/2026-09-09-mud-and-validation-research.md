# MUD and adjacent systems: lessons for EFS v2

## Assessment

EFS v2 does not yet demonstrate feature parity with MUD, EAS, IPLD, AT Protocol, or ComposeDB. It should not aim to reproduce every feature of every system. It should account explicitly for the capabilities that make a shared data substrate useful: executable acceptance rules, usable generated interfaces, efficient synchronization, safe extension and evolution, and practical export and recovery.

The most important gap is developer-supplied admission validation. EFS has structural validation experiments and an explicit place for Realm policy, but the current Type proposal excludes arbitrary Type-selected callbacks. That is not a completed substitute for a schema whose developer-supplied code must approve every accepted attestation. James reaffirmed that requirement in this conversation. It must not disappear behind a statement that applications can validate later.

MUD is a particularly valuable engineering reference. Its strengths include the integrated workflow around typed tables, application logic, delegated actions, synchronization, and inspection. Its historical failure reports also expose exactly the kinds of cross-layer bugs that isolated EFS fixtures can miss. Learning from those reports is not an assertion that the historical vulnerabilities remain in current MUD.

This is research and a set of recommended acceptance questions, not an adopted architecture, implementation plan, dependency selection, or claim that the proposed experiments have run. No production contracts, existing design decisions, or runtime code were changed.

## Evidence and scope

The EFS comparison uses the owned PM worktree at `cce0c730bcb26e5e6e083b99ad10302141166b54`. The same callback exclusion was also checked in the clean Files-browser worktree at `92f2d6bd7d021f2dc5488482fe29f68bbef41d38`. This is not a fresh execution or audit of that newer browser checkpoint. In particular, an older `report-for-codex.md` remains pinned to an earlier checkpoint and must not be used as the current implementation inventory.

Searches found no dedicated MUD architecture/security dossier in the inspected PM design/review/brainstorm trees, planning/main Markdown, or the design folders of the linked SDK, Explorer, Type, readiness, and Files-browser worktrees. This does not establish that no previous conversation or uninspected branch ever studied it. A July portable-schema handoff did already identify EAS-resolver-class requirements; the present gap is not a newly discovered use case.

External primary-source inspection covered:

- MUD official documentation displaying version `2.2.23`, plus a source checkout at `0e49b51ba934438e49c7f098e78d6e3ddf7567fb`, whose commit date is September 30, 2025. Source pinning matters more than calling it simply “latest.”
- EAS source at `e6e970286ff18bbdfc5d8eff2742c5ece46040e4`, whose commit date is July 17, 2026. Repository examples are not proof of audited or deployed behavior on any particular chain.
- The published February 2024 OpenZeppelin contract and code-generation audits, and MUD's September 2023 and April 2024 retrospectives. These concern historical versions; remediation status comes from the reports.
- IPLD, AT Protocol and Ceramic official specifications/documentation, accessed September 9, 2026. Those systems received a focused capability comparison, not a code audit of equal depth.

No third-party package scripts, live transactions, benchmark workloads, or vulnerability exploits were executed. The MUD/EAS source checkouts are disposable research material outside the EFS repositories. This report does not establish current maintainer capacity, hosted-service availability, release adoption, or comparative performance.

## Capability comparison

“Design” below means a mechanism is described; “component evidence” means a bounded prototype exercises part of it. Neither means product-ready interoperability.

| Useful capability | Relevant precedent | EFS standing and recommended treatment |
| --- | --- | --- |
| Publish new application shapes after deployment | MUD runtime table registration; EAS schemas | EFS has ordinary-Type admission and structural component evidence. Preserve permissionless publication; measure the complete developer loop. |
| Execute developer code that can veto acceptance | EAS schema resolvers; MUD Store/System hooks | **Unclosed requirement.** A Realm-module placeholder or frontend check is insufficient. Specify the mandatory acceptance boundary and prove it cannot be bypassed. |
| Generated Solidity and TypeScript interfaces | MUD table libraries/configuration | EFS SDK/codegen direction exists, but a cohesive external-developer workflow is not demonstrated. Prioritize this alongside contracts. |
| Read generic application data from another contract | MUD Store read API | EFS has generic typed/read experiments. An independently authored consumer must demonstrate the exact accepted Type, policy, authority, and observation requirements. |
| Add third-party behavior without giving away the database | MUD non-root Systems and namespace access | EFS separates data, policy, and applications. Define the equivalent authority-limited extension recipe; open Type publication alone does not provide it. |
| Scoped delegation and low-interruption sessions | MUD delegation controls and onboarding tooling | EFS plans/signing requirements are not proof of scoped sessions. Test grants, revocation, expiry, upgrades, and real wallet behavior separately. |
| Atomic multi-action calls | MUD native batch calls; EAS multi-attestation | EFS has atomic multi-leaf component evidence. Preserve effective-author context and distinguish a single atomic transaction from a resumable multi-transaction job. |
| Fast synchronization and reactive application state | MUD sync packages and indexers | EFS has qualified readers and prototype caching; generic snapshot/delta synchronization with recovery is unfinished as a product feature. |
| Generic inspection without custom application UI | MUD World Explorer | EFS Explorer is correctly separate from Files. Make new Types inspectable immediately, including raw evidence and validation status. |
| Onchain iteration and reverse lookup | MUD optional index modules | EFS deliberately requires baseline indexes and honest coverage. Preserve this difference; do not equate “index installed” with complete coverage. |
| Schema evolution without rewriting old facts | MUD immutable table schemas; AT Protocol compatibility rules | EFS exact revisions are appropriate. Add a friendly compatibility checker and tested adapters; exact Type IDs alone do not make evolution convenient. |
| Self-contained data transfer | IPLD CAR; AT Protocol repository export | EFS retained-state reconstruction is useful component evidence. A transfer package needs an explicit closure: records, Type descriptors, content, and required evidence, with missing parts reported. |
| Compose reusable model packages | ComposeDB composites | EFS should make assembling exact Type/profile packages easy. A package should supply useful generated APIs without granting trust merely by being installed. |
| Event-only data | MUD offchain tables | **Deliberate non-equivalence for canonical EFS data.** Event-only telemetry can be an application option, but must not silently replace the state-readable/reconstructible contract guarantee. |

The MUD sources supporting this inventory are its Store, table-library, System, delegation, batch, index, and Explorer documentation.[^1][^2][^3][^4][^5][^6][^7][^8]

EFS evidence is described in [[Designs/efsv2/system-constitution]], [[Designs/efsv2/core-architecture-candidate]], [[Designs/efsv2/layered-type-system-and-data-abi]], [[Designs/sdkv2/mvp-interface]], and [[Reviews/2026-09-08-upgradeable-foundation/validation-frontier]]. The open validator question belongs with the existing V2-E8 work, not a new unqualified parity claim.

## MUD architecture: useful ideas and boundaries

### Typed data as an everyday programming interface

MUD separates table schemas from application logic. A configuration describes keys and fields; generated Solidity libraries expose typed record and field access. A contract need not handcraft raw byte operations for every table. Tables can be registered at runtime, while their schemas remain immutable after creation. The documented extension pattern uses another table with the same keys for additional fields.[^1][^2][^9]

For EFS, the transferable idea is the workflow, not necessarily MUD's storage format. A developer should define an exact Type once and obtain consistent encoders, readers, Solidity helpers, examples, and inspectable schema metadata. The authoritative admission checker must still reject invalid inputs from callers who do not use the generated SDK.

MUD's documented field model is narrower than a general nested JSON/struct language: static primitives, arrays of static primitives, strings, and bytes, with restrictions on keys and complex nested values.[^10] This is a useful reminder that expressiveness must be evaluated through concrete application models, not just a count of available type constructors. EFS's richer proposed grammar is an opportunity and a validation burden, not automatically an advantage.

### Business logic and storage are different extension points

MUD Systems contain business logic while the World holds shared state. Ordinary Systems run through authorization boundaries; root Systems have much broader powers. Store hooks attach to mutations, whereas System hooks attach to calls. A rule that only guards an operation is not automatically an invariant on every direct storage write.[^3][^11][^12]

EFS should make the same distinction easy to understand: an operation controller answers “may this action happen?”, a mandatory Type/acceptance rule answers “may this data be accepted here?”, and a read policy answers “should this consumer use it?”. These can share code, but they cannot substitute for one another without an explicit equivalence test.

MUD's current `StoreCore.setRecord` source also explicitly handles event-only tables through an early return before Store hooks.[^13] That is a deliberate mode boundary, not an allegation of a vulnerability. It illustrates why EFS validation requirements must name which carriers and entrypoints they cover.

### Synchronization is a first-class feature

MUD emits standardized mutations and supplies infrastructure for turning them into local or server-side application state. Its replication guide and indexer documentation make the data pipeline part of the framework, not a separate exercise each application must invent. World Explorer supplies a generic interface for inspecting and manipulating World state.[^7][^8][^14]

EFS needs both a trustworthy canonical path and an efficient application path. A replaceable indexer can accelerate useful queries without becoming their unqualified authority. A static SPA can use browser-local state and optional external services; it cannot assume its own API server exists. The remaining engineering question is which results are independently verified, how coverage is conveyed, and how a client resumes after a missed range, reorganization, or provider failure.

MUD's inspected snapshot loader contains explicit compatibility fallbacks for older indexer APIs.[^15] EFS should similarly budget for version skew. An SDK upgrade cannot assume every service and every long-lived client upgrades simultaneously.

### Indexes have lifecycle and cost

MUD's KeysInTable and KeysWithValue modules provide onchain iteration and reverse lookup, but their documentation warns of per-write overhead and says pre-installation records are not backfilled automatically.[^6][^16] The inspected KeysWithValue hook additionally documents that it indexes only the first element of a composite key.[^17]

This makes EFS's coverage machinery practically important. A post-installation index can correctly return zero matches while older matching records exist. An EFS consumer must not turn that answer into complete absence. Test activation, backfill, mutation during backfill, composite references, and the exact endpoint of a coverage claim.

The public `getKeysInTable` helper allocates and returns the full key collection.[^18] That is useful in its intended setting, but not a template for EFS's bounded directory API. Borrow the ergonomics while retaining paged, scope-qualified behavior and measuring its cost.

### Upgrades and delegation are broader than a proxy switch

MUD distinguishes replacing Systems from replacing a World implementation through an optional proxy. Namespace ownership controls behavior registration and other administration; renouncing one authority does not establish that every reachable dependency is immutable.[^11][^19]

EFS's testnet upgrade design should inventory all mechanisms that can change acceptance or interpretation: Core implementation, routers, validator code, validator configuration, authority modules, and SDK/profile mappings. A historical acceptance result must continue to identify the rules actually used then.

MUD supports delegation controls limited by calls, Systems, or time.[^4] However, the inspected EntryKit session setup uses an unlimited delegation in its setup paths.[^20] This is not a claim of an exploit; it shows that framework capability and default application policy are different. For EFS, a convenient session should be constrained by the operations and resources it needs. A broad grant should be an explicit choice, not an invisible price for eliminating prompts.

## Developer validation: the requirement that must close

### What EAS actually provides

In the inspected EAS source, a schema fixes a resolver address. Attestation creation invokes that resolver; false or a revert prevents successful completion. Writes staged earlier in the transaction revert with the failure. The base resolver also covers batches and revocation. These callbacks are payable, ordinary calls, not universally read-only calls. The schema registry stores a schema string; generic EAS admission does not interpret that string as an automatic ABI shape validator.[^21][^22][^23]

The useful contract is simple: **a caller cannot bypass the resolver while still obtaining a successfully accepted attestation under that schema.** EFS must provide an equally clear answer for developer-defined rules.

### What is missing in the current EFS description

[[Designs/efsv2/core-architecture-candidate#Type Schema]] describes a bounded structural language with no arbitrary Type-created admission callbacks and allows optional external evidence or bounded, revisioned Realm modules. The layered Type proposal's non-goals exclude arbitrary Type-selected validators during admission or reads.

Those are not all the same policy. Prohibiting unbounded execution or automatic code execution during ordinary reads is compatible with supporting developer-supplied validation. Prohibiting any mandatory Type-selected code at acceptance is a stronger restriction. “An application can check afterward” does not satisfy the stronger requirement James has stated.

The older [[Designs/efsv2/fable-handoff-portable-schemas-and-validators]] already lists stateful application acceptance, proof checks, payments, uniqueness, side effects, and revocation policy as investigation requirements. Its obsolete carrier/kind mechanics are not current authority, but the requirement history is clear.

### Recommended acceptance contract, not a selected ABI

The next design comparison should require these properties:

1. **Developer-defined logic.** A developer can supply real EVM validation code, including custom cross-field checks and reads of relevant onchain state. The feature is not confined to a permanent list of built-in predicates.
2. **An unambiguous attachment.** Consumers can determine which exact rule is mandatory for the acceptance claim. If a Type alone does not imply it, the public API must expose an exact Type-plus-acceptance-profile contract and demonstrate that it satisfies the intended use case. Do not call a weaker optional profile full EAS schema parity.
3. **No bypass.** Direct, batch, relayed, imported, reused-record, upgraded, and controller-mediated admissions cannot skip the required check while acquiring the same acceptance grade.
4. **Atomic failure.** Rejection, unavailable code, unexpected return data, or exhausted validation resources do not leave accepted occurrences, effective bindings, or accepted-index entries behind. Retaining inert raw evidence elsewhere is a separately labeled operation.
5. **Explicit observation.** A check involving balances, ownership, time, external contracts, or configuration is an acceptance-at-a-basis statement. It is not a timeless property of the body.
6. **Bounded execution.** Gas, response size, nesting, and failure handling are controlled. These bounds can be revisioned and measured; “arbitrary logic” does not mean “infinite computation” in EAS or EFS.
7. **Isolated authority.** Validation does not give an arbitrary developer `delegatecall` access to Core storage. A bad validator should affect its dependent acceptance path, not unrelated Types or Realms.
8. **Honest evolution and reuse.** Changing a validator, its configuration, or a relevant dependency cannot silently reinterpret old acceptance evidence. A cached check of immutable body facts cannot substitute for fresh checks of a new author, action, or changed state.

These requirements do not demand one universal validator address on every chain. Portable rule identity and the chain-local executor can be distinct, but the binding between them must be verifiable. An address or top-level code hash alone does not prove equivalent behavior when proxies, dependencies, configuration, or execution environments differ.

### Read-only and stateful logic should not be conflated

`STATICCALL` prevents state changes in the call tree, making it a useful candidate for custom read-only checks.[^24] It does not guarantee termination within a desired budget, truthful reasoning, availability, or independence from chain state. Nor does it prevent a validator from reading state while an outer operation is in progress. The intended pre-state/candidate-state semantics must be explicit.

A read-only validator is a sensible first comparison arm, not full replacement for every EAS resolver. Taking payment, consuming a one-use credential, reserving uniqueness, or emitting dependent effects may require stateful transaction logic. A Realm/controller can combine those actions atomically with acceptance, provided direct admission cannot bypass the required condition. Test this distinction instead of silently dropping the use cases.

There is a useful new EAS example in the inspected July 2026 source: `SelfVerifyingResolver` checks a supplied read using `staticcall` and compares the result hash.[^25] This demonstrates a concrete pattern, not timeless truth. A consumer still needs to know the intended target/query and state basis; a caller-selected contract returning the expected bytes is not evidence of an independently intended fact.

## Documented landmines and EFS tests they suggest

The first two rows are official MUD retrospectives. The next three summarize findings in the historical OpenZeppelin contract audit; the report records fixes for those findings. The final audit row comes from the separate code-generation audit. No row asserts that the same bug exists in current EFS or current MUD.

| Observed lesson | Recommended EFS pressure test |
| --- | --- |
| MUD's 2023 alpha self-registration vulnerability elevated a call through the World into root authority; it was fixed in `2.0.0-next.8`.[^26] | Register self, proxy, router, wrapper, and forwarding combinations. Verify that caller context cannot become author or administrator authority accidentally. |
| A 2024 dynamic-field read bug escaped internal mocks and appeared only on the external read path; it was fixed in package `2.0.6`.[^27] | Run the same mixed static/dynamic Type through internal helpers, external Solidity consumers, generated SDK, and deployed browser flow. |
| Namespace front-running plus pre-existing grants could backdoor an apparently legitimate ownership handoff.[^28] | Verify initial grants and all privileged configuration, not only the final owner address. An already-existing resource is not automatically a safe initialization success. |
| Reentrant hooks could make event order disagree with final storage order.[^28] | Compare emitted/reconstructed state with canonical state under nested hooks, failure, and rollback. Do not infer ordering from event names or a receipt alone. |
| Hook arguments and table-layout consistency checks had correctness defects.[^28] | Assert exact pre-state/candidate-state inputs and cross-check cached layouts against descriptors before accepting bodies. |
| Generated fixed-array APIs and test coverage had defects or gaps in the code-generation audit.[^29] | Compile and execute generated artifacts. Include fixed/dynamic arrays, invalid lengths, signed boundaries, and independent decoding—not only source snapshots. |
| MUD's inspected event-only Store path skips Store hooks.[^13] | Enumerate every carrier and entrypoint covered by mandatory validation. An optimized or alternate path must not gain the same acceptance claim with fewer checks. |
| MUD index modules have limited installation-time coverage and implementation-specific key support.[^6][^16][^17] | Exercise pre-index records, partial backfill, full composite keys, removal, and cursor continuation before claiming complete results. |
| AT Protocol warns about adversarial tree shapes and incomplete or cross-account archive imports.[^30] | Charge traversal work, bound depth/allocations, verify transfer closure, and ensure imported data cannot resurrect unrelated current state. |

A separate architectural caution from the MUD contract audit is that its efficiency model trusts authorized low-level writers not to corrupt their own table representations.[^28] EFS should not import that assumption if its promise is that arbitrary callers cannot obtain structurally accepted malformed records. Generated helpers improve convenience; they do not constrain a hostile raw caller.

## Useful lessons from the other systems

### IPLD: transport, logical views, and safe extensibility

CAR packages content-addressed blocks, but CARv1 does not itself guarantee a complete graph or deterministic archive serialization.[^31] For EFS, a downloadable archive is not automatically a complete recovery package. Define the required closure separately from the transport format, and verify both missing and unrelated data.

IPLD's advanced data layouts can present sharded structures through ordinary data-model interfaces. Their use is optional, and its documentation explicitly recognizes the problems of loading foreign code across implementations and public infrastructure.[^32][^33] This is a strong reference for SDK-side logical views and pluggable storage without allowing data to trigger arbitrary code in every reader. EFS's trust-selection Lenses are not equivalent to IPLD's data-layout adapters despite the shared visual metaphor.

### AT Protocol: practical compatibility, not just new version IDs

AT Protocol specifies additive optional fields, retention of required fields, and a new name for breaking changes. It warns that older clients can destroy unknown fields by decoding and reserializing them. Its validation options also explicitly distinguish required validation from optimistic acceptance when a Lexicon is unknown.[^34]

The EFS lesson is to give developers a compatibility linter and safe editing behavior, not only exact identifiers. A shape-compatible extension should have a clear generated read path; an old editor must preserve unsupported data or refuse the edit. EFS should not borrow optimistic schema acceptance for a result advertised as fully validated.

AT Protocol repository transfer also separates the repository structure from larger media blobs.[^30] An EFS export UI should distinguish metadata, content, and evidence completeness rather than provide one misleading “backup complete” indicator.

### ComposeDB: make reusable models feel like an application API

ComposeDB composites combine models into an application GraphQL schema, support aliases for otherwise unwieldy identifiers, and compile a client-facing definition.[^35] EFS can learn from this packaging experience without making GraphQL or a server mandatory: a developer selects exact Type/profile packages and gets a coherent local API with names, dependencies, and generated helpers.

This pass did not validate Ceramic runtime behavior or establish parity with its mutation, indexing, or account-control features. A failed retrieval of a deeper model guide is not evidence that such features are absent. Its focused contribution here is model composition and developer packaging.

## Highest-value follow-up comparisons

These are recommended experiments, not tests executed by this report. They should reuse the current prototype rather than launch another broad implementation program.

| Priority | Small experiment | What would count as useful evidence | Natural reviewers, not new assignments |
| --- | --- | --- | --- |
| First | **Mandatory custom validation:** use an Outfit with incompatible pieces and an issuer-qualified claim | A developer-written check rejects invalid data through every accepting entrypoint. A second contract verifies the exact acceptance rule. Valid siblings still work. | v2 PM, Contracts Dev, SDK PM |
| First | **Stateful acceptance:** consume a one-use authorization or enforce per-Realm uniqueness | Duplicate/racing attempts fail atomically; a new author or Realm cannot reuse another acceptance receipt as authority. | Contracts Dev, v2 PM |
| First | **Independent generated consumer** | One Type declaration produces TS and Solidity helpers; a separately written contract and browser agree on valid and malformed inputs through external calls. | SDK PM, Contracts Dev |
| Next | **Synchronization and recovery** | Snapshot plus deltas agrees with canonical reads after disconnect, duplicated/missing logs, rollback/reorganization, and provider switch. Partial coverage stays visible. | SDK PM, Web Client Dev |
| Next | **Index activation and backfill** | Records before and during activation appear only under justified coverage claims; composite keys and stale cursors behave correctly. | v2 PM, SDK PM |
| Next | **Session grant boundary** | An actual wallet authorizes a clearly scoped session; rename/equip works inside scope, while unrelated writes, expired grants, and post-revocation calls fail. | SDK PM, Web Client / OS PM |
| Next | **Every new Type is inspectable** | Explorer displays shape, exact identity, raw content, acceptance evidence, and unknown fields without writing a Type-specific screen. | Data Explorer PM, SDK PM |
| Before portability claims | **Complete export and recovery** | A fresh implementation restores required data from a declared closure, with the original publisher unavailable; missing content or authority basis is explicit. | SDK PM, Data Explorer PM |

For validator testing, include false, revert, no code, malformed/oversized return, exhausted gas, changed proxy implementation, changed configuration, and a read that sees an in-progress batch. Test whether rules inspect one record, the whole proposed batch, or sequential staged state. Those choices affect expressiveness and must be made visible before choosing an ABI.

Performance comparison should use the same useful workload: accepted records and required history/index obligations, not a bare MUD mutable-cell write against a full EFS authored file creation. Report application-observable latency, transaction count, gas, storage growth, and recovery cost separately. No comparative numbers are supplied here because no matched benchmark was run.

## Recommendation

Keep MUD as a first-tier architecture and developer-experience benchmark. Do not adopt its entire framework, mutable table semantics, global administrative trust, default delegation policy, or event-only mode merely because they are convenient. Equally, do not dismiss mature tooling just because EFS has different data identities.

The immediate design task is to reconcile the Type-level callback exclusion with the mandatory developer-validation requirement. Compare a real enforced read-only validation path and a stateful acceptance/controller path; judge them by non-bypassable acceptance, portability of identity, historical evidence, and developer simplicity. An optional external endorsement is a different feature.

Then carry the accepted boundary through generated SDK helpers, a real external Solidity consumer, and the Files/Explorer workflow. This turns the research into a small set of testable product capabilities. It is more decision-relevant than expanding the Type language without first proving who enforces its rules.

## Sources

All external links below are primary project documentation, project source, an original auditor report, or an Ethereum specification. MUD and EAS source links are pinned to the commits identified above. Document pages can change independently of source releases.

[^1]: Lattice, [MUD Store introduction](https://mud.dev/store/introduction).
[^2]: Lattice, [MUD table libraries](https://mud.dev/store/table-libraries).
[^3]: Lattice, [MUD Systems](https://mud.dev/world/systems).
[^4]: Lattice, [MUD account delegation](https://mud.dev/world/account-delegation).
[^5]: Lattice, [MUD batch calls](https://mud.dev/world/batch-calls).
[^6]: Lattice, [Keys in Table module](https://mud.dev/world/modules/keysintable).
[^7]: Lattice, [MUD Indexer](https://mud.dev/indexer). Hosted-chain examples are historical documentation, not verified service availability.
[^8]: Lattice, [World Explorer](https://mud.dev/world-explorer).
[^9]: Lattice, [MUD tables](https://mud.dev/store/tables), including the immutable-schema note.
[^10]: Lattice, [MUD data model](https://mud.dev/store/data-model).
[^11]: Lattice, [Namespaces and access control](https://mud.dev/world/namespaces-access-control).
[^12]: Lattice, [Store hooks](https://mud.dev/store/store-hooks) and [System hooks](https://mud.dev/world/system-hooks).
[^13]: Lattice, [`StoreCore.sol`, pinned source](https://github.com/latticexyz/mud/blob/0e49b51ba934438e49c7f098e78d6e3ddf7567fb/packages/store/src/StoreCore.sol#L280-L392).
[^14]: Lattice, [Replicating onchain state](https://mud.dev/guides/replicating-onchain-state).
[^15]: Lattice, [`getSnapshot.ts`, pinned source](https://github.com/latticexyz/mud/blob/0e49b51ba934438e49c7f098e78d6e3ddf7567fb/packages/store-sync/src/getSnapshot.ts).
[^16]: Lattice, [Keys with Value module](https://mud.dev/world/modules/keyswithvalue).
[^17]: Lattice, [`KeysWithValueHook.sol`, pinned source](https://github.com/latticexyz/mud/blob/0e49b51ba934438e49c7f098e78d6e3ddf7567fb/packages/world-modules/src/modules/keyswithvalue/KeysWithValueHook.sol).
[^18]: Lattice, [`getKeysInTable.sol`, pinned source](https://github.com/latticexyz/mud/blob/0e49b51ba934438e49c7f098e78d6e3ddf7567fb/packages/world-modules/src/modules/keysintable/getKeysInTable.sol).
[^19]: Lattice, [Upgrading worlds](https://mud.dev/world/upgrades) and [`WorldProxy.sol`, pinned source](https://github.com/latticexyz/mud/blob/0e49b51ba934438e49c7f098e78d6e3ddf7567fb/packages/world/src/WorldProxy.sol).
[^20]: Lattice, [EntryKit `useSetupSession.ts`, pinned source](https://github.com/latticexyz/mud/blob/0e49b51ba934438e49c7f098e78d6e3ddf7567fb/packages/entrykit/src/onboarding/useSetupSession.ts).
[^21]: Ethereum Attestation Service, [`EAS.sol`, pinned source](https://github.com/ethereum-attestation-service/eas-contracts/blob/e6e970286ff18bbdfc5d8eff2742c5ece46040e4/contracts/EAS.sol#L402-L686).
[^22]: Ethereum Attestation Service, [`SchemaResolver.sol`, pinned source](https://github.com/ethereum-attestation-service/eas-contracts/blob/e6e970286ff18bbdfc5d8eff2742c5ece46040e4/contracts/resolver/SchemaResolver.sol).
[^23]: Ethereum Attestation Service, [`SchemaRegistry.sol`, pinned source](https://github.com/ethereum-attestation-service/eas-contracts/blob/e6e970286ff18bbdfc5d8eff2742c5ece46040e4/contracts/SchemaRegistry.sol).
[^24]: Vitalik Buterin and Christian Reitwiessner, [EIP-214: STATICCALL](https://eips.ethereum.org/EIPS/eip-214), created February 13, 2017.
[^25]: Ethereum Attestation Service, [`SelfVerifyingResolver.sol`, pinned example](https://github.com/ethereum-attestation-service/eas-contracts/blob/e6e970286ff18bbdfc5d8eff2742c5ece46040e4/contracts/resolver/examples/SelfVerifyingResolver.sol).
[^26]: Lattice, [September 2023 registerSystem vulnerability retrospective](https://mud.dev/retrospectives/2023-09-12-register-system-vulnerability).
[^27]: Lattice, [April 2024 StoreRead.getDynamicFieldLength retrospective](https://mud.dev/retrospectives/2024-04-17-storeread-getdynamicfieldlength-bug).
[^28]: OpenZeppelin, [MUD contract audit](https://www.openzeppelin.com/news/mud-audit), published February 11, 2024; historical findings and recorded remediations.
[^29]: OpenZeppelin, [MUD code-generation audit](https://www.openzeppelin.com/news/mud-code-generation-audit), published February 11, 2024; audited commit `f613359`.
[^30]: Bluesky Social PBC, [AT Protocol Repository specification](https://atproto.com/specs/repository), especially security considerations and media/export boundaries.
[^31]: IPLD, [CARv1 specification](https://ipld.io/specs/transport/car/carv1/), especially graph completeness and determinism.
[^32]: IPLD, [Advanced data layouts](https://ipld.io/docs/advanced-data-layouts/) and [ADL signalling](https://ipld.io/docs/advanced-data-layouts/signalling/).
[^33]: IPLD, [ADL dynamic loading](https://ipld.io/docs/advanced-data-layouts/dynamic-loading/).
[^34]: Bluesky Social PBC, [Lexicon specification](https://atproto.com/specs/lexicon), especially validation options, evolution, and unknown-field preservation.
[^35]: Ceramic, [ComposeDB composites](https://developers.ceramic.network/docs/composedb/guides/data-modeling/composites).
