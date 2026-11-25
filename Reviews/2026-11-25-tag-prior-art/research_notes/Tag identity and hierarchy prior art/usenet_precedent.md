# Usenet newsgroup naming as precedent for ownerless hierarchical topic names

Research date 2026-11-25. "P" = primary (contemporaneous posting, RFC, config file, official notice). "NP" = near-primary (later first-person account or participant FAQ). "S" = secondary. The ISC `active` and `control.ctl` counts are my own counts of files I downloaded on 2026-11-25.

## 1. The Great Renaming (1986–87): who decided, mechanics, lingering, loss

### Takeaway
A small backbone group proposed the new names and the main admins carried them out, using newgroup/rmgroup plus a per-site old→new alias file. The new names were set by negotiation and by cost: which hierarchy a group landed in decided who would carry it. Old names were removed within months. Old *threads* lingered only through local aliasing.

### Cited Findings
- **Reorganizing was already hard in 1985.** Spafford's Aug 1985 proposal to deepen names (net.bio→net.sci.bio, net.columbia folded into net.space, net.abortion→net.flame.abortion) drew objections. Critics said "outline form" naming mainly helps bulk-unsubscribe but costs typing. Mark Horton said net.columbia "has a strong emotional support" and that "politically it would be very hard to even change the name" (P) — [Toronto backbone-list archive](https://ftp.cs.toronto.edu/doc/usenet.hist/rename).
- **Chuq Von Rospach's Mar 1985 draft gave the procedure.** Move about 10 topics at a time (doing it all at once "would be foolhardy"), announce dates, have major sites send coordinated newgroups, install aliases on 2.10.2+ software, rmgroup old names about two weeks later. Remove groups only after six months without traffic, with no automatic sunset (P) — [net.news](https://groups.google.com/g/net.news/c/VlDhiCyknOQ).
- **A precedent: fa.*→mod.* in Oct 1985.** Fair proposed the names and Spafford announced 18 newgroups, saying "by the end of the month, no 'fa' group should still exist." Fair wrote: "The only issue I see as controversial are the actual names" (P) — [Brinkley archive, Lesser-Renaming.txt](http://web.archive.org/web/2005/http://www.panix.com/~josephb/newsgroups/history/rename-rmgroup/Lesser-Renaming.txt).
- **Timeline of the main renaming (P):**
  - 16 Oct 1986: soc.* groups "now exist in parallel with their old 'net' counterparts" — [Spafford list](https://groups.google.com/g/net.news.group/c/DhFrZ9Tfww0).
  - 27 Oct 1986: Horton posts the "Final Renaming Scheme", 242 old→new rows onto 222 distinct new names. Merges are many-to-one, e.g. net.bugs, net.bugs.uucp and net.bugs.v7 all→comp.bugs.misc.
  - 2 Dec 1986: "all the new groups have been created, and all the old groups except for rec groups have been removed... aliasing is starting."
  - 1 May 1987: Rick Adams posts seismo's `/usr/lib/news/aliases` (271 mappings) and asks sites to install it.
  - The alias file already corrects the plan: talk.philosophy.tech→sci.philosophy.tech, comp.os.fidonet→comp.org.fidonet.
  - Source for the last three items: [Great-Renaming-lists.txt](http://web.archive.org/web/2005/http://www.panix.com/~josephb/newsgroups/history/rename-rmgroup/Great-Renaming-lists.txt).
- **Dates and authority.** Hardy, citing Spafford, dates the renaming July 1986–March 1987 (NP) — [Hardy 1993](https://w2.eff.org/Net_culture/net.history.txt).
  - Bellovin: the cabal "had no power de jure", but a group excluded by all of it "would have seen very little distribution." Placement was political; "moving something to the talk hierarchy would sharply curtail its distribution" (NP) — [Bellovin 2019](https://www.cs.columbia.edu/~smb/blog/2019-12/2019-12-26.html).
- **Who forced it.** Rick Adams (seismo, the only US–Europe link) threatened to leave. Europeans would not pay for "fluff" groups, and `!talk` in a site's feed config dropped a whole hierarchy. Protests forced "a dozen or two dozen changes" (NP) — [Bumgarner FAQ pt 1](https://www.linux.it/~md/usenet/gr.html).
- **Specific outcomes (P)** — [lists](http://web.archive.org/web/2005/http://www.panix.com/~josephb/newsgroups/history/rename-rmgroup/Great-Renaming-lists.txt):
  - net.columbia→sci.space.shuttle, so the 1985 "politically very hard" rename happened once the whole namespace was redone.
  - net.abortion→talk.abortion and net.origins→talk.origins.
  - mod.recipes→rec.food.recipes.
- **What was lost (NP).** Bumgarner says "much of what is known... is lost to the mists of time" — [FAQ pt 1](https://www.linux.it/~md/usenet/gr.html). In practice little changed for most sites, which still took full feeds; soc/talk/alt were not sent to Europe for a few years — [FAQ pt 2](https://linux.it/~md/usenet/gr2.htm).

### Inferences
- A rename is a coordinated *new name* plus deletion of the old one, with continuity supplied by each site's alias file. No identity survives the move except through those local mappings.
- Many-to-one merges and later alias corrections show that classification was revised even after the "final" list.

### Gaps
- I found no source saying how long sites kept the 1987 alias files. Bumgarner's FAQ also drew on email and on a Net magazine article that I did not read.

## 2. Control messages and per-site honoring

### Takeaway
A newgroup/rmgroup is a request, and each server's admin decides whether to act on it. In practice most admins delegate that decision to one shared trust table, signed per hierarchy. This is close to a per-reader trust overlay, except that the trust sits with the server operator, not the reader.

### Cited Findings
- **RFC 1036 (Horton & Adams, Dec 1987)** assumes one global network: rmgroup removes a group "from every host on the network." Both messages should be ignored without an Approved line (P) — [RFC 1036](https://www.rfc-editor.org/rfc/rfc1036.txt).
- **Spencer's "Son of 1036"** (written 1994, published 2010 as RFC 1849): administrators "often look for such information when deciding whether to comply." Implementations should refer rmgroups to an admin by default because "Abuses have occurred" (P) — [RFC 1849](https://www.rfc-editor.org/rfc/rfc1849.txt).
- **RFC 5537 (2009):** "No Netnews agent is ever required to act on any control message." Agents have "their own local authorization policies." Checkgroups gives a full list per hierarchy with an increasing serial number (P) — [RFC 5537](https://www.rfc-editor.org/rfc/rfc5537.txt).
- **INN's control.ctl** maps message type, sender and hierarchy to an action (doit, drop, log, mail, verify-PGP); the last matching line wins. Docs say PGP is "STRONGLY recommended" (P) — [INN control.ctl](https://www.eyrie.org/~eagle/software/inn/docs/control.ctl.html).
  - INN can also alias a group locally (`=foo.bar` files articles elsewhere) — [INN active](https://www.eyrie.org/~eagle/software/inn/docs/active.html).
- **ISC's shared control.ctl** (last modified 2023-08-05, 412 `##` sections) is the de facto shared trust list, kept in sync with INN releases (P) — [control.ctl](https://ftp.isc.org/pub/usenet/CONFIG/control.ctl), [README](https://ftp.isc.org/pub/usenet/CONFIG/README).
- **Big-8 authority.** In 1996 tale started PGP-signing after forgeries in his name, and most admins "ceased to honor" unauthenticated Big-8 control messages (NP) — [Big-8 history](https://www.big-8.org/wiki/How_the_Management_of_the_Big-8_Developed).

### Inferences
- The layers are: one shared namespace, many independent acceptance policies, and a shared default policy file most sites copy. One group name can therefore exist at some sites and not others; RFC 1849 calls this "discontinuous recognition."

### Gaps
- I found no measured statistics on how many sites honored rmgroups. The Big-8 board itself says this is "uncertain" — [Removing newsgroups](https://www.big-8.org/wiki/Removing_newsgroups).

## 3. alt.*: creation without authority, bogus and joke names, emergent shared names

### Takeaway
alt.* was founded to get around naming refusals. Sites accept its newgroups by default and ignore its rmgroups, so names pile up and never leave. Useful shared names still formed through alt.config's informal review, admin discretion and convention. Junk and harassment names grew next to them, including as children of real groups.

### Cited Findings
- **Founding (NP).** Reid's recipe group was to be renamed rec.food.recipes. He objected because there are non-food recipes, and Gilmore objected to the refusal of rec.drugs. Their dinner was 7 May 1987.
  - Reid: "one sent out numerous newgroup messages in the hopes that one would 'take'". By end of May alt.test, alt.config, alt.drugs and alt.gourmand were active. alt.sex followed on 3 Apr 1988 after a soc.sex vote that passed but whose group was refused — [FAQ pt 2](https://linux.it/~md/usenet/gr2.htm).
  - Conflict: Woodbury (quoted by Hardy) says alt.sex and alt.drugs came first and that Brian Kantor issued alt.rock-n-roll — [Hardy](https://w2.eff.org/Net_culture/net.history.txt).
- **The alt FAQ** (Penn State URL suggests David Barr, author unconfirmed) (NP) — [alt creation guide](https://grahammitchell.com/usenet/newalt.html):
  - "There are no Guidelines or Rules... no one 'in charge'."
  - Many sites "automatically honor all requests to create... and (by default) ignore all requests to remove groups."
  - alt groups "can't be removed or even re-named. Alt groups never die, they just fade away."
  - It warns against acronym names and dots used as word separators. "The first group was 'alt.swedish.chef.bork.bork.bork'. Since then, dozens of lookalike groups" followed.
  - Conventions it records: alt.sport.* for sports, alt.sports.* for teams.
  - Admins oppose groups that plan a later move to the Big Seven, "Because of newsgroup longevity."
- **ISC policy for alt** (P) — [control.ctl](https://ftp.isc.org/pub/usenet/CONFIG/control.ctl):
  - It sets `newgroup:*:alt.*:doit` and `rmgroup:*:alt.*:drop`.
  - Comment: "Tons of alt.* newgroups are sent out regularly with the intent more to create nonsense entries."
  - Comment: "There are nearly as many different policies with regard to alt.* groups as there are Usenet sites."
- **My counts of ISC `active`** (P, downloaded 2026-11-25) — [active](https://ftp.isc.org/pub/usenet/CONFIG/active):
  - 45,002 groups, of which 20,466 are alt.*.
  - Random-string names up to 21 components deep.
  - Joke and harassment children under real parents, e.g. a 9-component alt.config.cant-help.… chain naming a person.
  - alt.swedish.chef.bork.bork.bork is still listed. The early names alt.config, alt.drugs and alt.gourmand survive.
- **alt as an incubator.** alt.os.linux led to a comp.os.linux vote (Feb 1992) (NP) — [Linux Installation Guide](https://www.nic.funet.fi/pub/linux/doc/html/install-guide-2.2.2/node47.html).

### Inferences
- Without deletion, a name's existence says nothing about whether it is used. Shared names emerged through social filtering (alt.config, admin choice), not through the namespace itself.
- Anyone could attach children under a popular name, so deep paths became a vector for squatting and abuse.

### Gaps
- I did not obtain Pfaffenberger (1996); only the [abstract page](https://tisj.sitehost.iu.edu/readers/abstracts/12/12-4%20Pfaffenberger.html) loaded.

## 4. Renames, splits and moves after 1987

### Takeaway
Under the Big-8 rules a rename is a vote to create the new name plus a deferred rmgroup of the old one. Traffic moved when the old name was actually removed. Readers could still miss the new names.

### Cited Findings
- **Formal procedure.** The final Big-8 guidelines allow "rename a newsgroup." Passing needs ≥100 more YES than NO and ≥2:1. "During renames, removal of an existing group may be delayed until creation of its replacement has had time to propagate" (P) — [Big Eight guidelines](https://www.eyrie.org/~eagle/faqs/big-eight.html) (read via [mirror](https://web.do.metacpan.org/dist/App-DocKnot/view/t/data/spin/text/input/big-eight)).
- **comp.os.linux split** (P, linux.announce intro FAQ) — [FAQ](https://discmaster.textfiles.com/view/6631/Collection%20of%20Internet.iso/faq/comp/linux/announce/intro):
  - The Dec 1992 split failed except .announce. The second vote closed 4 Aug 1993 with 1,842 votes.
  - New groups were created 11 Aug 1993 and comp.os.linux was deleted 11 Nov 1993, a three-month overlap.
  - Today comp.os.linux.admin and comp.os.linux.help are absent from ISC `active` while .misc and .setup remain (my check of [active](https://ftp.isc.org/pub/usenet/CONFIG/active)).
- **comp.sys.att/3b1 (1990).** One participant argued that a new owner of the hardware would look in comp.sys.att.*, not comp.sys.3b1, and conceded "we've already lost the unix-pc name war" (P) — [comp.sys.att post](https://ftp.math.utah.edu/pub/mirrors/www.tuhs.org/Unix_Usenet/comp.sys.att/1990-November/003958.html).
- **humanities.*** was added in 1995 ("humanities.misc passes 508:97"). This is secondary only, from [Wikipedia](https://en.wikipedia.org/wiki/Big_8_(Usenet)); ISC lists 7 humanities.* groups.

### Inferences
- A move succeeded when the old name was actually withdrawn after an overlap. Splits produced sub-names that were themselves later superseded.

### Gaps
- I found no primary documents for the comp.sys.ibm.pc.* or rec.music.* reorganizations. I found no before/after traffic measurements for any rename.

## 5. Over-specific and deep names: fragmentation, dead groups, counts

### Takeaway
Deep, specific names often outlived their communities. In 2000–01 activity was heavily concentrated, and dead groups accumulated until the board deliberately removed them in batches.

### Cited Findings
- **Netscan, 2000–01** (S/NP, Microsoft Research TR-2001-94) — [Fiore & Smith](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-2001-94.doc):
  - About 38,000 newsgroups active in a typical month.
  - alt held 36% of groups and 47% of messages. The top ten hierarchies held 44% of groups but 81% of posts.
  - 2,381 active groups contained "comp" in their name, but only 1,171 were in comp.*.
  - "The name-based hierarchy of newsgroups is sometimes uninformative, inconsistent, or even deliberately misleading."
- **2011 cull.** The Big-8 "Great Downsizing 2011/2" removed 23 moderated groups with "no on-topic traffic for years", e.g. soc.culture.indian.telugu and sci.psychology.journals.psyche (P) — [notice](https://www.big-8.org/wiki/Nan:2011-08-16-lcc-great-downsizing-2).
- **2025 cull** of 99 unmoderated-in-practice moderated groups (P) — [RFD](https://www.big-8.org/wiki/Nan:2025-02-02-rfd-mass-deletion-nomod-2025):
  - For: cleanup helps users find active groups.
  - Against: a participant "looks for newsgroups by name, not by traffic"; deletion makes group history "disappear"; some servers ignore control articles.
- **Standing policy.** Since 2007 the board has had an annual policy to remove "extremely low-traffic unmoderated groups" (P) — [Removing newsgroups](https://www.big-8.org/wiki/Removing_newsgroups).
- **Naming guidance:** "Create general groups before creating very specific ones" (P) — [Big-8 Names](https://big-8.org/wiki/Names).
- **Current Big-8 size** (my count of ISC `active`): comp 677, rec 659, soc 212, sci 185, misc 100, talk 31, news 26, humanities 7.

### Gaps
- I found no published time series of total group counts or of the share inactive. The Smith PDF would not render, and the CACM "two-thirds desolate" figure could not be fetched (403), so it stays unverified.

## 6. Names encoding contested classification

### Takeaway
The top-level component encoded social and cost judgments, not only subject. Proponents picked hierarchies for propagation, and the names later became arguments in their own right.

### Cited Findings
- **soc.culture.jewish.** It is "a net.historical relic." It went to soc.culture.* rather than talk.religion.jewish because talk.* "would have lower propagation." The FAQ tells readers who argue from the name ("but this group is soc.culture.jewish, so...") to "just stifle." Related groups are scattered across rec.*, soc.* and alt.* (NP) — [SCJ FAQ](https://ftp.lip6.fr/pub/doc/faqs/judaism/FAQ/01-FAQ-intro).
- **comp.women (1988).** Proponents wanted comp.* for propagation; opponents said comp.* was technical. Haugh created comp.society.women by a forged control message after, by one account, Adams refused to issue a passed newgroup (NP) — [FAQ pt 3](https://linux.it/~md/usenet/gr3.htm).
- **Flame classification, 1985.** The net.flame.abortion proposal was called "very judgmental"; in 1986 the group went to talk.abortion (P) — [1985 archive](https://ftp.cs.toronto.edu/doc/usenet.hist/rename); [lists](http://web.archive.org/web/2005/http://www.panix.com/~josephb/newsgroups/history/rename-rmgroup/Great-Renaming-lists.txt).

## 7. Zooko (2001) and Stiegler (2005)

### Takeaway
Zooko's triangle is about *lookup binding*: whether a name resolves to the correct value. But "correct" is defined by an ownership policy, so the trilemma presupposes that someone owns the binding.

### Cited Findings
- **Earliest capture I read** is titled "Names: Distributed, Secure, Human-Readable: Choose Two", v0.9.1, 2001-10-12 (archived Jan 2002) (P) — [Zooko](http://web.archive.org/web/20020103095355/http://zooko.com/distnames.html). It defines:
  - distributed: "no central authority which can control the namespace... spans trust boundaries";
  - secure: "name lookups cannot be forced to return incorrect values by an attacker, where the definition of 'incorrect' is determined by some universal policy of name ownership."
  - Its challenge: anyone claiming all three must first specify "what universal policy should govern ownership of names." It proposes self-authenticating names plus a local agent that translates them (petnames).
- **Stiegler, Feb 2005 (updated 2010)** (P) — [Stiegler](http://www.skyhunter.com/marcs/petnames/IntroPetNames.html):
  - Names "cannot be global, secure, and memorable" at once.
  - "Securely unique" means "the name cannot be forged or mimicked."
  - Keys are global and secure; nicknames are global and memorable; petnames are "private bidirectional references to keys."

### Inferences
- Usenet group names were global and human-meaningful but not "secure" in Zooko's sense: forged newgroups were routine. Sites made up for this with per-hierarchy signer lists, which act as a local trust policy.
- A topic name that nobody owns has no "incorrect" binding to defend. So the triangle's security leg may apply to *who can create or retire* a name, not to who owns it.

### Gaps
- I could not verify the text of the later "Decentralized, Secure, Human-Meaningful" title revision.

## Summary table

| Event | Who decided | Mechanism | Overlap / lingering | Evidence grade |
|---|---|---|---|---|
| fa→mod, Oct 1985 | Fair, Spafford | newgroup ×18, rmgroup | about 10 days | P |
| net/mod→Big 7, 1986–87 | Backbone (Horton, Adams, Spafford) | newgroup, rmgroup, site alias file | Oct–Dec 1986 for net.*, aliases still posted May 1987 | P |
| alt.* founding, 1987–88 | Reid, Gilmore, Moffett | repeated newgroups, private links | permanent | NP |
| comp.os.linux split, 1993 | Vote (1,842 votes) | newgroup, then rmgroup | 3 months | P |
| Big-8 culls, 2011 and 2025 | Board | rmgroup batches | not stated; compliance unknown | P |
