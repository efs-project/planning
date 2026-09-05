# Execution-budget comparison

**Status:** bounded laboratory mechanism experiment; not the C0 grant codec or
authorization implementation. No arbitrary validator or external executor is
being added to EFS.

The [existing engineering recommendation](../../2026-09-04-mvp-rehearsal/engineering-inputs.md)
asks whether a session's gas budget should use an explicitly bounded subcall or
an entry/exit meter. This small experiment compares both around the same fixed
semantic mutation plus Core-only carrier write.

## Experiment contract

One controller is the only ordinary caller. The stipend arm reserves its full
declared child-frame allowance from an aggregate grant-like counter, then calls
its own fixed, self-only mutation function with that allowance. It never calls
an arbitrary address or accepts an arbitrary function selector. The measured
arm measures the work region and adds an explicit conservative accounting-tail
allowance for its pinned build. Both atomically consume nonce/budget, update
semantic state and write bytes, or revert all of them. All entry points reject
native value. The carrier has no independent writer.

Tests will deliberately make the child run out of gas, fail after a carrier
write, exhaust the aggregate budget, and call the self-only entry directly.
They compare actual consumed outer-call gas with the charged amount, retaining
the excluded cost instead of pretending either field caps a user's fee.
The exact compiler/fork and small payload range are part of the experiment.

## Boundaries

- Neither budget covers intrinsic transaction gas, calldata charges, a wallet,
  bundler, relayer, gas price, L1 data fees or a whole transaction.
- A subcall's supplied limit is an upper bound, not proof it received that much
  gas: EIP-150 can reduce forwarding. A failed call is execution failure, not a
  diagnosis that the signed budget was inadequate.
- Refunds do not replenish `gasleft()` inside the work region. Receipt gas and
  measured execution gas therefore have different meanings.
- The measured tail allowance is a pinned-build engineering parameter, not a
  proof under every future compiler/fork. Any recommendation must carry this
  qualification and include cold/warm and rollback evidence.
- This controller is not a session-authority model. Actual C0 grant signature,
  historical authority, nonce lanes and finite Route membership remain separate.

Sources: [EIP-150 call forwarding](https://eips.ethereum.org/EIPS/eip-150),
[EIP-2200 storage metering/refund counter](https://eips.ethereum.org/EIPS/eip-2200),
and the source-pinned local EFS engineering inputs above.

## Run

From this directory, use the installed native Solidity 0.8.30 compiler:

```sh
forge test --use "$EFS_LAB_SOLC" -vv
```

Then run `node --test measure.test.mjs` (reuses the prior rehearsal's installed
dependencies and loopback Anvil lifecycle). No external RPC or signing key is
accepted by this measurement harness.

## Executed result — 2026-09-05

Nine Solidity tests, including 128 bounded payload fuzz cases, and three Node
tests against separate local transactions pass. The initial inert API skeleton
failed all nine behavioral tests before implementation: missing atomic budget
consumption, missing retained bytes, permitted bypass, missing rollback, and
missing measured charge. The implementation then passed those same tests.

The transaction tests exercise separate transactions rather than relying only
on contracts created and called inside one Foundry test transaction. Both paths
produce the same retained bytes and semantic head. Foreign callers, nonzero
native value, oversized inputs, underfunded outer calls, child out-of-gas,
measured excess and failure after carrier storage produce no committed effect.

| First write, bytes | Stipend allowance charged | Stipend transaction gas | Metered charge | Metered transaction gas |
|---|---:|---:|---:|---:|
| 0 | 2,000,000 | 78,969 | 77,771 | 78,033 |
| 32 | 2,000,000 | 121,686 | 119,958 | 120,744 |
| 256 | 2,000,000 | 280,761 | 275,407 | 279,777 |
| 1,024 | 2,000,000 | 826,169 | 808,380 | 825,038 |

These deliberately loose reservations expose the tradeoff, not a recommended
default allowance. Repeating the same 1,024-byte content in a new transaction
charged 114,791 in the metered arm (131,449 transaction gas), versus the same
2,000,000 reservation in the stipend arm (132,580 transaction gas). Transaction
gas is visibly not equal to the charge; neither is a currency-denominated fee.

**Recommendation for the next real C0 slice:** name and version the operation
frame first. Start with a signed per-operation frame allowance and conservative
aggregate reservation if simplicity and independent historical budget replay
are the priorities. Bring authorization, nonce/budget consumption, carrier and
semantic work inside the named frame; this probe's outer reservation is not
already that complete implementation. A successful-operation meter is more
efficient, but the accounting tail and reproducible historical metering evidence
must earn inclusion. Do not turn the measured `25,000` tail allowance into a
permanent constant or describe this probe as full C0 gas-grant conformance.
