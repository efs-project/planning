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

## Evidence boundary

Raw observations, independently derived outcomes, and candidate-native claims
remain separate. Missing authenticated input leaves only the affected axis
`UNKNOWN` or `UNSUPPORTED`. A retained RPC response is an observation, not an
authenticated state proof. Source acceptance is not destination admission;
receipt success is not canonical semantic effect; and an unknown submission is
never permission for a blind retry.

The checker uses Node built-ins and ethers 6.15.0 only for cryptographic
primitives. It performs no RPC, network, chain, build, or package-install work.

## Commands

```sh
NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules \
  node --test Reviews/2026-09-12-efs-path-decision/lab-oracle/oracle.test.mjs
```

The absolute `NODE_PATH` is run-local evidence for this machine, not a portable
project dependency path.
