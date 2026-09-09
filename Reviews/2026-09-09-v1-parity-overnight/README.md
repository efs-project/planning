# Overnight v1-parity and usability run

**Status:** overnight checkpoint retained; heartbeat paused at the September 9,
09:00 America/Chicago cutoff. MVP and v1 parity remain unfinished.
**Authority:** James's September 9 request to continue overnight, validate v1
capabilities and measure v2 performance and UX. Existing experiment branch only.

## September 9 owner-priority correction

James clarified after this checkpoint: **engineering correctness comes before
extreme efficiency; neither the current limits nor the Ethereum library is
frozen.** See the [owner ruling](../../Designs/efsv2/owner-rulings.md#correctness-before-extreme-efficiency-in-the-mvp-prototype).
Keep the measurements below with their original settings. Their unchanged caps
are comparison controls, not requirements for new candidates; a larger download
is acceptable when a better library improves the engineering.

This supersedes the next-step selection below: first compare sensible reader
budgets and simpler acquisition/API choices before implementing segments solely
to preserve 512 requests. Segments and a read helper remain candidates, not
required architecture. Preserve validation, cancellation and honest coverage;
measure performance to explain tradeoffs. The [updated experiment handoff](../2026-09-09-files-reader-scale/next-experiments.md)
separates this direction from the retained earlier advice. No runtime, captured
evidence or paused scheduling state changed with this correction.

## Latest useful checkpoint

The [Files-first guest screen](../2026-09-09-files-screen/files-lanes-verification.md)
at `84ef041` reads actual qualified contract data through the shared reader.
Seven observations across A-first/B-first/EXACT match independent reconstruction.
Current Files, attention and historical positions now have separate presentation;
phone, keyboard, 200% text, cancellation, recovered-file focus and failed-prefix
checks pass. The first four agreeing Files take a median 2.172 s with 50ms
injected per-RPC delay; the next four take 0.538 s. These are local experiments,
not a WAN or full Files-MVP claim.

[Same-data compression](../2026-09-09-files-screen/delivery-verification.md)
reduces its exact earlier screen's non-RPC body by 73.4% without removing checks.
It does not solve the [larger-folder and churn limit](../2026-09-09-files-reader-scale/churn-findings.md):
the prototype's 512-request lifetime can stop before four surviving files are
found. The separate 96/128 reference-collector refusals are not performance
measurements. No reader budget was increased to make the report green.

The [SDK/Data Explorer follow-on plan](../2026-09-09-files-reader-scale/next-experiments.md)
selects reversible same-observation acquisition segments, a separately measured
read-helper comparison and verifier scalability. The presentation part is now
implemented; yield-oriented scan/continuation is not. FilesRouter actions,
heads/content, tags/filters and real wallets remain the subsequent integration
work. The [v1 inventory](../2026-09-09-files-parity-performance/parity.md) still
names the advanced capability gaps; the whole parity row is not checked off.

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
heartbeat was paused through the app at September 9, 14:00 UTC (09:00
America/Chicago), and its persisted PAUSED state was verified. Its scope,
recurrence, notification preferences and target task were otherwise preserved.
The native goal was not marked complete. A future authorized continuation can
start from the reviewed checkpoint and next bounded plan; no local prototype
server or test run is intentionally left running by this pass.

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
   The [real-store B0 point checkpoint](../2026-09-05-c0-core/lens-point-verification.md)
   is implemented at `29859b2`, task-reviewed and parent-reproduced with200 Core
   Forge/14 upgrade Forge/185 broad Node passes. All24 Lens outcomes/gas rows
   reproduce. Final whole-increment review approves through `95eac01`; revision-one
   mechanics precede the separate populated-upgrade/Files reader join.
   The [populated upgrade read increment](../2026-09-08-upgradeable-foundation/upgrade-read-verification.md)
   now passes at `bcd0643` with test configuration at `45f3667`: parent200 Core
   Forge/19 foundation Forge/196 Node tests, five independently reverified
   snapshots and12 matching normal query measurements. Existing writer and
   accepted history remain unchanged. Final whole-increment review approves
   experimental publication through `66f9da8`. The next
   [bounded shared Files reader](../2026-09-09-files-reader/README.md) now has
   task-reviewed scope/adapter code at `c581366`/`eb14059` and a fresh 14-group
   parent pass. Actual root Mount/Plan/charter/selected Entry checks and
   cumulative Scope listings agree with the full retained-state oracle.
   Malformed winners, conflict, unavailable rows and incomplete discovery
   remain distinct. This is offchain fixture interpretation, not an onchain
   Files certificate; the router, bytes/head traversal and browser were still
   open at that checkpoint. The guest browser join below has since advanced.
4. **Expose one shared SDK path in the SPA.** Zero-wallet guest reading;
   opaque intent preparation; receipt versus committed readback; scoped
   evidence reuse; bounded concurrent hydration; preserved drafts on races,
   navigation and upgrade. Start with the [small guest Files screen](consumer-build-card.md)
   and measure its real RPC path separately from offline retained-snapshot
   replay. Its guest-read portion is now implemented in the current screen
   above; intent preparation/actions and real-wallet evidence remain open.
   Do not create an authoritative browser-side tree.
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

The [bulk-create probe](../2026-09-09-files-parity-performance/bulk-create-findings.md)
adds a concrete write/UX limit: one 7-leaf metadata creation fits at 8.67m gas;
two or three in one transaction exhaust forwarded admission gas. Independent
readback proves full rollback, and the same two files succeed separately.
Bulk jobs therefore need bounded preflight, resumable per-file progress and an
honest distinction between approval count and transaction count. A format's
64-leaf ceiling is not a throughput promise.

Real Lens measurements also replace optimistic schedule arithmetic:64-source
agreement/conflict costs1.54m/2.13m resolve transaction gas; the latter's repeat
STATICCALL still costs1.56m marginal gas in the same transaction. The fixed
Query library fits at19,181 runtime bytes. This is enough to continue measured
integration, not a promise that resolving every row through a wide onchain
view is cheap. Small scoped queries and exact-context evidence reuse need
actual browser measurements.

## Owner followups

No project-design answer is needed for the next reversible experiment. The
native goal's usage-limited state may need James's app controls; scheduling
does not claim to reset it. Actual wallet compatibility, acceptable paid-chain
costs and prioritization of advanced parity rows should be revisited with the
working browser, not inferred from synthetic tests.

## What this loop changed in our approach

- The initial eight-name/two-File screen was a useful control but a weak scale
  workload. Unique File Objects and many retired names exposed independent
  costs before we could mistake a small successful demo for directory parity.
- First useful result matters more than first source page. Four current Files
  can still be undiscoverable within the present lifetime after enough churn.
  Preserve the failure and fix acquisition, not only the progress wording.
- Smaller HTTP delivery is worthwhile, but its measured byte saving does not
  remove RPC dependency depth. Keep network delivery and checked read-call
  shape as separate controls rather than crediting one with the other's cost.
- Real UI review caught things contract tests could not: mutable explanations
  across an in-flight update, IDs dominating the phone drawer, a weak text-size
  test, and recovered-file keyboard focus. Each was reproduced and corrected.
- PM input made the next choices narrower: Files/attention/history is a
  presentation change; same-observation segments are a reversible SDK
  experiment; a mandatory helper, current-name index or history pruning would
  be a distinct Core/owner decision. No such permanent decision was made.

The next highest-leverage implementation is the bounded same-observation
continuation arm on the already independently verified 64/60 fixture. Then
measure the optional read-helper arm against the same result law, alongside
the FilesRouter/head/content joins. Do not rerun the whole architecture-design
process or call this guest checkpoint a finished MVP.
