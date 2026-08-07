# Git-backed wikis and the Wikipedia editing model — the UX evidence base

**Lane:** Git-backed wiki systems and the Wikipedia editing model — researched 2026-08-07

Evidence tiers used below: **(a)** implemented/shipped behavior, **(b)** documented intent, **(c)** recommendation, **(d)** speculation.

## 1. Gollum and GitHub wikis

### Architecture (a)
- Gollum is a Ruby/Sinatra wiki where "wikis are simply Git repositories that adhere to a specific format": pages are human-editable markup files (Markdown, AsciiDoc, RST, Creole, MediaWiki markup, org, etc.), organized in arbitrary directories; every web edit is a git commit; the repo can equally be edited with a text editor and pushed ([gollum/gollum README](https://github.com/gollum/gollum/)). GitHub's wiki feature began as Gollum and remains format-compatible: every GitHub wiki is a clonable `*.wiki.git` repo, and Gollum "strives to be compatible with GitHub and GitLab wikis" ([gollum README](https://github.com/gollum/gollum/), [Wikipedia: Gollum](https://en.wikipedia.org/wiki/Gollum_Wiki)).
- Page identity = file path minus extension: `/mordor/Sauron.md` is page "mordor/Sauron". `[[wikilinks]]` resolve relative to the linking page's directory first; `--lenient-tag-lookup` allows first-match-anywhere resolution; extension can be given to disambiguate (`[[Bilbo Baggins.md]]`) ([gollum wiki docs](https://github.com/gollum/gollum/wiki)).
- Renames (a): Gollum 5+ writes a `.redirects.gollum` YAML file mapping old paths to new paths, so old URLs redirect — i.e., **even the flagship git-wiki needed an out-of-band redirect table because git renames don't preserve page identity** ([gollum wiki docs](https://github.com/gollum/gollum/wiki)).
- Maintenance status (a): alive but slow — latest release v6.1.0, 2024-12-23 (Mermaid 11.4, small fixes); v6.0.0 2024-05-03 ([releases](https://github.com/gollum/gollum/releases)).

### Concurrency (a)
- Gollum has no merge UI. It detects edit collisions and shows an alert telling the user to **copy their text out of the browser, reload, and re-apply it manually**; a request for real merge functionality is an open issue ([gollum#1351](https://github.com/gollum/gollum/issues/1351)). This is the canonical failure mode of "git wiki without a merge story."

### Why GitHub wikis are considered weak (a/evidence of sentiment)
- Widely cited critique "The GitHub wiki is an anti-pattern" (2022-01-23): wiki content doesn't version with code (can't read docs for an old release), isn't present in a clone of the repo (must separately clone the hidden `*.wiki.git`), edits **bypass pull-request review entirely**, no CI/Actions (no lint, no link check), no familiar tooling, minimal customization, weak image handling. The one conceded benefit: one-click access from the repo page ([michaelheap.com](https://michaelheap.com/github-wiki-is-an-antipattern/)).
- Search invisibility (a): GitHub serves most wikis with `x-robots-tag: none`, so they are not indexed by search engines; a community discussion to lift this has been open since 2022, and a third-party proxy (github-wiki-see.page) exists solely to make GitHub wikis googleable — its mirrored links are tagged `rel="nofollow ugc"` explicitly to avoid "promot[ing] mass vandalism of GitHub Wikis" ([github-wiki-see.page](https://github-wiki-see.page/), [community discussion #4992](https://github.com/orgs/community/discussions/4992), [isaacs/github#1683](https://github.com/isaacs/github/issues/1683)).
- Permissions are all-or-nothing (a): by default only repo collaborators can edit a public repo's wiki; the only alternative is a checkbox opening editing to **any GitHub account** ([GitHub docs](https://docs.github.com/en/communities/documenting-your-project-with-wikis/changing-access-permissions-for-wikis)). There is no "propose an edit" middle path — no PRs against wikis. This is the single most relevant gap for EFS: GitHub's own wiki lacks portable proposals, so drive-by contributors either get full write or nothing.
- Additional recurring complaints: "practically no version history [in the UI], you can only edit and see the source for the current revision" and no review flow ([arantius rant](https://rants.arantius.com/github-sucks), [BugHerd survey of complaints](https://bugherd.com/blog/building-a-better-github-wiki)). Reverting a wiki page in practice means cloning the wiki repo and force-editing.

## 2. Gitit and Wiki.js

### Gitit (a)
- Haskell wiki by John MacFarlane (pandoc author): "a wiki backed by a git, darcs, or mercurial filestore"; pages modifiable via web UI **or directly via VCS command line**; pandoc gives multi-format authoring/export ([jgm/gitit](https://github.com/jgm/gitit), [Hackage](https://hackage.haskell.org/package/gitit)). Still packaged: gitit 0.16 appears in Stackage nightly 2026-06-29 ([Stackage](https://www.stackage.org/nightly-2026-06-29/package/gitit-0.16)), but development is low-activity (small issue/PR volume, long-open PRs) ([issues](https://github.com/jgm/gitit/issues)).
- Design lesson (c): gitit proves the "repo is the database, web UI is just one client" model works technically for small wikis; it never grew Wikipedia-class moderation, watch, or review features — those live in a social layer git doesn't provide.

### Wiki.js git sync (a — and a warning)
- Wiki.js is DB-backed; git is a **storage/sync module**, "bi-directional," syncing on a timer (default every 5 minutes), requiring a repo dedicated to Wiki.js (no subfolder/submodule) ([Wiki.js git docs](https://docs.requarks.io/storage/git), [storage overview](https://docs.requarks.io/storage)).
- The docs document **no conflict-resolution policy at all** for divergent DB-vs-remote edits, and no rename story ([wiki-docs source](https://raw.githubusercontent.com/requarks/wiki-docs/master/storage/git.md)). Community threads show the seams: home page in DB vs `Home.md` in git diverge with commits silently not created ([requarks/wiki discussion #7959](https://github.com/requarks/wiki/discussions/7959)); syncs get "stuck" and the documented remedies are "Purge Local Repository" + "Force Sync" + "Add Untracked Changes" buttons ([discussion #6655](https://github.com/requarks/wiki/discussions/6655), [discussion #5074](https://github.com/requarks/wiki/discussions/5074)); attribution of git committer to the wiki editor is a long-open ask ([discussion #7274](https://github.com/requarks/wiki/discussions/7274)).
- Lesson (c): **dual-source-of-truth (DB + git) is the worst of both worlds** — users get git's failure modes without git's guarantees. Either git is the datastore (gollum/gitit) or it isn't; timer-based bidirectional sync produces silent divergence.

### Outline/Notion-class comparison (c)
- The tools that displaced wikis for team docs (Notion, Outline, Confluence-class) won by removing versioning from user view entirely: real-time collaborative editing, implicit history, comments-in-place. None expose merge or commit concepts. That is the UX bar a git-backed wiki competes against; version control must be invisible until a user asks for provenance.

## 3. Obsidian/Logseq git sync — what breaks when normal users touch git (a)

- The obsidian-git plugin is the standard way to git-sync a vault; on mobile it must use **isomorphic-git (JS reimplementation)**: everything runs in app memory, so large vaults/long histories get slow then fail (crashes on clone/pull, buffer overflows, indefinite hangs); no SSH auth (HTTPS+PAT only); no git-lfs; the maintainer's own guidance is to stage files individually on big repos ([Vinzent03/obsidian-git](https://github.com/Vinzent03/obsidian-git), [mobile implementation notes](https://deepwiki.com/Vinzent03/obsidian-git/3.2-mobile-implementation), [2026 sync guide](https://www.stephanmiller.com/sync-obsidian-vault-across-devices/)).
- App-state churn: `.obsidian/workspace.json` / `workspace-mobile.json` record open-tab state and conflict constantly across devices; the community's standard fix is gitignoring app state, and a feature request to make the workspace file "git friendly" has been open since 2021 ([Obsidian forum FR](https://forum.obsidian.md/t/refactor-workspace-file-to-be-git-friendly/31717), [conflict help thread](https://forum.obsidian.md/t/help-to-resolve-the-conflict-not-a-file-obsidian-workspace-json/76087)).
- When conflicts do occur, users are dropped into raw `<<<<<<<` marker editing inside their notes app; guides teach 10–15-minute auto-commit intervals precisely to shrink conflict windows ([sudoself guide](https://www.sudoself.dev/blogs/obsidian-git-sync/), [ahmorris guide](https://ahmorris.org/posts/obsidian-git/)).
- Lessons (c): (1) sync frequency is a conflict-avoidance parameter — frequent tiny commits, not clean semantic commits, is what actually keeps lay users out of trouble; (2) derived/ephemeral state must never share a history with content; (3) any client that reimplements git in a constrained runtime (mobile/browser) hits memory walls on realistic histories — directly relevant to an EFS web client contemplating in-browser git.

## 4. MediaWiki / Wikipedia: the reference revision model (a throughout)

### Revision storage semantics
- `revision` table: `rev_id` (monotonic PK, **preserved across page deletion/undeletion**), `rev_parent_id` (previous revision; 0 for page creation — history is a parent-linked chain), `rev_sha1` (base-36 content hash; since 1.32 a nested hash over all content slots), `rev_comment_id` (edit summary), `rev_actor` (who), `rev_minor_edit`, `rev_len`. Content lives in `slots`/`content` tables (Multi-Content Revisions) ([Manual:Revision table](https://www.mediawiki.org/wiki/Manual:Revision_table)).
- **Visibility is a mutable bitfield on an immutable revision**: `rev_deleted` with DELETED_TEXT=1, DELETED_COMMENT=2, DELETED_USER=4, DELETED_RESTRICTED=8 — text, edit summary, and author identity can each be independently hidden, and bit 8 escalates hiding to oversighters-only ([Manual:Revision table](https://www.mediawiki.org/wiki/Manual:Revision_table)). This is the load-bearing design fact for EFS: Wikipedia never rewrites history; it **re-scopes read access to parts of specific revisions**.

### Vandalism, libel, doxxing in history
- Two-tier redaction: **Revision deletion** (admins) hides a revision's text/summary/username from the public but the redacted entry remains visible in history and any admin can see/undo it. **Suppression (oversight)** is "functionally identical" but restricts viewing to oversighters/stewards/WMF — used as "a tool of first resort" for personal data (addresses, phone numbers, identities of pseudonymous users) and for "potentially libelous information" ([WP:Revision deletion](https://en.wikipedia.org/wiki/Wikipedia:Revision_deletion), [WP:Oversight](https://en.wikipedia.org/wiki/Wikipedia:Oversight), [Oversight FAQ](https://en.wikipedia.org/wiki/Wikipedia:Oversight/FAQ)). The decision rule: suppress only when even admins shouldn't see it; otherwise revdel ([WP:Requests for oversight](https://en.wikipedia.org/wiki/Wikipedia:Requests_for_oversight)).
- Implication for EFS (c): a permanent, public-by-default record store cannot reproduce suppression by deletion; the only equivalent lever is **default-client non-resolution** (lens-level hiding) plus keeping the doxxing payload off the canonical layer in the first place. Wikipedia's experience says this lever gets used routinely, not exceptionally.

### Edits, summaries, watchlists, reverts
- Every edit carries an optional **edit summary** stored with the revision and shown in history/watchlists; summaries are the primary social signal of intent ([Manual:Revision table](https://www.mediawiki.org/wiki/Manual:Revision_table)).
- **Watchlists** notify editors of changes to chosen pages; combined with Recent Changes patrolling they are the actual vandalism-detection mechanism — review is *post hoc* by default, not gatekeeping ([Help:Watchlist](https://en.wikipedia.org/wiki/Help:Watchlist)).
- **Undo vs rollback**: undo generates an inverse edit of one revision and lets the user edit/summarize before saving (three-way merge against current text; fails if intervening edits conflict — see `wfMerge()` note below). **Rollback** is a one-click right (~7,000 rollbackers + ~800 admins on enwiki) reverting the most recent edit *plus all immediately preceding consecutive edits by the same editor*, auto-summarized, auto-minor, permitted essentially only for obvious vandalism ([WP:Rollback](https://en.wikipedia.org/wiki/Wikipedia:Rollback)). Lesson (c): high-trust users get cheaper reverts; the revert itself is just another appended revision.

### Concurrent editing: how MediaWiki merges, and how often it matters
- On save, MediaWiki knows the base revision the editor started from. If the page moved on, it attempts an automatic **three-way merge using diff3 semantics** (`wfMerge()` in GlobalFunctions.php); it "will automatically merge edits that touch unrelated parts of a page, and will only trigger an edit conflict if multiple users attempt to edit the same lines" ([Help:Edit conflict](https://www.mediawiki.org/wiki/Help:Edit_conflict), [API talk:Changing wiki content](https://www.mediawiki.org/wiki/API_talk:Changing_wiki_content)). On failure the user gets a two-box conflict page (current text + their diff) and must merge by hand; self-conflicts occur under save latency ([Help:Edit conflict](https://www.mediawiki.org/wiki/Help:Edit_conflict)).
- Frequency evidence (thin but real): fixing edit-conflict UX was **wish #1 (39 votes) in the 2015 German-community Technical Wishes survey**; WMDE shipped a two-column conflict resolver (default on de/ar/fa wikis since 2020-03-25, talk-page variant 2020-06-24) and then **stopped work, judging the interface unfixable without fundamental rework** ([WMDE Technical Wishes/Edit Conflicts](https://meta.wikimedia.org/wiki/WMDE_Technical_Wishes/Edit_Conflicts), [phab T139601](https://phabricator.wikimedia.org/T139601)). A Grafana dashboard tracks live conflict counts ([T139601](https://phabricator.wikimedia.org/T139601)).
- Same-paragraph contention is heavily skewed, not uniform: <1% of Wikipedia pages are "controversial," conflict/revert activity concentrates on that tail, and revert fractions are dramatically higher inside high-conflict page subspaces than across the encyclopedia ([Yasseri et al., PLOS ONE 2012](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0038869), [Sumi et al., edit wars](https://arxiv.org/pdf/1107.3689), [DeDeo, FSM analysis](https://arxiv.org/pdf/1512.04177)). (c) Design consequence: optimistic line-level merge + manual fallback is sufficient for the bulk of pages; the hard cases are social (edit wars), not algorithmic, and are handled by protection/reverts, not merge tooling.
- **Pending changes / flagged revisions**: for protected pages, edits by new/unregistered users go live only after a reviewer accepts them; anonymous readers see the latest *accepted* revision while logged-in users see the newest ([WP:Pending changes](https://en.wikipedia.org/wiki/Wikipedia:Pending_changes)). Level 2 (review required for all non-reviewers) was abandoned by community consensus — only level 1 survives ([WP:Pending changes](https://en.wikipedia.org/wiki/Wikipedia:Pending_changes)). Protection levels (semi/extended-confirmed/full) throttle *who may write*, orthogonally to review ([WP:Protection policy](https://en.wikipedia.org/wiki/Wikipedia:Protection_policy)). Lesson (c): Wikipedia's moderation = **default-open writes + per-page escalating gates + read-side selection of "accepted" revision** — a lens-selectable "accepted head" per page, which maps cleanly onto EFS-style read policies.

## 5. Decentralized wiki attempts and what failed

### Everipedia → IQ.wiki (a)
- Founded Dec 2014 (UCLA) as a Wikipedia fork; $30M raise Feb 2018 (Galaxy/EOS fund); launched on EOS 2018-08-09 with the IQ token — editors stake IQ, "if their contribution is accepted, the user gets back the token"; Larry Sanger CIO Dec 2017, resigned Oct 2019; moved to Polygon (gasless signature recording) by 2022; **the general encyclopedia was converted to a read-only archive in Oct 2022** and replaced by crypto-only IQ.wiki ([Wikipedia: Everipedia](https://en.wikipedia.org/wiki/Everipedia), [IQ.wiki about](https://iq.wiki/about)).
- Failure modes documented: content was overwhelmingly scraped Wikipedia copies plus vanity pages; Molly White (2022): "a graveyard of content they've just scraped off Wikipedia, articles that people have written about themselves, and, increasingly, crypto spam"; misidentified innocent people during breaking-news events (2017 Las Vegas shooting) ([Wikipedia: Everipedia](https://en.wikipedia.org/wiki/Everipedia)). Lesson (c): token incentives + weak notability standards recruited spam, not editors; "on the blockchain" stored signatures/pointers, not the editorial community that makes a wiki credible.

### NIP-54 / Wikifreedia on nostr (a/b)
- NIP-54 (merged into nostr NIPs) defines wiki articles as addressable `kind:30818` events with normalized-lowercase `d` tags as article identifiers; **multiple articles per subject by different authors coexist by design**, ranked client-side via reactions, relay lists, and follow-graph ("web of trust"); `kind:818` merge requests ask another author to pull your version; a `defer` marker lets an author point to a better version; `kind:30819` redirects handle naming; content is Asciidoc/Djot with `[[wikilinks]]` ([NIP-54](https://github.com/nostr-protocol/nips/blob/master/54.md), [PR #787](https://github.com/nostr-protocol/nips/pull/787)).
- Wikifreedia (fiatjaf) is the proof-of-concept client ([nobsbitcoin coverage](https://www.nobsbitcoin.com/introducing-wikifreedia/), [nostrapps listing](https://nostrapps.com/wikifreedia)). No evidence of significant article volume or sustained editing community was found as of 2026-08 (absence of evidence, noted as such). Lesson (c): NIP-54's "no canonical article, reader's trust graph picks the version" is the purest existing design for credibly neutral wikis without global consensus — and its adoption problem suggests per-author forks without a strong default view fragment readership.

### Wikipedia-on-IPFS (a)
- IPFS distributed Wikipedia mirror (started 2017 after Turkey blocked Wikipedia; updated 2021 with en/tr/my/ar/zh/ru snapshots via Kiwix ZIM) is **read-only snapshot mirroring**, not collaborative editing; the project's own blockers were snapshot production/update reliability ([IPFS blog update](https://blog.ipfs.tech/2021-05-31-distributed-wikipedia-mirror-update/), [repo](https://github.com/ipfs/distributed-wikipedia-mirror)). Lesson (c): censorship-resistant *reading* is a solved, useful, and much easier problem than censorship-resistant *editing* — worth separating in EFS's design.

## 6. Structured lessons for a git-backed EFS wiki (c unless noted)

**What must be hidden from users (evidence-backed):**
1. Merge conflicts in raw-marker form — Obsidian drops users into `<<<<<<<` markers, Gollum tells users to copy-paste their work out of the browser; both are documented UX failures (§1, §3). MediaWiki's bar: auto-merge silently when lines don't overlap; show a purpose-built two-box/two-column UI when they do; expect that UI to be your hardest, least-finishable feature (WMDE gave up on theirs, §4).
2. Commit mechanics — every successful system makes "save = commit with edit summary" atomic and invisible (gollum, gitit, MediaWiki). Sync timers and manual push/pull (Wiki.js, obsidian-git) are where corruption and divergence live.
3. Identity/attribution plumbing — Wiki.js can't even map wiki editor → git committer cleanly (§2); EFS's signed-record model natively fixes this (b: EFS intent).

**Where git's file model fights wiki needs (a, from this corpus):**
- **Renames**: page identity ≠ file path; gollum needed `.redirects.gollum`, MediaWiki has first-class moves with auto-redirects and preserved `rev_id` history. A wiki needs stable page IDs with paths as mutable labels.
- **Redlinks**: MediaWiki links-to-nonexistent-pages are first-class (render red, invite creation); git has no representation of a link target that doesn't exist — requires an index built over content.
- **Transclusion/templates and categories**: MediaWiki pages compose other pages at render time and self-organize via category tags; a git file model needs a derived index layer for both (gollum has neither; gitit has neither). These are read-side/lens concerns, not storage concerns.
- **Per-page history UX**: git history is repo-global; per-page history, per-page watch, and per-page protection are the units Wikipedia editors actually operate on.
- **App/derived state**: must be excluded from the canonical history (Obsidian workspace.json evidence, §3).

**Concurrency reality (a):** same-line concurrent edits are rare outside a <1% controversial tail; line-level three-way merge with manual fallback has served Wikipedia since inception; reverts (social conflict), not merge failures (technical conflict), dominate. Git's diff3 machinery is therefore *sufficient* mechanically — the missing pieces are the social layer: summaries, watchlists, cheap reverts, escalating protection, and read-side "accepted revision" selection.

**The one thing git-hosting forges never built (a):** proposal flows for wikis. GitHub wikis are binary (collaborators-only or world-writable, no PRs, §1). A git-backed wiki with **portable, first-class proposals against pages** would be differentiated against every system in this corpus.

**The redaction problem is mandatory, not optional (a):** Wikipedia uses revdel/suppression routinely for doxxing and libel while keeping history append-only — hiding is metadata over immutable revisions (§4). A permanent store must ship the equivalent lens-level lever on day one or it will host doxxing it can never remove.

## Sources

- https://github.com/gollum/gollum/
- https://github.com/gollum/gollum/wiki
- https://github.com/gollum/gollum/releases
- https://github.com/gollum/gollum/issues/1351
- https://en.wikipedia.org/wiki/Gollum_Wiki
- https://michaelheap.com/github-wiki-is-an-antipattern/
- https://rants.arantius.com/github-sucks
- https://bugherd.com/blog/building-a-better-github-wiki
- https://github-wiki-see.page/
- https://github.com/orgs/community/discussions/4992
- https://github.com/isaacs/github/issues/1683
- https://docs.github.com/en/communities/documenting-your-project-with-wikis/changing-access-permissions-for-wikis
- https://github.com/jgm/gitit
- https://hackage.haskell.org/package/gitit
- https://www.stackage.org/nightly-2026-06-29/package/gitit-0.16
- https://docs.requarks.io/storage/git
- https://docs.requarks.io/storage
- https://raw.githubusercontent.com/requarks/wiki-docs/master/storage/git.md
- https://github.com/requarks/wiki/discussions/7959
- https://github.com/requarks/wiki/discussions/6655
- https://github.com/requarks/wiki/discussions/5074
- https://github.com/requarks/wiki/discussions/7274
- https://github.com/Vinzent03/obsidian-git
- https://deepwiki.com/Vinzent03/obsidian-git/3.2-mobile-implementation
- https://www.stephanmiller.com/sync-obsidian-vault-across-devices/
- https://forum.obsidian.md/t/refactor-workspace-file-to-be-git-friendly/31717
- https://forum.obsidian.md/t/help-to-resolve-the-conflict-not-a-file-obsidian-workspace-json/76087
- https://www.sudoself.dev/blogs/obsidian-git-sync/
- https://ahmorris.org/posts/obsidian-git/
- https://www.mediawiki.org/wiki/Manual:Revision_table
- https://www.mediawiki.org/wiki/Help:Edit_conflict
- https://www.mediawiki.org/wiki/API_talk:Changing_wiki_content
- https://meta.wikimedia.org/wiki/WMDE_Technical_Wishes/Edit_Conflicts
- https://phabricator.wikimedia.org/T139601
- https://en.wikipedia.org/wiki/Wikipedia:Revision_deletion
- https://en.wikipedia.org/wiki/Wikipedia:Oversight
- https://en.wikipedia.org/wiki/Wikipedia:Oversight/FAQ
- https://en.wikipedia.org/wiki/Wikipedia:Requests_for_oversight
- https://en.wikipedia.org/wiki/Wikipedia:Rollback
- https://en.wikipedia.org/wiki/Help:Watchlist
- https://en.wikipedia.org/wiki/Wikipedia:Pending_changes
- https://en.wikipedia.org/wiki/Wikipedia:Protection_policy
- https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0038869
- https://arxiv.org/pdf/1107.3689
- https://arxiv.org/pdf/1512.04177
- https://en.wikipedia.org/wiki/Everipedia
- https://iq.wiki/about
- https://github.com/nostr-protocol/nips/blob/master/54.md
- https://github.com/nostr-protocol/nips/pull/787
- https://www.nobsbitcoin.com/introducing-wikifreedia/
- https://nostrapps.com/wikifreedia
- https://blog.ipfs.tech/2021-05-31-distributed-wikipedia-mirror-update/
- https://github.com/ipfs/distributed-wikipedia-mirror
