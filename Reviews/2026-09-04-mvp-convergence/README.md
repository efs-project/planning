# EFS v2 overnight MVP convergence

**Status:** completed design/disposable-experiment handoff; no production or freeze authority
**Coordinator:** v2-pm, Codex session `019fe3e5-c8ed-7e72-9d8e-9a0ea79ff5ea`
**Authorization:** James approved the proposed convergence run with “Engage,” 2026-09-04.
**Window:** stop when the deliverables are complete, or by 09:00 America/Chicago on 2026-09-04; record unfinished work honestly.

#status/done #kind/review #repo/planning #topic/efsv2 #topic/coherence

## Goal and boundaries

Produce one coherent implementation handoff from the existing Core, SDK and
client work: buildable scope, exact source/interface references, reusable
evidence, real blockers and only irreducible owner decisions. Do not reopen
settled work or expand the MVP to accommodate every application.

This run permits design changes, independent reviews and narrow throwaway
experiments. It does not authorize product code, production repositories,
public deployment, durable user data, a semantic freeze, a V2-C1 ruling or new
permanent agent tasks. Tests are evidence, not authority. The September
MVP-C0 remains a local synthetic control, not a permanent selection against
the layered Type/QueryProfile proposal.

Work happens on owned feature branches. The coordinator owns this checkpoint,
the integration record and Core edits on `codex/mvp-c0-coherence`. SDK and
Explorer may write their own role branches; other PMs first return read-only
reports. No shared-main edits or unattended merges into main. Ordinary source
documents, not this temporary task assignment, define lasting responsibilities.

## Exact starting sources

Origin was fetched successfully at the start of this run. These refs are the
review inputs even if a branch subsequently advances. Paths are relative to
the planning repository; use `git show <commit>:<path>` for cross-branch reads.

| Input | Commit | Entry |
|---|---|---|
| Shared operating rules / role roster | `fffe2934eca3c315b74dd0710a210cf316216625` | `AGENTS.md`, `Agents/README.md` |
| September MVP-C0 | `12ef4c5b929759c87fcf4886a1619734a6f9a044` | `Designs/efsv2/disposable-mvp-profile.md`, `mvp-c0-genesis-manifest.md` |
| August EXP-C0 readiness | `2573f08b170bf3eb855ad5a68c31ee7b0215272d` | `Designs/efsv2/mvp-build-start-packet.md` |
| SDK consumer evidence | `57d04f85ae2687ee8ea63d945378df5a9a6492a5` | `Reviews/2026-08-25-sdkv2-exp-c0-mvp/README.md` |
| Explorer consumer evidence | `8d90ecbf85390f1151fa1b2dbf93852a1bfc8448` | `Reviews/2026-08-25-data-explorer-exp-c0-consumption/README.md` |

The August consumer source-lock work is already complete at its stated static
scope. It is not proof of September compatibility, browser execution or a
complete contract runtime. September's operation-specific result families,
B0-bundled Type/index control and composite WritePlan must not be relabeled
as August's split-profile ResultV0/AdmissionPlan interface.

## Execution plan

**Architecture:** preserve each experimental profile's exact bytes and
semantics; reconcile at explicit consumer boundaries, then test only the
remaining implementation-risk deltas. No new universal protocol or wire format.
**Tools:** Markdown source review and existing disposable fixtures; introduce
test code only when a concrete falsifier warrants it.
**Approved brief:** James's preceding in-task approval of the MVP convergence
proposal; scope and outputs are summarized above.

- [x] Refresh sources, verify the owned worktree, run baseline decision and tri-sync checks.
- [x] Dispatch ten bounded role-owner lanes and two independent review lanes.
- [x] Compare August and September state/identity/result/authority assumptions; classify evidence as reusable, profile-specific or unproved.
- [x] Reconcile SDK and Explorer feedback with the substitute Web Client acceptance mapping; preserve unfamiliar bytes and all independent evidence dimensions.
- [x] Resolve independently confirmed draft contradictions; attach counterexamples or exact conflicting source evidence. Remaining codec/runtime tasks are not claimed implemented.
- [x] Complete a compact proposed contracts engineering handoff with the first runnable tickets and artifact/test expectations.
- [x] Incorporate one workflow from each product lane; separate MVP blockers from deliberate later capabilities.
- [x] Run focused checks and independent final review; prepare exact verified paths for feature-branch publication.
- [x] Prepare the morning result: buildable scope, source/interface handoff, evidence, residual blockers and genuine owner choices. Publication and heartbeat-stop receipts belong to the coordinating task.

## Lane receipts

These are assigned work, not completed findings. Task IDs allow bounded result
retrieval; they confer no architectural authority.

| Task | Codex task ID | Initial deliverable |
|---|---|---|
| EFS v2 SDK PM | `01a02a24-01b3-7f12-9f2e-887aea66e9e8` | Five-seam compatibility delta and reusable-vector map |
| EFS Data Explorer PM | `01a02a24-0348-7c50-81fd-2a4ac43c62af` | Facts/UX matrix, guest experiment boundary |
| EFS Web Client / OS PM | `01a0025a-16e3-7f31-8a98-304963732995` | Nine tests mapped to evidence, wallet traces and precise blockers |
| Project Manager | `019f9112-bc0a-7af0-a9ce-93323ae39787` | Portfolio sequencing and owner-attention check |
| EFS Git / Forge PM | `019ffeb7-4121-7951-b16d-686ae243b91e` | Concurrent ref update and host-loss workflow |
| EFS Open Web App Store PM | `01a0025a-11ef-77f1-9d54-c1e935783ea7` | Release/catalog conflict and publisher-loss workflow |
| EFS Arcade PM | `019fde96-59f3-7431-a7aa-f8aedaab1739` | Exact game artifact and corrupt-primary fallback workflow |
| OS Drives PM | `019f896d-f567-79d1-8e13-b1c0cdffd893` | Partial directory and provider-loss mount workflow |
| EFS Booru PM | `019ffeb9-fd37-71a2-be4e-c9fae5532867` | Cross-media tags, Type evolution and partial query workflow |
| EFS Media Library PM | `01a06ac1-0bf1-7661-94f5-ff2b6395c7d6` | Work/revision/range/private-overlay workflow |

Temporary independent reviewers: `contracts_handoff` prepares the proposed
engineering handoff; `c0_boundary_review` attacks signing, genesis, sessions,
result preservation and state-only reconstruction. Neither creates a permanent
role agent or product repository.

## Verification and checkpoint

- Baseline: `open-decisions.sh --check` and `tri-sync-check.sh` pass at `12ef4c5`.
- Coordination: all ten task messages were delivered successfully.
- Overnight follow-up: `efs-v2-overnight-mvp-convergence`, hourly, ends by the
  window above or earlier on completion. Do not redispatch completed lanes.
- First checkpoint at `5d75309`: work in progress; no new runtime or compatibility claim.

### First concrete findings and repairs

- Independent review confirmed circular Type-group ordering: G4 sorted by IDs
  whose preimage contains that same ordered group. The draft now fixes the
  declared member order and resolves local reference indexes before hashing.
- The session contract did not explicitly bind a signed plan to one exact
  grant despite requiring substituted-grant rejection. The draft now reserves
  EOA lane zero and permanently binds each nonzero session lane to one grant
  for that Principal, including after revocation/expiry. This is a C0-only
  restriction, not a new permanent delegation design.
- [Law-level counterexamples](./seam-laws.test.mjs): the original-rule model
  failed four of six assertions; the repaired model passes eight of eight.
  Run `node --test Reviews/2026-09-04-mvp-convergence/seam-laws.test.mjs` from
  this checkout. Dependencies are Node and `cast` on PATH (or explicit
  `C0_CAST`); observed Node v24.11.0 and cast 1.7.1, commit `4072e487`.
  The test uses exact B0 group-hash dependencies with synthetic opaque member
  bodies and a deliberately narrow grant-binding state model. It is not valid
  Type admission, signature verification, full nonce/budget validation,
  Solidity, browser or reconstruction conformance. Independent repair review
  accepted both changes and reran all eight tests successfully. It explicitly
  did not verify group-reference parsing, reordered encoded-input rejection,
  uint192 enforcement, signatures, nonce sequencing or budget behavior.
- [Contracts engineering handoff](./contracts-handoff.md) now identifies three
  runnable tickets and the specific old-harness shortcuts that must not be
  transplanted as a finished Core. No repository or runtime was created.

### Role-owner collection at the first checkpoint

[Seven completed reports](./lane-results.md) support one local Core/Files
round trip as the next joined deliverable and expose three small application
documentation deltas plus an explicit retry/read-back test. SDK and Explorer
are still active. The Web Client / OS lane was superseded by James's newer
direct extension research assignment; do not redispatch it. The coordinator's
temporary reviewer supplied the [nine-test evidence mapping](./acceptance-map.md).
All nine Core/browser journeys remain unrun; eight synthetic seam-law passes
are not a substitute for those journeys.

On each continuation, inspect the current branch/dirty state and this file,
retrieve only new lane results, and update the smallest useful checkpoint.
Keep new findings and their evidence here or in linked lane artifacts; do not
grow a second agent-management framework.

## Converged handoff — 2026-09-04

**Outcome:** the bounded design reconciliation passed its scoped final review.
The next milestone is one local synthetic create-file transaction followed by
independent directory, revision and verified-byte recovery. The principal
remaining dependency is an executable exact-byte/Core package, not another
round of broad Type-system brainstorming. This does not mean the nine
Core/browser journeys ran or that the permanent v2 design is frozen.

### Exact consumer inputs

Root's two Core draft repairs are at
`5d7530993339a0786aa41e1dbb0fd786cd450f32`; the subsequent SDK receipt-timing
clarification and application-document repairs are in this checkpoint's
containing commit. Resolve that commit before handing sources to an
implementer; do not use an unpinned moving branch tip.

| Completed role | Exact published commit | Artifact path from repository root |
|---|---|---|
| SDK PM | `e9536b7d97d3e3f8d135798458680686b034e892` | `Reviews/2026-09-04-sdk-mvp-convergence/README.md` |
| Data Explorer PM | `df0ddd3b77fad7dae4e84c3cde6b009d703cc0cb` | `Reviews/2026-09-04-explorer-mvp-convergence/README.md` |

The additional artifacts at that SDK commit are:

- `Reviews/2026-09-04-sdk-mvp-convergence/core-delta-5d75309.md`
- `Reviews/2026-09-04-sdk-mvp-convergence/evidence-closure-probe.mjs`
- `Reviews/2026-09-04-sdk-mvp-convergence/evidence-closure-probe.test.mjs`

Use `git show <commit>:<path>` after fetching planning. The role branches were
not whole-merged into this branch: their exact reports remain evidence, not
imports of every older mechanism or branch-local decision. Both owners
explicitly consumed the two Core repairs through `5d75309`. Their reports
predate this checkpoint's SDK wording repair; do not claim they reviewed that
later text. Independent final review covers the integrated delta instead.

August consumer work used serialized Core source
`b9088d6a24f4d40bcca6ba300523b25cc7c608d2`; the later readiness tip `2573f08`
is not its actual input. Reuse preservation laws, independent serialization
and mutation-test techniques. Do not reuse split-Type/QueryProfile IDs,
`ResultV0` enums/bytes, old limits or a static pass as September execution.
`SPLIT_FUTURE` stays unsupported; never invent `queryProfileId=typeSchemaId`.

### The same five interfaces, with honest timing

| Seam | Joined consumer contract |
|---|---|
| Exact read | Preserve raw bytes and every qualification/basis. A missing rich renderer does not turn an upstream FOUND into UNKNOWN; unsupported semantic evaluation remains explicitly unsupported. |
| Scoped page | Retain observed entries and same-basis continuation/closure evidence. A partial or zero-row filtered result is not an empty directory or proof of absence. |
| Verified bytes | Record each eligible attempt; obtained corrupt bytes are not trusted content. Fallback pins the same commitment, never another release or subject. |
| Plan / authorize / submit | Pure wallet-free planning; prepared evidence includes only obtained witnesses/local checks. Direct approval/submission can be one provider call. Core receipts are attached only after observed acceptance. |
| Canonical read-back | Independently compare every planned effect at a committed basis, retaining the earlier plan/read/receipt journey and raw evidence, not only a success DTO. |

Small product cards may point to an inspectable/exportable evidence closure;
they do not need a universal oversized result wrapper. Unknown fields and
wide integers survive. Missing backing is partial/unavailable export, never
complete evidence. This preserves developer ergonomics without losing facts.

The SDK counterexample is concrete: after a direct wallet returns a transaction
hash but before execution, there is no Core authorization receipt. The old
`AuthorizedWrite` prerequisite could not represent that legal state. The
draft now illustrates `PreparedWrite` and explicitly preserves receipt timing
and lineage, without adopting public names or adding another prompt.

### Verification and evidence ceiling

- Coordinator reran the SDK's nine synthetic representation tests on Node
  v24.11.0: **9/9 pass**, plus both syntax checks. They preserve declared
  evidence closure, profile/run separation and raw/unknown/wide-number data.
  They do not authenticate facts, prove that all necessary edges were
  declared, execute a wallet/Core/browser, or implement a C0 codec.
- Root's eight seam-law tests cover only the synthetic Type-group dependency
  and grant-lane models described above. The two suites have different scopes;
  their counts must not be added into a Core/browser-conformance claim.
- Explorer produced a five-case design/UX matrix, **no new executed probe**.
  August E1a remains unproved and E1b unrun. Participant/accessibility review,
  fake shared-Inspector evidence and actual cold-browser evidence stay
  distinct. A local C0 run is not the older public-Realm E1b gate.
- All nine real M0 tests remain **NOT_RUN**. The
  [acceptance map](./acceptance-map.md) names exact missing artifacts and
  actual wallet/provider-trace requirements, including setup and lifecycle.
- Fresh final checks: root law tests **8/8 pass**; `git diff --check`,
  `open-decisions.sh --check` and `tri-sync-check.sh` pass. Five added relative
  Markdown file targets and three source-pinned report artifacts resolve.
- Independent `contracts_handoff` review accepted the four source-document
  edits with no findings; `c0_boundary_review` accepted the integrated handoff
  with one minor artifact-path clarification, now applied. These are scoped
  design reviews, not audits of a complete implementation or main-merge approval.

### What work comes next

Follow the three [engineering tickets](./contracts-handoff.md):

1. Lock one disposable build and finish exact run-only manifest, capability,
   Type-group and grant codecs with independent vectors. No invented
   per-consumer defaults; include widths, bounds and declared group indexes.
2. Measure the small byte carrier and implement/bootstrap/seal one fresh
   synthetic Realm with real authority verification and state-only evidence.
3. Join create-file and independent recovery; consume the emitted artifacts
   through the SDK, then add direct-directory and granted-session revision
   arms. Test prior accepted-but-superseded receipt recovery separately from
   current expiry/revocation; no replayed effects or present-authority claim.

This run stops at the reconciled design/experiment handoff rather than silently
creating a runtime repository. Existing disposable Core permission remains;
production repo/code, thin product/browser implementation, public deployment,
durable data, main integration and protocol freeze retain their separate gates.
No new irreducible owner decision was found for the bounded next experiment.

The other six products have [one bounded workflow each](./lane-results.md).
They need neither new Core nouns nor inclusion in the Files MVP on the evidence
examined. Their later adapter suggestions are not newly dispatched work.
Web Client / OS remains on James's newer extension assignment; do not retask it.
