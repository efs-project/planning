# Typed ReadFacet Architectural Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task-by-task, plus TDD. Root assigns implementation and independent review; no children without explicit dispatch. This reviewed plan requires explicit task dispatch; it is not a completed implementation or protocol adoption.

**Goal:** Establish a normally deployable full-C0 kernel with a separate typed read facet, retaining the reviewed data model and existing indexes before attempting PostingStore again.

**Architecture:** Core owns state/authority/admission and local execution context; an immutable-selector read router delegates original typed calldata to a dedicated contract facet using `UpgradeStorage.efs()`. The facet reuses Point/Query libraries and calls the local Core read-context endpoint for checked reads. No opaque bytes API, cut authority or new data/index layout.

**Tech Stack:** Solidity0.8.30, optimizer200, viaIR, Cancun; existing OZ transparent proxies, Foundry, bounded Anvil/ethers/Node/Chromium fixture harnesses.

**Spec:** [[2026-09-12-efs21-modular-deployment]], with source baseline `ebc7d540570827c5f5052af83d2cbd80f54092a7`. Independent architecture and implementation-plan review completed; the runtime-identity, typed-consumer and independently supplied factory-pin clarifications are incorporated. Root read the complete amended plan. This stages the experiment; neither task is dispatched by publication.

## Global constraints

- **Start from reviewed `ebc7d540570827c5f5052af83d2cbd80f54092a7`, NOT `f873890` or its incomplete PostingStore changes.** Root supplies isolated execution worktree and explicit sole-slot grant; this plan does not move the existing preservation checkout or canonical worker.
- Preserve StateStore layout, stored data/IDs, all ten posting families and mirror, Bindings/history/CAS, authority/nonce/executor consent, algorithm source semantics and counts-last behavior. Preserve the exact frozen six-source helper closure (PreparationHelper, Preparation, TypeGroupParser, RecordBody, BindingFold, IndexKeys) and compiler settings; assert its artifact identity where independently verified. **Do not require blanket runtime-byte identity:** changed metadata/remappings/links/constructor graph can change other modules, including Carrier/read libraries; recompile, open and requalify every actual artifact and report changes. No PostingStore, changed byte-copy/canonical-record/packing/compiler profile or missing-feature workaround in these two tasks.
- Runtime24,576; complete initcode49,152; tx16,777,216; block33,554,432; existing operation limits unchanged; peer configuration STATICCALL150,000. No raised limits/traces/public chain/funds.
- **Root/reviewer-accepted fit target for this experiment:** actual U3 and new ReadFacet each at most22,528 runtime bytes (at least2,048 below EIP-170), with all other actual modules within24,576. This is an experimental engineering acceptance target, not a permanent EFS limit. A merely deployable last-byte fit is not this task's success.
- One compiler/new finite world at a time, exclusive outputs/watchdog/cleanup, stop heavy below20GiB. Preserve demo HTTP49966/54154/60731 and their RPCs/state; root control archives and old frozen replay artifacts untouched.
- Only exact task-owned source/support/evidence commits. Use allowed `chore:`/`docs:` subjects via commit message file, normal trailers, no main edits/push without root. Source/support freeze before retained paid measurements. No completion/price claim from compilation alone.

## Fixed interface decisions

### Core versus facet selectors

Keep Core-local `counts()` and `bootstrap()`, initialization/configuration/revision/namespace/nonce APIs, Principal/domain/write APIs, U2 migration/presentation APIs, `fixtureReadContext()` and pure `deriveBindingKey(bytes32,bytes32)`. Control context reads counts directly from storage, never through fallback.

Move these **16 raw names** with their exact baseline parameters/returns: `record`, `typeRow`, `binding`, `postingHead`, `recordIdAt`, `envelopeIdAt`, `typeIdAt`, `principalIdAt`, `postingKeyAt`, `bindingKeyAt`, `envelope`, `principal`, `admissionAt`, `occurrence`, `batchAt`, `postingWord`.

Move these **18 checked names** with exact baseline tuple shapes: `getTypeSchema`, `getTypeOrigin`, `intrinsicTypeGroupBytes`, `getRecord`, `getRecordsCurrent`, `getRecordsChecked`, `getEnvelope`, `getOccurrence`, `getOccurrenceByOrdinal`, `getBindingHead`, `getBindingAtBasis`, `readHistory`, `pagePostings`, `pagePostingsHydrated`, `counts(bytes32,uint8,uint8,bytes32)`, `resolve`, `resolveStrict`, `validatePlan`. Do not expose `PointReadLibrary.getReceipt` merely because it exists internally; it is not an existing Core selector.

Base synthetic Core/U2 routes only the16 raw selectors; ReadCore/U2/U3 route their union with18 checked selectors. This preserves historical profile capabilities rather than giving base Core unsupported checked ports. Each routing profile has a separate sorted-selector commitment. The facet may contain all34 functions; its self and Point/Query link metadata getters are NOT routed.

Core additions: `readFacet() -> address`, `readFacetCodehash() -> bytes32`, `readFacetSelectorsHash() -> bytes32`. Constructor openings: Core/U2 `(factory,helper,facet)`; ReadCore/U2/U3 `(factory,helper,facet,pointReadHash,queryReadHash)`. Carrier constructor unchanged. Facet constructor has **no Core/factory address arguments**.

Facet metadata bridge: add non-routed `facetPointReadLibrary() external pure returns(address)` returning `address(PointReadLibrary)` and `facetQueryReadLibrary() external pure returns(address)` returning `address(UpgradeQueryReadLibrary)`. Their values come from the facet's actual compiler-linked code, not storage. They become usable evidence only after full facet runtime matches the independently expected source-backed artifact. Core Read constructors compare both to their own `address(PointReadLibrary)`/`address(UpgradeQueryReadLibrary)`; constructor point/query hash arguments are checked against that graph as already required. Raw-only Core has no duplicate Point/Query caller linkage to compare, but its factory still authenticates the facet's complete dependency tuple.

### Independent factory expectation and nonce sequence

Define `FixtureDeployment.FacetExpectation` with fields in this exact order:

```solidity
struct FacetExpectation {
    address facet;
    bytes32 facetCodehash;
    bytes32 selectorsHash;
    address point;
    bytes32 pointCodehash;
    address query;
    bytes32 queryCodehash;
}
constructor(FacetExpectation memory expected);
```

Factory owner remains `msg.sender`; no additional authority. Constructor accepts only generated rawHash or fullHash, nonzero deployed facet/Point/Query, matching actual runtime hashes and matching the now-authenticated facet link getters. Retain all seven values as individual public immutable fields named `expectedFacet`, `expectedFacetCodehash`, `expectedSelectorsHash`, `expectedPoint`, `expectedPointCodehash`, `expectedQuery`, `expectedQueryCodehash`, in the tuple's corresponding types. The deployer supplies this tuple from independently source-opened artifacts and actual deployment addresses; **never populate it from proposed Core getters**. This authenticates the owner's source-profile selection, not permissionless source discovery.

Deployment sequence is concrete and noncircular: deploy linked Point and Query libraries → deploy zero-argument facet linked to them → independently reconstruct/hash its runtime including facetSelf → deploy factory(expected tuple) → helper and Admission library → Core/Carrier implementations → existing `deployPair(coreImplementation,carrierImplementation,operator,treeType,init)`. Helper/Admission may be deployed earlier without changing the relation. The factory constructor and facet constructor perform no CREATE; factory proxy CREATE1/2 and proxy admin CREATE1 remain intact. External deployer nonce/address changes are measured, not normalized away.

`deployPair` keeps its existing five parameters; before either proxy CREATE it checks candidate Core's facet address/hash/profile against constructor immutables, checks actual facet/Point/Query code again, and checks Read-profile Core link getters/hashes against the expected tuple. `activate` repeats the same independent checks and reconstructs configuration from the frozen tuple; getters are comparison inputs, never the source of expectation. No setter, dynamic registry or post-genesis tuple replacement. A failed pair leaves separately deployed facet/libraries/factory present and the factory's immutable expectation unchanged; proxy creations and activation state revert. Ordinary upgrades keep this tuple fixed.

### Direct-facet guard and checked context

Facet is a contract, not an inherited Core and not a storage-pointer library interface. Use an immutable self address plus existing namespace markers:

```solidity
address public immutable facetSelf = address(this);
error ReadFacetContext();
function _facetContext() private view {
    UpgradeStorage.Control storage c = UpgradeStorage.control();
    if (address(this) == facetSelf || !c.initialized || c.controller == address(0)) {
        revert ReadFacetContext();
    }
}
```

Every moved method calls this guard before state work, but both Record batch methods perform their existing size check FIRST; do not use a universal pre-body modifier that reverses that order. It rejects direct facet calls and uninitialized/delegated implementation contexts without address prediction or circular construction. It is **not authentication of an arbitrary foreign delegating contract**; markers can be forged. Core routing/qualified execution and the source-backed deployment graph supply identity.

Checked facet methods then call `ICoreReadContext(address(this)).fixtureReadContext()` (existing four-value return: executionId, revision, blockNumber, admissionHigh). Keep the existing Core `_readBasis` Point/Query code checks and `_execution` locally, with identical dependency refusal order. Core Point/Query addresses must exactly match facet compiler links. Batch methods perform their existing size check before context and compare expected basis before body allocation. Raw methods do not call context or import checked inventory validation. A facet→Core context call observes msg.sender=Core; current context is caller-neutral. Original Router/consumer sender is preserved in the delegated facet frame.

**Explicit context-profile delta:** scalar checked methods formerly called `_readBasis()` without narrowing the executing block. Reusing `fixtureReadContext()` adds its `block.number > uint64.max` refusal (`StorageByteView.ErrReadState(executionId)`) to those scalar methods. Retain and test that named new-profile refusal rather than claim exact historical error equality at this synthetic boundary. Record batches and fixtureReadContext already had it. The new router facet-identity refusal may also precede a bad batch's decoder/size check when the facet itself is substituted; for an authentic facet preserve the old batch-size-before-Point/Query/context refusal. No broader context redesign is authorized.

### Routing/configuration and return handling

Use a single fixed facet; no mutable selector map or arbitrary delegate target. Core fallback is payable solely to explicitly reject nonzero value; unknown/short selectors reject `ReadFacetSelector(bytes4)`, identity failure rejects `ReadFacetCode()`. The selector allowlist is generated as pure comparisons, with virtual raw/full selection. Verify its commitment, not a self-attesting list alone.

Router delegates only after selector and facet codehash checks. Copy original calldata; bound returndata **before copying**. Use a proposed common131,072-byte outer return ceiling for this experiment, applying to success/error. The legal maximum eight-Record batch ABI is **67,264bytes =160outer +288array length/offsets +8×8,352tuple**, so64KiB is explicitly forbidden as an assumed safe cap. Before accepting131072, Task1's source-backed ABI-bound test must prove it covers every existing successful read: Record body8192, batch8, Type cache24575, Envelope2304, hydrated page256×7static fields plus IDs/header, raw page512IDs, history64, fixed Lens result. If any legitimate response exceeds it, stop for a reviewed ceiling derived from that existing operation, not a hidden output truncation or reduced semantic limit. New error `ReadFacetReturnSize(uint256)` documents oversized/faulted response refusal; unchanged valid replies and existing bounded revert tuples bubble exactly. Do not change Solidity's accepted trailing-calldata policy through a new input-length cap.

The fallback implementation uses standard memory-safe return/revert copying after checking returndata length. Its fixed-target/delegation assembly is reviewed as a complete unit, not copied unbounded from a proxy example. `view` typed callers issue STATICCALL through outer proxy→Core→facet→libraries. Direct transactions are not static; authentic source/runtime must be read-only, and state-write observation tests are mandatory.

Router implementation shape (the abstract hooks are implemented by Core's immutable tuple and generated raw/full policies):

```solidity
error ReadFacetSelector(bytes4 selector);
error ReadFacetCode();
error ReadFacetValue();
error ReadFacetReturnSize(uint256 length);
function _facetTarget() internal view virtual returns (address, bytes32);
function _routedSelector(bytes4 selector) internal pure virtual returns (bool);
fallback() external payable {
    if (msg.value != 0) revert ReadFacetValue();
    if (msg.data.length < 4 || !_routedSelector(msg.sig)) revert ReadFacetSelector(msg.sig);
    (address target, bytes32 expected) = _facetTarget();
    if (target.code.length == 0 || target.codehash != expected) revert ReadFacetCode();
    bool ok;
    uint256 n;
    assembly ("memory-safe") {
        let p := mload(0x40)
        calldatacopy(p, 0, calldatasize())
        ok := delegatecall(gas(), target, p, calldatasize(), 0, 0)
        n := returndatasize()
    }
    if (n > 131072) revert ReadFacetReturnSize(n);
    assembly ("memory-safe") {
        let p := mload(0x40)
        returndatacopy(p, 0, n)
        switch ok
        case 0 { revert(p, n) }
        default { return(p, n) }
    }
}
```

For generated selectors, `raw(bytes4 s)` returns the disjunction of the16 exact frozen raw selector literals, and `full(bytes4 s)` returns `raw(s)` or the18 checked literals. Generator and Solidity manifest test both independently derive selectors from canonical ABI signatures and reject duplicates. `rawHash/fullHash` are keccak256 of ABI-encoded sorted `bytes4[]`, generated once from that same manifest; the independent verifier re-derives them rather than trusting the constants.

Core configuration becomes `keccak256(abi.encode(keccak256("efs.fixture.core-read-facet/1"), oldBaseConfiguration, facetAddress, facetCodehash, selectorsHash))`. Make base configuration virtual, call `super.configuration()` first, and require current facet runtime identity. Factory's constructor-frozen seven-field expectation supplies its independent wrapper reconstruction and actual Point/Query comparisons; the code hash plus authenticated links commits these transitively. Execution-set21-word layout and its hash formula stay unchanged; Core configuration/IDs change intentionally. Ordinary U1→U2→U3 within the selected read profile keeps facet tuple and selector commitment fixed; replacing them requires a future explicitly reviewed profile/upgrade plan, not self-blessing from implementation getters.

## File structure

- Create `Reviews/2026-09-08-upgradeable-foundation/src/TypedReadFacet.sol`: moved raw/checked bodies, namespace guard, external Core context call, Point/Query calls; **no write/control inheritance**.
- Create `.../src/ITypedCoreReads.sol`: exact typed raw/full read interfaces and `ICoreReadContext`; used by tests/consumers even when concrete Core ABI omits routed selectors.
- Create `.../src/TypedReadRouter.sol`: fixed-target fallback, guards/return ceiling, abstract raw/full selector policy hooks.
- Create generated `.../src/TypedReadSelectors.sol`: exact raw/full allowlists and commitments; generation/check source is new `.../scripts/read-facet-manifest.mjs`.
- Modify `.../src/UpgradeableFixtureCore.sol`, `UpgradeableReadFixtureCore.sol`, `UpgradeStorage.sol`, and browser `contracts/src/AuthorityUpgrade.sol`: remove moved read bodies/inheritance responsibility, keep local control/context/write behavior, new constructors/router/config wrapper. Admission/Point/Query/helper algorithms and StateStore remain unchanged.
- Modify foundation `test/FixtureDeployment.sol`, `scripts/local-upgrade.mjs`, browser `test/authority-fixture.mjs`, `test/router-fixture.mjs`: facet/factory constructor sequence, link/immutable/profile/ABI composition and current fixture callers. Modify constructor sites in `test/UpgradeFoundation.t.sol`, `UpgradeReads.t.sol`, `InitializationOutline.t.sol`; `CheckedRecordBatch.t.sol` and **`test/RecordBatchConsumer.sol`** must type read hosts through `ITypedCoreReads`, including `abi.encodeCall(host.getRecord, ...)`. Preserve consumer algorithms/selectors and all tests. Mechanically change concrete Core casts to `UpgradeableFixtureCore(payable(core))` or the equivalent actual Core type where the new payable fallback requires it (including FixtureDeployment activation counts); keep control/typed read interfaces separate as needed. No consumer deletion/skips or historical artifact rewriting.
- Create foundation `test/TypedReadFacet.t.sol` and `test/read-facet-manifest.test.mjs`; create pragmatic `scripts/typed-read-facet-fit.mjs`, `scripts/typed-read-facet-benchmark.mjs`, `test/typed-read-facet-comparison.test.mjs`, and exclusive `evidence/typed-read-facet-{control,candidate}.json.gz` plus a compact report. The fit script owns its finite process and exits/cleans up; it is not a new permanent service.
- Task2 modifies foundation `reference/upgrade-reader.mjs`, `test/upgrade-reads.test.mjs`, `test/compiler-evidence.test.mjs`; Files reader `reader-scope.mjs`, `test/abi-shapes.test.mjs`, `test/reader-scope.test.mjs`, `test/reader-scope-live.test.mjs`, `test/checked-record-batch.test.mjs`; browser `test/reader-extensions.test.mjs`, `test/read-path.perf.mjs` only as required by profile qualification/ABI assembly, not Files semantics.

## Task 1: whole-surface architectural fit and actual deployment

**Produces:** source-backed34-selector facet/profile ABI, normal Core/Carrier/facet deployment at unchanged storage semantics, reviewed meaningful size margin, minimal routed-read/identity/static safety evidence. **Does not produce:** finished SDK qualification, full economic claims or permission to reapply Store.

- [ ] Verify exact clean ebc7 base in root-assigned isolated worktree; read this plan/spec/AGENTS and slot constraints. Freeze full baseline compiler input/output/source/library/helper/proxy/factory bundle before edits, including untracked inputs if any. The **pre-edit canonical bundle** must reproduce root's ebc7U324141/admission22392/helper19032/Point15092/Query20558; this is not a demand that later test/remapping compiles have identical metadata/runtime. Reconcile baseline drift before proceeding. Preserve the verified helper closure/artifact separately and report all changed actual graph identities.
- [ ] Add the first behavioral architectural RED to `TypedReadFacet.t.sol`, using the real deployed full U3 fixture, real admission and typed readback before the new headroom assertion:

  Create the exact typed interface from the frozen baseline ABI before this test, so the RED cannot be a missing interface/import. Reuse `FixtureInputs.loadInputs/publication` and the real U3 deployment/authority fixture; fixture state variables in the example are populated from the actual successful publication/result, not synthetic vm.store rows.

```solidity
// Fixture supplies actualU3, admittedRecordId, expectedType and expectedBody.
(bytes32 t, bytes memory body, uint64 ordinal) = ITypedCoreReads(actualU3).getRecord(admittedRecordId);
require(t == expectedType && keccak256(body) == keccak256(expectedBody) && ordinal != 0, "real typed read");
address implementation = actualImplementationSlot(actualU3); // vm.load ERC1967 implementation slot
require(implementation.code.length <= 22528, "U3 read adapter still resident");
```

  Define `actualImplementationSlot` in the fixture by reading `bytes32(uint256(keccak256("eip1967.proxy.implementation"))-1)` and narrowing the low160 bits. This RED is actual baseline24,141>22,528 after working reads, not a missing import/function or a synthetic oversized contract. Run only this focused test; retain exact failure. Do not call the new expected bound a baseline regression.
- [ ] Generate baseline ABI manifests from frozen actual U3/BaseCore artifacts. Filter the exact lists above; preserve canonical tuple components/array dimensions/state mutability. Assert16raw/18checked/34full distinct selectors, no conflicts with retained local functions/getters or transparent admin selectors; invalid interface/signature collisions are fatal. Output sorted records `{signature,selector,inputs,outputs,stateMutability,profile}` and their digest. Generate comparison chains/commitments from those records, not handwritten selector constants.
- [ ] Create facet/interfaces/router as specified; copy original raw/checked function bodies from ebc7, adapting only storage/context access and calls needed for moved batch logic. Keep pure deriveBindingKey local. Implement raw `postingWord` exactly `(uint64(head)+4)/5` with checked arithmetic; keyAt bound before storage lookup. Do not pull the incomplete PostingAccess/Store route fromf873.
- [ ] Implement Core immutable facet/configuration plumbing and raw/full hooks. Keep Point/Query getters/code checks local, implement the facet's two non-routed link getters, and verify constructor/factory equality with independently source-authenticated link openings. Use the explicit Point/Query→facet→factory(expected tuple)→implementations sequence above, no predicted-Core constructor parameter. Factory deployPair/activate compares against constructor immutables before proxy creation/activation; preserve proxy/admin nonce semantics and failed pair rollback.
- [ ] Update all current constructor/type callers and artifact loader/link maps listed above, explicitly including RecordBatchConsumer's host types/abi.encodeCall and required payable Core casts. Extend same-build immutable recognition for `facetSelf`, seven factory expectation fields and Core facet values with their actual deployed openings. Composed ABI is deduplicated Core-local ABI + routed typed-interface ABI + explicit error union; reject conflicting duplicates and do not route facet metadata getters. Old profile loaders remain frozen and distinct. Canonical build exclusions do not authorize skipping the consumer/full tests later.
- [ ] Implement bounded fit script using `compileUpgrade/compileRouter` with owned build outputs, source-backed compiler evidence and a finite Anvil. First compile the **entire actual U3/Carrier/factory/facet/library closure**, not a facet harness alone. Check22,528 targets and all24,576/49,152 absolute limits before launching a world. On failure retain full compiler sources/artifact bytes and stop Task1; do not proceed through another series of byte-level variants.
- [ ] Run the focused fit test under the real compiled graph; GREEN requires actual typed reads and two-KiB targets, not only a generated table. Deploy normal pair plus facet on one managed finite world; authenticate code/immutables/links and complete initcode including constructor arguments. Call peer `configuration()` with150,000gas and demonstrate actual activation/migration calls succeed within existing bounds. Retain deployment receipts only as fit evidence, not priced full economics.
- [ ] Add minimal route safety tests before Task1 review: facet runtime substitution makes an existing typed read fail; unknown/short/value/write/library selectors do not enter facet; raw storage read matches real Core slot; direct facet calls refuse; actual typed STATICCALL and direct transaction leave recorded Core storage writes empty. Confirm moved selectors are absent from Core method identifiers but callable via the composed interface at its proxy. Constructor/genesis wrong facet and transitive link mismatch refuse.
- [ ] Compile/test return-bound arithmetic offline: encode maximal existing Record batch, hydrated/raw pages, history and Type/raw-row output shapes from source constants; assert every length<=131072. The first large-return route test sends the legal eight8192-byte Record result through actual Core→facet, asserts exact67,264bytes and all eight body hashes (including last-byte sentinels), and names64KiB clipping as its falsifier. Separate ABI-size arithmetic from gas feasibility of publishing eight unique records: reuse already admitted bytes/duplicate IDs allowed by existing batch rules where needed. Validate empty/short/oversized success and error handling with test facets reachable only in adversarial fixtures. Do not lower any original collection/body limit to make this pass.
- [ ] Run focused commands from foundation with both existing test remappings, owned output/cache:

```sh
facet_tmp="$(mktemp -d /tmp/efs21-read-facet-fit.XXXXXX)"
forge test --offline --use 0.8.30 --match-path test/TypedReadFacet.t.sol --remappings 'Foundation/=src/' 'Browser/=../2026-09-09-files-browser-mvp/contracts/src/' --out "$facet_tmp/out" --cache-path "$facet_tmp/cache"
node --test --test-concurrency=1 test/read-facet-manifest.test.mjs
```

  New script CLI contract: `node Reviews/2026-09-11-efs21-pragmatic/scripts/typed-read-facet-fit.mjs --output <exclusive-file>` starts at most one finite world, reports source/ABI/configuration/deployment facts and always closes it in finally. A pre-existing output or dirty source at retained measurement is refusal, not overwrite.
- [ ] Commit exact Task1 source/support and compact fit evidence using message file, with known limitations explicit. Independent spec/quality and root reproduction gate Task1. Only if it meets headroom/deployment/safety gates may Task2 start; no module-shaped economic control is accepted yet.

## Task 2: full semantics, qualification, faults and paid consumers

**Consumes:** reviewed Task1 selector manifests, Core/facet graph/configuration and exact typed ABI. **Produces:** qualified same-storage decomposition evidence and a reviewed module-shaped control suitable for a future separately dispatched PostingStore task.

- [ ] Write qualification RED using a clearly labeled candidate-profile qualifier with only its facet dependency check omitted: replace actual facet runtime while keeping other expected graph fields fixed. Do not pretend an old source-allowlisted reader accepts a new unrecognized Core runtime; that old profile should already refuse UNKNOWN. The completed candidate qualifier must refuse UNAVAILABLE/UNKNOWN rather than qualify the incomplete graph. Also forge selector digest/link openings and assert rejection before any read result is trusted. These are graph failures, not guessed event evidence.
- [ ] Extend both independent configuration reconstructions with the exact new domain/tuple. Fetch actual facet runtime at the same pinned block, reconstruct compiler immutable/link openings and selector map, then verify actual proxy implementation/admin/controller and active/historical execution IDs. Core's implementationSelf getter, facet metadata or a manifest's own hash does not substitute for chain state. Preserve old execution profiles and historical reads; no silent normalization of old config.
- [ ] Preserve Files reader's typed method calls, payload tuples, context/continuation and checked-Record capabilities. Use composed manifest ABI to support the same selectors now served by fallback. Router Solidity IFixtureCoreU3 remains unchanged unless a compile-time interface import is needed; writes still reach the same Core and see the same Router executor. Validate metadata ABIs/errors separately from source/runtime qualification.
- [ ] Add exact fault tests: raw counts0/1/5/6 and overflow head; keyAt0/high/high+1 order; dirty return high bits/full256-bit IDs; malformed typed ABI; Point then Query refusal order before malformed scalar operation, but batch-size refusal before Point/Query/context for authentic facet; no context/config recursion; direct implementation/uninitialized foreign delegate host rejection; forged initialized foreign markers not accepted as qualified Core; facet/algorithm code swaps; admin/implementation mismatch; failed second paired migration. At synthetic block`uint64.max+1`, assert scalar candidate's new context refusal and classify the old control's prior behavior explicitly; do not normalize it into equality. Preserve known original raw-vs-checked distinctions and document added facet-availability refusal.
- [ ] Use existing actual admission/withdrawal/revival/Binding tests to compare all physical Core data and all ten posting families at identical semantic milestones. Corrupt real ebc7 Core slots, not nonexistent Store slots. Late failure must roll back existing rows/counts/nonces/helper child code and nonce exactly; allACTIVE return remains before allocation. Observe provisional prefixes through test-only observers without labeling raw state COMPLETE.
- [ ] Add paid independent typed consumer cases via `UpgradeStaticConsumer`/`RecordBatchConsumer`: known Record rehash; getTypeSchema/Envelope/Occurrence; single and8Record reads; Binding head/history/pages; Lens1/8/32/64 sources. Router whole create including staging/edit/rename/rebind/tag/partial retry/withdrawal/late failure remain the same operations. Authentic direct raw transaction no-write is tested separately from STATICCALL consensus enforcement.
- [ ] Run complete Core and foundation suites, no selector/inheritance duplicates silently lost; reconcile test counts against250Core/38foundation baseline plus new tests. Full foundation includes `InitializationOutline.t.sol` using the two remappings above. Run strict TS and formatter checks. Run explicit serial Node/browser list covering foundation `upgrade-chain`, `upgrade-reads`, `compiler-evidence`, `validation-frontier`, `tag-current`, `anvil-cache-lifecycle`; all Files-reader `*.test.mjs` through the existing bounded explicit list; browser `effect-readback`, `reader-extensions`, `read-path.perf` and the root-approved current bounded browser list. Preserve existing Type skip and name it; no trace-expanding broad Node glob across unrelated labs.
- [ ] Extend new benchmark CLI to `--mode control|candidate --output <exclusive-file>` and same-support profile adapters. Bounded startup/import/argument probe before final source freeze. Freeze source/support after full tests; then run exactly two serial exclusive worlds: ebc7 storage/control and Task1/Task2 facet candidate with identical helper/algorithms/storage/operations, same compiler profile and caps. Retain all source/artifact/receipt/RPC identity facts; record facet setup and actual qualification calls/bytes as costs, not hidden initialization.
- [ ] Offline comparison asserts all logical tuples/IDs/index inventories match except explicitly designated deployment/execution basis fields. Decode before narrowly normalizing those fields; include forged wrong-field regression. Report gas/bytes/timing regressions and refused operations honestly, no architecture savings from a subset. Keep control provenance separate from old frozen pre-metadata/initializer/shared/body controls.
- [ ] Commit source/support before final retained receipts, then evidence/report separately with exact paths and truthful trailers. Independent review/root reproduction, all finite processes closed/demos untouched, explicit slot release. Only root may ratify this as the next module-shaped baseline. PostingStore is a **third, separate plan** comparing against this same decomposition; no code cherry-pick fromf873 without its original unrun gates.

## Self-review and handoff

This plan fixes A1 typed routing and same-storage scope, names both architectural and qualified-read falsifiers, uses a noncircular direct-facet guard, preserves Core/Carrier execution authority, distinguishes verified helper bytes from changed graph/runtime identity, and gates size before economics. Task1 includes actual typed consumer/cast compilation repair and a constructor-frozen independently supplied factory tuple with authenticated facet link getters. Task1 is rejectable independently of Task2. All source names/signatures are tied to ebc7 rather than the preserved failing Store branch. Root/review accept22528 headroom and conditionally131072 only after the full bound proof; neither is an EFS permanent protocol limit. No execution is offered in this session: root/canonical worker retain dispatch and heavy-slot authority.
