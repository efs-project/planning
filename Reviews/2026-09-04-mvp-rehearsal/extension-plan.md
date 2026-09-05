# Workflow extension pass

James's follow-up authorizes fleshing out this disposable prototype, not adopting
the lab ABI. This executes the bounded next workflows in `pm-handoff.md`.

## Work split

- Files controller: exact links, eight-entry continuation, verified binary
  upload/download and bounded revision history. Preserve all three approval
  paths and independently authorized read-back.
- Data controller: one read-only exact-schema table, lossless integers,
  same-basis continuation and inspection, visible failures and loaded-row tools.
- Arcade controller: retain the original release; a second exact release reads
  an ordinary typed bytes32 challenge. Verify both at one basis before explicit
  scripts-only launch. No host bridge, wallet or score-trust claim.
- Integration: native-module shell, seeded contract fixtures, browser journeys,
  failure injection, source/output manifest and updated handoff.

Each controller exports `create…View({root, sdk, config, utilities, onEvidence,
onStatus, onBasis, navigate})` with `open(hash)`, `refresh()` and `deactivate()`.
Controllers fence stale asynchronous reads; the shell also fences callbacks from
inactive areas. Routes are hash-only and do not create a server-side router.

## Acceptance

1. Existing local write/read-back and sandbox tests still pass.
2. Fresh browser opens an exact old revision; returned download matches its
   verified bytes. Oversize upload is rejected before any signing call.
3. Pagination stays at its original basis; loaded versus complete is explicit.
4. The table preserves 9007199254740993 and 18446744073709551615 exactly,
   separates schemas, and keeps unavailable or corrupt rows inspectable.
5. Equal challenge/release yields the same obstacle sequence; another challenge
   differs. Failed validation and interrupted launch never mount executable data.
6. No Solidity, SDK wire profile, permanent EFS IDs or full-C0 status changes.

The existing 24 Solidity / 42 Node / 8 browser results are the first checkpoint,
not evidence for this extension until rerun. Public deployment, real wallet
extension compatibility and full Core conformance remain separate work.
