# Lens-consumer register — every surface that consumes a lens or trust policy

**Lane:** LENS-CONSUMER REGISTER — dedicated EFS v2 lens/resolver pass (gap G-A of the 2026-07-25 joined pass, [../../Designs/efsv2/joined-pass-synthesis.md](../../Designs/efsv2/joined-pass-synthesis.md) §6)
**Question owned:** requirements before design — enumerate EVERY surface that consumes a lens/trust-policy across the corpus and product intent, so the design lanes build against real pressure; restate the honest scale model; inventory v1 code reality; draw the no-Graph line consumer-by-consumer; tag MUST/SHOULD/NICE and the anonymous-viewer floor
**Status:** requirements register — reconciliation input, not design, not freeze. Extends (does not duplicate) the joined-pass register [../2026-07-25-joined-fs-pass-corpus/use-cases.md](../2026-07-25-joined-fs-pass-corpus/use-cases.md); rows there are cited by R-code, rows here are new LC-codes.
**Primary base:** [../2026-07-11-efsv2-lens-architecture-and-scale-review.md](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) (the typed compiled-policy model — treated as the working architecture); [FS-LENS/1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) (settled chapter one — consumed, not reopened); [../../Designs/efsv2/read-lens-spec.md](../../Designs/efsv2/read-lens-spec.md) (reopened; salvage marked per item); [../../Designs/efsv2/owner-rulings.md](../../Designs/efsv2/owner-rulings.md) (binding).

#status/draft #kind/review #repo/planning #topic/efsv2 #topic/lenses #topic/requirements

---

## 0. How to read this file, and the three-tier frame every row is tagged with

Per the pass steer, every consumer row names the **execution tier** it needs:

- **T-CONTRACT** — on-chain, bounded gas, simple: a small ordered set of trusted principals + keyed resolution, revocation-aware, `PRIORITY_FIRST_PRESENT`, deny-capable; the trust list itself on-chain-representable so a contract can read it. This is the tier designed FIRST; everything richer layers on it.
- **T-CLIENT** — off-chain, resolved by the web client/SDK from its own node/snapshots + the mandatory on-chain index bundle ([../../Designs/efsv2/onchain-completeness.md](../../Designs/efsv2/onchain-completeness.md) §6 The Line), NEVER The Graph. Composition, full six-part tuples, bigger sets, deny/whiteout live here.
- **T-ENHANCED** — The Graph or equivalent allowed; NO base feature may require it; every enhanced-only feature is named as such in §4.

A read result is the **six-part tuple** everywhere below: *authorization / existence bound / freshness-basis / availability / slot state / completeness* (JR-1, F-15 binding: never two labels). Authorization grades — `AUTHORITY-ADMITTED` at ordinal N / `PORTABLE-EVIDENCE`, plus the `EVIDENCE-ORDERED@N` dating label — are **fixed inputs** from the joined pass; every row here consumes them verbatim and none computes them (the FS-LENS/1 H-2 posture, generalized: the lens is topology-blind).

**Naming used below** (per the pass seeds): **Lens** = the end-user read-view. **GATE** = the contract-gating / installer / app-store-trust function (a purpose-locked compiled policy; never the user's social lens). **View** = a saved, linkable lens + location + presentation config (the five-part identity of [filesystem-core §2.2](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md) plus presentation). **Roster** = this register's working name for the underlying shared trust-list primitive — the small ordered principal set (with tiers/effects) that T-CONTRACT can read directly and T-CLIENT compiles into richer policy. Naming is a design-lane decision; §6 records which consumers put pressure on each name.

Method note: every row pairs "what it needs" with "what breaks if mis-served." Every substantive claim is tagged VERIFIED (checked against a named file this pass) or PLAUSIBLE (constructed; needs vectors). §7 names what could not be verified.

---

## 1. The consumer register

### 1.1 Master table

Grades: **MUST** (v2 fails its mission or an adopted ruling without it) / **SHOULD** (real product need, deferrable without breaking a MUST journey) / **NICE** (design-so-possible). **Guest** = the anonymous/no-account viewer requirement touches this row (§5.2).

| ID | Consuming surface | Tier | Grade | Guest |
|---|---|---|---|---|
| LC-1 | FS browse — read-only mount (lookup/readdir/getattr/open) | T-CLIENT over T-CONTRACT state | MUST (adopted ruling) | YES |
| LC-2 | FS browse — `web3://` gateway page serving | T-CLIENT (operator-run client) | MUST | YES — the primary guest surface |
| LC-3 | FS browse — SDK `resolve()` for apps | T-CLIENT | MUST | YES (guest-mode apps) |
| LC-4 | Directory enumeration (two-phase candidates + point resolution) | T-CONTRACT (raw pages + points) + T-CLIENT (materialize/sort) | MUST | YES |
| LC-5 | Point property / metadata reads (xattr projection, value views, tokenURI-class) | T-CONTRACT (Level-3 point read) + T-CLIENT | MUST | YES |
| LC-6 | Package/update install GATE (OS updates, app installs, archive launch preflight) | T-CLIENT installer + T-CONTRACT for on-chain gates | MUST | partially (launch preflight of public content) |
| LC-7 | Moderation/advisory application (deny feeds, labels → actions) | T-CLIENT; deny point-reads are T-CONTRACT-shaped | MUST | YES (labels rendered; actions = client defaults) |
| LC-8 | Discovery / search / follows (candidates only) | T-CLIENT over T-CONTRACT discovery index; ranked/full-text T-ENHANCED | MUST (basic) / T-ENHANCED (ranked) | YES (labeled untrusted view) |
| LC-9 | Contract gates — registries, counters, vote/poll closers, app-store gates, escrow (detailed §1.2) | **T-CONTRACT** | MUST | n/a (contracts have no viewer) |
| LC-10 | Collaboration reads (revision DAGs + curation; proposals; merge views) | T-CLIENT | SHOULD (MUST for the G-DOCS class) | YES (read side) |
| LC-11 | Agent/AI context selection (trusted-context lens; taint; receipts) | T-CLIENT | SHOULD → MUST for the agent product | no |
| LC-12 | Anonymous/guest viewer (deep links; two-mode apps) | T-CLIENT | MUST (owner product requirement 2026-07-28) | IS the row |
| LC-13 | Citations / receipts (exact-citation rendering; ViewReceipt reproduction) | T-CLIENT verification over T-CONTRACT evidence | MUST | YES |
| LC-14 | Cross-realm merged views (chains-as-drives union) | T-CLIENT only | NICE (design-so-possible, ruling 2) | YES (read side) |
| LC-15 | Mirror/byte transport selection (content-then-transport; best-mirror view) | T-CONTRACT view + T-CLIENT policy | MUST (adopted item C) | YES |
| LC-16 | Channel subscription & update acceptance (lens channels; curator updates) | T-CLIENT + T-CONTRACT `channelAnchorSummary` state | MUST | no (subscription implies a persisted policy) |
| LC-17 | Cache invalidation / live-follow (dependency-head vector consumer) | T-CLIENT (needs kernel delta ABI, FS gap G-6) | SHOULD | indirectly |
| LC-18 | Social feeds / counts / curation marketplaces (future consumer — noted, not designed) | counts T-CONTRACT (ruled); ranking T-ENHANCED | noted per G-SOC | YES (public feeds) |
| LC-B1 | *Boundary row:* estate/self-enumeration (`ls ~`, recovery walk) | T-CONTRACT index | MUST — but **not a lens consumer** | no |

LC-B1 is listed to fence it: "everything I authored, from key alone" is `EXACT(self)` over the author-keyed index ([../../Designs/efsv2/onchain-completeness.md](../../Designs/efsv2/onchain-completeness.md) R8, E4) — no trust policy is consulted, and no lens-lane design may add one to it. (VERIFIED against filesystem-core §4.2 and the E4 framing.)

### 1.2 Row detail

Format per row: needs → combiner vocabulary → scale envelope (lens entries × items per read × advisory sources) → six-part-tuple needs → mis-served failure.

#### LC-1 — FS browse: the read-only mount

- **Needs:** exactly FS-LENS/1 ([filesystem-core §1](../2026-07-25-joined-fs-pass-corpus/filesystem-core.md)) — consumed, not reopened. One-basis invariant (FSP-BASIS-1), four-source PROVEN-ABSENT (FSP-ABSENT-1 + D-12 fourth source), WHITEOUT as evidence, per-rule relinquish declarations, five-part View identity as the mount descriptor.
- **Combiners:** `PRIORITY_FIRST_PRESENT` (names), `EXACT(owner)` (default point baseline), `UNION_SET` (candidate phase), `ADVISORY(actions)`, WHITEOUT evidence. Vocabulary CLOSED — a lens exceeding it fails to mount (§1.2 of FS-LENS/1). VERIFIED.
- **Scale:** 1–55 entries × 1 position per `lookup` / up to ~10k items per `readdir` walk × 0–8 advisory sources per rule. History-amplification budgets are an index-shape obligation (R-QC8), not daemon heroics. VERIFIED.
- **Tuple:** all six consumed strictly. Existence bound is the sharpest: only the four PROVEN-ABSENT sources may map to `ENOENT`; `UNKNOWN` → transient error, never not-found (R-HP2). Authorization axis displayed verbatim from the authority lane; never computed here. Completeness: closure required for the ordinary-app profile (P-16a).
- **Mis-served:** silent false absence (`test -e` lies), ghost entries between pages, cross-lens cache contamination, a mount that cannot list a live-small/history-large folder within budget. Each has a named falsification test in [../../Designs/efsv2/mountable-filesystem-semantics.md](../../Designs/efsv2/mountable-filesystem-semantics.md) §12. VERIFIED.

#### LC-2 — FS browse: `web3://` gateway

- **Needs:** the URL grammar and classifier of [read-lens-spec §6](../../Designs/efsv2/read-lens-spec.md) (salvage: explicit-prefix escape hatch, classification precedence, citation form) with the link forms re-cut per the review: **ambient / sender-hinted / exact-citation** ([review §4.6](../2026-07-11-efsv2-lens-architecture-and-scale-review.md)); full `?lenses=`/`?deny=` principal arrays in routine links are dead (privacy leak + policy-in-URL). A sender-hinted lens is a *suggestion the recipient must be able to decline*; a gateway must never treat a URL lens parameter as authentication (risk-bearer ruling). VERIFIED.
- **Combiners:** same closed FS vocabulary as LC-1; plus the ambient default when no lens is present — the owner baseline `EXACT(container owner)` + labeled discovery (review §12.1), since genesis ships no protocol default lens (P13, ops L1).
- **Scale:** the gateway serves arbitrary strangers: per-request policy is tiny (owner baseline or one hinted View ref); the operator's own serving policy is disclosed (LC1 conformance rule carried).
- **Tuple:** as LC-1; plus gateway-specific honesty: a hosted gateway is an RPC-trust-graded observer — its pages must carry the basis and grade, and the strict guest path (LC-12) must not claim proofs it does not perform.
- **Mis-served:** the caller-supplied-gate-policy attack (a link that carries the lens that authorizes its own content); leak of a viewer's personal policy into operator logs via URL params; a gateway that renders `UNKNOWN` as 404. PLAUSIBLE (attack shapes constructed from review §15 rows).

#### LC-3 — FS browse: SDK `resolve()` for applications

- **Needs:** the deterministic resolution function + receipt (`resolve(EvidenceGraph, BasisVector, EffectiveLens, Context, …) → ResolvedView`) as the one API every app consumes; verification order lens → signature → bytes (RR9 salvage); machine-readable provenance tuples in output ([client-os P3 item 5](../../Designs/efsv2/client-os-pressure-report.md)) — apps and agents need data, not rendered enums. VERIFIED.
- **Combiners:** full T-CLIENT vocabulary (all seven typed combiners by purpose; FS profile for FS purposes).
- **Scale:** 15–55 entries design center; 256 compiled-principal portable ceiling (E6 pending). Per-read budgets (`maxProbes`/`scanLimit`/`maxResults`) independent of policy size.
- **Tuple:** all six, programmatically; `INCOMPLETE_BUDGET` with continuation is a first-class return, never coerced to absence.
- **Mis-served:** apps re-implement resolution divergently (the pre-spec status quo the read-lens-spec §Problem describes); or the SDK silently truncates a policy — the v1 parser behavior (§3) reborn.

#### LC-4 — Directory enumeration

- **Needs:** the two-operation split (union candidates, then per-position combiner — review §2.4); fair per-author scheduling + cursors; winner/conflict-carrier dedup allowed; **no stateless globally-sorted/top-N page claim** (D-9 choice A assumed, held — this register is another consumer of it, evidence *for*, not a re-ask). VERIFIED.
- **Combiners:** `UNION_SET` (candidates, dedup = exact semantic position) + the position's exclusive combiner + `ADVISORY`.
- **Scale:** K (≤55) author streams × M items; adversarial overlap honestly `K × M` scanned candidates, resumable. The isolated benchmark's shape evidence: naive 50×64 ≈ tens-of-millions gas class; roster-plan sparse point reads ≈ 1.4M class (review §9.2 — shape only, not kernel numbers). VERIFIED as shape / could-not-verify as cost (E2 open).
- **Tuple:** completeness is the load-bearing member: every page says complete-at-basis / partial-with-cursor / budget-incomplete; a sorted listing exists only after exhaustion at the pinned basis.
- **Mis-served:** a partial page presented as a sorted prefix (phantom ordering); one flooded author starving the rest; budget exhaustion read as an empty folder — each is a §15-review threat row with a named defense.

#### LC-5 — Point property reads

- **Needs:** exclusive `(node, propertyKey)` slots via `EXACT(owner)` default or explicit `PRIORITY_FIRST_PRESENT`; property enumeration rides child-candidate machinery restricted to KIND_PROPERTY (filesystem-core §4.3 — no new index). VERIFIED.
- **Combiners:** `EXACT`, `PRIORITY_FIRST_PRESENT`.
- **Scale:** usually 1 principal (owner); ≤55 for overlaid metadata; 1 position per read. This is the Level-3-composable hot path (slotHead + bodies-in-state).
- **Tuple:** slot state + freshness dominate (`expiresAt` evaluation under the named clock); `STALE` stops GATE consumption (context split salvage, RR5).
- **Mis-served:** a contract or app reading a `STALE`/`UNKNOWN-currency` value as fresh; assembling one "file generation" from claims at different bases (the coherent-tuple rule, filesystem-core §3.2).

#### LC-6 — Package/update install GATE

- **Needs:** the strict purpose-locked profile of review §14.3 (TUF-shaped): closed owner-pinned authority, `THRESHOLD(k,n)` for high-risk roles, `STOP_ON_FORMER_AUTHORITY` default, no discovery influence, no unknown fallback, rollback/freeze protection via monotone security floors, advisory deny consulted with `honorStale` defaulting on ([read-lens-spec §3.4 rule 4 salvage](../../Designs/efsv2/read-lens-spec.md)). Requires `AUTHORITY-ADMITTED` (R-AU3: the class that genuinely needs the strong grade; a stolen-key backdated "old stable release" is the canonical attack). Grade→executability must be uniform across clients (client-os P3 item 4: LIVE/pinned runnable; STALE runnable-with-label; equivocation-class evidence never auto-run). VERIFIED.
- **Combiners:** `EXACT`, `THRESHOLD`, `PRIORITY_FIRST_PRESENT` over a closed set, `ADVISORY(reject)`.
- **Scale:** 1–10 publisher principals + a 2-of-3..5 committee + 2–8 advisory feeds; items = one release manifest + its closure per decision. Deliberately the smallest envelope in the register.
- **Tuple:** all six at the strictest grades: authorization = AUTHORITY-ADMITTED at ordinal; existence bound for "no newer/no revocation" = venue-state closure (checkpoint-grounded absence is dead — kill list); completeness = fail-closed on anything less.
- **Mis-served:** publisher lapse hands the name to a squatter (the `latest` dist-tag variant, read-lens-spec §9.B step 7 — the worked example survives re-typing); an advisory source's removal silently re-enabling malware; a caller-supplied gate policy. The playable archive's launch preflight (PAF-3/PAF-7) is this row at CLIENT tier: resolve exact manifest under the archive GATE at a pinned basis, verify before execution, curator advisories warn/block new launches while bytes remain. VERIFIED against [../../Designs/efsv2/playable-archive-requirements.md](../../Designs/efsv2/playable-archive-requirements.md).

#### LC-7 — Moderation/advisory application

- **Needs:** signed labels ≠ actions (labeler says what it observed; the risk bearer's policy maps to warn/hide/block/reject); subtract-after-resolve, never re-opening resolution (trust-inversion defense — read-lens-spec §3.4 rule 1 carried verbatim into FS-LENS/1); advisories graded before subtracting; revoked advisory = withdrawn; the un-deny is REVOKE. Advisory point reads are keyed `(definitionId, targetKind, targetId)` — a T-CONTRACT-shaped derivable point read, O(D × matchKeys), no enumeration. VERIFIED.
- **Combiners:** `ADVISORY(actions)` with committed action table.
- **Scale:** D = 0–8 sources per rule; ≤32 advisory principals across a whole policy is the realistic ceiling (RustSec/OSV-class feeds are institutions, not crowds — each aggregator is ONE principal, §2.3 exception class b).
- **Tuple:** availability matters here in the fail-safe direction: a GATE that cannot reach its deny feed within the freshness floor must not install (the deny-set freshness floor, [ops-doctrine P6 ask](../../Designs/efsv2/ops-doctrine.md)); an interactive view labels instead.
- **Mis-served:** labeler controls the action (universal censorship); deny hit falls through to a lower author (advisory-driven reselection — forbidden without a separately named combiner); advisory scan priced as D × 3 keys × M items nested scans instead of keyed point reads (review §8.4).

#### LC-8 — Discovery / search / follows

- **Needs:** discovery proposes, never disposes: DISCOVERY-flagged output, never entering slot resolution, never satisfying absence, never unlabeled next to resolved content ([read-lens-spec §7.2 carried](../../Designs/efsv2/read-lens-spec.md)); follows are discovery-class rules in the typed model (importClass = DISCOVERY_RULES, per-source budgets). VERIFIED.
- **Combiners:** `UNION_SET` + per-source budgets; no exclusive combiners.
- **Scale:** the one row where entries may legitimately exceed 55 — following 100+ sources for candidates is budget-bounded fan-out, not authority (each source costs its declared budget share; no per-position probing multiplies).
- **Tuple:** completeness = venue-relative enumeration honesty ("all admitted here", or `DISCOVERY(INDEXED)` with named indexer trust in the enhanced lane); counts never GATE-consumable.
- **Mis-served:** discovery output entering slot resolution (kill list); "nothing enumerated" read as proven absent; a trending rank presented as a trust fact.

#### LC-9 — Contract gates (the T-CONTRACT register — the concrete consumers)

This is the row the pass steer says to design FIRST. The named concrete consumers, from the corpus:

| Gate consumer | Shape | Trust-set size | What it reads | Source |
|---|---|---|---|---|
| **Registry/membership gates** (folder-gated mint; curator LIST membership) | closed author set + point read of exact LIST/PIN slot at call basis | 1–5 | slotHead + LIST membership O(1) | G-DAPP-1, [use-cases §2.12](../2026-07-25-joined-fs-pass-corpus/use-cases.md) |
| **Counter/threshold gates** ("≥N citations"; quorum reached) | revocation-aware live count (ruled "pay for it") read against a **closed author set** — raw counts are attacker-inflatable and never gate alone | 1–16 authors whose contributions count | revocation-aware count + per-author checks | R-QC5; [owner-rulings 2026-07-15 item E](../../Designs/efsv2/owner-rulings.md) |
| **Vote/poll closers** (folder voting: 2-of-3 moderated daily poll) | closed moderator Roster + deterministic close rule; close time wants `admittedAt` (E3 consumer) | 2-of-3..5 moderators; voters unbounded but votes are point-checked records, not lens entries | slot reads per vote + Roster + admission ordinals | UC-V, use-cases §1.7 |
| **App-store / archive install gates** | the GATE function proper: owner-pinned compiled policy hash; committee `THRESHOLD`; advisory reject; challenge window for anything from an untrusted author | 3–16 (publisher + committee + advisories) | owner-stored gate plan or slice + proof against `sliceCommitment` (review §4.3) | LC-6's on-chain half; G-PKG |
| **tokenURI / metadata consumers** | `EXACT(owner)` point reads; no policy resolution at all beyond the owner Roster of one | 1 | slotHead + state bodies + best-mirror PIN | UC-A6, G-DAPP-2 |
| **Escrow / deliverable acceptance** | `contentHash → DATA` keyed lookup + acceptance claim + challenge window (the ruled pattern for untrusted authors) | 2 (payer, payee) + window | keyed index + slot reads | G-DAPP-3 |

Requirements this row fixes for the design lanes (each VERIFIED against the cited ruling):

1. **The trust list is on-chain state a contract can read** — either stored by the gate owner or supplied with a membership/order proof against a committed root; a caller-supplied rank table without that binding is unauthenticated (review §4.3). This is the Roster primitive's T-CONTRACT existence requirement.
2. **Gate policy is pinned by the resource/gate owner**, immutable or governed; fail-closed on incomplete evidence; rollback-protected; never caller-supplied (review §10.1; risk-bearer ruling).
3. **No on-chain collision/duplicity bit; no lens-walking in transactions.** Gates use closed trusted author sets or challenge windows — the adopted item-F wording, consumed as-is. Contracts do run *bounded compiled* point checks (Level 3); they never recursively dereference mutable social lists.
4. **Budget exhaustion, deny hits, and whiteouts never ground absence** on-chain any more than off; a gate that cannot decide reverts.
5. **The v1 SystemAccount precedent is a negative precedent.** v1 shipped a system author and default-lens ordering (`[containerAuthor, viewer, system, …]` — review §16 ledger row; v2 genesis explicitly retires SystemAccount, [codex-kernel genesis note] VERIFIED by grep this pass) — v2 contract gates must never inherit an ambient system principal; any system-metadata trust is a separate narrow labeled plane (review §12.1).

- **Tuple:** authorization = AUTHORITY-ADMITTED only (a gate consuming PORTABLE-EVIDENCE for authorization is a consumer bug — R-CR3 SDK templates refuse to write it); slot state + existence bound from same-venue state at call basis; freshness via `expiresAt` + venue clock only (no wall clock, no author TID).
- **Scale:** design center 1–16 principals; ceiling ~55 where the 105,000-gas cold-probe floor for 50 principals (EIP-2929, review §9.1 VERIFIED as computation) still fits an ordinary transaction; anything wider is a materialized/proven snapshot by construction (review Level 3).
- **Mis-served:** the wrong default here is civilizational for EFS — if gates are hard, apps fall back to The Graph or to trusted servers, and the mission dies at its strongest claim. If gates are too permissive (caller-supplied policy, count-gating without closed sets), self-authorization and Sybil inflation follow.

#### LC-10 — Collaboration reads

- **Needs:** revision-DAG + curation model (held Q3, A-arm assumed as the corpus does); proposals enumerate via `UNION_SET` into parallel containers; editor group = org threshold (KEL org control); `MERGE(strategyId)` exists in the full model but is outside the FS profile — a merge view is a distinct purpose with committed algebra (review §14.6). VERIFIED.
- **Combiners:** `UNION_SET`, `PRIORITY_FIRST_PRESENT` (current-head), `THRESHOLD` (editor ratification), `MERGE` (only under its own purpose).
- **Scale:** 2–20 collaborator principals × document-history items; proposals unbounded but discovery-class.
- **Tuple:** slot state + completeness (an editor view must know it saw every proposal at basis — R-QC7); `SUPERSEDED` rendering.
- **Mis-served:** cross-author latest-wins smuggled in (kill list — author clocks are not comparable); a merge combiner on a name slot making two hosts disagree (FS-LENS/1 §1.2's own break case).

#### LC-11 — Agent/AI context selection

- **Needs:** review §14.7 consumed as requirements: a lens selects trusted context/evidence; capability handles are separate; retrieved untrusted content stays tainted; a cited source never becomes execution authority; consequential outputs attach a ViewReceipt. Plus G-AGENT-1's grant coupling (scoped, expiring KEL grants — the authority lane's surface, not this pass's). The resolver output must be machine-consumable provenance tuples (LC-3). VERIFIED.
- **Combiners:** full T-CLIENT vocabulary; agents are ordinary readers with stricter receipt discipline.
- **Scale:** as LC-3; plus agent-specific per-task sub-lenses (a task's source policy can be a narrow scoped import of the user's policy — attenuation, never widening).
- **Tuple:** authorization + freshness-basis + completeness are what an agent must thread into its own claims ("per source X at basis B, grade G").
- **Mis-served:** prompt-injection-shaped: a hostile record's *content* instructs the agent — defense is lens-scoped source policy + capability confinement, never kernel filtering (use-cases G-AGENT-1 break, carried). An agent that silently widens its context lens is the confused deputy of this register.

#### LC-12 — The anonymous/guest viewer

- **Needs** (VERIFIED against [../../Ideas.md](../../Ideas.md) "Instant guest deep links + two-mode applications", James 2026-07-28): a public file/folder/app link opens into the smallest useful viewer with **no account, wallet, authentication, or profile hydration**; only the minimum trustworthy link-classification + data-resolution + verification slice on the critical path; third-party apps must ship a guest mode; promotion to authenticated mode preserves route/state without silently granting capabilities. Terminology fixed: guest/unauthenticated ≠ anonymity (reads still leak interest/timing to endpoints).
- **What this means for the lens design (the requirement this lane adds):** a guest has **no personal policy and must never need one**. The guest read path must be complete under: (a) the **ambient owner baseline** — `EXACT(container owner)` + address-container defaults (review §12.1); (b) **deliberately published starter/curator Views** the link or client names openly (seam 12: starter ≠ personal; LC2 conformance: shipped defaults are published, forkable EFS objects); (c) **sender-hinted Views** that the guest UI can decline into ambient. No protocol default lens exists to lean on (P13) — so the guest path is the strongest consumer of the *starter-policy publication* design and of link-form ergonomics (a bare path must render something honest and useful).
- **Tier/scale:** T-CLIENT; tiny policies (1–5 principals: owner + maybe one named curator View).
- **Tuple:** everything renders, honestly labeled; guest mode consumes no GATE grades and performs no writes; a hosted-RPC guest read is RPC-trust-graded and says so (this is the diagnostic-surface half of P-16, and the guest product must not overclaim proof).
- **Mis-served:** if guest browsing requires policy setup, the hyperlink product dies and EFS loses the non-crypto on-ramp; if the guest path silently adopts a link's hinted lens as authority, every phishing shape in review §15 opens through the front door. PLAUSIBLE (product reasoning; the Ideas entry is the requirement, the failure modes are constructed).
- **Rows a guest must get** (§5.2 for the full list): LC-1/2/3/4/5 (browse, enumerate, point reads), LC-7 (labels displayed under client-default actions), LC-8 (labeled discovery), LC-13 (open a citation and verify it), LC-15 (byte fetch), the playable-archive browse/preflight/play journey, and LC-14's side-by-side (not merged) multi-drive reading.

#### LC-13 — Citations and receipts

- **Needs:** the exact-citation link form (locatable object/claim + effective/compilation/receipt refs + basis — review §4.6); ViewReceipt reproduction (review §4.5, re-based on the six-part tuple); the century caveat: a digest without durably available evidence is an audit promise, not reproduction. Consumers: courts (G-LEGAL-1), science (G-SCI-2), poll verifiers (UC-V), agents (LC-11), and every "why do we see different things" support conversation. VERIFIED.
- **Combiners:** none of its own — a citation *pins* someone else's compiled policy; rendering a foreign-policy citation must be visibly foreign (review §13.2).
- **Scale:** 1 claim/view per citation; receipt evidence bundles bounded by the cited view.
- **Tuple:** all six, frozen at the receipt's basis; freshness deliberately historical (`AS-OF` forever).
- **Mis-served:** citation silently re-resolved under the recipient's live lens (the bytes change under the quote); receipt without witness availability decades later; membership privacy broken by unsalted effective-ID dictionary attacks when a private person cites (review §11.2 — deliberate-disclosure rule).

#### LC-14 — Cross-realm merged views

- **Needs:** filesystem-core §2.3–2.4 consumed: side-by-side drives are the product-normal case and need zero machinery; a *merged* view is a client-side FS-LENS/1 policy whose tiers are (principal, realm) pairs with mandatory realm labels; merged `ABSENT_PROVEN` = proven on every member realm (expensive, else degrade to `ALLOW_GRADED` and say so); one principal's authoritative realm is the held P-5 surface — realm labels either way. VERIFIED.
- **Combiners:** the FS set with realm-qualified tiers; no new vocabulary.
- **Scale:** entries × realms (a 20-principal lens over 3 realms = 60 tier rows — the one legitimate multiplier past 55, still bounded and client-side).
- **Mis-served:** an unlabeled merged view claiming one principal's global CURRENT (R-K11 violation); merged completeness silently downgraded.

#### LC-15 — Mirror/byte transport selection

- **Needs:** the two-stage rule (review §2.3): the lens resolves the trusted content commitment; a **separate transport policy** ranks carriers; any third-party carrier is acceptable only against the already-trusted hash; a mirror outage never promotes a lower content author. The bounded on-chain best-mirror view is restored by ruling (item C, zero new state). VERIFIED.
- **Combiners:** none — transport policy is deliberately NOT a lens; this row exists to keep it out (content authority ≠ transport authority, human-overview §2.5).
- **Scale:** 10–50 mirrors per DATA (R-BA2 cardinality).
- **Tuple:** availability axis is this row's product (`BYTES-UNAVAILABLE`/`BYTES-PARTIAL(k/n)` distinguishable from absence).
- **Mis-served:** availability rewriting the content winner; a fast hostile mirror serving unverified bytes (per-range verification is the defense).

#### LC-16 — Channel subscription & update acceptance

- **Needs:** the channel protocol of review §4.4 **re-based on the seam-8 ruling direction**: a principal-owned lens channel REUSES KEL control and recovery ([kel §5/§7 shapes](../../Designs/efsv2/kel.md) consumed), keeping only lens-specific generation/fork/tombstone/rollback state — no second guardian root, no channel-local recovery verifier. The bounded `channelAnchorSummary` state (human-overview seam 16 item) is the T-CONTRACT piece. Update ceremony = semantic diffs by role (review §5.4/§13.4): removals are NOT automatically safe (removing rank 1 exposes rank 2 — the polarity correction that kills read-lens-spec §4.5's "live-follow removals" default). Updates land only at generation boundaries (filesystem-core §6.2). VERIFIED.
- **Combiners:** n/a (channel state machine + acceptance policy).
- **Scale:** a user subscribes to 1–20 channels; each channel head is one bounded anchor read; `CHANNEL_CONTESTED` is sticky and stops following.
- **Mis-served:** an equivocating curator serving different heads to different subscribers (detected via the anchor's admitted-state-set, not prevented); a silent auto-adopt that changes what a user trusts; rollback to an older revision the security floor should refuse.

#### LC-17 — Cache invalidation / live-follow

- **Needs:** the complete dependency-head vector (review §15.1, adopted as the FS cache law): venue basis, kernel codehash, `EffectiveLensId` + acceptance floor, per-author view-mutation versions **including revocations**, KEL/delegation versions, advisory versions, next expiry boundary. `max(order)` and claim counts are unsound revision tokens. Blocked on the kernel's view-mutation/delta ABI (FS gap G-6); until then TTL + spine polling or full re-pin, both labeled. VERIFIED.
- **Mis-served:** a cache serving a revoked winner because no new content claim arrived; cross-generation reuse without the vector — the truth bug class.

#### LC-18 — Social feeds / counts / curation marketplaces (future consumer — noted per G-SOC, not designed)

What a later social layer will ask of the lens system, recorded so no design forecloses it: admission-ordered feed reads (venue order, never claimed TID); revocation-aware live counts (T-CONTRACT, ruled); moderation/curation Views at 50–256 principals (E6); reputation/trending strictly T-ENHANCED and outside kernel semantics (review §12.4 — Sybil economics belong to applications, which publish *resulting explicit policies*); curation-bribery disclosure in lens manifests (ops-doctrine amendment 9). No register row exists solely for social; where social would be the only forcer, the feature is marked deferred. VERIFIED.

---

## 2. The honest scale model, restated as requirements

### 2.1 The two conflations, fixed in requirement form

**SCALE-1 (keys are not principals).** A lens entry names a stable KEL PRINCIPAL; device, app, and session keys enter only as delegation evidence *under* an entry's principal (kel §7 grants; review §3.1) and never occupy entries of their own. Every resolved result retains (principal, actual signer, delegation path). *Requirement:* the entry type in every tier is the principal word; a compiled policy containing a bare actor key is invalid. — James's original 2026-07-10 sizing ("~12 own keys + ~40 friends = 50+ attesters", [owner-rulings](../../Designs/efsv2/owner-rulings.md)) re-bases to **~41–45 principals**: the 12 own keys collapse to 1 (or a few personas); the 40 friends stay 40. The fear was real; the arithmetic was keys-vs-principals conflation. VERIFIED.

**SCALE-2 (base lens ≠ curation contract).** "Load this folder from hundreds of curators" is not a base-lens read; it is a bespoke curation application that people write through — a contract or publisher that ingests many contributors under its own admission rules and **publishes a resulting explicit policy or materialized list as ONE principal/View**. *Requirement:* the base lens model's design center, budgets, benchmarks, and UI are sized for §2.2's envelope; the register's over-55 demand classes each name their mechanism (§2.3) instead of inflating the base model. Web-of-trust / friends-of-friends is OUT of the base model; the only future-safe hook permitted is the already-typed import mechanism (a friend's *published* View can be imported as a pinned, scoped, depth-1 import — which is subscription to an explicit object, not transitive trust). Watch: any design text that lets `ALLOW_NESTED` depth default above 1 for authority imports is this conflation creeping back. PLAUSIBLE (requirement form constructed; the review's import machinery supports it).

### 2.2 Where 15–55 comes from, per consumer

| Consumer | Typical entries | Composition |
|---|---|---|
| LC-1/2/3 browse (personal) | 5–45 | self + co-owners/family/team (1–10) + curators (3–20) + friends-for-discovery (10–30, discovery-class) + 3–5 system/app-publisher principals in their own labeled plane |
| LC-4 enumeration | same as browse | enumeration fan-out is per-author budgeted, not per-entry multiplied |
| LC-5 point reads | 1–10 | owner baseline; overlays are deliberate |
| LC-6 install GATE | 3–16 | publisher(s) + committee + advisories — small by design |
| LC-7 advisory | 2–8 per rule; ≤32 per policy | institutions/aggregators, each one principal |
| LC-9 contract gates | 1–16 | closed sets; 55 is the far ceiling, not the target |
| LC-8 discovery | may exceed 55 | budgeted candidates, no authority — the legitimate wide row |
| LC-14 merged views | entries × realms | the legitimate multiplier; still client-side |

So: **10–50 trusted principals + 3–5 system principals = 15–55 entries** is the design center for every authority-bearing consumer, and *no authority-bearing consumer in the corpus needs more*. VERIFIED against the register rows above; the sizing rationale per row is PLAUSIBLE (constructed, benchmark-gated by E6).

### 2.3 What breaks past 55, stated plainly

1. **T-CONTRACT composability breaks first.** 50 cold slot probes ≈ 105k gas *floor* per position before overhead (VERIFIED computation, review §9.1); a 55-entry direct-probe gate is already a heavyweight call; past ~64 entries per position, transaction-native gates stop being sane and must move to owner-stored plans over smaller sets, roster plans on sparse positions, or proofs against a committed root. The EIP-7825 16.7M cap makes wide directories transaction-impossible long before entries matter (64 items × 50 principals ≈ 6.7M floor).
2. **Interactive latency breaks second.** Per-position worst case scales with K when rosters are dense; a 100+-entry lens over a hot directory is an indexer-class workload by the old spec's own admission (read-lens-spec §3.1 cost note) — in v2 terms: T-CLIENT with materialized snapshots, or T-ENHANCED.
3. **Human legibility breaks third and hardest.** Update-ceremony diffs, "why this?" explanations, and priority reasoning over 100+ authority entries exceed what a person audits; policy stops being the user's deliberate trust statement and becomes an imported blob — which is SCALE-2's conflation in UI form.
4. **What does NOT break:** compilation and the client resolver — the 256-principal portable profile (E6 pending) remains the right *compile-time* ceiling so imports/diamonds have headroom; per-read budgets keep any single read bounded regardless of policy size. Limits fail typed; nothing truncates.

### 2.4 The exception classes that legitimately exceed 55, and the mechanism serving each

| Exception class | Example | Serving mechanism (NOT base-lens growth) |
|---|---|---|
| Community curation at 100s–1000s of contributors | fanfic archive tagging; museum crowd-annotation | **bespoke curation contract/app** with its own admission (stake, review, quotas), publishing one explicit policy/LIST; consumers trust the publisher principal |
| Many-labeler moderation ecosystems | OSV+vendors+community scanners | **aggregator feeds** — each aggregator is one advisory principal; disagreement between aggregators is a 2–8-entry policy question |
| Open popularity/reputation/trending | app-store charts, "most-cited" | **T-ENHANCED applications**; results may be *republished* as an explicit signed policy (speech, review §12.3), never kernel semantics |
| Wide-follow discovery | following 500 people for candidates | discovery-class rules with per-source budgets — allowed today, authority-free |
| Hot-position claimant floods | 100k outsiders claim one name | not lens entries at all — the venue **claimant roster** machinery absorbs it (review §7.1B); the lens still has ≤55 entries |
| Cross-realm unions | 20 principals × 5 realms | realm-qualified tier rows (LC-14), client-side, labeled |
| A DAO of 300 voting members | governance votes | votes are **records point-checked by a closed closer Roster** (LC-9 poll shape); the 300 members are data, not lens entries |

VERIFIED that each mechanism exists in the corpus; the mapping is this lane's synthesis (PLAUSIBLE).

---

## 3. v1 code reality inventory (from the 2026-07-11 review's ledger)

Quotes verified against [../2026-07-11-efsv2-lens-architecture-and-scale-review.md](../2026-07-11-efsv2-lens-architecture-and-scale-review.md) §16/§20 this pass. **Could not verify against v1 Solidity file:line directly this pass** — the review is the evidentiary intermediary; a contracts-side spot-check belongs to the migration workstream.

| # | v1 reality | Review's words (§16 ledger) | Migration obligation (review §20 Phase 4, binding on the design lanes) |
|---|---|---|---|
| V1-1 | Router `MAX_LENSES = 20` with silent truncation | "conflicts with router `MAX_LENSES=20` silent truncation" | "Import every v1 ordered `?lenses=` array as one explicit `PRIORITY_FIRST_PRESENT` source revision. Preserve order exactly and flag any tail previously lost to `MAX_LENSES=20` rather than guessing intent." Silent truncation is forbidden everywhere in v2 (freeze item 18.1.8); the cap itself is retired, replaced by compiled profiles + per-call budgets that **fail typed on excess**. |
| V1-2 | `EFSFileView MAX_ATTESTERS_PER_QUERY = 20` (independent revert + address-typed ABI) | "`EFSFileView`'s independent `MAX_ATTESTERS_PER_QUERY=20` reverts/address ABI" | "Migrate both router and `EFSFileView` limits/ABIs; the latter independently rejects more than 20 attesters" — plus the ABI moves from 20-byte addresses to full `bytes32` principals (seam 1; no 160-bit truncation anywhere). |
| V1-3 | Exclusion-definition cap = 8 | "exclusion definitions are separately capped at 8" | Deny arrays split into **advisory sources + user action mapping** (Phase 4 step 6); the 8-cap becomes a per-rule advisory budget in the typed model, benchmark-set, failing typed rather than silently capping. |
| V1-4 | ADR-0044 whole-LIST waterfall | "first lens with any entries replaces the entire list, unlike per-element union/priority" | "Preserve ADR-0044's whole-LIST waterfall only under an explicit legacy combiner; converting to elementwise union/priority requires a semantic diff and consent." I.e. a named legacy combiner survives for migrated dataset-curation lists; nothing else inherits waterfall semantics; vectors required. |
| V1-5 | SystemAccount + deployer default-lens ordering (`[containerAuthor, viewer, system, …]`) | "current holistic/read-lens defaults … plus old v1 priority ADRs — conflicts with the recommended exact owner baseline and no universal content tail" | "Do not auto-append old/current system or deployer defaults; offer a labeled migration choice and keep system-metadata trust separate." Genesis ships no default lens (P13); v2 genesis retires SystemAccount (codex-kernel, VERIFIED by grep). |

Also carried from the same ledger as standing migration duties on this register's consumers: v1's ordered-`bytes32[]` links (`?lenses=`) become ambient/hinted/citation forms (LC-2); v1's `deny=` arrays become LC-7 advisory subscriptions; users are encouraged to group only cryptographically authorized rotation keys under stable identities (SCALE-1's migration face).

---

## 4. The no-Graph line, consumer-by-consumer

Rule restated (owner constraint, [onchain-completeness §0](../../Designs/efsv2/onchain-completeness.md)): all core functionality works on-chain; every off-chain deferral is explicit and signed. Below: each register row's enhanced-only slice, and **the exact sentence a fresh-L3 deployment (kernel + mandatory index bundle, no indexer, no Graph) must be able to say** about the row. Each sentence is this lane's normative deliverable — a conformance-test seed.

| Row | Enhanced-only slice | The fresh-L3 sentence |
|---|---|---|
| LC-1 mount | none | "Every mount operation — lookup, enumerate, stat, open, verify, honest absence — works here from chain state at own-node or snapshot grade; nothing about the ordinary drive needs an indexer." |
| LC-2 gateway | none for serving; gateway *operators* may cache via anything | "A gateway on this chain serves any public path, View, and citation from its own node; a second, independent gateway can prove it wrong." |
| LC-3 SDK | none | "The SDK resolves any compiled policy against this chain's state alone and emits receipts a stranger can re-verify." |
| LC-4 enumeration | globally sorted/top-N *contract* pages (not promised anywhere); "sort by popularity" | "Complete candidate pages and exact point winners come from chain state; the client sorts at a pinned basis; nothing here promises a contract a pre-sorted directory." |
| LC-5 point reads | none | "Any contract or client reads any current slot and property here in bounded gas." |
| LC-6 install GATE | none (advisory feeds are on-chain claims) | "An installer verifies a release, its committee approvals, its revocations, and its advisories from this chain alone — a package install never phones an indexer." |
| LC-7 advisory | cross-target advisory *analytics* ("all things this labeler ever flagged, ranked") | "Every deny decision is point reads against keyed advisory slots; enumeration of a labeler's full history is paged from the typed reverse index." |
| LC-8 discovery | ranked, full-text, trending, recommendations (adopted off-chain, item 15) | "Bounded candidate discovery works from the container-scoped index; ranked and full-text search are absent until someone runs an indexer, and no base feature notices." |
| LC-9 contract gates | none — by definition | "Every gate pattern EFS blesses — closed sets, thresholds, counts, challenge windows — executes on this chain in bounded gas with no external input." |
| LC-10 collaboration | none for reads; diff/blame *analytics* enhanced | "Revision history, current heads, and complete proposal sets are enumerable here; pretty diffs are a client concern." |
| LC-11 agents | semantic retrieval/embedding search | "An agent's trusted-context selection and its receipts verify against this chain; similarity search is an accelerator it must not need for correctness." |
| LC-12 guest | none | "A person with a link and no account reads everything public on this chain through any client or gateway at honestly labeled grades." |
| LC-13 citations | none | "Any citation minted here re-verifies here forever from state and the durability spine." |
| LC-14 merged views | none (client-side) | "Two drives from two chains mount side-by-side with zero shared machinery; merging them is a labeled client policy." |
| LC-15 transport | mirror *health analytics* | "Best-mirror selection is a bounded on-chain view over already-kept mirror facts; byte verification needs only the content commitment." |
| LC-16 channels | none | "A fresh subscriber bootstraps a channel's current head, epoch, and fork status from the bounded anchor summary at one basis — no history replay, no indexer." |
| LC-17 caches | none (delta ABI is kernel surface, G-6 pending) | "Cache correctness derives from chain state versions; an indexer can warm caches, never validate them." |
| LC-18 social (future) | ranking, trending, notification fan-in, reputation | "Feeds in admission order, revocation-aware counts, and curation Views work from chain state; anything ranked is an application running its own index." |

Two honest caveats the sentences depend on (VERIFIED): the LC-16 sentence requires the `channelAnchorSummary` state shape to survive the E2 bundle (human-overview seam 16); the LC-1/LC-4 budgets at century scale require the current-live/compaction decision (review §7.1G; FS §4.5 coupling) — under the weak "O(history) first bootstrap" arm the sentences stand but the *performance* promise must be renegotiated, not silently failed.

---

## 5. MUST / SHOULD / NICE and the guest floor

### 5.1 Tags

In the master table (§1.1). Summary: **MUST** — LC-1..9, LC-13, LC-15, LC-16, LC-12 (owner product requirement), LC-B1 (as a non-lens boundary). **SHOULD** — LC-10, LC-11, LC-17. **NICE** — LC-14. **Noted-not-designed** — LC-18. No row is graded on The Graph's presence.

### 5.2 The anonymous-viewer floor (which rows a no-account viewer must get)

A viewer with no account, arriving by hyperlink, must get — at full function, honestly graded, with zero setup:

1. **LC-2 gateway + LC-1/LC-3 browse** of any public path and View (ambient owner baseline; declinable sender hints).
2. **LC-4 enumeration + LC-5 point reads** — the whole read filesystem.
3. **LC-7 advisory display** under the client's published default action mapping (labels visible; guest cannot and need not configure actions).
4. **LC-8 labeled discovery** (the LC5-carried untrusted view).
5. **LC-13 citation opening + verification** — a guest can check a receipt; verification requires no identity.
6. **LC-15 byte fetch with verification** — including `BYTES-PARTIAL` honesty.
7. **The playable-archive guest journey** — browse → inspect → preflight → play (PAF-1/3/5), which composes LC-2/4/5/6-preflight/7/15.
8. **LC-14 side-by-side multi-drive reading** (not merged views).

Explicitly NOT in the guest floor: personal-policy composition and subscriptions (LC-16), GATE-authorized installs beyond sandboxed archive play, writes of any kind, agent authority (LC-11). Promotion from guest to authenticated preserves route/state and grants nothing silently (Ideas entry, verbatim requirement).

Design-lane consequence (this register's sharpest guest finding): **the guest path is the forcing function for seam 12** — because a guest has no personal policy, the entire first-contact experience runs on the owner baseline + *published* starter/curator Views + link grammar. If starter-policy publication, View naming, and ambient links are weak, the guest product is weak; no amount of personal-lens richness compensates. PLAUSIBLE (product synthesis).

---

## 6. Naming pressure from the consumers (input to the naming lanes)

- **Lens** stays the end-user word — LC-1/3/8's UI surfaces need one human word for "my view" (review ruling 1 carried).
- **GATE** — LC-6 and LC-9 need a name that *cannot* be confused with the social lens; every corpus accident ("contracts walk lenses") came from sharing the word. The register endorses GATE for the contract-gating/installer/app-store trust function.
- **View** (= saved lens + location + presentation config) — LC-2 links, LC-12 guest starter packs, LC-13 citations, and LC-14 merged trees all pass around exactly this object; the five-part identity plus presentation config wants one noun.
- **Roster** (register's seed for the shared trust-list primitive) — LC-9 needs it on-chain-readable; LC-6 needs it inside compiled GATEs; LC-16 needs channels to publish updates to it; SCALE-1 needs its entry type to be principals. One primitive, four consumers — it should be named once, not per surface.

---

## 7. Confidence

**VERIFIED (read directly this pass):** the full 2026-07-11 lens review (typed model, combiners, channel protocol, index shapes §7.1, benchmark §9, threat table §15, coherence ledger §16, freeze package §18, migration §20, packet §21); read-lens-spec in full (salvage and dead parts per its banners); filesystem-core FS-LENS/1 §§1–8 + gaps + ledger; joined-pass-synthesis JR-1..10, D-ledger, kill list; owner-rulings all entries cited; owner-decision-inbox packet/held/settled lists; onchain-completeness Line + sign-off list; kel.md §§5–9 shapes; human-overview §7 seams; use-cases register rows and journeys cited by R-code; apps-cookbook verdicts and blessed patterns; playable-archive PAF rows + protocol boundary; ops-doctrine adopted core + amendments; client-os-pressure-report P3/P4/P8 asks; the Ideas.md guest requirement (2026-07-28); the 105k-gas floor as arithmetic (50 × 2100); SystemAccount retirement (grep of codex-kernel/holistic this pass).

**PLAUSIBLE (constructed here; the design lanes and vectors are the check):** the register's completeness (that these 18+1 rows are ALL consuming surfaces — the strongest falsifiable claim of this file; the critic should hunt for a 19th); every per-row scale envelope number; the §2.2 sizing table and §2.4 exception-mechanism mapping; the SCALE-2 requirement wording incl. the depth-1 import hook; the guest-floor list and the seam-12 forcing claim; every fresh-L3 sentence in §4 as *test seeds* (their truth is conditional on the mandatory bundle surviving E2 as ruled); the LC-2 gateway attack shapes.

**Could not verify:** any gas/cost number beyond the arithmetic floor (E1/E2 open — "none of the chain/authority space is measurement-backed," owner-rulings 2026-07-23); v1 Solidity file:line for V1-1..V1-4 (verified only against the review's ledger; a contracts spot-check is owed to the migration workstream); whether `channelAnchorSummary` and the current-live/compaction decision survive E2 (both are named conditionals in §4); the final authority-lane ABI for the authorization axis (consumed as a fixed input per the rails; its wire shape is the authority lane's); [[assumptions-and-requirements]] row-level cross-check (consulted via its citations in the joined-pass corpus, not re-read in full — same debt the FS lane recorded).

**Pushback:** none. No adopted ruling required contradiction; the one tension worth naming is not a pushback but a sequencing note — LC-12 (guest, 2026-07-28) postdates the joined pass and is absorbed here as a MUST consumer; if the lens pass's design lanes find guest ergonomics forcing a change to the link-grammar or starter-policy seams beyond what seam 12 already holds, that goes to the owner as a new item, not as a reopening of P13.
