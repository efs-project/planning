# Wikifreedia, plural knowledge, and EFS

**Status:** finished research review; review-layer input only — no EFS architecture, requirement, owner ruling, or milestone is adopted here
**Agent:** pm (Codex), 2026-07-29
**Evidence:** live product inspection; direct relay-corpus snapshot; application and relay source at pinned commits; NIP-54 and its proposal history; sixteen precedent projects; current EFS v2 and Client v2 draft crosswalk
**Corpus:** [`2026-07-29-wikifreedia-corpus/`](./2026-07-29-wikifreedia-corpus/README.md)
**Potential feeds:** portable schema/validator pass · candidate lens replacement spec · guest path · public-collaboration cookbook · preservation bundle · Client app/rendering safety

#kind/review #status/done #repo/planning #topic/efsv2 #topic/lenses #topic/knowledge

## Executive verdict

Wikifreedia is a genuinely good EFS pressure test. Its core move is simple and important: **a topic has no protocol-canonical article; several authors may publish signed versions, and the reader or client decides what to show.** Forks, merge requests, redirects, reactions, and deference are portable Nostr records rather than permissions granted by one wiki administrator.

Its strongest contribution is that data model, not the current service. The [audited NIP-54 record layer](https://github.com/nostr-protocol/nips/blob/6d2979b3f503a8539c983efbcdcf901bbcf9ed23/54.md) has strong authorship-integrity and portability properties. The reference service's default search, AI comparison, hosting, funding, and governance remain operator-dependent. Its application source is publicly visible but unlicensed; its separate relay is MIT licensed. This is not a contradiction: a protocol can offer credible exit while its reference client still has practical control points.

The EFS lesson is not “copy Wikifreedia” or “add a wiki primitive.” The workload suggests testing this separation in the current candidate LP-1/LP-3 model:

> **A perspective remains signed data. A candidate lens supplies reader policy over authenticated evidence. Ranking, clustering, and synthesis remain attributable app/derived outputs that such a policy may select or consume—not hidden protocol truth.**

EFS's current draft direction contains plausible candidate homes for the workload, but that fit is **promising, not proven**. The portable-schema pass explicitly says arbitrary application shapes, portable validators, and schema discovery have not yet been demonstrated. Candidate lenses, the guest path, KEL, the public revision-DAG pattern, the preservation bundle, and the third-party app runtime all remain draft or incomplete. This use case does not justify a Wikifreedia-specific kernel primitive; it should help test whether the generic schema pass can preserve the five-kind model or needs a generic `SCHEMA` kind.

**One next action:** give the portable-schema/validator deep dive one complete plural-knowledge trace—`PerspectiveEntry`, `Citation`, `Vouch`, `Label`, `TopicRelation`, and `DerivedComparison` exchanged by independent clients, discovered through an independently replaceable index, read through an inspectable policy, and reconstructed from an exit bundle. Do not make Wikifreedia a milestone or ask James to choose an app architecture yet.

## The research brief, strengthened

The original prompt asked what Wikifreedia wants, whether it is open and credibly neutral, how it works, what EFS can learn, and what alternatives exist. This review made those questions falsifiable:

1. **Mission:** What user problem and epistemic failure is it trying to correct? What does it deliberately refuse to decide?
2. **Mechanism:** What is signed, mutable, content-addressed, indexed, ranked, cached, or synthesized? What happens when authors disagree?
3. **Control planes:** Who controls publishing, retention, discovery, ranking, moderation, defaults, AI execution, funding, and protocol evolution?
4. **Exit:** Can another operator legally and technically run a client, recover the corpus, reproduce a view, and continue after the project disappears?
5. **Reality:** Does the live corpus exercise the competing-perspectives model? What does repository history show? Which claims are product aspiration rather than demonstrated operation?
6. **Alternatives:** Which systems solve the same problem, and which merely donate one useful mechanism? What did mature systems learn about source quality, false balance, revision history, and governance?
7. **EFS falsification:** Which current EFS primitives actually carry this workload, which parts remain proposals, and what observation would prove a generic substrate gap?

## What Wikifreedia is trying to do

The [live site](https://wikifreedia.xyz/) describes an encyclopedia that does not force contributors into one supposedly neutral article. Authors own and sign their versions; readers see the source of each version and can choose whom to trust. Disagreement is preserved instead of being resolved behind one editorial voice.

That critique should not be turned into a caricature of Wikipedia. [Wikipedia's neutral-point-of-view policy](https://en.wikipedia.org/wiki/Wikipedia:Neutral_point_of_view) requires significant published views to be represented fairly and proportionately, with reliable sourcing and due weight. Wikipedia's model is **one negotiated synthesis**, not “admins declare truth.” Wikifreedia's real contrast is that it keeps author-owned parallel versions as first-class objects instead of requiring every dispute to converge into one current article.

The live product supports:

- unauthenticated guest reading and direct links;
- Nostr-key or extension-based writing;
- several independently signed entries under one topic;
- author profiles, reactions, comments, forks, merge requests, and deference;
- selection of two or three entries and an AI-generated agreement/disagreement/merged-entry view;
- a patronage fund that openly says human editorial judgment determines what receives funding.

The last item is a useful honesty signal. Funding does not corrupt signed records, but it shapes which records get produced. **Subsidy is another curation plane and should be labeled as such.**

## How the protocol works

Wikifreedia implements the public-domain, still-`draft` and `optional` [Nostr NIP-54 at the audited revision](https://github.com/nostr-protocol/nips/blob/6d2979b3f503a8539c983efbcdcf901bbcf9ed23/54.md):

- `kind:30818` is an addressable wiki entry.
- The normalized `d` tag names the topic.
- The live coordinate is `(kind, author pubkey, d tag)`.
- The body should use Djot markup; the reference app also renders legacy AsciiDoc entries.
- `fork` tags can link a new entry to an exact source event and its address; NIP-54 says both `a` and `e` tags should be used, but a relay does not enforce that relationship.
- `kind:818` is a merge request; reactions signal acceptance or rejection socially, not through protocol-enforced merging.
- `kind:30819` is a redirect.
- `defer` lets an author put their recommendation behind another exact version; using both `a` and `e` is again recommended rather than guaranteed.
- reactions, relay lists, contact lists, and wiki-specific contact lists are possible client-ranking inputs.

A writer updating their own entry replaces the current event at that address. Editing someone else's entry produces a fork signed by the editor. A topic link intentionally leaves version selection to the reader's client; an exact event reference identifies one immutable version.

That yields one of the review's strongest requirements:

- **semantic link:** “open the topic `bitcoin` through my current reader policy”;
- **evidentiary link:** “open this exact content-addressed signed record by event ID.”

Navigation benefits from semantic resolution. Citations, reactions, audits, reputation, and AI inputs must bind to immutable versions. A recommendation attached only to a mutable author/topic coordinate can be earned by good text and silently inherited by a later replacement. The [original NIP discussion identified this attack](https://github.com/nostr-protocol/nips/pull/787#issuecomment-1723403032) and suggested archival relays as a retrieval answer, but archival availability remains an external dependency.

The topic normalization is intentionally simple. Lowercasing and whitespace-to-hyphen conversion are required; removing punctuation/symbols, collapsing repeated hyphens, and trimming them are recommendations. Unicode letters and numbers are preserved. The live relay does not enforce those rules and admits nonconforming `d` values, so the specified normalized identifier must not be confused with relay admission. Even when followed, the rules create identity questions: `C++` and `C#` can collide under the recommended punctuation removal, while a name such as “Mercury” needs aliases and disambiguation. A plural knowledge system needs explicit topic identity, alias, merge, split, and `sameAs` semantics—not only a slug.

## What the reference application adds

The application is a SvelteKit service deployed through Vercel. Its [default relay list](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/config/nostr-relays.ts#L1-L7) makes the client capable of querying several Nostr relays, and browser fan-out offers alternate retrieval when copies exist. This review did not measure replication completeness, relay acceptance, or retention across that set. However:

- [full-text Explore search uses the Wikifreedia relay exclusively](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/explore/%2Bpage.svelte#L28-L44);
- the [browser cache warm path](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/stores/wiki-cache-warm-sync.ts#L18-L20) and [server-rendered topic seed](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/%5Btopic%5D/%2Bpage.server.ts#L9-L25) use that relay;
- browser hydration can still attempt retrieval from the broader default relay set when copies exist there;
- [Web-of-Trust filtering is off by default](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/stores/wot.ts#L17-L92), but signed-in users with a loaded graph may still get distance-based reordering because ranking does not check that toggle; guests without a graph keep the input order;
- the AI comparison service fetches exact events but uses an operator-selected model and prompt.

The search choice centralizes visibility **inside this client**. It does not prevent someone from publishing the event elsewhere or another client from retrieving copies held elsewhere.

The AI comparison is good product UX but weak provenance. The operator can [override the model and system prompt](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/server/event-comparisons/service.ts#L49-L63) through [admin controls](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/admin/%2Bpage.server.ts#L56-L72). The response discloses fresh versus cached and the UI exposes selected perspectives, but the result does not attest that those inputs exhaust the perspectives known to any stated index or candidate set. It also omits model build, prompt version, operator, generation time, parameters, signature, and a portable receipt. Untrusted article text is inserted into the model input, creating a prompt-injection surface. The [cache identity binds event IDs but not model/prompt version](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/server/event-comparisons/cache.ts#L19-L20), so a changed policy does not necessarily invalidate an old result.

No deployment attestation was found proving that the live site runs exactly the audited application commit. Admin controls, cache construction, rendering, and NIP-05 behavior below are therefore pinned-source findings; live UI and response observations are separate corroborating evidence, not proof of exact deployment parity.

A better system would make an AI comparison a separately attributable derived artifact, never a neutral voice:

`exact inputs + source basis + model/build + prompt/policy + operator + parameters + output hash + omissions + human edits + supersession`

Exact replay may be impossible for nondeterministic or proprietary models. That limitation should be disclosed, not hidden behind a “reproducible” label.

## Current reality, not just the pitch

### Relay corpus snapshot — 2026-07-29

A direct NIP-45/REQ audit of `wss://relay.wikifreedia.xyz` found:

| Observation | Count |
|---|---:|
| queryable `kind:30818` events in this relay snapshot | 411 |
| author pubkeys | 136 |
| distinct nonblank observed `d` identifiers | 298 |
| exact `d` identifiers represented by one pubkey | 247 (82.9%) |
| exact `d` identifiers represented by more than one pubkey | 51 (17.1%) |
| events containing a `fork` marker | 72 |
| events containing a `defer` marker | 8 |
| `kind:818` merge-request events | 30 |
| `kind:30819` redirects | 0 |

The entry range was 2023-08-31 through 2026-07-26. The top author accounted for 6.6% of entries; the top five 23.8%; the top ten 40.6%.

This is a **relay corpus snapshot**, not a user or adoption count. Pubkeys are not verified people; one person can own several; keys may represent bots, imports, or tests; merge-request events do not show accepted collaboration; and exact `d` string groupings are not proven semantic topics or genuine disagreement. The corpus contains identifiers that violate required lowercase normalization and others that retain punctuation/symbols permitted by the non-enforcing relay. Expected field and ID/signature hex shapes were checked and IDs were deduplicated, but event IDs were not recomputed and signatures were not independently cryptographically verified. `fork` and `defer` markers were counted without validating their referenced relationships. The fair conclusion is: **the model is exercised and the corpus is current, but most exact observed identifiers in this relay still have only one author record.** The dated windows, hashes, NIP-11 response, and HTTP-header observations are preserved in [`live-observations.md`](./2026-07-29-wikifreedia-corpus/live-observations.md).

### History and maintenance

- Fiatjaf proposed NIP-54 in September 2023, explicitly drawing on Federated Wiki. Its discussion already surfaced mutable reputation, importing external encyclopedias under dedicated keys, client-selected topic links, and archival history.
- Pablo Fernandez started the application repository on 2024-02-24. A [May 2024 release note](https://www.nobsbitcoin.com/wikifreedia-v0-0-7/) documented the editor, mentions, reactions, public links, and friendlier URLs.
- The repository shows 23 commits in 2024, nine in 2025, and 47 in 2026. The 2026 work added the current landing/explore experience, caching and negentropy, private drafts, AI comparison, the fund, and admin controls.
- The audited application head is `2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6`, dated 2026-06-11. The live relay had entries through 2026-07-26. The project is active, not abandoned.
- It remains experimental: 79 commits, no tags or formal GitHub releases, many old onboarding/search/WoT/merge UX issues, and 74 of 79 commits authored under the repository owner's two name/email variants.

The history's most useful lesson is that the difficult work moved quickly from “can signed parallel articles exist?” to ordinary product and governance questions: guest mode, key management, search relevance, identity, media, readable diffs, reputation scale, moderation, and durable history.

## Open source and credible neutrality

The [application repository](https://github.com/pablof7z/wiki) is public and source-visible, but the audited commit contains no license and GitHub reports none. It therefore is not OSI-open-source and lacks an explicit general right to modify or redistribute; GitHub's terms still permit viewing and on-platform forking. This is the distinction [GitHub itself documents for unlicensed public repositories](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

The relay repository has a pinned [MIT license](https://github.com/pablof7z/wikifreedia-relay/blob/dd5f27756cd89ed5ccd52cda215e4101cac8db49/LICENSE). NIP-54 lives in the NIPs repository, whose [audited README dedicates NIPs to the public domain](https://github.com/nostr-protocol/nips/blob/6d2979b3f503a8539c983efbcdcf901bbcf9ed23/README.md#license). I found no per-entry content-license field in NIP-54. A public signature proves who controlled a key; it is not a reuse license. This matters for imports, merged articles, translations, AI training, and derived publications.

Credible neutrality is not one switch:

| Control plane | Current assessment | Why |
|---|---|---|
| Authorship and record integrity | strong | authors sign records; an operator cannot forge their signatures or alter bytes undetectably |
| Permissionless publication | moderate–strong | Nostr permits publication outside the reference service; relay policies and spam controls still vary |
| Availability and retention | weak–moderate | several relays can hold copies, but no demonstrated independent archival set or retention covenant exists |
| Discovery | weak in the reference client | default full-text search is tied to the Wikifreedia relay; another client may replace it |
| Ranking and moderation | mixed | clients can vary policy, but defaults can exert practical influence; filtering is optional/permissive while signed-in WoT ranking can still apply |
| Client and legal exit | weak app / strong relay and protocol | application unlicensed; relay MIT; NIP public-domain |
| AI/derived execution | weak | operator-selected model/prompt; unsigned and under-disclosed output |
| Governance and succession | weak | founder-heavy repository; no clear protocol-client governance, independent operator program, or succession process |
| Funding | transparent but curated | the fund openly uses human editorial judgment, which affects content supply |

The accurate summary is:

> NIP-54 supplies an operator-independent signed-record format with credible-exit properties at the record layer. Wikifreedia has not yet demonstrated a credibly neutral end-to-end knowledge service.

“No admin can delete your work” is layer-confused rather than wholly false. Signatures prevent undetectable alteration or forgery. They do not guarantee availability: a relay can discard its copy, an index can omit it, a client can hide it, and a domain can disappear. Independent retained copies remain outside that operator's control.

## Strengths worth preserving

1. **Disagreement becomes data.** A dissenting author does not need permission to fork or survive an edit war.
2. **Authorship boundaries stay visible.** The protocol does not let one editor silently speak as another.
3. **Fork, merge-request, defer, redirect, and exact-version relationships are explicit.**
4. **Semantic links remain useful.** The reader can choose the version at navigation time.
5. **Guest reading works.** Key complexity is deferred until writing.
6. **The base protocol is small.** Most product behavior stays client-side and replaceable.
7. **AI comparison exposes agreement and disagreement instead of only emitting one summary.**
8. **The funding page labels its editorial judgment instead of pretending subsidy is neutral.**

## Risks and lessons EFS should not miss

### Plurality is not automatically epistemic quality

Retaining every signed perspective must not mean giving every claim equal prominence. Wikipedia's sourcing, attribution, due-weight, revision-history, discussion, and anti-false-balance machinery are hard-earned strengths. A reader may choose a “show every voice,” “reliable published sources with due weight,” or community policy. This workload should reject any candidate design that silently turns one of them into universal protocol truth.

### Signatures prove key control, not truth or real-world identity

An npub is not proof that its profile is a named public figure, a doctor, one unique human, or an honest source. EFS should keep separate:

- direct signer/authorship;
- pseudonymous profile;
- verified quotation or excerpt;
- third-party attribution;
- credential or identity attestation;
- AI reconstruction;
- AI comparison/synthesis.

This is not academic. The landing navigation labels the section “Demo,” but its cards contain unsourced illustrative first-person text under real public figures' names and a hard-coded “AI Comparison”; the component does not load signed Nostr contributions. The cards do not visibly carry statement-level sourcing or a clear “illustrative/not signed” disclosure. Without provenance, the text must not be treated as a verified quotation, endorsement, signed contribution, or live perspective. A provenance product should make that boundary impossible to miss.

### Reputation must bind to immutable evidence

Likes, vouches, citations, and merge decisions should name exact immutable versions. A semantic alias can point to the current version for navigation, but reputation must not silently migrate when its content changes.

### Availability, discovery, and execution are separate

Signed bytes can be portable while one relay supplies search and one server supplies AI. EFS should test independent retrieval, independent indexing, and derived-view execution separately. Two implementations are useful evidence, not proof; a successful walk-away recovery drill is stronger.

### Public trust graphs leak sensitive beliefs

Public reactions, vouches, follows, and labels can reveal politics, religion, health beliefs, or social relationships. The knowledge workload should test local-only reactions, private/confidential storage, or aggregate publication where appropriate—not assume every trust input should be public.

### Untrusted rendering must be treated as hostile

The audited code inserts parser output with Svelte [`{@html}`](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/components/DjotRenderer.svelte#L139-L141), while tests explicitly preserve [`javascript:` links](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/utils/markup.test.ts#L55-L59). No click interceptor was found. The [inspected homepage response](./2026-07-29-wikifreedia-corpus/live-observations.md#homepage-http-observation) supplied neither a CSP header nor an observed meta CSP. That is a strong code-level click-triggered script-execution/XSS risk; no production exploitation was attempted. The EFS safety outcome should be falsifiable: dangerous markup, URLs, actions, and authority escape fail closed under hostile fixtures. Sanitizers, URL allowlists, link mediation, iframes, and typed render surfaces remain candidate mechanisms for the unfinished app model.

### Moderation cannot be reduced to “delete” versus “uncensorable”

An enduring public knowledge layer needs scoped labelers, default policies, user override, gateway takedown notices, quarantine, appeals, illegal-content handling, and transparent omission counts. Immutable record identity does not require every operator to serve every byte forever. A tombstone, withdrawal, or unavailability notice is not proof the underlying record vanished.

## The lens connection

Wikifreedia “lines up with lenses,” but only if the layers stay separate:

```text
signed perspectives, citations, labels, vouches, lineage
                            │
                            ▼
       candidate reader-selected policy + selected evidence
                            │
                            ▼
              enumerate · filter · label · explain
                            │
                            ▼
     attributable rank/group/synthesis artifact (optional)
                            │
                            ▼
              plural topic page / exact citation
```

- A **perspective** is evidence authored by someone.
- A **label** is evidence authored by a labeler.
- A **vouch** is evidence authored by a recommender.
- Under the candidate LP-1/LP-3 split, a **lens** would apply bounded reader policy over authenticated evidence.
- Current **View/receipt** concepts bind policy, basis, result, and provenance; the richer omission/model/prompt receipt proposed by this review is not yet demonstrated.
- Ranking, clustering, due-weight synthesis, and an **AI comparison** are attributable derived/app outputs a selected policy may consume—not the lens protocol itself and not consensus.

A plural topic page is usually a multi-result discovery and presentation operation, not “resolve to one canonical winner.” The reader may still choose a winner-oriented policy. That should be explicit.

All EFS lens terms above are current **draft candidates**, not settled canon. `DISCOVERY/1`, `ADVISORY/1`, the G1 guest default, and computed-set/Web-of-Trust limits remain owner-gated LP proposals; `AMBIENT/1` and kernel lane/authority interfaces are still owed. The workload validates the problem framing, not those exact mechanisms.

## Alternatives — a stack, not one competitor

The field should not be flattened into “Wikifreedia competitors.” The useful precedents sit at different layers:

| Layer | Projects | What EFS should learn |
|---|---|---|
| Baseline negotiated encyclopedia | Wikipedia/MediaWiki | synthesis, reliable sourcing, citations, due weight, revision history, public discussion, licensing, dumps, appeals |
| Same substrate | NIP-54 ecosystem | parallel signed entries, fork/defer/redirect, client-selected topic links; draft standard and relay-retention limits |
| Closest interaction precedent | Federated Wiki | author-owned pages, paragraph-sized JSON items, fork history, “chorus of voices” |
| Portable encyclopedia distribution | Encyclosphere | self-contained ZWI artifacts, offline use, replaceable-reader/indexer design; independent production operators and content/software licensing still need proof |
| Shared schemas and signed streams | Ceramic | reusable models and immutable event history; interest-based sync still needs a separate archive |
| Knowledge graph / agent memory | OriginTrail DKG | RDF assets, provenance, context graphs, multi-party verification; at the reviewed commit, V10 calls itself a testnet release candidate |
| Historical credible-exit design | Noosphere | user-owned identity/data, following, subsidiarity, credible exit; archived in 2024 |
| Structured claims and rendering | Wikidata/Wikibase; Abstract Wikipedia/Wikifunctions | claims, qualifiers, references, ranks, constraints; separate constructors/content/renderers; typed, inspectable functions before opaque LLMs; Abstract Wikipedia is still preliminary beta and not integrated into language Wikipedias |
| Granular overlay | Hypothesis / W3C Web Annotation | portable/addressable annotations with robust selectors; EFS would add signatures and immutable-version anchoring |
| Argument structure | Kialo | explicit support/oppose presented hierarchically, with linked-claim reuse; a richer typed relation DAG remains useful |
| Derived group views | Pol.is; Community Notes | clusters and cross-group/bridge scoring are attributable derived outputs a chosen policy may consume, never truth or population-wide consensus |
| Perspective-comparison UX | AllSides; Ground News | side-by-side source comparison, disclosed methodology, confidence, ownership, blind spots; ratings must remain contestable |
| Crypto-encyclopedia caution | IQ.wiki/Everipedia | onchain receipts and IPFS do not by themselves decentralize editing, discovery, governance, or operation |
| Publishing workflow | PubPub | collaborative authoring, review, annotations, typed relations, and broad export without claiming protocol decentralization |

Detailed, source-linked reports are in [`alternatives.md`](./2026-07-29-wikifreedia-corpus/alternatives.md).

## Can EFS replicate it?

### Plausible candidate homes; replication is unproven

The current EFS design corpus contains ingredients worth testing:

- immutable author-owned records and exact citations;
- independent revisions, forks, replies, and typed relationships;
- owner-ruled automatic indexing direction for known onchain relationships, records, counts, and bodies, plus replaceable enhanced search;
- draft KEL direction for principal continuity and scoped authoring authority;
- owner-gated candidate policies and Views/receipts for reader-selected handling of authenticated evidence;
- a candidate guest ladder for deep links with honest basis;
- a research-stage confined third-party application model;
- an owed portable export and recovery format.

### Credibly and safely today: not yet demonstrated

The gaps this workload exposes are already mostly known:

1. **Portable schemas and validators.** Independent developers cannot yet be shown to declare, validate, discover, and consume application record shapes as easily as EAS schemas.
2. **Plural discovery.** The reader needs several candidates plus basis/completeness, not one unexplained winner.
3. **Derived-artifact receipts.** AI, clustering, due-weight ranking, and bridge scoring need exact inputs and named execution provenance.
4. **Topic identity and exact lineage.** Aliases, collisions, homonyms, merges, splits, revisions, and exact citations need interoperable conventions.
5. **Availability and exit.** The normative `.efs-bundle` is still owed, as are demonstrated independent readers/indexers/providers and a successful recovery drill.
6. **Guest shipping path.** The candidate G1 model addresses verification and honest absence semantics, but does not prove instant boot or deferred OS/auth loading; `AMBIENT/1` and kernel interfaces still block the product.
7. **Safe content and app rendering.** HTMX/Wasm/HTML application delivery remains a research hypothesis, not a finished security boundary.
8. **Identity and attribution.** KEL is draft, and real-world identity/credential claims remain separate even if KEL lands.
9. **Moderation and law.** Permanent public records need scoped projection, takedown transparency, appeals, privacy boundaries, and precise product copy.
10. **Default and governance neutrality.** Replaceable reader policies are insufficient if one opaque default captures almost all readers.

The full current-vs-proposed crosswalk is in [`efs-crosswalk.md`](./2026-07-29-wikifreedia-corpus/efs-crosswalk.md).

## Proposed pressure-test requirements

These `WF-*` items are review findings, **not adopted EFS requirements**:

- **WF-1 — Plural enumeration:** return several conflicting candidates with the source/index basis and no false completeness claim.
- **WF-2 — Two link modes:** portable semantic topic links and immutable exact-version citations.
- **WF-3 — Lineage:** exact revision, supersession, fork, merge-request, deference, redirect, alias, split, and disambiguation relationships.
- **WF-4 — Portable types:** discoverable schemas and deterministic structural validators for perspective, citation, vouch, label, topic relation, and derived comparison.
- **WF-5 — Attribution taxonomy:** distinguish signer, pseudonym, identity attestation, quotation, third-party attribution, and AI generation.
- **WF-6 — Reader sovereignty:** ranking/moderation policy is inspectable and replaceable; public Web-of-Trust signals cannot silently become authorization.
- **WF-7 — Derived-artifact provenance:** make ranking, clustering, and synthesis separately attributable and pin exact inputs, basis, algorithm/model, policy/prompt, parameters, operator, output, omissions, and supersession; disclose non-replayability. A reader policy may select these artifacts, but the current lens receipt model does not yet prove this richer receipt.
- **WF-8 — Exit and availability:** complete signed export plus reconstruction from independent providers; no dependency on the reference search or AI service.
- **WF-9 — Safe rendering outcome:** dangerous markup, URLs, actions, and authority escape fail closed under adversarial fixtures; the unfinished Client app work chooses the mechanism.
- **WF-10 — Scoped moderation:** labels, consequences, takedown/unavailability notices, appeals, quarantine, and omission counts remain attributable.
- **WF-11 — Provenance metadata:** license, language, source, evidence type, epistemic status, and import history survive every round trip.
- **WF-12 — Guest-first direct links:** fast unauthenticated read with verified authorship/bytes when possible and honest UNKNOWN/absence language.
- **WF-13 — Neutrality evidence:** independent clients, indexers, and availability operators pass conformance and a real walk-away recovery drill before the product claims credible neutrality.
- **WF-14 — Loss-aware interop:** import/export Nostr, EAS, Wikipedia/Wikidata, and web-annotation records while preserving original signatures, IDs, licenses, attribution, and venue observations.
- **WF-15 — Privacy of belief:** trust inputs and reactions may remain local/private or be published in aggregate; public-by-default is an explicit choice, not an accident.
- **WF-16 — Due weight without protocol truth:** a reader may choose source-quality and anti-false-balance policies, but no ranking is universal truth.

## One falsifiable acceptance trace

Use a controversial topic and at least three independently implemented clients:

1. Alice publishes `PerspectiveEntry` v1 with citations.
2. Bob publishes an independent perspective under the same semantic topic.
3. Carol forks Alice's exact v1, then Alice publishes v2.
4. A labeler flags one exact version; a recommender vouches for another; a source retracts one citation.
5. Two indexers return different candidate sets; one withholds an entry.
6. Two reader policies produce different presentations and explain why.
7. A deterministic comparison and an LLM comparison each produce a separately attributable result.
8. A guest opens the semantic link, then an exact citation.
9. A second implementation reconstructs the topic from an exported bundle and independent bytes without Wikifreedia's relay, index, client, model, or API.
10. Nostr import/export preserves the original event, signature, replacement/fork relationships, and observed relays without pretending a Nostr key is automatically an EFS authority principal.

The test fails if a client must privately coordinate schemas, cannot explain its basis, silently moves reputation to Alice v2, presents index omission as nonexistence, cannot reproduce or attribute a derived result, or cannot walk away from the default operator. If the generic EFS primitives cannot pass, that is evidence of a substrate gap. Do not assume the gap in advance.

## Recommended disposition

- Preserve this as a named cross-cutting application pressure test.
- Feed the trace into the portable-schema pass first: that pass should test portable shape/type discovery and deterministic encoding/structural validation. Stateful application admission belongs to a named venue contract or application policy; the kernel owns only universal admission invariants. Read-time acceptance and presentation belong to the candidate policy layer; ranking and synthesis remain attributable derived/app work.
- Reuse it when the candidate lens profiles, guest path, public revision-DAG cookbook, preservation bundle, and Client safety model are tested.
- Do not create a Wikifreedia milestone, a `WIKI` kernel kind, or an EFS product commitment from this research.
- Revisit “should EFS ship a flagship plural-knowledge app?” only after the generic trace works and James wants to choose showcase scope.

Nothing is urgent here. The valuable move is to make this one workload falsify or strengthen the generic EFS design before it freezes.
