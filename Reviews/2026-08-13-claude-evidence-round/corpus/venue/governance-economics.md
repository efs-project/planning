# Recovered Claude memo — Governance economics

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:57:09.011Z
**Claude task:** `acd4994444261e343`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3585
**Original result length:** 45054 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
All three research threads are complete. Here are the findings.

---

# Governance, Upgrade Power, Economics, Bridge Dependency: EVM Venue Evidence
**Check window: 2026‑08‑12 → 2026‑08‑13 UTC.** Evidence tags: `observed` (I directly measured/read it), `documented` (primary source), `reported` (secondary press), `inferred` (computed/deduced), `unknown`.

**Method note:** L2BEAT project pages truncate under normal fetching; all L2BEAT data below was extracted from the embedded JSON payload via `curl` + parsing. Multisig thresholds were then **independently re-verified by direct `eth_call`** (`getThreshold()` 0xe75235b8, `getOwners()` 0xa0e67e2b) against Ethereum mainnet. Where L2BEAT and the chain's own docs and the on-chain reading agree, I say so; where they disagree, I flag it.

---

## Q1 — UPGRADE POWERS

### Master table (all `observed` on-chain 2026‑08‑13 unless noted)

| Venue | Upgrade authority | Threshold | Verified on-chain | Delay | Instant bridge/state-root upgrade? | L2BEAT stage |
|---|---|---|---|---|---|---|
| **Ethereum L1** | None — no admin key exists | — | n/a | n/a | **No such power exists** | n/a |
| **Base** | `ProxyAdmin` ← **Base Governance Multisig** `0x7bB41C3008B3f03FE483B28b8DB90e19Cf07595c` (nested 2/2) | **2/2** | ✅ threshold=2, owners=2 | **None** | **YES, instant** | Stage 1 |
| ├ CB Signers (Coinbase) | `0x9855054731540A48b28990B63DcF4f33d8AE46A1` | **3/6** | ✅ threshold=3, owners=6 | — | — | — |
| └ Base Security Council | `0x20AcF55A3DCfe07fC4cecaCFa1628F788EC8A4Dd` | **8/11** | ✅ threshold=8, owners=11 | — | — | — |
| **OP Mainnet** | `SuperchainProxyAdminOwner` `0x5a0Aae59D09fccBdDb6C6CcEB07B7279367C3d2A` (nested 2/2) | **2/2** | ✅ threshold=2, owners=2 | **None** | **YES, instant** | Stage 1 |
| ├ OP Foundation Upgrade Safe | `0x847B5c174615B1B7fDF770882256e2D3E95b9D92` | **5/7** | ✅ threshold=5, owners=7 | — | — | — |
| └ Optimism Security Council | `0xc2819DC788505Aac350142A7A707BF9D03E3Bd03` | **10/13** | ✅ threshold=10, owners=13 | — | — | — |
| **Arbitrum One** | Security Council (L1) `0xF06E95eF589D9c38af242a8AAee8375f14023F85` | **9/12** | ✅ threshold=9, owners=12 | **None (emergency)** | **YES, instant** | Stage 1 |
| ” | DAO / non-emergency path | 9/12 or CoreGovernor | — | **17d 8h** | No | — |
| **Linea** | Linea Security Council `0x892bb7EeD71efB060ab90140e7825d8127991DD3` | **5/9** | ✅ threshold=5, owners=9 | **None** | **YES, instant** | **Stage 0** |
| **Scroll** | `ScrollAdminMultisig` `0xcca54B0916Cee2186b47E9709BEdcb7041A8F761` | **3/4** | ✅ threshold=3, owners=4 | **None** (TimelockSCEmergency = 0 delay, can act directly) | **YES, instant** | **Stage 0** (was Stage 1) |
| **zkSync Era** | `EmergencyUpgradeBoard` = 3/3 of {SecurityCouncil 6/8, Guardians 5/8, ZK Foundation 3/6} | **3/3 nested** | not re-verified (custom impl) | **None (emergency)** | **YES, instant** | **Stage 0** |
| **Degen Chain** (Orbit L3→Base) | `AlchemyMultisig2` | **5/8** | not re-verified (Base chain) | **None** | **YES, instant** | Stage 0 |
| **Xai** (Orbit L3→Arbitrum) | `XaiMultisig` | **3/5** | not re-verified | **None** | **YES, instant** | Stage 0 |
| **B3** (OP Stack L3→Base) | multisig | **2/5** | not re-verified | **None** | **YES, instant** | Stage 0 |

**The single most important observation: every venue except Ethereum L1 has "Exit window: None."** `observed` — L2BEAT risk data for base, arbitrum, op-mainnet, linea, scroll, zksync-era, degen, xai, b3, all fetched 2026‑08‑13. On every L2 and L3 in this study, whoever holds the keys can change the bridge and state-root logic with **zero notice and zero delay**. There is no venue where you get a warning window to exit before an unwanted upgrade.

### Ethereum L1
`documented` https://ethereum.org/en/governance/ (checked 2026‑08‑13): "No one person owns or controls the Ethereum protocol." No admin keys, no multisig, no upgrade authority over deployed contracts. Changes require a Core EIP → AllCoreDevs → multi-client implementation → hard fork, and "Protocol Developers have no way to force people to adopt network upgrades." Chain splits are the escape valve (ETC precedent, 2016). **This is the only venue in the study where no party can alter your deployed contract.**

### Optimism
- `documented` Security Council Charter v0.1 (https://github.com/ethereum-optimism/OPerating-manual/blob/main/Security%20Council%20Charter%20v0.1.md): 75% threshold, staggered cohorts, and emergency powers exercisable **"without specific Governance approval."**
- ⚠️ **Foundation fallback, `documented`:** "If the number of signers is reduced below 8, then a safety mechanism is activated which hands control of the Security Council to the Foundation." A LivenessModule auto-removes signers inactive ≥3 months 8 days. **Council degradation returns unilateral control to the Optimism Foundation.**
- `documented` Normal path (live since Aug 1, 2025): 7‑member Developer Advisory Board (5/7) reviews → Sepolia release → **7‑day veto window** for Token House / Citizens' House → SC + Foundation Upgrade Safe co-sign. Emergency path: 2/2, instant, no DAB review, no veto window; retrospective required after the fact.
- `documented` **The DAO does not hold the keys.** L2BEAT: "At the moment, for regular upgrades, the DAO signals its intent by voting on upgrade proposals, but **has no direct control over the upgrade process**." Execution model: "No permissionless `execute()`."
- **Guardian/pause:** Guardian Safe `0x09f7150D8c019BeF34450d6920f6B3608ceFdAf2` is **1/1** (`observed`, threshold=1, owners=1), owned by the Security Council; Foundation acts through it as DeputyGuardian. Pauses auto-expire after 3 months. `OpFoundationOperationsSafe` **5/7** (`observed`) controls the sequencer via SystemConfig.
- **Optimism Law Foundation / legal separation: `unknown`.** I could not verify this. The session-wide WebSearch budget was exhausted before I could search it, and the OPerating-manual README, the Optimism decentralization blog post (June 2024), and docs.optimism.io/stack/smart-contracts contain no mention of a law foundation or legal-entity separation. Not researched to conclusion.

### Arbitrum
- `documented` DAO Constitution §3 (https://docs.arbitrum.foundation/dao-constitution): Emergency actions **9/12, "with no delay"**; non-emergency actions **9/12** bypass AIP Phases 1–3 but still take the timelocks. Constitutional AIP ≈ 37–41 days total (14d vote → 8d L2 Timelock → ~6.4d outbox → 3d L1 Timelock).
- `documented` **The DAO can modify or eliminate the Security Council** via Constitutional AIP — but L2BEAT's assessment is that in practice it cannot: "**No** — an active 9/12 SC holds Canceller on both L1 and L2 Timelocks and can execute emergency upgrades during the ~17.4d execution window."
- `observed` The SC can also **upgrade the L1Timelock itself** and "cancel queued transactions" — i.e. it can cancel the DAO's own governance actions.
- ⚠️ **Documented‑vs‑observed discrepancy, `observed`:** The Arbitrum Foundation's official member roster (https://docs.arbitrum.foundation/security-council-members, checked 2026‑08‑13) still lists **Gauntlet/John Morrow `0x78bB97…`** and **Certora/Elad `0xeEE3Fb…`**. Neither address is an owner of the live Security Council Safe. Both were replaced in July 2026 (`documented`, https://forum.arbitrum.foundation/t/.../31081 — Gauntlet resigned; Patrick Collins/Cyfrin and Tigran/Certora installed). **The Foundation's published roster is stale; two of the twelve on‑chain signers are unnamed anywhere in official docs.**

### Base — who actually controls it
`documented` https://docs.base.org/base-chain/security/security-council (checked 2026‑08‑13), which **exactly matches my on-chain reading**: "**CB Signers—a 3-of-6 multisig operated by Coinbase**" plus a Security Council of 11 named independent entities at 8-of-11, combined as a 2/2. Upgrades need "approval of 9 of them (the CB Signers plus at least 8 Security Council members)."

**Answer to "Optimism Security Council or Coinbase control?": neither, as of 2026 — it is now Coinbase plus a Base-specific council, and Optimism has been removed from the loop.**
- `documented` L2BEAT milestone: **"Base leaves the Superchain," dated 2026‑03‑04** — "Base decouples from Optimism Superchain governance with its own upgrade path" (https://blog.base.dev/next-chapter-for-base-chain-1).
- `observed` On-chain confirmation, 2026‑03‑04: Base deployed its own `SuperchainConfig` v2.5.0 at `0xb535ff7F118260a952CE65e7fF41B1743De8EE6c`, decoupling from the shared Optimism config.
- `documented` The Base blog states the Security Council will replace Optimism with "an additional independent signer."
- ⚠️ **Coinbase holds a unilateral power the Council cannot check, `documented`** (L2BEAT): "The TEE prover allowlist in the `TEEProverRegistry` is managed **solely by the Base Coordinator Multisig (without Base Security Council approval)**, and a separate Manager EOA can register or deregister enclave signers." Coinbase also holds a hard veto on all upgrades (3/6 of a 2/2).
- `observed` `Base Multisig 1` `0x14536667…` is **3/12** (verified: threshold=3, owners=12); it sets the sequencer address and can pause withdrawals for up to 3mo but cannot unpause.

**Published decentralization roadmap and whether dates were met:** `documented` Base's own milestones are Oct 2024 (permissionless fault proofs) and April 2025 (Security Council) — both met. Beyond that, **Base publishes no dated commitments.** The Feb/Mar 2026 blog says "We will communicate more as this date approaches" and promises "faster withdrawals… Base-specific governance, and enhanced neutrality standards" **without timelines**. Stage 2 is named as a goal with no date. `observed` L2BEAT lists Base as still missing both Stage 2 requirements.

### Scroll — a documented decentralization *regression*
`observed` L2BEAT changelog + `documented` Scroll's own forum post (https://forum.scroll.io/t/governance-update-security-council-transition-contributor-roles-operational-adjustments/1470, posted 2026‑04‑13):

On **2026‑06‑01**, Scroll **removed its independent 9-of-12 Security Council** and transferred its roles on `TimelockSCSlow` (3d) and `TimelockSCEmergency` (**no delay**) to the **3-of-4 `ScrollAdminMultisig` of Scroll team members**. L2BEAT: "The new entity does not meet the size or organisational-diversity requirements of a Security Council." **This moved Scroll from Stage 1 to Stage 0.** Scroll's stated reason: continuation "is no longer justified" after evaluating "its cost relative to its actual usage." The same post ended four contributor roles on 2026‑04‑30. `observed` Scroll's on-chain governance (`AgoraGovernor`) carries **no transaction payloads** — SCR token voting "only acts as an onchain temperature check."

---

## Q2 — FEES (point-in-time snapshot, 2026‑08‑13 ~04:20–04:38 UTC)

⚠️ **Sourcing warning first.** `observed` — **l2fees.info is dead data.** `curl -sI https://l2fees.info/` returns `age: 16445266` (**190 days stale**) with `x-vercel-cache: STALE`; its embedded dataset contains no Base, Linea, or Scroll at all, and quotes an Ethereum ETH transfer at **$1.096** against an actual observed cost ~400× lower. It renders as though live. **Do not use it.**

**ETH = $1,883.80–$1,884.86** `observed` (Coinbase spot + CoinGecko + Etherscan header, three sources within 0.04%).

### Observed gas prices, 2026‑08‑13 04:27 UTC (`observed`, direct RPC `eth_gasPrice`)

| Venue | gas price (gwei) | blob base fee (gwei) |
|---|---|---|
| Ethereum L1 | **0.0683** (baseFee 0.0548) | **0.00387** |
| Base | 0.0060 | — |
| Arbitrum One | 0.0201 | — |
| OP Mainnet | 0.0010 | — |
| Linea | **0.9313** | — |
| Scroll | 0.000120 | — |
| zkSync Era | 0.0453 | — |

`observed` L1 block 25743708: **gasLimit 60,000,000, 32.5% utilization**. L1 is extraordinarily cheap in this window because of a 60M gas limit against low demand.

### Fee table

| Venue | (a) ERC‑20 transfer | (b) ~200B write (attestation-sized) | (c) ~10KB deploy |
|---|---|---|---|
| **Ethereum L1** | **$0.0059** at base fee; **$0.126 actually paid** ⚠️ | $0.014–$0.022 `inferred` | **$0.23–$0.29**; a real 11,981‑byte deploy paid **$0.41** `observed` |
| **Base** | **$0.00052–$0.00074** | $0.0017–$0.0023 `inferred` | **$0.026–$0.033**; real 5,594B deploy paid **$0.030** `observed` |
| **Arbitrum One** | **$0.0015–$0.0025** | $0.0057–$0.0075 `inferred` | $0.086–$0.109 `inferred` |
| **OP Mainnet** | **$0.000099–$0.00012** | $0.00029–$0.00038 `inferred` | $0.0043–$0.0056 `inferred` |
| **Linea** | **$0.023–$0.115** ⚠️ 5× swing in 20 min | $0.28–$0.38 `inferred` | **$3.97–$5.47** `inferred` |
| **Scroll** | **$0.00048** (98% of it is L1 data fee) | $0.0013 `inferred` | **$0.084**, of which $0.083 is L1 data `inferred` |
| **zkSync Era** | **$0.0055–$0.0081** (85k–104k gas — 2–3× EVM-native) | $0.013–$0.017 `inferred` | ~$0.19–$0.25 `inferred, low confidence` — zkSync prices deploys by pubdata, not 200 gas/byte |
| **Degen** (L3→Base) | **$0.0000041–$0.0000065** `observed` | ~$0.00002 `inferred` | ~$0.0004 `inferred` |
| **Xai** (L3→Arbitrum) | **~$0.00000003** `observed` | ~$0.0000001 `inferred` | ~$0.0000018 `inferred` |

Gas-model basis for (b) `inferred`: 21,000 intrinsic + ~2,360 calldata + 7 × 22,100 `SSTORE_SET` + LOG ≈ 150k–200k. **Empirical upper anchor, `observed`:** real EAS `Attested` transactions burned **282,312 gas on Base** and **253,176 gas on OP Mainnet** (both batched `multiAttest`). Basis for (c) `inferred`: anchored on real deploys measured at **230–278 gas per deployed byte**.

### L1 data component
`observed` (on-chain oracle reads + a live receipt): **the blob component is currently negligible on OP Stack chains.** A real Base transaction (246,864 gas) paid **$0.0237 L2 execution and $0.0000015 L1 data — an L1 share of 0.006%**. `getL1Fee` for a 10.5KB payload: Base **$0.000085**, OP Mainnet **$0.000138**, **Scroll $0.0834** — Scroll's L1 data fee is **~500× Base's** for identical payloads. One blob = $0.00069–$0.00085.

### Volatility (mandatory caveat)
Within the ~20-minute measurement window: L1 base fee moved 0.0495→0.067 gwei (35%), **Linea's gas price moved 0.2→1.0 gwei (5×)**, blob base fee moved 22%, and Scroll's L2 gas price had been **100× higher** ~226 blocks earlier. growthepie's own 24h ranges show Ethereum median $0.0036–$0.0572 (16×) and Linea $0.0130–$0.1301 (10×) in a single day. **Every number above is good to roughly one significant figure, for today only.**

### Where trackers disagree (`observed`)
1. **Ethereum L1: 21× gap.** Etherscan quotes $0.003 standard; every real ERC‑20 transfer sampled paid **~1.059 gwei against a 0.05 gwei base fee** = $0.126. Wallets are running stale gas heuristics. Both numbers are true; they answer different questions.
2. **Linea:** growthepie $0.130 vs Lineascan $0.113 vs observed receipts $0.023–$0.046.
3. **Arbitrum:** Arbiscan $0.003 vs receipts $0.0015 vs growthepie $0.0029 (gas-units assumption, not price).
4. **OP Mainnet:** Optimistic Etherscan reports "0.000002 Gwei" Rapid, contradicting the 0.001 gwei floor visible in every receipt; its Featured Actions table renders blank. **Treat that tracker as partly broken.**
5. **Scrollscan's gas tracker returns 404** (migrated to Blockscout) — no Etherscan-style tracker exists for Scroll.

---

## Q3 — LONG-TERM STATE COST

**Bottom line, `documented`: no EVM chain — L1 or any L2 in this study — charges a recurring fee to keep contract state alive, and none has one scheduled.**

### Ethereum L1
- `observed` **Every state-rent proposal ever written is dead.** From the complete EIP index (https://eips.ethereum.org/all, 1,201 rows): EIP‑1682 Storage Rent **Withdrawn**; EIP‑1418 Blockchain Storage Rent Payment **Stagnant** (2018, the only true recurring-rent design); EIP‑2026/2027/2029/2031 State Rent A–H all **Stagnant**; EIP‑2035 **Stagnant**.
- `observed` **EIP‑7736 (leaf-level state expiry) is Stagnant.** `FORK_TIME` is literally "TBD"; its magicians thread's last post was 2024‑07‑13 — dead ~2 years. It depended on Verkle (EIP‑6800), which is **also Stagnant**, along with the entire Verkle cluster (7612, 7545, 6190). Replaced by hash-based binary trees: **EIP‑8297 "Partitioned Binary Tree," Draft, created 2026‑06‑11**, co-authored by Vitalik Buterin. It explicitly *defers* expiry: "The mechanism itself is left to a separate EIP" — **and that EIP does not exist.**
- `documented` https://ethereum.org/roadmap/statelessness/ (page updated 2026‑06‑30), the load-bearing quote: **"State expiry is still in the research phase and not yet ready to ship,"** and **"inactive state is not deleted, it is just stored separately from the active state. The inactive state can be resurrected."** Even the hypothetical future design is archival + resurrection, never destruction.
- `observed` Fork status: **Fusaka shipped 2025‑12‑03** (EIP‑7607 Final). **Glamsterdam is Draft with an empty activation table — no mainnet date set.** Hegotá is proposal-stage. **Neither contains any state-expiry, state-rent, or state-deletion EIP** (checked both meta EIPs explicitly).

### ⚠️ The one scheduled change that does matter: EIP‑8037
`observed` https://eips.ethereum.org/EIPS/eip-8037 — **"State Creation Gas Cost Increase," Review, Scheduled for Inclusion in Glamsterdam.** Verified parameters `CPSB=1530`, `STATE_BYTES_PER_STORAGE_SET=64`, `STATE_BYTES_PER_NEW_ACCOUNT=120`:

| Operation | Today | Under EIP‑8037 | Multiple |
|---|---|---|---|
| New storage slot | 20,000 | **97,920** | 4.9× |
| New account | 25,000 | **183,600** | 7.3× |
| **Code deposit** | **200/byte** | **1,530/byte** | **7.65×** |
| `GAS_CREATE` | 32,000 | 183,600 | 5.7× |

Properties: **one-time at write, not recurring; existing contracts are charged nothing; freeing state refills the charge**; billed to a separate "state gas" dimension. Motivation `observed`: Geth state DB ~390 GiB as of January 2026, growing ~116 GiB/yr.

`inferred` **Modelled impact on a 10KB deploy: ~7.1× across every venue.** L1 $0.29→$2.06; Base $0.026→$0.18; Arbitrum $0.086→$0.61; Linea $3.97→$28.13. ⚠️ Whether L2s adopt this is `inferred` — OP Stack and Arbitrum generally track L1 EVM changes, but I did not verify any L2 commitment to EIP‑8037.

**Read this as the answer to "will they ever charge rent?"** — core devs' chosen lever for state growth is **raising the up-front price of creating state, explicitly instead of charging for holding it.**

### L2s
`observed`, from each chain's own differences/fee docs (all checked 2026‑08‑12): **Base, OP Mainnet, Arbitrum One, Linea, Scroll, zkSync Era — none charges recurring storage rent; none has a published plan to.** zkSync's fee docs are the most explicit: pubdata is charged only at write time. One watch item: `observed` **Arbitrum ArbOS 51 "Dia"** (2026‑01‑08) instruments the STF to track "storage growth" as a resource dimension — but "none of the constraints are enabled." Measurement only, and structurally a write-time metric like EIP‑8037. `unknown` whether eventual dynamic pricing bills it once or ongoing.

⚠️ **Naming trap:** growthepie's per-chain metric `rent_paid_usd` is **L1 data-posting cost**, not user-facing state rent. Do not confuse them.

### Has any chain ever deleted state?
`documented` **No EVM chain has ever expired or deleted live contract state as a protocol rule.** OP Mainnet's two regenesis events both **preserved state**: the 2021‑04‑09 alpha regenesis wiped transaction history but "balances, contracts and storage will not be impacted"; the 2023‑06‑06 Bedrock migration converted the DB and emitted a verifiable state root, with historic chain data remaining accessible. **Pattern: history gets dropped, state gets carried forward.**

### EIP‑4444 and the L2 reconstruction caveat
- `observed` EIP‑4444 is **Stagnant**, but **partial history expiry shipped 2025‑07‑08** across all execution clients (pre-Merge block bodies and receipts only). `documented`, verbatim from the EF announcement: **"the state for every account continues to be maintained"** and "Accessing a current balance, executing a trade… will not be interrupted." **It deletes history, not state.** Rolling/full history expiry is **not scheduled for any fork**.
- ⚠️ **The real risk is already live and is not EIP‑4444.** `documented` EIP‑4844: blob sidecars are retained for `MIN_EPOCHS_FOR_BLOB_SIDECARS_REQUESTS = 4096` epochs — **"around 18 days."** Every rollup posting to blobs already relies on out-of-protocol 1-of-N archives for reconstruction beyond ~18 days. **This is the current, shipped, deliberate design, not a future threat.**
- `inferred` **Durability implication: for a filesystem in contract storage, L1 state is strictly stronger than any L2's.** L1 state is maintained by every full node with no expiry mechanism scheduled; an L2's reconstructability from first principles already depends on out-of-protocol archival.

---

## Q4 — BRIDGE DEPENDENCIES

| Venue | Canonical bridge trust model | Withdrawal delay `observed` | Sequencer censorship escape | Proposer failure |
|---|---|---|---|---|
| **Base** | Trust-minimized-ish: fraud proofs (1R, ZK) + TEE | **5d challenge period** (432,000s) | Self-sequence, ≤**12h** | **Self propose — anyone** |
| **Arbitrum One** | Fraud proofs (INT), permissionless | **6d 8h + 2d execution delay**; docs say "~6.4 days" | Self-sequence, ≤**1d** | **Self propose — anyone** |
| **OP Mainnet** | Fraud proofs (INT), permissionless | **3d 12h challenge + 3d 12h execution** | Self-sequence, ≤**12h** | **Self propose — anyone** |
| **Linea** | Validity proofs, **permissioned prover** | No execution delay when proven | ⚠️ **"No mechanism"** | ⚠️ **"Cannot withdraw" — withdrawals frozen** |
| **Scroll** | Validity proofs (ST, SN) | No execution delay | Self-sequence, ≤**7d** | Self propose |
| **zkSync Era** | Validity proofs (ST, SN) | 3h execution delay; regular exit 4d 3h | ⚠️ **"Enqueue via L1" — can't force**; sequencer can stop processing the queue | **Replace proposer** via governance upgrade |

**Reduced challenge periods and the basis:** `observed` Base cut finalization twice in 2026 — **Azul (activated 2026‑06‑05)** brought `proofMaturityDelaySeconds` 7d → **1d** on the basis of a **multiproof system: an AWS Nitro TEE attestation arm plus an SP1 ZK arm, game type 621 (`AggregateVerifier`), either of which can finalize**. **Beryll (2026‑06‑25)** cut optimistic finalization 7d → 5d. ⚠️ **Marketing-vs-observed discrepancy:** Base's blog (https://blog.base.dev/introducing-base-azul) says withdrawals "finalize in as little as one day"; L2BEAT's live discovery reads `challengeDelay: 432000` = **5 days**. Both may be true for different paths, but the headline number is the optimistic one. ⚠️ New trust assumption introduced: **AWS Nitro TEE enclaves**, whose signers Coinbase rotates roughly weekly (six rotations observed Jun–Jul 2026) and whose allowlist the Security Council cannot veto.

### L3 chained withdrawal paths (`inferred` from `observed` component delays)

| L3 | Path | L3→L2 | L2→L1 | **Total** |
|---|---|---|---|---|
| **Degen Chain** (Orbit/AnyTrust) | → Base → L1 | 5.60d | 5.00d | **≈10.6 days** |
| **B3** (OP Stack) | → Base → L1 | 7.00d | 5.00d | **≈12.0 days** |
| **Xai** (Orbit/AnyTrust) | → Arbitrum One → L1 | 6.36d | 8.36d | **≈14.7 days** |

**Every new trust assumption an L3 adds** (`observed`):
1. **The host L2's entire risk surface stacks on top** — including Base's 2/2 instant upgrade power.
2. **Data availability leaves Ethereum.** Degen: external **DAC 2/3**. Xai: **DAC 3/5**. B3: **Celestia, and "Sequencer tx roots are not checked against the Blobstream bridge data roots onchain" — no DA bridge at all.**
3. **Weaker or absent proofs.** B3: state validation **"None — currently the system permits invalid state roots."** Degen/Xai: fraud proofs with only **2 whitelisted challengers**.
4. **Proposer failure is fatal on B3:** "Only the whitelisted proposers can publish state roots, so in the event of failure **the withdrawals are frozen**."
5. ⚠️ **Degen has a 1-of-1 fast-finality key.** `observed`: `DegenFastConfirmerMultisig` `0xc207cbC35DD3CD172059730380A45aE14eb0e403` is a **1/1** multisig controlled by a single EOA `0x3cAF7ceF6B2aECA72102E8835325B26BF99FE9E0`, holding `anyTrustFastConfirmer` **and** the validator role ("validators: … ultimately EOA 1"). It "can finalize a state root before the challenge period has passed."
6. **RaaS key custody** — see Q5.

---

## Q5 — ECONOMIC SUSTAINABILITY & STEWARD RISK

### Chain economics (`observed`, growthepie API `fundamentals.json`, 30 days to 2026‑08‑12)

| Chain | Fees 30d | DA/L1 costs 30d | "Profit" 30d | Daily txs | Daily active addrs |
|---|---|---|---|---|---|
| **Ethereum L1** | **$7,887,985** | n/a | n/a | 2,399,333 | 559,443 |
| **Base** | **$1,819,047** | $5,086 | $1,813,961 | 8,618,256 | 289,048 |
| **Arbitrum One** | $426,016 | $1,148 | $424,868 | 1,177,798 | 105,613 |
| **OP Mainnet** | **$37,702** | $2,342 | $35,361 | 1,775,160 | 28,495 |
| **Linea** | $34,957 | $43 | $34,914 | 19,456 | 2,462 |
| **zkSync Era** | $14,204 | stale | stale | 11,242 | 2,208 |
| **Scroll** | **$1,985** | $923 | $1,062 | 7,751 | **712** |

⚠️ **Critical caveat:** growthepie "costs" = **DA/L1 posting cost only**. This is gross margin over data costs, **not** true profitability — it excludes servers, engineering, proving, and legal. Real profitability is `unknown` for every chain. Also `observed`: growthepie's own front page reported **total ecosystem daily onchain profit of $324.3K** on 2026‑08‑12, with the top three being Robinhood Chain, Fraxtal, and Polygon PoS — Base/Arbitrum/OP were not in the top three by that measure.

**Scroll's entire protocol revenue is ~$66/day and it has 712 daily active addresses.** OP Mainnet's is ~$1,257/day (~$460k/yr). Base's ~$60k/day dwarfs the rest combined.

### Chain death — measured outcomes (`observed`, 2026‑08‑13)
`observed` L2BEAT lists **96 archived project slugs vs 107 live** — roughly half of all EVM L2/L3s ever tracked are now archived. By RaaS provider, **Caldera (13 dead / 9 live), Gelato (7/3), and AltLayer (5/2) each have more dead chains than live ones.**

| Chain | Death | Final state root? | Money outcome | Read path today |
|---|---|---|---|---|
| **Public Goods Network** (OP Stack, Conduit) | Sunset began 2024‑12‑10 | ✅ posted 2024‑12‑17, L2 block 22,674,600 | Immutable merkle `BalanceClaimer`; escrow now **0 ETH**, TVS **0** | ⚠️ RPC + explorer resolve but accept no connection; site 404. **Still in chainid.network pointing at dead endpoints.** Conduit still rotating its multisig signers on this chain in **Jan 2026** |
| **Kroma** (OP Stack-derived) | Halted 2025‑06‑30 | ✅ posted 2025‑07‑01, L2 block 28,738,800 | — | ⚠️ **Every domain NXDOMAIN**: api/blog/docs/**specs**/bridge/kromascan. DA was onchain so state is reconstructible *in principle* — but the spec needed to do it is deleted |
| **Redstone** (OP Stack, **altDA**) | Announced 2026‑04‑15, halted 2026‑05‑15 | ✅ posted 2026‑05‑22 | ⚠️ **22.107 ETH still sits in an unpaused L1 portal (~$57,770), unclaimable** | RPC dead, explorer 403. DA was **off-chain and is gone** → no one can build the storage proof. Lattice's own warning: assets "held in contracts like Uniswap pools… **will not be recoverable**" |
| **Astar zkEVM** (Polygon CDK, Gelato) | Sunset 2025‑03‑31 | `unknown` | `unknown` | ⚠️ Explorer NXDOMAIN; **Astar deleted its own sunset announcement** (blog URL 404, docs/zkEVM 404, sitemap 404) |
| **Sanko** (Orbit L3, Caldera) | Archived 2026‑04‑29 | assertions **stalling** (stake ratcheting 0.1→0.7 ETH) | **~$970,387 stranded** | RPC **NXDOMAIN** |
| **RARI Chain** (Orbit L3, Caldera) | Archived 2026‑06‑30 | — | **~$572,953 stranded** | RPC **NXDOMAIN**. Upgrade authority is one Caldera Safe **shared across 4 chains** |
| **Muster**, **WINR**, **PoP Apex**, **Mint**, **Kinto** | 2025–2026 | — | $12k / $9 / $0 / $42k / $12k | All RPC dead. Muster: "critical contracts can be upgraded by an **EOA**." Mint has a hard deadline — assets left after **2026‑10‑20 are unrecoverable** |

**Other documented deaths worth the shape they show** (`documented`, L2BEAT archived page): **Everclear Hub** — stopped 2026‑05‑01, ownership moved from the Gelato Multisig to a new Safe, **"no public shutdown announcement has been issued"** (silent death). **Fluence** — bridge escrows **upgraded into sweeper contracts forwarding assets to a 2-of-4 multisig**. **rhino.fi** — admin multisig "**upgraded the core contract implementation and subsequently withdrew all funds**." **re.al** — halted "without prior notice"; permissionless fallback exists but "if the DAC doesn't serve the necessary data, funds can be compromised." **Treasure** — the one confirmed ZK Stack shutdown, by governance vote.

⚠️ **The pattern that matters most, `inferred` from all of the above:** escape hatches that actually returned user assets existed **only on purpose-built forced-exit designs** — dYdX v3 (StarkEx escape hatch mode) and DeGate (irreversible shutdown → withdrawal mode with user-supplied merkle proofs). **No general-purpose EVM rollup death in this dataset produced a working forced exit for arbitrary contract state.** The standard outcome was a final state root, escrow drained or orphaned, and a merkle-claim covering **token balances only**. In **zero** cases did anyone commit to preserving an archive node or public RPC; DNS records were deleted, usually within months, on **8 of 8 dead chains probed**.

### RaaS provider risk
`observed` All seven providers (Conduit, Caldera, AltLayer, Gelato, Alchemy, Zeeve, Karnot) are **still trading** as of 2026‑08‑13. Conduit claims 60+ mainnets/$4B TVL; Caldera 75+ chains; Gelato has repositioned toward smart-wallet infra. `unknown` — funding, runway, headcount for all of them; none discloses it.

**The Degen/Conduit case — the canonical example** (`reported`, The Block 2024‑11‑07, https://www.theblock.co/post/325132/, headline "Not your keys, not your blockchain"): a Conduit upgrade caused **54 hours of downtime**, users lost **~$160,000**, and Conduit allegedly withheld the Gnosis Safe keys needed to migrate despite a contractual 30-day transfer provision. Andre Cronje, quoted: "if you use 'rollup as a service,' you are not in control and are at the whims of the provider."

`observed` **On-chain corroboration, and the part that matters most:** L2BEAT's Degen changelog for **2024‑05‑14** records the sequencer-only window being extended **1000×, to 1000 days** (`delaySeconds` 345,600 → 86,400,000), with the note "Big chain reorg on the L2, no batches posted for the last ~30h." **Force-inclusion via L1 — the only user-side escape hatch — was set ~1000 days out** and was not restored until **2025‑01‑15**. `observed` **Resolution 2024‑11‑08**: `ConduitMultisig3` **DELETED**, `DegenMultisig` **CREATED**. Degen is **alive today** (RPC head block 26,959,302; explorer 200) under **Alchemy**. But `observed` its `SequencerInbox` is now "ultimately **AlchemyMultisig2**, upgradableBy: **delay: no**". **The custodian was swapped, not removed.**

⚠️ **Branding vs. reality:** `documented` Conduit's FAQ (https://docs.conduit.xyz/faq.md) states: "**Do I own my chain if I launch it with Conduit? Yes.** If you need to take control of your chain or want to migrate… we'll send the necessary keys to a wallet of your specification **as soon as you ask**. This is standard in our contracts." But `documented` Conduit's actual **SLA (effective 2026‑04‑20)** promises ≥99% monthly availability (**≈7.2 hours of permitted downtime per month**) and **contains no termination procedure, no offboarding requirement, no data-retention provision, no key-handover clause, and no statement about what happens if Conduit ceases operations.** `observed` Conduit's full doc index (`llms.txt`, 17,650 bytes) has **zero** matches for decommission/shutdown/sunset/terminate/wind. `unknown` — no published SLA or offboarding terms found at all for Caldera, AltLayer, Gelato, Zeeve, or Karnot.

`observed` **The provider's multisig is the actual upgrade authority on RaaS chains:** Mode's `Conduit Multisig 1` (4/10) "can update… the batch submitter (Sequencer) address"; RARI's `Caldera Multisig 1` is shared across **blessnet, inevm, molten, and RARI**; PGN's `L2OutputOracle` is still "ultimately Conduit Multisig 1" **two years after the chain died**.

### Steward dependency and public failure statements
- **Base → Coinbase, now exclusively.** `documented` The Feb 2026 blog **contains no contingency statement about what happens if Coinbase discontinues Base.** Effect on Optimism (`documented`, gov.optimism.io thread opened 2026‑02‑20): Base's original terms were "the greater of 2.5% of gross sequencing revenue or 15% of L2 profit"; in 2025 Base transferred **~3,765 ETH — more than 70% of all Superchain revenue-share contributions that year**. The Foundation's response (2026‑03‑03): **the revenue share will not continue, and Base is ineligible for its remaining unvested OP grant** (of up to ~118M OP). `documented` Optimism's Year‑4 budget update (2026‑08‑06): new commitments **~150M OP, down 35%** from Year 3. **The Foundation published no revenue figures, no treasury runway, and no headcount** despite a delegate asking in-thread.
- **Linea → Consensys.** Worst escape story (no sequencer mechanism, proposer failure freezes withdrawals) but the **only explicit dead-man's switch**: `observed` a 2026‑04‑02 upgrade renamed the fallback to **"Liveness Recovery Operator," which gains `OPERATOR_ROLE` after 6 months of non-finalization**. `observed` 2026‑07‑17 v8.0 "sets the stage for forced L1 transactions, **however they are not live yet**." ⚠️ New durability risk: `observed` 2026‑03‑04 added **native ETH yield — "permissioned entities can now move ETH from the rollup contract into yield providers"**; Lido added 2026‑04‑20. The L1 escrow backing withdrawals is now partly a staking position.
- **zkSync Era → Matter Labs.** `observed` As recently as **2026‑08‑10**, "Matter Labs 4/7 multisig upgraded boojum verifier to v29.5… **Verifier is not yet reproduced**." `observed` 2026‑05‑04: the Era validator multisig became "**the only entity that can precommit, commit, revert, prove and execute blocks**."
- **Arbitrum → Offchain Labs + DAO.** ⚠️ `observed` 2026‑06‑15: "Inbox temporarily replaced with a custom impl exposing **`sendUnsignedTransactionOverride(...)` (forge an L2 unsigned EOA tx from any `from`)**, then reverted." A 9/12 council can forge L2 transactions from arbitrary senders.
- Offchain Labs / OP Labs / Consensys / Matter Labs corporate developments in 2026 (layoffs, funding, acquisitions): **`unknown`** — blocked by search exhaustion.

---

## Q6 — TOKEN/GOVERNANCE CAPTURE

### Can a token vote change rules affecting existing contracts?

| Venue | Token governance holds upgrade power? | Evidence |
|---|---|---|
| **Ethereum L1** | **No** — no coin voting exists | `documented` ethereum.org/governance |
| **Arbitrum One** | **YES, fully** | `documented` "**On-chain payload · Permissionless execute.** Once the vote passes and the timelocks expire, **anyone can call `execute()`** — the same bytes that were voted on are what runs." Constitutional AIP can "**modify the Security Council's powers or eliminate the Security Council entirely**" |
| **zkSync Era** | **YES** | `documented` Protocol proposals travel L2→L1 and are **permissionlessly executed on Ethereum** after review + timelock |
| **OP Mainnet** | **No** — signaling/veto only | `documented` "Token House and Citizens' House signal/veto… but **do not directly trigger the L1 state change. No permissionless `execute()`**" |
| **Scroll** | **No** | `documented` "onchain governance proposals **do not contain transaction payloads**, so onchain voting only acts as an onchain temperature check" |
| **Base** | **No token governance exists** | `documented` docs.base.org — Coinbase + Security Council only |
| **Linea** | **`unknown`** — no token-governance upgrade path found in L2BEAT's data | — |

### Contested actions and interventions actually exercised (all `documented`/`observed`)
1. ⚠️ **Arbitrum froze $71M, April 2026.** The Security Council froze **>30,000 ETH (~$71M)** tied to the KelpDAO exploit, transferring the funds to an ownerless wallet. Critics argued it set a precedent for intervention "under regulatory or political pressure"; Patrick McCorry (Arbitrum Foundation) defended the powers as "a very transparent part of the system." (https://www.coindesk.com/tech/2026/04/22/…, checked 2026‑08‑13)
2. **Arbitrum emergency action, 2026‑05‑24.** A vulnerability let anyone instruct the Bridge to renounce its `PROPOSER_ROLE` in the L1 Timelock, which "would have prevented the DAO from executing constitutional governance AIPs." Fixed by an SC transaction bypassing the DAO timelock entirely.
3. ⚠️ **Arbitrum Security Council replaced its own members, July 2026.** 9/12 voted to remove John Morrow (Gauntlet resigned) and Elad (Certora) and install replacements — "executed through a non-emergency action followed by three emergency actions… which enabled the new Security Council members to be **installed immediately**." **The council can rotate itself without a DAO vote.**
4. ⚠️ **Scroll dissolved its Security Council, June 2026** (see Q1) — a governance body eliminated on cost grounds, moving the chain from Stage 1 to Stage 0, with **no formal on-chain vote**; community critique in-thread noted the changes "appeared finalized despite being framed as proposals."
5. **Base exited Superchain governance, March 2026** (see Q1) — unilateral, and it terminated a revenue-share arrangement that was >70% of Optimism's 2025 Superchain contributions.
6. `observed` **Two Scroll emergency verifier upgrades**: 2025‑08‑11 ("**Soundness bug** and verifier emergency update. **No postmortem yet**") and 2026‑02‑23 (guest prover bug).

**`unknown` / not researched:** Arbitrum AIP‑1 (the March 2023 750M ARB controversy) — I could not reach a primary source; the forum thread URL I tried returned 404 and the search budget was gone. Treasury raids or governance attacks on any venue prior to 2026: **not researched.**

---

## Q7 — EXIT: WHAT IS ACTUALLY PORTABLE

**Answer: contract state is not portable, and no venue documents a state-export path. This is an evidenced absence, not an oversight I failed to find.**

`observed` I checked, and found **no** state-export, chain-migration, or shutdown procedure in:
- **Arbitrum Orbit ownership docs** (https://docs.arbitrum.io/launch-arbitrum-chain/maintain-your-chain/ownership-structure-access-control): documents chain owner, UpgradeExecutor, validators, proxy admins — "does not address migration procedures, state export, chain shutdown, or transferring ownership between RaaS providers."
- **OP Stack differences** (https://docs.optimism.io/stack/differences): "no statements about state portability, chain migration, exporting state, [or] contract state persistence if a chain stops."
- **OP Stack smart contracts** (https://docs.optimism.io/stack/smart-contracts): "no information about chain state migration between chains."
- **Conduit's full documentation index**: zero matches for decommission/shutdown/sunset/terminate/wind.

**What *is* portable:** only **code**. `documented` L2BEAT's own phrasing for OP Stack chains: "OP stack chains are pursuing the EVM Equivalence model. No changes to smart contracts are required regardless of the language they are written in, i.e. **anything deployed on L1 can be deployed on L2**." That is a statement about redeploying bytecode — it says nothing about carrying storage across.

**Corroborating evidence that the practical answer is "re-mint, don't migrate":**
- `reported` Degen's own stated fallback during the Conduit standoff: "**DEGEN stands ready to create a new chain and remunerate all holders and developers on the original L3.**" Not migrate state — recreate the chain and compensate holders.
- `documented` **Every dead-chain recovery mechanism in the dataset covered token balances only** — merkle claims (PGN, RSS3), manual distribution (Loopring, Kinto), or sweeper contracts (Fluence). Arbitrary contract state was recovered in **zero** cases.
- `documented` Lattice's Redstone shutdown notice states the point explicitly: assets "held in contracts like Uniswap pools… **will not be recoverable after shutdown**."

**Intra-chain migration is possible but only the operator can do it:** `documented` OP Mainnet's Bedrock migration (2023‑06‑06, block 105235063) converted the state DB in place and emitted a verifiable state root — "any discrepancy or alteration in the information during migration would lead to the production of an incorrect state root." It required a bespoke tool, a chain halt, and the operator's cooperation.

---

## COULD NOT VERIFY

1. **Optimism Law Foundation / legal-entity governance separation** — searched no primary source successfully; not present in the OPerating manual README, Optimism's decentralization blog, or docs.optimism.io. **`unknown`, not researched to conclusion.**
2. **Arbitrum AIP‑1 (2023) controversy** — forum thread 404'd; no primary source obtained. **Not researched.**
3. **Treasury raids / governance attacks pre‑2026** on any venue — not researched.
4. **True profitability** of any chain — growthepie "costs" cover DA/L1 posting only; no chain publishes server, engineering, or proving costs. Coinbase SEC filings/shareholder letters on Base revenue: **not retrieved**.
5. **2026 corporate developments** (layoffs, funding, acquisitions, runway) for Coinbase/Base, Offchain Labs, OP Labs, Consensys, Matter Labs, Scroll Foundation, and all seven RaaS providers — **`unknown`**, blocked by search-budget exhaustion.
6. **Astar zkEVM's sunset terms** — Astar deleted its own announcement, docs page, and sitemap. Whether a final batch was posted, a withdrawal deadline existed, or an archive node was kept: **`unknown`**.
7. **Kroma's announcement text** — L2BEAT's quote is the only surviving source; every Kroma domain is NXDOMAIN.
8. **Whether Degen's ~$160k user loss was ever reimbursed**, and the off-chain terms of the Conduit→Alchemy handover.
9. **Where PGN's ~195 ETH went** — portal, bridge, and claimer all read 0 ETH; "all claimed" vs "swept" is **`unknown`**.
10. **Scroll's blob-vs-calldata decomposition** — `blobBaseFee()`, `commitScalar()`, `blobScalar()` all revert on its oracle.
11. **zkSync Era 10KB deploy cost** — its pubdata-based gas model does not map to the 200 gas/byte rule; the figure given is low-confidence.
12. **Whether L2s will adopt EIP‑8037** — `inferred` only.
13. **L2BEAT has a site-wide "stageChanges" countdown to 2026‑08‑17 12:00 UTC** (`observed`, embedded in every project payload). I could not determine what changes — the /stages page was last updated 2025‑07‑23. **Several venues' Stage labels may move within days of this report.**
14. **zkSync SecurityCouncil / Guardians thresholds** were taken from L2BEAT and **not** re-verified on-chain (custom multisig implementation, non-standard interface). Degen/Xai/B3 thresholds likewise not re-verified (non-Ethereum chains).
15. **Non-EVM state-rent precedent** (Solana rent-exempt minimum, NEAR storage staking) — not verified.

---

## FLAGGED DOCS-VS-REALITY DISAGREEMENTS (consolidated)

| # | Claim | Observed reality |
|---|---|---|
| 1 | Base, OP, Arbitrum branded "Stage 1 decentralized" | **All three have Exit window: None** — keys upgrade the bridge instantly, no notice |
| 2 | Arbitrum Foundation publishes its Security Council roster | **Two of the twelve listed addresses are not on-chain owners**; two live signers are unnamed anywhere |
| 3 | Base Azul: "withdrawals finalize in as little as one day" | L2BEAT discovery reads `challengeDelay: 432000` = **5 days** |
| 4 | Scroll branded a decentralized ZK rollup with a Security Council | Council **dissolved 2026‑06‑01**; a **3-of-4 team multisig** now holds instant upgrade power; chain dropped to Stage 0 |
| 5 | Conduit FAQ: "we'll send the necessary keys… as soon as you ask. This is standard in our contracts" | Its **SLA contains no key-handover clause**; Degen alleges a ~6-month refusal |
| 6 | l2fees.info renders as a live fee tracker | **190 days stale**; Ethereum figures ~300–400× off |
| 7 | ethereum.org/roadmap/verkle-trees/ (updated 2026‑06‑24) presents Verkle as the plan | **Every Verkle EIP is Stagnant**; Vitalik co-authored a replacement binary-tree EIP in June 2026; Verkle absent from the 2026‑08‑11 roadmap |
| 8 | Aevo listed as a live chain | Its **canonical registered RPC is NXDOMAIN** — "alive" ≠ "publicly readable" |
| 9 | PGN sunset in 2024 | **Conduit was still rotating multisig signers on it in Jan 2026**; it remains in chainid.network pointing at dead endpoints |
| 10 | Optimistic Etherscan gas tracker | Reports "0.000002 Gwei" Rapid, contradicting the 0.001 gwei floor in every receipt; Featured Actions renders blank |

No recommendation is offered and no venue is selected, per the brief.
