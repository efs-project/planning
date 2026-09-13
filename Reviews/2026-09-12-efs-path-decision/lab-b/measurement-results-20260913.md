# Compact EFS: joined and label diagnostic run

**Standing:** completed local receipt experiment; independent packet review pending.
Not a full Files parity result, independent chain proof, or architecture selection.

## Exact run

- Source: `df23bbbb792e4d0d50d73f420c341ae38090edb1`, an isolated copy of
  Fable's `e77f36d` with the reviewed runner repairs and one test-message
  Unicode prefix. Candidate Core remains associated with `dcc7b94`.
- Packet: [measurement-20260913T061130Z.json](evidence/measurement-20260913T061130Z.json),
  SHA-256 `b2229f3dcef88649125e12fa9946ddfad034e8b3499eaf6b71e58e065957fd07`,
  11,001,205 bytes. Raw evidence is unchanged from the completed run.
- September 13, 2026, 06:11:30.631–06:11:45.233 UTC; Node v26.0.0,
  ethers 6.15.0; pinned offline solc 0.8.30, optimizer 200, via-IR,
  candidate metadata defaults; local Cancun, chain 31337, 30M block gas.
- Forge 1.7.1 commit `4072e48705af9d93e3c0f6e29e93b5e9a40caed8`;
  native compiler SHA-256
  `738dcdc6afddeb505ee4e4ef24f1c1fdba2b8c924e614cbbf5801a5b062dd683`.
- Root reproduced 32/32 Forge tests and 11/11 runner behavioral tests.
  Independent preflight approved the repaired runner for this diagnostic.
- Runner exit 0; all 18 planned cells completed, none skipped;
  `failure: null`, zero candidate consumer/commitment mismatches.
  173 retained transactions include 14 deployments and intentional reverts.
- One run-owned Anvil PID 34087, Node PID 34086, prune-history 256,
  separate scratch/cache `efs-road-b-run-20260913.9xQRrd`. Root checked
  Anvil no longer existed after completion; scratch was 13 MiB.

## Selected receipt gas

| Operation | Gas |
|---|---:|
| Native hash-keyed 32-byte quote create | 1,216,793 |
| Native quote edit | 511,898 |
| Signed hash-keyed quote create | 1,261,965 |
| Signed quote edit | 558,573 |
| Native quote paid stateless point read | 51,147 |
| Native quote paid stateless folder list | 89,121 |
| Native quote paid stateless older history | 66,112 |
| Joined Items + checked Pair setup | 905,829 |
| Joined signed A1: Subject + typed Quote + head + placement + tag | 1,608,502 |
| Joined signed A2 edit | 654,289 |
| Joined genuine contract-authored B1 | 791,814 |
| Joined paid point, A-first / B-first | 123,047 / 123,278 |
| Joined paid folder / folder-and-tag list | 101,953 / 112,471 |
| Joined move / remove placement / restore placement | 572,901 / 279,157 / 336,765 |
| Hash-keyed create with fresh printable label | 1,422,724 |
| Create with previously retained label, republished | 1,292,309 |
| Create with previously retained label, not republished | 1,182,569 |

The existing-label cells each separately pay 497,039 gas for another author
to admit the label before creation. Those setup costs are not included in
their create rows. Omitting re-publication does not claim that the new author
accepted that label. The consumer receives a candidate-derived label ID;
this is a filename retention convention, not end-to-end independent name
discovery. Hash-only creation cannot retrieve printable bytes from state.

Stateless readers still include their transaction/call/event overhead. The
old storing reader's 137,883-gas point result includes its own storage writes;
comparing it with 51,147 is an instrumentation distinction, not a new Core
optimization. The joined reader performs deeper Type/Pair/reference checks
and must not be compared with a simple quote getter as identical work.

All 14 deployments total 13,246,072 gas; index attachment and six Type
registrations total another 733,987. Candidate deployables fit ordinary
runtime/initcode limits; Ledger is 16,699 runtime bytes and 17,139 bytes of
constructor-inclusive initcode. Test-only Forge harnesses are not deployments.

## Failures and remaining gates

Wrong-Type references, stale expected revisions, rejecting developer
acceptance and mandatory-index failure have retained status-0 receipts,
matching static-probe selectors and unchanged probed state. An unresolved
two-author conflict exposes no quote. Removed/restored placements and an
independent replacement at the old path are exercised in the joined cell.
These are candidate self-checks until independently interpreted.

The packet retains literal RPC envelopes, transaction/receipt/header joins,
source and artifact hashes and all seven storing-consumer getter values at
the actual receipt-block basis. It is **RPC-observed evidence**, not an
authenticated state proof. Independent packet consistency review and the
separately frozen SDK interpretation supplement remain distinct checks.

No full browser/large-directory/RPC-latency gate, cold printable-name joined
Files gate, complete export/import proof, populated upgrade, or capability
ablation ran here. Mutable symbolic Type registration, source-origin/native
import authority and replay-domain scope remain open candidate defects, not
waived requirements. The no-index arm explicitly removes required queries
and cannot win a same-guarantee comparison. B-versus-C ratios still require
matched semantics and configuration; this run selects no architecture.
