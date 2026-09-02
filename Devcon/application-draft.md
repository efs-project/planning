# Devcon 8 application record

**Status:** accepted and participation confirmed 2026-09-02
**Public session:** [Who Can Turn Off Your Ethereum App? A Full-Stack Walk-Away Test](https://devcon.org/en/schedule/devcon8/SPVJV8/)
**Direct form:** [cfp.devcon.org/devcon8/submit](https://cfp.devcon.org/devcon8/submit/)

Teach a layer-by-layer approach to decentralizing Ethereum apps. EFS supplies
the motivation and working example; the walk-away proof is supporting evidence.

## General

### Session title

<!-- field:title:start -->
Who Can Turn Off Your Ethereum App? A Full-Stack Walk-Away Test
<!-- field:title:end -->

**Length:** 63/100 characters.

### Session type

**Talk, 20 minutes plus 5 minutes Q&A.**

Do not duplicate the proposal as a lightning talk or workshop. The private notes
say a format conversion is welcome.

### Track

**Permissionless Networks.**

### Abstract

<!-- field:abstract:start -->
An Ethereum app is not permissionless if its contracts, public data, or interface still depend on one team. Using Ethereum File System (EFS) on Sepolia as a working example, I will walk through contract control and immutability, naming, frontend hosting, RPCs, indexers, gateways, storage, and verification, so developers can identify each layer's off switches and test what survives when the original team disappears or is captured.
<!-- field:abstract:end -->

**Length:** 433/500 characters; two sentences; minimum 100.

### Description

<!-- field:description:start -->
Ethereum apps have centralized off switches throughout the stack. Upgrade keys change contracts. Domains and web servers remove interfaces. RPCs and indexers control what users see. A content hash proves integrity, not availability, discovery, authority, or an exit path.

I built Ethereum File System around a cypherpunk requirement: the maintainer should be optional. Its public web client uses ENS and IPFS. Path, provenance, and mirror records are on Sepolia. I will retrieve the same file from IPFS and Arweave, verify it against public records, and show how to distinguish corruption from unavailability. EFS shows how the same questions apply to any Ethereum app.

The talk goes layer by layer through contract control and immutability, naming, frontend distribution, RPCs, indexers, storage, gateways, provenance, and verification. Developers will leave knowing why each layer matters, what to check in their own apps, and how to test what still works when a team or service disappears.
<!-- field:description:end -->

**Length:** 994/1,000 characters; minimum 300.

### Additional speaker

Leave blank unless a co-speaker has explicitly confirmed before submission.

### Recording

Leave **Don't record this session** unchecked. Recording creates a durable public
talk artifact and prior EFS material is already public.

### Tags, in this order

1. Censorship Resistance
2. Decentralization
3. Open Source

Security was not available in the live tag list. Do not add a fourth tag merely
to fill the limit; the talk does not teach P2P network mechanics.

## Additional information

### Assumed knowledge

**Some familiarity.**

The audience should know what an Ethereum app, content hash, RPC, and frontend are; no EFS
knowledge or protocol-specialist background is required.

### Best target audience

**Developers.**

Community/ecosystem builders are also relevant, but the concrete takeaway is a
test developers can run against their own stack.

### CROPS: relation to censorship resistance, open source, privacy, or security

This field is labeled optional, but Devcon says it is a decisive criterion. Use
it.

<!-- field:crops:start -->
Capture resistance is the point. Developers need to know whether users can still resolve and verify public data when the team or an endpoint disappears or is coerced. They need public source and state, plus a way for another operator to replace dependencies without permission. The EFS example includes open-source code, public Sepolia records, identical bytes on IPFS and Arweave, and a verifier. It shows why integrity alone does not provide availability or censorship resistance.
<!-- field:crops:end -->

**Length:** 482 characters.

### Submitted resources

- Ethereum File System on Sepolia: [https://app.efs.eth.limo/](https://app.efs.eth.limo/)
- Ethereum File System Website: [https://efs.eth.limo/](https://efs.eth.limo/)
- Ethereum File System Video Overview: [https://youtu.be/gZl711IriSM](https://youtu.be/gZl711IriSM)

The pinned walk-away proof remains in private Notes as reviewer evidence.

### Optional 60-second introduction video

Record only if a clean take can be uploaded unlisted without threatening the
deadline. Aim for calm delivery, eye-level framing, clear audio, and no slides.

<!-- field:video-script:start -->
Hi, I'm James Carnley, creator of Ethereum File System. I built EFS around a simple cypherpunk requirement: the maintainer should be optional. But Ethereum apps still depend on upgrade keys, domains, web servers, RPCs, indexers, and gateways. At Devcon I will walk through decentralizing that whole stack, from upgrade keys and contract immutability to ENS/IPFS frontends, onchain records, mirrored content, and independent verification. I will use EFS on Sepolia as the working example, including a 63,245-byte artifact available from IPFS and Arweave and deliberate failure cases. Attendees will leave knowing why each layer matters, what to check in their own apps, and how to test what survives when the original team or one of its services disappears.
<!-- field:video-script:end -->

**Length:** 117 words, approximately 55 to 60 seconds at a deliberate pace.

### Non-English or translation request

Leave blank unless James wants to deliver in another language.

### Private Notes

<!-- field:notes:start -->
The audience takeaway is a practical checklist for reasoning about the whole public stack, not a new software product, certification system, or maintained decentralization tracker. The public walk-away proof is supporting evidence. The current demonstration is based on EFS v1 on Sepolia, while EFS v2 is an active redesign. Because Devcon is months away, I will use the strongest current implementation and clearly label what is deployed, demonstrated, or still being designed. The talk does not depend on an EFS version. I can run the demonstration from preverified public records and will prepare a prerecorded offline fallback. The session is designed for Permissionless Networks and can be compressed to lightning format if needed.

The May 2026 recording is a general EFS overview. This is a new session built around the later walk-away experiment and its explicit failure criteria.

Evidence:
- Website: https://efs.eth.limo/
- Live Sepolia app: https://app.efs.eth.limo/
- Public walk-away proof source: https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof
- Prior 35-minute presentation: https://youtu.be/gZl711IriSM
<!-- field:notes:end -->

## Speaker information

### Project / organization affiliation

**Ethereum File System (independent open-source public-good project)**

### Last speaking engagement and recording

<!-- field:last-talk:start -->
"Ethereum File System" at Web3 Weekends, Chicago, May 8, 2026. https://youtu.be/gZl711IriSM
<!-- field:last-talk:end -->

### Devcon attendance count

**3+**

### Public links

- Website: [https://efs.eth.limo/](https://efs.eth.limo/)
- GitHub: [https://github.com/JamesCarnley](https://github.com/JamesCarnley)
- X: https://x.com/JamesCarnley

### Telegram or alternate contact

Telegram: @JamesCarnley
Discord: @jamescarnley

### Public Ethereum address / ENS

**JamesCarnley.eth**

### Interest in serving as an MC

**No**

### Accessibility requirements

Leave blank if none. This answer is private; add real needs without strategic
filtering.

## Account and public profile

### Public display name

**James Carnley**

### Biography

<!-- field:bio:start -->
James Carnley builds cypherpunk public infrastructure and created Ethereum File System, an open-source public good providing a shared global namespace, reliable onchain metadata and verifiable file references on Ethereum. He spent more than a decade building federated medical software at Epic and has been active in Ethereum since 2017 through beacon chain testnets and staking discussions. He now develops EFS and is designing a user-sovereign web operating system.
<!-- field:bio:end -->

**Length:** 467/500 characters; minimum 100.


### Profile image

Use the current professional headshot unless a stronger Ethereum-suit portrait
is immediately available. Upload a square, metadata-stripped JPG or PNG at
least 600×600; do not let the replacement search delay submission.

### Account

**Account created.**

## Five-minute reviewer proof

If a reviewer opens only the Resource URL, the pinned proof repository exposes
the experiment, verifier, and evidence. Private Notes also link the live public
Sepolia explorer:

1. exact 63,245-byte artifact with a published SHA-256;
2. identical verified IPFS and Arweave copies;
3. EIP-712 signature by JamesCarnley.eth;
4. fourteen public EFS attestations in three Sepolia transactions;
5. a clean public runner with VERIFIED, INVALID, and UNAVAILABLE cases.

The application does not need all five facts in the abstract. They support the
speaker's credibility and the case study if a reviewer checks.

## Submission pass

- [x] Confirm the live deadline has not already changed or closed.
- [x] Resolve attendance, contact, MC, and account fields.
- [x] Confirm all measured text fits.
- [x] Upload the square profile image.
- [x] Use exactly one track and one format.
- [x] Put tags in relevance order.
- [x] Complete the CROPS answer.
- [x] Leave recording enabled.
- [x] Leave the optional introduction-video field blank; no matching short video was ready.
- [x] Review the public biography and display name.
- [x] Complete Account, Profile, and CAPTCHA.
- [x] Press final Submit; do not stop at Save as Draft.
- [x] Capture the proposal URL/ID and on-screen confirmation.
- [x] Record public-safe acceptance and participation status without copying
  private email or speaker-portal content.
- [x] Record the submission below and update [[README]].

## Submission record

- Submitted: **yes**
- Submitted at: **2026-08-06 before 00:46 CDT**
- Proposal ID/URL: [WZPKY3CBX3B78PZDQBPDQNAC9QRAB8TJ](https://cfp.devcon.org/devcon8/talk/review/WZPKY3CBX3B78PZDQBPDQNAC9QRAB8TJ)
- Submission confirmation received: **on-screen confirmation captured**
- Exact submitted text differs from this record: **no known difference in the public title, abstract, description, resources, or biography; final public page captured in chat**

## Acceptance record

- Accepted: **yes; notification received 2026-09-02**
- Participation confirmed: **yes; 2026-09-02**
- Accepted track: **Permissionless Networks**
- Accepted format: **Talk, 20 minutes plus 5 minutes Q&A**
- Public session page: [devcon.org/en/schedule/devcon8/SPVJV8](https://devcon.org/en/schedule/devcon8/SPVJV8/)
- Exact session date, time, and room: **not yet announced**
- Program caveat: **organizers may still request changes to duration, format, or focus**
- Private correspondence: **not copied into this repository**

## Alternate titles, only if James dislikes the primary

1. **Files Are Claims, Not Blobs: A Walk-Away Test for Ethereum Data**
2. **What Survives When the App Disappears? Lessons from Ethereum File System**
3. **Your Dapp Has an Off Switch: How to Run a Walk-Away Test**

Do not use “EFS Overview,” “The Permanent Web,” or “Unstoppable Files.” Those
titles either look promotional or make a guarantee the talk is designed to
interrogate.
