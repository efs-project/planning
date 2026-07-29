# Target-community research method

**Status:** completed research protocol; market evidence and recommendations only, not an owner ruling or design amendment
**Date:** 2026-07-29
**Scope:** first-user communities for EFS; migration, complement, and rescue wedges

#status/done #kind/research #repo/planning #topic/use-cases #topic/content #topic/market-research

## Why the launch prompt was widened

The launch prompt correctly asks who already feels the pain of loss. This pass adds five tests that turn a broad community survey into an acquisition and product decision:

1. **Name the adoption shape.** “Use EFS” may mean replacing a platform, publishing an opt-in permanent copy, anchoring a portable bundle, preserving only a catalog and checksums, or letting independent curators share overlapping views. These have radically different adoption costs.
2. **Name the seed steward.** Every serious candidate must identify who can lawfully create the first 10,000 useful EFS objects and why they would do the work. A large audience with no credible initial curator is not a launch community.
3. **Name the network effect.** More content alone is not enough. The pass looks for reusable tags, mirrors, test results, citations, annotations, and curator lenses whose value grows when a second independent group participates.
4. **Separate permanence pain from deletion need.** A community can fear platform loss and still depend on withdrawal, pseudonym separation, consent revocation, or legal takedown. If so, EFS may be suitable only for opt-in manifests or rights-cleared subsets—not the underlying bytes.
5. **Make the gallery a falsification fixture.** A visual catalog must be tested at realistic item, tag, thumbnail, curator, deny-list, and query cardinalities. “We can render cards” is not evidence that EFS can serve a booru-class collection.

The research also distinguishes a **community wedge** from a **content category**. “Adult content” is not one community: creator-owned illustrated work, indie adult games, commercial video, and anonymous rehosting have different cultures, rights chains, safety risks, and product needs.

## Evidence discipline

- Prefer official platform documentation, policies, public statistics, annual reports, project repositories, and first-party incident accounts.
- Use contemporary reporting where the primary record is unavailable or where independent context is necessary.
- Attribute scale figures to a date and source; do not turn an order-of-magnitude estimate into a current fact.
- Mark EFS fit as analysis, not as a decision already made by the project owner.
- Treat legal conclusions as product-risk screening, not legal advice.
- Reuse the existing EFS legal posture from [[law-positioning]]: public plaintext is permanent; serving layers can decline to serve; lenses do not delete kernel records; EFS is not a home for other people's personal data.

## Candidate score

Each dimension is scored 0–5. The weighted total is out of 100.

| Dimension | Weight | A score of 5 means |
|---|---:|---|
| Loss signal and urgency | 20 | repeated shutdown, purge, link-rot, or acquisition loss is central to the community's lived history |
| Rights, consent, and safety fit | 20 | the seed corpus is creator-owned, explicitly licensed, or plainly public; dangerous personal-data and consent cases can be excluded |
| EFS-native advantage | 15 | permanence, independently verifiable records, portable citations, multiple mirrors, and overlapping lenses all matter |
| Seedability and reachable steward | 15 | a named group can lawfully seed useful content without waiting for mass consumer adoption |
| Small-team product fit | 10 | EFS can deliver standalone value before rebuilding payments, messaging, commissions, or a whole social network |
| Network-effect quality | 10 | each new curator, mirror, tag correction, test result, or citation makes existing objects more valuable |
| Storage and economic fit | 5 | the first useful corpus can use manifests and replaceable mirrors without requiring unpriced permanent state bytes at huge scale |
| Gallery/browse pressure | 5 | the candidate materially tests visual cards, filters, tags, previews, collection browsing, and failure states |

Scores are comparative research judgments. They are not measurements and should be revisited after user interviews and the EFS gas/cost snapshot.

### Steward-readiness calibration

The first draft of the research scored a plausible steward profile too generously. The adversarial pass corrects that:

- **0–2/5:** an archetype or named organization has been identified, but nobody has been contacted and no representative corpus has been offered;
- **3/5:** a decision-capable representative has been interviewed and offers a rights-reviewed corpus for evaluation;
- **4/5:** the steward names the integration owner, inclusion/notices policy, recurring labor, and provisional budget; and
- **5/5:** the steward has committed the corpus, authority, operators, labor, and budget to a bounded pilot.

No candidate in this desk-research pass is above 2/5. Platform incidents, public APIs, open licenses, and a theoretically lawful seed are evidence of fit; they are not evidence that a community has agreed to use EFS.

The ranked community scorecard also treats these as hard gates rather than small weighted bonuses:

1. a demonstrated advantage over a signed manifest plus ordinary replicated storage;
2. recurring behavior after the seed import;
3. an accepted one-year total cost of ownership;
4. a non-project operator that can reconstruct and serve the corpus; and
5. representative rights, permanence, notice, and serving cases handled before public admission.

A candidate that has not passed those gates is **`UNVALIDATED`**, even if its desk-research score is high.

## Risk gates

A high numeric score does not override these gates:

- **No-go as a first-party byte host:** the community's normal operation depends on non-consensual or infringing rehosting, or its dangerous-content rate cannot be bounded by a rights-cleared seed.
- **Manifest/catalog only:** most bytes are not redistributable, but metadata, checksums, provenance, test results, and lawful source links are useful.
- **Opt-in only:** author withdrawal, subject consent, pseudonym separation, or changing safety needs are culturally important. The publisher must deliberately choose permanence before any byte leaves the local journal.
- **Serving-layer dependency:** the demo needs age gates, jurisdiction rules, copyright notices, hash deny-lists, or other moderation. A lens can choose what a viewer sees; it cannot erase an unlawful byte or discharge an operator's legal duties.
- **Service-expansion gate:** the wedge is not viable if it requires EFS-the-project to become the payment processor, marketplace, identity verifier, or universal moderation authority.

## Adoption shapes

| Shape | Best fit | What EFS supplies |
|---|---|---|
| Permanent home | creator-owned, deliberately public work | exact immutable releases, durable links, mirrors, history |
| Lifeboat | threatened platform exports and community collections | portable manifest/bundle, consent and context records, browsable archive |
| Integrity layer | institutions that already host bytes well | checksums, provenance, version receipts, citations, mirror inventory |
| Catalog without bytes | restricted software/media or high-risk archives | metadata, rights state, compatibility, source links, curator views |
| Curator commons | one corpus with legitimate disagreement | overlapping lenses, source attribution, labels, denials, reproducible views |

“Replace the incumbent” is not the default. Complementary adoption is usually more credible and still exercises the EFS primitives that matter.

## Product falsification fixtures

### Visual gallery fixture

Use a synthetic, rights-cleared corpus so the benchmark does not smuggle in a product decision:

- 10,000 media items for the first functional gate; 1,000,000 for the scale gate.
- A p50 of 35 and p95 of 100 tag assertions per item, including aliases, implications, mutually disputed tags, source/artist tags, ratings, and content warnings.
- Original, card thumbnail, and optional preview identities kept distinct; derived previews are labeled and rebuildable.
- Two- to five-tag intersections, negative filters/blacklists, chronological paging, duplicate lookup by content hash, and bounded related-item traversal.
- 20 ordinary curator/labeler sources plus one large community-curation principal; saved views must retain provenance.
- Walletless cold browse; useful bounded browsing when enhanced search/ranking is unavailable; `UNKNOWN` must never become an empty gallery.
- Rights/consent state, takedown or deny advisories, and age/content-warning policies evaluated separately from integrity and availability.

This deliberately pressures the boundary already stated in [[onchain-completeness]] and [[lens-spec]]: exact bounded traversal and selective intersections may be core; ranked, trending, full-text, global aggregates, and cross-realm search are enhanced/off-chain and need honest fallbacks.

### Dataset fixture

- 3,000 datasets, 10,000 version/manifest objects, 100 source offices or institutions.
- Multi-file releases with schema, license, capture time, source URL, checksums, byte size, mirror list, steward, and supersession/diff metadata.
- Exact citation of one version; mirror failure and partial-byte states; reconstruction from a bundle and public RPC plus declared byte mirrors.
- Large bytes default to replaceable mirrors; on-chain records carry the durable identity, commitments, provenance, and version graph.

### Package/playable fixture

- 100 rights-cleared packages spanning single-file web work, multi-file work, and one emulator/runtime-backed lane.
- Exact generation manifests, screenshots, tags, content warnings, license/redistribution state, runtime tests, mirrors, and channel history.
- A creator can publish a new version without invalidating old citations; a curator can withdraw a recommendation without pretending the old bytes vanished.

## Cost gate

No candidate gets a launch recommendation that assumes unmeasured upload economics. For each fixture the implementation pass must price:

`records + index postings + admission + relayer + byte storage + preview derivation + mirror retention`

The current design explicitly leaves the large-upload funding problem exogenous ([[large-file-uploads]]) and leaves ranked/full-text discovery outside core truth ([[onchain-completeness]]). Until the E2/gas snapshot exists, the safe market promise is:

- durable, on-chain identity, commitments, provenance, versioning, and bounded collection structure;
- originals in author-chosen or community-funded mirrors by default;
- state-tier bytes only when a publisher explicitly pays for that stronger capability;
- no claim that an EFS upload is cheap merely because the signature is batched.

## Research stop rule

The pass is complete when it can:

1. rank 3–5 candidates without treating every community as equally plausible;
2. name a lawful first corpus and reachable seed steward for each finalist;
3. describe a demo that creates value without platform replacement;
4. list the EFS requirement or design gap each finalist exposes; and
5. say plainly which attractive communities EFS should not court first.
