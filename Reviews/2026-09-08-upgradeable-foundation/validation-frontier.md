# What “valid data” has actually been demonstrated

This is a **new test of the existing direct fixture host**, separate from the
upgradeable host. It retains real EFS Records and validates them with the
independent reader. It does not install a Files validator, compatibility View,
portable author authentication or a browser.

Run from the vault:

```sh
node --test Reviews/2026-09-08-upgradeable-foundation/test/validation-frontier.test.mjs
```

September 8 result after review correction: **4/4 tests pass**, including three
named subtests, in 1.8 seconds with cached compilation (33.2 seconds for the
initial compiling run); 21 local transactions, maximum observed publication gas
14,435,232 under the existing 16,777,216 ceiling. The managed Anvil process
stopped. These are boundary canaries with expected outcomes, not new features
or a security audit. The test reuses the unchanged direct-host workflow;
the separate revision-aware admission seam was being developed concurrently.
Re-run the canaries on the final source before treating the result as a joined
checkpoint. Gas is for these fixtures, not a general file-operation estimate.
Negative cases assert exact preflight **and mined trace** revert bytes:
`E_REF_UNSATISFIED(0,0)`, `ReferenceUnproved(0,1)` and `InvalidBody(1)`.
A reverted receipt alone was insufficient evidence for the named cause;
independent review caught and corrected that weakness before handoff.

| Question | Actual result | Consequence for the MVP |
| --- | --- | --- |
| Can another developer add a field later without changing old data? | A separately admitted `FrontierNote/1.1` coexists with exact `1.0`; the old Record still decodes unchanged. | Old links and evidence stay meaningful. New descriptors create new exact IDs. |
| Does that automatically make the new Record readable as exact `1.0`? | No. The strict old decoder rejects trailing extension bytes; an exact `1.0` reference rejects `1.1` atomically. | A generated compatible View/projection needs explicit validation and a fixture. Version labels alone are not proof; do not rehash/relabel new bytes as the old Record. |
| Does Core reject a malformed body or nonexistent referenced Object? | Yes; rejected transactions preserve independently reconstructed retained state. | Shape and reference guarantees are useful, concrete guarantees. |
| Does structural admission alone prove a usable directory entry? | No. Empty, dot/dot-dot, slash, NUL and non-NFC names can be retained; the Objects deliberately have no Files meaning/charter. | The Files layer must validate names, node meanings/charters and the selected result, even when Core admission succeeded. |
| Must Core forbid every graph cycle? | No. A self-link can be structurally retained. | Path traversal must detect/bound cycles contextually. This is not evidence that every cyclic graph is invalid. |

These results match, rather than replace, the existing
[Files validation boundary](../../Designs/efsv2/hierarchical-files-and-folders.md)
and [candidate descriptor limitations](../2026-09-05-mvp-build-start/type-inputs/README.md).
In particular `profileRules` prose is not executable validation. The seven
DirectoryEntry canaries contain no name-slot Bindings and are not an automated
`MALFORMED_SELECTED` resolver test yet.

## Next falsifiers using the same records

1. Bind a profile-invalid entry at the winning Lens tier. The Files reader
   must report `MALFORMED_SELECTED`, not quietly display a lower tier. Add a
   missing charter/plan witness and require an unresolved result, not absence.
2. Execute a Files operation through the router, bypassing the UI's validator.
   The router must independently enforce its declared profile and all state
   preconditions. A frontend check does not protect another contract caller.
3. Test rich name vs router support separately. The current contract arm
   supports lowercase ASCII `[a-z0-9._-]`, whereas rich FilesName permits more.
   `Trip` can be valid rich FilesName but unsupported by that arm. Do not
   silently lowercase it, call it invalid, or promise full Unicode certification.
4. Run a sanctioned additive-field View with an old consumer, then change
   a field's meaning/type or omit its adapter. Require a truthful unsupported
   result. This test has not implemented or proven that compatibility layer.

The architectural lesson is small: retain and verify exact facts in Core;
prove the application interpretation at its explicit boundary. The SDK should
make that distinction easy to use without claiming a universal “valid” bit.

## Authored tags: a concrete use of ordinary Types

```sh
node --test Reviews/2026-09-08-upgradeable-foundation/test/tag-current.test.mjs
```

Fresh result: **4/4 pass** (one scenario plus three subtests), 9 real local
transactions; maximum publication gas 10,410,963. The fixture admits an ordinary
`FrontierTagAssertion/1`, one generic Object, and Principal-qualified current-tag
Bindings for synthetic A and B. No tag primitive was added to Core.

| State | Immutable assertion Records | Core-ACTIVE assertion occurrences | Current authored tag claims |
| --- | ---: | ---: | ---: |
| A and B assert the same tag on the same Object | 1 | 2 | 2 |
| A untags via its Binding tombstone | 1 | 2 | 1, from B |
| A re-tags with a fresh occurrence/current Binding | 1 | 3 | 2 |

The independent reader reconstructs both authors, exact Record deduplication,
distinct occurrences, current heads, history and the declared scalar posting.
The stale-CAS negative case asserts exact `ErrCasRevision(key,1,3)` in preflight
and the mined trace, plus unchanged retained state. Cleanup is checked.

**Important SDK/query consequence:** an index's `live` occurrence count is not
the number of current application claims. A separate Binding tombstone does
not withdraw the old assertion occurrence. Use postings as candidates and
join the Principal-qualified current head; do not count old assertions as
current tags. This is a component test on one generic Object, not a Files
charter, multi-file filtered listing, Lens implementation or authentication
proof. Those remain in [the joined consumer checkpoint](consumer-checkpoint.md).
