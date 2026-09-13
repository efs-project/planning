# Road B profile validation — 2026-09-13

**Standing:** candidate-side validation note, not the independent SDK oracle and not an authenticated-chain result.

## Result

`vectors/profile-b.json` was recomputed with ethers `6.15.0` standard `AbiCoder`, `TypedDataEncoder`, `SigningKey`, and `recoverAddress` APIs. The checker imports no Road B contract, candidate reconstructor, ABI artifact, or `Ledger.intentDigest` helper.

The literal vector passes these candidate-side checks:

- `keccak256(abi.encode(Action[]))` equals the declared actions hash.
- Manual domain separator, struct hash, and `0x1901` digest equal `TypedDataEncoder.hashDomain` / `TypedDataEncoder.hash`.
- Raw-digest signing equals `Wallet.signTypedData`; the 65-byte signature is low-s, has `v=28`, and recovers the declared author.
- Record, subject, position, binding, scope, publication, acceptance-profile, and index-obligation derivations recompute from the literal inputs.
- Changing only `actions[3].role` produces the declared new action hash/digest; the original signature recovers a different account, so pinned candidate behavior is `E_SIGNATURE()` (`0x14e34152`).
- JSON parses and byte-for-byte deterministic recomputation matches the checked-in vector.

## Returned scratch-vector review

The returned scratch `vector.json` / `vector.mjs` was useful input but was not published unchanged. It used textual placeholders for the Ledger, acceptor, and index code context and set the registry epoch to `6`. The retained setup contains five `register` calls and no setup binding-rule update; its signed calldata/evidence reports acceptance profile `0x78cd688361e28884caa52d836072ca40405f892f7043df1604c22e7fc47a1788`, which recomputes at epoch `5`, not `6`.

The published vector therefore uses the retained diagnostic's literal Ledger/runtime, acceptor, index, epoch, and obligation values. The Ledger codehash and acceptor context also appear in retained signed calldata/setup evidence; the index codehash was reconstructed from the retained compiled artifact with its immutable Ledger/admin/attach values, and the resulting obligation hash matches the retained signed calldata. This is consistency evidence, not authenticated deployment proof.

## Reproduction

From `lab-b/` with the already-available ethers dependency (no install or network):

```sh
NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules \
  /Users/james/.local/state/fnm_multishells/34996_1789081072624/bin/node \
  vectors/verify-profile-b.mjs vectors/profile-b.json
```

Expected prefix: `PASS profile-b.json ethers=6.15.0`.

## Boundary

No build, test suite, Anvil, network, candidate helper, or source change was used. The future chain/deployment replay-domain repair remains explicitly unsupported by this profile rather than guessed here.
