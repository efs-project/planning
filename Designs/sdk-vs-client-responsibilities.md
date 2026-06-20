# SDK-owned vs client-owned — the responsibility boundary

**Status:** review
**Target repos:** sdk, client
**Depends on:** [[sdk-architecture]], [[sdk-wallet-architecture]], [[mirror-scheme-policy]] (the client render-isolation requirement)
**Last touched:** 2026-06-20 — sdk-designer

#status/review #kind/design

## The principle

**`@efs/sdk` is pure client-side logic: it builds, reads, executes, encodes, and verifies — it never holds keys, runs servers, renders UI, or operates infrastructure.** Everything that needs a key, a server, a screen, or an opinion is **client-owned** — where "client" = our web client *or* a third-party app using the SDK.

A clean test: *if it requires a secret, a long-running process, a DOM, or a product decision, it's the client's; if it's a deterministic transformation or an on-chain interaction through a provided client, it's the SDK's.*

## Ownership matrix

| Concern | `@efs/sdk` (library) | Client / App |
|---|---|---|
| Build the write DAG; read surface; encode/decode; content hashing | **owns** | — |
| Capability detect → strategy select → submit; mirror fetch + verify | **owns** | — |
| Produce signing payloads (the attestations, delegated-attest EIP-712, 7702 auth tuple) | **owns** | — |
| Typed errors, the deployments registry, on-chain reads/writes via the *provided* client | **owns** | — |
| **Hold private keys / sign** | **never** | **owns** (the wallet) |
| Wallet / account selection + connection; pass the connected client to the SDK | — | **owns** |
| RPC endpoint / provider | — | **owns** (provides to SDK) |
| **Render content + sandbox mirror bytes** (ADR-0056 — a launch-blocker) | returns inert bytes only | **owns** |
| Off-chain storage / pinning (IPFS/Arweave) for off-chain mirrors | — (SDK can store **on-chain** `web3://` itself) | **owns** for off-chain |
| **Gas sponsorship — the funded key + the relayer/paymaster server** | **never** (no keys, no servers) | **owns** the infra |
| Gas sponsorship — the *seam* (produce signed payloads, POST to a configured endpoint) | **provides the seam** | configures the endpoint |
| Lens / identity policy (which lenses, the default, trust UI) | resolves lenses | **owns** the policy |
| Product UX — naming, which primitives to surface, layout | provides the primitives | **owns** |

The recurring shape: the SDK provides a **seam**; the client provides the **secret / server / screen / policy** behind it. The SDK is `npm install`-and-go; nothing it does requires you to run anything.

## Gas sponsorship (incl. the Sepolia hackathon) — client-owned, SDK-seamed

Goal: hackathon users write to EFS **without faucets or holding ETH**, while **staying the attester** (lenses must remain user-owned). The sponsor pays gas; the sponsor must **not** become the attester.

Two sponsor mechanisms, both with the same boundary — **the funded address + the server are client/hackathon infra; the SDK only produces payloads + posts to the endpoint you configure:**

1. **Delegated-attestation relayer (recommended for the hackathon — universal, MetaMask-friendly, no AA needed).**
   - The user signs the attestations off-chain (EAS `multiAttestByDelegation` EIP-712) — **gasless, no faucet**. The SDK produces these payloads.
   - The SDK POSTs them to your relayer endpoint. **Your relayer** = a small server holding the funded SepoliaETH key; it submits `multiAttestByDelegation` and pays gas. EAS records the **user** as the attester (the signer), not the relayer. ✓ lenses stay user-owned.
   - Trade-off: the dependent DAG means a few signature prompts (sign each layer as the prior mines) — but zero gas, zero faucet. Fine for a hackathon.
2. **ERC-7677 paymaster (for 5792 / smart-account users — fewer prompts).** The same funded address backs a paymaster the wallet calls during `wallet_sendCalls`/a UserOp. Attester stays the user's account. More polished where wallets support it; the relayer is the universal fallback.

**The SDK seam:**
```ts
createEfsClient({
  account, chain,
  sponsorship: { mode: 'delegated-relayer' | 'paymaster', endpoint: 'https://hack.efs.../sponsor' },
})
// efs.fs.write(...) then routes through the sponsor automatically — user signs, your funded address pays.
```
The SDK **never** sees the funded key. You (the hackathon operator) run the relayer + fund the address; the SDK is configured to use it. Same model a third-party app would use to sponsor *its* users.

> Security (from the wallet-arch review): a paymaster/relayer gates **gas only** — it can't alter the `FileWrite` or become the attester. But it **sees the write content and can censor** (decline to sponsor). Document this for app devs; it's an infra trust the client accepts, not an SDK one.

## Why this boundary matters

- **The SDK stays trustless + dependency-light** — `npm install @efs/sdk` adds no servers, no keys, no telemetry; a third-party app wires its own wallet, RPC, storage, and (optionally) sponsorship.
- **The client owns what only the client can** — the wallet (keys), the screen (and the mandatory mirror-render sandbox), and any infrastructure (sponsorship, pinning).
- **Sponsorship is portable** — the hackathon, our web client, and a third-party app all use the *same* SDK seam against *their own* funded relayer/paymaster. The SDK doesn't privilege ours.

## Open questions

- [ ] Finalize the `sponsorship` seam shape (endpoint contract: what the SDK POSTs, what the relayer returns — the bundle/tx status the SDK polls).
- [ ] A reference relayer implementation (client-repo / a separate small service) for the hackathon — out of SDK scope, but we should ship one so operators don't build it cold.
- [ ] Where the render-sandbox helper lives — pure guidance in the SDK docs vs a tiny optional `@efs/sdk/render` helper the client can use (still client-invoked).
