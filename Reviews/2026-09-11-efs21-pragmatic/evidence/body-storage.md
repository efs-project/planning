# Native immutable-body storage: three-arm receipt experiment

**Standing:** measured fresh-genesis native-profile experiment, not adopted EFS v2 architecture, full-C0 parity, migration, or production readiness. The always-code backend is not uniformly cheaper: tiny, zero-heavy, and scalar bodies regress. No hybrid was added to hide that result.

Source: `5632fee6e72a542ee7a76a0c874fb34276bf89ff`. [Complete receipt evidence](body-storage.json), exclusively created after that source commit, has Keccak-256 `0xbf6ddc6170f81ed2b41a4ed93010bcf19da3b028e20bfc47ce99ce7a400c08cc` (10,113,922 bytes). Historical JSONs were not overwritten. The selected control sources remain `c088363b176b17e99d76788890bf01cd764e61a7`; their runner/support source is the newer experiment commit, separately identified in provenance.

## What is compared

1. Frozen original storage control: [creation artifact and compiler/source metadata](../contracts/test/fixtures/native-kernel-c088363.json).
2. Storage with read integrity: [frozen artifact plus complete exact source delta](../contracts/test/fixtures/native-kernel-c088363-read-integrity.json). Only `CorruptRecord` and the `recordId(result.typeId, result.body) != id` read check are added in a temporary export; no second maintained kernel source exists.
3. Candidate: one pinned helper creates `STOP || body` with zero value for each distinct validated RecordId. The kernel stores TypeId, pointer, bounded length, and explicit presence. Readback checks bounded length, nonzero pointer, exact code size, STOP prefix, and the **same RecordId hash expression** as arm 2. These checks are included in measured costs.

The **primary comparison is arm 2 versus arm 3**. Arm 1 versus arm 2 exposes defense cost; arm 1 versus arm 3 is the total deployable change. The JSON retains all three deltas. Arms2/3 match the returned RecordId hash check, **not every corruption-handling guarantee**: the slot control hashes after copying its dynamic bytes and does not prebound a corrupted length header; the code-backed arm bounds metadata before copying and checks its different physical representation. This September12 source-review clarification does not change the retained valid-body receipts, but narrows the earlier “safety-matched” wording. Later bounded-backend comparisons must use an appropriately bounded control.

Solidity 0.8.30, Cancun, optimizer 200, via-IR; ordinary 24,576-byte runtime, 49,152-byte initcode, 4,096-byte body, and 16,777,216-gas transaction/block limits. No full traces, raised limits, external-body substitution, new Type encoding, cross-Type body sharing, or ingestion extraction.

## Actual paid receipts

Positive primary saving means the code-backed candidate costs less. Complete Files use fresh nonzero payloads (`0x51` initial, `0x52` edit), with distinct exact RecordIds. They run before standalone admission sweeps. Every row below is an actual transaction receipt, not a Forge aggregate or estimate.

| Action | Original | Storage + integrity | Code + integrity | Primary saving |
|---|---:|---:|---:|---:|
| Raw 41-byte fresh create | 614,489 | 614,489 | 613,919 | 570 |
| Raw 41-byte fresh edit | 264,011 | 264,011 | 263,457 | 554 |
| Canonical 41-byte fresh create (128-byte body) | 633,001 | 633,001 | 605,472 | 27,529 |
| Canonical 41-byte fresh edit | 311,203 | 311,203 | 283,690 | 27,513 |
| Raw 256-byte fresh edit | 400,719 | 400,719 | 310,118 | 90,601 |
| Canonical 256-byte fresh edit | 445,852 | 445,852 | 323,712 | 122,140 |
| Raw 4,032-byte fresh create | 3,384,830 | 3,384,830 | 1,433,444 | 1,951,386 |
| Raw 4,032-byte fresh edit | 3,083,783 | 3,083,783 | 1,132,496 | 1,951,287 |
| Canonical 4,032-byte fresh edit (4,096-byte body) | 3,128,916 | 3,128,916 | 1,146,092 | 1,982,824 |
| Raw 4,096-byte fresh edit | 3,129,253 | 3,129,253 | 1,146,429 | 1,982,824 |
| Raw 41-byte existing-record create | 432,850 | 432,850 | 432,831 | 19 |
| Raw 41-byte same-content edit | 121,672 | 121,672 | 121,669 | 3 |
| QuoteProducer first 32-byte publish | 600,423 | 600,423 | 620,211 | −19,788 |
| QuoteProducer fresh 32-byte update | 245,563 | 245,563 | 265,367 | −19,804 |
| Independent QuoteReader paid transaction | 77,365 | 77,836 | 78,550 | −714 |
| Rename raw 41-byte file | 219,719 | 219,719 | 219,696 | 23 |
| Unlink raw 41-byte file | 115,669 | 115,669 | 115,669 | 0 |

The raw short-file edit still misses the provisional 250k ambition. The quote update **loses** its earlier sub-250k result. Fresh-create figures depend on exact name, workload order, and initialized persistent inventories; do not splice them into older first-operation benchmarks. Same-content operations are labeled dedup, not fresh-storage savings.

### Tiny and zero-heavy counterexamples

| Standalone first admission | Storage + integrity | Code + integrity | Primary saving |
|---|---:|---:|---:|
| Raw empty | 114,580 | 170,128 | −55,548 |
| Raw 1 byte, zero or nonzero (zero shown) | 134,687 | 170,507 | −35,820 |
| Raw 31 nonzero bytes | 135,059 | 176,884 | −41,825 |
| Raw 32 nonzero bytes | 157,298 | 177,102 | −19,804 |
| Raw 33 nonzero bytes | 179,635 | 177,481 | 2,154 |
| Raw 41 zero bytes | 139,439 | 178,685 | −39,246 |
| Raw 256 zero bytes | 154,168 | 222,782 | −68,614 |
| Raw 4,032 zero bytes | 443,713 | 999,848 | −556,135 |
| Raw 4,032 nonzero bytes | 2,999,497 | 1,048,232 | 1,951,265 |
| Canonical empty payload (64-byte body) | 159,771 | 183,703 | −23,932 |
| Canonical 4,032 zero payload bytes | 488,845 | 1,013,444 | −524,599 |

The complete admission matrix retains raw/canonical payload sizes 0/1/31/32/33/41/256/4032, zero/nonzero/mixed composition, and first/duplicate attempts. Empty and some one-byte fixtures collide across patterns: the label `first` means first attempt in that named case, while `admission` and `dedup` record actual exact-ID membership. In particular, later empty-pattern “first” attempts are **dedup**. No fresh zero-content file claim is made from an already-admitted zero fixture.

## Reads and retained history

| Paid BodyReadConsumer transaction | Original | Storage + integrity | Code + integrity | Primary saving |
|---|---:|---:|---:|---:|
| Raw 41 bytes, one read | 82,394 | 82,878 | 81,404 | 1,474 |
| Raw 41 bytes, two reads in one transaction | 85,701 | 86,669 | 85,221 | 1,448 |
| Raw 4,032 bytes, one read | 358,072 | 360,212 | 87,426 | 272,786 |
| Raw 4,032 bytes, two reads in one transaction | 389,318 | 393,598 | 97,526 | 296,072 |

Each count starts with a fresh consumer and equal empty effect slots. Its digest and count are read back at the receipt block. Same-transaction repeated reads have warm accesses; this is not claimed for separate transactions. Actual PayloadConsumer capture transactions verify exact decoded payload digest, length, File revision, and RecordId for all seven Files cases. The unrelated QuoteReader's view transaction is checked by an independent same-basis return read, not falsely described as a storage mutation.

**Unpaid estimates are separate:** raw 41-byte current `readRecord` returns 192 ABI bytes and estimates 33,865 / 34,349 / 32,875 gas. Raw 4,032 bytes returns 4,160 ABI bytes and estimates 307,175 / 309,315 / 36,529. The seven-entry post-retention directory hydration returns 2,464 ABI bytes and estimates 180,315 / 180,315 / 180,504 (a 189-gas regression). Current and historical records, exact return bytes, and 29 read/estimate rows per arm are retained; estimates are not receipt gas or state proofs.

Seven complete Files lifecycles retain initial and updated exact bodies plus revision metadata before and after rename/unlink. Unlink remains terminal for that FileId; immutable bytes and all revisions remain readable. No historical revision/location copy rule, navigation, discovery, Type identity, authority, or CAS behavior was changed.

## Setup, failures, and provenance

Kernel deployment including its internal helpers costs 5,082,046 / 5,089,423 / 5,509,692 gas. Integrity-only setup adds 7,377; code plus integrity adds **420,269 over integrity control** (427,646 total over original). This includes code-size/constructor/helper changes; there is no invented separate helper-deployment receipt. Each arm has 25 setup receipts, totaling 10,165,935 / 10,173,312 / 10,593,521 gas, including measurement consumers.

| Actual reverted receipt | Original | Storage + integrity | Code + integrity |
|---|---:|---:|---:|
| Canonical 4,096-byte payload refusal | 88,299 | 88,299 | 88,296 |
| Raw 4,097-byte body refusal | 88,159 | 88,159 | 88,156 |
| Duplicate name, fresh attempted body | 327,575 | 327,575 | 368,984 |
| Stale CAS | 25,997 | 25,997 | 25,997 |
| Late mandatory discovery unavailability | 258,841 | 258,841 | 259,287 |

The final row is explicitly a local `anvil_setCode` outage of the immutable mandatory-discovery hook, restored afterward; **not an optional attached scalar-profile failure result**. Unchanged scalar required/tolerated, partial-write, child/outer-OOG and dirty/recovery regressions remain in the full suite. Atomic refusal evidence snapshots helper/kernel CREATE nonces, next child/code absence, File nonce/status/history/location, navigation listing, required inventories, and absent attempted RecordId. Raw 4,096 zero/nonzero success and dedup are separately retained, not paired against canonical refusal.

Three fresh sequential worlds each retain 172 action receipts (5 reverted), 25 setup receipts, complete transaction/calldata/signature fields, transaction/block identities, exact-ID checks, and receipt-block canonical observations. **All matched action calldata is byte-identical**, hence intrinsic action deltas are zero. Setup inputs differ and are retained separately. Every receipt and block respects the ordinary gas ceiling; no trace-derived storage-slot claims are made.

Actual TypeIds and all three validator runtime hashes match across arms and the earlier raw evidence. The unchanged `ExactTypeRegistry.sol`, `ExpandedTypeRegistry.sol`, and `RawBytesValidator.sol` retain their frozen runtime identities. New historical artifact selections explicitly preserve expanded/raw/discovery capabilities; older aa6b1b6/bf566dc fixtures retain their original capabilities.

Candidate runtime/initcode: kernel **10,909 / 25,429 bytes**, helper **464 / 502**, paid read consumer **626 / 652**. Actual kernel runtime hash is `0xe0b9ddf6af5347a1c1d41ec2d35371372a2f0666fb0b0b9cd600f0c9c65fd04c`; actual helper hash is `0x8150a50c626e871b5dcdb45efd04b45e98907f251ef8d7bd95a9e7335a5e5510`. The helper's predicted constructor address is accepted only after its actual runtime matches the compiled runtime with the kernel immutable substituted. All **60 unique records** have **60 exact pinned child runtimes**, including one-byte STOP for empty raw; helper creates never advance the kernel CREATE nonce.

Final evidence worlds report stopped PIDs 10419/10490/10546 and exact owned-cache removal. No persistent replacement server was started and the existing snapshot-frozen browser/world was not changed. The temporary control-source export was removed after retaining its artifact and exact delta.

## Verification and reproduction

84 Forge tests pass (10 focused body tests); touched-source formatting and ordinary-size build pass. The full existing serial Node suite plus two new tests passed 25/25; the new measurement test was rerun after adding explicit non-record/dedup labels and read-comparison rows. The body controls also have a behavioral fault test: the original storage arm returns a tampered same-length body, while the integrity-control arm rejects it. The new backend rejects empty/truncated/extended/wrong-prefix/same-length-substituted body code, invalid metadata, changed/missing helper code, and unauthorized helper use; failed creation/low gas and late failures roll back allocations.

From the experiment directory, run `node --test --test-concurrency=1 test/*.test.mjs` for verification. `node scripts/body-storage-benchmark.mjs` reruns the three-arm experiment but deliberately refuses to replace the existing JSON (`wx`). Preserve the retained evidence and choose a separately authorized output if reproducing it; do not delete it to make the command succeed.

Follow-on only: a measured simple hybrid or transferring the technique to real full-C0 Record/envelope placement requires a later arm and its actual legal-size/checked-reader constraints. These results do not settle either decision.
