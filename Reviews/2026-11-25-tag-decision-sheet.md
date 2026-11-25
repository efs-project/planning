# Tag decision sheet: the one page to read

**Status:** reference: @pm's one-page summary for @james, 2026-11-25. It replaces nothing; it points at the longer records. The only ruling it waits on is the choice in "The one real choice".
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

A yes to the sentence above (which rules out option 2 and leaves 1 versus 3 to measurement), or a different pick.
