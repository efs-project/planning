# EFS v2 design set — map

The v2 architecture: **native envelope kernel + tag-core data model** (EAS dropped as carrier, 2026-07-07 ruling; anchors collapsed into TAGDEF; 9 record kinds → 5). Produced by the 2026-07-07 design round (8 designers → kind-set reconciliation → 5 red teams → completeness critic; record: [2026-07-07-efsv2-design-round](../../Reviews/2026-07-07-efsv2-design-round.md); full corpus: [2026-07-07-efsv2-corpus/](../../Reviews/2026-07-07-efsv2-corpus/)).

> **Current status: active constitutional reconciliation. Nothing in this directory is ceremony-final or permission to deploy permanent bytes.** Older “Etched” labels record confidence from an earlier round; KEL, full-width principals, typed lenses, privacy, and cross-chain clarification have reopened their joined surfaces.

**Reading order for a fresh reviewer:**

1. [[owner-decision-inbox]] — the single phone-friendly list of choices that still need James; source decision sheets remain the reason trail.
2. [[owner-rulings]] — decisions James has actually adopted.
3. [[assumptions-and-requirements]] — canonical validation ledger; separates requirements, assumptions, hypotheses, and human choices.
4. [[human-overview]] — the integrated system in plain English.
5. Current domain inputs: [[kel]], [[fs-pass-synthesis]], [[onchain-completeness]], [[privacy-pass-synthesis]], and [[lens-spec]] (the lens replacement seed; [[lens-pass-synthesis]] is its ruling record). The [lens architecture review](../../Reviews/2026-07-11-efsv2-lens-architecture-and-scale-review.md) is now the historical input the seed consumes.
6. Exact technical specs only after understanding their current reconciliation warnings.

**Source precedence during reconciliation:** adopted owner rulings → ratified requirements/invariants → later system constitution → reconciled self-contained technical specs → decision/freeze process sheets → historical reviews, handoffs, and snapshots. [[assumptions-and-requirements]] controls classification and blocker status; its proposed requirements and recommendations are not adopted merely because they are listed.

`confidence-and-open-decisions.md`, Fable handoffs/kickoffs, the old holistic/substrate sequence, and review corpora remain useful history. They are not the normative entry point and must not settle a newer contradiction by accident.

## The v2 documents (this round)

| Doc | Tier | What it rules |
|---|---|---|
| [[owner-decision-inbox]] | **Owner decision entry point** | One consolidated, phone-friendly queue — **rewritten 2026-07-25 with the revalidated joined-pass packet P-1…P-23** (hold liftable for the authority surface): decide now, decide after evidence, decide at launch, settled items, and the recording rule back into [[owner-rulings]]. |
| [[codex-envelope]] | **Reopened candidate — coordinated re-cut required** | The irreversible signing surface. KEL requires `authorityId` + `authEpoch`, a suite-neutral semantic identity, and new vectors; the prior `recovered == author` struct is historical baseline. |
| [[codex-kinds]] | **Reopened candidate** | The five-kind reduction remains strong, but full-width principals, native-kernel IDs, string/literal grammar, privacy rows, and joined vectors must reconcile before freeze. |
| [[codex-kernel]] | **Reopened candidate — coordinated re-cut required** | The kernel artifact. Strong historical authority requires an admission-ordered authority lane, stored `AuthReceipt`, evidence/import lane, and bounded identity ABI before freeze. The exact authority topology is not yet adopted. |
| [[lens-spec]] | **Replacement seed (2026-07-28)** | The successor lens family spec: tiered on-chain-core→client→enhanced, the naming taxonomy, the canonical Plan/lens-object encoding, the GATE profile, composition + the 6+1 result model, Views/links/guest + safety floor. Consumes [[read-lens-spec]] as history and FS-LENS/1 as chapter one. |
| [[read-lens-spec]] | **Replaced as entry point (historical)** | Useful evidence/basis/fail-closed rules survive re-typed into [[lens-spec]]; its flat author list, grade dominance ladder, global same-order equivocation, checkpoint-absence, and `?lenses=` links are superseded. Section-by-section: [lens critic §3.1](../../Reviews/2026-07-25-lens-pass-corpus/critic.md). |
| [[lens-read-gotchas]] | Reference companion | The honest-limitations digest for consumers (file reads, directory listings, app-store GATEs, config values) + a map from each open lens decision to the limitation it settles. First read for any SDK/client/contract author. |
| [[identity]] | **Historical KEL baseline** | Bare-EOA zero state survives; the later-peer, read-time authority, root-key mutation, persona-fleet, and ~2030-deferral design is superseded by [[kel]]. |
| [[kel]] | **Foundation draft / ceremony input** | Stable principal + scoped actors; complete pre-rotation; recovery; home authority; admission receipts; passkeys/PQ; AA adapters; account/organization/persona UX; freeze ledger and owner decisions. |
| [[ops-doctrine]] | **Reopened Durable input** | Useful operational work on relayers, expiry, censorship, spam, and liability; old flat-lens and dead-chain assumptions require reconciliation. |
| [[apps-cookbook]] | Informative | Ten-app grounding verdicts + blessed patterns (none blocked; the model's demanded changes all adopted upstream). |
| [[playable-archive-requirements]] | Application pressure / requirements | Focused requirements for visual discovery, explicit click-to-play, verified packages, player controls, safe runtimes, curation, and repeatable publishing. |
| [[ethereum-first-efs-and-os]] | Cross-cutting research frame + sequencing note | Captures the current Ethereum/EFS/OS intent without adopting a venue: Ethereum-first rather than lowest-common-denominator, a broader local-first OS, five coherent architecture shapes, and the joined KEL→lens→substrate/mount research sequence that must precede an MVP contraction. |
| [[solana]] | Substrate-portability investigation | Concrete Ethereum/Solana/local/cloud pressure test. Separates portable artifacts and lens semantics from evidence, authority, query/proof, and byte-store capabilities; supplies the prototype gates for N1/E1 without choosing a venue. |
| [[large-file-uploads]] | Candidate mechanism + lens guidance pending recut | One-signature large on-chain uploads: signed `chunks` manifest → apex-count `chunksRoot` → sibling `EFSBytes` contract, proof-streamed bytes, resumable via on-chain bitmap, tier-0 in state, forward-compat promotion. Its joined rows, grades, and vectors remain part of the final reconciliation. Nonnormative external-carrier evidence and falsification tests: [EthStorage deep dive](../../Reviews/2026-08-05-ethstorage-deep-dive.md). |
| [[confidence-and-open-decisions]] | Historical snapshot | Mid-iteration calibration from before the KEL/privacy/lens reconciliation. Useful reason trail; not an entry point or current authority. |
| [[freeze-gates]] | **Blocked historical process** | The 2026-07-07 ratifications/gates and one-final-freeze scope. Regenerate after owner validation, constitution, and coordinated recut. |
| [[client-os-pressure-report]] | Pressure (from client v2) | What the official client OS design round (2026-07-07, `Designs/clientv2/`) asks of this set: read-ABI items P1 + reserved-key candidates P2 flagged **before freeze**; read-grade extensions, actor/delegation, update-channel ops, privacy obligations, private-record tier. |

## The filesystem-features pass (2026-07-10, Pass 1 of the staged round)

| Doc | Tier | What it rules |
|---|---|---|
| [[fs-pass-synthesis]] | ruling record | Corrected canon (C1–C14), the classic-FS dispositions master table (native / re-homed / gone), the five-want access decomposition, the read-time CRDT fold + B3-public demotion, the consistency statement, corrections annex. |
| [[mountable-filesystem-semantics]] | adopted product requirement + draft profile | Required target: project the same Ethereum/EVM EFS view read-only on Linux, macOS, and Windows through ordinary shell and graphical file-manager workflows. Defines a shared resolver contract plus host adapters; records portable-name, exact enumeration, `UNKNOWN`, pinned-handle, verified-read, xattr/EA, Plan 9, and later writable-mount seams as a track separate from Solana/substrate portability. |
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

## The joined KEL × authority × lens filesystem pass (2026-07-25)

Requirements-first, inversion-before-design: 2 foundations (use-case register + smart-account inversion) → 4 design lanes (authority model, filesystem core, local mode, large files) → 2 red teams → binding critic. **Zero FATAL findings; fifteen SERIOUS, all repaired.** Headlines: the two-grade authority hypothesis validated as an authorization-axis theorem (with the F-15 never-two-labels rule); the L1 pointer designed, judged, and shelved conditionally; the residual identity layer = R1–R6 with the home field parametric; one system-wide absence rule (four sources); FS-LENS/1 as the read-lens replacement seed; the snapshot/bundle ordinary-app mount profile; T1–T4 all reconciled explicitly. **The 2026-07-23 sequencing hold is liftable for the authority surface (P-1…P-10).**

| Doc | Tier | What it rules |
|---|---|---|
| [[joined-pass-synthesis]] | ruling record | The pass canon JR-1–JR-10, the binding D-ledger repairs, the 20-item kill list, seam dispositions, gaps + owed work. |
| [[owner-decision-inbox]] | **owner packet** | Rewritten: the revalidated P-1…P-23 packet in six tiers + E-track riders + held remainder. |
| [[multichain-dependency-map]] | requirements roll-up | What forces the L1 pointer (nothing at MUST grade), what depends on cross-chain, the ten local-only losses. |

Corpus: [2026-07-25-joined-fs-pass-corpus/](../../Reviews/2026-07-25-joined-fs-pass-corpus/) (critic.md is the binding consolidation); record: [2026-07-25-joined-fs-pass](../../Reviews/2026-07-25-joined-fs-pass.md).

## The lens/resolver pass (2026-07-28 — gap G-A of the joined pass)

Foundations (fresh technique research + the 18+1-row lens-consumer register) → 4 design lanes (on-chain core, object/taxonomy, profiles/composition, views/links) → 2 red teams → binding critic. **Held on architecture, broke on artifacts:** 63 red-team + 9 critic findings; of eight FATALs, seven CONFIRMED. Three unifying rulings close most of the field — **LR-1** (one packed contract-tier `PlanV1`, stored as content-derived immutable code — no CBOR on-chain, no trusted registry), **LR-2** (claim-conditional authority status), **LR-3** (verify above the winner — the claimant roster is a planning hint, never a correctness dependency). Headlines: the typed compiled-policy model survived full-family instantiation; the Lens/View/Roster/Plan/GATE naming family; EIP-7825 (live) turns wide sorted contract directories from "should not promise" into "cannot deliver"; the profile family (GATE/1, ADVISORY/1, DISCOVERY/1) completes the book FS-LENS/1 opened; one 6+1-axis read-result model; composition-honesty corrected before it calcified (CH-1 was false as written); the guest ladder + NS-1…NS-11 link-safety floor; seams 8 and 12 closed. The owner packet LP-1…LP-10 lands in [[owner-decision-inbox]]; **N2c/D-9/Q5 become askable, E6's structure becomes LP-4, Q3/Q4 stay held.**

| Doc | Tier | What it rules |
|---|---|---|
| [[lens-pass-synthesis]] | ruling record | The pass canon LN-1–LN-10, the LR-1/2/3 spine, the reconciliation ledger, the kill list, the LP-packet + held dispositions. |
| [[lens-spec]] | **replacement seed** | The successor routing spec for the reopened [[read-lens-spec]]: constitution + taxonomy, the three tiers, encoding, the contract tier + GATE, profiles, composition, the 6+1 result model, channels/privacy/recovery, Views/links/guest, scale, migration/conformance. |
| [[read-lens-spec]] | **replaced as entry point** | Historical; every section dispositioned in [lens critic §3.1](../../Reviews/2026-07-25-lens-pass-corpus/critic.md). Salvaged pieces survive re-typed; the flat model, grade ladder, and `?lenses=` links are superseded. |

Corpus: [2026-07-25-lens-pass-corpus/](../../Reviews/2026-07-25-lens-pass-corpus/) (critic.md is the binding consolidation); record: [2026-07-25-lens-pass](../../Reviews/2026-07-25-lens-pass.md).

## Carried forward from earlier rounds (historical inputs)

| Doc | Status |
|---|---|
| [[fable-handoff-v2-tag-core]] | historical handoff; leanings now superseded by this set where they conflict |
| [[efs-substrate-decision]] | Historical investigation. Its EAS carrier proposal is superseded; only decisions specifically reaffirmed in newer owner rulings/requirements survive. |
| [[deterministic-ids]] | Reopened baseline. Chain-free/domain-separated ID goals survive, but EAS assumptions, full-width principal defects, literal grammar, and vectors require a coordinated native-kernel recut. |
| [[efs-v2-holistic-redesign]] / [[efs-v2-transition-plan]] | Historical umbrella/sequencing inputs. Mission guardrails may be re-adopted; old EAS, scope-closure, and freeze sequencing are not current authority. |

## Status

Everything is `#status/draft`. The set is **reconciliation-ready, not promotion-ready**. The joined KEL/authority × filesystem pass ran 2026-07-25 ([[joined-pass-synthesis]]) and the dedicated lens/resolver pass ran 2026-07-28 ([[lens-pass-synthesis]]); the owner inbox is reconciled and its full surface (authority P-1…P-10 + lens LP-1…LP-10 + product/projection Tiers 3–6) is answerable — **the 2026-07-23 sequencing hold is liftable across its whole surface**. Remaining sequence: the **coordinated envelope/kernel recut** (joined seams 1/2/4/5 + the D-ledger repairs + the lens pass's KERNEL-R obligations: lane labels H-1 now blocking, the H-2 authority-axis ABI, the joint E2 counter row), the **replacement-spec completion** ([[lens-spec]]'s owed chapters: AMBIENT/1, migration, the consolidated acceptance suite), the **measurement passes** (E1 + E2 with the new riders/inputs), then the constitution/support matrix and MVP contraction. The existing [[freeze-gates]] list is blocked and must be regenerated against the eventual final bytes. See [[owner-rulings]] and [[ethereum-first-efs-and-os#11. Research-to-MVP sequence]].
