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

The CLI recomputes and enforces the last two Git blob identities before any
comparison. It also checks that the parsed objects are exactly the objects from
those bytes. Supplying a mutually consistent replacement profile and
expectations file is therefore rejected rather than becoming a new oracle.
This local input seal does not prove that the candidate source commit was
deployed or that any observation packet is genuine.

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

Every present proof-shaped observation must name its source, claimed proof
grade, basis role, and exact block hash. Source and destination anchors are
separate and each must state chain, block, Realm, provenance, and the
availability or explicit unavailability of header, runtime, account-proof, and
storage-proof material. The fresh-destination fixture rejects identical
source/destination chain-and-Realm authority, and all packets reject cross-basis
observations. It does
not yet verify headers or Ethereum state proofs, so a structurally bound packet
is still reported as `STRUCTURALLY_BOUND_UNAUTHENTICATED`; packet-supplied
booleans, rows, receipts, evidence arrays, and proof-grade strings cannot yield
`VALID`, `ACCEPTED`, `ADMITTED`, `SUCCESS`, or `COMMITTED`.

The implemented boundary is intentionally narrow:

- Record and subject identities are independently recomputed from pinned
  public framing and can be `MATCH` or `MISMATCH`.
- Generic EOA recovery is a standalone cryptographic control. Candidate action
  commitment, typed digest, and signed-plan authorization remain `UNSUPPORTED`.
  Both digest-byte and signature-byte mutation controls are exercised.
- Reference validation, source acceptance, destination admission, submission,
  and receipt observations are retained raw but evaluate to `UNKNOWN` until an
  independent proof verifier and proof-bearing packet profile are pinned.
- Canonical effect, query coverage, and destination selection remain
  `UNSUPPORTED` because their required-effect/query/selection closure is not
  pinned. Candidate-supplied matching rows cannot complete that closure.
- The cost helper requires matched actor, action shape, body size, state regime,
  exact current/before/after operation commitments, before/after bases,
  provenance, occurrence deltas, effect commitments, and state delta. It can
  classify supplied controls as fresh, existing, retry, or inconsistent, but
  labels them `UNAUTHENTICATED_INPUT`; the sealed report keeps cost truth
  `UNKNOWN`.

Raw inputs, raw observations, candidate claims, and evaluated results are all
retained separately. Every axis in the frozen neutral list must be explicitly
claimed, including honest `UNKNOWN` and `UNSUPPORTED` outcomes. A missing claim
is a `MISSING_CLAIM` discrepancy; an unfamiliar claim axis becomes
`UNSUPPORTED_CLAIM_AXIS`. Neither is silently skipped.

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
project dependency path. The CLI emits deterministic JSON, exits `0` only when
every frozen required axis is explicitly claimed and no claim contradicts the
limited oracle (including honest `UNKNOWN` and `UNSUPPORTED`), and exits `1`
for a malformed packet or discrepancy. Its packet shape and status vocabulary
are lab-local. Exit `0` is not a candidate pass, deployment proof,
semantic-effect proof, or production-readiness result.

## RPC_OBSERVED bounded probe

This second checker is a separately named raw-byte consistency probe. Its scope
was frozen from planning commit `d5b4c58e74f6532d9f170d7533e177c608f9cb90`,
`oracle-boundary.md` blob `bf4aa1b90b6f7559f66a0fadb13059c95dd2bd57`,
and `rpc-observed-expectations.json` before opening the retained candidate
packet or its compiled ABI artifacts. The frozen RPC expectation blob is
`1fbe87f6b2bf1d095bb0979997573439a6c2bd88`. The original expectations and strict
proof-result implementation stay unchanged at blobs
`a9d6c9afb5f51d0f786e006b7b5df667ae69710e`,
`c875a0ed7923c5175c0f5691770aa5be7eab24e0`, and
`c45264e0a1e98ea59c789428172d629dd19d4f5b`.

Under an explicit `RPC_OBSERVED` assumption, the probe may decode retained raw
calldata/return bytes with separately pinned public ABI declarations, recompute
supported Record IDs, and compare target, selector, arguments, basis, revision,
selected target, scalar, and listing count with the frozen matrix. Its only
outcomes are `OBSERVED_MATCH`, `OBSERVED_MISMATCH`, `UNKNOWN`, and
`UNSUPPORTED`. None establishes RPC honesty, block inclusion/canonicality,
runtime or storage truth, source authority, exact Type meaning, complete
workflow execution, semantic `COMMITTED`, or a candidate pass.

The frozen two-cell matrix requires both `native-one` and `signed-one` to begin
with the quote3000 and quote3100 control Records observed absent and a zeroed
Consumer; create quote3000; edit the same subject HEAD to a distinct quote3100
Record at revision 2; return that Record/revision/scalar 3100 from the paid quote
read; and list exactly one selected name. Candidate decoded summaries,
`pre`/`post`, `consumerChecks`, labels, and pass flags are inert retained data,
never expected answers.

Implementation plan:

1. Seal and commit these expectations before inspecting packet or ABI details.
2. Hash the retained packet; read only its raw observation data. Hash the four
   authorized `dcc7b94` artifacts and extract only their `.abi` fields into a
   lab-local profile.
3. Add failing tests for exact successful decoding plus raw-byte, selector,
   target, basis, omission, conflict, and fake-summary mutations.
4. Implement a new `rpc-observed` module and CLI without importing, modifying,
   or weakening `oracle.mjs` or `check.mjs`.
5. Run the checker on the incomplete two-cell packet, store candidate-packet
   results separately from synthetic test totals, verify strict-file hashes,
   obtain independent review, and commit only `lab-oracle/` files.
