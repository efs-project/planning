# B paid parity inputs: independent offline source map

Status: finalized offline against coordinator-reviewed clean source `c5561e2b27c48ca2938695cce7784f1e78564116`; AST-enabled artifacts supplied at `/tmp/efs-b-parity-build-20260913.lcAzU1/green-out`. No chain or compiler used.

The bounded generator wraps unchanged independent helpers at `600b1e8ab97e9cffac086e3f3199c45869c86071`. It does not modify their strict schemas. `baselineInputs` stays unchanged, while the separate parity `inputs` appends one `expectedRevision` field to each paid Expect. No unknown-field masking is added.

## Source-to-value derivation

- Neutral `sdk-fixture.md` paid appendix and `paid-neutral-expectations.json`: the exact selected Quote values, author/evidence categories, A2/B1 revision labels, unchanged sole A1 placement, quote→pair→ordered-items closure and four paid rows.
- Primary `JoinedConsumer.sol` Expect/PlacementExpect/Selection/Placement declarations, paidPoint/paidList, _select, _pinBasis, _admittedBy, _closure, _placement, _lensId: tuple field order, widths, return shape, event signature, commitment preimage, all-zero point placement, native and signed category numbers.
- Primary `Ledger.sol` _applyBind: the author-qualified binding key loads the current revision and writes revision+1. A1 then A2 gives A revision2; first B binding gives B revision1. These are distinct from admission and publication ordinals.
- Independent `paid-vectors-b.mjs` declared four-publication action schedule: bootstrap three record admissions; A1 five actions; A2 two actions; B1 two actions. A selected admission/publication10/3; B12/4; A placement7/2/revision1; frontier12. Registry six registrations+two activations gives epoch8; unchanged index generation0.
- Primary `LensReader.sol` list/_masked/_finish: single A placement gives rawTotal1/scanned1/selectedSoFar1 and complete2; exhausted two principals and rawIndex0 gives ended=true. A-first hydrations1; B-first hydrations2 because the A candidate probes higher-ranked B. Neither lens produces a B placement.
- Primary `Keys.sol` identity domains and abi.encode formulas plus `TypeRegistry.sol` descriptor identity: exact Record, Type, File subject, position, binding and scope keys independently recomputed by unchanged helpers.
- Independent `paid-runtime-b.mjs`: public Anvil address indices and CREATE nonces, full constructor initcode and AST/name-verified immutable substitution. This uses compiler artifacts only after an exact reviewed source/build pin is supplied; source AST IDs are not interpreted as semantic values.

## Verified explicit pins / boundaries

The current primary source confirms `uint32 expectedRevision` appended after `uint64 basisAdmission`, with an explicit `_select` mismatch revert. The generator checks the exact artifact ABI, including unchanged return/event field order and widths. The source additionally verifies closure admission bounds, binding coordinates/revision predecessor, not-imported publication evidence, and full list cursor context. These added refusals do not change successful values or return/event layouts under the sealed fixture. The current `_pinBasis` obtains the commitment from `ledger.coreCodeCommitment()`; primary Ledger implementation returns its own runtime hash, matching the independently instantiated runtime used here.

Node `/opt/homebrew/bin/node` v26.0.0 and ethers6.15.0 are used without installation. The ethers package SHA256 is `957d5092241ed59860532077633008c49852b98b384493bb0f04225a414eb601`; the output also pins the actual Node executable hash. The exact compiler version/settings, artifact JSON hashes, source hashes and independent helper hashes are retained in the generated JSON. Compilation/test success reported by the coordinator is not claimed as independently executed by this offline preparation.

Additional primary runtime constructor/immutable declarations for LabHarness.sol, LabAcceptors.sol, IndexModule.sol and the isolated StrictQuoteAcceptor declaration were explicitly authorized by the coordinator and inspected. Actor stores its Ledger argument; Consumer stores its LensReader argument; MinBodyAcceptor stores minBody; IndexModule stores Ledger, msg.sender as admin, and fresh Ledger admissions+1 as attachedFrom (1 before fixture). StrictQuoteAcceptor has only a constant CAP and no constructor or immutable. No test fixture/setup implementation, candidate runner, result packet or decoded candidate summary was read.

The artifact-independent vector bytes are predictions, not verified chain evidence. Actual deployment bytecode/initcode readback, post-B1 snapshot/basis seal, receipt and raw return/event comparison remain the independent run controller's work. Existing raw-check limitations remain explicit (signature recovery, several publication fields and rollback controls are not established here). Point transaction placement stays zero by primary ABI; the independent A1 placement provenance is joined separately and is not charged as a point directory read.

No signing keys are emitted. Public test account derivation indices and addresses only.

## Final offline seal and QA

`b-parity-inputs.json` SHA256: `31dbc9e1ad5580fa5b5b119ffba1d209299529227feb82bfedeedd9e4caca3d0`.

`generate-b-parity.mjs` SHA256: `bcffdb4c55dcacfad881bca077c4bb3febaeccabbd187e70535099df854dc7fc`.

The read-only `verify-b-parity.mjs` passed exact flat-word ABI checks for all four calldata, return and event vectors, all 17 runtime/initcode hashes, CREATE-address and immutable-substitution checks, repeated semantic derivation, source/artifact/helper hash stability, and five ABI-mutation refusals (missing revision, wrong revision width, unknown output field, wrong event indexing, changed Placement field width). This is offline input QA, not observed execution success.

Consumer predicted address: `0x4a679253410272dd5232b3ff7cf5dbb88f295319` (public deployer CREATE nonce25). Runtime17781 bytes, hash `0x1a9c7473ff5178511003b62b1d180976790258bdbd4acd2d6a859c64eddcb6f7`; full constructor initcode18410 bytes, hash `0x2fa2c3c7adfa635c1403b1e6e20c74dde65cee0598680d7ddcb8bf28d648d192`.

Integration: use `runtime.targets` for before-deployment full code/initcode checks; use `inputs` (not unchanged `baselineInputs`) for the appended-revision calls. `paidRows` carries exact `from`, `to`, `data`, `expectedReturn` and `expectedEvent` for the four rows. `rawChecks` preserves the prior independent raw-state schedule and limitations. Do not read expected values from candidate results or rewrite this seal after execution.
