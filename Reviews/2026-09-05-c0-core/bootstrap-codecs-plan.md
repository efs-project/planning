# C0 V2 bootstrap inputs implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Supply the actual future Core with bounded versioned seed/deployment readers and authenticated configuration-selection material, preserving the V1 implementation.

**Architecture:** Reuse the unchanged foundation V1 seed grammar inside the explicitly versioned V2 envelope; implement the fixed four-component deployment and separate initialization-selection module. An independent JavaScript reader and pure test receiver compare exact bytes and commitments. These modules feed the real initializer; they do not initialize synthetic Core state or pretend to verify code provenance.

**Tech Stack:** Existing Solidity 0.8.30/Cancun/optimizer 200/via-IR, Forge/Anvil 1.7.1, Node 26 and ethers 6.15. No new installation.

**Spec:** [V2 deployment](dependency-deployment-v2.md) and [real initialization boundary](initialization-boundary.md), restricted here to seed/deployment/selection/null-policy/InitConfig codecs. Link-map validation, raw group/Codex validation, actual context checks and state mutation belong to the subsequent real initialization join, not this component.

## Global Constraints

- Owned planning-mvp-c0 feature worktree only. No new product repo, main merge, PR, public deployment, durable data, permanent bytes or protocol authority.
- Preserve all existing source, candidate Type bytes and historical V1 vectors. No carrier/kernel/authority implementation changes and no trusted mutation entrypoint.
- V2 seed = u16(2) + exact V1 seed bytes + five bytes32 fields in the specified order; length 712..13,690 before stricter content validation. V1 and V2 must cross-reject.
- Seed suffix: admissionLibraryCreate2Salt, preparationHelperCreate2Salt, admissionCreationCodeTemplateHash, preparationCreationCodeTemplateHash, coreLinkReferencesHash. Salts may be zero; all three hashes nonzero.
- V2 deployment exactly 498 bytes: u16(2), seed32, then Core/ByteStore/AdmissionLibrary/PreparationHelper components. Each component is address20/salt32/initCodeHash32/runtimeCodeHash32. Nonzero distinct addresses; nonzero seed/code hashes; zero salts allowed.
- Selection exactly 288 canonical ABI bytes with the existing nine-word order/domain. Exactly one reserved source label c0/init-selection/1, its digest equal to keccak256(selectionBytes). Fixed null-policy descriptor is one domain word. InitConfig stays the exact seven-field 224-byte tuple.
- Bound byte lengths before dynamic decode/copy; validate original JS arrays before normalization. Do not sort, dedupe, coerce, skip holes or accept inherited array indexes. Preserve V1 numeric acceptance: bigint or canonical unsigned decimal strings for wide values, not JS Numbers.
- Pure codec success is not initialization authorization, validated source/template provenance, enabled capability, gas fit, SDK READY or complete G0. The actual wrapper—not these pure functions—must check msg.sender and actual chain/Core/carrier context.
- Use apply_patch and behavioral TDD. One implementer, no children. Root owns docs/status/publication. Stage only six owned files; retain ignored report and diagnostics. Commit via message file with actual model, Agent: v2-pm, Harness: codex; do not push.
- No relaxed EVM size/gas limits; managed local Anvil only, normal transaction ceiling 16,777,216. No personal wallet or public RPC.

---

### Task 1: V2 run and initialization-selection codecs with independent read-back

**Files:**

- Create: `Reviews/2026-09-05-c0-core/src/C0RunCodecV2.sol`
- Create: `Reviews/2026-09-05-c0-core/src/C0InitializationSelection.sol`
- Create: `Reviews/2026-09-05-c0-core/test/C0BootstrapCodecHarness.sol`
- Create: `Reviews/2026-09-05-c0-core/test/C0BootstrapCodec.t.sol`
- Create: `Reviews/2026-09-05-c0-core/reference/c0-bootstrap-codec.mjs`
- Create: `Reviews/2026-09-05-c0-core/test/c0-bootstrap-codec.test.mjs`
- Report only: `.superpowers/sdd/bootstrap-codecs-plan/task-1-report.md`

**Interfaces:**

Consume unchanged `C0RunCodec.SeedInputs`, `Commitment`, `encodeSeed` and
`decodeSeed` from the unchanged sibling foundation's `src/C0RunCodec.sol`.
Foundry 1.7.1 resolves the Solidity source-unit import spelling
`C0Admission/../../2026-09-04-mvp-c0-foundation/src/C0RunCodec.sol` through the
existing remapping anchor. Both direct `../../…` and shortened `../…`
spellings failed import resolution before behavioral RED. Verify
the compiled source content hash against the actual sibling file, rather than
assuming that a matching basename proves identity. Do not copy its private
parser, change V1's domain/array grammar, or add a dependency/remapping/config
change. Existing Foundry `allow_paths` covers the sibling Reviews package.

`C0RunCodecV2` defines:

```solidity
struct Seed {
  C0RunCodec.SeedInputs base;
  bytes32 admissionLibraryCreate2Salt;
  bytes32 preparationHelperCreate2Salt;
  bytes32 admissionCreationCodeTemplateHash;
  bytes32 preparationCreationCodeTemplateHash;
  bytes32 coreLinkReferencesHash;
}
struct Component {
  address account;
  bytes32 create2Salt;
  bytes32 initCodeHash;
  bytes32 runtimeCodeHash;
}
struct Deployment {
  bytes32 experimentSeed;
  Component core;
  Component byteStore;
  Component admissionLibrary;
  Component preparationHelper;
}
error InvalidRunV2();

function encodeSeed(Seed memory value) internal pure returns (bytes memory);
function decodeSeed(bytes calldata encoded) internal pure returns (Seed memory);
function experimentSeed(Seed memory value) internal pure returns (bytes32);
function encodeDeployment(Deployment memory value) internal pure returns (bytes memory);
function decodeDeployment(bytes calldata encoded) internal pure returns (Deployment memory);
function experimentCommitment(Deployment memory value) internal pure returns (bytes32);
function c0ProfileId(bytes32 commitment) internal pure returns (bytes32);
function selectionDigest(Seed memory value) internal pure returns (bytes32);
```

`selectionDigest` returns the unique reserved entry, not the selection's
contents. Seed encode/decode both require that reserved label once; the base
V1 validator checks all count/order/label/digest rules first. Unknown ordinary
source labels remain ordinary commitments, not additional configuration.

`C0InitializationSelection` defines:

```solidity
struct Selection {
  uint16 initConfigVersion;
  uint8 finalityRuleKind;
  uint32 finalityParam;
  uint8 upgradeAuthorityKind;
  bytes32 upgradeAuthorityRef;
  uint64 declaredTxGasLimit;
  bytes32 nullPolicyHash;
  address bootstrapExecutor;
}
error InvalidInitializationSelection();
function nullPolicyBytes() internal pure returns (bytes memory);
function encode(Selection memory value) internal pure returns (bytes memory);
function decode(bytes calldata encoded) internal pure returns (Selection memory);
function open(bytes calldata encoded, bytes32 expectedDigest)
  internal pure returns (Selection memory);
function initConfig(Selection memory value, bytes32 experimentCommitment)
  internal pure returns (bytes memory);
function requireInitConfig(bytes calldata encoded, Selection memory value,
  bytes32 experimentCommitment) internal pure;
```

`open` bounds/decodes/canonicalizes selection, then compares its exact hash with
the nonzero authenticated expected digest. It is not a caller authorization
decision: passing an untrusted matching digest proves nothing about the seed.
`requireInitConfig` requires exactly 224 bytes and equality to derived bytes;
it never rewrites caller input. `initConfig` validates the selection too and
requires nonzero deployment commitment. It does not derive Realm/genesis IDs.

The pure test harness exposes thin external equivalents of these functions,
plus unchanged V1 decode functions solely for cross-version rejection tests.
No storage/initialization/context setter, caller authority check or accepted
bootstrap flag. Keep the harness below ordinary runtime/initcode limits.

JS exports `encodeSeedV2`, `decodeSeedV2`, `experimentSeedV2`,
`encodeDeploymentV2`, `decodeDeploymentV2`, `experimentCommitmentV2`,
`c0ProfileId`, `selectionDigest`, `nullPolicyBytes`, `encodeSelection`,
`decodeSelection`, `openSelection`, `initConfig`, `requireInitConfig`, with
the same object field names. Reuse the independent foundation JS V1 seed
codec, not any Solidity helper. Small selection fields use Numbers with exact
integer/width checks; declaredTxGasLimit and V1 u64 fields keep bigint/canonical
decimal input and bigint decoded output. Bytes/addresses use exact hex.

- [x] **Step 1: Write compiling stubs and first behavioral tests.**

Use the signatures above and named errors; initially have seed/deployment/
selection encoding refuse. Build a synthetic selection with kind2/param1,
NONE/zero upgrade, gas16,777,216, the fixed null-policy hash and address0x21.
Use V1 sample semantics with distinct schema/bootstrap addresses and one
reserved source commitment to that selection. Samples are not valid G0.

```solidity
bytes memory expectedSelection = abi.encode(
  keccak256("efs2/mvp-c0/initialization-selection/1"),
  uint16(1), uint8(2), uint32(1), uint8(0), bytes32(0),
  uint64(16777216),
  keccak256(abi.encode(keccak256("efs2/mvp-c0/null-policy/1"))),
  address(0x21)
);
require(expectedSelection.length == 288);
require(keccak256(h.encodeSelection(value)) == keccak256(expectedSelection));
```

Hand-frame the seed as `0002 || V1 sample literal || five suffix words`, and
deployment as `0002 || seed32 || four literal 116-byte components`. Use
distinct addresses 0x31..0x34 and distinct hash words; zero salts are legal.
Do not call either producer encoder to define expected bytes.

- [x] **Step 2: Run and record behavioral RED.**

From the Core directory resolve the existing local compiler as in the prior
request task; run `forge test --offline --use "$C0_BOOTSTRAP_SOLC" --match-path test/C0BootstrapCodec.t.sol -vv`.
Compilation must succeed; the first valid encoding assertion must fail on the
stub's named error, not a missing import/export. Record precise source/exit.

- [x] **Step 3: Implement bounded framing and shared validation.**

For V2 seed decode, check total length/version before copying the bounded V1
slice. Decode the last five words at exact packed positions, validate the
three nonzero hashes, then validate reserved selection membership:

```solidity
if (encoded.length < 712 || encoded.length > 13690) revert InvalidRunV2();
if (uint16(bytes2(encoded[0:2])) != 2) revert InvalidRunV2();
uint256 end = encoded.length - 160;
value.base = C0RunCodec.decodeSeed(encoded[2:end]);
// Five exact 32-byte suffix slices fill the named fields in order.
```

The V1 error may bubble unchanged for invalid V1 content; V2 framing/suffix/
reserved-entry errors use InvalidRunV2. Do not catch an error and return a
zero/success value. Encode uses unchanged V1 encoding plus the fixed wrapper,
with the same suffix/reserved rules. Deployment uses direct fixed slices and
the spec's component order, all six pairwise address inequalities and exact
re-encoding. Its version/framing/content errors use InvalidRunV2.

Use the exact domain-separated formulas from dependency-deployment-v2.md,
including the inner packed-byte hash and unchanged c0ProfileId domain. No
CREATE2 derivation or codehash observation is implied by a commitment helper.

Selection decode first requires 288 bytes; use the exact ABI scalar types and
compare re-encoding to reject noncanonical words. Validate version1, finality
kind0..3, `(kind==2 ? param>0 : param==0)`, upgrade kind0/ref0,
gas>=16,777,216, exact null-policy hash and nonzero executor. Derive:

```solidity
bytes32 policy = keccak256(abi.encode(
  keccak256("efs2/mvp-c0/initial-policy/1"),
  value.nullPolicyHash, experimentCommitment
));
return abi.encode(value.initConfigVersion, value.finalityRuleKind,
  value.finalityParam, value.upgradeAuthorityKind, value.upgradeAuthorityRef,
  value.declaredTxGasLimit, policy);
```

- [x] **Step 4: Challenge every meaningful input and framing boundary.**

Add exact success/refusal assertions for short/trailing/version/zero/duplicate
deployment inputs; every field mutation changes the appropriate commitment or
refuses. Validate cross-version rejection in both languages. Test every
truncated prefix of compact literal frames once, not repeated stress loops.
Exercise V1 array counts1/64/65, label lengths1/64/65, unsigned order and the
new reserved entry missing/duplicate/different digest/opening mismatch.
The reserved label is 19 bytes: root checked the unchanged V1 encoder plus
162-byte wrapper, giving largest valid required-label seed 13,645 bytes and
smallest 730 bytes. Construct and accept those extremes; reject a padded
13,690-byte frame as malformed rather than calling it a valid maximum. Reject
the grammar ceiling+1 before decode/copy. Keep the documented 712..13,690
outer guard and the stricter content rules distinct.

Selection tests cover all valid finality combinations, invalid kind/parameter,
noncanonical high bits, gas floor-1/exact, u64 max, unknown version, nonzero
upgrade/ref, zero/altered executor, wrong null-policy, wrong domain, trailing
data and altered expected digest. Valid executor mutation changes the seed
selection commitment; it does not prove caller acceptance. InitConfig tests
change each field, length223/224/225, wrong deployment commitment and wrong
policy. Derived configuration contains no executor field.

JS tests must reject holes and prototype-supplied entries in BOTH original
commitment arrays before delegating to V1; check before spread/Array.from/copy.
Do not import producer objects to assert their own expected output. Preserve
byte/numeric widths at u64 max and refuse Number/coercion in wide fields.

- [x] **Step 5: Independently encode and compare a deployed pure receiver.**

Implement the JS reader with byte-bounded input validation before Buffer
allocation and no automatic normalization. Reuse only the unchanged V1 JS
seed implementation; locally define the new V2/selection framing and use
manually assembled bytes for expected vectors. Keep literal commitment hashes
independent of round-trip assertions. Deploy through the existing managed
`withStateful` runner with its normal caps/cleanup, as the request tests do;
do not edit that transport. Compare every decoded field and exact encoded
bytes/hash for compact valid fixtures, selection/InitConfig opening and u64
boundaries. Report pure receiver sizes/gas only, not real initialized Core.

- [x] **Step 6: Verify, self-review and commit only owned files.**

Run fresh `forge build --ast --build-info --force`, full Core `forge test`,
and `node --test test/*.test.mjs ../2026-09-05-c0-admission/integration.test.mjs ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs`
with the existing pinned compiler. Run the unchanged foundation's focused
V1 run-codec Node tests and Foundry RunCodecTest to prove it stays unchanged.
Check `git diff --check`, exact staged paths and actual trailers. Record
warnings honestly. Report command/exit/counts, RED/GREEN, bytes/resources,
source pins, cleanups, exact commit and all remaining initialization gaps.
No push; root dispatches independent task/final review and publishes.
