# Software Heritage + Long-Term Preservation of Version Histories

**Lane:** Software Heritage + long-term preservation of version histories — researched 2026-08-07

Evidence classes used throughout: **(a) implemented/shipped**, **(b) documented intent**, **(c) recommendation (ours)**, **(d) speculation/inference (marked)**.

---

## 1. Data model: one Merkle DAG for all of public software history

**(a) Implemented.** SWH stores everything in a single, global, deduplicated Merkle DAG with five artifact node types plus a provenance layer ([data model docs](https://docs.softwareheritage.org/devel/swh-model/data-model.html)):

- **Content (blob)** — "the raw content of (source code) files as a sequence of bytes, without file names or any other metadata."
- **Directory** — a list of named entries with permission metadata; entries may target contents, sub-directories, or **revisions** (the revision-target entry type is how git submodules are encoded in the DAG).
- **Revision (commit)** — points to a root directory + parent revisions + author/committer/timestamp/message; "each recorded copy of the root directory is known as a revision."
- **Release (tag)** — annotated milestone pointing at a revision.
- **Snapshot** — SWH's own invention, no git equivalent: the full **ref state of an origin at one point in time** (every branch/tag name → target object). This is the load-bearing object for capturing "what the repo looked like" without trusting the host.
- **Origin** — a `(type, url)` pair; **origin visit** — "links together software origins with snapshots… recording when the visit happened and the full snapshot" ([data model](https://docs.softwareheritage.org/devel/swh-model/data-model.html)).

Every node has "an intrinsic identifier computed as a cryptographic hash of the node content," covering child identifiers, so dedup is automatic and identical artifacts across all archived projects are stored once ([data model](https://docs.softwareheritage.org/devel/swh-model/data-model.html)). Contents are additionally indexed under multiple checksums (the storage interface takes per-algorithm checksum mappings, incl. for skipped content) ([swh.storage.interface](https://docs.softwareheritage.org/devel/apidoc/swh.storage.interface.html)).

**Key structural point:** the *history* of an origin is not a mutable pointer — it is the append-only sequence of (visit timestamp, snapshot id) pairs. Refs move; the record of where they pointed never does.

## 2. SWHIDs: intrinsic identifiers, now an ISO standard

**(a) Implemented + standardized.** Core syntax: `swh:1:TYPE:HASH` with `TYPE ∈ {cnt, dir, rev, rel, snp}` and a 40-hex-digit SHA1 ([persistent identifiers doc, v1.6, 2021-04-30](https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html)). Hash computation is **deliberately git-compatible**: `cnt` = git blob hash ("SHA1 of… 'blob', space, length, NUL, content"), `dir`/`rev`/`rel` "produce the same result as a git tree hash / git commit hash / git release hash"; only `snp` uses an SWH-specific manifest (sorted branch list) since git has no snapshot object ([persistent identifiers](https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html)). Consequence: a SWHID `rev` id **is** the upstream commit id — citation and interop cost nothing.

**Qualified SWHIDs** add context qualifiers — `origin=` (repo URI), `visit=` (snapshot SWHID of the visit), `anchor=` (node from which `path` is resolved), `path=`, and the fragment qualifier `lines=` ([persistent identifiers](https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html)). This is the exact-pin vs moving-link split: a core SWHID pins bytes forever; qualifiers preserve *where/when it was seen* without weakening the pin.

**ISO status:** SWHID v1.2 was adopted as **ISO/IEC 18670:2025 on 2025-04-23** ([swhid.org announcement](https://www.swhid.org/news/2025-04-23-swhid-standardized-as-iso-iec-18670/), [ISO catalog](https://www.iso.org/standard/89985.html), [SWH blog 2025-05-14](https://www.softwareheritage.org/2025/05/14/iso-standard-swhid/)). The spec is openly governed under the Community Specification License 1.0 with a working group ([spec v1.2](https://www.swhid.org/specification/v1.2/)); a Rust reference implementation exists ([swhid-rs](https://github.com/swhid/swhid-rs)). **(d)** A "SWHID v2" (hash agility beyond SHA1) is under community discussion ([rb-general thread](http://www.mail-archive.com/rb-general@lists.reproducible-builds.org/msg02752.html)) but nothing is published as of this research; the ISO'd v1.2 is SHA1-locked — a real century-scale liability.

## 3. Loading git repos, dedup, and 2026 scale

**(a) Implemented.** The git loader "walk[s] a… Git repository and inject[s] into the SWH dataset all contained files **that weren't known before**" — i.e., ingestion is a dedup-diff against the entire global archive, not per-repo storage. Git access is "via dulwich" (pure-Python git), with variants `GitLoader` (local/remote), `GitLoaderFromArchive`, `GitCheckoutLoader` ([swh-loader-git docs](https://docs.softwareheritage.org/devel/swh-loader-git/index.html), [GitHub mirror](https://github.com/SoftwareHeritage/swh-loader-git)). **(d) Inference from dulwich use + object-level storage:** fetched packfiles are parsed into individual objects and are **not retained as packs** — corroborated by the vault having to `git repack` from scratch at export time (§4).

**Scale, pinned to Jan 2026** ([SWH digital-public-good post, 2026-01-21](https://www.softwareheritage.org/2026/01/21/software-heritage-archive-digital-public-good/)):
- **27 billion unique source files** from **421 million projects/origins**; archive ≈ **2 PB** by 2025; average ingestion ≈ 1.3 projects/second.
- Graph scale ≈ **50 billion nodes / 900 billion edges** (2025) ([using SWH data](https://docs.softwareheritage.org/user/using_data/index.html)); raw graph exports of ~78 TB compress to ~3 TB for analysis ([DPG post](https://www.softwareheritage.org/2026/01/21/software-heritage-archive-digital-public-good/)).
- Archive recognized as a **Digital Public Good** (2026-01-21); 10th anniversary in 2026.

The dedup ratio (27B unique files across 421M origins, incl. essentially all of GitHub) is the empirical proof that a global content-addressed store amortizes: forks, vendored copies, and mirrors collapse to graph edges.

## 4. The counter-example claim, verified: serving infrastructure is rebuildable from objects + snapshots

Claim under test: *SWH proves you can rebuild git serving artifacts from an object closure + ref-state records, without preserving original pack layouts.* **Verdict: verified as (a) implemented, with fidelity caveats.**

- **What SWH stores:** individual content blobs in a content-addressed objstorage + graph nodes (dir/rev/rel/snp) in storage; no original packfiles. (Data model + loader, §§1,3.)
- **Getting a working clone back out:** the **Vault** is "a user-facing service that allows to retrieve parts of the archive as self-contained bundles" with three cooked bundle types: **flat** (directory tarball), **gitfast** (git fast-import stream), and **git_bare** (a bare `.git` you can clone from) ([swh-vault docs](https://docs.softwareheritage.org/devel/swh-vault/index.html), [getting started](https://docs.softwareheritage.org/devel/swh-vault/getting-started.html)). Cooking is async: `POST /api/1/vault/flat/:swhid/` → poll → fetch `raw` ([getting started](https://docs.softwareheritage.org/devel/swh-vault/getting-started.html)).
- **How git_bare works:** it writes archived objects **one by one into `.git/objects/`, then calls `git repack`**, then tarballs the result; it supports DIRECTORY/RELEASE/REVISION/**SNAPSHOT** roots (snapshot root ⇒ branches restored from the recorded ref state) and "runs git-fsck and ignores expected errors (eg. because of missing objects)" ([git_bare cooker apidoc](https://docs.softwareheritage.org/devel/apidoc/swh.vault.cookers.git_bare.html)). Because SWH hashes are git-identical (§2), the cooked repo's commit/tree/blob ids equal the originals — the pack layout is regenerated, the DAG is byte-faithful.
- **Fidelity caveats (a):** missing/skipped objects produce tolerated fsck errors (holes survive the round trip); nothing outside the object DAG + snapshot refs comes back — no reflogs, no hooks, no `.git/config`, no remotes, no server-side pack/idx layout, no push history. The FAQ is explicit about role separation: "Please do not clone a full repository directly from Software Heritage: it is an archive, not a forge" ([SWH FAQ](https://www.softwareheritage.org/software-heritage-faq/)).

**Reading for EFS (c):** packs, indexes, and protocol endpoints are *derived caches*; the normative artifact set is (object closure + signed snapshot/visit records). SWH runs this at 2 PB / 50B nodes, so the pattern is proven at far beyond any plausible EFS scale.

## 5. Takedowns and GDPR on an append-only archive

**(a) Implemented policy + tooling.**
- **Policy:** SWH operates under **French law, not DMCA** (notably: no counter-notice mechanism); removal requests go through a form/postal process requiring exact archive location and legal justification ([content policy](https://www.softwareheritage.org/legal/content-policy/)). On personal data: "Due to our long-term archiving mission and for historical preservation, your data will be retained indefinitely," with name/email correction via the DPO — i.e., GDPR is answered with the archival-purpose exemption plus rectification, not erasure of history ([content policy](https://www.softwareheritage.org/legal/content-policy/)).
- **Tooling — `swh-alter` (shipped):** "It happens for Software Heritage to record content that either should not have been archived or should no longer be archived. swh-alter holds the tools necessary to **prune or make inaccessible** content" — it computes the **removal closure on the Merkle DAG while preserving objects still referenced by other origins**, and writes **encrypted recovery bundles** before deletion so mistaken removals are reversible ([swh-alter docs](https://docs.softwareheritage.org/devel/swh-alter/index.html)). So even the "append-only" archive has a principled, closure-aware delete path.
- **Mirror propagation (b→a, in deployment):** SWH publishes "a feed of objects removed from the archive" (public removed-objects list) plus a **mirror-operator-only channel carrying the reasons** ("copyright violation", "harmful content", …) — not the original notices, to avoid the removal list becoming a treasure map; "Mirror operators are responsible for reviewing the reasons of removals and decide if they should be propagated"; guidance is that mirrors make data "**inaccessible, but not deleted**" and operators act without hard time constraints ([mirror takedown ops doc](https://docs.softwareheritage.org/sysadm/mirror-operations/takedown-notices.html)). Mirrors currently execute `swh alter remove` against matched origins.
- **What survives a takedown (a):** objects shared with other origins stay (closure computation), and the scheme distinguishes *suppression from access* vs *physical deletion*, per-jurisdiction, per-mirror.

## 6. Mirrors and bulk replay formats

**(a) Implemented.** Independent mirrors "operated in agreement with, but independent from" SWH ([mirrors page](https://www.softwareheritage.org/mirrors/)): **ENEA** (Italy, first mirror, 2023); **GRNET** (Greece, live 2025 — built in FAIRCORE4EOSC, 3-year support agreement with Inria from May 2025) ([GRNET announcement, 2025-09-24](https://www.softwareheritage.org/2025/09/24/grnet-mirror/)); **UNIDue** (Germany) finalizing; **IMDEA Software** (Spain) announced 2026-01-28 ([IMDEA news](https://software.imdea.org/news/2026/01-28-sh-event/)).

**Bulk formats (a):** `swh-export` produces the **Graph Dataset** — "the entire graph… in a fully-deduplicated Merkle DAG representation" — as **ORC tables** plus node/edge files for the **compressed graph** (`swh-graph`, WebGraph-based in-memory representation) ([swh-export docs](https://docs.softwareheritage.org/devel/swh-export/index.html), [swh-graph docs](https://docs.softwareheritage.org/devel/swh-graph/index.html)). Published on open AWS S3 (`s3://softwareheritage`, no credentials needed), **yearly** cadence, **graph/metadata only — file contents are excluded** from the dataset ([AWS Open Data registry](https://registry.opendata.aws/software-heritage/), [dataset page](https://docs.softwareheritage.org/devel/swh-export/graph/dataset.html)). Full compressed graph ≈ 150 GB of disk/RAM per direction; a curated 1000-popular-origins teaser subgraph was exported 2025-05-18 (recompressed 2025-12-08 after a 40% size defect) ([dataset page](https://docs.softwareheritage.org/devel/swh-export/graph/dataset.html)). SWH also runs a plain HTTPS **annex** for bulk artifacts (`public/`, `shards/` directories) ([annex.softwareheritage.org](https://annex.softwareheritage.org/)). Mirror replication itself rides the internal journal (Kafka) rather than these datasets — the datasets are for analysis/replay, the journal + removed-objects feed for live mirroring ([mirror ops](https://docs.softwareheritage.org/sysadm/mirror-operations/takedown-notices.html)).

## 7. What SWH deliberately does NOT preserve — and known gaps

**(a/b) By design:**
- **Extrinsic platform data:** "our mission is to preserve source code"; "all metadata contained by the source code repository itself is preserved" — issues, pull requests, wikis, code review, CI config-as-platform-state are **not archived** ([SWH FAQ](https://www.softwareheritage.org/software-heritage-faq/)). A fork network's *conversation* dies with the forge.
- **Serving/local state:** packs, reflogs, hooks, `.git/config`, remotes (regenerated or absent at vault export; §4).
- **Skipped contents (a):** the storage model has a first-class `skipped_content` type recording "(partial) information about content missing from the archive" with checksums + reason — used e.g. for over-threshold blobs; tooling exposes `--size-limit` filters ([swh.storage.interface](https://docs.softwareheritage.org/devel/apidoc/swh.storage.interface.html), [objstorage-replayer CLI](https://docs.softwareheritage.org/devel/swh-objstorage-replayer/cli.html)). The exact current production size threshold was not verifiable from public docs in this pass.

**Known gaps:**
- **Git LFS (d, structural inference — no explicit SWH statement located):** the loader ingests the git object graph; LFS blobs live *outside* that graph behind a separate API, so SWH archives **pointer files, not LFS payloads**. This matches the universal behavior of git-archive/bundle tooling ("archives never include LFS objects — they contain only the pointer files") ([git-lfs #5343](https://github.com/git-lfs/git-lfs/issues/5343)). Treat any LFS-using repo as **silently lossy** in SWH.
- **Submodules (a, partial):** encoded as directory entries targeting revisions (§1), but the submodule's *repository* is a separate origin — archived only if independently loaded; the vault's git_bare cooker documents no submodule resolution and tolerates missing objects ([git_bare cooker](https://docs.softwareheritage.org/devel/apidoc/swh.vault.cookers.git_bare.html)). External closure is not guaranteed.
- **SHA1 lock-in (d):** SWHID v1.x/ISO 18670 is SHA1-only; v2/hash-agility remains discussion-stage (§2).

## 8. Lessons for EFS (recommendations, class (c) unless noted)

1. **Normative layer = object closure + signed snapshot records; everything else is cache.** SWH demonstrates (a) at 2 PB that packs/indexes/protocol endpoints can be regenerated (`git repack` at export). EFS should make the *admitted records* be (blob/tree/commit closure + snapshot-of-refs claims) and treat pack layouts, CDN copies, and mirrors as untrusted, rebuildable derivatives.
2. **Snapshot-per-visit is the right shape for moving refs on an append-only substrate.** "Origin O had refs R at time T, signed by principal P" is exactly an EFS record; branch history becomes a queryable chain of snapshot claims rather than mutable pointers. SWH's origin-visit table is the proven prior art.
3. **Adopt SWHID compatibility outright.** Git-identical hashing means EFS commits/trees/blobs already *are* `swh:1:rev/dir/cnt` ids; emitting ISO/IEC 18670 identifiers gives EFS citations, academic interop, and a second archive (SWH itself) for free. Caveat: SHA1 — track SWHID v2 and keep EFS's own record ids hash-agile.
4. **Design the removal story before you need it.** SWH's `swh-alter` pattern — closure-aware removal that spares shared objects, encrypted recovery bundles, a public removed-objects feed, a separate reasons channel, and mirror autonomy ("inaccessible, not deleted") — is the most complete takedown design for an append-only archive found anywhere. EFS's on-chain layer can't delete, so the analog is lens-level suppression lists distributed exactly like SWH's removed-objects feed, with mirror/client discretion.
5. **SWH's extrinsic-data gap is EFS's differentiator.** Issues/PRs/reviews are what die today (SWH explicitly won't save them). EFS making proposals/reviews first-class signed records solves the half of "credibly neutral hosting" SWH deliberately skips — and SWH is then a free cold-storage backstop for the git half only.
6. **Large binaries must be first-class, not pointers.** LFS is SWH's known silent-loss mode. EFS's Arweave/EthStorage payload layer should hold large blobs *inside* the addressed closure (pointer + payload both admitted), never as out-of-band fetches.
7. **Submodules/externals: pin as (origin URL, SWHID) pairs** and admit the closure explicitly; never assume transitive availability.
8. **Bulk replayability is a credibility feature.** Yearly full-graph ORC + compressed-graph exports on open S3 are what make SWH independently verifiable and forkable ("walk-away exit" for archives). EFS should specify an equivalent canonical bulk export from day one.

---

## Sources

- https://docs.softwareheritage.org/devel/swh-model/data-model.html
- https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html
- https://www.swhid.org/specification/v1.2/
- https://www.swhid.org/news/2025-04-23-swhid-standardized-as-iso-iec-18670/
- https://www.iso.org/standard/89985.html
- https://www.softwareheritage.org/2025/05/14/iso-standard-swhid/
- http://www.mail-archive.com/rb-general@lists.reproducible-builds.org/msg02752.html
- https://github.com/swhid/swhid-rs
- https://www.softwareheritage.org/2026/01/21/software-heritage-archive-digital-public-good/
- https://docs.softwareheritage.org/devel/swh-loader-git/index.html
- https://github.com/SoftwareHeritage/swh-loader-git
- https://docs.softwareheritage.org/devel/swh-vault/index.html
- https://docs.softwareheritage.org/devel/swh-vault/getting-started.html
- https://docs.softwareheritage.org/devel/apidoc/swh.vault.cookers.git_bare.html
- https://www.softwareheritage.org/software-heritage-faq/
- https://www.softwareheritage.org/legal/content-policy/
- https://docs.softwareheritage.org/sysadm/mirror-operations/takedown-notices.html
- https://docs.softwareheritage.org/devel/swh-alter/index.html
- https://www.softwareheritage.org/mirrors/
- https://www.softwareheritage.org/2025/09/24/grnet-mirror/
- https://software.imdea.org/news/2026/01-28-sh-event/
- https://docs.softwareheritage.org/devel/swh-export/index.html
- https://docs.softwareheritage.org/devel/swh-export/graph/dataset.html
- https://docs.softwareheritage.org/devel/swh-graph/index.html
- https://docs.softwareheritage.org/user/using_data/index.html
- https://registry.opendata.aws/software-heritage/
- https://annex.softwareheritage.org/
- https://docs.softwareheritage.org/devel/apidoc/swh.storage.interface.html
- https://docs.softwareheritage.org/devel/swh-objstorage-replayer/cli.html
- https://github.com/git-lfs/git-lfs/issues/5343
