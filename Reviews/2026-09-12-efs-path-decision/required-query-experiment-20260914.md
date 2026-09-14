# Bounded incoming-Quote discovery experiment

> September 14, 2026: experimental design with B source/unit gate completed; C implementation and paid comparison remain outstanding. No protocol adoption or owner requirement waiver. Root coordinates tests and publication in the preserved B/C successors.

**Goal:** Price the same bounded query over unique retained Quote Records first admitted at or before a named admission high-water.

**Domain:** `incomingQuotes(pair,basis,budget,cursor)` returns Record IDs, not authored occurrences, current nonzero occurrences, binding backlinks, or Lens-selected heads. A withdrawn-to-zero Record and historical selected/unselected revisions remain eligible. The positional role is exactly checked reference ordinal `0`; this does not claim named roles, nested references, current validity, or arbitrary graph closure.

**Inspected pins:** B worktree HEAD `acbfaf70339b73cd03e937158dd015eb37491b21`; C worktree HEAD `84e1081e46163547e2928c12a4551233e8f07afc`. Required-gap and provisional-recommendation documents remain the governing scope.

## Common ABI and bounds

Add the same interface in each new reader:

```solidity
struct Cursor {
  address reader; address ledger; bytes32 ledgerCodehash; address index; bytes32 indexCodehash; bytes32 realmOrigin;
  bytes32 sourceType; uint8 referenceOrdinal; bytes32 target;
  uint64 basisAdmission; uint64 moduleGeneration; uint64 position;
}
struct Page {
  bytes32[] records; uint32 scanned; uint32 headerReads; uint32 bodyReads; uint64 rawTotal;
  uint8 status; Cursor next;
}
function incomingQuotes(bytes32 pair, uint64 basis, uint32 budget, Cursor calldata cursor)
  external view returns (Page memory);
```

Reader constructor pins actual `ledger`, actual `index`, their independently expected runtime codehashes, exact `quoteType`, exact `pairType` and expected Quote-rule codehash; recheck both live codehashes on every call. B must require `ledger.indexModule()==index && index.ledger()==ledger`; C must require `ledger.index()==index`, `ledger.indexCodehash()==expectedIndexCodehash`, `index.ledger()==ledger`, and `index.ledgerCodehash()==expectedLedgerCodehash` (`C Ledger.sol:30–37`; `IndexModule.sol:35–39,75–89`). Constants are `UNKNOWN=0`, `PARTIAL=1`, `COMPLETE=2`, `REFERENCE_ORDINAL=0`, `MAX_PAGE_BUDGET=64`. Reject `budget==0 || budget>64`, invalid basis/Pair/counts, failed attachment/runtime checks, and a nonzero cursor whose reader/ledger/ledger-codehash/index/index-codehash/canonical realmOrigin/type/ordinal/target/basis/generation differs. `reader=address(this)` prevents same-ledger/index scan↔selective cursor replay. Both Ledgers expose `realmOrigin()` (B `Ledger.sol:815`, C `Ledger.sol:60`); actual addresses prevent reuse across same-code instances. A zero cursor starts at position0 and returns every commitment populated.

Every raw candidate consumes budget even when filtered. `records.length <= budget <= 64`; hand-check `abi.encode(Page).length <= 4096` for the maximum page. `headerReads` counts logical loop lookups returning only fixed admission/Record metadata; `bodyReads` counts logical loop lookups returning body bytes (disjoint, not a generic “hydrated” score). One C header lookup uses two external static-field calls, unlike one B admission call. The runner separately records actual external call/byte costs, exact preflight selectors/calls (high-water, Pair, Type, coverage, generation/codehash) and posting head/slice calls per page. `PARTIAL` means more candidates at/before basis may remain or family coverage cannot prove the basis. `COMPLETE` is allowed only after ascending postings are exhausted through `basis` and family coverage is complete through at least `basis`. A charged future first-admission is a terminal sentinel because postings are append ordered. Pagination at an old basis executes against current contract state and retained first-admission/body rows; it is not `eth_call` at a historical block.

## B scan arm (current index, no selective maintenance)

Terminal cursor convention: COMPLETE retains every identity/domain/basis/generation commitment and sets `next.position` to observed current `rawTotal`, including early future-sentinel termination. `scanned` still counts only examined candidates. PARTIAL returns the next unexamined position; exhausted incomplete coverage remains PARTIAL at `rawTotal`. Never return the all-zero restart cursor on completion. This does not claim a caller-supplied cursor proves that the caller consumed earlier pages.

**Create:** `lab-b/src/IncomingQuotesReader.sol`; `lab-b/test/IncomingQuotes.t.sol`.

Both B reader constructors prove the exact Quote descriptor, one Pair reference, mandatory rule/codehash and `QuoteAcceptor.BODY_LENGTH()==160`. Each page's Pair preflight uses existing `Ledger.record`; because Pair's rule is only a minimum, its body may reach `MAX_BODY=8192`, so charge a worst-case 8,352-byte ABI reply separately from Page returndata. `BScanIncomingQuotesReader` reads `Keys.byTypeList(quoteType)`. For each admission ordinal: stop at the first ordinal above basis; count `Ledger.admission` as one headerRead (`PUBLISH`: derive ID from `a` body hash; `REUSE`: `a` is ID); count `Ledger.record` as one bodyRead; emit only when `record.firstAdmission == ordinal`, exact bounded Quote body length is160, and body word0 equals Pair. The first-admission test removes legitimate same-body reuse duplicates across pages without caller-supplied seen state. Ignore current `occurrences` and every binding head. Terminal status additionally requires `FAMILY_BY_TYPE` complete through basis.

No B Ledger, TypeRegistry, Keys, Interfaces or IndexModule change is needed for this arm.

## B selective arm (one generic positional profile)

**Modify:** `lab-b/src/Keys.sol`; `lab-b/src/IndexModule.sol`.

**Create:** `lab-b/src/SelectiveReferenceIndexModule.sol`; add selective cases to `lab-b/test/IncomingQuotes.t.sol`.

- `Keys.sol`: reserve unused posting kind `11`; add `referenceList(bytes32 sourceType,uint8 ordinal,bytes32 target) = posting(sourceType,11,ordinal,target)`.
- `IndexModule.sol`: change only `_declare` and `_append` visibility from `private` to `internal`; leave all existing family branches, keys, counters and `_release` logic byte-for-byte otherwise.
- `SelectiveReferenceIndexModule(ledger,sourceType=QUOTE,referenceOrdinal=0,pairType,expectedShape,expectedRuleCodehash)` inherits `IndexModule`. The measured positive fixture deploys after the exact Quote Type is registered but before any Ledger admission. Late construction is allowed only with existing honest PARTIAL coverage, not a backfill claim. Constructor uses `TypeRegistry.descriptor/refTypes` (`TypeRegistry.sol:163–185`) to require one reference of `pairType`, recompute the exact Type ID, require mandatory acceptor codehash=`ruleId=expectedRuleCodehash`, and require the code-pinned `QuoteAcceptor.BODY_LENGTH()==160` (`LabAcceptors.sol:18–32`); then declare mandatory `FAMILY_REFERENCE_POSITION` from `attachedFrom`.
- Override `onAdmission`: call `super.onAdmission` first; only for publish/reuse effects of configured `sourceType`, hydrate `Ledger.record` (`Ledger.sol:834–841`); require returned Type, exact 160-byte body and first admission. When `firstAdmission == effect.admission`, read the configured 32-byte B leading-reference word and `_append(Keys.referenceList(sourceType,0,target), firstAdmission, true)`. Dedup/reuse never appends. A failure reverts the whole publication.
- `BIndexedIncomingQuotesReader` uses that target-specific first-admission list. For each ordinal it performs one headerRead via `Ledger.admission`, requires kind PUBLISH and `b==quoteType`, derives the Record ID from the retained body hash, and emits it without a bodyRead: the exact mandatory module/codehash and key already establish `(Quote,ordinal0,Pair)` membership. Terminal status requires `FAMILY_REFERENCE_POSITION` complete through basis.

`Ledger._bodyOf` rejects REUSE of an absent Record (`Ledger.sol:511–527`), and `_admitRecord` writes `b=typeId` on PUBLISH (`Ledger.sol:555–570`), so a selective first-admission row is sufficient to derive the ID. This changes no B Ledger, TypeRegistry, `Effect`, `onAdmission` selector or callback calldata. Only after the constructor's exact codehash/descriptor checks and the per-record 160-byte assertion is callback-side `Ledger.record` bounded to a 320-byte ABI reply; never infer that bound from `refTypes` alone. This is one configured profile, not a fourth architecture. Preserve B binding-target live-count maintenance in `IndexModule.onAdmission/_release` (`IndexModule.sol:95–115,166–175`). The new retained-Record family has no withdraw release; its `live` word is not current validity.

## C current-postings qualification arm

**Modify:** `lab-c/src/tables/LedgerTables.sol`. **Create:** `lab-c/src/IncomingQuotesReader.sol`; `lab-c/test/IncomingQuotes.t.sol`.

Do not change C `IndexModule` or table schema. Add `Records.getHeader(IStoreRead,id)` using only static Type/first-admission fields (`LedgerTables.sol:41–101`). Add bounded `Types.getOneRefHeader`: first require `getDynamicFieldLength(...refTypes)==32`, then read the three static fields and exactly one 32-byte dynamic slice; never call current `Types.get`, which copies the whole array (`LedgerTables.sol:407–482`). Read IDs from `Backlinks.length/slice(index,pair)` (`IndexTables.sol:163–194`). For each source ID, count one headerRead; stop on `firstAdmission>basis`, skip non-Quote Types, and emit exact Quote IDs without any bodyRead. Once per call, the bounded Type helper proves exact registered source Type, exact expected/current mandatory acceptor codehash and sole ref Type=`pairType`. C's pinned mandatory `_index` (`IndexModule.sol:110–129`) appends only `fresh` source IDs under each checked `e.refs[k]`; for this exact one-reference Quote Type, Backlinks membership establishes ordinal0=Pair. Do not parse or reject bodies: `Ledger.decodeBody` is only `abi.decode` (`Ledger.sol:82–84`), `ActionLib.canonical` retains supplied bytes (`ActionLib.sol:276–297`), and valid admissions may have trailing/noncanonical framing. Map coverage into common values and pin generation. This IDs-only alternative is reviewer-confirmed but remains unimplemented pending root gate.

## Fixed fixture and expected cardinalities (seal before measurement)

**C count clarification:** target postings can outnumber admissions when other
Types repeat a checked target in multiple references. Do not import B's stricter
count/high-water constraint. Bound length to the uint64 cursor domain and slice
by budget; repeated filtered sources have nondecreasing first-admission order.
A real-admission auxiliary must make rawTotal exceed highWater and still charge
every candidate without emitting non-Quote IDs. Exact one-reference Quotes are
fresh-indexed once; this adds no schema or corrupt-index repair promise.

Create Items and target Pair `P`, unrelated Pair `Q`, and a non-Quote Type whose ordinal0 also expects Pair. In this exact Quote-admission order: `U1(Q), A1(P), U2(Q), A2(P), reuse(A1), U3(Q), B1(P), U4(Q), U5(Q), U6(Q), U7(Q), U8(Q)`. A binds HEAD to A1 then A2; B binds HEAD to B1. Publish one fresh non-Quote `R1(P)`. Seal `basisOld`. Then publish `A3(P), U9(Q), reuse(B1)` and seal `basisCurrent`.

Expected unique results: old `{A1,A2,B1}`; current adds `A3`, regardless of output page boundaries. Observed current `rawTotal` after the tail is B scan/selective/C=`15/4/5`; old-basis eligible counts are `12/3/4`, and the charged future sentinel makes old-basis scanned totals `13/4/5`. Current-basis scanned totals are `15/4/5`. C's fourth old entry is `R1` and must be header-filtered. HEAD history and reuse do not change either expected set. C has no withdrawal kind (`EfsTypes.sol:13–17`; `ActionLib.sol:214–225`), so no matched withdrawal is fabricated. A separate B-only, non-costed auxiliary publishes/reuses Record Z, withdraws each author's occurrence to zero via `Ledger._applyWithdraw` (`Ledger.sol:694–719`), and requires both B readers still return Z; C reports this auxiliary **UNSUPPORTED**, not pass, parity, or zero cost.

**Precommitted measurement budget:** `budget=2`, at most `8` pages, at most `16` cumulative raw candidates, at most `4` returned unique IDs. Execute every page to terminal status; expected worst cases are B scan `7` old-basis pages (future sentinel) and `8` current pages, B selective `2/2`, C `3/3`. Any extra page, scan, duplicate, missing ID, premature COMPLETE, or terminal PARTIAL fails the run.

These are experimental safety/comparison bounds, not protocol maxima, affordability limits, gas targets, SLA promises, or owner acceptance thresholds. Report deployment/setup separately; charge every publication/index write and every paid page transaction, hydration and return byte. Compare complete workload totals, never first-page gas alone.

## TDD and failure gates

1. Write common behavior tests first against absent readers: exact set/order-independent commitment, same-body reuse (production fresh-posting invariant), unrelated Quote filtering, non-Quote C filtering with headerReads but zero bodyReads, an admitted C Quote with valid decoded refs/payload plus trailing/noncanonical outer bytes, old-basis result on current state, same-ledger/index cross-reader cursor rejection plus mismatch for every instance/domain field, budget/returndata bounds, PARTIAL then terminal COMPLETE, and incomplete/gapped coverage never COMPLETE. Keep zero-occurrence only in the labelled B auxiliary.
2. Implement B scan reader; run its focused Forge filter. Then implement the selective Index/reader; re-run existing B index/rollback/full tests. Explicitly assert binding backlink `count/live` across bind q1, rebind q2, unbind while incoming retained records stay unchanged.
3. Add a max-action callback test with distinct configured Quote targets under the existing `INDEX_GAS_BASE + INDEX_GAS_PER_ACTION*n`. Do not raise the bound speculatively: if it returns `E_INDEX`/`E_GAS`, retain RED, measure the minimum reviewed bounded change, and regenerate obligation/signature fixtures.
4. Implement C IDs-only reader against existing postings/static headers; run focused then full C tests. Mutation negatives: wrong source Type, a configured Type whose Pair is only at another ordinal, future admission, changed generation, and C coverage unavailable. Exact Quote postings cannot duplicate (`fresh` plus one ref); position-only cursors do not claim to detect/deduplicate arbitrary corrupt-index repeats across pages.
5. Create narrow `lab-{b,c}/script/required-query.mjs` plus `.test.mjs` rather than modify normal runners; use a test-only paid consumer in each `IncomingQuotes.t.sol` artifact with the common ABI. Before chain use, independently derive IDs, posting orders, old/current bases, page outputs and status transitions. The root-owned runner sends each page from the same unrelated paid caller, retains signed tx/receipt/header/raw replies, and sums all page plus write-maintenance gas. No result is published until source/input/output reviews reconcile.

Likely failures: selective module attached after admission1 (honest PARTIAL); constructor before Quote registration; wrong runtime/reciprocal attachment; callback OOG; cursor replay across reader/target/type/origin/generation; unbounded Type metadata; `uint256` posting length truncation; future rows counted as basis rows; reuse duplication; current occurrences or HEADs accidentally filtering retained history; C accepting `R1`; returndata above4096; and claiming COMPLETE from current high-water without basis coverage.

## B source/unit gate,03:01 UTC

Source `d547890e57fb0c1ba2ef4d9f8b18b519946197b8` is pushed on the existing
`codex/efs-warroom-b-run` experiment branch, not merged into planning/main.
Five planned files only; no Ledger/registry/callback allowance changes.
The intended missing-implementation RED preceded01:59 focused16/16 and full79/79
Forge passes;47/47 existing Node tests also passed, no skips. Independent review
checked the complete five-file snapshot and named Ledger/index/profile links:
spec PASS, quality PASS, no actionable findings. Root verified reviewed SHA256
and compiler-source hashes before publication.

Coverage includes historical/unselected unique records, old basis after current
tail, all cursor fields, late/gapped/unknown coverage, existing live backlink
maintenance, B-only withdrawal to zero, actual64-ID Page size2688bytes, and a
64-action/distinct-target callback under unchanged limits. The max-action unit
gas44,227,867 includes64-Pair setup and is not a publication price or block test.

Solc0.8.30/Cancun/viaIR/optimizer200 artifacts: both readers8955runtime bytes,
selective index5188, paid consumer1717runtime/1743init. Oversized test-harness
initcode warnings are retained. Local logs: `efs-required-query-b-green-20260914.G8M9Z4`
temporary run directory; review/worker reports in the plan's ignored SDD workspace.
C conformance, whole-delta review, sealed physical fixtures and receipt-backed
complete query/maintenance cost remain unearned. Frozen product rows are unchanged.
