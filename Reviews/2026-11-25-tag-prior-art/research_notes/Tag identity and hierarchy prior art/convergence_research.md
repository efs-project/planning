# Naming agreement, vocabulary convergence and focal points: evidence for flat versus path-style tags

Method note: about 15 search/fetch calls on 2026-11-25. Most papers were read only as abstracts or via secondary summaries; this is flagged per item. Full-text PDFs of Golder and Huberman could not be parsed (no PDF tooling), so no numbers from that paper are given. Most items below were not read in full.

## 1. The vocabulary problem (Furnas et al. 1987)

### Takeaway
Spontaneous naming agreement is low even for a single concept. Two people chose the same term with probability below 0.20 in all five domains studied. The authors' remedy was many aliases per target ("unlimited aliasing") rather than one canonical name.

### Cited Findings
- Furnas, Landauer, Gomez, Dumais, "The vocabulary problem in human-system communication", Communications of the ACM 30(11):964-971, 1987. Abstract: spontaneous word choice for objects in five application-related domains was "surprisingly" variable; in every case two people favored the same term with probability <0.20. — [DBLP record](https://dblp1.uni-trier.de/rec/journals/cacm/FurnasLGD87.html); [abstract text via Scilit](https://scilit.com/publications/00f34424be4f1ca2183d8690680d8d28)
- Abstract: access via one designer's favorite single word gives 80-90% failure rates in many common situations. Unlimited aliasing, which the authors derive as the optimal strategy, gave several-fold improvement. — [Scilit abstract](https://scilit.com/publications/00f34424be4f1ca2183d8690680d8d28)
- A later review (Brennan and Clark 1996) reports the single-term agreement range as .07 to .18 and says that even with as many as 20 aliases for one command, two people would pick a covered term only about 80% of the time. This is a secondary report of the original, and I did not open it. — [Brennan 1996 PDF](https://www.cs.columbia.edu/~julia/papers/brennan96.pdf)
- The spelled-out "10-20%" range is not in the abstract; only "<0.20" is confirmed. Sample sizes and the domain list were not verified (abstract only).

### Inferences
- The figure is for free-text, uncoordinated naming with no visible prior choices. It is a lower bound on agreement for a tagging system with no suggestions or visible history.
- The aliasing recommendation implies the fix lives on the lookup side (many names, one target), not on forcing one name.

### Gaps
- No direct replication of the 0.20 agreement figure found. Sample sizes and per-domain numbers unverified.

## 2. Collaborative tagging dynamics and convergence

### Takeaway
Aggregate tag distributions on popular resources become stable and power-law shaped even with no coordination, driven by imitation and preferential attachment. Individual agreement is not the same as aggregate stability. Showing others' tags shapes what people apply.

### Cited Findings
- Golder and Huberman, "Usage patterns of collaborative tagging systems", J. Information Science 32(2):198-208, 2006 (Delicious). Abstract: regularities in activity and tag frequencies, and a "remarkable stability" in the relative proportions of tags within a URL. Their model attributes this to imitation and shared knowledge. Abstract only. — [Crossref](https://api.crossref.org/works/10.1177%2F0165551506062337); [PDF](https://collablab.northwestern.edu/CollabolabDistro/nucmc/GolderAndHuberman-usage%20patterns%20collab%20tagging.pdf) (not parsed)
- Halpin, Robu, Shepherd, "The complex dynamics of collaborative tagging", WWW 2007 (DOI 10.1145/1242572.1242602). Generative model for power-law tag distributions via preferential attachment. A secondary course-wiki summary says popular, long-history sites showed power laws while "recent" items did not. Not verified from the paper. — [WWW2007 PDF](https://www2007.cpsc.ucalgary.ca/papers/paper635.pdf); [secondary summary](https://cs.cmu.edu/~wcohen/10-802/fixed/Halpin_et_al%2C_WWW_2007.html)
- Cattuto, Loreto, Pietronero, "Semiotic dynamics and collaborative tagging", PNAS 104(5):1461-1464, 2007. Stochastic model with a frequency-bias (imitation) term plus a heavy-tailed memory term, fitted to Delicious and Connotea. Abstract only. — [arXiv cs/0605015](https://arxiv.org/abs/cs/0605015)
- Sen et al., "Tagging, communities, vocabulary, evolution", CSCW 2006, pp. 181-190. In MovieLens they compared four tag-display algorithms and measured effect on vocabulary evolution, tag utility, adoption and satisfaction (model of community influence plus personal tendency). I did not retrieve the per-algorithm numbers. — [UMN record](https://experts.umn.edu/en/publications/tagging-communities-vocabulary-evolution/)
- Marlow, Naaman, boyd, Davis, "HT06, Tagging Paper, Taxonomy, Flickr, Academic Article, ToRead", Hypertext 2006, pp. 31-40 (DOI 10.1145/1149941.1149949). Design dimensions include "blind tagging" (no help) versus suggestion, and set-based (Flickr) versus bag-based (Delicious) aggregation. Secondary summaries only. — [DBLP](https://dblp1.uni-trier.de/rec/bibtex/conf/ht/MarlowNBD06); [blog summary](https://overstated.net/2006/08/23/ht06-tagging-paper-taxonomy)

### Inferences
- Stabilization is a property of aggregate proportions on a single resource, where later taggers see earlier tags. For a ledger with no suggestion UI or visible history this mechanism would be weaker (inference).
- Imitation is the engine in all four models, so visibility of existing tags appears to be a precondition for convergence.

### Gaps
- Time-to-stability numbers (for example bookmarks needed) not obtained; Golder and Huberman full text unreadable. Halpin and Sen findings unverified beyond abstracts. Marlow details unverified.

## 3. Specificity, basic level, categorizers vs describers, compound tags

### Takeaway
I found no study that measures agreement as a function of tag specificity or multi-word depth. The nearest evidence is on user types, hierarchy disagreement (section 7), and the vocabulary problem itself.

### Cited Findings
- Körner, Benz, Hotho, Strohmaier, Stumme, "Stop thinking, start tagging: tag semantics emerge from collaborative verbosity", WWW 2010, pp. 521-530. Categorizers use a small controlled-like tag set as a classification replacement; describers add many free associations. Splitting a folksonomy into 64 partitions with varying ratios, "verbose" describers contributed most to emergent semantics, and a 40%-of-users subset could match the full set. Abstract only. — [PDF](https://www.kde.cs.uni-kassel.de/pub/pdf/koerner2010stop.pdf)
- Companion: Körner, Kern, Grahsl, Strohmaier, "Of categorizers and describers", HT 2010, pp. 157-166. — [PUMA record](https://puma.uni-kassel.de/bibtex/d869f8a2685411dd3c6b22b1211f92c5)

### Inferences
- Describers produce the large, varied vocabulary; categorizers produce reuse. A shared-tag system draws on both populations.

### Gaps
- No evidence found on Rosch basic-level effects in tagging, or on agreement for compound or multi-word tags. This was not covered by my searches and is a real hole.

## 4. Focal points

### Takeaway
Focal points work when options are labeled and symmetric (equal payoffs). Coordination collapses with even small asymmetry. I found no figures on how coordination scales with option count or with number of independent choices.

### Cited Findings
- Mehta, Starmer, Sugden, "Focal points in pure coordination games: an experimental investigation", Theory and Decision 36(2):163-185, 1994. Abstract: hypotheses about salience determinants were generally confirmed. Full text not accessed. — [DOI](https://www.doi.org/10.1007/BF01079211)
- Distinction between primary salience (appeals to non-strategic players) and secondary salience (strategic expectations); per later papers citing Mehta et al. — [UEA repository](https://ueaeprints.uea.ac.uk/id/eprint/27551/)
- Crawford, Gneezy, Rottenstreich, AER 98(4):1443-58, 2008. With equal payoffs salient labels give frequent coordination; with minutely asymmetric payoffs labels lose much of their effectiveness. In the symmetric Chicago-skyscraper game the Sears Tower drew about 60% of 99 subjects. — [IDEAS](https://ideas.repec.org/a/aea/aecrev/v98y2008i4p1443-58.html); [working paper](https://Rady.ucsd.edu/_files/faculty-research/uri-gneezy/focal-points.pdf)

### Inferences
- Tag choice has no payoff to the tagger for matching others, so it behaves as a pure-coordination game at best. Multi-level paths multiply the number of choices that must all match (simple probability reasoning, not an experimental finding).

### Gaps
- Specific results on option-set size, salience properties (uniqueness, simplicity) and multiple sequential choices were not retrieved.

## 5. Naming games and convention emergence

### Takeaway
Under local-only interaction populations stay fragmented; under well-mixed interaction a single convention emerges quickly. A committed minority of about a quarter can flip an established convention.

### Cited Findings
- Baronchelli, Felici, Loreto, Caglioti, Steels, "Sharp transition towards shared vocabularies in multi-agent systems", J. Stat. Mech. P06014, 2006. Naming-game model shows a disorder-to-order transition, sharper with system size, with Zipf-like distribution of competing synonyms before it. The N^1.5 scaling is not confirmed from snippets. — [arXiv physics/0509075](https://arxiv.org/abs/physics/0509075)
- Centola and Baronchelli, "The spontaneous emergence of conventions", PNAS 112:1989, 2015 (human Name Game with faces). Groups of 24 (replications 48; one of 96); match pays $0.50, mismatch costs $0.25. Spatial network: success never above 75% after 25 rounds, dominant name used by about 30% of players. Random degree-4 network: never above 75%, dominant about 33%. Well-mixed: 100% success, dominant convention about 96%, universal adoption between rounds 20 and 22. A 96-player mixed group converged on a similar timescale. — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4343158)
- Centola, Becker, Brackbill, Baronchelli, Science 360(6393):1116-1119, 2018. Largest unsuccessful committed minority 21%, smallest successful 25%. Participants number 194 per one secondary source, while the Penn release describes 10 groups of 20; discrepancy unresolved. — [Science SM](https://ndg.asc.upenn.edu/wp-content/uploads/2018/06/Centola-et-al.-2018-Science.-Tipping-Point-Supplementary-Materials.pdf); [Nature News and Views](https://www.nature.com/articles/s41567-018-0219-4)

### Inferences
- A public ledger resembles the well-mixed condition only if all participants see the same global state of existing tags; if people see only their own neighbourhood, the local-fragmentation result applies (inference).
- Experiments have one-word names; no depth manipulation.

### Gaps
- Exact tipping-point group sizes and per-condition sample counts for the 2018 study not reconciled.

## 6. Hashtag emergence and tag suggestion effects

### Takeaway
Hashtag adoption is socially driven and competitive, with most novel hashtags dying; I found no measurement of how variants of one hashtag resolve. Evidence on suggestion effects is mixed and thin.

### Cited Findings
- Romero, Meeder, Kleinberg, "Differences in the mechanics of information diffusion across topics", WWW 2011, pp. 695-704. Political hashtags are especially persistent (repeated exposure keeps adding to adoption); idiom and neologism hashtags decay quickly in exposure effect. — [paper copy](https://webarchiveweb.wayback.bac-lac.canada.ca/web/20110316175943/http://www.cs.cornell.edu/home/kleinber/www11-hashtags.pdf)
- Lin, Margolin, Keegan, Baronchelli, Lazer, "#Bigbirds never die", ICWSM 2013. 256 novel hashtags from the 2012 US presidential debates; winners show faster growth and longer persistence; retweets speed adoption but undermine persistence. — [arXiv 1303.7144](https://arxiv.org/abs/1303.7144v1)
- Bollen and Halpin, "The role of tag suggestions in folksonomies", arXiv 0903.1788, 2009 (preprint; venue unconfirmed). Power laws form with or without suggestions; suggestions compress the distribution (shorter long tail). — [arXiv](https://arxiv.org/abs/0903.1788)
- Secondary listings of other studies (Freesound field study; tag-cloud experiment; epistemic-model dissertation) conflict: some report recommendation increases vocabulary sharing and convergence, one reports popular recommendations decrease inter-resource consistency. Not verified. — [search listing](https://arxiv.org/pdf/0911.4178.pdf)

### Gaps
- No quantitative reuse or vocabulary-size effect sizes found; Bollen/Halpin's design (11 sites, 300 participants, 7 suggestions) is from a secondary snippet only.

## 7. Hierarchy on tags

### Takeaway
Hierarchy derivation is mostly algorithmic; direct measurement of whether users agree on parent/child relations is sparse. What exists points to disagreement on direction and granularity.

### Cited Findings
- Heymann and Garcia-Molina, "Collaborative creation of communal hierarchical taxonomies in social tagging systems", Stanford InfoLab TR 2006-10. An algorithm converts a tag corpus into a hierarchy. Abstract only; no user-agreement measurement found. — [BibSonomy record](https://www.bibsonomy.org/bibtex/1d77846b40aadb0e25233cabf905bb93e/msn)
- A KDD 2010 Flickr folksonomy paper describes conflicting parent-child orderings across users and mixed specificity within hierarchies; secondary description. — [arXiv 1005.5114](https://ar5iv.labs.arxiv.org/html/1005.5114)
- One paper argues humans would not reach acceptable agreement on how tags should be interpreted. — [JIS 2015 PDF](https://corpora.ficlit.unibo.it/People/Tamburini/Pubs/JIS2015.pdf)

### Inferences
- Because every level of a path must match, per-level agreement compounds across levels. If, hypothetically, agreement per level were p, a k-level path would agree with probability about p^k when levels are independent. Independence is an assumption, not tested here.

### Gaps
- No inter-annotator agreement study on tag hierarchies found.
