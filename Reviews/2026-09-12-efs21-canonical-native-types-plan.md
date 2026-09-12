# Canonical native Types implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development for coordination and superpowers:executing-plans for each bounded worker task. The coordinator supplies independent review; no worker children or concurrent build/world owners. Steps use checkbox syntax for tracking.

**Goal:** Test canonical EFS structural Type/Record identity and validation in the existing native Files producer/browser/consumer path, without importing full-C0 admission or authority semantics.

**Architecture:** Reuse the actual six-file PreparationHelper closure; backport only the reviewed RecordBody MCOPY delta. Deploy the helper separately, inject its authenticated identity through the existing Files/Record constructor chain, and replace the native registry with an atomic canonical-group/cache registry. Preserve native Files state, ownership, history, CAS, mandatory navigation/inventory and optional current-File Discovery.

**Tech Stack:** Solidity 0.8.30, optimizer200, via-IR, Cancun; existing Forge, Node/ethers, Playwright Chromium and managed local Anvil tooling.

**Spec:** Main `1c2634b:Reviews/2026-09-12-efs21-canonical-native-types-preflight.md`, including its post-copy source preflight. Implementation base is native `4cb004273982411d4699fa15d388750638cd1358`; helper reference is full `ebc7d540570827c5f5052af83d2cbd80f54092a7`.

**Standing:** Independently reviewed implementation plan, with the metadata-sensitive control clarification incorporated below. Source feasibility is approved subject to actual size/deployment gates; this is not adoption or a price claim. The coordinator owns main/status and explicit task dispatch. The PostingStore attempt is preserved separately and has released the heavy slot. No product source, build or world was changed to produce this plan.

Task1 dispatched September12 approximately11:20UTC against exact native4cb0042, with one build/new-finite-world owner. Registry/helper/golden/deployment evidence receives independent review before Task2. Files/SDK integration and economic savings remain unproven.

## Global constraints

- Fresh-genesis disposable profile. No migration, relabelling old IDs, bulk merge of the full branch, production/public-chain deployment, public funds, arbitrary acceptance callbacks or protocol freeze.
- Native authority remains actual `msg.sender` and existing owner checks. Generic Record admission remains author-neutral. No portable Principal/AuthorIntent, authored Occurrence, Binding/withdrawal effect, plural Lens, multi-placement, revision DAG, restore or upgrade parity is acquired.
- Canonical structural support means the reviewed parser/validator profile, not all intended EFS language features. Its ASCII/DIRECT and other existing parser limitations remain explicit.
- Reference-free first profile: refuse Types with roles/references or external Type dependencies at registration, including absent OPTION and zero-length ARRAY cases. A PRINCIPAL scalar remains structurally a word, not verified authorship or an admitted Principal. It cannot acquire authority.
- Coordinator-approved experimental profile choice: reject nonempty Type index declarations with a distinct unsupported-profile error. Do not strip declarations, modify canonical bytes or claim declared-index completeness. Native mandatory unique Record inventory and optional UINT equality over current live Files remain separate populations. This is not an owner default or normative grammar ruling.
- Preserve native canonical-body maximum4096 and sparse storage128 words. Default BYTES payload maximum4094. Full8192 capacity and cache compaction/segmentation are excluded.
- Retain `Preparation` ceilings unchanged: cache payload24575, group response131072, prepared response8192, input163840, group call gas15000000, prepare call gas5000000. These are measured-profile resource limits, not normative grammar restrictions. Large legal Types may still refuse.
- Ordinary deployed runtime24576/initcode49152 and native transaction/block16777216 limits remain. No raised caps, trace collection, broad process cleanup, occupancy sweeps or hidden unlimited test deployment used as runtime evidence.
- Preserve all old evidence/goldens and demos: native HTTP49966/RPC49941 PIDs9853/9947; native HTTP54154/RPC54148 PIDs91878/91971; Fable HTTP60731/RPC60726 PIDs64754/65638. Reconfirm PIDs/ownership at dispatch; do not kill by port/name glob. One finite world at a time, owned-cache cleanup only, watchdogs, stop heavy work below20GiB free.
- Freeze exact source/support before final receipts. Both arms use one runner and source-qualified SDK, with explicit profile dispatch. Different IDs/body framing/constructor graph are declared differences, not normalized away.
- Report all deployment/setup/write/read/refusal costs. No savings threshold or schedule is promised; negative economics is an admissible result. Stop and retain a failed deployment probe if the bounded integration cannot meet actual runtime/initcode limits without further architecture.

## Concrete source boundary and touch list

Paths below are vault-relative; `P` means `Reviews/2026-09-11-efs21-pragmatic` in prose only, not a shell variable. All implementation changes need separate authorization.

| Path | Change / responsibility |
|---|---|
| `Reviews/2026-09-05-c0-core/src/RecordBody.sol` | Exact reviewed MCOPY backport only. |
| `Reviews/2026-09-05-c0-core/test/BodyCopy.t.sol` | Backport reviewed actual-function/oracle memory tests unchanged. |
| `P/contracts/foundry.toml` | Explicit C0Core/C0Admission remappings and allowed sibling paths; keep existing compiler/caps. |
| `P/contracts/src/CanonicalTypeRegistry.sol` (new) | Group registration, own authenticated cache reads, schema profile refusal, canonical metadata, structural validation. |
| `P/contracts/src/CanonicalHelperIdentity.sol` (new generated constant) | Exact approved six-file helper runtime hash; no embedded helper bytecode or constructor-selected hash. |
| `P/contracts/src/NativeRecordKernel.sol` | Registry constructor/type, canonical Record formula and profile refusal/validate-before-dedup. Preserve body storage and inventory state/order. |
| `P/contracts/src/NativeKernel.sol` | Thread helper identity to Record kernel, change registry type and facade Record formula. Preserve every Files operation/state tuple. |
| `P/contracts/src/DiscoveryIndex.sol` | Replace validator-tuple attachment check with registry's authenticated single-UINT32 predicate. No population/health/failure-policy changes. |
| `P/contracts/src/CanonicalPayloadConsumer.sol` (new) | Explicit bounded u16-framed payload decoder and independent paid capture; legacy PayloadConsumer remains exact. |
| `P/contracts/test/CanonicalTypes.t.sol`, `CanonicalFiles.t.sol` (new) | Registration/validation/integrity and real Files/Discovery regressions. |
| `P/contracts/test/fixtures/CanonicalFixtures.sol` (new) | Fixed generated group/body/golden vectors and canonical deploy helper for current tests. |
| `P/contracts/test/TestBase.sol` | Only explicit cheatcode helpers needed for new nonce/storage/corruption checks; no production ABI. |
| `P/contracts/test/{Native,KernelBoundary,Discovery,Examples,GasOperations,Raw,BodyStorage,History,HybridBody,PackedPresence}.t.sol` | Classify and retarget current deployment/encoding/physical assertions. Keep standalone legacy Types/Raw validator tests. Historical backend comparisons explicitly deploy frozen old artifacts. |
| `P/contracts/test/fixtures/{native-kernel-4cb0042,source-graph-4cb0042}.json` (new) | Exact frozen split-native control and its full dependency graph, no old fixture overwrite. |
| `P/scripts/canonical-types-fixtures.mjs` (new) | Reproducible producer/golden assembly using retained independent readers; no compiler logic rewrite. |
| `P/scripts/compile-canonical-helper.mjs` and `P/contracts/test/fixtures/canonical-preparation-helper.json` (new) | Compile only exact helper closure, retain source/settings/creation/runtime pins and generate the identity constant before native build; `--check` never writes. |
| `P/scripts/canonical-types-benchmark.mjs` (new) | Explicit control/candidate finite probe and same-app-value paired receipt runner. |
| `P/scripts/{world,compile-graphs}.mjs` | Separate helper deployment, artifact/source closure handling, control profile and registry/group setup. |
| `P/sdk/{qualification,client,source-graphs}.mjs` | New canonical profile, identity/cache verification, canonical Record IDs and body codec. Generated source-graphs only from authenticated sources. |
| `P/web/{app.mjs,index.html}` | Explicit representation labels/default selection and4094 payload limit. No raw/ABI Type impersonation. |
| `P/test/canonical-{types,codecs,graph,world,browser,measurement}.test.mjs` (new) | Focused differential/integration/evidence tests with explicit profiles. |
| `P/test/{client,codecs,dependency-graph,browser,raw-browser,raw-consumer,reconciliation,discovery,kernel-boundary-world,raw-world,body-storage-world,hybrid-body-world,packed-presence-world}.test.mjs` | Classify current versus historical expectations; preserve old assertions in explicit frozen replay, add candidate equivalents. |
| `P/scripts/{benchmark,discovery-benchmark,discovery-failures,kernel-boundary-benchmark}.mjs` | Minimal profile-aware fixture/encoding setup where actual current tests consume these; old scenario semantics/results unchanged. |
| `P/evidence/canonical-types.{json,md}` and `canonical-types-code.json.gz` (new) | Exclusive final paired evidence and deduplicated code/source inventory. |
| `.superpowers/sdd/2026-09-12-efs21-canonical-native-types-plan/{progress.md,task-1-report.md,root-verify.sh}` (execution only) | Ledger, exact commands/outcomes, owned cleanup and root reproduction. |

The closure's other five files are already byte-identical at both source bases and remain unchanged: C0Core `PreparationHelper.sol`, `Preparation.sol`, `BindingFold.sol`, `IndexKeys.sol`; C0Admission `TypeGroupParser.sol`. Do not import StateKernel, StateStore, AuthorityUpgrade, FilesRouterV2 or change shared foundation loader. Do not add product error declarations merely to mimic the old registry ABI.

`P/contracts/src/{ExactTypeRegistry,ExpandedTypeRegistry,RawBytesValidator,BodyWriter,NavigationIndex,RecordInventoryIndex,Examples,PayloadConsumer}.sol` remain source-exact. `Examples` imports the changed NativeKernel, so derived bytecode/metadata may change and must be priced/authenticated. Existing pure reference parser/encoder/body reader remain source-exact.

## Proposed contract interface and invariants

Registry interface (new ABI, not counterfeit old TypeInfo):

```solidity
struct TypeInfo {
    bytes32 groupId;
    uint16 memberIndex;
    bytes32 blobHash;
    address cacheCode;
    uint32 cacheLength;
    bytes32 cacheHash; // keccak256 of exact logical ABI cache bytes
}
constructor(address helper);
function registerGroup(bytes calldata raw) external returns (bytes32 groupId, bytes32[] memory typeIds);
function groupBytes(bytes32 groupId) external view returns (bytes memory);
function typeInfo(bytes32 id) external view returns (TypeInfo memory);
function cacheBytes(bytes32 id) external view returns (bytes memory);
function isUint256(bytes32 id) external view returns (bool);
function validate(bytes32 id, bytes calldata body) external view;
```

File and Record constructors become `(address helper)`; Files passes the address to its Record kernel; Record kernel passes it to the registry. Deploy PreparationHelper as a separate transaction first. The registry compares nonempty actual code and its hash to `CanonicalHelperIdentity.EXPECTED_RUNTIME_HASH`, generated from the exact approved standalone helper build. There is no supplied-hash argument, arbitrary interpreter allowlist or runtime setter. Registry stores Preparation.Config(helper, EXPECTED_RUNTIME_HASH) and uses Preparation's actual on-use identity check. SDK additionally authenticates complete source/runtime/link/cache provenance. A malicious helper with its own matching caller-supplied hash cannot pass the product constructor.

`compile-canonical-helper.mjs` accepts only the fixed six-file source paths and recorded compiler settings; it compiles this acyclic closure separately, derives exact runtime hash, writes a32-byte Solidity constant and retained helper artifact, and provides `--check` to reproduce/assert without writes. No registry/Files source is in the helper build input, so the generated constant introduces no compilation cycle. A changed closure requires a changed profile/source freeze and independent review. Wrong/nonexistent helper address must refuse before nested constructor deployment. This avoids embedding `type(PreparationHelper).runtimeCode` or creationCode in Files/Record initcode; actual sizes remain an early gate.

The standalone standard-JSON compiler input uses exactly these six source keys: `C0Core/PreparationHelper.sol`, `C0Core/Preparation.sol`, `C0Core/RecordBody.sol`, `C0Core/BindingFold.sol`, `C0Core/IndexKeys.sol`, `C0Admission/TypeGroupParser.sol`. Their contents are the reviewed files above, without import rewriting. Settings are `optimizer:{enabled:true,runs:200}`, `viaIR:true`, `evmVersion:"cancun"`, `remappings:[]`, `metadata:{bytecodeHash:"ipfs",appendCBOR:true,useLiteralContent:false}`; output ABI, metadata, creation/deployed bytecode, method identifiers and AST. Compiler is exactly `0.8.30+commit.73712a01`. Retain the complete input manifest and output artifact; generated constant and registry source are excluded from this compiler input.

Every actual test/world deploys that standalone creation artifact, not `new PreparationHelper()` recompiled under Foundry's different paths. Solidity tests use the existing `vm.getCode("test/fixtures/canonical-preparation-helper.json")` artifact loader and CREATE the exact returned creation bytes, then check exact expected runtime. The retained JSON contains Foundry-compatible `bytecode.object` and `deployedBytecode.object`, ABI, source/settings/compiler manifests and hashes. World deployment uses the same JSON bytes. If the main graph incidentally compiles another helper artifact, it is not a deployment input and cannot replace the pin. Graph qualification joins the standalone helper manifest/template explicitly with the separately built native graph; its source/runtime is not inferred from the native graph's transitive metadata. Never weaken the hash guard to accommodate a mismatched deployment.

Registry private state: groupId→retained raw canonical bytes plus ordered member IDs; typeId→TypeInfo. A bytes mapping is the proposed first raw-group storage representation: bounded8190 bytes, no allocator, no second helper blob convention. This is additional setup work to price; if actual maximum-group cost refuses, retain that refusal, not a new grammar limit. No group is inserted into the generic Record inventory or treated as authored MetaType admission. `groupId` and its bytes are recoverable through registry API; there is deliberately no invented full-C0 `groupRecordId`/origin Admission.

Registration algorithm:

```text
g = Preparation.group(config, raw) // exact bounded STATICCALL
require g.rawHash == keccak256(raw)
require g.groupHash == H(DOM_GROUP, keccak256(raw))
require 1 <= members <= 16 and dependencies.length == 0
for every member, before any CREATE or registry write:
  decode SchemaCache; require expected canonical member TypeId and matching cache.typeId
  validate group member blobHash against its raw member span
  require roles.length == 0, every field.references == 0, indexes.length == 0
  refuse reserved exact IDs; require nonempty cache length <= 24575
  if existing: compare raw group/origin/index/blobHash and exact cache bytes/hash
if exact repeated group: return existing IDs without CREATE or state writes
otherwise deploy each cache through actual Preparation.deployCache
  check returned pointer code length == cache length + 1, STOP prefix and payload hash
then retain raw group, ordered IDs and all member metadata atomically
```

Use a bounded local raw-group member-span walk only to associate already parsed member blob hashes; bounds before every copy; it does not replace TypeGroupParser. Cache reads check exact extent, STOP, payload hash, decoded TypeId/blobHash and stored group/member association. Missing/corrupt metadata refuses, never empty-cache success. Compare repeated raw bytes directly/hash plus length; never accept an existing TypeId alone. Preserve original errors from helper through Preparation; new profile/integrity errors distinguish UnsupportedReferences, UnsupportedIndexes, ReservedType, UnknownType and CorruptCache from InvalidSchema/InvalidBody/resource refusal.

Validation uses `Preparation.record(config, checkedCache, id, body, canonicalRecordId, 0, KernelIds(0,0,0), true)`. Registry also enforces body.length<=4096. Require returned references and occurrenceKeys empty and effect.kind==0 as internal consistency checks, not an authority claim. All semantic/profile checks execute before dedup in NativeRecordKernel; unchanged BodyWriter/inventory are only required for new Records. Helper validation remains required for duplicates: losing helper availability can now refuse a duplicate even though no new body is written. Report that capability/cost difference explicitly.

`isUint256` uses the same checked cache, returns true only for one UINT field width32/maxBody32 with no roles/indexes/constraints. It accepts independently named exact Types with that shape, preserving existing Discovery's ability to select different UINT Types. Discovery preserves its selected exact TypeId, namespace ownership, required/tolerated failure isolation, backfill/high-water, epochs/cursor invalidation and READY/DIRTY truthfulness.

### Metadata-sensitive control boundary

Only the artifacts and profile frozen **before** changing native compiler remappings are exact `4cb0042`. Global remappings can change compiler metadata, every affected runtime and validator-derived legacy Type IDs even when their Solidity source is unchanged. Newly compiled legacy contracts after Task1 are not that historical graph and cannot reuse its templates or identity claims.

Task1 completion covers the standalone helper/registry, structural tests and explicit frozen-control RED/replay. Current canonical SDK/world/browser qualification becomes mandatory in Task2, not prematurely in Task1. Classify each metadata-sensitive native test explicitly: preserve exact historical assertions in frozen replay, and add/retarget current-graph assertions when its profile is integrated. Never weaken a check to make mismatched metadata pass or count historical-only replay as current-graph coverage.

## Task 1: Authenticated canonical registry, helper and actual capability RED

### Phase A: Freeze control and prove actual missing capability RED

**Deliverable:** Recoverable exact control, golden inputs, and meaningful pre-implementation failures. No changed helper/registry yet.

- [ ] Recheck assigned clean native HEAD, pending scratch ownership, existing demos and free disk. Preserve exact control source archive and graph before any source change. Extract frozen artifacts to new4cb fixture names and assert source/creation/runtime equality; do not regenerate an old fixture from current source.
- [ ] Add canonical fixture producer using unchanged `type-inputs/encoder.mjs` `encodeGroup/derive`; use independent `type-inputs/parser.mjs`, `c0-admission/reader.mjs` `verifyCache` and `c0-core/reference/record-body.mjs` `decodeBody` as golden oracles. Freeze generated groupHex, blobs, hashes, expected IDs, body bytes and outcomes before registry implementation. Do not patch an oracle to agree with candidate.
- [ ] Default descriptor group, exact order and source data:

```js
const base = {meaning:'Disposable canonical native Files bridge', specDigest:null,
  qualifier:'00'.repeat(32), roles:[], indexes:[], constraints:[]};
const defaults = [
  {...base,name:'CanonicalNativeQuote/1',fields:[{name:'value',kind:'UINT',width:32}]},
  {...base,name:'CanonicalNativeBytes/1',fields:[{name:'payload',kind:'BYTES',max:4094}]}
];
// UINT bodies: exact abi.encode(uint256); BYTES bodies: two-byte BE length + payload.
```

- [ ] Add baseline-compatible low-level RED tests; avoid a missing import/constructor compile error as the claimed RED:

```solidity
function testActualLegacyRegistryCannotRegisterCanonicalGroup() public {
    NativeKernel old = new NativeKernel();
    (bool ok,) = address(old.types()).call(abi.encodeWithSignature("registerGroup(bytes)", defaultsRaw));
    require(ok, "canonical group admission missing");
}
```

`defaultsRaw` comes from frozen CanonicalFixtures. Retain exact failure and unmodified native source hash. Later preserve it as an explicit expected old-profile failure, while the actual new registry registration test turns GREEN. Task1 computes canonical Record IDs for validator arguments/oracle comparison but does not claim canonical Record storage: that production path belongs to Task2.
- [ ] Commit exact control/golden/test support, after observed RED, using project commit trailers and exact paths. Root reviews golden independence and scope before integration.

### Phase B: Actual helper/cache registry and physical refusal gates

**Deliverable:** Source-qualified separately deployed helper + registry with atomic ref-free registration and canonical validation.

- [ ] Backport RecordBody and BodyCopy.t.sol from exact full reference; verify six-file Git diff leaves only reviewed RecordBody product change. Add explicit native build remappings `C0Core/=../../2026-09-05-c0-core/src/` and `C0Admission/=../../2026-09-05-c0-admission/src/`, with `allow_paths = ["../.."]`. Preserve all compiler options.
- [ ] Before product implementation, test missing/substituted helper constructor refusal, including a wrong helper with a matching self-reported hash (the public constructor offers no such parameter). Implement separate helper build/constant generation, then reproduce helper from its exact current six-file inputs; authenticate compiler metadata source hashes. If helper hash differs from reviewed full build, retain both complete artifacts and exact cause; independently qualify the actual deployed native-build helper. Do not edit imported Preparation to create a wrapper convenience method.
- [ ] Write tests for registry interfaces/invariants above, then minimal implementation. Registration tests: permissionless registration; exact two-member identity/cache bytes and raw origins; repeated group no registry state/new helper nonce/code/inventory; changed name/order yields different IDs; conflicting existing association/hash/blob/pointer refuses; unknown Type refuses; short/trailing group framing;0/17members; group>8190;64/65fields; malformed names/descriptors/constraints.
- [ ] Refusal table: direct REF, OCCREF, OPTION(REF) absent, ARRAY(REF,max0) empty, SELF, sibling GROUP_REF and external expected Type all refuse at schema profile boundary even if helper structurally accepts. Nonempty scalar/digest indexes refuse explicitly. Malformed nested ref schemas still produce parser errors, not a support claim. PRINCIPAL bytes do not create any ownership/Principal state.
- [ ] Pin reserved BindingSet/BindingTombstone/Withdrawal exact IDs from `Reviews/2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json` group1 members0/1/2; independently derive their identities from raw group bytes. Pin the intrinsic MetaType by independently encoding the exact descriptor in `c0-core/scripts/local-stateful.mjs:fixtureInputs`: name `TypeSchemaGroup/1`, empty meaning, null specDigest, zero qualifier, one BYTES field `groupBytes` max8190, empty roles/indexes/constraints. Do not import a world launcher to obtain this constant. Add tests that copied names/shapes with different IDs are not name-based reservations, but still obey reference/index profile checks. Reserved ID guard runs before unknown-Type/dedup; forced test-only existing metadata cannot bypass it. No authority state is imported.
- [ ] Malicious helper tests on actual call seam: missing/changed runtime before invoke; oversized success output and oversized revert output; short/malformed ABI; helper tries state mutation under STATICCALL; substituted deploy target; zero/short/wrong-length/wrong-STOP/wrong-payload returned code; identical-size cache substitution and wrong Type/blob/group member association. Such helpers are test-only pinned harnesses or local code corruption, never accepted SDK profiles.
- [ ] Atomicity: make second member fail resource/profile checks and assert no first member/cache. Separately obtain the actual pinned helper's current CREATE nonce, derive the next two child addresses, and `vm.etch` one-byte STOP code at the second predicted address. Register a valid two-member group: first CREATE is reached, second collides and fails. Check exact revert/refusal, helper nonce, no first child code and no group/Type registry writes; the pre-existing injected second code remains unchanged until test teardown. This uses the real helper and no altered helper allowlist. Repeat group under changed helper or corrupt cache refuses rather than quietly returning existence.
- [ ] Replay reviewed BodyCopy tests on actual imported function; run actual helper differential nested/constraints corpus. Include BOOL2, truncated/trailing UINT, UINT width32 extremes, signed constraint bounds, OPTION flag2, map ordering/duplicate key, UTF-8 errors, digest length/algorithm, array/struct depth/count, BYTES wrong u16/trailing data. Golden descriptor/body outcomes are authoritative for the implemented structural subset.
- [ ] Early real deployment gate: separate helper then registry, every deployed runtime/initcode measured and under ordinary caps. Stop with bounded failure receipt if it cannot deploy without new architecture; no arbitrary limit change. In Task2 repeat this gate for the complete Files graph before economics.
- [ ] Commit exact registry/helper/golden/test support and send source hash for independent review. Task1 is independently rejectable/approvable through direct registry/group/body tests and deployment receipts; it makes no Files or paid whole-application claim. Record reviewed Task1 source in the ledger before Task2.

## Task 2: Existing Files/Discovery/SDK integration and paired economics

### Phase A: Existing Files path, not a standalone-store demonstration

**Deliverable:** Actual native producer, browser and unrelated consumer use canonical records while Files behavior remains native.

- [ ] Before Task2 product edits, add this actual native storage-identity RED (the NativeKernel constructor/registry are still original after Task1), run separately and retain exact failure:

```solidity
function testActualLegacyRecordDoesNotHaveCanonicalIdentity() public {
    NativeKernel old = new NativeKernel();
    bytes32 t = old.types().register("quote:uint256", address(new Uint256Validator()));
    bytes memory b = abi.encode(uint256(3000));
    bytes32 actual = old.storeRecord(t, b);
    require(actual == keccak256(abi.encode(keccak256("efs2/record/1"), t, keccak256(b))),
      "native Record domain differs");
}
```

- [ ] Before Task2 SDK edits, add Node RED asserting canonical profile/config is unsupported and u16 payload framing absent in the actual existing client; retain real failures, not a fake parser or missing module import. After integration retain legacy characterization as an explicit expected difference and make the actual candidate storage/profile/codec tests GREEN. No performance saving assertion: capability is added; old/old same-app-value pairing validates the economic comparator. Never mark Task1 complete with these Task2 tests failing in its final gate.
- [ ] Write focused current-path tests, then change NativeRecordKernel registry construction and Record ID; thread helper address through NativeKernel and change its facade Record ID. Keep record mappings roots0/1, body backend policy, File storage and navigation/inventory callbacks unchanged. Constructor signatures intentionally change; function/File tuples remain. Authenticate all derived artifacts and report actual ABI/error metadata differences. Deploy the complete actual graph under runtime/initcode/transaction caps now; stop on failed fit before broad test adaptation or economic runs.
- [ ] Exercise direct new Record/dedup, facade new/dedup, permissionless non-File producer, same-content File edit, two namespaces sharing one Record, new body edit, stale CAS, wrong owner, name conflict, move, unlink and all retained revisions. Check actual metadata/words/code and mandatory inventory uniqueness; on failures inspect helper nonce, BodyWriter nonce/children, File nonce/head/history and mandatory/optional indexes.
- [ ] Discovery tests first: canonical UINT attachment succeeds; BYTES/constrained/nonscalar Type refuses; exact other UINT Type can be selected; absent Type/corrupt cache/helper qualification refuses as declared. Preserve unchanged READY/BUILDING/DIRTY, backfill, detach/restart epochs, stale cursor, required child failure rollback, tolerated failure DIRTY, child/outer OOG distinctions and no false absence/completeness. These index current live Files, not generic Records or occurrences.
- [ ] Add CanonicalPayloadConsumer with exact u16 decode (`body.length>=2`, decoded length==body.length-2, payload<=4094), exact configured TypeId, stored digest/length/revision/RecordId. Keep legacy PayloadConsumer unchanged for control; retain both consumer deployment costs and explicitly different decoding costs. QuoteProducer/QuoteReader source remains unchanged; it receives canonical quote TypeId and uses same32-byte body.
- [ ] Add named `canonical-ref-free-v1` graph/representation profile and explicit `baseline-4cb0042`. Do not silently assign canonical meaning to old `raw`/`canonical` strings. Candidate config exposes canonical BYTES Type and representation; no fake legacy validator accounts or tuple. `graphIdentity` commits default group/Type IDs, helper/registry graph and capability. Cache/group metadata/bytes and helper links are checked at the same block basis as runtime templates; validate canonical header hash externally via RPC and final basis recheck.
- [ ] Adapt world graph/template builder to separate helper deployment and remapped source closure. Current `world.mjs` historical-ABI-superset assertion must explicitly exclude changed constructors/registry metadata, while requiring unchanged Files function/tuple/event surface. Old controls use own exact ABI, not candidate constructor encoding. Template builder must not assume every source path is under native `contracts/src` or that source-named helpers are runtime validators.
- [ ] SDK tests: encode/decode empty, zero, binary, trailing zero and4094payload;4095 refuses before transaction; wrong u16/trailing data; old raw/ABI inputs not guessed as canonical; wrong IDs/profile/genesis/block/helper/cache/registry writers fail closed; type conversion is explicit. Browser defaults, history/download and edits preserve chosen exact canonical Type. Do not offer two fake native representations in the new profile.
- [ ] Chromium workflow: create text, edit, rename, reload, read revision1, upload/download binary and empty file, unlink, stale-edit conflict, genuine RPC failure remains failure not empty directory, quote producer→path→independent reader. Run old browser suite explicitly against frozen native, then candidate workflow; do not count old-only replay as candidate coverage.
- [ ] Inventory every existing test moved to frozen control, adapted to candidate or duplicated. Preserve all baseline test definitions/expectations where their old profile remains applicable; explicitly explain new identities/encoding/constructor expectation changes. Old runtime corruption tests remain historical; actual new registry/helper/cache/body corruption tests must reach candidate storage.

### Phase B: One fair finite economic comparison, plus named limits

**Deliverable:** Source-frozen measured old/new operation and qualification costs, not a parity slogan.

- [ ] Build new runner with `--probe`, `--old-old`, `--final` and explicit output path modes. Probe performs one registration/record/read and owned cleanup. Old-old repeats exact frozen4cb workload with identical deployment order/calldata and demands equal operation gas/logical outcomes; failure means comparator is not ready, not a product regression.
- [ ] Final same-app-value pair uses old UINT versus new UINT, old raw bytes versus new u16 BYTES as primary payload comparison; additionally retain old ABI BYTES for empty/tiny/4032payload framing comparison. Report body lengths, calldata gas, selected backend, exact IDs and changed deployment addresses separately. Do not normalize new canonical IDs into old IDs; map each arm's file handles by scenario and assert its independent derivation.
- [ ] Matched lifecycle: namespace/root/directory setup; quote3000create/3100edit/same3100edit/stale refusal; BYTES empty/tiny `ef008000`/31/32/33/4032/4094 payload create/fresh edit/same-content edit; rename/unlink/history; direct Record/facade/contract producer/dedup; optional Discovery unattached, attached required, attached tolerated with reached failure. Bounds native raw4096 versus canonical4094 and old ABI4032 are separate domain-boundary cases, never same-payload rows.
- [ ] Paid unrelated reads: quote path+Type+value; canonical/legacy payload capture; direct and facade Record once/twice; File/history metadata; directory page; selected Discovery query. Measure consumer deployment separately. Capture cold/warm context explicitly; no unrelated full-C0 public receipt API claim.
- [ ] Registration receipts: helper deployment, Files complete dependency graph, default group, exact repeat, independent second group, helper differential calls where paid, and known legal large cases. The existing `files-browser-mvp/test/type-cache-boundary.test.mjs` fixture is not exported: reproduce its exact declarative input and unchanged BOOL-only cache oracle in new support without importing the test module/world. It is `CacheBoundary/1`, empty meaning, null digest, zero qualifier,64 BOOL fields named `flag${i.padStart(2,'0')}` plus58`a` characters, no roles/indexes/constraints:4356raw/24960cache. Assert new support matches the retained pure fixture before measuring the actual bridge outcome.
- [ ] Specify aggregate fixture independently:16 members named `G00` through `G15`, empty meaning/null digest/zero qualifier, each64 BOOL fields `f00` through `f63`, no roles/indexes/constraints. Source arithmetic gives7010group bytes,20864cache bytes each,333824aggregate caches and336096complete helper response; verify these exact counts against unchanged encoder/oracle before a live test. Retain actual helper outcome and registration refusal separately. This is not a previously admitted bridge transaction. Ordinary output refusal must be distinguished from OOG and invalid schema. No cache support fix in this task.
- [ ] Large failures are diagnostic RED support targets, even when a regression test correctly expects refusal. Keep a visible unsupported-capability result and never market all legal Types as supported. No universal gas lower bound or standalone codec result substitutes for integrated receipts.
- [ ] Freeze all product/runner/SDK/tests/goldens before final pair. Final runner refuses dirty owned source, wrong source/helper/control hashes and existing evidence filename. Retain complete signed transactions, receipt/block/calldata, actual deployed source/runtime/immutable/link graph, exact groups/caches and code blobs once in bounded gzip inventory, every operation observation and refusal rollback. Cap new summary JSON8MiB, compressed inventory16MiB, expanded inventory64MiB; stop rather than duplicate huge runtime payloads per operation. These are evidence bounds, not EVM limits.
- [ ] Node worlds strictly serial; use managed watchdog/owned cache cleanup and no polling persistent demos. Final evidence must record source/support hash and each arm's creation/source profile, actual module sizes, setup versus operation costs, qualification RPC/bytes and late failures. Root independently authenticates transactions, codehash/template/immutable/registry/cache associations and intended-versus-observed effects.

## Exact verification commands and gate ownership

Commands below are an execution checklist, **not run during planning**. Run from native worktree root unless shown. New script flags listed below are interfaces the implementation must provide, not existing commands at4cb. No environment variable may silently redirect an old benchmark's default to candidate.

```sh
git status --short --branch
git rev-parse HEAD
git diff 4cb004273982411d4699fa15d388750638cd1358 ebc7d540570827c5f5052af83d2cbd80f54092a7 -- Reviews/2026-09-05-c0-core/src/PreparationHelper.sol Reviews/2026-09-05-c0-core/src/Preparation.sol Reviews/2026-09-05-c0-core/src/RecordBody.sol Reviews/2026-09-05-c0-core/src/BindingFold.sol Reviews/2026-09-05-c0-core/src/IndexKeys.sol Reviews/2026-09-05-c0-admission/src/TypeGroupParser.sol
```

From `Reviews/2026-09-11-efs21-pragmatic/contracts`:

```sh
forge test --offline --use 0.8.30 --match-contract CanonicalTypesTest --match-test testActualLegacyRegistryCannotRegisterCanonicalGroup -vv
forge test --offline --use 0.8.30 --match-contract CanonicalFilesTest --match-test testActualLegacyRecordDoesNotHaveCanonicalIdentity -vv
forge test --offline --use 0.8.30 --match-contract CanonicalTypesTest -vv
forge test --offline --use 0.8.30 --match-contract CanonicalFilesTest -vv
forge test --offline --use 0.8.30 --summary
forge build --offline --use 0.8.30 --sizes
forge fmt --check src/CanonicalTypeRegistry.sol src/CanonicalPayloadConsumer.sol src/NativeRecordKernel.sol src/NativeKernel.sol src/DiscoveryIndex.sol test/CanonicalTypes.t.sol test/CanonicalFiles.t.sol test/fixtures/CanonicalFixtures.sol
```

The first command is Task1 pre-product RED; the second is Task2 pre-product RED and is not a Task1 completion gate. After integration use preserved explicit legacy deployment tests expecting those refusals/differences, alongside GREEN candidate tests. The full native baseline was123Forge/37Node at4cb; final counts must be actual and accompanied by the adaptation ledger, not forced to those numbers.

From `Reviews/2026-09-05-c0-core` (same backported actual RecordBody; do not import full branch's retired-journal skip settings):

```sh
forge test --offline --use 0.8.30 --match-contract BodyCopyTest -vv
forge test --offline --use 0.8.30 --match-path test/RecordBody.t.sol -vv
forge test --offline --use 0.8.30 --summary
node --test --test-concurrency=1 test/body-reader.test.mjs
```

From `Reviews/2026-09-11-efs21-pragmatic`:

```sh
node scripts/canonical-types-fixtures.mjs --check
node scripts/compile-canonical-helper.mjs
node scripts/compile-graphs.mjs
node scripts/compile-canonical-helper.mjs --check
node --test --test-concurrency=1 test/canonical-types.test.mjs test/canonical-codecs.test.mjs
node --test --test-concurrency=1 test/canonical-graph.test.mjs test/canonical-world.test.mjs
node --test --test-concurrency=1 test/canonical-browser.test.mjs
node scripts/canonical-types-benchmark.mjs --probe
node scripts/canonical-types-benchmark.mjs --old-old
node scripts/canonical-types-benchmark.mjs --final --output evidence/canonical-types.json
node --test --test-concurrency=1 test/canonical-measurement.test.mjs
node --test --test-concurrency=1 test/*.test.mjs
```

`compile-graphs.mjs` is a build/support-generation step before source freeze. Full tests must not overwrite source-graphs or evidence after freeze; any required support change requires a new source freeze and both final arms. Baseline-current historical tests explicitly select4cb; new candidate tests explicitly select canonical-ref-free-v1. Existing older replay artifacts remain available. Preserve actual all-suite output and failed attempts, no invented counts.

From native worktree root:

```sh
git diff --check
git status --short
```

- [ ] Implementer writes report under matching SDD folder with exact source/evidence commits, source touch/adaptation counts, runtime/limits failures and receipt matrix. Every owned finite node/cache is stopped/removed before explicitly releasing the heavy slot. Root may start reproduction while implementer only finishes Markdown/evidence closure.
- [ ] Independent reviewer reads source/goldens/actual artifacts first; later authenticates final pair. Root retains separate `root-build`, `root-core`, `root-native`, `root-node`, `root-pair` outputs, runs the same commands with a new exclusive output filename, and compares intended outcomes plus bounded nondeterministic basis fields—not byte-identical timestamps/hashes. No implementation complete claim before both reviews and root gates.
- [ ] Coordinator handles main plan/status, dispatch, final review integration and push. No worker main edit, child, or migration. Only explicitly dispatched tasks may modify product code; the experiment choices below are coordinator rulings, not owner adoption.

## Coordinator experiment rulings / explicit non-goals

The coordinator approved these bounded experimental choices during draft review; none is an owner default or adoption:

1. Refuse references/roles/external dependencies and all nonempty declared indexes, rather than accepting declarations with unsupported query qualification. This changes deployment profile, not Type bytes.
2. Retain raw groups as registry bytes, not generic MetaType Record admission; cache blobs stay exact ABI STOP code. Setup remains unpriced and large-Type limits unresolved. No Type visibility until the whole group transaction succeeds.
3. Expose two canonical default Types with no legacy raw/ABI emulation and primary economics old-raw→canonical-BYTES. Legacy representation browser/tests remain explicit frozen replay; candidate defaults gain different body framing and IDs.

Reference-free scope and native4096 capacity are supplied dispatch boundaries, not open invitations to add ref resolution or8192 storage. Compact caches, full native ingress to AuthorityUpgrade, plural Files, live Files, PostingStore policy changes and arbitrary acceptance remain separate work. The comparison cannot prove a universal cost floor or price full portable-authored semantics.

## Draft self-review

- Source correctness: six-file closure diff checked; actual helper bodyOnly still validates fields/constraints and returns references; effects/keys are skipped, not full admission. Native graph deployment nesting and old SDK validator tuples are explicitly replaced.
- Candidate-versus-control coverage: actual functional RED, exact frozen old replay, candidate corruption/Files/Discovery/browser path, changed constructor and representation semantics, old/old economic comparator, separate new capability failures.
- Limits/authority: ordinary caps and named legal failures remain; source/profile qualification is RPC-backed, not chain-state proof; caller-owned Files is not detached portable authorship. Reserved full mutation identities are denied across all Record paths.
- Execution boundary: only this draft was written. No build, test, world, artifact generation, product edit, commit or push performed for this plan.
