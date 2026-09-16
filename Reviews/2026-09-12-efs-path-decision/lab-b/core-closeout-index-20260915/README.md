# Generic index materialization — Task1 evidence

Disposable lab only. Base `dcb9b2fdcb6613e327b7b18fbc4e4eaaa6fa04ee`; no protocol promotion, production change, public deployment or owner-demo modification. Task2 replay/cutover is **not** implemented by this task.

## Maintained units and keys

Every posting key is `keccak256(abi.encode(keccak256("efs2/pk/1"), type, uint256(kind), uint256(ordinal), value))`.

| Family | type / kind / ordinal / value | Entry and live meaning |
| --- | --- | --- |
| by-Type | T /1 /0 /0 | Every authored PUBLISH/REUSE admission; live = not withdrawn |
| by-Principal | 0 /4 /0 /Principal | Same occurrence unit |
| by-Record | 0 /12 /0 /Record ID | Same occurrence unit; separate from Record occurrence counter |
| unique-by-Type | T /13 /0 /0 | Retained Record first admission once; audit live=count |
| checked ref | T /11 /leading ordinal /target | Retained source Record first admission once per exact role; audit |
| scalar | T /14 /spec ordinal /hash(kind,value) | `hash=keccak256(abi.encode(uint8(kind),bytes32(value)))`; retained Record, audit |
| content digest | **0** /15 /0 /hash(algorithm,digest) | Both hash inputs bytes32; cross-Type retained descriptor Records, audit |
| scope | 0 /10 /0 /scope | Distinct binding-coordinate ordinals, audit |
| history | 0 /8 /0 /binding key | Every head-change admission, audit |
| binding backlinks | 0 /5 /0 /target | Historical bind admissions; live = current heads pointing here |

Reference relationships and retained unique/scalar/digest entries survive occurrence withdrawal. Reuse and deduplicated publication add occurrences, not new retained relationships. Files/Quote validations and aliases remain, but their duplicate physical reference appends are removed. Generic and derived maintenance share the same internal memory-effect fold for later replay.

## Declaration and query scope

`manifestHeader()` exposes the bounded14-word header; `manifestCount()`/`manifestEntry()` enumerate required families. `manifestHash()` commits those semantics, exact immutable field-data hash, fixed work-model ID and Files/Quote interpretation. It excludes deployment time, mutable progress and generation. Signed index obligations also include module address/codehash. The explicit physical profile is inline singleton, not the previous two-slot fresh-list layout.

`IndexFieldProfile` is constructor-created, codehash-pinned and immutable: at most16 exact Types,4 full32-byte scalar words per Type (kind1 bytes32, kind2 uint256), and1 digest. Word offsets0..255 must fit entirely in the retained body. Digest algorithm must match the declared word exactly. No runtime field setter or optional-declaration shortcut creates required data.

Scalar lookup stays exact-Type/spec/kind. Digest lookup is a **single global algorithm+digest posting**, not a per-Type list plus mirror. Its COMPLETE status is restricted to the **finite descriptor-Type universe committed by this manifest**. It does not claim to include all possible present/future content Types. Source Type is recovered from each retained Record. Type-filtered results require filtering bounded candidate pages; there is no separate O(1) per-Type digest count. `scalarCoverage` and `digestCoverage` return UNKNOWN for undeclared spec/kind/algorithm; unregistered exact Types are UNKNOWN. `digestCoverage(0,algorithm)` qualifies global finite-profile discovery.

The Files profile indexes stored/ciphertext digest word5 and stored length word4, never plaintext fingerprint word10. Paid evidence follows global digest → retained descriptor → checked revision reference → Lens-selected revision/File and retained Name255 membership. A descriptor commitment does not verify fetched bytes, availability, or current File selection by itself.

## Paid measurements

All paid transactions have gasLimit15,000,000, normal code-size enforcement, managed loopback Anvil,256 retained history states/512 transaction blocks and a run-specific cache. No unlimited-size flags or storage/stack traces. `finite-paid.json.gz` contains70 complete receipts with raw signed inputs, status, code identities, source hashes, gas, and readback assertions. The packaging script independently checks receipt gas/status consistency. These are LOCAL_RPC observations, not public-chain state proofs. **The1,298,784-gas result is one profiled Record, not whole File creation or a whole tag.** The real Files journey uses separate transactions over an existing directory; no atomic whole-File or whole-tag cost claim is made.

| Case | Whole transaction gas | Outcome |
| --- | ---: | --- |
| Original350k allowance: cold8 refs without fields | 1,017,982 | success |
| Original350k: cold8 +1 scalar +digest | 1,133,618 | **reverted**, counts unchanged |
| Finite profile: cold8 +4 scalars +digest | 1,298,784 | success |
| Second shared-key insertion | 1,370,380 | success; deferred singleton word materialization |
| Third insertion | 1,150,418 | success |
| Fourth/fifth insertion | 1,133,318 | success |
| Sixth/new posting-word insertion | 1,372,718 | success |
| Same target at8 distinct roles | 1,202,063 | success; all roles independently checked |
| Guarded8-ref/full-field publication | 1,329,254 | success |
| Deduplicated republish / REUSE | 573,097 /562,442 | occurrences only |
| Withdraw original occurrence | 457,857 | retained families unchanged |
| Malformed digest algorithm | 1,135,389 | reverted; whole counts unchanged |
| Final cold8-ref/no-field case | 1,025,875 | success |
| Files encrypted descriptor | 958,224 | success |
| Files Name255 retention / native final bind | 881,829 /850,190 | success |

Standalone posting transactions (include intrinsic gas): first45,415; second50,535; third/fourth/fifth33,597; sixth50,697. First append writes only the header; second creates both packed ordinals. These are not callback-only costs or an irreducible gas floor.

Zero-ref/no-field seed costs rose from883,209 to891,137 for the first target (+7,928), and644,984 to652,873 for the second (+7,889). This is an observed end-to-end profile revision delta including finalized manifest/code changes, not a pure isolated quote-call measurement. No whole-body fetch is performed to quote work.

Comparability caveat: the original350k falsifier used the intermediate **per-Type** digest key and1 scalar. Final code uses one global key and4 scalars. Each cold digest layout has one fresh posting, but these are not identical-program A/B receipts. The old failure demonstrates insufficiency after singleton savings; final measurements establish the larger supported case directly.

## Finite allowance, not a venue increase

The fixed constructor-created PublicationSupport quotes:

`min(9,800,000, 200,000 + 150,000*actions + ΣPUBLISH/REUSE(30,000*checkedRefs + 35,000*declaredScalarOrDigest + 100*256))`.

Counts come from canonical Type metadata and the immutable profile; outputs/address representation are bounded, not arbitrary module gas requests. Cold8+4 scalars+digest is quoted790,600 index gas. Every prefix and the final static callback share that allowance, including dispatch accounting; unused allowance is not required as an outer-gas reserve. The maximum9.8M is the former64-action allowance maximum. Ordinary15M/hard16,777,216 limits, body8192/ref8/Names255 limits and publication/epoch/execution locks remain unchanged. **64 ×8 refs ×all fields is not established as a supported joint envelope.** Task2's largest historical-publication replay remains a falsifier.

## Deployment and size

| Component | Runtime bytes | Initcode including actual args | Paid deployment gas |
| --- | ---: | ---: | ---: |
| Ledger (includes creation of PublicationSupport) | 24,462 | 28,995 | 6,197,209 |
| ProfiledIndex (includes creation of field helper) | 13,781 | 22,186 | 4,173,905 |
| ProfiledFiles (same real Carrier/Directory/Names stack) | 21,639 | 35,225 | 6,362,741 |
| Same four-scalar/digest helper, separately deployed cost probe | 1,257 | 3,542 | 585,981 |

Embedded helper cost is already included in parent constructor receipts; do not add it again. `artifact-sizes.json` records compiler base initcode (without arguments), including IndexModule9,984 runtime, PublicationSupport3,582 runtime and selective/field variants. All are below24,576 runtime/49,152 initcode. Ledger has **114 bytes** of runtime headroom; Task2 must not assume room for a new kernel API.

## Verification and reproduction

Compiler: solc0.8.30, optimizer200, viaIR, Cancun; existing parent-provided output/cache paths. No installed dependencies.

- Initial RED: missing generic families and redundant singleton word,3 failures. Initial GREEN3/3.
- Manifest and field RED failures retained; subsequent materialization/real Files GREEN23/23.
- Selected covering pass:131 tests,130 passed and1 negative-fixture metadata-preemption failure. It was fixed by letting four callback-negative fixtures pass metadata so they still reach their intended callback attack, not by weakening any production gate.
- Amended acceptance/materialization/Files/work tests41/41 passed.
- Unknown exact-Type RED; global digest/qualified spec/header RED3 failures; final global/profile/Files/work suite28/28 passed. A subsequent test-only header assertion checks literal callback ABI selectors and passed1/1; no production source changed after the final paid run.
- Pre-existing compiler naming/mutability warnings and intentionally oversized Forge test-wrapper warnings remain. Paid deployments are ordinary real components; oversized test wrappers are never deployed by the runner.

Run `script/core-index-materialization.mjs finite` with existing `FOUNDRY_OUT`, `ANVIL_BIN`, and `EFS_ETHERS_PATH` variables. It closes only its owned disposable node. `script/retain-core-index-evidence.mjs` losslessly packs named logs, checks all retained receipt gas/status fields and code ceilings, and emits hashes. `evidence-manifest.json` identifies compressed/raw hashes and sizes. Exact test commands and detailed task report are in the local SDD report.

No broad historical tournament was run. Independent review and all detached replay/cutover work remain with the controller's next task.
