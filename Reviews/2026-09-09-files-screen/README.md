# Guest Files screen over the bounded reader

**Status:** implemented and independently reviewed local guest-read checkpoint;
not public C0 or v1 parity. See [verification and measured results](verification.md).
The separate [same-data delivery comparison](delivery-verification.md) measures
optional compression; it does not resolve the read-lifecycle/churn limit.

Implements the read-only part of the [consumer build card](../2026-09-09-v1-parity-overnight/consumer-build-card.md)
using the published [shared reader](../2026-09-09-files-reader/verification.md)
at `2c1261d`. No second authoritative tree, production repo, dependency change,
wallet, write router, content preview or hosted deployment.

## Bounded plan

1. Test a loopback-only static server with a bounded, same-origin read relay.
   Keep fixture publication and the full-state oracle outside the browser and
   timed read path. Never serve the oracle as the folder.
2. Implement the existing three-Lens guest design directly in a small SPA:
   real pages, pinned prepublished observations, explanations, partial/error
   states, immediate cancellation on context change, accessible Load more.
   Existing browser modules and their validation checks remain unchanged.
3. Run real Chromium against the live upgradeable read fixture, compare every
   selected outcome to the independent oracle, inject missing evidence and
   delayed responses, check narrow screens and keyboard focus. Measure cold
   navigation through DOM-visible rows plus continuation at 0/50 ms per RPC.
4. Independently review, retain measured evidence and screenshots, and publish
   only the reviewed checkpoint to the existing experiment branch.

Visual direction: an ordinary, calm working file list. Names lead; Lens and
observation are visible controls. Exact IDs and raw evidence are inspectable,
not compulsory reading. Unresolved positions never borrow a losing title.

The site-owning main agent implements this local-only screen. Reviews are
read-only. This is a new bounded experiment, not a continuation of the completed
reader SDD workspace. No visible browser handoff during the overnight run.

## Acceptance and exclusions

- Zero wallet access and zero submitted browser writes.
- A first / B first / Both agree match the same deployed Core plus independent
  full reconstruction. Historical U1 and current U2 are separately pinned.
- First page is PARTIAL; only terminal traversal is COMPLETE. Completeness of
  enumeration is not validity or availability of every row.
- A bad selected claim remains unresolved; unrelated valid rows survive.
- Lens/snapshot changes immediately clear old rows and explanations. Late
  completion cannot repopulate them. Failed continuation preserves only
  explicitly labeled prior sealed evidence.
- Why remains reachable at 320/390 px; Escape restores its opener; keyboard
  Load more deliberately transfers focus to the first newly displayed row.
- Timings include browser/module/config costs. Synthetic request delay is not
  a WAN percentile, finality latency or production SLA. No matched v1 ratio.

Prepublished layouts are real fixture admissions, not executable screen edits
or proof of atomic FilesRouter rename/remove. Remove and retract are explained
as predictions only. No FileRevision/head/bytes, tags, nested navigation,
production identity, real-wallet prompts or routed write parity is claimed.
