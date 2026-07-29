---
cssclasses:
  - grants-wide-tables
---

# FUTO Microgrant Application

Working application worksheet. Proposal status remains in [[proposals]].

## Recommendation

Apply for a **USD 5,000 FUTO microgrant** to turn a self-funded,
architecture-neutral feasibility proof into a maintained open-source tool:

> **EFS Walk-Away Publisher/Verifier:** an open-source maintainer can publish,
> supersede, or revoke a signed file reference that anyone can verify from any
> surviving IPFS or Arweave copy without depending on an EFS-operated website
> or server, provided Ethereum and at least one carrier remain reachable.

The self-funded v0 demonstrator already publishes a deterministic EFS
deployment-reference bundle through IPFS and Arweave, signs its manifest with
`JamesCarnley.eth`, records the graph as EFS-schema attestations through EAS on
Sepolia, verifies active bindings through the deployed EFS resolver, and
uses a standalone open-source verifier to check either copy. This is feasibility
evidence and honest dogfooding, not outside adoption or a finished grant
deliverable. The grant funds explicit publication/revocation semantics,
portability, threat modeling, stronger testing, documentation, comparison, and
maintenance. It may inform EFS v2 but will not define or claim conformance with
the unresolved v2 architecture.

## User problem

Open-source maintainers commonly distribute release files through accounts,
URLs, and metadata controlled by hosting platforms. If the hosting account is
suspended, abandoned, or compromised while the publisher still controls the
signing key, users may retain copies of a file but lose a reliable way to
determine:

- which cryptographic address signed the release reference;
- which exact bytes were referenced;
- where independently retrievable copies were published;
- whether the reference was later revoked.

Content addressing commits to retrieved bytes. It does not by itself provide a
portable publisher signature or shared supersession and revocation history
across carrier-specific identifiers.

## Why Ethereum

The experiment tests one narrow use of Ethereum: publisher-authorized
publication, supersession, and revocation events in publicly readable,
append-only shared history. Ethereum will not store the files, guarantee
availability, or make content permanent.

The final report must compare the Ethereum-anchored design with a signed-manifest-only baseline. It will document cost, dependencies, trust boundaries, and cases where Ethereum adds too little value to justify its use. This makes Ethereum a falsifiable design choice rather than an assumed requirement.

## Technical scope

### Existing feasibility evidence

The public v0 demonstrator has already established:

- a deterministic 63,245-byte artifact with SHA-256
  `9c5bbda410deea8714a37b5ab82d3e22982cee79d1d1320cd43a91d562f34d39`;
- identical verified retrieval through IPFS and Arweave;
- an EIP-712 manifest signature from
  `0xaCf4C2950107eF9b1C37faA1F9a866C8F0da88b9`;
- 14 live EFS attestations across three zero-value EAS calls on Sepolia;
- explicit `VERIFIED`, `INVALID`, and `UNAVAILABLE` verifier outcomes;
- deterministic local rebuilds across Node.js 20, 24, and 26;
- a public multi-platform clean-runner workflow.

The current PIN and MIRROR records are individually revocable; DATA, PROPERTY,
and ANCHOR records are not. V0 does not yet define one coherent manifest-level
supersession or revocation flow. The application does not claim otherwise.

### Funded deterministic manifest

The funded tool will extend the deterministic signed manifest to contain at least:

- format version;
- SHA-256 of the exact retrieved file bytes;
- byte length;
- signer address;
- IPFS CID;
- Arweave transaction ID;
- optional previous-manifest digest for revision history.

The SHA-256 and byte length are the carrier-independent commitment. The IPFS CID and Arweave transaction ID remain carrier-specific locators and are not treated as interchangeable file hashes.

### Publication and revocation records

The funded work will specify and implement explicit publish, supersede, and
revoke history using replaceable public records. It will test whether deployed
EFS attestations are sufficient or whether a smaller experimental receipt is
justified. It is not a production EFS v2 wire format, namespace, authority
system, or governance commitment.

### Verifier

The open-source command-line verifier will:

1. parse the deterministic manifest;
2. verify its signature and recover the signing address;
3. verify the expected Sepolia receipt and revocation state;
4. retrieve bytes through a selected carrier;
5. retrieve the exact file bytes and verify SHA-256 plus byte length;
6. return one of four explicit outcomes.

The funded implementation will also provide portable test vectors and a short
demonstration video. No proprietary EFS service will be required.

| Outcome | Meaning |
|---|---|
| `VERIFIED` | Signature, expected Sepolia receipt, active binding, digest, and byte length all match. |
| `REVOKED` | The publication is authentic, but its active EFS binding was explicitly revoked or superseded. |
| `UNAVAILABLE` | No selected conforming carrier returned the bytes; this is not treated as tampering. |
| `INVALID` | The manifest, signature, chain receipt, locator, digest, or byte length does not match. |

RPC and gateway endpoints must be configurable. Documentation must state what each dependency can observe or falsify and how a user can replace it.

## Acceptance criteria

A pinned, reproducible environment and CI must demonstrate:

1. IPFS verification succeeds while Arweave access is blocked.
2. Arweave verification succeeds while IPFS access is blocked.
3. Both retrieved files produce the declared SHA-256 and byte length.
4. Changing one returned byte produces `INVALID`.
5. Changing the manifest or signature produces `INVALID`.
6. Substituting either carrier locator produces `INVALID`.
7. Revoking or superseding the active EFS binding produces `REVOKED`, distinct from tampering.
8. Both carriers being unavailable produces `UNAVAILABLE`, not `INVALID`.
9. A wrong chain, receipt contract, transaction, or log reference produces `INVALID`.
10. Verification requires no EFS account, EFS server, publishing key, proprietary software, or privileged EFS key.
11. A fresh public CI runner reproduces verification using only the public repository, pinned dependencies, and replaceable public endpoints.
12. The final report compares the Ethereum receipt with a signed-manifest-only baseline.

## Milestones and budget

| Milestone | Deliverable | Effort | Budget |
|---|---|---:|---:|
| Specification | Threat model, manifest, no-chain baseline, receipt design, and executable acceptance tests | 15 hours | USD 750 |
| Hardening and generalization | Publish/supersede/revoke flow plus maintained publisher and verifier | 45 hours | USD 2,250 |
| Failure and portability testing | IPFS/Arweave isolation, invalid/unavailable cases, test vectors, configurable endpoints, and clean-runner reproduction | 25 hours | USD 1,250 |
| Publication | Source, test vectors, instructions, short video, final comparison report, and maintenance note | 15 hours | USD 750 |
| **Total** | Six weeks at USD 50/hour | **100 hours** | **USD 5,000** |

James confirmed the ask, budget, and six-week availability on 2026-07-28.

If the core acceptance criteria finish early, stretch goals are a lightweight
read-only verification page and one Safe/ERC-1271 contract-wallet test path.
Neither is required for milestone payment.

## Maintenance commitment

Grant-funded code will be MIT-licensed. James will maintain critical defects in the funded proof for at least twelve months, use public issue tracking, and publish the clean-runner reproduction record and final report.

The proof will include no advertising, telemetry, token issuance, financial product, storage marketplace, or required proprietary service.

## Applicant facts

- [x] Applicant and payee: James Carnley personally.
- [x] Location: Chicago, Illinois, United States.
- [x] Email: `JamesCarnley@gmail.com`.
- [x] GitHub: [JamesCarnley](https://github.com/JamesCarnley).
- [x] Background: James has developed EFS publicly since early 2025 and delivered public contracts plus a Sepolia deployment.
- [x] Ask and availability: USD 5,000, 100 hours, six weeks.
- [x] License: MIT for all grant-funded outputs.
- [x] Human contributors: James is the only confirmed human contributor. AI agents are development tools, not team members.
- [x] Funding history: EFS has been self-funded to date, and this proposed scope is not funded elsewhere.

## Evidence to include

- [Walk-Away Proof source and instructions at the evidence commit](https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof)
- [Compact evidence bundle on IPFS](https://w3s.link/ipfs/bafkreiblww44k5hmyimnlktnyf27rmdazxs7hajk65gcqydqhxsguelwwe)
- [The same evidence bundle on Arweave](https://ardrive.net/LwXdLNPkpHMAlDdhfbHnSndkz_5igAW7L8kTkhqoX0U)
- [Published evidence ledger at the evidence commit](https://github.com/efs-project/contracts/blob/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof/EVIDENCE.md)
- [Successful five-job clean-runner reproduction](https://github.com/efs-project/contracts/actions/runs/30423222694)
- [EFS contracts repository](https://github.com/efs-project/contracts)
- [EFS Sepolia deployment registry](https://github.com/efs-project/contracts/blob/main/docs/CHAINS.md)
- [James Carnley on GitHub](https://github.com/JamesCarnley)
- [EFS GitHub organization](https://github.com/efs-project)

Do not lead reviewers to the current website or GitHub organization description until their legacy permanence/uncensorability language is reconciled with current maturity.

## Remaining quality gates

- [x] James approved proceeding with the architecture-neutral scope and demonstrator.
- [x] Published the deterministic contracts source, deployment registry, and generated ABI reference artifact.
- [x] Completed the one-day [[futo-fj-3b-demonstrator]] on Sepolia.
- [x] Use `JamesCarnley.eth` as the prototype signer and deployed-EFS publisher; verify the resolved address in MetaMask before signing.
- [x] Use public clean-runner automation rather than claiming a second human contributor or reproducer.
- [x] Separate the self-funded feasibility spike from the remaining grant-funded work.
- [x] Final five-job clean-runner workflow passed on Ubuntu/macOS and Node.js 22/26, including live IPFS and Arweave verification.
- [ ] James reviews and sends the final email.
- [ ] Reconcile legacy public claims before using the website as grant evidence.

## Submission route

Email `grantapps@futo.org`. Official sources: [FUTO Grants](https://futo.tech/grants), [What is FUTO?](https://www.futo.org/about/what-is-futo/), and [Source First](https://futo.tech/source-first).

Current reviewed draft: [[futo-microgrant-email]].
