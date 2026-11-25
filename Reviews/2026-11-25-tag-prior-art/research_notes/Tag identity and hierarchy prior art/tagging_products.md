# Tagging products: tag identity, hierarchy, synonyms, renames, roll-up

Research run 2026-11-25 with about 16 tool calls. Several primary pages were blocked (AO3 returned 404/429, Fanlore 403, e621 402, Flickr group 404). Anything not fetched is in Gaps, not Cited Findings.

## 1. How each system defines a tag's identity and treats hierarchy, synonyms and roll-up

### Takeaway
Every system fetched keeps tag identity as a flat string (or string with a delimiter), and puts synonyms and parent/child relations in separate editable data applied at read time. The exception is path-in-the-name systems (Obsidian), where the parent is in the string and roll-up is a read-time prefix match. Nobody fetched stores roll-up as write-time copies except Danbooru implications, which are applied automatically to posts.

### Cited Findings

| System | Identity | Hierarchy | Synonyms | Roll-up (when) | Curator |
|---|---|---|---|---|---|
| Danbooru | name string, with a type (general, copyright, character, artist) | data: implications | data: aliases | implication adds the parent tag to the post automatically | bulk update request, then staff approval |
| Hydrus | tag string, original always retained | data: parent pairs (virtual) | data: sibling pairs (virtual) | read time, virtual | local, or janitors on the PTR |
| Obsidian | string with `/` | in the string | none (not covered) | read time, prefix match | the user |
| Stack Exchange | flat string | none | data: synonym table | n/a | vote of users with reputation |
| OSM | key=value, `:` namespaces | partly in the key string | convention and wiki | none; consumers decide | nobody; wiki and taginfo |
| Flickr machine tags | `namespace:predicate=value` string | in the string | none documented | none documented | the user |
| GitHub topics | flat string | related-topic data (details unverified) | alias data (details unverified) | none | community edits to the explore repo |

**Danbooru**
- An alias sends searches for an alternate name to the main tag. Uses: synonyms, variant spellings, translated copyright names, artists who change their name. [Danbooru help:tag_aliases](https://danbooru.donmai.us/wiki_pages/help:tag_aliases)
- An implication links a tag to a broader tag, e.g. `fate/stay_night` implies `fate_(series)`. It is applied automatically and cannot be overridden, so it should be used only when one tag is "always" tagged with the other. [Danbooru help:tag_implications](https://danbooru.donmai.us/wiki_pages/help:tag_implications)
- Both tags in an implication must be the same type. Character tags do not imply their copyrights. Identical meanings should be an alias, not an implication. Requests go through a bulk update request form. [Danbooru help:tag_implications](https://danbooru.donmai.us/wiki_pages/help:tag_implications)
- The `name_(qualifier)` convention appears in the page's own examples, `fate_(series)`. The page does not state it as a rule. [Danbooru help:tag_implications](https://danbooru.donmai.us/wiki_pages/help:tag_implications)

**Hydrus**
- A sibling pair A->B means that wherever A or B would appear you see B. It is transitive and each tag has one "ideal", with many-to-one allowed. The client remembers the original tag, and removing the pair restores it ("No information is lost at any point"). [Hydrus siblings](https://hydrusnetwork.github.io/hydrus/advanced_siblings.html)
- A parent pair C->P means "All files that have C should also have P, without exception". Parents are not written to files and appear virtually. Loops are forbidden, and multi-generation trees and multiple parents are allowed. [Hydrus parents](https://hydrusnetwork.github.io/hydrus/advanced_parents.html)
- Parents from a higher-priority tag service are used first. [Hydrus parents](https://hydrusnetwork.github.io/hydrus/advanced_parents.html)
- The docs warn against "perfect" hierarchies, because reasonable people disagree on parents and shared servers can cause disputes. They advise creating parents based on what you search for. [Hydrus parents](https://hydrusnetwork.github.io/hydrus/advanced_parents.html)
- Adding parents applies them retroactively to all matching files, which can be thousands of tags and is CPU-intensive. [Hydrus parents](https://hydrusnetwork.github.io/hydrus/advanced_parents.html)
- On a shared repository, each change needs a reason and janitor approval. If approved, all syncing users get the pair. If denied, only you see it. [Hydrus siblings](https://hydrusnetwork.github.io/hydrus/advanced_siblings.html), [parents](https://hydrusnetwork.github.io/hydrus/advanced_parents.html)

**Obsidian**
- `#inbox/to-read` is a nested tag. Searching `tag:inbox` matches `#inbox` and all nested tags. The Bases `file.hasTag("a")` matches `#a` and `#a/b`. Tags are case-insensitive, cannot contain spaces, and must contain at least one non-numeric character. [Obsidian help: tags](https://obsidian.md/help/tags)

**Stack Exchange**
- The 2010 design is flat tags plus community-voted synonyms. `js` and `java-script` auto-remap to `javascript`. A proposed synonym must already appear on at least one question. Tag merging was previously moderator-only. The article does not discuss hierarchy. [Stack Overflow blog, 2010-08-01](https://stackoverflow.blog/2010/08/01/tag-folksonomy-and-tag-synonyms/)
- Per mirrors of the help pages, a synonym is accepted at score 4 and deleted at -2, and the privilege needs 1,250 rep. These are mirror-hosted and dated. [SE privilege mirror](https://backiee.wasmer.app/https_tor_stackexchange_com/help/privileges/suggest-tag-synonyms), [search summary](https://stackoverflow.blog/2010/08/tag-folksonomy-and-tag-synonyms)
- Per a mirrored old Meta analysis: of 500 proposals, 272 were approved (54.4%) and 228 were pending. Most approvals came from moderators, and pending ones were often old. This is unverified against the original post. [Meta mirror](https://file-hippo.netlify.app/host-https-meta.stackexchange.com/q/204244)

**OpenStreetMap**
- "Feel free to invent new tags!" There are no content restrictions. Keys should be lowercase with underscores. "Unilaterally changing the definition of existing tags or keys is not OK". [OSM Any tags you like](https://wiki.openstreetmap.org/wiki/Any_tags_you_like)
- Colon patterns: `tiger:county` (import namespace), `addr:street` (bundled fields), `name:en` (language), `source:name` (attribution). Refinement such as `office=government` plus `government=emergency` keeps schemes backward compatible. [OSM Any tags you like](https://wiki.openstreetmap.org/wiki/Any_tags_you_like)
- Convergence is by documenting on the wiki, checking taginfo, and formal proposals for tags of general interest, uncertain modelling, or changed meaning. The page says other users may later convert your tags to an established scheme. [OSM Any tags you like](https://wiki.openstreetmap.org/wiki/Any_tags_you_like)
- Mass retagging is policed. Mass or scripted edits need a documented wiki plan, community consultation, small first batches, revert data and an opt-out, and ignoring this "will be treated as vandalism". Typos may be fixed without discussion. `surface=chipseal` to `surface=asphalt` counts as a preference and needs discussion. [OSM Automated Edits code of conduct](https://wiki.openstreetmap.org/wiki/Automated_Edits_code_of_conduct)

**Flickr machine tags**
- The form is `namespace:predicate=value`, e.g. `flickr:user=straup`, `geo:locality="san francisco"`. Namespaces and predicates start with a letter and are case-insensitive. [Flickr machine tags doc](https://www.flickr.com/groups/api/discuss/72157594497877875/)

**GitHub topics**
- The explore repo is "community-curated topic and collection pages". Topic files live in `topics/`, with lint tests and CI. I could not verify the alias or related-topic fields. [github/explore](https://github.com/github/explore)

### Inferences
- Hydrus and Danbooru keep identity flat and treat parent/alias as revisable overlays. Hydrus makes the overlay explicitly per-service and non-destructive, which is closest to the per-reader overlay model. Danbooru's implication, once approved, mutates posts, so it is a shared curated layer, not a reader overlay.
- Obsidian is the only fetched case of a parent inside the identity. Roll-up works by prefix match with no curation, and the page says nothing about rename.
- Every system with synonyms needs some arbiter (staff, janitors, reputation vote). None resolves disagreement without one.

### Gaps
- Danbooru and e621 scale (tag, alias and implication counts), the retroactive-application mechanism, the approver workload, and named disputes. The help pages are silent, and e621 returned 402.
- Gelbooru was not researched.
- Hydrus PTR scale (tag, mapping and sibling/parent counts) and cross-service conflict resolution beyond "priority". The docs fetched did not cover it.
- OSM taginfo usage statistics and a concrete deprecated-but-persistent tag example. Not fetched.
- Gmail nested labels and Evernote stacks, Bear and Logseq behaviour, rename semantics, and Twitter hashtag origin. Not researched. I have unsourced recollection only: Gmail nested labels are just names containing `/`, and renaming a parent label does not rename children. Treat this as unverified.
- GitHub topic alias and related-topic mechanics.

## 2. AO3 wrangling and Stack Exchange hierarchy requests

### Takeaway
AO3's model (free tags never rewritten, canonical and synonym layers added by volunteers) is the closest precedent for "overlay curation". Published numbers are thin and I could only reach search snippets. For Stack Exchange I found no sourced reason hierarchy was declined.

### Cited Findings
- Search results report about 160 tag wranglers in an undated AO3 admin post. The same results show a 2019 AO3 News post saying about 194,000 tags were handled in November and about 238,000 in December, and that new tags took up to a month against a two-week goal. These are search-engine summaries and I did not open the posts. [AO3 admin post 267](https://secure.ao3.org/admin_posts/267), [admin posts list](https://secure.ao3.org/admin_posts?tag=29)
- A third-party estimate says users created about 1.9 million AO3 tags. It is not official data. [York U thesis](https://yorkspace.library.yorku.ca/bitstreams/73b307d9-50e6-4cb5-aef9-150271760c8d/download)
- The Tag Wrangling Committee says unwrangled tags still work in search and filters, so the backlog is less critical than it looks. This is a summary of AO3 posts and unverified. [AO3 admin posts](https://secure.ao3.org/admin_posts?tag=29)
- Stack Exchange policy on meta-tags is stated in Atwood's "The Death of Meta Tags", quoted at PhysicsOverflow. Tests: does the tag work as the only tag, and does it mean different things to different people. This is not a hierarchy decision. [PhysicsOverflow quote](https://www.physicsoverflow.org/3499/no-meta-tags-please)
- Codidact does support parent/child tags, e.g. `mysql` under `sql`, so tagging `mysql` surfaces in an `sql` search. [Codidact thread](https://software.codidact.com/posts/279027)

### Inferences
- AO3's claim that unwrangled tags still filter implies the system degrades gracefully with no curation. That fits an append-only setting, but it comes from AO3's own statements, not from independent evidence.

### Gaps
- AO3 guideline text on canonical, synonym, metatag and subtag, and exactly how filtering rolls up through metatags. The guideline page 404'd.
- Current wrangler count, current backlog, and any post-mortem.
- The Stack Overflow Meta threads declining hierarchy. Search found none.
- AO3 Tagging Policy Debate on Fanlore. It appeared in results (https://fanlore.org:443/wiki/AO3_Tagging_Policy_Debate) but I did not read it.

## 3. Regrets and reversals

### Takeaway
I found no sourced case of a product that put the parent into identity and reversed it, or the reverse. The closest sourced signals are Hydrus's warning against shared hierarchies and OSM's policy on retagging.

### Cited Findings
- Hydrus: reasonable people disagree on what counts as a parent, and parents on shared servers can cause disputes. [Hydrus parents](https://hydrusnetwork.github.io/hydrus/advanced_parents.html)
- OSM: because tags are identity, fixing a wrongly chosen value is a policed mass edit needing community consensus. [OSM Automated Edits](https://wiki.openstreetmap.org/wiki/Automated_Edits_code_of_conduct)
- Stack Overflow: tag creation rep rose from 250 to 1,500 and merging was moderator-only before synonyms. This shows an earlier free-for-all needing correction, not a hierarchy reversal. [SO blog 2010](https://stackoverflow.blog/2010/08/01/tag-folksonomy-and-tag-synonyms/)

### Inferences
- Flat-identity systems repair mistakes by adding alias or parent data. Identity-in-string systems (OSM, Obsidian) repair them by rewriting existing records, which is easy for a single-user vault and politically costly in OSM. A ledger where records cannot be rewritten has only the first option.
- Evidence for the path form: Obsidian shows prefix roll-up needs no curation layer. Evidence against: OSM's retagging policy shows the cost when a path-like key later proves wrong.

### Gaps
- Evernote, Gmail, Bear and Logseq reversals, and any "regret" post-mortem. Not found in this run.
