# EFS v2 prototype-to-MVP implementation plan

> **For agentic workers:** use `superpowers:subagent-driven-development` for an authorized implementation packet, or `superpowers:executing-plans` for inline execution. Read the packet's source design and applicable repository instructions. The living checkboxes and task states are in [[prototype-delivery-checklist]]; update that document, not a duplicate status list here.

**Goal:** turn the demonstrated compact Files prototype into an understandable, affordable, contract-usable MVP without losing the data-model properties that justify EFS.
**Architecture:** compact Ledger, separate mandatory indexes, bounded readers/Lenses, exact Type/application profiles, a qualified SDK and static Files SPA. Probes challenge specific seams; they do not reopen three competing product architectures.
**Tech stack:** current lab uses Solidity 0.8.30, Cancun, via-IR, optimizer 200, Foundry/Anvil, Node 24+, ethers 6.15.0 and Vite 8.3.0. These are the reproduction baseline, not a permanent toolchain choice. Real SDK implementation is TypeScript with contract-facing Solidity helpers; no v1 implementation copying.
**Spec:** [[system-constitution]], [[owner-rulings]], [[hierarchical-files-and-folders]], [[mountable-filesystem-semantics]], [[testnet-files-mvp-plan]], and [[../../Reviews/2026-09-12-efs-path-decision/compact-mvp-build-plan-20260914|current build recommendation]]. New proposed workload targets below are explicitly experimental.
**Status:** reference — rolling implementation instructions; new environments and public release remain gated

#status/reference #kind/task #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2

## Intent and alternatives

James wants a filesystem for users **and contracts**: portable attributed data; composable validated Types; compatible evolution; shared files/tags/Lenses; direct static access; reasonable total cost; future OS-drive/app use. He wants visible progress and autonomous bounded execution, not more context-heavy coordination, unlimited tests or another management platform.

Three routes were considered. Continuing to polish the whole disposable browser duplicates production effort. Starting a rewrite without carrying over evidence risks losing the semantics already earned. **Recommended: start the real upgradeable vertical after environment approval, using the lab as a reference and four explicit discriminators.** A discriminator is a small experiment whose failure could change an interface or supported workload. M1's design can proceed while P1–P4 run; affected interfaces stay provisional until their probe results are incorporated.

This is a program-level implementation plan. P1–P4 are dispatchable experiment packets with paths, inputs and exit tests. M1–M6 are dependent implementation briefs: before a worker edits a new repository, the integrator expands that brief into one reviewed file-level plan against the actual selected interface. This avoids inventing permanent ABI signatures before the relevant experiment. Each package must produce working behavior, not just another plan.

## Global constraints

- Ordinary planning documents stay on `planning/main`; existing prototype code/workspaces stay put. No incidental branch consolidation or lab migration.
- Mandatory developer validation before acceptance and required indexing remain. Failed acceptance/indexing must roll back the whole operation, including an enclosing application transaction.
- Exact Type/Record/rule identity, original attribution and current binding selection are distinct. Live contract values are not immutable retained bytes.
- A read includes its basis and qualification. `UNKNOWN`, `PARTIAL`, `CONFLICT`, unavailable bytes and opaque private data must not become absence or a successful write.
- Testnet contracts must be upgradeable. Tests must exercise populated state, old data and stale signed plans, not only fresh deployment.
- Public Names and Commons Concepts follow their owning designs/rulings. No private prototype namespace may quietly become the public standard.
- Static SPA: no application-server dependency. Vite is development tooling. Keep dark mode, no native alert/confirm/prompt dialogs, no focus stealing, and no wallet interaction without the user's own action.
- No paid upload, public transaction, secret use, irreversible deployment, permanent IDs or production publication without appropriate owner authorization. Development test-chain actions are not public-chain evidence.
- No automatic Fable/Claude dispatch. Respect James's inference allocation. Existing native three-host and portability requirements survive proposed MVP sequencing.

## Review focus

These five failure classes must be included in their owning packet, rather than left to a generic final audit:

1. A filtered empty page with more candidates, an unavailable gateway or encrypted mount must not claim nothing exists — P3/P4/M2.
2. A stale plan, changed account/network, lost receipt or failed index callback must not duplicate a write or leave half a save — M1/M2/M4.
3. Replacing or moving a file must not silently move somebody's content testimony to a different subject — P2/M3.
4. A harmless build change or authorized upgrade must not make yesterday's exported Types unreadable or reinterpret their authority — M1/M2/M6.
5. A List that passes client checks but violates duplicate, capacity, type or append-only rules must be refused onchain, including within one batch — P1/M3.

## Workspace and evidence map

From the EFS workspace, the current lab root is `planning-warroom-b-run/Reviews/2026-09-12-efs-path-decision/lab-b/`. In packet file lists below, paths are relative to that lab root unless explicitly prefixed `planning/` or a future repo name. Check its revision against the living tracker before editing. Do not replace another worker's checkout because it differs.

| Component | Existing anchors |
| --- | --- |
| Kernel, required indexing and Type acceptance | `src/Ledger.sol`, `src/IndexModule.sol`, `src/TypeRegistry.sol`, `src/DescribedTypeProfile.sol` |
| Bounded Files reads and contract consumers | `test/FilesApplication.t.sol`, `test/FilesPageReader.t.sol`, `test/FilesQueryOrigin.t.sol`, `test/LiveFiles.t.sol` |
| Upgrade, authority and custom predicate controls | `test/FoundationUpgrade.t.sol`, `test/Guarded1271.t.sol`, `test/CoreOrderedAcceptance.t.sol`, `test/DescribedTypeProfile.t.sol` |
| SDK, workflow and transport | `browser/compact-sdk.mjs`, `browser/files-workflows.mjs`, `browser/compact-transport.integration.test.mjs` |
| Actual Files/carrier/stance examples | `browser/files-workflows.integration.test.mjs`, `browser/exact-stance.integration.test.mjs`, `browser/external-content.test.mjs` |
| Recovery and independent meaning | `browser/described-type-archive.mjs`, `browser/described-type-reader.test.mjs`, `test/GuardedRecovery.t.sol` |
| Reproduction and owned demo lifecycle | `browser/README.md`, `package.json`, `foundry.toml`, `script/workbench-chain.mjs` |

Use the September 17 Files report for recent action measurements; the September 15/16 Core reports retain deeper experiments. Do not combine numbers from different builds, guarantees or fee snapshots into an imaginary single benchmark.

## P1 — Curated Lists and v1 semantic parity

**Purpose:** prove a useful non-Files collection fits without adding a `LIST` primitive to the kernel, and enumerate v1 features rather than assuming file CRUD equals parity.
**Lead:** contract/profile implementer, Astra High; v2 PM integrates; an independent Astra High reader checks invariant enforcement.
**Files:** read `test/FilesApplication.t.sol`, `test/CoreOrderedAcceptance.t.sol`, `src/IndexModule.sol`; read v1 `contracts/specs/06-Lists-and-Collections.md` and `contracts/specs/overview.md` as behavior only. Proposed new lab files: `test/CollectionProfile.sol`, `test/CollectionProfile.t.sol`, `script/probe-collections.mjs`. Result: `planning/Reviews/2026-09-24-prototype-delivery/p1-collections.md`.
**Consumes:** existing exact Types, typed references, author-qualified Bindings, required indexes and admission prefix. **Produces:** disposable collection Type/validator descriptors plus a contract-readable collection fixture; no permanent List ABI.

Sequence:

1. Write a small parity table: Files operations; mirror alternatives; metadata/properties; redirects; Lists. Give every v1 behavior an existing v2 equivalent, a concrete gap, or an explicit semantic difference. No EAS carrier/code reuse.
2. Use ordinary records for a collection and stable entry identity. Include curator-qualified membership, target references and mutable entry order/label facts. Choose the smallest exact type set that enforces the rules; explain its keys in the result before implementing it.
3. Add failing scenarios: wrong target Type, duplicate target when forbidden, capacity exceeded, non-curator mutation, append-only removal/replacement, and two same-batch insertions that jointly break a rule. Reordering/renaming must preserve entry identity and labels. A late failure leaves no partial membership or index effects.
4. Implement only the profile/reader needed to pass. Alice curates photos; Bob has an independently attributed edition. A third-party contract reads exact membership and a selected target without scanning the Realm.
5. Measure cold first creation, reused-Type insertion, reorder, removal and contract membership reads with all required indexes. Capture receipt gas, setup costs separately, and bounded-pagination behavior.
6. Report whether generic Core suffices. If it does not, show the minimal failing sequence and proposed generic operation; do not sneak an application-specific noun into Core. One focused review, fix consequential findings, then close or record the blocker.

Focused checks, after the proposed files exist:

```sh
forge test --offline --match-path test/CollectionProfile.t.sol -vv
node script/probe-collections.mjs
```

The runner must own a disposable local chain and stop it. Success is enforced rules + useful contract reads + measured cost, not merely serializable List data. P1 may finish before a polished playlist UI exists.

## P2 — Public names, shared Concepts, tag subjects and personal homes

**Purpose:** avoid building apps around prototype-only ASCII names or incompatible tag identities; make personal-home discovery a small profile instead of a kernel redesign.
**Lead:** profile/SDK implementer, Astra High; Extra High only for a demonstrated normalization/validation architecture problem.
**Files:** read `test/FilesNamesProfile.sol`, `test/TagStanceProfile.sol`, `test/FilesNames.t.sol`, `browser/compact-paths.test.mjs`, `browser/exact-stance.integration.test.mjs`. Proposed fixtures: `browser/public-profile-vectors.test.mjs`, `test/PublicProfileVectors.t.sol`. Result: `planning/Reviews/2026-09-24-prototype-delivery/p2-public-profiles.md`.
**Consumes:** current exact identities and owner tag rulings. **Produces:** versioned example vectors, proposed exact profile boundaries and home/query semantics; permanent normalization bytes remain unselected until reviewed.

Sequence:

1. Specify one pinned normalization profile for the experiment. Include composed/decomposed accents, non-Latin names, emoji, case differences, slash/control rejection and byte-length boundaries. Distinguish Files names from the Commons Concept rule `NFC → lowercase → space→underscore`.
2. Compare browser and Solidity acceptance/identity for the same vectors. Client-only cleanup is not onchain validation. Price the necessary validator/helper and pin any Unicode version/data dependency; reject unsupported input explicitly rather than normalizing inconsistently.
3. Trace `/docs/efs.doc`: a location tag remains on that placement when the occupant changes; a File tag follows the same File across names; a revision tag remains on the exact revision. Show both Lens orders and a conflicting revision. Directory tags do not silently mean all descendants are tagged.
4. Define ordinary profile/home records and an author-qualified current-home binding. Address/Principal access works without ENS. ENS is a replaceable discovery adapter; repointing a name must not rewrite historical citations.
5. Define “files I authored” over one named Realm/basis: identify the exact author index and filtering/deduplication needed to show files rather than all internal/revision records. Distinguish that inventory from files visible in the published home and from all-chain discovery.
6. Produce a small interface packet for M3, including a profile example referencing a photo/AR biography and a scoped authored-files query. Any need for a new index or costly onchain Unicode behavior becomes an explicit measured finding.

Focused checks after fixtures exist:

```sh
node --test browser/public-profile-vectors.test.mjs
forge test --offline --match-path test/PublicProfileVectors.t.sol -vv
```

Do not make a full ENS integration or website builder a prerequisite to this probe. Do not invent a global cross-chain completeness claim.

## P3 — Shared-gallery and contract economics envelope

**Purpose:** answer “will normal people and contracts use this comfortably?” with a whole workflow, not scary isolated gas numbers or hidden setup exclusions.
**Lead:** performance/integration implementer, Astra High; sole benchmark runtime owner.
**Files:** extend examples from `browser/files-workflows.integration.test.mjs`, `browser/exact-stance.integration.test.mjs`, `test/FilesQueryOrigin.t.sol`, `test/FilesRetainedQuery.t.sol`; inspect `script/measure-joined.mjs` before reusing any setup. Proposed bounded runner: `script/probe-shared-gallery.mjs`. Result: `planning/Reviews/2026-09-24-prototype-delivery/p3-gallery-envelope.md` and small JSON summaries in the lab.
**Consumes:** existing Files/Concept profiles initially; repeat only affected cells after P1/P2. **Produces:** a workload/cost table and explicit supported recipe, not a new maximum embedded in the protocol.

Sequence:

1. Seed one shared directory with Alice, Bob and Carol, distinct files and conflicting names. Use one exact shared tag concept. Exercise both Lens orders, ASSERT/DENY/SILENT, copy/link, edit, move, mask and release. Cold restart the reader; no browser-local filename truth.
2. Measure 100 and 1,000 live entries with 1 and 8 included authors; reuse retained 10,000-lifetime-name evidence and rerun that cell only if relevant inventory logic changed. Include low-selectivity filters and unavailable/opaque rows. Page budget counts candidates, not matches.
3. Measure a paid contract point/path read, membership check and small continued query. A 64-author stress case is diagnostic, not the ordinary-user target. Verify unrelated writes do not prevent progress and relevant changes do not silently reuse a cursor.
4. Price complete create/register/edit/tag/rebind recipes: cold setup versus reuse; required indexes; byte storage; validation; signatures; execution; L1 posting/operator fees and AR storage separately. Use small inline files plus external descriptors for 1 KiB/1 MiB/16 MiB payload cases. Payload retrieval work grows with size even when registration does not.
5. Before public deployment, label L1/Base/Arbitrum dollar values as dated models. After permission, M5 measures actual target execution and provider behavior. Do not send private transaction payloads to a fee oracle; use explicitly public fixtures.
6. Produce one pass/optimize/impractical/unsupported finding per recipe. If normal shared-gallery operations require near-block-limit transactions, silently incomplete listings, or repeated full-Realm scans, stop calling that recipe viable and propose the smallest repair.

Proposed **investigation tripwires**, not owner-approved fees or permanent limits: ordinary 1–8-author mutation exceeding 5M gas; narrow paid point/membership read exceeding 1M; one paid continuation exceeding 3M; first 32-candidate folder page exceeding 25 HTTP requests; representative ordinary-provider first-page delay exceeding 5 seconds. Crossing one triggers analysis, not automatic scope reduction. Any supported operation failing the target network's actual transaction/block limits is a hard failure.

```sh
node script/probe-shared-gallery.mjs
forge test --offline --match-path test/FilesQueryOrigin.t.sol -vv
```

Retain first-page/full-traversal RPC counts, bytes, elapsed time, relevant gas limits and all failed receipts. Never “fix” a benchmark by raising the cap, dropping an index or hiding an uncertain row. Use a small run before seeding the full matrix.

## P4 — Independent contract and OS-drive projection

**Purpose:** demonstrate the same data is useful beyond our own browser without prematurely building three native drivers.
**Lead:** SDK/contract integration implementer, Astra High; native-filesystem PM consulted only for an actual semantic disagreement.
**Files:** use `test/FilesApplication.t.sol`, `test/LiveFiles.t.sol`, `test/FilesPageReader.t.sol`, `browser/compact-sdk.mjs`, `browser/files-workflows.mjs` and [[mountable-filesystem-semantics]]. Proposed fixtures: `browser/drive-projection.test.mjs`, `test/ExternalFilesystemConsumer.t.sol`. Result: `planning/Reviews/2026-09-24-prototype-delivery/p4-independent-consumers.md`.
**Consumes:** exact reader/basis semantics and existing external-contract examples; P1/P2 outputs for the final integrated examples. **Produces:** headless drive projection and consumer conformance traces; not a shipped Linux/macOS/Windows mount.

Sequence:

1. Build a small consumer from public interfaces rather than copying the browser's selection logic. Read a typed record/path, enforce a predicate and publish under the calling contract's authority. Wrong revision, stale basis and failed required index must revert the whole app action.
2. Compare the SDK tree with an independently assembled headless drive projection of a pinned fixture: ordered conflicts, aliases, masks, moved directories, partial pages, unavailable external bytes and an encrypted/opaque node. Compare stable IDs, names, bytes and error meanings.
3. Exercise open/range/copy-out and a simulated editor save: stage temporary bytes locally, publish one complete revision/placement change, simulate a crash before/after submission, and recover without duplicate publication. State exactly when local durability differs from chain acceptance.
4. Reuse the live-contract value fixture: a path exposes changing provider state; an explicit snapshot becomes retained data. Provider upgrade/failure is not a new immutable file version unless explicitly published.
5. Record which native semantics need adapter behavior and which truly require a contract change. UNKNOWN must not become `ENOENT`; no OS feature may require a chain transaction for each tiny buffer write.

```sh
node --test browser/drive-projection.test.mjs
forge test --offline --match-path test/ExternalFilesystemConsumer.t.sol -vv
```

A pure projection cannot close F1. Actual host mounts, permission behavior, fsync/rename and crash tests remain separately named work.

## Real implementation briefs — expand only when their interfaces are ready

G0 supplies the work environment. The following paths describe proposed responsibilities inside the temporary real repositories, not repositories created by this plan. The implementer must pin the actual repository/configuration before turning a brief into executable steps. Each brief gets a small consumer-visible slice before broad scaffolding.

### M1 — Contract foundation and release artifacts

Design `contracts-v2/src/core/`, `src/index/`, `src/readers/`, `src/profiles/` and `src/interfaces/` around tested semantics. Split the near-limit Ledger without importing the disposable proxy as production security. Select and document testnet upgrade administration; wider counters must propagate through storage, ABI, proofs, guards and decoders. Keep required indexing atomic and custom validation mandatory; permissionless Type declarations must not become a deployment-team registry.

Carry over the behavior of `FoundationUpgrade`, `CoreOrderedAcceptance`, `Guarded1271`, `IdentityTransition`, `RecordOccurrenceBounds` and described-Type tests. Include an independent developer's new Type, linked composition, compatible extension, malformed/bypass attempts, late-batch failures and account/controller changes. Current approval cannot rewrite historical authorship. Separate pure/read-only acceptance predicates from a state-changing application operation.

Exit: modules deploy under ordinary runtime/initcode limits with documented growth room; populated Files/index/history state survives upgrades; stale signatures/cursors fail; storage layout is reviewed; exact build manifests and validator/Type identity dependencies are reproducible. A clean-slate engineer reviews boundaries before the implementation grows. P1/P2 may change profiles without reopening the entire system; any P3/P4 contract-facing blocker must also be resolved before that interface settles, not dismissed as client integration work.

### M2 — SDK, transport, authority and recovery

Implement `sdk-v2/src/` around prepare → authorize → submit → reconcile and one qualified read model. Result types make inspecting a value without its coverage/basis difficult; ordinary application code must not assemble the lab's internal rows. Include JS/browser and Solidity consumer examples, EOA and selected deployed ERC-1271 profiles, bounded caching/batching, account/network changes and lost receipts.

Implement versioned archive adapters for **M1's exact build**, not just the historical wrapper supported by the lab. Stop the source, independently reconstruct bytes/Types/original evidence, restore only under valid destination authority and continue allowed writes. Preserve distinctions among exported attribution evidence, local-chain observation and authenticated foreign state. Unknown rule/build profiles stay unsupported. An upgradeable-source proof limitation must be shown to James before a launch portability claim.

Exit: the same facade drives a static guest reader, a wallet mutation, a third-party contract example and a source-off reconstruction; replay/receipt loss does not duplicate state. No mandatory app backend or Commons service.

### M3 — Public application profiles and v1 parity

Implement the P1/P2 outcomes as versioned application profiles, not extra kernel nouns. Includes public Names/Concepts, File/revision/location tags, Lists with onchain rules, metadata and mirror/redirect equivalents from the parity casebook, home/profile binding and scoped authored-file discovery. Keep stable identity versus slot behavior explicit.

Exit: the v1 casebook has demonstrated equivalents or owner-approved differences; a user can publish a home containing files and a curated collection, a second user can contribute under a Lens, and raw-identity access survives ENS/service failure. No requirement is marked done merely because it can be encoded in a generic record.

### M4 — Static Files, normal wallets and durable carriers

Build the narrow Files interface in `client-v2/` over M2, in cooperation with Web Client/OS and Data Explorer roles. This is not permission to implement the full OS. Complete an AR upload adapter with quote/payment boundaries and retry-safe registration; include existing public IPFS references without requiring pinning-account setup. IPFS upload/pinning remains optional unless separately selected. Do not pretend temporary local raw storage is durable.

Exit: an ordinary wallet saves an inline file and registers/uploads durable external content, then a clean static guest reads it without Vite. Wrong network, insufficient gas, rejected authorization, paid-upload success followed by registration failure, gateway loss and reload are recoverable. Display actual approval count; one-signature local sponsorship is not a production relayer. Paid execution requires explicit permission and public non-sensitive fixtures.

### M5 — Network and contract performance acceptance

Deploy only to the authorized test environment. Run P3 recipes through ordinary public providers, with a fresh guest and the independent contract consumer. Observe actual testnet receipts; separately model L1/Base/Arbitrum production fees from fresh source-linked network data. Do not call testnet execution a mainnet dollar bill or mechanically price a different VM as EVM gas.

Exit: supported scale/read/write envelopes, all-in fee components, failure/retry behavior and actual public-provider latency are documented. If a normal recipe fails, optimize the identified bottleneck and rerun that recipe; no wide benchmark campaign without a new question. Product copy and SDK defaults must reflect measured bounds.

### M6 — Joined release and owner acceptance

Pin one contracts deployment manifest, one SDK release and one static build. Perform the three-user gallery + List + personal-home workflow, then upgrade populated contracts, revisit old citations, retry an interrupted write and cold-recover an exported slice. An independent reviewer checks the integrated boundaries, not every historical test again.

Exit: James can use the browser with his own wallet, follow the same short walkthrough and see costs and outcomes; the release has startup/deployment/recovery instructions and an explicit limitations page. His actual wallet actions are not replaced by a simulated provider and called equivalent. Before public release, surface deferred privacy/native/proof features and any unmet original requirement for approval.

## Autonomous execution protocol

This is an EFS-local working agreement, not a new harness or replacement for repository authority.

1. **Resume from artifacts, not the whole chat.** Read the living checklist, current packet, its source design and last relevant result. Check revision/dirty state and active ownership. Do not rediscover all EFS research.
2. **Pick the next ready outcome.** Fix a regression blocking the current release first; then close the earliest unresolved interface discriminator; otherwise follow the dependency list. Do not ask James to choose between routine engineering steps.
3. **Give each worker a small contract:** task ID, base revision/workspace, writable files, read-only dependencies, observable exit checks, forbidden changes, runtime ownership, model/effort and bounded stopping condition. Workers cannot delegate further without the coordinator's approval.
4. **Work and integrate.** Add the smallest failing control that exposes the risk, implement, run focused checks and a representative real-chain/consumer journey. For dangerous authority/storage/index changes, use an independent reviewer; fix consequential findings and review the fix. Do not commission a fresh full audit after every minor change.
5. **Update durable state.** One result names commit/build, commands, actual outcome, cost/limits and remaining issue. The integrator checks the evidence and updates the checklist, next dispatch and release manifest. “Agent says pass” alone is insufficient.
6. **Continue within the authorized scope.** Proceed to the next ready packet. After two unsuccessful repair attempts on the same issue, stop expanding that lane: capture the minimal failure, consider one changed approach, or surface a real owner tradeoff. Other independent ready work may continue.
7. **End cleanly.** Record process/port ownership and retained evidence, stop owned throwaway runs, leave a restartable checkpoint and a short owner summary. Waiting for approval or exhausting a budget is not completion.

### Parallelism and model policy

- Default experimental implementation/review: **Astra High**. Use **Astra Extra High** for a specific cross-cutting design or difficult correctness failure. **5.6 Sol High/Extra High** is the owner-approved backup, not an automatic silent downgrade.
- No Ultra by default, no cheap-model development to save tokens at the expense of judgment, and no Fable dispatch unless James explicitly allocates it.
- Set model and effort explicitly when dispatching and recheck the current allowlist. Use isolated context with the relevant packet, not this conversation's full history. Do not claim the parent can change its own active reasoning setting through a child spawn.
- At most **two implementation workers**, plus coordinator and one reviewer, within actual available slots. In the shared lab, at most **one source/build/chain writer**; the second lane is read-only or works on non-overlapping approved artifacts. In real repos, use owned code worktrees and pinned cross-repo interfaces. Planning stays on main.
- A worker owns one packet to its stopping point. Reuse that worker for a bounded fix, rather than repeatedly creating new readers. No nested swarm or repeated unchanged status polling.
- The steady PM roles remain domain advisers. Consult SDK, Data Explorer, Web Client/OS, native-filesystem and Contracts roles when a packet changes their interface; do not broadcast every checkpoint to every task.

### Resource and attention limits

Use existing bounded runners where practical. Before a benchmark, inspect available disk and the runner's history/log settings. Start small; each measured fixture stops by 15 minutes, 256 MiB output or its existing stricter resource ceiling. Do not retain whole Anvil histories as routine evidence. Preserve receipt summaries, inputs, exact build identity and a reproducible failing case; clean only explicit owned disposable paths/processes.

Measure progress by accepted outcomes, reopened defects, redundant rebuilds and actionable findings—not lines generated or test counts. Record elapsed time and model/effort; report token/credit usage only if the harness supplies it. After two packets, adjust granularity if coordination costs more than implementation.

No recurring automation, plugin installation or machine-wide configuration is created by this plan. A plan guides an active/resumed session; it does not wake an idle agent. If James later requests scheduled work, use the app's heartbeat mechanism with the same scope/budget and meaningful-change-only reporting.

### Worker handoff template

```text
Task: P1 (or another exact ID); finish only this packet.
Read: living checklist, this packet, named source design, applicable AGENTS.md.
Base/workspace: verified commit and exact owned checkout.
Write scope: explicit paths; all others read-only.
Interfaces: existing functions/types consumed; proposed outputs require integration review.
Checks: named positive, hostile and realistic consumer cases from the packet.
Resources: named chain/build owner, small-run first, fixture ceilings.
Do not: change guarantees, use v1 code, start Fable, spawn more workers,
spend public funds, alter the owner's wallet/browser or claim production adoption.
Return: commit/build; commands/results; behavior gained; costs/limits;
remaining blocker; any interface change and why; cleanup/restart state.
Stop: outcome reached, two failed repairs, missing authority, or assigned budget.
```

## Maintaining the plan and learning from execution

The checklist is the single source of task status. This file explains how to execute. Dated `Reviews/` results are retained evidence, not living queues. Keep only one Kanban pointer to this plan. New findings update the relevant packet and risk/dependency in the same commit; do not append a new competing “final plan.”

At each milestone, record: intended result, observed result, surprise, what to change next time. Distinguish an engineering choice from an owner ruling; link the owning inbox when authority is required. Keep review language plain and specific. No permanent instruction file should hard-code today's temporary worker IDs or paths.

## Process research used here

These are inspirations, not imported instructions or proof that this workflow will outperform alternatives for EFS:

- [OpenAI: execution plans for multi-hour work](https://developers.openai.com/cookbook/articles/codex_exec_plans) — durable progress, discoveries, decisions and outcomes make work resumable. We adapt that to one short tracker and linked packets rather than copying a large plan into every worker.
- [Anthropic: effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — incremental feature work, clean checkpoints and observed end-to-end behavior address premature completion and context loss. We keep Markdown because James uses Obsidian, and use review to guard changes to acceptance criteria.
- [Codex subagent configuration](https://learn.chatgpt.com/docs/agent-configuration/subagents) — model/effort and agent configuration can be explicit. Actual available tools and James's allocation govern this session; no configuration edits are needed.

Existing brainstorming, planning, execution, debugging and verification skills are sufficient. Do not install a new “AI team” framework until a concrete gap survives two real work packets. The useful experiment is this lightweight workflow itself.

## Initial outcome / retrospective

September 24: consolidated the scattered prototype/build evidence into a finite queue, preserved completed experiments and remaining requirements, and distinguished reversible build permission from permanent adoption. Two independent Astra High reviews agree that contract utility has evidence and public profiles/build identity need attention. One would run Lists before foundation work; the adopted **recommendation** is to run its discriminator before the affected ABI settles while allowing clean-slate M1 design in parallel. No product code or tests were run in this planning session.
