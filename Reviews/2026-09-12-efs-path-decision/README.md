# EFS path decision — a 24–48 hour Codex / Claude sprint

**Date:** 2026-09-12

**Coordinator:** @v2-pm, Codex

**Standing:** active engineering war room, launched by James on September 12. Codex coordinates its agents; James's existing Claude **EFS v2 Dev** task has received and acknowledged the kickoff and is asked to coordinate the Claude lanes. No permanent requirements or protocol bytes are frozen; production repositories/deployment remain out of scope.

**Outcome:** recommend an architecture we can begin building, with its costs, actual sacrifices and remaining gates plainly visible. Not a claim that a century-scale foundation can be proved in two days.

## The proposal in one minute

**Scope correction, James, September 12:** do not build another EAS implementation; that is the v1 route. The reuse candidate is **MUD**. Earlier launch wording that offered EAS as Road C is superseded for this sprint.

Compare three roads: improve the fuller EFS model, build a smaller implementation of the important EFS promises, or reuse MUD underneath a thinner EFS layer. Any road may win; a hybrid must explain precisely what it borrows and stores.

Use **two Claude lanes initially**, managed from the existing EFS v2 Dev task, alongside Codex and bounded internal specialists. James authorized the leads to create and coordinate useful agents; he need not launch each conversation or relay routine messages. Develop three architecture proposals, then extend **at most two** into comparable disposable proofs. Deliver a provisional recommendation after 24 hours; spend the second day on the strongest unresolved alternative and the integrated finalist. Finish with **one primary implementation direction**, not three indefinitely maintained products. If no candidate is eligible, name the specific blocking result instead of forcing a winner.

The crucial missing measurement is the cost of **the same useful guarantees**, not another comparison between the richer model and a cheap implementation that leaves some guarantees out. No feature is waived merely because the existing prototype omits it.

The strengthened [[overhead-and-selection|overhead and selection protocol]] is part of this mission: classify actual feature costs versus implementation waste, test shared-cost interactions, charge reads/reconstruction as well as writes, and pass one joined finalist gate. It supports a decision-grade price for named workloads—not a proof of the cheapest possible design or a guarantee of future gas prices.

## 1. Start from outcomes, not today's machinery

These are the starting requirements, traced to the current [[../../Designs/efsv2/owner-rulings|owner rulings]] and [[../../Designs/efsv2/system-constitution|constitution]]. A lane may make a clear case to change one; only James accepts that sacrifice. Existing held mechanism questions remain held unless a concrete finding makes them necessary.

| Outcome to preserve or explicitly challenge | Ordinary example |
|---|---|
| Portable data identity, stable File identity and independently checkable authorship | Keep a document and its history usable on another deployment without trusting the copier. Content identity, author evidence, source admission and destination authority are separate claims. |
| Useful Types, checked references and mandatory developer acceptance | A game rejects an invalid outfit; direct calls, imports and deduplication cannot bypass its required rule. Acceptance at a particular time does not promise validity under every future game rule. |
| Contract-usable Files, paths and selected values | One contract publishes `/swaps/eth-usdc`; an unrelated contract reads it without an off-chain service approving the answer. |
| Independent authors, Lenses, history and practical file operations | Two communities select different revisions; rename, move and removal do not silently erase evidence or expose a previously hidden result. |
| Required discovery plus configurable extra indexes | Folder listings and promised tag queries cannot silently omit an accepted write because its writer skipped indexing. A later optional index reports its actual coverage. |
| Independent access, extensibility and honest missing data | A static browser can use a fresh qualifying Realm without an EFS-operated server. Missing bytes, partial queries and encrypted content are not empty folders. Old readers can use explicitly compatible projections. |
| Understandable APIs, wallet interactions and upgradeable testnet continuity | An app performs one logical file action without manually coordinating seven records; retries do not duplicate effects, and a testnet upgrade preserves populated data. |

**Open engineering choices:** record packing/count, journal representation, shared versus per-action context, native versus signed ingress, storage/code/calldata/carrier placement, contract/module boundaries, index structures, caches, proxy pattern and prototype limits. Seven records per file is not itself a user requirement.

Kernel ingestion and indexing must be evaluated as separate contract responsibilities, with an explicit minimum set of mandatory query obligations and additional configurable indexes. Moving storage must not quietly make a previously required query optional. A proposal to change that boundary must identify the benefit and request a decision.

Privacy, account recovery, carrier diversity and long-term reconstruction need credible extension paths and specific failure analysis now; this sprint does not promise to implement complete private storage or every recovery mechanism. Classify each result as **demonstrated, designed but untested, unsupported, or unknown**. Never score unknown as a pass.

## 2. Parallel roads and people

| Road | Lead | What it must establish |
|---|---|---|
| A — improve the fuller model | Codex, with internal implementation/review help | How much cost and complexity can physical restructuring remove while retaining the important semantics? Explain every persisted fact and index. Test a decision-changing saving, not merely another tiny optimization. |
| B — compact EFS foundation | Claude conversation 1, preferably Fable | What is the smallest coherent design for the same outcomes? Price portable authored data, references, mandatory acceptance and multi-author selection rather than extrapolating from the native quote demo. Reuse or replace that demo where justified. |
| C — MUD reuse instead of rebuild | Claude conversation 2 | Independently examine MUD primary source/code. Compare a dedicated World + Store to Store-only; map reused versus EFS-specific work and the trust/read/write implications. Build at most one matched MUD-backed adapter, not an EAS alternative. |

Codex coordinates the common fixture, comparison ledger and heavy-run queue. A reviewer who did not author the candidate checks its promises and evidence. At shortlist time, request one bounded review each from SDK PM, Data Explorer PM and Contracts Dev: show them the proposed API and an actual workflow, not the whole design corpus.

Those role reviews are advisory, with a two-hour response window. An unavailable reviewer does not stop the sprint; record the missing review and use an independent internal reviewer where possible.

Each road should examine the largest levers: duplicated durable facts/journals, per-action versus shared authentication context, required index maintenance, same-basis bulk reads and needless duplicate app-state writes. The comparison can support both portable stored documents and native/live contract values, but must label their different identity, authorship and history guarantees in the API. A cheap live read is not a replacement for every kind of file.

Do not add agents simply to maximize parallelism. Add a third Claude conversation only for an independent, decision-changing task that has become a bottleneck—for example portable contract-account authorship or query completeness. Research and code preparation can run concurrently; heavy local builds/chain runs cannot all compete for the same laptop.

## 3. Common workloads: small enough to finish, real enough to discriminate

All three roads map these workloads on paper. At the hour-8 gate select the smallest shared vertical slice that distinguishes the two leading candidates. Reuse retained evidence where its source and semantics match. Do not implement six complete systems per road.

1. **A document's life:** create, edit, rename, move, remove and restore a small note; retain identity, content and history. Add a compatible Type extension and a breaking revision: an old reader must not silently misinterpret either. Inspect the SDK calls and actual wallet approvals.
2. **Portable collaboration:** two authors publish competing versions; different Lenses select different heads. Export the data, Type descriptions and authored evidence into a second deployment. A clean reader checks the promised properties without the original frontend or browser cache. Separate retained source proof from destination admission/current authority; test an EOA author and a real contract author without fabricating an EOA signature for the latter.
3. **Accepted graph:** a developer's rule validates an outfit referencing items. Wrong-Type, missing or unauthorized items reject; a changed external condition is checked where promised. Exercise direct, batch, import and reuse paths, stale revisions and atomic rollback. Explain how old accepted evidence remains interpretable after rule activation changes.
4. **Discovery under disagreement and churn:** folder listing and “images tagged nsfw in this folder” use the same Lens selection as opening each result. Missing index coverage is not absence. Compare live size with lifetime name churn and late index backfill; test a small two-author conflict before scaling. Include a bounded paid Solidity query, not just a browser query.
5. **Contract-to-contract utility:** publish and consume a small quote. Measure stored, revision-preserving updates separately from a live contract-backed file that reads existing app state. The latter is a legitimate option, but does not provide snapshot history for free.
6. **Walk-away and failure:** clear caches, lose a carrier, return corrupt bytes, encounter encrypted content, interrupt a write and upgrade populated testnet contracts. State exactly what the remaining evidence reconstructs. Mock carriers can test fallback semantics; they do not prove storage longevity or cryptographic privacy.

Start measurements with the existing matched 32-byte quote and 41-byte binary fixtures. Add a small note and a dense/zero 4 KiB pair when storage policy affects the choice. Pin scale dimensions at launch—e.g. 1,000 live entries, a separate 10,000-lifetime-name churn case, and 1/8/32/64-source read plans where supported. Report unsupported cases; do not raise limits to obtain a green result. These are experimental workloads, not proposed protocol caps.

The first joined proof should connect **authored typed publication → required validation/indexing → selected read → independent consumer**. The selected finalist extends that same deployed graph through export/import and historical interpretation after rule/account/Core changes. Include genuine contract authorship, references, two-author selection and failed mandatory-index rollback. Isolated passing libraries do not substitute for that connection. Stage the remaining adversarial cases by which unresolved risk could change the decision; label any missing joined obligation as an open gate.

## 4. Clock and decision gates

T0 is when Codex begins the requested decision work and records the shared baseline below; this round includes the source preflight started at 23:10 UTC. A Claude lane's one-hour acknowledgement window begins only after its prompt is actually sent, not at preflight T0. Unlaunched lanes are not late or disqualified. Continue with available participants and bounded internal substitutes, marking missing independent evidence; late arrivals use the remaining mission window. The clock does not run from the original document's creation or an old overnight mission.

| Elapsed time | Deliverable and gate |
|---|---|
| 0–3 hours | Independently restate each road before reading the others' recommendations. Reconcile one page of requirements, exact source pins and test expectations. Do not block on another abstract requirements questionnaire; flag any material uncertainty. |
| 3–8 hours | Each road produces a maximum two-page architecture/cost-center note with a diagram, API example, reused/custom components, weaknesses and one decisive experiment. Select at most two for targeted code; explicitly list the cases that will run and those remaining designed/unknown. Missing implementation is not proof of architectural impossibility. |
| 8–20 hours | Begin with three decision-changing probes across the shortlisted roads, including a matched joined workflow. Record receipt/read costs, growth and failures. After one repair cycle, triage: resolve a candidate-blocking defect within the remaining time, or report it explicitly. A probe-count target is never grounds to hide a missing obligation. |
| 20–24 hours | Cross-review and issue a provisional recommendation, feature ledger and cost table. Say what finding would reverse the recommendation. If one road clearly wins, finish early. |
| 24–40 hours | Challenge the provisional winner with the strongest remaining cost/semantic counterexample, then complete the finalist's joined gate. Stop early if both are already satisfied. No new fourth architecture or broad feature tour. |
| 40–48 hours | Deliver the owner brief and build handoff. If an important uncertainty remains, recommend conditionally with that explicit gate; do not claim certainty or silently extend the sprint. |

Eliminate a route only for a demonstrated conflict with an unwaived requirement, an unacceptable trust dependency, or measured resource/complexity costs that make a better route preferable. A novel idea may be promising but unready; label that distinction instead of declaring it impossible. Correctness failures cannot be averaged away by a weighted performance score.

## 5. Fair economics and honest evidence

Use identical semantic work and payloads, named compiler/fork/configuration, normal runtime/initcode/block limits, and cold/warm distinctions. Give both **absolute costs** and a feature-by-feature explanation of what changed.

- Include setup/deployment, first write, repeated edit, native contract update, required indexes, failed transactions, paid point/history/list reads and optional-index premiums. Keep setup amortization explicit; count relayer/sponsor costs too.
- Measure storage growth and browser RPC calls, batches, bytes and latency separately from gas. Inspect contract reads with a real consuming contract; an `eth_call` succeeding is not a paid-read budget.
- Date any ETH/USD and chain-fee assumptions. Show execution, data-availability and other fees separately, with a range; local receipts are not live Ethereum/OP/Base/Arbitrum fee quotes. Current-dollar affordability is not a century-scale promise.
- Compare MUD plus the necessary EFS adapters and queries—not a raw table write against a complete EFS file lifecycle. A bare mapping is a limited diagnostic control, not a feature-equivalent rival or a proved theoretical lower bound.
- Record source/evidence pins and independent expected outcomes. Receipt inclusion, matching hashes and retained RPC transcripts are not independently authenticated chain-state proofs. Report the proof level actually checked.

The fuller seven-fact create is currently about **5.06M gas**. The native canonical quote create is **627,672**, with a matched contract quote update at **198,745**. That contract update reuses a Record created earlier in the run; it is not a fresh-body update floor. These measure different promises; their ratio is **not** the price of portability. See the retained [[../2026-09-11-efs21-overnight|comparison and qualifications]], [[../2026-09-12-efs21-canonical-native-types-results|canonical native results]] and the [[run-manifest|exact controls and freshness rule]]. This planning pass did not rerun those benchmarks.

Baseline pins: fuller control `ebc7d540570827c5f5052af83d2cbd80f54092a7`; native source `b8c27754314c97ab48c5b2454f9be05653e6b393`, retained evidence `d269e5560d23af169e386f8ad92d9a5f60a9c382`. Verify worktree HEAD/dirty state at launch; a directory called `planning-efs21-direct` is not proof it holds the fuller control. Preserve Fable's existing uncommitted work.

## 6. Coordination without another coordination system

Keep this brief and small lane reports on planning/main, visible in Obsidian. No agent-framework scripts or new registry are needed. Codex maintains the shared summary; each lane writes its own report and hands over exact commits. Serialize Git publication from the shared checkout, stage exact files and never sweep up someone else's work. Prototype code may use agreed isolated worktrees; do not migrate or merge existing prototypes merely to publish findings.

Use the **Coordinator checkpoint** below as the single coordination surface, written by Codex. Lanes read it at phase boundaries and before changing code or requesting a heavy run, not in a busy polling loop. They report proposals/results and run requests in their own lane note. Codex records the agreed fixture, shortlist and explicit run handoff here. No acknowledgement means no heavy-run permission; continue independent light work. Without shared access, that lane stops at a self-contained proposal instead of making James a routine run scheduler.

Codex is the default heavy-run operator. Before anyone builds or starts a chain, explicitly hand off the run slot and record the owning process, scratch paths and watchdog. Use finite, bounded-history Anvil runs; no unrestricted state dumps, persistent background benchmark nodes or full storage traces. Proposed budget: 15 GB total scratch and 50 GB free-disk reserve. Stop before crossing it, retain compact evidence, and clean only verified run-owned paths. Preserve existing user demos and other agents' processes.

Publish consolidated owner checkpoints at the first shortlist, 24-hour recommendation and final handoff—not every cross-agent message. The Codex thread heartbeat `coordinate-efs-engineering-war-room` checks hourly through September 14 at **14:00 UTC/09:00Chicago**, per James's later morning cutoff, to resume useful work and coordinate returned results. It stays quiet on unchanged state and stops at the final handoff/deadline or sooner if the productivity gate fails. This is a follow-up mechanism, not evidence that every worker or laptop process runs continuously.

### Coordinator checkpoint

**September14,09:31: archive semantics pass; independent task review running.**
Root observed the intended behavioral RED, then all93 B tests passed, including
14 new archive tests. The archive runtime is6,098bytes (initcode6,299), and all
seven approved methods are present. Candidate commit `02c34a9` is local pending
task review, not yet pushed. No Ledger change or paid archive price is claimed.
All owned compiler processes stopped and the slot is released; the09:20 lease
is closed early. Task2 has not started and needs its own finite run permission.
The next [[files-next-joined-gate-20260914|Files gate]] now includes a concrete
cold-parent read-budget risk, not merely more small Quote fixtures.

**September14,09:20: finite archive compiler gate authorized.** Root alone owns
the compiler slot from09:20 through09:40UTC; no Anvil/RPC run is authorized.
The reviewed operational wrapper uses one atomic lock, an immutable source
snapshot, offline installed Solidity0.8.30, a ten-minute process watchdog,
15GiB scratch cap and50GiB free reserve. Local run is
`/tmp/efs-b-archive-task1.OXPOfb`; slot is
`/tmp/efs-b-archive-heavy-slot.lock`. The exact RED handoff manifest digest is
`9f4e1e35515c1be66a06c01d19a1e5383f8fe6a678a419e856dcd547bd94c26c`.
First run only the joined archive test against the compiling stub; an actual
behavioral failure, not a compiler failure, unlocks implementation. A changed
source handoff needs a newly checked digest. No query comparison rerun.

**September14,08:56: B archive implementation started; query gate stays closed.**
The [[b-portable-archive-implementation-plan-20260914|two-task implementation plan]]
preserves the reviewed signature-only archive boundary. Independent preflight
corrected real fixture/return-type, no-write, raw-receipt and cutoff gaps before
dispatch. One worker now writes only the packed archive's compiling stub and
adversarial tests; root observes a behavioral RED before implementation.
The separate Ledger remains unchanged. No compiler/chain lease is active yet.
Next gates are the joined recovery test and full regressions, then one small
packed-versus-code-vector receipt comparison if ready. The morning handoff
remains14:00UTC; an unfinished comparison stays UNMEASURED. Completed query
work is published and must not be restarted by the recurring task.

**September14,08:40: required-query challenge passed; compact B stays primary.**
[[required-query-paid-results-20260914|Complete writes + query costs and limits]]
are independently reviewed: all82transactions/25pages passed. B selective's
common writes plus both complete queries cost8,587,661gas versus C14,617,882;
extra index maintenance and deployment are fully charged. This named challenge
does not reverse B-first; it is not a universal MUD or full-Files benchmark.
The successful run ended08:25:42.837UTC with all owned processes stopped;
**the08:24–08:54 lease is released early; no heavy lease is active.** Both journals
and exact pins are retained in the B successor; no original Claude workspace
or frozen normal-price table changed.

Next: the already reviewed [[b-portable-evidence-seam-20260914|B evidence-retention
seam]], then the small Files/SDK journey. One bounded planner is preparing the
archive's code/test handoff; no fourth candidate, new Core adoption or native
historical-proof claim. Do not rerun the completed query/control/unit/input gates.
The morning14:00UTC handoff and stop-on-stall rule remain authoritative.

**September14,08:24: scalar decoding repaired; one separately sealed fresh attempt.**
The two-line parser correction and regression tests are pushed at
B`b94b57c405ef18b7f259cbd636d685ff96738ce7`; root12/12 audit tests and scoped
independent review passed. All173 runtime paths are unchanged except the approved
audit hash; input/contract/gas bytes are identical. The first failure stays retained.
**Exclusive root heavy lease08:24–08:54UTC, latest start08:32:** one fresh attempt
in temporary directory `efs-required-query-paid2-20260914.QM7xI0`, using the same
82transaction/25page workload, prune256,20minute watchdog and15GiB/50GiB guards.
New287file seal SHA256
`d35034ccb0e233b9f99594727cbe4384185cfabc6f8a3814d75711b668ec40f7`.
The original failed directory joins the scratch budget. No automatic fallback,
compiler or competing heavy process; raw replay and cleanup remain required.

**September14,08:19: first attempt stopped at a runner RPC-decoding defect; lease closed.**
The run retained38 raw replies through six setup transactions, then correctly
stopped before any publication/page price claim. The verifier mistakenly treated
transaction signature `r/s` as fixed32-byte RPC data; Ethereum's transaction
schema uses integer quantities, so a valid63-nibble `r` was refused. Independent
numeric comparison confirms the exact sealed signature/sender/hash still match.
This is a test-harness defect, not an observed EFS contract failure. The same
worker is adding a focused offline regression and scalar comparison fix; no
input, signature, gas or contract change is proposed. Anvil75600 and runner75601
are stopped, confirmed by launch record and process inspection; scratch remains
retained. The08:16–08:45 lease is **released early**, not permission for a retry.
A new attempt requires the corrected source review, fresh seal and explicit slot.

**September14,08:16: runner source gates passed; one finite root-owned paid lease.**
The [[required-query-runner-review-20260914|shared signed runner and raw audit]]
are pushed at B`7b0471342a99d69c1d423e7e64822ccc0b309f23`; C remains
`3f5702f1d7acc39c1d62a5b1a0795f3fe579ebce`. Root22/22 Node26 tests and fresh
whole-plan/source/launcher review passed. The173-path runtime inventory and
286-file source/input/review seal are retained; pins SHA256
`514f60cecb704a3600d2f46658f4ca2f497e6bd4aedcfc363ead8a5a05b13f69`.

**Exclusive heavy lease: Codex root,08:16–08:45UTC, latest start08:25.**
Exactly one fresh loopback Anvil attempt;82 sealed transactions/25 paid pages,
no compiler, no gas/fixture change or automatic retry. Owned scratch
`efs-required-query-paid-20260914.wdaBsu` under the system temporary directory;
prune256, run-specific cache,20minute watchdog bounded by lease,15GiB total
owned scratch/50GiB reserve, unconditional owned-process termination. PIDs and
commands go in its launch record. All other heavy operators wait. No chain
result is claimed before complete raw replay and cleanup checks. This comparison
does not alter the frozen normal-price table or approve a permanent design.

**September14,07:40: quota-interrupted runner resumed; morning productivity cutoff.**
James asked to continue only while productive through the morning. This watch now
ends at09:00Chicago/14:00UTC, earlier than the original23:10 sprint handoff.
Task1 remains pushed and reviewed; the Task2 worker hit quota before leaving code
or a report. Fresh account status allows work, so the same worker resumed from
the existing brief. No paid run or new gas result exists yet. Priorities are the
working runner, one bounded comparison if ready, then an honest handoff. Stop the
recurring task early if useful execution is blocked or genuinely stalls; no
duplicate workers or repeated completed test suites. No heavy lease is active.

**September14,05:09: raw-state oracle reviewed; shared paid runner executing as a coding task.**
[[required-query-state-oracle-20260914|Oracle source and exact-state tests]] are
pushed at B`7bd787b`; root17/17 Node passes and independent review/P3 closeout
are complete. One bounded worker now implements the shared signed runner, not a
chain run. No compiler/Anvil lease is active and no new gas result is claimed.
The planned4100checkpoint probes are audit overhead, not browser query traffic.
Original Claude pins remain unchanged; final/conditional deadline23:10UTC remains.

**September14,04:14: paid-query inputs independently reviewed; runner preparation.**
Root reproduced17/17 offline input tests and the exact input SHA256; independent
review checked21 runtimes,25 app signatures,82 signed transactions and25 complete
Pages with no blocking finding. See [[required-query-input-review-20260914]] and
the [[required-query-paid-plan-20260914|two-task runner plan]]. No paid execution
or new price is claimed. B/C source and previous unit/control results stay pinned.

The [[required-query-state-recipe-20260914|raw-state recipe]] makes two unequal
features explicit: C synthesizes coverage from Ledger high-water rather than
storing an independent processed frontier, and its Record backlinks are not B's
binding-target live counters. The matched query can still be priced; it does not
make those schemas or all guarantees equivalent. One shared runner will check
actual rows and charge complete writes/pages in three fresh graphs. Root alone
will authorize a finite chain lease after source review. No heavy slot is active;
original Claude workspaces remain untouched and no new Fable execution is claimed.
Final or conditional owner handoff remains September14,23:10 UTC.

**September14,03:31: both required-query readers published; paid fixture next.**
B `d547890` and C `3f5702f` passed individual and combined source/unit review;
see [[required-query-source-review-20260914]]. Existing prototype branches are
preserved, not merged. B79/79 and C91/91 full Forge pass; C's fresh legacy Node
92/93 metadata-pin limitation remains explicit. The corrected incomplete-page
cursor never skips an unexamined future tail. This is not a new gas result.
Independent offline preparation now derives the fixed82-transaction/25-page
comparison, including every required-index publication and complete query.
AST exports are reconciled; no compiler/Anvil process remains. No James decision
or Fable action is needed at this checkpoint. Final deadline remains23:10 UTC.

**September14,03:27–03:40 UTC: root-only AST artifact export lease; closed03:28:04.**
Latest start03:33; one B build then one C build, no tests, Anvil or RPC.
Reviewed frozen source and normal compiler/fork/optimizer/metadata settings;
only AST output and scratch paths change. This is needed to derive named
immutable values independently for the paid fixture, not infer trust from a
deployed contract's own returned code. Root requires byte-for-byte equality with
the already tested artifact initcode/runtime and links before using this export.
Five-minute command watchdog inside03:40;15GiB owned scratch/50GiB free reserve.
Config/output/cache/logs: `/tmp/efs-required-query-ast-20260914.hrHCoQ`.
Root alone runs/stops/checks process groups; early release when both builds end.
Whole-delta review and offline fixture preparation continue without heavy access.

B build21files/24.14s and C73files/18.31s completed with exit0. Root checked all
16 required deployment artifact ASTs, all71 transitive source hashes, and exact
initcode/runtime bytes, links and physical immutable ranges against tested
artifacts. Build-only lint/shadow/test-harness warnings are retained in logs;
this is not a pristine lint claim or an additional test run. `LEASE_RELEASED`
prevents reuse of the wrapper. Fresh named-immutable derivation remains part of
independently reviewed input preparation before any paid-run permission.

**September14,03:05–03:25 UTC: root-only C query compiler lease; closed03:12:28.**
Latest start03:15; prepared real-fixture missing-implementation RED, then
focused GREEN/full tests if ready. No Anvil/RPC or paid run. Existing normal
Solidity0.8.30/Cancun/viaIR/optimizer200; unchanged C metadata settings.
Run-specific config/artifact-read permission/output/cache/logs under
`/tmp/efs-required-query-c-build-20260914.sKwCIN`;8-minute command watchdog
inside03:25 deadline,15GiB owned scratch/50GiB reserve. Root stops/checks
process groups and releases early when done. No worker compiler permission.

Final focused11/11 and full91/91 Forge passed after an observed cursor-regression
RED and repair. No compiler/Anvil process remains. The fresh-artifact Node suite
is92/93, not a clean pass: one deliberately old-snapshot immutable AST-key pin
differs. Root verified byte-for-byte identical legacy initcode/runtime templates,
links and physical immutable ranges against the retained pre-query artifacts;
the old artifact-specific helper suite passes72/72 on its own pinned inputs.
Do not reuse that old measurement runner against fresh artifacts. Source review
and complete paid-query preparation continue without a heavy-run lease.

**September14,03:01: B required-query unit gate published; C source work active.**
C's single01:08 run and independent packet review passed; evidence `12dc73a`
is pushed in the preserved C successor. See [[paid-rollback-control]] for exact
source/input/receipt/raw-state qualifications. Both mandatory-rule and late
required-index failures leave the specified state unchanged; positive controls
commit it. This is not authenticated chain proof, full parity or a normal-cost
reprice. Do not rerun completed controls. The strongest remaining discriminator
is [[required-index-gap-20260913|complete incoming-Quote discovery and maintenance]].
Its [[required-query-experiment-20260914|bounded source plan]] passed independent
review: indexed ID discovery can rely on mandatory checked-reference postings
and bounded metadata, without recopying every Quote body. Reader-bound cursors
prevent cross-query pagination mistakes. B source `d547890` is now pushed in
the preserved successor:16/16 focused and79/79 full Forge tests passed at01:59,
47/47 Node passed, and independent spec/quality review found no actionable
issue. Root rechecked the exact five reviewed hashes and compiled dependency
hashes before publication. C's matched body-free reader is now assigned to a
source-only worker, with a legal repeated-reference count case added. No full
B/C query conformance or paid-query result is claimed. The next portability
[[b-portable-evidence-seam-20260914|proposal]] passed scoped design review only;
its signed claims do not become accepted Records or historical source proofs.
Final or conditional handoff remains September14 at23:10 UTC. At02:09 the exact
Claude task showed exhausted Fable credits with a September19 reset; James was
informed, no purchase/model change made. Original Claude B/C pins remain unchanged.
The previous B compiler window is expired/released; no heavy process remains.

**September14,01:36–01:56 UTC: root-only B query compiler lease; released01:42.**
Latest start01:45; focused test-first RED, then reviewed source/GREEN if ready.
No Anvil, RPC or paid run. Normal Solidity0.8.30/Cancun/viaIR/optimizer200;
per-command watchdog ends no later than01:56. Run-specific output/cache/logs
in `/tmp/efs-required-query-build-20260914.0j17DC`;15GiB owned scratch/50GiB
free reserve. Root stops/checks process groups on every exit and releases early
if no compiler work remains. B worktree is the existing preserved successor;
C/control packets and frozen price rows are untouched. Initial focused1/1
passed; runtime artifacts for both readers are8955bytes and selective index5188,
below EIP-170. The oversized test harness is not a deployable product or a paid
consumer. No compiler/Anvil process remains. Further focused/full testing needs
a fresh root lease after the worker's next source checkpoint.

**September14,01:56–02:16 UTC: root-only expanded B query compiler lease; closed.**
Latest start02:06; focused16-case suite, bounded fixes if needed, then one full
B regression. Source-only worker has supplied its report; no new paid result
or complete-pass claim. No Anvil/RPC. Same normal compiler/fork settings,
eight-minute per-command watchdog bounded by02:16, output/cache/logs in
`/tmp/efs-required-query-b-green-20260914.G8M9Z4`,15GiB owned scratch/50GiB
free reserve. Root stops/checks its groups and releases early. An independent
portability-seam design review proceeds without touching candidate code.

The focused/full runs finished01:59 with16/16 and79/79 passes; no compiler
process remains at03:01. Never reuse the expired wrapper. Reader runtimes8955
bytes each, selective index5188, paid consumer1717; their ordinary limits pass.
The oversized unit harness and aggregate unit gas are not paid/block-fit evidence.

**September 14, 01:05–01:25 UTC: root-only C control lease.** Start no later
than01:15; **completed and released early at01:08:51**. One fresh loopback Anvil, no compiler,
normal Cancun/chain31337/30M blocks, timestamp1800000000, prune256 and
run-owned cache. Runner source `84e1081`, unchanged compiled C source `2ca7349`.
Full source/quality review and93/93 Node pass; independent preparation18/18
and exact expectationSHA `2e3c9887…` reproduced. The final file seal and
report-summary supplement review remain required before launch; no run result
is claimed by this reservation. Three fresh graphs,27 transactions and2322
fixed-block logical/physical observations; static/mined attempts both5M.
Twelve-minute watchdog inside this lease;15GiB total owned scratch/50GiB free
reserve. Runtime/control scratch: `/tmp/efs-c-controls-paid-20260914.MCwNJk`;
input scratch: `/tmp/efs-c-control-independent-prep-20260913.MkbdXi`; retained
artifacts: `/tmp/efs-c-readiness-build-20260913.NoPDle/out`. Root stops and
checks its process groups on all exits. Frozen product prices and the final
23:10 handoff are unchanged. A bounded source-only required-query preparation
runs in parallel; it owns no compiler slot or additional architecture.

**September 13 provisional recommendation issued before the 23:10 deadline.**
[[provisional-recommendation|Compact B is the primary engineering hypothesis]];
C remains the focused required-query challenger, and A the semantic reference,
not a third product. The frozen small-workflow costs favour B, but required
reverse-query maintenance and stronger portability are not fully priced.
No feature is waived, no permanent choice is frozen and no production repo
is authorized by this recommendation. Final or conditional handoff remains
September 14 at23:10 UTC.

The B mined rollback supplement is complete. C's dedicated runner and
independent physical/raw-storage expectations are now being prepared in
separate owned scopes; existing83 Node tests pass with retained real artifacts.
No compiler/chain lease exists. The fresh control will use a genuine Producer
prefix and5M identical static/mined attempt caps under normal30M blocks; these
are test bounds, not product affordability concessions. A scratch-only strict
linked-runtime adapter is allowed, never byte masking or shared-source changes.
Claude UI was checked again: Mac locked, so Fable execution remains unverified.
Codex continues without waiting for him or changing quota/model settings.

**22:39 B mined controls verified and published; heavy lease released.**
The two complete-A1 refusals and zero-poison calibration ran successfully on
the prescribed fresh graphs. Independent verification checked 528 raw state
replies, 36 signed transactions and 18 deployments; post-run review found no
blocking mismatch. Source checkout `4345992`, oracle `3dfd975`, evidence
`acbfaf7`: [[paid-rollback-control#September 13, 22:39: B mined controls verified|result and limits]].
Both rejection cases preserve the prescribed EFS state; successful calibration
matches the separately prepared state. This is RPC-observed evidence, not a
source-state proof, C parity or full Files integration. The 19:10 product-price
cutoff and 23:10 owner recommendation remain unchanged.
The Anvil run finished at22:27:48; owned groups are stopped, no heavy process
remains, run scratch is about1.8MiB and total owned scratch about121MiB. The
22:27–22:47 lease is released early and cannot be replayed. C control preparation
is light/read-only; no other lane has a compiler or chain lease.

**22:27–22:47 UTC root-only B mined-controls lease.**
Reviewed/pushed source `4345992` passes47 Node tests; oracle `3dfd975` passes275.
Preparation, runner and finite launcher reviews pass. Three fresh control
graphs use18 deployments/36 total signed transactions and528 fixed raw-state
comparisons; the independent offline auditor was sealed before execution.
Input SHA256 `0b26e6d2a0037de6f89089eece41cbb1174a76eb87e8de945d9c599bf8b28622`;
41-file run-pins SHA256 `89b038b1c0b1da72b96f515bb5663c602326bcaa7b0c9317b0a850ba9489559d`.
Root alone may launch one fresh loopback Anvil in
`/tmp/efs-b-controls-paid-20260913.00DzB4`: chain31337/Cancun, 30M block gas,
prune256, run-local cache, Node26, 12-minute process-group watchdog, latest
start22:33, absolute stop22:47. Eight named scratch roots total about121MiB;
273GiB free and no competing heavy process observed. Preserve15GB total scratch
and50GB free reserve. No compiler or other lane launch. Product-price cutoff
is unchanged; this control result is unearned until raw-packet verification.

**22:12 matched B control preparation active; no heavy lease.**
The isolated B worker is implementing the three specified mined controls;
an independent preparer derives exact runtime/input/raw-state expectations
without reading its runner or test answers. Root corrected inherited
immutable resolution (pushed oracle `3dfd975`, 275 Node tests with real retained
artifacts, independent review passed after one malformed-ancestry correction).
Independent inputs reproduce under Node26; their review and the candidate
runner review remain pending, so no fresh transaction result is claimed.
The minimal control-only graph has six deployments and three necessary Types;
the stable File remains an untyped CREATE subject, not an invented File Type.
Frozen product-cost rows and the 23:10 provisional recommendation are unchanged.

**20:13 B rollback source/tests verified; heavy slot released.**
Pushed source `8ddd04c` and exact evidence `4487d7b`: intended runtime RED,
then4 focused/63 full Forge and42 Node passes, independent spec/changed-range
review. [[paid-rollback-control#September 13, 20:13: B source/test stage verified|Source-stage result]]
is not the mined matched pair; inherited-immutable pins and static/mined/raw
state controls remain next. No compiler/Anvil running; roughly121MiB across
the six named scratch roots and274GiB free. The20:05–20:25 lease is released
early and cannot be replayed. [[provisional-recommendation]] is now a reviewed
working brief: B first as a hypothesis, C retained against the specific
required-reverse-query cost challenge, no feature waiver. The SDK and Files
intakes and the 19:10 cost snapshot remain the decision inputs for23:10.

**20:05–20:25 UTC root-only B rollback fixture compile/test lease.**
Staged source at base `cbadc00` changes only the Index callback visibility and
adds `test/MatchedRollback.t.sol`. First run must show the intended runtime
RED before enabling the test-only poison refusal. Root alone runs offline
Solc 0.8.30/Cancun/via-IR/200, two threads, no Anvil; normal code limits remain.
Owned scratch `/tmp/efs-b-rollback-build-20260913.Ps480X`, separate RED/GREEN
outputs and caches, process-group watchdog, 15GB owned-scratch/50GB free guards.
Latest start20:12, absolute stop20:25; no competing heavy process and 274GiB
free observed before staging. Source tests are not mined rollback, new paid
costs, a matched C run or a closed finalist gate. All other lanes stay light.

**19:57 cutoff recorded; SDK advisory integrated; finalist controls continue.**
The provisional cost snapshot closed at **19:10 UTC** with B source `c5561e2`
/ evidence `cbadc00` and C source `2ca7349` / runner `58dd3d7` / evidence
`c6fce9d`. Its table is [[b-parity-paid-results-20260913]]; required-index,
portable-evidence and full-Files qualifications remain unchanged.
[[sdk-shortlist-review-20260913]] identifies mostly adapter/runtime work plus
genuine required-query and historical-contract-proof gaps. Both PM reviews
are now received. B's already-reviewed late-index rollback fixture is being
staged test-first in the root-owned successor, after the cutoff; it is not a
new cost result. No compiler/chain lease yet. Independent shortlist challenge
is underway before the **23:10 provisional recommendation**. Original Claude
workspaces stay untouched; no new successful Fable execution is assumed.

**19:07 Files advisory integrated; no executable Files pass claimed.**
[[files-shortlist-review-20260913]] finds both candidates can express the four
small discriminators with a candidate-native fixture and qualified reader.
No new Core storage need is demonstrated. Distinguish a browser querying one
pinned block/state from a paid contract paging across later states; B's raw
cursor/`mutated` flag does not by itself preserve historical selection. The
existing exact-frontier paid packet remains valid within its stated scope.
SDK advisory is still pending; no new run or architecture decision.

**18:59 decision-prep handoff; no new benchmark run.** The reviewed
[[paid-rollback-control#September 13 follow-through: reviewed B seam and execution traps|B late-index control handoff]]
now pins attachment timing, configuration-specific signatures, full error
bytes, post-receipt observations and non-vacuous calibration. Root owns this
fallback in its existing isolated successors; Claude's workspaces stay intact.
[[maintenance-and-reuse-20260913]] separates MUD's genuine table/read/event
reuse from unproved SDK/codegen/maintenance savings. SDK and Data Explorer PMs
received bounded read-only shortlist reviews of the actual candidate APIs;
responses due 21:00 UTC, advisory before the 23:10 provisional recommendation.
Cost evidence remains the published B/C packets; the 19:10 cutoff and existing
open gates are unchanged. No compiler/Anvil lease, new architecture or waiver.

**18:18 B stronger-consumer paid result published; heavy slot released.**
The 18:07:28–30 run at `c5561e2` passed both independently prepared gates,
four exact paid-output comparisons and separate packet review. Evidence-only
`cbadc00` is pushed. [[b-parity-paid-results-20260913]] reports B A1 1.61M,
edit 659k, native B1 797k; paid point 167k and one-entry joined list 270–277k.
The stronger checks cost about 9% versus previous B; C's current paid reads
remain 45–51% higher. This is not a feature-normalized MUD tax or winner.
Required [[required-index-gap-20260913|typed reverse discovery and current reverse membership]]
are unequal and not waived; price the actual query/maintenance, then the
specified rollback and portable-evidence gates. No new compiler/chain lease.
Anvil PID 76613 stopped; root confirmed no heavy process and 274 GiB free.
Claude remains quota-blocked as directly observed below; Codex continues from
saved successors. Preserve 19:10 evidence cutoff and 23:10 provisional report.

**18:06–18:26 UTC root-only B parity paid-run lease.** Source `c5561e2`,
59 Forge / 42 Node tests, independently reviewed complete runtime and exact
paid-answer preparation. Input SHA256
`31dbc9e1ad5580fa5b5b119ffba1d209299529227feb82bfedeedd9e4caca3d0`;
assembled arm SHA256
`b28c779bba360ecae19ba7beb68610cae9ce27ba33245c66d88e3415f023b83f`.
One fresh loopback Anvil via the run-owned launcher, Node 26, chain31337/Cancun,
30M block gas, prune256, run-owned cache; latest start18:11, absolute stop18:26,
process-group watchdog and 14GB run/50GB free-disk guards. Scratch
`/tmp/efs-b-parity-paid-20260913.KJ23qU`; no compiler or other lane launch.
Preflight18:06 found no competing heavy process, 274GiB free and ~113MB across
the six listed owned compiler/paid runs. Root must compare actual four paid
calldata/returns/events and signed receipt/header joins before publishing costs;
launcher/controller ACKs alone are not semantic output verification.

**18:01 B parity source verified; compile slot released.** Reviewed and pushed
`c5561e2` passes 7 focused / 59 full Forge tests and 42 Node tests (also repeated
on Node 26). Two test-isolation regressions were repaired without weakening
consumer checks. JoinedConsumer runtime is 17,781 bytes, below EIP-170; its
140,072-byte test initcode is a Foundry-only harness, not a deployable app.
Independent preparation now seals new runtime/input/output expectations;
there is no fresh paid result or chain lease yet.

**Claude availability correction, directly observed 17:56:** the app is
accessible again. EFS v2 Dev explicitly reports out of Fable usage credits and
an API 429 termination; it is not verified as still executing. Original B/C
pins remain `7c292e0` / `9a4e766`. Do not buy credits, change models or replay its
expired 11:55 compile launch. Root's isolated successors and current checkpoint
are the resume handoff; no further work from Claude is assumed for the deadline.

**17:54–18:14 UTC root-only B GREEN/build lease.** Seven scoped files are
paused for independent review and focused/full Solidity tests after observed
RED. Base remains `ac37e91`; record the dirty diff/source hashes, not a false
clean-commit claim. No Anvil. Same Solidity 0.8.30/Cancun/via-IR/200 profile,
two threads, normal code limits, exclusive `green-out`/`green-cache` beneath
`/tmp/efs-b-parity-build-20260913.lcAzU1`; process-group watchdog 15 minutes,
absolute stop 18:14 and latest start 17:59. No competing heavy process found;
274 GiB free. Fresh independent input preparation awaits reviewed source and
complete new artifacts. Old B/C cost reports remain unchanged.

**17:05 B RED observed; heavy slot released.** The 17:04:20–27 root run
compiled successfully and all seven new regressions failed at their intended
missing-check assertions against unchanged production. Exact source/diff hashes
and outputs are retained in the run directory below. This demonstrates the test
gap, not a repaired consumer. Implementer may now make the specified consumer
and runner/schema changes; no compiler or Anvil permission transfers with that
handoff. Independent exact-input preparation is ready for reviewed new artifacts.

**17:04–17:24 UTC root-only B regression-test lease.** No Anvil or other
lane run is authorized. Source is `ac37e91` plus only the two uncommitted
forwarding/regression test files; production is paused unchanged. Root records
the exact dirty diff and source hashes, then runs the seven new runtime negatives
with Solidity 0.8.30, Cancun, via-IR, optimizer 200 and two compiler threads.
Exclusive output/cache: `/tmp/efs-b-parity-build-20260913.lcAzU1`;
process-group watchdog 15 minutes, absolute stop 17:24, latest start 17:09.
Preflight found no Forge/Solc/Anvil process and 274 GiB free. This is expected
RED evidence before repair, not new passing tests or a paid cost measurement.

**17:00 B consumer parity in progress, no chain lease.** Root is implementing
the already specified [[paid-read-parity-next-gate]] in the existing isolated
`planning-warroom-b-run` successor from `ac37e91`; Node baseline 41/41 passes.
Scope is consumer-local getters/checks, forwarding faults and exact runner/input
schema adaptation. Ledger, indexes and current measured source remain unchanged.
Compiler runs will have a separate root lease; old paid packets stay retained.
Claude app is still locked; original worktrees are preserved without a fresh ACK.

**16:32 C positive paid slice completed; heavy slot released.**
The 16:25:20–22 run at `58dd3d7` passed both independent deployment/state gates,
all four paid exact-answer checks and separate packet review. Anvil PID 59382
stopped cleanly; scratch 7.5 MB; retained evidence `c6fce9d` is pushed.
[[c-gated-paid-results-20260913]] gives the
side-by-side costs and limits: C A1 2.40M, edit 1.11M, native B1 1.28M;
paid point about 252k and one-entry joined list 391–406k. B is cheaper in these
implementations, but encoding, index obligations and consumer checks differ;
this is not a same-guarantee overhead ratio or a MUD architecture rejection.

Next priorities: [[paid-read-parity-next-gate|B consumer parity and reprice]];
needed facts already exist in its public getters. Keep
additional index obligations disclosed, then the specified matched rollback controls and
[[portable-evidence-next-gate|evidence-retention/import challenge]]. Preserve
the 19:10 evidence cutoff and 23:10 provisional recommendation. One possible
C list improvement carries already-resolved placement provenance rather than
resolving twice; it is unmeasured and cannot justify an indefinite optimization
loop. No new heavy lease or protocol decision. Claude's original checkouts and
pending handoff remain preserved; no fresh Claude acknowledgement is claimed.

**Next heavy slot: root, 16:25–16:50 UTC, one C positive paid slice.**
Reviewed runner source `58dd3d78e8efa8e4490b035bdde5502b75adc9e3`
passed 83/83 Node checks and independent bounded source review. Reuse unchanged
Solidity/artifacts at `2ca7349`; no compilation. Independent input SHA256
`16739ae05cb8a77c16b4c0edc9b5acd3a4b9b5074510a1d6d69c42aeed3f335c`;
controller SHA256
`9338e35288adc11b0a310f50244fb5295e48c64d482f1174bc1c4cfdba598a53`.
Only the separately reviewed owned-loopback launcher is authorized: fresh
Anvil, chain 31337/Cancun, 30M block gas, prune-history 256, exclusive scratch
`/tmp/efs-paid-c-run-20260913.YxKavf`, latest start 16:30, lease/watchdog stop
before 16:50, run-owned cache, 14 GB run cap and 50 GB free reserve. At 16:24
no competing Forge/Solc/Anvil process was visible and 274 GiB was free.
The launcher contains the standalone runner's late loopback-preflight risk;
watchdog refusal may lack a partial child transcript but cannot ACK success.
Two separately pinned checks gate setup and post-B1 paid calls. This lease
does not authorize rollback/scale/broader cells or any other lane's run.

**Next finalist challenge sharpened:** [[portable-evidence-next-gate]] separates
retaining authored/historical data from replaying old commands. Both current
import APIs couple them; divergent destination CAS, a now-rejected historical
record, and one missing unrelated batch body are concrete source-derived
follow-on cases. A selected evidence/admission route may preserve current
signatures; source-admission proof remains distinct. This is an unpriced shared
gate, not a new architecture, an executed failure, or a reason to delay the
current positive paid comparison.

**15:59 C readiness slot released; positive paid integration in progress.**
The isolated C repair at `2ca7349` passed the 14:59 source-archive build,
80/80 Forge tests and 72/72 Node tests; ABI equivalence and normal code-size
checks are retained at `e5d7568` on `codex/efs-warroom-c-run`. See
[[c-readiness-results-20260913]]. No compiler/Anvil process is running; scratch
42 MB, free disk 274 GiB. This closes the bounded readiness attempt, not C's
paid comparison or finalist gates.

Root is now adding only the separately pinned C two-stage runner gate in that
isolated successor. An independent preparer has derived exact positive inputs
and public-test-account signatures, manifest SHA256
`16739ae05cb8a77c16b4c0edc9b5acd3a4b9b5074510a1d6d69c42aeed3f335c`;
a separate reader checks the primary declarations. No chain results or
candidate runner were used to derive those answers. No C chain lease yet.
Claude native access is still locked; no fresh acknowledgement is claimed.
On resuming, inspect this successor before duplicating C repairs/hooks.

**Next heavy slot: root, 14:55–15:20 UTC, C readiness compile/tests only.**
The isolated repair closes the previously identified resolution/cursor basis
checks and full replay comparison; 71 non-artifact Node tests passed. Source
review is underway. Root will pin the reviewed source before one fresh offline
Solc 0.8.30 / Cancun / via-IR / optimizer-200 build with ordinary code-size
limits, then Forge tests and artifact-dependent Node tests. No Anvil or paid
measurement is authorized by this lease. Scratch:
`/tmp/efs-c-readiness-build-20260913.NoPDle`; run-owned out/cache, two compiler
threads, 20-minute whole-job watchdog, latest start 15:00. At 14:52 no competing
heavy process was visible and 274 GiB was free. No other lane may take the slot
until release. Claude native access was retried and is still blocked by the Mac
lock; no new wakeup/acknowledgement or source checkpoint is claimed.

**B's first gated paid results are now retained:** see
[[b-gated-paid-results-20260913|the costs, exact guarantees and open gates]].
Signed create+placement+tag is **1,614,433 gas**; fresh signed edit **658,913**;
contract-authored competing head **796,542**; the four paid joined point/list
reads span **153,636–254,283 gas**. These are small-fixture observations, not a
full-v2 savings ratio or a MUD comparison. Source and packet review found no
run-blocking integrity defect; the independent controller qualifies state and
inputs, not all paid semantic interpretations. Matched rollback and portability
still block finalist qualification. Source/evidence are on the root B branch;
the owner-readable report is on main.

**14:30 scoped C readiness fallback:** Claude's checkout is still clean at
`9a4e766` apart from the previously known output symlink, with no new delivered
checkpoint. Root is creating isolated `planning-warroom-c-run` /
`codex/efs-warroom-c-run` from that exact commit for the already identified
NatSpec, basis-check and full replay-result repairs. No edits or ownership
reclamation in Claude's checkout. This is one bounded source/readiness attempt,
not a new MUD architecture or adoption. Claude, on resuming: check this successor
before duplicating C repairs. No C build/Anvil lease yet. Root will decide whether
to extend the runner with a separately pinned C adapter only after these faults
are closed; B's completed controller and input seals must remain unchanged.

**14:27 root slot released early:** the fresh B gated paid slice finished at
14:26:23, exit 0, with both external ACKs and no candidate consumer mismatch.
Source `4b6154695c89976a7325cd0c51dc9591dee387c1`; arm SHA256
`05cace851314a817e12c70af943fe45f86d6eaf1beec31a191a8309886b35e7b`.
Anvil PID 37752 stopped; fresh process check found no remaining heavy process.
Run scratch is 3 MB. Root is reviewing/retaining the packet; matched rollback,
portability and finalist gates are still open. No new lease is implied.

**Released reservation: root, 14:26–14:56 UTC, B paid slice only.** Reuse the
independently reproduced unchanged Solidity artifacts; no compile. Source
review of `e7b1583` approved the two-hook runner for this bounded run. A final
report-wording correction will be committed and sealed before launch. Fresh
genesis, only `joined/paid-slice`, normal Cancun/30M block limits, four public
test accounts, `--prune-history 256`, run-owned cache and the runner's 25-minute
watchdog; no late start after 14:31. Scratch is
`/tmp/efs-paid-b-run-20260913.Kf4SOz`; artifacts remain under the previously
recorded 28 MB compile directory. At 14:24, no competing Anvil/Forge/solc process
was visible and 274 GiB was free. All other lanes stay light-only until this
slot is released. This reserves execution, not a result or architecture choice.

**Execution triage after independent review:** gate preparation is sufficient;
the bottleneck is now an actual run. Target the first B gated packet by
**16:00 UTC**, selecting only `joined/paid-slice` (the seven common setup/paid
rows) and reusing the verified unchanged Solidity artifacts. Then give C one
bounded readiness/repair attempt and the same slice. Freeze further checker
expansion unless a concrete defect would invalidate those observations.
Ordinary receipts may be collected before the separate matched rollback
controls, but remain unqualified until those controls pass. Wider Files/SDK,
export/import and history-after-upgrade gates stay open for the day-two
finalist. Use **19:10 UTC** as the provisional evidence cutoff, leaving synthesis
and challenge time before the already promised **23:10** owner checkpoint.
Unfinished cases become explicit gates, not a forced winner or waived promise.

**13:58 scoped root fallback (light work only):** Claude still has no checkpoint
after 11:52 and native app control remains locked. Root is advancing the already
agreed B two-hook runner integration in the existing root-owned
`planning-warroom-b-run` / `codex/efs-warroom-b-run` worktree, merging the exact
`7c292e0` source while preserving the earlier root run evidence. This does not
reclaim or edit Claude's B/C worktrees, alter Solidity or transfer lane ownership.
Claude, when resumed: inspect this fallback before duplicating B hooks; continue
the C repairs/interface meanwhile. Root will publish a source pin for review
and handoff. No compiler/Anvil lease is granted here, and no old run becomes
controller-gated retroactively. The oracle stays outside the candidate runner.

**Published root checkpoint `600b1e8` (oracle branch):** fresh aggregate Node
verification passed **256/256, zero skips**, including the independent runtime
derivation against the fresh AST build. Source reviews approved the runtime,
raw-check mapper and partial-word gate; root also closed the initially missing
index-pointer, registry and tag checks before publication. The previous oracle,
profiles, expectation bytes and completed reports remain unchanged.

Prepared components: `/tmp/efs-paid-b-build-20260913.EK7l5n/prepared-b.json`,
SHA256 `b376395b4e52fa16f8a530b7ffdc8b4abb36b7313245a919f6b393c6dbca191d`.
Its compiled source label is verified against `git rev-parse 2859147`; it is
not the future integrated runner pin. Initial malformed source-label text was
corrected before this seal and before any chain execution. Build reproduction
and test logs are in the same run-owned directory. All local compiler processes
are stopped; no new gas result or eligible architecture winner exists yet.

**13:14 concrete next handoff (queued for Claude):** root has independently
derived B's 17 constructor-bearing deployment payloads and deployed runtimes,
the semantic-to-physical inputs, and 18 pre-fixture / 79 post-B1 raw checks.
The post checks include actual index attachment, all six Type/rule/policy/ref
rows, all six records and twelve admissions, heads, histories, folder/tag
scope, and explicit publication provenance words. Dynamic signature/basis
words remain retained but unverified; this is not a signature or state-proof
verifier. A prepared component file is retained under the fresh build directory
below, but is NOT a final arm manifest or a deployed seal: the integrated runner
source and exact context fields still need pinning before use.

For the B arm only, root explicitly fixes the positive `market` marker as
`A_TAG = (TAG, FILE_QUOTE, hash("market")) -> FILE_QUOTE`, revision 1,
admission 8, binding ordinal 3, leaf 4/publication 2/CAS 0. This is a physical
fixture convention implementing the neutral stable-File tag, not a new
protocol rule; C keeps its own representation. The tag checks are derived
from the independent File/position inputs, not copied worked IDs.

**Runner interface clarification:** key `build.artifacts` by deployment role
(`quoteRule` and `pairRule` are distinct), not merely Solidity contract name.
`initcodeHash` hashes compiler creation bytes PLUS constructor ABI arguments;
`runtimeCodehash` hashes the fully substituted expected deployed bytes.
Use the root-produced AST artifacts or agree the exact independently verified
artifact pin before final arm assembly. Map runtime-helper `expectedRuntime`
to controller target `runtime`; the helpers are offline preparation, not
controller dependencies. Candidate code never derives its expected answers.

The remaining matched rollback ambiguity is now specified in
[[paid-rollback-control]]. It needs a small separate control deployment/cell,
not a claim that B's additional-policy failure and C's retry are equivalent.
Claude: finish the existing B two-hook integration and C X1/X2/X3/comment
repairs first; then return the bounded rollback-control source plan. Root
continues independent C input preparation after its explicit interface/map.
No new run permission or permanent choice is implied by this handoff.

**12:58 root compile slot released:** independently rebuilt archived B
`2859147` with the pinned compiler and extra AST output; build exit 0 and
52/52 Forge tests passed. All 35 retained artifacts have identical ABI,
bytecode, deployed-bytecode templates and metadata to the fresh build;
each metadata source hash matches the archived source. AST is extra output
for exact immutable-name mapping, not a runtime change. Retained run:
`/tmp/efs-paid-b-build-20260913.EK7l5n/{build.log,test.log,reproduction.json,out}`,
28 MB; no heavy process remained at 12:57:49. The launch call was timestamped
12:55:58 (two seconds before the written 12:56 boundary); no competing process
was present. No Anvil or paid measurement ran. Source ownership stays with
Fable; the compiler slot is now free, subject to a new explicit reservation.

**12:55 root continuation / next compile-only slot:** no new Claude handoff
has appeared since 11:52; B remains `7c292e0`, C `9a4e766`. The Mac is locked,
so the native Claude task cannot currently be resumed through app control.
This file is a queued handoff, not a claim that Claude received a new message.
Fable retains B/C source ownership and the pending runner/consumer repairs.
Root is independently preparing B's expected deployed runtimes and raw ABI
checkpoint checks in the existing oracle worktree, using two non-overlapping
light specialists. The old checker and all completed reports remain unchanged.

The prior Claude lease expired at 12:15. Root reserves **12:56–13:16 UTC,
compile/tests only**, for an independent reproduction of B's unchanged
`2859147` Solidity source in a run-owned source archive and output/cache.
Cached solc 0.8.30, two threads, at most 300 seconds per command, no Anvil,
no source edits, no late launch. Extra AST output is for immutable-name
mapping, not different bytecode settings; compare bytecode/metadata/ABI with
the retained build before using it. At 12:53 no heavy process was visible and
275 GiB was free. Actual run paths, results and release follow here.

**12:04 root observed C compile failure:** the reserved run really launched
at 11:55:00 UTC, then exited 1 before tests. The retained build log reports
Solidity NatSpec parse errors for literal `@0`, `@130`, `@114`, `@220` offsets
in `test/MeasurementConsumer.sol` comments (lines671,686,700). This is a
comment-syntax build blocker, not evidence against MUD or a semantic test
failure. Claude: include the comment correction in the reviewed X1/X2/X3
successor. No test/size/Node result exists for `9a4e766`; do not report the
expected 73 as passed. Root observed no heavy process at 12:02 and 275 GiB
free, but the reserved window stays yours through 12:15 unless released.
No root code change or concurrent compiler launch is made in your worktree.

Independent B vector/controller code is now committed and pushed at
**`cc430ef`** on `codex/efs-warroom-oracle`: 189/189 Node tests passed (the
old 168 unchanged + 11 vector + 10 controller). The public interface's
placementRevision omission is already resolved by the 11:50 binding; keep it
in both candidate mirrors and acknowledgements. Both independent reviews
found no remaining source-integration blocker after the refusal-retention
repair. This is integration-ready tooling, not a deployed run seal.

**Independent controller implementation handoff (September 13):** root's
new `lab-oracle/paid-controller.mjs` in `planning-warroom-oracle` implements
the bound B hooks, uses only Node built-ins, and retains its own fixed-block
RPC observations and ACK/refusal files. `paid-controller.md` documents the
operator arm-file shape; use `localDependencies: []` because the controller
does not import the vector module. The independently authored B vector module
is run separately to prepare the pinned `inputs` bundle. B placement budget
is pinned at 16 from the public declaration example. These are not yet run
seals or a measurement: fresh expected runtime/ABI state-call mappings and
the integrated runner are still required. An independent reviewer caught
failure-observation loss; root reproduced and fixed it without issuing ACKs
on failure. No old oracle/profile/expectation or retained report was changed.

**Claude: C needs the equivalent two hooks after the current fixes.** The
pre-fixture gate is BEFORE `types-items-pair` publication (old runner line357),
not after its baseline: that publication already creates fixture Items/Pair.
The second gate follows post-B1 checkpoint/basis reads, before placement or
paid reads (old lines475–478). Keep C-native types, fields and publication IDs;
return its explicit interface/map before coding a second incompatible gate.
Reuse the small B runner infrastructure if useful, but not its encodings or
candidate-defined expected answers. Root will supply C's independently mapped
inputs. Do not run either candidate and attempt retrospective sealing.

**11:52 C cross-review findings for the source owner:** both independent
source reviewers returned GO for the bounded compile; static source is
compile-eligible, but fix these bounded response-consistency gaps before the
comparison run. `MeasurementConsumer._select` and `_provenance` ignore the
returned `Resolution.basis`; explicitly compare it with the pinned basis and
add actual wrong-basis reply controls (changing an admission or the expected
high-water is not this test). `_window` must also compare the returned cursor's
index generation, rules epoch, Core commitment, scope and Lens hash to the
requested pinned values, not only its admission frontier. The runner's
`paidObservationMatch` must compare the entire log/replay tuples, including
unpredicted `hydrated`, and recompute the replay commitment as well as the
log commitment; otherwise a replay-only field mutation can pass. Add a focused
mutation regression. These are consumer/runner changes, not Core changes.

The 11:55–12:15 compile-only window may be used for the already reviewed
`9a4e766` diagnostic build if desired; the result will retain these open
qualifications. Prefer a corrected committed successor if it is ready inside
the window, recording its pin before launch. No late run or receipt inference.

**11:50 controller interface bound; C compile window reserved.** Root accepts
B's `7c292e0` `CONTROLLER-INTERFACE.md` for the disposable experiment with
four implementation clarifications: (1) explicitly include `chain.rpc` in
the beforeFixture context; (2) include `placementRevision` in the sealed
ordinals, so afterB1 does not compare against a nonexistent input; (3) keep
afterB1 immediately after the checkpoint/basis reads, removing the proposed
`noBPlacement` and placement-derived `observedOrdinals` from that context—root's
controller independently reads these before returning ACK, and the existing
candidate placement checks still run afterwards; (4) the pinned arm-input
file must cover any local module dependencies as hashes, verified before
loading the controller (or supply one self-contained module). Pinning only an
entry point must not silently leave the actual vector implementation unpinned.
The controller independently retains its observations/ack as well as the
runner's copies. The runtime/artifact/role inputs are verification inputs,
not candidate-authorized truth. No new Core or oracle framework is requested.
Claude: proceed with source-only B runner integration and its focused tests;
root is implementing the independent vector/controller side in the existing
`planning-warroom-oracle` worktree, preserving old checker profiles unchanged.

**Heavy slot: Claude/Fable, 11:55–12:15 UTC, C compile/tests only at `9a4e766`.**
Launch only after root's two source reviews return GO here; no late launch,
Anvil, deployment or measurement. Use the proposed clean detached checkout,
fresh run-owned output/cache, cached solc 0.8.30, two threads, finite watchdog,
<1 GB new/<15 GB total scratch and 50 GB reserve. Preserve the old untracked
`out` symlink. Run fresh-artifact Node helpers as well as Forge tests/sizes;
immutable IDs may change with the new AST and must be mapped by variable name,
not guessed to make a test pass. Source-only fixes require a new recorded pin;
report actual counts/exits/size/cleanup, not the expected 73. Root stays light
throughout the slot. No comparison receipt is authorized yet.

The independent seven-row semantic manifest was sealed at 10:54:16 UTC before
candidate inspection (`paid-neutral-expectations.json`, SHA256
`ff7c4fc735504c9871e8241c7cc461293b7ffc37f3d5e9dd50840e005cc37795`).
It fixes the note/time/selection/provenance meanings, not arm-local physical
inputs or a cost result. The matched rollback control's exact input remains
to be separately sealed; none of the finalist gates is waived.

**10:53 B review GO / controller delta authorized:** independent consumer review
confirmed the retained 52/52 Forge result; root reproduced 28/28 Node tests.
The prior four findings are closed. Correct the stale JoinedConsumer size in
the B README to 13,852 B and provide the three non-joined Type descriptors
(QUOTE/BINARY/LABEL) alongside ITEM/PAIR/QUOTE_J in the declaration input map.
These are reporting/input omissions, not a new Core defect.

The runner is ready for an owned-chain diagnostic, but has no real independent
seal boundary yet. **Claude: implement the following small B source-only delta
alongside the C lane, using a separate bounded specialist if useful.** Add an
opt-in pinned controller module with two awaited hooks, keeping ungated runs
explicitly diagnostic. `beforeFixture(context)` runs after deployment/registry
setup and before the first selected cell (failure rows currently precede paid
rows). `afterB1(context)` runs immediately after the post-B1 snapshot, before
placement/paid reads. Root owns the controller module and independently derived
vectors; you own only the candidate runner integration/tests/docs.

Use explicit controller, neutral-expectation and arm-input file paths/hashes.
Return the exact proposed JSON interface before coding so root can bind its
side: it must include run ID, stage, input/expectation/module hashes, full
12-field Expect and six-field PlacementExpect inputs, both Lens arrays, roles,
fixture bodies/IDs/Types, fixed ordinals, and the actual post-B1 checkpoint.
The runner must consume or strictly compare the independent physical inputs,
not merely echo a hash. No acknowledgement/malformed payload/hash mismatch or
bounded timeout means no downstream send. Both acknowledgements must remain
separate retained files, not evidence manufactured by the result packet. Keep
the concrete paid log and existing three selected cells. Do not build a new
oracle framework, change Core, reuse a candidate verifier as the controller,
or retrospectively seal a completed run. No heavy slot is granted by this delta.

**10:50 next integration handoff:** Claude reports `2859147` built and passed
52 Forge tests, then published candidate-authored fixture maps at **`b2aa07d`**.
Root is independently reviewing the consumer, raw-reply controls, runner and
retained logs. A separate requirements-only author is freezing the seven-row
neutral expectation manifest without opening candidate code/results. Candidate
maps are declaration inputs, never independent expected answers. No new heavy
slot or receipt run is active.

**Claude/Fable: resume two bounded source-only lanes.** First, take C paid
consumer/runner ownership in the existing `planning-road-c-lab` worktree at
published **`97e84c9`** (tracked clean; preserve existing untracked `out`). Root's
mandatory-rule repair is complete and root will not edit C concurrently.
Implement the already-reviewed `matched-cost-scope-review.md` follow-through
and `sdk-fixture.md` paid-slice appendix: one A placement, independent content
selection under both Lenses, same Quote/Pair/two-Item checks in paid point/list,
separate placement provenance, bounded actual-bad-reply negatives, unrelated
paid caller, restored post-B1 state/time/first-transaction controls and concrete
raw observations. Keep measurement-local fixtures separate from the broader
two-placement tests. No Core/index/table changes solely to align encodings;
different native layouts remain the thing being compared. Test-first source
preparation, internal review, committed pin, then request a finite compile slot.

Second, prepare for a small B controller integration: root's runner reviewer
is checking whether it exposes a genuine pre-fixture and post-B1/pre-paid
handoff for independently sealed inputs. Do not run the current script and
retroactively bless its self-produced packet. Wait for the exact hook finding
before coding this B delta; root owns the independent expectation/vector/seal
side, not a duplicate candidate runner. Existing B inputs and code remain
available for root read-only inspection. No compile or Anvil is granted here.

**10:08 root C slot released; repair validated in unit tests.** The `/2`
mandatory-rule commitment repair is published at **`97e84c9`** on
`fable/2026-09-13-road-c-lab`. It passes **47/47 Forge tests**, with **6/6
Node helper checks against the fresh artifacts**. All 99 compiled artifacts
fit normal runtime/initcode limits; Ledger runtime is **23,204 B**, ImportLib
**19,909 B**, IndexModule **10,303 B**, LensReader **10,585 B**. Root checked
the changed immutable IDs against the compiler AST by variable name and
refreshed the runner/range pins after observing the stale-range test fail.
Independent source review found no new acceptance bypass. No Anvil ran,
no new C gas measurement exists, and the separate additive-Realm-policy
and signed declaration-relocation limits remain explicit. Scratch is bounded
under 1 GB; 275 GiB free was observed. No heavy process remains.

**Next heavy slot: Claude/Fable, 10:10–10:40 UTC, B compile/unit tests only.**
Use the corrected successor of `980a017` after your bounded internal source
reviews clear it; record the exact committed pin and run-owned artifact/cache
paths before launch. Build/sizes and tests only, offline pinned solc 0.8.30,
two threads, watchdog bounded by 10:40, <1 GB new/<15 GB total/50 GB reserve;
no Anvil, deployment or measurement. Keep failed runs and report actual UTC,
exit status, test counts, sizes and verified cleanup. If not ready by the
deadline, do not launch late. Root will stay light-only throughout this slot.
Afterwards, prepare source-only comparison inputs/runner mapping; an eligible
receipt run still needs independent expectation and arm-input seals.

**10:03 C falsifier reproduced:** against `324e7c4`, the corrected standalone
fixture passed its two identity controls and failed exactly because a strict
rule commitment accepted a permissive runtime. The first attempt's missing
actor artifact was fixed before that semantic result. Root is now implementing
the bounded `/2` mandatory-rule repair with independent source review; a test
specialist updates fixtures and the misleading same-Type/different-rule import
scenario. **The remaining root slot through 10:10 includes repaired compile
and unit tests**, still no Anvil, receipt measurement or full comparison claim.
No table layout, Record-ID formula or mandatory index obligation changes.

**09:58 update:** Claude acknowledged all four B review fixes at 09:54:38
and is applying them source-only; no owner intervention is needed. C's new
three-test rule-commitment fixture is ready. Root's original 09:50–10:00
slot used no compiler: isolating artifact read permissions required a
run-owned Foundry config. **Root replaces it with a finite 09:58–10:10 UTC
compile/test-only slot**, same offline compiler, two threads and disk bounds,
no Anvil and no new cost claim. Only the new Type-rule tests are selected
against old `324e7c4` before any Core repair. Existing `out` stays untouched.

**B `980a017` source review: compile-eligible, comparison fixes required.**
Claude: apply these narrow findings before requesting the new paid-slice run:

- Add sealed `observedAt` and note-commitment expectations to the paid Quote
  consumer and compare them on chain; currently they are returned but not
  checked despite the "exact fields checked" claim. Update tuple/runner inputs
  and focused negatives. Item Type checks are sufficient for this slice;
  arbitrary Item payload semantics are not an added requirement.
- Gate all derived success claims after a failed `paidResultCheck`, especially
  the hardcoded `COMPLETE` coverage and expected-result labels. Preserve raw
  observations/mismatches but emit unknown comparison outcomes unless separate
  evidence establishes the field. Add small injected replay/result tests.
- Require receipt transaction index 0 after each restored snapshot; if claiming
  the only transaction in the block, check its transaction list too. Enforce
  and record matching next-block time controls for the comparison, not just
  block/parent equality.
- Add bounded public-ABI malformed/missing Pair/Item and admission/Evidence
  reply controls for paid consumers. Incorrect expectations test a different
  branch; do not claim they exercise corrupted/unavailable actual replies.

No ABI blocker was found. Keep the concrete diagnostic event and optional
placement control as below. **Only owned `--anvil` runs are in scope**: the
external `--rpc` path can deploy and change automining/revert a supplied node,
so do not use it for this work. Return the corrected pin; no build or chain
lease is inferred from this source review. Root continues the C red test.

**09:50 next bounded work:** Claude handed off clean **`980a017`**, the B
paid point/list consumer and runner (Core unchanged at `ca1a228`). Root's
independent consumer and runner reviews are running. Keep the concrete
`PaidResult` diagnostic log for now and disclose its instrumentation gas;
it is not a proposed SDK ABI or unavoidable EFS overhead. The next selected
run should include `joined/paid-slice,failure-rows` and the optional paired
`joined/a1-without-placement` control, with independent inputs prepared before
the new run. No new measurement is granted by that selection.

**Heavy slot: root, 09:50–10:00 UTC, C failing-test reproduction only.**
The reviewed C repair is a bounded disposable experiment: add a mandatory
rule commitment to the Type body and verify the chosen local implementation
against it, preserving native MUD rows and the existing per-admission check.
A specialist writes a focused test first; root runs it against `324e7c4`
before implementing. No Anvil or C measurement, pinned offline solc 0.8.30,
two threads, owned scratch/watchdog, <1 GB new/<15 GB total/50 GB reserve;
stop by 10:00. Existing `lab-c/out` and evidence stay intact. B remains
light/source-only until an explicit post-review compile handoff.

This does not yet add C Realm-policy activation or waive that wider gate.
The same mandatory Type can still face additional destination constraints;
substituting a different mandatory rule is not an implementation of those
constraints. Old C cost evidence stays labelled with its old profile.

**Receipt review accepted (September 13; actual run 09:00:00–09:00:05 UTC):**
Claude retained and pushed **`5891cc5`**, source **`ca1a228`**. The six-cell
packet SHA256 is
`6cbdf98b5b4d22fe9ed6f65b3732a7adddd0129c1aa8b0dea1bd552e91a3c614`.
Independent offline review joined 75 signed transactions (26 setup + 49 cell),
13 expected failed receipts, nine explicit error-argument cases, 237 unchanged
pre/post getter pairs and seven admission-basis rows. All 18 source hashes
match the pin. The stale signature verifies under its old global epoch;
zero/permissive policies did not disable the mandatory rule. This is a GO
for retained RPC consistency/signature evidence, not chain-state authentication
or full semantic-oracle passage. Claude released the slot at 09:02:27;
no heavy process remains, and scratch is 7.5 MB with 275 GiB free.

Publication correction for Claude's lane: the old admission uses row 2,
activation epoch 7, signed profile global epoch 8; the new row 3 is created
at **global epoch 9**, not 8. Signed edit delta versus `5960336` is **8,822**,
not 8,797. Root reconciled these exact narration lines; lane-owned main
handoffs may resume after this checkpoint is published. B source work continues.

The repaired 32-byte diagnostic costs **1,226,435 gas native create /
520,724 edit**, **1,271,630 signed create / 567,395 edit**; native stateless
point **51,173**, list **89,168**. Against the exact retained `5960336`
packet, deltas are +9,642/+8,826 and +9,665/+8,822 respectively. These are
whole-profile deltas, not an isolated F5 price or a full Files/MUD comparison.
The old QUOTE admission's policy row is **2/mock**, not row 1/no-policy;
its activation epoch 7 differs from global epoch 8. Root corrected the handoff
narration; source/evidence bytes remain unchanged.

**Next priority:** B prepares the reviewed common consumer/fixture slice.
Root's C source review additionally found an explicit guarantee mismatch:
C's structural TypeID excludes the mandatory rule, whereas repaired B's
TypeID includes it. C already refuses unsupported native imports and local
Type overwrite; this is a separate cross-Realm meaning issue, not a MUD Store
defect. See [[matched-cost-scope-review#C mandatory-rule identity gap|the C gap]].
Root owns the C mandatory-rule commitment repair/map before claiming equal
portable-Type guarantees; the consumer-only scope remains valid for the
one-placement behavior, not for this additional identity requirement. No new
heavy slot, no owner waiver and no architecture winner are declared here.

**08:56 compile accepted / bounded receipt handoff:** Claude acknowledged the
shared 08:48 grant and released it at 08:51:18. Root read the retained launch,
build and test logs: clean `ca1a228`, successful build at 08:50:24–08:50:39,
**43 Forge tests passed**, Ledger runtime **17,280 B**, no remaining heavy
process. Root's independent Core and runner source reviews are GO for a
bounded diagnostic, not an architecture choice. The Mac lock prevented a
direct app message; the shared-file acknowledgement confirms this handoff
route is working. No fallback/duplicate build is needed.

**New heavy slot: Claude, 09:00–09:20 UTC, receipt diagnostic only.** Use the
clean `ca1a228` detached source and its already-built artifacts; no rebuild.
The exact six-cell allowlist is
`native-one/quote,signed-one/quote,failure-rows,policy/activate,failure/refused-re-registration,failure/unsupported-native-import`.
This includes Claude's four requested refusal/policy cells plus the two small
native/signed controls so the repaired profile has directly measured costs.
One loopback Anvil, normal limits, bounded history and run-owned cache;
deadline-bounded watchdog, <100 MB new scratch, <15 GB total, 50 GB free
reserve. Record raw caller-qualified probes, expected error arguments,
receipt/state joins, exact selection, UTC/PIDs, source/artifact/runtime pins,
and verified process cleanup. Stop by 09:20; retain failures too. Root stays
light-only until release. This is not the full 21-cell replay or a matched
B/C run. Runtime/tool versions must be observed, not copied from prior runs.

**Two qualifications to carry forward:** `acceptanceBasis.epoch` is the
policy activation-row epoch, whereas the signed acceptance profile folds the
admission-context global registry epoch. The current reconstructor reuses
the retained profile hash; it does not independently regenerate that profile
from its dependencies. This is a reconstruction gap, not a newly found
acceptance bypass, and does not block the diagnostic. Mutable mandatory
validators likewise remain an explicit dependency-semantics limitation,
not fixed merely by pinning codehash. Do not call a vector extracted from
this packet an independently pre-sealed expectation. Root will publish the
SDK's comparison criteria separately from actual run-specific seals.

**After the diagnostic:** Claude should retain/push its evidence and reply in
`claude-pm.md`, then prepare source-only B mapping/consumer changes for the
common A1/A2/B1 point/list slice in `sdk-fixture.md` and
`matched-cost-scope-review.md`. Do not change Core solely to force equal
encodings, introduce a second B placement, rebuild the independent checker,
or start another heavy run. Root coordinates the C counterpart and reviews
new source before the next measurement.

**08:48 reviewed repair / next compile handoff:** the `3c6947d` compile
failed on via-IR stack depth at 08:00:11 UTC; no tests or chain ran, and its
slot was released. Fable delivered the mandatory-rule/additional-policy fix,
stack refactor and runner corrections at `3a30fe2`, then reviewed hardening
at **`ca1a228`**. These remain uncompiled source claims. Root is cross-reviewing
the bounded Core/runner delta and the SDK's proposed comparison appendix;
earlier diagnostic packets retain their original profiles.

**Heavy slot granted: Claude, 08:50–09:10 UTC, compile/tests only at
`ca1a228`.** Use the requested clean detached pin and run-owned
`build/lab-b-pin-ca1a228` scratch, pinned offline solc 0.8.30, two workers,
normal compiler/EVM limits and deadline-bounded watchdogs. Record actual UTC
launch/end, exact commands, owned PIDs and resulting logs/sizes/tests.
No Anvil or receipt run; <1 GB new scratch, <15 GB total, 50 GB free reserve;
root remains light-only. Stop by 09:10 and return the actual result. A source
repair or later receipt run needs its own reviewed pin/handoff, not reuse of
an expired slot. Fable retains B code ownership and root publishes main.

**07:49 repair review / compile-only handoff:** Claude delivered falsification
`71e689b`, Core repair `aaecfed` and adapted runner `3c6947d`; all are source
evidence, not a new passing build or receipt run. Root resumed the existing
Claude task directly and is independently reviewing the runner and one
load-bearing Type-rule question: `activate(typeId, address(0))` or a permissive
replacement must not bypass a mandatory rule that defines that exact Type.
Retaining a historical policy row is necessary but does not establish that
future records satisfy the same Type meaning. See
[[../../Designs/efsv2/programmable-type-acceptance|the existing acceptance draft]];
no owner requirement is reopened or waived by the lab repair.

Fable and an independent source reviewer confirmed that bypass by construction
at `aaecfed`; the zero/permissive-activation regression and always-enforced
mandatory-rule repair are assigned to Fable's existing specialist. The review
also found `MockAcceptor.mode/minBody` mutable behind one runtime codehash:
the lab must not present it as a pure intrinsic rule or claim codehash alone
pins its behavior. Declared stateful rules remain possible; this is not a
production ban on arbitrary developer validation or changing game conditions.
SDK has a separate light, design-only assignment through **08:25 UTC** to
make the existing shared fixture's small point/list outputs and pre-run pin
procedure unambiguous. Its completed checker code stays untouched.

The [[b-authority-runner-review|new runner review]] returned **NO-GO for
receipts** at `3c6947d`: caller-sensitive static probes omit `from`, several
error arguments/policy joins are not checked, and an unmatched cell filter
can report success after running nothing. Root's 11 existing helper tests
pass but do not cover these cases. Fable received the concrete findings;
repair its existing runner after the mandatory-rule API settles, with targeted
regressions and exact selected cells. No full benchmark replay is requested.

**Heavy slot: Claude, 08:00–08:30 UTC, compile/tests only.** After source
readiness and review, record the exact committed pin, commands, owned scratch
and watchdogs before launch. Two workers, pinned offline compiler/fork, normal
limits, <2 GB B / <15 GB total scratch and 50 GB free reserve; hard stop at
08:30. No Anvil/receipt run in this slot; its runner remains under review.
Root remains light-only. If not ready, continue source work and request a new
finite slot, never start late on an expired reservation. Main publication
remains root-owned; B Core remains Claude-owned.

**07:12 coordinated source repair / comparison scope:** Fable's existing
**EFS v2 Dev** task acknowledged the 06:50 handoff in the Claude app and
started one bounded specialist. Its B source/test changes are active;
reviewed runner fixes are already pushed at `fdd837e`. Fable **declined the
07:05–07:40 slot** because source and review were not ready. That reservation
is not reusable: continue light work and request a new finite lease when
ready. B Core remains Fable-owned; root is the sole main publisher.

SDK's final scoped repair `20827a2` passed root's fresh **168/168 tests**
and independent re-review. The frozen richer-profile blob remains
`367c836d1952c19c16b3bdf6738675e3ea91233d`; prior oracle/report files are
unchanged. This approves the diagnostic interpreter, **not a real-packet
semantic verdict**. The existing packet has no identified independently
retained pre-run concrete target/coordinate/source pin set. Missing pins
stay `UNKNOWN`; do not derive them from the candidate packet and call them
predeclared, or repeat the chain solely to appease this checker.

The [[matched-cost-scope-review|independent B/C scope review]] is complete.
Current gas rows are useful diagnostics, not a MUD tax or a portability
premium. C's native update includes an extra folder placement; its listing
consumer hydrates more data, while B's point reader checks deeper references.
Next comparison preparation must freeze A1/A2/B1 and A-first/B-first
point/list **observable outcomes**, use equivalent paid validation and
independent abstract expected results, and disclose setup/storage/read work.
Different physical encodings and native layouts are allowed. Repeat only
those few rows plus matched failure checks after review; keep wider finalist
gates separate. No architecture winner or feature sacrifice is adopted.

**06:50 review intake / next Claude handoff:** independent review accepts
the B packet at `5960336` as retained diagnostic evidence: 173 transaction
joins, 2,675 explicit-basis raw calls, 94 consumer checks and all 14 deployed
artifacts reconcile. Eight status-0 receipts are the eight named expected
reverts. Missing HTTP status, unsuccessful receipt polls and the initial
seal/final-revert envelopes limit transport replay; no state-proof claim.

SDK's richer-observation extension at `802ffe8` is **not approved yet**.
Review found mutable parsed profiles disconnected from their claimed blob,
missing-versus-malformed result errors, a global target pin where the frozen
profile requires per-cell targets, and duplicate nested RPC IDs escaping
conflict detection when the flat ID is absent. SDK owns a bounded repair
of its new module/tests/doc through **07:15 UTC**; frozen profiles and all
older oracle files stay unchanged. Root owns re-review and publication.

Claude's existing EFS v2 Dev task is reachable and visibly idle at the 06:49
check. Root is sending this completed-run handoff, not another request to
replay the old measurement. Claude retains exclusive B Core source ownership
in `planning-road-b-lab`: investigate and minimally repair the already named
native-import/source-origin and exact-Type-versus-rule-activation gaps, with
falsifiers and an explicit changed-profile/source pin. Use bounded independent
specialists as useful; root will not edit that Core concurrently. No source
proof is invented, unverified claims must not acquire source authority, and
unsupported native import is not a permanent portability waiver.

**Conditional next heavy slot: Claude, 07:05–07:40 UTC**, for that bounded B
repair's tests and one targeted receipt follow-up only after source readiness
and independent review. This is an explicit handoff, not a request for a
second routine approval. Before launch record exact commit, commands, owned
PIDs/scratch/watchdogs and verify no competing heavy process. Same offline
compiler/fork, normal limits, two workers, one loopback pruned Anvil, <2 GB
B / <15 GB total scratch / 50 GB free reserve; cap each run at the slot end.
If not ready, continue light work and request a new finite slot, not an
extension. Root remains light-only during this slot and handles SDK and
comparison work. Sole main publisher remains root; Claude leaves its owned
lane-note edits for integration. No new architecture, production repository,
permanent IDs or owner feature decision is authorized.

**06:15 completed receipt run / light review handoff:** root ran exact B
source `df23bbb` at 06:11:30–06:11:45 UTC: **18/18 cells, 173 transactions,
exit 0, no candidate mismatches or reported failure**. The reviewed runner
retains intentional reverts separately. Packet and bounded result report
are pushed on `codex/efs-warroom-b-run` at `5960336`, under
`lab-b/evidence/measurement-20260913T061130Z.json` and
`lab-b/measurement-results-20260913.md`. SHA-256 is
`b2229f3dcef88649125e12fa9946ddfad034e8b3499eaf6b71e58e065957fd07`.
Anvil 34087 and runner 34086 are confirmed gone; scratch is 13 MiB.
The root heavy slot is released early. Any next build/chain needs a new
explicit handoff; do not replay the expired Fable reservation below.

Independent packet review is active; do not treat self-check success as a
candidate verdict. SDK returned its separately frozen seven-getter
supplement at local `802ffe8` (profile frozen first at `6ab1d80`), with root
reproduction of **160/160 Node tests** using the existing ethers dependency.
Its independent code review is active; no real B interpretation report exists
yet, and the supplement is not pushed/adopted pending review. The next
continuation integrates those two reviews, runs the independently pinned
interpretation if eligible, and addresses B's already named source-origin /
native-import and exact Type identity gaps. C's reviewed receipt packet and
the earlier signature checker are completed inputs, not tasks to restart.
No architecture winner, feature waiver, production readiness or proof claim
follows from this run. See [[road-b-review]] for the scoped result.

**06:10 verified execution checkpoint:** the isolated B copy is now
`df23bbb` (same candidate Core, runner fixes through `155df3a`, and one
Unicode-prefix correction to an existing test assertion message). Root's
offline build and all **32/32 Forge tests** pass; **11/11 Node runner tests**
pass. Deployable Ledger runtime is 16,699 bytes; the build's oversized
contracts are test harnesses, not deployed candidate modules. Independent
runner re-review is pending before the bounded receipt run in the existing
06:00–06:35 root slot. No new cost result is claimed yet. Fable's original
worktree remains clean at `e77f36d`; current Claude execution is unconfirmed,
not inferred from the task's earlier acknowledgement. The hourly heartbeat
is verified active through the mission deadline; it does not bypass a
locked Claude interface or promise continuous execution while offline.

**05:52 continuation / next run owner:** B remains clean at `e77f36d`, with
no new handoff or heavy process since the 05:24 request. Direct Claude access
is blocked by the locked Mac at 05:47; current execution is unconfirmed.
Do not assume a written lease wakes an idle Claude task. Preserve Fable's
05:20–06:00 reservation, then root is the **exclusive 06:00–06:35 UTC**
operator for the same bounded B compile/tests/receipt plan. Root prepared an
isolated execution copy `planning-warroom-b-run`, branch
`codex/efs-warroom-b-run`, from exact `e77f36d`; Fable's worktree is untouched.
An internal worker changes only the same-basis runner/readback test, with a
separate read-only preflight. No Core, workload or candidate architecture
change is authorized by this execution fallback. A resuming Fable must not
start another chain during the root slot; return source-only next-gap work.

Root's run-owned scratch is `efs-road-b-run-20260913.9xQRrd` under the system
temporary directory, distinct from Fable's build/cache. Use pinned offline
solc 0.8.30 / Cancun / optimizer 200 / via-IR, two workers, ordinary code and
initcode/block limits; keep the candidate's declared metadata configuration.
No heavy run before 06:00 and a fresh no-competing-process check. Build
watchdog <=600 seconds, chain/runner <=1,500/1,800 seconds and hard stop by
06:35; one loopback Anvil with prune-history 256, no trace/dump. Same scratch
and reserve limits as below. Root retains/reviews results and returns only
the minimal runner patch to Fable if useful; no prototype consolidation.

SDK owns a separate **light-only richer-observation checker extension through
06:15 UTC** in its existing `planning-warroom-oracle` / `lab-oracle` branch,
using the already predeclared supplement. Old files/reports are immutable;
no B implementation input, chain, main edits or unreviewed push. Root owns
review/publication. Signature checker work remains completed, not reopened.

- Phase / T0: **C first receipt run reviewed / B joined source repair / independent signature checker closed / 2026-09-12 23:10 UTC**. C runner `c825c61` completed at 05:09 UTC; its packet/report are pushed at `324e7c4`. Independent review joined all 30 retained receipts and found no blocking evidence defect under the stated diagnostic ceiling. B's prior 11-cell diagnostic remains `322b320`; its new joined/label/measurement source `691e341` is receiving scoped review fixes, not yet run. These are different evidence stages, not a feature-matched winner. Provisional recommendation due September 13 at 23:10 UTC; final handoff due September 14 at 23:10 UTC.
- Participants: Codex Road A analyst, existing SDK PM and Data Explorer PM dispatched; Claude **EFS v2 Dev** kickoff sent and acknowledged by 23:41 UTC. Its [[claude-pm|acknowledgement]] records an independent in-session MUD specialist and evidence extractor; a persistent extra Claude conversation is unnecessary. Earlier MUD source, cost and portability reviews are completed inputs, not new active seats.
- Baselines: kickoff published at planning `2552962`; native source/evidence pins in section 5 remain the named comparison pins. Fable's existing untracked brainstorm is preserved. The similarly named direct worktree is the stopped `f873890` size probe, not the fuller control.
- Shared fixture / shortlisted roads / actual probes: [[sdk-fixture|SDK joined semantics]] and [[files-journey|Files lifecycle/selection journey]] received and reviewed as the common comparison requirements. They are test expectations, not executable evidence or permanent API bytes. Use [[run-manifest]] for exact source, encoding, payload and freshness inputs. **Provisional implementation shortlist: B (compact custom) and C (one corrected Store-only adapter).** Retain fuller control A and its packing proposal as the fallback/reference, not a third concurrent rebuild. No performance winner; the bounded run lease is below.
- Heavy-run slot: **C released early; conditional next lease to Claude EFS v2 Dev, September 13 05:20–06:00 UTC.** C runner PID 7582 exited 0; owned Anvil 7546 and earlier failed-preflight Anvil 6935 were explicitly stopped, with no heavy process at root's 05:15 check. Claude may execute its source-ready `691e341` scope after its independent review is closed and any repair pin is recorded in [[claude-pm]]. This is the explicit next handoff, so no second routine approval is needed. Serialize compile/tests/size scan, then one fresh bounded B measurement; no C/Core expansion. Retain exact pin/commands/PIDs/scratch before launch, pinned offline solc/Cancun/chain 31337/30M block gas and standard code/initcode limits. One loopback Anvil, prune-history 256, two compiler workers, no traces/dumps; watchdog each build <=600 seconds, runner <=1,500 seconds and outer chain lease <=1,800 seconds, all capped at 06:00 UTC. <2 GB B scratch / <15 GB total / 50 GB free reserve. Check no competing heavy process and explicitly stop owned processes after evidence capture. If review is not ready by the deadline, return source findings and request a new finite slot; do not silently extend.
- Next handoff: C's completed packet/report are retained, reviewed and pushed at `324e7c4`; SHA-256 `d62866ae15734861ad67a0291e32865f71d8841569864387e6084656c0b02600`. Its qualified results are on main in [[road-c-review]]. C's five-action typed signed create costs 2,400,475 gas; framed c32 Producer create/edit 1,790,002/950,873; isolated fresh/reused Record publication 697,812/489,539. These are not a matched B ratio or full Files costs. SDK repair and sparse-input closure are reviewed, freshly tested **146/146**, and pushed at `258e5c2`; that bounded task is closed, with runtime authority/provenance/effect still unknown. Claude owns B's joined/label/raw-evidence source and its next bounded run. No feature waiver or new James decision.
- Claude availability: **Resumed and progressing**, with pushed source `691e341` reported at 05:08 UTC and a clean matching B worktree verified by root. Its independent review is running. Shared-file coordination works despite direct app inspection being blocked by the locked Mac. The source adds typed Pair/Quote, stateless paid consumers, raw baseline replies/isolated freshness, older-basis history and fixed-Label-Type probes; source readiness is not passing execution. Preserve its exclusive scope. The next native-import/origin/Type-identity gaps remain below.

| Current owner / contact | Exclusive write scope and next result |
|---|---|
| Codex v2 PM, task `019fe3e5-c8ed-7e72-9d8e-9a0ea79ff5ea` | This checkpoint, serialized publication, common comparison and run handoffs. |
| Claude **EFS v2 Dev**, task `local_3ff543b6-2646-4fa5-b113-2eddc7dd3cf1` | `claude-pm.md`: acknowledge actual child agents, worktrees and capacity; assign `road-b.md` and `road-c.md`. This replaces the proposed old Claude Project Manager contact. |
| Codex internal `/root/warroom_road_a` | `road-a.md`: independently identify the largest safe persistence savings and one paired experiment; source inspection only initially. |
| Codex internal `/root/warroom_road_b_review` | `road-b-review.md`: independently pressure the compact proposal's identity, retained evidence, required indexing and selected-list claims; no implementation authority. |
| Codex internal `/root/warroom_mud_review` | `road-c-review.md`: check MUD source/release claims, raw-write boundaries and fair elimination criteria before shortlisting. |
| **EFS v2 SDK PM**, task `01a02a24-01b3-7f12-9f2e-887aea66e9e8` | `sdk-fixture.md` is handed back; current exclusive scope is `lab-oracle/` in its named isolated branch, as bounded above. No protocol-byte adoption or main writes. |
| **EFS Data Explorer PM**, task `01a02a24-0348-7c50-81fd-2a4ac43c62af` | `files-journey.md`: smallest observable lifecycle/discovery journey that could falsify a cheaper model. |

**Publication owner: Codex v2 PM until explicit handoff.** All workers, including Claude, write only their named reports and hand them back uncommitted for review and exact-path publication. Claude's initial acknowledgement is already published at `6219a98`; the shared-index rule was then sent directly to EFS v2 Dev. Do not pull/rebase or commit concurrently from this shared checkout: “pull before commit” alone does not serialize its index. New code ownership and the heavy-run lease must be recorded before implementation/runs. Worker IDs are current contact hints, not durable architectural ownership.

**B review/run reply, 05:22 UTC:** root saw the 05:19 review and repair scope.
The 05:20–06:00 conditional lease supersedes the old C-through-05:25 line;
C is already stopped. The requested runner watchdog may be 1,500 seconds
with an outer 1,800-second watchdog, **capped by 06:00 UTC**, with compile
and chain serialized. Return partial evidence on failure; do not wait out a
responsive-chain hang without diagnosing it. Keep cold-label input bytes and
every physical receipt visible; passing an ID into a stateless consumer does
not itself make its checks independent of candidate semantics.

**Checker call-set question:** preserve genuine same-basis raw observations.
Do **not** move the extra Consumer getters one block later solely to match an
old checker profile. The pinned old report describes its old packet; new run
cells need their own declared interpretation/expectations. SDK PM has a
bounded read-only question on the exact compatibility path, without access
to B implementation source. This does not hold compilation or retention of
the new raw evidence. Until that profile/checker extension exists, label the
new interpretation unverified; do not relax the old predicate or claim its
pass covers the joined/stateless/label additions. No second candidate oracle
or production SDK work is requested.

**05:25 SDK answer received:** it confirms the above. The seven-getter
collection is predeclared in [[oracle-implementation-plan#Predeclared richer-observation supplement — September 13, 05:25 UTC|the observation supplement]]
before the new run's outputs, with the four inherited semantic checks and
all other interpretations UNKNOWN. Fable: source `e77f36d` still mines an
empty block for the extras; remove that measurement-only detour and keep
all seven at the real receipt basis, then record the final source pin before
using the existing lease. No old report/profile is overwritten. Compilation
need not wait for implementation of the separately named SDK report.

**05:27 lease-request acknowledgement:** the detailed `e77f36d` request in
[[claude-pm]] fits the already granted 05:20–06:00 slot after the same-basis
runner correction. Record the true Node/Forge exit codes, not only `tee`'s
exit status; keep the raw partial packet if a stage fails. Preserve the
existing C artifacts and user demos. No need to wait for another reply.

**Quota handover scopes returned and published, 02:56 UTC:** `c_harness_repair`
completed `774dfcd`; `b_profile_finish` completed `885d9f9`; reviewed branch
heads are `7876477` and `2824297`. Both implementation assignments and the
subsequent read-only C preflight are closed. C's source
semantics are unchanged except the inherited error-parameter rename; B's
profile documents `dcc7b94`, without changing its contracts or diagnostic.
Existing `LABELS.md` remains an unadopted proposal. SDK's `lab-oracle/` scope
stays separate. Resuming Claude must check current ownership before writing.

**Next B handoff after the current source slice (coordinator, 04:55 UTC):**
finish the owned joined/label/measurement preparation before opening more
files. Then return a bounded build request. The next semantic repair priority
is the already recorded native-source import gap: an unverified grade-0 claim
must not mint or control a claimed source subject. Reject that path until a
declared source witness is actually verified; local native publication remains
supported. Keep native origin explicitly chain/deployment/account-qualified,
not incidentally tied to current code bytes. Record the new profile/version
and expected mutations before changing signed execution/replay context; do not
reinterpret the SDK's pinned old vectors. Mutable symbolic Type registration
also remains a gap relative to exact immutable Type meaning; the joined test
does not erase that gap. These preserve unwaived requirements, not new owner
rulings. Source-only work can proceed in B; heavy work still needs the shared
lease. Keep retained fuller A as the comparison control, not another build.

### First cross-lane feedback — September 12

Road B's independent proposal is retained at `c8ec8d1`; its estimates are not measured costs or an accepted feature set. Codex's preliminary responses to its requested engineering choices:

- **Envelope placement is open; losing evidence is not silently approved.** Literal duplicate state words are not required merely because the old prototype used them. Test a compact recoverable representation (including shared immutable-code storage where useful) that retains the signed payload and necessary author evidence. A hash plus a proof-kind flag alone cannot reconstruct or verify a missing signature. If original evidence must instead be retained externally, name the new availability/retention obligation and measure it separately; do not call that the same state-only walk-away guarantee. Source-chain witnesses and destination authority remain separate.
- **A stable File cannot be identified by its current path.** A stable-subject binding can be a candidate representation; a path-derived key that changes during rename/move cannot stand in for stable File identity without additional indirection. The fixture must preserve file tags/history across rename and move, and distinguish a removed file from an unrelated replacement at its old name. This does not mandate a separate genesis record.
- **The required index subset still belongs to the separate index responsibility.** Road B's diagram currently places required lists in Ledger and only optional lists in the Index module. Reconcile that with James's ingestion/index-contract split before implementation; a required-index failure must revert the accepted logical action. Merely moving optional indexes does not implement the requested split.
- **Use the real control.** Road A's source inspection reports that `ebc7d54` already uses direct EVM rollback and shared immutable Envelope/Record storage. Removing the earlier journal cannot be credited again. Validate a different physical saving against this control.

These are coordinator checks against the already stated outcomes, not new owner rulings or a rejection of the compact road. The independent review and common fixtures should resolve them before a run lease is granted.

**Next-stage checks sent to Claude:** Road B v1's signed preimage must commit all authorized placement/head/tag/CAS actions and applicable execution/rule context, not only a Record-ID vector unless that vector provably commits those effects. Hashing actions into an unsigned publication ID is insufficient. Its subject mint must use a portable logical claim, not a local admission ordinal. A paged listing may report an unknown total instead of scanning the entire selected set just to serve its first page. For Road C, an arbitrary percentage of reused lines or the size of Store added to an unchanged monolith is not a fair kill test; measure a replacement and allow ordinary module decomposition. Store-only and World-plus-restricted-authority both require source-level scrutiny. No owner decision is needed merely to test a pinned dependency.

### Provisional shortlist — coordinator, September 13 at 00:01 UTC

This is experiment prioritization, not an architecture adoption or feature waiver.
Use **B and one Store-only C implementation** for the first matched joined
slice. A's 36-word saving is a useful source-derived packing hypothesis, but
the larger open question is whether a compact preserved-meaning foundation can
be cheap, and whether MUD can supply it with less bespoke machinery. Reuse A's
retained controls; do not spend the first run repairing an unrelated stopped
module extraction. Reopen A's packed experiment if the compact candidates fail
an unwaived requirement or its saving could change the recommendation.

C's initial `is Store` sketch requires correction: inheritance carries raw-write
interface obligations. A narrower StoreRead/StoreCore composition or explicitly
denied/gated raw writers must be compiled and adversarially checked. Keep
required indexing in a separate contract responsibility. The
[[road-c-review|independent source review]] does **not** establish that a
dedicated World is unsafe or impossible; World is deferred from this first
adapter to isolate storage/tooling reuse and avoid building two MUD variants.
Reconsider it if a concrete dispatch/authority/tooling advantage changes the
comparison. Dependency source/license verification permits a disposable probe,
not an Etched dependency decision.

Claude leads B/C source preparation in distinct agreed paths and hands over a
source/manifest pin for the single heavy-run queue. Codex owns the independent
comparison/oracle and source review. The first run must join actual typed
publication, checked reference/acceptance, mandatory indexing, two-author
selection and a paid unrelated consumer; a storage microbenchmark may diagnose
cost but cannot replace this gate. Complete the remaining export/import,
history/upgrade and Files failure obligations before finalist eligibility.

### Implementation handoff — September 13, 00:55 UTC

These are temporary experiment choices, not new owner rulings. They unblock
the C-build → B-diagnostic queue above:

- **Replay:** bind execution authorization to the source chain and Ledger
  deployment as well as the declared Realm/code/rule context. Retain that
  source domain for verification elsewhere; import needs separate destination
  authorization. Portable evidence is not permission to replay an execution.
- **Native identity:** qualify it by its original chain/Realm deployment and
  account, not codehash alone. An upgrade's codehash is execution evidence, not
  a new person's identity. Keep the original identity on verified imports;
  `code.length` today does not prove historical account kind.
- **Unverified native import:** grade-zero source claims may be retained as
  attributed evidence, but must not authorize minting another principal's
  subject or writing as that principal. Until a source witness is verified,
  report that native-import authorization as unsupported. No feature waiver.
- **Measurement:** snapshot/reset Consumer storage too; retain full transaction,
  receipt/block hash and raw pre/post getter evidence before `evm_revert`, plus
  partial failure output. Validate Consumer read-back. Seed a present wrong-Type
  target before labeling a failure “wrong Type.” Joined Pair/Quote consumption
  and an independent reconstructor remain separate gates.
- **C regressions:** raw-denial inputs must first succeed against a permissive
  control. Current registration field-name mismatch and empty dynamic-field
  pop would revert even with a raw writer. Use table-correct inputs, check
  registry/hook metadata, reject zero/no-code attachment and verify reciprocal
  Ledger/Index addresses and code hashes.
- **Exact Types:** B's mutable symbolic Type registry is not yet an immutable,
  reconstructible Type description. Its missing descriptor/shape and separate
  rule-activation profile are an explicit finalist gap, not measured savings.

The SDK PM is implementing the independent checker in owned
`planning-warroom-oracle` / `lab-oracle/`; candidate verifier code is excluded
from its inputs. Claude owns candidate fixes, Codex owns integration/review.

**01:45 follow-up:** the source-ready C decomposition and B receipt-polling
repair have the renewed queue above; root's independent reviews run in
parallel and do not hold first compilation. Publish the missing public
profile supplement before asking the independent checker to interpret action
commitments. Keep old replay-domain diagnostics distinct from later fixed
profiles. Earlier questions about shared Evidence shape, mandatory by-Type /
by-author lists, and A ownership were already answered at 00:08: shared closure
for the probe, both lists included, A retained by Codex. No James ruling is
needed to proceed. After this queue, hand back exact compact results and
source pins; source-only repairs/declared profile work can continue without
opening another chain.

**Independent review return:** C `731200d` has three test-split defects:
restore `EncodedLengths.wrap` in the permissive controls, mark the two probe
builders `view` rather than `pure`, and perform the second-attach check from
the actual Fixture deployer (test an unauthorized caller separately). The
library extraction revealed no new authority/storage bypass in static review;
normal-limit compilation/execution and linked-library identity are still owed.
B `a16d7d4` is eligible for the leased private diagnostic run, but its 30-second
timeout is not universal: external watchdog and actual process-exit checks
remain required. Inspect every mismatch, error selector and unchanged-state
flag; exit zero alone does not assert those fields.

**Checker handoff:** SDK's first checker `0e19d27` is retained on
`codex/efs-warroom-oracle`; root reproduced 33/33 synthetic tests and published
the code branch without merging it into main. Its narrow scope and remaining
gaps are in [[oracle-implementation-plan#Completed handoff]]. SDK now owns a
bounded extension in the same `lab-oracle/` path to independently decode
supplied raw RPC bytes, retaining the separate unauthenticated provenance
qualification described in [[oracle-boundary#Execution clarification — September 13]].
No full workflow or authenticated-chain pass is inferred from these tests.

**02:00 diagnostic return (independently checked at 02:05):** B evidence
`322b320` retains the complete 11-cell run at script `a16d7d4` / contract
source `dcc7b94`; packet SHA-256 is
`7bd5409a4b306d8e0705187094fa482b31efcad471260ae93f57eebd0b22fcce`.
An independent reviewer checked 70 cell transactions, 930 raw getter returns
and 29 Consumer checks, including 203 decoded Consumer fields with no
discrepancies. Six expected-failure selectors match, their receipts reverted,
and the retained aggregate pre/post probes agree. These are supplied-RPC
consistency observations, not authenticated state proofs or exhaustive rollback
proofs. Native/signed quote creates cost 1,216,793 / 1,261,965 gas; 41-byte
creates 1,231,495 / 1,276,673. They remain incomplete hash-placement diagnostics,
not matched substitutes for the fuller Files control.

One measurement gap remains: baseline raw replies retain Consumer fields but
not the Record/Ledger/Index pre-probes. Their decoded summaries cannot serve as
independent freshness evidence. The next measurement must retain those raw
requests/replies too. The 496,049 fresh-body / 314,527 existing-body updates
also occur sequentially with different initialized state, so their difference
is not an isolated deduplication premium. C's build #3 confirms Ledger 23,145 B
and ImportLib 19,861 B runtime; the 88,623 B test Fixture still blocks execution.
No C semantic test pass or B/C cost winner is claimed. Paid-read receipts also
include Consumer storage writes; the later reverse-Lens read has an initialized
Consumer and cannot be compared to the first read as pure Lens overhead. The
history row uses cutoff 1,000,000, so it tests the latest retained revision,
not recovery of an older revision. Failure selectors came from separate static
calls; the mined failure receipts establish reversion, not that exact selector.

The returned label-design note was reviewed, not adopted. See
[[road-b-review#Label-retention review — September 13]]: first price exact Label
Records through existing operations, then compare any versioned dictionary
optimization with equivalent mandatory readability/import semantics. No gas
estimate or future-fork repricing in the draft is a measured result.

**Cold-name gap (independent B/C review, September 13):** B `dcc7b94` and C
`731200d` retain hashed folder/name/tag coordinates, not the original user text.
The position tuple's preimage is not the filename hash's UTF-8 preimage. Known
path lookup can work, but generic cold listing cannot display arbitrary names;
MUD table-name metadata does not fill this gap. Current costs are therefore
“subject + content + hashed placement,” not usable cold-reconstructible Files.
The joined slice must retain exact label bytes and verify their identifier
mapping. A narrow experiment may publish ordinary deduplicated Label Records
through existing by-Type discovery, or compare a direct hash-to-bytes table;
price first labels, reused labels, rename, and cold reconstruction. Missing or
corrupt labels stay unresolved, never hardcoded from fixtures. This is a shared
missing capability to implement/price, not a sacrifice or a reason to reject C.

## 7. What James receives

One short decision memo, with supporting evidence linked rather than embedded:

1. Recommended road, strongest alternative and why the recommendation wins.
2. Features retained, explicitly proposed sacrifices, deferred implementation and unknowns—four separate lists.
3. Matched cost/scale table and overhead ledger: conditional lower bounds, best demonstrated costs, marginal feature prices, external obligations and still-unpriced work. Include ordinary contract use, browser work, state growth and representative read/write/rebuild mixes.
4. A one-page architecture and illustrative SDK/Solidity calls. Can an app author create, publish, select and read a file without learning the internal record choreography?
5. A first implementation sequence for contracts, TypeScript/on-chain SDK and the static Files SPA; a small Arcade consumer is a later integration exercise, not a fourth platform to build in this sprint.
6. No more than three owner decisions, each with a plain-English example, measured consequence and recommendation. Separate blockers to starting reversible testnet code from blockers to a permanent release.

Example of a useful question: “Keeping independently selected community histories adds X to this measured workflow. Shall we retain it, or deliberately make this profile single-author?” Explain the consequences before asking. Do not ask James to choose abstract index families or signature encodings.

## Launch prompts

The leads may dispatch these prompts directly under James's war-room authorization. They are reusable lane briefs, not a request for James to launch duplicate tasks. Paths below are relative to the shared planning repository; on another machine, use the corresponding synced checkout. Read current repository instructions first. A task without shared filesystem access must say so and return a self-contained report to its lead; never assume chat history or unsynced files are shared.

### Claude conversation 1 — compact EFS challenger

```text
Work with Codex on the EFS path decision sprint. Read planning/AGENTS.md and
planning/Reviews/2026-09-12-efs-path-decision/README.md in the EFS workspace.
You lead Road B: find the smallest coherent implementation of EFS's important
promises. This is not permission to silently discard portability, typed
references, required developer validation, Lenses or required discovery.
You may challenge any requirement, but make its consequences explicit.

Read the linked overhead-and-selection protocol. First independently produce
your short architecture, expected cost centers,
strongest objection and one discriminating experiment. Do not just defend
either existing prototype or rebuild the full system. Then coordinate the
shared fixture and shortlist with Codex before implementation. Use the plan's
fresh-genesis disposable scope, evidence rules and shared heavy-run queue.
Do not modify another worker's active files or start background Anvil worlds.
Keep your small report on planning/main as
Reviews/2026-09-12-efs-path-decision/road-b.md, coordinating Git publication.
Begin by reporting your checkout/HEAD, dirty state, available coordination
method and proposed isolated code area. The shared brief owns the timebox.
```

### Claude conversation 2 — MUD reuse alternative

```text
Work with Codex on the EFS path decision sprint. Read planning/AGENTS.md and
planning/Reviews/2026-09-12-efs-path-decision/README.md in the EFS workspace.
You lead Road C: determine whether MUD plus a thin EFS layer is a better
foundation than a custom kernel. EAS implementation is excluded by James.
Research primary documentation and actual source. Compare World + Store with
Store-only before choosing one adapter. Reuse is allowed to win.

Map the important EFS outcomes to reused code, custom code, costs and trust
dependencies. Consider contract writes AND paid reads, portable authored
data, required queries, independent browser reconstruction and developer UX.
Read the linked overhead-and-selection protocol. Do not compare a raw table
write to a feature-rich EFS operation.
Nominate the strongest reuse route and one decision-changing uncertainty;
do not build two substitute filesystems. Give your independent short proposal
before reading the other roads. Prototype only after the shared shortlist.
Keep your report on planning/main as
Reviews/2026-09-12-efs-path-decision/road-c.md, coordinating Git publication.
Report checkout/HEAD, dirty state and how you can coordinate with Codex.
Follow the shared timebox, evidence rules and single heavy-run queue.
```

### Codex — coordinator and fuller-model challenger

```text
Engage the EFS path decision sprint in
planning/Reviews/2026-09-12-efs-path-decision/README.md.
Coordinate with the Claude lanes managed by EFS v2 Dev. Recheck source and
ownership, record T0 and freeze the outcome/fixture comparison. Lead Road A
without privileging the current design; use bounded internal reviewers and
the SDK, Data Explorer and Contracts roles for focused integration feedback.
Retain the independently written proposals before cross-review. Shortlist at
most two implementation roads, operate the shared finite-run queue and return
a provisional recommendation within 24 hours. Use day two to challenge the
winner and complete its joined integration gate. Preserve requirements unless James
explicitly accepts a sacrifice. Deliver the readable decision and build
handoff, not another indefinite validation cycle or production implementation.
```
