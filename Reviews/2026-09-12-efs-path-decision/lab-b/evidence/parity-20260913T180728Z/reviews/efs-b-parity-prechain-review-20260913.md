# B parity pre-chain review — 2026-09-13

**Verdict: GO for the one finite, loopback, independently pinned run.** No Critical/Important blocker found in this bounded review. This is pre-chain readiness, not observed semantic success, production approval, rollback qualification or a source-state proof.

Reviewed independently prepared `b-parity-inputs.json`, its generator/source map and read-only QA; the unchanged independent B vector/runtime/check/controller helpers; primary paid ABI, Ledger/Lens semantics and neutral expectations; and run-local `assemble.mjs` / `launch.mjs`. No compiler or Anvil was launched, no repository was edited, and no candidate result packet supplied an expected answer.

## Exact reviewed pins

- Source: `c5561e2b27c48ca2938695cce7784f1e78564116`.
- Independent input: `/tmp/efs-b-parity-inputs-20260913.AHqH23/b-parity-inputs.json`, SHA256 `31dbc9e1ad5580fa5b5b119ffba1d209299529227feb82bfedeedd9e4caca3d0`.
- Assembled arm: `/tmp/efs-b-parity-paid-20260913.KJ23qU/arm-b.json`, SHA256 `b28c779bba360ecae19ba7beb68610cae9ce27ba33245c66d88e3415f023b83f`.
- Controller SHA256 `4b61055bfbe9c47c8d40bcb73690920582c5472ceed427f36f0d750eab83d7fa`; Git comparison confirms unchanged from `600b1e8`.
- Neutral SHA256 `ff7c4fc735504c9871e8241c7cc461293b7ffc37f3d5e9dd50840e005cc37795`.

## Checks established offline

I executed the read-only `verify-b-parity.mjs`: PASS for four exact calldata/return/event vectors, 17 deployments, source/artifact/helper hashes, and five ABI-mutation refusals. I additionally re-derived all 17 full runtimes and constructor initcodes from the artifact ASTs and compared the complete result object to the sealed input; PASS. No byte masking is involved: immutable declaration names/AST IDs, offsets, placeholder zeros, constructor types and substitution values must match, and runtime bytes are compared in full.

Paid ABI matches primary declarations: appended `uint32 expectedRevision`, unchanged output tuples and indexed PaidResult kind. Point calldata is 548 bytes, list 740; selectors are `0xc04684be` / `0x20837e96`. A-first expects revision2, signed A2 and mantissa2502000000; B-first revision1, native B1 and mantissa2501000000. Point commitments include all 14 zero Placement words even though point returns omit Placement. Lists retain A1 placement admission7/publication2/revision1; complete, ended, one-row counters; hydrations1 for A-first and2 for B-first. All four fields/commitments and event topics/data are independently encoded before execution.

`baselineInputs` is explicitly retained solely as the old helper's derivation input; the assembled arm takes `p.inputs`, not `baselineInputs`. Both paid Expect objects have mandatory revision strings. The assembled inputs, 18 before-fixture checks, 79 after-B1 checks, initial/checkpoint expectations and all runtime targets exactly equal the independently prepared objects. The arm source/build shapes match the existing controller/candidate context contract. No old paid expected object is silently substituted.

The consumer runtime is 17,781 bytes. Artifact creation bytecode is 18,218 bytes; **full deployment initcode is 18,410 bytes**, including 192 bytes of constructor arguments. All 17 predictions fit normal runtime/initcode limits. Fresh actual runtime and initcode comparisons remain mandatory during the run.

## Run containment and remaining evidence boundary

The assembler verifies clean exact source, GREEN build/source/artifact hashes, independent input/helper/neutral hashes, compiler settings and normal size limits; writes the new arm/pins exclusively in the run directory. Launcher verifies the finite current lease, source and input/artifact hashes, pinned Node, at least 50 GiB free and less than 14 GiB run usage. It launches one detached runner process group; the runner starts one 127.0.0.1 Anvil with Cancun, 30 million gas, normal code limits, bounded 256-block history and run-specific cache. Deadline/disk checks signal the owned group; normal runner cleanup kills its owned Anvil, and launcher checks that PID is gone. No remote-node flag, external mutation target, repository write or cleanup of old evidence is introduced.

Root reports focused 7 / full 59 / Node 42 GREEN. This review did not re-execute those suites. Launcher success means operational completion only: the unchanged two-stage controller does not independently validate the later paid return/event packet. Root must still compare the four actual transactions, returns/events and deployment observations against these sealed independent vectors before claiming semantic agreement or fresh paid costs. Keep `RPC_OBSERVED`, existing partial publication-word limitations, unrun matched rollback and portability gaps explicit.
