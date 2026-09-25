# EFS v2 — living delivery checklist

**Status:** reference — execution tracker, not protocol adoption
**Owner:** v2 PM; the project owner decides scope changes, new environments and public release
**Last reconciled:** 2026-09-24
**Implementation instructions:** [[prototype-implementation-plan]]

#status/reference #kind/task #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2

## Start here

**Recommendation: finish the remaining narrow P2/P3 and seeded-demo checks, then begin the real upgradeable MVP once its environment is authorized.** The probes protect specific interfaces before they settle; they are not another full prototype rewrite. The September 24–25 results and limitations are in [[../../Reviews/2026-09-24-prototype-delivery/README|prototype delivery closeout]].

**Current position:** the September 17 local Files pass is complete. Ordinary curated Lists (P1), independent consumer/drive projection (P4), local two-device existing-author continuity (P5), and a fresh seeded demo after the historical-index repair (R1) have bounded positive evidence. P2 has strong location-tag/home/UTF-8 candidate evidence but no adopted public Unicode Name rule. P3 has one atomic five-operation save, a complete fresh-child 1,000-File/eight-author gallery traversal and a narrow onchain three-page cursor; long-lived-browser memory behavior and public-network economics remain open. Six real-build packages remain; none is completed by these probes.

**Next dispatch:** make a P2 public-Name/profile recommendation and carry P3's measured bounds into M1/M2; target-chain fees and browser/provider behavior belong in M5. If G0 is authorized, M1's clean-slate contract design can start immediately with P1/P4/P5/R1 evidence; do not freeze the affected P2/P3 interfaces first.

**For James:** no new foundational questionnaire is needed to prepare these probes. The useful next choice is whether to begin implementation in the temporary `contracts-v2`, `sdk-v2`, and `client-v2` repositories. Their names were selected September 21; creation and deployment are separate permissions. Nothing here spends funds or launches production work automatically.

## Three different finish lines

| Finish line | Meaning | Current state |
| --- | --- | --- |
| Local prototype | The bounded Files journeys have concrete local-chain evidence | Achieved September 17; additional questions are individually tracked below |
| Usable MVP | A stranger can use the supported workflows through an ordinary wallet/static client, with honest cost and recovery behavior | Not achieved; G0 + M1–M6 |
| Permanent foundation | Long-term capacities, authority, portability and release guarantees justify irreversible deployment | Not achieved; never implied by either line above |

November 2026 is the delivery target, not a reason to rename incomplete work as done. Proposed November scope is Files + shared gallery + Lists + basic public home + a contract consumer. Native-drive products and generalized cross-chain verification are separately tracked, not silently removed requirements. The project owner must approve any launch limitation.

## What is already earned — do not repeatedly rebuild it

These checks record **retained prototype evidence**, not fresh September 24 execution or production completion. Read [[../../Reviews/2026-09-12-efs-path-decision/prototype-finish-results-20260917|Files results]] and [[../../Reviews/2026-09-12-efs-path-decision/core-closeout-results-20260915|Core results]] for the exact boundaries.

- [x] E1 — Create/read/edit/rename/move, linked name versus independent copy, selected history/restore, placement release versus masking.
- [x] E2 — Alice/Bob ordered Lens fallback; ASSERT/DENY/SILENT; exact File/revision/Directory tag subjects and folder filtering.
- [x] E3 — Small inline bytes; registered Arweave/IPFS references; fingerprint-checked retrieval; unavailable/corrupt bytes not treated as missing files.
- [x] E4 — Built static SPA at a subpath, guest direct-RPC reads, no mandatory EFS application backend or development keys in the build.
- [x] E5 — Separate required indexes, admission/index atomicity, replay, bounded queries, live-folder inventory and churn experiments.
- [x] E6 — Described Types, mandatory custom acceptance, bounded evolution/interpretation and third-party contract read/write/live-value examples.
- [x] E7 — Bounded authorization, populated-upgrade and retained/source-off recovery experiments. These do not establish general proxy history or foreign finality.
- [x] E8 — Receipt gas and dated L1/Base/Arbitrum cost models, explicitly separate from real transactions on those networks.

**Baseline:** the September 17 Files baseline was prototype `44db8677f85232e72dd97ffaef4ffed91d905cc9`, branch `codex/efs-warroom-b-run`; planning input `54b2aa2de298a7c41fd0045757375b7e0586c410`. The September 24–25 probe commits and exact results are listed in the closeout report; do not mistake the historical baseline for current HEAD. Prototype code stays in its existing workspace. R1 controls the new runtime claim.

## Remaining work — this is the authoritative task list

Checkbox means the **entire stated outcome** is evidenced and reviewed. READY means dispatchable under the applicable authorization, not permission granted by a document. BRIEF means the packet must first be expanded against the selected code interface. WAIT means its dependency is named. The companion plan owns instructions; it must not maintain a competing status list.

- [ ] **G0 — Real-code environment authorized.** OWNER · depends on James. Close with explicit repository/work-environment permission; public deployment still separate.
- [x] **R1 — Fresh seeded browser after the required-index change.** A finite 50,000-gas increase in the required-index callback base (and new exact profile hash) restored the same first-observation witness. Fresh source-matched chain bootstrap, signed File/tag seed and canonical reconciliation, Vite static build, guest root read with four `COMPLETE` entries and live dev-server/RPC checks passed. The click-through uses a disposable local chain; normal-wallet interaction is still M4.
- [x] **P1 — Ordinary curated Lists and remaining v1 semantics fit the generic model.** Small whole-snapshot application profile with typed ordered references, stable entries, add/remove/reorder, bounded onchain reader, stale refusal and measured writes; the closeout includes the v1 behavior casebook and names unimplemented mirror/property/redirect/sort-profile differences. Advanced capacity, target-Type and append-only membership policies remain separate application profiles, not Core nouns.
- [ ] **P2 — Public naming/tag identities and home/profile seams are coherent.** PARTIAL · strict scalar UTF-8/255-byte candidate vectors, exact location-tag trace, historical-origin witness, typed Home/List pointer and finite authored-file query are demonstrated. The installed Files Name Type remains ASCII; decide/pin the public Unicode normalization and versioned Profile bytes in M3, with R1 passing after the index fix. Do not adopt a temporary Type ID as the public profile.
- [ ] **P3 — Shared-gallery reads and staged writes have a practical envelope.** PARTIAL · atomic fixed five-operation save and complete fresh-child 100/250/1,000-File eight-actual-author SDK traversals proved locally. The 1,000 run scanned all 1,001 candidates and returned 500 expected positive selected-revision rows under the 768 MiB combined-Node cap. A test-only onchain consumer stored its continuation and completed three budget-one paid advances across two authors, but refused intervening-admission drift; this is not robust live pagination. Price full supported recipes including chain data fees and measure long-lived-browser/public-RPC behavior before an SLA or cross-chain dollar claim.
- [x] **P4 — Independent consumer and drive projection preserve meaning.** Contract consumer and headless drive/save projection agree with SDK for scoped Files, qualified partial/absence, aliases, masks, unavailable/opaque bytes and stale writes. Actual native mounts and crash/fsync semantics stay F1, not hidden in this checkbox.
- [x] **P5 — Two device keys and existing-author continuity.** A scoped local Prague 7702 delegation continued one pre-existing EOA-authored File under unchanged Principal/Lens/history; revoke A and reject its stale write while B continues. Root recovery, historical child-proof portability and actual wallet prompts remain explicit M1/M2/F2 limits, not a claim here.
- [ ] **M1 — Deployable, upgradeable production contract foundation.** BRIEF / G0 · P1/P2/P5 findings and any contract-facing P3/P4 blocker before the affected ABI settles. Close with modules that fit, documented storage widths/build identity, populated upgrades and authorization/index rollback.
- [ ] **M2 — Reusable SDK, transaction lifecycle and exact-build recovery.** BRIEF / G0 · M1 interface checkpoint and P3/P5 outcomes. Close with static/browser and Solidity consumers, qualified reads, staged mixed-operation saves, device-key authorization, recovery without duplicate writes and versioned source-off export/import evidence.
- [ ] **M3 — Complete public Files/Lists/tag/home profiles.** WAIT · P1/P2 and M1/M2 interfaces. Close with public profile vectors, basic curated Lists, location tags, address/ENS home and scoped authored-file discovery.
- [ ] **M4 — Ordinary-wallet Files + durable-upload journey.** WAIT · M2/M3. Close with user-owned wallet, paid AR adapter with approved payment, external IPFS references, guest static read-back and upload-failure recovery.
- [ ] **M5 — Target-network performance and independent contract journey.** WAIT · M1–M4 and chosen testnet/public-data permission. Close with measured public-RPC behavior, actual testnet receipts, dated mainnet/L2 fee components and external app read/validate/write.
- [ ] **M6 — Integrated release rehearsal and owner walkthrough.** WAIT · M1–M5 and P1–P5. Close with the same release across contracts/SDK/static build, three users, two devices for one author, populated upgrade, cold recovery, explicit remaining limits and James's walkthrough.

P1–P5 may move into the real repositories as experiments once G0 is approved. They do not need two implementations. Record the new location once; do not migrate old lab evidence or code as incidental cleanup. M1 need not wait for every probe to finish, but must not freeze an interface a probe is still questioning.

## Requirement coverage — no goal disappears between packets

| Owner goal | Next accountable packet(s) | Important boundary |
| --- | --- | --- |
| v1-class Files operations, mirrors, metadata, redirects, curated Lists | P1, M3, M6 | A directory listing is not a curated List; content availability is not identity |
| Contracts validate, read, write and collaborate | P1, P3, P4, M1, M2, M5 | Contracts cannot fetch IPFS/AR bytes; narrow reads and live-backed values matter |
| Extensible Types, mandatory developer code, compatible evolution | M1, M2, M3 | Preserve exact Type/rule identity; acceptance is not an eternal judgment of live game state |
| Portable bytes, meaning and original attribution | M2, M6, F2 | Release adapters must support the actual build; import does not grant the importer the author's authority |
| Shared tags, Lenses, author discovery and personal homes | P2, P3, M3 | Explicit Lens/scope; identical display labels are not proof of identical concepts |
| Standalone static SPA, replaceable RPC/gateways, normal wallets | M2, M4, M5 | No Vite/backend truth; provider round-robin cannot fix an unbounded query |
| Identity continuity, recovery, delegation and upgrade safety | P5, M1, M2, M6, F2 | Historical authorship is separate from today's controller; ENS is a discovery layer |
| OS Drives and ordinary application saves | P4, F1 | Headless projection is not a mounted OS; stage saves, then publish |
| Private applications and long-lived app coordination | P2, M2, F2, F3 | Opaque data never becomes an empty directory; encryption cannot hide public metadata automatically |
| Performance and affordable operations | P3, M1, M5 | Include required indexes, setup and data/storage fees; never quietly lower the guarantees |

## Preserved follow-ons — not fake completion

| ID | Requirement / proposed sequence | Trigger and accountable role |
| --- | --- | --- |
| F1 | Actual read-only Linux/macOS/Windows mounts, then separately designed writable mounts | P4 + stable M2 API; native-filesystem PM/implementer. Existing three-host requirement remains; November inclusion needs explicit scope approval |
| F2 | Broader source-chain proof/finality, managed identity recovery and arbitrary historical account implementations | Exact failure/unsupported case from M1/M2/M6; v2 PM + contracts/SDK specialists. No universal portability label until earned |
| F3 | Private directory/mount/key lifecycle, revocation and metadata-leakage model | Minimum opaque/unavailable behavior in P4/M2; broader privacy before claiming private filesystem support |
| F4 | Arcade and rich discovery: global tag search, enhanced indexers, broad history/feeds | M6 or an explicitly chosen parallel product milestone; product PM. Optional indexers augment, never replace the basic read floor |

## Risks that can change the plan

| Risk | Current signal | Trigger / response |
| --- | --- | --- |
| Ledger growth | Last measured runtime 24,524 bytes, only 52 spare | M1 decomposes; no unlimited-size escape or app-specific kernel additions to force a pass |
| Index/query amplification | Eight actual placement authors at 1,000 Files gave a positive four-row paid page at 1.009M local gas. A test-only contract walked three one-candidate pages with its own cursor at 514k/288k/279k instrumented gas, but its fixed basis aborts on any intervening admission. Earlier 100/250 paid pages were zero-match negative controls, not positive-gallery costs | P3 names small paid-page envelopes and leaves active-Realm broad traversal unsupported; no zero-match cost substitution |
| Full-action economics | A recent small create was ~2.04M gas; tag recipes are much higher than a bare indexing floor | P3 compares like-for-like full actions and setup amortization, not a 50k component against a 1M complete action |
| Artifact/Type identity drift | Retained archive adapter pins an older wrapper build | M1/M2 isolate artifacts, version adapters and cold-recover the actual release |
| Application/contract read meanings | Exact placement tags and distinct mounted-reader UNKNOWN/NOT_ON_THIS_PAGE/ABSENT are demonstrated. Independent review caught a historical false-absence query; its first-observation witness raised callback work. The preserved witness and 50k-higher bounded callback now pass the full seeded browser | R1 is closed; M1/M2 must carry the versioned witness/profile, not silently reuse pre-repair IDs |
| Browser allocation at gallery size | A 250-File eight-author single fresh-child traversal used 320.4 MiB peak Node RSS; one-author then eight-author in one process reached 489.0 MiB and the earlier accumulated run 679 MiB. The first 1,000-File child stopped after 640/1,001 candidates; after decode-once and an index-profile update, a fresh child completed all 1,001 candidates at 281.2 MiB child / 451.1 MiB combined RSS | M2 chooses bounded streaming/cache policy and verifies a real browser; the two changed inputs prevent a single-variable causal claim. No public-RPC SLA follows from loopback |
| Device-key attribution | Two scoped keys continued one original EOA author locally through 7702; A revocation/expiry/cap negative cases passed | M1/M2 preserve the stable author seam and record payer/device evidence; F2 still owns root recovery and cross-chain smart-wallet authority |
| Loss of core requirements through scope control | Existing documents use “done” for different slices | This checklist names the slice, retained evidence and follow-on; only James may waive a requirement |
| Inference and local disk exhaustion | Prior Fable quota and Anvil-history incidents | One source/build/chain owner per workspace, bounded attempts, small retained evidence, no automatic Fable use |

## How we keep it current

Only the v2 PM/integrator changes this list during a run. Workers return task-ID evidence; they do not all edit the shared board. At each accepted result, update the item, source/result links, next dispatch, risks and this log in the same planning commit. Kanban and the README link here rather than duplicating counts.

A checked item needs exact source/build identity, a reproducible check, observed result, limitation and review. A passed old experiment stays checked as historical evidence even when a new release is pending; reopen the affected release task instead. Never mark a failed experiment green because its failure was documented: mark its investigation complete only if the item asks a question, and create/link the resulting implementation blocker.

Changes are welcome: add a new stable ID, dependency and reason; never renumber old IDs or erase a requirement to improve the completion rate. Before changing acceptance/scope, distinguish reversible engineering from an owner decision. After every two accepted work packets, report completed IDs, remaining critical path, one cost/utility finding and the next packet. Do not claim a percentage until comparable work units exist.

### Change log

- 2026-09-24 — v2 PM created the single delivery tracker from September 17 evidence, September 21 owner questions and September 24 planning request. Two Astra High read-only reviews distinguished contract readiness from workflow parity; a third reviewed the integrated plan and approved its sequence, with the P3/P4 interface-blocker clarification incorporated. No new implementation, measurements, running services or production authority are claimed. The current next step is P1, with G0 enabling real-code M1 in parallel.
- 2026-09-24 — James narrowed Lists to ordinary curated ordered references, confirmed staged multi-edit saves and a two-device/one-author wallet journey as concrete readiness probes, and requested completion in the disposable prototype before real repositories. P1 and P3 were narrowed; P5 was added. Historical two-chain original-author recovery remains earned evidence, with fresh destination authorization and other stated limits.
- 2026-09-24/25 — Local probe commits closed P1/P4/P5, advanced P2/P3, and caught a historical location-tag false absence plus a wrong-scope paid-gallery benchmark. A versioned 50k-higher callback allowance restored the repaired seeded browser, closing R1. A fresh-child 1,000-File full traversal passed after a decode-once SDK repair; a narrow paid contract cursor and the failed earlier allocation attempt remain as evidence. None adopts permanent bytes or starts real repositories.
