# Recovered Claude memo — Case studies: Flash-era collapses

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:27:39.531Z
**Claude task:** `affdd0ac9089f2c56`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3409
**Original result length:** 26181 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
## Corrections to the brief's premises (before the findings)

Three of the candidates were mis-specified, and the corrections matter for the memo's argument:

1. **Adobe did not shut down Shockwave.com in April 2019.** Adobe killed the *Shockwave Player* (a runtime) on April 9, 2019. Adobe had not owned the shockwave.com *portal* since 2001. The domain is still live today (checked 2026-08-12) as an HTML5 casual-games site. The brand and the URL survived; the catalog did not. This is a clean example of why "the site is still up" is not evidence of preservation.
2. **The Adult Swim event is 2024–2026, not 2019–2022.** The Flash portal games came down in 2020 (runtime death); the Steam/console delisting wave was March–July 2024 (rights decision by Warner Bros. Discovery); the Adult Swim Games site itself shuttered in February 2026.
3. **Kongregate's ownership chain ends at Monumental (2024), not MTG.** GameStop (2010) → MTG (2017) → Monumental (2024, MTG retaining ~30%).

Also: my fetcher is blocked from `web.archive.org`, so I could not do independent Wayback verification on any claim. Flashpoint's `datahub` wiki and delistedgames.com both returned HTTP 403 to my fetcher. And the session's WebSearch budget (200 calls) was exhausted partway through, so later work is WebFetch-only against known URLs. All three limits are reflected in the confidence labels.

---

## Case 1 — Adobe Flash Player EOL

**Confidence: HIGH**

**Dates.** Announced July 2017. EOL December 31, 2020. Adobe began actively *blocking* Flash content in the installed player on **January 12, 2021** — a killswitch shipped into software already on users' machines.

**What broke: FORMAT/RUNTIME OBSOLESCENCE.** This is the critical classification. Nobody's hosting went away. The `.swf` files were fine. The *interpreter* was withdrawn and then remotely disabled. Adobe's own EOL page, asked whether Flash Player remains available: "No. Adobe has removed Flash Player download pages from its site," plus "Adobe strongly recommends all users immediately uninstall Flash Player."

**Scale.** Effectively the entire Flash web at once. Flashpoint's founder estimated the corpus at "literal tens of thousands of games over a period of twenty years" and warned "hundreds of thousands of games are likely to disappear from the internet, forever."

**What survived and why.** A **re-implemented runtime written by volunteers** (Ruffle), plus **volunteer-held copies of the files**. Nothing Adobe did preserved anything. Adobe's contribution was strictly destructive: it not only stopped distributing the runtime, it pushed a kill switch to disable content on machines that already had it.

Sources: https://www.adobe.com/products/flashplayer/end-of-life.html · https://learn.microsoft.com/en-us/lifecycle/announcements/update-adobe-flash-support · https://www.gamedeveloper.com/design/flashpoint-is-archiving-flash-games-before-they-disappear-forever

---

## Case 2 — Adobe Shockwave / Shockwave.com

**Confidence: HIGH on runtime dates and ownership chain; MEDIUM on catalog fate**

**Dates.** Adobe Director (the authoring tool) discontinued Feb 1, 2017; Shockwave Player for macOS discontinued Mar 1, 2017; Adobe announced in February 2019 that Shockwave and the Shockwave Player would be discontinued **effective April 9, 2019** — roughly one month's notice.

**Ownership chain of the portal** (this is the part the brief got wrong): Macromedia launched shockwave.com Aug 2, 1999 → AtomShockwave Corp (Jan 15, 2001; Macromedia held only 30%) → Atom Entertainment (Jan 11, 2006) → MTV Networks/Viacom (announced Aug 2006, $200M) → Defy Media (June 2014) → Addicting Games, Inc. (2018) → Enthusiast Gaming (Sept 2021) → resold April 2024, buyer unnamed in Wikipedia.

**What broke: FORMAT OBSOLESCENCE first, then OPERATOR CHURN.** Six owners in 25 years. Every handoff is a chance for the file store to not make the trip.

**Scale.** Wikipedia says the portal hosted "more than 400 games" by 2010 — I'd treat that as an undercount of the historical total. Flashpoint had configured "over 1000 Shockwave games" to be playable as of Oct 30, 2019. Shockwave content has an extra decay mechanism beyond the missing runtime: Anthony Kleine (Flashpoint) documents that Shockwave 3D "isn't compatible with newer Nvidia graphics cards on Windows 10, due to a basic buffer overflow error," and a timestamp bug that defaults dates to Jan 1, 1970. So even with the runtime in hand, the content rots.

**What survived and why.** Volunteer archives — Flashpoint, and Internet Archive collections including `shockwave.com-full-games`. **Not the operator.** shockwave.com is live today serving an unrelated HTML5 catalog with no notice acknowledging that its historical library is gone.

Sources: https://en.wikipedia.org/wiki/Adobe_Shockwave · https://en.wikipedia.org/wiki/Shockwave.com · https://medium.com/bluemaximas-flashpoint/the-story-of-shockwave-and-3d-webgames-8f3647865a7 · https://helpx.adobe.com/business/enterprise/kb/eol-adobe-flash-shockwave-player.html · https://www.shockwave.com/ (checked 2026-08-12)

---

## Case 3 — Adult Swim Games

**Confidence: HIGH — the best-documented rights-failure case in the set**

This is really two separate deaths with two different causes, and conflating them would weaken the memo.

**3a. The Flash portal (2020) — format obsolescence.** Robot Unicorn Attack (released Feb 4, 2010, developed by Spiritonin Media Games) and the *Five Minutes to Kill (Yourself)* series "were once available for free play on the Adult Swim website" and were "removed from the site in 2020, due to the discontinuation of Flash Player."

**3b. The delisting wave (2024) — RIGHTS. This is the important one.** Warner Bros. Discovery sent legal notices in early March 2024 giving developers a 60-day window before games were "retired" for "business changes." ~19 Adult Swim titles were on Steam. Documented delistings: Zenzizenzic, Traverser, Super House of Dead Ninjas, Mega Coin Squad — reported by Game Developer on July 5, 2024 (delisting "Tuesday"; a separate report says July 15, 2024 — **the exact day is contested across sources; do not state one**).

The load-bearing fact: **WBD refused to transfer the games back.** Developers asked for transfer to their own Steam publisher accounts; WBD declined, citing "logistical and resource constraints" and "limited capacity." Developers who wanted to keep their games alive had to re-release under their own accounts, **losing all wishlists and reviews**, and had to strip Adult Swim branding from the games.

Adult Swim's public notice claimed "the developer is not available to take over as publisher at this time." Bitmap Bureau (Super House of Dead Ninjas) publicly disputed this: they said they were active, willing, had attempted outreach repeatedly with no response, and offered — "We sold the IP to Adult Swim back in the day, but we're happy to buy it back if that's an option."

**3c. The endgame.** The Adult Swim Games website was shuttered **February 2026**. Pocket Mortys is set to close **April 13, 2026**. Rick and Morty: Virtual Rick-ality is the last title standing.

**What survived and why.** Two mechanisms, and they are different in kind:
- The 2024 native games: **a minority survived by individual rights negotiation.** Duck Game and Small Radios Big Televisions got publishing rights returned in May 2024. This required a named human at WBD saying yes, per game.
- The Flash games: **survived via a stranger's copy.** The Internet Archive's `robotunicornattack_flash` item was uploaded by a user handle ("mountain dew liberty brew") on **November 19, 2020** — the same day the Internet Archive announced its Flash emulation program, and *before* the killswitch. Adult Swim preserved nothing.

That contrast is the memo's core argument in miniature: the rights-holder path saved 2 of ~19 and destroyed the store metadata even when it worked; the volunteer-copy path saved the artifact outright.

Sources: https://en.wikipedia.org/wiki/Adult_Swim_Games · https://kotaku.com/adult-swim-wb-discovery-delist-deleted-games-steam-ps4-1851320858 (Mar 8, 2024) · https://www.gamedeveloper.com/business/adult-swim-delists-further-games-casts-doubt-on-developers-re-acquiring-rights (Jul 5, 2024) · https://archive.org/details/robotunicornattack_flash · https://en.wikipedia.org/wiki/Robot_Unicorn_Attack

---

## Case 4 — Kongregate

**Confidence: HIGH through 2022; LOW on the 2026 catalog state**

**Dates.** Founded Oct 10, 2006 (Emily and Jim Greer) → GameStop July 23, 2010 → MTG June 20, 2017 ($55M) → Monumental 2024 (MTG retains ~30%). Stopped accepting new web game submissions **July 1, 2020**, with layoffs, removal of badging for Flash, and shutdown of forums/chat. Flash games stopped working **Dec 31, 2020**. Ruffle integrated into kongregate.com **August 24, 2022** (announced in a Kongregate Medium post dated Sept 21, 2022).

**What broke: FORMAT OBSOLESCENCE + STRATEGIC ABANDONMENT.** Kongregate's own framing was that it would focus on "our internal game development and acquisitions rather than our legacy flash gaming platform." The catalog became a cost center that nobody's incentives protected.

**Scale.** Claimed library of 124,000–128,000 games across sources — **the number is inconsistent between sources and I could not verify either figure; treat as approximate.**

**What survived and why.** Kongregate did the right thing, and note *how*: it did not build anything. It **adopted the volunteers' runtime**. The Medium post: "On August 24, 2022, our engineers integrated the Ruffle Flash Player emulator into the Kongregate.com website, making thousands of Flash games once again available to play." Residual gap acknowledged: "some games, depending on how they were built/coded, will still require the SuperNova add-on."

**Caveat, flagged explicitly.** When I fetched `kongregate.com/en/flash-games` on 2026-08-12, the listing rendered "Showing games 1 - 0 of 0," and the page copy read like rewritten SEO text pointing users to *Flashpoint and Ruffle as third-party options* — i.e., the operator directing people to volunteer archives. The homepage still advertises "thousands of games." I could not reconcile these, and JS-rendered listings are unreliable through my fetcher. **Do not assert Kongregate's Flash catalog is dead in 2026 without a human checking the site directly.**

Sources: https://en.wikipedia.org/wiki/Kongregate · https://medium.com/@kongregate/unlocking-kongregates-flash-games-65cca6805e6d · https://www.gamedeveloper.com/game-platforms/kongregate-shuts-off-game-submissions-as-flash-s-final-days-approach · https://www.kongregate.com/ and /en/flash-games (checked 2026-08-12)

---

## Case 5 — Newgrounds (the survivor)

**Confidence: HIGH on dates/mechanism; MEDIUM on the "self-hosted" framing, which is structural inference**

**Dates.** Newgrounds Player (desktop app) created early 2019; v1.0.1 released Aug 4, 2019. It works by bundling **a Flash Player build from before Adobe added the killswitch** — a deliberate hoarding of a runtime binary. Ruffle was begun by Mike Welsh in **2016** under the name "Fluster"; Tom Fulp publicly announced it in a Newgrounds newspost on **August 23, 2019**; Newgrounds sponsored its development. Ruffle is MIT / Apache-2.0.

**Why it survived — three things, in order of importance:**
1. **It physically holds the artifacts.** Newgrounds' model was creators uploading `.swf` files to Newgrounds, which retained them. It was never a link aggregator. When the runtime died, it still had every file. (This is the structural point; I'm inferring it from the site's upload model rather than quoting a Newgrounds statement, hence MEDIUM.)
2. **It funded a replacement runtime rather than waiting for one.** Sponsoring Ruffle in 2019 — 16 months before EOL — is the single most consequential decision any operator in this entire research set made.
3. **It kept a belt-and-braces fallback.** The Newgrounds Player still ships as a fallback for content Ruffle can't yet handle. Users can also force the alternate path with `?emulate=flash`.

**Ruffle status as of August 2026:** ActionScript 1.0/2.0 at ~99% of the language and 82% of the API; ActionScript 3.0 at ~90% of the language and 82% of the API, with a further ~10% partial. **Coverage is still not 100% after seven years of work** — worth stating plainly in an adversarial memo, because "we'll just emulate it later" is a much longer and more expensive bet than people assume.

Sources: https://newgrounds.wiki.gg/wiki/Newgrounds_Player · https://en.wikipedia.org/wiki/Ruffle_(software) · https://techraptor.net/gaming/news/newgrounds-working-on-open-source-emulator-to-preserve-flash-content

---

## Case 6 — Flashpoint Archive

**Confidence: HIGH on the headline numbers and legal posture; LOW on the specific named lost games**

**Dates and growth curve.** Founded by Ben "BlueMaxima" Latimore (Australian); first release Dec 26, 2017. Growth:

| Date | Count | Size |
|---|---|---|
| Flashpoint 1.3.1 (article May 2, 2018) | ~850 games | — |
| Feb 1, 2020 (Kotaku) | 36,000+ | ~290 GB |
| Aug 12, 2026 (live FAQ counter) | **220,579** | 1.68 TB (Ultimate) |

126+ web technologies (Flash, Shockwave, Silverlight, Java applets, Unity Web Player, ActiveX, HTML5). Latest stable release 14.0.3 "Kingfisher," Nov 21, 2025. Latimore stepped down in early 2023; run by community contributors, non-profit via Open Collective Europe. Two distributions: **Infinity** (on-demand downloads) and **Ultimate** (full 1.68 TB local copy).

**Legal posture — quote this one verbatim in the memo:** Latimore, 2018: *"There's eventually going to be one question on the lips of everyone involved, though: is this legal? And the only real answer is nobody knows and really, nobody should care."* In practice it's **opt-out**: rights holders can request removal. Per the FAQ: "Alert us, either via our Discord or directly by email. We might try to convince you to let us keep your game or animation for historical sake, but we aren't unreasonable." **Nitrome exercised this in 2020 and had its games pulled.** So the volunteer archive is itself revocable by rights holders — the preservation layer inherits the rights problem it was built to route around.

**What it cannot preserve (the hard limits, from the FAQ directly):**
- **"Flashpoint does not provide capabilities for online multiplayer."** Flat statement, no qualifier.
- **Sitelock** — games that check their hosting domain and refuse to run.
- **"Multi-asset" games** that load additional files from web URLs at runtime. As of v1.3.1, ~20% of archived games required hacking, a local web server, or downloaded external resources to function.

**Permanently lost games.** Flashpoint maintains a "Lost Games" datahub page for titles it could not find anywhere. **I could not read this page — it returned HTTP 403 to my fetcher.** From a search-engine summary of that page (secondhand, MEDIUM-LOW confidence, verify before publishing): *Mamamoto* (Silent Bay Studios, multiplayer Shockwave racer, beta 2011, site ceased end of 2016, never left beta); *Tour de Flex* (2009–2014, source code survives but the binary web build is lost); *The Smurfs 2: Smurfette Vs Naughties* (Silent Bay Studios / Miniclip, 2013–2016). The stated mechanism is the one your memo needs: **many games existed on exactly one server, and when it went off, the game was gone.** The existence of the category is high-confidence; the individual titles are not, because I couldn't read the source.

Sources: https://flashpointarchive.org/faq (checked 2026-08-12) · https://flashpointarchive.org/ · https://en.wikipedia.org/wiki/Flashpoint_Archive · https://www.gamedeveloper.com/design/flashpoint-is-archiving-flash-games-before-they-disappear-forever (May 2, 2018) · https://kotaku.com/over-36-000-flash-games-have-been-saved-and-are-now-pla-1841389493 (Feb 1, 2020) · https://flashpointarchive.org/datahub/Games_Lost (403 to me)

---

## Case 7 — Internet Archive Flash emulation

**Confidence: HIGH**

Announced by Jason Scott on **November 19, 2020** — six weeks before EOL. Ruffle-based, integrated into the Emularity system, runs in any WebAssembly browser with no plugin. **Over 1,000 items at launch** — three orders of magnitude smaller than Flashpoint's corpus, which is the honest framing: IA's Flash program is a curated showcase, not the archive of record.

Stated limits, in IA's own words: "Ruffle's compatibility with Flash is less than 100%." The blog post's operating philosophy is **"Access Drives Preservation"** — access as the forcing function, not storage.

Sources: https://blog.archive.org/2020/11/19/flash-animations-live-forever-at-the-internet-archive/ · https://www.theregister.com/2020/11/20/internet_archive_flash_emulation/

---

## Case 8 — Neopets (the best natural experiment in the set)

**Confidence: HIGH**

Neopets ran a controlled comparison between the two preservation strategies and the volunteer one won by two orders of magnitude.

- 2019: announced it would transition Flash to HTML5 by end of 2020.
- April 2020: shipped HTML5 versions of **seven** games.
- January 2021: Flash discontinued; "most of the original Adobe Flash games impossible to play without workarounds." Parts of the site left non-functional.
- October 2021: **three more** HTML5 conversions. Running total after ~18 months of first-party effort: **10 games**, against a site housing "over 100 games."
- **July 2023: "most of the original Flash games were restored via the site's integration with the Ruffle Adobe Flash emulator,"** with some compatibility issues.

**First-party rewrite: 10 games in 18 months. Volunteer emulator: "most" of the catalog in one integration.** That's the number to put in the memo.

Sources: https://en.wikipedia.org/wiki/Neopets · https://en.wikipedia.org/wiki/Ruffle_(software)

---

## The hard limit: server-dependent games

You asked specifically for this. It's the strongest constraint on any preservation scheme and it is **not** solved by better storage, better addressing, or better hashing. Four documented cases:

**Club Penguin** — Disney shut the servers **March 29 or 30, 2017** (sources conflict; Wikipedia's CPR article says March 30, TechCrunch-era reporting says March 29 — **flag as contested**). Flash client, server-authoritative world. Archiving the client gives you nothing playable. *Club Penguin Rewritten* (launched Feb 12, 2017, 46 days before the original died) was built by restoring the original Flash client and **reverse-engineering a replacement server**. It reached 11M+ registered users and 140k Discord members — and was then killed by rights enforcement: **three arrests on April 12, 2022** on suspicion of distributing infringing material, site seized **April 13, 2022** by City of London Police at Disney's request, handed to the Police Intellectual Property Crime Unit. Both failure modes fired in sequence: server loss, then rights.

**Glitch** — closed **December 9, 2012**. Then Tiny Speck did the maximal cooperative thing: in November 2013 it released **10,000+ works of art, animations, and code under CC0**, including source for the Android and Flash browser clients. **Even total, unencumbered, public-domain release of every artifact did not make the game playable.** Volunteers (Children of Ur, and Eleven, merged March 2019 around a non-Flash Dart client) still had to rebuild the server from scratch, and were still at alpha in 2020. I have no confirmation of Eleven's status in 2026 — **do not claim it shipped.** Glitch is the single most useful case for an adversarial memo, because it isolates the variable: give a preservation scheme *everything* it could possibly ask for, and a server-dependent game still doesn't come back.

**FarmVille** — closed **December 31, 2020** (in-app payments cut **November 17, 2020**), directly triggered by Flash EOL and Facebook dropping Flash games. Peak 80M+ players. **Nothing survives.** The IA announcement thread named exactly this class: preserving such games "is hard or impossible, since it requires a back-end social infrastructure, not just a flash emulator."

**Toontown Online** — Disney closed it **September 19, 2013** (11:59 AM Pacific per the Toontown Fandom wiki; MEDIUM confidence on the time). *Toontown Rewritten* was rebuilt "entirely from publicly-available information and downloads" by volunteers and has run for over a decade. Disney has not moved against it. **The difference between Toontown Rewritten and Club Penguin Rewritten is not technical — it is whether the rights holder chose to enforce.** Preservation of server-dependent games survives at the pleasure of the IP owner.

Sources: https://en.wikipedia.org/wiki/Club_Penguin_Rewritten · https://techcrunch.com/2017/01/31/club-penguin-is-shutting-down/ · https://en.wikipedia.org/wiki/Glitch_(video_game) · https://archive.org/details/glitch-public-domain-game-art · https://massivelyop.com/2019/03/21/children-of-ur-and-eleven-join-forces-to-create-the-ultimate-glitch-revival/ · https://www.gamedeveloper.com/business/zynga-is-shutting-down-i-farmville-i-after-over-a-decade · https://en.wikipedia.org/wiki/Toontown_Rewritten

---

## Cross-case synthesis

**Which failure mode actually kills catalogs.** Ranked by observed body count, not by how much attention each gets:

1. **Runtime/format obsolescence — by far the largest killer.** Flash EOL and Shockwave EOL took out the entire era in a single stroke. Note the shape carefully: **the files were never lost.** Hosting stayed up. URLs kept resolving. Bytes stayed on disk, byte-identical. The *interpreter* was withdrawn and then remotely disabled. **Any preservation scheme that guarantees byte-durability and address-stability would have provided exactly zero protection against the dominant failure mode of this entire era.** If your memo has one adversarial finding, this is it.
2. **Rights and corporate indifference — the second killer, and the one that resists technical fixes entirely.** Adult Swim/WBD is the type specimen: the files existed, the developers were alive and asking, and the answer was still no, on grounds of "limited capacity." Nobody was hostile. Nobody profited. The catalog died because keeping it alive was nobody's job. Note that this failure mode also reaches *into* the preservation layer — Nitrome had its games pulled from Flashpoint in 2020, and Disney had Club Penguin Rewritten seized by police in 2022.
3. **Operator disappearance / churn — real but usually a slow multiplier.** Shockwave.com passed through six owners; Kongregate three. Each handoff is a chance for the file store to not survive the migration. Rarely the proximate cause; frequently the reason nobody has a copy when the proximate cause hits.
4. **Link rot / single-server hosting — the quiet one.** This is where games actually go *permanently* lost, per Flashpoint's Lost Games category: titles that existed on exactly one server, were never crawled, and vanished when it powered off. High per-title lethality, but it kills long-tail obscurities rather than catalogs.

**Which mechanism actually saved things.** Bluntly, and the answer is uncomfortable:

**Volunteers who kept copies, plus a re-implemented runtime someone wrote for free.** That is the whole answer. Every single survival in this research set traces to one or both:

- Flashpoint: 220,579 titles as of today, 1.68 TB, unpaid contributors, legal status the founder himself calls unknowable.
- Ruffle: begun by one person in 2016, MIT/Apache, and it is **the** thing that saved the era. It is what the Internet Archive runs (Nov 2020). What Armor Games runs (Dec 2020). What Coolmath runs (2020). What Kongregate runs (Aug 2022). What Neopets runs (Jul 2023). Every commercial operator that "saved its catalog" saved it by installing volunteer software.
- Newgrounds, the only real operator-side success, succeeded by (a) holding its own files and (b) *funding the volunteers* starting in 2019.

Against this: **not one catalog in this set was saved by its rights holder acting alone.** Adobe's contribution was a kill switch. WBD's was a refusal and a 60-day notice. Zynga's was a shutdown date. Disney's was a police raid on the people doing the preserving. Neopets tried in good faith with real engineers and shipped 10 games in 18 months before giving up and installing Ruffle.

**The three implications for a preservation product, stated adversarially:**

1. **Durable storage and stable addressing solve the failure mode that was not the problem.** Flash's bytes and URLs both survived fine. Executability is what died. A preservation guarantee that covers bytes but not *the ability to run them* is a guarantee against the fourth-most-common failure mode.
2. **Whatever runs the content must be re-implementable by someone other than the vendor, and the effort is far larger than anyone budgets.** Ruffle is seven years in, backed by real adoption, and ActionScript 3 sits at ~90% of the language / 82% of the API in August 2026. Plan for a decade of partial coverage, not a migration weekend.
3. **Server-dependent content is not preservable by any storage scheme, full stop, and Glitch proves it.** Tiny Speck released every asset and both clients into the public domain — the maximum cooperative act available to a rights holder — and volunteers *still* had to rebuild the server, and were still in alpha eight years later. If a catalog's value lives in live server state, no addressing scheme, no hash, and no durability promise recovers it. Be explicit in the memo about which fraction of any target catalog is in this class, because that fraction is unaddressable by the product regardless of design.

**Confidence summary:** Flash EOL, Adult Swim 2024, Newgrounds, Flashpoint headline figures, Internet Archive, Neopets, Glitch, FarmVille, Club Penguin Rewritten — **HIGH**. Shockwave catalog fate, Toontown details, Eleven's current status — **MEDIUM**. Kongregate's 2026 catalog state, Flashpoint's specific named lost games, exact July 2024 delisting day, Club Penguin's exact closure day (29th vs 30th) — **LOW, flagged inline, needs a human check before publication.**
