# Native immutable-body storage implementation plan

> **For agentic workers:** use `superpowers:subagent-driven-development` task-by-task, with an independent review before publication. This is a disposable experiment, not protocol adoption.

**Goal:** measure whether code-backed immutable bytes reduce actual native Files costs without changing exact Type/Record identity, contents, retained revisions, validation or index behavior.

**Architecture:** `NativeKernel` keeps record metadata and presence. A pinned kernel-only `BodyWriter` creates STOP-prefixed data contracts in its own context. The kernel reconstructs the existing `Record(typeId, body)` response and verifies its identity. Navigation and configured discovery remain separately stored contracts with their current failure policy.

**Tech Stack:** Solidity 0.8.30, optimizer 200, via-IR, Cancun; existing Foundry, ethers and serial Chromium/Node harness. No new dependency required.

**Spec:** [[2026-09-11-efs21-overnight]], especially the native immutable-body followup and profile limits. Expert preflight inspected the current storage/read and runner seams. Code-as-data is prior art, not an EFS invention: [Solady SSTORE2](https://github.com/Vectorized/solady/blob/main/src/utils/SSTORE2.sol). This experiment uses a small explicitly tested constructor, not an unpinned imported dependency.

## Global constraints

- Code work remains in the authorized `codex/efs21-pragmatic` workspace, control `c088363b176b17e99d76788890bf01cd764e61a7`. Main-visible plans/results return here; no production repository, public deployment, funds, migration or frozen ABI.
- Preserve Fable's workspace/world and the snapshot-frozen native browser on port 54154. No persistent replacement server during implementation. Only one implementation/build/new finite Anvil owner at a time; direct-apply minor closure must finish first.
- Ordinary runtime 24,576 bytes, initcode 49,152 bytes, body 4096 bytes and transaction/block 16,777,216 gas limits. No full traces, raised limits or external-body substitution. Stop heavy work below 20 GiB free; bounded managed worlds, sequential tests and exact owned-cache teardown.
- Keep `ExactTypeRegistry.sol`, `ExpandedTypeRegistry.sol`, `RawBytesValidator.sol` and their validator runtime/Type IDs unchanged. Preserve old artifact/evidence JSONs. No hybrid backend, generic-ingestion extraction, cross-Type body sharing or encoding change in this task.
- Preserve validation before dedup, explicit empty presence, exact ID formulas, public existing ABI, owner/CAS behavior, names/path rules, historical revisions and navigation/discovery semantics. Added integrity checks must be priced, not hidden as free storage-only savings.
- Commit exact owned paths with `chore:` or `docs:`, `Agent: v2-pm`, actual model and `Harness: codex`; message file plus `git commit -F`. Implementer does not push. Root verifies, reviews and publishes.

### Task 1: Implement and price always-code bodies

**Files** (relative to `Reviews/2026-09-11-efs21-pragmatic/` in the code worktree):

- Modify `contracts/src/NativeKernel.sol`: only record storage/load, helper initialization and helper pin checks.
- Create `contracts/src/BodyWriter.sol`: fixed data-contract creation, no arbitrary initcode/pointer interface.
- Create `contracts/test/BodyStorage.t.sol`: focused behavior, corruption, nonce and rollback tests. Add only needed cheatcode signatures in `contracts/test/TestBase.sol`.
- Create frozen fixtures `contracts/test/fixtures/native-kernel-c088363.json` and `native-kernel-c088363-read-integrity.json`, including exact compiler/settings/source provenance.
- Modify `scripts/world.mjs`: explicit artifact capability profiles and helper/runtime pins; preserve all historical selector behavior and current browser setup.
- Create `scripts/body-storage-benchmark.mjs`, `test/body-storage-world.test.mjs`, `test/body-storage-measurement.test.mjs`, and a small `contracts/src/BodyReadConsumer.sol` for paid single/repeated reads if existing consumers cannot distinguish those cases.
- Create `evidence/body-storage.json` exclusively and `evidence/body-storage.md`; update `README.md`/`contracts-interface.md` with the experimental boundary only after measurements. No edits to existing measurement runners or historical JSONs.

**Interfaces:**

```solidity
// BodyWriter: constructor records msg.sender as immutable kernel.
function write(bytes calldata body) external returns (address pointer);

// Existing kernel public interface stays exact:
struct Record { bytes32 typeId; bytes body; }
function readRecord(bytes32 id) external view returns (Record memory);
function storeRecord(bytes32 typeId, bytes calldata body) external returns (bytes32);

// Private replacement, not a new wire shape:
struct StoredRecord { bytes32 typeId; address pointer; uint16 bodyLength; }
```

- [ ] **Step 1: Freeze the control and establish the integrity-control arm before production edits.** Capture the current kernel creation artifact with its exact source/compiler metadata. In an owned temporary source export, add only a `CorruptRecord` error and the following read defense, compile under identical paths/settings, and retain the complete source delta and artifact. Do not add a second maintained Kernel source to `contracts/src`.

```solidity
Record memory result = records[id];
if (recordId(result.typeId, result.body) != id) revert CorruptRecord();
return result;
```

The three arms are frozen baseline, storage with read integrity, and code-backed candidate. The **primary backend comparison** is integrity-control versus candidate. Baseline versus integrity-control exposes defense cost; baseline versus candidate is the total deployable change. Verify actual Type IDs and validator code hashes, not just compiler configuration. Both hash-integrity comparison arms must execute the same RecordId hash expression when returning a body. Later source-review clarification: the actual slot control hashes after copying dynamic bytes; it is not a prebounded corrupted-length control. Do not interpret the original “safety-matched” wording as equality of every physical-corruption guarantee.

- [ ] **Step 2: Add focused red tests before implementation.** Existing raw behavior tests remain unchanged. Use a test-local cheatcode interface if necessary to inspect CREATE nonce/address and record storage layout; never add production mutation hooks. One initial resource falsifier must require a unique record to create exactly one helper-owned body object, and a duplicate to create none. Keep a separate wrong-same-length-code falsifier that expects `CorruptRecord`, not a successful empty or zero-padded response.

```solidity
uint64 beforeNonce = vm.getNonce(writer);
bytes32 id = kernel.storeRecord(rawType, hex"ef0080ff");
eq(vm.getNonce(writer), beforeNonce + 1);
eq(kernel.readRecord(id).body, hex"ef0080ff");
kernel.storeRecord(rawType, hex"ef0080ff");
eq(vm.getNonce(writer), beforeNonce + 1);
// Derive and verify the actual created object, then fault-inject its code.
vm.etch(pointer, hex"00ef0080fe");
vm.expectRevert(NativeKernel.CorruptRecord.selector);
kernel.readRecord(id);
```

Confirm the intended RED (a temporary missing-symbol compile failure is not the sole behavioral falsifier). First run unchanged native regressions/control artifact checks; then run the focused test after minimal helper wiring to demonstrate the missing defensive behavior before completing it.

- [ ] **Step 3: Implement one always-code backend.** Deploy the helper after existing constructor deployments to preserve navigation/registry/discovery creation order. Store its address and actual runtime code hash as private immutables; verify its pin before a new-body write. The helper rejects non-kernel callers and bodies over 4096. Its only creation path returns exactly STOP followed by body bytes, with zero value:

```solidity
bytes memory init = abi.encodePacked(
    hex"61", bytes2(uint16(body.length + 1)),
    hex"80600a3d393df300", body
);
// Fixed constructor length is 10 bytes before runtime: STOP || body.
assembly ("memory-safe") {
    pointer := create(0, add(init, 32), mload(init))
}
if (pointer == address(0)) revert DeploymentFailed();
```

The length bound must precede narrowing. Tests must show payload opcodes, including leading `0xef` and `SELFDESTRUCT` bytes, never execute. Do not accept caller-supplied pointers/helpers/initcode. Keep kernel CREATE nonce unchanged during record writes. `_store` remains size check → existing Type validation → unchanged RecordId → dedup; for a new ID call the helper, persist complete metadata/presence, and perform the unchanged inventory/event update. Empty raw bodies have an explicit present record and one-byte STOP runtime.

`readRecord` first checks presence, then bounded stored length, nonzero pointer, exact `bodyLength + 1` code size and STOP prefix. Allocate/copy only the bounded body, recompute its RecordId, and return the unchanged ABI. Use `CorruptRecord` for a present but invalid storage representation, distinct from `MissingRecord`. No public helper getter is required: tests/runners derive constructor CREATE addresses and verify actual code at them. They must not treat address prediction alone as provenance.

- [ ] **Step 4: Complete the adversarial test cycle.** Run focused tests, then the full existing Forge suite and ordinary size build. Cover empty versus absent; raw/canonical/same-byte-different-Type IDs; fresh/dedup inventory and event counts; changed/missing validator refusal even on duplicates; binary/zero/trailing-zero bodies; helper unauthorized calls, missing/changed helper code, failed creation and low gas; empty/truncated/extended/wrong-prefix/same-length-substituted body code.

For duplicate-name, stale CAS and late mandatory-discovery failure, snapshot the helper nonce, next child address, kernel nonce, record presence, required inventory, file nonce/current revision/history/location. Failed actions must leave all unchanged and no body code at the next address. Required/tolerated scalar-discovery behavior remains covered by unchanged regressions; do not attach raw bytes to the uint256-only profile. Historical bytes remain readable after editing, moving and unlinking.

- [ ] **Step 5: Extend artifact selection without reinterpreting old worlds.** Replace `non-current == old registry/no discovery` assumptions in `world.mjs` with explicit capabilities for each known artifact. The new frozen and integrity controls support expanded/raw/discovery; older aa6b1b6/bf566dc fixtures retain their actual capabilities. Verify a selected artifact against its own exact source pins/delta, and live artifacts against current sources. Pin the actual helper and child runtimes in candidate evidence. Keep source/support/compiler/dependency pins and original historical fixture checks.

- [ ] **Step 6: Run sequential fresh actual-receipt comparisons.** One common new runner performs identical signer/deployment/action order and exact body inputs in all three arms. Save raw signed transactions or equivalent complete transaction/calldata evidence, receipts, independent exact-ID checks and canonical receipt-block readbacks. Report setup separately. Record teardown after managed return; write the new JSON with exclusive creation, never replace old evidence.

Required workloads:

| Family | Cases |
|---|---|
| Standalone admission | Raw/canonical payload 0/1/31/32/33/41/256/4032; zero/nonzero and representative mixed bytes; first and duplicate. |
| Complete Files | Fresh create and fresh-content edit at 41/256/4032 in both representations, and raw4096; existing-record create and same-content edit separately. |
| Contract interoperability | Actual QuoteProducer first publish/fresh 32-byte update; independent QuoteReader and PayloadConsumer paid transactions with effect readback. |
| Reads | Current and historical `readRecord`, directory hydration, single versus repeated same-record reads within one consumer transaction; estimates/return bytes separate from paid receipts. |
| Retention | Rename/unlink receipts and current/historical bytes/revision metadata before and after. |
| Boundaries/failure | Raw4096 zero/nonzero success/dedup; canonical4096/raw4097 refusal; actual duplicate-name/stale-CAS/required-index failure receipts. |

Track exact RecordId membership to label dedup honestly: empty/zero fixtures can collide across earlier operations. Use fresh matched sub-worlds where a genuinely fresh zero-content file is needed. Never call a dedup hit a unique admission. Every comparison row identifies TypeId, payload/body sizes/composition, fresh/dedup status, three receipt costs, primary delta and transaction/block identities. Report intrinsic-calldata differences, setup/helper overhead and failed receipts. Keep all regressions, including tiny and zero-heavy bodies; do not introduce a hybrid to hide them.

- [ ] **Step 7: Verify and prepare a reviewable handoff.** Run `forge test --summary`, `forge fmt --check` on touched sources, `forge build --sizes`, then `node --test --test-concurrency=1 test/*.test.mjs` from the native experiment root. Retain browser binary/history/download, navigation and ambiguous-submission tests. Check previous evidence and validator sources unchanged, exact runtime identities, ordinary limits, stopped finite nodes and cleaned owned paths. Commit exact owned files and report source commit, red/green evidence, full counts, measured savings/regressions and scope limits. Root runs proportional verification and requests independent source/evidence review before push or a new persistent demo.

## Follow-on, outside this task

If tiny bodies regress, choose a measured simple hybrid only in a later arm. If large bodies improve, evaluate transferring the backend to full-C0 Record/envelope placement with its actual legal-size and checked-reader requirements. Generic record-ingestion extraction, full Types/portable authored admission, full Lens support and PostingStore separation remain separately measured work. No native cost result is full-v2 parity.
