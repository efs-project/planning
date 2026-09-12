# Bounded current/checked Record acquisition

**Status:** disposable FullC0 prototype evidence, not a protocol/API freeze or directory integration.

Source frozen at `945ed6b462dbb2d44e10b86e657496ea2588106e`, clean at measurement. [Full source/runtime/manifest pins, requests, results, actual transactions, calldata and receipts](checked-record-batch.json) were generated once by the exclusive [runner](../scripts/checked-record-batch-benchmark.mjs). No earlier runner or evidence was overwritten.

## Outcome

Eight distinct three-byte Records cost **453,212 → 283,890 gas** in a real consumer transaction. The scalar control reads all eight within the same transaction, so normal warm account/storage access is already present. An external multicall of the scalar APIs costs474,361 gas including its consumer. The batch saves repeated qualification/dispatch; it does not eliminate Record validation.

One Record is more expensive through the batch. Eight maximum-size Records save only62,831 gas (about1.1%). RPC reduction is not a universal latency or byte reduction: the local maximum-body SDK sample took9.60ms scalar versus15.49ms checked, and batch responses carry IDs and context. Existing scalar caching already reduces eight duplicate-ID calls to one real request.

All eight8192-byte Records were **legally admitted**, one per real transaction, using a custom BYTES(max8190) type with a two-byte length prefix. No storage injection was needed in the benchmark. Test-only storage corruption remains confined to Solidity falsifiers. These are custom Records, not a Files application-assessment claim.

## Actual consumer receipt gas

Each arm hashes identical aligned Record tuples. The current consumer makes no context/preflight call; scalar and external-multicall controls call the existing scalar API. Setup is excluded. Values/basis were independently read at canonical block-hash pins, compared exactly, and Record IDs recomputed by the independent reference reader.

| Workload | IDs | Scalar consumer | External multicall consumer | Current batch consumer |
|---|---:|---:|---:|---:|
| Distinct short |1|176,045|183,001|180,783|
| Distinct short |2|215,635|224,609|195,499|
| Distinct short |4|294,823|307,841|224,947|
| Distinct short |8|453,212|474,361|283,890|
| Duplicate short |1|176,045|183,001|180,783|
| Duplicate short |2|209,635|218,609|189,499|
| Duplicate short |4|276,823|289,841|206,947|
| Duplicate short |8|411,224|432,373|241,902|
| Missing |1|169,775|176,713|176,513|
| Missing |2|207,096|216,032|188,959|
| Missing |4|281,743|294,681|213,863|
| Missing |8|431,043|452,023|263,700|
| Maximum legal8192B |1|830,208|843,295|835,114|
| Maximum legal8192B |2|1,526,386|1,550,620|1,510,341|
| Maximum legal8192B |4|2,926,019|2,981,553|2,879,347|
| Maximum legal8192B |8|5,754,391|5,908,563|5,691,560|

79 retained transactions:29 setup,48 successful read-consumer transactions, and2 intended count failures. Maximum receipt across setup and consumption:9,020,440 gas. Zero/nine-ID failures consume31,128/35,879 gas respectively, both with exact `ErrRecordBatchSize` revert data. Transaction gas remains bounded at16,777,216. The existing foundation runner retains its unchanged33,554,432 block ceiling; no ceiling was raised for this experiment.

## RPC acquisition, estimates and timing

The JSON retains raw scalar requests, test-only external multicall, current and checked calls at1/2/4/8 IDs. Gas estimates are separate from consumer receipts. For eight distinct short IDs, raw current/checked estimates are272,053/273,593; external multicall447,946. Adding eight independent scalar estimates gives1,373,788, but that sum includes independent cold transactions and **is not** the same-transaction saving claim above.

Every SDK arm separately opens, acquires and seals at the same requested canonical block. Qualification remains36 requests and seal4; only the explicit Record acquisition changes. Existing manifest/runtime validation, EIP-1898 pins and final reorg/source checks remain.

| Eight-ID SDK acquisition | Scalar data requests | Checked data requests | Scalar data ms | Checked data ms | Scalar / checked JSON-result bytes |
|---|---:|---:|---:|---:|---:|
| Distinct short |8|1|1.30|1.00|2,592 /3,972|
| Duplicate short |1 (7 cache hits)|1|0.46|0.98|324 /3,972|
| Missing |8|1|1.95|0.91|2,080 /3,460|
| Maximum legal |8|1|9.60|15.49|133,152 /134,532|

These are single local samples per workload/size, not latency distributions or public-network predictions. Qualification/data/seal phase timings and exact accounting remain in JSON. Raw scalar RPC deliberately repeats duplicates, while the SDK scalar arm retains its real cache; the two are labeled separately.

Maximum batch:65,536 body bytes,67,264 ABI bytes,134,532 serialized JSON-result bytes or134,566 bytes including the complete short-ID JSON-RPC envelope. Both forms fit the existing262,144 response limit. This was checked against actual maximum-size results, not inferred from payload bytes.

## API and failure boundaries

`getRecordsCurrent(ids)` and `getRecordsChecked(expected, ids)` return the same `(ReadBasis, RecordResult[])` ABI. Basis is executionSetId/revision/blockNumber/admissionHigh; each result echoes recordId plus the unchanged scalar tuple. Count1–8 is checked before result allocation, including duplicates. `_readBasis()` runs once; both existing linked-code checks and execution validation remain. Checked compares all four fields before body reads/allocation. Block number is checked before uint64 narrowing. The point library defensively bounds its own loop and calls unchanged `StatePointReads.getRecord`.

`scope.getRecords(ids)` explicitly sends checked calldata with the already-qualified basis. Success couples `{basis, records, evidenceId}` with zero-based item `evidenceIndex`; one real request supplies one evidence ID. Exact ABI round-trip, basis, count and ordered echoed IDs must all pass before any row is released. UNAVAILABLE never contains partial records. Callers still independently assess body/ID/application semantics and must seal before publishing a completed observation.

Every explicit batch is a **fresh acquisition** and spends real request/byte budget, including repeated identical calls. This prevents the generic ABI cache retaining a semantically invalid response after source recovery; there is no automatic resend or fallback. Source/epoch changes, abort, budget exhaustion and final-seal failures retain existing terminal rules. Scalar behavior/signature/cache are unchanged. A later Files-level assessed-item cache is a separate consumer concern.

The experimental selector is not silently added to the baseline manifest inventory or inferred from reverts. An older qualified deployment can return UNAVAILABLE. No constructor parameters, Store slots, linked-library roles, manifest schema, write representation, Lens/history behavior, Files automatic adoption or directory RPC-reduction claim was added.

## Verification, identities and cleanup

- C0 Solidity206/206 and upgrade Solidity29/29. The15 unchanged baseline-only journal tests remain explicitly excluded by the pre-existing direct-apply configuration; they are not counted as passed.
- C0 Node66/66. Complete initial upgrade+reader run93/96 exposed three stale test assumptions; all55 upgrade tests passed. After narrowly correcting the stale tests, complete final reader42/42 passed, including the added retry case. Focused batch16/16 and strict TypeScript narrowing passed; formatter checks and ordinary builds passed.
- Intended RED was captured before contract/SDK implementation. New contract tests cover order/duplicates/missing tuples, count0/9, all wrong basis fields, both read-library code changes, malformed eighth row,8193-byte refusal, maximum serialization, block overflow and zero writes. SDK fault tests cover wrong basis/count/order, noncanonical replies, transport byte limits, cancellation, source replacement, reorg and bad-response recovery.
- Stale test maintenance is separate from feature claims: baseline private codec already had25 fragments/five carrier methods while its test expected22/two. Candidate has26. U1/U2 keep two carrier views; fresh isolated U3 artifacts supply the three chunk additions. Historical four-wide scheduling tests now explicitly request4 in both arms; production default16 is unchanged. All original fairness/cancellation/evidence comparisons remain.
- Solidity0.8.30, optimizer200, via-IR, Cancun. Genuine fresh linked deployment/runtime/configuration/execution identities were regenerated by the existing builder. Runtime/full initcode including constructor arguments: Point13,245/13,275; read Core21,544/22,487; read U222,171/23,114. All below ordinary EIP-170/EIP-3860 limits. Full compiler and source hashes are retained.
- Benchmark PID31568 exited0; its unique cache and isolated build were removed after confirmed exit. Existing native/Fable worlds remained untouched. Regression tests'40 generated tracked router artifacts were restored individually to the clean base and12 newly generated JSON artifacts removed after exits. No source file or old evidence was removed; generated files can be rebuilt. Free disk remained above282GiB versus the20GiB stop threshold.

Run from the vault root with the output absent:

```sh
node Reviews/2026-09-11-efs21-pragmatic/scripts/checked-record-batch-benchmark.mjs
```

The runner refuses to overwrite retained evidence. Fresh independent controller review still precedes publication or further integration.
