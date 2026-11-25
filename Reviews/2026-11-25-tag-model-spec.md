# Tag model: working spec, edge cases and pitfalls

**Status:** reference: the working spec for the tag model @james ruled on 2026-11-25. It applies his rulings; where it goes beyond them it says "PM default" and can be overturned. The three dev sessions build from this page; the integration owner hands out the work order at the end.
**Author:** the PM's side session for the tag discussion (Fable 5.2), under @james's instruction of 2026-11-25 to update designs, find edge cases and pitfalls, and pass instructions on.
**Rulings it applies:** `Designs/efsv2/owner-rulings.md`, 2026-09-10 (D-A, D-B, D-C, D-E) and 2026-11-25 (T-1 to T-5, view-all, homes follow the lens, the shared tag, depth, newest first).
**Background:** [[2026-11-25-tag-decision-sheet]] (one page), `Reviews/2026-11-25-tag-prior-art/` (evidence).

#status/reference #kind/brief #repo/planning #repo/contracts #repo/sdk #repo/client

## 1. The model in ten lines

1. A **word** is a folded piece of text (`tesla`). Words are shared and unowned.
2. A **topic** is a path of words (`/cars/tesla`). Its id comes from a record `(parent topic, word)`, so anyone can compute it and nobody owns it. `/cars/tesla` and `/people/tesla` are different topics.
3. The topic `(root, word)` is that **word's page**. `/tesla` shows every place the word `tesla` is used, grouped by place and never merged.
4. A **tag** is one author's signed statement: "thing X is in topic T, with number n". `n ≥ 0` means it applies, `n < 0` means it doesn't, and no statement means the author said nothing.
5. A tag is **listed** under its topic, under every parent topic (roll-up) and under each of its words (the word pages).
6. A **home** is the place derived from an address. Anyone can attach things to it. It follows the lens like any other place.
7. A **folder** is a Files Type: a minted, renamable container with named entries. It lives under a home or another folder and can be tagged like anything else.
8. **Meaning is statements about topics:** display names per language, a definition, "same as", "moved to", and optional booru-style parents. Readers see them through their lens.
9. A **lens** is an ordered list of authors, optionally ending in "public". For each (topic, thing), the first author with a stance decides.
10. **Views** come in three kinds: Mine (lens authors only), Everyone (all authors, minus what lens authors mark below 0), Raw (nothing hidden). Public lists are newest first.

## 2. Writing

### 2.1 Topics

- **Records** (the contracts dev's design, 2026-11-25, agreed): two Types. A **word page** has the word as its body and is also the root-level topic `/tesla`. A **path record** for two or more words holds exactly two references: its parent topic and its last word's page. Ids are record ids, computable from the words with no chain read, and must not depend on the author, the realm or the chain.
- **References do the checking.** The kernel refuses a record whose reference doesn't exist, which gives "parent before child", "word page before use" and permanence. The reference lists that exist today are the two directories of 2.3.
- **One sequence of words has exactly one record.** The reference Types are constrained at admission (first: a word page or a path record; second: a word page), and a reader treats a chain that doesn't end at a word page as INVALID.
- **Registering** is publishing that record. It is permissionless and idempotent, and it happens in the same publication as the first tag, with no extra prompt.
- **A parent must be registered before its child.** Registering a new deep path registers each missing ancestor and each missing word page.
- **Permanent:** a withdrawal by the first registrant must not unregister a topic others use.
- **Word rules checked on chain** (PM default, cheap and forever-stable):
  - 1 to 255 bytes of well-formed UTF-8;
  - no `/`, no ASCII control characters, no ASCII space, no ASCII `A–Z`;
  - not `.` or `..`;
  - not starting with `~`, and not `0x` followed by 40 hex digits. This applies to every word in a path, because every word has a root-level page; `/cars/~x` and `/people/0x…` can't exist.
  - These run once per word, on its word page.
- **Everything else about folding is the SDK's job** (section 6).

### 2.2 Tags

- **Statement:** a TAG bind on a registered topic or a home, targeting the thing, carrying the number.
- **A tag on an unregistered topic is refused with a named error.** Never a silent miss.
- **Number:** signed, part of what is signed and of what a rebuild reads. Changing only the number is a normal update that keeps history.
  - `n ≥ 0` is the bound state; `n < 0` is the denied state; removing the statement returns to "said nothing".
  - A first statement may be negative (the T-4 spike's "first mask").
  - Width: PM default is the widest signed integer that fits the existing row words without a new storage slot; the contracts dev reports what fits (8 bits certainly, 16 if possible). The protocol defines only the sign. Apps define the size.
- **What can be tagged:** files, folders, topics, and addresses. Tagging an address ("this address is a phishing site") must work for addresses that have never transacted, so an address has to be a valid target without a record. Tagging a specific revision of a file must also be possible, for claims about content that an edit could change.

### 2.3 Lists the index keeps

Every list holds statement sequence numbers, append-only, in time order. A reader decides what is live by reading each statement's current state and number; lists are never rewritten when a tag is removed or flipped.

| List | Per author | All authors |
|---|---|---|
| Exactly this topic | exists today | new: view-all |
| This topic and below (roll-up) | new | new |
| This word, anywhere | new, or derived | new, or a directory of paths per word |

- An entry is appended at an author's **first** statement on (topic, thing), whatever its sign. A later sign flip then needs no list write.
- **Directories, written once at registration and the same for everyone:** the child topics of a topic, and the topics that use a word.
- **Rebuild equals live.** Lists derive only from stored records and statements. A test must rebuild the index and compare.
- **Counts** are list lengths: cheap, but they count every statement ever made, including removed and negative ones. Treat them as "about".

## 3. Reading

### 3.1 The lens rule for tags (PM default: priority)

For a thing X in topic T, walk the lens in order. The first author with a stance on (T, X) decides: a non-negative number shows X with that number, a negative number hides it. "Public" at the end means any author. An UNKNOWN read never counts as "said nothing".

### 3.2 Denials

- Only lens authors can hide things. A stranger's negative number never hides anything from anyone else.
- In Everyone, a thing is hidden from a place when a lens author marks it below 0 **at that place or at the topic the entry was filed under**. A denial does not travel down to child topics.
- A denial of `/cars/tesla` says nothing about `/cars`. The thing still shows under `/cars` if another statement puts it there.

### 3.3 Roll-up and duplicates

- A thing filed at `/cars/tesla` and at `/cars/ford` appears twice in `/cars`'s list. Readers remove duplicates by thing, across pages.
- Roll-up follows the path only. "A Model Y is also electric" needs a second tag or the optional parent layer.

### 3.4 Word pages

`/tesla` lists every use of the word, grouped by place, with counts: `/cars/tesla`, `/people/tesla`, plain `/tesla`. The client must not show it as one undifferentiated list.

- **A group is a place whose own word is the word.** `/cars/tesla/model_y` belongs to the group `/cars/tesla`, and that group shows the place's roll-up. (Client dev's call, 2026-11-25; agreed.)
- **A place that lies below another group is not a second group.** `/tesla/cars/tesla` is already inside plain `/tesla`.
- **Group order:** places the lens has used first (by lens count), then the rest by global count, largest first. Both counts are shown.
- **Consequence for the plumbing:** these groups are exactly the directory "topics that use a word", and each group's contents are that place's roll-up list. No view needs a separate list of items per word. Prefer the directory unless the measurement shows the per-word item list is nearly free.

### 3.5 Synonyms and moves

- **Two levels.** Word level (`car` = `cars`, `汽车` = `cars`) applies to every path using the word. Path level (`/cars/tesla` = `/companies/tesla_motors`) joins two specific places.
- **They never merge ids.** The reader gathers the lists and merges them in time order, removing duplicates. Each synonym costs one more list read.
- **Limits:** at most 4 hops, cycle-safe, and at most 16 lists per view (PM defaults).
- **Finding them from either side** uses the "what points at this" list that exists today.
- **Display name of a path segment:** a path-level label from the lens, else the word-level label in the reader's language, else the word.

### 3.6 Curating a topic's children

Tagging a child topic into its parent curates the listing: a negative number hides the child for readers who include that author, a positive number ranks it.

- **Order:** children a lens author listed (by number), then children a lens author has filed something under (by lens count), then the rest by global count.
- **Junk rule, an SDK default so clients agree:** a child with no statement from the lens needs tags from at least 2 different authors to be shown without "show all". Statement counts alone are too easy to inflate. How many rows to show is each client's choice (the EFS client uses 8).
- **A big directory can't be ranked in one read.** The children read scans a bounded number of entries and says so (PARTIAL), never implying it saw them all.

### 3.7 Names of things in a topic

A tag has no name. The display name of a file shown in a topic is, in order: the name its tagger gave it in their own home or folders; the name its creator gave it; the first name from the lens; else its media type and a short id. Files in a topic open by permanent link.

## 4. Homes

- The id derives from the address alone.
- Named entries and tags both hang off a home. A home needs no record and no registration.
- **Viewing a home** uses the lens `[reader, the home's address, …the rest, public]`.
- **Always show whose entry it is** when it isn't the home owner's. A reader's own `pet.jpg` at someone else's address will otherwise look like the owner's.
- ENS names are display only and never part of an id or a permanent link.

## 5. Links

| Form | Meaning |
|---|---|
| `/<word>/<word>/…` | a topic; words are folded before lookup |
| `/<word>` | the word's page |
| `/0x<40 hex>/<name>/…` | a home, then folder and file names, which keep their case |
| `/~efs/…` | permanent object and revision links (as built) |

- Trailing slashes are ignored. Empty segments are refused. Percent-decoding happens before folding.
- First segments starting with `~` are reserved for the system.
- Parked: whether a file name is its own mechanism or the last word of a path. Until then no link addresses a named file through a topic.

## 6. Folding (the rule that freezes)

- D-B stands: fold in the SDK and in link resolution, before hashing. The chain checks only the ASCII rules in 2.1.
- **Pin one Unicode version and refuse characters not assigned in it.** A later version then can't change an existing id.
- **Open, with a PM recommendation for the SDK dev to evaluate and bring to @james before any lasting deployment:** use Unicode's identifier case-folding (NFKC_Casefold) instead of NFC plus lowercase. It also folds full-width letters and ligatures, and Unicode guarantees it stays stable for assigned characters. D-B's wording says "NFC → lowercase", so this is a refinement he has to confirm.
- **Vectors shared by the contracts and the SDK**, including words that must be refused.
- Look-alike letters can't be prevented. The client warns on mixed scripts.

## 7. Pitfalls, in the order they are likely to bite

1. **A lens view with roll-up is the default view and the expensive one.** Without per-author roll-up lists, "what did my people file under `/cars` and below" means filtering the all-authors list or walking every child topic. Price the per-author roll-up list first.
2. **Depth multiplies everything.** A tag at depth d appends to up to 4d lists, and a new path registers up to 2d records. A first use of a deep new path may not fit one transaction. The SDK must split registration into earlier parts, which are harmless if the save is abandoned. If the deepest path that fits is under 64, the contracts dev comes back with options; never skip levels silently.
3. **Silent absence.** Any path where a tag lands but a list misses it is the bug class EFS keeps hitting. Refuse, or list; test rebuild against live.
4. **A root word that looks like an address or starts with `~`** would shadow a home or system link. Refuse on chain.
5. **Fragmentation is certain.** `/cars/tesla`, `/autos/tesla` and `/vehicles/cars/tesla` will all exist. The defences are the tagging suggestions (existing places for the word, with counts across everyone), word pages and synonyms. Suggestions must use global counts; people who see only their own circle's choices don't converge (Centola and Baronchelli, 2015).
6. **Counts can be gamed.** Global counts drive suggestions, and a spammer can inflate them at about one tag's gas per entry. Show the count from the reader's lens beside the global one.
7. **Newest-first public views reward the latest poster.** Under "public", whoever posted last is shown first. The lens is the defence; the client labels the public tier clearly.
8. **Frozen mistakes.** A popular path with a typo or a dated parent is permanent. "Moved to" is the only repair, and it works only for readers whose lens includes someone who said it.
9. **Tag drift.** A tag on a file outlives edits to the file. Safety-type tags may need to target a revision. The SDK takes either; the client chooses per tag.
10. **Newcomers have no curators.** With an empty lens there are no synonyms, labels or hidden children. What the default view contains is undecided and matters at launch.
11. **Junk children.** Unowned trees collect junk (Usenet's `alt.*` has names 21 levels deep). Hide children with no statements from the lens and low counts by default, behind "show all".
12. **Two SDKs, two fold tables** give two ids for one typed word. The shared vectors are the guard.
13. **Everything said here is public and permanent,** including who tagged what. Private tags stay on the device.

## 8. Open questions

| Question | PM default | Who settles it |
|---|---|---|
| One list per word, or a directory of paths per word | the directory: the word page's groups need nothing else (3.4), and it avoids up to d extra list entries per tag | contracts dev, with numbers |
| Number width | widest that needs no new slot | contracts dev |
| Purposes for label, definition, "same as", "moved to", parent | name the smallest set before any lasting deployment | contracts dev proposes |
| NFKC_Casefold or NFC plus lowercase | NFKC_Casefold | SDK dev evaluates; @james confirms |
| Default view for topics: Mine or Everyone | Everyone, as the working default for building (client dev's proposal): lens tier first, public tier labelled, public-tier media not loaded until asked for | @james confirms before launch; it decides what a newcomer sees first |
| What a newcomer's default lens contains | undecided | @james, before launch |
| File name as its own mechanism or the last word of a path | parked | @james, later |
| Settings that inherit down a path | parked in `Ideas.md` | later |

## 9. Work order

Held work is released by @james's yes. Nothing here merges a kernel change without review, and nothing is deployed anywhere lasting.

**Contracts dev:** one design PR with measured numbers on both fee schedules.
1. The topic record and its rule (2.1), with the id independent of author, realm and chain, and registration permanent.
2. The tag statement with its number (2.2), including a negative first statement and a number-only update.
3. An address as a tag target without a record; a home as a parent (C8).
4. The lists of 2.3, with the per-author roll-up list priced first, depths 1, 4, 8, 16, 32 and 64, and the deepest path one transaction holds.
5. The two directories of 2.3.
6. The purposes for topic statements (section 8).
7. Readers: the three views, newest first, duplicates removed, denials as in 3.2.
8. The rebuild-equals-live test, and events that carry the words for indexers.
9. A list of what can't be done in contracts.

**SDK dev:** revise the design in draft PR #36, then build behind it as the contracts land.
1. Fold and the link grammar (sections 5 and 6), with vectors.
2. `planTag`, `planUntag`, `planDeny`, with registration planned automatically and split when deep (pitfall 2); the review shows the price and how many new topics it creates.
3. Reads for the three views, the lens rule of 3.1, the merge of 3.5, word pages, counts, and the display-name order of 3.7.
4. A home view with the owner inserted into the lens.
5. Tag targets: file or revision.

**Client dev:** update `tags.md`, then build.
1. The topic view (exact and roll-up), the word page grouped by place, and the three views with a clear label on the public tier.
2. Tagging with suggestions: existing places for a word, with lens and global counts.
3. "Whose entry is this" on every row that isn't the place owner's.
4. Children listing with junk hidden by default.
5. The number: default 0, "not this" as a negative, an optional size.

**Questions:** design questions go to this session; the integration owner stays the one voice for the work order.
