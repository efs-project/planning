# Reviewed C positive typed-joined inputs

Final artifact: [c-native-inputs.json](./c-native-inputs.json).
SHA256: `16739ae05cb8a77c16b4c0edc9b5acd3a4b9b5074510a1d6d69c42aeed3f335c`.

Root reported independent reviewer approval against primary declarations:
351 additional ABI/row/AST/address checks and 21 source/metadata checks.
Preparation QA separately passed 374 offline checks, including deterministic
A1/A2 signatures, their signer recovery, and full unmasked Evidence bytes.
The stale open-input prose has been corrected. JSON and generator source remain
unchanged. This handoff records approval, not a new experiment or execution PASS.

Remaining live gates:

- Retain the approved input hash/timestamp before fixture publication or semantic calls.
- Verify actual deployment addresses, runtime code hashes, attachments and qualified
  prepublication empty-fixture state against the approved vectors.
- Publish the pinned bootstrap/A1/A2/B1 schedule; independently read back setup effects.
- Seal the exact post-B1 block number/hash and snapshot before paid calls; preserve
  one semantic basis and first-transaction/cold controls for each restored paid row.
- Compare paid observations with the sealed bytes and retain distinct execution blocks.

Evidence remains RPC_OBSERVED, not authenticated chain-state proof. The rollback
trigger is outside this positive preparation and remains a separate later gate.
