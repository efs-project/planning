# EFS Arcade — curation workflow and the smallest social loop

**Status:** draft
**Target repos:** planning, content, contracts
**Depends on:** [[playable-archive-requirements]], [[apps-cookbook]], [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]]
**Last touched:** 2026-08-07 — claude-fable-5 (arcade pass)

#status/draft #kind/design #repo/planning #repo/contracts #topic/content #topic/games #topic/arcade

> **Initial-pass draft:** read the post-pass correction in [[Designs/arcade/README]] before using this plan. The faucet/star/comment-archiver scope and durable v1 publication path are not current launch gates.

Everything here is a **proposal of this pass** under the CONDITIONAL GO ("GO-AS-DEMO-ONLY") frame, except where a corpus fact or an owner decision is explicitly labeled. The comments question is deliberately **left open for the owner**; this doc's job is to make that decision cheap.

---

## 1. Comments — OWNER DECISION (not settled here)

Four real options, from [research-comments-approaches.md](../../Reviews/2026-08-07-arcade-corpus/research-comments-approaches.md) (§2–4, grades A/C as noted there):

| Option | Guest read | Write identity | Cost/comment | Moderation | Permanence exposure | Sept build | Migration |
|---|---|---|---|---|---|---|---|
| **EFS-native primary** (Model B: LIST-per-game + PROPERTY JSON, 2 attestations/tx) | on-chain reads; needs dedicated RPC + log-scan cache (none exists) | burner session (PR #39, 1 click) or wallet | 0 to user; ~0.9–1.2M gas via faucet drip (grade C) | client allow/deny LISTs only; hide-never-delete | **heavy** — permanent free text from strangers | **6–9 days** | native; already durable |
| **giscus hybrid** (this pass's rec: giscus + on-chain star + EFS archiver) | free (public GitHub repo) | GitHub OAuth (comments); burner (star) | 0 | GitHub's full toolkit (lock/delete/block/minimize) | archive-side only, curator-mediated | **~2–3 days total** | designed-in: GraphQL export → EFS archive files |
| **Bluesky thread embed** | free (public AppView API) | Bluesky account (email) | 0 | Bluesky tools + client reply filter | none | 1–2 days | atproto repos fully exportable |
| **Read-only launch** (no comments; maybe star only) | n/a | n/a | 0 | none needed | none | 0 days | fully open |

Rejected in the corpus and not re-litigated here: Disqus (ads/tracking), Farcaster (account + storage rent violates the no-wallet promise; Neynar acquisition), staticman-style comments-as-PRs (dominated by giscus).

### Why EFS-native-as-primary fails Sept 11 (the evidence, if comments get cut or changed)

This is not an aesthetic call; three independent blockers, all grade A/B in the corpus:

1. **Spam economics.** Sepolia gas is free via the faucet; per-address cooldown and lifetime caps are defeated by one-click burner rotation; there is no on-chain rate limit, stake, or cost to comment ([research-comments-approaches.md](../../Reviews/2026-08-07-arcade-corpus/research-comments-approaches.md) §2). Adversarial spam is cheap and eventually arrives — during a launch month in which the **sole moderator is away ~Aug 15–29**. Every mitigation is client-side list-keeping.
2. **No read path.** Rendering 50 comments needs an eth_getLogs indexer/cache that does not exist (SDK indexer is explicitly post-hackathon scope; ~100–150 raw eth_calls per page otherwise). Public RPC endpoints already choke on far less ([verification-write-costs-and-gasless.md](../../Reviews/2026-08-07-arcade-corpus/verification-write-costs-and-gasless.md) §6).
3. **Permanent-free-text legal exposure.** PROPERTY values are non-revocable (ADR-0052); moderation can only hide, never destroy. Soliciting free text from strangers onto permanent storage is a deliberate decision, not a deadline artifact — and Sepolia-as-testnet cuts the *benefit* of that permanence for comments specifically.

### This pass's recommendation

**giscus as the launch loop + one-click on-chain star (§2) + a periodic EFS archiver** that snapshots comment corpora into `/arcade/archives/comments/<slug>.json` as ordinary curator-attested files. Honest framing: "comments are centralized *for now, on purpose*; the corpus is permanently archived with provenance; migration is designed." The archive format doubles as the import source for native comments later, and anticipates the v2 comments-attachment shape (blessed pattern 4, [apps-cookbook](../efsv2/apps-cookbook.md)).

**Archiver gates (post-review — both are launch requirements, not options):** (1) **rights**: commenters' text is unlicensed copyrighted material with personal data; the comment UI must carry a terms notice granting the archive license and disclosing permanence *before* the archiver ever runs (counsel item registered in [[rights-safety-and-operations]] §8) — no notice, no archiver; (2) **moderation lag**: the archiver snapshots the *moderated* view on a ≥7-day delay so deleted spam/abuse is never immortalized. **Supply-chain caution (also post-review):** giscus is a third-party `<script>` in the arcade's own origin, and the burner private key lives in that origin's localStorage — a compromised giscus.app is arbitrary JS next to a signing key. Mitigation shipped with the integration: **self-host a pinned copy of `client.js`** (MIT, self-hostable), and keep the embed lazy-loaded below the fold; threat-model row added to [[player-security-model]].

**Optional stretch (only if the core ships early):** native Model B scoped to **one flagship game** as a labeled **"on-chain guestbook"** — an experiment, not the site loop. Scoped estimate ~3–4 days (write path 1–2, minimal read 1–2, warnings copy 0.5; grade C). It gives a live probe of the stranger-write identity ladder without betting the launch UX on it.

---

## 2. On-chain star — spec (proposal, this pass)

The smallest EFS-native social gesture that is safe by construction: no free text, no illegal-content surface, one attestation.

- **Write:** `TAG(refUID = game's DATA attestation UID, definition = /arcade/star tag-definition ANCHOR, weight = 1)` from the visitor's burner via the PR #39 instant session. Un-star = revoke your own TAG. The `/arcade/star` tag-def ANCHOR is created once by the curator (~0.8M gas).
- **Render:** count of **unique attesters** with an effective (weight ≥ 0, unrevoked) star TAG on the game's DATA — TAG is cardinality-N, so dedupe by attester client-side. **Enumeration, corrected post-review:** the EAS `Attested` event does not index (or even carry) `refUID`, so "filter logs by refUID" is infeasible. The real read: schema-topic `eth_getLogs` scan bounded by the deployment block + one `getAttestation` per candidate UID to match `refUID` + revocation check, behind a cached cursor — N hydration calls per refresh, fine at arcade scale on the dedicated RPC, and cache aggressively (counts are not consistency-critical). This is the first live instance of the cardinality-N all-attesters read gap the v2 pressure report names (§2g of [[v2-pressure-and-migration]]) — the star is the gap's exhibit, not an exception to it.
- **Cost (grade B/C, composed from measured Sepolia units):** ~0.6–0.9M gas per star; one 0.01 ETH faucet drip at ~1.2 gwei ≈ **6–8 stars** (conservative — first star on a game may add an ancestor-visibility TAG; Sepolia gas spikes cut this 10×). Lifetime cap 0.03 ETH ≈ ~20 writes per address. [verification-write-costs-and-gasless.md](../../Reviews/2026-08-07-arcade-corpus/verification-write-costs-and-gasless.md) §5.
- **Hard prerequisite — the faucet is NOT live on Sepolia today** (grade B, same file §1.6/§2): the service exists but ships off-by-default behind the `faucet` compose profile wired to devnet. Standing it up = enable the `faucet` profile; set `FAUCET_RPC_URL=<sepolia rpc>` + `FAUCET_CHAIN_ID=11155111` in `.env`; put a funded `FAUCET_PRIVATE_KEY` in `faucet.secret.env` (fund from the 682-ETH deployer); rebuild/redeploy the static app with `NEXT_PUBLIC_FAUCET_URL` baked in (the whole burner affordance is hidden without it). No new code. Ops note: the faucet is a serialized 1-tx-at-a-time drip queue, 20 req/min/IP, 24h cooldown — an acceptable natural rate limit.
- **v1 lens rule respected:** the attester is the visitor's burner wallet, never a shared relayer — the standing write-UX posture (lenses key on the attester; a shared relayer would collapse every visitor into one lens identity). v2's community-relayer answer is blessed pattern 2 in [apps-cookbook](../efsv2/apps-cookbook.md), explicitly not available in v1.

---

## 3. Moderation reality — hide, never delete

From [research-comments-approaches.md](../../Reviews/2026-08-07-arcade-corpus/research-comments-approaches.md) §2 (grade A):

| Mechanism | Scope | Verdict |
|---|---|---|
| WHITEOUT (ADR-0055) | **path ANCHORs only**, lens-scoped, revocable | Real hide for file-shaped content (Model A comments, archive files); useless for Model B entries, DATA, PROPERTY |
| TAG weight < 0 (ADR-0042 convention) | any UID target | Works as a client-honored suppression convention; kernel never interprets weight |
| Curator deny/allow LISTs | any | The practical Model B mechanism; pure client convention; allow-list-default ("first comment held") is the only clean-page posture under attack |
| giscus / GitHub | its own layer | Actual deletion, blocking, locking — the only true-delete surface in the stack |
| Destroy on-chain content | — | **Impossible.** PROPERTY/DATA/calldata are permanent. Only hiding exists. |

**Permanence warning copy, shown at every on-chain write (star or guestbook), four bullets from the corpus:**

1. This is public, permanent, and cannot be deleted — only hidden from this site.
2. It is tied to an address (your burner or wallet).
3. Your burner key lives in this browser — clearing storage loses that identity.
4. Do not post illegal content or personal information; we will hide it, but chain history retains it.

Plus the honesty note for legal/scope copy: Sepolia is a testnet with no guaranteed lifetime, so "permanent" is weaker than mainnet in both directions.

---

## 4. Curation — three models, one September answer

| Model | What it is | Sept-feasible? | EFS differentiation | Failure mode |
|---|---|---|---|---|
| **Trusted GitHub-PR** (osgameclones-style) | Data repo generates the catalog; add-game form pre-fills a PR; curator review = code review; fixed seeder publishes approved games to EFS with committed receipts | **Yes** (~2–3 days incl. form) | Low at intake, high at publication (on-chain records + receipts) | Single-maintainer decay (leereilly/games archived 2025 — [research-competitors-and-precedents.md](../../Reviews/2026-08-07-arcade-corpus/research-competitors-and-precedents.md) §1.13) |
| **EFS-native collaboration bridge** | Submissions as on-chain claims/proposals, curator accepts on-chain | No — needs indexer, proposal UX, spam posture; same blockers as native comments | High | Building governance machinery before there are two contributors |
| **Plural app-store lenses** | Multiple named curators publish competing catalog lenses/LISTs over the same game corpus | No — needs ≥2 real curators + lens-mature client | **Highest — the curator-plurality gap no incumbent fills** (same corpus §4.3) | Plurality theater with one curator wearing two hats |

**Recommendation (this pass): GitHub-PR for September, on-chain publication with receipts, explicit migration path.** Concretely:

- **Policy shaped like F-Droid** ([research-competitors-and-precedents.md](../../Reviews/2026-08-07-arcade-corpus/research-competitors-and-precedents.md) §1.14): objective criteria (verified free license; single-file self-contained; no trackers/ads; no external requests) → automated checks (license file present, size, no external fetches, sandbox smoke run) → human review → **anti-feature labels, label-don't-ban** (e.g. `modified-fork`, `ai-assisted-assets`, `needs-keyboard`). Deletion-based judgment (Newgrounds blamming) is impossible on EFS anyway; curation is inclusion + labeling.
- **Publication = the fixed seeder** writing under the content lens (curator EOA `0x11Cb…9912`), with **receipts committed back to the repo** (tx hashes, attestation UIDs, canonical contentHash, mirror CIDs). Hard gate: the datasets seeder must first be fixed to canonical `f1220` sha-256 contentHash — step 1 of [verification-contenthash-writers.md](../../Reviews/2026-08-07-arcade-corpus/verification-contenthash-writers.md) — **before any further durable seeding**.
- **Migration path, stated up front so we're never permanently bound to GitHub:** the repo is the *workflow*, EFS is the *record*. Every accepted game is fully described on-chain (a stranger can rebuild the catalog without the repo). Post-September, curation claims move on-chain — curator LIST collections and lens-scoped acceptance claims — while contributor history stays preserved in git; nothing is discarded, the intake surface just gains an on-chain twin. Curator-lens plurality (model 3) is the long-term destination and the arcade's most differentiated claim; it becomes real the day a second named curator publishes a competing list over the same corpus.

## 5. Submission lifecycle (state machine)

```
proposed ──> license-review ──> tech-review ──> accepted ──> published ──> [update | fork]
   │              │                  │              │            │
   │              └──> rejected <────┘              │            ├──> warned (anti-feature label added)
   │                   (reason class)               │            └──> unlisted (hidden, never deleted)
   └──> duplicate (points at canonical entry)       └──(pre-publish withdrawal by submitter: allowed)
```

- **proposed** — add-game form pre-fills a PR against the data repo (title, upstream repo/commit, author, license claim, single-file asset).
- **license-review** — curator verifies the license *per file/repo at the pinned commit* (MIT/Unlicense/CC0 tiers only for September); TM/name-risk screen (the tetris.html lesson).
- **tech-review** — smoke-test claim recorded as the tuple **(tester, client generation, runtime, browser, date, result)** per [[playable-archive-requirements]]; automated checks (size, self-containment, no external requests, sandbox render).
- **rejected** — with a reason class: `license-unverifiable` · `license-incompatible` · `tm-name-risk` · `unsupported-package` (multi-file, pre-folder-bundle lane) · `quality` · `duplicate` · `policy`. Reasons are public in the PR.
- **published** — seeder run + receipts committed (see §4). The game page links its receipts.
- **update / fork** — new DATA + provenance chain entry; F-Droid fork rule: forks must change name/branding and attribute upstream; upstream link mandatory. Same contentHash = same file (duplicate, canonical-first); same game, different build = fork lane with its own provenance.
- **warned** — anti-feature label attached (catalog metadata + later a negative-weight TAG); game stays listed.
- **unlisted** — removed from the catalog manifest + curator deny-LIST/negative TAG; on-chain bytes and records remain (label-don't-ban taken to its honest conclusion; the public copy must say so).

**Appeals:** open a GitHub issue; decisions and reversals logged in the repo. **September reality, disclosed prominently: a single curator (James).** The long-term disagreement answer is not appeals-to-one-person but **curator-lens plurality** — publish your own catalog over the same corpus. **Succession:** a `HANDOVER.md` (seeder ops, faucet ops, repo permissions, key custody, receipts index) written before launch; **inviting a second maintainer is a condition of upgrading demo → product** (matches GO condition 1 and evidence-bar #1 in [research-alternatives-and-falsification.md](../../Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md)). Curation-labor precedent: Flashpoint's audition apprenticeship is the model to grow into ([research-communities-and-outreach.md](../../Reviews/2026-08-07-arcade-corpus/research-communities-and-outreach.md) §1a), and completing one Flashpoint audition ourselves is cheap first-hand research.

## 6. Exercise plan — prove the workflow on one real candidate

Run **Norman the Necromancer** (js13k medalist, **Unlicense**, per [research-catalog-candidates-and-rights.md](../../Reviews/2026-08-07-arcade-corpus/research-catalog-candidates-and-rights.md)) through the *entire* §5 pipeline before calling the workflow real. Capture every artifact:

1. Submission PR (data-file diff, as an outside submitter would file it).
2. License evidence: LICENSE capture + upstream repo/commit snapshot link.
3. Automated-check output (size, self-containment, sandbox render log).
4. Smoke-test tuple record.
5. Curator review comment + acceptance.
6. Seeder receipts: tx hashes, UIDs, canonical `f1220` contentHash, mirror CIDs — committed to the repo. (Blocked on the seeder contentHash fix, §4.)
7. Provenance/attribution record (author, upstream, commit, license, modifications-if-any).
8. Rebuild check: second machine resolves the game from public records and verifies bytes — the stranger-can-trace test: game page → on-chain record → receipts → PR → upstream repo.

Author outreach for Norman (permission-not-required under Unlicense, but courtesy-notify) doubles as the first T1 creator-contact data point from the outreach lane.

## 7. Attribution and how this composes forward

- **Contributors:** submitter + tester + curator named in the PR history and the catalog entry; author + upstream in the on-chain provenance PROPERTYs the seeder already writes. Git history is the contributor ledger until on-chain curation claims exist; the migration in §4 preserves it.
- **Composes with the wiki and mod-capsule futures** ([research-alternatives-and-falsification.md](../../Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md) §Compose): the star + guestbook rehearse the same **burner → pseudonymous-permanent identity ladder** wiki proposals need, and give a small live probe of its spam/funding economics; curation LISTs/lens claims use the same primitives as wiki accepted-heads and mod-capsule curator attestations — one vocabulary, three workloads. Speedrun evidence bundles over the arcade's own games are rights-clean end-to-end.
- **Feeds v2:** the comment archiver format should anticipate blessed pattern 4 (comments as commenter-owned records in a parallel container, moderation = host lens) and the guestbook experience is direct field input to the **P13 social-app blessed pattern** request (ordering by venue admission, edit-history rendering) in [apps-cookbook](../efsv2/apps-cookbook.md). Anti-composition rule: no bespoke schemas, no private index — every arcade object stays ordinary v1 records readable by the standard stack.

## Open questions

- [ ] **OWNER: comments decision** — giscus hybrid (this pass's rec) vs Bluesky embed vs read-only launch vs native-primary (§1 table + failure evidence). Also: is the one-game "on-chain guestbook" stretch wanted at all?
- [ ] **OWNER: stand up the Sepolia faucet?** The star (and any visitor write) is dead without it; it also opens the accepted faucet-drain surface on real Sepolia ETH (that no-auth/drain-accepted posture was devnet-scoped — confirm it extends to Sepolia; still testnet ETH, caps shipped).
- [ ] Which flagship game gets the guestbook if the stretch happens (needs to be one we'd also demo the differentiators on)?
- [ ] giscus repo: same data repo or a dedicated `arcade-discussions` repo (moderation blast-radius isolation)?
- [ ] Does the unlisted state need a published takedown-request policy page at launch (preservation-with-consent copy), given permanent bytes can only be hidden?
- [ ] Archiver cadence and attester (curator EOA vs a dedicated archiver key under the content lens)?

## Pre-promotion checklist

- [ ] All Open questions resolved or deferred
- [ ] Target repos confirmed
- [ ] Depends on chain accepted
- [ ] No AGENT-Q comments remain
- [ ] One review round completed
