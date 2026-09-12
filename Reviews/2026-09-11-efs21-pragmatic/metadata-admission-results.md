# Full-C0 metadata-only admission: paired results

September12,2026. Measured fresh-genesis prototype; independent source review approved, root reproduction/push still separate. No protocol adoption, native authority, initialization outlining, shared slab, Type codec or index change.

## Result

Complete Files create costs **5,738,536 →5,716,508 gas**, including149,369 for chunk staging; its seven-leaf metadata transaction is5,589,167 →5,567,139. Removing three unused payload copies saves22,028 gas on that complete create and **566,327 gas on a fresh occurrence of an existing8192-byte Record**. All-ACTIVE retry and all six representative paid public reads are exactly unchanged. This removes no persistent publication/index slots: complete create remains5.72M gas and near-limit dedup3.06M.

The actual admission library grows28 runtime bytes and its deployment costs6,096 more gas. Actual U3 remains24,536 runtime bytes, only40 below EIP-170. This is not new headroom for another module.

## Exact source and evidence

- Frozen full-row/Envelope control: `ed49a6c1c5bc70ffac392c7767c560d26c726c10` (prior Envelope measured source `a51633671b45071eb13adf9cbbbf17ab2501a33d`).
- Candidate Solidity and shared runner/support freeze: `137fa252a73e0f04a891109532a4eb6f346546f9`. Source committed before final receipts.
- StateKernel keccak: `0x26f6275978136b3f96e21b21ec51daa1f2c7c17378b465dff1f6b3736b4c613f`.
- StateStore keccak: `0xd644d79fbaf58eb46f5a95739a913607b18bd53f6216eb00282fd77f1de70974`.
- [Control full JSON, losslessly compressed](evidence/metadata-admission-control.json.gz), [control manifest](evidence/metadata-admission-control.manifest.json); [candidate full JSON, losslessly compressed](evidence/metadata-admission-candidate.json.gz), [candidate manifest](evidence/metadata-admission-candidate.manifest.json).
- Canonical decompressed control19,479,942 bytes, hash `0x1c204dabba29d755284c36b709695708a05c4214ef4e83dc3e285be7b838fe60`; candidate19,480,259 bytes, hash `0x40d74156dab9822112f82c0de28896d5f7037dd5f143807918c75b676dce953e`.
- Compressed control1,837,529 bytes, hash `0xd4d379632fb2e5ed8fc3de4cef49a91fa4acf198728c06e47fc95942b4c4cd99`; candidate1,837,564 bytes, hash `0x38730f8267ba26a4e466d269b863e1992973826e99ebf89e62fc5a365407f97a`. Deterministic gzip has no filename/time. Offline decoding checks both hashes/lengths, bounded to8MiB compressed/32MiB decompressed. No evidence fields discarded.

Two final serial fresh worlds retained119 transactions each, including every setup, claim, deployment and mined failure. Elapsed40.133s/40.825s; no latency claim. Four earlier finite rehearsals exercised startup, added workloads and evidence framing; they are scratch, not final measurements. Same runner, compiler0.8.30/optimizer200/viaIR/Cancun, operation plans, public helper external-child order and logical publication calldata. Signed outer calldata binds each arm's actual execution identity; signature/deadline bytes need not match. The table names every resulting calldata-intrinsic delta rather than assigning it to metadata reads.

## Every measured operation

Actual mined gas, not estimates. Δ is candidate minus control; Δintrinsic is the corresponding calldata-intrinsic difference. Subtract Δintrinsic from Δ for the receipt-minus-intrinsic comparison, not a pre-refund execution trace.

| Operation | Control gas | Candidate gas | Δgas | Δintrinsic |
|---|---:|---:|---:|---:|
| tag-first | 2,222,619 | 2,217,080 | -5,539 | 0 |
| tag-steady | 1,995,217 | 1,989,679 | -5,538 | 0 |
| binding-rebind | 1,735,729 | 1,725,723 | -10,006 | 0 |
| create-chunk-0 | 149,369 | 149,369 | 0 | 0 |
| create-7-leaf-41B | 5,589,167 | 5,567,139 | -22,028 | 0 |
| edit-chunk-0 | 149,381 | 149,381 | 0 | 0 |
| edit-3-leaf-41B | 2,827,399 | 2,810,891 | -16,508 | 0 |
| partial-direct-author | 955,556 | 944,659 | -10,897 | +12 |
| mixed-ACTIVE-fresh | 1,473,120 | 1,466,576 | -6,544 | 0 |
| exact-ACTIVE-retry | 643,851 | 643,851 | 0 | 0 |
| old-signature-rejected | 367,216 | 367,216 | 0 | 0 |
| multiple-Type-groups | 2,363,610 | 2,361,526 | -2,084 | 0 |
| existing-Types-fresh-envelope | 833,557 | 821,469 | -12,088 | +12 |
| maximum-Envelope-one-selected-existing-Record | 1,290,287 | 1,278,165 | -12,122 | 0 |
| metadata-bytes-Type-setup | 1,200,672 | 1,199,661 | -1,011 | +12 |
| fresh-Record-tiny | 862,186 | 861,167 | -1,019 | 0 |
| existing-Record-new-occurrence-tiny | 610,532 | 609,513 | -1,019 | 0 |
| fresh-Record-near8192 | 8,901,503 | 8,900,464 | -1,039 | +12 |
| existing-Record-new-occurrence-near8192 | 3,624,780 | 3,058,453 | -566,327 | 0 |
| metadata-reference-Types-setup | 2,552,346 | 2,551,311 | -1,035 | 0 |
| reference-existing-tiny | 1,055,450 | 1,053,406 | -2,044 | 0 |
| reference-existing-near8192 | 1,523,295 | 956,773 | -566,522 | -12 |
| reference-repeated-near8192 | 1,742,115 | 1,120,710 | -621,405 | +12 |
| reference-valid-Object | 1,007,570 | 996,668 | -10,902 | 0 |
| same-carriage-Record-reference | 1,252,433 | 1,249,348 | -3,085 | +12 |
| large-supported-Type-setup | 15,947,861 | 15,946,740 | -1,121 | +12 |
| Type-dependency-small | 1,371,786 | 1,365,650 | -6,136 | 0 |
| Type-dependency-large | 1,385,152 | 1,348,538 | -36,614 | 0 |
| same-carriage-Type-dependency | 2,045,323 | 2,039,972 | -5,351 | 0 |
| late-reference | 1,298,795 | 1,296,723 | -2,072 | 0 |
| cache-then-reference | 11,996,384 | 11,995,251 | -1,133 | -12 |
| cache-then-CAS | 11,985,918 | 11,984,808 | -1,110 | +12 |

Complete create, including its one chunk transaction:5,738,536 →5,716,508. Complete edit:2,976,780 →2,960,272. Chunk storage is unchanged and not hidden in setup. Legal near-limit bodies use a real admitted BYTES Type, not fabricated codec maxima. The supported large dependency is a legal60-field parser Type with23,424 cache bytes and4,100-byte group Record body; its15.95M setup remains close to the16,777,216 transaction cap. The64-field24,960-byte unsupported cache falsifier remains a rejection, not newly supported.

All119 transactions total236,171,275 →233,448,062 gas; this is a complete fixture bill, **not** a typical user-operation average. Maximum actual transaction gas15,947,861 →15,946,740. No tx/runtime/initcode/block cap was raised; full-C0 block cap remains33,554,432.

Every positive per-transaction regression in the retained sequence:

- UpgradeAdmissionLibrary: 4,440,710 → 4,446,806, +6,096 gas (496 intrinsic; 5600 remainder).
- PointReadLibrary: 3,143,069 → 3,143,081, +12 gas (12 intrinsic; 0 remainder).
- UpgradeableReadFixtureCore: 4,835,231 → 4,835,243, +12 gas (12 intrinsic; 0 remainder).
- AuthorityUpgrade.sol/UpgradeableFixtureCarrierU3 deployment: 2,252,951 → 2,252,963, +12 gas (12 intrinsic; 0 remainder).
- paid read consumer: 144,221 → 144,233, +12 gas (12 intrinsic; 0 remainder).

No measured operation row above regresses. Startup code deposit is separate from recurring savings.

## Paid public reads and qualified Files

| Paid actual-Core read | Control gas | Candidate gas | Return bytes |
|---|---:|---:|---:|
| Envelope-create | 179,627 | 179,627 | 672 |
| Occurrence-create | 212,367 | 212,367 | 192 |
| Record-create | 183,665 | 183,665 | 256 |
| Binding-create | 175,654 | 175,654 | 288 |
| Record-current-eight | 343,730 | 343,730 | 2,720 |
| Envelope-maximum | 182,876 | 182,876 | 2,496 |

Paid consumer constructor/runtime executable prefixes and lengths match; actual compiler metadata is retained and checked against the known51-byte CBOR extent. PreparationHelper's **entire** creation/runtime is byte-exact, not covered by that metadata-only exception. No new routed receipt-library surface was added; the earlier deferred scalar/repeated receipt-library gas gap remains unmeasured and these Core reads are not substitutes.

Qualified Files opens the actual updated directory and reaches COMPLETE at one pinned basis. Matched reader104 requests in each arm; observed414,934 →414,990 bytes (+56, the two hex characters per extra admission-library byte). No requests moved into unreported setup. All per-receipt Records/Occurrences/counts/Bindings/history/Lens values agree after authenticating each identity-bearing field before normalization. Complete final inventory agrees:97 Records,80 Envelopes,31 Types,1 Principal,105 Admissions,81 Batches,291 posting keys and22 Binding keys; all posting words retained. Actual Type/Envelope code, pointers, helper nonce and chronological children also match, including one deliberately unowned public helper child. Runtime hashes alone are not the transitive identity proof: source/compiler/artifacts, actual code/configuration and qualified readback are retained together.

Existing public selectors, callable tuples, constructors and events compare exactly for the actual U1/read/U3 Core, CarrierU3, UpgradeAdmissionLibrary, PointReadLibrary and FilesRouterV2 surfaces. All prior stored struct member types/order compare exactly from compiler AST; targeted physical-slot tests anchor Record/Type fields. No fresh compiler storage-layout output is claimed. No error ABI was added in these surfaces: Envelope already exposed ErrReadState. PreparationHelper18,953 bytes remains unchanged; UpgradeAdmissionLibrary20,289 →20,317; actual U3 runtime24,536 and complete init25,493 (25,365 template+128 constructor bytes).

## Failure boundary and verification

The new Record metadata check reads the slot-backed bytes header before ordinal/type decisions. Compiler malformed short/long headers still return Panic0x22. An impossible stored length8193 or huge now returns ErrReadState without copying: this8192 bound is **new**, not universal corruption equivalence. Equal100,000-gas staticcall probes show the old8193-byte copy exhausting the budget while the new check returns its explicit error; with sufficient gas the old full-row accessor still returns metadata. Valid-length fabricated payload bytes remain unauthenticated here as before. Incoming deduplicated bodies still undergo commitment and Type validation. All-ACTIVE retry bypasses these three sites as before.

Type dependency existence preserves null/STOP-only behavior and nonzero missing-code Panic0x11, even before a zero ordinal. This accessor does not validate STOP/hash/schema. Own-Type preparation, existing-group cache equality, active Withdrawal and public byte reads remain full-byte paths. Earlier-in-carriage Record/Type visibility, repeated references, duplicate selected RecordIds, wrong-Type/Object references, partial/mixed retry and reached late rollback remain tested. Compound helper-size/ref/CAS errors, author nonce, counts, helper CREATEs and all tentative state roll back.

- Actual payload-access RED: both new admission tests failed `stored Record payload read` on the exact full-row base; both green after the change. No missing-symbol RED substituted.
- Full Core233/233 across20 suites:217 prior +11 new unique tests +5 inherited StateKernel repeats. No existing assertion retargeted or removed. Historical15 journal-only tests remain excluded, not newly passed.
- Foundation29/29.
- Explicit37-file serial Node/Chromium gate250 total/249 pass/1 existing legal-large-Type skip,223.729s. All five actual browser journeys pass.
- Strict TypeScript, touched Forge formatting and diff checks pass.
- Old frozen Envelope offline replay7/7 passes unchanged.
- New final offline comparison9/9 passes. Independent review found that the initial paid Binding check could locate execution identity in the wrong return field. The forged wrong-field regression first failed with “Missing expected exception”; the post-measurement test now decodes the pinned ABI, checks the designated second return value and canonical tuple, and normalizes only that value. A target that happens to equal the execution ID remains untouched. No Solidity, runner, source pin or receipt changed and no new worlds were used for this fix.

The full Node count including both offline suites is265 passes plus1 existing skip (249+7+9); distinct from Forge counts. The source-freeze comparison initially had8 offline checks; the review hardening adds the ninth.

## Reproduction and cleanup

Run from the assigned worktree. Final output names are exclusive and refuse overwrite; use the retained offline test for replay. Fresh reruns need separately authorized new output names, never overwrite historical evidence.

```sh
node --test Reviews/2026-09-11-efs21-pragmatic/test/metadata-admission-comparison.test.mjs
node --test Reviews/2026-09-11-efs21-pragmatic/test/envelope-storage-comparison.test.mjs
node Reviews/2026-09-04-mvp-rehearsal/node_modules/typescript/bin/tsc --strict --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 Reviews/2026-09-09-files-reader/test/sample.ts
```

The exact source-freeze runner is [metadata-admission-benchmark.mjs](scripts/metadata-admission-benchmark.mjs). Full bounded gate commands and diagnosis are retained in the task's scratch implementer report. Independent source review approved; the root still owns final reproduction and push.

Both final Anvils exited normally (50702/51002), and their exact owned cache/build directories were removed and checked. The separately owned70MiB candidate gate build was removed; it is regenerable. Earlier default Forge output was a pre-existing build location, not broadly deleted. Only preserved Anvils9947/RPC49941,91971/RPC54148,65638/RPC60726 remain listening; HTTP49966/54154/60731 and their original PIDs remain alive. About282GiB free. No tracing, public chain, broad cleanup, production-repository change, demo migration or source change after final receipt freeze.
