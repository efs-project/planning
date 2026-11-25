# Hierarchical identifiers, link persistence, and on-chain tag precedents

Research date 2026-11-25. About 25 tool calls were used, mostly page fetches and searches. Several areas were not reached (see Gaps in each section). Items marked [unsourced] come from general knowledge, not from a fetched source.

## 1. Why hierarchy appears in identifiers (delegation vs classification)

### Takeaway
In the sources I could fetch, hierarchy in identifiers delegates authority over a sub-space. The best-sourced examples are MIME registration trees and Java reverse-DNS package names. Debtags and PyPI classifiers are classification vocabularies, and they are kept as separate metadata rather than used as identifiers.

### Cited Findings
- MIME types have four registration trees, marked by a prefix on the subtype: standards (no prefix), vendor `vnd.`, personal `prs.`, and unregistered `x.`. The trees differ in who may register and how much review applies. Vendor and personal registrations go to IANA Expert Review, and the personal registrant owns the registration. The RFC says the structure exists to "increase the efficiency and flexibility of the registration process". `x.` names cannot be registered, are meant for private bilateral use, and are discouraged. — [RFC 6838](https://datatracker.ietf.org/doc/html/rfc6838)
- Java package names start from a reversed Internet domain name, such as com.example.orion. The stated reason is that programmers worldwide may independently pick identical names. The convention borrows the existing domain registry instead of creating a Java-specific one. `java` and `javax` are reserved for conforming implementations. Domain names that contain hyphens, start with a digit, or are reserved words need workarounds. — [Oracle Java tutorial](https://docs.oracle.com/javase/tutorial/java/package/namingpkgs.html); [archived conventions page](https://www.oracle.com/java/technologies/javase/codeconventions-namingconventions.html)
- PyPI trove classifiers are strings with levels separated by " :: ", for example "Framework :: Django :: 4.2". There are well over 500 of them. Top levels include Topic, License, Framework, and Programming Language. Project maintainers choose classifiers per release. The page does not say who approves new classifiers. — [PyPI classifiers](https://pypi.org/classifiers/)
- Debtags uses a facet and tag vocabulary. The vocabulary file has "Facet:" and "Tag:" records. Each facet has a TODO tag that flags gaps in the vocabulary. The Debian wiki says Debtags was discontinued and the page is of historic interest only. — [debtags search results](https://wiki.debian.org/Debtags); [facet list](https://debtags.debian.org/reports/facets); [custom tags](https://wiki.debian.org/Debtags/CustomTags)
- ARK identifiers have the form `ark:` + NAAN + name. The NAAN identifies the name-assigning authority, and the sub-namespace "shoulder" sits below it. Names are unique within a NAAN. — [ARK about](https://arks.org/about/)

### Inferences
- The delegating cases (MIME vendor and personal trees, reverse-DNS) hand a sub-space to an owner who is identified outside the system. The classifying cases (trove, debtags) have a curator, and the sources I read give no sign that they delegate. A ledger with no central authority has neither an external owner registry nor a curator.
- MIME's `x.` tree is an example of the approach on a system with no authority: it is unregistered, and the RFC discourages it.

### Gaps
- I did not fetch primary text for DNS (RFC 1034), OIDs (X.660 arcs), or LDAP DNs. The usual account is that all three delegate by subtree and that LDAP DNs change when an entry moves. [unsourced]
- I did not find a published account of what happens to Debtags identifiers when a facet is reorganised.

## 2. Link persistence and persistent-identifier schemes

### Takeaway
Berners-Lee advises against putting subject or classification in a URI. Measured link rot is substantial across studies. The PID literature I could reach favors opaque strings, and there is at least one published dissent.

### Cited Findings
- "Cool URIs don't change" (1998) says to leave out everything except the creation date, since "after the creation date, putting any information in the name is asking for trouble". It names subject, author, status, access level, and file extensions as things to omit. On subject: "when you use a topic name in a URI you are binding yourself to some classification". Classification schemes change and area names get revised. — [W3C Style, Cool URIs](https://www.w3.org/Provider/Style/URI) (fetched summary; wording paraphrased by the fetch tool, so check quotes against the page)
- Pew, May 2024: 38% of 2013 webpages were inaccessible as of Oct 2023, against 8% of 2023 pages. 25% of all pages from 2013 to 2023 were gone. 54% of Wikipedia pages had at least one broken reference link, and 11% of reference links were dead. 23% of news pages and 21% of government pages had at least one broken link. — [Pew Research](https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/)
- Harvard (Zittrain, Albert, Lessig, 2014): about 50% of URLs in Supreme Court opinions suffered link or reference rot. In Harvard Law Review links, just over 70% did not contain the cited material. An earlier study found 29% of links in 1996–2010 Supreme Court opinions were invalid. Perma.cc came out of this work. — [Harvard Law Review Forum](https://harvardlawreview.org/forum/vol-127/perma-scoping-and-addressing-the-problem-of-link-and-reference-rot-in-legal-citations/); [NPR](https://www.npr.org/sections/alltechconsidered/2014/04/26/307041846/stopping-link-rot-aiming-to-end-a-virtual-epidemic)
- The DOI Handbook calls DOI names "opaque" or "dumb numbers" and says no information may be inferred from the string. Rationale in secondary summary: a recognisable pattern invites misleading assumptions, meaning may not translate across languages, and trademark conflicts can arise. The Handbook is under revision for ISO 26324:2022. — [DOI Handbook ch. 2](https://albany.doi.org/doi_handbook/2_Numbering.html); [secondary summary](https://wiki.potsdam.edu/wikichem/index.php/Digital_object_identifier)
- Dissent: a Crossref community post argues the opacity advice is simplistic and harmful to linking, and that "semantic" identifiers become increasingly opaque over time. — [Crossref community](https://community.crossref.org/t/opaque-dois-considered-harmful/13788) (a forum post, not a formal study)
- ARK separates the stable name from a "replaceable resolver service". Its stated principle is "Persistence means persistent management". — [ARK about](https://arks.org/about/)

### Inferences
- Berners-Lee's point is about a locator bound to a mutable classification. Whether it carries over to a content-addressed ledger identifier is not tested by these sources.
- The ARK split (stable name, replaceable resolver) mirrors "flat ID plus revisable statements".

### Gaps
- I did not find the ARK principles page on opaque identifiers (the URL I tried returned 404), nor Handle or PURL design documents. I have no sourced detail on how Handle or PURL redirects work.
- I did not verify any figures on DOI or ARK resolution failure rates.

## 3. Identifier-plus-slug URLs

### Gaps
- My searches did not reach Stack Overflow, Reddit, Discourse, or Medium documentation. I have no sourced claim. From general knowledge, Stack Overflow redirects a wrong or old slug to the current one by numeric ID [unsourced].

## 4. Wikipedia moves and Wikidata redirects

### Takeaway
Both systems keep old identifiers alive with redirects. Wikipedia titles are meaningful and move often, and its redirect rules show specific places where links still break.

### Cited Findings
- A page move leaves a redirect at the old title by default. Suppression needs special rights. Redirects are generally kept because deleting one can break links from old revisions, edit summaries, other wikis, and external sites. — [Wikipedia:Redirect](https://en.wikipedia.org/wiki/Wikipedia:Redirect)
- The software will not follow chains of more than one redirect. Bots usually fix double redirects within hours. — [Wikipedia:Redirect](https://en.wikipedia.org/wiki/Wikipedia:Redirect)
- Redirects to section headings break when the heading is renamed. Redirected categories do not move their members. — [Wikipedia:Redirect](https://en.wikipedia.org/wiki/Wikipedia:Redirect)
- Wikidata: merging two items makes one redirect to the other, so the old Q-id stays valid. A bot updates statements in other items that point to the redirected item. Non-empty items cannot simply become redirects. One ticket reports Structured Data on Commons not being updated. SPARQL results can show both IDs. — [Phabricator T148155 and related tickets (search results)](https://phabricator.wikimedia.org/T148155); [Wishlist page](https://meta.wikimedia.org/wiki/Community_Wishlist_Survey_2021/Wikidata/Link_Wikipedia_redirects_to_Wikidata_items). These came from search snippets; I did not read the tickets in full.

### Gaps
- No redirect breakage rate was available from either project. The Wikipedia page's final 83,000 characters were not read.

## 5. ENS

### Takeaway
ENS hashes names recursively and puts the normalization duty on the caller. I found no statement of on-chain enforcement.

### Cited Findings
- Namehash is recursive: keccak256(parent namehash, labelhash(label)), starting from 32 zero bytes. The registry keys on the 32-byte node. — [ENS names docs](https://docs.ens.domains/resolution/names)
- The docs say a name MUST be normalized before hashing, and a one-character difference such as capitalisation yields a different node. They do not say whether the contracts check this. — [ENS names docs](https://docs.ens.domains/resolution/names)
- ENSIP-15 defines normalization (Unicode 17.0.0, marked final). It is described as a step applied before hashing, with no on-chain validation mentioned. Registration hashes are immutable, which is why emoji presentation characters are ignored instead of changed. — [ENSIP-15](https://docs.ens.domains/ensip/15)

### Inferences
- The documentation implies a name that was registered with a non-normalized label may exist on chain but be unreachable through a normalizing client. I did not find an incident report confirming this.

## 6. On-chain and crypto-native tagging and curation

### Takeaway
I found examples of open, owner-less registration (EAS, Arweave tags) and of owner-based channels (Farcaster). I did not find a sourced case of a widely shared, ownerless topic vocabulary. Most failure-mode evidence is thin.

### Cited Findings
- Farcaster: a channel is identified by a lowercase alphanumeric name under 16 characters, used as a parent URL `https://farcaster.xyz/~/channel/<name>`. Anyone can create a channel by paying a fee. The creator becomes host and sets norms and moderation. Channel metadata lives in the client, not the protocol. The fee is meant to deter squatting, and the client may remove a squatted channel without refund. — [Farcaster docs](https://docs.farcaster.xyz/learn/what-is-farcaster/channels)
- Arweave: tags are name/value pairs (ANS-104 uses Avro). `Content-Type` is required for serving, and `App-Name` is recommended. Tag names are case-sensitive and duplicates are not allowed. Total tag size is limited to 2 KB (L1) or 4 KB (bundled). I found no registry or enforcement of tag names. — [ar.io tagging docs](https://docs.ar.io/build/upload/tagging/); [ANS-104](https://cookbook.ar.io/references/specs/ans/ANS-104.html)
- EAS: schema registration is described as permissionless. Trust filtering is left to the application or wallet layer. My search suggests an identical schema record cannot be registered twice but different schemas can overlap. This reading is not confirmed. — [EAS contracts](https://cdn.jsdelivr.net/npm/@ethereum-attestation-service/eas-contracts@1.9.0/README.md); [Ethsign article](https://medium.com/ethsign/schema-registry-the-heart-of-an-attestation-ecosystem-78360f0c2d01)
- Kleros Curate: described as open and permissionless for anyone to create lists. The Tokens² registry had 403 listings in its docs and is marked deprecated and migrated to a vanilla Curate list. The v2 migration post says old registries cannot be shut off, so deposits are being raised to deter submissions. — [Kleros Curate announcement](https://blog.kleros.io/kleros-curate-announcement); [T2CR repo](https://www.github.com/kleros/tokens-on-trial); [v2 migration](https://blog.kleros.io/migrating-kleros-registries-to-v2)
- Token-curated registry critiques exist, but I could only find blog essays with unsourced figures (voter apathy, collusion). I consider them unreliable. — [example](https://www.chainscorelabs.com/blog/prediction-markets-and-information-theory/decentralized-information-markets/why-token-curated-registries-incentivize-mediocrity-not-excellence). A game-theoretic paper exists: [arXiv 1809.01756](https://arxiv.org/pdf/1809.01756).

### Inferences
- Farcaster's fee and takedown rules show squatting is treated as a real risk once names carry value. Arweave and EAS accept collisions and leave trust to readers.

### Gaps
- Lens Protocol hashtags: no documentation found. IPFS/IPLD paths and The Graph were not researched.
- No post-mortem found for AdChain or other TCRs. Rates of spam, squatting, or fragmentation in any of these systems were not found.

## 7. Indexing hierarchical roll-up without a mutable database

### Takeaway
Standard relational approaches are well documented. I found nothing on append-only or on-chain versions, and nothing sourced on Bloom filters.

### Cited Findings
- Nested sets are described as hardest to maintain and best only for read-heavy trees. Materialized paths store the ancestor chain and are simple to write, but re-parenting is costly. Closure tables store every ancestor-descendant pair in a separate table and suit read-heavy trees. One author reports 12.5x faster reads than materialized paths in their own case, and notes DAGs were untested. — [Percona on closure tables](https://www.percona.com/blog/moving-subtrees-in-closure-table/); [Evil Martians](https://evilmartians.com/chronicles/postgresql-and-rails-sitting-in-a-tree); [Educative comparison](https://www.educative.io/courses/sql-antipatterns-database-programming/comparison-of-different-tree-implementations)

### Inferences
- The fetched comparisons all treat re-parenting as the costly operation for materialized paths. If a parent is part of the identifier, a re-parent is a new identifier by construction.
- A Bloom filter stores only a bit array and answers "possibly in" or "definitely not in", so it cannot list members. This is standard knowledge [unsourced; no fetched source]. Listing members needs a separate index (for example, a prefix or parent-to-child index).

### Gaps
- No published append-only or on-chain scheme for hierarchical roll-up was found.
- No sourced citation for the Bloom filter claim.
