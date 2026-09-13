# C positive paid slice: independent packet review

Verdict: PASS for the bounded positive typed-joined slice at RPC_OBSERVED grade. No blocking packet inconsistency found. This is not state-proof verification, matched rollback evidence, production readiness, portability, larger Files, or scale evidence.

Reviewed offline: `/tmp/efs-paid-c-run-20260913.YxKavf/{measure.json,inputs.json,launch-record.json,controller/*}`, pinned source/artifact bytes, and the existing bounded source-review note. No chain, compiler, test-suite rerun, source edits, or subagents. Only this report was written. Signed raw transaction reconstruction and full costing are the root reviewer's separate scope.

## Evidence joins

- Live source HEAD is `58dd3d78e8efa8e4490b035bdde5502b75adc9e3`; no tracked changes (four pre-existing untracked readiness/message files remain). All ten manifest source-file hashes and eight artifact-file hashes match. Compiled source stays `2ca7349e5d683c3ff10651c0fc106c10da946145`.
- Input SHA-256 is `16739ae05cb8a77c16b4c0edc9b5acd3a4b9b5074510a1d6d69c42aeed3f335c`; controller source hash matches launch record. Both context/ACK byte hashes independently match metadata; both ACKs bind the same run ID, exact input, source, stage, and retained block, with 76 successful checks apiece. Controller observations reproduce the ACK check arrays exactly.
- Independently reconstructed all eight full runtime/initcode byte strings from the pinned artifact bytes plus the manifest's explicit link/immutable patches and constructor suffixes. They match the packet, manifest commitments, and controller runtime replies at both blocks, without byte masking.
- Both controller transcripts use only chain/header/code/call reads. All 11 identity, two basis, and 50 raw table-read requests match manifest targets/calldata and exact expected return bytes at their stage's numeric block. Every block-dependent read uses that block. The pre-fixture basis is block 9 with frontier 0; the post-B1 basis is block 13 with frontier 16. Header rechecks match. These are independent process RPC observations, not independent node consensus or authenticated state proofs.
- All 18 retained deployment/operation transaction-receipt-header sets have matching hash, block number/hash, index, sender/target, header transaction membership, gas joins, and log transaction/block joins. No retained-log mismatch found.

## Actual fixture and paid rows

BOOTSTRAP/A1/A2/B1 actual transaction target, sender, and full calldata match the independent manifest, including A's supplied signatures. Independently parsed raw Published logs match manifest publication ID, author, proof kind, first admission, and leaf count. Blocks 10/11/12/13 reach frontiers 7/12/14/16 respectively.

| Row | Receipt gas |
|---|---:|
| BOOTSTRAP | 3,667,483 |
| A1 | 2,400,503 |
| A2 | 1,112,430 |
| B1 | 1,275,405 |
| Point A-first | 252,517 |
| List A-first | 391,043 |
| Point B-first | 252,457 |
| List B-first | 405,632 |

All four paid transactions match manifest target, caller and exact calldata. Each succeeds with one exact PaidObserved event: emitter, event signature, indexed kind, 1,408 data bytes, commitment, every selection field, and every placement field independently match the manifest. Raw eth_call replay requests use the retained transaction caller/calldata at its receipt block; exact replies match all 768 point-return bytes or 1,408 list-return bytes. Replay is RPC-observed return evidence, not transaction receipt return data.

A-first point/list select A2, A revision 2, EOA-signed publication evidence, admission 14, quote first admission 13, mantissa 2,502,000,000. B-first point/list select B1, B revision 1, direct contract publication evidence, admission 16, quote first admission 15, mantissa 2,501,000,000. Pair/ordered Items and typed closure fields match. Both lists retain A1's placement at admission 11/revision 1 independently of content selection; one scanned/selected entry, five hydrated reads, ended page, coverage through 16. Point rows do not perform or pay for that directory lookup. B1 has two actions and no FOLDER bind.

The afterB1 ACK and B1 receipt/header join the same seal: block 13, hash `0x140cc97c98dc3b3fb2684273e0c0e6d30b616cc603f78615d82ed6bf3fdd6d70`, timestamp 1789316722. All four paid rows are nonce 0 from account 3, the sole transaction at index 0 in their respective block 14, parented to that seal, timestamp 1789316723. Snapshot restore/reseal chain `2 -> 3 -> 4 -> 5 -> 6`, empty pools, send order, and replay-before-next-revert order agree with retained RPC entries. They are four alternative branches from one basis, not four consecutive surviving transactions.

## Reporting cautions

- The packet's `costDisclosure.classes.matchedFailureControl` key is misleading if lifted without qualification. `exact-retry-A1` is only an AlreadyAdmitted diagnostic (status-0 receipt at block 15, 63,046 gas), not the matched failed-mandatory-index rollback control. No rollback conclusion follows from it.
- Input status remains `DRAFT_FOR_ROOT_REVIEW_NOT_EXECUTED_SEAL`, as appropriate to immutable pre-run bytes; actual use/sealing is established by launch/context/ACK hashes, not by upgrading that input label.
- Paid gas includes MeasurementConsumer instrumentation and its event. Do not subtract the packet's estimated instrumentation allowance as measured overhead. A1's combined five-action gas cannot isolate placement cost without its paired control. Storage cost remains unknown.
- The source review's standalone-loopback-preflight and timeout-transcript caveats remain relevant to future reuse, but are not failed evidence checks in this positive owned-loopback packet.
- Successful semantic equality is within this C fixture and each ordered lens. This review does not require or claim B/C byte identity or a winning architecture.
