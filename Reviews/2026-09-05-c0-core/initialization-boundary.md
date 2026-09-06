# Real C0 owner and authenticated bootstrap inputs

**Status:** selected reversible engineering input, not an implemented initializer
or completed G0–G12 run. This refines the linked V2 wrapper only; it does not
change Stage A InitConfig/1, candidate Type bytes or permanent EFS authority.

## One real owner, no trusted test entrypoint

Create `src/MvpC0Core.sol` with its own `StateStore.Store`. Keep
`test/StatefulHarness.sol` separate: its synthetic initialization and public
`publishTrustedForTest` must never be inherited by the authenticated Core.
A read-only abstract base is optional deduplication, not a prerequisite; it
may contain no initialization, mutation or caller-supplied VerifiedContext.
Raw getters alone do not implement G3's bounded point/page capabilities.

The original [five-argument constructor](dependency-deployment-v2.md#acyclic-construction-and-deployment)
belongs to the retained four-component V2 proposal. The later
[fixed read-library layout](read-library-layout.md) requires the actual Core
constructor also to pin both read-library runtime hashes, under a new closed
V3 deployment profile. The initialization semantics below are unchanged; the
old constructor/component count is not sufficient for that successor.
It retains the seed and exact bounded Codex, pins the compiler-linked admission
library and preparation helper, checks actual dependency code, and remains
UNINITIALIZED. No synthetic Realm/revision ID, application admission, carrier
address or final experiment commitment is a constructor input.

## Carry the evidence needed to verify initialization

The old two-argument initializer lacks the seed preimage and original group
bytes. Repeating a seed hash in DeploymentV2 does not prove its Type/capability
roots. `StateKernel.initialize` consumes supplied Realm/revision IDs and hashes
group-1/2 bytes; the real wrapper must derive/authenticate those inputs first.

Use this run-local transport:

```solidity
initializeC0(
    bytes calldata initConfigBytes,
    bytes calldata deploymentBytesV2,
    BootstrapMaterial calldata material
)

BootstrapMaterial = (
    bytes seedInputsV2,
    bytes initializationSelectionBytes,
    bytes intrinsicGroupBytes,
    bytes[4] orderedGroupBytes
)
```

This is one-time verification carriage, not another application admission
path. G2 installs only the intrinsic meta-Type; the four ordinary groups still
enter through G4's authenticated 6/3/6/1 sequence. Do not duplicate their full
bodies in a second application store. Retain the seed/selection/genesis
preimages and verified expected group hashes; retain exact group bodies when
ordinarily admitted, so later recovery is state-readable.

Bound outer lengths before decoding/copying. V2 deployment is exactly 498
bytes, InitConfig exactly 224, selection exactly 288. The existing seed grammar
gives V2 a maximum 13,690 bytes: V1's 472 fixed bytes (including both array
counts), plus at most 128 entries of 102 bytes, plus the V2 suffix/prefix 162.
Its theoretical minimum is 712; requiring the reserved selection entry below
narrows valid instances further. Each raw group remains within the existing
8,190-byte meta-field bound and must pass canonical group/member validation.
The four fixed array positions are not caller-selected inventory length.

Root source inspection found current raw groups 1,765/1,022/2,345/860 bytes
and the current intrinsic candidate 85 bytes. These are reproducible candidate
sizes, not a selected initializer gas/call/storage budget. Complete Codex size,
aggregate initialization bounds and normal-limit deployment/initialization
measurements remain required. Do not borrow the publication call ceiling for
this different one-time transport or relax EVM limits to make it fit.

The [Codex intrinsic selection](codex-materialization.md#selected-exact-intrinsic-opening-and-derived-type-rows)
now pins that existing 85-byte candidate's exact opening and derived meta-Type
for this disposable artifact. Shape-compatible substitute metadata is not an
alternative accepted opening; this selects bytes, not an initializer budget.

## Pin configuration and a one-time bootstrap executor

Existing seed fields do not uniquely choose finality or the declared gas
ceiling. Author addresses are not implicit initialization authority, and the
opaque chain-config hash cannot choose fields without a specified opening.
Use exactly one reserved label `c0/init-selection/1` in the existing sorted
`sourceCommitments` array, whose digest is `keccak256(selectionBytes)`:

```text
D_SELECTION = keccak256("efs2/mvp-c0/initialization-selection/1")

selectionBytes = abi.encode(
  D_SELECTION,                 // bytes32
  uint16 initConfigVersion,     // 1
  uint8 finalityRuleKind,
  uint32 finalityParam,
  uint8 upgradeAuthorityKind,   // NONE = 0 in this immutable C0
  bytes32 upgradeAuthorityRef,  // zero
  uint64 declaredTxGasLimit,
  bytes32 nullPolicyHash,
  address bootstrapExecutor
)
```

Exactly nine words / 288 bytes; require exact domain, scalar widths, canonical
re-encoding and no suffix. Require the reserved label once, the ordinary
InitConfig finality rules and gas floor, immutable kind/ref, nonzero executor
and the exact null-policy hash below. Do not add this deployment-selected
configuration to the Codex or change the seed field layout. The required label
and interpretation are an explicit V2 run refinement, not an existing V1 rule.

For this no-additional-policy C0 runtime, select exact null-policy bytes as
`abi.encode(keccak256("efs2/mvp-c0/null-policy/1"))`: one 32-byte domain word.
`nullPolicyHash = keccak256(nullPolicyBytes)`. This declares no additional
Realm policy hook or external callback; authority, structural/reference checks,
Files rules and atomic state preflight still apply. It is a new run-local
descriptor, not a claim B0 already supplied these bytes or that policy can
validate arbitrary Type-author code.

The public bootstrap-executor address is chosen explicitly at G0 and must
exist independently of this Core's seed/address. It may be the experiment
operator, but no authority is inferred merely from a deployer, factory,
schema/bootstrap author or payer field. Require exact `msg.sender` equality
after authenticating the seed and selection; never use `tx.origin`. The role
can perform only this one initialization. It creates no setter, upgrade key,
application authorship, user wallet approval or continuing administrator.

Why not permissionless yet: checking a supplied CREATE2 initcode hash plus
actual runtime/getters does not prove construction from the pinned template.
A different constructor can deploy an equivalent carrier at another address,
changing the final deployment/profile commitment. Pinning only configuration
does not prevent that race. The explicit executor closes unauthorized races;
it does **not** make an erroneous/compromised executor's package trustworthy.
G0's two independent implementations and post-state reconstruction remain
mandatory. Key loss before initialization requires a fresh disposable run;
do not add recovery authority for this one-time laboratory role.

Permissionless initialization remains an unselected alternative. It needs
bounded construction material to derive the deployment package: actual carrier
creation bytes plus constructor, fixed helper/library templates, and Core's
zero-window template/link map plus constructor. Hashing a template hash beside
constructor arguments is not hashing initcode. Measure that extra path before
selecting it; do not silently describe consistency checks as provenance.

## Ordered real initialization

Before any mutation, the real wrapper must:

1. Bound/decode exact SeedInputsV2, recompute the constructor's seed, and
   authenticate the reserved selection opening and bootstrap executor. Check
   the seed's Codex hash against retained exact bytes.
2. Validate complete Codex ownership/intrinsic IDs, match the selected exact
   intrinsic group opening, and validate the exact versioned capability
   manifest. Derive group hashes/root and 6/3/6/1 members/dependency
   closure from raw groups; compare to the seed's expected root, never the
   same caller's unauthenticated root. Derive the enabled capability root from
   actual Codex bytes, not a separate supplied manifest, and require
   `derivedIndexCapabilityRoot == decodedSeed.indexCapabilityRoot` before
   mutation. Matching Codex hashes does not replace this separate equality.
3. Decode DeploymentV2; check seed, actual Core/carrier/dependency identities,
   salts, code hashes, CREATE2 consistency and carrier context/caps. G0 must
   already have proved the source/template/link/immutable construction that
   these onchain consistency checks cannot establish alone.
4. Derive experimentCommitment/c0ProfileId and the unchanged C0 initial-policy
   formula using the verified null-policy bytes. Build the seven-field
   InitConfig from the selection plus that policy commitment; require exact
   equality to the supplied 224 bytes.
5. Derive coreProfileId, genesisCommitment, RealmId and revision-1 descriptor/ID
   using actual chain/Core/initialization-block facts. Build `StateKernel.Init`
   internally; no public arbitrary VerifiedContext or supplied genesis IDs.

Only then initialize the kernel's intrinsic state, retain exact genesis inputs
and verified run roots/caps/authors, enter BOOTSTRAP_OPEN and call the V2
carrier's one-time seal. All storage and the seal share one rollback boundary.
A failure leaves both uninitialized/unsealed; no partial capability claim or
application Record/Binding survives. No mutable configuration setter or
parallel authority-state store is needed.

The genesis formula includes the actual initialization block. Even an authorized
executor cannot promise its inclusion block or a predeployment-fixed RealmId.
Read back and independently reconstruct the successful initialization before
creating Realm-bound bootstrap WritePlans. A repeated initialize call refuses;
the runner may recognize an already completed exact run only through full
read-back, not by treating every one-time guard revert as success.

Do not pin the final `initConfigHash` in the seed: its policy field includes
the final deployment commitment, whose addresses/initcode depend on the seed.
The selection above commits only predeployment values and avoids that cycle.

## Falsifiers and next implementation sequence

- Missing/duplicate selection label; mismatched seed/Codex/group/capability
  opening; reordered/self-consistent substituted groups; malformed selection
  or InitConfig; altered executor/finality/gas/null-policy: refuse before writes.
- Unrelated caller with an otherwise exact package: refuse without consuming
  initialization. The authorized identical retry can initialize successfully.
- Alternative same-runtime carrier construction: unauthorized attempt refuses;
  the independent G0 reader rejects wrong template provenance even if an
  authorized caller's onchain consistency checks could pass.
- Wrong dependency code/context/cap or carrier seal failure: whole-call
  rollback, then unchanged-input success once the valid prerequisites exist.
- G2 installs no G4 application group. Before G4, all eighteen claimed G3
  capabilities have real bounded point/page/continuation evidence.
- State-only reconstruction reproduces retained seed/selection/roots,
  four-component deployment bytes, actual runtime identities, actual-block
  genesis and revision 1 without trusting stored ID mirrors or requiring the
  original checkout. Source/template/initcode provenance additionally requires
  independently archived exact G0 templates, link maps and compiler artifacts;
  their retained hashes cannot recover missing construction material.

Next: source-input/V2/genesis codecs → real owner plus atomic V2 carrier seal →
required capability endpoints → independent G0 freeze → four-component
initialize/seal/read-back/rollback journey. Keep the current request component
on that same Core path; do not add an intermediate authenticated test Core.

What could have gone better: review the actual initialization input list
alongside the expected-root requirement earlier. A seed commitment is not its
opening, one-time is not authorized, and runtime equality is not constructor
provenance. These are engineering gaps found before integration, not new owner
product decisions. The selected role is disposable-run authority only.

The scoped independent design review approved the structure with two precision
edits, applied here: explicit capability-root equality and separation of
state-readable consistency/genesis from separately archived construction proof.
That review does not execute the missing initializer or validate a full run.

Source basis: [B0 InitConfig/genesis](../2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md#24-genesiscommitment--exact-formula),
[G2/G3/G4](../../Designs/efsv2/mvp-c0-genesis-manifest.md),
[current kernel initializer](src/StateKernel.sol),
[bootstrap roots/capabilities](bootstrap-inputs.md), and
[V2 construction/provenance limits](dependency-deployment-v2.md).
