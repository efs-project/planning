# Live-file experiment without a new kernel storage mode

> Staged, not dispatched. Follow the active full-model cost work; one implementation/build/new-world owner. Use `superpowers:subagent-driven-development`, actual-behavior TDD, independent review and root reproduction. This is a disposable native-profile experiment, not full-v2 parity or a permanent backing ABI.

**Goal:** prove that an ordinary EFS path can expose existing contract state without publishing a duplicate Record on every application update. Price registration, actual application writes, paid readers and optional snapshots; make the history/index tradeoff visible in a clickable browser.

**Architecture:** keep the native Record kernel, Files, mandatory navigation and optional discovery contracts unchanged. A separately registered exact descriptor Type identifies a live read. A small immutable adapter interprets it and performs one bounded typed `STATICCALL`. Existing stored quote files continue to return stored values. The descriptor is immutable data; the observed value is not that Record's content.

**Stack/control:** source-backed native prototype `4cb004273982411d4699fa15d388750638cd1358` in the authorized existing experiment branch, Solidity0.8.30/optimizer200/viaIR/Cancun, Foundry, native SDK and static SPA. Freeze the then-reviewed native control and artifacts at dispatch. Do not change the full-C0 worktree or any of the three preserved demos. No public deployment/funds, production repos, migration, protocol freeze or URL parser.

## Task 1: Scalar stored/live adapter and end-to-end comparison

### Exact scope and discriminator

- [ ] Freeze control/source/compiler and ordinary runtime24,576/initcode49,152/transaction16,777,216 limits before edits. New helpers, consumer and a separate browser experiment are allowed; existing kernel/Files/navigation/discovery contracts and their public behavior must remain unchanged.
- [ ] Register a distinct descriptor Type through `ExpandedTypeRegistry.register` using its existing supported `RawBytesValidator`. Do not interpret `FileInfo.live` as this backing kind: that field means not unlinked. Exact Type ID selects the new profile; unknown Types keep their existing exact-byte handling.
- [ ] First profile fixes `values(bytes32) -> uint256`. Descriptor is exactly224 ABI bytes: domain/version, chainId, adapter, provider, providerCodehash, key, returnType. Address words must be canonical. Pin an exact source-backed non-proxy provider/profile and actual adapter dependency graph; a hash asserted inside a descriptor is not sufficient qualification.
- [ ] State the admission boundary in code, SDK and report: the existing raw-byte validator validates representation only, **not descriptor semantics**. The adapter validates the complete descriptor on every qualified read. A malformed descriptor can be stored but cannot become a successful LIVE result. This does not implement arbitrary developer validation or the canonical full-v2 Type interpreter.

### Real RED and read behavior

- [ ] RED: create an actual descriptor-backed file through the unchanged `NativeKernel.createFile`, then positively assert that opening it returns the independently observed provider value. Against the existing quote reader this must fail with `UnexpectedType`; an `expectRevert` compatibility check alone is not RED. The candidate adapter must make the positive workflow pass. Separately retain the old reader's honest refusal. Missing symbols/import failures are not the RED.
- [ ] Resolve ordinary owner/path -> `FileInfo` -> verified `readRecord` through existing public APIs. Explicitly dispatch the existing exact uint256 STORED Type or new LIVE descriptor Type; reject directories, unlinked/missing files and all unsupported Types. The result carries backing kind, file ID/revision, selected descriptor/content Record ID, output Type and value. Never call a live descriptor ID the value's content hash.
- [ ] Use a fixed, documented gas budget and a32-byte output buffer for the provider `STATICCALL`; require success and exact32-byte returndata before decoding. Do not allocate/copy arbitrary failure or success bytes. The adapter is the provider's immediate caller; neither namespace ownership nor an RPC `from` field changes that. No arbitrary calldata, recursion, provider callbacks from ingestion or permission grants.
- [ ] Test valid zero, nonzero, wrong domain/length/chain/adapter/provider/hash/return Type, noncanonical address words, missing/substituted code, revert, gas exhaustion and short/long/very-large returndata. Zero is a successful value, never a missing-file sentinel. Failure must not fall through to another file or become empty content.
- [ ] Test an intentionally caller-sensitive provider via an explicitly separate test profile. Browser and paid independent consumer must use the same adapter call path; a direct provider call is not interchangeable. Include same-transaction update->read and explain that it observes current call state, not necessarily final block state.

### History, navigation and browser qualification

- [ ] With `Examples.sol::PlainQuoteMapping` as actual application state, change a value without any EFS call. Assert changed LIVE output but unchanged file revision, Record inventory, navigation and discovery. `QuoteProducer` alone is not this state baseline: it only publishes EFS Records.
- [ ] Descriptor replacement uses existing revision CAS; exercise rename/unlink and retained descriptor history. Do not fabricate historical provider values from old descriptor revisions or current provider state.
- [ ] Keep discovery descriptor-based. The current scalar equality index must not silently index live outputs. Complete directory membership is not complete live-value filtering; expose such filtering as unsupported in this slice.
- [ ] Add a separate native static-SPA experiment view: stored/live examples together, a small Live label, value, descriptor revision and observation basis. History says descriptor history. Disable ordinary text editing/conversion of LIVE output; opening/refreshing performs no transaction.
- [ ] For this new read path, use supported block-hash calls consistently for dependency qualification, path/Record selection and adapter evaluation, with declared `from`/execution parameters. Refuse unsupported basis; don't silently downgrade to current-block calls. Test provider mutation between calls and stale/reorged basis. Existing native block-number-plus-hash-check qualification remains its separately labelled historical profile.
- [ ] Optional Save snapshot is explicit paid creation of a **separate** immutable observation Record/file, preserving exact value, descriptor identity and observed source/basis. Label RPC observation versus proof. Its raw representation validator does not prove the source observation; do not imply onchain authenticity from storing the snapshot. Later provider updates leave snapshot bytes unchanged; failed publication rolls back normally. Download is a labelled observation, not an unqualified historical file.

### Honest economics and release

- [ ] Use two matched fresh worlds with identical application `PlainQuoteMapping.set` values. Control additionally republishes stored quote bytes; candidate registers a live descriptor once and does not republish. Price both control receipts where two transactions are used; disclose that this control is not atomic. Keep any same-transaction test separate from that cost comparison.
- [ ] Include fresh/steady application writes, stored/live file registration, descriptor change, adapter/consumer/Type deployment, paid independent cold read and bounded1/8-read cold/warm calls. Do not compare `eth_call` estimates with paid receipts or call zero EFS writes zero total gas. Include optional snapshot cost and source-qualified browser RPC/bytes.
- [ ] Preserve the history difference explicitly: stored control retains each published value; live candidate retains descriptors and explicit snapshots only. No automatic EFS value-change events, live-value index maintenance, archive-state guarantee, proxy-following policy, cross-chain onchain reads or writable virtual devices.
- [ ] Source/support freeze before exclusive paired receipts; preserve source/runtime/calldata/receipt and same-basis read evidence under bounded output caps. Full native Forge and explicit existing Node/Chromium regressions plus actual new browser journey, exact module sizes, independent spec/quality/evidence review and root reproduction. Report failures/regressions as well as the headline.
- [ ] All finite worlds close with exact owned cleanup; preserve all demos. Publish code on the existing experiment branch and concise results on planning/main. Only launch a new demo if explicitly coordinated with root; don't multiply long-lived Anvil worlds.

## Why this is a profile before a kernel feature

The existing kernel already stores typed immutable descriptors, and Files already supplies naming, revisions and navigation. A read adapter can add live interpretation without changing those storage contracts. If the experiment finds a missing generic primitive, document its concrete failing workflow before proposing a Core change. Exact backing identity and useful defaults belong in the SDK; pretending every file has the same permanence does not.

Source preflight identified `NativeKernel.createFile/fileInfo/editFile/moveFile/unlink/revisionAt`, verified `NativeRecordKernel.readRecord`, `ExpandedTypeRegistry.register`, `Examples.sol::PlainQuoteMapping`, `web/app.mjs::open`, native client observation and graph qualification. This plan implements the bounded slice of [[2026-09-12-efs21-live-contract-files]], whose primary sources and design review are retained there. No implementation or saving is claimed yet.

Independent plan review approved after correcting the TDD step to require a failing positive workflow assertion, not a passing expected-refusal test.
