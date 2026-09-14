# Independent paid-output review: bounded required query

**Review date:** 2026-09-14  
**Disposition:** PASS for the sealed, disposable experiment; the result does **not** reverse the compact-B-first hypothesis. It does not adopt an architecture or authorize implementation.

## Verdict

I independently reconstructed all 82 signed transactions and all 25 paid pages from the raw JSONL journal, without using `result.json` or the cost totals in `root-audit.json` as inputs. The raw transaction bytes recover the sealed senders and reproduce the sealed transaction hashes; every send joins to one successful receipt, mined transaction, and single-transaction block header. All 21 deployed runtimes match the sealed runtime bytes and codehashes. Every page's pre- and post-transaction `eth_call` output exactly matches the sealed ABI bytes, independently decodes to the sealed fields, hashes to the receipt's `PageRead` commitment, chains its cursor, and ends in `COMPLETE` within the precommitted bounds.

The naive B scan is more expensive than C for this query, but the bounded B-selective repair is not. B-selective pays **+300,499 gas deployment** and **+277,069 gas across the eight common write transactions** relative to B-scan, then saves **1,888,171 gas** over the complete old+current page workload. Net all-in, B-selective is **1,310,603 gas cheaper than B-scan**. Against C, B-selective is cheaper on both complete page runs, on the matched common writes, and all-in. The named reversal condition therefore does not fire.

This is a result for one exact retained-Record query profile and small sealed fixture. It is not feature-equivalent universal-MUD evidence, a scale result, or a complete EFS architecture comparison.

## Evidence identity and independent checks

- Sealed input: `/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/inputs.json`
  - independently recomputed SHA-256: `077f59b735d2ddb3fbd9c3d432f306b0f919929b20e9a6d5402459790e96788c`
- Raw journal: `/tmp/efs-required-query-paid2-20260914.QM7xI0/result/transcript.jsonl`
  - independently recomputed SHA-256: `38c13c643d625d2f998172c22428a62839959243c6acfba4fbae55a4354cdcfb`
  - exact size: `5,642,386` bytes
  - `4,510` sequential JSON-RPC records, all HTTP 200, matching JSON-RPC IDs, no RPC error, and exact recorded response byte lengths
  - independently recomputed serialized request bytes `1,807,079` + response-text bytes `3,101,122` = `4,908,201` raw request/response bytes
- Transaction joins: `82/82`; distinct hashes `82/82`; signed transaction hashes, recovered senders, nonce, chain ID, gas limit, gas price, destination, value, and calldata match the seal. Each receipt has status 1 and matches its mined transaction and sole transaction in its block; receipt/header gas matches.
- Deployments: `21/21` observed `eth_getCode` results exactly match the sealed runtime bytes, sizes, and locally recomputed Keccak codehashes.
- Pages: `25/25` exact ABI-output comparisons and independent decodes; `25/25` page Keccak commitments match the sole receipt event; all page cursor chains and terminal states match.
- Launch pins: SHA-256 of `pins.json` is `d35034ccb0e233b9f99594727cbe4384185cfabc6f8a3814d75711b668ec40f7`, matching the launch record. I independently rehashed all `287/287` entries in `pins.files` and all `173/173` entries in `pins.runtimeSourceSha256`; none were missing or changed. Successful pinned heads are B `b94b57c405ef18b7f259cbd636d685ff96738ce7` and C `3f5702f1d7acc39c1d62a5b1a0795f3fe579ebce`. B's successful head is a descendant of the sealed contract-source commit and adds the finite runner/state audit plus the canonical-RPC-quantity `r/s` decoding repair; the measured contract runtimes remain sealed directly.
- Permit: the same input hash, chain `31337`, Cancun, 30,000,000 block gas limit, genesis timestamp `1800000000`, and fixed legacy gas price `2,000,000,000` wei. Launch `08:25:13.846Z` through `08:25:42.837Z` was inside the permit window `08:24:00Z` through `08:54:00Z`.

## Exact reconstructed cost partitions

All wei charges below are `gasUsed * receipt.effectiveGasPrice`; every receipt's effective gas price was the sealed local `2 gwei`. Signed/calldata/page byte totals are independently counted from the sealed raw transaction or observed exact page output. Logical reads are decoded page counters, not EVM call counts.

| Arm | Partition | Txs | Gas | Wei | Signed bytes | Calldata bytes | Page bytes | Header/body reads |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| B scan | Deployment | 7 | 8,434,366 | 16,868,732,000,000,000 | 41,930 | 41,321 | 0 | 0 / 0 |
| B scan | Setup | 5 | 715,591 | 1,431,182,000,000,000 | 1,219 | 692 | 0 | 0 / 0 |
| B scan | Type publication | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 |
| B scan | Eight common writes | 8 | 7,793,360 | 15,586,720,000,000,000 | 15,927 | 15,072 | 0 | 0 / 0 |
| B scan | Old-basis pages | 7 | 1,105,688 | 2,211,376,000,000,000 | 4,361 | 3,612 | 4,576 | 12 / 12 |
| B scan | Current-basis pages | 8 | 1,299,715 | 2,599,430,000,000,000 | 4,984 | 4,128 | 5,248 | 15 / 15 |
| B selective | Deployment | 7 | 8,734,865 | 17,469,730,000,000,000 | 44,484 | 43,875 | 0 | 0 / 0 |
| B selective | Setup | 5 | 715,591 | 1,431,182,000,000,000 | 1,219 | 692 | 0 | 0 / 0 |
| B selective | Type publication | 0 | 0 | 0 | 0 | 0 | 0 | 0 / 0 |
| B selective | Eight common writes | 8 | 8,070,429 | 16,140,858,000,000,000 | 15,928 | 15,072 | 0 | 0 / 0 |
| B selective | Old-basis pages | 2 | 253,969 | 507,938,000,000,000 | 1,246 | 1,032 | 1,376 | 3 / 0 |
| B selective | Current-basis pages | 2 | 263,263 | 526,526,000,000,000 | 1,246 | 1,032 | 1,408 | 4 / 0 |
| C | Deployment | 7 | 25,714,831 | 51,429,662,000,000,000 | 95,517 | 94,909 | 0 | 0 / 0 |
| C | Setup | 1 | 69,974 | 139,948,000,000,000 | 140 | 36 | 0 | 0 / 0 |
| C | Separate Type publication | 1 | 2,476,850 | 4,953,700,000,000,000 | 2,703 | 2,596 | 0 | 0 / 0 |
| C | Eight common writes | 8 | 13,794,689 | 27,589,378,000,000,000 | 18,232 | 17,376 | 0 | 0 / 0 |
| C | Old-basis pages | 3 | 411,269 | 822,538,000,000,000 | 1,869 | 1,548 | 2,016 | 5 / 0 |
| C | Current-basis pages | 3 | 411,924 | 823,848,000,000,000 | 1,869 | 1,548 | 2,048 | 5 / 0 |

Aggregate totals:

| Arm | Page total | Common writes + pages | All-in gas | All-in wei | Txs | Signed / calldata / page bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| B scan | 2,405,403 | 10,198,763 | 19,348,720 | 38,697,440,000,000,000 | 35 | 68,421 / 64,825 / 9,824 |
| B selective | 517,232 | 8,587,661 | 18,038,117 | 36,076,234,000,000,000 | 24 | 64,123 / 61,703 / 2,784 |
| C | 823,193 | 14,617,882 | 42,879,537 | 85,759,074,000,000,000 | 23 | 120,330 / 118,013 / 4,064 |

The `common writes + pages` column intentionally excludes deployment, ordinary setup, and C's separate Type publication so the recurring matched fixture is visible. Including the C Type publication makes its non-deployment application total `17,094,732` gas. All-in includes every sealed transaction.

Key deltas:

- B-selective versus B-scan: deployment `+300,499`; common-write/index maintenance `+277,069`; pages `-1,888,171`; all-in `-1,310,603` gas (`6.77%` lower).
- B-selective versus C: old COMPLETE query `-157,300`; current COMPLETE query `-148,661`; combined pages `-305,961` gas (`37.17%` lower than C).
- B-selective versus C: matched eight writes plus pages `-6,030,221` gas (`41.25%` lower); all-in `-24,841,420` gas (`57.93%` lower).
- B-scan alone loses the query comparison to C: old `+694,419`, current `+887,791`, combined `+1,582,210` gas. The selective repair, not the scan, is what keeps B first.

## COMPLETE outputs and historical bounds

The page ABI status values are `PARTIAL=1` and `COMPLETE=2`. Every nonterminal page decoded as PARTIAL; every last page decoded as COMPLETE, retained the full cursor identity/domain commitments, and set `next.position` to current `rawTotal`. No page exceeded budget 2, no run exceeded 8 pages or 16 scanned candidates, and no output contained a duplicate.

| Arm / basis | Admission basis | Current raw postings | Pages | Scanned | Header/body reads | Returned semantic records | Returned ABI bytes | Gas | Terminal position/status |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- |
| B scan / old | 21 | 15 | 7 | 13 | 12 / 12 | A1, A2, B1 | 4,576 | 1,105,688 | 15 / COMPLETE |
| B scan / current | 24 | 15 | 8 | 15 | 15 / 15 | A1, A2, B1, A3 | 5,248 | 1,299,715 | 15 / COMPLETE |
| B selective / old | 21 | 4 | 2 | 4 | 3 / 0 | A1, A2, B1 | 1,376 | 253,969 | 4 / COMPLETE |
| B selective / current | 24 | 4 | 2 | 4 | 4 / 0 | A1, A2, B1, A3 | 1,408 | 263,263 | 4 / COMPLETE |
| C / old | 25 | 5 | 3 | 5 | 5 / 0 | A1, A2, B1 | 2,016 | 411,269 | 5 / COMPLETE |
| C / current | 28 | 5 | 3 | 5 | 5 / 0 | A1, A2, B1, A3 | 2,048 | 411,924 | 5 / COMPLETE |

The B and C Record IDs differ because the architectures derive IDs differently, but each decodes to the same sealed semantic names and expected sets: old `{A1,A2,B1}`; current adds `{A3}`.

Historical-bound details matter:

- B scan's current posting sequence is the 15 ordinals `6,7,9,10,12,13,14,16,17,18,19,20,22,23,24`. At old basis 21 it charges the 13th candidate (A3 at ordinal 22) as the future sentinel, so `scanned=13` but only `12` header/body reads. Same-body reuse admissions remain in the broad list and are charged, but the first-admission check prevents duplicate output.
- B-selective's current sequence is only fresh target-qualified Quote ordinals `7,10,14,22`. At old basis 21, ordinal 22 is the fourth charged future sentinel; hence four scans, three header reads, and three results. Reuse does not create a posting.
- C's current target backlink sequence is `A1,A2,B1,R1,A3` at first admissions `11,14,18,25,26`. At old basis 25, R1 is charged and filtered by its non-Quote source Type, then A3 is charged as the future sentinel; at current basis 28, R1 is still filtered and A3 is returned.
- These are old-basis reads executed against current append-only state, not historical-block `eth_call`s. COMPLETE relies on the pinned coverage and append-order rules of each exact reader/index profile.

## Interpretation against the reversal challenge

The experiment's falsifier said to reconsider B primacy if C produced the required complete result at lower complete workload cost, or if the scoped B repair could not meet the fixed completion bound. Neither happened:

1. B-selective returned the exact old and current result sets and reached COMPLETE in `2/2` pages, versus C's `3/3`.
2. Its complete old and current paid queries are each cheaper than C's.
3. Its extra deployment and eight-write maintenance relative to B-scan are fully charged; the page savings more than repay both within this sealed run.
4. C's eight common writes cost `5,724,260` gas more than B-selective before query pages, and C additionally requires a `2,476,850`-gas Type publication in this fresh graph.

Therefore the bounded selective-index challenge strengthens, rather than reverses, the provisional choice to keep compact B as the next engineering hypothesis. It earns only this bounded economic/semantic result.

## Source/schema limitations and real remaining gaps

- Query domain is narrow: retained unique Record IDs for exact `Quote -> Pair` reference ordinal 0. It does not query authored occurrences, current nonzero occurrences, named roles, arbitrary/multiple/nested references, binding backlinks, current HEAD/Lens selection, or graph closure.
- B-selective is an explicitly configured positional profile whose constructor/call checks pin the exact Ledger, index, runtimes, Quote Type, sole Pair reference, and mandatory Quote rule. Its target list establishes membership without body hydration only inside that profile. This does not demonstrate a universal declared-index mechanism or arbitrary corrupt-index recovery.
- B-selective retains fresh Record postings and has no withdraw release for this new family. Its `live` word is not current validity. Existing binding-target live-count maintenance remained charged, but that is a distinct family and semantic.
- B-scan proves exact 160-byte Quote bodies and reads them; B-selective does not. C also performs no body reads: it qualifies a source through static Type metadata, current mandatory acceptor codehash, exactly one Pair ref Type, and the pinned fresh Backlinks behavior. C deliberately accepts valid trailing/noncanonical outer framing and filters R1 by source Type. These are schema-specific equivalences, not general feature parity.
- C has no withdrawal action in this prototype. The separate B zero-occurrence auxiliary is correctly outside the paid total and C remains `UNSUPPORTED`; this run does not establish withdrawal parity.
- A logical C header read uses two external static-field calls, while a B header read uses one admission call. Logical read counts are descriptive only; receipt gas is the comparable paid measure.
- A transaction receipt does not carry EVM return bytes. The mined page evidence is the consumer's on-chain Keccak event, matched to exact pre/post block-tagged call output. There is no internal call trace, so internal call counts and fine-grained gas attribution remain unmeasured.
- Evidence grade is **RPC_OBSERVED_NOT_AUTHENTICATED_STATE_PROOF**: signed raw transactions and internally consistent local receipts/headers/state calls are strong disposable execution evidence, but the sole local Anvil RPC is not an independently authenticated state or receipt proof. This says nothing about public-network pricing, cross-client behavior, adversarial RPCs, block fit under realistic contention, or scale beyond the fixed `15/4/5` candidate fixture.
- The gas price, transaction type, gas limits, chain, compiler/runtime pins, and fixture are experimental settings, not product affordability thresholds, fee forecasts, or protocol maxima.
- This review did not rerun tests, a compiler, a chain, or the existing audit program. It independently rederived the transaction joins, costs, runtime equality, page ABI/results/commitments, bounds, pins, and cleanup from retained bytes. The journal's thousands of additional state-checkpoint calls remain useful RPC-observed corroboration, not authenticated proof.

## Cleanup and failed-attempt exclusion

The successful launch record identifies Anvil PID `78727`, runner PID `78728`, and port `60014`; the failed attempt identifies PIDs `75600`/`75601` and port `59850`. Both launch records say owned processes stopped. A fresh process and listening-port check found none of those four PIDs and no listener on either port. Retained scratch evidence remains on disk by design.

The first attempt at `/tmp/efs-required-query-paid-20260914.wdaBsu` is excluded from every total above. It stopped with runner exit 1 after six submitted/setup transactions and 38 retained RPC replies because the audit treated canonical quantity-shaped mined `r/s` values as fixed even-length byte strings. It is a separate Anvil chain and has no page or successful-workload result. The successful run uses the repaired audit representation and a fresh journal; combining the failed receipts with it would double-count setup and violate the sealed 82-transaction workload.

## Authority boundary

This report is an independent result review only. It supports retaining B-first as a provisional engineering hypothesis for the root-owned checkpoint. It does not publish the result into planning, select an architecture, waive unresolved portability/feature gates, or authorize production/repository implementation.
