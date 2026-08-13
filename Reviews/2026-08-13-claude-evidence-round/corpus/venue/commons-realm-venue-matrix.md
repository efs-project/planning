# Recovered Claude memo — CROPS Commons/Realm venue matrix

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T05:08:41.831Z
**Claude task:** `a923cd0e6397887e9`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3635
**Original result length:** 37566 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
All five research streams are in. Here is the memo.

---

# EFS Commons/Realm — EVM venue evidence review
**Dated memo, 2026-08-13. Read-only research against V2-E7 ("Commons venue criteria"). No venue selected, no Realm identity defined, no contracts designed, nothing written to the workspace.**

Evidence tags: `observed` (a live probe returned it), `documented` (venue's own docs/spec/source), `reported` (third party), `inferred`, `unknown`. All fee figures are dated snapshots.

---

## 1. Conclusion — phone-readable

**The threat you are actually buying insurance against is not chain death. It is "confirmed, then unreadable."** That is the empirically dominant failure in the record, and it is the same bug class your own vault already names.

Seven findings that move the decision:

1. **Optimism deleted its own users' event logs.** Jan–Jul 2021 events and tx status "partially lost and cannot be fully recovered" — three legacy data directories "errantly deleted during an infra cleanup." `documented` in OP's own docs. This is a major L2, not a dead L3.
2. **"Onchain DA" does not mean permanently retrievable.** Arbitrum, Base and OP Mainnet all post batches as type-0x3 blob txs. Protocol blob retention is **4096 epochs ≈ 18.2 days**. The first blob ever posted returns **HTTP 403 from the beacon API** and is served only by Blobscan (Google Cloud / Arweave / IPFS). `observed`. Beyond ~18 days, every rollup's re-derivability rests on volunteers and companies, not on Ethereum.
3. **Every venue except L1 has exit window "None."** Base 2/2, OP 2/2, Arbitrum 9/12 emergency, Linea 5/9, Scroll 3/4 — all can change bridge and state-root logic **instantly, with no notice**. For a project whose premise is an Etched immutable kernel, the L2 keys can change the machine underneath your frozen contracts. On L1 no such key exists.
4. **The L1 cost objection has collapsed — for now.** A 200,000-gas storage-heavy write, 2026-08-13: **L1 $0.020 · Arbitrum $0.0076 · Base $0.0023 · OP $0.00038** (`observed`, live RPC, ETH $1,890). L1 is ~9× Base, ~53× OP. The same write cost **$23.43 in Dec 2024** — a ~1,000× swing. Choosing L1 is a bet on the 60M-gas-limit fee regime holding.
5. **Storage is about to get ~5× more expensive everywhere.** EIP-8037 is **Scheduled for Inclusion in Glamsterdam**: new SSTORE 20,000 → **97,920** gas, code deposit 200 → **1,530**/byte. `documented`. EFS is a storage-heavy protocol by design; this reprices your entire gas bundle and likely propagates to the L2s.
6. **The L3 tier fails your own adopted requirements by construction.** Arbitrum's own docs: in AnyTrust mode "a node cannot reconstruct chain state from parent-chain data alone." Degen and Xai are AnyTrust; B3 uses Celestia **with no DA bridge**. L2BEAT classifies none of them as a rollup; Degen and B3 are "not even a Stage 0 project." Roughly **96 archived vs 107 live** scaling projects, **$85.2M stranded**, and 8 of 8 dead chains I probed had deleted their DNS.
7. **The "chains don't die" ruling (2026-07-10) is safe for L1, arguable for the top L2s, and empirically false for L3s.** Degen Chain — the usual L3 exemplar — is `reported` to sunset **2026-08-31**, eighteen days from now (primary source 403'd; verify).

**What this does not say.** No venue is disqualified here by fiat, and L1 is not endorsed. L1's own weak points are real: a Teku CL supermajority at 53.86%, 41% of blocks via OFAC-censoring relays, and no force-inclusion mechanism at all (FOCIL/EIP-7805 was **declined for Glamsterdam**, deferred to Hegotá).

**One correction to the brief's framing.** The minimal durable L1 pointer cannot be justified as censorship escape — re-homing begins with an admission at the censoring home, which your own D-4 correction already found. But the evidence surfaces a *different* justification the vault did not have: with ~50% L3 mortality, chainid.network still listing 129 deprecated chains pointing at dead endpoints, and Kroma's own spec pages NXDOMAIN'd, an L1 record of "where this principal's drive lives, and whether it is still alive" is a **discovery-and-tombstone** argument, not an escape argument. Presented for weighing; not adopted.

---

## 2. Evidence matrix

### 2a. Master comparison

| Criterion | **Ethereum L1** | **Base** | **Arbitrum One** | **OP Mainnet** | **Orbit L3** (Degen/Xai) | **OP-Stack L3** (B3) |
|---|---|---|---|---|---|---|
| **Censorship resistance** | Permissionless proposers; 88.9% MEV-Boost blocks, Titan 54.15%; **41% via OFAC-censoring relays** | Single sequencer (Coinbase) | Single sequencer (Offchain Labs) + Timeboost auction | Single sequencer (OP Labs) | Single EOA sequencer | Single signer |
| **Force inclusion** | **None exists.** FOCIL declined for Glamsterdam → Hegotá | `seq_window_size` 3600 L1 blk = **12 h** → L1 | `delaySeconds` **86400 = 24 h** → L1; delay-buffer enabled | **12 h** → L1 | Degen **4 d** → Base (was set to **1000 days** May 2024–Jan 2025); Xai 24 h → Arb | ~12 h assumed; L2BEAT: "no reference to it" |
| **Works if sequencer dead?** | n/a | Yes | Yes | Yes | Yes for L3, but needs the host L2 alive | Yes-ish |
| **Sequencing** | 12 s slots | 2 s blocks, Flashblocks 200 ms | Timeboost express lane | 2 s blocks | single operator | single operator |
| **Finality evidence** | Casper FFG **~12.8 min**; no 3SF scheduled | On-chain **1 d fast / 5 d slow**; **docs still say 7 d** | `confirmPeriodBlocks` 45818 ≈ **6.36 d** + 2 d grace | `proofMaturityDelaySeconds` **7 d** | ~5.6–6.4 d, Degen bypassable by a **1/1 fast-confirmer** | 7 d, `L2OutputOracle`, no proofs |
| **Proofs permissionless?** | n/a | **Split** — ZK arm yes, TEE arm permissioned (Coinbase-only allowlist) | **Yes** — `validatorWhitelistDisabled: true` (BoLD), 3600 ETH bond | **Yes** — `respectedGameType 8 = CANNON_KONA`; Guardian can revert to permissioned | **No** — 2 whitelisted validators | **None** — "permits invalid state roots" |
| **Data availability** | n/a | Ethereum blobs | L1 calldata **or** blobs | Ethereum blobs | **AnyTrust DAC** 2/3 and 3/5 | **Celestia, no DA bridge** |
| **State rebuildable from parent alone?** | n/a | Yes (base/base) | Yes (Nitro); pre-Nitro needs a foundation tarball + legacy client | Yes (op-node L1-only sync); **pre-Bedrock needs a snapshot** | **No** — Arbitrum's own docs | **No** (`isNodeAvailable: false`) |
| **Upgrade power** | **None — no admin key exists** | 2/2: CB Signers 3/6 **+** Base SC 8/11 | SC **9/12** emergency; DAO path w/ timelocks | 2/2: OP Foundation 5/7 **+** OP SC 10/13 | Degen: Alchemy 5/8; Xai 3/5 | 2/5 |
| **Exit window** | n/a | **None** | ~7–17 d regular (sources disagree); **0 emergency** | **None** | **None** | **None** |
| **L2BEAT stage** | n/a | Stage 1 | Stage 1 | Stage 1 | "not even Stage 0" / no stage | "not even Stage 0" |
| **200k-gas write, 2026-08-13** | **$0.0201** | **$0.0023** | **$0.0076** | **$0.00038** | native gas token, not ETH | n/a |
| **Recurring state cost** | **None**, none scheduled | None | None | None | None | None |
| **Archive on public RPC** | Gated behind a token | **Yes** | **No** — "missing trie node" | **Yes**, incl. pre-Bedrock | Xai **no**; Degen inconclusive | — |
| **Archive disk** | 2.0–2.8 TB (Erigon/Reth); 12–14 TB hash-based | **3.9 TB** snapshot (~9.4 TB provisioned) + L1 + beacon | **3.7 TB** + Classic node + L1 + beacon | **≈14 TB, +3.5 TB/6 mo** + L1 + beacon | `unknown` | `unknown` |
| **Deterministic deploy** | ✅ all factories | ✅ | ✅ | ✅ | **Degen: no ERC-2470, no CreateX. Xai: no CreateX** | `unknown` |
| **EAS deployed** | ✅ | ✅ predeploy `0x42…0021` | ✅ | ✅ predeploy | **❌ none, both** | `unknown` |

`observed`/`documented` per row; sources in Appendix E.

### 2b. zk venues (contrast)

| | **Linea** | **Scroll** | **zkSync Era** | **Polygon zkEVM** |
|---|---|---|---|---|
| Force inclusion | **No mechanism.** Gateway spec is "🚧 not yet live" and by design does not bypass the sequencer | `EnforcedTxGateway` from L1 — **emergency-paused for 3 days in Apr 2025** | L1 queue; L2BEAT: users "can't force them"; a live `TransactionFilterer` censors with no delay | Code existed, **disabled** |
| Proposer failure | **Withdrawals frozen** | Self-propose | Replace proposer via upgrade | Cannot withdraw |
| Only escape | Operator role becomes public after **6 months** of no finalization | — | — | — |
| Stage | 0 | **0 — regressed from 1 on 2026-06-01** | 0 | **dead** |
| Governance | Consensys, 5/9, 0 s delay | **Independent 9/12 SC dissolved → 3/4 team multisig**, on cost grounds | Matter Labs multisig upgraded the verifier as recently as 2026-08-10; "Verifier is not yet reproduced" | — |
| DA | full tx data, blobs | full tx data, blobs | **state diffs only** — current storage image recoverable, write log is not | ended External |
| Fate | live | live | live | **Froze at block 33,391,890, 2026-07-03**. `zkevm.polygonscan.com` → **NXDOMAIN** six weeks later. RPC still serves archive reads. Contract-resident state had **no migration path**; unclaimed assets "abandoned" after 2027-12-31 |

### 2c. Cost translated to EFS's actual workload

`inferred`, arithmetic mine, assumptions stated. Your vault prices the enumeration spine at **~22–27k gas/record** (`codex-kernel.md`) *before* full-body state, the predicate-carrying postings word, LIST reverse-membership, REDIRECT cited-by, and the author-keyed index. A cold `SSTORE_SET` is 22,100 gas/word. So a single EFS record write plausibly lands at **150k–400k gas**. Empirical upper anchor: real EAS `Attested` txs burned **282,312 gas on Base** and **253,176 on OP Mainnet** (`observed`).

| Scenario (2026-08-13 prices) | L1 | Arbitrum | Base | OP |
|---|---|---|---|---|
| One 250k-gas record | $0.025 | $0.0095 | $0.0029 | $0.00048 |
| 10,000 records | $250 | $95 | $29 | $4.80 |
| Same 250k write at Dec-2024 L1 gas (30.09 gwei, ETH $3,894) | **$29.29** | — | — | — |
| Same, under EIP-8037 (cold SSTOREs ≈4.9×) | **~$0.10** today · **~$120** at Dec-2024 gas | — | — | — |

**The load-bearing observation is the variance, not the level.** L1 today is affordable for a heavy on-chain filesystem. L1 twenty months ago was not, by three orders of magnitude. Nothing in the evidence guarantees which regime holds in 2028.

---

## 3. Failure and capture scenarios

**F1 — Silent readability loss on a healthy chain.** The chain keeps producing blocks; a subset of history stops being served. **Precedent, not hypothesis:** OP's deleted Jan–Jul 2021 event logs; raw txs survive on L1 via the CanonicalTransactionChain but reconstruction is "labor intensive and costly" with no guarantee. Hits EFS hardest because your reverse indexes and admission ordering are the thing that becomes unrecoverable, while balances look fine.

**F2 — The 18-day blob cliff.** An EFS Realm on any blob-posting rollup is re-derivable from Ethereum for ~18 days and from **Blobscan, Google Cloud, Arweave and six named commercial providers** thereafter. `observed`: the first blob ever posted is 403 from the beacon API and 200 from Blobscan. This is the current shipped design, not a future threat. Your own `E-4`/`R-D3` state-only-rebuild pledge quietly depends on a private archive on every L2.

**F3 — Silent guarantee downgrade under a stable name.** Polygon zkEVM migrated to Pessimistic Proofs on 2025-12-03 — stopped validating full L2 state, DA reclassified External — **seven months before freezing, without changing its name or chain ID**. Anything written after that date is, by the operator's own classification, not derivable from L1. An EFS Realm pinned by chain ID would not have noticed.

**F4 — Instant upgrade under an Etched kernel.** Every L2 has exit window "None." Arbitrum's council has used emergency powers repeatedly: ArbOS 32 (2024-09-25), Stylus stack depth executed **the same day** it was announced (2025-10-13), a `Bridge.executeCall` hash check (2026-05-24), and the **~30,766 ETH / ~$71M KelpDAO freeze (2026-04-21)** — user-controlled assets moved by council action. Also `observed` on Arbitrum 2026-06-15: the Inbox was temporarily replaced with an implementation exposing `sendUnsignedTransactionOverride(...)`, letting a payload forge an L2 tx from any sender, then reverted. Every one of these was disclosed **after** execution.

**F5 — Governance regression.** Scroll dissolved its independent 9-of-12 Security Council on **2026-06-01**, transferring roles to a **3-of-4 team multisig** with a 0-second emergency timelock, explicitly on cost grounds — Stage 1 → Stage 0. Its total protocol revenue is ~$66/day against 712 daily active addresses. Decentralization is a cost center and it gets cut.

**F6 — Steward swap, not steward removal.** Degen's 2024 incident is the full sequence: RaaS config change → batches posted after the inclusion window → reorg → 54 h down → ~$160k lost → **force-inclusion `delaySeconds` raised 1000× to 1000 days** (not restored until 2025-01-15) → key-custody standoff → explorer data reportedly deleted with no backups. Resolution: `ConduitMultisig3` deleted, `DegenMultisig` created, now **AlchemyMultisig2**, "upgradableBy: delay: no." The custodian was swapped, not removed. Conduit's FAQ promises keys "as soon as you ask"; its actual SLA has **no key-handover, offboarding, data-retention, or cessation clause**, and its liability carve-out states loss of access to "onchain assets, data, or smart contracts" carries **no liability**.

**F7 — Escape hatches are upgradeable by the same keys.** Scroll emergency-paused its enforced-transaction gateway for 3 days; Orbit `maxTimeVariation` is chain-owner-settable (Degen, above); zkSync deployed a standing `TransactionFilterer`. The escape hatch is not outside the trust boundary.

**F8 — Discretionary censorship, no court order required.** Linea halted block production and, in its own words, "censor[ed] attacker addresses" during the Velocore exploit (2024-06-02, 1 h 13 m); its forward commitment to give up that power is **unmet as of today**. Soneium blacklisted specific memecoin contracts at launch over an IP claim — RPC blocks + explorer warnings + wallet exclusion, contracts alive but unreachable via default paths. **No confirmed OFAC sequencer filtering was found on any venue**; the widely-repeated "Base respects OFAC SDN filtering" claim traces to an unsourced page that does not contain it.

**F9 — Chain death, measured.** 96 archived vs 107 live scaling projects; 59% of dead chains never put data on Ethereum; 52% were RaaS-hosted; $85.2M stranded; exit window "None" on 81% of them. `observed` liveness probes: PGN, Redstone, Sanko, RARI, Muster, WINR, Game7, Xterio, Mint, Form, Aleph Zero EVM, Ham, Molten, Proof of Play Apex all dead. Several share **one decommissioned Conduit load balancer (34.110.231.171)** as a common tombstone. Kinto returns `"tenant disabled"`. **Redstone is the sharpest case for EFS:** alt-DA, and Lattice's own notice says assets in contracts "will not be recoverable"; 22.107 ETH still sits in an unpaused portal because nobody can build the storage proof — the DA is gone.

**F10 — The one counter-example, and why it worked.** dYdX v3 froze 2024-10-28 and its explorer still returns HTTP 200 today, showing 24,082 state updates and 3,057 forced transactions — because **L2BEAT's open-source StarkEx Explorer rebuilds everything from Ethereum L1 with no operator cooperation**, and because DA was onchain calldata. Even so, **$32.2M remains stranded 21 months later**, and dYdX published balances/state updates, not transactions. Survivability came from purpose-built forced-exit design plus L1 calldata — **no general-purpose EVM rollup death in the dataset produced a working forced exit for arbitrary contract state.**

**F11 — Client monoculture, both directions.** L1: **Teku at 53.86% of consensus clients** is a live supermajority risk. Base: `op-geth` EOL 2026-05-31, and Base is consolidating op-node + op-geth into **one `base/base` binary** at **six hard forks per year** — an unattended node has roughly a two-month lifetime, and the venue trends toward a single implementation. That sits badly with your `O-1` ("at least two independent implementations and RPC/data paths").

---

## 4. Unknowns requiring hands-on tests

Nobody's published numbers substitute for these. Each is runnable.

1. **Price the real EFS gas bundle per venue.** Full-body spine + predicate-carrying postings + LIST reverse-membership + REDIRECT cited-by + author-keyed index, as one aggregate, on L1/Base/Arbitrum/OP. This is freeze-gates A2 and it is also the venue decision. Then **re-price it under EIP-8037** (97,920-gas new SSTORE).
2. **Clean-room reconstruction drill, for real.** Rebuild an EFS Realm's state from parent-chain data alone, using blobs **older than 18 days**, without a commercial archive. This is `R-M2`/`E-4`. Expect it to fail on at least one venue; find out which.
3. **Execute an actual force inclusion.** With an EFS write payload: `forceInclusion` on Arbitrum, and the L1 deposit path on Base and OP. **Nobody has published a count of real force inclusions on any of these chains** — Blockscout's method filter is broken and the number does not exist publicly. Measure the delay, the cost, and whether a non-developer could do it.
4. **Fork-cadence survivability.** Base ships ~6 hard forks/year and its own node tutorial contains **no migration notice** for the client cutover its public RPC is already running. Measure how long an unattended EFS node stays canonical.
5. **Deterministic deployment on every candidate.** CreateX is **absent on Degen and Xai**; ERC-2470 absent on Degen. If EFS's addresses ride CREATE3, they do not reproduce there.
6. **Read-at-scale.** Arbitrum's official public RPC is **not an archive node** and its cap is on *result count* across a 493M-block chain — the worst scan profile in the set. Test `eth_getLogs` paging for a realistic EFS index read on each venue.
7. **State-diff DA sufficiency.** On zkSync-class venues, determine whether EFS admission ordering and receipts survive when only state diffs are published. Your bodies-in-state design may survive where event-based designs do not — this is worth knowing precisely, not assuming.
8. **Base's fast-finality path.** On-chain reads say 1 d fast / 5 d slow; user docs say 7 d. Confirm which a real withdrawal gets.
9. **Blob retrieval without a provider.** Fetch a 6-month-old blob using only self-hosted infrastructure. If it cannot be done, name the archive dependency in the design honestly.
10. **Whether any AnyTrust DAC member retains data past DACert expiry** (~3 weeks). The single most consequential unverified item in the whole study for the L3 tier.

---

## 5. Disqualifying criteria

Proposed as criteria, derived from requirements you have already adopted. **Not applied as verdicts.**

| # | Criterion | Grounded in | Who fails on current evidence |
|---|---|---|---|
| D1 | State must be reconstructible from a parent chain by permissionless software after all operators disappear | `R-M2`, `E-4`, `R-D3` | **Degen, Xai** (AnyTrust — Arbitrum's own docs), **B3** (Celestia, no DA bridge). Partial: zkSync Era (state yes, write log no) |
| D2 | A usable escape path that does not require the sequencer to be alive | Cypherpunk property 8; V2-E7 "force inclusion" | **Linea** ("no mechanism"), **zkSync Era** ("can't force") |
| D3 | Proposer failure must not freeze withdrawals | V2-E7 "exit" | **Linea**, **B3**, Polygon zkEVM (dead) |
| D4 | At least two independent client implementations and data paths | `O-1` | **Base** trending single-binary (verify); watch L1's Teku 53.86% |
| D5 | No single company or RaaS provider holds sequencer keys with no published sunset, data-retention, or handover obligation | V2-E7 "independent operation" | **Every RaaS L3.** Conduit's 30-day handover protects the chain operator, not the user; **Caldera and AltLayer publish no sunset policy at all** |
| D6 | Has the venue ever deleted user-visible historical data with no recovery path? | The confirms-but-unreadable class | **OP Mainnet** (Jan–Jul 2021 logs). Applied strictly this disqualifies a major L2 — which is why it should be debated, not auto-applied |
| D7 | Has the venue downgraded a durability guarantee without changing its name or chain ID? | F3 | **Polygon zkEVM** (dead); **Scroll** (governance, Stage 1→0) |
| D8 | Deterministic deployment + EAS-class prerequisites present | Practical | **Degen, Xai** (no CreateX; no EAS) |

Note what **no** venue clears: **exit window ≥ 30 days**. L2BEAT blocks Arbitrum, Base and OP from Stage 2 on exactly this, verbatim — "Upgrades unrelated to onchain provable bugs provide less than 30d to exit." If EFS requires a notice period before its execution environment can change, **only Ethereum L1 currently satisfies it**, and it does so by having no upgrade key at all.

---

## 6. The few choices James may eventually need to make

Six, in dependency order. Each is a values call the evidence sharpens but cannot settle.

1. **Does an Etched kernel tolerate a mutable machine underneath it?** If EFS contracts are frozen forever but the venue's 2/2 or 9/12 can change VM semantics with zero notice, the freeze is conditional. Answering "no" collapses the venue set to L1 immediately. Answering "yes" means naming, in the constitution, whose keys can change EFS's execution environment.

2. **What does "reconstructible" mean — from venue state, or from the venue's parent after the venue dies?** These are different bars that select different venues. The first is satisfied by every live L2. The second is satisfied on L1 forever (calldata from block 15,000,000 was served today), for ~18 days on blob rollups, and never on AnyTrust L3s. `R-M2` currently does not say which it means.

3. **Is the "chains don't die" assumption retained, scoped, or retired?** It is defensible for L1, arguable for Base/Arbitrum/OP, and contradicted by ~50% L3 mortality. A scoped version — "assume L1 and top-tier L2s persist; treat L3s as mortal" — would preserve the simplification you wanted while keeping the design honest.

4. **Is the Commons venue optimizing for durability or for reach?** They point opposite ways. Durability points at L1 (no upgrade key, calldata forever, no state expiry scheduled, currently ~$0.02 per heavy write). Reach points at Base (highest activity, cheapest, native AA via EIP-8130 in the Cobalt upgrade). The Core/Commons split you already adopted lets these be different answers — but only if you say so explicitly.

5. **Does the L1 pointer get reopened on the new evidence?** P-5 retired it, correctly, on censorship-escape grounds. The discovery-and-tombstone argument is new and independent: 129 deprecated chains still in chainid.network pointing at dead endpoints, Kroma's own spec pages NXDOMAIN'd, DNS gone on 8 of 8 dead chains probed. Weigh it — the counter is that a pointer to a dead chain is itself only a tombstone, not a recovery.

6. **How much fee-regime variance is EFS willing to carry?** L1 is $0.020 per 200k-gas write today and was $23.43 twenty months ago; EIP-8037 multiplies storage creation by ~4.9×. A venue chosen at today's prices may be unaffordable at the next demand peak, and the L2s inherit the repricing.

---

## Appendix A — Where docs and observed behavior disagree

| Venue | Claim | Observed |
|---|---|---|
| Base | Bridging docs: withdrawals take **7 days** | On-chain `SLOW_FINALIZATION_DELAY` 432,000 = **5 d**, `FAST` 86,400 = **1 d** (Azul 2026-06-05, Beryll 2026-06-25) |
| Base | Node tutorial as fetched today | **No mention** of the op-geth/op-node retirement its own public RPC already runs (`reth/…/base/v1.1.1`) |
| Arbitrum | Foundation's published Security Council roster | **Two of twelve listed addresses are not on-chain owners**; two live signers are unnamed anywhere |
| Arbitrum | L2→L1 page says "~7 days"; rollup page says 6.4 d | `confirmPeriodBlocks` 45,818 ≈ **6.36 d** is the real constant |
| Scroll | Docs describe "an independent body of 12… 9/12 multisig" | **3-of-4 Scroll team multisig** since 2026-06-01, 0-second emergency path |
| Linea | Complete forced-transaction spec published | Carries a "🚧 not yet live" banner and by design **does not bypass the sequencer** |
| zkSync Era | Docs: priority queue "will always be available as an escape-hatch… to protect users against censorship" | L2BEAT: users "**can't force them**"; sequencer "can stop processing the queue entirely"; `TransactionFilterer` filters with no delay |
| zkSync Era | Contract-deployment page teaches a non-Ethereum CREATE2 derivation | Canonical factories exist at Ethereum-identical addresses with **byte-identical bytecode**; its own interpreter page says derivation is now consistent. Two pages contradict each other |
| Xai | Docs + L2BEAT list **6** DAC members | On-chain `dacKeyset.membersCount` = **5** |
| Xai | Sentry Nodes marketed as securing the chain | L2BEAT: "no integrated way to flag an invalid state root… just observation nodes" |
| Degen/Xai/B3 | Self-describe as L3 rollups | L2BEAT classifies **none** as a rollup; Degen and B3 "not even a Stage 0 project" |
| Conduit | FAQ: keys sent "as soon as you ask. This is standard in our contracts" | SLA has **no key-handover, offboarding, retention or cessation clause**; Degen alleges a ~6-month refusal |
| EIP-4444 | Formally **Stagnant** | Partial history expiry **shipped 2025-07-08**; Nethermind enables it by default |
| Verkle | ethereum.org roadmap page (updated 2026-06-24) presents Verkle as the plan | **Every Verkle EIP is Stagnant**; Vitalik co-authored binary-tree EIP-8297 in June 2026 |
| l2fees.info | Renders as a live tracker | **190 days stale** (`age: 16445266`, `x-vercel-cache: STALE`); L1 figures ~300–520× off. **Do not cite it** |
| Optimistic Etherscan | Gas tracker "0.000002 Gwei" Rapid | Contradicts the 0.001 gwei floor in every receipt; Featured Actions renders blank |

## Appendix B — Live measurements, 2026-08-12/13 UTC

`observed`. ETH **$1,890.05** (Coinbase spot, cross-checked Kraken to 0.003%).

- Gas price: L1 **0.053 gwei** (base fee 0.0529) · Base **0.006** · Arbitrum **0.02002** (at its `getMinimumGasPrice` floor) · OP **0.001** · Linea **0.93** · Scroll **0.00012** · zkSync **0.045**. Sampled every 10 s for 2 min: Base and OP pinned at the floor for all 12 samples.
- L1 block 25,743,825: gasLimit **60,000,000**, ~41% full over 20 blocks.
- **Blob base fee 3,046,029 wei (0.00305 gwei) — NOT at the 1 wei floor**; range 2.26M–4.25M wei over 20 blocks; `blobGasUsedRatio` 0.198. One blob ≈ **$0.00075**. The post-Dencun floor broke around Dec 2025.
- Blob config: **target 14 / max 21** (BPO2, epoch 419072, 2026-01-07). BPO3 (21/32) exists in config, **not scheduled**.
- L1 data component per L2 tx is now **<0.05% of total cost**: a real 246,864-gas Base tx paid $0.0237 execution and **$0.0000015** L1 data.
- Scroll's L1 data fee is **~500× Base's** for identical payloads.
- L1 head 25,744,691 · Base 49,895,066 · Arbitrum One 493,269,185 · OP 155,890,735.
- Client versions: L1 `Geth/v1.17.1` · Base **`reth/v2.3.0/base/v1.1.1`** · Arbitrum `nitro/v3.11.3` · OP `op-reth/v2.4.1`.
- Public-RPC caps: Base/Linea/Degen **10,000-block range**; Arbitrum/zkSync/Xai **10,000-result**; OP returned `-32011 "no backend is currently healthy to serve traffic"` on one query.
- Archive on the default public endpoint: Base ✅, OP ✅ (incl. pre-Bedrock), Linea ✅, Scroll ✅, zkSync ✅, **Arbitrum ❌** ("missing trie node"), **Xai ❌**, L1 gated behind a token.
- Deterministic factories byte-identical across L1/Base/Arb/OP/Linea/Scroll/zkSync. **CreateX absent on Degen and Xai; ERC-2470 absent on Degen.**
- **EAS: absent on Degen and Xai** (0 bytes at all three probed addresses).
- DAO fork block 1,920,000 still served today, `extraData` reads `"dao-hard-fork"` — though 2 of 4 public L1 RPCs returned nothing for it.
- Post-Merge liveness: 84 windows × 100,000 blocks sampled, worst 12.26 s/block vs 12.00 nominal (2.2% deviation, March–May 2023). May 11 2023 fine-grained scan: max inter-block gap **96 s** — finality degradation, never a halt.
- **Testnet explorers:** Ropsten, Rinkeby, Kovan, **Holesky** (deprecated ~11 months ago) all **NXDOMAIN**. Sepolia alive.

## Appendix C — Upgrade authority, verified on-chain 2026-08-13

Thresholds re-verified by direct `eth_call` (`getThreshold()`, `getOwners()`).

| Venue | Authority | Threshold | Delay |
|---|---|---|---|
| Ethereum L1 | **no admin key exists** | — | — |
| Base | `0x7bB41C30…` nested 2/2 → CB Signers `0x98550547…` **3/6** + Base SC `0x20AcF55A…` **8/11** | 2/2 | **None** |
| OP Mainnet | `SuperchainProxyAdminOwner` `0x5a0Aae59…` 2/2 → OP Foundation `0x847B5c17…` **5/7** + OP SC `0xc2819DC7…` **10/13** | 2/2 | **None** |
| Arbitrum One | Security Council `0xF06E95eF…` | **9/12** | **None** (emergency) |
| Linea | `0x892bb7Ee…` | **5/9** | **None** |
| Scroll | `ScrollAdminMultisig` `0xcca54B09…` | **3/4** | **None** |
| Degen | `AlchemyMultisig2` | 5/8 | **None** |

Two structural notes: OP's charter states that if Security Council signers fall below 8, **control reverts to the Optimism Foundation**. Base's **TEE prover allowlist is managed solely by the Base Coordinator Multisig without Security Council approval** — a unilateral Coinbase power the Council cannot check, with enclave signers rotated roughly weekly.

## Appendix D — Chain economics and steward exposure

`observed`, growthepie fundamentals, 30 days to 2026-08-12. "Profit" = fees minus DA/L1 posting only; true profitability is `unknown` for every chain.

| Chain | Fees 30 d | DA cost | Daily txs | Daily active addrs |
|---|---|---|---|---|
| Ethereum L1 | $7,887,985 | n/a | 2,399,333 | 559,443 |
| Base | $1,819,047 | $5,086 | 8,618,256 | 289,048 |
| Arbitrum One | $426,016 | $1,148 | 1,177,798 | 105,613 |
| OP Mainnet | $37,702 | $2,342 | 1,775,160 | 28,495 |
| Linea | $34,957 | $43 | 19,456 | 2,462 |
| Scroll | **$1,985** | $923 | 7,751 | **712** |

Base left the Superchain (`documented` L2BEAT milestone **2026-03-04**; announcement 2026-02-18; on-chain: its own `SuperchainConfig` v2.5.0 at `0xb535ff7F…`). Consequence: Base contributed ~3,765 ETH in 2025 — **>70% of all Superchain revenue-share** — and the Foundation confirmed on 2026-03-03 that the revenue share **will not continue**. Optimism's Year-4 budget dropped ~35% to ~150M OP. No party — Coinbase, OP Labs, the Optimism Foundation, Offchain Labs — publishes a continuity or wind-down commitment for its chain.

## Appendix E — Primary sources

Ethereum: [consensus-specs mainnet.yaml](https://raw.githubusercontent.com/ethereum/consensus-specs/master/configs/mainnet.yaml) · [go-ethereum params/config.go](https://raw.githubusercontent.com/ethereum/go-ethereum/master/params/config.go) · [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) · [EIP-4444](https://eips.ethereum.org/EIPS/eip-4444) · [EIP-8037](https://eips.ethereum.org/EIPS/eip-8037) · [EIP-7773 (Glamsterdam)](https://eips.ethereum.org/EIPS/eip-7773) · [EIP-7736](https://eips.ethereum.org/EIPS/eip-7736) · [EIP-6800](https://eips.ethereum.org/EIPS/eip-6800) · [EIP-7864](https://eips.ethereum.org/EIPS/eip-7864) · [roadmap/statelessness](https://ethereum.org/en/roadmap/statelessness/) · [roadmap/glamsterdam](https://ethereum.org/en/roadmap/glamsterdam/) · [partial history expiry](https://blog.ethereum.org/2025/07/08/partial-history-exp) · [Fusaka announcement](https://blog.ethereum.org/2025/11/06/fusaka-mainnet-announcement) · [history endpoints / era1](https://eth-clients.github.io/history-endpoints/) · [governance](https://ethereum.org/en/governance/) · [relayscan.io](https://relayscan.io/overview?t=24h) · [mevwatch.info](https://www.mevwatch.info/) · [clientdiversity.org](https://clientdiversity.org/)

Optimism: [mainnet node tutorial](https://docs.optimism.io/operators/node-operators/tutorials/mainnet) · [blobs](https://docs.optimism.io/operators/node-operators/management/blobs) · [snap-sync](https://docs.optimism.io/operators/node-operators/management/snap-sync) · [network upgrades](https://docs.optimism.io/operators/node-operators/network-upgrades) · [fault proofs explainer](https://docs.optimism.io/stack/fault-proofs/explainer) · [fees](https://docs.optimism.io/stack/transactions/fees) · [Security Council Charter v0.1](https://github.com/ethereum-optimism/OPerating-manual/blob/main/Security%20Council%20Charter%20v0.1.md) · [Types.sol GameTypes](https://raw.githubusercontent.com/ethereum-optimism/optimism/develop/packages/contracts-bedrock/src/dispute/lib/Types.sol)

Base: [run-a-base-node](https://docs.base.org/base-chain/node-operators/run-a-base-node) · [snapshots](https://chain.base.org/snapshots) · [network fees](https://docs.base.org/base-chain/network-information/network-fees) · [bridging and withdrawals](https://docs.base.org/base-chain/network-information/bridging-and-withdrawals) · [Azul proofs spec](https://docs.base.org/base-chain/specs/upgrades/azul/proofs) · [security council](https://docs.base.org/base-chain/security/security-council) · [next chapter blog](https://blog.base.dev/next-chapter-for-base-chain-1) · [github.com/base/node](https://github.com/base/node)

Arbitrum: [run-full-node](https://docs.arbitrum.io/run-arbitrum-node/run-full-node) · [archive node](https://docs.arbitrum.io/run-arbitrum-node/more-types/run-archive-node) · [classic node](https://docs.arbitrum.io/run-arbitrum-node/more-types/run-classic-node) · [beacon RPC providers](https://docs.arbitrum.io/run-arbitrum-node/l1-ethereum-beacon-chain-rpc-providers) · [data availability](https://docs.arbitrum.io/how-arbitrum-works/data-availability) · [rollup protocol](https://docs.arbitrum.io/how-arbitrum-works/validation-and-proving/rollup-protocol) · [gas fees](https://docs.arbitrum.io/how-arbitrum-works/gas-fees) · [solidity support](https://docs.arbitrum.io/build-decentralized-apps/arbitrum-vs-ethereum/solidity-support) · [DAO constitution](https://docs.arbitrum.foundation/dao-constitution) · [security council members](https://docs.arbitrum.foundation/security-council-members)

Other: [l2beat config source](https://github.com/l2beat/l2beat/tree/main/packages/config/src/projects) (repo HEAD 2026-08-12T15:58:44Z; discovery freshness arbitrum 2026-08-07, base 2026-07-31, optimism 2026-07-17) · [L2BEAT Degen](https://l2beat.com/scaling/projects/degen) · [L2BEAT Xai](https://l2beat.com/scaling/projects/xai) · [L2BEAT Ham](https://l2beat.com/scaling/projects/ham) · [Scroll node guide](https://docs.scroll.io/en/developers/guides/running-a-scroll-node/) · [Scroll governance transition](https://forum.scroll.io/t/governance-update-security-council-transition-contributor-roles-operational-adjustments/1470) · [zkSync EVM interpreter](https://docs.zksync.io/zksync-protocol/era-vm/evm-interpreter/overview) · [zkSync external node](https://docs.zksync.io/zksync-era/tooling/external-node) · [EAS contracts](https://github.com/ethereum-attestation-service/eas-contracts) · [Conduit terms](https://conduit.xyz/terms) · [Conduit SLA](https://www.conduit.xyz/sla) · [Caldera terms](https://www.caldera.xyz/terms) · [AltLayer terms](https://altlayer.io/terms-of-service) · [Erigon hardware](https://docs.erigon.tech/get-started/hardware-requirements) · [Reth requirements](https://reth.rs/run/system-requirements) · [Arbitrum $71M freeze](https://www.coindesk.com/tech/2026/04/22/) · [Degen/Conduit](https://www.theblock.co/post/325132/)

## Appendix F — Explicitly unresolved

- **Force-inclusion usage counts on Arbitrum, Base, OP Mainnet: `unknown`.** No published figure exists; Blockscout's method filter returns 0 even for calls visible in the unfiltered response. The only real number found is dYdX v3's **3,057 forced transactions / 24,082 state updates**. Circumstantial: the Arbitrum DAO funded 42,500 ARB in Feb 2024 to build a force-inclusion UI *because* non-developers lacked the capability — and the shipped tool still hands users to a CLI.
- **Degen's reported 2026-08-31 sunset**: secondary sources only, primary 403'd. RPC was live today at head 26,959,302. **Verify before citing.**
- **Whether L2s will adopt EIP-8037**: `inferred` only; no L2 commitment verified.
- **Whether `base-consensus` retains pure-L1 derivation** (the op-node `--syncmode=consensus-layer` equivalent): undocumented. This is the single most important open question for Base's independence claim.
- **Whether any AnyTrust DAC member retains data past DACert expiry**: `unknown`, and decisive for the L3 tier.
- **Arbitrum's exit window**: sources give 7 d, ~10 d, and 17 d 8 h depending on what is measured. Unreconciled. The emergency path is 0 in all three.
- **L2BEAT carries a site-wide `stageChanges` countdown to 2026-08-17 12:00 UTC.** Several venues' Stage labels may move within days of this memo.
- **Linea node requirements, Degen node operation, Xai full-node requirements**: docs 404 / DNS ENOTFOUND. `unknown`.
- **True profitability of any chain**: `unknown`. Coinbase does not break out Base's P&L; SEC EDGAR returned 403.
- **Do not rely on**: "Base sequencer respects OFAC SDN filtering" (traced to unsourced content that does not contain the claim) · "the Arbitrum DAO voted to censor OFAC addresses" (same) · "Flashbots censored 70% of blocks" (the peer-reviewed figure is **46%**) · "Degen reorged ~500,000 blocks" (one aggregator; absent from Degen's own post-mortem) · a zkSync Era October 2023 halt (not found).

---

**Boundaries honored:** no venue selected · no Realm identity defined · no EFS contracts designed · nothing written, committed, or branched under `EFS_WORKSPACE`.
