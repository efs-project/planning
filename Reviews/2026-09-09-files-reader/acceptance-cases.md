# What this Files reader must let us demonstrate

**Status:** expected checks for the selected disposable reader; results have
not yet been earned. [Implementation scope](README.md).

## One name, three views

`A first` and `B first` use separate ordered priority tiers. `Both agree` is
the existing EXACT combiner over A and B. A mask is a selected Whiteout Record,
not a missing Binding. A retraction removes that author's current selection;
neither operation erases the original bytes.

| Current name claims | A first | B first | Both agree |
|---|---|---|---|
| Only A names File A | File A | File A | No agreed entry |
| A names File A; B names File B | File A | File B | Conflict, no selected file |
| A masks; B names File B | Masked | File B | Conflict, no selected file |
| A retracts; B names File B | File B | File B | No agreed entry |
| Both name the exact same Entry Record | That file | That file | That file |
| A names malformed Entry; B names valid Entry | Unresolved selected claim | B's file | Conflict, no selected file |

Agreement compares the exact selected target tuple. Two separately encoded
Entries that merely resemble each other do not earn exact agreement. A failed
transport is never a retraction or absence. A malformed lower-priority value
does not defeat an independently proven higher-priority selection.

Name lookup and discovery must produce the same point outcome for a discovered
role. Discovery with no trusted name preimage labels a conflict by its role
identity; it must not borrow either claimant's name, thumbnail or action target.

## Identity and listing checks

- Renaming a placement changes its Entry and name slot, not its File Object.
  The old name's mask cannot be rendered from its earlier Scope anchor.
- A second placement has another role but the same File Object. Removing one
  placement does not remove the other.
- A withdrawn or rebound publisher charter can change maintenance while an
  exact historical charter still establishes the node. A first tombstone alone
  does not establish it; a later proper charter can.
- Empty PARTIAL windows are possible after distinct-name churn. Display progress
  and continuation, not “This folder is empty.” Repeated changes at one name
  should keep one discovery anchor.
- A bad selected row leaves other usable rows intact. Complete enumeration and
  valid rows are independent claims. Later failure preserves prior evidence but
  must not present it as a newly sealed successful observation.
- Old pinned state must remain readable across a later upgrade. A fresh latest
  scope must qualify the new execution; no mixing old cursors with new context.

## What the timing report must make visible

Every sample records the exact fixture source/IDs, names, number of authors,
distinct child nodes and charter states, Plan, page size, requested block and
obtained basis. Eight placements sharing two nodes are not equivalent to eight
independent files. Disclose which workload was used.

Separate cold qualification, first usable sealed page, each continuation, and
same-scope reuse. Report every sample, actual requests by method and phase,
JSON-result bytes, cache hits, maximum in-flight requests and elapsed time.
Opening and final sealing are paid costs, not hidden setup. Fixture deployment,
publications and independent full-snapshot oracle acquisition are outside the
read timer, explicitly identified rather than included selectively.

A read-only count of the existing upgrade-read evidence gives a useful cold
qualification control: 13 distinct fixed component addresses, 144,575 runtime
bytes total, or 289,202 bytes when each hex code result is JSON-serialized.
This is an exact count of retained code, **not a measured new reader request
trace**. The largest component is24,533 runtime bytes; four implementation
entries reuse addresses already in that inventory. Source report keccak:
`1ccbc44145377e54c074f081a22e2aa3c8e551634444f15f179df889009f5683`.
Do not fetch the same address again just because it appears in both inventories.
If cold qualification dominates the actual measurement, first distinguish
necessary current dependency checks from full fixture-inventory checking;
that would be a separate, explicitly reviewed optimization, not permission to
silently remove checks from this selected arm.

Use the same live workload for the 0 and 50 ms request-delay arms. These are
diagnostic local samples, not WAN percentiles, browser paint times or a fee
comparison. The older browser control uses eleven files and different read
semantics; it is a warning/control, not a matched causal v1/v2 comparison.

The boundary still excludes FileRevision/byte retrieval, executable Files
actions, real wallets, tag filters, redirects, collections and a usable SPA.
This increment earns the bounded shared reader prerequisite, not complete v1
parity. The [full inventory](../2026-09-09-files-parity-performance/parity.md)
keeps the remaining capabilities visible.
