# Virtual OS Museum — Purpose and History

**Status:** research-lane report for the 2026-07-29 Virtual OS Museum deep dive; evidence record, not canon
**Agent:** history-and-goals lane (claude-fable-5 workflow), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/content #topic/clientv2

## 1. Who the curator is, and when/why the collection began

- The curator is **Andrew Warkentin** (online handle andreww591), based in **Canada** (VERIFIED — schema.org Person markup on virtualosmuseum.org names "Andrew Warkentin", `addressCountry: Canada`; every git commit in the launcher repo is authored "Andrew Warkentin"; the repo README carries "Copyright 2004-2026 Andrew Warkentin"; the site's /about-the-curator page uses the same name). The briefing handle "andreww591" checks out as his username on GitLab, Blogspot, Patreon, Ko-fi, BlueSky, and Internet Archive (VERIFIED).
- He self-describes as an "OS/emulator developer and OS historian", developer of **UX/RT**, an open-source QNX-like RTOS (VERIFIED — site markup, Patreon, blog).
- Origin story, in his own words on /about-the-curator: he began collecting emulated OS images in **2003**, after switching from Windows to Linux; he discovered historical timesharing systems through references in the **Jargon File and FOLDOC**, found tape images for **ITS running on SIMH**, and "After that I was hooked and kept finding more OSes and emulators to install." (VERIFIED). The repo copyright line says 2004; the about page says 2003 — the collection predates any public artifact by ~20 years either way (VERIFIED).
- Why it stayed private so long: he "soon started to organize the image folders, write generic launch scripts, add documentation, and write notes", but only pushed toward public release in recent years — "I now regret not doing it much earlier." He attributes the long silence partly to autism: "an extremely crippling tendency to stay quiet, not due to social anxiety but just inertia" (VERIFIED — about page; the README repeats the autism/employment context).
- A precipitating event for the 2026 push: a "major conglomerate" had been interested in UX/RT as a QNX replacement (they paid to fly him out to meet them) but "indefinitely suspended their project", after which he refocused effort onto the museum (VERIFIED — repo README and May 2026 launch blog post).

## 2. Timeline (assembled from primary sources)

| Date | Event | Evidence |
|---|---|---|
| 2003 | Starts collecting emulated OSes (ITS-on-SIMH hook) | /about-the-curator (VERIFIED) |
| 2004 | Copyright start year on launcher/scripts/metadata | repo README (VERIFIED) |
| 2023-02/2023-11 | First standalone rare-OS images uploaded to archive.org under andreww591 (1B/V3 demo, LynxOS 3/4, MaxOS) | IA search API (VERIFIED) |
| 2023-03-10 | First commit of the standard boot-script infrastructure, hash `cae8412e8b56e099660e866246f258e1c251b66e` | git history (VERIFIED) |
| 2023-12-08 | Blog post "Starting a YouTube channel and uploading my OS collection to the Internet Archive": collection then "over 1500 images representing nearly 600 OS variants for over 250 platforms", sorted by platform with standard directory structure and launch scripts; upload promised "within the next few weeks" | blog (VERIFIED) |
| 2024-01-03 | YouTube channel "Andrew's OS Lab" created; burst of blog posts (Unix family history, microkernels, QNX 6.1 review) | YouTube channel metadata, blog feed (VERIFIED) |
| 2024-02-07 | `virtualosmuseum-site` repo created on GitLab; domain goes up as an empty Jekyll placeholder ("Your awesome title"), captured by Wayback 2024-04-15 and unchanged through 2025-07-15 | GitLab API, Wayback CDX + capture (VERIFIED) |
| 2024–2026 | Steady trickle of individual pre-installed images to archive.org (VSTa, Chokanji 4, Charon-HPA/MPE, Ultrix, QNX 2.21, MachTen, VM/370, Atari System V, AIX PS/2) | IA search API (VERIFIED) |
| 2025-07-06 | Main `virtualosmuseum/virtualosmuseum` repo created on GitLab | GitLab API (VERIFIED) |
| by 2026-05-10 | Full museum site live (soft launch): "1,700+ pre-installed operating systems, ready to run", download links present | Wayback capture 2026-05-10 (VERIFIED) |
| 2026-05-19 | Public release: blog announcement; first release artifact `virtual_os_museum-2026.05.19-lite.zip`; OSNews story same day | blog, IA file list, OSNews (VERIFIED) |
| 2026-05-20 | Internet Archive items published: lite edition, full edition (539.6 GB item incl. multiple versions), and `virtual_os_museum_apt` (238.5 GB apt package repository); HN thread "I've built a virtual museum with nearly every operating system you can think of" — 974 points, 224 comments, submitted by andreww591; Adafruit and Boing Boing coverage | IA API, HN, press (VERIFIED) |
| 2026-05-23/25 | The Register (Liam Proven), 9to5Mac, winbuzzer coverage; heise, Hackster, MacSparky follow | press (VERIFIED headlines/dates; Hackster body not readable — 403) |
| 2026-05-30/31, 2026-06-02 | Bug-fix releases; **default hypervisor switched from VirtualBox to QEMU** on Linux and Windows | blog 2026-06-02, IA file list (VERIFIED) |
| 2026-06-12 / 06-15 | Current full (2026.06.12, 130 GB zipped / 184 GB unzipped) and lite (2026.06.15, 14 GB / 22 GB) releases | downloads page with SHA256s (VERIFIED) |
| 2026-06-19 | First pure content update delivered through the launcher (early TempleOS "J OS" 2005, Unite, ABCenix, plusBASIC, OPUS, IRIX moved from MAME to IRIS emulator "an order of magnitude or more" faster) | blog (VERIFIED) |
| 2026-07-18 | Latest launcher-repo commit at access time, hash `8d4763c173dfb8a8c8191551d98f6b689cd0eaea` — active post-launch maintenance | git history (VERIFIED) |

- The December 2023 "few weeks" plan slipped ~2.5 years and changed shape — instead of a raw folder dump to IA, it became a curated VM with launcher, database, and packaging. His launch post concedes "getting it to a point where it's actually half-decent took way more work than I thought" (VERIFIED). The gap between "I have the bytes" and "someone else can run this" consumed 2.5 years of a 20-year project (INFERRED from the above).

## 3. The preservation failure it targets: "available somewhere" ≠ "one click and actually works"

The homepage states the thesis directly (VERIFIED, paraphrasing closely): even though emulators and images exist scattered across archive sites, "it often still takes time and effort to get runnable VM installations from them" because OSes have complicated install procedures, may depend on particular device configurations within an emulator, "will only run in certain emulator versions, breaking in later ones due to regressions", and emulators may have complex config files or need a specific host environment.

Concrete mechanisms in the museum that encode this lesson (all VERIFIED by code/README inspection of the launcher repo):

- **Emulator-version pinning per installation**: the `Installation` DB entity has an `emulator_version` field, and boot scripts read `$OSM_EMULATOR_VERSION` (commits 2026-07-16/18 extend this to Hatari and Hercules). Multiple versions of the same emulator ship side by side because "a decent number [of OSes] only run in particular emulator versions due to regressions in later versions" (homepage).
- **Emulator patching**: over 150 different emulators are used (creator's HN comment); "some emulators needed minor patches to run on modern Linux or to play nice with the launcher. A few emulators have been patched to run OSes that were previously broken" (homepage). Patched sources are provided in a source archive per the CREDITS file.
- **Environment hacks preserved as code**: e.g. a `faketree` wrapper to give the Arnold CPC emulator per-installation config dirs instead of a hardcoded `~/.Arnold` (commit 2026-06-27); 86Box boot scripts auto-revert NVRAM to a known-good copy "to use a fixed RTC date for timebombed OSes like many Windows betas" (commit 2024-02-18).
- **Snapshots as a first-class exhibit-integrity feature**: every VM gets a BTRFS-subvolume `initial` snapshot; `final_pre_upgrade` and `pre_restore` snapshots protect user state; broken installations revert in one click (README + scripts).
- **Update channel without re-downloading**: guest VMs and their metadata are Debian/apt packages served from a 238.5 GB repository mirrored on archive.org; the launcher checks for updates to itself, system packages, and guest VMs (VERIFIED — scripts, IA `virtual_os_museum_apt` item, README).
- Even so, executable preservation is never "done": at release only about half the installations had been re-verified ("I am still in the process of testing all of the individual guest VMs" — README; "approximately half" — launch blog post), and the first month surfaced host-side failures he could not reproduce locally, forcing the VirtualBox→QEMU default switch ("VirtualBox is less than ideal for this kind of thing" — June 2 post) (VERIFIED).

## 4. Scale and scope (figures verified 2026-07-29)

- Site front page tiles: **1700+** installations, **250+** platforms, **570+** distinct OSes, **1948–now** (VERIFIED — raw HTML). The README (repo and site) says "over 600 distinct OSes", and the May 2026 launch post said "nearly 600"; the site's 570+ tile is the more conservative figure and the three do not agree exactly (VERIFIED discrepancy). The Dec 2023 post's "nearly 600 OS variants" suggests the counting basis shifted between "variants" and "distinct OSes" (INFERRED).
- Span: Manchester Baby "Baby factor demo" (1948, first program for a stored-program computer) and Scheme A (1951, presented as the first operating system) through CTSS, Multics, PDP-7 Unix V0, Xerox Alto, Lisa OS, all major classic Mac OS and DOS/Windows lines incl. pre-reset Longhorn betas, NeXTSTEP, early Android pre-releases, up to recent hobby OSes (VERIFIED — README highlights).
- Headroom: "I probably have enough images available to at least reach somewhere between 2000 and 3000 installations" (VERIFIED — README). Curation policy is "breadth over depth" — representative major versions, not every minor build (VERIFIED).
- Explicit exclusions: console/arcade games (well-preserved elsewhere, still sold, takedown-prone), user-level API emulators except as hosts, and commercial OS versions newer than 10 years, still sold, or recently subject to takedowns (VERIFIED — README "What's not included").

## 5. Bytes vs. usable environment

The museum preserves the *runnable context*, not just images (all VERIFIED by inspection):

- The launcher database (Pony ORM over per-installation info files; PySide6/Qt GUI launched via `fades`) models `Country`, `Developer`, `CPU` (with word sizes, integration levels, introduction/discontinue dates), `Platform`, `Family`, `Variant`, `Emulator`, `MachineConfig`, `BootScenario`, and `Installation` — the latter with `readme`, `launch_instructions`, `long_description`, `orig_release_date`, `network_addresses`, `remote_access`, `output_files`, `orig_source_url`, `confirmed_working`, and `emulator_version` fields.
- **Credentials**: the launcher displays "Logins" route text per installation (controllers.py), i.e. working usernames/passwords ship as metadata.
- **Peripherals**: `output_files` and launcher buttons expose emulated printer and card-punch output; terminal/file-transfer connection buttons cover systems accessed remotely (README).
- **Applications and period context**: "Many installations also include various add-on software - applications, development tools, games, utilities, etc. - set up the way it actually might have been used" (homepage).
- **Provenance**: pre-installed images from third parties are credited to original sources in CREDITS.md (~267 credited links across emulators and image sources) (VERIFIED).

## 6. Roadmap and what it reveals

Stated plans (VERIFIED — README, blog posts, HN comments): finish testing all installations; grow toward 2000–3000 installations (more Linux distros and underrepresented categories); an **ARM-native host VM** (with user-mode x86 emulation for closed-source emulators); an **"exhibit" feature** combining curated VM lists with short descriptive articles per topic; **integration with a dedicated wiki**; a "first major emulator development project" (unnamed as of June 2026); YouTube restoration/tour videos. Browser-based delivery was considered and rejected: too many emulators have no web version and the launcher infrastructure would need a complete parallel implementation (VERIFIED — creator's HN comment).

What the roadmap implies about unmet needs (INFERRED): raw runnability is necessary but not sufficient for a *museum* — interpretation (exhibits/wiki) is the missing layer; portability of the preservation container itself (x86-only host VM) is a real constraint; and the community immediately asked for finer-grained access (per-OS downloads, searchable list) than the monolithic-VM model provides (VERIFIED requests in HN thread; the lite edition's on-demand apt downloads are the partial answer).

## 7. Sustainability

- **Patreon** (patreon.com/andreww591, "creating the OS of the future and preserving those of the past"), from $2/month; OS-themed tiers named in CREDITS: Application, Shell, Device Driver, and Process Manager levels; **17 patrons** listed as of the 2026-06-18 credits update (VERIFIED — CREDITS.md, Patreon page). Perks: patron Discord channel, suggestion priority, early ad-free videos, credit shout-outs (VERIFIED — README).
- **Ko-fi** tips plus Bitcoin and Ether addresses in the README (delivered with a disclaimer that he is "not at all a cryptobro") (VERIFIED).
- **Discord "Andrew's OS Lab"**: ~473 members, ~102 online at access time (VERIFIED — Discord invite API); bridged Fluxer community (VERIFIED — README).
- **YouTube**: 2.54K subscribers, 8 videos, 65,910 total views, joined 2024-01-03 (VERIFIED — channel metadata). Stated aspiration is "a few videos/blog posts a month" with "multiple new OS images a week" installed; actual public cadence has been bursty (Dec 2023–Jan 2024, then May–July 2026), while repo commits show near-daily work May–July 2026 (VERIFIED).
- Personal economics are explicit and fragile: "the only money I have coming in at the moment is from income support"; he is seeking freelance/remote work and corporate sponsorship for UX/RT (VERIFIED — README). Community members already worry about longevity for a different reason: "I fear it will be taken down for legal reasons sadly. If you want it, get it now" (VERIFIED comment on Lemmy, an experience/opinion, not a fact about any actual takedown).

## 8. Licensing and redistribution posture (important nuance)

- The **launcher, scripts, and metadata** are "licensed for non-commercial redistribution only": the repo ships the MAME non-commercial license text (LICENSE.md) and CC BY-NC-SA 4.0 (LICENSE-cc.md) (VERIFIED). This is source-available/non-commercial, **not** OSI open source (VERIFIED — license texts).
- Guest software: "Everything else retains its original license. Any commercial software in this collection is included for purposes of historical research and preservation only", with a 10-year/still-sold/takedown exclusion policy and removal on copyright-holder request (VERIFIED — downloads page, README). Much of the collection is therefore unlicensed commercial abandonware distributed on a preservation rationale — *not* freely redistributable as of right (INFERRED from the above; the curator's own hosting posture concedes this).
- Distribution history: initial Cloudflare-fronted downloads had delivery problems at launch; distribution moved to BitTorrent plus archive.org (VERIFIED — OSNews comments, downloads page offering torrent + IA for every artifact).

## 9. Press record and corrections

- Coverage: OSNews 2026-05-19 (Thom Holwerda: "amount of love, work, and care"), Adafruit 2026-05-20, Boing Boing 2026-05-20, The Register 2026-05-23 (Liam Proven), 9to5Mac 2026-05-25, winbuzzer 2026-05-25, heise online, Hackster.io, MacSparky 2026-06; HN front page 974 points (VERIFIED dates/headlines).
- Press error worth recording: Boing Boing's headline "A virtual museum runs 570 operating systems in your browser" is wrong — the museum is a downloadable VM, and the curator explicitly rejected browser delivery as infeasible (VERIFIED contradiction).
- Size figures drift across sources: full edition was 121 GB zipped / 174 GB unzipped at launch (Register, Hackster headline) and is 130 GB / 184 GB for the 2026.06.12 release (downloads page); "174 GB"-era numbers in press are stale but were accurate at publication (VERIFIED).

## Sources

| URL | What it evidences | Accessed | Grade |
|---|---|---|---|
| https://virtualosmuseum.org/ | Stats tiles (1700+/250+/570+/1948-now), thesis text, schema.org Person (Andrew Warkentin, Canada), nav | 2026-07-29 | A |
| https://virtualosmuseum.org/about-the-curator | 2003 origin, ITS/SIMH/Jargon File hook, autism/quietness, UX/RT background | 2026-07-29 | A |
| https://virtualosmuseum.org/readme/ | Full README: scope, launcher, snapshots, exclusions, roadmap (exhibits, wiki, ARM host), support | 2026-07-29 | A |
| https://virtualosmuseum.org/downloads/ | Versions 2026.06.12/2026.06.15, sizes, SHA256s, torrent+IA distribution, "historical research and preservation only" statement | 2026-07-29 | A |
| https://gitlab.com/virtualosmuseum/virtualosmuseum | Launcher/scripts/metadata source; git history 2023-03-10 (`cae8412e`) to 2026-07-18 (`8d4763c1`), 684 commits, all authored Andrew Warkentin; LICENSE.md (MAME NC), LICENSE-cc.md (CC BY-NC-SA 4.0); CREDITS patrons/emulators; data model (models.py), boot-script hacks | 2026-07-29 (shallow clone + unshallow) | A/B |
| GitLab API: /api/v4/groups/virtualosmuseum/projects | Repo creation dates: site 2024-02-07, main 2025-07-06, host-scripts 2026-02-25; last activity dates | 2026-07-29 | A |
| https://andreww591.blogspot.com/2026/05/ive-released-virtual-museum-with-nearly.html | Launch announcement 2026-05-19; "over 20 years of collecting"; ~half tested; conglomerate/UX/RT backstory | 2026-07-29 | A |
| https://andreww591.blogspot.com/2026/06/a-new-bug-fix-release-of-virtual-os.html | VirtualBox→QEMU default switch; unreproducible host bugs; external-update path | 2026-07-29 | A |
| https://andreww591.blogspot.com/2026/06/virtual-os-museum-update-early-templeos.html | First launcher-delivered content update; IRIX MAME→IRIS speedup; emulator-dev project teaser | 2026-07-29 | A |
| https://andreww591.blogspot.com/2023/12/starting-youtube-channel-and-uploading.html | Dec 2023 state: 1500+ images / ~600 variants / 250+ platforms; original IA-upload plan | 2026-07-29 | A |
| https://archive.org/details/virtual_os_museum_lite_edition | Upload 2026-05-20 by andreww591; release artifacts 2026.05.19→2026.06.15; 5,929 views | 2026-07-29 | A |
| archive.org advancedsearch (uploader andreww591) | Full upload history 2018–2026; full edition 539.6 GB item; apt repo item 238.5 GB; external update 2026-06-01 | 2026-07-29 | A |
| Wayback CDX + captures of virtualosmuseum.org | Placeholder Jekyll page 2024-04→2025-07; full site live by 2026-05-10 ("nearly 600 distinct OSes" then) | 2026-07-29 | B |
| https://news.ycombinator.com/item?id=48195009 | 974 pts / 224 comments; creator comments (150+ emulators, no-browser rationale, nested virt, gaps); community requests | 2026-07-29 | C (creator comments: B) |
| https://www.osnews.com/story/145006/the-virtual-os-museum/ | 2026-05-19 coverage; launch sizes 121/14 GB; Cloudflare→torrent/IA distribution fix; creator comment on QEMU priority | 2026-07-29 | C |
| https://www.theregister.com/oses/2026/05/23/the-virtual-os-museum-opens-its-doors/5243459 | 2026-05-23 Liam Proven article; launch sizes; licensing quote; Canadian developer | 2026-07-29 | C |
| https://lemmy.world/post/47302182 | Creator's release post; community takedown worry | 2026-07-29 | C |
| https://www.youtube.com/channel/UCc3raIZZP60_3XdjYZtsChg | Channel joined 2024-01-03; 2.54K subs; 8 videos; 65,910 views | 2026-07-29 | A |
| https://www.patreon.com/andreww591 | Membership from $2/month; creator description | 2026-07-29 | A |
| Discord invite API (invite xRFhBrDqcg) | "Andrew's OS Lab" server: ~473 members, ~102 online | 2026-07-29 | B |
| https://www.hackster.io/news/andrew-warkentin-s-virtual-os-museum-collects-174gb-of-ready-to-use-vintage-operating-systems-79b8c3954bd1 | Press headline confirming curator name and 174 GB launch-era size (body inaccessible, HTTP 403; headline via search) | 2026-07-29 | C |
| https://boingboing.net/2026/05/20/a-virtual-museum-runs-570-operating-systems-in-your-browser.html | Press coverage; headline contains the "in your browser" error (not fetched; headline via search) | 2026-07-29 | C |
