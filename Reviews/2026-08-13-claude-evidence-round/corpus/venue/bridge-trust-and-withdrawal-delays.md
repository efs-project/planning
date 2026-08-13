# Recovered Claude memo — Bridge trust models and withdrawal delays

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:56:41.911Z
**Claude task:** `a26aacc6f234f578b`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3574
**Original result length:** 12564 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Web research done (search budget was exhausted at the outset, so everything below comes from direct WebFetch of primary URLs). All checks: **2026-08-12**.

⚠️ Methodology caveat: L2Beat project pages truncate under WebFetch, so several L2Beat facts come from its `/api/scaling/summary` JSON and from its GitHub config source rather than the rendered page. Where the fetch summarizer may have conflated fields, I say so.

---

## (a) L2 canonical bridge trust models

### Arbitrum One
- **Challenge period: 6.4 days** — `documented`, docs.arbitrum.io: "a 6.4-day challenge period" for child→parent transfers. https://docs.arbitrum.io/how-arbitrum-works/validation-and-proving/rollup-protocol
- **Doc-vs-doc conflict** `documented`: the *same* Arbitrum docs set says both "approximately 7-day challenge period" (https://docs.arbitrum.io/how-arbitrum-works/l2-to-l1-messaging) and "6.4 days"/"seven-day challenge period" on the rollup-protocol page. 6.4 days is the real `confirmPeriodBlocks` value; "7 days" is marketing rounding. Treat 6.4 d as the number.
- **Fault proofs: live and permissionless (BoLD)** — `documented`: "is active on Arbitrum One, Arbitrum Nova, and Arbitrum Sepolia"; "anyone to participate in validating the chain state". Proposer bond **3,600 ETH** on Arbitrum One (bonding pools allow crowdsourcing). https://docs.arbitrum.io/how-arbitrum-works/bold/gentle-introduction
- **Worst-case confirmation ≈ 13–14 days** `documented` (same page): "two challenge periods, plus a two-day grace period for the Security Council to intervene".
- **L2Beat stage: Stage 1** — `reported` (l2beat.com/api/scaling/summary). Risks reported there: self-sequence (≤1 day force-include), interactive fraud proofs, onchain DA, self-propose. Its "Exit Window" field returned contradictory text ("None" + "10-day exit window through L2/L1 delays") — `unknown`, do not rely on it.
- **Security Council: 12 members, DAO-elected** — `documented` https://docs.arbitrum.foundation/concepts/security-council. **Emergency vs non-emergency thresholds (commonly cited 9/12 and 7/12) — could NOT verify today**; the page only documents removal thresholds (9 members, or DAO vote with 5/6 in favor at 10% participation).

### OP Mainnet
- **Challenge period: 7 days** — `documented`: "the challenge period (7 days on mainnet, shorter on test networks)". https://docs.optimism.io/app-developers/bridging/messaging
- **Fault proofs live and permissionless** — `documented`: "allow anyone to make proposals… anyone to challenge proposals". https://docs.optimism.io/stack/fault-proofs/explainer
- **Guardian = Optimism Security Council**, which can "pause withdrawals, blacklist games, or revert to a permissioned system" — `documented`, same page. This is the load-bearing trust assumption: the bridge is permissionlessly proven but Guardian-vetoable.
- **Spec parameters** — `documented` https://specs.optimism.io/protocol/configurability.html: proof maturity delay **7 days**, dispute-game finality delay **3.5 days** (Guardian blacklist window), bond withdrawal delay 7 days. The fetch summarizer added these to claim a "10.5-day minimum" — that arithmetic is `inferred` by the summarizer, **not** documented, and I believe it is wrong (the delays are not simply additive for a user withdrawal). User-facing delay remains 7 days.
- **L2Beat stage: Stage 1**; exit window "None — Security Council has instant upgrade power without notice" — `reported` (l2beat.com API).
- **Upgrade path**: OP Stack ProxyAdmin owner / Security Council; exact multisig threshold — `unknown`, not verified today.

### Base
- **Challenge period: 7 days** — `documented`, user-facing: "Standard withdrawals to Ethereum must wait 7 days before they can be finalized." https://docs.base.org/base-chain/network-information/bridging-and-withdrawals
- **Upgrade control: 2-of-2 nested multisig** — `documented` https://docs.base.org/base-chain/security/security-council: "CB Signers: a 3-of-6 multisig operated by Coinbase" AND "an 8-of-11 multisig composed of 11 independent entities"; "Any upgrade requires the approval of 9 of them". **No upgrade delay is documented** → matches L2Beat's exit window "None — contracts instantly upgradable by multisig and security council" (`reported`).
- **L2Beat stage: Stage 1**; state validation reported as **"Fraud proofs (1R, ZK)"** — `reported`, and consistent with the Azul spec below, but I could not confirm it on the rendered L2Beat page.

---

## (b) Has anyone shortened the 7 days?

**Short answer: not for the user-facing canonical withdrawal, on any of the three — but Base has a published design that does, and it is in Base's production docs.**

- **Base "Azul" upgrade — the real finding.** `documented` https://docs.base.org/base-chain/specs/upgrades/azul/proofs. Azul replaces the single output proposer with an `AggregateVerifier` and moves to "a multi-proof design built around TEE and ZK provers." Published settlement windows:
  - TEE only → **7 days**
  - ZK only → **7 days**
  - **TEE + ZK (both agree) → 1 day**
  - `DelayedWETH` bond escrow delay also reduced to **1 day**.
  - Proposer is **permissioned**; ZK provers are "permissionless"; "Anyone can run a challenger."
  - **Justification published**: redundancy between two independent proof systems (Nitro-Enclave TEE + ZK) substitutes for the long optimistic window; a ZK proof can override an invalid TEE-backed proposal.
  - **⚠️ Doc-vs-doc disagreement to flag**: Base's user-facing bridging page (checked the same day) still states a flat 7 days and explicitly says third-party fast bridges "do not make the underlying standard withdrawal challenge period shorter." **Whether Azul is active on Base mainnet today, and whether the 1-day path is what users actually get, is `unknown`** — the Azul spec page carries no activation date or status wording, and I could not reach a Base blog/governance post to confirm.
- **OP Mainnet: no shortening.** `documented` — docs.optimism.io still says 7 days; the fault-proof explainer contains no mention of shortening ("Assuming a 7 day dispute window…"). OP's `notices` index lists Upgrade 20 (Super Root Dispute Games) and interop prep, with **no** notice changing the challenge period (`documented`, https://docs.optimism.io/notices/).
- **Arbitrum One: no shortening.** 6.4 days has been the value since Nitro; BoLD changed *who* can validate, not the period length. A Discourse search of forum.arbitrum.foundation for "challenge period reduce" returned **no topics proposing a reduction** — `observed` (https://forum.arbitrum.foundation/search.json?q=challenge%20period%20reduce), though Discourse search is weak and this is not proof of absence.
- **Announced plans**: Base/Azul above is the only concrete one I could verify. Broader OP Stack ZK-proof roadmaps (op-succinct etc.) — `unknown`, not verified today.

---

## (c) L3s: chained withdrawal delay and extra trust

### Orbit L3 — Degen Chain (settles to **Base**, not Ethereum directly)
`documented` from L2Beat's config source (https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/degen/degen.ts):
- Arbitrum Orbit L3, **host chain = Base**, chainId 666666666, DEGEN gas token, launched 2024-03-28.
- **DA: AnyTrust DAC** (`AnytrustDAC({ hostChain: 'base' })`) — i.e. **offchain DA behind a committee**, not onchain data.
- Explicit risks in config: **"upgradable with no delay"**, and "funds can be stolen if the security stack of the whitelisted LayerZero adapter changes or is compromised."
- Historical: chain halted **2 days** in May 2024 from misconfiguration.
- **Degen's own challenge period value: `unknown`** (not in the config file; Orbit default is 6.4 days). **Total L3→L2→L1 = (Degen period, likely ~6.4 d, unverified) + Base's 7 d ≈ 13–14 days** — `inferred`.

### Orbit L3 — Xai (settles to **Arbitrum One**)
`documented`, same source (…/projects/xai/xai.ts):
- L3 on Arbitrum, chainId 660279, mainnet 2024-01-09.
- **DA: AnyTrust DAC, 6 members** (Xai, Ex Populus, AltLayer, LayerZero, Team Secret, Offchain Labs) — flagged **"low DAC threshold"** and **"closed proofs."**
- **State validation: fraud proofs with a validator whitelist**, with the stated critical risk: "Funds can be stolen if none of the whitelisted verifiers checks the published state." **Not permissionless** — this is the key delta vs Arbitrum One post-BoLD.
- **Xai's own challenge period: `unknown`**. **Total ≈ (Xai period, likely 6.4 d) + Arbitrum One 6.4 d ≈ 12.8 days** — `inferred`.

### OP Stack L3 — Ham (settles to **Base**)
`documented`/`reported` from https://l2beat.com/scaling/projects/ham (this page did render):
- "Ham Chain is an OP stack **Optimium** L3 on Base."
- **Challenge period: 7 days** on the L3 itself → **total Ham→Base→Ethereum ≈ 14 days** (`inferred` sum of two documented 7-day periods).
- **Not even Stage 0**: non-functional proof system, no DA bridge.
- **DA: Celestia, but Blobstream is not used**, so "the Sequencer can single-handedly publish unavailable roots."
- **Proposer is whitelisted** — "withdrawals are frozen" if it fails. Sequencer failure: force-include via L1 with up to 1-day delay. State validation: **"the system permits invalid state roots; fraud proofs remain under development."**

**Net L3 picture**: the delay roughly doubles (≈13–14 days), but the delay is the *smaller* problem. The real deltas vs an L2 are (1) DA moves offchain to a small committee or an unbridged external DA layer, (2) proposers/validators are permissioned or the proof system doesn't work at all, (3) upgrades are instant with no exit window, and (4) the L3's security is capped by its L2 host, so you inherit Base's/Arbitrum's trust assumptions *on top of* the L3's.

## (d) Fast bridges
Noted only in passing, as asked. Base docs state plainly that third-party fast withdrawals "do not make the underlying standard withdrawal challenge period shorter" — they front liquidity and take on the delay themselves, substituting the bridge operator's counterparty risk for the canonical bridge's `documented` (docs.base.org bridging page).

---

## Could not verify
1. **Whether Base's Azul multi-proof (1-day TEE+ZK path) is live on mainnet today**, and its activation date — the spec page has no status. This is the single biggest gap.
2. **Arbitrum Security Council emergency / non-emergency thresholds** (9-of-12, 7-of-12) and the **L1 timelock delay** — the Foundation pages I reached don't state them.
3. **OP Mainnet ProxyAdmin owner / Security Council multisig threshold** and any upgrade delay.
4. **Exact `confirmPeriodBlocks` for Degen Chain and Xai** — assumed Orbit default 6.4 d, unconfirmed.
5. **L2Beat exact per-project "exit window" and "upgrade delay" figures** — project pages truncate under WebFetch; the API summary's Arbitrum exit-window text was self-contradictory.
6. **Any OP Labs / Optimism governance post proposing a shorter challenge period** — I had no working search tool to canvass gov.optimism.io.
7. **Whether L2Beat has changed any of the three stage ratings recently** (all read Stage 1 today via API; no history checked).

Sources: [l2beat.com API summary](https://l2beat.com/api/scaling/summary), [l2beat.com/scaling/projects/ham](https://l2beat.com/scaling/projects/ham), [l2beat config: xai.ts](https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/xai/xai.ts), [l2beat config: degen.ts](https://raw.githubusercontent.com/l2beat/l2beat/main/packages/config/src/projects/degen/degen.ts), [docs.optimism.io messaging](https://docs.optimism.io/app-developers/bridging/messaging), [docs.optimism.io fault proofs explainer](https://docs.optimism.io/stack/fault-proofs/explainer), [docs.optimism.io notices](https://docs.optimism.io/notices/), [specs.optimism.io configurability](https://specs.optimism.io/protocol/configurability.html), [docs.base.org bridging and withdrawals](https://docs.base.org/base-chain/network-information/bridging-and-withdrawals), [docs.base.org security council](https://docs.base.org/base-chain/security/security-council), [docs.base.org Azul proofs](https://docs.base.org/base-chain/specs/upgrades/azul/proofs), [docs.arbitrum.io rollup protocol](https://docs.arbitrum.io/how-arbitrum-works/validation-and-proving/rollup-protocol), [docs.arbitrum.io L2-to-L1 messaging](https://docs.arbitrum.io/how-arbitrum-works/l2-to-l1-messaging), [docs.arbitrum.io BoLD](https://docs.arbitrum.io/how-arbitrum-works/bold/gentle-introduction), [docs.arbitrum.foundation security council](https://docs.arbitrum.foundation/concepts/security-council)
