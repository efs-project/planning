# Initialization outline: bounded probe history

Control: `1cb402a19c9b6f1ddf4137dfa2597f85bc50dd82`. Fresh-genesis disposable profile only. All source changes are the existing-library initializer wrapper and the public initializer's explicit dependency guard/delegatecall; StateKernel, Preparation, stored rows and metadata admission accessors are unchanged.

Control source was archived before edits; coherent foundation/router artifacts were built under the unchanged Solidity0.8.30/Cancun/viaIR/optimizer200 settings. U3 runtime24536/initcode template25365; admission library20317/20349; PreparationHelper18953/18979. The archive and build paths are in the task report, not product configuration.

## RED and first candidate

- Setup failures, not RED: external U3 import needed two explicit test-only remappings; the first constructor probe used dummy read-library hashes and correctly refused deployment. Corrected to the actual linked reader codehashes.
- Intended RED: unchanged actual U3 deployed, emitted runtime24536 and failed `initialization outline must shrink actual U3`. One failed test, no skipped test.
- The two specified source changes then passed that actual deployment test: runtime23619, 917 bytes smaller, 957 bytes below24576. Candidate admission library21635/21667; helper18953/18979. Canonical router artifacts separately reproduced U323619/initcode template24462.
- Guard mutation: temporarily remove the explicit public-initializer guard. Both missing-code and distinct-reverting-code tests failed `exact bootstrap failure precedence`. Restore the specified guard: both pass. The initial STOP-only altered-code test was insufficient because later configuration could produce the same error; it was replaced with distinct `0xdeadbeef` reverting code before counting the mutation RED.
- Bootstrap, exact intrinsic cache/helper child, direct-library refusal, malformed-init rollback and helper-CREATE-then-revert rollback passed. A first post-construction fixture failed at OZ's nonempty initialization requirement, not at our target. Its constructor now makes a harmless `counts()` call, leaving Core control uninitialized for the later refusal check.

No Forge test totals are transaction-cost evidence. Runtime24576/initcode49152/transaction16777216/block33554432 ceilings are unchanged. All tests use ordinary CREATE, never etch for successful U3 deployment. Etch is restricted to adversarial dependency fixtures.

## Explicit test/build separation

Root approved excluding **only** `InitializationOutline.t.sol` from `compileUpgrade`'s canonical production artifact build. It imports actual browser U3 and therefore needs test-only `Foundation/=src/` and `Browser/=../2026-09-09-files-browser-mvp/contracts/src/` remappings. The complete foundation Forge gate includes this test with those explicit remappings; it is not skipped from verification. Both paid arms use identical loader support. Canonical production artifact settings and exact helper-runtime comparison remain unchanged.

Final complete-gate counts, source/support freeze, independently authenticated paired receipts, costs and cleanup belong to the task report and exclusive initialization-outline evidence. Earlier metadata/Envelope evidence is unchanged. The unsupported legal large-Type cache and group-output/deposit limitations are not solved here.

## Accepted generated error-ABI difference

Outlining removes exactly HelperDeploy, HelperIdentity, HelperInput, HelperOutput, InvalidCommitment and InvalidInitialization from generated Core/ReadCore/U3 ABI metadata. All six exact error tuples remain in the actual admission-library ABI; the existing loader's union decoder includes it. Root accepted explicit relocation, not removal of runtime validation. The focused actual-Core malformed-init and helper-CREATE-failure tests assert exact original revert bytes, and the offline decoder regression checks those two error selectors against the original Core ABI and candidate union. Core-only generated bindings now need the library's error ABI. Function/event/constructor ABI checks remain separate and exact; no redundant declarations were introduced for artificial metadata equality.
