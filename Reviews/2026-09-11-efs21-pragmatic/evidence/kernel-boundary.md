# Native Record / mandatory inventory / Files boundary

Standing: fresh-genesis prototype evidence, not protocol adoption, migration, state-proof authentication or full-v2 parity. The actual extraction works, but it is not a general gas optimization: Files forwarding and graph qualification cost more.

## Exact basis

[Retained machine evidence](kernel-boundary.json), created **2026-09-12T05:47:17.808Z**, contains two finite worlds, **60 matched action receipts and 31 setup receipts per arm**, exact signed calldata/transactions/blocks, backend metadata, read observations, source/ABI/runtime/immutable provenance and cleanup. No traces, occupancy matrix or historical evidence overwrite.

- Candidate production and all current runner/SDK/test support: committed **`62651ca9d992d205528b88b8c732ee6d732a0aa7`** before the final retained run.
- Control constructor/dependencies: frozen **`7db38cd75292c86df6b6e4c2748fd78a26dd71b5`**, selected explicitly as `baseline-7db38cd`; full source-backed graph and forced historical artifacts are frozen, not just the facade. `provenance.sourceCommit` identifies the current runner; `provenance.kernelArtifact.sourceCommit` identifies each deployed arm.
- Control/candidate creation hashes: `0xa7d7e7bdad0aff17b182839f93c77cd5a1d04f21f695b41fa477e12b52e241f4` / `0xff2d77b004ce18b384d7d0969c57bda0e64e6e0da98c31832c74643a4a5649e9`.
- Solidity **0.8.30**, optimizer200, via-IR, Cancun; Node26.0.0, ethers6.15.0, Anvil1.7.1. Ordinary runtime24,576 / init49,152 / body4,096 / transaction-and-block16,777,216 limits. No raised cap.
- Actual CLI `--probe` completed before `--final`. The final runner refuses dirty source/support and an existing retained output; source was clean at entry. The documentation/evidence commit does not change measured source.

Historical dependency graphs were reconstructed once during this task from each artifact's exact Git sources, declared historical source delta and compiler settings, requiring its creation bytecode to match. Later normal `compile-graphs.mjs` runs reuse existing frozen graphs; they do **not** freshly recompile every historical profile. Current graph generation and retained profile/template checks are distinct from that one-time reconstruction.

## Boundary and invariants

`NativeRecordKernel` owns metadata/words, the exact registry and unchanged BodyWriter. Its only admission effect is author-neutral typed immutable bytes and a mandatory unique-by-Type inventory entry. It has no Files callback/import/namespace state. The separate `RecordInventoryIndex` accepts only its immutable kernel writer and returns an exact success marker. Every **new** Record must append or atomically revert. Dedup still validates first, but creates no new Record or inventory obligation; it does not acquire a new inventory/helper availability dependency. This is not full-C0 admission of a new Occurrence using existing bytes.

`NativeKernel` remains the native-caller Files authority and FileId domain. Original external tuples/selectors, exact Type/Record IDs, content, locations, revisions, CAS and successful Files behavior are preserved. It forwards immutable Record APIs and pins required core/Navigation code. Navigation owns only Files postings and forwards Record enumeration. Discovery code, configurable required/tolerated policy and DIRTY behavior are unchanged.

Deliberate differences: Record metadata roots move to0/1 in the Record account; helper owner/address and constructor graph change; Record cursor scope names the new inventory account; **RecordStored is emitted only by the Record kernel**, including forwarded admission. Matched logs normalize only that emitter; FileIds are exactly equal because this pair preserves facade/EOA deployment order. Direct-target calldata changes only where it explicitly names the separate Record account; all intrinsic-calldata gas deltas are zero in this pair. No old populated state/cursor migration is implied.

## Complete transaction costs

Values are receipt gas, **control → candidate (delta)**, not estimates or network fees. Tiny is raw`01`; dense-max is4,096 bytes`ef`; sparse-max is4,095 zero bytes then`01`. Edits replace only the final byte. The policy picks words/code/words respectively in both arms. Every row includes required indexing and all normal operation effects.

| Operation | Tiny | Dense-max | Sparse-max |
|---|---:|---:|---:|
| Direct new Record | 155,332 → 154,794 (−538) | 1,083,185 → 1,077,773 (−5,412) | 222,769 → 222,233 (−536) |
| Facade dedup | 37,057 → 40,614 (+3,557) | 106,921 → 111,279 (+4,358) | 57,781 → 62,139 (+4,358) |
| Contract producer dedup | 62,830 → 62,542 (−288) | 116,395 → 116,107 (−288) | 67,255 → 66,967 (−288) |
| Files create existing Record | 438,285 → 442,101 (+3,816) | 512,775 → 517,299 (+4,524) | 464,555 → 469,079 (+4,524) |
| Files fresh edit | 222,512 → 228,509 (+5,997) | 1,167,449 → 1,169,377 (+1,928) | 307,054 → 313,837 (+6,783) |
| Same-content edit | 121,042 → 124,784 (+3,742) | 190,913 → 195,437 (+4,524) | 141,773 → 146,297 (+4,524) |
| Paid direct read once | 78,956 → 78,653 (−303) | 85,430 → 85,127 (−303) | 396,952 → 396,649 (−303) |
| Paid facade read once | 78,956 → 83,421 (+4,465) | 85,430 → 92,498 (+7,068) | 396,952 → 404,020 (+7,068) |
| Paid direct read twice | 82,825 → 82,219 (−606) | 95,542 → 94,936 (−606) | 465,086 → 464,480 (−606) |
| Paid facade read twice | 82,825 → 89,255 (+6,430) | 95,542 → 107,178 (+11,636) | 465,086 → 476,722 (+11,636) |

Each paid read uses a separately deployed consumer and checks its stored digest/count. Consumer deployment is retained as setup, not included in the read row. Root **229,688→230,009**, directory **420,901→421,225**; each rename adds277 and each unlink adds239 gas. Reload independently checks original/edited bytes, dead status and all five retained revisions. The contract-owned quote workflow costs **581,532→587,604** first publication, **226,667→232,664** update, and **76,060→80,769** independent paid reader.

Main deployment, including every constructor-created dependency: **5,657,401→6,542,822 (+885,421)**. All31 setup receipts total **16,736,757→17,637,683 (+900,926)** across transactions; this includes12 paid-reader deployments and explicitly test-only fault drivers, not a minimal application deployment price. No individual transaction or block breaches the cap. Maximum retained action is1,169,377 gas.

| Deployed component | Control runtime bytes | Candidate runtime / init bytes |
|---|---:|---:|
| Files facade | 11,592 | 10,735 / 30,602 |
| Record kernel | — | 2,954 / 7,878 |
| Record inventory | — | 1,342 / 1,387 |
| Navigation | 5,117 | 5,432 / 5,610 |
| Discovery | 5,435 | 5,435 / 5,648 |
| BodyWriter | 464 | 464 / 502 |

Including unchanged2,702-byte registry, aggregate core graph runtime is **25,310→29,064 bytes** across separate accounts. A smaller facade is not a smaller total deployment. Validator/BodyWriter/Discovery source is unchanged; helper immutable owner changes as declared.

## Qualification is measured, not hidden

Both arms use the **current stronger SDK**, including the frozen control's own historical runtime templates, all immutable patches, links/writers and selected registry validator execution addresses/code. Templates come from trusted compiled source profiles, not caller-supplied hashes. Every check uses the selected block and closes with its block hash. Profile/graph identity is part of the observation. This is source-qualified RPC evidence, not a transitive cryptographic chain-state proof or authority for arbitrary extra targets.

| Six sampled observations | Control | Candidate |
|---|---:|---:|
| Qualification RPC calls / HTTP requests per observation | 24 / 24 | 33 / 33 |
| Qualification response bytes per observation | 84,008–84,038 | 90,610–90,649 |
| Qualification response bytes total | 504,158 | 543,806 |
| Subsequent paired direct+facade point reads per observation | 6 RPC / 6 HTTP | 6 RPC / 6 HTTP |
| Point-read response bytes total | 111,228 | 111,228 |

The old pre-extraction SDK checked the facade only. This stronger control reader is not that old SDK: these numbers do not measure the old-to-new client performance change, and not all qualification work is caused solely by added accounts. Point-read metrics include their normal basis checks; qualification is separately visible rather than charged to setup or omitted. No timing/caching optimization or lifetime paid-read assumption is claimed.

## Failure and verification evidence

Eight paired late refusals cover naturally selected code/words bodies × stale CAS, name conflict, missing mandatory inventory and late Discovery failure. The runner retains failed receipts and checks exact metadata/words, helper nonce/no leaked child code, File nonce/head/history, directory and inventory rollback. Corrupted graph targets first fail SDK preflight; a narrowly test-only local signer path reaches the actual contract refusal, then restores the graph before canonical read-back. It is not an SDK bypass option. Existing required/tolerated partial-write, child-OOG, outer-OOG and fresh-epoch recovery scenarios also retain their receipts and unchanged policy outcomes. Failed operations cost more in several cases; all exact costs remain in the JSON.

- TDD RED: original monolith failed the direct-boundary test with `missing generic Record boundary`; pre-integration SDK failed the missing-profile test with `Missing expected exception`.
- Final normal `forge test --summary`: **123 passed,0 failed/skipped**, including128 runs per existing fuzz function. Baseline117 + six new focused boundary tests =123. Initial131/134 was not loss of11 tests: the first boundary class inherited16 NativeTest methods plus one new test; it now derives directly from TestBase. No baseline test definition was removed. The three initial failures were one inherited historical corruption fixture repeated across three classes; the original frozen-control assertion was restored, while current fault assertions remain on the actual split path.
- Current malformed metadata/code/helper tests retarget the real Record storage owner; dense bodies select code naturally. Historical forced deployments remain explicitly frozen. No wholesale replacement of current fault tests by old monolithic deployments.
- Final `node --test --test-concurrency=1 test/*.test.mjs`: **37 passed,0 failed/cancelled/skipped**,105,739.0465ms, including real Chromium, historical replay and the new bounded pair. Baseline33 + two graph tests + two boundary-world tests =37.
- Touched-source formatter, normal sizes and `git diff --check` passed before source freeze. The SDD implementer used test-first and evidence-before-completion gates; independent review/root verification are separate gates, not claimed by these results.

Both retained finite nodes exited0 (**PIDs4767/4828**) and removed only their exact owned caches. Existing native HTTP54154/RPC54148 Anvil91971 and Fable HTTP60731/RPC60726 Anvil65638 were preserved without refresh or migration. No public funding/deployment, trace retention, broad cleanup or production-repository edits.

Missing full-v2 features remain missing: portable authorship/Principals, authored Occurrences and generic bindings, plural Lenses, arbitrary acceptance programs, full relational discovery, delegation/privacy, restore/multi-placement and upgrades. This is a useful native Record/Files separation, not unchanged full-v2 behavior at lower gas.
