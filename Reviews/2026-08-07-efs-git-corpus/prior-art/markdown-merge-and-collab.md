# Merging prose: the wiki-conflict evidence base

**Lane:** merging prose + structured collaboration on text — researched 2026-08-07

Legend used throughout: **[shipped]** = implemented behavior verified in docs/releases; **[intent]** = documented plan/claim; **[rec]** = this lane's recommendation; **[spec]** = speculation.

---

## 1. Git's line-based 3-way merge on prose

**Mechanics.** Git's default `merge` (ort strategy) does a per-file 3-way merge at *line* granularity: base vs ours vs theirs, textually. Two edits that touch different lines auto-merge; two edits touching the same or adjacent lines produce conflict markers. **[shipped]** ([git-merge docs](https://git-scm.com/docs/git-merge))

**Why it fails on prose.** Prose paragraphs are usually hard-wrapped or single-line:

- *Hard-wrapped paragraphs*: inserting one word early in a paragraph reflows every subsequent line of that paragraph, so a semantically tiny edit becomes a many-line diff hunk that collides with any other edit anywhere in the same paragraph. This reflow problem is the classic motivation for "semantic linefeeds" — break lines at clause/sentence boundaries so changes stay isolated to the clause where they occur, an idea Brandon Rhodes traces back to Kernighan's 1974 UNIX troff advice. **[shipped behavior + long-documented practice]** ([Rhodes, "Semantic Linefeeds", 2012](https://rhodesmill.org/brandon/2012/one-sentence-per-line/))
- *One-paragraph-per-line files* (typical Markdown from editors): the entire paragraph is one "line", so **any** two concurrent edits to the same paragraph conflict, and git's diff shows the whole paragraph as changed. Word-level tools (`git diff --word-diff`) fix display but not merge — merge is still line-based. **[shipped]** ([sembr.org](https://sembr.org/) notes exactly this interaction with git diff defaults)

**`merge=union` pitfalls.** `.gitattributes` can set `merge=union`: 3-way file-level merge that, instead of emitting conflict markers, keeps lines from both sides. The git docs themselves warn that added lines can come out in arbitrary order and the user must verify the result; it is only safe for genuinely append-only, order-independent line sets (e.g. some changelog styles). On prose it silently produces duplicated/interleaved sentences with no conflict signal — worse than a conflict for a wiki, because the corruption is invisible. **[shipped + documented warning]** ([gitattributes docs](https://git-scm.com/docs/gitattributes); pitfall discussion in [samwize's Xcode gitattributes writeup](https://samwize.com/2022/05/27/gitattributes-templatefor-xcode-projects/))

**Custom merge drivers.** Plumbing: `.gitattributes` maps a path pattern to `merge=<name>`, and `merge.<name>.driver` in git config supplies a command receiving `%O %A %B` (base/ours/theirs temp files) plus `%L` (conflict-marker size) and `%P` (path); the driver overwrites `%A` and exits 0 for clean merge. **[shipped]** ([gitattributes docs, "Defining a custom merge driver"](https://git-scm.com/docs/gitattributes); walkthrough: [Micek 2020](https://www.gregmicek.com/software-coding/2020/01/13/how-to-write-a-custom-git-merge-driver/))
Critical deployment caveat: **the driver lives in local config, not in the repo**, so it does not travel with clones, and hosting platforms ignore it — GitHub's server-side merge does not honor user `.gitattributes` merge settings (even `merge=union`), a long-open community request; GitLab supports `merge=union` but not arbitrary custom drivers. Any scheme that depends on a custom driver must therefore pin and distribute the driver out-of-band and cannot assume hosted UIs replicate it. **[shipped limitations]** ([GitHub community discussion #9288](https://github.com/orgs/community/discussions/9288), [GitLab issue #17325](https://gitlab.com/gitlab-org/gitlab-foss/-/issues/17325))

**`git rerere`** ("reuse recorded resolution") caches how a user resolved a given conflict hunk and replays it when the identical conflict reappears (long-lived branches, repeated rebases). It is per-clone state (`.git/rr-cache`), off by default, and shares nothing between users — useful for an individual maintainer, not a mechanism for collaborative prose. **[shipped]** ([git-rerere docs](https://git-scm.com/docs/git-rerere))

---

## 2. Semantic/AST/structured merge tools

**Mergiraf** (tree-sitter-based structured merge, Rust, drop-in git merge driver) is the current leading open tool. As of **v0.18.0 (2026-07-14)** it supports 31 programming languages + 13 declarative formats (JSON, YAML, TOML, HTML, XML…), added merging-despite-syntax-errors in v0.17.0 (May 2026), and can be enabled per-path via git attributes. **[shipped]** ([releases](https://codeberg.org/mergiraf/mergiraf/releases), [languages list](https://mergiraf.org/languages.html), [LWN coverage](https://lwn.net/Articles/1042355/))
**Markdown is not among its supported languages** — no prose format is. **[shipped absence]** ([languages](https://mergiraf.org/languages.html)) A structural reason, not just backlog: community discussion around Mergiraf notes tree-sitter grammars are best-effort (built for highlighting), and the maintained [tree-sitter-markdown grammar itself warns](https://github.com/tree-sitter-grammars/tree-sitter-markdown) it has inaccuracies and is "not recommended … where correctness is important" — a poor foundation for a merge tool whose output must be trusted. **[documented intent/caveat]** ([HN thread](https://news.ycombinator.com/item?id=42093756))

**Difftastic** (Wilfred Hughes) is a structural *diff* (display-only, explicitly not a merge tool) using tree-sitter; files without a supported parser fall back to a plain line diff, and word-level display for that fallback is a still-open request. Useful as review UI, not as a conflict resolver. **[shipped]** ([difftastic issue #497](https://github.com/Wilfred/difftastic/issues/497))

**SemanticMerge** (Codice/PlasticSCM's language-aware merge) is effectively dead as a product: standalone licenses can no longer be bought or renewed; the technology was folded into Plastic SCM, which Unity acquired (2020) and rebranded Unity Version Control. **[shipped status]** ([plasticscm.com/semanticmerge](https://www.plasticscm.com/semanticmerge), [Unity VCS](https://unity.com/features/version-control))

**What the research says about structured merge.**
- *Spork* (structured Java merge, formatting-preserving): over 1,740 real merge files, Spork produced conflicts in 125 files / 227 hunks / 2,446 conflicting lines vs JDime's 191 / 376 / 13,975 — structured merge dramatically shrinks conflict volume *within its language* — and its headline contribution is cutting spurious formatting changes by an order of magnitude (structured tools that pretty-print from the AST mangle formatting, the same pathology as pandoc round-tripping, §3). **[research]** ([Spork paper, arXiv:2202.05329](https://arxiv.org/pdf/2202.05329))
- *Evaluation of Version Control Merge Tools* (Schesch, … Ernst, ASE 2024) is the sobering counterweight: with a methodology that actually distinguishes correct from incorrect clean merges (test suites + cost of bad merges), "the results differ significantly from previous claims" — e.g. IntelliMerge is rarely applicable and, when applicable, produces **more incorrect merges than plain git merge**. Silent wrong merges are costlier than conflicts. **[research]** ([abstract](https://homes.cs.washington.edu/~mernst/pubs/merge-evaluation-ase2024-abstract.html), [ACM DL](https://dl.acm.org/doi/10.1145/3691620.3695075))

Net: structured merge is real and beneficial for code with reliable grammars, but (a) nobody ships a trustworthy structured *Markdown* merge in 2026, and (b) the field's own best evaluation warns that cleverer auto-merge trades visible conflicts for invisible incorrectness. **[rec-relevant synthesis]**

---

## 3. Markdown-specific diff, normalization, canonical forms

**Prose-aware diff display** is a solved problem: `git diff --word-diff` (word granularity, shipped in git core), and GitHub's *rendered prose diffs* (source + rendered views for Markdown in commits/PRs, shipped 2014-02-14). These change what reviewers see, not what merges do. **[shipped]** ([GitHub blog](https://github.blog/2014-02-14-rendered-prose-diffs/))

**Pandoc AST round-trip is lossy by design.** Pandoc's manual states its intermediate AST "is less expressive than many of the formats it converts between," so byte-identical round-trips are not a goal: markdown → AST → markdown normalizes wrapping (default `--wrap=auto` reflows to a column width), list markers, emphasis delimiters, escaping, and spacing. Concrete correctness bug, not just byte churn: list items numbered ≥100 with sub-content emit 4-space continuation indents where 5 are required, producing markdown pandoc itself re-reads differently ([issue #5739](https://github.com/jgm/pandoc/issues/5739)). Quantitatively: essentially *every* hand-written file changes bytes on first round-trip; the useful property is that round-trip is **idempotent after the first pass** (a fixed point), which is what makes normalization usable as a canonical form. **[shipped behavior + documented intent]** ([Pandoc manual](https://pandoc.org/MANUAL.html); normalization-as-lint discussion: [pandoc-discuss](https://pandoc-discuss.narkive.com/iRTQE13S/how-to-programmatically-enforcing-a-pandoc-markdown-style))

**CommonMark normalization as canonical form.** [mdformat](https://github.com/hukkin/mdformat) is the strongest current candidate: a CommonMark-compliant, deterministic formatter (markdown-it based; GFM tables/frontmatter via plugins) that by default *validates the rendered HTML is unchanged* by its own formatting — i.e., it guarantees semantic preservation while canonicalizing bytes. Prettier also formats Markdown but has documented bugs that change the AST/rendered HTML (its remark-parse dependency), per mdformat's comparison. **[shipped]** ([mdformat README](https://github.com/hukkin/mdformat/blob/master/README.md), [comparison](https://rumdl.dev/comparison/))
Implication: if a wiki stores only normalized CommonMark (enforced at write time), then (1) hashes are stable under editor round-trips, (2) diffs never show pure-formatting noise, (3) any merge output can be re-normalized before hashing. This is the prose analogue of Spork's formatting-preservation problem, solved by fiat instead of by cleverness. **[rec]**

**Line discipline as merge granularity.** With one-sentence-per-line (semantic line breaks, [sembr.org](https://sembr.org/) spec; CommonMark renders adjacent lines as one paragraph so readers see no difference), plain diff3 merges at *sentence* granularity: concurrent edits to different sentences of the same paragraph auto-merge; only same-sentence edits conflict. This is the cheapest known way to make ordinary git tooling behave sanely on prose — no custom driver, deterministic, verifiable by any stock git. Caveat: mdformat's default keeps line structure but sembr is a *convention*, not enforced by CommonMark; CI must lint it. **[shipped practice + rec]** ([Rhodes](https://rhodesmill.org/brandon/2012/one-sentence-per-line/), [Groenen note](https://nick.groenen.me/notes/one-sentence-per-line/))

---

## 4. CRDT text editing, state of 2026

- **Yjs** remains the production default (~920K weekly npm downloads; largest ecosystem of editor bindings/providers — TipTap, ProseMirror, CodeMirror, BlockNote). Mature, but its rich-text merge semantics predate Peritext-style intent work. **[shipped; download figure from secondary 2026 survey]** ([PkgPulse 2026 comparison](https://www.pkgpulse.com/guides/yjs-vs-automerge-vs-loro-crdt-libraries-2026), [yjs.dev discussion](https://discuss.yjs.dev/t/yjs-vs-loro-new-crdt-lib/2567))
- **Automerge 3.0** (July 2025) rearchitected to use its compressed columnar format at runtime: >10× memory cut (Moby Dick pasted: 700 MB in v2 → 1.3 MB in v3), pathological load 17 h → 9 s, same file format, near-full API compatibility. Automerge keeps **full keystroke-level history with unique IDs per operation** and exposes conflict detection and history review — the most git-like of the CRDTs. [automerge-repo](https://github.com/automerge/automerge-repo) 2.0 supplies storage/network sync. **[shipped]** ([Automerge 3.0 announcement](https://automerge.org/blog/automerge-3/))
- **Loro** is the performance leader with the youngest ecosystem; it implements Peritext-style rich text and Fugue, and is built on event-graph replay (below). **[shipped]** ([Loro rich-text post](https://loro.dev/blog/loro-richtext), [crdt-richtext](https://github.com/loro-dev/crdt-richtext))
- **Correctness caveats that still matter:** naive text CRDTs can interleave concurrently inserted runs (Kleppmann, ["CRDTs: The Hard Parts"](https://martin.kleppmann.com/2020/07/06/crdt-hard-parts-hydra.html)); [Peritext](https://www.inkandswitch.com/peritext/) (Ink & Switch) is the reference design for *intent-preserving* rich-text merge (formatting spans that merge sensibly). **[research]**

**Eg-walker — the CRDT/git bridge.** Gentle & Kleppmann, EuroSys **2025**: store the raw editing *event graph* (a DAG of insert/delete events with parents — explicitly git-like), keep the document itself as a **plain text file with no metadata**, and on merge deterministically *replay/rebase* the DAG into a linear history. Order-of-magnitude wins over prior CRDTs in memory/load and over OT in long-branch merges. This dissolves half of the CRDT-vs-git tension: history is an auditable DAG, state is a plain file, and merge is a deterministic function of the event graph. **[research + shipped in Loro's design]** ([paper, arXiv:2409.14252](https://arxiv.org/abs/2409.14252), [EuroSys version](https://dl.acm.org/doi/10.1145/3689031.3696076), [Loro's explainer](https://loro.dev/docs/concepts/event_graph_walker))

---

## 5. The CRDT-vs-git tension, and hybrid designs

The tension, precisely: git commits are *coarse, intentional, reviewable* snapshots whose merge is a (sometimes failing) heuristic; CRDTs are *fine-grained, automatic, always-converging* but their convergence is defined by type semantics, not author intent — a CRDT never says "conflict," even when humans would. Deterministic replay (same event set ⇒ same state, verifiable by anyone) is the CRDT's gift; *reviewability and refusal* (a merge you can inspect, contest, or reject) is git's. **[synthesis]**

Hybrids that exist:

- **Upwelling** (Ink & Switch, 2023): real-time CRDT collaboration *inside* a draft; drafts are explicit named versions that get reviewed and merged into a "stock" copy — CRDT within the draft boundary, git-like propose/review across it. Built on an Automerge fork with author attribution. **[research prototype]** ([Upwelling essay](https://www.inkandswitch.com/upwelling/))
- **Patchwork** (Ink & Switch, 2024–2025 lab notebook): "universal version control" on Automerge — branches, history, and diffs layered *over* a CRDT substrate, aiming to serve both real-time and async patterns; explicitly continues Upwelling's versioned-writing work. **[research program, ongoing]** ([Patchwork notebook](https://www.inkandswitch.com/patchwork/notebook/), [history & diffs entry](https://www.inkandswitch.com/patchwork/notebook/08/), [Litt on Patchwork](https://buttondown.com/geoffreylitt/archive/towards-universal-version-control-with-patchwork/))
- **Eg-walker** (§4) as substrate: event-graph history + plain-file state means a CRDT session can *terminate in an ordinary git commit of an ordinary text file*, with the event graph retained as evidence. **[research]** ([arXiv:2409.14252](https://arxiv.org/abs/2409.14252))

No shipped mainstream product yet does "CRDT drafting session → signed git commit" end-to-end; the pieces exist separately. **[spec, but well-grounded]**

---

## 6. Wikipedia/MediaWiki's actual concurrent-edit mechanism

- **Automatic merge via GNU diff3.** MediaWiki shells out to diff3 (path configured by [`$wgDiff3`](https://www.mediawiki.org/wiki/Manual:$wgDiff3)) to auto-merge concurrent saves that touch different lines of the wikitext; *without diff3 configured there is no merging at all* and every concurrent save conflicts. So Wikipedia's celebrated "conflicts are rare" experience rests on exactly the same line-based 3-way merge as git — applied to base revision vs. current revision vs. submitted text at save time. **[shipped]** ([Manual:$wgDiff3](https://www.mediawiki.org/wiki/Manual:$wgDiff3), [Help:Edit conflict](https://www.mediawiki.org/wiki/Help:Edit_conflict))
- **On failure: a conflict page, and effectively last-writer-must-merge.** The saver is shown "Someone else has changed this page…", with the *current* text in the top box (only that box gets published) and their own submission below as a diff; they hand-merge and resave. Nothing is queued — the burden falls entirely on the second saver. **[shipped]** ([Help:Edit conflict](https://www.mediawiki.org/wiki/Help:Edit_conflict))
- **Conflict-surface reduction, not resolution cleverness:** section editing (editing one `==section==` at a time) shrinks the collision window; fast save cycles do the rest. **[shipped]**
- **Improved conflict UI:** the [TwoColConflict / "Paragraph-based Edit Conflict Interface" extension](https://www.mediawiki.org/wiki/Special:MyLanguage/Extension:TwoColConflict) (WMDE) shows colliding passages side-by-side paragraph-by-paragraph; beta on all Wikimedia wikis since May 2017, made the default workflow on an initial wiki set in 2020 ([T244863](https://phabricator.wikimedia.org/T244863)). Note it changes the *resolution UI*, not the merge algorithm. **[shipped]**

Lesson for EFS: the world's largest wiki runs on plain diff3 + a good conflict page + small edit granularity — not on semantic merge, OT, or CRDTs. **[synthesis]**

---

## 7. The other pole: centralized OT (Google Docs, Etherpad)

- **Google Docs**: all edits reduce to insert/delete/style ops; a central server transforms concurrent ops (operational transformation) so every replica converges character-by-character. Requires an authoritative server that sees every operation — the design Google chose precisely *because* their server must mediate anyway. **[shipped, primary source 2010; still the architecture]** ([Google Drive blog, "Making collaboration fast"](https://drive.googleblog.com/2010/09/whats-different-about-new-google-docs.html))
- **Etherpad**: its EasySync/Changeset OT engine (retain/insert/delete deltas against a server-ordered revision log) remains the canonical open reference implementation for text OT. **[shipped]** ([Etherpad repo + EasySync docs](https://github.com/ether/etherpad))
- OT's fit for EFS is poor at the trust layer: OT's correctness depends on a single serialization authority — exactly the credibly-neutral-host dependency EFS exists to remove. CRDT/event-graph approaches converge without that authority. **[synthesis]**

---

## 8. Recommendation shape for an EFS wiki **[rec]**

**(a) Same-paragraph conflicts.** Do not chase semantic Markdown merge — nothing trustworthy ships (§2), and ASE 2024 warns clever auto-merge buys silent corruption. Instead shrink the collision unit so stock diff3 works: enforce normalized CommonMark (mdformat-style canonical form, §3) + one-sentence-per-line (sembr) at write time; then plain git merge resolves different-sentence edits in the same paragraph, and genuine same-sentence conflicts surface honestly. Pair with a MediaWiki-grade conflict UI (paragraph-based side-by-side, §6) rather than raw conflict markers. Never `merge=union` for prose.

**(b) Offline edits.** Wikipedia's answer (second saver must merge) is tolerable because edits are small and fast; for genuinely offline/long-lived divergence, the evidence favors the hybrid: CRDT (Automerge 3 / eg-walker-style event graph) *within a draft/session*, terminating in a normal signed commit of the canonicalized plain file — Upwelling/Patchwork's draft-boundary model (§5). The event graph can be retained as an EFS record for provenance without making it the source of truth.

**(c) Deterministic re-verification by ordinary git tooling.** This is the binding constraint and it argues for the boring core: custom merge drivers don't travel with clones and hosts ignore them (§1), so any merge whose *correctness must be re-derivable by third parties with stock git* should be representable as: parent commits + resulting canonicalized blob, checkable with `git merge-file`/diff3 semantics; anything fancier (CRDT replay) must be an *attested sidecar* (record: event graph + claimed result hash) that verifiers *may* replay with a pinned tool version, never a precondition for reading history. Canonical-form-at-write is what makes result hashes stable enough for this to work.

---

## Sources

- https://git-scm.com/docs/gitattributes
- https://git-scm.com/docs/git-merge
- https://git-scm.com/docs/git-rerere
- https://github.com/orgs/community/discussions/9288
- https://gitlab.com/gitlab-org/gitlab-foss/-/issues/17325
- https://www.gregmicek.com/software-coding/2020/01/13/how-to-write-a-custom-git-merge-driver/
- https://samwize.com/2022/05/27/gitattributes-templatefor-xcode-projects/
- https://rhodesmill.org/brandon/2012/one-sentence-per-line/
- https://sembr.org/
- https://nick.groenen.me/notes/one-sentence-per-line/
- https://codeberg.org/mergiraf/mergiraf/releases
- https://mergiraf.org/languages.html
- https://mergiraf.org/architecture.html
- https://lwn.net/Articles/1042355/
- https://news.ycombinator.com/item?id=42093756
- https://github.com/tree-sitter-grammars/tree-sitter-markdown
- https://github.com/Wilfred/difftastic/issues/497
- https://www.plasticscm.com/semanticmerge
- https://unity.com/features/version-control
- https://arxiv.org/pdf/2202.05329
- https://homes.cs.washington.edu/~mernst/pubs/merge-evaluation-ase2024-abstract.html
- https://dl.acm.org/doi/10.1145/3691620.3695075
- https://github.blog/2014-02-14-rendered-prose-diffs/
- https://pandoc.org/MANUAL.html
- https://github.com/jgm/pandoc/issues/5739
- https://pandoc-discuss.narkive.com/iRTQE13S/how-to-programmatically-enforcing-a-pandoc-markdown-style
- https://github.com/hukkin/mdformat
- https://github.com/hukkin/mdformat/blob/master/README.md
- https://rumdl.dev/comparison/
- https://www.pkgpulse.com/guides/yjs-vs-automerge-vs-loro-crdt-libraries-2026
- https://discuss.yjs.dev/t/yjs-vs-loro-new-crdt-lib/2567
- https://automerge.org/blog/automerge-3/
- https://github.com/automerge/automerge-repo
- https://loro.dev/blog/loro-richtext
- https://loro.dev/docs/concepts/event_graph_walker
- https://github.com/loro-dev/crdt-richtext
- https://martin.kleppmann.com/2020/07/06/crdt-hard-parts-hydra.html
- https://www.inkandswitch.com/peritext/
- https://arxiv.org/abs/2409.14252
- https://dl.acm.org/doi/10.1145/3689031.3696076
- https://www.inkandswitch.com/upwelling/
- https://www.inkandswitch.com/patchwork/notebook/
- https://www.inkandswitch.com/patchwork/notebook/08/
- https://buttondown.com/geoffreylitt/archive/towards-universal-version-control-with-patchwork/
- https://www.mediawiki.org/wiki/Manual:$wgDiff3
- https://www.mediawiki.org/wiki/Help:Edit_conflict
- https://www.mediawiki.org/wiki/Special:MyLanguage/Extension:TwoColConflict
- https://phabricator.wikimedia.org/T244863
- https://drive.googleblog.com/2010/09/whats-different-about-new-google-docs.html
- https://github.com/ether/etherpad
