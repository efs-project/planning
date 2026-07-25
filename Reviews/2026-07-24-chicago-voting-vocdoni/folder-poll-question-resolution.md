---
agent: codex-gpt-5
date: 2026-07-24
status: done
anchors:
  - area: efsv2
  - area: client
  - area: apps
  - area: privacy
  - area: governance
  - review: 2026-07-24-chicago-voting-vocdoni
  - brainstorm: 2026-07-24-codex-folder-voting-use-case
source: Follow-up research requested after the folder-scoped voting use case
---

# Folder polling: research answers and implementation gates

**Status:** point-in-time research complete on 2026-07-24; application defaults, not adopted EFS protocol decisions

#kind/research #status/done #repo/planning #topic/efsv2 #topic/privacy #topic/onchain #topic/governance

This note answers the open technical and political questions raised by [[Brainstorms/2026-07-24-codex-folder-voting-use-case|Folder-scoped polls and elections]]. It also refreshes DAVINCI's status where that changes the answer for an EFS integration.

The research deliberately separates:

1. an architecture described in a paper;
2. what the current repositories implement;
3. what public deployments demonstrate;
4. what EFS v2 currently proposes;
5. what has actually been frozen, built, measured, or independently reviewed.

It also replaces the binary question “is it decentralized?” with the useful question:

> Which actor can change, omit, learn, delay, or execute what—and can everyone else detect, bypass, or recover from that action?

## Executive answer

EFS can support a good daily “hotdog or hamburger” folder poll, but the first version should be a deliberately modest application:

- harmless and advisory;
- one pinned folder-membership snapshot;
- one stable eligible principal or credential weight per voter, without claiming one-human-one-vote;
- public signed choices only after an informed, explicit acknowledgement of permanent linkability, with silent nonparticipation free of penalty;
- no turnout quorum;
- last-valid revoting under one authoritative ordering basis;
- a tie means no winner, while zero participation means no decision;
- no automatic execution;
- a 2-of-3 moderator control policy, with a separately declared recovery policy, governing the series;
- a series-derived daily occurrence intent plus a pre-open final manifest binding the actual eligibility snapshot, so no cron operator chooses the question or rules;
- two independent verifier implementations reproducing one frozen result.

That application can remove a trusted tally operator, a mutable poll database, and unilateral scheduler discretion. It cannot remove all humans or trusted systems. People or institutions still define membership, approve the question policy, hold recovery powers, resolve exceptional disputes, and decide what the poll means. Users still rely on their device, the cryptography and software they run, and the selected chain's consensus and finality.

EFS v2 is also not implementation-ready for this today. The candidate architecture has the right generic components—organization principals, scoped actor grants, authority-domain admission, immutable records, packages, and a proposed state-readable enumeration path—but the authority profile, membership/basis encoding, complete vote-discovery mechanism, finality proof, package runtime, and full economics are not frozen or measured.

DAVINCI remains a possible future `secret-external` backend, not the right backend for the harmless daily poll. Its circuits, contracts, state-transition pipeline, standalone DKG implementation, and EVM deployments are meaningful progress. The pinned canonical node does not call that DKG and the published protocol path still uses complete locally held decryption keys; current artifacts are development artifacts; the contracts call themselves work in progress and not for production; no independent protocol audit or production setup ceremony is published; long-term data availability, forced inclusion, cast-as-intended verification, accessibility evidence, and full independent replay remain gates.

## The product should be two products

The word “poll” was hiding two different institutions:

| Profile | `social-poll` | `governance-vote` |
|---|---|---|
| Purpose | Fun, preference, lightweight prioritization | Change policy, permissions, budget, or other consequential state |
| Frequency | May be daily | Infrequent; discussion time is part of the process |
| Effect | Advisory only | Explicitly advisory, binding-manual, or narrowly binding-executable |
| Visibility | Public only when genuinely harmless and knowingly permanent | Secret member ballot by default; public roll call can fit accountable representatives |
| Question creation | Approved recurring template or transparent member queue | Draft, review, scope check, translations, and fixed consequence before opening |
| Quorum | None | Avoid turnout and electorate-approval quorums. Default to a rule over valid votes cast; enumerate any qualified-majority rule only for specified high-impact changes |
| Tie | No winner | No authorization/no winner; optionally run a manifest-defined runoff under a new poll identifier |
| Appeal | Lightweight signed challenge and response | Independent or rotating review with power to void and rerun |
| Execution | None | Only an exact, pre-disclosed, reversible machine action after a cooling-off delay |
| Retention | Individual permanence requires informed opt-in and silent nonparticipation free of penalty | Prefer manifest, aggregate result, proofs, and process record over attributable ballots |
| Follow-through | Named response owner and deadline; signed accept/reject/defer response with reasons | Named response or execution owner, deadline, and auditable disposition |

Daily entertainment should not silently become a constitutional system. Consequential governance should not inherit the daily poll's weak privacy, short consideration time, or simplified dispute procedure.

## Answers at a glance

| Question | Answer |
|---|---|
| Can EFS make voting entirely decentralized with no humans or trusted systems? | **No.** It can minimize and distribute authority, make rules immutable, remove unilateral tally discretion, and expose remaining trust. Eligibility, policy, devices, software, consensus, recovery, and exceptional disputes remain. |
| Can EFS run a daily folder poll? | **Architecturally yes; on finished EFS v2 today, no.** The use case fits the planned generic surfaces, but those surfaces are still drafts. |
| Does a daily poll need a trusted cron operator? | **No cron should choose the question or rules.** A signed series fixes an occurrence intent. Because the actual membership root and finalized basis are known later, an authorized pre-open compiler/approval step must bind them into the final poll manifest; relaying/materialization remains a liveness dependency. |
| Who should control the folder? | A community organization principal with 2-of-3 control, a separately declared recovery policy, and narrow operational grants. Per-poll approval is a distinct check over the exact manifest at a pinned basis. |
| How is membership frozen? | Pin a sorted roster or roster root, active membership evidence, authority domain, code/state/finality basis, member count, and algorithm version to the poll. “Current folder members” is not reproducible enough. |
| Can two clients enumerate the exact same vote set? | **Not yet as an EFS guarantee.** They need basis-bound complete keyed enumeration, a closure proof, proofed revocation reconciliation, state-readable admitted bodies, and identical validation rules. The correct key depends on the eventual vote encoding. |
| What orders revotes and deadlines? | One authority domain. A recurring series can pin exact UTC instants; the application then uses the authority chain's block-time rule and a finalized close basis. Never use client time or `claimedAt`. The candidate revote rule collapses every valid record for one `(voter,poll)` by the greatest declared `(authorOrder, recordDigest)` admitted before close. |
| Should public votes be permanent? | Only after informed acknowledgement, with silent nonparticipation free of penalty. An explicit blank/abstain record is also public. Permanent public votes maximize recountability and create permanent receipts and participation profiles. A private path is a different backend; aggregate-only retention needs another proof or availability model. |
| Public or secret? | As a normative institutional default: public only for genuinely harmless preferences or accountable representative roll calls. Until a real secret backend exists, personnel, sanctions, money, membership, permissions, conflicts, and coercion-sensitive member votes are unsupported. |
| Turnout quorum? | No by default, and no electorate-approval quorum. Report participation honestly and decide using valid votes cast unless a specified high-impact change has a predeclared qualified-majority rule. |
| What happens on tie, zero votes, outage, or cancellation? | Tie: no authorization/no winner; a new-ID runoff only if predeclared. Zero votes: no decision. Outage: apply an objective predeclared rule or rerun under a new ID. Cancellation: immutable status record with threshold approval and reason; never rewrite the frozen input set or tally. |
| Where should ZK live? | In a replaceable sibling contract and/or application package whose circuit, verification key, setup provenance, and version are pinned by the manifest—not in the EFS kernel. |
| Is DAVINCI ready for a consequential EFS election? | **No.** It is credible experimental infrastructure, not production election infrastructure as of this review. |
| Is DAVINCI useful to EFS now? | Yes, as a synthetic `secret-external` integration and replay/DA research target. It is unnecessary for the public daily poll. |

## “No trusted humans” is the wrong target

An honest trust map is more decentralized than a slogan:

| Layer | What can be made permissionless or independently verifiable | What remains |
|---|---|---|
| Poll policy | Immutable version, threshold approvals, prospective changes only | Humans choose allowed subjects, roles, and consequences |
| Agenda | Transparent queue, deterministic selection, published admissibility criteria, reasoned rejections, and appeal | Someone defines scope and anti-spam rules |
| Eligibility | Frozen roster/root and reproducible evidence | An issuer or social process decides who qualifies |
| Poll creation | Deterministic occurrence-intent digest constrains the final manifest; anyone can relay the same signed final envelope | The final eligibility snapshot must be compiled and authorized before opening; target materialization can remain a liveness dependency |
| Casting | Anyone can relay a valid signed record; multiple routes | Voter device and signing ceremony can misrepresent intent |
| Admission/finality | One named authority domain and proof basis | Consensus, liveness, fees, reorg and censorship assumptions |
| Tally | Deterministic open verifier; two independent implementations | Circuit/code correctness must still be tested and reviewed |
| Recovery | Separate threshold control and recovery policies, prospective revocation, transparent rerun | Guardians/stewards are trusted with bounded emergency power |
| Execution | Exact action, delay, simulation, public transaction | Some real-world consequences still require accountable humans |

The meaningful goal is:

> No single hidden operator can change the question, voter set, admitted record bytes, frozen tally, deadline, or consequence without violating a public rule that independent clients can detect.

## Governance defaults

### Separate capabilities even when the same people hold them

Small communities may assign several roles to one threshold group, but the policy should still name separate capabilities:

1. **Proposer** — drafts the question and supporting material.
2. **Agenda/scope reviewer** — checks permitted subject matter, neutrality, completeness, and sponsorship; cannot silently rewrite.
3. **Poll compiler/scheduler** — mechanically derives the immutable manifest.
4. **Eligibility authority** — commits the membership snapshot.
5. **Canceller** — acts only for predeclared reasons and normally by threshold.
6. **Appeal reviewer** — reviews exclusion, eligibility, cancellation, and outcome challenges.
7. **Executor** — performs a permitted consequence after finality and delay.
8. **Verifier** — open to everyone; reproduces the inputs and result.

At minimum, a proposer or sponsor cannot be the sole scope reviewer or decide its own appeal. Appeal review excludes directly involved actors where feasible; a small group can use a rotating or external reviewer.

This makes agenda setting visible as political power rather than disguising it as moderation. For the daily social poll, the compact version is: threshold stewards approve the series; members submit questions to a visible rate-limited queue governed by published admissibility criteria; a deterministic rule selects an eligible question; rejections include reasons and a route to appeal; and there is no executor.

### Question and result rules

For every poll:

- report eligible, participating, valid, blank/abstaining, invalid, and per-option counts when the privacy profile permits; otherwise emit explicit `SUPPRESSED` markers under a predeclared small-cell rule rather than silently omitting fields;
- describe the result as a result **among participants**, never as representative of silent members;
- do not report a sampling margin of error unless participation actually came from a probability sample;
- name the response owner and deadline for an advisory or `binding-manual` result;
- publish a signed accept/reject/defer disposition with reasons by that deadline.

Small-cell suppression protects only aggregate outputs when the underlying ballots and eligibility evidence are nonpublic. It provides no privacy in `public-replayable` mode because anyone can derive the suppressed counts from raw records.

For any consequential vote, also:

- state the participation promise before opening: consultation, recommendation, manual authorization, or automatic execution;
- ask one coherent question in neutral, plain language;
- include the status quo where it is a real option;
- explain the exact effect of every option;
- publish reviewed translations and supporting arguments symmetrically;
- give members a draft-review period;
- assign a new poll identifier after any material wording change.

These defaults follow the [Venice Commission's referendum guidance](https://www.venice.coe.int/webforms/documents/default.aspx?pdffile=CDL-AD%282022%29015-e), which calls for clear, comprehensible, unbiased questions, known effects, impartial review and appeal, and advises against turnout and approval quorums in ordinary cases. The [OECD citizen-participation checklist](https://www.oecd.org/en/publications/oecd-guidelines-for-citizen-participation-processes_f765caf6-en/full-report/component-9.html) likewise begins with the problem, desired input, intended use, relevant participants, access, communication, feedback, and evaluation—not with a voting tool.

### Public versus secret is contextual

Neither visibility rule is universally superior. Public roll calls can support representative accountability. For ordinary members, public, attributable choices create a durable channel for social pressure and cannot provide the secrecy expected of a free ballot; they also create permanent behavioral profiles and transferable receipts. Secret ballots protect independent member choice but are usually the wrong accountability mechanism for delegates acting in a representative capacity.

The following boundary is a normative institutional inference from those different roles:

- **public member choice:** harmless preference after informed acknowledgement, with silent nonparticipation free of penalty; an explicit blank/abstain record remains public;
- **public representative roll call:** when accountability is the purpose of delegation;
- **secret member ballot:** personnel, sanctions, money, permissions, membership, contested policy, conflicts, or sensitive preference;
- **no poll:** protected rights, harassment adjudication, or punishment/expulsion without a separate due-process institution.

Until a genuine secret backend and its operational process pass the relevant gates, the `secret member ballot` subjects above are unsupported; the product must fail closed rather than silently fall back to `public-signed`.

Peer-reviewed work on [public versus secret committee voting](https://academic.oup.com/jeea/article/21/3/907/6769856) supports a contextual tradeoff rather than a universal winner. The [OSCE/ODIHR election-administration handbook](https://odihr.osce.org/sites/default/files/f/documents/0/4/544240.pdf) treats secret voting as a right that a voter cannot simply waive in an election, while field experiments show that revealing turnout histories can exert substantial [social pressure](https://www.cambridge.org/core/journals/american-political-science-review/article/social-pressure-and-voter-turnout-evidence-from-a-largescale-field-experiment/11E84AF4C0B7FBD1D20C855972C2C3EB). A public EFS choice goes further than turnout disclosure: it is a transferable vote receipt regardless of whether the UI hides the voter's name.

### Frequency and participation

Daily EFS polling itself is unstudied. Evidence from repeated online surveys finds that burden and response probability depend on design and participant history, not a simple universal “daily equals fatigue” rule. Treat frequency as an experiment:

- make notifications opt-in or a digest;
- do not use streaks, shame lists, or public “did not vote” lists;
- keep each social poll short and harmless;
- measure participation by cohort over time without publishing voter profiles;
- survey why people abstain;
- reduce cadence if participation concentrates in a small habitual minority;
- keep consequential votes far less frequent and give them deliberation time.

[Jin and Kapteyn's repeated-survey study](https://journals.sagepub.com/doi/10.2478/jos-2022-0045) is the closer burden analogue. [Augenblick and Nicholson's ballot study](https://academic.oup.com/restud/article/83/2/460/17417096/rdv047) shows that within-ballot choice load and position can increase abstention and shortcuts, which informs option ordering and UI design but does not establish the effect of daily polls. Cadence remains a product hypothesis to test.

### Accessibility is part of correctness

The full cast-and-verify journey—not only the poll page—should target [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) and be tested with keyboard-only navigation, VoiceOver, NVDA, mobile screen readers, zoom/reflow, reviewed translations, low-bandwidth conditions, and representative users. Accessible authentication, error prevention, status messages, and clear distinctions among submitted, admitted, finalized, counted, and result-final are particularly relevant.

For consequential cryptographic voting, mathematical correctness is insufficient. The U.S. Election Assistance Commission's current [end-to-end protocol evaluation process](https://www.eac.gov/voting-equipment/end-end-e2e-protocol-evaluation-process) treats usability, accessibility, reliability, security, and the implementation around the protocol as separate evaluation obligations.

## EFS architecture answer

### Moderator authority

The candidate EFS organization model already has the right split:

- the community is one stable organization principal;
- an m-of-n control policy changes policy and installs or revokes actors;
- a separately declared recovery policy governs loss of control;
- ordinary records retain one actor signature;
- a poll actor receives a grant bounded to compiling/writing the exact series, final manifests, and lifecycle/result records within named resource, action, package/audience, record-kind, byte/use, venue, and validity limits;
- voters author their own ordinary vote records under their stable principal or election credential; the application verifier checks snapshot eligibility, and folder placement grants no voter write authority;
- an application constitution requiring per-poll approval uses distinct moderator approval slots over the exact manifest digest, verified at a pinned basis, or a reviewed external threshold signer.

This matches [[kel#11.3 Organizations and DAOs]]. It does not require a folder ACL, a poll-specific identity type, or threshold verification inside every EFS record.

The caveat is decisive: KEL, the envelope, and the authority-aware kernel admission seam remain draft designs. This is an application mapping, not a usable deployed capability.

### Reproducible membership snapshot

The poll should pin a conceptual artifact with at least:

```text
occurrenceIntentDigest
finalPollManifestDigest (the pollDigest used by votes)
policyDigest
organizationPrincipal
sourceMembershipCommitmentOrList
permittedMembershipAuthorities
authorityDomain
kernel/code profile
finalized block number + hash + state root
finality profile
sorted stable member principals or committed credential set
active membership claim identifiers
member count
members root
snapshot algorithm version
pre-open compiler/approval evidence
```

For the first 100-member **synthetic** fixture, retain the complete sorted roster and its root. A deliberately public community may choose the same mode after informed acknowledgement. A real private-association product should prefer a roster commitment or credential proof: even eligibility evidence can reveal sensitive membership. Independent verifiers still need a complete, authenticated and policy-compatible way to obtain whatever evidence the selected mode requires.

Membership attaches to the stable principal, not the current device key. Key recovery should not create a second voter. “One stable principal” still does not mean “one human”; the manifest must name the credential issuer or membership process.

Canonical EFS lens, basis, and membership-snapshot encodings do not yet exist. Do not invent permanent bytes in this use-case document.

### Complete vote discovery

Two clients can reproduce one tally only if both can prove that their candidate set is complete. They need:

- one finalized authority-domain basis;
- one exact key derived from the final vote encoding—for example forward-by-definition/container discovery or reverse-by-target discovery;
- basis-bound complete keyed pages;
- a terminal closure or high-watermark proof;
- persistently state-readable admitted record bodies;
- proofed revocation reconciliation at the same basis;
- identical vote-validation and tally rules.

One unratified kernel candidate proposes an append-only `allClaims` full-body spine, which would make state-only reconstruction possible if adopted. A separate discovery-index proposal points toward keyed enumeration. Neither establishes the final forward/reverse key, proof profile, revocation treatment, persistent readability guarantee, or price. Until those land, a client can verify every record an indexer returns but cannot prove that the indexer omitted none.

“Two clean-room verifiers return byte-identical candidate and counted-set roots from the declared authenticated evidence bundle and public authority state, without an EFS-operated indexer” is therefore a launch gate.

### Ordering, revotes, close, and finality

Recommended application rules:

- one authority domain for manifest, eligibility evidence, votes, and close basis;
- an exact `snapshotCutoffInstantUTC` far enough before opening for its basis to finalize;
- the first finalized authority-chain block at or after that cutoff as the membership-snapshot basis;
- a final poll manifest binding the actual membership root, count, basis hash/root, and approval evidence before voting opens; otherwise the occurrence is `NO_POLL`;
- exact `openInstantUTC` inclusive and `closeInstantUTC` exclusive for a recurring series;
- an authority-chain rule that admits a vote only from a block whose consensus timestamp is within that interval;
- a manifest-pinned timestamp-tolerance/failure rule appropriate to that chain;
- the first block at or after close, once finalized under the named finality profile, as the frozen close basis;
- provisional results until the declared close basis is finalized;
- recomputation after a pre-finality reorganization;
- a visible `DISPUTED` state if the declared finality assumption later fails;
- a frozen input set and tally evaluated at the finalized close basis, unaffected by post-close writes;
- a separately authorized lifecycle record may later mark the poll `VOID` or `CANCELLED` only if the original policy permits it; it does not rewrite the tally.

Do not use client wall time, author `claimedAt`, or a cross-chain “latest” view. Future exact block cutoffs cannot be known when a recurring UTC series is signed, so the timestamp-to-finalized-basis rule must be explicit. EFS `order` is author-controlled and may be used as a voter-declared revision sequence, not represented as trusted chronology.

Revote collapse is an application rule, not a native EFS property. Every vote encoding must expose one common slot such as `(voterPrincipal,pollDigest)`, or the verifier must collapse across every vote record for that pair. The candidate last-valid rule selects the greatest valid `(authorOrder, recordDigest)` admitted before close. Encoding each option as a separate unconstrained target would be wrong because multiple options could coexist.

Prefer an explicit `abstain` option over revocation. The EFS empty-on-revoke rule intentionally does not resurrect an earlier value.

### Recurring polls without scheduler discretion

The series constrains an occurrence but cannot by itself bind a membership root that does not exist yet. Use a two-stage derivation:

```text
occurrenceIntentDigest = H(canonicalUnsignedOccurrenceIntentBody)
pollDigest = H(canonicalUnsignedFinalManifestBody)

canonicalUnsignedOccurrenceIntentBody includes at least:
  conventionDomain
  seriesDigest
  occurrenceIndex
  snapshotCutoffInstantUTC
  openInstantUTC
  closeInstantUTC
  questionAndOptionDigest
  policyVersion
  eligibilityRuleDigest
  castingPackageCID
  verifierPackageCID

canonicalUnsignedFinalManifestBody includes:
  every final manifest field, including
  occurrenceIntentDigest
  eligibilitySnapshotDigest
  membersRoot
  memberCount
  snapshotBasisBlockNumber
  snapshotBasisBlockHash
  snapshotBasisStateRoot
  finalityProfile
  privacy/reporting/retention profile
  decision/failure/follow-through rules
```

The occurrence index is canonical. The policy pins a timezone and timezone-data version only to translate local scheduling intent into exact UTC intervals. Before opening, the compiler applies the already-approved eligibility rule at the already-approved finalized snapshot basis. The final manifest is valid only if its root/count/basis reproduce that result and the required approval evidence signs the resulting `pollDigest` separately. The MVP uses at least 2 of 3 configured moderators; a future deterministic derivation-verifier could replace that approval step only after its semantics are frozen and tested.

This removes scheduler **discretion**, not liveness or human governance. If the snapshot cannot finalize, the manifest is not authorized in time, or the final manifest is not retrievable before opening, the occurrence is `NO_POLL`; nobody substitutes a different roster or silently opens late.

Current EFS does not yet authorize a generic object merely because its bytes derive from a signed series, and generic object identifiers are owner/salt-derived rather than simple content hashes. The application convention must therefore choose and test how votes refer to the already-finalized manifest:

1. put `pollDigest` plus a bounded, discoverable poll/series key in vote value bytes; the signed final manifest remains separately retrievable but need not be the vote's target; or
2. point the vote to a materialized immutable/hash-committed final-manifest object.

Anyone may relay the **same signed final-manifest envelope**; current EFS does not let arbitrary parties independently mint an identical object merely by deriving its content. Separate golden vectors must prove that both encodings resolve the same canonical occurrence intent, final `pollDigest`, snapshot, and tally semantics. Materialization, discovery, and duplicate-collapse remain launch gates.

### Independent verifier package

Ship two separate immutable, hash-committed closure manifests. Each pins exact content hashes/CIDs for its package assets:

- **casting closure:** reads exactly one poll and stages exactly one poll-bound vote; no generic wallet, arbitrary-folder, wildcard-network, or execution capability;
- **verifier closure:** has no signing or write capability and consumes a frozen offline evidence bundle or a narrowly scoped public proof endpoint.

Both a TypeScript and a Rust verifier should emit canonical bytes containing:

```text
pollDigest
occurrenceIntentDigest
snapshotBasis
closeBasis
policyDigest
eligibilityRoot + memberCount
candidateSetRoot
countedSetRoot
perOptionCounts
profilePermittedAggregateCountsAndSuppressionMarkers
tie/decision-rule/cancellation status
verifierPackageCID
resultDigest = H(canonical result body excluding resultDigest)
```

The published result is a cache. Clients display it as final only after their verifier reproduces it.

### Recovery, cancellation, and rerun

Predeclare:

- organizational control revokes a lost or compromised poll actor prospectively;
- the separately declared recovery policy governs restoration after control loss;
- stable principals survive device-key replacement;
- earlier authority-admitted records remain historical;
- a bare EOA has no recovery;
- loss of the required control or per-poll approval threshold never silently lowers it;
- a scheduled occurrence becomes `NO_POLL` when its required authority is unavailable;
- cancellation is an immutable status record with threshold approval and a reason code;
- admitted record bytes and the frozen tally are never edited or deleted by cancellation;
- a corrected or repeated poll always has a new digest and normally a new membership snapshot.

No recovery procedure can prove what a stolen key holder intended before a public emergency lock. Consequential policy needs an appeal and rerun rule, not retroactive certainty.

### Retention and economics

Two honest modes exist:

| Mode | Permanent evidence | Consequence |
|---|---|---|
| `public-replayable` | Manifest, public-or-synthetic roster/evidence, every vote, result | Anyone can recount; every choice, participation event, and possibly community membership is permanent and receiptable |
| `minimized-result` | Manifest, roster commitment, candidate/count roots, aggregate and proof | Less behavioral exposure; full recount needs retained inputs elsewhere or a cryptographic tally proof |

The first technical fixture should use synthetic `public-replayable` records because it tests EFS's actual reconstruction claims. Explicit acknowledgement is not a cure for coercion or permanent linkability. A real social product should not make public rosters or permanent individual choices the accidental default and must preserve silent nonparticipation free of penalty. An explicit abstain record remains public; a private path is another backend and trust model.

One draft full-spine kernel candidate estimates approximately 22–27k **marginal** gas per record for its enumeration-spine component. If that candidate were adopted unchanged, simple multiplication produces this scenario—not a universal EFS lower bound:

| Daily voters | Vote records/year | Candidate spine gas/year only |
|---:|---:|---:|
| 100 | 36,500 | 0.803–0.986 billion |
| 1,000 | 365,000 | 8.03–9.86 billion |
| 10,000 | 3,650,000 | 80.3–98.6 billion |

The vote, envelope, receipt, and index wire formats do not exist, so a bytes-per-vote estimate would be invented. The scenario also excludes body storage, discovery-index writes, authorization receipts, transaction/calldata overhead, sponsorship, results, replicas, and application metadata. It is not a total cost estimate and should not be converted to currency before choosing and measuring one authority venue.

Recommended scale posture:

- 100 daily voters: first raw-record fixture;
- 1,000: only after a measured low-cost venue test;
- 10,000: compare raw EFS records against a purpose-specific rollup or aggregate-proof design before assuming viability.

## DAVINCI point-in-time update

This section supplements, rather than replaces, [[Reviews/2026-07-24-chicago-voting-vocdoni/README#Vocdoni generation two: DAVINCI|the main DAVINCI review]].

### What is implemented

The current canonical stack is a specialized EVM-settled ZK rollup:

- a browser-generated ballot-validity proof;
- encrypted ElGamal ballots;
- proof-checked voter authentication and census membership;
- recursive vote aggregation;
- a ZK-proved state transition updating an election state root;
- homomorphic result accumulation;
- a final result proof checked by EVM contracts.

The canonical node and current paper use a Circom plus gnark recursive Groth16 stack. The separate ZisK/zkVM repository is promising parallel research, not yet the backend used by the canonical node or contracts.

Primary snapshots:

- [DAVINCI node at `b1055b6`](https://github.com/vocdoni/davinci-node/tree/b1055b6b57463f135c283363de98c7a355206f4b)
- [contracts at `719d9a8`](https://github.com/vocdoni/davinci-contracts/tree/719d9a8d2d92af5abb589ed6edab763629692071)
- [paper at `467dc62`](https://github.com/vocdoni/davinci-paper/tree/467dc62f0e82426fd6ca6a294d6673edba7762f1)
- [standalone DKG at `2d47b0c`](https://github.com/vocdoni/davinci-dkg/tree/2d47b0c26c48fd4d1890b474e6a9293850e9dca4)
- [ZisK/zkVM research at `ec0cd66`](https://github.com/vocdoni/davinci-zkvm/tree/ec0cd6610050fc12d95937cfa21c7bca115bb5f1)
- [Vocdoni voting app at `1782473`](https://github.com/vocdoni/vocdoni-app/tree/1782473d07bdf39daae9752a3a558b0966a50105)

### Maturity scorecard

| Capability | 2026-07-24 evidence | Consequence |
|---|---|---|
| Voting circuits and state pipeline | Implemented; author benchmarks use 60-vote batches | Serious prototype, not merely a concept |
| EVM settlement | Nonzero source-configured addresses on Sepolia, Arbitrum, Arbitrum Sepolia, Base, and Celo; Ethereum-mainnet address remains zero | EVM/L2 capable; no Ethereum-mainnet deployment is represented in the pinned public address configuration |
| Contract posture | Contracts README says work in progress and not for production | Treat all deployments as development/pilot evidence |
| Threshold key custody | The standalone EVM NI-DKG stack and a Sepolia manager exist, but the pinned canonical node does not import or call them. That node also contains an older in-tree DKG package used only by its tests. The current paper says DKG is not integrated into the published protocol path, whose process/finalizer flow stores and uses the complete private key corresponding to each process encryption public key | Intended threshold privacy is not a property of the pinned canonical node implementation/current published protocol path |
| DKG setup | The published DKG benchmark/setup artifacts use a single-party local Groth16 setup; no production ceremony transcript was found | DKG deployment is also experimental |
| Independent audit | Current paper says the codebase has not undergone an independent security audit | Blocks consequential use |
| Production ZK setup | Pinned node configuration defaults to `/dev/` artifacts, and the public endpoint served `/dev/` URLs; no complete public production phase-two ceremony record was found | Artifact provenance gate remains |
| Sequencer decentralization | Contract proof submission is permissionless; voters send ballots off-chain to sequencers; no on-chain ballot inbox or forced-inclusion route was found | At least one reachable honest sequencer is a liveness dependency |
| Public operations | At `2026-07-25T00:40:42Z`, the public development endpoint still served `/dev/` circuit artifacts, returned an empty worker set, and reported its last transition at `2026-06-17T09:31:49Z` | A point-in-time development endpoint does not attest source-binary provenance or demonstrate adversarial multi-sequencer operations |
| Long-term data availability | EIP-4844 blob payloads support reconstruction temporarily; the paper calls long-term DA open; some configured deployments have blob enforcement disabled | Fresh replay after retention expiry is not yet guaranteed |
| Cast as intended | No protocol-level mechanism or implemented second-device challenge was found | Inclusion/tally verification does not prove the UI encrypted the intended choice |
| Independent replay | No frozen, one-command, endpoint-independent full-election verifier/replayer was found | EFS integration should make this a deliverable |
| Scale | Author benchmark: about 10 seconds for a client proof, 60 votes per batch, claimed 200 settled votes/minute with two sequencers and ten workers each | Encouraging internal evidence; not a 10k/100k/1m adversarial demonstration |
| Accessibility | No published WCAG conformance report or assistive-technology/device/network test matrix was found | Blocks civic/public-sector claims |

The standalone EVM NI-DKG is meaningful progress since the first architecture discussion. It must not be conflated either with the older test-only DKG package inside `davinci-node` or with integration into the voting path. The pinned canonical node does not reference the standalone stack, while its process creation/finalization path stores and uses a complete locally held private key. The public endpoint does not attest which source commit produced its binary, so this conclusion is deliberately about the pinned implementation and published protocol path.

### EFS integration boundary

EFS can improve DAVINCI's auditability and long-term reproducibility by preserving an exact election bundle:

- chain ID, registry address, process ID, and settlement-finality basis;
- immutable election manifest and translations;
- census commitment and the lawful/minimized evidence required to reproduce it;
- source commits, builds, circuit hashes, proving/verification-key hashes, and setup provenance;
- when full replay after blob expiry is promised, exact batch payloads or blob sidecars—including their ciphertext history—plus versioned hashes/KZG commitments and transaction references;
- before/after state roots and state-transition proofs;
- aggregate encrypted result, decryption evidence, result proof, and final result;
- incident, challenge, cancellation, and audit records;
- an independently packaged offline verifier/replayer.

This creates a real policy tradeoff: omitting expired batch payloads can prevent full replay, while retaining them preserves ciphertext history and its future-decryption exposure. The manifest must choose and disclose a replay/retention profile after a protocol-specific review; it cannot promise both minimized ciphertext retention and maximal walk-away replay.

EFS should not permanently publish:

- private voter identity datasets;
- signing secrets, encryption keys, or DKG shares;
- device, IP, or access telemetry;
- ciphertext history merely because storage is available, without a reviewed retention and future-decryption threat model.

EFS cannot retroactively make a settlement contract enforce data availability, distribute key custody, add forced inclusion, certify eligible humans, or make a compromised casting device honest. Those remain DAVINCI, credential, client, and governance responsibilities.

Licensing is mixed at the pinned snapshots: node, contracts, and standalone DKG declare AGPL-3.0; the paper declares GPL-3.0; `davinci-circom` has no visible license declaration; `davinci-zkvm` has conflicting root-license and Cargo metadata; and `vocdoni-app` permits non-production use before its stated future AGPL conversion date. A production EFS adapter needs component-by-component license review, with permission or clarification for no-license, conflicting, or restricted components; AGPL components do not inherently require vendor confirmation.

### Questions still owed by the DAVINCI team

1. Which prover path is canonical for 2026–27: recursive Circom/gnark or ZisK, and what is the migration/verifier-contract plan?
2. Which exact addresses and release tags are development, pilot, or production?
3. When will the standalone threshold DKG replace full-key custody in the canonical node, and what ceremony, warden, dropout, backup, and recovery procedures will ship?
4. Where are the independent audit scopes/reports and reproducible production setup transcripts?
5. What forced-inclusion or censorship escape path exists when sequencers reject or delay an otherwise valid ballot?
6. How does a fresh independent party recover every batch after blob expiry, including deployments where blob enforcement is disabled?
7. Will Vocdoni publish a deterministic, endpoint-independent full-election verifier/replayer and frozen vectors?
8. What is the cast-as-intended design and its tested coercion/receipt-freeness threat model?
9. What reproducible 10k, 100k, and 1m voter benchmarks, latency objectives, cost model, and failure-recovery drills exist?
10. What WCAG 2.2 AA, assistive-technology, low-end-device, constrained-network, multilingual, and public usability evidence exists?
11. What licensing terms apply to an EFS-hosted adapter/service and the mixed-license adjacent repositories?
12. Who is trusted to issue and revoke eligibility, prevent duplicates, hear appeals, and minimize identity data?

## Which backend is best for each next experiment?

| Need | First choice | Why | What it does not solve |
|---|---|---|---|
| Harmless daily folder poll | Native EFS public signed records | Simplest, most independently replayable, no external sequencer or ZK ceremony | Privacy, coercion, one-human-one-vote |
| Anonymous public preference | Semaphore-style membership proof and poll nullifier | Mature generic anonymous signaling; choice can remain publicly countable | Secret choice, complete election lifecycle, coercion resistance |
| Experimental EVM secret ballot | DAVINCI and MACI side-by-side | Exercises different trust models: threshold-rollup intent versus coordinator anti-collusion | Neither is currently a no-trust civic election |
| Supervised official-election research | Paper-backed/E2E systems such as ElectionGuard | Built around evidence, audit, and cast/challenge workflows | Permissionless remote Ethereum voting |
| Participatory process and deliberation | Decidim-style process layer plus an auditable vote backend | Handles proposals, discussion, inclusion, feedback, and institutional follow-through | Cryptographic secrecy by itself |

For a daily nonsecret poll, adding DAVINCI would make the system less decentralized in practice: it introduces an external sequencer, proving pipeline, key-custody path, data-availability lifecycle, and setup artifacts that the native signed-record poll does not need.

## Recommended experiment sequence

### 1. Freeze a protocol-independent fixture

Create a 100-member synthetic organization with:

- 2-of-3 moderator control, a separate recovery fixture, and exact per-poll approval slots;
- one membership snapshot;
- one daily series, three occurrence intents, and three pre-open final poll manifests binding the actual snapshot;
- valid, invalid, late, duplicate, revote, abstain, tie, cancellation, and pre-finality-reorg fixtures;
- both value-embedded and target-materialized occurrence vectors, including duplicate collapse;
- a canonical evidence export;
- TypeScript and Rust verifiers.

Pass only when both implementations emit byte-identical roster, candidate, counted-set, and result roots without a hosted indexer.

### 2. Run the native public EFS poll

Use a cheap test authority venue, sponsored writes, informed acknowledgement of public/permanent linkability, silent nonparticipation free of penalty, no application telemetry, and no consequence. Explain that an explicit abstain record is public. Measure actual bytes, storage slots, gas, page/closure proof sizes, and p50/p95 admission/finality at 100, then 1,000 voters.

### 3. Add an anonymous-signal variant

Replace public voter identity with a Semaphore-style group root and poll-scoped nullifier. Preserve a public choice and deterministic tally. Test group administration, root changes, proof generation on low-end devices, metadata leakage, and independent verification.

### 4. Build a frozen DAVINCI synthetic adapter

Do not start with live civic identities. Under an explicit synthetic-test retention profile that permits ciphertext preservation, export one DAVINCI election into EFS, wait beyond ordinary blob availability, disable every Vocdoni-operated endpoint, and require a fresh verifier to reconstruct and validate the election from the preserved bundle.

### 5. Compare one secret alternative

Run the same synthetic election through MACI or Belenios and record:

- who can decrypt;
- who can censor or halt;
- whether the voter can verify intended encoding, inclusion, and tally;
- setup and key ceremonies;
- data needed for replay;
- device and accessibility burden;
- operational recovery;
- licensing and maintenance.

### 6. Test execution only after the evidence path works

Use a reversible sandbox action, an exact manifest-bound call, a cooling-off period, simulation, and an emergency stop. Never infer execution authority from a human-readable result string.

## Acceptance gates

| Gate | Pass condition |
|---|---|
| Manifest determinism | TypeScript and Rust build byte-identical unsigned canonical occurrence-intent/final-manifest bodies and digests; moderator approval envelopes/signatures remain separate artifacts |
| Occurrence encoding | Value-embedded and target-materialized modes derive the same canonical occurrence semantics and `pollDigest`; each encoding has separate golden vectors, and target-dependent mode accepts the same signed envelope and collapses duplicates |
| Eligibility binding | Changing the membership root, count, finalized basis block/hash/state root, or occurrence intent changes `pollDigest`; votes cannot reference the intent alone |
| Moderator approval | At least 2 distinct valid approvers among the 3 configured moderators authorize the exact digest at the pinned basis; duplicate approvals are ignored and raw discovery count does not decide |
| Grant confinement | Poll actor can write only the allowed series/poll actions and cannot escape scope |
| Eligibility reconstruction | Clean readers derive the identical ordered roster and root at the pinned basis |
| Complete enumeration | A reader proves the candidate set is complete without a hosted indexer |
| Vote validation | Both verifiers return identical reason codes and candidate/count roots |
| Revote | All records for the same `(voter,poll)` collapse deterministically; concurrent and equal-order cases apply `(order, recordDigest)` |
| Close and reorg | Provisional result recomputes; finalized result converges |
| Cancellation/rerun | Old votes remain; cancelled poll has no winner; rerun has a new digest |
| Recovery | Replacement actor maps to the same principal; revoked actor cannot create later admitted votes |
| False-result resistance | Both verifiers reject an intentionally false published result |
| Walk-away | Fresh implementation works after all EFS- and vendor-operated services are disabled |
| Economics | Actual total gas/state/bytes/proofs and finality are reported at 100/1k/10k |
| Accessibility | Keyboard, screen-reader, mobile, translated, error, and verify flows complete end to end |
| Result accountability | Report labels outcomes as among participants; detailed counts appear or carry predeclared privacy-suppression markers; named owner signs accept/reject/defer with reasons by the declared deadline |
| DAVINCI replay | A profile that promises full replay retains the reviewed ciphertext-bearing batch bundle and reconstructs after blob expiry; a minimized profile explicitly makes no such claim |

## Decisions research cannot make for the community

Evidence narrows the safe options but cannot choose the community's constitution:

- Does membership represent equal persons, accounts, credentials, economic stake, contribution, or something else?
- Which subjects require a secret ballot, and which representatives owe a public roll call?
- Does every member have a right to propose, and what anti-spam/sponsorship rule is legitimate?
- Which rights and individual decisions are outside majority rule?
- Which high-impact changes require a qualified majority?
- Who appoints scope reviewers, eligibility authorities, and appeal reviewers?
- Should any individual vote be permanent?
- Is delegation worth its concentration and complexity?
- How much participation does this community actually want?

Those choices belong in an explicit folder constitution, not in a hidden application default.

## EFS sources

- [[human-overview]] — current EFS v2 status, views versus capabilities, and freeze blockers
- [[kel]] — organization principals, threshold control, scoped actors, recovery, and approval adapters
- [[assumptions-and-requirements]] — authority domains, basis grades, finality, and unfrozen query/index shapes
- [[codex-kernel]] — state-resident records, enumeration spine, discovery-index proposal, and marginal spine gas
- [[onchain-completeness]] — complete predicate/revocation-aware enumeration requirements
- [[mountable-filesystem-semantics]] — pinned bases, deterministic snapshots, cursors, and closure
- [[packages-and-updates]] — content-addressed package closures
- [[sdk-boundaries]] — pure resolution versus signing and transport
- [[Designs/clientv2/network-privacy|Client v2 network privacy]] — exact endpoint capabilities and no ambient application network
- [[privacy-pass-synthesis]] — replaceable ZK sibling/verifier boundary and privacy-retention constraints

## External research sources

- [Venice Commission, Revised Code of Good Practice on Referendums](https://www.venice.coe.int/webforms/documents/default.aspx?pdffile=CDL-AD%282022%29015-e)
- [OECD Guidelines for Citizen Participation Processes, planning checklist](https://www.oecd.org/en/publications/oecd-guidelines-for-citizen-participation-processes_f765caf6-en/full-report/component-9.html)
- [International IDEA, Direct Democracy: The International IDEA Handbook](https://www.idea.int/sites/default/files/publications/direct-democracy-the-international-idea-handbook.pdf)
- [U.S. EAC, End-to-End Protocol Evaluation Process](https://www.eac.gov/voting-equipment/end-end-e2e-protocol-evaluation-process)
- [W3C, Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/)
- [Public Versus Secret Voting in Committees](https://academic.oup.com/jeea/article/21/3/907/6769856)
- [OSCE/ODIHR, Handbook for the Observation of Election Administration](https://odihr.osce.org/sites/default/files/f/documents/0/4/544240.pdf)
- [Social Pressure and Voter Turnout: Evidence from a Large-Scale Field Experiment](https://www.cambridge.org/core/journals/american-political-science-review/article/social-pressure-and-voter-turnout-evidence-from-a-largescale-field-experiment/11E84AF4C0B7FBD1D20C855972C2C3EB)
- [Relationship Between Past Survey Burden and Response Probability to a New Survey](https://journals.sagepub.com/doi/10.2478/jos-2022-0045)
- [Ballot Position, Choice Fatigue, and Voter Behaviour](https://academic.oup.com/restud/article/83/2/460/17417096/rdv047)
- [Semaphore documentation](https://docs.semaphore.pse.dev/)
- [MACI repository and documentation entry point](https://github.com/privacy-scaling-explorations/maci)
- [DAVINCI current implementation analysis](https://github.com/vocdoni/davinci-paper/blob/467dc62f0e82426fd6ca6a294d6673edba7762f1/v2/sections/analysis.tex)
- [DAVINCI contracts README and production disclaimer](https://github.com/vocdoni/davinci-contracts/blob/719d9a8d2d92af5abb589ed6edab763629692071/README.md)
- [DAVINCI configured EVM addresses](https://github.com/vocdoni/davinci-contracts/blob/719d9a8d2d92af5abb589ed6edab763629692071/golang-types/addresses.go)
- [DAVINCI canonical node key storage](https://github.com/vocdoni/davinci-node/blob/b1055b6b57463f135c283363de98c7a355206f4b/storage/keys.go)
- [DAVINCI canonical finalization path](https://github.com/vocdoni/davinci-node/blob/b1055b6b57463f135c283363de98c7a355206f4b/sequencer/finalizer.go)
- [DAVINCI development circuit artifact configuration](https://github.com/vocdoni/davinci-node/blob/b1055b6b57463f135c283363de98c7a355206f4b/config/circuit_artifacts.go#L7-L34)
- [DAVINCI permissionless transition submission and conditional blob enforcement](https://github.com/vocdoni/davinci-contracts/blob/719d9a8d2d92af5abb589ed6edab763629692071/src/ProcessRegistry.sol#L283-L335)
- [DAVINCI blob-sidecar state reconstruction](https://github.com/vocdoni/davinci-node/blob/b1055b6b57463f135c283363de98c7a355206f4b/service/state_sync.go#L95-L168)
- [DAVINCI paper source on cast-as-intended limitations](https://github.com/vocdoni/davinci-paper/blob/467dc62f0e82426fd6ca6a294d6673edba7762f1/v2/sections/introduction.tex#L46-L49)
- [DAVINCI standalone DKG](https://github.com/vocdoni/davinci-dkg/blob/2d47b0c26c48fd4d1890b474e6a9293850e9dca4/README.md)
- [DAVINCI DKG benchmark and setup caveat](https://github.com/vocdoni/davinci-dkg/blob/2d47b0c26c48fd4d1890b474e6a9293850e9dca4/BENCHMARKS.md)
- [DAVINCI ZisK/zkVM research path](https://github.com/vocdoni/davinci-zkvm/blob/ec0cd6610050fc12d95937cfa21c7bca115bb5f1/README.md)
- [DAVINCI paper GPL-3.0 license](https://github.com/vocdoni/davinci-paper/blob/467dc62f0e82426fd6ca6a294d6673edba7762f1/LICENSE)
- [`davinci-circom` pinned repository tree](https://github.com/vocdoni/davinci-circom/tree/a39a9f9867bb70726ad2137ed536d75670e042b9)
- [`davinci-zkvm` root license](https://github.com/vocdoni/davinci-zkvm/blob/ec0cd6610050fc12d95937cfa21c7bca115bb5f1/LICENSE) and [conflicting Cargo metadata](https://github.com/vocdoni/davinci-zkvm/blob/ec0cd6610050fc12d95937cfa21c7bca115bb5f1/Cargo.toml)
- [Vocdoni app source-license terms](https://github.com/vocdoni/vocdoni-app/blob/1782473d07bdf39daae9752a3a558b0966a50105/LICENSE#L1-L19)
- [Vocdoni app accessibility marketing claims](https://github.com/vocdoni/vocdoni-app/blob/1782473d07bdf39daae9752a3a558b0966a50105/src/i18n/locales/en/common.json#L600-L611)
- [DAVINCI public development endpoint `/info`](https://sequencer5.davinci.vote/info), [worker set](https://sequencer5.davinci.vote/sequencer/workers), and [stats](https://sequencer5.davinci.vote/sequencer/stats), retrieved `2026-07-25T00:40:42Z`
