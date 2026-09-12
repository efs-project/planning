# Initialization outlining: smaller Core, slightly higher recurring cost

September12,2026 · disposable full-C0 experiment · not a protocol ruling

**Result:** actual browser CoreU3 runtime falls from24,536 to23,619bytes, recovering917bytes and leaving957bytes below the unchanged24,576-byte limit. This enables the next storage experiment; it is **not** a cheaper-file claim. Library runtime grows1,318bytes, atomic pair bootstrap costs3,029gas more, and the complete measured file create costs330gas more.

Exact reviewed control:`1cb402a19c9b6f1ddf4137dfa2597f85bc50dd82`. Source/support freeze:`b6ffadea651a9eceec219f606a8d0dbf9af53a34`. Exclusive final evidence:`d0a908de658902d5559ad31a7c84efcf52afdd40`. No production Solidity or runner changed after those measurements. The source contains only the initializer wrapper in `UpgradeAdmissionLibrary` and the guarded call in `UpgradeableFixtureCore`.

## What changed and what did not

The existing one-time `StateKernel.initialize` engine is reached through the already pinned, storage-authorized admission library. The public Core initializer still calls `_initialize` first, then checks the linked library address, nonempty code and exact configured codehash immediately before the delegatecall. It does not call `_execution` or `configuration` while the proxy pair is only partly constructed.

StateKernel logic, Preparation/helper, stored layouts, metadata accessors, all posting families, public Core functions/events/constructors, bootstrap rows and successful logical effects remain. Both candidate generations start with the candidate library from genesis. This does not migrate an old populated pair to a different linked library. The execution-set shape remains21words; actual code/configuration identities change and are authenticated rather than equated.

Six compiler-generated Core error ABI entries move to the library ABI: `HelperDeploy`, `HelperIdentity`, `HelperInput`, `HelperOutput`, `InvalidCommitment`, `InvalidInitialization`. Exact error selectors and tuples still bubble from the Core. Core-only generated bindings need the library error ABI for decoding; focused actual-Core failure tests and an old-Core-to-candidate-union decoder test cover that difference. No redundant declarations were added to manufacture identical error-ABI inventories.

The canonical artifact loader excludes only `InitializationOutline.t.sol` from production compilation. The full foundation test command includes that test with two test-only remappings. Compiler version/settings, helper runtime and helper creation bytes are identical across both paid arms; no test or validation feature was removed.

## Paired actual receipts

Same source-frozen support, admitted data and ordered actions in two serial fresh local worlds. These are actual receipts, not Forge test-function gas or a public-chain fee quote.

| Operation | Control gas | Outlined gas | Difference |
|---|---:|---:|---:|
| Complete seven-record create, including content staging |5,716,496|5,716,826|+330|
| Three-record edit metadata |2,810,891|2,811,064|+173|
| Edit content staging |149,381|149,381|0|
| First tag |2,217,080|2,217,213|+133|
| Steady tag |1,989,691|1,989,824|+133|
| Binding rebind |1,725,723|1,725,856|+133|
| All-ACTIVE retry |643,851|643,984|+133|
| Reached late-reference refusal |1,296,723|1,296,893|+170|
| Supported large-Type setup |15,946,740|15,946,891|+151|
| Paid Envelope read |179,627|179,632|+5|
| Paid occurrence read |212,367|212,389|+22|
| Paid Record read |183,665|183,670|+5|
| Paid Binding read |175,654|175,658|+4|
| Paid current eight-Record read |343,730|343,737|+7|
| Paid maximum Envelope read |182,876|182,881|+5|

Create's receipt-minus-calldata-intrinsic difference is318gas; this is not an execution trace or a pre-refund gas claim. No new external read call was introduced, but changed generated dispatch/code still has measurable recurring costs. The supported large-Type setup is not the independently unsupported64-field cache boundary.

| Actual deployed component | Control runtime / complete initcode bytes | Outlined runtime / complete initcode bytes | Deployment gas difference |
|---|---:|---:|---:|
| Browser CoreU3 |24,536 /25,493|23,619 /24,590|−198,966|
| Admission library |20,317 /20,349|21,635 /21,667|+284,832|
| Preparation helper |18,953 /18,979|18,953 /18,979|0|
| Point reader |14,287 /14,317|14,287 /14,317|0|
| Query reader |20,259 /20,289|20,259 /20,289|0|

U3 plus library aggregate runtime **grows401bytes**. Atomic Core/Carrier proxy-pair bootstrap changes2,334,456→2,337,485gas with identical62,252gas calldata intrinsic. The complete signed deployment inventory retains every actual constructor argument, proxy/admin, module identity and receipt; sizes in this table are not unlinked artifact templates. Ordinary runtime24,576/initcode49,152/transaction16,777,216/block33,554,432 bounds remain.

## Falsifiers, evidence and verification

The unchanged actual deployed U3 failed the intended strict size-improvement assertion; the candidate passed. Removing the new library guard made missing/changed-library tests fail the required precedence before a deliberately failing helper. Earlier import/remapping/constructor setup failures and an insufficient STOP-only mutation were not counted as those REDs. Eight new focused tests exercise bootstrap/helper code and nonce, direct-library refusal, malformed/unauthorized/repeated initialization and complete rollback after helper CREATE. Existing populated-upgrade and migration-rollback tests remain.

Final evidence is retained losslessly in [control](evidence/initialization-outline-control.json.gz) and [candidate](evidence/initialization-outline-candidate.json.gz), with their matching manifests. Offline loading is bounded to8MiB compressed and32MiB decompressed. The comparison retains all32 operations, all119 signed transactions per arm, logical inventories, per-receipt Binding/Lens outcomes, helper-child chronology, historical execution identities and six paid return comparisons. Normalization first authenticates the specific executable-identity field; wrong-field/authority-hash forgeries reject. The unchanged paid consumer's actual51-byte compiler metadata is retained, parsed and distinguished from its equal executable prefix.

Independent source/specification and code-quality review approved`d0a908de` with no actionable findings. Its separate offline audit authenticated all238 signed transactions,254 source/support entries,30 actual module runtime bytecodes and10 historical execution observations; it did not rerun builds or worlds.

Worker verification:233 Core tests,37 foundation tests and276 passing Node/offline/Chromium checks, plus one existing legal-large-Type skip. Root independently reproduced fresh canonical foundation/router builds, all233 Core/37 foundation tests and the complete explicit serial Node/browser/offline gate:277 tests,276 passed,0 failed,1 existing skip,227,082.710ms. Root separately reproduced exact candidate module sizes, strict TypeScript, touched `forge fmt --check` and `git diff --check`. Core retains its pre-existing `C0Request.prepare` mutability warning; the warning is not a new failure or silently claimed clean compilation.

Remaining gaps: the legal64-field Type whose24,960-byte cache exceeds a single blob remains unsupported; oversized aggregate helper output/storage is separate. Paid receipt-library scalar/repeated pricing remains unmeasured. The maximum Envelope fixture has64 vector entries but one selected existing Record, not64 new allocations. Local RPC observations are not state proofs. There is no public-chain/L2-fee or production-adoption claim.

All implementer-owned rehearsal/final worlds stopped and their exact owned caches/builds were removed. Root's serial regression worlds also completed and closed through their managed lifecycle. Native49966/54154 and Fable60731 demos are preserved; this source change does not silently update those running snapshots. Root retains its bounded build artifacts and the implementation control archive for review, not live mining history.
