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

## Logs are useful, but a different read surface

One premise in the discussion needs narrowing: light-client verification of logs is not fundamentally impossible. Ethereum commits receipts into the block's receipt trie, and receipts contain logs; receipt inclusion can therefore be checked against an authenticated header with the required proof data. This is distinct from trusting an `eth_getLogs` response. [EIP-2718 receipt commitment](https://eips.ethereum.org/EIPS/eip-2718#receipts).

The standard filtered-log response does not itself prove that the RPC returned every matching event. Nor does an inclusion proof for a few returned events prove query completeness. My engineering conclusion: logs are useful for optional discovery/change hints, followed by canonical state checks; they must not silently substitute for an authoritative complete listing. [JSON-RPC filtered logs](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs). EIP-1186 supplies account/storage proofs, not a complete filtered-log proof API. [EIP-1186](https://eips.ethereum.org/EIPS/eip-1186).

For tonight, basic contract operations and browsing remain state-readable with no logs service. A future optional event-backed search can improve UX without changing the meaning of the underlying file data. No prototype state-proof implementation is claimed here.
