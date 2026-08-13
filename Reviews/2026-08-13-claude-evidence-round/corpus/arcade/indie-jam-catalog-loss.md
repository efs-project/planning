# Recovered Claude memo — Case studies: indie/jam catalog loss

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:29:07.406Z
**Claude task:** `a581572e71fbe296c`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3421
**Original result length:** 34615 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Research complete. Web search budget was exhausted near the end, but I got everything except one forward-looking claim, and I found a live failure that changes the shape of the memo.

---

# Operator-loss case studies: indie showcases, jams, hosting platforms

All URLs checked **2026-08-12** (direct network probes ran 2026-08-13 ~04:20 UTC).

## ⚠️ Correction to your premise, and a live finding

1. **The itch.io domain takedown was December 2024, not September 2024.** Nothing supports a September date.
2. **ldjam.com — the entire Ludum Dare catalog from LD37 (2016) onward — is DOWN RIGHT NOW and has been for ~3 months.** I verified this myself. Details in Case 5. This is your strongest case study and it is happening today.

---

## Case 1 — itch.io domain takedown (Funko / BrandShield)

**Dates:** Reported Mon **2024-12-09**; restored same day / within hours. Funko and BrandShield issued statements **2024-12-10**.
**Classification:** Intermediary failure — **registrar**, compounded by automated brand-protection tooling.

**Mechanism:** A user made a fan page for *Funko Fusion*. BrandShield (Funko's AI brand-protection vendor) filed reports characterized as **"fraud and phishing"** — not DMCA — to both itch.io's host (Linode) and its registrar, **iwantmyname**. The registrar put the domain on **`serverHold`**, which nulls the entire domain, not a page. itch.io had already removed the offending page and disabled the account, but per Corcoran the registrar "ignored our response."

**Scale:** 100% of itch.io — every game page, every download URL, every developer's storefront — dark simultaneously. itch.io said it would deploy a replacement domain if downtime exceeded 8 hours.

**What survived and why:** Nothing needed rescuing; the outage was availability-only. Files, DB, and hosting were untouched. Recovery came from **Leaf Corcoran having a human relationship channel to the registrar** — i.e., social recourse, not technical redundancy. Had iwantmyname not answered, itch.io's fallback was a *new domain*, which would have broken every inbound link, every embed, and every bookmark on the internet pointing at itch.io.

**Contested:** Funko: "One of our brand protection partners identified a page on itch.io imitating the Funko Fusion development website" — claims it asked for one URL. BrandShield: "we... requested a takedown of the URL in question – not of the entire itch.io domain," blaming service providers. Corcoran: "I honestly think they're the malicious actor in all of this." **Report all three; the parties disagree on fault.**

**Confidence: HIGH** (mechanism, registrar, date). *Medium* on exact outage duration — reporting says "hours," I found no precise figure.

Sources: https://www.gamedeveloper.com/business/itch-io-taken-down-by-collectible-maker-funko-and-ai-tool-brand-shield · https://www.videogameschronicle.com/news/funko-and-brandshield-say-it-wasnt-their-fault-itch-io-was-taken-offline-site-creator-says-otherwise/ · https://news.ycombinator.com/item?id=42363727

---

## Case 2 — itch.io NSFW deindexing (payment-processor pressure)

**Dates:** *No Mercy* banned from itch.io **April 2025** → Collective Shout campaign, **July 2025** → itch.io deindexes all adult NSFW content **2025-07-24** (no advance notice to creators) → free adult content re-indexing announced **2025-07-31** → paid adult content still gated as of the last update I could source.
**Classification:** Intermediary failure — **payment processors** (Stripe named; Visa/Mastercard/PayPal targeted by the campaign).

**What actually happened to the files — this is the part most people get wrong:**
- Pages were **deindexed**, not deleted. itch.io: *"Pages that are 'deindexed' are still accessible if you own them. They have not been removed from your library or collections."*
- **Direct URLs kept working.** Downloads for prior purchasers stayed live *"assuming the creator has not taken down the page."*
- A **separate, smaller** set of pages got permanent content notices — those the team "can no longer support" — and some were permanently removed.
- Corcoran's own advice: *"I personally recommend you maintain control over the content you own. itch.io is a DRM-free platform from day 1 for this reason."*

**Scale:** **Unverified.** A "20,000+ pages" figure circulates on aggregator blogs (DigitrendZ, Gaming Amigos). I could not confirm it in itch.io's own posts or in PC Gamer / Aftermath / GameDeveloper / TechCrunch. **Do not use that number as fact.** What is solid: "all adult NSFW content," defined as pages flagged sensitive AND tagged porn/mature/lewd/erotic/hentai/fetish.

**What survived and why:** The bytes and the URLs. What died was **discoverability and monetization** — which for a jam/showcase catalog is most of the value. A game nobody can find or buy is preserved in the same sense a book in a sealed vault is published. Survival mechanism: DRM-free downloads already in buyers' hands, plus itch.io choosing the *softest available* enforcement action.

**Confidence: HIGH** on mechanism and the delist-vs-delete distinction (primary source). **LOW** on scale numbers.

Sources: https://itch.io/updates/update-on-nsfw-content · https://itch.io/t/5149036/reindexing-adult-nsfw-content · https://aftermath.site/itch-io-nsfw-adult-content-remove-payment-processors-collective-shout/ · https://www.gamedeveloper.com/business/itch-io-deindexing-adult-content-to-appease-payments-providers · https://www.pcgamer.com/games/itch-io-releases-list-of-the-adult-content-you-cant-put-on-its-store-anymore-after-anti-nsfw-crackdown-including-stuff-thats-not-illegal-but-just-icky/

**Companion data point (same wave):** Valve quietly changed its rules ~**2025-07-16** and delisted **100+ (reported by Kotaku as "hundreds of")** adult games from Steam, confirming payment-processor pressure. Two independent, differently-architected platforms hit by the *same* intermediary in the same month. **Confidence: MEDIUM-HIGH** (count varies by outlet). https://www.pcgamer.com/software/platforms/valve-confirms-credit-card-companies-pressured-it-to-delist-certain-adult-games-from-steam/ · https://kotaku.com/steam-valve-adult-content-sex-games-online-safety-act-1851786391

---

## Case 3 — Desura / Bad Juju Games

**Dates:** Linden Lab sells Desura to Bad Juju **late 2014** → developer payments already in arrears **early–mid 2015** → **Chapter 7** (total liquidation) filed **June 2015** → site offline **~Sept–Nov 2016** → OnePlay acquires assets **Oct 2016**, promises Q1 2017 revival → **revival never happened**.
**Classification:** Operator disappearance / bankruptcy.

**Scale & specifics:** The cleanest documented figure comes from developer David S. Gallant (*I Get This Call Every Day*), GameDeveloper, **2015-10-13**, updated **2016-07-04**: **605 customers** lost access to that one title. He could not migrate them because **"Desura decided to completely anonymize customer data"** — he had no email addresses. Desura "stopped communicating with developers, their Twitter is inactive, they don't respond to email." Desura was ~8% of that game's sales and ~5% of net profit. Archive Team classifies Desura's status as **"Lost."**

**What survived and why:** Two things, unevenly. (a) Desura was **DRM-free**, so already-downloaded copies kept running forever — the single most important design decision in this whole memo. (b) Basically nothing else: no catalog export, no key migration, no customer list, no storefront archive. The client installer from 2013 is on archive.org. **The bytes users had already pulled to local disk survived; the index, the entitlements, and the social graph did not.**

**Confidence: HIGH** on bankruptcy (June 2015) and the developer's account. **MEDIUM** on the precise offline date (Wayback-derived Oct/Nov 2016 vs. "September 2016" in secondary sources — they disagree; say "late 2016").

Sources: https://www.gamedeveloper.com/business/desura-died-took-my-customers-down-with-them · https://wiki.archiveteam.org/index.php/Desura · https://www.gamedeveloper.com/business/desura-s-parent-company-has-filed-for-bankruptcy · https://futureproofgames.com/blog/2017/09/19/indiegamestand-and-desura/

---

## Case 4 — Ludum Dare, part 1: the old compo site (pre-2016 entries)

**Dates:** New site built from 2015, soft-launched **2016**, first ran an event **LD37, Nov/Dec 2016**. Old `ludumdare.com/compo` (WordPress) was **taken down**; the current notice says data migration was intended but "old code issues prevented this." Wayback coverage is recommended for **dates prior to February 2022**.
**Classification:** Operator-initiated migration failure + link rot.

**Scale:** LD1–LD36 — roughly 15 years and tens of thousands of entries — no longer live at their original URLs.

**What survived and why — and this is the useful nuance:**
- The old site was **server-rendered WordPress**. I confirmed via Wayback CDX that `ludumdare.com/compo/*` pages are archived as **real HTML with real content**. The *pages* survived because the technology was crawler-legible.
- A community member (udo@openfu.com) scraped the old WordPress DB into **ludumdata.openfu.com**. That mirror **has since had its historical data access disabled** — reportedly due to volume of takedown/deletion demands from authors. So the volunteer rescue *itself* decayed, for **rights reasons**, not technical ones.
- **The game files mostly did not survive.** Old LD entries linked to Dropbox, personal domains, mediafire, etc. The compo site archived the *entry page*, never the *binary*. Community threads show developers re-uploading builds to itch.io years later because "the Ludum Dare Archive is gone."

**Confidence: HIGH** on the takedown and the Wayback-legibility of the old site (verified directly). **MEDIUM** on the openfu mirror's takedown rationale (single secondary source).

Sources: https://ludumdare.com/compo/ · https://ludumdare.com/resources/guides/migration/ · https://ludumdata.openfu.com/ · https://en.wikipedia.org/wiki/Ludum_Dare

---

## Case 5 — Ludum Dare, part 2: **ldjam.com is dark right now** ⚠️ LEAD FINDING

This is not history. I verified it during this research.

**Timeline (verified by direct probe + Wayback CDX):**

| Date | State |
|---|---|
| **2025-01-14** | Kasprzak posts "Taking a break" — cancels **both** 2025 events (LD57 April, LD58 October) for "financial, medical, family, and health reasons"; *"I'm in a bad place"* financially |
| **2025-04-03** | "Ludum Dare 57 is back! Sponsored by GameMaker" — partial recovery |
| **2026-05-14** | Last Wayback capture of ldjam.com returning **HTTP 200** |
| **2026-06-01** | First Wayback capture returning **HTTP 400** |
| **2026-06-16** | Let's Encrypt cert for `ldjam.com` and `api.ldjam.com` **expires** (notAfter Jun 16 15:12:24 2026 GMT) |
| **2026-06-01 → 2026-08-10** | **Every** Wayback capture returns **HTTP 400**. Unbroken. |
| **2026-08-13 (my probe)** | `curl https://ldjam.com/` → `SSL certificate problem: certificate has expired`. With `-k` → HTTP 400, Akamai edge error page (`errors.edgesuite.net`, "Invalid URL"). DNS resolves to Akamai (184.25.113.x). Same for `api.ldjam.com`. |

**So: the Ludum Dare catalog has been hard-down for ~2.5–3 months, and nobody has filed a GitHub issue about it** (the `LudumDare/ludumdare.com` issue tracker's newest open issue is from Sep 2024). `ludumdare.com` (the info site, on Cloudflare) is still up at HTTP 200 and shows **no news since 2025-04-03** — no outage notice, nothing.

Note the ordering: **the 400 predates the cert expiry by ~2 weeks.** The origin/CDN mapping broke first; the cert then lapsed on top of it. That's the signature of *nobody is home* — an unattended-infrastructure death, not an incident.

**Classification:** Operator exhaustion → unattended infrastructure decay (CDN config + TLS renewal) → total catalog unavailability. Note that Ludum Dare's hosting partners are **Akamai and Linode** (announced 2022-04-22), i.e. this is *sponsored* infra whose configuration outlived its administrator's attention.

**Scale:** All events LD37→LD57 (2016–2025), ~20 events, every entry page, every rating, every comment thread.

**What survived — and the brutal part:**

I fetched a Wayback capture of an ldjam.com content page (`/events/ludum-dare/50/$276398/celebrating-20-years-of-ludum-dare-on-april-1st`, captured 2022-03-13). Result: **3,778 bytes. Three references to `api.ldjam.com`. A `<noscript>` tag. The page's actual title text is not present.**

**ldjam.com is a client-rendered SPA. The Internet Archive's copy of it is an empty shell.** The content lived behind a JSON API the crawler never systematically fetched. Spot-checking `api.ldjam.com/vx/*`, Wayback has *incidental* captures of individual endpoints (`comment/getbynode/101462` etc.) — scattered, opportunistic, nowhere near a reconstructable catalog.

**The 2004-era WordPress site archived correctly. The 2016-era SPA did not.** The "modern" rewrite that was supposed to save Ludum Dare's data made it *less* recoverable than the thing it replaced. This is the single best argument in your memo, and it is empirically verifiable in five minutes by anyone reading it.

**Confidence: HIGH** — direct probes, reproducible CDX queries, primary GitHub issue tracker.

⚠️ **One claim I could NOT verify:** a Threads post from a news account (@knoebelnews) states *"Long-running game jam Ludum Dare is winding down and will be officially ending in October 2028."* I have **no primary source** — nothing on ludumdare.com, nothing in the GitHub org. **LOW confidence. Do not put this in the memo as fact.** (My web-search budget ran out before I could chase the primary; worth one more pass.)

Sources: https://ludumdare.com/ · https://ludumdare.com/news/ · https://github.com/LudumDare/ludumdare.com/issues · https://www.gamedeveloper.com/production/online-game-jam-ludum-dare-scraps-2025-event-schedule · CDX: `https://web.archive.org/cdx/search/cdx?url=ldjam.com&from=20260101&to=20260813&output=json&fl=timestamp,statuscode`

---

## Case 6 — GeoCities (the canonical rescue story)

**Dates:** Yahoo announces closure **April 2009**; US closure date confirmed **July 2009**; shut down **2009-10-26** (Archive Team's wiki says actual cutoff ~12:30 PM PST **Oct 27**).
**Classification:** Operator kills catalog deliberately.

**Scale:** 15 years of user content; GeoCities had been the **3rd most-browsed site on the web**. Free tier was 15 MB/user. Archive Team: *"millions of files, user accounts, all gone"* — "the most amount of history in the shortest amount of time."

**What survived and why:** Archive Team harvested **April–October 2009** with "several dozen people and hundreds of machine instances," releasing a **~900 GB torrent** (a later patched edition by Dragan Espenschied is ~1 TB) on **2010-10-29**. Parallel independent efforts: Internet Archive, Reocities, Oocities, geocities.ws, Internet Archaeology. **Archive Team claims "a significant percentage" — they explicitly do not claim completeness, and no coverage percentage is published.**

**Why it survived:** static HTML on predictable URL patterns, crawler-legible, no API, no auth, no JS rendering, and **~6 months of advance warning**. Every one of those properties is absent from ldjam.com.

**Confidence: HIGH** on dates/mechanism/torrent size. **LOW** on any "% saved" claim — don't assert one.

Sources: https://wiki.archiveteam.org/index.php/GeoCities · https://ascii.textfiles.com/archives/2720 · https://archive.org/details/2009-archiveteam-geocities-part1 · https://www.techdirt.com/2010/10/29/archive-of-geocities-released-as-a-1tb-torrent/

---

## Case 7 — YoYo Games Sandbox (GameMaker's hosting portal)

**Dates:** Portal moved to sandbox.yoyogames.com **2011** → **2014** submissions closed, library stays readable → **Oct 2014** YoYo announces "GameMaker: Player" as replacement → **2016-04-08** official removal.
**Classification:** Operator strategic pivot; catalog abandoned as collateral.

**Scale:** **~150,000 games uploaded** over the site's life; **~100,000+ saved** (the games present in 2014). *Note:* these figures come from yygarchive.org's About page and secondary write-ups; **the Archive Team wiki page itself gives no counts** and only says "a very small number of games were missed."

**What survived and why:** Archive Team scraped the whole Sandbox to **WARC** (preserving page-to-page structure, not just files), plus per-letter ZIP bundles of the downloads. Available as the `archiveteam_gamemaker` collection on archive.org, a searchable front-end at **yygarchive.org**, and the Wayback Machine. **The replacement product (GameMaker: Player) never meaningfully materialized** — so the volunteer archive is the only surviving catalog.

Critically: it survived because the site served **actual game files from its own domain** at scrapeable URLs. Contrast Ludum Dare, which served *links to other people's Dropboxes*.

**Confidence: HIGH** on dates and archival method. **MEDIUM** on the 150k/100k counts.

Sources: https://wiki.archiveteam.org/index.php/GameMaker_Sandbox · https://yygarchive.org/about · https://en.wikipedia.org/wiki/YoYo_Games

---

## Case 8 — Yahoo Games

**Dates:** Bulk closed **2014-03-31**; remainder **2016-02-09**; final shutdown **2016-05-13** (in-game purchases stopped **2016-03-14**). Announced **2016-03-15** per Engadget — note reporting dates and shutdown dates conflict across sources; **treat the precise sequence as MEDIUM confidence.**
**Classification:** Runtime/platform obsolescence + operator exit.

**Scale:** **1,400+ games**, most externally developed.
**Yahoo's stated reason:** *"changes in supporting technologies and increased security requirements for our own Yahoo! web pages, made it impossible to keep the games running safely and securely"* — i.e., Flash and Java.

**What survived:** Little that I could source. This is the weakest-documented case in the set; the runtime problem (Flash/Java) overlaps the Flash side you've scoped out. **I'd cut this or use it in one line.**
**Confidence: MEDIUM** on dates, **LOW** on survival.

Sources: https://www.engadget.com/2016-03-15-yahoo-games-shut-down-may.html · https://en.wikipedia.org/wiki/Yahoo!_Games

---

## Case 9 — Google Code (the "well-run shutdown" baseline)

**Dates:** Announced **2015-03-12/13** → **read-only 2015-08-24** (source, issues, wikis still browsable) → **closed 2016-01-25**, with a **public archive** and **per-project tarballs** (source + issues + wikis) downloadable through the rest of 2016. Google shipped a **Google Code → GitHub exporter**.
**Classification:** Planned deprecation, executed competently.

**What this proves for your memo:** a ~10-month wind-down, a read-only phase, machine-readable per-project exports, a migration tool, and a persistent archive is what "doing it right" costs. **Google — with effectively unlimited resources — is the only operator in this entire list that did it.** Nobody running a game jam has that budget. That's the argument: *"just do a good shutdown"* is not a plan, it's a wish.

**Confidence: HIGH.**

Sources: https://opensource.googleblog.com/2015/03/farewell-to-google-code.html · https://wiki.archiveteam.org/index.php/Google_Code

---

## Case 10 — Yahoo Groups

**Dates:** Verizon announces **2019-10-16** that all archived content dies **2019-12-14** → extended to **2020-01-31** → all public content (messages, files, photos, attachments) **deleted**, groups continue email-only → full shutdown announced **2020-10-13**, effective **2020-12-15**.
**Classification:** Deliberate deletion by acquirer, **with active obstruction of archiving** (Slate documented Verizon rate-limiting/blocking archivers).

**Scale:** Archive Team found **~1.5 million groups** with public archives, est. **2.1 billion messages**; preserved **1M+ groups**.
**What survived and why:** volunteer scraping under a ~2-month deadline against an operator actively fighting them. Fandom communities (OTW/Fanlore documented this extensively) lost decades of material.

**Confidence: HIGH.**

Sources: https://waxy.org/2019/11/the-deletion-of-yahoo-groups-and-archive-teams-rescue-effort/ · https://slate.com/technology/2019/12/yahoo-groups-is-ending-and-verizon-is-making-it-hard-for-people-to-archive-its-content.html · https://fanlore.org/wiki/Yahoo!_Groups_Content_Purge

---

## Case 11 — Vine (the archive that also died)

**Dates:** Shutdown announced **Oct 2016**; app discontinued **Jan 2017**; Twitter launches an official Vine **archive 2017-01-20**; **archive itself shut down April 2019**. Archive Team ran a rescue from Oct 2016.
**Classification:** Operator exit → operator-provided archive → *archive* operator exit.

**Why it matters:** **the official preservation gesture had a 2-year half-life.** "We'll keep an archive up" is a promise with the same durability as the original service. (Musk/X later claimed to have "found the Vine video archive" — treat as unverified corporate PR.)

**Confidence: MEDIUM** on the 2019 archive shutdown; **LOW** on the X restoration claims.

Sources: https://archive.org/details/archiveteam_vine_20170119193153 · https://www.entrepreneur.com/business-news/elon-musk-says-x-found-the-vine-archive-restoring-access/495479

---

# GitHub Pages durability — the baseline's real failure modes

You asked specifically. **GitHub Pages has documented, exercised failure modes at every layer.** These aren't hypotheticals; each has a public record.

### 1. Mass DMCA against a fork network — **the big one**
**2024-04-29 → May 2024:** Nintendo filed one DMCA notice against yuzu. Because the fork network exceeded 100 repos and Nintendo alleged all forks infringed equally, **GitHub processed it against the entire network: 8,535 repositories in a single action.** Owners were notified and offered counter-notice.
**Read this carefully for your memo: "just fork it, distributed redundancy" is defeated by one form submission, because GitHub treats a fork network as one object.** Every mirror of your jam catalog that is a *GitHub fork* dies together.
**Confidence: HIGH.** https://github.com/github/dmca/blob/master/2024/04/2024-04-29-nintendo.md · https://www.nintendolife.com/news/2024/05/nintendo-wipes-out-8535-yuzu-repositories-in-one-big-dmca-takedown

### 2. Single-repo DMCA, later reversed — youtube-dl
**2020-10-23:** RIAA notice; GitHub complied **within 24 hours**; repo + forks replaced with "Repository unavailable due to DMCA takedown." **Restored 2020-11-16** after EFF intervened; GitHub created a **$1M developer defense fund**. Roughly **3.5 weeks dark**.
Relevant to you: **disabling a repo disables its GitHub Pages site.** Project docs/site vanish with the code.
**Confidence: HIGH** on the takedown/restore timeline. *Medium* on the specific Pages-site downtime — I found no source that separately timestamps the `ytdl-org.github.io` outage; **verify before asserting it.**
https://www.eff.org/deeplinks/2020/11/github-reinstates-youtube-dl-after-riaas-abuse-dmca · https://github.com/github/dmca/blob/master/2020/10/2020-10-23-RIAA.md

### 3. Sanctions — account-level, no notice, no counter-notice
**2022-08-08:** OFAC designates Tornado Cash. **Within hours**, GitHub removed the repositories and **suspended the personal accounts of at least three individual contributors** (Semenov, Storm, Pertsev) — including their unrelated personal work. Code was later partially reinstated read-only. First time the US applied sanctions to an open-source project.
**2019-07-29:** GitHub confirmed restricting developers in **Iran, Syria, Crimea** (and Cuba/NK) under export controls — private repos, Marketplace, paid orgs cut off. Developer Hamed Saeedi reported being blocked **without notice and without the chance to download his own code**. GitHub explicitly prohibited VPN circumvention. Note: public repos and **Pages stayed available but restricted to non-commercial personal communication**.
**Confidence: HIGH (both).** https://www.theregister.com/2022/08/10/github_tornado_cookies/ · https://techcrunch.com/2019/07/29/github-ban-sanctioned-countries/

### 4. GitHub's own written limits — primary source, and they're stricter than people assume
From https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits:
- Published site **may be no larger than 1 GB** (source repo: 1 GB recommended)
- **Soft bandwidth limit: 100 GB/month**
- **Soft limit: 10 builds/hour**; deployments time out at 10 minutes
- **One user/org site per account**
- **Prohibited:** running an online business or e-commerce, commercial SaaS, facilitating commercial transactions, handling sensitive data, plus anything violating GitHub ToS
- **Enforcement:** GitHub "may stop serving the site," send support email recommending you migrate to different hosting, or apply **HTTP 429** rate limiting

**A jam catalog with WebGL/Unity builds blows the 1 GB site cap almost immediately.** A catalog that goes viral blows 100 GB/month. And if the jam ever sells anything, it's in prohibited-use territory. **Confidence: HIGH — this is GitHub's own documentation.**

### 5. Owner-initiated deletion / account deletion
Deleting the repo or the account takes the Pages site with it, instantly, with no external review. GitHub documents unpublishing as a first-class, one-click operation. I found a plausible example — the **3kh0.net** games site hosted on Pages, shut down and repo archived, games no longer playable at the original URLs — but **the sourcing is thin (search-result summary only). LOW confidence; verify before citing.**

### The one genuine GitHub *success* case
**js13kGames** (founded 2012, Andrzej Mazur) maintains **`js13kGames/games` — "The production code of all games on the js13kGames.com website."** 510 commits, actively maintained, and the 13 KB size cap means the *entire* catalog is trivially small. Entry counts per Wikipedia: 62 (2012) → 253 (2017) → 197 (2025); **~2,400 entries total across 14 years.**

**Why it works, and it's the whole thesis:** (a) games are **self-contained static bundles**, not links to Dropbox; (b) a **13 KB hard cap** makes the full catalog fit in a single repo forever; (c) the catalog lives **in the same versioned artifact as the site**. Anyone can `git clone` the entire history of the competition.

**Caveats — be honest in the memo:** the repo has **37 stars / 42 forks**, so real-world redundancy is thin; and `wrangler.jsonc` in the repo indicates the *live* play site now runs on **Cloudflare Workers**, not GitHub Pages. So js13k proves the **content-shape** argument (self-contained, size-capped, in-repo), not the **GitHub-Pages-specifically** argument.
**Confidence: MEDIUM-HIGH** on the repo's existence and role; **MEDIUM** on the preservation claim (no explicit archival statement from the org).
https://github.com/js13kGames/games · https://en.wikipedia.org/wiki/Js13kGames

---

# Synthesis: what actually kills catalogs, and what an on-chain content-addressed index would and wouldn't fix

### The failure modes, ranked by observed frequency in this evidence set

**1. The index dies while the bytes live. (Most common by far.)**
GeoCities, YoYo Sandbox, old Ludum Dare, ldjam.com *right now*, Desura, itch.io NSFW. In nearly every case the game files existed somewhere at the moment of failure — on the operator's disks, on users' drives, on third-party hosts. **What was destroyed was the mapping: title → author → event → ranking → file.** Preservation is overwhelmingly an *indexing* problem, not a *storage* problem.

**2. Link rot in the index's leaves.**
The old Ludum Dare compo site is the pure case: pages archived fine, but the entries pointed at Dropbox/personal sites that evaporated. Baseline rate, Pew Research **2024-05-17**: **38% of pages that existed in 2013 were gone by Oct 2023; 25% of all pages from 2013–2023 gone.** A 15-year-old jam catalog of external links is, statistically, mostly dead. https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/

**3. Intermediaries you never chose and cannot appeal to.**
Registrar (itch.io/iwantmyname, Dec 2024). Payment processors (itch.io + Steam, July 2025). Automated brand-protection bots (BrandShield). OFAC (Tornado Cash). Export controls (GitHub 2019). **None of these are the operator, and none have a duty to your catalog.** The itch.io registrar case is the sharpest: one automated *fraud* report — deliberately not a DMCA, to route around due process — nulled an entire platform.

**4. Operator exhaustion — the quiet one, and the one nobody models.**
Ludum Dare is the proof. Not bankruptcy, not acquisition, not legal action: **one person had a bad year.** "Financial, medical, family, and health reasons," January 2025 → 18 months later the CDN mapping breaks, the cert lapses, and a 20-event catalog goes dark with **no announcement, no issue filed, and no one noticing.** Compare Desura, which at least made noise. Silent decay is worse than loud death because no rescue is triggered.

**5. Rights pressure on the *archive*, not the original.**
ludumdata.openfu.com — the volunteer Ludum Dare rescue — disabled its own historical data because of deletion demands from authors. Yahoo Groups: Verizon actively obstructed archivers. **Preservation and authors' right-to-delete are in genuine conflict, and the archive usually loses.** Do not hand-wave this.

### What survived, every time, and why

Three properties, and only three:

- **The bytes were already on someone else's disk** (Desura's DRM-free downloads; itch.io's DRM-free policy — Corcoran's own recommendation).
- **The content was crawler-legible static files at predictable URLs** (GeoCities, YoYo Sandbox, old WordPress Ludum Dare, js13k).
- **Volunteers got advance warning and a scraping window** (GeoCities ~6 months, Yahoo Groups ~2 months, YoYo Sandbox ~18 months).

**ldjam.com had zero of the three.** SPA behind a JSON API (not crawler-legible), entries linking off-site (bytes not co-located), and no warning at all (the outage was never announced). Hence: 20 events, effectively gone, with the Internet Archive holding 3.8 KB shells.

### Now the blunt part: what a content-addressed on-chain index would and would not have prevented

**Would have prevented — genuinely:**

- **The Ludum Dare SPA archival failure.** This is the strongest case you have. The catalog was only readable through one operator's live API; when that stopped, the record stopped. An index whose entries are content hashes plus resolvable metadata is readable without the operator running anything. **This is a real, current, verifiable win.**
- **Silent decay going unnoticed.** A hash-addressed index makes "is this still retrievable?" a mechanically checkable question. Nobody filed a GitHub issue about ldjam.com for ~3 months. An index you can continuously verify turns silent decay into a monitorable signal.
- **Registrar/DNS single point of failure.** itch.io's fallback plan was a new domain — which breaks every link. Content addresses don't depend on a domain resolving.
- **Ambiguity about what was lost.** Desura's developers couldn't even enumerate their customers or catalog. An immutable index gives you a manifest — you at least know precisely what's missing.

**Would NOT have prevented — say this plainly, or the memo gets torn apart:**

- **Payment processors.** July 2025 destroyed *monetization and discoverability*, not files. A chain index does nothing about Visa's rules. And note itch.io's response was the *soft* one — files stayed up, URLs stayed live. The intermediary problem is commercial, not technical.
- **DMCA and sanctions.** Nintendo's 8,535-repo takedown, youtube-dl, Tornado Cash, GitHub's export-control blocks — these target *hosts and people*, and they will target pinning services, gateways, and front-ends exactly the same way. Tornado Cash is the on-the-nose precedent: **an on-chain artifact whose developers' GitHub accounts were suspended and whose front-ends were pulled.** An on-chain index is not a rights-pressure escape hatch. Anyone claiming otherwise is selling something.
- **The bytes actually disappearing.** A hash is a *name*, not a *copy*. If nobody pinned the file, `bafy…`/`Qm…` resolving to nothing is exactly as dead as a 404 — arguably worse, because it *looks* durable. **Every case in this list is ultimately a "who pays for the storage" problem, and content addressing does not answer that question.** It only makes the failure legible and the copies fungible.
- **Rights-holder deletion demands.** openfu's mirror died because authors demanded removal. Immutability makes this *harder*, not easier — that's a liability to address head-on, not a feature.
- **Operator exhaustion at the ingestion layer.** Somebody still has to write entries into the index during the jam. If the organizer burns out mid-event, nothing gets indexed at all.

### Honest scorecard on the conventional baseline (static site + Git + mirrored tarball)

**Blunt verdict: the baseline is strong, and much stronger than the on-chain pitch usually admits.** js13kGames demonstrates it working for 14 years and ~2,400 entries. Google Code shows a competent tarball-export wind-down. Static HTML archived cleanly in every case in this dataset where it was used; the SPA did not.

**But it has four documented, non-theoretical holes:**
1. **Fork-network takedown** collapses your redundancy to one object — 8,535 repos, one notice (Nintendo, May 2024).
2. **Account-level enforcement** with no notice and no counter-notice path (Tornado Cash Aug 2022; GitHub sanctions July 2019 — a dev locked out *without the chance to download his own code*).
3. **Hard published limits**: 1 GB site, 100 GB/mo bandwidth, commercial use prohibited (GitHub's own docs). A game catalog hits these; a text blog doesn't.
4. **The tarball is only as good as its pinning and its mirrors** — and openfu, Vine's official archive, and Desura all show that the *archive* is itself an operated service that dies.

**The sharpest framing for the memo:** don't argue "on-chain beats GitHub Pages." Argue that **every case here died at the index layer, and the baseline's index is a single mutable pointer under one company's enforcement jurisdiction** — which has been exercised, repeatedly, at scale, against exactly this kind of content. Then concede that content addressing solves *naming and verifiability*, not *storage economics or legal pressure*, and that a serious design needs an answer to "who pins this in year seven" — because that is the question ldjam.com just failed, in public, this summer.
