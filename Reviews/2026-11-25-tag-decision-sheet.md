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
- Bad: every system like this needed curators (AO3 has about 400 volunteers). EFS has none, so there would be no hierarchy and no roll-up by default.

**Option 3** (@pm's recommendation)
- Good: the word pools everything, however people arrange the tree; paths still give places and roll-up with nobody in charge.
- Bad: a word like `tesla` mixes meanings, so its page has to group by path. Listing every tag under every word is still being measured for cost and spam.

## Clear answers @pm will go with unless @james objects

- **Roll-up along the path is automatic,** once the contracts dev's measurement is in.
- **Lowercasing is done by the apps, not the chain,** the way ENS does it.
- **A path is at most 8 words deep.**
- **Tag suggestions show counts across everyone,** not only the reader's view.
- **A folder adds its creator to the view,** the same way an address does.
- **When "public" is on and several people have a file with the same name in one place,** the app shows them as a list, oldest first.

## Can wait

- Who is in a newcomer's default view.
- Settings that inherit down a path (parked in `Ideas.md`).

## Waiting on @james

Option 1, 2 or 3.
