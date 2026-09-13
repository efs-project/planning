# Road C first receipt-backed costs — September 13

**Standing:** completed disposable local-chain diagnostic, not an architecture selection, full Files implementation or authenticated state proof. The measurement consumer is candidate-coupled. Do not interpret its cost difference from B as a price for MUD or portability: the body framing, setup, acceptance and consumer checks are not yet identical.

## Reproduction and retained evidence

- Runner pin: `c825c619f72dfad3acd6f1f0584cf8d1845fa539`; Core/test baseline `774dfcdf82b1d85cd9b0a74c54549d58107bc76a`; measurement consumer/tests `89d3d66cc98967dffa54731c9e3f4d4582363bd4`. Runner corrections `0b16f0c`, `ad427da`, `c825c61` do not change Core or vendor source.
- Packet: [measurement-20260913T050920Z.json](evidence/measurement-20260913T050920Z.json), 4,264,618 bytes, SHA-256 `d62866ae15734861ad67a0291e32865f71d8841569864387e6084656c0b02600`.
- Actual run: **05:09:20.278–05:09:22.041 UTC**, runner PID 7582, exit 0, `partialStage=complete`. Eight deployment receipts and 22 operation receipts, including the one expected status-0 retry. Four explicit resets return to post-setup high-water 7 and pending wallet nonce 10. No failing row is omitted from cost totals.
- Forge 1.7.1, native solc 0.8.30+73712a01 (SHA-256 `738dcdc6afddeb505ee4e4ef24f1c1fdba2b8c924e614cbbf5801a5b062dd683`), Cancun, optimizer 200, via-IR, metadata disabled. MUD Store 2.2.23 vendor pin `062bd8de4b8fa0f0ba609ec241b8aa9be5393499`.
- Fresh local Anvil: chain 31337, loopback port 18457, **30,000,000 block gas**, normal EIP-170/EIP-3860 limits, four accounts, two threads, prune-history 256. No fork, trace, state dump, code injection or raised code-size limit.
- Explicit artifact root is the existing `lab-c/out` symlink to the retained `repair-20260913T0219Z/out-rel` build, with its original matching cache. Node 24.11.0, ethers 6.15.0; provider caching disabled and batch size one. Raw receipts polled with a 30-second deadline; runner/Anvil watchdogs 600/900 seconds.
- Run-owned scratch basename `efs-road-c-measure-retry-20260913.7y8B42` under the system temporary directory. Anvil PID 7546 was explicitly stopped after packet retention. Root's 05:15 UTC process check found no Anvil/Forge/solc process. Successful-run scratch 8.1 MiB, previous failed preflight 2.6 MiB, retained C build 11 MiB; 265 GiB disk free. No user demo or unrelated state was removed.

The earlier same-lease preflight stopped after three deployments because ethers' local `attach` helper shadowed the Solidity method. Root tested `getFunction("attach")`, then restarted on a **new** chain; that preflight's deployments and diagnostic attachment are not mixed into this packet. Its partial packet remains in scratch `efs-road-c-measure-20260913.N82VwY`, stopped Anvil PID 6935. This was a runner failure, not a reverted contract attachment.

## Costs from actual receipts

Deployment gas includes constructors and their deployed children; initcode sizes below include constructor arguments. These are receipts, not Forge whole-test-function gas.

| Deployment | Gas | Runtime bytes | Initcode bytes |
|---|---:|---:|---:|
| ImportLib | 4,345,691 | 19,861 | 19,893 |
| IndexModule | 6,793,577 | 10,303 | 22,822 |
| Ledger | 11,960,128 | 23,145 | 37,924 |
| LensReader | 2,340,528 | 10,585 | 10,907 |
| PassAcceptor | 93,667 | 186 | 210 |
| QuoteAcceptorV1 | 185,034 | 610 | 636 |
| Producer | 647,360 | 2,644 | 2,681 |
| MeasurementConsumer | 1,448,481 | 6,459 | 6,485 |
| **Deployment total** | **27,814,466** | | |

Setup additionally costs **69,974** for index attachment and **3,575,130** for Types/items/Pair. Setup is separate from each reset cell and cannot be ignored when reasoning about deployment amortization.

| Cell | Operation | Gas |
|---|---|---:|
| Typed Pair/Quote | Signed A1 create | 2,400,475 |
| Typed Pair/Quote | Signed A2 edit | 1,112,418 |
| Typed Pair/Quote | Real Producer B1 create | 1,653,816 |
| Typed Pair/Quote | Paid point, A-first / B-first | 144,341 each |
| Typed Pair/Quote | Paid list, A-first / B-first | 238,579 each |
| Typed Pair/Quote | Exact A1 retry, mined status 0 | 63,018 |
| Framed c32, native Producer | Create / edit | 1,790,002 / 950,873 |
| Framed c32, native Producer | Paid point / list | 134,126 / 201,975 |
| Framed c32, signed | Create / edit | 1,807,968 / 970,431 |
| Framed c32, signed | Paid point / list | 134,150 / 201,999 |
| Isolated fresh Record | Matched seed / measured publish | 766,010 / 697,812 |
| Isolated reused Record | Matched seed / measured publish | 766,010 / 489,539 |

All 30 receipts sum to **46,366,032 gas**, across setup and mutually reset diagnostic cells—not one transaction or one contiguous user journey. Of that, operation receipts total 18,551,566. ETH/USD and public-chain DA fees were not estimated in this run.

Fresh/reused cells send the same BODY_HASH action and identical framed body through the same Producer, from separate copies of post-setup state. Same-sized dummy versus target seeding makes Record presence differ: fresh occurrence 0→1 and new first-admission; reused 1→2 with first-admission preserved. Their **208,273 gas** difference is only this particular branch of this implementation, not a universal deduplication saving or feature tax. Supplemental c32 wraps the 32-byte payload in `abi.encode(bytes32[],bytes)` for a 160-byte body; it is not B's bare 32-byte body. Create has four actions; edit has two. The typed joined create is a separate five-action case with a Pair reference.

## What this earns, and what it does not

The local runner completed deployment, typed publication with a checked reference, real contract publication, mandatory indexing, two-author selected paid reads, an exact retry rejection and isolated fresh/reused Record publication under normal EVM limits. Earlier root-reproduced tests were **43/43** (37 original plus six measurement-consumer tests); the runner helpers were **6/6**. A previous scan found all 94 compiled artifacts within normal limits.

The packet retains 1,057 raw JSON-RPC exchanges, 171 observations, 30 receipt/transaction/header triples and actual linked/deployed bytecode. Root cross-joined all 30 triples and recomputed receipt costs. A separate read-only packet reviewer also joined all 1,057 unique RPC IDs, recomputed all eight artifact/initcode/runtime hashes and sizes, constructor/link/immutable values, twelve Published and eight paid Point/List public-ABI contexts, and the identical fresh/reuse measured calldata plus transitions. It found no blocking evidence defect and returned GO for this limited report. Source pins, Anvil flags and process IDs are external run-coordinator evidence in this report and the shared checkpoint, not self-authenticating fields embedded in the JSON.

The exchanges include 280 chain-ID queries, 182 each of block-number and block-by-number calls, 152 `eth_call`s and one expected RPC error. This is instrumentation-heavy loopback traffic, **not** a browser listing benchmark or a recommended SDK request count.

Each value's block/header and raw response are retained; the runner checks decoded publication and consumer commitments. The consumer checks record/Type identity, canonical body framing, exact Pair ID, payload length/hash, selected author, Admission/Evidence context and complete same-basis list coverage. It uses candidate table decoders and caller-provided expectations: it does not independently reconstruct the full Pair closure, signature/domain/profile or source-state witness. Signing also obtains the digest from the candidate Ledger. Neither is the independent oracle.

Cold-readable labels, complete Files lifecycle, browser RPC/latency, populated upgrades, export/import, authenticated source-state proofs and a feature-matched B comparison remain **unmeasured in this packet**. This result removes the “C cannot yet execute” uncertainty; it does not establish that Store is cheaper, more expensive by an inherent amount, or the preferred foundation.
