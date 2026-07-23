# SDK wallet / write-execution architecture — capability-based, adapter-pluggable

**Status:** review
**Target repos:** sdk, contracts (the authenticated in-account routine)
**Depends on:** [[sdk-write-ux]], [[sdk-architecture]] (EIP-1193/viem boundary, ADR-0008/0009)
**Reviewers:** 2026-06-20 — 5 expert passes (coherence, future-proofing, standards/viem, security, DX). Findings folded into this v2. Verdict: sound & buildable; corrections below.
**Last touched:** 2026-06-20 — sdk-designer (v2)

#status/review #kind/design

## Goal

Execute a built write plan across a heterogeneous, evolving set of accounts (plain EOA, MetaMask via EIP-5792, embedded/programmatic 7702, ERC-4337 smart accounts), giving each the best UX it can support **with the user as attester**, degrading gracefully, and **future-proof** — new wallets/standards slot in without touching the core. MetaMask is a first-class *fallback*; embedded-7702 / 4337 are the ideal one-sig targets. (`[[sdk-write-ux]]` = what's reachable; this = how the SDK is structured.)

## Principles

1. **Capability-based, not wallet-based** — the core branches on detected *capabilities*, never on a wallet brand.
2. **Strategy seam** — `buildFileWriteGraph` (unchanged) produces a plan; a pure selector picks a `Submitter`. Core is execution-agnostic.
3. **Adapter-pluggable** — account-stack plumbing lives behind `AccountAdapter`; **security-critical decisions do NOT** (see §Security). Core ships a generic viem adapter; heavy stacks are tree-shakeable subpackages; third parties register their own.
4. **viem/EIP-1193 boundary preserved** — narrow structural client interfaces (the existing `SubmitWalletClient`/`SubmitPublicClient` pattern), never viem's concrete types on the public contract.
5. **Tier-1 is the guaranteed floor.**
6. **Honest *and actionable* receipts** — `mechanism`/`signatureCount` plus a `reason` discriminant and `gasless` flag, so a UI can explain *why* it signed N times.
7. **Attester invariant enforced, not assumed** — a mandatory post-submit assertion `Attested.attester == account` on every non-Tier-1 path.

## Core abstractions

```ts
// INTERNAL rich profile (selector input). Capability-shaped — NOT EIP-5792 vocabulary on the public surface.
type AccountProfile = {
  address: Address
  kind: 'eoa' | 'eoa-7702-delegated' | 'smart-account' | 'unknown-counterfactual' | (string & {})
  // capability-shaped; the raw 5792 blob lives in `raw`, so a future batch standard maps without a break:
  batchExecution?: { atomic: 'supported' | 'ready' | 'unsupported' | (string & {}) }
  sponsorable: boolean
  /** Can an adapter run the EFS routine in THIS account's context (one-sig single file)? Capability, not vendor. */
  canRunInAccountRoutine: boolean
  /** Internal: which adapter + how. Never exposed on the public curated view. */
  inAccount?: { adapter: AccountAdapter; mechanism: WriteMechanism }
  raw?: unknown
}

// PUBLIC curated view returned by efs.account.capabilities() — answers the dev's actual question, no internals.
type AccountCapabilities = { kind: AccountProfile['kind']; canOneSig: boolean; gasless: boolean; sponsored: boolean }

interface Submitter {
  readonly mechanism: WriteMechanism                                   // OPEN enum (+ 'eip7702' added)
  submit(plan: FileWriteGraph, ctx: SubmitContext): Promise<WriteReceipt>          // single file (intra-plan dependent)
  submitBatch?(plans: FileWriteGraph[], ctx: SubmitContext): Promise<BatchReceipt> // independent ops (inter-plan)
}

interface AccountAdapter {
  readonly id: string
  detect(client: ExecClient): Promise<Partial<AccountProfile> | null>  // required; adapters are AUTHORITATIVE over getCode
  inAccountSubmitter?(profile: AccountProfile, deployment: EfsDeployment): Submitter  // optional
}
```
`ExecClient`/`SubmitContext` follow the existing narrow-structural pattern (`submit.ts`'s `SubmitWalletClient`) — mockable, viem-decoupled.

## The layers

### Detection (pure, cached, testable)
`detectAccount(client, adapters) → AccountProfile`:
- `getCode(address)`: `0xef0100‖impl` ⇒ `eoa-7702-delegated`; `0x` ⇒ `eoa` **(necessary-not-sufficient — an undeployed counterfactual 4337 account is also `0x`)**; other ⇒ `smart-account`. **Adapters are authoritative over `getCode`** (a stack adapter recognizes its own counterfactual account and corrects `kind`).
- `getCapabilities(address,[chainId])` → **unwrap the nested viem shape** `caps[chainId].atomic?.status` / `caps[chainId].paymasterService?.supported` (both optional) into the normalized `batchExecution`/`sponsorable`.
- Merge adapter `detect()` results; first adapter with `inAccountSubmitter` sets `canRunInAccountRoutine` + the internal `inAccount` handle (a resolved handle, not a dangling id).
- **Cache keyed on the *signing* account+chain, invalidated on `accountsChanged`/`chainChanged`/connector switch.** The profile that selects the submitter MUST derive from the account that will actually sign (attester-invariant correctness).

### Selection (pure, two entry points over one core)
- **Single file** `selectSingle(profile, plan) → Submitter`: in-account routine if `canRunInAccountRoutine` → else **Tier-1** (a single file's dependent DAG can't be statically batched, so 5792 atomic does NOT apply here — proven in `[[sdk-write-ux]]`).
- **Independent batch** `selectBatch(profile, plans[]) → Submitter`: 5792 atomic (one popup + paymaster) if available → else Tier-1 sequential. (`efs.batch` is the only place 5792 atomic is used.)
- The two share one pure capability core; arity is the discriminator (a single `FileWriteGraph` is intra-plan dependent; `plans[]` are inter-plan independent). Pure, fixture-tested, no I/O.

### Submitters (one normalized receipt contract)
All submitters **return** a `WriteReceipt` whose `status` faithfully reflects `confirmed`/`partial`/`reverted` (never throw-on-partial — a thrown partial loses the landed-UID `steps[]`). Mechanism-specific failures are normalized at the submitter boundary: Tier-1's thrown `WriteRevertedError` → a `partial` receipt; 5792 status `600` (partial revert) → `partial`; etc. **All paths parse `Attested` from a `readonly Log[]` seam** — Tier-1 `receipt.logs`, 5792 each `getCallsStatus().receipts[i].logs`, 4337 the **UserOp-scoped** `userOpReceipt.logs` (NOT the bundle `receipt.logs`, which mixes other UserOps). `extractMintedUIDs` is refactored to take `Log[]`, not `TransactionReceipt`.
- `Tier1Submitter` (`'sequential'`) — wraps the built `submitWriteTier1`.
- `Eip5792Submitter` (`'eip5792'`) — `sendCalls → waitForCallsStatus` (+ `paymasterService`); handles status `600`; `submitBatch` collapses independent plans into one popup; a single dependent file delegates to Tier-1.
- `InAccountSubmitter` (`'eip7702'` / `'erc4337'`) — runs the **authenticated** routine in the account's context. Carries the §Security invariants + the **mandatory post-submit attester assertion**.

### Adapters (extensibility) + DX integration
- **Primary integration is auto-detect from a passed client** (the dev already built their smart-account client): `createEfsClient({ account: kernelClient, chain })` lights up the AA path; `createEfsClient({ provider, chain, account })` is the EOA/MetaMask path. The `account` input accepts `Address | Account | SmartAccountClient`. **`adapters: [...]` is the escape hatch for novel stacks, not the headline.** Adapters take the dev's already-built client (thin wrapper), never construct one.
- Core: a generic viem adapter (5792 detection + programmatic-7702 when the SDK controls the key). Optional tree-shakeable subpackages `@efs/sdk/adapters/{zerodev,biconomy,privy,...}`. A MetaMask hobbyist imports none.

## Gas sponsorship (orthogonal axis: *who pays* ≠ *how many signatures*)

Sponsorship is **independent** of the execution strategy. Every Submitter can run sponsored or unsponsored; selection produces *two* outputs — the execution strategy (signatures) and the sponsorship mode (gas). The **funded key + the relayer/paymaster server are client-owned infra** (see [[sdk-vs-client-responsibilities]]); the SDK only produces payloads + routes to a configured endpoint and **never holds the key**. The user is the attester in **every** sponsor mode (the sponsor pays, never attests).

| Sponsor mode | For | How (SDK ⇄ client infra) | Attester | Contract? |
|---|---|---|---|---|
| **Delegated relayer** | any wallet (Tier-1 / plain EOA — the universal, MetaMask-friendly path) | SDK builds `multiAttestByDelegation` EIP-712 payloads → user signs (gasless) → SDK POSTs to the client's **relayer** → relayer submits + pays | the **signer** (user) — EAS records the delegated-attest signer | **none** (EAS-native) |
| **ERC-7677 paymaster** | 5792 / smart-account / 7702 (fewer prompts) | the wallet/bundler calls the client's **paymaster service** during `sendCalls`/UserOp (the `paymasterService` capability) | the **account** (user) | a paymaster *service* (off-chain signer) or existing infra (Pimlico/CDP); a custom paymaster contract is optional, not required |

So sponsorship layers onto whichever strategy was selected: MetaMask single file → Tier-1 (optionally via the delegated relayer = gasless, a few prompts); 5792 multi-op → `Eip5792` + paymaster (gasless, one popup); embedded-7702 one-sig → `InAccount` + paymaster (gasless, one sig). The combined selector: `selectExecution(profile, plan, sponsorship) → { submitter, sponsored }` (still pure).

**Sepolia hackathon = the delegated-relayer mode, zero contracts.** EAS already supports `multiAttestByDelegation`, so the gasless hackathon path needs **no new contract** — just the SDK seam + a small client-run relayer holding the funded SepoliaETH key. (The contracts work in this design is the *one-signature* in-account routine — a separate axis from gas.) The SDK should ship a **reference relayer** (client-repo, out of `@efs/sdk`) so operators don't build it cold.

**Security (from the review):** a relayer/paymaster gates **gas only** — it cannot alter the `FileWrite` or become the attester. It **does see the write content and can censor** (decline to sponsor); that's an infra trust the client accepts, documented for app devs. The post-submit attester assertion (§Security) still runs, so a misbehaving relayer can't slip the attester.

**SDK seam:** `createEfsClient({ …, sponsorship: { mode: 'delegated-relayer' | 'paymaster', endpoint } })`. Open questions: the endpoint contract (what the SDK POSTs / what status it polls back); the reference relayer.

## Public surface

```ts
createEfsClient({ account: Address|Account|SmartAccountClient, provider?, chain, adapters?, paymaster? })
await efs.fs.write('/a.txt', bytes)        // detect → selectSingle → submit; one call. NO wallet field ever on WriteOptions.
await efs.batch([...])                      // independent-op batching (array form); resolves with partialFailure, never throws
await efs.fs.preview('/a.txt', bytes)       // runs the SAME selector → { mechanism, signatureCount, gasless } BEFORE the first popup
efs.account.capabilities()                  // read — the curated AccountCapabilities ({ canOneSig, gasless, ... })
efs.account.foreignDelegation()             // read — a non-EFS 7702 delegate present? (gates signing)
await efs.account.revokeDelegation()        // WRITE — the 7702 reset tx (honest name: this pops a signature)
// receipt: { mechanism, signatureCount, status, gasless, reason: { selected, why, gasless }, steps[] }
```
The hobbyist never sees the wallet layer; `efs.account.*` is read-by-default with one honestly-named write.

## Security (the load-bearing section — elevated by the security pass)

**The shipped `EFSLib.writeFile` has NO authentication** (a bare `eas.attest` loop). It MUST NOT be a user-EOA 7702 delegate target as-is — doing so lets anyone compose attestations (and revoke placements) under the victim's lens. Until the authenticated wrapper exists and is **audited**, `EFSWriter` is documented **app-contract-attester-only, never a user-EOA delegate target**.

**The authenticated in-account routine (7702 impl / 7579 module) MUST be:**
1. **Stateless** + **non-reentrant** (named; transient-storage guard on the single entry — EAS `_db` is external state read back mid-graph).
2. No value movement / approvals / `delegatecall` / `selfdestruct` / upgradeability / admin.
3. **Single narrow typed entry** (no generic `execute(bytes)`).
4. **Per-write authorization**, EIP-712 domain `{ name, version, chainId (concrete, ≠0), verifyingContract = address(this) }`, payload `{ FileWrite, nonce, deadline }`, recovered signer **MUST == address(this)** (works under 7702 — `address(this)` is the executing EOA; OZ `SignerEIP7702` is the reference). For a *contract* account, route auth through the account's own validator (**ERC-1271**), reserving raw EIP-712 for the bare-7702-EOA case — so the invariant doesn't age into "only raw-secp256k1 EOAs."
5. **Replay-closed** (used-nonce + deadline) — prevents stale-write downgrade/griefing on the cardinality-1 PIN slots.
6. **Malleability-handled** (typed-data + low-`s`).
7. **Codehash-pinned** — pin `keccak256(getCode(impl))` (not just the address), verified on-chain **by the SDK core** before any `signAuthorization`.
8. **Concrete chainId** (never 0).

**The SDK core — never an adapter — owns the security-critical operations:** delegate-address validation against the codehash-pinned registry; the `signAuthorization` invocation; EAS-address + schema-UID resolution from the deployments registry; re-hashing the built `FileWrite` against what the user approved (catch a tampering adapter pre-sign); and the post-submit attester assertion. **Adapters supply transport plumbing only** and are documented as **fully-trusted code** (vet like a dependency); first-party adapter subpackages are integrity-pinned (OIDC trusted publishing, ADR-0004). `foreignDelegation()` **gates signing** (refuse / hard-warn — not merely report) to counter the 2025 7702-phishing drains. Paymasters gate gas only (no content/attester leverage) but **see the write content and can censor** — documented so app devs don't assume sponsorship is neutral.

## Future-proofing

- **Open `WriteMechanism` enum** (add the `(string & {})` tail — it's currently closed, a self-contradiction; + add `'eip7702'`), capability-keyed selection, the pure detect→select→submit pipeline. The only specifics-aware code is detection + adapters.
- **Public surface is capability-shaped, not 5792/vendor-shaped** — `AccountCapabilities` exposes `canOneSig`/`gasless`, never `atomic: 'ready'` or an `adapterId`. The raw 5792 blob is quarantined in `AccountProfile.raw`.
- **Adapters contribute capability fragments** (into `raw`/a capability map), decoupling the adapter contract from the public DTO so they evolve independently. The `fs`→`eas`→`raw` tiering + subpackage split matches where the ecosystem consolidated (ERC-7579 + EntryPoint v0.8 native 7702 — confirmed).
- **Routine versioning lifecycle:** the deployments registry holds the routine codehash per `(chainId, standard, version)`; the SDK selects the newest it pins; migration = `revokeDelegation()` + re-delegate; old routines deprecated-but-honored. Bounds the audited-contract trust surface to a deliberate list.

## Open questions (post-review residue)

- [ ] The ERC-1271-vs-raw-EIP-712 auth split for contract accounts — design with the contracts agent.
- [ ] wagmi/React: `AccountCapabilities` query-key stability (address+chainId+connector) + connector-switch invalidation + Suspense.
- [ ] Confirm `'gateway'` `WriteMechanism` = the delegated-attestation relayer path; document it.

## Implementation notes

```
- [ ] sdk — types: open WriteMechanism (+ 'eip7702'); AccountProfile/AccountCapabilities; receipt `reason`+`gasless`; extractMintedUIDs → Log[]
- [ ] sdk — detectAccount (pure, cached on signing account, unwraps nested caps, adapters authoritative)
- [ ] sdk — Submitter seam + selectSingle/selectBatch (pure); Tier1Submitter wraps existing path; normalized partial-failure receipt
- [ ] sdk — Eip5792Submitter (sendCalls/waitForCallsStatus/600/paymaster) + efs.batch (array, resolve-with-partialFailure)
- [ ] sdk — auto-detect a SmartAccountClient from `account`; adapters:[] as escape hatch; account.{capabilities,foreignDelegation(gates signing),revokeDelegation}
- [ ] sdk — preview() runs the selector (mechanism/signatureCount/gasless pre-commit)
- [ ] contracts — the AUTHENTICATED in-account routine (7702 impl + 7579 module) over EFSLib: the full §Security invariant set; ADR; audit-before-mainnet. EFSLib/EFSWriter NatSpec: "never a user-EOA delegate target without the auth wrapper."
- [ ] sdk — core owns security-critical ops (delegate codehash-validation, signAuthorization, EAS/schema resolution, post-submit attester assertion); adapters = transport only
```
