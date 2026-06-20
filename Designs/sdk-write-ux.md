# EFS write UX — account-abstraction-native, proven feasibility

**Status:** review
**Target repos:** sdk, contracts (in-account routine: a 7702 impl + a 7579 executor module — NOT frozen schema contracts)
**Depends on:** [[sdk-minimal-clicks]], [[efs-write-ux-attester]]
**Supersedes:** [[sdk-one-signature-writes]]
**Reviewers:** 2026-06-20 — 2 deep research dives (EAS delegated/gasless feasibility; 2026 AA/paymaster wallet landscape), both source-verified.
**Last touched:** 2026-06-20 — sdk-designer

#status/review #kind/design

## The constraint, now proven at contract level

An EFS file write is ~13 **dependent** EAS attestations: each call's `refUID` = a previous call's *mined* UID. Two contract facts (verified from `EAS.sol`):
- **`attester = msg.sender`** of the `eas.attest` call.
- **The UID folds `time = uint64(block.timestamp)`** — forced on-chain, unknowable when signing, and it cascades through the 13-deep refUID chain.

**Therefore:**
1. **Off-chain UID precompute is impossible**, and a *statically encoded* batch (plain EIP-5792 `wallet_sendCalls`, or 4337 `executeBatch` with baked refUIDs) **cannot** thread the dependent chain. The chaining must happen **dynamically at execution** (a loop that reads each returned UID and feeds the next `refUID`).
2. **That loop must run *inside the user's account*** so `msg.sender` at `eas.attest` is the user. The single hard trap: an external helper/multicall that loops `eas.attest` in *its own* context makes the helper the attester → breaks EFS lenses. (4337 and 7702 are both safe — the account/EOA is `msg.sender`; the EntryPoint/bundler/paymaster never is. Verified.)

So there is **no off-chain-signature trick** that gives a plain EOA a one-signature single-file write. The one-signature win *requires in-account dynamic execution of the EFS routine.* This is the spine of the whole design.

## Two independent axes

- **Signature count** → needs in-account execution (7702-delegated EOA, or a 4337 smart account running an executor module). Only reachable on accounts that can run *our* routine.
- **Gas** → sponsorable almost everywhere and **independently**, keeping the user as attester: ERC-7677 paymaster (via 5792 `paymasterService` / 4337 paymaster), or EAS **delegated attestation** (`multiAttestByDelegation` — signer is the attester, relayer pays). "Gasless" and "fewer popups" are separate wins; we pursue both.

## Who can actually run the in-account EFS routine (the reachability that decides everything)

| Segment | One-sig in-account routine? | Attester | Gasless | Notes |
|---|---|---|---|---|
| **Embedded / programmatic 7702** (Privy, Dynamic — the wallet SDK holds the key) | **YES** — `signAuthorization({ contractAddress: <EFS routine> })` | **the user's own EOA address** (cleanest — no second address to reconcile in lenses) | Yes | Fastest-growing onboarding cohort. **Best path.** |
| **4337 smart accounts** (ZeroDev/Kernel, Biconomy/Nexus) | **YES** — via an **ERC-7579 executor module** (Kernel) or Biconomy MEE composability (native return-value→next-call splicing) | the smart-account address (= the user's account) | Yes | Covers the 4337 population. |
| **Coinbase Smart Wallet / Base** | Conditionally — chaining must run via the account's own `execute`, not an external helper | smart-account addr | Yes (CDP paymaster) | 1M+ users, default on Base. Validate the `msg.sender` path. |
| **Consumer injected 7702 wallets** (MetaMask, Rabby, OKX) | **NO** — they delegate the EOA **only to their own delegator** and reject dapp authorizations → static batch only, which the dependent chain defeats | EOA | Yes | One-sig for *independent* batches only; not single-file. |
| **Plain injected EOA** (no 7702/5792) | No | EOA | via delegated-attest relayer | Sequential fallback; nudge a 7702 upgrade. |

Adoption read (2026): embedded wallets growing ~3× injected EOAs; EIP-7702 ~12.5M authorizations since Pectra (fastest-moving signal); injected MetaMask still the dominant installed base; Base/Coinbase Smart Wallet 1M+. Convergence on "smart EOAs (7702) + embedded wallets."

## Architecture: AA-native SDK + the routine as in-account code

1. **A capability-detect → strategy selector** (pure `(getCapabilities, getCode) → WriteMechanism`, Tier-1 default, surfaced only via the honest `receipt.mechanism`/`signatureCount`). Detection: `getCode(addr)` (`0xef0100‖impl` = 7702-delegated; `0x` = plain EOA; other = smart account) + `getCapabilities` (`atomic` tri-state, `paymasterService`).
2. **The EFS chaining routine ships as IN-ACCOUNT code, two forms of the *same* core** (`EFSLib.writeFile`, which already threads UIDs in-memory):
   - a **7702 implementation contract** (the EOA delegates to it; `execute()` runs the write) — for embedded/programmatic 7702.
   - an **ERC-7579 executor module** — for 4337 smart accounts (Kernel/Nexus).
   These are deployable helpers, **not** schema-bound/frozen contracts. They reuse the compile-in `EFSLib` (ADR-0003).
3. **Gas-sponsorship layer** (ERC-7677 paymaster) plugged into each path where the wallet supports it; plus an optional EAS-delegated-attestation relayer path for gasless multi-sig on plain EOAs.
4. **Tier-1 (`submitWriteTier1`)** is the always-correct universal fallback (works on every wallet; user pays gas; 2–3 popups).

### Security invariants for the in-account routine (banked from the earlier security pass — load-bearing)

The 7702 impl / 7579 module MUST be: **stateless** (no storage); **no value movement / approvals / `delegatecall` / `selfdestruct` / upgradeability / admin**; **single narrow entry** (no generic `execute(bytes)`); **per-write authenticated** — the `FileWrite` params bound to the user's own signature (EIP-712), so a *persistent* 7702 delegation can't be abused by a third party to publish under the user; **deterministic deploy + codehash pinned** in the registry, verified on-chain before any delegation; **concrete `chain_id`** (never 0). 7702 delegation **persists until explicitly cleared** — the SDK must offer `clearDelegation()` + detect a foreign delegation. (These collapse the residual risk of an installed delegate to "nothing without the user's per-write signature.")

## Build sequencing (max UX reach, min complexity)

1. **Tier-1 = v1** (built; universal; user-attester). Ship.
2. **`efs.batch` via 5792 `sendCalls` + `paymasterService`** — one popup + gasless for *independent* multi-op flows (many files/tags), reachable on MetaMask today, **no new contract**. The cheap near-term win.
3. **The in-account routine: embedded/programmatic 7702 FIRST** (one-sig + gasless + attester = the user's own EOA; the fastest-growing, cleanest-attester cohort), then the **7579 executor module** for 4337 smart accounts. This is where contracts work is needed (the routine + the two wrappers + the security invariants + an audit before mainnet).
4. **5792 capability detection** as the universal selector + graceful degrade for plain/consumer-injected EOAs.

## Open questions

- [ ] **Lead integration:** confirm embedded-7702 (Privy/Dynamic) as the first concrete target vs a 7579/Kernel demo. (Rec: embedded-7702 — cleanest attester + biggest growth.)
- [ ] **Biconomy composability** — confirm the audit remediation + that `eas.attest`'s single `bytes32` return splices into the next `refUID` (the one stack that does dependent chaining natively — worth a closer look as a reference).
- [ ] **Coinbase/Base route** — confirm chaining runs in the smart-account's own context (attester-trap check).
- [ ] **Per-write-auth scheme** for the routine (EIP-712 over `FileWrite`) — design it with the contracts agent.
- [ ] **viem wiring** — `signAuthorization` + `authorizationList` (programmatic 7702), `sendCalls`/`getCallsStatus`/`getCapabilities` (5792), `account-abstraction`/permissionless for 4337.

## Implementation notes

```
- [ ] contracts#NNN — EFS in-account write routine: 7702 impl + ERC-7579 executor module over EFSLib.writeFile; per-write EIP-712 auth; security invariants; CREATE2 + codehash; ADR; audit-before-mainnet
- [ ] sdk#NNN — capability-detect → strategy selector (pure, fixture-tested); receipt mechanism/signatureCount
- [ ] sdk#NNN — efs.batch (5792 sendCalls + paymasterService) for independent ops
- [ ] sdk#NNN — programmatic-7702 path (signAuthorization → routine) + 4337/7579 path; clearDelegation() + foreign-delegation detection
- [ ] sdk#NNN — Tier-1 stays the default fallback
```

Net: the one-signature write is real and reachable — for embedded/smart-account users (the growing default), via the EFS routine running *in their account*, gaslessly, with the user as attester. Plain injected EOAs get gasless multi-sig and `efs.batch`; everyone has the Tier-1 fallback. No frozen-contract changes; the new contracts are deployable, audited helpers.
