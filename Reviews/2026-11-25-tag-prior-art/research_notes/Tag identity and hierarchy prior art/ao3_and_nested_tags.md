# Tag identity and hierarchy prior art: AO3 wrangling vs path-in-identity tags

Retrieved 2026-11-25. Code links point at default branches as of that date. Note: archiveofourown.org returned 429 or a Cloudflare challenge for most pages. The Tags FAQ was read through the `insecure.archiveofourown.org` mirror host. I did not try to get past the challenge. The Wrangling Guidelines and admin posts are cited from search snippets only and are marked [snippet].

| System | Is the parent part of identity? | What a rename or reparent costs | Is the user's typed tag rewritten? | Where roll-up is computed |
|---|---|---|---|---|
| AO3 | No. Tags are flat, globally unique names, and parents/synonyms are rows. The fandom qualifier is baked into the *name* ("X (Fandom)") | Synonym, metatag or canonical change: async rebuild of the derived filter table for every affected work, then a search reindex. Only an admin can rename beyond case or accents | Never (narrow exceptions) | At write time: materialized `FilterTagging` rows, indexed as `filter_ids` |
| Stack Exchange | No (flat; hierarchy declined) | Synonym: none retroactively. Merge: rewrites every question | On the next edit, or on a merge | At query time (synonym redirect) |
| Obsidian / Bear | Yes (`#a/b` is literal text) | Every note's text is edited (plugin or app) | Yes, the text itself | At query time, by prefix match |
| Logseq file graphs → DB graphs | Yes → **No** (changed course) | File graph: rename the pages. DB graph: none | — | — |
| Gmail | Name contains "/", id is opaque | Cascade behaviour unverified | No (messages hold label ids) | None: no roll-up |
| Evernote | No (`parentGuid` field) | One tag record | No (notes hold `tagGuids`) | — |
| Danbooru / e621 | No (flat). The qualifier is in the name, e.g. `x_(series)` | Alias: every post re-saved. Implication: matching posts re-saved | Yes | At write time (in the post's tag string) |
| Hydrus PTR | No | One relation row, applied at display time per client | No ("secretly remember[s] A") | At display time, in a ranked per-client order |
| Codidact | No (`parent_id` field) | One field | No | At query time |

## AO3 tag wrangling mechanics, scale and problems

### Takeaway
AO3 keeps every tag exactly as typed. Meaning lives in wrangler-edited relations: canonical flag, synonym (`merger_id`) and many-to-many metatags. These are materialized into a per-work filter table at write time. The model works, but it costs millions of volunteer decisions a year. It also still puts disambiguation inside tag names.

### Cited Findings
- **Typed tags are kept.** The FAQ says that apart from narrow exceptions (language tag, wrong fandom, ToS), "we will never change the tags on a work or bookmark." — [AO3 Tags FAQ](https://archiveofourown.org/faq/tags)
- Tag names are globally unique and case/diacritic-insensitive. The first user's spelling is displayed until a wrangler canonizes the tag. A name reused in another category gets a suffix, e.g. "Buffy the Vampire Slayer - Character". — [FAQ](https://archiveofourown.org/faq/tags); `validates :name, uniqueness: true` in [tag.rb](https://github.com/otwcode/otwarchive/blob/master/app/models/tag.rb)
- **Renaming is restricted.** Ordinary wranglers "can change case and accents but not punctuation or the actual letters". Anything more needs an admin. — [tag.rb `check_synonym`](https://github.com/otwcode/otwarchive/blob/master/app/models/tag.rb)
- **Synonyms.** A tag points to its canonical through `merger_id`. A canonical can't itself be a synonym. Making a tag a synonym moves its parent/child associations and favourite-tag records onto the canonical. — [tag.rb](https://github.com/otwcode/otwarchive/blob/master/app/models/tag.rb)
- **Metatags.** `MetaTagging` links two canonical tags of the same type. Uniqueness applies only per (meta, sub) pair, so a tag can have several metatags. Cycles are blocked ("A metatag can't be its own grandparent"). Inherited metatags are computed by breadth-first search and stored as `direct: false` rows. — [meta_tagging.rb](https://github.com/otwcode/otwarchive/blob/master/app/models/meta_tagging.rb), [inherited_meta_tag_updater.rb](https://github.com/otwcode/otwarchive/blob/master/app/models/inherited_meta_tag_updater.rb)
- **Roll-up happens at indexing time, not search time.** `FilterUpdater` computes direct filters (the canonical tag plus the canonical of any synonym used) and inherited filters (metatags). It writes `FilterTagging` rows, which the code calls "a mirror of the taggings table… connected to canonical tags instead of their synonyms". It then reindexes, as a Resque job. Elasticsearch stores `filter_ids`, and a search is a term filter on them. — [filter_updater.rb](https://github.com/otwcode/otwarchive/blob/master/app/models/filter_updater.rb), [filter_tagging.rb](https://github.com/otwcode/otwarchive/blob/master/app/models/filter_tagging.rb), [work_indexer.rb](https://github.com/otwcode/otwarchive/blob/master/app/models/search/work_indexer.rb), [work_query.rb](https://github.com/otwcode/otwarchive/blob/master/app/models/search/work_query.rb)
- A change to canonical or merger status triggers `update_filters_for_taggables` for every directly tagged work. A metatag change re-filters every work already filtered by the tag. — [tag.rb](https://github.com/otwcode/otwarchive/blob/master/app/models/tag.rb)
- **Disambiguation is written into the name.** Examples: "Merperson Cole Cassidy (Overwatch)" and "The Eagle - Ambiguous Fandom". A bare ambiguous tag such as "Bianca" gets a metatag that collects the fandom-specific Biancas. — [FAQ](https://archiveofourown.org/faq/tags)
- **A policy reversal on franchise wrappers:** "- All Media Types" fandom metatags: "new tags of this type are no longer created, but several still exist". — [FAQ](https://archiveofourown.org/faq/tags)
- **Scale [snippet]:**
  - About 4,944,000 tags were wrangled in 2025, including about 598,000 in December, roughly 1,300 per volunteer. — [Jan 2026 newsletter](https://archiveofourown.org/admin_posts/34226)
  - More than 32 million tags have been wrangled since 2009, and there are over 2.5M canonical tags and 80,000 canonical fandoms. The yearly total rose from about 2M (2017) to more than 5M (2023), then fell slightly. — [Oct 2026 drive post](https://archiveofourown.org/admin_posts/36276)
- **Wrangler numbers [snippet]:** 8 wranglers in 2009, about 140–160 in 2012, about 350 in 2019, and about 400 wranglers plus 30 supervisors and 4 chairs in 2022. In January 2022 they handled more than 540k new tags. — [Fanlore](https://www.fanlore.org/wiki/Synned), [AO3 guideline 17](https://secure.ao3.org/wrangling_guidelines/17)
- **Backlog [snippet]:** One post warned that wrangling could take "up to a month… rather than the usual goal of two weeks" — [admin post 12131](https://archiveofourown.org/admin_posts/12131). No Fandom freeform wrangling was once paused under a moratorium, and support tickets piled up — [Fanlore No Fandom Freeform](https://fanlore.org/wiki/No_Fandom_Freeform). General No Fandom concepts need committee review before they can be canonized — [admin posts tag 29](https://secure.ao3.org/admin_posts?tag=29)
- **Literature:** Bullard's "curated folksonomy" is a regulated layer over free tagging; Price's ISKO paper dates the term to 2014, but a 2026 citation gives 2019 — [Price, ISKO](https://openaccess.city.ac.uk/id/eprint/25151/1/Price_ISKO19_Proof.pdf). The ECSCW 2024 paper by Bullard, Crowston et al. names three tensions: who decides terms, differing needs, and when to intervene between stability and change — [ECSCW 2024](https://citsci.syr.edu/sites/default/files/ECSCW2024_Folksonomy_Crowdsourcing__Final_.pdf)

### Inferences
- **For flat tags plus relations:** relations can be revised without touching anyone's record. Multiple metatags avoid the forced single-parent choice.
- **Against:** AO3 still needed name-level qualifiers, such as "(Fandom)" and the "- Character" suffix, because names are a global unique key. Every relation edit fans out into a derived index rebuild. The human cost, millions of decisions a year, comes from central curation. A ledger without an authority would have to spread that curation out or make it optional.

### Gaps
- The full Wrangling Guidelines text (metatag and disambiguation rules) and backlog counts by year: blocked by rate limiting and the Cloudflare challenge.
- The OTW annual reports were not reached.

## Stack Exchange: hierarchy declined, synonyms adopted

### Takeaway
Stack Exchange chose a flat namespace with synonym redirects and kept hierarchy out. The objections were multiple parents, ambiguity and maintenance. Users kept asking for implication or roll-up.

### Cited Findings
- Jeff Atwood, 2010-08-18, on "Implicit tagging hierarchy" (status-declined): "I don't think adding this kind of complexity would make the tag system better." — [MSE 58073](https://meta.stackexchange.com/questions/58073)
- **Objections raised:**
  - Most tags have more than one plausible parent: C# under .NET or Mono, Apache under Linux or Windows. Rolled-up results would be noise, and maintenance "a nightmare". — [MSE 45438 answer](https://meta.stackexchange.com/questions/45438)
  - Atwood decided against hierarchy on podcast 45 (second-hand). — [MSE 2781](https://meta.stackexchange.com/questions/2781)
- **Counter-proposals for hierarchy as data:**
  - Multi-parent hierarchy kept in the implementation, hidden from askers. — [MSE 45438](https://meta.stackexchange.com/questions/45438)
  - "Clustering tags" that can't be applied directly. — [MSE 45438](https://meta.stackexchange.com/questions/45438)
  - "Implied tags". — [MSE 268228](https://meta.stackexchange.com/questions/268228)
- **How synonyms work:**
  - Suggesting needs 2,500 rep plus an answer score of 5 in the tag. Voting needs an answer score of 5. Auto-approval at +4, deletion at −2. Moderators can act instantly. — [MSE 70710](https://meta.stackexchange.com/questions/70710)
  - Existing questions keep the synonym tag until they are edited, "so that mistakes can easily be reverted".
  - A **merge** retags every question. It is "not (easily) reversible" and moderator-only.
  - Undoing a synonym needs manual retagging of posts edited in the meantime.
- Stack Overflow today has 65,783 tags and 5,332 synonyms. — [SE API](https://api.stackexchange.com/2.3/tags/synonyms?site=stackoverflow&filter=total)

### Inferences
- The lesson that a redirect can be undone but a rewrite can't fits a ledger where records can't be rewritten.
- The multiple-parent objection is evidence against any single-parent path.

## Path-as-identity tags in personal tools (Obsidian, Bear, Logseq)

### Takeaway
When the path is the tag, a rename or move means editing every note's text. Logseq's DB version moved hierarchy out of names for this reason.

### Cited Findings
- **Obsidian:** nested tags are written `#inbox/to-read`, and `tag:inbox` matches all children. The help page documents no built-in rename. — [Obsidian Help](https://obsidian.md/help/tags)
- **Tag Wrangler** (community plugin, 1.1M downloads, v0.6.5):
  - It rewrites every file, front matter included, and renames subtags (`#x/y/z` → `#a/b/z`).
  - It warns the operation is "potentially an irreversible operation" and that sync can leave a partial rename.
  - Merges can't be undone. — [plugin page](https://community.obsidian.md/plugins/tag-wrangler)
- **Bear:** renaming changes "that tag in every note that contains it" — [Bear blog](https://blog.bear.app/2019/05/the-super-big-list-of-tips-for-working-with-tags-and-bear-notes/). Nesting is done by renaming (`tag2` → `tag1/tag2`) — [Bear FAQ](https://bear.app/faq/rename-and-delete-tags/). Renaming a parent dropped the children's icons — [Bear community](https://community.bear.app/t/renaming-parent-tag-removes-tag-icons/6763)
- **Regret and clutter:** Obsidian and Bear users report long nested names as clutter, call 4 levels too much, and consider un-nesting. — [Obsidian forum](https://forum.obsidian.md/t/hiding-the-root-s-of-nested-tags/40886), [Bear community](https://community.bear.app/t/accordion-tags-for-multiple-level-nested-tags/10973)
- **Logseq file graphs:**
  - Renaming a namespace root updated only some children. — [Logseq forum](https://discuss.logseq.com/t/renaming-namespaces-updates-only-some-children-pages/21314)
  - Namespace queries break when a parent is renamed. — [Logseq forum](https://discuss.logseq.com/t/update-namespace-queries-when-renaming-the-page-they-draw-from/11851)
- **Logseq DB graphs (the change of course):**
  - "Namespaced pages no longer have their namespace embedded in their page name… renaming any part of the namespace does not affect all the pages under a namespace."
  - Previously a namespace "could only be done by renaming". — [Logseq db-version-changes.md](https://raw.githubusercontent.com/logseq/docs/master/db-version-changes.md)
  - Tags can have multiple parents through `Extends`. — [db-version.md](https://raw.githubusercontent.com/logseq/docs/master/db-version.md)

### Inferences
- **For path identity:** zero extra records, it reads clearly, and prefix search is free.
- **Against:** rewriting is unavoidable, even in a single-user tool. In a ledger where others' records can't be rewritten, old paths would stay frozen.

## Presentation-only hierarchy (Gmail, Evernote, Notion)

### Takeaway
Where the item references an opaque id, renaming a label rewrites nothing on the items.

### Cited Findings
- **Gmail:**
  - A label has an "immutable ID" and a display `name`. — [Gmail API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels)
  - Nesting is a "Parent/Child" name convention. — [labnol](https://labnol.org/code/19895-create-nested-gmail-labels)
  - Applying `Foo/Bar` does not make a message match `Foo`, so there is no roll-up. — [gmailctl #324](https://github.com/mbrt/gmailctl/issues/324)
  - Moving labels with an admin tool meant relabelling each message. — [GAM group](https://groups.google.com/g/google-apps-manager/c/HpmvN1afSoI)
- **Evernote:** a tag has a service-set `guid`, a case-insensitive unique `name` and an optional `parentGuid`, and the service rejects cycles. Notes hold `tagGuids`. — [Evernote Types](https://dev.evernote.com/doc/reference/Types.html)
- **Notion:** the API cannot rename select options, and pages reference options by id. — [Notion API](https://developers.notion.com/reference/update-property-schema-object)

### Gaps
- Whether renaming a Gmail parent cascades to its children is unverified.
- That Evernote and Notion leave notes untouched on a rename is inferred from the id references.

## Danbooru, e621, Hydrus PTR

### Takeaway
The boorus apply aliases and implications by re-saving every affected post. Hydrus leaves the stored mappings alone and applies siblings and parents at display time, choosing between conflicting sources by each client's own ranking.

### Cited Findings
- **Danbooru alias:** `TagMover` "retags the posts themselves". For each post it runs `remove_tag(old)`, `add_tag(new)` and `save!`, and it also rewrites saved searches, blacklists and wiki links. — [tag_mover.rb](https://github.com/danbooru/danbooru/blob/master/app/logical/tag_mover.rb)
- **Danbooru implication:** every post matching "antecedent -consequent" is re-saved. — [tag_implication.rb](https://github.com/danbooru/danbooru/blob/master/app/models/tag_implication.rb)
- **e621:** rewrites posts and user blacklists, and stores undo snapshots (`tag_rel_undos`) because the rewrite is destructive. — [e621ng tag_alias.rb](https://github.com/e621ng/e621ng/blob/master/app/models/tag_alias.rb)
- **Live counts on 2026-11-25** (highest ids, which include rejected and deleted requests):
  - Danbooru: tag id 2,785,801, alias id 248,294, implication id 260,873, 12,572,511 posts. — [Danbooru API](https://danbooru.donmai.us/counts/posts.json)
  - e621: alias id 87,975, implication id 82,382, post id 6,882,587. — [e621 API](https://e621.net/tag_aliases.json?limit=1)
  - Both run every request through a forum topic and an approver.
- **Hydrus siblings:**
  - Siblings run n→1, are transitive, and can't loop. The client "secretly remember[s] A".
  - On the PTR, sibling and parent petitions need janitor approval. — [Hydrus siblings](https://hydrusnetwork.github.io/hydrus/advanced_siblings.html)
- **Hydrus parents:**
  - Parents run n→n and are virtual: "P is not actually added to every file".
  - Each user ranks which services' siblings and parents apply. — [Hydrus parents](https://hydrusnetwork.github.io/hydrus/advanced_parents.html)
- **PTR scale:** "54 million files have tags". Clients download the whole repository and its history. — [Hydrus PTR](https://hydrusnetwork.github.io/hydrus/PTR.html). One DB+PTR snapshot was about 43.6 GB (2025-11-27). — [HF mirror](https://huggingface.co/awcccc/hydr/tree/main)

### Gaps
- No published PTR counts for mappings, siblings or parents.
- Danbooru moderation hours.

## Hashtags and namespaced tags

### Cited Findings
- Messina's proposal (2007-08-25) offered flat "tag channels" with no owner and no "pre-established groups". The only scoping was `username#tag`. — [factoryjoe.com](https://factoryjoe.com/2007/08/25/groups-for-twitter-or-a-proposal-for-twitter-tag-channels/)
- Flickr machine tags (2007), `namespace:predicate=value`: the namespaces were flat and left to community consensus. — [code.flickr.net](https://code.flickr.net/tag/machinetags/)

### Gaps
- I found no source on hierarchical hashtags on Twitter/X or on why they failed.

## Systems that changed course

### Cited Findings
- **Logseq:** moved from path-in-name to parent-as-data. — [db-version-changes.md](https://raw.githubusercontent.com/logseq/docs/master/db-version-changes.md)
- **Codidact** (a multi-user Stack Exchange-like platform): began with flat tags and later added a single `parent_id` with cycle checks plus separate synonyms. — [qpixel tag.rb](https://github.com/codidact/qpixel/blob/develop/app/models/tag.rb), [Codidact meta](https://meta.codidact.com/posts/278273)
- **AO3:** stopped creating "- All Media Types" wrapper metatags. — [FAQ](https://archiveofourown.org/faq/tags)

### Gaps
- The date of Codidact's change and the reasons for AO3's policy change could not be fetched (403 and rate limits).
