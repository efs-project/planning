# Reconciled gas baseline — files-browser routed operations

**Date:** 2026-09-10. **Branch:** `fable/2026-09-09-files-browser`, revision `e6de414`
(working tree dirty only in forge-regenerated `contracts/out`/`contracts/cache`).
**Status:** measurement. Replaces the §2 table and the headline figures of
[`gas-engineering-2026-09-10.md`](gas-engineering-2026-09-10.md); see §7 for the
itemised corrections. Nothing here changes a contract or a design.

Every number below is labelled **MEASURED** (from a retained artifact under
[`evidence/gas-2026-09-10/`](evidence/gas-2026-09-10/index.json), produced by
[`scripts/measure/`](scripts/measure/README.md)), **QUOTED** (a published gas
schedule) or **ESTIMATED** (arithmetic on measured counts). Where a number
from the earlier report cannot be tied to a retained artifact it is marked
**UNVERIFIED**. Runs are never combined: each table names its run and
transaction.

## 0. Headline numbers (MEASURED)

| operation | run1 receipt | run2 receipt | what is fresh in the world when it runs |
| --- | --- | --- | --- |
| tag, first ever (`tag-first-ever`) | 3,046,565 | 3,046,565 | first `FileTagAssertion` in the world, first routed V3 op by principal A, fresh (A, tagPurpose, fileA) scope |
| tag, steady state, 2nd label on the object (`tag-steady-1`) | 2,804,496 | 2,804,520 | nothing at type/scope level; label's scalar index key |
| tag, steady state, 3rd label (`tag-steady-2`) | 2,839,176 | 2,839,164 | as above **plus three posting words crossing a 5-entry boundary** (§4) |
| tag, first in a fresh scope, type warm (`tag-first-in-scope`, fileB) | 2,847,547 | 2,847,547 | (A, tagPurpose, fileB) scope; typed-role and scope posting keys |
| createDir (`createDir-1`) | 5,136,899 | 5,136,899 | new object's charter scope (always), 4 leaves |
| createDir, repeat (`createDir-2`) | 5,216,074 | 5,216,074 | as above plus four word-boundary crossings |
| stageChunk, 41-byte single chunk (`stageChunk-1`) | 149,369 | 149,369 | carrier chunk store row + status |
| createFile, single chunk, 7 leaves (`createFile-1`) | 8,560,084 | 8,560,072 | new object charter scope, revision head scope (12 gas of calldata between runs) |
| createFile, repeat (`createFile-2`) | 8,559,966 | 8,559,966 | |

Runs 3 and 4 replay the two scratchpad orders the earlier report drew from
and reproduce its 2,838,264 / 5,132,853 / 3,014,913 exactly (§8).

Run-to-run differences of 12/24 gas are calldata: the author signature and
deadline change with the block timestamp, so the zero/nonzero byte split of
the input moves by one or two bytes (4 vs 16 gas each). Execution gas is
byte-identical between runs; see `tables.md` "Receipt gas by operation and
run" for the byte counts.

Every transaction reconciles with **residual 0** (`intrinsic + gross − refund
= receipt`), **0** deviations of any SSTORE from the EIP-2200/2929 cost
model, **0** unattributed written slots, **0** disagreements with the
independent `prestateTracer` diff and `callTracer` frame gas, and refund
counter **0** (no slot is ever cleared or restored by these operations).

## 1. Method

Full detail: [`scripts/measure/README.md`](scripts/measure/README.md).

* **Fixture path** = the node suites' path: `startEnvironment(lab, { write:
  true, relay: false })` (nestedFixture → routerFixture → authorityFixture),
  operations through `authorityFixture.execute` (FilesRouterV2 → Core U3
  `executeAuthorized`, one author signature) and `stageChunks` (carrier
  `stageChunk`), as `test/authority.test.mjs` does. One managed anvil per run,
  `--hardfork cancun --steps-tracing`, tx gas limit 16,777,216.
* **Per transaction retained:** receipt, raw tx, the complete stack-enabled
  `debug_traceTransaction` structLogs (gzip; 81–83 MB raw for a tag, 162 MB
  for a createDir, 267 MB for a createFile; 2.7–8.5 MB gzipped),
  `prestateTracer` diff, `callTracer` tree, the SSTORE/SLOAD step list, and
  `analysis.json`.
* **Gas model.** Per-step consumption is the `gas` delta to the next step of
  the same frame; a CALL-family step's own overhead is that delta minus its
  child frame's consumption (`gasCost` on a CALL step is the gas *forwarded*
  and is never summed). Intrinsic = 21,000 + 4/16 per calldata byte from the
  tx input, cross-checked against `gasLimit − first-step gas`. Refunds are
  recomputed per SSTORE (EIP-3529) and compared with anvil's `refund` field.
* **SSTORE classes** (per write, from `eth_getStorageAt` at the previous block
  + the ordered writes): `FRESH` 0→nonzero first write; `COLD_REWRITE`
  nonzero→different nonzero, first write in the tx (EIP-2200 "clean");
  `WARM_REWRITE` already written in this tx; `NOOP` same value (includes zero
  written to a zero slot); `CLEAR`; `RESTORE`. Per slot: `FRESH`, `REWRITE`,
  `CLEARED`, `UNCHANGED`, `UNCHANGED_ZERO`. Every write's charged gas is
  checked against the model with the slot's warm/cold access state.
* **Attribution to `StateStore.Kind`** by **preimage derivation** — no
  instrumentation, kernel untouched. The Store lives under ERC-7201
  `efs.fixture.store`; the key universe of every bytes32-keyed mapping is read
  from the ordinal index mappings (`recordIds`, `envelopeIds`, `typeIds`,
  `principalIds`, `postingKeys`, `bindingKeys`) at the final block, and every
  mapping/struct/dynamic-bytes slot is recomputed from the Solidity layout and
  matched. Posting keys are further labelled by `IndexKeys` family (1–10) by
  recomputing the kernel's preimages. Counts and Bootstrap (`s.count`,
  `s.init`) are the two non-journal structs the kernel writes directly.

Versions: anvil/forge 1.7.1 (4072e48), solc 0.8.30+commit.73712a01, node
v24.11.0, ethers 6.15.0, `evm_version = cancun`, optimizer 200 runs, via-IR.

## 2. Reconciliation tables (run1; run2 identical except calldata)

Components are gas consumed by opcode category (call overheads booked to
the caller, precompile = ecrecover 3,000 + access). Each table sums to the
receipt.

### 2.1 Steady-state tag — `run1/tag-steady-1`, receipt **2,804,496**

| component | gas | share of execution |
| --- | ---: | ---: |
| intrinsic: base | 21,000 | |
| intrinsic: calldata (1,956 bytes: 1,310 zero / 646 nonzero) | 15,576 | |
| SSTORE (100 ops, 90 distinct slots) | 1,210,500 | 43.7% |
| SLOAD (770 ops, 284 distinct slots) | 645,000 | 23.3% |
| KECCAK256 (552 ops) | 25,140 | 0.9% |
| LOG (2 events) | 4,280 | 0.2% |
| CALLDATA (`CALLDATALOAD/COPY/SIZE`, 580 ops) | 51,967 | 1.9% |
| MEMORY (`MLOAD/MSTORE/MCOPY/RETURNDATA*`) | 139,184 | 5.0% |
| STACK (`PUSH/DUP/SWAP/POP`, 114,036 ops) | 335,225 | 12.1% |
| CONTROL (`JUMP*/JUMPDEST/…`) | 191,025 | 6.9% |
| ARITH | 126,567 | 4.6% |
| CODE (`CODECOPY/EXTCODE*`) | 14,166 | 0.5% |
| ENV | 166 | 0.0% |
| CALL overhead (41 calls) | 21,600 | 0.8% |
| PRECOMPILE (ecrecover) | 3,100 | 0.1% |
| execution gross | 2,767,920 | 100% |
| refund applied | −0 | |
| **receipt** | **2,804,496** | residual 0 |

Self gas by contract (MEASURED): UpgradeAdmissionLibrary 2,230,278 (80.6%),
PreparationHelper 179,780, Core U3 impl 116,654, PointReadLibrary 74,832,
FixtureDeployment (controller) 60,099, FilesRouterV2 57,777, Carrier U3 impl
29,940, proxies + ProxyAdmins 18,560.

### 2.2 Steady-state tag, third label — `run1/tag-steady-2`, receipt **2,839,176**

Same structure; the only material difference is SSTORE 1,244,700 (+34,200):
three posting words crossed a 5-ordinal boundary and were allocated fresh
(fam1@w4, fam2@w4, fam4@w14) while one that was fresh in `tag-steady-1`
(fam5@w1) was not, net +2 FRESH writes (58 vs 56), +456 plumbing, +24
intrinsic (calldata); total +34,680. SLOAD, KECCAK, LOG, calls identical to
2.1.

### 2.3 First tag ever — `run1/tag-first-ever`, receipt **3,046,565**

| component | gas | share |
| --- | ---: | ---: |
| intrinsic: base + calldata (1,956 bytes: 1,309 / 647) | 36,588 | |
| SSTORE (104 ops, 94 distinct slots) | 1,427,300 | 47.4% |
| SLOAD (778 ops, 288 distinct slots) | 653,800 | 21.7% |
| KECCAK256 (576 ops) | 26,124 | 0.9% |
| LOG | 4,280 | 0.1% |
| CALLDATA | 51,970 | 1.7% |
| MEMORY | 141,420 | 4.7% |
| STACK | 341,822 | 11.4% |
| CONTROL | 195,325 | 6.5% |
| ARITH | 128,904 | 4.3% |
| CODE + ENV | 14,332 | 0.5% |
| CALL overhead + precompile | 24,700 | 0.8% |
| execution gross | 3,009,977 | 100% |
| **receipt** | **3,046,565** | residual 0 |

Versus 2.1: SSTORE +216,800 (four extra `PostingKey`+`Posting`+`Word`
triples for families 1, 2, 6 and 10 — the type's "all records", "unique",
"typed role→target" and the (A, tagPurpose, fileA) scope — plus the
`principalNonce` slot, fresh because this is A's first V3 operation),
SLOAD +8,800, plumbing +15,473, keccak +984.

### 2.4 First tag in a fresh scope, type warm — `run1/tag-first-in-scope` (fileB), receipt **2,847,547**

Intrinsic 36,552; SSTORE 1,247,600 (101 ops, 91 slots); SLOAD 647,200 (772
ops, 285 slots); KECCAK 25,386; LOG 4,280; plumbing 861,829; calls 24,700;
gross 2,810,995; refund 0. Versus 2.1: one extra `PostingKey`+`Posting`+`Word`
triple (family 10 scope) and a fresh family-6 key; the label's family-7 scalar
key already existed (label reused) so that one is a rewrite.

### 2.5 createDir — `run1/createDir-1`, receipt **5,136,899**

| component | gas | share |
| --- | ---: | ---: |
| intrinsic: base + calldata (2,756 bytes: 1,774 zero / 982 nonzero) | 43,808 | |
| SSTORE (163 ops, 142 distinct slots) | 2,191,300 | 43.0% |
| SLOAD (1,364 ops, 415 distinct slots) | 966,400 | 19.0% |
| KECCAK256 | 43,782 | 0.9% |
| LOG | 4,280 | 0.1% |
| CALLDATA | 171,583 | 3.4% |
| MEMORY | 392,581 | 7.7% |
| STACK | 652,667 | 12.8% |
| CONTROL | 383,437 | 7.5% |
| ARITH | 245,259 | 4.8% |
| CODE + ENV | 15,830 | 0.3% |
| CALL overhead + precompile | 25,972 | 0.5% |
| execution gross | 5,093,091 | 100% |
| **receipt** | **5,136,899** | residual 0 |

`createDir-2` = 5,216,074: SSTORE 2,265,300 (+74,000: four word-boundary
crossings, FRESH 107 vs 103), SLOAD +4,400, otherwise the same.

### 2.6 stageChunk (41-byte body, one chunk) — `run1/stageChunk-1`, receipt **149,369**

Intrinsic 24,480 (420 calldata bytes); SSTORE 106,400 (6 ops, 5 slots: 3
`Chunk` data slots + 2 `ChunkStatus`); SLOAD 8,600; KECCAK 450; LOG 1,893;
plumbing 4,946; call overhead 2,600 (proxy delegatecall, cold); gross
124,889. `stageChunk-2` = 149,489 (calldata differs by 120 gas: 10 more
nonzero bytes in the body).

### 2.7 createFile (single chunk, 7 leaves) — `run1/createFile-1`, receipt **8,560,084**

| component | gas | share |
| --- | ---: | ---: |
| intrinsic: base + calldata (3,716 bytes: 2,248 zero / 1,468 nonzero) | 53,480 | |
| SSTORE (253 ops, 217 distinct slots) | 3,651,700 | 42.9% |
| SLOAD (2,048 ops, 634 distinct slots) | 1,472,800 | 17.3% |
| KECCAK256 | 69,576 | 0.8% |
| LOG | 4,280 | 0.1% |
| CALLDATA | 257,788 | 3.0% |
| MEMORY | 913,658 | 10.7% |
| STACK | 1,067,355 | 12.5% |
| CONTROL | 629,116 | 7.4% |
| ARITH | 397,533 | 4.7% |
| CODE + ENV | 16,526 | 0.2% |
| CALL overhead + precompile | 26,272 | 0.3% |
| execution gross | 8,506,604 | 100% |
| **receipt** | **8,560,084** | residual 0 |

`createFile-2` = 8,559,966 (SSTORE 3,643,000, SLOAD 1,479,400; word-boundary
churn in both directions). Self gas: UpgradeAdmissionLibrary 7,282,478
(85.6%), PreparationHelper 708,135, Core impl 145,310, router 89,313,
UpgradeQueryReadLibrary 87,239, PointReadLibrary 74,832.

## 3. Slot census (MEASURED)

### 3.1 Writes by class

| operation | SSTOREs | distinct slots | FRESH | COLD_REWRITE | WARM_REWRITE | NOOP | CLEAR / RESTORE | SSTORE gas by class (fresh / cold / warm / noop) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| tag-first-ever | 104 | 94 | 68 | 10 | 8 | 18 | 0 / 0 | 1,389,400 / 29,000 / 800 / 8,100 |
| tag-steady-1 | 100 | 90 | 56 | 18 | 8 | 18 | 0 / 0 | 1,149,400 / 52,200 / 800 / 8,100 |
| tag-steady-2 | 100 | 90 | 58 | 16 | 8 | 18 | 0 / 0 | 1,189,400 / 46,400 / 800 / 8,100 |
| tag-first-in-scope | 101 | 91 | 58 | 17 | 8 | 18 | 0 / 0 | 1,189,400 / 49,300 / 800 / 8,100 |
| createDir-1 | 163 | 142 | 103 | 23 | 19 | 18 | 0 / 0 | 2,114,600 / 66,700 / 1,900 / 8,100 |
| createDir-2 | 163 | 144 | 107 | 21 | 17 | 18 | 0 / 0 | 2,194,600 / 60,900 / 1,700 / 8,100 |
| stageChunk-1 | 6 | 5 | 5 | 0 | 1 | 0 | 0 / 0 | 106,300 / 0 / 100 / 0 |
| createFile-1 | 253 | 217 | 174 | 27 | 34 | 18 | 0 / 0 | 3,561,900 / 78,300 / 3,400 / 8,100 |
| createFile-2 | 253 | 220 | 173 | 31 | 31 | 18 | 0 / 0 | 3,541,900 / 89,900 / 3,100 / 8,100 |

Distinct slots by final class: every FRESH write is a distinct slot that goes
0→nonzero (tag-first-ever 68, tag-steady-1 56, createDir-1 103, createFile-1
174); the REWRITE slots equal the COLD_REWRITE count; and every admission
carries the same 16 slots that are written without changing: 13 `Bootstrap`
(`s.init` copied back, 13 × 100 gas = 1,300) and 3 `Envelope` data words that
hold zero (`authorityRef`, `authEpoch`, `notAfter`; cold zero→zero, 3 × 2,200
= 6,600). The other two NOOPs are `Counts` words rewritten with their current
value (2 × 100); NOOP total 8,100. FRESH writes are 95–97% of SSTORE gas in
every admission.

FRESH writes come in two prices. Scalar slots cost 20,000: the kernel journal
reads each slot (`journalRead` → `StateStore.read`) before writing it, so the
2,100 cold access is booked to the SLOAD row. Dynamic-`bytes` data words
(`Envelope.canonicalUnsignedEnvelope`, `Record.body`) are not pre-read — the
journal reads only the `bytes` head slot — so they cost the full 22,100:
14 of 56 FRESH writes in the steady tag (7 envelope + 7 record body words,
29,400 gas), 14 of 68 first-ever, 26 of 103 createDir, 39 of 174 createFile,
3 of 5 stageChunk, 129 of 131 for a 4 KiB chunk. That is why 1,149,400 ≠
56 × 20,000 (the remainder is 14 × 2,100).

### 3.2 Slots by StateStore family — tag, steady state (`run1/tag-steady-1`)

| Kind | slots | FRESH | REWRITE | UNCHANGED | SSTOREs | SSTORE gas | write classes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Record (2 rows: typeId, body head, 2 body data words, ordinals) | 13 | 13 | 0 | 0 | 15 | 274,900 | FRESH 13, WARM_REWRITE 2 |
| Envelope (head, ordinal, 10 data words) | 12 | 9 | 0 | 3 zero | 12 | 201,300 | FRESH 9, NOOP 3 |
| Word (posting ordinals) | 14 | 7 | 7 | 0 | 15 | 160,400 | FRESH 7, COLD 7, WARM 1 |
| Posting (heads) | 14 | 6 | 8 | 0 | 15 | 143,300 | FRESH 6, COLD 8, WARM 1 |
| PostingKey (index) | 6 | 6 | 0 | 0 | 6 | 120,000 | FRESH 6 |
| Admission (2 rows × 2 slots) | 4 | 4 | 0 | 0 | 4 | 80,000 | FRESH 4 |
| Batch | 3 | 3 | 0 | 0 | 3 | 60,000 | FRESH 3 |
| RecordId | 2 | 2 | 0 | 0 | 2 | 40,000 | FRESH 2 |
| Lifecycle | 2 | 2 | 0 | 0 | 2 | 40,000 | FRESH 2 |
| Binding (meta, target) | 2 | 2 | 0 | 0 | 2 | 40,000 | FRESH 2 |
| EnvelopeId | 1 | 1 | 0 | 0 | 1 | 20,000 | FRESH 1 |
| BindingKey | 1 | 1 | 0 | 0 | 1 | 20,000 | FRESH 1 |
| Counts | 2 | 0 | 2 | 0 | 8 | 6,400 | COLD 2, WARM 4, NOOP 2 |
| Authority.principalNonce | 1 | 0 | 1 | 0 | 1 | 2,900 | COLD 1 |
| Bootstrap (`s.init`) | 13 | 0 | 0 | 13 | 13 | 1,300 | NOOP 13 |
| **total** | **90** | **56** | **18** | **16** | **100** | **1,210,500** | |

Posting-index writes by `IndexKeys` family (steady tag): family 3 (record
occurrences) 4 slots all fresh, 80,000; family 5 (references to target) 4
slots, 3 fresh, 62,900; family 6 (typed role→target) 4 slots, 2 fresh,
45,800; family 7 (scalar index on tagId) 2 fresh, 40,000; family 8 (binding
history) 2 fresh, 40,000; families 1, 2 (all-of-type, unique) 4 slots each,
rewrites, 11,600 each; family 4 (by principal) 2 slots, 6,000; family 10
(scope) 2 slots, 5,800. Posting families together (Posting + Word): 28 of
the 90 slots and 303,700 of SSTORE gas, plus the 6 `PostingKey` index slots
(120,000) — 34 slots and 35% of SSTORE gas for the indexes of two records.

`tag-first-ever` differs by exactly: PostingKey 10 (not 6), Word/Posting 10
fresh each (not 7/6) — the family 1, 2, 6 and 10 keys — and `Authority`
FRESH (20,000 instead of 2,900).

### 3.3 Slots by family — createDir (`run1/createDir-1`) and createFile (`run1/createFile-1`)

| Kind | createDir slots (fresh) | SSTORE gas | createFile slots (fresh) | SSTORE gas |
| --- | ---: | ---: | ---: | ---: |
| Record | 29 (29) | 616,100 | 48 (48) | 1,017,400 |
| Word | 23 (13) | 289,500 | 37 (27) | 570,100 |
| Posting | 22 (12) | 269,600 | 36 (22) | 481,800 |
| Envelope | 14 (11) | 245,500 | 17 (14) | 311,800 |
| PostingKey | 12 (12) | 240,000 | 22 (22) | 440,000 |
| Admission | 8 (8) | 160,000 | 14 (14) | 280,000 |
| RecordId | 4 (4) | 80,000 | 7 (7) | 140,000 |
| Lifecycle | 4 (4) | 80,000 | 7 (7) | 140,000 |
| Binding | 4 (4) | 80,000 | 6 (6) | 120,000 |
| Batch | 3 (3) | 60,000 | 3 (3) | 60,000 |
| BindingKey | 2 (2) | 40,000 | 3 (3) | 60,000 |
| EnvelopeId | 1 (1) | 20,000 | 1 (1) | 20,000 |
| Counts | 2 (0) | 6,400 | 2 (0) | 6,400 |
| Authority | 1 (0) | 2,900 | 1 (0) | 2,900 |
| Bootstrap | 13 (0) | 1,300 | 13 (0) | 1,300 |
| **total** | **142 (103)** | **2,191,300** | **217 (174)** | **3,651,700** |

createFile record rows: ObjectGenesis, BindingSet (charter), ChunkTree,
FileRevision, BindingSet (head), DirectoryEntry, BindingSet (name) — the
48 Record slots are 7 × (typeId + body head + ordinals) + 27 body data words.
Chunk staging is separate: 3 `Chunk` data slots + 2 `ChunkStatus` in the
carrier (`stageChunk-1`).

### 3.4 Reads by family (SLOAD gas)

Steady tag, 770 SLOADs / 645,000 gas: **Type 137 slots, 276 reads, 301,600**
(46.8% of SLOAD gas — the type cache `cacheBytes` re-read from storage for
every leaf preparation); Record 55,300; FixtureDeployment (controller)
execution-set storage 48,700; router `typeIds`/`purposes` 17 slots 35,800;
Posting 32,500; Word 32,300; Bootstrap 30,600; Control 27,100; PostingKey
13,200; ERC-1967 12,000; the rest < 10,000 each. createFile: Type 367 slots,
1,112 reads, 845,200 of 1,472,800.

## 4. What "steady state" actually is (MEASURED)

Posting ordinals are packed five per 32-byte word (`wordIndex = count / 5`,
`StateKernel.append`). Every fifth append to a posting key allocates a fresh
`Word` slot (20,000 + the read) instead of rewriting one (2,900). Keys shared
by every admission — family 1/2 per type, family 4 per principal — cross a
boundary regularly, so consecutive identical operations differ by whole
fresh slots: `tag-steady-1` → `tag-steady-2` is +34,680 with exactly
{fam1@w4, fam2@w4, fam4@w14} becoming FRESH and fam5@w1 no longer fresh;
`createDir-1` → `createDir-2` is +79,175 with four crossings. A single
"steady-state" figure therefore does not exist; the honest statement is a
band (tag 2,804,496–2,839,176; createDir 5,136,899–5,216,074 in these runs)
whose width is 17,100 per boundary crossing. Any comparison between two
measurements must report the FRESH-slot count next to the gas.

Also measured: the first routed V3 operation by a principal pays 20,000 for
the fresh `principalNonce` slot instead of 2,900 (+17,100). The "first"
operation of any test or script is therefore first-by-principal as well as
first-in-scope.

## 5. Per-class extrapolation (ESTIMATED)

PM-supplied multipliers applied to MEASURED write counts: FRESH × 110,020,
COLD_REWRITE × 12,100, every other SSTORE on an already-written slot
(WARM_REWRITE + NOOP + RESTORE) × 10,100. SSTORE component only; SLOAD and
plumbing are not repriced here.

| operation | FRESH | COLD_REWRITE | warm | SSTORE component today (MEASURED) | extrapolated SSTORE (ESTIMATED) |
| --- | ---: | ---: | ---: | ---: | ---: |
| tag-first-ever | 68 | 10 | 26 | 1,427,300 | 7,864,960 |
| tag-steady-1 | 56 | 18 | 26 | 1,210,500 | 6,641,520 |
| tag-steady-2 | 58 | 16 | 26 | 1,244,700 | 6,837,360 |
| tag-first-in-scope | 58 | 17 | 26 | 1,247,600 | 6,849,460 |
| createDir-1 | 103 | 23 | 37 | 2,191,300 | 11,984,060 |
| stageChunk-1 | 5 | 0 | 1 | 106,400 | 560,200 |
| createFile-1 | 174 | 27 | 52 | 3,651,700 | 19,995,380 |

## 6. Cross-checks that make these numbers trustworthy

* Sum of categories = trace gross (first-step gas − remaining gas), every tx.
* Intrinsic from calldata = gasLimit − first-step gas, every tx.
* `intrinsic + gross − refund = receipt`, residual 0, every tx.
* Every SSTORE's charged gas equals the EIP-2200/2929 model given
  (original, current, new, warm) — 0 mismatches over 1,249 SSTOREs in run1.
* Refund recomputed = anvil's `refund` counter (0 = 0), every tx.
* `prestateTracer` diff: the set of changed slots and their post values equal
  the harness's per-slot final values, every tx; per-slot finals also
  re-read with `eth_getStorageAt`.
* `callTracer`: per-frame `gasUsed` equals the harness's child-frame
  consumption for all 42/54/57 frames per tx (precompile frame convention
  noted in the README).
* Written slots with no derivable preimage: 0. SLOADs with none: 0 for tags,
  4 (8,400 gas) for createDir/createFile — Core slots read once each, whose
  keys never exist afterwards (consistent with the resolver probing binding
  heads for principals that never bound the name); listed in
  `analysis.json → sload.unattributed`.

## 7. Corrections to `gas-engineering-2026-09-10.md`

1. **§2 component table came from the first tag in the world, not the
   headline transaction.** Retained `run1/tag-first-ever` (receipt
   3,046,565) reproduces the table's SSTORE 1,427,300, SLOAD 653,800 (778
   reads), KECCAK 26,124 (576 hashes) and "104 ops, 94 distinct slots" exactly.
   Those rows were MEASURED on that run — specifically on the `ocean` label
   (the report's receipt 3,046,997 = `run4/tag-ocean` 3,046,985 + 12 gas of
   calldata). The row "intrinsic + call bases ~61,264" was also correct:
   intrinsic 36,564 + call overhead 21,600 + precompile 3,100 = 61,264
   exactly. The only unmeasured row was "EVM interpreter / ABI plumbing
   ~859,963": on that transaction it is 878,509 (plumbing 874,229 = CALLDATA
   + MEMORY + STACK + CONTROL + ARITH + CODE/ENV, plus LOG 4,280). The printed
   table summed to 3,028,451 because that one row was 18,546 short
   (3,046,997 − 3,028,451); §2.3 above sums to the receipt (on the `alpha`
   label, whose plumbing is 456 lower).
2. **"Steady-state tag = 2,838,264" is the THIRD tag on the same object in
   `marginal.mjs`, now MEASURED and retained** (`run3/tag-lbl2`, §8). It is
   not the transaction the §2 components describe (that was the first tag,
   3,046,565), and it is not the cheapest steady state either: the second
   label costs 2,804,496–2,804,520 and the third 2,838,264–2,839,176 because
   two posting words cross a 5-ordinal boundary between them (§4). Corrected
   statement: *a steady-state tag costs 2,804,496–2,839,176 in these runs,
   58 vs 56 fresh slots; the components in §2.1 belong to 2,804,496, those
   of 2,838,264 are SSTORE 1,244,700 / SLOAD 645,000 / KECCAK 25,140 / LOG
   4,280 / plumbing 857,844 / calls 24,700 / intrinsic 36,600.*
3. **"104 SSTOREs → 94 distinct slots" classified** (first tag ever): 68
   FRESH writes = 68 slots 0→nonzero (1,389,400 gas, 97.3% of SSTORE), 10
   COLD_REWRITE (29,000), 8 WARM_REWRITE (800), 18 NOOP (8,100). Distinct
   slots: 68 FRESH, 10 REWRITE, 13 UNCHANGED (`s.init`), 3 UNCHANGED_ZERO
   (envelope zero words). 94 distinct slots written is 68 fresh allocations.
   In the steady state it is 90 slots, 56 fresh.
4. **"SSTORE is 46.8% of a tag"** — true of the first-ever tag on its gross
   (1,427,300 / 3,046,565 = 46.8% of the receipt); the steady-state share is
   43.2% of the receipt (1,210,500 / 2,804,496) or 43.7% of execution.
5. **createDir "5,132,853–5,148,912"** mixes two routers: 5,132,853 is the
   second createDir of `marginal.mjs` on the V2 path (`run3/createDir-m2`,
   reproduced exactly, 104 fresh slots); 5,148,912 is the **V1 router**
   createDir printed by `test/router.test.mjs` (5,148,924 today, §9).
   Retained V2 values across the run1 default and run3 `lead-marginal`
   orders: 5,117,380–5,216,074 (103–107 fresh slots) depending on position
   (default order alone: 5,136,899–5,216,074); 5,121,936 when it is the principal's
   first V3 operation (`authority.test`, fresh `principalNonce`). Corrected
   statement: *createDir 5.12–5.22 M on the V2 path, 103–107 fresh slots;
   quote the fresh count with the gas.*
6. **createFile "8,731,665–8,766,869"** is the V1 router path
   (`test/router.test.mjs`; 8,766,857 today). Retained V2 values: 8,559,966 /
   8,560,084 for a single-chunk 41–48-byte body (173/174 fresh slots, 7
   leaves) and 8,587,154 for the `slots.mjs` 10 KiB three-chunk body (176
   fresh; content size only changes the ChunkTree leaf, not the admission).
   `authority.test`'s 8-leaf 10 KiB createFile prints 8,593,035 (§9).
7. **Chunk staging "3,014,913 gas for one 4 KiB chunk, 131 fresh slots, 96%
   SSTORE"** — MEASURED and retained (`run4/stage-10k-c0`, reproduced
   exactly: 131 FRESH + 1 WARM_REWRITE over 131 slots; SSTORE 2,891,000 =
   95.9% of the receipt; intrinsic 90,292 of which 68,304 is the 4,269
   nonzero calldata bytes). The second full chunk of the same tree costs
   2,975,536 (the `ChunkStatus` row already exists), the 2,048-byte tail
   1,521,976. A 41-byte single chunk is 149,369 with 5 fresh slots.
8. **Smaller claims, now MEASURED:** router `typeIds`/`purposes` cold SLOADs
   "~35,700" → 17 slots, 35,800 (tag). `s.init` guard-read + rewrite
   "~33,000/op ESTIMATED" → 30,600 SLOAD + 1,300 SSTORE = 31,900. `batches`
   "~66,000/op ESTIMATED" → 60,000 SSTORE + 6,600 SLOAD = 66,600. "778 reads
   over 278 distinct slots" → 288 distinct (address-qualified). "91% of the
   plumbing sits below the Core entry point in one UpgradeAdmissionLibrary
   frame" → that frame is 80.6% of a steady tag's execution gas (2,230,278 /
   2,767,920) and 81.6% of the first-ever tag's (2,455,235 / 3,009,977),
   consistent.
9. **§4 ablation (2,257,306 / 4,172,658)** was not re-measured; its savings
   are quoted against the unverified 2,838,264 and against a createDir whose
   position is unknown. Re-run the ablation under this harness and report
   the FRESH-slot delta, not only the gas delta, before quoting a ratio.
10. **"Content addressing is free. 576 hashes, 0.9%"** — MEASURED and
    confirmed: KECCAK256 is 0.8–0.9% of execution in every operation here.
11. **§1's "SSTORE is 46.8% of a tag, 47.1% of a directory create, 46.8% of a
    file create" were not all measured.** Only the tag figure is measured
    opcode gas (1,427,300 / 3,046,997, first-ever). The 47.1% and 46.8% for
    createDir and createFile are `slots.mjs`'s schedule arithmetic — `fresh ×
    22,100 + updated × 5,000` over the receipt (run4 `createDir-slotsdir`:
    105 × 22,100 + 23 × 5,000 = 2,435,500 / 5,172,452 = 47.1%; `createFile-10k`:
    176 × 22,100 + 25 × 5,000 = 4,014,600 / 8,587,154 = 46.8%) — i.e.
    ESTIMATED, in the very paragraph that retracted "98.5%" for being
    arithmetic. MEASURED SSTORE shares of the receipt: createDir 43.1%,
    createFile 42.9% (42.6–43.4% across all runs); tag 46.8% first-ever,
    43.2% steady.

## 8. Replays of the earlier scratchpad orders at `e6de414` (MEASURED)

The two scratchpad scripts whose numbers the earlier report quotes were
replayed as named sequences (`--sequence lead-marginal`, `--sequence
lead-slots`) with full capture. Every transaction reconciles with residual 0,
0 model mismatches, 0 unattributed writes.

| run / tx | receipt | SSTORE | SLOAD | FRESH / COLD_REWRITE | distinct slots | earlier report figure |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| run3 `tag-lbl0` (marginal.mjs tag#0, first ever) | 3,046,565 | 1,427,300 | 653,800 | 68 / 10 | 94 | "first tag 3,046,565" — **reproduced** |
| run3 `tag-lbl1` (tag#1, 2nd label) | 2,804,520 | 1,210,500 | 645,000 | 56 / 18 | 90 | — |
| run3 `tag-lbl2` (tag#2, 3rd label) | **2,838,264** | 1,244,700 | 645,000 | 58 / 16 | 90 | "steady-state tag = 2,838,264" — **reproduced exactly** |
| run3 `createDir-m1` | 5,117,380 | 2,191,300 | 966,400 | 103 / 23 | 142 | — |
| run3 `createDir-m2` | **5,132,853** | 2,205,600 | 964,200 | 104 / 21 | 141 | "createDir 5,132,853" — **reproduced exactly** |
| run4 `tag-ocean` (slots.mjs tag, first ever) | 3,046,985 | 1,427,300 | 653,800 | 68 / 10 | 94 | — (label/calldata differ from `alpha` by 420) |
| run4 `createDir-slotsdir` | 5,172,452 | 2,231,100 | 970,800 | 105 / 23 | 144 | — |
| run4 `stage-10k-c0` (4,096-byte chunk) | **3,014,913** | 2,891,000 | 8,600 | 131 / 0 | 131 | "3,014,913 per 4 KiB chunk, 131 fresh slots, 96% SSTORE" — **reproduced exactly** (SSTORE 95.9%; intrinsic 90,292 for 4,516 calldata bytes) |
| run4 `stage-10k-c1` (4,096 bytes) | 2,975,536 | 2,851,700 | 8,600 | 129 / 1 | 130 | — (status row already exists) |
| run4 `stage-10k-c2` (2,048 bytes) | 1,521,976 | 1,437,300 | 8,600 | 65 / 1 | 66 | — |
| run4 `createFile-10k` (7 leaves, 10 KiB, 3 chunks) | 8,587,154 | 3,685,900 | 1,472,800 | 176 / 25 | 217 | — |

So the report's headline numbers were: **2,838,264 = the third tag on the
same object in `marginal.mjs`** (58 fresh slots, i.e. two word-boundary
crossings above the second-label value), **5,132,853 = the second createDir
of `marginal.mjs`** (104 fresh), **3,014,913 = chunk 0 of `slots.mjs`**; the
§2 component table = `slots.mjs`/`opcodes.mjs`'s *first-ever* tag
(3,046,565 / 3,046,985 depending on label). The upper ends of the report's
ranges — 3,060,354, 5,148,912, 8,766,869 — are the **V1 router** figures
printed by `test/router.test.mjs` (`FilesRouterV1`, operator-signed; §9
reproduces them within 12 gas of calldata). The ranges therefore mixed two
routers, two principals' first-op states and two positions in the
word-boundary cycle.

The 912-gas gap between `tag-lbl2` (2,838,264) and `tag-steady-2`
(`gamma`, 2,839,176) is label-dependent interpreter work inside
UpgradeAdmissionLibrary (−24 JUMPI, −34 PUSH2, −10 JUMP, −16 ADD, −14 MLOAD
…; identical SSTORE/SLOAD/KECCAK and identical slot classes, identical
calldata byte split). The label reaches the kernel only through the 32-byte
`tagId` and the `FileTagAssertion` body, so this is a value-dependent branch
count, not a storage effect; it bounds the precision of any single "steady
state" number at about ±1,000 gas on top of the ±17,100-per-boundary effect.

## 9. Regression check

Nothing outside `scripts/measure/`, this document and `evidence/gas-2026-09-10/`
was changed. After the captures, at `e6de414`:

```
node --test --test-concurrency=1 test/router.test.mjs test/authority.test.mjs
ℹ tests 2 / suites 0 / pass 2 / fail 0 / cancelled 0 / skipped 0 / todo 0 / duration_ms 10625.869166
```

The suites print their own gas (MEASURED, not retained as traces — receipts
only, from the suite output):
`authority gas: { createDir: '5121936', createBig: '8593035' }` — createDir as
A's first V3 operation (fresh `principalNonce`, 5,121,936) and the 8-leaf
10 KiB createFile; `routed gas` (V1 router, `test/router.test.mjs`):
createDir 5,148,924, createFile 8,766,857, edit 4,192,802, rename 5,411,491,
moveDir 5,450,256, copy 7,631,489, placement 3,168,346, remove 5,114,032,
restore 4,383,096, tag 3,060,342 — within 24 gas of the report's
"5,148,912 / 8,766,869 / 3,060,354". V1-router suite receipts vary by
±12–24 gas per run (signature and deadline bytes); the independent
verification run printed createDir 5,148,912 and createFile 8,766,845.

Independent verification (2026-09-10, second agent, retained under the
lead's scratchpad `gas-verify/run9`): every retained transaction re-summed to
its receipt with residual 0; slot classes re-derived from `analysis.json`
match every table; `tag-first-ever` 3,046,565 and `stageChunk-1` 149,369
reproduced exactly from the README commands; `tag-steady-1` reproduced to
2,804,508 (12 gas of calldata) with byte-identical execution categories;
kernel sources unchanged. Its corrections are applied above.

## 10. Not done, and why

* No kernel instrumentation was needed: attribution by preimage derivation
  covered 100% of written slots. A journal-emitting wrapper would only be
  needed if a future layout stopped mirroring keys into ordinal indexes.
* The §4 ablation of the earlier report was not re-run (it requires a
  modified kernel; out of scope for a baseline).
* EIP-7623 is reported (floor 59,970 for a tag) but cannot be applied on a
  Cancun node; the extrapolation in §5 uses the PM's multipliers only.
* The `contracts/out` and `contracts/cache` files under
  `Reviews/2026-09-09-files-browser-mvp` are tracked and are rewritten by
  every `forge build` (`compileRouter` in the tests and in this harness);
  the differences are AST ids and source-map indices, not bytecode. They were
  restored to `HEAD` after the runs so the working tree carries only the
  intended changes.

## 11. Artifacts

`evidence/gas-2026-09-10/index.json` lists every retained file (235) with
its sha256 and the command that produced it. `evidence/gas-2026-09-10/tables.md`
is the generated full table set (every run, every transaction). The harness
and its README are under `scripts/measure/`.

**What is committed (lead's decision, 2026-09-10):** every per-transaction
`receipt.json`, `tx.json`, `prestate-diff.json`, `calltree.json`,
`storage-ops.json` and `analysis.json`, the per-run environment/key files,
`tables.md` and `index.json` — ≈15 MB, carrying every number in this
document and both independent cross-checks. The 31 gzipped full
`debug_traceTransaction` responses (`trace.json.gz`, ≈108 MB) are **not**
committed (`.gitignore` in the evidence directory); their sha256 digests are
in `index.json`, and the README's commands regenerate them deterministically
(execution gas byte-identical; calldata ±12–24).
