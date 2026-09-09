# Fixed read libraries for the C0 prototype

**Status:** synthetic revision-one host implementation and normal deployment
evidence complete; see [Binding verification](binding-reads-verification.md).
Authenticated C0 and V3 integration remain pending. Not a protocol freeze.

The [Binding size gate](binding-reads-verification.md) found a 26,736-byte
combined host against the unchanged 24,576-byte runtime limit. Source-identical
compile-only shells measure 23,855 bytes without raw oracle ports and 21,458
without those ports or trusted publication. Neither shell includes the actual
authority wrapper or the remaining page/Scope engine. Removing historical
association checks saves only 621 bytes and still leaves the full host over
the limit. That candidate is **not selected**: preserve the read specification.

## Selected boundary

Keep one Store and the existing exclusive admission write path. Move executable
read code behind two fixed Solidity library boundaries, not merely source files:

| Fixed library | Exposed library forwarders | Internal implementation |
|---|---|---|
| PointReadLibrary | getTypeSchema, getTypeOrigin, intrinsicTypeGroupBytes, getRecord, getEnvelope, getOccurrence, getOccurrenceByOrdinal, getReceipt | StatePointReads |
| QueryReadLibrary | getBindingHead, getBindingAtBasis, readHistory | StateBindingReads |

Each library method is `external view`, with `StateStore.Store storage s` as
its first parameter and the same remaining parameters/returns as the existing
internal method. No library state variables, constructor arguments, mutators,
fallback, arbitrary callback, dependency registry or configurable routing.
Use only compiler-generated storage-reference calls, never hand-encoded slot
pointers or a generic delegatecall dispatcher. Keep both libraries link-free:
QueryReadLibrary compiles required internal point helpers into itself rather
than calling PointReadLibrary. Verify this in actual compiler references.
QueryReadLibrary implements only the three named methods in this increment;
its name is not evidence that the future page engine fits or exists.

These storage-reference calls use DELEGATECALL. The libraries are trusted
implementation with access to the caller's storage, not sandboxed extensions.
Solidity `view` is not itself a runtime sandbox for an ordinary transaction.
An onchain consumer's STATICCALL makes the complete read call tree static;
normal and static-consumer tests must both preserve all observed retained state.
Source review must also exclude assembly writes, mutators and hidden external
effects. Pinning malicious code would not make it safe. Calling a library
directly is not the EFS read API and does not read Core's Store.
The expected hashes must independently derive from the pinned source/toolchain,
not simply echo constructor inputs or observed provider code.

## Normal test host

`BindingReadHarness` now extends unchanged `StatefulHarness`, rather than
inheriting internally inlined point/occurrence forwards. It explicitly exposes
all eleven existing read signatures through the two libraries, preserving
inputs, tuple components, outputs and mutability. Inherited raw oracle ports,
trusted publication, Store layout and the base constructor remain unchanged.
The older point/occurrence hosts and their evidence remain unchanged controls.

```solidity
constructor(StateKernel.Init memory init, address helper,
  bytes32 helperHash, bytes32 admissionHash,
  bytes32 pointReadHash, bytes32 queryReadHash);

address public immutable pointReadLibrary;
bytes32 public immutable pointReadCodehash;
address public immutable queryReadLibrary;
bytes32 public immutable queryReadCodehash;
error ReadCodeMismatch(uint8 role); // test-host error: point=1, query=2
```

Addresses come only from compiler links to those exact libraries. At construction
and before every respective read, require nonempty code and the exact retained
runtime hash. Expose the linked addresses/hashes through the four immutable
getters. No separately supplied address may override a compiler link. Dependency
guards precede read-state/caller guards; once dependencies match, all existing
read error/absence/basis precedence stays intact. This host-specific error is
not a newly adopted permanent Core INDEX signature.

## Deployment commitment consequence

The [V2 deployment design](dependency-deployment-v2.md) commits four components
and has a sole-target AdmissionLibrary link map. It **cannot represent this
layout**. Do not extend its bytes, reinterpret a V2 frame or claim V2 bootstrap
completion after deploying this host.

The next actual C0 bootstrap must use the [explicitly versioned closed V3 profile](dependency-deployment-v3.md)
covering Core, ByteStore, AdmissionLibrary, PreparationHelper, PointReadLibrary
and QueryReadLibrary. Preserve V1/V2 codecs, vectors and historical evidence.
Its seed/template commitment must cover both new libraries and their salts;
its Core link map must identify exact Admission/PointRead/QueryRead targets,
not merely unnamed offsets. All creation/runtime link windows and runtime
own-address/immutable patches must match independently pinned compiler artifacts.
No generic dependency graph or upgrade mechanism is implied.

The real Core constructor will additionally pin both read runtime hashes; their
addresses still come from compiler links. All library/helper addresses can be
derived before Core, and carrier after Core, preserving acyclic construction.
Initialize/seal/read-back must verify all six components. The exact V3 grammar
is now specified; codec vectors,
constructor integration and G0 provenance are a separate finite implementation
step after the library artifacts have been measured. The current synthetic
Init host has five components and does not stand in for that bootstrap.

## Required evidence for this increment

- Normal limits for the host and both new libraries: runtime24,576 bytes,
  full transaction initcode49,152 bytes and transaction gas16,777,216.
  Measure full constructor encodings, not creation templates alone.
- All eleven host ABI shapes equal the prior host, with exact target-aware
  creation/runtime link matching and complete deployed runtime comparison.
  No assumption that every link is AdmissionLibrary.
- Constructor and later read refusals for absent/incorrect library code or
  hash, on each family; explicit synthetic substitution fixtures are labeled.
- Static onchain-consumer calls, unchanged retained-state snapshots after
  reads, the full original Binding matrix and independent basis-pinned fold.
- Original point/occurrence/write regressions remain controls; no weakening
  of current checks, artificial gas/size cap increase or duplicate test count.

The cost is two extra fixed deployments, pinned code identities and delegated
read-call overhead. The benefit to test is a deployable complete public read
surface with Core room for its unfinished authority/page integration. Neither
benefit nor whole-MVP readiness is assumed before actual measurements.
