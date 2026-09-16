# Core closeout: public RPC preflight

Observed September15,2026 Chicago / September16 00:25–00:26 UTC. Read-only preflight for [[core-closeout-sdk-plan-20260915]], not an integrated browser result, availability SLA, state-proof verification or fee quote. No API keys, public transactions or deployments.

## Bounded live observations

Three HTTP requests per endpoint, each containing three independent JSON-RPC reads: initial chain/header/gas-price lookup; exact-hash code/storage/call; nonexistent-hash negative controls. All six HTTP requests returned200 and each batch returned its three request IDs. The successful `eth_call` used the identity precompile with input/output `0x1234`; code/storage reads used the zero address, not an EFS deployment.

| Observation | Base | ZKsync Era |
| --- | --- | --- |
| Official public endpoint | `https://mainnet.base.org` | `https://mainnet.era.zksync.io` |
| Chain ID | `0x2105` (8453) | `0x144` (324) |
| Observed block number | `0x30fc297` | `0x44aa48c` |
| Observed block hash | `0xf2c584b417c4c7b34f53db8bc9bc3a273579499af3477617f377c5e07c00e663` | `0x7097c055b57161106e5d373e706d414d2d0d372e110a02ede85773d763468c65` |
| Header timestamp | 2026-09-16T00:25:53Z | 2026-09-16T00:25:51Z |
| Header state root | `0x651e59d87050153d8b1fb42d0f5c362056384727dbd64e4249da229ae3f4fbd0` | zero |
| Initial batch elapsed/response size | 314ms /13,395bytes | 143ms /1,664bytes |
| Pinned batch elapsed/response size | 56ms /187bytes | 156ms /635bytes |
| Exact-hash `eth_getCode`, `eth_getStorageAt`, `eth_call` | accepted | accepted |
| Nonexistent hash, all three methods | error `-32001`, block not found | error `-32602`, block does not exist |

Pinned calls supplied `{blockHash: observedHash, requireCanonical: true}`. Negative controls used32 bytes of`0x11`; none silently fell back to latest. This establishes observed object/hash handling, **not** a real reorg test proving canonicality enforcement, arbitrary batch-size support, sustained throughput, historical-state retention or contract deployment compatibility. Timings are single samples, not benchmarks.

`eth_gasPrice` returned6,000,000wei on Base and45,250,000wei on Era. These are execution-price observations only; **do not** multiply local EFS receipts by them and label the result an all-in L2 fee. Data publication/operator components and venue execution profiles still require separate measurement.

## Design consequences

- Preserve same-hash read batching as an engineering candidate; actual compact SDK integration and reorg/failure tests remain open.
- Era's zero state root agrees with its documented Ethereum-RPC limitations. The planned Ethereum account/storage trie proof profile cannot authenticate Era state from this header. Era needs an explicit chain-specific proof/commitment adapter; working JSON-RPC and a USD column do not establish portable proof support.
- A reported bytecode value at the zero address on Era also differs from Base's`0x`. Avoid Ethereum account/layout assumptions without a declared chain execution profile.
- Public endpoint success is not an assurance of capacity. Base explicitly describes its public endpoint as rate-limited; the prototype must expose provider failure honestly and measure its own bounded request footprint.

Primary references: [Base RPC overview](https://docs.base.org/base-chain/api-reference/rpc-overview), [Base public endpoint caveat](https://blog.base.org/base-mainnet-is-open-for-builders), [ZKsync Ethereum-RPC specification and limitations](https://docs.zksync.io/zksync-protocol/api/ethereum-rpc). These document interfaces; the table records independent observations above. Final integrated network evidence must be refreshed after the source changes land.
