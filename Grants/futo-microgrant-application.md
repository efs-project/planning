---
cssclasses:
  - grants-wide-tables
---

# FUTO Microgrant Application

Working application worksheet. Proposal status remains in [[proposals]].

## Recommendation

Apply for a **USD 5,000 FUTO microgrant** to build one bounded, non-production EFS v2 proof:

> **EFS Walk-Away File Proof:** publish and verify a portable file reference without an EFS account, an EFS-operated server, or a single storage provider.

This matches FUTO's stated priorities around source availability, user control, self-manageable infrastructure, sovereign identity, and open databases. It also matches the maturity of EFS: v1 is prior implementation evidence, while v2 is still a redesign.

## Proposed acceptance test

A clean machine can reconstruct and verify the proof from public Ethereum data and two independent content carriers without an EFS account, hosted EFS API, or privileged EFS key.

The grant does **not** promise production readiness, permanent storage, mainnet deployment, completed EFS v2, adoption, or a security audit.

## Proposed scope

| Milestone | Deliverable | Proposed effort | Budget |
|---|---|---:|---:|
| Scope | Threat model, carrier choice, proof format, and executable acceptance tests | 15 hours | USD 750 |
| Prototype | Minimal publisher plus CLI/verifier and portable proof bundle | 50 hours | USD 2,500 |
| Independence test | Verify through two carriers; document disappearance and tampering behavior | 20 hours | USD 1,000 |
| Publication | Reproducible demo, test vectors, short video, report, and maintenance note | 15 hours | USD 750 |
| **Total** | Target completion in six weeks at USD 50/hour | **100 hours** | **USD 5,000** |

James confirmed the USD 5,000 ask, 100-hour budget, and six-week availability on 2026-07-28.

## Draft framing

### One line

EFS is building a user-owned way to publish and verify portable file references without depending on a platform account or one storage provider.

### Problem

People can store the same public file in several places, but ordinary links give one service control over whether the reference keeps working. Content-addressed storage verifies bytes but does not by itself provide a user-owned path, explicit mirror history, or a portable record of who published the reference.

### Why EFS

EFS explores an Ethereum-native coordination layer for paths, provenance, and mirrors above storage systems. The existing v1 Sepolia deployment and public code show prior execution; the current public client is not being offered as the requested proof. EFS v2 is a clean redesign, and this microgrant would answer one concrete design question with open code and reproducible evidence rather than claiming the full system is finished.

### Why FUTO

The proof is designed around user exit: its verification path should require no proprietary client, hosted EFS API, platform account, advertising model, or irreplaceable operator. A user should be able to keep the proof, inspect the implementation, choose carriers, and verify it independently.

## Applicant facts

- [x] Applicant and payee: James Carnley personally.
- [x] Location: Chicago, Illinois, United States.
- [x] Email: `JamesCarnley@gmail.com`.
- [x] GitHub: [JamesCarnley](https://github.com/JamesCarnley).
- [x] Ask and availability: USD 5,000, 100 hours, six weeks.
- [x] License: grant-funded outputs can be open source; use the existing MIT license unless the application requires a different compatible choice.
- [x] Human contributors: James is the only confirmed human contributor. AI agents are development tools, not team members.
- [x] Control: James currently controls the EFS GitHub organization, `efs.eth`, deployment authority, and grant funds. EFS uses a Safe so control can become a shared multisig when additional team members join.
- [ ] Confirm whether EFS has received prior funding beyond self-funding and whether any of this scope is funded elsewhere.

## Technical choices to brainstorm

- [x] Content carriers: IPFS and Arweave.
- [ ] Choose one real public file or small corpus with a credible preservation need.
- [ ] Choose the exact v2 surface to prototype without binding unresolved architecture.
- [ ] Define disappearance, substitution, stale-mirror, and tampering behavior.
- [ ] Decide what is verified by Ethereum, by a content address, or only claimed by a publisher.
- [ ] Name one external person or project willing to reproduce the proof. None is confirmed yet; do not imply otherwise.
- [ ] Commit to a maintenance period and public reporting location.

## Five-minute reviewer proof

- [EFS website](https://efs.eth.limo)
- [EFS GitHub organization](https://github.com/efs-project)
- [EFS KarmaHQ page](https://www.karmahq.xyz/project/ethereum-file-system/about)
- [EFS overview video](https://www.youtube.com/watch?v=GIJpvk1XzT8)
- [Introducing the Ethereum File System](https://paragraph.com/@ethereumfilesystem.eth/introducing-the-ethereum-file-system)
- [EFS Sepolia deployment registry](https://github.com/efs-project/contracts/blob/main/docs/CHAINS.md)
- [EFSIndexer on Sepolia](https://sepolia.etherscan.io/address/0xc4DeaBB482C2FA74690629eEa662efb166BD658a)
- [ ] Add one inspectable end-to-end v1 record or transaction. The deployed contracts are prior evidence, but the proposed walk-away proof does not exist yet.
- [ ] Add one current test command and its passing output.
- [ ] Add a short v1-versus-v2 maturity note.
- [ ] Add a public client/demo only when it is ready and visibly labeled with the correct maturity.

## Claims discipline

Use:

- existing v1 prototype;
- v2 redesign or proposed v2 proof;
- user-controlled, inspectable, portable, and replaceable;
- verifiable within the guarantees of each named carrier;
- open-source grant outputs.

Avoid:

- permanent, forever, immutable, or uncensorable;
- no admin keys;
- production-ready or audited;
- deployed across Ethereum and EVM L2s;
- adoption or ecosystem-impact numbers without evidence;
- "another storage network," "Dropbox on Ethereum," or "truth layer."

## Submission route

Send a concise application email to `grantapps@futo.org` with:

1. the problem and user-control outcome;
2. the bounded USD 5,000 milestone;
3. the acceptance test and six-week schedule;
4. links to the public proof bundle;
5. team and payee details;
6. the honest v1/v2 maturity boundary;
7. a request for any preferred application format or follow-up material.

Official sources: [FUTO Grants](https://futo.tech/grants), [What is FUTO?](https://www.futo.org/about/what-is-futo/), and [Source First](https://futo.tech/source-first).

Current send-ready draft: [[futo-microgrant-email]].
