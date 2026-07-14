# EFS v2 design set — map

The v2 architecture: **native envelope kernel + tag-core data model** (EAS dropped as carrier, 2026-07-07 ruling; anchors collapsed into TAGDEF; 9 record kinds → 5). Produced by the 2026-07-07 design round (8 designers → kind-set reconciliation → 5 red teams → completeness critic; record: [2026-07-07-efsv2-design-round](../../Reviews/2026-07-07-efsv2-design-round.md); full corpus: [2026-07-07-efsv2-corpus/](../../Reviews/2026-07-07-efsv2-corpus/)).

> **Current status: active constitutional reconciliation. Nothing in this directory is ceremony-final or permission to deploy permanent bytes.** Older “Etched” labels record confidence from an earlier round; KEL, full-width principals, typed lenses, privacy, and cross-chain clarification have reopened their joined surfaces.

**Reading order for a fresh reviewer:**

1. [[owner-rulings]] — decisions James has actually adopted.
2. [[assumptions-and-requirements]] — canonical validation ledger; separates requirements, assumptions, hypotheses, and human choices.
3. [[human-overview]] — the integrated system in plain English.
4. Current domain inputs: [[kel]], [[fs-pass-synthesis]], [[onchain-completeness]], and [[privacy-pass-synthesis]], plus the [lens architecture review](../../Reviews/2026-07-11-efsv2-lens-architecture-and-scale-review.md) as the current **non-normative** lens-design input pending a replacement spec.
5. Exact technical specs only after understanding their current reconciliation warnings.

**Source precedence during reconciliation:** adopted owner rulings → ratified requirements/invariants → later system constitution → reconciled self-contained technical specs → decision/freeze process sheets → historical reviews, handoffs, and snapshots. [[assumptions-and-requirements]] controls classification and blocker status; its proposed requirements and recommendations are not adopted merely because they are listed.

`confidence-and-open-decisions.md`, Fable handoffs/kickoffs, the old holistic/substrate sequence, and review corpora remain useful history. They are not the normative entry point and must not settle a newer contradiction by accident.

## The v2 documents (this round)

| Doc | Tier | What it rules |
|---|---|---|
| [[codex-envelope]] | **Reopened candidate — coordinated re-cut required** | The irreversible signing surface. KEL requires `authorityId` + `authEpoch`, a suite-neutral semantic identity, and new vectors; the prior `recovered == author` struct is historical baseline. |
| [[codex-kinds]] | **Reopened candidate** | The five-kind reduction remains strong, but full-width principals, native-kernel IDs, string/literal grammar, privacy rows, and joined vectors must reconcile before freeze. |
| [[codex-kernel]] | **Reopened candidate — coordinated re-cut required** | The kernel artifact. Strong historical authority requires an admission-ordered authority lane, stored `AuthReceipt`, evidence/import lane, and bounded identity ABI before freeze. The exact authority topology is not yet adopted. |
| [[read-lens-spec]] | **Reopened Durable draft — replacement required** | Useful evidence/basis/fail-closed rules, but its flat universal author list, global same-order equivocation, old KEL grades, and pinned dependency claims do not survive the typed compiled-policy review. |
| [[identity]] | **Historical KEL baseline** | Bare-EOA zero state survives; the later-peer, read-time authority, root-key mutation, persona-fleet, and ~2030-deferral design is superseded by [[kel]]. |
| [[kel]] | **Foundation draft / ceremony input** | Stable principal + scoped actors; complete pre-rotation; recovery; home authority; admission receipts; passkeys/PQ; AA adapters; account/organization/persona UX; freeze ledger and owner decisions. |
| [[ops-doctrine]] | **Reopened Durable input** | Useful operational work on relayers, expiry, censorship, spam, and liability; old flat-lens and dead-chain assumptions require reconciliation. |
| [[apps-cookbook]] | Informative | Ten-app grounding verdicts + blessed patterns (none blocked; the model's demanded changes all adopted upstream). |
| [[large-file-uploads]] | Candidate mechanism + lens guidance pending recut | One-signature large on-chain uploads: signed `chunks` manifest → apex-count `chunksRoot` → sibling `EFSBytes` contract, proof-streamed bytes, resumable via on-chain bitmap, tier-0 in state, forward-compat promotion. Its joined rows, grades, and vectors remain part of the final reconciliation. |
| [[confidence-and-open-decisions]] | Historical snapshot | Mid-iteration calibration from before the KEL/privacy/lens reconciliation. Useful reason trail; not an entry point or current authority. |
| [[freeze-gates]] | **Blocked historical process** | The 2026-07-07 ratifications/gates and one-final-freeze scope. Regenerate after owner validation, constitution, and coordinated recut. |
| [[client-os-pressure-report]] | Pressure (from client v2) | What the official client OS design round (2026-07-07, `Designs/clientv2/`) asks of this set: read-ABI items P1 + reserved-key candidates P2 flagged **before freeze**; read-grade extensions, actor/delegation, update-channel ops, privacy obligations, private-record tier. |

## The filesystem-features pass (2026-07-10, Pass 1 of the staged round)

| Doc | Tier | What it rules |
|---|---|---|
| [[fs-pass-synthesis]] | ruling record | Corrected canon (C1–C14), the classic-FS dispositions master table (native / re-homed / gone), the five-want access decomposition, the read-time CRDT fold + B3-public demotion, the consistency statement, corrections annex. |
| [[fs-pass-freeze-reservations]] | **Blocked reservation input pending coordinated recut** | Valuable exact candidate text for wire items, state bundles, and rows. Feed surviving items into the eventual regenerated freeze package; do not merge directly into the old [[freeze-gates]]. |
| [[fs-pass-james-decisions]] | process | Nine decisions with recommendations + priced refusal degradations (sequence 1–3 after the gas snapshot). |
| [[os-pass-handoff]] | handoff | P1–P13 adjudications + the OS-facing contract; what changed under the OS pass. |
| [[privacy]] | cross-cutting | The two-layer privacy model (confidentiality vs metadata), the research grounding, the frontier map. **Validated + corrected in place by the 2026-07-11 privacy pass** (killed claims marked; §9 hedges ruled). |
| [[onchain-completeness]] | **the on-chain/off-chain ruling** | The full audit: three-axis model (durability/queryability/composability), the capability×tier matrix, **the explicit 18-item James sign-off list**, the corrected keep/demote line, 5 regressions, and The Line. Headline freeze change: the reverse-index postings word must carry `definitionId`. |
| [[onchain-graph-queries]] | requirement (seed) | The original backlink regression finding — subsumed by [[onchain-completeness]]. v1 answered "which records point here" on-chain; v2 demoted it; reclassified to required. |
| [[fable-fs-kickoff]] | historical kickoff | The kickoff context (leanings now superseded by the synthesis where they conflict). |

Corpus: [2026-07-10-fs-pass-corpus/](../../Reviews/2026-07-10-fs-pass-corpus/); record: [2026-07-10-fs-pass](../../Reviews/2026-07-10-fs-pass.md).

## The deep privacy pass (2026-07-11)

8 research/design lanes (stealth, ZK, read-path, autopsies, Layer-1 crypto, metadata adversary, OS private tier, law/positioning) → 4 red teams → binding critic + repair round. Headline: **privacy demands almost no frozen surface** — the ceremony delta is one pinned derivation function (A-1) + four row-text amendments + two optional James items (the JD-8 genesis announce line; the JD-36 F-2+F-2b subtree-unlock pair); both of privacy.md §9's "now-or-never" hedges were killed as freeze items.

| Doc | Tier | What it rules |
|---|---|---|
| [[privacy-pass-synthesis]] | ruling record | The privacy canon PC-1–PC-14: launch tiering (private files + encrypted dirnodes at launch; salted family post-freeze; stealth/ZK roadmap), the recoverable/shreddable tier split, the blessed crypto substrate (committing AEAD, X-Wing, scan lanes), the quantum-expiry honesty line, stealth/ZK/PIR rulings, the 24-item kill list, the owed-work ledger. |
| [[privacy-freeze-reservations]] | **Blocked reservation input pending coordinated recut** | Exact candidate texts A-1–A-6 and optional James items remain valuable. Feed surviving items into the eventual regenerated freeze package after KEL/full-width reconciliation. |
| [[privacy-james-decisions]] | process | JD-1–JD-38 consolidated: two ceremony calls (JD-8, JD-36), the values calls, bulk-approvable ratifications, and the gates on future tiers (JD-31–35). |

Corpus: [2026-07-11-privacy-pass-corpus/](../../Reviews/2026-07-11-privacy-pass-corpus/) (8 lanes, 4 red teams, critic + critic-addendum — the two critic files are the binding consolidation); record: [2026-07-11-privacy-pass](../../Reviews/2026-07-11-privacy-pass.md). The OS-tier design of record ([os-private-tier.md](../../Reviews/2026-07-11-privacy-pass-corpus/os-private-tier.md)) is a direct input to the next OS pass.

## The KEL and account-foundation pass (2026-07-11)

Current-standards research across KERI, did:webvh, did:plc, Farcaster, transparency logs, Ethereum account abstraction, passkeys, delegation, recovery, PQ migration, and century evidence → native-EFS synthesis → crypto/account/integration red teams → three-lane post-synthesis no-go audit and repair. Headline: the old KEL reservation is **not safely additive after the envelope/kernel freeze**. Stable principals and scoped actors require a signed authority seam. If James requires definitive protection from post-revocation backdating, strongest-grade historical authorization also requires admission co-ordered with KEL state. The venue topology for that admission remains an owner decision.

| Doc | Tier | What it rules |
|---|---|---|
| [[kel]] | **foundation candidate / topology input** | Strong stable-principal, scoped-actor, recovery, and admission mechanics plus a maximal per-principal-home topology. The topology is demoted to a hypothesis by [[assumptions-and-requirements]]; it is not the canonical adopted architecture. |
| [KEL identity-foundation review](../../Reviews/2026-07-11-kel-identity-foundation-review.md) | review record | The P0/P1 findings, candidate comparison, recommended architecture, UX result, strategic rulings, and immediate freeze consequences. |
| [KEL research corpus](../../Reviews/2026-07-11-kel-research-corpus/) | evidence | Precedents/candidates, Ethereum accounts/passkeys/UX, crypto red team, and integration/completeness review with primary sources. |

Until [[kel]]'s owner choices and external gates close, treat every older “Etched” identity/envelope/kernel label as **candidate surface, not permission to run the ceremony**.

## Carried forward from earlier rounds (historical inputs)

| Doc | Status |
|---|---|
| [[fable-handoff-v2-tag-core]] | historical handoff; leanings now superseded by this set where they conflict |
| [[efs-substrate-decision]] | Historical investigation. Its EAS carrier proposal is superseded; only decisions specifically reaffirmed in newer owner rulings/requirements survive. |
| [[deterministic-ids]] | Reopened baseline. Chain-free/domain-separated ID goals survive, but EAS assumptions, full-width principal defects, literal grammar, and vectors require a coordinated native-kernel recut. |
| [[efs-v2-holistic-redesign]] / [[efs-v2-transition-plan]] | Historical umbrella/sequencing inputs. Mission guardrails may be re-adopted; old EAS, scope-closure, and freeze sequencing are not current authority. |

## Status

Everything is `#status/draft`. The set is **reconciliation-ready, not promotion-ready**. The next step is owner validation of [[assumptions-and-requirements]], a short system constitution, coordinated technical re-cuts, complete measurements, and joined-system review. The existing [[freeze-gates]] list is blocked and must be regenerated against the eventual final bytes.
