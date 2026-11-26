# Tag model: working spec, edge cases and pitfalls

**Status:** reference: the working spec for the tag model @james ruled on 2026-11-25. It applies his rulings; where it goes beyond them it says "PM default" and can be overturned. The three dev sessions build from this page; the integration owner hands out the work order at the end.
**Author:** the PM's side session for the tag discussion (Fable 5.2), under @james's instruction of 2026-11-25 to update designs, find edge cases and pitfalls, and pass instructions on.
**Rulings it applies:** `Designs/efsv2/owner-rulings.md`, 2026-09-10 (D-A, D-B, D-C, D-E) 2026-11-25 (T-1 to T-5, view-all, homes follow the lens, the shared tag, depth, newest first) and 2026-11-26 (the fold rule, the everyone's-versions list).
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
  - no white space of any kind, ASCII or not (the fold turns every run of white space into one underscore, so a folded word never has any);
  - no C1 controls, bidi controls, or invisible and format characters, at least as strictly as file names;
  - joiners and variation selectors refused too, provisionally, until the fold rule is confirmed;
  - not starting with `~`, and not `0x` followed by 40 hex digits. This applies to every word in a path, because every word has a root-level page; `/cars/~x` and `/people/0x…` can't exist.
  - These run once per word, on its word page.
- **Punctuation in a word: RULED in principle by @james, 2026-11-26** ("? # etc shouldn't be allowed as they are literally urlencode protected params. Nothing that breaks URLs."), narrowed by him the same day to two tests: a name is safe in a URI, and it leaves EFS delimiters free for URL syntax ("I only care about URI safety and us having some delimiters we can use for URL syntax"). The exact set below is this page's application of that; his words are in `Designs/efsv2/owner-rulings.md`. How it got there: When he chose the fold rule he added a condition: the contracts must ensure "no reserved URL characters and delimiters that we need are allowed in names". As built, a word admits every ASCII punctuation mark except `/` and `\`, including `#`, `?` and `%`, which have a job inside a link: `c#` is a valid word, its link must be written `/c%23`, and a hand-typed `/c#` opens `/c` with no error.
  - **The rule, as applied:** after the fold, the ASCII characters of a word are `a–z`, `0–9`, `-`, `_` and `.`, and nothing else. `~` goes too, anywhere in a word: it is the system's. So `c++`, `c#`, `r&b` and `don't` can't be words; the word is `cpp`, and its display name (a label, section 3.5) says "C++".
  - **Why this and not only `#`, `?`, `%`:** a word then never needs escaping and always means what it shows. Pasted links stop losing a trailing `)`, `!` or `'` and landing on another tag. A `+` in a link option would be read as a space by ordinary decoders. `#tesla` typed out of habit can safely be read as `tesla`. Every punctuation mark stays free for link grammar later (filters, options). Domain names, hashtags and GitHub topics made the same choice; titles with punctuation belong in the display name. The alternative put to him was to keep punctuation and refuse only `#`, `?` and `%`; his answer rules out anything that breaks a URL, and a `+` or `&` breaks one as soon as a word sits in a link's options.
  - **Characters outside ASCII** (evaluated by the SDK dev on every code point of Unicode 18.0 and the letter lists of 906 languages: `sdk-v2` main 4eb1895, `docs/design/word-characters/`; reviewed from the tag side 2026-11-26). After the fold a word is letters, combining marks and numbers of any script, and emoji. Punctuation, symbols and separators are refused, which closes the look-alikes of `/`, `\` and `-` that the fold does not map. Accepted from the evaluation: numbers of every kind (so `二〇二六` works); contextual exceptions for the languages that need them (Catalan `col·lecció`, the name dots of Japanese and Chinese, Hebrew geresh and gershayim, the Tibetan tsheg, and no mixing of the two Arabic-Indic digit sets); cosmetic letters and slash-like overlay marks refused; the emoji set as specified there. Apostrophes stay refused (`don't` is `dont`); the two apostrophe letters U+02BC and U+02BB are letters and stay. The client says which character was refused and offers the word without it; it never rewrites a word silently.
  - **Subdivision flags are refused, not folded** (PM default, 2026-11-26). The ruled fold removes tag characters, which would silently turn the flags of England, Scotland and Wales into one plain black flag. The SDK refuses tag characters before it folds.
  - **What no rule can close:** about 100 ordinary letters that look like an ASCII delimiter (`ノ` like `/`, `ʔ` like `?`). They are different bytes, so no URL or parser is fooled. The defence is in display.
  - **The chain under-refuses, the SDK is exact** (PM default, 2026-11-26). A refusal on the chain is for good: the refused table is part of the word rule's code, so changing one range changes the word Type's id and with it every word's and every path's id (confirmed by the contracts dev, 2026-11-26). A refusal in the SDK can be loosened in any release without moving an id; older clients just hide the newer words. So ASCII is exact on chain, which is what @james's two tests need. Outside ASCII the chain refuses only what no future rule could want inside a stored word: today's classes, the pinned punctuation, symbols and separators, the cosmetic letters and the overlays. It leaves alone the contextual characters and anything a language's own letter list contains; the SDK decides those and applies the contexts. Why: the domain-name rule admits the middle dot for Catalan only. The SDK dev's check of the language lists found it would lock out Venetian `s·c`, Sardinian and Gaelic, and that Occitan's `n⋅h` uses a dot classed as a maths symbol; frozen on chain, none of that could ever be fixed. The list of what the chain leaves to the SDK is 93 characters (`sdk-v2` main cc348bf, `docs/design/word-characters/left-to-sdk.json`). Invisible format characters stay refused on chain even where a language lists one, as today. Offered to the contracts dev, their call on cost: also refuse every assigned character the fold changes (capitals of other alphabets, full-width forms), which is safe for good.
  - **Open for @james (asked 2026-11-26): characters Unicode adds later.** Working default: the chain admits code points not yet assigned, and the SDK refuses them until its pin knows them. New emoji and scripts then work with an SDK release, and no id ever moves. The price: a writer who bypasses the SDK can register a junk word with a not-yet-assigned character; readers hide it, as they hide any word that isn't its own fold. The alternative is that the chain refuses unassigned characters too: every word on chain is clean, and the character set is frozen at Unicode 18.0 for the life of the Realm, since an update would move every id. The tag side, the contracts dev and the integration owner recommend admitting. The SDK dev's evaluation recommended refusing, before the cost of an update on chain was known. Cost of the larger table (1,183 ranges under the working default, about 7.1 KB): about 600 gas more per non-ASCII character (measured by the contracts dev with the real table, 2026-11-26: about 2,000 to 2,020 against 1,408 today for the same characters, eleven search steps) and nothing for an ASCII word, since the table is loaded only at the first non-ASCII byte. The word rule's contract grows to about 8.6 KB of its 19,660. The evaluation's README now puts this choice as the only owner question, with both options and the cost fact.
  - **A word can't end with `.`** (ruled by the integration owner, 2026-11-26, for words and file names alike; @james was told and can overrule). A full stop after a pasted link is the commonest thing an auto-linker trims, so `/inc.` would open `/inc`. `.net` stays valid.
  - **A word can't start with `-`** (PM default, 2026-11-26, on chain). It keeps `-word` free to mean "not" in link and search syntax, which is his delimiter test. `sci-fi` stays valid. On chain it is the word rule's refusal code 9 (8 was taken), built for the contracts' list release with the rest of the ASCII rule; tag words only, a file name may still start with `-`.
  - **RULED by @james, 2026-11-26: Windows' reserved device names are not refused** (`con`, `prn`, `aux`, `nul`, `com0`–`com9`, `lpt0`–`lpt9`), in words or in file names. An app that saves topics to disk renames them.
  - **File names** (`files-name/2`) are outside this page. The two tests cover them too; the integration owner applies them there.
  - It rides the same regeneration as the fold's generator and changes the word Type's id, which is free only before the first lasting deployment.
- **Everything else about folding is the SDK's job** (section 6).
- **Readers hide words that aren't canonical.** The chain can't check case outside ASCII, unassigned characters or compatibility forms, so a careless or hostile client could register a word the SDK's fold would never produce, such as a look-alike of an existing child. Every read that lists words (a topic's children, a word's places) folds each listed word again and skips any word that isn't its own fold, counting it as skipped.

### 2.2 Tags

- **Statement:** a TAG bind on a registered topic or a home, targeting the thing, carrying the number.
- **The role names the thing, and the target must equal it.** A "not this" has no target, so the role is what identifies the thing for both signs. A tag whose target differed from its role would be about one thing by one read and another thing by a different read, so the chain refuses it.
- **A tag on an unregistered topic is refused with a named error.** Never a silent miss.
- **A first "not this" must name something that exists** (requested of contracts step 3b, 2026-11-25): a record or a file already on the chain, or an address. A yes already has to. Since the shared lists arrived, a first "not this" writes a public row, and a row about a thing that isn't there can't be shown. The same holds for a first "hide this name" in a folder or home: the name must be a registered name and the place a real folder or home.
- **Number:** signed, part of what is signed and of what a rebuild reads. Changing only the number is a normal update that keeps history.
  - `n ≥ 0` is the bound state; `n < 0` is the denied state; removing the statement returns to "said nothing".
  - A first statement may be negative (the T-4 spike's "first mask").
  - Width: settled by the contracts spike at −65,536 to 65,535. The protocol defines only the sign. Apps define the size.
- **What can be tagged:** files, folders, topics, addresses, and any existing record or subject of any Type, including Types from other apps (T-1: tags are the system layer; a chess app tags its moves). Tagging an address ("this address is a phishing site") must work for addresses that have never transacted, so an address has to be a valid target without a record. Tagging a specific revision of a file must also be possible, for claims about content that an edit could change.
- **An address can't be the target of a file's current version or of a folder entry.** There it would confirm and never be readable, so the Files validator refuses it with a named error. It is allowed for tags. The validator does not judge purposes it doesn't name, so another app's own kind of link, and a `property` value, may point at an address. (Corrected 2026-11-25: this line first said "for tags only", which was too broad and was built that way in the kernel step's first draft.) A named folder entry pointing at an address (a contacts list) can come later, with its reader.

### 2.3 Lists the index keeps

Every list holds statement sequence numbers, append-only, in time order. A reader decides what is live by reading each statement's current state and number; lists are never rewritten when a tag is removed or flipped.

| List | Per author | All authors |
|---|---|---|
| Exactly this topic | exists today | new: view-all |
| This topic and below (roll-up) | new | new |
| This word, anywhere | new, or derived | new, or a directory of paths per word |

- An entry is appended at an author's **first** statement on (topic, thing), whatever its sign. A later sign flip then needs no list write.
- **The all-authors lists of a place take every author's first yes** (requested of contracts step 3b, 2026-11-25; the first build took only the first statement by anyone). A place's list, and its roll-up at each topic above, gets an entry when a (place, thing) pair gets its first statement of either sign, and another for each author whose first statement on it is a yes. Readers remove duplicates. Two reasons:
  - *Nobody can get in first.* With one entry per pair, whoever speaks first fixes where the row sits in "newest first", even with a "not this". A real tag made later would never appear as new.
  - *A home works as an inbox.* If someone attached `hello.txt` to an address in 2026, a different person's `hello.txt` in 2028 must still show up as new in that address's public list.
  - The lists per author, the list of authors per pair, and "which places hold this thing" keep one entry each. A place's count then counts filings, not distinct things.
- **"Newest first" therefore means most recently first-stated.** Changing a number, or removing a tag and adding it back, does not move a thing to the top. This is deliberate (PM default, 2026-11-25): an author can't bump their own entry up a public view, paging stays stable, and no list is written on a change. "Recently active" ordering is a client or Graph feature. The client labels the order "recently added".
- **Directories, written once at registration and the same for everyone:** the child topics of a topic, and the topics that use a word.
- **"What points at this" is kept per kind of link** (contracts step 3a, 2026-11-25). A file's folder placements, its tags, and the `same` and `broader` statements that name a topic are separate lists, so junk of one kind can't bury another. Nothing on chain lists "everything pointing at this, of any kind"; a reader asks per kind, and indexers get the rest from events.
- **Every statement is findable.** Each statement appears in at least one all-authors list reachable from the thing it is about, whatever its sign. For a tag that thing is the one its role names, because a "not this" carries no target. A lone negative has no entry in today's "what points at this" list, so one more small list covers it, for every kind of target.
- **A list added later is built only from what never changes** (contracts build design, 2026-11-26, proposed): the statements themselves in order, records, and other lists being built in the same pass. It can't read a running count kept by an existing list, because that count is today's value, not the value at the time of each statement. So a later "how many things currently apply here" would have to rebuild its own per-thing counts. Adding lists later is paid for by one walk over all history, however many lists it builds, so later additions should be batched.
- **A rebuild must give the same result whenever it is run** (found in review of the build design, 2026-11-26; built as contracts build step 3a, branch `fable/2026-11-26-index-build-3a`, head 5dfb146, read and accepted from the tag side the same day). A rebuild does not re-run the validator. So the rule is: list-building code reads every fact as it was at the statement being replayed, and never takes a fact from a validator rule. The one place that needed it was the roll-up: a rebuild now treats a tag's subject as a topic only if the topic was registered strictly before the tag, which is exactly what the live code sees. The contracts' build design lists every other read and why it is safe.
  - On a Realm that admitted tags before it had the Files validator, a tag made before its topic existed is never rolled up, live or rebuilt, and its author can't fix that later (a first statement is filed once). The roll-up's "distinct things" count is then a floor, not exact. No planned Realm starts that way.
  - Still open for later lists: a validator unit's own list-building hook can't tell a rebuild from live use, so the rule for hooks (compare every time, or add a flag) must be written before the first such unit ships.
- **Rebuild equals live.** Lists derive only from stored records and statements. A test must rebuild the index and compare. For a list added later this is now tested (contracts build step 3b, branch `fable/2026-11-26-index-build-3b`, head 6e2b0f9, read and accepted from the tag side 2026-11-26): a test-only index adds "everyone's versions of one file" in a new store, builds it from history, and ends up equal, list by list, to a Realm that kept it from the start. It is an example, not a product list. The cost of a build is measured (step 4, head dd39873; re-measured at the final step, head 9004ed6): see the "everyone's versions" row in section 8. One more cost of any later list: with today's work model it makes every other statement reserve a little more gas, so the largest batch of lone negatives in one publication drops from 38 to 32.
- **A topic must be registered strictly before a tag that uses it,** not merely in the same publication. The contracts spike caught a tag accepting a topic registered later in its publication, which would have missed its roll-up silently.
- **Counts** are one read each (contracts step 3c, built 2026-11-25). A place has two: filings, and distinct things ever filed there, so many people tagging one popular thing don't inflate "4,210 items". A (place, thing) pair has two: its authors, and how many of them currently say yes. The place counts include things nobody says yes to any more, and removed and negative statements. Treat them as "about". In a roll-up the distinct count is of (topic, thing) pairs below, so a thing filed under two child topics counts twice.

## 3. Reading

### 3.1 The lens rule for tags (PM default: priority)

For a thing X in topic T, walk the lens in order. The first author with a stance on (T, X) decides: a non-negative number shows X with that number, a negative number hides it. "Public" at the end means any author. An UNKNOWN read never counts as "said nothing".

- **The views are one rule.** Mine is this walk over the lens alone. Everyone is the same walk with "public" at the end: when nobody in the lens has a stance, the row shows if anyone says yes. Raw applies no rule. So everything Mine shows, Everyone shows too.
- **An earlier lens author always beats a later one** (PM ruling on the contracts readers, 2026-11-25). In a roll-up, where `/cars` shows a thing filed under `/cars/tesla`, each lens author is asked two things in turn: do you say "not this" for it at `/cars`, and what do you say where it was filed? The first answer found decides. Someone further down your lens can't hide what you filed yourself, and your own "not this" at `/cars` keeps a thing off that page even though you filed it below.
- **Every public row says who decided it:** the lens author and their number, or nobody in the lens, which is the public tier. The client labels public-tier rows one by one.

### 3.2 Denials

- Only lens authors can hide things. A stranger's negative number never hides anything from anyone else.
- **A stranger's "not this" can neither hide a row nor add one.** Raw shows every row. Everyone shows a row when someone says yes, and leaves it out when nobody does. The chain keeps, for each (place, thing) pair, the number of authors who currently say yes (contracts step 3c, built 2026-11-25), so this is one read and no scan of authors decides it. A row must never be left out because a reader stopped reading authors early; otherwise a few negatives posted ahead of the first real tag would hide it cheaply. The row shows "1,000 say yes" from that count; the "no" side is read from the authors and marked when not all were read. (Corrected 2026-11-25: this first said Everyone shows a row whatever its stances, which would let a "not this" put a thing into a topic's public view.)
- A lens author's "not this" counts **at the place being viewed and at the topic the entry was filed under**, in Mine and in Everyone, in the order of 3.1: it hides the thing unless an earlier lens author says yes where it was filed. A denial does not travel down to child topics.
- A denial of `/cars/tesla` says nothing about `/cars`. The thing still shows under `/cars` if another statement puts it there.

### 3.3 Roll-up and duplicates

- A thing filed at `/cars/tesla` and at `/cars/ford` appears twice in `/cars`'s list. Readers remove duplicates by thing, across pages, in Mine and in Everyone. The row shown is the newest filing that shows, and it names the topic it was filed under; "where is this filed" lists the rest. A resumable cursor can only remember a bounded number of things, so a result says whether its de-duplication is complete or bounded; an in-memory iterator for one scrolling view is always complete.
- **Check for a yes before removing duplicates.** If a thing is filed under two child topics, and nobody says yes at the newer filing but someone does at the older one, it still shows, through the older one. A reader that marks a thing as seen before checking it would drop it silently.
- **A short page is not the end.** Rows nobody says yes to, and repeats, are skipped, so a page can come back with fewer rows than asked for, or none, while more remain. Every paged result says whether the list is finished and where to resume. A caller sets two limits, rows wanted and entries to read, and the read stops at whichever comes first. One number can't bound both, because skipping a padded stretch is cheap and a shown row with a large lens is not. Anyone can pad a list with rows that get skipped, at about the price of a tag each. So a skipped row must cost one read whatever the size of the lens: a reader checks the yes count first and asks the lens only about rows someone says yes to.
- **A reader answers from a list only when that list is complete** (ruled by the tag PM for the contracts dev, 2026-11-26; built in the contracts final step, branch `fable/2026-11-26-final`, head 9004ed6, read and accepted from the tag side). If the index says a list is unknown or only partly covered, the page is UNKNOWN, with no rows and no counts. A page marked "partial" is not enough, for two reasons found in the reader code. Every unfinished or resumed page is already marked partial, so on a listing longer than one page a partly covered list would look exactly like a complete one. And a reader decides rows from the list's yes counts, which nobody has defined for a partly covered list. Nothing changes today: the index in use is always complete. A dropped list reads UNKNOWN too, never empty (contracts build step 3b).
  - **Every refused page is the same shape:** no rows, no counts, no place to resume from. This holds for every kind of refusal, not only UNKNOWN.
  - **A page's own "partial" now means paging only:** the page did not start at the beginning or did not reach the end. It no longer says anything about the lists.
  - **A shortcut may read a list to save work, but only when that list is complete.** Otherwise it asks the ledger's own statements, which need no index. "Mine, this topic and below" does this with the list of a position's authors, so that list's coverage never changes its answer.
  - **Check coverage before checking the data.** The first build of the "every place this thing is tagged" view checked a count before the coverage, so a dropped list would have crashed the call instead of answering UNKNOWN. Caught in review and fixed. The tests had missed it because their fake unknown list still carried real counts; they now also use the reply a list the index does not keep really gives (zero counts, no entries). Any later reader should be tested the same way.
- Roll-up follows the path only. "A Model Y is also electric" needs a second tag or the optional parent layer.

### 3.4 Word pages

`/tesla` lists every use of the word, grouped by place, with counts: `/cars/tesla`, `/people/tesla`, plain `/tesla`. The client must not show it as one undifferentiated list.

- **A group is a place whose own word is the word.** `/cars/tesla/model_y` belongs to the group `/cars/tesla`, and that group shows the place's roll-up. (Client dev's call, 2026-11-25; agreed.)
- **A place that lies below another group is not a second group.** `/tesla/cars/tesla` is already inside plain `/tesla`.
- **Group order:** places the lens has used first (by lens count), then the rest by global count, largest first. Both counts are shown.
- **Consequence for the plumbing:** these groups are exactly the directory "topics that use a word", and each group's contents are that place's roll-up list. No view needs a separate list of items per word. Prefer the directory unless the measurement shows the per-word item list is nearly free.

### 3.5 Synonyms and moves

- **Two levels.** Word level (`car` = `cars`, `汽车` = `cars`) applies to every path using the word. Path level (`/cars/tesla` = `/companies/tesla_motors`) joins two specific places.
- **How the two levels are told apart** (a word page is also a root-level topic): "same" between two word pages is the word-level synonym, and it also makes the two root places the same. Between two paths it joins those two places only. Between a word page and a path it joins the root place and that one path, with no word-level effect.
- **The chain checks both ends.** A first "same" or "broader" statement is refused unless its subject and target are both topics and are different topics. `property` is not judged: any subject, and a value that is a record, a file or an address.
- **They never merge ids.** The reader gathers the lists and merges them in time order, removing duplicates. Each synonym costs one more list read.
- **Synonyms come only from the lens,** never from the public tier. A stranger can't merge another topic into everyone's view. With an empty lens there are none.
- **A word-level synonym reaches multi-word paths one swap at a time** (answer to the SDK dev, 2026-11-26). `/car/tesla` joins `/cars/tesla`'s view when `car` = `cars`. One swapped word is one hop, like one path-level synonym, so `/car/tesla_motors` is two hops away. Only registered paths count, and the last word is tried first when the cap forces a choice.
- **Limits:** at most 4 hops, cycle-safe, and at most 16 lists per view (PM defaults). A view that was cut says so.
- **"Not this" in a merged view** (answer to the SDK dev, 2026-11-26). Each synonym's list is decided at its own place, so a lens author's "not this" at another synonym hides only that synonym's row. A lens author's "not this" at the place being viewed hides the thing from that page wherever it was filed, in the lens order of 3.1. If I marked a photo "not this" at `/cars`, it stays off my `/cars` page even when someone tags it at `/autos`. The SDK applies this to rows that come from synonym lists, because the chain's reader for a synonym doesn't know which page is being viewed.
- **A padded synonym list can't stall the merge.** Every page says how far down its list it has read, whether or not it returned rows (the readers' `frontier`, contracts 2026-11-26). The merge can then show a newer row from another list without waiting. A zero there never means finished by itself; only the page's own "finished" status does.
- **A synonym list that can't be read** makes the page partial and is named as missing. It never blanks the view and never passes as complete.
- **Finding them from either side** uses the topic's "what points at this" list for `same`, and the one for `broader`.
- **Display name of a path segment:** a path-level label from the lens, else the word-level label in the reader's language, else the word.

### 3.6 Curating a topic's children

Tagging a child topic into its parent curates the listing: a negative number hides the child for readers who include that author, a positive number ranks it.

- **Order:** children a lens author listed (by number), then children a lens author has filed something under (by lens count), then the rest by global count.
- **Junk rule, an SDK default so clients agree:** a child with no statement from the lens needs tags from at least 2 different authors to be shown without "show all". Statement counts alone are too easy to inflate. How many rows to show is each client's choice (the EFS client uses 8).
- **Hiding a child hides what is filed under it** (PM default, 2026-11-25). If a lens author marks `/cars/tesla` below 0 as a child of `/cars`, that reader's roll-up of `/cars` leaves out everything filed at or below `/cars/tesla`. The SDK applies this, because it already knows each entry's path. The chain's reader does not have to.
- **A big directory can't be ranked in one read.** The children read scans a bounded number of entries and says so (PARTIAL), never implying it saw them all.

### 3.7 Names of things in a topic

A tag has no name. The display name of a file shown in a topic is, in order: the name its tagger gave it in their own home or folders; the name its creator gave it; the first name from the lens; else its media type and a short id. Files in a topic open by permanent link.

### 3.8 Remove and hide are different

Removing your own entry releases it, so the next author in the lens shows through. Hiding masks it, which stops the search. At a shared place, removing your `pet.jpg` must not hide everyone else's (contracts design, finding 6). The SDK's folder operations already work this way (`sdk-v2` `74a4d5e`: remove releases, `hide: true` masks, a review carries what shows afterwards), and the client has "Remove" plus an owner-only "Remove and block this name".

**The invariant** (contracts dev's wording): an author can always mask or release a binding of theirs that already exists, and no validator may refuse that. A validator may refuse an action that asserts something, and an action that creates a new position for its author, of either sign.

## 4. Homes

- The id derives from the address alone.
- Named entries and tags both hang off a home. A home needs no record and no registration.
- **Viewing a home** uses the lens `[reader, the home's address, …the rest, public]`.
- **A contract's home:** a contract's author identity is derived differently from a key's. The lens must insert the right identity for the address, and both when an address could act as either. A Safe's home is a test case.
- **Always show whose entry it is** when it isn't the home owner's. A reader's own `pet.jpg` at someone else's address will otherwise look like the owner's.
- ENS names are display only and never part of an id or a permanent link.

## 5. Links

| Form | Meaning |
|---|---|
| `/<word>/<word>/…` | a topic; words are folded before lookup |
| `/<word>` | the word's page |
| `/0x<40 hex>/<name>/…` | a home, then folder and file names, which keep their case. The lens defaults to the address; `?lens=` overrides it |
| `/~efs/o/<id>`, `/~efs/v/<id>` | permanent object and revision links (as built) |
| `/~efs/o/<folder id>/<name>/…` | names below any folder, reached by its permanent link. The folder's creator is in the lens unless `?lens=` says otherwise |

- Trailing slashes are ignored. Empty segments are refused. Percent-decoding happens before folding.
- First segments starting with `~` are reserved for the system.
- **One grammar for the client's links and for `web3://` addresses** (2026-11-25). A link means the same thing in both. The contracts gateway used `/0x<address>/…` for "the shared root folder, seen through this author"; it now means the home there too.
- **The realm's shared root folder has no link of its own** (decision sheet). It is reached like any folder, by its permanent link with names after it. A named shared root would be a second shared tree competing with topics.
- **A path that starts with a plain word is a topic everywhere.** The gateway does not serve topics yet; it says so and never serves a folder at such a path, so no link made today changes meaning later.
- Parked: whether a file name is its own mechanism or the last word of a path. Until then no link addresses a named file through a topic.
- **Characters kept free for link syntax** (direction from @james, 2026-11-26: links may carry syntax in the path, such as a mark for incoming and outgoing edges in a search, or core actions, "instead of query string for everything"). Nothing is designed yet. What the word rule of 2.1 already secures:
  - **In a topic path, every punctuation mark except `-`, `_` and `.` is free**, because no word can contain one. Fourteen of them can be written in a URL exactly as they look, with no escaping, by RFC 3986: `! $ & ' ( ) * + , ; = : @ ~`.
  - **A segment that starts with `~` is never a word**, so `~` segments can carry actions anywhere in a topic path, as `/~efs/…` does at the front today.
  - **`<` and `>` can't be used as written** (he offered them with "maybe"). A browser rewrites them as `%3C` and `%3E`, chat apps and Markdown end a link at them, and HTML has to escape them, so a link with one would be neither readable nor safe to paste, which is his own first test. The same job can be done by characters from the fourteen.
  - **Pitfall: file names share these links.** A file name sits in the same paths, and as built it may contain most punctuation. Syntax that should work in a file's path too needs a few characters that file names give up. **Applied by the integration owner, 2026-11-26:** file names refuse `#`, `?`, `%`, `/` and `\` (they change what a link means), `<`, `>`, `"` and `|` (kept free as delimiters, though not usable as written), `:`, `*` and `;` (free delimiters that are legal as written), and a trailing `.`. They keep spaces and `& ( ) ' , + = ! @ $ [ ] { } ^ ~` and the backtick, which real names use (`~$Budget.xlsx`, `Sale!.png`). So syntax that must work in a file's path has `:`, `;` and `*` to use, and the `~efs` prefix for actions, since a file name may start with `~` but never with `~efs`. A `;key=value` form needs only `;` reserved: a segment splits at its first `;`. The tag side's wider proposal (`=`, `!`, `$` as well) was not taken, for the real names it would cost.

## 6. Folding (the rule that freezes)

- D-B stands: fold in the SDK and in link resolution, before hashing. The chain checks only the ASCII rules in 2.1.
- **Pin one Unicode version and refuse characters not assigned in it.** A later version then can't change an existing id.
- **RULED by @james, 2026-11-26: the fold is Unicode's full matching rule (NFKC_Casefold)**, rule B of the SDK dev's evaluation (`sdk-v2` main, `docs/design/fold-evaluation/README.md`). It also folds full-width letters and ligatures, and Unicode guarantees it stays stable for assigned characters. It refines D-B's wording ("NFC → lowercase"); white space to underscore stands. The evaluation's two details proceed as recommended, as engineering: joiners and variation selectors are removed by the fold when the id is worked out (the display name keeps what was typed), and the pin is the newest Unicode version at release with the tables inside the SDK. His condition on the ruling is the punctuation rule in 2.1.
- **What has to be built for it:** the SDK's fold (it replaces the interim fold and the "stable word" check below); one generator that produces the chain's refused table, its test vectors and the SDK's tables from one pinned Unicode version (contracts Q53); the word rules run again after the fold, since a compatibility form can fold into a refused character (`cars／tesla`, `～efs`, a full-width `０ｘ…`).
- **Until the ruled fold is built, an interim fold changes only words that are entirely ASCII** (PM working default D15, 2026-11-26; SDK branch `feat/2026-11-26-ascii-fold`, held for one fix): trim, a run of spaces or tabs becomes one underscore, and `A–Z` becomes `a–z`. Both candidate rules agree on those words, and D-B as ruled includes the underscore, so the folded word won't change at the ruling. A word with any non-ASCII character is left exactly as typed, because the candidates differ there: `Straße` is `straße` under one and `strasse` under the other, and lowercasing only its ASCII letters would give `École` a form neither rule produces. The same fold runs on a typed link, and the app shows what a word was saved as.
  - The space rule takes the underscores next to it: `model _ y` is `model_y` under both rules, not `model___y`. The test is the SDK fold evaluation's own vectors: every all-ASCII case must match both rules.
  - What this secures is a word's text, not its id. The chain's refused table is part of the word Type's id, so every topic id may change once more when that table is regenerated.
  - Today the chain admits `École` and `Ｔesla` as typed (it can only refuse ASCII capitals). A guard on writes, until the ruling, refuses a non-ASCII word unless it is the same under both rules: already in composed form, unchanged by lowercasing, no character that Unicode's matching rule would change, no private-use or unassigned character, not starting with a combining mark. A shortcut of "uppercase then lowercase" is not enough: it lets through Greek words ending in ς and lowercase Cherokee, and wrongly refuses the Turkish dotless ı. The guard uses the browser's Unicode data, so it is exact only for that version; the pinned version comes with the ruling.
- **Vectors shared by the contracts and the SDK**, including words that must be refused.
- **One Unicode version, one generator.** The chain's refused table is part of the word Type's id. It and the SDK's tables must be generated from the same pinned Unicode version by one tool before the first lasting deployment (the contracts' first table used 15.1, the SDK's evaluation 18.0).
- **The same rule settles whitespace** (trim; a run of whitespace becomes one underscore) and **refuses zero-width and bidi control characters** rather than stripping them.
- **JavaScript has no full case folding, and engines carry different Unicode versions** (SDK dev, 2026-11-25). Either rule needs pinned tables shipped in the SDK; the evaluation reports the size cost and keeps fold behind its own export.
- Look-alike letters can't be prevented. The client warns on mixed scripts.

## 7. Pitfalls, in the order they are likely to bite

1. **A lens view with roll-up is the default view and the expensive one.** Without per-author roll-up lists, "what did my people file under `/cars` and below" means filtering the all-authors list or walking every child topic. Price the per-author roll-up list first.
2. **Depth multiplies everything.** A tag at depth d appends to up to 4d lists, and a new path registers up to 2d records. A first use of a deep new path may not fit one transaction. The SDK must split registration into earlier parts, which are harmless if the save is abandoned. If the deepest path that fits is under 64, the contracts dev comes back with options; never skip levels silently.
3. **Silent absence.** Any path where a tag lands but a list misses it is the bug class EFS keeps hitting. Refuse, or list; test rebuild against live. Its newest form is a public page that comes back short because skipped rows used up the read. It must say "more to read" and never look like the end (3.3).
4. **A root word that looks like an address or starts with `~`** would shadow a home or system link. Refuse on chain.
5. **Fragmentation is certain.** `/cars/tesla`, `/autos/tesla` and `/vehicles/cars/tesla` will all exist. The defences are the tagging suggestions (existing places for the word, with counts across everyone), word pages and synonyms. Suggestions must use global counts; people who see only their own circle's choices don't converge (Centola and Baronchelli, 2015).
6. **Counts can be gamed.** Global counts drive suggestions, and a spammer can inflate them at about one tag's gas per entry. Show the count from the reader's lens beside the global one.
7. **Newest-first public views reward the latest poster.** Under "public", whoever posted last is shown first. The lens is the defence; the client labels the public tier clearly. A new account's first yes on an old thing also brings it back to the top, at the price of one tag per account, which is what one more junk row costs. That is accepted (2026-11-25): listing each pair only once would let a single early statement keep a thing out of "new" for good. One edge: an author whose first statement on a pair was a "not this" and who later changes it to a yes gets no new entry. The pair is already listed, so nothing is missing, but it does not show as new.
8. **Frozen mistakes.** A popular path with a typo or a dated parent is permanent. "Moved to" is the only repair, and it works only for readers whose lens includes someone who said it.
9. **Tag drift.** A tag on a file outlives edits to the file. Safety-type tags may need to target a revision. The SDK takes either; the client chooses per tag.
10. **Newcomers have no curators.** With an empty lens there are no synonyms, labels or hidden children. What the default view contains is undecided and matters at launch.
    - On the local test chain the lens is not empty: a tag page reads in "you, then the deployment's default lens", and that default is the seed author (the persona named Satoshi). So every persona sees Satoshi's names, synonyms and hides, and nobody else's. PM working default (D16, 2026-11-26): keep that, and have the page say whose curation applies. Putting every persona in everyone's default was rejected: one persona's "not this" would then apply to all, which hides the rule being tested.
    - A tag with no name from the lens shows its path words, so an empty lens degrades to plain paths, never to blank or to a stranger's text.
11. **Junk children.** Unowned trees collect junk (Usenet's `alt.*` has names 21 levels deep). Hide children with no statements from the lens and low counts by default, behind "show all".
12. **Two SDKs, two fold tables** give two ids for one typed word. The shared vectors are the guard.
13. **Everything said here is public and permanent,** including who tagged what. Private tags stay on the device.

## 7a. First measurements (contracts spike, 2026-11-25, before its integration pass)

- **Per-author roll-up:** 35k gas per level for a new list and 23.5k for an existing one today; about 133k and 38k after Glamsterdam.
- **Depth:** a tag on a new 64-word path costs 4.7M today. Registering a brand-new 64-word path takes 2–3 transactions. No depth cap near 64 is needed.
- **"Anyone's at this name"** is flat: 88k at 3 authors, 90k at 300.
- **"My lens, this topic and below" grows with the lens:** 283k for a page of 10 with a lens of 1; 633k with a lens of 8; 4.1M with a lens of 64; 15M for a page of 50 with a lens of 64. The SDK adapts its page size to the endpoint's limit, and a call that runs out of gas is UNKNOWN or PARTIAL, never an empty page.

After contracts step 3c (2026-11-25, branch head `28c6081`, the dev's own measurements):

- **First tags in one publication.** At depth 64: 8 when the topic's lists already exist (the same after Glamsterdam), and 3 when each tag is on its own new path (5 after Glamsterdam). At depth 8: 35 and 18 today, 41 and 27 after Glamsterdam. The SDK splits a larger batch.
- **A later person's first yes** on an existing (topic, thing) pair costs 313k today on a one-word topic. It now also pays the shared roll-up at each level above (15k where that list exists, 27k where it is new), on top of the person's own roll-up (23k or 35k).
- **Turning a tag off or back on** costs about 15k more than before, for the yes count.
- **Later statements in one publication** (contracts bundled release, 2026-11-26, `contracts-v2`, branch `fable/2026-11-26-bundle`, head d83935e; accepted by the integration owner and from the tag side the same day, not yet merged when this was written). Before the index runs, the kernel reserves gas for it. The released reservation formula charged a later statement 2 to 4 times its spend after Glamsterdam, and too little for some later statements today. The new formula ("formula 3", `docs/WORK-MODEL-V3.md`) charges each statement one of three rows:

  | row | which statements | new slots | rewritten slots | compute |
  |---|---|---:|---:|---:|
  | first | a person's first statement at a position, yes or no | 5.5 | 2.0 | 44,000 |
  | re-bind | an edit, a folder re-bind, a tag's number change | 2.0 | 4.0 | 42,000 |
  | other later | a removal, a release, a restore; every withdrawal after a publication's first | 2.0 | 5.0 | 85,000 |

  Largest publications with it, today / after Glamsterdam (the released figures in brackets): removals and releases 58 / 55 (64 / 44), restores 51 / 51 (60 / 41), number changes 62 / 64 (60 / 41), folder re-binds 62 / 61 (60 / 40), edits 24 / 28 (24 / 23), lone negatives 38 / 53 (38 / 50), new files 10 / 12 (unchanged). First tags are unchanged. Today's removals and restores get smaller because the released figures were planned on a reservation below the real spend. The SDK reads these sizes from the gas model and splits a larger batch.
  - **What the reservation covers: one author's list of up to 1,024 entries at one place** (ruled by the integration owner, 2026-11-26). A place is one exact topic, address or folder. A removal, release or restore has to find its entry in the author's list there, which costs one more read each time the list doubles (about 2.2k gas within one place, 4k to 5k across places), and across different places each one rewrites that place's list head again. Measured at the limit, the reservation is 1.06 times the spend today and 1.05 after Glamsterdam. It still covers at 4,096 entries and stops at 4,097. Re-binds never search, so they are covered at any length. Longer lists are ordinary (a large folder or import, a curator or bot, a moderator's "not this" list); such a statement is refused only if sent with the bare minimum of gas, and the SDK sends at its estimate times 1.25. Not lasting: the search and the rows both belong to an index generation.
  - **Open: a yes after a lone no** (found reading the bundle from the tag side, 2026-11-26; computed from the measured rows, not yet measured). It is a restore, but it is that binding's second statement, so it opens one more slot than the restore the limit was tested with (3 new slots, not 2). Computed share of spend covered at 1,025 entries across places: about 0.96 today; after Glamsterdam it is unchanged at 1.05, because a new slot and a rewrite cost the same execution gas there. Short lists are covered. Harmless for the same reason as above. Ruled by the integration owner the same day: the documents name the exception now, with the measured figure pinned by a test, and the row's new-slot count goes to 3.0 at the next regeneration of the release (that costs today's removal and restore batches a few statements). The contracts dev measures it first, at short lists, 256 and 1,025 entries on both fee schedules, together with how far the gas estimate under-predicts it, because the SDK checks its safety margin against the estimate's stated worst error and that figure leaves this case out.
  - **The gas estimate knows about list length too** ("list tiers" in the gas model). A later statement is priced by the author's entry count at its place: a known count of 48 or fewer is the short tier, anything longer or unknown is priced as a 1,024-entry list. The count comes from `TopicLookupReader.entryCount`. It is the author's own list, so only that author's own first statements at the place change it. SDK v0.1 prices every later statement at the long tier (integration owner's ruling). Re-binds have no tier.
  - **Two statements at one position in one publication** are both reserved by the head's state before the publication. The second is really a later one, so it can be reserved slightly short. Harmless, and outside what the reservation claims.
  - **A later statement can add one lasting slot.** Each statement is appended to that binding's history. A lone first statement sits in the list's head; from the second on they are stored five to a slot, so a binding's 2nd, 6th and 11th statements open a new slot (a re-bind also adds the new target's "what points at this" entry). After Glamsterdam each new slot costs 97,920 of state gas on top.
  - **A limit to remember: one purpose only.** The formula has one extra charge for a single purpose, set to zero in this release. It is what lets the everyone's-versions list, if kept, be paid for by file-version statements alone. An app's own list-building hook for its own purpose is a second such cost. If file versions hold the slot, the first such hook is charged to every purpose or needs another formula change, which is a kernel change.
- **Bringing an old thing back to the top with a new account** costs 683k for one thing, or 336k each when the new account does 64 things in one publication. That is about the price of any other junk row, and each account can do it once per thing.

After contracts step 4, the readers (2026-11-25, branch head `b163514`, the dev's own measurements):

- **A padded row costs a reader about 36k gas, whatever the lens size.** The first build cost 1.56M per padded row at a lens of 64, because it asked the lens before reading the yes count.
- **Rows per call under a 10M gas cap:** page × lens up to 760 for Mine at one place and 312 for its roll-up; 688 and 320 for Everyone. At a lens of 64 that is 15 rows per call at one place and 5 for a roll-up. The roll-up is dear because each shown row asks the lens about the place being viewed. Two exact shortcuts are planned for the release step, so the SDK reads the bounds from the gas model and doesn't hard-code them.
- **Lookups are flat:** "who has this name here" costs 363k for a page of 10 whether 3 or 300 people have it, and a count costs 85k on a place of 3 items or 2,000.
- **The gateway does not yet serve a file by its permanent link** (it did not fit the contract's size budget), nor a revision link. Until it does, a file found through a topic is opened through the SDK's reads.

After the contracts release step (2026-11-25, branch head `8fc2099`, the dev's own measurements; this replaces the roll-up bounds and the gateway line above):

- **The roll-up check is nearly free now.** Two shortcuts that change no result skip it when nobody has said anything about the thing at the place being viewed, and for lens authors who have hidden nothing there. A roll-up page of 10 at a lens of 64 costs 4.80M gas and a page of 50 costs 11.9M, within 3% of the cost before the check existed. Roll-up bounds under a 10M cap rise to page × lens 416 for Mine and 408 for Everyone.
- **The gateway serves a file by its permanent link and a revision by its link.** A file link shows its creator's current version unless `?lens=` says otherwise; a revision link gives exactly those bytes.

## 8. Open questions

| Question | PM default | Who settles it |
|---|---|---|
| One list per word, or a directory of paths per word | **settled: the directory.** Round one measured per-word item lists at about the cost of the roll-up lists again; the directory is the existing reference list and costs nothing extra | contracts dev, 2026-11-25 |
| Number width | **settled:** −65,536 to 65,535 | contracts dev, 2026-11-25 |
| Purposes for label, definition, "same as", "moved to", parent | contracts dev's proposal, agreed 2026-11-25: `property` (one value per author per key: a label per language, the definition, "moved to"), `same`, `broader`. `property` must work on any kind of subject (a topic, a home, a file, a folder); it is where an address's display name and inherited settings would live. A later many-valued relation needs no release (a purpose is only a constant; the kernel and the per-author and "what points at this" lists accept any purpose), so no generic `relation` purpose is added | contracts dev, settled 2026-11-25 |
| NFKC_Casefold or NFC plus lowercase | **ruled: NFKC_Casefold** | @james, 2026-11-26 |
| Which punctuation a word may contain | **ruled in principle: nothing that breaks a URL or an OS file path.** Applied as letters, digits, emoji and `-`, `_`, `.` only, no trailing `.` (section 2.1) | @james, 2026-11-26; the SDK dev evaluates the non-ASCII side |
| Characters Unicode adds after the pin | the chain admits them and the SDK refuses them until its pin knows them, so no id ever moves (section 2.1) | @james (asked 2026-11-26); tag side, contracts dev and integration owner recommend admitting |
| Default view for topics: Mine or Everyone | Everyone, as the working default for building (client dev's proposal): lens tier first, public tier labelled, public-tier media not loaded until asked for | @james confirms before launch; it decides what a newcomer sees first |
| What a newcomer's default lens contains | Lens only, never the public tier for names, synonyms or hides. Order: the reader, a home's owner, curators the reader added, the app's list, the deployment's list (the seed author only). The reader can see and edit it | @james, before launch: who is on the list, and whether the project or each host names them |
| File name as its own mechanism or the last word of a path | parked | @james, later |
| Settings that inherit down a path | parked in `Ideas.md` | later |
| An all-authors list of everyone's versions of one file | **RULED by @james, 2026-11-26: keep it from the start** ("we definitely need a good 'show all' view from the start"), as a list of its own. What follows is how the question got there. First deferred: a later index generation can add it and backfill it exactly from the kernel's record of statements. **Release gate:** the build-from-history step is specified but not written (generation 1's build refuses), and adding a generation is only possible until a Realm is frozen. It must be written and tested before any freeze. The step is now designed (`contracts-v2`, branch `fable/2026-11-26-index-build-design`, `docs/INDEX-BUILD.md`, a proposal with no code). Its estimate for this list on a Realm of a million files was about 290B gas today and 390B after Glamsterdam. **Built and measured 2026-11-26** (build steps 3b and 4, read and accepted from the tag side; re-measured at the final step, head 9004ed6, where a build call's fixed cost fell): 478B today and 576B after Glamsterdam, in about 28,500 full transactions; per file 478k against 30k to 51k to keep it from the start (9.3 to about 16 times; 3.8 to about 5 times after Glamsterdam). The first measurement was 485B and 582B. **Final figures** (re-measured with the bundled release; Q52 closed on contracts main c5cb09e, read 2026-11-26): 479k per file to add later today and 578k after Glamsterdam, against 25,675 to keep it in the store a file-version statement already writes (113,695 after Glamsterdam: 15,775 of execution plus 97,920 of state gas), or 51k (150k) in a separate store. That is 9.3 to about 19 times as much today and 3.9 to about 5 times after Glamsterdam. Keeping it is about 1.6% of creating a file today (1.65M) and about 2% after Glamsterdam (5.79M). 90% of the price is reading history back, including everything the list ignores: a tag costs 56k to walk past, an edit 91k. So a list can be added later only while a Realm is small, and leaving one out is permanent for a large Realm. Keeping a list can be undone, since a later index can stop keeping it. The recommendation changed to keep it from the start, and @james ruled so (decision sheet). If kept, it should be a list family of its own in the first index's store, so it can be dropped cleanly later. The reason, checked against the code 2026-11-26: the index reports whether a list is complete per family, not per purpose, so entries for file versions kept inside the existing authors-of-a-position family could never be dropped without that family answering stale counts as complete. Measured in trial copies the same day (contracts branch `fable/2026-11-26-formula-v3-design`, head c11c47b): 620 bytes as its own family against 179 inside the existing one; it fits once the work model is served from a data contract (about 700 bytes left). Same meaning as the existing family: one entry per author's first statement of either sign, and a count of the versions standing now | contracts dev, 2026-11-25 and 2026-11-26; @james ruled 2026-11-26 |

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
