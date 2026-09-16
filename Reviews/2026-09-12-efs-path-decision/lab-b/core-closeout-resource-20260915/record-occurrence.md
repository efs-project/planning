# Record occurrence boundary and bounded preparation fit

2026-09-15. Disposable prototype arithmetic/atomicity evidence, not deployed EFS v2, throughput evidence or a protocol layout decision. Base `7af26953b744abe57a13419c4a65892b66baed7e`. Final implementation is the commit containing this packet, pending independent review. **The authorized preparation extraction resolves the size gate: Ledger runtime 23,434 bytes, actual initcode 35,180 bytes.** Seventeen focused, 46 covering and two archive controls pass. Initial blocked diagnostics are retained below, followed by the final extraction evidence.

## Initial finding and minimal repair

A real seven-byte BINARY Record is first published through the normal Ledger and mandatory IndexModule. Test-only storage injection changes only the occurrence portion of its packed metadata. At count `4294967295`, another duplicate PUBLISH or REUSE carries the packed count to `4294967296`, while the public `uint32` getter returns `0`. With an injected count bit at `2^32`, another admission returns packed `4294967297`, public `1`.

The common existing-record branch now rejects `meta >> 80 >= type(uint32).max` with exact `E_BOUNDS(7)`. Codes 0 through 6 were already used in the current Ledger; the new comparison never narrows before checking. New-record creation, bodies, identities, zero-occurrence retention, acceptance and index rules are untouched.

Two bounded forms were measured, in order. The first leaves the existing checked addition intact. The second, specifically authorized after identifying the deployment pressure, makes only that addition unchecked: the full-word guard implies `meta < (2^32 - 1) * 2^80`; adding `2^80` gives a result below `2^112`, so `uint256` overflow is impossible. This removes a redundant arithmetic check, not an invariant. Neither guard-only form fits; the 19-byte deficit triggered the required context stop. That guard was retained in the subsequently authorized coherent extraction, without per-byte searching, cap changes or invariant removal.

| Form | Ledger runtime | Runtime margin vs 24,576 | Creation bytecode | Initcode with actual 64-byte arguments |
| --- | ---: | ---: | ---: | ---: |
| Reviewed base | 24,569 | +7 | 31,140 | 31,204 |
| Minimal guard, checked addition | 24,603 | **−27** | 31,174 | 31,238 |
| Same guard, proven unchecked addition | 24,595 | **−19** | 31,166 | 31,230 |

All three initcode totals are below 49,152. Both guard-only forms exceed EIP-170: their passing Forge tests did not establish deployability.

## Focused TDD evidence

All commands run from `lab-b`, using the assigned Forge executable and shared build paths. Compiler configuration remains Solidity 0.8.30, optimizer 200, viaIR, Cancun; no code-size-limit override was supplied. The command in each phase was:

```sh
forge test --offline --out "$TASK_BUILD/out" --cache-path "$TASK_BUILD/cache" --match-path test/RecordOccurrenceBounds.t.sol -vv
```

Here `TASK_BUILD` is the coordinator-assigned build directory, not a new chain or paid environment. RED was run before modifying Ledger. The initial RED produced seven `count at or above public width accepted` failures and one lifecycle pass. The final diagnostic error then made the exact packed/public mismatch observable:

| Focused control | RED before guard | Checked guard | Proven unchecked guard |
| --- | --- | --- | --- |
| fresh 1 → withdraw 0 → reuse 1 | PASS | PASS | PASS |
| injected high bit, PUBLISH and REUSE | FAIL: `UnexpectedOccurrenceIncrement(4294967297, 1)` | PASS | PASS |
| MAX duplicate PUBLISH refusal | FAIL: `UnexpectedOccurrenceIncrement(4294967296, 0)` | PASS | PASS |
| MAX−1 permits exactly one PUBLISH, then refuses | FAIL: `UnexpectedOccurrenceIncrement(4294967296, 0)` | PASS | PASS |
| MAX−1 permits exactly one REUSE, then refuses | FAIL: `UnexpectedOccurrenceIncrement(4294967296, 0)` | PASS | PASS |
| MAX REUSE refusal | FAIL: `UnexpectedOccurrenceIncrement(4294967296, 0)` | PASS | PASS |
| first REUSE reaches MAX, second PUBLISH rolls prefix back | FAIL: `UnexpectedOccurrenceIncrement(4294967296, 0)` | PASS | PASS |
| first PUBLISH reaches MAX, second REUSE rolls prefix back | FAIL: `UnexpectedOccurrenceIncrement(4294967296, 0)` | PASS | PASS |

Final RED: 1 passed / 7 failed, exit 1. Each guard form: 8 passed / 0 failed / 0 skipped, exit 0. The high-bit RED stops on its first unexpected success; both refusal forms execute in GREEN.

Refusal snapshots compare the full raw Record metadata, canonical body/type/first admission/count, nonce, counters, prospective publication-id mapping, admissions/evidence/publication contexts 1 through 4 (retained and absent rows), index progress/generation, and head/word/ordinal contents of the four affected required posting lists: by-Type, by-author, by-Record and unique-by-Type. This seven-byte unprofiled Type has no references/scalar/digest declarations; those families are not falsely claimed as exercised. The two mixed two-leaf controls pair with independently successful MAX−1 single-leaf controls and compare the whole prefix before/after refusal.

`forge inspect Ledger storage-layout` independently confirmed `_record` at mapping slot 2 and the metadata at RecordCell offset +1. `git diff --check` passed. At the initial size stop, no covering-file run was started; final scoped covering results follow below. No broad suite or paid Anvil run occurred.

## Warnings and limits

Initial compiler warnings were retained, not suppressed: four existing Keys.sol declaration-shadow warnings (2519), at lines 92, 97, 117 and 121 shadowing `typeId` at line 88; Ledger runtime-size warning (5574) at 24,603 and 24,595 bytes respectively; test-only RecordOccurrenceBoundsTest initcode warning (3860), 94,194 bytes in final RED, 94,228 checked, 94,220 unchecked. The test contract bundles deployment fixtures and is not a real deployable. Final deployables no longer emit runtime/initcode oversize warnings.

Record occurrence `uint32` and the existing binding-revision widths are explicit prototype capacities, not hundred-year layout choices. Future widening requires coordinated ABI, raw-decoder and storage-layout review. Injected counts do not mean billions of actual transactions occurred and deliberately do not fabricate corresponding historical admissions/postings. Neither this arithmetic falsifier nor any isolated maximum establishes a universal joint resource envelope.

Ordinary transaction allowance 15,000,000, hard transaction cap 16,777,216, runtime 24,576 and initcode 49,152 are unchanged. No owner-demo UI/RPC, production repository, package, public deployment, archive implementation, Fable, or unbounded trace/history work was touched. The size stop was resolved only after the coordinator supplied the exact measured-fit extension requirements.

## Initial diagnostic source hashes

SHA-256, measured at the initial stop after the proven-unchecked diagnostic (not final Ledger source):

- `src/Ledger.sol`: `dd6be33ed8bc63f4c8977106e2d7ea9c78b1bdbf314ce8f95077c244dd385960`
- `test/RecordOccurrenceBounds.t.sol`: `00457306c145377590f6ccafcc5962fac37a0976f91f25ab4cee3dbd0a7b12e7`

At the initial stop, only these two code files and this source/size evidence file were task changes; no oversized commit was made. Unrelated untracked commit-message files remain preserved.

## Authorized extraction and authority boundary

The five typed preparation entrypoints in the existing constructor-created `PublicationSupport` handle native, legacy signed, guarded native, guarded signed and source/destination import envelopes. The Ledger's immutable support address/codehash is checked before every dispatch. The single private dispatch uses DELEGATECALL with a fixed 12,000,000 gas ceiling, without requiring that unused gas be available. Success must return exactly 17 static words / 544 bytes; errors are copied only up to the existing 4,164-byte diagnostic ceiling, otherwise `E_INDEX("")`. ABI decoding validates narrow fields. No caller-selected target or prepared-publication ingress is added.

The declarations-only `PublicationPreparation` library mirrors wire shapes without renaming `Ledger.Action`, `Intent`, `IntentV2`, `ReadSetV2` or `SourceEvidence`, adding storage bases or introducing linked runtime libraries. Ledger maps the preparation result into its unchanged `Pub` shape; counters, ordinals, publication IDs and first admission are absent from the result. It encodes the guarded read-set once, retains that exact byte array locally and stores it only during canonical publication retention.

In delegate context, `address(this)` is the actual Ledger/proxy and `msg.sender` the actual caller/relayer. Source getters are fixed 32-byte STATICCALLs to `address(this)`, capped at 100,000 gas; individual guarded head snapshots retain their 30,000 cap and the index manifest retains 100,000. Native principals come from the actual caller and instance origin. Signed authors come from checked signatures, never the relayer. Source ECDSA evidence is independently verified, but destination authorization is still required; imported CREATE retains the verified source creator. Legacy signed/import ingress remains direct-only.

Preparation functions are view/pure paths: no SSTORE, CREATE or mutable external CALL. Ledger still owns nonce/retry checks, `_run`, the publication lock, source-evidence retention, all roots 0–15, every ordered mutation/index callback and execution/registry recheck. Existing public digest/read-set getters retain their read-only path and bytes. The normal-STATICCALL `checkReadSet` still uses its caller; preparation instead explicitly supplies `address(this)` to the shared private head checker. Hash mismatch remains `E_INTENT(5)` before stale coordinates or signature errors.

Explicitly approved resource refusal: preparation rejects zero or more than 64 admission actions before action hashing/profile/signature loops, checking the encoded vector before dynamic decoding. Existing realm/code/deadline checks remain ahead of this bound. Multiply-invalid oversized-plus-bad-signature error precedence is intentionally changed; accepted publication semantics are not. The public `acceptanceProfileOf` getter still hashes oversized candidates.

## Final verification

The preparation seam was tested before implementation: 3 existing behavior controls passed, while the static 544-byte result test and wrong-return-size gate failed. After extraction, all five passed; additional focused characterization controls cover error bounds, refusal precedence, exact retry and the maximum guard preimage. Final focused run: **17 passed / 0 failed / 0 skipped** (8 count + 9 preparation).

| Covering file | Passed |
| --- | ---: |
| FoundationIdentity.t.sol | 6 |
| FoundationGuard.t.sol | 10 |
| FoundationUpgrade.t.sol | 7 |
| LedgerImport.t.sol | 5 |
| IndexDigestVectors.t.sol | 2 |
| CoreOrderedAcceptance.t.sol | 16 |
| **Covering total, run once** | **46** |

Two additional archive controls passed: `GuardedArchiveTest.test_guarded_retains_exact_mandatory_preimages_and_refuses_legacy_getter` and `SignedClaimArchiveTest.test_packed_and_codeblob_reconstruct_identical_1_2_64_vectors`. An initial end-anchored method regex selected no tests; that empty run was not counted. Corrected named selection ran exactly the two controls. No archive code changed.

The maximum guard control retains and rereads all 10,592 bytes for a 64×4 read set, first and repeated use, with one small CREATE per call and each call capped at 15,000,000. The full two-call Forge test consumes 12,739,923 fixture-test gas: this is a warm diagnostic, **not one paid transaction price**, and it does not certify maximum guards jointly with maximum bodies/actions. The ordered-acceptance fixture logs 1,199,412 gas for its warm eight-reference app call and 5,715,674 for warm 55 CREATE; these likewise are not replacement paid receipts.

Commands from `lab-b` (use the coordinator-assigned `TASK_BUILD` and Forge executable):

```sh
forge test --offline --out "$TASK_BUILD/out" --cache-path "$TASK_BUILD/cache" --match-contract '^(PublicationPreparationTest|RecordOccurrenceBoundsTest)$' -vv
forge test --offline --out "$TASK_BUILD/out" --cache-path "$TASK_BUILD/cache" --match-contract '^(FoundationIdentityTest|FoundationGuardTest|FoundationUpgradeTest|LedgerImportTest|IndexDigestVectorsTest|CoreOrderedAcceptanceTest)$' -vv
forge test --offline --out "$TASK_BUILD/out" --cache-path "$TASK_BUILD/cache" --match-contract '^(GuardedArchiveTest|SignedClaimArchiveTest)$' --match-test 'test_guarded_retains_exact_mandatory_preimages_and_refuses_legacy_getter|test_packed_and_codeblob_reconstruct_identical_1_2_64_vectors' -vv
forge build --offline --out "$TASK_BUILD/out" --cache-path "$TASK_BUILD/cache" --sizes src/Ledger.sol src/PublicationSupport.sol src/IndexModule.sol src/ProfiledIndexModule.sol test/ProfiledFilesIndex.sol test/FilesPageReader.sol test/FilesJoinedConsumer.sol
```

All four final commands exit 0. A final `forge build src/Ledger.sol --offline --no-cache --extra-output storageLayout` (same output/cache locations) refreshed missing cached layout metadata without deleting shared artifacts. Independent checks against the expected slot labels confirmed every sequential root 0–15 and RecordCell `typeId` +0 / `meta` +1 unchanged; runtime/initcode remained 23,434/35,180. No changes to compiler version/settings, code-size limits, the separate shared 9.8M index allowance or transaction caps. No broad prototype test campaign, paid environment, wallet/carrier implementation or final economics claim.

## Final deployable sizes

Normal `forge build --sizes` succeeds. Byte counts below use compiled runtime/creation bytecode and actual constructor argument widths from the existing deployment recipes. The two affected real deployables are Ledger and PublicationSupport; the other integrated components are freshly built size controls. ProfiledIndexModule/IndexFieldProfile use the existing one-Type/four-scalar/digest recipe, not an unbounded profile.

| Deployable | Runtime | Creation bytecode | Actual argument bytes | Actual initcode |
| --- | ---: | ---: | ---: | ---: |
| Ledger | 23,434 | 35,116 | 64 | 35,180 |
| PublicationSupport | 10,830 | 10,856 | 0 | 10,856 |
| IndexModule | 12,897 | 21,674 | 32 | 21,706 |
| ProfiledIndexModule | 16,639 | 29,241 | 608 | 29,849 |
| ProfiledFilesIndex | 24,518 | 42,369 | 608 | 42,977 |
| IndexReplayDecoder | 4,359 | 4,712 | 32 | 4,744 |
| IndexFieldProfile | 1,257 | 2,966 | 576 | 3,542 |
| FilesPageReader | 16,017 | 16,599 | 96 | 16,695 |
| FilesJoinedConsumer | 15,356 | 19,361 | 224 | 19,585 |

Ledger has 1,142 runtime bytes of remaining margin; ProfiledFilesIndex still has only 58. Ledger creation bytecode already embeds its constructor-created helper's initcode: do not add the helper bytes again to the Ledger transaction's initcode size. Both components' individual limits are checked. Future wallet/carrier fit is unproven until those exact implementations are measured. Current runtime/execution identity changes; old native proofs/paid receipts must not be relabelled to this code.

## Final warning inventory

The normal size build has four existing 2519 shadow warnings at Keys.sol 92,97,117,121 and no real-deployable oversize warning. Forge lint additionally reports three `block-timestamp` warnings at PublicationSupport.sol 61,95,146 (the preserved signature deadlines), plus 43 `unsafe-typecast` warnings. Their exact locations are: Ledger.sol 309:55,309:68,454:88,475:17,476:21,477:22,478:31,479:21,485:36,642:40,654:23,655:27,703:13,704:27,755:46,757:20,912:22,916:22,938:57,979:26,980:23,981:30,999:16,1003:28,1031:26,1038:17,1039:20,1053:17,1054:20,1072:17,1072:28,1072:45,1072:63; PublicationSupport.sol 244:33,384:43; IndexModule.sol 478:17,478:29,478:76,483:13,489:24,498:24,499:23,513:23. No lint suppression was added. The occurrence comparison itself is full-width, not a lint-driven truncating cast.

Covering compilation additionally reports the existing unused `h` at LedgerImport.t.sol 46:42 (2072), and view mutability suggestion at FoundationGuard.t.sol 60:5 (2018). Test/fixture-only 3860 initcode warnings: CallbackOwner 67,976; CoreOrderedAcceptanceTest 255,442; FoundationGuardTest 105,058; FoundationIdentityTest 99,659; FoundationUpgradeTest 181,834; IndexDigestVectorsTest 89,586; LedgerImportTest 107,790; SignedClaimArchiveTest 173,220; GuardedArchiveTest 117,680; final PublicationPreparationTest 142,433; RecordOccurrenceBoundsTest 98,170. Test harness sizes are not ordinary deployment claims. All selected tests execute in Forge; actual deployables are separately size-checked above.

## Final source hashes and review boundary

SHA-256:

- `src/Ledger.sol`: `0ba5dbe29f3105e477f4e91d01e263cd21af2ed49c0bab05551218de11e4560b`
- `src/PublicationSupport.sol`: `f7a43527e3e467baaeb5cbbdf00c2ba42592d7640786380cf699c68505557f00`
- `src/PublicationPreparation.sol`: `436e3c866c7cffd3957952bfb3ae90559fa1a368841e9d27719aa98a9ad4f51a`
- `test/RecordOccurrenceBounds.t.sol`: `00457306c145377590f6ccafcc5962fac37a0976f91f25ab4cee3dbd0a7b12e7`
- `test/PublicationPreparation.t.sol`: `c1d232ef53fd40f2432b3f3bee44e21a314c13eb28d999162a14ca1bdabb4e3c`

Self-review found no additional correctness blocker. Independent review of the full base-to-task delta remains the publication gate. The only intended commit paths are these five code/test files plus this packet; canonical planning updates and publication belong to the coordinator. No task push or owner-demo action is authorized here.
