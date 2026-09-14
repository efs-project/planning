# Last bounded gate: required, recoverable Files names

September14, root-authorized disposable continuation after the cold-name source
preflight. Stop source work by13:25UTC; root execution/review/publication must
finish before14:00UTC. No browser completeness, paid price or production claim.

## Purpose and scope

The existing compact Label probe proves a direct lookup can recover a retained
name from the raw-hash role. The paid Files graph did not retain names. Test
whether an **ordinary named Files profile** can require this dependency using
the existing mandatory callback, without a Core change or global dictionary.
This closes one precondition for the next cold browser vertical, not that whole
vertical. Mount one explicit folder ID as `/`; do not invent `/drafts` ancestry.

Own only new `lab-b/test/FilesNamesProfile.sol`, `FilesNames.t.sol` and a scoped
task report. Reuse actual Root/Child acceptance, FilesParentIndex, Keys, Ledger,
Lens and signed/native helpers. Leave existing modules/tests/paid artifacts
unchanged. Prefer a standalone test fixture without inherited test duplication.
No generic SDK implementation or new test runner. Root owns bounded Forge gates.

## Exact profile experiment

- An immutable ordinary Name Type accepts raw1–255 ASCII bytes in `[a-z0-9._-]`
  except `.`/`..`. This explicit disposable subset is not full Unicode FilesName.
  Its role is raw `keccak256(nameBytes)`; it does not silently adopt the fuller
  design's different domain-separated role formula.
- A derived FilesParentIndex retains all existing mandatory maintenance. Its
  callback checks each relevant FOLDER BIND's retained position and derives the
  Name Record ID from the constructor-pinned Name Type and role. Validate exact
  Type, bounded bytes/hash/profile and first admission. Reject the entire
  publication if the name is not retained/valid. Do not require occurrences>0.
- The callback sees the publication's atomic final state. Pin and test whether
  the Name action may appear after BIND in that same publication; do not claim
  per-action ordering constraints that the actual hook does not impose.
- A small read-only name helper takes a verified placement position and one
  basis; returns actual name bytes plus qualification, never merely a commitment
  or fixture label. Check position derivation, purpose/folder/role, exact Type,
  first-admission bound and Record ID/body hash. Preserve unknown/missing and
  bad-name information separately from the caller's placement membership.
  It does not itself prove Lens membership, selection, block authenticity or a
  full path; expose that precondition explicitly. No positive-occurrence gate.

## Required tests (bounded, no benchmark)

1. Genuine signed create with Root/HEAD/placement and **missing name** rejects
   exact mandatory-callback error. Counts, nonce, records, head, scope/index and
   File creation roll back. Direct generic ingress must hit this same guard.
2. The same logical positive write includes an exact Name publication in the
   atomic vector. Check real retained bytes, position, Root/HEAD/placement and
   required scope/parent maintenance. The name helper derives the ID without a
   name dictionary. Include actual callback-visible action-order behavior.
3. A second name/placement for the same File and another File reusing an existing
   name establish that names belong to positions, not File IDs. Omitting a
   previously retained Name creates no new occurrence and still reads correctly.
4. Withdraw the **last** Name occurrence; count becomes zero, but exact name,
   selected placement and contents remain. No automatic selection fallthrough.
5. Actual name-result substitutions in a test facade (missing/revert, wrong
   Type, wrong bytes) are classified/refused; genuine membership remains intact.
   A future/mismatched read basis rejects. Do not corrupt authoritative storage
   and call it a real accepted-record failure.
6. Empty, slash, control, dot/dotdot, over255 and unsupported rich names refuse;
   positive exact ASCII input is never normalized or silently replaced.

Use a compiling false callback/name helper for behavioral RED. Freeze tests
after root observes actual intended failures, then implement only those new
profile helpers. Test-source corrections require disclosure, not relabeling.
Root runs a uniquely labelled nonempty focused gate, full regression and normal
size only if time permits; no paid Anvil run or new performance extrapolation.
Independent review must distinguish mandatory name retention, byte recovery and
the **still-unimplemented cold browser/SDK path**. Stop with a useful failure or
explicit remainder rather than crossing the cutoff or weakening requirements.

## Review-driven seventh falsifier (13:19UTC)

The original six tests reached behavioral RED (1 pass/5 intended failures), then
GREEN (6/6) with their source unchanged. Independent review found that correct
name bytes with an earlier fabricated admission ordinal could pass the helper
when supplied by a facade. Add one separate seventh test, preserving all six
original test bodies, and first run it against that original GREEN helper.
Then compare returned Type/admission/length against the real Ledger header
before returning FOUND. This is an onchain consistency check, not an RPC or
header/state-root proof. MISSING means this source did not supply the name; it
does not prove authoritative absence or remove known placement membership.
Retain both original focused gates and the new falsifier before final full
regression/normal size. No additional Core API, paid run or browser claim.
