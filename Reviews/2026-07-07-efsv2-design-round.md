# 2026-07-07 — EFS v2 design round (native kernel + tag-core)

**Context:** James ruled the carrier (native envelope kernel, EAS dropped — [[2026-07-07-carrier-decision]]) and directed the v2 deep-design round: anchors → tags, maximal simplification, "ultimate form," nothing binding. Entry point: [[fable-handoff-v2-tag-core]]. This record documents the multi-agent round behind the `Designs/efsv2/` doc set. Full corpus (~680KB, 15 files): `planning/Reviews/2026-07-07-efsv2-corpus/`.

**Method:** 15 agents — 8 parallel designers (two opposing kind-set architects; two app-grounding engineers covering ten apps at record level; envelope cryptographer; kernel architect; identity designer; ops/economics designer) → kind-set reconciler (app evidence as decider) → 5 dedicated red teams → completeness critic (gap-finding + contradiction adjudication + fatal triage). A follow-up single agent designed the missing Read & Lens Resolution Spec (gap G1).

## Headline results

- **The tag-core simplification lands:** 9 record kinds → 5 (TAGDEF, DATA, LIST, PIN, TAG + ASSERT/REVOKE ops). PROPERTY, MIRROR, REDIRECT, LIST_ENTRY deleted *entirely* (no dual spellings), their write-time enforcement re-homed into a frozen reserved-key table + auto-interning VAL edges. Write flows: property set 3→1 records, list-add 3→1, file publish −12–30% records. Both of the handoff's flagged traps HELD under both architects, the reconciler, and the apps (PIN/TAG cardinality split — "cardinality is part of slot identity"; DATA owned).
- **The ten-app grounding — never before run — confirms the direction:** no app blocked. The stress case (package registry) broke the expiry doctrine *as worded* and forced stale-not-dead semantics, declared-home pull-latest, and advisory deny-lists; consumer apps forced the container-scoped discovery index decision into the open.
- **The crypto core is freeze-grade by executed verification:** the envelope red team independently recomputed every frozen constant, reproduced the EIP-712 digest against stock `eth_signTypedData_v4`, re-implemented and fuzzed the Merkle construction, and verified both arch-B fatals (coordinate-claimId ambiguity; same-seq revert-divergence) genuinely closed. Zero fatals on envelope and identity.
- **The round's real defect was same-session interface drift** on consensus-bearing constants (claimId formula ×3, seq policy, comparator, TID bound with a literal µs/s unit bug, expiry placement, checkpoint semantics, slot-on-revoke, kind table) — all adjudicated one-sidedly by the critic and pinned in the doc set's amendment layers + `freeze-gates.md` §D.
- **One fatal-grade-if-unfixed cluster** (filed as three separate "serious" findings): admission checks reading revocable state / permanently rejecting what another kernel could accept — jointly breaks write-once-copy-anywhere for honest authors. Fixed by one Etched master invariant (admission confluence) + maxEntries→read-filter + inert refusal events + listId config-fold.

## Red-team verdicts (one line each)

- **Envelope:** SURVIVES, no fatal; 3 serious (maxEntries admission gate contradicts the convergence invariant; "truncation-replay closed" over-claims — relabeled bounded/detectable; WebAuthn 0x03 needs canonicalization before un-reserving) — all amended.
- **Kernel:** direction survives; replay-as-rollback verified closed; 5 serious (carriage-dependent claimId — overruled by envelope's formula; N-set revocable-state admission reads; in-session drift cluster; LIST evidence-branch steering — dissolved by config-in-listId; EIP-170 ladder rung 1 is a compiler no-op) — all amended.
- **Identity:** no fatal, byte-exact claims reproduced; 10 serious (consequence-table gaps incl. KEL-lockout-on-loss and theft-escalation-at-KEL-launch; successor dual-slot bug; org-analogy inversion; rotation-locality; KEL-fork merge rule) — all amended.
- **Ops:** holds with mandatory repairs; one conditional fatal (silent checkpoint dependency) resolved by the checkpoint-as-ordinary-reserved-claim reading (James ratification pending); key-compromise honesty, grade-flipping freshness horizons, deny-semantics, EQUIVOCAL grade added.
- **Kinds:** kind set survives, no collapse undone; 7 serious (expiresAt hollows appendOnly → `expiresAt==0` require; selective replication-coherence → inert refusals; charter equivocation → config-in-listId; many-to-one supersession → dual-role supersededBy; targetKind enumeration; expiry read-rule split; successor demoted) — all amended.

## Critic's gap list (G1–G10) and disposition

G1 read/lens spec → designed post-round (read-lens-spec.md). G2 discovery index → ruled ADD, James cost sign-off pending. G3 deterministic-ids delta → consolidated in codex-kinds. G4 container classifier → read-lens-spec chapter. G5 read-ABI ownership → codex-kernel. G6 genesis manifest → enumerated in codex-kernel. G7 executable gates → freeze-gates B-table (unrun; several verdicts hostage). G8 visibility machinery → ruled: contains-walk, visibility TAGs deleted. G9 encryption/key-wrap coupling → one normative sentence in identity. G10 pledge scope + housekeeping → freeze-gates C + open questions.

## What needs James (all with recommendations)

Checkpoint reading; spine + discovery-index costs; KEL as dated obligation (~2030); appendOnly signer-legibility residual; honest LoC/schedule re-plan (~2,300–2,900 Etched LoC reviewed, not 500–900). Tracked in `Designs/efsv2/freeze-gates.md`.
