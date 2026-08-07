# Devcon 8 speaker-application research

**Research date:** 2026-08-05 CDT
**Event:** Devcon 8, Jio World Centre, Mumbai, 2026-11-03 through 2026-11-06
**Purpose:** application evidence and strategy, not an EFS architecture decision

## Executive findings

1. **Submit tonight.** The live Pretalx configuration closes at 01:30 CDT on
   August 6, 17 hours 29 minutes earlier than the public Devcon page says.
2. **A generic EFS overview is poorly matched to the rubric.** Devcon explicitly
   rejects promotional talks and says it will accept fewer talks than Devcon 7,
   which received more than 3,000 applications.
3. **The best fit is Permissionless Networks.** The talk should teach a reusable
   walk-away test for infrastructure that stays in users' hands, with EFS as a
   deployed, candid case study.
4. **The optional CROPS answer is functionally required.** Censorship and capture
   resistance, open source, privacy, and security are a decisive criterion.
5. **No current reviewer or track-lead roster is public.** The formal decision is
   distributed across track committees and at least two reviewers. Contacts can
   improve fit and framing; attempting to bypass that process is not a credible
   acceptance strategy.

## Deadline discrepancy

| Official surface | Stated close | Chicago conversion | Operational reading |
|---|---:|---:|---|
| [Public speaker page](https://devcon.org/en/speaker-applications/) | 2026-08-06 23:59 UTC | 18:59 CDT | Publicly advertised deadline |
| [Live CFP platform](https://cfp.devcon.org/devcon8/cfp) | 2026-08-06 12:00 Asia/Kolkata | **01:30 CDT** | Likely mechanical form close |

At 19:26 CDT on August 5, the live platform displayed about six hours remaining,
confirming that its countdown used the earlier configured time. Treat the live
platform as controlling. The direct proposal URL is
[cfp.devcon.org/devcon8/submit](https://cfp.devcon.org/devcon8/submit/).

## Application process

The public process is open to everyone. Devcon says there is no speaker bureau
or invite list. The live form proceeds through:

1. **General:** proposal content, format, track, tags, recording, co-speaker.
2. **Additional information:** audience, assumed knowledge, CROPS relevance,
   resources, optional introduction video, translation, private notes, and
   speaker-specific details.
3. **Account:** sign in or create the Pretalx account.
4. **Profile:** public display name, biography, and optional image.
5. **CAPTCHA and submission.**

The platform can save a draft, but organizers cannot see drafts. A draft is not
a submission. Preserve the final confirmation page and email.

### Live-form inventory

| Field | Requirement and useful constraint |
|---|---|
| Session title | Required; maximum 100 characters stated by the form. |
| Session type | Required; one public format. |
| Track | Required; choose one. |
| Abstract | Required; 100–500 characters; 1–2 sentences naming the topic and takeaway. |
| Description | Required; 300–1,000 characters; explain the insight/findings and why they matter now. |
| Co-speaker email | Optional; every named speaker must already be confirmed. |
| Recording opt-out | Optional checkbox; leave unchecked unless there is a real reason not to publish the session. |
| Tags | Required; choose 1–4, ordered by relevance. |
| Assumed knowledge | Required: none, some familiarity, or deep prior knowledge. |
| Target audience | Required; choose the best single audience from the supplied list. |
| CROPS relation | Labeled optional, but the form says this criterion is decisive. Explain censorship/capture resistance, open source, privacy, or security. |
| Resource URL | Optional; use the live Sepolia app. |
| Introduction video | Optional; up to 60 seconds, unlisted. Do not delay submission for it. |
| Language/translation | Optional request; English is the listed content locale. |
| Private notes | Optional; use for evidence links, live-v1/v2 boundary, demo fallback, and format flexibility. |
| Affiliation | Required. |
| Last speaking engagement | Optional; include the May 2026 EFS presentation and recording. |
| Devcon attendance count | Required: none, 1+, or 3+. |
| Social links | Optional: X, Bluesky, Farcaster, website/GitHub. |
| Direct contact | Required: Telegram or alternate contact. |
| Ethereum address/ENS | Optional; JamesCarnley.eth is relevant. |
| MC interest | Required yes/no. |
| Accessibility needs | Optional and private. |
| Biography | Required; public; 100–500 characters. |
| Display name | Required; public; up to 120 characters. |
| Profile image | Optional; JPG/PNG, recommended minimum 600×600. |

The form warns that vague sessions, project pitches, and material already
presented widely are less likely to succeed. The same proposal should be
submitted only once—not copied into multiple tracks or formats. The committee
may ask permission to convert an accepted proposal to another format.

## Public formats

| Format | Operative duration | EFS assessment |
|---|---:|---|
| Talk | 20 minutes + 5 minutes Q&A | **Recommended.** Enough for one thesis, one demo, and three lessons. |
| Lightning Talk | 5 minutes + 2 minutes Q&A | Good fallback, not enough for the full walk-away test. |
| Mixed Format | 25 minutes | Weak without confirmed panelists or a genuine participatory design. |
| Workshop | Live form: 50 minutes; public pages: 60 minutes | Only submit if every attendee can complete a robust exercise with offline fallbacks. |

The ordinary form does not expose restricted formats such as keynotes. Do not
treat access-code formats as an alternate application route.

## Review and selection

The [application guidelines](https://devcon.org/en/application-guidelines/)
describe this structure:

1. Each proposal is routed to its chosen track.
2. Each track has a track lead and a diverse reviewer committee.
3. At least two reviewers assess every application.
4. Reviews are aggregated and the track team selects sessions.
5. Outcomes are final; there is no appeal.

Official criteria:

- accurate title, description, track, and tags;
- knowledge sharing rather than project or company promotion;
- novelty or innovation;
- a constructive contribution to a real problem;
- a qualified, relevant speaker;
- decisive alignment with censorship resistance, capture resistance, open
  source, privacy, or security.

Programming values include collaboration and coordination, education and
inspiration, learning from adjacent communities—especially FOSS—and challenging
assumptions or updating the state of the art.

Applications opened July 9. Decisions are expected to begin at the end of
August and finish by the end of September. The public page says Devcon SEA
received over 3,000 applications and Devcon 8 will accept fewer talks. A valid
acceptance rate cannot be derived because published schedules mix formats,
invited sessions, and multi-speaker sessions.

## Tracks through an EFS lens

The [Devcon 8 Talks Wishlist](https://notes.ethereum.org/@devcon/devcon8-talks-wishlist)
lists nine tracks. Fit below is an application recommendation, not an official
Devcon classification.

| Track | Official emphasis | EFS fit |
|---|---|---|
| **Permissionless Networks** | P2P and decentralized infrastructure, network resilience, open connectivity, systems that remain in users' hands | **Best.** The walk-away test makes operator dependencies and capture resistance concrete. |
| Open & Verifiable Stack | Open source/hardware, shared foundations, reproducibility, end-to-end verifiability | Strong alternate if the talk emphasizes independently rebuilding and verifying the full data path. |
| Futures Worth Building | Sustaining open infrastructure, parallel systems, self-sovereignty, defipunk | Strong for the 100-year-file or cypherpunk-OS thesis, but current implementation evidence is thinner. |
| Rights, Freedoms & Governance | Rights cases, open protocols as civic infrastructure, public-goods funding | Plausible for archives/public knowledge, but EFS does not yet have a real civil-society deployment to report. |
| Users, Builders & Agents | Shipping real products, wallets, agents, delegated action, user experience | Plausible for agent-readable data or a product case study, but not the sharpest current evidence. |
| Privacy & Consent | Practical privacy, identity, self-hosting, consent, ethics | Weak for current EFS: its records are public and the v2 sensitivity layer is not shipped. |
| Security | Security models, incidents, audits, field practice | A walk-away threat model overlaps, but EFS is not a security audit or incident study. |
| Applied Cryptography | Practical cryptographic primitives and education | Poor unless the session centers genuinely novel cryptography. |
| Core Protocol | Ethereum consensus, execution, roadmap, EVM, scaling | Poor; EFS is application-layer infrastructure. |

Recommended tags, in relevance order: **Censorship Resistance,
Decentralization, Open Source, Security**. P2P is available but would overstate
the session's focus; accuracy is scored.

### Wishlist hooks that matter

- Permissionless Networks explicitly asks about decentralized infrastructure,
  resilience, and infrastructure that stays in users' hands.
- Open & Verifiable Stack asks what end-to-end trust and reproducibility require,
  and what decentralized infrastructure can learn from open source.
- Futures Worth Building asks how open infrastructure survives, how parallel
  systems get built, and—in its defipunk material—whether users can still exit if
  the team, DAO, and frontend vanish.
- Generic wish-list formats include myth-busting, live code, tutorials,
  challenges, recent developments, and future direction. The proposed talk
  combines myth-busting with an applied test and live evidence.

## What accepted talks teach us

These are public accepted-program descriptions, not necessarily the exact
original application text. No credible public corpus of rejected CFP proposals,
reviewer scores, or deliberations surfaced.

| Accepted session | Transferable lesson for EFS |
|---|---|
| [Decentralizing the Internet's collaboration layer](https://archive.devcon.org/devcon-7/decentralizing-the-internets-collaboration-layer/) | Start from dependency on a shared centralized layer, then use a working stack as evidence. EFS must distinguish itself from a collaborative editor. |
| [Bringing peer-to-peer networks to ALL the peers](https://archive.devcon.org/devcon-7/bringing-peer-to-peer-networks-to-all-the-peers/) | Reveal a hidden centralization gap and enumerate concrete failure modes. This is the strongest structural precedent. |
| [Making defensive technology offensive](https://archive.devcon.org/devcon-7/making-defensive-technology-offensive-how-to-get-cypherpunk-ideals-to-the-masses/) | Explain cypherpunk systems through useful everyday affordances, not only catastrophic censorship. |
| [Rethinking usability in a world of data ownership](https://archive.devcon.org/devcon-7/rethinking-usability-in-a-world-of-data-ownership/) | A focused, testable UX thesis supported by demos beats a generic promise of better UX. |
| [Civic Tech Meets DAO](https://archive.devcon.org/devcon-7/civic-tech-meets-dao-lessons-from-japans-largest-digital-public-goods-community/) | An implemented case, candid challenges, and transferable lessons bridge technical and human audiences. |
| [What 15 blockchain pilots revealed](https://archive.devcon.org/devcon-7/the-hunt-for-impactful-use-cases-from-the-crypto-for-good-fund-what-15-blockchain-pilots-revealed-in-emerging-markets/) | Bounded cases, observed outcomes, and numbers beat broad claims. |
| [Scalable and sovereign EVM data](https://archive.devcon.org/devcon-7/scalable-and-sovereign-evm-data-modern-data-engineering-best-practices/) | Shared dependency → recent technical shift → a workflow others can adopt is a proven talk structure. |
| [Unchained Index](https://archive.devcon.org/devcon-7/unchained-index-a-purposefully-designed-schelling-point-a-native-web3-api/) | A project-specific implementation can fit when it teaches a general public-good architecture. |
| [Future of Web3: end-to-end fully decentralized web](https://archive.devcon.org/devcon-6/on-the-future-of-web3-paving-the-way-to-end-to-end-fully-decentralized-web/) | Fully decentralized web is not a novel claim by itself. Name what is newly learned and what older approaches still miss. |
| [Universal Access to All Knowledge](https://archive.devcon.org/devcon-6/universal-access-to-all-knowledge-decentralization-experiments-at-the-internet-archive/) | A real operator's experiments, trade-offs, and recommendations make preservation claims credible. |
| [Join the Swarm workshop](https://archive.devcon.org/devcon-6/join-the-swarm-how-to-run-a-light-node-or-full-node/) | A workshop needs a reproducible end state, not a long product tour. |

Earlier [IPFS](https://archive.devcon.org/devcon-1/ipfs/),
[Swarm](https://archive.devcon.org/devcon-1/swarm/), and
[sovereign Swarm](https://archive.devcon.org/devcon-5/swarm-storage-and-communication-for-a-sovereign-digital-society/)
talks establish decentralized storage as native Devcon material. They also make
“Ethereum needs decentralized storage” far too old and broad to be the novelty.

### Repeated traits worth copying

- The title names a problem, tension, or outcome; the project is absent or
  secondary.
- The first sentence makes a consequential shared problem legible.
- The abstract promises a bounded deliverable: failure modes, lessons, a
  framework, a test, or a reproducible action.
- The speaker is qualified because they built or operated the exact case being
  discussed; celebrity and prior Devcon speaking are not required.
- Candid limitations increase credibility.
- A 20-minute talk carries one thesis, about three supporting findings, and one
  demonstration—not a complete project history or architecture tour.

## People, contacts, and influence

### Confirmed

- Devcon 8 is run by the Ethereum Foundation's Devcon Team.
- Track committees with leads and multiple expert reviewers select sessions.
- The official CFP contact is [speak@devcon.org](mailto:speak@devcon.org).
- Current track-lead and reviewer names are not published in the official CFP
  material found in this pass.

### Public associations, not proven selection authority

- **Ceci** authored the current
  [Devcon 8 programming RFP](https://forum.devcon.org/t/rfp-14-programming-requests-for-devcon-8/8667),
  is named as the last editor of the Talks Wishlist, and is a Devcon Forum
  moderator. This supports a programming-curation role, not a claim that Ceci is
  a reviewer, track lead, or final decision-maker.
- **Skylar Weaver** was identified in the official Devcon 7 archive as Devcon
  Team Lead. That is historical 2024 evidence, not confirmation of the 2026 role.
- **Nathan Sexer** and several others are official forum administrators and have
  represented Devcon publicly. No source found ties them to current CFP review.

The [Suggest a Speaker](https://devcon.org/en/form/suggest-speaker/) form is for
people who might not naturally apply, including adjacent voices and people who
have not spoken before. It is not described as a vote or endorsement booster for
someone already applying.

### Best use of contacts

Ask a contact to red-team the thesis, track, or crowding risk, or to clarify the
deadline discrepancy. Do not ask them to lobby a reviewer or evade the public
process. At least two reviewers and aggregate scoring limit the leverage of one
relationship, and overt influence-seeking conflicts with the process's stated
neutrality. Sponsor speaker slots are not sold or reserved.

## Speaker benefits, travel, and obligations

- An accepted speaker receives a free Devcon ticket; an already purchased ticket
  can be refunded.
- Sessions are normally recorded and streamed. The application includes an
  opt-out, which also prevents publication on the event site.
- No public source reviewed promises a speaker honorarium, airfare, hotel, or per
  diem. Official terms put passports, visas, transport, lodging, insurance, and
  related costs on the participant.
- A ticket-confirmation letter can be requested after a ticket is confirmed.
  The [ticket FAQ](https://devcon.org/en/tickets/faq/) recommends requesting visa
  support 90 days before the event and says requests inside two weeks cannot be
  guaranteed. Because speaker decisions arrive late August through September,
  an accepted international speaker should email
  [visa@devcon.org](mailto:visa@devcon.org) immediately.
- Speakers must follow the [Code of Conduct](https://devcon.org/en/code-of-conduct/),
  venue rules, and local law. The
  [terms](https://devcon.org/en/terms-of-service/) prohibit using Devcon for
  solicitation, fundraising, financial promotion, token sales, or investment
  pitches. Selection is not Ethereum Foundation endorsement.

## Application failure modes to prevent

- Waiting for the later public deadline and finding the live form closed.
- Saving a draft but not passing the final CAPTCHA and submit step.
- Leading with “EFS overview,” features, roadmap, or a product demo.
- Saying IPFS, Arweave, Ethereum, or EFS makes data permanent without naming the
  exact integrity, availability, authority, and maintenance guarantees.
- Presenting active v2 or cypherpunk-OS design as deployed.
- Selecting P2P, Privacy, Core Protocol, or cryptography tags that the content
  does not actually earn.
- Depending on a fresh transaction, faucet, conference Wi-Fi, one RPC, one
  gateway, or one domain for the demo.
- Naming collaborators who have not confirmed participation.
- Treating an optional introduction video as more important than submitting.

## Primary source index

- [Speaker applications](https://devcon.org/en/speaker-applications/) — public
  dates, competitiveness, benefits, and application overview.
- [Application guidelines](https://devcon.org/en/application-guidelines/) —
  rules, formats, review structure, criteria, and programming values.
- [Live CFP](https://cfp.devcon.org/devcon8/cfp) — operative countdown, formats,
  and application platform.
- [Direct proposal form](https://cfp.devcon.org/devcon8/submit/) — live fields
  inspected without submission.
- [Talks Wishlist](https://notes.ethereum.org/@devcon/devcon8-talks-wishlist) —
  current tracks, tags, and desired questions.
- [Programming RFP](https://forum.devcon.org/t/rfp-14-programming-requests-for-devcon-8/8667)
  — community programming requests and speaker suggestions.
- [Devcon Archive](https://archive.devcon.org/archive/) — accepted historical
  session descriptions and recordings.
- [Devcon 7 CFP source snapshot](https://raw.githubusercontent.com/efdevcon/monorepo/f823cce8a55370886d45ba6a2f839c735ed96c6c/devcon/cms/pages/speaker_applications.mdx)
  — historical review mechanics and criteria.
- [Ethereum Foundation Devcon VI announcement](https://blog.ethereum.org/2022/06/06/devcon-vi-details)
  and [Devcon SEA announcement](https://blog.ethereum.org/2024/07/09/devcon-7-tickets)
  — historical process and positioning.
