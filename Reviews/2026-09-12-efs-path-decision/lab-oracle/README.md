# Disposable independent lab oracle

This directory contains an experiment-only offchain checker for the EFS path
decision. It is not an SDK, Core implementation, ABI recommendation, state
proof verifier, or protocol-byte proposal.

## Independence seal

Candidate-neutral expectations were frozen before inspecting candidate B's
manifest, ABI, structs, or verifier implementation.

- planning source: `32ed292af887455e690991d2fd642bebd4f47fef`
- oracle-boundary blob: `035aa6d9cb0dcd96517234a7ef1a160b45481abf`
- sdk-fixture blob: `4a2864fc4670cf548f1efa7340041df0fec2b803`
- files-journey blob: `0c2aecc059e05e2251f06343c351ec3653b09ace`
- run-manifest blob: `0994c7125c5488d408a2519fdad45b91cd656ac0`
- neutral-expectations blob: `a9d6c9afb5f51d0f786e006b7b5df667ae69710e`
- frozen-before-candidate-inspection: `true`

The oracle may later transcribe candidate B's public manifest and ABI/struct
declarations. It must not read, copy, import, or execute the candidate's
Reconstructor, intent-digest implementation, measurement script, SDK/helper,
or verifier tests.

Candidate-public material was subsequently read from source commit
`727291aac717f4c4e38e9049e8c9328da94389b8` only:

- `MANIFEST.draft.json` blob `46efa03d08408230d198c87000f396ee2fb24e12`
- `src/Interfaces.sol` blob `3155357f6d3e58c910828df2eb798ecb53ea24f9`
- public-profile transcription blob `06106fe3bc717ed4638612f2ef8b90d502c705b8`
- independent hand-vectors blob `c58df6c533509109bd33c2e8ad44a15a609304aa`

That material declares Record and subject identity framing. It does not declare
the ordered `Action` and `PublicationIntent` fields/types, action/body array
framing, complete EIP-712 domain field set and values, or a candidate signature
vector. Action commitment, signed digest, and signed-plan binding therefore
remain `UNSUPPORTED`; the checker does not guess them. Generic supplied-digest
ECDSA recovery is tested separately and is not candidate authorization.

A later compiled ABI was inspected only through its `abi` JSON field and is
recorded as `profile-b-dcc7b94.abi-declarations.json`. It belongs to source
`dcc7b946d2ac8dfcf22103069127a9d1809df974`, not the sealed `727291a` profile.
Its tuple declarations and selectors do not supply the missing action-array,
domain, replay, or principal rules and therefore upgrade no oracle axis.

## Evidence boundary

Raw observations, independently derived outcomes, and candidate-native claims
remain separate. Missing authenticated input leaves only the affected axis
`UNKNOWN` or `UNSUPPORTED`. A retained RPC response is an observation, not an
authenticated state proof. Source acceptance is not destination admission;
receipt success is not canonical semantic effect; and an unknown submission is
never permission for a blind retry.

The checker uses Node built-ins and ethers 6.15.0 only for cryptographic
primitives. It performs no RPC, network, chain, build, or package-install work.
The current tests use synthetic raw observations; they are not evidence that a
Road B deployment or joined fixture passed.

## Commands

```sh
NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules \
  node --test Reviews/2026-09-12-efs-path-decision/lab-oracle/oracle.test.mjs

NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules \
  node Reviews/2026-09-12-efs-path-decision/lab-oracle/check.mjs \
  packet.json profile-b.public.json neutral-expectations.json
```

The absolute `NODE_PATH` is run-local evidence for this machine, not a portable
project dependency path. The CLI emits deterministic JSON, exits `0` when all
claims match the independently evaluated axes (including honest
`UNSUPPORTED`), and exits `1` for a malformed packet or discrepancy. Its packet
shape and status vocabulary are lab-local.
