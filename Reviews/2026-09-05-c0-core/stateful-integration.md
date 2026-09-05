# Next integration: application admission, Binding and postings

**Status:** reviewed engineering direction after `95b406d`; not implemented state or completed C0 acceptance.

The next increment uses the checked body once and joins each extracted reference
to the admitted cache's role metadata. It must advance the same Core track,
not become another disconnected public write API. The bounded demonstration is
an ordinary Object Record plus its charter Binding in one admitted batch,
followed by rebind, lifecycle pressure, retry and state-only reconstruction.

## One owner per piece of state

| State | Responsibility |
|---|---|
| Records | Immutable exact Type/body, stable unique Record ordinal. |
| Envelopes and accepting batches | Immutable header/full Record vector and retained, correctly qualified authority evidence. Keep per-batch evidence separate from envelope identity. |
| Occurrence status | ACTIVE/WITHDRAWN/PRE_WITHDRAWN plus original admission and withdrawal ordinals; no second Binding-owned lifecycle store. |
| Admission log | Enumerable reversible Envelope/leaf/Record/Principal/evidence linkage. |
| Binding heads | State, revision, producing ordinal, target kind/id/leaf and tombstone cause. |
| Postings | Occurrence families, unique Records by Type, reference/backlink/value declarations, RAW_AUDIT Binding history and genesis-active BindingScope. |

Binding history is its posting list of producing admission ordinals plus the
immutable admission/body spine. Do not add a second revision-history mapping.
Preserve the source's bounded, ascending-leaf **write-free shadow plan** and
atomic replay: later selected leaves see earlier legal effects, while commit
performs no new signature, reference, CAS, lifecycle or indexing decision.
An asserted replay mismatch reverts as an internal invariant failure.

The trusted internal kernel context is not a public mutation port. Test-only
hosts may expose it for state-machine pressure while the real authority/genesis
entrypoint is unfinished, but their evidence cannot claim authenticated C0
publication. The previous schema-only probe stays unchanged.

## Dispatch and effects

Derive kernel effect IDs from the actual G4 group-2 bytes and member order:
member 0 BindingSet, member 1 BindingTombstone, member 2 Withdrawal. Do not
dispatch by name/shape or substitute B0 singleton IDs. Derive the position
from all three canonical body words and the Binding key from that position
plus the authenticated full-width Principal, never the payer or caller.

BindingSet requires exactly one target option. CAS compares both the portable
predecessor occurrence and the separately carried Realm-local revision. A
tombstone retains a head, revision and producer; it is not a Files whiteout.
Withdrawal of a current head produces a new tombstone sourced by the Withdrawal
occurrence; withdrawal of an old producer never rolls the head back. A fresh
assertion may reuse an old value, but an old occurrence cannot produce another
head event. ACTIVE retries do not replay effects; terminal sources reject.

Use [the C0 evidence/support exclusions](codex-integration-notes.md) for
never-admitted withdrawal targets and the closed public operation table. Do not
advertise complete pre-withdrawal support from an admitted-target test. No
required Files mutation or M0 journey is dropped by these exclusions.

## Acceptance before joining the Lens

1. A same-name/same-shape non-kernel Type remains ordinary data; only the exact
   admitted kernel IDs dispatch effects. An unadmitted Type rejects.
2. Both/none Binding targets reject; Record and external Occurrence targets
   retain the right kind, full ID and leaf.
3. An earlier **selected** Record can satisfy a later REF; forward and merely
   unselected carriage cannot. A staged earlier Type group may supply the later
   body's cache.
4. Current-envelope OCCREF rejects in every selected reference position,
   including retry/partial-admission paths. A staged current envelope is never
   exposed to occurrence-target resolution.
5. Two full-width Principals derive distinct keys at the same position. A payer
   or caller cannot substitute authority or choose another author's key.
6. Missing/extra/duplicate/reordered CAS items reject. First write requires
   predecessor NONE and revision zero. A stale predecessor or revision leaves
   all state unchanged.
7. Two fresh same-key mutations in one Envelope against one prior source reject
   atomically: the second observes the first shadow change. Successful chains
   use independently precomputed Envelopes through the atomic router.
8. Mixed ACTIVE/fresh retry returns the old receipt without old CAS/effect replay
   and admits only fresh occurrences. All-ACTIVE retry writes nothing;
   WITHDRAWN/PRE_WITHDRAWN source readmission rejects.
9. First tombstone → rebind → tombstone → retombstone preserves monotonic
   revisions/history, clears targets on tombstone and adds one scope anchor
   only. First bind also anchors exactly once.
10. Withdrawal of current/older/tombstone producers never rewinds a head. Two
    new Withdrawals targeting one old occurrence admit two evidence occurrences
    but apply one target decrement/transition. Wrong author and
    Withdrawal-of-Withdrawal reject.
11. Repeated references and declared backlink overlap append once per final
    posting key. Withdrawal decrements exactly that deduplicated set once;
    unique-Type live count changes only at last-live zero crossing. History and
    BindingScope never decrement, compact or filter by occurrence liveness.
12. Valid earlier leaves followed by invalid final reference/CAS/withdrawal
    leave rows, counters, postings and nonce unchanged. Test ordinal/revision
    exhaustion explicitly; do not wrap or allocate the reserved guard value.

Tests of PRE_WITHDRAWN source rejection may use clearly labelled internal
state setup until the real C0 pre-withdrawal evidence path exists. They are not
proof that a caller can create an authenticated pre-withdrawal. Likewise,
signature/caller isolation must be re-tested through the real authenticated
entrypoint before claiming that part of the joined acceptance.

## Sources and review

- [Binding §§1–4](../2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md):
  keys, one history owner, transition table, CAS and no resurrection.
- [Admission §§5.4–5.5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md):
  selected visibility, shadow ordering, retries and authenticated evidence.
- [Indexes §§2–3/6](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md):
  lifecycle/count ownership, key deduplication and point/basis reads.
- [Files §5](../../Designs/efsv2/hierarchical-files-and-folders.md): the C0
  BindingScope RAW_AUDIT override, including first-tombstone anchors.
- [Actual candidates](../2026-09-05-mvp-build-start/type-inputs/inputs.v1.json)
  and [derived IDs](../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json).

The independent stateful-slice review supplied these twelve falsifiers and
identified the pre-withdrawal/signature and closed-operation seams. Source
modules and test-host structure remain reversible engineering choices. Measure
the complete runtime before choosing physical topology; component fit does not
establish full-Core fit. No owner answer is needed to begin this increment.
