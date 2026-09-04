# EFS v2 overnight MVP convergence

**Status:** active design and disposable-experiment run; no production or freeze authority
**Coordinator:** v2-pm, Codex session `019fe3e5-c8ed-7e72-9d8e-9a0ea79ff5ea`
**Authorization:** James approved the proposed convergence run with “Engage,” 2026-09-04.
**Window:** stop when the deliverables are complete, or by 09:00 America/Chicago on 2026-09-04; record unfinished work honestly.

#status/draft #kind/review #repo/planning #topic/efsv2 #topic/coherence

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
- [ ] Compare August and September state/identity/result/authority assumptions; classify evidence as reusable, profile-specific or unproved.
- [ ] Reconcile SDK, Web Client and Explorer feedback into one minimal consumer handoff; preserve unfamiliar bytes and all independent evidence dimensions.
- [ ] Resolve independently confirmed implementation blockers; attach a falsifying example or test to every semantic repair.
- [x] Complete a compact proposed contracts engineering handoff with the first runnable tickets and artifact/test expectations.
- [x] Incorporate one workflow from each product lane; separate MVP blockers from deliberate later capabilities.
- [ ] Run focused checks and independent final review; commit/push exact verified paths on feature branches.
- [ ] Publish the morning result: buildable scope, source/interface handoff, evidence, residual blockers and genuine owner choices. Pause the overnight follow-up.

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
- Current result: work in progress; no new runtime, compatibility or review-pass claim.

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

### Role-owner collection

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
