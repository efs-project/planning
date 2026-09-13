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

## D. Lease request (exact) — SUPERSEDED by §G (2026-09-13: 32 tests, ~170 transactions across 18 cells, 25-minute script watchdog, measure.json 5–10 MB); the commands and scratch rules below still apply, the counts and durations do not

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

## F. Independent review (before first compile) — applied / deferred

Applied in the repair cycle: NatSpec tag error in IndexModule; ordinal guard in `_append`; `MAX_BUDGET` cap and loop-variable shadowing in LensReader; registry `epoch` folded into `acceptanceProfileOf`; test expectation nonce→`E_SIGNATURE`; `pid` shadow renamed; Reconstructor labelled as a candidate self-check; `setIndexModule` labelled as a non-equivalent ablation path.
Deferred to the post-measurement repair (reviewer: ruling-level, not probe-blocking): MAJOR-1 grade-0 import must derive `sourcePrincipal` from a retained `sourceChainId` + code commitment + author; MAJOR-2 replay domain — for this probe the domain is realm-bound `(name, version)` with realmId and coreCodeCommitment inside the intent, pinned in the manifest as "same (realm, code) = same authority domain"; chain-binding plus routing the portability test through `importPublication` is the alternative awaiting the coordinator's ruling. Also noted: EIP-7702-delegated EOAs classify by `code.length` (Cancun lab: dormant); contract-author import retry has no `AlreadyAdmitted` identity (implicit nonce).

## G. Second source pass (2026-09-13) — UNRUN

Written under another worker's compiler lease: no `forge`, `solc`, `anvil`, `node` or `npm` was run against this directory in this pass; the only execution was `node --check script/measure.mjs` (syntax only). The Core (`Ledger`, `IndexModule`, `LensReader`, `TypeRegistry`, `Keys`, `Interfaces`) is untouched at `dcc7b94`.

**New/changed files.** `src/LabAcceptors.sol` (`QuoteAcceptor`, `LabelAcceptor`), `src/JoinedConsumer.sol` (`JoinedConsumer`, `StatelessConsumer`), `test/JoinedConsumer.t.sol` (5 tests), `test/LabelType.t.sol` (3 tests), `script/measure.mjs` (rewritten), `MANIFEST.draft.json`, `README.md`, `LABELS.md` (review corrections; still unadopted), this file.

**Coordinator corrections applied.** (a) the freshness rows are three sealed cells from the same snapshot with one action shape (`fresh/contract-fresh-body`, `fresh/contract-existing-body` with the EOA admitting first and pre-presence retained as bytes, `fresh/exact-retry`); reported side by side, never subtracted. (b) `JoinedConsumer` and `StatelessConsumer` write no storage; every paid-read row is labelled STATELESS or STORING, and the storing rows are kept as separate rows. (c) `read-history-asof-older` / `-older-stateless` and the joined `history-a-older` read at a strictly older basis (the first head-bind ordinal while the rebind exists); the latest read stays a separate row. Checker shape (lab-oracle `0e6e682`, read-only): literal JSON-RPC envelopes per observation, ids unique per run, `params[0] == {to, data}`, hex block numbers, block hashes from retained headers; candidate summaries under `candidateDecoded`/`rows`; `baselineRaw[]` entries are also in `raw[]` (stage `baseline`) so a checker keyed on `raw[]` sees the control-block getters. The manifest states that no row is a matched substitute for the fuller Files control.

**Compile risks to check first (desk-checked only).**
1. `JoinedConsumer._authorOf`: the 8-way `ledger.admission` and 13-way `ledger.evidence` destructurings (arity script-checked: 8 and 13; the compiler is the judge).
2. `abi.decode(data, (bytes32, uint256, uint8, uint64, bytes32))` assigned into struct members `(q.pairId, q.mantissa, q.scale, q.observedAt, q.note)` — if the compiler refuses member lvalues in a tuple assignment, decode into locals first.
3. `keccak256(abi.encode(page.items))` on `LensReader.Entry[] memory` and `abi.encode(tagged)` after an assembly `mstore(tagged, n)` length trim (same pattern as `LensReader._finish`).
4. `QuoteAcceptor.accept` / `LabelAcceptor.accept` are `pure` while `IAcceptor.accept` is `view` — allowed (stricter mutability); if the compiler objects, mark them `view`.
5. `LabelAcceptor._wellFormed(bytes calldata)` private with a calldata parameter called from two external functions — allowed since 0.6.9; fallback: `bytes memory`.
6. `StatelessConsumer.commitList` and `JoinedConsumer._completePage` pass a memory `Cursor` to `lens.list(..., Cursor calldata, ...)` — external call, ABI-encoded, fine (Consumer.readList already does this).
7. Test `runSteps1to4` has many locals (structs, arrays, intents): `via_ir` covers it; if "stack too deep" appears, split step 3/4 into helpers.
8. `test/JoinedConsumer.t.sol` hardcodes admission ordinals 1..20 and publication ordinals 1..4 from the sealed `setUp` (admissions == 0); any change to `LabBase.setUp` that admits something shifts every expectation.
9. `bytes internal constant NOTE_BYTES = hex"…"` — constant `bytes` is allowed; if not, use a `pure` helper.
10. `script/measure.mjs`: ethers v6 exports used — `HDNodeWallet`, `Interface`, `AbiCoder`, `keccak256`, `hexlify`, `toBeHex`, `zeroPadValue`, `toUtf8Bytes`, `concat`, `getCreateAddress`, `getAddress`; `wallet.signTransaction({type: 0, gasPrice, chainId, to: null|address})` and `keccak256(rawTransaction)` as the tx hash (legacy tx). Anvil's `eth_call` revert shape is assumed `{error: {code, message, data: "0x…"}}`; the static-call selector is read from `error.data` (fallback: `error.data.data`). `eth_gasPrice` ×2+1 is used as a legacy `gasPrice`; if Anvil's base fee exceeds it mid-cell the send fails loudly (raise the multiplier). Fixed `gasLimit` 8,000,000 (calls) / 15,000,000 (deploys) / 3,000,000 (expected failures) — the Ledger's `E_GAS` guards need ≥ ~0.5M headroom, satisfied.
11. `report.json` size: ~18 cells × (60–150 raw envelopes + 5–20 transactions with four envelopes each) — expect 5–10 MB and one rewrite per transaction; if the run is too slow, persist per row group instead (the guarantee needed is "on disk before the next revert").
12. The registry epoch after setup is 6 (one more registration than the retained run's 5), so `vectors/profile-b.json` acceptance profiles will not match a new run's — expected, not a bug.
13. `consumerCheck` mines one empty block (`evm_mine`) after every STORING `readQuote`/`readList` row so only the checker's frozen selectors sit at the receipt block; with `--rpc` against a node without `evm_mine` the run fails loudly there (by design; the checker owner has been asked about the split).
14. `JoinedConsumer.readLabel(position, labelRecordId)` takes the record id as an argument (review MAJOR: no candidate library in the consumer); the script and tests derive it themselves.
15. `StatelessConsumer` method selectors (`commitQuote` …) are distinct from `Consumer.readQuote` on purpose; the existing checker profile pins `Consumer` selectors and would otherwise classify the twin's transactions as conflicting `readQuote`/`readList` calls.

**Still not done (explicit).** sdk-fixture steps 8–10 (offline clean reader, import into a fresh destination, rule v2 / account drift); files-journey J4–J6 beyond what step 6 covers; the capability ablation; any independent oracle vectors for the new commitments; storage tracing; the candidate (a) dictionary probe in `LABELS.md`.

## H. Authority repair (2026-09-13, lab-b-authority) — UNRUN

Scope: the 06:50 checkpoint (native-import/source-origin authority; exact Type identity vs. separate Realm acceptance policy). Findings in `FALSIFY.md` (F1 unsafe, F2 safe, F3 unsafe, F4 unsafe); repair in `REPAIR.md`; profile deltas in `PROFILE.md` "Changed after dcc7b94". No `forge`/`solc`/`anvil`/`node`/`npm` was run; nothing committed.

**Changed:** `src/Keys.sol` (+`DOM_TYPE`, `typeId`), `src/Interfaces.sol` (`typeInfo` 5-way, `activation`), `src/TypeRegistry.sol` (rewritten: derived ids, refused re-registration, append-only policy rows, `descriptor`/`activation`/`typeIdOf`), `src/Ledger.sol` (`E_SOURCE_UNSUPPORTED` fail-closed for `src.v == 0`; policy row index in `AdmissionRow.meta` bit 152; `acceptanceBasis`; `E_NO_BASIS`), `test/LabBase.sol` (ids derived in `setUp`), `test/LedgerMatrix.t.sol` (re-registration → new Type + `activate`), `test/LedgerImport.t.sol` (grade-0 test replaced by fail-closed), `test/LabelType.t.sol`, `test/JoinedConsumer.t.sol` (derived `LABEL`/`QUOTE_J`). New: `test/Falsify.t.sol` (7 tests), `FALSIFY.md`, `FALSIFY.phase1.t.sol.txt` (the Phase 1 text; compiles against `e77f36d` only), `REPAIR.md`. Expected suite: 39 tests.

**Superseded here:** §B.6 (grade-0 retained as claimed → now refused), §F MAJOR-1 (applied as fail-closed, not as a derived principal — no source proof is invented), the TypeRegistry "re-registration is allowed on purpose" note. §F MAJOR-2 (replay domain) stays FUTURE.

**Script adapted (after `aaecfed`; `node --check` only):** `script/measure.mjs` now (1) treats the name hashes as SHAPES and takes every Type id from the `TypeRegistered` receipt log, asserting it equal to the `typeIdOf` raw reply and a local `Keys.typeId` derivation before the next registration references it (`report.types`; `T` throws if read before resolution; `--addresses` mode resolves from the chain via `typeIdOf` + `eth_getCode`); (2) deploys `JoinedConsumer` after registration with the derived ids; (3) adds three sealed cells from the same snapshot — `policy/activate` (activate `StrictQuoteAcceptor`, the `test/Falsify.t.sol` artifact, as QUOTE row 2 after an admission; held epoch-N signature → `E_INTENT` failure row; re-signed publish admitted; `acceptanceBasis` raw replies for both admissions), `failure/refused-re-registration` (`TypeRegistry.E_TYPE_EXISTS`; descriptor/epoch unchanged; the different-descriptor case is a statement row) and `failure/unsupported-native-import` (`E_SOURCE_UNSUPPORTED` on the signed-destination and msg.sender paths; `subjectCreatedAt`/`sourceEvidence` show nothing minted); (4) `signIntent` factored out of `signedCall` (byte-identical executeSigned path). Payload controls and fixture bodies unchanged. Deployment order changed (StrictQuoteAcceptor before StatelessConsumer; JoinedConsumer last), so no address in the manifest is pinned. `vectors/profile-b.json` remains the `dcc7b94` vector; a new vector is owed after a build.

**Script compile/run risks (desk-checked):** `out/Falsify.t.sol/StrictQuoteAcceptor.json` must exist (forge builds test/ by default); `iface('TypeRegistry').parseLog` on the `TypeRegistered` event (indexed `typeId` in topics[1]); `sourceEvidence` decodes to a named struct (`src[0].author`, `src[0].grade`); the import cell's `importPublication` calldata carries the `SourceEvidence` and `Intent` tuples as named objects (same pattern as `executeSigned`); `failureRow` static call on `importPublication` must return the `E_SOURCE_UNSUPPORTED` selector (the revert is the first statement of the `v == 0` branch); `assert.deepEqual` on the two registry snapshots compares stringified fields only.

**Compile risks (desk-checked):** see `REPAIR.md` "Compile risks" — calldata→memory array copy in `register`; `try` without `returns` on value-returning externals; return-name shadowing avoided (`activation_`, `epoch_`); `LabBase` ids as storage (no `pure` reader); struct-literal field order; new destructuring arities (5/6/5/4); `LedgerMatrix` imports `MockAcceptor`.
