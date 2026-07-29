# Red-team review of the target-community shortlist

**Status:** completed adversarial review; market-risk judgment only, not an owner ruling, design amendment, or launch commitment
**Date:** 2026-07-29
**Reviewed:** [[research-method]], [[opportunity-map]], [[requirements-and-first-apps]], and the source-indexed community reports in this folder

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/market-research #topic/red-team

## Verdict

The corpus has found strong **hypotheses**, not yet a first-user community. None of the five provisional finalists has a contacted seed steward, accepted operating budget, or demonstrated preference for EFS over a signed manifest plus ordinary replicated storage. Calling them “Pilot” now overstates the evidence.

The shortlist should change in three ways:

1. **Demote consent-based visual lifeboats from first community to first proof corpus.** A lifeboat is an artifact and workflow, not a recurring community by itself. The [Flickr Foundation Data Lifeboat](https://www.flickr.org/programs/content-mobility/data-lifeboat/) already produces a self-contained, browser-readable package with technical and social metadata and explicit consent guidance. EFS must prove a useful multi-operator lifecycle beyond that package.
2. **Replace generic “rights-cleared playable commons” with an opt-in mod-maintainer collective.** “Playable commons” is a collection assembled by EFS, not a socially connected adopter. Mod authors already publish recurring exact releases, dependencies, compatibility claims, and collections. Nexus Mods' [archived-file policy](https://www.nexusmods.com/skyrim/news/14538) demonstrates the real conflict between reproducible dependency closure and author deletion.
3. **Add OSHWA/open-hardware creators as a real-community prospect.** The live certification surface supplies stable UIDs and a repeatable release boundary; OSHWA has documented revoking a certification when linked documentation disappeared. Creator releases, remixes, independent builds, calibration results, compatible-part claims, and mirror receipts can form a recurring evidence network. This remains unvalidated until it beats OSHWA UID + Git/Zenodo + ordinary replicated signed manifests.

The revised order for **community validation**, not product commitment, is:

| Order | Candidate | Decision now |
|---:|---|---|
| 1 | One migrating independent-wiki community | **Best bounded real-community pilot if an admin group commits.** A single group can authorize a compact corpus and use ordinary MediaWiki for the live product. |
| 2 | Two public-data rescue/repository operators | **Best mainstream partnership hypothesis.** It becomes EFS-native only when independent institutions add receipts to the same releases. |
| 3 | One OSHWA/open-science-hardware or makerspace cohort | **Add to shortlist.** Clearer rights and stewardship than mods; start with complete, low-risk creator releases and independent build evidence. |
| 4 | One open/redistributable mod-maintainer collective | **Promote into shortlist.** It has recurring releases and a credible evidence network; rights, malware, dependency, and withdrawal gates remain hard. |
| 5 | One creator-controlled illustration collective | **Keep in discovery, not pilot-ready.** It has the best possible curation network effect and the heaviest serving and consent burden. |
| fixture | One consent-based visual lifeboat | **Build as the gallery falsification corpus, not evidence of adoption.** Promote it back to community rank only if a steward wants continuing curation after export. |

Public-data rescue can overtake wikis if two institutions commit to a shared receipt graph. The illustration collective can overtake mods if creators actually return to publish new work. Until then, ordinal scores should not imply knowledge the research does not have.

## Why the current score is too optimistic

The weighted score is useful for organizing desk research, but it is not a readiness score.

| Problem | How it distorts the current ranking | Required correction |
|---|---|---|
| **Hypothetical stewards receive 4–5/5 for seedability.** | “A Flickr-shaped steward,” “one wiki admin group,” and “one Data Rescue member” are reachable classes, not committed operators. | Cap seedability at **2/5 until contact**, 3/5 after a representative corpus is offered, and 5/5 only after authority, labor, and budget are committed. |
| **“Rights-cleared” is used as both candidate definition and evidence.** | Narrowing a market to its easiest lawful subset raises its rights score while possibly removing most of the demand. | Score the realistically recruitable supply, not a theoretically perfect seed. Audit a representative sample before assigning 4–5/5. |
| **EFS advantage is asserted without a counterfactual.** | Four finalists receive 5/5 even though signed JSON/BagIt or RO-Crate plus S3, IPFS, or torrents supplies commitments, mirrors, and portable bytes. | Require an A/B comparison. EFS earns a high score only when independently authored attestations, lens-relative views, or cross-archive version edges change a real workflow. |
| **Loss is counted as adoption intent.** | A platform outage proves pain, but not willingness to publish irrevocably. Creators may value deletion, income, identity separation, or followers more than byte survival. | Ask what was lost and which remedy would have helped. Score only the portion EFS actually addresses. |
| **Network effect includes accumulation.** | More files, tags, or mirrors can be a larger database without creating participant-to-participant value. | Require a second independent party to improve an existing object and a user to consume that improvement. |
| **Economics is only 5% and currently unknown.** | An unaffordable tag graph or permanently subsidized mirror can still “win” the score. | Make accepted total cost of ownership a hard gate, not a small bonus. |
| **Operator centralization is absent.** | One official index, thumbnailer, relayer, policy lens, or subsidized gateway can recreate the platform dependency EFS claims to reduce. | Require two independent reconstructions and at least two independently operated useful services before calling the network resilient. |
| **Gallery pressure is mixed into market ranking.** | A technically excellent fixture can outrank a more reachable community because it stresses the desired UI. | Score fixture value separately from adoption. |
| **Complement value has no integration owner.** | “EFS sits beneath the incumbent” sounds low-friction, but someone must maintain the importer, receipts, keys, mirrors, and support. | Name the organization and person who owns the integration and recurring bill. |

The scorecard should remain as a comparative map, but every recommendation should also show three evidence states:

- **community evidence:** a real decision-making group and recurring job;
- **EFS differential:** a demonstrated advantage over the conventional baseline; and
- **operating evidence:** rights review, cost, serving, and independent reconstruction.

Any missing state should render as `UNVALIDATED`, not be averaged away.

## The conventional-baseline challenge

For every pilot, first build or price the obvious alternative:

> canonical manifest + steward signature + S3/R2 copy + IPFS or torrent mirror + static browser

That baseline already supplies exact hashes, portable bytes, multiple locations, cheap cold serving, and operator choice. EFS is justified only if the pilot needs at least one of these additional properties:

- a second party can append a useful mirror, test, correction, tag, or citation without the original steward's database or permission;
- several successor communities can publish different, reproducible current views over shared history;
- an exact object keeps one identity while its mirrors, attestations, and collection membership evolve across organizations; or
- a user can verify a selected historical basis and reconstruct it without trusting any one catalog operator.

If the demo ends at “the files still download and the hash matches,” the conventional baseline wins on simplicity.

## Candidate pressure tests

### 1. Independent wiki migration — conditional lead

**Why it survives:** a wiki admin group is a real community authority; Fandom explicitly supports forks under the applicable license and offers XML dumps, while those dumps omit media and private user data ([forking policy](https://community.fandom.com/wiki/Forking_Policy), [database-download help](https://community.fandom.com/wiki/Help%3ADatabase_download)). Shared revision ancestry plus plural successor heads is the clearest lens-shaped value in the shortlist.

**Why it may still be unnecessary:** MediaWiki XML, a separately copied media tree, a signed manifest, two object-store backups, and a torrent already make a fork reconstructable. EFS adds little if there is only one successor or if no editor cares about independently verifiable attribution and competing heads.

**Pass gates:**

- interview five admins who recently migrated or are actively considering migration;
- one admin group with actual authority offers a rights-reviewed corpus and names the integration owner;
- reconstruct at least 10,000 revisions into a fresh MediaWiki and verify complete attribution;
- a second independent operator verifies the same snapshot and publishes one useful mirror or successor-view assertion; and
- the admin identifies an EFS-specific benefit that changes the migration or backup decision after seeing the conventional baseline.

**Kill it** if all five admins say domain control plus tested dumps/backups solve the problem, or if media/IP-history review makes the offered corpus unpublishable.

### 2. Public-data rescue receipts — conditional mainstream lead

**Why it survives:** the [Data Rescue Project](https://www.datarescueproject.org/current-efforts/) is an active coalition of rescuers, libraries, and repositories, and Harvard LIL has documented changing catalogs and pervasive link rot in hundreds of thousands of federal dataset records ([Harvard LIL](https://lil.law.harvard.edu/blog/2025/01/30/preserving-public-u-s-federal-data/)). This is a real coordination problem, not a content theme invented for a demo.

**Why it may still be redundant:** repositories already use fixity, institutional custody, catalog metadata, BagIt-like packages, persistent identifiers, and conventional replication. One EFS publisher copying their metadata creates no network and risks presenting rescue signatures as official provenance.

**Pass gates:**

- two independently governed rescue/repository operators agree to work on the same 100 reviewed datasets;
- each operator publishes or verifies at least one receipt the other did not author;
- the demo detects planned mirror loss, silent byte replacement, partial releases, and supersession without an EFS-operated private database;
- staff compare the workflow against signed packages plus repository URLs and identify one cross-organization task EFS materially simplifies; and
- one operator accepts the measured first-year ingestion, index, mirror, and maintenance budget.

**Kill it** if only EFS staff publish receipts, institutions will not sign or maintain them, or the graph merely duplicates repository catalog pages.

### 3. Open-hardware creators — move in above mods

**Why it survives:** OSHWA is a real nonprofit coordination surface with stable certification UIDs, a current creator directory, and a documented certification revocation after linked documentation disappeared ([certification overview](https://certification.oshwa.org/about.html)). Complete releases, remixes, builds, calibration results, substitute parts, advisories, and mirrors create a plausible recurring evidence loop without executable-malware risk.

**Why it may still be unnecessary:** OSHWA plus Git/Zenodo, a steward signature, and replicated release archives may already solve the durable-release job. Open copyright licenses do not settle patents, trademarks, toolchain closure, certification currency, physical safety, or regulated uses.

**Pass gates:**

- OSHWA or one open-science-hardware/makerspace authority commits a cohort and integration owner;
- at least 25 creators approve 50 complete, low-risk releases with editable sources and separate hardware/software/documentation licenses;
- two independent builders add build, calibration, or substitute-part receipts that creators or users actually consume;
- five creators publish a later release or remix through the flow within 60 days;
- two non-project operators reconstruct and mirror the corpus at an accepted one-year cost; and
- the first charter excludes weapons, medical, high-voltage, RF-regulated, biological/chemical, and other expert-review categories.

**Kill it** if tested Git/Zenodo backups suffice, attributable certification snapshots are unavailable, nobody contributes after seeding, editable source/toolchain closure fails, provenance remains incomplete, or dangerous-design review becomes the main operation.

### 4. Opt-in mod releases — move in

**Why it replaces generic playable commons:** mod authors are a recurring creator network, not a one-time preservation collection. Exact releases, dependency closure, compatibility tests, mirror health, and curator collections all add to old objects. The candidate still must begin with open-source, explicitly redistributable, or publisher-authorized mods; a Nexus/CurseForge scrape is not a seed.

**Why it may fail:** signatures do not make executables safe, mod packages routinely include third-party game assets, creators disagree about permanent archival, and a useful client may become a full package manager before EFS contributes visible value.

**Pass gates:**

- five maintainers from one open-game ecosystem opt in at least 50 real releases;
- every file has a reviewed redistribution basis and every executable remains quarantined until scanning/preflight completes;
- two mirrors and one independent compatibility tester contribute to the same releases;
- installation still works after the original project URL is removed; and
- at least three maintainers publish a subsequent release through the flow rather than treating EFS as a one-time donation.

**Kill it** if bundled rights cannot be cleared, maintainers require true deletion, malware operations have no owner, or ordinary signed GitHub releases plus mirrors satisfy the same job.

### 5. Creator-controlled illustration gallery — keep, but downgrade readiness

**Why it survives:** Fur Affinity has documented real submission/account loss, storage outages, and unrecoverable metadata pruning ([2016 incident](https://www.furaffinity.net/journal/7578912/), [2025 outage](https://www.furaffinity.net/journal/11123851/), [2026 notification incident](https://www.furaffinity.net/journal/11330044)). Creator releases plus independent taggers are the strongest genuine gallery network effect.

**Why it may fail:** those incidents do not prove artists want an immutable public edition. The largest losses include accounts, watches, notifications, identity continuity, audience, and commerce—features EFS does not preserve. One official search index and moderation team would also recreate the dependency at a more legally exposed layer.

**Pass gates:**

- interview at least 12 artists across general, mature, and adult work; each selects works they would and would not make permanent and explains why;
- at least 25 creators knowingly publish their own work, with commission and pseudonym roles represented;
- two independent curators, two mirrors, and one accountable serving operator commit before publication;
- every participant can explain that unlisting is not deletion after the intake flow;
- at least ten creators publish a new work within 60 days; and
- a second indexer rebuilds the catalog and reproduces bounded results without project-only data.

**Kill it** if the dominant need is payments, followers, private messaging, or reversible hosting; if adult thumbnails load before policy; or if EFS must remain the sole moderator, indexer, and mirror funder.

Adult illustration and creator-owned adult games remain legitimate later lanes. The [itch.io deindexing event](https://itch.io/updates/update-on-nsfw-content) proves payment and discovery fragility, but those are precisely the two problems EFS does not solve. Do not convert that event into evidence for permanent-storage demand until creators say so. Scraped hentai boorus, live-action UGC, and private sexual social graphs remain no-go first communities.

### Visual lifeboat — keep as proof corpus

**Why it is useful:** a consented 1,000–10,000-image collection tests the gallery, provenance, derivatives, Views, mirror failure, and reconstruction with a bounded rights chain.

**Why it is not yet a community:** a static archival export can be complete after one curator and one delivery. That is a successful preservation artifact but not a returning participant network.

**Promotion gates:**

- a named collection steward supplies the corpus and owns rights review;
- two independent organizations continue to add mirror, correction, or curator assertions after the initial export;
- three intended users can identify an EFS-only lifecycle benefit after comparing the Data Lifeboat-style static package; and
- the steward accepts the recurring bill and still wants the EFS version.

If the steward wants only a portable package and checksum, ship the simpler package.

## Portfolio-wide go/no-go gate

Do not select “EFS's first real users” until one candidate passes all six:

1. **Authority:** a named steward can lawfully commit the representative corpus.
2. **Recurring behavior:** participants do something again after the seed import.
3. **Counterfactual:** users choose an EFS-specific multi-party capability over the conventional baseline.
4. **Economics:** the steward accepts a measured one-year bill for records, indexes, relaying, previews, bytes, and operations.
5. **Independent operation:** a non-project operator reconstructs and serves the corpus, and no project-only index is required for bounded use.
6. **Safety:** inclusion, rights, permanence, notice, and serving policies work on representative hard cases before public admission.

The highest-leverage next action is therefore not a larger scorecard. Run parallel discovery with one wiki migration group, two data-rescue/repository operators, and one OSHWA/open-hardware cohort while using the visual lifeboat solely as the gallery counterfactual. The first party to pass the six gates earns the pilot; the gallery corpus does not win merely because it is visually compelling.
