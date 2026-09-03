# S11 — Decided-but-docs-disagree sweep

**Lane:** S11-decided-but-docs-disagree · **Reviewer date:** 2026-09-03 · **Vault HEAD:** `234c3e6` (2026-08-30)
**Seam:** every owner ruling and direct direction versus every current doc.
**Method:** read `Designs/efsv2/owner-rulings.md`, `Decisions.md`, `Retirements.md`, `Open-Decisions.md`,
`Designs/web-client-os/README.md`, `Designs/efsv2/{README,system-constitution,core-architecture-candidate,owner-decision-inbox,hierarchical-files-and-folders}.md`,
`Designs/{README,owner-decision-inbox,sdk-v1-bridge-v2-compat-asks}.md`, `Designs/media-library/owner-rulings.md`,
`Kanban.md`, `Milestones.md`, `Glossary.md`, `Onboarding/authority.md` in full or by section; grepped the whole
vault for each ruling's load-bearing phrase; ran `./scripts/needs-integration.sh --brief` and
`./scripts/open-decisions.sh --check` read-only; used `git log` for reconciliation evidence; cross-read the
`readiness`, `sdkv2` and `data-explorer` worktrees. Nothing under the planning vault was modified.

**Verdict: STRAINED, trending broken on the process side.** The design content is mostly consistent with what
James ruled. What has failed is the *machinery that is supposed to make a decision stick*. Three things are
true at once: (1) the newest and most consequential owner directions — the twenty-eight of 2026-08-14 →
2026-08-23 — are recorded nowhere the vault's own tooling can see, so they cannot be tracked, retired, or
propagated; (2) `Retirements.md`'s Active table has been empty since 2026-08-12, which makes the
"decided but not integrated" audit pass **vacuously** — its green light says nothing about integration; and
(3) the one place the Core spine was told to reconcile itself (`web-client-os/README.md:333`, an explicit
2026-08-14 handoff to the EFS v2 PM) shows **zero commits in `Designs/efsv2/` in the twenty days since**.
The result is a design surface where the owner's MVP-defining direction ("the first MVP must be an official
write-capable File Browser") is contradicted by the Core inbox, the Core constitution, and — on the unmerged
branch most likely to be merged — by a candidate default that reinstates exactly the read-product-plus-debug-page
shape the owner rejected.

---

## 1. The ruling ledger and what still contradicts it

Ledger sources: `Designs/efsv2/owner-rulings.md` (2026-07-10 → 2026-08-12), `Decisions.md` (2026-08-07,
2026-08-08), `Designs/media-library/owner-rulings.md` (2026-08-14), `Designs/web-client-os/README.md` §"Direct
owner direction recorded for this round" (WCO-1…28, 2026-08-14 → 2026-08-23, undated per item, unattributed
per item). Two 2026-08-22 founder rulings exist only on the unmerged `sdkv2` branch.

| Ruling / direction | Date | Contradicting doc:line | Exact phrase | Proposed `Retirements.md` phrase |
|---|---|---|---|---|
| WCO-2 first MVP is a **write-capable** File Browser | 2026-08-14 | `Designs/efsv2/owner-decision-inbox.md:56-60` | "Then decide **whether the first Web Client also needs writes** and how it is packaged relative to EFS OS." | `also needs writes` |
| WCO-2 (same) | 2026-08-14 | `Designs/efsv2/system-constitution.md:358-359` | "Does the first Web Client ship only read-only Files plus one Arcade view, **or also explicit writes**?" | `or also explicit writes` |
| WCO-2 (same) | 2026-08-14 | `readiness:Designs/efsv2/system-constitution.md:386` | "First product loop \| **Direct no-wallet raw Explorer plus minimum read-only Files profile. Writes** … **follow** the lossless Reader seam." | `minimum read-only Files profile` |
| WCO-2 (same) | 2026-08-14 | `readiness:Designs/efsv2/mvp-build-start-packet.md:206` (§"What is **not** an MVP blocker") | "polished Explorer filesystem UX, extensions, **writes**, app store, Git forge, or collaboration suite" | — (needs a re-ruling, not a phrase) |
| 2026-07-22 "contraction gate comes later … **only then choose the MVP**" | 2026-07-22 | `Designs/web-client-os/README.md:44` | "The first MVP **must be** an official write-capable File Browser" | — (the newer direction wins; the older sequencing line needs an explicit superseded note in `owner-rulings.md`) |
| WCO-7 uniform `PrincipalId` + mutable default controller + exact signer | 2026-08-14 | `Designs/efsv2/owner-rulings.md:216` (2026-08-12) | "**Open, not ruled:** whether every author-facing API uses `PrincipalId`…" | `Open, not ruled: whether every author-facing API uses` |
| WCO-7 (same) | 2026-08-14 | `Designs/efsv2/owner-decision-inbox.md:15-21` (V2-E1) | "James's preference is one semantic Principal surface; **it is not frozen until the comparison proves it honest and simpler**." | `not frozen until the comparison proves it` |
| WCO-7 (same) | 2026-08-14 | `Designs/efsv2/core-architecture-candidate.md:410` (bakeoff table) | "Author surface \| **tagged Account or Principal** \| PrincipalId everywhere + intrinsic account Principal" | — (legitimate bakeoff; needs a dated "owner preference recorded" note) |
| WCO-8 64-Principal Lens target | 2026-08-14 | **no contradiction found** — `owner-decision-inbox.md:28` (1/8/32/64), `system-constitution.md:309`, `core-architecture-candidate.md:450`, `lens-spec.md:97` all agree; the retired `MAX_LENSES = 20` survives only in v1/SDK-historical text (`Designs/sdk-architecture.md:886,1089,1164`) and `Reviews/` | — | — |
| WCO-9 NFC rich Unicode names | 2026-08-14 | near-agreement: `Designs/efsv2/hierarchical-files-and-folders.md:129` says "The **primary experiment arm** is a rich, case-sensitive Unicode name" and `Kanban.md:15` says "Rich Unicode … remain measured **proposal arms**" | `primary experiment arm` / `measured proposal arms` | `Rich Unicode … proposal arm` (modality only) |
| WCO-10 Sepolia = first development Commons | 2026-08-14 | **no contradiction found** — `Designs/efsv2/README.md:9,30,45` and `Kanban.md:42` already say it; `system-constitution.md:88` "No home chain or operator is selected" is compatible (Sepolia is a dev Commons, not a canonical venue) | — | — |
| WCO-11 reclaim `contracts`, `sdk`, `webclient`, `drive` | 2026-08-14 | `Designs/efsv2/hierarchical-files-and-folders.md:5` | "**Proposed new repos:** core, os, drive; contracts/client remain legacy evidence" | `Proposed new repos: core, os, drive` |
| 2026-07-10 chains don't die (+ ordered editorial sweep) | 2026-07-10 | `Designs/efsv2/onchain-completeness.md:130` | "[ ] **Dead-chain fire drill** run with a reverse-query assertion" (unchecked; doc header line 3 still claims to be "**the authoritative on-chain/off-chain ruling**") | `Dead-chain fire drill` |
| 2026-08-07 GitHub-class collaboration stays expressible | 2026-08-07 | **no contradiction found** — Stage A carries the fixtures: `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:497,499,800` (`Issue/1`, `Review/1`, `PullRequest/1`, `Reaction/1`, `TeamMembership/1`, `Edit/1`) and `chapters/traceability.md:312` marks OR-G2 **COVERED** | — | — |
| 2026-07-22 three-host read-only mount **REQUIRED** | 2026-07-22 | `Designs/web-client-os/README.md:413` + `mvp-and-acceptance.md:853` route it to "**OS Drives**", a lane with no folder, no README, no inbox, no Kanban card | `OS Drives owns … three-host validation` | `OS Drives` (until the set exists) |
| 2026-08-08 greenfield: no v1 support/compat/migration/bridge | 2026-08-08 | `Designs/sdk-v1-bridge-v2-compat-asks.md:13` (`#status/review`) | "The 2026-08-07 v1-bridge ruling **supports** v1 + the SDK for Nanda/Arcade… commitments the v2 design can adopt **now** that convert 'real data accumulates on v1, then v2 severs it' … into a bounded, mechanical **import**." | `v1-bridge ruling` ; `keep it importable` |
| 2026-08-08 greenfield (same) | 2026-08-08 | `Designs/efs15/requirements-and-boundaries.md:36` | "\| **Adopted owner direction** \| **v1 plus the existing SDK is the supported bridge** for current Nanda and Arcade work. \|" | `is the supported bridge` |
| 2026-08-08 greenfield (same) | 2026-08-08 | `Decisions.md:24-25` | the two 2026-08-07 entries carry **no reversal marker** although `Decisions.md:15` instructs "Mark reversed/irrelevant decisions or delete outright" | — (annotation, not a phrase) |
| 2026-08-12 layer boundary / Core-standalone | 2026-08-12 | `Milestones.md:32-35` (edited **2026-09-02**) | "The **Client v2 design set** is `Designs/clientv2/README.md`" — `Designs/web-client-os/` is never mentioned | `The Client v2 design set is` |

**Vault-process note.** Only three of the rows above can be tracked by `Retirements.md` today, and **none of
them is tracked**: the Active table (`Retirements.md:17-21`) has been empty since the last clear on 2026-08-12.

---

## 2. Priority checks, one by one

**(a) MVP includes writes — DRIFT, blocking.** WCO-2 (`Designs/web-client-os/README.md:44-47`) is unambiguous:
"The first MVP must be an official write-capable File Browser, **not a read product plus a substitute debug
page**." Twenty days later `Designs/efsv2/owner-decision-inbox.md:56-60` still ends V2-E6 with "Then decide
whether the first Web Client also needs writes", and `system-constitution.md:358-359` still carries it as an
unresolved `- [ ]` open question. Both files are the ones the pre-promotion checklist gates on. On the
`readiness` branch it is worse than unreconciled — it is reversed (see F2).

**(b) Uniform `PrincipalId` — DRIFT of modality plus a real MISSING mechanism.** `core-architecture-candidate.md:236`
already opens "All semantic authorship, author indexes, and Lens entries use `PrincipalId` at the API
boundary", so the *surface* agrees with WCO-7. Two things do not. First, `owner-rulings.md:216` (2026-08-12)
and `owner-decision-inbox.md` V2-E1 still record the question as open/unfrozen, and the bakeoff table
(`core-architecture-candidate.md:410`) still offers the tagged-`Account | Principal` arm — legitimate as
engineering, but nothing anywhere records that the owner has since expressed the preference as a client
requirement. Second, and substantively: WCO-7 posits a Principal with **three controller keys** and a mutable
preferred account, and requires that "every operation still names and historically verifies its actual signer
descriptor". The Core MVP candidate cannot express that — `AccountPrincipal/1 = { authorityKind,
originIfRequired, accountOrKey }` is one account per Principal, and multiple actors/rotation are explicitly
deferred to "**Later** managed Principals" (`core-architecture-candidate.md:253-257`). Meanwhile
`Designs/web-client-os/architecture-and-modules.md:172-173` builds on "a Principal's **historical controller
state**". The string `signer descriptor` appears **zero** times anywhere in `Designs/efsv2/`.

**(c) 64-Principal Lens target — no contradiction.** V2-E2's 1/8/32/64 grid is a measurement grid that
contains 64, and `Designs/efsv2/lens-spec.md:97` records "`MAX_LENSES = 20` is retired by the
two-caps-plus-budgets structure". The stale `MAX_LENSES = 20` text that remains is in `Designs/sdk-architecture.md`
(:886, :1089, :1164) and `Reviews/` — historical v1 SDK material that `Designs/README.md:81`-region already
labels "Historical SDK API surface". Not a finding; recorded so the sweep is complete.

**(d) NFC rich names — aligned; residual modality drift only.** `hierarchical-files-and-folders.md:130-145`
specifies exactly the rich, case-sensitive, NFC-normalized `FilesName/1` WCO-9 asks for, with reversible host
aliases handled in `mountable-filesystem-semantics.md:287-297`. There is no competing ASCII/restricted arm.
The only mismatch is that the Files doc calls it "the **primary experiment arm**" (:129) and `Kanban.md:15`
calls rich Unicode a "measured **proposal arm**", while WCO-9 states it as settled direction.

**(e) Sepolia first development Commons — no contradiction.** `Designs/efsv2/README.md:9,30,45` already carries
it with the correct caveat. `system-constitution.md:88` ("No home chain or operator is selected") and
`owner-decision-inbox.md` V2-E7 ("Do not select a chain yet") are about the *permanent* venue, which WCO-10
explicitly does not choose. Not a finding.

**(f) Chains don't die — holds in the current spine; the ordered cleanup never ran.** The current spine
designs for a live chain: `system-constitution.md:205-221` requires reconstruction "from the declared Realm
state plus declared byte carriers", not from dead-chain headers. The 2026-08-12 Commons criteria
("reconstructability … and exit", `owner-rulings.md:193-197`) are venue-selection risk, not chain mortality —
no contradiction. What *did* not happen is the ruling's own follow-up: "sweep the docs (read-lens-spec,
identity, ops-doctrine, codex-*) and strip dead-chain hedging language" (`owner-rulings.md:17`). Those four
docs are in fact clean; the residue is elsewhere — `onchain-completeness.md:130` still carries an unchecked
"Dead-chain fire drill" gate, `freeze-gates.md:50` still lists it (that file does carry a 2026-07-12
supersession banner at :10), and `onchain-completeness.md:3` still self-labels "**the authoritative
on-chain/off-chain ruling**" despite the 2026-08-12 reset demoting July mechanism docs to evidence.

**(g) GitHub-class collaboration — COVERED.** The 2026-08-07 direction's stated obligation was that "the E2 /
portable-schemas fixtures should carry forge objects (issue/PR/review/release)". They do:
`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:497-499` defines `Issue/1` and
`Review/1`, :800 lists the full collaboration cluster "all clonable: plain Records + occurrences, no Core
primitive", and `chapters/traceability.md:312` marks row OR-G2 **COVERED**. `system-constitution.md:311`
carries the matching acceptance test. Not a finding.

**(h) Three-host mount — MISSING owner.** The 2026-07-22 ruling is emphatic ("ADOPTED… **must** expose a useful
read-only mounted filesystem on Linux, macOS, and Windows"; "A Linux-only prototype does not finish the
requirement"). It survives in `system-constitution.md:316` as a freeze acceptance test and in `Kanban.md:42`
as one clause of the Core-hardening card. But the product-layer set explicitly excludes it from MVP
(`product-constitution-and-roadmap.md:246` out-of-scope list ends "… full Shell, **native mounts**") and hands
ownership to "**OS Drives**" (`web-client-os/README.md:413`, `mvp-and-acceptance.md:853`) — a lane with no
design folder, no README, no owner queue, and no card. The requirement has a gate and no owner.

**(i) 2026-08-07 v1-bridge rulings vs 2026-08-08 greenfield — NOT marked superseded.** `Decisions.md:24` ("Open
an EAS-backed EFS 1.5 bridge…") and `:25` ("EFS v1 plus the existing SDK **is the supported bridge**…") carry
no reversal annotation, even though `Decisions.md:15` instructs "Mark reversed/irrelevant decisions or delete
outright" and `:23` (2026-08-08) reverses them in substance. Two live-looking rulings sit one day apart. Two
downstream docs still act on the older one: `Designs/sdk-v1-bridge-v2-compat-asks.md` (a `#status/review`
design, unlisted in `Designs/README.md`'s content map, asking the v2 design for v1-import commitments) and
`Designs/efs15/requirements-and-boundaries.md:36` (labels it "**Adopted owner direction**"). The `Retirements.md`
row that should have caught both used the phrase `v1 is the supported product bridge`; neither doc uses that
exact wording, so the scanner reported zero hits and the row was moved to **Cleared** on 2026-08-08 while the
contradiction stood.

---

## 3. Lane question 3 — has anything moved for the 2026-08-14 handoff?

`Designs/web-client-os/README.md:333-339` states: *"**Upstream synchronization note (2026-08-14):** the owner
directions recorded above arrived after several EFS v2 spine/candidate passages were written. Some still
present the uniform Principal surface, MVP writes, and rich-name posture as open or use older recommendation
text. **The EFS v2 PM has the exact reconciliation handoff.**"*

Git evidence, HEAD `234c3e6` (2026-08-30):

```
$ git log --since=2026-08-14 --format='%h %ad %s' --date=short -- Designs/efsv2/
5d1242e 2026-08-14 design: draft layered Type system and Data ABI
da5fcc3 2026-08-14 design: draft modular Web Client and OS spine
02bdae9 2026-08-14 design: draft hierarchical Files foundation
```

Those three are the same-day commits that *created* the handoff, not responses to it. Per-file last-touch:

```
2026-08-13 c48f252 Designs/efsv2/system-constitution.md
2026-08-13 c48f252 Designs/efsv2/core-architecture-candidate.md
2026-08-13 c48f252 Designs/efsv2/owner-decision-inbox.md
2026-08-13 c48f252 Designs/efsv2/owner-rulings.md
2026-08-14 5d1242e Designs/efsv2/README.md
2026-08-14 02bdae9 Designs/efsv2/hierarchical-files-and-folders.md
```

**Answer: nothing.** The three documents that carry the contradictions (constitution, candidate, inbox) and the
ruling ledger itself have not been touched since **2026-08-13** — the day *before* the handoff was written.
`Designs/web-client-os/README.md` itself was last touched 2026-08-26, so the product set kept moving while the
Core set stood still. Twenty days, zero reconciliation commits. (The `readiness` branch does rewrite all four
files — but it resolves the Principal question in the direction's favour and the MVP-writes question **against**
it; see F2.)

---

## 4. Lane question 4 — rulings the vault process cannot track, and the phrases that would fix that

`Retirements.md` is the only mechanism that converts a ruling into a mechanical work order, and its Active
table is empty (`:17-21`); the newest Cleared row is 2026-08-12. Every ruling and direction since then is
untracked. `Retirements.md:15` allows an escape ("Rulings that can't reduce to a phrase … track them as normal
design work") — but nothing tracks them as design work either: `web-client-os` has no inbox, so
`Open-Decisions.md` cannot see it (`:71-78` Queue health lists arcade, clientv2, efsv2, media-library,
open-web-app-store, Designs-root — **not** web-client-os).

Proposed Active rows (phrase → replacement → ruling → since):

| Retired phrase | Replacement | Ruling | Since |
|---|---|---|---|
| `also needs writes` | the first MVP is a write-capable File Browser | WCO-2, 2026-08-14 | 2026-08-14 |
| `or also explicit writes` | the first MVP is a write-capable File Browser | WCO-2, 2026-08-14 | 2026-08-14 |
| `Open, not ruled: whether every author-facing API uses` | owner preference recorded 2026-08-14: uniform `PrincipalId` | WCO-7, 2026-08-14 | 2026-08-14 |
| `Proposed new repos: core, os, drive` | `contracts`, `sdk`, `webclient`, `drive` (legacy renamed `*-v1`) | WCO-11, 2026-08-14 | 2026-08-14 |
| `v1-bridge ruling` | 2026-08-08 greenfield-successor ruling (no v1 bridge) | 2026-08-08 | 2026-08-08 |
| `is the supported bridge` | 2026-08-08 greenfield-successor ruling | 2026-08-08 | 2026-08-08 |
| `Dead-chain fire drill` | chains-persist assumption; no survival gate | 2026-07-10 | 2026-07-10 |
| `the authoritative on-chain/off-chain ruling` | July on-chain audit is evidence; obligations re-priced under V2-E4 | 2026-08-12 | 2026-08-12 |
| `The Client v2 design set is` | `Designs/web-client-os/` is the active product-layer set | 2026-08-12 boundary | 2026-08-12 |
| `OS Drives` | *(hold until a real `Designs/os-drives/` set exists; otherwise this row is unfixable)* | 2026-07-22 mount ruling | 2026-07-22 |

Rulings that **cannot** reduce to a phrase and therefore need a design-work owner, not a row: WCO-12 (a lost
owner answer), the 2026-07-22 "contraction gate comes later" sequencing versus WCO-2, and the branch-only
2026-08-22 rulings.

---

## 5. Findings

### F1 — DRIFT (blocking) — The MVP-writes ruling is three weeks old and the Core spine still asks the question
`Designs/web-client-os/README.md:44-47` (WCO-2, 2026-08-14) vs `Designs/efsv2/owner-decision-inbox.md:56-60`
(V2-E6 "Then decide whether the first Web Client also needs writes") and `Designs/efsv2/system-constitution.md:358-359`
("or also explicit writes?" as an unchecked open question). Both Core files are pre-promotion-gated on their
open questions, so the ruling is not merely unrecorded — it is actively blocking its own docs from advancing.
**Owner: `efsv2`.** Fix: delete the V2-E6 trailing sentence and the constitution open question, replace with a
dated "ruled 2026-08-14 (WCO-2)" line in `Designs/efsv2/owner-rulings.md`, and add the two Retirements rows.

### F2 — DRIFT / DIRECTION (blocking) — The readiness branch reinstates exactly the shape the owner rejected
`readiness:Designs/efsv2/system-constitution.md:386` sets the candidate default "First product loop | **Direct
no-wallet raw Explorer plus minimum read-only Files profile. Writes, Arcade polish, extensions, and OS mount
integration follow**", and `readiness:Designs/efsv2/mvp-build-start-packet.md:206` lists "writes" under
"**What is not an MVP blocker**" (also :186 "writes, search, and OS integration are **later** modules").
WCO-2 says the MVP "must be an official write-capable File Browser, **not a read product plus a substitute
debug page**". Worse, `readiness:Designs/efsv2/owner-decision-inbox.md:83` justifies the reversal by citing
"**the owner's explicit top-to-bottom overnight direction**" — a direction that appears in no ruling ledger on
`main` or on any branch. The branch also converts V2-E1/E2 into delegated defaults that *do* follow WCO-7/8
(`:87-101`), so it reconciles two directions and reverses the third. **Owner: `owner` to adjudicate; `efsv2`
and `vault-process` to record.** Fix: before this branch merges, either record the overnight direction as a
dated ruling that supersedes WCO-2, or correct the branch's First-product-loop row.

### F3 — DEFECT (blocking, process) — Twenty-eight owner directions exist outside every decision mechanism
`Designs/web-client-os/README.md:35-171` holds WCO-1…28 with one block-level attribution ("supplied directly
by James from 2026-08-14 through 2026-08-23"), no per-item date, and no `— ruled by @james, YYYY-MM-DD`
marker. `Onboarding/authority.md:22` requires exactly that marker "in the history owned by the queue that owns
the item: `Designs/<folder>/owner-rulings.md` where that file exists, `Decisions.md` otherwise — never both."
`ls Designs/web-client-os/` shows eleven design files and **no** `owner-rulings.md` or `owner-decision-inbox.md`;
`Decisions.md`'s newest entry is 2026-08-13 (`:21`); `Designs/efsv2/owner-rulings.md` stops at 2026-08-12.
Consequently `Open-Decisions.md:71-78` Queue health does not list `web-client-os` at all, and its
"**Ask now: 0**" banner is computed over queues that exclude the set carrying the MVP. `Designs/media-library/owner-rulings.md`
shows the correct pattern being followed by a sibling set on the same date ("— ruled by @james, 2026-08-14").
**Owner: `vault-process` (create the two files), `owner` (confirm wording of the Core-binding items).**

### F4 — DEFECT (important, process) — The "decided but not integrated" audit passes vacuously
`Retirements.md:17-21`: the Active table is empty; the newest Cleared row is 2026-08-12.
`./scripts/needs-integration.sh --brief` prints "No active retirements — nothing to integrate." and exits 0.
That green light is not evidence of integration — it is evidence that no one has added a row since 2026-08-12,
across a 2026-08-14→08-23 direction round, the media-library rulings, and two branch-only founder rulings.
The file's own rationale (`:5`) is "a decision isn't done when it's recorded — it's done when the docs
contradicting it stop saying the old thing"; F1, F5, F6 and F8 are live counterexamples the audit cannot see.
**Owner: `vault-process`.** Fix: add the ten rows in §4; consider making the script warn when a ruling ledger
has entries newer than the newest Retirements row.

### F5 — DRIFT (important) — A live `#status/review` design still asks v2 to keep v1 importable
`Designs/sdk-v1-bridge-v2-compat-asks.md:3` is `**Status:** review`; `:5` declares "**Depends on:** [[Decisions]]
2026-08-07 (v1-bridge ruling)"; `:13` asserts in the present tense "The 2026-08-07 v1-bridge ruling supports v1
+ the SDK for Nanda/Arcade" and asks for "cheap commitments the v2 design can adopt **now** that convert 'real
data accumulates on v1, then v2 severs it' … into a bounded, mechanical **import**." The 2026-08-08 greenfield
ruling (`Decisions.md:23`) forbids exactly that: "no v1 support, compatibility, migration, coexistence, or
legacy-read requirement", echoed in `Designs/efsv2/README.md:134` Hard holds. The file is also **absent from
`Designs/README.md`'s content map** (verified: it is one of only four root `Designs/*.md` files not listed),
so the curated index does not label it historical the way it labels `sdk-architecture`, `sdk-write-ux` and
`efs-account-system`. **Owner: `sdk` (retire or banner the doc), `vault-process` (content-map row).**

### F6 — DRIFT (important) — A reversed direction is still labelled "Adopted owner direction"
`Designs/efs15/requirements-and-boundaries.md:36`: "| **Adopted owner direction** | v1 plus the existing SDK is
the supported bridge for current Nanda and Arcade work. |" `efs15/` is historical evidence, which would be
fine — but this cell asserts *current adoption status*, not history, and `Retirements.md:29` claims the phrase
`v1 is the supported product bridge` was **Cleared 2026-08-08**. The clear was real (zero exact-phrase hits)
and wrong (the concept survives under different wording). This is the phrase-exactness failure mode of the
retirement mechanism, demonstrated. **Owner: `efs15` (one-line correction), `vault-process` (add
`is the supported bridge` as a row).**

### F7 — DEFECT (important) — `Decisions.md` shows two contradictory rulings one day apart, neither annotated
`Decisions.md:24` and `:25` (both 2026-08-07) record the EAS-backed EFS 1.5 bridge and "EFS v1 plus the
existing SDK **is the supported bridge**… harden and merge the SDK". `:23` (2026-08-08) reverses both. Neither
08-07 line carries a reversal marker, although `Decisions.md:15` mandates "Mark reversed/irrelevant decisions
or delete outright". `Kanban.md:62` records the reversal correctly ("James's 2026-08-08 greenfield ruling
reverses the one-day v1 bridge direction") — so the vault knows; the append-only ledger just does not say so.
An agent reading `Decisions.md` top-down in date order sees the bridge ruling as live. **Owner: `vault-process`.**

### F8 — WRONG (important) — Two repository name sets were written on the same day and disagree
`Designs/web-client-os/README.md:78-81` (WCO-11, 2026-08-14): "rename legacy repos to `*-v1` and reclaim
`contracts`, `sdk`, `webclient`, and `drive` for active v2." `Designs/efsv2/hierarchical-files-and-folders.md:5`
(commit `02bdae9`, **also 2026-08-14**): "**Proposed new repos:** core, os, drive; contracts/client remain
legacy evidence." Three of four names differ and `sdk` is missing from the Files list. `Kanban.md:16` compounds
it: "proposed core/os/drive implementation sequence". Nothing is authorized yet, so this is cheap to fix now
and expensive after a repo is created. **Owner: `efsv2` (align the Files header to WCO-11 or record the
disagreement), `owner` (one word).**

### F9 — MISSING (important) — The Principal the client MVP needs is not the Principal Core's MVP defines
WCO-7 (`Designs/web-client-os/README.md:61-68`) posits a Principal with a mutable default controller account
and **three controller keys**, and requires that every operation "names and historically verifies its actual
signer descriptor". `Designs/web-client-os/architecture-and-modules.md:172-173` builds directly on "a
Principal's **historical controller state**". `Designs/efsv2/core-architecture-candidate.md:236-243` defines
the MVP Principal as `AccountPrincipal/1 = { authorityKind, originIfRequired, accountOrKey }` — a hash over
**one** account — and `:253-257` defers "multiple actors, delegation, rotation, recovery" to "**Later** managed
Principals". `grep -c 'signer descriptor' Designs/efsv2/` = 0; `controller` appears once
(`system-constitution.md:135`) and only in passing. Either the client MVP needs the managed Principal Core
deferred, or WCO-7's example is aspirational — nothing says which. **Owner: `efsv2` to state whether the MVP
Principal carries controller history; `web-client-os` to scope its MVP to the answer.**

### F10 — MISSING (important) — The adopted three-host mount requirement is owned by a set that does not exist
The 2026-07-22 ruling (`Designs/efsv2/owner-rulings.md:106-108`) is an ADOPTED, REQUIRED outcome and was
re-affirmed 2026-07-23 (`:136`) and preserved through the greenfield reset (`owner-decision-inbox.md` P-16,
"The adopted three-host read-only mount outcome survives"). It survives as a freeze acceptance test
(`system-constitution.md:316`) and one clause of `Kanban.md:42`. But the product set that would build it
excludes it from MVP (`Designs/web-client-os/product-constitution-and-roadmap.md:246`, out-of-scope: "…full
Shell, **native mounts**") and assigns it to "**OS Drives**" (`README.md:413`: "OS Drives owns native handles,
host aliases, projection behavior, errors, metadata projection, daemons, packaging, and **three-host
validation**"; `mvp-and-acceptance.md:853`). `ls Designs/` shows no such folder; no README, inbox, Kanban card,
or `Open-Decisions.md` queue names it. A required outcome with a freeze gate and no owner is how requirements
get quietly dropped at freeze time. **Owner: `owner`/`vault-process` — either create `Designs/os-drives/` or
move the requirement back into a set that exists.**

### F11 — MISSING (important) — A lost owner answer is queued nowhere
WCO-12 (`Designs/web-client-os/README.md:81-84`): "The Type/query-identity axis remains open. **The latest
owner response was not interpretable, so this set infers no choice.**" This is the axis that
`system-constitution.md:345-348` ("Does Type identity include shape, validation, and canonical index
obligations…?"), V2-E4, V2-E8 and the whole `layered-type-system-and-data-abi` proposal turn on. No queue
re-asks it: `Open-Decisions.md` says "**Ask now: 0**" and V2-E4/E8 are filed as "waiting on evidence", but
this is not an evidence question — it is an owner answer that was given and lost. **Owner: `vault-process` to
file it as a Decide-now item in `Designs/efsv2/owner-decision-inbox.md`; `owner` to re-answer.**

### F12 — DEFECT (important) — Owner rulings exist only on unmerged branches
`sdkv2:Designs/sdkv2/owner-rulings.md` records two rulings dated **2026-08-22** — "RULED (James, EFS Founder):
the durable SDK PM may read and write project files… `Designs/sdkv2/` selected as the current source spine"
and the "century-preservation correction" ("once the EFS protocol is frozen, its intended frozen/preservation
horizon is **100 years**"). Neither appears in `main`'s `Decisions.md` (newest entry 2026-08-13) or
`Designs/efsv2/owner-rulings.md` (stops 2026-08-12). `data-explorer:Designs/data-explorer/README.md:69`
likewise cites a 2026-08-22 owner direction creating a durable first-party product lane whose write-capable
MVP (`:245`, `:30-31`) claims the same create-folder / create-file / publish-revision slice as WCO-2 — while
WCO-25 (`web-client-os/README.md:145-149`) frames Data Explorer as "the default App for unqualified
Files/data links **and a raw fallback**". Three sets now claim the first write slice and one of them is
invisible to `main`. The 100-year horizon ruling in particular binds the freeze discipline in
`system-constitution.md:320-333` §Freeze discipline, which does not mention it. **Owner: `vault-process` (land the rulings into
`main` ledgers regardless of whether the branches merge), `owner` (adjudicate the write-slice claim).**

### F13 — DRIFT (minor) — Yesterday's Milestones edit still routes Devcon to the superseded client set
`Milestones.md:32-35` lists as a current input "The **Client v2 design set** is `Designs/clientv2/README.md`.
Its exact app lane, rendering ABI, and implementation target remain evidence-gated." `Designs/README.md` calls
clientv2 "The July Web-OS round is historical design evidence", and the active product spine is
`Designs/web-client-os/`, which `Milestones.md` never mentions (`grep -c` = 0). The file was last committed
**2026-09-02** (`56ec8d3`, "docs: record accepted Devcon talk"), so this is not staleness by neglect — it was
edited after the boundary ruling and after the product set existed. With a November talk accepted, the
milestone page is the document most likely to be read by someone deciding what to demo. **Owner: `vault-process`.**

### F14 — DRIFT (minor) — A July mechanism doc still calls itself "the authoritative … ruling", and an ordered
### cleanup never ran
`Designs/efsv2/onchain-completeness.md:3`: "**Status:** draft — **the authoritative on-chain/off-chain
ruling.**" The 2026-08-12 reset (`owner-rulings.md:178-186`) demoted July mechanism work to evidence ("EAS
carrier details, the July kind table/envelope/KEL topology, a fixed authority-home model, and exact
index/storage machinery must re-earn inclusion"), and `Designs/efsv2/README.md` files this doc under
"**Evidence map** … Mechanisms re-opened." The doc carries no banner saying so (contrast `freeze-gates.md:10`,
which does). It also still carries `:130` "[ ] Dead-chain fire drill run with a reverse-query assertion" — a
survival gate the 2026-07-10 ruling explicitly retired ("the dead-chain fire drill *as a survival gate*"), in
a doc whose header claims authority. The editorial sweep that ruling ordered (`owner-rulings.md:17`) has not
run in eight weeks. **Owner: `efsv2`.** Low cost: one banner line plus one struck checklist item.

---

## 6. What this lane checked and found clean

Recorded so the sweep is falsifiable, not just alarming:

- **WCO-8 / 64-Principal Lens.** Consistent across `owner-decision-inbox.md:28`, `system-constitution.md:309`,
  `core-architecture-candidate.md:450`, `lens-spec.md:97`. The retired `MAX_LENSES = 20` survives only in
  v1/SDK-historical text and `Reviews/`.
- **WCO-10 / Sepolia.** Already in `Designs/efsv2/README.md:9,30,45` and `Kanban.md:42` with the correct
  "not a permanent or canonical venue" caveat.
- **WCO-9 / NFC rich names.** Fully specified in `hierarchical-files-and-folders.md:130-152`; only the word
  "experiment arm" lags the ruling.
- **2026-08-07 GitHub-class collaboration.** Its concrete obligation (forge objects in the fixtures) is met and
  marked COVERED in `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/traceability.md:312`.
- **2026-07-10 chains-don't-die.** The current constitution reconstructs from live Realm state, not dead-chain
  headers; the 2026-08-12 venue "exit/reconstructability" criteria are venue risk, not chain mortality.
- **`Designs/media-library/owner-rulings.md`.** A correctly formed, dated, attributed ledger written on
  2026-08-14 — proof the process works when a PM uses it.

## 7. Who should fix what

| Set | Action |
|---|---|
| `owner` | Adjudicate F2 (does the readiness branch's read-only-first product loop supersede WCO-2, or not?), re-answer WCO-12 (F11), confirm the repo names in F8, and say whether the branch-only 2026-08-22 rulings stand (F12). |
| `efsv2` | Delete the two MVP-writes open questions and record WCO-2/7/8/9/10/11 in `owner-rulings.md` with dates (F1, F8, F14); state whether the MVP Principal carries controller history and a signer descriptor (F9); banner `onchain-completeness.md` (F14). |
| `web-client-os` | Create `owner-rulings.md` + `owner-decision-inbox.md` for the set so its directions and open questions become visible to `open-decisions.sh` (F3); scope the MVP's Principal claims to whatever Core answers (F9). |
| `vault-process` | Add the ten `Retirements.md` rows in §4 (F4); annotate the reversed `Decisions.md` 2026-08-07 entries (F7); list `sdk-v1-bridge-v2-compat-asks.md` in the `Designs/README.md` content map or retire it (F5); update `Milestones.md` (F13); land branch-only rulings into `main` ledgers (F12); file WCO-12 as Decide-now (F11). |
| `sdk` | Retire or banner `Designs/sdk-v1-bridge-v2-compat-asks.md` (F5). |
| `efs15` | Correct the "Adopted owner direction" cell at `requirements-and-boundaries.md:36` (F6). |
| `git-forge` | Nothing from this lane — the 2026-08-07 direction's fixture obligation is met. |
