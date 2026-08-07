# EFS Arcade — rights, safety, and operations posture (September policy)

**Status:** draft
**Target repos:** planning, content
**Depends on:** [[playable-archive-requirements]]
**Last touched:** 2026-08-07 — claude-fable-5 (arcade pass)

#status/draft #kind/design #repo/planning #repo/content #topic/games #topic/arcade

---

Everything below is a **proposal of this pass** (the 2026-08-07 arcade planning round) unless explicitly marked as verified fact, owner guidance, or an adopted decision citing a real ruling. The Arcade ships 2026-09-11 as a labeled public demo at demo scope (this pass's CONDITIONAL GO recommendation, not an owner ruling). Rights and safety posture must still be launch-grade on day one, because published bytes cannot be recalled — see §4.

## 1. Intake rights policy

### 1.1 The seven classifications (operating categories)

These are the operating categories from the rights research ([research-catalog-candidates-and-rights](../../Reviews/2026-08-07-arcade-corpus/research-catalog-candidates-and-rights.md), §3 — license calls graded A where the license file or GitHub API was read directly). Every candidate gets exactly one classification, recorded in the curation data repo before any seeding.

| Class | Meaning | Arcade action |
|---|---|---|
| **CR** | Clearly redistributable as-is (MIT, Unlicense, etc., complete artifact covered) | Eligible for catalog |
| **RN** | Redistributable with notices (MPL file headers, zlib credits; **GPL/AGPL: for modified conveyance the arcade publishes its own pinned modified source tree — an upstream link is not the Corresponding Source of a fork — and carries the ongoing source-availability duty for as long as it conveys**) | Eligible; notices/source duties are a hard publish gate |
| **MF** | Modifiable/forkable (license permits the inline-fork pipeline) | Eligible for inline forks with full provenance (§3) |
| **LE** | Link/embed only (no redistribution grant; e.g. PICO-8 BBS CC BY-NC-SA works) | Directory entry at most; bytes never seeded |
| **PR** | Permission required (no license; author plausibly amenable) | Outreach lane only; nothing published until §1.4 satisfied |
| **U** | Unclear (conflicting or partial license signals) | Treated as PR until resolved to a real class |
| **X** | Unsuitable (restrictive terms, dead deps, legal cloud) | Rejected; rejection logged with reason |

Only **CR/RN/MF may ever be seeded to EFS.** LE/PR/U/X never produce on-chain bytes. This is stricter than every archive precedent surveyed, deliberately — see §4.3.

### 1.2 Complete-artifact rule

A code license alone is not clearance. Each intake verifies rights on the **complete artifact**: code, art, audio, fonts, level data, and vendored dependencies, each separately. Known live examples from the corpus: Q1K3/Underrun are MIT code + zlib Sonant-X (fine, RN with notices); HexGL's README explicitly covers "code and resources" under MIT (that explicitness is why it clears); sokoban's level-pack provenance is unverified — original 1982 Sokoban levels are Thinking Rabbit copyright, so the level data must be checked before that file is ever in a public catalog ([research-catalog-candidates-and-rights](../../Reviews/2026-08-07-arcade-corpus/research-catalog-candidates-and-rights.md) §2, grade C flag).

### 1.3 Bright lines

- **"Source visible on GitHub" is NOT a license.** A public repo with no LICENSE file is **all-rights-reserved** by default; it classifies as PR, never CR. Verified examples: CLAWSTRIKE (js13k 2025 winner), Drive13K, Knight Dreams — all public, all unlicensed, all PR (grade A, GitHub API license endpoint reads).
- **No-LICENSE = all-rights-reserved** even when the author is community-friendly, even when their other repos are MIT. Likelihood-to-grant informs outreach priority, never publication.

### 1.4 Permission-required intake

PR-class games publish only on **written creator authorization** that includes informed-permanence language: the creator must be told, before consenting, that (a) published bytes go to content-addressed public storage and on-chain attestation and **cannot be deleted by the Arcade**, only unlisted from its views; (b) the grant covers redistribution of the specific artifact plus notices; (c) Sepolia's lifetime is not guaranteed (honest in both directions). A consent template is an open question (§Open questions); the authorization text is preserved in the curation data repo alongside the game's provenance record. Casual "sure, go ahead" replies without the permanence disclosure do not qualify.

## 2. Trademark policy

Findings and grades from [research-catalog-candidates-and-rights](../../Reviews/2026-08-07-arcade-corpus/research-catalog-candidates-and-rights.md) §2. Concrete September actions (this pass's proposal, aligned with the corpus recommendations):

1. **Remove `tetris.html` from any public catalog.** Not a rename problem: The Tetris Company enforces the name AND — per *Tetris Holding, LLC v. Xio Interactive* (D.N.J. 2012) — look-and-feel copyright on faithful tetromino clones (playfield dimensions, piece shapes/colors, next-piece preview). Renaming does not clear a faithful clone (grade A/B, case coverage read 2026-08-07).
2. **Rename or drop** before anything is public: `puzzle-bobble` (Taito mark), `doodle-jump` (Lima Sky name + character-design marks, enforcement history), `frogger` and `bomberman` (Konami), `breakout`, `pong`, `missile-command` (Atari). All live registered marks (grade B/C — registry pass pending).
3. **USPTO check of final launch names** — one hour of TESS searches on the exact shipped name list, before launch, upgrading the grade-B/C mark claims to verified. Cheap insurance; scheduled in §7 ops.
4. `block-dude.html`: rename if kept (name from Brandon Sterner's TI-83 game). `infernal-throne.html`: restore upstream name **"Infernal Sigil"** — the local rename muddies provenance, the reverse of a TM problem.

**Generic-safe names** (per corpus): *Snake*, *Sokoban* (used generically; level data still needs the §1.2 check), *2048* (Cirulli's own name, MIT). Replacement-name convention for renamed mechanics: plainly descriptive, no allusion to the marked name (corpus example: "Brick Blast" for a breakout-like). Never market anything as "Wordle" (NYT mark) regardless of the underlying game's license.

## 3. Fork and modification notices

The inline-fork pipeline (MIT/Unlicense only, per the settled frame of this pass) makes the Arcade a **modifier**, not just a mirror. Every forked or modified artifact carries these provenance fields in the portable manifest (the machine-readable record that rides with the catalog data and the seeder receipts — see [verification-games-deployment](../../Reviews/2026-08-07-arcade-corpus/verification-games-deployment.md) §7 for the receipt convention this slots into):

| Field | Content |
|---|---|
| `attribution` | Original title, author, canonical upstream URL |
| `license` | SPDX id + **full original license text preserved verbatim** |
| `upstream_revision` | Upstream git commit hash (or release tag) the fork was taken from |
| `parent_digest` | sha-256 of the exact upstream artifact ingested |
| `modification_description` | Human-readable summary of every change (e.g. "inlined dist/ JS+CSS into single index.html; no gameplay changes") |
| `build_recipe` | Exact reproducible steps/patch to get from parent to result |
| `resulting_digest` | Canonical `f1220<sha256>` contentHash of the published artifact |

Rationale: this is what makes a fork honest under RN/MF licenses, lets a stranger verify the Arcade changed only what it claims (parent digest + recipe + resulting digest is a checkable chain), and mirrors F-Droid's fork-attribution requirement ([research-competitors-and-precedents](../../Reviews/2026-08-07-arcade-corpus/research-competitors-and-precedents.md) §1.14, grade A). Incomplete provenance = not publishable, same severity as a missing license.

## 4. Permanence honesty

### 4.1 What the Arcade cannot promise

- **Deletion of published bytes or archived comments.** Content-addressed bytes with on-chain attestations cannot be recalled once third parties pin or mirror them. True today at small scale (the /games CIDs already resolve from public gateways — [verification-games-deployment](../../Reviews/2026-08-07-arcade-corpus/verification-games-deployment.md) §2, grade A) and grows more true with adoption.
- **Sepolia lifetime.** Sepolia is a testnet with no guaranteed lifetime (Ropsten/Goerli precedent). "Permanent" is therefore scoped: attestations last as long as the chain; bytes last as long as any pin. The #1 objection technical audiences will raise (per the settled frame and [research-communities-and-outreach](../../Reviews/2026-08-07-arcade-corpus/research-communities-and-outreach.md)); the public FAQ answers it straight rather than hedging.

### 4.2 What it does instead

**Unlist** (remove from the Arcade's catalog views), **hide in the default view** (lens/allow-list level, revocable), **warn** (visible label on the game card), **publish a correction** (a signed statement in the public record), and — the remedy the first draft omitted (post-review) — **cease our own distribution**: unpin the bytes from every operator-controlled node and revoke the curator's own MIRROR attestations and placement PIN. At today's scale that last step is close to effective removal in practice: the launch corpus is IPFS-mirror-only and pin custody is one operator VPS, so gateways serve *because that node serves*. What remains genuinely impossible is recalling **third-party** pins, copies, and the interned on-chain values — the impossibility claim is scoped to that, not overstated. The site says exactly this.

### 4.3 Rights-complaint workflow (published on the site)

1. **Contact:** public email + form on an /about page (DMCA-agent registration is a counsel-dependent item, §8).
2. **Acknowledge within 72 hours** — human reply, even if just "received, reviewing."
3. **Unlist pending review, and on a confirmed complaint cease own distribution** (unpin + revoke own MIRROR/PIN — §4.2). Unlisting is cheap and reversible; leaving it up during review is not.
4. **Resolution recorded publicly:** outcome and reasoning published (complaint text redacted as appropriate), so the takedown history is itself part of the auditable record.

**Why license-clean intake is structural, not optional:** Flashpoint survives hosting ~220k mostly-unlicensed games via a takedown-on-request compromise — it can and does fully remove works (it honored Nitrome's removal) ([research-sustainability-and-institutions](../../Reviews/2026-08-07-arcade-corpus/research-sustainability-and-institutions.md) §2; [research-competitors-and-precedents](../../Reviews/2026-08-07-arcade-corpus/research-competitors-and-precedents.md) §1.10, grade A/B). **EFS cannot offer that compromise** — removal of published bytes is technically impossible, so the safety valve that makes gray-zone archiving survivable does not exist here. Adjacent precedents close the other escape routes: the Copyright Office denied (4th time, Oct 2024) the DMCA exemption for remote access to preserved games, and *Hachette v. Internet Archive* (final 2024) established that "we're a library" is not a defense for redistributing in-copyright works at scale ([research-sustainability-and-institutions](../../Reviews/2026-08-07-arcade-corpus/research-sustainability-and-institutions.md) §2, grade B). Freely-licensed intake is the only lane with no DMCA cloud — the catalog is smaller and clean, by construction.

## 5. Safety operations

- **Malicious package handling.** Games run only in `sandbox="allow-scripts"` iframes after byte verification (settled frame), so the blast radius is bounded — but a game could still be obnoxious or deceptive. Response: **unlist + attach a warning claim** (visible record of why) **+ incident note** in the public ops log. The verified-digest model means the malicious bytes are precisely identifiable forever, which is itself a deterrent story.
- **Phishing / wallet imitation.** Games get **no wallet affordances, ever** — no provider injection, no signing surface reachable from game frames. **Any game drawing wallet-like UI (seed-phrase prompts, fake transaction dialogs, "connect wallet" chrome) is unlisted on sight**, no review period. Rationale: the guest promise ("no wallet, nothing for sale") is the trust asset with exactly the communities being courted ([research-communities-and-outreach](../../Reviews/2026-08-07-arcade-corpus/research-communities-and-outreach.md), r/WebGames ethos + crypto-aversion synthesis); one convincing fake wallet prompt inside an "on-chain arcade" is a headline-grade incident.
- **External network behavior: declared-or-unlisted.** Catalog games should make no external requests (the js13k class is self-contained by competition rule). Any game that phones out must have that behavior declared on its card (an anti-feature label, F-Droid style — label, don't ban); undeclared network behavior discovered post-launch = unlist until relabeled. CDN-dependent builds (e.g. Hextris's Google Fonts/Analytics calls) are forked clean under §3 before intake.
- **Comment abuse.** September comments live in giscus/GitHub Discussions (this pass's recommended hybrid — an **owner decision, not settled**). Moderation uses GitHub's toolkit (lock, delete, minimize, block) — the strongest moderation tooling available at this scale ([research-comments-approaches](../../Reviews/2026-08-07-arcade-corpus/research-comments-approaches.md), grade A). Response SLA: acknowledge/act within 72h normally. Note the EFS archiver implication: **snapshotted comment corpora become permanent** — the archiver runs on the *moderated* view, on a delay (proposed: ≥7 days), so deleted spam/abuse is not immortalized. The on-chain star carries no free text — no abuse surface beyond volume.
- **Minors.** The September catalog is **general-audience**: nothing age-gated, nothing that would be uncomfortable on Coolmath. Content ratings (ESRB-style descriptors) are **deferred** — with 12–18 hand-picked games, curation IS the rating. Revisit before open submission ever widens intake. No child-directed features, no accounts for anyone, no data collection (which also keeps COPPA-shaped surface minimal — a counsel question, not a conclusion, §8).

## 6. Accessibility floor (September)

- **Controls documented on every game card** before Play: which keys/inputs, visible without launching the game.
- **Input badges:** touch / keyboard (/ mouse) per game — load-bearing, since 12 of the current 15 games are keyboard-only and unplayable on phones ([research-catalog-candidates-and-rights](../../Reviews/2026-08-07-arcade-corpus/research-catalog-candidates-and-rights.md) §1, grade A); a mobile visitor must see "desktop" before tapping Play.
- **No flashing content unlabeled:** any game with strobe/flash effects carries a photosensitivity warning on its card; unlabeled flashing discovered later is treated as a labeling bug fixed at unlist-until-relabeled severity.
- **Deferred, honestly:** screen-reader support inside third-party games (not in the Arcade's power), remappable controls, WCAG audit of game content. The Arcade's own chrome (catalog, cards, Play flow) should be keyboard-navigable and screen-reader-sane; the games themselves are labeled, not remediated. Stated plainly on the about page rather than implied away.

## 7. Operations

### 7.1 Weekly labor budget (launch scale)

From the cost model in [research-sustainability-and-institutions](../../Reviews/2026-08-07-arcade-corpus/research-sustainability-and-institutions.md) §6 (grade C, modeled):

| Line | Hours/week | Notes |
|---|---|---|
| Curation + testing (license verification, provenance, playtesting) | 3–8 | The single largest cost of the whole product |
| Moderation (comments, takedown requests, spam) | 2–4 | giscus tooling keeps this at the low end |
| Infra (pins, RPC, VPS, receipts hygiene) | ~1 | Cash cost ≈ $10–30/mo; time is the real budget |
| **Total** | **5–12 founder-hours/week** | Solo-sustainable only at the low end; 10k/day traffic breaks the solo model |

### 7.2 Incident-response one-pager (who/what/when)

"Who" is James in every row — that is the finding, not an omission.

| Incident | First action (when) | Then | Notes |
|---|---|---|---|
| **Rights complaint** | Acknowledge <72h | Unlist pending review → public resolution (§4.3) | Counsel items in §8 sharpen this lane |
| **Malicious game** | Unlist immediately on confirmation | Warning claim + incident note (§5) | Sandbox bounds blast radius; verified digest identifies exact bytes |
| **RPC outage** | Swap/rotate the dedicated key; site degrades to build-baked manifest (catalog browsable, provenance reads fail visibly) | Post status note | Guest read path has a single baked RPC key (settled frame) — a known single point |
| **Pin loss** | Re-pin from the local staged copy; verify digests match receipts | Re-check all mirrors; record in receipts | **Custody today is a single VPS Kubo node** ([verification-games-deployment](../../Reviews/2026-08-07-arcade-corpus/verification-games-deployment.md) §2, grade A/B) — one machine is the durability anchor until a second pin location exists (open question) |

### 7.3 Away-window coverage rule

**No launch, and no new public write surface, while the sole operator is away.** James is away ~Aug 15–29 (owner guidance from the lunch-derived brief). The 72h acknowledgment SLA, the unlist-on-sight rules, and comment moderation all assume a human on duty; a public launch with nobody at the wheel converts every §5 scenario into a two-week unattended incident. The Sept 11 date already respects this; the rule exists so scope creep (e.g. soft-launching comments in August) doesn't violate it silently.

## 8. Counsel-dependent items (flagged, not concluded)

No legal conclusions in this document; each item below needs counsel or an explicit owner decision to accept the risk of proceeding without:

- **ToS / Acceptable Use Policy** for the site (comment conduct, permanence disclosures, liability language). Cost model estimate: $1–3k review (grade C).
- **DMCA designated-agent registration** — $6 US Copyright Office fee; near-zero cost. The sharpened counsel question (post-review): the operator **can** expeditiously cease his own distribution (unpin + revoke own mirrors, §4.2) — what needs counsel is whether that satisfies §512 duties when third-party pins and interned on-chain values persist beyond his control.
- **Comment-archiver rights (post-review, new):** archiving strangers' giscus/GitHub comment text into permanent EFS files is republication of unlicensed text plus personal data. **Launch requirement, not an open question:** the comment UI carries a terms notice granting the archive license and disclosing permanence *before* any archiver runs; GDPR-shaped exposure of permanent handles/text is a named counsel item. No notice → no archiver.
- **Entity timing** — no new entity in September (Form B recommendation, [research-sustainability-and-institutions](../../Reviews/2026-08-07-arcade-corpus/research-sustainability-and-institutions.md) §5); revisit at >$500/mo recurring money or >2 co-maintainers. Until then complaints attach to a person, not a company — a knowingly accepted exposure that clean intake (§1) exists to minimize.
- **Minors/COPPA posture** (§5) — believed minimal given no accounts and no data collection, but "believed" is the operative word.

## Open questions

- [ ] Who drafts the PR-class consent template with informed-permanence language (§1.4), and does it get a counsel once-over before first use?
- [ ] Comment-archiver moderation delay: is ≥7 days after moderation the right lag before snapshotting comments into permanent storage (§5), and is this disclosed in the comment UI?
- [ ] Second pin location before launch (§7.2): mirror the catalog CIDs off the single VPS Kubo node — Pinata free tier, second Kubo, or defer with the risk logged?
- [ ] Sokoban level-pack provenance (§1.2): verify straker's level data is not the copyrighted 1982 Thinking Rabbit pack, or drop the file.
- [ ] USPTO TESS pass on final launch names (§2): scheduled when, and who signs off on the resulting name list?
- [ ] Rights-complaint public-resolution format: freeform note or a structured record (eventually an on-chain claim) — decide before the first complaint, not after.
- [ ] Owner decision pending on the comments stack (giscus hybrid vs alternatives) — §5's comment-abuse ops assume giscus and must be revisited if the decision differs.

## Pre-promotion checklist

- [ ] All Open questions resolved or deferred
- [ ] Target repos confirmed
- [ ] Depends on chain accepted
- [ ] No AGENT-Q comments
- [ ] One review round completed
