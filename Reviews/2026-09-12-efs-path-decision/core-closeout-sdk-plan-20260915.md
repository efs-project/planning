# Core closeout: bounded SDK transport and retained read-set cost

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Demonstrate practical cold access without weakening qualified reads or write reconciliation, and measure an additive retained-read-set representation against the current storage cost.

**Architecture:** Exact-block, instance-owned bounded read caching and JSON-RPC batching. No server cache, contract Multicall, trusted fixture data or stale-head shortcuts. The separate storage experiment preserves the old mapping and adds an immutable-code carrier behind the same qualified getter.

**Spec:** [[core-design-audit-20260915]], packets3/6; [[core-closeout-results-20260915]]. Existing opaque SDK contexts, fresh preflight and independently read-back effect success remain binding.

## Global Constraints

- Use the existing compact prototype with one source/build/chain writer. Parent owns main documents/publication. No owner-demo changes, dependency installs, public transactions, API keys, Fable, unbounded logs or production repo work.
- Preserve exact block-hash reads, canonicality checks, public capability ownership, qualified UNKNOWN/PARTIAL and complete-from-owned-origin pagination. Provider failure is not zero, empty or permission to reuse an older result as current.
- Retain exact signed preflight, durable write-ahead journal, onchain dependency guards, receipt attribution and canonical effect verification. These establish different facts. Do not remove one because another succeeded.
- Cache/transport optimizations do not change transaction semantics or calldata. Report HTTP requests, logical calls, bytes, latency and cache work separately. No claimed savings without matched instrumentation.
- Preserve runtime24,576/initcode49,152, normal15M/hard16,777,216 transaction limits and all reviewed acceptance/index/Type/authority checks. Storage changes need populated-upgrade and archive evidence, not only a cheaper fresh write.

## Task 1: Make tag assessments explicit and repair join coverage

**Files:** narrow shared tag normalization in`browser/compact-sdk.mjs`, its existing`files-view.mjs`/`app.mjs` consumers, focused SDK/view/joined tests. This is API correctness/safety, not UI redesign.

- [ ] Reproduce joined`tagCoverage` claiming COMPLETE from a known query match while a requested tag join is UNKNOWN. Derive tag coverage from actual requested joins; keep query match separate. A known-positive OR match stays a match even if the other tag join is unknown. With concept0, any vacuous coverage describes the empty requested join set, not evaluated placeholder tags.
- [ ] Use one normalized tag shape with mandatory`assessment: PRESENT | NOT_PRESENT | UNKNOWN | NOT_APPLICABLE`;`present` is true/false only for the first two, null otherwise. Preserve exact subject, concept, selected revision, provenance, label qualification and outer basis. Existing`evaluated` may remain as a consistently derived compatibility field. Missing/malformed discriminants never become known negatives.
- [ ] Missing/conflicting/unavailable File revision means UNKNOWN, not Directory-N/A. A missing Concept label does not erase otherwise proven keyed presence. Preserve outer successful-negative`knowledge:PRESENT` as assessment availability for compatibility; document it rather than silently changing its meaning.
- [ ] Update existing consumers to branch on assessment, never infer absence by negating a nullable boolean. Keep unknown/masked/N/A distinct. Preserve the existing valid AND inference in fallback mixed name/tag filtering; document its diagnostic-retention difference from the more conservative joined matcher instead of calling it a correctness repair.
- [ ] Add focused controls for direct selection RPC failure, label-only failure, true absence/mask/wrong-target negative, missing/conflicting revision, Directory-N/A, missing discriminator, point/joined parity, and either/none filter modes with a requested unknown join. Tag coverage is page-local unless explicitly accumulated in the owned continuation; never let the final page falsely certify earlier unknown joins.
- [ ] Self-review, exact task commit/report and independent review. No broad Result/SDK redesign or visual polish.

Source preflight atdcb9b2f found no false-absence propagation in current main consumers: they already check evaluation/outer qualification. The boolean shape is a developer hazard; the aggregate tagCoverage derivation is the concrete bug. Fix both narrowly without overstating the finding.

## Task 2: Exact-basis reuse and bounded read batching

**Files:** `browser/compact-sdk.mjs`, narrow independent-read grouping in `browser/compact-sdk-v2.mjs`, injected transport in `script/compact-environment.mjs`, measurement script and focused SDK tests. Evidence in `core-closeout-sdk-20260915/`.

- [ ] Instrument phase-level method/target/selector/block-hash counts and request/response bytes before changing behavior. Never retain private bodies/signatures in request diagnostics. Preserve source, deployment and exact recipe pins.
- [ ] Add finite entry-and-byte bounded, SDK-instance-owned successful-read caching with in-flight deduplication. Keys cover transport/configuration/profile identity, chain/Realm, exact block hash, target, full calldata and all execution-affecting call options. Return immutable/copy-safe values. Evict failed promises and never install a successful context after partial validation.
- [ ] Fresh current operations still acquire latest header and chain identity. Every public cache-serving operation independently rechecks block-number canonicality; new blocks have separate buckets even if admission counters match. `guard(context)` may reuse same-hash state only after that fresh check. Actual RPC calls retain EIP-1898 `requireCanonical`; no silent number/latest downgrade.
- [ ] Reuse verified same-hash context evidence only within this instance/transport/profile. Do not start with cross-block caching of mixed Type descriptors, account code, registration or mutable policy. Content-derived bytes and their current acceptance/availability are different facts.
- [ ] Batch only independent read calls, never writes or journal operations. Preserve each request ID and parameters, correlate unordered responses by ID, reject missing/duplicate/unknown IDs, and retain per-item errors. Bound batch/request/response size, concurrency and time. Unsupported batches may fall back to the same read-only pinned calls individually.
- [ ] Use bounded parallel groups for known-address profile/linkage requests and ordered read-set head snapshots; dependent requests follow their prerequisites. JSON-RPC batching is not onchain Multicall and must not alter `msg.sender`.
- [ ] Focused controls: duplicate/in-flight/cold-instance isolation, distinct options, eviction, failed retry, shuffled/partial/malformed batch responses, unsupported batching, cache-hit reorg, changed code/epoch/index in a new block, unchanged-admission new block, and provider failure at the final canonicality check. Preserve opaque pagination and guarded competition/receipt/upgrade/source-recovery controls.
- [ ] Measure matched uncached, cache-only, batch-only and combined controls: first cold operation, repeated same-block read, new block after a write, richer Directory/carrier profile and bounded1/8/64-principal read sets. A too-large joint workload is a reported limit, not an implicit promise that every maximum combines.
- [ ] Self-review, commit exact task paths, report source/commands/outcomes and release ownership for independent review. No push.

## Task 3: Additive immutable read-set carrier experiment

**Files:** Ledger read-set retention/getter and a fixed helper only if size demands it; guarded archive/SDK profile qualification and focused upgrade/cost fixtures. This is separate from transport caching.

- [ ] Preserve sequential root15 `mapping(bytes32 => bytes) _readSets` exactly. New namespaced mapping points to STOP-prefixed immutable code containing the same canonical ABI preimage. `readSetBytes` reads old bytes first, then the new supported carrier. Never reinterpret a legacy bytes header as an address.
- [ ] Deduplicate across both representations. Unknown key remains `0x`; the canonical empty read set remains its224-byte preimage. Pointer, deployment, nonce and evidence all roll back on failed publication. Verify carrier prefix/size/code identity and recomputed requested read-set hash.
- [ ] Declare the additive physical storage profile and changed execution implementation honestly. Existing raw-layout consumers cannot infer absence from root15 zero. Update all fixed-layout gates that the change affects; do not relax supported-profile checks merely to make them accept.
- [ ] Compare old/new whole receipts for empty,1×1,8×4,64×4 head sets, exact repeat and changed-head dedup miss. Include CREATE/code deposit, pointers, dispatch, full paid read and constructor/runtime/initcode. A small preimage may be cheaper in the existing mapping; report the crossover rather than claiming all blobs win.
- [ ] Prove populated upgrade preserves old entries and new ABI bytes, duplicate writes deploy nothing new, failures retain nothing partial, and export/import/source-off verification works for both executions. Maximum read-set carrier fit alone does not establish maximum joint publication fit.
- [ ] Retain this as an explicitly selected experiment only if same-guarantee measurements justify it; if it loses or complicates the basis excessively, preserve the negative evidence and the simpler storage path. No requirement is sacrificed for a headline gas reduction.
- [ ] Focused tests, exact commit/report and independent review before integration.

## Final network boundary

After integration, inspect real read-only public endpoints for exact-block access, bounded batch behavior and failure handling. Record endpoint/date/network evidence and reproducible assumptions for complete network fee estimates, including L2 data/operator components. A local receipt times an execution gas price is not an all-in L2 quote. No public deployment or spending is authorized by this plan.
