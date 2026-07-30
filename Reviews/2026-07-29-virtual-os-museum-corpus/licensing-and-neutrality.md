# Virtual OS Museum: Licensing, Openness, Neutrality, and Legal Reality

**Status:** research-lane report for the 2026-07-29 Virtual OS Museum deep dive; evidence record, not canon
**Agent:** licensing-and-neutrality (claude-fable-5 workflow), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/content #topic/clientv2

---

## 0. Object under study

The Virtual OS Museum (virtualosmuseum.org) is a collection of 1,700+ pre-installed, pre-configured emulated OS installations (~600 distinct OSes, 250+ platforms, 1948–present) shipped as a single x86 Linux VM for QEMU/VirtualBox/UTM, with a custom Python/PySide6 launcher (VERIFIED — site and repo README). It is created, curated, and operated by one person: Andrew Warkentin ("andreww591"), an OS/emulator developer in Canada, also the author of the UX/RT OS (VERIFIED — about-the-curator page). Public release was May 2026: the Internet Archive items were uploaded 2026-05-20 by andreww591@gmail.com, and press coverage (Hackster, Adafruit, 9to5Mac, The Verge) ran 2026-05-20 through 2026-06-09 (VERIFIED — IA metadata API, press links).

Current release versions: full edition `2026.06.12` (130 GB zipped / 184 GB unzipped, SHA-256 `34158c63…64799a`), lite edition `2026.06.15` (14 GB / 22 GB, SHA-256 `95dc87ac…04b461`), plus an "external update" zip (VERIFIED — downloads page). Code repos inspected by shallow clone on 2026-07-29:

- `gitlab.com/virtualosmuseum/virtualosmuseum` (launcher + scripts + emulator metadata), HEAD `8d4763c173dfb8a8c8191551d98f6b689cd0eaea`, 2026-07-18, 684 commits, **exactly one contributor** (Andrew Warkentin) per the GitLab contributors API (VERIFIED — code inspection + API).
- `gitlab.com/virtualosmuseum/virtualosmuseum-host-scripts` (host-side wrappers + bundled QEMU/VirtualBox/UTM binaries), HEAD `e876676d2e94d2f5ccb099ca49c3ec43e0f51583`, 2026-05-25 (VERIFIED).
- `virtualosmuseum-site` (Jekyll site, includes the .torrent files; no LICENSE file of its own) (VERIFIED).
- Two experiment repos, `virtualosmuseum-site-test` and `virtualosmuseum-webtorrent-test` (GitLab Pages / WebTorrent distribution experiments, created 2026-05-20) (VERIFIED — GitLab API; purpose INFERRED from names and contents).

---

## 1. Launcher and script licensing: source-available, not open source

### 1.1 The license text

The launcher and all scripts are under a **custom license that is verbatim the pre-2016 "MAME license"** — the site's /license page says so explicitly: "this is the same license as older MAME versions" (VERIFIED — license page). Operative clauses, quoted from the site's /license page (identical in substance to the repo `LICENSE.md`):

> "Redistribution and use of this code or any derivative works are permitted provided that the following conditions are met:
> - Redistributions may not be sold, nor may they be used in a commercial product or activity.
> - Redistributions that are modified from the original source must include the complete source code, including the source code for all components used by a binary built from the modified sources. [OS-component exception follows]
> - Redistributions must reproduce the above copyright notice, this list of conditions and the following disclaimer …"

with "Copyright Andrew Warkentin / All rights reserved." and a BSD-style warranty disclaimer (VERIFIED — license page read in full).

**Licensing-hygiene defect:** the `LICENSE.md` actually shipped in the launcher git repo is an unedited copy of the MAME original — it still reads "all code in MAME is released under the following license" and "Copyright Nicola Salmoria and the MAME team", not Andrew Warkentin (VERIFIED — repo file at commit `8d4763c1`). The website version re-attributes the copyright; the in-repo file does not. The repo `README.md` line 3 states "Copyright 2004-2026 Andrew Warkentin (launcher, scripts, and metadata only)" and "licensed for non-commercial redistribution only" (VERIFIED). The mismatch is cosmetic but means the artifact a forker actually receives carries the wrong copyright line (INFERRED).

### 1.2 Against the Open Source Definition and FSF criteria

- OSD criterion 1 (Free Redistribution): "The license shall not restrict any party from selling or giving away the software…" (VERIFIED — opensource.org/osd). The clause "Redistributions may not be sold" directly violates this (INFERRED — direct application of the text).
- OSD criterion 6 (No Discrimination Against Fields of Endeavor): "…it may not restrict the program from being used in a business…" (VERIFIED — opensource.org/osd). The clause "nor may they be used in a commercial product or activity" directly violates this (INFERRED).
- FSF: freedom 0 is "The freedom to run the program as you wish, for any purpose", and the FSF states that excluding "commercial use, commercial development or commercial distribution" renders a program nonfree (VERIFIED — gnu.org free-sw page). The launcher license is therefore nonfree by FSF criteria (INFERRED).
- Corroborating precedent: MAME itself announced on 2016-03-04, "After 19 years, MAME is now available under an OSI-compliant and FSF-approved license" (GPL-2.0+ overall, most files 3-clause BSD) — i.e., the MAME project's own position is that this exact license text, which it abandoned, was *not* OSI-compliant or FSF-approved (VERIFIED — mamedev.org announcement).

**Classification: the launcher and scripts are "source available with a copyleft-style source requirement for modified redistributions, noncommercial-only". They are not open source and not free software** (INFERRED, firmly grounded as above). Note the copyleft-ish clause only binds *modified* redistributions; verbatim redistribution requires no source but is still noncommercial-only (VERIFIED — license text).

### 1.3 Practical source availability

All launcher/script code is genuinely public and complete in the GitLab repo — Python launcher (`os_museum_launcher` package), ~35 shell scripts (boot, snapshots, downloads, update), emulator config metadata for 164 emulator variants (VERIFIED — clone inspection). Development is active (last commit 2026-07-18). Merge requests and issues are open to the public (VERIFIED — GitLab project settings via API).

---

## 2. Metadata licensing

- License: **CC BY-NC-SA 4.0 International** — the site's /license-cc page reproduces the full 4.0 legal code under the heading "Attribution-NonCommercial-ShareAlike 4.0 International", and the repo ships the same text as `LICENSE-cc.md` (VERIFIED — both read). The site's /license page and README describe its scope as "Metadata (such as info files)" / "info files and the like" (VERIFIED).
- What that covers in practice: the per-installation info files (names, dates, platform/category taxonomy, descriptions, login instructions, known-issue notes) and the launcher's databases regenerated from them; the launcher File menu can "regenerate the database from the info files" (VERIFIED — README). The bulk of this metadata ships inside the VM / apt packages, not in the public git repo — the repo only contains emulator-level metadata (VERIFIED — clone inspection; the rest INFERRED from packaging scripts).
- Consequence: anyone may copy, re-index, translate, or build a rival catalog UI on the metadata **noncommercially, with attribution, under the same license**. Commercial reuse requires separate permission. (INFERRED — direct application of CC BY-NC-SA 4.0.)
- Caveat: much of the metadata is factual (titles, years, version numbers), and bare facts are not copyrightable in the US; the CC license realistically bites on the prose descriptions and the curated compilation as a whole. Where the NC clause actually stops a commercial re-indexer is a legal question. (INFERRED; NEEDS-COUNSEL for any commercial reuse plan.)
- The website itself (Jekyll site repo) has **no license file**; site text is all-rights-reserved by default (VERIFIED — repo tree; conclusion INFERRED).

---

## 3. Emulators and GPL compliance

### 3.1 What emulators are involved

Roughly 100+ distinct emulators are credited, including MAME (dozens of drivers), QEMU, SIMH (many variants), VICE, Bochs, PCem, 86Box, DOSBox-X, Previous, KEGS, klh10, Hercules, gxemul, dtcyber, plus many niche single-machine emulators (VERIFIED — CREDITS.md + 164 emulator config entries in the repo). Licenses among these range from GPL (QEMU, MAME-modern, VICE, PCem, 86Box, DOSBox-X) through MIT/X11 (SIMH classic) to freeware **binary-only** programs with no source at all — the README states an ARM host VM will need user-mode x86 emulation for "certain emulators … since the source for them isn't available" (VERIFIED — README quote; per-title license census not performed, UNKNOWN at title granularity).

### 3.2 Patching and the source-archive gap

CREDITS.md states: "Some of these emulators have been patched, usually either to compile on newer versions of Linux or to support a configuration directory other than a hardcoded path in $HOME. Sources for the specific versions of all open-source emulators used are provided in the source archive available from the Virtual OS Museum site." (VERIFIED — quoted verbatim.)

**However, as of 2026-07-29 the downloads page's "Emulator sources:" section says "(coming soon)"** — the promised source archive is not yet published (VERIFIED — downloads page). One patched emulator's source *is* public: the curator's GitHub fork `mame-c900` ("MAME with patches to get the Commodore 900 driver working", pushed 2026-05-29) (VERIFIED — GitHub API).

Compliance picture (INFERRED, flagged): the VM distributes compiled binaries of GPL emulators, some modified. GPLv2 §3 requires the distributor to accompany binaries with complete corresponding source, a written offer, or (noncommercially) the offer they received. Whether source trees or written offers are present *inside* the 130 GB VM is UNKNOWN (deliberately not downloaded for this review). If they are not, distributing modified GPL emulator binaries while the source archive is "coming soon" is a **GPL compliance gap** — apparently a good-faith, in-progress one rather than a refusal, given the stated intent and the published MAME fork. NEEDS-COUNSEL only if EFS were to mirror or redistribute; for observation purposes the facts above suffice.

### 3.3 Host-side bundles

The host-scripts repo redistributes: stock-looking QEMU **10.2.0** Windows builds for x86_64 and arm64 (upstream `README.rst`, `VERSION`, GPLv2 `COPYING`, LGPL `COPYING.LIB`, `edk2-licenses.txt` all included; appearance of an unmodified upstream/Weil-style build is INFERRED), a Linux QEMU AppImage, `VirtualBox-Win.exe` + a VirtualBox Linux AppImage, `UTM.dmg`, and a `zenity-rs` binary (VERIFIED — repo listing). VirtualBox base is GPLv3 and UTM is Apache-2.0 upstream (background knowledge, not re-verified today — treat as INFERRED). Redistributing these installers is generally permitted by their licenses, but the same GPL corresponding-source formalities apply to the QEMU/VirtualBox binaries in this repo; no source or written offer is present in the repo itself (VERIFIED absence in repo; obligation analysis INFERRED, NEEDS-COUNSEL if mirrored commercially).

---

## 4. Firmware, ROMs, OS images, applications, manuals, artwork

What the museum itself says — the entirety of its position, from the /license page (VERIFIED, quoted):

> "Everything else retains its original license. Any commercial software in this collection is included for purposes of historical research and preservation only and to the best of my knowledge, all included software versions are no longer available for sale anywhere; if you are the copyright holder of anything included here and want it removed, please contact me and I will remove it ASAP."

Plus the inclusion policy from the README (VERIFIED, quoted): "Commercial OS versions that are newer than 10 years old, are still sold, or have recently been subject to known takedown requests from the copyright holder aren't included." Console/arcade games are excluded partly because they "are often still currently sold and subject to takedown requests" (VERIFIED — README).

Analysis:

- There is **no rights clearance** claimed for any guest OS, application, firmware/boot ROM, manual, or artwork. "Retains its original license" means, for commercial abandonware, "all rights reserved by someone who is not the museum" (INFERRED — direct reading).
- "No longer available for sale" has **no legal significance in copyright law**; there is no abandonware exception in US or Canadian statute. Unavailability mitigates practical enforcement risk and damages optics, not infringement status (INFERRED from well-established doctrine; NEEDS-COUNSEL for any formal risk opinion).
- The operating posture is the classic preservation-community one: proactive risk screening (10-year/still-sold/known-takedown filters) plus **reactive takedown compliance** ("I will remove it ASAP"). This is a forbearance model, not a rights model (INFERRED).
- Sources for images are credited per-installation (Bitsavers, WinWorld, TUHS, archive.org items, hobbyist sites, individual contributors) (VERIFIED — CREDITS.md), which documents provenance but confers no license (INFERRED).
- Nothing specific is said anywhere about firmware/BIOS ROMs, scanned manuals, or artwork as separate categories; they fall silently under the catch-all (VERIFIED absence of statements; UNKNOWN whether any manuals/artwork in the VM have distinct clearances).

---

## 5. Can a fork legally redistribute the collection?

**The complete collection: no.** Layer-by-layer (all rows INFERRED applications of the licenses established above unless noted):

| Layer | License | Legally mirrorable by a third party? |
|---|---|---|
| Launcher + scripts | Custom noncommercial (old-MAME) | Yes — noncommercial only; source must accompany modified versions |
| Metadata / info files | CC BY-NC-SA 4.0 (VERIFIED) | Yes — noncommercial, attribution, share-alike |
| Open-source emulators, unmodified | Upstream GPL/MIT/etc. | Yes — with per-license compliance |
| Open-source emulators, museum-patched | Upstream GPL etc. | Only with corresponding source; the museum's source archive is unpublished ("coming soon"), so a binary-level mirror cannot currently self-certify compliance (VERIFIED gap) |
| Binary-only freeware emulators | Per-title freeware terms | Per-title UNKNOWN; many freeware licenses forbid or don't address redistribution — cannot be assumed |
| Guest commercial OS/app images, firmware ROMs | Uncleared third-party copyright | **No.** No license exists to inherit; a mirror re-performs the infringement and also inherits none of the museum's goodwill/takedown history |
| Manuals, artwork, screenshots in guests | Uncleared/mixed | UNKNOWN, presume no |
| Host bundles (QEMU 10.2.0, VirtualBox, UTM) | GPLv2 / GPLv3 / Apache-2.0 | Yes with GPL source formalities |

Two sharp edges worth stating plainly:

1. Even the fully "clean" subset (launcher + metadata + FOSS emulators) is **noncommercial-only** because of the launcher and metadata licenses — so no commercial entity can ship it, and it cannot be combined into anything that must be OSD-free (INFERRED).
2. The bulk of the 184 GB — the actual OS images that make the museum valuable — is mirrorable only on the same forbearance basis the curator uses, i.e., by choosing to accept infringement risk and honoring takedowns. The torrents and IA hosting make mirroring *technically* trivial and *legally* unchanged (INFERRED). NEEDS-COUNSEL before EFS or anyone else mirrors, seeds, or pins any guest-image content.

---

## 6. User exit rights: export, mirror, index, replace the curator

- **Export:** the full edition is a plain zip of a VM directory tree; guest images are in ordinary emulator formats; the launcher's snapshot system is filesystem-level (subvolume-based per the `snapshot_*` scripts) (VERIFIED — downloads page + scripts). Users can copy anything out; no DRM or account gating anywhere in the pipeline; SHA-256 sums are published (VERIFIED).
- **Mirror:** distribution is via BitTorrent (torrent files in the public site repo) and direct download from two Internet Archive items (VERIFIED). Seeding a torrent is mirroring; nothing technical prevents it (legal caveats per §5).
- **Independent index:** the CC BY-NC-SA metadata plus the documented info-file format and the "regenerate the database from the info files" function mean a noncommercial independent catalog/index is both licensed and technically supported (VERIFIED mechanism; conclusion INFERRED).
- **Replace the curator (technically): substantially yes.** Updates are delivered through a **standard Debian apt repository** — `set_mirror_from_config` writes `deb <mirror> <suite> main` into `sources.list.d/os-museum.list`; the mirror comes from a user-editable config, the repo ships a `conf/mirrors` list (placeholders only in git: `10.0.2.2` and `.invalid` hosts), and the launcher settings UI has a "Download from mirror site" picker plus a repository selector (VERIFIED — code inspection). Anyone can therefore host an alternative repo and point launchers at it. Whether the production apt repo is GPG-signed / key-pinned (which would gate hostile-fork updates but also gate legitimate successor repos) was UNKNOWN to this lane — the production repo URL does not appear in the public repos (VERIFIED absence). *Cross-lane update: [`architecture-teardown.md`](./architecture-teardown.md) §6 later VERIFIED both — endpoint `downloads.virtualosmuseum.org/apt`, GPG-signed `InRelease`, signer fingerprint `C9D0…7426`, public key unpublished.*
- **Replace the curator (socially): no mechanism.** There is no federation, no multi-curator tooling, no succession plan, and the identifier space (installation short names, categories) is curator-assigned (VERIFIED absence of any such mechanism in code/site; INFERRED significance).

---

## 7. Governance

All decisions — inclusion, exclusion, corrections, removals, revisions, and "known working" status — rest with one person (VERIFIED across sources):

- **Inclusion:** curator's judgment, explicitly taste-based: "depending on how interesting I find the particular OS to be, I may or may not install stuff that is sent to me right away" (VERIFIED — README quote). Written exclusion criteria exist (no consoles/arcade games with narrow exceptions; no commercial OSes <10 years old/still sold/recently taken down; only bootable, working installations) (VERIFIED — README).
- **Corrections/removals:** GitLab issues, email, Discord/Fluxer; copyright takedown promised "ASAP" on request (VERIFIED). No SLA, counter-notice process, or transparency log (VERIFIED absence).
- **"Known working" status:** self-reported and partial — "all guests have been confirmed to work at some point in the past on my machine … a little under half have been tested so far" in the current VM (VERIFIED — downloads page). Per-installation READMEs note known issues (VERIFIED — README).
- **Contributions:** images/media and launcher/metadata MRs welcomed, "except for low-effort LLM slop" (VERIFIED — README). All 684 launcher commits are by the curator; no external contributor has landed code yet (VERIFIED — GitLab contributors API).
- **Neutrality wrinkle:** Patreon subscription benefits include "priority for suggestions of software to add to the OS museum" (VERIFIED — README) — i.e., paid influence over curation ordering, however mild (INFERRED characterization).

**Source available vs open source vs credibly neutral:** the museum is *source available* (all original code public, active, inspectable), is **not** *open source* (NC clauses fail OSD #1/#6 and FSF freedoms), and is **not** *credibly neutral* in the mechanism-design sense — it is a benevolent-dictator institution whose catalog, correctness labels, and continued existence are one person's ongoing choices, with paid priority channels and no exit for the name/identifier space. Its practical openness (torrents, checksums, apt mirrors, public repos) is nonetheless far above the norm for preservation sites (all INFERRED syntheses of the verified facts above).

---

## 8. Bus-factor and funding risks

- **Bus factor = 1**, by the project's own description: "a personal project, run and curated by one person"; sole committer; sole uploader; sole takedown contact (VERIFIED).
- **Funding:** Patreon (from $2/mo; patron count not publicly disclosed — UNKNOWN), Ko-fi tips, BTC/ETH addresses. The curator states the only current income is government income support and describes long-term difficulty finding employment (VERIFIED — README, quoted nearly verbatim). There is no institution, nonprofit, or fiscal sponsor behind the project (VERIFIED absence of any such claim).
- **Infrastructure dependencies:** big-file hosting is the **Internet Archive** (both editions + updates; ~540 GB across versions in the full-edition item) (VERIFIED — IA metadata); site is static Jekyll behind Cloudflare on GitLab Pages infrastructure (VERIFIED — DNS + repo CI config; hosting attribution INFERRED from the Pages IP); code on gitlab.com; community on Discord/Fluxer. Every one of these is free-tier and revocable; the IA dependency in particular ties the museum's availability to IA's own legal and financial health (INFERRED).
- **Continuity of the update channel:** the apt repo endpoint is unpublished in git and presumably curator-controlled; if the curator stops, torrents and IA zips persist (as long as IA keeps the items) but updates and takedown responsiveness stop immediately (INFERRED).
- **Mitigations present:** full-offline edition, published checksums, torrent distribution, standard formats, public source — the collection is *survivable* even though the institution is fragile (INFERRED).

---

## 9. Comparison point: how the Internet Archive handles in-browser abandonware

(One section, per the lane brief.)

- IA's software program rests on three legs: (a) the DMCA §1201 triennial exemptions — IA helped win the original 2003 exemptions for obsolete-format and dongle-protected software ("Computer programs and video games distributed in formats that have become obsolete…"), renewed/expanded in later cycles for library/archive/museum *preservation* (VERIFIED — archive.org/about/dmca.php); (b) library/archive privileges and a formal DMCA notice-and-takedown + counter-notice process, with the explicit disclaimers that IA "does not make guarantees as to the copyright status of items" and that "users make use of the Internet Archive's Collections at their own risk" (VERIFIED — help.archive.org rights policy); and (c) large-scale rightsholder forbearance for its in-browser emulation collections (Historical Software, Console Living Room, MS-DOS library), which have operated since 2013 on curation-plus-takedown rather than licenses (INFERRED — widely documented; not re-verified from a primary source today).
- Critically, the §1201 exemptions cover **preservation, not public remote access**: in the October 2024 triennial rulemaking the Copyright Office *denied* the VGHF/Software Preservation Network petition to let libraries provide remote access to out-of-print games, accepting the ESA's "online arcade" market-harm argument (VERIFIED — 2024 rulemaking coverage incl. VGHF's own statement; the Register's reasoning summarized secondhand). So even IA-grade institutions have no affirmative legal basis for what both IA's software library and the Virtual OS Museum actually do — public access to uncleared software — beyond fair-use arguments and tolerance (INFERRED). The Second Circuit's 2024 ruling against IA in the *Hachette* book-lending case further shows courts rejecting IA's fair-use theory in an adjacent domain (INFERRED — from general knowledge of the widely reported decision; not re-fetched today).
- The kicker for this dossier: **the Virtual OS Museum's own distribution is hosted on the Internet Archive** (items `virtual_os_museum_full_edition` / `virtual_os_museum_lite_edition`, community `softwarecapsules` collection, no license URL set) (VERIFIED — IA metadata API). The museum is thus not an alternative to the IA model — it is a downstream tenant of it, inheriting IA's takedown surface and institutional risk on top of its own (INFERRED).
- Comparative posture: IA has institutional standing (accredited library claims, counsel, formal DMCA agent, rulemaking participation); the museum replicates the *behavioral* norms (screening, credits, takedowns) with zero institutional shell — a one-person actor whose equivalent of IA's legal department is an email address (INFERRED).

---

## 10. Open questions / NEEDS-COUNSEL register

1. NEEDS-COUNSEL: any EFS-side mirroring, seeding, pinning, or content-addressing of guest OS images or the full/lite zips (uncleared third-party copyright; forbearance-only posture).
2. NEEDS-COUNSEL: whether NC clauses (launcher license, CC BY-NC-SA metadata) would reach an on-chain or fee-adjacent context that isn't a "commercial product or activity" in intent — NC scope is notoriously fuzzy.
3. NEEDS-COUNSEL: GPL exposure of redistributing the VM (modified GPL emulator binaries) before the museum publishes its emulator source archive.
4. UNKNOWN (fact, not counsel): whether corresponding source or written offers ship inside the VM; ~~whether the production apt repo is signed~~ *(cross-lane update: [`architecture-teardown.md`](./architecture-teardown.md) §6 subsequently VERIFIED the live repo is GPG-signed, fingerprint `C9D0…7426`, with the public key unpublished)*; patron counts; per-title terms of the binary-only freeware emulators; who holds the domain registration and what happens to it in a bus-factor event.

---

## Sources

| URL | What it evidences | Accessed | Grade |
|---|---|---|---|
| https://virtualosmuseum.org/ | Project scope, single-curator statement, nav/links | 2026-07-29 | A |
| https://virtualosmuseum.org/license/ | Full launcher/scripts license text (old-MAME, noncommercial), metadata pointer, takedown pledge | 2026-07-29 | A |
| https://virtualosmuseum.org/license-cc/ | Metadata license = CC BY-NC-SA 4.0 International, full legal code | 2026-07-29 | A |
| https://virtualosmuseum.org/downloads/ | Editions, sizes, versions 2026.06.12/2026.06.15, SHA-256 sums, torrents, IA hosting, "Emulator sources: (coming soon)", testing status (<half tested) | 2026-07-29 | A |
| https://virtualosmuseum.org/about-the-curator/ | Curator identity (Andrew Warkentin, Canada, UX/RT) | 2026-07-29 | A |
| https://gitlab.com/virtualosmuseum/virtualosmuseum (shallow clone, HEAD 8d4763c1, 2026-07-18) | LICENSE.md (unedited MAME attribution), LICENSE-cc.md, README (copyright/policy/funding), CREDITS.md (patched-emulator statement, sources), 164 emulator configs, apt-mirror machinery | 2026-07-29 | A/B |
| https://gitlab.com/virtualosmuseum/virtualosmuseum-host-scripts (shallow clone, HEAD e876676d, 2026-05-25) | Bundled QEMU 10.2.0 Windows binaries + GPLv2 COPYING, VirtualBox/UTM redistribution, mkdist | 2026-07-29 | A/B |
| https://gitlab.com/api/v4/groups/virtualosmuseum/projects | Repo inventory, creation dates (2026-05-20), visibility | 2026-07-29 | A |
| https://gitlab.com/api/v4/projects/virtualosmuseum%2Fvirtualosmuseum/repository/contributors | Sole contributor, 684 commits | 2026-07-29 | A |
| https://archive.org/metadata/virtual_os_museum_full_edition | IA hosting, uploader, 2026-05-20 upload, four versions, ~540 GB item, softwarecapsules collection, no license URL | 2026-07-29 | A |
| https://github.com/andreww591 (repos API) | mame-c900 patched-MAME fork published (pushed 2026-05-29) | 2026-07-29 | A |
| https://opensource.org/osd | OSD criteria 1 and 6 verbatim | 2026-07-29 | A |
| https://www.gnu.org/philosophy/free-sw.en.html | Four freedoms; NC restrictions render software nonfree | 2026-07-29 | A |
| https://www.mamedev.org/?p=422 | 2016-03-04 MAME relicensing to GPL-2.0+/BSD-3; "after 19 years… OSI-compliant and FSF-approved" | 2026-07-29 | A |
| https://archive.org/about/dmca.php | IA's 2003 §1201 exemptions for obsolete software, preservation scope | 2026-07-29 | A |
| https://help.archive.org/help/rights/ | IA takedown/counter-notice policy, no-guarantee + at-your-own-risk language | 2026-07-29 | A |
| https://gamehistory.org/dmca-2024-statement/ (via search results incl. gamedeveloper.com, techdirt.com) | Oct 2024 Copyright Office denial of remote-access game-preservation exemption; ESA "online arcade" rationale | 2026-07-29 | C |
| https://www.hackster.io/news/andrew-warkentin-s-virtual-os-museum-collects-174gb-of-ready-to-use-vintage-operating-systems-79b8c3954bd1 | May 2026 launch press | 2026-07-29 | C |
| https://www.theverge.com/tech/945246/virtual-os-museum-dos-windows-mac-os (via HN Algolia) | Mainstream coverage, June 2026; minimal HN traction (3 pts) | 2026-07-29 | C |
| https://www.patreon.com/andreww591 | Funding channel exists, $2/mo entry tier, patron count undisclosed | 2026-07-29 | B |
