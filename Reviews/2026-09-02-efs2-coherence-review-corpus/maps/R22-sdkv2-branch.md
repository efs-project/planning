# R22 — `origin/codex/sdkv2-pm` (EFS v2 SDK design set) branch map

**Lane:** R22-sdkv2-branch · **Reviewer:** Claude Opus 5 · **Date:** 2026-09-03
**Branch:** `origin/codex/sdkv2-pm` @ `57d04f85ae2687ee8ea63d945378df5a9a6492a5` (2026-08-25, "design: consume exact Core source lock in SDK lane")
**Worktree read:** `sdkv2` (read-only)
**Compared against:** the planning vault on `main` @ `234c3e6`; siblings `origin/codex/v2-readiness-week` @ `2573f08b170bf3eb855ad5a68c31ee7b0215272d` and `origin/codex/data-explorer-pm` @ `8d90ecbf85390f1151fa1b2dbf93852a1bfc8448`
**Citation convention:** branch-only files are cited `sdkv2:<path>:<line-or-heading>`; readiness-branch files `readiness:<path>`; `main` files with a bare repo-relative path.

---

## 0. Headline

This branch is the **only place in the vault where an EFS 2.0 SDK is designed at all**, and it is
substantially better work than its invisibility suggests: eleven documents (2,411 lines under
`Designs/sdkv2/`), a three-arm architecture comparison with a named recommendation, sixteen
adversarial gates with predeclared numeric tripwires, a dated 1,196-document EIP/ERC census, and
**two executable checks that I ran and that pass**. Its `EXP-C0` source lock is real: I
independently recomputed all nine artifact SHA-256 locks plus the handoff digest in
`sdkv2:Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-source-lock-v0.json` against
`readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/*` at Core commit `b9088d6` — every one
matches byte-for-byte, and `readiness:Reviews/2026-08-25-efs2-exp-c0-cross-lane-acceptance/README.md`
§"Exact evidence" names this branch's exact head commit `57d04f85…` and its role-report hash
`ef8ba1b0…`, which I also recomputed. Three unmerged branches are cryptographically bound to each
other and to nothing on `main`.

That is also the problem. Three of the SDK set's load-bearing declared inputs
(`Reviews/2026-08-23-efs2-exp-c0-semantic-seal`, `Reviews/2026-08-25-efs2-exp-c0-v0-control`,
`Designs/data-explorer/`) exist on **neither `main` nor this branch**. Two dated founder rulings —
the SDK PM mandate and the 100-year preservation horizon — are recorded only in
`sdkv2:Designs/sdkv2/owner-rulings.md`, in a non-standard attribution form, by an agent, on an
unmerged branch; `Designs/efsv2/owner-rulings.md` on `main` ends 2026-08-12 and `Decisions.md` has
no 2026-08-2x row. The git topology shows the same author pushed the **non-SDK half** of this
branch's work straight to `main` (`bf0e94e … c4e0ef1` are ancestors of `main`) and left the SDK
half behind, with no note on `main` saying why.

On coherence: the set is well-aligned with `main`'s *Web Client integration budgets* and with the
readiness Core packet, and it correctly refuses to freeze anything. It is badly aligned with
`main`'s *Files* work: it never once names `FilesConsumerAdapterV0`, `ByteOutcome`, `BindingScope`,
`PublicationEnvelope`, `AdmissionIntent`, `ActionReceipt`, `ChunkTree`, `FileRevision` or
`DirectoryEntry` — the exact nouns `Designs/web-client-os/mvp-and-acceptance.md` says the
write-capable File Browser MVP needs — and it never cites
`Designs/efsv2/hierarchical-files-and-folders.md`, `lens-spec.md`, `joined-pass-synthesis.md`, or
`mountable-filesystem-semantics.md`. It introduces a **third** result vocabulary (`ResultV0`, ten
axes) beside `main`'s adopted JR-5/LN-6 model and `main`'s `Resolved<T>`/`ResourceOutcome<T>`,
without a crosswalk to either.

For an MVP: this set gives you the *result law and evidence discipline* for a File Browser SDK and
essentially none of the *Files surface*. Its own three-item "highest-leverage disposable work"
list (`sdkv2:Designs/sdkv2/README.md:86-97`) is the right minimum; everything else — SDK-E2/E4/E6,
the S9 helper bakeoff, S11 EAS carrier, S13 CapabilityRPC, S16 three-host conformance, release
classes and Phase 3/4 — is next-year scope that the set proposes but never marks as cuttable.

---

## 1. Exact delta against `main`, and the merge topology

`git diff --stat main...origin/codex/sdkv2-pm` — 28 files, +3,651 / −9:

| Group | Files | Note |
|---|---|---|
| New design set | `Designs/sdkv2/` × 11 (2,411 lines) | The whole SDK lane |
| New review | `Reviews/2026-08-25-sdkv2-exp-c0-mvp/` × 11 (~1,300 lines incl. JSON) | Two executable checkers + 5 vendored Core artifacts + 2 receipts |
| Routing edits | `Designs/README.md` (+1 row), `Designs/owner-decision-inbox.md` (+queue link, rewritten §Recording rule), `Onboarding/start-here.md` (+2 rows, rewritten decision rule), `Open-Decisions.md` (regenerated: awaiting-evidence 12 → 20), `Kanban.md` (+1 Done card), `Daily Notes/agent-status.md` (+3 entries) | |

**Topology (verified).** `git merge-base main origin/codex/sdkv2-pm` = `c4e0ef1` (2026-08-24), which
is itself a branch commit that is an ancestor of `main`. The branch's parent chain is
`57d04f8 → 9cad5f9(merge of 4d3e736 + c4e0ef1) → c4e0ef1 → fc5b6db → 1565041 → e4180cc → … → bf0e94e`.
`e4180cc`, `1565041`, `fc5b6db`, `c4e0ef1` **are** in `main`; `4d3e736`, `76dda04`, `9cad5f9`,
`57d04f8` are **not**. So the SDK PM's Web Client / media / IPFS / catalog commits went to `main`
and the six SDK-only commits stayed on the branch. Nothing on `main` records that decision.

**Merge test (lane question 6).** `git -C the planning vault merge-tree --write-tree main origin/codex/sdkv2-pm`
→ exit 1, tree `57f08186b29e…`, **one conflict**:

```
CONFLICT (content): Merge conflict in Daily Notes/agent-status.md
Auto-merging Kanban.md
```

The conflict is trivial append-vs-append at the tail of the status log (branch adds three
2026-08-25 entries after 2026-08-24; `main` adds a `## 2026-08-26` and a `## 2026-08-30` section).
`Designs/README.md`, `Designs/owner-decision-inbox.md`, `Onboarding/start-here.md`, `Open-Decisions.md`
and `Kanban.md` all auto-merge. **Merging this branch is a five-minute job.** The real cost is not
conflict resolution; it is that the merged tree would contain three dangling input paths (§5.2) and
a checker that cannot run in-repo (§9).

**Vault hygiene on the branch (verified by running the vault's own scripts in a throwaway clone).**
`scripts/tri-sync-check.sh` → "Tri-sync invariant holds across all designs." `scripts/needs-integration.sh`
→ "No active retirements." `scripts/open-decisions.sh` → regenerates `Open-Decisions.md`
**byte-identically** except the date stamp (`ask now: 0, held/revalidate: 7, evidence: 20,
scheduled: 2`). `scripts/designs-awaiting-promotion.sh` → empty. The branch is clean by the vault's
own tooling; the three stale Kanban cards it reports are inherited from `main`, not introduced here.

---

## 2. Per-document summary and standing

Standing legend: **draft** (proposal), **reference** (evidence/record), **evidence-only**.

| # | Document | Own status line | My standing call | One-line summary |
|---|---|---|---|---|
| 1 | `sdkv2:Designs/sdkv2/README.md` (200 ln) | "draft set — founder-authorized SDK experience and experiment program" | draft, current spine | Phone checkpoint, authority map, arm-C mermaid, hard boundaries, three highest-leverage next runs |
| 2 | `sdkv2:Designs/sdkv2/sdk-pm-charter.md` (237 ln) | "draft — founder-authorized working charter" | draft | Mission, owns/does-not-own tables, six coordination contracts, Phases 0–4, five release classes |
| 3 | `sdkv2:Designs/sdkv2/owner-rulings.md` (48 ln) | "reference — append-only authority record" | **reference, branch-only, unratified elsewhere** | Two 2026-08-22 rulings: SDK PM mandate + century horizon |
| 4 | `sdkv2:Designs/sdkv2/owner-decision-inbox.md` (113 ln) | "reference — evidence-gated SDK queue; nothing needs an immediate owner answer" | reference | SDK-E1…E6, SDK-F1/F2, settled S1/S2, superseded P1/P2 |
| 5 | `sdkv2:Designs/sdkv2/architecture-candidate.md` (503 ln) | "draft — three-arm comparison" | draft, the technical centre | Arms A/B/C, generate-vs-interpret matrix, 14 logical modules, 5 Ethereum profiles, 3 package topologies, 7 clocks, `ResultV0`, 17 security invariants |
| 6 | `sdkv2:Designs/sdkv2/developer-journeys.md` (261 ln) | "draft — candidate experience contract" | draft | 22-row journey map, `ReadContext`, the `construct→…→canonical read-back` pipeline, 7 environment profiles, acceptance ledger |
| 7 | `sdkv2:Designs/sdkv2/experiment-program.md` (247 ln) | "draft — executable evaluation design" | draft | S0/S0C/S1–S16 matrix with pass gates and stop conditions, 20-case Solidity attack corpus, 14 production stop conditions, Week-1A/1B/1C queue |
| 8 | `sdkv2:Designs/sdkv2/exp-c0-mvp-packet.md` (155 ln) | "draft — disposable SDK/Core handoff" | draft, **the MVP-adjacent doc** | `ResultV0` outer contract, 8 runtime operation families, `packages/exp-c0-runtime/` layout, generated-facade and Solidity-leaf boundaries, 6 outstanding Core packet groups |
| 9 | `sdkv2:Designs/sdkv2/web-client-os-boundary-pressure.md` (332 ln) | "reference — coordination pressure and SDK response" | reference | Two trust altitudes, three consumption paths, CapabilityRPC 7-verb lifecycle, public-SDK-vs-private-Kernel-SPI split, 9-row "does any journey force a bypass" table |
| 10 | `sdkv2:Designs/sdkv2/research-precedents.md` (124 ln) | "reference — dated official-source research" | evidence-only | 18 offchain + 13 Ethereum precedents (Protobuf, Buf, Smithy, WIT, GraphQL, viem/ABIType, EAS, EIP-170/3860/2929…) with copy/reject columns |
| 11 | `sdkv2:Designs/sdkv2/ethereum-standards-census.md` (272 ln) | "reference — dated official-source census" | evidence-only, **already consumed on `main`** | 1,196-document screen at EIPs `f767a1e8…` / ERCs `9c718c7c…`; USE / OPTIONAL ADAPTER / EXPERIMENT / MONITOR / REJECT-AS-AUTHORITY; cross-PM routing table |
| 12 | `sdkv2:Designs/README.md` | content map | reference | Adds the `sdkv2/` row `main` lacks |
| 13 | `sdkv2:Designs/owner-decision-inbox.md` | reference | reference | Adds the SDK queue link and rewrites §Recording rule to name `sdkv2/owner-rulings` |
| 14 | `sdkv2:Reviews/2026-08-25-sdkv2-exp-c0-mvp/` | "disposable SDK evidence" | **executed evidence (verified by me)** | `check.mjs` (6 semantic cases) + `check-core-consumption.mjs` (5 artifacts, 21 pointers, 4 Result encodings, 6 Type envelopes, 13 mutations) |

`sdkv2:Designs/sdkv2/ethereum-standards-census.md` is **byte-identical** to the copy the lead
reviewer already fetched at `4d3e736` (`scratchpad/census-4d3e736.md`), so the four `main` documents
that permalink it are citing current text, not a stale snapshot.

---

## 3. Lane question 1 — what the set decides or proposes

### 3.1 The proposal

`sdkv2:Designs/sdkv2/README.md:13` states the verdict in one line: **"experiment with a hybrid SDK,
not a production API."** The shape (README §Current recommendation, `architecture-candidate.md`
§Architecture arms row C):

- **Deterministic Type compiler** consuming an "exact retained Type and protocol closure", emitting
  TypeScript DTOs/codecs/validators/reference-extractors/builders/docs/vectors/bound reports plus
  Solidity `internal pure` leaves — "Generated outputs are deterministic consumer artifacts, not
  Type authority" (`architecture-candidate.md` §Recommendation item 2).
- **Small offchain evidence runtime** that "interprets only a closed, versioned bootstrap/profile
  surface" (item 3) and preserves raw bytes through every path.
- **Generated Solidity leaves over narrow Core interfaces**, plus a **bounded generic probe** that
  is "structural only" — `PRESENT` means the structural claim was verified, not payload semantics
  (`architecture-candidate.md` §Bounded generic probe).
- **Optional stateless helper** — `view`, `STATICCALL`-callable, code-hash pinned, "never required
  for correctness, authorization, completeness, or absence" (item 5), eligible only after the S9
  bakeoff clears a predeclared gas **or** size lane.

Arm A (descriptor runtime) is kept only as a closed control; arm B (pure generation) is the
"generation control and the default Solidity semantic path" but "insufficient alone for
archival/raw handling". This is a genuine, falsifiable comparison, not a rationalisation.

The one **substantive** proposal beyond architecture is the `EXP-C0` result law
(`exp-c0-mvp-packet.md` §Shared outer contract): one `ResultV0` envelope with ten independent
profile axes (presence, coverage, support, validation, authority, lifecycle, selection, bytes,
effect, projectionIntegrity), a retained `payload.rawEnvelope`, a canonical-effect axis restricted
to `COMMITTED | NOT_COMMITTED_PROVEN | UNKNOWN | NOT_APPLICABLE` with **no** `EFFECT_REJECTED`, a
cursor preimage committing query identity + Type/Profile + activation generation + Realm revision +
ordering + high-water + basis + coverage, and **three separately named receipts**
(plan-signature verification / account authorization-submission / canonical effect read-back).

### 3.2 The inbox — SDK-E1…E6, F1/F2, S1/S2, P1/P2

| ID | Question | Owner-level today? |
|---|---|---|
| SDK-E1 | generation/runtime architecture (arms A vs B vs C against one fixture) | **No** — a measurement, and the set already recommends C |
| SDK-E2 | first public package topology (P1 two packages / P2 capability modules / P3 per-Type) | **No** — and shouldn't be asked for a year |
| SDK-E3 | onchain helper lane (leaves vs probe vs helper) | **No** — gated on S9; "Failure kills only the helper lane" |
| SDK-E4 | compatibility and support promise | **No** — post-freeze |
| SDK-E5 | cross-language result ABI | **Borderline** — this is the one that *becomes* owner-level, because it asks Core to freeze result shapes |
| SDK-E6 | runtime-neutral semantic capability contract (MessagePort/WIT/agent) | **No** — and over-scoped (§7) |
| SDK-F1 | production SDK freeze bundle | No — explicitly post-Core-freeze |
| SDK-F2 | first supported integrations | No — after F1 |
| SDK-S1 | one PM owns two coordinated SDK surfaces | *Settled* by the branch-only ruling |
| SDK-S2 | 100-year replacement/reconstruction first-order | *Settled* by the branch-only ruling |
| SDK-P1 | current `sdk/` packages as the v2 baseline | *Superseded* — consistent with `Decisions.md` 2026-08-08 greenfield ruling |
| SDK-P2 | a friendly API may hide qualification | *Rejected* — consistent with `Designs/web-client-os/mvp-and-acceptance.md:700-703` |

**Verdict:** none of SDK-E1…E6/F1/F2 is genuinely owner-level today, and the inbox says so in its
own banner (`sdkv2:Designs/sdkv2/owner-decision-inbox.md:10-13`: "Nothing here needs an immediate
owner answer"). The branch's regenerated `Open-Decisions.md` correctly keeps **Ask now: 0** and
moves awaiting-evidence 12 → 20. That is honest queue hygiene.

**But the one item that *is* owner-level in this lane is in no inbox at all:** whether
`Designs/sdkv2/` lands on `main`, and whether the SDK PM mandate exists as far as `main`-reading
agents are concerned. See §4.

---

## 4. Lane question 2 — the two 2026-08-22 rulings

### 4.1 What they say

`sdkv2:Designs/sdkv2/owner-rulings.md` §"2026-08-22 — SDK PM mandate and durability horizon":

> **RULED (James, EFS Founder):** the durable SDK PM may read and write project files, own the SDK
> developer experience, and undertake the research, brainstorming, and experimentation needed for
> high-quality results. Durable SDK design work may live in the planning repository, with
> `Designs/sdkv2/` selected as the current source spine.

and §"2026-08-22 — century-preservation correction":

> **RULED (James, EFS Founder):** once the EFS protocol is frozen, its intended frozen/preservation
> horizon is 100 years. Align the SDK program with that century discipline; do not silently reduce
> the owner goal to a shorter SDK horizon.

The first ruling also records a same-session correction ("The founder initially used a shorter
project horizon in this exchange, then issued the same-day century correction recorded below. The
later 100-year direction governs.") — good practice.

### 4.2 Are they on `main`? No.

Verified on `main`:

- `Designs/efsv2/owner-rulings.md` — `grep -n "^## "` returns dated sections ending at
  **`## 2026-08-12`** (line 169). No 2026-08-22.
- `Decisions.md` — `grep -n "2026-08-2"` returns **nothing**.
- `grep -rn "sdkv2" --include="*.md" .` on `main` returns **4 hits**, all GitHub permalinks to
  `blob/4d3e736…/Designs/sdkv2/ethereum-standards-census.md`:
  `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md:142`,
  `Designs/media-library/media-infrastructure.md:182`,
  `Designs/open-web-app-store/README.md:205`, `Designs/open-web-app-store/architecture.md:7`.
  None of them mentions a ruling, a PM mandate, or a design set.
- `grep -rn "SDK PM"` on `main` → 2 hits, both asking an SDK PM to do something
  (`Designs/web-client-os/app-runtime-and-direct-launch.md:789`,
  `Reviews/2026-08-26-module-plugin-systems-pressure/README.md:739`) — neither establishing that
  the role exists.

### 4.3 Is a founder ruling on an unmerged branch a process defect?

**Yes, on three counts, and one non-count.**

*Not a defect:* the **location** is legal. `AGENTS.md:44` says "A ruling is recorded in the history
owned by the queue that owns the item — `Designs/<folder>/owner-rulings.md` where that file exists,
`Decisions.md` otherwise — and never in both." Creating `Designs/sdkv2/owner-rulings.md` and
routing SDK rulings there is exactly what that rule prescribes once the folder exists. The branch
even updates the two pointer documents (`sdkv2:Designs/owner-decision-inbox.md` §Recording rule;
`sdkv2:Onboarding/start-here.md` decision rule) so nothing dangles. On the branch it is coherent.

*Defect 1 — the ruling is invisible where the rule points.* On `main`,
`Designs/owner-decision-inbox.md` §Recording rule still says "New EFS 2.0 rulings belong in
`[[efsv2/owner-rulings]]` through the EFS 2.0 queue", and `Onboarding/start-here.md` says "Record
adopted EFS v2 answers in [owner rulings](../Designs/efsv2/owner-rulings.md)". An agent following
`main`'s instructions to the letter would conclude no SDK ruling exists. The vault's whole ruling
mechanism is a *findability* mechanism; a ruling nobody can find has not been recorded.

*Defect 2 — wrong attribution token.* `Onboarding/authority.md` §"Recording a ruling" requires
"New rulings carry `— ruled by @james, YYYY-MM-DD`". `sdkv2:Designs/sdkv2/owner-rulings.md` uses
"**RULED (James, EFS Founder):**" instead — no `@james` handle, no trailing date token. Compare
`Designs/efsv2/owner-rulings.md:138` ("— ruled by @james, 2026-07-23") and `:221`
("— ruled by @james, 2026-08-12"), which do carry it. The older `RULED (James)` form appears at
`Designs/efsv2/owner-rulings.md:59`, so this is a legacy style, not an invention — but it is the
form the vault moved away from.

*Defect 3 — the exact failure mode `authority.md` warns about.* `Onboarding/authority.md` §"What
this is not": "the realistic threat isn't a rogue teammate but **an agent fabricating or
misreporting a ruling**. `Designs/efsv2/owner-rulings.md` already holds the near-miss (2026-07-16:
*'I told James I'd recorded this but had not'*)." A founder ruling that (a) was written by an agent
(`@codex-gpt-5`, per `sdkv2:Daily Notes/agent-status.md`), (b) lives only on an unmerged branch,
(c) uses a non-standard token, and (d) *creates the role of the agent that recorded it*, is
structurally indistinguishable from that near-miss. I have no evidence the ruling is false —
`main`'s own docs behave as though an SDK PM exists — but the recording gives the owner no way to
check.

*Substance note:* the century ruling is **not novel direction**. `main` already carries the
century horizon throughout `Designs/efsv2/`: `deterministic-ids.md:18` ("the only 100-year strategy
that has ever worked"), `read-lens-spec.md:548` ("the 100-year read"), `freeze-gates.md:20,50`,
`kel.md:45,654,663`, `Designs/media-library/media-infrastructure.md:188` ("century-preservation
contract"). The ruling re-affirms an existing project assumption. The defect is the recording, not
the content.

---

## 5. Lane question 3 — coherence

### 5.1 With `main` `Designs/efsv2` — mixed, with one real gap

**Agrees.** The set never freezes a name and says so explicitly. `sdkv2:Designs/sdkv2/README.md:145`
lists "Realm, TypeSchema/TypeRevision, Record, Envelope/Context, Occurrence, admission, Binding,
ResolutionPlan, layered Types, Views, QueryProfiles" as *comparison vocabulary* — matching
`Designs/efsv2/README.md:71-72` ("`TypeSchema` is the current plain-language name; older files call
similar concepts `TypeRevision`") and `Designs/efsv2/core-architecture-candidate.md:444-445`
("Decide the developer name … after the Fable review"). `sdkv2:Designs/sdkv2/README.md:143` records
`PrincipalId` correctly as an *owner-directed product baseline* — "The Web Client uses one
`PrincipalId` product surface and targets a 64-Principal Lens if measurement supports it. This does
not freeze the Core authority mechanism" — which is exactly `Designs/web-client-os/mvp-and-acceptance.md`
§EFS v2 pressure matrix rows 2–3. `sdkv2:Designs/sdkv2/experiment-program.md` S6/S8 test
"distinct bytes32 Principals sharing the same low 160 bits" and "1/8/32/64 full-width Principals",
directly honouring `Designs/efsv2/fable-efs2-core-engineering-kickoff.md:97` ("Preserve full-width
`bytes32 PrincipalId` through every ABI, storage/index").

**Gap — the result model.** `ResultV0` appears **zero times** on `main`
(`grep -rn "ResultV0" --include="*.md" Designs/` → 0 files). Meanwhile `main` already has *two*
result vocabularies:

- `Designs/efsv2/joined-pass-synthesis.md:29` JR-5, "**Adopted system-wide**": `ABSENT_PROVEN` has
  exactly **four sources** — own-node total-state read; verified state proof to positive closure;
  venue-committed bundle closure manifest; a signed closed-realm/bundle completeness manifest at
  signer-trust grade — and `Designs/efsv2/lens-pass-synthesis.md:31` LN-6, "One read-result model:
  the 6+1 axes + the acceptance matrix", with a hashed, pinned `AcceptanceMatrixV1` and
  "`onReject: FAIL_CLOSED` only".
- `Designs/web-client-os/architecture-and-modules.md:192-205` `Resolved<T>` / `ResourceOutcome<T>`,
  which `Designs/web-client-os/mvp-and-acceptance.md:700` makes an MVP acceptance line.

The sdkv2 set maps to the second (`architecture-candidate.md:283-285`:
"`ResourceOutcome<T> = ResultV0` where `profile.presence` is FOUND | ABSENT_PROVEN | UNKNOWN |
CONFLICT | OPAQUE | MASKED | NOT_APPLICABLE") but **never mentions the first**. Greps across all
eleven files: `AcceptanceMatrix` → 0, `lens-spec` → 0, `joined-pass` → 0, `6+1` → 0,
`hierarchical-files` → 0, `mountable-filesystem` → 0. Its absence rule is the weaker
"Only a complete exact negative basis permits `ABSENT_PROVEN`"
(`architecture-candidate.md:311`) — true, but it does not name JR-5's four sources or LN-6's
"`PARTIAL(cursor)` scopes never yield absence" precondition (`Designs/efsv2/lens-spec.md:71`).

The full `**Depends on:**` closure of the set is only nine distinct `main` targets
(`../efsv2/layered-type-system-and-data-abi` ×5, `../web-client-os/type-data-abi-boundary-pressure`
×4, `../efsv2/system-constitution` ×4, `../web-client-os/README` ×3, `../efsv2/owner-decision-inbox`
×2, `../efsv2/README` ×2, `../web-client-os/mvp-and-acceptance` ×1, `../efsv2/owner-rulings` ×1,
`../efsv2/core-architecture-candidate` ×1). The Files spine and the Lens/absence spine are absent.

### 5.2 With the readiness branch it source-locks — verified sound, but the paths dangle

**Verified by me, byte-for-byte.** `sdkv2:Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-source-lock-v0.json`
declares nine `artifactLocks` plus `handoffSha256`. I recomputed each from
`git show b9088d6a24f4d40bcca6ba300523b25cc7c608d2:Reviews/2026-08-25-efs2-exp-c0-v0-control/<path>`:

| Artifact | Declared = recomputed |
|---|---|
| `handoff-v0.json` | `2e8d191e4dd7c2130378e09f3cbc5b71441906cbaa6c448c30139aafe9ec203d` ✓ |
| `consumer-contract-v0.json` | `7be0ca1c…e512` ✓ |
| `hello-files-v0.json` | `8841b6cd…6a3f` ✓ |
| `lens-gas-v0.json` | `932dfe28…9862` ✓ |
| `principal-comparator-v0.json` | `08de7461…1999` ✓ |
| `type-interpreter-v0.json` | `2e4be16f…a810` ✓ |
| `vectors/essential-v0.json` | `949b9a4a7aaf90d3d8de5bbbddf40c0daf82409b2653b64ee9cff4d4dbbafd5c` ✓ |
| `vectors/plan-operation-v0.json` | `b6a58fcd…2162` ✓ |
| `vectors/result-v0.json` | `9fbadbce…f6bf` ✓ |
| `vectors/type-envelope-v0.json` | `773660ae…7a65` ✓ |

The five vendored copies under `core-inputs/` hash identically to the readiness originals. The
receipt itself hashes to `c750a63b…2858` and the SDK report to `ef8ba1b0…9f7b`, and
`readiness:Reviews/2026-08-25-efs2-exp-c0-cross-lane-acceptance/README.md` §"Exact evidence"
independently names those same two hashes plus SDK packet `57d04f85ae2687ee8ea63d945378df5a9a6492a5`
and Explorer packet `8d90ecbf85390f1151fa1b2dbf93852a1bfc8448`. The three branches genuinely
cross-verify. This is the strongest piece of executed evidence I have seen in this review.

**But the paths do not exist anywhere they can be read from.** On the sdkv2 branch:

| Declared input | On sdkv2 branch | On `main` |
|---|---|---|
| `Reviews/2026-08-23-efs2-exp-c0-semantic-seal` (`exp-c0-mvp-packet.md:6`) | MISSING | MISSING |
| `Reviews/2026-08-25-efs2-exp-c0-v0-control` (receipt `artifactLocks[*].path`) | MISSING | MISSING |
| `Designs/data-explorer/` (`README.md:6`, `sdk-pm-charter.md:105-107`, `web-client-os-boundary-pressure.md:6`) | MISSING | MISSING |

Merging **this branch alone** lands a design set and an executable receipt whose declared source
paths resolve to nothing.

**Stale fact.** `sdkv2:Designs/sdkv2/sdk-pm-charter.md:104-110` calls the Data Explorer input
"the exact **local-only** planning commit `08bb5f29…` on `codex/data-explorer-pm`" and "not a
merged, **remote-visible**, promoted, or protocol-authoritative dependency". `git branch -a --contains 08bb5f2906191f0d87624d9a6ecc6788a8b2754d`
→ `remotes/origin/codex/data-explorer-pm`. It **is** remote-visible. The same "local-only" wording
repeats at `README.md:6`, `architecture-candidate.md:113-115` and
`web-client-os-boundary-pressure.md:6`.

### 5.3 With `main` `Designs/web-client-os` — the census landed; the boundary doc did not

`Designs/web-client-os/type-data-abi-boundary-pressure.md` and
`ethereum-standards-and-interop.md` name a "Protocol SDK" as the owner of "canonical Ethereum
encodings, low-level RPC" (`ethereum-standards-and-interop.md:112`), "exact IDs, codecs, validators,
raw receipts" (`type-data-abi-boundary-pressure.md:99`) and the `TypeRevisionId` boundary (`:491`).
On `main` nobody specifies that module. This branch does — but only two-thirds of it reached the
Web Client PM:

- **Census: seen.** `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md:141-149` says
  "An independent SDK v2 census at `efs-project/planning@4d3e736` … was reconciled after this
  screen. It independently reached the same boundary for EIP-1193/6963, EIP-1898, EIP-5792,
  EIP-7702, account abstraction, signatures, wallet permissions, clear-signing descriptors, and
  canonical read-back", and reconciles the document counts (612 ERC-lane docs including the ERC
  repo's copy of `eip-1.md`; "both passes agree on 611 unique ERC proposals and 1,195 unique
  canonical substantive proposals"). `Daily Notes/agent-status.md:230` (2026-08-22,
  `@web-client-os-pm`) confirms it. Three other `main` documents consumed it as dated evidence
  (`media-infrastructure.md:182`, `open-web-app-store/README.md:205`, `architecture.md:7`), with
  matching agent-status entries at `:235` and `:237`.
- **Boundary-pressure doc: no `main`-visible trace.** `sdkv2:Designs/sdkv2/web-client-os-boundary-pressure.md:7`
  claims `**Reviewers:** @web-client-os-pm (2026-08-22)`. `grep -rln "CapabilityRPC"` on `main`
  → **0 files**. `grep -rn "lossless semantic adapter"` on `main` → **0 hits**. No agent-status
  entry mentions it. The `@web-client-os-pm` handle is not in `Onboarding/authority.md` (which
  lists only `@james`) — that file is a decision roster, not a reviewer roster, so this is the
  vault's normal agent-review convention, but it means the attribution is self-asserted and
  uncheckable.
- **The seam is live and mutually unaware.** `Designs/web-client-os/app-runtime-and-direct-launch.md:789-800`
  (touched 2026-08-26, four days *after* the branch's doc) says "The SDK PM needs these generic
  contracts pressure-tested without freezing names" and lists `AppRoute`/`DirectAppLaunchPlan`,
  `Resolved<T>`/`ByteOutcome`, "capability discovery/open/invoke/close plus grants/revocation",
  `ActionPlan`/`ActionReceipt`. Items 4–5 of that ask are almost exactly SDK-E6 / S13. Neither
  document cites the other. Its dependency chain
  (`generated Protocol codecs → generic Realm/Artifact/Files SDK → stable consumer outcomes and
  domain DTOs → OS App SDK semantic contracts → MessagePort/WIT/agent bindings → product App SDKs`)
  is structurally the same stack as `sdkv2:…/web-client-os-boundary-pressure.md` §Candidate
  consumption stack. Two lanes independently converged and neither knows.

**Data Explorer divergence.** The branch treats Data Explorer as an *independently owned first-party
product with its own PM* (`sdkv2:Designs/sdkv2/README.md:144`, "Instantiated product coordination
input": "Data Explorer is an independent general-purpose typed-data product, not a File Browser
panel"; `sdk-pm-charter.md:84` lists a "Data Explorer PM" counterpart row).
`main` treats it as a **built-in App inside the Web Client/OS**:
`Designs/web-client-os/app-runtime-and-direct-launch.md:745-747` ("Data Explorer is the default
trusted general-purpose data App for an unqualified Files/data link and the durable raw/provenance
fallback"), `architecture-and-modules.md:328` ("built-in default … and a fallback"), README direction
25 (`:147-149`). Crucially `main`'s MVP reservation
(`app-runtime-and-direct-launch.md:847`) names **"The write-capable File Browser/Data Explorer"** as
*one* vertical. The two views are reconcilable — `main` also gives Data Explorer ownership of
"navigation, projections, selection, workspaces" (`:755`) — but "one MVP vertical" vs "two
independently owned products with separate PMs and separate product budgets" is a real scope fork,
and there is no Data Explorer lane, folder, PM row, or queue on `main` at all.

**Where the branch is squarely right.** `sdkv2:Designs/sdkv2/experiment-program.md` S7 adopts
`main`'s guest budget verbatim — "at most 250 KiB compressed unless a 250–400 KiB exception is
justified; parse/execute at most 150 ms; no long task over 50 ms" — which matches
`Designs/web-client-os/mvp-and-acceptance.md:300,304,306` exactly. S8's caps (18,432 runtime /
36,864 initcode bytes) are a clean 75% of EIP-170's 24,576 and EIP-3860's 49,152, i.e. a declared
25% headroom, consistent with `research-precedents.md:86`.

---

## 6. Lane question 4 — what the write-capable File Browser MVP needs

`Designs/web-client-os/mvp-and-acceptance.md:895-896` frames the slice: "do create folder, create
file, and publish revision form the smallest [official write slice]". `:710-720` and the
§"EFS v2 pressure matrix" name the surfaces. Scoring the sdkv2 set against them:

| MVP need (`main` citation) | sdkv2 coverage | Verdict |
|---|---|---|
| **Realm reader with pinned basis** — `mvp-and-acceptance.md` matrix row "Explicit Realm and pinned read basis … `ReadContext`" | `developer-journeys.md:117-133` `ReadContext = {realm, protocolProfile, acceptedEvmProfile, observedRpcCapabilities, acceptedTypes, acceptedLimits, basisPolicy, coveragePolicy, readSource, byteSources, optionalIndexer, optionalCache, optionalLens}`; `exp-c0-mvp-packet.md:75` `readExact`; `:76` `readPage` with the full cursor commitment; `developer-journeys.md:140-148` resolve `safe`/`finalized` once to a block hash then use EIP-1898/234 throughout | **Specified** — the best-covered need |
| **Files resolver** — canonical route/name resolution, qualified directory paging | `web-client-os-boundary-pressure.md` §Candidate consumption stack: "**Files/artifact SDK** … One canonical route/name resolution interface … **SDK PM owns reusable interface/tooling only after that contract is supplied**"; `ethereum-standards-census.md:241` routes "Keep one canonical route/name/byte resolver" *to the Files PM* | **Deferred, by design** — the SDK explicitly waits on Core/Web Client |
| **Codecs for the finite Files Types** | `architecture-candidate.md:56-57` generated exact-Type DTO + canonical codec; `exp-c0-mvp-packet.md:86` "For the first two C0 fixture Types". Which two? Not named. `experiment-program.md` §Open questions: "Which exact three application Types best cover Files, Git/Markdown, agent and contract-consumption pressure after the one-Type bootstrap fixture?" | **Mechanism specified, Files instance not selected** |
| **`PublicationSet`/`AdmissionPlan` signing** | Named **once**, at `exp-c0-mvp-packet.md:118`, inside the list of Core inputs the SDK is *still waiting for*: "Exact Type, Record body, PublicationSet, Occurrence, AdmissionPlan, Binding CAS/tombstone/Withdrawal, QueryProfile activation, and finite projection manifest inputs." | **Blocked on Core** — and named differently from `main` (see below) |
| **Submission** | `exp-c0-mvp-packet.md:80` `authorizeAndSubmit`; `developer-journeys.md:161` full pipeline; `architecture-candidate.md:367` receipt (2) | **Specified at the mechanism level** |
| **Receipts** | Three separately named, non-flattenable receipts (`architecture-candidate.md:367`; `exp-c0-mvp-packet.md:26`) | **Specified — and better than `main`**, which names only `ActionPlan`/`ActionReceipt` |
| **Read-after-write** | `exp-c0-mvp-packet.md:81` `recoverEffect` — "transport acknowledgement alone is never recovery"; `developer-journeys.md:42` "a transaction receipt alone is not the final product result"; effect axis becomes `NOT_COMMITTED_PROVEN` "only after an exact pre/post state basis proves equality" (`exp-c0-mvp-packet.md:54`) | **Specified — the strongest single contribution** |

**The naming problem.** Of the nouns `main`'s MVP uses, the sdkv2 set names essentially none:

| `main` noun (`mvp-and-acceptance.md` / `hierarchical-files-and-folders.md`) | Occurrences in `Designs/sdkv2/` |
|---|---|
| `FilesConsumerAdapterV0` | **0** |
| `ByteOutcome` | **0** |
| `BindingScope` | **0** |
| `PublicationEnvelope` | **0** (branch says `PublicationSet`) |
| `AdmissionIntent` | **0** (branch says `AdmissionPlan`) |
| `ActionReceipt` | **0** |
| `ChunkTree` | **0** |
| `FileRevision` | **0** |
| `DirectoryEntry` | **0** |
| `ActionPlan` | 1 (`developer-journeys.md:21`, as illustrative vocabulary) |
| `ResolutionPlan` | 3 |

`PublicationSet`/`AdmissionPlan` come from the readiness Core packet
(`exp-c0-mvp-packet.md:118`); `PublicationEnvelope`/`AdmissionIntent` are `main`'s
(`Designs/efsv2/core-architecture-candidate.md`, `hierarchical-files-and-folders.md`,
`layered-type-system-and-data-abi.md`). Neither branch nor `main` carries a crosswalk. For a
reviewer trying to decide whether the SDK covers the write slice, this is the single biggest
obstacle: the two sets are describing the same operations in disjoint vocabularies.

**Net:** the SDK set specifies the **generic** half of what the MVP needs (read context, basis,
plan/sign/submit/recover, result law, byte outcomes as an axis) and defers or omits the **Files**
half (resolver, the finite Files Type set, directory listing/`BindingScope`, revision publication
nouns). Nothing here is wrong; it is a lane boundary the set states honestly
(`sdk-pm-charter.md:66-71`: the SDK "does not own either product"). But no document anywhere says
*who* writes the Files SDK contract or *when*, which is precisely R17's F2 finding, unrepaired by
this branch.

---

## 7. Lane question 5 — over-scope, and the minimum slice

### 7.1 Over-scoped for the next year

1. **Generated Solidity leaves + the S9 helper bakeoff.** S9 demands "1/10/100/1,000 reads,
   cold/warm/nested traces, full deployment manifest, independently recomputed CREATE2 address,
   factory/code/profile/dependency verification, local fallback, helper/dependency
   absence/mismatch/proxy attacks", with a two-lane objective ("P95 end-to-end gas is both at least
   20% and 25,000 gas lower and lifecycle gas breaks even by 100 reads" **or** a 15%-size lane).
   There is no EFS 2.0 contract to consume. The set's own stop condition 1 says production work
   must not begin while Core "semantics, bytes, IDs, result ABI, limits, module boundary" are not
   in an owner-reviewed freeze candidate — which they are not. SDK-E3 explicitly says "Failure kills
   only the helper lane"; the correct move now is to *not start* the lane.
2. **S13 CapabilityRPC / OS App SDK (SDK-E6).** A seven-verb lifecycle, three transport bindings
   (MessagePort/structured-clone, WIT, agent), grant/epoch recheck at three authorization decision
   points, durable outcome recovery, byte streaming and resumable subscriptions. This is an
   operating-system project. `main` has no confined third-party app runtime yet
   (`Designs/web-client-os/app-runtime-and-direct-launch.md` is still `#status/draft`), and
   `main`'s own MVP reservation (`:847-852`) explicitly defers "generic external-App package
   resolution or a production-safe arbitrary third-party [runtime]".
3. **S16 three-host resolved-filesystem conformance.** Golden route/name/collision fixtures on
   Linux, macOS and Windows. The mount requirement is adopted
   (`Designs/efsv2/README.md:102`) but has no owner, folder or queue on `main` (R17 F6). The SDK
   set gates a conformance claim on a lane that does not exist.
4. **S11 optional EAS carrier.** `Decisions.md` 2026-08-08 greenfield ruling removes v1
   compatibility; `sdkv2:…/owner-decision-inbox.md` SDK-P1 agrees EAS "does not define EFS v2
   compatibility". Testing an EAS carrier round-trip is answering a question nobody is asking.
5. **SDK-E2 package topology and SDK-E4 compatibility matrices.** Both are post-freeze by their own
   text. Keeping them in the queue is harmless; spending on them is not.
6. **Release classes and Phases 3–4** (`sdk-pm-charter.md:167-183`, `:153-165`). Five release
   classes, signed provenance, archival closure, deprecation windows, replacement-drill cadence —
   for a project with zero EFS 2.0 code in any repository.
7. **Census-driven gates as a standing obligation.** `sdk-pm-charter.md` Phase 0 requires refreshing
   the EIP/ERC snapshot "when a relevant proposal, fork, wallet/provider surface, or release gate
   changes"; the census (272 lines, 1,196 documents) already needed one reconciliation pass with the
   Web Client screen. This is a recurring cost with no MVP payoff.

### 7.2 The minimum slice — and the set does name it

`sdkv2:Designs/sdkv2/README.md:86-97` §"Highest-leverage disposable work proposed after this review"
names exactly three runs, and they are the right three:

1. **One compiler fixture** — one small Type + one additive revision → TypeScript, Solidity, docs,
   vectors, bounds, reproducibility manifest; two independent encoders compared; unknown raw bytes
   retained.
2. **One Solidity three-arm measurement** — generated inline vs bounded structural reader vs
   stateless helper on three workloads, cold calls and adversarial inputs.
3. **One evidence/reconstruction harness** — inject missing pages, stale/dishonest indexers,
   tampered bytes, unavailable publisher, unknown profile; prove none becomes absence or success.

Plus what already exists and passes: the six-case semantic fixture and the clean-room serialized
consumer (§9).

**For a write-capable File Browser MVP specifically, the minimum is smaller still:** items 1 and 3,
scoped to the Files Types, plus the `readExact`/`readPage`/`readBytes`/`plan`/`authorizeAndSubmit`/
`recoverEffect` operation families of `exp-c0-mvp-packet.md` §First offchain TypeScript slice.
Item 2 (Solidity) is not on the MVP path at all — the MVP has no contract consumer.

**Does the set say so?** Partly. It names the three runs and the Week-1A/1B/1C queue
(`experiment-program.md:173-215`), and its stop conditions are genuinely restrictive. What it never
says is which of S0–S16 / SDK-E1…E6 should be **dropped** rather than deferred, or that item 2 is
off the MVP path. Everything is "wait for evidence"; nothing is "cut". That is the DIRECTION-level
problem with the set: a sixteen-gate program with no prioritisation is indistinguishable, in
practice, from a program that never starts.

---

## 8. Lane question 6 — merge result

Already answered in §1. Summary for the report:

```
$ git -C the planning vault merge-tree --write-tree main origin/codex/sdkv2-pm
57f08186b29e4860a993bad9666f0b70d56b9a94
100644 68e7adc… 1  Daily Notes/agent-status.md
100644 b193899… 2  Daily Notes/agent-status.md
100644 fb35f18… 3  Daily Notes/agent-status.md
Auto-merging Daily Notes/agent-status.md
CONFLICT (content): Merge conflict in Daily Notes/agent-status.md
Auto-merging Kanban.md
(exit 1)
```

One trivial append-order conflict in the daily status log. Everything else auto-merges, including
`Designs/README.md`, `Designs/owner-decision-inbox.md`, `Onboarding/start-here.md`,
`Open-Decisions.md`, `Kanban.md`. After merge, `Open-Decisions.md` would need one regeneration
(`scripts/open-decisions.sh`), which I confirmed reproduces the branch's committed file
byte-identically apart from the date stamp.

---

## 9. Verification log — what I actually executed

| Check | Method | Result |
|---|---|---|
| `check.mjs` (six-case semantic preservation fixture) | `node check.mjs` in the read-only worktree | **PASS 6 EXP-C0 SDK MVP preservation cases** |
| `check-core-consumption.mjs` (clean-room serialized consumer) | Failed in-place: `Error: Cannot find module 'ethers'`. Reproduced only after building the two sibling directories the script hard-codes | **PASS 5 Core artifacts, 4 Result encodings, 6 Type envelopes, 13 mutations** |
| Source-lock hashes | `sha256sum` on the 5 vendored `core-inputs/` files; `git show b9088d6:…` piped to `sha256sum` for all 10 readiness artifacts | All 10 match the receipt exactly |
| Receipt/report hashes | `sha256sum core-source-lock-v0.json sdk-consumption-v0.json` | `c750a63b…2858` / `ef8ba1b0…9f7b` — both match `readiness:…cross-lane-acceptance/README.md` §Exact evidence |
| Branch head vs acceptance record | `git rev-parse origin/codex/sdkv2-pm` | `57d04f85ae2687ee8ea63d945378df5a9a6492a5` = the "SDK packet" the readiness acceptance names |
| Vault scripts on the branch | throwaway clone; `tri-sync-check`, `needs-integration`, `open-decisions`, `promotion-check`, `designs-awaiting-promotion`, `stale-cards` | all clean; `Open-Decisions.md` regenerates identically |
| Merge | `git merge-tree --write-tree main origin/codex/sdkv2-pm` | one conflict, `Daily Notes/agent-status.md` |
| Census drift | `diff scratchpad/census-4d3e736.md sdkv2:Designs/sdkv2/ethereum-standards-census.md` | identical — `main`'s four permalinks cite current text |

**The reproducibility defect this exposed.** `sdkv2:Reviews/2026-08-25-sdkv2-exp-c0-mvp/check-core-consumption.mjs`
lines 10–15:

```js
const planningRoot = path.resolve(reviewDir, '../..');
const coreRoot     = path.resolve(planningRoot, '../planning-v2-readiness');
…
const ethereumRequire = createRequire(path.resolve(planningRoot, '../contracts/package.json'));
const { AbiCoder, keccak256, toUtf8Bytes } = ethereumRequire('ethers');
```

and lines 501–503 shell out to `git -C <coreRoot> cat-file -e …` / `git -C <coreRoot> show <commit>:<path>`.
So the "independent clean-room" checker requires (a) a sibling checkout of the **readiness branch**
at the exact directory name `../planning-v2-readiness`, and (b) a sibling **v1 contracts** checkout
whose `node_modules` provides `ethers`. Its own README says only "With only Node, ethers, these
five files, and the existing SDK semantic fixture" and gives the run instructions as two bare
`node` invocations. Neither prerequisite is declared. This directly violates the set's own
discipline — `architecture-candidate.md` security invariant 11 ("no live registry is required to
verify or reconstruct"), `experiment-program.md` §Shared fixture closure ("a command-independent
explanation of how to reproduce the run"), and the century ruling itself. Note the contrast:
`readiness:…/cross-lane-acceptance/README.md` says "The checker uses `git show <commit>:<path>`
rather than live worktrees" and calls its artifact "environment-free" — the readiness lane got this
right and the SDK lane did not.

---

## 10. What this set assumes about its neighbours, and whether they agree

| Assumption | About | Where stated (branch) | Neighbour's position | Agrees? |
|---|---|---|---|---|
| Core will supply `ResultV0` axes, cursor preimage, three receipt shapes, projection closure | efsv2 / readiness Core | `architecture-candidate.md:454-477`; `exp-c0-mvp-packet.md:117-123` | Readiness branch supplies exactly this at `b9088d6`; `main` has no `ResultV0` at all | **Yes on the branch, No on `main`** |
| The Web Client's 250 KiB / 150 ms / 50 ms guest budget is the SDK's integration gate | web-client-os | `experiment-program.md` S7 | `Designs/web-client-os/mvp-and-acceptance.md:300,304,306` — same numbers | **Yes** |
| The Web Client PM reviewed the boundary-pressure doc on 2026-08-22 | web-client-os | `web-client-os-boundary-pressure.md:7` | No `main` trace; `CapabilityRPC` 0 hits on `main` | **Unknown / unverifiable** |
| Data Explorer is an independently owned first-party product with its own PM | data-explorer / web-client-os | `README.md:144`; `sdk-pm-charter.md:84` | `main`: built-in default App inside the Web Client (`app-runtime-and-direct-launch.md:745`); MVP names "File Browser/Data Explorer" as one vertical (`:847`); no DE lane on `main` | **No (on `main`)** |
| The Files/artifact contract will be supplied by Core/Web Client before the SDK owns its interface | efsv2 Files / web-client-os | `web-client-os-boundary-pressure.md` §Candidate consumption stack | `Designs/efsv2/hierarchical-files-and-folders.md` is `#status/review`; `main` names `FilesConsumerAdapterV0` as an MVP acceptance line but assigns no owner | **Unknown — the R17-F2 hole** |
| `PrincipalId` is a product baseline, not a frozen Core mechanism | efsv2 | `README.md:143` | `Designs/efsv2/core-architecture-candidate.md:410` keeps it as a bakeoff arm | **Yes** |
| v1 `sdk/` packages, EAS identity, attester defaults do not carry into v2 | efsv2 / sdk | `owner-decision-inbox.md` SDK-P1 | `Decisions.md` 2026-08-08 greenfield ruling; `Designs/README.md` Review banner | **Yes** |
| An SDK PM role exists and owns two surfaces | owner / vault-process | `owner-rulings.md`; `owner-decision-inbox.md` SDK-S1 | `Onboarding/authority.md` lists only `@james`; `main` has two docs *asking* an SDK PM for things but none establishing the role | **Unknown on `main`** |
| Century preservation governs the SDK program | owner / efsv2 | `owner-rulings.md` 2026-08-22 | `main` carries the century horizon widely, but `Designs/efsv2/owner-rulings.md` 2026-07-10 §"Simplifying assumption: chains don't die" **drops** dead-chain hedging, "the dead-chain fire drill *as a survival gate*", and "graded/UNKNOWN after the home chain is gone" | **Unreconciled** — see §11 |

---

## 11. Decided / undecided / documents that disagree with a ruling

### Decided (and where recorded)

| Item | Where recorded | Docs that disagree |
|---|---|---|
| SDK PM mandate; `Designs/sdkv2/` is the source spine | `sdkv2:Designs/sdkv2/owner-rulings.md` §2026-08-22 — **branch only** | `Designs/owner-decision-inbox.md` §Recording rule and `Onboarding/start-here.md` on `main` still route all EFS v2 rulings to `efsv2/owner-rulings` |
| 100-year preservation horizon after freeze | same file, second ruling — **branch only** | `Designs/efsv2/owner-rulings.md` 2026-07-10 "chains don't die" narrows how much preservation machinery the design may carry; the SDK set never cites it |
| No v1/EAS baseline for v2 SDK (SDK-P1) | `sdkv2:…/owner-decision-inbox.md`; consistent with `Decisions.md` 2026-08-08 | `Designs/sdk-v1-bridge-v2-compat-asks.md` on `main` (R17 F3) still asks v2 to adopt v1 commitments |
| Friendly APIs may not hide qualification (SDK-P2) | `sdkv2:…/owner-decision-inbox.md` | none — matches `mvp-and-acceptance.md:700-703` |
| Arm C is the recommended disposable path | `sdkv2:…/architecture-candidate.md` §Recommendation (a PM recommendation, not a ruling) | none |

### Undecided and unowned

1. **Does `Designs/sdkv2/` land on `main`?** In no inbox on either branch. Owner: `owner` via `vault-process`.
2. **Who writes the Files SDK contract** (`FilesConsumerAdapterV0`, `BindingScope` listing,
   revision publication)? SDK says Core/Web Client must supply it first; Web Client names it as an
   MVP acceptance line; nobody owns it.
3. **The `PublicationSet`/`AdmissionPlan` ↔ `PublicationEnvelope`/`AdmissionIntent` crosswalk.**
4. **Which result law governs** — JR-5/LN-6 + `AcceptanceMatrixV1`, `Resolved<T>`/`ResourceOutcome<T>`,
   or `ResultV0`. SDK-E5 asks the narrow version of this; nobody owns the reconciliation.
5. **Data Explorer's ownership and whether it is one MVP vertical or two products.**
6. **Which exact Types the first compiler fixture uses** (`experiment-program.md` §Open questions).
7. **How the century ruling interacts with the "chains don't die" ruling.**

### Documents that disagree with a ruling

- On `main`: nothing in `Designs/sdkv2/` exists, so no `main` document can disagree with the SDK
  rulings — which is itself the defect.
- On the branch: `sdk-pm-charter.md` Phase 4 ("Periodic replacement drills assume npm, GitHub,
  hosted docs, default RPC, indexer, publisher, and current maintainers are unavailable") revives a
  *drill cadence* the 2026-07-10 ruling dropped "as a survival gate" — though the drill targets
  tooling/publisher loss, not chain death, so it stays on the legal side of the ruling. Likewise
  `experiment-program.md` S5's second arm rebuilds "independently from declared Realm state", i.e.
  it explicitly assumes the chain is alive. **The substance is compliant; the reconciliation is
  simply never written down.**

---

## 12. Solid now / settle first / cut

### Solid enough to build on now

1. The **`ResultV0` axis separation** and the three-receipt split. This is the best-specified
   evidence discipline anywhere in the vault, and `check.mjs` mechanically enforces the two hardest
   rules (no `EFFECT_REJECTED`; `NOT_COMMITTED_PROVEN` requires pre/post equality).
2. The **`EXP-C0` source lock**, verified byte-for-byte in both directions against the readiness
   branch and the cross-lane acceptance.
3. The **`ReadContext` capability-injection shape** (`developer-journeys.md:117-133`) — no ambient
   provider/wallet/indexer, sources are inspectable values.
4. The **write pipeline** `construct → validate → plan → simulate → clear-sign → authorize →
   submit → receipt/finality → canonical read-back` with role separation (author / signer /
   submitter / payer / beneficiary / admitter).
5. The **S7 budget adoption** — the SDK measures itself against the Web Client's own numbers.
6. **SDK-P1/P2** — the two superseded inputs are correctly and consistently killed.
7. The **arm-C recommendation itself** — reversible, falsifiable against A and B with one fixture.

### Settle first

1. **Land or explicitly hold `Designs/sdkv2/` on `main`, and record the two 2026-08-22 rulings
   where `main` can see them** (`Designs/efsv2/owner-rulings.md` or `Decisions.md`, plus the
   `Designs/README.md` row and the recording-rule edit). Until then the SDK lane does not exist.
2. **Fix the three dangling input paths** and the "local-only" stale wording, or land the sibling
   branches together.
3. **Make `check-core-consumption.mjs` runnable from the repo** — no `../planning-v2-readiness`, no
   `../contracts/package.json`.
4. **One crosswalk page** binding `ResultV0` axes ↔ JR-5 absence sources ↔ LN-6 6+1 axes ↔
   `Resolved<T>`/`ResourceOutcome<T>`/`ByteOutcome`, and `PublicationSet`/`AdmissionPlan` ↔
   `PublicationEnvelope`/`AdmissionIntent`.
5. **Name the Files owner** — who supplies `FilesConsumerAdapterV0` and the finite Files Type set,
   and by when.
6. **Denominate every gas/size tripwire in an explicit execution profile** and say whether the
   Glamsterdam state-creation repricing is in scope.
7. **Reconcile the century ruling with the 2026-07-10 "chains don't die" ruling** in one paragraph.

### Cut (from anything the next year touches)

- S9 helper bakeoff and the whole deployed-helper lane (SDK-E3).
- S13 CapabilityRPC / OS App SDK bindings (SDK-E6) — return it when the Web Client has a confined
  app runtime.
- S16 three-host filesystem conformance — no mount lane exists to receive it.
- S11 EAS carrier round-trip.
- SDK-E2 package topology and SDK-E4 compatibility matrices as *work* (keep them as queue rows).
- Release classes / Phases 3–4 / signed provenance / deprecation windows.
- The standing census-refresh obligation; refresh once, before a release packet.
- Generated Solidity leaves for the MVP specifically — the write-capable File Browser has no
  contract consumer.

---

## 13. Findings (see structured output for the canonical list)

Numbered `R22-F1 … R22-F17` in the structured summary, routed to `sdk`, `vault-process`, `owner`,
`web-client-os` and `efsv2`.
