# Next executable increment: one observation, bounded acquisition segments

**Status:** source-grounded disposable implementation plan, not implemented or
a public continuation format. Implements the first
[SDK advisory](next-experiments.md) before the separate helper/oracle experiments.
No Core, writer, Store, permanent identity, public SDK or RPC limit increase.

## Why this is the next step

The verified 64-name/60-retraction page-four control seals 60 positions before
the 512-request lifetime refuses more work. Four usable placements remain.
The same-position point control proves the final name still resolves. Continue
the exact observation through another bounded acquisition; do not restart
from zero, concatenate unrelated reads or treat an arbitrary cursor as proof.

## What current source actually supplies

- [`createFixtureReader`](../2026-09-09-files-reader/reader-scope.mjs) captures
  the normalized expected manifest and limits. Each `open` constructs a new
  scope, captures source identity/epoch/request function, qualifies runtime,
  history, source and bootstrap, and pins all contract calls by canonical hash.
- Its exposed `Basis` contains source, epoch, chain/Core, block hash/number/state
  root, execution set/revision and admission high-water. It does **not** by
  itself contain the whole manifest/Realm/profile/ABI/request-function contract.
  Comparing two serialized Basis objects alone is not sufficient to resume.
- `open` currently accepts latest or a canonical numeric block tag, not an
  arbitrary hash request. A resume must reopen the old numeric height and
  reject a different hash/state root **before** trusting or joining new results.
  Do not accidentally pass `latest` or assume a hash parameter already exists.
- [`openDirectory`](../2026-09-09-files-reader/files-reader.mjs) holds its real
  continuation internally: per-Principal cursor/scanned/last/end/tag/roles,
  selected position map and last sealed snapshot. The public `continuation`
  field is only a boolean. A scope has no public re-open method. A caller cannot
  reconstruct the internal proof from `progress` or the boolean.
- `step` copies working source state and commits it only after an aggregate
  seal. A failed page returns a separately retained latest failed observation
  and `priorSealed`; unsealed cursor progress never replaces the committed one.
  `scope.close()` or budget refusal does not make a replacement scope verified.
- Record/node/mount memoization is scope-local. Do not share those caches across
  new scopes in the first arm: requalification and rechecking the mount/root
  are deliberate costs. Cross-segment evidence reuse is a later optimization.

## Recommended experiment boundary

Keep the current implementation as a runnable control. For the candidate, use
one **closure-owned, single-use reopen factory** inside one directory controller
to obtain a fresh scope from the same captured reader context. Prove this
Node-only initially; do not build a general lifecycle registry/chain framework,
expose raw source/signer capabilities or add a second consumer-facing API.
Private fixture wiring can change without freezing SDK bytes.

Bind the full normalized context and complete logical observation to that
controller. Freeze/compare the original source object/request function reference
as a **private acquisition-capability guard** alongside source identity/epoch.
JavaScript function identity is not semantic observation bytes, portable Basis
or a hashable protocol commitment. The old context is authoritative for the
comparison; a new RPC response cannot rewrite it.

Before any resumed page call, reopen the old numeric height, compare original
hash/state root/full Basis and normalized qualification context, then re-read
and compare the Files-layer Mount/root/Lens/Plans/Principal order/query/page
configuration. `reader.open` alone does not qualify those Files-layer facts.
Treat a later host upgrade as separate from availability of the old observation.

Use a bounded, fixture-only segment policy: initially at most **two segments**,
each retaining the unchanged 512 requests/4 MiB/result/in-flight/active-time
limits. Also bound cumulative retained evidence and segment overhead explicitly.
This only establishes the measured 64/60 case, not unlimited directory size.
Never reset counters or reinterpret many inner operations as one unit of work.

Also bound the logical controller's aggregate outstanding transports, including
old attempts whose source ignores AbortSignal. The current managed runner can
do that; rejection of the SDK promise does not prove the underlying request
has drained. Do not start a fresh segment's four transports on top of four
still-running predecessors and call the whole observation four-in-flight.
Use bounded drain/accounting before new acquisition or refuse continuation;
do not wait forever or erase the old attempt from evidence.

## Acceptance-first work packages

1. **Private re-open capability and exact-context refusal.** Add tests before
   wiring. Original scope remains valid on its own; an unrelated controller or
   source capability cannot reopen. Changing source object, request function, epoch,
   expected manifest, hash/state root, execution set, Realm/profile or policy
   refuses before results are merged. Test reorg at the old numeric height.
   Keep the existing `index.mjs`/`index.d.mts` control accurate; no hidden public
   declaration or production export change.
2. **One sealed predecessor and one replacement.** Retain the exact predecessor,
   per-source start/end state, context, positions, outcomes and sealed evidence
   slice. The current failure's `evidence: seal.evidence` includes later failed/
   unsealed attempts; only committed `sources`/`positions` and `priorSealed.evidence`
   may seed the replacement. Assert the sealed evidence length/digest/frontier
   explicitly. Retain the post-frontier tail for failure and total-cost evidence,
   never as covered prefix; inject a forged tail-as-prefix hostile case.
   If hashing is useful for the test, encode fixture-only canonical bytes—not
   a JSON/stringified function or object graph—and adopt no public cursor/ID
   format. Join only the verified predecessor and matching end/start state.
   Terminal suffix alone, missing/duplicated/reordered predecessor,
   forged prefix, changed Principal order/Plan/root/scope or zero progress must
   not become COMPLETE. Preserve duplicate-role and cursor-tag checks already
   performed by `checkedPage`.
3. **Live 64/60 candidate and its controls.** Reuse the exact two-author/two-File
   setup and independent full oracle from `churn.test.mjs`. Keep page four as
   the failing one-scope control and page eight as the completing control.
   Candidate resumes the last sealed 60-position prefix, finds the final four
   usable placements and matches all 60 ABSENT + four FOUND results. Its final
   COMPLETE claim requires the whole matching chain, not just the last page.
   Measure qualification, first useful File, page/segment latency, requests,
   accepted bytes, retained proof bytes and cumulative work at 0/50ms. Preserve
   failed attempts; include failed-segment work in the total cost.
4. **Node-only failure/recovery.** Exhaust second-segment
   or retained-proof budget; prune/reorg the old block; abort before/after seal;
   inject delayed old replies, an ignored-abort source and transport failure
   during requalification. Assert the whole observation's in-flight bound,
   not only the independently valid per-scope counters.
   Retain the prior prefix without claiming completion or silently switching
   basis. Rotate once internally in the Node candidate controller, preserving
   failed-tail evidence separately. The original failed observation is not
   rewritten QUALIFIED. Do not add a UI Continue join in this increment: keep
   the existing UNAVAILABLE rendering/regressions unchanged until the lifecycle
   law works. A later consumer affordance will treat Read latest separately.
5. **Independent review and handoff.** Replay every segment against the
   independent oracle and hostile fixtures, then rerun reader and current
   guest-screen regressions unchanged. Record outcome/limits and wrong-choice cost.
   Publish only reviewed experiment evidence. Stop this increment before
   adding the batch helper, larger collector or Files writes.

## What success would and would not settle

Success would show that a finite per-acquisition budget need not impose the
same lifetime bound on a logically continuous pinned directory read. It would
also supply a safe state model for cancellation and explicit Continue.
It might still be **slow**: requalification adds reads, and all old names still
need scanning. The separately planned bounded helper comparison addresses
round trips; a current-name index would carry a distinct write/Store decision.

No new answer from James is needed to run this reversible increment. Ask for
owner/Core direction only if a permanent guarantee, mandatory helper, changed
Store/history semantics or public format becomes necessary. Do not use the
unverified 96/128 arms as supporting performance evidence.

## SDK review disposition

SDK PM reviewed this plan against runtime `84ef041` on September 9: approval
with corrections. This version applies the sealed-frontier/failed-tail split,
private callback-reference guard, Files-layer requalification, closure-owned
single replacement and Node-only scope trim. The aggregate ignored-abort
transport bound is also explicit. No implementation or public API was adopted.
