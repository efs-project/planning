# R23 — EFS Data Explorer design set (branch `origin/codex/data-explorer-pm`)

**Lane:** R23-data-explorer-branch
**Worktree:** `data-explorer`
**Branch:** `origin/codex/data-explorer-pm` @ `8d90ecb` "design: consume exact Core source lock in Explorer lane"
**Position vs `main`:** 4 ahead / 10 behind. Merge base `c4e0ef1` (2026-08-24).
**Citation convention:** branch-only paths are prefixed `data-explorer:`. Unprefixed paths are `main` at the planning vault. Sibling branches are prefixed `readiness:` (`origin/codex/v2-readiness-week`) and `sdkv2:` (`origin/codex/sdkv2-pm`).

---

## 1. What the branch actually adds

`git diff --stat main...origin/codex/data-explorer-pm` — 24 files, +4115 / −8:

| Area | Files | Lines |
|---|---|---|
| `Designs/data-explorer/` (new set) | 8 | 3132 |
| `Reviews/2026-08-25-data-explorer-exp-c0-consumption/` (new, executable) | 8 | 951 |
| Vault surfaces edited | `Designs/README.md` (+1 row, +3 repo-index cells), `Designs/owner-decision-inbox.md` (+1 link, date), `Open-Decisions.md` (regenerated, +DATA-E1…E4), `Kanban.md` (+1 In Flight card), `Reviews/README.md` (+1 section), `Daily Notes/agent-status.md` (+5 entries) | 32 |

The set touches **nothing** in `Designs/web-client-os/` or `Designs/efsv2/`. It carries `main`'s copies of those (the 2026-08-25 sync commit `c457d40` merged `main` in), so owner directions 1–28 and `app-runtime-and-direct-launch.md` are physically present in the branch tree while the new set contradicts parts of them.

### Per-document summary and standing

| Document | Status header | Last touched | What it owns | Standing |
|---|---|---|---|---|
| `data-explorer:Designs/data-explorer/README.md` (336 ln) | "draft set — owner-directed product baseline" | 2026-08-25 | Product direction, the 2026-08-22 direction text, authority register, 10 product laws, 5 non-goals, recommended architecture, feature horizons, ownership boundaries, non-authorizations | Spine of the set; the only place in the whole vault (any branch) where the 2026-08-22 direction is written down |
| `product-charter-and-roadmap.md` (354 ln) | "draft — first-pass product proposal" | **2026-08-22** | 7 personas, IA/global frame, Inspector's 7 sections, 5 core journeys, feature map (MVP/Next/Later × 12 capabilities), MVP definition, 10 accessibility requirements, 10 offline states | Not updated in the 08-25 EXP-C0 pass; its Feature map has no "first trace slice" row and never mentions `ResultV0` |
| `architecture-and-state.md` (777 ln) | "draft — product architecture comparison" | 2026-08-25 | A/B/C architecture bakeoff, 10 modules, the joint Reader/Explorer boundary, `ResultV0` law, cursor-commitment law, `ExplorerOpenRequest`/`ExplorerReadResult`/`ExplorerResource`/`ExplorerPartial`/`ExplorerPage`, 6 falsifier journeys, 5 state dimensions, read/write/batch/undo flows, failure vocabulary (5 tables), cache namespaces | The load-bearing document; also where the duplication with `web-client-os` is heaviest |
| `views-extensions-and-capabilities.md` (277 ln) | "draft — product-level experiment contract" | **2026-08-22** | Concept separation table, `ExplorerViewSpecV0` field model, 8 view invariants, 7 built-in views, 4 extension classes, extension lifecycle, 8 candidate capabilities, 10 sandbox requirements | Self-consistent; never names SES/LavaMoat/Endo/WIT or `AppInstanceLease`, i.e. the runtime lanes `web-client-os` already selected |
| `experiments-and-stop-conditions.md` (725 ln) | "draft — pre-implementation evidence plan" | 2026-08-25 | `EXP-C0/v0` slice, shared corpus, 7 common assertions, facts-matrix crosswalk (10 dimensions), E0/E1a/E1b/E2/E3/E4/E5/E6a/E6b with question-prototype-pass-stop each, sequence, 8 global production stops | The most rigorous document in the set and the strongest MVP-relevant contribution |
| `owner-decision-inbox.md` (169 ln) | "reference — compact live queue" | 2026-08-23 | "Decide now: nothing"; DATA-E1…E4 evidence-gated; delegated feedback asks to Core/Files/SDK/Web Client-OS | Correctly gated; source of the four new `Open-Decisions.md` rows |
| `preliminary-findings.md` (239 ln) | "draft — point-in-time research synthesis" | **2026-08-22** | 10 findings, recommended hypothesis, 9-row evidence-gate table | Dated checkpoint; predates and never mentions the EXP-C0 work the README now leads with |
| `research-landscape.md` (255 ln) | "reference — dated first-pass evidence" | 2026-08-23 | Local authority map, adjacent-product pressure, 7-row Ethereum standards table, 5 external product-category scans with live links, 8 distilled requirements, 6 unresolved gaps | Genuinely good, dated, and honestly labelled ("inference, not adoption"); the best single research artifact in the set |
| `data-explorer:Reviews/2026-08-25-data-explorer-exp-c0-consumption/` | "commit-ready disposable consumer evidence" | 2026-08-25 | 5 serialized Core inputs, role-neutral source receipt, Explorer consumption report, 327-line stdlib-only checker, 9 tests | The lane's **only executed** artifact. Verified here: `node --test` → 9 pass / 0 fail; `check-consumption.mjs --mode commit-ready` → exits 0 |

**Maturity of the set:** `draft-reviewed` in intent, `draft-unreviewed` in fact — every one of the seven design documents carries `**Reviewers:** —` (`grep -n "Reviewers:" Designs/data-explorer/*.md`), while `data-explorer:Daily Notes/agent-status.md` claims "Independent Core/Files, SDK/Web Client/OS and product/security reviews found no remaining P0/P1 after repair."

---

## 2. Q1 — Product, first target, and the collision with the `web-client-os` MVP

### What it is

`data-explorer:Designs/data-explorer/README.md:14-16`: "the primary general-purpose EFS data application: a guest-first Explorer that feels as capable as a modern file manager but can inspect any typed EFS graph through honest, configurable views." `:18-20`: "Files is the first vertical, not the product's outer boundary."

### First target, line by line against `Designs/web-client-os/mvp-and-acceptance.md`

| Capability | `web-client-os` MVP (main) | Data Explorer MVP (branch) |
|---|---|---|
| Guest deep link → folder/file, no wallet | `mvp-and-acceptance.md:35-43` | `README.md:27-28`, `product-charter-and-roadmap.md:232-234` |
| Complete-or-qualified directory listing at one basis | `:44-46` | `product-charter-and-roadmap.md:236-237` |
| Exact immutable FileRevision at pinned basis | `:47` | `:238` |
| Bytes through untrusted Locators, reject corruption, eligible fallback | `:48-49` | `:239`; `architecture-and-state.md:614-625` |
| Safe passive render / inert for active-unknown | `:50-51` | `product-charter-and-roadmap.md:220` |
| Inspectable Realm/route/Mount/Plan/basis/completeness/provenance/Locator attempts | `:52-55` | `product-charter-and-roadmap.md:115-130` (Inspector's 7 sections) |
| **`New folder`** | `:59` | `README.md:31`, `product-charter-and-roadmap.md:244` |
| **`New file` / upload from local bytes** | `:59` | same |
| **`Publish revision`** | `:59` | same |
| Lazy wallet/identity/planner/signer/submitter after explicit write ask | `:60-62` | `product-charter-and-roadmap.md:186-190` |
| Plan → consent → submit → **canonical read-back** establishes success | `:79-80` | `architecture-and-state.md:515-530`; `product-charter-and-roadmap.md:191-194` |
| Reopen exact link cold, same qualified result | `:81-82` | `experiments-and-stop-conditions.md:280-341` (E1b) |
| Tree / breadcrumbs / tabs / search / filter / sort | — | `README.md:245` |
| Local favorites / recents | — | `README.md:245` |
| Read-only exact-Type table | — | `README.md:245`; `views-extensions-and-capabilities.md:91-108` |
| Offline retained-resource reading with coverage | **explicitly deferred**, `mvp-and-acceptance.md:90-94` | `README.md:245`; `product-charter-and-roadmap.md:281-314` |
| Provenance/history panel with exact citations | inspectable diagnostics only | `README.md:245` |

**Verdict: yes, these are two first-party products claiming the same first slice.** The guest half is the same journey; the write half is the *identical three operations*. Data Explorer's MVP is a strict superset: the `web-client-os` MVP plus a desktop file-manager shell, a typed table, offline retention, favorites/recents, and a provenance Inspector — one of which (`offline`) the neighbour's MVP explicitly defers.

### Who owns the shared Reader / action-plan / consent / receipt boundary

All three sets agree on the answer, and this is the strongest point of coherence in the whole branch surface:

| Set | Statement |
|---|---|
| Data Explorer (branch) | `README.md:260`: Web Client/OS owns "Shared Reader/Artifact services, capability broker, conserved permission/signing UI, signer/submission, package activation and private system services." `README.md:218-220`: "The shared Web Client/OS action surface owns identity, signer, conserved confirmation, submission and receipt semantics. Explorer owns intent UX…" `architecture-and-state.md:283-286` repeats it as a table. |
| `web-client-os` (main) | Owns `ActionPlan`/`ActionReceipt` (`app-runtime-and-direct-launch.md:797`; `mvp-and-acceptance.md:215, 288, 420`), System Chrome, signer ceremony, submitter (`mvp-and-acceptance.md:60-80`). |
| `sdkv2` (branch) | `sdkv2:Designs/sdkv2/web-client-os-boundary-pressure.md:58`: "**Web Client/OS direct Files/shell product** — Direct guest and **write-capable** Files experience over the Web/Files façade"; `:59` gives Data Explorer only "Independent workspace, table/graph/raw/provenance views and Inspector". |

So the boundary's *ownership* is not disputed. What is disputed is **who exercises it first, and whether the Explorer's own MVP is allowed to include Files writes at all**: `sdkv2` puts write-capable Files on the Web Client/OS side of the split and gives the Explorer views only; `data-explorer` puts the same three write operations inside its own MVP. Nobody has reconciled that, and nothing on `main` records the split at all.

---

## 3. Q2 — The 2026-08-22 direction is recorded nowhere on `main`

The constitutive direction is written only here, as design-set prose:

> `data-explorer:Designs/data-explorer/README.md:69-72` — "James directed on 2026-08-22 that the Data Explorer is a durable product lane, separate from the Web Client/OS and SDK PMs. It owns the primary general-purpose EFS data application experience and may use the planning vault for high-quality research, brainstorming and experimentation."

Searches over `main`:

```
grep -n "Data Explorer" Decisions.md                       → 0 hits
grep -rn "Data Explorer" Designs/*/owner-rulings.md         → 0 hits
grep -n "Data Explorer|data-explorer" Owner-Inbox.md        → 0 hits
grep -n "Data Explorer|data-explorer|DATA-E" Open-Decisions.md → 0 hits
grep -n "2026-08-22" Decisions.md                           → 0 hits
```

`main` mentions "Data Explorer" only inside `Designs/web-client-os/` (README direction 25 and `:203`, `:206`, `:236`; `architecture-and-modules.md:80, 306, 308, 328`; `app-runtime-and-direct-launch.md` ×19) and in `Reviews/`. There is no `Designs/data-explorer/` folder, no PM row, no queue, and no ruling.

**This is a process defect, and the vault's own rules say which one.**

- `AGENTS.md:44`: "A ruling is recorded in the history owned by the queue that owns the item — `Designs/<folder>/owner-rulings.md` where that file exists, `Decisions.md` otherwise — and never in both." The Data Explorer set has an `owner-decision-inbox.md` but **no** `owner-rulings.md`, so the direction belonged in `Decisions.md`. It is not there, on `main` or on the branch (`git diff` shows the branch does not touch `Decisions.md`).
- `Designs/efsv2/owner-rulings.md:126-136` (2026-07-23, "CORRECTION — agent synthesis was not an owner ruling") is the standing precedent for exactly this failure mode: commit `471a2ca` "incorrectly promoted several integration-agent conclusions to **RATIFIED** owner rulings." A one-paragraph paraphrase in a PM lane's own README, on an unmerged branch, is weaker evidence than what that correction retracted.
- The set is aware of the rule and applies it forward but not backward: `data-explorer:Designs/data-explorer/owner-decision-inbox.md:162-169` "After James answers a real product question, record the attributed ruling before changing authority labels." The direction that created the lane never got that treatment.

I cannot verify from here whether the direction was given (see `unverifiable`). The defect is that a whole product lane, a `Designs/` folder, four owner-queue items and a Kanban card now rest on an unrecorded, unattributed, branch-only paraphrase.

---

## 4. Q3 — Direction 25, V2-C2, and direction 2

### Direction 25 — the set agrees

`Designs/web-client-os/README.md` direction 25: "Data Explorer is the default App for unqualified Files/data links and a raw fallback, **not a gateway** through which every App must launch."

`data-explorer:Designs/data-explorer/README.md:23-25`: "Data Explorer is the default App and raw fallback for unqualified Files/data routes; an exact route to another App uses the same shared Reader substrate **without launching or passing through Explorer UI**." That is a faithful restatement. `architecture-and-state.md:285` also keeps the Explorer as "one built-in app". **No gateway claim exists anywhere in the set.**

### But it does claim product primacy, against `main`'s single-vertical framing

`data-explorer:README.md:14` calls it "**the primary** general-purpose EFS data application" and `:18-20` makes Files "the first vertical, not the product's outer boundary." `main` frames the same thing as one product: `Designs/web-client-os/app-runtime-and-direct-launch.md:847` — "**The write-capable File Browser/Data Explorer** remains the first official vertical." `architecture-and-modules.md:305-308` puts the Data Explorer guest entry inside "the MVP critical closure" of the Web Client, not beside it.

So: **agrees on routing, diverges on ownership and product primacy.** The branch converts one MVP vertical into two product lanes with two acceptance suites, and never cites either `app-runtime-and-direct-launch.md` or `mvp-and-acceptance.md` while doing it (`grep -rno "web-client-os/[a-z-]*" Designs/data-explorer/` returns only `README`, `architecture-and-modules`, `type-data-abi-boundary-pressure` — both boundary-defining documents are missing, although both are present in the branch's own tree).

### V2-C2 vs direction 2

`readiness:Designs/efsv2/owner-decision-inbox.md:79-86` — "**V2-C2 — First vertical product target.** Use the direct no-wallet **raw** Data Explorer plus the minimum Files profile … This follows the owner's explicit top-to-bottom overnight direction."

Two separate problems, and the owning lane supplies the evidence for both:

1. **V2-C2 mislabels the slice.** What V2-C2 selects is exactly the Explorer's "First trace slice", and the owning lane says in terms what that slice is not: `data-explorer:README.md:244` — "Direct guest route to one exact bootstrap/revision/basis, one exact Type/Record/Occurrence, verified byte acquisition … and a raw/provenance Inspector. **It is the E1a/E1b prerequisite, not a public route, API, or standalone product claim.**" `architecture-and-state.md:177` — "The first C0 pressure journey is deliberately smaller than the Files MVP." A readiness lane has promoted another lane's declared *prerequisite trace* into "first vertical product target" without citing that lane.
2. **V2-C2 is read-first; direction 2 is write-first.** `Designs/web-client-os/README.md` direction 2: "The first MVP must be an official **write-capable** File Browser, not a read product plus a substitute debug page. It needs deliberately basic folder and file creation/writes so the client can also debug the evolving contracts." V2-C2 selects a "raw" Explorer. R21 records the same contradiction from the readiness side.

**The Explorer set knows about direction 2 and does not resolve it.** `data-explorer:Designs/data-explorer/product-charter-and-roadmap.md:341-343`: "Can the typed table remain read-only in the first product while the same release still satisfies **the owner-directed write-capable File Browser requirement** through basic Files operations?" — an open checkbox, no citation to direction 2 by number, no owner item raised (`owner-decision-inbox.md:10-14` says "Decide now: nothing").

Its own sequencing, however, settles the practical order: `experiments-and-stop-conditions.md:601-605` — "Do not start E6a until Files and Web Client/OS supply an authorized disposable action planner/executor … If that boundary remains open, the first production scope is read-only; the Explorer must not invent it." The Explorer's write arm is therefore *structurally downstream* of the `web-client-os` MVP shipping. Whatever the label says, the Explorer cannot be first for writes.

---

## 5. Q4 — What it needs from Core/SDK that `main` lacks; what duplicates `web-client-os`

### Needs that `main` does not currently supply

| Need | Where the Explorer states it | State on `main` |
|---|---|---|
| `canonicalityObservation` + `canonicalityAssessment` as separate axes | `architecture-and-state.md:217, 646`; `owner-decision-inbox.md:105-118` | **Absent.** `grep -rc "canonicality" Designs/web-client-os/*.md` → zero matches in the whole set. The concept exists only on `sdkv2` (6 files) and `readiness` (10 files). `Designs/web-client-os/ethereum-standards-and-interop.md:127` mentions `requireCanonical` as an EIP-1898 field, not an outcome axis |
| `evidenceKind` (provider observation / verified state proof / verified receipt proof / local recomputation) | `experiments-and-stop-conditions.md:104-107`; `architecture-and-state.md:645` | Absent from `web-client-os`; one unrelated hit in `Designs/efsv2/hierarchical-files-and-folders.md:800` (a byte-layout field) |
| `historyCoverage` + `historyAvailability` as an independent causal axis on every outcome | `architecture-and-state.md:602-612, 650` | Absent as a named axis; `Designs/web-client-os/type-data-abi-boundary-pressure.md:357-367` lists 7 qualification axes and does not include it |
| Opaque cursor that binds `RealmId`, exact `QueryProfileId`, exact Type, activation generation, Realm revision, declared ordering, admission high-water and exact observation basis | `architecture-and-state.md:165-173`; `experiments-and-stop-conditions.md:47-53` | **Open question, not a contract.** `Designs/efsv2/mountable-filesystem-semantics.md:678` still asks "What basis-bound cursor and high-watermark/end receipt proves a direct-child or property enumeration complete enough for `ABSENT_PROVEN`?" |
| Complete `BindingScope` enumeration for tree/list completeness | `owner-decision-inbox.md:88-91`; `research-landscape.md:51` | Open on both sides — `Designs/web-client-os/type-data-abi-boundary-pressure.md:824-825` asks whether existing indexes falsify the `BindingScope` need |
| A real disposable SDK adapter + dependency/network trace surface for E1b | `owner-decision-inbox.md:121-125` | No EFS 2.0 SDK exists (brief fixed context); `sdkv2` is unmerged |
| A disposable, authorized action planner/executor for E6a | `experiments-and-stop-conditions.md:601-605` | `web-client-os` designs the ceremony but no disposable lab exists |
| Structured agent-read parity surface | `product-charter-and-roadmap.md:227` (Agents row) | `Designs/web-client-os/mvp-and-acceptance.md` §E "Agent parity" exists — this one *is* supplied |

### What duplicates `web-client-os`

| Concept | Data Explorer | `web-client-os` on `main` |
|---|---|---|
| Reader Kernel / shared read spine | `architecture-and-state.md:283, 294-296`; `preliminary-findings.md:74-82` | `architecture-and-modules.md:141-160` §Layer 1A |
| Exhaustive resource outcome law | `architecture-and-state.md:583-601` (14 rows) | `type-data-abi-boundary-pressure.md:300-350` `ResourceOutcome<T>` (8 branches) — and `Designs/efsv2/hierarchical-files-and-folders.md:1487-1509` has a *third*, 19-code Files vocabulary |
| Byte outcome law | `architecture-and-state.md:613-625` (7 rows) | `type-data-abi-boundary-pressure.md:372-384` `ByteOutcome` (6) + `LocatorAttempt.outcome` (9) |
| Plan / consent / receipt / read-back | `architecture-and-state.md:515-530, 656-680` | `mvp-and-acceptance.md:178-278`; `app-runtime-and-direct-launch.md:797` |
| Inspector / raw fallback | `product-charter-and-roadmap.md:115-130`; `views-extensions-and-capabilities.md:130-144` | `architecture-and-modules.md:306-308` "If Data Explorer fails, the smaller raw rescue remains usable" |
| Extension/capability model, sandbox lanes | `views-extensions-and-capabilities.md:146-248`; E5 at `experiments-and-stop-conditions.md:561-597` | Five execution lanes, SES-in-Worker, LavaMoat/Endo, opaque iframe, Wasm/WIT, `AppInstanceLease`, capability protocol — `app-runtime-and-direct-launch.md`; owner direction 26; and `:758-760` already says "A Data Explorer view extension uses the same generic App runtime". The Explorer set **never names SES, LavaMoat, Endo, WIT or the App runtime** (verified by grep) |
| Guest bundle budget | `experiments-and-stop-conditions.md:267-269` (≤250 KiB, >400 KiB fails) | `mvp-and-acceptance.md:300` — identical numbers; the Explorer honestly labels them "a disposable Web Client/OS pressure target" |
| Acceptance suite for the same UI | E0–E6b, largely 6-participant usability rounds | `mvp-and-acceptance.md:324-778` §§A–J, largely automated fixtures with a full i18n/locale-pack and WCAG 2.2 AA plan (`:426-464`) that the Explorer set never mentions |

### What I would cut so there is one first product

Cut from any first slice, in this order:

1. **The write arm.** It is the same three operations `web-client-os` already owns, its own gate (E6a) forbids starting until that lane supplies the planner, and `sdkv2` assigns write-capable Files to `web-client-os` outright. One write ceremony, one owner, one lab.
2. **E5 and the whole executable-extension lane.** `app-runtime-and-direct-launch.md` already owns the isolation bakeoff and direction 26 already named the leading candidate. Keep only `views-extensions-and-capabilities.md`'s *invariants* (raw fallback survives; extensions never author truth) as acceptance criteria against that lane.
3. **Offline retention, saved views, favorites/recents, dual-pane, tabs, cards/gallery/timeline/graph.** `mvp-and-acceptance.md:90-94` already defers offline; the rest are file-manager polish over an unbuilt Core.
4. **E0's 6-participant usability round as a *gate*.** Keep it as planned work; a recruited study cannot block a first slice for a project with no code and one owner.
5. **The second acceptance suite.** Fold E1a/E1b/E4's assertions into `mvp-and-acceptance.md` §§A/B/F rather than maintaining two definitions of done for one guest Files UI.

What survives the cut and is worth keeping intact: the E1a-vs-E1b distinction, the facts-matrix crosswalk, the E4 hostile matrix, the failure vocabulary, and the research landscape. See §9.

---

## 6. Q5 — Merge state

```
$ git -C the planning vault merge-tree --write-tree main origin/codex/data-explorer-pm
840396997eae420412c11c40e1af1acda4a1e9d2
Auto-merging Daily Notes/agent-status.md
CONFLICT (content): Merge conflict in Daily Notes/agent-status.md
Auto-merging Kanban.md
Auto-merging Reviews/README.md
CONFLICT (content): Merge conflict in Reviews/README.md
$ echo $?  # 0
```

**Two conflicting files, both append-logs.** `Daily Notes/agent-status.md` (both sides appended under `## 2026-08-23`; the branch also inserts a duplicate `## 2026-08-23` heading — see §8) and `Reviews/README.md` (both sides appended a trailing section). Every design file merges clean.

On the note in the task prompt: `Designs/README.md` and `Designs/owner-decision-inbox.md` are modified on three branches but **auto-merge in every pairwise test** — they take non-overlapping table rows / list items. The real three-branch conflict is elsewhere:

| Pair | Conflicts |
|---|---|
| `main` ↔ `data-explorer` | `Daily Notes/agent-status.md`, `Reviews/README.md` |
| `readiness` ↔ `data-explorer` | `Daily Notes/agent-status.md`, **`Open-Decisions.md`** |
| `sdkv2` ↔ `data-explorer` | `Daily Notes/agent-status.md`, **`Open-Decisions.md`** |

`Open-Decisions.md` is generated and its own header prescribes the fix ("On conflict: `git checkout --ours Open-Decisions.md && ./scripts/open-decisions.sh`"), so that conflict is mechanical — but only if whoever merges runs the script. `readiness` sets "Ask now: 1" (V2-C1); `data-explorer` sets "Ask now: 0 / Awaiting evidence: 16". Resolving by taking one side silently loses the other lane's queue state.

**The branch is not unmerged for any technical reason.** Vault audits pass on it: `scripts/tri-sync-check.sh` → "Tri-sync invariant holds across all designs"; `scripts/designs-awaiting-promotion.sh` → "Promotion queue empty".

### Merge-order hazard

`data-explorer:Reviews/2026-08-25-data-explorer-exp-c0-consumption/README.md:4-8, 27-33` locks the packet to Core commit `b9088d6a24f4d40bcca6ba300523b25cc7c608d2` and names five "Committed Core path" entries under `Reviews/2026-08-25-efs2-exp-c0-v0-control/`. Verified:

```
$ git cat-file -t b9088d6a24f4d40bcca6ba300523b25cc7c608d2      → commit
$ git branch -a --contains b9088d6…    → remotes/origin/codex/v2-readiness-week   (only)
$ ls Reviews/ | grep exp-c0                                     → (nothing on main)
```

Merging `data-explorer` alone puts into `main` a packet whose stated provenance points at a commit and five paths `main` does not contain. Its own verification step — "compares all five copied files byte for byte with `git show b9088d6…:<path>`" (`README.md:61-64`) — becomes unrunnable in a clone that has only `main`. The clean-room checker itself still passes (it reads its own `inputs/`), so this is a provenance/reproducibility hazard, not a broken artifact.

---

## 7. What this set assumes about its neighbours, and whether they agree

| Assumption | About | Where stated | Agrees? |
|---|---|---|---|
| James created a durable Data Explorer product lane on 2026-08-22, separate from the Web Client/OS and SDK PMs | `owner` | `data-explorer:README.md:69-88` | **Unknown / unrecorded.** Zero trace in `Decisions.md`, `Designs/*/owner-rulings.md`, `Owner-Inbox.md`, `Open-Decisions.md` |
| Web Client/OS owns the shared Reader, capability broker, conserved consent, signer, submission and receipt | `web-client-os` | `README.md:218-220, 260`; `architecture-and-state.md:283-286` | **Yes** — `mvp-and-acceptance.md:60-80`; `app-runtime-and-direct-launch.md:797`; and `sdkv2:web-client-os-boundary-pressure.md:58` |
| The Explorer's own MVP may include create-folder / create-file / import / publish-revision | `web-client-os`, `sdk` | `README.md:27-33`; `product-charter-and-roadmap.md:244-246` | **No.** `sdkv2:…/web-client-os-boundary-pressure.md:58-59` assigns write-capable Files to Web Client/OS and the Explorer to views/Inspector; `main`'s `app-runtime-and-direct-launch.md:847` treats them as one vertical |
| Data Explorer is the default App and raw fallback, not a gateway | `web-client-os` | `README.md:23-25` | **Yes** — direction 25; `app-runtime-and-direct-launch.md:743-753` |
| The shared Reader exposes `canonicality*`, `evidenceKind` and `historyAvailability` axes | `sdk`, `web-client-os` | `architecture-and-state.md:217, 645-650` | **No on `main`** (zero occurrences of "canonicality" in `Designs/web-client-os/`); yes on `sdkv2`/`readiness` |
| An opaque page cursor commits an 8-member tuple | `efsv2` | `architecture-and-state.md:165-173` | **Open, not agreed** — `Designs/efsv2/mountable-filesystem-semantics.md:678` |
| Files will supply certified write preconditions, atomicity and compensation semantics | `efsv2` (Files) | `owner-decision-inbox.md:91-94` | Partly designed (`hierarchical-files-and-folders.md` §routed certified writes) but not as a disposable boundary; unowned as a lab |
| Web Client/OS will supply an OS-hosted App route for E1b's second cold subrun | `web-client-os` | `experiments-and-stop-conditions.md:306-312, 352-355` | **No.** `mvp-and-acceptance.md:95-96` defers "full Session Shell"; `app-runtime-and-direct-launch.md:845-853` only *reserves* the Minimal App Host interface |
| Extension isolation is an open bakeoff the Explorer may run (E5) | `web-client-os` | `experiments-and-stop-conditions.md:561-597` | **No.** Direction 26 already names SES-in-a-Worker as the leading candidate; `app-runtime-and-direct-launch.md:758-760` already routes Explorer view extensions through the generic App runtime |
| The three-host mounted Files outcome is read-only with pinned handles and verified ranges | `owner` / `efsv2` | `README.md:103-104` | **Yes, accurately cited** — `Designs/efsv2/owner-rulings.md:106-114` (2026-07-22, ADOPTED) |
| EFS v2 is greenfield; v1 is evidence | `efsv2` / `owner` | `README.md:94-95` | **Yes** — `Decisions.md` 2026-08-08 greenfield ruling |
| The readiness lane's `EXP-C0/v0` is the one temporary control for this round | `efsv2` (branch) | `README.md:132-136` | **One-directional.** `readiness` never names `Designs/data-explorer/` (`git grep "data-explorer" origin/codex/v2-readiness-week -- Designs/` → nothing) yet writes its own competing Explorer charter at `readiness:Designs/efsv2/v2-contract-readiness-program.md:874-899` |

---

## 8. Concrete defects and stale facts

**D1 — The lane's founding direction is not recorded anywhere a reader of `main` can find it.** §3 above. Owner: `vault-process` + `owner`.

**D2 — `Open-Decisions.md` on the branch is stale against the queue it summarizes.** `data-explorer:Open-Decisions.md` header says "**Generated:** 2026-08-22" and its queue table row reads `| data-explorer | 4 | 2026-08-22 | ok |`, but `data-explorer:Designs/data-explorer/owner-decision-inbox.md:5` says "**Last reconciled:** 2026-08-23". `scripts/open-decisions.sh:98-99` reads that exact field, and the generated file's own header says "Regenerate in the same commit as any decision-state change." The 08-23 inbox edit was committed without regenerating.

**D3 — The new Kanban card omits `expires`, so the In Flight TTL can never fire on it.** `data-explorer:Kanban.md` §In Flight, first card: "— @data-explorer-pm (harness codex), started 2026-08-25; current step: … no owner ask". `scripts/stale-cards.sh:4-6` only matches lines containing `expires YYYY-MM-DD`. Running it on the branch reports the three pre-existing stale cards (Git/forge, Grants, Core hardening) and is silent about this one, 9 days after it was claimed. Every other In Flight card carries `expires`.

**D4 — Reviewer claim vs reviewer fields.** `data-explorer:Daily Notes/agent-status.md` (2026-08-22 entry): "Independent Core/Files, SDK/Web Client/OS and product/security reviews found no remaining P0/P1 after repair." All seven design documents say `**Reviewers:** —`, and every `Pre-promotion checklist` still has "At least one independent `#status/review` pass and owner review are recorded" unchecked (`README.md:336`).

**D5 — Duplicate `## 2026-08-23` heading in the status log.** The branch inserts a new `## 2026-08-23` section (`Daily Notes/agent-status.md`, diff hunk at `+238`) three lines above the pre-existing `## 2026-08-23`. This is also the cause of the merge conflict in §6.

**D6 — The guest-bundle budget is asserted only in the arm that has no adapter.** `experiments-and-stop-conditions.md:267-269` places "The guest critical JavaScript target is at most 250 KiB compressed; over 400 KiB is an automatic failure" in **E1a**'s pass list — the arm defined at `:241-247` as having "no real SDK adapter, Realm transport, wallet, account, profile, package manager, extension host, service backend or production persistence." E1b's pass list (`:342-403`) re-states the 3-second first-viewer target (`:399-400`) but carries **no byte budget**. The budget is therefore never measured on an artifact that contains the adapter it is meant to constrain. `Designs/web-client-os/mvp-and-acceptance.md:300` scopes the same number to "all transitive JavaScript, Wasm, **generated adapter glue** and styles."

**D7 — E1b's second required subrun depends on a neighbour capability that the neighbour's MVP does not build.** `experiments-and-stop-conditions.md:306-312` requires "two independently cold subruns … a direct Data Explorer App route … and an **OS-hosted** Data Explorer App route", and `:352-355` makes their parity a pass condition; `:409-412` makes "direct/OS-hosted semantic or evidence-grade divergence" a hard stop. `Designs/web-client-os/mvp-and-acceptance.md:95-96` defers the full Session Shell from the MVP and `app-runtime-and-direct-launch.md:845-853` only reserves the Minimal App Host interface. E1b as written cannot pass until a capability outside the neighbour's first slice exists.

**D8 — The 08-22 documents were not updated in the 08-25 EXP-C0 pass.** `README.md`, `architecture-and-state.md` and `experiments-and-stop-conditions.md` were rewritten around `ResultV0`, the C0 slice and the consumption packet on 2026-08-25. `product-charter-and-roadmap.md` (Last touched 2026-08-22), `views-extensions-and-capabilities.md` (08-22) and `preliminary-findings.md` (Last reconciled 08-22) were not. Consequences: the charter's Feature map (`:214-227`) has no "first trace slice" row and never mentions `ResultV0`; `preliminary-findings.md:29-32` still names the next move as "seal the shared hostile/partial fixture, test the E0 information hierarchy, then run E1a and E4" with no mention of the C0 consumption prerequisite that `experiments-and-stop-conditions.md:55-63` now makes mandatory before E1a. `README.md:63-65` points readers at `preliminary-findings` as *the* checkpoint.

**D9 — A third result-code dialect over an already-open registry question.** Three overlapping vocabularies now exist for one read path: `Designs/efsv2/hierarchical-files-and-folders.md:1487-1509` (19 Files codes), `Designs/web-client-os/type-data-abi-boundary-pressure.md:300-384` (`ResourceOutcome` 8 + `ByteOutcome` 6 + `LocatorAttempt.outcome` 9), and `data-explorer:architecture-and-state.md:583-680` (14 semantic + 7 byte + 7 plan + 12 effect + 11 extension). The Explorer's semantic list is the Files list minus the two host-projection codes, with `PRESENT_FILE`/`PRESENT_DIRECTORY` merged and `MALFORMED_SELECTED` renamed `INVALID` — defensible individually, but `type-data-abi-boundary-pressure.md:822-823` already asks "What exact result-code registry and `ResourceOutcome` encoding is shared across TypeScript, Rust, WIT/JSON and native Drive adapters?" and nobody owns the answer. The Explorer adds a dialect rather than forcing the question.

**D10 — Verified-good, so not a defect but worth recording precisely.** The consumption packet runs clean here: `node --test check-consumption.test.mjs` → 9 pass / 0 fail; `node check-consumption.mjs --mode commit-ready` → exit 0 with `staticSerializedConsumption: PASS`, `e1a: NOT_PROVEN_BY_THIS_CONTRACT`, `e1b: NOT_RUN`, all five `nonadoption` flags literal `false`. What it proves is narrower than "consumption": it recomputes the HELLO canonical-payload SHA-256 (`check-consumption.mjs:160-165`) and hashes each of the five inputs (`:278`), then cross-references the Explorer's report against the Core handoff by string equality. It **decodes no ABI** — `resultVector.vectors[*].encoded` are opaque hex blobs (three vectors: `RESULT_POINT_FOUND_V0`, `RESULT_MUTATION_REJECTED_SAME_ROOT_V0`, `RESULT_BOOTSTRAP_COMMITTED_CHANGING_ROOT_V0`) that the checker only asserts were not replaced (`:202-206`). The "direct guest" property is checked by asserting five declared booleans stay `false` (`:171-177`). The packet says this itself (`"serializedDependencyClaimsOnly": true`), and the README is honest about it — it is a declaration cross-check plus hash integrity, not evidence of runtime independence.

**Stale fact carried by a sibling:** `sdkv2:Designs/sdkv2/README.md:6` and `web-client-os-boundary-pressure.md:6` cite the Explorer at "exact **local-only** planning commit `08bb5f29…`". That commit is now reachable on `origin/codex/data-explorer-pm`; the "local-only" label is stale. (Also noted by R22.)

---

## 9. Decided / undecided / docs-disagree-with-a-ruling

**Decided (by the owner, correctly consumed here):** greenfield v2 (`Decisions.md` 2026-08-08); Core standalone with Commons/OS as optional consumers, and guest-useful-before-hydration (`Designs/efsv2/owner-rulings.md` 2026-08-12); three-host read-only mount profile (`owner-rulings.md:106-114`); Data Explorer as default App and raw fallback, not a gateway (direction 25). All four are cited accurately in `data-explorer:README.md:92-108`.

**Decided by the owner and *not* reconciled by this set:** direction 2 (write-capable File Browser first). The set raises it once as an open checkbox (`product-charter-and-roadmap.md:341-343`) and never cites it by number; `readiness:`V2-C2 contradicts it outright.

**Decided by agents on this branch, recorded with falsifiers (legitimate, reversible):** approach B (qualified typed Explorer workbench) over A and C (`architecture-and-state.md:21-74`); Files as first vertical rather than outer boundary; built-ins-only for MVP with a three-step extension ratchet (`architecture-and-state.md:330-344`); local-by-default workspace state; the E0…E6b gate order.

**Genuinely undecided and correctly held (four items, all evidence-gated, zero owner asks):** DATA-E1 product/package boundary; DATA-E2 published saved views; DATA-E3 executable extension ceiling; DATA-E4 write-capable MVP label (`owner-decision-inbox.md:18-61`). The queue's discipline is good — each names its gate and an "Escalate only if" trigger.

**Undecided, nobody owns it, and it blocks an MVP:** whether there is one first product or two. Neither `data-explorer:owner-decision-inbox.md` (which says "Decide now: nothing") nor `Designs/web-client-os/README.md` (whose open questions do not include it) nor `Open-Decisions.md` on any branch carries this item. `data-explorer:README.md:313` comes closest — "Which Explorer surfaces are shared Web Client/OS components versus a separate product package? Resolve only after both boot profiles run the same guest fixture with zero semantic divergence" — which defers a *product-ownership* question to an experiment that cannot answer it.

---

## 10. Solid now / settle first / cut

### Solid enough to build on now

1. **E1a vs E1b as separated evidence tiers** (`experiments-and-stop-conditions.md:233-278` and `:280-412`), with the explicit ceiling "E1a success never satisfies E1b or supports a direct-guest production claim" (`:276-278`). This is the sharpest anti-self-deception device anywhere in the vault and belongs in `mvp-and-acceptance.md` regardless of who owns the Explorer.
2. **The qualified facts-matrix crosswalk** (`experiments-and-stop-conditions.md:139-188`) — 10 dimensions with an explicit "Collapse forbidden" column, plus the rule that E1a records *simulated* evidence grades and only E1b may *earn* them (`:162-176`). Directly reusable as a `web-client-os` acceptance table.
3. **E4's hostile/partial/unavailable matrix** (`:503-559`) and the global production stop conditions (`:695-725`).
4. **The failure vocabulary tables** (`architecture-and-state.md:581-680`) as a *requirements* input to the unresolved result-code registry question.
5. **`research-landscape.md` in full** — dated, sourced, honestly labelled, and the only place any lane has read Finder/Explorer/GNOME/Total Commander/Airtable/Notion/DBeaver/Apollo/DevTools/VS Code as product evidence.
6. **The consumption packet as a reproducible artifact** — one of only two executed checkers on the whole branch surface.

### Must be settled first

1. **One first product, one write ceremony.** An owner item, not an experiment. Direction 2 + direction 25 + `app-runtime-and-direct-launch.md:847` + `sdkv2:web-client-os-boundary-pressure.md:58-59` vs `data-explorer:README.md:27-33`.
2. **Record the 2026-08-22 direction** (or retract the lane). Until it is in `Decisions.md`, the lane, its folder, its four queue items and its Kanban card have no recorded authority.
3. **The result-code registry** (`type-data-abi-boundary-pressure.md:822`) — three dialects, no owner.
4. **Whether `canonicality*` / `evidenceKind` / `historyAvailability` are real axes of the shared read law.** They exist only on unmerged branches; the Explorer's whole Inspector design depends on them.
5. **The cursor-commitment tuple** — asserted as law by the Explorer, open in `Designs/efsv2/mountable-filesystem-semantics.md:678`.
6. **Whether E1b's OS-hosted subrun is in scope at all**, given the neighbour defers the Session Shell.

### Cut

See §5. In one line: **cut the Explorer's write arm, E5, offline/saved-views/dual-pane/rich views, and the second acceptance suite; keep the evidence discipline and the research.** The residue is a set of acceptance requirements for `web-client-os`'s File Browser MVP plus a well-argued case for a *later* general typed-data workbench — which is what `main`'s direction 25 already says the Explorer is.

### What an MVP needs from this set

Nothing buildable, and a great deal of test design. Every gate the set defines is downstream of artifacts that do not exist: E1b needs a real disposable SDK adapter and a public EFS 2.0 Realm ("No EFS 2.0 code exists in any repository"); E6a needs a Files + Web Client/OS action planner. The set's honest contribution to an MVP is (a) the E1a/E1b separation, (b) the facts-matrix crosswalk, (c) E4, and (d) the stop conditions — all of which should be merged into the `web-client-os` acceptance suite rather than maintained as a second product's gate.

---

## 11. Unverifiable from here

- Whether James actually gave the 2026-08-22 direction, and in what words. Only the branch README paraphrases it.
- Whether the three "independent" reviews claimed in `data-explorer:Daily Notes/agent-status.md` happened; no review artifact exists in `Reviews/` for them and every document's `Reviewers:` field is empty.
- Whether the readiness lane's "2026-08-25 top-to-bottom overnight direction" (the stated basis for V2-C2) was given. R21 searched `main` for it and found nothing.
- Whether the ABI-encoded `ResultV0` vectors in the consumption packet actually carry the ten qualification axes the design claims — the checker does not decode them, and no independent decoder exists on this branch.
