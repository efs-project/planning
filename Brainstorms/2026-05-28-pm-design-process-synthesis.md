---
agent: pm
date: 2026-05-28
status: raw
anchors:
  - area: meta
source: contracts/docs/process/design-lessons.md (on custom-lists branch; lands on main when Lists merges) + James chat 2026-05-28
commissioned_by: james
---

# EFS design process — synthesis & proposal

Commissioned by James 2026-05-28 after the EFS Lists design ran ~18 internal rounds + 3 external review cycles before human review. James read the final doc and immediately saw simplifications — the signal that **human judgment arrived too late, not too rarely.** This synthesizes the dev's `docs/process/design-lessons.md` retrospective + James's "human attention is precious; use it for guidance and review after fleshing out" framing into a proposed streamlined lifecycle.

`status: raw` (not `reference`) because it's meant to be acted on — formalized into a real process doc once James reacts. PM-authored but James-commissioned, so it's a legitimate surface (not PM self-noise).

## The problem, precisely

The Lists process was high-quality but expensive in the wrong currency:

- **18 internal rounds + 3 external cycles**, weeks of wall time.
- Human read at the **end** and had immediate frame-level insights (simplifications, elegance, missing use cases).
- The lessons file independently documents the same failure three ways:
  - **ADR-0043** burned ~a week designing a mechanism that an "is this even needed?" pass would have killed on day one. Framing bias compounded across subagents.
  - Early rounds (R11-12 "lists are folders", R13-14 "free-floating enough") were **frame churn** — a human "what's the simplest mental model?" question would have short-circuited them.
  - The explicit lesson: *"before committing to a frame, ask the human."*

**Diagnosis:** the process spent the scarce resource (human attention) at the cheap stage (final polish) and spent the cheap resource (AI rounds) at the expensive stage (frame discovery). Invert it.

## Core principle

> **Human attention is spent at two points only: setting the frame (early) and gating the result (late). AI does everything in between.**

Rounds are cheap. Frame-corrections are cheap when early and brutally expensive when late (an 18th-round frame change costs 18 rounds). So move the human frame-check to the front.

## Proposed lifecycle

| Stage | Who | What | Cost |
|---|---|---|---|
| **0. Trigger** | brainstorm / James / agent | A need surfaces (gap, use case, requirement). Often from `Brainstorms/`. | — |
| **1. Inverted-framing pass** | AI (1 subagent) | FIRST question is always *"is this needed? for each claimed use case, which existing mechanism already handles it?"* Returns "not needed (why)" or "needed — here are the specific gaps." | ~1 subagent |
| **2. Rough first flesh-out** | AI (1-2 rounds MAX) | Draft the *simplest* version addressing the gaps. **State the frame explicitly**: "the mental model is X." Don't grind — get to human-readable fast. | 1-2 rounds |
| **3. HUMAN FRAME REVIEW** ⭐ | **James** | Read the rough draft + stated frame. Answer "what's the simplest mental model?" Correct the frame, name simplifications, flag missing use cases / implicit invariants. **This is the leverage point.** | ~1 read |
| **4. Flesh-out + adversarial** | AI (parallel subagents) | Within the human-blessed frame: design the mechanism, **pair every "verify X works" with a "find where X breaks"** agent, surface implicit invariants, preserve rejected alternatives in a notes file. | several subagents |
| **5. External review** | external AI (Gemini/Codex/fresh Claude) | **Etched-tier only.** Open-ended "what are we missing." Skip or lighten for Durable/Ephemeral work. | hours of paste-overhead |
| **6. HUMAN GATE REVIEW** ⭐ | **James** | Read the fleshed, reviewed design. Promote (trust-token ceremony) or send back. | ~1 read |

Human touches: **Stage 3 + Stage 6.** Two reads. Not 18 rounds of churn.

## The reusable AI techniques (mapped to stages)

All earned from the Lists retrospective:

1. **Inverted-framing FIRST** (Stage 1). "Is this needed?" before "design this well." The single biggest waste-saver — would have killed ADR-0043 on day one.
2. **Simplest-mental-model question** (Stage 3). The human's answer reveals implicit assumptions agents missed ("anchors are neutral; the attester is just an artifact").
3. **Verify + break pairing** (Stage 4). Every "confirm X works" subagent gets a parallel "find when X breaks" subagent. Counters subagent framing bias. (The SortOverlay bug was caught this way.)
4. **Implicit-invariant audit** (before Stage 5). Read your own doc with fresh eyes; write down every "of course X." Undocumented invariants ("anchors are neutral") caused multiple rounds of analyzing non-attacks.
5. **"What's settled" preamble** in every review prompt. List decisions reviewers should NOT re-litigate — keeps rounds focused on what changed + next-frame questions.
6. **Rejected-alternatives notes file.** Preserve every killed frame + the reason. Future rounds/agents don't re-litigate.
7. **Doc-consistency grep** after any field/concept removal. Stale references accumulated across Lists rounds; grep the removed term, fix all in one commit.
8. **Field enforcement vocabulary** (ADR-0035 lesson). For each schema field: "kernel-enforced (by what mechanism) or declared/advisory?" Don't ship "(kernel enforces via…)" claims that aren't true.

## Internal subagents vs. external review — match tool to question

From the lessons file's cost-asymmetry point:

- **Internal subagents** (cheap, ~minutes): focused "verify X" and "explore Y." Good for Stages 1, 2, 4. This is what the PM has been dispatching for brainstorms.
- **External AI** (expensive, paste-overhead, human-in-loop): open-ended "find what we're missing." Reserve for Stage 5, Etched-tier only.
- **Don't defer to external too early** (internal would've caught it) **or too late** (internal kept missing the frame issue). The tell: if the question is "does this work?", internal. If it's "what are we not seeing?", external.

## Cost discipline

- **Cap pre-frame rounds at 1-2.** The whole point is to reach human frame-review fast. If Stage 2 is taking 5+ rounds, that's a signal the frame is wrong — escalate to Stage 3 immediately rather than grinding.
- **Tier the rigor to permanence.** Full lifecycle (inverted-framing + external review + side-thread stress test) is for **Etched-tier** work (schema UIDs, ABI signatures). Durable/Ephemeral work uses a lighter path. Not everything needs 18 rounds; nothing should need 18 rounds.
- **PM tracks the spend.** Per PM token-watching duty, the PM flags when a design's AI spend outruns its leverage.

## How this integrates with existing vault machinery

- **`Brainstorms/` is the Stage 0/1 engine.** Brainstorms generate triggers and feed the inverted-framing pass. The PM curates which brainstorms become design triggers.
- **`Designs/` lifecycle (design-system) is unchanged** — this proposal is about *how a design gets fleshed out before promotion*, not the promotion ceremony itself. Stage 6 = the existing human-gated promotion.
- **This proposal itself wants to land as either** a new `Onboarding/design-process.md` (procedural: "how YOU run a design") **or** a section in the design-system meta-design. PM leans Onboarding/ — design-system is the perpetual canonical doc and shouldn't bloat; the process is procedural how-to. James decides.

## Controversial human design choices

1. **Where does this live — `Onboarding/design-process.md` or a section in `0001-design-system.md`?**
   - Options: (a) new Onboarding doc, (b) design-system section, (c) stays a brainstorm reference for now.
   - PM read: (a) Onboarding — it's procedural how-to, and editing the perpetual design-system is a Tier-1 action best avoided unless necessary.
   - Why controversial: some would argue the design lifecycle belongs IN the design-system for single-source-of-truth.
2. **Is Stage 3 (human frame review) mandatory or optional?**
   - Options: mandatory for all designs / mandatory for Etched-tier only / advisory.
   - PM read: mandatory for Etched-tier, strongly-encouraged otherwise. The whole proposal hinges on it.
   - Why controversial: it adds a required human touchpoint, which is exactly the bottleneck we're trying to protect — but it SAVES net human time by preventing late frame-corrections.
3. **How hard is the 1-2 round cap before frame review?**
   - A hard cap risks under-fleshed drafts that waste the human read; too soft and we're back to 18 rounds.

## Unknown questions for future brainstorms

1. **What does a good Stage-2 rough draft look like?** A template / example would help agents hit "human-readable fast" without over- or under-fleshing. Brainstorm shape: `bs-design-draft-template-v1` producing an annotated example.
2. **Can the inverted-framing pass (Stage 1) be a standard reusable subagent prompt?** Like the brainstorm prompt patterns — a canonical "is-this-needed" prompt. Would standardize the ADR-0043-saver.
3. **How do we measure whether this process is working?** Metric ideas: rounds-before-human-review, frame-changes-after-human-review (should trend to ~0 if frame review works), human-read-count per design.

## Blockers / concerns

- **The lessons file currently lives only on the `custom-lists` branch** (`docs/process/design-lessons.md`). It lands on `main` when Lists merges. Until then, the canonical source for these lessons is branch-only. The vault should reference it (not duplicate) once it's on main — for now this synthesis quotes the load-bearing parts.
- **This process is itself unproven** — it's a proposal derived from one (large) design's retrospective. First real use is the test. The natural first use is the **Contract Architecture design thread** (post-OnionDAO), which already has Stage-0/1 material from the batch-1/2/3 brainstorms.
- **Meta-irony to embrace:** this very proposal should go through its own Stage 3 — James reads it, names the simplest framing, corrects it — before it gets formalized. Don't grind it through AI rounds first.
