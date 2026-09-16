# Query-origin RED/GREEN evidence

Starting source: `4c1098f3b13a36e057dd974d0351015e96f2b41e` (reviewed Resource1).
Compiler: Solidity 0.8.30, optimizer200, viaIR, Cancun; the existing assigned out/cache were used. No cap or warning configuration was changed.

Commands below run from the lab root with the assigned `FOUNDRY_OUT` and `FOUNDRY_CACHE_PATH` values. Full covering/amended outputs are retained beside this file.

## A4 unrelated-publication continuation

Changed the old expected-refusal audit into a progress requirement before implementation:

```sh
forge test --match-contract CoreReadCostAuditTest --match-test test_audit_unrelated_admission_preserves_contract_page_origin -vv
```

RED: `0 passed; 1 failed`; exact failure `unrelated admission must preserve paid continuation at origin` (fixture-inclusive gas 13,930,609). The selected folder inventory was unchanged; the old equality `A == C` refused the suffix.

GREEN after the guarded scope-version continuation and origin-qualified joins: same test passed, fixture-inclusive gas 14,660,370. The remaining literal `b` row was returned at the old origin; rebasing its continuation to current still refused.

## Owned accumulator

```sh
forge test --match-contract FilesQueryOriginTest --match-test test_query_owned_prefix_progress_and_reject_foreign_restart_suffix -vv
```

RED with the explicitly unimplemented consumer stub: `owned prefix not implemented` (fixture-inclusive gas 14,066,484).

GREEN after implementing its owner/session/query/continuation/cumulative-count/commitment state: successful two-step exhaustion plus foreign session/caller, appended suffix, and restart refusals. Later tests cover old-A empty starts, retained unknown rows, and current dependency checks after a historical negative completed.

## Separate retained-inventory profile

```sh
forge test --match-contract FilesRetainedQueryTest --match-test '^test_retained_' -vv
```

RED with a plain strict Lens subclass: `E_CURSOR()` after selected-folder overwrite/removal/new suffix (fixture-inclusive gas 17,480,023).

GREEN with historical placement/masks and an authenticated origin-length hash: origin rows survive selected-folder churn with fixed raw total and exact owned exhaustion (initial fixture-inclusive gas 17,699,191). This is a separate slower profile, not a weakening of the fast profile's folder-change refusal.

## Compile/test corrections, not semantic exceptions

- Adding origin arguments exposed a viaIR stack limit in the existing large page-row join. Extracting its diagnostic HEAD try/catch into a small private helper preserved both conflict and unavailable semantics; compilation then succeeded.
- First covering run: 168/169 passed. The one bytework fault-injection still targeted the old current resolver, so no fault reached the new historical join. Updating that fixture to `resolvePrincipalsAt` with the origin admission made the existing unknown-row assertion pass. No production unknown/absence rule was relaxed.
- Ordinary warnings remain visible in the full logs: existing `Keys.sol`/test shadowing, the existing directory test's mutability suggestion, and oversized test-harness initcode. These are not paid deployment sizes. The previous configured 5740 suppression was not changed.

All gas figures on this page are Foundry fixture-inclusive diagnostics, **not paid receipt costs**. Paid whole-transaction evidence is a separate packet.
