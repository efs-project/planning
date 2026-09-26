# SDK repository, consumer surfaces and distribution

**Status:** draft — SDK PM recommendation for Claude's initialization and architecture plan
**Target repos:** planning, sdk, contracts, client
**Depends on:** [[README]], [[architecture-candidate]], [[owner-rulings]], [[../efsv2/prototype-implementation-plan]], [[../web-client-os/client-repository-and-development]]
**Inputs:** planning `909f7da75bf3a39d6d5ddcb578fa6e79e81344a0`; September 24–25 prototype closeout; official sources checked 2026-09-26
**Last touched:** 2026-09-26

#status/draft #kind/design #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/onchain #topic/developer-experience

## Problem and intended outcome

The successor SDK repository must make EFS practical for a static browser, an ordinary server or script, a consuming Solidity contract, a native drive, and an AI harness. Each consumer should install and build only what it needs. They must agree on exact evidence, identity, authority and qualified results even when their available operations differ.

James requested this planning input before Claude drafts initialization plans for PM review. This document recommends repository and distribution choices; it creates no repository, package, deployment or protocol commitment. The copyable developer assignment is [[sdk-repository-planning-prompt]]. Package names below are responsibility labels, not reserved npm names. The temporary repository name is `sdk-v2` under [[Onboarding/repo-map]].

**Recommendation:** one repository with a small pnpm workspace, an independently usable Foundry source package, one portable TypeScript implementation, and optional native/agent adapters. Share protocol inputs, vectors and acceptance cases. Share implementation wherever the execution environment permits it. Add another language implementation when a measured consumer requirement warrants its maintenance.

| Alternative | Benefit | Cost / disposition |
|---|---|---|
| One repository, separate consumable packages | Atomic changes to bindings, vectors and adapters; coherent documentation; independent installs/builds | Recommended. Enforce import/build boundaries and avoid releasing every package for every change. |
| Separate TypeScript, Solidity and native repositories | Independent teams, permissions and release calendars | Premature coordination overhead while semantics are evolving. Split later if ownership or release/security boundaries demand it; retain shared artifact contracts. |
| Rust/Wasm semantic engine wrapped for every consumer immediately | Potential shared native/browser implementation | Adds a compiler, FFI, memory/async ownership and packaging before its benefit is demonstrated; cannot run unchanged in the EVM. Preserve the option, do not make it the initial bootstrap dependency. |

## Established constraints and current evidence

- Core owns protocol truth, validation/admission, required indexes and contract interfaces. The SDK owns ergonomic access, generation, verification, transport and recovery. Product navigation, OS drivers and agent policy belong to their consumers.
- Standalone guest reads cannot depend on a wallet, hosted indexer, Commons or an EFS backend. Exact raw bytes and separate basis, coverage, authority, currentness, availability and unsupported outcomes survive all projections. See [[../efsv2/owner-rulings]] and [[architecture-candidate#Result and error model]].
- The current M2 brief requires browser/JS and Solidity consumers, staged saves, device-author support, bounded resources, lost-receipt recovery and export/import for M1's actual build. Historical authorship, present controller, submitter and payer remain distinct. See [[../efsv2/prototype-implementation-plan#M2 — SDK, transport, authority and recovery]].
- The preservation horizon is a century. That requires archived specs, exact source/tool/output closure, test vectors and replacement paths; it does not require maintaining one JavaScript API unchanged for 100 years.
- The [[../../Reviews/2026-09-24-prototype-delivery/README|latest measured closeout]] supports shared qualified semantics across browser, headless drive projection and contracts. A fresh Node process traversed 1,000 Files after decode/index changes. Long-lived browser memory, live onchain pagination and public-provider economics remain open. These are dated local results, not new measurements in this pass.

## 1. Repository and dependency shape

```text
sdk-v2/
  packages/
    sdk/                 portable core, Files, actions, archive, exact profiles
    evm/                 RPC, wallet/account, signature and submission adapters
    solidity/            self-contained Foundry project; distributable .sol source
    codegen/             build-time Type/profile compiler and binding generation
    node/                disk stores, durable journal, native service implementation
    cli/                 human/JSON commands over the same services
    mcp/                 MCP tools/resources over the same services
    testkit/             developer fixtures and conformance adapters; private first
  protocol-inputs/        lock + exact contracts interfaces/ABIs/vectors/manifests
  schemas/               versioned boundary DTO schemas; later HTTP description
  conformance/           shared corpus, capability matrix, independent oracles
  examples/              browser, node, Foundry, Hardhat, agent, native consumer
  docs/                  guides, API docs, compatibility, ADRs, security/recovery
  tools/                 bounded generation, packing, fixture and release commands
  .changeset/            package-specific change/release intent
  .github/workflows/     independent lanes plus joined release acceptance
  AGENTS.md
  pnpm-workspace.yaml
  pnpm-lock.yaml
```

This is the intended layout as consumers arrive, not an instruction to create empty packages. Initialize `sdk`, `evm`, `solidity`, minimal `codegen` and private conformance tooling with the first slice. Add `node`, `cli`, `mcp` with their runnable native/agent slice. Create `schemas/` only for actual serialized boundaries. A Rust `crates/` workspace remains a documented possible extension until a native comparison needs it.

| Surface | Dependency and public contract | Build/install independence |
|---|---|---|
| Portable SDK | Raw-preserving primitives; qualified reads; Files resolution; planning/reconciliation; archive checking; generated profile modules | No Node, DOM, wallet, MCP, SQLite, compiler or chain process imports. Default root exports the common reader facade; optional subpaths do not eagerly re-export heavy adapters. |
| EVM adapter | Implements SDK ports for Ethereum RPC and accounts; accepts explicit provider/account/profile | Depends on portable SDK and one maintained EVM stack. No automatic wallet discovery. Recommend viem as first adapter candidate; compare against existing ethers evidence before locking it. |
| Solidity | Exact interfaces, value/result structs, bounded codecs, readers and internal builders | Forge can compile/test its project without pnpm. Shipping source requires no codegen, JavaScript or Node at consumer installation. |
| Codegen | Consumes exact retained EFS Type/profile closure and contracts artifacts | Development dependency only. Emits checked-in generated sources, docs and vectors; never imports an app or requires online catalog resolution. |
| Node services | Implements storage/journal/file-stream ports and optional local service over SDK + chosen EVM adapter | No native binary dependency in the browser runtime. CLI and MCP share this code rather than reimplementing EFS. |
| CLI / MCP | Independent entrypoints and npm artifacts over common services | Neither is imported by the SDK. MCP does not require the CLI as a subprocess. Logs/configuration/lifetime belong to the outer process. |
| Testkit | Fault sources, fixture loading and assertions | Kept out of all runtime packages. Publish a small dev package only when external consumer tests need it. |

Files, generic Records and product-specific generated views remain separate subpaths within the portable package initially. A consumer may use arbitrary described Types without importing Files. Data Explorer and Web Client use different facades over the same qualified operations. Platform storage ports live in the portable SDK; IndexedDB/filesystem implementations are explicit adapters. Build tools, test types and compiler internals must not leak into emitted public declarations.

Use pnpm's `workspace:` dependencies internally and test the rewritten versions in packed tarballs. Workspace linking must never conceal a missing public dependency. Its built-in filtering/task ordering is sufficient initially; add a task-cache framework only if real build times justify it. [pnpm workspace documentation](https://pnpm.io/workspaces)

## 2. TypeScript and browser success criteria

**Build recommendation:** emit ordinary ESM JavaScript, `.d.ts`, source/declaration maps and public source using `tsc` first. Explicit `exports` and `files` allowlists define the package. Use strict Node-compatible ESM resolution and explicit emitted `.js` relative imports, with separate compiler configurations for portable, Node, browser-test and build code. Set the JS target explicitly; pin the TypeScript version. The portable runtime must typecheck without ambient Node or DOM globals. [TypeScript library guidance](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html), [Node package exports](https://nodejs.org/api/packages.html)

The consuming SPA owns bundling and minification. A library bundler becomes useful only for a demonstrated distribution need; do not add tsup/tsdown/Rollup/Vite to the library build simply because the client uses Vite. Start ESM-only with documented Node and browser support. Add CommonJS only for a named consumer and test its separate declarations/interop; do not claim that `require()` works because an ESM import test passes.

Use `Uint8Array`, exact integer representations, plain typed results, `AbortSignal`-compatible cancellation, async iteration and explicit progress/budget controls. Keep the cancellation port's required shape explicit so portable declarations do not require the entire DOM or Node ambient type library; test assignment from real browser and Node signals. Inject network and persistence. No top-level network request, default chain, global signer, browser extension probe, worker creation, telemetry or environment-variable read in the portable import. Audited crypto dependencies are appropriate; do not implement cryptography to meet an arbitrary dependency-count target. Streaming hashes must use bounded incremental implementations or explicitly bounded buffering.

Keep viem-specific types within the optional EVM package. If its public adapter accepts viem clients, declare a tested peer range there and a pinned development version; the portable package has no viem peer requirement. One ordinary browser quickstart should need only the SDK and selected EVM adapter. EIP-1193/6963 provider integration, EIP-1898 reads, EIP-712 signing and selected ERC-1271 accounts belong at this seam. EIP-5792/4337/7702 and newer proposals get explicit optional capability profiles; supported standards are a tested matrix, not every feature claimed by a provider. See [[ethereum-standards-census]].

The SDK should handle these chores for applications:

- Build exact Type/Record/reference/Occurrence/action inputs; derive committed IDs; validate supported profiles; render the exact proposed effects and costs for review.
- Own coherent read contexts, bounded pagination and continuation validation; retain useful positive rows under partial coverage. Cache keys include relevant Realm/deployment/profile/basis/policy identity. A complete enumeration starts from origin or validates independent coverage.
- Resolve names/Lenses once; verify bytes independently of carrier availability. Return streams/ranges with their verification grade. A whole-file hash cannot certify an early range without the necessary chunk/range evidence.
- Journal plans and attempts, collect explicit authorization, submit through the chosen adapter, and independently reconcile effects. Cancellation after submission does not undo a chain transaction. Repeated intent IDs are not proof of idempotency unless bound to the same exact plan and checked effects.
- Explain unsupported profiles, pruned state, mismatched builds and stale plans with typed expected outcomes. Preserve raw unknown evidence. Serialize checked evidence explicitly; a JSON tag or TypeScript brand is not proof.
- Export a versioned closure and reconstruct offline; destination publication requires valid destination authority. SDK package semver never rewrites Type or protocol meaning.

Keep live contract-backed values distinct from immutable File revisions. A live read records its execution/basis evidence; retaining one result creates a snapshot with its own commitment. Encryption/key access is injected through an explicit profile and host authority; unsupported ciphertext remains opaque. Neither the SDK cache nor a drive can convert those cases into ordinary public immutable bytes.

CI installs the **packed package** into a fresh Node consumer, a plain JavaScript consumer, a strict TypeScript consumer and a small static browser/Worker consumer. Test consumer resolution separately under Node and a client bundler. Check emitted declarations, exports and package contents with [publint](https://publint.dev/) and [Are the Types Wrong?](https://github.com/arethetypeswrong/arethetypeswrong.github.io). Measure the guest import's included modules and realistic memory/RPC costs; do not demand a fictional zero-byte adapter.

## 3. Solidity SDK: source is the product

Default delivery is versioned `.sol` source, compiled into the consuming contract. Generated `internal` library functions preserve direct Core calling semantics and avoid a mandatory deployed dependency. Solidity's `public`/`external` library calls have different linking/call behavior; they must not accidentally appear in this default lane. [Solidity library semantics](https://docs.soliditylang.org/en/latest/contracts.html#libraries)

`packages/solidity/` owns `foundry.toml`, `src/`, `test/`, explicit remappings and its exact development dependency lock. Source includes narrow upstream interfaces, result structs/custom errors, bounded exact-Type codecs and optional Files-profile readers/builders. Version profile-specific import paths when incompatible semantics must coexist. Avoid a giant import that compiles every generated Type, a storage-owning base contract, a generic onchain schema VM, and hard-coded default deployment addresses.

**Build/test:** pin Foundry, solc, optimizer/viaIR and `evmVersion` for release evidence. Publish a tested compiler/target range for consumer source; do not assume any higher compiler or fork works. Compile independent consumer contracts, test unknown/malformed responses, stale basis, bounded returndata/work, atomic app-plus-EFS writes and actual caller attribution. Measure the *consuming contract's* runtime/initcode growth and gas, not just the empty library. Keep `forge-std` development-only, locked, and installed during explicit setup rather than cloned by prebuild/pretest hooks. Soldeer is a reasonable locked dev-dependency option after checking the selected Foundry release; registry publication is optional. [Soldeer usage](https://github.com/mario-eth/soldeer/blob/main/USAGE.md)

**Distribution from the same release inputs:**

1. An npm source package for Hardhat and npm-managed Foundry projects: source, required interface closure, licenses, README and provenance manifest. No Node lifecycle scripts or dependency on the TypeScript SDK.
2. A deterministic source archive with a normal `src/` root, licenses, manifest and documented remapping for Forge users who do not use npm. Test extraction and compilation in a fresh consumer.
3. An exact Git tag/commit installation example for the monorepo with its nested-path remapping. This is a convenience path; the consumer must not need to initialize the whole pnpm workspace.

Solidity resolves imports/remappings independently of Node's `exports`; test both. Both artifacts must contain byte-identical Solidity sources and the same profile manifest. Never edit a copied interface locally: verify it against the contracts release artifact. Keep tests/compiler outputs out of the public source closure unless intentionally included as a separate conformance archive. A deployed reader helper is a later measured package/profile with its own chain/code/dependency identity and fallback; publishing a Solidity package does not deploy anything.

## 4. Native applications and drive integration

The TypeScript SDK already covers Node scripts, servers, Electron/Tauri-adjacent services and JS agent harnesses. A native app can use a long-lived local Node service as a practical first integration. This is a candidate to measure, not a requirement that every native application ship Node.

**Recommended sequence:** expose the shared read/plan/reconcile service in process for Node consumers; add a bounded local HTTP interface for a real non-JS consumer, described by OpenAPI; compare it with a small native Rust reader on the same corpus if startup, deployment, memory, callback latency or independent verification requires one. Test the native host's ability to package and reach the service on each OS before selecting it. An actual drive's packaging/sandbox requirements may rule out the sidecar on a platform. If Rust wins that question, add maintained crates with Cargo builds/releases in this repo and explicit FFI/Wasm ownership tests only for required bindings. Avoid promising Python/Rust/Go/Swift/C# semantic SDKs from generated HTTP clients: such clients call a service and inherit its evidence boundary.

Keep OS mounting, UI, signing/notarization and driver installers with the native-filesystem product. The SDK supplies a headless Files contract: stable resource identifiers; exact metadata; qualified directory pages; cancellable verified range streams; snapshot/live basis; explicit change/rescan signals; staging and reconciliation; evidence export. Linux [FUSE](https://docs.kernel.org/filesystems/fuse/fuse.html), Apple's [File Provider](https://developer.apple.com/documentation/fileprovider) and Windows [Cloud Files](https://learn.microsoft.com/en-us/windows/win32/cfapi/cloud-files-api-portal) are distinct product adapters with different lifecycle constraints.

Drive requirements that shape the SDK now:

- Host filenames, case collisions, reserved names, aliases and inode/file handles must preserve canonical EFS identity. Do not silently slug names or define protocol normalization using the host filesystem.
- Enumeration records its snapshot/continuation contract. Unknown/unavailable data is not `ENOENT`, and an incomplete page cannot become successful directory EOF. Surface the limitation through the host's error/status mechanism while retaining evidence.
- Reads support bounded range acquisition, backpressure, cancellation and integrity checking. Cache eviction distinguishes reacquirable content from unsubmitted edits, journals and export evidence.
- A local durable save, upload, chain submission, confirmed effect and finality are separate states. `fsync` cannot promise onchain publication without an explicit product contract. Stage edits and publish an authorized batch; never charge a transaction for every low-level filesystem write.
- Rename/move/copy/mask/release operations use the same SDK plan/precondition semantics as the browser. Concurrent devices, reorgs, crash/restart and revision conflicts need deterministic recovery cases.
- Change notifications are hints with source/coverage/frontier, not a promise that logs prove complete history. Reconnect can require bounded rescan.

The earlier [[../efsv2/mountable-filesystem-semantics]] and [[../efsv2/hierarchical-files-and-folders]] supply pressure and the three-host outcome; their historical topology/bytes/Rust mechanism do not preselect this implementation. P4 demonstrated a headless projection, not mounted Linux/macOS/Windows behavior.

## 5. MCP and OpenAPI

**MCP belongs here as an independently packaged adapter.** Start with a local stdio server using the official MCP SDK. Provide resources for exact EFS evidence/content and finite tools for inspect/resolve/list/read/export, prepare/stage, submit an explicitly authorized plan, and reconcile. Use stable operation identifiers, bounded schemas, structured results, evidence/resource links and redacted diagnostics. Never pass private keys as tool arguments. Agent identity, MCP authentication and discovery do not grant EFS write authority.

Current research changes the implementation brief: the official MCP site resolves `latest` to **2026-07-28**, and its TypeScript repository identifies split v2 server/client packages as its stable line. The new revision uses self-contained requests and per-request negotiation; older revisions use session initialization. Pin the actual SDK/spec pair, list supported harness versions, and test both selected current and required legacy profiles. Do not bake a single historical handshake into the EFS service contract. [MCP specification](https://modelcontextprotocol.io/specification/2026-07-28), [transport/version boundaries](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports), [official SDK](https://github.com/modelcontextprotocol/typescript-sdk), [SDK version guidance](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions)

Fetching an agent skill yields exact inspected bytes and provenance. The agent harness separately decides to install/load/execute it. Preserve the open [Agent Skills](https://agentskills.io/specification) file layout when exporting supported skill bundles; the optional MCP Skills extension can be explored after basic resources/tools interoperability. A listing or a valid hash cannot authorize instructions embedded in content, access to secrets, tools or a different origin. Resource retrieval is not automatic instruction execution.

Remote Streamable HTTP is a later deployment profile of the MCP adapter. Follow the selected revision's authorization/security rules, validate audience/origin, protect tokens, bound requests and reject unsupported capabilities. A local stdio process uses its host's explicitly scoped configuration. Keep protocol output on stdout and diagnostics on stderr. No model-provider dependency, sampling requirement, autonomous execution loop or mandatory registry registration is needed to serve EFS tools. [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), [security guidance](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices)

**OpenAPI describes an optional HTTP service, not the onchain protocol or every internal function.** Use it when the native/remote API slice exists, to document operations and generate thin clients. JSON Schema 2020-12 is the proposed serialized DTO source for these boundary models; generated TypeScript bindings, MCP input/output schemas and HTTP models are checked projections. State/effect laws require prose and vectors as well. EFS canonical Type bytes and Solidity ABI remain authoritative upstream inputs, not something inferred from a JSON Schema. Avoid a custom universal IDL or simultaneous protobuf/WIT/GraphQL frameworks in initialization.

The current OpenAPI document is 3.2.1. Start from the supported 3.1/3.2 subset proven by the chosen generators and validators, record the exact dialect, and reject lossy projection. Do not select the newest edition until one Python or Rust client round-trips the required evidence/results. Decimal strings carry wide integers in JSON; exact byte encodings are explicit. Schema `format` annotations alone do not enforce those rules. [OpenAPI specification](https://spec.openapis.org/oas/v3.2.1.html)

For a local service, authenticate its owner/clients even on loopback, restrict bind/Host/Origin, and do not let browser pages or arbitrary fetched locators access ambient local paths or metadata endpoints. Large bytes use bounded streams/ranges with verification metadata; control JSON holds handles and receipts rather than unbounded base64. Specify deadlines, disconnect behavior, cancellation and recovery by exact operation ID. Start with owned process lifetime and no always-on system daemon. Unix sockets/named pipes are later transport profiles if useful; remote HTTP/MCP hosting is optional infrastructure.

## 6. Shared inputs and conformance without shared mistakes

The contracts repo publishes one pinned developer artifact closure: narrow interface source, ABI/custom errors/events, build identity, protocol/profile/Type inputs, vectors, deployment/dev-fixture recipe and schema. The SDK lock records immutable source and artifact digests. The client consumes SDK tarballs plus a matching fixture/release manifest. CI must work from an SDK-only checkout. Explicit local overrides are allowed for co-development, recorded in diagnostics, and barred from publishing releases.

Generate TS and Solidity bindings from those exact inputs; retain generator version, options, input/output digests and source paths. Generated public code is checked in for review, reproducible without network resolution, and marked for regeneration rather than hand editing. Profile evolution generates a compatibility report; append-only raw preservation does not make every new semantic Type backward compatible.

Start generation with one exact supported Type/profile and make unsupported constructs explicit. ABI binding generation, EFS canonical encoding and service DTO generation are distinct transformations. Structural generators do not infer application meaning or translate arbitrary developer validation into safe Solidity: custom predicates remain separately reviewed code with exact rule identity and conformance cases. Preserve a future full Type compiler without requiring it to bootstrap the first SDK.

One conformance corpus carries canonical input bytes and expected identities, values, qualifications and effects. Run it through separate TS, Solidity and later Rust/HTTP/MCP adapters. Maintain a capability matrix: Solidity cannot fetch external bytes, Node-specific storage is not a browser feature, and a thin HTTP client is not an independent verifier. Include manually reviewed vectors or an independent reference implementation; two outputs of one faulty generator are not independent agreement.

| Lane | Required evidence |
|---|---|
| Pure/codec | Valid and malformed bounds; max-width integers; raw unknown Types; canonical encoding; deterministic generation; independent vectors |
| Reader | Same-basis pages; gaps/duplicates/reordering; index generation drift; false terminal COMPLETE; positive PARTIAL results; masks/conflicts; opaque/unavailable bytes; cache poisoning; history/reorg loss |
| Action | Exact plan before signing; rejection, ambiguous response and restart; role separation; replay/cost ceilings; stale account/chain/code; late index/validation rollback; per-effect read-back |
| Solidity consumer | Fresh source install; bounded point/page and caller-preserving write; gas/size; supported solc/EVM combinations; no unexpected link references |
| Browser/server packages | Tarball installs; JS and TS use; no ambient Node/wallet in guest/Worker; supported browser/Node matrix; backpressure and retained memory |
| Native/agent | Another-language client; crash/restart; authorized write parity; invalid skill/archive paths; no execution on fetch; cancellation still permits reconciliation; unsupported protocol version |
| Preservation | Stop source services; reconstruct from exact released closure; unknown builds fail honestly; upgrade does not reinterpret old evidence |

Fast PR jobs run relevant pure/type/format/package checks. Cross-profile or generated changes also run shared vectors and Foundry. Browser/Node/Windows/macOS consumer smoke is needed where those runtimes are claimed. The full pack-and-consume matrix, joined fixture and source-off drill gate a release. Product mounted-filesystem acceptance remains in the drive repo; SDK tests the supplied headless contract. Do not fork a public network or operate paid services in default CI.

## 7. Build, publishing and release operations

Use pinned supported Node/pnpm/TypeScript, Foundry/solc, Biome, one TS test runner (Vitest is a reasonable shared client choice), browser tests with Playwright, and Changesets for package-specific versions/change notes. TypeDoc/NatSpec and short Markdown recipes suffice for initial docs. Avoid a custom task runner, mandatory Docker, native dependencies or a docs framework until a concrete need appears.

Commands should expose independent lanes: `build:ts`, `build:solidity`, `generate:check`, `test:unit`, `test:conformance`, `test:browser`, `test:package`, `pack` and `release:check`. These are proposed command responsibilities. `forge build/test --root packages/solidity` remains direct. TS setup/build does not invoke Forge; Solidity setup/build does not invoke pnpm. Root orchestration diagnoses missing optional tools and never silently reports an omitted required release lane as passing. No install-time compilation or network clone hooks.

Recommended pipeline:

```text
verify locked inputs -> regenerate/check -> build/test each lane
  -> pack once -> install exact artifacts into clean consumers
  -> review release manifest -> publish those same checked artifacts
  -> verify registry/archive digests and perform consumer smoke
```

Use Changesets' independent package versions initially; the release manifest names the tested compatible set and supported protocol/profile ranges. Consumers install exact production artifacts. A common protocol/serialized-result change updates every affected package in one reviewed change. A CLI-only fix need not release Solidity. Fixed groups are available if early packages cannot evolve independently; record a concrete reason rather than forcing unrelated artifacts into lockstep. [Changesets fixed groups](https://github.com/changesets/changesets/blob/main/docs/fixed-packages.md)

Before publishing, choose scope/names and legacy-package migration deliberately. The old repository already uses `@efs/sdk` and `@efs/solidity`; do not assume those names are unused or move their `latest` tags as an initialization side effect. Experimental v2 artifacts use a clearly identified prerelease channel and document breaking changes. `0.x` still needs change notes and tested consumer compatibility.

Use npm Trusted Publishing via a narrowly configured GitHub Actions OIDC workflow on a supported runner; check current CLI/Node requirements at setup. Configure each package, protected release environment/tag controls and minimal publish-job permissions. Pack with pnpm so workspace dependencies are rewritten, then publish the verified tarballs with an OIDC-capable npm CLI; prove this exact pipeline in the release rehearsal. Avoid an OIDC-incompatible convenience wrapper or rebuilding different bytes during publish. [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)

Untrusted PR code has no publish credentials or release-job execution path. Pin actions, review dependency/lock changes, allowlist needed dependency build scripts, and keep release builds isolated from untrusted caches. Provenance links the artifact to a build; it is not a security audit. The first-publication/bootstrap and package ownership/recovery procedure must be documented and rehearsed rather than hidden in a script.

Registry publication is not an atomic multi-package transaction. Publish in dependency order, verify already-published exact digests after interruption, and finish only the missing artifacts. A release-set manifest is complete only when all named artifacts resolve and pass smoke tests. Never overwrite a published version or repoint a tag to different bytes to repair it; publish a corrective version and retain the incident/migration record.

Each release retains source commit, license/notice closure, supported runtime/compiler matrix, protocol-input lock, generated-output identity, package/archive digests, build provenance, API docs, conformance results, limitations and recovery instructions. Archive exact dependencies/tool inputs or content-addressed retrieval material needed to reproduce the normalized outputs; state which signature/timestamp fields are intentionally outside byte-for-byte reproducibility. GitHub and npm are distribution channels, not the only century archive.

## 8. Development, documentation and human/agent collaboration

Use the single contracts-owned local fixture/seed/upgrade recipe. The SDK owns manifest validation, the fixture consumer and semantic assertions; the client owns its UI launch command. Reconcile with [[../web-client-os/client-repository-and-development#4. Development environments: ports, chains and ownership]]. Independently named devnets, fixture actors and port/process ownership permit parallel work without resetting another user's state. A dev reset generation invalidates caches/journals, but onchain replay protection still requires a changed replay domain or protocol guard.

Prefer `pnpm test:integration` to start one isolated deterministic fixture or attach explicitly to an owned one; it prints the contracts/SDK/profile identities and stops only processes it owns. No automatic public RPC, deploy key, wallet launch or local-only source import. Development tools and synthetic keys are excluded from runtime exports and release artifacts.

The root README starts with four install/use paths: browser/Node, Solidity, CLI/MCP, and native integration. Each path names its extra tools and supported operations. Examples are compiled and exercised against packed releases. Publish a short API and evidence glossary, error/retry guide, wallet/authority guide, profile compatibility table, package-consumer recipes and source-off recovery walkthrough. An offline copy ships with the release closure.

Repo-local `AGENTS.md` states package ownership/import rules, generated-file provenance, minimum lane checks, exact artifact inputs and authority for deployment/publishing. Public contributor docs must stand alone; private planning links are supporting context, not a required checkout. Use short ADRs for consequential SDK choices and a compact PR checklist for changed exports, profile/vector changes and consumer evidence. App frameworks and agent harnesses consume public APIs; do not make the test harness a second SDK.

## 9. Staged implementation proposal for the developer's plan

| Stage | Deliverable and exit | Why this order |
|---|---|---|
| A — package foundation | Minimal workspace, exact protocol-input artifact, TS/Forge independent builds, one generated Type, shared vectors and pack/install consumers | Tests repository and publishing boundaries before broad API design. No public publish is needed to test tarballs. |
| B — actual EFS vertical | Fresh guest lists/opens inline File; one ordinary-wallet guarded revision; dropped-response restart/reconciliation; Solidity consumer reads and writes as itself; populated upgrade and actual-build export/reconstruction | Earns the SDK's essential semantic and lifecycle contract with client/contracts together. |
| C — native/agent access | Same File via Node, stdio MCP and one non-JS consumer; store/read one exact skill bundle with separate execution consent; read-only headless mount adapter contract; restart and incomplete-read cases | Demonstrates broader use without first writing several language SDKs or OS drivers. |
| D — measured distribution/support | Complete release rehearsal, prerelease compatibility set, browser/provider/memory envelopes and native sidecar-vs-Rust decision | Selects support promises and additional implementation only from actual consumer evidence. |

The developer should return package manifests/export maps and an annotated tree as review artifacts, an input/output/build dependency graph, exact proposed tool pins with reasons, release workflow design, a capability/support matrix, and the first integrated acceptance commands. These are concrete initialization plans for PM review; this document authorizes no implementation.

## Open questions

Current Core delivery state is [[../efsv2/prototype-delivery-checklist]]. The September 10 SDK disconnected-browser text is retained history; September 17 and September 24–25 provide newer integration evidence. The legacy SDK's merged status does not confer v2 compatibility. Older freeze-before-production wording governs permanence/conformance claims; the current upgradeable MVP sequence permits explicitly authorized reversible implementation before permanent freeze. Package topology remains a recommendation under SDK-E2, not a new owner ruling.

Resolve these in Claude's concrete plan or the named first consumer experiment, without another broad owner questionnaire:

- [ ] Confirm the contracts artifact/dev-fixture publisher and SDK lock schema with Contracts and Web Client; pin the initial M1 interface checkpoint.
- [ ] Choose exact npm scope/prerelease names and license/notice policy after inspecting legacy ownership; choose independent versions unless a fixed group has a concrete benefit.
- [ ] Verify tsc-only ESM consumption and the initial viem adapter; document supported Node/browser/solc/EVM versions rather than inheriting lab defaults.
- [ ] Select the first actual native consumer and compare the Node service against platform constraints; define thresholds that trigger a Rust crate. The three-host drive outcome stays tracked with its product owner.
- [ ] Pin MCP SDK/spec/harness profiles and one non-JS API generator/validator pair; verify wide integers, unknown outcomes and streaming metadata survive round trips.
- [ ] Keep public Name/profile, active-Realm contract pagination, broad historical-author proof and wallet/fee questions owned by the existing Core/Files/M2 gates. No SDK wrapper may claim they are solved.

### Design self-review (2026-09-26)

Desk checks covered: TS-only install without Forge; Forge-only use without Node; browser guest excluding Node/MCP; native unknown reads; Solidity caller attribution; missing packaged imports; interrupted multi-package publication; legacy npm name collision; MCP version skew; and source-off reconstruction. These checks shaped the plan and acceptance cases. No implementation, package build, registry publication or runtime test ran during this design pass. Independent PM review is still required.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

Planning-only. The successor repository, package names, code, registry accounts, CI workflow, local service and native products are not created by this document. Version pins belong in the reviewed initialization plan and then the actual repository lock/configuration, not in prose that silently follows `latest`.
