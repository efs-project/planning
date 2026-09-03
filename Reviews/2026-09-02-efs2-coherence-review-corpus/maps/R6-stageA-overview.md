# R6 — Stage A corpus overview map (status, report, B0 overview, bakeoff, traceability, spine edits, intake, standards, carry-in)

Lane: R6-stageA-overview · Reviewer date: 2026-09-02 · Vault read-only. All paths repo-relative to the planning vault.
Corpus root: `Reviews/2026-08-13-efs2-stage-a-corpus/` (abbreviated `SA/` below). Spine: `Designs/efsv2/`.

## 0. Headline

Stage A is a complete, red-teamed, **proposal-only** specification package (`SA/STATUS.md` "Status: done at the specification/evidence level; proposal-only; Stage B unrun"). Internally it is the most cohesive artifact in the vault: eighteen seam pins (`SA/chapters/b0-overview.md` §2), a 9-cell bakeoff with declared confounds (`SA/chapters/bakeoff-spec.md` §2), and a 151-row traceability whose counts I re-tallied and confirmed (`SA/chapters/traceability.md` §8). Its weakness is entirely at its edges: (a) **none** of its 16 proposed spine edits landed, so `Designs/efsv2/` README/constitution/candidate/kickoff still say what the corpus corrected; (b) the three current docs written the day after (`hierarchical-files-and-folders.md`, `layered-type-system-and-data-abi.md`, `web-client-os/README.md`, all 2026-08-14) and the owner's direct directions (2026-08-14→23) already require a **B0 successor** (BindingScope at genesis, Unicode 17 pin, RoutedAdmissionIntent, multi-controller Principals, MVP writes) that the frozen-corpus rule says would invalidate every bakeoff cell; (c) Stage B has no recorded PM release, no owner, no authorized repository, an expired Kanban card, and a competing implementation plan (`docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md`) that ignores the bakeoff. The honest position: B0 is solid enough to build a **disposable slice** on now; the 9-cell bakeoff is not on the MVP critical path and should not be treated as if it were.

## 1. Per-document summaries, standing, and defined terms

| Doc | Summary | Standing | Terms it defines / pins |
|---|---|---|---|
| `SA/STATUS.md` | Read-first status: verdict at protocol tip `6ea657e`, eight deliverables table, unclaimed list, four active gaps G-2..G-5 with homes, repair trail, "Next: run disposable Stage B". | current (`#status/done #kind/report`); per `Reviews/README.md` §"EFS 2.0 Core engineering pass — Stage A corpus (2026-08-13)": "No proposal was applied to `Designs/efsv2/`". | Counts: 151/127/20/4 rows; 9 cells; 10 fixtures/16 CV suites; GV-1..18, 14 CF/12 KA/7 AA; 16 spine edits; `ERC1271_VERIFY_GAS` measurement-pending. |
| `SA/stage-a-report.md` | One-page completion report; "James decision now: none"; "Next: run disposable Stage B". | current | none new |
| `SA/pm-stage-a-directive.md` | Verbatim 2026-08-12 PM directive: Stage A only, eight deliverables, execution defaults (silence never adopts; V2-E5 in scope; EAS loss-map deferred to V2-E8; EAP provisional; disposable contracts worktree allowed; challenge-window preserved, collision mechanics unfrozen; no dead-chain machinery; standards statuses corrected), "Stop after Stage A for review". | current (PM authority for Stage A) | Stage A/Stage B boundary. |
| `SA/chapters/b0-overview.md` | Umbrella over 8 subsystem chapters: §1 semantic model paragraph + seven B0 arm pins; §2 SR-1..SR-18 seam pins (SR pin wins over chapter text); §3 deliverable map; §4 stage boundary (no bytes, no measurements, no code); §5 five open items. | current-in-corpus, `#status/draft`, proposal-only | See §2 below. |
| `SA/chapters/bakeoff-spec.md` | 9-cell fractional design over 7 axes (96-cell valid lattice, not 128), five measured interactions, per-cell deltas, per-axis decision statistics + hard gates, build-once list, frozen-corpus rule, 4 engines, report/verdict protocol. | current-in-corpus, proposal | Cells B0,F1..F7,X17; arms E/S,U/T,P/R,A/B,I/L,M/D,O/W; statistics `KSTAR_1…I_17`; hard gates `RECON_1,V3_COPY,GATE_4,ONECALL_5,PFAIL_6,SIZE_6`; engines α/β/γ/δ; `DOM_BAKEOFF_*` domains. |
| `SA/chapters/traceability.md` | 151 rows over constitution bullets, 16 acceptance traces, 33 owner rulings, 37 survivor rows; §7 GAP register G-1..G-7; §8 tallies; §9 gate-coverage map (V2-E1..E5 + E8-partial; E6/E7 out). | current-in-corpus | Row IDs `C-*`, `AT-*`, `OR-*`, `S-*`, `G-*`; status vocab COVERED/DEFERRED(home)/GAP. |
| `SA/corpus/proposed-spine-edits.md` | 16 proposal-only edits A1-A4 (constitution), B1-B2 (README), C1-C9 (kickoff), D1 (owner-rulings), each with verbatim OLD→NEW text, label, and authority routing; contradiction ledger of 7. | current-in-corpus, **not applied** (verified §3 below) | Resolver outcome enumeration (A4), cause codes `UNAVAILABLE_SOURCE_BASIS, PARTIAL_REPLICA, PLAN_LIMIT_EXCEEDED, MISSING_REQUIRED_BASIS`; gate-coverage claim (C5). |
| `SA/corpus/intake-findings.md` | Transcription of the 2026-08-12 six-lane intake audit: IF-01..IF-45 (2 BLOCKING, 12 SERIOUS, 31 NOTE) with dispositions routed to chapters/deliverables/spine edits. | evidence-only (durable record of `scratchpad/audit-lanes.json`, which is not in the vault) | IF-nn IDs. |
| `SA/corpus/standards-audit.md` | FACT-vs-policy ledger: EIP-7825 live (16,777,216 gas cap), ERC-7913 Final, EIP-7951 live, EIP-170 24,576 bytes and EIP-7907 not in Fusaka, ERC-6492 Final, ERC-7930 Review, EIP-4444/7927 Stagnant, CBOR CDE-13 expired, RDFC-1.0 REC, etc. | evidence-only, reverified 2026-08-13 | Hard physics constants (§"Interfaces exposed"). |
| `SA/corpus/carry-in-register.md` | Labeled import ledger from July evidence: OR-1..7, DI-1..14, HY-1..5, RJ-1..4, PR-1..5, each with invalidation surface. | evidence-only | Register IDs; "now-or-never" reservation DI-4(b) (authority seam in the Envelope). |
| `Designs/efsv2/README.md` | Phone summary of EFS 2.0; layer diagram; "Current technical candidate" formula; Evidence map; Build order (6 steps); Hard holds; Status. | current (`README` is the layering authority) | `TypeSchema` as working name; Sepolia first dev Commons. |
| `Designs/efsv2/core-architecture-candidate.md` | Candidate primitives (Realm, TypeSchema, Record, Envelope/AdmissionIntent, Occurrence, AdmissionReceipt, Binding/withdrawal, Principal, Indexes, ResolutionPlan, Content profiles), 7 logical modules, 8-row alternatives table, 14 falsifiers, 9 open questions. | current, `#status/draft`, "Last touched 2026-08-12" | `RecordId = H(domain, typeSchemaId, canonicalBody)`; `PositionKey/BindingKey`; `AccountPrincipal/1`; module names Codex/RecordStore/Admission/Index/Binding/LensResolver. |

## 2. Lane Q1 — B0 exactly as the overview states it

**Objects** (`SA/chapters/b0-overview.md` §1): TypeSchema; Record (`RecordId = H(dom, typeSchemaId, canonicalBody)`); PublicationEnvelope (one Principal's signed ordered vector of Records); Occurrence `(EnvelopeId, leafIndex)`; AdmissionReceipt (one Realm's acceptance under policy/implementation revision + authority basis at a global AdmissionOrdinal); Binding (CAS-guarded answer at one logical position); mandatory indexes; ResolutionPlan (product name Lens) with FOUND/ABSENT/CONFLICT/UNSUPPORTED/UNKNOWN.

**Seven B0 arm pins** (§1 table): 1 immutable shared PublicationEnvelope; 2 uniform `bytes32 PrincipalId` + intrinsic zero-setup account Principal; 3 portable authored Envelope + separate Realm-bound AdmissionIntent; 4 Variant A one TypeSchemaId over meaning+shape+validation+roles+index specs; 5 inline canonical Record bodies committed via `recordIds[]`; 6 one atomic physical Core with internal libraries; 7 packed stable ordinals (uint64 ABI / uint48 physical).

**Identifiers and ID discipline** (SR-1, SR-2, SR-3, SR-6, SR-10, SR-14, SR-16): `DOM_X = keccak256("efs2/<name>/<version>")`; preimage `abi.encode(DOM_X, …fixed words, keccak256(variable parts))`; `EnvelopeId = keccak256(abi.encode(DOM_ENVELOPE, eip712EnvelopeDigest))` (witness bytes excluded); `IntentId = keccak256(abi.encode(DOM_INTENT, eip712IntentDigest))` under a full Realm-bound EIP-712 domain `EFS2-AdmissionIntent/1`; `occKey = keccak256(abi.encode(DOM_OCCURRENCE, EnvelopeId, uint256(leafIndex)))`; `PositionKey = keccak256(abi.encode(DOM_POSITION, purpose, subject, fieldRole))`; `BindingKey = keccak256(abi.encode(DOM_BINDING, principalId, positionKey))`; `PrincipalId = keccak256(abi.encode(DOM_PRINCIPAL, uint256(kind), keccak256(descriptorBytes)))`; `RealmRevisionId = keccak256(abi.encode(DOM_REALM_REVISION, realmId, keccak256(revisionDescriptorBytes)))`; `initConfigHash = keccak256(InitConfig/1 bytes)`.

**ABI words**: sole write entrypoint `publish(envelopeBytes, AccountPrincipal calldata principal, intentBytes, intentWitness)` (SR-12/SR-13); verifier `verify(AccountPrincipal, bytes32 digest, bytes witness, VerifyContext) → (AuthorityBasisWord, bytes32 codehashOrZero)` (SR-13); `AdmissionIntent/1 {realmId, envelopeId, leafMask uint64, action uint8 (MBZ=0), expectedRevisions[] (leafIndex uint16, revision uint32), nonceKey uint192, nonceSeq uint64, notAfter uint64}` (SR-3); reads `admissionLogPage(PageRequest)→PageResult`, `admissionAt(uint64)`, `admissionBatchIntentLane(batchId)`, `intentNonceOf`, `codexConstants()`, `genesisFacts()` (SR-3, SR-16, SR-18f); packed words `AuthorityBasisWord` (8+16+8+64+160 bits, SR-7), BindingHead slot 0 `state u8‖revision u32‖currentOrdinal u48‖targetKind u8‖tombstoneCause u8‖targetLeaf u16‖reserved u136` (SR-8, correction note), `OccStatus {status u8, ordinal u48, revokedAtOrdinal u48}` (SR-10); errors `E_NO_RESURRECTION(bytes32,uint16)`, `E_SELF_ENVELOPE_OCCREF`, `E_ENVELOPE_ORDINAL_EXHAUSTED()`, `ErrWithdrawNotAuthor`, `ErrPageCursor(uint256)`, `ErrSelectCursor(uint256)`, `U48_GUARD`; constants `MAX_ENVELOPE_LEAVES=64`, `MAX_ENVELOPE_BODY_BYTES=8,192`, `MAX_BODY_BYTES=8,192`, `REF_INSTANCES_MAX=16`, `KIND_DIGEST=0x09`, `MAX_PLAN_ENTRIES_CORE=64` (`SA/chapters/b0-lens.md` line 70), `ERC1271_VERIFY_GAS` = "200,000 measurement candidate; not frozen" (`SA/chapters/b0-principal-authority.md` line 662); kernel Types `{TYPE_BINDING_SET_V1, TYPE_BINDING_TOMBSTONE_V1, TYPE_WITHDRAWAL_V1}` plus intrinsic bootstrap `TypeSchemaGroup/1` (SR-11/SR-17); codec MC/1 "schema-directed fixed-width packed word encoding" (`SA/chapters/b0-encoding-and-ids.md` line 303).

**Contract split**: axis 6 arm M = one atomic physical Core, `LibIndex`/`LibBinding` as internal libraries (SR-10, bakeoff §3.7); alternative arm D = six physical contracts `Codex, RecordStore, Admission, Index, Binding, LensResolve` (bakeoff §3.7, from candidate lines 349-361).

**Fixed-for-comparison vs architecture**: `SA/stage-a-report.md`: "'Fixed' in this corpus means a controlled comparison input, not permanent architecture." Provenance table (bakeoff §3.1): arms 1,3,6,7 "candidate-leaning", arm 2 "candidate-ratified as baseline" (candidate line 258 "Bakeoff baseline"), arms 4 and 5 "**choice of convenience**". Every gas number is [HYPOTHESIS] (overview §4); SR pins are [PROPOSAL] unless labeled.

**Where names differ from the spine** (`Designs/efsv2/core-architecture-candidate.md` unless noted):
- `AdmissionIntent? {realmId, action, occurrenceRefs, nonce/expiry, authorization witness}` (lines 143-149) vs SR-3: `occurrenceRefs` → `envelopeId + leafMask`; `action` → "MBZ = 0 = ADMIT in B0 … the realm chapter's separate action/actionData table is retired for B0: admission effects are leaf-Type-driven".
- `Binding = {positionKey, targetRef | tombstone, predecessorOccurrence, revision}` (lines 216-220) vs SR-11: three separate kernel Types `BindingSet/1` (targetRecord OPTION(REF) / targetOccurrence OPTION(OCCREF) / predecessor), `BindingTombstone/1`, `Withdrawal/1`.
- `TypeSchema {bootstrapCodecVersion, semanticNamespaceOrSpec, canonicalBodyShape, constraints, referenceRoles[], indexSpecs[], structuralValidationProfile?}` (lines 71-79) vs SR-17: schemas enter as `TypeSchemaGroup/1` Records via ordinary `publish`, parsed by MC/1; `semanticNamespaceOrSpec` is the unfrozen axis 8 (bakeoff §1.4).
- `RealmRevision = H(RealmId + implementation/code basis + policy + generation)` (line 55) vs SR-16 descriptor-hash form; `AdmissionReceipt {…acceptedStatus}` (lines 194-201) vs SR-7 receipts resolved through a per-call `AdmissionBatch` + `OccStatus` overlay.
- Indexes "stable full-width-safe Record ordinal or store full RecordId" (line 284) vs B0 packed u48 ordinals (SR-4) with the RecordId form as arm W.
- `AccountPrincipal/1 = {authorityKind, originIfRequired, accountOrKey}` (line 241) vs SR-14: "The inline `abi.encode(kind, originRef, accountOrKey)` variant is retired."
- Constitution outcomes "`FOUND`, proved `ABSENT`, conflict, unsupported, or `UNKNOWN`" (`Designs/efsv2/system-constitution.md` lines 195-196, mixed case) vs B0 five upper-case outcomes; kickoff four outcomes (`fable-efs2-core-engineering-kickoff.md` line 61).
- `Designs/efsv2/layered-type-system-and-data-abi.md` uses `TypeRevisionId` 12 times and `TypeSchemaId` zero times (grep), although `Designs/efsv2/README.md` lines 71-72 says "`TypeSchema` is the current plain-language name; older files call similar concepts `TypeRevision`" and the constitution lists "the name `TypeRevision`" as deliberately not frozen (line 288).
- README's formula calls the third object "signed Envelope / immutable shared Context" (lines 59-69); B0 calls it `PublicationEnvelope/1`.

## 3. Lane Q2 — the 16 proposed spine edits, one by one (grep 2026-09-02 against `Designs/efsv2/*.md` + `Decisions.md`)

| # | Target / proposed wording | Applied? | Evidence |
|---|---|---|---|
| A1 | constitution Lenses: challenge-window / TOCTOU bullet | **Not applied** | `challenge-window`, `TOCTOU`, `equivocat` hit only `Designs/efsv2/owner-rulings.md` lines 51-53; constitution Lenses section (lines 189-203) unchanged. |
| A2 | constitution new §"Qualifying Realms and source availability" + `UNAVAILABLE_SOURCE_BASIS` | **Not applied** | zero hits for either string in spine docs. |
| A3 | constitution Authorship bullet adds "opt-in unlinkable personas" | **Not applied** | constitution lines 137-139 still "Key rotation, delegation, recovery, organizations, and future signature suites"; "unlinkable personas" hits only owner-rulings line 79. |
| A4 | constitution five point outcomes + cause codes; candidate UNSUPPORTED/UNKNOWN split; kickoff five outcomes | **Not applied (all three)** | constitution 195-196 unchanged; candidate 319-322 unchanged ("`UNKNOWN` is reserved for unsupported profiles…"); kickoff line 61 still `FOUND/ABSENT/CONFLICT/UNKNOWN`; zero hits for `PARTIAL_REPLICA`. |
| B1 | README Build order staged program | **Not applied** | `Designs/efsv2/README.md` lines 115-127 still the six-step list with step 4 "Run the focused Fable 5 pass plus independent … reviews" after prototyping/benchmarking. Consequential constitution freeze-discipline reword also not applied (lines 320-333 unchanged). |
| B2 | README "Fable program output — Stage A doc set" table | **Not applied** | zero hits for "Stage" anywhere in `Designs/efsv2/README.md`; Evidence map (lines 91-111) has no Stage A row. |
| C1 | kickoff fixture 1/8/32/64 + beneficiary negative + callback attack | **Not applied** | kickoff line 132 still "contract configuration: two Principals and a risk-bearer-pinned Lens;". |
| C2 | kickoff V2-E5 descriptor bullet | **Not applied** | zero hits for "self-contained Realm descriptor for a fresh qualifying L3". |
| C3 | kickoff eighth axis (analysis-only) | **Not applied** | kickoff axis list lines 73-84 still seven. |
| C4 | kickoff EAS-interop clause | **Not applied** | zero hits for "That ban covers v1-data compatibility". |
| C5 | kickoff gate-coverage paragraph | **Not applied** | zero hits. |
| C6 | kickoff succession hazards / output 7 seams / persona probe | **Not applied** | zero hits for "signature-suite succession hazards". |
| C7 | kickoff golden-vector adds + rail substitution | **Not applied** | zero hits for "canonical Resolution-Plan encodings"; golden-vector line 94-96 unchanged. |
| C8 | kickoff standards list adds EIP-712/7825/170/… + FACT/POLICY | **Not applied** | kickoff lines 148-153 unchanged; `EIP-7825`/`EIP-170` absent from all spine docs. |
| C9 | kickoff output 7 four-tier support matrix (flag for PM) | **Not applied / not dispositioned** | zero hits for "four-tier support matrix"; no PM disposition recorded in `Decisions.md`. |
| D1 | owner-rulings inline Aug-8 deterministic-IDs sentence | **Not applied** | "Verbatim from that ruling" absent; the sentence exists only in `Decisions.md` line 23. |

**Verdict:** 0 of 16 applied; none partially. `git log --since=2026-08-13 -- Designs/efsv2/` shows only the initial import (`c48f252`) and three new drafts on 2026-08-14 (`02bdae9` hierarchical Files, `da5fcc3` web-client-os spine, `5d1242e` layered Types). The spine is therefore behind the corpus on every contradiction the corpus's own ledger enumerated (`SA/corpus/proposed-spine-edits.md` §"Contradiction ledger", 7 rows), and behind the owner directions recorded 2026-08-14→23 in `Designs/web-client-os/README.md` §"Direct owner direction recorded for this round" (that doc's own "Upstream synchronization note (2026-08-14)" says so).

## 4. Lane Q3 — the 4 GAP rows and 20 DEFERRED rows, with homes and liveness

**GAP rows** (`SA/chapters/traceability.md` §6.2 + §7):

| Gap | Row | Named home | Live? |
|---|---|---|---|
| G-2 | S-RK6 recovery must not transfer funds custody/decryption | "future managed-Principal/KEL round" (`SA/STATUS.md`) / prin §6.2 G9 one-liner | **Orphan** — no Kanban card, no design folder; `Kanban.md` has no KEL/succession card (grep). |
| G-3 | S-RP3 recoverable-vs-shreddable tiers + KEM lifecycle | "privacy/crypto profile" / "Stage-B crypto round" | **Orphan** — no card; `Designs/efsv2/privacy*.md` are July evidence. |
| G-4 | S-RX5 foreign-contract adapter / local-commitment disclosure | "V2-E8-adjacent adapter work" | Partially live — `Kanban.md` line 21 backlog card "Fold portable schemas + validators + EAS interoperability into the active EFS 2.0 Core pass (@fable)" is V2-E8, but it names EAS interop, not the foreign-consumer adapter. |
| G-5 | S-RO8 pending/outbox never renders as admitted | "SDK result-model lane" / "SDK/result-model chapter" | **Orphan** — root `Designs/sdk-*.md` are v1 artifacts (e.g. `Designs/sdk-architecture.md` "Depends on: … ADR-0031 (lenses), ADR-0041 (PIN/TAG)", last touched 2026-06-20); no v2 SDK doc, no card. |

**DEFERRED rows** (20; first-token status, per §8):

| Row | Home stated in the row | Live work? |
|---|---|---|
| C-LY-2b Web Client build | V2-E6 vertical slice | Yes — `Designs/web-client-os/` (Kanban line 11 draft card); V2-E6 "waiting on evidence" in `Open-Decisions.md`. |
| C-LN-2b bounded-depth path profile | "post-B0 lens round" | **Orphan; not one of the eight homes** the table itself lists (§8 note iii). |
| C-LN-3b rich-lens→Plan compiler | client/lens-compiler lane | Orphan — no card. |
| C-LN-5b private personal trust policy | "OS/client lens lane" | Not one of the eight named homes; nearest live doc is web-client-os. |
| C-PS-2b sensitivity-policy layer | "client/OS lane; V2-E6 adjacency" | Not one of the eight named homes; web-client-os `privacy-and-agents.md` exists (unread here). |
| C-PS-4b AEAD/KEM construction + KATs | Stage-B crypto round | Orphan. |
| C-FS-1 three-host projection | mount lane; V2-F2 trace | Partially — `Designs/efsv2/hierarchical-files-and-folders.md` (Kanban line 15) owns the resolver contract; no host-adapter card. |
| C-FS-2 xattrs / lossless control surface | mount lane | as above. |
| AT-8b guest Arcade player/runner/cage | V2-E6 / Stage B client lane | web-client-os `app-runtime-and-direct-launch.md`; Arcade queue is held (`Open-Decisions.md` "Reconciliation hold"). |
| AT-9b Git gateway/guest UI/workspace | V2-E6 / Git client-profile lane | Kanban line 36-37 git-forge card claimed 2026-08-14, **expired 2026-08-17**; no `Designs/git-forge/`. |
| AT-14 three-host mount execution | mount lane | as C-FS-1. |
| OR-2 KEL design | future succession/KEL round | Orphan. |
| OR-G `act` delegation grant ABI | KEL round | Orphan. |
| OR-P persona model | KEL round | Orphan. |
| OR-R passkey recovery composition | KEL round | Orphan. |
| OR-M three-host mount | mount lane | as C-FS-1. |
| S-RP7 key-role separation rule | Stage-B crypto round | Orphan (row says the forbidden rule "is restated nowhere yet"). |
| S-RO10 three-host mount adopted | mount lane | as C-FS-1. |
| S-SUCC succession cluster | "future succession design round … freeze-blocking" | **Orphan and freeze-blocking**: V2-F1 blocks on a round nobody owns (§9 "V2-F1 feed … the succession vector classes (vf open item 8, freeze-blocking)"). |
| S-E2 censoring-relayer inclusion | V2-E7 venue matrix | Inbox V2-E7 + `Reviews/2026-08-13-claude-evidence-round/` venue evidence; no card. |

Net: of the eight "legal" homes (V2-E6, V2-E7, V2-E8-adjacent, mount lane, KEL/succession round, Stage-B crypto round, SDK/result-model chapter, client/lens-compiler lane), only V2-E6, mount lane, and V2-E8-adjacent have any live vault work; three rows name homes outside the eight-home list the table claims is exhaustive.

## 5. Lane Q4 — 9 cells vs README Build order and V2-E1..E8

- `Designs/efsv2/README.md` Build order step 2 names exactly one prototype pair ("self-contained Records versus immutable shared Context/Envelope normalization") = axis 1 (B0 vs F1). Steps 3-4 assume benchmarking precedes the Fable pass (B1 unapplied).
- Gate → cell mapping (traceability §9 + bakeoff §2/§6.1): **V2-E1** → F2 (thin branch, only `D5_2` measured); **V2-E3** → F1/F5/X17 (axes 1, 5); **V2-E4** → F4 (Variant B cell) + the ONE-bundle `M-AGG` snapshot on B0; **V2-E2** → **no cell** — Lens benchmarks "run ONCE on B0" (bakeoff §6.1); **V2-E5** → **no cell** — Realm descriptor/reconstruction is build-once; **V2-E6/E7** → out of scope by directive; **V2-E8** → seam only, no cell.
- Cells with no owner gate: **F3** (axis 3 publication domain — only constitution open question lines 348-350), **F6** (axis 6 physical deployment — only V2-F1's "contract/module boundary"), **F7 + X17** (axis 7 index pointer — only constitution "physical index layout, ordinal width" not-frozen line 292). Four of nine cells therefore answer questions no inbox item asks, while the two gates the owner queue actually lists as evidence-waiting for contracts (V2-E2, V2-E5) are not cells at all. Axis 8 (Type-schema namespace) is analysis-only with no cell and no gate (bakeoff §1.4, §5).

## 6. Lane Q5 — Stage A assumptions vs Files/Types/owner directions

| Stage A assumes | Neighbour says | Where |
|---|---|---|
| Principal = `AccountPrincipal/1`, "intrinsic zero-setup account Principal derived from an immutable authority reference"; managed Principals (multiple actors, rotation, delegation) are a later KEL round (`SA/chapters/b0-principal-authority.md` §6 "Scope guard: the managed-Principal mechanism itself (KEL redesign) is out of…"); account-Principal grading is constant `AUTH_OK` (SR-8). | Owner direction 7: "A Principal may have a mutable default/main controller account … `JamesCarnley.eth` may have three controller keys"; direction 8: "Multiple controller keys do not consume multiple Lens positions; key authorization belongs inside Principal verification" (`Designs/web-client-os/README.md` §"Direct owner direction", items 7-8). | Contradiction: the MVP client presumes a multi-controller Principal that B0 does not have and that the traceability defers to an unowned KEL round (C-AA-4, OR-2, G-2). |
| Axis 2 uniform-vs-tagged is open (bakeoff §4.2; traceability C-AA-5 "[PROPOSAL — B0 axis-2 pin; V2-E1 open]"; constitution open question line 337; owner-rulings 2026-08-12 OR-B8 "Open-not-ruled: PrincipalId API everywhere"). | Direction 7: "The client uses one uniform `PrincipalId` surface." (unconditional). `hierarchical-files-and-folders.md` line 121: "The uniform `PrincipalId` surface used below is the current V2-E1 experiment". | Product layer is directed; efsv2 still lists it open; owner-rulings.md does not record it (ledger ends 2026-08-12). |
| Files is not a Stage A artifact: C-FS-1/2, AT-14 DEFERRED(mount lane); FX-MOUNT narrowed to "canonical raw-manifest input seam only" (traceability §5 "Final … assembly report"). Name profile: on-chain accepts non-NFC bytes as distinct; "NFC is the convergence convention"; `UNICODE_PIN` "Unicode 16.0 proposed" (`SA/chapters/b0-encoding-and-ids.md` lines 414-416, 1484-1485). | `hierarchical-files-and-folders.md` §2.1: names are "1–255 UTF-8 bytes **after** NFC normalization; … candidate pin is Unicode 17.0.0, replacing rather than coexisting with B0's proposed 16.0 pin"; line 241-242 "a stored, signed, or citation constructor rejects non-NFC bytes"; line 699 "`BindingScope` must exist at Realm genesis"; lines 1161-1211 `RoutedAdmissionIntent` is a distinct successor to `AdmissionIntent/1`. Owner direction 9: "Canonical Files names use rich Unicode with NFC normalization." | Files requires a **B0 successor Codex** (new index kind at genesis, new intent kind, new Unicode pin) before any Files fixture; bakeoff §6.2 item 3: "Any corpus change invalidates every previously measured cell." |
| Type identity axis 4 Variant A is the B0 arm; Variant B = F4 cell with `IndexProfileId` + coverage state machine (bakeoff §3.5). | `layered-type-system-and-data-abi.md` proposes `TypeRevisionId`, `QueryProfileId`, `ViewQueryProfileId`, Views, and says B0 is "the simplest B0 control arm" (line 176); it is "a draft experiment target, not an adopted Type system" (README lines 75-80). | Agrees on comparison status; disagrees on names (`TypeRevisionId` vs `TypeSchemaId`) and is a third arm beyond A/B not in the 9-cell matrix. |
| V2-E6 out of scope; the first client is read-first (C-LY-2a COVERED, C-LY-2b DEFERRED); constitution open question "Does the first Web Client ship only read-only Files plus one Arcade view, or also explicit writes?" (line 358-359); inbox V2-E6 "Then decide whether the first Web Client also needs writes". | Owner direction 2: "The first MVP must be an official write-capable File Browser … so the client can also debug the evolving contracts." `web-client-os/README.md` line 317-321. | Owner decided writes; efsv2 constitution/inbox/owner-rulings still present it as open. |
| Lens Core cap `MAX_PLAN_ENTRIES_CORE = 64` [PROPOSAL], grid 1/8/32/64 (`SA/chapters/b0-lens.md` line 70). | Direction 8: "The contract Lens target is 64 Principal entries if measurement supports it." | Agrees. |

## 7. Lane Q6 — what blocks Stage B, who owns it, MVP critical path

**Recorded state:** `Kanban.md` line 42-43 In Flight card "Harden EFS 2.0 Core … (@fable / @codex-gpt-5) … Stage A … completed and independently gated 2026-08-13 … expires 2026-08-16; next: execute disposable Stage B bytes/prototypes/measurements … no owner ask". `SA/pm-stage-a-directive.md`: "Stop after Stage A for review." No entry in `Decisions.md` mentions Stage A or Stage B (grep); `Daily Notes/agent-status.md` line 201 is the executor's own completion note. So **no PM review verdict releasing Stage B is recorded anywhere**.

**Concrete blockers and owners (all currently unowned or expired):**
1. PM release of Stage B after the directed review — owner: PM (`vault-process`); not recorded.
2. Location: PM directive line 20 allows "a disposable contracts worktree/branch"; owner direction 11 says "reclaim `contracts`, `sdk`, `webclient`, and `drive` for active v2 … No rename or repository creation is authorized in this pass"; `hierarchical-files-and-folders.md` header "Proposed new repos: core, os, drive; contracts/client remain legacy evidence"; `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md` "Create a new sibling repository, provisionally named `core/`". Three incompatible answers; per the brief no EFS 2.0 code exists in any repo. Owner: James/PM.
3. Which Stage B: the 9-cell bakeoff (`SA/chapters/bakeoff-spec.md`, corpus manifest + toolchain pin "Closed by: harness lane" — no such lane/card exists) versus the superpowers plan (one monolith + `FilesRouter` + ERC-5219 adapter governed by `hierarchical-files-and-folders.md`, no reference to any cell, axis, or `SIZE_6`; 352 lines; no Kanban card; no Decisions entry). The plan also asserts "the partial Stage B monolith left only 4,707 runtime bytes while still omitting important mechanisms" (line 15) — no artifact preserved; UNVERIFIABLE, yet it is exactly the `SIZE_6` week-one fact the bakeoff says "can decide the axis alone".
4. Corpus-level prerequisites: `ERC1271_VERIFY_GAS` chosen per corpusVersion (`SA/STATUS.md`); Unicode pin 16.0 vs 17.0 ("No permanent Files bytes before V2-E1 closes and one Unicode pin is shared by MC/1 and Files", superpowers plan line 33-34); B0-successor delta for BindingScope/RoutedAdmissionIntent; EAP fixture provisional pending a Codex brief (bakeoff open item 5); the 2026-08-24 IPFS cold-guest trace added to Stage B by Kanban line 43.
5. The Principal model for the MVP (single-key AccountPrincipal vs the multi-controller Principal in direction 7) — owner: James.

**Critical path:** Owner direction 2 needs *some* v2 contract to write to; none exists. That makes **one disposable B0 slice + Files delta** (Engine α, B0 only, plus `SIZE_6` compile gate and the run-once V2-E2 Lens benchmark) MVP-critical. The **9-cell bakeoff is not**: `web-client-os/README.md` line 347-352 "Stage B implementation and conformance have not run. This design therefore depends on interfaces and outcomes, not those exact mechanisms. Adapters and shims must isolate the product from prototype churn"; `Designs/efsv2/README.md` step 6 "build the narrow direct Web Client/File Browser … behind an adapter so product work tests the model without freezing it by accident"; `mvp-and-acceptance.md` line 23-26 "A disposable empty-directory fixture may land first … The first adapter will necessarily track proposal-stage Core and Files". So the MVP can start behind an adapter on a disposable B0 slice, provided the slice is cut *after* the Files/Unicode/Principal deltas are decided (otherwise the frozen-corpus rule forces a re-run of everything measured).

## 8. Neighbour assumptions (does the neighbour say it?)

| About | Stage A assumes | Neighbour agrees? | Where |
|---|---|---|---|
| Core object model | candidate's primitives are the baseline to attack | partial — names diverge (§2) | candidate lines 143-149, 216-220 |
| Type system | axis 4 A/B only | partial — layered doc is a third arm with different names | `layered-type-system-and-data-abi.md` lines 176, 200-204 |
| Files | mount lane owns Files; B0 sufficient substrate | **no** — Files needs B0 successor Codex | `hierarchical-files-and-folders.md` lines 42-47, 133-135, 671, 699, 1161-1211 |
| Web Client/OS | V2-E6 out of scope, read-first, single-key Principals | **no** — MVP writes, multi-controller Principal, NFC names | `web-client-os/README.md` directions 2, 7, 8, 9 |
| App Store | not referenced | unknown | — |
| Arcade | FX-ARC generic traces are a headline fixture | partial — Arcade queue held; evidence round found no uniquely-EFS benefit (brief) | `Open-Decisions.md` holds; `Reviews/2026-08-13-claude-evidence-round/` |
| Media | not referenced | unknown | `Designs/media-library/` mentions Stage B (grep) |
| Git/forge | FX-GIT + AT-9a; product surface AT-9b to a "Git client-profile lane" | partial — card expired 2026-08-17, no design folder | `Kanban.md` lines 36-37 |
| SDK | G-5/S-G10 go to an "SDK/result-model chapter" | **no** — only v1 SDK docs exist | `Designs/sdk-architecture.md` header |
| mounts | mount lane exists | partial — Files doc + `mountable-filesystem-semantics.md`; no host-adapter work | `Kanban.md` line 15 |
| Realm/venue | V2-E7 out of scope; no venue | yes | `owner-decision-inbox.md` V2-E7; evidence round |

## 9. Decided / undecided / disagreeing

**Decided (ruling location):** greenfield successor, no v1 compat (`Decisions.md` line 23, 2026-08-08); Core/optional Commons/clients boundary, acceptance obligations, no Commons venue, contract-usable Lenses, mandatory indexing (`owner-rulings.md` §2026-08-12); item F equivocation limitation, no collision bit (`owner-rulings.md` lines 51-53); full-body spine/no elision (lines 67-68); three-host read-only mount (§2026-07-22); Stage A only, silence never adopts, V2-E5 in scope, EAS loss-map to V2-E8 (`SA/pm-stage-a-directive.md`); owner directions 1-28 (`web-client-os/README.md`) — disagreeing docs: constitution open question on writes (line 358-359), inbox V2-E6, constitution open question on PrincipalId (line 337), OR-B8.

**Undecided (suggested owner):** Stage B release/owner/location (PM + James); which Stage B program (PM); B0-successor re-cut before corpus mint (efsv2 synthesizer); Principal model for MVP — single-key vs managed (James); `ERC1271_VERIFY_GAS`, toolchain pin, corpus manifest (harness lane, nonexistent); Unicode pin 16 vs 17 (efsv2 + Files); A2 qualifying-Realm scope (James — but filed nowhere he will see it: not in `owner-decision-inbox.md`, `Open-Decisions.md` "Ask now: 0"); G-6 all-TypeSchemas enumeration (James; "carry into the James packet" — no packet exists); C9 four-tier support matrix fold-or-retire (PM); KEL/succession round, crypto round, lens-compiler lane, SDK result-model lane (unowned).

## 10. Defects and stale facts

- `SA/STATUS.md` "The repair series spans `48bf72d..6ea657e`": `git cat-file -t 48bf72d` → "Not a valid object name"; the vault's root commit is `c48f252` (2026-08-13). The pre-repair history is not in this repository.
- `SA/corpus/intake-findings.md`, `standards-audit.md`, `carry-in-register.md`, `proposed-spine-edits.md` mark evidence "VERIFIED (lane)" against `scratchpad/audit-lanes.json`; `find` shows no such file in the vault. `proposed-spine-edits.md` open item 6 admits survivor-row texts in C6/C7 were quoted only via that file.
- `proposed-spine-edits.md` C1/C3/C5/C6/C7 claim "PM adopted this amendment in the Stage-A reply (task directive, VERIFIED)"; `SA/pm-stage-a-directive.md` (the only preserved directive) contains no such adoptions.
- `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md` line 15 "partial Stage B monolith left only 4,707 runtime bytes" — no artifact, no card, no Decisions entry; contradicts `web-client-os/README.md` line 348 "Stage B implementation and conformance have not run" unless it refers to a discarded scratch build.
- `Designs/efsv2/README.md` §Status "The two active docs are `#status/draft`" is stale: `hierarchical-files-and-folders.md` is `#status/review` (line 13) and two more drafts exist; README indexes none of Stage A (the 2026-07-16 META ruling on README staleness, `owner-rulings.md` line 100, was the stated reason for B2).
- `traceability.md` §8 note (iii) claims "eight named homes, no orphan deferrals" but rows C-LN-2b ("post-B0 lens round"), C-LN-5b ("OS/client lens lane"), C-PS-2b ("client/OS lane") name homes outside the list.
- "127 COVERED" is quoted bare in `SA/STATUS.md`, `stage-a-report.md`, `Kanban.md` line 43, `agent-status.md` line 201; by the first-token rule it counts ≥12 rows whose own text carries a DEFERRED residual (C-LY-4, C-AA-4, C-PS-7, C-PS-8, AT-1, AT-8a, AT-9a, AT-15, AT-16, OR-4, OR-5, OR-B4, OR-B7, OR-12b, S-RX2, S-RL1). The table admits this (§8 note i); the summaries do not.
- Counts I could verify: 151 = 5+58+18+33+24+13 (re-tallied); 10 fixtures = FX-50GB/ARC/BROWSE/EAP/GIT/LENS/MOUNT/NANDA/PRIV/TOPIC; 16 CV suites (grep `CV-[A-Z0-9-]*` unique, excluding the bare token); packed-word arithmetic in the correction note (120+136, 8+16+8+64+160=256, 8+48+48=104, 16+48+48=112) is correct.
- Wiki-links `[[b0-encoding-and-ids]]`, `[[b0-authorship-envelope]]`, `[[b0-principal-authority]]`, `[[b0-realm-admission]]`, `[[b0-indexes]]`, `[[b0-binding]]`, `[[b0-lens]]`, `[[b0-content-locators]]`, `[[bakeoff-spec]]`, `[[traceability]]`, `[[harness-and-fixtures]]`, `[[vectors-and-falsifiers]]` resolve to files in `SA/chapters/`; B2's relative links from `Designs/efsv2/` resolve. `SA/corpus/redteam-findings.md` exists (133 KB).
- Line-number citations spot-checked and correct: constitution 137-139, 193-196, 202-203, 309, 324-330, 353-354, 358-359; owner-rulings 51-53, 67, 100, 121, 176-177; kickoff 61, 71-87, 132, 148-153, 160-173.
- Kanban In Flight: git-forge card expired 2026-08-17; Core hardening card expired 2026-08-16 (`Kanban.md` lines 37, 43).

## 11. Solid now / settle first / cut

**Solid enough to build a disposable slice on now:** SR-1 ID discipline and the closed domain table; SR-2/SR-3 Envelope + AdmissionIntent EIP-712 commitments; SR-10/SR-15 occurrence lifecycle + idempotent retry; SR-12/SR-13 single `publish` entrypoint with descriptor-before-witness; SR-16 byte-exact Realm bootstrap; SR-18f page-cursor grammar; the hard-gate list (`RECON_1, V3_COPY, GATE_4, ONECALL_5, PFAIL_6, SIZE_6`); the frozen-corpus rule; standards facts (EIP-7825 cap, EIP-170 limit, EIP-7951/ERC-7913 live/Final).

**Settle first:** (1) PM release + owner + location for Stage B; (2) cut the B0 successor delta (BindingScope at genesis, Unicode pin, RoutedAdmissionIntent kind) *before* minting any corpus; (3) the MVP Principal model (single-key vs managed) and record directions 2/7/8/9 in `owner-rulings.md`; (4) apply at least A1 and A4 (contract-facing semantics) and B1/B2 (process) so the spine stops contradicting the corpus; (5) run `SIZE_6` on whatever monolith exists and preserve the number.

**Cut for an MVP:** F2, F3, F5, F7, X17 branches and the F4 (γ) and F6 (δ) engines from the MVP critical path (keep them as the post-MVP V2-F1 program); EAP fixture (provisional); three-host mount execution; client 50/100/256 Lens grid; axis 8; the 64-row axis-1 sweep (run k∈{1,64} first as a smoke test — the spec forbids this for the *bakeoff*, not for an MVP slice).

## 12. Unverifiable from here

- The "4,707 runtime bytes" partial monolith and any Stage B code (brief: none in any repo).
- `scratchpad/audit-lanes.json` and the PM "Stage-A reply" adoptions of C1/C3/C5/C6/C7.
- Commit `48bf72d` and the pre-import repair history.
- STATUS "Independent scoped reviews approved the authority profile, long-horizon reconstruction, final Lens/digest interfaces, SR-3 retry semantics, and A2 owner-routing wording" — reviewer artifacts beyond `SA/corpus/redteam-findings.md` are not named.
- Whether Fable "when available" (stage-a-report) is a real scheduling constraint.
