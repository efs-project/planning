# Native generic-kernel boundary preflight

2026-09-11 overnight · source review at `b8896a7` / production source `f43501a`; no implementation or measured extraction cost.

James's requested boundary is stronger than putting indexes in another account. The current native prototype has separate Navigation/Discovery storage, but its `NativeKernel` still combines Record ingestion with Files ownership/history. Keep calling it a **Files-profile experiment**, not a pure generic EFS Core.

An independent expert inspected the actual native kernel/index/registry/SDK/world seams. The smallest proposed extraction is:

| Contract | Responsibility |
|---|---|
| New `NativeRecordKernel` | Author-neutral exact typed Record admission, bodies and immutable Record reads; no paths, Files ownership or Files callbacks. Owns/pins its registry and BodyWriter. |
| New `RecordInventoryIndex` | Mandatory unique RecordIds by exact TypeId. Only its immutable Record kernel appends. |
| Existing `NativeKernel`, now Files facade | Native caller namespace authority, Files nonce/current/history/locations/CAS and paths; forwards existing Record APIs to its pinned Record kernel. |
| `NavigationIndex` | Directory membership, per-owner Files inventories, locations/generations. Only the Files facade mutates it. |
| `DiscoveryIndex` | Existing configurable search profiles, failure/coverage policy and Files-source callback; unchanged semantics. |

This is a proposed **same-native-profile** extraction, not full-v2 validation, identity, Lenses, portability or upgradeability. Do not combine it with the hybrid body-policy change: freeze that reviewed backend first if this experiment follows it.

## Keep the application interface and authority simple

Retain existing Files facade signatures/structs and Record forwarding methods. Add explicit `recordKernel()` and `recordInventory()` getters rather than requiring the SDK to guess constructor nonces. A compatibility shim can preserve `navigation().typeInventory(...)` as a read-only forwarder with the existing cursor tuple/high-water rules; do not duplicate the inventory's stored postings.

Files methods execute directly in the facade, not via an external self-call. `_ownedLive` and `_fileId` keep the original `msg.sender` and facade address. A producer contract owns its namespace, not the EOA invoking it, the facade or the Record kernel. No `tx.origin`, trusted owner argument or new forwarding authority is needed.

Direct generic Record admission creates no Files state. Validation still precedes dedup; exact domains, Type/Record IDs, byte bounds, explicit empty existence and bounded integrity remain. The three fixed stateless validators remain a known limitation. Do not expand their allowlist and call that arbitrary programmable acceptance.

`RecordStored` naturally moves to the Record kernel's emitting address. Preserve its event signature but document the provenance change; do not duplicate the event just to fake identical logs. Current browser readback is state-based.

## Wiring and atomicity

The Files facade constructor deploys `NativeRecordKernel`; that constructor deploys its registry, Record inventory and BodyWriter. The facade then deploys Navigation and Discovery. Thus each child's constructor sees its intended immutable writer/source without a mutable binding ceremony. Historical address/nonce assumptions do not survive automatically.

Pin actual dependency relationships and runtime identities at the same observation basis:

- Facade → Record kernel, Navigation and Discovery.
- Record kernel → registry, mandatory Record inventory and BodyWriter.
- Inventory writer = Record kernel; Navigation writer and Discovery source = facade.
- Discovery's Navigation/registry bindings and the registry's selected validator runtime hashes.

Use ordinary calls and separate storage. A mandatory inventory append requires the pinned implementation and exact success response; failure reverts admission. Required Navigation failure also reverts. Existing tolerated Discovery failure may retain a file write only with its search profile DIRTY; it cannot poison mandatory Record inventory or imply complete search results.

Preserve the existing Discovery processing guard/callback order, including its read of provisional updated Files state and forwarded Record bytes. The new Record kernel/inventory/writer should have no arbitrary external mutation callback; current validators remain bounded STATICCALL. Test a reached late failure rolling back both contracts' metadata/inventories, body code/helper nonce, Files nonce/history and Navigation. Core-only mutation is not a blanket reentrancy proof.

## Deployment, qualification and cost caveats

The FileId formula keeps chain ID, facade address, caller and nonce. Preserving EOA deployment transaction order can preserve facade/producer addresses and matching FileIds despite changed internal children: assert exact equality where preserved and disclose only actual differences. BodyWriter's parent/address derivation changes. Matching addresses in disposable worlds does not establish portable ownership/history. Exact Type/Record content IDs can remain identical.

The current world runner derives BodyWriter from facade CREATE nonce4 and patches its owner immutable to the facade. After extraction that is wrong. Use explicit getters and independently verified constructor/runtime pins; keep historical rules scoped to their exact frozen artifacts.

The present native client checks facade runtime at its observation basis; that is **not a transitive code-identity check** for all callees. The new profile needs explicit dependency-graph qualification at the same basis. Do not advertise a verified facade hash as proof of arbitrary underlying code or chain inclusion. Update source/artifact/configuration pins and preserve historical evidence.

Expected extra cost is unmeasured: Files→Record calls on admission/read, ABI byte copying/returndata, cold account access, forwarded Discovery reads and more deployment code. Direct generic callers can bypass the Files facade. Inventory append already calls an external index today, so changing its owner is not automatically another call. Physical separation buys a clearer dependency boundary, not free gas savings.

## Smallest later evidence gate

After reader/hybrid tasks settle, create a bounded extraction-only plan and freeze the exact control. Exercise direct Record admission → exact by-Type inventory/read → producer Files create/edit referencing those bytes → unchanged browser reload/history/rename/unlink → unrelated contract read.

Check caller ownership, one Record inventory entry under dedup, no Files state from direct admission, stale CAS, mandatory index refusal, reached late required-Discovery rollback and tolerated Discovery failure retaining correct mandatory inventory with unqualified search. Compare full action/setup/read receipts, exact public results and actual identity changes.

Source pointers: native `contracts/src/NativeKernel.sol`, `NavigationIndex.sol`, `DiscoveryIndex.sol`, `scripts/world.mjs`, `sdk/client.mjs` at `b8896a7`. This preflight ran no build, test or fresh world and claims no gas saving.
