# Task 2 test-first evidence

Initial RED: `node --test test/client.test.mjs test/world.test.mjs` returned 3 failed assertions for missing requested client/world functions, before implementation.

Client GREEN: name/ID/endpoint guard tests passed 2/2.

World integration GREEN: real managed Anvil test passed after exposing and correcting asynchronous receipt availability and ethers Result's `entries` name collision (tuple array read by position). Assertions exercise independent record hashing, stale generation and observation rejection, deployment identity mismatch, producer/consumer, retained history, payload bounds, and cleanup.

Browser RED: `node --test test/browser.test.mjs` failed for missing static server before server/UI implementation. Final verification is recorded in the task report.

Further RED/GREEN: receipt-qualified COMMITTED assertions failed against MINED_UNVERIFIED before adding exact receipt-block effect verification; consumer-read estimate assertion failed before separately retaining the eth_call execution estimate. Browser caught a bytes-decoder argument error and editable-control race; both were corrected at their source and the full interaction loop passed. In the race, an in-flight open replaced text typed while its read was unfinished; controls now remain disabled until the observation completes.

## Review fixes

Transport RED: a real Anvil accepted a signed transaction, then the test dropped its submission response. The assertion for `SUBMISSION_UNKNOWN` with the locally computed signed hash failed against the original plain transport exception. GREEN additionally covers interrupted polling and receipt-known verification failure: the journal retains unknown/known gas appropriately, all new writes are held, and read-only reconciliation reaches COMMITTED at the exact receipt block with no resend or nonce increase. Restoring the journal in a new client preserves the hold.

Navigation RED: after a failed folder navigation, the mutation-control-disabled assertion failed (`false !== true`). GREEN verifies that even a directly invoked create handler cannot write the previous folder, explicit reload restores the correct target, manual hash navigation changes the actual target, and a hash change during a paused read cannot publish or reuse the stale parent. Browser lost-response tests also verify unknown totals, persistence across page reload, and the reconciliation button.

Final review-fix suite: `node --test test/*.test.mjs` — 6 passed, 0 failed. Retained benchmark JSONs were not regenerated for these support-source changes; they remain the explicitly labelled prior checkpoint.
