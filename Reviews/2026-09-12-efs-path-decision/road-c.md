# Road C — MUD reuse under a thin EFS layer (independent proposal)

> **Coordinator publication note, September 13:** retain this independent first proposal as evidence, but read [[road-c-review]] before relying on its conclusions. The review corrects its omitted-write inheritance claim, categorical World rejection, maintenance/audit wording and proposed kill criteria. Those claims are not adopted or independently demonstrated by publishing this note.

**Date:** 2026-09-12 · **Lane:** road-c-mud-specialist (Claude, Fable 5.1) · **Status:** independent architecture note, pre-shortlist, no code run
**Evidence pin:** `git clone --depth 1` of github.com/latticexyz/mud, main `0e49b51` (2025-09-30); `packages/store`, `packages/world`, `packages/world-modules`, `packages/store-sync` all at **2.2.23**. Paths below are clone-relative. I did **not** read `mud-source-preflight.md`, `road-b.md`, `claude-pm.md`, or any `2026-09-11/12-efs21-*` folder. I measured nothing; every gas figure is QUOTED (MUD's committed `gas-report.json`) or ESTIMATED from source.

**Verified context.** Lattice announced its wind-down on 2026-04-14 (X post id 2044103611072835744, snowflake-decoded; "Redstone shuts down May 15, 2026"); MUD is described there as feature-complete, audited, open source. Last release is 2.2.23 (GitHub release "26 Aug", commit `062bd8d`; year 2025 inferred from HEAD date and the viem 2.35.1 dependency); main carries unreleased commits after it. ERC-7813 "Store, Table-Based Introspectable Storage" is **Last Call** with last-call-deadline 2026-06-16 — fetched 2026-09-12 it still reads Last Call, i.e. the deadline lapsed without promotion to Final. Only audit listed: OpenZeppelin 2024-02-11 at `12a9eb1` (`docs/pages/audits/2024-02-11-open-zeppelin.mdx:9`), pre-2.0; no later audit is listed.

## Recommendation

**Store-only, not World+Store.** The EFS Core kernel contract inherits MUD `Store` (`packages/store/src/Store.sol:18` → `StoreKernel.sol:17-25` → `StoreRead.sol`) and owns a *fixed, small* set of generic EFS tables declared in `mud.config.ts` (Types, Records, Occurrences, Admissions, Bindings, Postings, Locators); EFS Types are **rows**, not MUD tables. MUD supplies the record codec and slot layout (`StoreCore.sol`), ERC-7813 events, the external bounded read API (`IStoreRead`), codegen'd Solidity/TS table libraries, and the client replication stack (`store-sync`, `stash`, `store-indexer`, `explorer`). EFS owns every semantic obligation: ingress and author evidence, Type acceptance, mandatory indexes, history, Lenses, honest absence, and the only write entrypoints — MUD's `IStoreWrite` is never exposed, so hooks are not the acceptance gate. World is rejected: its value is multi-tenant composition (namespaces, systems, delegation, selector routing) under an owner-superuser model that conflicts with a permissionless Core and with "no path bypasses acceptance" (external `world.setRecord`, owner-removable hooks), costs QUOTED ~40k gas per routed call and ~12.7M to deploy, and sits near EIP-170 by design. Honest framing: Store-only reuse is a **storage substrate plus tooling**, not a foundation that replaces the kernel. Reuse can still win — on maintenance surface and client DX — but only if the experiment below shows the reused share is decision-relevant after EFS adds its mandatory layers.

## Architecture and API

```
      wallet / SDK (signed Envelope)                 producer contract, e.g. a DEX (native)
                 │ publish()                                        │ publish()
                 ▼                                                  ▼
┌────────────────────────── EFS Core kernel  `is Store` ───────────────────────────────┐
│ EFS custom │ ingress + author evidence │ Type acceptance (bounded) │ mandatory indexes │
│            │ history / withdraw / CAS  │ Lens resolve (plans)      │ coverage + status │
│────────────────────────────────────────────────────────────────────────────────────────│
│ MUD Store 2.2.23 (vendored) │ StoreCore encode/slots · Store_* events · IStoreRead     │
│ tables via mud.config.ts    │ Types Records Occurrences Admissions Bindings Postings   │
└──────┬──────────────────────────────┬───────────────────────────────┬──────────────────┘
       │ IStoreRead.getRecord/getField│ eth_getLogs Store_*           │ eth_call state walk
       ▼                              ▼                               ▼
 consumer contract (paid read)  store-sync / stash replica (fast,   EFS state-walk reader
                                log-dependent, optional)            (required, custom TS)
```

```solidity
// producer contract publishes /swaps/eth-usdc; author = this contract (native ingress, no signature)
(bytes32 recordId, bytes32 occId) = efs.publish(Publish({
    typeId: QUOTE_TYPE, body: abi.encode(price, block.timestamp),
    author: Principal.account(address(this)), evidence: "",
    bind: Bind({ container: SWAPS_FOLDER, name: "eth-usdc", expectPrev: lastRecordId }) }));
// unrelated consumer: Lens-selected point read, then a bounded MUD field read
(bytes32 head, Status st) = efs.resolve(PLAN_ID, SWAPS_FOLDER, "eth-usdc"); // FOUND/ABSENT/UNKNOWN
require(st == Status.FOUND);
bytes memory body = IStoreRead(efs).getDynamicField(Records._tableId, key(head), BODY_IX);
(uint256 price, ) = abi.decode(body, (uint256, uint256));
```

```ts
// TypeScript point read straight from state (no indexer): IStoreRead.getRecord + protocol-parser decode
const raw = await client.readContract({ address: efs, abi: IStoreReadAbi, functionName: "getRecord",
  args: [Records.tableId, [recordId]] });
const rec = decodeRecord(Records, raw);           // @latticexyz/protocol-parser
// or replicate all EFS tables into a browser store from Store_* logs: syncToStash({ config, address: efs, publicClient })
```

## Outcome map

| EFS outcome | Reused MUD code | EFS custom | Cost centers / trust | Paid read · browser |
|---|---|---|---|---|
| Portable data identity, stable File identity, separable authorship claims | Key-tuple → slot: `StoreCore.sol:1146-1147,1187-1193,1201-1206`; `ResourceId.sol:10,29-31` (2-byte type + 30-byte name) | RecordId = content hash used **as** the key tuple (MUD keys are opaque `bytes32[]`, content addressing is a caller convention); Occurrence rows keyed (envelope, leaf); Admission rows; retained signature/witness bytes. `callWithSignature` validates but stores nothing (`CallWithSignatureSystem.sol:24-32`, `SignatureChecker.sol:22-27`), so evidence retention is custom | `setRecord` overwrites in place (`StoreCore.sol:338-372`); no history in state — every immutable fact is its own row. Trust: none added by Store | Read: `StoreRead.sol:52-68` external `getRecord`; QUOTED internal get static 1-slot 3,539 · 4-slot dynamic 12,196 |
| Useful Types, checked references, mandatory acceptance (direct/import/dedup cannot bypass) | Table schema registry `Tables.sol:25-29`, `registerTable` validation `StoreCore.sol:155-224`; hook plumbing `StoreCore.sol:319-332,376-388`, `storeHookTypes.sol:12-33` | Type = row (MUD schema caps: 28 fields, 5 dynamic, no structs/`string[]`, static-only keys — `constants.sol:20-26`, `docs/pages/store/tables.mdx:76-95`, `data-model.mdx:146`); acceptance runs inside EFS entrypoints before `Table.set`. Store-only exposes no external write, so bypass is impossible by construction | World mode instead: `world.setRecord` is open to any address with namespace access (`World.sol:137-149`) and hooks are owner-registered **and owner-removable** (`StoreRegistrationSystem.sol:75-101`); hooks skip offchain tables (`StoreCore.sol:311-316`). QUOTED enabled hook call 37,625; register table 650,835 (Store) / 572,591 (World) — a reason not to make each Type a table | Type bodies state-readable via `getRecord`; browser needs no MUD-specific Type handling |
| Contract-usable Files/paths/selected values | `IStoreRead` bounded reads incl. `getDynamicFieldSlice` `StoreRead.sol:201`; `StoreSwitch.sol:50-64,172-180` lets an external contract use codegen libs against the EFS address | Binding rows (container,name→head, CAS `expectPrev`), Lens resolve, native-producer ingress | QUOTED `world.call` routed private system 39,980 (`World.t.sol:932-937`), +~5k via WorldProxy — avoided in Store-only. Missing record reads as zeros, not absent (QUOTED "access non-existing record" 7,047): an explicit exists/ordinal field is mandatory | Consumer pays a cold CALL + Tables layout SLOAD unless it passes the `FieldLayout` overload (`StoreRead.sol:68`) |
| Independent authors, Lenses, history, rename/move/remove without erasing evidence | Nothing beyond storage; `deleteRecord` zeroes static + length word and leaves dynamic bytes (`StoreCore.sol:599-637`) | Append-only Occurrence/Admission rows, withdrawals as rows, Bindings as current-slot with prior-head evidence; Lens plans; never call `deleteRecord` | Every history fact is a full MUD record write: QUOTED 1-slot static 32,095 (bare SSTORE is 22,107), i.e. ≈10k/record of hook-lookup + event + encoding; ESTIMATED event ≈1.1k + 8 gas/byte of ABI payload; one extra fresh slot per record with dynamic fields for `EncodedLengths` (`StoreCore.sol:350-351`) — under EIP-8037/8038 repricing that slot is the dominant per-record premium | Lens/history reads are custom paths over EFS tables |
| Required discovery + configurable extra indexes reporting coverage | Hook-maintained index pattern only: `KeysInTableHook.sol:15-41,77-136`, `KeysWithValueHook.sol:34-57` (root-install only, `KeysInTableModule.sol:26`) | All required indexes (folder listing, by-Type, by-Principal, backlinks, tag queries) as Postings tables written in the same entrypoint; coverage/high-water fields; `COMPLETE/PARTIAL/UNKNOWN` | QUOTED KeysInTable install 1,462,000; first-key set 193,018 vs plain 64,661; `HasQuery` 1000 keys 9,312,775 (unbounded scan, do not reuse `query.sol`). Store has **no key enumeration**: keys are hashed into slots | Browser folder listing must come from EFS Postings via state, or from logs |
| Independent access; missing bytes ≠ empty folder | `store-sync` replication: `createStoreSync.ts:121-155,325`, `fetchLogs.ts:104` (≤1000-block `eth_getLogs` ranges), indexer snapshot `getSnapshot.ts:42-57`; ERC-7813 events `IStoreEvents.sol:26-71` | State-walk reader over EFS index tables (store-sync has no state mode: `getRecords.ts:46-55` is logs/indexer only); status semantics; locator verification | Log-only reconstruction depends on full historical logs (EIP-4444 exposure named in owner rulings); MUD's model is complementary, not sufficient | Bodies are state-readable; the key set is not without EFS indexes |
| Understandable APIs, one action per file op, idempotent retries, testnet continuity | Codegen typed libs (`Records.get/set`), `protocol-parser`, `stash`/zustand/recs, `explorer`; `BatchCallSystem.sol:22-36` (World only) | One `publish()` doing record+occurrence+admission+bind+index atomically; idempotent re-publish (same key, same bytes → warm no-op SSTORE but a duplicate event); EFS proxy for testnet | World deploy QUOTED 12,742,614 (`WorldFactory`), proxy 9,127,201; `WorldProxy.setImplementation` is root-owner-gated (`WorldProxy.sol:50-54`); root systems `delegatecall` into World storage (`SystemCall.sol:62-68`, `World.sol:57-60`); namespace owner may install a delegation control that acts for any delegator in that namespace (`WorldRegistrationSystem.sol:288-325`, `World.sol:362-402`) — all avoided in Store-only | Explorer/indexer show generic EFS tables, not per-Type views; per-Type SDK helpers stay custom |

## Weaknesses and the strongest objection

- **Frozen dependency.** No maintainer; the Solidity we would vendor is ~5.2k lines core + 2.7k tightcoder + 1.9k codegen tables (`packages/store/src`), plus TS tooling pinned to a 2025 viem line that will bit-rot. Treat the vendored `store/src` as Etched; treat `store-sync`/`explorer` as ephemeral conveniences.
- **ERC-7813 is not Final** and its authors' company is gone; the event shape is stable in practice but has no standards backing beyond Last Call.
- **Schema ceiling.** 28 fields / 5 dynamic / no nested structs / static-only keys means EFS Type Schemas cannot be MUD tables in general; MUD's introspection then covers EFS's generic tables only.
- **Per-record tax.** ≈10k gas of hook lookup + event + encoding over a bare SSTORE per row (QUOTED 32,095 vs 22,107), an extra length slot per dynamic row, and duplicate log bytes for data already in state. Small today; the extra slot is the item that grows under Glamsterdam repricing.
- **Code size.** World is near EIP-170 by construction (registration split into `InitModule`, `World.sol:37`; tooling warns at 95% of the limit, `findContractArtifacts.ts:56-66`). Store-only inlines `StoreCore` internals plus 12 `StoreRead` externals into a kernel that EFS already reports near the ceiling: UNKNOWN until built.
- **Key-tuple ≠ content addressing.** MUD gives a mutable key→value map; content identity, dedup semantics and history are conventions EFS must enforce above it.

**Strongest objection:** every outcome in the table has its load-bearing part in the "EFS custom" column. What Store replaces is the storage codec, the read ABI, an event standard and client replication — perhaps a fifth of the kernel and none of its risk. Adopting a frozen 10k-line dependency, its schema ceiling and its per-row tax to avoid writing a codec we could write in a week is only worth it if the tooling and the shared ABI buy real DX. That is not established.

## One decisive bounded experiment

Build the matched joined slice once, Store-only, on the shared fixture (32-byte quote, 41-byte binary, two authors, one checked reference, folder listing + one tag query): authored typed publish → mandatory acceptance (reject wrong Type / missing ref) → required index update → Lens-selected read by an unrelated consumer contract → clean-reader reconstruction on a fresh Anvil with `indexerUrl: false` and, separately, with `eth_getLogs` disabled (state-walk only). Receipts: per-operation gas for create / edit / native update / consumer read; kernel deployed bytecode size; EFS-owned Solidity lines vs vendored lines actually linked; RPC calls and bytes for both reconstruction modes; the `interaction` term from the overhead protocol for authorship × selection. **Kill result:** state-walk reconstruction is impossible without an EFS-side key index (making MUD's events redundant for the required path) **and** the vendored share of linked kernel code is under ~25% **or** the kernel exceeds EIP-170 with Store inlined. Either half alone is a cost line, not a kill.

## Claim classification

- Demonstrated (source-verified in the clone): Store write/read/delete semantics, slot derivation, hook plumbing and owner-removability, external `world.setRecord`, delegation and proxy authority paths, store-sync being log/indexer-driven with no state mode, schema limits, absence-reads-as-zero. Verified externally: Lattice wind-down date, 2.2.23 as last release, ERC-7813 Last Call status with lapsed deadline.
- Designed but untested: the Store-only adapter boundary, generic-table layout, `publish()` atomic shape, state-walk reader.
- Unsupported (my judgement, no measurement): "≈ a fifth of the kernel", DX value of MUD tooling for EFS's generic tables.
- Unknown: kernel bytecode size with Store inlined; exact per-record premium on the EFS fixture; behaviour under EIP-8037/8038; whether any 2.0→2.2.23 change was re-audited.
- Gas labels: all figures above are QUOTED from `packages/*/gas-report.json` (forge bracketed, no 21k base) except those marked ESTIMATED; nothing is MEASURED.

## What Road C needs from the coordinator

1. Confirmation that Store-only is the one MUD adapter on the shortlist (I will not build a World variant).
2. The frozen semantic fixture and expected-outcome file so the state-walk vs log reconstruction runs are comparable with Road B.
3. Permission for a vendored copy of `packages/store/src` (2.2.23) in an isolated worktree, plus the heavy-run slot for one Anvil build.
4. A ruling on whether a frozen, unmaintained dependency is acceptable in principle for Etched code; if not, Road C reduces to "borrow the event ABI".
5. Kernel bytecode-size headroom of the current EFS candidate, so the EIP-170 kill condition is checkable before building.
