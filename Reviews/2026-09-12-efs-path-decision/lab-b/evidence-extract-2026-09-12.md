# EFS path-decision sprint: retained cost evidence extract

Written 2026-09-12/13 by the `evidence-extractor` specialist (read-only). Every number below is copied from a retained document or evidence JSON at the cited file:line; nothing is estimated by the extractor. Labels MEASURED / ESTIMATED / QUOTED are the documents' own where they give one; where a document gives none, the column says what the document calls the figure (receipt, estimate, Forge gas).

## Citation key (absolute paths)

| Key | File |
|---|---|
| R | `/Users/james/Code/EFS/planning/Reviews/2026-09-12-efs-path-decision/README.md` at HEAD `eedbab0` (clean; §1 table lines 27–35, §3 workloads 63–70, §5 lines 89–101; all cited line numbers re-verified at this revision) |
| O | `/Users/james/Code/EFS/planning/Reviews/2026-09-11-efs21-overnight.md` (451 lines) |
| C | `/Users/james/Code/EFS/planning/Reviews/2026-09-12-efs21-canonical-native-types-results.md` (201 lines) |
| OS | `/Users/james/Code/EFS/planning/Reviews/2026-09-12-efs-path-decision/overhead-and-selection.md` |
| PM | `/Users/james/Code/EFS/planning/Reviews/2026-09-12-efs-path-decision/claude-pm.md` |
| P | `/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-11-efs21-pragmatic/` at worktree HEAD `d269e55` (README.md, contracts-interface.md, measurement.md) |
| E | `/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-11-efs21-pragmatic/evidence/` (markdown + `canonical-types.json`) |
| CT | `E/canonical-types.json` — `comparison.rows[i]` (0-based index given), `arms[0]`=`baseline-4cb0042`, `arms[1]`=`canonical-ref-free-v1`, `sourceCommit` `b2eae00`, `status` `MEASURED` |
| G | `/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-09-files-browser-mvp/gas-baseline-2026-09-10.md` |
| T | `/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-09-files-browser-mvp/type-cache-2026-09-11.md` |
| TB | `/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-09-files-browser-mvp/type-cache-boundary-2026-09-11.md` |
| CL | `/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-11-type-cache-codec-lab/README.md` |
| BC | `git -C /Users/james/Code/EFS/planning-efs21 show ebc7d54:Reviews/2026-09-11-efs21-pragmatic/body-copy-results.md` (the fuller control's own results file; not in any worktree) |
| SB | `git … show 24d7407:Reviews/2026-09-11-efs21-pragmatic/shared-byte-block-results.md` |
| MA | `git … show 1cb402a:Reviews/2026-09-11-efs21-pragmatic/metadata-admission-results.md` |
| ES | `git … show ed49a6c:Reviews/2026-09-11-efs21-pragmatic/envelope-storage-results.md` |
| DA | `git … show 67f11f7:Reviews/2026-09-11-efs21-pragmatic/evidence/direct-apply.md` |
| SRC | `git -C /Users/james/Code/EFS/planning-efs21 show b8c2775:Reviews/2026-09-11-efs21-pragmatic/contracts/src/<File>.sol` |
| PBP | `/Users/james/Code/EFS/planning/Reviews/2026-09-11-pragmatic-browser-pass.md` |
| BJ | `/Users/james/Code/EFS/planning-fable-files-browser/Reviews/2026-09-09-files-browser-mvp/v21-use-case-brainstorm-2026-09-11.json` (untracked, Fable's) |

---

## 1. Pins

| Repo / worktree | Revision | What it is | Clean/dirty (observed 2026-09-13 ~00:00 UTC) |
|---|---|---|---|
| `planning` (main) | local HEAD **`eedbab0`** "docs: record first cross-lane architecture checks" (= origin/main, 0 ahead/0 behind at ~00:05 UTC 09-13); history `6219a98` → `c8ec8d1` (road-b v0) → `edb7fe4` (war-room activation, README standing rewritten) → `eedbab0`. Brief text was first read at `2552962` (PM:3, PM:7); an earlier README coordinator checkpoint recorded planning `7f6b330` (line no longer present at `eedbab0`) | shared vault; **HEAD moved twice while this extract ran** (Codex is sole commit/push operator, PM:43) | **dirty**: modified `Daily Notes/agent-status.md`, `Reviews/2026-09-12-efs-path-decision/claude-pm.md`, `…/road-b.md`; untracked `…/files-journey.md`, `road-a.md`, `road-b-review.md`, `road-c.md`, `sdk-fixture.md`. README.md itself is clean at HEAD. |
| `planning-efs21` | `d269e55` on `codex/efs21-pragmatic` | **retained evidence pin** (R:101); native prototype source + all `Reviews/2026-09-11-efs21-pragmatic/` evidence | clean (0 files) |
| native source pin | `b8c2775` "chore: cover canonical Discovery selection and resumed content writes", 2026-09-12 08:19 −0500; ancestor of `d269e55`; `git diff --stat b8c2775 d269e55` = only `evidence/canonical-types-review1.json` (+26,075 lines) and its `.code.json.gz` | the "native canonical quote" prototype (R:101; C:180) | n/a (historical commit) |
| canonical-types measured source | `b2eae00` (C:130; CT `sourceCommit`), local evidence-only closure `e10ad67` (C:131); Task 1 source `6d1afce`/`a5937cf`, evidence `df2a26c` (C:26–29) | what the 54-row canonical pair actually ran | n/a |
| fuller control | `ebc7d54` "docs: close independently reproduced body-copy experiment", 2026-09-12 05:29 −0500. Contained in branches `codex/efs21-direct-apply` and `codex/efs21-posting-store-size-probe` (local + origin). Body-copy pins inside it: control Solidity `24d7407`, product `67576fa`, support `30296a0`, evidence `d735e06` (BC:3–5) | the 5.06M seven-fact create arm | **No worktree is checked out at `ebc7d54`.** `planning-efs21-direct` is `f873890` on `codex/efs21-posting-store-size-probe` (the stopped PostingStore size probe, R:117), clean. Anyone using the fuller control must create/verify a checkout at launch (R:101). |
| files-browser MVP | `e38b5e3` on `fable/2026-09-09-files-browser` in `planning-fable-files-browser` | source of the Sept 10/11 gas baseline and type-cache result; type-cache handoff `2182cb0` (PBP:159) | 1 untracked file: `v21-use-case-brainstorm-2026-09-11.json` (Fable's, preserved) |
| fuller lineage pins (all fresh-genesis, each a separate physical/representation change) | journal allocation `e6c1c96`/`e605fc9`, checkpoint `31b7e72` (O:196; E/journal-allocation.md:41) → direct apply `67f11f7`, control `e605fc9` (DA:7) → envelope code source `a516336`, control `ab13d89`, evidence `f4d6762`, closure `ed49a6c` (O:99) → metadata-only source `137fa252`, control `ed49a6c`, review `4e7150c`, closure `1cb402a` (MA:13–14) → initialization outline `b6ffade`/`8688d52` (Reviews/2026-09-12-efs21-initialization-outline-plan.md:15) → shared blocks source `987a7bf`, evidence `9499df7`, control `8688d52`, closure `24d7407` (SB:5) → body copy → `ebc7d54` | chain from 7.69M to 5.06M | n/a |
| native lineage pins | first slice `aa6b1b6` → receipts `03e4696`/`df82bbc` → history `3dac3b5`/`d757d5c`/`bf566dc` → discovery `f78a42a`/`84cc198` → raw `1254c22`/`a9a064e` → body storage `5632fee`/`58e61c4` → packed `f43501a`/`b8896a7` → hybrid `064ea64`/`310c8b8`/`7db38cd` → boundary extraction `62651ca`/`4cb0042` → canonical Task 1 `a5937cf` → Task 2 `b2eae00` → `b8c2775` (O:148–409; E/*.md headers) | chain from 640,934 first-file create to the 627,672 canonical quote create | n/a |
| toolchain (both arms) | solc `0.8.30+commit.73712a01`, optimizer 200, via-IR, Cancun; Forge/Anvil 1.7.1; Node 26.0.0; ethers 6.15.0; ordinary 24,576 runtime / 49,152 initcode / 16,777,216 tx caps (DA:99; E/kernel-boundary.md:12; BC:80) | | |

---

## 2. Cost table

Columns: receipt gas (unless noted), fresh/rewritten slot counts where the document gives them, arm, source, label. "Fuller@ebc7d54" = body-copy candidate column in BC (the README's "current" fuller model). "Native@b8c2775" = canonical-ref-free-v1 column of CT / C table. Native rows marked "old" are the frozen simple-validator profile (`baseline-4cb0042`) measured in the same pair.

### 2.1 Headline rows named in the brief (R:99)

| Operation | Gas | Slots | Arm | Source | Label |
|---|---:|---|---|---|---|
| Fuller seven-fact create, **complete incl. 41-byte content staging** | **5,064,132** (= 4,914,763 create-7-leaf-41B + 149,369 create-chunk-0) | not traced in this pair (BC:135 "No opcode-level attribution"); slot census only exists for the older 8.56M baseline (§2.5) | Fuller@ebc7d54 | R:99; O:9, O:52; BC:7, BC:18–19 | MEASURED receipt, root-reproduced (BC:147) |
| Native canonical quote File **create** (32-byte uint256 body, EOA namespace, value 3000) | **627,672** (old profile 560,868; Δ +66,804) | not traced | Native@b8c2775 | R:99; C:150; CT row 2 | MEASURED, "complete local transaction gas" (C:157) |
| Native "contract updates its quote File" (QuoteProducer.publish, value 3100) | **198,745** (old 131,941; Δ +66,804) | not traced | Native@b8c2775 | R:99; C:152; CT row 34 | MEASURED. **O:42 warns this is "a different ordered workload from the earlier 232,664 receipt, not a claimed saving against it."** CT row order shows `quote edit3100` (row 3, EOA namespace) precedes `quote contract update` (row 34); verify whether the update's body deduplicates before pricing it as a fresh-body update. |

### 2.2 Fuller arm at ebc7d54 — every named operation (BC:13–56; control = prior helper at 24d7407)

| Operation (BC label) | Control | **Fuller@ebc7d54** | Δ | Source |
|---|---:|---:|---:|---|
| tag-first | 2,096,170 | 2,042,304 | −53,866 | BC:15 |
| tag-steady | 1,868,793 | **1,814,915** | −53,878 | BC:16; O:54 |
| binding-rebind | 1,623,022 | **1,559,525** | −63,497 | BC:17; O:55 (O:30: republishes an existing tag assertion + new BindingSet, *not* a value update) |
| create-chunk-0 (41-byte staging) | 149,369 | 149,369 | 0 | BC:18 |
| create-7-leaf-41B (metadata only) | 5,107,995 | **4,914,763** | −193,232 | BC:19 |
| edit-chunk-0 | 149,381 | 149,381 | 0 | BC:20 |
| edit-3-leaf-41B (metadata only) | 2,609,598 | 2,518,259 | −91,339 | BC:21 |
| Complete three-record edit incl. staging | 2,758,979 | **2,667,640** | −91,339 | BC:7; O:53 |
| create-7-leaf-empty-file | 5,116,419 | 4,921,772 | −194,647 | BC:22 |
| partial-direct-author | 918,569 | 900,783 | −17,786 | BC:23 |
| mixed-ACTIVE-fresh | 1,396,057 | 1,342,179 | −53,878 | BC:24 |
| exact-ACTIVE-retry | 632,888 | 579,022 | −53,866 | BC:25 |
| old-signature-rejected (failed tx) | 356,066 | 356,078 | +12 (calldata) | BC:26, BC:135 |
| multiple-Type-groups | 2,228,774 | 2,169,973 | −58,801 | BC:27 |
| existing-Types-fresh-envelope | 827,417 | 788,539 | −38,878 | BC:28 |
| maximum-Envelope-one-selected-existing-Record | 1,283,662 | 1,244,784 | −38,878 | BC:29 (fixture selects ONE existing Record of 64 entries, O:110) |
| shared-scalar-Type-setup | 1,166,842 | 1,144,926 | −21,916 | BC:30 |
| 64-unique-ascending / reverse RecordIds (**refusals at tx cap**) | 16,264,936 | 16,264,936 | 0 | BC:31–32, BC:58 |
| 64-duplicate-selected | 10,351,537 | 10,325,745 | −25,792 | BC:33 |
| metadata-bytes-Type-setup | 1,185,297 | 1,163,110 | −22,187 | BC:34 |
| fresh-Record-tiny | 863,715 | 863,301 | −414 | BC:35 |
| existing-Record-new-occurrence-tiny | 598,278 | 597,864 | −414 | BC:36 |
| fresh-Record-near8192 (dense 8 KB admission) | 4,864,176 | **2,546,769** | −2,317,407 | BC:37; O:9, O:56 |
| existing-Record-new-occurrence-near8192 | 3,064,342 | 746,935 | −2,317,407 | BC:38; O:57 |
| fresh-Record-zero-near8192 | 4,782,984 | 2,465,589 | −2,317,395 | BC:39 |
| metadata-reference-Types-setup | 2,394,791 | 2,268,776 | −126,015 | BC:40 |
| reference-existing-tiny | 1,043,073 | 1,034,180 | −8,893 | BC:41 |
| reference-existing-near8192 | 929,376 | 920,471 | −8,905 | BC:42 |
| reference-repeated-near8192 | 1,095,523 | 1,077,737 | −17,786 | BC:43 |
| reference-valid-Object | 1,003,447 | 994,542 | −8,905 | BC:44 |
| same-carriage-Record-reference | 1,256,855 | 1,247,253 | −9,602 | BC:45 |
| large-supported-Type-setup | 13,926,677 | 12,766,937 | −1,159,740 | BC:46 |
| Type-dependency-small | 1,267,837 | 1,228,393 | −39,444 | BC:47 |
| Type-dependency-large | 1,284,925 | 1,245,469 | −39,456 | BC:48 |
| same-carriage-Type-dependency | 1,965,474 | 1,904,680 | −60,794 | BC:49 |
| withdraw-tiny | 1,111,433 | 1,101,575 | −9,858 | BC:50 |
| withdraw-near8192 | 3,325,439 | 998,576 | −2,326,863 | BC:51; O:58 |
| withdraw-current-Binding | 1,196,617 | 1,141,450 | −55,167 | BC:52 |
| late-reference (reached failure + rollback) | 1,304,413 | 1,242,738 | −61,675 | BC:53 |
| late-CAS | 1,584,688 | 1,524,699 | −59,989 | BC:54 |
| cache-then-reference (failed) | 9,837,228 | 8,578,459 | −1,258,769 | BC:55 |
| cache-then-CAS (failed) | 9,827,852 | 8,570,778 | −1,257,074 | BC:56 |

Paid reads at ebc7d54 (unchanged between control and candidate; real consumer transactions through actual Core APIs; BC:62–74):

| Read | Gas | Source |
|---|---:|---|
| getEnvelope (create Envelope) | 184,340 | BC:66 |
| getOccurrence (create) | 216,934 | BC:67 |
| getRecord (create) | 178,256 | BC:68 |
| getTypeSchema | 212,350 | BC:69 |
| getBindingHead | 175,658 | BC:70 |
| getRecordsCurrent, eight rows | 293,455 | BC:71 |
| getEnvelope, maximum | 187,593 | BC:72 |
| getRecord tiny | 178,095 | BC:73 |
| getRecord near8192 | 194,042 | BC:74 |
| **Paid scalar/repeated receipt-library gas** | **UNMEASURED** | BC:62; ES:5, ES:42 |
| Qualified Files directory traversal (browser) | 114 RPC requests, 2 cache hits, 425,579 response bytes (control 425,421) | BC:76 |

Checked Record batch (fuller, source `945ed6b`, evidence `8f101f1`; same-transaction consumer):

| Consumer | Scalar | Batch | Source |
|---|---:|---:|---|
| One short Record | 176,045 | 180,783 | O:332 |
| Eight distinct short Records | 453,212 | 283,890 | O:333; O:13 |
| Eight maximum 8192-byte Records | 5,754,391 | 5,691,560 | O:334 |

Files anchor batching (browser RPC, fuller, evidence `ab13d89`): 8 names/4 per page 92→86 RPCs, 1592.9→1611.9 ms median at 50 ms injected delay, 59,590→61,358 JSON bytes; 17/8: 161→147 RPCs, 2008.5→2038.6 ms (O:344–347). "Request reduction 6.5–8.7% did not become default latency reduction" (O:349).

Fuller setup/deployment at ebc7d54 (BC:108–134; not charged to steady create):

| Setup bucket | Gas | Source |
|---|---:|---|
| all environment setup, tx 0–79 (incl. fixture seed publications and both routers) | 130,766,930 | BC:110 |
| fixture seed publications (10–69) | 80,283,993 | BC:111 |
| FixtureDeployment | 2,084,328 | BC:113 |
| PreparationHelper (19,032 runtime bytes) | 4,169,067 | BC:114, BC:102 |
| UpgradeAdmissionLibrary (22,392 bytes) | 4,895,409 | BC:115, BC:86 |
| PointReadLibrary (15,092) | 3,317,242 | BC:116 |
| UpgradeQueryReadLibrary (20,558) | 4,498,741 | BC:117 |
| UpgradeableReadFixtureCore / Carrier (U1) | 4,724,855 / 1,737,118 | BC:118–119 |
| U2 core / carrier | 4,882,362 / 1,815,397 | BC:120–121 |
| atomic pair bootstrap | 2,337,485 | BC:122 |
| router v1 / router v2 (FilesRouterV2 13,289 bytes) | 3,423,024 / 3,322,232 | BC:123, BC:129, BC:99 |
| U3 core (24,141 bytes, 435 margin) / U3 carrier | 5,312,869 / 2,252,963 | BC:126–127, BC:97 |
| authority upgrade | 587,187 | BC:128 |
| paid read consumer | 144,233 | BC:133 |

### 2.3 Fuller-arm lineage from 7.69M to 5.06M (same 41-byte seven-leaf fixture, successive fresh-genesis kernels)

| Step (closure commit) | 7-leaf create metadata | Complete create incl. 149,369 staging | 3-leaf edit metadata | Steady tag | Binding rebind | Source |
|---|---:|---:|---:|---:|---:|---|
| files-browser baseline `e38b5e3` harness, run1 | 8,560,084 (174 fresh / 27 cold-rewrite / 34 warm of 217 distinct slots; SSTORE 3,651,700 = 42.9%) | 8,709,453 (arithmetic not given by doc; staging 149,369 G:28) | — | 2,804,496 (56 fresh / 18 cold / 8 warm of 90) | — | G:28, G:193–210, G:224, G:230 |
| type-cache control (run 2, first-op-by-principal, +3 fresh) | 8,624,205 (177) | — | routed loop edit 4,192,802 | 2,804,520 | placement 3,168,346 | T:16, T:21, T:84 |
| **type-cache candidate `2182cb0` (Sept 11 "7.69M")** | **7,688,694** (177) | +149,369 = 7,838,063 (arithmetic; measurement.md:25 says "record both receipts") | routed loop 3,620,400; rename 4,909,475; moveDir 4,948,205; copy 6,857,390; placement 2,799,592; remove 4,714,376; restore 3,875,913; tag 2,759,014 | **2,503,133** | — | T:16, T:11, T:21; PBP:159; P/measurement.md:25–27 |
| journal allocation `e605fc9` | 7,620,832 → 6,622,789 | 7,770,201 → 6,772,158 | 3,610,796 → 3,313,533 | 2,503,157 → 2,324,116 | 2,240,814 → 2,062,226 | E/journal-allocation.md:13–19, :25; O:200–204 |
| direct apply `67f11f7` | 6,622,789 → 5,753,318 | 6,772,158 → 5,902,687 | 3,313,533 → 2,957,568 | 2,324,104 → 2,080,617 | 2,062,226 → 1,839,258 | DA:15–21; O:236–240 |
| envelope code `ed49a6c` | 5,753,458 → 5,589,155 | 5,902,827 → 5,738,524 | 2,957,700 → 2,827,399 | 2,080,727 → 1,995,217 | 1,839,368 → 1,735,729 | ES:11–17, :29; O:103–106 |
| metadata-only `1cb402a` | 5,589,167 → 5,567,139 | 5,738,536 → 5,716,508 | 2,827,399 → 2,810,891 | 1,995,217 → 1,989,679 | 1,735,729 → 1,725,723 | MA:29–35; O:87–88 |
| initialization outline `8688d52` | — | +330 (reported, "not called savings") | — | — | — | Reviews/2026-09-12-efs21-initialization-outline-plan.md:15 |
| shared byte blocks `24d7407` | 5,567,445 → 5,107,995 | 5,716,814 → 5,257,364 | — | 1,989,824 → 1,868,793 | 1,725,844 → 1,623,022 | SB:3, SB:13–18; O:68–71 |
| **body copy `ebc7d54`** | 5,107,995 → **4,914,763** | 5,257,364 → **5,064,132** | 2,609,598 → 2,518,259 | 1,868,793 → **1,814,915** | 1,623,022 → **1,559,525** | BC:7, BC:15–21 |

Type declaration and cache economics (fuller):

| Item | Gas / bytes | Source | Label |
|---|---:|---|---|
| small single Type declaration (operator `executeFixture`, base Core, not router) | 1,679,410 | TB:36; PBP:170 | MEASURED receipt |
| two-small-Type group | 1,878,190 | TB:37 | MEASURED |
| 64-field boundary Type (24,960-byte cache) | 11,796,852 **revert** (`HelperDeploy`) | TB:38, TB:47 | MEASURED refusal |
| small then boundary group | 12,248,985 revert | TB:39 | MEASURED refusal |
| per-type declaration, BindingSet/1 (2,784 bytes) as code vs 87 fresh slots | ≈0.60M vs ≈1.92M today; ≈4.5M vs ≈9.6M under EIP-8037/8038 | T:23, T:120 | ESTIMATED (schedule arithmetic) |
| Type-cache SLOAD saving per steady tag | 301,600 of 645,000 SLOAD gas (137 slots, 276 reads) → 23,800 | T:19, T:43, T:52 | MEASURED (traced) |
| `_readBasis` per point read | ≈120k | T:96, T:125 | MEASURED (eth_estimateGas, round 1) |
| typeRow read estimate | 170,093 → 38,846 avg; getTypeSchema 261,569 → 238,949; getRecord 202,725 both arms | T:96 | estimate (eth_estimateGas incl. 21,000 intrinsic) |
| compact cache codec lab: codec deploy 1,718,528; original helper deploy 4,152,019; pack small/64-field 43,385 / 756,051; unpack 32,724 / 366,714; readHeader 26,916 / 129,113; boundary cache 24,960 → 5,536 bytes | | CL:25–30, CL:13–15 | MEASURED receipts, "PASS_CODEC_ONLY — not Core integration" (CL:3) |

### 2.4 Native arm at b8c2775 — all 54 primary rows (CT rows; old = `baseline-4cb0042` simple-validator profile, canonical = `canonical-ref-free-v1`)

| # | CT label | old | **canonical** | Δ | Note |
|---:|---|---:|---:|---:|---|
| 0 | namespace root (`ensureRoot`) | 230,009 | 230,009 | 0 | |
| 1 | directory setup | 421,225 | 421,225 | 0 | |
| 2 | quote create 3000 | 560,868 | **627,672** | +66,804 | C:150 |
| 3 | quote edit 3100 | 228,331 | **295,135** | +66,804 | C:151; O:11 |
| 4 | quote same 3100 (same-content edit, new revision) | 124,808 | 191,612 | +66,804 | |
| 5 | quote stale refusal (failed) | 25,778 | 25,778 | 0 | |
| 6 | empty create | 520,708 | 589,232 | +68,524 | body 0→2 bytes |
| 7 | empty fresh edit | 228,509 | 296,163 | +67,654 | |
| 8 | empty same edit | 124,784 | 192,438 | +67,654 | |
| 9 | tiny (41-byte?) binary create | 525,938 | **593,592** | +67,654 | C:154 "Create tiny binary File"; body 4→6 bytes |
| 10 | tiny fresh edit | 228,533 | 296,187 | +67,654 | |
| 11 | tiny same edit | 124,808 | 192,462 | +67,654 | |
| 12 | payload31 create | 530,886 | 616,395 | +85,509 | |
| 13 | payload31 fresh edit | 228,869 | 314,378 | +85,509 | |
| 14 | payload31 same edit | 125,144 | 192,986 | +67,842 | |
| 15 | payload32 create | 530,696 | 616,607 | +85,911 | |
| 16 | payload32 fresh edit | 228,667 | 314,590 | +85,923 | |
| 17 | payload32 same edit | 125,144 | 192,998 | +67,854 | |
| 18 | payload33 create | 548,742 | 616,819 | +68,077 | |
| 19 | payload33 fresh edit | 246,725 | 314,802 | +68,077 | |
| 20 | payload33 same edit | 125,332 | 193,010 | +67,678 | |
| 21 | payload4032 create | 1,458,449 | 1,530,289 | +71,840 | calldata gas 66,240→66,392 |
| 22 | payload4032 fresh edit | 1,154,647 | 1,226,487 | +71,840 | |
| 23 | payload4032 same edit | 194,146 | 265,246 | +71,100 | |
| 24 | payload4094 create | 1,472,670 | 1,543,857 | +71,187 | |
| 25 | payload4094 fresh edit | 1,168,868 | 1,240,055 | +71,187 | |
| 26 | payload4094 same edit | 195,233 | 266,181 | +70,948 | |
| 27 | direct new Record (`NativeRecordKernel.storeRecord`) | 137,516 | 204,320 | +66,804 | author-neutral, no File |
| 28 | direct dedup | 36,793 | 103,597 | +66,804 | validation runs on dedup too |
| 29 | facade new Record | 141,364 | 208,168 | +66,804 | |
| 30 | facade dedup | 40,641 | 107,445 | +66,804 | |
| 31 | permissionless contract Record | 163,292 | 230,096 | +66,804 | |
| 32 | permissionless contract dedup | 42,669 | 109,473 | +66,804 | |
| 33 | quote contract publish (first) | 469,781 | 536,585 | +66,804 | |
| 34 | quote contract update | 131,941 | **198,745** | +66,804 | C:152; see §2.1 caveat |
| 35 | paid unrelated quote path/Type/value read (`QuoteReader`) | 80,769 | **80,613** | −156 | C:153 |
| 36 | paid unrelated payload capture (`CanonicalPayloadConsumer`) | 168,898 | 169,016 | +118 | |
| 37 | paid direct Record read ×1 | 78,565 | 78,409 | −156 | |
| 38 | paid direct Record read ×2 (same tx) | 45,043 | 44,731 | −312 | |
| 39 | paid facade Record ×1 | 46,333 | 46,177 | −156 | |
| 40 | paid facade Record ×2 | 52,079 | 51,767 | −312 | |
| 41 | paid File metadata | 97,784 | 97,784 | 0 | benchmark-only bounded STATICCALL probe (CT limitations[1]) |
| 42 | paid history metadata | 54,062 | 54,062 | 0 | same probe |
| 43 | paid directory page | 221,687 | 221,687 | 0 | same probe |
| 44 | Discovery attach required | 155,966 | 195,761 | +39,795 | |
| 45 | Discovery backfill required | 409,492 | 406,973 | −2,519 | |
| 46 | paid Discovery query | 57,979 | 57,979 | 0 | probe |
| 47 | attached required quote edit (optional-index premium row) | 302,867 | 369,488 | +66,621 | |
| 48 | Discovery detach | 38,917 | 38,917 | 0 | |
| 49 | Discovery attach tolerated | 82,754 | 122,549 | +39,795 | |
| 50 | Discovery backfill tolerated | 409,492 | 406,973 | −2,519 | |
| 51 | attached tolerated quote edit | 302,867 | 369,488 | +66,621 | |
| 52 | rename | 246,691 | **246,508** | −183 | C:155 |
| 53 | unlink | 134,868 | 134,847 | −21 | |

C:158: "The canonical interpreter adds roughly 67,000 gas to these scalar writes; this integration is a capability gain, **not another gas reduction**."

Native setup at b8c2775 (CT `arms[*].transactions`, `phase: "setup"`; C:45–46 for helper/registry):

| Setup | old arm | canonical arm | Source |
|---|---:|---:|---|
| PreparationHelper (one-time interpreter, 19,032 bytes) | — | 4,169,079 | CT arms[1]; C:45 |
| NativeKernel incl. constructor-created Record kernel, registry, inventory, BodyWriter, Navigation, Discovery | 6,542,822 | 7,642,202 | CT arms[*]; E/kernel-boundary.md:44 (6,542,822) |
| Registry deployment alone (Task 1 direct) | — | 1,800,274 | C:46 |
| Type registration | 3 validators 136,989 / 91,483 / 90,835 + 3 registrations 115,836 / 115,450 / 116,065 | register canonical defaults (two Types) 1,081,225; exact repeat 339,264 | CT arms[*]; C:47–48; E/raw-representation.md:62–64 |
| QuoteProducer / QuoteReader / PlainQuoteMapping | 898,246 / 328,202 / 123,387 | same | CT |
| RecordProducer / PayloadConsumer or CanonicalPayloadConsumer / BodyReadConsumer / PaidReadProbe | 147,571 / 428,262 / 188,552 / 185,274 | 147,559 / 422,854 / 188,552 / 185,274 | CT |
| test-only fault drivers + fixtures (not production) | 2×2,235,707 + 1,059,871 + 963,136 + 4×43,438 | 2×2,170,741 + 1,138,260 + 1,041,525 + 4×43,438 | CT |
| **all setup transactions** | 16,177,147 | 21,881,599 | CT (sum over `phase=="setup"`; includes test-only drivers) |
| whole-run RPC | 7,992 requests / 20,432,737 bytes | 9,866 / 36,597,163 | CT `arms[*].totalRpc` (entire benchmark incl. qualification, not per-page) |
| runtime bytes | NativeKernel 10,735; ExpandedTypeRegistry 2,702; Navigation 5,432; Discovery 5,435; RecordKernel 2,954; Inventory 1,342; BodyWriter 464 | NativeKernel 10,724; CanonicalTypeRegistry 8,058; Navigation 5,432; Discovery 5,135; RecordKernel 2,946; Inventory 1,342; BodyWriter 464; helper 19,032; each Type cache 705 | CT `deployments`; C:141–142 |

Native validation-only direct receipts (Task 1 registry, not whole File ops; C:43–55, E/canonical-registry-task1.md:23–37): validate uint256 quote 97,288; empty framed BYTES 98,090; depth-4 nested 105,317; 64 BOOL members 353,193; 1,024 uint8 array 804,100; paid cache/TypeInfo/raw-group read 71,061 / 71,221 / 42,577; legal single-cache refusal 5,627,330; legal aggregate refusal 15,120,484.

### 2.5 Native lineage (context for what the 627,672 / 198,745 sit on top of)

| Checkpoint | Op | Gas | Source |
|---|---|---:|---|
| first slice `aa6b1b6`/`03e4696` | kernel+navigation+registry deploy | 3,723,287 | P/README.md:44; O:168 |
| | first 41-byte file, cold caller/list | 640,934 | P/README.md:47; O:158 |
| | subsequent unique 41-byte file / dedup file | 604,894 / 424,638 | P/README.md:48–49 |
| | fresh-content 41-byte edit / same-content | 350,271 / 163,536 | P/README.md:50–51 |
| | move+rename / unlink | 240,871 / 134,942 | P/README.md:52–53 |
| | producer initial / update / consumer tx | 592,176 / 284,631 / 77,277 | P/README.md:55–57 |
| | plain mapping initial / later | 44,066 / 26,966 | P/README.md:58 |
| | Forge gas (not receipts): createFile unique 544,070, edit 290,177, hydrated page 16/32 364,385 / 703,155 | | `git show b8c2775:…/contracts/evidence/gas-report.txt` lines 5–24 |
| history sharing `bf566dc` | producer update / 41-byte edit / same-content / unlink | 237,597 / 303,237 / 116,496 / 107,781 | E/history-storage.md:12–18; O:176–182 |
| discovery `f78a42a` | no-profile producer update; direct scalar edit no profile / with profile; premium | 245,563; 241,218 / 344,661; **103,443** | E/discovery.md:24, :29, :31; O:190 |
| | attach-required 155,958; backfill chunks 109,024 / 139,797 / 149,152; kernel deploy 5,034,158 | | E/discovery.md:21, :31 |
| | qualified 8-match query: 1 eth_call (est. 56,387) vs 72 calls (summed est. 2,197,693) | | E/discovery.md:39–40 |
| raw `1254c22` | fresh 41-byte create canonical/raw; edit; producer update | 645,501 / 598,309; 311,203 / 264,011; 245,563 | E/raw-representation.md:42–50; O:219–222 |
| body storage `5632fee` | raw 4,032 dense edit slots→code; zero 4,032 admission; producer update; paid 4,032 read | 3,083,783 → 1,132,496; 443,713 → 999,848; 245,563 → 265,367; 360,212 → 87,426 | E/body-storage.md:30, :54, :36, :67; O:359–365 |
| packed `f43501a` | raw41 create / edit; producer update; paid quote read; per-fresh-Record saving | 591,801 / 241,339; 243,249; 76,393; 22,117–22,121 | E/packed-presence.md:20–21, :29–30, :5 |
| hybrid `310c8b8`/`7db38cd` | producer update; zero 4096 admission; its paid read; kernel deploy | 226,667; 200,375; 396,952; 5,657,401 | E/hybrid-body.md:26, :30–31, :15; O:381–384 |
| boundary extraction `62651ca`/`4cb0042` | producer update / paid reader / main deploy; Files fresh tiny edit; dense 4096 edit | 232,664 / 80,769 / 6,542,822; 228,509; 1,169,377 | E/kernel-boundary.md:42, :44, :35; O:398–403 |
| | qualification RPC per observation | 24 → 33 requests; 84,008–84,038 → 90,610–90,649 bytes | E/kernel-boundary.md:63–64 |

### 2.6 Baseline slot census (fuller, `e38b5e3` harness at 8,560,084 — the only retained fresh/rewritten slot decomposition; MEASURED with traces, G:17–28)

| Op | SSTOREs | distinct | FRESH | COLD_REWRITE | WARM_REWRITE | NOOP | SSTORE gas fresh/cold/warm/noop | Source |
|---|---:|---:|---:|---:|---:|---:|---|---|
| tag-first-ever 3,046,565 | 104 | 94 | 68 | 10 | 8 | 18 | 1,389,400 / 29,000 / 800 / 8,100 | G:223 |
| tag-steady-1 2,804,496 | 100 | 90 | 56 | 18 | 8 | 18 | 1,149,400 / 52,200 / 800 / 8,100 | G:224 |
| createDir-1 5,136,899 | 163 | 142 | 103 | 23 | 19 | 18 | 2,114,600 / 66,700 / 1,900 / 8,100 | G:227 |
| stageChunk-1 149,369 | 6 | 5 | 5 | 0 | 1 | 0 | 106,300 / 0 / 100 / 0 | G:229 |
| createFile-1 8,560,084 | 253 | 217 | 174 | 27 | 34 | 18 | 3,561,900 / 78,300 / 3,400 / 8,100 | G:230 |

createFile-1 slots by family (fresh in parentheses): Record 48 (48) 1,017,400; Word 37 (27) 570,100; Posting 36 (22) 481,800; Envelope 17 (14) 311,800; PostingKey 22 (22) 440,000; Admission 14 (14) 280,000; RecordId 7; Lifecycle 7; Binding 6; Batch 3; BindingKey 3; EnvelopeId 1; Counts 2 (0); Authority 1 (0); Bootstrap 13 (0); total 217 (174), 3,651,700 (G:290–309). "48 Record slots are 7 × (typeId + body head + ordinals) + 27 body data words" (G:311–312). Steady tag: posting families + PostingKey = 34 of 90 slots and 35% of SSTORE gas "for the indexes of two records" (G:280–282). Component split of createFile-1: SSTORE 3,651,700 (42.9%), SLOAD 1,472,800 (17.3%), MEMORY 913,658, STACK 1,067,355, CONTROL 629,116, ARITH 397,533, CALLDATA 257,788 (G:197–210). Glamsterdam ESTIMATED SSTORE component: createFile-1 19,995,380; tag-steady-1 6,641,520; createDir-1 11,984,060 (G:345–360, PM-supplied multipliers FRESH×110,020 / COLD×12,100 / warm×10,100; SLOAD and plumbing not repriced).

---

## 3. What the native prototype at b8c2775 actually is (from source)

**Stored per File create** (`SRC NativeKernel.sol`): `fileNonce[msg.sender]++` (L242); `files[id] = FileInfo(owner, directory, live, revision=1, recordId)` (L243, struct L12–18); `locations[id][1] = HistoricalLocation(parent, name)` (L244); `history[id].push(StoredRevision(rid, 1, true))` (L245); then external `navigation.addNode` (L247) writing `locations[id]`, `byName[parent][keccak(name)]`, `children[parent].push`, `position[id]`, `++generation[parent]`, `createdFiles[owner].push` (`NavigationIndex.sol` L53–63, L148–156); then `_notify` → `DiscoveryIndex.onFileChanged` with a fixed 600,000 gas budget and 32-byte marker check (L64, L265–280). The body goes through `_store` → `NativeRecordKernel.storeRecord` (L252–255): `types.validate(typeId, body)` (`NativeRecordKernel.sol` L89), `recordId = keccak256(abi.encode(RECORD_DOMAIN "efs2/record/1", typeId, keccak256(body)))` (L50–52), dedup on `records[id].present` (L91), backend choice words-vs-code by the calibrated heuristic `22_300*nonzero + 240*words < 33_500 + 200*len` (L127–131), `BodyWriter.write` CREATE of `STOP||body` (`BodyWriter.sol` L16–24) or `sparseBodyWords[id][i]` (L103–106), `records[id] = StoredRecord(typeId, pointer, uint16 len, present, backend)` (L110), mandatory `recordInventory.noteRecord(typeId, id)` append with success-marker check (L133–146; `RecordInventoryIndex.sol` L29–33), `RecordStored` event (L112). MAX_BODY 4096 (L27), MAX_NAME 64, MAX_PATH_DEPTH 32 (`NativeKernel.sol` L65–67).

**Stored per update** (`editFile`, L169–178): `_ownedLive` check (owner == msg.sender, live, revision == expected; L290–295), new Record via `_store` (dedup if same bytes), `history[id].push(StoredRevision(rid, locationRevision, live))`, `++file.revision`, `file.recordId = rid` (L282–288), `navigation.touchNode` (bumps parent generation only, `NavigationIndex.sol` L82–86), `_notify`. `moveFile` writes a new `locations[id][rev]` row (L186) and `navigation.moveNode` (swap-pop detach + insert, L65–72, L158–169). `unlink` pushes a `live=false` revision and `navigation.removeNode` (L193–201; L74–80); root removal and directory moves/content are unsupported (L87–89, L182, L195).

**Authentication:** `msg.sender` only (`_create` L240–242, `_ownedLive` L292, `ensureRoot` L130). No author parameter, no signature, no `tx.origin`, no delegation (P/contracts-interface.md:27; O:128). `storeRecord` is permissionless and author-neutral (`NativeRecordKernel.sol` L7, L46–48; P/README.md:7). FileId = `keccak256(abi.encode("EFS21_FILE_V1", block.chainid, address(this), owner, nonce))` (L312–314) — **deployment- and chain-bound** (C:66–67). Producer contracts own their own namespace (`Examples.sol` L14–20, L22–30; O:270).

**Type registry** (`CanonicalTypeRegistry.sol`): stores exact raw group bytes + ordered member IDs (`groups`, L20–24, L94–95) and per-Type `TypeInfo(groupId, memberIndex, blobHash, cacheCode, cacheLength, cacheHash)` with each compiled cache deployed as STOP-prefixed code via the pinned `PreparationHelper` (L85–98, hash pinned at `CanonicalHelperIdentity.sol` L5). `registerGroup` refuses dependencies (L53), roles/references (L141–146), declared indexes (L147), reserved full-C0 mutation Type IDs (L205–213), caches > 24,575 bytes (L68). `validate` runs `Preparation.record(..., bodyOnly=true)` and additionally requires zero references/occurrenceKeys/effects (L121–139). `isUint256` gates Discovery attachment (L115–119). Every `checked()` read re-hashes the whole raw group and walks member spans (L150–169; C:74–75; E/canonical-registry-task1.md:51).

**Indexes maintained:** mandatory — `NavigationIndex` (children/byName/position/generation per directory, `createdFiles[owner]` all-created inventory with append-only high-water cursors; L27–32, L119–124) and `RecordInventoryIndex` (`admittedRecords[typeId]` unique Records ever admitted; L20). Optional — `DiscoveryIndex`: one `UINT256_EQ` profile per namespace (`profiles[msg.sender]`, L100–107), required/tolerated policy (L186–189), permissionless bounded backfill over `[0, highWater)` (L136–153), epoch/generation cursors, health UNSUPPORTED/BUILDING/READY/DIRTY (L25–30), 350,000-gas maintenance child + 100,000 reserve (L68–69). No global owner or Type enumeration (O:308). No occurrence/backlink/tag/reference families (E/discovery.md:3; P/README.md:124).

**History kept:** every edit/move/unlink appends an immutable `StoredRevision` and the immutable location table keeps parent/name at creation and each move (L27–38; E/history-storage.md:30); `revisionAt` is contract-readable after unlink (L208–214). Body bytes are immutable and retained. One live placement, one owner, one combined revision counter per File (O:37; P/contracts-interface.md:50–52).

**What it does NOT provide** (docs' own words): portable signed authorship/Principals/AuthorIntent, authored Occurrences, generic Bindings/withdrawal effects, plural Lenses/masks, multi-placement, restore, directory moves, revision DAG, upgrades/populated-state migration, references (Record/Object/Principal), roles, declared Type indexes, external Type dependencies, arbitrary developer acceptance programs, relational tags/general discovery, delegation/privacy/encryption, chunking/external carriers, Unicode names, gas sponsorship, access delegation, state-proof verification, seed-free whole-world recovery (Reviews/2026-09-12-efs21-canonical-native-types-plan.md:19–23; C:62–67, C:162–163, C:198–200; CT `comparison.limitations[3]`; P/contracts-interface.md:80; P/README.md:124; P/measurement.md:45; E/kernel-boundary.md:83; O:264, O:308). Legal large Types (24,960-byte cache; 16-member aggregate 333,824 bytes) remain refused (CT `unsupportedCapabilities`; C:71–73). Canonical body limit 4,096 bytes / 4,094 payload (C:69–71).

---

## 4. Guarantee ledger against README §1 (R:27–35)

| §1 outcome | Fuller model provides (docs) | Native prototype provides (docs/source) | Unpriced per the docs |
|---|---|---|---|
| **Portable data identity, stable File identity, independently checkable authorship** (R:29) | Canonical Type/Record IDs, ObjectGenesis stable identity, "Claimed Principal plus signed AuthorIntent and retained publication/occurrence/lifecycle evidence" (O:36, O:280–286). But author intents "are bound to a chain/execution context" (O:124) and "even its direct authorized path currently requires an EOA signature" — autonomous contract authorship is "still an ingress gap" (O:40). | Canonical Type/Record IDs are deployment-independent (C:66; CT limitations[0]); FileId and caller authority are chain/deployment-bound (`NativeKernel.sol` L313; C:66–67); `msg.sender` authority "labelled chain-qualified; never presented as a portable author signature" (O:128); no Principal/AuthorIntent (plan:20). | Portable authored data in the compact arm (R:48; OS:98); "signed/compact-evidence extension" to native "must measure separately" (O:260); portable **contract-account** authorship in either arm (O:40; R:64 "real contract author without fabricating an EOA signature"). |
| **Useful Types, checked references, mandatory developer acceptance** (R:30) | "Canonical structural Types/IDs, constraints and checked references, with known large-cache failures" (O:35); Type dependencies and reference existence/class checks measured (BC:40–49). "Neither compared arm includes arbitrary developer-programmed acceptance" (O:40). | Reference-free structural profile only: refuses roles/references/indexes/dependencies (`CanonicalTypeRegistry.sol` L53, L141–148; C:62); constraints + nested containers validated (C:49–53); three-validator legacy profile is "not fulfillment of the arbitrary developer validation requirement" (O:262). | Checked references in the compact arm (R:48); programmable acceptance in both (OS:98; O:421 "read-only preflight, not implemented support"); "acceptance evidence ... rule cost explicitly, including a goblin/outfit refusal" (O:421). |
| **Contract-usable Files, paths and selected values** (R:31) | Paid Core reads 175,658–293,455 per point/batch (BC:66–74) with ≈120k `_readBasis` per point read (T:96, T:125); no routed receipt API and receipt-library gas unmeasured (BC:62). Eight-Record batch 283,890 (O:333). | `resolve`/`fileInfo`/`readRecord` (`NativeKernel.sol` L150–154, L203–237); unrelated paid consumer 80,613 (CT row 35); producer contract owns its namespace (`Examples.sol` L5–31). Exact bytes + Type checked by consumer (`Examples.sol` L48–52). | Fuller: paid reads of "selected" values via Lens from a consuming contract and known-Record consumption (O:14, Reviews/2026-09-12-efs21-onchain-known-record-preflight.md — "no saving is measured yet"). Native: no Lens selection to price (single owner). Live contract-backed files "not implemented or priced yet" (O:17). |
| **Independent authors, Lenses, history, practical file ops** (R:32) | "Independent charter/head/name Bindings, per-principal choices, plural Lenses and masks" (O:37); rename/move/copy/remove/restore measured on the routed V1 loop (T:21: 4.9M / 4.9M / 6.9M / 4.7M / 3.9M at the type-cache revision). | "One owner, one placement, one combined revision counter" (O:37); rename 246,508, unlink 134,847 (CT rows 52–53); history retained after unlink (`NativeKernel.sol` L208–214); no restore, no directory move (`NativeKernel.sol` L87–89, L182). | Two-author / multi-author selection in the compact arm (R:48; OS:98); "A qualified composition test must follow" for Lenses (O:263); restore/multi-placement in native (O:261 "bounded experiment scope, not proof ... unaffordable"). |
| **Required discovery plus configurable extra indexes** (R:33) | All ten posting families maintained on every admission (O:64, SB:3); indexes = 34 of 90 slots / 35% of SSTORE gas in a steady tag (G:280–282); mandatory index-contract extraction stopped at 24,761 bytes, 185 over cap (O:20; Reviews/2026-09-12-efs21-posting-store-plan.md:31); proposed cuts to families 3 / postingKeys / ordinal mirrors "not implemented or measured yet" (O:437–449). | Mandatory Navigation + unique-by-Type Record inventory (separate accounts, ordinary calls, O:131); optional UINT256_EQ Discovery with required/tolerated failure, backfill, DIRTY, epoch cursors (`DiscoveryIndex.sol`; E/discovery.md:7–13); premium 103,443 per attached scalar edit (O:190), 66,621 more on the canonical profile (CT row 47); no global owner/Type enumeration (O:308). | "Images tagged nsfw in this folder" — native has "scalar current-file experiment, not yet image tags, full-v2 occurrence indexing" (O:192; E/discovery.md:3); 1,000-live / 10,000-lifetime-name churn and late backfill coverage (R:70; O:15 current-navigation projection "not implemented or priced yet"); "minimal global seed inventory" (O:264). |
| **Independent access, extensibility, honest missing data** (R:34) | Qualified Files browse 114 RPC requests / ~425 KB (BC:76); COMPLETE/PARTIAL sealing; export round-trip suites (T:106); ≈0.84 HTTP requests per entry (BJ:332, Fable's ESTIMATE). | Static browser with snapshotted assets, block-pinned reads, source-graph qualification (P/README.md:30–36); 33 RPC / ~90.6 KB per qualification observation (E/kernel-boundary.md:63–64); RPC failures never become empty folders (P/README.md:32). "Trusted RPC observations are not cryptographic state proofs" (both arms, everywhere). | Export/import into a second deployment with clean-reader checks (R:64) — neither arm has done it; walk-away/corrupt-carrier/encrypted cases (R:68; P/measurement.md:45); state-proof verification (O:306). |
| **Understandable APIs, wallet interactions, upgradeable testnet continuity** (R:35) | SDK emits seven records per create, three per edit, four per rename (O:276–288); one author signature per routed operation (T:82); proxy U1→U2→U3 upgrade path and authority upgrade deployed (BC:118–128); populated-layout migration for code-pointer Type rows "not established" (T:117). | One call per file action (`createFile`/`editFile`/`moveFile`/`unlink`, P/contracts-interface.md:35–48); journalled `SUBMISSION_UNKNOWN`/`VERIFICATION_UNKNOWN` holds and read-only reconcile (P/README.md:36); **no upgrades/populated-state migration, no gas sponsorship** (P/contracts-interface.md:80). | Relayer/sponsor costs (R:93) — journal benchmark runs `sponsor:false` (E/journal-allocation.md:64); testnet upgrade preserving populated data for either arm (T:117; P/contracts-interface.md:80). |

Summary sentence the docs themselves give: the two retained comparisons "do **not** price equivalent portable authorship, checked references, programmable acceptance and multi-author selection across both arms. Those costs are still unpriced" (OS:98). "Neither arm includes the full model's portable authored publication and plural Lenses, so neither prices those guarantees away" (C:162–163).

---

## 5. Qualifications and caveats attached to these numbers

1. **Not rerun.** "This planning pass did not rerun those benchmarks" (R:99). The 5.06M / 627,672 / 198,745 "measure different promises; their ratio is **not** the price of portability" (R:99).
2. **Different fixtures.** Fuller: 41-byte content staged separately (149,369) plus seven metadata leaves, routed through FilesRouterV2 → Core U3 with an EOA author signature and "signed consent" calldata (BC:11; T:82). Native quote: 32-byte `abi.encode(uint256)` body written by a producer contract via `msg.sender` (`Examples.sol` L26–28; CT rows 2, 34). Native "tiny binary" 593,592 (CT row 9) is a 4→6-byte body, not the 41-byte file; the old-profile 41-byte file was a 128-byte ABI-framed body (P/README.md:60) and the canonical profile uses two-byte length framing with 4,094 payload max (C:70–71, C:160). Setup and "raw-versus-length-framed byte boundaries remain separate" (C:160–161).
3. **198,745 vs 232,664.** The canonical pair's contract update "is a different ordered workload from the earlier 232,664 receipt, not a claimed saving against it" (O:42). CT row order (row 3 `quote edit3100` before row 34 `quote contract update`) suggests the update body may already exist; the docs do not say so explicitly — verify before treating 198,745 as a fresh-body update.
4. **Per-write premium of the canonical profile.** +66,804 on every scalar write, +67,654–85,923 on files (CT rows 2–34); "capability gain, **not another gas reduction**" (C:158). Attach costs +39,795 (CT rows 44, 49).
5. **Setup amortization is explicit and large.** Fuller env setup 130,766,930 across 80 transactions incl. seed publications (BC:110); native setup 16,177,147 / 21,881,599 incl. test-only fault drivers (CT); shared interpreter 4,169,079 "should be priced separately from each user's writes" (C:56–57). Native kernel deployment includes all constructor children in one receipt (P/README.md:24). Type declaration receipts 1,679,410 / 1,878,190 are operator `executeFixture` receipts, "not FilesRouter costs" (PBP:170; TB:12).
6. **Sponsorship / relayer.** No sponsored transactions anywhere: journal benchmark `sponsor:false` (E/journal-allocation.md:64); native has "no gas sponsorship or access delegation" (P/contracts-interface.md:80). README asks that relayer/sponsor costs be counted (R:93) — they are not in any retained number.
7. **Cold access sets every transaction.** "Every transaction starts with cold EVM access sets; 'steady' means previously initialized persistent state, not cross-transaction warm accesses" (P/README.md:60; E/raw-representation.md:36). Same-transaction repeated reads are warm and are not two transactions (E/body-storage.md:70).
8. **Calldata intrinsic noise.** ±12/24 gas run-to-run from signature/deadline bytes (G:34–36; BC:135; MA:25).
9. **Receipts vs estimates vs Forge gas.** `gas-report.txt` and `eth_estimateGas` figures are diagnostic, never relabelled as paid receipts (P/contracts-interface.md:76; P/measurement.md:34; E/discovery.md:44 "summed independent estimates ... not one equivalent onchain scan"). Native "paid" File-metadata / history / directory / Discovery-query rows use a benchmark-only bounded STATICCALL probe (CT limitations[1]).
10. **Native failure receipts** for required/tolerated Discovery use a test-only driver/index, "not production-hook failure gas" (CT limitations[2]; E/discovery.md:48).
11. **Unmeasured in the fuller arm:** paid scalar/repeated receipt-library gas (BC:62; ES:5, ES:42); typed read-facet fit and routing cost (O:26; C:88–91); index-store separation economics (O:20–22); same-basis `readMany` ("no measured read savings yet", O:326); Type-declaration transaction on the routed path (T:127).
12. **Legal large Types** fail in both arms: 64-field 24,960-byte cache > 24,575 (BC:58; TB:38; CT `unsupportedCapabilities[0]`), 16-member aggregate 333,824 bytes exhausts the helper (CT `unsupportedCapabilities[1]`; C:71–73). Codec lab shrinks it to 5,536 bytes but is "not Core integration" (CL:3, CL:14).
13. **All arms are fresh-genesis; no populated-state migration** (T:117; SB:3; E/kernel-boundary.md:3; P/contracts-interface.md:80).
14. **Local Anvil gas, not fees.** No ETH/USD, L1/L2, DA or sequencer figures anywhere (R:95; C:157; P/measurement.md:37). Glamsterdam figures are ESTIMATED/QUOTED arithmetic on measured counts (G:345–350; T:120; Reviews/2026-09-11-efs21-full-model-storage-preflight.md:66–70).
15. **RPC observations are not state proofs** (P/README.md:32; E/kernel-boundary.md:59; O:304).
16. **Fuller control checkout:** `ebc7d54` is not checked out in any worktree; `planning-efs21-direct` holds the stopped `f873890` size probe (R:101) — confirm before any run.
17. **The 5.06M is metadata + staging only.** It excludes Type declaration, principal claim, and the 149,369 is one 41-byte chunk; a 4 KiB chunk is 131 fresh slots (G:250).

---

## 6. Contradictions with the September 11 figures (7.69M createFile / 2.50M tag / 5.5M "v2.1 estimate")

| Sept 11 figure | Retained source | Current retained figure | Why they differ |
|---|---|---|---|
| **7.69M createFile** | 7,688,694 = type-cache **candidate** `createFile-1`, run 2, first op by principal (177 fresh slots), routed FilesRouterV2 → U3, **excluding** 149,369 staging (T:16, T:84; PBP:159; P/measurement.md:25). Control in the same pair 8,624,205; the full-sequence baseline was 8,560,084 (G:28). | Same 41-byte seven-leaf fixture is now **4,914,763 metadata / 5,064,132 incl. staging** at `ebc7d54` (BC:7, BC:19). | Six successive same-semantics fresh-genesis kernel changes on the fuller arm, each independently reviewed: lazy journal allocation (−998,043; E/journal-allocation.md:17), direct apply (−869,471; DA:19), Envelope-as-code (−164,303; ES:11), metadata-only admission reads (−22,028; MA:33), shared Record/Envelope byte blocks (−459,450; SB:13), bounded MCOPY body copy (−193,232; BC:19). The efs21 runner also uses a different world prefix from the files-browser harness (type-cache run 2 was +3 fresh slots over the default sequence, T:84), so the two 7.6M figures (7,688,694 vs journal-allocation control 7,620,832, E/journal-allocation.md:17) are not the same receipt either. Not a different fixture payload, not a different routing (both routed); different kernel revisions and harness. PM:7 already retires 7.69M as current. |
| **2.50M tag** | 2,503,133 = type-cache candidate `tag-steady-1` (T:11); 2,503,157 = journal-allocation control steady two-leaf tag (E/journal-allocation.md:14). | **1,814,915** `tag-steady` at `ebc7d54` (BC:16; O:54). | Same chain as above: 2,503,157 → 2,324,116 (journal) → 2,080,617 (direct) → 1,995,217 (envelope) → 1,989,679 (metadata) → 1,868,793 (shared blocks) → 1,814,915 (body copy). Do not confuse with `binding-rebind` 1,559,525 (BC:17), which O:30 explains is a tag-assertion republish + new BindingSet, not a quote update. |
| **5.5M "v2.1 estimate"** | **Not found in any retained document.** Searched: planning main (`Reviews/`, `Designs/`, `Daily Notes/`, `Decisions.md`), `road-b.md` at `c8ec8d1`, `claude-pm.md`, all `planning-efs21` pragmatic/files-browser/codec-lab markdown, Fable's untracked brainstorm JSON, and the Claude memory directory. | The brainstorm JSON's v2.1 figures are "ESTIMATED 2.2–2.5M per rebind" and "~8–10M under Glamsterdam" (BJ:10, BJ:60, BJ:120, BJ:265), not 5.5M. The only retained values near 5.5M are MEASURED seven-leaf metadata creates at intermediate fuller revisions: 5,589,155 (ES:11), 5,567,139 (MA:33), 5,567,445 (SB:3), and 5,753,318 (DA:19) — none is a "v2.1 estimate". | The figure has no retained provenance; if it was a chat-side estimate of a v2.1 (declared-index) createFile it is superseded by measured 5,064,132 with all ten families retained (BC:7, O:64). Recommend Road B not cite it. |

Additional Sept 11 numbers that are superseded in the same way: createDir 4,622,839 (T:15) has no post-`e605fc9` counterpart in the efs21 tables (the efs21 fixture measures create/edit/tag/rebind, not createDir); routed loop edit 3,620,400 / rename 4,909,475 / remove 4,714,376 (T:21) are "historical context from that loop, not a newly rerun matched native comparison" (P/measurement.md:27).
