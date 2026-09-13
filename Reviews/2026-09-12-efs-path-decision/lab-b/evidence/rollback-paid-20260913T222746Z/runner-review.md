# Independent B control runner review — 2026-09-13

Scope: complete `4487d7b..c995d90` delta (656-line runner and 69-line focused test), Task 1 brief/report, updated 22:05 control seal, frozen independent expectations, and previously reviewed auditor/launcher. No Solidity changes, RPC, compiler, Anvil, repository mutations or subagents. One tiny in-memory fake-fetch probe used the actual transport function; no network call occurred.

**Spec verdict: one narrow correction required. Quality verdict: otherwise sound for the bounded disposable runner; conditional PASS after the transport finding closes.** No run or rollback result is approved here.

## Important — malformed RPC envelopes can be accepted

`Reviews/2026-09-12-efs-path-decision/lab-b/script/rollback-control.mjs:157–168` records HTTP status but does not require status 200 or `jsonrpc: "2.0"`, and does not require exactly one own result/error field. A same-ID envelope containing a correct expected result alongside an error can be accepted when `allowError` is true. A hand-authored response with HTTP 500, JSON-RPC 1.0 and both fields was independently accepted by `makeRawRpc`. Similar malformed successful envelopes can pass ordinary reads.

This violates Task 1's fail-closed malformed-transport requirement and can make the runner's evaluated gates green even though the independent auditor correctly refuses the packet. The latter prevents downstream evidence approval but does not repair the runner's own contract.

Smallest correction: retain the received parsed envelope, then require HTTP 200, JSON-RPC 2.0, matching ID, exactly one own result/error field, and a well-formed error object when allowed. Add hand-authored negative coverage for those cases. Do not weaken the independent auditor or frozen answers.

## Remaining source/spec and quality coverage

The six-contract graph, three deployers, native Actor prefix and untyped stable File match the amended seal. Mandatory MinBody96/Quote rules are registered without extra policy; the index is constructed and attached before prefix admission. Addresses, complete deployment hashes/lengths, setup calldata and Type IDs are compared to independent preparation. The late fault is the final market TAG binding only.

`buildA1` reads current realm/Core/protocol nonce/profile/index obligations at each fixed pre-block, constructs complete CREATE/PUBLISH/HEAD/FOLDER/TAG actions with uint32 CAS, and compares the resulting body, IDs, signature and full calldata against frozen independent bytes before submission. It cannot quietly adopt candidate-derived answers. Scale 7 recomputes the dependent Quote and HEAD; all three protocol nonces correctly start at zero on separate Ledgers.

All 69 main plus 19 auxiliary getters execute at both fixed bases in all three arms, including orphan posting word0, retained prefix and calibration state. Exact full errors are checked against both independent bytes and local ABI. Static/mined sender, destination, calldata and explicit 3m gas are linked; 15m deployment/8m setup bounds remain below the reviewed launcher ceiling. Refusal/calibration receipt statuses are distinct; post-state follows the mined receipt, with no snapshot restore.

The output directory must be new. Ordinary caught failures preserve accumulated raw envelopes and false evaluated gates; green gates are assigned only after all arms complete. Transport has request/receipt timeouts and 2048-envelope/8MiB retained-data caps, while the launcher owns the overall deadline. Full-suite, C parity and state-proof claims remain explicitly unverified. Four focused tests cover linkage, full error bytes, receipt classification and initial incomplete gates; root reports 46 total Node tests passing, not independently rerun here.

The reviewed offline auditor supplies stronger signed-byte/receipt/header checks than the runner itself; keep that independent packet gate mandatory. No other blocking source, semantic or whole-delta quality issue was found.

## Scoped follow-up — source `4345992`

Reviewed the entire `c995d90..4345992` correction and appended implementer report. The sole transport finding is **closed**. `validateRpcEnvelope` now requires HTTP 200, an object response, own JSON-RPC 2.0 and matching ID fields, and exactly one own result/error field. Allowed errors must have an integer code, string message and only the declared code/message/data fields; disallowed errors fail. `makeRawRpc` invokes this validator after bounding and retaining the parsed envelope, so malformed envelope diagnostics are no longer discarded merely because the ID check failed first.

The new hand-authored tests exercise valid null results and allowed errors, HTTP/version/ID mismatches, both/neither fields, an inherited rather than own result, disallowed errors, malformed error codes and unexpected error fields. Receipt polling's valid null result and ordinary literal Anvil refusal data remain supported. No setup, signature, expected-answer, gas, state-read or success-gate semantics changed. No new breakage was found in this scoped diff.

Root reports 47/47 Node tests passing, no skips/failures, and clean whitespace; no suite or chain was rerun in this follow-up.

**Final source/spec verdict: PASS. Final whole-delta quality verdict: PASS. No remaining source blocker to the root-owned finite run after exact source/input/launcher/auditor sealing and lease/resource preflight.** Independent packet validation remains mandatory; no mined rollback result has yet been established by this source review.
