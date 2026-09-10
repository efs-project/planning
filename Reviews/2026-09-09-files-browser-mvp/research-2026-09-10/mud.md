<!-- Research strand: MUD (Lattice) deep dive -->
<!-- Provenance: produced 2026-09-10 by a research agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering
     lead's reading, verification notes and corrections are in ../indexing-and-state-2026-09-10.md. -->

# MUD (Lattice) deep dive for EFS v2 — 2026-09-10

Sources: shallow clone of `latticexyz/mud` `main` at commit `0e49b51b` (2025-09-30, package version 2.2.23), its `docs/pages/*.mdx`, `packages/*/gas-report.json`, mud.dev, GitHub/npm metadata, ERC-7813, lattice.xyz, latticexyz/dozer. Labels: MEASURED = number from MUD's committed forge gas reports or a public API; QUOTED = verbatim/paraphrase from docs or code; ESTIMATED = my arithmetic.

## 0. Status first, because it changes the decision

- **Lattice is winding down.** lattice.xyz (fetched today): "Redstone is shutting down on May 15, 2026. Please withdraw any remaining funds before then." Press (KuCoin, 2026-04-15) reporting Lattice's X post (x.com/latticexyz/status/2044103611072835744): "After five years, Lattice is winding down"; MUD, Quarry, Dozer open-sourced; DUST moved to its own chain (Conduit / OP Foundation) with the "MUD migration tool" and is continued by 0xPARC. I could not fetch the X post directly; the "MUD is feature complete" wording exists only in press summaries.
- **Repo liveness (MEASURED via GitHub/npm API):** last commit on `main` 2025-09-30; last stable release 2.2.23 (2025-08-26); canary builds `2.2.24-<sha>` published 2026-04-09/10; `pushed_at` 2026-04-10; 510 open issues; the last four external PRs (May–June 2026) were closed unmerged; two PRs from March 2026 still open. Effectively unmaintained since April 2026. License MIT ("Lattice Labs Ltd").
- **Dozer (Rust indexer) is still alive:** `latticexyz/dozer` `pushed_at` 2026-08-31, MIT.
- **ERC-7813 "Store, Table-Based Introspectable Storage"** (authors alvarius, dk1a, frolic, ludens, vdrg, yonada; created 2024-11-08) is in **Last Call, deadline 2026-06-16** per eips.ethereum.org today; not yet marked Final. It standardizes the events, `IStore` read interface, schema/ResourceId encoding, and explicitly leaves storage layout and access control to implementations.
- Audit: OpenZeppelin, 2024-02-11 (contracts + codegen), docs/pages/audits. Two public retrospectives (2023-09-12 root-access vuln via `registerSystem`; 2024-04-17 `StoreRead.getDynamicFieldLength` bug) show a real incident process.
- Largest production users I could confirm: EVE Frontier (CCP Games; docs.evefrontier.com/smart/mud-explainer says tables are "an auto-generated library wrapper around the lower level MUD Store layer") and DUST. Whether CCP or 0xPARC will maintain a fork: **could not find**.

Net: the code is small, audited, frozen and MIT; the company is gone. "Use their stuff" means "adopt and be prepared to fork", not "depend on a maintained upstream".

## 1. Architecture

**Store** (`packages/store`) is a storage layer, not a contract you call: `StoreCore` is an internal library implementing all reads/writes; `Store.sol` / `StoreKernel.sol` are abstract contracts exposing them; `IStore` is the external interface. Any contract can `is Store` and get tables, events and hooks with no World at all.

- **Tables** are registered at runtime: `StoreCore.registerTable(tableId, fieldLayout, keySchema, valueSchema, keyNames, fieldNames)` writes to two bootstrap tables, `Tables` (fieldLayout, keySchema, valueSchema, abi-encoded names) and `ResourceIds` (exists flag) (`StoreCore.sol:155-224`). So **a table's schema is readable on-chain by any contract** via `getFieldLayout/getKeySchema/getValueSchema` — this is what "introspectable" means in ERC-7813.
- **Schema/FieldLayout** are each one `bytes32`: 2 bytes total static length, 1 byte #static, 1 byte #dynamic, 28 bytes of per-field types/lengths (`Schema.sol`, `FieldLayout.sol`). Limits (`constants.sol`): **28 fields total, at most 5 dynamic**, static fields ≤32 bytes, statics before dynamics. Key schema: up to 28 static-type fields, no dynamic keys.
- **Keys**: a record is addressed by `(tableId, bytes32[] keyTuple)`; each key field is coerced to a `bytes32` by codegen (`bytes32(uint256(k))`, `bytes32(uint256(uint160(addr)))`, etc., `test/codegen/tables/KeyEncoding.sol:83-88`). Empty key tuple = singleton table.
- **ResourceId** = `bytes32`: 2-byte type (`tb` table, `ot` offchain table, `ns` namespace, `sy` system) + 14-byte namespace + 16-byte name (`ResourceId.sol`, `WorldResourceId.sol:29`).
- **How a contract writes/reads**: `tablegen` generates a typed library per table (e.g. `Position.set(entity, x, y)`, `Position.getX(entity)`, `Inventory.pushSlots(entity, 1)`, `getItemSlots`, `lengthSlots`, `updateSlots`) with two variants: `set`/`get` go through `StoreSwitch` (internal call if `address(this)` is the store, else external `IStore(store).setRecord(...)`), `_set`/`_get` call `StoreCore` directly (`test/codegen/tables/Mixed.sol`). A foreign contract reads a World's table with `StoreSwitch.setStoreAddress(world); Position.get(entity)` or raw `IStore(world).getRecord(tableId, keyTuple)` (docs/world/tables.mdx).
- **Events** (`IStoreEvents.sol`): `Store_SetRecord(tableId indexed, keyTuple, staticData, encodedLengths, dynamicData)`, `Store_SpliceStaticData(tableId, keyTuple, uint48 start, bytes data)`, `Store_SpliceDynamicData(tableId, keyTuple, uint8 dynamicFieldIndex, uint48 start, uint40 deleteCount, encodedLengths, data)`, `Store_DeleteRecord(tableId, keyTuple)`. Every write emits exactly one. `Store_SetRecord` carries the full encoded value, so the log stream is a complete replica with zero schema knowledge beyond the on-chain `Tables` table.
- **Hooks** (`StoreHook.sol`, `storeHookTypes.sol`): per-table list of `bytes21` (address + 8-bit enable bitmap) for before/after SetRecord/SpliceStatic/SpliceDynamic/DeleteRecord; hooks are external calls; not allowed on offchain tables.

**World** (`packages/world`) is a single contract `World is StoreKernel` that owns all state and routes calls:

- **Namespaces** are the only owned resource (`NamespaceOwner` table). Anyone can `registerNamespace` an unused name; the root namespace (`bytes14(0)`) is owned by the deployer and can be renounced to `address(0)` to freeze (docs/world/namespaces-access-control.mdx).
- **Access control** (`AccessControl.sol:26-30`): `hasAccess(resourceId, caller) = ResourceAccess[namespaceId][caller] || ResourceAccess[resourceId][caller]`; owner can `grantAccess/revokeAccess/transferOwnership`. Every external write on the World (`setRecord`, `setField`, `spliceStaticData`, `pushToDynamicField`, `deleteRecord`…) does `AccessControl._requireAccess(tableId, msg.sender)` (`World.sol:137-332`). Reads are unrestricted views. MEASURED: `hasAccess` cold 9,086 gas, warm namespace-only 1,582.
- **Systems** are stateless contracts registered under a ResourceId (`registerSystem(systemId, addr, publicAccess)`). Non-root systems are invoked with `CALL` and must write back through `IStore` (access-checked); **root-namespace systems are `DELEGATECALL`ed and bypass access control** (`SystemCall.sol:56-70`, docs/world/tables.mdx:12-19). The original sender is appended to calldata (`WorldContext.appendContext: callData || msgSender || msgValue`) and read with `_msgSender()`. Functions can be exposed on the World as `ns__fn` selectors via `FunctionSelectors` + `fallback` (`World.sol:414-429`). `callFrom` supports delegation (user→delegatee, user fallback, namespace fallback; std-delegations module adds callbound/systembound/timebound).
- **Client sync** (`packages/store-sync`, `block-logs-stream`, `protocol-parser`): `createStoreSync` (1) optionally fetches a **snapshot** of `Store_SetRecord`-shaped logs from an indexer (`getSnapshot.ts`, three API generations for back-compat), (2) then/otherwise replays **`eth_getLogs`** from `startBlock` in chunks (`fetchLogs`, default `maxBlockRange = 1000n`, retry on rate limits; `getRecords.ts` uses 100,000), (3) feeds a storage adapter (RECS, Zustand, **Stash**, SQLite, Postgres event-only, Postgres decoded), (4) then follows new blocks (also a preconfirmation stream for Wiresaw). **With no indexer the client works on any chain with a standard RPC**; the cost is initial hydration time and provider log limits. `docs/guides/replicating-onchain-state.mdx` shows the whole replay in ~40 lines of TS.
- **Offchain tables** (`ot` type): `StoreCore.setRecord/spliceStaticData/deleteRecord` emit the event and `return` before touching storage or hooks (`StoreCore.sol:311-316, 402-407, 600-605`); `spliceDynamicData` **reverts** for them because it needs the previous lengths from storage (`:990-994`). They exist only in indexers/clients.

## 2. Storage encoding and measured gas

Layout (`StoreCoreInternal`, `StoreCore.sol:953-955, 1146-1206`), with `h = keccak256(abi.encodePacked(tableId, keyTuple))` computed once:

| Region | Slot | Contents |
| --- | --- | --- |
| static data | `keccak256("mud.store") ^ h` | all static fields **tightly packed, no padding**, spilling into consecutive slots (`Storage.store` masks partial words with read-modify-write, `Storage.sol:42-121`) |
| dynamic lengths | `keccak256("mud.store.dynamicDataLength") ^ h` | one word: low 7 bytes = total (uint56), then five 5-byte (uint40) per-field lengths (`EncodedLengths.sol:11-17`) |
| dynamic field i | `keccak256("mud.store.dynamicData") ^ bytes1(i) ^ h` | raw bytes across consecutive slots |

Consequences: a record with S static bytes and no dynamic fields costs `ceil(S/32)` slots; each dynamic field adds `ceil(len/32)` slots plus the shared lengths word. Slot derivation is one keccak + XORs (MEASURED 26k gas for 576 keccaks in EFS's tag; MUD would do ~1 per record). Delete zeroes static data and the lengths word but **leaves dynamic bytes in place** (`:619-628`); reads are bounded by the stored length, and `getDynamicFieldSlice` re-checks bounds for that reason (`:928-935`). Length-changing splices must be at the end of the field so log replay matches storage (`:999-1003`).

MEASURED, `packages/store/gas-report.json` and `packages/world/gas-report.json` at commit `0e49b51b` (forge `startGasReport` spans, so no 21k intrinsic, no calldata cost):

| Operation (context from the test file) | Gas |
| --- | --- |
| `StoreCore.setRecord`, 4 static fields = 6 bytes, cold, internal (`StoreCoreGas.t.sol:164-173`) — this is the "32,095" in EFS's comparison table | 32,095 |
| same, 2-slot static record | 54,603 |
| set one static field, 1 slot / spanning 2 slots | 30,988 / 33,570 |
| set first dynamic field, 1 slot (lengths word + data word, both cold) / second dynamic field (lengths warm) | 55,968 / 36,193 |
| push 1 uint32 to dynamic field (warm) / push 10 uint32 (2 slots) | 9,486 / 38,157 |
| `Mixed` = {uint32, uint128, uint32[2], string "some string"} set, internal cold / external cold | 102,753 / 107,581 |
| **same struct stored with native Solidity** (`Mixed.t.sol:113-120`) | 91,999 |
| get `Mixed` record, internal warm / external warm | 14,378 / 16,687 |
| access non-existing record / static field of non-existing record | 7,047 / 3,322 |
| get dynamic field slice, cold 1 slot | 5,551 |
| delete record (3 slots) | 7,326 |
| register table, `StoreCore` / via World | 650,835 / 572,591 |
| set record on a table with one hook subscriber / call one enabled hook | 106,642 / 37,625 |
| **offchain** table `setRecord`, same 6-byte record, via external self-call (`:742-755`) / delete | 32,481 / 28,209 |
| World: `TwoFields.set(tableId, true, true)` via external `world.setRecord` incl. access check + event (`World.t.sol:789`) | 64,661 |
| World: set one field via `world.setField` | 60,804 |
| World: `world.call(systemId, msgSender())` — non-root system, no args, no writes | 39,980 |
| World: same through `WorldProxy` (ERC-1967) | 44,897 |
| World: `batchCall` two calls | 77,277 |
| World: register namespace / system / function selector / unlimited delegation | 143,841 / 185,170 / 116,398 / 74,634 |
| deploy a World via `WorldFactory` | 12,742,614 |

Reading the offchain number honestly: 32,481 (external call, event only) vs 32,095 (internal, one cold SSTORE) are not apples-to-apples; the external-call overhead roughly offsets the missing 22,100 cold SSTORE. ESTIMATED: for a record of N fresh slots an offchain table saves about N × 20k+ in SSTORE and the refund-ineligible cost of later zeroing, at the price of **zero on-chain readability** — for EFS constraint (1) offchain tables are only usable for data no contract ever needs. MUD's own docs say the same ("only available offchain", docs/world/resource-ids.mdx).

Also honest: for the mixed record MUD costs ~12% **more** than a native Solidity struct (102,753 vs 91,999) — the premium buys the event, the packed lengths word and the introspectable schema. MUD's win over EFS is not cleverness per slot; it is that a record is 1–4 slots instead of 94.

## 3. Indexing — what a contract can query

Built-in: **nothing beyond point lookup by key tuple.** QUOTED (docs/world/tables.mdx:30): "by default MUD does not keep a list of keys written to a table onchain, to save on storage operations." There is no "all records where field X = Y", no range, no ordering, no pagination.

Two opt-in root modules (`packages/world-modules`), both installed with `installRootModule` because they need a store hook on the source table:

- **KeysInTable** (`KeysInTableHook.sol`): maintains `KeysInTable` (five parallel `bytes32[]` arrays keys0..keys4) + `UsedKeysIndex(tableId, keccak(keyTuple)) → (has, index)`; swap-and-pop on delete; **only the first five key fields are indexed**; only records written after installation. MEASURED: install 1,462,000; set record with it installed 193,018 (vs 64,661 without → ~128k overhead, ESTIMATED); delete 149,159 / 226,500 composite. `getKeysInTable(tableId)` returns every key (unbounded view).
- **KeysWithValue** (`KeysWithValueHook.sol`): reverse map `keccak256(staticData ‖ encodedLengths ‖ dynamicData) → bytes32[] keys`, i.e. **by hash of the entire encoded value, not one field**; comment in source: "This is a very naive and inefficient implementation for now"; "if a table with composite keys is used, only the first key of the tuple is indexed"; removal is a linear filter + full array rewrite. MEASURED: install 717,993; set record with it 174,377 (~110k overhead, ESTIMATED); change record 167,214; `getKeysWithValue` warm 9,614.
- **query.sol**: `Has/Not/HasValue/NotValue` fragments intersected in memory from those two arrays — an ECS-style query, linear in table size, view-only in practice.

So "field X = Y" is answered on-chain only by the ECS trick: make X its own one-column table (component) and hash-index the whole value. That is MUD's cultural answer (entities = bytes32 keys, components = tables), and it is why MUD games do their real queries client-side. What is pushed off-chain: everything else. Stash (client) got "experimental support for indices and derived tables" in 2.2.23 (CHANGELOG 2025-08-25); the hosted SQL API (`docs/indexer/sql.mdx`, `POST /q` with `SELECT` subset) and Dozer's `GET /api/logs?input={chainId,address,filter:[{tableId,key0,key1}]}` exist only where someone runs them. On a chain with no indexer: contracts have point lookups + the two modules; clients replay `eth_getLogs` (works, slower); nobody has SQL.

## 4. History, mutability, attribution

- **Mutable in place.** `setRecord` overwrites; splices patch bytes; delete zeroes. No version counter, no previous-value retention, no content addressing — keys are chosen by the writer (`bytes32`, often a `UniqueEntity` nonce, MEASURED 82,173 gas to mint one). Storage reflects only the current value, and ERC-7813 codifies that: state at a block MUST equal the fold of events up to that block.
- **History lives only off-chain.** Postgres "events only" indexer stores raw logs; Dozer's `records` table keeps `block_num/log_idx` and `expired_block_num/expired_log_idx` per version so "the block number in the request enables point-in-time queries" (dozer README). Contracts cannot see any of it.
- **Attribution: none in Store.** `IStoreEvents` carry no sender; `Tables`/records have no author column. The World knows the caller (`_msgSender()` appended to calldata) and gates writes on it, but nothing records it unless your schema has an `address` field. Off-chain you get `tx.from` of the log.
- **Multi-author disagreement: not modeled.** Exactly one value per `(table, keyTuple)`; whoever has namespace/resource access last wins. Different authors saying different things about the same key can only be different tables in different namespaces, and a reader hardcodes which table it trusts. Hooks can veto writes (docs' `FreezeCounter` example reverts in `onBefore*`), which is the only "policy" seam. This is the exact opposite of EFS's Lens.

## 5. Upgrades and extensibility

- **New tables after deployment:** anyone with namespace ownership calls `registerTable` (MEASURED 572,591 via World). **Schemas are immutable once registered** (docs/store/tables.mdx); to add fields you create a new table with the same key schema.
- **Systems:** re-`registerSystem` the same ResourceId with a new address (namespace owner); old contract loses namespace access, manually-granted access is *not* revoked (docs/world/systems.mdx "Upgrading systems", with a warning about re-registering the old contract elsewhere).
- **World itself:** immutable unless deployed behind `WorldProxy` (ERC-1967; `deploy.upgradeableWorldImplementation: true`), +~5k gas per call (MEASURED 44,897 vs 39,980).
- **Third parties:** `registerNamespace` (any unused 14-byte name), `StoreSwitch.setStoreAddress(world); MyTable.register()`, `registerSystem`, `registerFunctionSelector` → callable as `world.myns__fn()`; may read every table, write only their own namespace unless granted; store hooks only on tables whose namespace they own (docs/guides/extending-a-world). **Modules** are on-chain install scripts: `installModule` (CALL, no privileges) vs `installRootModule` (DELEGATECALL, root); the KeysWithValue/KeysInTable/ERC-20/ERC-721/UniqueEntity/std-delegations modules ship this way. Root owner can renounce to `address(0)` to make the core permanently unowned.

## 6. What EFS can reuse, copy, or must reject

**Reuse directly (MIT, no World required):**
- `@latticexyz/store` Solidity libs: `FieldLayout`, `Schema`, `EncodedLengths`, `Storage` (packed multi-slot store/load with masks), `Slice`, `Bytes`, `tightcoder`. These are the physical layer that makes a record 1–4 slots. EFS's record bodies (immutable, ≤ a few hundred bytes) map cleanly onto "static header fields + ≤5 dynamic fields"; the splice machinery is irrelevant for immutable records but harmless.
- The **event protocol** (ERC-7813). If EFS emits `Store_SetRecord`-compatible logs and registers its schemas in a `Tables` table, it inherits, unchanged: `store-sync` (RPC-only hydration for constraint 2/3, snapshot when an indexer exists), `protocol-parser` (`decodeRecord/decodeKeyTuple/encodeRecord…`), `stash` (client store with ECS queries, indices, derived tables), `store-indexer` (SQLite/Postgres), Dozer (Rust, point-in-time), the explorer, and the SQL API. That is more client infrastructure than EFS will write in a year, and it is exactly the "on-chain indexes, no external dependency" shape: the no-indexer path is `eth_getLogs` replay.
- `ResourceId` (type ‖ namespace ‖ name) and `AccessControl` (namespace-or-resource, 1–2 SLOADs), and the `bytes21` hook encoding.

**Copy as pattern:**
- One event per write carrying the full encoded value, plus on-chain schema registry → any indexer is schema-agnostic.
- Codegen'd typed accessors (`tablegen`) for EFS schemas in the SDK.
- "Offchain table" as an explicit event-only tier for data no contract reads.
- Modules as on-chain install scripts for optional indexes (each index is a hook that pays per write — MUD's docs put a "gas overhead on every write" warning on both index modules).
- Write-once via hook: `onBeforeSetRecord` reverting if the key exists gives MUD-shaped immutability for content-addressed records (key = `keccak(type, body)`).

**Genuinely incompatible (do not adopt the World):**
- One truth per key vs Lens; no attribution; no history; writer-chosen keys vs content addressing; delete leaves garbage; single-owner namespaces; root systems run `DELEGATECALL` with unrestricted storage access; ~40k gas of routing per system call. A plausible bridge exists — records table keyed by contentId (write-once hook), a mutable `bindings` table `(position) → recordId`, and a `claims` table `(author, position) → recordId` with Lens resolution done by the reader — but that is EFS logic on top of Store, not use of World.
- MUD's on-chain query answer is weaker than what EFS needs: KeysWithValue hashes the whole value and is linear on removal; Farcaster-style enumerable per-identity sets (EFS's postings) are beyond it. Keep EFS's index design; just stop paying 94 slots for it.

ESTIMATED: an EFS tag modeled as Store records — one 64-byte record (2 slots) + one binding (1) + one claim/posting entry (~2) — is ~5 fresh slots ≈ 110k SSTORE + ~25k per external-checked write ≈ 150–200k gas through a World-style entry point, i.e. 14–19× cheaper than today's 2,838,264, and in EAS's band. Batching would not help there either, for the same per-record reason EFS already measured.

## 7. Verdict

Where MUD is simply better engineered than EFS today: the storage layer (one keccak, tight packing, 32k–65k per small record vs 2.8M/94 slots), the event/replay protocol and the entire sync/indexer/client stack behind it, the codegen, the 1–2-SLOAD access check, the on-chain schema registry, the audit, docs and incident retrospectives. EFS should adopt `@latticexyz/store`'s physical encoding and ERC-7813 event compatibility outright, and treat the EFS-specific "publication envelope + postings" as the only thing left to design.

Where EFS's requirements exceed MUD's model: pluralistic resolution (Lens), retained history, content-addressed identity, attribution, and contract-readable enumerable indexes. MUD offers no primitive for any of these; its production users (DUST, EVE Frontier) solve them by convention (one owner, one truth) and off-chain (Dozer/Stash). Do not import the World.

Risk to price in: upstream is dead as of April 2026 (company wound down, Redstone off 2026-05-15, `main` frozen at 2.2.23/2025-09-30, last PRs closed unmerged); Dozer is still being pushed (2026-08-31); ERC-7813 is Last Call, past its deadline, not Final. Adopting means forking ~15 Solidity files and a TS toolchain that are audited and stable; that is a reasonable bet, but it is a fork, not a dependency.

Could not find: a first-party Lattice blog post about the wind-down (blog index lists none); an in-repo "migration tool" at this commit (`packages/cli/src/commands` has no migrate command — it may live elsewhere or post-date the clone); who maintains MUD going forward; the final disposition of ERC-7813.

## Sources
- Repo (commit 0e49b51b, 2025-09-30): `packages/store/src/{StoreCore,Storage,FieldLayout,Schema,EncodedLengths,constants,IStoreEvents,ResourceId,StoreSwitch,Store}.sol`; `packages/world/src/{World,AccessControl,SystemCall,WorldContext,WorldResourceId}.sol`; `packages/world-modules/src/modules/{keyswithvalue,keysintable}/*`; `packages/store/gas-report.json`, `packages/world/gas-report.json`, `packages/world-modules/gas-report.json`; `packages/store/test/{StoreCoreGas,Mixed}.t.sol`, `packages/world/test/World.t.sol`; `packages/store-sync/src/{createStoreSync,getSnapshot,fetchAndStoreLogs,getRecords}.ts`; `packages/block-logs-stream/src/fetchLogs.ts`; `CHANGELOG.md`; `LICENSE`.
- Docs (repo `docs/pages` and mud.dev): store/introduction, store/encoding, store/tables, store/data-model, store/table-libraries, store/store-hooks; world/introduction, world/namespaces-access-control, world/systems, world/tables, world/resource-ids, world/modules, world/modules/keyswithvalue, world/modules/keysintable, world/upgrades; indexer, indexer/using, indexer/sql, indexer/postgres-event-only; guides/replicating-onchain-state, guides/extending-a-world; audits/2024-02-11-open-zeppelin; retrospectives (2023-09-12, 2024-04-17).
- https://eips.ethereum.org/EIPS/eip-7813 and https://ercs.ethereum.org/ERCS/erc-7813 (Last Call, deadline 2026-06-16, created 2024-11-08); https://lattice.xyz/blog/standardizing-mud-world-interface
- https://lattice.xyz/ (Redstone shutdown 2026-05-15); https://www.kucoin.com/news/flash/lattice-announces-redstone-shutdown-on-may-15-2026-urges-users-to-withdraw-funds (2026-04-15); https://x.com/latticexyz/status/2044103611072835744 (not fetchable)
- https://github.com/latticexyz/mud (API: pushed_at 2026-04-10, PR list), npm `@latticexyz/store` publish times; https://github.com/latticexyz/dozer (README, pushed_at 2026-08-31)
- https://newsletter.lattice.xyz/p/mud-and-redstone-newsletter-24 (2024-11-22, ERC draft); https://docs.evefrontier.com/smart/mud-explainer; https://decrypt.co/249126/eve-frontier-survival-game-ethereum-ccp-reveals
- EFS baseline: `planning-fable-files-browser/Reviews/2026-09-09-files-browser-mvp/gas-engineering-2026-09-10.md` (2,838,264 gas, 94 slots, 46.8% SSTORE).