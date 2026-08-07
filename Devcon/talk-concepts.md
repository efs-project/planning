# Devcon 8 EFS talk concepts

**Status:** pre-submission concept analysis; selected concept submitted with
final wording recorded in [[application-draft]]; no milestone or v2
implementation commitment
**Decision outcome:** Concept 1 was adapted and submitted as **Who Can Turn Off
Your Ethereum App? A Full-Stack Walk-Away Test**.

## What the application must optimize for

The strongest proposal must score well before a reviewer decides whether EFS is
interesting. It therefore needs:

- one consequential problem shared by many Ethereum teams;
- a novel, bounded takeaway rather than an EFS feature tour;
- working evidence that can be verified in minutes;
- visible alignment with censorship and capture resistance;
- a speaker qualification that follows from having built the case study;
- candid limits, especially around availability, authority, current v1, and
  unimplemented v2;
- a demo that survives hostile conference conditions.

## Recommendation

### 1. Who Can Turn Off Your Ethereum App? A Full-Stack Walk-Away Test

**Track:** Permissionless Networks
**Format:** 20-minute talk + 5-minute Q&A
**Tags:** Censorship Resistance; Decentralization; Open Source
**Readiness:** high

**Promise to the audience:** a practical threat model and checklist for testing
whether public Ethereum data remains discoverable, retrievable, verifiable, and
usable when its maintainers, frontend, domain, RPC, indexer, or gateway vanish
or are captured.

**Why it can win:**

- It directly answers the wishlist's concern with infrastructure that remains in
  users' hands.
- “Permanent dapp” is a familiar claim; making it falsifiable is a sharp,
  contrarian hook.
- EFS supplies a live Sepolia system, public code, prior presentation, and a
  reproducible proof across two carriers.
- The failures of EFS v1 create useful lessons instead of weakening the story.
- Reviewers can accept the lesson even if they have never heard of EFS.

**Why EFS belongs in it:** storage systems can identify or carry bytes, but they
do not by themselves settle stable human naming, authorship, competing versions,
reader policy, surviving mirrors, or reconstruction after the original app
operator disappears. EFS is a concrete attempt to join those layers—and an
honest source of evidence about where the attempt still depends on operators.

### The four distinctions

1. **Integrity is not availability.** A correct hash cannot retrieve missing
   bytes.
2. **Storage is not discovery.** A surviving object is useless if nobody can
   reconstruct how users named and found it.
3. **Evidence is not authority.** An immutable claim does not decide whose claim
   a reader should trust.
4. **Open source is not walk-away readiness.** Code must rebuild, endpoints must
   be replaceable, state must be inspectable, and another operator must be able
   to resume the service without permission.

### 20-minute shape

| Time | Beat | Audience result |
|---:|---|---|
| 0:00–2:00 | Kill the myth: enumerate the ordinary web dependencies inside a supposedly permanent dapp. | The problem is concrete and shared. |
| 2:00–5:00 | Define the walk-away test and four distinctions above. | Reviewers see the portable framework, not a project pitch. |
| 5:00–11:00 | Use the live Sepolia EFS explorer and the public walk-away proof to follow path → claim → mirrors → bytes → verification. | Working evidence, not slides alone. |
| 11:00–15:00 | Show the tested carrier/verifier failures; then apply the same model to domain, gateway, RPC, indexer, and maintainer dependencies. Separate VERIFIED, INVALID, and UNAVAILABLE. | Tested evidence stays distinct from threat-model analysis. |
| 15:00–18:00 | What v1 proved and where it failed: evidence/authority confusion, availability limits, operational indexes, and current admin assumptions. | Candor and hard-won lessons. |
| 18:00–20:00 | Give the reusable checklist and one invitation: run it on your own dapp. | Bounded takeaway and action. |

### Walk-away checklist

- Exact digest and byte length are independently checkable.
- At least two genuinely independent carriers can return identical bytes.
- Claims, authorship, locations, and state are visible without a proprietary API.
- Domains, RPCs, indexers, gateways, and frontends are replaceable.
- A clean machine can rebuild or run the verifier from public, pinned source.
- Corruption is distinguished from unavailability.
- Revocation and supersession are distinguished from deletion or silence.
- Current-state indexes can be reconstructed from durable evidence, or their
  operational dependency is named honestly.
- Another party can operate the useful read path without a team-held permission.
- The team has actually rehearsed the walk-away, not merely published code.

## Ranked alternatives

| Rank | Concept | Best track | Evidence/readiness | Primary risk |
|---:|---|---|---|---|
| 2 | **Files Are Claims, Not Blobs: What We Learned Building Ethereum File System** | Open & Verifiable Stack or Permissionless Networks | High: distinctive architecture lesson + live v1 | EFS in the title and architecture detail can read as promotion. |
| 3 | **Not Another Storage Network: The Missing Index Above IPFS, Arweave, and Onchain Bytes** | Open & Verifiable Stack | High: clear ecosystem positioning | “Missing layer” claims need careful prior-art comparison; can sound territorial. |
| 4 | **Two Viewers, Two Truths: Reader-Sovereign Files with Lenses** | Futures Worth Building | Medium: original intellectual hook and v1 lens evidence | Current UI may not make the contrast legible enough; v2 semantics remain unsettled. |
| 5 | **We Shipped V1, Then Redesigned It: Freezing Protocol Mistakes Forever** | Open & Verifiable Stack | High as a retrospective | Needs a crisp set of shipped failures and can expose internal redesign complexity. |
| 6 | **A Filesystem Is a Graph: Paths, Tags, Lists, Mirrors, and Provenance** | Users, Builders & Agents | High technically | Too architecture-heavy for a broad Devcon audience without a strong human problem. |
| 7 | **From Path to Bytes with web3://** | Users, Builders & Agents | Medium-high; focused demo | Narrow, implementation-specific, and less aligned with the decisive values rubric. |
| 8 | **Publish and Independently Verify a Censorship-Resistant Site** | Permissionless Networks workshop | Medium | A 50-minute participant flow is not yet rehearsed and conference-network risk is high. |
| 9 | **The Forever Files: A Rights-Aware Ethereum Archive** | Rights, Freedoms & Governance | Medium | No established external archive steward or civil-society outcome yet. |
| 10 | **Playable Permanence: An Onchain Software Museum** | Futures Worth Building | Medium; memorable visual corpus | Preservation and browser sandboxing claims outrun the present public deployment. |
| 11 | **The 100-Year File Test** | Futures Worth Building | Research-ready, implementation-low | EFS cannot claim to have passed it; risks becoming speculative. |
| 12 | **A Cypherpunk OS in the Browser** | Futures Worth Building | Design-stage | The OS is not usable today and could convert the CFP into an aspirational product pitch. |
| 13 | **Agents Need a Filesystem They Can Verify** | Users, Builders & Agents | Design-stage | Timely but crowded; capabilities, receipts, and scoped memory are future client-v2 work. |
| 14 | **EFS Overview: A Shared Filesystem for Ethereum** | None recommended | v1 demo exists | Generic project overview scores poorly on novelty and anti-promotion criteria. |

## Best alternate if the walk-away framing is rejected

### Files Are Claims, Not Blobs

The most original EFS-specific thesis is that a file in a public shared system is
not one mutable database cell. It is a derived view over append-only claims:

- one claim identifies or names the subject;
- authored claims attach bytes, mirrors, metadata, tags, and relationships;
- authority rules say who may speak for a domain;
- reader-selected lenses decide which admissible claims form the current view;
- two honest readers can render different views without rewriting shared
  history.

This cleanly teaches why “put it on IPFS” is not a filesystem. It is a strong
future full talk, but the current application has less time to demonstrate
viewer divergence reliably than to demonstrate the already-reproducible
walk-away proof.

## EFS proof inventory for the talk

### Safe, current claims

- EFS v1 is deployed on Sepolia and has a working public explorer.
- It supports stable paths/anchors, authored records, tags, lists, mirrors,
  previews, and lens-scoped reads.
- A deterministic 63,245-byte EFS deployment-reference artifact has SHA-256
  9c5bbda410deea8714a37b5ab82d3e22982cee79d1d1320cd43a91d562f34d39.
- Identical copies were independently verified through IPFS and Arweave.
- JamesCarnley.eth signed the manifest using EIP-712.
- Fourteen public EFS attestations were written in three Sepolia transactions.
- A clean public runner reproduced success across multiple operating systems and
  Node versions and distinguished VERIFIED, INVALID, and UNAVAILABLE.
- The public website, application, source, transaction receipts, and prior talk
  let a reviewer verify that this is more than a concept.

Primary local evidence: [[../Grants/futo-fj-3b-demonstrator]] and
[[../Grants/efs-grant-packet]].

### Claims to exclude or qualify

- Do not call EFS a storage network, Dropbox replacement, or canonical truth.
- Do not claim generic permanence, production readiness, audit status, adoption,
  mainnet deployment, or no admin keys.
- Do not call the current Sepolia contracts ownerless or immutably frozen.
- Do not imply that IPFS or Arweave availability follows automatically from a
  CID or transaction identifier.
- Do not present EFS v2, a mounted filesystem, the cypherpunk OS, private-data
  handling, or agent capabilities as shipped.
- Do not make a Devcon launch promise. The milestone still says the talk will
  show only what is genuinely coherent by November.

## Demo plan that can survive the conference

### Live path

1. Open a preselected public item without connecting a wallet.
2. Show its stable path, data identifier, author/provenance, digest, and mirrors.
3. Retrieve and verify identical bytes through two pretested carriers.
4. Disable or bypass the primary gateway and show the alternate path.
5. Show one deliberately modified artifact returning INVALID and one dead
   endpoint returning UNAVAILABLE.
6. End on the independent verifier or clean-runner evidence, not a success toast
   from the EFS frontend.

### Required fallbacks

- a local static copy of the slides and source evidence;
- a prerecorded 90-second demo with visible URLs, transaction IDs, hashes, and
  terminal output;
- screenshots of every state;
- a local copy of the verifier and known-good artifact;
- at least two pretested RPCs and gateways;
- no required wallet approval, fresh attestation, faucet, or indexing delay.

## Acceptance red team

| Reviewer objection | Application response |
|---|---|
| “This is an EFS product pitch.” | EFS is absent from the title; the abstract promises a reusable test; the description names failures and a checklist. |
| “IPFS already solved this.” | The talk separates byte integrity/transport from naming, provenance, resolution, authority, and operator reconstruction. |
| “This is not really a network talk.” | The thesis is infrastructure survivability under operator/network loss; the private notes permit a better-fitting track. Keep P2P out of the tags. |
| “Unstoppable is marketing.” | The talk's purpose is to replace the adjective with testable failure states and expose where EFS currently fails. |
| “Sepolia is not production.” | Call it a working public implementation and case study, never production or mainnet. |
| “The future architecture is vapor.” | Keep v2 to one clearly labeled lessons slide or omit it from the application entirely. |
| “The demo will fail.” | Use only preverified records; prepare local, recorded, multi-endpoint fallbacks. |
| “The speaker is unknown.” | Link the 35-minute May 2026 presentation and establish more than a decade of large-system engineering plus direct authorship of the case study. |
| “Many talks already promise decentralization.” | Lead with the falsifiable walk-away test and three observed failure states, not a decentralization promise. |

## Ideas to preserve for later iteration

- Turn the checklist into a small public scorecard and test several familiar
  Ethereum applications, not only EFS.
- Ask an IPFS, Arweave, web3://, archive, or local-first maintainer to challenge
  the model; do not add a co-speaker without confirmation.
- Quantify every dependency in the live proof: number of carriers, attestations,
  transactions, clean platforms, rebuild time, and replaceable endpoints.
- Build one visual “survival stack” slide: name → evidence → authority → index →
  transport → bytes → verifier → interface.
- Preserve the cypherpunk OS as the destination in one closing sentence, not the
  subject of this CFP.
