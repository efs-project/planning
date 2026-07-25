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

Members cast signed votes, a deterministic verifier computes the result, and nobody—including the moderators—can rewrite admitted record bytes. Later supersession, revocation, cancellation, or rerun remains visible under the declared policy. More consequential configurations can add anonymous membership proofs or use an external encrypted voting protocol such as DAVINCI, but EFS remains the package, authority-evidence, and audit layer rather than the secret-ballot engine.

This use case builds on the research in [[Reviews/2026-07-24-chicago-voting-vocdoni/README|Vocdoni, Ethereum, EFS, and Chicago voting]].

Follow-up research in [[Reviews/2026-07-24-chicago-voting-vocdoni/folder-poll-question-resolution|Folder polling: research answers and implementation gates]] resolves the first application defaults and separates two products:

- `social-poll`: daily, harmless, advisory, optionally public, and never executable;
- `governance-vote`: infrequent, reviewed, normally secret, challengeable, and executable only when an exact machine action was disclosed before voting.

This document keeps the daily social poll as the first implementation. It does not promote the same rules into consequential governance.

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

- each participating eligible member may sign one or more revision records, which the verifier collapses to one final counted choice;
- the record references an immutable poll identifier;
- the selection is public;
- the authoritative ordering basis determines whether a vote arrived before close;
- a configured rule decides whether the first vote, last vote, or no revote wins;
- conforming independent clients can enumerate the complete valid record set and reproduce the tally once the EFS enumeration gate is met;
- the result record is a cache/convenience, not the source of truth;
- admitted but late, unauthorized, disallowed, or duplicate records remain inspectable but do not count; a malformed submission rejected before admission is not guaranteed to appear on-chain.

This mode does not need ZK or encrypted ballots. Its benefits are transparent authorship, immutable history, deterministic tallying, portable verification, and no central poll database.

Its privacy limitation must be prominent: a signed public choice is a transferable receipt. In the MVP it is suitable only for harmless, advisory, low-coercion preferences after informed acknowledgement, with silent nonparticipation free of penalty—not for consequential governance or a secret election. An explicit blank/abstain record is itself public; a private participation path would be a different backend and trust model.

The authorization split is explicit: the poll actor compiles/writes series, final manifests, and lifecycle/result records under a narrow grant. Each voter authors ordinary vote records under their own stable principal or election credential, and the verifier checks snapshot eligibility. Folder placement is neither moderator nor voter write authority.

## Folder moderator model

“Election folder moderator” is an application role, not a new EFS identity class.

The folder policy can authorize:

- one moderator;
- a control threshold such as 2-of-3 moderators, with recovery defined separately;
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
- rewrite admitted record bytes or the frozen tally; later lifecycle status must use a separately authorized record;
- extend a deadline invisibly;
- declare a result that an independent verifier cannot reproduce;
- make an amendment apply retroactively to an already-open poll.

Any material change creates either:

- a new immutable poll identifier; or
- a signed amendment explicitly allowed by the original manifest, with clients rendering both the original and amendment.

For consequential polls, creating a new poll is safer than supporting amendment complexity.

The policy should represent these as separate capabilities even if a small community assigns several to the same 2-of-3 steward group:

1. proposer;
2. agenda/scope reviewer;
3. mechanical poll compiler/scheduler;
4. eligibility-snapshot authority;
5. canceller;
6. appeal reviewer;
7. executor, when one is allowed;
8. public verifier.

At minimum, a proposer or sponsor cannot be the sole scope reviewer or decide its own appeal. Appeal review excludes directly involved actors where feasible; a small group can use a rotating or external reviewer.

Agenda control is substantive political authority. A member proposal queue, its published admissibility and rate/sponsorship rules, every rejection reason, and an appeal route should therefore be visible rather than hidden inside generic “moderation.” A deterministic selector does not neutralize the scope reviewer's power.

## Conceptual folder policy

This pseudoconfiguration is illustrative and nonnormative:

```yaml
policyVersion: 1
folder: /communities/example/elections

organizationAuthority:
  principal: efs:example-community
  control: 2-of-3
  recoveryPolicyRef: required-separate-policy

pollCreation:
  effect: advisory
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
  snapshotCutoffBeforeOpen: 12h
  snapshotBasis: first-finalized-authority-block-at-or-after-cutoff
  finalManifestRequiredBeforeOpen: true
  votingWeight: one-per-credential

tallyDefaults:
  rule: plurality
  revote: last-valid
  tieBreak: no-winner
  zeroVotes: no-decision
  turnoutQuorum: none
  resultFinality: settlement-domain-finalized

recurrence:
  enabled: true
  cadence: daily
  timezone: America/Chicago
  opensAtLocal: "08:00"
  closesAtLocal: "20:00"

retention:
  manifest: permanent
  publicVotes: permanent-explicit-acknowledgement
  silentNonparticipationPenalty: none
  explicitAbstainIsPublic: true
  resultAndProofs: permanent
  applicationTelemetry: prohibited
  projectOperatedLogRetention: minimized
  thirdPartyNetworkMetadata: disclosed

followThrough:
  responseOwner: example-community-stewards
  responseDeadline: 3d
  signedDisposition: required

execution:
  allowed: false
```

The actual format must eventually use canonical EFS identifiers, byte encoding, time/finality semantics, and authority references. This example is a requirements sketch, not a format reservation.

## Immutable poll manifest

Every poll pins:

- policy identifier and version;
- poll-series identifier and occurrence-intent digest, if recurring;
- exact question and option identifiers;
- human-readable labels and reviewed translations;
- open/close instants plus the authority-basis derivation and finality rule;
- eligibility root/snapshot and its authority basis;
- weight and revote rules;
- tally algorithm and version;
- tie, turnout/qualified-majority, cancellation, and failure behavior;
- privacy mode;
- exact voting client and independent-verifier package commitments;
- settlement/network identifiers when external infrastructure is used;
- data-retention and public-metadata disclosures;
- moderator authorization evidence;
- eligible, participating, valid, blank/abstaining, invalid, and per-option reporting rules, including predeclared small-cell suppression for privacy-sensitive profiles;
- the response owner and deadline for an advisory or `binding-manual` result.

The application-level `pollDigest` is the hash of the entire canonical **unsigned** final-manifest body; moderator approval envelopes/signatures are separate artifacts over that digest. It is not necessarily the generic EFS object identifier. Exact encoding and domain separation belong to a later application convention and must not be invented casually in this use-case note.

## Daily polls without scheduler discretion

A recurring series can define a deterministic schedule and template. For a fixed question such as “hotdog or hamburger,” it first derives an **occurrence intent** from:

- series identifier;
- policy version;
- occurrence index, pre-open snapshot cutoff, and exact UTC voting window;
- local-timezone and timezone-data version used to derive that window;
- question/option template;
- eligibility snapshot rule;
- verifier/client versions.

The intent cannot yet be the final poll digest: the actual eligibility root, member count, finalized basis block/hash/state root, and finality profile are known only after the snapshot cutoff. Before opening, a compiler applies the approved snapshot rule and produces a final manifest binding those facts to the intent. At least 2 distinct valid approvers among the 3 configured moderators sign the resulting final `pollDigest`; duplicate approvals do not count. If the basis is not final, the root cannot be reproduced, approval is late, or the final manifest is unavailable before opening, the occurrence is `NO_POLL`.

This means no cron operator chooses the question, options, rule, or voter-set rule, but compilation, approval, relay, and materialization remain liveness dependencies. A future deterministic derivation-verifier might replace per-occurrence human approval only after EFS freezes and tests that mechanism.

Current EFS also does not authorize a generic object merely because its bytes derive from a series. Votes therefore use one of two tested encodings:

1. embed the final `pollDigest` plus a bounded, discoverable poll/series key in vote value bytes while keeping the signed final manifest separately retrievable; or
2. point to a materialized immutable/hash-committed final-manifest object.

Any participant or automation service may relay the **same signed final-manifest envelope**. Current owner/salt-derived EFS identifiers do not let arbitrary publishers independently mint an identical object merely by deriving the same content. Both encodings need separate golden vectors but must resolve the same occurrence intent, final `pollDigest`, snapshot, and tally semantics.

The honest guarantee is:

> No scheduler can create a substantively different valid daily poll under the pinned series policy. The snapshot compiler and approvers cannot substitute a different roster without failing deterministic verification. They, relayers, available clients, and the authority domain still provide liveness.

Changing the recurring question, options, cadence, or voter population creates a new series-policy version that applies prospectively.

## Three privacy modes

| Mode | Vote representation | What EFS does | Main limitation |
|---|---|---|---|
| `public-signed` | Signed voter identity/credential plus public choice | Admits, stores, and enumerates vote records and supplies the authority/finality basis; the app applies declared revision order and tally | Public, linkable, and receiptable |
| `anonymous-signal` | Group-membership proof, poll nullifier, and public choice | Stores proof/signal and packages a verifier | Eligibility issuer/group administrator remains trusted; choice is public; not a secret ballot |
| `secret-external` | Encrypted ballot settled through DAVINCI, MACI, Belenios, or another protocol | Pins client/config/verifier and archives minimized result/proof evidence | External sequencers, wardens/coordinator, settlement, DA, setup, and device trust remain |

Semaphore is a plausible anonymous-signal component. It proves membership and one signal per scope; it does not supply encrypted ballots, a tally lifecycle, cast-as-intended verification, or coercion resistance.

DAVINCI is a possible secret-external backend when its production gaps are resolved. Its standalone EVM NI-DKG implementation is meaningful progress, but at the pinned snapshot the canonical voting node does not import or call it; the published process/finalizer path instead stores and uses the complete private key corresponding to each process encryption public key. Its contracts identify themselves as non-production work in progress, with independent audit, production setup, long-term DA/replay, forced inclusion, cast-as-intended verification, and accessibility still gating consequential use. The current scorecard is in [[Reviews/2026-07-24-chicago-voting-vocdoni/folder-poll-question-resolution#DAVINCI point-in-time update|the follow-up research]].

Until a genuine secret backend and its operational process pass those gates, personnel, sanctions, money, membership, permissions, conflicts, and coercion-sensitive questions are unsupported. The application must fail closed rather than downgrade them to `public-signed`.

Under [[privacy-pass-synthesis]], EFS should not copy individual ballot ciphertexts permanently by default. It should retain the immutable election package, public configuration, minimized batch/replay evidence, aggregate result, proofs, settlement evidence, audit reports, and only the data justified by a protocol-specific retention policy.

A profile that omits expired ciphertext-bearing batch payloads must not claim full walk-away replay after blob expiry. A synthetic replay experiment may retain them only under an explicit reviewed test profile.

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

The recommended default is a pinned snapshot. Dynamic membership makes recounting ambiguous and lets an administrator add or remove voters during the poll. A synthetic fixture can publish its roster; a real product should prefer a roster commitment or credential proof unless community membership is deliberately public, because eligibility evidence can itself reveal sensitive association.

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

The close rule must identify an authoritative ordering/finality domain. Wall-clock timestamps supplied by clients are insufficient. For a recurring UTC series, exact future block numbers are unknowable: use the named authority chain's consensus block timestamp to test the exact inclusive-open/exclusive-close UTC interval, pin a chain-appropriate timestamp-tolerance/failure rule, and freeze the first block at or after close once it reaches the declared finality profile.

A result is provisional until the selected basis reaches the manifest's declared finality rule. Reorganizations and endpoint disagreement must produce an “awaiting finality” or “disputed” state, not two silently different winners.

Last-valid revoting is an application-level collapse across all valid records for one `(voter,poll)`. The candidate rule selects the greatest declared `(authorOrder, recordDigest)` admitted before close; author order is a voter-declared revision sequence, not trusted wall time. The eventual vote encoding must expose a common voter/poll slot rather than allowing one independent live slot per option.

## EFS fit

### What fits naturally

- immutable/hash-committed poll definitions and closure manifests that pin exact content hashes/CIDs for option media and package assets;
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

One draft full-spine kernel candidate estimates 22–27k marginal gas per record for its enumeration-spine component. If adopted unchanged, simple multiplication implies approximately 0.803–0.986 billion spine gas at 100 daily voters, 8.03–9.86 billion at 1,000, and 80.3–98.6 billion at 10,000. This is a conditional scenario, not a universal EFS lower bound or a total write cost: body storage, discovery indexes, authority receipts, calldata/transactions, sponsorship, and results remain unmeasured. The vote/envelope/receipt wire formats do not exist, so bytes per vote must be measured rather than assumed.

Even a whimsical poll becomes permanent infrastructure at community scale. A practical application needs:

- an inexpensive EVM L2 or EFS settlement venue;
- batching or compact envelopes where compatible with independent verification;
- relayer/sponsorship policy so voting does not require users to hold gas;
- rate limits outside the kernel and clear paid-spam behavior;
- a retention decision distinguishing permanent votes from permanent results.

For `public-signed` mode, permanent individual votes require informed acknowledgement and silent nonparticipation free of penalty; acknowledgement does not cure coercion or linkability. An explicit blank/abstain record is public. If the community needs a private path or only a durable aggregate, it may prefer another backend or an external ephemeral intake system with an aggregate proof/commitment on EFS—but that is a different, less independently replayable trust model.

## Client and accessibility requirements

The voting client should:

- render the exact manifest-bound question and choices;
- show the voter population and privacy mode before voting;
- require an informed acknowledgement when the choice will be public, attributable, and permanent, while preserving silent nonparticipation free of penalty and explaining that an explicit abstain record is public;
- show the opening, closing, finality, revote, tie, and cancellation rules;
- avoid generic wallet transaction prompts when a narrow poll-signing ceremony is possible;
- provide a local receipt containing the poll ID and admitted-record reference without falsely implying secrecy;
- package a verifier separately from the casting client;
- use no telemetry, third-party fonts, trackers, or wildcard network access;
- support keyboard-only use, screen readers, mobile layouts, and reviewed translations;
- distinguish “submitted,” “admitted,” “finalized,” “counted,” and “result final”;
- report eligible, participating, valid, blank/abstaining, invalid, and per-option counts as outcomes among participants, never as representative of silent members; a privacy-sensitive profile uses explicit, predeclared small-cell suppression markers rather than leaking detailed counts;
- show the named response owner/deadline and the later signed accept/reject/defer disposition for advisory or `binding-manual` results.

Small-cell suppression protects only aggregate output when the underlying ballots and eligibility evidence are nonpublic. It provides no privacy in `public-replayable` mode because anyone can derive the suppressed counts from raw records.

The complete cast-and-verify journey should target WCAG 2.2 AA and be tested with keyboard-only navigation, VoiceOver, NVDA, mobile screen readers, zoom/reflow, low-bandwidth conditions, and representative users. These requirements align with [[kernel-capability-model]], [[packages-and-updates]], [[Designs/clientv2/network-privacy|Client v2 network privacy]], and [[locale-and-accessibility]].

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
| Required control or per-poll approval threshold becomes unavailable | Policy defines timeout, replacement, or no-poll outcome without silently lowering the threshold |
| Poll receives no valid votes | `NO_DECISION`; do not mislabel it a tie |
| Poll ties | `NO_WINNER`/no authorization; use a manifest-defined new-ID runoff if one is needed |
| Material outage | Apply only a predeclared objective rule; otherwise close and rerun under a new poll ID |
| Poll is cancelled | Immutable status/reason record; required authorization; admitted record bytes and frozen tally remain |
| Scheduled publisher fails | Clients can derive the occurrence definition, but target-dependent encodings may still require materialization; no false claim of guaranteed relay/admission liveness |
| Majority targets protected rights or an individual | Folder constitution and due process override ordinary majority rule |

## Acceptance walkthrough: hotdog or hamburger

1. Three community stewards establish a 2-of-3 control policy and a separate recovery policy.
2. They approve a daily series using `public-signed`, one final counted choice per member snapshot, last-valid revote, and no-winner on a tie.
3. The series pins “Hotdog” and “Hamburger” as stable option identifiers and provides translated labels.
4. Every client derives the same July 24 occurrence-intent digest, including its pre-open snapshot cutoff and voting window.
5. After the cutoff basis finalizes, the compiler derives the actual 100-member root/count and basis. At least 2 of the 3 configured moderators approve the final manifest digest before opening; anyone may relay that same signed envelope.
6. This fixture embeds the final `pollDigest` and bounded discovery key in vote value bytes while keeping the final manifest retrievable; a target-dependent alternative points to the materialized manifest.
7. A member opens the EFS poll app, acknowledges that the vote is public, attributable, and permanent, remains free not to participate without penalty, understands that an explicit abstain record would also be public, and signs “Hotdog.”
8. The client submits through a sponsored relayer; the member can retry through another route using the same signed record.
9. The member later signs “Hamburger.” The verifier collapses all records for that `(voter,poll)` and counts it because its declared `(authorOrder, recordDigest)` wins among records admitted before close.
10. At close, two independently built verifier packages enumerate the same eligible vote set and produce the same tally and input commitment.
11. A convenience result record is published. Clients independently verify it rather than trusting the publisher.
12. The poll, public votes, result, and verifier reports remain readable under the folder's election history; the named response owner later signs an accept/reject/defer disposition with reasons.

The walkthrough requires no central poll database and no trusted tally operator. It still trusts the policy authority, membership snapshot, signing devices, EFS authority/finality basis, and verifier implementation.

## Appropriate uses

- harmless, advisory daily community preference polls;
- harmless, advisory folder roadmap prioritization;
- harmless, advisory club, cooperative, or association preference gathering;
- nonbinding moderation-policy signaling that does not decide individual cases or protected rights;
- transparent DAO preference polling where one principal or one token position is acceptable and no binding consequence follows in the MVP;
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

## Research-resolved defaults and implementation gates

The questions above are no longer undifferentiated open design space:

| Question | Application default | Remaining EFS gate |
|---|---|---|
| Threshold moderators | Organization principal with 2-of-3 control, separately declared recovery policy, narrow operational poll actor, and exact per-moderator approval slots over the manifest when required | KEL, grant grammar, envelope, approval-slot convention, and authority-aware admission are not frozen or implemented |
| Membership snapshot | Synthetic/public roster or committed credential set, member count, authority domain, code/state/finality basis, active-evidence commitment, and snapshot algorithm version | Canonical lens, basis, and membership-snapshot encodings are unwritten |
| Vote enumeration | Basis-bound complete keyed pages, terminal closure proof, persistent admitted bodies, and proofed revocation reconciliation; the key depends on the final vote encoding | Final discovery/index shape and total gas/state cost remain unfrozen |
| Retention | Synthetic fixture uses `public-replayable`; a real product requires informed acknowledgement plus silent nonparticipation free of penalty, or a separately labeled private/`minimized-result` backend | Aggregate-only cannot remain fully recountable without retained inputs or a tally proof; an explicit abstain record is still public |
| Clear signing | Show exact poll and choice, public/secret mode, permanence, revote rule, close basis, eligibility basis, consequence, sponsor, and the canonical bytes being authorized | System-Chrome/Guardian ceremony and package runtime remain designs |
| Tie, zero votes, cancellation | Tie = no authorization/no winner; zero votes = no decision; cancellation is an authorized immutable lifecycle status/reason that does not rewrite the frozen tally; rerun gets a new poll ID | App convention and cross-language vectors do not exist |
| Independent reproduction | Mandatory launch gate: two clean-room verifiers produce byte-identical roster/eligibility, candidate, counted-set, and result roots from the declared authenticated evidence bundle and public authority state | Complete enumeration, historical basis reads, proof profile, and packages remain unfinished |
| Anonymous verifier | Replaceable sibling contract and/or application package, with circuit, verification key, setup provenance, and version pinned in the manifest | No poll convention or verifier package has been built |
| Recurring occurrence | Series derives an intent; before opening, final manifest binds actual eligibility root/count/finalized basis and receives at least 2-of-3 approval; votes embed final `pollDigest` plus discovery key or point to the same signed manifest | Snapshot compiler/approval, deterministic object identity, target existence, materialization, timestamp tolerance, and duplicate-collapse semantics are unfrozen |
| Result accountability | Report outcomes among participants; name a response owner/deadline; publish signed accept/reject/defer reasons | Result/report/disposition schemas and package vectors do not exist |

Current EFS v2 is a reconciliation-stage design, so these answers are requirements and recommended application defaults—not a claim that the application can be implemented against a stable v2 protocol today. The detailed evidence and acceptance matrix live in [[Reviews/2026-07-24-chicago-voting-vocdoni/folder-poll-question-resolution|the follow-up research note]].

## Recommended first implementation

Build only `public-signed` mode:

- one manually configured folder;
- a 2-of-3 moderator control policy, separate recovery policy, and exact per-poll approval convention;
- one fixed recurring “hotdog or hamburger” series;
- a pre-open finalized membership snapshot and final manifest approved by at least 2 of 3 configured moderators for each occurrence;
- advisory effect, no execution, and no turnout quorum;
- a pinned membership snapshot;
- last-valid revoting;
- tie as no winner and zero votes as no decision;
- opt-in notifications with no streaks or nonvoter profile;
- informed acknowledgement of a public, permanent, attributable choice, with silent nonparticipation free of penalty and a warning that explicit abstention is public;
- deterministic tally;
- sponsored writes on a cheap test venue;
- separate casting package plus independent TypeScript and Rust verifiers;
- no real-world identity, PII, ZK, encrypted ballots, or binding consequence.

Start with 100 synthetic members. Use the fixture to validate authority snapshots, complete record enumeration, finality, occurrence encoding/materialization, independent tally reproduction, package pinning, accessibility, walk-away reconstruction, and permanent-record economics. Measure 1,000 and 10,000 only after the 100-member fixture exposes the actual per-record, index, proof, and receipt costs.

Only after that works should the application compare:

1. Semaphore-style anonymous public signaling; and
2. a DAVINCI or MACI secret-external backend.

The success criterion is not “voting with no trust.” It is:

> Every remaining authority and failure mode is explicit, narrowly scoped, distributed where useful, and independently verifiable after the fact.
