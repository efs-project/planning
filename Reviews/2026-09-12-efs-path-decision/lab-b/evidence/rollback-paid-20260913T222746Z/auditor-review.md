# Independent offline auditor source review — 2026-09-13

**Verdict: source/spec PASS; no blocking gap found in the requested evidence links.** The auditor is ready to inspect the forthcoming packet; this is not an audit PASS for a packet that does not yet exist.

Reviewed the complete `audit.mjs` and `audit-assumptions.md` in `/tmp/efs-b-control-independent-prep-20260913.i4vLAa` against the frozen Node26 expectations, control specification and reviewed launcher. Node26 syntax check passed. No RPC, chain, compiler, candidate WIP inspection, fabricated passing packet or full execution was performed.

## Independently enforced links

- Line 26 pins the literal expectation file SHA256, preventing replacement with post-run answers. Lines 114–129 require exactly 69 primary plus 19 auxiliary replies per state, all three arms: **528** exact raw return bytes. Each observation matches frozen destination/calldata and the fixed block number, with no added call fields or state override. Pre-reads follow the prefix receipt and precede the static call; post-reads follow the attempt receipt. Candidate read maps must also match, but are not the underlying evidence.
- Lines 62–84 decode every signed raw transaction, enforce canonical encoding, chain 31337, legacy type, zero value, gas price, expected sender/nonce/destination/calldata, and the sealed explicit gas limits. Raw send hashes, recovered senders, mined transaction signature/input fields, receipt identity/status/position, block hashes and header transaction lists are joined directly. Exactly **36** unique expected transactions are checked, with sequential send/receipt ordering and one transaction per block.
- Lines 46–60 require a consistent contiguous header sequence 0–36, genesis timestamp, monotone timestamps below deadline, and parent linkage. Consumed gas agrees across receipt, cumulative receipt gas, header and candidate gas summary. Failed receipts have no logs.
- Lines 91–96 check all **18** CREATE addresses, creation receipt addresses, complete signed initcode hash/length, and raw deployed runtime hash/length against frozen preparation. No masks or candidate-derived expected code are used.
- Lines 103–113 bind each static call's sender, destination, data and **gas** to the independently decoded mined transaction, at the sealed pre-block and before submission. Refusals require literal complete `error.data`, not parsed prose or an outer selector; calibration requires the independently sealed `(2,4)` return. Expected failed/successful receipt statuses are checked separately.

Report success booleans cannot substitute for these checks. Missing or inconsistent data throws before `PASS_RPC_OBSERVED`; failure output preserves only completed check counts. Permitted RPC methods exclude snapshot restoration and additional mining controls.

## Nonblocking qualifications

`audit.mjs:57` does not compare `header.gasLimit` with 30,000,000. The explicit per-transaction 15m/8m/3m limits are verified, while the normal block ceiling currently relies on the separately reviewed launcher. A one-line header assertion would corroborate that condition from the packet itself.

`audit.mjs:133` checks each supplied artifact metadata entry but does not require a complete/nonempty set. Missing metadata therefore does not fail that loop. This does **not** bypass full signed initcode/runtime pins; either require the intended exact metadata path set or avoid describing this loop as a complete artifact-inventory check.

Both are narrow provenance/qualification notes, not blockers to the stated byte/link audit. Actual transport compatibility remains unexecuted: a genuine `FAIL_OR_GAP` must be investigated without changing frozen expected answers. A later PASS remains **RPC_OBSERVED**, not authenticated state proof, an internal-write trace, portable import evidence or C equivalence.
