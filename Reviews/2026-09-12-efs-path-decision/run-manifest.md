# Run manifest — disposable comparison contract

September 12, 2026 · Codex coordinator · experiment format, not EFS protocol bytes.

Use one JSON manifest per candidate/run, committed before measured execution.
The [[sdk-fixture]] and [[files-journey]] are the expected semantic outcomes;
this manifest pins the concrete implementation that claims to produce them.
Never fill unavailable evidence with a success default.

## Required sections

| Section | Required contents |
|---|---|
| `identity` | Unique run ID; Road and profile; source commit and dirty diff hash (prefer clean source); exact fixture/review commits; real UTC start/end. |
| `build` | Compiler, optimizer, via-IR and EVM fork; pinned dependencies/licenses; source and artifact hashes; per-contract runtime/initcode bytes; linked libraries, proxies and implementation/configuration identities. |
| `deployment` | Fresh chain ID/genesis/block limits; each deployed address/codehash and constructor/configuration inputs; authority, rule and index controller/grant graph; every setup receipt, including helpers and Type/account registration. |
| `fixtures` | Semantic labels mapped to exact Type closures, body/action bytes, IDs, authors, signatures/domains, CAS inputs, required queries, Lens plans and content commitments. Preserve external evidence/carrier obligations. |
| `operations` | Ordered logical actions, all physical transactions and fee payers, expected results and validation basis. Distinguish fresh Record, existing Record/new occurrence, identical-action retry and failed action. Name every omitted joined obligation. |
| `reads` | Selected block hash/basis and execution/configuration identity; public ABI/storage decoder and cursor semantics; independent expected result; paid Solidity consumer and raw-state/offline-reader source hashes; RPC request/batch/byte/latency accounting. |
| `evidence` | Receipt hashes and gas, raw pre/post observations, storage/code growth, reconstructed semantic results, mutation seeds, signature/source-witness checks, and verified/demonstrated versus assumed/unknown proof grade. A retained transcript is not a state proof. |
| `resources` | Explicit run-lease owner; exact process IDs, ports and run-owned build/cache directories; watchdog/deadline, scratch budget, disk reserve and cleanup receipt. No broad-path deletion. |

Keep unknown fields explicit, with a reason and consequence. An implementation
may expose different physical structures; the oracle must derive their meaning
from authenticated/pinned raw inputs, not trust an adapter's `passed: true`.
The independent consumer may use a public adapter, but its entire dependency
graph and deployment/call costs are counted. Candidate helpers are not the
independent expected-value oracle.

## Exact supplemental cost controls

These are payload bytes, **not** common Type IDs or universal full-body encodings.
Pin each arm's framing separately. Root recomputed the Keccak-256 values below
using the existing local ethers library; no chain was run.

| Label | Exact construction | Bytes | Keccak-256 |
|---|---|---:|---|
| `quote3000` | Big-endian uint256 3000, zero-padded to 32 bytes (`…0bb8`) | 32 | `0xe76dc8c2cbfeda1a9b742dc422eca76098e9c5e0a82c5e4f1ad3ef5bd9efe552` |
| `quote3100` | Big-endian uint256 3100, zero-padded to 32 bytes (`…0c1c`) | 32 | `0x5a25a1af59e5c9fbb1b35d4f17b3ec95ad60075c34a87c7e570d596153677cb3` |
| `file41a` | Exactly 41 bytes of `0x61` | 41 | `0xe27c263ce61bca70e9ff7d3182fc124c8dcfee2a4656e5c746ceb433a2558911` |
| `file41b` | Exactly 41 bytes of `0x62` | 41 | `0x1882de08a178ebf3827d787e4086d8b2e14a81a8cf3b7b42f2e1458831646f3a` |

Source construction: native `b8c2775`,
`Reviews/2026-09-11-efs21-pragmatic/scripts/canonical-types-benchmark.mjs`
(`quote0/quote1`); fuller `ebc7d54`, same experiment directory's
`scripts/journal-benchmark.mjs` (`bytesHex/editBytes`). Before execution,
copy the full bytes into the manifest and independently check these hashes.
The SDK's joined Pair/Quote fixture is additional; these small controls cannot
replace its references, author evidence, selection or portability checks.

## Freshness control is part of the workload

The retained canonical native run first creates the exact 3100 Record through
the EOA namespace, then publishes that same Type/body through the producer.
Its **198,745 gas** contract-update receipt is therefore a **reused-Record
update in that ordered run**, not the fresh-body contract-write floor. Source:
the pinned benchmark order above and retained `evidence/canonical-types.json`
(`sourceCommit=b2eae00589b1f174b29df0f18e9a8aa97330f918`); this is a source/evidence
qualification, not a rerun or a claim that the receipt is wrong.

For each contender, run `contract-fresh-body` with independently proved absence
of its exact Record immediately before the action, then
`contract-existing-body` in the same declared initial-state regime. Also run
exact-operation retry separately. Record both cold transaction access sets and
already-initialized persistent lists; “steady” does not mean cross-transaction
EVM warm slots. Do not average these into one flattering update number.

## Run release

This document grants **no heavy-run lease**. A ready worker gives the
coordinator its source/manifest pin and exact finite resource request. The
coordinator records one owner in [[README#Coordinator checkpoint]] before
compile/Anvil execution. Complete one small joined probe before scale sweeps;
record failures and repair the decisive gap rather than running every old suite.
