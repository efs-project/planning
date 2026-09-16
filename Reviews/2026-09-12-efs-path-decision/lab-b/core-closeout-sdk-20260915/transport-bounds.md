# Task 2 transport bounds, fixed before measurement

Experiment defaults selected 2026-09-15 before the matched runs. These are not
protocol or adopted product limits. Base `f2d7b01241ad39a0421ccc456d9112bd9fc7a849`.

| Resource | Bound | Rationale |
| --- | --- | --- |
| Successful raw-read LRU | 512 entries; 8 MiB UTF-8 serialized full key plus raw value | Holds the 256-head fixture plus profile reads; body/runtime bytes count, not only entry count. Oversized successes bypass storage. |
| Raw reads in flight | 64, no additional SDK queue | Greater than the16-wide independent groups; overloaded calls fail explicitly. |
| Verified context LRU | 8 entries; 128 KiB serialized context plus hash | Exact-block evidence only, independent from caller-owned capability lifetime. No incomplete context is installed. |
| Independent group width | 16 | Chunk64-principal inputs without allocating256 pending RPCs. Position-major then principal-major order is preserved. |
| HTTP batch | 16 items; 256 KiB total serialized request | Plenty for ordinary reads and256-head chunks; large single requests fail explicitly. |
| HTTP response | 4 MiB per POST, streaming cap | Bounded envelope/body memory; too-large responses fail, never become empty/partial successful contexts. |
| HTTP concurrency / admitted pending calls | 4 / 64 | Includes queued and running calls. Bounded contention, no unbounded semaphore queue. |
| Total request time | 20,000 ms including queue and unsupported-batch fallback | Bounds provider stalls, no silent infinite retries. |
| Request metadata | 2,048 aggregate method/target/selector/block-hash/phase keys;64 phases | Counts only; overflow is explicit. No calldata, private bodies, signatures, endpoint strings, or results. |

Request parameters are unchanged; `requireCanonical:true` is retained. Only the
explicit raw-read transport seam batches calls. Signed preflight, sends, receipt
observations and journals do not use this seam. Explicit unsupported-batch
responses may retry only the same pinned read requests with the same IDs.

All four modes share independent grouping. Comparisons isolate exact-hash reuse
and HTTP batching, **not** historical serial versus parallel latency. The
1x1/8x4/64x4 workload uses the existing guarded protocol factory through the
existing engine injection seam. Public Files operations generate at most two
watched positions; the four-position control is lower-level authorization and
preflight evidence, not a new Files option or a whole-publication promise.
