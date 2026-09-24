# EFS v2 — living delivery checklist

**Status:** reference — execution tracker, not protocol adoption
**Owner:** v2 PM; the project owner decides scope changes, new environments and public release
**Last reconciled:** 2026-09-24
**Implementation instructions:** [[prototype-implementation-plan]]

#status/reference #kind/task #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2

## Start here

**Recommendation: begin the real upgradeable MVP once its environment is authorized.** Keep four bounded probes beside that build; do not make another complete prototype rewrite the admission ticket. The probes protect specific interfaces before they settle, not all coding before it starts.

**Current position:** the September 17 local Files pass is complete. Four targeted probe packets and six real-build packages below remain open, plus the environment-start permission. This is a count of outcomes, **not ten equally sized tasks or a percentage complete**. No implementation worker is assigned by this document.

**Next dispatch:** P1, the small curated-List discriminator. P3's read-only measurement preparation can run alongside it. If G0 is authorized, M1's clean-slate contract design can start immediately; its implementation and the probes coordinate interfaces through one integrator.

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

**Baseline:** prototype `44db8677f85232e72dd97ffaef4ffed91d905cc9`, branch `codex/efs-warroom-b-run`; planning input `54b2aa2de298a7c41fd0045757375b7e0586c410`. Both local/upstream refs matched on September 24 after planning fetch; only untracked task-message files were present. Prototype code stays in its existing workspace. Services were found stopped September 21; no new runtime claim is made here.

## Remaining work — this is the authoritative task list

Checkbox means the **entire stated outcome** is evidenced and reviewed. READY means dispatchable under the applicable authorization, not permission granted by a document. BRIEF means the packet must first be expanded against the selected code interface. WAIT means its dependency is named. The companion plan owns instructions; it must not maintain a competing status list.

- [ ] **G0 — Real-code environment authorized.** OWNER · depends on James. Close with explicit repository/work-environment permission; public deployment still separate.
- [ ] **P1 — Curated Lists and remaining v1 semantics fit the generic model.** READY · existing baseline. Close with typed collection, enforced membership rules, contract reads, measured writes and a v1 parity casebook.
- [ ] **P2 — Public naming/tag identities and home/profile seams are coherent.** READY · existing baseline. Close with normalization/identity vectors, location-versus-content tag trace, typed home/query design and a cost-sensitive validator probe.
- [ ] **P3 — Shared-gallery read/write economics have a practical envelope.** READY · existing baseline; repeat affected cases after P1/P2. Close with three-author journey, 1/8-author scale/churn measurements, bounded paid queries, full fee breakdown and declared limits.
- [ ] **P4 — Independent consumer and drive projection preserve meaning.** READY · existing baseline; selected P1/P2 interfaces for final trace. Close when contract consumer and headless drive/save projection agree with SDK; partial/unavailable data and stale updates remain honest.
- [ ] **M1 — Deployable, upgradeable production contract foundation.** BRIEF / G0 · P1/P2 findings and any contract-facing P3/P4 blocker before the affected ABI settles. Close with modules that fit, documented storage widths/build identity, populated upgrades and authorization/index rollback.
- [ ] **M2 — Reusable SDK, transaction lifecycle and exact-build recovery.** BRIEF / G0 · M1 interface checkpoint. Close with static/browser and Solidity consumers, typed qualification, recovery without duplicate writes and versioned source-off export/import evidence.
- [ ] **M3 — Complete public Files/Lists/tag/home profiles.** WAIT · P1/P2 and M1/M2 interfaces. Close with public profile vectors, enforced Lists, location tags, address/ENS home and scoped authored-file discovery.
- [ ] **M4 — Ordinary-wallet Files + durable-upload journey.** WAIT · M2/M3. Close with user-owned wallet, paid AR adapter with approved payment, external IPFS references, guest static read-back and upload-failure recovery.
- [ ] **M5 — Target-network performance and independent contract journey.** WAIT · M1–M4 and chosen testnet/public-data permission. Close with measured public-RPC behavior, actual testnet receipts, dated mainnet/L2 fee components and external app read/validate/write.
- [ ] **M6 — Integrated release rehearsal and owner walkthrough.** WAIT · M1–M5 and P1–P4. Close with the same release across contracts/SDK/static build, three users, populated upgrade, cold recovery, explicit remaining limits and James's walkthrough.

P1–P4 may move into the real repositories as experiments once G0 is approved. They do not need two implementations. Record the new location once; do not migrate old lab evidence or code as incidental cleanup. M1 need not wait for every probe to finish, but must not freeze an interface a probe is still questioning.

## Requirement coverage — no goal disappears between packets

| Owner goal | Next accountable packet(s) | Important boundary |
| --- | --- | --- |
| v1-class Files operations, mirrors, metadata, redirects, curated Lists | P1, M3, M6 | A directory listing is not a curated List; content availability is not identity |
| Contracts validate, read, write and collaborate | P1, P3, P4, M1, M2, M5 | Contracts cannot fetch IPFS/AR bytes; narrow reads and live-backed values matter |
| Extensible Types, mandatory developer code, compatible evolution | M1, M2, M3 | Preserve exact Type/rule identity; acceptance is not an eternal judgment of live game state |
| Portable bytes, meaning and original attribution | M2, M6, F2 | Release adapters must support the actual build; import does not grant the importer the author's authority |
| Shared tags, Lenses, author discovery and personal homes | P2, P3, M3 | Explicit Lens/scope; identical display labels are not proof of identical concepts |
| Standalone static SPA, replaceable RPC/gateways, normal wallets | M2, M4, M5 | No Vite/backend truth; provider round-robin cannot fix an unbounded query |
| Identity continuity, recovery, delegation and upgrade safety | M1, M2, M6, F2 | Historical authorship is separate from today's controller; ENS is a discovery layer |
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
| Index/query amplification | Wide Lens/join recipes remain costly | P3 names supported workload envelopes; failed ones become a concrete design/optimization question, not silently omitted rows |
| Full-action economics | A recent small create was ~2.04M gas; tag recipes are much higher than a bare indexing floor | P3 compares like-for-like full actions and setup amortization, not a 50k component against a 1M complete action |
| Artifact/Type identity drift | Retained archive adapter pins an older wrapper build | M1/M2 isolate artifacts, version adapters and cold-recover the actual release |
| Loss of core requirements through scope control | Existing documents use “done” for different slices | This checklist names the slice, retained evidence and follow-on; only James may waive a requirement |
| Inference and local disk exhaustion | Prior Fable quota and Anvil-history incidents | One source/build/chain owner per workspace, bounded attempts, small retained evidence, no automatic Fable use |

## How we keep it current

Only the v2 PM/integrator changes this list during a run. Workers return task-ID evidence; they do not all edit the shared board. At each accepted result, update the item, source/result links, next dispatch, risks and this log in the same planning commit. Kanban and the README link here rather than duplicating counts.

A checked item needs exact source/build identity, a reproducible check, observed result, limitation and review. A passed old experiment stays checked as historical evidence even when a new release is pending; reopen the affected release task instead. Never mark a failed experiment green because its failure was documented: mark its investigation complete only if the item asks a question, and create/link the resulting implementation blocker.

Changes are welcome: add a new stable ID, dependency and reason; never renumber old IDs or erase a requirement to improve the completion rate. Before changing acceptance/scope, distinguish reversible engineering from an owner decision. After every two accepted work packets, report completed IDs, remaining critical path, one cost/utility finding and the next packet. Do not claim a percentage until comparable work units exist.

### Change log

- 2026-09-24 — v2 PM created the single delivery tracker from September 17 evidence, September 21 owner questions and September 24 planning request. Two Astra High read-only reviews distinguished contract readiness from workflow parity; a third reviewed the integrated plan and approved its sequence, with the P3/P4 interface-blocker clarification incorporated. No new implementation, measurements, running services or production authority are claimed. The current next step is P1, with G0 enabling real-code M1 in parallel.
