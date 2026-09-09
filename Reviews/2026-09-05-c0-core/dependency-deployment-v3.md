# Closed V3 deployment profile for the fixed read libraries

**Status:** selected successor specification for the disposable C0 run; codecs,
real constructor and initialize/seal integration are unimplemented. The
[read-library packaging](read-library-layout.md) now has separate
[synthetic-host measurements](binding-reads-verification.md#september-9-linked-implementation-and-actual-managed-reads).
This is not permanent EFS encoding or G0 evidence.

This supersedes the four-component/sole-link choices in the
[V2 deployment specification](dependency-deployment-v2.md) for the next actual
C0 host. Preserve the implemented V1/V2 codecs and their literal vectors as
controls. Keep the [initialization semantics](initialization-boundary.md):
authenticated seed/selection, explicit one-time executor, exact Codex/groups,
actual-block genesis, exclusive Store and atomic carrier seal. Only dependency
inventory, versioned run framing, link targeting and associated bounds change.

## Seed V3

Exact packed order, big-endian fixed-width integers as in V2:

```text
u16(3)
unchanged exact V1 SeedInputs bytes
admissionLibraryCreate2Salt:bytes32
preparationHelperCreate2Salt:bytes32
pointReadLibraryCreate2Salt:bytes32
queryReadLibraryCreate2Salt:bytes32
admissionCreationCodeTemplateHash:bytes32
preparationCreationCodeTemplateHash:bytes32
pointReadCreationCodeTemplateHash:bytes32
queryReadCreationCodeTemplateHash:bytes32
coreLinkReferencesHash:bytes32
```

The wrapper adds 290 bytes to V1: version2 plus suffix288. This is **not**
V2 with four words appended: V2's five suffix fields have a different layout.
Require version3 before interpreting any field. Bound raw bytes to840..13,818
before copying the V1 slice `encoded[2:encoded.length-288]`. The unchanged V1
grammar and exactly one reserved `c0/init-selection/1` commitment narrow actual
valid lengths to858..13,773; the outer ceiling is not itself a valid fixture.
Decode/encode must preserve V1 field widths, sorted nonempty commitment arrays,
label/digest rules and strict full consumption. JS validates dense own array
entries before delegation to its independent V1 codec, without coercion.

Salts may be zero. All five suffix hashes must be nonzero. Preserve the same
namespace and source-label meaning; version is explicit, not inferred from
namespace or length. The selection, null-policy and InitConfig codecs remain
unchanged. Their commitment is not initialization authority by itself.

The four library/helper templates are link-free and have no constructor args.
Core's creation template replaces every compiler-declared link window with
twenty zero bytes before hashing. The exact compiler source/artifact commitment
inventory covers all six components and every creation/runtime reference and
immutable patch. Preserve complete independently archived artifacts: their
hashes cannot reconstruct missing construction material.

```text
D_SEED_V3 = keccak256("efs2/mvp-c0/experiment-seed/3")
experimentSeed = keccak256(abi.encode(D_SEED_V3, keccak256(seedBytesV3)))
```

## Target-aware Core link map, version2

This map describes compiler references, not a dynamic dispatch table:

```text
u16(2)
u16(creationReferenceCount)
  repeated: target:u8 || byteOffset:u32 || width:u8
u16(runtimeReferenceCount)
  repeated: target:u8 || byteOffset:u32 || width:u8

target1 = AdmissionLibrary
target2 = PointReadLibrary
target3 = QueryReadLibrary
```

The runtime count follows the creation entries, not both counts in one header.
Total length is `6+6*(creationReferenceCount+runtimeReferenceCount)`.
Target codes are a separate namespace from component order:1→component3,
2→component5 and3→component6. Reserve the following runtime-count field while
checking the creation list against remaining input bytes.

Within each list, byte offsets strictly increase, width is20, windows do not
overlap and every window fits its respective exact template. All three targets
appear in each list. Reject other target values, duplicate windows, omissions,
extras and unresolved links. Require exact equality to the pinned compiler
references for `src/AdmissionLibrary.sol:AdmissionLibrary`,
`src/PointReadLibrary.sol:PointReadLibrary`, and
`src/QueryReadLibrary.sol:QueryReadLibrary`; helper is a constructor-pinned
address, not a compiler library target. Runtime immutable windows are a
separate inventory and must not overlap link windows.

Bounds follow the unchanged bytecode caps: at most2,457 nonoverlapping creation
windows and1,228 runtime windows. The packed map is at most22,116 bytes;
require minimum42 bytes for three references in each list. Check each count
against remaining bytes **before** allocation/iteration; require exact framing
and no suffix. These broad grammar bounds do not assert that an actual template
can use every window while also containing code. Exact artifact matching is
the stronger constraint. Zero creation-template slots represent placeholders,
not a deployed zero-address link.

`coreLinkReferencesHash = keccak256(completePackedLinkMapV2)`.
Map V1's unnamed Admission-only windows cannot be consumed as map V2. This
check belongs to independently reproduced G0 artifact construction; giving an
onchain decoder a caller-selected matching artifact would not prove provenance.

## Deployment V3

The exact packed frame is730 bytes:

```text
u16(3)
experimentSeed:bytes32
Core component
ByteStore component
AdmissionLibrary component
PreparationHelper component
PointReadLibrary component
QueryReadLibrary component

Component = account:address20 || create2Salt:bytes32 ||
            initCodeHash:bytes32 || runtimeCodeHash:bytes32
```

Each component is116 bytes, at byte offsets34/150/266/382/498/614. Require all
six accounts nonzero and pairwise distinct (15 comparisons), seed/code hashes
nonzero, exact version/framing and byte-identical re-encoding. Salts may be
zero. Never accept a V1/V2 prefix, append a suffix to a V2 frame, or guess a
decoder from a plausible length. Field changes either refuse or change the
commitment; swapping identical-looking roles is not canonical normalization.

```text
D_DEPLOY_V3 = keccak256("efs2/mvp-c0/experiment-deployment/3")
experimentCommitment = keccak256(abi.encode(
  D_DEPLOY_V3, experimentSeed, keccak256(deploymentBytesV3)))
c0ProfileId = keccak256(abi.encode(
  keccak256("efs2/mvp-c0/profile/1"), experimentCommitment))
```

Keep the unchanged profile formula and downstream InitConfig/genesis formulas.
Different versioned deployment commitments naturally produce different run
identities. No application Type, Record, WritePlan field or authority rule is
changed by this dependency inventory.

## Active Codex interpretation

The still-unminted outer artifact advances to `codexRevision=3` and
`C0_GRAMMAR_REVISION=2`; MC1, protocol0/0 and the embedded AUTHORITY/INDEX
revision2 stay unchanged. The [Codex domain sheet](codex-materialization.md)
uses only the two new `/3` run domains in its same25-row domain inventory;
old `/1` and `/2` run domains are historical controls, not extra active rows.
The [outer sheet](outer-materialization.md) replaces its two seed guard rows
with the V3 names/bounds and its fixed Seed/Deployment grammar with this
successor. Other numeric, code, raw-string, Type and identity meanings stay
unchanged. This explicit outer/grammar version change avoids silently changing
the old artifact interpretation. No complete revision2 Codex was minted.

## Actual Core and carrier join

Actual Core constructor, replacing V2's five arguments:

```text
(bytes32 experimentSeed, bytes codexConstantsBytes,
 address preparationHelper, bytes32 preparationRuntimeHash,
 bytes32 admissionRuntimeHash, bytes32 pointReadRuntimeHash,
 bytes32 queryReadRuntimeHash)
```

The three library addresses come solely from fixed compiler links. Require
nonempty code and source-derived expected actual runtimes at construction and
before their respective calls, including the read-library guards. Retain the
four new read-library identity getters specified in read-library-layout.md.
The real Core must not inherit the synthetic Init/trusted-publication host.
No carrier address or final commitment is a constructor argument.

G0 independently derives the four library/helper CREATE2 addresses first,
patches any compiler-declared library own-address runtime references, then
links all three targets into Core creation/runtime. After encoding the actual
seven constructor arguments, derive Core initcode/address; only then derive
carrier with unchanged `(seed,coreAddress,fileCap,rangeCap)` constructor tuple.
No dependency references Core, carrier, seed or final commitment. Independently
agree on all six complete initcodes/addresses/runtime expectations before
deployment. Verify actual deployed bytes and all getters, not templates or
self-asserted expected hashes. The order remains acyclic.

The initializer's transport changes field names to `deploymentBytesV3` and
`seedInputsV3`; its other arguments, ordered four groups, selection288 and
InitConfig224 remain unchanged. It must use the V3 seed/commitment functions,
deployment730 and seed13,818 outer bound, verify all six code identities,
salts/CREATE2 consistency and source pins, then derive the same actual-block
genesis formulas. Preserve explicit executor gating; onchain code consistency
does not establish original constructor provenance.

The new carrier accepts only DeploymentV3, retains its exact730 bytes, and
checks seed, expected Core/self, all six actual runtime hashes and all Core
dependency identity getters. Keep expected-Core-only, one-time seal, phase,
fixed ChunkTree identity and complete rollback. Initialization and seal remain
one atomic enclosing call. V1/V2 carriers stay unchanged controls, not adapters.

Recovery independently reconstructs every component/runtime/link/immutable,
V3 bytes/commitment and actual-block genesis at an explicit source basis.
Missing evidence is UNKNOWN. Provider observations are not consensus proofs;
source/template provenance still requires archived independent G0 artifacts.

## Finite gates before adoption by the actual run

1. Independent JS/Solidity exact seed/deployment encoders and decoders, literal
   vectors, all decoded fields including wide u64 values, V1/V2/V3 rejection,
   exact compact/extreme valid framing and malformed bounds/content.
2. Independently encoded target-aware link maps against actual artifacts:
   count/width/target/offset/order/overlap/immutable collision and missing/extra
   window refusals, changed-target same-offset substitution, no link-free
   dependency secretly importing another external library.
3. Full normal-limit deployments of all six real components, seven-argument
   constructor mismatch and later code mismatch refusals, authenticated
   initialize/seal/read-back plus atomic-failure retries. Synthetic pure-codec
   or trusted-host success is not this gate.
4. Aggregate initialization/runtime/initcode/gas/storage/read/proof/client-memory
   report and required capabilities/Files journeys; no size-limit waiver or
   default assumption that moving code to Query makes all future queries fit.

No owner decision is needed to implement and challenge this disposable
successor. The extra dependencies and their measured cost must remain visible
in the MVP handoff; public deployment, durable data and permanent adoption
still require separate authorization.
