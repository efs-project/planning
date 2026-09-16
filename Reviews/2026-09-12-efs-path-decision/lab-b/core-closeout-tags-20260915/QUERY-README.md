# Tags Task 2 — origin-qualified queries and explicit planners

Status: implementation and finite local paid evidence, awaiting independent review. Disposable experiment; not production adoption, owner removal UX, or a new cross-chain proof profile. Task 1's [profile and evidence](README.md) remain unchanged at base `12efe4b52c9ebbb637407c02cb25b633d576fb65`.

## Exact evidence to reuse

The authoritative final packet is `query-paid-final2.json.gz` (SHA-256 `78b7dde2ec8930d7b70bcaf74b7d6bf261a184e742b6de4b4b6a997e7c45fcaf`), with `query-paid-final2-audit.json` and `query-release-audit.log`. It contains 226 actual locally signed transactions: main 170 (168 successful, 2 expected reversions), matched signed fixture 56 successful. All use the ordinary 15,000,000 gas limit, below the 16,777,216 hard limit. Both disposable chains closed; history 256 / transaction cache 512. No public chain, owner UI/RPC, or dependency installation was involved.

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
