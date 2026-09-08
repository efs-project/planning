# The next joined consumer checkpoint

**Status:** concrete next slice, not implemented by the upgrade foundation.
Reviewed against the existing Files/Lens semantics with the SDK and Data
Explorer PMs on September 8. No public ABI or new product repository is chosen.

## One screen, one Store

Use the same admitted Types/Records, Principal-qualified Bindings and posting
inventory as the upgrade host. Do not maintain an authoritative browser-side
file tree. A single static compare screen consumes the shared resolver result:
**A first**, **B first**, **Both agree (EXACT)**. A “Why this result?” drawer
shows the selected claim, consulted sources, basis and coverage; exact IDs and
raw evidence are collapsed, not hidden. Always identify the synthetic-operator
fixture. It is not proof that A or B signed.

Let A and B point `note.txt` to different, properly chartered File Objects.
Create the root `trip/` with an actual Directory meaning and publisher charter.
The following table is the independent expected oracle, derived from
[B0 Lens §6](../2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md) and
[Files lookup](../../Designs/efsv2/hierarchical-files-and-folders.md).
It is not a second implementation of resolution.

| Retained claims at one basis | A first | B first | Both agree (EXACT) |
| --- | --- | --- | --- |
| Only A names `note.txt` | File A | File A | Absent agreement: B has no claim |
| Both name it, differently | File A | File B | Conflict; no file selected |
| A renames to `field-notes.txt`, placing a Whiteout at `note.txt` | Old name masked; new name File A | Old name File B; new name File A | Old name conflict; new name absent agreement |
| A retracts the old-name claim with a Binding tombstone | Old name File B | Old name File B | Absent agreement: A has no claim |
| A's consulted winning claim/evidence becomes unknown | Unknown, no fallback | File B if B's winning tier is fully proven | Unknown when required evidence is unavailable |

“Absent agreement” is explanatory UI copy for the exact `ABSENT` result at
this plan and basis, not a new protocol enum or proof the file exists nowhere.
Conflict rows select no claimant-derived title, preview, icon or action target.
The known queried name may label the unresolved position.

## Operations to join

1. Page both authors' directory scopes at a pinned basis, hydrate anchor
   roles and read their current heads. An immutable anchor is not the current
   value. Prove terminal coverage before calling the listing complete.
2. Rename in one routed operation: destination Entry/Binding plus source
   Whiteout/Binding, with source and destination preconditions checked onchain.
   Stable File ID remains. A rejected stale CAS changes neither placement.
   Raw Core multi-leaf atomicity alone does not certify `NOREPLACE`.
3. A and B both tag File A `ocean`; B also tags File B. Identical assertion
   Records from A/B may deduplicate, but attributed occurrences/current Bindings
   do not. Untag A leaves B's tag active; only after B also untags File A does
   the positive filter exclude it. Re-tag A is a fresh occurrence; an unchanged
   immutable Record may be reused, but the old occurrence is not made current
   again. Tag-author scope is shown separately
   from the namespace Lens. Negative filters require complete tag coverage.
4. Keep **Remove from this folder** distinct from **Stop asserting this name**.
   Remove writes a removal marker and a mask; it does not erase the Object or
   bytes. Retraction writes a tombstone, may reveal B, and creates no Removed
   item. Rename masks must not create Removed items. Restore is a fresh,
   precondition-checked placement and marker retirement, not history deletion.
5. Preserve a local edit draft across a CAS loss or upgrade. Explain “Not saved;
   this note changed. Your draft is intact.” No automatic new consent/retry.
   A staged byte blob can exist without the file edit having committed.

## Three SDK boundaries to validate

- **One intent:** apps supply a parent, exact name, content and chosen view.
  They do not construct leaf masks, execution ordinals, signatures or CAS rows.
  An opaque preparation binds the full execution set and exact intent; its
  ordinal is derived, not an independent app input. Stale preparation makes
  zero submitter calls when detectable; the contract still guards the race.
- **Two historical coordinates:** `acceptedUnder` describes original
  acceptance; `observedWith` describes the current reader/runtime and basis.
  Unknown old revision evidence never silently becomes U2 acceptance. Keep
  obtained exact bytes available even when interpretation is unresolved.
- **Separate facts:** exact-byte/structural validity, application-profile
  validity, executor support and committed effects must remain distinguishable.
  Do not expose one misleading `valid` or `success` boolean. A rich valid
  name unsupported by the selected ASCII router is not an invalid name.

These names are explanatory API sketches, not new exports. The SDK PM's
existing Reader/Actions separation remains the owning design.

## Smallest missing implementation joins

The foundation supplies raw retained state and upgrade history, not all three
joins below. Implement and test each against the same state before claiming
the owner walkthrough works:

1. Revision-aware bounded read pages plus actual contract Plan validation and
   point Lens resolution, including full `(kind, target, leaf)` equality.
2. Files profile/router checks and authored-current tags, including the raw
   malformed-selected fixtures in [validation-frontier.md](validation-frontier.md).
3. Static SPA + SDK projection/actions, followed by a populated upgrade and
   independent contract/guest-reader comparison. Real wallets remain separate.

Measure one complete small-file creation and one atomic rename under normal
transaction limits, not just separate object writes. If they do not fit,
redesign that seam before product implementation; do not quietly split an
atomic user operation or increase the EVM limits to make the demo pass.
