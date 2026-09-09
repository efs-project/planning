# Upgrade-aware read façade for the populated fixture

**Status:** selected disposable integration design under the September9
overnight authority. Not a permanent Core ABI, execution format or deployment.
Source baseline: reviewed/published `72b59b0`.

## Outcome and scope

Use the same proxy Store for bounded Point/Binding/audit/Lens reads before and
after populated upgrades. The returned read basis names the **observed active
execution**, not the revision under which every returned fact was accepted.
Keep the old revision-one hosts and original upgrade fixture as controls.

This closes a prerequisite of the [one-screen consumer](consumer-checkpoint.md),
not Files profile certification, authenticated author policy, the static SPA or
all public read families. In particular, do not expose the old `getReceipt`
projection on the new façade: its accepting-batch validator only supports
revision1. Raw retained batches and the unchanged independent upgrade reader
continue to verify historical acceptance. A qualified onchain receipt getter
is a separately bounded followup, not a reason to return a false revision now.

## Alternatives and selected boundary

1. **Selected:** a derived upgradeable Core with fixed PointReadLibrary and an
   upgrade-specific Query read library. Both act on the existing namespaced
   Store through compiler-generated storage-reference calls. Reuse internal
   checked query/Lens algorithms; only audit cursor context needs a shared
   explicit read-basis parameter. No writer or storage-layout change.
2. A separate reader contract using raw public getters would require another
   retrieval/validation implementation and external-call cost. It can remain
   a consumer but is not the selected same-Store read façade.
3. Extending the retained21-word execution tuple or introducing a registry is
   unnecessary here: the source-verified Core implementation already commits
   compiler-linked library addresses and expected code hashes in its runtime.

The new fixture has **two fixed read libraries**, not the old Query library
plus an extra third resolver. The upgrade-specific library is link-free and
compiles the existing internal algorithms. It is trusted DELEGATECALL code,
not a sandboxed extension. No mutable dispatch, arbitrary storage pointer or
caller-selected dependency is introduced.

## Dependency commitment and guards

The new Core constructor takes the existing factory/helper plus independently
expected Point/Query runtime hashes. Addresses come from compiler links;
require nonempty exact code and retain addresses/hashes as immutables.
The complete installed Core runtime therefore commits both addresses/hashes.
The existing execution record commits that Core implementation codehash.
Retain the existing execution-set/1 tuple/domain **unchanged**, and verify the
complete source → compiler → link/immutable → Core runtime → execution chain.
Merely reading hashes back from constructors/provider code is insufficient.

Every new state-reading façade method first checks both read dependencies,
then `_execution(currentRevision())`, including the existing proxy/admin/
controller/helper/admission/peer checks, before reading the Store. This stricter
fixture-wide gate is deliberate. Pure `deriveBindingKey` remains dependency-free.
Base raw diagnostic ports and base writes retain their existing behavior; they
are not silently advertised as the new qualified façade.

Add temporary `fixtureReadContext()` returning
`(bytes32 executionSetId,uint32 revision,uint64 blockNumber,uint64 admissionHigh)`.
Guard block narrowing. Existing query tuple positions named `realmBasis` or
`realmRevisionId` carry this current executionSetId **in this fixture profile**.
That is observedWith, not a permanent RealmRevision choice. An RPC consumer
must also pin the exact canonical block hash; H alone is not a complete basis.

## Shared algorithms, different observation context

Point reads that return immutable bodies or occurrence lifecycle use the fixed
Point library unchanged, behind the new guard. Binding head/at-H, history,
counts and Lens resolution reuse their checked internal implementations.
For results containing a basis, the upgrade Query wrapper supplies the checked
current executionSetId; no return path leaks the initial revision as current.
The existing internal Lens walk can retain its same-Store initial-basis
consistency checks and then project the supplied current observation basis.
It still observes current heads, not an arbitrary historical H.

Audit pages must use the explicit current executionSetId **before both cursor
encoding and decoding**, not merely replace a return field afterward. Add
explicit-basis internal entry points to StateAuditPages, preserving the old
entry points' initial-revision behavior, request ordering, unsupported results,
caps and inspected-state checks. Reject a zero supplied basis; do not interpret
it as an implicit fallback. No other shared runtime source needs to change.

An old-H page queried under U2 reports U2 observedWith and the selected H; its
lifecycle is still projected as of H. A U1 cursor cannot resume under U2,
including when activationAdmissionHigh is unchanged. Restart the query under
the new context or continue against the old canonical block. A second
activation with no admissions has a distinct executionSetId and also rejects
the previous cursor. Original acceptance remains in retained batch/history
evidence, which is never rewritten into the observing revision.

## Test and consumer boundary

The managed runner gets one closed optional profile (`base` default, `reads`).
Unknown profiles fail before deployment. Preserve the base deployment order,
API behavior and saved controls. Derive exact source-target link inventories
and same-build immutable names for the selected profile; no generic graph.
The retained-state collector keeps the old unambiguous raw ABI (`counts()`),
while callers use a separate full read ABI for query `counts(...)` and new ports.
Pin/read both libraries as expected components during independent collection.

Reuse the independent Plan parser/declarative combination as a **pure model**,
not an evidence verifier. A new upgrade oracle first calls unchanged
`verifyUpgradeState` itself; it must reject supplied VERIFIED labels/folds and
missing or substituted execution evidence, then model the current basis from
the verified active execution. Do not edit old snapshot bootstrap/batches to
trick the revision-one verifier into accepting U2.

Required executable checks: actual Type/Plan/Binding/file admissions; current
and historical pages; full result/ABI agreement; U1/U2/no-new-data U3 context;
old-block continuation versus current-context rejection; original accepted
batch evidence; malformed/current dependency refusals; no Store writes;
normal full deployment and call costs. Measure1/8/32/64-source agreement and
small raw/hydrated pages before/after upgrade, separate from setup and full
directory interpretation. Keep the old24-row Lens report unchanged.

All current caps remain: runtime24,576 bytes, full initcode49,152 bytes,
transaction16,777,216 gas; independent collection/history limits unchanged.
Normal failure retains evidence and triggers a bounded engineering refinement,
not a raised cap, weakened check or silent new deployment dependency.
