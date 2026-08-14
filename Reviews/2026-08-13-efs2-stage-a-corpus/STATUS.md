# EFS 2.0 Stage A corpus — STATUS (read this first)

**Status:** done at the specification/evidence level; proposal-only; Stage B unrun

**Audience:** James, the EFS 2.0 PM, and the Stage B implementation team

**Last touched:** 2026-08-13

**Reviewed protocol tip:** `6ea657e`

#status/done #kind/report #repo/planning #topic/efsv2

> **Stage A is complete as a specification and evidence package.** It does not
> adopt or freeze EFS 2.0. Canonical byte fixtures, prototype implementations,
> executions, measurements, independent reconstruction, and deployment are
> Stage B work and have not run.

## Verdict

The interrupted Fable repair was completed forward, independently red-teamed,
repaired, and re-reviewed. At protocol tip `6ea657e`, the final bounded gates
found no open Critical or Important defect in the Stage A candidate interfaces.
The last gate repairs pinned exact challenge-window winner identity, made the
positive digest-index fixture mintable, reconciled idempotent retry carriage,
and removed a false immediate owner ask.

This verdict means the corpus is coherent enough to build and compare in a
disposable Stage B. It does **not** mean the candidate won the bakeoff or earned
permanent deployment.

## The eight commissioned deliverables

| # | Deliverable | Current artifact |
|---:|---|---|
| 1 | Exact candidate B0 | [`b0-overview.md`](./chapters/b0-overview.md) plus eight subsystem chapters |
| 2 | Smallest coherent model and explicit alternatives | overview + [`bakeoff-spec.md`](./chapters/bakeoff-spec.md) |
| 3 | Requirement-to-test traceability with authority labels | [`traceability.md`](./chapters/traceability.md): **151 rows = 127 COVERED / 20 DEFERRED / 4 GAP** |
| 4 | Controlled bakeoff | [`bakeoff-spec.md`](./chapters/bakeoff-spec.md): **9 cells** with declared axes/confounds |
| 5 | Fixed fixtures and harness interfaces | [`harness-and-fixtures.md`](./chapters/harness-and-fixtures.md): **10 fixtures / 16 CV suites** |
| 6 | Vectors and falsifiers | [`vectors-and-falsifiers.md`](./chapters/vectors-and-falsifiers.md): **GV-1..18 / 14 CF / 12 KA / 7 AA** |
| 7 | Proposed spine integration without silently applying it | [`proposed-spine-edits.md`](./corpus/proposed-spine-edits.md): **16 proposal-only edits** |
| 8 | Durable evidence and provenance | standards audit, carry-in register, intake findings, and preserved red-team findings |

## What remains deliberately unclaimed

- No Stage A proposal is adopted into `Designs/efsv2/`.
- No semantic or contract freeze has occurred.
- No canonical Stage B corpus bytes, Type IDs, signatures, cursors, or state
  digests have been minted.
- No Solidity, TypeScript, or Rust prototype has executed the corpus.
- No gas/state-growth measurement, independent reconstruction, deployment, or
  production-readiness claim exists.
- `ERC1271_VERIFY_GAS` remains measurement-pending. Stage B must choose one
  concrete value per `corpusVersion` before any comparison cell can mint.
- James has no immediate mechanism decision from Stage A.

## Honest gaps and deferrals

The 20 DEFERRED rows have named successor homes. Four active non-B0 gaps remain
explicit rather than being presented as silently solved:

| Gap | Missing boundary | Home |
|---|---|---|
| G-2 | Managed-Principal recovery must not imply funds custody or decryption recovery | future managed-Principal/KEL round |
| G-3 | Recoverable vs shreddable privacy tiers and KEM rotation/rewrap lifecycle | privacy/crypto profile |
| G-4 | Foreign-contract adapter or local-commitment disclosure profile | V2-E8-adjacent adapter work |
| G-5 | Pending/outbox data must never render as admitted/confirmed | SDK result-model lane |

These gaps block claims about those future capabilities. They do not block the
local B0 Core comparison specified here.

## Review and repair trail

- Initial design, seam adjudication, and red-team evidence remain preserved in
  this folder. Historical “repair incomplete” wording in the raw red-team
  record describes the interrupted Fable run, not current status.
- The repair series spans `48bf72d..6ea657e`; the final long-horizon and
  release-gate repairs are `f430e90` and `6ea657e`.
- Independent scoped reviews approved the authority profile, long-horizon
  reconstruction, final Lens/digest interfaces, SR-3 retry semantics, and A2
  owner-routing wording. Repository release checks are recorded in the
  publication commit and the accompanying [Stage A report](./stage-a-report.md).

## Next

Run the disposable Stage B program: mint one exact corpus, implement it in
Solidity/TypeScript/Rust, execute the 9 cells and 10 fixtures, measure the full
write/read/state budget, and perform clean-room reconstruction. Return only
falsified arms, measured budget failures, or genuinely irreducible owner forks.
