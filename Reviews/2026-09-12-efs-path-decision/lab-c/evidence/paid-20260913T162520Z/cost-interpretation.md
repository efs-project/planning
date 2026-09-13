# B/C cost interpretation — 2026-09-13

Read-only, bounded interpretation for the gate ledger; not an architecture selection, renewed source audit, or independent packet verification. No build, chain execution, traces, tests, network or repository edits performed.

## Evidence and citation roots

`C` = `/Users/james/Code/EFS/planning-warroom-c-run/Reviews/2026-09-12-efs-path-decision/lab-c`, HEAD `58dd3d78e8efa8e4490b035bdde5502b75adc9e3`, Solidity pin `2ca7349`. `B` = `/Users/james/Code/EFS/planning-warroom-b-run/Reviews/2026-09-12-efs-path-decision/lab-b`, source `4b6154695c89976a7325cd0c51dc9591dee387c1`, evidence HEAD `ac37e91f880e9905713863a568b922a3b73130af`. Checked no source diff from these pins to observed HEADs; tracked files clean, existing untracked files preserved. References below are relative to these roots.

Use only the newly successful positive slice supplied by root: C `/tmp/efs-paid-c-run-20260913.YxKavf/measure.json`; B `/Users/james/Code/EFS/planning/Reviews/2026-09-12-efs-path-decision/b-gated-paid-results-20260913.md:27–45`. Earlier diagnostic rows are obsolete for this comparison.

| Operation | B gas | C gas | C/B, arithmetic |
|---|---:|---:|---:|
| A1 | 1,614,433 | 2,400,503 | 1.487 |
| A2 | 658,913 | 1,112,430 | 1.688 |
| B1 | 796,542 | 1,275,405 | 1.601 |
| Point A-first | 153,636 | 252,517 | 1.644 |
| Point B-first | 153,884 | 252,457 | 1.641 |
| List A-first | 246,606 | 391,043 | 1.586 |
| List B-first | 254,283 | 405,632 | 1.595 |

These are whole-transaction ratios for these implementations and this fixture, not marginal storage prices or savings against full v2. Common meanings are frozen by `/Users/james/Code/EFS/planning/Reviews/2026-09-12-efs-path-decision/sdk-fixture.md:410–466`: one A placement, competing content heads, joined Quote→Pair→Items, provenance and complete bounded listing.

## Biggest visible differences

- **Representation, not just substrate.** B packs admissions into metadata plus action-dependent words, shares position coordinates, and packs evidence (`B/src/Ledger.sol:95–102,851–895`). C retains a generic full action tuple and richer evidence in hand-written Store tables, reconstructing values through the generic public table-read ABI (`C/src/tables/LedgerTables.sol:101–185,190–255`). C stores framed refs/payload bodies and its consumer decodes and re-encodes those frames for canonicality; B consumes fixed typed bodies (`C/test/MeasurementConsumer.sol:399–437,727–730`; `B/src/JoinedConsumer.sol:531–549`). MUD does not require these particular EFS schemas or frame choices.
- **Different indexing work remains.** C indexes every action by author, fresh Record-reference backlinks, unique Records by Type, and occurrences; its scope entries retain author/name/binding-key triples. B's by-author/by-Type postings cover publish/reuse, while its backlinks concern binding targets and track live releases; its lists pack ordinals (`C/src/IndexModule.sol:110–132`; `C/src/tables/IndexTables.sol:26–88,91–121`; `B/src/IndexModule.sol:95–120,156–175`). Neither is simply doing a strict superset of the other. Matching this fixture's answers does not equalize every maintained obligation.
- **Paid checks/output are materially different.** C additionally checks full binding coordinates, explicit selected revision, native/non-import/source-grade and Realm/Core context; validates each closure Record's admission basis and canonical frame; and emits richer selection/placement observations. B checks the selected binding target, author/category/range and typed closure with a slimmer observation tuple (`C/test/MeasurementConsumer.sol:188–257,321–343,346–437`; `B/src/JoinedConsumer.sol:334–376,415–479,531–549`). This qualifies the ratios; it does not prove the extra work explains any particular amount of gas or excuse a missing common guarantee.

C is Store-only composition, not World: generic Store reads and internal Store writes, with EFS-owned semantics (`C/src/EfsStoreCore.sol:5–24,27–45`). A measured difference conflates schema, indexing, calldata, validation, output and generic infrastructure. No isolated control supports an inherent “MUD tax,” and neither positive slice prices full Files, portability, historical-change, browser or scale obligations.

## One plausible extra C challenge

**Carry already-resolved placement provenance through the list result.** C's Lens computes a Resolution containing admission and selected key, then drops those fields when constructing `Item`; the consumer later repeats `resolveAt` to recover them (`C/src/LensReader.sol:179–184,295–302`; `C/test/MeasurementConsumer.sol:514–535`). B's list result already supplies admission directly (`B/src/JoinedConsumer.sol:515–528`).

A disposable C variant could return that existing provenance and validate the same admission/evidence, basis, coordinates, selection and coverage without the second resolution. Keep the independent seal, paid outputs and negative checks intact; charge changed ABI/output work. This is a plausible list-cost counterexample, not a predicted saving or reversal. It justifies a tightly bounded extra challenge before provisional 23:10 UTC **if list affordability can change the decision**. It cannot resolve the write/point gap, authorize schema redesign, or justify delaying the provisional gate merely because optimization is imaginable. Root retains the decision.
