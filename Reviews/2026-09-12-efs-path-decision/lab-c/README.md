# lab-c — Store-only MUD probe (DISPOSABLE LAB, NO PROTOCOL CLAIM)

**Standing:** disposable comparison plumbing for the [[../road-c|Road C]] arm of the [[../README|EFS path-decision sprint]]. Nothing here proposes EFS protocol bytes, names, ABIs or a deployment. **Nothing has been compiled or run**: no compiler lease has been granted (see `TODO.md` for the exact lease request). Every gas number anywhere in this folder is ESTIMATED or UNKNOWN until `script/measure.mjs` prints receipts.

**Author:** road-c-mud-specialist (Claude Fable 5.1) · **Date:** 2026-09-13 · **Branch:** `fable/2026-09-13-road-c-lab`, uncommitted by instruction.

## What this probe is

One matched MUD-backed adapter (the coordinator's shortlist slot), built on the **Store-only** boundary from [[../road-c]] and repaired against the five findings in [[../road-c-review]] plus the coordinator's four pre-seal checks. It runs the [[../sdk-fixture]] steps 1–6 in miniature with the [[../road-b]] §8 authorship closure (same `PublicationIntent`, Evidence cell, Admission rows, subject-id law and cursor law), so the two arms price the same guarantees.

```
                 EOA (EIP-712 PublicationIntent)        producer contract (native msg.sender)
                            │ publishSigned                       │ publishNative
                            ▼                                     ▼
┌──────────────────── Ledger  (StoreRead + StoreCore, Store #1, namespace "efs") ────────────────────┐
│ ordered-prefix batch · typed refs vs declared refTypes · view-only acceptance (typeId, codehash,   │
│ basis) · strict CAS · exact retry = AlreadyAdmitted · importPublication (source evidence graded +  │
│ separate destination authorization)                                                                │
│ tables: Records Admissions Evidence Bindings Subjects Types Nonces Counters                        │
└──────────────────────────────┬──────────────────────────────────────────────────────────────────────┘
                               │ IndexModule.onPublication(effects)  — same tx, revert = rollback
                               ▼
┌──────────────────── IndexModule  (Store #2, namespace "efsidx", writer = Ledger only) ─────────────┐
│ mandatory: Scopes (folder/tag/head lists) · BindingHistory · Backlinks · ByType · ByAuthor ·        │
│ Occurrences · Coverage(family) → COMPLETE | PARTIAL(through) | UNKNOWN                              │
└──────────────────────────────┬──────────────────────────────────────────────────────────────────────┘
                               │ IStoreRead only (getRecord / getStaticField / getDynamicFieldSlice …)
                               ▼
┌──────────────────── LensReader (stateless) ───────────┐     QuoteConsumer (unrelated, paid tx)
│ resolve / resolveAt (as-of via history) / list /      │ ◄── uses LensReader ABI + IStoreRead only
│ listTagged / history · seven-field cursor · StaleCursor│
└───────────────────────────────────────────────────────┘
```

## Boundary choice (finding 1) and why

`src/EfsStoreCore.sol` uses **`StoreRead` + `StoreCore` composition**, not `is Store`:

- `Store` is `IStore` = `IStoreKernel` (`IStoreRead` + `IStoreWrite` + error interfaces) + `IStoreRegistration`. Inheriting it obliges the contract to implement 10 raw write selectors and 3 registration selectors (as reverts) and to advertise them in its ABI.
- Composition inherits only `StoreRead` (13 view selectors) and calls the `StoreCore` library internally; initialization mirrors `StoreKernel`'s constructor (`StoreCore.initialize()`) and World's `InitModule` (`StoreCore.registerInternalTables()`), then registers the EFS tables. `HelloStore` is emitted and `storeVersion()` kept so log-driven MUD indexers can still decode the tables (ERC-7813 events are emitted unchanged by `StoreCore`).
- No `registerStoreHook` path exists, so no hook can ever be attached or removed; the acceptance gate is the Ledger's entrypoint code, not a hook. The per-write `StoreHooks` lookup in `StoreCore.setRecord` is one cold SLOAD per (transaction, table), warm afterwards.

**Denying raw writes is necessary, not sufficient** (the review's words). `test/RawWriteDenial.t.sol` feeds all 13 inherited-but-absent selectors table-correct inputs — validated by a PERMISSIVE `is Store` control (`test/OpenStore.sol`) on which the same inputs must succeed — to both Stores, checks that each call reverts and that row bytes, registry metadata (`Tables` layout/schemas, `ResourceIds`) and hook metadata (`StoreHooks`) are unchanged after every call, and covers attachment (zero/no-code rejected, one-shot, reciprocal, codehash-sealed), foreign writers and the missing fallback/receive on both contracts. These tests show the selectors are denied under valid inputs; they are not a proof that no write path exists. The semantic bypass tests (direct/batch/import/reuse, spoofed author, spoof-via-import, stale CAS, failed acceptance, failed index) are in `test/Fixture.t.sol`.

## External selector inventory (every reachable selector, both Stores)

Computed offline with a validated keccak; MUD user-defined value types encode as `bytes32`.

| Contract | Selector | Signature | Kind |
|---|---|---|---|
| Ledger, IndexModule | `0x3a77c2c2` | `getFieldLayout(bytes32)` | inherited `StoreRead`, view |
| " | `0xe228a4a3` | `getValueSchema(bytes32)` | view |
| " | `0xd4285dc2` | `getKeySchema(bytes32)` | view |
| " | `0xcc49db7e` | `getRecord(bytes32,bytes32[])` | view |
| " | `0x419b58fd` | `getRecord(bytes32,bytes32[],bytes32)` | view |
| " | `0xd03edb8c` | `getField(bytes32,bytes32[],uint8)` | view |
| " | `0x05242d2f` | `getField(bytes32,bytes32[],uint8,bytes32)` | view |
| " | `0x8c364d59` | `getStaticField(bytes32,bytes32[],uint8,bytes32)` | view |
| " | `0x1e788977` | `getDynamicField(bytes32,bytes32[],uint8)` | view |
| " | `0xa53417ed` | `getFieldLength(bytes32,bytes32[],uint8)` | view |
| " | `0x9f1fcf0a` | `getFieldLength(bytes32,bytes32[],uint8,bytes32)` | view |
| " | `0xdbbf0e21` | `getDynamicFieldLength(bytes32,bytes32[],uint8)` | view |
| " | `0x4dc77d97` | `getDynamicFieldSlice(bytes32,bytes32[],uint8,uint256,uint256)` | view |
| " | `0xc1122229` | `storeVersion()` | pure |
| Ledger | `0xf13020cc` | `publishNative(Intent,bytes[])` | **write** |
| Ledger | `0x6926c2f2` | `publishSigned(Intent,bytes[],Sig)` | **write** |
| Ledger | `0x5f8360cb` | `importPublication(ImportPacket,Intent,Sig)` | **write** |
| Ledger | `0x44a8bd16` | `intentDigest(Intent)` | view |
| Ledger | `0xa4469431` | `packetCommitment(ImportPacket)` | pure |
| Ledger | `0x8f742b34` | `decodeBody(bytes)` | pure (self-called inside try/catch) |
| Ledger | `0xf698da25` `0x490423a3` `0xd5bfc2c4` `0x0134956e` `0x2986c0e5` `0xb09e8797` `0xc28e1de8` + `decodeTypeBody(bytes)` `indexCodehash()` | `domainSeparator() realmId() realmOrigin() coreCodeCommitment() index() highWater() rulesEpoch()` | view/pure |
| IndexModule | `0x7c749fe1` | `onPublication(bytes32,uint64,Effect[])` | **write, `msg.sender == ledger` only** |
| IndexModule | `0x7a0ca1e2` | `attach(address)` | **write, deployer, one-shot** |
| IndexModule | `0x88ee4687` `0x56397c35` `0xd5f39488` `0x9f68ad04` `0xe8f1e32e` `0x17219522` + `ledgerCodehash()` | `coverage(bytes32,bytes32) ledger() deployer() obligationsId() poisonConcept() generation()` + `COV_*`/`FAMILY_*` constant getters | view/pure |
| LensReader | `0xc4740258` `0xf9ab1c25` `0xdb506d77` `0x23eb41f8` `0xe4890acf` `0xdde9e782` `0xb09e8797` `0x56397c35` `0x2986c0e5` | `lensHash resolve resolveAt list listTagged history highWater ledger index` + constant getters | all view/pure |
| QuoteConsumer | `0x0a879567` | `consume(address,address,Lens,bytes32)` | write (test consumer) |

**Inherited but absent (must revert, no fallback/receive):** `setRecord 0x298314fb`, `spliceStaticData 0xb047c1eb`, `spliceDynamicData 0xc0a2895a`, `setField 0x114a7266`, `setField(+layout) 0x3708196e`, `setStaticField 0x390baae0`, `setDynamicField 0xef6ea862`, `pushToDynamicField 0x150f3262`, `popFromDynamicField 0xd9c03a04`, `deleteRecord 0x505a181d`, `registerTable 0x0ba51f49`, `registerStoreHook 0x530f4b60`, `unregisterStoreHook 0x05609129`. Neither contract declares `fallback` or `receive`. No proxy, no delegatecall, no callback into the Ledger from acceptance (acceptors are called with STATICCALL and a 300k gas cap); `IndexModule.onPublication` is a trusted-code CALL that could re-enter `publish*` — there is no reentrancy guard (documented in `TODO.md`). Every `ecrecover` is behind a `v ∈ {27,28}` and low-s guard.

## Authority manifest

| Right | Holder | Duration |
|---|---|---|
| Publish (native/signed/import) | anyone; acceptance mandatory | permanent |
| Write index tables | Ledger only | permanent |
| `attach(ledger)` | deployer; rejects zero/no-code and non-reciprocal Ledgers; seals address + codehash both ways | until first call |
| Register a hook / raw write / upgrade / delegate | nobody (no path) | — |
| Force an index failure | `poisonConcept` immutable (test lever; zero = disabled, which the measured deployment uses) | permanent |

## Fixture coordinates (for an independent oracle)

Tables and their MUD words (namespace `efs` = Ledger, `efsidx` = IndexModule); an oracle re-derives rows from `IStoreRead.getRecord(tableId, [key], fieldLayout)` bytes without importing `src/tables/*`:

| Table | `_tableId` | `_fieldLayout` | `_valueSchema` | fields |
|---|---|---|---|---|
| Records | `0x7462656673…5265636f726473…` | `0x00280201200800…` | `0x002802015f07c4…` | typeId bytes32 @0, firstAdmission uint64 @32, body bytes (dyn 0) |
| Admissions (key uint64) | `0x7462656673…41646d697373696f6e73…` | `0x01060b00200120012020202020042000…` | `0x01060b005f005f005f5f5f5f5f035f…` | publicationId@0 kind@32 typeId@33 digestKind@65 digest@66 purpose@98 subject@130 role@162 target@194 expectedRevision(u32)@226 salt@230 |
| Evidence | `0x7462656673…45766964656e6365…` | `0x01451100200120200108082020200802082020200100…` | `0x014511005f005f5f0007075f5f5f0701075f5f5f00…` | author@0 proofKind@32 r@33 s@65 v@97 nonce(u64)@98 deadline@106 acceptanceProfile@114 indexObligations@146 actionsHash@178 firstAdmission@210 leafCount(u16)@218 basis@220 realmId@228 coreCodeCommitment@260 importOf@292 sourceGrade(u8)@324 |
| Bindings | `0x7462656673…42696e64696e6773…` | `0x002c0300200408…` | `0x002c03005f0307…` | target@0 revision(u32)@32 admission(u64)@36 |
| Subjects | `…5375626a65637473…` | `0x00480300202008…` | `0x004803005f5f07…` | creator@0 creatorSalt@32 admission@64 |
| Types | `…5479706573…` | `0x003c0301142008…` | `0x003c0301615f07c1…` | acceptor(addr)@0 acceptorCodehash@20 admission@52 refTypes bytes32[] (dyn 0) |
| Nonces / Counters | `…4e6f6e636573…` / `…436f756e74657273…` | `0x00080100080…` | `0x0008010007…` | uint64 @0 |
| Scopes / Backlinks / ByType | `efsidx` … | `0x00000001…` | `0x00000001c1…` | bytes32[] (Scopes: triples author,name,bindingKey) |
| BindingHistory / ByAuthor | `efsidx` … | `0x00000001…` | `0x0000000169…` | uint64[] tight-packed (4 per slot) |
| Occurrences | `…4f6363757272656e636573…` | `0x0004010004…` | `0x0004010003…` | count uint32 @0 |
| Coverage | `…436f766572616765…` | `0x0012040001010808…` | `0x0012040060600707…` | mandatory(bool)@0 declared@1 declaredAt(u64)@2 through@10 |

Full 64-hex words are in `src/tables/*.sol`; the encoder used to produce them was cross-checked against MUD's own `Tables` (`0x0060030220202000…`, `0x006003025f5f5fc4c4…`) and `StoreHooks` (`0x00000001b6…`) constants. Id formulas: see `MANIFEST.draft.json → fixtures.ids`.

## Tests (plain Solidity, `require` assertions, hand-declared `Vm`, unrun)

`test/RawWriteDenial.t.sol`: permissive `OpenStore` control accepts the inputs; 13 raw selectors denied on both Stores with row/registry/hook metadata unchanged after each call; read surface works; index writer = the sealed Ledger only; attach rejects zero/no-code/non-reciprocal and is one-shot; Ledger rejects zero/no-code modules and refuses an unattached/foreign module; no fallback/receive on either contract.
`test/Fixture.t.sol`: steps 1–6 (items/pair with checked refs; A1 signed fresh body with pre-absence; A2 CAS + history; B1 genuine producer contract; three Lenses agree across point/list/tag; move → path reuse → remove → restore with stable subject, tag and history), rejections with pre/post read-back (wrong-Type pair, missing pair rolls back the earlier subject mint, stale CAS, failed acceptance, failed mandatory index), signature mutations (name/target/subject/expectedRevision/order/typeId/digestKind/realm) then the original admits, exact retry, existing-body by another author and `digestKind=RECORD_ID` reuse (wrong Type rejected), spoofed AUTHOR_B from an EOA and an unrelated contract, **pre-seal 2 (SELF-CHECK)** digest + signer recovery from public state through a reader contract that uses the candidate's own decoders and encoder — a consistency self-check, not the independent oracle re-derivation from raw `IStoreRead.getRecord` bytes, which is owed — plus the flipped-discriminator negative, **pre-seal 3** import (source signature alone rejected; authorization must be held; wrong packet rejected; id(F) and source evidence preserved with grade; importer ≠ author is the destination authority; duplicate import refused; destination rule v2 rejects A2 that the source accepted; a native-source packet claiming AUTHOR_B is rejected `UnsupportedSourceProof` with state unchanged), **pre-seal 1** deployment-bound identity: same contract + salt on two Ledger deployments → different principals and subject ids by design, native sources not importable, **pre-seal 4** basis-pinned continuation, stale generation, wrong scope, dedupe across authors, coverage COMPLETE/PARTIAL/UNKNOWN, and the unrelated paid consumer under all three Lenses.

## How the lease holder runs it (not run here)

```
cd Reviews/2026-09-12-efs-path-decision/lab-c
forge build --sizes            # per-contract runtime/initcode bytes -> MANIFEST build.perContractBytes
forge test -vvv                # expect first-compile fixes; see TODO.md "compile risks"
anvil --chain-id 31337 --block-time 0 &   # finite, run-owned; kill afterwards
RPC_URL=http://127.0.0.1:8545 ETHERS_PATH=/Users/james/Code/EFS/client/node_modules/ethers/lib.esm/index.js node script/measure.mjs > receipts.json
```

## Identity (deployment-bound, by design)

`realmOrigin = keccak("efs2/origin/1", chainId, ledgerAddress)`; contract principal = `(kind, realmOrigin, account)`; EOA principal = `(kind, 0, account)`. A signed intent replays only on its chain + Ledger deployment (`realmId`) with the same code (`coreCodeCommitment`) and rule context. A verified import keeps the original principal; the code hash is retained in the Evidence cell as execution evidence only.

## Classification

Demonstrated: nothing (no compile). Designed, tests written, unrun: everything above. Unsupported by design in this probe: byte carriers, encryption, populated-upgrade continuity, chain-state witness for native-author portability (graded `UNVERIFIED_NATIVE`), fixture step 10 beyond a stricter destination acceptor, cold static browser. Unknown: all gas, all bytecode sizes, the interaction term.
