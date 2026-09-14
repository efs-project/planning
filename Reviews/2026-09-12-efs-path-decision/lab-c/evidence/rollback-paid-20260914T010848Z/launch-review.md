# Independent C launch/seal review — 2026-09-14

Reviewed only `/tmp/efs-c-controls-paid-20260914.MCwNJk/{launch.mjs,seal-pins.mjs}` and root's preparation-review boundary. Read-only; neither script was executed, no chain/RPC/compiler/Git mutation occurred.

**Verdict: bounded launch/seal design passes, subject to one small environment correction and the pending actual source/input/lease gates.** This is not launch authorization or a result claim.

## Narrow correction — child secret environment

`launch.mjs:35` defaults child environment to `process.env`; the Anvil call at line 77 uses that default. Only the runner's separately constructed environment at lines 90–91 strips `PRIVATE_KEY`, `PK_A` and `RUN_MNEMONIC`. Thus the requested “no inherited private keys” condition is not literally met for Anvil, even though the reviewed runner uses public deterministic test keys and does not consume those variables.

Construct the child environment once and pass it to both processes. A small environment allowlist gives the strongest simple guarantee against unknown secret-variable names; at minimum remove the same explicit secret-bearing variables for both children and avoid claiming broader sanitization. No secret values were inspected during this review.

## Confirmed safeguards

The seal requires the exact current clean tracked HEAD supplied by root, the frozen expectation SHA `2e3c9887a3ed933fccfa2cf4854775b029d045c376628a1cacad68463d70931e`, and every expected source/artifact SHA. It checks all artifact compiler settings: Solidity 0.8.30+commit.73712a01, Cancun, viaIR, optimizer enabled/200. It additionally pins preparation/runtime/audit/tests/details, runner/tests, launcher/sealer, foundry config and review reports. `pins.json` is exclusive-created; this does not overwrite a previous seal. Root's independent preparation/provenance review remains required, not inferred from hashing alone.

Launcher rechecks HEAD, tracked cleanliness and all sealed files before spawning. It rejects absent/expired lease inputs and competing detected Anvil/Forge/solc processes. The lease is at most 20 minutes; the watchdog is at most 12 minutes and begins shutdown five seconds before lease end. No prior B lease is embedded or reused.

Anvil is a new loopback-only chain 31337, Cancun, 30M gas, genesis timestamp 1800000000, prune-history 256 and C-run-owned cache. No compiler or persistent state restore is invoked. The selected scratch inventory includes this run/cache, independent C preparation and the retained compiler/control scratch; preflight and three-second checks enforce 15 GiB total owned scratch and 50 GiB free reserve.

Owned detached groups retain the reviewed B corrections: valid-PID filtering, per-group kill-error collection, log-failure-independent TERM/KILL, bounded group-disappearance checks, and retained final disk errors. Logs are exclusive-created. Normal completion and caught failure both clean up owned groups; inability to establish termination fails the launcher.

Before any run, root must close the C runner source finding, verify candidate/manifest compatibility and independent auditor readiness, seal the resulting exact versions, and supply a fresh current lease/resource preflight. Root's preparation review also requires a later packet supplement for report-summary reconciliation. No rollback, normalized price, portable-proof or full-Files claim follows from this source check.

## Scoped follow-up — correction closed

Re-read the corrected launcher: lines 75–77 construct one environment, remove `PRIVATE_KEY`, `PK_A` and `RUN_MNEMONIC`, and pass it explicitly to Anvil; the runner receives that same environment. This closes the concrete inconsistent-inheritance finding. Neither invocation supplies a private mnemonic/key override; the fixture uses public deterministic accounts. This is verification of those explicit variables and invocations, not an audit of every possible secret-bearing variable in the parent's environment.

Also inspected the sealer's added inventory line: it hashes `supplemental-check.mjs` and `supplemental-check.test.mjs`, without changing expectations or execution. Root owns their separate content review.

**Final launch/seal verdict: PASS for the bounded source gate; no remaining launcher blocker.** Fresh lease, exact final source seal and other pre-chain gates remain required. Reviewed SHA-256: `launch.mjs` = `af09d26a7b3c7f93508b8264d86d2aa5a706f98d1c53bf68dd5c4e3fa52f228b`; `seal-pins.mjs` = `a9832bffe1d63d78a6713ea1330a81278ad8d41989d30c5e81e50dc6ce7f06cb`. Neither script was run.
