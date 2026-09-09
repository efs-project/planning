# Bounded Files reader over the populated prototype

**Status:** selected disposable implementation slice, not yet verified.
**Authority:** James's overnight prototype/parity/performance direction;
existing experiment branch only. Source baseline `31a4fbd`.

## Outcome

Produce a real, bounded root-folder listing over the published upgrade read
profile. Use one browser-portable read implementation for the later SPA and
Node consumer. A small result distinguishes usable entries, masks, absent
agreement, conflict, unavailable evidence and malformed selected claims.
This is the first two joins in the existing
[consumer card](../2026-09-09-v1-parity-overnight/consumer-build-card.md), up to
the shared reader; a UI, write router and full Files byte/head traversal are
not claimed by this increment.

## Selected approach and alternatives

1. **Selected:** a scoped RPC reader plus a narrow exact-Type Files adapter.
   Both are browser-portable; tests compare actual bounded contract reads
   against the unchanged full retained-state oracle. Existing Core code,
   writer, read façades, runner and historical reports stay unchanged.
2. Feeding the screen a whole reconstructed snapshot is useful as an offline
   control, but cannot measure or implement normal folder opening.
3. A new onchain Files aggregation contract can follow measured results. It
   is not necessary to discover whether the existing bounded read API can
   yield correct usable rows. The selected arm does not claim that offchain
   Files checks are an onchain profile certificate.

This advances the existing reader design, not a competing production SDK.
It retains the five-seam [SDK contract](../../Designs/sdkv2/mvp-interface.md)
and the [directory dataflow](../2026-09-09-v1-parity-overnight/directory-read-next.md).
It exposes no signer, submitter or mutation method. Actual contract Lens
selection remains authoritative for this experiment; the separate oracle is
test evidence, never the per-row hot path or a substitute browser tree.

## Read scope

A scope captures one source identity, connection epoch, immutable accepted
manifest, chain, canonical block hash/header, active execution identity and
admission high-water. The accepted manifest is supplied by the existing
source-checked managed runner, not inferred from RPC observations. This is
local trusted configuration, not proof of a production discovery mechanism.

Before any application data call, verify every declared fixed component's
exact runtime, complete bounded Core/carrier execution history, expected
historical implementations/codehashes, current proxy implementation/admin
slots, source-expected immutable admin bindings, admin owners, configurations,
the bootstrap commitments and the guarded `fixtureReadContext`. Retain all
raw requests/results/errors. Never accept the proxy shell hash alone. Use
the original 21-word execution-set commitment and fixed original tuple/domain.

All data/code/storage calls use `{blockHash, requireCanonical:true}`. Every
ABI reply must round-trip exactly through the declared codec. Opening and
final sealing check header canonicality, chain/source epoch and the same
guarded execution context. An upgrade after this pinned block does not
invalidate honest historical reads; a new latest scope observes the upgrade.
Never silently substitute latest when old state is unavailable. No arbitrary
mid-publication H or permanent FilesView byte format is introduced.

Every `open` creates an independent scope/cancellation lifetime; qualification
within that scope runs once. Share exact same-scope in-flight call results. Do not cache
failed calls or let failed single-flight poison a new attempt. Ordered work
has an explicit in-flight bound. Abort/epoch/request-function replacement
stops scheduling; late results cannot become current scope evidence or a
successful sealed result. Budget/failure outcomes retain obtained evidence.

Experimental scope limits: at most 512 requests, 4 MiB serialized JSON-result
bytes in total, 262,144 bytes per response, 4 in flight and 30 seconds per
scope. These are named test defaults, not public protocol limits or production
SLAs. The read transport must enforce response limits while acquiring bytes;
the adapter also checks returned result sizes. Count failures and opening/
sealing costs, not just successful data calls. No automatic HTTP retry.
Manifest inventories are capped at 32 fixed components and 32 recognized
implementations, with execution history capped at 16 revisions. These finite
fixture-reader caps reject larger deployments as unsupported, not invalid.

## Files interpretation boundary

Use the existing exact candidate Type IDs/field layouts, independently
recomputed in tests from the retained candidate artifact. The runtime adapter
contains only the fixed ObjectGenesis, BindingSet/Tombstone, DirectoryEntry,
DirectoryWhiteout, MountDescriptor, PublicFilesMountConfig and ResolutionPlan
decoders it needs. It is not a generic schema engine. Strict UTF-8, field
lengths/options/reference shapes and full body consumption are checked; exact
Record IDs are recomputed before typed interpretation. The independent
descriptor-tree decoder remains unchanged as the comparison implementation.

Supported names are exactly the existing ASCII contract arm: 1–255 bytes in
`[a-z0-9._-]`, excluding `.` and `..`. Definite Files violations (empty,
dot/dot-dot, slash, backslash, ASCII control bytes) are malformed. Other names,
including `Trip` and non-ASCII, are explicitly unsupported by this arm—not
silently lowercased, normalized, or falsely certified invalid/rich-Unicode.

Use the source-defined File/Directory meanings, charter/name-slot purposes,
name roles and `DOM_PLAN_PURPOSE`. Two not-yet-pinned permanent values remain
**explicit fixture constants only**:

```text
public profile = keccak256("efs.fixture.files-public-ascii-read/1")
plan-scope domain = keccak256("efs.fixture.files-plan-scope/1")
scope = H(plan-scope domain, public profile, mount root)
purposeAndScope = H(DOM_PLAN_PURPOSE, Files namespace/content purpose, scope)
```

This does not adopt `DOM_FILES_PLAN_SCOPE`, a public mount-profile ID, a
FilesView codec, or the complete permanent Files/1 profile.

The root Mount must reference a historically chartered Directory and exact
public config. Both namespace/content Plans must be canonical, supported and
carry the corresponding exact purpose/root scope. Metadata/property must be
both absent; mismatched presence is malformed, a present paired profile is
unsupported. Unknown mounts/configs never become public by default. A child
Mount override must repeat the child, use this same public profile and pass
its own root-specific Plan checks before being reported as usable.

A node is historically valid only after its publisher-qualified charter first
reached BOUND to the exact Object Record, RECORD kind and leaf zero. Check at
most 64 history revisions per node. A later tombstone, withdrawal or wrong
target changes maintenance, not historical existence. A first tombstone is
insufficient. Missing/exhausted historical evidence is UNKNOWN, not absence
or permission to accept the current caller's assertion. Cache the resulting
node check only in this exact scope. Report maintenance separately.

Known-name lookup derives one position and calls the real Lens. Validate the
selected target kind/leaf, exact Entry/Whiteout Type, parent, name-role, name
profile, child meaning/charter and optional Mount. A selected invalid target
blocks; do not try the losing author. Conflict selects no child/presentation.
MASKED and absent agreement are scoped absences, not deleted bytes or global
nonexistence. No FileRevision/byte availability is inferred from a valid node.

## Directory stream and UX contract

List only the selected Mount's root directory in this increment. Traverse
bounded BindingScope pages for every unique namespace-Plan Principal, union
exact roles, and resolve current positions. Hydrated anchors are inspected
against exact Binding bodies and Principal/purpose/subject; they are not
current entries. Same-name churn adds no role. Distinct dead roles may yield
empty partial windows; keep progress and continuation truthful.

Each Load-more step consumes at most 8 anchors per Principal (up to 64 named
Principals), while the shared scope request/byte/time bounds still apply.
Retain per-Principal cursor chains and cumulative rows. Require exact basis,
raw/hydrated alignment, strictly increasing ordinals, progress, counts and
terminal cursor rules. Missing/bad anchors leave discovery unresolved. A
malformed selected row does not erase unrelated usable rows or turn a fully
enumerated scope into an all-rows-valid claim.

An opaque continuation is owned by this stream; it cannot be replayed into a
different Mount, Plan, scope or page policy. Concurrent Load-more calls share
one attempt. State is committed to the stream only after its aggregate seals.
The snapshot keeps enumeration coverage distinct from row validation and
metadata/bytes-not-read. Partial sorting is local, never globally first-page
order. For conflict/unresolved positions without a known name preimage, use
the role identity, not a losing claimant's title, icon or action target.

All result families preserve four point outcomes where applicable and
separate coverage/support/validation/integrity/authority/finality/availability.
Authority is `SYNTHETIC_OPERATOR_ONLY`; finality is provisional, not proven.
Effect is `NOT_APPLICABLE`. Raw evidence is retained even when typed projection
fails. This is an explicit fixture read adapter, not an authenticated C0 SDK.

## Required live controls and measurements

Create actual candidate groups, a trip Directory, two distinct chartered File
Objects, three namespace Mounts (A-first/B-first/EXACT), content Plans and
real name Bindings. Compare lookup and cumulative listing with independent
retained state at each checkpoint: only A; A/B conflict; A rename + old-name
mask; A retraction reveals B; second placement; malformed selected entry;
historical charter after withdrawal/rebind; first tombstone; empty directory;
partial/churned enumeration. Retain old and new pinned reads across U2.

Measure full cold-open, first load, continuation and repeated-same-scope costs:
RPC methods/counts, serialized result bytes, maximum in flight and elapsed
time under 0/50 ms injected request delay. Keep fixture setup/full independent
reconstruction separate. Normal runtime/gas controls come from unchanged
Core artifacts; these are reader timings, not new v1/v2 fee ratios. UI time,
real wallet behavior and a deployed Solidity Files-profile validator remain
unimplemented, explicitly named next joins.
