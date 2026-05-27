---
agent: bs-rot-audit-v1
date: 2026-05-26
status: raw
anchors:
  - area: meta
---

# First formal rot audit (baseline)

Catalogues stale/incomplete work across `planning/`, `contracts/`, `client/` as of 2026-05-26. Extends the PM's mental rot list (SDK + Official Client) with file/date/severity evidence. Future audits compare against this baseline.

Method: `git log -1 --format="%cd" --date=short -- <file>` per file in each repo; cross-referenced against Kanban, Decisions, Designs, and known designs/branches. "Stale" = no commit in 30+ days (cutoff date: 2026-04-26) **unless** the file is intentionally reference material. "Draft-stale" = `#status/draft` for >14 days. Severity tiers: **H** (blocks OnionDAO or causes correctness drift), **M** (causes confusion / wastes future agent time), **L** (cosmetic / housekeeping).

Today's anchors: OnionDAO T-6 days (2026-06-01); custom-lists is the In Flight keystone.

---

## 1. Repo-level rot signals

| Repo | Last commit on main | Days stale (vs 2026-05-26) | Notes | Severity |
|---|---|---|---|---|
| `planning/` | 2026-05-27 | 0 | Active. PM curating weekly. | — |
| `contracts/` **main** | 2026-04-16 | 40 | All active work is on `custom-lists` branch (last commit 2026-05-21). Main hasn't moved in 6 weeks. | M (expected, but worth naming) |
| `client/` | 2026-05-21 | 5 | Latest commit was just adding `AGENTS.md` acknowledging the repo is outdated. Pre-that: 2026-04-07 (49 days). Real code last touched ~2026-01-22. | **H** |

**Surprise finding:** the `contracts/` `main` branch has not moved in 40 days because *all* contracts work has migrated to `custom-lists`. If Lists slips, main is 6+ weeks behind whatever Sepolia expects, and the deploy script changes (per Decisions 2026-05-21) compound the surprise.

## 2. Unmerged / abandoned branches in `contracts/`

`origin/main` plus 17 remote branches. Branches by status:

| Branch | Last commit | Merged into main? | Status |
|---|---|---|---|
| `origin/custom-lists` | 2026-05-21 | NO | **In Flight (keystone)** |
| `origin/may-8-presentation` | 2026-05-08 | NO | 18 days stale. 2 commits ahead (`deploy: disable demo seed`, `lenses: add DEV_ATTESTER`). Purpose: one-time demo. **L** — likely safe to delete, but ask James. |
| `origin/editions-to-lenses` | 2026-05-05 | merged | Could be deleted. **L** |
| `origin/transports`, `dev-process`, `feature/cypherpunk-theme`, `karpathy-coding-principles`, `pin-tag-split`, `efs-lists`, `user-browsing` | various 2026-03/04 | merged | All merged but not deleted. 7 dead branches accumulating noise. **L** |
| `origin/claude/*` (8 branches) | 2026-03-13 → 2026-05-21 | 7 merged, 1 (`confident-heisenberg-dfa314` 2026-05-21) merged | Cleanup. **L** |
| `origin/codex/pr10-review-process-tune` | 2026-04-23 | merged | **L** |
| `origin/fix/ui-bugs-and-ux-improvements` | 2026-03-12 | merged | **L** |

**Local branches** in working clone include `pr-6`, `pr-6-claude`, `pr-6-final2/3/fix/latest` — all merged into main, all stale. Workspace hygiene issue, not a rot blocker.

Open PRs: **0** (per `gh pr list`). All branches are either merged or `custom-lists`.

## 3. Stale files in `planning/`

Everything in `planning/` was touched on 2026-05-21 or later, except:

| File | Last touched | Days stale | Notes | Severity |
|---|---|---|---|---|
| `Daily Notes/2026-05-12.md` | 2026-05-12 | 14 | Only entry: "Created this planning board." Effectively obsolete; consider rolling into history. | **L** |

Architecture/Onboarding/Agents/Designs all last touched 2026-05-21 — the post-bootstrap rest. Not rot; bootstrap is over. **No action.**

## 4. Stale designs in `planning/Designs/`

| Design | Status | Last touched | Days in current status | Severity | Notes |
|---|---|---|---|---|---|
| `cross-repo-reference-mirror.md` | `#status/draft` `#blocked-on/concrete-CI-need` | 2026-05-21 | 5 in current edit, but **draft since vault inception** | **L** | Self-aware: the design's own header notes its primary use case evaporated when `/efs/` colocation landed. Kept on file as deferred. Not rot — intentional dormancy. Document as such. |
| `brainstorm-system.md` | `#status/draft` | 2026-05-27 | 1 | — | Active. In For-James queue for review. |
| `0001-design-system.md` | `#status/accepted` | 2026-05-21 | 5 | — | Landed. |
| `Agents/pm.md` (SOUL) | `#status/review` | 2026-05-26 | 0 | — | Active. |

**No design has been in `#status/draft` for >14 days without active edits.** The cross-repo mirror's 5-day-since-edit hides 35+ days of dormancy in real terms, but the design's own prose declares itself dormant — clean.

## 5. Stale brainstorms

All 7 brainstorms dated 2026-05-26 (current). All untouched since creation by design (brainstorms are write-once unless `obsolete`'d).

- 6 in `status: raw` — that's appropriate. The PM curates ≤2/week into `For-James.md`; backlog accumulation is the *point* of the system.
- 1 in `status: reference` (`pm-client-os-architecture`) — explicitly long-lived.

**No rot.**

## 6. Contracts spec ⟷ code drift

Surfaced by `bs-contract-decomposition-v1` 2026-05-26, already Kanban-carded ("Fix contracts spec drift"). Quantification:

| Spec file | "edition" mentions | "TagResolver" mentions | Last touched |
|---|---:|---:|---|
| `specs/01-System-Architecture.md` | 2 | 0 | 2026-04-14 |
| `specs/02-Data-Models-and-Schemas.md` | 6 | 0 | 2026-04-16 |
| `specs/03-Onchain-Indexing-Strategy.md` | 24 | 0 | 2026-04-16 |
| `specs/04-Core-Workflows.md` | 23 | 0 | 2026-04-16 |
| `specs/05-Extensibility-and-Web-UI.md` | 1 | 0 | 2026-04-14 |
| `specs/06-Lists-and-Collections.md` | 1 | 0 | 2026-04-15 |
| `specs/07-Sort-Overlay-Architecture.md` | 6 | 0 | 2026-04-09 |
| `specs/08-Custom-Lists-Design-Notes.md` | 6 | 0 | 2026-04-08 |
| `specs/overview.md` | 8 | 0 | 2026-04-16 |
| `specs/README.md` | 1 | 0 | 2026-04-16 |

(Note: "TagResolver" was searched in `main`-branch specs; the rename happens on `custom-lists`. Once Lists merges, every `edition`/`TagResolver` reference in `main` becomes wrong on the same day. The spec drift is **latent on main, active on custom-lists**.)

ADR-0041 (PIN/TAG split) and ADR-0043 (EFS Edge Constraint Callbacks) only exist on `custom-lists`, not on `main`. **78 total "edition" references** across `main` specs will turn stale at Lists merge.

**Severity: H** (it's already carded — but it's H because of *timing*: deferring this until after Lists merge means hackathon entrants reading `main` specs the day Sepolia goes live get incorrect terminology).

Also drifting: `specs/overview.md` claims **6 core contracts** but `contracts/packages/hardhat/contracts/` shows ~11 `.sol` files (per Decisions 2026-05-26 — contract-count correction). Already on the same Kanban card.

## 7. Contracts docs/QUESTIONS rot

| File | Last touched | Days stale | Notes | Severity |
|---|---|---|---|---|
| `docs/QUESTIONS.md` | 2026-04-16 | 40 | Two open tier-2 questions still listed (Devnet upgradeability proxy pattern; Multi-edition merge semantics). Both have "Default if not answered" fallbacks — so they're not strictly blocking — but neither has moved to `decisions.md` and they predate Lists work. | **M** |
| `docs/LAUNCH_CHECKLIST.md` | 2026-04-16 | 40 | References "Devnet (April 19, 2026) — bicycle day" + "Mainnet (target ~April 22, 2026 → likely later)". Both dates passed. The OnionDAO/Sepolia plan supersedes this checklist but the file doesn't say so. | **H** |
| `docs/FUTURE_WORK.md` | 2026-04-16 | 40 | Not necessarily rot; it's a parking lot. But hasn't grown despite 40 days of active Lists work — implausible no new items have surfaced. | **L** |
| `docs/decisions.md` | 2026-04-16 | 40 | No new decisions logged on `main` since pre-Lists. Lists-branch work has its own decision flow on the branch. **M** — once Lists merges, this needs a sweep. | **M** |
| `docs/adr/0001…0032` | all 2026-04-16 | 40 | Static ADRs are *supposed* to be static. **No rot** — they are by design append-only. Newest on `main` is 0032. ADRs 0033–0043 live on `custom-lists` only. |

## 8. `client/` repo (target spec vs. reality)

Already on PM's mental rot list. Quantifying:

| Aspect | State | Severity |
|---|---|---|
| Last real code commit | 2026-01-22 (124 days ago) | **H** |
| Last commit at all | 2026-05-21 — only `AGENTS.md` "I'm outdated" disclosure | — |
| Target architecture | Ring-architecture / SES / OCap — captured in `Brainstorms/2026-05-26-pm-client-os-architecture.md` (status: reference) | — |
| Carded? | YES — Kanban Backlog "Build Client Skeleton" + "EFS OS SDK" | — |
| OnionDAO-blocking? | NO — per Decisions 2026-05-21, deferred | — |
| Tech-stack drift | Web Awesome on npm/non-beta (Jan 2026), no Lit/SES/Vite consolidation yet | M |

**This is the single most-rotten file tree in the project, but it's intentionally so.** James has explicitly deferred Client OS work post-OnionDAO. The right move is to label this "hibernating" not "abandoned" — see exit triage.

## 9. Known gaps mentioned but uncarded

Grepped `Decisions.md`, `Milestones.md`, `Onboarding/`, `Designs/` for `TODO`, `to be drafted`, `needs follow-up`, `deferred`, `TBD`:

| Mention | Source | Carded? | Notes | Severity |
|---|---|---|---|---|
| "Schema/contract freeze ceremony at deploy" | Decisions.md 2026-05-26 | Implicit in custom-lists card | The phrase "no separate freeze ceremony needed as long as no further schema edits happen during hackathon" assumes vigilance during the month of June — there's no card to *enforce* this. | **M** |
| "Open question — SOUL files numbered or name-only on promotion?" | `Agents/pm.md` line 279 | NO | First promotion sets the precedent; no card. | **L** |
| "EVENT/TRANSITION schema before mainnet shape-freeze" | For-James.md (downgraded typed-edge finding) | NO Kanban card | Real schema design needed, just not before OnionDAO. | **M** |
| "Cross-repo reference mirror — surface concrete CI need" | Designs/cross-repo-reference-mirror.md | NO | Tag `#blocked-on/concrete-CI-need` is a trigger that has no listener. Will only un-block if someone notices the trigger fires. | **L** |
| "Production EFS Client review session" | contracts/docs/QUESTIONS.md resolved section, points at LAUNCH_CHECKLIST | NO active card | Listed as "still deferred to a dedicated session." LAUNCH_CHECKLIST is itself stale. | **M** |
| "Migrate clones to /efs/ home directory layout" | Kanban Backlog | YES (carded, #blocked-on/human-decision) | Not rot — properly tagged as blocked. | — |
| "Plan OnionDAO hackathon logistics" | Kanban Backlog | YES | Surfaced in For-James as `CONFIRM — OnionDAO logistics`. | — |

## 10. Things explicitly NOT rot (auditor's "leave alone" list)

- `Brainstorms/` folder (current).
- `Agents/pm.md` SOUL (current).
- All ADRs 0001–0032 on main (frozen by convention).
- `cross-repo-reference-mirror.md` design — declares its own dormancy in its header.
- `client/` — by James's decision, hibernating, not abandoned.
- `Daily Notes/agent-status.md` — append-only log, age doesn't equal staleness.

---

## Prioritized rot list (by leverage)

Ranked by "fixing this would unlock the most downstream work / prevent the most agent-time waste."

| # | Item | Severity | Leverage rationale |
|---|---|---|---|
| 1 | **`contracts/specs/` drift (edition→lens, TagResolver→EdgeResolver, contract count)** — already Kanban-carded | H | Becomes acutely wrong the day Lists merges. Every hackathon entrant reading specs at deploy time encounters wrong terminology. Single agent-driven cleanup pass; small. |
| 2 | **`contracts/docs/LAUNCH_CHECKLIST.md` superseded but not updated** | H | Has stale April dates as "current launch plan." Future agents reading this for context will misroute. Add a Pre-OnionDAO superseded-by note OR rewrite. |
| 3 | **`contracts/docs/QUESTIONS.md` open tier-2 questions** (devnet proxy pattern; multi-edition merge semantics) | M | Both have defaults so non-blocking, but both predate Lists and might be answered or moot now. James can clear in 5 minutes. |
| 4 | **`contracts/docs/decisions.md` 40 days dormant** | M | Either nothing happened (unlikely) or decisions are happening off-vault. Sweep after Lists merge. |
| 5 | **Schema-freeze-during-hackathon-vigilance is uncarded** | M | Decisions.md says "no separate ceremony as long as no schema edits during hackathon" — but there's nothing actively preventing a schema edit during June. Needs a guard card or a written constraint. |
| 6 | **`Brainstorms/2026-05-26-pm-client-os-architecture.md` has no implementation card path** | M | The reference doc exists; the Kanban cards point at it; but the link from "research is captured" to "first concrete client design thread spawns" has no trigger date. Symptom of broader Client rot. |
| 7 | **`contracts/` dead branches (8+ merged, undeleted; 1 unmerged stale `may-8-presentation`)** | L | Pure hygiene. Confuses agents listing branches. |
| 8 | **`Daily Notes/2026-05-12.md` orphan single-line entry** | L | Trivial. |
| 9 | **SDK (all three types)** — already on PM rot list | M | Intentionally on-the-bench; no leverage to "fix the rot" until SDK design thread spawns post-OnionDAO. Listed for completeness. |
| 10 | **Client repo** — already on PM rot list | H-but-deferred | Same: intentional hibernation. Action is "label clearly," not "fix." |

**Top 2 by raw leverage:** items 1 and 2 — both contracts-side, both small, both bite hard on the day Lists merges (T-6 days). If only one fix were possible this week, the spec terminology cleanup is the highest-impact: every hackathon entrant interacts with specs; almost nobody reads LAUNCH_CHECKLIST.

---

## Counts by severity

- **High (H):** 4 — specs drift, LAUNCH_CHECKLIST stale, client repo (deferred), main-branch staleness (acceptable but worth naming)
- **Medium (M):** 7 — QUESTIONS.md, decisions.md, schema-freeze vigilance, client OS design link, EVENT schema, prod-client review, SDK (deferred)
- **Low (L):** 5 — dead branches, daily-note orphan, SOUL numbering question, mirror design CI trigger, FUTURE_WORK growth

Total catalogued rot items: **16**.

---

# Exit triage

## Controversial human design choices

1. **`client/` repo: "abandoned" vs. "active hibernation"?** Code untouched 124 days; only commit since is an `AGENTS.md` confessing staleness. The target architecture is documented but in `Brainstorms/` (raw → reference), not in `client/specs/`. James has *said* it's deferred-not-dropped (Decisions 2026-05-21). The audit's stance: **call it hibernation** because (a) it's named-and-carded, (b) the target spec is captured, (c) there's a stated post-OnionDAO trigger. But an outside reviewer would reasonably call this "abandoned with a fig leaf." Worth James writing one explicit sentence somewhere: "The `client/` repo is intentionally frozen until 2026-07; ignore its contents until then." Add to `client/AGENTS.md` to compress future-agent confusion.

2. **`contracts/` `main` branch 40 days stale: feature or bug?** All real work has migrated to `custom-lists`. This is *correct* for trunk-based-development-light, but means anyone landing on `main` sees a 6-week-stale specs/ADR set and zero indication that real work is on a branch. The audit's stance: this is a missing pointer, not a missing branch — `main`'s `README.md` should note "active development on `custom-lists` until merge T-6."

3. **`cross-repo-reference-mirror.md` design: keep, prune, or merge into a "deferred designs" register?** It's been self-declared-dormant since 2026-05-21. The design system has no concept of "shelved" — only draft/review/accepted/landed/abandoned/rejected. The pattern "I exist but I'm asleep" doesn't have a tag. Worth deciding whether to: (a) add a `#status/shelved` tag, (b) mark it `#status/abandoned` and note the unblock trigger in a successor brainstorm, or (c) leave as-is (current pattern: draft-with-self-aware-header).

4. **`Brainstorms/` retention rule.** James explicitly rejected auto-prune (Decisions 2026-05-26: "I don't like things dying"). The audit aligns with this *as policy*, but in practice this means the rot audit will always see brainstorms as non-rot and Brainstorms/ will only ever grow. Worth re-affirming or qualifying.

## Unknown questions for future brainstorms

1. **Does the planning vault need a `#status/shelved` or `#status/hibernating` tag** distinct from `#status/abandoned`? (Touched by Client, SDK, cross-repo-mirror.)
2. **What's the trigger that un-hibernates the Client and SDK work?** "Post-OnionDAO" is loose. Is it date-based (2026-07-01), event-based (Sepolia-deploy + hackathon-week-1-survival), or capacity-based (James-has-bandwidth)?
3. **Is there a rot signal the audit *missed* because it only looked at file mtimes?** Examples: ADRs that no test exercises; agents that haven't checked in via `agent-status.md` in N days; designs whose dependencies have moved underneath them.
4. **How often should this audit run?** This is the first. Quarterly? Monthly? Triggered (e.g., on every milestone close)?
5. **Should rot have its own Kanban column** ("Rotting" between Backlog and Blocked)? Or stay as a per-session PM mental check?
6. **Does the `contracts/docs/decisions.md` ↔ `planning/Decisions.md` split create rot of its own?** Two decisions logs in different repos drift. Is there a sync expectation?

## Blockers / concerns

1. **Audit blind spot: `custom-lists` branch contents.** This audit treated `contracts/main` as the canonical source. Most of the live work (ADRs 0033–0043, the EdgeResolver, the new schemas) is on `custom-lists`. The drift quantification for `main` understates the post-merge cleanup load. Re-run this audit on T+1 after Lists merges to get the true delta.
2. **No way to detect "agent-time wasted reading stale doc."** The severity-H assignments above (specs drift, LAUNCH_CHECKLIST) assume agents do read these — which is true today but unverifiable. A `view-log` mechanism on key docs would let future rot audits measure leverage with evidence, not inference.
3. **`gh pr list` returned `[]` for contracts.** Either the repo genuinely has no open PRs (which fits the merged-branches finding) OR the `gh` CLI isn't authed in this environment and silently returned empty. If the latter, the "open PRs >14 days old" check in the audit brief is unverified.
4. **The PM SOUL says "a future `bs-rot-audit` cron brainstorm agent will help mechanize this."** This brainstorm is presumably *that* agent's first run. The mechanization story (cadence, output format, where the diff vs. last audit lives) isn't designed yet.
5. **Auditor self-discipline:** the brief says "don't propose new work" and "don't editorialize about whether rot is bad." Items 1, 2, 6 in the prioritized list border on proposing work — phrased as observations, but they imply Kanban cards. If a stricter "audit only" stance is wanted, strip the leverage column from the prioritized list and let the PM derive cards from raw findings.
