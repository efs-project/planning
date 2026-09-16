# Core closeout: public RPC preflight

Observed September15,2026 Chicago / September16 00:25–00:26 UTC. Read-only preflight for [[core-closeout-sdk-plan-20260915]], not an integrated browser result, availability SLA, state-proof verification or fee quote. No API keys, public transactions or deployments.

## Bounded live observations

**Final integrated recipe refresh, September16 14:07:28UTC:** retained Resource2
packet `d7b25e8dd961e31f194d572314d8dfbb6959b2c8c3e9f66b01098dac476f051c`
observes Base block `0x31022de`, hash
`0x87370c81d4a4fd5119883b24fd8e2a8f77f84ba85c4ae688ff9deb47dd8d0dd5`,
execution price 6,012,195wei/gas. Full unsigned serialized inputs plus exact-hash
oracle results give local-gas cross-venue models of **0.000013061525555385ETH**
for the complete 41-byte inline File create and **0.000017344849763412ETH** for
the atomic descriptor-backed create. Both include returned L1 estimates and an
observed zero operator component; neither is a Base execution receipt. Later
operator/L1 requests returned `-32016` rate limits, so those whole totals remain
unavailable. Final Base hash controls were only partial. Era's hash controls
succeeded and nonexistent-hash calls errored, but its state root was still zero;
execution/ergs/pubdata/deployment remain unmeasured. No public writes or retry
campaign. See [[core-closeout-results-20260915#Final integrated resource packet — September16|final resource qualifications]];
the earlier preflights below are historical observations, not guaranteed provider capacity.

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

## Final fee measurement discipline

For Base, retain the final local recipe's full unsigned serialized transaction, not calldata length alone. At a recorded public block, query the actual GasPriceOracle's `getL1Fee(bytes)` and `getOperatorFee(gasUsed)` alongside execution-price inputs. Do not reimplement a remembered fork formula: the operator formula can change. Local measured gas multiplied by observed execution price plus these components is still a **cross-venue model**, not a Base receipt or proof that the local deployment executes there. Record unsupported selectors/errors as unavailable rather than zero. [OP fee estimation](https://docs.optimism.io/app-developers/guides/transactions/estimates), [pinned GasPriceOracle implementation](https://github.com/ethereum-optimism/optimism/blob/bf8daaed3e850a06fde4fb301ba70927dee815fa/packages/contracts-bedrock/src/L2/GasPriceOracle.sol).

ZKsync's EVM interpreter maintains virtual EVM gas while transaction limits and payment use native EraVM ergs. Its documented current limit conversion is5:1, not a general five-times-cost formula; native exhaustion can revert the entire interpreted call stack. **Anvil gas × Era gas price is not a valid all-in estimate.** An actual Era execution/fee-estimation profile is needed, including pubdata and native overhead. Until exercised, show Era costs and deployment feasibility as unmeasured; do not borrow Base assumptions. This also requires checking bounded-call failure behavior on that venue. [EVM gas interpretation](https://docs.zksync.io/zksync-protocol/era-vm/evm-interpreter/evm-gas-interpretation), [Era fee model](https://docs.zksync.io/zksync-protocol/era-vm/transactions/fee-model), [interpreter differences](https://docs.zksync.io/zksync-protocol/era-vm/evm-interpreter/evm-differences).

No new public deployment or emulator installation is authorized by this preflight. These are explicit execution-profile boundaries for the final report, not a silent portability requirement waiver.

### September16 midday availability/input refresh

At13:03:33–34UTC, two further read-only HTTP batches (three logical reads each:
chain ID, latest header, gas price) returned200. Base8453 block`0x3101b61`,
hash`0x387e720409b6d3f511a9c93f553c454de5f96b6ff24e1ba1e1a3b3e24b18c9c5`,
reported6,000,000wei execution gas price,5,000,000wei base fee and400M block limit.
Era324 block`0x44ad47d`,
hash`0x7071cebef975308ad28cc8170cfe1f138771c827de3fc5564079ef8b24de6065`,
reported45,250,000wei gas price and still a zero header state root. Single samples
were146ms/15,534response bytes and117ms/1,664bytes respectively, not throughput
benchmarks. No fee oracle, transaction, state proof or reorg control was exercised
in this small refresh; final-recipe fee inputs still belong to Resource Task2.

Fresh primary-document checks retain the same boundaries:
[Base transaction limits](https://docs.base.org/specifications/transactions/throughput-and-limits)
still specify16,777,216per transaction irrespective of the larger block budget;
[Base fees](https://docs.base.org/specifications/transactions/network-fees)
expose the serialized-transaction oracle, and
[OP fees](https://docs.optimism.io/op-stack/transactions/fees) distinguish the
operator component. The
[Era interpreter](https://docs.zksync.io/zksync-protocol/era-vm/evm-interpreter/evm-gas-interpretation)
still distinguishes native ergs from virtual EVM gas. No runtime profile,
affordable EFS workload or public-chain execution is certified by these reads.

### Small Base cost-model preflight

Observed2026-09-16T01:19:15.948Z, Base8453 block`0x30fc8d8`, hash`0xc7684bb525953eb098e5f6cd0c06d2dc2b20906f16d63299469198c41c4b66b9`. Two HTTP batches/seven logical reads: chain/latest header/gas price, then exact-hash `getL1Fee` and `getOperatorFee` for two retained Task1 receipts from prototype`af0190a`. Both fee methods returned canonical uint256 values. Execution price observed6,000,000wei/gas; fee calls used the recorded hash with`requireCanonical:true`.

| Local whole-Record receipt, not File/tag | Gas | Unsigned transaction bytes | Model execution wei | Oracle L1 estimate wei | Oracle operator wei | Model total ETH |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Native8refs+4scalar+digest | 1,298,784 | 591 | 7,792,704,000,000 | 1,587,300,470 | 0 | 0.000007794291300470 |
| Guarded equivalent | 1,329,254 | 1,263 | 7,975,524,000,000 | 2,091,036,165 | 0 | 0.000007977615036165 |

Serialization uses type2, Base chain ID and observed gas price, zero priority fee, retained fixture target/nonce/value/calldata and15M limit, without a transaction signature. It is a hypothetical same-shaped Base transaction; local addresses, intent domains and calldata are **not** asserted executable on Base. The model combines local receipt gas with that public fee snapshot, not a Base receipt or promised future price. At an illustrative$2,400/ETH, totals would be about$0.0187 and$0.0191. No public write occurred, no USD market price is frozen, and whole Files/tag comparisons still require the final integrated recipe.
