# Consumer review and the next bounded experiments

**Status:** experiment plan, not adopted SDK/Core API or a directory guarantee.
SDK PM and Data Explorer PM reviewed the published `b623b42` checkpoint
read-only on September 9. Neither changed files or selected permanent bytes.
Their advice agrees with the measured blocker: truthful partial results are
necessary, but not enough to make a useful browser.

## September 9 owner correction — governs the next work

The [correctness-first owner ruling](../../Designs/efsv2/owner-rulings.md#correctness-before-extreme-efficiency-in-the-mvp-prototype)
supersedes the fixed-budget sequencing in the retained PM advice below. The
512-request, byte, concurrency, timeout and collector settings are adjustable
experiment choices. Existing ethers reuse is not a library selection or a
bundle-size requirement.

Before implementing acquisition segments, compare a sensibly configured
single-scope candidate and simpler acquisition/page choices against the retained
64/60 control. Record each candidate's settings, oracle agreement, failure and
cancellation behavior, total work and time to useful Files. Prefer the simplest
correct option; do not add a segment framework just to avoid raising a cap.
A higher cap may resolve a refusal without improving latency or scaling, so
report those outcomes separately. Independent reference-collector budgets may
also increase; the earlier 96/128 refusals remain historical, not retroactive
passes.

If library limitations complicate correctness or the SDK API, evaluate a
replacement on validation/encoding behavior, error handling, TypeScript and
browser fit, maintenance and interoperability. Accept a larger bundle when it
buys better engineering. No replacement is chosen by this note. Preserve
resource accounting and truthful failure/coverage behavior with any settings.

The earlier segment plan below remains a conditional experiment if it offers
a real lifecycle or UX benefit after that comparison. Its exact two-segment and
512-request settings are controls for that arm only, not product constraints.
No new owner answer or overnight restart is implied by this handoff correction.

## 1. Separate an observation from one acquisition lifetime

The [source-grounded implementation plan](acquisition-segments-plan.md) checks
this recommendation against the actual compact Basis, boolean continuation,
private cursor state and scope factory. It is the next executable increment;
none of that future behavior is claimed implemented here.
SDK's follow-on review narrows the first arm to one closure-owned replacement
scope, initially Node-only. Request-function identity is a private capability
guard, not portable semantic bytes. Only the last sealed evidence frontier
can seed the replacement; failed/unsealed tail attempts remain separate cost
evidence. The longer-term advice below does not require a generic chain system
or a new UI/API in that first increment.

SDK recommendation: keep one logical directory observation while allowing
several independently bounded acquisition segments behind the existing scoped
reader/opaque continuation seam. Do not reset counters inside one scope or
raise its limits. Requalify the same block hash before a new segment; never
silently resume against latest.

The observation comparison must include source identity/request function/epoch,
chain/Core, block hash/number/state root and canonicality/finality policy,
execution set/revision/deployment/profile/ABI, Realm/RealmRevision/admission
high-water, root/Mount, exact Lens/Plans/Principal order, scope/query key,
result semantics and ordering. Compare against actual current scope fields
before implementing; this list does not invent public encoding.

Each sealed segment retains the prior commitment, per-source start/end cursors,
raw attempts, all scanned positions (including dead names), interpreted results
and exact context. Cumulative coverage is an append-only, contiguous chain of
sealed segments. A terminal suffix without every matching predecessor cannot
be COMPLETE. Caller cursors alone never prove coverage. Abort, refusal or
transport failure retains only the last sealed prefix; late unsealed work is
inert. Bound total segments/evidence separately and expose a real Continue
choice when automatic work ends. If the pinned observation is pruned,
noncanonical or changes identity, keep the prefix PARTIAL and explain why
continuation is unavailable.

Small acceptance: keep the measured 64-name/60-retraction page-4 control.
The new arm must resume its 60-position sealed prefix in a new bounded scope,
return the final four FOUND placements and match the full independent oracle.
Only the intact two-segment chain may reach COMPLETE. Page 8 stays a separate
operational control, not a general solution.

Hostile tests: mutate each observation dimension; missing/reordered/duplicated
predecessor; changed start cursor; forged prefix; suffix-only or zero-progress
continuation; reorg/pruned pin; upgrade after the pin; abort/failure before seal;
late replies. Do not change public cursor bytes or claim general guarantees.

## 2. Reduce round trips without hiding EVM work

Keep the current small-getter graph as the correctness control. SDK proposes
one optional stateless, codehash-pinned read helper using only existing Core
view ABIs. Bound roles/subcalls, gas, calldata and returndata. It returns
ordered per-call success/raw bytes, never a semantic valid/complete verdict.
The same SDK checker validates all joins and coverage; the getter path remains
a removable fallback. Record fallback as a new attempt, not a rewritten success.

Measure outer RPCs, inner EVM calls/gas and returned bytes separately. One
outer request containing many calls must not bypass the work budget. Test
wrong/no code or dependencies, wrong target, duplicated/reordered/truncated
results, subcall revert, returndata bomb and gas exhaustion. Compare exact
positions/results/prefixes and time to first useful file on the same 64/60
observation before proposing any Store/current-name index change.

## 3. Make useful Files the primary UI, with honest scan progress

Data Explorer recommendation: qualified FOUND placements form the primary
Files list and are the only candidates for later open/preview/actions.
CONFLICT/UNKNOWN belong in a visible Needs attention section with neutral
labels. ABSENT/MASKED belong in an inspectable history/diagnostic disclosure,
not phantom current file rows. Every returned position remains accounted for.

Acceptance includes 4 FOUND + 60 ABSENT + 1 MASKED + 1 CONFLICT + 1 UNKNOWN:
four file rows, two attention rows, 61 historical/hidden positions; phone and
keyboard can inspect every retained result. Do not borrow a losing name/icon.
Continuation focus goes to the first new file, not a diagnostic row. Keep
selection/scroll and the pinned basis while scanning; context changes still
invalidate the old results immediately.

Separate found files, checked positions, issues and coverage. No guessed total.
PARTIAL with zero FOUND means **No current files found yet; scan incomplete**.
COMPLETE with no FOUND and no unresolved means **No current files**.
COMPLETE with unresolved means **No usable files found; placements need
attention**. Refusal says scan stopped/unavailable with prior sealed results,
not empty or COMPLETE. A fresh/latest read is an explicit context change.

Later yield-oriented acquisition may traverse several zero-yield pages per
user action until a useful file, terminal coverage, budget or error. It needs
its own bounded-work/lifecycle test; UI copy alone does not fix the measured
7.7-second time to four useful placements. Compare that result against the
existing small-folder measurement before calling the browser interactive.
No production SLA or owner-approved latency threshold is invented here.

## Separate remaining reference ceiling and authority

The 96/128 arms remain oracle-limit refusals, not reader measurements. A
separate bounded reference-collection experiment must make them independently
verifiable before any performance conclusion. Keep the collector and reader
budgets distinct.

The three reversible experiments above need no new owner decision. A permanent
folder/churn/latency guarantee, mandatory helper, Store/write-cost change,
history pruning, new Core query ABI or public continuation encoding does.
Do not ask James to choose those before the cheaper controlled experiments.

Source tasks for follow-up: SDK PM `01a02a24-01b3-7f12-9f2e-887aea66e9e8`;
Data Explorer PM `01a02a24-0348-7c50-81fd-2a4ac43c62af`. Owning seams remain
the [SDK MVP interface](../../Designs/sdkv2/mvp-interface.md),
[Core read overlay](../2026-09-05-c0-core/read-overlay.md) and
[reader experiment plan](../2026-09-09-files-reader/files-reader-plan.md).
Measured input: [initial scale](README.md), [churn](churn-findings.md), and
[guest screen](../2026-09-09-files-screen/verification.md).
