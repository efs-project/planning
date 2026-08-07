# Core Git Mechanics an EFS Integration Must Build On

**Lane:** git-core-mechanics — researched 2026-08-07

Legend used throughout: **(a)** implemented/shipped, **(b)** documented intent, **(c)** recommendation, **(d)** speculation.

Reference baseline: Git 2.55 (released 2026-06-29) is current stable as of this research; Git 2.53 shipped 2026-02-02, Git 2.54 2026-04-20 ([GitHub blog 2.55](https://github.blog/open-source/git/highlights-from-git-2-55/), [9to5Linux 2.53](https://9to5linux.com/git-2-53-released-with-new-features-and-performance-improvements), [GitLab on 2.54](https://about.gitlab.com/blog/whats-new-in-git-2-54-0/)).

## 1. Object model: what is identity, what is transport artifact

- **(a)** Four object types — blob, tree, commit, annotated tag. An object's id is the hash of `"<type> <size>\0<content>"`; trees hold `(mode, name, raw-oid)` entries; commits embed tree + parent oids plus author/committer and optional `gpgsig` header ([Pro Git internals](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)). Because parents/trees are embedded by oid, the commit id transitively commits to the full history — this is the Merkle structure EFS records can anchor.
- **(a)** **Identity = object ids and ref names only.** Loose-vs-packed storage, delta chains (`OFS_DELTA`/`REF_DELTA`), pack boundaries, pack ordering, multi-pack indexes, reachability bitmaps, and cruft-pack `.mtimes` files are all storage/transport artifacts, recomputable at will ([gitformat-pack](https://git-scm.com/docs/gitformat-pack)).
- **(c)** Consequence for EFS: never content-address *packs* or expect byte-reproducible packfiles — delta selection varies with `pack.threads`, config, and object order. Content-address the object graph (oids) and treat packs/bundles as opaque transport blobs whose own hash is only a storage receipt, not an identity.
- **(a)** Thin packs are legal on the wire (deltas against objects the receiver already has) and are completed on receipt (`index-pack --fix-thin`) — another reason wire bytes ≠ identity ([gitprotocol-v2 fetch `thin-pack`](https://git-scm.com/docs/gitprotocol-v2)).
- **(a)** Server-side pack maintenance is now highly incremental: `repack.MIDXMustContainCruft` (2.51), `--path-walk` packing for much smaller packs (2.51), incremental MIDX chains with geometric compaction (`git repack --write-midx=incremental`, 2.55), and incremental `git maintenance` repacking by default (2.54) ([GitHub blog 2.51](https://github.blog/open-source/git/highlights-from-git-2-51/), [2.55](https://github.blog/open-source/git/highlights-from-git-2-55/), [GitLab on 2.54](https://about.gitlab.com/blog/whats-new-in-git-2-54-0/)).

## 2. Refs and the ref transaction model

- **(a)** Ref backends: loose files + `packed-refs`, and the newer **reftable** backend (`git init --ref-format=reftable`, preliminary in 2.45; planned default for Git 3.0) ([GitHub blog 2.45](https://github.blog/open-source/git/highlights-from-git-2-45/), [BreakingChanges](https://git-scm.com/docs/BreakingChanges)).
- **(a)** **Atomic push**: `git push --atomic` uses receive-pack's `atomic` capability — all ref updates in the push succeed or none do. Not the default; a plain multi-ref push is per-ref best-effort ([git-push](https://git-scm.com/docs/git-push), [protocol-capabilities](https://git-scm.com/docs/protocol-capabilities)).
- **(a)** **`git update-ref --stdin`** exposes explicit transactions (`start`/`prepare`/`commit`/`abort` plus `update`/`create`/`delete`/`verify`), giving all-or-nothing multi-ref updates locally; Git 2.50 additionally batched reference updates internally for performance ([git-update-ref](https://git-scm.com/docs/git-update-ref), [GitLab on 2.50](https://about.gitlab.com/blog/what-s-new-in-git-2-50-0/)).
- **(a)** **`reference-transaction` hook** fires for *every* ref update by any command, with states `preparing`/`prepared`/`committed`/`aborted`; non-zero exit during preparing/prepared aborts the transaction. This is the single choke point to mirror every ref change into an external log (e.g., EFS records) ([githooks](https://git-scm.com/docs/githooks)).
- **(a)** **Server hook pipeline** on push: `pre-receive` (once, all commands on stdin) → `update` (per ref) → ref updates → `post-receive` → `post-update`. Incoming objects sit in a **quarantine directory** and only migrate into the object store if `pre-receive` passes; a rejected push leaves no data on disk ([git-receive-pack](https://git-scm.com/docs/git-receive-pack)).
- **(a)** **`proc-receive` hook** (Git 2.29+): with `receive.procReceiveRefs` set (e.g. `refs/for/`), matching push commands are handed to the hook *instead of* Git's own ref-update logic. The hook speaks a pkt-line protocol and may report `ok`/`ng` per command and rewrite results via `option refname/old-oid/new-oid/forced-update` — i.e., a push to `refs/for/main` can materialize as "created pull request #123" without ever creating that ref. This is the upstreamed agit-flow mechanism and the natural hook point for "push = EFS proposal record" ([githooks](https://git-scm.com/docs/githooks)).
- **(a)** **Push certificates**: `git push --signed` makes the client GPG-sign a certificate (pushee URL, pusher identity, nonce, and the full old-oid/new-oid/refname command list). Anti-replay nonce is HMAC'd from `receive.certNonceSeed`; hooks receive `GIT_PUSH_CERT`, `GIT_PUSH_CERT_SIGNER`, `GIT_PUSH_CERT_KEY`, `GIT_PUSH_CERT_STATUS`, `GIT_PUSH_CERT_NONCE`, `GIT_PUSH_CERT_NONCE_STATUS` (`OK`/`SLOP`/`BAD`/`MISSING`/`UNSOLICITED`) ([git-receive-pack](https://git-scm.com/docs/git-receive-pack)). **(c)** No major forge surfaces push certificates today; the mechanism is GPG-keyed, so an EFS design wanting wallet/KEL-signed pushes would either bridge via a custom `gpg.program`/hook validation or carry the authorization in an EFS record instead.
- **(a)** New in 2.54/2.55: hooks can be declared in **config** (not just `.git/hooks/` scripts), and config-declared hooks can run in parallel (`hook.<name>.parallel`, `hook.jobs`) — relevant for forge-side hook fleets ([GitLab on 2.54](https://about.gitlab.com/blog/whats-new-in-git-2-54-0/), [GitHub blog 2.55](https://github.blog/open-source/git/highlights-from-git-2-55/)).
- **(a)** **Hidden refs**: `transfer.hideRefs` / `receive.hideRefs` / `uploadpack.hideRefs` let a server keep ref namespaces out of advertisement and refuse pushes to them ([git-config](https://git-scm.com/docs/git-config#Documentation/git-config.txt-transferhideRefs)). Forges use this for PR namespaces (§9).

## 3. Protocol v2

- **(a)** Default since Git 2.26. One service, explicit commands: **`ls-refs`** (server-side ref filtering by `ref-prefix`; `symrefs`, `peel`, `unborn`), **`fetch`** (want/have negotiation, `thin-pack`, shallow features, `filter` for partial clone, `want-ref`, `sideband-all`, `packfile-uris`, `wait-for-done`), **`object-info`** (sizes without fetching), **`bundle-uri`**. Capability advertisement is a flat key/value list incl. `object-format` (sha1/sha256) and `session-id`; the protocol is stateless-friendly by design ([gitprotocol-v2](https://git-scm.com/docs/gitprotocol-v2)).
- **(a)** Key v2 scaling property: **no forced full ref advertisement** — a repo with a million refs only sends what the client's `ref-prefix` asks for. v0/v1 dumped every ref on every fetch ([gitprotocol-v2](https://git-scm.com/docs/gitprotocol-v2)).
- **(a)** Transports: smart HTTP(S) (`$GIT_URL/info/refs?service=git-upload-pack` + `Git-Protocol: version=2` header), SSH (`GIT_PROTOCOL` env passthrough), `git://`, and local file. Same command set on all of them ([gitprotocol-v2](https://git-scm.com/docs/gitprotocol-v2)). **(c)** For EFS this means the "server" can be any request/response oracle that speaks pkt-line — an HTTP gateway over EthStorage/Arweave needs only `ls-refs` + `fetch` to be a read mirror, and `ls-refs` can be backed directly by on-chain ref state.
- **(a)** **`packfile-uris`**: server may answer a fetch with "download these pack URIs from a CDN, plus a small top-up pack" — shipped in Git for years but rarely deployed publicly; bundle-uri (§4) is the direction that got forge traction.
- **(a)** **`promisor-remote` capability** (landed in the 2.50 cycle, mid-2025; spec now in gitprotocol-v2): the server advertises promisor remotes (`name` and `url` mandatory; optional `filter` and `token` fields) that the client may adopt, gated client-side by `promisor.acceptFromServer` trust config ([gitprotocol-v2](https://git-scm.com/docs/gitprotocol-v2), [patch series](https://marc.info/?l=git&m=173987812111046)). 2.55 release notes show continued refactoring "in preparation for auto-configuration of advertised remotes" ([2.55 RelNotes](https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.55.0.adoc)). **(c)** This is the native mechanism by which an EFS-hosted repo could tell clients "large blobs live at this gateway" without LFS.

## 4. Bundles and bundle-URI

- **(a)** `git bundle create` packages a header (refs + **prerequisite** oids, i.e. `-<oid>` lines from rev-list exclusions) plus a packfile; incremental bundles are just bundles with prerequisites; `git bundle verify` checks the receiving repo has the prerequisites. Bundle format v3 adds capabilities: `object-format` (sha256 bundles) and `filter` (partial bundles) ([git-bundle](https://git-scm.com/docs/git-bundle), [gitformat-bundle](https://git-scm.com/docs/gitformat-bundle)).
- **(a)** **Bundle-URI**: client-side `git clone --bundle-uri=<uri>` (since 2.38) bootstraps the object DB from static bundle files, then fetches the remainder from the origin; bundle *lists* with `creationToken` heuristic support incremental "fetch only newer bundles" ([bundle-uri technical doc](https://www.kernel.org/pub/software/scm/git/docs/technical/bundle-uri.html)). A v2 `bundle-uri` protocol command lets servers advertise the URIs ([gitprotocol-v2](https://git-scm.com/docs/gitprotocol-v2)).
- **Adoption state, Aug 2026:**
  - **(a)** GitLab: Gitaly bundle URIs shipped in GitLab 17.0 behind feature flag `gitaly_bundle_uri` (disabled by default), serving clone/fetch bootstrap from Google Cloud Storage, S3-compatible, Azure Blob, or local files; **automatic** bundle generation (clone-frequency triggered) added in GitLab 18.0 behind `gitaly_bundle_generation` (also default-off); currently one bundle per repo; CI usage requires Git ≥ 2.49 and Runner helper ≥ 18.0 ([GitLab bundle-URI docs](https://docs.gitlab.com/administration/gitaly/bundle_uris/), [GitLab blog 2025-06-24](https://about.gitlab.com/blog/reduce-the-load-on-gitlab-gitaly-with-bundle-uri/)).
  - **(a)** GitHub: no bundle-uri support deployed ([community discussion](https://github.com/orgs/community/discussions/12490) era; no announcement as of Aug 2026). Gitea: open feature request only ([gitea#34518](https://github.com/go-gitea/gitea/issues/34518)).
  - **(a)** Reference server: [`git-ecosystem/git-bundle-server`](https://github.com/git-ecosystem/git-bundle-server) (web server + CLI managing base/incremental bundle lists).
  - **(a)** Git 2.50 improved unbundling performance server/client side ([GitLab on 2.50](https://about.gitlab.com/blog/what-s-new-in-git-2-50-0/)).
- **(c)** Bundle-URI is the single most EFS-shaped transport feature in Git: bundles are static, dumb, integrity-checked-after-download files — exactly what Arweave/EthStorage can serve. A base bundle + creationToken-ordered incremental bundles published per epoch gives anonymous, serverless cloning with only a thin `ls-refs` oracle needed for freshness. Client support ships in every modern Git; only server advertisement is exotic.

## 5. Partial clone, promisor remotes, shallow clones

- **(a)** Partial clone: `--filter=blob:none` (blobless), `blob:limit=<n>`, `tree:0` (treeless); missing objects are "promised" by a **promisor remote** and lazily fetched on demand; promisor packs are marked `.promisor` ([partial-clone docs](https://git-scm.com/docs/partial-clone)).
- **Known pain (a):** lazy fetches are one-object-per-round-trip for commands like `blame`/`rebase` (new HTTPS/SSH session each time); partial clone requires the promisor remote to be reachable forever after; with objects spread across multiple promisor remotes, `upload-pack` fails outright when it can't fulfill a request (a "best-effort/partial success" fix is only a proposal) ([partial-clone docs](https://git-scm.com/docs/partial-clone), [gitperf ch. 11](https://gitperf.com/chapter-11.html), [GitLab git#9](https://gitlab.com/gitlab-org/git/-/work_items/9)).
- **(a)** **`git backfill`** (2.49, 2025-03): batch-downloads all missing blobs of a blobless clone in few packs, path-walk-grouped for good deltas, restartable, `--sparse`-aware — substantially blunts the lazy-fetch pain for the "clone fast, hydrate later" pattern ([GitHub blog 2.49](https://github.blog/open-source/git/highlights-from-git-2-49/), [git-backfill](https://git-scm.com/docs/git-backfill)).
- **(a)** Shallow clone (`--depth`, `--deepen`, `--shallow-since`, `--shallow-exclude`): cheap first clone, but subsequent fetch negotiation degrades and deepening is expensive; GitHub's own guidance is to prefer blobless/treeless partial clones for anything beyond throwaway single-build CI ([GitHub partial vs shallow clone](https://github.blog/2020-12-21-get-up-to-speed-with-partial-clone-and-shallow-clone/)).
- **(b)** **Large-object promisors (LOP) effort** ([design doc in git tree](https://git-scm.com/docs/large-object-promisors), last major update 2.49, unchanged through 2.55): dedicated promisor remotes storing only large blobs, offload-on-push above a size threshold, cloud object storage via remote helpers, and server→client advertisement via the promisor-remote capability. Explicitly positioned as an *alternative to Git LFS* built from native Git parts. Status: multiple promisor remotes and `blob:limit` filters shipped; protocol negotiation/auto-configuration and offload mechanics still in progress; doc warns old clients falling back to the main remote defeat the benefit. **(c)** EFS should track LOP rather than betting long-term on LFS: LOP needs no pointer files, keeps oids = real content hashes, and its "trust the advertised remote?" config question maps cleanly onto EFS lens policy.

## 6. SHA-256 transition state (as of Git 2.55 / Aug 2026)

- **(a)** SHA-256 repos (`extensions.objectFormat=sha256`) fully supported since 2.29, "no longer experimental" since 2.42 — but a repo is **one format**; SHA-1 and SHA-256 repos still cannot push/fetch to each other in general ([hash-function-transition](https://git-scm.com/docs/hash-function-transition), [devclass on 2.42](https://www.devclass.com/development/2023/08/22/git-242-released-sha-256-repositories-no-longer-an-experimental-curiosity/1627796)).
- **(a, experimental)** Interop groundwork since 2.45: `extensions.compatObjectFormat=sha1` on a SHA-256 repo maintains a bidirectional oid mapping, `git rev-parse --output-object-format=sha1` translates ids, and signing writes both-format signatures. GitHub's own writeup: "many functionalities may not work quite as you expect" — full transport interop is **not** done ([GitHub blog 2.45](https://github.blog/open-source/git/highlights-from-git-2-45/)).
- **(b)** **Git 3.0** (targeted late 2026, no firm date): SHA-256 default for new repos and reftable default ref backend, testable now via `WITH_BREAKING_CHANGES` builds (2.51+, [commit c79bb70](https://github.com/git/git/commit/c79bb70a2e7d9158ec165ea16ad45371cd6e350d), [BreakingChanges](https://git-scm.com/docs/BreakingChanges), [Phoronix](https://www.phoronix.com/news/Git-2.51-rc0)).
- **(a)** Forge reality: GitHub — no SHA-256 repo support ([open discussion](https://github.com/orgs/community/discussions/154056)); GitLab — Gitaly supports SHA-256, project creation still experimental ([GitLab blog](https://about.gitlab.com/blog/sha256-support-in-gitaly/)); Forgejo/Codeberg — works since Forgejo 7.0 (2024) per user reports ([forgejo#2609](https://codeberg.org/forgejo/forgejo/issues/2609)). Git LFS SHA-256-repo interop is itself only a plan ([git-lfs#6190](https://github.com/git-lfs/git-lfs/issues/6190)).
- **(c)** EFS design consequence: any on-chain anchoring of commit oids must carry an explicit `object-format` tag (protocol v2 and bundle v3 already do), and EFS should assume a *decade* of dual-hash reality: pinning SHA-1 oids today is fine (forges force it), but record schemas must not hard-code 20-byte oids. The compat-mapping precedent (2.45) shows Git itself will treat "same object, two ids" as a mapping problem — EFS records could do the same.

## 7. Git LFS

- **(a)** Pointer file: a tiny text blob checked into the tree — `version https://git-lfs.github.com/spec/v1`, `oid sha256:<64 hex>`, `size <bytes>` — wired via `.gitattributes` clean/smudge filters ([spec](https://github.com/git-lfs/git-lfs/blob/main/docs/spec.md)). Content is content-addressed by SHA-256 independent of the repo's hash algo.
- **(a)** **Batch API**: `POST {lfs-endpoint}/objects/batch` (endpoint defaults to `<remote-url>/info/lfs`), JSON with `Accept/Content-Type: application/vnd.git-lfs+json`; request = `{operation: download|upload, transfers: [...], ref, objects: [{oid, size}], hash_algo}`; response gives per-object `actions` with `href` + `header` + expiry — i.e., typically **presigned object-storage URLs**. Per-object errors ride inside a 200. Only the `basic` transfer adapter is standard ([batch.md](https://github.com/git-lfs/git-lfs/blob/main/docs/api/batch.md)).
- **(a)** **Custom transfer agents**: `lfs.customtransfer.<name>` spawns a process speaking a JSON-over-stdio protocol; `lfs.standalonetransferagent` bypasses the batch API entirely for matching URLs. A large ecosystem exists (S3, scp, rsync, shared-folder agents) ([custom-transfers.md](https://github.com/git-lfs/git-lfs/blob/main/docs/custom-transfers.md), [lfs-s3](https://github.com/nicolas-graves/lfs-s3), [lfs-folderstore](https://github.com/sinbad/lfs-folderstore)). **(c)** A `web3://`/EthStorage/Arweave custom transfer agent is a weekend-sized shim — this is the lowest-effort path to EFS-backed large files under today's Git.
- **(a)** **SSH**: classic hybrid mode shells out to `git-lfs-authenticate <path> <op>` on the server to mint HTTPS credentials; the **pure-SSH LFS protocol** (server binary `git-lfs-transfer`) is now tried *first* by git-lfs 3.7 (2025) with fallback to hybrid; server-side implementations exist (charmbracelet) and GitLab has an open epic to support it in gitlab-shell ([git-lfs CHANGELOG](https://github.com/git-lfs/git-lfs/blob/main/CHANGELOG.md), [charmbracelet/git-lfs-transfer](https://github.com/charmbracelet/git-lfs-transfer), [GitLab epic 11872](https://gitlab.com/groups/gitlab-org/-/epics/11872)).
- **(a)** Third-party LFS servers only need: batch endpoint + blob storage + (optionally) the file-locking API; auth is orthogonal (`Authorization` header / `LFS-Authenticate` challenge) ([batch.md](https://github.com/git-lfs/git-lfs/blob/main/docs/api/batch.md)).

## 8. Hosting many repos cheaply: alternates, pools, namespaces, worktrees

- **(a)** **Alternates**: `objects/info/alternates` lets repo A read objects from repo B's store on the same filesystem — the universal forge fork-dedup primitive. Hazard: pruning the source repo corrupts borrowers, so pool repos must never run normal `gc`/`prune`; borrowers repack with `-l` (local-only) ([gitrepository-layout](https://git-scm.com/docs/gitrepository-layout), [GitLab dedup design](https://docs.gitlab.com/development/git_object_deduplication/)).
- **(a)** **GitLab object pools**: fork networks share an `@pools/...` pool repository via alternates; all members must sit on the same Gitaly shard; dedup limited to forks of public projects ([GitLab dedup design](https://docs.gitlab.com/development/git_object_deduplication/)). GitHub does the equivalent with shared fork-network storage; Forgejo/Gitea have open issues to adopt the same alternates approach ([forgejo#4957](https://codeberg.org/forgejo/forgejo/issues/4957), [gitea#24731](https://github.com/go-gitea/gitea/issues/24731)).
- **(a)** **Delta islands** (`pack.island`, Git 2.20+): when serving a shared object store for many forks, restrict delta chains so objects reachable from one fork never delta against another fork's objects — required to serve fetches from shared storage without cross-fork data dependencies ([git-pack-objects DELTA ISLANDS](https://git-scm.com/docs/git-pack-objects#_delta_islands)).
- **(a)** **Security lesson from shared stores**: on GitHub, objects from deleted or private forks in the same network remained fetchable by SHA from sibling repos ("Cross Fork Object Reference", Truffle Security 2024) ([writeup](https://trufflesecurity.com/blog/anyone-can-access-deleted-and-private-repo-data-github)). **(c)** EFS's public-by-default stance dissolves this class of bug, but any EFS "private until published" feature must not share object stores across trust boundaries.
- **(a)** **gitnamespaces** (`GIT_NAMESPACE`): serve many *ref* views from one object store (`refs/namespaces/<ns>/…`); documented caveat that object reachability leaks across namespaces, so it's ref isolation, not data isolation ([gitnamespaces](https://git-scm.com/docs/gitnamespaces)).
- **(a)** **Worktrees/commondir**: linked worktrees share the object DB and most refs via the `commondir` file; `HEAD`, `refs/bisect/*`, `refs/worktree/*` are per-worktree ([git-worktree](https://git-scm.com/docs/git-worktree), [gitrepository-layout](https://git-scm.com/docs/gitrepository-layout)). **(c)** Relevant for EFS wiki rendering: one bare store + many cheap worktrees/namespaces, not one full repo per view.

## 9. GC semantics and how forges prevent force-push data loss

- **(a)** `git gc` keeps everything reachable from refs, reflogs, the index, and worktree HEADs. Unreachable objects are no longer exploded loose: they're collected into **cruft packs** with per-object mtimes (`.mtimes` file) and only pruned once older than `gc.pruneExpire` (default `2.weeks.ago`); recent objects and their dependents are protected by mtime freshening ([git-gc](https://git-scm.com/docs/git-gc), [cruft-packs](https://git-scm.com/docs/cruft-packs)).
- **(a)** Reflog expiry defaults: `gc.reflogExpire` 90 days (reachable entries), `gc.reflogExpireUnreachable` 30 days ([git-gc](https://git-scm.com/docs/git-gc)). Reflogs are per-repo, not transported — a bare mirror has no client reflog safety net.
- **(a)** **GitHub's force-push behavior**: rewritten/unreachable commits remain accessible via their SHAs in cached views and via any PRs referencing them; data also persists in forks; full removal requires GitHub Support to dereference PRs, purge caches, and run server-side GC ([GitHub docs: removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)).
- **(a)** **Hidden ref pinning**: GitHub materializes `refs/pull/N/head` and `refs/pull/N/merge` for every PR — fetchable by anyone, push-rejected as "deny updating a hidden ref" ([GitHub docs: checking out PRs](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/checking-out-pull-requests-locally), [community discussion](https://github.com/orgs/community/discussions/191468)). Forgejo/Gitea use the same `refs/pull/*` namespace ([forgejo#7075](https://codeberg.org/forgejo/forgejo/pulls/7075)). These pinned refs are *why* PR history survives force-pushes on forges: proposal state lives in refs the proposer can't rewrite.
- **(c)** EFS translation: "history is permanent" needs no gc policy at all if objects land on permanent storage — but the *forge-grade* guarantee users actually rely on is (1) every proposal/review pins its commits via its own ref-like record and (2) force-push visibility (old-oid → new-oid transitions) is itself logged. Git's `reference-transaction` hook plus signed old/new oids in push certs give exactly that event stream.

## 10. Recent changes worth tracking (2025→2026)

- Git 2.49 (2025-03): `git backfill`, path-walk API, name-hash v2 ([GitHub blog 2.49](https://github.blog/open-source/git/highlights-from-git-2-49/)).
- Git 2.50 (2025-06): batched ref updates, bundle-URI unbundling perf, promisor-remote capability groundwork ([GitLab on 2.50](https://about.gitlab.com/blog/what-s-new-in-git-2-50-0/)).
- Git 2.51 (2025-08): cruft-free MIDX, `--path-walk` packing, Git 3.0 breaking-changes docs ([GitHub blog 2.51](https://github.blog/open-source/git/highlights-from-git-2-51/)).
- Git 2.53 (2026-02): Rust default-enabled in both build systems — builds fail without Rust ([Phoronix](https://www.phoronix.com/news/Git-2.53-Released)).
- Git 2.54 (2026-04): config-defined hooks, experimental `git history` (reword/split), incremental maintenance ([GitLab on 2.54](https://about.gitlab.com/blog/whats-new-in-git-2-54-0/), [linuxiac](https://linuxiac.com/git-2-54-released-with-new-git-history-command/)).
- Git 2.55 (2026-06): incremental MIDX chains, parallel config hooks, Linux inotify fsmonitor, `git history fixup` ([GitHub blog 2.55](https://github.blog/open-source/git/highlights-from-git-2-55/)).
- **(b)** Git 3.0 (SHA-256 + reftable defaults) targeted late 2026 — will land mid-flight for any EFS Git effort ([DeployHQ overview](https://www.deployhq.com/blog/git-3-0-on-the-horizon-what-git-users-need-to-know-about-the-next-major-release)).

## Sources

- https://git-scm.com/book/en/v2/Git-Internals-Git-Objects
- https://git-scm.com/docs/gitformat-pack
- https://git-scm.com/docs/gitformat-bundle
- https://git-scm.com/docs/git-bundle
- https://git-scm.com/docs/git-push
- https://git-scm.com/docs/git-update-ref
- https://git-scm.com/docs/git-receive-pack
- https://git-scm.com/docs/githooks
- https://git-scm.com/docs/gitprotocol-v2
- https://git-scm.com/docs/protocol-capabilities
- https://git-scm.com/docs/git-config#Documentation/git-config.txt-transferhideRefs
- https://git-scm.com/docs/partial-clone
- https://git-scm.com/docs/git-backfill
- https://git-scm.com/docs/large-object-promisors
- https://git-scm.com/docs/hash-function-transition
- https://git-scm.com/docs/BreakingChanges
- https://git-scm.com/docs/git-gc
- https://git-scm.com/docs/cruft-packs
- https://git-scm.com/docs/git-pack-objects#_delta_islands
- https://git-scm.com/docs/gitnamespaces
- https://git-scm.com/docs/git-worktree
- https://git-scm.com/docs/gitrepository-layout
- https://www.kernel.org/pub/software/scm/git/docs/technical/bundle-uri.html
- https://github.blog/open-source/git/highlights-from-git-2-45/
- https://github.blog/open-source/git/highlights-from-git-2-49/
- https://github.blog/open-source/git/highlights-from-git-2-51/
- https://github.blog/open-source/git/highlights-from-git-2-55/
- https://github.blog/2020-12-21-get-up-to-speed-with-partial-clone-and-shallow-clone/
- https://about.gitlab.com/blog/what-s-new-in-git-2-50-0/
- https://about.gitlab.com/blog/whats-new-in-git-2-49-0/
- https://about.gitlab.com/blog/whats-new-in-git-2-54-0/
- https://about.gitlab.com/blog/reduce-the-load-on-gitlab-gitaly-with-bundle-uri/
- https://about.gitlab.com/blog/sha256-support-in-gitaly/
- https://docs.gitlab.com/administration/gitaly/bundle_uris/
- https://docs.gitlab.com/development/git_object_deduplication/
- https://gitlab.com/gitlab-org/git/-/work_items/9
- https://gitlab.com/groups/gitlab-org/-/epics/11872
- https://github.com/git-ecosystem/git-bundle-server
- https://github.com/go-gitea/gitea/issues/34518
- https://github.com/go-gitea/gitea/issues/24731
- https://codeberg.org/forgejo/forgejo/issues/4957
- https://codeberg.org/forgejo/forgejo/issues/2609
- https://codeberg.org/forgejo/forgejo/pulls/7075
- https://github.com/git/git/commit/c79bb70a2e7d9158ec165ea16ad45371cd6e350d
- https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.55.0.adoc
- https://marc.info/?l=git&m=173987812111046
- https://www.phoronix.com/news/Git-2.51-rc0
- https://www.phoronix.com/news/Git-2.53-Released
- https://9to5linux.com/git-2-53-released-with-new-features-and-performance-improvements
- https://linuxiac.com/git-2-54-released-with-new-git-history-command/
- https://www.deployhq.com/blog/git-3-0-on-the-horizon-what-git-users-need-to-know-about-the-next-major-release
- https://www.devclass.com/development/2023/08/22/git-242-released-sha-256-repositories-no-longer-an-experimental-curiosity/1627796
- https://github.com/orgs/community/discussions/154056
- https://github.com/orgs/community/discussions/12490
- https://github.com/orgs/community/discussions/191468
- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
- https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/checking-out-pull-requests-locally
- https://github.com/git-lfs/git-lfs/blob/main/docs/spec.md
- https://github.com/git-lfs/git-lfs/blob/main/docs/api/batch.md
- https://github.com/git-lfs/git-lfs/blob/main/docs/custom-transfers.md
- https://github.com/git-lfs/git-lfs/blob/main/CHANGELOG.md
- https://github.com/git-lfs/git-lfs/issues/6190
- https://github.com/charmbracelet/git-lfs-transfer
- https://github.com/nicolas-graves/lfs-s3
- https://github.com/sinbad/lfs-folderstore
- https://gitperf.com/chapter-11.html
- https://trufflesecurity.com/blog/anyone-can-access-deleted-and-private-repo-data-github
