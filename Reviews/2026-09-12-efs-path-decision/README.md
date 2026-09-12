# EFS path decision — a 24–48 hour Codex / Claude sprint

**Date:** 2026-09-12

**Coordinator:** @v2-pm, Codex

**Standing:** active engineering war room, launched by James on September 12. Codex coordinates its agents; James's existing Claude **EFS v2 Dev** task has received and acknowledged the kickoff and is asked to coordinate the Claude lanes. No permanent requirements or protocol bytes are frozen; production repositories/deployment remain out of scope.

**Outcome:** recommend an architecture we can begin building, with its costs, actual sacrifices and remaining gates plainly visible. Not a claim that a 50-year foundation can be proved in two days.

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
- Date any ETH/USD and chain-fee assumptions. Show execution, data-availability and other fees separately, with a range; local receipts are not live Ethereum/OP/Base/Arbitrum fee quotes. Current-dollar affordability is not a 50-year promise.
- Compare MUD plus the necessary EFS adapters and queries—not a raw table write against a complete EFS file lifecycle. A bare mapping is a limited diagnostic control, not a feature-equivalent rival or a proved theoretical lower bound.
- Record source/evidence pins and independent expected outcomes. Receipt inclusion, matching hashes and retained RPC transcripts are not independently authenticated chain-state proofs. Report the proof level actually checked.

The fuller seven-fact create is currently about **5.06M gas**. The native canonical quote create is **627,672**, with a matched contract quote update at **198,745**. These measure different promises; their ratio is **not** the price of portability. See the retained [[../2026-09-11-efs21-overnight|comparison and qualifications]] and [[../2026-09-12-efs21-canonical-native-types-results|canonical native results]]. This planning pass did not rerun those benchmarks.

Baseline pins: fuller control `ebc7d540570827c5f5052af83d2cbd80f54092a7`; native source `b8c27754314c97ab48c5b2454f9be05653e6b393`, retained evidence `d269e5560d23af169e386f8ad92d9a5f60a9c382`. Verify worktree HEAD/dirty state at launch; a directory called `planning-efs21-direct` is not proof it holds the fuller control. Preserve Fable's existing uncommitted work.

## 6. Coordination without another coordination system

Keep this brief and small lane reports on planning/main, visible in Obsidian. No agent-framework scripts or new registry are needed. Codex maintains the shared summary; each lane writes its own report and hands over exact commits. Serialize Git publication from the shared checkout, stage exact files and never sweep up someone else's work. Prototype code may use agreed isolated worktrees; do not migrate or merge existing prototypes merely to publish findings.

Use the **Coordinator checkpoint** below as the single coordination surface, written by Codex. Lanes read it at phase boundaries and before changing code or requesting a heavy run, not in a busy polling loop. They report proposals/results and run requests in their own lane note. Codex records the agreed fixture, shortlist and explicit run handoff here. No acknowledgement means no heavy-run permission; continue independent light work. Without shared access, that lane stops at a self-contained proposal instead of making James a routine run scheduler.

Codex is the default heavy-run operator. Before anyone builds or starts a chain, explicitly hand off the run slot and record the owning process, scratch paths and watchdog. Use finite, bounded-history Anvil runs; no unrestricted state dumps, persistent background benchmark nodes or full storage traces. Proposed budget: 15 GB total scratch and 50 GB free-disk reserve. Stop before crossing it, retain compact evidence, and clean only verified run-owned paths. Preserve existing user demos and other agents' processes.

Publish consolidated owner checkpoints at the first shortlist, 24-hour recommendation and final handoff—not every cross-agent message. The Codex thread heartbeat `coordinate-efs-engineering-war-room` checks hourly through September 14 at 23:10 UTC to resume useful work and coordinate returned results. It stays quiet on unchanged state and stops at the final handoff/deadline. This is a follow-up mechanism, not evidence that every worker or laptop process runs continuously.

### Coordinator checkpoint

- Phase / T0: **independent proposals and shared-fixture preparation / 2026-09-12 23:10 UTC**. War-room delegation is active; no new chain experiment has run. Provisional recommendation due September 13 at 23:10 UTC; final handoff due September 14 at 23:10 UTC.
- Participants: Codex Road A analyst, existing SDK PM and Data Explorer PM dispatched; Claude **EFS v2 Dev** kickoff sent and acknowledged by 23:41 UTC. Its [[claude-pm|acknowledgement]] records an independent in-session MUD specialist and evidence extractor; a persistent extra Claude conversation is unnecessary. Earlier MUD source, cost and portability reviews are completed inputs, not new active seats.
- Baselines: kickoff published at planning `2552962`; native source/evidence pins in section 5 remain the named comparison pins. Fable's existing untracked brainstorm is preserved. The similarly named direct worktree is the stopped `f873890` size probe, not the fuller control.
- Frozen fixture / shortlisted roads / actual probes: guarantee and measurement protocol revised; final executable fixture still to be agreed. MUD source preflight is linked below; no performance winner selected.
- Heavy-run slot: **not granted**; no new run started by this plan.
- Next handoff: collect independent Road A/B/C proposals and SDK/Files fixtures; pin the shared capsule, expected outcomes and smallest matched experiments. Read [[mud-source-preflight|Codex's MUD source preflight]] only after recording an independent Road C proposal. Existing typed-read-facet work is an enabling option, not automatically the next experiment or a demonstrated economic win.

| Current owner / contact | Exclusive write scope and next result |
|---|---|
| Codex v2 PM, task `019fe3e5-c8ed-7e72-9d8e-9a0ea79ff5ea` | This checkpoint, serialized publication, common comparison and run handoffs. |
| Claude **EFS v2 Dev**, task `local_3ff543b6-2646-4fa5-b113-2eddc7dd3cf1` | `claude-pm.md`: acknowledge actual child agents, worktrees and capacity; assign `road-b.md` and `road-c.md`. This replaces the proposed old Claude Project Manager contact. |
| Codex internal `/root/warroom_road_a` | `road-a.md`: independently identify the largest safe persistence savings and one paired experiment; source inspection only initially. |
| **EFS v2 SDK PM**, task `01a02a24-01b3-7f12-9f2e-887aea66e9e8` | `sdk-fixture.md`: shared joined semantics, caller API examples and expected outcomes, not protocol bytes. |
| **EFS Data Explorer PM**, task `01a02a24-0348-7c50-81fd-2a4ac43c62af` | `files-journey.md`: smallest observable lifecycle/discovery journey that could falsify a cheaper model. |

**Publication owner: Codex v2 PM until explicit handoff.** All workers, including Claude, write only their named reports and hand them back uncommitted for review and exact-path publication. Claude's initial acknowledgement is already published at `6219a98`; the shared-index rule was then sent directly to EFS v2 Dev. Do not pull/rebase or commit concurrently from this shared checkout: “pull before commit” alone does not serialize its index. New code ownership and the heavy-run lease must be recorded before implementation/runs. Worker IDs are current contact hints, not durable architectural ownership.

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
