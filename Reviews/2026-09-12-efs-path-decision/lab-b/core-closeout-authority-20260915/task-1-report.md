# Authority Task 1 — deployed ERC1271 and historical retention

**Status:** DONE_WITH_CONCERNS; disposable prototype completed for independent review, not production or owner-ratified protocol.
**Session:** authority-wallet-20260916; contracts-dev; Codex; GPT-6 Astra.
**Reviewed BASE:** `ab55ca65bfc5ee983c829e42d421f6382ad66fa1`.
**Measured contract/source commit:** `9941d3bbfc987d3a57aa157f9f53087441ce4aa7`.
**Post-measurement runner hardening:** `72162bf1b0b4124d8e4462ce535f803df87ac1c8`.
The final evidence commit also adds test-only CREATE-nonce/carrier rollback assertions; contract, wallet-fixture and paid-reader deployment bytecodes remain byte-for-byte equal to the measured snapshots.

## Outcome and boundaries

A real deployed ordinary wallet now authorizes the existing exact guarded digest through an explicit `executeGuarded1271` lane. The wallet sees the actual Ledger/proxy. Original opaque or empty signature bytes, validation-time wallet runtime hash, fixed verification profile and source context remain readable after controller or implementation changes. Third parties can retain those bytes without receiving destination authority.

The supported experiment is **ordinary deployed wallet / 0–4096 signature bytes / 300,000 wallet STATICCALL gas / exact canonical 32-byte ABI magic**. It is not universal ERC1271 compatibility. No ERC6492 unwrapping/counterfactual deployment, delegated-key account lane, arbitrary authority module, foreign-consensus verifier, native Task2 proof or UI work was added.

No source/build/chain blocker remains. Material concerns are the **38-byte Ledger runtime margin** and the intentionally narrow historical trust model described below.

## Implementation and exact representation

- Reused the constructor-created, codehash-pinned `PublicationSupport` preparation boundary. Its guarded preparation remains read-only; no preparation SSTORE or mutable authority call was introduced. The support constructor creates the fixed signature store, so nested creation cost is included in Ledger deployment.
- `prepareGuarded1271` reuses the common guarded realm/origin/execution/acceptance/index/read-set/deadline/action checks. It rejects no-code and exact delegated-key marker accounts, verifies the fixed store codehash and STATICCALLs the actual wallet once before publication mutation.
- Signature length is checked on calldata in the Ledger entry before copying its signature bytes. The helper repeats the bound. A 320,000-gas pre-call reserve protects the fixed 300,000 forwarding profile. Only 32 return bytes are copied; success requires exact return size and left-aligned magic with zero padding. Reverts, writes, reentrancy, gas exhaustion, short/noncanonical/oversized output and false magic reject.
- Proof kind 3, principal kind 2, authorization profile 3, intent format 2. Principal is `Keys.contractPrincipal(realmOrigin,wallet)`; relayer and controller do not become the author. Native and signature-authorized calls use the same `nonces[wallet]`.
- Proof-kind3 `EvidenceCell.r` is the evidence hash, `s` is the zero-padded original store address, `v=0`. These are a typed union, **not EOA r/s**. The exact getter is `ContractSignatureEvidenceStore.evidence(actualLedger,publication)`, returning digest, walletCodehash, profile, evidenceHash, carrier and raw signature. This raw typed store getter is not by itself an authenticated source claim; the companion/archive validate its Ledger/context/evidence joins.
- The evidence hash is keccak256 of ABI-encoded domain, store, actual Ledger, publication ordinal, guarded digest, fixed profile, validation-time wallet codehash and signature hash. The fixed profile preimage is `efs.lab.erc1271/1:ordinary-deployed:4096:300000:static:exact32:pre-publication`.
- Store entries are write-once under `rows[msg.sender][publication]`. A third party can write only its own namespace. A STOP-prefixed code carrier retains exact bytes. Authentic empty signature creates a one-byte STOP carrier; missing evidence reverts and is never treated as authentic empty.
- Retention occurs inside Ledger's publication-owned atomic path. Later mandatory rule, index, final Files Name validation or enclosing-app failure rolls back nonce, context/evidence, read-set pointer, index effects, store row, store CREATE nonce and signature carrier code.
- No sequential storage roots moved or were added. Compiler layout remains roots 0–15; existing namespaced read-set carriers and legacy root15 fallback are unchanged. Old per-publication store pointers survive upgrades.
- To meet the cap, the two guarded signature wrappers share one fixed private serializer. `_prepare` still checks exact 544-byte output/error bounds and uses typed `abi.decode(P.Result)`; only the first thirteen aligned, decoded static memory words are copied together. Mutable ordinals/counters and dynamic pointers remain independently initialized.
- The key-only SDK is not widened. Its retained EOA path now explicitly rejects non-EOA proof/profile before constructing an ECDSA signature. Existing guarded archive already rejects proofkind3. New companion modules are standalone; **no existing served module imports a new asset**.

## Historical trust model

`ContractSignatureEvidenceArchive` has two distinct grades:

1. `RETAINED_UNVERIFIED_SOURCE`: canonical finite bytes and hash/context joins only; no authenticated source acceptance.
2. `PINNED_LOCAL_LEDGER_ACCEPTED`: additionally checks an independently selected archive's immutable local source instance/runtime, implementation/runtime and execution-set pins, canonical retained source context/evidence, original store code and all digest/action/read/evidence joins. It never calls today's wallet.

The archive stores three separate immutable code blobs: context plus action vector, read-set bytes, signature bytes. This avoids putting the jointly bounded vector/read/signature into one oversized runtime blob. Bodies/descriptor/reference closure are **not included** in this authorization companion; existing record/closure facilities remain separate.

The standalone offline verifier never upgrades a packet from a self-asserted grade or embedded receipt. Without an out-of-band selected acceptance anchor, the result remains unverified. A selected anchor binds the exact packet hash, source chain/instance, execution/implementation, store and archive identity. That is explicit trust in a selected local receipt, **not a cryptographic foreign-chain finality proof**. The paid reader checks actual archive/source/dependency code and receipt before producing that externally selected anchor.

This finite local archive admits its pinned execution context and refuses a changed current implementation. Supporting arbitrary historical execution families is not silently inferred. The companion can read old wallet evidence after a reviewed upgrade only when the current and historical implementations/dependencies have been explicitly selected. Previously retained archive bytes are readable without the source.

Wallet runtime hash proves neither proxy implementation/storage nor transitive dependency history. Historical basis is retained source-publication context, not a replay of today's wallet. Local proxy/admin history remains an explicit trust assumption. Retention never establishes current source validity, original-author authority at a destination, destination admission, or foreign consensus.

## Verification

TDD/verification skills guided the focused RED/GREEN work; review-reception discipline caused the separate no-chain output-preservation hardening.

### Focused RED/GREEN

- Initial real opaque-wallet ingress: **0/1 RED**, `deployed ERC1271 opaque ingress missing`; then **1/1 GREEN**.
- Archive after wallet rotation: **0/1 RED**, `historical ERC1271 retention missing`; then **1/1 GREEN**.
- Real controller-signature fixture: **0/1 RED**, `real wallet controller signature rejected`; then included in GREEN wallet suite.
- Pure companion empty-signature verification: **0/1 RED**, `ERC1271_VERIFIER_MISSING`; then **3/3 GREEN**, including counterfeit/mutated joins and external-anchor separation.
- Existing-output refusal: **0/2 RED** (runner reached missing-ethers error before refusing retained output), then **2/2 GREEN**. These subprocess checks use missing ethers/artifact/Anvil inputs, assert the early refusal and verify retained output hashes unchanged. No chain is launched.
- Final self-review strengthened the rollback test with exact store CREATE nonce and predicted carrier-code absence: **1/1 GREEN**, `rollback-create-nonce.log`. This is a test-only addition after measurement.

### One changed-path Solidity covering run

From lab-b:
```sh
forge test --match-contract 'Guarded1271Test|ContractSignatureArchiveTest|PublicationPreparationTest|FoundationGuardTest|FoundationUpgradeTest|GuardedDelegateTest|GuardedRecoveryTest|GuardedArchiveTest|SignedClaimArchiveTest|ReadSetCarrierTest' --out /tmp/efs-recovery-build-wPDyNv/out --cache-path /tmp/efs-recovery-build-wPDyNv/cache -vv
```

**80 passed, 0 failed, 0 skipped, 10 suites.** Exact output is `covering-forge.log`.
The wallet suite has 11 tests; archive companion 3; preparation 9; existing native/EOA/guard/recovery/archive/upgrade/read-set coverage makes up the remainder. All are real contract deployments/calls in Forge; test harness deployment sizes are not claimed as ordinary-chain deployment evidence.

Wallet controls include caller-sensitive direct/proxy validation; opaque, authentic empty, exact4096/over4096 and controller signatures; wrong digest, absent code and delegated-key rejection; native/signed nonce race and exact retry; controller rotation and real wallet implementation replacement; transitive state reads versus writes; revert/exhaustion/reentrancy/return bombs; store namespace/write-once/code pin; populated Ledger upgrade and original store; later rule/index/app rollback. Common guarded negative commitment/order tests use the same extracted guarded preparation.

### JavaScript covering run

```sh
node --test browser/contract-signature-evidence.test.mjs browser/guarded-archive.test.mjs browser/compact-sdk.test.mjs
```

**57 passed, 0 failed.** Standalone companion 3, existing guarded archive 5, existing SDK 49. Existing source/EOA archive and served SDK behavior remain covered. The subsequent runner-output test is a separate **2/2**, not folded into 57.

### Paid commands and exact conditions

```sh
forge build test/SignaturePaidRead.sol --out /tmp/efs-recovery-build-wPDyNv/out --cache-path /tmp/efs-recovery-build-wPDyNv/cache
node script/measure-contract-signatures.mjs
node script/measure-contract-signature-upgrade.mjs
node --test script/contract-signature-output.test.mjs
forge inspect Ledger storage-layout --force --out /tmp/efs-recovery-build-wPDyNv/out --cache-path /tmp/efs-recovery-build-wPDyNv/cache --json
```

Actual binaries: Forge/Anvil 1.7.1, commit `4072e48705af9d93e3c0f6e29e93b5e9a40caed8`; Node 26.0.0; solc `0.8.30+commit.73712a01`, optimizer200, viaIR, Cancun. The dispatched existing ethers installation was selected through `EFS_ETHERS_PATH`; `FOUNDRY_OUT` and `ANVIL_BIN` selected the dispatched build/binary paths. No installation occurred.

Three disposable loopback environments, chain31337, **30M block gas limit**, individual transactions **15M gasLimit** under hard16,777,216. History256, transaction keeper512, run-specific cache, all closed in finally. The main matrix's eight single-action call-tree traces had a128-node check and inherited streaming **4MiB response/20s** transport bounds; these are not Resource2's later512KiB profile and are not opcode traces.

**119 paid transactions: 117 success, 2 expected final-Name rollback reverts.** Main direct45/proxy48 plus exact-BASE upgrade26. Full signed raw transactions, input, whole receipts, block hashes, manifests, actual deployed dependency pins and finite trace trees are retained losslessly in gzip.

The output guards were added after measurement, in72162bf. They were verified without repeating the paid matrix. The original executed main runner is retained as `paid-runner-9941d3b.mjs.gz`; its uncompressed SHA256 is `5f135b8e3385972eb12829a62e3e5dbf80f0238dc9a61baf10c989ee173b94e3`. The exact-BASE supplemental runner was a new local script when executed against9941d3b contract source; its original bytes are `base-upgrade-runner-measured.mjs.gz`, uncompressed SHA256 `291c15f7c923d8fb2390fdc82281ee4940a49e345526c190a2b1b1150f7463c5`. Current hardened runner code is not relabelled as the measured runner.

## Sizes and paid prices

| Component | Runtime bytes | Creation bytes / actual initcode |
| --- | ---: | ---: |
| Ledger | 24,538 | 39,246 / **39,310** with64 constructor bytes |
| PublicationSupport, includes nested store creation | 11,880 | 13,882 |
| Signature evidence store | 1,824 | 1,850 |
| Signature archive | 11,628 | 12,115 /12,147 with address argument |
| Wallet fixture | 2,168 | 2,318 /2,350 |
| Paid read fixture | 657 | 683 |

Ledger creation cost, including helper/store deployment: **8,438,552 gas**. Proxy shell deployment additionally578,718. Archive deployment2,591,409 direct /2,596,761 proxy. All ordinary Node deployments used unlinked artifacts and checked runtime template bytes outside declared immutable ranges. Helper/store codehashes, runtime/initcode sizes and instance addresses are included in manifests.

The code-carrier artifact's57-byte nominal runtime is not the deployed data runtime. Actual signature carriers are STOP+signature: **1..4097 runtime bytes**; constructor initcode is244 plus ABI(signature), up to4404 bytes at4096 signature bytes.

| Whole transaction or measured region | Direct gas | Proxy gas |
| --- | ---: | ---: |
| Native wallet CREATE, whole transaction | 739,361 | 746,882 |
| EOA guarded CREATE, whole transaction | 684,738 | 693,749 |
| First opaque9-byte wallet CREATE | 706,966 | 715,965 |
| Repeated opaque9-byte wallet CREATE | 706,966 | 715,965 |
| Empty signature wallet CREATE | 704,849 | 713,842 |
| 4096-byte signature wallet CREATE | 1,599,786 | 1,609,584 |
| Five-action real Files create | 2,078,004 | 2,096,595 |
| Final missing-Name rollback, actual paid revert | 1,065,956 | 1,077,649 |
| 64 CREATE actions +256 guarded heads +4096-byte signature | **12,427,540** | **12,584,349** |

First/repeated wallet measurements occur after native and EOA setup publications, so their empty read-set/execution retention is already populated. They do not claim fresh-Ledger cost. Every transaction is cold at transaction start; opcode warming within it is real.

Wallet STATICCALL regions, identical in the two arms: opaque9521, empty9509, large11080 gas. Each actually forwarded300,000. Store CALL regions, including signature carrier creation/deposit: opaque125,432, empty123,600, large948,120. These are nested region measurements, not extra standalone transactions or whole-publication estimates.

Paid full-signature read transactions: opaque83,634; empty44,595; large72,747 in both arms. They include the paid consumer's output storage writes; different zero/nonzero transitions affect these totals.

Archive **unverified first retention**, direct/proxy: opaque548,418/548,442; empty546,324/546,348; large1,438,262/1,438,274; Files829,709/829,733.
Subsequent **local-grade verification/promotion of those same retained packets**: opaque154,798/162,076; empty154,467/161,745; large232,570/239,836; Files174,435/181,743. These are two-step prices, not a claimed fresh one-step local-retention price.

Eight packets were verified after both main source chains closed. Compact JSON bundle sizes were2830 empty,2848 opaque,11022 large and5460 Files bytes, excluding separately selected anchors. The verifier reports no body coverage.

The successful joint probe is exactly64 CREATE actions,64×4 absent-head checks and4096 signature bytes. It does **not** establish affordability of all64 large Record bodies plus maximum acceptor/index work. No transaction cap was relaxed or failed workload relabelled.

## Exact BASE upgrade and storage evidence

The supplemental26-transaction check reused the full prior paid Ledger creation transaction from `../core-closeout-types-20260915/paid-run2/paid.json.gz`. All **11** source entries in its compiler metadata matched the exact reviewed BASE via Git content hashes. Original signed transaction data/hash were cross-checked, and only the two constructor arguments were replaced for the new disposable environment. Prior source label and full original transaction are preserved; no old source rebuild, source-root shift or pretend new measurement occurred.

The actual BASE Ledger measured24,247 runtime /36,378 actual initcode. A proxy was populated with native and EOA publications before upgrade to the wallet-capable implementation. Original evidence, contexts, read-set bytes, EOA signature/claim/principal and historical execution stayed identical. Real wallet ingress then succeeded, followed by a second populated upgrade retaining the original wallet store pointer. An unselected current implementation was rejected by the companion until its independently checked profile was explicitly added.

`storage-layout.json` confirms roots0..15, the224-byte EvidenceCell,160-byte PublicationContext and320-byte ExecutionInfo shapes. An initial inspect against cached artifacts reported missing storage layout; a targeted forced inspect generated it. That force removed the standalone paid-reader artifact from out; it was rebuilt explicitly. Final comparison confirmed all six deployed contract/wallet/reader creation and runtime bytecodes exactly match the original measured snapshots. No contract source changed after9941d3b.

## Failures, warnings and self-review

- First integration size: Ledger24,871, creation39,579, **295 bytes over runtime cap**. Shared ingress alone:24,728 /39,436, **152 over**. Parent approved only the coherent shared serializer plus decoded-prefix copy; final24,538 /39,246. These two early sizing values are diagnostic tool outputs, not retained paid deployment artifacts. No chain deployment was claimed for them.
- Initial expected RED failures are listed above. Main paid reverts are the two intended final-Name controls, with actual gas/receipts retained. No unexplained paid failure occurred.
- Final compile warnings: pre-existing Keys shadowing at92,97,117,121; pre-existing FoundationGuard mutability at60; oversized **test harness** initcode at Guarded1271:41, ContractSignatureArchive:8, FoundationGuard:9, FoundationUpgrade:36, SignedClaimArchive:31, GuardedArchive:19, GuardedDelegate:7, GuardedRecovery:12, PublicationPreparation:30, ReadSetCarrier:15. Ordinary deployed components separately passed real size/initcode/receipt checks. Exact warnings are in covering/rollback logs.
- Self-review checked canonical principal/digest separation; static caller semantics; pre-copy signature and bounded return handling; store-code pin and namespace; empty versus missing; original-store joins after upgrades; atomic CREATE rollback; finite code-carrier splits; old EOA early refusal and served import compatibility; source-off grade not self-authenticating; exact deployed/source/compiler pins.
- Remaining support limits: only38 runtime bytes spare; fixed300k can exclude otherwise valid wallets; wallet/proxy dependency history is not authenticated by runtime hash; local archive is deliberately fixed to a selected source/execution/current implementation; no authenticated foreign profile; bodies/descriptor closure not included here; no general combined-max economics claim.

## Changed files

Relative to lab-b:

- `src/Ledger.sol`, `src/PublicationSupport.sol`: explicit ingress, fixed preparation, shared serializer and atomic evidence integration.
- `src/ContractSignatureEvidenceStore.sol`, `src/ContractSignatureEvidenceArchive.sol`: exact typed retention and separate trust grades.
- `browser/contract-signature-evidence.mjs`, `browser/contract-signature-evidence.test.mjs`: standalone encoder/exporter/offline verifier and negative joins.
- `browser/compact-sdk-v2.mjs`: explicit EOA proof/profile refusal before Signature construction, no new import.
- `script/compact-environment.mjs`: additive new-artifact-only fixed helper/store manifest pins and size/template checks; old artifact compatibility retained.
- `script/measure-contract-signatures.mjs`, `script/measure-contract-signature-upgrade.mjs`, `script/contract-signature-output.test.mjs`: finite paid evidence and no-overwrite guards.
- `test/ContractSignatureWallet.sol`, `test/Guarded1271.t.sol`, `test/ContractSignatureArchive.t.sol`, `test/SignaturePaidRead.sol`: real wallet/upgrade/dependency fixtures, controls and paid read.
- `core-closeout-authority-20260915/`: this report, lossless artifact/transaction/runtime/trace/runner evidence, storage layout, logs and SHA256 manifest.

## Ownership and handoff

No push, package installation, public transaction, production-repo mutation, source-root shift, subagent/reviewer launch, browser/UI action or owner-demo reconfiguration occurred. Canonical main documents/status remain parent-owned. Owner Node77526 and Anvil77561 remained running with their original command lines; UI60608/RPC60599 were untouched. The two main disposable Anvil PIDs947/949 are absent after closure; the supplemental environment also closed successfully.

At delivery of this report, **prototype source, build and bounded-chain ownership are explicitly released to the parent for independent review**. There is no surviving owned chain or build process. Only unrelated existing/new commit-message files remain untracked outside the committed task files. The ignored controller copy is `.superpowers/sdd/core-closeout-authority-plan-20260915/task-1-report.md`.
