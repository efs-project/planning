# Root independent review — C physical control inputs

Reviewed prepare.mjs, runtime.mjs, audit.mjs, preparation.test.mjs and assumptions against the C source/Store physical map and shared sealed fixture. No candidate output supplied expectations. Source/packing review began September13 and completed September14 before a chain launch.

PASS for finite execution preparation. Fresh root run: 18/18 tests, no skips; default generator stdout SHA256 reproduces 2e3c9887a3ed933fccfa2cf4854775b029d045c376628a1cacad68463d70931e. All six artifacts independently assert optimizer enabled/200, Solidity0.8.30+commit.73712a01, Cancun, viaIR. Generator verifies every transitive metadata source keccak; source and artifact SHA pins will be sealed again at launch. The full linked-runtime adapter substitutes only exact reviewed reference/immutable spans, no masking.

Reviewed inventory: 59 Store rows,45 metadata and22 identity/coverage reads per state;126 logical and261 physical observations per arm-state. Evidence is325 static bytes/11 words with no dynamic field. Quote is288 bytes/9 words. S0 prefixes occupy admissions1–6; successful A1 occupies7–11. Retained evidence bases0/6 differ from execution blocks. Zero logical lengths do not drop prescribed hidden backing words. Mandatory coverage getters plus actual postings are both inspected.

Auditor derives signed transaction/receipt/header/runtime and fixed-block observation checks independently from the raw packet, not gates. Three arms require27 transactions,18 deployments,28 headers and2322 exact observations. Expected full errors and static/mined calldata/sender/gas are joined. This is RPC-observed state consistency, not authenticated chain proof or feature parity.

Nonblocking reporting qualification: the auditor checks actual transaction gas and evidence but does not reconcile every summary field (report.gas, source path/hash metadata, raw stats, chain summary and gate booleans). Root must supplement these checks before citing those summaries; never use the report tables as authoritative without receipt reconciliation. No calibration or product cost is repriced by this control. Actual packet audit remains unrun; this review authorizes neither a heavy lease nor a passing result.

## Pre-run supplementary summary review, 01:08 UTC

Root read the complete new supplemental checker and tests. The checker invokes the unchanged frozen auditor after verifying all sealed files, six exact artifact roles/metadata/source hashes and runner bytes at the sealed Git commit. It then joins all27 summary gas entries to receipts and checks source/chain/raw-accounting/gate fields. Synthetic helpers explicitly claim no evidence PASS.

Root found an honest-run startup bug: the first draft assumed only one block-number and one nonce observation for the whole run. The same author corrected this using the unique startup gas-price request as an ordering boundary, with no reliance on human labels. Root re-read the fix and fresh-ran60 passing source tests,1 intentionally skipped actual-packet test; three startup regressions had independently observed intended RED before correction. All initial blocks/accounts/nonces must precede this boundary and sends follow it. Later transaction reads cannot stand in for initial freshness.

PASS for the bounded pre-run supplement. Reviewed checkerSHA2567ce24f93221627a41c23f7b01da2663c9964f4a9929eb927720f1081d95c2031 and tests42346984adaabd68f757d6bfa4a11de65984a3d291669bbcd19c62ac143e7bb4. Frozen expectations and frozen auditor are unchanged. Run the actual packet test and summary mutants after mined evidence exists; no raw-state-proof or product-price claim is added.
