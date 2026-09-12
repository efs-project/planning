# EFS 2.1 practical filesystem experiment

2026-09-11 · v2 PM · experimental, not a protocol ruling

James authorized an overnight implementation pass: make ordinary contract and browser filesystem operations feasible; separate kernel from indexing contracts; measure actual operations; disclose sacrificed guarantees. Existing normative v2 designs remain the reference, not silently superseded.

## Latest in plain English

- **The fuller model is cheaper, but still expensive:** the seven-record create is5.90M gas including content staging, down from7.77M. Successful paired data/index/Lens results match; direct application changes callback visibility and late-failure costs. This is not an adoption ruling or universal equivalence.
- **Useful contract filesystem operations are working in a narrower model:** a producer publishes`/swaps/eth-usdc`; an unrelated contract reads it. The latest native retained update is226,667gas and its paid reader76,060. Required navigation and configurable discovery are real separate contracts, but generic Record storage is still being separated from Files. Richer full-v2 identity, acceptance and Lenses are not silently included in that price.
- **Storage tradeoffs are measured, not assumed:** the reviewed hybrid reduces a4096-byte zero Record admission990,892→200,375gas, but its paid read85,373→396,952. A41-byte file edit slightly regresses241,339→242,500. Different representations preserve exact bytes/IDs while having different economics; no100-year write-policy choice has been made.
- **Reads need further work:** full-model batching lowers eight small paid Record reads453,212→283,890gas. Actual Files anchor batching cuts RPCs6.5–8.7%, but delayed browsing becomes1.2–1.5% slower and sends more bytes. It is not yet a UX-speedup recommendation.
- **Try the preserved browser:** [native candidate](http://127.0.0.1:54154), frozen source`c088363`, has real local-contract create/read/edit/rename/unlink/history/reload tests in Chromium. It does not silently inherit later storage experiments. Fable60731 stays untouched. Both need this laptop/process running; native has an18-hour watchdog from its September11 evening launch.

**Next engineering gate:** extract actual Record ingestion and mandatory by-Type inventory into separate contracts, keep Files/navigation/configurable discovery usable, and price the extra calls. Full-model Envelope byte storage has a separately reviewed plan. No feature sacrifice, production deployment or protocol freeze is implied by either experiment.

## What we are comparing

1. **Fuller C0/Files control:** the preserved Files prototype at `e38b5e3c1e8f8a32080458174d321d6a43b2ac5b`. Its seven-record create costs 7,688,694 gas in the retained matched type-cache run. This is a named measured workload, not a universal lower bound or proof that every v2 design requirement is implemented.
2. **Compact native candidate:** separate-storage kernel and mandatory navigation index; immutable typed bytes, stable file identity, revisions, authenticated namespace writes, CAS, paths, rename/remove, and bounded same-call listing. A producer contract writes `/swaps/eth-usdc`; another reads it. This tests physical encoding and native caller admission, not full v2 semantic parity.
3. **Configurable discovery:** subsequently pressure late index declaration/backfill, withdrawals/edits during coverage, and mandatory-versus-optional failure policy. No COMPLETE assertion until its actual universe is covered at the queried basis.

Code lives in the disposable `codex/efs21-pragmatic` worktree, sibling `planning-efs21`. Preserve the existing Fable worktree, its untracked brainstorm, and the live browser on port 60731. No migration, production repository, public deployment, paid transaction, or frozen ABI.

“Full-v2 arm” below means the existing fuller prototype, not a completed 50-year protocol. It has richer Types/Bindings/Lenses and routed author verification; its current author intents are bound to a chain/execution context. Independently portable authorship proofs, recovery and all design-level acceptance requirements must not be assumed proven in either arm merely because its bytes and exact IDs can be exported.

## Non-negotiable experimental checks

- Native `msg.sender` authority is labelled chain-qualified; never `tx.origin`, never presented as a portable author signature.
- A content hash authenticates bytes, not present authority or availability. Current reads name a chain/block basis.
- Invalid data, stale revisions, unauthorized writes, and mandatory-index failures revert the whole operation.
- Separate index code must use separate storage and ordinary calls, not delegatecall into kernel storage.
- Exact typed bytes and historical revisions survive rename, edit and unlink. Unlink is not destruction or semantic revocation.
- Limits, missing capabilities and cheaper-profile losses are visible. No green parity claim from a stripped-down key/value demo.
- Small local runs only; no full SSTORE traces or unbounded Anvil history. Stop new heavy work if free disk falls below 20 GiB.

## Work order

1. Implement and adversarially test a compact native kernel/index pair.
2. Run receipt-based first-use, steady edit, rename, unlink, directory, tag/index and contract-to-contract benchmarks; compare like-for-like where possible and explicitly distinguish different profiles.
3. Connect a separate local static browser and action-cost display to actual deployments; preserve the existing demo.
4. Attack index coverage/lifecycle and qualify developer-facing results; independently review the candidate.
5. Report gains, losses, remaining gaps, and the smallest decisions required to proceed. Investigate full-v2 counter/mirror reductions separately if time permits.

## Checkpoint

Isolated worktree created; implementation is underway. Unchanged control: 29 targeted kernel tests, followed by the full 201-test C0 Forge suite, passed with zero failures. The first independent review tightened validator restrictions, exact inventory populations, edit-sensitive pagination, and explicit namespace/name semantics. Overnight continuation is active until 09:00 America/Chicago on September 12. This document will carry results and exact experiment commits as they land.

**First working slice, `aa6b1b6`:** compact native kernel, independent required navigation contract, retained Type descriptors, immutable bytes/history, paths/CAS, and real producer/consumer Solidity examples. Root reproduced all 47 tests, including 128 seeded fuzz cases. Independent review approved progression to receipt/browser testing with no blocking defects; one nonblocking cursor-test strengthening remains. Runtime sizes: kernel 9,236B, index 4,966B, registry 2,480B. Real receipt economics and clickable browser are now being implemented; neither is claimed complete.

**Known control limitation remains:** passing those 201 control tests does not resolve the previously reproduced legal large-Type cache rejection. A valid schema can compile beyond the single code-blob ceiling. Full-profile cache/body storage work must retain or explicitly recover support for legal schemas; the native two-validator experiment does not solve the full Type language. [Retained boundary case](https://github.com/efs-project/planning/blob/aa6b1b62b733209aa5879743e81fd1f3a9143f8a/Reviews/2026-09-09-files-browser-mvp/type-cache-boundary-2026-09-11.md).

**Receipt/browser slice, `df82bbc`:** two fresh local-chain benchmark runs agree, and root reproduced all four Node/browser tests. The browser performs actual nested create/open/edit/rename/reload/history/binary-upload/unlink operations. Independent review found two important failure-path bugs before launch: ambiguous transaction transport must retain a hash and reconcile, and failed navigation must invalidate the old writable folder. These are being fixed; no ready-to-click approval yet. No candidate persistent server has been started, and the existing 60731 world remains untouched.

**Review closure, `bfddce3` / `3269c99`:** both findings are fixed and independently approved for this isolated prototype. Unknown submissions retain the locally computed transaction hash, survive browser reload, block further writes, and reconcile through read-only exact-block effect checks. Failed or changing routes cannot reuse an old writable folder. The floating cost drawer now includes running totals and unresolved/unknown-cost counts. Root reproduced all **six** integration/browser tests with serial execution so tests use one fresh Anvil/build at a time. The original receipt JSONs remain their explicitly pinned earlier checkpoint; contract sources have not changed yet. A same-profile history-storage implementation is now underway, before final candidate launch.

| Native candidate workload | Actual receipt gas |
|---|---:|
| First 41-byte file with cold caller/list state | 640,934 |
| Subsequent new unique 41-byte file | 604,894 |
| Second file reusing the same typed bytes | 424,638 |
| Fresh-content 41-byte edit | 350,271 |
| Same-content edit, still retaining a new revision | 163,536 |
| Move and rename | 240,871 |
| Unlink | 134,942 |
| Producer contract's new uint256 value | 284,631 |
| Plain mapping new value (fewer semantics) | 26,966 |

These are native-profile receipts, not Forge test gas or full-v2 parity savings. A 41-byte payload currently becomes a 128-byte ABI-framed typed body. The under-1M short-create ambition is met; the under-250k fresh-edit ambition is **not**. Same-content dedup is not substituted for that edit workload. Kernel deployment including its required index/registry costs 3,723,287 gas, separately from user operations. [Detailed workload, read costs, exact evidence and limits](https://github.com/efs-project/planning/blob/df82bbc/Reviews/2026-09-11-efs21-pragmatic/README.md).

### Same-profile history optimization, reviewed

`3dac3b5` / `d757d5c` / `bf566dc`: immutable location snapshots replace duplicated parent/name data in every edit/unlink revision. The public ABI, historical values, IDs, validation, authority, CAS, required indexes and events stay the same. Independent review approved the change; root reproduced all **56 Forge tests and seven serial Node/browser tests**, with ordinary bytecode/gas ceilings. The earlier cursor-test strengthening is included. Existing Fable server on 60731 remains running and untouched.

| Same-input paired workload | Original native | History-sharing native |
|---|---:|---:|
| Producer contract's fresh uint256 update | 284,631 | **237,597** |
| Separate consumer transaction | 77,277 | 77,277 |
| 41-byte fresh-content edit, short name | 350,271 | **303,237** |
| 41-byte fresh-content edit, 64-byte name | 399,136 | **303,237** |
| Same-content edit, short name | 163,536 | 116,496 |
| Unlink, one-byte name | 134,942 | 107,781 |
| Create 41-byte file, one-byte name | 597,694 | 597,995 |

The contract-produced small update meets the provisional 250k ambition; the ABI-framed file edit still misses it. Historical `revisionAt` read estimates increase by 157 gas. These are real same-profile savings, unlike comparing this reduced profile wholesale to full v2. Creation is slightly more expensive; names and history were not removed. [Paired receipts, exact source pins and semantic checks](https://github.com/efs-project/planning/blob/bf566dc/Reviews/2026-09-11-efs21-pragmatic/evidence/history-storage.md). A minor review clarification distinguishes Forge's inventory/event differential checks from Node's 50 selected-file/history/listing snapshots.

### Configurable discovery, reviewed

`f78a42a` / `84cc198`: the native kernel now has a separate immutable optional-discovery contract in addition to required navigation. A namespace owner chooses one exact uint256 equality index and whether maintenance failure must reject the write or may instead make search unavailable. Late attachment/backfill, edits/unlinks during coverage, fresh-epoch recovery and qualified pagination are implemented. Independent review approved; root reproduced **68 Solidity and ten serial Node/browser tests**, then the added 64/65-position boundary regression. A benchmark guard now explicitly refuses an incomplete source scan; retained 37-position receipts remain unchanged and qualified.

Actual costs: the producer's no-profile update is now **245,563 gas**, including **7,966** for the notification seam. A direct scalar update is **241,218 without a profile / 344,661 with the optional index**. The 103,443 premium buys maintained lookup; it is not imposed by unrelated callers. In a source of 37 created positions (33 currently eligible files), the eight-match query returns FileIds with one eth_call instead of 72 for the straightforward uncached source scan. It is not a hydrated query or a comparison against an optimized batched scan; summed independent estimates are not one onchain transaction's gas. [Full paired costs, coverage and failure evidence](https://github.com/efs-project/planning/blob/f78a42a/Reviews/2026-09-11-efs21-pragmatic/evidence/discovery.md).

Required failure rolls back the whole file operation. Tolerated child failure rolls back index maintenance, persists DIRTY and suppresses stale/complete-result claims until a fresh rebuild. Failure of the trusted outer coordinator itself still rejects the file operation. This is a scalar current-file experiment, not yet image tags, full-v2 occurrence indexing, or a browser search UI.

### Full-C0 journal allocation, reviewed

`e6c1c96` / documentation qualification `e605fc9`: the full seven-record Files implementation now allocates only its journal's pointer backing upfront, rather than also constructing thousands of unused default structs. The pinned compiler test confirmed **287,520 fewer temporary bytes** for seven fresh leaves. All storage rows, indexes, Types, before/after values, journal ordering and validation remain unchanged. Independent review approved; root reproduced **209 C0 Solidity tests and six paired-evidence checks**, and independently rehashed the current production source against the retained measured source pin.

| Same full-profile workload | Control receipt gas | Candidate receipt gas |
|---|---:|---:|
| Seven-record 41-byte create | 7,620,832 | **6,622,789** |
| Complete create including separate chunk staging | 7,770,201 | **6,772,158** |
| Three-record 41-byte edit, excluding staging | 3,610,796 | **3,313,533** |
| Steady two-record tag | 2,503,157 | **2,324,116** |
| Same-label Binding rebind | 2,240,814 | **2,062,226** |

This saves **998,043 gas on the create admission (13.1%)** without dropping those semantics. Final inventories match across the fresh pair: 80 records, 84 occurrences, 22 bindings and all 257 posting keys/words; only explicit executable provenance differs. Selected binding/Lens reads are also checked at receipt-block bases; the create's charter binding is covered by final inventory rather than an extra per-operation Lens assertion. Exact ACTIVE retry regresses by 12 receipt gas (36 after accounting for its calldata difference), reported rather than hidden.

The admission library shrank from 24,565 to **24,481 bytes**, leaving only 95 bytes of code-size headroom. The implementer also ran 19 foundation Solidity tests and 140 Node tests in an explicitly documented aggregate after resolving a missing locked dependency. The known large-Type chain target remained skipped/unfixed; local RPC observations are not state proofs. [Exact evidence, source/runtime pins, failure-path coverage and limitations](https://github.com/efs-project/planning/blob/e605fc9/Reviews/2026-09-11-efs21-pragmatic/evidence/journal-allocation.md).

Full-profile writes are still too expensive to call this finished. Raw-payload results follow below; physical full-v2 separation and further storage reductions remain separately measured changes. Broader acceptance/authorship remain distinct experiments, not implied by native savings. Existing Fable world remains untouched.

### Explicit raw-byte representation

Implementation `1254c22`, evidence `a9a064e`: both fresh worlds use the same expanded registry/build, original exact validator identities and discovery settings. A new raw-byte Type stores exactly the payload; the existing canonical bytes Type still stores its ABI framing. No old record is reinterpreted.

| Matched native workload | Canonical bytes | Raw bytes |
|---|---:|---:|
| Fresh 41-byte file create | 645,501 | **598,309** |
| Fresh-content 41-byte edit | 311,203 | **264,011** |
| Same-content edit, still a new revision | 124,461 | 121,672 |
| Separate payload consumer transaction | 158,325 | 153,410 |
| uint256 producer update | 245,563 | 245,563 |

The SDK/browser knows the exact Type when interpreting current and historical bytes. Creation offers the representation explicitly; editing preserves it unless deliberately converted. Empty and binary files round-trip; unknown Types remain exact-byte downloads without a guessed text editor. Raw 4096 versus canonical rejection is a capacity difference, not a savings pair. A new nonzero 4032-byte raw record still costs roughly 3M gas before file placement: encoding alone is not the large-content answer.

Root reproduced **74 Forge and 23 serial Node tests**, including actual Chromium actions and all earlier ambiguity/navigation regressions. Independent review checked all 150 retained receipts, pairings, runtime/source pins and cleanup and found no functional defect. It raised duplicated registry logic constrained by frozen validator metadata. Controller accepts that maintenance exception **only for this disposable comparison**; production needs one maintained implementation with deliberately specified validator identity. This is not an unqualified production-quality approval. [Exact evidence and limitations](https://github.com/efs-project/planning/blob/a9a064e/Reviews/2026-09-11-efs21-pragmatic/evidence/raw-representation.md).

The local host snapshots its closed assets/config before listening, so subsequent code work cannot silently change a running world's client. Candidate [localhost:54154](http://127.0.0.1:54154) is running from `c088363`; root checked its HTML/config responses and exact raw/canonical Type IDs after launch. The independent review's minor import-diagnostic finding is fixed in `aae54ea`; its scoped re-review accepted the documented disposable-only maintenance exception. Fable's 60731 world is unchanged. Direct application is isolated in sibling `planning-efs21-direct`, branch `codex/efs21-direct-apply`, beginning from the retained lazy-journal control `e605fc9`.

### Full-C0 direct application, reviewed

`67f11f7`: the fuller kernel now applies ordered assignments immediately and relies on EVM rollback, replacing the separate in-memory journal/replay. It preserves the current pinned preparation helper, stored facts, packed rows, ordered postings and successful selection behavior. This is a separate experimental code branch, not a change to either live browser. [Implementation and detailed boundary report](https://github.com/efs-project/planning/blob/67f11f7/Reviews/2026-09-11-efs21-pragmatic/evidence/direct-apply.md).

| Same fuller-model workload | Lazy journal control | Direct candidate |
|---|---:|---:|
| Seven-record 41-byte create admission | 6,622,789 | **5,753,318** |
| Complete create including content staging | 6,772,158 | **5,902,687** |
| Complete three-record edit including staging | 3,462,914 | **3,106,949** |
| Steady two-record tag | 2,324,104 | **2,080,617** |
| Binding rebind | 2,062,226 | **1,839,258** |
| Late-reference rejection | 684,146 | **1,367,166** |
| Oversized cache followed by invalid reference | 8,749,191 | **12,081,802** |

The create admission saves another **869,471 gas (13.1%)**. Its staging and calldata intrinsic gas are unchanged. The steady tag has a 12-gas intrinsic difference, retained in the detailed evidence. The admission library shrinks from 24,481 to **19,921 bytes**, giving 4,655 bytes of ordinary code-size headroom. That room is useful for later decomposition but is not itself a new feature.

Fresh paired worlds retain identical complete inventories—82 records, 64 envelopes, 22 Types, 87 admissions, 65 batches, 259 posting keys and 22 bindings—after only revision-specific authority implementation hashes are qualified separately. Per-operation receipt-basis Binding/Lens results, cache bytes, helper creation order and nonce agree. Independent review checked all 190 raw transactions and current source/support pins. A review finding hardened the comparator to reject a helper hash or the wrong revision's Core hash before normalization.

Root reproduced **206 candidate Forge tests and nine offline evidence checks**. This is not 209 unchanged tests: 15 old journal-allocation/strategy tests remain untouched but excluded in this branch; 14 existing consumers use a narrowly adapted rejection helper; other existing assertions remain; new boundary cases and inherited executions are enumerated in the report. Final rollback and ordinary single-fault selectors stay checked. Pre-existing compiler warnings and the legal large-Type cache failure remain named rather than hidden.

**The tradeoff matters:** later invalid inputs can cost more because attempted writes precede rollback, and compound faults can change which error wins. Earlier provisional rows become observable during test-injected preparation. The existing journal also exposes an applied prefix during its cache-deployment replay; neither strategy proves universal callback isolation. Current production preparation is pure/argument-driven and cache creation returns inert code. A future state-reading developer validator or external index hook requires an explicit prior-state/staged-state policy and separate tests. Full-state, authorization-nonce and new-cache rollback passed, including the named nested-call counterexample; this is not a general reentrancy proof.

Both finite benchmark nodes stopped and their owned caches/build directories were removed. The code branch is pushed; no normative design, migration or live-world replacement was made. The next byte-storage arm stays isolated from this fuller-model branch so its effects can be measured independently.

## How to interpret a cheaper result

Some differences are deliberate profile choices; others are merely unimplemented features. Do not confuse them:

| Difference in the first native candidate | Meaning |
|---|---|
| Native caller admission instead of stored portable application signatures | Different authorship-evidence profile; typed content may still be portable. We must measure a signed/compact-evidence extension separately. |
| One live placement, immovable directories, terminal unlink | Bounded experiment scope, not proof that aliases, directory moves or restore are unaffordable. |
| Small enforced stateless validator set | Testable acceptance discipline; **not fulfillment of the arbitrary developer validation requirement**. Broader rule identity and mutable dependency handling remain work. |
| No multi-principal Lens composition yet | Does not establish that Lenses must be sacrificed. A qualified composition test must follow. |
| Inventories require a known namespace owner or exact TypeId | Current native state APIs enumerate those scopes, but do not enumerate all namespace owners or all registered Types from the Kernel address alone. Do not claim seed-free whole-world recovery; separately price a minimal global seed inventory if that guarantee is required. |
| No generalized write-free journal replay | Candidate relies on EVM transaction rollback plus explicit CAS. Need to separate protocol-required behavior from implementation-specific journal machinery. |
| Separate contract holds required navigation indexes | Still mandatory for writers. Physical separation alone will not remove index storage costs. |

A read-only engineering review found a concentrated full-C0 extraction seam: store-row reads/applies plus two posting read primitives. That offers a later **same-semantics, separate-storage control**. It should preserve every family first and measure the extra call overhead before dropping mirrors/counters or changing coverage claims. Bytecode size and deployment/qualification changes are its early gates. The [[2026-09-11-efs21-full-model-storage-preflight|refreshed direct-arm preflight]] replaces the stale journal/replay assumptions and records provisional-state observation, cross-account rollback and the distinction between physical posting separation and a generic ingestion kernel. It is source analysis awaiting an implementation plan, not a measured gas saving.

Native authority does not mean EOA-only: the demonstrated producer contract owns its namespace, not the EOA invoking it. A smart account could similarly own a namespace and manage its own keys/permissions; that wallet integration and recovery workflow have not been tested here. This still does not supply EFS's portable Principal/authorship evidence or cross-deployment identity model.

The smaller candidate should also be read as a **Files profile**, not a filesystem-shaped replacement for every kind of EFS data. The [[2026-09-11-efs21-native-kernel-extraction-preflight|native boundary preflight]] proposes a generic Record kernel plus mandatory Record inventory, with Files ownership/history/path state in the existing facade and Navigation/Discovery separately stored. A forwarding shim can preserve the browser API while exact constructor/runtime/dependency pins change. This is not implemented or a claimed gas saving. Full structural Type validation and compact portable authored admission need distinct measured arms; neither is established by today's three-runtime native profile.

## Why a file currently has seven records

Seven is the existing Files profile's publication template, **not an Ethereum requirement and not seven copies of the payload**. The current SDK emits:

| Logical fact | Why it exists in the full profile |
|---|---|
| ObjectGenesis | Stable File identity independent of a name or content revision. |
| Charter BindingSet | This author's selected charter for that Object. |
| ChunkTree | Exact content size/chunk commitments, separate from where bytes are obtained. |
| FileRevision | This File's immutable revision, content reference and media metadata. |
| Head BindingSet | This author's choice of the current revision. |
| DirectoryEntry | The immutable assertion that a parent/name refers to this File. |
| Name BindingSet | This author's selected entry at that parent/name position. |

[Exact create/edit templates](https://github.com/efs-project/planning/blob/e38b5e3/Reviews/2026-09-09-files-browser-mvp/sdk/files-actions.mjs#L144). Edit creates three metadata records, not all seven again; rename/move has a different four-record template. Actual content staging is separate.

The purpose of those separations is real: names can change without changing file identity; content can change without rewriting history; different authors can publish different selections; the same bytes can have different placements and storage providers. **That does not prove each fact needs its own expensive row, envelope bookkeeping and every index.** The cost census shows 48 Record slots for the seven records, while the complete create also writes admission, lifecycle, binding, envelope and posting state. [Retained census](https://github.com/efs-project/planning/blob/e38b5e3/Reviews/2026-09-09-files-browser-mvp/gas-baseline-2026-09-10.md#33-slots-by-family--createdir-createdir-1-and-createfile-createfile-1).

Our next choices should separate three questions:

1. **Meaning:** which independent facts must survive? Removing per-author selection, independent placement or retained revisions changes what apps can express.
2. **Representation:** can the same facts share immutable storage, use compact encodings, or avoid allocating a worst-case planning buffer? These are candidates for same-behavior savings.
3. **Discovery:** which collections must every writer maintain, and which should the paying namespace/profile opt into? Moving a collection to another contract does not itself remove its writes.

The native prototype collapses several of these into dedicated filesystem state and accepts the authenticated calling account instead of portable authored publications. Its much lower cost is evidence that practical contract filesystem operations are possible, **not evidence that full-v2 portability and plural selection are free or unnecessary**. History-sharing has now separately demonstrated a representation-only saving. We need similarly explicit tests for broader validation, portable authored admission and optional discovery before recommending a replacement foundation.

## Logs are useful, but a different read surface

One premise in the discussion needs narrowing: light-client verification of logs is not fundamentally impossible. Ethereum commits receipts into the block's receipt trie, and receipts contain logs; receipt inclusion can therefore be checked against an authenticated header with the required proof data. This is distinct from trusting an `eth_getLogs` response. [EIP-2718 receipt commitment](https://eips.ethereum.org/EIPS/eip-2718#receipts).

The standard filtered-log response does not itself prove that the RPC returned every matching event. Nor does an inclusion proof for a few returned events prove query completeness. My engineering conclusion: logs are useful for optional discovery/change hints, followed by canonical state checks; they must not silently substitute for an authoritative complete listing. [JSON-RPC filtered logs](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs). EIP-1186 supplies account/storage proofs, not a complete filtered-log proof API. [EIP-1186](https://eips.ethereum.org/EIPS/eip-1186).

For tonight, basic contract operations and browsing remain state-readable with no logs service. A future optional event-backed search can improve UX without changing the meaning of the underlying file data. No prototype state-proof implementation is claimed here.

That native browsing claim assumes known namespace/Type seeds. Source inspection of `NavigationIndex.fileInventory(owner)` and `typeInventory(typeId)` found no global owner/Type enumeration API; the registry also has keyed lookups rather than a global Type list. Losing every seed/catalog is therefore a different recovery test from reopening an exported file or a known account. A later experiment can measure a once-per-owner/Type seed inventory instead of silently replacing this obligation with historical-log availability. No cost or implementation result is claimed yet.

## Cost levers to investigate without dropping meaning

- **Native history snapshots:** implemented and independently reviewed above; same historical values, lower edit/unlink receipts, slightly higher creation and historical-read cost. Still experimental, not adopted storage layout.
- **Raw payload representation:** implemented and measured above, separately from storage compression. The new Type avoids persisting inner ABI framing; it has different exact Type/Record IDs and never reinterprets old records. Empty raw bodies also prove that a nonempty-body presence shortcut would be invalid.
- **Stateless priority reader:** a small ordered-namespace, whole-path Lens can add useful contract composition without adding writes. It is not yet full per-segment/whiteout/threshold Lens parity.
- **Full-v2 planning allocation:** implemented, measured and independently reviewed above. The unchanged `fresh * 256 + 5` capacity now avoids eagerly constructing unused five-word structs; seven-leaf creation saves 998,043 receipt gas in the matched run. This improves the fuller control before physical index extraction; it does not remove the journal or its semantics.
- **Full-profile byte placement:** the retained full create-file census has 48 Record slots: 21 row/header slots and 27 body-data words. Its unsigned envelope adds a further payload. The prior Type-cache optimization already demonstrated immutable code-backed storage. The [[2026-09-11-efs21-full-model-storage-preflight|new source preflight]] proposes envelope-only first, then shared immutable Record/envelope bytes; the current combined payload bound fits10,497 runtime bytes including STOP. This is not measured full-profile savings. Preserve logical rows/IDs and price helper creation, zero-heavy cases, read integrity and ordered provisional dependencies. [Retained slot census at the prototype checkpoint](https://github.com/efs-project/planning/blob/aa6b1b62b733209aa5879743e81fd1f3a9143f8a/Reviews/2026-09-09-files-browser-mvp/gas-baseline-2026-09-10.md#33-slots-by-family--createdir-createdir-1-and-createfile-createfile-1).

The code-as-data idea is established prior art, not an EFS invention: Solady's SSTORE2 writes bytes into a STOP-prefixed contract and reads them with EXTCODECOPY. It does not prove savings for our exact workload; individual tiny deployments can be wasteful, and our Core proxy must not accidentally consume deployment nonces. [Solady SSTORE2 source](https://github.com/Vectorized/solady/blob/main/src/utils/SSTORE2.sol).

These are experiments, not adopted storage layouts. No projected gas figure here is a measured result.

### Narrowed followups after expert review

**Fuller-model reads:** source inspection found that every checked point/query entry repeats linked-code checks, execution-set reconstruction and local/peer configuration checks. External multicall alone still repeats that work. Lens resolution also reloads and validates the same plan per position. The smallest useful arm is a bounded typed `readMany` plus grouped resolution: check expected execution identity and admission high-water once, dispatch to existing checked readers internally, and load/decode a shared Lens plan once. Keep all per-record/occurrence/binding checks; cap cumulative work, body bytes and return bytes, not merely item count. Start with an experimental eight-request cap, then measure a gas-cap ladder. Late failure rejects the acquisition, never returns a shorter successful list. Raw-slot access can remain a separately labelled advanced diagnostic, not the everyday developer API. [Actual guarded entry points](https://github.com/efs-project/planning/blob/c088363/Reviews/2026-09-08-upgradeable-foundation/src/UpgradeableReadFixtureCore.sol).

Existing `pagePostingsHydrated` returns membership anchors, not complete resolved Files rows. The reader still needs name resolution, selected records, Object/charter evidence and sometimes bounded history. Bulk operations can reduce this to bounded dependency rounds; they do not automatically provide a one-call complete directory. Preserve all Lens combiners, historical bases, mount handling, unresolved rows and the SDK's sealed block-hash frontier. This preflight has **no measured read savings yet**. [Current Files acquisition](https://github.com/efs-project/planning/blob/c088363/Reviews/2026-09-09-files-reader/files-reader.mjs).

The first implementation is deliberately narrower: [[2026-09-11-efs21-checked-record-batch-plan|checked Record batching]], at most eight existing checked Record reads. Source`945ed6b`, evidence`8f101f1`, now independently approved and root-verified. A contract-facing current-state entry needs no preliminary context query; the SDK-facing checked entry adds exact expected-basis preconditions. Both validate execution once and return basis with results. The existing8192-byte per-record bound limits the largest return to67,264 ABI bytes /134,566 bytes including the measured complete JSON-RPC envelope. History and Lens work are excluded from that cap, not silently bundled into it. [Matched receipt and SDK acquisition evidence](https://github.com/efs-project/planning/blob/8f101f1/Reviews/2026-09-11-efs21-pragmatic/evidence/checked-record-batch.md).

| Actual same-transaction consumer | Scalar | Current batch | Interpretation |
|---|---:|---:|---|
| One short Record |176,045|180,783|Batch overhead loses for one.|
| Eight distinct short Records |453,212|283,890|169,322 gas saved, about37.4%.|
| Eight maximum8192-byte Records |5,754,391|5,691,560|Only62,831 saved, about1.1%.|

The scalar control already gets normal warm access within one transaction. Independent review reconstructed79 signed transactions, all16 workloads and1,345 SDK acquisition evidence records. All eight maximum bodies were legally admitted, not injected into storage. Actual maximum transaction/cumulative block gas9,020,440 fits16,777,216; the foundation's existing configured block ceiling remains33,554,432. Root reproduced206 C0 and29 foundation Solidity tests,42 reader tests, strict TypeScript, scoped formatting and ordinary size builds. Existing compiler warnings and the15 pre-existing direct-arm journal-test exclusions are disclosed.

SDK acquisition falls8→1 data RPCs for distinct IDs, but still has36 qualification and4 seal requests. Duplicate scalar reads already share a cache; batching does not make every case cheaper or faster. Maximum-body local timing regressed9.60→15.49ms in a single sample. Bad batch replies cannot leak a successful prefix or poison a later explicit retry; there is no automatic scalar fallback. Real Files directory integration follows its own measured gate.

The [[2026-09-11-efs21-files-anchor-batch-plan|Files integration]] is implemented at`dad1b27`, benchmark defaults corrected at`a68315f`, final evidence at`ab13d89`. Explicitly capability-qualified batches hydrate only source-checked anchor Records. Occurrence, Binding, Lens and charter checks remain. Frozen scalar and candidate browse the same deployed world/block. Independent review approved source/evidence after recalculating both retained runs,132 actual batches/600 assessed Records, all basis/order/content/source pins and oracle-equivalent rows. Root separately reran68 reader tests and27 explicitly selected browser/authorization/independent-effect regressions, all passing, plus strict TypeScript, runner syntax and whitespace checks. These are distinct from the worker's bounded202-test run (201pass/one pre-existing skipped large-Type chain canary); heavy legacy tracing/scale diagnostics are excluded.

| Names / page | Browse + seal RPCs | Median at50ms injected delay | JSON result bytes |
|---|---:|---:|---:|
|8 /4|92→86|1592.9→1611.9ms|59,590→61,358|
|8 /8|86→79|1219.0→1237.2ms|55,811→57,191|
|17 /4|173→161|2775.3→2811.8ms|116,102→120,150|
|17 /8|161→147|2008.5→2038.6ms|108,546→111,818|

Primary measurements use existing4096-request/16-inflight defaults, three paired samples per condition, with qualification36RPCs reported separately and four fresh seal calls per page included above. Eight/17names share two actual File nodes and shared author anchors, **not eight/17distinct Files**. The earlier512/four-wide run is retained separately as sensitivity, not presented as defaults. Request reduction6.5–8.7% did not become default latency reduction: delayed medians worsen1.2–1.5%, bytes grow2.5–3.5%. Same-scope rebrowse needs only fresh seals and no repeated anchor batch. Single-page scalar dependencies remain numerous. This argues for measuring larger bounded dependency rounds, not declaring RPC-count reduction alone a UX win. [Exact evidence and limitations](https://github.com/efs-project/planning/blob/ab13d89/Reviews/2026-09-11-efs21-pragmatic/evidence/files-anchor-batch.md).

An initial overly broad worker regression invoked legacy tracing diagnostics; it was stopped, its exact owned temporary data cleaned after exit and two rewritten historical JSONs restored. The replacement regression list excludes those heavy diagnostics. They are not counted as passing, and no claim is made that no trace was invoked. Root verification uses an inspected explicit suite list and an isolated build root; both existing demos remain untouched.

**Native immutable-body storage:** the next storage-only comparison should preserve exact Type/body/Record identity and public `readRecord` bytes, but store a new record's body in a STOP-prefixed bytecode object. Prefer one pinned kernel-only writer helper that executes CREATE in its own context; price its setup/call overhead rather than depending on kernel nonce behavior. Validate before deduplication, keep explicit empty-record presence, and retain history/navigation/discovery. Never accept arbitrary initcode or supplied pointers. Reads must bound allocation and check expected code shape; same-length substitution needs an explicit content-hash check or a clearly stated trusted-pointer boundary. Late failure must remove both metadata and newly created body code.

That three-arm experiment is complete and independently reviewed: implementation `5632fee`, evidence `58e61c4`. It compares original slot storage, slot storage with the same read-integrity hash, and always-code storage. Public Record bytes and exact IDs, validation-before-dedup, history/navigation/discovery, explicit empty presence and failed-write rollback remain. A pinned kernel-only helper creates inert STOP-prefixed bodies in its own account; reads reject malformed or substituted code. [Source-pinned receipts and boundaries](https://github.com/efs-project/planning/blob/58e61c4/Reviews/2026-09-11-efs21-pragmatic/evidence/body-storage.md).

| Safety-matched native workload | Slots + read integrity | Code + read integrity |
|---|---:|---:|
| Fresh raw 41-byte file edit | 264,011 | **263,457** |
| Fresh raw 256-byte dense file edit | 400,719 | **310,118** |
| Fresh raw 4,032-byte dense file create | 3,384,830 | **1,433,444** |
| Fresh raw 4,032-byte dense file edit | 3,083,783 | **1,132,496** |
| Producer's fresh uint256 update | **245,563** | 265,367 |
| Standalone 4,032-byte all-zero Record admission | **443,713** | 999,848 |
| Paid consumer, one 4,032-byte dense Record read | 360,212 | **87,426** |

The large dense edit is **63.3% cheaper**, with identical action calldata. These are native-profile results, not an equivalent full-v2 create or a claim that a zero-body admission includes file placement. Setup increases by420,269 gas over the hash-integrity control and is priced separately. A later source review narrows the earlier “safety-matched” phrase: both arms hash returned identity, but the old slot control copies dynamic bytes before hashing and does not prebound a corrupted length header. The new code reader does. Valid-body receipt arithmetic remains unchanged; this is not equality of every corruption guarantee. Tiny/zero-heavy regressions remain visible; all-zero slot words are cheap, whereas deploying bytes charges for zeros too. A length-only threshold is not supported.

Root reproduced **84 Forge tests, 25 serial Node tests**, scoped formatting and ordinary sizes. Independent review reconstructed all **591 signed transactions** across three fresh worlds, receipt/calldata/source/runtime pins, exact inventory membership, and all 60 candidate child objects/nonces. Corruption, empty bodies, duplicate validation, helper failure and late rollback are covered. Earlier evidence and validator identities are untouched; finite nodes and owned caches were cleaned. Kernel runtime/initcode is 10,909/25,429 bytes, helper 464/502; no ceiling was raised. The running native browser remains frozen at `c088363`, not silently switched to this experimental backend.

The next storage questions are deliberately separate: first [[2026-09-11-efs21-packed-presence-plan|pack explicit presence with existing pointer/length metadata]], then [[2026-09-11-efs21-hybrid-body-plan|measure a bounded slot/code policy]] using nonzero storage-word occupancy as well as size. Packing source/evidence`f43501a`/`b8896a7` is now independently approved: all60 fresh admissions save22,117–22,121 gas; all70 dedup actions regress12; rename/unlink are unchanged. Fresh raw41 create/edit are591,801/241,339; dense4032 edit1,110,375; contract quote update243,249; paid quote read76,393. These are matched native receipts, not full-v2 savings. [Full workload and limits](https://github.com/efs-project/planning/blob/b8896a7/Reviews/2026-09-11-efs21-pragmatic/evidence/packed-presence.md).

Root reproduced99Forge/27serialNode (60.815s), formatter and normal sizes. Independent review reconstructed394 signed transactions and120 retained code objects, source/runtime/layout pins and exact ABI/Type identity. Kernel runtime/initcode shrink4 bytes to10905/25425; setup saves852 gas. The inherited test counts and historical-versus-fresh benchmark distinction are explicit; no late-failure or missing/corrupt check was weakened.

**Hybrid body storage, reviewed:** source`064ea64`, final runner`310c8b8`, evidence`7db38cd`. Both fixed-word and code backends preserve exact bytes/Type/Record identity, bounded corruption checks, explicit empty presence, validation-before-dedup and late-failure rollback. A48-case calibration selected a fixed write-oriented occupancy heuristic; its full scan still costs gas even when code wins. Legacy code-only runners use explicit frozen replay or refuse the hybrid, never silently relabel it.

| Same-input paid operation | Packed code control | Hybrid |
|---|---:|---:|
| Fresh41-byte raw file edit |241,339|242,500|
| Dense4,032-byte raw file edit |1,110,375|1,152,848|
| Contract retained quote update |243,249|226,667|
| Standalone4,096-byte zero Record admission |990,892|200,375|
| One paid read of that zero Record |85,373|396,952|
| Two reads of it in one transaction |95,428|465,086|

These are not blanket savings:80of143 final operation rows regress against packed code. One exact heuristic tie picks a physical path5gas more expensive than the other forced path; actual hybrid dispatch makes its total230gas worse. Setup rises148,561gas. No assumed lifetime read count, policy adoption or full-v2 equivalence. [All paired results and source pins](https://github.com/efs-project/planning/blob/7db38cd/Reviews/2026-09-11-efs21-pragmatic/evidence/hybrid-body.md).

Root reproduced117Forge/33serialNode (77.654s), formatter/diff and ordinary sizes. Independent review checked736 signed transactions,324 body observations,5707 word-slot checks and218 source/support pins. Native runtime/initcode11592/26112 remain ordinary. Final CLI succeeded; its earlier module-cycle failure and a repaired derived-label bug remain disclosed, with initial receipts retained rather than rewritten. The fixture's permissive scan-elimination comment is a nonblocking wording follow-up; the actual retained scan is explicit in the report. Existing demos remain unchanged.

Generic ingestion extraction now has this reviewed base and a [[2026-09-11-efs21-native-kernel-extraction-plan|concrete reviewed implementation plan]]: Record storage plus mandatory inventory, Files facade plus required Navigation/configurable Discovery, qualified as an actual dependency graph. Separation itself may cost more; measure it. Full-model [[2026-09-11-efs21-envelope-storage-plan|Envelope byte storage]] is separately planned and not yet measured.

**Legal Type-cache support:** an additional source-only preflight found two separate expansion limits. A conservative bound for one current parser-legal Type's compiled ABI is 35,104 bytes, so two raw code segments would cover its size; that does not establish an attainable maximum or affordable admission. Independently, sixteen 64-field members can fit the canonical group-byte budget while their compiled ABI caches alone exceed the current 131,072-byte helper-output ceiling. This group case is a source-derived falsifier, not a reproduced receipt: compilation may hit gas first. Splitting the storage blobs alone does not fix it. [Current helper budgets](https://github.com/efs-project/planning/blob/67f11f7/Reviews/2026-09-05-c0-core/src/Preparation.sol).

The existing standalone compact-cache lab is therefore worth integrating as a separately measured candidate: its retained boundary cache shrinks from 24,960 to 5,536 physical bytes while reconstructing exact logical ABI. That is codec-only evidence, not current Core support or whole-admission savings. Raw segmentation is the smallest logical-format-preserving storage repair; compact caches may better address padded output/storage, but their encoding/decoding, helper-module identity, role/index header reads and group gas must all be priced. Neither result justifies silently reducing the Type language. [Retained codec evidence and explicit limits](https://github.com/efs-project/planning/blob/67f11f7/Reviews/2026-09-11-type-cache-codec-lab/README.md).

**Recovering richer acceptance in the cheap path:** source preflight identified a concrete trap in simply opening the native validator allowlist. Its TypeId includes descriptor/runtime hashes, but registration chooses the first deployment at that ID. That works for the three configuration-free fixture runtimes; two same-runtime contracts with different storage/configuration would otherwise compete for the same meaning. Keep those legacy identities frozen. A later native rule experiment needs explicit Type/rule semantics and a separately selected, verified local execution binding—not merely an arbitrary address that claims the right identifier. [Current registry](https://github.com/efs-project/planning/blob/58e61c4/Reviews/2026-09-11-efs21-pragmatic/contracts/src/ExpandedTypeRegistry.sol), [[../Designs/efsv2/programmable-type-acceptance|current programmable-acceptance proposal]].

The smallest useful integration would reuse the existing acceptance lab's bounded STATICCALL/result and authenticated-context ideas with a small structural fixture, reaching one mandatory path through native generic admission and Files create/edit. Every new accepted action must recheck its rule even when body bytes deduplicate; acceptance evidence remains separate from immutable Record identity. Old reads do not rerun arbitrary code. Measure the additional retained evidence and rule cost explicitly, including a goblin/outfit refusal and mutable external-value counterexample. This is read-only preflight, not implemented support. The current full-C0 Record batching is a read API, not a native write-batch capability. [Existing standalone acceptance lab](https://github.com/efs-project/planning/blob/e358ad66bb6471e1d89b1327d03c5ba7a286b116/Reviews/2026-09-10-programmable-acceptance/integration.md).

Full structural-Type integration is a distinct join: canonical Type parsing/cache compilation and `RecordBody.validate` are reusable, but reference existence/class/exact-Type checks and required indexes are additional obligations. Copying only the shape decoder would not preserve the fuller Type semantics. Generic ingestion should stop before Files-specific `BindingFold`; native4096-body/1024-descriptor limits are not the full grammar. These distinctions prevent cheaper native measurements from becoming an accidental permanent three-Type design.

Two product questions stay visible for James, but need not block tonight's engineering: must every high-frequency contract value become a permanently retained EFS revision, or may a separately labelled live/computed view expose current contract state? And which advanced discovery queries should every writer subsidize, rather than the namespace/profile selecting them? Neither a cheaper live view nor an optional search index may be presented as an immutable retained record or a complete query when it is not. No such requirement change has been adopted.

A concrete [[2026-09-11-efs21-live-view-preflight|live-value preflight]] explores `/swaps/eth-usdc` as an ordinary saved descriptor plus an explicit bounded reader. Source updates would touch only the producer contract; EFS would retain descriptor history, not each value. This is an additive application experiment with no Kernel/index change, not equivalent immutable-file savings. It has no implementation or new cost evidence yet, and the existing raw descriptor would require reader-side structural validation.

## Optional index safety boundary

The implemented scalar experiment keeps configuration, coverage and membership in an immutable trusted discovery coordinator. Its bounded maintenance call executes in a child frame; a tolerated failure rolls that child back and records DIRTY in the outer frame. Failure of the outer coordinator itself must still revert the entire file operation. A second callback to an already failing index does not reliably invalidate stale results.

This costs calls and health bookkeeping, but preserves an important distinction: optional search can become unavailable without preventing an otherwise valid file write; it cannot quietly continue claiming stale positives or complete empty results. Namespace owners choose the additional write cost. The initial equality-index experiment uses current linked files, not full-v2 admission-occurrence semantics. No arbitrary third-party worker is treated as honest merely because it returns success.

## Which proposed index cuts need a tradeoff decision?

A read-only dependency pass against the **active C0 source**, not the separate index-layer lab, found three different cases. No removal is implemented or measured yet:

| Proposed reduction | What could remain | What must change or be replaced |
|---|---|---|
| Per-record occurrence list (family 3) → live counter | Whether a record has any live admissions; family-2 first-ever anchor and live transitions. | A counter does not reproduce the ordered history of every admission of that record. Global-admission reconstruction is a possible slower replacement. First admission must remain distinct from revival after all occurrences were withdrawn. |
| `postingKeys` mirror | Normal keyed posting reads and admission/lifecycle behavior have no inspected dependency on this mirror. | Direct enumeration of every first-seen index key—including empty retained histories—is lost. Rebuilding keys requires admitted records and their effects, not just live files. |
| `recordIds` / `envelopeIds` ordinal mirrors | Exact content and admitted-occurrence linkage can potentially be checked using forward admission links and rehashing. | Existing ordinal inventory APIs and some reverse-consistency diagnostics disappear unless replaced. Reconstruction and read costs must be measured. |

These mirrors are **not inherently indispensable authority**. A candidate replacement can rehash the complete envelope, select its committed record, rehash that record's exact Type/body, and follow its first-admission link back to the same record. That is a useful storage/read tradeoff to test. It does not by itself prove that a claimed first admission is earliest, that all inventory ordinals are unique, or that an RPC response proves chain inclusion/completeness. A self-consistent response is still not a state proof. [Current checked hydration](https://github.com/efs-project/planning/blob/e38b5e3/Reviews/2026-09-05-c0-core/src/StatePointReads.sol#L349), [current commitment formulas](https://github.com/efs-project/planning/blob/e38b5e3/Reviews/2026-09-05-c0-core/src/StateKernel.sol#L307).

The experiment order remains: preserve all behavior during physical extraction; test a counter alongside the old list as an oracle; then remove each redundant representation separately with an explicit replacement read/reconstruction contract. Counter changes must compose through the active arm's staged counts/applied prefix (or the retained control's journal), especially multiple additions/withdrawals of the same record in one carriage. Required falsifiers include duplicate admissions, exact/mixed retries, last withdrawal and revival, a withdrawn first anchor with another occurrence still live, partial envelopes, ordinal aliases and atomic failure rollback.

Do not remove the publication's committed `recordIds` vector: it is not the storage mirror bearing the same name. Also, the active full control's family-10 scope list contains first-Binding admission anchors; the separate index-layer lab experiments with key ordinals. Their readers and cost evidence must not be mixed.

Further source analysis found that a live-occurrence counter can fit unused bits in existing Record ordinal metadata, rather than necessarily costing another slot. This is not implemented or priced. The safe sequence is a packed shadow counter checked against retained family3, followed only later by an explicitly different no-family3 query/reconstruction profile. Current checked audit queries only support8/10; raw family3 history and the independent full-inventory reader still depend on retained ordered data. [[2026-09-11-efs21-full-model-storage-preflight#Packed liveness counter: source-viable, not yet implemented|Exact invariants and limits]]. The next fuller-model physical-byte step also has a [[2026-09-11-efs21-envelope-storage-plan|reviewed envelope-only plan]], kept separate from these semantic tradeoffs.
