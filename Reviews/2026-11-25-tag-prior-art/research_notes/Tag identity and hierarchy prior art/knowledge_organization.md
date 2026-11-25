# Knowledge-organization prior art: hierarchy in identity vs. separate data

Research date 2026-11-25. About 17 tool calls. Several key numbers (relocation counts, MeSH multi-parent share, Bowker & Star, faceted-search evidence) were NOT found; see the Gaps in each section. Search-engine summaries were used for some items and are flagged "(search summary, page not fetched)".

## 1. Enumerative classification (Dewey, LCC, UDC): notation encodes position

### Takeaway
The notation is the position, so a move means a new number and, for a physical collection, a new label and a new shelf place. I found documented per-volume reclassification costs and bias criticisms, but no count of subjects relocated per edition.

### Cited Findings
- Shirky argues the one-place rule inherited from physical shelves is what forced single placement. He says the Dewey religion schedule gives Christianity many subdivisions and that LC's history scheme puts "Balkan Peninsula," "Asia" and "Africa" at the same level (essay dated April 2005). — [Shirky, Ontology is Overrated](https://www.shirky.com/writings/ontology_overrated.html)
- Reclassification cost evidence, all old and local:
  - North Carolina Central University: 69,879 volumes reclassified at about $585,100 direct cost, which is roughly $8 per volume by my arithmetic. The study's date was not captured. A Princeton item mentions a $1.6M switch of Firestone's books to LC, but I could not link the two fragments to a per-volume figure.
  - A 1968 C&RL study said reclassification costs are so bound into operating budgets that a true unit cost is nearly impossible to establish.
  - All three are from a search summary, pages not fetched. — [search results listing](https://paw.princeton.edu/article/firestone-phasing-out-uniquely-princeton-way-classify-books); [CRL 1968 PDF](https://distantreader.org/stacks/journals/crl/crl-12046.pdf)
- Dewey 200s bias claims are mostly opinion pieces and advocacy figures. The claim of about 90% of the 200s for about 30% of the world's religious population is advocacy, not measured. A research paper is reported as finding consistent western bias in DDC, more than in LCC. A 2020 ANZTLA workshop record says most public-library cataloguers find the schedules satisfactory (search summary, pages not fetched). — [SLJ opinion](https://www.slj.com/story/nine-years-ago-I-speculated-dewey-decimal-system-days-were-numbered-how-far-have-we-come-libraries); [ANZTLA PDF](https://serials.atla.com/anztla/article/download/2734/3501/12695)

### Inferences
- Where identity is a position string, every relocation forces downstream rewrites. That cost scales with the number of items already labelled. Here the scarce resource was shelf space and a physical label, which a ledger does not have.

### Gaps
- No verified count of topics moved between DDC, LCC or UDC editions.
- The "Phoenix" 1996 DDC 200 revision could not be confirmed.
- UDC was not researched at all.

## 2. Subject headings and thesauri (MeSH, LCSH)

### Takeaway
MeSH separates a stable descriptor ID from a revisable tree number. NLM states tree numbers are mere locators that change, and one descriptor may sit in several places. LCSH heading changes are made centrally, and libraries must update local records.

### Cited Findings
- Tree numbers "serve only to locate the descriptors in each tree and to alphabetize those at a given tree level" and "have no intrinsic significance." They are "subject to change" when descriptors are added or the hierarchy is revised. A descriptor "may appear in as many additional places as may be appropriate." — [NLM intro_trees](https://www.nlm.nih.gov/mesh/intro_trees.html)
- Example of multiple tree numbers: Digestive System Neoplasms has C06.301 and C04.588.274 (Wikipedia, secondary). — [Wikipedia MeSH](https://www.wikipedia.org/wiki/MeSH)
- Unique ID is a seven-character code starting with "D" (search summary). — [NLM training module](https://www.nlm.nih.gov/tsd/cataloging/trainingcourses/mesh/mod2_060.html)
- PubMed explode: searching a descriptor with [mh] "automatically includes narrower Descriptors indented under it"; [mh:noexp] turns it off. Supplementary Concept Records are not in the trees and cannot be exploded. — [NLM PubMed/MeSH retrieval](https://www.nlm.nih.gov/mesh/intro_retrieval.html)
- MeSH has up to 13 hierarchical levels and 16 top-level categories (search summary). The 2026 edition adds 160 new descriptors. — [NLM intro](https://www.nlm.nih.gov/mesh/introduction.html); [What's New](https://www.nlm.nih.gov/mesh/whatsnew.html)
- LCSH "Illegal aliens" timeline:
  - Heading "Aliens, Illegal" set in 1980 and revised in 1993.
  - LC refused change in Feb 2015.
  - LC announced a replacement in March 2016, then Republican legislators intervened (bill, appropriations rider); the final bill required LC to publish its change process.
  - Final change announced 12 Nov 2021: "Aliens" became "Noncitizens," "Illegal aliens" became "Illegal immigration," implemented Dec 2021.
  - More than 40 libraries and systems made local changes before or around that time. No count of affected records was given.
  — [Wikipedia, Illegal aliens (LCSH)](https://en.wikipedia.org/wiki/Illegal_aliens_(Library_of_Congress_Subject_Heading)); [ALA release](https://www.ala.org/news/2021/11/ala-welcomes-removal-offensive-illegal-aliens-subject-headings)

### Inferences
- MeSH is the clearest existing case of "flat stable ID plus revisable placement data." LCSH shows the cost of a label change: a 2015 refusal and a 2016 political reversal came before the 2021 change, and it took years.

### Gaps
- No verified count of MeSH descriptors with more than one tree number. The NLM download page has no such statistics. It would need computing from the MN fields of the descriptor file.
- How often tree numbers change per annual release: not found.
- Cost of LCSH-change implementation: not found.

## 3. Faceted classification

### Takeaway
Ranganathan's facets (PMEST: Personality, Matter, Energy, Space, Time) are combined at classification or query time instead of fixing one tree. I found only definitional sources and no comparative performance evidence.

### Cited Findings
- Faceted schemes combine semantically cohesive categories as needed, while enumerative schemes list concepts in advance. Colon Classification is the best-known largely faceted scheme, evolving through editions from 1933 to 1987 (search summary, pages not fetched). — [Wikipedia, Faceted classification](https://wikipedia.com/wiki/Facet_analysis); [INFLIBNET on CC](https://ebooks.inflibnet.ac.in/lisp2/chapter/introduction-to-major-classification-systems-structure-and-features-of-cc)
- A Berkeley course text says enumerative schemes fix facet order in advance, so one ordering becomes the hierarchy, and faceted schemes avoid that and suit online browsing (search summary). — [Berkeley pressbook](https://berkeley.pressbooks.pub/tdo4p/?p=86)

### Gaps
- No evidence on whether faceted navigation outperforms trees (e.g. Hearst studies). Not found in this pass.
- Counter-evidence (facet-order choice, cost of building facets) not found.

## 4. SKOS and Wikidata

### Takeaway
SKOS gives concepts URI identity and treats broader/narrower as separate, asserted, revisable statements. It allows multiple parents and does not forbid cycles. Wikidata keeps Q-ids stable through merge redirects, but its subclass-of hierarchy has documented quality problems.

### Cited Findings
- Concepts are identified by URIs, and labels are attached lexical strings. `skos:broader` asserts only direct links and is not transitive; `broaderTransitive` is for inference. Polyhierarchy is allowed ("no condition requiring that there be only one path"). Cycles are consistent with the data model (§8.6.8). `exactMatch` is for interchangeable concepts. — [W3C SKOS Reference](https://www.w3.org/TR/skos-reference/)
- Wikidata merge: the source item becomes a redirect so the ID keeps resolving, because third parties depend on stable IDs; the source's data is dropped but kept in history. Known bugs: a merge with a description conflict can finish without creating a redirect (status not confirmed as fixed). — [Phabricator T40664](https://phabricator.wikimedia.org/T40664); [T127213](https://phabricator.wikimedia.org/T127213)
- Wikidata hierarchy problems: instance and subclass loops, cycles, over-generalised and redundant subclass links, taxonomy depth of 20, and no formal definition of "instance of" or "subclass of" (search summary, secondary). — [Class Order Disorder in Wikidata (arXiv 2411.15550)](https://arxiv.org/html/2411.15550v1); [Semantic Inconsistencies in Wikidata's Classification Hierarchy (arXiv 2511.04926)](https://arxiv.org/html/2511.04926v2); [WiKC (arXiv 2409.04056)](https://arxiv.org/pdf/2409.04056v1.pdf)

### Inferences
- SKOS and Wikidata are the closest analogues to "flat IDs plus parent statements." Both show open parent statements accumulate cycles and redundancy, and neither prevents them.

### Gaps
- Counts of Wikidata cycles and merges not captured. The Wikidata Help:Merging page was not retrievable (404 on the URL tried).
- Roll-up in Wikidata (SPARQL `subclass of*`) was not researched.

## 5. Wikipedia categories

### Takeaway
Wikipedia describes categories as a "tree-like hierarchy" with multiple parents allowed, but in practice they form a cyclic graph. Renames are community-process work, not identity-preserving.

### Cited Findings
- Policy text: "All categories form part of a tree-like hierarchy"; "A category can have more than one parent category"; proposals to delete, merge or rename go through Categories for discussion; bots move pages out of category redirects; hard redirects are not used for categories, and category redirects are called "costly" (page truncated; last 62k characters not read). — [Wikipedia:Categorization](https://en.wikipedia.org/wiki/Wikipedia:Categorization)
- Cycles: an SDZeroBot list shows about 3,000 cycles on English Wikipedia (Community Wishlist). A Phabricator report says a depth-first search found over 4,100. These two counts differ and I did not reconcile them. A 2024 wish asks for an acyclic graph (last updated Oct 2026; 3 supporters). — [Wishlist W281](https://meta.wikimedia.org/wiki/Community_Wishlist/W281/en); [Phabricator T263096](https://phabricator.wikimedia.org/T263096)
- Category intersection: guidance says a category fully expressible as an intersection of other categories is not a primary category. PetScan does intersection, union and difference over category trees outside the core software. — [Wikipedia:Category intersection](https://en.wikipedia.org/wiki/Wikipedia:CI); [PetScan](https://meta.wikimedia.org/wiki/PetScan/en)

### Gaps
- Article-move redirect behaviour and a CfD rename throughput number were not researched.
- The long-standing category-intersection feature request history was not traced.

## 6. Web directories (Yahoo, DMOZ)

### Takeaway
DMOZ scaled to millions of listings through volunteers, but declined as search replaced browsing. Shirky's account of Yahoo describes a "real" category plus "@" cross-references.

### Cited Findings
- DMOZ: went live 5 June 1998; about 4,500 editors at Netscape takeover; 75,151 contributing editors (31 Mar 2007); 97,584 (Apr 2013); 1M URLs (Oct 1999), 4M (Dec 2003); 5,169,995 sites in over 1,017,500 categories (Apr 2013); 3,996,412 sites in 1,026,706 categories (31 Oct 2015); closed 17 Mar 2017 because AOL no longer wished to support it. The "contributing editors" figure counts everyone who ever contributed, not active editors (about 7,330 active in Aug 2006). Hierarchy criticism arose around 2005, and there were allegations of editor favouritism. — [Wikipedia, DMOZ](https://en.wikipedia.org/wiki/DMOZ)
- Yahoo: Shirky says Yahoo hired an ontologist, placed each item under one "real" category, marked other locations with "@," and limited a URL to three places. — [Shirky](https://www.shirky.com/writings/ontology_overrated.html)
- Google Directory (using DMOZ data) shut in July 2011. — same Wikipedia page.

### Inferences
- The 2013 to 2015 drop from 5.17M to 4.00M sites while categories held at about 1.02M is consistent with the category tree staying fixed while listings decayed. That is my reading; the source states only the numbers.

### Gaps
- DMOZ editor guidelines on `@` symbolic links: the Wikipedia page does not mention them. The archived guidelines were not fetched.
- DMOZ category move and rename mechanics were not researched.

## 7. The critiques

### Takeaway
Shirky's essay is the only critique I read directly. The one-place-per-item constraint is physical, and hierarchy suits small, stable domains with expert catalogers. Weinberger and Bowker & Star were not read in detail.

### Cited Findings
- Shirky (April 2005): ontology fits "small, stable, formal domains with expert catalogers"; the web has a large corpus, naive users and no global authority. Free-text tags retain distinctions (LiveJournal interests) and improve with scale. — [Shirky](https://www.shirky.com/writings/ontology_overrated.html)
- Weinberger (2007): three "orders of order," the third arising when items and catalogs are both digital. Reviewers' views are mixed; one argues the third order often sits on the second, another doubts the label earns its cost (search summary). — [Information Research review](https://informationr.net/ir/reviews/revs269.html); [Harvard Berkman page](https://cyber.harvard.edu/publications/2007/Everything_Is_Miscellaneous)

### Gaps
- Bowker & Star, *Sorting Things Out* (MIT Press, 1999): no source found in this pass, so I did not report their claims.
- Rigorous counter-evidence that hierarchies stay useful: not found beyond the Shirky concession and the review above.
