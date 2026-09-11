# Cost experiment: what the numbers mean

The compact native filesystem is a **different profile**, not a claim that all v2 features became cheaper by the same percentage. Compare absolute user workloads and list capability differences beside every comparison.

## Workloads

| Workload | Required measured effect | Count separately |
|---|---|---|
| Bootstrap | deploy kernel, separate navigation index, validator registry/runtimes, example contracts | one-time deployment and Type registration, never hidden inside a steady write |
| New short file | nested parent exists; 41 bytes; new stable file, immutable typed bytes, revision 1, current name, mandatory inventories | first caller/list use versus subsequent files; full v2 includes separate chunk staging |
| Identical content, second file | second identity/location, same exact typed body | unique-record deduplication versus second file costs |
| Edit | same file/name, fresh 32/41-byte content, CAS, old content/revision still readable | first update and multiple later revisions; history is not free |
| Rename / move file | current name changes, stable file and body remain | candidate has no whiteout/Lens overlay effect; not full-v2 rename parity |
| Unlink | name disappears, old immutable bytes/history still retrievable | candidate terminal unlink differs from full-v2 removal marker plus restore |
| Contract writer | producer writes `/swaps/eth-usdc`; subsequent publish changes its revision | producer namespace is contract address, not transaction sender |
| Contract reader | unrelated deployed consumer resolves and decodes the producer's current value | an actual consumer transaction receipt and an eth_call estimate have different meanings |
| Bare mapping control | equivalent uint256 setter/getter without filesystem guarantees | price of history, exact Types, paths and inventories; never call this equivalent EFS |
| Bounded listing | same-call hydrated page of 1/16/32 entries; multi-page continuation | HTTP requests, logical RPC calls, return bytes, eth_call execution estimate, not paid read fees |
| Payload growth | 0, 32, 41, 256, 4096 bytes where supported | physical on-chain bytes; do not extrapolate to external carrier bodies |

Provisional engineering ambitions, not owner-frozen limits: get steady small native updates below 250k receipt gas and complete new short files below 1M. Failure means inspect amplification; success means investigate retained guarantees, not declare victory.

## Retained full-v2 references

The retained [matched type-cache result](../2026-09-09-files-browser-mvp/evidence/type-cache-2026-09-11/compare.md) reports createFile-1 **7,688,694** gas plus its separate stageChunk-1 **149,369** gas, and createDir-1 **4,622,839** gas. They used routed authorization, seven/four typed metadata leaves, an existing prepared world, a 41-byte staged payload, and exact mandatory family maintenance. Record both receipts when describing the complete new-file storage action.

The separate [routed V1 operation loop](../2026-09-09-files-browser-mvp/type-cache-2026-09-11.md) reports edit 3,620,400, rename 4,909,475, remove 4,714,376. These are historical context from that loop, not a newly rerun matched native comparison. Do not combine its numbers with another prefix to invent marginal savings.

## Evidence and constraints

- Retain actual receipt gas/status/hash/block, input bytes/operation sizes, chain fork, compiler/settings, deployed runtime hashes, source commit and source hashes.
- Separate receipt-confirmed execution from independently checked canonical state. Reverted writes still cost gas; don't omit them from the action journal.
- Use one managed loopback Anvil instance; owned cache path, bounded lifetime, confirmed exit before cleanup. No full opcode tracing. Small prestate diffs may later measure fresh storage, but missing counts are unavailable, not zero.
- Node estimateGas and Forge gas reports are diagnostic; no relabelling them as paid receipt gas.
- Repeat the small workload on a fresh world. Signature/address/calldata variation may move gas slightly; explain it.
- Browser reads pin a block and verify endpoint chain/genesis/deployment identity. Every list result retains its observation qualification. Neither trusted RPC responses nor a chain transcript are state proofs.
- ETH/USD and network pricing are labelled scenario estimates. OP/Base/Arbitrum execution estimates do not include actual calldata/blob compression or sequencer/operator fees unless explicitly modelled; Ethereum's fee schedule is not every rollup's schedule.

## Future-fee scenarios

[EIP-8037](https://eips.ethereum.org/EIPS/eip-8037) and [EIP-8038](https://eips.ethereum.org/EIPS/eip-8038), checked September 11, remain Review proposals. They separate state and execution charging and net-meter writes. Multiplying every observed SSTORE by a new-slot price is wrong; a combined paid-gas figure above the execution cap is not itself proof of an inclusion failure. Prefer measured current-fork results tonight; any future arithmetic must state its incomplete model and both dimensions.

## What this experiment does not establish

Full multi-principal Lens equivalence, portable signed authorship, recovery/delegation, all v2 Type language/validation programs, multiple placements, mounts, restore semantics, external-carrier availability, encryption, durable upgrades, state-proof verification and decades-long economic sustainability. These remain explicit design/engineering requirements or tradeoffs, not silently discarded wishes.
