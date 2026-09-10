# Contract verification evidence — 2026-09-10

Disposable standalone lab, not C0/Files integration or protocol approval.

## Observed RED/GREEN sequence

- Initial compiled empty Core boundary: 7 tests failed, 0 passed. Failures were `type replacement`, `unauthorized/invalid plan accepted` (canonical shape and nonce/value cases), `missing receipt`, `forged author accepted`, and `missing raw evidence`. After minimal Core state/auth/shape/retry implementation: 7 passed.
- Rule stage: first run stopped at the unimplemented activation stub in setup; this is recorded as setup failure, not behavioral RED evidence. With the incomplete registration stub permitting fixture setup, 6 behavioral tests failed: direct hook spoof, accepted Outfit, new Equip/history, wrong-author/raw Equip, paid retry, and staged Outfit->Equip. Existing negative rollback cases already passed while ruled execution was refused; those were not counted as successful rollback evidence until real paid execution was enabled.
- Binding/security stage before implementation: 3 focused tests failed (`no code activation`, unavailable authenticated hook/read execution, unavailable historical receipt after hook). After bounded CALL/STATICCALL and binding comparison plus application logic, 42 test executions passed (20 distinct methods then; inheritance repeated several cases).
- Diagnostic RED: expected `HookRefused(uint256)` but received `Refused()`; final focused diagnostic test passes for hook item, funding, and malformed structure.
- Retained submitter RED: `original submitter absent`; final retry test preserves original submitter after another authorized relayer repeats the plan.
- Self-review corrected an intent-substitution test whose original call also violated executor constraints. The corrected test reaches the authorized executor and tests altered payload independently; every signed item/plan field and item order now has a negative case.
- Additional hardening/measurement tests were introduced after initial GREEN. They are regression evidence, not claimed as individually observed RED cycles. In particular the requested four-word Outfit prefix extension was added with the rule implementation, with its exact-Type/mandatory-rule regression added in self-review; this narrow slice did not follow strict test-first order.
- Removed inherited test repetitions: final suite has 33 distinct test methods, not 59 independent behaviors. The count includes one measurement/correctness test.

## Measurement interpretation

`testRepresentativeGasAndRetainedBodyBytes` measures function-call gas, excluding transaction intrinsic gas, deployment, and fixture setup. Calls share one transaction and some slots/addresses are warm. Numbers are local experimental evidence, not public deployment budgets. The warm receipt/body read is explicitly warm. Retained body bytes are 96 + 32 + 32 = 160, excluding receipt/mapping metadata.

Runtime sizes are optimizer 200, via IR, solc 0.8.30, Cancun. Solc compilation is warning-free. Forge's `block-timestamp` lint remains intentional: signed deadlines are evaluated against EVM block time, not a trusted wall clock; this is not randomness or precise external-time evidence. Authenticated exact retries after expiry only retrieve the earlier result and create no new acceptance.

## Fresh command output

Commands from the vault root:

```sh
forge test --root Reviews/2026-09-10-programmable-acceptance/contracts --offline -vv
forge build --root Reviews/2026-09-10-programmable-acceptance/contracts --offline --sizes
forge fmt --root Reviews/2026-09-10-programmable-acceptance/contracts --check
```

Exit code: 0.

```text
No files changed, compilation skipped

Ran 1 test for test/GasMeasurements.t.sol:GasMeasurementsTest
[PASS] testRepresentativeGasAndRetainedBodyBytes() (gas: 1336048)
Logs:
  Outfit execute: 451428
  Equip execute: 395583
  Paid claim execute: 479800
  Exact retry: 27518
  Warm receipt and body read: 5938
  Body bytes retained across three actions: 160

Suite result: ok. 1 passed; 0 failed; 0 skipped; finished in 1.32ms (491.12µs CPU time)

Ran 10 tests for test/HostileHooks.t.sol:HostileHooksTest
[PASS] testBoundedDiagnosticIdentifiesHookItemAndFundingShape() (gas: 209340)
[PASS] testCodeAndBindingRecheckedAtExecutionAndReadsStayHistorical() (gas: 1619860)
[PASS] testEveryCoreMutationLockedButAuthenticatedReadsAvailable() (gas: 3042729)
[PASS] testFalseRevertMalformedOversizedStaticMutationAndGasExhaustionRefused() (gas: 8073093)
[PASS] testForcedBalanceNeverBecomesAdmissionCredit() (gas: 549278)
[PASS] testFundingAndMalformedLateItemPreflight() (gas: 192039)
[PASS] testLaterHookObservesStagedCounterAndReceiptButNotOwnCandidate() (gas: 2012163)
[PASS] testMalformedBindingAndSemanticConfigSubstitutionRefused() (gas: 3699945)
[PASS] testNoCodeImpostorCodeWrongConfigAndWrongCoreActivationRefused() (gas: 2820458)
[PASS] testTreasuryReentryCannotMutateAndRejectionRollsBack() (gas: 1911552)
Suite result: ok. 10 passed; 0 failed; 0 skipped; finished in 1.88ms (2.14ms CPU time)

Ran 11 tests for test/ApplicationRules.t.sol:ApplicationRulesTest
[PASS] testCurrentPolicyAdministratorCannotBeSpoofed() (gas: 18872)
[PASS] testDirectHookCallerCannotConsumeRightsOrValidateForgedContext() (gas: 33545)
[PASS] testEquipRejectsWrongAuthorAndRawReference() (gas: 699543)
[PASS] testImportAndControllerUseSameMandatoryGate() (gas: 3062233)
[PASS] testLateFailureRollsBackAllEffectsAndSameBatchDuplicate() (gas: 1096072)
[PASS] testNewEquipChecksCurrentPolicyHistoryGrandfathered() (gas: 979330)
[PASS] testOutfitCompatibilityAndExactPayload() (gas: 642339)
[PASS] testOutfitV2KeepsMandatoryRuleAndDoesNotSilentlyBecomeV1() (gas: 859457)
[PASS] testPaidClaimRetryAndFreshActionCannotReuse() (gas: 683693)
[PASS] testPortableRuleDifferentLocalActivationsNoSquatting() (gas: 2676855)
[PASS] testStagedOutfitThenEquipAndReverseRejected() (gas: 869056)
Suite result: ok. 11 passed; 0 failed; 0 skipped; finished in 1.97ms (3.23ms CPU time)

Ran 11 tests for test/CoreBoundary.t.sol:CoreBoundaryTest
[PASS] testAdditiveTypeDoesNotReplaceOriginal() (gas: 115376)
[PASS] testCanonicalAddressAndBoolWordsRejected() (gas: 163780)
[PASS] testDirectExecutorConstraintAndForgedSignature() (gas: 146779)
[PASS] testDirectStoresExactReceiptAndRetry() (gas: 372598)
[PASS] testFiniteCapsAndExplicitNoRuleCannotBorrowActivation() (gas: 236092)
[PASS] testForgedAuthorRejected() (gas: 41290)
[PASS] testOriginalSubmitterRetainedAcrossAnotherRelayerRetry() (gas: 342524)
[PASS] testRawRelationDoesNotCreateAcceptance() (gas: 81506)
[PASS] testRelayBindsIntentExecutorChainAndCore() (gas: 2063698)
[PASS] testSignedOrderedItemsAndEveryIntentFieldBound() (gas: 892915)
[PASS] testStructureNonceExpiryAndFundingRejected() (gas: 214586)
Suite result: ok. 11 passed; 0 failed; 0 skipped; finished in 2.09ms (5.01ms CPU time)

Ran 4 test suites in 2.54ms (7.27ms CPU time): 33 tests passed, 0 failed, 0 skipped (33 total tests)
No files changed, compilation skipped

╭----------------+------------------+-------------------+--------------------+---------------------╮
| Contract       | Runtime Size (B) | Initcode Size (B) | Runtime Margin (B) | Initcode Margin (B) |
+==================================================================================================+
| AT             | 57               | 85                | 24,519             | 49,067              |
|----------------+------------------+-------------------+--------------------+---------------------|
| AcceptanceCore | 7,893            | 7,919             | 16,683             | 41,233              |
|----------------+------------------+-------------------+--------------------+---------------------|
| EquipRule      | 2,021            | 2,227             | 22,555             | 46,925              |
|----------------+------------------+-------------------+--------------------+---------------------|
| HostileHook    | 3,983            | 4,169             | 20,593             | 44,983              |
|----------------+------------------+-------------------+--------------------+---------------------|
| OutfitRule     | 875              | 1,011             | 23,701             | 48,141              |
|----------------+------------------+-------------------+--------------------+---------------------|
| PaidClaimRule  | 1,170            | 1,360             | 23,406             | 47,792              |
|----------------+------------------+-------------------+--------------------+---------------------|
| TestTreasury   | 495              | 654               | 24,081             | 48,498              |
╰----------------+------------------+-------------------+--------------------+---------------------╯

warning[block-timestamp]: usage of `block.timestamp` in a comparison may be manipulated by validators
    ╭▸ Reviews/2026-09-10-programmable-acceptance/contracts/src/AcceptanceCore.sol:111:89
    │
111 │         if (p.items.length == 0 || p.items.length > 8 || p.nonce != nonces[p.author] || block.timestamp > p.deadline) {
    │                                                                                         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    │
    ╰ help: https://book.getfoundry.sh/reference/forge/forge-lint#block-timestamp
```
