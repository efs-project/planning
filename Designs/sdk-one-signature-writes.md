# One-signature writes — corrected after expert review

> **SUPERSEDED (2026-06-20) by [[sdk-write-ux]]** — the deep AA/feasibility research broadened this into the full write-UX design (the one-sig win IS reachable for embedded/smart-account users via the EFS routine running *in their account*; the 2-axis signature-vs-gas model; the in-account 7702-impl + 7579-module architecture). This doc is retained for the reasoning chain that got there.

**Status:** superseded
**Target repos:** sdk (no new contracts)
**Depends on:** [[sdk-minimal-clicks]], [[efs-write-ux-attester]]
**Reviewers:** 2026-06-20 — 3 expert passes (security/7702-trust, standards/EIP+viem, architecture/alternatives). All three independently rejected the first draft's mechanism; this is the corrected design.
**Last touched:** 2026-06-20 — sdk-designer

#status/review #kind/design

## Problem

A single EFS file write is ~13 attestations whose later layers reference earlier UIDs → 2–3 wallet popups today (Tier-1, one `multiAttest` per DAG layer). Goal: fewer popups **without changing the attester** — the user's own wallet must stay the attester so lenses are user-owned (browse `?lenses=vitalik.eth`).

## What the review overturned (the first draft was wrong)

The first draft proposed: the SDK signs a 7702 authorization delegating the user's EOA to an EFS-blessed `EFSWriterDelegate`, carried in a `wallet_sendCalls` bundle. **Three independent reviewers found this unworkable:**

1. **The SDK can't sign a 7702 auth for a connected wallet.** viem `signAuthorization` is local-private-key-only; `wallet_sendCalls` has **no** `authorizationList` param and never references 7702. 7702 is **wallet-internal** — the dapp supplies *calls*, never an authorization tuple.
2. **Wallets won't delegate to a custom contract.** MetaMask (and most) delegate **only to their own fixed delegator** — a dapp cannot point a user's EOA at `EFSWriterDelegate`. So the bespoke delegate is *unreachable* on the target wallets.
3. **It isn't needed anyway.** A 7702-upgraded EOA (or a 4337 smart account) is **already the user as attester** — 7702 sets code *at the EOA's own address*, so `msg.sender` at `eas.attest` is still the user, and EFS has **no attester gate** (a contract writes as its own lens). No EFS delegate required.
4. **A bare-auth delegate would be a real exploit** (security pass): an entry that runs submitter-chosen `FileWrite` calldata gated only by a 7702 auth lets an attacker publish **attacker content under the victim's attester identity** — the central thing to prevent in a lens-keyed system.

## Decision (corrected)

**Ship Tier-1 as v1. Get one-popup from `wallet_sendCalls` atomic batching — not a bespoke delegate. Drop the `EFSWriterDelegate` contract entirely.**

A staged strategy behind a pure capability→mechanism selector (Tier-1 is always the guaranteed default):

| Stage | Mechanism | User = attester? | One sig for ONE file? | Wallet support | New contract? |
|---|---|---|---|---|---|
| **v1 (built)** | `sequential` — `submitWriteTier1` | ✅ | No (2–3 popups) | **Every** wallet | None |
| **Fast-follow (cheap, real)** | `eip5792` — `sendCalls` atomic batch of **independent** ops (many files/tags) | ✅ | N/A — collapses *multi-op* batches, not one file's dependent DAG | MetaMask + growing, today | None |
| **Later (account-gated)** | `erc4337` / SA-executor — run `EFSLib.writeFile` in the account's own context | ✅ (SA/EOA addr = user) | ✅ even one file (UID threading in-contract) | Programmable / embedded / 7702-custom-delegate accounts (NOT injected MetaMask) | None deployed by EFS — compile-in `EFSLib` (ADR-0003) hosted by the account/app |

- **The single-file one-signature win is only reachable when `EFSLib.writeFile` can run in one call with the user/SA as `msg.sender`** — i.e. on a *programmable* account (4337 module, or a framework that lets the user's embedded wallet delegate to an EFS routine-host). Injected MetaMask can't do single-file-one-sig (it won't host a custom routine + can't pre-encode the dependent DAG as independent calls). That's a smaller, later audience — scope it to a concrete integration before building.
- **Path B (app-contract as attester)** stays **publisher-only** (rejected for user content — confirmed correct: the app collapses every user into one lens).

## Corrected mechanics (for the `eip5792` stage)

1. **Detect:** `getCapabilities(account, [chainId])` → read `caps[chainId].atomic.status` (the EIP-5792 tri-state). `'supported'` ⇒ one-popup eligible; `'ready'` ⇒ eligible (wallet may show a one-time upgrade prompt); else ⇒ Tier-1. **There is no 7702/delegation capability key** — gate on `atomic`, nothing else. (`atomic: supported` is also satisfied by a Safe/SA — fine; "Tier-2 = atomic sendCalls", not "= 7702".)
2. **Submit (one popup):** `sendCalls({ account, chain, calls, atomicRequired: true })`. The wallet shows one confirmation and, if it's a 7702-capable EOA, internally does the delegation+execution as one type-4 tx. The SDK does **not** call `signAuthorization` or pass an authorization.
3. **Resolve:** `sendCalls` returns a **bundle id, not a tx hash** → poll `getCallsStatus(id)` until `status: 'success'` → read `receipts[].logs` → `parseEventLogs(Attested)` (reuse `extractMintedUIDs`).
4. **Fallback:** capabilities absent → `submitWriteTier1` unchanged. **Do not** use viem's `experimental_fallback` (its sequential path skips EFS's cross-layer UID threading → malformed dependent attestations).
5. **Selector:** a pure `(capabilities, accountType) → WriteMechanism` function, fixture-tested, Tier-1 default, surfaced only via the honest `receipt.mechanism`/`signatureCount`. The branch lives in `efs.fs.write`, above `writeFileTier1` (which keeps `mechanism: 'sequential'`).

## If/when a custom-delegate (embedded-account) path is ever built — security invariants (banked from the security pass)

Only relevant for the *later* account-gated stage on frameworks that allow custom delegates. Any EFS routine-host the user delegates to MUST be: **stateless** (no storage — `EFSLib` threads UIDs in memory); **no value movement / approvals / `delegatecall` / `selfdestruct` / upgradeability / admin**; **single narrow entry** (no generic `execute(bytes)`); **per-write authenticated** — the write params must be bound to the user's own signature (EIP-712 over the `FileWrite`), NOT just a 7702 auth, or an attacker publishes under the victim's identity; **self-call entry only** (attester = EOA, verified through the real submission path); **deterministic deploy + codehash pinned** in the registry and verified on-chain before any delegation; **concrete `chain_id`** (never 0); and the SDK must offer **`clearDelegation()` / detect a foreign delegation**. 7702 delegation is **persistent until explicitly cleared** (not per-tx — the first draft was wrong on this).

## Open questions

- [ ] Confirm the exact `getCallsStatus` polling + receipt-hash extraction shape against current viem when building the `eip5792` stage.
- [ ] Define the independent-op batch surface (`efs.batch([...])`) the `eip5792` stage exposes — this is the real near-term value (write N files/tags in one popup).
- [ ] Defer the single-file one-sig stage until a concrete programmable/embedded-account integration justifies the account-specific work.

## Recommendation / sequencing

1. **v1: Tier-1** — done, universal, user-attester. Good enough to ship.
2. **Next one-popup win: `eip5792` independent-op batching** (`efs.batch`) — real on MetaMask today, **no delegate, no audit, no new contract**. This is the cheap, reachable "fewer popups" the goal actually wants for multi-op flows.
3. **Single-file one-signature:** account-gated fast-follow via `EFSLib`-in-account-context (`mechanism: 'erc4337'`), no EFS singleton — build when a target account ecosystem justifies it.

Net: no new immutable EFS contract, no audit-gated delegate, and the user stays the attester throughout. The first draft's `EFSWriterDelegate` is **cancelled** (do not hand it to the contracts agent).
