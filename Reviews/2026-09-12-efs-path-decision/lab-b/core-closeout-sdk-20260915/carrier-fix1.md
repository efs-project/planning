# Read-set profile qualification — review fix 1

Fix input: `f1c4c8d64bc82f49c2870e532e29fa3596a2b3a4`. This SDK-only correction
addresses review P2, "Recognized legacy label bypasses the new runtime's
physical/support qualification." Independent re-review remains required.

## Qualification and compatibility boundary

After the existing exact-block execution and implementation-codehash checks,
the SDK always probes `readSetStorageProfile()` on the **active implementation**
address at the same canonical block hash, regardless of its manifest label or
the shared proxy ABI. A successful declaration must equal the expected profile
and namespace. The carrier profile also requires its fixed support identity and
actual support codehash. Missing metadata means an expected legacy profile; it
does not excuse a contradictory successful carrier declaration.

The legacy exception is deliberately narrow: expected legacy AND a tracked RPC
failure positively typed `rpcError.code === 3`, `rpcError.data === '0x'` from
that exact implementation. This represents the old binary's empty EVM revert
for its nonexistent selector. Bare messages, timeouts, other RPC codes, missing
or nonempty revert data, malformed successful bytes (including `undefined`),
and every declared-new probe failure refuse qualification. An explicit refusal
flag distinguishes the permitted revert from a malformed successful result.
This is RPC-observed evidence, not an authenticated storage or execution proof.

Per controller authorization, `browser/app.mjs` preserves the original RPC error
object as `rpcError` while preserving its existing message. This one-line
transport compatibility change adds no imports, UI features, bootstrap changes,
restart, deployment or stored-state mutation. It never manufactures EVM metadata
from untyped messages. The test executes the actual browser `rpc` function in an
isolated VM without running app bootstrap or accessing browser state.

This corrects the earlier note's shared-ABI statement: a shared ABI advertising
the getter does **not** require new-profile metadata on genuinely old entries in
a mixed family. Per-implementation runtime evidence decides instead.

## Focused RED/GREEN

- [Original regression RED](carrier-fix1-red.tap): exact new runtime relabeled
  recognized legacy/zero namespace with support metadata removed incorrectly
  qualified in declaration, unavailable and malformed-success controls.
- [Browser adapter RED](carrier-fix1-browser-red.tap): real transport discarded
  the typed error object while retaining only `execution reverted`.
- [Malformed-success RED](carrier-fix1-malformed-red.tap): the first local fix
  mistook a successful `undefined` response for the accepted legacy refusal.
  An explicit refusal flag fixes this without widening the exception.
- [Final focused covering run](carrier-fix1-covering.tap): **18 passed, 0 failed,
  0 skipped**, exit 0. Earlier intermediate green output is retained separately
  as `carrier-fix1-green.tap`, not substituted for this final result.

Command from the lab, using the already retained BASE/current artifacts and
existing Node/ethers/Anvil tooling (exact machine environment is in the task report):

```sh
node --test --test-concurrency=1 --test-name-pattern='read-set|legacy relabel|browser transport|actual old|populated proxy upgrades|offline guarded verifier|guarded source and archive|final six argument guarded ABI|signed never-admitted claim' browser/readset-profile.test.mjs browser/guarded-archive.test.mjs browser/guarded-integration.test.mjs
```

The pattern selected 9 top-level tests plus 9 nested refusal controls: 4 archive
checks, 1 existing populated same-block upgrade check, and 4 profile/transport
checks. No full Forge, 61-test repeat, rebuild, or paid matrix rerun occurred.

## Actual-old mixed-family evidence

[Bounded fixture packet](carrier-fix1-mixed.json.gz) SHA256:
`2634cdcb1188a9245f9d13b4671cbd2b1c38f734e0a383bab14ae12ffe515db6`.
It pins the exact modified SDK, browser adapter and test bytes by Keccak256,
retains complete old/mixed manifests, 22 transaction receipt summaries, the
actual typed legacy refusal, and four distinct old/new/downgrade/restore
execution-set hashes. The actual old proxy/implementations use artifacts from
`6869e2680d75521de851eaa67631cc05a1eb35a9`; current Ledger artifacts are unchanged
from the original Task3 candidate. Loopback PID 74113 / port 61627 used bounded
256-state / 512-transaction-block history and exited after the fixture.

The saved old manifest omits new metadata. It pins and publishes through the
actual browser transport. A mixed family with the **new shared ABI** still pins
the actual old implementation. After upgrading, it pins/publishes/exports with
the declared carrier implementation. On trusted downgrade, legacy bytes remain
available; carrier-only `readSetBytes` is `0x`, and current archive export refuses
with `ARCHIVE_READSET_MISSING` (UNKNOWN, not absence/no publication). Exact
historical reconciliation at the committed new execution is still
`EFFECTS_VERIFIED`. Restoring the new implementation recovers exactly the same
carrier bytes and archive preimage without migration. Offline bundle verification
retains `sourceAdmission: NOT_PROVEN`; this is not full old-binary codec support.

## Provenance and remaining limits

No Solidity, storage, artifact, gas policy, deployment helper, paid runner or
original paid packet changed. The original measured costs remain same-contract
evidence under their **original SDK source pins** at `6d54ee8`; they are not a
rerun or qualification of this corrected SDK. This packet supplies the changed
SDK's focused compatibility evidence. Original repeat/deployment tradeoffs,
450-byte Ledger margin, missing native storage-proof profile, endpoint/L2 fee
limits, and 11 independently reproduced pre-existing IncomingQuotes failures
remain unchanged. This correction makes no whole-prototype PASS claim.
