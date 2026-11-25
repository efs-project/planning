# Tag discussion, round 3: permanent links, roll-up, view-all

**Status:** reference: a discussion record with @pm's analysis. One requirement from it is recorded in `Designs/efsv2/owner-rulings.md` (view-all); the rest waits for @james.
**Given:** 2026-11-25, after [[2026-11-25-tag-discussion-round-2]]. Written by a side session of the "EFS v2 Dev PM" session (Fable 5.2).
**Sources checked:** contracts-v2 `docs/DESIGN.md` §4.3 and §10.2 on main; [[owner-rulings]]; the September deep dive (planning commit `c833ecd`, `Reviews/2026-09-09-files-browser-mvp/tag-system-2026-09-10.md`). Outside sources are named where used and are from memory, not re-fetched today.

#status/reference #kind/brief #repo/planning #repo/contracts #repo/sdk #repo/client

## @james's message, verbatim

> You said no renames or moves but that's something crucial for hyperlinks from other places like reddit right? I guess I see the dynamic vs static URLs but would like more exploration of them so I can make a more informed choice. So /cars/tesla/ might break but /129812981287/ will work forever if we treat words as data and IDs are permanent links. Did I sum that up right? So I guess I suggested /cars/tesla/ is permanent which makes sense in my head. What are the alternatives? Pros and cons of them? I'm sure existing tagging systems and research have tackled this so maybe we can glean some good strategies or correct answers.
>
> We could have tags "roll up" easily though right? Someone tagging /cars/tesla/ would just have our contract make an extra /cars/ tag for them. Maybe expensive if it's a deep hierarchy but would solve the problem. Or maybe there's a clever computer science way of doing it like a bloom filter or something. Worst case we could program The Graph to do this roll up probably.
>
> Synonyms merging seems like a combination problem we already have. Searching for /cars/tesla/ && /cars/electric/ would need to merge those two lists into the same view. Might be hard but we already know it's coming. And might be a The Graph locked thing. But hopefully we can show something good naively like using round robin to build the resulting output list from the two tag lists.
>
> Also, I do want "view everything anyone has tagged" is a core use case I want to support. View all /nsfw/ or /cypherpunk/ anyone has every tagged is important for censorship resistance and UX. The lens system keeps things sane but honestly a lot of people are going to want to go to /my/specific/folder/ and just "view all" which seems easy enough for us to implement since we should have a lot of all things tagged with a certain tag.
>
> Did I miss anything? Brainstorm and try to help me. Really tired now. But want to run with this soon.

## 1. Which links are permanent

His summary describes the other model. Under the model ruled in round 2 (the path of words is the identity), `/cars/tesla` **can't break**, because nobody can rename it. "No renames" is the permanence. What is given up is tidying later: if people come to prefer `/vehicles/tesla`, the old link still opens the old topic with everything tagged there, and the two are joined by a statement.

| Option | A link looks like | Who uses it | Good | Bad |
|---|---|---|---|---|
| **1. Words are the address** (ruled) | `/cars/tesla` | web domains, ENS names, Usenet groups | readable; permanent; no lookup; nobody in charge; the parent is a fact, so roll-up is objective | can't fix a typo or reorganize; the same idea at two paths needs a "same as" statement |
| **2. A number is the address, words are labels** | `/129812981287` | Wikidata, Google Drive, Notion, Gmail labels, MeSH | rename, move and translate freely | unreadable; someone must hand out numbers and run the word → number directory, or fifty people mint fifty "tesla"s |
| **3. Number plus words** | `/129812/cars/tesla` | Reddit, Stack Overflow, Discourse | permanent and readable | the same "who hands out numbers" problem; the words can go stale or lie, so the app must correct them |
| **4. Single words; the tree is only a listing** | `/tesla` | hashtags, Danbooru, Hydrus | permanent; the tree can be rearranged freely | ambiguous words need qualifiers; the parent is somebody's opinion, so there is no objective roll-up |

An add-on to option 1, **"moved to" statements**, is what Wikipedia does when a page is renamed and what HTTP redirects and DOIs do. On EFS a redirect is a statement by someone, followed if that someone is in the reader's lens. The old topic's contents don't move; the reader shows both.

**EFS already uses both families.** Files and folders have minted ids (option 2), so they can be renamed and moved, and `~efs/o/<id>` is their permanent link. Topics have word ids (option 1), so they can be found without a directory. Option 3's form could be offered for files later (`~efs/o/<id>/cat.jpg`), where the id resolves and the name is a hint.

**@pm's recommendation: keep option 1 for topics, add "moved to" and "same as" statements, and keep numbers for things people own.** Option 2 fails for topics specifically: with no curator, there is no way to agree which number is "tesla".

## 2. What others learned

- **Tim Berners-Lee, "Cool URIs don't change" (W3C, 1998).** Links break when they contain things that change, and he lists subject classification among them: the breakdown of topics always gets reorganized. Option 1 accepts this by freezing the tree and repairing with statements.
- **The Usenet "Great Renaming" (1987).** A shared, unowned hierarchy of topic names (`net.*` to `comp.*`, `rec.*`, …) was reorganized once, by agreement among the server operators, and it was painful. It is the closest precedent to option 1 at scale: the names worked as Schelling points, and reorganizing needed an authority EFS won't have.
- **MeSH (the medical subject headings).** Each subject has a permanent id and, separately, one or more positions in the tree. The positions change yearly; the ids don't. Searches "explode" down the tree automatically, which is roll-up at read time.
- **Wikidata and SKOS.** An opaque id per concept, labels and aliases per language, and "broader" links as editable statements. It works because one organisation curates the id directory.
- **Danbooru.** Word ids, plus aliases and implications. An implication auto-adds the parent tag when a post is tagged with the child: roll-up at write time. Renames retag every post, which needs a database someone owns (September deep dive §2).
- **Hydrus.** The same features computed at read time over storage that is never rewritten: the shape a ledger can have.
- **Folksonomy research (Golder and Huberman on Delicious, 2006; Sen and others on MovieLens, 2006).** Flat tags suffer from synonyms, ambiguity and different levels of specificity, and a community's vocabulary converges when the interface shows people the tags already in use.

## 3. Roll-up

**Path identity is what makes roll-up practical.** In September the tree was each curator's opinion, so "is nimbus under clouds" depended on the reader, and @james ruled no roll-up on chain (D-A). With path identity, `/cars/tesla` is under `/cars` for everyone, by construction. The contract can act on it.

A sketch for the contracts dev to test, not a design:
- **Registering a topic** publishes one small record `(parent topic, word)`. The id derives from it, anyone can publish it, and publishing twice is harmless. The SDK registers on first use.
- **Tagging** stays one signed statement on the exact topic. The index, not the author, then appends that statement's sequence number to a "this topic and below" list for each ancestor, found by walking the parent pointers.
- **Removal needs no extra writes.** The lists hold statement numbers, and a reader skips statements that are no longer live, as folder listings do today.
- **Cost, estimated:** per ancestor, one storage read plus one list append. Posting lists pack about five entries per storage word (DESIGN §10.2, "0.2/append"), so a few thousand to about 20k gas per level today against about 300k for the tag itself. To be measured on both fee schedules.
- **A depth limit** (say 8 words) bounds the cost and the abuse.
- **Only tags at or above 0 roll up.** "Not a `/cars/tesla`" says nothing about `/cars`.
- **An item tagged under two children** appears twice in the parent's list; the reader removes duplicates.
- **The Graph gets it free:** emit the path words in the event.

A Bloom filter doesn't fit. It answers "is X possibly in this set?" for one X; it can't list the set. The index already uses the structures that can: append-only lists and bitmaps.

Adopting this replaces D-A for path ancestors. D-A stays true for synonyms and any other relation that is somebody's opinion.

## 4. View everything anyone tagged

Recorded as a requirement (owner-rulings, 2026-11-25).

- **As built:** lists are per author. The chain can list every tag on one file by anyone (the backlink list) but not everything anyone tagged with one topic.
- **What it needs:** one list per topic of every tag statement on it, by anyone. This is the "per-concept global posting" (index kind 6) from the pending decision D-D. With roll-up, it is the same "this topic and below" list as §3.
- **Per-lens roll-up** would need a second list per (author, ancestor), or the reader filters the global list by author. For the contracts dev to weigh.
- **Order:** insertion order, which is time order. Newest-first is reading from the end. Ranking needs the Graph or the client.
- **Three views** worth offering: **Mine** (only what the people in my lens tagged), **Everyone** (the global list minus what people in my lens marked below 0), and **Raw** (nothing hidden). "Everyone" is the block-list model of Bluesky labelers and Nostr mute lists. Raw is always available from the chain, which is the censorship-resistance property.
- **Counts are cheap.** A list's length is one read, so "`/cars` · 4,210 items" costs almost nothing. "How many people tagged this item" comes from the backlink list.

## 5. Merging lists (synonyms, OR, AND)

@james is right that synonyms are the same problem as combining tags.

- **OR, and synonyms:** every tag statement has a global sequence number and lists are in that order, so two lists merge exactly in time order with a zipper, with duplicates removed by item. This is better than round robin and needs no Graph.
- **AND:** list the smaller topic and check each item against the other. Fine for modest sizes in a free call. Large sets need the packed bitmap design (TAG-OPTIONS option B) or the Graph.
- **Each synonym costs one more list to read.** A handful is fine.

## 6. What may have been missed

1. **A starter tree and suggestions with counts.** The research says suggestions are what make a vocabulary converge. A seeded top level, plus autocomplete that shows existing topics and how many items each holds, is the main defence against `/car`, `/cars` and `/automobiles`.
2. **Whose "same as" and "moved to" statements are followed by default.** That is the default lens, which is still undecided.
3. **A depth limit** for paths.
4. **Numbers from many people.** In "Everyone", one photo tagged `/nsfw` by a hundred people shows once. Which number is shown (the first, an average, a count of taggers) is the app's choice.
5. **Reserved first words:** homes (`0x…`) and `~efs`.
6. **Qualifiers still help.** Path identity separates `/cars/tesla` from `/people/tesla`, but two meanings under the same parent still need `mercury_(planet)`.

## 7. Additions to the round-2 work order

**Contracts dev:** add to the design PR
- Roll-up as sketched in §3, measured at depths 1, 4 and 8 on both schedules.
- The all-authors list per topic (§4), and whether it and the roll-up list are one structure.
- "Moved to" beside "same as" among the topic statements.
- The topic record `(parent, word)` versus hashing the whole string.

**SDK dev:**
- The zipper merge for OR and synonyms; AND by probing, with a stated size limit.
- The three views of §4 as read options.
- Counts.

**Client dev:**
- The three views, with "Everyone" or "Mine" as the default to be chosen.
- Suggestions with counts when tagging.

## 8. Waiting on @james

1. Keep option 1 (words are the address) for topics, with "moved to" statements? @pm recommends yes.
2. Roll-up on chain, automatic for every tag, replacing D-A for path ancestors? @pm recommends yes once measured.
