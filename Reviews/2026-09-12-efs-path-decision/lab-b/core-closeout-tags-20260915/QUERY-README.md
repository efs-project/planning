# Tags Task 2 — origin-qualified queries and explicit planners

Status: fix round 1 implements attributed diagnostics and repairs reusable raw-evidence joins; awaiting independent re-review. Disposable experiment; not production adoption, owner removal UX, or a new cross-chain proof profile. Task 1's [profile and evidence](README.md) remain unchanged at base `12efe4b52c9ebbb637407c02cb25b633d576fb65`.

## Fix round 1 — amended reader and verifier

Independent review identified two real gaps in the original implementation: priority reduction did not expose competing stance/HEAD attribution, and the reusable audit did not attach all native/query semantics to raw calldata and receipt events. This section supersedes any implication below that the original reader supplied attributed diagnostics or that the old audit alone proved those joins. Historical source/paid artifacts and failure logs are retained unchanged.

### Exact-coordinate diagnostics

`diagnose(principals,subject,concept,basis,includeHead)` returns the exact basis, subject, Concept, intrinsic File, ordered stance observations, optional ordered intrinsic-File HEAD observations, `complete`, `stanceDisagreement`, and `headDisagreement`. It validates the same fixed profile and 1–64 closed ordered Lens. There is no inventory scan or default UI change. Existing priority queries, cursor/consumer behavior and the old `diagnosticHead` switch are unchanged.

Each observation includes author, target, revision, admission and kind: 0 UNKNOWN, 1 proven untouched, 2 ASSERT, 3 DENY, 4 validated SILENT, 5 retained stance tombstone, 6 live HEAD, 7 HEAD tombstone. ASSERT and DENY both survive with attribution; SILENT, new-purpose tombstones and untouched coordinates are reported but are not stance votes. UNKNOWN is retained under its author, with `complete=false`; a false disagreement flag then does not certify agreement. Stance disagreement means qualified ASSERT and DENY are both observed. HEAD disagreement means differing live/tombstone states or targets among touched qualified HEADs; agreeing targets are retained without disagreement. This is an explicit diagnostic assessment, not an objective truth reducer. In contrast, the preserved legacy `diagnosticHead` query option still flags multiple touched HEADs as ambiguous regardless of equal target values.

The optional HEAD vector applies to a stable File or the intrinsic File of a supported revision; requesting it for a Directory refuses. `recordDiagnostic` emits the full encoded diagnostic in one actual paid transaction without mutating Ledger or reader state. It is an evidence probe, not publication or destination authority. The independent archive interpreter implements the diagnostic from raw admitted histories, not SDK labels or original index postings.

### Strengthened source-off gate

`query-audit.mjs` now expands supported native `publish`, `create`, `bind`, `unbind`, `execute` and `executeGuarded` calldata into exact actions/bodies; other native selectors fail closed. It compares those actions byte-for-byte to reconstructed admissions. It checks raw destination/receipt destination, status/gas, log transaction/block context, pinned Ledger emitters, Published author/proof/first/leaf count/publication ID, each Admitted author/scope/target/admission, and guarded ReadSetChecked/context/signature joins. This is still the existing direct-EOA/native and exact guarded-ECDSA fixture profile, not a new generic wallet or cross-chain verifier.

For every owned query call it joins exact constructor/query arguments, owner destination, ordered complete step list, session/budget calldata, receipt status, and pinned consumer Rows/Progress/Work events. It reconstructs prefix scanned totals, row/present/unknown counts, result commitment and completion from the paid events, checks their rows against the independent oracle, and checks observed-current admission against preceding Ledger publication events. Failed query calls must retain reverted receipts/no logs, match the supported out-of-domain budget refusal, and leave the successful prefix unchanged. The stale publication refusal joins its retained plan calldata and Ledger destination. Diagnostic calldata and pinned-reader events are separately checked against independently reconstructed attributed diagnostics.

Ten focused mutations demonstrated the original gaps before repair: native leaf plus evidence hash; Published emitter; publication receipt destination; consumer row; commitment; progress; completion; work; budget; and refused-step status. All ten were wrongly accepted by the old semantic audit, then rejected after repair while the original packet passed. Additional final controls reject a changed Published author and changed paid diagnostic. `query-fix1-audit-green-attempt.log` preserves an intermediate verifier error: an incorrect scope-domain literal rejected the valid baseline; it was corrected against unchanged `Keys.DOM_SCOPE`. No failed log was replaced by a green claim.

### Source/evidence compatibility map

| Packet | Source checked | Paid scope | Reuse boundary |
|---|---|---|---|
| `query-paid-final2.json.gz` | exact historical commit `1a49b74dbbc9f01506cab8f3c63db49a0000adce` | original 226 tx, 114 publications (111 native + 3 signed), 115 leaves, 11 query chains | old reader/Lens bytes and old wide-P64 prices only |
| `query-fix1-diagnostic.json.gz` | amended current source pins below | 70 successful tx, 23 native publications/leaves, four diagnostics, one P2 owned query | amended reader deployment and these finite P2 rows only |

The fresh verifier writes new `*-fix1-audit.json` outputs, never overwrites the old audit results, and records separate verifier identities. Historical source checks use `git show` at the exact full commit. Both current and historical source-off gates pass with audit SHA-256 `cfee42a5654669d8ba574fb11ffe4c2d0433c34f746ae8e3060019a48b073e5b` and interpreter SHA-256 `378bcb45acff5741b994e6d9e9df063702232ddc84d3c0002b70699caeabb5dd`. The old receipt prices are **not amended-reader prices**; representative resource refresh belongs to the separate resource task. No broad campaign was rerun.

New packet SHA-256: `b1e85f6df9618c842f34964a8bec775611ddacfc12900a236196a941c0d76fe6`. Its 31 source pins include reader SHA-256 `4b2e829204efcc5d03166db058287d66586c9bf8cef837be267bd167f6fac896`, runner `092ef80915d8d37b2f987a43fd32792ea54040b77f2d74a9c312e69582e1725d`, and interpreter as above. Planner, owned consumer, all Task 1 rules/profile/index/Core and the semantic profile remain unchanged. Reader deployed hash `0xe4b2c6a47a87801ff11c8831d7b2dc12c429205c40c5114b6015c6e6b3b500e5`; Lens `0x8c72af1ee939048293e1e5fd4935c55ec943314bc7ade22ebe89055cd16b3286`. The local shadow rename removes M1 and changes metadata pins; all historical compiler logs remain.

| Amended deployment | Runtime / actual initcode bytes | Setup gas |
|---|---:|---:|
| Lens | 18,971 / 19,674 | 4,159,280 |
| Reader | 15,160 / 19,052 | 4,167,921 |
| P2 owned consumer | 5,418 / 7,354 | 1,476,197 |

| Whole paid call | Origin | Gas | Result |
|---|---:|---:|---|
| ASSERT/DENY plus different HEADs | 20 | 440,399 | Alice ASSERT admission17; Bob DENY18; Alice HEAD revision1/admission19; Bob HEAD revision2/admission20 |
| same origin after Alice HEAD changes | 20 | 468,375 | identical attributed diagnostic, historical selection charged |
| Alice SILENT / Bob DENY | 22 | 440,351 | no stance disagreement; both HEAD targets now agree |
| Alice stance tombstone / Bob DENY | 23 | 403,464 | retained tombstone revision3; no stance disagreement |
| P2 owned priority query, both authors occupied | 23 | 533,091 | raw2/scanned2, one attributed Bob DENY; 2 prefix / 0 history / 3 joins; complete |

The P2 query commitment is `0x67d177e7df17a6c5fe31e7e3d6cdb849c7e09a6243ca5ea818397356db8910bc`; its complete `originAbsent=true` is qualified NOT_PRESENT with Bob's DENY, not no-statement. Setup remains separate: reusable fixture 58,733,386; Lens+reader 8,327,201 over two transactions; consumer 1,476,197; seven scenario publications 5,297,168; four diagnostics 1,752,589; query 533,091; total 76,119,632. All 70 receipts succeed at the ordinary 15M limit. No P64 diagnostic, dense-author maximum, or new gas ceiling is claimed. UNKNOWN behavior uses fault-injected Solidity and controlled interpreter tests, not a manufactured paid-corruption claim.

Fresh verification: `query-fix1-release-forge.log` 31/31 (13 query/diagnostic + 18 inherited), `query-fix1-release-node.log` 31/31 (15 planner/reducer + 3 independent oracle + 13 audit controls). Diagnostic RED is three assertion failures; oracle RED is two literal missing-observation failures. The original 78-test covering run remains historical; fix coverage is explicitly the amended query suite plus focused planner/oracle/audit suites. The new Forge harness initcode warning is 294,887; ordinary deployables fit separately. Existing Keys warnings remain, but the new reader shadow warning is removed.

From the lab with assigned runtime environment:

```sh
forge test --match-contract '^TagStanceQueryTest$' -vv
node --test browser/tag-stance-profile.test.mjs browser/tag-stance-planner.integration.test.mjs core-closeout-tags-20260915/query-audit.test.mjs core-closeout-tags-20260915/query-archive.test.mjs
EFS_TAG_DIAGNOSTIC_ONLY=1 EFS_TAG_QUERY_EVIDENCE=query-fix1-diagnostic node script/core-tag-stance.mjs
node core-closeout-tags-20260915/query-audit.mjs query-fix1-diagnostic
node core-closeout-tags-20260915/query-audit.mjs query-paid-final2 1a49b74dbbc9f01506cab8f3c63db49a0000adce
```

All source-observation/proof qualifications in the source-off section below still apply. The stronger joins do not turn JSON receipts into consensus/trie proofs, add arbitrary source coverage, or authorize original-author/destination replay. The diagnostic chain closed in `finally`, with history256/cache512; no owner host, public write or installation was touched.

## Original Task 2 evidence (historical reader at 1a49b74)

The original implementation's final packet is `query-paid-final2.json.gz` (SHA-256 `78b7dde2ec8930d7b70bcaf74b7d6bf261a184e742b6de4b4b6a997e7c45fcaf`), with historical `query-paid-final2-audit.json` and `query-release-audit.log`; use the fresh `query-paid-final2-fix1-audit.json` for the repaired audit joins. It contains 226 actual locally signed transactions: main 170 (168 successful, 2 expected reversions), matched signed fixture 56 successful. All use the ordinary 15,000,000 gas limit, below the 16,777,216 hard limit. Both disposable chains closed; history 256 / transaction cache 512. No public chain, owner UI/RPC, or dependency installation was involved.

Every action row retains transaction hash, full calldata/raw transaction/receipt, profile, and where applicable the planner/readset and canonical readback. Every query step retains transaction hash, profile, reader/Lens runtime hashes, actual scanned range, prefix/history probes, joins and observed-current admission. Its parent query retains exact principals, query, origin/Realm/execution/profile basis, raw oracle, returned attributed rows and final commitment. Contract entries retain constructor arguments, actual transaction initcode length, deployed runtime and code hash; required nested helpers and readset carrier runtime/bytes are also retained. Artifacts include compiler metadata and 31 exact source SHA-256/Keccak pins. Do not substitute either older campaign packet for this one.

Common final profile: `0x76867b2c20cc4142c0173fa6b3adef0415a27cf9618b3ff6ce45997ae4f7c773`; inherited semantic manifest: `0xd580f2b7a9edec73bafdaa266c24b86befce76c424f10b4a41e578776ec9bc5c`. Final scope/history/inverse coverage each reports COMPLETE, admissions 1–98. Query origins are 17, 23, 26, 27, 32 and 34, never silently replaced by that final admission.

| Final source, relative to lab | SHA-256 |
|---|---|
| `test/TagStanceReader.sol` | `24d1ae76b1bc4d6a2a18ca3fac69d01ed2d41d92820dab1159f257a5dd5c20d2` |
| `test/TagStanceQueryAccumulator.sol` | `87faa65a94cbbc46e45e906c956d85df7857de65451e4870f9f4629103b59a0d` |
| `browser/tag-stance-profile.mjs` | `a4b5fc4799aae315c8219925193a4db5c7fbd620fc83dae293083886b58c5b02` |
| `script/core-tag-stance.mjs` | `83e67d4ef9d347bd26550b401056564dc5a1fedcbc7d23ef594636c319a9f00a` |
| `core-closeout-tags-20260915/query-archive.mjs` | `b14ab433a39a8c7fbf4d03d6e2087bf12784c1b2e6824f5e468ae2d9229b67a8` |

Paid deployment code hashes: Lens `0xde4ca018799323cdc48e8692b36d6c3bcdbbcc9abe4ed207184a790a379a0a54`; reader `0xfd05a8b3a6db2b64344e7df2b4d2d80f87d89844a52963be78cb271b4e03eade`; inherited tag index `0xfc83c1ed239315805940ed0d5057646ed3815b63b2edea2baff3dd9b14b1cec0`. Consumers have per-instance immutable-dependent hashes recorded individually, not one generic hash.

## Implementation and meaning boundaries

`TagStanceLens` inherits the reviewed `LensReader` history selection, historical coverage and cursor layout/finishing. Its narrow specialization discovers origin-bounded subject or Concept-role inventory prefixes; it does not introduce a second on-chain history fold. `TagStanceReader` composes that fixed helper, checking its expected runtime and matching Ledger/index/profile. It authenticates each selected admission/author/coordinate and uses Task 1's validator for live tokens. UNKNOWN stops priority reduction; SILENT, new-purpose tombstones and proven untouched coordinates fall through. DENY stays attributed and differs from complete no-statement. Legacy readers, TAG and folder masks are untouched.

Reader ABI discriminants:

| Field | Values |
|---|---|
| direction | 1 `tagsOnSubject`, 2 `subjectsForConcept` |
| mode | 1 stable File, 2 exact revision, 3 selected revision, 4 Directory |
| assessment | 0 UNKNOWN, 1 PRESENT, 2 NOT_PRESENT, 3 NOT_APPLICABLE |
| stance | 0 no selected qualifying statement/unknown, 1 ASSERT, 2 DENY |
| scan status | 0 unavailable, 1 PARTIAL, 2 COMPLETE |
| HEAD status | 0 untouched, 1 live, 2 tombstone, 3 diagnostic conflict, 4 unknown |

Rows carry subject, exact Concept, intrinsic File, author, token, stance, assessment, revision, admission and HEAD status. `Basis` carries admission, index generation, rules epoch, execution, Realm and profile; the query pins the complete ordered Lens and exact mode. Selected mode resolves HEAD at that origin. Missing selected HEAD yields NOT_APPLICABLE query assessment with unavailable traversal; conflicting/unknown HEAD is explicit, not an empty complete result. Point assessment retains intrinsic identity and refuses to guess a missing Concept or subject.

The narrow transaction consumer pins owner/session, reader hash, Lens/query/basis and its private next cursor. It accepts only `step(session,budget)`, checks progress from the first page, and accumulates raw count, rows, unknowns and commitment. No reset, arbitrary suffix, supplied total or mutable query exists. A raw reader continuation is caller-bound convenience data, **not evidence of a previously scanned prefix**. `originAbsent` means complete historical closed-Lens absence at the fixed origin; it authorizes no current action. Budget exhaustion with zero matches remains PARTIAL.

The standalone planner exports `assertStance`, `denyStance`, `retractToSilent` and separately named supplied-revision operations. It checks retained profile/token/Concept/subject identities, intrinsic File and directed parent; emits ordinary guarded native or signed publications with coordinate CAS; selected mode guards both HEAD and stance across the closed Lens. A supplied older revision explicitly claims `EXACT_SUPPLIED_REVISION_NOT_CURRENT`. A claimed-File mismatch refuses before signing. New Concept creation is PUBLISH then BIND in one publication. Signing rechecks nonce, execution and readsets before invoking the signer. This planner supports key-author identities, not a newly generalized contract-wallet planner. There is no served-browser import or default-menu integration.

## Ordinary deployment fit and setup

Solc 0.8.30, optimizer 200, viaIR, Cancun. Limits remain runtime 24,576 / actual initcode 49,152. Actual initcode below includes encoded constructor arguments, not only creation bytecode.

The initial inline reader passed five focused controls but measured **27,496 runtime**, 2,920 over the cap; creation bytecode 30,830 and actual initcode 30,894. Its source/artifact/metadata remain in `query-inline-failed-fit.json.gz`, and warnings in `query-reader-green-attempt.log`. No ordinary deployment success is claimed for it. The controller approved exactly one new-only split, separately predeploying the fixed Lens and then reader. `query-split-fit.json.gz` records the first split checkpoint, not final bytes. No predecessor source, lower cap/domain, mutable helper or additional split was used.

| Final deployment | Runtime bytes | Actual initcode bytes | Gas |
|---|---:|---:|---:|
| inherited final validator | 5,417 | 7,297 | 1,289,407 |
| inherited stance validator | 4,873 | 11,752 | 3,061,807 |
| inherited tag index | 21,723 | 45,843 | 8,049,934 |
| new retained Lens | 18,971 | 19,674 | 4,159,280 |
| new stance reader | 12,345 | 16,209 | 3,560,228 |
| owned consumer, P1 | 5,418 | 7,322 | 1,453,506 |
| owned consumer, P8 | 5,418 | 7,546 | 1,610,914 |
| owned consumer, P64 | 5,418 | 9,338 | 2,870,237 |

Lens plus reader costs 7,719,508 across **two setup transactions**, separate from each consumer deployment and each query call. The inherited profile's stance-validator/index pair costs 11,111,741; including its final validator gives 12,401,148. Those are sums, not a single transaction.

| Registration/publication setup | Gas |
|---|---:|
| all fixture Type registrations, including baseline Types | 2,342,106 |
| described token Type registration (included above) | 370,403 |
| token word 1 publication | 1,025,279 |
| token word 2 publication | 786,991 |
| token word 3 publication | 736,192 |
| exact Concept C publication | 756,038 |
| distinct same-label Concept C2 publication | 766,254 |
| complete main fixture before first action | 58,733,386 |

The complete fixture includes the reusable baseline graph, profile infrastructure, registrations and sample admissions; it is **not a minimal deployment quote**. Token costs are sequential with different global posting/context warmup, not matched comparisons. Every setup receipt remains individually labeled in the packet.

## Whole publications

All rows below are successful receipts with inherited generic postings/backlinks, history, validation and retained evidence intact. Except the explicitly identified generic UNBIND, operations use guarded planner publications. Their price is not isolated reader/index work.

| Packet action label | Gas | Qualification |
|---|---:|---|
| `matched-native-first` | 1,047,493 | fresh coordinate, existing Concept, P1 guarded native |
| `matched-signed-first` | 1,097,558 | identical actions/readset in independent identical genesis fixture; ECDSA, Bob relayer |
| `DENY` | 879,957 | same retained coordinate |
| `SILENT` | 863,024 | explicit silence token |
| `ASSERT-again` | 868,138 | fourth revision |
| `UNBIND` | 638,937 | generic coordinate CAS, retained tombstone; no closed-Lens readset |
| `ASSERT-after-UNBIND` | 879,710 | sixth revision, not a fresh coordinate |
| `inverse-count2` | 1,023,712 | fresh File G coordinate |
| `orphan-H` | 1,006,779 | existing orphan CREATE File retained |
| `older-revision` | 1,040,179 | explicit supplied revision 1, no current-HEAD claim |
| `inverse-count5-directory` | 1,023,333 | exact Directory |
| `inverse-count6` | 1,056,170 | explicit supplied revision 2 |
| `same-label-C2` | 1,023,712 | exact C2, not normalized to C |
| `new-Concept-plus-ASSERT` | 1,358,034 | signed two-leaf PUBLISH+BIND, whole publication |
| `guarded-selected-revision` | 973,738 | signed DENY, HEAD plus stance guards |

**Not an apples-to-apples regression/savings claim:** Task 1's 882,911 native fresh ASSERT used plain `bind`, without the closed-Lens guarded readset/carrier path. The two Task 2 first-ASSERT rows are matched to each other: same fresh Alice coordinate, existing Concept, ordered one-principal Lens, actions/readset, equivalent independent fixture state, and full native/signed ingress. They include guarded evidence/carrier, snapshot checks and validation. They must not replace or be directly subtracted from the differently conditioned Task 1 row as a performance change.

## Whole owned query calls

Costs below are actual consumer `step` transactions; consumer deployment and Lens/reader setup remain above. `scanned` means raw retained candidates, including nonmatching modes; it is not ASSERT cardinality. Prefix probes count origin-prefix bisection iterations. Historical probes count inherited history `postingAt` selections including the final selected entry when history is needed. Joins count qualified observations, HEAD observations and earlier-principal dedup checks; these metrics are logical work, not every EVM storage read.

| Query label | P | Origin | Raw/scanned | Successful step gas | Prefix/history/joins per successful step |
|---|---:|---:|---:|---|---|
| inverse-count1 | 1 | 17 | 1/1 | 460,497 | 1 / 0 / 1 |
| inverse-count2 | 1 | 23 | 2/2 | 561,845 | 1 / 0 / 2 |
| inverse-count5 | 1 | 26 | 5/5 | 918,694 | 2 / 0 / 5 |
| inverse-count6 | 1 | 27 | 6/6 | 1,054,324 | 2 / 0 / 6 |
| selected-origin | 1 | 32 | 6/6, six one-candidate steps | 705,501; 445,215; 445,215; 550,071; 470,338; 538,860 | prefix 2 each; history 0,0,0,3,0,3; joins 1,1,1,2,1,2 |
| tags-P1 | 1 | 34 | 2/2 | 561,438 | 1 / 0 / 2 |
| tags-P8 | 8 | 34 | 2/2 | 907,674 | 1 / 0 / 30 |
| tags-P64 | 64 | 34 | 2/2 | 4,091,746 | 1 / 0 / 254 |
| subjects-P1 | 1 | 34 | 6/6, steps 1+5 | 705,501; 972,567 | 2/0/1; 2/0/7 |
| subjects-P8 | 8 | 34 | 6/6, steps 1+5 | 928,842; 1,918,720 | 2/0/15; 2/0/91 |
| subjects-P64 | 64 | 34 | 6/6, steps 1+5 | 2,953,710; 10,000,170 | 2/0/127; 2/8/763 |

The selected-origin sequence totals 3,155,200; subjects P1/P8/P64 successful steps total 1,678,068 / 2,847,562 / 12,953,880. These are multi-transaction sums, not isolated-call prices. All eleven complete chains match the independent raw-history oracle and full origin commitment. HEAD changes after selected-origin page 1, but the six returned rows remain those at origin 32. Stable File, exact revision, selected revision and Directory predicates remain distinct; losing revision rows become NOT_APPLICABLE, not stable-File testimony.

P8/P64 are **one actually occupied author (Alice) last in priority, with 7/63 never-touched exact principal IDs**. For P64 inverse selected mode, after page 1 there are 64 paid transitions on Alice/revision2/C: that coordinate's current history depth becomes 65 while its frozen-origin revision is 1. Inventory stays six. The remaining five candidates cost 10,000,170 in one call and incur eight historical probes. This is not a dense 64-author history campaign, all-256-candidate measurement, or a guarantee that every P64/budget256 combination fits. No natural gas-ceiling refusal occurred in this finite campaign. The nominal page domain remains 1–256 and Lens domain 1–64; callers must choose jointly feasible workload. Unrelated Bob/C and Alice/C2 admissions do not expand Alice/C's inverse inventory; tags on F intentionally includes the distinct C2.

| Expected paid refusal | Gas | Outcome |
|---|---:|---|
| stale selected HEAD after planning | 178,204 | publication reverted; origin query still continues |
| P64 page budget 257 | 708,356 | domain refusal; accumulated scanned state unchanged |

Budget 257 is an explicit domain refusal, **not out-of-gas evidence**. The consumer checks its fixed owner; tests additionally refuse wrong session/profile, appended suffix data and reset-like replay, and retain UNKNOWN from failed higher-priority history.

Accounting check: main fixture/profile setup 58,733,386; main whole actions 13,682,916; Lens/reader 7,719,508; eleven consumer deployments 19,136,844; successful query steps 29,190,928; scenario HEAD/unrelated/history setup 48,753,473; refusals 886,560; total main 178,103,615. The separate signed fixture totals 59,830,944 including its 1,097,558 first action. None is a one-operation gas claim or an economic pass threshold.

## Source-off interpretation and evidence qualifications

`query-audit.mjs` disables `fetch`, uses no RPC or original index, and imports no browser SDK label table. `query-archive.mjs` reconstructs exact Type/Record IDs, retained profile/token meanings, coordinate preimages, admitted authors, intrinsic Files and origin heads/inventories from retained data. The audit independently reproduces 79 stance-history statements and all eleven query rows/pins/commitments. Missing profile, missing required Type and unsupported meaning controls remain PARTIAL/opaque. Retained profile descriptors supply the word-to-stance mapping; token publisher is not substituted for author.

For **all 114 retained publications across both fixtures**, the audit reconstructs contiguous leaves/actions and actions hash, joins a successful Published receipt, links the raw transaction hash/sender, and checks key-principal attribution. Direct native publications are tied to the actual direct EOA transaction sender. Guarded native/signed contexts have retained readset carrier byte/code-hash joins and recomputed context digest. Signed publications additionally recompute the EIP-712 digest, recover the author, and match the retained v/r/s signature. Every recorded deployment has raw runtime retained after deployment, including late consumers; selected artifacts are checked against actual creation+constructor bytes and runtime outside compiler immutable locations. All 31 source pins are checked against the final files.

Qualification limits applying to that 114-publication claim:

- These are locally RPC-observed admissions/receipts plus retained native/ECDSA evidence, not consensus, transaction-trie, receipt-trie, storage-trie or remote-state inclusion proofs. Receipt integrity against a remote chain is not established by rechecking its JSON.
- The native attribution check relies on this **direct EOA fixture**. It does not derive arbitrary contract-internal caller attribution from the outer transaction sender.
- The signed path is the supported exact ECDSA/guarded intent profile. This task neither retests nor generalizes ERC-1271, EIP-7702, arbitrary wallet or source-chain authorization semantics.
- The interpreter is finite and version-aware, not an arbitrary Type/rule VM. It verifies the retained configured rules/identities and supported shapes/relationships; it does not prove arbitrary bytecode validity or omitted history coverage from untrusted remote data. It consumes the retained source observations and the known complete fixture archive.
- Source hashes/artifacts/runtime joins bind this paid experiment; they are not a production byte freeze or proof that a different installation has identical state/immutables.
- Recovered bytes/signatures/meaning do **not** grant original-author replay or destination permission. No destination-authorizing replay API is introduced.

## Verification and preserved failures

Use the assigned existing runtime/dependencies; no installation is needed. Commands run from the lab with `FOUNDRY_OUT`, `FOUNDRY_CACHE_PATH`, `ANVIL_BIN` and `EFS_ETHERS_PATH` set to the controller-provided paths:

```sh
forge test --match-contract '^TagStanceQueryTest$' -vv
forge test --match-contract 'TagStanceQueryTest|TagStanceProfileTest|FilesQueryOriginTest' -vv
node --test browser/tag-stance-profile.test.mjs browser/tag-stance-planner.integration.test.mjs
EFS_TAG_QUERY_EVIDENCE=query-paid-final2 node script/core-tag-stance.mjs
node core-closeout-tags-20260915/query-audit.mjs query-paid-final2
```

Final fresh checks: `query-release-forge.log` **28/28** (10 query controls plus 18 inherited Task 1 controls), `query-release-node.log` **15/15**, and `query-release-audit.log` pass/226 transactions/114 publications/31 pins/79 statements/11 queries. The one affected covering run, `query-affected-covering.log`, was **78/78** (27 query including inherited controls, 33 existing Files-origin controls, 18 Task 1 controls), before the final point-intrinsic/missing-HEAD refinement. That refinement has its focused RED, final 28/28 GREEN and newly pinned final2 paid packet; the covering run is not misrepresented as final-source execution.

TDD and diagnostic records remain literal:

- `query-reducer-red.log`: generic-first reducer had 1 pass/8 expected failures; `query-reducer-green.log`: 9/9.
- `query-reader-red.log`: initial compiler name collision, **not behavioral RED**. `query-reader-behavior-red.log`: 5 failing stub controls (4 assertions, 1 empty-array panic). `query-reader-green-attempt.log`: 5/5 but failed ordinary runtime fit; retained inline artifact as above. `query-split-fit-green.log`: 5/5 after approved composition.
- `query-owned-red.log`: 2 expected ownership/progress failures; `query-owned-green.log`: 8 focused controls pass.
- `query-planner-red.log`: 5 expected `NOT_IMPLEMENTED` failures; `query-planner-green-attempt.log`: 5 initial integration controls pass. `query-planner-signed-red.log`: actual signed publication rejected because default deadline was zero; corrected to a finite future deadline. `query-planner-green.log` still includes the subsequent obsolete fixture-Lens readback failure; canonical Ledger readback fixed the test. `query-planner-final-green.log` and final release log: 15/15.
- `query-meaning-red.log`: invalid exact Concept could be mistaken for complete empty. `query-point-red.log`: point result lost intrinsic File. Both fixed and included in final query suite.
- `query-paid-initial.*` and `query-paid-final.*` preserve earlier successful campaigns with earlier capture/reader sources. `query-audit-attempt.log` is an earlier audit, not final2 evidence. None was deleted, silently relabeled or presented as current-source proof.

Historical compiler logs retain existing `Keys` shadowing and a local scan-variable shadow warning. The Forge test harness has oversized runtime/initcode warnings (final harness initcode 287,369), so its aggregate test gas is not an ordinary production transaction. Final deployables fit ordinary limits and were separately deployed/paid under those limits. No warning suppression or enlarged production deployment cap was used. Raw Node RED logs retain assertion-renderer whitespace: full `git diff --check` flags only those preserved log lines; the non-log source/documentation check passes.

TDD directed the literal priority, owned-prefix and planner checks; systematic debugging separated the signed deadline failure from a later test-readback failure; verification-before-completion required the final source-matched audit. Independent review remains the controller's gate before integrated resource reuse. No all-author search, legacy/new semantic merge, inferred tag truth, Commons normalization, default removal UX, production adoption or public deployment is claimed.
