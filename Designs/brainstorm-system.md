# Brainstorm System

**Status:** draft
**Target repos:** `planning`
**Depends on:** [[0001-design-system]]
**Supersedes:** —
**Reviewers:** _(pending — @james)_

#status/draft #kind/design #repo/planning

## Problem

EFS development is constrained by a single human reviewer (James). Generative work — exploring use cases, finding edge cases, sketching alternatives, surfacing requirements — is **cheap** for AI agents and **expensive** for the human. The current vault has no place for cheap, exploratory, agent-generated content: a brainstorm either gets force-fit into `Designs/` (becoming a ghost design) or vanishes into chat.

Areas like SDK and Client are rotting because James lacks bandwidth to push them forward, but he doesn't want to spawn formal design threads either — that just creates more designs the bottleneck has to track.

We need a place where agents can throw ideas at the wall — divergent, weird, half-baked, requirement-shaped, use-case-shaped — without that content becoming a tracked artifact in the way Designs and Kanban cards are. Ideas should persist so they're available when relevant, not die on a timer.

## Proposal

A `Brainstorms/` folder with **minimal structure** and **deliberate-only pruning**. Agents (cron-driven or ad-hoc) write into it; the PM is the only thing that reads it cross-cuttingly and surfaces 1–2 items per week into For-James or as input to other agents.

### Folder layout

```
planning/
  Brainstorms/
    README.md                          ← conventions pointer (this design)
    INDEX.md                           ← PM-curated map of brainstorms by area/status
    YYYY-MM-DD-<agent-slug>-<topic>.md ← individual brainstorms
```

Date-first filenames make chronological sorting trivial. Agent slug in the filename signals ownership.

### Frontmatter (minimum spec)

Three required fields, one optional structured field:

```yaml
---
agent: <slug>          # required — agent slug, matches Agent: commit trailer
date: YYYY-MM-DD       # required
status: raw            # required — see status vocabulary below
anchors:               # optional — empty list fine
  - area: sdk          # any of: sdk | client | contracts | meta | none
  - design: <slug>     # if it riffs on an existing design
  - milestone: oniondao # if milestone-scoped
---
```

Everything below the frontmatter is **freeform**. No template. No required sections. A brainstorm might be a use-case list, a steel-man, a comparative analysis, a napkin sketch, a requirements dump, a rant. Volume and creativity over polish.

### Status vocabulary

| Status | Meaning |
|---|---|
| `raw` | Newly generated. Awaiting PM curation. |
| `surfaced` | PM brought it to James's or another agent's attention. Still raw content, but tracked. |
| `integrated` | The idea has been folded into a real artifact (Design, Decision, Kanban card, Architecture doc, Glossary entry, etc.). Original kept for traceability with a frontmatter `integrated_into:` pointer. |
| `reference` | Durable context that doesn't need to "go" anywhere — use cases, requirements, comparative analyses, captured external designs. Re-read periodically. **Indefinite lifespan.** |
| `obsolete` | Deliberately marked dead. Requires a `reason:` in frontmatter. Conscious choice based on reasoning, never on age. |

**No auto-anything.** No TTL on `raw`. No automatic graduation. Pruning is always a deliberate act with a written reason.

### The five rules (the whole structure)

1. **One file per brainstorm.** Don't append to existing brainstorms — write a new one if you have new thoughts. Preserves traceability.
2. **Frontmatter must be present and parseable.** Three required fields above. Otherwise the brainstorm is invisible to PM indexing.
3. **Filename: `YYYY-MM-DD-<agent-slug>-<topic-slug>.md`.** Date-first, kebab-case.
4. **Do not edit other agents' brainstorms.** Build on them by writing a new brainstorm that references theirs (`anchors: [brainstorm: 2026-05-26-pm-foo]`). **Reading another brainstorm is allowed only when it's declared as an anchor** — the dependency must be visible in frontmatter. Avoids the cascading-hallucination failure mode while permitting deliberate composition (e.g., a schema-coverage audit reading the use-case brainstorm it's auditing against).
5. **The PM is the only thing that reads cross-cuttingly.** Other agents may read brainstorms in their own scope (e.g., an SDK agent reading SDK-anchored brainstorms while drafting) but should not become brainstorm-curators. Avoids cascading hallucination where agents feed each other's noise.
6. **Subagents return a 3-5 sentence exit summary** describing what they produced, perceived value, and anything that was unclear in the spec. Gives the PM curation hooks without re-reading the entire file. *(Added 2026-05-26 after batch-1 demonstrated this saves PM time substantially.)*

That's it. No additional process gates.

### Anchors — why they matter

Free-floating brainstorms rot fastest. Anchors let the PM (and other agents) query by relevance: "all brainstorms about SDK," "all brainstorms anchored on ADR-0041," "all OnionDAO-anchored brainstorms." Without anchors the folder becomes a tar pit. With anchors it becomes a searchable archive.

Anchor schema is open — add new anchor types as they emerge (`anchor: app: notes`, `anchor: persona: hackathon-entrant`, etc.). Update this design when you do.

### PM curation duty

Each PM session loop adds two steps:

1. **Scan `Brainstorms/` for `status: raw` items.** Score by specificity, actionability, and relevance to active work. Surface ≤2/week to `For-James.md` or into the input of another agent thread.
2. **Maintain `Brainstorms/INDEX.md`.** A grouped view (by area, by status) so the folder doesn't go opaque. Includes recent `integrated_into:` traces.

These are real costs — PM sessions get longer. Worth it because each surfaced brainstorm represents a high-leverage piece of work James didn't have to think of himself.

### Brainstorm vs Design — sharp distinction

| | Design | Brainstorm |
|---|---|---|
| Folder | `Designs/` | `Brainstorms/` |
| Filename | `<slug>.md` → promoted to `NNNN-<slug>.md` | `YYYY-MM-DD-<agent>-<topic>.md` |
| Status vocab | draft / review / ready / accepted / landed | raw / surfaced / integrated / reference / obsolete |
| Tracking | Kanban card | none — PM-curated only |
| Promotion | human gates with trust token | never promoted *in place*; ideas are extracted into new artifacts |
| Lifecycle pressure | grows toward acceptance | indefinite; pruning requires written reason |

**Key principle: brainstorms are never promoted in place into designs.** If a brainstorm has a good idea, the idea seeds a new design that someone writes properly. The brainstorm gets `status: integrated` with an `integrated_into:` pointer.

### Exit triage structure (for decision-prep brainstorms)

When a brainstorm is **decision-prep flavored** (synthesizing options, auditing gaps, evaluating directions), it should end with these three sections instead of or in addition to `## Curator notes`. This systematizes PM curation and makes recursion explicit.

1. **`## Controversial human design choices`** — decisions only James can make. Each item:
   - **Choice:** what the decision is, in one sentence.
   - **Options:** the realistic alternatives (usually 2–4).
   - **Tentative read:** what the brainstorm agent would pick if forced, with one-sentence reasoning.
   - **Why controversial:** why reasonable people would disagree.

2. **`## Unknown questions for future brainstorms`** — questions that another brainstorm could answer. Drives **recursion**. Each item:
   - **Question:** what's unknown, in one sentence.
   - **Brainstorm shape that would answer it:** e.g., "a `bs-edge-cases-typed-events-v1` brainstorm targeting the EVENT/TRANSITION schema candidates."
   - **What it would unlock:** the next decision or artifact it enables.

3. **`## Blockers / concerns`** — things blocking forward progress. Each item:
   - **What's blocked:** the work that can't proceed.
   - **The blocker:** what's in the way.
   - **Who/what could unblock:** James, another brainstorm, an external answer, etc.

Generative brainstorms (use case generation, capability enumeration) can keep their original `## Observations` + `## Curator notes` shape — the triage structure is for analytical/decision-prep work. Use judgment.

### Subagent prompt patterns (learned 2026-05-26)

The first brainstorm batch (3 parallel subagents) validated a prompt shape that consistently produces high-signal output. Capture for reuse:

A good subagent brainstorm prompt has all six of:

1. **Clear deliverable.** What you're producing, in one sentence. ("15 EFS use cases across diverse industries.")
2. **Exact frontmatter spec** — copy-paste-verbatim YAML block. Removes ambiguity about the agent slug, anchors, status, date.
3. **Scoped "what to read" list** with stop-when-enough guidance. Prevents the agent from reading the whole vault before starting.
4. **Length target** (e.g., "200-400 lines"). Sets expectations on density vs. exhaustiveness.
5. **What-NOT-to-do list.** "Don't commit. Don't read other brainstorms. Don't recommend a winner. Don't pad." Each one prevents a specific failure mode.
6. **Exit-summary expectation.** "Return 3-5 sentences: what you produced, perceived value, anything that was unclear." This gives the PM curation hooks.

Empirical batch-1 stats: ~40-60k tokens per subagent, ~2-4 min runtime, output 150-400 lines, zero need for clarification turns. Three in parallel = ~155k tokens total, ~3.5 min wallclock.

**Estimated token budget per subagent: 50k-130k** (updated 2026-05-26 after batch-3 — varies by tool-use intensity). A batch of 3-5 in parallel costs 150-250k tokens; a batch of 7 costs 600-700k. **Anything beyond ~250k for a single batch should be deliberate** — large batches need explicit James green-light.

**Pattern observation (batch-3):** brainstorms that DO things (compile artifacts, run greps, read actual code) produce more grounded output than purely-generative ones. Worth seeding more "go look at the actual data" prompts. `bs-bytecode-budget-v1` (compiled artifacts → real numbers) was the most concrete output for its token cost; `bs-vocab-coherence-audit-v1` (77 greps) found drift instances no generative brainstorm would have invented.

### Cron agents (future)

Once this system is accepted, cron-driven brainstorm agents become viable. Each cron agent has:

- A stable slug (e.g., `bs-divergent-usecases`, `bs-rot-audit`, `bs-edge-cases`)
- A scoped prompt (not "brainstorm anything") — one mode per agent
- Write-only access to `Brainstorms/` — cannot touch Kanban, Designs, For-James, code repos
- A staggered schedule to avoid commit races

Initial seed agents (post-OnionDAO, when bandwidth allows):

1. `bs-divergent-usecases` — weekly. Generate diverse industry use cases. Stress-tests existing designs.
2. `bs-rot-audit` — weekly. Survey vault + repos for stale areas. Feeds PM rot tracking.
3. `bs-edge-cases` — triggered per design promotion. Find failure modes in newly-promoted designs.

Each cron-agent launch prompt lives in the chat where James spins it up (per [[Decisions]] 2026-05-21 — launch prompts only become files when reused).

### Ad-hoc brainstorms

Any agent in any session can write a one-off brainstorm. No cron required. The structure is the protocol; cron is just one way to drive it.

### Pruning

Deliberate only. Triggers:

- A brainstorm becomes obviously obsolete (the design it riffed on was rejected; the use case was decisively ruled out; etc.).
- A pruning pass when the folder gets too dense to scan (PM proposes via Kanban card, James approves).

Each prune sets `status: obsolete` with a `reason:` in frontmatter. The file stays in repo (git history retains it; deleting is rare and only for truly junk content). The PM's INDEX.md filters out obsolete items by default.

Never delete based on age alone. Never delete because "we didn't get to it in time."

### INDEX.md

PM-maintained. Shape (rough):

```markdown
# Brainstorms index

## By area

### SDK
- 2026-05-26 [pm-os-sdk-capability-surface] reference — capability model from Gemini client spec
- 2026-06-03 [bs-divergent-usecases-recipe-network] raw — use case stressing PIN cardinality

### Client
- 2026-05-26 [pm-client-os-architecture] reference — full Gemini OS spec captured

## By status
(quick filters)

## Integrated history
- 2026-06-10 [bs-edge-cases-sort-overlay-tiebreaker] → integrated into ADR-0044
```

PM rebuilds this whenever a status changes or new brainstorm lands.

## Open questions

- [ ] **Should `Brainstorms/` get its own `_template.md`?** Probably no — the whole point is minimal structure. A 5-line example in the README is sufficient. Revisit if agents keep producing malformed frontmatter.
- [ ] **Should the PM ever generate brainstorms itself, or only curate?** Lean: yes, occasionally — capturing chat context (like the Gemini client OS dump) is brainstorm-shaped. PM brainstorms are `agent: pm` and clearly identifiable. The risk is PM-driven brainstorms biasing the surface layer (PM both generating and curating). Mitigation: PM brainstorms are always `status: reference` (informational capture), never `raw` (PM doesn't surface its own work to itself).
- [ ] **Cross-repo brainstorms?** SDK and Client brainstorms are about future repos that don't exist yet. They live in `planning/Brainstorms/` for now. If/when `sdk/` and `client/` repos get their own architecture, they may grow local brainstorm folders or stay centralized. Defer.

## Pre-promotion checklist

- [x] All `## Open questions` resolved or explicitly deferred
- [x] `**Target repos:**` confirmed (`planning` only)
- [x] `**Depends on:**` chain — `0001-design-system` is accepted
- [x] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment — pending @james

## Implementation notes

PR tracking (none yet — design lives in `planning/`).

Implementation steps once accepted:

1. Create `Brainstorms/README.md` (pointer to this design + the 5 rules).
2. Create `Brainstorms/INDEX.md` (seed empty or with the first `pm-client-os-architecture` entry).
3. Update [[design-system]] § Directory layout to include `Brainstorms/`.
4. Update [[conventions]] Tag vocabulary table with the new brainstorm-status tags (`#bs-status/raw` etc.) if we decide to tag — or omit if frontmatter alone is sufficient (likely).
5. PM SOUL gains curation duty (already drafted in pending update).
