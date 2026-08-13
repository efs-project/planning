# Recovered Claude memo — Protocol and security research

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:33:43.137Z
**Claude task:** `a66c9083ed7d23197`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3500
**Original result length:** 21333 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Both parallel research streams have returned. Consolidated findings below.

---

# Durable-hosting evidence review: EVM venues, checked 2026‑08‑12/13

**Method.** Primary sources first: venue docs/specs, EIP texts, `ethereum/consensus-specs` and `go-ethereum` mainnet configs, `ethereum-optimism/superchain-registry`, `base/base` source, and L2BEAT's **machine-readable config + on-chain discovery** (`github.com/l2beat/l2beat/packages/config`, repo HEAD `2026‑08‑12T15:58:44Z`) rather than l2beat.com HTML, which truncates on fetch. L2BEAT discovery freshness: arbitrum `2026‑08‑07`, base `2026‑07‑31`, optimism `2026‑07‑17`.

Tags: `observed` (I read it in live source/tool output) · `documented` (venue's own docs/spec/source) · `reported` (third party incl. L2BEAT) · `inferred` · `unknown`.

⚠️ WebSearch budget was exhausted partway through; later gaps were closed with direct fetch/curl only.

---

## 1. Ethereum L1 — baseline

| Property | Value | Tag / source |
|---|---|---|
| Slot / epoch | `SLOT_DURATION_MS: 12000`; 32 slots/epoch = 384 s | `observed` [consensus-specs `configs/mainnet.yaml`](https://raw.githubusercontent.com/ethereum/consensus-specs/master/configs/mainnet.yaml) |
| Finality | Casper FFG, justified→finalized, **≈12.8 min** (2 epochs) | `documented` [ethereum.org PoS](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/) |
| Post‑2025 finality change | **None.** No 3SF, no slot-time change. `GLOAS_FORK_EPOCH` and `HEZE_FORK_EPOCH` = `18446744073709551615` (unscheduled); geth `AmsterdamTime`/`BogotaTime` = nil | `observed` consensus-specs + [geth `params/config.go`](https://raw.githubusercontent.com/ethereum/go-ethereum/master/params/config.go) |
| Fusaka live | `FULU_FORK_EPOCH: 411392` — 2025‑12‑03 21:49:11 UTC | `observed` |
| Blobs now | **Target 14 / Max 21** (`DefaultBPO2BlobConfig{Target:14, Max:21}`), BPO1 epoch 412672 (max 15, 2025‑12‑09), BPO2 epoch 419072 (2026‑01‑07) | `observed` geth params + [EF Fusaka announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement) |
| BPO3 | Config exists (`Target 21 / Max 32`) but **not scheduled on mainnet** | `observed` geth params |
| **Blob retention** | `MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS: 4096` and `MIN_EPOCHS_FOR_DATA_COLUMN_SIDECARS_REQUESTS: 4096` = **~18 days**. EIP‑4844: "the consensus layer is tasked with persisting the blobs… the execution layer is not" | `observed` consensus-specs; `documented` [EIP‑4844](https://eips.ethereum.org/EIPS/eip-4844) |
| Force inclusion | **None exists at L1.** No protocol-level escape hatch | `inferred` |
| FOCIL / EIP‑7805 | **Declined for Glamsterdam; moved to Hegotá.** Inclusion-list constants live in the unscheduled **Heze** CL fork (`MAX_REQUEST_INCLUSION_LIST: 16`, `MAX_TRANSACTIONS_BYTES_PER_INCLUSION_LIST: 8192`) | `observed` consensus-specs; `documented` [ethereum.org/roadmap/glamsterdam](https://ethereum.org/en/roadmap/glamsterdam/) |
| Glamsterdam | Q4 2026 planned; headliners EIP‑7732 (ePBS) + EIP‑7928 (BALs). EIP‑7782 (6 s slots) declined | `documented` ethereum.org (page updated 2026‑08‑06) |
| Who orders txs today | MEV‑Boost: **Titan 54.15%**, Quasar 19.52%, BuilderNet 12.08%, Eureka 10.53%. 6,399 MEV‑Boost blocks in 24 h ≈ **88.9% of 7,200 slots**; ~11% locally built | `observed` [relayscan.io](https://relayscan.io/overview?t=24h), 24 h to slot 14,980,932 = 2026‑08‑13T04:26Z; `inferred` (the 88.9%) |
| Censoring relay share | **41.0%** of MEV‑Boost blocks via OFAC-censoring relays (bloXroute Max Profit 21.3%, Regulated 17.8%, Flashbots 2.0%) | `reported` [mevwatch.info](https://www.mevwatch.info/), 24 h to 2026‑08‑12 |
| Other | `CONFIRMATION_BYZANTINE_THRESHOLD: 25` (Fast Confirmation Rule) — a confirmation heuristic, **not** a finality change | `observed` |

**The single most consequential L1 fact for a decades-durable filesystem:** every L2 below publishes its DA to blobs, and blobs are protocol-guaranteed for **~18 days only**. Multi-decade re-derivation of any L2 depends on third-party blob archives, not on Ethereum.

---

## 2. Master evidence table

Sequencing/force-inclusion delays; challenge windows; stage; exit window.

| Venue | Type | Sequencer | Force inclusion — constant & where it lands | Works if sequencer dead? | Challenge / finality window | Proofs permissionless? | DA | Rebuild from L1 alone? | L2BEAT stage | Exit window |
|---|---|---|---|---|---|---|---|---|---|---|
| **Ethereum L1** | L1 | Permissionless proposers; builders concentrated (Titan 54%) | n/a — no mechanism | n/a | ~12.8 min | n/a | n/a | n/a | n/a | n/a |
| **Arbitrum One** | Optimistic L2 | Single (Offchain Labs), **Timeboost** express-lane auction since 2025‑04‑29 | `maxTimeVariation.delaySeconds` = **86400 (24 h)**, `delayBlocks` 7200 → **Ethereum L1**. Delay-buffer/Censorship-Timeout: `isDelayBufferable: true`, threshold 150 blk (30 min), max 14400 blk (48 h), replenish 500 bp | **Yes** | `confirmPeriodBlocks` 45818 × 12 s = **6.36 d**; grace 14400 blk = **2 d** | **Yes** — `validatorWhitelistDisabled: true` (BoLD), stake 3600 ETH; `validatorAfkBlocks` 201600 = **28 d** then anyone proposes; `anyTrustFastConfirmer` = `0x0` | L1 calldata **or blobs**, full tx data | Yes (Nitro); pre‑Nitro needs Classic regenesis snapshot | **Stage 1** | **~10 d** regular (8 d L2TL + 3 d L1TL − 24 h); **0 emergency** |
| **Base** | Optimistic L2 (left Superchain) | Single (Coinbase); Flashblocks 200 ms, 2 s blocks | `seq_window_size` = **3600 L1 blk = 12 h** → OptimismPortal on **Ethereum L1** | **Yes** | `respectedGameType 621` AggregateVerifier: `FAST_FINALIZATION_DELAY` **86400 (1 d)**, `SLOW_FINALIZATION_DELAY` **432000 (5 d)**, `PROOF_THRESHOLD 1`; portal `proofMaturityDelaySeconds` 86400, `disputeGameFinalityDelaySeconds` **0** | **Split**: ZK/SP1 arm permissionless and overrides; **TEE arm permissioned** (`TEEProverRegistry` owner = Base Coordinator Multisig, separate manager EOA, `MAX_AGE 3600`) | Ethereum blobs | Yes (base/base Rust node; `isNodeAvailable: true`) | **Stage 1** | **None** — instantly upgradable |
| **OP Mainnet** | Optimistic L2 | Single (OP Labs) | `seq_window_size` = **3600 L1 blk = 12 h** → OptimismPortal on **Ethereum L1** | **Yes** | `maxClockDuration` **302400 (3.5 d)**; `proofMaturityDelaySeconds` **604800 (7 d)**; `disputeGameFinalityDelaySeconds` **302400 (3.5 d)**; depth 73/split 30 | **Yes** — `respectedGameType 8 = CANNON_KONA` (type 1 is the permissioned one); Guardian can blacklist games / fall back to permissioned | Ethereum blobs | Yes — op-node consensus-layer sync = "L1-only trust model". **Pre-Bedrock (OVM) history needs a snapshot** | **Stage 1** | **None** |
| **Degen Chain** | Orbit **L3 on Base**, AnyTrust | Single EOA, `batchPosterManager` = `0x0` | `maxTimeVariation.delaySeconds` = **345600 (4 d)** → **Base**, not L1. Stacked: **4 d 12 h** | Yes for L3; **needs Base's sequencer**, else +12 h L1 path | `confirmPeriodBlocks` 241920 → **5 d 14 h**; **bypassable** via `anyTrustFastConfirmer` (= one of the 2 validators, `DegenFastConfirmerMultisig`) | **No** — 2 whitelisted validators (`CLOSED_PROOFS`); self-propose after 6 d 15 h | **AnyTrust 2‑of‑3 DAC**; DACert only | **No** — Arbitrum docs: "a node cannot reconstruct chain state from parent-chain data alone in AnyTrust mode" | **"not even a Stage 0 project"**, type "Other" | **None** |
| **Xai** | Orbit **L3 on Arbitrum One**, AnyTrust | Single EOA + manager multisig | `delaySeconds` = **86400 (24 h)** → **Arbitrum One**. Stacked: **48 h** | Yes for L3; needs Arb One's sequencer else +24 h | `confirmPeriodBlocks` 45818 → **~6 d 9 h**; `anyTrustFastConfirmer` = `0x0` (no bypass) | **No** — 2 whitelisted validators; Sentry Nodes cannot challenge on-chain | **AnyTrust 3‑of‑5 DAC** | **No** | **no stage**, type "Other" | **None** |
| **B3** | OP Stack **L3 on Base**, Celestia DA | Single signer | `sequencer_window` assumed **12 h** (L2BEAT: "we have no reference to it") → Base. Stacked ≈ **1 d** | Yes for L3 | Legacy `L2OutputOracle`, `finalizationPeriodSeconds` **604800 (7 d)** | **No proofs at all** — "the system permits invalid state roots"; 1 proposer, 1 challenger | Celestia, **no DA bridge** (`NO_DA_ORACLE`) | **No** — `isNodeAvailable: false` | **"not even a Stage 0"** | **None** |
| **Syndicate Frame** | OP Stack L3 on Base | — | — | — | none | **None** | — | — | **ARCHIVED** — "no longer maintained"; TVS $7.77K | None |
| **Linea** | zk L2 | Single (Consensys) | **No live mechanism** (`FORCE_TRANSACTIONS.SEQUENCER_NO_MECHANISM`). Designed `ForcedTransactionGateway` is docs-flagged "not yet live" and **still requires the sequencer** | **No.** Only fallback: Operator role becomes public after **6 months** of no finalization | Hard finality median **~2 h**, ≤16 h normal | **No** — whitelisted proposers; SNARK w/ trusted setup | Onchain **full tx data**, blobs since 2024‑03‑26 | **Yes, with a supported tool** — Linea Besu State Recovery plugin + Shomei (needs a blob archive; mainnet start block "TBC") | **Stage 0** | **None** (0 s upgrade delay) |
| **Scroll** | zk L2 | Single (2 addrs) | **`EnforcedTxGateway.sendTransaction` from L1** + permissionless batch submission. Constants `maxDelayEnterEnforcedMode`, `maxDelayMessageQueue` (`uint24` s, `onlyOwner`-settable, no bounds); values `reported` 7 d, **unverified** | **Yes** — designed for exactly this | executionDelay **0**; every batch finalized with a proof | **No** in normal mode (coordinator-assigned provers); **yes in enforced mode**; prover source published | Onchain **tx data in blobs** | Plausible; **no documented supported tool found** | **Stage 0 — regressed from Stage 1 on 2026‑06‑01** | **None** (0 s via ScrollAdminMultisig) |
| **zkSync Era** | zk L2 | Single | L1 **priority queue**. L2BEAT category `SEQUENCER_ENQUEUE_VIA('L1')`: "users… can't force them… sequencers cannot selectively skip but can stop processing the queue entirely"; `TransactionFilterer` filters **without delay** | **Partial / no deadline** | Proof gen ~1 h + **3 h execution delay** (was 21 h) | **No** — team Validator role behind ValidatorTimelock | Onchain **state diffs only** ("SD"), blobs | **State** yes ([eqlabs/zksync-state-reconstruct](https://github.com/eqlabs/zksync-state-reconstruct)); **tx/event history no** | **Stage 0** | Regular **4 d 3 h**; **Emergency: None** |
| **Polygon zkEVM** | zk L2 | — | — | — | — | — | — | — | **DEAD — shut down 2026‑07‑01** | — |
| **Berachain** (sovereign contrast) | Sovereign EVM L1 | 69-validator capped set (CometBFT/BeaconKit); entry 250,000 BERA | **None — no parent chain, no escape hatch of any kind** | n/a | Single-slot finality, no challenge window, no external verifier | n/a | Validator set only | **No parent exists** | not tracked | n/a |

---

## 3. Per-venue notes worth reading

**Arbitrum One.** The only venue in the set with *both* permissionless proofs (`validatorWhitelistDisabled: true`, verified on-chain) and a real L1 escape hatch. But its Security Council emergency path is instant (exit window 0) and **has been used repeatedly**: ArbOS 32 (2024‑09‑25), Stylus stack-depth (2025‑10‑13), **KelpDAO exploiter fund recovery ~30,766 ETH (2026‑04‑21)**, Bridge `PROPOSER_ROLE` renounce (2026‑05‑24). The KelpDAO action is the notable one for a "user-owned" premise: emergency powers were used to move user-controlled assets. `reported` L2BEAT milestones with forum links.

**Base.** Two structural changes since May 2025: it **left the Superchain** — I independently confirmed `superchain/configs/mainnet/base.toml` returns **404** and Base is absent from the registry's mainnet config listing (`observed`) — and it shipped **Azul multi-proof** (game type 621, TEE + ZK). Its exit window is **None**: L2BEAT's own words, "contracts are instantly upgradable," behind a 2/2 of Base Coordinator Multisig (CB Signers 3/6) + Base Security Council (8/11) = 9 of 12 signers. A 3-day `TimelockController` does exist at `0x0b144E07…` but it owns only the `RiscZeroVerifierRouter`, not the core proxies — so it does not create an exit window.

**OP Mainnet.** Fault proofs are genuinely permissionless (`respectedGameType 8` = `CANNON_KONA`, confirmed against [`GameTypes` in Types.sol](https://raw.githubusercontent.com/ethereum-optimism/optimism/develop/packages/contracts-bedrock/src/dispute/lib/Types.sol); `PERMISSIONED_CANNON` is type 1). Exit window **None** — "upgrades take effect as soon as they are co-signed by the SuperchainProxyAdminOwner, with no onchain delay or prior notice." Precedent: fraud proofs were **disabled for 26 days** in Aug 2024. Also: L2BEAT explicitly places `sequencerPolicy` **out of scope** for both OP and Arbitrum assessments.

**The L3 tier.** Degen is the case study. 54-hour halt in May 2024 (RaaS provider config change), ~$160k lost, corrupted state and tx ordering, recovery required resyncing from genesis with ~5 addresses filtered — and then a key-custody standoff where the RaaS provider held the rollup keys and reportedly **deleted the block explorer data with no backups**. Migration to a new RaaS eventually completed. `reported`.

**The zk tier.** Polygon zkEVM's full trajectory is the reference failure mode: validity proofs → bridge-accounting-only "pessimistic proofs" (2025‑12‑03, `stateValidation: STATE_NONE`) → DA off-chain → sequencer off (2026‑07‑01) → **entire zkEVM doc set removed from `docs.polygon.technology` (sitemap contains zero zkevm URLs, `observed`)**. EOA balances were snapshotted and made claimable on L1; **contract-resident state had no migration path**, and unclaimed assets are declared abandoned after 2027‑12‑31. Scroll moved the other direction too: Stage 1 → **Stage 0 on 2026‑06‑01** when its independent 9-of-12 Security Council was replaced by a **3-of-4 multisig of Scroll team members**, on cost grounds.

---

## 4. Documentation vs. observed/reported disagreements — explicitly flagged

1. **Base — withdrawal timing.** Docs describe a "**7-day** window: common path, still overridable by ZK." On-chain: `SLOW_FINALIZATION_DELAY = 432000` = **5 days**, `FAST_FINALIZATION_DELAY = 86400` = 1 day, portal `proofMaturityDelaySeconds = 86400`. I found **no 7-day constant** anywhere in Base's L1 discovery.
2. **zkSync Era — "escape hatch".** Docs: the priority queue "will always be available as an escape-hatch mechanism… to protect users against censorship by a malicious sequencer." L2BEAT's assigned category says users "**can't force them**" and the sequencer "can stop processing the queue entirely," plus a `TransactionFilterer` that excludes addresses with no delay.
3. **Scroll — Security Council.** Docs still describe "an independent body of 12 reputable members, forming a 9/12 multisig" and say enforced mode is disabled by "the owner (Scroll Security Council)." On-chain since 2026‑06‑01 that owner is a **3-of-4 Scroll team multisig** with a 0-second upgrade path.
4. **Linea — forced transactions.** A complete forced-transaction spec is published and could easily be mistaken for a live feature; it carries a "🚧 not yet live" banner, and by design it "does not bypass the sequencer" — it fails in the exact scenario it appears to address.
5. **Xai — DAC size.** Docs + L2BEAT `knownMembers` list **6** entities; on-chain `dacKeyset.membersCount` = **5**.
6. **Xai — Sentry Nodes.** Marketed as securing the chain; L2BEAT: "there is no integrated way to flag an invalid state root… making them just observation nodes."
7. **L3 self-description.** Degen, Xai and B3 all self-describe as L3 rollups. L2BEAT classifies **none** as a rollup — type "Other," and Degen and B3 are "not even a Stage 0 project."
8. **Arbitrum's "24-hour" force-inclusion figure does not transfer to Orbit chains.** `delaySeconds` is owner-settable; **Degen's is 4 days** (345,600 s), not 24 h. Third-party guides quoting "24 hours" as *the* Arbitrum constant are wrong for L3s.
9. **OP "permissionless fault proofs" carries a caveat.** True at the game-type level, but OP's own docs state the Guardian "can override the system by pausing withdrawals, blacklisting games, or reverting to a permissioned system."
10. **Base's stack label.** L2BEAT's config still declares `stacks: ['OP Stack']` while simultaneously recording the 2026‑03‑04 Superchain departure. Press dates the announcement 2026‑02‑18. Meanwhile `base-org/node` now redirects to `base/node`, and the actual node is the Rust `base/base` repo.
11. **Linea upgrade delay.** L2BEAT's config models Linea with `UPGRADE_WITH_DELAY_RISK(timelockDelay)`, implying a timelock; the rendered page reports **0 s** and exit window None. Reconciliation: the timelock exists but `getMinDelay()` is currently 0.

---

## 5. Cross-cutting facts

- **No venue in this study is L2BEAT Stage 2.** Arbitrum One, Base and OP Mainnet are Stage 1 and are blocked from Stage 2 by exactly the same two items, verbatim from L2BEAT's checklist: `proofSystemOverriddenOnlyInCaseOfABug: false` ("The Security Council's actions are not confined to onchain provable bugs") and `delayWith30DExitWindow: false` ("Upgrades unrelated to onchain provable bugs provide less than 30d to exit").
- **Instant upgradeability is the norm, not the exception.** Exit window is **None** for Base, OP Mainnet, Linea, Scroll, and every L3 examined. Arbitrum One (~10 d regular) and zkSync Era (4 d 3 h regular) are the only venues with any non-zero window, and both retain a zero-delay emergency path.
- **Blobs expire in ~18 days.** Independent re-derivation of any of these L2s decades out depends on archival services, not on Ethereum. Linea's own documented recovery path explicitly requires a Blobscan endpoint.
- **AnyTrust DACerts are time-bounded and honesty-bounded.** They promise data "will be available from at least one honest DAC member, at least until the expiration time" (~3 weeks typical). Nothing obliges retention past expiry. The rollup-mode fallback protects *future* writes if the DAC quits; it does nothing for data already committed under a DACert.
- **State-diff DA ≠ history.** zkSync Era publishes state diffs, so the *current storage image* is reconstructable but the *write log* (events, per-write provenance, calldata) is not. For an attestation/registry filesystem whose semantics are event-based, that is a materially weaker guarantee than Linea's or Scroll's full-transaction DA.
- **Escape-hatch parameters are themselves upgradeable** by the same keys that upgrade the contracts (Scroll's `updateEnforcedBatchParameters` is `onlyOwner`, and the owner can disable enforced mode after it triggers; Orbit `maxTimeVariation` is set by the chain owner).
- **Operator-disappearance precedents on record:** Polygon zkEVM (shut down, docs deleted, contract state stranded), Syndicate Frame Chain (archived, still holding $7.77K), Evmos (governance-voted shutdown, all infrastructure offline), Degen (54 h halt + RaaS key custody standoff + explorer data deletion).

---

## 6. What I could not verify

- **Whether anyone has demonstrably executed a force inclusion on mainnet** — on Arbitrum One, OP Mainnet, Base, Degen, Xai, Scroll, or zkSync Era. No transaction hash found for any of them. One third-party account describes a real Orbit force-inclusion after a ~2-day outage, but names no chain and cites a 24 h delay (Degen's is 4 days), so it is probably not Degen.
- **Whether the DAO-funded Tally force-inclusion UI for Arbitrum is currently live and maintained** (AIP passed Feb 2024, $42,500 ARB; the AIP itself concedes force inclusion is "intended for technical users").
- **Scroll's actual `maxDelayEnterEnforcedMode` / `maxDelayMessageQueue` values** — reported as 7 days each, not re-verifiable (page truncates; values are on-chain discovery outputs absent from readable source).
- **Base's 7-day proof path** — described in docs, no matching on-chain constant found (chain says 5 d slow / 1 d fast).
- **Whether any non-operator party has ever actually proposed an output root** on OP Mainnet or Base, or run a BOLD challenge on Arbitrum One.
- **B3's real `sequencerWindowSize`** — L2BEAT states it "has no reference to it" and assumes the OP Stack default.
- **Xai:** outage history; which of the 6 named DAC entities is absent from the 5-member on-chain keyset; whether its SequencerInbox has the delay-buffer/Censorship Timeout enabled (no `bufferConfig` key present).
- **Whether any AnyTrust DAC member retains data past DACert expiry**, or whether any independent party mirrors Degen/Xai batch data. For a decades-durability question this is the most consequential unverified item in the whole study.
- **Linea's mainnet state-recovery start block** ("TBC" in docs) and its named force-inclusion deadline constant.
- **Whether an officially maintained Matter Labs state-reconstruction tool exists** (`matter-labs/state-reconstruct` → 404; only the third-party `eqlabs` implementation confirmed).
- **Scroll and zkSync preconfirmation reorg semantics** — neither venue's docs state whether a soft-confirmed tx can be reorged before L1 commit.
- **Berachain:** block time, the explicit <1/3 Byzantine safety condition from its own docs, and any archive/history-retention policy.
- **Evmos shutdown year** (May 15 pass / block 37,318,000; year unconfirmed against a primary governance record).

No recommendation is offered and no venue is selected — this is evidence only.
