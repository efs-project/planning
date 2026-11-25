# Pre-coordination vs post-coordination: evidence from indexing and IR science

Scope note: every study below used professional indexers or cataloguers (or researchers in the case of Cranfield) working on scientific or library material, mostly before 1995. The only lay-tagger evidence is in section 6. "Hooper" means the measure consistency = A/(A+M+N), where A is the number of shared terms. Section headings are this pass's key questions.

## 1. Definitions and history: Uniterm, coordinate indexing, LCSH strings, PRECIS, chain indexing

### Takeaway
Post-coordination (Uniterm) was built for cheap indexing and flexible searching of large technical report collections, and its known weakness was false drops. Pre-coordinate systems (chain indexing, PRECIS, LCSH strings) were built to keep context and syntax, and to support printed or browsable displays.

### Cited Findings
- Mortimer Taube introduced Uniterm in 1951 ("Coordinate Indexing of Scientific Fields"). It grew out of ASTIA indexing work, and the manual is ASTIA's *Installation Manual for the Uniterm System of Coordinate Indexing* (Oct 1953) — [Wikipedia: Uniterm](https://en.wikipedia.org/wiki/Uniterm) (secondary).
- The concern raised from the start was false positives: terms combined at search time that, in the document, described unrelated concepts — [Wikipedia: Uniterm](https://en.wikipedia.org/wiki/Uniterm). An early critique is Sanford & Theriault, "Problems in the Application of Uniterm Coordinate Indexing", *College & Research Libraries* (1956) — [IDEALS record](https://www.ideals.illinois.edu/items/36930). I did not read it.
- Chain indexing (Ranganathan) was used by the British National Bibliography (BNB); only one entry per document is fully coextensive with the subject. PRECIS (Derek Austin) replaced it so that every access term leads to an entry expressing the full subject in context. PRECIS was trialled on about 95,000 BNB documents in 1971–73 and became definitive in 1974. BNB replaced it with COMPASS in 1996 and later with LCSH — [ISKO Encyclopedia: PRECIS](https://isko.org/cyclo/precis); [Wikipedia: Derek Austin](https://en.wikipedia.org/wiki/Derek_Austin).

### Inferences
- Pre-coordination fixes the problem of related concepts being falsely combined (false drops). Post-coordination fixes the problem of having to foresee every combination in advance. Each design moves the cost to the other side: to the indexer's syntax or to the searcher's Boolean query.

### Gaps
- I did not read Taube's own texts; Wikipedia is the secondary source for 1951–53.

## 2. Cranfield I and II

### Takeaway
In Cranfield I, four very different index languages performed within a few percentage points of each other. Cranfield II ranked single natural-language words first, ahead of compound "concept" languages and controlled languages. The authors called this surprising, and it was hotly disputed.

### Cited Findings
- Cranfield I (1960–62) compared UDC, an alphabetical subject catalogue, a faceted classification and Uniterm on aeronautics papers (about 18,000 per Wikipedia). At face value, Uniterm beat alphabetical by about 3.9%, alphabetical beat UDC by 5.3%, and UDC beat facet by 3.5%. Allowing for standard error, the differences could be as small as 3.2%. Most failures came from indexing, not from the index language. Systems ran at about 60–90% recall and 10–25% precision ("relevance") — [Spärck Jones (ed.), *Information Retrieval Experiment* (1981), ch. 13, p. 264](https://www-nlpir.nist.gov/projects/irlib/pubs/ire/ire_text/pg_264.txt); [Wikipedia: Cranfield experiments](https://en.wikipedia.org/wiki/Cranfield_experiments).
- Cranfield II (1963–66) tested 33 index languages in groups: single terms, simple and compound concepts (pre-coordinated phrases), controlled terms, titles and abstracts. Collections were 1,400 documents with 221 questions and 200 documents with 42 questions. In the ranking, single terms with word forms conflated scored best (normalised recall 65.82) and simple concepts scored worst (44.64). The authors judged that simple concepts were over-specific, single terms were "about right", and controlled languages sat in between — [Spärck Jones p. 278](https://www-nlpir.nist.gov/projects/irlib/pubs/ire/ire_text/pg_278.txt).
- At coordination level 2–3 on the 200-document set:

| Language | Recall | Precision |
|---|---|---|
| Single terms, simplest | 66.7% | 14.8% |
| Single terms, most condensed hierarchy | 82.3% | 7.4% |
| Concepts, basic | 14.1% | 50.9% |
| Concepts, most condensed | 84.8% | 6.1% |
| Controlled terms, basic | 68.7% | 12.6% |

  Pre-coordinated concepts therefore gave high precision but very low recall — [Spärck Jones p. 277](https://www-nlpir.nist.gov/projects/irlib/pubs/ire/ire_text/pg_277.txt).
- Cleverdon, "The Cranfield tests on index language devices", *Aslib Proceedings* 19(6):173–194 (1967), [doi:10.1108/eb050097](https://www.doi.org/10.1108/EB050097). Its abstract says single-word terms beat concept terms and the controlled vocabulary *under that test's conditions* (abstract only).
- Criticism:
  - Swanson, *Library Quarterly* 35 (1965): questions were derived from source documents in the collection, so the design "guaranteed" results.
  - Harter, *Library Quarterly* 41 (1971): faulted the relevance assessments.
  - Spärck Jones judged these points partly overstated, with no evidence the procedure actually changed the results — [Spärck Jones pp. 281–284 via search summary](https://www-nlpir.nist.gov/projects/irlib/pubs/ire/ire_text/pg_283.txt) (secondary; I did not read Swanson or Harter).

### Inferences
- Cranfield measures retrieval effectiveness. It does **not** measure agreement between independent indexers. Its relevance to "strangers converge" is indirect: the specificity that worked best was the single word.

### Gaps
- I did not read the Cranfield II volume 2 tables directly.

## 3. Inter-indexer consistency, and whether it falls for compound or subdivided headings

### Takeaway
Consistency across studies spans about 4–82% and typically sits around 30–60%. **Direct evidence exists, from two studies, that attaching subdivisions or subheadings lowers agreement.** Neither study isolates specificity cleanly.

### Cited Findings

| Study | Setting | Result |
|---|---|---|
| Hooper, Leonard (1977), Markey (1984) reviews | ~25 published and unpublished experiments | Range **4%–82%** — as summarised by [Tonta 1991](http://eprints.rclis.org/9464/1/indxcons.pdf); Leonard reviewed 34 studies and Markey 25 ([search summary of Iivonen 1993](https://journal.fi/inf/article/download/1449/1296/3648)) |
| Soler Monreal / Gil-Leiva (2011) review | studies since the 1960s | about **10–60%** ([PDF](https://webs.um.es/isgil/resources/Evaluation%20controlled%20vocabularies%20Gil-Leiva%20Soler%20Monreal.pdf), via search summary) |
| **Funk & Reid 1983** | MEDLINE, 760 articles each indexed twice by NLM indexers | Checktags **74.7%**; geographics 56.6%; descriptors (MH+CT) 55.4%; main headings **48.2%**. Abstract: consistency was **lowered when subheadings were added to a main heading**; "floating" subheadings were more consistent than attached ones; central concepts were more consistent than peripheral ones — [abstract, PMC227138](https://pmc.ncbi.nlm.nih.gov/articles/PMC227138); figures from [Mork et al. 2017, Table 3](https://jbiomedsem.biomedcentral.com/articles/10.1186/s13326-017-0113-5) |
| Leonard 1975 thesis; Lancaster 1968 | MEDLARS | descriptors 48.2% and 46.1% ([Mork et al. 2017](https://jbiomedsem.biomedcentral.com/articles/10.1186/s13326-017-0113-5)) |
| Marcetich & Schuyler 1981 | NLM | all main headings 39% (manual) and 43% (computer-aided) (same source) |
| **Tonta 1991** | LC vs British Library cataloguers, LCSH, 82 library-science books (1987) | full-string **exact** match **16%**. **Partial** match **36%**, where partial allowed a missing subdivision if the main heading matched, plus a non-initial synonym — [LRTS 35(2):177–185, PDF](http://eprints.rclis.org/9464/1/indxcons.pdf) (full text read) |
| Chan 1989 | LC vs non-LC LCSH assignment | 70 exact matches in 334 unique assignments (about 21%) — [ITAL 8(4):349–58](https://www.proquest.com/docview/2014394181) (secondary snippet, unverified) |
| Sievert & Andrews 1991 | *Information Science Abstracts* (1 main heading + 1–2 subheadings, small vocabulary) | "bipolar" pattern: about half complete match, about half none. Small controlled descriptors were the most consistent and natural-language identifiers the least. More terms meant lower consistency — [JASIS 42(1):1–6, abstract](https://ideas.repec.org/a/bla/jamest/v42y1991i1p1-6.html) |
| Moreno Fernández et al. 2013 | LILACS (DeCS, a MeSH derivative), 97 pairs | all terms 31.6% Hooper; descriptors 36.6%; qualifiers 11%. Number of terms correlated with consistency at r ≈ −0.27 — [Information Research 18(4) paper 601](https://informationr.net/ir/18-4/paper601.html) |
| Zunde & Dexter 1969 | method paper | weighted ("fuzzy") consistency that credits agreement on important terms more — [Am. Doc. 20(3):259–267](https://ideas.repec.org/a/bla/amedoc/v20y1969i3p259-267.html) (abstract only) |

### Inferences
- Tonta's figures imply that, for LCSH, demanding agreement on the full subdivided string costs about 20 points of agreement (16% vs 36%). The partial figure also forgives some synonyms, so the subdivision effect alone is smaller than 20 points.
- Funk & Reid's attached-subheading result points the same way inside MeSH.
- Several studies show agreement rising as vocabularies get smaller and coarser: checktags are highest (a small fixed set), and the small ISA vocabulary gives all-or-nothing matches.

### Gaps
- I found **no** study that varies specificity or hierarchy depth as a controlled variable and measures agreement. The evidence is observational and confounded by synonym handling and by exhaustivity (how many terms are assigned).
- I could not retrieve Funk & Reid's MH/SH-pair percentage; only the qualitative "lowered" is verified.
- I could not open Leonard 1977 (IDEALS returned 403) or Markey 1984.

## 4. FAST

### Takeaway
FAST keeps LCSH's vocabulary but discards its string syntax. The stated reasons are ease of application by non-specialists, machine authority control, faceted navigation, and linked data. Adoption is broad but partial, and NLM independently "unstrung" its MeSH subject strings in 2015.

### Cited Findings
- A 1999 ALCTS Subject Analysis Committee recommendation was that LCSH strings be "broken up [faceted]" into topic, place, period, language and so on, "particularly where non-catalogers" assign headings. Dean (2003/04) wrote that LCSH's complex syntax "requires highly skilled personnel" and limits automated authority control — [search summary of OCLC FAST documents](https://www.oclc.org/content/dam/research/activities/fast/dc-fast.doc); [Wikipedia: FAST](https://en.wikipedia.org/wiki/Faceted_Application_of_Subject_Terminology). These come via secondary summary; the IFLA 2003 paper was unreachable.
- FAST has eight facets and about 1.7–1.8 million authority records. OCLC auto-generates FAST in WorldCat from the LCSH in each record — [OCLC help](https://help.oclc.org/Metadata_Services/WorldShare_Record_Manager/Authority_records/Work_with_authority_records/FAST_Authorities); [DCMI](https://msi.dublincore.org/standards/fast).
- From OCLC's Hanging Together blog (2016, updated 2024):
  - Cornell trained LCSH cataloguers on FAST in about 10 minutes.
  - Objections to FAST: loss of context, cross-references and scope notes; "more irrelevant results"; weak support in browse displays.
  - Adoption ranges from "everything" to only theses or backlogs.
  - [Smith-Yoshimura, *Hanging Together*](https://hangingtogether.org/faceted-vocabularies/).
- The British Library consulted in 2016 on replacing LCSH with FAST; respondents feared loss of precision. A 2023 report says FAST extended to most BL workflows by 2022 — [search summary of Ashton & Kent 2023](https://wiki.dnb.de/download/attachments/117935006/ashtonFastforFrankfurt2.pdf?api=v2). This is secondary and unverified.
- **NLM decision:** from December 2015, NLM stopped distributing MeSH strings it had built by multiplying each topic by every geographic and publication-type term (one heading + 2 geographics + 1 type = 6 strings). The stated reason: "Long subject strings do not work well" for linked data. A 2005 attempt had failed against strong opposition; in 2015 the response was unanimous — [NLM Tech Bull MJ 2015](https://www.nlm.nih.gov/pubs/techbull/mj15/mj15_cataloging_unstringing_survey.html); [SO 2015](https://www.nlm.nih.gov/pubs/techbull/so15/so15_cataloging_unstringing_subject_heading.html).
- NLM kept topical subheadings attached to the main heading (650 $a $x); only place and form were split out (same source).

### Gaps
- I found no published retrieval or agreement measurement comparing FAST with LCSH.

## 5. MeSH polyhierarchy (computed)

### Takeaway
About 30% of MeSH descriptors have two or more distinct parent descriptors. The headline figure of 53% with more than one tree number overstates this, because tree numbers are inherited from parents placed in several branches.

### Cited Findings
- **Method:** I downloaded `desc2026.gz` from [NLM MeSH files](https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/) (MeSH 2026 production year; Last-Modified 2026-08-12; no 2027 file was posted as of 2026-11-25). I parsed `TreeNumberList` for each `DescriptorRecord`. A tree number's parent is that number with its last `.segment` removed. A top-level node's parent is its category letter.
- **Result:**

| Measure | Value |
|---|---|
| Descriptors | 31,110 (2 have no tree number) |
| Tree numbers | 65,360 |
| Mean tree numbers per descriptor | **2.10** |
| Descriptors with more than one tree number | 16,507 (**53.1%**) |
| Largest count for one descriptor | 24 (D017624) |
| Mean **distinct** parents | **1.37** |
| Descriptors with 2 or more distinct parents | 9,353 (**30.1%**) |
| Parent-count distribution (1 / 2 / 3 / 4 / 5 / 6 parents) | 21,755 / 7,557 / 1,483 / 259 / 44 / 10 |
| Descriptors spanning more than one top-level category | 8.5% |

### Inferences
- In a mature, professionally curated vocabulary, roughly one concept in three legitimately sits under several parents. A single-path compound identifier (`a/b/c`) could express only one of those placements.

### Gaps
- I found no NLM-published figure to cross-check these numbers.

## 6. Specificity in free tagging

### Takeaway
The tagging literature identifies "basic level variation" as a cause of disagreement and shows that tag proportions stabilise across many users. It contains **no** measured comparison of agreement for compound or hierarchical tags against single-word tags.

### Cited Findings
- Golder & Huberman, *J. Information Science* 32(2):198–208 (2006), [doi:10.1177/0165551506062337](https://collablab.northwestern.edu/CollabolabDistro/nucmc/GolderAndHuberman-usage%20patterns%20collab%20tagging.pdf) (full text read):
  - Citing Tanaka & Taylor (1991), basic levels vary with expertise: a dog expert's basic level is "beagle".
  - Conflicting basic levels "can prove disastrous": `perl` is too specific for some users, `programming` too general for others.
  - Earlier tags in a bookmark were more frequent, so the authors suggest the first tags represent the basic level.
  - On del.icio.us, after "the first 100 or so bookmarks" each tag's share of a URL's tags is nearly fixed.
- Wolfram, Olson & Bloom, JASIST 60(10):1995–2003 (2009), CiteULike: no significant difference in consistency between subject areas — [abstract](https://ideas.repec.org/a/bla/jamist/v60y2009i10p1995-2003.html).
- One CiteULike study found that of 4,638 tags assigned, only 946 were used by two or more users. It names specificity variation, synonymy and polysemy as causes — [search summary](https://ideals.illinois.edu/items/26459/bitstreams/90319/data.pdf) (the PDF returned 403; source identity unverified).
- A compound-tag study reports that most compound tags are applied only once, often joined with `-`, `_` or `.` — search summary only; source not identified.

### Gaps
- I found no study of agreement on multi-segment path tags (e.g. `a/b/c`) by lay taggers. After targeted searches I conclude this evidence likely does not exist in the IS literature.

## 7. Evidence for pre-coordination and hierarchy

### Takeaway
The pro-pre-coordination case rests on precision, word-order semantics, context and browsability. It is argued by expert practitioners and backed by institutional decision, not by controlled measurement.

### Cited Findings
- Cranfield II: pre-coordinated concepts gave the highest precision, 50.9% at 14.1% recall — [Spärck Jones p. 277](https://www-nlpir.nist.gov/projects/irlib/pubs/ire/ire_text/pg_277.txt).
- Thomas Mann (LC reference librarian), "Is Precoordination Unnecessary in LCSH?" (2000 LC Bicentennial Conference) — [PDF](https://www.loc.gov/catdir/bibcontrol/mann_paper.pdf) (full text read). He argues that:
  - the meaning of thousands of headings depends on word order, which Boolean AND cannot capture;
  - links from LCSH to LC Classification depend on string order;
  - browse displays let researchers "recognize" options they could not specify in advance, and this matters more as files grow;
  - cross-reference networks depend on the strings.
- LC's CPSO report (2007; page dated 2008-02-19) kept pre-coordination, citing "precise searching", browsability, disambiguation and suggestion, and recommended simplification such as a fixed subdivision order — [LC pre_vs_post](https://www.loc.gov/catdir/cpso/pre_vs_post.html). The page reports no measured data.

### Inferences
- Read together, the evidence suggests a trade-off rather than a winner:
  - Pre-coordination buys precision and context.
  - It costs agreement on full strings (Tonta: 16% vs 36%; Funk & Reid: subheadings lower consistency) and recall (Cranfield).
- All of this evidence comes from trained indexers, so the agreement penalty for strangers is plausibly larger, but this is not measured.
