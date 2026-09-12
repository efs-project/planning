# Shared Record/Envelope byte blocks — measured full-C0 prototype

Complete 41-byte file create is **5,257,364 gas including 149,369 staging**, versus 5,716,814 for the matched control: 459,450 lower (8.04%). Metadata alone is 5,107,995 versus 5,567,445. All seven Files facts remain. This is a physical-storage experiment, not protocol adoption, migration compatibility or full-model simplification.

Source/support freeze: `987a7bfa986f8e38b27cfa90c99b0af4a7640c04`. Exact control: `8688d5299eac8d9f83264806c32de471f427bbb2`; both arms include the preceding metadata-only and initializer changes. Runner keccak: `0x1058c2e93fe90d48e3d91e548c2ce8ed0b84ffd1fd80e97d2398265cb9528c2b`. Source review approved; final evidence review/root reproduction remain separate gates.

## Complete operations and negative results

Matched serial fresh worlds each retain 39 named operations, 129 signed/mined transactions and 9 paid reads. Gas is actual receipt gas, including ordinary authorization, validation, effects and transaction calldata; small signature-byte differences are not normalized away. Both use the same source-pinned SDK/support. Setup is not hidden inside action prices.

| Operation | Control gas | Shared gas | Delta |
|---|---:|---:|---:|
| Complete create,41bytes |5,716,814|5,257,364|−459,450|
| Complete edit,41bytes |2,960,445|2,758,979|−201,466|
|create-7-leaf-empty-file|5,574,838|5,116,407|-458,431|
|tag-first|2,217,213|2,096,182|-121,031|
|tag-steady|1,989,824|1,868,793|-121,031|
|binding-rebind|1,725,844|1,623,022|-102,822|
|partial-direct-author|944,730|918,569|-26,161|
|mixed-ACTIVE-fresh|1,449,609|1,396,057|-53,552|
|exact-ACTIVE-retry|643,984|632,900|-11,084|
|existing-Types-fresh-envelope|821,623|827,417|+5,794|
|maximum-Envelope-one-selected-existing-Record|1,278,319|1,283,650|+5,331|
|fresh-Record-tiny|861,250|863,715|+2,465|
|fresh-Record-near8192|8,900,547|4,864,176|-4,036,371|
|fresh-Record-zero-near8192|3,744,867|4,782,996|+1,038,129|
|existing-Record-new-occurrence-near8192|3,058,536|3,064,342|+5,806|
|64-duplicate-selected|10,175,220|10,351,525|+176,305|
|64-unique-ascending-RecordIds|16,264,936|16,264,936|0|
|64-unique-reverse-RecordIds|16,264,936|16,264,936|0|
|large-supported-Type-setup|15,946,879|13,926,689|-2,020,190|
|late-reference|1,314,741|1,304,413|-10,328|
|late-CAS|1,710,923|1,584,688|-126,235|
|cache-then-reference|11,995,476|9,837,228|-2,158,248|
|cache-then-CAS|11,985,009|9,827,852|-2,157,157|

The64-unique cases are **refusals**, not successful throughput or equal implementation cost: both use the unchanged16,777,216 transaction cap, consume16,264,936 and return empty revert bytes on same-basis replay. Counts, helper nonce/code, Records, Envelope, postings and authorization remain unchanged. Selected leaf indices stay ascending; the RecordIds are ascending/reverse workloads. The64-duplicate case succeeds and creates one Record with64 distinct admissions, but costs176,305 more.

Dense body8192 is a legal2-byte length plus8190 nonzero bytes; zero-heavy is the same length prefix plus8190zero bytes. Tiny is a2-byte logical body, not a physical empty Record. Zero-heavy writes regress1,038,129gas; tiny and already-existing-Record/new-Envelope operations also regress. Empty user files keep seven ordinary nonempty metadata/content encodings and need no chunk-staging transaction. Physical present-empty/STOP-only Records are synthetic storage tests, not a new legal empty-body Type.

The large supported Type still uses the existing uncompressed helper cache. Its lower admission cost comes from storing its group Record differently; the known oversized Type-cache refusal remains. Late-reference and late-CAS actually reach later failures after shared allocation and preceding facts. The two cache-first cases retain the existing HelperDeploy-before-later-error distinction and rollback; no raised cap or compression is bundled.

## Paid ordinary-contract reads

The existing UpgradeStaticConsumer performs real transaction-paid calls through actual Core APIs. Tuple bytes agree, including order/duplicates in the eight-Record batch; execution identity fields are verified before normalization. The known wrong-field Binding forgery remains refused.

| Read | Control gas | Shared gas | Delta |
|---|---:|---:|---:|
|Envelope-create|179,632|184,340|+4,708|
|Occurrence-create|212,389|216,934|+4,545|
|Record-create|183,670|178,256|-5,414|
|Type-Object|235,895|212,350|-23,545|
|Binding-create|175,658|175,658|0|
|Record-current-eight|343,737|293,455|-50,282|
|Envelope-maximum|182,881|187,593|+4,712|
|Record-tiny|173,874|178,095|+4,221|
|Record-near8192|824,285|194,042|-630,243|

Shared code accounts change cold/warm access costs; no isolated per-Record saving is inferred from the batch. Envelope/occurrence/tiny reads regress, Binding head is unchanged, and the dense8192-byte scalar improves630,243gas. Qualified Files browsing seals COMPLETE in both arms:114requests each,418,570 versus425,424 JSON bytes. The6,854-byte increase matches the larger qualified runtime graph, not extra RPC count. There is no routed-Core receipt API; receipt-library correctness remains covered, but scalar/repeated receipt-library pricing is explicitly unmeasured.

## Runtime, deployment and retained physical facts

| Actual module | Control bytes | Shared bytes | Runtime margin |
|---|---:|---:|---:|
|UpgradeableFixtureCoreU3|23,619|24,141|435|
|UpgradeAdmissionLibrary|21,635|22,392|2,184|
|PointReadLibrary|14,287|15,092|9,484|
|UpgradeQueryReadLibrary|20,259|20,558|4,018|
|PreparationHelper|18,953|18,953|5,623|

Actual U3 initcode template24,984bytes also fits49,152 including constructor data. U1/U2 read-Core runtimes grow522bytes each. Top-level deployment receipts total45,821,288 versus46,562,780 (+741,492); U3 alone5,199,845→5,312,869. Atomic bootstrap is2,337,485 in both. The entire fixture/setup remainder—including publications, consumer deployment and public helper exercise—is140,811,505→134,704,739; this is not a pure deployment saving. Whole fresh-world totals, including all successes/refusals/setup/reads, are289,298,331→271,018,856 across many transactions, not a single-operation price.

RecordCell is exactly96bytes: full TypeId, one address160/offset16/length16/extent16 word with48reserved-zero bits, and the unchanged two uint64 ordinals. EnvelopeCell is exactly32bytes with uint48 ordinal at byte26, widened to the existing logical ABI. Valid ordinal range is1…2^48−2. Record/Envelope/Type mapping roots remain12/13/14. Logical rows and callable/event ABIs agree; only the physical Record and Envelope declarations differ. No new deployed library address or execution-set field is added: ImmutableByteView is inlined in the existing source-pinned graph.

Final inventories agree exactly:107Records,84Envelopes,32Types,1Principal,178admissions,85batches,318posting keys,25Binding keys. Actual chronological helper children are32Type caches+84Envelope blocks+1external child in control, versus32Type caches+85shared blocks+1external child in candidate. The extra records-only partial block is intentional; helper nonce118→119. Retained byte-block code totals29,300→66,849bytes because Record payload moves from slots to code. Existing Record pointers/provenance never rewrite, and every shared allocation is gap-free with exact retained slices. Type/helper/Record identities are not inferred from nonce or ordinal.

Bounds/STOP/exact extent/subrange checks precede copying; unaligned Type-member parsing, live eighth-row corruption, absent residue, reserved/ordinal/offset/code faults and records-only wrong/empty helper refusal are exercised. Scalar Record shape checks do not become universal content authentication: a contained/same-size swap can remain readable, while Binding reads still rehash and refuse it. Metadata reads do not copy payload; abandoned dynamic-slot checks are labelled as such rather than treated as EXTCODECOPY proof. Counts/bootstrap commit last, and existing provisional-prefix/reentrancy limitations remain explicit.

Helper runtime and creation stay byte-exact; runtime hash `0x3aceb11ff3107036c738861eff80086447d69199e43cd0578fec68a2c5c8672b`. Actual candidate U3 hash `0x9e86d9e78f580a36e777b708f812d6ef535d52b3f2bf23f5da5387ba0e27e512`; candidate execution-set ID `0x3d1f77b336ec1a8322b3d53c9f6feac61941f0ba17f73a54d9054f9b8551658b`. Source-backed qualification still checks proxy slots, history, configuration, ownership and current dependencies at one basis—not just a self-reported implementation or runtime hash. The candidate actually refuses the frozen old Point reader profile before Files reads. Its frozen router-root template has identical executable bytes to the matched control's foundation-root Point template but different compiler metadata; full hashes are not conflated.

## Verification and evidence

Real sharing RED failed the exact-block assertion after successful admission, then GREEN. Final full gates:245Core/38foundation;249explicit serial Node/browser passes plus1existing Type skip;42offline checks; strict TypeScript and exact-path Forge format pass.233Core baseline grows by5new Shared tests+5inherited executions+1unaligned Type-member test+1metadata-copy-cost test.37foundation grows by1live eighth-reference batch test. Existing malformed/current-path assertions are retargeted, not moved onto old control deployments. The unchanged27historical offline checks plus3control/layout and12paired checks give291Node/offline passes in total, with the same existing skip.

[Source/artifact control](evidence/shared-block-control-sources.json) retains ten templates and full source closure, with bounded authenticated gzip. [Actual compiler layout](evidence/shared-block-candidate-layout.json) retains source pins and slot offsets. Old evidence is untouched. Final receipt files are exclusive, deterministic-header gzip; canonical decompressed JSON and compressed bytes have independent length/keccak checks and bounded offline decoding. Code bytes are retained once per child inventory, referenced by every slice, not silently dropped.

| Arm | Canonical JSON bytes / keccak | Gzip bytes / keccak |
|---|---|---|
|control|23,545,783 / `0xf73fb23b85d65d2539609e634b6f143c8426d414c2d4f3ca2b60bcd96e2fb0df`|2,266,434 / `0x5021d3a7111d1545dedcfda63128e4d9a4582dc2f155f41f739ecbc12f8ebed2`|
|candidate|27,195,921 / `0x6e5cedd698662e420e757000b015fdae003f14b0277bbcf10472c3de090bfe67`|2,681,328 / `0x2a8b47e54ffca1e78bbe54ed02f0a797cadc1d6f31ddb47a3d1373f523cd41b4`|

[Control receipt manifest](evidence/shared-byte-block-control.manifest.json) · [Candidate receipt manifest](evidence/shared-byte-block-candidate.manifest.json) · [Bounded paired runner](scripts/shared-byte-block-benchmark.mjs) · [Offline checks](test/shared-byte-block-comparison.test.mjs).

Both final managed Anvils exited0 (PIDs1016 and1634), their exact caches and final build directories were removed, and only the three preserved demo nodes remain. Other stopped task builds were moved recoverably to the local Trash folder `efs21-shared-block-cleanup.ux2uzn`; scratch ledgers/preflight evidence remain. Free disk remained281GiB. HTTP49966/54154/60731 and RPC49941/54148/60726 retain their original processes. No public deployments, source migration or demo reset occurred.

Normal reproduction uses the full Core Forge suite; full foundation suite with both separate test-only remapping flags `--remappings Foundation/=src/ --remappings Browser/=../2026-09-09-files-browser-mvp/contracts/src/`; and the same explicit bounded Node/browser list from the initializer gate. Canonical compileUpgrade excludes only InitializationOutline.t.sol from artifacts; the full Forge gate includes it. Use isolated build outputs. Run retained offline validation with:

```sh
node --test --test-concurrency=1 Reviews/2026-09-11-efs21-pragmatic/test/{envelope-storage-comparison,metadata-admission-comparison,initialization-outline-comparison,shared-block-control,shared-byte-block-comparison}.test.mjs
```

Do not overwrite/re-run final receipt outputs; the runner refuses. The ignored task report contains the exact full command list and RED/GREEN chronology. This experiment does not solve the full model's multi-million write floor or the Type-cache output/runtime bound; posting extraction, compact caches, authority alternatives and smaller Files profiles remain separate owner-gated work.
