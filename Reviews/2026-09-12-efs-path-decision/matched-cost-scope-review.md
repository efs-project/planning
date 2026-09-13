# B versus C matched-cost/scope review

**Verdict:** the retained rows are valid local diagnostics, but not yet a same-guarantee B-versus-C comparison. A bounded rerun can make A1, A2, native B1, point and list genuinely useful without forcing identical internal representations or waiting for every wider finalist gate. No raw delta or ratio here isolates a “MUD tax,” portability premium or architecture result.

## Pins and evidence standing

- B source `df23bbbb792e4d0d50d73f420c341ae38090edb1`; retained run commit `59603363c25837477f5e95ae8bfc4d8a03db211c`. C runner `c825c619f72dfad3acd6f1f0584cf8d1845fa539`; retained run commit `324e7c4ea3cad0ed294b0cf143743313ba405dbd`. There are no source/script diffs across either source-to-retained pair.
- Citation roots: `Bsrc=df23bbbb792e4d0d50d73f420c341ae38090edb1:Reviews/2026-09-12-efs-path-decision/lab-b`; `Brun=59603363c25837477f5e95ae8bfc4d8a03db211c:` + the same path; `Csrc=c825c619f72dfad3acd6f1f0584cf8d1845fa539:Reviews/2026-09-12-efs-path-decision/lab-c`; `Crun=324e7c4ea3cad0ed294b0cf143743313ba405dbd:` + the same path; `P=planning/Reviews/2026-09-12-efs-path-decision/overhead-and-selection.md` at planning HEAD `bf884b8c9109e4cb5b8258c191a497528dc5dd5d` (that file was clean when read).
- Root's post-report full B packet review now reports limited **GO**: 173 raw transaction joins, 2,675 calls, 94 checks and 14 deployments. This upgrades packet consistency, not semantic independence: the evidence remains RPC-observed, candidate expectations/commitments are self-checks, and it is not authenticated state proof (`Brun/measurement-results-20260913.md:20-24,69-90`; packet `.caveats`, `.remainingGates`).
- C likewise has a limited packet GO after RPC/receipt/artifact joins, while its consumer and signer remain candidate-coupled (`Crun/measurement-results.md:56-64`).
- Governing rule: freeze one observable semantic fixture and expected results; different physical representations, including MUD packing, are allowed if each reconstructs the same promised meaning and prices reconstruction (`P:18-30`).

## What the current receipts actually cover

| Row | B | C | Present comparability |
|---|---|---|---|
| A1 | 5 actions: create Subject, typed Quote, HEAD, FOLDER, TAG; 1,608,502 | 5 analogous actions; 2,400,475 | Same high-level journey, but observable validation/output has not been frozen jointly. Directional only. |
| A2 | typed Quote + HEAD CAS rev 1; 654,289 | analogous two actions; 1,112,418 | Same high-level edit, with the same qualification. Directional only. |
| B1 | genuine contract author; typed Quote + HEAD; 791,814 | genuine Producer; typed Quote + HEAD + FOLDER; 1,653,816 | C pays an extra placement/admission/index effect. Not matched until the expected placement provenance/output is decided. |
| Point A/B | ordered two-author HEAD selection; 123,047 / 123,278 | ordered two-principal selection; 144,341 / 144,341 | Similar purpose, but different semantic validators. Directional only. |
| List | A-first complete FOLDER page, 101,953; separate tagged page, 112,471; no B-first paid row | A-first/B-first FOLDER page plus selected HEAD/Record/Evidence/frame validation, 238,579 each | Different paid work and returned commitments. Not matched. |

Receipt sources: `Brun/measurement-results-20260913.md:29-46`, packet `.cells["joined/steps-1-6"].rows`; `Crun/measurement-results.md:35-48`, packet `.operations[?cell=="typed-joined"]`.

### Representation and setup differences to preserve and report—not automatically eliminate

- B Quote is `abi.encode(pairId,mantissa,scale,observedAt,noteCommitment)`, 160 bytes; Pair is 96 bytes and Items 32 bytes. Its Record ID includes a record-domain tag; Types are symbolic registry IDs (`Bsrc/script/measure.mjs:83-139,816-844`; `Bsrc/src/Ledger.sol:438-478`).
- C Record body is `abi.encode(bytes32[] refs,bytes payload)`: Quote 288 bytes, Pair 192 bytes, Item 160 bytes despite a 3/4-byte payload. Its Record ID is `keccak256(abi.encode(typeId,bodyHash))`; Type IDs are content-derived Type Records (`Csrc/script/measure.mjs:47-52,290-317,357-372`; `Csrc/src/EfsTypes.sol:61-83,186-195`). C's supplemental 32-byte scalar is therefore a 160-byte frame, never B's bare 32-byte body (`Crun/measurement-results.md:50-52`).
- Action tuple bytes, ID formula, signature representation, table packing and nonce implementation may differ if the frozen external authorship/replay guarantee and reconstructed results are equivalent. Report their exact bytes and assumptions; do not equate equal-width values with equal encodings.
- Setup is not normalized: B used metadata defaults and reports 13,246,072 deployment gas, 733,987 attachment/registry setup and 905,829 Items+Pair; C disabled metadata and reports 27,814,466 deployment, 69,974 attachment and 3,575,130 Types/items/Pair. C includes ImportLib although these rows do not call it; B includes diagnostic/test consumers (`Brun/measurement-results-20260913.md:14-16,40,64-67`; `Crun/measurement-results.md:19-33`). Keep production prerequisites, unused wider-gate components and instrumentation separate.

## Outcome differences that block the small comparison

- **B1/list state:** B1 does not write B's FOLDER placement; C B1 does. This need not force identical actions. Freeze whether the promised list exposes placement provenance or only discovers the File and selects its HEAD. If the latter, both ordered Lenses can discover A's placement and still select B's HEAD; removing C's extra bind does **not** imply dropping B-first listing (`Bsrc/script/measure.mjs:862-883`; `Csrc/script/measure.mjs:357-380`).
- **Paid consumer contract:** B point traverses Quote -> Pair -> two Item Types and checks proof kind; B list only commits to a complete, unmixed placement page. C point checks canonical frame, caller-supplied Record/ref/payload expectations and Admission/Evidence author but not Pair -> Items or proof kind; C list additionally resolves/validates HEAD and Record at the list basis (`Bsrc/src/JoinedConsumer.sol:23-29,84-175,222-253`; `Csrc/test/MeasurementConsumer.sol:60-174`).
- **Required index/query meaning:** B indexes per-author scope lists, binding-target backlinks/live counts and by-Type/by-author admissions. C indexes a global scope triple, fresh Record-reference backlinks, unique Records by-Type and every action by-author. History, occurrence and old-basis behaviors also differ. These may be valid representations, but a cost row needs one frozen query/output/coverage contract (`Bsrc/src/IndexModule.sol:11-28,94-176`; `Csrc/src/IndexModule.sol:5-19,65-79,101-141`; `Csrc/src/tables/IndexTables.sol:91-298`; `Bsrc/src/LensReader.sol:134-229`; `Csrc/src/LensReader.sol:187-306`).

## Three priority corrections for one fair bounded rerun

1. **Freeze row outcomes, especially B1/list.** Specify A1/A2/B1 retained facts and the A-first/B-first point/list result, including whether placement author/provenance is observable. Then make each arm achieve those outcomes in its native representation. If placement provenance is not promised, use one A placement in both and let B-first select B's HEAD; if it is promised, both must retain and return B's placement.
2. **Use equivalent paid checks and an independent semantic oracle.** For both arms, point and list must reconstruct the same Quote/Pair/Items meaning and verify the same selected File/HEAD, author/proof category, basis and completeness/coverage. Candidate-specific adapters are acceptable, but neither adapter may define the expected answer. Emit/retain a common abstract result for independent comparison.
3. **Measure and disclose the physical delta.** Start each row from an equivalent logical state; retain receipts plus exact bodies/calldata, persistent row/byte/posting deltas and query hydration. Report each arm's compiler/metadata, required setup and amortization boundary rather than silently normalizing away the representation that the test is meant to compare. Repeat only A1, A2, B1, A/B point and A/B list plus matched failure checks needed to prove atomic acceptance/indexing.

These corrections make the small cost comparison useful. They do **not** close the wider finalist gate: cold printable names, independent signature/domain/profile reconstruction, export/import and source witness, populated rule/account/Core change with historical reads, browser/SDK/Files integration and larger/churn workloads remain separate selection work (`P:66-76`; `Brun/measurement-results-20260913.md:84-90`; `Crun/measurement-results.md:60-64`).

## MUD Store reuse versus EFS-owned maintenance (C)

- **Reused from pinned MUD Store 2.2.23 / `062bd8de...`:** `StoreRead`'s generic public table-read ABI; `StoreCore` initialization, internal-table registration, generic table registration/read/write/dynamic-field operations and Store events; ResourceId, FieldLayout, Schema, EncodedLengths, Bytes/Slice/tight codecs. C composes `StoreRead + StoreCore` and exposes no raw Store write/registration API (`Csrc/vendor/PIN.md:1-5`; `Csrc/vendor/@latticexyz/store/src/StoreRead.sol:11-16,44-74,110-139,177-209`; `Csrc/src/EfsStoreCore.sol:5-45`).
- **Still EFS-owned:** EFS table schemas/IDs and hand-written table libraries; action/ID/principal/signature rules; Ledger publication, replay, acceptance, CAS, import/evidence; mandatory index families/coverage/atomic dispatch; Lens selection/history/cursors; acceptors, adapters/consumers, deployment/linking, Store-version compatibility and migrations (`Csrc/src/tables/LedgerTables.sol:4-18,40-188`; `Csrc/src/ActionLib.sol:5-12,120-192,198-378`; `Csrc/src/IndexModule.sol:5-19,101-141`; `Csrc/src/LensReader.sol:5-19`).
- Not reused: World, world-modules, store-sync, protocol-parser or TS codegen; this probe is Store-only and its table libraries are hand-written (`Csrc/vendor/PIN.md:1-5`). This supports only a qualitative maintenance-boundary claim—no LOC ratio, engineering-hours estimate, or assertion about MUD's maintenance status.
