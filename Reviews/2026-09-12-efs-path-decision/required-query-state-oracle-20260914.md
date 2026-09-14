# Required-query state oracle — reviewed checkpoint

September14,2026 · disposable source/test evidence, not paid execution or protocol approval.

**Complete:** a transport-free oracle derives literal state observations for all three
frozen query arms. Source is committed at `7bd787bbf506981cfa164c7a3874ef80ac8717d6`
on the preserved B successor. No Solidity, deployed code, frozen input or old runner
changed. The [[required-query-paid-plan-20260914|shared paid runner]] is next.

The [oracle](../../../planning-warroom-b-run/Reviews/2026-09-12-efs-path-decision/lab-b/script/required-query-state.mjs)
emits exact call/address/ABI-result probes for initialization, current state and new
publication evidence. B preserves occurrence counts, author scopes, history and live
binding backlinks. C preserves full Store rows, Type admissions, unique-Record
postings, shared scope and its different nonce/evidence-basis conventions. Neither
uses candidate-returned Pages or booleans as expected state.

**Verification:** intended missing-module RED, then real missing-behavior failures;
final17/17 Node tests pass with no failures/skips. Root independently reran them
after review's narrow test improvement. Independent task review: spec PASS,
quality Approved, no blocking findings. Both minor findings are closed: complete
old/tail C list-byte goldens now check order/membership/ABI padding, and bounded
fixture Number arithmetic is explicitly distinguished from arbitrary uint64 or
gas/cost arithmetic. The oracle is not a general-purpose state verifier.

| Retained file | SHA256 |
| --- | --- |
| `required-query-state.mjs` | `cb65bcdebd3af86ba820decde9768ab2784cf72e60286975012059c5729d762c` |
| `required-query-state.test.mjs` | `9031f530d1d316c585e0250e53e17c42665f45c6c429d6285510b224a96e2c28` |

The input seal remains `077f59b735d2ddb3fbd9c3d432f306b0f919929b20e9a6d5402459790e96788c`.
Detailed worker/review/RED/GREEN reports are retained in the B successor's ignored
`.superpowers/sdd/required-query-paid-plan-20260914/` workspace, including the root
`task-1-root-p3-green.log`. Source formulas are in [[required-query-state-recipe-20260914]].

## What the next run will and will not measure

The exact oracle checkpoint schedule emits4100 probes, split Bscan1688,
Bselective946,C1466. Adding the currently planned transport/page/code/startup
observations gives about5411 envelopes with12 receipt polls per transaction.
That is a planning calculation, not observed traffic; the runner must enumerate
its complete actual schedule and enforce8192 envelopes/64MiB before launching.
These thousands of calls are **independent test-harness audit overhead**, not
the browser's discovery cost. Paid page gas and returned bytes are separate.

C still lacks an independent stored processed frontier and B-style binding-live
backlink counter; observed exact rows do not erase those schema differences.
The run is RPC-observed, not authenticated state proof. It will price the same
retained-Quote discovery result, not prove general index conformance, large-folder
scaling, full Files integration, native-author parity or production readiness.
No paid-query price or change to the frozen product cost table is claimed yet.
