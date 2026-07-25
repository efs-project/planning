---
agent: codex-gpt-5
date: 2026-07-24
status: reference
anchors:
  - area: efsv2
  - area: client
  - area: sdk
  - area: apps
  - area: privacy
  - area: governance
  - brainstorm: 2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries
  - review: 2026-07-24-chicago-voting-vocdoni
source: User-requested use case derived from the 2026-07-24 Vocdoni, EVM ZK voting, Chicago, and EFS review
---

# Folder-scoped polls and elections

**Disposition:** application-level use-case reference; not an EFS protocol proposal or permission to use EFS for statutory elections

This extends [[2026-05-26-bs-divergent-usecases-v1-efs-use-cases-across-industries]] with a governance use case: an EFS folder whose authorized moderators can create recurring polls or bounded elections for the folder's community.

The simplest example is a daily:

> Hotdog or hamburger?

Members cast signed votes, a deterministic verifier computes the result, and nobody—including the moderators—can edit accepted votes. More consequential configurations can add anonymous membership proofs or use an external encrypted voting protocol such as DAVINCI, but EFS remains the package, authority-evidence, and audit layer rather than the secret-ballot engine.

This use case builds on the research in [[Reviews/2026-07-24-chicago-voting-vocdoni/README|Vocdoni, Ethereum, EFS, and Chicago voting]].

## Direct product concept

A community creates a user-facing election folder:

```text
/communities/example/elections/
  policy/
  series/
    daily-lunch-poll/
  polls/
    2026-07-24-hotdog-or-hamburger/
      manifest
      votes/
      result
      verifier-report
```

The visible folder is organization and discovery, not authority by itself. Current EFS v2 doctrine in [[human-overview]] says a view is not a capability. Moderator and voter authority must come from explicit signed policy, organization/grant state, or an election-specific credential—not from being able to place something under a path.

The election application recognizes four conceptual artifacts:

1. **Folder policy:** who can create polls, the creation threshold, allowed modes, default voter population, amendment rules, and retention rules.
2. **Poll manifest:** one immutable question, option set, time window, eligibility snapshot, tally rule, verifier version, and client/package commitment.
3. **Vote record:** a public signed selection, an anonymous signal/proof, or a reference to an externally settled encrypted ballot.
4. **Result bundle:** the deterministic tally, input-set commitment, verifier output, and any external settlement proof.

These are application conventions over generic EFS records and packages. They do not imply new kernel kinds.

## Primary mode: public signed folder poll

The default daily poll should be deliberately simple:

- every eligible member signs one vote record;
- the record references an immutable poll identifier;
- the selection is public;
- the authoritative ordering basis determines whether a vote arrived before close;
- a configured rule decides whether the first vote, last vote, or no revote wins;
- any client can enumerate valid records and reproduce the tally;
- the result record is a cache/convenience, not the source of truth;
- late, unauthorized, malformed, and duplicate votes remain inspectable but do not count.

This mode does not need ZK or encrypted ballots. Its benefits are transparent authorship, immutable history, deterministic tallying, portable verification, and no central poll database.

Its privacy limitation must be prominent: a signed public choice is a transferable receipt. It is suitable for preferences, community prioritization, transparent governance, and other low-coercion decisions—not a secret election.

## Folder moderator model

“Election folder moderator” is an application role, not a new EFS identity class.

The folder policy can authorize:

- one moderator;
- a threshold such as 2-of-3 moderators;
- an organization role resolved at a pinned authority position;
- a rotating moderator set whose changes apply only to future polls.

Moderators may:

- create a poll from an allowed template;
- set the question and options;
- choose an eligibility snapshot permitted by policy;
- set the opening and closing basis;
- select an allowed public, anonymous, or secret mode;
- publish reviewed explanatory material and translations;
- cancel through an explicit, predeclared procedure.

Moderators may not:

- edit the question or choices after opening;
- silently replace the client, circuit, verifier, or tally rule;
- change the eligibility snapshot after voting begins;
- edit or delete accepted votes;
- extend a deadline invisibly;
- declare a result that an independent verifier cannot reproduce;
- make an amendment apply retroactively to an already-open poll.

Any material change creates either:

- a new immutable poll identifier; or
- a signed amendment explicitly allowed by the original manifest, with clients rendering both the original and amendment.

For consequential polls, creating a new poll is safer than supporting amendment complexity.

## Conceptual folder policy

This pseudoconfiguration is illustrative and nonnormative:

```yaml
policyVersion: 1
folder: /communities/example/elections

pollCreation:
  moderators:
    authority: efs:example-community
    role: poll-moderator
    threshold: 2
  allowedModes:
    - public-signed
    - anonymous-signal
  maxOptions: 8
  amendmentsAfterOpen: forbidden

eligibilityDefaults:
  basis: folder-member-snapshot
  snapshotTiming: poll-creation
  votingWeight: one-per-credential

tallyDefaults:
  rule: plurality
  revote: last-valid
  tieBreak: no-winner
  resultFinality: settlement-domain-finalized

recurrence:
  enabled: true
  cadence: daily
  timezone: America/Chicago
  opensAtLocal: "08:00"
  closesAtLocal: "20:00"

retention:
  manifest: permanent
  publicVotes: permanent
  resultAndProofs: permanent
  networkLogs: prohibited
```

The actual format must eventually use canonical EFS identifiers, byte encoding, time/finality semantics, and authority references. This example is a requirements sketch, not a format reservation.

## Immutable poll manifest

Every poll pins:

- policy identifier and version;
- poll-series identifier, if recurring;
- exact question and option identifiers;
- human-readable labels and reviewed translations;
- open and close basis;
- eligibility root/snapshot and its authority basis;
- weight and revote rules;
- tally algorithm and version;
- tie, quorum, cancellation, and failure behavior;
- privacy mode;
- exact voting client and independent-verifier package commitments;
- settlement/network identifiers when external infrastructure is used;
- data-retention and public-metadata disclosures;
- moderator authorization evidence.

The poll identifier should be deterministically bound to the immutable manifest. Exact hash construction belongs to a later application convention and must not be invented casually in this use-case note.

## Daily polls without a trusted cron operator

A recurring series can define a deterministic schedule and template. For a fixed question such as “hotdog or hamburger,” the poll for a given calendar date can be derived from:

- series identifier;
- policy version;
- local-date/timezone rule;
- question/option template;
- eligibility snapshot rule;
- verifier/client versions.

Any participant or automation service may materialize the scheduled poll. Duplicate publication is idempotent because every honest publisher derives the same manifest and identifier.

This removes authority from the cron service, but not its liveness role: someone still has to submit the poll or the system needs a chain-level automation service. The honest guarantee is:

> No scheduler can create a different valid daily poll under the pinned series policy, but the network still depends on someone to publish it.

Changing the recurring question, options, cadence, or voter population creates a new series-policy version that applies prospectively.

## Three privacy modes

| Mode | Vote representation | What EFS does | Main limitation |
|---|---|---|---|
| `public-signed` | Signed voter identity/credential plus public choice | Stores and orders votes; deterministic tally | Public, linkable, and receiptable |
| `anonymous-signal` | Group-membership proof, poll nullifier, and public choice | Stores proof/signal and packages a verifier | Eligibility issuer/group administrator remains trusted; choice is public; not a secret ballot |
| `secret-external` | Encrypted ballot settled through DAVINCI, MACI, Belenios, or another protocol | Pins client/config/verifier and archives minimized result/proof evidence | External sequencers, wardens/coordinator, settlement, DA, setup, and device trust remain |

Semaphore is a plausible anonymous-signal component. It proves membership and one signal per scope; it does not supply encrypted ballots, a tally lifecycle, cast-as-intended verification, or coercion resistance.

DAVINCI is a possible secret-external backend when its production gaps are resolved. Under [[privacy-pass-synthesis]], EFS should not copy individual ballot ciphertexts permanently by default. It should retain the immutable election package, public configuration, aggregate result, proofs, settlement evidence, audit reports, and only the minimum data justified by the protocol's retention policy.

## Eligibility

Eligibility is the hardest part of any meaningful poll.

Possible folder-level bases:

- public list of EFS principals;
- organization members at a pinned authority position;
- holders of an election-specific credential;
- a Merkle commitment to an off-EFS membership list;
- open participation with one vote per signing principal;
- token/account snapshot for explicitly cryptoeconomic governance.

The manifest must say whether membership is evaluated:

- when the poll is created;
- when voting opens;
- at each vote;
- or at a pinned snapshot.

The recommended default is a pinned snapshot. Dynamic membership makes recounting ambiguous and lets an administrator add or remove voters during the poll.

“One EFS principal” is not “one human.” Sybil resistance, residency, citizenship, employment, club membership, or other real-world eligibility always requires an issuer, institution, resource cost, or social process. The UI must name that trust rather than calling the poll universally decentralized.

## Tally and finality

For a public signed poll, an independent verifier:

1. resolves the immutable poll manifest;
2. checks moderator authorization against the pinned policy basis;
3. enumerates candidate vote records referencing the poll;
4. validates signatures or election-specific credentials;
5. applies the eligibility snapshot;
6. rejects late, malformed, or disallowed records;
7. applies the declared revote and weight rules;
8. calculates the result and input-set commitment;
9. compares its output with any published result record.

The close rule must identify an authoritative ordering/finality domain. Wall-clock timestamps supplied by clients are insufficient. A chain timestamp, finalized block/position, or another explicitly pinned basis is needed.

A result is provisional until the selected basis reaches the manifest's declared finality rule. Reorganizations and endpoint disagreement must produce an “awaiting finality” or “disputed” state, not two silently different winners.

## EFS fit

### What fits naturally

- content-addressed poll definitions and option media;
- signed moderator policy and amendments;
- immutable vote history for transparent polls;
- portable voter and moderator authorization evidence;
- deterministic, independently packaged tally/verifier applications;
- recurring series definitions;
- multilingual explanatory content;
- public result, proof, audit, and incident bundles;
- multiple mirrors without one content server becoming authoritative;
- explicit provenance for every policy and software version.

### What strains

- daily per-voter records can become expensive permanent state;
- current EFS v2 authority, group, time, and read surfaces are still designs rather than production infrastructure;
- one-member-one-vote needs a precise membership snapshot convention;
- last-valid-vote requires unambiguous authoritative ordering;
- anonymous modes require external circuits/verifiers and careful metadata handling;
- secret ballots conflict with a permanent public archive when individual ciphertexts are retained;
- an EFS host/client compromise can still alter the displayed or submitted choice;
- a folder/lens must not be mistaken for an authorization boundary.

### What must stay outside the kernel

- poll-specific record kinds;
- a canonical voting circuit;
- civil or organizational voter identity;
- moderator role semantics;
- election scheduling;
- tally algorithms;
- threshold-decryption committees;
- DAVINCI/MACI/Semaphore state;
- coercion, dispute, or appeals policy.

The use case should exercise generic signed records, immutable data, organization/grant authority, packages, capability-scoped endpoints, and replaceable verifier applications. This follows the replaceable-verifier boundary in [[privacy-pass-synthesis]] and the generic package boundary in [[playable-archive-requirements]]. If it requires an election-specific EFS kernel feature, the application boundary has failed.

## Scale and economics

A daily poll with `N` participating members produces approximately `365N` vote records per year:

| Daily voters | Annual vote records |
|---:|---:|
| 25 | 9,125 |
| 100 | 36,500 |
| 1,000 | 365,000 |
| 10,000 | 3,650,000 |

Even a whimsical poll becomes permanent infrastructure at community scale. A practical application needs:

- an inexpensive EVM L2 or EFS settlement venue;
- batching or compact envelopes where compatible with independent verification;
- relayer/sponsorship policy so voting does not require users to hold gas;
- rate limits outside the kernel and clear paid-spam behavior;
- a retention decision distinguishing permanent votes from permanent results.

For `public-signed` mode, permanent individual votes are an explicit product choice. If the community only needs a durable result, it may prefer an external ephemeral intake system with an aggregate proof/commitment on EFS—but that is a different, less independently replayable trust model.

## Client and accessibility requirements

The voting client should:

- render the exact manifest-bound question and choices;
- show the voter population and privacy mode before voting;
- clearly state whether the choice will be public and permanent;
- show the opening, closing, finality, revote, tie, and cancellation rules;
- avoid generic wallet transaction prompts when a narrow poll-signing ceremony is possible;
- provide a local receipt containing the poll ID and accepted-record reference without falsely implying secrecy;
- package a verifier separately from the casting client;
- use no telemetry, third-party fonts, trackers, or wildcard network access;
- support keyboard-only use, screen readers, mobile layouts, and reviewed translations;
- distinguish “submitted,” “accepted,” “finalized,” “counted,” and “result final.”

These requirements align with [[kernel-capability-model]], [[packages-and-updates]], [[network-privacy]], and [[locale-and-accessibility]].

## Threat and failure cases

| Threat/failure | Required response |
|---|---|
| Moderator publishes different options through different clients | Manifest hash and independently pinned package make equivocation visible |
| Moderator changes eligibility mid-poll | Pinned snapshot; new poll required |
| Moderator edits deadline | Forbidden or explicit signed amendment rendered by every client |
| Duplicate/replayed vote | Poll-bound signature or nullifier plus declared revote rule |
| Stolen member key | Recovery/revocation and dispute semantics remain external; public result may need cancellation/re-run |
| Sybil accounts | State honestly that one principal is not one human; use appropriate issuance if needed |
| Relayer censors a vote | Multiple submission routes; direct fallback; visible non-inclusion |
| Chain reorganization | Wait for declared finality; expose provisional/disputed state |
| Malicious casting client | Separate verifier helps inclusion/tally but not necessarily cast-as-intended |
| Vote buying/coercion | Public mode offers no protection; use only in low-coercion contexts |
| Permanent participation graph | Disclose it; use anonymous/external mode when participation itself is sensitive |
| Moderator quorum becomes unavailable | Policy defines timeout, replacement, or no-poll outcome |
| Poll receives no valid votes or ties | Manifest-defined no-winner/tie behavior |
| Scheduled publisher fails | Any party may materialize the deterministic poll; no false claim of guaranteed liveness |

## Acceptance walkthrough: hotdog or hamburger

1. Three community stewards establish a 2-of-3 poll-moderator policy.
2. They approve a daily series using `public-signed`, one vote per member snapshot, last-valid revote, and no-winner on a tie.
3. The series pins “Hotdog” and “Hamburger” as stable option identifiers and provides translated labels.
4. Anyone materializes the July 24 poll from the deterministic series template.
5. A member opens the EFS poll app, sees that the vote is public/permanent, and signs “Hotdog.”
6. The client submits through a sponsored relayer; the member can retry through another route using the same signed record.
7. The member later signs “Hamburger.” The verifier counts it because the manifest declares last-valid revote and its accepted position is later.
8. At close, two independently built verifier packages enumerate the same eligible vote set and produce the same tally and input commitment.
9. A convenience result record is published. Clients independently verify it rather than trusting the publisher.
10. The poll, public votes, result, and verifier reports remain readable under the folder's election history.

The walkthrough requires no central poll database and no trusted tally operator. It still trusts the policy authority, membership snapshot, signing devices, EFS authority/finality basis, and verifier implementation.

## Appropriate uses

- daily community preference polls;
- folder roadmap prioritization;
- club, cooperative, or association decisions;
- moderation-policy signaling;
- transparent DAO votes where one principal or one token position is acceptable;
- nonbinding civic consultations with appropriate conventional access channels;
- research comparisons among public, anonymous-signal, and secret-external modes.

## Inappropriate uses

- binding public elections under present Illinois/Chicago law and security posture;
- any claim of one-person-one-vote without an accountable identity/eligibility process;
- secret ballots implemented as public signed choices;
- high-coercion employment, union, housing, immigration, or household decisions without a proper threat model;
- polls containing voter PII, disability/accommodation data, credential secrets, IP logs, or device fingerprints;
- token-gated civil participation;
- claims that EFS removes the need for humans, institutions, software trust, or dispute resolution.

## Requirements surfaced

This use case is a useful EFS v2 stress test for:

1. explicit separation of folder/view placement from authority;
2. organization roles and threshold authorization;
3. authority snapshots that later verifiers can reproduce;
4. deterministic identifiers for immutable application manifests;
5. exact authoritative ordering and finality semantics;
6. enumerating all records referencing one poll without trusting an indexer;
7. reusable app-level first-valid/last-valid/nullifier tally conventions;
8. frozen application and independent-verifier packages;
9. narrow poll-signing capabilities instead of generic wallet access;
10. relayed gasless writes without relayer authority;
11. honest privacy labels for public, anonymous, and secret modes;
12. permanent-record economics at daily social-app volume.

These are requirements inputs. They do not reserve bytes, kernel kinds, ABI, folder ACLs, or a canonical voting subsystem.

## Open questions

- Which current EFS v2 organization/grant surface should represent a threshold poll-moderator role?
- How should a poll pin “members as of position X” so a later verifier needs no mutable indexer?
- Is vote enumeration acceptably bounded with current query/index plans at 10,000 daily voters?
- Should a daily poll keep every public vote forever, or use a separate short-retention intake plus permanent aggregate evidence?
- What narrow clear-signing ceremony can show poll, choice, privacy, permanence, and revote semantics without a generic wallet prompt?
- Which tie and cancellation policies are simple enough for a first reference application?
- Can two independent client packages reproduce the same eligible input set through only public EFS reads?
- Where should an anonymous-signal verifier live so ZK remains a replaceable sibling/application component?

## Recommended first implementation

Build only `public-signed` mode:

- one manually configured folder;
- a 2-of-3 moderator policy;
- one fixed recurring “hotdog or hamburger” series;
- a pinned membership snapshot;
- last-valid revoting;
- deterministic tally;
- sponsored writes on a cheap test venue;
- separate casting and verifier packages;
- no real-world identity, PII, ZK, encrypted ballots, or binding consequence.

Use it to validate authority snapshots, record enumeration, finality, recurring deterministic manifests, independent tally reproduction, package pinning, accessibility, and permanent-record economics.

Only after that works should the application compare:

1. Semaphore-style anonymous public signaling; and
2. a DAVINCI or MACI secret-external backend.

The success criterion is not “voting with no trust.” It is:

> Every remaining authority and failure mode is explicit, narrowly scoped, distributed where useful, and independently verifiable after the fact.
