# Required-query raw-state checkpoint recipe (source-derived)

Bounded design handoff; no RPC, compiler, chain, candidate query-output, repository edit, commit or subagent execution by the recipe reviewer. Inputs: `/tmp/efs-required-query-independent-inputs-20260914.EHNqIA/inputs.json` and its README; physical requirements: `/tmp/efs-required-query-paid-preflight-20260914.md`, Required finite raw evidence 2–6. Read-only artifact ABI inspection used B `/tmp/efs-required-query-b-green-20260914.G8M9Z4/out`, C `/tmp/efs-required-query-c-build-20260914.sKwCIN/out`. B/C source roots below mean sibling worktrees `../../../planning-warroom-{b,c}-run/Reviews/2026-09-12-efs-path-decision/lab-{b,c}`. Root published this handoff with local source paths made relative; no measured transport/gas claims follow.

## 1. Small runner shape and unavoidable differences

Use the sealed addresses, actions, signatures and graph values directly; derive row expectations offline from those named actions, not from readers. Let `H(s)=keccak256(UTF8(s))`, `Z=bytes32(0)`, `E(types,values)=abi.encode`, and `K(...)=keccak256(E(...))`. Every observation is a literal raw `eth_call` result at the numbered receipt block, joined to its retained hash. Compare the complete ABI encoding, not decoded booleans alone. No storage-slot derivation or trace is necessary: B raw getters and C public Store rows expose the needed state.

Important source distinctions that MUST survive reporting:

- B `evidence.basis` is the publication's **block number**, not admission high-water. C Evidence.basis is **pre-publication admission high-water**.
- B `nonces(address)` stores the **next** application nonce; C Nonces stores the **last** accepted application nonce. Neither is Ethereum transaction nonce.
- C's six mandatory Coverage rows stay `(true,true,0,0)`; `coverage()` synthesizes COMPLETE/through from Ledger.highWater. There is **no independent stored C processed frontier**. Capture the raw rows plus API response and exact maintained postings; do not relabel its zero `through` field as current high-water.
- B Backlink posting count/live concerns **bindings pointing at targets**. C Backlinks contain **fresh Record IDs referencing a Record** (P/Q and the two Items). C has no corresponding binding-target live counter. Current A1/A2/B1/A3 head-target counts can be independently derived as `0/1/1/0` from C Bindings, but are not C Backlinks rows or an equal-cost native index family.
- B scopes are per-author. C HEAD scope is one shared `(HEAD,S)` list of `(author,role,bindingKey)` triples. Never create two separate C scope keys by analogy with B.
- Exact retained Quote membership is not Lens/current HEAD selection. Both A1 and A2 remain retained despite the HEAD move; reuses add occurrences but no fresh-reference entry.

## 2. Checkpoint matrix

`common1..8` are unchanged, 5/3/3/1/1/2/6/3 actions. B publication ordinal is common number. C additionally has `types` at block66 / admissions1..4.

| Checkpoint | B scan / B selective | C |
| --- | --- | --- |
| Ready before common1 | `counts=(0,0,0,0)`, both nonces0; attachment/profile/registry and all family coverage below; both P/Q reference heads zero | Before Types: highWater/counter0, both nonce rows0, attachment/poison. After Types: highWater4, A nonce1/B0, all 4 Admissions, Evidence, Type Records, Types metadata, Type occurrences, TYPE_META ByType and A ByAuthor |
| After every common publication | Every **new** admission + `acceptanceBasis` for publish/reuse; one evidence + publicationOf; each touched fresh/reused Record; counts, both author nonces, index frontier/coverage; touched HEAD/scope/history/backlink/by-Type/by-author/reference postings | Every new Admissions row + one Evidence; touched fresh/reused Records plus Occurrences; highWater and raw Counter, both Nonces; all family rows/API and touched scope/history/by-Type/by-author/reference postings |
| Common7 old seal, common8 tail | Full snapshot inventory in §5, including all retained Record bodies; ordinal/evidence delta already covers new rows | Full snapshot inventory, including 4 Type Records separately from data Records |
| After every paid page | Repeat core/index counters, both nonces, HEADs, complete relevant posting snapshots (§5); simplest safe version repeats full snapshot, including bodies | Same; simplest version repeats full snapshot including Records/Occurrences |

Old/current block pairs: B scan19/20; B selective54/55; C75/76. Paid pages always run after tail. Old queries use basis21 (B) /25 (C) against the **current** graph; rawTotal is current15/4/5, not old seal count12/3/4. There are exactly25 pages and82 transactions; no additional mined setup or probe actions.

Source-derived per-common-publication expectations:

| common | B counts `(admissions,records,bindings,pubs)` | B next nonces A/B | C highWater | C last nonces A/B |
| --- | --- | --- | --- | --- |
| 1 | 5,4,0,1 | 1/0 | 9 | 2/0 |
| 2 | 8,6,1,2 | 2/0 | 12 | 3/0 |
| 3 | 11,8,1,3 | 3/0 | 15 | 4/0 |
| 4 | 12,8,1,4 | 3/1 | 16 | 4/1 |
| 5 | 13,9,1,5 | 4/1 | 17 | 5/1 |
| 6 | 15,10,2,6 | 4/2 | 19 | 5/2 |
| 7 | 21,16,2,7 | 5/2 | 25 | 6/2 |
| 8 | 24,18,2,8 | 6/2 | 28 | 7/2 |

C has no separate stored data-record/publication/binding aggregate counters. Report its 16/18 data Records and 8/9 total publications as **inventory-derived**, not raw counters.

## 3. B exact call recipe

Targets `L=arm.addresses.ledger`, `I=...index`, `R=...registry`. Standard ABI result words (not packed bytes) unless stated.

| Target / signature | Selector | Arguments / exact result |
| --- | --- | --- |
| L `counts()` | `0x817cc1ea` | `(uint64 admissions,uint64 records,uint64 bindings,uint64 publications)` |
| L `nonces(address)` | `0x7ecebe00` | author account1/2 address; `uint64 next` |
| L `record(bytes32)` | `0xb5c645bd` | Record ID; `(bytes32 typeId,uint64 firstAdmission,uint32 occurrences,bytes body)` |
| L `admission(uint64)` | `0x7c7e9950` | ordinal; `(uint8 kind,uint16 leaf,uint64 publication,uint64 bindingOrdinal,uint32 expectedRevision,bool withdrawn,bytes32 a,bytes32 b)` |
| L `acceptanceBasis(uint64)` | `0xdbead0c1` | publish/reuse ordinal only; `(bytes32 typeId,uint16 activation,address mandatoryAcceptor,bytes32 ruleId,address policyAcceptor,bytes32 policyCodehash,uint64 epoch,uint64 activatedAt)` |
| L `evidence(uint64)` | `0x03e623e7` | publication1..8; `(address author,uint8 proofKind,uint8 v,uint16 leafCount,uint64 firstAdmission,bytes32 r,bytes32 s,uint64 nonce,uint64 deadline,uint64 basis,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)` |
| L `publicationOf(bytes32)` | `0xef2916d8` | sealed publicationId; returns common publication ordinal |
| L `head(bytes32)` | `0xf339e3b2` | derived binding key; `(uint8 state,uint32 revision,uint64 admission,uint64 previous,uint64 bindingOrdinal,bytes32 target)` |
| L `subjectCreatedAt(bytes32)` | `0xdc81edda` | S; returns5 |
| L `bindingPosition(uint64)` | `0x1d3e8aca` | binding ordinal1 or2; same HEAD position |
| L `positionCell(bytes32)` | `0x072945a8` | position; `(bytes32 purpose,bytes32 subject,bytes32 role)` = HEAD,S,0 |
| L `indexModule()` / `registry()` | `0x287ada37` / `0x7b103999` | sealed I/R |
| I `ledger()` | `0x56397c35` | sealed L |
| I `attachedFrom()` / `generation()` / `gapped()` | `0xa24a2e01` / `0x17219522` / `0x6d589fce` | `uint64 1` / `uint64 0` / `bool false` |
| I `lastProcessed()` / `lastPublication()` | `0xa5e01f37` / `0xa186ae71` | current highWater / common publication number |
| I `coverage(bytes32,bytes32)` | `0x88ee4687` | family,key (or Z, scope ignored); `(uint8 2,uint64 1,uint64 currentHighWater)` |
| I `postingHead(bytes32)` | `0x5cdd4bb0` | posting key; `(uint64 count,uint64 live,uint64 last,uint16 flags)` |
| I `postingWord(bytes32,uint64)` | `0x68830b72` | posting key, packed-word index0..ceil(count/5)-1; `uint256` |
| R `descriptor(bytes32)` | `0xb546ea55` | Type ID; `(bytes32 shape,bytes32 ruleId,address mandatoryAcceptor,uint8 refCount,uint16 activations,uint64 registeredAt)` |
| R `refTypes(bytes32)` | `0x64b69433` | Type ID; exact ordered `bytes32[]` |
| R `typeInfo(bytes32)` | `0x5b4e359b` | `(bool true,address mandatoryAcceptor,bytes32 ruleId,address 0,bytes32 0,uint8 refCount,uint16 1)` |
| R `epoch()` | `0x900cf0cf` | `uint64 4` |
| R `bindingRefType(bytes32,bytes32)` | `0x53e9c002` | HEAD,0; bytes32 zero |

Type registry rows: sealed graph descriptor/rule/refTypes, activation1, registration blocks4/5/6/7 (scan) or39/40/41/42 (selective). `acceptanceBasis`: exact Type, activation1, sealed mandatory rule/address, policy0/0, Type registration rank1..4 as epoch, its registration block as activatedAt. This reads the activation hidden by admission's abbreviated getter; avoid silently omitting it.

Admission expected row: `leaf` is zero-based action index; `publication` is common1..8; `withdrawn=false` throughout. PUBLISH(kind1): `a=bodyHash,b=typeId`; REUSE(kind2): `a=original Record ID,b=Z`; CREATE(kind5): `a=salt,b=Z`; BIND(kind3): `a=target,b=Z`, bindingOrdinal1 for A /2 for B, expectedRevision from action. Other binding fields are zero for non-BIND. Evidence uses literal sealed signature (proofKind2), action count, first ordinal, intent fields, signed nonce and actual scheduled publication **block** as basis. For any Record, firstAdmission is its first named occurrence, never overwritten by reuse; occurrences A1 becomes2 at common4, B1 becomes2 at common8, all other existing Records1.

B key formulas (all source-derived; EOA principal is left-padded account address, matching `graph.principals`):

```text
position = K(bytes32,bytes32,bytes32,bytes32; H("efs2/position/1"),HEAD,S,Z)
binding(author) = K(bytes32,bytes32,bytes32; H("efs2/binding/1"),principal,position)
scope(author) = K(bytes32,bytes32,bytes32,bytes32; H("efs2/vk/binding-scope/1"),principal,HEAD,S)
posting(type,kind,ordinal,value) = K(bytes32,bytes32,uint256,uint256,bytes32; H("efs2/pk/1"),type,kind,ordinal,value)
byType(T)=posting(T,1,0,Z); byAuthor(A)=posting(Z,4,0,principalA)
backlink(X)=posting(Z,5,0,X); history(A)=posting(Z,8,0,bindingA)
headScope(A)=posting(Z,10,0,scopeA); reference(X)=posting(QUOTE,11,0,X)
```

Families are `H("efs2/family/" + suffix + "/1")`, suffix `scope,history,backlink,by-type,by-author`; selective additionally `reference-position`. B scan reference family is not declared (coverage0,0,0); it must not be claimed complete. A packed posting word equals `sum(ordinal[j]*2**(48*(j%5)))` for its five entries, unused bits exactly0. Use whole words to reduce calls; head count proves exact list length. Audit lists (scope/history/selective reference) flags1 and live=count; ordinary by-Type/author flags0, live=count here; binding backlink flags0 and live reflects current heads. For empty heads require all four fields0.

## 4. C exact raw Store recipe

One call per full row is sufficient and avoids the left-aligned/trailing-byte issue of `getStaticField`. At target Ledger or Index use `getRecord(bytes32,bytes32[],bytes32)` selector **`0x419b58fd`**, args `(tableId,[key],fieldLayout)`, return ABI `(bytes staticData,bytes32 encodedLengths,bytes dynamicData)`. For non-dynamic rows require encodedLengths=0,dynamicData=`0x`. For every table here with one dynamic field of byte length n, require encodedLengths word `n | (n << 56)` and exact dynamic bytes. Integers within staticData and dynamic uint64 arrays are tightly packed **big-endian**, not ABI words. Full ABI encode/decode/re-encode equality catches offsets/padding/trailing bytes.

Exact reusable constants: `tableId = hex(UTF8("tb") || rightPad14(UTF8(namespace)) || rightPad16(UTF8(tableName)))`. `fieldLayout = hex(uint16BE(sum(staticWidths)) || uint8(staticWidths.length) || uint8(dynamicFieldCount) || rightPad28(bytes(staticWidths)))`. These reproduce literal constants in LedgerTables/IndexTables; verify all15 layouts once using `getFieldLayout(bytes32)` selector `0x3a77c2c2`. Keys are exactly one bytes32; ordinal keys are **left-padded uint256(ordinal)**, not left-aligned uint64.

| Target/namespace/table | key | static widths and exact fields in order | dynamic field0 |
| --- | --- | --- | --- |
| Ledger/efs/Records | recordId (including Type IDs) | `[32,8]`: typeId,firstAdmission | canonical sealed body |
| Ledger/efs/Admissions | padded ordinal | `[32,1,32,1,32,32,32,32,32,4,32]`: publicationId,kind,typeId,digestKind,digest,purpose,subject,role,target,expectedRevision,salt | none |
| Ledger/efs/Evidence | publicationId | `[32,1,32,32,1,8,8,32,32,32,8,2,8,32,32,32,1]`: author,proofKind,r,s,v,nonce,deadline,acceptanceProfile,indexObligations,actionsHash,firstAdmission,leafCount,basis,realmId,coreCodeCommitment,importOf,sourceGrade | none |
| Ledger/efs/Bindings | bindingKey | `[32,4,8]`: target,revision,admission | none |
| Ledger/efs/Subjects | S | `[32,32,8]`: creator,creatorSalt,admission | none |
| Ledger/efs/Types | Type ID | `[20,32,8]`: acceptor,acceptorCodehash,admission | ordered refTypes as concatenated bytes32 |
| Ledger/efs/Nonces | principal | `[8]`: last nonce | none |
| Ledger/efs/Counters | H("efs2/lab-c/counter/admissions") | `[8]`: highWater | none |
| Index/efsidx/Scopes | scopeKey | `[]` | concatenated triples author,role,bindingKey (32B each) |
| Index/efsidx/BindingHistory | bindingKey | `[]` | packed uint64 admissions |
| Index/efsidx/Backlinks | referenced Record ID | `[]` | concatenated fresh source Record IDs |
| Index/efsidx/ByType | Type ID | `[]` | concatenated unique fresh Record IDs |
| Index/efsidx/ByAuthor | principal | `[]` | packed uint64 admissions, **all kinds** |
| Index/efsidx/Occurrences | Record ID, including Type ID | `[4]`: count | none |
| Index/efsidx/Coverage | family | `[1,1,8,8]`: mandatory,declared,declaredAt,through | none |

There are15 table names in this matrix:8 Ledger +7 Index.

Admissions raw staticData is packed sealed action preceded by sealed publicationId, with no reader transform. Evidence is the exact signed intent/signature; proofKind2, `firstAdmission`, `leafCount`, `basis=firstAdmission-1`, sealed realmId and Ledger runtime codehash, importOf=0/sourceGrade=0. For Types also read Records(TypeID): typeId=H("efs2/lab-c/type-meta/2"), firstAdmission1..4, exact sealed descriptor body. Types acceptor/rule/refTypes come from graph. Type Occurrences=1. Type-declaration reference Types do **not** generate Record Backlinks; the `Effect.refs` vector is empty on KIND_DECLARE_TYPE.

C principal = `K(uint8,bytes32,address;1,Z,account)` (not B's padded address). Binding key=`K(bytes32,bytes32,bytes32,bytes32;principal,HEAD,S,Z)`; shared HEAD scope=`K(bytes32,bytes32;HEAD,S)`, with C HEAD=`H("efs2/lab-c/purpose/head")`. Prefer sealed bind action purpose/role to avoid cross-arm domain errors.

Additional scalar API calls (standard ABI results): Ledger `highWater()` `0xb09e8797` uint64; `index()` `0x2986c0e5` address; `indexCodehash()` `0xc32328ad` bytes32; `rulesEpoch()` `0xc28e1de8` uint32=1; `realmId()` `0x490423a3` bytes32. Index `ledger()` `0x56397c35`, `ledgerCodehash()` `0x409983ab`, `poisonConcept()` `0xe8f1e32e` bytes32=0, `generation()` `0x17219522` uint32=1. `coverage(bytes32,bytes32)` **same selector `0x88ee4687`, different result `(uint8,uint64)`**. Families are H("efs2/lab-c/index/"+suffix): `scopes,binding-history,backlinks,by-type,by-author,occurrences`; six raw rows `(1,1,0,0)`, API `(1,highWater)` after attachment. Optional `optional-digest` raw `(0,1,0,0)`, API `(2,0)` after highWater>0 (at highWater0 it is `(1,0)`). API scope argument can be actual requested scope/target or Z; source ignores it. At old-basis query after tail require reported through28>=basis25, but label frontier limitation above.

If reproducing reader's physical field calls separately, exact ABI is `getStaticField(bytes32,bytes32[],uint8,bytes32)` `0x8c364d59`, field0 typeId and field1 firstAdmission using Records layout `0x0028020120080000000000000000000000000000000000000000000000000000`; firstAdmission occupies the **first 8 bytes** of returned bytes32, whose other bytes need not be zero. `getDynamicFieldLength(bytes32,bytes32[],uint8)` `0xdbbf0e21` returns uint256 byte length; `getDynamicFieldSlice(bytes32,bytes32[],uint8,uint256,uint256)` `0x4dc77d97` takes field0,start,end byte offsets. These calls are optional independent observations, not evidence of the reader's internal call count.

## 5. Complete old/tail snapshot inventory

Enumerate Records in **first-admission order** from inputs.ordinalInventory, resolving reuse names to original IDs. Keep A3/U9 absent at old seal (optionally read their zero rows); Type Records in C are additional. Subject S, A/B HEADs, both histories, all scope entries, each author's posts, all four data Types and C TYPE_META, both P/Q reference postings, and Item-reference postings where C actually maintains them are included. Full snapshots must capture count **and complete list bytes/packed words**, not count alone.

| Inventory | Old seal | Current tail |
| --- | --- | --- |
| Fresh data Records, all arms | 16 | 18 (add A3,U9) |
| A1 occurrences / B1 occurrences | 2 /1 | 2 /2; all others1 |
| B Quote by-Type admissions | `[6,7,9,10,12,13,14,16,17,18,19,20]` | append `[22,23,24]` (15 total) |
| B ITEM / PAIR / OTHER by-Type | `[1,2]` / `[3,4]` / `[21]` | unchanged |
| B author A publish/reuse only | `[1,2,3,4,6,7,9,10,13,16,17,18,19,20,21]` | append `[22,23,24]` |
| B author B | `[12,14]` | unchanged |
| B selective reference(P) | first admissions `[7,10,14]` | `[7,10,14,22]` |
| B selective reference(Q) | `[6,9,13,16,17,18,19,20]` | append23 |
| B scan reference(P/Q) | empty /empty (not a maintained family) | empty /empty |
| C Quote ByType | IDs `[U1,A1,U2,A2,U3,B1,U4,U5,U6,U7,U8]` | append `[A3,U9]` (13 unique) |
| C ITEM / PAIR / OTHER / TYPE_META ByType | IDs `[I_ETH,I_USDC]` / `[P,Q]` / `[R1]` / `[typeITEM,typePAIR,typeQUOTE,typeOTHER]` | unchanged |
| C ByAuthor A | ordinals1..15,17,20..25 | append26..28 |
| C ByAuthor B | `[16,18,19]` | unchanged |
| C Backlinks(P) | IDs `[A1,A2,B1,R1]` | appendA3 |
| C Backlinks(Q) | IDs `[U1..U8]` | appendU9 |
| C Backlinks(I_ETH/I_USDC) | each IDs `[P,Q]` | unchanged |

B HEAD A=`(1,2,11,8,1,A2)`; B HEAD B=`(1,1,15,0,2,B1)`. A history `[8,11]`, B history `[15]`; respective HEAD scopes `[1]`/`[2]`. B binding backlink(A1) list `[8]`, count/live1/0; A2 `[11]`,1/1; B1 `[15]`,1/1; A3 empty0/0. All unchanged by tail and pages. B `positionCell` is shared and each bindingPosition points to it.

C Bindings A=`(A2,2,15)`, B=`(B1,1,19)`; histories `[12,15]`/`[19]`; shared scope triples `[principalA,Z,bindingA,principalB,Z,bindingB]`. Subject `(principalA,salt,9)`. C Backlinks(A1/A2/B1/A3) are empty because no Record in this graph references them; do not use those empties to infer absence of HEAD bindings. Current head-target counts are derived from Bindings as noted above. At intermediate common checkpoints, filter each expected list by executed action order, update HEAD on each bind, and include the old target's changed B live counter on the A1→A2 move.

## 6. Pages, bounds, and sources

For each page, run the sealed consumer call from account3 at pre-transaction numbered block with explicit sealed gas; require literal expected Page ABI bytes. Mine identical from/to/data/gas, join exact PageRead commitment log and receipt, repeat same call at mined receipt basis, and take post-page snapshot. Reuse no candidate-produced cursor. The next pre-state is the preceding verified post-state; no duplicate before-snapshot is needed. Page signature is sealed in inputs: `paidIncomingQuotes(address,bytes32,uint64,uint32,(address,address,bytes32,address,bytes32,bytes32,bytes32,uint8,bytes32,uint64,uint64,uint64))`, selector `0x65faab2b`; reader selector `0x9fe8fb7f`. C's Page status uses2 for complete even though C coverage API uses1. Retain post-page full snapshots or the smaller invariant subsets above; report checkpoint RPC counts separately from source-derived reader header/body counts.

**Recommended finite cap:8192 raw envelopes /64 MiB, no trace. Sufficient for this recipe; no cap increase needed before writer starts.** A simple stronger implementation can fit each full checkpoint, including new admission/evidence/acceptance rows, within100 calls: B current roughly70–90, C roughly85–95 (including raw coverage/API; layout/attachment/type metadata done at initialization). There are50 mutation/page checkpoints:24 common publications +1 C Types +25 pages, old/tail included rather than duplicated. Reserve≤200 initialization calls,≤50 pre/post page calls, and≤1400 transaction/header/code/startup envelopes when receipt polling is bounded to12 attempts/transaction. Conservative planning bound≤6650 envelopes. Generate/count the exact finite call map offline before sends; fail preflight if the actual plan exceeds this allocation. These are **planning upper bounds**, not measured request counts. Runtime/code/calldata/row payloads are small enough for64 MiB to be comfortable, but enforce both raw count and raw-byte caps while retaining failure output; do not report actual raw bytes until observed. No unbounded retry or debug trace fallback. Poll exhaustion stops; it does not authorize extra transactions.

Primary source pointers:

- B `src/Ledger.sol:422–479` evidence/nonces/counters; `557–575` Record/reuse/admission; `594–692` bind/create; `756–785` acceptance basis; `833–943` raw getters. `src/TypeRegistry.sol:88–120,143–188` descriptors/activations.
- B `src/IndexModule.sol:98–176` maintenance, coverage, heads/packed words; `src/Keys.sol:96–134` exact keys; `src/SelectiveReferenceIndexModule.sol:58–73` fresh Quote-only reference postings. `script/rollback-control.mjs:268–336` is a useful raw-call transport/probe example, not fixture authority.
- C `src/ActionLib.sol:113–177,198–223,255–269,322–335` nonce/evidence/admission/Type/fresh Record semantics; `src/EfsTypes.sol:190–230` C IDs/principals.
- C `src/tables/LedgerTables.sol:44–112,119–193,200–303,309–576` full row layouts; `src/tables/IndexTables.sol:28–98,101–394` postings and coverage; `src/IndexModule.sol:62–80,107–151` maintenance and synthesized coverage. `vendor/@latticexyz/store/src/IStoreRead.sol` exact overloaded ABI; `EncodedLengths.sol:46–52` one-field lengths.

The only unavoidable schema gaps are C's absent stored processed frontier and absent B-style binding-target live backlink counter. They are not missing evidence the runner can recover by issuing more calls; disclose them. The positive fixture can demonstrate synchronous observed mandatory maintenance for its touched graph, not general automatic-index conformance, authenticated state, arbitrary rollback, or full B/C schema parity.
