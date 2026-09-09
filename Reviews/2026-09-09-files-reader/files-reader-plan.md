# Bounded Files reader implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development or superpowers:executing-plans, task by task. Steps use checkbox syntax.

**Goal:** Produce bounded, correctly qualified root-folder listings from the actual populated upgrade read profile through one browser-portable consumer path.
**Architecture:** immutable read scope with checked deployment/execution and exact RPC evidence; a narrow Files adapter validates selected ordinary Types and streams actual BindingScope discovery. Independent full-state reconstruction is test-only.
**Tech stack:** existing Node26, ethers6.15, Solidity0.8.30/Cancun Foundry fixtures; browser-standard JavaScript, no new dependencies.
**Spec:** [README.md](README.md); the existing [consumer card](../2026-09-09-v1-parity-overnight/consumer-build-card.md) and [SDK seam](../../Designs/sdkv2/mvp-interface.md).

## Global Constraints

- Existing isolated `codex/mvp-c0-coherence` experiment only. No main merge, product repository, public deployment, funds, permanent profile/Type/ABI adoption or frozen protocol choices.
- Existing Store, writer, read façade, managed runner, original independent verifiers and historical JSON reports remain byte-identical. Add only this review directory's files. Task3 may modify this directory's reader-scope.mjs scheduling; no change to external comparator pins or existing contract runtime source.
- Browser runtime modules use JavaScript/Uint8Array/TextDecoder and existing ethers only; no Node builtins, Buffer global, process, filesystem, producer/oracle import or dependency install. Import ethers through the existing relative browser ESM bundle path `../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js`; Node and browser use the same runtime module graph.
- Scope lifetime budgets:512 requests,4 MiB serialized JSON-result bytes,262144 response bytes,4 in flight. Deadline30000 ms per active acquisition window: open ends at READY; next data call starts a window ending at successful seal; idle sealed-page time is excluded. Seal is a barrier that drains queued work and refuses new data calls until settled. Expiry invalidates the scope; lifetime request/byte budgets never reset. Validate configuration; no silent raised limits. Every data/code/storage query is pinned with requireCanonical:true; no latest fallback.
- Original21-word execution-set/1 tuple/domain and original runtime/library commitments remain unchanged. Accepted expected manifest is trusted run configuration from the source-checked runner; RPC alone does not establish source authority or consensus proof.
- Names:1..255 ASCII bytes[a-z0-9._-], excluding dot/dot-dot. Clear Files violations are malformed; uppercase/non-ASCII are unsupported rather than auto-normalized or falsely classified. No full Unicode17 certification.
- Actual Files point outcomes retain FOUND/ABSENT_PROVEN/UNKNOWN/CONFLICT plus typed reasons and separate qualification. Synthetic authority/provisional finality/effect NOT_APPLICABLE stay explicit. No onchain Files certificate, receipt façade, bytes/head traversal, UI or write-router completion claim.
- Every implementation task has one exclusive edit window and no push/subagents. Parent owns design/status/evidence docs, independent reviews and publication. Preserve old reports and keep new exported measurements separately named.

## Task 1: Browser-portable qualified read scope

**Files:** create `reader-scope.mjs`, `test/reader-scope.test.mjs`, `test/reader-scope-live.test.mjs` in this directory. No other edits.

**Interfaces:**

```js
export const DEFAULT_LIMITS = Object.freeze({maxRequests:512,maxBytes:4194304,responseBytes:262144,maxInFlight:4,deadlineMs:30000});
export function createFixtureReader({source,context}) { /* no wallet */ }
// source: {identity:string, epoch:number, request(method,params,{signal,maxBytes})}
// context: {expected:lab.expected, limits?:same-or-tighter limits}
// reader.open({blockTag:'latest'|canonical block number,signal?}) ->
// {status:'READY',scope} | {status:'UNAVAILABLE',reason,evidence}
// scope.basis: frozen {source,epoch,chainId,core,blockNumber,blockHash,stateRoot,
//                     executionSetId,revision,admissionHigh}
// scope.call(name,args=[]) -> {status:'OK',values,evidenceId} |
//                           {status:'UNAVAILABLE',reason,evidenceId}
// scope.seal() -> {status:'SEALED',basis,evidence} | {status:'UNAVAILABLE',reason,evidence}
// scope.close(); scope.stats(); scope.evidence();
```

The manifest is copied/frozen when the reader is constructed. Capture source
request-function identity and current epoch per scope; changes invalidate that
scope. Caller-forged expected manifests remain caller configuration, never a
source-proven/public configuration claim.
Each `open` creates a distinct cancellation/budget lifetime. Qualification is
single-flight only inside that scope, never globally shared across callers'
signals or block selections. Manifest caps are 32 fixed components and 32
recognized implementations; the existing execution-history cap is16.
The deadline covers active windows, not human idle time: open ends its window
at READY; first data call starts the next window; successful seal ends it.
Seal drains already queued work before its fresh controls and refuses new data
calls while sealing. Concurrent seals share the same barrier. Expiry closes
the scope; lifetime counters/cache/evidence do not reset between windows.

Allowed application calls are exactly `getRecord`, `getOccurrence`,
`getOccurrenceByOrdinal`, `getBindingHead`, `getBindingAtBasis`, `readHistory`,
`pagePostingsHydrated`, `resolve`, `validatePlan`. Internal qualification calls
include bootstrap/configuration/currentRevision/revisionAt/fixtureReadContext
and ProxyAdmin owner; no arbitrary target/selector forwarding is exposed.
Derive exact ABI fragments from current source/artifacts and pin/test their
input/output shapes. Do not expose the absent getReceipt or any write method.

- [ ] **Red:** create the scope tests first and demonstrate the missing module/export failure. Include live `withUpgrade(...,{profile:'reads'})`, using its existing expected manifest and a measured read-only wrapper around lab.rpc. No mocked contract state earns the live pass.

```js
const reader=createFixtureReader({source:{identity:lab.expected.source,epoch:1,request:lab.rpc},context:{expected:lab.expected}});
const opened=await reader.open({blockTag:'latest'});
assert.equal(opened.status,'READY');
const r=await opened.scope.call('getRecord',[ZeroHash]);
assert.equal(r.status,'OK');
assert.equal((await opened.scope.seal()).status,'SEALED');
assert.equal(await opened.scope.call('executeFixture',[]).then(r=>r.status),'UNAVAILABLE');
```

- [ ] **Open and qualify:** validate finite manifest inventories/hex/limits; read chain/header, all fixed runtime commitments, active implementation slots and bounded16-revision complete peer history; independently recompute execution IDs/configurations against expected fields/codehashes and monotonic block/admission boundaries. Reuse formulas from unchanged `reference/upgrade-reader.mjs` but implement the portable scope path without importing that full-state oracle. Bind exact expected proxy runtimes (including their immutable admin commitments), admin slots/owners and active implementation code. Check bootstrap original commitments and guarded fixtureReadContext block/revision/H/execution agreement. Fetch each distinct code address once; shared calls must not erase source attempts. Fail before any allowed application call on missing/wrong evidence.

```js
const pin={blockHash:header.hash,requireCanonical:true};
// Re-encode every decoded ABI response and compare exact bytes.
// history ordinal1..current, <=16; equal Core/carrier rows;
// history IDs/core/carrier configurations recomputed, expected implementations recognized.
// First activationH=0; later block/H monotonic and within observed block/H.
// Actual proxy slots, runtime immutables via expected full proxy code, owners and
// current guarded context all agree with the active history entry.
```

- [ ] **Bound calls and evidence:** one scope-local single-flight map keyed by exact target/calldata/pin, shared ordered concurrency budget, no retained failed-cache entries. Keep request method/params, raw result or error, sequence, purpose (qualification/data/seal), serialized result bytes and timing. Check incoming results against remaining limits even when a supplied transport ignores maxBytes. Duplicate cache hits spend no RPC but are separately countable. A rejected ABI, over-limit result, transport failure, abort or epoch drift is not empty/zero. Never re-encode producer objects as substitute raw evidence.

```js
const [a,b]=await Promise.all([scope.call('getRecord',[id]),scope.call('getRecord',[id])]);
assert.equal(a.evidenceId,b.evidenceId); // one actual successful attempt
source.epoch++;
assert.equal((await scope.seal()).status,'UNAVAILABLE');
```

- [ ] **Seal and cancellation:** recheck the pinned header via its number, chain/source epoch and guarded context at the same block hash using fresh uncached calls after the seal barrier drains queued work. Do not compare old pinned execution with latest execution. Store no successful late result after abort/deadline; stop scheduling queued work. A failed validation attempt must not poison a later newly opened scope. All failure objects retain earlier raw evidence. Scope close aborts pending acquisition when transport supports the signal; otherwise late replies are inert. Test idle time longer than deadline after READY and after SEALED remains usable, an unsealed stalled acquisition expires, new data during sealing is refused, concurrent seals share the barrier, and lifetime request/byte counters never reset.

- [ ] **Adversarial tests and green:** swapped runtime or expected dependency; wrong implementation/admin/owner/config/history; wrong/missing bootstrap; inconsistent H/header/context; mixed pin and reorg at seal; same-H upgrade with successful old-block read/new latest context; noncanonical/truncated/oversized ABI; mutated source/manifest input; independent concurrent opens and shared same-scope data calls; failed single-flight then fresh success; abort with queued/in-flight work; limits and zero wallet/write calls. Pure transport fixtures may inject responses, but actual U1/U2 qualification and history/code controls use the managed chain. Preserve exact error/reason and no-data-call assertions.

- [ ] **Handoff:** syntax and focused scope tests, self-review, exact three-path commit via git commit -F with actual model/v2-pm/codex trailers. Report red/green commands, actual scope RPC counts/bytes, untouched source verification, compatibility concerns and source SHA to the designated report. No push or broad unrelated suite rerun. Parent runs task review before Task2.

## Task 2: Selected Files semantics and a bounded directory stream

**Files:** create `files-profile.mjs`, `files-reader.mjs`, `index.mjs`, `index.d.mts`,
`test/files-profile.test.mjs`, `test/files-reader.test.mjs`,
`test/fixture.mjs`, `test/oracle.mjs`, `test/sample.ts` in this directory only.
Task1 scope files are protected unless parent approves an exact supporting fix.

**Interfaces:**

```js
// files-profile.mjs: fixed candidate Type map + checked exact field decoders;
export function assessRecord(recordId,typeId,body) { /* raw identity/structure plus typed fields or reason */ }
export function nameAssessment(name) { /* ACCEPTED | MALFORMED | UNSUPPORTED */ }
// export frozen fixture constants, purpose/role/key derivations and portable parsePlan.
// files-reader.mjs:
export async function lookupName(scope,{mountId,name}) { /* qualified point */ }
export function openDirectory(scope,{mountId,pageSize=8}) { /* lazy stream */ }
// stream.loadMore() -> cumulative qualified snapshot, single-flight;
// stream.snapshot() -> latest public observation (including failure);
// stream.close() closes stream only. Internal last-sealed prefix stays separate.
// snapshot: {basis,domain,coverage,rows,unresolved,masked,absent,progress,
//            continuation:boolean,qualification,evidence}
// rows/unresolved keyed by exact fieldRole; no phantom selected value on failures.
```

Use scope.call exclusively for live application evidence. Do not call the
full-state oracle, lab raw ports, getReceipt, hosted index or producer fold
from runtime modules. Keep root-directory-only scope explicit. An Entry's
File node is not automatically a readable FileRevision or available content.
One public lookup or Load-more step owns its scope's acquisition window through
seal. Listing hydrates/resolves sibling rows internally, then seals the whole
step; it must not call a separately sealing public lookup for each row.
Concurrent Load-more calls share one step. Separate overlapping top-level
operations should use separate scopes, not interleave independent seals.
Use [acceptance-cases.md](acceptance-cases.md) for the three-view truth table
and honest workload/timing disclosure; it adds no production scope.

- [ ] **Red:** tests first for requested-ID substitution, strict OPTION/trailing-byte rejection, unknown exact Type, ASCII versus unsupported rich names, and selected Files outcome. Start an actual mounted fixture and request a known name/listing before implementing the adapter.

```js
assert.equal(nameAssessment('note.txt').status,'ACCEPTED');
assert.equal(nameAssessment('a/b').status,'MALFORMED');
assert.equal(nameAssessment('Trip').status,'UNSUPPORTED');
const got=await lookupName(scope,{mountId:fixture.mounts.aFirst,name:'note.txt'});
assert.equal(got.outcome,'FOUND');
assert.equal(got.value.nodeId,fixture.fileA);
```

- [ ] **Exact narrow codecs:** independently recompute fixed Type IDs from candidate groups in tests; runtime contains only fixed IDs/grammar and uses browser primitives. Check strict UTF-8, lengths, flags, non-local references>=65536, full consumption and exact ordinaryRecord identity; preserve raw bytes when structure/type/profile is unavailable. Compare every supported fixture decoding against unchanged descriptor-tree decodeBody. Reproduce canonical B0 Plan rules/profile/source order/duplicate/floor checks; compare parser output and contract validatePlan in tests. Do not introduce a generic schema engine or permanent domain value.

- [ ] **Mount/node/point:** enforce the README's exact fixture public-profile/domain constants, root-specific namespace/content purposeAndScope, optional-config pairing, node meaning and bounded historical publisher charter. Walk at most64 charter history revisions, with exact history-source occurrence/key and getBindingAtBasis confirmation. A current matching charter is a fast valid historical witness; a withdrawn/rebound one may require history. Historical valid versus current maintenance remain separate; exhaustion stays UNKNOWN. Root mount requires a Directory for listing. Child overrides match child root and validate their public config; a File mount has no namespacePlan. Selected Entry/Whiteout parent/name/role/target kind/leaf/profile checks happen after real Lens selection, with no lower-author fallback.

```js
// A malformed selected Entry must block even when B has a usable lower value.
assert.equal(bad.outcome,'UNKNOWN');assert.equal(bad.reason,'MALFORMED_SELECTED');
assert.equal(bad.value,undefined);
// Charter withdrawal changes maintenance, not the stable node's historical validity.
assert.equal(oldNode.value.historicalCharter,'VALID');
assert.notEqual(oldNode.value.maintenance,'MAINTAINED');
```

- [ ] **Stream:** validate Mount/Plans once per exact scope; for each unique
  Plan Principal issue hydrated Scope pages `(ZeroHash,10,0,scopeKey,{cursor,
  maxItems:pageSize,basisOrdinal:scope.basis.admissionHigh})`. PageSize is an
  integer1..8 for this first consumer. Preserve exact per-source continuation,
  basis/H, alignment of IDs/hydrated members, monotonic unique ordinals,
  coverage accounting and COMPLETE/PARTIAL/terminal-cursor law from the source.
  Decode each anchor Binding body, prove Principal/purpose/root/role, union
  roles and resolve current positions. Initial tombstone supplies a role,
  never a current entry. Spend the shared scope budget across all sources.

```js
const list=openDirectory(scope,{mountId:fixture.mounts.aFirst,pageSize:1});
const first=await list.loadMore();assert.equal(first.coverage,'PARTIAL');
const final=await list.loadMore(); // exact fixture has two anchors per source
assert.equal(final.coverage,'COMPLETE');
assert(!final.rows.some(r=>r.value.name==='note.txt' && fixture.oldNameMasked));
```

  Commit a new cumulative trusted prefix only after scope.seal passes. Keep
  good prior rows on later partial/failure; mark new failure/current coverage
  honestly, not stale COMPLETE. A malformed selected row leaves enumeration
  coverage separate from row usability. Suppress only qualified masked/absent
  roles; conflict/unresolved roles remain inspectable with no child-derived
  presentation. Do not derive a conflict title from losing evidence. Same-role
  deduplication and empty partial windows are explicit. Sorting is only over
  currently known names. A terminal suffix cannot certify an unobserved prefix.
  On failure, loadMore() and snapshot() expose the same latest failed public
  observation; label retained rows as prior sealed evidence. Do not add unsealed
  rows/cursors to the internal last-sealed prefix. A caller using snapshot()
  after failure must not accidentally recover a stale successful COMPLETE claim.

- [ ] **Real fixture and independent oracle:** use unchanged withUpgrade reads
  profile and publications to admit candidate groups, meaning+charter Objects,
  three scoped Plan/config/Mount variants and actual claims. Cover only A;
  A/B disagreement; A rename+mask; retraction revealing B; second placement;
  malformed winner and missing evidence; withdrawn/rebound charter, first
  tombstone then later proper charter; empty scope; same-name and distinct-name
  churn; partial/corrupted continuation; old pinned and fresh post-U2 reads.
  Test reference/OPTION/name mismatches through actual structurally admitted
  evidence where possible, and label transport corruption separately.

  Oracle reverifies full retained snapshots through unchanged
  verifyUpgradeState, then uses its own descriptor decoding, history and pure
  model. It must not import runtime Files decoder/resolver or use the getter
  under test as expected truth. Assert exact selected IDs/roles/outcomes and
  independent complete scope inventory; no handcrafted canonical browser tree.
  Actual Core Lens results are contract evidence; this does not claim a
  Solidity Files-profile validator. Existing UpgradeStaticConsumer remains
  a separate lower-level ABI control.

- [ ] **Performance and type UX:** measure identical eight-name/two-author
  live fixture arms at0/50 ms transport delay, with cold scope open, first
  page, continuation and same-scope reuse separate. Include method counts,
  JSON-result bytes, max in flight and every timing sample; no SLA/causal
  v1 ratio. Test one unavailable row among out-of-order siblings, no unknown-
  to-empty fallthrough, concurrent loadMore, abort/epoch/reorg failure, bounded
  distinct-name churn, historical charter cap and no wallet calls. Provide
  strict TypeScript declarations/sample showing callers narrow qualified
  results and cannot obtain usable node values from UNKNOWN/CONFLICT.
  `index.mjs` is a minimal runtime re-export of the reader/Files entrypoints;
  adjacent `index.d.mts` describes those same exports. The strict sample imports
  the actual `.mjs` entrypoint, not a declaration-only pretend module. Test
  runtime export/declaration agreement; keep this explicitly fixture-scoped.

- [ ] **Green and handoff:** run all new reader tests serially, syntax checks
  and strict TypeScript sample with installed tsc. Save optional fresh measured
  report only to a parent-designated scratch path through an explicit env flag;
  no historical JSON writes. Self-review and exact nine-path commit using
  git commit -F and actual model/v2-pm/codex trailers. Return full results,
  missing checks, performance boundaries and source SHA. No push/subagents.

## Task 3: Same-evidence bounded control scheduling

**Files:** modify `reader-scope.mjs`; create
`test/reader-scheduling.test.mjs` in this directory. No other edits.

**Interfaces:** unchanged `createFixtureReader({source,context})`,
open/call/seal/basis/evidence/stats and existing DEFAULT_LIMITS. Consume
`mountedFixture`, A/B from `test/fixture.mjs`, `oracle`/`comparable` from
`test/oracle.mjs`, `openDirectory`/`lookupName` from `files-reader.mjs`.
The existing Files tests and implementations are protected in this task.

- [ ] **Red scheduling control:** use the actual managed reads profile and
  a wrapper around lab.rpc. After READY, hold each seal transport call until
  all four controls have been issued or a bounded test-only timer releases
  the first call. Assert four in flight before release, every request pinned
  where applicable, and no seal result until every successful control returns.
  The old sequential implementation must fail the concurrency assertion,
  not merely time out. Restore/release all gates in finally.

```js
const sealed = scope.seal();
// Wrapper counts actual header, chain, guarded-context and counts attempts.
await releaseAfterFourOrBoundedTimeout();
assert.equal(sealPeak, 4);
assert.equal((await sealed).status, 'SEALED');
```

- [ ] **Schedule without weakening:** parallelize independent reads through
  the existing rpc pool, never raw transport. Chain/header may be acquired
  together but validate both before choosing the pin. Code inventory remains
  exact. Current revision, guarded context and raw counts may join; bounded
  history acquisitions may join once revision is validated, followed by
  ordered history validation. Independent endpoint controls, dependency
  getters and bootstrap may join, with all original equality/shape checks.
  Final canonical header/chain and guarded-context/counts may join after
  dataWork drains. Keep the barrier, singleflight, cancellation, deadlines,
  cumulative budgets and no application data before full qualification.
  Check failures do not create unhandled rejections or permit successful
  READY/SEALED with pending control work; stop retains actual attempts and
  ignored-signal late replies remain inert. Do not add caching, APIs, RPC
  batching, adaptive limits or a second authoritative implementation.

```js
const [headerResult, chainResult] = await Promise.all([
  rpc('eth_getBlockByNumber', [number, false], purpose),
  rpc('eth_chainId', [], purpose),
]);
// Existing exact header, hash, root and chain checks still run.
```

- [ ] **Matched live comparison:** obtain baseline reader source using
  read-only `git show eb14059fbd7fa105d80979a30a806b5660ddabd9:Reviews/2026-09-09-files-reader/reader-scope.mjs`.
  Verify the exact source hash in the report. Import only in this Node test
  via a data URL after replacing its one relative ethers bundle import with
  that same installed bundle's absolute file URL. No copied baseline runtime
  or altered old report is committed. Current runtime imports normally.

  Set up the identical workload from the existing performance test: eight
  names note.txt and n0.txt..n6.txt, two maintained File nodes shared among
  placements, A and B binding identical Entries, A-first Mount, pageSize4.
  Acquire full oracle once outside timers. For 0/50ms delay and three samples
  alternate baseline/candidate order. Capture cold-open, first-sealed-page,
  continuation and same-scope-point-reuse independently. Assert exact basis,
  row/selected-ID/qualification/coverage and oracle agreement. Compare actual
  successful method+params+raw-result multisets for each phase after ignoring
  evidence sequence/timing; require the same requests/bytes and peak<=4.
  Retain every timing, raw scope evidence and source pin; separate setup,
  oracle, UI and bytes exclusions. Report medians/ranges only as descriptive
  samples, not percentiles or a v1 ratio. No brittle wall-time pass threshold.

```js
for (const delayMs of [0, 50]) for (let sample=0; sample<3; sample++) {
  const order = sample % 2 ? ['candidate','baseline'] : ['baseline','candidate'];
  // Fresh scope per arm; same fixed live fixture and existing Files adapter.
  // Compare both arms with the full retained-state oracle and each other.
}
```

- [ ] **Focused refusal controls:** fail one of concurrently acquired final
  controls while other responses arrive late, and abort while queued controls
  remain. Assert UNAVAILABLE, peak/budgets retained, zero application calls
  before READY, settled returned evidence, no post-failure success/caching.
  Use existing single-fault validation suite unchanged for wrong code,
  slots/history/context/chain and active-window/barrier regressions.

- [ ] **Green and handoff:** run new scheduling tests plus every existing
  reader test serially, syntax check the two changed paths, and unchanged
  strict TS sample. Optional new scheduling evidence ONLY when
  `EFS_FILES_SCHEDULING_EVIDENCE=1` to
  `.superpowers/sdd/files-reader-plan/files-scheduling-evidence.json`.
  No older JSON overwrite. Self-review, exact two-path commit using git
  commit -F and real model/v2-pm/codex trailers. Report baseline/candidate
  hashes, full commands/results, all measurements and failure boundaries
  to task-3-report.md in this plan's scratch. No push/subagents. Parent runs
  task review and chooses durable evidence; failed performance hypothesis
  is a valid experiment outcome, not permission to discard validation.

## Parent integration

Parent owns docs/evidence/status, independent per-task and final increment
review, fresh new-reader regression plus relevant existing upgrade/Core tests,
source pins and publication. Update the consumer map with actual scope; do not
claim UI, FileRevision/bytes, mutation preconditions or full parity complete.
If 9 AM America/Chicago approaches, checkpoint the current bounded task and
pause the heartbeat rather than starting another long worker.
