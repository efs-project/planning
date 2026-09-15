# Guarded signed-claim portability — feasibility evidence

Disposable prototype, accepted base `9248feb0c2a241de97d7b6c5c3ed6482653f6e30`; no protocol adoption, public deployment or new import authority. Exact changed-source hashes, compiler input and artifacts are in `manifest.json`. Compressed evidence totals approximately 583 KiB, including actual raw signed fixture transactions and receipts (no private keys).

## Result

Cold reconstruction of five real guarded Directory/File/revision/tag/rename claims survives source shutdown. Source chain 31338 and destination chain 31337 have distinct Realm origins. A new process reconstructs signatures/actions and complete typed byte/reference closure from retained state; fetch-disabled offline processes verify the source bundle and archive re-export. An unrelated account retains the claims and another completes missing bodies without changing destination Ledger counts, nonces, source-publication entries or Heads. Current destination policy rejects recovered bytes until a separate authorized destination publication is accepted.

The chain archive retains signed headers, ordered actions, mandatory ReadSet/execution preimages and optional claim-local bodies. It does **not** retain a Type registry: archive-only export explicitly lists missing meaning closure/PARTIAL. The single portable bundle includes its independently retained Type descriptors, rule bytes and checked-reference closure; adding this inline closure makes the stated typed-byte bundle complete, not an authoritative source filesystem snapshot or state proof. The source bundle is 63,410 JSON bytes, including 30,663 bytes of closure sections. Its offchain availability cost is separate from archive gas.

`AUTHOR_SIGNATURE_VERIFIED` never means successful source guards/admission, currentness, authenticated historical code, native contract proof or destination write authority. Native/no-signature export and guarded Core import remain unsupported. The default packed alias and earlier representation comparison are unchanged; this experiment freshly deploys the code-vector candidate.

## Actual gas, under signed gasLimit 16,777,216

| Actions / reads | First, no bodies | Repeat, no bodies | Attach 8 KiB | Paid full preimages |
|---|---:|---:|---:|---:|
| 1 / empty | 857,139 | 49,087 | 5,899,529 | 59,927 |
| 1 / 64×4 | 4,217,897 | 1,321,929 | 5,899,529 | 72,459 |
| 64 / empty | 8,974,236 | 201,946 | 9,078,577 | 59,927 |
| 64 / 64×4 | 12,342,925 | 1,475,543 | 9,078,577 | 72,459 |

First-retention calldata: 1,412 / 11,780 / 19,556 / 29,924 bytes. First/last paid action reads: 36,981 / 36,993 gas. Fresh archive deployment: 2,350,812 gas separately.

The **48,292-byte final-ABI maximum** (64 actions, max ReadSet, 8,129-byte body + 63 distinct one-byte bodies) **reverts at the 16,777,216 gas cap**. No partial claim remains. Staging succeeds: **12,342,925 + 9,078,577 = 21,421,502 gas**, excluding once-per-archive deployment. No cap was raised. Maximal duplicate validation remains a separable inefficiency, not optimized here; storage-backed payload retention remains inherently expensive in this representation.

Runtime/initcode: code archive **10,611 / 11,007 bytes**; packed archive **10,709 / 11,105**; paid consumer **1,599 / 1,625**. Separate max action/read carriers are **18,497 / 10,593 runtime bytes**, each below 24,576. Exact STOP+ABI carrier bytes were read back. Solc0.8.30, via-IR, optimizer200, Cancun; normal runtime/initcode and 30M block caps.

## Evidence and rerun

- `source-bundle.json.gz`: self-contained portable signed-claim bundles with inline meaning closure.
- `cold-report.json.gz`: two-domain shutdown/authority results; `source-transactions.jsonl.gz` and `destination-transactions.jsonl.gz` preserve raw signed inputs and receipts.
- `cost-report.json.gz` and `cost-transactions.jsonl.gz`: receipt gas/calldata, cap failure, staged completion, exact carrier bytes/hashes, compiler-source hashes and bounded owned process metadata.
- `*.artifact.json.gz` and `compiler-input-*.json.gz`: exact current compilation records; source/artifact hashes and byte counts in `manifest.json`.
- `combined-archive.log.gz`: **23 passed, 0 failed** (6 guarded + 17 existing legacy tests). `green-cold-3.log.gz`: **4 passed, 0 failed**. Other compressed logs retain focused RED/GREEN controls and the final measurement output.

From the lab directory, using already installed ethers via `EFS_ETHERS_PATH`, existing forge/anvil, fresh scratch `FOUNDRY_OUT` / `FOUNDRY_CACHE_PATH`:

```sh
forge test --offline --match-contract '^(GuardedArchiveTest|SignedClaimArchiveTest)$' --build-info -vv
node --test browser/guarded-archive.test.mjs browser/guarded-archive.integration.test.mjs
node script/measure-guarded-archive.mjs
gzip -dc guarded-archive-20260914/source-bundle.json.gz | node script/guarded-archive-process.mjs verify
```

The measurement runner starts only a fresh bounded local fixture and closes it in `finally`. The clean offline verifier accepts bundle bytes only and disables fetch. The source exporter uses retained publication context/admissions, not a journal, fixture name map or latest digest/account-code classification. No optional archive UI or unrelated application test suite was added. Original protected demo processes and endpoints were left untouched.

Limit: COMPLETE describes the copied publish/reuse roots and declared checked-reference/type/rule closure. It is not proof of current Files selection, arbitrary historical rule execution, full source-tree/native bootstrap state, or uncopied external-carrier/key availability. Signature evidence and source/destination authority remain separate.

Final seal rechecked 17 source hashes and 22 compressed evidence hashes. Independent decoding audited 125 raw signed transactions (33 source, 45 destination, 47 cost) against their hashes, calldata, chain IDs, receipt gas and signed cap. The two expected reverted receipts were the policy rejection and maximum one-shot retention. A fresh offline read of the retained compressed bundle verified all five claims and typed closures.
