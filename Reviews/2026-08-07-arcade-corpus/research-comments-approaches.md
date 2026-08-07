# Comments / social-loop approaches for EFS Arcade

**Purpose:** Work out how per-game comments could be built for the EFS Arcade MVP (target 2026-09-11) — concretely on EFS v1 frozen schemas, and against realistic external alternatives — and recommend the smallest loop that produces real community behavior.

**Evidence grades:** A = primary source / directly observed (repo code, specs, ADRs, official docs) · B = reputable secondary source · C = uncertain / inferred / estimated.

---

## 1. What v1 EFS already gives us (local findings, all grade A)

- **Nine frozen schemas** (ANCHOR, DATA, MIRROR, PIN, TAG, PROPERTY, LIST, LIST_ENTRY, REDIRECT) + additive WHITEOUT post-freeze. No new schemas may be assumed for September. (`contracts/specs/overview.md`)
- **PROPERTY is a free-floating, non-revocable string value** (ADR-0052) — an "anchor for a string." The revocable claim is always the PIN/edge, never the value. A comment's text stored as a PROPERTY **can never be destroyed**, only unlinked.
- **LIST/LIST_ENTRY** (specs/06, ADR-0044/0046): LIST is a permanent collection declaration with `targetType=SCHEMA` mode that write-time-enforces "every entry targets an attestation of schema X." LIST_ENTRY is revocable pure membership (`listUID, target`). **Entries are stored per-attester** — `ListReader` views are parameterized by a single attester, so enumerating *all* commenters requires off-chain log scanning, not one contract read.
- **PIN/TAG** (ADR-0041): PIN = cardinality-1 revocable edge with O(1) supersession; TAG = cardinality-N revocable edge with `int256 weight`. `weight >= 0` "effective" filtering is a client/view-layer convention (ADR-0042/0054); kernel never interprets weight.
- **WHITEOUT** (ADR-0055): lens-scoped negative mask, **path-ANCHOR-only** — suppresses a child path entry in the authoring lens with no fall-through. Explicitly cannot suppress a DATA, PROPERTY, or LIST entry. Revoke = un-hide.
- **Instant burner session shipped** (PR #39, merged 2026-06-23; `contracts/packages/nextjs/utils/scaffold-eth/instantBurner.ts`, `InstantBurnerSession.tsx`, `useAutoFaucetDrip.ts`): visitor clicks "Enable promptless edits" → localStorage burner key → one auto faucet drip → promptless writes. This is a real, working minimal-identity write flow on Sepolia today.
- **Faucet** (`devnet/faucet/src/eligibility.ts`, `server.ts`): default drip **0.01 ETH**; per-address cooldown, lifetime cap, skip-if-already-funded, min-reserve, and an optional per-IP requests/minute throttle. All per-address limits are defeated by rotating burner addresses; the IP throttle only bounds flood *rate*. Drain is an accepted risk by design (devnet posture).
- Live-Sepolia UX needs a **dedicated RPC**; public endpoints rate-limit multi-read pages (prior debug-UI finding).

---

## 2. Concrete EFS-native comment models (no new schemas)

### Model B — "LIST-per-game + PROPERTY text" (leanest; recommended if EFS-native is built)

Setup (curator, once per game): `LIST(targetType=SCHEMA, targetSchema=PROPERTY_SCHEMA_UID, allowsDuplicates=false, appendOnly=false, maxEntries=0)` → listUID recorded in the game's catalog metadata.

Per comment (commenter, one `multiAttest` tx):
1. `PROPERTY(value = JSON {"v":1,"parent":"0x…|null","text":"…"})` — text + optional parent-entry UID for threading (threading costs zero extra attestations; it's client-decoded).
2. `LIST_ENTRY(listUID, target = propertyUID)` — membership; attester = author identity; `attestation.time` = timestamp.

**= 2 attestations / 1 tx per comment.** Edit = revoke entry + attest new pair (text is content, entry is the claim — matches ADR-0052 semantics exactly). Delete = author revokes their LIST_ENTRY (text remains on-chain, unlinked). The list's write-time schema check means garbage targets are rejected at attest time.

- **Gas (grade C estimate):** ~120–200k (PROPERTY, dominated by string calldata + event) + ~150–250k (LIST_ENTRY resolver storage) ≈ **300–450k gas/comment**. At Sepolia's typical sub-gwei prices, one 0.01 ETH drip funds **tens to hundreds of comments**; cost to the user is zero.
- **Reads to render 50 comments (grade C estimate):** enumeration cannot use `ListReader` alone (per-attester lens). Path: `eth_getLogs` on EAS `Attested` filtered by LIST_ENTRY schema topic (1–3 calls over pinned block range) → `getAttestation` per candidate to match `listUID` + fetch `target` (50) → `getAttestation` per PROPERTY for text (50) → optional revocation checks (50). **~100–150 eth_calls raw; multicall-batchable to ~5–15 HTTP round trips.** Acceptable on a dedicated RPC; painful on public endpoints. A tiny read-side cache/indexer (or the SDK's future indexer) makes it instant — but that is new September work.

### Model A — "comments folder per game" (filesystem-native)

`/arcade/games/<slug>/comments/` ANCHOR; each comment = file upload: ANCHOR(name=`<time>-<addr>`) + DATA (empty) + MIRROR(`data:text/plain;base64,…` inline, ADR-0063) + placement PIN + contentType PROPERTY triple + first-time visibility TAGs ≈ **5–8 attestations / 1 tx**. Replies = sub-folders (natural threading).

- Pro: comments become *files*, browsable in any EFS client via `web3://`; **WHITEOUT moderation works** (curator whiteouts a comment's anchor in the curator lens → hidden in the arcade's default view, revocably).
- Con: ~3× the attestations; rendering 50 comments is a cross-attester directory walk (children index + per-anchor per-attester PIN discovery + mirror + contentType ≈ **3–5 reads/comment → 150–250 eth_calls**, multicall-batched ~10–20 round trips); anchor names are permanent namespace litter; anchors are non-revocable so even the *shape* of spam persists.

### Model C — "TAG threads on the game's DATA" (not recommended)

`TAG(refUID = gameDATA, definition = /arcade/comments-anchor, weight)` with text… nowhere good to put it (TAG has no string field) — forces a companion PROPERTY+PIN anyway. Strictly worse than B. Rejected.

### Spam / Sybil exposure (all models) — grade A reasoning on grade A inputs

Sepolia gas is free via the faucet; the faucet's per-address cooldown/lifetime caps are **defeated by burner rotation** (one click each); only the per-IP throttle bounds flood rate. There is **no on-chain rate limit, stake, or cost** to comment. Assume adversarial spam is *cheap and eventually arrives*. Every mitigation is client-side:

- **Deny-list**: curator ADDR-mode LIST of banned addresses + SCHEMA-mode LIST (or negative-weight TAGs, ADR-0042 convention) of suppressed entry UIDs; arcade client filters. Reactive only.
- **Allow-list default** ("first comment held"): client renders entries from previously-approved addresses instantly, holds others behind a "show N unreviewed" toggle until the curator approves the address (one LIST_ENTRY in an approved-authors LIST). This is the only default that keeps the page clean under attack, at the cost of moderation latency on a solo curator who is **away ~2 weeks in late August**.
- Note the deeper mismatch: EFS **lenses** answer "whose content wins at this path" (cardinality-1); comments inherently want "*all* attesters." So lens resolution doesn't natively moderate comments — moderation is explicit allow/deny list data the client consults.

### Moderation reality check

| Mechanism | Works for | Verdict for comments |
|---|---|---|
| WHITEOUT | path ANCHORs only → Model A | Real revocable hide in default lens; useless for Model B |
| TAG weight<0 | any UID target | Works both models as a client-honored suppression convention |
| Curator LIST deny/allow | any | The practical mechanism for Model B; pure client convention |
| Destroy content | — | **Impossible.** PROPERTY/DATA/calldata are permanent. Only hiding exists. |

**Permanence warnings needed at write time:** (1) comments are public, permanent, and cannot be deleted — only hidden from this site; (2) they are tied to an address (burner or wallet); (3) burner key lives in this browser — clearing storage loses the identity; (4) illegal content: the client must refuse-by-policy + hide, but chain history retains it — this is a genuine legal-exposure question for an app that solicits free-text from strangers onto permanent storage. Mitigating-but-double-edged: Sepolia is a testnet with no guaranteed lifetime (Ropsten/Goerli precedent), so "permanent" is weaker than mainnet in both the good and bad directions — which also undercuts the preservation story for *comments* specifically.

### September build cost, EFS-native (grade C)

Write path on top of PR #39 burner session: **1–2 days**. Read/indexing path good enough for a public page: **2–3 days** (log-scan + multicall + cache). Moderation lists + client filters + hold-queue UI: **2–3 days**. Warnings/ToS copy: **0.5 day**. **≈ 6–9 focused days** — colliding with an ~2.5-week effective solo window that must also ship catalog, game pages, and curation.

---

## 3. External / hybrid options (web research)

### giscus (GitHub-Discussions-backed widget) — grade A (official app/docs + repo)

Script tag → maps page URL/pathname to a Discussion in a public repo; bot auto-creates the thread on first comment. **Guest read: free** (public repo, no auth). **Write: GitHub OAuth** (authorize giscus app) or comment directly on GitHub. No database; moderation = GitHub's full toolkit (lock, delete, block, minimize); reactions included. MIT-licensed, self-hostable. **Export/migration: complete** via GitHub GraphQL API → JSON. Build cost: **~0.5 day**. Warnings needed: none beyond "powered by GitHub." Risks: centralized (acceptable-by-design as *reversible*); audience needs GitHub accounts — fine for open-source-game/preservationist supply side, a real filter for random players. utterances is the older Issues-backed sibling; giscus supersedes it (threading + reactions).

### Disqus — grade B

Ad-injection on free tier, tracking, data-portability friction, heavy embed. Contradicts the arcade's neutrality story. **Avoid** — consistent with owner hypothesis.

### Farcaster embed/bridge — grade B

Protocol state: Snapchain (blockchain-like replicated store) is live; nodes claimed runnable <$1k/mo; reads permissionless in principle, in practice apps read via Neynar APIs. **Jan 2026: Neynar acquired the protocol, founders stepped back** — the "decentralized" story now routes through one infra company; long-term neutrality uncertain. Write identity: Farcaster account + storage rent (~$7/yr for 5000 casts) — **violates the no-account/no-wallet promise for writers** and the audience overlap with "ordinary person following a link" is small. Per-game thread embed ≈ 2–3 days via Neynar API (API key = centralized dependency). Moderation: weak channel tools + client-side filtering. Migration: replicated, exportable. **Not credible as the primary loop for this audience in September; plausible later as an *additional* read-in surface.**

### Bluesky / atproto thread embed — grade B (multiple 2025 implementations + official public API)

Well-trodden 2025 pattern: arcade account posts one thread-root per game; the game page embeds replies fetched from the **public AppView API (no auth for reads)**; existing open-source components exist. **Guest read: free. Write: Bluesky account** — free, email-based, most mainstream-friendly of the decentralized options; comment happens *on Bluesky*, which doubles as distribution/marketing (each game page has a live social object). Moderation: Bluesky's own + client-side filter of the reply list; thread-gating controls exist. Migration: atproto repos are public and fully exportable. Build cost: **1–2 days**. Risks: comments live off-page (click-through to reply), Bluesky Corp dependency (but data exportable), no on-chain tie-in.

### Git-backed discussions (staticman-style comments-as-PRs) — grade B

High write friction, solo-maintainer review bottleneck, slow publish. Dominated by giscus on every axis that matters here. **Reject.**

### Hybrid durable-migratable (recommended shape)

giscus (or Bluesky) as the live loop **+ a periodic archiver that snapshots the comment corpus into EFS as files** (JSON per game under `/arcade/archives/comments/…`, standard upload flow, curator-attested). ~1–2 days for the archiver. This makes comments *preservation data* — the EFS story ("your community's history is being permanently archived, portably, with provenance") without betting the launch UX on an unfinished native pipeline, and it seeds a real migration path: the archive format can be the import source for native comments later.

---

## 4. Comparison

| Option | Guest read | Write identity | Cost/comment | Moderation | Permanence warnings | Sept build | Migration/export |
|---|---|---|---|---|---|---|---|
| EFS-native (Model B) | on-chain reads, needs dedicated RPC/cache | burner session (1 click) or wallet | 0 (faucet), ~300–450k gas | client lists only; hide-never-delete | **heavy** (permanent, illegal-content exposure) | 6–9 d | native; already durable |
| giscus | free | GitHub OAuth | 0 | GitHub tools (excellent) | none | **0.5 d** | full (GraphQL) |
| Git-backed PRs | free | GitHub | 0 | PR review (slow) | none | 2–3 d | trivial |
| Hybrid (giscus/Bluesky + EFS archive) | free | GitHub/Bluesky | 0 | inherited | archive-side only | **1.5–2.5 d** | designed-in |
| Farcaster bridge | via API (Neynar) | FC account + storage rent | ~$7/yr rent | weak | none | 2–3 d | replicated/exportable |
| Bluesky embed | free (public API) | Bluesky account (email) | 0 | Bluesky + client filter | none | 1–2 d | atproto export |

---

## 5. Recommendation

**Ship the hybrid: giscus as the launch comment loop + EFS archive job**, with the burner-session write path spent on the *curation* workflow (LIST-based game curation is where per-attester lenses are a feature, not a bug — single-curator lists are exactly the shape `ListReader` reads in O(1)). If a native on-chain social gesture is wanted for launch, add a **one-click "⭐ on-chain star"** (single TAG on the game's DATA via the burner session — 1 attestation, no free text, no illegal-content surface, trivially rendered as a count) — that gives EFS-native community *behavior* by Sept 11 at ~1 day of work and demos the crowdsourcing model honestly. Optionally scope full Model B comments to one flagship game as a labeled experiment ("on-chain guestbook") rather than the site-wide loop.

**What to tell the owner if asked whether EFS-native comments are credible by Sept 11:** the *write* path is credible today — PR #39's burner session + faucet is exactly the minimal identity flow, and a 2-attestation comment model (LIST + PROPERTY) exists cleanly within the frozen schemas. What is **not** credible in the window is EFS-native comments as the primary public loop: (1) no spam defense beyond client-side allow/deny lists, against an attacker whose per-comment cost is zero and whose Sybil cost is one click, during a launch month when the sole moderator is away two weeks; (2) rendering 50 comments needs a log-scanning indexer/cache that doesn't exist yet (SDK is explicitly post-hackathon scope); (3) free-text from strangers onto permanent storage with hide-only moderation is a legal/abuse exposure that deserves a deliberate decision, not a deadline artifact. Reversible-centralized now + on-chain star + EFS archival keeps the promise honest ("comments are centralized *for now, on purpose*; the corpus is permanently archived; migration is designed") and advances the plural-curation story where EFS is actually strong.

---

## 6. Source index

Local (accessed 2026-08-07, grade A):
- `contracts/specs/overview.md` — schemas, upload/read flows, invariants
- `contracts/specs/02-Data-Models-and-Schemas.md` — PROPERTY/PIN/TAG/LIST/LIST_ENTRY/WHITEOUT details
- `contracts/specs/06-Lists-and-Collections.md` — LIST primitive, per-attester lens storage, ListReader
- `contracts/docs/adr/0052-property-is-non-revocable.md` — value-vs-claim, non-revocability
- `contracts/docs/adr/README.md` (index) — ADR-0041, 0042, 0044, 0046, 0054, 0055 summaries
- `contracts/packages/nextjs/utils/scaffold-eth/instantBurner.ts`, `hooks/scaffold-eth/useAutoFaucetDrip.ts`, `components/InstantBurnerSession.tsx` — PR #39 burner session (merged 2026-06-23 per `Kanban.md`)
- `devnet/faucet/src/eligibility.ts`, `src/server.ts`, `src/config.ts` — drip amount (0.01 ETH default), cooldown, lifetime cap, IP throttle
- `hackathon/READY.md` — faucet-link state; gasless drip is the shipped hackathon-scope item

Web (accessed 2026-08-07):
- giscus — https://giscus.app/ and https://github.com/giscus/giscus (grade A, official)
- Farcaster Snapchain — https://github.com/farcasterxyz/snapchain (grade A, official README); storage-rent/cost figures via https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/ and https://www.dextools.io/tutorials/what-is-farcaster-decentralized-social-protocol-guide-2026 (grade B)
- Neynar acquires Farcaster (2026-01) — https://neynar.com/blog/neynar-is-acquiring-farcaster (grade A, primary) ; https://www.coindesk.com/business/2026/01/21/farcaster-founders-step-back-as-neynar-acquires-struggling-crypto-social-app , https://www.theblock.co/post/386549/haun-backed-neynar-acquires-farcaster-after-founders-pivot-to-wallet-app (grade B)
- EAS social precedent — https://docs.attest.org/ sample apps ("Speaketh" comment social network) (grade B; thin precedent, no production EAS comment system found)
- Bluesky comment embeds — https://briandouglas.me/posts/2025/08/21/bluesky-comments-implementation/ , https://micahcantor.com/blog/bluesky-comment-section.html , https://capscollective.com/blog/bluesky-blog-comments/ , https://quarto-ext.github.io/bluesky-comments/ (grade B, multiple independent implementations); write API https://atproto.com/blog/create-post (grade A)

Gas and RPC-read counts in §2 are grade C estimates (typical EAS attest costs + schema shapes; not benchmarked on the pinned fork).
