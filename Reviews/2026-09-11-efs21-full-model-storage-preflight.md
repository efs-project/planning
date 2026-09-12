# Full-model storage and index preflight

2026-09-11 overnight · source analysis, not measured savings or a protocol ruling.

Two independent expert readers inspected the reviewed full-C0 direct-apply/read-batch source at `8f101f1f94fe46a6ac90b6287443929427fa9b23`. Neither ran builds, tests or nodes. The controller checked the principal storage/application and envelope-read seams. This replaces the **journal-era extraction assumptions**, not the v2 design. Current work/results: [[2026-09-11-efs21-overnight]].

## Recommendation in plain English

Keep separating **what the system promises** from **how much storage it uses**. The seven Files facts need not become seven separately deployed storage objects, and an index's separate contract does not make its writes free.

After the reviewed native packing/hybrid and real Files read-batching tasks, alongside the separately staged generic-kernel boundary:

1. Measure storing the full model's unsigned publication envelope in immutable code, preserving exact bytes and logical reads.
2. Extend that comparison to one shared immutable byte block for an envelope and its new Record bodies. The [[2026-09-11-efs21-shared-slab-plan|staged slice/ordering plan]] now records the source-reviewed mechanism; it still requires the completed Envelope-only base before dispatch.
3. Extract full-C0 posting storage without dropping any query family, establishing a separate-contract control. Then measure coarser calls and configurable families separately.

These are follow-ons, not authority for silent feature removal or evidence that all three improve gas. The [[2026-09-11-efs21-envelope-storage-plan|first Envelope-only task]] passed its independent/root gate at`ed49a6c`, saving164,303gas on the paired full create. The native experiment has actual separate Record storage/mandatory inventory/Files/navigation/configurable discovery, but remains a narrower profile, not full-v2 parity.

### Why a new file currently has seven facts

A further independent reader and root checked exact`ed49a6c` SDK/router construction. These are **seven independently addressable facts**, not seven deployed contracts or seven newly deployed schemas. They are this Files profile's representation, not an inherent lower bound for a filesystem.

| Fact | What it represents | When reused or changed |
|---|---|---|
| ObjectGenesis | File identity independent of its name/content; publisher and meaning. | Once per new file; retained through edits/moves. |
| Charter BindingSet | Publisher's explicit maintenance witness, **not an ACL**. | Initial per-file state, independently changeable later. |
| ChunkTree | Shared content commitment and retrieval geometry. | Reusable across files/revisions; COPY already omits this new leaf. |
| FileRevision | Immutable file→content association, media metadata and parents. | Each content revision. |
| Head BindingSet | This principal's current revision choice, with CAS/history/Lens selection. | Each current-head change; not simply latest-timestamp-wins. |
| DirectoryEntry | Immutable parent/name→child placement description. | Each placement; separate from child identity. |
| Name BindingSet | This principal's current entry/whiteout choice, with CAS/history/Lens selection. | Each selected name change. |

[Exact SDK construction](https://github.com/efs-project/planning/blob/ed49a6c/Reviews/2026-09-09-files-browser-mvp/sdk/files-actions.mjs#L144) and [routed seven-leaf checks](https://github.com/efs-project/planning/blob/ed49a6c/Reviews/2026-09-09-files-browser-mvp/contracts/src/FilesRouterV2.sol#L412). Reusable setup includes Types, deployed modules, parent, principal claim and Lens/mount configuration. Existing Records deduplicate bytes, but a fresh authored occurrence still pays admission/lifecycle/posting costs; the three Bindings also retain separate current/history state. The5.74M receipt is the whole operation, not a measured per-fact allocation.

If byte-level work is insufficient, a higher-leverage next experiment is **compound Files state over the shared Record kernel**, keeping stable file identity, independently changeable heads/names, history and atomic CAS without necessarily giving every relationship a separate generic Record admission. This must explicitly preserve or replace independently referenceable facts, authored occurrences, charter maintenance, plural Lens selection and generic query obligations. The current native facade does not already do so: it uses caller ownership/per-file CAS, one placement and its own history/navigation. An implicit birth charter or compound state is a proposed semantic/profile change, not free lossless compression. No saving or owner choice is claimed for it yet.

### Compound Files: keep the relationships, test a different representation

A read-only expert pass against native `4cb0042` and full `ed49a6c`, followed by root source checks, recommends a **separately named Files profile**, not pretending that fewer rows are the same seven generic admissions:

| Candidate | Shape | Main tradeoff |
|---|---|---|
| Operation capsules | Shared typed content plus one validated compound operation Record; effects identified by operation and index. | Fewer repeated contexts, but a new codec, checked projections and reconstruction machinery. |
| Normalized Files tables — preferred experiment | Shared Record kernel stores content; Files stores immutable identity/revision/placement rows and per-source choice histories. | Simpler explicit relationships, but these domain rows are not full-C0 metadata Records or Occurrences. |

The smallest proposed slice has native account sources, regular files in fixed fixture directories, explicit charter/head/name choices, multiple placements, and atomic compare-and-swap of up to three distinct choices. Each source controls its own claims; it does not gain authority to edit another source's choice. A bounded tiered-agreement Lens reads the selected sources, including conflicts, masks and retractions. Mandatory navigation and optional discovery remain separate contracts; discovery indexes `(source,file)` choices rather than inventing one global head.

This would preserve stable identity and relationship history **within the new profile**, while replacing generic occurrence/predecessor references with Files operation references. Full-C0 metadata IDs/ABIs, generic query families, all Lens combiners, mounts, portable signed Principal authorization, upgrades and the existing export format are not automatically preserved. A new explicit export/profile is required. No implementation, new gas measurement, permanent encoding or owner adoption is claimed here.

#### Current Files should not scan all historical names

The expert's first append-only directory-wide candidate union repeated the known lifetime-name cost and allowed unselected authors to inflate work. Root challenged it. The refined proposal uses dense current inventories per `(source,parent)`, with swap-pop removal and source-local generations. A further root proposal removes **MASK-only** names from ordinary Files enumeration without deleting their keyed suppression state:

- The named query universe is names with at least one **VALUE** choice in the selected sources. Enumerate each name only from its earliest selected **VALUE** source, then resolve all selected sources, including MASK and retracted choices. An earlier mask is not an earlier emitter.
- A value masked by another source is still examined. A name whose file head is masked/missing remains a placed file with qualified content status; do not confuse name selection with content selection.
- Budget counts inspected candidates, not visible rows. Empty intermediate pages remain PARTIAL; completion requires the full same-basis continuation chain. The first slice can bound eight sources and 64 inspected candidates per page without declaring those permanent protocol limits.
- Pure masks remain available through exact-name/history or a separately named audit query. The profile requires one canonical mask meaning per name-position: if distinct mask-only conflicts must be enumerated, this Files query is not that audit.
- Use one pinned RPC block for all pages/hydration. Contracts check expected block number and operation state; the client authenticates the canonical header hash. `BLOCKHASH` cannot authenticate the EVM's own current block. Cross-transaction moving-current aggregation and cheap arbitrary-old-high-water directory enumeration are not promised.

The expert found no counterexample under those conditions. Root also ran an ephemeral independent truth-table check over **1,562,500** combinations: eight sources, five states (absent, retracted, canonical mask, two file targets), and four tier arrangements. Every visible value or mask/value conflict had a VALUE candidate; the earliest VALUE emitter was unique. This is a fixed-snapshot model check, **not Solidity, pagination, gas or general Lens evidence**.

Decisive contract falsifiers remain: add retracted-name churn, mask-only rename history and unselected-source spam while holding selected current VALUE names fixed; current candidate visits should not increase. Then add selected VALUE names, including suppressed ones, and report the genuine increase. Also test duplicate names across pages, mask/retraction fallback, multiple placements, concurrent rename, stale second guards, mandatory-index rollback and DIRTY optional discovery. Price whole create/edit/rename plus paid point/history/list/consumer reads; native and full-C0 reference costs remain different-guarantee comparisons until a matched authority/semantic control exists.

### Repricing is a separate stress model, not today's receipts

Root re-read the primary [EIP-8037 specification](https://eips.ethereum.org/EIPS/eip-8037#parameter-changes) and [EIP-8038 specification](https://eips.ethereum.org/EIPS/eip-8038#parameters) on September 12. Both pages remain in Review. Their current proposal uses 1,530 gas per state byte, 64 state bytes per fresh slot, 120 per new account; cold storage access remains 2,100, cold account access becomes 3,000, and changed-slot write surcharge becomes 10,000. This agrees with the retained September 10 research constants, not a newly measured deployed-chain schedule.

The important implication is that code storage is not a free escape from state pricing: both code bytes and new accounts are repriced. Shared byte blocks can amortize account creation, but dense/sparse/tiny bodies and paid reads still need separate comparisons. Under the current proposal a cold fresh-slot component is 2,100 + 10,000 + 64 × 1,530 = 110,020 gas; code deposit additionally needs account/access, hashing and surrounding work. These are arithmetic components, **not repriced EFS transaction totals**.

Do not compare a combined future total directly with today's single 16,777,216 cap and declare impossibility: the proposal separates state/execution accounting and applies that cap to execution. Conversely, fitting one dimension does not make the write cheap or establish block admissibility. Existing Cancun receipts are not replayed EIP-8037/8038 execution; no rollout date, L2 adoption, future gas price or 100-year pricing guarantee follows from this check.

## Shared immutable bytes: a concrete bounded opportunity

Current carriage limits selected bodies to **8,192 aggregate bytes**, while a canonical envelope is at most **2,304 bytes**. Thus the combined payload is at most **10,496 bytes**, or **10,497 runtime bytes** including STOP, within the existing 24,575-byte payload / 24,576-byte runtime ceilings. No segmentation, Type language reduction, changed RecordId, or changed envelope bytes is needed for this particular bound. The separate Type-cache/group-output problem remains unresolved.

The retained older-layout seven-record create census attributes 48 Record slots / 1,017,400 SSTORE gas and 17 Envelope slots / 311,800 SSTORE gas to those families. These are **not new direct-apply receipt totals**. The seven-leaf envelope is exactly 480 bytes, with 14 nonzero stored slots in that census. Replacing many fresh slots with one pointer plus CREATE/code deposit is a plausible saving; only paired complete receipts can price it.

### Smallest first arm: envelope only

Preserve the logical `EnvelopeRow(canonicalUnsignedEnvelope, envelopeOrdinal)` ABI while storing a physical cell. An address, uint16 offset, uint16 length and uint64 ordinal fit one word. Ordinal, not nonempty payload, remains the presence signal. For the envelope-only arm the offset can remain zero; do not add a general allocator yet.

The actual seams are `StateStore.read/applyRow`, `StateKernel` envelope existence/reference access, `StatePointReads` envelope metadata/word/slice reads, raw fixture accessors, and corruption tests. Every direct mapping access must use the new logical accessor; changing only `getEnvelope` is incomplete. Keep Record/Type storage and every posting family unchanged.

The pinned `PreparationHelper.deployCache(bytes)` already creates inert STOP-prefixed bytes from its **own account**, so its runtime can remain unchanged. However, `Preparation.deployCache` currently assumes an earlier `invoke()` verified helper identity. An envelope is written before the first leaf's preparation: a new early deployment must explicitly check the helper address/codehash first. Never copy that assumption blindly.

The helper factory is public; its nonce is not reserved. Use its returned pointer and inspect actual code. Body creation changes subsequent Type-cache child addresses, so retained source/runtime manifests and CREATE-order evidence must be regenerated rather than normalized away. Do not CREATE in the Core/proxy or deployment factory's context.

Compare seven-record create, edit, tag, partial admission under an existing envelope, all-ACTIVE retry, paid envelope/occurrence/receipt reads and a reached late failure. Preserve complete logical inventories, checked Record batches, Type caches and Lens outcomes. New physical-corruption tests must target actual cells/code rather than obsolete dynamic-bytes slots.

### Shared bodies follow separately

Initially keep physical Record cells at three metadata slots: TypeId, pointer/range metadata, and existing packed ordinals. Preserve the logical RecordRow ABI and RecordId-based dedup, including duplicate selections in the same publication. A fresh empty body is not an absent record; same bytes under different Types are not interchangeable.

Do not postpone all Record installation until the end. Later leaves consume earlier provisional rows; reference and withdrawal paths must retain their existing logical access and ordering. This does not relax the current self-envelope occurrence-reference rejection. A candidate can precreate inert bytes and retain ordered row installation, but must explicitly characterize changed allocation/late-failure timing. An all-ACTIVE retry should still validate and allocate nothing; an existing envelope with only existing selected Records needs no new slab.

Bound metadata before allocation and validate pointer, STOP prefix and range containment. `code.length == body.length + 1` is wrong for a shared slab. Decide how slab extent is represented/checked; do not pretend individual-object checks still apply. Retain late-failure rollback across rows, counts, authorization nonce, indexes, helper nonce and created bytecode.

Current full-C0 scalar `getRecord` validates metadata/bounds but does **not** rehash body/RecordId; Binding reads do. If the new backend adds universal content-hash verification, measure a slot-backed integrity control too. Comparing stronger code reads against weaker slot reads without qualification would misattribute cost. Dense, tiny, empty and zero-heavy cases must all remain in the experiment.

A smaller independent read optimization is metadata-only access for dedup/reference checks that currently ABI-copy complete bodies merely to inspect ordinal/TypeId. A subsequent source pass at `ab13d89` localized these to `StateKernel` Record dedup (264–266), Record/Object references (364–371), and Type dependency existence (400–403), which also copies a whole compiled cache to test one ordinal. Actual preparation, active Withdrawal parsing, public body reads and existing-group cache equality still need their bytes. This changes no retained storage; magnitude is unmeasured.

This now has a [[2026-09-12-efs21-metadata-only-admission-plan|reviewed three-site plan, implementing from ed49a6c]]. Keep the existing nonzero-cache/no-code refusal; Record metadata checks retain malformed-header rejection and add an explicit8192 bound before avoiding payload copies. That new fail-fast handling is not falsely attributed to the old implementation. Source review confirms all-ACTIVE retry bypasses the three sites, so it is a no-improvement control. No saving is claimed before actual complete-operation pairs.

## Packed liveness counter: source-viable, not yet implemented

An independent source pass at `ab13d89` found 128 unused bits beside the two uint64 Record ordinals. A physical RecordCell could keep the logical/public four-field RecordRow ABI while adding a uint64 live-occurrence count in bits128–191 of that same metadata word; bits192–255 stay reserved. No new storage slot is structurally required. Compiler layout, actual update cost and read/write accessors still need tests. Logical-row assignment must preserve counter bits, and a counter update must not rewrite the immutable body.

The smallest safe experiment retains family3 as an oracle: first maintain a shadow counter alongside its existing head, then let counter plus first-ever Record metadata drive family2 while asserting agreement after every transition. The existing first-admission ordinal distinguishes first creation from revival; zero liveness alone cannot. Apply updates once per new occurrence, not per new Record, including duplicate RecordIds in different selected leaves, partial envelopes and mixed add/withdraw carriages. All-ACTIVE retries write nothing. The valid ordinal/liveness ceiling is `2^48−2`, not uint64.max, and the direct arm must use staged admission high-water while persisted counts are still uncommitted. Zero underflow and false-zero corruption must refuse in the shadow arm; no wrapping/clamping or old-state zero-field assumption.

Removing family3 is a later, **differently qualified** arm. Current checked audit paging already supports only families8/10; family3 is nevertheless physically retained, raw-enumerable and required by the independent full-inventory reconstructor and selected future ordered by-Record query semantics. A current counter cannot provide historical liveness, ordered occurrence history or their continuation guarantees. Removal therefore changes raw inventories and the reconstruction/query profile, even though checked family3 paging was already UNSUPPORTED.

A replacement would need a bounded origin-contiguous admission scan at one pinned block/high-water, joining Envelope membership, Record identity and lifecycle to recover ordered occurrences/first anchor/liveness. It must return PARTIAL when coverage is incomplete and cannot silently use today's counter for an old-H answer. Preserve the old logical family3 reconstruction as oracle evidence while clearly labelling its physically absent storage. No counter-removal saving or design adoption is claimed yet.

### Exact-Type dictionary compression is a different physical option

A further source-only check found that full-C0 already has the local Type ordinal and reverse `typeIds` table needed to avoid repeating a full bytes32 TypeId in every physical Record. Keep global Type/Record identity and the logical four-field RecordRow ABI unchanged; decode the stored local ordinal through that exact dictionary. This is compression, **not making Type identity local**.

With a slot-backed body, two fixed words could hold its dynamic-bytes head and four uint64 fields: Record ordinal, first-admission ordinal, local Type ordinal, and optional live count (otherwise reserved). With shared code bytes, a pointer/range word plus that metadata word also uses two fixed words. These are source-level packing candidates, not compiler-confirmed layouts or cost results. The three-slot uncompressed shared-body control should remain a separate earlier experiment.

Ordering is plausible: MetaType's dictionary entry exists at initialization; a TypeGroup Record uses MetaType and installs its member entries before later selected leaves. Admission-internal lookup must use staged Type high-water, not persisted entry counts. A present Record requires a valid nonzero ordinal, dictionary entry and reverse Type-row association. Occurrence hydration should compare its admission Type ordinal to the Record cell ordinal, preserving an independent association check rather than comparing two copies of the same dictionary lookup.

The tradeoff is explicit: `typeIds` becomes a **physical decoding dependency**, not an optional enumeration mirror. A later mirror-removal proposal cannot simply delete it or replace bounded scalar decoding with an admission-history scan. Corrupted or aliased dictionary entries affect many Records; existing scalar reads do not universally rehash RecordIds, so bounds/reverse checks are not a new hash-integrity proof. Test alias/swapping/absent entries and price the cold/warm lookup and reverse-check paths. Some hydration paths already resolve the TypeId, so a net extra SLOAD on every read must not be assumed either. Native has no equivalent existing dictionary, and cannot inherit these cost assumptions.

## Separate full-C0 posting storage

### Additional dictionary option: one word per Admission

A separate source reviewer inspected pinned`ab13d89`, and root checked the actual admission construction: every fresh occurrence writes a two-slot AdmissionRow, including an occurrence of already-stored Record bytes. The packed word uses112 bits: leaf16, local Type48 and local Principal48. A local Envelope ordinal fits in the unused bits; the existing `envelopeIds` dictionary can reconstruct the unchanged logical envelopeId. This is a potential **one-slot-per-occurrence physical reduction**, not a measured gas saving or a new local identity scheme.

Actual consumers include `StateStore.read/applyRow`, three direct `StatePointReads` admission accesses, raw `admissionAt`, and admission-time Binding predecessor reads. Preserve the logical AdmissionRow and packed112-bit output. Validate staged Envelope high-water during admission, populated ordinal bounds and forward/reverse dictionary association; test aliases/swaps/absent rows, partial envelopes, duplicate Record leaves, retries and reached late rollback. Price occurrence/receipt/Binding hydration cold and warm. Admission/lifecycle, Batch authority evidence, all postings and all Files facts remain intact.

As with the Type dictionary, this makes `envelopeIds` a **physical decoding dependency**. It cannot then be deleted as a redundant mirror without another replacement design. This should be a separate paired experiment after the byte-storage baseline, not bundled with Record packing or index removal.

### A smaller deliberate query tradeoff

If physical reductions remain insufficient, `postingKeys` alone is a narrower first removal candidate than F3 plus several mirrors at once. Every first-seen key stores a full mirror slot; normal keyed reads/admission do not consume it, but the independent inventory reader does. A candidate would preserve keyed Files/Lens behavior while replacing immediate global enumeration—including old emptied key histories—with bounded, basis-qualified reconstruction. It must show that reconstruction and explicitly report incomplete coverage. No such removal or saving has been implemented.

A native-caller path through the fuller model is also useful for contract-owned publishers: its current U3 authorization uses ecrecover, so an ordinary producer contract cannot supply that signature. This is a capability experiment, not the leading explanation for the multimillion-gas floor: it would not eliminate Admission/lifecycle/posting or Batch rows. Detached intent/relaying/executor consent are different guarantees and must stay explicit. Keep this separate from the already working narrower native Files producer.

A further source-only carrier review found a concrete impersonation hazard: current U3 accepts arbitrary unclaimed Principal IDs. Simply hashing chain/Core/account for a new native call does not reserve that namespace; an attacker could preclaim the same ID and use the legacy signed path. A bounded **fresh-genesis experimental authority profile** should reserve a disjoint tagged Principal family and refuse it at both legacy claim and signed-execution entrypoints. Derive the native Principal from actual `msg.sender`, chain ID and Core proxy—not implementation, `tx.origin`, a forwarded sender or code-length ownership inference. Register through the checked native path only, retain separate transport/publication nonces and exact execution/deadline checks, and roll registration/nonce/admission back together. This is not an adopted Principal encoding.

The first full-model producer should call Core directly with canonical Files publications; existing FilesRouterV2 would correctly become the caller/author if used as an ordinary forwarder. Constructor and smart-account/proxy calls need explicit fixtures, as do preclaim/signed-path spoofing, stale execution, same-publication retry, wrong namespace and reached late rollback. Native evidence proves chain/Core-scoped account execution, not portable detached intent or that account's internal governance. Chain ID alone does not distinguish forks. Runtime-headroom work precedes this additional authority code. No native full-model implementation, cost saving or ordinary-contract Files parity is established by this proposal.

### Physical posting extraction remains separate

The first extraction should hold all posting heads, five-u48 packed words and posting-key mirrors in one callback-free, mandatory, Core-owned `PostingStore` account. Use ordinary CALL/STATICCALL and separate storage. Retain all ten families, key derivation, ordering, live counts, first-ever anchors, history and query/refusal behavior.

This is **physical storage separation**, not yet a pure generic ingestion kernel: `StateKernel` still interprets Bindings and derives mandatory indexes. Moving those responsibilities into a profile/index policy is another explicit change.

Current source seams:

- Redirect `StateStore.read/applyRow` only for `Posting`, `Word` and `PostingKey`.
- Keep `StateKernel.append/liveDelta` and ordered `get/put` initially; `StateStore.replay` and expected-before row journals no longer exist.
- Redirect direct posting head/word reads in `StateReadPrimitives` and raw upgradeable fixture getters.
- `StatePointReads` has no direct posting storage dependency; retain its occurrence/Record/Envelope/Type consistency checks in Core.
- Keep staged `Counts.postingKeys` in Core; move mirror contents, not its admission count semantics. Reserve obsolete mapping roots without claiming populated-state migration.
- Port actual-state corruption harnesses and inventory readers. Mutating abandoned Core mappings does not exercise the new Store.

### Deployment and authority are part of the experiment

The external runner can deploy `PostingStore(predictedCore)` after the fixture factory but before implementations. Preserve factory Core-nonce1/Carrier-nonce2 and proxy admin-nonce1 assumptions. Initialization verifies Store owner equals the Core proxy; implementations pin the same Store address/runtime, and upgrades to a different binding must refuse.

Keep the 21-word/672-byte execution-set shape. A Core-configuration domain wrapper can bind Store address/hash/owner while preserving Carrier configuration and execution-ID formulas; the resulting execution ID changes through the new configuration commitment. Update both independent configuration readers, actual constructor arguments, source manifests and runtime inventories. Old readers must refuse an unknown profile, not silently qualify it. Preserve the new checked/current Record APIs.

Fresh ordinary runtime/initcode size checks are an early gate. Retained direct-apply headroom is not evidence that the extraction fits. If it does not, stop for a narrowly scoped module-decomposition proposal rather than raising limits.

The Envelope candidate made this concrete: its first actual CoreU3 deployment refused at24852bytes. Reusing an already validated Envelope cell for the copy, without dropping checks, brought the rehearsal to24536bytes—only40bytes of headroom. A [[2026-09-12-efs21-initialization-outline-plan|separate initialization-outlining plan]] is now staged: move the one-time initializer into the already pinned admission library before adding another module or recurring raw-read call. Source preflight favors this narrower boundary, but no compiled size saving is established. Candidate generations must share the candidate library from genesis; the existing controller does not migrate library identity during populated upgrades.

### Failure, observers and cost

The direct arm applies rows before committing counts/bootstrap. An external raw Store getter could expose a provisional posting prefix during a callback; that is not a qualified COMPLETE query. A production-candidate Store should be fixed callback-free code. Core-only mutation alone is not a general reentrancy proof.

Require reached-stage tests: successful external mutation followed by later invalid reference/CAS/cache failure; later injected Store failure; wrong owner/code/hash; pair isolation; upgrade mismatch; and explicit test-only observer/reentry characterization. Both accounts, authority nonce, counters and created code must roll back. Preserve all-family snapshots, repeated keys, last-live crossing/revival, tombstones, audit paging and Binding/Lens checks.

A literal adapter adds roughly four Store calls per append (head read, word read, word write, head write), plus first-key mirror maintenance; a live delta adds two. `occurrencePostings` also reads its leading family-3 head before the loop, so four is not the complete occurrence-maintenance count. This is source operation counting, **not a gas estimate**. It may initially cost more. Coalescing/batching operations can then be measured separately against that control without hiding changed intra-admission visibility or failure order.

Optional configuration comes later: define query universe/basis, epochs, bounded backfill, concurrent withdrawal/rebind behavior, first-ever versus revival anchors, coverage and recovery. An undeclared or failed index is not an empty result. Required navigation must not become optional accidentally. Full-C0 family10 is first-Binding-admission anchors; native indexes and the separate index lab have different populations and cannot be substituted by name alone.

## Evidence/source map

- Full-C0 `StateStore.sol`, `StateKernel.sol`, `StateReadPrimitives.sol`, `StatePointReads.sol`, `StateBindingReads.sol`, `Preparation.sol` at `8f101f1`.
- Upgrade fixture `FixtureDeployment.sol`, `UpgradeableFixtureCore.sol`, `UpgradeStorage.sol`, `scripts/local-upgrade.mjs` at the same revision.
- Retained census: `Reviews/2026-09-09-files-browser-mvp/evidence/type-cache-2026-09-11/candidate/tables.md`.
- Native dense/zero counterexamples: [[2026-09-11-efs21-overnight#Narrowed followups after expert review]].

Unimplemented options here remain proposals, not measured savings or migration guarantees. Named completed experiments retain their linked source/evidence boundaries; neither those results nor this preflight adopts an EFS protocol.
