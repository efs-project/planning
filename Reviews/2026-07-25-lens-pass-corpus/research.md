# Research lane — fresh techniques and mid-2026 reality for the lens/resolver pass

**Lane:** RESEARCH (gap G-A of the 2026-07-25 joined pass) — "research new concepts or techniques that might make this system better or more efficient; think creatively"
**Status:** web-verified technique menu, current through **2026-07-28**; reconciliation input, not canon
**Baseline it extends (not re-summarizes):** the [2026-07-11 lens architecture review](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) §17 already surveyed Plan 9, SDSI/SPKI, TUF, CSS, Nix, RDF, AT-proto labels, Zanzibar, Cedar, XACML, and the EIP set. This lane verifies what **changed since 2026-07-11** and digs where that review did not look.
**Rails honored:** three-tier steer (CORE/CONTRACT → RICH/CLIENT → ENHANCED), 15–55 design center, kill list, six-part read tuple, four absence sources, [FS-LENS/1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) settled, [owner rulings](../../Designs/efsv2/owner-rulings.md) uncontradicted.
**Marking:** every substantive claim is **VERIFIED** (named source/file/computation) or **PLAUSIBLE** (constructed; needs vectors). §10 lists what could not be verified.

#status/draft #kind/review #repo/planning #topic/lenses #topic/efsv2

---

## 0. Executive menu (one line per finding)

| # | Finding | Verdict for EFS |
|---|---|---|
| 1a | ENS CCIP-Read (EIP-3668) survives as the deployed "resolve off-chain, verify on-chain" pattern; ENSv2 **scrapped its own L2** (Feb 2026) because L1 gas fell ~99% | **ADAPT** as an optional GATE-tier adapter; venue-cost premise for E1 updated |
| 1b | Zodiac Roles Modifier v2 = the strongest *deployed* compiled-policy-on-EVM precedent (ENS DAO, Balancer treasuries) | **ADOPT** as existence proof + storage-layout lessons for the CORE tier |
| 1c | Story Protocol PIL license-terms registry: register-once, attach-by-ID policy objects | **ADAPT** the terms-registry shape for shared `EffectiveLens` plan registration |
| 1d | EAS unchanged and alive; Sign Protocol pivoted to omni-chain attestation + token products, adds nothing beyond EAS | EAS: carry (already ruled). Sign: **REJECT** as design source |
| 2 | ZK coprocessors: **Axiom killed its coprocessor** (→OpenVM); Brevis/Lagrange/Herodotus live; latency 7 s–6 min, opaque pricing | **ADAPT** as Level-3 accelerator only; at 55 principals inline reads beat proof verification — proofs win only for big pages/cross-chain/history |
| 3 | EIP-7825 tx cap **live** (16,777,216, Fusaka 2025-12-03); block gas 60M (targets ~200M); Verkle **abandoned** for binary tree EIP-7864; state expiry still years out; FOCIL slipped to Hegotá; BALs (EIP-7928) headline Glamsterdam | Hard numbers for the honest table; D-2 force-inclusion rider stays rollup-escape-hatch-shaped through ~2027 |
| 4 | Client-side IVM is now production (Rocicorp Zero 1.0, ElectricSQL d2ts, DBSP formal base); Cedar-in-WASM/Lean-verified conformance discipline | **ADOPT** IVM technique for the RICH-tier cache; **REJECT** Cedar/OPA as substrate (second policy language); **ADOPT** their conformance method |
| 5 | Bluesky labeler ecosystem measured (34 active labelers; niche labels; unclear incentives); trusted-verifier role typing shipped; Farcaster abandoned CRDT gossip for ordered Snapchain; Nostr WoT still oracle-shaped | Advisory-source count stays small (3–8); typed roles validated; ordered-admission validated; WoT **stays OUT** — failure evidence recorded |
| 6 | FIDO CXF approved (Aug 2025), CXP ~early-2026; Apple/Google shipping; NIP-51's relay-loss failure; Bluesky private-state work | **ADOPT** a CXF-shaped explicit export/import ceremony for lens recovery bundles |
| 7 | Unsolicited: CRLite/Clubcards (whole-WebPKI revocation in ~1–2 MB shipped to every Firefox); cargo-vet non-transitive audit imports; C2SP tlog-tiles + witness cosigning; AuthZEN 1.0; locality cost-model drift | Three strong adapts: compiled client filter bundles, non-transitive import convergence, witness-cosigned closure manifests |

Nothing found contradicts an adopted ruling. No Pushback section is required; §3.4 records one **evidence update** (not a pushback) to the D-2 rider timeline.

---

## 1. On-chain policy representation and caching precedents

### 1.1 CCIP-Read / EIP-3668 — could a lens resolve via CCIP with on-chain verification?

**What it is (VERIFIED —[ENS CCIP docs](https://docs.ens.domains/resolvers/ccip-read/), EIP-3668):** a contract reverts `OffchainLookup(sender, urls, callData, callbackFunction, extraData)`; the client fetches a gateway; the contract's callback **verifies** the gateway response before accepting it. Three deployed verification grades: (a) EIP-712 signature from a trusted gateway signer (database-backed names), (b) Merkle/state proof against an L2 state root (L2 resolvers), (c) DNSSEC proof. ENS Labs' gateway carries most L2 name resolution as of Q1 2026.

**Mid-2026 change that matters (VERIFIED —[The Block](https://www.theblock.co/post/388932/ens-labs-scraps-namechain-l2-shifts-ensv2-fully-ethereum-mainnet), [Cointelegraph via TradingView](https://www.tradingview.com/news/cointelegraph:2f15d6047094b:0-ens-abandons-plans-for-namechain-l2-citing-ethereum-scaling/), Feb–Mar 2026):** ENS **cancelled Namechain** and moved ENSv2 fully to L1, citing a ~99% drop in registration gas after the 2025 gas-limit increases (30M→45M→60M, with public targets near 200M in 2026). The largest CCIP-read deployer decided the L1 is cheap enough to come home.

**Mapping to the lens (PLAUSIBLE — constructed):** CCIP-read is structurally the review's "supplied slice + membership proof against `sliceCommitment`" path ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)) generalized to *whole resolved answers*: a gate that needs a resolved view too big to compute inline can revert `OffchainLookup`, have any resolver (the user's own SDK included — the `urls` array can point at localhost) compute the view at a pinned basis, and verify the returned `(winner, provenance, basis)` on-chain. The three ENS verification grades map exactly onto EFS read-tuple grades:

| ENS gateway grade | EFS equivalent | GATE-consumable? |
|---|---|---|
| trusted-signer EIP-712 | hosted-RPC / signer-trust grade | only under an owner-pinned signer policy — this is an oracle and must be labeled as one |
| L2 state proof | verified state proof (absence source 2) | yes |
| DNSSEC | (no analogue) | — |

**Verdict: ADAPT.** Specify a `CCIP-LENS` adapter profile at the ENHANCED/RICH boundary: the *pattern* (revert-with-continuation, client round-trip, on-chain verify) costs the CORE tier nothing because it is pure calling convention; only the **verification path** decides the grade. Two hard rules carry from the rails: the gate owner pins which verification grade is acceptable (never the caller — caller-supplied gate policy is killed), and gateway silence is the **availability** axis of the tuple, never absence.
**How it breaks:** gateway liveness becomes a read dependency (ENS mitigates with multiple `urls` — copy that); a trusted-signer gateway is indexer capture wearing a standard's clothes; and EIP-3668 responses are not basis-pinned by default — the EFS adapter must carry the basis in `extraData` and verify it in the callback or two calls can splice bases (violating FSP-BASIS-1, [filesystem-core §1.6](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)).
**Cost line:** signature-grade verify ≈ 3–6k gas (ecrecover + bookkeeping); storage-proof-grade verify ≈ 150–400k gas per proven account/slot bundle on MPT (PLAUSIBLE ballpark, pre-EIP-7864); latency +1 HTTP round trip.

### 1.2 Deployed compiled-policy-on-EVM: Zodiac Roles Modifier v2

**(VERIFIED —[Zodiac Roles docs](https://docs.roles.gnosisguild.org/), [Gnosis Guild writeup](https://gnosisguild.mirror.xyz/oQcy_c62huwNkFS0cMIxXwQzrfG0ESQax8EBc_tWwwk))** Roles v2 stores, on-chain, per-role permission trees: scoped target addresses → selectors → **condition expression trees over calldata parameters** (comparisons, logical nodes, allowances/rate limits), evaluated inline in bounded gas on every `execTransactionWithRole`. It guards nine-figure DAO treasuries (ENS DAO endowment migrated to v2 by governance vote; GnosisDAO, Balancer).

This is the closest thing in production to the CORE-tier lens: **a typed, owner-pinned, compiled policy stored in contract storage and evaluated at execution time with no off-chain dependency.** Three transferable lessons: (a) conditions are stored as a flattened packed tree (post-order arrays), not nested structs — the compiler flattens, the EVM walks; (b) policy updates go through the avatar's own governance (= risk-bearer pins policy, independently converged); (c) the SDK owns authoring/diffing and the chain owns only the compiled artifact — exactly the review's source/compiled split.
**Verdict: ADOPT as precedent** (existence proof that "small ordered trusted sets + typed scoped conditions, on-chain, bounded gas" is a shipped pattern, not a hope) and mine its storage layout for the GATE-plan encoding. **How it breaks:** Roles conditions are per-call authorization, not resolution — there is no cross-author combiner, no absence semantics; borrowing more than layout/process would smuggle an authz model into a read model.
**Cost line:** free (design input only).

### 1.3 Story Protocol — license-terms registry

**(VERIFIED —[Story licensing docs](https://docs.story.foundation/concepts/licensing-module/license-terms))** Story's Programmable IP License stores **License Terms as reusable on-chain parameter structs registered once and referenced by ID**; anyone attaching those terms to an IP asset references the registered object, and modules (licensing/royalty/dispute) consume the parameters mechanically.

**Verdict: ADAPT the registry shape.** EFS already plans `EffectiveLensId` as a content digest; Story shows the useful next step for the CORE tier: a **plan registry** — `register(canonicalPlanBytes) → planId` storing the compiled slice once, so N gates and M receipts reference one stored plan instead of each carrying calldata. This is also the natural home for the "owner-stored gate plan" option in [review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), generalized to dedup across owners.
**How it breaks:** registration is permissionless state growth (spam priced only by gas — same accepted posture as the rest of EFS); a registry must never *bless* a plan (registration ≠ authority; the gate owner still pins the planId).
**Cost line (arithmetic):** storing a 55-entry compiled slice ≈ 55 × 2 words + header ≈ 112 slots × 22,100 (cold SSTORE) ≈ **2.48M gas once**; thereafter every consumer loads it warm/cold at SLOAD prices instead of ~1.9–3.5 KB calldata per call. Break-even vs calldata (≈30–56k/call, §8) ≈ 50–80 calls. PLAUSIBLE (schedule arithmetic, not benchmarked).

### 1.4 EAS / Sign Protocol indexer patterns

**EAS (VERIFIED —[EAS docs](https://docs.attest.org/), [attest.org](https://attest.org/)):** unchanged and maintained mid-2026; the on-chain `Indexer.sol` pagination pattern James already cited in the [2026-07-15 ruling](../../Designs/efsv2/owner-rulings.md) stands; no new machinery worth importing beyond what mandatory indexing already adopted. One small pattern worth naming: EAS's per-schema **resolver hook** (a schema names one contract consulted at attest/revoke time) is a clean precedent for per-definition admission hooks — EFS deliberately rejected state-dependent admission (confluence), so this is a **do-not-import**, recorded to prevent later drift.
**Sign Protocol (VERIFIED —[docs.sign.global](https://docs.sign.global/case-study/ethsign)):** EthSign's pivot became an omni-chain attestation layer plus token-distribution products (TokenTable) and a schema registry; its "schema hooks" mirror EAS. Nothing architecturally new for lenses. **Verdict: REJECT as a design source** (track only as a competing attestation ecosystem).

---

## 2. Proof-backed reads: ZK coprocessors, mid-2026 state

**Landscape change since the 07-11 review (VERIFIED):**
- **Axiom shut down its ZK coprocessor product**; its Halo2 circuits now live on as dependencies of **OpenVM**, a modular zkVM running arbitrary Rust ([Trail of Bits, 2025-05-30](https://blog.trailofbits.com/2025/05/30/a-deep-dive-into-axioms-halo2-circuits/)). The most-cited "contract reads history via ZK" vendor exited the category.
- **Brevis** is live with the Pico zkVM + data coprocessor; claims ~6.9 s average proof latency on a 64×RTX-5090 cluster for its real-time-proving workloads; fetches data on demand; **pricing is opaque and query-complexity-dependent** ([Space and Time comparison](https://www.spaceandtime.io/blog/brevis-zk-coprocessor-vs-space-and-time-a-complete-comparison-for-developers)).
- **Lagrange** runs a bonded prover network over **pre-indexed** storage with SQL-shaped queries; bonds trade latency for delivery assurance ([Lagrange docs](https://docs.lagrange.dev/lpn/zk-coprocessor/overview)).
- **Herodotus** storage proofs are production across Ethereum/Starknet/OP-stack/Base/ApeChain, with the Integrity STARK verifier live on Starknet ([Herodotus docs](https://docs.herodotus.dev/herodotus-docs/scaling-solutions/integrity-verifier)).
- Measured latency for data-parallel proof jobs: **~58–69 s for 64 data points, ~127–144 s for 1,024, ~323–350 s for 4,096** ([Space and Time benchmark writeup](https://www.spaceandtime.io/blog/best-zk-coprocessors-and-verifiable-compute-layers)). VERIFIED as published vendor/analyst numbers, PLAUSIBLE as generalizable.

**The mission question — could a contract consume a proven resolved-view at 55 principals instead of resolving inline?** Technically yes: a coprocessor can prove "at block B, the 55 slot heads for position P were {…} and the claimant roster pages closed at count 2", and the gate verifies one proof. State proofs prove empty slots, so **absence closure is provable** (absence source 2 of the four — this is the honest strength). But the arithmetic kills it at the design center:

| Path | Cost at 55 principals, one point | Latency | Liveness dependency |
|---|---|---|---|
| Inline roster read (P_v=2) | ~21–23k gas (§8) | one block | none |
| Inline direct probe (worst case) | ~210–230k gas (§8) | one block | none |
| Coprocessor-proven view | proof fee (opaque, $) + **~250–500k gas** on-chain verify (Groth16≈250k; STARK more; PLAUSIBLE ballparks) | 7 s–6 min | prover market must exist; circuits/verifier become versioned deps |

**Verdict: ADAPT, strictly as the review's Phase-5/Level-3 accelerator — and say why sharper than before:** at 15–55 principals the coprocessor **loses to the naive path on gas alone**, before latency and liveness. It wins exactly where inline resolution is impossible: (a) whole directory pages consumed *by a contract* (inline 64-item page ≈1.4M–14.7M, §8 — one proof verify beats that), (b) cross-chain reads (prove foreign-venue state locally — matches the [§15.2 limitation](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)), (c) historical bases after log/history expiry. Fresh chains/L3s have no prover coverage, so **nothing base may require it** (ENHANCED-tier only, per the steer — same class as The Graph).
**How it breaks:** prover disappearance = availability failure that must never demote to absence; circuit bugs are a new trusted-code axis (the Trail of Bits audit found soundness issues in exactly this class of circuits); opaque pricing makes E2-style cost signing impossible today.
**Unsolicited corollary (OpenVM):** because OpenVM proves arbitrary Rust, the **EFS Rust reference resolver itself could eventually be proven unmodified** rather than hand-circuited — strengthening the existing sequencing rule "freeze exact semantics first, proofs later" ([review §11.3/§18](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)): the better the vectors, the cheaper the eventual proof system. PLAUSIBLE.

---

## 3. EVM state and gas reality, mid-2026

### 3.1 Hard facts now settled (all VERIFIED)

| Fact | Status | Source |
|---|---|---|
| **EIP-7825 tx gas cap = 16,777,216 (2²⁴)** | **LIVE on mainnet** since Fusaka, 2025-12-03 | [EF blog 2025-10-21](https://blog.ethereum.org/2025/10/21/fusaka-gascap-update), [CoinDesk 2025-12-03](https://www.coindesk.com/tech/2025/12/03/ethereum-activates-fusaka-upgrade-aiming-to-cut-node-costs-speed-layer-2-settlements) |
| Block gas limit 60M default (EIP-7935), public targets ~200M in 2026 | live / trajectory | [Rango Fusaka explainer](https://rango.exchange/learn/market-trends/ethereum-fusaka-upgrade), ENS statements above |
| Glamsterdam headliners = **ePBS (EIP-7732) + Block-Level Access Lists (EIP-7928)**; target ~end Aug 2026 | scheduled | [ethdaily](https://ethdaily.io/757), [Chainstack](https://chainstack.com/ethereum-glamsterdam-upgrade/), [EF Checkpoint #9](https://blog.ethereum.org/2026/04/10/checkpoint-9) |
| **FOCIL (EIP-7805) moved OUT of Glamsterdam → headliner for Hegotá** | slipped one fork | [Christine Kim ACDE #218](https://christinedkim.substack.com/p/acde-218-minutes), [Sigma Prime](https://sigmaprime.io/blog/glamsterdam-eip-preferences/) |
| **Verkle abandoned; binary tree EIP-7864 + STARK proofs is the state-tree direction**; state expiry "several years, no guarantee" | research phase | [EIP-7864](https://eips.ethereum.org/EIPS/eip-7864), [ethereum.org statelessness page](https://ethereum.org/roadmap/statelessness/) |
| Partial (pre-Merge) history expiry deployed across all execution clients (300–500 GB savings); rolling-window expiry planned for a later fork | live / planned | [EF partial-history announcement](https://blog.ethereum.org/2025/07/08/partial-history-exp), [etherworld PHE guide](https://etherworld.co/how-to-enable-partial-history-expiry-phe-on-geth-besu-and-nethermind-clients/) |
| **EIP-7745 (log index) deferred** — being reconsidered against EIP-7708; not in Glamsterdam scope | deferred | [Everstake Glamsterdam overview](https://everstake.one/resources/blog/ethereum-glamsterdam-upgrade-explained) |
| `eth_simulateV1` standardized (execution-apis) and broadly available across clients/providers; state+block overrides, multi-block simulation | live | [execution-apis](https://ethereum.github.io/execution-apis/api/methods/eth_simulateV1/), [availability roundup](https://paragraph.com/@killaridev/the-json-rpc-method-eth-simulatev1-is-now-available-on-multiple-networks) |
| EIP-7702 live since Pectra (2025-05); ecosystem claims 200M+ smart wallets; MetaMask/Rabby/Trust shipped support | live | [The Block](https://www.theblock.co/post/354414/smart-wallet-adoption-surges-after-pectra-upgrade), [BlockEden](https://blockeden.xyz/blog/2026/01/20/account-abstraction-smart-wallets-erc-4337-eip-7702-mainstream/) |

Transient storage: unchanged — `TSTORE` still reverts in static context (EIP-1153 as specified; no amendment found), so the "no view-call dedup via transient storage" limitation in [review §17.6](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) stands. VERIFIED-by-absence (no EIP amending static-context behavior surfaced in any Fusaka/Glamsterdam scope list).

### 3.2 What this does to the lens design

1. **The 7825 cap is now a law of physics for Level-3 claims.** From §8: a 64-item × 55-principal naive two-phase directory page (~14.7M) fits a transaction with ~12% headroom and *nothing left for the caller*; 128 items (~29.5M) is **impossible in any transaction on a 7825 chain**, forever, regardless of block size. The roster path (~1.4M) and point gates (~23k–230k) are comfortably composable. This converts the review's "should not be promised" for wide Level-3 pages into "cannot be delivered" — freeze the vocabulary accordingly. VERIFIED arithmetic over VERIFIED cap.
2. **Rising block gas (60M→200M) widens `eth_call`/RICH-tier headroom, not Level 3.** The asymmetry is new and useful: client-side materialization keeps getting cheaper relative to transaction composability. It also updates the E1 venue premise: ENS's L1 retrenchment is direct evidence that "L1 too expensive for identity/registry writes" is decaying ([owner-decision-inbox E1](../../Designs/efsv2/owner-decision-inbox.md)).
3. **BALs (EIP-7928) + the locality drift.** Block-level access lists ship every touched address/slot with the block for parallel execution; analysts ([Dedaub](https://dedaub.com/blog/locality-as-ethereum-next-cost-model/)) expect the cost model to drift toward **locality** (contiguous/shared-prefix slots cheaper to prove and parallelize). Cheap, concrete consequence for the index bundle: **lay claimant-roster and candidate-stream pages out in contiguous slot runs** (array-style, not scattered mappings) so future locality pricing and binary-tree proof shapes favor them. New design consideration; costs nothing now. PLAUSIBLE (trajectory), VERIFIED (BALs scheduled).
4. **State-tree change (EIP-7864) is friendly, not hostile, to the roster.** Binary tree + STARK proofs makes *state proofs cheaper and post-quantum-safe* eventually, improving absence source 2; state **expiry** remains years out and even its proposals preserve resurrection-by-proof — the full-body spine ruling already hedges this. No design change; re-affirm "benchmark semantic budgets, never freeze one fork's gas constants" ([review §17.5](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)).
5. **History expiry is now partially real.** Pre-Merge bodies/receipts are already droppable network-wide; rolling-window expiry is on the roadmap. The "logs are not a query API" line in [onchain-completeness §0](../../Designs/efsv2/onchain-completeness.md) is no longer a prediction — it is deployed behavior. EIP-7745's deferral removes the main candidate that might have softened it. Mandatory keyed indexes remain the only honest path.
6. **`eth_simulateV1` is the RICH-tier workhorse we weren't naming.** One standardized call executes a multi-block, state-overridable batch at a pinned basis (EIP-1898 block selectors apply). Two lens uses: (a) the deterministic materializer batches candidate pages + point probes + advisory probes in one pinned-basis round trip; (b) **state overrides let the client inject a not-yet-registered compiled plan as if stored** and dry-run a gate against it — free semantic-diff/preview infrastructure for the update ceremony ([review §13.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)). Remains hosted-RPC-trust-graded unless run against one's own node — the grading rules carry unchanged. ADAPT, RICH tier. PLAUSIBLE (uses constructed; API VERIFIED).

### 3.3 Account abstraction touchpoints

7702 delegation is mainstream signer UX; nothing new surfaced that touches **read policy** — the JR-4 boundary (AA gives current execution authority; EFS supplies durable authorization evidence) survives contact with mid-2026 adoption numbers. ERC-4337 v0.8/paymaster maturity likewise stays on the KEL side of the seam. **Verdict: no lens-side action**; keep consuming via [kel.md](../../Designs/efsv2/kel.md) §7/§12. VERIFIED (adoption), no contrary finding.

### 3.4 Evidence update to the D-2 rider (not a pushback)

JR-2/D-2 made **revocation force-inclusion latency a security parameter of an acceptable authority home**. Update: neutral L1-native force inclusion (FOCIL) slipped out of Glamsterdam to **Hegotá** (≥2027); until then force inclusion means rollup escape hatches (hours-to-a-day, per-rollup) or L1 direct inclusion. E1's rider P-5r2 should therefore be evaluated against *per-venue escape-hatch latency now, FOCIL later*, and fixed grant expiries remain the load-bearing backstop for the interim. VERIFIED (scheduling), consequence PLAUSIBLE.

---

## 4. Compilation and incremental view maintenance

### 4.1 Client-side IVM went production since the review

- **Rocicorp Zero 1.0** (stable June 2026): a general web sync engine whose query layer (ZQL) is **incremental view maintenance over a client replica** — the client holds recently-used rows, queries update incrementally as deltas arrive ([InfoQ](https://www.infoq.com/news/2026/06/zero-version-1/), [zero.rocicorp.dev](https://zero.rocicorp.dev/)). VERIFIED.
- **ElectricSQL d2ts / d2mini**: differential dataflow in TypeScript, used by TanStack DB, designed to run incremental pipelines over sync streams in the browser ([github.com/electric-sql/d2ts](https://github.com/electric-sql/d2ts)). VERIFIED.
- **DBSP** (Feldera; VLDB) supplies the formal base: an IVM engine whose incremental output is **provably identical to full recomputation** ([materializedview.io overview](https://materializedview.io/p/everything-to-know-incremental-view-maintenance)). VERIFIED (claim of the formalism).

**Verdict: ADOPT the technique as the RICH-tier resolver cache architecture.** The mapping is direct and was already latent in [review §15.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md): the **dependency-head vector is the IVM input frontier**; the mandatory indexes' delta streams (`viewMutationVersion(author)` + affected semantic positions) are the change feed; the resolved view (directory materialization, advisory overlays) is the maintained view. DBSP's equivalence property is exactly the receipt-compatible correctness statement: *an incrementally maintained view must byte-equal the from-scratch resolution at the same `(evidence, EffectiveLensId, basis)` triple* — testable, and the right conformance vector to write. What the shelf engines do **not** give: basis pinning, authority semantics, UNKNOWN-stops-finality — the EFS resolver stays the semantics owner; d2ts/Zero are implementation substrate candidates for the web client only.
**How it breaks:** IVM state that survives a lens recompile or basis reorg is a silent-splice factory — cache keys must include `EffectiveLensId` + basis + resolver semantics (already the §15.1 rule); and an IVM bug produces *plausible stale views*, which is why the equivalence vector (recompute-and-compare sampling) must ship in the client, not only in CI. PLAUSIBLE (design), VERIFIED (ecosystem state).

### 4.2 WASM policy engines as the client resolver substrate?

Cedar runs client-side as WASM (Cedarling in-browser; deterministic, terminating, formally modeled in Lean; AWS shipped Cedar-based deterministic agent authorization GA 2026-03) ([cedarpolicy.com](https://cedar.ms/), [Cedar paper](https://dl.acm.org/doi/10.1145/3649835), [Janssen Cedarling docs](https://docs.jans.io/v1.1.5/admin/lock/cedarling/)); OPA compiles Rego to WASM with mature SDKs ([openpolicyagent.org/docs/wasm](https://www.openpolicyagent.org/docs/wasm)); Regorus embeds Rego in Rust/WASM. All VERIFIED.

**Verdict: REJECT as substrate, ADOPT as method.** Embedding Cedar/OPA as the lens evaluator would create precisely the "second policy language" the compiled-plan rule forbids ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md): the EVM projection is not a second policy language — neither may a WASM one be). What **is** worth copying is Cedar's assurance method for the EFS compiler/resolver conformance program: a small formally-specified core, an executable reference model, and **differential testing of every production implementation against the model** — this is the concrete shape for the "two independent compilers + golden vectors" Phase-1 obligation, and the cheapest known way to make "deterministic re-compilation across languages" real rather than aspirational. The EFS deterministic-CBOR profile + fixed-array wire grammar is *more* restrictive than Cedar's surface, which makes the method cheaper to apply here.
**Cost line:** method only — CI infrastructure + one reference model; no runtime cost.

---

## 5. Social/moderation state of the art, mid-2026

### 5.1 Bluesky stackable moderation — the measured lessons

**(VERIFIED —[arXiv 2408.12449 "Looking AT the Blue Skies of Bluesky"](https://arxiv.org/html/2408.12449v2) and follow-on ecosystem measurements):** 62 labeler accounts existed, **34 active**; community labelers quickly issued the majority of labels; labels cluster in *specific, low-controversy* categories (spam, impersonation) while contested classes (hate, misinformation) remain with the platform's own service; label issuance is heavily automated; **operator incentives to scale are unclear**.

Lens-relevant readings: (a) the consumer-side action-mapping architecture (labels are evidence; the subscriber maps to warn/hide) *worked* and nobody built a rival — EFS's ADVISORY split is validated in production; (b) **advisory-source supply is the scarce resource** — design-center advisory sets of 3–8 sources per rule (the D=3×8 shape in the gas model) match observed reality; hundreds of labelers per viewer is fiction; (c) unpaid labeler infrastructure decays — EFS should expect curator/advisory channels to need the same sustainability story as mirrors (a product concern to note in seam-12 starter/curator design, not a protocol change).
**Also shipped since the review (VERIFIED —[Bluesky blog 2025-04-21](https://bsky.social/about/blog/04-21-2025-verification)):** the **Trusted Verifiers** system — platform-issued checks *plus* delegated verifier organizations (NYT, WIRED) whose verifications the app surfaces, with role-distinct badges. This is a deployed, user-legible instance of **typed, role-scoped, delegated trust with a closed set** — the exact GATE-shape (closed trusted author sets, one delegation hop, no transitivity) and more evidence that ordinary users parse role-typed trust when the UI names the role.
**Bluesky 2026 "private state" work** (permissioned data, Sync 1.1/tap relay upgrades) is converging on EFS's public-by-default + client-side-sensitivity split from the opposite direction ([AT Protocol Spring 2026 roadmap](https://atproto.com/blog/2026-spring-roadmap)). Watch item for seam 12; no action.

### 5.2 Farcaster Snapchain — the CRDT retreat

**(VERIFIED —[snapchain repo/README](https://github.com/farcasterxyz/snapchain), [FIP discussion #207](https://github.com/farcasterxyz/protocol/discussions/207)):** Farcaster abandoned its unordered gossip-CRDT hub model because nodes **could not stay in sync** (missed messages, unbounded catch-up, state growing monotonically until only large operators could run hubs) and replaced it with **Snapchain**: a consensus-ordered, sharded, pruned chain (~200 GB snapshots, 2–4 h sync, 9–10k TPS claimed) with storage rent.

This is the strongest recent field evidence for two EFS choices: **ordered admission over read-time convergence** (their eventual-consistency read model failed operationally — EFS's home-ordered admission lane per [kel §8.2](../../Designs/efsv2/kel.md) is the design that survives), and **venue-committed snapshot sync as the bootstrap primitive** (their snapshot+delta model is the `.efs-bundle`/closure-manifest shape, G-F). Their storage-rent turn also re-confirms that append-forever-without-compaction breaks operators — the §7.1G current-live/compaction decision is not optional at century scale. Extract the evidence; import no mechanism (Snapchain is an app-specific chain with pruning — EFS explicitly refuses pruning bodies).

### 5.3 Nostr web-of-trust — the failure evidence for the thing we are not doing

**(VERIFIED —[Vertex](https://www.nobsbitcoin.com/vertex-web-of-trust-as-a-service/), [nostr-wot toolkit](https://github.com/nostr-wot/nostr-wot), WoT-a-thon Nov 2025–Apr 2026):** the live Nostr WoT stack is hop-distance and **personalized-PageRank scoring**, consumed mostly as a *hosted oracle* ("Web of Trust as a Service" — Vertex's own framing) or a browser extension querying a remote graph service. Three years of experiments have produced: no reproducible score (rank depends on crawl completeness and algorithm version), Sybil sensitivity acknowledged and unsolved, and centralization into scoring services — i.e., the **dynamic-reputation-becomes-an-indexer-oracle failure** the kill list predicts, observed in the wild. A six-month hackathon (ongoing at time of writing) is the ecosystem's own admission that no design has stuck.
**Verdict: the base-model exclusion stands with field evidence attached.** The future-safe hook remains exactly what the review specified and no more: web-of-trust products may **publish a resulting explicit policy** (a curator lens with evidence attached) that a user deliberately imports — scores never enter kernel semantics, and the discovery-only import class is the sole ingestion path. Watch for creep: any proposal that puts a *computed* principal set inside a compiled plan without a signed source revision is this failure returning.

### 5.4 Per-viewer "choose your algorithm" in production

**(VERIFIED —[TechCrunch on Graze](https://techcrunch.com/2025/04/16/bluesky-feed-builder-graze-raises-1m-rolls-out-ads/), [Threads public custom feeds](https://techcrunch.com/2025/02/04/challenging-bluesky-threads-now-allows-for-public-custom-feeds/)):** Bluesky's open feed marketplace is the largest deployment (Graze alone powers ~4,500 feeds from ~3,000 creators and monetizes via feed-level ads); Threads copied public custom feeds in Feb 2025. Lessons for seam 12: (a) feed *choice* is real but **defaults dominate** — plural starter policies matter more than the long tail; (b) monetized curation arrived immediately — the read-lens-spec's paid-inclusion disclosure rule ([read-lens-spec §4.5](../../Designs/efsv2/read-lens-spec.md)) was prescient and should survive the recut as a curator-manifest field; (c) feeds are *discovery-only* products — no deployed system lets a feed operator alter name authority, which is exactly the import-class firewall.

---

## 6. Trust-list portability and recovery precedents

### 6.1 FIDO Credential Exchange (CXP/CXF) — the industry's answer to "what survives device loss"

**(VERIFIED —[Corbado overview](https://www.corbado.com/blog/credential-exchange-protocol-cxp-credential-exchange-format-cxf), [FIDO spec](https://fidoalliance.org/specs/cx/cxp-v1.0-wd-20241003.html), [1Password](https://www.1password.community/blog/developer-blog/portability-without-compromise-1password-helps-author-a-new-standard-for-secure-/163208)):** CXF (the format) approved as a FIDO Proposed Standard Aug 2025; CXP (the transfer protocol, HPKE-encrypted end-to-end between providers) targeting standardization early 2026; **Apple shipped CXF-based transfer in iOS/macOS 26; Google Play Services supports CXP on Android 14+**. The design points: a structured, extensible, typed export format; provider-to-provider E2E encryption; **an explicit user ceremony per transfer** — the ecosystem deliberately rejected both plaintext CSV and silent background sync for cross-provider moves.

**Verdict: ADOPT the shape for lens recovery/portability.** The [review §11.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) recovery bundle (source manifests, pinned imports, petnames, compiled plan + acceptance floors, delegation records, horizons) should be specified as a **typed, versioned export format with an explicit ceremony** — CXF is the proof that this UX is now mainstream-acceptable, and its extensibility model (typed entries, unknown-type preservation) is worth copying so third-party lens tools can round-trip bundles they only partially understand. Cost: one Durable format spec; no protocol surface.

### 6.2 What actually survives device loss, by deployed system

| System | Mechanism | Survives device loss? | Failure mode to avoid |
|---|---|---|---|
| Provider passkey sync (Apple/Google) | provider-escrowed sync fabric | yes, routinely | provider compromise/lockout = total (why [kel §20](../../Designs/efsv2/kel.md) rejects a lone synced passkey) |
| FIDO CXP/CXF | explicit E2E provider-to-provider transfer | yes, with ceremony | none yet observed; young |
| **Nostr NIP-51 lists** | replaceable events on relays; private items NIP-44-encrypted inline | **poorly** — replaceable events are droppable/rollbackable by relay churn; no durable counter; lost key = lost private items | exactly the no-durable-counter failure D-13 fixed: two conflicting "latest" lists convict nobody |
| Bluesky preferences | server-side (PDS) prefs + full repo (CAR) export; moving to protocol-level permissioned data in 2026 | yes while the PDS cooperates; repo export is the escape | prefs are provider-readable (not E2E) — the privacy gap their private-state work now addresses |
| Browser bookmark sync | provider sync, optional passphrase | yes | crude LWW conflict handling silently duplicates/loses — no ceremony, no diff (PLAUSIBLE; operational common knowledge) |

(NIP-51/NIP-44 row VERIFIED against [NIP-51](https://github.com/nostr-protocol/nips/blob/master/51.md); Bluesky row VERIFIED against AT-proto docs/roadmap above.)

The synthesis for seam 8/12: EFS already has the two ingredients no deployed system combines — a **durable, contest-visible channel anchor** (the D-13 counter discipline + `CHANNEL_CONTESTED`) and **KEL-owned recovery** (no second guardian root, per the seam-8 ruling direction). Add the CXF-shaped export ceremony and the encrypted-recovery-bundle mode, and the lens channel is strictly stronger than every row above. No new machinery required; this section is confirmation plus one format spec.

---

## 7. Unsolicited findings

### 7.1 CRLite/Clubcards — compiled deny-sets shipped to every client (the strongest new idea in this pass)

**(VERIFIED —[Mozilla Hacks 2025-08](https://hacks.mozilla.org/2025/08/crlite-fast-private-and-comprehensive-certificate-revocation-checking-in-firefox/), [Clubcards paper](https://research.mozilla.org/files/2025/04/clubcards_for_the_webpki.pdf)):** Firefox 137 (Apr 2025) fully deployed CRLite: the **entire WebPKI revocation set** (~300 MB of CRLs) compressed to ~1–2 MB via a partitioned two-level Ribbon-filter cascade ("Clubcards") and pushed to every client, giving **fast, private, complete** local revocation checks with no per-query network traffic. The trick that makes exactness possible: the filter is built against a **known, enumerable universe** (CT-logged certificates), so false positives can be eliminated in a second cascade level.

**Why this matters to EFS:** the mandatory-indexing ruling gives EFS the same precondition CRLite exploits — *the universe (admitted claims/revocations at a basis) is enumerable on-chain*. So a **basis-stamped compiled filter bundle** ("which claimIds are revoked", "which targets carry advisisory label L from sources S₁…Sₙ", "which positions have P_v>0") can be built deterministically by anyone, shipped to clients at CRLite-like sizes, and used as a *sound accelerator*: a filter **miss** is exact (proven against the build universe at that basis), a filter **hit** falls back to one on-chain point read. This threads the review's own needle — §17.6 rejected Bloom filters because "false positives cannot prove absence"; the Clubcard construction removes the false-positive side against an enumerable universe, leaving only basis staleness, which the bundle's stamped basis makes an honest freshness fact rather than a lie. **ADAPT, RICH tier** (never a base requirement; the builder is replaceable and the artifact re-derivable from chain state — same epistemic class as a local cache, but *shareable*).
**How it breaks:** a filter consumer must treat the stamped basis as the read's freshness basis (never "current"); a malicious builder can only cause wasted fallback reads or stale views bounded by basis age, both detectable by spot recompute — put a sampling check in the client like §4.1's IVM equivalence vector.
**Cost line:** build infrastructure (a public job anyone can run) + ~1–5 MB per bundle per venue (PLAUSIBLE scaling from CRLite's 300 MB→1.3 MB on a much larger universe); zero protocol surface.

### 7.2 cargo-vet — a deployed compiled trust-list with non-transitive imports

**(VERIFIED —[cargo-vet docs](https://mozilla.github.io/cargo-vet/how-it-works.html), [importing audits](https://mozilla.github.io/cargo-vet/importing-audits.html)):** Mozilla/Google/others publish `audits.toml` files; a consumer lists trusted orgs in `config.toml` imports; **imports are deliberately non-transitive** ("you can't import someone else's imports — keeps trust relationships direct and easy to reason about"); a central `registry.toml` lists well-known audit sets; unaudited residue lives in an explicit `exemptions` ledger.

This is convergent evolution with the lens import model, in production for four years: `PINNED_REVISION`-style fetching from the org directly, `LEAF_ONLY` as the *only* mode (their non-transitivity = our default), a public registry as seam-12's curator directory, and — the piece EFS should copy — the **exemptions ledger**: an explicit, diffable list of "things my policy does not cover, acknowledged" instead of silent gaps. A lens compiler could emit the analogous artifact: scopes reachable in the mount that no authority rule covers, surfaced at the update ceremony. ADOPT (the exemptions-ledger idea; the rest is confirmation). Cost: compiler feature only.

### 7.3 tlog-tiles / static-CT / witness networks — upgrading the fourth absence source

**(VERIFIED —[C2SP tlog-tiles](https://github.com/C2SP/C2SP/blob/main/tlog-tiles.md), [transparency.dev on witness networks](https://blog.transparency.dev/can-i-get-a-witness-network), [Let's Encrypt RFC-6962 EOL](https://letsencrypt.org/2025/08/14/rfc-6962-logs-eol)):** the transparency ecosystem finished migrating to **static, tile-based logs** (checkpoint + Merkle tiles as dumb cacheable HTTP resources; Tessera GA; RFC-6962 logs end-of-lifed) and standardized **synchronous witness cosigning** (independent witnesses countersign each checkpoint after verifying append-only consistency).

Two adaptations: (a) the **signed closed-realm manifest** absence source (source 4) is exactly a checkpoint at signer-trust grade — witness cosigning is a shipped, spec'd way to *raise* that grade without a chain: k independent witnesses attesting append-only consistency of a realm's manifest chain turns "one signer's word" into "one signer + k watchers", a graded step the local-mode ladder (JR-8, provider-attested → witnessed) already names but had no wire precedent for. Adopt the C2SP checkpoint/cosignature format shape rather than inventing one. (b) The **tile layout** (static, immutable, CDN-cacheable chunks addressed by position) is the right publication shape for `.efs-bundle` closure manifests and the §7.1 CRLite-style filter bundles. ADAPT both; cost: format alignment only.

### 7.4 Smaller notes

- **OpenID AuthZEN 1.0 finalized** (OpenID Foundation vote closed Jan 2026 — [openid.net](https://openid.net/authorization-api-1-0-final-specification-approved/)): standardized PDP/PEP request/decision wire API. EFS refuses remote decision points, but the request-shape (subject/action/resource/context, decision+obligations) is a sane naming baseline for the GATE ABI's inputs. REJECT the trust model, skim the vocabulary. VERIFIED.
- **EAS-ecosystem stability** and **Story's legal-wrapper approach** (on-chain parameters bound to an off-chain legal template) jointly suggest a later, cheap EFS move: a curator-lens manifest field binding a *human-readable curation charter* hash — pure Durable surface, seam-12 material. PLAUSIBLE.
- **Gas-limit trajectory as venue evidence:** 45M→60M live, ~200M targeted, ENS retrenching to L1 — E1's cost premises need re-measuring *now* rather than assumed from 2024-era prices. VERIFIED inputs, routing note only.

---

## 8. The honest scale model at the 15–55 design center (arithmetic shown)

Baseline numbers are the review's ([§9.1–9.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), preserved harness in [../2026-07-11-efsv2-lens-review-corpus/](../2026-07-11-efsv2-lens-review-corpus/README.md)): cold `SLOAD` = 2,100 (EIP-2929); measured isolated-model rows for K=50/100. K=55 rows below are **linear interpolations of that model (PLAUSIBLE)** — the real-kernel benchmark (E2/G-D) remains the gate on any freeze claim. VERIFIED where marked as floor arithmetic.

**Floors (pure cold-read arithmetic, VERIFIED):**

```
point, K=55 direct:            55 × 2,100                    = 115,500 gas
page-64 × K=55 direct:         64 × 55 × 2,100               = 7,392,000
page-64 × (55 + 3×8 advisory): 64 × 79 × 2,100               = 10,617,600
page-128 × K=55 direct:        128 × 55 × 2,100              = 14,784,000
roster point, P_v=2:           (2 roster + ~2 slot + rank)   ≈ 8–12 slots ≈ 17–25k floor
```

**Measured-scale (interpolated from the 07-11 harness, PLAUSIBLE):**

| Operation @ 55 principals | Without roster/plan (naive two-phase) | With roster + compiled plan | vs EIP-7825 cap (16,777,216) |
|---|---:|---:|---|
| Point read (worst case, prove-absence-through-all-ranks) | 13,389,687/64 × 55/50 ≈ **230k** | sparse roster P_v=2: ≈ **21–23k** (K-insensitive: K=100 adds <1%) | both composable (1.4% / 0.14% of cap) |
| Directory page, 64 items | 13,389,687 × 55/50 ≈ **14.7M** | ≈ **1.35–1.5M** (roster) / ≈1.5M candidate-stream scan | naive: fits with ~12% headroom, *nothing left for the caller* → not honestly composable. Roster: ~8–9% of cap ✔ |
| Directory page, 128 items | ≈ **29.5M** | ≈ **2.7–3.0M** | naive: **impossible in any transaction, permanently** (7825). Roster: ✔ |
| Gate check, closed 5-set (the recommended GATE shape) | 5 × 2,100 = 10.5k floor → ≈ **30–50k** realistic | (same — no roster needed at this size) | trivially composable |
| Gate check, full 55-entry plan | — | plan via calldata: 55×34 B ≈ 1,870 B ≈ **30k** calldata + keccak ≈ 0.7k + 1 SLOAD commitment + point cost ≈ **55–85k**; plan pre-stored (§1.3 registry): ≈2.48M once, then ~110 SLOADs ≈ 231k cold / ~11k warm + point cost | composable either way |

Readings, each falsifiable:

1. **At the design center, the roster + compiled plan is a ~10× lever on points and pages** (230k→23k; 14.7M→1.4M) *when lifetime rosters are sparse* — and P_v is small precisely in the personal/team scopes the design center describes. The adversarial regression (roster inflation forcing direct-K) costs ~10× back, bounded at ~230k/point — priced, not fatal, at K=55.
2. **The K-axis is nearly flat under the roster; the P_v-axis is the real cost dimension.** From the harness: K 50→100 moves roster rows <4%. Scale honesty therefore reads: *entries 15→55 barely matter; a hot public position with a large lifetime roster is what breaks*, independent of lens size.
3. **What breaks past 55:** direct-probe worst case grows linearly (+~4.2k measured-scale per added principal per point). At the provisional 256 ceiling: point ≈ 1.07M (still composable); naive 64-item page ≈ 68M (impossible in a tx; strains even a 60M block as an `eth_call` on default caps); roster path unchanged. So the honest 256-principal promise is: **point gates yes; contract-native pages only via roster sparsity or supplied-and-verified views** — matching Level-3's boundary and hardening the case for retiring `MAX_LENSES=20` in favor of per-call budgets + compiled profiles rather than any fixed N.
4. **Advisory work is additive, not multiplicative** (the D=3×8 term adds 79/55 ≈ +44% to page floors) — with the observed labeler ecosystem (§5.1) capping realistic D, this stays inside the same envelope.
5. Comparison shopping across this table is what makes the §2 coprocessor verdict quantitative: proof verification (~250–500k) sits *between* the roster point (23k) and the naive page (14.7M) — the crossover is real but sits at page-scale contract consumption, not at point reads.

---

## 9. Consolidated adopt/adapt/reject ledger

| Technique | Verdict | Tier | Cost in one line |
|---|---|---|---|
| CCIP-Read lens adapter (basis in `extraData`, owner-pinned verify grade) | ADAPT | RICH/GATE optional | +1 HTTP RTT; 3–6k (sig) / 150–400k (proof) verify gas |
| Zodiac Roles v2 layout + governance-pinned-policy precedent | ADOPT (precedent) | CORE | free |
| Story-style plan registry (register-once, reference-by-ID) | ADAPT | CORE | ~2.5M gas per registered 55-entry plan; break-even ~50–80 uses |
| EAS resolver-hook (state-dependent admission) | REJECT (record) | — | — |
| Sign Protocol | REJECT as source | — | — |
| ZK coprocessor proven views | ADAPT, Phase-5 only | ENHANCED | opaque $ + 250–500k verify; 7 s–6 min latency; prover liveness |
| OpenVM prove-the-reference-resolver path | note for later | ENHANCED | free now; strengthens vectors-first sequencing |
| `eth_simulateV1` pinned-basis batch + state-override plan preview | ADAPT | RICH | free (RPC feature); RPC-trust-graded |
| Contiguous slot layout for roster/stream pages (BALs/locality) | ADOPT (design consideration) | CORE | free at design time |
| Client IVM (Zero/d2ts/DBSP method) + equivalence sampling vector | ADOPT (technique) | RICH | engine complexity; correctness vector mandatory |
| Cedar/OPA as evaluator | REJECT | — | second policy language |
| Cedar-style differential-conformance method | ADOPT | process | CI + reference model |
| Advisory design-center 3–8 sources (measured labeler reality) | ADOPT (sizing) | all | free |
| Ordered-admission + snapshot bootstrap (Snapchain evidence) | carry (evidence) | — | free |
| Web-of-trust scoring in kernel | REJECT (now with field evidence) | — | hook stays discovery-only imports |
| CXF-shaped lens export/recovery ceremony | ADOPT | Durable format | one format spec |
| CRLite/Clubcard basis-stamped filter bundles | ADAPT | RICH | builder job + ~1–5 MB/bundle; sampling check |
| cargo-vet exemptions-ledger (uncovered-scope diff) | ADOPT | compiler feature | small |
| tlog-tiles layout + witness cosigning for closed-realm manifests | ADAPT | local-mode ladder / bundles | format alignment |
| AuthZEN remote PDP | REJECT (skim vocabulary) | — | — |

## 10. What I could not verify

- **Coprocessor pricing in dollars** — Brevis/Lagrange publish no stable price list; every cost statement in §2 beyond latency benchmarks is PLAUSIBLE. The E-track should not accept any proof-backed-read proposal without a written quote.
- **On-chain verify gas for current STARK/Groth16 verifiers at 2026 code** (250–500k is a community ballpark, not a measured row) — needs one Foundry fixture if the Phase-5 shelf is ever opened.
- **K=55 interpolations** (§8) are linear scalings of the isolated 07-11 harness; the harness itself excludes writes, calldata intrinsics, deny/expiry logic. The real-kernel matrix (review §9.4, E2) remains owed and gates every freeze-grade cost claim here.
- **Clubcard bundle size for EFS-shaped universes** — the 1–5 MB figure scales Mozilla's ratio; EFS's universe shape (many small positions vs few large CRLs) may compress differently. Needs a prototype build over a seeded corpus.
- **Whether EIP-7825's cap will be raised alongside future block-gas increases** — discussed in scaling threads, no scheduled change found; the design should treat 2²⁴ as floor-stable but discover per-chain caps (EIP-8123 remains too young to require, unchanged from the review).
- Browser bookmark-sync conflict behavior (marked PLAUSIBLE in §6.2) — operational lore, not documented spec.

## 11. Routing

- §3.1/§3.2 rows → the pass synthesizer's honest-table refresh + E1/E2 evidence files.
- §3.4 → the D-2/P-5r2 rider note in [owner-decision-inbox](../../Designs/efsv2/owner-decision-inbox.md) (evidence update, no re-ask).
- §7.1/§7.3 → the `.efs-bundle` spec owner (G-F) and the local-mode ladder text.
- §4.2/§10 → the Phase-1 conformance program (two compilers, golden vectors, differential model).
- §8 → the costing pass (G-D) as the interpolation to replace with kernel-measured rows.
