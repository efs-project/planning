# Required tag stance profile — Task1 evidence

Disposable experiment, not an owner-ratified production mechanism or an owner UI change. Starting source: `6cffa376b51f058053cecb7a5268d97083ec94d2`. The controller approved the narrowly necessary virtual seams with **fresh exact Types from genesis**; these results do not relabel the predecessor's Types, hashes, manifests or receipts.

## Implemented boundary

`test/TagStanceProfile.sol` adds the required `TagStanceIndex` and one fixed, separately predeployed `TagStanceValidator`. The latter is the complete read-only token/Concept/subject validation unit, extracted only after the inline candidate failed ordinary byte limits. Its Ledger/configuration and profile hash are constructor-pinned, its address/runtime hash are immutable in the index, and calls are bounded STATICCALLs. No delegatecall, admin replacement, public mutation, canonical storage move, new seen map or duplicate replay algorithm exists.

The existing described-Type codec retains a295-byte token descriptor (90-byte header +41-byte description +164-byte uint256 field). The structural Type admits any32-byte uint256 so the wrong-word4 control is genuine; the explicit stance profile selects exact Records for words1 ASSERT,2 DENY,3 SILENT. The1856-byte retained semantic profile includes descriptor/preimages, exact tokens, Concept Type/rule, Directory Type/rule, six finite revision Types/rules, intrinsic File offsets, fixed/variable widths, directed parent masks and the versioned silence/withdrawal policy. Variable inline widths are bounded by the inherited8192-byte manifest domain and their File offsets. The inherited semantic manifest also commits all Files descriptor configurations. Declaration author, token first publisher and stance author remain separate.

New domains:

```text
purpose = keccak256("efs.lab/tag-stance/1")
familyDomain = keccak256("efs.lab/tag-role-inventory/1")
key = keccak256(abi.encode(familyDomain, Principal, purpose, exactConcept))
value = existing bindingOrdinal
append iff BIND && freshBinding
```

The shared fold authenticates retained coordinates/author keys, validates the new purpose against its own admission-minus-one cutoff, invokes the complete inherited fold, then appends the inverse iff fresh. Inherited `LiveFilesIndex._validatePublication` is unchanged and remains the one terminal hook for live and replay. UNBIND validates its coordinate, dependencies and prior selected token, keeps the ordinary tombstone/history, and means semantic silence for this new purpose only. WITHDRAW does not erase a retained subject/token or retract a stance. Old TAG, ordinary removal masks and old readers are untouched.

Supported subjects are CREATE Files, exact validated Directories, and inline/stored/live roots and children. The child's intrinsic File must exist before the revision and match its strictly earlier parent under the exact directed matrix. There is no independently claimed File or arbitrary future-Type support. No live provider is called by this validator or inherited indexing/replay.

`fixture.mjs` is a standalone reusable Node fixture for the next task; it is not imported into the served browser graph. It installs the entire required Files/tag profile before admission1, retains the described declaration, tokens, shared Concept C and same-label C2, placed Files F/G, orphan H, Directory D and two revisions of F. It exposes exact configuration and key functions without adding stance readers/planners or changing removal UX.

## Fit, receipts and retained failures

| Candidate | Runtime bytes | Actual initcode bytes | Result |
|---|---:|---:|---|
| Inline coherent tag index |24,968|53,874|392 runtime /4,722 initcode over ordinary limits |
| Extracted tag index |21,723|45,843|ordinary deployment passed |
| Separate fixed stance validator |4,873|11,752|ordinary deployment passed |
| Existing final Files validator |5,417|7,297|ordinary deployment passed |

Limits remain24,576 runtime /49,152 initcode, Solc0.8.30 optimizer200 viaIR Cancun,15M transaction gas limit (hard16,777,216), normal30M blocks. No compiler or venue cap was raised. Inline creation code alone was52,562; its1312-byte constructor encoding produces53,874 actual initcode. Both failed inline source/artifact and extracted snapshots are retained. The early shape-only snapshot used a291-byte dummy descriptor; the actual descriptor is295, and both ABI-pad to320, so constructor-byte totals are identical. `final-snapshot.json.gz` uses the corrected shape length. These shape snapshots are not deployment receipts.

`paid-final.json.gz` contains96 signed local transactions:95 success,1 intentional wrong-token rejection;84,188,897 total gas including baseline graph, profile graph, fixture admissions and full detached replay. All are actual receipts under15M, not Forge gas estimates or a claim that this whole sequence fits one transaction.

| Paid operation | Gas |
|---|---:|
| Tag index deployment |8,049,934|
| Stance validator deployment |3,061,807|
| Existing final validator deployment |1,289,407|
| Fresh ASSERT |882,911|
| Second coordinate ASSERT |876,039|
| Revision / Directory stance |874,464 /875,839|
| DENY / SILENT / ASSERT again |715,363 /698,430 /686,611|
| New-purpose UNBIND |638,937|
| Checked replay cutover |195,951|

Index plus stance helper costs11,111,741 across separate deployment transactions; including the existing final validator12,401,148. Nested decoder/scope/field helpers are already included in the index receipt. The larger fixture total includes redundant baseline infrastructure and adversarial/replay work and is not minimal production setup. No universal gas or maximum64-action batch claim is made.

`paid-initial` deployed the same final Solidity and completed the stance transitions/wrong-token refusal, then stopped on a Node26/ethers decoded-Result proxy comparison. Comparing ordinary arrays fixed the runner; no Solidity relaxation was made. The failed packet/log remain. `validation-red.log` is an initial test syntax error, not behavioral RED. `audit-address-format.log`, `audit-late-runtime.log` and `audit-descriptor-length.log` retain offline-auditor setup corrections: checksum presentation, absent late runtime bytes, and the descriptor's actual295-byte length.

## Verification and provenance

- Behavioral RED against the predecessor: `profile-red.log` has1 control pass/2 intended failures (missing inverse; matching Type with wrong exact token). `validation-behavior-red.log` has3 controls pass/9 intended failures across validation, transitions and ordered positive-prefix consumption. The invalid future-Concept-plus-consumer control initially passed because the missing inverse made the later consumer reject; its final test explicitly requires `E_INDEX`, so later-rule rejection cannot pass that control. Initial behavior logs precede the inline source snapshot and are not relabelled as final-source results.
- `profile-inline-fit.log`:12/12 behavior tests pass, but ordinary runtime/initcode warnings fail fit.
- `profile-helper-green.log`:12/12 controls pass after extracting only the fixed validator.
- `replay-fit-green.log`:5/5 focused descriptor/helper/size/full-replay/historical-cutoff controls pass. Self-review subsequently corrected canonical PUBLISH bodyHash→Record and REUSE Record→Type decoding in the inherited-family comparison test; the final covering run below verifies the actual affected lists, not empty mistaken keys.
- `affected-covering.log`:88/88 pass,0 skipped. Breakdown: TagStanceProfile18, LiveFiles31, CoreIndexReplayFiles18, FilesDirectoryProfile12, FilesNames9. Includes Concept160, inline revision8192 and Name255 domains; complete inverse/history/backlink transitions; inherited final checks; every affected generic/reference/scalar/digest/scope list; coverage/manifest; detached replay and checked cutover. This is the single affected covering run, not a whole-prototype campaign.
- `audit.log` / `audit.json`:offline audit passes all96 signed transaction hashes, selected deployment inputs/constructor encodings/ordinary sizes,26 transitive source hashes, selected raw-runtime template bytes, exact token IDs and descriptor/profile commitments. Code hashes are deployment-specific physical pins, not self-certifying getters. `paid-final` contains selected index and both validator raw runtimes plus nested dependency code. The late replay index was independently template-checked by `env.deploy` and retains signed creation/receipt/observed codehash; its second raw runtime was not captured. The audit labels that limit rather than claiming to recheck missing bytes.

Commands, from `lab-b` with the assigned runtime paths and existing artifacts/cache:

```sh
forge test --match-path test/TagStanceProfile.t.sol -vv
forge test --match-path test/TagStanceProfile.t.sol --match-test 'test_tag_(ordinary|helper|exact_retained|full_supported|later)' -vv
forge test --match-contract '^(TagStanceProfileTest|LiveFilesTest|CoreIndexReplayFilesTest|FilesDirectoryProfileTest|FilesNamesTest)$' -vv
node core-closeout-tags-20260915/measure.mjs
node core-closeout-tags-20260915/audit.mjs
```

Final source/artifact snapshot: `final-snapshot.json.gz`. Final Solidity matches both paid runs; subsequent changes were test comparisons/max-domain coverage and evidence utilities only. Existing compiler warnings are preserved: Keys name shadowing, view suggestions and oversized Forge test harness initcode. The final deployable index/helper have no ordinary-size warning. Forge harness gas (including fixture deployments) is not a paid transaction quote.

Final profile hash:`0x76867b2c20cc4142c0173fa6b3adef0415a27cf9618b3ff6ce45997ae4f7c773`; semantic manifest:`0xd580f2b7a9edec73bafdaa266c24b86befce76c424f10b4a41e578776ec9bc5c`. Full exact source, constructor, runtime and Type pins are in the packets, not inferred from a current owner deployment.

## Limits and release

Fresh re-registration is explicit: three one-keyword virtual seams change compiler metadata and some rule/Type identities despite unchanged predecessor rule semantics. Old evidence remains untouched; no identity-preserving migration or old deployment compatibility is claimed. No reduction of the supported body/name/Lens domain was used to achieve fit. No all-author index, same-label merging, tag inference, truth policy, UI default or current/historical reader/planner is supplied by Task1.

Fault injection is limited to corrupt retained child bytes and a malformed coordinate; normal behavior uses public Core operations. The packet establishes a closed local exact-profile experiment, not a remote state proof or public deployment. The late replay raw-runtime omission is the only specifically disclosed packet audit gap; receipt/config/hash verification and behavioral replay/cutover checks passed.

All owned disposable chains were closed in `finally`; final PID19168/port49528 is absent. History256/cache512, no public writes, dependencies/install, owner restart, owner UI60608/RPC60599 changes or broad cleanup. Parent owns independent review, canonical main docs and pushes. Task1 stops here and releases source/build/bounded-chain ownership on handoff.
