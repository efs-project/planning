# Independent finite-launcher review — 2026-09-13

Reviewed `/tmp/efs-b-controls-paid-20260913.00DzB4/launch.mjs` only, read-only. No launch, RPC, compiler, heavy run, or process mutation. Pins and lease are intentionally not yet present; this is a source-readiness review, not launch authorization.

**Verdict: bounded design is appropriate; correct the narrow emergency-cleanup paths below before launch.**

## Important — cleanup must survive logging/spawn failures

At line 44, `stop()` writes the launch record before sending SIGTERM or arranging SIGKILL. A record-write failure from a timer/signal callback throws outside the main async try/finally and can terminate the launcher while detached Anvil/runner groups survive. This is particularly undesirable in the disk-pressure shutdown path. Arrange termination and escalation regardless of record persistence; make emergency record writes best-effort with their error retained when possible.

At lines 38–43, a failed spawn is retained in `children` with no PID. Its error handler invokes `stop()`, and `process.kill(-undefined, ...)` throws instead of skipping the nonexistent group. Likewise, one unexpected kill error aborts the loop before later owned groups are processed. Filter for positive safe-integer PIDs; attempt every valid owned group and collect errors rather than allowing one child to interrupt cleanup. These are small lifecycle corrections, not a request for a new supervision framework.

## Minor — stopped-state evidence should match group ownership

Line 88 probes individual leader PIDs although termination targets process groups. It also probes immediately after SIGKILL, before exit is necessarily observed. Use a short bounded close/group-disappearance wait and probe the owned group IDs when recording the stronger “ownedProcessesStopped” claim. Also capture a final disk-check error at line 87 instead of allowing it to prevent the final cleanup record. The current immediate check can report a false failure; leader-only checks cannot independently establish group disappearance.

## Confirmed bounds and remaining preflight

The launcher requires Node 26, exact HEAD and clean tracked state, caller-provided file hashes, and no detected competing Forge/solc/Anvil. It requires a current lease no longer than 20 minutes; the watchdog is at most 12 minutes and reserves five seconds before lease end. It checks 50 GiB free reserve and a 15 GiB owned-scratch ceiling every three seconds. Anvil is fresh loopback-only, Cancun, 30M gas, chain 31337, bounded retained history, and run-local cache. Both processes use detached owned groups; normal completion attempts TERM then KILL. Logs are exclusive-created, RPC readiness is bounded, and writes are local to the selected run directory.

Before execution, review the actual pins to ensure expectations/artifacts/runner and launcher are covered and scratchRoots include this run/cache plus the designated compiler scratch. Recheck the finite lease and competing processes immediately before starting. None of those absent inputs is represented here as already verified; no rollback or paid-run claim follows from this review.

## Follow-up — first cleanup correction

Re-read the latest launcher. `stop()` now catches record-write failures and calls termination/escalation from `finally`: the logging-before-termination failure is **closed**. The same `kill()` still throws for a child with no PID or a non-ESRCH error, so that separate lifecycle correction remains open and can still prevent SIGKILL scheduling. The group-disappearance/final-record observation note also remains open. Source verdict is still conditional on the remaining narrow cleanup correction, not on any expanded framework.

## Final follow-up — remaining cleanup corrections

Re-read the updated complete source. `validPid` now filters failed-spawn entries, `kill` collects errors while continuing through every valid owned group, and cleanup performs up to thirty 100ms probes of process-group disappearance. Final disk errors are retained as failure/diskError instead of skipping the record. Both remaining notes are **closed**.

**Final launcher source verdict: PASS for the proposed finite local control run, conditional only on the still-pending actual pins, input/source readiness, explicit current lease and immediate resource preflight.** No launcher run was performed during review; no prepared packet or mined rollback outcome is approved by this verdict.
