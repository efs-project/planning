---
agent: bs-bytecode-budget-v1
date: 2026-05-26
status: raw
anchors:
  - area: contracts
  - brainstorm: 2026-05-26-bs-contract-decomposition-v1
---

# EIP-170 headroom analysis for current EFS contract set

The contract-decomposition brainstorm flagged EIP-170 (24,576-byte deployed bytecode limit) as a binding constraint, especially for Direction 3 (2-contract kernel + gateway). This brainstorm grounds that claim in measured numbers from the current `custom-lists` build.

## Methodology

**Source of truth:** I read deployed bytecode hex from `/Users/james/Code/EFS/contracts/packages/hardhat/artifacts/contracts/<Name>.sol/<Name>.json`'s `deployedBytecode` field, divided by 2 to get bytes. These are real compiler outputs, not estimates.

**Compiler settings (from `hardhat.config.ts`):** Solidity 0.8.28, `optimizer.enabled: true`, `runs: 200`, `viaIR: true`. Settings are favorable — `viaIR` typically squeezes 5-15% off vs. the legacy pipeline. Running at `runs: 1` (size-optimized) would shave a bit more at the cost of runtime gas; `runs: 200` is a healthy default that doesn't lean either way.

**Not in this build:** `MirrorResolver.sol` (source exists, no artifact — apparently excluded from the active deploy set on `custom-lists`). `BlobResolver`, `FileResolver`, `PropertyResolver` compile from `ImportHelper.sol` shim and all measure identical (1,565 bytes) because they're empty `SchemaResolver` subclasses inheriting only EAS boilerplate. The `EdgeResolver` referenced by the decomposition brainstorm is named `TagResolver` on disk (5,576 bytes deployed).

**Caveat:** these numbers reflect the *current* code. Custom-lists work + PROPERTY validator + SORT_INFO additions are all still pre-freeze. Any direction that *grows* a contract grows from these baselines.

## Measured bytecode sizes vs. EIP-170 (24,576 bytes)

| Contract | Deployed bytes | % of 24,576 | Headroom (bytes) | Notes |
|---|---:|---:|---:|---|
| `EFSIndexer` | 14,912 | 60.7% | 9,664 | Largest deployed contract. EAS resolver + indices + qualifying-folder propagation + contains. |
| `EFSSortOverlay` | 9,602 | 39.1% | 14,974 | Per-parent linked-list overlay; lots of array mutation paths. |
| `EFSRouter` | 8,135 | 33.1% | 16,441 | `web3://` parsing + URI assembly + content-type sanitization. Heavy on inline string ops. |
| `EFSFileView` | 5,664 | 23.0% | 18,912 | Stateless view; modest size. |
| `TagResolver` (aka `EdgeResolver`) | 5,576 | 22.7% | 19,000 | PIN + TAG resolver, edge state, active-by-attester maps. |
| `Indexer` (legacy generic) | 4,314 | 17.6% | 20,262 | Generic EAS-relationship store; precursor to `EFSIndexer`. |
| `TopicResolver` | 2,664 | 10.8% | 21,912 | |
| `SchemaNameIndex` | 1,954 | 8.0% | 22,622 | |
| `YourContract` (scaffold) | 1,897 | 7.7% | 22,679 | Not for deploy. |
| `NameSort` | 1,592 | 6.5% | 22,984 | |
| `BlobResolver` / `FileResolver` / `PropertyResolver` | 1,565 | 6.4% | 23,011 | All identical — empty `SchemaResolver` subclasses. |
| `TimestampSort` | 1,236 | 5.0% | 23,340 | |
| `MockChunkedFile` | 244 | 1.0% | 24,332 | Test/mock. |

**Build also reports `MirrorResolver.sol` source (127 lines) but produces no artifact in this build.** Estimated 2-3 KB based on `TagResolver`'s 5,576 bytes for 401 lines, scaled by line count and the fact that MIRROR's URI scheme allowlist + ancestry check is simpler than EdgeResolver's two-cardinality maps. Marked **estimate** explicitly.

## Headroom analysis

**Total deployed bytes across the canonical set** (`EFSIndexer + EFSRouter + EFSFileView + EFSSortOverlay + TagResolver + ~MirrorResolver`):
`14,912 + 8,135 + 5,664 + 9,602 + 5,576 + ~2,500 ≈ 46,389 bytes` of deployed code across 6 contracts.

That's about **1.89×** the per-contract EIP-170 ceiling. There is no version of "fold these six into one contract" that fits without aggressive shrinking. Even folding two of them (kernel + edge resolver = `14,912 + 5,576 = 20,488` bytes) lands at **83.4% of the limit** — feasible today but with only ~4 KB of growth room.

The current largest contract (`EFSIndexer` at 14,912) has **9,664 bytes of headroom** — about 65% room to grow. That's healthy for incremental feature work but vanishes fast if you start merging.

## What's consuming most space (by-contract)

### `EFSIndexer` (14,912 bytes — largest)

Read of the source shows the byte budget is going to:

- **String revert reasons** — at least 9 `require(..., "EFSIndexer: ...")` calls. Each string literal lands in bytecode. The same migration to **custom errors** done in OZ 5.x typically shaves 200-500 bytes per contract; for EFSIndexer that's a meaningful **2-5% reduction** for free.
- **EAS resolver boilerplate** — inheriting `SchemaResolver` brings in `onAttest` / `onRevoke` dispatch + `attester()` / `payable` checks. Not removable without forking the SchemaResolver base.
- **Index maintenance loops** — multiple swap-and-pop array ops with bounds checks; each `idx < arr.length` require duplicates the same error string.
- **Qualifying-folder propagation + contains** — recursive parent-walk loops, depth-limited. These compile to nontrivial bytecode because of the parent-resolution staticcalls + array pushes.
- **No external library usage** beyond EAS imports and `EMPTY_UID`. There's an opportunity here.

### `EFSSortOverlay` (9,602 bytes)

- **24 require/revert sites** with string reasons — same custom-error opportunity, larger absolute payoff (estimated 0.5-1 KB).
- Linked-list operations (insert-after, remove, move-to-front) emit substantial branching code.

### `EFSRouter` (8,135 bytes)

- **32 functions** (counted by `grep "function "`) — many are small URL-parsing helpers (`_isHexChar`, `_sanitizeHeaderValue`, address parsing). Each function adds dispatcher overhead.
- **Many short string literals** — `"Not Found: ..."`, `"application/octet-stream"`, hex character ranges. These add up but aren't huge individually.
- This contract is the cleanest target for **library extraction** — pull URL parsing and content-type assembly into a `library URILib` that gets `using URILib for bytes;`-linked, reducing the deployed footprint of the router itself.

## Optimization levers (ranked by leverage)

1. **Custom errors instead of string requires** — Solidity 0.8.4+. Replacing `require(x, "EFSIndexer: not deployer")` with `if (!x) revert NotDeployer();` saves roughly 50-100 bytes per call site for short error names and *more* for long strings. Across `EFSIndexer` (9 sites), `EFSSortOverlay` (24 sites), and `TagResolver` (5 sites), conservative estimate **0.8-1.5 KB total savings** with zero behavior change. **Low risk, high leverage** — should be a default before freeze.
2. **`library` extraction with `using ... for`** — moves code out of the contract's deployed bytecode into a separately deployed library (linked at deploy time). For `EFSRouter`'s URI helpers and `EFSIndexer`'s recursive parent-walk, this can pull 1-3 KB off the host contract. Tradeoff: adds a deploy step + a `DELEGATECALL` (~700 gas) per library entry point. Direction 3's "merge everything into `EFSKernel`" survives only with aggressive library extraction (the brainstorm called this out explicitly).
3. **`viaIR` is already on** — no further win available there.
4. **`runs: 1`** — switching from 200 to 1 size-optimizes at runtime-gas cost. Typical 5-10% bytecode reduction. **Don't do this lightly** — it makes every external call more expensive forever, which matters when EFS is meant to be called 10× per file fetch.
5. **NatSpec is free** — Solidity discards comments + `@notice` from bytecode. The dense docstrings in EFSIndexer cost zero bytes. (Common misconception worth dispelling.)
6. **`immutable` for `DEPLOYER`** — already done in EFSIndexer (`address public immutable DEPLOYER`). Good. No further win.
7. **Remove unused stub contracts from build** — `BlobResolver`, `FileResolver`, `PropertyResolver`, `TopicResolver`, `YourContract` are all artifact-producing but apparently never deployed. They don't take per-contract bytecode budget away from anything, but they pollute the artifact set. Cosmetic.

## Implication for each contract-decomposition direction

### Direction 1: 3-contract (`EFSIndexer + EFSGraph + EFSData`)

**Verdict: tight but feasible.**

- `EFSIndexer` (kernel-only): roughly the legacy `Indexer.sol` (4,314) + the non-graph parts of current `EFSIndexer`. **Estimated 5-8 KB.** Safe.
- `EFSGraph` (PIN + TAG + SORT + qualifying-folders + contains): `TagResolver` (5,576) + `EFSSortOverlay` (9,602) + the graph-aware parts of current `EFSIndexer` (~4-6 KB worth). **Estimated 19-21 KB.** This is the warning zone — **77-85% of EIP-170**. Custom-list overlays (planned, not built) would push this over.
- `EFSData` (ANCHOR + DATA + MIRROR + PROPERTY + router + fileview): `EFSRouter` (8,135) + `EFSFileView` (5,664) + MirrorResolver (~2,500) + PROPERTY logic (~1-2 KB) + ANCHOR/DATA resolver (~3-5 KB). **Estimated 20-23 KB.** Also tight.

**Implication:** Direction 1 is workable today but `EFSGraph` and `EFSData` both have *less than 5 KB of growth room* before hitting EIP-170. Library extraction would be needed before adding custom-lists or any significant new schema. The decomposition brainstorm's own "Cost note" already flagged `EFSGraph` for size pressure — this analysis confirms it.

### Direction 2: 5-6 contract (status quo)

**Verdict: comfortable.** Largest contract is `EFSIndexer` at 60.7%. Every other contract is well under 50%. There's room for each to grow 30-60% before any EIP-170 conversation matters. **This is the safest direction for the budget axis.**

### Direction 3: 2-contract (`EFSKernel + EFSGateway`)

**Verdict: confirmed dead-on-arrival without aggressive library extraction.**

- `EFSKernel` = `EFSIndexer (14,912) + TagResolver (5,576) + MirrorResolver (~2,500) + EFSSortOverlay (9,602) + ANCHOR/DATA/PROPERTY logic (~3 KB)` ≈ **35,500 bytes**, *with* the assumption that all the resolver code combines without duplicating EAS boilerplate. That's **144% of EIP-170**.
- Even after deduping the inherited `SchemaResolver` machinery (one copy instead of four) you save maybe 2-3 KB. Net **32-33 KB** — still **130%+ over**.
- `EFSGateway` = `EFSRouter (8,135) + EFSFileView (5,664)` ≈ **13,800 bytes**. Fits with 44% headroom. Gateway is *fine*; kernel is the problem.

**For `EFSKernel` to fit, you would need to:**
1. Extract everything possible into linked libraries (`EdgeLib`, `MirrorLib`, `IndexLib`, `PathLib` as the brainstorm proposed). Realistic savings: 8-12 KB.
2. Convert all string reverts to custom errors. Realistic savings: 1-2 KB.
3. Drop to `runs: 1`. Realistic savings: 1-2 KB.
4. Possibly fork `SchemaResolver` to remove unused branches. Risky.

That's a best-case 12-16 KB reduction, getting `EFSKernel` to roughly **19-22 KB**. Possibly under the line. **No growth room** for future schemas or features. Every future change is a bytecode budget audit.

**Direction 3's EIP-170 concern is verified.** The decomposition brainstorm's curator note ("Direction 3 collides head-on with the bytecode-size ceiling") is correct. To make it work you'd need to commit *the entire team* to "every PR runs a size check and budgets bytes." That's a real ongoing cost.

### Direction 4: split by lifetime (`EFSPermanence + EFSMutable + EFSRouter + EFSSortOverlay`)

**Verdict: feasible, with `EFSMutable` as the contract to watch.**

- `EFSPermanence` (ANCHOR + DATA, append-only): **estimated 6-9 KB**. Comfortable.
- `EFSMutable` (MIRROR + PROPERTY + PIN + TAG + SORT + revocation + edge state + qualifying folders): TagResolver (5,576) + MirrorResolver (~2,500) + SortOverlay parts (9,602) + revocation indices (~3 KB) ≈ **20-22 KB**. **Tight** — 81-90%.
- `EFSRouter` and `EFSSortOverlay` stay where they are: 8,135 and 9,602 bytes. Fine.

Note: the brainstorm has SORT_INFO in `EFSMutable`. If you keep `EFSSortOverlay` separate (as I read the brainstorm), `EFSMutable` drops to ~12-14 KB and is comfortable. Either way, **Direction 4 fits**.

### Direction 5: strict 3-layer (`EFSPaths + EFSContent + EFSRetrieval`) + sort + view

**Verdict: feasible.**

- `EFSPaths` (ANCHOR + qualifying-folder propagation): **estimated 5-7 KB**. Fine.
- `EFSContent` (DATA + PIN + TAG + PROPERTY + edge state + qualifying-folder *answers*): TagResolver (5,576) + DATA/PROPERTY (~3 KB) + indices (~3-4 KB) ≈ **12-13 KB**. Roughly half the limit. Fine.
- `EFSRetrieval` (MIRROR + router + SSTORE2 chunk reading): `EFSRouter` (8,135) + MirrorResolver (~2,500) + transport indices (~1-2 KB) ≈ **12-13 KB**. Fine.
- `EFSSortOverlay`, `EFSFileView` unchanged.

All Direction 5 contracts comfortably under 60% of EIP-170. **Most bytecode-comfortable direction after the status quo.**

## Mainnet vs. testnet vs. L2 limits

- **EIP-170 (24,576 bytes deployed)** is enforced identically on Ethereum mainnet, Sepolia, Holesky, and all canonical EVM testnets. No relaxation anywhere on L1.
- **EIP-3860 (init code limit, 49,152 bytes)** is also enforced on mainnet since Shanghai. Affects creation-bytecode (the `bytecode` field, larger than `deployedBytecode`). Current EFS contracts are all well under (largest is `EFSIndexer` init at 15,341).
- **L2s — partial divergence:**
  - **OP Stack chains (Optimism, Base):** match L1 — 24,576-byte limit enforced.
  - **Arbitrum:** historically allowed larger contracts (up to 24,576 deployed, but had different early limits). Currently matches L1 since Nitro.
  - **zkSync Era:** **different limit** — bytecode is measured in 32-byte words and capped at 2^16 words = **2,097,152 bytes**. Effectively unlimited for our purposes. If EFS targets zkSync, Direction 3 becomes viable there even if it doesn't fit on L1.
  - **Polygon zkEVM:** matches L1 (24,576).
  - **Scroll, Linea:** match L1.
- **Implication for EFS multi-chain story:** any direction that requires zkSync's larger limit to be viable is **not portable**. If the goal is "EFS deploys identically across L1 + major L2s," EIP-170 is the binding constraint and zkSync's headroom is irrelevant.

## Controversial human design choices

- **Solidity `runs: 200` is currently set.** This favors runtime gas over bytecode size. A reasonable default, but if a freeze-time decision is "we want maximum headroom for future schemas," dropping to `runs: 1` deserves a deliberate call. It's a one-line config change with cross-cutting impact.
- **`viaIR: true` is on.** This is *not* the default and was chosen at some point. It gives 5-15% bytecode savings but compiles slower. Worth re-affirming before freeze.
- **No linked libraries currently in use.** Every contract is self-contained. This is a deliberate simplicity choice (no library deployment ordering, no DELEGATECALL cost). The freeze conversation should re-litigate whether that's still the right call now that some contracts are 60% of the limit.
- **String revert messages everywhere.** Solidity has had custom errors since 0.8.4. Whether to migrate before freeze is a small but cross-cutting decision — it touches every test that asserts revert reasons.

## Unknown questions for future brainstorms

- **Would actually compiling all five decomposition directions end the speculation?** Each direction would take ~30-60 minutes of refactoring to produce a build-only (no tests) compile, after which actual numbers replace these estimates. For Directions 1 and 3 in particular — both flagged as tight — the difference between "fits with 2 KB headroom" and "20% over the limit" is decision-changing. Cost: a few hours of contracts-agent time. High ROI for a freeze decision.
- **What does `MirrorResolver` actually compile to?** It has source on disk but no artifact in this build. Need to know whether to estimate from `TagResolver` proportions or measure directly.
- **What does the planned PROPERTY validator cost?** Currently `PropertyResolver` is a 1,565-byte no-op shim. A real validator with reserved-key checks + content-type sanitization is probably 2-4 KB. This grows whichever contract hosts PROPERTY.
- **What does custom-lists cost?** The custom-lists overlay is mentioned in the decomposition brainstorm but not yet in code. If it lands as another EFSSortOverlay-sized contract (~10 KB), Direction 3 becomes even harder.
- **Does the EAS `SchemaResolver` base class have a slim variant?** Each resolver inherits the full base. Forking a minimal version (drop `payable`, drop `attester()`, drop unused dispatch branches) might save 1-2 KB per contract — worth knowing but risky.
- **For Direction 3 specifically: does the brainstorm's proposed `EdgeLib + MirrorLib + IndexLib + PathLib` decomposition actually save enough?** A prototype-compile would answer in a day. Without it, "Direction 3 with libraries fits" is unfalsified.

## Blockers / concerns

- **Direction 3 (2-contract kernel + gateway) is not viable in its naive form on any non-zkSync chain.** Best-case engineering effort to make it fit leaves zero growth room. Recommend: do not pursue Direction 3 unless the team explicitly opts into "every PR is bytecode-budgeted forever."
- **Direction 1 (`EFSGraph` and `EFSData`) and Direction 4 (`EFSMutable`) both have contracts landing in the 77-90% range with current functionality.** Either direction requires a pre-freeze answer to "what's our policy when a contract hits 90% of EIP-170?" Library extraction is the obvious answer but adds operational cost.
- **The bytecode budget alone does not pick a direction.** It rules out Direction 3 and adds friction to Directions 1 and 4. Directions 2 and 5 are comfortable. But "fits in the budget" is a necessary, not sufficient, criterion — the upgrade, blast-radius, and pedagogical-clarity tradeoffs from `bs-contract-decomposition-v1` still dominate the decision.
- **Custom errors migration is a free win not yet taken.** Worth flagging as a pre-freeze cleanup item independent of which direction wins.
- **Measurements assume `custom-lists` branch state and current optimizer settings.** Any change to optimizer settings or significant new functionality invalidates the estimates; this brainstorm should be re-run if either changes materially before freeze.
