# EFS 2.1 practical filesystem experiment

2026-09-11 · v2 PM · experimental, not a protocol ruling

James authorized an overnight implementation pass: make ordinary contract and browser filesystem operations feasible; separate kernel from indexing contracts; measure actual operations; disclose sacrificed guarantees. Existing normative v2 designs remain the reference, not silently superseded.

## What we are comparing

1. **Full v2 control:** the preserved Files prototype at `e38b5e3c1e8f8a32080458174d321d6a43b2ac5b`. Its seven-record create costs 7,688,694 gas in the retained matched type-cache run. This is a named measured workload, not a universal lower bound.
2. **Compact native candidate:** separate-storage kernel and mandatory navigation index; immutable typed bytes, stable file identity, revisions, authenticated namespace writes, CAS, paths, rename/remove, and bounded same-call listing. A producer contract writes `/swaps/eth-usdc`; another reads it. This tests physical encoding and native caller admission, not full v2 semantic parity.
3. **Configurable discovery:** subsequently pressure late index declaration/backfill, withdrawals/edits during coverage, and mandatory-versus-optional failure policy. No COMPLETE assertion until its actual universe is covered at the queried basis.

Code lives in the disposable `codex/efs21-pragmatic` worktree, sibling `planning-efs21`. Preserve the existing Fable worktree, its untracked brainstorm, and the live browser on port 60731. No migration, production repository, public deployment, paid transaction, or frozen ABI.

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

Next: configurable discovery with owner-controlled cost, bounded late backfill and explicit required/tolerated maintenance policy. Full-v2 physical index separation and broader acceptance/authorship remain distinct experiments, not implied by these results.

## How to interpret a cheaper result

Some differences are deliberate profile choices; others are merely unimplemented features. Do not confuse them:

| Difference in the first native candidate | Meaning |
|---|---|
| Native caller admission instead of stored portable application signatures | Different authorship-evidence profile; typed content may still be portable. We must measure a signed/compact-evidence extension separately. |
| One live placement, immovable directories, terminal unlink | Bounded experiment scope, not proof that aliases, directory moves or restore are unaffordable. |
| Small enforced stateless validator set | Testable acceptance discipline; **not fulfillment of the arbitrary developer validation requirement**. Broader rule identity and mutable dependency handling remain work. |
| No multi-principal Lens composition yet | Does not establish that Lenses must be sacrificed. A qualified composition test must follow. |
| No generalized write-free journal replay | Candidate relies on EVM transaction rollback plus explicit CAS. Need to separate protocol-required behavior from implementation-specific journal machinery. |
| Separate contract holds required navigation indexes | Still mandatory for writers. Physical separation alone will not remove index storage costs. |

A read-only engineering review found a concentrated full-C0 extraction seam: journal storage access plus two posting read primitives. That offers a later **same-semantics, separate-storage control**. It should preserve every family first and measure the extra call overhead before dropping mirrors/counters or changing coverage claims. Bytecode size and deployment/qualification changes are its early gates.

Native authority does not mean EOA-only: the demonstrated producer contract owns its namespace, not the EOA invoking it. A smart account could similarly own a namespace and manage its own keys/permissions; that wallet integration and recovery workflow have not been tested here. This still does not supply EFS's portable Principal/authorship evidence or cross-deployment identity model.

The smaller candidate should also be read as a **Files profile**, not a filesystem-shaped replacement for every kind of EFS data. Its author-neutral typed-record storage/validation can be extracted into a generic ingestion contract, with Files ownership/history/path state in a profile facade and required indexes separately stored. An extraction-only experiment can preserve the same browser API and measure the extra call cost. Full structural Type validation and compact portable authored admission then need distinct measured arms; neither is established by today's two-validator native profile.

## Logs are useful, but a different read surface

One premise in the discussion needs narrowing: light-client verification of logs is not fundamentally impossible. Ethereum commits receipts into the block's receipt trie, and receipts contain logs; receipt inclusion can therefore be checked against an authenticated header with the required proof data. This is distinct from trusting an `eth_getLogs` response. [EIP-2718 receipt commitment](https://eips.ethereum.org/EIPS/eip-2718#receipts).

The standard filtered-log response does not itself prove that the RPC returned every matching event. Nor does an inclusion proof for a few returned events prove query completeness. My engineering conclusion: logs are useful for optional discovery/change hints, followed by canonical state checks; they must not silently substitute for an authoritative complete listing. [JSON-RPC filtered logs](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs). EIP-1186 supplies account/storage proofs, not a complete filtered-log proof API. [EIP-1186](https://eips.ethereum.org/EIPS/eip-1186).

For tonight, basic contract operations and browsing remain state-readable with no logs service. A future optional event-backed search can improve UX without changing the meaning of the underlying file data. No prototype state-proof implementation is claimed here.

## Cost levers to investigate without dropping meaning

- **Native history snapshots:** implemented and independently reviewed above; same historical values, lower edit/unlink receipts, slightly higher creation and historical-read cost. Still experimental, not adopted storage layout.
- **Raw payload representation:** distinguish external-call ABI from the typed content being stored. A separate raw-byte Type can avoid persisting the inner offset/length/padding for file bodies. It has different exact Type/Record IDs and cannot reinterpret old records; measure it separately from storage compression. Empty raw bodies also mean a nonempty-body presence shortcut would be invalid.
- **Stateless priority reader:** a small ordered-namespace, whole-path Lens can add useful contract composition without adding writes. It is not yet full per-segment/whiteout/threshold Lens parity.
- **Full-profile byte placement:** the retained full create-file census has 48 Record slots: 21 row/header slots and 27 body-data words. Its unsigned envelope adds a further payload. The prior Type-cache optimization already demonstrated immutable code-backed storage. A later experiment can compare batch-packed immutable record/envelope bytes against individual storage words while preserving logical rows and exact IDs. It must include contract creation/pointer/read costs and support legal sizes without repeating the cache ceiling failure. [Retained slot census at the prototype checkpoint](https://github.com/efs-project/planning/blob/aa6b1b62b733209aa5879743e81fd1f3a9143f8a/Reviews/2026-09-09-files-browser-mvp/gas-baseline-2026-09-10.md#33-slots-by-family--createdir-createdir-1-and-createfile-createfile-1).

The code-as-data idea is established prior art, not an EFS invention: Solady's SSTORE2 writes bytes into a STOP-prefixed contract and reads them with EXTCODECOPY. It does not prove savings for our exact workload; individual tiny deployments can be wasteful, and our Core proxy must not accidentally consume deployment nonces. [Solady SSTORE2 source](https://github.com/Vectorized/solady/blob/main/src/utils/SSTORE2.sol).

These are experiments, not adopted storage layouts. No projected gas figure here is a measured result.

## Optional index safety boundary

The current next-step design keeps configuration, coverage and membership in an immutable trusted discovery coordinator. Its bounded maintenance call executes in a child frame; a tolerated failure rolls that child back and records DIRTY in the outer frame. Failure of the outer coordinator itself must still revert the entire file operation. A second callback to an already failing index does not reliably invalidate stale results.

This costs calls and health bookkeeping, but preserves an important distinction: optional search can become unavailable without preventing an otherwise valid file write; it cannot quietly continue claiming stale positives or complete empty results. Namespace owners choose the additional write cost. The initial equality-index experiment uses current linked files, not full-v2 admission-occurrence semantics. No arbitrary third-party worker is treated as honest merely because it returns success.
