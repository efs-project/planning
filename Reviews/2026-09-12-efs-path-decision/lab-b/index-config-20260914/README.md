# Signed index-configuration expectation: observed gap

Source `f05cf59f188061ec33f5e2fb8cb005d0f2ba51d4`. One actual test confirms:
an admin can downgrade a required family's declared coverage without changing
the module commitment, generation or pending signature; the old publication
still succeeds and ordinary index postings are present. Non-admin mutation
is refused. No Core/Index fix, signature forgery or data loss is claimed.

Seven gzip files retain complete compiler input/output, actual run report/log,
the refused future-start lease, interpretation, independent review and diff.
`manifest.json` records raw and compressed hashes/lengths; generation verified
decompression byte-for-byte. The future-start attempt spawned no child and is
not counted as a test. Actual corrected run: 1/1 PASS, owned processes stopped.

This characterizes the current lab, not desired production semantics. A
COMPLETE-requiring consumer must explicitly refuse PARTIAL; that consumer
behavior is not executed here. Test gas is not production receipt pricing.
Mandatory obligations should be frozen or configuration-committed in the
eventual execution contract; actual coverage preconditions remain separate.
