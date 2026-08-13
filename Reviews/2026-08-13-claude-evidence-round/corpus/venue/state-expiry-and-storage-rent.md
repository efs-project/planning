# Recovered Claude memo — State expiry and storage rent

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:55:28.406Z
**Claude task:** `ac15a813425c979c1`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3568
**Original result length:** 11291 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Research complete. WebSearch budget was exhausted at the start, so everything below comes from direct WebFetch of primary sources. All checks dated **2026-08-12**.

---

## (a) Is there any recurring cost to keep contract storage alive?

**No — on all four venues, storage is a one-time gas cost at write time, paid forever after. No rent, no expiry, no time-based charge.** `documented`

| Venue | Fee components | Recurring storage charge |
|---|---|---|
| Ethereum L1 | execution gas only | none `documented` |
| Arbitrum One | parent-chain data fee + child-chain execution gas + ArbOS precompile fees | none `documented` |
| OP Mainnet | execution gas + L1 data fee + operator fee (post-Isthmus) | none `documented` |
| Base | L2 execution fee + L1 security fee | none `documented` |

Arbitrum's docs mention "computation and storage charges that apply to the State Transition Function" — that is **one-time execution cost, not rent** `documented` ([docs.arbitrum.io/how-arbitrum-works/gas-fees](https://docs.arbitrum.io/how-arbitrum-works/gas-fees)).

**Arbitrum Orbit L3s / OP Stack L3s:** no rent — they run the same ArbOS/OP Stack fee models with an added parent-chain (L2) data fee. `inferred` — I did not fetch Orbit- or L3-specific fee docs before the time-box.

---

## (b) State expiry / Verkle / binary-tree status as of Aug 2026

**Bottom line: state expiry is not scheduled for any fork, and the tree it was designed for (Verkle) is itself stagnant.**

- **EIP-7736 (Leaf-level state expiry)** — status verbatim: `"🚧 Stagnant [Standards Track: Core]"`, created 2024-07-05, `Requires: EIP-6800`. Mechanism: `update_epoch` on Verkle extension nodes, 6-month epochs, leaf deletion, and a new resurrection transaction type priced by EIP-4762 constants. **Explicitly not rent** — resurrection is pay-on-demand. `documented` ([eips.ethereum.org/EIPS/eip-7736](https://eips.ethereum.org/EIPS/eip-7736))
- **EIP-6800 (Verkle tree state)** — verbatim: `"🚧 Stagnant [Standards Track: Core]"`, created 2023-03-17. `documented` ([eip-6800](https://eips.ethereum.org/EIPS/eip-6800)). Verkle's dependency being stagnant is why 7736 is dead in its current form.
- **EIP-7864 (Unified binary tree)** — verbatim: `"⚠️ Draft Standards Track: Core"`, created 2025-01-20. This is the live successor direction: arity-2, hash-only, post-quantum. It says the binary tree "will probably be the final state tree used in the protocol, compared with Verkle Trees, which would eventually need to be replaced." On expiry it only says state-expiry strategies "could still be applied, requiring a change in the design" (epoch metadata on stem nodes) — i.e. **expiry is not designed in**. `documented` ([eip-7864](https://eips.ethereum.org/EIPS/eip-7864))
- **ethereum.org roadmap** — "State expiry is still in the research phase and not yet ready to ship," and it is described as **deprioritized** relative to weak statelessness and history expiry, because those "make large state sizes easily manageable." Weak statelessness is "probably a few years away from Ethereum Mainnet." `documented` ([ethereum.org/en/roadmap/statelessness](https://ethereum.org/en/roadmap/statelessness/))

**Fork timeline** `documented` ([ethereum.org/en/roadmap](https://ethereum.org/en/roadmap/)):

| Fork | Date | State-growth content |
|---|---|---|
| Pectra | 2025-05-07 (shipped) | none relevant |
| Fusaka | 2025-12-03 (shipped) | PeerDAS; gas limit default → 60M; tx gas cap |
| **Glamsterdam** | **Q4 2026 (in dev)** | ePBS + Block-Level Access Lists headliners; **state gas repricing** (see (c)) |
| Hegotá | 2027 | under discussion |

**No state-expiry or state-rent EIP appears in the Glamsterdam meta EIP's inclusion list.** `documented`

---

## (c) State-growth pricing actually shipped or proposed

**Shipped in Fusaka** (EIP-7607, verbatim `"🎉 Final [Meta]"`, [eip-7607](https://eips.ethereum.org/EIPS/eip-7607)) `documented`:
- **EIP-7825** — transaction gas cap of 16,777,216 (2²⁴). Verbatim `"🎉 Final Standards Track: Core"`. ([eip-7825](https://eips.ethereum.org/EIPS/eip-7825))
- **EIP-7935** — default gas limit set to 60M.
- **EIP-7934** — RLP execution block size limit.
- **EIP-7642** (eth/69, drop pre-merge fields) — history-adjacent, not state.

**Scheduled for Inclusion in Glamsterdam** (EIP-7773, status `Draft`, [eip-7773](https://eips.ethereum.org/EIPS/eip-7773)) `documented`:

- **EIP-8037 — State Creation Gas Cost Increase.** This is the big one. ([eip-8037](https://eips.ethereum.org/EIPS/eip-8037))

  | Operation | Now | Proposed | Δ |
  |---|---|---|---|
  | New account creation | 25,000 | 183,600 | ~7.3× |
  | **SSTORE (new slot)** | **20,000** | **97,920** | **~4.9×** |
  | Code deposit / byte | 200 | 1,530 | 7.65× |
  | 24 kB contract deploy | 4,947,200 | 37,784,880 | ~7.6× |

  Motivation: after the 30M→60M gas limit raise, daily new state tripled from ~105 MiB to ~326 MiB; at a 200M limit state would grow ~387 GiB/year. **Explicitly a one-time cost, not rent.** `documented`

- **EIP-8038 — State-access gas cost increase** (verbatim `"Review Standards Track: Core"`, [eip-8038](https://eips.ethereum.org/EIPS/eip-8038)): COLD_ACCOUNT_ACCESS 2,600→3,000; ACCOUNT_WRITE 6,700→9,000; **STORAGE_WRITE 2,800→10,000 (+257%)**; STORAGE_CLEAR_REFUND 4,800→11,616. `documented`
- **EIP-7778** — Block Gas Accounting without Refunds. Verbatim `"⚠️ Review Standards Track: Core"`, created 2024-10-01. Refunds still credited to users but excluded from block-level gas accounting, closing "gas smuggling" (a block observed at 32.51 MGas gross vs a 30M limit). `documented` ([eip-7778](https://eips.ethereum.org/EIPS/eip-7778))
- Also SFI: EIP-7954 (increase max contract size), EIP-7976 (increase calldata floor cost), EIP-7981 (increase access list cost), EIP-8246 (remove SELFDESTRUCT burn), EIP-7610 (revert creation on non-empty storage).

**Declined for Glamsterdam:**
- **EIP-8032** — superlinear storage pricing: adds a `storage_count` per account and scales SSTORE by `LIN_FACTOR * ceil_log16(S_pre(addr)) / ACTIVATION_THRESHOLD`, so contracts get more expensive to write to as they accumulate slots. Verbatim `"⚠️ Draft Standards Track: Core"`, created 2025-09-29. **Still one-time per write, not rent.** `documented` ([eip-8032](https://eips.ethereum.org/EIPS/eip-8032)). Note a doc conflict: EIP-7773 lists it as Declined; the EIP-8032 page itself says nothing about Glamsterdam. `flag`
- Also declined: EIP-8053, EIP-8059 (gas metering), EIP-7971 (transient storage limits).

**History expiry (EIP-4444):** verbatim `"🚧 Stagnant [Standards Track: Networking]"`, created 2021-11-02, no fork activation named on the EIP page. `documented` ([eip-4444](https://eips.ethereum.org/EIPS/eip-4444)). **Flag: doc-vs-reality.** History expiry has been rolled out operationally by clients dropping pre-merge history, and Fusaka shipped EIP-7642 (eth/69) which drops pre-merge fields from the wire protocol — yet 4444 itself remains Stagnant. I could not verify the operational rollout within the time-box. And regardless: **history ≠ state; expiring history does not touch contract storage.**

---

## (d) Do the L2s charge for storage over time?

**No, and none has announced plans to.** `documented`

- **Base** — [docs.base.org/base-chain/network-information/network-fees](https://docs.base.org/base-chain/network-information/network-fees): L2 execution fee + L1 security fee, min base fee, EIP-1559 params, GasPriceOracle. No storage-rent concept anywhere on the page.
- **OP Mainnet / OP Stack** — [docs.optimism.io/stack/transactions/fees](https://docs.optimism.io/stack/transactions/fees): "composed of an Execution gas fee, an L1 data fee, and after the Isthmus upgrade, an operator fee." No storage rent.
- **Arbitrum One** — [docs.arbitrum.io/how-arbitrum-works/gas-fees](https://docs.arbitrum.io/how-arbitrum-works/gas-fees): parent-chain data component + child-chain execution component + dynamically-priced precompile fees. No storage rent.

**The relevant forward risk for L2s is not rent — it is inherited L1 gas repricing.** OP Stack and Arbitrum track the L1 EVM gas schedule, so Glamsterdam's ~4.9× SSTORE-new-slot and 7.3× account-creation increases would raise **one-time** write costs on Base / OP Mainnet / Arbitrum once they adopt the fork. `inferred` — I did not verify the L2s' Glamsterdam adoption plans.

---

## Practical answer for a project depending on durable contract storage

Storage you have already written on any of these four chains stays alive indefinitely at zero ongoing cost, and nothing scheduled through Glamsterdam (Q4 2026) changes that. `documented` The only credible mechanism that could ever charge for existing state is state expiry, which requires a state tree Ethereum has not committed to, sits at Stagnant/Draft, and is publicly deprioritized. `documented` The real cost trend is the **opposite** direction from rent: writing *new* state is getting substantially more expensive, one-time, in Glamsterdam. `documented`

---

## Could not verify

1. Any 2026 statement by Vitalik or core devs specifically reviving or further deprioritizing state expiry — WebSearch budget was exhausted, and I could not locate a working ethereum-magicians thread URL by guessing (one 404'd). The ethereum.org "deprioritized" framing is the only sourced position I have, and I could not date it.
2. All Core Devs notes / agendas — not fetched at all.
3. Whether the EIP-7773 Scheduled-for-Inclusion list is stable; the meta EIP is still `Draft` and SFI lists churn until fork-freeze. The fetch also reported "22 total" while enumerating 19 items — treat the list as indicative, not exhaustive. `flag`
4. Whether EIP-4444 / history expiry actually activated in practice despite the Stagnant status.
5. Arbitrum Orbit and OP Stack L3 fee docs — not fetched; L3 no-rent claim is inferred from the parent stacks.
6. Live current mainnet gas limit (60M is the Fusaka *default* per EIP-7935; validators may have raised it — EIP-8037 written against a 60M baseline and models 200M).
7. EIP-7736's last-updated date (not present on the page); Stagnant per EIP-1 implies ≥6 months of inactivity but I could not pin the exact date.
8. Whether Base / OP / Arbitrum have committed to adopting Glamsterdam's state-cost repricing.

**Sources:** [eip-7736](https://eips.ethereum.org/EIPS/eip-7736) · [eip-6800](https://eips.ethereum.org/EIPS/eip-6800) · [eip-7864](https://eips.ethereum.org/EIPS/eip-7864) · [eip-7773 (Glamsterdam)](https://eips.ethereum.org/EIPS/eip-7773) · [eip-7607 (Fusaka)](https://eips.ethereum.org/EIPS/eip-7607) · [eip-8037](https://eips.ethereum.org/EIPS/eip-8037) · [eip-8038](https://eips.ethereum.org/EIPS/eip-8038) · [eip-8032](https://eips.ethereum.org/EIPS/eip-8032) · [eip-7778](https://eips.ethereum.org/EIPS/eip-7778) · [eip-7825](https://eips.ethereum.org/EIPS/eip-7825) · [eip-4444](https://eips.ethereum.org/EIPS/eip-4444) · [ethereum.org/roadmap](https://ethereum.org/en/roadmap/) · [ethereum.org/roadmap/statelessness](https://ethereum.org/en/roadmap/statelessness/) · [docs.arbitrum.io gas-fees](https://docs.arbitrum.io/how-arbitrum-works/gas-fees) · [docs.optimism.io fees](https://docs.optimism.io/stack/transactions/fees) · [docs.base.org network-fees](https://docs.base.org/base-chain/network-information/network-fees)
