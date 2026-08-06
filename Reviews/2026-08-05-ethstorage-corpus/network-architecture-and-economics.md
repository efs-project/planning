# EthStorage network architecture, economics, and control

**Status:** point-in-time technical reference, verified 2026-08-05; mutable deployment facts require refresh

#kind/review #status/done #repo/planning #topic/storage #topic/onchain #topic/preservation

## Compact model

EthStorage combines:

1. **Ethereum L1:** blob ingestion, the storage contract, compact KV metadata, fees, proof verification, rewards, and upgrade/admin state.
2. **`es-node` provider network:** acquisition, provider-specific encoding, persistent replicas, sampling/proof construction, synchronization, and payload serving.
3. **EthStorage-aware RPC/client tools:** special read execution, upload/download SDKs, FlatDirectory, gateways, and `web3://` tooling.

The official architecture explicitly calls the provider tier an L2 storage network and the payload replicas offchain: [How EthStorage Works](https://github.com/ethstorage/ethstorage-doc/blob/8ba215431220c1bc8518833a91a5f35c334d513e/overview/how-ethstorage-works.md).

This is not an ordinary execution rollup in the sense of a sequencer producing state roots for general computation. Chain ID `333` is the current EthStorage read/RPC namespace while writes and proof/economic state land on Ethereum mainnet.

## Write path

For the current Ethereum path:

1. The uploader constructs an EIP-4844 blob-carrying transaction.
2. An application/FlatDirectory calls the EthStorage contract with a logical key, blob index, and byte length.
3. The contract reads the blob/versioned hash from the transaction, records compact metadata, and charges an upfront storage payment for a newly allocated KV entry.
4. Providers acquire the bytes while Ethereum's data-availability path still carries them.
5. Providers encode/store the data and later prove selected samples.

Primary code:

- [`putBlob`/blob handling](https://github.com/ethstorage/storage-contracts-v1/blob/1675131c66cf0b74f90512c29608ca373161a40f/contracts/EthStorageContract.sol)
- [SDK blob uploader](https://github.com/ethstorage/ethstorage-sdk/blob/03c718eb3256c540378691a7c19780f6b6c14a66/src/utils/uploader.ts)
- [KV allocation and payment](https://github.com/ethstorage/storage-contracts-v1/blob/1675131c66cf0b74f90512c29608ca373161a40f/contracts/DecentralizedKV.sol)

The storage namespace is `keccak256(caller, key)`. Two callers using the same logical key receive different storage keys. Updating an existing entry changes its current commitment/length without allocating another KV slot; it still requires a new blob transaction.

`PhyAddr.hash` stores only `bytes24` of the EIP-4844 versioned hash. EFS should record that 192-bit value as carrier-specific evidence, not substitute it for a full canonical EFS digest. See [`DecentralizedKV.sol`](https://github.com/ethstorage/storage-contracts-v1/blob/1675131c66cf0b74f90512c29608ca373161a40f/contracts/DecentralizedKV.sol) and the SDK's [`util.ts`](https://github.com/ethstorage/ethstorage-sdk/blob/03c718eb3256c540378691a7c19780f6b6c14a66/src/utils/util.ts).

## Read path

Ordinary Ethereum state exposes metadata such as existence, byte length, and the compacted commitment. The large value uses a different path.

`DecentralizedKV.get()` performs a `STATICCALL` to address `0x33301`. On an ordinary L1 execution node there is no implementation there, so the contract deliberately raises `GetMustBeCalledOnESNode`. `es-node` forwards the RPC read into its EthStorage-specific `eth_esCall` handling and supplies the requested payload slice.

Primary evidence:

- [developer-guide limitation](https://github.com/ethstorage/ethstorage-doc/blob/8ba215431220c1bc8518833a91a5f35c334d513e/dapp-developer-guide/introduction.md)
- [`get()` implementation](https://github.com/ethstorage/storage-contracts-v1/blob/1675131c66cf0b74f90512c29608ca373161a40f/contracts/DecentralizedKV.sol)
- [`es-node` RPC interception](https://github.com/ethstorage/es-node/blob/b7b71d1f9ab4cbff130df8c061ea95acd06ac1a9/ethstorage/node/eth_api.go)

Consequences:

- a browser/tool can read the bytes through an EthStorage-aware endpoint;
- a normal Ethereum transaction cannot branch on the stored payload;
- a contract may receive supplied bytes plus appropriate evidence and verify them, but that is not synchronous random access to provider storage;
- EFS must keep `contractReadable`, `clientVerifiable`, and `providerStored` as different capabilities.

## Data shape and update/delete behavior

The contract reports a 131,072-byte encoded blob/KV ceiling. The current FlatDirectory `OptimismCompact` encoder carries at most 130,044 application bytes per blob. FlatDirectory and the SDK compose larger files from multiple keyed values/chunks.

The developer guide describes CRUD. Current deployed-source behavior is narrower:

- create: supported;
- update/overwrite: supported for an existing caller/key slot;
- read: supported through the special `es-node` JSON-RPC path;
- delete: `removeTo()` is currently unimplemented and reverts in `DecentralizedKV`.

Application-level directories may drop their pointers, but Ethereum history, blob archivers, provider copies, caches, or contract-bytecode variants are not thereby erased.

## What the proof establishes

At a high level, an authorized provider derives an encoded replica, responds to randomized sample challenges, proves sample inclusion against the data commitment, and proves correct decoding. The current M2 configuration uses two random checks per submission. This is meaningful sampled-possession evidence, but the sample count is not a whole-file or replica-count proof.

**Established by a successful accepted proof:** the submitting authorized provider produced valid answers for the selected samples under the current contract/proof parameters.

**Not automatically established:**

- a stated number of independently controlled providers;
- a stated number of complete retrievable replicas;
- whole-file retrievability through an arbitrary endpoint;
- an availability or latency SLA;
- geographic/jurisdictional diversity;
- repair or reconstruction after the final good copy is lost;
- indefinite survival if rewards, upgrades, node software, Ethereum, or the provider market change.

Future EFS UI/data should report the narrower evidence rather than flatten it to `permanent=true`.

## Payment and “permanence” model

A new KV allocation pays:

- Ethereum execution gas;
- Ethereum blob gas;
- an upfront EthStorage payment.

The storage contract implements the upfront payment as a discounted future reward stream. The intended permanence argument depends on storage cost falling over time so a finite payment can continue incentivizing providers.

That is a protocol/economic thesis, not an intrinsic byte property. It remains dependent on:

- future storage costs and ETH purchasing power;
- sufficient provider participation and shard coverage;
- proof/reward parameter governance;
- upgrades and software availability;
- the absence of terminal data-loss or unrepairable coordination failures.

An EFS placement record should capture the network/contract/version, commitment, retrieval hints, payment evidence, last independent retrieval, proof observations, and assumptions. It should never copy an unqualified “permanent” bit from marketing.

## Mainnet Alpha snapshot

Official network information at audited revision `8ba2154` lists:

- L1: Ethereum mainnet;
- virtual/read chain ID: `333`;
- storage contract: `0xf0193d6E8fc186e77b6E63af4151db07524f6a7A`;
- storage contracts: `v0.2.1`;
- `es-node`: `v0.2.10`;
- two named EthStorage-aware RPC endpoints and one blob-archiver endpoint.

Source: [current network information](https://github.com/ethstorage/ethstorage-doc/blob/8ba215431220c1bc8518833a91a5f35c334d513e/information/README.md).

Read-only Ethereum calls on 2026-08-05 at block `25,693,004` returned:

| Observation | Value | Meaning limit |
|---|---:|---|
| `kvEntryCount()` | 2,709 | allocated KV slots in this deployment, not users/files/operators |
| `maxKvSize()` | 131,072 bytes | encoded blob/KV envelope ceiling, not application payload |
| raw slot-envelope upper bound | ~338.6 MiB | count × encoded ceiling; not logical payload, actual bytes, or physical replicas |
| `upfrontPayment()` | 57,285,798,274,128 wei | point-in-time storage component for a new slot; excludes transaction/blob gas |

The official [Grafana network-dashboard API](https://grafana.ethstorage.io/api/dashboards/uid/network) exposed seven contract-specific node series at the recorded query time on 2026-08-05. This establishes only the size of that monitored set; total nodes, complete replicas, and independent operators remain unknown.

## Permissioning and control

The current [provider guide](https://docs.ethstorage.io/storage-provider-guide) says mining/reward participation on Mainnet Alpha is limited to whitelisted operators. Anyone may run `es-node` with mining disabled, but that is not equivalent to permissionless rewarded provision.

The published deployment record shows an upgradeable proxy:

- proxy `0xf0193d6E8fc186e77b6E63af4151db07524f6a7A`;
- ProxyAdmin `0x654dd56444856e928917549263aAc6f9D6A96372`;
- implementation `0x99F5cC6Ad111584C88891b4C6Fff5784A46AdF33`;
- recorded owner `0xA10D87502a0D8FcE45610c6028f0756383649F3C`.

On 2026-08-05 that owner was a Safe with two listed owners and threshold one. One signer could therefore exercise whatever authority the Safe holds. This may change and must be refreshed before reliance.

At the snapshot block, `enforceMinerRole` was true, and the 1-of-2 Safe was both ProxyAdmin owner and holder of `DEFAULT_ADMIN_ROLE`; it could therefore upgrade implementation logic and administer miner roles/current configurable parameters. Source: pinned [deployment record](https://github.com/ethstorage/storage-contracts-v1/blob/1675131c66cf0b74f90512c29608ca373161a40f/deployments/EthStorageContractM2_1_v0.2.1-8111683_deploy.txt).

Current control is not disqualifying for an alpha. It is disqualifying for an unqualified claim that EFS has no administrative or project-continuity dependency if EthStorage is its only carrier.

## Licensing, implementation diversity, and audit

- `storage-contracts-v1` uses MIT SPDX identifiers.
- `es-node` is under Business Source License 1.1. It permits non-production use and references an Additional Use Grant; the license states conversion to Apache-2.0 on 2027-12-31. BSL is explicitly not an open-source license before conversion.
- The Additional Use Grant hostname is spelled `license-grants.ethsorage.io` in the license; it did not resolve during the earlier check. Do not assume a production grant from an unreachable reference.
- No independent production `es-node` implementation was identified.
- The 2024 Salus Solidity review reported no high or medium findings in the reviewed version, plus low/informational findings. It predates and does not cover the whole current system.
- The proof system uses a multi-contributor trusted setup; its safety statement depends on at least one honest contributor and correct ceremony/artifact preservation.

Sources:

- [`es-node` license](https://github.com/ethstorage/es-node/blob/b7b71d1f9ab4cbff130df8c061ea95acd06ac1a9/LICENSE)
- [Salus audit PDF](https://cert-api.salusec.io/api/v1/salus/contract/certificate/full/2024/EthStorage_audit_report_2024-10-30.pdf)
- [Mainnet Alpha announcement](https://blog.ethstorage.io/ethstorage-mainnet-alpha-launch-petabyte-scale-decentralized-storage-on-ethereum/)

## EFS interpretation

EthStorage is strong evidence for an external placement tier with provider proofs. It is not evidence that EFS should:

- make a storage contract/key its object identity;
- remove its contract-readable tier;
- rely on one proof network or official gateway;
- claim provider proofs imply complete preservation;
- encode EthStorage-specific fields in the universal kernel;
- duplicate the provider/mining/proof protocol.

The integration succeeds only if losing this deployment degrades one placement's availability rather than invalidating EFS identity, authority, history, or every surviving copy.
