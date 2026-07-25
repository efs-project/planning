# Filesystem core — the per-chain drive, its lens profile, and the read-only mount

**Lane:** RECONCILED FILESYSTEM CORE (rulings 1, 2, 9) — 2026-07-25 joined KEL × authority × lens filesystem reconciliation pass
**Question owned:** the per-chain filesystem that renders like a drive, resolved through lenses, enumerable on-chain, projectable to a read-only mount — closing [[human-overview#7. The seams that must be closed]] seams 6 and 7 and the filesystem side of seams 1–3, or explicitly handing each to the authority lane
**Status:** reconciliation input; nothing here is ceremony-final; the FS profile below is the **replacement seed** for the reopened [[read-lens-spec]], not an amendment layer on it
**Inputs (read in full):** [[README]], [[owner-decision-inbox]], [[owner-rulings]], [[human-overview]], [[read-lens-spec]], [lens architecture review](../2026-07-11-efsv2-lens-architecture-and-scale-review.md), [[mountable-filesystem-semantics]], [[onchain-completeness]], [[codex-kinds]], [[fs-pass-synthesis]], [[deterministic-ids]] (skim), [use-cases](./use-cases.md), [aa-inversion](./aa-inversion.md) (sibling lane, §0–1)
**Audience:** the pass synthesizer and critic first; James's packet second

#status/draft #kind/review #repo/planning #topic/efsv2 #topic/lenses #topic/mount #topic/filesystem

---

## 0. Verdict and scope

The filesystem core reconciles into one sentence:

> **A drive is one realm's evidence plus one compiled filesystem lens at one pinned basis; a mounted tree, a `web3://` page, and an on-chain point read are three projections of that same resolved view, and every one of them must name the same five things — realm, code basis, lens version, evidence basis, completeness policy — or it is not citable.**

What this lane rules (as reconciliation input, per [[README]]):

1. **The FS lens profile survives as the simplest compiled policy** — one typed `EffectiveLens` instance under the [review model](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#2. Split the overloaded primitive), not a rival mechanism (§1.1). The flat ordered-author list is demoted to an authoring/editor projection, exactly as [[human-overview#Decision D-13 — Define a lens as a typed compiled policy]] choice A anticipates.
2. **Seam 6 (false equivocation / false absence) closes with two normative rules** (§1.7, §1.8): PROVEN-ABSENT is grounded only in venue-state closure, never in an author-omissible claim; and no global same-`(principal, order)` equivocation rule exists — collision evidence is scoped to the exact semantic position.
3. **Seam 7 (lens object too weak) closes for the filesystem** by adopting the typed model with a small frozen-vocabulary FS profile (§1.2): `PRIORITY_FIRST_PRESENT` for exclusive name/property slots, union-of-candidates for enumeration, advisory subtraction after resolution, per-rule relinquish declarations, WHITEOUT as authenticated masking evidence.
4. **The one-basis agreement invariant is new normative surface** (§1.6): point lookup and page enumeration are functions of the same `(evidence, lens, basis)` triple and may never disagree. This is what makes `readdir` + `lookup` + `getattr` + `listxattr` coherent enough for a mount.
5. **Seams 1–3 have a filesystem side and an authority side.** The filesystem side is stated here as requirements the FS reads impose (§8); the admission lanes, receipts, grades, and topology are **handed to the authority lane** with those requirements attached.
6. **Ruling 9 is discharged by a conformance walk** (§5): every operation in the [[mountable-filesystem-semantics#4. Cross-platform read-only mount contract]] contract has a defined answer or a named gap. Six gaps are named; none is silent.

How this verdict breaks: if any later lane lets a projection (mount, gateway, contract view) answer from a *different* basis than the enumeration that framed it, every guarantee below silently decays into the pre-reconciliation state — plausible pages, phantom absences, and unfalsifiable citations. The one-basis invariant is the load-bearing wall.

---

## 1. The filesystem lens profile (FS-LENS/1) — the [[read-lens-spec]] replacement seed

### 1.1 Relation to the typed compiled-policy model

The [lens architecture review](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#Executive judgment) rules that a lens is a content-addressed, reproducible policy over authenticated evidence — `EvidenceGraph + BasisVector + EffectiveLens + Context → ResolvedView + ViewReceipt`. This profile does not compete with that model. **FS-LENS/1 is one `EffectiveLens` instance family**: the compiled shape that every filesystem read (mount, gateway, SDK `resolve`, bounded contract view) executes. Concretely:

- The user-visible "mount Alice", "overlay these curators" experience is **authoring sugar** that compiles — through the review's ordinary compiler pipeline ([review §4.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#4.3 Compiled effective policy)) — into an `EffectiveLens` whose rules use only the FS profile's vocabulary (§1.2).
- The old [[read-lens-spec]] ordered `bytes32[]` survives only as the **simplest source form**: an ordered list compiles to one `PRIORITY_FIRST_PRESENT` authority rule with one tier per listed principal, scope = the mounted root, purpose = `FS_BROWSE`. Nothing else in the old spec's flat input survives normatively.
- Everything the old spec got right — anti-fallthrough, PROVEN-ABSENT vs UNKNOWN, deny-after-resolve, venue-graded currency, verification order (lens → signature → bytes), the conformance-suite discipline of [[read-lens-spec#8.3 Acceptance tests for a conforming reader]] — is **carried into this profile re-typed**, with the corrections seam 6 demands.

Why one typed instance and not a bespoke FS mechanism, stated as a falsifiable claim: every FS-specific behavior in this section is expressible as (combiner, scope, relinquish mode, advisory rule) tuples in the review's grammar; nothing below required extending that grammar. If a later lane finds an FS behavior the grammar cannot express, that is a defect **in the grammar** to fix once, not a license to fork a second policy language. (PLAUSIBLE — asserted after constructing §1.2–§1.10 inside the grammar; an independent compile-and-vector pass is the check.)

### 1.2 The profile as a compiled policy instance

FS-LENS/1 fixes the vocabulary a filesystem view may use. A conforming FS `EffectiveLens` contains only:

| Rule class | Combiner | Scope shape | Notes |
|---|---|---|---|
| **Name resolution** (exclusive `(parent, name, kindclass)` positions) | `PRIORITY_FIRST_PRESENT` | roots = mounted TAGDEF/ADDRESS containers; claimRole = placement | tiers are the user's ordered groups ([review §2.5](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#2.5 Equal-rank groups)); equal-rank difference = `CONFLICT` row, never a byte tie-break |
| **Point property** (exclusive `(node, propertyKey)` slots) | `PRIORITY_FIRST_PRESENT` or `EXACT(owner)` | claimRole = metadata | the default address-container baseline is `EXACT(owner)` per [review §12.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#12.1 No universal protocol lens) |
| **Directory enumeration** (candidate names) | `UNION_SET` over selected principals' child-candidate streams, dedup key = exact semantic position | claimRole = placement | enumeration ≠ endorsement; every emitted row is then point-resolved (§1.3) |
| **Deny/advisory** | `ADVISORY(actions)` — subtract after resolve | labelDefinitionId-scoped | never re-opens resolution ([[read-lens-spec#3.4 Deny composition (implements critic G1 action + attack-ops D3; normative)]] rule 1 carried verbatim) |
| **WHITEOUT** | consumed as authenticated mask evidence (§1.5) | maskScope | not a combiner; an evidence state in the [review §6.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#6.2 Evidence states and policy transitions) table |

Explicitly **outside** FS-LENS/1 (they exist in the full model, not in the filesystem profile): `THRESHOLD`, `MERGE`, discovery-mode rules beyond child candidates, and any GATE-purpose package/update policy — those compile under their own purposes and stricter profiles ([review §14.3](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#14.3 Packages and updates)). A mount descriptor that references a lens whose compiled rules exceed the FS vocabulary **fails to mount** rather than partially executing. Fail-closed here prevents a package-gate policy from being silently degraded into a browse view or vice versa.

How it breaks: if the profile allowed arbitrary combiners, a hostile shared lens could put a `MERGE(strategy)` on a name slot and make two hosts' resolvers disagree wherever the strategy implementation differs — the mount's cross-platform determinism guarantee ([[mountable-filesystem-semantics#12. Falsification tests]] test 1) dies first. The closed vocabulary is what makes the three-host golden fixture provable.

### 1.3 The directory operation pair

A directory read is two operations, never one ([review §2.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#2.4 Directory semantics are two operations)):

1. **Enumerate candidates:** union the child name/position candidates contributed by the lens's selected principals, from the per-`(parent, principal)` candidate streams (§4.1), fair-scheduled with per-author budgets and cursors so one flooded stream cannot starve the rest ([review §8.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#8.2 Directory discovery: the honest boundary)).
2. **Resolve each position:** run the exclusive-position combiner for every discovered `(parent, name, kindclass)`; emit one row per position — winner, or a labeled `CONFLICT` carrier row, or nothing (masked/denied/empty) — with provenance.

Sorting is a **client materialization at the pinned basis**, never an on-chain page property; a partially-materialized listing is a preview, not a stable prefix ([review §8.2 Deterministic SDK materialization](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#Deterministic SDK materialization)). This is [[human-overview#Decision D-9 — Set the honest on-chain lens promise]] choice A assumed; the FS profile is written against it and is the strongest consumer of that choice (held item — not re-asked here; see Reconciliation ledger #9).

### 1.4 Collision rules

#### 1.4.1 Two principals assert different children at one name

This is **contention, not equivocation** — the normal operating condition of a shared namespace. Rule:

- The exclusive position `(parent, canonicalName, kindclass)` is resolved by the rule's `PRIORITY_FIRST_PRESENT` tiers. The winner is emitted with an attribution chip; losers remain one interaction away ([[read-lens-spec#4.4 Shared-namespace legibility (ops U1/U2; normative for INTERACTIVE clients)]] carried).
- Equal-rank different values = `CONFLICT`: the listing shows one deterministic **carrier row labeled CONFLICT** (carrier chosen by canonical byte order for transport determinism only — byte order never becomes authority, [review §8.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#8.2 Directory discovery: the honest boundary)); the mount projects it as an entry whose `user.efs.grade` says `CONFLICT` and whose open fails with a distinguishable error unless the user's policy names a tie rule. A GATE-context read of a CONFLICT position fails closed.
- The words matter: multi-author contention is **never** rendered with equivocation/duplicity vocabulary. Duplicity is a single-author, single-slot phenomenon (§1.8). [[read-lens-spec#4.4]]'s U2-vs-CONTESTED string-catalog warning is carried.

How it breaks: a squatter claims `readme.md` under a curator's folder before the curator does. Under author-first ordering the squatter wins nothing (curator outranks); under discovery-flagged views the squatter's row appears only in the labeled untrusted section (LC5 carried from [[read-lens-spec#8.1 Default-lens client rules]]). The residual exposure is a viewer whose own lens ranks the squatter — which is the viewer's declared policy, surfaced by the chip, not a protocol failure.

#### 1.4.2 File-vs-directory conflict at one name (the ethereum-first blind spot)

Two distinct cases, one projection rule:

**Case A — one node is legitimately both.** [[codex-kinds]] admits generic children under KIND_DATA parents (amendment 8), so `report.pdf` can be a file *and* have children (annotations, sub-documents). A host entry needs exactly one type ([[mountable-filesystem-semantics#9. Ranked cracks and their likely homes]] row 1).

**Case B — same presented name, different kinds.** The kind word is inside the tagId derivation ([[read-lens-spec#P10|pin P10]], [[deterministic-ids]]), so `docs` as KIND_GENERIC and `docs` as KIND_DATA are *different positions* that can both hold winners — possibly from different authors.

**Projection rule FSP-HYBRID (deterministic, reversible, host-identical):**

1. Every position resolves independently under §1.4.1 — the kinds never compete in one slot.
2. If exactly one kindclass has a winner at the presented name, project it plainly (a DATA winner with no children = regular file; a GENERIC winner = directory).
3. If a DATA winner **has resolved children** (Case A), project **a directory**; the file's own bytes are reachable at the reserved control child `<name>/~data` (grammar-safe: canonical names reject leading `~` — [[fs-pass-synthesis]] C2 reject-set — so no real child can collide; contingent on the grammar confirmation gap G-3 in §5.2). `getattr` on the directory carries `user.efs.hybrid = data+children` and the file's content commitment, so `cp -r` loses nothing and a kind-aware tool can recover both meanings.
4. If both kinds hold *independent* winners at one presented name (Case B), the path-continuation winner (GENERIC) takes the plain name and the byte-serving winner (DATA) is projected under the deterministic decorated name produced by the portable-name profile's collision escape (§3.3) — reversible, enumeration-visible, identical on all three hosts. This freezes the old serving-context trial order of [[read-lens-spec#4.1 Name shadowing across kinds (frozen total order per serving context)]] into a *simultaneous* projection instead of a per-request re-resolution, because a mount cannot answer `stat` differently depending on why the caller asked.
5. Explicit-kind access (`?kind=`, `~data:`/`~tag:` prefixes, control API) always bypasses projection — the projection is a view rule, not identity.

Rationale for directory-wins at the plain name: path continuation is the operation ordinary tools cannot route around (a shadowed *file* is still reachable at a decorated name; a shadowed *directory* would orphan its entire subtree). Delegated-technical with vectors per the recording rule in [[owner-decision-inbox#Delegated technical gates — not owner votes]] — escalate only if the golden fixture shows product-visible harm. (PLAUSIBLE — the rule is constructed, not yet vectored; Phase-0 fixtures in [[mountable-filesystem-semantics#11. Suggested falsification ladder]] cover exactly this.)

### 1.5 WHITEOUTs

The encoding is settled by [[fs-pass-synthesis]] C5: a genesis `/.well-known/whiteout` TAGDEF object plus an ordinary REF-PIN targeting it; only the genesis-manifest row is freeze-sensitive. The FS profile consumes it as the `WHITEOUT(maskScope, provenance)` evidence state ([review §6.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#6.2 Evidence states and policy transitions)):

- A whiteout **masks the declared lower scope and stops** — resolution does not continue past it to lower tiers. It is how an upper layer says "this name is deliberately empty *here*", the OverlayFS analogue with signed provenance.
- A masked name is **absent from the projected tree** but the mask is inspectable: `readdir` omits it; the control API and `?grades=1` views show `WHITEOUT by <principal> at tier N`. This is the one place where the projection and the evidence deliberately differ, and the difference is always recoverable.
- **A whiteout is not PROVEN-ABSENT.** A GATE read distinguishes "masked by policy" from "proven never claimed"; the former is a policy fact, the latter an evidence fact (§1.7). Conflating them would let any subscribed upper layer manufacture evidence-grade absence — false absence by policy.
- Cross-author removal stays a **deny-advisory convention**, not a second whiteout spelling ([[fs-pass-synthesis]] C5 carried): you may hide another author's entry from *your* view; you cannot mask it inside *their* layer.

How it breaks: a malicious curator you subscribe to whiteouts `/software/tools/scanner` to suppress a competitor. Detection: the update ceremony diffs the mask set ([review §13.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#13.4 Update ceremony)); the mask is attributed on inspection; and your own tier above the curator overrides it. The failure that remains — you never look — is the standing lesson that subscription is trust, surfaced not solved.

### 1.6 The one-basis agreement invariant (point/page coherence) — new normative surface

**FSP-BASIS-1.** Within one directory snapshot (and one mount generation, §6.2), `lookup(parent, name)`, `read_dir(parent)`, `get_attributes(entry)`, and property reads (`get_metadata`, `list_metadata`) are all pure functions of the same `(evidence set, EffectiveLensId, basis)` triple. Consequences, each independently testable:

1. **No phantom presence:** a name returned by an enumeration page MUST resolve `PRESENT` by point lookup at the snapshot basis.
2. **No false absence by skew:** a name that point-resolves `PRESENT` at the snapshot basis MUST appear in the complete enumeration at that basis (positive closure required, §1.7).
3. **Cursor binding:** an enumeration cursor is bound to `(query, compiled plan slice, realm, code basis, evidence basis, high-watermarks)` and fails on any mismatch — never splicing two views ([review §7.1F](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#F. Bounded batch/page views) carried; the mount's continuation cookies are these cursors, [[mountable-filesystem-semantics#Stable directory enumeration]]).
4. **Properties are not exempt:** `listxattr`/EA enumeration and per-key point reads obey the same triple; the bounded `user.efs.*` convenience layer may summarize-with-overflow-marker but the lossless control API must page to closure at the basis ([[mountable-filesystem-semantics#EFS properties as xattrs/EAs]]).
5. **Live venues advance underneath; the snapshot does not.** New admissions become visible only in a *new* snapshot/generation. This is what makes [[mountable-filesystem-semantics#12. Falsification tests]] test 5 (no skipped/duplicated entries under concurrent mutation) passable at all.

Why this must be normative rather than daemon hygiene: the indexes are on-chain and paged; a naive client interleaves `children(cursor)` calls across blocks and `getSlot` calls at `latest`. Every mixed-basis read is a potential lie in both directions — an entry admitted between pages appears in `lookup` but not the listing (phantom), an entry revoked between pages appears in the listing but resolves EMPTY (false ghost). EIP-1898-style pinned-block reads are the EVM mechanism; the *requirement* is venue-neutral and belongs to the profile ([review §8.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#Deterministic SDK materialization)).

### 1.7 PROVEN-ABSENT vs UNKNOWN — fail-closed without manufacturing false absence

The anti-fallthrough core of [[read-lens-spec#2.1 Position states]] survives re-typed: for each authority source at a position, the evidence state is `PRESENT | NEVER_CLAIMED(closure) | RELINQUISHED | WHITEOUT | HANDOFF | UNKNOWN`; **only `NEVER_CLAIMED` with a closure proof yields to the next tier**; `UNKNOWN` stops final resolution ("falling through on UNKNOWN converts a data gap into a trust transfer" — the argument is carried verbatim). `RELINQUISHED` follows the rule's declared mode (§1.10).

**FSP-ABSENT-1 — what may ground PROVEN-ABSENT.** Exactly three sources:

1. a direct read of the venue's total current state at the pinned basis (own node / verified execution);
2. a verified **state proof against the venue's state root at the basis** covering the relevant slot(s) and the relevant index pages *to positive closure* (the terminal page carries closure — the [use-cases](./use-cases.md) R-QC1 shape);
3. a complete offline bundle whose closure manifest commits to the venue state root at its basis.

**FSP-ABSENT-2 — what may never ground it** (each a false-absence factory if admitted):

- **An author-signed checkpoint.** [[human-overview#7. The seams that must be closed]] seam 6 is explicit: an author-omissible claim cannot prove that the author did not omit an already authority-admitted record. Checkpoints remain ordinary reserved-key claims (compatible with held Q4A, [[owner-decision-inbox#Q4 — Checkpoints stay ordinary claims]]) and remain useful as **freshness hints and the author's own asserted-history bound** — but they are demoted from absence prover to advisory. This supersedes the [[read-lens-spec#5.2 Checkpoints are ordinary claims (pins P7; critic C4)]] use of checkpoint non-inclusion as `PROVEN-ABSENT(asOf N)` (ledger #6).
- **Budget exhaustion.** An exhausted scan/probe/page budget returns `INCOMPLETE_BUDGET` with a continuation, never absence ([review §6.7](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#6.7 Completeness is part of the result)).
- **A partial replica or hosted index answering "no rows".** Absence from a partial source is `UNKNOWN` ([[mountable-filesystem-semantics#Source-composition invariant]] carried: one source's receipt cannot upgrade another's observation).
- **A deny hit or WHITEOUT** (§1.5): policy suppression is not evidence absence.
- **A hosted RPC's bare word** without the proof of source 2: that read is explicitly RPC-trust-graded, and a strict-profile mount refuses to map it to native not-found.

Host mapping stays the [[mountable-filesystem-semantics#3.5 EFS absence can be UNKNOWN; POSIX lookup wants an answer]] contract: only `ABSENT_PROVEN` → `ENOENT`/native not-found; `UNKNOWN` → cause-appropriate transient/IO error, never a negative-cache entry.

How it breaks (the manufacture attempts, each closed): a censoring RPC withholds one directory page → no closure → `UNKNOWN` → transient error, not an empty folder. A stale replica proves absence against an old root → the basis is named; at *that* basis the absence is true, and the mount generation's displayed basis is the honesty mechanism — a reader needing currency compares the basis age (currency policy, §6). An attacker floods the folder to push the honest entry past every budget → `INCOMPLETE_BUDGET`, resumable, never absent (also §4.5). The residual honest limitation: **chain-free replicas can never produce `ABSENT_PROVEN` for a live view** — exactly [use-cases](./use-cases.md) §4 row L2, surfaced as a grade, not papered over.

### 1.8 No false equivocation (seam 6 closure text)

The FS profile adopts, as normative rule text, the resolution [[human-overview#7. The seams that must be closed]] seam 6 demands and the [review §6.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#6.4 Same-sequence collision) grounds:

1. **The global same-`(principal, order)` EQUIVOCAL/CONTESTED rule is deleted.** `order` is envelope-wide and legitimately non-unique; one ordinary batch puts many records at one `(principal, order)` across different semantic positions. Same-order records in different positions are normal, never duplicity. This removes [[read-lens-spec#2.2 Claim dispositions]]'s EQUIVOCAL/CONTESTED computation and its P6 pin as written (ledger #5).
2. **Collision evidence is scoped to the exact slot:** two different admitted digests at the same `(principal, semanticPositionId)` *and the current winning order* may set the orthogonal `SAME_SLOT_COLLISION` flag with a bounded commitment to the alternatives; the deterministic `(order, recordDigest)` winner still stands; a later greater order clears the current flag while history stays auditable. Whether that flag earns Etched kernel state/ABI is a measured E2-bundle choice, not assumed ([review §18.2.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#18.2 Decisions that require a measured freeze choice)); the FS profile consumes it **if present** (a high-assurance rule may stop on it) and functions honestly without it.
3. **Cross-author contention is never equivocation** (§1.4.1); **channel forks are channel state** (`CHANNEL_CONTESTED`, [review §4.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#Channel update protocol)), and a conflicting *checkpoint* pair is duplicity evidence about that author's checkpoint slot only — none of these promote to a namespace-wide "author is equivocal" verdict.
4. What contracts get remains ruled: no on-chain collision/duplicity bit; on-chain gates use closed trusted author sets or challenge windows ([[owner-rulings]] 2026-07-15 item F — still-valid, consumed here, not reopened).

Grade vocabulary consequence: the FS resolver result carries **orthogonal axes**, not one dominance ladder — `AuthorSlotState`, `CandidateFreshness`, `ResolutionStatus`, `AdvisoryResult`, availability flags, plus the authority axis (`AUTHORITY-ADMITTED` vs `PORTABLE-EVIDENCE`, [aa-inversion](./aa-inversion.md) §0) supplied by the authority lane. A consumer (mount, gateway, gate) declares acceptable combinations and otherwise fails closed — the [[human-overview#7. The seams that must be closed]] seam 7 axis model, adopted.

### 1.9 Redirects, symlinks, cycles, budgets

Carried from [[read-lens-spec#4.3 Follow policies (consumes the P9 follow-policy column)]] with the typed re-grounding:

- `symlink`, `movedTo`: auto-follow, shared budget **`MAX_AUTO_FOLLOWS = 8` per resolution**, cycle-detected by visited set; exhaustion or a cycle is `UNRESOLVABLE` — a resolver **error**, not a grade, never a fallthrough. Host mapping: `ELOOP` on Unix, the corresponding reparse error on Windows.
- `supersededBy`: followed only in explicit latest-version mode; a citation never silently substitutes bytes.
- `sameAs`/`relatedVersion`: never auto-followed; labeled edges only.
- `successor`: reserved-not-active, never followed, never authorizes ([[codex-kinds]] amendment 7) — succession is the authority lane's problem now.
- `home`: an ordinary advisory row only. Under the fixed-profile candidate there is no per-principal locator, and under any topology an ordinary content row cannot change authorization or currency ([[human-overview#7. The seams that must be closed]] seam 9). The old [[read-lens-spec#5.4 MUST-pull for safety-class gate reads]] "pull the author's declared home" machinery is therefore **suspended pending the authority lane's topology answer** — the FS profile expresses currency policy against *the drive's own venue basis age* (§6), which needs no locator (ledger #7).
- Mount symlink projection: only safe relative targets within the mount are projected as host symlinks; cross-realm and external references render as control-API references, not host path strings ([[mountable-filesystem-semantics#Operation mapping]]).

How it breaks: a hostile folder builds an 8-deep `movedTo` chain to a cycle. Cost is bounded by the budget; the error is deterministic; and because the budget is per-resolution, a directory listing of 10k such entries costs 10k bounded resolutions, which the history-amplification budget (§4.5) must keep inside declared limits — the two budgets compose, neither replaces the other.

### 1.10 Relinquish/fallthrough declarations

Every exclusive FS rule declares `FALLTHROUGH_ON_RELINQUISH` or `STOP_ON_FORMER_AUTHORITY` ([review §6.5](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#6.5 Revocation, relinquishment, and whiteout); [[human-overview#7. The seams that must be closed]] seam 7):

- **FS default for ordinary overlay folders: `FALLTHROUGH_ON_RELINQUISH`** — shell-like union behavior; a revoked winner yields the position to the next tier (empty-on-revoke first: the slot itself never resurrects a superseded claim — the kernel's C8 rule carried from [[read-lens-spec#1.3 The slot read primitive]]).
- **Anything a machine acts on stops:** package/update/security-config/gate scopes are outside FS-LENS/1 entirely (§1.2) and stop by default in their own profiles.
- The declaration is per-rule compiled state, visible in the update ceremony diff — the "removed curator activates a dormant squatter" attack ([review §15](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#15. Threat model and failure analysis)) is answered by the declaration plus the diff, not by a universal ban on fallthrough.

### 1.11 Provenance surfacing — every read shows its grade and basis

Ruling 3's read-side obligation, made concrete for each projection:

- **Resolver result (canonical):** winner + `(principal, signer/delegation path, rule, tier)` + grade axes (§1.8) + basis + completeness — the [review §13.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#13.2 Item-level explanation) explanation tree.
- **Mount:** fixed xattrs `user.efs.id`, `user.efs.author-principal`, `user.efs.grade`, `user.efs.basis`, `user.efs.content-commitment` + the lossless paged control API ([[mountable-filesystem-semantics#EFS properties as xattrs/EAs]]); the mount descriptor itself displays the drive's five-part identity (§2.2).
- **Gateway/URL:** `?grades=1` and the citation form carry the same tuple; a `web3://` page renders the attribution chip.
- **Contract view:** returns the winner plus the packed grade/basis words; a contract that ignores them is a consumer bug the SDK templates refuse to write ([use-cases](./use-cases.md) R-CR3).

The authority axis value (`AUTHORITY-ADMITTED` at ordinal N / `PORTABLE-EVIDENCE`) is **supplied by the authority lane's ABI and surfaced verbatim here** — the FS profile allocates the display slot and refuses to invent the value (§8, handoff H-2).

---

## 2. Chains as drives (ruling 2)

### 2.1 What a drive is

**Drive = realm × root × FS lens × basis × completeness policy**, where **realm** is the review's `VenueRefV1` shape ([review §4.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#4.1 Semantic identity is not a locator)): `(chain namespace, chainId, genesisBlockHash, kernel address, kernel runtime codehash + implementation commitment, kernel semantics profile)`. The realm includes **its index state**: the mandatory bundle ([[owner-rulings]] 2026-07-15; [[onchain-completeness#6. THE LINE (state it once)]]) is part of what a kernel deployment *is* — a deployment without the force-fed indexes is a different, weaker realm profile and must say so (it cannot honestly produce `ABSENT_PROVEN` for enumerations, §1.7).

Per ruling 2, **each chain is equal for content**: the same signed envelope admitted on realm A and realm B is the same artifact with two venue-qualified observations ([[mountable-filesystem-semantics#Source-composition invariant]]); nothing in the FS layer privileges one realm. What is *not* equal per drive is authority grade — which realm's admission counts as a principal's strong grade is the authority lane's question, and the FS profile only displays the answer.

### 2.2 Naming a view: the five-part identity (the blind-spot list)

**FSP-NAME-1.** Every mount, citation, receipt, and cache key names all five, and omission of any one is the named failure it invites:

| Component | What it pins | Failure if omitted |
|---|---|---|
| **Realm + code basis** | which chain, which kernel bytes/semantics | same path, different kernel semantics → silently different tree; an upgraded proxy is a *different realm* |
| **Lens version** | `EffectiveLensId` (+ compilation/channel acceptance for provenance) | "same lens" drifts as a channel advances; two people cite one view and see two |
| **Evidence basis** | block/state root + finality grade | phantom/ghost entries (§1.6); irreproducible citations |
| **Completeness policy** | `REQUIRE_PROVEN` vs `ALLOW_GRADED` | a graded browse view gets consumed as if strict — false absence or unlabeled staleness |
| *(+ evaluation time for expiry)* | the clock domain observation | wall-clock-dependent STALE results become irreproducible |

This is the [[mountable-filesystem-semantics#4. Cross-platform read-only mount contract]] mount descriptor and the [review §4.5](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#4.5 View receipt) receipt, stated once as the FS core's naming law.

### 2.3 Two drives side-by-side

Mounting realm A and realm B simultaneously is the *product-normal* multi-chain experience and requires **zero cross-chain machinery**:

- Two mount descriptors, two roots (`/mnt/efs-base/…`, `/mnt/efs-arb/…`), two independent bases. No shared namespace, no shared authority, no fan-out.
- The same principal appearing on both drives is **realm-qualified**: each drive shows that realm's admissions and grades; neither view claims to be the principal's unqualified `CURRENT` (the R-K11 rule the [[owner-rulings]] 2026-07-23 note cites). The mount surfaces the qualification in provenance metadata; it never merges.
- The same *content* on both drives deduplicates by logical ID and bytes in the client cache while **receipts stay venue-qualified** — the source-composition invariant again.
- Name shadowing across drives does not exist at this level, because the drives do not share a directory. It appears only when a user deliberately composes a **union lens across realms** — which is a §2.4 future-view act, not a side-by-side mount.

This is the honest reading of "chains render like drives": the drive metaphor is exactly as strong as removable volumes — two USB sticks with a `readme.md` each do not conflict until someone merges them.

### 2.4 The future unified cross-chain view — hard parts named, not built

Per ruling 2, design so it stays possible; per the register ([use-cases](./use-cases.md) R-XC1), the merged view is client-side policy. What it would require, and the James decision each hard part waits on:

1. **A cross-realm basis vector, non-atomic and labeled** — already the receipt shape ([review §15.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#15.2 Cross-chain limitation)); no decision needed, only honesty.
2. **Realm-qualified name disambiguation:** a merged directory where realm A's `readme.md` and realm B's `readme.md` collide needs a declared cross-realm tier order plus mandatory realm labels — expressible today as an FS-LENS/1 policy whose tiers are (principal, realm) pairs. No new machinery; needs golden vectors before any product claim. (PLAUSIBLE.)
3. **One principal's authoritative realm:** the only part that *cannot* be client policy. "Which realm answers for Alice's current authority" is held N1 topology plus [use-cases](./use-cases.md) J4 (re-home promise) plus R-XC3 (the L1 pointer candidate). Until those are answered, a merged view MUST render realm-qualified authority labels or it lies — that is this lane's contribution to T2: **the FS core neither needs nor forecloses the pointer; it needs realm labels either way.**
4. **Merged completeness:** `ABSENT_PROVEN` in a merged view means proven on *every* member realm at its basis — expensive and non-atomic; a merged view that cannot afford it degrades to `ALLOW_GRADED` and must say so.

**T1 discharge (FS side):** chains-don't-die means every drive stays mountable and every old link resolves forever — data stranding does not exist in the FS core. The residual "dead home" worry is authority-service quality, which never enters the FS profile's semantics; it enters the authority lane's E1 measurements and J4. Scope reconciled exactly as [use-cases](./use-cases.md) §6 T1 states; this lane adds: the *read* path needs no chain-quality tiering at all.

**T2 discharge (FS side):** no FS requirement forces the L1 pointer or any bridge. The one FS-adjacent consumer is §2.4 item 3, which is precisely the held decision surface. The stop-rule posture (research stop-rule, not prohibition — [[owner-rulings]] 2026-07-23 correction) is respected by keeping item 3 specified and unbuilt.

---

## 3. Naming and identity

### 3.1 Path-derived TAGDEF identity and the rename problem

The design of record stays [[fs-pass-synthesis]]: folder identity derives from path lineage (`tagId = H(DOMAIN, parentId, nameHash, kindTag)`), so **rename is a `movedTo` redirect at the moved node** and descendants keep their identities — references and history survive, which is the archive-correct trade ([[mountable-filesystem-semantics#3.3 Path-derived TAGDEF identity makes directory rename special]]).

For the **required read-only profile**, this lane rules the read side completely:

- The **new path** resolves natively (the mover re-anchored the node); the **old path** resolves through the `movedTo` redirect within the follow budget and renders a provenance breadcrumb; both are deterministic at one basis.
- A directory snapshot taken *before* the move keeps serving the old projection until refresh (§6.2) — POSIX-coherent by construction, because the snapshot is basis-pinned.
- Cycles among `movedTo` edges are the §1.9 budget's problem — deterministic `UNRESOLVABLE`, never a hang.

What stays honestly open: whether path-derived identity survives contact with *writable* rename (POSIX atomic-replace, `RENAME_EXCHANGE`, crash matrices — [[mountable-filesystem-semantics#Open questions]] writable list). That is the writable follow-up's falsification target and **must not be silently marked solved**; ruling 9 requires only that nothing here forecloses it, and nothing does (the redirect is additive evidence; a future writable profile composes move + whiteout + re-anchor in one envelope — [[fs-pass-synthesis]] master-table row Move/rename).

### 3.2 Stable file identity for mount handles

Immutable evidence vs mutable handles ([[mountable-filesystem-semantics#3.4 Immutable evidence meets mutable file handles]]), resolved for the read-only profile:

- **An open file handle pins the selected file generation**: one coherent tuple `(logical dataId, resolved metadata claim, logical size/encoding, content/chunk commitment, byte-source set, basis)` — all from **one winner at one basis**, never assembled across claims ([[mountable-filesystem-semantics#9. Ranked cracks and their likely homes]] row 4). Later lookups may resolve differently; the handle does not move.
- **An open directory handle pins its snapshot** (§1.6); changes appear on a new handle or explicit refresh.
- **Inode synthesis:** each distinct `(logical id, selected generation)` maps through a collision-checked mount-local table to a persistent 64-bit host id — never a truncated hash ([[mountable-filesystem-semantics#5. Synthetic inode and metadata policy]]). Shared DATA identity across multiple placements is exposed via `user.efs.id` metadata, not native hard links (WinFsp lacks them — the smallest common contract excludes them).
- **Bytes:** every range served verifies against the pinned commitment; chunk-proof carriers may serve ranges early, whole-hash carriers full-fetch-then-serve; `BYTES-UNAVAILABLE` is distinguishable from absence (carried from [[read-lens-spec#2.4 Flags]] and [[large-file-uploads]] grades — `BYTES-PARTIAL(k/n)` renders as a distinguishable IO condition, never a short read).

### 3.3 Portable-name projection profile

Canonical identity is EFS's grammar, not any host's ([[mountable-filesystem-semantics#3.7 Portable names need an explicit projection profile]]):

- **Canonical layer (freeze-adjacent, already C2-ruled):** NFC, byte-exact case, pinned Unicode version, the reject-superset (empty / `.` / `..` / `/` / NUL / C0+DEL / leading `~` / bidi + Cf controls / unassigned), `MAX_NAME_BYTES = 255` ([[fs-pass-synthesis]] C2). The rejected-leading-`~` rule is what makes the `~data` (§1.4.2) and `~efs` control-entry candidates collision-free — flagged as gap G-3 until the grammar row is confirmed in the recut.
- **Presentation layer (Durable profile):** a reversible escape for anything a host shell cannot represent (Windows reserved names/characters/trailing dot-space, case-insensitive collisions, normalization collisions); deterministic decoration for collisions (two canonical names that alias under a host's folding both get decorated forms — **neither** silently wins the undecorated name, so the projection never merges or drops); the canonical name always recoverable via `user.efs.*`/control API.
- **The acceptance shape:** one golden fixture of hostile names produces the same logical entries, hashes, and no aliasing on Linux/macOS/Windows ([[mountable-filesystem-semantics#12. Falsification tests]] test 10). Enumeration and lookup agree on canonical identity even where the host's own comparison rules differ.

How it breaks: an attacker publishes `CON`, `con`, `ＣＯＮ`, `readme.md ` (trailing space), and a 10k-codepoint bidi-spoofed name into a public folder. Every one lands in the reject-set or the decoration path; none is silently dropped (a dropped entry would be false absence); Explorer shows decorated forms; hashes match across hosts. The cost is ugliness under attack, which is the correct cost.

---

## 4. Enumeration and the mandatory index bundle

### 4.1 The indexes FS reads consume

Mapping the adopted bundle ([[owner-rulings]] 2026-07-15; [[onchain-completeness#3. THE EXPLICIT SIGN-OFF LIST]]; [review §7.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#7.1 Required policy-neutral state shapes)) to the FS operations that ride each:

| Index / state shape | FS consumer | Notes |
|---|---|---|
| Current exact slot (`slotHead`) + full-body spine | `lookup`, `getattr`, point property reads, contract point gates | the hottest read; bodies in state per items 17/18 (Etched by ruling) |
| Per-`(parent, principal)` child candidate stream | `readdir` candidate phase (§1.3) | **direct semantic children only**; ancestor visibility resolved separately ([review §7.1C](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#C. Per-principal child candidate stream) recommendation adopted as the FS-side requirement) |
| Container-scoped cross-author discovery page | untrusted/discovery listing (LC5 views), stranger-comment classes | DISCOVERY-flagged, never enters slot resolution ([[read-lens-spec#7.2 What discovery may never do]] carried) |
| Typed reverse index `(targetKind, targetId, definitionId)` | backlink views, "cited-by" control surface, deny point reads | the `definitionId`-carrying posting is the headline freeze change — a target-only posting forces O(all-postings) scans on hot targets ([[onchain-completeness#1. The finding that reorganizes everything]]) |
| LIST reverse membership + REDIRECT cited-by | list views, redirect provenance breadcrumbs | now-or-never rows, adopted |
| `contentHash → DATA` | dedup checks, "have I seen these bytes" (G-LEGAL-1) | keyed, bounded by matches |
| Best-mirror bounded view | byte-source ranking in `open/read` | zero new state, restored by ruling (item C) |
| Author self-enumeration (E4 shape open) | estate/recovery walk, `ls ~`, cache repair | §4.2 |
| Revocation-aware live state | live counts in control views; channel summaries | adopted "pay for it" (item E); never gates a contract without the exact-current invariant ([[human-overview#Decision 4]]) |
| Claimant roster / `claimantsBySemanticPosition` | optional cheaper point-resolution plan | measured E2 choice; semantics identical either plan ([review §8.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#8.1 Point resolution)) |

Every index states **which lane it indexes** once the authority lane lands (evidence vs authority admission — [[human-overview#7. The seams that must be closed]] seam 3); the FS profile's default drive reads **authority-lane state only**, with evidence-lane material reachable through explicitly-labeled views (handoff H-1, §8).

### 4.2 E4 stated crisply — author enumeration

The open mechanism question ([[owner-rulings]] 2026-07-15 item D; [[owner-decision-inbox]] E4), stated so the costing pass can answer it:

> **Claim to price:** roots-forward walking (recover on-chain roots, walk the already-required child indexes — ≈ free, Tier-1) covers everything placed under an owned root; the residual gap is **orphan claims** — records not reachable under any owned root (loose TAGs into others' containers, un-anchored claims, revoked-parent leftovers). The candidate mechanisms are (a) a full author-keyed index over every claim (1 word/claim, complete by construction) vs (b) roots-forward + a small **orphan-tail index** writing a posting only when a claim is admitted without a root-reachable parent.
>
> **What the FS core needs from either:** completeness (the estate/recovery journey [use-cases](./use-cases.md) G-FILES-2 is the floor — "everything I authored, from key alone, no indexer"), basis-pinned pagination obeying §1.6, and a closure proof so the walk's *end* is provable. **Decision rule:** smallest mechanism that still guarantees complete discovery, decided against the E2 snapshot ([[owner-decision-inbox]] E4's own wording) — with one FS-side warning: option (b)'s "root-reachable" predicate must be evaluated at admission time by the kernel (an admission-time property, cheap) and **not** re-derived at read time (a read-time reachability query is a graph traversal, exactly what the bundle exists to avoid). (PLAUSIBLE — the admission-time evaluability of root-reachability needs a kernel-lane check.)

### 4.3 Property enumeration rides child enumeration

`listxattr`/property listing needs "all property keys with resolved values at this node, complete at basis." Under [[codex-kinds]], property keys are KIND_PROPERTY child anchors of the node and values are VAL-edge slots at those anchors — so **point-property enumeration is the child-candidate machinery restricted to KIND_PROPERTY, plus point resolution per key**. No new index shape; the same closure, cursor, and one-basis rules (§1.6) apply verbatim. The bounded `user.efs.*` projection summarizes; the control API pages to closure; incomplete key enumeration is an IO condition, never "attribute absent" ([[mountable-filesystem-semantics#EFS properties as xattrs/EAs]]).

Definition enumeration (E5 — list all definitions/schemas) is **not FS-required**: no mount or gateway operation consumes a global definitions list. It stays its own cheap-if-wanted gate ([[owner-decision-inbox]] E5), unforced by this lane.

### 4.4 Qualitative read shapes, and E2 as the gate

Stated qualitatively (no number below is measurement-backed; **E2's one combined gas/state snapshot is the evidence gate for every cost claim in this section** — [[owner-decision-inbox]] E2):

- `lookup` (point): worst-case K slot probes for a K-principal rule, or the roster plan when the venue's lifetime claimant roster is sparse; plans chosen by a deterministic logical schedule, identical semantics either way ([review §8.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#8.1 Point resolution)). The review's isolated benchmark puts naive 50-principal × 64-item directory work in the tens-of-millions-of-gas class and roster-plan point reads in the ~1.4M class for sparse rosters ([review §9.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#9.2 Foundry experiment)) — shape evidence only, not kernel numbers.
- `readdir` page: fair-scheduled scan over selected authors' streams, bounded by per-author + total scan limits, returning per-author cursors; cost scales with scanned candidates (attackable to `K × M` overlap in the adversarial case, honestly resumable), never with global container history.
- `getattr` / property point read: O(1)-class keyed reads on the resolved winner.
- Backlink/cited-by page: O(page) over `(target, definitionId)`-keyed postings — the predicate in the key is what makes this true.
- `contentHash` lookup: O(matches).
- Self-enumeration: O(live tree) roots-forward + O(orphans) tail, or O(authored claims) full index — E4.
- Contract-side: point reads and small closed-set checks are Level-3 composable; wide directories are Level-2 (client-materialized at a pinned basis) by construction ([review §10](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#10. What “works on-chain” should mean); N2b's meaning of "works on-chain").

### 4.5 History amplification is an index-shape obligation (R-QC8)

A folder with 10 live entries and 100k revoked/superseded historical candidates must list within declared budgets ([[mountable-filesystem-semantics#12. Falsification tests]] test 17; [use-cases](./use-cases.md) R-QC8 — newly exposed by the mount ladder). This lane's ruling: **the cost must land in index shape, not daemon heroics** — a candidate stream that forces every reader to scan a century of tombstones fails the mount budget permanently, and no cache fixes first contact. The concrete fork is [review §7.1G](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#G. Century-scale current enumeration or explicit deferral): an exact current-live enumerable set, an authenticated compaction/snapshot with non-omission proof, or the explicit weaker promise (`O(history)` first bootstrap, warm reads efficient). The FS core can operate under any of the three **but the mount acceptance budgets can only be *promised* under the first two**; if E2 pricing forces the third, the mount requirement's budget language must be renegotiated with James rather than silently failed. That coupling — mount budgets ⇄ current-live index decision — is this lane's sharpest new finding for the costing pass (feeds E2; no new decision code invented).

---

## 5. Mount conformance (ruling 9)

### 5.1 The conformance table

Walking the [[mountable-filesystem-semantics#4. Cross-platform read-only mount contract]] operation set against this design. "Answer" = the section of this file (or carried source) that defines the behavior.

| Contract operation | Defined answer | Status |
|---|---|---|
| `mount(root, lens, realm+code basis, evidence basis, eval time, completeness policy)` | §2.2 five-part identity; §1.2 vocabulary check fails-closed on non-FS lenses | **defined** |
| `lookup(parent, name)` → PRESENT / ABSENT_PROVEN / UNKNOWN | §1.3 point resolution; §1.7 absence sources; §1.6 basis agreement; host mapping per [[mountable-filesystem-semantics#3.5]] | **defined** |
| `open_dir` → pinned directory handle | §1.6 snapshot pinning; §6.2 generations | **defined** |
| `read_dir(handle, cursor)` → deterministic page, stable cursors | §1.3 two-phase; §1.6 cursor binding; §4.1 candidate streams; sorting = client materialization at basis | **defined** |
| `get_attributes(entry)` (bounds) | §3.2 file-generation tuple; synthetic uid/gid/mode/time per [[mountable-filesystem-semantics#5]]; hybrid typing §1.4.2 | **defined** |
| `open_file` → pinned handle; `read(offset,len)` → verified bytes | §3.2 pinning; §3.2/§1.9 byte verification, range rules, BYTES-UNAVAILABLE/PARTIAL distinguishable | **defined** |
| `list_metadata` / `get_metadata` (xattr projection) | §4.3 property enumeration; §1.6 rule 4; bounded `user.efs.*` + lossless control API | **defined** |
| UNKNOWN rendering (never ENOENT, never negative cache) | §1.7 FSP-ABSENT-1/2 | **defined** |
| WHITEOUT / masked names | §1.5 (omitted from tree, inspectable in control surface) | **defined** |
| Redirect/symlink follow, cycles | §1.9 budget + `UNRESOLVABLE` mapping | **defined** |
| Rename/unlink/write/truncate/chmod/setxattr/etc. | all fail read-only ([[mountable-filesystem-semantics#Operation mapping]] carried); read-side rename resolution §3.1 | **defined** |
| Snapshot vs live refresh; open-handle stability while venue advances | §6.1–6.2 | **defined** (default = J-FS1 recommendation) |
| `statfs`, locks, watch/poll | carried unchanged from [[mountable-filesystem-semantics#Operation mapping]] (local staging capacity; local advisory locks; spine polling) | **defined (carried)** |
| Provenance/grade exposure | §1.11 | **defined** |

**Ruling-9 cross-check on every major choice in this file** (does anything foreclose the mount doing well?): the closed FS vocabulary (§1.2) exists *for* the mount's determinism; FSP-BASIS-1 exists *for* `readdir` correctness; FSP-ABSENT-1 makes `ENOENT` honest; FSP-HYBRID gives `stat` one answer; the portable-name profile (§3.3) is mount-first; §4.5 binds the index decision to the mount budget; the drive identity (§2.2) is the mount descriptor. The one choice that *could* have foreclosed it — grounding absence in author checkpoints, which would have made replica mounts claim `ENOENT` they cannot prove — is exactly what §1.7 removes. No choice in this file weakens a mount acceptance criterion; two (R-QC8 coupling, one-basis invariant) strengthen them.

### 5.2 Named gaps (not silence)

| # | Gap | Owner / gate |
|---|---|---|
| G-1 | **FSP-HYBRID final vectors** — the projection rule (§1.4.2) is constructed but unvectored; Phase-0 fixtures must confirm reversibility and three-host identity | mount profile owner; Phase 0 of [[mountable-filesystem-semantics#11. Suggested falsification ladder]] |
| G-2 | **Closure-proof wire shape** for `ABSENT_PROVEN` (state-proof format over index pages; bundle closure-manifest format) | kernel/index recut + SDK; priced in E2; blocked on final index ABI |
| G-3 | **Control-name grammar confirmation** — `~data` / `~efs` depend on the leading-`~` reject row surviving the C2 grammar recut | recut of [[fs-pass-synthesis]] C2 into the codex; vectors |
| G-4 | **Numeric budgets** (history amplification, cold/warm lookup/list, RPC/memory/disk) — qualitative shapes only until the E2 snapshot + mount benchmarks exist | E2 + mount Phase 2 |
| G-5 | **Same-author multi-device ordering** in one folder (two live devices, one slot, visible conflict rule) — the FS surfaces the deterministic LWW winner + loser (§1.8's baseline) but the *authoring-side* rule (device bits, envelope composition) belongs upstream | **handed to the authority/envelope lane** ([[fs-pass-synthesis]] C9-14 device-bit convention; [[mountable-filesystem-semantics#Open questions]]) |
| G-6 | **Live-follow invalidation ABI** — the dependency-head vector needs the kernel's `viewMutationVersion`-class delta surface, unfrozen ([review §15.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#15.1 Incremental cache invalidation)); until then live-follow mounts poll the spine with TTLs and honest staleness | kernel recut; E2 |

---

## 6. Snapshot vs following (the blind spot, made two products)

### 6.1 Live view and reproducible view are different products

- **Reproducible view (snapshot):** pinned five-part identity; every read answers from the pinned basis; citable, exportable, deterministic forever. This is what a citation, a court exhibit, a build input, and an `opendir` handle want.
- **Live view (following):** a *sequence* of reproducible views. Following is re-pinning, not un-pinning: the mount holds generation `Gₙ` (one basis, one lens acceptance), observes the venue advance, and atomically swaps to `Gₙ₊₁`. There is never a moment when one recursive walk sees two bases ([[mountable-filesystem-semantics#12. Falsification tests]] test 15).

### 6.2 Mount generations and refresh

- A generation = the five-part identity + evaluation time. Open handles (files and directory snapshots) **retain their generation** until closed; new opens see the current generation. Expiry (`STALE`) is evaluated against the generation's evaluation time, so results do not flap mid-walk.
- **Default recommendation: snapshot-with-explicit-refresh** for the required read-only mount (refresh-as-remount or an explicit atomic refresh control), with live-follow (auto-advancing generations under TTL/notification) as opt-in — this is J-FS1 (Decisions section), because determinism-vs-freshness for the flagship mount is a product-promise call, not an engineering one.
- Lens updates are generation changes too: a followed channel's new revision enters only through the acceptance ceremony ([review §13.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#13.4 Update ceremony)) and then only at a generation boundary.

### 6.3 Cache invalidation on revocation

A revocation changes a view without any new content claim, so `max(order)` and claim counts are unsound revision tokens ([review §15.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#15.1 Incremental cache invalidation) — adopted here as the FS cache law):

- Cache keys are the full view identity (§2.2) — never path-only ([[mountable-filesystem-semantics#12. Falsification tests]] test 3's cross-lens contamination is the failure this kills).
- Cache *reuse across generations* requires the complete dependency-head vector (venue basis, kernel codehash, `EffectiveLensId` + acceptance floor, per-author view-mutation versions **including revocations**, KEL/delegation versions from the authority lane, advisory versions, next expiry boundary). Until the kernel freezes a view-affecting mutation/delta surface (gap G-6), a live mount's only honest options are bounded TTL + spine polling, or full re-pin — both permitted, both labeled.
- Kernel/adapter negative caches obey §1.7: no negative entry without a closure proof at the generation's basis; host-layer entry/attr TTLs are bounded and flushed on generation swap.

### 6.4 What an offline export proves

An `.efs-bundle` export ([use-cases](./use-cases.md) R-PA3) of a drive at generation G proves, to anyone, forever:

1. **Authenticity:** every record verifies from bytes alone (signature over canonical envelope bytes) — unconditional.
2. **Admission at basis:** with the bundle's state-root commitment + proofs, that the venue's state at G's basis contained these slots/indexes — a *historical* fact that chains-don't-die makes re-checkable against the live chain at any later time (the bundle is a convenience, the chain is the arbiter; this is the ruling's pruning-defense role, not chain-death insurance).
3. **Completeness at basis:** with the closure manifest (§1.7 source 3), that the enumerations were complete at G — so `ABSENT_PROVEN`-at-G is portable.
4. **Never:** currency. An export asserts nothing about revocations, supersessions, or admissions after its basis; a reader who needs "now" queries the venue. Every rendered grade from a bundle carries `AS-OF(basis)` — the [[read-lens-spec#5.1 THE honest table]] last-column humility with the dead-chain framing removed per [[owner-rulings]] 2026-07-10.

---

## 7. How it breaks — the consolidated adversarial walk

Each row: attack → the rule that answers → the residual that stays honest.

| Attack | Answering rule | Honest residual |
|---|---|---|
| **10k-child hostile-name folder** fed to the kernel-facing daemon (reserved names, bidi spoofs, normalization twins, 255-byte names) | §3.3 reject-set + reversible decoration; no silent merge/drop; metadata ops never hydrate bodies ([[mountable-filesystem-semantics]] crawler rule) | ugly decorated names; attacker pays gas per entry ([use-cases](./use-cases.md) R-MODE4) |
| **Redirect/symlink cycle farms** | §1.9 budget 8 + visited set → deterministic `UNRESOLVABLE` | attacked entries unreadable — correct |
| **Property floods** (8 KiB values, thousands of keys) | §4.3: bounded convenience projection + paged control API; `listxattr` never truncates silently ([[mountable-filesystem-semantics#12]] test 11) | listing the flood costs pages; budgets + resumability |
| **Basis race between pages** (venue advances mid-`readdir`) | FSP-BASIS-1 + cursor binding (§1.6) | staleness of the pinned snapshot, displayed |
| **Revoked-mid-enumeration** (winner revoked between page N and N+1) | snapshot answers at its basis (still-present, labeled basis); next generation shows empty-on-revoke; no resurrection ([[read-lens-spec#1.3]] carried) | a snapshot is honestly a snapshot |
| **Two-drive name shadowing** | §2.3: no implicit merge; merged views need realm-labeled tiers (§2.4) | user-composed unions can still confuse the user — ceremony + labels, not prevention |
| **Withheld directory page / censoring RPC** | §1.7: no closure → UNKNOWN → transient error, never ENOENT | availability loss is visible, not silent |
| **Spam past the budget** (push honest entry beyond scan limits) | `INCOMPLETE_BUDGET` + resumable cursors; fair per-author scheduling (§1.3) | listing cost rises; completeness never lies |
| **Malicious curator whiteout** | §1.5 attribution + update-ceremony diff + own-tier override | inattentive subscribers still inherit their curator's mask |
| **Removed/revoked curator exposes squatter** | §1.10 per-rule relinquish declaration + semantic diff | overlay scopes that *chose* fallthrough get fallthrough |
| **Stolen key, backdated record** | FS surfaces the authority axis verbatim (§1.11); rejection is the strong grade's job — **authority lane** ([aa-inversion](./aa-inversion.md)); weak grade structurally cannot promise it (ruling 7) | pre-revocation window forgeries irreducible in any design |
| **Thief declares a different home** | FS never reads `home` for authorization (§1.9); realm-qualified display (§2.3) | the topology-level answer is held N1/J4 — the FS is safe under *any* outcome because it never trusts the row |
| **Stale cross-chain snapshot presented as current** | venue-qualified receipts + AS-OF labels (§6.4, §2.3) | a reader who ignores labels can still be fooled — labeling is the floor, client UX the fence |
| **Equivocating channel head** (different revisions to different subscribers) | channel anchor state (`CHANNEL_CONTESTED` sticky) + generation acceptance (§6.2, [review §4.4](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#Channel update protocol)) | detection not prevention; needs the anchor summary in the bundle |
| **Hostile bytes from a fast mirror** | content-before-carrier + per-range verification (§3.2) | `CONTENT-MISMATCH` errors; availability ≠ authority |
| **Daemon resource exhaustion** (stalled remote, unbounded graph) | bounded work/deadlines/abortable mount ([[mountable-filesystem-semantics#7. Architecture sketch]]) | a stalled source degrades to UNKNOWN-class errors, never wrong answers |

---

## 8. Seam disposition and handoffs to the authority lane

| Seam ([[human-overview#7. The seams that must be closed]]) | Disposition by this lane |
|---|---|
| **6 — false equivocation / false absence** | **CLOSED (rule text delivered):** §1.8 deletes the global same-`(principal, order)` rule and scopes collision evidence to the exact slot; §1.7 grounds absence in venue-state closure and demotes author checkpoints to advisory. Remaining measured choice: whether `SAME_SLOT_COLLISION` earns Etched state (E2 bundle). |
| **7 — lens object too weak** | **CLOSED for the filesystem:** typed model adopted; FS-LENS/1 is the compiled instance (§1.1–1.2); orthogonal grade axes (§1.8); per-rule relinquish declarations (§1.10). The full replacement read-spec (all purposes, GATE profiles, package lenses) remains the lens lane's document; this profile is its first chapter, not its whole. |
| **1 — full-width principals** (FS side) | **Requirement stated, fix upstream:** every FS-visible ID, index posting, roster, cursor, receipt, and URL projection carries full `bytes32` principals or a lossless venue ordinal with exact dictionary ([review §7.2](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#7.2 Never truncate principals)); the [[deterministic-ids]] `uint160(attester)` formulas are the known defect; the recut is a bug fix, not a choice ([use-cases](./use-cases.md) R-PA5). **Handoff H-3.** |
| **2 — envelope identity** (FS side) | **Requirement stated:** citations, receipts, and cache keys need exactly one suite-neutral envelope/claim identity; the FS core consumes whatever single identity the envelope recut produces and breaks under two. **Handoff H-4.** |
| **3 — evidence vs authority lanes** (FS side) | **Requirement stated:** every index row/page the FS consumes must be labeled with its lane; the default drive resolves from authority-lane state; evidence-lane material appears only in labeled views; the authority axis value on every read comes from the authority lane's bounded ABI (`AuthReceipt`/ordinal or `PORTABLE-EVIDENCE`). The FS profile allocates the surface (§1.11) and refuses to compute the value. **Handoffs H-1, H-2.** |

**Handoff register:** H-1 lane labels on all indexes (authority lane + kernel recut). H-2 authority-axis ABI for read results (authority lane; [aa-inversion](./aa-inversion.md) §3.6's receipt store is the presumptive supplier). H-3 full-width recut + vectors (envelope/IDs recut). H-4 single envelope identity (envelope recut). H-5 same-author multi-device authoring rule (gap G-5). H-6 view-mutation/delta ABI for live-follow caches (kernel recut, gap G-6).

---

## Reconciliation ledger

Existing choices/requirements this file touches, disposed explicitly:

1. **Mandatory automatic indexing + the A–E bundle ([[owner-rulings]] 2026-07-15)** — **still-valid, consumed:** §4.1 maps every FS read onto it; **newly-exposed:** the mount-budget ⇄ current-live/compaction coupling (§4.5) tightens what E2 must price.
2. **Full-body spine + no-elision (items 17/18)** — **still-valid**; §6.4's export/replay proofs and §4.1's point reads are consumers.
3. **No on-chain collision bit; closed sets + challenge windows (item F)** — **still-valid, not reopened:** §1.8 rule 4 restates it; `SAME_SLOT_COLLISION` (client-visible evidence, optional Etched state) is a *different object* than the rejected TOCTOU-defeated gate bit and is E2-gated.
4. **Chains-don't-die ([[owner-rulings]] 2026-07-10)** — **still-valid;** §2.4/T1: the FS read path carries no chain-quality tiering; bundle proofs are pruning defenses, not death insurance (§6.4).
5. **[[read-lens-spec]] flat lens + global same-order equivocation + old KEL grades** — **superseded** by §1 (this profile is the replacement seed); the spec's anti-fallthrough, deny composition, follow policies, LC1–LC6, verification order, and acceptance-suite discipline are **carried** re-typed.
6. **[[read-lens-spec#5.2]] checkpoint-grounded `PROVEN-ABSENT(asOf N)`** — **superseded** by FSP-ABSENT-1/2 (§1.7): checkpoints stay ordinary claims (held Q4A untouched) but lose the absence-prover role, per seam 6. Replica absence now requires venue-state proofs — a real capability change whose wire shape is gap G-2.
7. **[[read-lens-spec#5.4]] MUST-pull-home via the `home` reserved key** — **suspended pending the authority-lane topology answer:** `home` is advisory-only under every candidate topology (seam 9); currency policy re-expressed against the drive's own basis age (§1.9, §6). Not deleted — if the authority lane lands a canonical locator, a MUST-pull equivalent can return against *that*, not against the ordinary row.
8. **[[fs-pass-synthesis]] C2 (grammar), C5 (WHITEOUT), C8 (view-parameter pinning), master-table dispositions** — **still-valid, consumed** (§3.3, §1.5, §2.2); C8's view parameters are exactly the five-part identity.
9. **Held D-9 / on-chain lens promise** — **not re-asked;** §1.3 and §4.4 are written against choice A (bounded candidates + point resolution + fixed-basis materialization) and record that the FS profile is that choice's strongest consumer — evidence *for* the held item, not an answer to it.
10. **Held Q4 (checkpoints), Q5 (fail-closed SDK default)** — **untouched/consistent:** Q4 per ledger #6; Q5's fail-closed posture is assumed by every GATE-context rule here.
11. **Read-only mount requirement ([[owner-rulings]] 2026-07-22)** — **still-valid, discharged into a conformance table** (§5.1); six named gaps (§5.2), none silent; no choice forecloses the writable follow-up (§3.1).
12. **[[mountable-filesystem-semantics]] open questions** — **partially answered:** hybrid projection (FSP-HYBRID, pending vectors), mount-generation identity (§2.2/§6.2), closure/cursor shape (normative requirement stated, wire shape G-2), control-entry candidate (`~efs`/`~data`, pending G-3), refresh default (J-FS1 to James), errno mapping (carried), snapshot-profile question (J-FS2 to James).
13. **[[onchain-completeness]] Line + sign-off list** — **still-valid;** §4 consumes it; E4 restated crisply (§4.2) with one new FS-side constraint (admission-time root-reachability); E5 released from FS pressure (§4.3).
14. **Lens review recommended-now items 1–15 ([review §18.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#18.1 Decisions recommended now))** — **adopted as working direction for the FS profile** (they are the §1 substrate); their formal adoption remains the lens lane's packet, per the sequencing hold.
15. **[use-cases](./use-cases.md) register rows R-QC1/2/3/6/7/8, R-HP1–5, R-PA2/5, R-BA2/8** — **consumed as the falsification target;** this design satisfies each on paper; R-QC8 upgraded from register row to index-shape coupling (§4.5).
16. **Two-grade authority hypothesis (pass ruling 3) + kel.md maximal topology + N1 axes (T4)** — **kept separable:** the FS profile consumes only the authority *axis value* (§1.11, H-2), is topology-blind (§1.9 `home` demotion, §2.3 realm qualification), and forecloses neither; T4 discharged for this lane.
17. **Sequencing hold ([[owner-rulings]] 2026-07-23)** — **complied with:** no held N/Q/E item is re-asked; the two Decisions below are new, FS-surfaced, and independently answerable.

---

## Decisions for James

Only items this lane genuinely surfaces for the owner. Held items are fed, not re-asked.

### J-FS1 — Default currency mode for the flagship read-only mount

**Example:** Dana mounts a public court-records drive Monday and leaves it mounted. Wednesday the publisher adds a folder. Does Dana's Finder window silently gain a folder mid-week (live-follow), or does her mounted view stay exactly Monday's until she clicks refresh (snapshot generations, refresh-as-remount)?

- **A — Snapshot-with-explicit-refresh is the default; live-follow is opt-in per mount.** Every walk, build, and hash over the mount is deterministic by default; freshness is one visible action away; open handles never flap. **Recommended** — determinism is what makes the mount citable and testable ([[mountable-filesystem-semantics#12. Falsification tests]] test 15 becomes trivially true), and the mount is the archive's face: an archive that changes under your feet reads as untrustworthy.
- **B — Live-follow (bounded TTL) is the default; snapshot is opt-in.** Fresher out of the box, matches network-drive intuition; costs determinism, needs the unfrozen invalidation ABI (gap G-6) to be honest, and makes "why did my second `sha256sum` differ" a support question forever.

Reason trail: §6.1–6.2 here; [[mountable-filesystem-semantics#Open questions]] ("refresh automatically or only at remount"); [review §15.1](../2026-07-11-efsv2-lens-architecture-and-scale-review.md#15.1 Incremental cache invalidation) (why live caches are hard to make honest).

### J-FS2 — Which mount profiles does v2 promise?

**Example:** a research tool wants a permissive mount that shows provisional winners when evidence is incomplete, so browsing never blocks. An ordinary app cannot read grade labels, so whatever the mount returns *is* the truth to it.

- **A — v2 promises exactly two profiles: the strict live mount (uncertainty fails with transient errors) and the snapshot mount (complete-at-manifest, grade-free for ordinary apps). A graded/permissive mount is research-only, never shipped as an ordinary drive.** **Recommended** — [[mountable-filesystem-semantics#3.5]]'s own analysis: a metadata label cannot make a provisional winner safe for an application that never inspects it; the permissive mount is inherently lossy and belongs behind a research flag, not in the product line.
- **B — Ship a third, graded/permissive profile as a supported mode.** More available under bad networks; institutionalizes exactly the silent-fallthrough class every falsification test exists to kill.

Reason trail: §1.7 here; [[mountable-filesystem-semantics#3.5 EFS absence can be UNKNOWN; POSIX lookup wants an answer]] (the two-profile argument); [use-cases](./use-cases.md) R-HP2.

*(Fed, not asked: D-9/on-chain lens promise — ledger #9; E4 mechanism — §4.2 restates it for the costing pass; the FSP-HYBRID projection and control-entry names are delegated technical gates per [[owner-decision-inbox#Delegated technical gates — not owner votes]], escalating only if vectors show product-visible harm.)*

---

## Confidence

**VERIFIED (read directly this pass):** the reopened status and content of [[read-lens-spec]] (its banner, pins, §2–§8); the typed-model rulings, channel protocol, index shapes, benchmark tables, and coherence ledger of the [lens review](../2026-07-11-efsv2-lens-architecture-and-scale-review.md); the mount contract, adapter caveats, cracks table, and falsification ladder of [[mountable-filesystem-semantics]]; the adopted rulings cited from [[owner-rulings]] (mandatory indexing, spine/no-elision, no-collision-bit, chains-don't-die, mount requirement, 2026-07-23 corrections and sequencing hold); the eleven seams of [[human-overview#7]]; [[onchain-completeness]]'s Line and sign-off list; [[codex-kinds]] amendments; [[fs-pass-synthesis]] C1–C14 and the master table; the [use-cases](./use-cases.md) register rows cited; [aa-inversion](./aa-inversion.md) §0–1's grade naming.

**PLAUSIBLE (constructed here; falsifiable by the critic, vectors, or the costing pass):** the claim that every FS behavior fits the review grammar without extension (§1.1); FSP-HYBRID's specific projection choices (§1.4.2 — gap G-1); the sufficiency of the three FSP-ABSENT-1 sources and the completeness of the FSP-ABSENT-2 exclusion list (§1.7); the one-basis invariant's five consequences as stated (§1.6); the claim that property enumeration needs no new index shape (§4.3); the admission-time evaluability of orphan-tail root-reachability (§4.2); the mount-budget ⇄ current-live coupling's strength (§4.5); the two-drive/merged-view analysis (§2.3–2.4); both James recommendations.

**Could not verify:** any gas/cost number (E1/E2 open; the review's benchmark figures are isolated-model shape evidence only — [[owner-rulings]] 2026-07-23 "none of the chain/authority space is measurement-backed"); whether the C2 leading-`~` reject row survives the grammar recut (G-3 — the control-name scheme depends on it); the final envelope identity and lane-labeling shapes (handed off, H-1..H-4); [[assumptions-and-requirements]] was consulted only through its citations in other documents (R-K11, D-numbering), not re-read in full this pass — a cross-check of FSP-* rules against its requirement register is owed to the synthesis lane; the exact `SAME_SLOT_COLLISION` kernel surface (deliberately left as an E2-measured choice, §1.8).
