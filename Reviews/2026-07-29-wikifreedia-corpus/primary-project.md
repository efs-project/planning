# Wikifreedia primary-project report

**Observed:** 2026-07-29
**Application revision:** [`2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6`](https://github.com/pablof7z/wiki/tree/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6)
**Relay revision:** [`dd5f27756cd89ed5ccd52cda215e4101cac8db49`](https://github.com/pablof7z/wikifreedia-relay/tree/dd5f27756cd89ed5ccd52cda215e4101cac8db49)
**Protocol:** [NIP-54 at audited revision `6d2979b…`](https://github.com/nostr-protocol/nips/blob/6d2979b3f503a8539c983efbcdcf901bbcf9ed23/54.md), `draft` and `optional`
**Live evidence:** [`live-observations.md`](./live-observations.md)

No deployment attestation was found proving that `wikifreedia.xyz` runs exactly application commit `2d688…`. Admin controls, cache construction, rendering, and NIP-05 behavior in this report are pinned-source findings. Live UI, relay, and response observations are separate evidence, not proof of exact deployment parity.

## Bottom line

Wikifreedia is a working reference client for an unusually good plural-knowledge primitive:

- authors maintain parallel signed entries under one topic;
- nobody has protocol-level power to overwrite another author's version;
- clients choose what to display;
- exact versions remain independently attributable;
- forks, merge requests, redirects, reactions, and deference are portable events.

The current end-to-end service is much less neutral than the event model. The dedicated relay is privileged by search and cache paths; AI synthesis is an operator service; the application has no license; availability, governance, defaults, and succession are not independently demonstrated. These limitations do not negate NIP-54. They reveal the exact layers EFS must separate.

## Mission and product claim

The [home page](https://wikifreedia.xyz/) frames conventional encyclopedias as forcing many viewpoints into one negotiated “neutral” article. Wikifreedia instead promises:

- named perspectives rather than one disembodied institutional voice;
- author-controlled, signed versions;
- no protocol-canonical winner;
- a reader's social/trust context as the filter;
- an open Nostr data format;
- disagreement preserved as useful knowledge.

That is a coherent product thesis. The defensible form is:

> No one may alter or forge another author's signed version without detection, and independent copies may survive any one operator.

The stronger “no admin can delete it” form conflates integrity with availability. A relay can drop its copy, a search index can omit it, a client can suppress it, and the hosted product can disappear. Other retained copies remain verifiable.

The project's [Fund](https://wikifreedia.xyz/fund) adds “patronage for honest perspectives.” It explicitly describes the selection process as human editorial judgment and routes donations through Geyser/Bitcoin. That is preferable to pretending subsidy is neutral. It remains a control plane over which perspectives get commissioned.

## Live product observation

### Guest and author paths

- Topic browsing and direct entry links worked without authentication.
- Writing offered a Nostr extension or private-key path and a new-user welcome flow. NIP-07 keeps signing in an external signer; entering a raw `nsec` into hosted JavaScript requires trusting the delivered page and dependencies with that key. This review found no key theft; it records the larger trust impact of the raw-key option. [Pinned login source](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/Login.svelte#L59-L66).
- The topic experience exposed multiple independently attributed entries, author links, permalinks, comparison, reactions, and comments.

The guest-first decision is good. Nostr key management remains a barrier for writing, which the repository's long-running issues document directly:

- [newcomer key/onboarding flow](https://github.com/pablof7z/wiki/issues/21);
- [mobile key creation](https://github.com/pablof7z/wiki/issues/22);
- [email login request](https://github.com/pablof7z/wiki/issues/24);
- [guest-by-default request](https://github.com/pablof7z/wiki/issues/25).

### AI comparison

The live comparison presented:

- points of agreement;
- points of disagreement;
- a merged entry.

The output was labeled fresh or cached, and the UI exposed the selected perspectives. It did not expose the model, model build, system prompt, prompt version, parameters, operator identity, generation time, signature, a portable execution receipt, or an attestation that the selected inputs exhaust the perspectives known to any stated index or candidate set.

### Landing-demo provenance problem

The landing navigation labels the section “Demo” and visually demonstrates several viewpoints and an AI comparison. The underlying [`LandingDemo.svelte`](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/components/landing/LandingDemo.svelte#L18-L159) hard-codes first-person text under real public figures' names and a hard-coded comparison; it does not retrieve signed Nostr entries.

The review did not verify whether any individual sentence is a real quotation, so it does not call the text fabricated. The supported finding is narrower:

- the text is unsourced illustrative copy;
- the named people did not sign these displayed records through NIP-54;
- no per-statement provenance or authorship category is visible in the component;
- without provenance, it must not be treated as a verified quotation, endorsement, signed contribution, or live perspective.

This is an especially expensive ambiguity for a product whose main promise is visible signed provenance.

## NIP-54 wire model

### Article identity

An article is an addressable Nostr event:

```text
kind = 30818
address = (30818, author pubkey, normalized d tag)
content = Djot-recommended markup
```

NIP-54's `d` tag normalization requires:

- lowercases letters;
- converts whitespace to `-`;
- preserves non-ASCII letters and numbers.

It recommends, but does not require, removing punctuation/symbols, collapsing repeated hyphens, and trimming leading/trailing hyphens. Content should be Djot rather than being relay-enforced as Djot; the reference app also renders legacy AsciiDoc records.

The live relay does not enforce `d` normalization. The observed corpus includes required-lowercase violations such as `StarCraft` and `gnuEDITING`, plus identifiers such as `kind:1` and `.well-known/nostr.json` that retain punctuation or symbols. The specification's normalized identifier is therefore not the same thing as every identifier a relay will admit.

This creates a deliberately semantic address, not a globally unique subject identity. It also creates collision and disambiguation work:

- `C++` and `C#` can normalize to the same slug when the recommended punctuation-removal rule is followed;
- names can be contested;
- homonyms need several topics;
- topic renames need aliases/redirects;
- two topics may later be merged or one split.

### Update and history behavior

`kind:30818` is replaceable at an author's address. Publishing a newer event makes it the current entry at that coordinate. The exact event ID still identifies an immutable historical version if a relay retains it.

This means three identities must not be conflated:

1. topic identity;
2. author/topic live coordinate;
3. exact immutable event version.

NIP-54 recommends semantic wikilinks for ordinary navigation so the client's current policy selects the version. Exact-event links remain essential for:

- citations;
- reactions and reputation;
- fork bases;
- merge-request bases;
- audit;
- reproducible AI inputs;
- historical comparison.

### Collaboration relationships

- A fork should use both address (`a`) and exact-event (`e`) tags with a `fork` marker; this recommendation is not relay-enforced.
- A `kind:818` merge request names the destination author/address, optional base version, exact proposed source event, and optional explanation.
- The destination author's `+`/`-` reaction can socially signal acceptance/rejection. The protocol does not execute a merge or force the target to publish.
- `kind:30819` can redirect a slug to an article address and support disambiguation.
- `defer` is a strong author signal that another exact entry should be preferred over the author's own; NIP-54 again says both `a` and `e` tags should be used.

These are compact, useful primitives. A production knowledge system still needs diff presentation, merge semantics, stale-base handling, accepted/rejected history, and exact version retention.

### Reader-side selection

NIP-54 deliberately leaves ranking to clients. It suggests:

- direct reactions;
- two- or three-hop reaction-derived recommendations;
- relay lists;
- ordinary contact lists;
- wiki-specific trusted-author/curator lists.

That is an early lens model, but it does not standardize a portable policy, execution basis, candidate set, or result receipt.

## Application architecture and control points

### Relays and cache

The default relay list is:

- `wss://purplepag.es`;
- `wss://nos.lol`;
- `wss://relay.primal.net`;
- `wss://custom.fiatjaf.com`;
- `wss://relay.wikifreedia.xyz`.

Source: [`nostr-relays.ts`](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/config/nostr-relays.ts#L1-L7).

The application [warms browser cache state](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/stores/wiki-cache-warm-sync.ts#L18-L20) from the dedicated relay and uses it for the [server-rendered topic seed](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/%5Btopic%5D/%2Bpage.server.ts#L9-L25). Browser-side topic retrieval can fan out to the broader set, offering alternate retrieval when copies exist. This audit did not measure replication completeness, relay acceptance, or retention across the other four relays.

Explore full-text search explicitly sets the dedicated relay as exclusive: [`src/routes/explore/+page.svelte`](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/explore/%2Bpage.svelte#L28-L44).

The consequence is precise:

- publishing remains possible elsewhere;
- direct retrieval of copies held elsewhere remains possible;
- the reference client's discovery/fast path depends heavily on one operator.

### Relay implementation

The dedicated relay is a small Go/Khatru/SQLite service. It accepts kinds `30818`, `30819`, `818`, and `819`; its [pinned README](https://github.com/pablof7z/wikifreedia-relay/blob/dd5f27756cd89ed5ccd52cda215e4101cac8db49/README.md) claims full-text search and negentropy. The live NIP-11 response described search but did not advertise NIP-50, an internal metadata inconsistency preserved in [`live-observations.md`](./live-observations.md#relay-nip-11-observation). [`main.go`](https://github.com/pablof7z/wikifreedia-relay/blob/dd5f27756cd89ed5ccd52cda215e4101cac8db49/main.go#L14-L42) establishes accepted kinds and server construction, not full-text behavior by itself.

The implementation is MIT licensed, small, and supplies build/run instructions. That is meaningful exit surface. It does not by itself prove:

- an independent operator set;
- archival retention;
- censorship resistance;
- backed-up data;
- sustainable indexing economics;
- protocol-conformant alternatives in regular use.

### Web of Trust and recommendations

The shipped WoT store defaults filtering to:

- off;
- depth two;
- unknown authors included;

Ranking is subtler: signed-in users get a graph built after session startup, topic rendering calls the combined filter/rank function, and distance ranking does not check the filtering toggle. Signed-in entries can therefore be reordered even while filtering is disabled; `includeUnknown=true` affects filtering, while ranking separately puts unknowns last. Guests without a loaded graph keep the input order.

Sources: [graph construction](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/%2Blayout.svelte#L36-L58), [ranking behavior](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/stores/wot.ts#L49-L92), and [topic use](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/utils/topic-entries.ts#L8-L11).

The permissive guest default makes content discoverable before a user has a graph. It also means the marketing shorthand “your Web of Trust filters the noise” does not describe the ordinary unauthenticated-guest experience.

Recommended authors are based on list/recommender counts rather than a demonstrated Sybil-resistant reputation system. Raw vouch popularity can be useful discovery evidence, but cannot safely become:

- identity;
- truth;
- authorization;
- universal credibility;
- a default the user cannot replace.

### AI comparison service

The service:

1. fetches two or three exact event IDs;
2. concatenates their untrusted content into a comparison prompt;
3. sends it to an Ollama-compatible operator-selected model;
4. asks for agreement, disagreement, and merged-entry sections;
5. caches and returns text.

Relevant stable sources:

- [service and model/prompt override](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/server/event-comparisons/service.ts#L49-L63);
- [admin controls](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/admin/%2Bpage.server.ts#L56-L72);
- [default prompt](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/server/event-comparisons/prompt-config.ts#L1-L18);
- [cache identity](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/server/event-comparisons/cache.ts#L19-L20).

Risks:

- operator framing is not visible in the result;
- prompt injection from article text;
- output is unsigned and not portable;
- cache identity appears not to bind model/prompt version;
- “merged” prose may launder judgment into a neutral-sounding voice;
- another client cannot reconstruct or audit the actual deployed operation from the returned result alone because deployed model, overrides, and runtime details are absent.

This does not affect the integrity of source events. It affects how a reader interprets them.

## Relay corpus measurement

### Method

Endpoint: `wss://relay.wikifreedia.xyz`

At `2026-07-29T23:45:19Z`:

1. NIP-45 `COUNT` requests measured kinds `30818`, `818`, `819`, and `30819`.
2. Because the relay caps a response at 100 events, the interval `2023-01-01T00:00:00Z` through `2026-07-31T23:59:59Z` was recursively bisected until every non-overlapping window had `COUNT <= 100`.
3. Nine nonempty leaf windows were fetched through `REQ`.
4. Events were deduplicated by event ID.
5. `d`, `fork`, `defer`, pubkey, and timestamp fields were summarized.

The returned total and unique total both equaled the NIP-45 count: 411. The content-free [`relay-event-manifest.jsonl`](./relay-event-manifest.jsonl) preserves the metadata needed to recompute every aggregate below; collection and manifest checks are recorded in [`live-observations.md`](./live-observations.md#relay-event-corpus-observation).

### Results

```text
kind 30818 queryable events in this relay snapshot: 411
kind 818 merge-request events: 30
kind 819 events accepted by the relay but not defined in current NIP-54: 7
kind 30819 redirect events: 0

unique pubkeys: 136
distinct nonblank observed d identifiers: 298
exact-d groups with one pubkey: 247 (82.9%)
exact-d groups with multiple pubkeys: 51 (17.1%)
events with fork marker: 72
events with defer marker: 8

earliest entry: 2023-08-31T21:15:57Z
latest entry: 2026-07-26T18:13:48Z
top-author share: 6.57%
top-five share: 23.84%
top-ten share: 40.63%
```

### Limits

- The result is one relay's current queryable state.
- Replaceable-event history may already have been discarded.
- Pubkeys are not humans or users.
- One person may hold many keys; one key may be automated or shared.
- Exact `d` string groupings are not proven semantic topics; the relay admits nonconforming identifiers.
- Expected fields and ID/signature hex shapes were checked and IDs were deduplicated, but event IDs were not recomputed and signatures were not independently cryptographically verified.
- Fork and defer markers were counted without validating the referenced relationships.
- A merge-request count does not show acceptance or success.
- Multi-pubkey topics do not prove substantive disagreement.
- The snapshot says nothing about page views, retention, active authors, or traffic.

## Repository history

### Protocol before product

Fiatjaf opened [NIP proposal #787](https://github.com/nostr-protocol/nips/pull/787) in September 2023, citing Federated Wiki. The discussion is unusually valuable because it anticipated the main failures:

- a liked replaceable address can later contain worse or malicious content;
- exact event references help, but require archival retrieval;
- external encyclopedias could be imported under identifiable signing keys;
- topic links should let clients choose a version;
- collaboration needs PR-like events.

The [mutable-reputation issue](https://github.com/nostr-protocol/nips/pull/787#issuecomment-1723403032) and [archival-relay response](https://github.com/nostr-protocol/nips/pull/787#issuecomment-1723409850) should be treated as direct EFS test cases.

### Application timeline

Git history at audit time:

| Period | Commits | Visible arc |
|---|---:|---|
| 2024 | 23 | initial proof of concept, editor, reactions, public URLs |
| 2025 | 9 | concentrated SvelteKit/Svelte restructuring |
| 2026 | 47 | landing/explore, cache/negentropy, drafts, AI comparison, fund, admin controls |

The repository was created 2024-02-24. Primary announcements:

- [Introducing Wikifreedia](https://www.nobsbitcoin.com/introducing-wikifreedia/);
- [v0.0.7 — May 2024](https://www.nobsbitcoin.com/wikifreedia-v0-0-7/).

At audit time:

- 79 commits;
- 19 stars;
- seven forks;
- no GitHub tags;
- no GitHub releases;
- latest code commit 2026-06-11;
- 74 commits under `pablof7z`/`Pablo Fernandez` identities;
- three `Claude Code` commits;
- one commit each from two other identities.

This is an active, founder-led experimental application with founder-heavy repository history and no documented independent governance found—not an abandoned project and not a mature neutral institution.

### Open issues as history

The 2024 backlog records the problems that outlived the proof of concept:

- [import from Wikipedia](https://github.com/pablof7z/wiki/issues/5);
- [WoT/network size](https://github.com/pablof7z/wiki/issues/6);
- [search relevance](https://github.com/pablof7z/wiki/issues/8);
- [commentary/highlights from WoT](https://github.com/pablof7z/wiki/issues/17);
- [merge-request deltas](https://github.com/pablof7z/wiki/issues/19);
- [new-user/key onboarding](https://github.com/pablof7z/wiki/issues/21);
- [guest-by-default](https://github.com/pablof7z/wiki/issues/25).

Open age is not proof of abandonment; current source has implemented or reworked parts of several themes. The backlog is evidence that plurality does not remove ordinary collaboration, safety, and usability work.

## Openness and legal exit

### Application

The application source is publicly visible at [pablof7z/wiki](https://github.com/pablof7z/wiki). The audited tree contains no license, and GitHub's license field is null.

[GitHub's licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) distinguishes:

- public visibility and the GitHub Terms' right to view/fork on-platform;
- an open-source license granting general rights to use, modify, and distribute.

Therefore:

- source-visible: **yes**;
- OSI-open-source: **no demonstrated license**;
- legally safe independent redistribution/deployment: **not granted explicitly**.

This is not legal advice and should not be phrased as “forking is illegal.”

### Relay

[pablof7z/wikifreedia-relay](https://github.com/pablof7z/wikifreedia-relay) has a pinned [MIT license](https://github.com/pablof7z/wikifreedia-relay/blob/dd5f27756cd89ed5ccd52cda215e4101cac8db49/LICENSE) and a small understandable implementation.

### Protocol

The audited NIPs [README license section](https://github.com/nostr-protocol/nips/blob/6d2979b3f503a8539c983efbcdcf901bbcf9ed23/README.md#license) dedicates NIPs to the public domain. NIP-54 is open to independent implementation, but remains `draft` and `optional`. The repository process is still a human governance venue; publication there is not the only way Nostr conventions can emerge.

### Content

NIP-54 does not specify a content license. The app does not visibly require a license per entry. This weakens:

- lawful reuse;
- export/import;
- translations;
- merged publications;
- dataset and AI use;
- institutional preservation.

EFS should preserve source license and attribution metadata as data, not infer permission from public availability.

## Neutrality control-plane audit

### 1. Authorship/admission

**Good:** signed events, independent keys, no protocol-canonical editor, any author can publish a competing address.

**Limit:** relay acceptance policies vary; signature proves a key, not identity/truth; username or profile systems can mislead.

### 2. Availability/retention

**Good:** events may be copied across relays; no single server owns the only valid record.

**Limit:** no demonstrated archival quorum, retention contract, recovery drill, or durable old-version guarantee.

### 3. Discovery/indexing

**Good:** another client may index the protocol independently.

**Limit:** reference-client full-text search and cache privilege the project relay.

### 4. Ranking/moderation/defaults

**Good:** protocol explicitly expects client/user variation.

**Limit:** shipped defaults can exert practical influence; filtering is optional/permissive but signed-in ranking can still apply; list/reaction popularity is Sybil-sensitive; no portable ranking receipt.

### 5. Client/hosting/legal forkability

**Good:** protocol and relay can be independently implemented.

**Limit:** the main application is unlicensed and hosted through one deployment.

### 6. Derived/AI execution

**Good:** comparison can help readers find agreement/disagreement.

**Limit:** the deployed model/prompt is not disclosed in the result; operator overrides are supported; the cache result is unsigned; prompt-injection and provenance gaps remain.

### 7. Governance/succession

**Good:** NIP discussion is public; the fund calls judgment judgment.

**Limit:** founder-heavy app, no clear succession/operator diversity/default-change process, draft protocol.

### 8. Funding/economic curation

**Good:** voluntary patronage and transparent selection language.

**Limit:** funding changes the distribution of authored content and can create a practical editorial agenda.

## Safety and identity findings

### Dangerous link handling

The rendering path:

- converts Djot to HTML;
- inserts it with Svelte `{@html}`;
- explicitly tests that `javascript:` link schemes survive;
- showed no discovered client click interceptor;
- the inspected homepage response at `2026-07-29T23:20:32Z` supplied neither a CSP header nor an observed meta CSP.

Sources:

- [`DjotRenderer.svelte`](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/components/DjotRenderer.svelte#L139-L141);
- [`markup.test.ts`](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/utils/markup.test.ts#L55-L59).

Assessment: a strong code-level click-triggered script-execution/XSS risk for permissionless content. No production exploit was attempted. Do not generalize this into “all raw HTML executes” without a separate test. The dated response evidence is preserved in [`live-observations.md`](./live-observations.md#homepage-http-observation).

EFS implication: dangerous markup, URL schemes, actions, and ambient authority should fail closed under hostile fixtures. Sanitization, allowlists, mediation, isolation, and typed surfaces remain candidate mechanisms for the unfinished Client app model.

### NIP-05 registration

The published [`/api/nip05` registration endpoint](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/api/nip05/%2Bserver.ts#L6-L41) appears to accept an available username and pubkey without signature-based proof of control.

Assessment: an unauthenticated registration/binding weakness **if that source path and configuration are deployed**. It could enable squatting or incorrect bindings. This review did not confirm a live takeover path.

EFS implication: identity-name bindings are separate attestations and must prove authority over the bound principal.

### AI prompt injection

Untrusted entries are incorporated into the model prompt. An author may write instructions aimed at the comparison model. A robust comparison runner needs:

- strict role separation;
- structured inputs;
- instruction/data delimiting;
- output validation;
- safety limits;
- disclosed failures;
- exact input provenance;
- model/policy identity.

Prompt defenses reduce risk; they do not make an LLM comparison neutral or deterministic.

## Lessons for EFS

### Adopt

- parallel author-owned records under one semantic topic;
- exact-version citations and reputation;
- explicit fork/merge/defer/redirect relationships;
- guest-first reading;
- reader-replaceable ranking;
- disagreement-aware comparison;
- transparent curation/funding labels.

### Improve

- immutable revision retrieval and portable export;
- shared record schemas, validators, and type discovery;
- stable topic identity beyond lossy slugs;
- explicit identity/quotation/AI attribution taxonomy;
- license/language/evidence metadata;
- independent index/availability conformance;
- signed or attributable derived artifacts;
- safe renderer/app boundary;
- scoped moderation, privacy, appeals, and omission disclosure;
- governance and default-change transparency.

### Do not copy

- “signed means undeletable/true/real-person” shorthand;
- reputation attached only to mutable coordinates;
- one privileged search service presented as a neutral view;
- opaque AI synthesis;
- dangerous URL schemes in untrusted content;
- unsourced demo text under real people's names;
- public trust graphs as an automatic authority system;
- plurality mistaken for equal weight or knowledge quality.

## Primary source index

### Project and protocol

- [Live Wikifreedia](https://wikifreedia.xyz/)
- [Fund](https://wikifreedia.xyz/fund)
- [Application repository](https://github.com/pablof7z/wiki)
- [Relay repository](https://github.com/pablof7z/wikifreedia-relay)
- [NIP-54 at audited revision](https://github.com/nostr-protocol/nips/blob/6d2979b3f503a8539c983efbcdcf901bbcf9ed23/54.md)
- [NIPs public-domain license](https://github.com/nostr-protocol/nips/blob/6d2979b3f503a8539c983efbcdcf901bbcf9ed23/README.md#license)
- [NIP-54 proposal/history](https://github.com/nostr-protocol/nips/pull/787)
- [Initial announcement](https://www.nobsbitcoin.com/introducing-wikifreedia/)
- [v0.0.7 announcement](https://www.nobsbitcoin.com/wikifreedia-v0-0-7/)

### Stable application evidence

- [landing demo](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/components/landing/LandingDemo.svelte#L18-L159)
- [default relays](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/config/nostr-relays.ts#L1-L7)
- [exclusive search relay](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/explore/%2Bpage.svelte#L28-L44)
- [WoT graph construction](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/%2Blayout.svelte#L36-L58)
- [WoT filtering/ranking](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/stores/wot.ts#L49-L92)
- [WoT topic use](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/utils/topic-entries.ts#L8-L11)
- [AI service](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/server/event-comparisons/service.ts#L49-L63)
- [AI admin controls](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/admin/%2Bpage.server.ts#L56-L72)
- [AI prompt](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/server/event-comparisons/prompt-config.ts#L1-L18)
- [AI cache identity](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/server/event-comparisons/cache.ts#L19-L20)
- [raw HTML insertion](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/components/DjotRenderer.svelte#L139-L141)
- [dangerous-scheme test](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/lib/utils/markup.test.ts#L55-L59)
- [NIP-05 registration](https://github.com/pablof7z/wiki/blob/2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6/src/routes/api/nip05/%2Bserver.ts#L6-L41)
