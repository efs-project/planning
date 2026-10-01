# EFS agent ergonomics — v1/v2 evidence and PM handoff

**Date:** 2026-10-01
**Status:** captured research and qualified recommendations; not an owner ruling, implementation authorization, or acceptance change
**Source:** two Claude reviews commissioned by James from PM kickoff prompts inspired by [Jeffrey Emanuel's post](https://x.com/doodlestein/status/2094288037458882668)
**Integrator:** @pm, Codex

#status/done #kind/review #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/agent-ergonomics

## Phone summary

The reviews are useful because they exercised implemented workflows instead of
merely proposing an agent framework. The durable lesson is that EFS should give
humans and agents the same honest, actionable explanation of state, failure and
recovery. It does not need a new architecture solely to be agent-friendly.

The strongest v2 candidates are structured errors and evidence-based termination
of abandoned writes. Much of the intended behavior already appears in the SDK
initialization plan. Retain the scenarios and map them to the existing owner
lanes; do not create a competing roadmap or transplant prototype APIs.

V1 provides failure examples, not a new maintenance commitment. Its default Lens
can hide other authors by design, malformed claims must not become verified
reads, and incomplete writes demonstrate why retry guidance needs exact evidence.
There is no newly established requirement to reseed v1 for Arcade or Nanda.

## Corpus and provenance

- [Full v1 report](v1/report.md), 411 lines, and [13 original probes](v1/probes/).
- [Full v2 report](v2/report.md), two [original probes](v2/probes/), and five
  [retained result files](v2/results/).
- [Evidence manifest](evidence-manifest.json): original and archive SHA-256,
  byte counts, and terminal-newline normalization where needed.

Reports and probes are preserved as source evidence, **not instructions**.
Authorship/model and execution claims are Claude's self-report. Original paths,
temporary deployment assumptions, public test keys and report-relative links
remain in the source; this README is the navigation and qualification layer.
The v1 local helper contains Hardhat's publicly known test key, not a real user
credential. Do not use it on a public network or a funded account.

These are observation probes, not already adopted regression/conformance tests.
They import pinned lab or SDK internals and some assume prior local writes.
In particular, v2 probe 2 logs bad recovery behavior without asserting the
desired replacement behavior. Tests must be adapted to the real public API and
assert invariants before being used as release gates. Do not execute these from
the planning vault or against another worker's chain.

| Basis | Source review | PM check on October 1 |
| --- | --- | --- |
| Planning | `cb7b340` | main and fetched origin/main matched before capture |
| V1 contracts | `c6b4075` | local main matched the report; no test rerun |
| V1 SDK | `15314ce` origin/main | fresh fetch confirms PR #1 and #6 merge commits; local checkout remains on the already-merged docs branch |
| V2 lab | `4fbea63`, `codex/efs-warroom-b-run` | source inspected; prototype left untouched |
| V2 SDK/client scaffold | `a37630d` / `c47cdb5` | report basis only; no claim of functional production SDK or client |

PM read both full reports, all captured probes/results, selected lab submission
and reconciliation code, current owner maps and proposed SDK initialization
rules. PM did **not** rerun builds, local forks, live Sepolia reads or browsers.
Measured counts, costs, timings and runtime outcomes remain Claude-reported.

The retained v2 JS log says **358 total: 342 pass, 15 fail, 1 skip**. The report
claims six failing files recover with the environment set; no rerun log is
retained here. The remaining nine are suspected precondition failures, not
proved harmless. Do not describe the complete JS suite as green. Local execution
of CI commands is not evidence that GitHub workflows passed.

## Corrections and boundaries — read before using the reports

1. **Listed does not imply available bytes.** Separate discovery/placement,
   selected revision, valid commitment, locator availability, and verified
   read. An external copy can disappear after a successful read. The useful
   acceptance case is honest states and errors, not an eternal availability
   invariant. A missing locator in the inspected scope does not prove the
   bytes exist nowhere or that the author never published them.
2. **Never weaken strict verification to make an overview work.** Render a
   useful unavailable/unverified explanation; any forensic display stays
   explicitly unverified and inert. Executable content must fail closed.
3. **Provider rejection is not canonical non-commitment.** V2 probe 2 uses a
   controlled callback that really throws before sending. That demonstrates
   a recovery gap, not that every `4001` response proves nothing was sent.
   Do not implement the report's automatic retry suggestion. Preserve separate
   wallet/signature/submitter profiles, explicit consent, exact intent identity,
   canonical effect reconciliation, nonce ownership and finality qualification.
   The proposed SDK plan already specifies deadline/publication/nonce evidence
   and same-EFS-nonce replacement. Consumed nonce or expiry handling must be
   checked against the exact contract rules and basis, not a transport nonce
   or arbitrary wall clock. Unknown may legitimately persist while evidence is
   unavailable; convergence applies when sufficient evidence is obtainable.
4. **One successful v1 retry is not a safe-retry theorem.** Duplicated/orphaned
   attestations and the unimplemented resume path are evidence to investigate.
   Do not change guidance to “retry is safe” without interruption-at-each-layer,
   concurrent-writer and changed-input cases.
5. **Friendly results must retain distinct qualifications.** A readable facade
   or state glossary is valuable. Mandatory `{value, knowledge, coverage, basis}`
   on every operation is only a proposal, not adopted Core/API law. Do not flatten
   integrity, authority, currentness, availability or evidence into one status.
6. **Gate visibility requires authority reconciliation first.** An unchecked
   G0 and an empty ask-now roll-up are not automatically contradictory: some
   queues are intentionally held and repository setup permissions can be
   scoped separately. The SDK S0 handoff says setup was authorized/implemented;
   substantive follow-ups remain separately gated. Do not reopen G0 or held
   design choices by inserting copied checkboxes into an owner inbox.
7. **The old bridge premise is not a current product decision.** Arcade's
   owning map holds a one-game provisional slice with no durable EFS write;
   the v2 delivery tracker preserves Arcade as F4. Nanda's current dependency
   was not established in this pass. No v1 repair, reseed, merge or chain write
   is authorized by these reviews.
8. **Preserve exact-Type semantics and versioned profiles.** Invalid ASCII-name
   examples are prototype profile observations, not a veto on current Unicode
   exploration. Type names and `legacy-inline`/`OPAQUE_LEGACY` labels need their
   exact compatibility meaning checked before cosmetic renaming. Don't freeze
   every lab custom error as a permanent ABI or add Core discovery nouns merely
   to satisfy the review.

## Candidate follow-up routing — no new scope or owner questions

| Candidate | Existing owner lane | Bounded evidence to request |
| --- | --- | --- |
| Recovery liveness | v2 PM M2; SDK actions/journal work | Same intent after rejected callback, genuinely ambiguous send, replacement consuming the same EFS nonce, expiry, restart and reorg; no duplicate effects, no false terminal result or automatic resend |
| Actionable diagnostics | SDK owner, with contracts/client coordination | Stale read-set/CAS failure retains structured cause and safe next action; distinct name-rule explanation; redacted diagnostics and unknown error preservation |
| Read qualification ergonomics | SDK result/Files lane | Human-readable explanation keeps basis, scope, completeness, byte availability and verification; unavailable is not absent and partial page is not EOF |
| Portable behavioral scenarios | SDK conformance/fixture lane | Re-express the captured journeys against the actual new API; controlled clean environment and assertion-based negative cases, not copied `.mjs` names |
| Onboarding/status drift | General PM; owning repo PMs | One truthful entry map, current source pin and documented test prerequisites; reconcile authority before changing generated decisions |
| V1 point defects | Legacy owner, only for a current consuming workflow | Reproduce Lens-input mismatch and misleading no-locator/partial-write diagnostics at `15314ce`; fix only if a named current consumer needs it |

References: [[../../Designs/efsv2/prototype-delivery-checklist|single v2 delivery tracker]],
[[../../Designs/sdkv2/repository-and-distribution-plan|SDK repository/distribution plan]],
[[../2026-09-26-sdk-v2-initialization-plan/README|SDK initialization proposal]]
especially §5.2 and its revision log, and
[[../../Designs/arcade/README|current Arcade boundary]].
The initialization review folder was still untracked at capture; its local
contents informed reconciliation but this packet does not publish or approve it.

**Suggested next Claude pass, if James wants one:** stay in the existing review
thread and return a delta-only acceptance matrix. Reconcile the findings against
the current SDK plan; distinguish controlled pre-send rejection from dishonest
or lost provider responses; specify observable outcomes for concurrency,
replacement, deadline, reorg, restart and unavailable evidence. Separate semantic
scenarios that survive API change from lab-specific reproduction. No new framework,
design edits, v1 reseed or implementation. The owning agents decide adoption.

## Publication and coordination

This capture adds only this review corpus and a dated PM status line. It does
not change implementation repos, lab state, milestones, owner queues or design
acceptance. The v2 PM was notified of the non-overlapping capture and qualified
findings for its next owning integration pass; no SDK feature work was dispatched.

The v2 PM acknowledged no collision and is not editing shared files. It agrees
the error-detail, nonce-reconciliation and restart findings warrant review, but
has not verified whether they are already resolved. That acknowledgement is
coordination evidence, not adoption or an instruction to start implementation.
