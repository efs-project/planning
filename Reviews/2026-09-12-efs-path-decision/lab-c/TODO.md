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
12. **Identity is deployment-bound by design** (coordinator handoff, adopted): `realmOrigin = keccak("efs2/origin/1", chainId, ledgerAddress)`; contract principal = `(kind, realmOrigin, account)`; replay of a signed intent is bound to chain + Ledger deployment (`realmId`) plus code (`coreCodeCommitment`) and rule context (`acceptanceProfile`, `indexObligations`). Two Ledger deployments on one chain are two Realms with two origins; a verified import keeps the original principal; the code hash is recorded in the Evidence cell as execution evidence only. Native (grade-zero) sources are not importable in this probe (`UnsupportedSourceProof`): no attributed cell, no writes as that principal, until a chain-state witness profile exists.
13. **Stack discipline without the memory mover** (build #1 failure): the vendored Store's 273 non-memory-safe `assembly` blocks disable via-IR's stack-to-memory mover in every contract that inlines them. Restructured: `Ledger.importPublication` → `_validateAuthorization` / `_openImport` / `_runImport` / `_authEvidence` / `_sourceEvidence` over an `ImportCtx`; `_publish` → `PubCtx` + `_runActions` + `_evidenceOf`; `_admitRecord` → `_loadType` / `_canonical` / `_checkRefs` / `_accept` over a `TypeRow`; `EfsIds.intentDigest` takes a `DigestInput` struct; `LensReader.resolveAt`/`_bindingAt` use a `Hit` struct and `list` uses `ListCtx` + `_visit`; all 17-field `EvidenceData` / 11-field `AdmissionData` / 10-field `Action` literals became field assignments; test seeding split into body helpers. No `assembly` exists in `src/` or `test/` — keep it that way (or annotate `("memory-safe")` if one is ever added).

## EIP-170 / code size (report, not a measurement)

Per-contract **source** sizes (bytes of `.sol`, not bytecode): Ledger 21,228 (+ tables 21,330 inlined as internal libs) · IndexModule 5,257 (+ IndexTables 13,714) · LensReader 11,316 · Consumer 2,121 · EfsStoreCore 2,383 · EfsTypes 9,451. Vendored Solidity reachable from `Ledger` through `StoreRead`+`StoreCore`: ≈ 8,700 lines (StoreCore 1,221; tightcoder 2,681; Bytes 830; StoreSwitch 585; codegen tables 1,886; Storage/FieldLayout/Schema/EncodedLengths/Slice/Hook ≈ 1,240) — but only the internal functions actually referenced are linked, and the tightcoder/Bytes files are almost entirely unused generated overloads.

Risk assessment: the **Ledger** is the only contract with a plausible EIP-170 (24,576 B) problem: 13 `StoreRead` externals + 14 EFS externals + inlined `StoreCore` write/read paths + 8 table libraries + import logic + 34 custom errors. Its runtime size is UNKNOWN until the coordinator's `forge build --sizes`. **Decomposition trade if it is over the limit** (allowed by the review): (a) move `importPublication` + `_validateAuthorization` + `_gradeSource` + the two import evidence writers into a separate `Importer` contract that the Ledger recognises as an authorised caller of an internal-only `_runActions` path — cost: one more sealed authority row (address + codehash), one extra CALL per import, a second contract to pin; saves the largest single function; (b) drop the `StoreRead` external read surface from the Ledger (readers then use `LensReader`/raw slot getters) — cost: loses the "IStoreRead public reads only" property and ERC-7813 indexer compatibility, so it is a last resort; (c) shrink the ABI by overriding the 5 `getFieldLength`/`getField` overloads with reverts — cost: violates "keep IStoreRead" and adds dead selectors. Prefer (a); report the measured runtime bytes of both variants if (a) is taken. IndexModule and LensReader are expected to fit comfortably.

## Decomposition applied after build #2d (Ledger 25,032 B)

- `src/ActionLib.sol` (internal, inlined) holds the shared write machinery; `src/ImportLib.sol` (external, DELEGATECALL) holds the import path; `src/LedgerErrors.sol` holds file-level errors/events; `Ledger.packetCommitment` (dead public view) removed. No new privileged path: the library has no storage and its address is immutable in the Ledger bytecode; its address + codehash are deployment identity (MANIFEST `build.linkedLibraries`).
- **Cost line to charge:** one DELEGATECALL per `importPublication` (ESTIMATED ≈ 2,600 gas cold + packet calldata copy); publish paths unchanged. Measure it as the difference between the import row and the same actions published natively at the destination.
- **ESTIMATED sizes** (unmeasured): Ledger ≈ 18–20 KB (removed: validation/grading/two evidence writers/runImport/packetCommitment ≈ 5–7 KB), ImportLib ≈ 15–18 KB, others unchanged. If still over: move `ActionLib.publish` behind the same external library (second DELEGATECALL per publication, also charged); last resort: shrink `StoreRead` — every removed selector must be listed with its reader impact (LensReader and the browser use `getRecord/getStaticField/getDynamicField/getDynamicFieldLength/getDynamicFieldSlice`; the `getField`/`getFieldLength` overloads are unused by our readers but are part of the ERC-7813 surface indexers expect).
- **EIP-3860 (tests):** `test/Fixture.sol` (deployed helper), `test/DenialProbe.sol`, thin `test/LabBase.sol`, suite split into `Publish/Selection/Import.t.sol`; each test contract's initcode is now dominated by the table decoders it asserts with (ESTIMATED < 30 KB each; measure with `forge build --sizes` which reports test contracts too).

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

## Exact lease request (same run controls as lab-b)

Owner: coordinator's heavy-run operator. Scope: one compile + tests + one finite, bounded-history Anvil + one script run; no background nodes, no state dumps, no traces.

```
LAB=/Users/james/Code/EFS/planning-road-c-lab/Reviews/2026-09-12-efs-path-decision/lab-c
SCRATCH=<run-owned scratch dir, < 2 GB>                        # e.g. $LAB/.run-$(date -u +%Y%m%dT%H%M%SZ)
cd $LAB && mkdir -p $SCRATCH && echo "start=$(date -u +%FT%TZ)" > $SCRATCH/run.txt
forge --version && forge build --sizes 2>&1 | tee $SCRATCH/build.log     # ~1–2 min; per-contract bytes -> MANIFEST build.perContractBytes
forge test -vvv 2>&1 | tee $SCRATCH/test.log                             # ~1 min once it compiles; tests may be red on first pass
PORT=$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')   # free loopback port
anvil --host 127.0.0.1 --port $PORT --chain-id 31337 --hardfork cancun --prune-history 256 \
      --accounts 4 --gas-limit 30000000 --cache-path $SCRATCH/anvil-cache > $SCRATCH/anvil.log 2>&1 &
echo "anvil_pid=$! port=$PORT" >> $SCRATCH/run.txt
RPC_URL=http://127.0.0.1:$PORT ETHERS_PATH=/Users/james/Code/EFS/client/node_modules/ethers/lib.esm/index.js \
  node script/measure.mjs > $SCRATCH/receipts.json                        # ~1 min; receipts only, no debug_* RPC
kill $(awk -F'[= ]' '/anvil_pid/{print $2}' $SCRATCH/run.txt); echo "stop=$(date -u +%FT%TZ)" >> $SCRATCH/run.txt
```

Recorded per run: PID, port, start/stop timestamps (`run.txt`), build/test/anvil logs and `receipts.json` — all under `$SCRATCH`. Expected duration: 20 minutes including one repair cycle. Scratch: `out` + `cache` (< 200 MB) + `$SCRATCH` (< 50 MB); total well under 2 GB; disk reserve untouched. Watchdog: `timeout 1200` around the whole sequence; if `forge test` has not finished in 10 minutes, kill and report. Cleanup: `rm -rf out cache` and the run's own `$SCRATCH` only. Nothing is committed; the coordinator publishes.
