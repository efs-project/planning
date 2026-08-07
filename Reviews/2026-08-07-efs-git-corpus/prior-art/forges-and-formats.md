# Forge Internals and Portable Forge Data Formats

**Lane:** conventional forge internals and portable forge data formats — researched 2026-08-07

Legend used throughout: **(a)** implemented/shipped behavior, **(b)** documented intent, **(c)** recommendation for EFS, **(d)** speculation.

---

## 1. Forgejo/Gitea storage boundaries

**(a) Three-tier split: bare git repos + SQL database + object storage.** Forgejo's contributor architecture doc states the app "serves as a Git server and frontend" and "doesn't touch the git repository itself; it leaves that to the `git` binary," while everything not git-native "stores information in databases" ([Forgejo architecture](https://forgejo.org/docs/next/contributor/architecture/)). Issues, PR metadata, reviews, labels, milestones, users/orgs/teams, and permissions are SQL rows (SQLite/MySQL/PostgreSQL).

**(a) Object-storage subsystems.** Forgejo documents eight blob subsystems, each configurable as local disk or S3-compatible (MinIO/Garage/S3/Backblaze): `attachments/` (issue+PR uploads), `lfs/`, `avatars/`, `repo-avatars/`, `repo-archive/`, `packages/`, `actions_log/`, `actions_artifacts/` ([Forgejo storage admin docs](https://forgejo.org/docs/latest/admin/storage/)).

**(a) Wiki is a separate bare git repo** named `<repo>.wiki.git` beside the main repo, cloneable and editable with plain git; content is Markdown plus assets ([Forgejo wiki docs](https://forgejo.org/docs/latest/user/getting-started/wiki/)). This is the one collaboration surface Gitea/Forgejo already keeps fully in git.

**(a) PR head refs live in the base bare repo** as `refs/pull/{index}/head`, so the *code* side of a PR survives in the git data; there are known bugs where these refs lag pushes or dangle after rebase-merge ([gitea#12074](https://github.com/go-gitea/gitea/issues/12074), [gitea#4835](https://github.com/go-gitea/gitea/issues/4835)).

**(a) What you lose with only the git repos:** all issue/PR/review discussion, labels, milestones, projects, release *notes and assets* (tags survive), attachments, users/identity mapping, permissions, and Actions history — i.e., everything social. Code, tags, branches, wiki, and PR head snapshots survive.

**(a→b) The community knows this is a lock-in problem.** Forgejo issue #2629 "[FEAT] Store issues and other data in git repository" (opened 2024-03-11, still open, latest comment 2026-02-25) proposes issues-as-commits for clone-the-whole-project portability. A core maintainer pushed back: every git-file-backed tracker he tried "ended up with horrible conflicts"; DB queries beat git scans under concurrency; alternatives discussed include a separate issues git repo (like wikis), Radicle-style CRDT Collaborative Objects, and per-issue refs (`refs/issues/<uuid>`) to dodge file merge conflicts ([forgejo#2629](https://codeberg.org/forgejo/forgejo/issues/2629)). No resolution as of Aug 2026.

**(a) Repo dot-folders are a parallel, incompatible in-repo config channel.** Every forge reads `.github/`/`.gitlab/`/`.gitea/`/`.forgejo/` for CI, templates, CODEOWNERS; contents overlap but diverge, and only Gitea/Forgejo fall back to `.github/` ([Nesbitt, 2026-02-22](https://nesbitt.io/2026/02/22/forge-specific-repository-folders.html)).

**(c) For EFS:** copy the wiki-as-sibling-git-repo pattern (proven, conflict-tolerant because prose pages rarely collide); copy the "PR head as a ref in the target repo" pattern so proposal code is part of the replicated object; avoid the SQL-resident discussion layer — that is exactly the exit-hostile part. The #2629 thread is a ready-made catalog of the failure modes (file-level merge conflicts, query performance) EFS records+lenses must answer.

---

## 2. Friendly Forge Format (F3)

**(b) Spec state.** F3 is "an Open File Format for storing the information from a forge such as issues, pull/merge requests, milestones, release assets, etc., as well as the associated VCS," intended for backup, mirroring, and federation between GitHub/GitLab/Gitea/Forgejo. Current spec is **v4.0**; copyright "© 2026, F3 Authors"; funded by NLnet (2022) and OTF (2024) ([f3.forgefriends.org](https://f3.forgefriends.org/), [NLnet project page](https://nlnet.nl/project/F3-FriendlyForgeFormat/)).

**(b) Object model.** F3 v4.0 schemas cover: Attachment, CI, Comment, Issue, Label, Markdown, Milestone, Object, Organization, Project, Pull request, PR-reference-to-commit, Reaction, Release, Repository, Review, Review comment, Team, Team member, Team project, Topic, User. Archive layout = hierarchical tree of JSON files validated against normative schemas + content-addressable blobs (avatars, assets, attachments) + VCS directories (git, hg) ([f3.forgefriends.org](https://f3.forgefriends.org/)).

**(a) Implementation.** Reference implementation `gof3` (Go) reads a forge → F3 and F3 → forge, with drivers for Forgejo/Gitea/GitLab and a filesystem driver ([code.forgejo.org/f3/gof3](https://code.forgejo.org/f3/gof3)). Forgejo has carried a **native F3 driver since v9.0.0**, exposed as `forgejo-cli f3 mirror`, but the CLI docs mark it "disabled and for development purposes" — i.e., experimental, off by default ([Forgejo CLI docs](https://forgejo.org/docs/latest/admin/command-line/)). The F3 compliance page tracks Forgejo v14, GitLab 17.11.3, Gitea v1.25 as target/compliant versions ([compliance](https://f3.forgefriends.org/compliance.html)).

**(a) Round-trip reality is weak.** A 2024 refactor archived the original driver branch after "the friction for an incremental implementation was too high"; drivers for 15 component types were to be re-ported against gof3 compliance tests ([forgejo discussion #105](https://codeberg.org/forgejo/discussions/issues/105)). As of Aug 2026 there is no evidence of production round-tripping (forge→F3→forge) being used at scale; the compliance page documents no certified round-trip.

**(c) For EFS:** copy F3's *object taxonomy* — it is the best-vetted neutral vocabulary of what a forge actually contains (note it models Review and Review-comment as first-class, separate from Comment). Avoid F3's *architecture assumption*: it is a snapshot/mirror format (export-transform-import), not a live shared substrate; identity is per-forge numeric IDs, which is exactly the portability failure EFS's stable principals fix. Treat F3 as EFS's export/import shim target, not its native model. **(d)** If EFS emits F3-conformant archives from lens output, migration into Forgejo/GitLab comes nearly free.

---

## 3. ForgeFed and Forgejo federation

**(b) Spec state.** ForgeFed is an ActivityPub extension, explicitly "still under construction"; current text is a branch snapshot dated **18 June 2025**, developed on Codeberg under the Open Web Foundation Agreement ([forgefed.org/spec](https://forgefed.org/spec/)).

**(b) Vocabulary.** Actors: Repository, TicketTracker, PatchTracker, Project, Team, Organization, Person (plus Workflow, Roadmap, ReleaseTracker, Factory). Activities: AP standards (Create/Update/Delete/Accept/Reject/Undo/Follow/Like) plus forge-specific Push, Offer, Assign, Resolve, Apply. Objects: Ticket (covers issues *and* merge requests), Patch, Branch, Commit, Comment, Review/ReviewThread, milestones, custom fields. It also specifies grant-based access control (roles: admin/write/triage/report/visit) ([forgefed.org/spec](https://forgefed.org/spec/)).

**(a) Implementations.** Vervis is the reference implementation; a Pagure plugin is unmaintained; **Forgejo is the only mainstream forge implementing it** ([forgefed.org](https://forgefed.org/)). Forgejo's shipped state as of v14.0 (released 2026-01-15): federated stars exist (built 2025); v13.0 (2025-10-16) added improved HTTP-signature handling, an instance actor, and "sent user activities to distant federated server" ([v13 release](https://forgejo.org/2025-10-release-v13-0/), [v14 release](https://forgejo.org/2026-01-release-v14-0/)). The FAQ still says federation "is under active development, and is considered experimental" because "moderation and access control have not yet been developed" ([Forgejo FAQ](https://forgejo.org/faq/)). NLnet funds the ongoing work ([NLnet Federated-Forgejo](https://nlnet.nl/project/Federated-Forgejo/)).

**(a) Bottom line:** after ~7 years of ForgeFed and ~4 of funded Forgejo work, no cross-instance issue/PR federation is in production. The hard unsolved parts are moderation, access control, and identity — not vocabulary.

**(c) For EFS:** copy the vocabulary decisions (Ticket unifying issue+MR; Push as first-class activity; grant-based capability roles map well onto KEL-scoped actor keys). Avoid the architecture: ForgeFed replicates *mutable server state between servers*, inheriting every consistency and moderation problem; EFS's shared-substrate model (one record log, many lenses) dissolves the federation problem rather than solving it. ForgeFed's stall is evidence *for* the substrate approach. **(d)** An EFS→ActivityPub bridge actor could make EFS repos followable from the fediverse cheaply, since EFS records map naturally onto AP activities.

---

## 4. GitHub's hidden data model as exit pressure

**(a) `refs/pull/N/head` and `refs/pull/N/merge`.** Every PR's head is exposed read-only at `refs/pull/ID/head` ("The remote `refs/pull/` namespace is *read-only*"; pushes are rejected with "deny updating a hidden ref") ([GitHub docs](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/checking-out-pull-requests-locally)). Test-merge commits (`refs/pull/N/merge`) are server-computed; as of **2026-02-19** GitHub generates them only on push, merge-base change, or >12h staleness — no longer on page view ([changelog](https://github.blog/changelog/2026-02-19-changes-to-test-merge-commit-generation-for-pull-requests/)). So even the git-visible PR surface is partly synthetic server state.

**(a) What an export contains.** The migration-archive (ghe-migrator / org migrations API) is a tarball of JSON files: attachments, bases, commit_comments, issue_comments, issue_events, issues, milestones, organizations, projects, protected_branches, pull_request_reviews, pull_requests, releases, repositories, review_comments, schema, users — plus an attachments dir and the git repositories; archives expire after 7 days ([exporting migration data](https://docs.github.com/en/migrations/using-ghe-migrator/exporting-migration-data-from-githubcom), [org migrations API](https://docs.github.com/en/rest/migrations/orgs)).

**(a) What cannot be exported** (GitHub Enterprise Importer's not-migrated list, GitHub's own tooling): audit logs, code-scanning results, commit status checks, Dependabot data, **repo-level Discussions**, **edit history of comments**, **fork relationships**, Actions secrets/variables/environments/artifacts/**workflow run history**, GitHub Apps, **Git LFS objects**, Packages, new-style Projects, **stars and watchers**, sub-issues, rulesets, webhook secrets, user profiles/SSH keys, cross-repo issue↔PR references, and rebase-merge commit↔PR links ([GEI: about migrations](https://docs.github.com/en/migrations/using-github-enterprise-importer/migrating-between-github-products/about-migrations-between-github-products)).

**(c) For EFS:** this is the sharpest statement of exit pressure available: even GitHub's first-party tools cannot carry social graph (stars/watchers/forks), provenance (edit history, event links), or automation state out. EFS should define its record vocabulary so that *nothing admitted to the substrate is in the "cannot export" class by construction* — edit history, cross-references, and endorsement/star records must be ordinary signed records, not server-side joins. Copy the `refs/pull/N/head` convention verbatim (it is the de-facto standard three forges share); avoid ever making a lens output (like `/merge` test commits) look like substrate data.

---

## 5. GitLab project export

**(a) Format.** Project export = tar.gz of **NDJSON** relation files plus repo bundles; importable only within two minor versions ("GitLab 13.0 accepts exports from 13.0, 12.10, 12.9") ([GitLab import/export docs](https://docs.gitlab.com/ee/user/project/settings/import_export.html)).

**(a) Included:** project + wiki git repos, uploads, config (minus integrations), issues (with comments, resource events), MRs (with **diffs**, comments, assignees, reviewers, approvers), commit comments, labels, milestones, snippets, releases, time tracking, design-management files, LFS objects, boards, archived CI pipeline records, protected branches/tags, push rules, emoji reactions, members, vulnerability report (17.7+).

**(a) Excluded:** pipeline triggers, **CI job traces and artifacts**, package/container registries, **CI variables and any encrypted tokens**, **webhooks**, deploy keys, secure files, activity logs, security policies, **links between issues and linked items / related-MR links**, child pipeline history ([same doc](https://docs.gitlab.com/ee/user/project/settings/import_export.html)).

**(a) Notable contrast with GitHub:** GitLab *does* export MR diffs, LFS, and wiki in one archive — materially better than GitHub — yet still drops cross-object links and anything secret-adjacent, and the two-minor-version window makes the format useless as a long-term archival format.

**(c) For EFS:** the version-window failure is the lesson — an export format coupled to application schema rots in months. EFS records must be self-describing and schema-versioned at the record level (which the frozen-schema/UID design already targets), so a 2026 record is readable in 2036 without the 2026 app. Also note GitLab exports *resource events* (label added, milestone changed) — EFS's event-shaped records are the same idea, admitted at write time instead of reconstructed at export time.

---

## 6. Gerrit NoteDb: review data as git commits

**(a) The strongest existence proof that full code-review state fits in git.** Since Gerrit 2.15/3.x, NoteDb "replaces the traditional SQL backend for change and account metadata with storing data in the same repository as code changes"; "modifications to changes are stored as a sequence of Git commits," giving automatic history of the metadata ([gerritcodereview.com/notedb](https://www.gerritcodereview.com/notedb.html)).

**(a) Exact ref schema** ([note-db.html](https://gerrit-review.googlesource.com/Documentation/note-db.html), [Notedb.md design doc](https://gerrit.googlesource.com/homepage/+/md-pages/docs/Notedb.md)):
- `refs/changes/45/12345/${PATCHSET_NUMBER}` — each patchset is a real commit of the proposed change (sharded by last two digits of change number).
- `refs/changes/45/12345/meta` — an append-only commit chain holding the change's review metadata; each meta commit = one mutation.
- Meta commit **footers** carry structure: `Label: Label-Name=Foo` (votes), explicit `Reviewer:` footers (no implicit zero votes), `Submitted-with:` (frozen submit-rule evaluation at submit time); the human-readable change message is the commit body ("Updated patch set 3").
- **Inline comments** are stored in a NoteMap on the meta branch keyed by the patchset commit SHA-1, value = JSON (`uuid`, `filename`, `patchSetId`, `lineNbr`, `author`, `writtenOn`, `side`, `range`, `revId`, `unresolved`, …).
- **Per-user private state** (draft comments, starred changes) lives in per-user refs in the **All-Users** repo; accounts at `refs/accounts/YZ/XYZ/meta` in All-Users; group data in All-Projects/All-Users; project config in `refs/meta/config`.

**(a) What stays outside git:** the secondary index (Lucene/Elasticsearch) for queries, plus persistent caches (e.g., patch-set ancestry) that are rebuilt rather than authoritative ([Notedb.md](https://gerrit.googlesource.com/homepage/+/md-pages/docs/Notedb.md)). Authority lives in git; indexes are disposable projections.

**(a) Stable change identity.** Gerrit's `Change-Id` footer survives commit rewrites and is the join key across patchsets. In 2025-2026 Gerrit, **GitButler, and Jujutsu agreed to standardize a `change-id` git *commit header*** (32-char reverse-hex, distinguishable from SHA-1s), and Gerrit published a design doc for Jujutsu as a first-class client; `jj gerrit upload` auto-adds the footer today ([Gerrit design doc](https://www.gerritcodereview.com/design-docs/support-jujutsu-use-cases.html), [jj Gerrit docs](https://docs.jj-vcs.dev/latest/gerrit/)).

**(c) For EFS:** Gerrit is the closest existing system to "review objects as signed append-only records attached to code": copy (1) append-only mutation log per change with typed footers ≈ EFS records with typed schemas; (2) separation of authoritative log vs rebuildable index ≈ EFS chain vs lens caches; (3) per-user private refs for drafts (maps to persona-scoped records); (4) stable change identity independent of commit SHA — adopt the tri-project `change-id` header rather than inventing one. Avoid: NoteDb's server-mediated writes (Gerrit still requires a trusted server to sequence meta commits and enforce ACLs — EFS's chain admission replaces that) and its unsharded per-change hot refs, which caused real scaling work.

---

## 7. Git-native collaboration tools

**git-appraise (Google).** **(a)** Fully distributed code review in git-notes: review requests in `refs/notes/devtools/reviews` (annotating the first revision), human discussion in `refs/notes/devtools/discuss`, CI results in `refs/notes/devtools/ci`, robot/static-analysis comments in `refs/notes/devtools/analyses`; sync via `git appraise push/pull` with no server ([google/git-appraise](https://github.com/google/git-appraise)). Notes-append semantics dodge merge conflicts. Activity is minimal (~306 commits total; effectively dormant). **(c)** Copy the insight that *reviews annotate immutable revisions* and CI attestations are just another annotation stream; avoid git-notes as the carrier (obscure UX, poor tooling — the project's dormancy is the evidence).

**git-bug.** **(a)** Issues, identities, and comments as **operation-based CRDT-ish entities in git**: each entity is a DAG of `Operation`s (type, author, timestamp, Lamport clock, nonce) packed into JSON blobs, committed under `refs/<namespace>/<id>` and synced through ordinary remotes; concurrent edits merge deterministically via Lamport-clock ordering with lexicographic tiebreak — "creates the equivalent of a merge commit to merge both branches into a DAG" ([data-model.md](https://github.com/git-bug/git-bug/blob/trunk/doc/design/data-model.md)). Identities are themselves in-repo entities; bridges sync to GitHub/GitLab/Jira. Project is alive in 2026 (~10k stars, 2,632 commits) ([repo](https://github.com/git-bug/git-bug)). **(c)** This is the strongest direct prior art for EFS records-as-operations: copy operation-log-per-entity + deterministic ordering (EFS chain order can replace Lamport clocks — a *stronger* primitive); copy per-entity refs (no shared-file conflicts, the exact fix debated in forgejo#2629). Avoid its trust model (nonce + local signatures only; no admission control — EFS's signed-record admission is the upgrade).

**Fossil SCM.** **(a)** The maximal "everything in the repo" design: one SQLite file holds check-ins, wiki, tickets, forum, technotes, chat; "if you clone Fossil's self-hosting repository, you get the entire Fossil website — source code, documentation, ticket history"; autosync propagates all of it, and even branch names are global synced state ([fossil-v-git](https://fossil-scm.org/home/doc/trunk/www/fossil-v-git.wiki)). Costs it accepts: no rebase (immutable history by policy), no PR mechanic (bundles/patches raise drive-by friction), cathedral-scale only. **(c)** Fossil proves clone-equals-full-project-exit is achievable and loved by its users; copy the *guarantee*, not the implementation (single-DB artifact model doesn't compose with git ecosystems, and the missing-PR gap is exactly what killed its adoption for open contribution — EFS proposals must not repeat that).

**Jujutsu.** **(a)** Not a forge and stores no collaboration objects, but contributes the identity primitive: stable change IDs decoupled from commit SHAs, now being standardized as the cross-tool `change-id` commit header with Gerrit and GitButler; jj plans first-class `jj github submit`/`jj gerrit send`-style forge integration ([jj Gerrit docs](https://docs.jj-vcs.dev/latest/gerrit/), [Gerrit design doc](https://www.gerritcodereview.com/design-docs/support-jujutsu-use-cases.html)). **(c)** EFS proposals should key on `change-id`, not head SHA, so a proposal survives rebases/rewrites — this also future-proofs against jj-native contributors.

---

## 8. Cross-cutting implications for EFS

1. **The industry taxonomy is settled; the storage is not.** F3, ForgeFed, GitHub's archive, and GitLab's export agree on the object list (repo, issue/ticket, PR/patch, comment, review, review-comment, label, milestone, release, reaction, attachment, user/org/team). EFS should adopt this taxonomy for its record schemas and spend its novelty budget on storage/identity/admission, where every incumbent is weak. **(c)**
2. **Every escape hatch loses the graph.** All export paths drop cross-object links, edit history, and social signals. EFS records that reference stable IDs at write time keep the graph by construction. **(c)**
3. **Gerrit + git-bug together de-risk the core EFS bet**: append-only typed mutation logs per collaboration object, with rebuildable indexes, demonstrably support production review (Gerrit at Google scale) and distributed issues (git-bug) — EFS's chain replaces the parts both had to improvise (sequencing, identity, admission). **(a)→(c)**
4. **Federation-of-servers is the losing branch.** ForgeFed's decade-long draft status and Forgejo's still-experimental federation (v14.0, Jan 2026) show state-replication between mutable servers stalls on identity/moderation/ACLs — the exact things EFS's KEL + lens design centralizes into the substrate. **(a)→(c)**
5. **Wikis are the proven beachhead.** `<repo>.wiki.git` is already pure git on Gitea/Forgejo/GitHub/GitLab; a Git-backed Markdown workspace on EFS starts from a pattern users know, with zero taxonomy invention needed. **(c)**

## Sources

- https://forgejo.org/docs/next/contributor/architecture/
- https://forgejo.org/docs/latest/admin/storage/
- https://forgejo.org/docs/latest/user/getting-started/wiki/
- https://codeberg.org/forgejo/forgejo/issues/2629
- https://nesbitt.io/2026/02/22/forge-specific-repository-folders.html
- https://github.com/go-gitea/gitea/issues/12074
- https://github.com/go-gitea/gitea/issues/4835
- https://f3.forgefriends.org/
- https://f3.forgefriends.org/compliance.html
- https://nlnet.nl/project/F3-FriendlyForgeFormat/
- https://code.forgejo.org/f3/gof3
- https://codeberg.org/forgejo/discussions/issues/105
- https://forgejo.org/docs/latest/admin/command-line/
- https://forgefed.org/
- https://forgefed.org/spec/
- https://forgejo.org/faq/
- https://forgejo.org/2025-10-release-v13-0/
- https://forgejo.org/2026-01-release-v14-0/
- https://nlnet.nl/project/Federated-Forgejo/
- https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/checking-out-pull-requests-locally
- https://github.blog/changelog/2026-02-19-changes-to-test-merge-commit-generation-for-pull-requests/
- https://docs.github.com/en/migrations/using-ghe-migrator/exporting-migration-data-from-githubcom
- https://docs.github.com/en/rest/migrations/orgs
- https://docs.github.com/en/migrations/using-github-enterprise-importer/migrating-between-github-products/about-migrations-between-github-products
- https://docs.gitlab.com/ee/user/project/settings/import_export.html
- https://www.gerritcodereview.com/notedb.html
- https://gerrit-review.googlesource.com/Documentation/note-db.html
- https://gerrit.googlesource.com/homepage/+/md-pages/docs/Notedb.md
- https://www.gerritcodereview.com/design-docs/support-jujutsu-use-cases.html
- https://docs.jj-vcs.dev/latest/gerrit/
- https://github.com/google/git-appraise
- https://github.com/git-bug/git-bug
- https://github.com/git-bug/git-bug/blob/trunk/doc/design/data-model.md
- https://fossil-scm.org/home/doc/trunk/www/fossil-v-git.wiki
