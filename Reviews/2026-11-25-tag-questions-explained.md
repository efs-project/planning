# The tag questions, explained for @james

**Status:** reference: @pm's plain-language explanation of T-1–T-5, written for @james to rule on.
**Given:** 2026-11-25. Sources: contracts-v2 `docs/TAG-OPTIONS.md` (merged `b7568a3`), the T-4 spike (branch `spike/2026-11-25-deny-from-silent`), SDK draft PR #36, and [[owner-rulings]] (D-A, D-B, D-C, D-E of 2026-09-10).
**Use:** this is the framing @james answers against. Once he rules, his ruling goes in `Designs/efsv2/owner-rulings.md`; this page doesn't change.

#status/reference #kind/brief #repo/planning #repo/contracts #repo/sdk #repo/client

## First: how EFS v2 stores things (five ideas)

1. **A file is a permanent thing with versions.** It has a permanent id (call it file #7). Each edit adds a version, and old versions stay, much like a file's Git history.
2. **Every link is somebody's signed statement.** EFS doesn't store "readme.txt is in docs". It stores "**Alice says** the thing called readme.txt in docs is file #7". Bob can say something different about the same spot. Nothing is global truth.
3. **A lens is whose statements you see.** A view is an ordered list of people, for example "me, then James, then EFS official". For each spot, the first person on your list who said something wins. If what they said is "nothing here" (a denial), the search stops there. That's how you hide something in your own view without touching anyone else's.
4. **Writing costs gas; reading is free.** Every statement is stored on-chain, so each one is paid for once, by its author.
5. **Links come in two kinds.** A permanent link (`…/~efs/o/<id>`) never breaks. A path link (`…/docs/readme.txt`) is looked up when opened, so it stops working if someone renames along the way.

## Already decided (2026-09-10), so these aren't reopened

- **D-A:** on-chain, placement is not inference. `/clouds/nimbus` doesn't make nimbus-tagged things show up under `clouds`; a smarter search layer can do that later.
- **D-B:** one global tag per word. "Tesla", "tesla" and "TESLA" are the same tag (folded: lowercase, spaces become underscores).
- **D-C:** "this is NOT nsfw" is a stance on the `nsfw` tag, never a separate `not_nsfw` tag.
- **D-E:** about 50k gas per tag is the target, which you accepted "if that's the best we can do".

## Question 1: is a folder a tag?

**What it means:** there's one kind of thing, a **node**, with two kinds of link:
- **named** links ("`readme.txt` in `docs` is file #7"): folder entries;
- **unnamed** links ("file #7 is in `nsfw`"): tags.

So `docs` can be browsed as a folder and also used as a tag. Putting a file in `docs` and tagging a file with `docs` are two links to the same node.

**Example:** `/photos` contains `cat.jpg`. A file filed somewhere else entirely can also be tagged `photos`, and it appears among `photos`' members, without a name.

**Recommendation: yes.**
- It's the model you described.
- It costs nothing extra.
- It's what makes question 5 (homes) possible.
- The only cost: today's folder type gets replaced, so the SDK and client re-record their tests once. That's cheap now.

**If no:** folders and tags stay separate kinds of thing.

## Question 2: what makes two tags "the same tag"? (the big one)

Every link is stored under a tag's id forever, so this can't be changed later. There are four ways to give a tag its id:

- **By its word:** `#nsfw`, `#tesla`. Everyone who types the word gets the same tag, and nothing needs creating first. This is already ruled (D-B).
- **Minted:** a folder or a nested tag like `/car/tesla` gets its own permanent id when someone creates it, the way a file does. Renames and moves don't change it.
- **By address:** a person's home (question 5).
- **By its path** (recommended against): `car/tesla` is turned into the id directly. Everyone who types `/car/tesla` gets the same tag automatically. But renaming `car` to `vehicles` creates *new* tags. Everything filed under the old ones stays there forever, and every old link breaks.

**The trade-off in one example.** Alice creates `/car/tesla` and tags 20 photos with it. Bob also wants a `/car/tesla`.

- **Minted:**
  - If Bob creates his own `/car/tesla`, it's a different tag from Alice's.
  - To build one together, Bob reuses Alice's node: he browses into her `/car/tesla` and tags his photos there. Anyone can add to any node.
  - Then a view that includes both Alice and Bob shows all their photos together.
  - Alice can rename `/car` to `/vehicles`, and every link keeps working.
- **Path:**
  - Typing `/car/tesla` is enough. Alice's and Bob's are automatically one tag, and a view including both shows both sets of photos.
  - But when Alice renames `car` to `vehicles`, her 20 photos stay behind under the old `/car/tesla`, and `/vehicles/tesla` starts empty.

So under minted, nested tags are shared by **reusing a node you found**, the way people reuse a Wikipedia category. Under path, they're shared by **typing the same path**. Flat word tags (`#tesla`) are shared by typing either way. Gmail labels and Obsidian folders work like minted ids. Booru tags work like words: one flat, shared vocabulary.

**Recommendation:** words for flat tags, minted ids for folders and nested tags, addresses for homes, and never paths. You said permanent links matter, and a ledger can't go back and re-file old links after a rename. A shared vocabulary still forms through flat tags, and through trees people reuse, for example an "EFS official" `/car` tree that the default view includes.

**Choose path instead** if a hierarchy the crowd builds by typing matters more to you than renames.

## Question 3: ship tags at today's price?

- **Cost:** a tag costs about **0.34M gas** when several go in one transaction, or 0.73M for one tag alone. About 45 tags fit in one transaction, which means one wallet approval.
- **Against the budget:** that's about **7 times** the 50k target from D-E. It's roughly the price of a folder entry, or of 16 plain ETH transfers.
- **In dollars (illustration only):** at 1 gwei and ETH at $3,000, about $1 per tag. After the planned Glamsterdam upgrade, about 4 times that.
- **The 50k target** is reachable only with a different "pack all of a file's tags into one record" design (option B), and only when a file gets about 35 tags at once. That design is *more* expensive than today for the common case of tagging many files with one tag each (0.59M against 0.34M each). It's 2–3 weeks of work.

**Recommendation: yes for the MVP.** Tagging is for a handful of tags per file, and the app shows the price before you approve. Build the packed design later, if real use needs booru-style tagging. It slots under the same tags, so nothing gets redone.

**If you'd rather wait:** tags arrive 2–3 weeks later, and are dearer for light use.

## Question 4: can "not this tag" stand alone?

**Today:** saying "this is NOT nsfw" about a file you never tagged takes two steps: tag it, then deny it. **The change:** deny in one step.

**Measured** (a trial build that hasn't shipped): 0.66M gas instead of 0.81M for one alone, and cheaper still in batches.

**Bonus:** the same change lets you hide anyone's file in **your own view** in one step. That's moderation by lens. It isn't a new power, since two steps already do it.

**Fine print:** someone could fill their own folders with hidden junk entries a bit more cheaply than today. Only people who include that person in their view pay the small cost of skipping them.

**Timing:**
- **Now:** cheap, with no data to migrate.
- **After a real deployment:** a contract upgrade through the Safe plus rebuilding the index from history.

**Recommendation: yes, now.**

## Question 5 (comes with question 1): homes

**What it means:** every address gets a home node automatically.
- Anyone can attach files to Alice's home, even if Alice has never used EFS. Whose attachments you see there depends on your lens, as everywhere.
- web3:// paths start at a person: `web3://…/0xAlice/docs/a.txt`, and `web3://…/~tag/nsfw` lists a tag.
- This is v1's "attach files to addresses".

**Recommendation: yes.** It's free once question 1 is yes.

## What these decide further up

- **Links:** every link people share (question 2). Folder and tag links are permanent ids, and the path is the readable name shown with them.
- **The File Browser:** the tree, tag views and filters become one mechanism (question 1).
- **Tagging:** what approving a tag costs and how many go in one approval (question 3).
- **Moderation:** hiding is per viewer, through the lens (question 4).
- **Addresses:** homes and web3:// addresses (question 5).
- **Search:** on-chain lists are exact and explicit. "Show nimbus under clouds" is a later search layer (D-A).

## Not decided here (later, and not blocking)

- Tag display names and descriptions (labels).
- Which lists are indexed automatically (D-D, still pending).
- Writes with no wallet prompts (the session-key lane).
