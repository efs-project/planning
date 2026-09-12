# Envelope-only full-C0 paired result

Measured local experiment, not adoption or a populated-state migration. Source/support frozen at `a51633671b45071eb13adf9cbbbf17ab2501a33d` before both exclusive reports. The slot-backed Solidity control is exact `ab13d89e4e6111efc5eea6fc61c3ac56181c9a70`; the candidate changes only Envelope physical storage plus its consumers. Both use the same current runner, compiler settings, installed dependencies and workload. See [profile and reproduction](envelope-storage.md), [control receipts](evidence/envelope-storage-control.json) and [candidate receipts](evidence/envelope-storage-candidate.json).

**Measurement gap:** paid scalar/repeated receipt-library gas is unmeasured and deferred. Existing receipt-library correctness tests remain covered, but receipt-library cost regressions are not economically bounded by this gate. The paid Core reads below are distinct measurements, not substitutes or full paid-read coverage.

## Actual transaction gas

| Workload | Slot control | Envelope code | Difference |
|---|---:|---:|---:|
| Seven-record create metadata,41bytes content |5,753,458|5,589,155|−164,303|
| Its content staging |149,369|149,369|0|
| Three-record edit metadata |2,957,700|2,827,399|−130,301|
| Its content staging |149,381|149,381|0|
| First tag |2,308,117|2,222,619|−85,498|
| Steady tag |2,080,727|1,995,217|−85,510|
| Binding rebind |1,839,368|1,735,729|−103,639|
| Partial direct author |1,041,078|955,568|−85,510|
| Mixed ACTIVE/fresh, same Envelope |1,473,138|1,473,120|−18|
| All-ACTIVE retry, fresh authorization |643,857|643,851|−6|
| Old-signature rejection |367,204|367,216|+12|
| Multiple Type groups |2,449,123|2,363,610|−85,513|
| New minimum Envelope, existing Records/Types |903,308|833,569|−69,739|
| Maximum Envelope, one selected existing Record |2,353,388|1,290,287|−1,063,101|
| Reached late reference rejection |1,367,198|1,281,707|−85,491|
| Legal large-Type cache then intended reference rejection |12,081,846|11,996,384|−85,462|
| Legal large-Type cache then intended CAS rejection |12,071,379|11,985,930|−85,449|

Create including its chunk is5,902,827→5,738,524gas. These are whole-workflow receipts, not isolated SSTORE estimates. Tiny differences in reuse/signature-refusal rows include actual signed-calldata intrinsic differences; they are not evidence of an allocator optimization. The two large-Type compound cases still fail earlier at `HelperDeploy`, not at their later intended reference/CAS error. The small-Type late-reference case does reach its exact later error and verifies atomic rollback.

## Paid reads and qualification

| Actual Core read through static consumer | Slot control | Envelope code | Difference |
|---|---:|---:|---:|
| getEnvelope, create Envelope |209,137|179,627|−29,510|
| getOccurrence, create leaf0 |220,593|212,367|−8,226|
| getRecordsCurrent,8rows including repeated ID |343,730|343,730|0|
| getEnvelope, maximum2304bytes |353,730|182,876|−170,854|

These mined consumer receipts exclude consumer deployment/setup. The actual consumer artifacts are retained and authenticated: executable constructor/runtime prefixes, encoded CBOR boundaries, lengths and compiler settings agree; metadata hashes differ because imported source changed. The consumer does not inspect its own code/hash. This limited exception does **not** apply to PreparationHelper: its entire creation bytes and runtime are byte-identical.

No public routed-Core getReceipt/batch-receipt API exists. Root's explicit scope ruling retains the existing Core Envelope/Occurrence/Record measurements and receipt-library correctness tests while deferring paid scalar/repeated receipt-library measurements. No ABI was added. A new unauthenticated receipt harness would price a different context; it is not claimed as routed-Core evidence. Cost if this deferral matters: receipt-library regressions remain economically unbounded here.

Both final directories are qualified and complete through the actual checked Record-batch Files consumer. Both make104requests; observed result bytes rise407,901→414,937, including larger authenticated runtime material. Single-run elapsed observations are retained, not a latency improvement claim. All-family logical inventories match after authenticating each actual revision Core hash before the one authority-hash normalization:82Records,65Envelopes,22Types,1principal,88admissions,66batches,259postingkeys,22Bindingkeys. Every admitted occurrence, posting word, Binding/history and per-operation Lens result is checked.

The helper is public. The control retains22Type children plus one unrelated public child; the candidate additionally retains65Envelope objects. Actual cell/cache pointers open exact code and chronological nonce addresses; no Type ordinal is treated as helper nonce. Existing-Envelope partial and all-ACTIVE reuse create no new object. Reached late failures restore helper nonce/code, Envelope/Record/Type cells, counts, indexes and author nonce.

## Actual deployed runtime sizes

| Module | Control bytes | Candidate bytes |
|---|---:|---:|
| FixtureDeployment |9,402|9,402|
| PreparationHelper |18,953|18,953|
| UpgradeAdmissionLibrary |19,921|20,289|
| PointReadLibrary |13,245|14,287|
| UpgradeQueryReadLibrary |19,303|20,259|
| UpgradeableReadFixtureCore |21,544|21,928|
| UpgradeableReadFixtureCoreU2 |22,171|22,555|
| UpgradeableFixtureCoreU3 |24,152|24,536|
| UpgradeableFixtureCarrier |7,637|7,637|
| UpgradeableFixtureCarrierU2 |7,999|7,999|
| UpgradeableFixtureCarrierU3 |10,023|10,023|
| Core/carrier proxy, each |761|761|
| Core/carrier admin, each |879|879|
| Pre-authority FilesRouterV1 |13,746|13,746|
| FilesRouterV2 |13,289|13,289|
| Paid static consumer |420|420|

All actual runtimes fit24,576 and creation transactions fit49,152 initcode bytes under the ordinary16,777,216 transaction gas ceiling. Maximum complete initcode including constructor arguments is25,109control/25,493candidate. The pre-authority FilesRouterV1 is unchanged and has byte-identical complete creation calldata in both reports. Exact hashes, compiler inputs, source pins and creation transactions are retained; equal sizes do not imply equal hashes. Candidate U3 has **only40bytes headroom**. Its first rehearsal version was24,852 and genuinely refused deployment. Reusing an already validated whole-row cell/extent removed duplicated validation/copy setup without removing any bounds/STOP check. Later slab/codec work may need separately reviewed decomposition; this is not roomy architecture.

## Gate and limits

- Core217passed:206baseline plus6new unique physical/lifecycle tests and5 inherited repeats. Foundation29passed. Three old DirectApply child-order/observer assumptions were retargeted, not skipped; previously removed15journal-only tests remain excluded.
- Explicit34-file reader/authority/independent-effect/browser Node gate:243pass,0fail,1existing large-Type RED target skipped;190.850seconds. Follow-up focused relay/matrix and five real Chromium journeys:7/7;45.634seconds. Strict TS, touched Solidity formatting and diff checks pass. Offline final differential checks:7/7.
- Browser initially failed all5journeys twice. Exact diagnosis was the pre-existing static relay omission of getRecordsChecked (HTTP400 selector0x9924bdea), not Envelope semantics or CORS. Root approved only the two existing checked Record view selectors; focused acceptance/refusal and actual Chromium paths pass. Both arms use this same support fix. It adds no product API or write permission.
- The historical matrix test initially regenerated its old JSON. All changed fields and original EOF formatting were restored exactly; isolated runs now write to their owned build directory. No historical evidence changes are retained. Historical journal/direct benchmark entrypoints refuse this changed Store before starting worlds.
- Final worlds contain102transactions each; control35.377seconds, candidate36.525seconds including build/setup. Both owned nodes/caches/builds confirm cleanup. Preserved demo processes were not touched. No traces or public funds were used.

Legal64-field Type cache24960>24575 and bounded group-output131072 hazards remain unfixed. The maximum Envelope has64vector entries but **one selected existing Record**: it does not prove64-new-leaf allocation or ordinary-transaction feasibility. Shape checks are not universal content-hash authentication. Early helper failure precedence can differ. Shared Record slabs, Type compression, postings and native-model tradeoffs remain separate work.
