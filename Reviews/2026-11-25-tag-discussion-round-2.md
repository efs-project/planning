# Tag discussion, round 2: @james's direction and @pm's reply

**Status:** reference: a discussion record. **Outcome (same day):** @james answered, and T-1–T-5 are recorded in `Designs/efsv2/owner-rulings.md` under 2026-11-25. He chose path identity (S1) over @pm's recommendation. His second reply and the overnight work order are at the end.
**Given:** 2026-11-25. @james replied to [[2026-11-25-tag-questions-explained]]; this is his reply and @pm's analysis of it (a side session of the "EFS v2 Dev PM" session, on Fable 5.2).
**Sources checked:** [[owner-rulings]] (D-A, D-B, D-C, D-E of 2026-09-10); the September deep dive `Reviews/2026-09-09-files-browser-mvp/tag-system-2026-09-10.md` (planning commit `c833ecd`); contracts-v2 `docs/TAG-OPTIONS.md` and `docs/DESIGN.md` §4.3, §10.2, §11, §12 on main.

#status/reference #kind/brief #repo/planning #repo/contracts #repo/sdk #repo/client

## @james's reply, verbatim

> I still consider "Topics" to be shared as that allows us to have schelling points. So names in paths are global and not owned by anyone. /cars/ is shared and everyone agrees it's the same concept. /cars/tesla/ is something we all agree are cars made by a company called Tesla. We can have disambiguations like wikipedia but that will involve pre and post fixes like wikipedia has. The name or ID is the schelling point.
> But also the "name" might not make sense in all languages so we still need the "ID" which is a number or string of characters to be static but the display name to be in the user's language.
> Also, lowercasing everyone seems very hard in Solidity and also impossible in Unicode especially as new languages are still being invented... can we even enforce lowercase? Maybe we try for English and just hope the rest of the world follows the best practices before 'llIl' and 'Illl' cause chaos.
>
> 1. I do think we should step back and consider that "tag" is an EFS concept and something in my mind is a core concept and feature everything is built on top of and "folder" is a file browser app concept. So tag is system and folder is app. A chess game might have tagged moved like beginner or expert but not have a concept of a folder. EFS is general but we are building the file browser as the first "app". Not sure if this clarifies things or not. But I lean towards tags being browseable and when you go to /cars/ you see everything tagged with the /cars/ tag regardless of type. You can filter to certain types... and maybe folder is a type. So /cars/tesla/ is the /cars/ tag that contains an item with the id tesla that is tagged as a type 'folder'. Or just set as a type folder... I don't know how EFS v2's type system works.
> 2. I like words being the IDs as it's easier for humans to grok but numeric IDs might be fine as we are moving into an age of agents. But words being IDs is better for URLs as even agents need to look up what 19283737 refers to but 'tesla' is instantly knowable. Breaks down for non-english speakers too but Chinese speakers can just make '<chinese characters>' that redirects / symlinks / hardlinks to the english word where the community is. Readable URIs seem like a good thing worth fighting for but I'd love to hear the pros and cons.
> 3. I don't care about cost too much. Let's get tags right and let optimization be an engineering problem.
> 4. Not sure about details on this question but this is one reason I wanted a numeric weight in EFS v1 tags. So nsfw weight >= 0 means the tag applies and <= 0 means it doesn't apply. And leaves room for preferences or details like /modern/ applying 75% for /cars/tesla/modely as it's a few years old.
> 5. I don't fully understand, but yes anyone should be able to attach files to vitalik.eth/0x1827... regardless of whether he uses the chain.
>
> I feel like we need more discussion and examples, so feel free to push back on things or point out where decisions might have unknown edge cases or engineering compromises.

## Where @pm's earlier recommendation changes

@pm recommended minted ids for nested tags. That was wrong for shared topics. A minted id belongs to whoever created it, so two people only share it by finding the same node. A word-derived id is the same for everyone who types the word, with no registry and no lookup. That is the only kind of id that can be a Schelling point on a ledger with no central directory. It is also what D-B already ruled and what the September deep dive designed (the "commons" profile).

Minted ids stay right for one thing: **folders**, which somebody creates, owns the naming of, and may rename.

## The model as @pm now reads it

| Thing | Layer | Its id comes from | Owned? | Rename |
|---|---|---|---|---|
| **Topic** (a tag) | system | the word, folded (D-B) | nobody | never; alias only |
| **File** | Files app | minted at creation | its author's versions | yes (the name is a link) |
| **Folder** | Files app | minted at creation | its creator's entries | yes |
| **Home** | system | an address | nobody; anyone may attach | n/a |

- A **tag link** says "author A puts thing X in topic T". X can be a file, a folder, a chess move, or another topic.
- A **named link** says "author A calls thing X `name` inside folder F (or home H)".
- Both are the same on-chain primitive (a binding at a position); the tag link's role is the target, the named link's role is the name. So "a folder entry is a tag with a name" is literally how the contracts work.
- A topic listed inside another topic ("`tesla` appears under `cars`") is a tag link whose target is a topic. The app shows a topic-typed member as something you can browse into.
- Labels per language, a definition file, and aliases are statements made about a topic id, seen through the reader's lens (the September design: `TAG_LABEL`, `TAG_DEFINITION`, `exactMatch` / `replacedBy`).

## The open fork: what does a path mean?

Three readings of `/cars/tesla`, with one example. Alice tags a photo `tesla`. Bob tags his photo `cars`. Carol tags hers `cars` and `tesla`.

| Reading | `/cars/tesla` is | Which photos show | Is it the same `tesla` as in `/companies/tesla`? |
|---|---|---|---|
| **S1. The path is the name** | its own topic, id from `cars/tesla` | none, until someone tags a photo `cars/tesla` | no; three paths are three topics |
| **S2. The path is a route** | the topic `tesla`, reached through `cars` | Alice's and Carol's | yes |
| **S3. The path narrows** | things in `cars` AND `tesla` | Carol's | yes; the view differs |

**@pm recommends flat word ids (S2 and S3), never S1.**

- **One word, one id** is the strongest Schelling point. S1 gives the same idea many ids (`tesla`, `cars/tesla`, `companies/tesla`, `vehicles/cars/tesla`), and a ledger can't merge them later.
- **The tree can be reorganized freely.** Under S2/S3 the hierarchy is only listings. Moving `tesla` from under `cars` to under `vehicles` touches no tagged item, and every link still works. Under S1 nothing can ever move.
- **Resolution needs no chain read** either way: hash the word.
- **S3 delivers the original brief.** `/car/tesla` and `/person/tesla` are distinct views with no path ids: cars tagged tesla, and people tagged tesla. When two meanings need separate pages, the Wikipedia and booru answer is a qualifier in the word: `tesla_(company)`, `nikola_tesla`.
- **Evidence** (September deep dive §2): no booru encodes hierarchy as a path; every system that put the parent in a tag's identity paid for it with per-item rewrites, which a ledger can't do.
- **S2 versus S3 is a client setting**, not a protocol decision: whether opening `tesla` from inside `cars` narrows to both. Narrowing works today for small sets (list one tag, check the other at about 13.5k gas per check, in a free call). It gets fast for large sets with the packed design (option B's bitmaps).
- **What S1 would give:** built-in disambiguation, and `/cars/tesla` as a single agreed thing with its own page. S3 gives the first; a qualified word gives the second.

## Pushback and edge cases

1. **A shared name is not shared contents.** Everyone agrees what `cars` is. What you see inside is "what the people in my lens tagged `cars`" (up to 64 people per view today). Anyone can tag anything `cars`, so an everyone-view is also a spam view. As built, the chain can list "all tags on this file by anyone" (the backlink list) but not "everything anyone tagged `cars`". That second list is the per-concept global posting (index kind 6), which is designed but not built, and part of the pending decision D-D.
2. **The default lens is soft governance.** Nobody owns `cars`, but someone picks whose tags, labels, aliases and sub-topic listings a newcomer sees first. Who is in the default lens is an open product question.
3. **A word id is a frozen spelling.** `teh_cars` is forever. `car`, `cars` and `automobile` are three topics until someone aliases them. An alias is a statement seen through the lens: the reader's client shows the two as one, and the ids stay separate. Two curators can alias the same word to different places; lens order decides.
4. **Non-English.** The id is the word the community settles on; display uses labels per language. `汽车` can be its own topic aliased to `cars`. If a community starts at `汽车` first, the two stay separate ids joined only by the alias.
5. **Lowercase can't be fully enforced on chain, and doesn't need to be.** The chain sees only the hash of the word. The rule lives in the SDK and in link resolution: every conforming client folds before hashing, so `/Tesla` and `/tesla` reach the same id and an unfolded id can't be reached from any URL. ENS works this way (normalization is done by clients; the contracts see hashes). Most scripts have no case at all. For the SDK dev to verify: pin a Unicode version, refuse characters not yet assigned in it, and rely on Unicode's stability rules so a later version never changes an existing id. On chain, the topic's record can cheaply refuse ASCII `A–Z`, spaces and control characters. Look-alikes (`rn`/`m`, Cyrillic `а`) can't be prevented by anyone; the client warns on mixed scripts and curators alias.
6. **Weights.** The sign is already the stance (assert, deny, said nothing; D-C). A lone −1 is exactly T-4, so @james's v1 model implies T-4 yes. The magnitude ("75% modern") needs one defined meaning, or apps will disagree: confidence, degree and preference aggregate differently. @james's rule overlaps at 0; proposed: no zero, silence is the zero. The September position kept a graded value as an optional, unindexed `confidence`. Carriers: (a) a spare byte on every tag link, a kernel change that is cheap only before deployment (the head row has a reserved byte; the signed action has no field); (b) the packed TagSet, which already has `confidence[]`; (c) an optional side record. Lists stay in insertion order; sorting by weight is client-side; averaging across authors is an off-chain job.
7. **Homes.** "Attached to vitalik.eth" is the attacher's statement, visible to people who include the attacher. The default view of a home should show the owner's own entries, with others' attachments behind an explicit tab. An ENS name can expire or change hands, so the address is the id and the ENS name is display plus a lookup at view time.
8. **Names when browsing a topic.** A file's name lives on its named link in a folder or home, and a tag link has no name. Proposed default: every file is created with a named spot in its author's home or a folder there, and tags go on top (Gmail's All Mail plus labels). A topic view then shows each file by that name.
9. **Types.** A v2 Type is a schema plus a checking contract; every record has exactly one; anyone can register a new Type without permission. "Filter by type" uses the Type the chain enforced, which can't be spoofed. "Folder" is the Files app's Type (`files-directory/1`); a chess app registers its own Types and uses the same tag links. A `types/directory` tag isn't needed.

## Proposed to record (superseded by the outcome below)

- **T-3:** cost is not the constraint; ship tags on the simple path and treat optimization as engineering ("I don't care about cost too much. Let's get tags right…").
- **T-5:** yes; anyone can attach to any address ("yes anyone should be able to attach files to vitalik.eth/0x1827…").
- **T-2:** topic ids are words (reaffirms D-B); folders stay minted; homes are addresses. Path semantics (S1 or S2/S3) still open.
- **T-1:** "tag is system, folder is app"; a folder is a Files Type, not the same thing as a topic.
- **T-4:** implied yes by the signed-weight model; still to confirm.

## Follow-ups as first drafted (superseded by the work order below)

- **Contracts:** price a strength byte on tag links before any persistent deployment (a spike like T-4's); name the smallest change set for word topics plus homes with folders kept as they are; say what index kind 6 costs per tag.
- **SDK:** draft PR #36 assumed minted nested tags and a lens walk for paths; it needs revising to word topics resolved by hashing.
- **Vault:** record the rulings above in `Designs/efsv2/owner-rulings.md` with Retirements rows once confirmed.

## @james's second reply, verbatim

> 1. They are different tags but like the booru tagging systems they can have metadata attached that form them into aliases or keep them separate. The meaning is kind of its own data which is subjective and dynamic. So a user typing 'tesla' into the search bar would show both tags in the autocomplete and maybe both tags separately in the search results. But if they are marked as synonyms then they merge together. This makes sense logically but could get... messy with lenses. But a lot of things do. I'd love to try our best to make this work in contracts but if truly needed we can say this is a The Graph only enhanced feature. But the hierarchy makes tags specific and their metadata determines the name shown to the user and how they are treated during searches etc.
> 2. A number gives us flexibility and I think it's fine for the apps / clients to determine what the value means. If we want to treat NSFW like a boolean then >= 0 is true and < 0 is false. If an adult app wants to sort things by "how nsfw they are" then 3 might be slight areola showing and 99 would be full monty.
> 3. We always use addresses as the ID for users / contracts. ENS was just an example and would likely be client only unless we can lookup via contracts and even then the address is what everything is attached to.
>
> Not sure if I missed stuff. I'm very tired. Just trying to get some ground truth so we can iterate more overnight.

## Ground truth after this reply

- **A topic is its path of words** (S1). `/cars/tesla`, `/companies/tesla` and `/tesla` are three topics. Nobody owns any of them.
- **Meaning is metadata.** Display names per language, synonyms and aliases are statements about a topic, seen through the reader's lens. Synonyms merge at read time.
- **Tag is system, folder is app.** A folder is a Files Type with a minted id.
- **Every tag carries a signed number.** At or above 0 it applies; below 0 it doesn't. What the size means is up to each app.
- **Homes are addresses.** Anyone can attach to any address. ENS is display only.
- **Cost is not the constraint.**

What path identity commits to (stated once, for the record):
- A topic can never be renamed or moved. A new one is made and aliased.
- Tagging `/cars/tesla` doesn't put a thing in `/cars` (D-A). The app shows sub-topics as entries to browse into.
- A synonym never merges ids. Readers show two topics as one by reading both, so each synonym costs another read, and a contract checking a tag sees exactly one id unless it pins a set.

## What can live in contracts, and what needs The Graph

| Capability | In contracts? |
|---|---|
| Path → topic id | yes: fold and hash, no chain read |
| Things tagged with exactly this topic, by the people in my lens | yes, as built |
| Sub-topics listed under a topic, by the people in my lens | yes, once topics are registered and listed |
| A topic's display name, definition and synonyms | yes: statements read through the lens |
| Showing synonyms as one | yes for a handful (the reader reads each); large synonym webs need the Graph |
| "Typing `tesla` shows every topic named tesla" (the exact word) | yes, if registration also adds the topic to a list keyed by its last word |
| Type-ahead on partial words, fuzzy search, ranking, trending | no: the Graph, or a local cache |
| Everything anyone tagged with a topic | not as built (index kind 6, pending D-D); it's also a spam view |
| Sorting by the number | no: lists are in insertion order; the app sorts, or the Graph does for big sets |
| A contract acting on a tag | exact topic id and named authors only; no synonym following inside a transaction |

## Work order for the integration owner to hand out (none started by this session)

**Contracts dev:** one design PR with a spike branch, measured on both fee schedules. Don't merge kernel changes before review.
1. **Topic identity from a path.** Compare one hash of the whole folded string with a per-segment chain (`id(child) = H(id(parent), word)`), which makes "this word under that parent" checkable with one hash. Define the root and the reserved first segments (homes `0x…`, `~efs`).
2. **Registration and listing.** What makes a sub-topic appear under its parent, per author or across authors, what spam costs, and whether the validator can refuse a listing whose id doesn't match its name.
3. **Exact-word lookup:** a list keyed by the last word, giving every registered topic with that name.
4. **Topic metadata as statements:** label per language, definition file, synonym, replaced-by; the read-time merge and its hop limit.
5. **The number on a tag:** width (James's examples: −1, 0, 3, 75, 99), where it's stored (the head row has a reserved byte; the signed action has no field), sign and state (≥ 0 bound, < 0 masked, including from silent, which is the T-4 spike), list filtering, and cost.
6. **Homes:** an address-derived parent for named links and tag links (parity ask C8).
7. **Name what can't be done in contracts,** so it's assigned to the Graph on purpose.

**SDK dev:** revise draft PR #36.
- Topic paths resolve by folding and hashing, with no lens walk; folders and homes keep the walk.
- The fold rule with vectors shared with the contracts: pin a Unicode version and refuse characters not assigned in it.
- The tag number in the plan and read APIs, with the ≥ 0 / < 0 convention.
- Synonym-aware reads with a bound.

**Client dev:** a short design note, no code.
- The topic view: everything tagged, a Type filter, sub-topics as entries to browse into.
- The home view: the owner's entries first, others' behind a tab.
- The search box: exact word from the chain; type-ahead needs the Graph or a local cache.
- The number: a default of 0, and "not this" as a negative.
- Naming: every file gets a named spot in its author's home, with tags on top.

