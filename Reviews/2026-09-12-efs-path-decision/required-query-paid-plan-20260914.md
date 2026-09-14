# Required-query paid comparison implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Root coordinates this already-authorized experiment; no additional owner architecture decision is implied.

**Goal:** Execute and independently audit the frozen B-scan/B-selective/C discovery workload, pricing all required maintenance and every paid page rather than a cheap first page.

**Architecture:** One offline, source-derived state oracle and one finite transport/audit runner consume the independently reviewed input packet. Keep both under the existing B successor's experiment scripts; that shared runner targets three separate fresh deployments, not a new architecture. Neither component launches a chain, compiles, rewrites the sealed fixture, or learns expected values from candidate answers.

**Tech Stack:** Node ES modules, node:test and the existing ethers6 dependency; already-built Solidity0.8.30/Cancun/viaIR/optimizer200 artifacts. No new dependency or production code.

**Spec:** [[required-query-experiment-20260914]], [[required-query-state-recipe-20260914]] and the frozen logical/physical input documents retained with the reviewed packet. Input SHA256 `077f59b735d2ddb3fbd9c3d432f306b0f919929b20e9a6d5402459790e96788c`; local packet directory `efs-required-query-independent-inputs-20260914.EHNqIA` under the system temporary directory. The retained input review is [[required-query-input-review-20260914]].

## Global Constraints

- Disposable evidence only; no production repo/deployment, fourth architecture, normal-price remeasurement, schema adoption, feature waiver, old-run rewrite or prototype migration/deletion.
- Root owns publication and the single finite compiler/Anvil lease. Workers may run pure Node tests only: no compiler, RPC, chain, background process, commit, push or further delegation. Existing untracked files stay untouched.
- B source base `d547890e57fb0c1ba2ef4d9f8b18b519946197b8`; C source base `3f5702f1d7acc39c1d62a5b1a0795f3fe579ebce`. New scripts go in the preserved `planning-warroom-b-run` worktree. Do not change Solidity, artifacts, old runners or frozen prices.
- Exactly82 signed transactions and25 paid pages across B scan, B selective and C. Exactly21 deployments,11 other setup transactions,1 C Type publication,24 common publications and25 pages. Same EOA authors1/2 and unrelated paid caller3; no native-contract-author parity claim.
- Chain31337, genesis block0/timestamp1800000000, block gas30000000, legacy transactions at2000000000wei/gas, deploy15000000gas, setup/publication8000000gas, page5000000gas, deadline2000000000. These are experiment settings, not protocol limits or owner affordability thresholds.
- Retain raw JSON-RPC requests/responses before evaluating them; maximum8192 envelopes,67108864 total raw bytes,2097152 bytes per response,30000ms/request and12 receipt polls per transaction. No traces, unbounded retry or extra transaction after an ambiguous send. Local loopback only.
- Every body, ID, Type, signature, runtime, receipt/header join, state checkpoint, full Page/cursor and event commitment must match an independently fixed expectation. Missing/error/unknown never means empty, zero, or PASS. Evidence remains RPC-observed, not authenticated state proof.
- Oracle methods are transport-free and deterministic. Probe results are complete ABI byte strings; no wildcard, mask, only-count, or reported-boolean substitute. Use BigInt for chain quantities and monetary/gas totals; persist decimal strings. The exact sealed fixture's structural counters/indices may remain Numbers (admissions at most28, app nonces7, scheduled transactions82); this is not a reusable arbitrary-uint64 oracle. Packed words/ABI quantities remain exact, and the later runner must not use Number for gas/cost arithmetic.
- Source-derived C differences are intentional: coverage API synthesizes the frontier from Ledger high-water while raw coverage through remains0; no B-style binding-live backlink counter; shared HEAD scope; nonces store last accepted rather than next; evidence basis is prior admission high-water rather than publication block. Preserve these distinctions in results.
- Frozen-spec correction: C, not B, has the stricter maximum magnitude (10^10 versus uint128 maximum). B is stricter about the note. All frozen literals satisfy both; no frozen input or signature changes.
- `launchReady=false` stays false in the offline input. Root must issue a separate exact, time-limited permit only after source/input/review gates pass. This plan is not that permit.

## Shared interfaces and checkpoint schedule

All relative script paths below are under `Reviews/2026-09-12-efs-path-decision/lab-b/script/` in the B successor. Resolve ethers with the existing `EFS_ETHERS_PATH`/createRequire pattern. Tests receive the exact retained JSON through `EFS_QUERY_INPUT`; they never regenerate it from candidate output.

```js
// A complete literal eth_call expectation, with no transport or block baked in.
// Probe = {label: string, to: address, data: hex, expected: hex}
export function buildInitializationChecks(input, armName, options = {typesAdmitted: true}) {}
export function buildStateChecks(input, armName, commonCount, options = {typesAdmitted: true}) {}
export function buildPublicationChecks(input, armName, publicationName) {}
// Each returns Probe[]. armName is bScan | bSelective | c; commonCount is0..8.
// C typesAdmitted=false is legal only at commonCount0; B requires true.
// Stable labels within one array; runner qualifies labels by phase/block.
// Initialization: attachment/layout/Type profile checks.
// State: current counters/nonces/Records/heads/scopes/complete posting inventories.
// Publication: new Admissions, acceptance/evidence and publication-identity rows.

export function buildRunPlan(input) {}
// Returns {steps, expectedTransactions:82, expectedPages:25,
//          maximumRequests:number, maximumRawBytes:67108864}.
// steps enumerate exact tx, runtime, initialization/state/publication/page probes.
// No send occurs unless the complete offline inventory fits maximumRequests<=8192.

export function auditTranscript(input, runPlan, transcript) {}
// Pure replay: returns checked counts, per-arm cost partitions and evidence grade;
// throws on any required missing, duplicate, mismatched or extra observation.
// Never trusts an emitted run summary or PASS flag.
```

After B setup block12/47, check initialization and state0. After C attach block65, check initialization/state0 with typesAdmitted=false; after C Types block66, check its publication rows and state0 with true; after reader/consumer deployment block68, check Type/profile initialization with true. Check new publication rows plus complete current state after each common publication, including old/current seals at common7/8. Before the first paid page, the verified common8 snapshot is the pre-state. After every paid page, repeat the complete current-state snapshot; that verified post-state is the next page's pre-state. Do not redundantly reread every old admission/evidence row at each page: those immutable rows are checked at their publication. This keeps exact state inventories distinct from publication deltas and within the finite envelope budget.

Each paid page has exact consumer eth_call before submission at the preceding numbered block and after mining at its receipt block, both from paid caller3 with sealed gas. Compare complete literal Page bytes and mined PageRead address/topic/data. Page cursors come only from the input packet. No additional mined setup, timestamp mutation or probe action: block timestamps need only be monotonic from sealed genesis and remain before the deadline. Retain all83 parent-joined headers and all82 signed transports/receipts/transactions. One transaction per block is an asserted schedule property. The thousands of independent checkpoint probes are test-harness audit overhead, not a claimed browser discovery workload. Report them separately from paid page gas, returned Page bytes and source-derived reader operations.

Permit schema is `efs-required-query/local-permit/1`: `{schema,inputSha256,sourceSha256,rpcUrl,notBeforeMs,notAfterMs,chainId,genesisTimestamp,blockGasLimit,maxRequests,maxRawBytes,maxResponseBytes,requestTimeoutMs,maxReceiptPolls}`. `sourceSha256` is the exact path-to-SHA256 map of the state oracle, runner, audit and any actual local runtime dependencies, with no missing or extra dependency; freeze the real inventory at review. Values for chain/limits are the Global Constraints; time fields are finite safe-integer Unix milliseconds, notAfter strictly later than notBefore and at most30minutes later. `assertPermit` compares the supplied freshly hashed `sourceHashes` map exactly, all settings, input hash and the normalized URL, and requires `notBeforeMs <= nowMs < notAfterMs`. All independently pinned input-source/artifact/helper files are separately rechecked against input.source before the first request. Root keeps the permit in the owned run directory; a documentation example is not a usable permit.

### Task 1: Literal raw-state checkpoint oracle

**Files:**
- Create `required-query-state.mjs`.
- Create `required-query-state.test.mjs`.
- Read exact B Ledger/TypeRegistry/IndexModule/Keys and C LedgerTables/IndexTables/ActionLib/IndexModule named by the state recipe; no edits there.

**Interfaces:** Consume the reviewed input and the source recipe. Produce `buildInitializationChecks`, `buildStateChecks` and `buildPublicationChecks` exactly as above. Initialization must not query Types before C Types admission. State includes all18 named data Record rows, including absent zero rows until first admitted; C Type Records are additional when admitted. All relevant list contents and occurrence counts are included, not just their heads.

- [ ] **Step1: Add failing literal-golden tests before implementation.** Use the real retained input, ethers ABI encoding and hard-coded checkpoint expectations, not an oracle-generated snapshot copied back into tests.

```js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {buildStateChecks} from './required-query-state.mjs';
const require = createRequire(import.meta.url);
const {AbiCoder} = require(process.env.EFS_ETHERS_PATH ?? 'ethers');
const abi = AbiCoder.defaultAbiCoder();
const input = JSON.parse(readFileSync(process.env.EFS_QUERY_INPUT, 'utf8'));
test('B old seal is21 admissions,16 Records,2 bindings,7 publications', () => {
  const checks = buildStateChecks(input, 'bScan', 7);
  assert.equal(checks.find(p => p.label === 'counts').expected,
    abi.encode(['uint64','uint64','uint64','uint64'], [21,16,2,7]));
  assert.equal(new Set(checks.map(p => p.label)).size, checks.length);
});
test('reject impossible C pre-Type checkpoint', () => {
  assert.throws(() => buildStateChecks(input, 'c', 1, {typesAdmitted:false}));
});
```

Run `node --test .../required-query-state.test.mjs` with the two explicit environment paths. Retain intended initial missing-module RED, then real semantic failures as tests expand. No Forge or chain.

- [ ] **Step2: Implement the three pure probe compilers from action order.** Derive current state by folding only executed sealed publications, preserving fresh Record identity on reuse. Encode exact ABI results, B48-bit ordinal packed words and C15 raw Store layouts from the recipe. Define one strict probe helper:

```js
function probe(label, iface, signature, to, args, values) {
  return {label, to, data: iface.encodeFunctionData(signature, args),
    expected: iface.encodeFunctionResult(signature, values)};
}
```

Require valid arm/checkpoint/publication, fresh unique labels, exact field widths and known action kinds; reject malformed input instead of omitting rows. Calculate B per-author scope, binding history and old target live-count decrement on A1→A2. For C, encode one shared scope, unique-Record backlinks/ByType, all-kind ByAuthor, Types metadata/Records/Occurrences, and raw versus synthesized coverage separately. Derive expected Type registration blocks and each publication's signature/evidence basis from the sealed schedule. Do not invent C counters absent in source.

- [ ] **Step3: Extend literal adversarial tests and obtain GREEN.** Cover every common0..8 state on allarms; B `(0,0,0,0)` to `(24,18,2,8)`, A/B next6/2, A1/B1 occurrences2/2, A3 absent at7/present8, terminal Quote ordinals including reuse, selective P3→4 and Q8→9, Bscan undeclared reference coverage; B HEADs/history/backlink count/live; C Types highwater0→4 then25→28, lastnonces7/2, shared scope2triples, P4→5 with non-Quote R1, Q8→9, Item backlinks[P,Q], Quote ByType11→13. Check every B acceptanceBasis and both evidence-basis conventions. Assert C raw coverage `(true,true,0,0)` differs from API `(1,currentHighWater)` and absent B-style live counter remains a stated gap. Include malformed action/checkpoint/unknown-name errors and complete dynamic ABI padding, packed field widths and ordinal-endianness goldens. Tests must not call candidate contracts or readers.

- [ ] **Step4: Self-review and report.** Run focused Node tests and `git diff --check`. Report exact command, RED/GREEN log paths, files, exported interface, probe counts for each checkpoint, unresolved scope differences. Root independently reviews and stages exact files; worker does not commit. Task2 waits for this review gate.

### Task 2: Finite signed runner and raw-transcript audit

**Files:**
- Create `required-query.mjs` (CLI, finite plan and raw transport).
- Create `required-query-audit.mjs` (pure protocol/transcript assertions).
- Create `required-query.test.mjs` and `required-query-audit.test.mjs`.
- Consume the reviewed Task1 functions; no changes to independent inputs, Solidity, artifact/helper pins or old scripts.

**Interfaces:** Produce `buildRunPlan(input)` from runner and `auditTranscript(input,runPlan,transcript)` from audit. Runner CLI is `node required-query.mjs --input <JSON> --permit <JSON> --rpc <loopback URL> --out <new empty directory>`. Test imports must have no CLI side effect. Transcript is an ordered array of `{id,label,request,responseText,responseBytes,status}`; labels identify exact scheduled phases. Retain raw signed bytes in input and raw response strings in transcript. A failed request still produces a retained entry and a failure report, not a truncated success journal.

- [ ] **Step1: Test refusal/strict replay before implementing sends.** Export pure `assertRpcReply(request,response)` and `assertPermit(permit,inputSha256,sourceHashes,rpcUrl,nowMs)` from audit. Require exact JSON-RPC2.0/id and exactly one result/error; errors, null for required results, malformed hex/quantities and malformed JSON fail. The sole null exception is `eth_getTransactionReceipt`: allow0..11 exact-ID null pending replies followed by one matching non-null receipt, at most12 polls total. Null stays fatal for every other required observation. Poll labels include their attempt number; plan maximumRequests budgets12, replay accepts only the consumed bounded prefix and rejects skipped polls or any poll after the terminal receipt. Exhaustion without a receipt is failure, not completion. Permit must exactly match input/source/runtime pins, URL, chain settings, 8192/64MiB bounds and a finite notBefore/notAfter window; missing permit fails even though inputs are complete.

```js
test('JSON-RPC ID and result/error ambiguity fail closed', () => {
  const req = {jsonrpc:'2.0', id:7, method:'eth_call', params:[]};
  assert.throws(() => assertRpcReply(req, {jsonrpc:'2.0',id:8,result:'0x'}));
  assert.throws(() => assertRpcReply(req,
    {jsonrpc:'2.0',id:7,result:'0x',error:{code:-1,message:'bad'}}));
});
test('a complete input is not permission to use RPC', () => {
  assert.throws(() => assertPermit(null, 'a'.repeat(64), {}, 'http://127.0.0.1:1', 0));
});
```

Run the two focused Node files and retain the failing implementation-missing/behavior logs. Build the exact finite call map before any network access; count its worst-case12poll schedule and reject caps exceeded.

- [ ] **Step2: Implement one bounded transport path.** SHA256-check the input and all source/artifact/helper pins, decoded signed tx schedule and exact82/25 counts. Reject a nonempty output directory, non-loopback endpoint, expired permit or dirty relevant source before sending. Verify chain ID, genesis0/timestamp, block gas limit, zero account transaction nonces and balances sufficient for the signed envelope maxima. Never change accounts, fund them, alter signed gas or raise a block limit to get green. Recheck permit time before each request/send.

```js
// Representative fail-closed order; actual transport enforces all finite caps.
const rawText = await response.text();
transcript.push({id, label, request, responseText:rawText,
  responseBytes:Buffer.byteLength(rawText), status:response.status});
persistRawBeforeChecking(transcript);
const reply = assertRpcReply(request, JSON.parse(rawText));
// Compare reply.result to the literal scheduled value before advancing.
```

The actual response body must be streamed with a2097152-byte cap before allocating an unbounded string; retain bounded prefix/failure metadata on overflow. Count raw request plus response bytes against64MiB. Use AbortSignal timeout30000ms, max12receipt polls and no silent retries of ambiguous send. Only `eth_sendRawTransaction` with presealed bytes is permitted for mutations; no unlocked send, timestamp setting, debug trace or fallback execution. A root wrapper owns Anvil startup/prune256/run cache/finite watchdog and unconditional termination; this script cannot launch one.

- [ ] **Step3: Check chain effects and whole workload.** For every tx, assert hash/signature/from/to/input/value/type/nonce/gas/gasprice/chain against its signed envelope; require exact block/transaction index0, status1, receipt gasUsed bounded by signed gas, effective gasprice, cumulative gas, and one-transaction block header parent joins. Compare runtime code at each deployment's receipt block to the entire independently instantiated bytes, including links/immutables. Capture all initialization, publication and state probes at their exact receipt basis. For each page compare the pre/post-call complete encoded Page and the mined event's exact consumer/address/topic/data; no candidate cursor is input. Record all actual gas and transport/ABI bytes and independently reconstruct per-arm deployment/setup/Type-publication/common-write/old-page/current-page partitions. Keep source-derived logical header/body counts and raw checkpoint-RPC counts distinct from unmeasured internal call counts. No trace-derived physical-call claim.

- [ ] **Step4: Test transcript corruption and replay independently.** Pure audit must recompute its required observation inventory from input/plan and replay retained raw requests/responses, not accept runner PASS fields. Test missing/duplicate observations, wrong chain/genesis/runtime/receipt sender or calldata, header-parent/basis mismatch, wrong Page field/cursor/log commitment, changed nonce/Record/head/list/coverage after a paid page, and absent result/error/null. Use deterministic small validator examples and controlled local HTTP transport only for cap/timeout/ambiguous-send tests; tests never start a blockchain. Verify no second send follows an ambiguous response, no writes on missing/expired permit, and no body-cap bypass. Full successful82tx chain replay is reserved for root's later evidence gate, not fabricated with test-generated success booleans.

- [ ] **Step5: Root review and one finite execution.** Self-review/report focused Node tests, exact offline request ceiling, file hashes and all unrun chain gates. Root task review and whole-plan review precede an exact runtime permit and new finite heavy lease. Once permitted, root runs exactly one82tx attempt, independently audits raw output and checks disk/process cleanup. Failures are retained and triaged, never a pretext to loosen the frozen fixture. Root publishes observed results with all cost partitions and gaps; no new product prices or architecture adoption. Preserve scratch evidence and the original Claude worktrees.
