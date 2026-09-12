# Native packed-presence implementation plan

> **For agentic workers:** use `superpowers:subagent-driven-development`, one task with independent review. Disposable fresh-genesis evidence, not protocol adoption or migration.

**Goal:** price one representation-only saving before choosing a body backend: store explicit Record existence in the already-written pointer/length word instead of a separate mapping entry.

**Architecture:** retain always-code bodies and the exact public ABI/IDs. Append `bool present` to private `StoredRecord` after `address pointer; uint16 bodyLength`. Reserve the old mapping's root slot so location/history layout does not move. This is deliberately not a hybrid experiment.

**Tech Stack:** existing Solidity 0.8.30, optimizer200, via-IR, Cancun, Foundry and serial ethers/Chromium harness; no new dependency.

**Spec:** [[2026-09-11-efs21-overnight]]. Independent body review approved `58e61c4` and identified this isolated seam. Larger dense bodies benefit from code storage, but tiny/zero-heavy cases regress. Packing must be measured before calibrating any selector; no projected gas saving is claimed.

## Global constraints

- Begin from reviewed `58e61c4d027f663524349cc0bbc3ad0fee86ea82` in `codex/efs21-pragmatic`, after the current checked-Record-batch task releases the single implementation/build/new finite-world slot. Root owns main-visible plans/status and push.
- Preserve Fable60731 and the snapshot-frozen native54154 demos, all existing evidence/artifacts, validators/Type identities, helper code and index contracts. No production repository, public deployment/funds, migration, raised limits or protocol freeze.
- Ordinary 24,576-byte runtime/49,152-byte initcode/4,096-byte body/16,777,216-gas ceilings; finite serial worlds, no traces, stop heavy work below20GiB free. Clean only owned exact paths after exit.
- Keep validation-before-dedup, empty presence, byte corruption defenses, exact missing/corrupt distinction, history/CAS/navigation/discovery. No selector, payload encoding, generic-ingestion extraction or extra storage-layout optimization.
- Commit exact paths using message files, `chore:`/`docs:`, actual model, `Agent: v2-pm`, `Harness: codex`; no worker push. Root verifies and reviews before publication.

### Task 1: Pack existence and measure matched operations

**Files** relative to `Reviews/2026-09-11-efs21-pragmatic/`:

- Modify only record metadata/presence access in `contracts/src/NativeKernel.sol`.
- Create `contracts/test/PackedPresence.t.sol`; narrowly adapt the two metadata-fault injections in `BodyStorage.t.sol` to preserve the new presence bit when testing pointer/length corruption. Do not weaken their expected `CorruptRecord` checks.
- Create frozen `contracts/test/fixtures/native-kernel-58e61c4.json`, exact source/compiler metadata; add its explicit capabilities in `scripts/world.mjs`.
- Create `scripts/packed-presence-benchmark.mjs`, focused world/measurement tests, exclusive `evidence/packed-presence.json` and `.md`. Only minimal runner reuse/export is allowed; retain the existing body benchmark's default three arms and historical claims. Update README/interface after evidence.

- [ ] **Step 1: Freeze and write behavioral RED.** Freeze the reviewed always-code artifact before production edits. A new unique Record must leave the legacy presence mapping entry zero while setting the packed presence flag; duplicate admission must not create another body object or inventory row. Demonstrate the intended failure against the old layout, not only a missing-symbol compile error. Derive/check storage layout explicitly; use test-only `vm.load`/`vm.store`, never production mutation access.

- [ ] **Step 2: Minimal metadata change.** Use `StoredRecord { bytes32 typeId; address pointer; uint16 bodyLength; bool present; }`; pointer/length/presence fit in one word. Rename the old mapping declaration to a clearly reserved, unused layout slot, retaining its type/position. Reads check `present` first; false means `MissingRecord`, even if other fields are corrupt. A true flag plus missing pointer/overlong length/bad code/hash remains `CorruptRecord`. Clearing the presence bit is indistinguishable from absence, just as clearing the old flag was; do not claim corruption detection for that case. Write the complete struct once on a unique admission after existing validation/helper creation; duplicates validate then return unchanged. No helper/validator/index source change.

- [ ] **Step 3: Attack presence boundaries.** Empty record remains present with one-byte STOP runtime; unknown ID remains missing. Flip only the presence bit, zero the pointer while retaining it, set length65535 while retaining it, corrupt TypeId, and substitute same-length code. Verify all existing body tests, exact cross-Type separation and rollback. Late mandatory-index failure must restore packed word, reserved mapping, helper nonce/next child, file revision/location/inventory. Add a bounded fuzz sequence of unique/duplicate edits with current/history equality against a frozen control where practical.

- [ ] **Step 4: Two fresh matched receipt arms.** Compare frozen `58e61c4` to packed current with identical setup/action order and exact calldata. Include raw empty/31/32/33/41/256/4032/4096 standalone fresh and duplicate records; dense versus zero cases explicitly labelled. Include actual fresh create/edit41/256/4032, canonical41, QuoteProducer first publish/fresh update and independent paid reader, same-content edit, rename/unlink and late failed receipts. Existing body workload may be reused through an explicit two-arm entry without changing its default behavior; do not rerun the unrelated original-storage third arm merely to populate new evidence. Retain actual transactions/receipts/source/runtime pins, semantic readbacks and cleanup. Report setup, fresh versus dedup, paid versus estimated reads, all regressions and intrinsic deltas separately. No claim of a hybrid or full-v2 saving.

- [ ] **Step 5: Verify and hand off.** Focused RED/GREEN while iterating; then full native Forge, scoped formatter/normal sizes, serial Node/browser regressions and new paired checks. Commands: `forge test --summary --threads 1`, `forge fmt --check` on touched Solidity, `forge build --sizes`; from experiment root `node --test --test-concurrency=1 test/*.test.mjs`. Preserve previous source/evidence identities and verify only owned changes. Report exact commits, counts, costs, limitations, stopped finite nodes and cleaned caches. Root reproduces proportional verification and uses a fresh independent reviewer before push or demo replacement.

## Separate hybrid follow-on — not dispatched by this plan

The recorded crossover does not support a length-only cutoff: raw4032 dense saves1.95M with code, all-zero loses556k. Count nonzero **32-byte storage words**, including canonical ABI headers, not just nonzero bytes. Current mixed fixtures are still dense at that granularity. Measure occupancy0/1/2/3/4/quarter/half/full across boundary sizes, including dispersed nonzero bytes and final partial words, before selecting a generic policy. Price scanning only on new validated Records, body setup/read costs and tiny regressions. Both backends must have bounded corruption checks and the same exact identity hash; malformed dynamic-bytes headers must be rejected before copying. This needs its own plan and safety-matched control after Task1.
