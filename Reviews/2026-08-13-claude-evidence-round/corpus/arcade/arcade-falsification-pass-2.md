# Recovered Claude memo — Arcade differentiation falsification — pass 2

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:35:18.120Z
**Claude task:** `a681870a67a4a744a`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3506
**Original result length:** 23695 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
No edits were made anywhere under `EFS_WORKSPACE` — read-only throughout.

---

# Falsification memo: does the EFS Arcade solve a real gap?
**Date:** 2026-08-12 · **Scope:** delta-only (six-flow guest UX + dated dead-catalog cases + benefit classification) · **Method note:** four delegated research agents failed to return reports; I re-gathered all external evidence directly. All URLs checked 2026-08-12. WebSearch budget was exhausted mid-pass, so later evidence is direct-fetch only — gaps are flagged rather than filled.

---

## VERDICT — lead, including the uncomfortable version

**The Arcade's preservation premise is falsified for the catalog it actually proposes. A static site + Git + ordinary replicated storage would not merely suffice — it is already deployed, by the incumbents, and it is winning.**

Three findings drive this, and each is independently sufficient:

1. **The dominant historical killer of game catalogs is runtime obsolescence, which byte-durability and stable addressing do not touch at all.** Flash died on 2020-12-31 with a content-blocking "time bomb" on 2021-01-12. The bytes were never lost — tens of thousands of `.swf` files survived on disks worldwide. What saved Flash gaming was **Ruffle**, a Rust/WebAssembly *re-implementation of the runtime* (started 2016, first desktop release 2020-10-01). EFS preserves bytes perfectly and yields an unplayable file. Even HTML5 is already rotting from the same cause: Chrome 71's AudioContext autoplay policy broke audio in older games, and Chrome's mid-2021 SharedArrayBuffer restriction (post-Spectre) caused games to hang on load until developers shipped fixes.

2. **The Arcade's own architecture concedes the point in writing.** Per `Designs/arcade/mvp-architecture.md`: the portable source manifest is *"chain-free… **No required chain values**"* (L118); *"manifest is the index; chain is provenance, not availability"* (L48); *"Deleting every receipt leaves a valid, re-seedable dataset"* (L135); and second-operator reconstruction is `git clone` → build (L79). Strip the chain and every guest flow J1–J7 and J10–J13 still works. Of 20 launch acceptance items in `september-plan.md`, 18 are achievable by a static site plus a signed manifest; item 15 *requires* manifests carry no chain values; only item 19 is EFS-specific.

3. **The exact games proposed for "preservation" are the least endangered software on the internet.** Every launch candidate in `catalog-plan.md` is a public GitHub repo (danprince, anttihaavikko, roblouie, jonathan-vallet, phoboslab, wwwtyro, gabrielecirulli, mvasilkov, doublespeakgames). The `js13kGames` org holds **2,503 public repos**, created 2013-09-22. `js13kGames/games` — *"The production code of all games on the js13kGames.com website"* — is a single 162 MB public repo with **42 forks**, last pushed 2025-11-13. That is the mirrored tarball, already existing, already replicated 42 times. Software Heritage additionally crawls GitHub continuously, issuing content-addressed SWHIDs across 250M+ origins, backed by Inria/UNESCO.

**The uncomfortable version:** the Arcade's permanence substrate is currently *less durable than the baseline it claims to improve on*. Sepolia is a **permissioned-validator testnet** (ethereum.org, checked 2026-08-12). The Ethereum Foundation has retired app testnets on a ~2-year cadence — Ropsten/Rinkeby/Kiln (announced 2022-06-21), Goerli (deprecated 2023, LTS sunset ~2024-04-13), Holesky (deprecated 2025-09). A Sepolia replacement is in active naming discussion, with a parallel-run grace period agreed at ACDC #165 (2025-09). Meanwhile the vault's own verified state records 67 Sepolia files carrying non-canonical keccak hashes, `verifyContentHash` with **zero callers**, zero committed receipts, and pin custody on **one VPS Kubo node** (U16: *"VPS loss makes any mirror 404"*). GitHub Pages plus 42 forks plus Software Heritage beats that on every axis today.

**What is *not* falsified:** a real gap exists in the six-flow guest experience — trust metadata, dead-link honesty, and maintainer succession. It is real, it is felt by visitors, and **it is entirely addressable with a static site.** It is not a preservation gap and not an EFS gap.

---

## (a) Six-flow guest UX comparison

### HN Arcade — VERIFIED, and it is the most important datum in this memo

"Show HN: The HN Arcade", HN item 46793693, **352 points, 123 comments, 2026-01-28**. Origin URL `andrewgy8.github.io/hnarcade/` **301-redirects to `hnarcade.com`**. (The vault dates this Feb 2026; actual is 2026-01-28 — minor correction.)

**The single most-validated demand signal for a curated browser-game arcade is itself a static site on GitHub Pages.** Confidence: high.

| Flow | What a visitor gets | Failure |
|---|---|---|
| Discover | Docusaurus doc-site listing, "Browse Games" / "Submit a Game" nav, alphabetical | Thread's dominant ask was discovery: popularity sort, thumbnails ("cards with screenshots would be infinitely better"), randomization to stop alphabetically-early games dominating, publish dates, sort-by-new |
| Understand | Title, HN thread link, source link | **Fabricated metadata**: commenters found wrong HN thread IDs (Sandspiel, Lichess pointing at non-existent discussions); the creator acknowledged using an LLM to generate placeholder data that shipped as fake entries. **404s on GitHub links.** |
| Launch | Links out; no inline play | No account required (good) |
| Play | Off-site, on the creator's own host | Not the directory's problem — and not solvable by it |
| Return | Stable static URLs; custom domain in front of a `github.io` origin | The custom domain is the fragile layer; the `github.io` origin is the durable one |
| Share | Plain URLs, work fine | — |
| **Succession** | — | Susam explicitly raised maintainer-independent stewardship: *"future visitors are more likely to end up on the original but no-longer-maintained curated list."* Creator replied he'd just had a second child — *"time is a valuable resource atm."* Bus factor 1. |

**Read precisely: none of the top complaints is a preservation complaint.** They are discovery, metadata accuracy, and succession. A 12–18-game catalog answers none of the discovery asks and makes them worse.

### itch.io — the supply reality
**713,966 free browser games** (checked 2026-08-12). Per-tile: title, linked author profile, tagline, genre tags, "Play in browser". Filters span platform, genre, input method, session length, multiplayer, accessibility; sorts include Popular / New & Popular / Top-rated / Most Recent. Attribution is first-class and links to a creator page. *Could not verify by fetch:* whether an account is required to play (login exists in nav but mandatory-ness unconfirmed) — confidence medium.

**Failure:** creator-deleted games leave dead URLs; itch offers no byte verification and no rehostability, and does not want to.

### Poki — the polish benchmark, and the attribution failure
Front page is an art-first thumbnail mosaic with editorial rows ("Popular this week", "Top free games", "Poki web exclusive & licensed games"). *"No installs, no downloads, just click and play on any device."* No account required.

**Failure, and it is the sharp one: creator attribution is essentially absent from the browse surface.** Games appear with title and star rating; developer names are not surfaced. Prior vault observation (2026-08-07, first-hand): Poki **auto-executes** game code on page open, viable only because Poki publishes every game itself. Confidence high on attribution absence, medium on ad behavior (cannot verify runtime by fetch).

### js13kGames — the catalog that needs no rescuing
Year-partitioned archives; entries carry named authors; source on GitHub per entry; 13 KB limit makes every entry self-contained by construction. Org: 2,503 repos since 2013. Aggregate repo: 162 MB, 42 forks, actively maintained (pushed 2025-11-13). *Could not verify by fetch:* per-year page structure and whether specific 2012-era entries still load — the page is JS-rendered and returned only a title. Confidence high on repo facts, low on runtime playability of old entries.

### Internet Archive — Internet Arcade
**2,663 items** in the `internetarcade` collection (verified via advancedsearch JSON). Emulation in-browser via Emularity; Flash library runs on **Ruffle, adopted November 2020** — an archivist reported integration *"took less than a day and a half."* No account required.

**Failure:** the item pages are archival, not game-shaped — discovery is search-first, not art-first. Confidence medium (the detail page fetch returned only navigation chrome).

### Newgrounds — the 30-year survivor
Founded 1995-07-06; still hosts its historical Flash submissions. Survived Flash EOL via the **Newgrounds Player** (summer 2019) then **Ruffle** (from August 2019, primary after late 2020). Newgrounds *sponsors* Ruffle alongside Coolmath Games and Armor Games. Founder reports the majority of pre-2007 content runs under Ruffle.

**This is the actual preservation playbook: keep serving your own files, and fund a runtime re-implementation.** Neither half is a storage problem.

### What a good one feels like in 2026, and the common failure surface
Good = art-first discovery, zero account, one click to play, durable URL, visible attribution. **The common failure surface across all six is identical and is not preservation:** (i) attribution is weak or absent exactly where the catalog is most polished (Poki), (ii) metadata is unverified and sometimes fabricated (HN Arcade), (iii) dead links are silent, and (iv) succession is undefined (HN Arcade, bus factor 1).

---

## (b) Five operator-loss / dead-catalog case studies

| # | Case | Dates | What broke | Scale | What survived, and why |
|---|---|---|---|---|---|
| 1 | **Adobe Flash EOL** | Announced 2017-07-25; EOL **2020-12-31**; content-blocking time bomb **2021-01-12**; Chrome 88 (2021-01-20), Firefox 85 (2021-01-26) removed support | **Format/runtime obsolescence** — bytes were fine, the interpreter was withdrawn | Effectively the entire Flash web | **Ruffle** (Rust→WASM re-implementation, started 2016, desktop release 2020-10-01). As of 2026-08: AS1/2 at 99% language / 82% API; **AS3 only ~90% language / 82% API** — a decade in, still incomplete. Confidence: high |
| 2 | **GeoCities** | Announced **2009-04-23**, ceased **2009-10-26** (Japan ran to 2019-03-31) | **Operator shutdown** (Yahoo) | **38 million pages** | **Archive Team + Internet Archive.** ~900 GB released as a **641 GB 7z torrent on 2010-10-29**. Survived because volunteers made copies and distributed them by torrent — a mirrored tarball. Confidence: high |
| 3 | **Desura** | Linden Lab acquired 2013-07-10, sold to Bad Juju 2014-11-05; **Bad Juju bankruptcy June 2015**; offline 2016-03-19, briefly back 2016-03-29, **offline again Sept 2016**; auctioned to Behemouse summer 2020 | **Operator disappearance / bankruptcy** | Whole indie storefront; developers unpaid (payment backlog admitted 2015-05-22) | **Almost nothing.** Purchased-game access never resolved; the brand became an unrelated browser-game site. The lesson: DRM-free files users already downloaded survived; the catalog did not. Confidence: high |
| 4 | **Club Penguin** | Launched 2005-10-24; closure announced 2017-01-30; **shut down 2017-03-30** | **Rights enforcement defeating a successful preservation effort** | Flash-based MMO; fans *did* preserve it from downloaded SWFs | Club Penguin Rewritten (from 2017-02-12) reached 11M+ users, then **Disney DMCA takedowns 2020-05-15**, and **2022-04-13 City of London Police shut it down with three arrests**. Bytes were never the constraint. **Permanence is not a defense against rights holders — and EFS structurally cannot offer Flashpoint's removal compromise.** Confidence: high |
| 5 | **Glitch** | Launched 2011-09-27; **closed 2012-12-09**; assets + some source released **CC0** one year later | **Server dependency** — the client was preserved and freely licensed, and the game was still unplayable | Entire game | **The game itself was never preserved as playable.** Revival required *fan reimplementation*: Children of Ur (2013+, ActionScript ported to Dart, MIT), Eleven (2014+, MIT), Odd Giants (2019+). CC0 source + perfect bytes ≠ a playable game. Confidence: high |

**Supporting cases (lower weight):** **Kongregate** — stopped accepting submissions **2020-07-01**; ~124,000 games frozen in amber through ownership churn (GameStop 2010-07-23 → MTG 2017-06-20 for $55M → Monumental 2024) and a web3 detour (Kongregate.io NFTs July 2021; $40M Immutable X fund May 2022). **Shockwave.com** — launched 1999-08-02, passed through six owners (Macromedia → AtomShockwave → MTV/Viacom → Defy → Addicting Games → Enthusiast → sold again April 2024); Wikipedia records **no clean shutdown date and no account of the catalog's disposition**, which is itself the finding: catalogs usually don't die loudly, they get sold until nobody can say what happened. Confidence: medium.

**Cross-case synthesis.** Ranked by how often it actually killed a catalog: **(1) runtime/format obsolescence, (2) rights enforcement, (3) server dependency, (4) operator bankruptcy/churn.** Plain byte loss appears nowhere as a primary cause. The mechanisms that actually rescued things were: **volunteers holding copies** (GeoCities torrent, Flashpoint's 200,000+ apps / 1.68 TB, whose proxy *blocks* web requests specifically to defeat server dependency), **runtime re-implementation** (Ruffle), and **an operator who kept paying and kept serving** (Newgrounds, 30 years). EFS supplies none of these three.

---

## Classification of each claimed Arcade benefit

The adversarial test applied to each: *what would a static site on GitHub Pages plus a mirrored tarball fail to do?*

| # | Claimed benefit | Class | Reasoning |
|---|---|---|---|
| 1 | **Verified bytes / verify-before-execute** | **CONVENTIONAL-BASELINE-SUFFICIENT** | A signed manifest with sha256 per file gives identical guarantees; Git is already a content-addressed Merkle DAG; Sigstore/Rekor is a public transparency log doing exactly this, run by a nonprofit. The vault's own manifest already carries `"sha256"` per entry, chain-free. Worse: today `verifyContentHash` has **zero callers** and 67 files carry wrong-format hashes — EFS is currently *behind* the baseline on its own signature property. Also note the threat model is inverted: Club Penguin and the malware cases show the danger is malicious *original* content, which verified bytes faithfully preserve. |
| 2 | **Operator-independent link identity** | **CONVENTIONAL-BASELINE-SUFFICIENT (and arguably worse)** | EFS does not remove the operator; it *multiplies* intermediaries — chain liveness + RPC provider + IPFS gateway + an EFS-aware client, versus DNS + a host. Evidence: the vault's own probe recorded public-RPC 400s and `ERR_CONNECTION_CLOSED`; ~45 block-watchers per visitor; pins on one VPS. Meanwhile HN Arcade's `github.io` origin is the *durable* layer and its custom domain the fragile one. Sepolia is permissioned and on a replacement track. |
| 3 | **Mirror-fallback durability** | **CONVENTIONAL-BASELINE-SUFFICIENT** | 42 forks of `js13kGames/games` is mirror-fallback. IPFS pins "age out" unless pinned; 38.2% of NFTs point at plain HTTP and 59.1% at IPFS (DappRadar Q2 2024) — the on-chain-pointer + off-chain-bytes pattern *is* the link-rot pattern, with extra steps. |
| 4 | **Walk-away reconstruction / stranger rebuild** | **CONVENTIONAL-BASELINE-SUFFICIENT (baseline strictly better)** | `git clone` is the canonical walk-away, one command. The vault concedes a second operator today *"must re-derive everything from chain scans"* with zero committed receipts, and that the June seed's tooling is **permanently unrecoverable**. The vault's own J13 reconstruction recipe literally begins with `git clone`. |
| 5 | **Permissionless curator plurality** | **UNRESOLVED — and not blockchain-specific** | The vault calls this the one property no incumbent has. Two problems. (i) Forking a data repo *is* permissionless second-party curation over the same identities — osgameclones and awesome-lists are exactly this. (ii) The genuine residue — claims discoverable *from the object* rather than from the curator — is already shipped without a blockchain: **Nostr NIP-54** defines addressable wiki events where multiple authors write competing articles under the same normalized `d` tag, with NIP-51 curation sets layering trusted-curator lists on top. No chain, no gas, no RPC. Worse for the Arcade: plurality only becomes *user-visible* if a neutral client aggregates lenses, and the Arcade as specced is one operator's site. The vault half-admits this: *"plurality theater with one curator wearing two hats."* Evidence-bar test 4 (unprompted second party) is UNVALIDATED with zero instances. |
| 6 | **Creator-attributable, opt-in publishing** | **CONVENTIONAL-BASELINE-SUFFICIENT** | Signed Git commits, a PR from the creator's own account, or Sigstore give the same cryptographic fact. Note also the v2 ruling in project memory removes ERC-1271 authorship. **But the underlying *product* need is real and unmet** — Poki surfaces no creator names at all. That is a UI decision, not a substrate capability. |
| 7 | **Permanence / no-single-owner durability** | **CONVENTIONAL-BASELINE-SUFFICIENT (decisively)** | Software Heritage already archives the entire catalog automatically, content-addressed, UNESCO/Inria-backed, with persistent SWHIDs that resolve *"even if the original repository is removed or rewritten"* — no opt-in, no cost, no action. Against that: Sepolia (permissioned, replacement in planning, four EF testnets already retired) plus one VPS pin node. The vault's own honesty box concedes cease-own-distribution *"is close to effective removal in practice"* because gateways serve only because that one node serves. |
| 8 | **Replaceability + correct-without-erasing** | **CONVENTIONAL-BASELINE-SUFFICIENT** | This is `git commit` + `git revert`: immutable objects, movable refs, nothing erased, full history. Precisely the model EFS is re-deriving. |
| 9 | **Guest-fast, no-account, no-wallet play** | **CONVENTIONAL-BASELINE-SUFFICIENT** | Not an EFS property at all — a client property, and EFS makes it *harder*: the vault requires bypassing the entire stack (pure-util reads, build-baked catalog, dedicated RPC key) to reach parity with a plain static page. Poki and HN Arcade already deliver it with no substrate work. |
| 10 | **Idempotent re-publication proof** | **CONVENTIONAL-BASELINE-SUFFICIENT** | "Re-running the publisher makes no changes" is the default property of every static-site build and every `rsync`. It is a demo of EFS overcoming self-imposed cost, not a user benefit. |
| 11 | **Honest dead-link / tested-state metadata** | **UNRESOLVED — genuinely unmet, and the only real gap found** | HN Arcade's top complaints were fabricated metadata and 404s; no incumbent publishes verifiable tested-state. But nothing about solving it requires a chain — a CI job that fetches every entry weekly and commits the result to the data repo does it. Classify the *need* as real, the *EFS attribution* as unsupported. |

**Net: 9 CONVENTIONAL-BASELINE-SUFFICIENT, 2 UNRESOLVED, 0 EFS-SPECIFIC.** For the one the vault stakes its case on (curator plurality), the honest answer to "what would GitHub Pages plus a mirrored tarball fail to do?" is: *fail to make a second curator's claims discoverable from the game rather than from the curator* — and Nostr does that today without a blockchain, and the Arcade's single-operator surface cannot express it anyway.

---

## Recommendations (separated from evidence above)

1. **Drop preservation from the Arcade's public framing entirely.** The catalog is the least endangered software on the internet; the vault's own pitch-framing rule already half-concedes this. Any preservation claim invites — and loses — the Software Heritage and 42-forks comparison.
2. **If the Arcade ships, ship it as what the evidence supports: a guest-UX and metadata-honesty product.** The HN Arcade thread is a specification handed over for free — thumbnails, popularity sort, dates, randomization, verified links, declared succession. All static-site work.
3. **Treat the STOP trigger as closer than the vault assumes.** `product-and-communities.md` §6 says STOP if *"the differentiator demo cannot be made user-visible."* On this evidence the mirror-kill, tamper-rejection, rebuild, and idempotence beats are all baseline parity, and the plurality beat is unexpressible in a single-operator site. That is four of five beats non-differentiating before filming.
4. **Do not make permanence claims on Sepolia in public.** Four EF app testnets retired since 2022 and a replacement in active naming discussion; combined with one-VPS pin custody and 67 malformed hashes, the claim will not survive the Show HN audience the plan targets (U14).
5. **If preservation stays a goal anywhere in EFS, aim at the real killers:** runtime re-implementation, server-dependency capture (Flashpoint's request-blocking proxy is the state of the art), and rights posture. EFS addresses none of the three today, and its inability to remove content makes the third structurally worse.

---

## Confidence, sources, and gaps

**High confidence:** Flash EOL dates; Ruffle status and AS3 incompleteness; GeoCities figures; Desura timeline; Club Penguin arrests; Glitch non-preservation; HN Arcade existence/score/date/hosting and thread content; js13k repo facts; itch.io catalog size and metadata; Poki attribution absence; Internet Arcade item count; Sepolia permissioned status and the EF testnet retirement record; Nostr NIP-51/54 semantics; all vault quotations (read directly).

**Medium:** Shockwave catalog disposition (Wikipedia records no clean shutdown); Internet Archive detail-page UX; itch.io account-to-play requirement; Software Heritage's coverage *of these specific repos* (its archive API is behind bot protection — coverage asserted from stated policy of continuous GitHub mirroring, not per-repo verification).

**Low / not established — honest gaps:** runtime behavior of any portal (ads, latency, playability) cannot be verified by text fetch; whether specific 2012-era js13k entries still play; CrazyGames not walked; the **itch.io September 2024 registrar takedown and 2025 payment-processor deindexing were not verified this pass**; **GitHub Pages/repo takedown failure modes were not verified** — this is the most important gap, because it is the baseline's own weak point and I am recommending against EFS partly on the baseline's strength. A follow-up should close it before this memo is treated as settled.

**Key sources (all checked 2026-08-12):** `hn.algolia.com/api/v1/items/46793693`; `hnarcade.com`; `api.github.com/orgs/js13kGames`; `api.github.com/repos/js13kGames/games`; `itch.io/games/free/platform-web`; `poki.com`; `archive.org/advancedsearch.php?q=collection:internetarcade`; Wikipedia: Adobe Flash Player, Ruffle, Newgrounds, Flashpoint Archive, GeoCities, Desura, Kongregate, Club Penguin, Glitch, Shockwave.com; `ethereum.org/en/developers/docs/networks`; `blog.ethereum.org/2022/06/21/testnet-deprecation`; `blog.ethereum.org/2025/09/01/holesky-shutdown-announcement`; `ethereum-magicians.org/t/testnet-name-needed-for-sepolia-replacement/23221`; `etherworld.co` (ACDC #165, 2025-09-19); `docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html`; `softwareheritage.org/legal/content-policy`; `nips.nostr.com/51`, `/54`; vault files under `planning/Designs/arcade/` and `planning/Reviews/2026-08-07-arcade-corpus/`.
