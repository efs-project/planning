# Dependency-aware deployment for the linked C0 prototype

**Status:** selected engineering direction for the next disposable run;
encoding and full G0 integration are unimplemented. Not permanent EFS bytes.

The [measured linked slice](stateful-verification.md#selected-linked-layout)
needs four fixed components in the complete run: Core, state byte carrier,
AdmissionLibrary and PreparationHelper. The existing foundation's V1 codec
commits only Core and carrier. Checking Core alone would leave executed
dependencies outside the deployment commitment. Preserve V1 implementations,
vectors and reports unchanged; introduce an explicitly versioned V2 build.

This is a closed profile, not a dependency registry, generic plugin system or
upgrade path. The admission library is trusted Core implementation with full
Core storage authority. The helper is immutable stateless preparation invoked
through the existing bounded STATICCALL boundary. Neither is arbitrary
Type-author validation code. The actual authenticated Core wrapper, carrier
V2 seal and complete bootstrap still need implementation.

## Seed inputs V2

Use the [V1 packed rules and exact field order](../2026-09-04-mvp-c0-foundation/run-codec.md#packed-manifest-codec),
with this explicit wrapper and suffix:

```text
u16(2)
all SeedInputs fields in their existing order and widths
admissionLibraryCreate2Salt:bytes32
preparationHelperCreate2Salt:bytes32
admissionCreationCodeTemplateHash:bytes32
preparationCreationCodeTemplateHash:bytes32
coreLinkReferencesHash:bytes32
```

This adds 162 bytes for the same original fields. V1 starts with a namespace
length, not a version word: do not reinterpret existing V1 bytes as already
version-prefixed. Keep the existing namespace as a run family label. The V2
entrypoint requires version 2, exact framing and no suffix; version is not
guessed from a vaguely plausible byte length. All old validation constraints
remain; new template/link-map hashes must be nonzero, new salts may be zero.

For V2, `coreCreationCodeTemplateHash` hashes creation bytecode with each
compiler-declared link window replaced by twenty zero bytes. It is not the
hash of Solidity's textual `__$…$__` placeholders or of a prematurely linked
address. The sole allowed link target is the pinned AdmissionLibrary. Helper
and library creation templates have no unresolved links or constructor args
in this profile. A change to either dependency shape requires an explicit
profile refinement, not recursive automatic dependency discovery.

The existing sorted source/toolchain commitment arrays additionally pin the
exact standard-JSON input/output artifacts for all four components, including
runtime templates, creation/runtime link references and immutable references.
Their existing count, label and nonzero-digest rules remain. Machine paths
and local accounts/keys are not commitment inputs.

Canonical Core link-map bytes are:

```text
u16(1)
u16(creationReferenceCount)
  repeated: u32(byteOffset) || u8(width)
u16(runtimeReferenceCount)
  repeated: u32(byteOffset) || u8(width)
```

Within each list, offsets strictly increase; widths are exactly 20, ranges
are nonoverlapping and inside their respective artifact bytecode. Validate
counts against the remaining encoded bytes before allocation, and require
the complete list to equal the pinned compiler artifact's references for the
sole allowed target. Reject omissions, extras, other libraries and unresolved
windows. The map version has no implicit target name: this fixed profile binds
every listed window to AdmissionLibrary. `coreLinkReferencesHash` is keccak256
of these complete packed bytes. Runtime link windows and immutable patches
are separate artifact metadata and must not be confused.

```text
D_SEED_V2 = keccak256("efs2/mvp-c0/experiment-seed/2")
experimentSeed = keccak256(abi.encode(D_SEED_V2, keccak256(seedBytesV2)))
```

## Deployment V2

The exact packed frame is **498 bytes**, with one fixed ordering:

```text
u16(2)
experimentSeed:bytes32
Core component
ByteStore component
AdmissionLibrary component
PreparationHelper component

Component = address:20 || create2Salt:32 || initCodeHash:32 || runtimeCodeHash:32
```

Each component is 116 bytes. After the version word, the seed/Core/carrier
fields retain the old 264-byte body's order and widths, followed by the two
new components. All four addresses are nonzero and pairwise distinct; all
code hashes and the seed are nonzero; salts may be zero. Exact V2 decoding,
byte-identical re-encoding and no trailing bytes are required. A V1 decoder
must still reject this frame, never consume a 264-byte prefix and ignore it.

```text
D_DEPLOY_V2 = keccak256("efs2/mvp-c0/experiment-deployment/2")
experimentCommitment = keccak256(abi.encode(
  D_DEPLOY_V2, experimentSeed, keccak256(deploymentBytesV2)))
c0ProfileId = keccak256(abi.encode(
  keccak256("efs2/mvp-c0/profile/1"), experimentCommitment))
```

The existing final profile formula can consume the domain-separated new
commitment. No WritePlan field or Stage A InitConfig field changes are implied.
This commitment records identity; it is not by itself proof of factory/initcode
provenance or code correctness.

## Acyclic construction and deployment

1. Freeze sources, toolchain, templates/link map, salts, semantic roots and
   the full resource report; independently agree on V2 seed bytes and seed.
2. Derive helper and library initcode from their no-argument templates. Compute
   both CREATE2 addresses using the seed's existing deployment factory. Neither
   dependency references Core, carrier, seed or final commitment.
3. Predict the library runtime using its known address and exact compiler
   immutable-reference metadata. Its own-address direct-call guard is a
   runtime patch, not an initcode dependency or an address cycle. Verify the
   complete expected runtime later against actual deployed bytes.
4. Link the known library address into every declared Core creation window.
   The proposed actual C0 Core constructor is:

   ```text
   (bytes32 experimentSeed, bytes codexConstantsBytes,
    address preparationHelper, bytes32 preparationRuntimeHash,
    bytes32 admissionRuntimeHash)
   ```

   AdmissionLibrary's address comes from the fixed compiler link, not a second
   separately mutable target parameter. Core construction must reject wrong
   or missing dependency code. The test host's synthetic `Init` constructor
   is not this real G0 constructor. Neither constructor takes the carrier
   address or final experiment commitment.
5. Compute Core initcode/hash/address. Only then construct carrier initcode
   with the unchanged tuple `(seed, coreAddress, fileCap, rangeCap)`. Predict
   its address and actual runtime, including its constructor immutables.
6. Before any deployment, G0's two independent implementations must agree on
   all four initcodes/addresses and runtime expectations. Then deploy/verify
   library and helper as the G1 dependency prelude. Deploy the unsealed
   carrier and uninitialized Core in the existing ordered lifecycle. Verify
   actual complete runtimes and all immutable getter values; never accept a
   raw compiler template hash where links/immutables alter deployed bytes.
7. Form the V2 deployment commitment from independently verified actual code.
   Initialize Core and seal its carrier in the existing atomic enclosing call.
   A failed dependency, context, root or seal assertion rolls back that call.

This explicitly refines G0's two-initcode construction and G1's two-component
wording. The later G2–G12 obligations remain, including capability activation
before application writes. A three-contract trusted-host smoke does not
execute this four-component bootstrap or its authority checks.

## V2 carrier seal and read-back

The new carrier build accepts only the exact 498-byte frame, retains those
bytes and their V2 commitment, and keeps the existing expected-Core-only,
one-time seal and phase checks. Verify the seed and Core/self addresses,
nonempty code plus actual code hashes for all four components, and agreement
between dependency addresses/hashes and Core's pinned identity getters.
Preserve atomic rollback, fixed ChunkTree identity and write-phase semantics.
The constructor tuple can stay unchanged; the new runtime/template hashes
cannot. Old V1 tests and artifacts describe their original component only.

The reader independently reconstructs all four actual code identities,
compiler links/patches, CREATE2 derivations, deployment bytes/commitment and
retained Core/carrier contexts at one explicit basis. A provider observation
is not a consensus proof. Missing dependency evidence yields UNKNOWN, not a
healthy verified Core inferred from its own codehash.

## Validation before using this as G0 evidence

- Independent packed encoders/decoders and literal vectors for seed,
  link map and deployment; V1/V2 cross-rejection, short/trailing/unknown-version
  input, zero/duplicate addresses, malformed/overlapping/missing links.
- Wrong-but-self-consistent dependency/template substitution against the
  independently pinned artifacts; actual library address patch versus raw
  runtime template; constructor mismatch and later code mismatch refusal.
- Normal-limit CREATE2 deployments of all four real components and atomic
  initialize/seal failures leaving no partial initialized or sealed state.
- Complete state-only recovery, expected-root/capability/authority checks and
  aggregate runtime/initcode/gas/storage/read/proof/client-memory report.

The measured slice's constructor, link offsets and runtime hashes are inputs
to reproduce that slice only; do not freeze them into this future full run.
The admission library's 386-byte headroom and legal large-cache pressure case
remain explicit followups. There is no immediate owner question: these are
reversible engineering tasks. Public deployment and permanent adoption still
require separate authority.

Read-only bootstrap review approved this specification after checking the V1
codecs/manifest and retained compiler patch metadata. That closes this scoped
design review, not the executable validation list above.
