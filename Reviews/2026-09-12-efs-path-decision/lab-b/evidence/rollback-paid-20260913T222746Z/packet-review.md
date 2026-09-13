# Independent mined-control packet review — 2026-09-13

**Verdict: PASS_RPC_OBSERVED for both B refusal/rollback controls and zero-poison calibration. No blocking packet mismatch or missing claimed join found.** This is the new disposable B control supplement, not a replacement normal paid-cost row or a matched B/C result.

Reviewed the retained run `/tmp/efs-b-controls-paid-20260913.00DzB4`: frozen expectations, pins, launch record, raw transport, candidate report, independent audit and root supplement. No RPC, Anvil, compiler, chain mutation or source edit. Separate read-only Node checks inspected the raw packet directly; rerunning the already reviewed offline auditor reproduced `audit.json` exactly.

## Actual receipt and state results

| Control | Pre/post blocks | Mined status | Receipt gas | Fixed-state result |
| --- | --- | --- | ---: | --- |
| Scale 7 mandatory rule | 11 → 12 | 0 | 371,952 | All 88 post replies equal S0 |
| Final-TAG required-index refusal | 23 → 24 | 0 | 1,612,461 | All 88 post replies equal S0 |
| Zero-poison calibration | 35 → 36 | 1 | 1,614,558 | All 88 post replies equal sealed S1 |

Both refused attempts retain counters `(3,3,0,1)`, protocol nonce 0, prefix records/bodies/occurrences/evidence/admissions/postings, absent attempted File/Quote/bindings/admissions 4–8, and COMPLETE coverage through 3. Empty attempted lists have exact zero word0, not merely empty heads. Calibration has counters `(8,4,3,2)`, nonce 1, File/Quote 4/5, heads 6/7/8 at revision 1, scopes 1/2/3, matching histories/backlinks and coverage through 8. These conclusions come from raw replies, not the candidate's booleans.

## Bounded verification

Independently matched all **528** frozen raw results, **36** signed transaction inputs and receipt/header joins, and **18** full initcode/runtime hash-and-length pins. The three static calls use the same sender, destination, complete calldata and 3m gas as their signed mined attempts. Literal refusals are the exact 68-byte mandatory error and 132-byte nested late-index error; calibration returns `(2,4)`. Failed receipts contain no logs. Receipt gas above agrees with retained headers.

The complete offline audit corroborates **781** valid RPC envelopes, 37 contiguous headers, unique signed transactions, exact nonce/chain/signature fields, sequential send/receipt ordering and all three static/mined links. No snapshot restore or extra mining call appears in the retained transport.

The supplement closes both earlier nonblocking qualifications: all **43** header replies across 37 blocks show gasLimit 30,000,000, and the exact six artifact roles map to their sealed paths/SHAs. Its omitted-role, swapped-role and wrong-limit negative checks are correctly constructed. My own checks also confirmed the gas limits, role inventory and **41** unchanged sealed files. Pins distinguish compiled Solidity source `8ddd04c` (the report's expectedCommit), runner/full checkout `4345992`, oracle `3dfd975`, and source/test evidence `4487d7b`; the runner was not compiled at `8ddd04c`.

Launch record reports completion at 22:27:46.830–22:27:48.589 UTC within the reserved lease, successful runner exit and stopped owned groups. Root separately confirms process cleanup; this review did not probe live processes.

Packet identity: expectation SHA `0b26e6d2a0037de6f89089eece41cbb1174a76eb87e8de945d9c599bf8b28622`; raw SHA `64a3131ca58d0f3aadcb8ed47a3afbffcc87dff9f9983433e9be7cb03e576db7`; report SHA `258613d9581e768e422572f0e4d619c7a9cac22ffa5d8381642d3d02b5d13031`.

Remaining limits: calls are number-qualified and joined to mutually consistent retained hashes, not EIP-1898 authenticated state proofs. Exact late-error linkage plus pinned reviewed source is not an internal-write trace. No dishonest-RPC exclusion, C equivalence, portable import, full Files lifecycle, production approval or normal paid-cost promotion follows.
