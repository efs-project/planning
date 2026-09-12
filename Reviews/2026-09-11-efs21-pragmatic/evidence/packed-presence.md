# Packed explicit Record presence

2026-09-12 03:40 UTC · fresh-genesis native experiment, not an adopted EFS layout

Packing explicit existence into the existing pointer/length word saves **22,117–22,121 gas per fresh Record** in these matched whole-operation receipts. Raw41 fresh edit is **241,339 gas**; the producer's fresh uint256 update is **243,249 gas**. All70 dedup actions cost **12 gas more**. This isolates metadata packing: both arms still use always-code bodies, with no hybrid policy or full-v2 claim.

## Source and scope

- Frozen reviewed control: `58e61c4d027f663524349cc0bbc3ad0fee86ea82`, [exact artifact](../contracts/test/fixtures/native-kernel-58e61c4.json).
- Packed source and complete runner: `f43501a2d268220f68933fde4dd0be589c180983`; source committed clean before the retained run.
- [Machine-readable receipts](packed-presence.json): two fresh worlds, each25 setup transactions +172 actions = **394 total signed transactions**,29 read estimates,60 exact body objects. Raw/canonical/uint256 Type identities and every helper/validator/index runtime match. Each arm independently verifies canonical bytes, current/history retention and exact inventory membership.
- Every action calldata byte is identical between arms, including late failure receipts: **action intrinsic delta is zero**. Kernel deployment input changes; setup is separate below. Exact signed action/setup transaction fields and receipts, setup raw serialization, block/runtime/source/compiler pins, body objects, return bytes and cleanup are retained. All394 signatures were reconstructed and their transaction hashes checked against receipts; action raw serialization is reconstructible from retained fields rather than stored a second time.

Only private `StoredRecord` changes: `(typeId,address pointer,uint16 bodyLength,bool present)`. The bool occupies offset22 of the already-written second word; the old `mapping(bytes32=>bool)` root at slot4 remains reserved and unused, retaining locations at slot5. `forge inspect NativeKernel storage-layout --no-cache --json` confirms the layout. Public ABI/selectors, IDs, BodyWriter, validators, indexes and location/history encoding are unchanged. There is no supported populated-state migration.

## Whole-operation receipts

| Workload | Frozen always-code | Packed always-code | Saved gas |
|---|---:|---:|---:|
| Fresh raw41 file create | 613,919 | 591,801 | 22,118 |
| Fresh raw41 file edit | 263,457 | 241,339 | 22,118 |
| Fresh raw256 dense file create | 610,201 | 588,083 | 22,118 |
| Fresh raw256 dense file edit | 310,118 | 288,000 | 22,118 |
| Fresh raw4032 dense file create | 1,433,444 | 1,411,323 | 22,121 |
| Fresh raw4032 dense file edit | 1,132,496 | 1,110,375 | 22,121 |
| Fresh canonical41 file create | 605,472 | 583,355 | 22,117 |
| Fresh canonical41 file edit | 283,690 | 261,572 | 22,118 |
| QuoteProducer first publish | 620,211 | 598,093 | 22,118 |
| QuoteProducer fresh update | 265,367 | 243,249 | 22,118 |
| Independent QuoteReader paid transaction | 78,550 | 76,393 | 2,157 |
| Same-content raw41 edit | 121,669 | 121,681 | **−12** |
| Rename raw41 | 219,696 | 219,696 | 0 |
| Unlink raw41 | 115,669 | 115,669 | 0 |
| Late duplicate-name refusal | 368,984 | 346,866 | 22,118 |
| Late mandatory-discovery refusal | 259,287 | 237,169 | 22,118 |

These creates occur in ordered initialized worlds, not an interchangeable first-ever create: the raw41 create includes the first raw inventory initialization. Payloads for fresh create/edit use distinct dense0x51/0x52 bytes. Canonical41 means128 encoded body bytes. Same-content edits still append a file revision; they are not the fresh-edit headline.

## Standalone Record boundaries

These costs exclude file placement. Nonzero means dense0xef bytes; zero means all-zero bytes. The complete sweep also retains mixed byte patterns and canonical representations. At size0, nonzero/mixed labels collide with the earlier empty Record and are correctly classified as dedup, not fresh.

| Raw body size | Fresh zero before → packed | Fresh dense before → packed |
|---|---:|---:|
| 0 | 170,128 → 148,010 | Same empty Record; dedup |
| 31 | 176,512 → 154,394 | 176,884 → 154,766 |
| 32 | 176,718 → 154,600 | 177,102 → 154,984 |
| 33 | 177,085 → 154,967 | 177,481 → 155,363 |
| 41 | 178,685 → 156,567 | 179,177 → 157,059 |
| 256 | 222,782 → 200,661 | 225,854 → 203,733 |
| 4032 | 999,848 → 977,727 | 1,048,232 → 1,026,111 |
| 4096 | 1,013,013 → 990,892 | 1,062,165 → 1,040,044 |

All60 fresh admissions save22,117–22,121 gas. All70 dedup actions regress12 gas, including existing-record file creates, same-content edits, standalone duplicates and the honestly labelled empty/one-byte collisions. There are no other action regressions in the pair. Non-admission actions save0–2,314 gas, from unchanged navigation operations to paid reads. All29 estimates save0–2,314 gas and remain explicitly **unpaid estimates**; paid one/two-read consumers use freshly deployed empty effect slots, and their receipts are separate actions. No cross-transaction warmth is assumed.

## Setup, refusals and safety

Kernel deployment costs5,509,692 →5,508,840 gas, saving852; deployment intrinsic decreases52 and execution/code deposit accounts for the remaining800. All other24 setup transactions match calldata and gas exactly. Kernel runtime/initcode10909/25429 →10905/25425 bytes; BodyWriter464/502 is unchanged. Helper setup remains included in the kernel receipt, not invented as a separate receipt.

Five failures per arm retain actual failed receipts and no-state-change readback. Oversized canonical4096 costs88,296, raw4097 costs88,156, and stale CAS costs25,997 in both arms. Late duplicate-name and mandatory-discovery failure savings appear above; mandatory failure uses local `anvil_setCode` and restoration. Snapshots cover file nonce/current/revision/location, directory/inventory, helper nonce/next child and absent Record. Solidity tests additionally inspect both metadata words and the reserved mapping entry after rollback.

Presence is checked first. False means `MissingRecord`, including after the presence bit is cleared; **clearing presence is not detectable corruption**. True malformed pointer,65535 length, Type, STOP prefix, code size or same-length substituted bytes means `CorruptRecord`. Empty records retain one-byte STOP bodies. Validation still precedes dedup. Tests cover helper/code failure, cross-Type separation and128 bounded unique/duplicate edit sequences against frozen58 with exact current/history comparison.

## Reproduction and retained boundaries

From `contracts/`: `forge test --summary --threads 1` (**99 passed**), `forge fmt --check src/NativeKernel.sol test/BodyStorage.t.sol test/PackedPresence.t.sol`, `forge build --sizes`. From the experiment root: `node --test --test-concurrency=1 test/*.test.mjs` (**27 passed**, including live browser regressions and the fresh complete two-arm workload). Four intended physical-presence tests first failed behaviorally against untouched58, then passed after the minimal change. The packed suite reuses10 inherited body tests, so99 includes those repetitions plus5 new tests.

`node scripts/packed-presence-benchmark.mjs` creates the exclusive JSON and refuses to overwrite it. The ordinary test entry compares fresh worlds without writing retained evidence. The original `compareBodyStorage()` still defaults to three arms and its historical artifacts/evidence are unchanged. Its measurement test now validates the retained three-arm receipts; the existing live historical body-world test remains. This avoids rerunning an unrelated original-storage workload simply to fill this new evidence file.

Both retained nodes exited0 (PIDs41605/41707), and their exact temporary caches were removed by the managed harness. Native54154/RPC54148 at frozenc088363 and Fable60731/RPC60726 were not restarted or migrated. Disk remained283GiB free. Ordinary24576 runtime/49152 initcode/4096 body/16777216 transaction-and-block gas ceilings remain; no traces, public deployment/funds, production-repo changes or raised limits. The prior always-code-versus-storage tiny/zero-heavy tradeoff is not solved or newly measured by packing. Hybrid selection and full-v2 integration remain separate work.
