---
cssclasses:
  - grants-wide-tables
---

# FUTO Microgrant Application

Working application worksheet. Proposal status remains in [[proposals]].

## Recommendation

Apply for a **USD 5,000 FUTO microgrant** to build one architecture-neutral experiment:

> **EFS Walk-Away Proof v0:** an open-source maintainer can publish a signed file reference that remains independently verifiable through IPFS or Arweave after the original website, platform account, and EFS services disappear.

The first pilot will be a tagged EFS source release and its generated ABI bundle. This is honest dogfooding, not evidence of outside adoption. The experiment may inform EFS v2, but it will not define or claim conformance with the unresolved v2 architecture.

## User problem

Open-source maintainers commonly distribute release files through accounts, URLs, and metadata controlled by hosting platforms. If an account is suspended, abandoned, or compromised, users may retain copies of a file but lose a reliable way to determine:

- which cryptographic address signed the release reference;
- which exact bytes were referenced;
- where independently retrievable copies were published;
- whether the reference was later revoked.

Content addressing verifies bytes retrieved through one carrier. It does not by itself provide a portable publisher signature, shared update or revocation record, or carrier-independent file commitment.

## Why Ethereum

The experiment tests one narrow use of Ethereum: a public, publisher-controlled receipt and revocation log for a signed manifest digest. Ethereum will not store the files, guarantee availability, or make content permanent.

The final report must compare the Ethereum-anchored design with a signed-manifest-only baseline. It will document cost, dependencies, trust boundaries, and cases where Ethereum adds too little value to justify its use. This makes Ethereum a falsifiable design choice rather than an assumed requirement.

## Technical scope

### Deterministic manifest

Walk-Away Proof v0 will define a deterministic signed manifest containing at least:

- format version;
- SHA-256 of the exact reconstructed file bytes;
- byte length;
- signer address;
- IPFS CID;
- Arweave transaction ID;
- optional previous-manifest digest for revision history.

The SHA-256 and byte length are the carrier-independent commitment. The IPFS CID and Arweave transaction ID remain carrier-specific locators and are not treated as interchangeable file hashes.

### Experimental receipt

A minimal experimental Sepolia receipt will commit to the manifest digest and expose publish/revoke history. It is not a production EFS contract, v2 wire format, namespace, authority system, or governance commitment.

### Verifier

The open-source command-line verifier will:

1. parse the deterministic manifest;
2. verify its signature and recover the signing address;
3. verify the expected Sepolia receipt and revocation state;
4. retrieve bytes through a selected carrier;
5. reconstruct the file and verify SHA-256 plus byte length;
6. return one of three explicit outcomes.

| Outcome | Meaning |
|---|---|
| `VERIFIED` | Signature, expected Sepolia receipt, revocation state, digest, and byte length all match. |
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
7. Revoking the manifest produces `INVALID`.
8. Both carriers being unavailable produces `UNAVAILABLE`, not `INVALID`.
9. A wrong chain, receipt contract, transaction, or log reference produces `INVALID`.
10. Verification requires no EFS account, EFS server, publishing key, proprietary software, or privileged EFS key.
11. A second person reproduces the verification from a clean machine and the result is published.
12. The final report compares the Ethereum receipt with a signed-manifest-only baseline.

## Milestones and budget

| Milestone | Deliverable | Effort | Budget |
|---|---|---:|---:|
| Specification | Threat model, manifest, no-chain baseline, receipt design, and executable acceptance tests | 15 hours | USD 750 |
| Prototype | Minimal publisher, experimental Sepolia receipt, and CLI verifier | 50 hours | USD 2,500 |
| Failure and independence testing | IPFS/Arweave isolation, invalid/unavailable cases, configurable endpoints, and clean-machine reproduction | 20 hours | USD 1,000 |
| Publication | Source, test vectors, instructions, short video, final comparison report, and maintenance note | 15 hours | USD 750 |
| **Total** | Six weeks at USD 50/hour | **100 hours** | **USD 5,000** |

James confirmed the ask, budget, and six-week availability on 2026-07-28.

## Maintenance commitment

Grant-funded code will be MIT-licensed. James will maintain critical defects in the funded proof for at least twelve months, use public issue tracking, and publish the independent reproduction result and final report.

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
- [ ] Confirm prior EFS funding and that this scope is not funded elsewhere.

## Evidence to include

- [EFS contracts repository](https://github.com/efs-project/contracts)
- [EFS Sepolia deployment registry](https://github.com/efs-project/contracts/blob/main/docs/CHAINS.md)
- [James Carnley on GitHub](https://github.com/JamesCarnley)
- [EFS GitHub organization](https://github.com/efs-project)

Do not lead reviewers to the current website or GitHub organization description until their legacy permanence/uncensorability language is reconciled with current maturity.

## Remaining quality gates

- [ ] James confirms prior funding and non-duplication.
- [ ] James approves the architecture-neutral scope and EFS release pilot.
- [ ] Choose the exact tagged source release and generated ABI artifact.
- [ ] Decide whether a tiny pre-grant demonstrator is worth building before submission.
- [ ] Identify an independent final reproducer; do not imply one is already committed.
- [ ] Reconcile legacy public claims before using the website as grant evidence.

## Submission route

Email `grantapps@futo.org`. Official sources: [FUTO Grants](https://futo.tech/grants), [What is FUTO?](https://www.futo.org/about/what-is-futo/), and [Source First](https://futo.tech/source-first).

Current reviewed draft: [[futo-microgrant-email]].
