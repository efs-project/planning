# Claude Evidence Round Recovery Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the complete 2026-08-13 Claude evidence round, correct its authority and factual framing, and route each evidence family without creating owner decisions.

**Architecture:** Keep one concise synthesis at this folder root and place mechanically recovered, provenance-stamped agent memos under `corpus/arcade/`, `corpus/runner/`, and `corpus/venue/`. Coordination files carry pointers and status only; design-folder READMEs receive evidence links, not new mechanisms or rulings.

**Tech Stack:** Markdown, Git, `jq`, planning-vault audit scripts.

## Global Constraints

- Treat every recovered memo as dated research evidence, never as an owner ruling or adopted design.
- Preserve all 30 distinct completed memo results; deduplicate only byte-identical duplicate notifications.
- Preserve both substantively different Arcade falsification passes.
- Remove local absolute paths and discarded scratch paths from committed text while preserving technical content.
- Do not ask James the seven analyst questions while the owning EFS v2 and Arcade queues remain held.
- Do not select a Realm/Commons venue, stop Arcade, clear Andromeda for durable publication, or choose a browser-runner policy in this pass.
- Work directly on `planning/main`, as James explicitly authorized on 2026-08-13; stage exact paths and never use `git add -A`.

---

### Task 1: Recover the source corpus

**Files:**
- Create: `Reviews/2026-08-13-claude-evidence-round/corpus/README.md`
- Create: `Reviews/2026-08-13-claude-evidence-round/corpus/arcade/*.md`
- Create: `Reviews/2026-08-13-claude-evidence-round/corpus/runner/*.md`
- Create: `Reviews/2026-08-13-claude-evidence-round/corpus/venue/*.md`

**Interfaces:**
- Consumes: completed `<task-notification><result>` payloads in Claude session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`.
- Produces: 30 distinct, provenance-stamped Markdown reports and a manifest mapping task ID, completion time, source line, character count, and filename.

- [x] **Step 1:** Extract every distinct completed memo into a temporary directory and hash-normalize duplicates.
- [x] **Step 2:** Assign the reports to the Arcade, runner, and venue evidence families; preserve both Arcade passes.
- [x] **Step 3:** Decode rendered HTML entities and replace machine-local absolute paths with explicit portable placeholders.
- [x] **Step 4:** Write the corpus files and manifest.
- [x] **Step 5:** Verify the manifest names exactly 30 reports, every file is non-empty, and no local absolute path or likely credential remains.

### Task 2: Repair the curated synthesis

**Files:**
- Modify: `Reviews/2026-08-13-claude-evidence-round/README.md`

**Interfaces:**
- Consumes: recovered corpus and the factual consistency audit.
- Produces: a phone-readable account separating observations, analyst interpretations, owner questions, and unresolved limitations.

- [x] **Step 1:** Correct lane lineage and replace “independent convergence” with cross-domain convergence.
- [x] **Step 2:** Correct blob-retention, exit-window, Polygon zkEVM, archived-project, EIP-8037, fee-history, and L1-sampling language.
- [x] **Step 3:** Replace Andromeda clearance language with the actual provisional evidence status.
- [x] **Step 4:** Move the seven questions into a held routing section that explicitly asks nothing of James now.
- [x] **Step 5:** Link every headline to its underlying corpus report and add a source-recovery/provenance section.

### Task 3: Restore authority and workflow routing

**Files:**
- Modify: `Decisions.md`
- Modify: `Kanban.md`
- Modify: `Daily Notes/agent-status.md`
- Modify: `Reviews/README.md`

**Interfaces:**
- Consumes: corrected evidence-round synthesis.
- Produces: one real PM coordination decision, one completed Kanban card, an append-only correction/status line, and a discoverable Reviews index entry.

- [x] **Step 1:** Replace the research dump in `Decisions.md` with a concise PM routing decision stating that the round is evidence, not authority.
- [x] **Step 2:** Move the evidence-recovery card from In Flight to Done and remove “awaiting James.”
- [x] **Step 3:** Append a same-day Codex PM correction/completion entry without rewriting the Claude session record.
- [x] **Step 4:** Add the round and corpus to `Reviews/README.md`.

### Task 4: Link evidence from owning workstreams

**Files:**
- Modify: `Designs/efsv2/README.md`
- Modify: `Designs/clientv2/README.md`
- Modify: `Designs/arcade/README.md`

**Interfaces:**
- Consumes: corrected evidence-round synthesis and corpus.
- Produces: evidence-map pointers only; no mechanism, scope, or owner ruling.

- [x] **Step 1:** Add the venue/L1 corpus to the EFS 2.0 evidence map as input to V2-E5/V2-E7 and cost/reconstruction tests.
- [x] **Step 2:** Add the measured browser matrix to the client evidence map, explicitly leaving policy open.
- [x] **Step 3:** Add the two falsification passes and Andromeda audit to Arcade, correcting “rights-clean/mobile-capable” to provisional status.

### Task 5: Verify, commit, and publish

**Files:**
- Modify: `Reviews/2026-08-13-claude-evidence-round/RECOVERY.md`

**Interfaces:**
- Consumes: all recovery edits.
- Produces: a checked, pushed planning-main commit with an auditable completion ledger.

**Audit note:** recovery-specific checks, tri-sync, open-decisions freshness,
promotion inventory, and needs-integration passed. `stale-cards.sh` still reports
the pre-existing Grants card expired on 2026-07-30; it is unrelated to this
round and was not silently re-dated. The promotion audit found no recent
`promote:` commits to verify and said so rather than issuing a clean bill.

- [x] **Step 1:** Run corpus count, local-path, secret-pattern, broken-link, and whitespace checks.
- [x] **Step 2:** Run `open-decisions.sh --check`, `tri-sync-check.sh`, `stale-cards.sh`, `designs-awaiting-promotion.sh`, `promotion-check.sh`, and `needs-integration.sh`.
- [x] **Step 3:** Review the complete diff against this plan and resolve every material finding.
- [ ] **Step 4:** Mark completed plan items, stage only the named paths, commit with PM/Codex trailers, and push `main`.
- [ ] **Step 5:** Verify `HEAD == origin/main`, the worktree is clean, and the pushed commit contains all 30 reports.
