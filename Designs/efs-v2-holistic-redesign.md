# EFS v2 — holistic redesign scope (the one final freeze)

**Status:** draft
**Target repos:** planning, contracts, sdk
**Depends on:** [[deterministic-ids]]
**Supersedes:** — (on acceptance: supersedes [[write-ux-options-ranked]]'s Tier-5 gating rule and portfolio sequencing — v2 is justified on permanent properties rather than a surviving plain-EOA-one-tx requirement; the 7702 in-account routine demotes from next-headline-win to post-v2 gasless/session-key enhancement, see [[efs-v2-transition-plan]] §4)
**Reviewers:** —
**Last touched:** 2026-07-01

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk

## Problem

The prototype works and taught us the model. Before mainnet there is exactly one cheap window to fix data-model decisions; after it, every wart is Etched. This design defines the **complete, bounded scope** of that window: what rides the final re-freeze, what becomes a pre-mainnet convention, what is explicitly out, and the honest justification for reopening a freeze at all. It is the umbrella over [[deterministic-ids]] (the core) and [[efs-v2-transition-plan]] (the sequencing).

**Scope discipline is part of the design.** "Everything is on the table" is a fully-general argument that never expires pre-launch; this document is the table, and it closes when James signs the bundle. One batched final freeze, publicly committed as the last one before mainnet — serial re-freezing is itself an anti-signal for an archival product.

### The honest justification (what adversarial review changed)

Twelve expert perspectives were run against this redesign, three of them explicitly adversarial. Review record: [[2026-07-01-v2-adversarial-review]]. Kept because it changes the framing:

- **The technical attack failed.** The core mechanism (domain-separated deterministic IDs, on-chain derivation recomputation, one-tx parents-first batches over verified EAS multiAttest semantics) survived; every flashy attack (ID squatting, front-running dataIds, dictionary surveillance, reentrancy, batch truncation) fails for specific stated reasons. What the attack produced instead is the list of edge semantics that MUST be specified rather than defaulted — now §1–§7 of [[deterministic-ids]].
- **The strategic attack partially landed, and its concessions are adopted.** The click-count argument was falsified against the shipped baseline: Tier-0 ([[write-ux-options-ranked]]) already gives 2–3 popups (burner: 0), and the Forever Files buildathon (Jun 23 → Jul 8 2026, cash prizes; flyers out 06-23, turnout low, wound down 07-01 — see [[Decisions]] 2026-07-01 and the open cancel-vs-lapse call in [[For-James]]) showed demand, not friction, is currently binding. Therefore: v2 is justified on **permanent properties** — cross-chain replicability (no overlay can retrofit dataId portability), offline/light-client verifiability, atomic + idempotent writes — with one-popup UX as a corollary. And it executes under guardrails: written change budget, design timebox, James frame-review at round 1, pre-committed abort triggers ([[efs-v2-transition-plan]]).
- **The status-quo steelman conceded the two things that decide it**: plain-EOA single-transaction atomicity and chain-portable identity have **no additive-overlay substitute** — refUIDs are baked into signed calldata; a PathRegistry overlay gives portable *names* but not portable *references*. Everything else it defended (in-account 7702 routine, L2 latency, EAS legibility) is preserved or compatible.

## Proposal

### 1. The freeze bundle (Etched — rides the ceremony or never)

Items 1, 2, and 6 (and item 5's *decision*) are coupled to schema strings or derivation rules — genuinely now-or-never. Items 3 and 4 (and item 5's *mechanism*) are before-burn: bundled here for one ceremony and one gas baseline, but sheddable to a later pre-burn upgrade if the schedule demands (see the partial-shed line in [[efs-v2-transition-plan]] §1.5):

1. **Deterministic IDs** — the whole of [[deterministic-ids]]: derivations, kind tags, registry, duplicate policy, existence rule, refUID policy, typed literals, slot IDs, virtual reserved-key anchors, blinded-anchor equivalence, replication model.
2. **Schema field strings v2** (table in [[deterministic-ids]] §3).
3. **`_indexGlobal` keep/demote line** — per-mapping on-chain-reader audit. Index shapes are append-only (ADR-0009) and become Etched at the key burn (ADR-0048; the 2026-05-31 frozen-schemas + upgradeable-contracts decision) — demotion could technically ship in any pre-burn upgrade; it rides this ceremony for bundling and the gas baseline, not by necessity. *(Deadline class: before-burn.)*
4. **Event set v2** — ID-keyed, full-payload, log-only-sync acceptance test; mainnet ABI is Etched surface. *(Deadline class: before-burn.)*
5. **Visibility-TAG mechanism decision** — TAGs out-of-batch vs kernel-walk-derived visibility (open question in [[deterministic-ids]]).
6. **PROPERTY canonical-hashing rule** — currently "forthcoming spec" vaporware at specs/02:73; it enters the Codex and freezes with it.

### 2. Conventions-before-data (Durable — zero schema cost, but must precede real data)

These need no frozen surface, but data written under the wrong convention is unmigratable, so they are pre-mainnet blockers in order of urgency:

1. **Folder node objects (dirnodes).** Folders are dentries without inodes: every per-attester folder attribute today welds to the shared permanent path anchor and is orphaned by any reorganization. Convention: an attester mints an empty DATA (their dirnode) and PINs it at the folder anchor — slot `(attester, folderAnchorId, KIND_DATA)` is already per-attester; the anchor's kindTag disambiguates dirnode-at-folder from file-at-name. All mutable folder state (description, icon, sort preference, movedTo provenance) binds to the dirnode like file metadata binds to file DATA. Anchors stay pure deterministic path IDs; folder identity becomes movable and even multi-homeable (Plan 9 bind). **Children deliberately do NOT hang off the dirnode** — O(1) subtree move is rejected because it destroys the global-path Schelling property; an archival FS wants permanent paths, not fast moves.
2. **Move doctrine.** Paths are permanent commitments, not mutable handles. A blessed move atomically (one batch — trivial under deterministic IDs) creates destination anchors, re-PINs placements, and attests `REDIRECT(kind=4 movedTo)` at every vacated path (kind=3 remains `relatedVersion` per ADR-0050/ADR-0055) — the web's 301, not POSIX rename(2). Old hyperlinks never silently die. Prerequisite: **ADR-0050's read-time resolution spec (lens precedence, depth cap, SCC-lowest-UID cycle rule, kind-following table — amended to follow kind=4) + conformance vectors lands before any durable data mints REDIRECTs.**
3. **Encrypted-file conventions** (zero schema changes, but harvest-now-decrypt-later means late conventions retro-protect nothing): ciphertext as ordinary mirror content with contentHash/size referring to **ciphertext** (trustless verification intact); reserved keys `contentEncryption` (self-describing format — age/HPKE envelope) and optionally `keyWrap`; default key distribution = capability in the web3:// URL fragment (never touches server or chain); on-chain recipient key-wraps MUST be PQ-hybrid (ML-KEM + X25519) with an explicit HNDL warning; random per-file content keys, convergent encryption only opt-in with a per-user convergence secret; sensitive names pair with blinded/salted anchors.
4. **Hash-verified cross-attester mirror fallback.** The router's lens-scoped mirror serving structurally blocks the only repair mechanism a no-token system has: third-party re-mirrors are invisible to every default read. Fix (redeployable surfaces only): when the winning lens's mirrors are dead AND that lens provides a contentHash claim, clients/SDK MAY fetch any attester's mirror and MUST verify bytes against the trusted hash before render. Publishers learn: a file without a contentHash claim is permanently ineligible for third-party repair. This is also the prerequisite for any future bounty-for-mirror layer.
5. **Shareable-link grammar.** Canonical machine form `web3://efs.eth/<0xaddress>/<path>` (per-chain subdomains per ADR-0060); ENS as display sugar verified bidirectionally; petnames never serialized into links; generated share links carry **no `?lenses=`** — the container address is the trust anchor. Two documented link forms: mutable *path form* vs reproducible *citation form* (ID + explicit lenses + chain), git branch-vs-commit.
6. **Author-first default lens for address containers**: `[segmentAddr, caller, system]` replaces `[caller, segmentAddr, system]` — browsing under someone's address shows their content by default; links resolve identically for every recipient; removes the self-overlay phishing seam. *(Supersedes ADR-0039/ADR-0033's connected-first default order — implementation must land a superseding ADR, not just a convention doc.)* Router is redeployable, but link semantics are muscle memory — precede real traffic.
7. **Named lenses (lens-as-LIST).** A published lens is a `LIST(targetType=ADDR)` at a reserved anchor under the publisher's container; `?lens=<listId>` dereferences at read time so curation updates flow to subscribers; "subscribe" = one LIST_ENTRY appending to your own lens list. Zero new schemas. This is the follow graph, the curation market, and how normal people configure trust without editing URLs.
8. **Directory enumeration re-based on per-attester indices.** Anchor-index bloat is the one spam surface lenses do not contain (~$450–4,500 permanently poisons a hot shared folder's global `_children` scan path). Lens-scoped listings must have a read path whose cost scales with the lens's content (`_childrenByAttester` K-way merge, already populated + paginated); the global walk demotes to discovery. View/SDK layer; specify before habits form.
9. **Salt lifecycle** — SDK-owned end-to-end: CSPRNG generation, persisted with the WritePlan before broadcast, registry-check-then-prune on retry, expert-only escape hatch. A hobbyist must not be able to hit salt loss or reuse.
10. **Durability-class labeling** — client convention: on-chain bytes (data:/SSTORE2) = archival class; off-chain mirrors labeled best-effort redundancy; publisher cost estimates visible from the first devnet write. The SDK's archival-write default includes ≥1 on-chain mirror (or ar:// as documented second). *("Durability class" is deliberately distinct from the Glossary's Etched/Durable/Ephemeral change-cost tiers and from the write-UX TIER 0–6 of [[write-ux-options-ranked]].)*

### 3. New workstreams (gaps no lens covered — designs to be written)

1. **The signing surface.** One signature now carries the user's entire namespace authority, rendered as an opaque calldata blob. A malicious dapp can slip a REDIRECT superseding the user's canonical file, a hostile PIN, or lens-poisoning TAGs into a batch. Deterministic IDs make batches **decodable** — a wallet can recompute every ID and render "write /notes.md, 3 properties, place under /home/alice" from calldata alone (impossible with time-salted UIDs). Deliverables: an ERC-7730 clear-signing metadata artifact for the EAS multiAttest + EFS schema set, shipped with the freeze; a conforming-client rule (same tier as ADR-0056's render-sandbox rule) that a human-readable batch preview MUST precede signature; threat-model statement that any signature from the user's account writes under their lens identity. Future: per-subtree session-key scoping on the B′ account.
2. **Trust-root stewardship.** The system depends on mortal authorities nobody has designed: the EFS.eth Safe (gates all future CREATE3 deploys → which chains are "real" EFS), the rented efs.eth ENS name, SystemAccount's key lifecycle and curation policy, the reserved-key/conventions registry ("who merges spec PRs in 2076"), the trusted-chain list that three security findings punt to ([[2026-07-01-v2-adversarial-review]]), and solo-founder bus factor over all of it. Also required: **fork doctrine** — chain-independent IDs mean an ETH/ETC-style split yields two universes with identical IDs and diverging claims; which fork do a billion embedded links mean? Most answers are policy documents, not machinery: publish the chain list **on EFS** as a signed lens-scoped document, name successor institutions, write how each authority dies gracefully. A system whose thesis is outliving institutions must enumerate the institutions it still leans on.
3. **Temporal provenance under replication.** A replica's attestations carry new block timestamps; the original publication time exists nowhere once the origin chain dies. Conventions needed: replica-provenance claims (`originalTime`/`originChain`, lens-scoped), cross-chain supersession doctrine (supersededBy is per-chain state, never inferred across chains without explicit claims), and an honest client answer to "which clock does a 100-year citation trust."
4. **Inbound web interoperability.** "Brings the web into blockchains" currently has no plan for the existing web to find, crawl, or cite EFS — which is both the missing demand lever (content invisible to search engines has structurally zero organic demand) and free archival redundancy (IA/Common Crawl snapshots as permissionless replicas). Deliverables: blessed https:// gateway link form (so links pasted into 2027 Slack open), gateway lens-default honesty (an indexed page IS a specific lens's view — say whose), og:/schema.org metadata derived from reserved-key PROPERTYs, sitemaps as a pure event-log fold, immutable dataIds as perfect ETags.

### 4. Explicit non-changes (adjudicated, closed)

No token, no protocol fees, no tunable anti-spam parameters in immutable contracts (gas is the rate limit; incentive hooks — salt/dataId stability, chain-free anchorIds, uninterpreted TAG weight, permissionless `index()` — are preserved for later opt-in layers). First-attester-wins stays (recency-merge rejected: substitutes recency for trust). Attester = user, always. No scheme allowlist (ADR-0056 stands). No ACLs / protocol delete / right-to-be-forgotten (WHITEOUT is the viewer-sovereign form; encryption is the only real read control). No content-addressed identity (ADR-0049 philosophy retained). EAS stays (ADR-0032; kernel-entrypoint alternative collapses the attester). No O(1) subtree move. No case-insensitive names (the HFS+ mistake). No global human-name registry at root (recreates ENS's squatting economy; paths-under-address + ENS + petnames cover naming).

### 5. Personas → invariants (the constitution every decision passed)

*Publisher* (cold-key EOA on an air-gapped signer must publish first-class), *archivist* (replicate everything verifiably to a chain that survives), *curator* (lens = shareable, subscribable object), *dapp dev* (precompute any address offline; subscribe via log filter; boring writes), *indexer operator* (log-only sync; state-walk reconstruction), *future reader in 2126* (one self-hosted spec + chain data suffice; every link in an archived page still dereferences to something explainable). Invariants: attester=user; paths permanent; statements/things split; verify-don't-trust reads; minimum irreversible assumptions; viewer sovereignty.

> **Substrate ruling (2026-07-02):** [[efs-substrate-decision]] adds its §3 reservations (identity word, envelope/KEL reserved formats, reserved schema IDs, chain-order leak fixes, TID device bits, read-grade vocabulary) to the §1 freeze bundle, and requires the §5 mission ruling (default permanence vs free tier) before Phase 0 closes.

## Open questions

- [ ] **Mission ruling** ([[efs-substrate-decision]] §5): permanent-archive-with-social-features (no default-ephemeral tier) — confirm or amend. Sequences before everything else.
- [ ] Sign off the bundle boundary: anything in §1 missing? anything that should be evicted to §2?
- [ ] Sign off (or explicitly delegate to per-doc convention review) the §2 convention set — flagging in particular §2.1's consumption of the single per-attester `(folderAnchorId, KIND_DATA)` PIN slot at folder anchors (a permanent slot-namespace allocation) and §2.6's reversal of ADR-0039/ADR-0033's default lens order.
- [ ] Visibility-TAG mechanism (also flagged in [[deterministic-ids]]).
- [ ] Fork doctrine + trusted-chain list stewardship: acceptable as policy docs published on EFS, or does James want any of it mechanized?
- [ ] Gateway strategy for §3.4: bless eth.limo-style third parties vs run a reference gateway in the devnet stack.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

Sequencing, timebox, and abort triggers: [[efs-v2-transition-plan]]. Each §1 item lands as a per-repo ADR at implementation (planning design → contracts ADRs, per vault convention); §2 items land as specs/conventions docs; §3 items are new name-first designs in this folder.
