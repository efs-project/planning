# Core Index Task2: canonical replay and populated replacement

Disposable local prototype evidence, not deployed EFS v2 or a protocol-adoption claim. Based on `3ac53d57b41a34e3bc915e19daf063dc5ac9ed7d`; Task2 source is in the commit containing this packet. Ordinary transaction allowance15,000,000, hard cap16,777,216, runtime24,576 and initcode49,152 are unchanged. Solc0.8.30, optimizer200, viaIR, Cancun. Owner demo was not mutated or restarted.

## Outcome and trust boundary

A new detached index begins at completed frontier0, replays one complete canonical publication per call, and atomically replaces the old populated index after a current-basis check. The old module remains live during replay. Source writes after observed readiness reject cutover; replaying the suffix permits retry. The first subsequent publication reaches the replacement exactly once.

The fixed constructor-created decoder reads canonical layout2 admissions, evidence and retained principal/execution context. It does not accept caller effects, heads or coverage. Source code/layout and decoder code are pinned. At most64 ten-word facts are returned:20,544bytes, exact ABI shape and narrow fields. Index-owned shadow heads and withdrawal history construct effects; the existing single `_foldEffect` maintains every family. Final Name/Directory validation uses that publication's terminal admission. A later Name cannot repair an earlier invalid publication. Imported CREATE uses the retained source creator; today's mutable developer policy, current heads and current withdrawal flags are not replay inputs.

Readiness is an exact320-byte tuple checked through the existing immutable/codehash-pinned PublicationSupport STATICCALL path. Candidate and manifest getter gas caps are100,000; source getters30,000. Ledger retains idle/admin checks and the only module-slot/revision commit. The request pins old/replacement, A/P, required manifest, replacement codehash and generation. This is **not a proof that arbitrary unreviewed code tells the truth**: approval of the exact replacement runtime and finite obligation profile remains the administrator's responsibility. `setIndexModule` remains diagnostic, not safe cutover.

Live `coverage()==COMPLETE` is ordered-prefix completeness relative to the staged admission, needed by same-publication rules; it is not final publication readiness. Active source lock yields readiness phase2 and refuses replay/cutover. Detached unfinished replay stays PARTIAL. Proven genesis origin describes the materialized prefix, not deployment time; current A/P and phase are also required. Generation cannot heal a gap. An instance with any live ingress cannot later backfill a detachment: deploy another fresh replay instance. Unsupported historical implementation/layout requires an explicitly supported decoder, not silent reinterpretation.

FilesPageReader, FilesJoinedConsumer and SDK retain source/attachment/code/execution/generation/current-frontier checks. New pinned ABI uses `provenFrom`; the old pinned ABI retains `attachedFrom==1`. A new getter RPC failure never falls back. The unchanged owner-demo old ABI remains supported without redeployment.

## Independent comparisons and paid receipts

`paid.json.gz` contains112 actual transactions with signed raw bytes/full receipts, deployment args/runtime hashes, source SHA256s, five independent canonical-history comparisons and all replay steps. The JS fold uses canonical public admissions/evidence/principals, immutable Records/ref descriptors and explicit field specs, independently derives posting keys, and does not use index-produced effects/coverage or mutable current head/withdrawal state.

| Comparison | Touched posting lists | Additional live scopes |
| --- | ---: | ---: |
| Old active full profile vs canonical history |37|0|
| Detached replacement vs canonical history |37|0|
| First post-cutover write exactly once |49|0|
| Expanded obligations over largest admitted history |195|0|
| Files Name-after-BIND/remove/rebind/withdraw history |26|1|

These check each touched head count/live/last/flags and every ordinal; the Files case also checks dense live-scope order. The finite profile exercises8 references,4 scalar declarations and one algorithm+digest declaration. No completeness claim covers undeclared future Types.

| Actual operation | Gas used | Outcome |
| --- | ---: | --- |
| Replay full-eight-reference/four-field Record publication |570,301|success|
| Replay prefix while old source continues writing |236,165|success|
| Stale observed cutover |42,964|reverted; counters unchanged|
| Replay concurrent suffix |448,878|success|
| Checked populated cutover |128,011|success|
| Files final Name-after-BIND with255-byte Name |1,565,358|success|
| Replay that Files publication |691,855|success|
| Files populated cutover |166,856|success|

Real replacement Files SDK `listFolder` and `listFolderPage` both returned COMPLETE with the exact255-byte Name, at attachedFrom13/provenFrom1. New actual FilesPageReader/FilesJoinedConsumer/Lens deployments were pinned to the replacement, not mocked RPC responses.

### Largest-publication falsifier

The source is the **current Task2 unprofiled ACTIVE IndexModule**, not an exact archival Task1 artifact. Profile/code pins are in `contracts.largeActive`. It admitted55CREATE at5,794,690gas, then64CREATE at6,422,519gas. A64-record two-word publication was attempted under15M and reverted at14,979,409gas with all counters unchanged. The bounded32-record control admitted at8,086,295gas. The replacement expands each actual Record to four scalar declarations and one digest declaration.

| Whole publication replay | Gas |
| --- | ---: |
|55 CREATE |1,021,299|
|64 CREATE |1,159,843|
|32 declared-field Records |6,850,832|
|Populated expanded-profile cutover |128,011|

Largest tested admitted action count is64; largest tested admitted field-Record count32. No admitted-publication replay failure occurred. This is not every joint maximum:64 large Records,8192-byte body maxima, maximum Files dimensions and every field/type combination are not certified. If a future admitted publication cannot atomically replay its expanded obligations under15M, quarantined multi-transaction publication staging is the next engineering extension, not silent splitting or cap inflation.

### Guarded-read extraction cost

The original joint case reused the exact64x4 retained preimage. Its lower gas is **deduplication**, not evidence that fresh joint work is cheaper. The ordinary full-field case also reused the1x1 preimage. `fresh-joint.json.gz` preserves the bounded follow-up and derives the original attribution from signed calldata plus successful transaction order. Only the follow-up's before/after lengths were directly read from its live chain.

| Case | Existing bytes before | New/preexisting read-set length | Gas |
| --- | ---: | ---: | ---: |
|1x1 plain |0|320|921,148|
|64x4 plain |0|10,592|11,171,559|
|1x1 full8-ref/fields, reused preimage |320|320|1,256,910|
|64x4 full8-ref/fields, reused preimage |10,592|10,592|4,517,851|
|64x4 full8-ref/fields, fresh follow-up |0|10,592|11,851,195|

1x1 hash:`0xb0065e5443f461d6edbb2ed64e4d7d30b04b3cb537598280255dd1e8e1680457`; original64x4:`0x5962d1e8e321227b4dd566c454174deb7612d3c3271e9083b29c867f28ef4999`; fresh64x4:`0x6b2c94a0be79c17bbbe9012362e47626d7bef509c3255e13f613b43e79242298`. Fresh joint:448-byte body,8 refs,4 scalars,1 digest, beforeA/P8/8→9/9, retained body read back byte-for-byte and index frontier9. Fixed helper performs256 bounded snapshot calls; shape/hash/error order and exact stale coordinates remain covered. Pure legacy/guarded static-word digest serialization also moved to this helper; domains, public selectors/digest outputs, signatures, authority, nonces and canonical mutation remain Ledger-owned.

## Deployment sizes and remaining envelope

| Deployable | Runtime | Initcode including actual args |
| --- | ---: | ---: |
|Ledger |24,569|31,204|
|ProfiledFilesIndex |24,518|42,977|
|ProfiledIndexModule (4 scalars/digest) |16,639|29,849|
|IndexModule |12,897|21,706|
|PublicationSupport |5,684|5,710|
|IndexReplayDecoder |4,359|4,744|
|IndexFieldProfile (4 scalars/digest) |1,257|3,542|
|FilesPageReader |16,017|16,695|
|FilesJoinedConsumer |15,356|19,585|

Ledger has **7 bytes** and ProfiledFiles **58 bytes** runtime headroom. This fits ordinary deployment now; code-size integration is not solved for later count/authority/resource work. No dependency install, compiler-setting change or unlimited-size node was used. The fixed-static codec was required after measuring the equivalent all-static legacy serializer first.

Preserved fit history (Ledger / Files runtime): Task1 baseline24,462/21,639; internal replay Files25,200; checked API Ledger24,802; guarded extraction24,661; same-selector forwarding24,857/24,723 (reverted); local/shared checks24,622/24,621; memory request24,680/24,587 (losing request reverted); equivalent static legacy serializer plus private new decoder pin24,616/24,518; dynamic helper24,590; final fixed-static helper24,569/24,518. The decoder extraction was justified by the measured25,200-byte Files candidate, not a larger cap.

## Verification

Lab cwd; use existing Foundry/Node/ethers installation, no automatic install. Set `FOUNDRY_OUT` to a bounded run-specific build output and use its matching cache.

```sh
forge test --out "$FOUNDRY_OUT" --cache-path "$TASK_CACHE" --match-contract '(CoreIndexReplay|CoreIndexReplayFiles|CoreIndexMaterialization|CoreIndexFiles|CoreOrderedAcceptance|FoundationGuard|FoundationIdentity|LedgerImport|LedgerMatrix|IndexDigestVectors|IndexWork|FilesBytework|FilesNameByteBoundary|FilesPageReader|IndexConfigExpectation)Test' -vv
node --test browser/compact-sdk.test.mjs
node script/core-index-replay.mjs
node script/core-index-replay-joint.mjs
```

Final selected affected pass:161/161 Solidity tests across15 suites;40/40 SDK tests. Focused replay controls9/9, Files16/16 including inherited obligations, legacy+guarded independent digest vectors2/2. No historical whole-suite tournament. Forge wrapper gas includes many transactions/deployments and is not a paid transaction-size claim; actual receipts above are the venue evidence. Compiler warnings are existing/test shadowing, test mutability/unused locals and oversized composite test harnesses, not oversized final deployed modules.

TDD retained failures: detached constructor incorrectly reported source admission as progress; populated ready cutover initially absent/refused; actual FilesPageReader and SDK initially refused late replacement solely on deployment admission; old-ABI SDK initially attempted an absent new selector. Fixes pass their controls. The first paid launch stopped only on an address-checksum case assertion after a successful replay; `failed-paid.json.gz` preserves it. A later control-test syntax error was corrected before the final pass; no production regression was hidden.

## Evidence identity

Archives are local RPC observations, not independent state proofs. Successful runs close their run-specific managed Anvil in `finally`; no worker Anvil/Forge remains. Full source SHA256 map and runtime hashes are in each archive; all successful-run source hashes were checked against the final tree with zero mismatches. Tests were added afterward without modifying deployed sources or the paid runner.

| Archive | SHA256 |
| --- | --- |
|paid.json.gz |`5dfecaa8922f6270bd25b7861bce88824fe455ac41e97a02042920b564ebb4d6`|
|fresh-joint.json.gz |`2f9d816e9687422b20f972661ce9238792b418eb229c06ecf733e64a023b357f`|
|failed-paid.json.gz |`a60965d554a152f848d2ac3d7bd0917b23d933de18e03d6fc721f9a2b9d3d97d`|

Selected source SHA256: Ledger`d698f5d4ec6e020b3ff04a6f8a2082a755a46742417fc49395b38eb6b2aa889f`; IndexModule`8a25d2b13c8bafc39bfc6a37bf71e57ed27e5b00a05cc97565fd98737f152f48`; decoder`8ec96effe00b38a3f96490b58af15ccff5f3882b8954d0cefd145de7363a3e53`; support`310ef675a65f3f3163d178475b75910633c88209c40d3e92a587d269a0df61da`.

Selected actual transaction hashes: checked cutover`0xa9c4e14b20a9fa36fb79707ba338ad14bccc35f97a28964018f7c5b3207a3d20`; Files cutover`0xe2a5389951c89b23d7d2365bf8eb0021c434118ddbd243d2e2e847f7601fb4f5`;64-record refusal`0x8461976ca5374ca995a65eb1d1a648ea5b803102cfa4a04acd074f382f61b42f`; fresh joint`0x1a5c9643e20717c55a453cf48d706ec7eac534927c67ffdd1a8bf1e66b189e6a`.

Actual core runtime hash`0xd5f597832b62ff63b0c63010d3962e185ee823d17ef60be7cb73561436a7f17b`; replacement`0xae3f6fc88d79bac7fd58e69484724d2e0e3a03a438221a2844f0e4ff252658aa`; Files replacement`0x30321f5db72d46de22682499e4e19af01ea7d0248b32e3973685a892da67c62d`. Source/constructor-specific decoder hashes are in `helpers`; all are4,359bytes. Fresh follow-up PublicationSupport observed/pinned codehash`0xb9990703ddac3782512d6c9d4758b9ce2a01f15a369c0d028ccac62d0880f154`,5,684bytes. Physical profile is `efs.lab.index-layout/3:inline-singleton:five-u48:header-u64-u64-u48-u16:genesis-shadow-replay`; callback profile is `efs.lab.index-callback/1:ordered-prefix:static-final:canonical-replay-final`.
