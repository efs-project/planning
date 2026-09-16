# Native state proof closeout evidence

Disposable local lab, not protocol adoption or general foreign-chain finality.

Exploratory attempts are preserved, including failure, with exact artifacts and
signed transactions. Their `sourceCommit` is the unchanged reviewed BASE while
new native source was uncommitted; it is **not** a claim that BASE contained this
new implementation. Artifact metadata pins the exact compiled source hashes.
Final runs name their committed source revision separately.

Final outcome and qualifications: [task-2-report.md](task-2-report.md).
`final-1` has five paid checkpoint/third-party-retention/pinned-consumer journeys,
then five independent source-off consumers, plus the finite falsifiers. It is
an **exact retained mixed-cache artifact** run at source `86e10eee86bb4ce959c1c99b43d5591e67661825`,
not a claim that a clean default build reproduces every paid metadata/code hash.
The forced layout inspection changed Ledger metadata by including the new
remapping; paid artifacts and anchors are not relabelled. See the report and
`final-1/storage-layout.json` before Resource2 integration.

Successful small-proof retention costs 11,617,114–13,382,546 gas. The fixed joint
8,192-body/10,592-read-set probe succeeds at source but verification/retention
revert under 15M. The 256KiB proof ceiling is a safety bound, not an affordable
envelope. `final-1/manifest.json` indexes exact artifact/source/file pins, roots,
actual receipts and observations; `other-instance.json.gz` records the separate
same-chain-ID/address/runtime negative. These are local retained consistency
facts, not foreign consensus or independent block-membership proofs.

- `attempt-1`: stopped on the positive-only profile's unsupported default index
  generation zero. Twenty-one real receipts; not end-to-end pricing. No failed
  proof packet was saved before the initial error boundary was strengthened.
- `attempt-2`: original full five-packet source-off journey before scratch reuse.
  Real proofs, write-once checkpoints, third-party retention, onchain consumers,
  late-only fresh process, expired B-state RPC and independent offline consumers.
  Its consumer was not yet pinned; later controls repair that trust-boundary gap.
- `attempt-3`: original same-shape paid verification-only cost isolation.
- `attempt-4`: pre-chain artifact/source mismatch guard stopped before Anvil.
  Partially copied artifacts remain; no paid run or success is attributed to it.
- `attempt-5`: one authorized scratch-memory reuse candidate. Every reclaimed
  word is cleared before reuse; no upstream check or byte was changed. Consumer
  also pins archive/code/verifier/source-anchor. Same94-node/20,824-byte shape,
  not identical block roots or contract addresses, compared with attempt3.

MIT source snapshot and raw/local SHA256 pins: `../src/vendor/optimism/NOTICE.md`.
The source-off companion takes independently selected root and deployment
anchors; packet flags are not trust. Retention has authority `NONE`. Header C
does not authenticate B's block hash or transaction inclusion; historic guarded
pre-state was not independently re-executed. Full proof nodes are in the packet,
not stored in the archive; the archive stores their exact witness commitment.
