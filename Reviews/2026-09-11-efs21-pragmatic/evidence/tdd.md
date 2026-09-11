# Task 2 test-first evidence

Initial RED: `node --test test/client.test.mjs test/world.test.mjs` returned 3 failed assertions for missing requested client/world functions, before implementation.

Client GREEN: name/ID/endpoint guard tests passed 2/2.

World integration GREEN: real managed Anvil test passed after exposing and correcting asynchronous receipt availability and ethers Result's `entries` name collision (tuple array read by position). Assertions exercise independent record hashing, stale generation and observation rejection, deployment identity mismatch, producer/consumer, retained history, payload bounds, and cleanup.

Browser RED: `node --test test/browser.test.mjs` failed for missing static server before server/UI implementation. Final verification is recorded in the task report.

Further RED/GREEN: receipt-qualified COMMITTED assertions failed against MINED_UNVERIFIED before adding exact receipt-block effect verification; consumer-read estimate assertion failed before separately retaining the eth_call execution estimate. Browser caught a bytes-decoder argument error and editable-control race; both were corrected at their source and the full interaction loop passed. In the race, an in-flight open replaced text typed while its read was unfinished; controls now remain disabled until the observation completes.
