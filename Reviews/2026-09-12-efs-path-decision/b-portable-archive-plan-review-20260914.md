# B archive implementation preflight

September14,2026 · disposable implementation plan, not protocol adoption

The independent Astra preflight found no ABI or representation-layout blocker.
It required five concrete repairs, now incorporated into the
[[b-portable-archive-implementation-plan-20260914|implementation plan]]:

1. Keep raw signed transactions, receipts, block/code observations and actual
   new-file hashes; summary booleans and a Git diff excluding untracked code
   cannot establish the paid comparison.
2. Use the real Ledger return types: `publish` returns a Record ID, while
   evidence is addressed by publication ordinal. Recover bytes from the archive,
   test the exact stale-CAS failure, and read the archive while today's policy
   is still rejecting. Omitted, changed and reordered action tuples all reject.
3. Prove no-write retries with storage-access recording and test every packed
   field using arbitrary signed tuples—not only conventional PUBLISH actions
   whose other fields are zero. Unknown-Type claims are not accepted Records.
4. The Task-1-only morning handoff must pass the full existing regression suite.
5. Pin timestamps and branch-local observation bases. The two-action no-body
   cost cell is not the three-action joined recovery or its destination cost.

Scoped re-review marked all five addressed. Root also replaced a missing-import
compile error with a compiling API-only stub and an actual behavioral RED gate.
The final path correction uses root-resolved absolute worktree/lab/Node/ethers
variables, including an explicit worktree reset before staging.

Source basis: B `1d8356c9de86a488c950abcb3f9f4d17a6126510`, an artifact-only
descendant of `b94b57c405ef18b7f259cbd636d685ff96738ce7`; archive source did not
exist at review. Implementation begins only in that existing B successor.
The detailed independent report and task ledger remain retained in local review
scratch; this summary records the dispositions, not an executed-test result.

No Core/Ledger edit, forwarded-author admission or historical native-source proof
is authorized. The only positive archive label remains
`AUTHOR_SIGNATURE_VERIFIED`. Packed storage is the reversible starting point;
an incomplete paid comparison cannot select the code-vector alternative.
