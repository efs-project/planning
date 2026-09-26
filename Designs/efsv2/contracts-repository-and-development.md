# Contracts repository, architecture and release foundation

**Status:** draft — researched v2 PM input to the clean-repository plan
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[prototype-delivery-checklist]], [[owner-rulings]], [[../sdkv2/architecture-candidate]], [[../sdkv2/repository-and-distribution-plan]], [[../web-client-os/client-repository-and-development]]
**Reviewers:** scoped contracts-boundary (Astra High), toolchain (Sol High) and release/consumer (Sol High) agents; integrated draft reviewed 2026-09-26, corrections incorporated; human initialization-plan review remains
**Last touched:** 2026-09-26

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2

## Problem

EFS needs a contracts repository that an engineer can understand, build, deploy, upgrade and consume independently. The disposable prototype demonstrated valuable behavior but accumulated size-driven helper extractions, tightly coupled source files and release-specific readers. Copying that structure would carry avoidable risks into production. A directory tree or a default framework choice does not resolve those risks.

James requested deeper research and planning before Claude proposes repository initialization. This document supplies a concrete proposal and acceptance criteria. It creates no product repository and selects no permanent protocol bytes, deployment or governance. Temporary successor names remain `contracts-v2`, `sdk-v2` and `client-v2`; the existing v1 repositories remain reference evidence.

Planning input: `909f7da75bf3a39d6d5ddcb578fa6e79e81344a0`. Prototype inspected: `4fbea63a2b87f92c4878c61c0b437ae3c096c2bc`, in the existing `planning-warroom-b-run` worktree. The [[../../Reviews/2026-09-24-prototype-delivery/README|September 24–25 closeout]] owns measured results. This pass inspected source and documentation; it did not rerun the prototype or execute a Hardhat/Foundry comparison.

## Proposal

### 1. Recommendation and what is actually fixed

Build the compact Ledger, a separate required index, exact application Types, qualified readers, and a directly usable contract interface. Organize the implementation around state ownership and call context. Publish reproducible artifacts that the SDK and client can consume without a sibling checkout or hosted EFS backend.

**Established requirements:** contracts can validate/read/write data; original attribution and portable meaning survive export; custom developer validation is mandatory where the Type requires it; required indexes commit atomically; incomplete reads never imply absence; testnet contracts can be upgraded with populated state; ordinary wallets and a static SPA can use the system. The ordinary Files workflows, ordered Lenses, distinct tag subjects, curated Lists, external carriers and scoped device authorship remain in the delivery checklist.

**Recommendations in this document:** module topology, tooling, storage organization, release format, folder layout, test structure and build sequence. They are reviewable engineering choices. A new architecture document does not settle permanent upgrade control, rich public naming rules, privacy guarantees or universal cross-chain authority.

The repo should deliver three things: deployable EFS modules, a small consumer-facing Solidity surface, and a reproducible release/fixture bundle. It should not host the Web Client, a second TypeScript SDK, an indexer service, or an elaborate agent management framework.

### 2. Contract boundaries: state ownership comes first

| Responsibility | Recommended home | Reason and constraint |
| --- | --- | --- |
| Records, exact bodies, Subjects, authored bindings, admission/evidence history and replay protection | One stable Ledger endpoint and one documented state schema | Atomic saves and attribution have one auditable authority boundary. Split implementation code without inventing competing writers. |
| Authorization, preparation, ordered execution and finalization | Ledger implementation plus a small fixed set of release-pinned modules | Large functions may execute through delegated modules when Ledger context is required. Arbitrary caller-selected delegate targets are excluded. |
| Exact Type definitions and local rule bindings | Type catalog with immutable definitions; separate append-only policy activation history | Evolving Realm policy must not replace the meaning of an existing Type. Permissionless described-Type installation cannot silently become admin-only. |
| Required inventories, reference postings, coverage and replay | Separate index coordinator/state contracts | Successful admission includes their work. Splitting physical index state can be justified by size, but it remains one coordinated obligation set. |
| Exact points, bounded Lenses, Files/tag joins | Versioned, primarily stateless readers | Read projections can evolve without relocating original data or enlarging every write. Expensive broad queries must not be prerequisites for cheap exact reads. |
| Files, Directory, Name, carrier, tag, List and Home rules | Versioned application profiles and validators | No new kernel noun per product. Keep immutable Type-defining source isolated from evolving readers/index implementation. |
| Import, historical verification, proofs and archives | Explicit adapters/periphery | Preserve portability without charging every native write for a universal proof engine. Each adapter declares its actual release and authority support. |
| Deployment and activation | Small testnet controller plus scripts | Initialize and activate a coherent release. No half-upgraded module set may accept ordinary writes. |

These are responsibility boundaries, not an instruction to deploy one contract per row or per source file. Internal libraries do not reduce runtime size when their code is inlined. Separate `CALL` modules own their own state and change the caller. Delegated modules preserve context but share the Ledger's full storage authority; namespaced storage is organization, not a sandbox.

**Two caller identities must survive decomposition.** An application that calls a shared forwarding writer becomes a write by that writer unless an explicit authorization protocol says otherwise. An internal application library calling Ledger preserves application authorship. Independently, developer validators currently observe Ledger as their caller; moving their invocation into an ordinary external verifier changes that context. `DescribedTypeRule.accept()` obtains the registry from its actual caller. Both paths need explicit native-consumer tests. Never repair forwarding with `tx.origin`.

### 3. Upgrade mechanism and storage

Prefer the existing proposal of a standard Transparent proxy/ProxyAdmin for the Ledger endpoint, with fixed delegated modules only where justified. UUPS is a valid comparator. An ERC-2535 diamond is appropriate if measured partitioning shows that a standard implementation plus small fixed modules is awkward or has inadequate growth room. A custom selector router that quietly recreates diamond management is not inherently simpler.

| Approach | Useful when | Cost / reason not to adopt automatically |
| --- | --- | --- |
| Standard proxy + small fixed module set | One coherent Ledger release and clear state ownership | Still requires real partitioning; a proxy alone does not solve implementation size. |
| Standard ERC-2535 diamond | Many substantial entrypoints genuinely need shared state and one address | Selector-map compatibility, facet initialization, shared authority and cut history become release obligations. |
| Separate stateful writer for every feature | State/authority can truly be independent | Poor default for Ledger: extra calls, caller changes, cross-contract wiring and fragmented atomicity. Suitable for independent applications above it. |

The prototype's last measured Ledger is 24,524 runtime bytes, only 52 below the EIP-170 ceiling. The first real implementation milestone must demonstrate deployed runtime and initcode sizes with meaningful margin before feature expansion. Start with a **proposed review threshold** around 20 KiB runtime per major module; exceeding it requires a size/growth explanation, not smaller error messages or disabling the network limit. It is a development budget, not a protocol constant. Compare the full operation gas after extraction, including extra calls and cold access.

Use explicit storage namespaces, with ERC-7201 as the standard candidate. Keep one namespace owner and access library per state domain. Validate fields, packing and inherited layouts across releases; namespaces do not make field reordering safe. Initializers, implementation locking, reinitializers and constructor/immutable configuration must be designed explicitly. The lab's constructor-driven Registry/Index/Ledger cannot simply be wrapped in proxies and assumed initialized. [ERC-7201](https://eips.ethereum.org/EIPS/eip-7201), [OpenZeppelin upgrade guidance](https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable).

An activation identifies all coupled implementations, delegated modules, rule/policy configuration, required-index manifest/generation and storage/read profiles. Preserve stable Realm identity separately from execution revision. Registry or index proxies need their actual implementations and relevant configuration bound into the activation: their outer codehash is insufficient. SDK observations must verify actual deployment state, not trust a self-reported version getter alone. Unknown proxy/dependency forms remain explicitly unsupported.

Keep execution activation, applicable acceptance-policy commitments and append-only Type catalog revision distinct. Installing an unrelated immutable Type must not automatically require an administrator's whole-release activation or invalidate every user's signed plan. Version changes that affect an operation must invalidate it; unrelated catalog growth need not.

Prepare multi-transaction upgrades before activation. The final switch must install a coherent set atomically, or leave writes disabled through a declared transition. Record both block identity and admission frontier; two implementations can execute in one block. Test an old-version write, activation, and new-version write in the same block, then decode both independently. Also test stale signatures, unauthorized activation, initializer misuse, populated history, index coherence and failed activation rollback. Storage-layout validation alone does not establish semantic compatibility.

Exact-Type validators are separately versioned immutable artifacts by default. A developer may use stateful validation, but its dependency/basis model must explain what was checked at admission. `STATICCALL` prevents state changes during that call; it does not freeze other contracts' storage or guarantee the same answer years later. Admission-time validity, current game eligibility and portable re-verification are distinct claims. A proxy with a stable outer codehash cannot silently change an allegedly fixed predicate. [Proxy standards](https://eips.ethereum.org/EIPS/eip-1967), [diamond specification](https://eips.ethereum.org/EIPS/eip-2535).

### 4. Reads, writes and index evolution the public API must support

**Writes:** bounded native and signed ingress; exact action commitments; stable author distinct from payer/device key; nonce/retry semantics; transaction-time read preconditions; atomic batches; explicit stale/profile errors; canonical read-back identifiers. The SDK prepares recipes; a Solidity consumer must be able to use the same protocol without a hosted service or human signing step.

**Validation sequence:** validate against the preceding coherent prefix, apply one action, update required indexes, check execution/policy stability, then continue; perform mandatory final checks before success. The lab repaired a real bug where later validators saw stale indexes. Preserve a publication/administration lock, bounded callback gas and return data, and an exact final acknowledgement. Low-level call success is not enough.

**Read phases:** distinguish public committed-state reads from validation-time prefix reads. Later actions intentionally depend on earlier actions in one batch, so a blanket read lock would break useful custom validation. Conversely, provisional prefix coverage must not be presented to general callers as committed completion. Define the phase, publication/admission frontier, execution and index generation in the read contract; test malicious callback reentry and validation-prefix use separately.

Phase is explicit evidence, not inferred solely from `msg.sender`: validators can call other contracts. Raw reads may expose provisional state, but an API claiming committed completeness must check/report phase. Admission validation uses the explicitly defined coherent prefix.

**Reads:** retain exact Record/Type/body access and efficient known-key heads; bounded joined pages for folders/tags; ordered Lens selection and explicit masks/conflicts; basis and coverage alongside results; history and index-manifest discovery. Offer small Solidity-facing result structs and structured errors. Raw storage access may serve versioned efficient readers/proof adapters, but is not the only public API and does not become an unversioned storage promise.

Pagination measures candidates as well as visible rows. An empty filtered page can still be partial. Cursor domains include query, Lens, policy, execution/index profile and the appropriate data basis. Separate browser block-pinned traversal from contract continuation across transactions. The measured onchain cursor rejects any intervening Realm admission; do not advertise it as a busy-Realm feed. Prefer narrow scope revisions where proved, otherwise declare restart semantics. A global write counter must not accidentally invalidate every unrelated edit plan.

**Index replacement:** port the readiness-checked replacement path. Exclude unchecked `setIndexModule(address)` from production: both zero and unready nonzero replacements are forbidden. Use a separate atomic fresh-genesis initializer. Replacement must reproduce the declared target obligation manifest and state through a checked frontier, catch up, and switch atomically. Physical replacement with the same guarantees differs from semantic index evolution: the latter must preserve or explicitly authorize changes to required guarantees and create a new execution/profile commitment. An untrusted candidate saying “ready” is not evidence. Adding an index later requires an actual backfill/replay design, including withdrawal of data that predates declaration. Prove that a maximum supported old publication can be replayed under the new index budget, or define resumable internal replay that cannot expose half a publication as complete.

**Events and sync:** emit compact attributed publication/binding/activation notifications with useful filter topics and source ordinals. These support optional indexers and recent-change UX; folder membership alone is not a change feed. Required direct reads and replay must remain available from retained state. Logs, gateways and The Graph cannot be the only way to recover basic Files state. Do not emit a second full copy of every body merely for convenience.

**Concurrency/capacity:** review author nonces and device-key behavior under concurrent submissions; the two-device prototype proves sequential continuity, not collision-free simultaneous saves. Review integer widths against lifetime rate assumptions. A 32-bit revision at ten writes/second lasts about 13.6 years; a 16-bit policy counter changed hourly lasts about 7.5 years. Prefer at least 64-bit monotonic revisions/activation counters unless measured packing and declared limits justify less. Live occurrence counts and lifetime admissions are different quantities. Update ABI, indexes, packed decoders and recovery adapters together; retain saturation/rollback tests.

Joint resource limits belong in a supported-operation profile. Independently supported maxima for body size, actions, references, authors and filters do not establish that their combination fits. Include index callbacks, validation, calldata, return bytes and deployment/setup. AR/IPFS saves still pay for metadata and indexes; live contract-backed Files avoid duplicating already-maintained application values. Current local gas and dated fee models do not settle real target-chain costs.

### 5. Toolchain: a concrete choice to validate, not inherited habit

The earlier “Foundry-first” shorthand is withdrawn as a settled repo constraint. Both current candidates support Solidity testing, fuzzing, invariants and TypeScript integration paths. The choice should minimize the maintained code needed for **EFS's** debugging, release, upgrade and consumer workflows.

| Candidate | Strong reason for EFS | What must be demonstrated |
| --- | --- | --- |
| Hardhat 3 canonical build/release, TypeScript integration and Ignition deployment | One ecosystem for Solidity + TS workflows and a journaled deployment dependency graph; attractive for the cooperating module set | Exact production-build testing, plugin compatibility, populated upgrades, interruption recovery, custom artifact export and required authorization scenarios. |
| Foundry canonical build/release + ordinary TS SDK integration | Direct protocol testing/inspection, existing EFS operational experience, explicit scripts and fewer framework-specific integrations | Reliable deployment recovery/manifest generation without excessive bespoke code, exact-artifact TS tests, upgrade validation and dependency installation. |
| One canonical builder plus a narrowly scoped second test runner | A measured missing capability or independent executor check | No second release authority, floating compiler configuration, duplicated deployment definitions or unsupported equivalence claims. |

**Updated recommendation:** give Hardhat 3 + Ignition a serious first implementation of the release/deployment workflow. Its potential reduction in bespoke orchestration is a better reason than familiarity with either tool. Compare it with a minimal Foundry + TS path before recording the repo ADR. Use one primary tool unless the second supplies a named capability worth its upkeep. Do not require a hybrid merely to preserve the prototype's test syntax.

The SDK's proposed standalone Forge-tested Solidity source package does not require Contracts to adopt Forge. Public source and exact artifacts are the seam; test an external consumer with the other framework without giving it a second Core release pipeline.

Current documentation establishes the following; it does not measure our workflow:

- Hardhat 3 has built-in Solidity/fuzz tests and stateful invariant configuration, including replay/shrinking. Foundry is not uniquely necessary for invariants. [Hardhat tests](https://hardhat.org/docs/guides/testing/using-solidity), [configuration](https://hardhat.org/docs/reference/configuration), [Foundry invariants](https://getfoundry.sh/guides/invariant-testing.md).
- Ignition journals a deployment graph and reconciles interrupted/changed runs. Forge also supports resumption, with different simulation/nonce expectations. Neither removes EFS's own activation and SDK reconciliation rules. [Ignition reconciliation](https://hardhat.org/ignition/docs/explanations/reconciliation), [Forge script reference](https://getfoundry.sh/reference/forge/script).
- OpenZeppelin supports Hardhat 3 and Foundry. Foundry upgrade validation uses Node/FFI; it is not a wholly Node-free alternative. Ignition proxy construction does not itself perform all upgrade-safety validation. Make that check explicit. [Hardhat upgrades](https://docs.openzeppelin.com/upgrades-plugins/hardhat-upgrades), [Foundry upgrades](https://docs.openzeppelin.com/upgrades-plugins/foundry/foundry-upgrades).
- Hardhat's compatibility list excludes some Foundry broadcast/7702 cheatcodes. That is a test-porting cost, not proof that real 7702 transactions cannot be tested through TypeScript. Preserve the real account journey, and justify any specialist Forge lane with an actual gap. [Compatibility](https://hardhat.org/docs/reference/foundry-compatibility), [unsupported cheatcodes](https://hardhat.org/docs/reference/cheatcodes/unsupported-cheatcodes).
- OP simulation is useful but does not certify Base/Arbitrum/ZK execution, all predeploys, data fees, real RPC limits or wallet behavior. Pin a target execution profile and test actual deployment artifacts. [Hardhat OP support](https://hardhat.org/docs/reference/op-stack-support), [Foundry network configuration](https://getfoundry.sh/config/networks).

**Finite decision task for initialization:** use one representative slice and one shared Solidity invariant, an SDK signed write/read, a populated compatible/incompatible upgrade, a native caller, and interrupted deployment/receipt recovery. Check 7702 using an actual transaction path. Compare clean/incremental time, peak memory, debugging usefulness, required glue and deployment correctness. Match compiler inputs; explain differing bytecode rather than comparing different programs. Timebox initial setup to half a day; a blocker gets a concrete disposition rather than a new tournament. This comparison is proposed, not run in this planning pass.

Two observable acceptance cases matter: interrupt after submission but before local receipt recording, then recover without duplicate seed effects or losing deployment identity; and run acceptance against the exact canonical production artifacts. Matching settings alone is insufficient. Hardhat defaults most tasks to `default`, while Ignition defaults to `production`, which enables optimization and isolated builds. [Build profiles](https://hardhat.org/docs/guides/writing-contracts/build-profiles).

**Dated dependency evidence, not selected pins:** publisher metadata checked 2026-09-26 includes Hardhat 3.18.0, Ignition 3.1.8, OpenZeppelin Hardhat upgrades 4.1.0 and Foundry upgrades 0.4.2. Earlier Hardhat-3 upgrade-plugin alpha objections are stale. Conversely, Foundry upgrades 0.4.2 lists an alpha Defender CLI peer: inspect the chosen installation path rather than assuming every dependency of a stable package is stable or that Defender is required at runtime. Select only the ethers/viem/verification integrations actually used. [Hardhat upgrades package](https://registry.npmjs.org/@openzeppelin/hardhat-upgrades/4.1.0), [Foundry upgrades package](https://registry.npmjs.org/@openzeppelin/foundry-upgrades/0.4.2).

Pin exact tested tool versions, compiler long version, dependency revisions and one package lock; explicitly review prerelease dependencies. The lab's 0.8.30/Cancun/via-IR/200 runs/32 fuzz runs is evidence, not the production choice. Verify the compiler's known-bug list for the selected version/settings. Avoid nightly EVM/compiler features as an unspoken minimum. Final dependency versions belong in the tested initialization lock, not a perpetually “latest” design paragraph.

### 6. Small repo, deliberate dependency direction

```text
contracts-v2/
  src/
    interfaces/       # public calls, structs, errors and bounded result vocabulary
    core/             # Ledger state, execution and ingress
    types/            # descriptor/Type catalog and acceptance policy
    index/            # required index state, replay and activation
    readers/          # points, Lenses and bounded joined pages
    profiles/         # versioned application validators/definitions
    periphery/        # supported carrier, archive and proof adapters
  test/
    unit/ integration/ invariant/ upgrade/ recovery/ gas/
    fixtures/         # deterministic meaningful scenarios, not production imports
  examples/           # small Solidity application using only public exports
  script/             # selected deployment/upgrade modules or scripts
  tools/              # artifact packing, fixture lifecycle, compatibility checks
  schemas/            # release/deployment/fixture manifest schemas
  deployments/        # public, network-qualified deployment evidence
  docs/               # architecture, invariants, ADRs, runbooks and contributing
  .github/workflows/
  AGENTS.md
  README.md
  SECURITY.md
  LICENSE
  <one primary build configuration and pinned dependency lock>
```

Create folders when their first real module exists. Keep this one repository, not a monorepo of individually versioned internal modules. Published interfaces and artifact outputs can share one release initially. Do not add a general dependency-injection framework, deployment DSL of our own, universal plugin loader or agent database.

Imports flow from profiles/readers/periphery toward narrow interfaces and shared primitives. Kernel code does not import Files, Home or Arcade. Identity-bearing validators have a minimal versioned dependency closure; avoid broad `Interfaces.sol` files that pull unrelated implementation into their compiler metadata. Keep storage access private to named owners; forbid test/harness imports in shipped source. NatSpec documents caller meaning, bounds, revert/unknown behavior and visibility during a publication.

Contracts owns source ABIs/errors/events, low-level Solidity interfaces and release artifacts. SDK owns TypeScript runtime, operation recipes, transport/qualification, and generated application codecs/facades, including Solidity generation. Agree one owner for each generated file; consumers never hand-edit or independently regenerate conflicting ABIs. Native write helpers execute in the consuming application's context. Deployed reader helpers are easier to share, but still need exact version/configuration checks.

Avoid a generation cycle: compiling Core and producing its low-level release cannot depend on an unreleased SDK facade that itself waits for that release. Contract profile builds use source definitions or an explicitly pinned generator/input closure. SDK consumer generation follows those released inputs; the integration tuple joins the outputs afterward.

### 7. Build identity is part of EFS correctness

The prototype suffered real metadata-driven Type identity drift, and an old archive adapter rejected the final clean wrapper build. Retain and reuse released Type artifacts exactly; a semantically equivalent rebuild is not automatically the same Type. [Solidity's metadata documentation](https://docs.soliditylang.org/en/latest/metadata.html) explains why even source paths and whitespace can change bytecode. Isolating compilation units limits accidental coupling; it does not permit rewriting historical hashes.

Publish one content-addressed release bundle with a simple schema and file manifest, independently downloadable from the package registry:

| Artifact | Required contents |
| --- | --- |
| Build record | Source revision, actual source closure and import names, compiler binary identity, Standard JSON inputs/output, settings/remappings/dependency pins, explicit metadata settings. |
| Contract artifacts | ABI including errors/events, NatSpec, creation/runtime templates, link and immutable references, storage layout, sizes and hashes. |
| Supported profiles | Exact Type/rule/index/result identities, required obligations, limits, dependency graph, feature/unsupported combinations, compatibility vectors and recovery-adapter matrix. |
| Consumer package | Narrow Solidity source/dependencies and artifact exports; SDK codegen consumes these without a Hardhat runtime dependency. |
| Fixture package | Distributable pinned deploy/verify tool and deployable artifact closure, deterministic seed version, expected outputs and local resource limits. A client-only checkout can use it without building contracts source. |

Define which files are hashed so the release digest is not circular. A bundle may contain several separately retained historical Type artifacts built with their original compiler settings; their lineage must be explicit. One canonical release producer does not mean rebuilding old meaning with today's compiler.

**Deployment manifests are separate observations.** Include chain ID and Realm identity, instance/generation identity for local resets, actual addresses/runtime hashes, linking/constructor/initializer data, transaction and block hashes, actual proxy implementations/admins, coupled activation revision and index frontier. A code template is not an instantiated runtime; same ABI is not same semantics; same local chain ID is not the same Anvil history. RPC/gateway URLs are replaceable hints, never authority or embedded secrets.

Export an allowlisted public deployment manifest, not raw runner journals/configuration; keep credentials, unpublished signatures and private local actors out of releases. Before authorizing a write, discovery must reject a wrong chain/Realm, stale local generation, unexpected implementation/configuration or unknown required profile with a clear diagnostic. A manifest supplies claims to verify, not an authoritative directory.

For SDK/client integration, pin a tuple of contracts release digest, deployment/profile, SDK packed artifact digest, client build and fixture version. Ordinary CI uses published or locally packed immutable candidates. No floating sibling branches or symlink-only tests. An optional local source override must report its source/dirt/digest so it cannot masquerade as a released fixture.

The first release rehearsal must decode and recover records from that exact build using retained definitions and an independent minimal verifier. Distinguish original authorship, source admission, foreign finality and destination authorization. Old successful recovery reports do not automatically cover new storage/module/profile layouts.

### 8. Tests and GitHub: a few strong checks at the right stage

| Stage | Checks that earn their cost |
| --- | --- |
| Every code PR | Pinned clean build, formatting, focused unit/vectors, ABI/error/event and storage diff, runtime/initcode size, no generated drift. Review warnings rather than globally hiding them. |
| Changed semantics | Admission/index atomicity; stateful prefix/final validation; native caller and signature replay; qualification/absence; stale plans and actual counterexamples. Stateful fuzz handlers model valid operations so campaigns cannot pass by reverting almost everything. Save seeds/minimized failures. |
| Changed upgrades/index layout | Populated old-release upgrade, initialization/authority failures, stale intents, old Type interpretation, index replay/cutover and proof/decoder compatibility. |
| Candidate release | Rebuild identity-bearing outputs from a fresh retained closure; test actual deployed proxy/module bytes; fresh external Solidity and packed SDK consumers; static-client journey. |
| Network/release validation | Actual wallet/provider/fees, measured cold and warm operations, independent export/recovery, browser resource behavior. Broader campaigns run for changed risks, not on every documentation edit. |

Keep a small executable model/oracle independent from the production encoder for identity, Lens and index semantics. A Solidity round-trip through the same buggy encoder/decoder does not prove interoperability. Prioritize examples that already found defects: missing final acknowledgement, historical slot false absence, stale index prefix, tag scope mismatch, decoded-once versus duplicate large joins, nonce/reorg recovery and old adapter/build mismatch.

Test the **release compilation/deployment path**, not only an instrumented or development build. Current OpenZeppelin Hardhat guidance notes that Solidity-test and plugin-deployed proxies can come from different source/precompiled artifacts. Inspect the actual selected runtime; do not assume a familiar proxy name means byte equivalence.

A second clean build checks reproducibility; publication and deployment promote the already-tested candidate bytes without rebuilding. Record deployment-specific linking and immutable instantiation separately. A clean client-only checkout must launch and verify the published fixture using its documented node prerequisites, without a contracts compiler or sibling SDK source.

Gas checks cover complete cold/warm create, AR/IPFS reference registration, edit, tag, move, multi-edit save, small contract reads, index replay and upgrade. Report calldata/setup/extra transactions and the required-index profile. Keep initial relative regression budgets separate from the target chain's transaction limit and real L1 data/operator fees. A faster test runner changes iteration cost, not EFS protocol gas by itself.

Use protected main with required checks and short feature branches; one human maintainer must still be able to contribute without an impossible self-approval rule. AI reviews are useful evidence, not fictitious independent human approval. Critical storage/authority/encoding changes need the named review; ordinary changes do not need a huge questionnaire.

Pin Actions and dependencies; untrusted PR code gets no release credentials. Keep build/test separate from explicitly authorized publication/deployment. Review dependency updates that change compiler, code identities or proxy bytes as compatibility changes. Publish source/metadata and verification inputs so an explorer is optional. Artifact attestations can strengthen provenance, but do not prove correctness and cannot be the only retained build evidence. Add a concise security contact and preserve license/notice obligations for vendored code. [GitHub secure workflows](https://docs.github.com/en/actions/reference/security/secure-use), [artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations).

### 9. Local development and autonomous agents

Provide a short setup followed by ordinary `check`, focused `test`, `build-release`, `fixture deploy`, `fixture verify` and `doctor/status --json` commands; exact names follow the selected tool. No public fork, paid RPC key or Docker is required for the basic local path. Fault/fork/fee checks are separate profiles.

Contracts owns the deploy/seed artifact and chain-fixture semantics; SDK owns manifest validation; client owns its launch supervisor. All consume the same fixture schema. Allocate isolated runs by default and support explicit attachment to one shared chain for Alice/Bob/phone testing. Record run ID, chain generation, ports, process ownership and artifact digests. UI restarts preserve the chain. Teardown stops owned processes only; traces/history/logs have bounded retention. This carries the lessons from the Anvil disk incident and MetaMask stale-network/funding confusion directly into the production workflow.

Keep harness-neutral `AGENTS.md` short: role map, commands, state ownership, protocol invariants, source links and process cleanup. One task names the interface it changes, the counterexample/acceptance it must satisfy, and the exact artifacts reviewed. Give agents isolated worktrees and non-overlapping source ownership. Interface changes come back through the integrator before two workers independently invent different ABIs. Share a compact result with source/test/measurement/limitations; do not invent another coordination service.

### 10. Build sequence and stop conditions

The [[prototype-delivery-checklist|existing M1–M6 checklist]] remains the task tracker. This sequence refines M1/M2 handoff; it is not a second completion ledger.

1. **Initialization decision packet.** Claude first proposes the toolchain, storage/module sketch, release/fixture manifest schema, consumer interfaces, target testnet execution profile and executable acceptance specification. After review and implementation authorization, run the bounded comparison and populated upgrade/deployment slice before declaring the architecture fit. The planning deliverable does not require creating production repositories. No new general prototype tournament.
2. **Native typed vertical.** Register a described Type, call custom validation, publish from an ordinary Solidity application, update required indexes and read back by exact key. Reject an invalid body, preserve actual application authorship and price the full path. This isolates EFS's world-computer value before wallet/UI complexity.
3. **Files vertical shared with SDK/client.** Folder + AR/IPFS reference + small inline File, signed save, guest static read, second author and ordered fallback, tags/filtering and stale atomic move. Use packed artifacts from each repo and test missing/corrupt carrier bytes. Every successful write is independently read back.
4. **Continuity before breadth.** Populated module upgrade, caught-up index replacement, old/new SDK compatibility, concurrent device submissions/revocation, rejected old plans, exact-build cold recovery. Keep decoding available without a current package registry or the original team.
5. **Measured user release.** Names/Concept/public profiles, full Files acceptance, scoped Lists/home, actual wallet/paid-storage integration, target-chain receipt fees and public-RPC/browser memory. Drive/Arcade reuse the same public surface; they do not reopen kernel nouns by default.

Stop an affected implementation decision if a full supported operation exceeds the real target transaction envelope, required indexing can be bypassed, decomposition changes caller authority, historical meaning changes silently, or a module set cannot activate coherently. Surface the concrete tradeoff to the owner. Normal optimizations, module extraction and versioned adapters are engineer decisions; removing a required capability is not.

### 11. What was easy to miss

| Finding from this pass | Consequence for the initial repo |
| --- | --- |
| Validator caller context is as important as native author context | Decompose with explicit call graphs and native/custom-validator tests, not only matching function selectors. |
| Lab `setIndexModule` deliberately permits disabling required indexes | Keep this in test harnesses only; supported release activation goes through readiness checks. |
| Registry/index proxies can change logic without changing outer codehash | Release discovery and signed execution identity must account for implementation/configuration history. |
| Current raw index readers know physical Ledger roots | Version storage readers/proof adapters before namespacing or repartitioning state. |
| Stateful validators need coherent same-batch reads | Define validation-prefix visibility separately from committed public reads. |
| More expensive future indexes may fail to replay old maximum-size publications | Bound replay work and coverage before promising configurable later indexes. |
| Small counters can expire within the product horizon | Review rate assumptions and all packed consumers before finalizing storage. |
| Compiler metadata already broke cross-build identity assumptions | Isolate Type build closures and retain immutable artifacts with explicit adapter support. |
| Separate SDK/client repos can pass against different contract bytes | Pack and pin one integration tuple; execute the actual release artifacts. |
| A folder inventory is not a sync/change feed | Name the minimum events/frontier contract now without adding a permanent expensive feed by accident. |

### 12. Evidence and reconciliation map

- [[../../Reviews/2026-09-24-prototype-delivery/README]] and [[prototype-delivery-checklist]]: latest outcomes and remaining product work. Location tags are now demonstrated; older September 14/16 paragraphs saying they are absent are historical.
- [[../../Reviews/2026-09-12-efs-path-decision/compact-mvp-build-plan-20260914]]: recommended compact direction, source-layout/identity lesson and wider-counter requirement. Older runtime headroom and task instructions are dated, not current dispatches.
- [[../../Reviews/2026-09-12-efs-path-decision/core-closeout-results-20260915]], [[../../Reviews/2026-09-12-efs-path-decision/core-closeout-final-review-20260916]] and [[../../Reviews/2026-09-12-efs-path-decision/core-closeout-engineering-choices-20260916]]: ordered validation, complete index obligations, replay, scope/profile costs, artifact mismatch and supported proof boundaries.
- [[testnet-files-mvp-plan]]: Transparent/UUPS/diamond alternatives and populated upgrade requirements. Its initial browser status predates the compact Files results.
- [[../sdkv2/architecture-candidate]]: separate protocol/Type/query/deployment/generator/package versions; [[../sdkv2/repository-and-distribution-plan]]: independently consumable TS/Solidity packages and native/agent boundaries; [[../web-client-os/client-repository-and-development]]: current static-client, packed-artifact and concurrent-devnet proposal. The September 26 SDK proposal was reconciled at planning `abf760159e3a4a8781ffab16f124c34926c1eb4b` after this review started.
- Prototype source at the pinned commit: `src/Ledger.sol` (`_run`, `_accept`, `_currentExecution`, `setIndexModule`, `replaceIndexWhenReady`); `src/TypeRegistry.sol`; `src/DescribedTypeProfile.sol`; `src/IndexSource.sol`; `src/IndexReplaySource.sol`; `test/UpgradeProxy.sol`. These are experiment implementation details to analyze, not a selected public ABI.

## Open questions

These are concrete engineering tasks for the initialization plan, not a request for another owner questionnaire.

- [ ] Select one primary toolchain from the bounded representative comparison; record tested package/compiler versions and any justified specialist runner.
- [ ] Demonstrate the standard-proxy/fixed-module partition with size and complete-operation gas; choose diamond only if the measured alternative merits it.
- [ ] Specify activation/initialization and committed-versus-validation read phases across the exact chosen module set.
- [ ] Select storage widths, required index replay envelope, release manifest schema and public consumer/result interface together with SDK review.
- [ ] Carry public naming/Concept/profile scope and remaining authority/privacy/portability support choices through M3/F2/F3; no waiver is implied here.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [x] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [x] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

This is an architecture/repository proposal for Claude's reviewable initialization plan. No dependencies were installed, no product code changed, no new repository was created, and the owner's running prototype was not restarted by this research pass. The toolchain comparison and module-fit checks remain unexecuted. The project's existing promotion and deployment authority rules still apply.
