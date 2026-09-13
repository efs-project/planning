# lab-c TODO — compile risks, size, layout deltas, what was left out, lease request

Disposable lab; nothing compiled or run. Everything below is what the first `forge build` / `forge test` is expected to surface, plus the obligations this probe knowingly does not cover.

## Compile risks (first-compile fix list, in likely order)

1. **MUD API surface used without a compiler.** Calls assumed from source reading: `StoreCore.setRecord(tableId, keyTuple, staticData, encodedLengths, dynamicData, fieldLayout)`, `getStaticField(tableId, key, idx, layout)` (returns left-aligned `bytes32`), `getDynamicField`, `getDynamicFieldLength`, `getDynamicFieldSlice(start,end)` (reverts on `start >= length`, guarded), `pushToDynamicField`, `registerTable`, `registerInternalTables`, `initialize`; `EncodedLengthsLib.pack(a)`; `EncodeArray.encode(bytes32[])`; `SliceLib.getSubslice(b,0,len).decodeArray_bytes32()` / `decodeArray_uint64()` (relies on `using … for Slice global` in the vendored Slice/DecodeSlice files, as MUD codegen does); `Bytes.getBytes32(bytes,offset)`. Any signature drift is a one-line fix.
2. **`emit HelloStore(STORE_VERSION)`** in `EfsStoreCore` — the contract inherits `IStoreEvents`, so the unqualified emit should resolve; fallback is `emit IStoreEvents.HelloStore(...)`.
3. **Explicit conversions** `uint64(bytes8(Bytes.getBytes32(s, off)))`, `uint32(bytes4(...))`, `uint16(bytes2(...))`, `uint8(bytes1(...))`, `address(bytes20(...))`, `bytes32(bytes memory)` / `uint64(bytes8(bytes memory))` — all standard since 0.8.5; check the `bytes memory → bytes8` one in `Uint64List.first`.
4. **Tuple swap of memory structs** in `test_signature_mutations…` (`(m.actions[3], m.actions[4]) = (m.actions[4], m.actions[3])`) — should compile (reference swap); if not, swap via a temporary.
5. **Stack depth**: `_publish`, `importPublication`, `list`, `EfsIds.intentDigest` (8 params) rely on `via_ir = true`. Without via-IR they will not compile.
6. **Interface implementation without `override`** (`IndexModule.onPublication/obligationsId/generation`) — fine on 0.8.8+; add `override` if the compiler asks.
7. **`try this.decodeBody(canonical)`** inside a `view` function — external self-call in view context is legal; if the compiler objects to `this` in `view`, make `_structural` non-view.
8. **`hex"…"` inside `keccak256(hex"7265…")`** for `NOTE` — valid.
9. **Test discovery**: forge runs `test*` functions on contracts with a public `setUp`; no forge-std is imported, so failures surface as `require` reverts without pretty messages (`-vvv` shows them).
10. **Reentrancy**: no guard; `IndexModule.onPublication` is a CALL to trusted code and `IAcceptor.accept` is STATICCALL. If a guard is wanted, a `transient` bool (0.8.28+, cancun) is a two-line addition.
11. **Native ingress from an EOA**: `publishNative` derives an origin-qualified "contract" principal for *any* `msg.sender` (no `code.length` check); the script uses this for the deployer EOA. Decide whether EOAs must use the signed path (one-line `require(msg.sender.code.length > 0)`).
12. **Same-chain same-code Realms share contract principals** (`realmOrigin = keccak(chainId, coreCodeCommitment)` per the coordinator's formula excludes the Ledger address). Tests use `vm.chainId` for the two-Realm case; import tests on one chain use EOA importers. Flagged in `MANIFEST.draft.json → preSealChecks.1`.

## EIP-170 / code size (report, not a measurement)

Per-contract **source** sizes (bytes of `.sol`, not bytecode): Ledger 21,228 (+ tables 21,330 inlined as internal libs) · IndexModule 5,257 (+ IndexTables 13,714) · LensReader 11,316 · Consumer 2,121 · EfsStoreCore 2,383 · EfsTypes 9,451. Vendored Solidity reachable from `Ledger` through `StoreRead`+`StoreCore`: ≈ 8,700 lines (StoreCore 1,221; tightcoder 2,681; Bytes 830; StoreSwitch 585; codegen tables 1,886; Storage/FieldLayout/Schema/EncodedLengths/Slice/Hook ≈ 1,240) — but only the internal functions actually referenced are linked, and the tightcoder/Bytes files are almost entirely unused generated overloads.

Risk assessment: the **Ledger** is the only contract with a plausible EIP-170 (24,576 B) problem: 12 `StoreRead` externals + 13 EFS externals + inlined `StoreCore` write/read paths + 8 table libraries + import logic + 30 custom errors. Its runtime size is UNKNOWN until `forge build --sizes`. Decomposition options if it exceeds the limit (allowed by the review): (a) move `importPublication` + `_gradeSource` into a separate `Importer` contract that the Ledger authorizes as a caller (adds an authority row); (b) drop the `StoreRead` external read surface from the Ledger (readers then use `LensReader`/raw `extsload`-style getters — but that weakens the "IStoreRead public reads only" property and the ERC-7813 indexer compatibility); (c) strip the 5 `getFieldLength`/`getField` overloads by overriding them with reverts (ABI shrink; violates "keep IStoreRead"). Prefer (a). IndexModule and LensReader are expected to fit comfortably.

## Where MUD's encoding differs from Road B's Evidence layout (and why it does not matter for the digest)

- **Row packing**: MUD packs each row's static fields contiguously in the row's static region (Admissions: 11 fields, 262 B → 9 slots; Evidence: 17 fields, 325 B → 11 slots; Bindings: 44 B → 2 slots), no per-field slot alignment; the region starts at `SLOT ^ keccak(tableId, keyTuple)`. Road B's cell is described as "6–7 words" (r,s,v packed with kind/nonce/deadline); the Evidence cell here is 11 slots because it retains realmId, coreCodeCommitment, importOf, sourceGrade, acceptanceProfile and indexObligations verbatim (a choice for reconstruction, not a MUD constraint — MUD would pack a 7-word cell just as tightly).
- **Per-row extras that Road B does not pay**: one `Store_SetRecord` log per row carrying the full row bytes (8 gas/byte + log base) and a `StoreHooks` dynamic-field read per write (empty list; one cold SLOAD); a fresh `EncodedLengths` slot for every row with a dynamic field (Records, Types, and every posting list).
- **Postings**: `uint64[]` histories/by-author are tight-packed by MUD (4 per slot) — comparable to Road B's "5 per word"; `bytes32[]` scope/backlink/by-type lists are 1 per slot; Scopes store 3 words per entry (author, name, bindingKey) so a listing page can be fetched with one `getDynamicFieldSlice`.
- **Reconstruction**: the digest is over `abi.encode(Action[])` rebuilt from decoded field values; the packed physical layout never enters it. `test_reconstruct_signature_from_state` asserts byte-identity against the test's own `abi.encode` of the original actions.
- **No existence bit**: every EFS row carries an explicit ordinal/revision (absent reads as zero otherwise).

## Restricted-World sketch (deliberately left out of this probe)

Finding 2 asked for the World arm to stay eligible on paper. Sketch, not built: one dedicated `World` in the `efs` namespace whose owner (a) registers the Ledger logic as a **non-root System** (no delegatecall into World storage), (b) grants table access only to that System and an `efsidx` index System, (c) registers no hooks, (d) renounces the namespace **after** revoking every other grantee, and (e) deploys without `WorldProxy`. Costs to price if it is ever built: `world.call` routing (QUOTED 39,980 for a private-System `msgSender()` bracket — not a universal surcharge), `AccessControl._requireAccess` (QUOTED 9,129 cold), `_msgSender()` decoded from appended calldata (spoof-check needed), 12.7M deploy (QUOTED, `WorldFactory`), and a full authority manifest (root namespace, InitModule systems, delegations, surviving grants). It was not built because the coordinator selected one Store-only probe.

## Obligations this probe does not cover (carry as gates, not savings)

Byte carriers (availability, corrupt bytes, unavailable note), encryption, cold static-browser reconstruction, populated-testnet upgrade continuity, chain-state witness for native-author portability (graded `UNVERIFIED_NATIVE`), fixture step 10 beyond a stricter destination acceptor, cross-chain export/import (only a same-chain second Realm and `vm.chainId`), storage-growth measurement (script has no slot diff), the interaction term.

## Exact lease request

Owner: coordinator's heavy-run operator. Scope: one compile + tests + one finite Anvil + one script run; no background nodes, no state dumps.

```
cd /Users/james/Code/EFS/planning-road-c-lab/Reviews/2026-09-12-efs-path-decision/lab-c
forge --version && forge build --sizes                     # ~1–2 min; expect first-compile fixes (list above)
forge test -vvv 2>&1 | tee test.log                        # ~1 min after it compiles
anvil --chain-id 31337 --block-time 0 --port 8545 > anvil.log 2>&1 & echo $! > anvil.pid
RPC_URL=http://127.0.0.1:8545 \
ETHERS_PATH=/Users/james/Code/EFS/client/node_modules/ethers/lib.esm/index.js \
node script/measure.mjs > receipts.json                    # ~1 min
kill $(cat anvil.pid); rm -f anvil.pid
```

Expected duration: 20 minutes including one repair cycle. Scratch: `lab-c/out` + `lab-c/cache` (< 200 MB) + `anvil.log`/`receipts.json` (< 10 MB); total well under 2 GB. Watchdog: `timeout 1200` around the whole sequence; if `forge test` has not finished in 10 minutes, kill and report. Cleanup: `rm -rf out cache anvil.log anvil.pid` only. Nothing is committed; the coordinator publishes.
