---
agent: bs-vocab-coherence-audit-v1
date: 2026-05-26
status: raw
anchors:
  - area: meta
---

# Cross-repo vocabulary drift audit

Scope: three repos at `/Users/james/Code/EFS/{planning,contracts,client}/`. Inspected `main` for contracts/client and the live planning vault. Spot-checked `origin/custom-lists` and `origin/editions-to-lenses` where relevant. Skipped `Brainstorms/` per rule 4.

**Severity legend:** **H** = actively confusing today, **M** = historical lag, **L** = wording nit.

---

## 1. Known-drift quantification

### 1a. Topic vs Anchor (H)

Glossary §Topic frames "Topic" as a human-facing synonym for "Anchor." Reality is messier — "Topic" is *also* a live Solidity contract name on `main`.

| Where | Term used | Notes |
|---|---|---|
| `contracts/packages/hardhat/contracts/TopicResolver.sol` | `Topic`, `TopicResolver`, `TopicCreated`, `rootTopicUid` | **Live contract on `main`**, not just legacy doc prose. Lines 9-50. |
| `contracts/packages/hardhat/contracts/TagResolver.sol:27` | `"Type as Topic" pattern` | Pattern name embeds "Topic." |
| `contracts/specs/02-Data-Models-and-Schemas.md:13,67` | `Topic` capitalized | Reads like a defined concept distinct from Anchor. |
| `contracts/docs/adr/0025-anchor-name-validation.md:9,24` | "original `TopicResolver.sol`" | Implies a single resolver; both still exist on `main`. |
| `client/src/libefs/topic.ts` | `TopicStore`, `Topic` type | 42 occurrences. Entire client domain model is "topic." |
| `client/src/shell/topic-tree.ts` | `topic-tree`, `topic-breadcrumb` | 126 occurrences. UI components named "topic." |
| `client/CLAUDE.md:17` | "hierarchical topic tree" | Doc reinforces "topic" as the client's word. |
| `planning/Glossary.md:87-89` | "Topic" is human-facing synonym | Captures the *intent* but ignores live contract. |

**Drift cost:** new agent reading `contracts/` sees `TopicResolver.sol` AND `TagResolver.sol` as two distinct contracts (they are — TopicResolver predates the model, TagResolver is current). Glossary's "Topic = Anchor" gloss doesn't acknowledge this duality. The `Topic` Solidity name is *legacy*, but nothing labels it as such in-repo.

**Proposed canonical resolution:**
- **Anchor** wins in `contracts/` (specs, ADRs, contract names, code identifiers). It's the technical term and matches the ANCHOR schema.
- **Topic** stays in `client/` end-user copy AND in client domain code (existing convention is too deep to rip; would need a major refactor).
- Mark `TopicResolver.sol` as deprecated/legacy in a header comment, OR delete it if nothing references it.
- Update `contracts/specs/02-Data-Models-and-Schemas.md:13,67` to use "Anchor" not "Topic." The "Type as Topic" pattern phrase is unclear regardless — rename to "Type as Anchor" or "Schema-Aliased Anchor" pattern.
- Glossary §Topic should add: "the legacy `TopicResolver.sol` is the schema-creation-time resolver and predates current naming."

### 1b. edition → lens (M, drifting to H)

| Branch | edition count | lens count |
|---|---|---|
| `main` (contracts/) | 16 files contain "edition" (specs, ADRs, FUTURE_WORK, LAUNCH_CHECKLIST, QUESTIONS, agent-workflow) | 1 file: `specs/05-Extensibility-and-Web-UI.md:16` uses "lens" *generically* ("Web UI serves as a strict lens"), not in the new sense |
| `origin/editions-to-lenses` | (renamed throughout) | ADR-0013/14/26/31/39 all renamed; `0043-rename-editions-to-lenses.md` is the rename ADR |
| `planning/` | 0 in non-Brainstorm docs | Glossary §Lens + Designs/0001-design-system.md + Architecture/README.md |
| `client/` | 0 | 0 — client doesn't use either term yet (no multi-attester UI) |

**Drift cost:** Glossary §Lens authoritatively claims rename is done per "ADR-0043," but on `main` ADR-0043 does not exist as a rename ADR. On `main`, ADR-0043 (only present on `custom-lists`) is "EFS Edge Constraint Callbacks" (deferred). The rename only exists on the unmerged `editions-to-lenses` branch. **Agents reading Glossary will hit a dangling reference.**

Specs on `main` use "edition" 75+ times (counts per file: overview.md:9, 01:2, 02:6, 03:11, 04:22, 06:6, 07:8, 08:9, README:1). Code on `main` uses `edition` everywhere (`useEditionDirectoryPage.ts`, `?editions=` param).

**Proposed canonical resolution:**
- **Lens** wins per James's intent + Glossary. Need to actually merge `origin/editions-to-lenses` to `main`. Until then, Glossary §Lens should note "rename merged on `editions-to-lenses` branch, not yet on `main`."
- Update planning/Decisions.md and the agent-status note to reflect that "edition→lens" is *queued spec drift*, not done.

### 1c. TagResolver → EdgeResolver (M, drifting to H)

| Branch | TagResolver | EdgeResolver |
|---|---|---|
| `main` contracts | 3 files use it (`EFSFileView.sol`, `EFSIndexer.sol`, `EFSRouter.sol`); `TagResolver.sol` itself; deploy scripts; tests | 0 |
| `origin/custom-lists` | Only in historical ADRs (0003, 0006, 0027, 0032, 0033, 0034, 0035, 0036, 0038) | Live: `packages/hardhat/contracts/EdgeResolver.sol` + AGENTS.md + designs/custom-lists.md |
| `planning/Glossary.md` | not mentioned | not mentioned (gap) |
| `planning/Brainstorms/.../bs-bytecode-budget-v1.md:32` | `TagResolver` (aka `EdgeResolver`) | Hand-waved equivalence |

**Drift cost:** Two repos / two branches disagree on the contract's name. Planning has no Glossary entry pinning either. Bytecode-budget brainstorm uses "aka" — that ambiguity is the smell.

**Proposed canonical resolution:**
- **EdgeResolver** wins per ADR-0041 (PIN/TAG split). It handles both PIN and TAG edges; "TagResolver" is technically wrong now that PIN exists as a sibling.
- Need a Glossary entry: "EdgeResolver (formerly TagResolver) — single schema resolver for PIN and TAG schemas per ADR-0041."
- Merge `custom-lists` to land the rename.

### 1d. Contract count: 5 vs ~11 vs 16 (H, partially fixed)

`planning/Decisions.md:25` corrected the "5 contracts" PM mistake — now states ~11. But:
- Actual `.sol` files on `main`: 16 (`ls packages/hardhat/contracts/*.sol`). Of those, 12 are "real" (excluding `YourContract.sol`, `MockChunkedFile.sol`, `ImportHelper.sol`, `IEASDataIndexer.sol`).
- Custom-lists also has 16 files.
- `specs/overview.md` lists 6 in its "Core contracts" table — incomplete (missing BlobResolver, FileResolver, PropertyResolver, SchemaNameIndex, Indexer, TopicResolver).
- `contract-decomposition` brainstorm at line 12 says "five contracts (`EFSIndexer`, `EFSRouter`, `EFSFileView`, `EdgeResolver`, `MirrorResolver`) plus `EFSSortOverlay` and several near-empty resolver stubs" — i.e. 6 substantive + stubs. That's the most honest framing.

**Drift cost:** No two counts agree. Agents asking "what contracts are there?" get conflicting answers depending on source.

**Proposed canonical resolution:** Update `specs/overview.md` § Core contracts to be exhaustive (or explicitly say "core six; see `packages/hardhat/contracts/` for full list with auxiliary resolvers and helpers").

---

## 2. New drift discovered

### 2a. "Permanence tier" — Glossary cites a section that doesn't exist on `main` (H)

`planning/Glossary.md:29,45,49` defines Etched / Durable / Ephemeral and points readers to `contracts/docs/agent-workflow.md` § Permanence tiers.

**The section does not exist on `main`.** `grep -in "Permanence\|Etched\|Durable\|Ephemeral" contracts/docs/agent-workflow.md` returns zero. The file has *Escalation* tiers (Tier 1 / 2 / 3) — a different concept (when to ask the human), not (how reversible is this surface).

It DOES exist on `origin/custom-lists`: `docs/agent-workflow.md` § Permanence tiers (lines 5-23). And ADR-0041 on custom-lists has `**Permanence-tier:** Etched` frontmatter.

**Drift cost:** Glossary makes a hard claim about source-of-truth that breaks on the default branch. Agents on `main` cannot follow the link.

**Proposed:** Either merge custom-lists (which carries the canonical Permanence tiers section), or Glossary entries should point to a planning-vault home for the concept and note that custom-lists carries the contracts-side spec.

### 2b. Two simultaneously-meaningful "tier" systems (H)

The word "tier" carries two unrelated meanings in the same agent's mental model:

1. **Escalation tiers** — Tier 1/2/3, in `contracts/docs/agent-workflow.md:5`. Governs when to ask the human.
2. **Permanence tiers** — Etched/Durable/Ephemeral, in `planning/Glossary.md` + `custom-lists` branch. Governs unship-cost.

Both use "Tier" capitalized. Both apply to ADR-writing decisions. Neither acknowledges the other.

**Proposed:** Onboarding/conventions should explicitly disambiguate ("there are two unrelated tier systems"). Consider renaming one — "Escalation level" instead of "Tier" would prevent the collision.

### 2c. EFS / EFSx / EFSIndexer / EASx — overloaded "EFS" namespace (M)

- **EFS** (Glossary): "Ethereum File System" — the protocol/product.
- **EFS** (`client/src/libefs/efs.ts:9`): TypeScript class — the client-side facade.
- **EFSIndexer** (`contracts/packages/hardhat/contracts/EFSIndexer.sol`): the on-chain append-only kernel contract.
- **EASx** (`client/src/libefs/eas.ts:14`): client's extended EAS SDK wrapper.
- **EFSx**: doesn't exist anywhere. Mentioned in this audit's prompt — possibly an in-flight rename, possibly confusion with EASx.
- **libefs** (`client/src/libefs/`): the client's data layer directory; not in Glossary.
- **EFS OS SDK** (`planning/Kanban.md:18` + multiple brainstorms): planned future SDK package; not in Glossary.

**Drift cost:** "EFS" as a TS class name is bound to collide with documentation references to "EFS the protocol." A reader of `client/src/libefs/efs.ts` can't tell from grep alone whether `import { EFS }` means the protocol-level facade or the protocol itself.

**Proposed:** Glossary should add: `EASx`, `libefs`, `EFS OS SDK`, plus a disambiguation under §EFS noting the client's TS class shares the name. Long-term: consider renaming the TS class to `EFSClient` or `EFSFacade`.

### 2d. ADR-0043 number collision across branches (H)

- `origin/editions-to-lenses`: `0043-rename-editions-to-lenses.md` (Accepted, 2026-05-05).
- `origin/custom-lists`: `0043-efs-edge-constraint-callbacks.md` (Deferred, 2026-05-21).

Two distinct branches each minted an ADR-0043 for different decisions. Neither is on `main` yet. Whichever lands second has to renumber, and any prose referencing "ADR-0043" before merge resolution will silently break.

**Proposed:** Coordinate merge order; renumber on second-to-land. Probably worth a planning Decision logged before the next merge.

### 2e. "Kernel" — overloaded across client and contracts (M)

- **Kernel** (`client/src/kernel/kernel.ts`): client-side wallet/provider abstraction layer, top of three-layer load order.
- **Kernel** (`contracts/specs/overview.md:56`, `contracts/docs/adr/0009`): "append-only kernel" = `EFSIndexer` Solidity contract.
- **Kernel** (`planning/Glossary.md:51`): defined as `EFSIndexer` (the contracts meaning).

**Drift cost:** Same word, two scopes (client kernel = device/wallet layer; contracts kernel = on-chain index). Glossary picks the contracts meaning but doesn't disambiguate.

**Proposed:** Add a "(see also: client kernel)" gloss to Glossary §Kernel, or rename one. The client could comfortably rename `kernel/` to `platform/` or `runtime/` — less load-bearing than the contracts term.

### 2f. "Editions" vs "lenses" semantics — fallback vs merge (M)

`contracts/docs/QUESTIONS.md` Tier 2 multi-edition merge question is still open: "first-attester-wins" vs "merge by newest." Glossary §Lens picks the fallback semantics ("multiple lenses compose via URL query param"), but "compose" is ambiguous: composition by fallback (current) is very different from composition by merge (a possible future). The Glossary's "compose" verb implicitly takes a side.

**Proposed:** Tighten Glossary §Lens prose: "tried in order; first with active content wins (per ADR-0031)."

### 2g. Client UI: `topic-tree` vs `topic-breadcrumb` (L)

Both exist as Lit components but the planning vault uses "tree" for the contracts on-chain structure and "breadcrumb" for the path display. Internally consistent; just flagging that "topic tree" elsewhere may mean different things. Low impact.

### 2h. "Schelling point" vs "schema-alias anchor" (L)

- `contracts/specs/01-System-Architecture.md:21`: "Anchors as Schelling Points."
- `contracts/specs/02-Data-Models-and-Schemas.md:13`: "Schelling Point."
- `contracts/docs/adr/0033-root-containers-and-schema-alias-anchors.md` title: "Schema-Alias Anchors."

The latter is a special case of the former; ADR-0033 doesn't explicitly relate the two terms. Likely fine, but glossary could note both.

---

## 3. Glossary gaps — terms used in code/specs but missing from `planning/Glossary.md`

Concrete missing terms (each appears 5+ times in some authoritative file):

| Term | Where used | Why it matters |
|---|---|---|
| **EdgeResolver** | `custom-lists` packages/hardhat/contracts/ | Will become canonical post-merge. |
| **PIN** (as distinct from TAG) | Glossary mentions briefly under Edge entry but no own §; ADR-0041 is the spec | Cardinality-1 edge schema — load-bearing concept. |
| **EFSx** | Used nowhere; mentioned only in this audit's prompt | Either typo for EASx or a planned future name; needs disambiguation. |
| **EASx** | `client/src/libefs/eas.ts` | Client's extended EAS SDK wrapper. |
| **libefs** | `client/src/libefs/`, `client/CLAUDE.md` | Client domain layer name. |
| **EFS OS SDK** | `planning/Kanban.md`, several brainstorms | Major planned deliverable. |
| **`?caller=` / `?lenses=`** (URL params) | ADR-0017, ADR-0031, ADR-0043(rename) | Router contract surface; agents need to know they're API. |
| **`_activeByAAS` / `_qualifyingFolders` / `_referencingAttestations`** | Multiple ADRs | Index names mentioned in specs without Glossary anchors. (Probably belong in Architecture/, not Glossary — flag for routing.) |
| **TopicResolver** | Live on `main` | Legacy contract; needs "deprecated" disambiguation. |
| **Permanence tier** | Used in planning Brainstorms + custom-lists ADRs | Glossary references it under §Etched/§Durable/§Ephemeral but no single canonical entry. |
| **SSTORE2** | `contracts/specs/overview.md`, ADRs | On-chain chunked storage primitive; assumed knowledge but not glossed. |
| **EIP-5219 / EIP-4804 / EIP-6860 / EIP-170 / EIP-7617** | Multiple specs + bytecode-budget brainstorm | Cited as load-bearing standards; one-line glosses would help. |
| **SORT_INFO** | ADR-0030, specs/02, specs/07 | Sixth schema; never appears in Glossary's Edge entry. |
| **BLOB** | `EFSIndexer.sol:37,1070`; `BlobResolver.sol` exists | Sixth (or seventh) EFS-native schema (the spec inventory says "six" but BLOB is referenced as a separate one in EFSIndexer). Possible drift between code and spec inventory. |

**Sharpest:** `BlobResolver.sol` exists as a deployed contract but `BLOB` is never explained in specs/overview's "Six EAS schemas" table. Either it's a seventh schema (spec wrong) or it's not really there (contract orphan). Worth a Tier 2 question.

---

## Controversial human design choices

Cases where it's not obvious which term should win:

- **Topic vs Anchor.** James prefers Topic for users; Anchor is the technical name. Glossary takes a both-and stance. But the client codebase treats Topic as its core domain model (TopicStore, Topic type, topic-tree) — not just user copy. Should client refactor to `AnchorStore` for consistency with contracts, or does client get to keep its own internal vocabulary because it owns the user-facing surface? Either is defensible.
- **TagResolver vs EdgeResolver.** ADR-0041 names it EdgeResolver. But on `main` the file is `TagResolver.sol` and the on-chain deployed address is named that too. Renaming the contract before mainnet is cheap; after launch is impossible (the contract address is encoded into schema UIDs per ADR-0027). Must decide before mainnet.
- **Kernel.** Client and contracts both use the word for very different layers. Renaming the client's `kernel/` is the lower-cost fix, but James might have a reason for the parallel.
- **EFS as a TS class name.** Renaming to `EFSClient` is clean but touches every import in `client/`. Worth it? Or accept the overload and Glossary-disambiguate?
- **Edition vs Lens, merge semantics.** Open Tier 2 question (`contracts/docs/QUESTIONS.md`) about fallback-vs-merge composition. Whichever the human picks affects whether "compose" is the right verb in the Glossary.

---

## Unknown questions for future brainstorms

- How does the planning vault track *which branch* a spec lives on? Right now Glossary entries point at file paths without branch annotations — `ADR-0043` resolves differently on `main` / `editions-to-lenses` / `custom-lists`.
- Should there be a "term registry" doc that lists every named concept across the three repos, with a column for "in Glossary?" Auto-checking glossary coverage could be a CI lint.
- Is `BlobResolver` a real seventh schema or vestigial? Affects the canonical schema count in `specs/overview.md`.
- Should ADR-style "Permanence-tier:" frontmatter (used on custom-lists ADRs) be back-ported to all ADRs on `main` so the concept is load-bearing everywhere?

---

## Blockers / concerns

- **ADR-0043 number collision** is the only hard blocker — two branches with two different ADR-0043s cannot both merge without renumbering. Resolve before next merge of either branch.
- **Glossary §Lens dangling reference** to ADR-0043 will silently mislead any agent on `main` that doesn't grep the actual ADR directory. Either land the rename branch soon or annotate the Glossary entry with the branch caveat.
- **`TopicResolver.sol` is undocumented legacy.** Until it's marked deprecated (header comment) or deleted, new agents will spend tokens figuring out why two resolvers exist on `main`.
- **"Permanence tiers" section in `agent-workflow.md` exists only on `custom-lists`.** Glossary's authoritative cross-link breaks on `main`. Either merge custom-lists or move the canonical definition to the planning vault.

---

## Summary counts

| Severity | Count | Items |
|---|---|---|
| H | 7 | 1a Topic/Anchor; 1d contract count; 2a Permanence-tier dangling ref; 2b two "Tier" systems; 2d ADR-0043 collision; 1b edition→lens (drifting to H); 1c TagResolver→EdgeResolver (drifting to H) |
| M | 4 | 2c EFS/EFSx/EASx overload; 2e Kernel overload; 2f compose semantics; (edition/TagResolver classified up to H) |
| L | 2 | 2g topic-tree wording; 2h Schelling-point variants |
| Glossary gaps | 14 | EdgeResolver, PIN, EFSx, EASx, libefs, EFS OS SDK, URL params, index names, TopicResolver, Permanence tier, SSTORE2, EIPs, SORT_INFO, BLOB |
