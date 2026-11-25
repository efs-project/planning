# Tag decision sheet: the one page to read

**Status:** reference: @pm's one-page summary for @james, 2026-11-25. **Decided the same day:** @james said yes to "paths tell tags apart, and a word's page shows every place that word is used" (recorded in `Designs/efsv2/owner-rulings.md`). Option 2 is out; options 1 and 3 are one model, and the contracts measurement picks the plumbing. The working spec is [[2026-11-25-tag-model-spec]].
**Background, if wanted:** [[2026-11-25-tag-questions-explained]], [[2026-11-25-tag-discussion-round-2]], [[2026-11-25-tag-discussion-round-3]], and the research in `Reviews/2026-11-25-tag-prior-art/` (its README is the verdict).

#status/reference #kind/brief #repo/planning #repo/contracts #repo/sdk #repo/client

## Already settled

Recorded in `Designs/efsv2/owner-rulings.md` under 2026-09-10 and 2026-11-25.

- **Tags are the system; folders are a File Browser thing.** A folder is one Type of item.
- **Topics are shared words nobody owns.** Words, not numbers, so links are readable. One id per word, lowercased.
- **Every tag carries a number.** Zero or above means it applies; below zero means it doesn't. What the size means is up to each app.
- **Addresses work like any other folder or tag.** Anyone can attach to any address. Viewing an address adds that address to your view automatically, after you and before "public".
- **"View everything anyone tagged" is required.**
- **Cost is not the constraint.**

## The one real choice: what is the shared tag?

The example for all three: Alice files a photo under cars > tesla. Bob files one under companies > tesla. Carol just tags hers tesla.

| | 1. The path is the tag | 2. The word is the tag | 3. Both |
|---|---|---|---|
| How it works | `/cars/tesla` is one tag; `/companies/tesla` is another | `tesla` is one tag; "tesla is under cars" is somebody's opinion | `tesla` is the shared tag; `/cars/tesla` is where a thing was filed; each tag is listed under both |
| `/cars/tesla` shows | Alice's | Alice's, if she also tagged `cars` | Alice's |
| The word `tesla` shows | three separate tags, unless someone links them | all three, mixed together | all three, grouped by where each was filed |
| `/cars` includes Alice's photo | yes, once roll-up is built | only if she also tagged `cars` | yes, automatically |
| Needs curators | to join duplicates | for any hierarchy at all | no; curation is optional |
| Reorganizing later | impossible; paths are frozen | easy; the hierarchy is only data | paths stay as filed; words are unaffected |
| Who works this way | Usenet, Obsidian | Danbooru, AO3, Stack Overflow | an old British library scheme (PRECIS) |

**Option 1** (ruled on 2026-11-25, before the research)
- Good: readable places, automatic roll-up, nobody in charge.
- Bad: the same idea splits across paths for good. People matched a whole compound heading about half as often as its parts.

**Option 2**
- Good: one word, one pool; the tree can be rearranged freely.
- Bad: a bare word can't tell meanings apart, so it needs names like `tesla_(car)` and `tesla_(person)`, and a mixed tag can't be split later without retagging every item, which a ledger can't do. The hierarchy is whatever a reader's chosen curators say, so roll-up is an opinion and is slow to compute for big trees.

**Option 3** (@pm's recommendation)
- Good: the word pools everything, however people arrange the tree; paths still give places and roll-up with nobody in charge.
- Bad: a word like `tesla` mixes meanings, so its page has to group by path. Listing every tag under every word is still being measured for cost and spam.

## Where the choice stands after @james's questions (2026-11-25)

- **Curators.** @james is right that EFS has curators: everyone who tags or links tags is one, and a reader picks a team through the lens. What EFS lacks is one team everybody shares by default. The earlier wording here ("EFS has none") was wrong.
- **Disambiguation decides against option 2.** @james's original reason for paths was to keep `/cars/tesla` and `/people/tesla` apart. Options 1 and 3 both do that. Option 2 does not.
- **Options 1 and 3 behave the same for a user.** In both, `/cars/tesla` and `/people/tesla` stay separate, and typing `tesla` shows every place the word is used, grouped by place. Option 3 does not merge them. The difference is plumbing: option 3 keeps one list per word; option 1 keeps a directory of the paths that use a word and gathers their lists. The contracts dev's measurement can settle that.
- **Synonyms come at two levels in either.** A word-level one (`car` = `cars`, `汽车` = `cars`) fixes every path that uses the word. A path-level one (`/cars/tesla` = `/companies/tesla_motors`) joins two specific places.
- **Booru-style parents remain an optional layer** for relations a path doesn't express, such as "a Model Y is also electric".

So the sentence to confirm is: **paths tell tags apart, and a word's page shows every place that word is used.**

## Why a yes is the safe side (asked by @james, 2026-11-25)

**Where the complexity went.** It didn't vanish. About ten questions were ruled along the way (see "Already settled"), the research removed two options (numbers and bare words), options 1 and 3 turned out to behave the same, and the rest became defaults or measurements.

**What a yes freezes, and when.** Only how a topic's id is computed: each word hashed with its parent, after lowercasing. Lists (roll-up, word pages, view-all) are built from stored data and can be added or rebuilt later. Nothing is frozen until the first lasting deployment; until then this is a build direction that can be tried in the browser and changed.

**A yes records strictly more.** A tag with a path contains everything a bare-word tag does, plus where it was filed. A one-word path is a bare-word tag. The word page is the bare-word pool, with each item labelled by its place. Context can be ignored later; it can never be added back to tags that didn't record it.

**EFS is most like:**

| System | What EFS shares with it | What EFS doesn't have |
|---|---|---|
| Usenet group names | shared hierarchical names nobody owns | its backbone admins, who could reorganize |
| Obsidian nested tags | a tag is a path; the parent includes its children | a single user who can rename everything |
| Wikipedia disambiguation pages | one page per word listing every meaning | editors who write it by hand; here it is automatic |
| Hydrus (booru client), Bluesky labelers | each reader ranks whose synonyms and parents apply | — |
| AO3 | tags are never rewritten; meaning is layered on as data | its 400 volunteers curating one shared vocabulary |
| ENS | ids hashed word by word; lowercasing done by apps | owners of names |

No earlier system is shared, permanent and without an authority all at once.

**The assumptions the choice rests on:**

| Assumption | Why we hold it | If it were false |
|---|---|---|
| No authority everyone accepts will exist to rename, merge or split tags | EFS's purpose | bare words or numbers with a trusted curator would work (AO3, Wikidata) |
| Nobody can retag another person's item | the ledger is permanent | mixed tags could be cleaned up later, as boorus do |
| Anyone must be able to work out an id alone | Schelling points; readable links | numbers would be fine |
| People won't agree on how to organize things | under 20% pick the same word; 16% the same compound heading; 30% of medical subjects have several parents | one tree would do, and the word page would be unnecessary |
| It must work with no curators at all | a newcomer's view may have none | booru-style parents alone would be enough |
| Cost per tag isn't the constraint | ruled 2026-11-25 | bare words would be cheaper |

**What can still go wrong after a yes.**
- The same idea gets filed under several paths (`/cars/tesla`, `/autos/tesla`). The word page and synonyms reconnect them; how messy this gets in practice is untested.
- A popular path with a mistake in it is permanent; a "moved to" note is the only repair.
- The lowercasing rule is frozen at the first lasting deployment and has to be right.
- Whether a good default team of curators forms is a social question no design settles.

## Clear answers @pm will go with unless @james objects

- **Roll-up along the path is automatic,** once the contracts dev's measurement is in.
- **Lowercasing is done by the apps, not the chain,** the way ENS does it.
- **No small depth limit.** @james rejected 8 words on 2026-11-25: serious use needs paths as deep as a Windows or Linux file path, 64 levels or more. Folder paths under an address have no depth limit. A topic path may be at least 64 words deep; its real maximum is whatever one transaction can hold, which the contracts dev is measuring. A deeper topic path costs its tagger more, because each level adds a list entry.
- **Tag suggestions show counts across everyone,** not only the reader's view.
- **Opening a folder from a link shows its creator's files,** even when the creator isn't in the reader's view. Without this, a shared folder link would open empty. @james asked what the earlier wording meant; this is the case it covers.
- **When "public" is on and several people have a file with the same name in one place,** the app shows them as a list, newest first (@james, 2026-11-25: oldest first would make public views static).
- **A bare path is a topic; folders and named files live under an address.** `/cars/tesla` is always topic words. `/0x1234…/photos/cat.jpg` is a folder path with file names, which keep their capitals. The realm's shared root folder gets no link of its own. First segments starting with `0x` (addresses) or `~` (system, such as `~efs`) are reserved. Files shown in a topic are opened by their permanent link.

## Can wait

- Who is in a newcomer's default view.
- Settings that inherit down a path (parked in `Ideas.md`).
- Whether a file's name is its own mechanism (as built: a case-sensitive name on a folder entry) or simply the last word of a path, which is one reading of "a folder is a tag". Until this is settled, no link addresses a named file through a topic.

## Waiting on @james

The main choice is made (yes, 2026-11-25). One follow-up is ready for him, and it can wait until before the first lasting deployment.

### The lowercasing rule

When someone types a tag word, the app tidies it before working out its id, so that `Tesla` and `tesla` are the same tag. Whatever rule is used can never change once real tags exist. The SDK dev compared two rules on real Unicode data (`sdk-v2` main, `docs/design/fold-evaluation/README.md`).

| What someone types | A: lowercase only (D-B as worded) | B: Unicode's full matching rule |
|---|---|---|
| `Tesla` | `tesla` | `tesla` |
| `Ｔｅｓｌａ` (full-width letters, common on Asian keyboards) | a different tag from `tesla` | `tesla` |
| `ﬁle` (with the "fi" ligature) | a different tag from `file` | `file` |
| `Straße` | `straße` | `strasse` |
| `❤️` and `❤` (same heart, one has an invisible marker) | two tags, or refused | one tag |
| Persian words typed with or without their invisible joiner | two tags, or refused | one tag |

- **A** is small (1 to 10 KB in the SDK) and leaves look-alikes as separate tags.
- **B** makes things that look the same to people the same tag. It costs about 27 KB in the SDK, loaded only by apps that use tags.
- **A also lets through words that imitate reserved forms** (found by the SDK dev's vectors, `sdk-v2` main `64edb71`): `cars／tesla` with a full-width slash would be one valid word that looks like a path, `～efs` would look like a system link, and a full-width `０ｘ…` would look like an address. Under B these become the real characters and are refused.
- Neither rule can merge look-alikes from different alphabets (a Cyrillic `а` in `tesla`). The app warns about those.

**Three parts, with the SDK dev's and @pm's recommendation for each:**
1. The rule: **B**.
2. Invisible joiners and markers: **removed when working out the id**, so both typed forms meet; the display name keeps what was typed.
3. Which Unicode version: **the newest at release, with the tables shipped inside the SDK**, so no browser's version matters.

This refines D-B's wording ("NFC → lowercase"), so it is his to confirm. "All recs" is a fine answer.

### From the contracts design (no decision needed; here so he sees them)

The contracts dev's measured design is reviewed and accepted as the basis for the build (`contracts-v2`, branch `spike/2026-11-25-tags`, `docs/TAG-DESIGN.md`).

- **What a tag costs:** about 0.81M gas in an existing topic today, roughly half the cost of creating a file. The first use of a brand-new deep path costs more and can take two or three transactions.
- **A 64-word path works.** No depth limit.
- **The number on a tag** runs from −65,536 to 65,535 and costs nothing extra.
- **"Remove" and "Hide" are different.** Removing your own `pet.jpg` at a shared place lets the next person's show through. Hiding stops anything showing there for you.
- **Any app's things can be tagged,** not only files.

The design ends with five points for him, each with a "keep it" recommendation that @pm shares. No reply is needed unless he disagrees:
1. **The number's range** is −65,536 to 65,535. Wider would cost extra storage on every tag that uses it.
2. **A tag is filed under a topic or an address, nothing else.** An app that wants its own kind of link between its own things defines one, at the same cost.
3. **No word may start with `~` or look like an address,** anywhere in a path.
4. **Everyone's versions of one file are not listed on the chain for now.** Keeping that list costs about 36k gas for every file ever created. The contracts dev confirmed it can be added later and filled in exactly from history, on one condition: the step that builds a new list from history is designed but not yet written, and it must exist before a Realm is ever frozen. @pm treats that as a release gate, so this is a deferral and not a loss.
5. **Cost:** a tag is about half the price of creating a file, and a deep new path can take two or three transactions the first time.
