# Compact EFS: a working browser and a measured build boundary

September 14, 2026 · v2 PM · disposable engineering evidence, not protocol adoption.

**Recommendation: keep compact B and its separate mandatory live-folder index
as the one implementation direction.** The next work is the short
[[compact-mvp-build-plan-20260914|MVP build plan]], not another architecture
tournament. MUD remains useful prior art and a comparison, not a second active
product. Nothing in this pass silently waives portability or other owner goals.

The compact contracts now back a clickable static Files screen. Names and
contents are recovered from actual contract state without a private filename
dictionary or `/api/files`. The earlier fuller-model browser remains separate
and untouched. This closes the cold integration gap in the
[[morning-handoff-20260914|morning handoff]].

## What actually works

- Create, read, edit, rename, move between explicit Files/Archive mounts,
  remove a placement, restore it, and restore historical bytes as a new child.
- Alice-first and Bob-first select different revisions of the same File.
  No-tiebreak HEAD review retains both candidates. Higher-author removal masks
  do not expose lower-author data accidentally.
- File tags and exact-revision tags remain distinct. Tag filters retain
  uncertain rows rather than equating missing evidence with no match.
- A fresh adapter and browser reload recover retained filenames/content. Local
  journal and witnessed revision IDs are recovery/navigation hints, not data authority.
- One unrelated application contract reads a selected revision, checks a
  particular reviewer's revision-specific approval, and publishes its own child
  plus HEAD. Its application state, Ledger and required indexes all roll back
  on refusal. Its output is native contract evidence, not an invented EOA signature.
- The floating meter reports recorded gas totals, the latest/recent actions,
  and editable Ethereum/OP/Base/Arbitrum execution-cost models. Unknown costs
  stay unknown. Browser reads report RPC work separately from transaction gas.

The screen's writes use real locally signed transactions and canonical EFS
effect read-back. It is not a production wallet test: the demo signs the intent
and outer transaction in software using conspicuously disposable test keys.
No one-popup, sponsorship or smart-account claim was earned by this pass.

## Measured costs, not test-function gas

Final named Files recipe, required live-positive index, actual local receipts:

| Action | Gas |
| --- | ---: |
| Create a new named File, 41-byte document | 1,626,233 |
| Edit, 41-byte document | 761,116 |
| Add File / selected-revision tag | 544,681 / 544,693 |
| Rename with a fresh retained Name | 818,464 |
| Move with an already retained Name | 694,115 |
| Remove / restore placement | 309,014 / 469,652 |
| Restore contents as a new child | 692,704 |
| Remove File tag | 307,051 |
| Entire third-party read + approval + child/HEAD publication | 1,045,085 |
| Paid checked File read, 1 / 8 / 32 / 64 authors | 195,102 / 370,160 / 970,925 / 1,773,115 |
| Named create, 0 / 1,024 / 4,096 / 8,160 document bytes | 1,407,955 / 2,091,034 / 4,308,006 / 7,224,442 |

Inputs, ordering, receipts, calldata byte counts, runtime hashes and provenance
are retained in [[compact-evidence-20260914/README|the evidence packet]]. Every
row fits this experiment's **30M Cancun block**. Runtime and initcode limits
were not raised. Do not substitute a Forge test function's gas for these rows.
This is one ordered workload, not cold independent minima for every operation.
Different timestamps/signature bytes cause small calldata-gas variation.

All measured contract deployment transactions, including the extra paid-read
wrapper, total **16,286,934 gas**, separately from file operations. Registry
registration/index activation are additional setup, not hidden file charges.
Largest runtime is Ledger at **17,333 bytes**; the live index is 9,387, live Lens
10,173, Files reader 15,865 and application 4,166. All are below 24,576 bytes.

At the retained September 14, 19:45 UTC snapshot, the 41-byte create models at
roughly **$0.394 Ethereum / $0.0041 OP / $0.0248 Base / $0.0834 Arbitrum** for
execution only. These multiply local gas by observed network gas prices and
ETH/USD; **L2 data/operator fees are excluded**, not assumed zero. They are not
all-in quotes or actual transactions on those networks. The UI labels the
snapshot and exclusions. Sources are retained per network; ETH/USD came from
[Coinbase spot](https://api.coinbase.com/v2/prices/ETH-USD/spot).

**Engineering interpretation:** useful durable shared records look plausible,
especially on L2s, but frequent state churn and large inline bodies remain
expensive. Do not base viability on future EVM upgrades. A swap/game-tick feed
should not duplicate every application update into a signed file revision.
The [[../../Reviews/2026-09-12-efs21-live-contract-files|live contract-backed file]]
direction is the appropriate separately qualified path to test for that use.
The new named recipe is not feature-identical to either the old 7.7M create or
the earlier 1.29M hashed-name fixture; their ratios are not matched savings.

## Churn: a concrete data-structure improvement

Five current placements after 128 renames of one file:

| Candidate source | Candidates scanned | Pages, budget 32 | Logical RPC requests, including fresh pin/name reads |
| --- | ---: | ---: | ---: |
| Retained audit inventory | 135 | 5 | 115 |
| New mandatory live-positive inventory | 5 | 1 | 79 |

The matched fresh named create costs **73,610 additional gas (+4.74%)** to
maintain live candidates. Both implementations retain audit/history. Removal
masks remain in Ledger heads and are applied to lower authors' candidates.
The new index changes physical enumeration, not File identity or author selection.

The same bounded churn traversal terminated at 1/8/32/64-author widths. Its
bound is live positive candidates across the supplied authors, **not just the
number ultimately visible**. Dense swap-removal is not a sorted listing or a
change feed. Continuations require the identical admission/block basis; late
attachment reports UNKNOWN coverage rather than a falsely empty folder.

**Still not a production read budget:** 79 requests and about 147 KB of
response data for this small cold traversal are too many. Repeated profile/code
checks and individual metadata reads dominate. A same-basis page reader and
carefully qualified browser cache are next, with 1,000-live-entry and selected
tag-filter acceptance tests. This pass did not run the earlier aspirational
10,000-lifetime or worldwide-scale workload. “All nsfw images” across an entire
Realm also needs its own explicit query domain/index; this UI filters a folder.

## Defects found and fixed

1. **Account execution changed apparent identity.** Installing an exact
   EIP-7702 delegation marker hid signed heads/masks and could misattribute
   withdrawal counts. Three reproductions failed first; shared principal
   classification now recognizes only the exact marker. Six controls cover
   marker replacement/removal and ordinary code. Delegated native calls remain
   native evidence. These are synthetic Cancun marker tests, not real Prague
   authorization transactions. See [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702).
2. **A later transaction in the same block made an earlier successful write
   appear unsuccessful.** Reconciliation now checks publication-final history,
   and reports supersession separately. Two real successful transactions in
   one block exercise this case.
3. **Source-placement drift was not preflight-checked.** Move/remove now retain
   their selected-source dependencies. Own-head CAS is onchain; cross-author
   checks are still preflight-only, an explicit production gate below.
4. **Missing conflict bytes discarded useful evidence.** Conflict candidates
   now retain their author/selection and UNKNOWN body qualification.
5. **Duplicate sends and UI recovery traps.** Same-instance submissions share
   one dispatch; a potentially broadcast plan is latched before the external
   call; opening a subsequent dialog resets its controls; failed tag writes do
   not relabel old filter results. Cross-tab exclusion is not proved by this Map.
6. **A wallet-returned hash was not enough to price an action.** Direct-plan
   receipt attribution now compares recipient/input/value and observed canonical
   block inclusion. Missing, mismatched or malformed receipts cannot become
   attributed cost or semantic success. Raw observations remain separate.

## Requirements ledger: no inherited green checkmarks

| Property | Standing in this compact pass |
| --- | --- |
| Exact typed immutable records and checked references | **DEMONSTRATED** by current contract fixtures and real Files integration. A File identity, typed revision, Name/placement, authored HEAD and batch evidence have distinct jobs; this is not seven separate content records per file. |
| Mandatory developer acceptance | **DEMONSTRATED** for exact pinned custom rules plus separate versioned Realm policy, including refusal/rollback controls. Arbitrary code remains resource bounded. Codehash alone does not freeze mutable storage or external dependencies; current validity is not eternal truth. |
| Type evolution / older readers | **LIMITED.** Root and child File Types compose through an explicit reader. Generic note-v1.x additive compatibility, generated projections and cross-language consumer conformance are not proved here. A version label alone never grants compatibility. |
| Signed portability | **LIMITED.** Current compact import/reconstruction fixtures pass, preserving source EOA assertions separately from destination permission. No fresh two-chain cold-browser export/import journey in this pass. |
| Native third-party contract utility | **DEMONSTRATED locally**, including paid read/decision/write and atomic failure. **UNSUPPORTED here:** independently proven historical native authorship on another chain. |
| Kernel/index separation and required discovery | **DEMONSTRATED** for required Names/parent/scope/history and new live FOLDER maintenance. Arbitrary late backfill/global discovery is not implied. |
| Multi-author selection, masks and history | **DEMONSTRATED** within the named profiles. Generic bindings may select unsupported application Types; readers refuse/qualify them instead of inventing valid Files. |
| Static independent browsing | **DEMONSTRATED over RPC** with retained names/content and no file API. No state proof, trustless RPC or archival availability guarantee. |
| Identity recovery and populated upgrades | **NOT READY.** Marker bug repaired; stable native principal identity, constructor-time classification, historical interpretation and explicit execution-set upgrade commitment still need the compact fixture. |
| Privacy, external carriers, contract-backed live values | **UNTESTED in this joined browser.** Existing designs/other labs do not substitute for encrypted/opaque and missing-carrier integration. |
| Complete everyday filesystem UX | **LIMITED.** Two mounts and basic file lifecycle work. Nested Directory/path semantics, portable tag labels, rich names/MIME, import/export UX and production wallets remain named implementation slices. |
| Practical economics and large queries | **LIMITED, now measured.** Basic rows fit; churn no longer forces lifetime-name scans. Large live/global queries, total L2 fees and high-frequency viability remain bounded followups. |

## Verification and handoff

- **217/217 Solidity executions across 18 suites**, including inherited controls;
  **41/41 Node tests**: 31 SDK, eight presentation, two real-chain integration.
- Actual browser walkthrough: cold guest selection/conflict; create, reload,
  edit, rename, move, remove, restore; read the restored edited bytes; expand
  cumulative cost drawer. Manual UI evidence is distinct from automated tests.
- Independent Astra Extra High review covered app/identity findings, SDK fixes
  and the live index; Astra High built the UI. Review-found issues were resolved
  with targeted controls. No Fable/Opus, new persistent Dev task or recurring run.
- Source: [compact checkpoint `67f92c5`](https://github.com/efs-project/planning/tree/67f92c5b000e63569eb0011a3688eb59ccb51893/Reviews/2026-09-12-efs-path-decision/lab-b).
  [Run instructions](https://github.com/efs-project/planning/blob/67f92c5b000e63569eb0011a3688eb59ccb51893/Reviews/2026-09-12-efs-path-decision/lab-b/browser/README.md).
  The existing prototype branch is retained; this report/evidence/build plan
  belong on planning/main, visible to Obsidian and the other harnesses.

**Bottom line:** this is a real compact browser and an appreciably stronger
engineering basis for one MVP, not a finished production foundation. The next
plan closes explicit identity/upgrade and atomic dependency guards, then builds
the directory/carrier/read/SDK slices around the demonstrated behavior.
