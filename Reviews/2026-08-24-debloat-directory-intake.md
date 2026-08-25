# Debloat.dev directory intake and EFS catalog implications

**Checked:** 2026-08-24

**Status:** dated product evidence and candidate fixture input; not an adopted
dataset, default authority, product commitment, EFS Type, or Core change

**Prompt:** James shared the
[Hacker News discussion](https://news.ycombinator.com/item?id=49410362) and
suggested that its directory of interesting open-source projects might inform
an EFS default data index.

## PM finding

[debloat.dev](https://debloat.dev/) is a good compact product teacher for an
EFS catalog: it answers a concrete question—"what open-source project replaces
this vendor product?"—through fast guest browsing, project pages, simple
categories, discussion, ratings, and a Wanted queue. Its server-rendered,
script-optional, hyperlink-friendly and machine-readable surfaces are unusually
aligned with EFS's direct guest path.

It is **not** a safe canonical seed or authority as observed. The directory is
operator-controlled; its records are mutable claims rather than exact project
or release identities; the full database has no documented immutable edition
or public export API; and this pass found no source repository or reuse license
for the site's code or catalog metadata. Anonymous discussion already includes
low-value posts, and ratings commonly have tiny samples. Use the site and its
comments as discovery evidence. Do not copy its descriptions, ratings,
discussion, or database wholesale without permission or a clarified license.
Facts about individual projects can instead be verified against their primary
repositories, releases, license texts, and maintainers.

The EFS opportunity is therefore a **curator-qualified Open Alternatives
catalog**, potentially recommended by a client or used as a demo dataset—not a
global "default index" built into Core. A default recommendation must identify
its curator, exact catalog edition, scope, basis, freshness, coverage, and
completeness; users can select other catalogs; and direct Project/Release links
must keep working without any catalog.

No new EFS 2.0 primitive surfaced. The existing
[[Designs/open-web-app-store/README|Open Web App Store]] direction already owns
publisher-qualified Projects, immutable Releases, exact package evidence,
curator-qualified catalog editions, plural claims, guest access, and exit. The
[[Designs/web-client-os/README|Web Client/OS]] already makes the Data Explorer
the raw fallback for unqualified data links, not a mandatory intermediary or a
universal truth index.

## Point-in-time source record

Primary surfaces checked directly:

- [home and catalog](https://debloat.dev/);
- [requests / Wanted queue](https://debloat.dev/requests);
- [one project page: Immich](https://debloat.dev/p/immich);
- [API documentation](https://debloat.dev/docs/api.md) and
  [OpenAPI description](https://debloat.dev/openapi.json);
- [sitemap](https://debloat.dev/sitemap.xml),
  [RSS](https://debloat.dev/rss.xml), and
  [`llms.txt`](https://debloat.dev/llms.txt); and
- the complete public Firebase comment tree for the
  [HN story](https://news.ycombinator.com/item?id=49410362): 124 live
  descendants in 27 top-level branches at capture, plus seven dead/deleted
  nodes.

Observed on 2026-08-24; counts and contents were changing during the HN surge:

- the home page showed roughly 210–211 projects across 10 categories, plus
  featured, newest, most-discussed, top-rated, random and Wanted surfaces;
- project pages carried a project name, a human `replaces` claim, repository
  URL, site-stated license, platforms, category, description, rating, listed
  time, and discussion;
- the sitemap exposed 238 URLs at one capture, including 211 project pages, 10
  category pages, and 12 request pages;
- public pages could be requested as Markdown and the site published a sitemap,
  RSS feed, `llms.txt`, API documentation, and OpenAPI description;
- the documented product-submission API accepted one or up to 100 records,
  required an admin-issued bearer token, and used `repo_url` for idempotence;
  `GET /api/categories` was public, but this pass found no complete public
  product-list API or immutable snapshot endpoint;
- browsing was account-free; publishing and rating used GitHub or Google sign
  in; project discussions allowed rate-limited anonymous posts; and
- the About/footer/API surfaces exposed no source repository, data license,
  governance, succession, correction, or complete export policy. This is
  negative evidence from the checked surfaces, not proof that none exists.

## What the HN discussion adds

The comments are useful because they pressure-test the catalog's claims rather
than merely supply more project names.

### 1. The catalog needs an explicit comparison method

Commenters asked whether "debloated" meant anything beyond "open source" and
challenged listings such as Tailscale and Nextcloud as not obviously small or
simple ([question](https://news.ycombinator.com/item?id=49410696),
[Tailscale example](https://news.ycombinator.com/item?id=49410888),
[Nextcloud example](https://news.ycombinator.com/item?id=49411920)). The lesson
is not that those projects are or are not bloated. It is that a catalog label
needs a published rubric and evidence: footprint, background services,
telemetry/account/cloud requirements, resource use, scope, feature coverage,
limitations, measurement date, and reviewer basis.

For EFS, `replaces`, `debloated`, `safe`, `maintained`, and `recommended` are
attributable scoped claims—not intrinsic Project fields or globally resolved
truth. A useful comparison should distinguish full, partial, conditional, and
non-replacement and name material feature gaps.

### 2. Project families must not inflate choice

One thread noted that four TV/media entries were members of the XBMC/Kodi
family ([thread](https://news.ycombinator.com/item?id=49410563)). A fork,
distribution, frontend, integration, and independently authored alternative can
all be useful, but they are not interchangeable kinds of choice. EFS should
preserve their relationships and let a curator choose whether a catalog groups
or separates them; it should not deduplicate merely by name or current
repository URL.

### 3. Narrow, fast navigation beats an undifferentiated mega-index

Commenters described AlternativeTo as broader and filterable while also
criticizing its current UX as heavy or painful
([breadth](https://news.ycombinator.com/item?id=49411832),
[UX critique](https://news.ycombinator.com/item?id=49412695),
[coverage gap](https://news.ycombinator.com/item?id=49421095)). By contrast,
debloat.dev's text-browser compatibility, scriptless enumeration, sitemap, and
simple presentation were explicitly praised
([technical observation](https://news.ycombinator.com/item?id=49412346),
[UX reaction](https://news.ycombinator.com/item?id=49416214)).

This supports task-shaped catalog Apps—"replace vendor bloat," "self-host my
photos," "run a tiny local tool"—over making one generic global index serve
every discovery job. Raw Data Explorer access remains available underneath.

### 4. Reviews need evidence and governance, not just stars

The thread debated an "AI slop" flag, but several replies correctly reframed
the question around actual quality, testing, maintenance, fitness and curation
([request](https://news.ycombinator.com/item?id=49410776),
[quality reply](https://news.ycombinator.com/item?id=49411028)). Bare star
averages, anonymous posts, submitter self-promotion, and a directory listing do
not establish safety or quality. A catalog should separate nominated,
curator-reviewed, independently tested, stale, disputed, withdrawn, and
rejected states; show affiliation and sample size; and keep evidence linked to
the exact project/release it assessed.

### 5. Exit and neutral participation are product features

Users objected to GitHub/Google-only sign in
([thread](https://news.ycombinator.com/item?id=49410819)), reported intermittent
TLS/network blocking or unavailability during the HN surge
([thread](https://news.ycombinator.com/item?id=49411264)), and asked whether the
directory itself was open source without receiving an answer
([question](https://news.ycombinator.com/item?id=49417406)). These do not prove
the operator is untrustworthy; they show why an EFS catalog should have a
published data license, immutable exportable editions, plural curators,
non-platform-controlled participation options, correction/succession policy,
and direct links that survive the catalog host.

## EFS crosswalk

| Surface | What transfers to EFS | Boundary that must remain explicit |
|---|---|---|
| Project listing | Publisher-qualified stable Project plus attributed name, description, license/platform and comparison claims | A repository URL, slug or directory row is not Project identity, an exact Release, availability, safety, endorsement, or update authority |
| Exact software | Immutable authored Release and exact source/build/package evidence | "Current GitHub repo" or a mutable tag cannot stand in for exact bytes or dependency closure |
| Alternatives | Typed and scoped replacement/comparison claims with feature gaps and evidence | There is no objective global winner; full, partial and conditional replacements differ |
| Catalog | Curator-qualified immutable edition with finite membership, ordering, policy, scope and completeness | A client-recommended edition is not an official bit or Core truth; two curators may disagree |
| Rankings | Versioned derived outputs with basis, coverage, freshness, sample size and method | `new`, `top`, `featured`, `random`, stars and discussion count are distinct policies, not Lenses renamed as rankers |
| Reviews/comments | Attributable testimony targeting the exact Project, Release or occurrence assessed | A comment or aggregate rating confers no fetch, install, execution, endorsement or update authority |
| Wanted requests | A request subject, proposed-solution relations, discussion and curator-issued status | `SOLVED` is scoped to a request/curator and may be disputed; it is not a global fact |
| Guest UX | Fast server-renderable or static catalog pages, direct hyperlinks, Markdown/export surfaces and no-account reading | Exact Project/Release inspection must still work when search, hosted index, catalog or full OS is unavailable |
| Source ingestion | Volatile external pages can supply attributed discovery evidence and provenance pointers | Site-stated fields must remain distinguishable from independently verified facts; unknown reuse rights block wholesale republication |

## Candidate EFS fixture, if this lane becomes active

Do not import the live directory as-is. A bounded, independently verified
**Open Alternatives catalog** would be a stronger future Open Web App Store /
Data Explorer fixture:

1. select roughly 10–20 projects from primary project sources, using
   debloat.dev and the HN thread only as discovery provenance;
2. capture publisher-qualified Projects, one exact Release/source revision per
   selected project, stated and independently checked license evidence,
   supported platforms, and exact source/package locators where available;
3. include at least one project family, one full replacement, one partial
   replacement with explicit feature gaps, one moved repository, one stale or
   abandoned candidate, and one disputed or wrong source claim;
4. create two curator-qualified catalog editions that rank or group some of the
   same projects differently;
5. include one Wanted request with several proposed solutions and a
   curator-qualified status transition; and
6. prove that a clean guest can browse the finite edition and follow a direct
   Project/Release link, while a second implementation can reconstruct the
   edition after the original directory and hosted index disappear.

The fixture should fail if it:

- silently turns a moved/changed repository URL into the same exact Release;
- presents an unavailable or incomplete source/index as an empty result;
- collapses source-stated license/platform/replacement metadata into verified
  fact;
- lets a catalog, star score, comment, or `SOLVED` label authorize installation
  or execution;
- hides the curator, basis, coverage, freshness, terminal cursor, or
  completeness of a finite result;
- cannot preserve disagreement between two curators or two reviewers; or
- requires account, wallet, Commons, full OS boot, or the catalog host to open a
  direct public record.

## Other discovery sources worth remembering

The HN thread also named
[AlternativeTo](https://alternativeto.net/),
[OpenAlternative](https://openalternative.co/),
[SaaSHub](https://www.saashub.com/),
[Can I Replace It?](https://canireplaceit.com/),
[mayfrost's `ALTERNATIVES.md`](https://github.com/mayfrost/guides/blob/master/ALTERNATIVES.md),
[tinyapps.org](https://tinyapps.org/), and
[suckless.org](https://suckless.org/). These are candidate comparison and
discovery inputs, not authorized datasets or endorsed partners. Their current
licenses, exportability, provenance, maintenance, taxonomy, and reuse rights
must be checked independently before any ingestion.

## Routing and non-adoption

- Parked in [[Ideas#Curator-qualified Open Alternatives starter catalog]].
- Related active design: [[Designs/open-web-app-store/README]] and
  [[Designs/open-web-app-store/architecture]].
- Related product boundary: [[Designs/web-client-os/README]].
- No owner decision, owner-inbox item, milestone, community commitment, public
  dataset, schema, design-body edit, implementation, scraping job, partnership,
  or Core escalation was created.

**Highest-leverage next action:** when the Open Web App Store/Data Explorer lane
next needs a real finite catalog fixture, use this review to decide whether to
build the independently verified 10–20-project Open Alternatives edition. Until
then, keep it parked; no action is required from James.
