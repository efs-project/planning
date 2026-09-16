# Exact-basis SDK reuse and bounded transport

**Standing:** local prototype evidence, 2026-09-16, not production SDK or protocol adoption.
Reviewed starting point `f2d7b01241ad39a0421ccc456d9112bd9fc7a849`;
review-amended measured source `63cb36bc5dca7cc3b4ff7b4f634af1642109697e`.

The matched controls preserve byte-identical signed calldata and identical
receipt gas across all four modes. Cache reuse reduces repeated logical RPC
work; JSON-RPC batching reduces HTTP envelopes without changing `msg.sender` or
logical EVM work. Every current public operation still acquires fresh headers
and chain identity, and every cache-backed public read independently qualifies
its block-number-to-hash mapping before publishing its result.

Batching is enabled only by the injected Node fixture transport's
`transportOptions:{batch:true}` in batch-only/combined modes. Default environment
transport remains unbatched. A browser host supplying only ordinary `rpc`
continues individual calls through the fallback seam; the untouched running
owner demo does **not** automatically acquire batched HTTP from these results.
The exact-hash cache itself is browser-compatible and enabled by default.

## Retained evidence and limits

- [Pre-measurement bounds](transport-bounds.md): raw LRU512 entries/8 MiB; raw
  in-flight64; verified-context LRU8/128 KiB; independent chunks16; batches16;
  request256 KiB/response4 MiB; HTTP concurrency4/pending64; total deadline20s.
  Bytes account UTF-8 serialized key/value payload, not total JavaScript heap.
- [Machine-readable bundle](transport-measurements.json.gz): eight independent
  fixtures, exact runner/source/artifact/deployment pins, full per-operation
  calls/HTTP/bytes/latency/cache work, phase tables and aggregated
  method/target/selector/block-hash counts. No diagnostic bodies/signatures or
  provider secrets; zero diagnostic-key drops in all eight fixtures.
- [Measurement transcript](measurement-run.log).
- [Covering test transcript](verification.tap); [first covering failure](verification-initial.tap)
  is retained rather than concealed. See the fix explanation below.
- Review fix1: [mutation RED](fix1-red.tap), [transport GREEN](fix1-transport-green.tap),
  [narrow9-test covering GREEN](fix1-verification.tap), and the
  [failed initial refresh](fix1-measurement-failed.log) are retained.

Both profiles create a41-byte revision under `transport.txt` with salt
`id(transport-matched-primary)`, Alice/Bob ordered Lens, fixed signed deadline
`2000000000`, then edit to41 changed bytes. The richer profile uses a real typed
Directory and SHA-256 descriptor-backed inline carrier. It is not just an
inline-only write on carrier-capable contracts. Each mode deploys a fresh local
fixture and uses a fresh SDK instance. Source/artifact matching verifies
Solc0.8.30, Cancun, viaIR and optimizer200; deployed runtimes are checked against
artifacts including immutable patches. History256/cache512, normal15M and
hard16,777,216 transaction caps, runtime24,576/initcode49,152 remain unchanged.

## Matched logical RPC / HTTP requests

Each cell is `logical calls / HTTP requests`. The four modes share bounded
independent grouping: this is **not** a historical serial-latency comparison.

| Profile / operation | Uncached | Cache only | Batch only | Combined |
| --- | ---: | ---: | ---: | ---: |
| Inline first cold create lifecycle |286/286|164/164|286/128|164/87|
| Inline first same-block read |69/69|8/8|69/27|8/7|
| Inline repeated same-block read |69/69|5/5|69/27|5/5|
| Inline edit/new-block lifecycle |279/279|96/96|280/122|96/58|
| Inline post-write read |70/70|10/10|70/28|10/9|
| Inline cold-instance new-block read |70/70|66/66|70/28|66/27|
| Directory/carrier first cold create lifecycle |431/431|241/241|431/153|241/104|
| Directory/carrier first same-block read |122/122|10/10|122/46|10/9|
| Directory/carrier repeated same-block read |122/122|7/7|122/46|7/7|
| Directory/carrier edit/new-block lifecycle |424/424|136/136|424/146|136/68|
| Directory/carrier post-write read |124/124|12/12|124/48|12/11|
| Directory/carrier cold-instance new-block read |124/124|106/106|124/48|106/37|

The first same-block and post-write reads can be warmed by preceding
reconciliation. The separately labelled cold-instance rows cannot. The carrier
read recipe also opens/verifies content, accounting for its additional public
canonicality boundaries. No zero-network current-read claim is made.

All totals above are actual, not normalized. The amended packet records every
operation's method counts before comparison. Its one observed matched-mode
variance is inline edit: uncached has two `eth_getTransactionReceipt` calls,
batch-only has three (279 versus280 total calls). All non-receipt method counts
are strictly equal across matched modes. Only observed receipt polling may be
excluded from fixed-work equality, never from the reported traffic totals.

## Cold create bytes and observed latency

Byte counts are actual JSON payload bytes, excluding HTTP headers. Latency is
one loopback observation per fixture, not a WAN benchmark or statistical SLA.
All remaining operation and read-set byte/latency rows are in the bundle.

| Profile / mode | Request B | Response B | ms |
| --- | ---: | ---: | ---: |
| Inline uncached |84,981|963,301|140.1|
| Inline cache only |52,715|510,828|81.3|
| Inline batch only |85,227|963,547|103.4|
| Inline combined |52,834|510,947|81.5|
| Directory/carrier uncached |131,536|1,197,503|148.2|
| Directory/carrier cache only |79,588|633,793|100.9|
| Directory/carrier batch only |131,934|1,197,901|132.4|
| Directory/carrier combined |79,783|633,988|90.4|

Inline combined cold create has151 raw-read attempts,16 hits,135 misses,
two verified-context reuses and two context misses. Rich combined has228 raw
attempts,16 hits,212 misses and the same2/2 context split. In-flight dedup is
tested separately; these serial fixture lifecycles do not claim concurrent-hit
savings. Headers, chain IDs, receipts, exact signed preflight and sends remain
network work outside the read cache.

## Lower-level ordered read-set control

These rows measure **only protocol authorization and read-set preflight
snapshot subphases**, through the existing engine injection seam. Initial pin,
chain identity, public entry/final canonicality, signing, exact signed RPC
preflight, sends, journals and reconciliation are excluded. Repeated0/0 rows
are not safe public current-read totals. Public Files generates at most two
guarded positions; no four-position Files option was added.

The same counts were observed in both profiles; each named shape starts with a
fresh SDK and pinned context. The second pass uses that explicit same context.

| Shape / pass | Uncached | Cache only | Batch only | Combined |
| --- | ---: | ---: | ---: | ---: |
|1x1 first|3/3|2/2|3/3|2/2|
|1x1 repeated|3/3|0/0|3/3|0/0|
|8x4 first|65/65|33/33|65/9|33/5|
|8x4 repeated|65/65|0/0|65/9|0/0|
|64x4 first|513/513|257/257|513/33|257/17|
|64x4 repeated|513/513|0/0|513/33|0/0|

The256 heads drain in16-wide chunks, preserve position-major/principal-major
order and reject a corrupted expected head beyond the first chunk. These read
controls fit the chosen bounds. They do **not** establish a combined maximum
body/action/guard publication under the gas cap; no such implicit promise is
made. JSON-RPC batching is not onchain Multicall.

## Transaction invariants

| Profile | Create gas / calldata B | Edit gas / calldata B |
| --- | ---: | ---: |
| Inline |2,369,847 /2,852|1,314,841 /1,796|
| Directory/carrier |2,947,610 /3,972|2,147,334 /2,916|

The runner asserts equal signed calldata hashes, actions hashes, read-set
hashes, calldata lengths and gas across all four modes. Early exploratory runs
used timestamp-derived deadlines and showed small signature/calldata gas
differences; the retained final comparison fixes the deadline, rather than
misattributing those differences to transport optimization.

## Safety results and qualifications

Original covering run: **122 tests passed, zero failures/skips/cancellations**.
After review fix1, **nine focused transport/integration tests passed**; the
122-test suite was not repeated and no Forge rebuild was required. The prior
successful build had existing shadowing/naming warnings and unsafe-typecast
lints; it is not claimed warning-free.

The focused controls cover successful duplicate/in-flight reuse, distinct call
options, cold-instance isolation, entry and byte eviction, rejected/malformed
read retries, shuffled/partial/duplicate/unknown/malformed batch responses,
item-local RPC errors, exact-ID unsupported fallback, caps/timeouts/concurrency,
cache-hit reorg, unchanged-admission new block, new epoch/account code/index/code,
failed pin retry, and provider failure at the final canonicality check.

Existing guarded competition in both orders, post-preflight mutation, receipt
attribution, malformed local journal zero-RPC behavior, compatible/unsupported
upgrades and cold source recovery are covered. Task1 tag assessments,
unavailable-header UNKNOWN and page-local coverage remain unchanged.

The first covering run caught evidence reuse accidentally reusing the context
capability object, which made an old pagination token usable after a new pin.
The repair reuses only frozen evidence and creates a fresh owned capability on
every pin. A separate regression catches concurrent same-hash context
double-accounting. A final canonicality failure clears tentative effect
evidence and persists UNKNOWN. Historical constant-hash mutable mock fixtures
explicitly disable caching; real block transitions test the cached path.

Independent review then found admitted requests still aliased caller parameters.
Fix1 snapshots one owned JSON graph before validation/accounting, preserving
queued and fallback calldata, target, from, nested access-list/state options and
the exact selector despite later caller mutation. Both mutation controls were
RED before the fix and GREEN afterward. The first refresh's total-call equality
failure is retained; the amended runner retains method counts before assertions
and strictly checks every non-receipt method. It does not infer or hide the cause
of that older failure; the fresh packet independently observes the receipt-only
variance stated above. Prior packet provenance remains in commit6a3b57d.

Limitations: same-hash provider observations remain RPC trust, not a state
proof; malicious equivocation under an unchanged hash is not detected by a
successful canonical header check. Bounds on response streaming and deadlines
are enforced by the injected Node transport, not a promise about arbitrary
caller-supplied RPC functions. Phase attribution is for serialized measurement
lifecycles, not a concurrent trace framework. The existing browser module is
large; this bounded change preserves served asset boundaries and does not
attempt a production restructuring. No contracts, Type bytes, storage carrier,
owner-demo assets, server routes or public endpoints changed.
