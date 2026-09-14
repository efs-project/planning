# Files withdrawal versus retained reads: bounded probe

September14. Authorized disposable prototype continuation, not a new Core
decision. The completed Files paid run contains no withdrawals and is frozen;
do not rerun or change that evidence to obtain this result.

## Question and source basis

Compact B WITHDRAW retracts an author's PUBLISH/REUSE occurrence, retaining exact
Record bytes and all HEAD/path/tag Bindings. The checked Files consumer instead
rejects a selected zero-occurrence Record as `E_PROFILE`. Its parent checks and
Core checked references require retained identity, not positive occurrences.
This can make a folder fail while its selected data remains well formed; a
different author's REUSE may restore readability without changing the selected
HEAD. Source analysis predicts this, but it needs actual execution.

Current draft authority distinguishes carriage withdrawal from deletion and
application revocation: `core-architecture-candidate.md` Withdrawal paragraph,
`hierarchical-files-and-folders.md` section1.1,
`programmable-type-acceptance.md` accepted-action lifecycle, and the constitution's
append-only/no-resurrection rule. An advanced placement-claim withdrawal that
permits Lens fallthrough is separately described in the MVP UX plan; compact B
WITHDRAW cannot target BIND and does not implement that operation.

### Task 1: Characterize withdrawal and retained reads

Create only `lab-b/test/FilesWithdrawal.t.sol`, using the existing real joined
fixture, plus its assigned report. Do not edit Ledger, Index, profile, consumer,
existing tests, paid runner, oracle, source evidence or production repositories.
Three tests of existing behavior may legitimately pass first time; do not
manufacture a broken stub. Inherited fixture tests must not be double-counted.

1. Real valid RA/RB controls, then Alice's genuine signed withdrawal of the
   sole RA occurrence. With a fresh basis, assert retained bytes/ID/first
   admission and zero count, original withdrawn flag, unchanged HEAD/placement/
   File tag/revision tag, COMPLETE current family and unchanged retained parents.
   Assert exact Alice-first `E_PROFILE` for point, conflict and both folder tag
   scopes; Bob-first still reads RB and returns COMPLETE empty approved results.
   Check the actual named by-Type/by-author live decrement, not disappearance.
2. Withdraw R0 and prove live descendants still read. Actually publish a new
   distinct valid same-File Child of zero-occurrence R0 and verify required
   parent membership. Withdraw RA and publish/select a distinct grandchild of
   RA, proving the other parent-header branch. Neither ancestor needs a positive
   count. Preserve original exact parent bytes. Existing missing/wrong-parent
   rejection tests remain unchanged, not replaced with fake storage.
3. Withdraw sole RA, observe the first test's failure control, then Bob genuinely
   REUSEs RA without changing any HEAD. Prove count1, Alice original occurrence
   still withdrawn, unchanged Alice HEAD and restored read. This characterizes
   aggregate maintenance, not selected-author revocation. Do not duplicate
   already-retained generic unauthorized/double-withdraw tests merely for count.

Use exact signed/native actions, current bases, real records and source-derived
index keys. Root owns frozen source/compiler gate, normal sizes, independent
review and exact-path publication. No worker Forge/Anvil/RPC/install/git or
subagents. Root's first focused run must finish well before14:00UTC; stop on a
semantic mismatch and explain it rather than silently rewriting expectations.

## Outcome and next decision

Retain these as characterization evidence, not a specification that the current
error is desirable. Recommend a reader policy after the results: retained
well-formed bytes should not become a profile-integrity error merely because
maintenance reaches zero. Explicit application revocation, selected HEAD and
maintenance are different facts. Any subsequent corrective regression/fix needs
its own stated expected behavior and review; it is not included in this probe.
No new public SDK enums, automatic fallback to another author, privacy claim or
Core withdrawal semantics are adopted here.
