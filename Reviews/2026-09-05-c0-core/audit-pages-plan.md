# Audit-backed directory discovery implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Return real bounded raw/hydrated BindingScope and Binding-history pages through the existing page ABI, with exact cursors, historical lifecycle, independent readback and measured costs.

**Architecture:** Reuse the one Store and fixed QueryReadLibrary boundary. Implement only audit kinds8/10 initially; all other query families explicitly refuse. Keep raw anchor enumeration separate from current Files resolution, and preserve the already-reviewed Binding/point reads.

**Tech Stack:** Existing Solc0.8.30/Cancun/optimizer200/viaIR, Forge/Anvil1.7.1, Node26, local ethers6.15. No dependency installation or new product repository.

**Spec:** [read-overlay.md](read-overlay.md), [B0 INDEX §5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md#5-the-page-result-abi-every-enumeration), [fixed libraries](read-library-layout.md), and [next directory checkpoint](../2026-09-09-v1-parity-overnight/directory-read-next.md). This is execution of that selected disposable surface, not a new Type/query/authority architecture.

## Global Constraints

- No storage, admission, authority, identity, candidate Type or portable encoding change.
- Relevant retained counters remain strictly below `(2^48)-1`.
- Normal caps remain24,576 runtime bytes,49,152 full initcode bytes and16,777,216 transaction gas.
- Keep maximum raw items512, hydrated items256 and consumed-posting scan budget1,024; these are measurement inputs, not an untested gas guarantee.
- Preserve PageRequest/PageResult/HydratedItem ABI, PageCursorV1 bit fields, context domains and refusal precedence. No private array endpoint or invented continuation format.
- Support only exact tuples `T=0, ordinal=0, kind=8 or10` in this incremental facade; valueKey is opaque and may be zero. Other tuples return qualified UNSUPPORTED, while counts reverts the exact unsupported error.
- Audit entries are never filtered by current liveness. Hydrated lifecycle is projected at the returned H, not silently borrowed from a newer current-only point read.
- Keep the sole linked admission writer and both fixed read libraries. No mutable dispatcher, third library, all-enabled manifest, authenticated-C0 claim, upgrade-read claim or private index.
- Managed loopback only; no public RPC/wallet, product repository, main merge, durable publication or worker push. Parent owns docs, review and experiment-branch publication.

## Selected incremental boundary

Implementing every query family at once would couple this gate to nested unique-Type walking and Type-declared classifier parsing. An unrelated Scope-only array API would be smaller but would not test the selected cursor ABI. Use the existing generic ABI with two explicitly supported audit families instead. Later families can join the same engine without changing their promised semantics; this checkpoint cannot claim their capabilities.

Raw pages validate retained posting metadata, inspected packing/order and canonical prefix boundaries. They rely on the sole writer's mandatory index-membership invariant; they do not reparse every kernel body or claim an exhaustive Store audit. Hydrated pages additionally reuse the existing checked occurrence joins. Files consumers must still decode the original anchor, validate its exact Type/position and resolve the Binding at H before displaying a current row. A raw anchor is never permission, currentness or a file value.

General audit posting counts are u48, unlike Binding's u32 revision count. The selected end search has at most48 bisection probes plus2 checked boundary probes; a resumed scan may inspect one predecessor, for at most51 boundary-only probes per call. Record boundary work separately from consumed coverage. This is a derived implementation bound to test, not a change to Binding's separate48-probe law or a new Codex constant.

---

### Task 1: Checked audit pages and one real managed directory inventory

**Files:**

- Create: `Reviews/2026-09-05-c0-core/src/AuditPageCursor.sol` — pure ordinary cursor encoding/context/validation.
- Create: `Reviews/2026-09-05-c0-core/src/StateAuditPages.sol` — qualified audit query classification, prefix search, scan, lifecycle projection and counts.
- Modify: `Reviews/2026-09-05-c0-core/src/QueryReadLibrary.sol` — three external-view forwards only; unchanged existing Binding methods.
- Modify: `Reviews/2026-09-05-c0-core/test/BindingReadHarness.sol` — change only `_requireQueryRead` visibility from private to internal, enabling reuse by the derived host.
- Create: `Reviews/2026-09-05-c0-core/test/AuditPageReadHarness.sol` — derived normal host with three guarded page/count methods; separate narrowly named synthetic setters for corrupt/sparse fixtures.
- Create: `Reviews/2026-09-05-c0-core/test/AuditPages.t.sol` — focused real/corrupt/boundary/cursor/no-write tests, not inheritance of an old test suite.
- Create: `Reviews/2026-09-05-c0-core/test/support/linked-read-host.mjs` — extract the existing closed compiler-link/runtime/immutable/deployment checks for both read hosts.
- Modify: `Reviews/2026-09-05-c0-core/test/binding-reads.test.mjs` — consume the extracted helper without dropping its existing tests, runtime guards, independent folds or measurements.
- Create: `Reviews/2026-09-05-c0-core/test/audit-pages.test.mjs` — independent managed state/cursor/lifecycle/size/gas tests.
- Report only, untracked: `.superpowers/sdd/audit-pages-plan/task-1-report.md`.

No other source/runner/codec/reference-reader/fixture edits. In particular StateStore, StateKernel, AdmissionLibrary, StatePointReads, StateBindingReads and the upgrade fixture remain unchanged. Query library bytecode will change; preserve the earlier pinned read evidence as historical rather than overwriting it.

**Interfaces consumed:**

```solidity
StateReadPrimitives.basis(s, requested, subject)
  // returns (bytes32 initialRevision, uint64 selectedH, uint64 currentH)
StateReadPrimitives.postingHead(s, postingKey, true, currentH, subject)
  // returns PostingHead(count,live,last), checked actual Store packing
StateReadPrimitives.postingAt(s, postingKey, head, position, subject)
  // returns checked uint64 ordinal
StatePointReads.hydrateOrdinal(s, ordinal, subject)
  // returns checked HydratedOccurrence with current status/revokedAtOrdinal
IndexKeys.posting(T, kind, indexOrdinal, valueKey)
IndexKeys.scope(principal, purpose, subject)
```

**Interfaces produced:** all types below belong to StateAuditPages. External methods omit `s`; their QueryReadLibrary forwards include the leading Store storage reference.

```solidity
enum Completeness { UNKNOWN, COMPLETE, PARTIAL, UNSUPPORTED }
struct PageRequest { uint256 cursor; uint16 maxItems; uint64 basisOrdinal; }
struct PageResult {
  bytes32 realmBasis; uint64 highWaterOrdinal; uint256 cursor;
  bytes32[] items; uint32 coverage; Completeness completeness;
}
struct HydratedItem {
  uint64 ordinal; bytes32 envelopeId; uint16 leafIndex; bytes32 recordId;
  bytes32 principalId; uint8 occurrenceStatus; uint64 revokedAtOrdinal;
}
error ErrIndexQueryUnsupported(bytes32 typeSchemaId, uint8 indexKind,
  uint8 indexOrdinal, bytes32 valueKey);
// AuditPageCursor owns error ErrPageCursor(uint256 cursor).
function pagePostings(StateStore.Store storage s, bytes32 T, uint8 kind,
  uint8 indexOrdinal, bytes32 valueKey, PageRequest memory req)
  internal view returns (PageResult memory);
function pagePostingsHydrated(StateStore.Store storage s, bytes32 T, uint8 kind,
  uint8 indexOrdinal, bytes32 valueKey, PageRequest memory req)
  internal view returns (PageResult memory, HydratedItem[] memory);
function counts(StateStore.Store storage s, bytes32 T, uint8 kind,
  uint8 indexOrdinal, bytes32 valueKey) internal view
  returns (uint64, uint64, uint64, bytes32, uint64);
```

#### Step 1 — capture a real initial-page RED

- [ ] Add compilable refusal stubs and a normal-host fixture using current candidate groups and real trusted admissions. Adopt existing setup helpers, not another Store/writer. New methods call the inherited query guard even when stubs refuse.
- [ ] Admit ObjectGenesis, then one first BindingTombstone or BindingSet. Compute Scope from the full Principal, purpose and subject; its kind10 posting key uses T0/ordinal0. Assert actual returned ordinal, initialized revision/H, exact terminal token and coverage:

```solidity
StateAuditPages.PageRequest memory req = StateAuditPages.PageRequest(0, 1, 0);
StateAuditPages.PageResult memory page = host.pagePostings(0, 10, 0, scopeKey, req);
require(page.items.length == 1 && page.items[0] == bytes32(uint256(anchorOrdinal)), "first Scope anchor");
require(page.realmBasis == init.initialRevisionId && page.highWaterOrdinal == currentH, "page basis");
require(page.coverage == 1 && uint8(page.completeness) == 1 && page.cursor == type(uint256).max, "complete page");
```

- [ ] Run `forge test --offline --use <cached-solc-0.8.30> --match-path test/AuditPages.t.sol -vv`; retain successful compilation and intended behavioral failure. Import/artifact failures are not the RED.

#### Step 2 — implement exact cursor and qualification

- [ ] Implement AuditPageCursor with no storage or external API. Pack the following unchanged transport; extraction masks fields, version must1, high reserved bit0. Valid resumed ordinary positions satisfy `0 < next < end`, selectedH is nonzero and below the u48 sentinel, and encoded end/context/H must exactly match recomputed values.

```solidity
cursor = uint256(nextPosition) | (uint256(end) << 48)
  | (uint256(H) << 96) | (uint256(1) << 144) | (contextTag << 152);
contextTag = uint256(keccak256(abi.encode(
  keccak256("efs2/pk/1"), realmId, realmBasis, uint256(1),
  uint256(mode), T, uint256(kind), uint256(indexOrdinal), valueKey)))
  & ((uint256(1) << 103) - 1);
// mode1 raw, mode2 hydrated. CURSOR_END is output only.
```

- [ ] Use computed postingKey as the `ErrReadState` subject throughout page/head/hydration joins. First perform initialized-state/initialRevision and retained-counter validation using `basis(s,0,key)`. For cursor0 validate requested H exactly as the existing basis helper. For nonzero cursor, zero requested basis, future H or H>=sentinel must yield ErrPageCursor before query classification. Then classify exact supported tuples; unsupported returns resolved revision/H, empty arrays, coverage0, cursor0, UNSUPPORTED without decoding token or reading posting metadata. For supported tuples only, decode cursor, check canonical prefix/end/context/positions, then scan. Counts uses current basis and same classifier, but reverts the exact unsupported error. A zero opaque valueKey is valid.

```text
require valid initialized state and initial revision
cursor==0: resolve/validate requested basis (ErrPageBasis)
cursor!=0: validate requested basis only (ErrPageCursor)
classify -> unsupported result / counts error
read checked audit head and canonical end
supported resume -> exact token checks (ErrPageCursor)
bounded scan -> COMPLETE or PARTIAL
```

#### Step 3 — implement bounded prefix and shared scan

- [ ] For an empty head use end0; for head.last<=H use end=head.count. Otherwise binary-search `[0,count)` using checked postingAt, comparing ord<=H; validate the resulting boundary (`end-1<=H`, `end>H` where physical). No unbounded fold or binary search per returned item. At most50 end-search/boundary probes and at most one scan-start predecessor; count these separately in the synthetic test instrumentation, with no new production probe API.

```text
lo=0, hi=count
while lo<hi:
  mid=lo+(hi-lo)/2
  if checkedPosting(mid)<=H: lo=mid+1
  else: hi=mid
end=lo
check physical boundary neighbors, retaining already checked values where useful
```

- [ ] Implement one raw/hydrated audit scanner. Allocate bounded arrays from `clamp(maxItems,1,512 or256)`; every consumed posting charges one coverage and advances once. Check every inspected word with existing packing/tail guards; all emitted ordinals are<=H and strictly increasing, including a resumed first item relative to its predecessor. Stop after item or scan limit, with no semantic consumption of the next item. Shrink arrays to actual count. Exhausted means COMPLETE/CURSOR_END, otherwise PARTIAL/exact next-position token; no successful UNKNOWN, gasleft guess, default-zero completeness or catch-and-partial after an EVM failure.
- [ ] Raw audit pages do not filter or hydrate. Hydrated audit pages call the existing checked hydration once per emitted ordinal, preserving full Principal and source joins; then project lifecycle:

```solidity
uint64 revoked = occurrence.revokedAtOrdinal;
bool withdrawnAtH = occurrence.status == 2 && revoked <= H;
row.occurrenceStatus = withdrawnAtH ? 2 : 1;
row.revokedAtOrdinal = withdrawnAtH ? revoked : 0;
// Existing hydration must already have rejected malformed current lifecycle.
```

- [ ] Forward the three methods through QueryReadLibrary and the new host, using `_requireQueryRead()` before all argument/state checks. Change only that guard's visibility in BindingReadHarness. No duplicated old host or per-method guard logic. Do not inherit SyntheticBindingReadHarness for the normal deployable host. Add synthetic setters only to a separate test subclass.
- [ ] Compile and measure actual Query library, host runtime and full constructor/initcode under normal limits before building a large matrix. If the selected layout cannot fit, return the measured failure to the parent; do not remove required methods, raise limits or invent a third library.

#### Step 4 — prove cursor, corruption, lifecycle and read-only behavior

- [ ] Raw/hydrated 0/1/2/511/512/513 item-limit and dense-page cases, noting hydrated clamp256. Empty supported key (including zero valueKey), unknown/disabled family, malformed tuple, maxItems0 and uint16max; exact byte lengths `256+32N` raw, `320+256N` hydrated.
- [ ] Exhaustive small ordered lists and H cuts with limits1/2/3 compare full cursor words/items/coverage/terminal flags against an independently encoded JS linear oracle. Include fresh writes and later withdrawals beside pinned-H continuation; H0/current versus explicit H and no initial entries. Resumed suffix never proves earlier pages absent.
- [ ] Token version/reserved/query/Principal/scope/mode/Realm/H/claimedEnd/zero/out-of-range position and CURSOR_END corruption; exact refusal ordering for unsupported+malformed token, unsupported+zero/future requested H, supported invalid H, uninitialized/corrupt counters and missing revision. Changed maxItems may resume the same mode/query; it is not part of the Core context hash.
- [ ] Corrupt audit flag/live/count/last/head reserved bits, posting high/tail/zero/sentinel/overlast, inspected disorder and bad hydrated occurrence joins. Raw audit checks physical index invariants, not hidden body/query membership; label that trusted-writer assumption explicitly. Validated hydration failures revert rather than dropping a row.
- [ ] First bind and first tombstone each add exactly one Scope anchor; same-role rebind/tombstone/withdrawal and failed CAS add none. Stale/current withdrawal retains all history and audit counts. Use two full-width Principals with equal low160 bits. Independently reconstruct the retained admissions/index and compare, not the getter under test.
- [ ] Sparse synthetic u48-near-maximum lists exercise the derived bisection/boundary bound and exact physical packing. Record actual posting SLOADs (including repeats) and distinguish a searched boundary from consumed coverage. Do not claim billions of admitted rows or complete synthetic Store verification.
- [ ] Forge ordinary CALL records zero Store/library writes for all three new methods; runtime substitution refuses before input/state errors. Normally deployed STATICCALL consumer returns identical page bytes, including a historical-H lifecycle case. Replacing helper code with reverting/absent code must not affect reads. No cache/body copying in raw pages; hydrated paths must not call Preparation.

#### Step 5 — managed host reuse, real inventory and costs

- [ ] Extract the existing closed `patch`, `links`, artifact provenance and normal linked deployment logic from binding-reads.test.mjs into the support helper. Preserve exact source/target matching, all link/immutable inventory checks, same-build AST mapping, complete runtime verification, all old ABI/refusal/fold assertions and normal limits. Accept only the two explicit host names BindingReadHarness/AuditPageReadHarness; both have the same six constructor arguments and inherited immutable definitions. Do not generalize this into a deployment framework or copy the entire setup into the new test.

```js
// Test-support contract, not a production API:
await withLinkedReadHost("AuditPageReadHarness", async (view) => {
  // view: lab, reader, iface, host, call, raw, publish, getters, report
  // call/raw preserve the caller's exact block-hash pin.
  // reader uses unchanged readState with all five expected component runtimes.
});
```

- [ ] Use candidate groups and real admissions for dense scopes1/8/64/256; continue to513 if normal bounded batched setup fits the managed test time budget. Set real batches to the measured fitting width instead of raising transaction gas. Every claimed real density must have retained independent readback. On a fixed verified block compare one-shot/requested pages, both modes and counts with the retained-posting oracle. Measure actual transaction gas, estimated gas separately, exact returndata bytes, component runtime/initcode/deployment gas, raw/hydrated request counts and source pins. Avoid wall-clock speed claims from noisy parallel local runs.
- [ ] Compare same-role churn with distinct-role churn on the real small fixture. A separate synthetic packed10,303-anchor index may test raw traversal of the known10,240-old+63-new geometry, explicitly labeled synthetic/raw-only. It cannot claim resolved Files performance, currentness or complete reconstruction; the real resolved dead-name falsifier remains the next consumer join.
- [ ] Save observations in the untracked task report (source commit/hash, compiler/settings, canonical source block, library/host resources, exact commands). Parent selects the durable evidence record after independent review. No overwrite of existing September8/9 baselines.

#### Step 6 — final regression, self-review and exact commit

- [ ] Force the exact full AST/build-info build once after final changes, then run focused AuditPages, all Core Forge and serial Core Node tests plus admission/type-input controls. Run the existing Binding Node test explicitly through the extracted helper; assert its prior measurement/guard inventory survives, but do not require old bytecode hashes for the intentionally changed Query library.

```sh
forge build --ast --build-info --force --offline --use <cached-solc-0.8.30>
forge test --offline --use <cached-solc-0.8.30>
node --test --test-concurrency=1 test/*.test.mjs \
  ../2026-09-05-c0-admission/integration.test.mjs \
  ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs
git diff --check
```

- [ ] Format owned files, read the full owned diff, append RED/GREEN/resource/coverage/warning/remaining-boundary evidence to the report, then commit only the listed source/test paths with normal v2-pm/codex/actual-model trailers. No worker push or docs changes.
- [ ] Return DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT, commit, test summary, concerns and report path. Parent performs task review, integration regression and final increment review; no worker subagents.

## Parent self-review / exclusions

This task covers the existing ordinary cursor, audit classification/refusal, Scope/history enumeration, hydrated historical lifecycle and current audit counts. The excluded read-overlay rows remain explicit work: live-filtered kinds, Type-declared classifiers, admission-log/unique-Type/digest aliases, authenticated Principal evidence, actual revision-at-H upgrade integration, Files/Lens selection, SDK aggregation and browser rendering. No all-eighteen capability claim follows. The next task must measure resolved churn and join the actual upgrade/Files consumer rather than treating raw anchor throughput as that result.
