# TODO — Road B lab (disposable, uncompiled, unrun)

Everything below is honest state as of writing. No `forge`, `solc`, `anvil`, `node` or `npm` has been run against this directory. All gas numbers are ESTIMATED.

## A. Compile risks (desk-checked, unverified) — check these first when a lease lands

1. **via_ir is load-bearing.** `Ledger.importPublication`, `Ledger._applyBind`, `Ledger.evidence` (13 returns) and `LensReader.list` have many locals; without `via_ir = true` expect "stack too deep". `foundry.toml` sets it.
2. **Tuple destructuring arity.** Every `(a,, b) = f()` was checked by a script against the callee's return count (0 mismatches), but the compiler is the judge — especially the 13-way `ledger.evidence()` destructurings in `test/LedgerMatrix.t.sol`, `test/LedgerEvidence.t.sol`, `test/LedgerImport.t.sol` and `src/LabHarness.sol`.
3. **`bytes32(ret)`** in `Ledger._accept` converts `bytes memory` → `bytes32` (allowed since 0.8.5). If it fails, replace with `abi.decode(ret, (uint256)) == 1`.
4. **External functions with `memory` array params** (`execute`, `executeSigned`, `importPublication`): chosen to avoid the nested `bytes[] calldata → memory` copy; the ABI is unchanged. Switching to `calldata` is a later gas optimization, not a correctness change.
5. **Struct aliasing in tests.** Memory-to-memory struct assignment aliases; mutation tests use `clone`/`cloneAll`/`cloneIntent`. Any new test that mutates a copy must do the same.
6. **`MockAcceptor` mode 3** is a deliberate infinite loop in a `view` function; the compiler warns "unreachable code" (foundry.toml ignores 5740; if that id is wrong the warning is harmless). If the optimizer ever removes the loop, the "burn gas" case silently becomes "accept" — assert it via the test.
7. **Uninitialized `bytes32[] memory none;`** in `LabBase.setUp` is the zero-length array; fine in 0.8, but replace with `new bytes32[](0)` if a lint complains.
8. **`Keys.principalFor` is `view`** (reads `account.code.length`), so nothing `pure` may call it; `LensReader.positionKey` stays pure and does not.
9. **`foundry.toml` `ignored_error_codes`** must be an integer list; verify the key name against the installed forge (it has been `ignored_error_codes` since 0.2).
10. **`Ledger` is ~870 lines** (target was ~400) because the coordinator's deltas added the evidence cell, import path, subject ids, withdraw and per-row effect fields. Splitting into a library (`Apply.sol`) is mechanical if EIP-170 bites: expect the runtime near the 24,576-byte ceiling under `optimizer_runs = 200` — **this is the most likely build failure**. Fallback: `optimizer_runs = 1`, or move `importPublication` + `_split` into a delegate-free external library.

## B. What I could not do / did differently from the briefs (design author, please rule)

1. **Listing across a mutation** (delta D, files-journey "churn" probe): the page reports current heads and sets `mutated` when any scanned head changed after `basisAdmission`; it does **not** reconstruct the basis view (that needs per-entry history bisection ≈ +log(n) hydrations per candidate). Test `test_page_across_mutation_cursor_law` pins the flag, not a basis-consistent page. Rule: flag (as built) or as-of reconstruction (priced)?
2. **Scope list entries are binding ordinals** (the etched K10 ruling); the lens merge recovers the position via `bindingPosition[ord]` and dedups by masking (any earlier principal's binding at the position). This is also the "same name under several authors ⇒ one entry" rule.
3. **Withdraw** drops the author's occurrence and releases by-Type/by-author live counts; it does **not** tombstone heads that were set by the withdrawn admission (c0 does). If the fuller semantics are required, `_applyWithdraw` must walk the author's bindings whose `head.admission` equals the withdrawn ordinal — needs a per-admission → binding-key link (the Admission row of a bind already has the binding ordinal; the publish row does not).
4. **Acceptance profile** = running hash over `(typeId, registry-pinned acceptor codehash)` of the publish/reuse actions in order; the signer computes it from the registry. `basis` is stored separately (block number). If the profile should also bind the registry's `epoch`, add it to the hash (one line) — it makes every signature stale on any rule change, which may be intended.
5. **Index obligations** = `keccak(module, module.codehash)` (0 without a module). A second deployment with its own module therefore needs a fresh destination signature (which `importPublication` requires anyway); `test_subject_id_portable_across_fresh_deployment` runs both ledgers without a module to show the identical-signature case.
6. **Contract-author import** (`src.v == 0`) retains the source principal and realm as *claimed* (grade 0). The lab cannot verify a chain-state witness; the README of the finalist must name the witness format.
7. **Evidence for local publications** does not repeat `realmId`/`coreCodeCommitment` per cell (they are the deployment's immutable/code; recoverable). Imports store the source pair in `SourceEvidence`. If an upgradeable deployment is ever considered, the per-cell copy (+2 words) becomes necessary.
8. **Convenience entrypoints** (`publish`, `create`, `bind`, `unbind`) consume `nonces[msg.sender]` implicitly, so a retry of them is not idempotent; only `execute`/`executeSigned`/`importPublication` with an explicit nonce give `AlreadyAdmitted`.
9. **Basis in Evidence is the block number (u40)**; the cursor basis is the admission ordinal plus generation/epoch/code. A finalized-state-root witness for native authorship is out of scope.
10. **`coverage(family, scope)`** is per family (the `scope` argument is accepted for the API shape); per-(family, scope) frontiers belong to the index-layer lab.
11. **No `LENS_NO_TIEBREAK` listing**: `resolveNoTiebreak` exists for point reads; the page reducer uses the ordered lens only.
12. **E_ACCEPTOR_CODE** (acceptor code changed after registration) has no test: two `MockAcceptor` deployments share a codehash, so the case cannot be constructed without a second acceptor implementation.
13. **sdk-fixture steps 7–9 and files-journey J4–J6** are mapped in `MANIFEST.draft.json` but not scripted; the export/import step is covered semantically by `test_import_*` on a second in-test Ledger, not by a clean offline reader.

## C. Open questions for the design author (road-b.md)

- Should the head binding be author-qualified only (as here), or should a subject carry a designated owner whose head is "the" head for single-author profiles? (Affects `resolve` for lenses of length 1.)
- Is a per-publication Evidence cell of 5–7 words acceptable as the always-on price of state-only authorship closure, or should native (contract) ingress be allowed a 2-word cell (author, first, count) since its proof is a witness anyway?
- Do tag bindings target a stance record or the subject itself? The lab binds `TAG → subject` (untyped target); the fixture's `market` tag may want a typed stance record.
- Should `withdraw` also tombstone the author's heads set by that admission (fuller semantics)?

## D. Lease request (exact)

- **What to run**, in order, from `Reviews/2026-09-12-efs-path-decision/lab-b`:
  1. `FOUNDRY_OUT=/private/tmp/claude-501/-Users-james-Code-EFS/089e21d8-6171-40d6-9cac-1d2e941506f9/scratchpad/build/lab-b/out forge build --use 0.8.30 --offline` — expected 1–3 min; fix compile errors from §A first (one repair cycle).
  2. `... forge test --use 0.8.30 --offline -vv` — expected < 2 min; 27 tests across three files.
  3. `... forge inspect Ledger storage-layout` and `forge inspect Ledger bytecode | wc -c` — confirm the ESTIMATED slot numbers and the EIP-170 margin.
  4. `EFS_ETHERS_PATH=<node_modules/ethers> node script/measure.mjs --anvil --out $FOUNDRY_OUT/../measure.json` — the script spawns `anvil --hardfork cancun --prune-history 256 --accounts 4 --gas-limit 30000000` on a free loopback port (no `--steps-tracing`), deploys, runs ~80 transactions, prints the table and kills Anvil; expected 2–4 min.
- **Expected total duration:** 15–25 min including one repair cycle. **Watchdog:** the script kills its Anvil after 20 min; the operator should kill the whole run at 30 min.
- **Scratch:** everything under `/private/tmp/claude-501/-Users-james-Code-EFS/089e21d8-6171-40d6-9cac-1d2e941506f9/scratchpad/build/lab-b` (< 2 GB: `out/`, `cache/`, `measure.json`); nothing written outside it except this directory's `out/lab-addresses.json` if `--deploy` is used without `FOUNDRY_OUT`. No persistent node, no state dump, no traces.
- **Disk reserve:** stop if free disk < 50 GB (sprint rule).

## E. Design-author rulings (Fable, 2026-09-13, before first compile)

- B.1 listing across a mutation: **flag as built** for this probe; basis-consistent reconstruction is a priced follow-up. Listed as unresolved in the manifest.
- B.3 / C.4 withdraw not tombstoning heads set by the withdrawn admission: **keep as built** for the probe (the fixture's remove is an unbind/whiteout, not a withdraw); the fuller control's `withdraw-current-Binding` row is therefore **not matched** and must be marked so in the manifest.
- B.4 acceptance profile: **include the registry `epoch`** in the running hash (receipt-bound rule activation; a rule change invalidates unsent signatures by design).
- B.8 convenience entrypoints: acceptable; measured rows use `execute`/`executeSigned` only.
- C.1 heads stay **author-qualified only** for the probe.
- C.2 Evidence cell: **uniform 5–7 words for both ingress kinds** in this probe (matched comparison); the 2-word native cell is a later counterfactual, not part of this run.
- C.3 tags: `TAG → subjectId` for File tags and `TAG → recordId` for revision tags, both supported, target untyped for the probe.
- A.10 EIP-170: if the runtime exceeds 24,576 bytes at first compile, the external-library split (`Apply.sol`) is authorized as ordinary modularization and its call overhead is charged in the manifest.
