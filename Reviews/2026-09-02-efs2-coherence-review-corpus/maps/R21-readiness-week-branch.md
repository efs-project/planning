# R21 — Core readiness week branch map (`origin/codex/v2-readiness-week`)

**Lane:** R21-readiness-week-branch · **Reviewer date:** 2026-09-03
**Branch:** `origin/codex/v2-readiness-week` (tip `2573f08` "design: recommend EFS v2 candidate engineering"), 4 ahead / 7 behind `main` (`234c3e6`), merge base `c4e0e f1`.
**Worktree (read-only):** `readiness`
**Citation form:** branch-only paths are prefixed `readiness:`; unprefixed paths are `main` at the planning vault. Nothing under the planning vault or any worktree was modified.
**Executed this session:** `node --test` in the EXP-C0/v0 control (52 top-level tests), `node Reviews/2026-08-25-efs2-exp-c0-cross-lane-acceptance/check-acceptance.mjs`, independent SHA-256 and count recomputation over `trace-manifest.json` and `hello-files-v0.json`, `git merge-tree --write-tree main origin/codex/v2-readiness-week`.

---

## 0. Headline

This branch is the single most consequential unmerged artifact in the vault and the only place where EFS 2.0 stops being prose. In 104 files / +27,101 lines it (a) rewrites four of the five current spine documents, (b) adds a 1,084-line readiness program with three explicit finish lines (`GO-CODE` / `GO-FREEZE` / `GO-DEPLOY`), (c) adds four exact `EXP-C0/v0` profile documents plus a plain-language `owner-guide.md`, (d) adds ~19,000 lines of executed JavaScript + Solidity control with vectors, and (e) manufactures the one owner item R19 said the vault had no bucket for — **V2-C1**, "authorize replaceable nondeployable candidate engineering," with literal reply forms.

Its honesty discipline is unusually good: the packet repeatedly refuses to overclaim (`exactExecutableTraceReplayCount: 0`, every G0–G6 gate `PARTIAL`, `goCodeAuthorized = false`). Every claim I could recompute without npm dependencies checked out **exactly** — 61 unique trace IDs, manifest SHA-256 `ec81918f…`, 57 projection entries over 27 populated kinds with kind 16 declared empty, payload SHA-256 `ac1651b0…`, and the cross-lane acceptance checker exits 0 against the real sdkv2 and data-explorer commits.

Two things nonetheless make it dangerous to accept at face value. **First, the executable evidence is not reproducible from the vault**: `src/model.cjs` requires `ethers` through `createRequire` pointed at a *sibling checkout outside the repository*, so the README's own "Evidence commands" fail — **41 of 52 top-level tests fail, 11 pass** in a clean environment, and no `package.json`, lockfile, or vendored module exists anywhere in the branch. **Second, the packet converts eight owner-queue items into "delegated candidate defaults" — including two axes the owner ledger and the owner's own 2026-08-23 directions explicitly left open** (Type/query identity; whether the first client ships writes) — on the authority of a "2026-08-23 travel-period authorization" and a "2026-08-25 top-to-bottom overnight direction" that **appear nowhere in `main`**: not in `Designs/efsv2/owner-rulings.md` (unchanged by this branch, still ending 2026-08-12), not in `Decisions.md`, not in web-client-os directions 1–28.

It merges into `main` with exactly **one** conflict, in `Daily Notes/agent-status.md`. It is not unmerged for technical reasons.

Maturity of this set: **candidate-for-freeze at the evidence-hygiene level, draft-unreviewed at the authority level.**

---

## 1. What the branch changes, by file

`git -C the planning vault diff --stat main...origin/codex/v2-readiness-week` — 104 files, +27,101 / −406.

| File | Δ | What it does |
|---|---|---|
| `Designs/efsv2/README.md` | +153/−? | Rewrites status to `technicalDisposition = RECOMMEND-GO-CODE`; replaces the "current technical candidate" formula (`PublicationSet` / `AdmissionPlan` / split `QueryProfile`); rewrites the six-step Build order into a five-step build-start ledger. |
| `Designs/efsv2/system-constitution.md` | +90 | Adds Realm-fork/execution-profile, ERC-1271-basis, block-hash-vs-number, and reconstruction-authentication bullets. **Deletes the entire `## Open questions` section (10 items) and replaces it with an 8-row "Candidate defaults and later gates" table.** |
| `Designs/efsv2/core-architecture-candidate.md` | +381 | Replaces `PublicationEnvelope`/`AdmissionIntent?` with `PublicationSet` + `SourceWitnessSidecar` + `PlanCore` + `AdmissionPlan` + `DestinationWitnessSidecar`; replaces the Type Variant A/B fork with "flat exact nominal Type + separate `QueryProfile`"; adds `QueryProfileActivation`; replaces the 8-row bakeoff table with an `EXP-C0` comparison inventory; **deletes the 9-item `## Open questions`**. |
| `Designs/efsv2/owner-decision-inbox.md` | +152 | Adds "Decide now — V2-C1"; adds "Delegated candidate defaults" holding V2-C2, E1, E2, E3, E4, E5, E8; **deletes V2-E6 entirely**; keeps V2-E7/F1/F2 as evidence-gated. |
| `Designs/efsv2/v2-contract-readiness-program.md` | +1084 (new) | The program: verdict, gate vector, `EXP-C0` selection table, three finish lines, G0–G6 gates each with a "Current state", seven ordered lanes, SDK and Data Explorer PM charters, kill criteria, end-of-week packet. |
| `Designs/efsv2/mvp-build-start-packet.md` | +275 (new) | The contraction: recommendation, candidate semantic surface (9 nouns), M0–M6 slices, "what is not an MVP blocker", "questions engineering should answer with code", "decisions that genuinely belong to the owner", stop conditions. |
| `Designs/efsv2/owner-guide.md` | +199 (new) | Phone-readable plain-language guide: nouns table, Alice-photo walkthrough, hyperstructure argument, "what is already adopted", "what remains genuinely open", "choices the owner should make later" (5). |
| `Designs/efsv2/exp-c0-v0-data-structure-profile.md` | +650 (new) | Exact candidate structures: `TypeSchemaEnvelope`, `TypeSchemaPayloadV0`, Realm/Principal/verifier, Plans/operations/admissions/effects, state collections, query/page/Lens inputs, the 28-collection reconstruction projection. |
| `Designs/efsv2/exp-c0-v0-result-api-profile.md` | +465 (new) | Literal `ResultV0`, the no-collapse `FactsV0` vocabulary, payloads, source-observation and byte-acquisition evidence, `CursorV0` (11 coordinates), Lens/result limits. |
| `Designs/efsv2/exp-c0-v0-codec-domain-bounds-vector-contract.md` | +346 (new) | `ABI-v2/0` canonical encoding, hash/identity domains, fixed disposable bounds, error precedence, vector bundle contract, clean-room contract, and the **All 61 trace obligations** table (8+23+4+14+9+3 = 61, verified). |
| `Designs/efsv2/exp-c0-v0-hello-files-trace.md` | +213 (new) | The literal `HELLO_FILES_V0` story: four Files Types, two-leaf publication, H0–H9 stage contract, observation rule, SDK/Explorer handoff, pass/stop conditions. |
| `Designs/efsv2/ethereum-standards-and-execution-profile.md` | +650 (new) | The five-way standards split (semantic constraint / accepted Realm execution profile / read-evidence profile / observed support / versioned adapter). |
| `Designs/efsv2/layered-type-system-and-data-abi.md` | +324 | Vocabulary repair: `TypeRevisionId` 12 → **0** occurrences; `TypeSchemaId` now used 11 times. |
| `Designs/efsv2/{large-file-uploads, ops-doctrine, fable-efs2-core-engineering-kickoff}.md`, `Designs/web3-standards-compliance.md` | small | Historical-evidence banners and status corrections. |
| `Reviews/2026-08-22-v2-contract-readiness-baseline/` | +242 (new) | Point-in-time evidence reconciliation; corrects "Stage B has not run" to "narrow disposable B0 runs exist". |
| `Reviews/2026-08-23-efs2-exp-c0-semantic-seal/` | +375 + 2624 (new) | The symbolic G2 spine: 61 traces, 38 result profiles, 13 illegal combinations, `trace-manifest.json`. |
| `Reviews/2026-08-25-efs2-exp-c0-cross-lane-acceptance/` | +62 + checker + tests (new) | The static cross-lane gate against SDK `57d04f8` and Explorer `8d90ecb`. |
| `Reviews/2026-08-25-efs2-exp-c0-v0-control/` | ~19,000 lines (new) | The executed control: 13 JS `src/` modules, 7 Solidity `src-sol/` contracts, 23 JS test files, 8 Solidity test files, 6 independent vector emitters, 5 vector JSONs, `lens-gas-v0.json`, `trace-coverage.json`, `hello-files-v0.json`, `handoff-v0.json`, `consumer-contract-v0.json`. |
| `Open-Decisions.md`, `Owner-Inbox.md`, `Kanban.md`, `Daily Notes/agent-status.md`, `scripts/open-decisions.sh`, `scripts/README.md`, `Designs/README.md` | small | Regenerated rollup (Ask now: 0 → **1**); Owner-Inbox rewritten to point at V2-C1; Kanban card refreshed; script gains a `**Reply forms:**` carry. |

Notably **unchanged**: `Designs/efsv2/owner-rulings.md` (git diff empty), `Designs/efsv2/hierarchical-files-and-folders.md` (empty), and all of `Designs/web-client-os/` except one `Designs/README.md` table cell.

---

## 2. Per-document standing

| Doc | Own status line | My standing | Load-bearing claim |
|---|---|---|---|
| `readiness:Designs/efsv2/README.md` | `#status/draft` §Status | **current spine head on this branch**, honest | "`EXP-C0` is now the one reversible engineering control… It proves selected exact preimages and invariants, not complete replay: its claim ledger still reports zero fully bundled trace executions and no protocol conformance." |
| `readiness:Designs/efsv2/system-constitution.md` | `#status/draft`, Last touched 2026-08-23 | **current**, but its Open-questions deletion is the branch's biggest authority move | §"Candidate defaults and later gates", row "First product loop": "Direct no-wallet raw Explorer plus minimum read-only Files profile. Writes, Arcade polish, extensions, and OS mount integration follow the lossless Reader seam." |
| `readiness:Designs/efsv2/core-architecture-candidate.md` | `#status/draft`, 2026-08-25 | **current comparison target**; `**Depends on:**` checkbox still unticked in its own pre-promotion list | §"`EXP-C0` comparison inventory" + the 2026-08-25 build-start routing correction block. |
| `readiness:Designs/efsv2/owner-decision-inbox.md` | reference, Last reconciled 2026-08-25 | **current queue**; V2-E6 dangling | "V2-C1 is the one remaining owner build-start choice." |
| `readiness:Designs/efsv2/v2-contract-readiness-program.md` | `#status/draft`, 2026-08-25, Reviewers @codex-gpt-5 | **draft-unreviewed by anyone but its author lane** | Gate vector: all seven gates `PARTIAL`, `boundedSameSourceLockSubgate = PASS`, `exactExecutableTraceReplayCount = 0`. |
| `readiness:Designs/efsv2/mvp-build-start-packet.md` | `#status/draft`, 2026-08-25 | **current contraction**; the actual owner-facing packet | "The evidence ledger still reports zero of 61 sealed semantic traces with a complete literal request/result/pre-state/post-state replay bundle." |
| `readiness:Designs/efsv2/owner-guide.md` | `#status/reference`, 2026-08-23 | **reference**, and the best-written doc in the vault for its audience | §"What remains genuinely open" bullet 10: "the first permanent product and **whether its Web Client includes writes**". |
| `readiness:Designs/efsv2/exp-c0-v0-*.md` (4) | `#status/draft`, NON-DURABLE/NON-CONFORMANT | **current disposable profiles**, correctly labelled | 28-collection projection; `ResultV0`; ABI-v2/0 domains and bounds; 61-trace obligation table. |
| `readiness:Designs/efsv2/ethereum-standards-and-execution-profile.md` | `#status/draft`, 2026-08-25, Reviewers named | **current**, the cleanest standards-boundary doc in the vault | Five distinct standards uses that "must not collapse". |
| `readiness:Reviews/2026-08-22-v2-contract-readiness-baseline/README.md` | `#status/done` | **evidence**, partly unverifiable (see §11) | "Integrated current-greenfield Stage B: unrun." |
| `readiness:Reviews/2026-08-23-efs2-exp-c0-semantic-seal/README.md` | `#status/done` | **evidence**, independently checkable and it checks out | 61 traces, manifest digest, "three final reviewers report no P0/P1". |
| `readiness:Reviews/2026-08-25-efs2-exp-c0-cross-lane-acceptance/README.md` | `#status/done` | **evidence**, reproducible (checker exits 0 here) | "no unresolved P0/P1 truth or read-ABI mismatch"; `unresolvedP0: 0`, `unresolvedP1: 0`. |
| `readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md` | disposable partial invariant control | **evidence with a reproducibility hole** (see §3) | "`trace-coverage.json` is the claim ledger… `exactExecutableTraceReplayCount` remains zero." |
| `readiness:Open-Decisions.md` | GENERATED 2026-08-25 | **current view**; silently drops 7 items (see §11) | "Ask now: 1"; efsv2 live items 10 → **4**. |

---

## 3. Lane Q1 — What `EXP-C0/v0` actually ran, and what it did not

### 3.1 The artifact

`readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/` contains: 13 JavaScript modules under `src/` (`model.cjs` 770 lines, `hello-files-v0.cjs` 1,714, `query-projection-v0.cjs` 1,261, `result-v0.cjs` 730, `type-interpreter-v0.cjs` 538, `realm-launch-v0.cjs` 396, `plan-v0.cjs` 295, `read-request-v0.cjs` 295, `acquisition-evidence-v0.cjs` 254, `source-observation-evidence-v0.cjs` 250, `lens-v0.cjs` 136, `principal-comparator-v0.cjs` 112); 7 Solidity contracts under `src-sol/` (`ExpC0TypeInterpreter.sol` 327, `ExpC0Codec.sol` 317, `ExpC0TransitionControl.sol` 317, `ExpC0ResultCodec.sol` 196, `ExpC0PlanCodec.sol` 177, `ExpC0LensControl.sol` 156, `ExpC0PrincipalComparator.sol` 82); 23 JS test files and 8 Foundry test files; six *independent* vector emitters under `scripts/`; and five pinned vector JSONs.

### 3.2 What is claimed proved

`readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md` claims, in scope-limited language:
- independent JavaScript and Solidity reproduce the **essential IDs, Plan/Effect/Operation IDs, three literal `ResultV0` vectors, the 11-coordinate cursor, and the projection root**;
- the Type interpreter rejects noncanonical offsets/field order, hidden nonzero values in absent optionals, malformed/trailing ABI bytes, wrong-Type reference targets, limits, duplicate/zero field keys, unknown scalar/reference/representation codes;
- the Lens control implements `FIRST_FOUND_AFTER_PROVED_ABSENCE` at 1/8/32/64 Principals with an immediate stop on `UNKNOWN | CONFLICT | UNSUPPORTED | basis mismatch`;
- `HELLO_FILES_V0` composes one literal story across 28 accounted collections with raw-retaining SDK/Explorer adapter views.

### 3.3 The exact numbers

**Gas** (`readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/lens-gas-v0.json`), `forge 1.7.1`, `solc 0.8.30`, `evmVersion: osaka`, optimizer on / 200 runs, via-IR, scenario "last principal FOUND after every earlier principal ABSENT_PROVEN":

| Principals | cold (first resolve) | warm (immediately repeated) |
|---:|---:|---:|
| 1 | **30,504** | **7,699** |
| 8 | **92,369** | **30,113** |
| 32 | **314,759** | **108,979** |
| 64 | **616,577** | **220,280** |

Its own `claimScope`: "Disposable monolithic mapping-backed point resolver only. Excludes transaction intrinsic gas, calldata pricing, plan registration, cross-contract Core calls, proof verification, final ABI selection, and production storage topology."

**Principal comparator** (same README §"V2-E1 Principal-surface comparator"): ABI sizes 160 B uniform EOA descriptor / 192 B fixture ERC-1271 descriptor / 32 B steady-state uniform author key / 64 B tagged author ref; gas — identity derivation 1,089 uniform vs 481 tagged; first keyed write 44,700 vs 44,893; representative post-write read 2,496 vs 2,708; managed-association write 66,889 vs 67,892. Explicitly "exclude signature verification and first-use `PrincipalRecord` persistence."

**Trace ledger** (`trace-coverage.json`, recomputed by me): 61 traces, of which **30 `EXECUTABLE_CONTROL` (every one scoped `PARTIAL_INVARIANT_CONTROL`) and 31 `DESIGN_ONLY`**; `allTraceVectorBundlesComplete: false`; `protocolConformance: false`; **`exactExecutableTraceReplayCount: 0`**. All 14 ERC-1271/EIP-7702 authority traces (`P4A`–`P5D`) and all Realm-branch traces (`R3A`–`R5`) are `DESIGN_ONLY`; 11 of 14 Query traces are `DESIGN_ONLY`.

**Fixture self-consistency** — recomputed independently this session:
- `trace-manifest.json`: 61 trace IDs, 61 unique; SHA-256 = `ec81918f0e97e91d9e0c17babad704665a25889d92145ac4adedf6b91830fedd` — **matches the README's declared digest byte for byte**; 38 result profiles, 13 illegal combinations.
- `hello-files-v0.json`: `payload.projection.entries` = **57**; distinct `collectionKind` values = **27** (1–15, 17–28), i.e. kind 16 `WITHDRAWALS` absent exactly as declared; declared `payloadSha256` = `ac1651b08e1cd120adb3fd47062d2bb4858c5a4fa59743e11ac3d6c46c731969` — **matches** my recomputation under both canonical-key-sorted and as-written JSON.
- 61-trace obligation table group counts (`readiness:Designs/efsv2/exp-c0-v0-codec-domain-bounds-vector-contract.md` §"All 61 trace obligations"): 8 + 23 + 4 + 14 + 9 + 3 = **61**. Correct.
- `check-acceptance.mjs` runs clean and exits 0: `coreCommit b9088d6a…`, `sdkCommit 57d04f85…`, `explorerCommit 8d90ecbf…`, `commonReceiptSha256 c750a63b…`, `unresolvedP0: 0`, `unresolvedP1: 0`, `vendoredInputCountPerLane: 5`.

### 3.4 What is explicitly **not** proved (the packet says so itself)

`readiness:Designs/efsv2/mvp-build-start-packet.md` §"Current build-start checkpoint": "**The evidence ledger still reports zero of 61 sealed semantic traces with a complete literal request/result/pre-state/post-state replay bundle.** The vertical fixture is integration evidence, not a disguised replay claim." `readiness:Designs/efsv2/v2-contract-readiness-program.md` §"Verdict" gate vector: `G0`–`G6` all `PARTIAL`, `explorerE1a = NOT_PROVEN_BY_THIS_CONTRACT`, `explorerE1b = NOT_RUN`, `runtimeDependencyTrace = NOT_RUN`. The control README's §"Remaining work" adds: no generic Solidity `ABI_TUPLE_V0` runtime parser ("this control closes only literal `T_NOTE` in Solidity"), no QueryProfile activation/backfill transitions, no exact EOA/ERC-1271 verifier transcripts, no reconstruction from genuinely complete serialized state, no browser evidence.

### 3.5 What I could not reproduce, and why

`node --test` in that directory (Node v22.22.2): **11 pass, 41 fail, 52 total, 617 ms.** Every failure is the same root cause:

```
# Error: Cannot find module 'ethers'
#     at Object.<anonymous> (.../Reviews/2026-08-25-efs2-exp-c0-v0-control/src/model.cjs:16:46)
```

`readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/src/model.cjs` lines 9–16:

```js
const efsRoot = path.resolve(__dirname, '../../../..');
const ethereumRequire = createRequire(path.join(efsRoot, 'contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
```

with the comment "This disposable control deliberately reuses the already-installed Ethereum toolchain from the sibling contracts repo." That resolves to `<vault-parent>/contracts/package.json`. In this environment `/home/user/contracts` does not exist; the real v1 repo is `contracts` (sibling clone), whose `package.json` exists but whose `node_modules/ethers` is **not installed**. There is no `package.json`, no lockfile, no vendored dependency, and no version pin anywhere in the branch (`find . -name package.json` returns nothing). The only tests that pass are the ones that touch no crypto: `coverage.test.cjs`, `handoff-v0.test.cjs`, `lens-gas-v0.test.cjs`, `type-interpreter-vector-generator.test.cjs`, plus four ethers-free subtests inside otherwise-failing files.

`forge` is not installed either (`forge: command not found`), so the Solidity side — including every gas number in `lens-gas-v0.json` and the "Solidity 35/35" claim in `readiness:Daily Notes/agent-status.md` 2026-08-25 — is **UNVERIFIABLE from here**.

**Net:** every *declarative* claim I could check is exactly true. The *differential agreement* between JavaScript and Solidity, and every gas figure, rest on a harness that cannot be run from a clean checkout of the planning vault, against a dependency version nobody pinned, resolved through a path that points into the deployed-v1 repository the 2026-08-08 greenfield ruling made evidence-only.

---

## 4. Lane Q2 — Relationship to Stage A B0 and the 9-cell bakeoff

**EXP-C0 is neither Stage B nor a third program: it is a silent successor to B0 that never names what it supersedes.**

`readiness:Designs/efsv2/v2-contract-readiness-program.md` mentions Stage A exactly three times — as an `**Evidence baseline:**` header value (line 8), as one row of the starting-evidence table ("Stage A corpus | Broad requirements, fixtures, traceability, candidate formulas, and falsifiers | Executable conformance or selected bytes", line 145), and in the wording correction at line 169: "'Stage B has not run' should be corrected to 'narrow disposable B0 runs exist; current-greenfield integrated Stage B and freeze evidence do not.'" **`SR-1`…`SR-18` are never mentioned on this branch at all** (zero grep hits across all changed efsv2 docs and all four new Reviews). The 9-cell bakeoff (`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/bakeoff-spec.md`) is never named.

Against the seven B0 arm pins (`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md` §1 table):

| B0 arm pin | `EXP-C0` disposition on this branch | Where |
|---|---|---|
| 1 immutable shared `PublicationEnvelope` | **Replaced** by `PublicationSet` + `SourceWitnessSidecar`; the witness signature is now *excluded* from the identity it attests | `readiness:Designs/efsv2/core-architecture-candidate.md` §"Portable source graph and destination Admission Plan" |
| 2 uniform `bytes32 PrincipalId` + zero-setup account Principal | **Survives** (and is promoted to a delegated default) | `readiness:Designs/efsv2/owner-decision-inbox.md` §V2-E1 |
| 3 portable Envelope + Realm-bound `AdmissionIntent` | **Renamed and restructured** into `PlanCore` + `AdmissionPlan` + `DestinationWitnessSidecar`; `AdmissionIntent` no longer appears in any current spine doc on the branch | same §; grep: `AdmissionIntent` survives only in `v2-contract-readiness-program.md`, `layered-type-system-and-data-abi.md`, `hierarchical-files-and-folders.md`, `fable-efs2-core-engineering-kickoff.md`, and three `web-client-os/` files |
| 4 Variant A — one `TypeSchemaId` over meaning+shape+validation+roles+**index specs** | **Rejected in its index half.** `EXP-C0` keeps meaning/shape/representation/constraints/closed roles in Type identity but moves index policy into a separately versioned `QueryProfile` — i.e. neither Variant A nor Variant B as Stage A framed them | `readiness:Designs/efsv2/core-architecture-candidate.md` §"Type Schema" and §"Indexes"; `readiness:Designs/efsv2/system-constitution.md` §"Candidate defaults" row "Type and indexes" |
| 5 inline canonical Record bodies committed via `recordIds[]` | **Flipped**: "Publication leaf | exact `RecordId` with the Record body state-readable on admission \| one inline-body trace; reopen if extraction or atomic availability cannot be proved" | `readiness:Designs/efsv2/core-architecture-candidate.md` §"`EXP-C0` comparison inventory" |
| 6 one atomic physical Core with internal libraries | **Survives** as "one atomic monolithic disposable Core" | same table |
| 7 packed stable ordinals (uint64 ABI / uint48 physical, SR-4) | **Flipped**: "Index pointer \| full `RecordId` in semantic traces; ordinals are physical optimization only \| prove any ordinal is full-width safe, state-readable, and identity-neutral before using it" | same table |

So **four of the seven B0 arms are changed** (1, 3, 4-in-part, 5, 7), and the bakeoff's own frozen-corpus rule (`bakeoff-spec.md`) says a B0 change invalidates every cell. No document on the branch says the 9-cell bakeoff is retired, superseded, or re-cut. The `Stage A corpus` row in the readiness program's evidence table still lists Stage A as a live evidence source without recording that its B0 arm pins no longer match the candidate. **All 16 Stage A proposed spine edits remain unapplied on this branch too** — I re-ran R6's grep battery: `UNAVAILABLE_SOURCE_BASIS`, `PARTIAL_REPLICA`, `PLAN_LIMIT_EXCEEDED`, `MISSING_REQUIRED_BASIS`, "self-contained Realm descriptor for a fresh qualifying L3", "That ban covers v1-data compatibility", "signature-suite succession hazards", "canonical Resolution-Plan encodings", "four-tier support matrix" are all **zero hits**; the constitution's Lens outcome line 214 is still the unrepaired mixed-case "`FOUND`, proved `ABSENT`, conflict, unsupported, or `UNKNOWN`". The branch rewrote 90 lines of the constitution and repaired none of A1–A4.

**Versus `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md` (main).** That plan and this branch are two independent, mutually unaware Stage-B implementation programs. The plan's Architecture says "Create a new sibling repository, provisionally named `core/`. Begin with one state-owning Core contract assembled from internal libraries, plus separately deployed `FilesRouter` and ERC-5219 compatibility adapter"; "Tech Stack: Foundry, Solidity 0.8.34 …, Bun/TypeScript, Rust stable, Anvil, viem"; "Governing draft: `Designs/efsv2/hierarchical-files-and-folders.md`". The branch's control uses **solc 0.8.30 / Node+ethers / no Rust**, names **no repository at all** for candidate code (`readiness:Designs/efsv2/mvp-build-start-packet.md` `**Target repos:**`: "planning and disposable SDK/Explorer fixtures; real contracts, SDK package, and client implementation only after an owner `V2-C1 YES` ruling"), governs itself by `mvp-build-start-packet` M0–M6 rather than the Files doc, and explicitly makes physical topology a `GO-FREEZE` question — where the plan already commits to a `FilesRouter` + adapter split. Neither document cites the other. Nothing on the branch retires the plan.

---

## 5. Lane Q3 — Main-branch problems: resolved / partial / left

| # | Main-branch problem | Branch verdict | Citation |
|---|---|---|---|
| **(a)** Constitution open question "does the first Web Client ship writes?" | **Resolved in the wrong register, and self-contradicted.** The question is deleted; the replacement default is *read-only first*: "First product loop \| Direct no-wallet raw Explorer plus minimum **read-only** Files profile. Writes… follow the lossless Reader seam." But `owner-guide.md` on the same branch still lists "the first permanent product and **whether its Web Client includes writes**" under "What remains genuinely open", and `hello-files-trace.md` says "The first Explorer fixture is read-only. Candidate write UX begins only after…". Meanwhile `main`'s owner direction 2 says the opposite. | `readiness:Designs/efsv2/system-constitution.md` §"Candidate defaults and later gates"; `readiness:Designs/efsv2/owner-guide.md` §"What remains genuinely open"; `readiness:Designs/efsv2/exp-c0-v0-hello-files-trace.md` §"SDK and Explorer handoff"; `Designs/web-client-os/README.md` direction 2 |
| **(b)** V2-E1..E8 as evidence gates vs delegated defaults | **Converted, with one deletion.** V2-C2, E1, E2, E3, E4, E5, E8 move to "Delegated candidate defaults — reopen only on a named falsifier"; E7/F1/F2 stay evidence-gated; **V2-E6 is deleted with no disposition row.** Each delegated item carries a written reopen condition, which is genuinely better practice than an undifferentiated queue — but three of them decide axes the owner ledger marks open (§6). | `readiness:Designs/efsv2/owner-decision-inbox.md` §"Delegated candidate defaults" |
| **(c)** Uniform `PrincipalId` | **Resolved as a delegated default, with a real comparator behind it** (both arms executable; ABI sizes and four gas rows measured; falsifier written: "Reopen only if aggregate first-admission descriptor/verification cost or developer complexity exceeds the candidate budget"). It matches owner direction 7's client-side statement. It does **not** yet address direction 7's "mutable default/main controller account" half, which the comparator's own §"Comparator ambiguities kept explicit" concedes: "The association test proves only prospective key continuity and zero history rewrites. It does not implement managed authority, recovery, delegation, or succession policy." | `readiness:Designs/efsv2/owner-decision-inbox.md` §V2-E1; `readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md` §"V2-E1 Principal-surface comparator" |
| **(d)** 64-Principal Lens and its gas | **Measured — this is the branch's cleanest single contribution.** 1/8/32/64 cold 30,504 / 92,369 / 314,759 / 616,577 and warm 7,699 / 30,113 / 108,979 / 220,280, with a named toolchain, a `measurementProvenance` block including the reproducing command and an `inputsSha256`, and an explicit exclusion list. Owner direction 8's "64 Principal entries if measurement supports it" now has a number to argue about. The measurement excludes transaction intrinsic gas and calldata, so the *end-to-end* answer to direction 8 is still open. | `readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/lens-gas-v0.json`; `Designs/web-client-os/README.md` direction 8 |
| **(e)** Stage A spine edits A1–A4 / B1 / B2 / C1–C9 | **Left entirely.** 0 of 16 applied, same as `main` (verified by grep battery, §4). The branch rewrote the constitution and README without integrating any of the repairs the corpus proposed for exactly those files. | §4 above |
| **(f)** One agreed MVP sequencing | **Partially resolved, and now three-way contested.** The branch supplies a real sequence (M0 handoff → M1 Core skeleton → M2 write spine → M3 read spine → M4 SDK → M5 Explorer guest → M6 minimum Files) with exit conditions. But `main` still carries `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md` (Files-first, `core/` repo, Rust, 0.8.34) and `Designs/web-client-os/mvp-and-acceptance.md` (write-capable File Browser). Three sequences, none retiring another. | `readiness:Designs/efsv2/mvp-build-start-packet.md` §"First implementation slices" |
| **(g)** Repository plan (`core`/`os`/`drive` vs reclaim `contracts`/`sdk`/`webclient`/`drive`) | **Left.** The branch names no repository. `mvp-build-start-packet.md` says only "real contracts, SDK package, and client implementation only after an owner `V2-C1 YES` ruling"; `v2-contract-readiness-program.md` §"Implementation notes" says experiment code "belongs in the existing local disposable Stage B repository or a clean child worktree". Owner direction 11 (reclaim `contracts`, `sdk`, `webclient`, `drive`) is not cited anywhere on the branch. So V2-C1 authorizes "candidate engineering" without saying where it happens. | `readiness:Designs/efsv2/mvp-build-start-packet.md` header; `readiness:Designs/efsv2/v2-contract-readiness-program.md` §"Implementation notes"; `Designs/web-client-os/README.md` direction 11 |
| **(h)** Complete directory enumeration / `BindingScope` | **Substantially advanced.** `BindingScope` is now an exact candidate structure with a keyed scope row `(publisherPrincipalId, PURPOSE_FILES_NAME_SLOT_V1, rootDirectoryRecordId, scopeOrdinal)`, an executable control, and an explicit falsifier: "A global per-Principal scope or a truncated purpose/role fails this trace because it cannot prove a complete directory or recover the exact Binding key." Still **not** proven at scale: G2 lists "`BindingScope` or a demonstrably better generic mechanism for complete unknown-name enumeration" as remaining work, and Lane 5 still owes "known-name versus complete-directory semantics". | `readiness:Designs/efsv2/exp-c0-v0-hello-files-trace.md` §"Full-width positions and complete scope"; `readiness:Designs/efsv2/v2-contract-readiness-program.md` §G2, §"Lane 5" |
| **(i)** The byte carrier for created files | **Left.** The branch models bytes as `contentDigest` (explicitly Keccak-256 in C0/v0) + plural external sources + ordered acquisition evidence; the control's own words are "Carrier evidence remains outside Core state and cannot create identity, admission, or authority." The `HELLO_FILES` story exercises corrupt-primary-then-verified-fallback, which is an *evidence* mechanism, not a carrier selection. No tier, no retention receipt, no state-tier custody decision. R8's F6 is untouched. | `readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md` §"Supplementary byte-acquisition control"; `readiness:Designs/efsv2/exp-c0-v0-hello-files-trace.md` §"Fixture story", stage H6 |
| **(j)** Two-signature Files writes | **Selected as a delegated default, cost unowned.** The branch makes it structural: a `SourceWitnessSidecar` attests the `PublicationSet` and a *separate* `DestinationWitnessSidecar` authorizes the exact `AdmissionPlanId`; stage H2's failure rule is "a valid source witness is not destination authority; submission is not effect". That is two signatures per write by construction, chosen under V2-E3 with the falsifier "Reopen only if an application fixture cannot preserve required immutable context…". No document on the branch prices the UX cost of two wallet popups per file create, which R10 flagged as needing owner sign-off. | `readiness:Designs/efsv2/core-architecture-candidate.md` §"Portable source graph and destination Admission Plan"; `readiness:Designs/efsv2/exp-c0-v0-hello-files-trace.md` §"Stage contract" H2; `readiness:Designs/efsv2/owner-decision-inbox.md` §V2-E3 |
| **(k)** Type identity Variant A vs B | **Decided by agents on an axis three owner records call open.** The Variant A/B paragraph is deleted from the candidate and replaced with "`EXP-C0` provisionally selects one **flat exact nominal Type** for Core… Index policy is not intrinsic to the Record value and lives in a separately versioned `QueryProfile`." `Designs/efsv2/owner-rulings.md` (2026-08-12, **unchanged by this branch**) says: "Whether canonical index declarations are inside semantic Type identity or in a separately identified profile is a **50-year bakeoff question, not ruled** by this API direction." Owner direction 12 says: "The Type/query-identity axis remains open. The latest owner response was not interpretable, so this set infers no choice." | `readiness:Designs/efsv2/core-architecture-candidate.md` §"Type Schema"; `Designs/efsv2/owner-rulings.md` 2026-08-12; `Designs/web-client-os/README.md` direction 12 |

---

## 6. Lane Q4 — Is V2-C1 an honest owner decision packet?

**Formally, it is the best-constructed owner item in the vault. Substantively, the owner would be deciding more than the packet says.**

What it gets right: four separated fields (`technicalDisposition = RECOMMEND-GO-CODE`, `recommendedOwnerAnswer = YES`, `ownerDecision = PENDING`, `goCodeAuthorized = false`) that stop a technical recommendation from reading as an answer; literal reply forms (`V2-C1 YES` / `NO` / `DEFER`); an explicit non-authorization list ("does **not** authorize ceremony-final bytes, a protocol freeze, production deployment, permanent data, a Commons venue, or a release claim"); and eight written stop conditions that would retract the recommendation. It also fills the exact hole R19 identified: "the one decision that would actually start an MVP … has no bucket to live in."

What it bundles anyway:

1. **The Type/query-identity axis.** The packet's own "Decisions that genuinely belong to the owner" section names only V2-C1, then adds "the still-unrun losing-arm comparators named by the 2026-08-23 semantic seal" to "What is not an MVP blocker". Those comparators are precisely the four ABI-shaping arms, including "flat exact Type versus one bundled and one layered/View trace" (`trace-manifest.json` `minimumComparators[0]`). An owner answering `V2-C1 YES` therefore ratifies, without being told, an arm two owner records call open (§5(k)). The constitution's "reopen only on a named falsifier" phrasing shifts the burden: an axis the owner declared *unruled* becomes an agent selection that the owner must now falsify to reopen.

2. **The first product target.** `readiness:Designs/efsv2/owner-decision-inbox.md` §V2-C2 selects "the direct no-wallet raw Data Explorer plus the minimum Files profile"; the packet calls it "already selected as a delegated candidate default". `main`'s direction 2 is unambiguous: "The first MVP must be an official **write-capable** File Browser, not a read product plus a substitute debug page." The packet does not quote or reconcile direction 2; it justifies V2-C2 by "the owner's explicit top-to-bottom overnight direction" — see point 4.

3. **Where the code goes.** V2-C1 authorizes "one measured, explicitly replaceable EFS v2 candidate: monolithic Core control, raw-preserving SDK, and guest Explorer adapter" without naming a repository, while direction 11's repo plan is unaddressed and `main` carries a competing plan that would create a `core/` repo (§5(g)).

4. **The authority basis is not in the vault.** The readiness program's own justification is: "The 2026-08-23 work direction authorizes agents to make reversible engineering selections while the project owner is traveling…" (line 72), and "The current travel-period authorization covers prose, sealed traces, and throwaway experiments only" (line 117). The packet's V2-C2 rests on "the owner's explicit top-to-bottom overnight direction". **Neither the 2026-08-23 travel-period authorization nor the 2026-08-25 overnight direction exists anywhere in `main`**: `grep -rn "travel\|overnight\|top-to-bottom"` over the whole `main` vault returns only unrelated hits (venue governance, time-travel queries, "travel mode" device enrollment). `Designs/efsv2/owner-rulings.md` is byte-identical on the branch and still ends "— ruled by @james, 2026-08-12". `Decisions.md` records nothing. Directions 1–28 in `Designs/web-client-os/README.md` are all 2026-08-14→23 and none of them is a delegation grant.

**Against the 2026-07-23 rule.** `Decisions.md` 2026-07-23 established the owner-vs-agent decision system, `Open-Decisions.md`, `Retirements.md`, and the roster-not-ACL authority model, with the principle that "the gate is on rulings, not edits." An agent choosing solc version, storage layout, or test harness is squarely inside that. An agent choosing *Type identity semantics for a 50-year artifact* is not a reversible implementation detail — the owner ruling that names it a "50-year bakeoff question" says as much, and `RecordId` stability under index evolution is exactly the kind of choice the freeze ceremony exists for. **Two of the eight delegated items (V2-E4's Type/index disposition and V2-C2's first-product target) exceed the delegation; the other six (E1, E2, E3, E5, E8, and the monolithic-topology choice) are defensible reversible engineering selections with written falsifiers.**

**Plainly: yes, the owner would be deciding more than the packet says** — specifically the Type/query-identity axis and a read-first product order that contradicts his own direction 2 — unless V2-C1's text is amended to surface those two as separate, named ratifications.

---

## 7. Lane Q5 — Coherence with `Designs/web-client-os` on `main` and with the sibling branches

### 7.1 Against `web-client-os` on `main`

The branch touches **nothing** in `Designs/web-client-os/` (one cell of `Designs/README.md` aside). So every conflict below is live if the branch merges as-is.

| Seam | `web-client-os` on main | This branch | Verdict |
|---|---|---|---|
| First MVP | direction 2: "official **write-capable** File Browser… deliberately basic folder and file creation/writes so the client can also debug the evolving contracts" | constitution "First product loop": read-only Files profile first, "Writes… follow the lossless Reader seam"; `hello-files-trace` §"SDK and Explorer handoff": "The first Explorer fixture is read-only" | **Direct contradiction** |
| Data Explorer's role | direction 25: "Data Explorer is the **default App for unqualified Files/data links and a raw fallback, not a gateway** through which every App must launch" | V2-C2 makes the Explorer the *first vertical product*; M5 is the Explorer guest slice, M6 the minimum Files profile | **Tension, not contradiction** — but the branch inverts the emphasis without citing direction 25 |
| `PrincipalId` | direction 7: uniform surface **plus** a mutable default/main controller account, "every operation still names and historically verifies its actual signer descriptor" | V2-E1 uniform full-width `PrincipalId` with retained historical verifier transcript; controller-account half explicitly not implemented | **Agrees on the axis, silent on the half the owner illustrated with his own keys** |
| 64-Principal Lens | direction 8: "64 Principal entries if measurement supports it. Multiple controller keys do not consume multiple Lens positions" | 64 measured as a "candidate experiment ceiling"; controller-keys-inside-Principal-verification not exercised | **Advances it; does not close it** |
| Two signatures | `mvp-and-acceptance.md` operation sequence steps 8–9 assume the ceremony but bind it to an unchosen bakeoff arm (R8 F6) | Ceremony now structurally selected (source + destination witness sidecars) | **Resolves the arm; leaves the UX cost unowned** (R10 F6) |
| Guest critical path | constitution + web-client-os agree: no wallet, no account, no Commons, no hosted indexer | `HELLO_FILES` stage H9 enforces exactly that; `explorerE1a = NOT_PROVEN_BY_THIS_CONTRACT`, `explorerE1b = NOT_RUN` | **Agrees; honestly unproven** |
| Repositories | direction 11: rename legacy to `*-v1`, reclaim `contracts`/`sdk`/`webclient`/`drive` | silent | **Left open** |

### 7.2 Against the sibling branches

The three branches are **one intended program with a one-directional citation graph and no shared design surface.**

- `sdkv2:Designs/sdkv2/README.md` line 30 pins Core `b9088d6a24f4d40bcca6ba300523b25cc7c608d2`; `data-explorer:Designs/data-explorer/README.md` lines 43/53 pin the same commit and `EXP-C0/v0`. Both commits (`57d04f85…` on `origin/codex/sdkv2-pm`, `8d90ecbf…` on `origin/codex/data-explorer-pm`) exist and are verified by `check-acceptance.mjs`, which runs clean here.
- The readiness branch, however, **never names `Designs/sdkv2/` or `Designs/data-explorer/`** — its only hit is an incidental GitHub URL in `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md`. It refers to the two lanes by *commit hash only*. Its README build-order steps 3 and 4 assert "Both PM lanes consumed that exact lock unchanged" and "the exact committed receipt/report review found no unresolved P0/P1 truth mismatch", so a reader on a readiness-only `main` would meet load-bearing claims about two product lanes whose design folders do not exist there.
- The dependency direction means **readiness cannot merge alone without stranding its own top-line evidence**: the acceptance checker resolves `git show <commit>:<path>` against objects that live only on two other remote branches. It works today; it becomes unverifiable the moment those refs are pruned, and the *meaning* of the evidence (what an SDK role report or an Explorer dependency ceiling is) has no home in `main`.
- Programmatically coherent, organizationally three: three PM lanes, three branches, one shared source lock, zero merge choreography recorded anywhere.

---

## 8. Lane Q6 — Merge state and what `main` loses

```
$ git -C the planning vault merge-tree --write-tree main origin/codex/v2-readiness-week
2dde714fc7b073ea59db9e08d6921e696636ff0b
… CONFLICT (content): Merge conflict in Daily Notes/agent-status.md
… Auto-merging Kanban.md
$ echo $?   # 0
```

**Exactly one conflicting file, and it is the agent status log** — both sides appended dated entries under `## 2026-08-23`. `Kanban.md` auto-merges. Every design file merges clean, because `main`'s four commits since the merge base (`234c3e6`, `df20eba`, `e8e65b9`, `a354435`) touch web-client-os and PM routing, not the efsv2 spine. **This branch is not unmerged for any technical reason.** The most likely explanations are process ones: it is proposal-stage work from a PM lane, it carries an unanswered owner item, and it depends on two sibling branches nobody has sequenced.

What `main` loses by not having it:

1. **The owner queue is wrong.** `Open-Decisions.md` on `main` (generated 2026-08-21) says **"Ask now: 0 — *Nothing is awaiting an answer right now.*"** while the branch has a live `V2-C1` with reply forms and a `RECOMMEND-GO-CODE` disposition awaiting James. The owner's single "what needs deciding" page is affirmatively telling him there is nothing to decide.
2. **`Owner-Inbox.md` on `main`** still says "Nothing needs your answer until the evidence gates return a real fork." The gates returned one.
3. **The vault's only executable EFS 2.0 artifact is invisible.** `main` states "Stage B (bytes, prototypes, measurements) has not run" and "No EFS 2.0 code exists in any repository"; the branch contains ~19,000 lines of it plus measured Lens gas at four widths.
4. **The Kanban card on `main`** still says "expires 2026-08-16; next: execute disposable Stage B" with "no owner ask" — three weeks stale and factually wrong about the ask.
5. **Vocabulary repair is stranded**: `layered-type-system-and-data-abi.md` on `main` still uses `TypeRevisionId` 12 times against the README's own `TypeSchema` naming; the branch fixes it to 0.
6. **Conversely, merging it as-is would import** the deleted constitution open questions, the deleted V2-E6, the seven invisible delegated items, and the read-only-first product default that contradicts direction 2 — into the branch that `main` uses as the coordination surface.

---

## 9. What this set assumes about its neighbours, and whether they agree

| Assumption | About | Where stated | Neighbour agrees? |
|---|---|---|---|
| An owner direction on 2026-08-23 authorizes agents to make reversible engineering selections during travel | `owner` | `readiness:Designs/efsv2/v2-contract-readiness-program.md` lines 72, 117, 1083 | **Unknown / not recorded.** `Designs/efsv2/owner-rulings.md` unchanged, ends 2026-08-12; `Decisions.md` silent; directions 1–28 contain no delegation grant |
| An owner instruction on 2026-08-25 to "work top-to-bottom" selects the Explorer + Files vertical | `owner` | `readiness:Designs/efsv2/mvp-build-start-packet.md` §"Decisions that genuinely belong to the owner"; `owner-decision-inbox.md` preamble | **No.** Not recorded anywhere; and direction 2 selects a write-capable File Browser |
| The Type/query-identity axis may be selected by agents behind a falsifier | `owner`, `web-client-os` | `readiness:Designs/efsv2/core-architecture-candidate.md` §"Type Schema" | **No.** `owner-rulings.md` 2026-08-12 "50-year bakeoff question, not ruled"; direction 12 "remains open… this set infers no choice" |
| The SDK lane consumed the exact source lock and preserved every qualified field | `sdk` (branch `codex/sdkv2-pm`) | `readiness:Reviews/2026-08-25-efs2-exp-c0-cross-lane-acceptance/README.md` | **Yes**, and reproducibly — checker exits 0; but the lane's design folder exists only on that branch |
| The Data Explorer lane is the first vertical product | `web-client-os`, `data-explorer` (branch) | `readiness:Designs/efsv2/owner-decision-inbox.md` §V2-C2 | **Partly.** `data-explorer:Designs/data-explorer/README.md` agrees; `Designs/web-client-os/README.md` direction 25 calls the Explorer a default App and raw fallback, direction 2 puts the File Browser first |
| Stage A remains valid evidence while four of B0's seven arms are replaced | `efsv2` / Stage A corpus | `readiness:Designs/efsv2/v2-contract-readiness-program.md` §"Starting evidence and its honest limits" | **No.** `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/bakeoff-spec.md` frozen-corpus rule invalidates cells on a B0 change; nothing records the invalidation |
| `hierarchical-files-and-folders.md` is the governing Files draft the M6 slice implements | `efsv2` | `readiness:Designs/efsv2/exp-c0-v0-hello-files-trace.md` `**Depends on:**` | **Stale.** That file is unchanged on the branch and still declares `**Depends on:** V2-E1…, V2-E4 costing, **V2-E6 Web/OS execution**, and the Stage A B0 candidate` — two dependencies this branch deleted or superseded |
| Candidate code will begin "in the real repository" after `V2-C1 YES` | `vault-process`, `owner` | `readiness:Designs/efsv2/v2-contract-readiness-program.md` §"End-of-week packet" | **Unowned.** No repository is named; direction 11's plan is uncited; `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md` on `main` names a different one |
| The `ethers` toolchain is available from a sibling `contracts` checkout | (build environment) | `readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/src/model.cjs` lines 12–16 | **No.** `/home/user/contracts` does not exist; `contracts` (sibling clone) has no installed `ethers` |

---

## 10. Decided vs undecided vs docs-disagree-with-ruling

**Decided on this branch (by agents, recorded with falsifiers):** flat exact nominal `TypeSchema` + separate `QueryProfile`; uniform full-width `PrincipalId` with zero-setup account Principals; author-neutral `Record` + portable `PublicationSet` + per-leaf `Occurrence` + destination `AdmissionPlan`; self-authenticating `RealmBootstrap` + append-only `RealmRevision`; immutable point `ResolutionPlanV0` with `FIRST_FOUND_AFTER_PROVED_ABSENCE` and a 64-Principal experiment ceiling; monolithic first Solidity topology; Keccak-256 for C0/v0 file and `BytesPayloadV0` digests; 32-item maximum query page; 28-collection reconstruction projection; ordinary application Types with no onchain callbacks. All recorded at `readiness:Designs/efsv2/owner-decision-inbox.md` §"Delegated candidate defaults" and `readiness:Designs/efsv2/core-architecture-candidate.md` §"`EXP-C0` comparison inventory".

**Genuinely undecided and correctly held:** Commons venue (V2-E7); ceremony-final bytes/IDs/codecs/caps (V2-F1); first permanent product release scope (V2-F2); production contract topology; immutability-vs-governed-upgrade posture; managed Principal succession, recovery, delegation; private/encrypted profiles.

**Undecided but *presented* as decided:** the Type/query-identity axis (§5k, §6.1); the read-first product order (§5a, §6.2).

**Undecided and now invisible:** V2-E6 "Web Client and OS vertical slice" — deleted from the inbox with no `ADOPTED`/`REJECTED`/`DEFERRED` marker, while two files still depend on it (`readiness:Designs/efsv2/hierarchical-files-and-folders.md` line 6; `readiness:Designs/efsv2/owner-decision-inbox.md` line 295 "exact starter/raw policy waits for V2-E6"). The inbox's own §"Recording rule" step 2 requires marking an item, not deleting it.

**Docs that disagree with a ruling:**
- `readiness:Designs/efsv2/core-architecture-candidate.md` §"Type Schema" vs `Designs/efsv2/owner-rulings.md` 2026-08-12 ("50-year bakeoff question, not ruled").
- `readiness:Designs/efsv2/system-constitution.md` §"Candidate defaults" (read-only Files first) vs `Designs/web-client-os/README.md` direction 2 (write-capable File Browser first).
- `readiness:Designs/efsv2/owner-guide.md` §"What remains genuinely open" (writes open) vs its own branch's constitution (writes deferred) — internal.
- `readiness:Designs/efsv2/hierarchical-files-and-folders.md` (unchanged: `PublicationEnvelope`/`AdmissionIntent`/Stage A B0) vs the same branch's rewritten candidate — internal.

---

## 11. Concrete defects and stale facts

1. **Unvendored, unpinned, out-of-repo `ethers` dependency.** `readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/src/model.cjs:12-16` resolves `ethers` through `createRequire(<vault-parent>/contracts/package.json)`. No `package.json`, lockfile, version pin, or vendored copy exists in the branch. `node --test` in that directory yields **11 pass / 41 fail / 52 total**. The README's §"Evidence commands" are therefore not runnable as written by anyone who does not already have the v1 contracts repo checked out *as a sibling of the vault* with `node_modules` populated.
2. **Unresolvable evidence commit `ae9d75bd52d247fe8699475ac1e770fe268efbdb`.** Cited as the "sealed G1 carrier oracle" in `readiness:Designs/efsv2/core-architecture-candidate.md:181`, `readiness:Designs/efsv2/v2-contract-readiness-program.md:147,190`, and `readiness:Reviews/2026-08-23-efs2-exp-c0-semantic-seal/README.md:7,75`. `git cat-file -t` fails in the planning vault and in all three sibling code repos. It does not exist in any reachable object database.
3. **V2-E6 deleted with two live references.** See §10.
4. **Seven delegated items vanish from the owner rollup with no warning.** `scripts/open-decisions.sh` `classify()` maps `*delegated*` → `DELEGATED`, and `flush_item()`'s `case` has emit branches only for `ASK`, `REVALIDATE`, `EVIDENCE`, `SCHEDULED`, and `OTHER`. `DELEGATED` falls through to nothing — no row, no count, no stderr warning (unlike `OTHER`, which warns loudly). Result: `readiness:Open-Decisions.md` "Queue health" shows `efsv2` live items **4**, down from **10** on `main`, with no record anywhere on the page that V2-C2/E1/E2/E3/E4/E5/E8 were agent-decided. Owning set: `vault-process`.
5. **`Reviews/2026-08-22-v2-contract-readiness-baseline/README.md` rests on evidence that does not exist here.** Its method cites "commit/status/tree inspection across all 11 local worktrees of `experiments/efs2-b0-stage-b`" and a fresh replay ("Git P6 TypeScript fixture: 16 pass, 0 fail, 106 assertions"; "Git/Forge Type/Data-ABI fixture: 37 pass, 0 fail, 133 assertions"). No `experiments/` directory exists under `/home/user` (`find` returns nothing). **UNVERIFIABLE.**
6. **Kanban card expired again.** `readiness:Kanban.md` line 41: "refreshed 2026-08-25, expires **2026-08-28**". Today is 2026-09-03 — six days expired, and the card is the only swarm-visible pointer to a `PENDING` owner decision.
7. **`core-architecture-candidate.md`'s own pre-promotion checklist is failing.** `- [ ] **Depends on:** chain — all dependencies accepted or landed` remains unticked while the doc adds a new dependency (`ethereum-standards-and-execution-profile`) in the same commit.
8. **Solidity evidence unverifiable here.** `forge` is not installed; `lens-gas-v0.json`'s four cold/warm pairs, the "Solidity 35/35" claim in `readiness:Daily Notes/agent-status.md` (2026-08-25), and all `src-sol/` behaviour are **UNVERIFIABLE from this environment**. The JSON's `measurementProvenance` block (command, event signature, `inputsSha256 8a561308…`) is exemplary practice and would make it verifiable on a machine with Foundry.
9. **Stale-by-omission: 0 of 16 Stage A spine edits applied**, despite this branch rewriting the exact files the edits target (§4).

**Facts I re-checked and found true** (worth recording, since the brief warns against inheriting stale defects): 61 unique trace IDs and manifest SHA-256 `ec81918f…`; 38 result profiles; 13 illegal combinations; 57 projection entries; 27 populated collection kinds with kind 16 empty; payload SHA-256 `ac1651b0…`; 61-trace obligation group sums; cross-lane acceptance checker exit 0 with `unresolvedP0: 0`, `unresolvedP1: 0`; `exactExecutableTraceReplayCount: 0`; single-file merge conflict.

---

## 12. Solid now / settle first / cut, for an MVP

**Solid enough to build on now**
- The three-finish-line separation `GO-CODE` / `GO-FREEZE` / `GO-DEPLOY` and the rule that "an experiment report can only **recommend** `GO-CODE`" (`readiness:Designs/efsv2/v2-contract-readiness-program.md` §A).
- The literal gate vector (all `PARTIAL`, one subgate `PASS`, replay count 0) as the vault's status vocabulary — it is the first EFS status representation that cannot be read as more than it is.
- The `FactsV0` no-collapse axes (presence / coverage / support / validation / authority / lifecycle / selection / observation / bytes / effect / projection) with `NOT_APPLICABLE` fenced.
- The 28-collection reconstruction projection and the `HELLO_FILES` fixture as the M0 handoff object.
- The `BindingScope` position/scope key shape and its "global per-Principal scope fails this trace" falsifier.
- The Lens gas table as a measured input to owner direction 8.
- `owner-guide.md` as the owner-facing explanation of the whole system.
- V2-C1's four-field structure and reply forms as the template for every future authorization item.

**Settle before or during the first build**
1. **Record or withdraw the 2026-08-23 / 2026-08-25 owner directions.** Everything delegated hangs off them; neither is in the ledger. (`owner`, then `vault-process`)
2. **Split V2-C1 into three explicit asks:** (i) authorize nondeployable candidate engineering; (ii) ratify or reopen the Type/query-identity selection; (iii) confirm or override direction 2 on writes-in-the-first-client. As written, (ii) and (iii) ride along silently.
3. **Name the repository.** V2-C1 authorizes work with no place to do it; direction 11 and `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md` disagree.
4. **Make the control reproducible**: add a `package.json` + lockfile (or vendor the four `ethers` primitives — `AbiCoder`, `keccak256`, `toUtf8Bytes` are the whole surface used) so `node --test` passes from a clean clone. Until then the strongest evidence in the vault is not independently checkable.
5. **Reconcile with Stage A explicitly**: one paragraph saying which SR pins survive, which four B0 arms changed, and that the 9-cell bakeoff is retired or re-cut. Silence leaves two contradictory "current candidates".
6. **Restore V2-E6 with a disposition**, or retire its two referring dependencies.
7. **Make `DELEGATED` visible** in `Open-Decisions.md` (its own section, or at minimum a stderr warning and a count) so a reader can see that seven owner questions became agent answers.
8. **Select the byte carrier** — untouched here and the single biggest hole between "create a file" and "read it back as a guest in a clean browser".
9. **Price the two-signature write** in wallet popups before M2 hardens it.

**Cut from the first build**
- The remaining losing-arm comparators (bundled/layered Type, tagged author, Realm-bound publication, bare-`chainId` Realm) — the branch already retargets them to `GO-FREEZE`, and that is right.
- Exhaustive 61-trace replay bundles, Rust conformance, two independent reconstructors, century-scale evidence — the packet's own "What is not an MVP blocker" list is well-judged.
- The full G6 program (blinded developer tasks, Nanda/achievements/package/media workloads, Git P6 churn, 50-Principal Files Plan) — keep the seams, defer the evidence.
- The Data Explorer extension/sandbox surface described in the readiness program's Explorer charter; the charter itself says "The initial prototype should be read-heavy and reversible."
- ERC-6492, ERC-7913, ERC-7208/7813/8100 adapter comparisons at build start — G3/G6 material.

---

## 13. Unverifiable from here

- All Foundry/Solidity results, including every gas number in `lens-gas-v0.json`, `principal-comparator-v0.json`'s four gas rows, and the "35/35" Solidity claim (`forge` absent).
- All JavaScript differential results that require `ethers` — i.e. the JS↔Solidity ID/preimage/Result/cursor/projection agreement claims (41 of 52 test files fail on the missing module).
- `experiments/efs2-b0-stage-b` and its 11 worktrees, and the 2026-08-22 baseline's fresh-replay counts (16/0/106 and 37/0/133).
- Experiment commit `ae9d75bd52d247fe8699475ac1e770fe268efbdb`.
- The independent-review claims in the semantic seal ("three final reviewers report no P0/P1") — the reviews are asserted, not attached.
- Whether James actually gave a travel-period delegation or a top-to-bottom instruction on 2026-08-23/25.
