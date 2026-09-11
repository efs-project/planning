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

Isolated worktree created; implementation is beginning. Overnight continuation is active until 09:00 America/Chicago on September 12. This document will carry results and exact experiment commits as they land.
