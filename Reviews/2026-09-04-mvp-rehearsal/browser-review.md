# Browser and loopback safety review

**Date:** 2026-09-04

**Status:** targeted repair accepted; no Critical or Important finding remains
**Scope:** disposable `efs-lab/1` browser, game-launch coordinator and loopback
gateway only. This is not C0/M0, product, real-wallet, public-deployment,
accessibility-participant or production-security evidence.

## Findings and resolutions

1. **Important — a pending Play could mount after navigation or Stop.**
   Resolved by `createLaunchCoordinator`: each Play receives a generation,
   superseding Play/Stop/tab navigation/pagehide invalidates it, and the
   generation is checked after each asynchronous boundary and before mount.
   Focused tests cover cancellation during selection, supersession during byte
   loading, and a late rejected read.
2. **Important — the local UI could be framed while its own same-origin code
   retained mutation access.** Resolved with `frame-ancestors 'none'` and
   `X-Frame-Options: DENY`. The gateway still binds only `127.0.0.1`, requires
   exact Host and Origin for JSON POSTs, restricts read targets and mutation
   functions/channels, rejects value, and expires the local process.
3. **Minor — launch and session readiness trusted incomplete qualification.**
   Resolved for the authority-bearing/executable boundaries. Game selection
   and bytes must be qualified exact results at the same block hash, with the
   configured content identity and verified returned bytes. Session readiness
   requires the exact expected active grant and approval under a qualified
   exact result.
4. **Minor — a prior Saved label remained visible during a new operation.**
   Resolved by moving the global status to a non-success working state before
   grant setup, planning, approval and submission.

## Residual, non-blocking hardening

Ordinary text-file preview and typed-record decoding still gate directly on
`integrity=VERIFIED` rather than sharing the complete qualified-exact predicate
used for game launch. The current SDK produces coherent result combinations
and all rendered values use `textContent`, so this is not an executable-content
or injection finding in this lab. A later browser extraction should centralize
that predicate and add contradictory-result mutations before treating the UI
as an independently fail-closed consumer.

The game safety claim remains deliberately narrow: one configured, locally
seeded artifact whose exact bytes contain a deny-by-default CSP, launched only
after explicit Play into an opaque-origin `sandbox="allow-scripts"` iframe.
This does not establish that arbitrary verified HTML is safe, confer host or
wallet authority, or authorize a general app runtime.

## Verification ceiling

Source inspection confirms the repairs and their focused tests. The
coordinator reported seven real gateway negative tests green. This review did
not rerun the in-flight final browser workflow and makes no claim about its
result or the pending evidence-ledger reconciliation.
