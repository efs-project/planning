# C paid-run gate: independent bounded source review

Verdict: **GO for ONE bounded disposable positive paid run through the root-owned launcher.** No blocking source finding for that exact scope. This is source/readiness review, not a claim that the chain run has passed.

Reviewed `e5d7568..58dd3d78e8efa8e4490b035bdde5502b75adc9e3`, the extracted brief/report, and focused replay/refusal context. Live HEAD matches that revision; tracked status is clean; `git diff e5d7568..58dd3d7 --check` passes. No compilation, Anvil, RPC, suite rerun, source/index/HEAD mutation, or input rederivation performed. Root's fresh 83/0 Node result is supplied evidence, not a test run by this reviewer.

## Nonblocking findings

1. **P2 — standalone runner validates loopback only after deployment.** `Reviews/2026-09-12-efs-path-decision/lab-c/script/measure.mjs:302` begins the deployment/attach sequence, whereas URL enforcement is only at `script/paid-controller.mjs:134`, reached by the later beforeFixture child. A standalone invocation pointed at remote Anvil could therefore send deployment transactions before refusal. Move the same URL preflight before the runner's first RPC before reusing this outside the current lease. Not blocking this run: root states its separately reviewed launcher creates owned Anvil on a fresh `127.0.0.1` port, overwrites RPC_URL, and verifies chain 31337 before invoking the runner. That launcher statement is not independently re-reviewed here.

2. **P3 — watchdog refusal can lose the child's partial read transcript.** `script/paid-controller.mjs:161` accumulates requests/checks only in memory and writes them at lines 202/206; `script/controller-gate.mjs:124` uses SIGKILL at the watchdog bound. A timeout therefore retains parent context/exit/stdout/stderr but may lose all completed RPC reads and the in-flight request. If full failure forensics are required, retain an exclusive append-only journal during reads. This cannot admit paid work or create a false ACK; it is not blocking a positive run.

## Load-bearing checks satisfied

- Optional-all-or-none pins and exact gated cell selection reject before provider RPC; both processes separately validate tracked source identity and pinned input/source/artifact/neutral bytes. Independent input bytes freshly hash to `16739ae05cb8a77c16b4c0edc9b5acd3a4b9b5074510a1d6d69c42aeed3f335c`; sourceRevision remains `2ca7349e5d683c3ff10651c0fc106c10da946145`.
- beforeFixture gates the seven-action BOOTSTRAP after deployment/attach; afterB1 immediately follows the existing seal object before seal placement/no-B diagnostics and paid calls. Stage ordering, exclusive files, child nonzero/timeout/refusal, and exact context-byte/run/source/input/block ACK bindings fail closed.
- The separately spawned controller reads only the allowed chain/header/code/call methods; all block-dependent reads use the exact numeric block. It checks eight runtime commitments, 11 identity reads, two basis reads and all 50 raw reads against sealed stage expectations, then rechecks the header. No candidate-derived expectations or masks are introduced.
- BOOTSTRAP/A1/A2/B1 and all four paid transactions compare local target/caller/calldata and then send the manifest target/calldata with the checked signer. Public A signatures are used without constructing A's signing wallet in gated mode.
- Paid replay uses retained transaction input and caller at the receipt block. Independent exact return/event-kind/event-data comparisons fail closed; candidate-side PaidObserved parsing/recomputation stays separately labelled, and candidate mismatch ultimately fails the run. Seal restores, transaction ordering and retention remain enforced.

Keep the run exclusively owned, with fresh evidence/gate paths, the reviewed source/controller/input pins, and the approved artifacts. Any mismatch is refusal: do not alter the independent input to make it pass. Successful output may establish only the stated **RPC_OBSERVED disposable-run** evidence, not production readiness, historical proof, or hermetic dependency provenance. Actual chain integration is the next gate, not a circular blocker to attempting it.
