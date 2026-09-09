# Overnight v1-parity and usability run

**Status:** active disposable prototype work, not a finished MVP or parity claim.
**Authority:** James's September 9 request to continue overnight, validate v1
capabilities and measure v2 performance and UX. Existing experiment branch only.

## Working goal

Demonstrate the [v1 capability inventory](../2026-09-09-files-parity-performance/parity.md)
through real v2 contract state, the shared SDK and a static SPA. A feature is
not complete because generic Types can represent it: it needs an observable
journey, failure handling, retained-state agreement and measured resource use.
The [sixteen-journey owner walkthrough](../../Designs/efsv2/testnet-files-mvp-plan.md)
is the finish line for the first usable Files loop. Advanced v1 rows remain
explicit gaps until demonstrated or separately deferred by James.

Native-goal bookkeeping is separate: the existing integrated-MVP goal reports
`usageLimited`; an attempted new goal was refused because it is unfinished.
No false completion or goal-state workaround was used. The existing thread
heartbeat is active hourly through September 9, 09:00 America/Chicago. It
respects actual usage availability and checkpoints at the cutoff. Local work
requires the computer and Codex to remain available.

## Execute in this order

1. **Binding reader — completed bounded checkpoint.** The existing
   [selected task](../2026-09-05-c0-core/binding-reads-plan.md) now has normal-limit
   deployments, independent current/historical read agreement, strict refusals,
   static consumption and [measured costs](../2026-09-05-c0-core/binding-reads-verification.md).
   Original size-failure evidence remains. Parent181 Forge/177 Node checks pass;
   independent task and final increment reviews approved. The separate upgrade
   Forge suite also passes14/14. The host is synthetic and revision-one only;
   this does not complete actual C0 or directory enumeration.
2. **Audit inventory — completed bounded source checkpoint.** The
   [ordinary audit-page implementation](../2026-09-05-c0-core/audit-pages-verification.md)
   at `ae99e1a` verifies real Scope/history pages, first tombstone anchors,
   same-name churn, pinned-H continuation and historical lifecycle. Parent
   190 Core Forge/14 upgrade Forge/178 Node checks pass; independent task review
   approves the source. Real density256 and a257 clamp case verify; optional513
   exceeds the unchanged diagnostic collector budget and is not a pass.
   Final increment review also approves the accompanying evidence/docs. Resolved
   Files/dead-name performance and the remaining query families are still
   unfinished; raw anchors are not usable current file rows. The
   [next executable handoff](directory-read-next.md) now starts at that join.
3. **Join actual Lens and Files operations.** Follow the
   [one-screen consumer checkpoint](../2026-09-08-upgradeable-foundation/consumer-checkpoint.md):
   A-first/B-first/EXACT, real directory/file semantics, source/destination
   preconditions, attributed tags, remove versus retract, and restore.
4. **Expose one shared SDK path in the SPA.** Zero-wallet guest reading;
   opaque intent preparation; receipt versus committed readback; scoped
   evidence reuse; bounded concurrent hydration; preserved drafts on races,
   navigation and upgrade. Do not create an authoritative browser-side tree.
5. **Walk and measure the joined system.** Repeat before/after populated
   upgrades; compare a fresh guest reader and a Solidity consumer; then close
   remaining v1 rows in useful order. Label synthetic wallet results and
   unavailable external checks honestly.

Each completed increment gets fresh tests, review, a concise retrospective and
exact-path publication on `codex/mvp-c0-coherence`. Do not restart reviewed
September 8/9 upgrade/lifecycle/journal experiments. No main merge, product
repository, public deployment, funds, durable data or protocol freeze.

## Performance and UX acceptance lens

| Question | Measurement / required distinction |
| --- | --- |
| Can an operation actually execute? | Full transaction gas, runtime and full initcode under unchanged normal caps; measure complete user operations, not only inner helpers |
| Is routine use reasonably cheap? | Separate setup, byte staging, metadata, relay/authorization and steady-state costs; matched workload for any v1/v2 ratio |
| Does a folder open promptly? | First useful rows and continuation latency; RPC method counts, bytes, sequential depth and bounded concurrency; cold versus same-basis reads |
| Does churn make a nearly empty folder unusable? | Same-name versus distinct-name churn, consumed anchors versus selected rows, scan and boundary work, number of empty partial pages |
| Do wider views remain useful? | Contract Lens widths 1/8/32/64; first/last/missing/conflict outcomes and cold/warm cost; no silent author truncation |
| Is consent understandable? | Guest zero prompts; one relayed message approval target; direct transaction fallback named honestly; session setup separate from routine zero-prompt writes |
| Does failure preserve work and truth? | Cancel/race/upgrade leaves drafts intact, zero unintended submit calls, no optimistic committed-success claim, no unknown-to-empty fallthrough |
| Can James understand it? | Keyboard/mobile usability, clear incomplete/conflict states and a short “Why this result?” view; raw IDs available without dominating ordinary browsing |

Record raw observations before selecting performance thresholds. A bounded
call or fast local EVM is not a UX pass. The diagnostic full-inventory reader
is not an acceptable per-folder browsing algorithm.

## First useful finding

The existing `efs-lab/1` browser still passes its nine isolated UI regressions,
but [a fresh latency probe](browser-latency.md) found ninety RPC requests to
show eight rows. This is a concrete SDK integration constraint, not evidence
that v2 contract queries themselves take ninety calls.

The actual new contract pages provide a second control: eight raw/hydrated
anchors cost79,371/481,142 gas;256 cost619,679/10,240,801 gas. Those are page-only
measurements, not finished folder reads. The maximum hydrated response is65,856
bytes: choose caller budgets and small UI pages deliberately. Read-only phone
and keyboard probes also found two consumer followups: Evidence is hidden on
narrow screens, and finishing pagination loses keyboard focus. Both are
documented for the joined screen rather than claimed fixed by contract tests.

## Owner followups

No project-design answer is needed for the next reversible experiment. The
native goal's usage-limited state may need James's app controls; scheduling
does not claim to reset it. Actual wallet compatibility, acceptable paid-chain
costs and prioritization of advanced parity rows should be revisited with the
working browser, not inferred from synthetic tests.
