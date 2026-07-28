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

Scope and hours need James's confirmation before submission.

## Draft framing

### One line

EFS is building a user-owned way to publish and verify portable file references without depending on a platform account or one storage provider.

### Problem

People can store the same public file in several places, but ordinary links give one service control over whether the reference keeps working. Content-addressed storage verifies bytes but does not by itself provide a user-owned path, explicit mirror history, or a portable record of who published the reference.

### Why EFS

EFS explores an Ethereum-native coordination layer for paths, provenance, and mirrors above storage systems. The existing v1 Sepolia implementation and public demo show prior execution. EFS v2 is a clean redesign; this microgrant would answer one concrete design question with open code and reproducible evidence rather than claiming the full system is finished.

### Why FUTO

The proof is designed around user exit: no proprietary client, hosted EFS API, platform account, advertising model, or irreplaceable operator. A user should be able to keep the proof, inspect the implementation, choose carriers, and verify it independently.

## James-only facts needed

- [ ] Applicant name and whether the payee is James personally or a legal entity.
- [ ] Applicant location and preferred contact details.
- [ ] Confirm the USD 5,000 ask, 100-hour budget, and six-week availability.
- [ ] Confirm that all grant-funded outputs can be released under an open-source license; name the license.
- [ ] Name any other committed human contributors. AI agents are tools, not team members.
- [ ] Confirm whether prior funding exists and whether any of this scope is funded elsewhere.
- [ ] Confirm who controls the relevant GitHub organization, `efs.eth`, deployment authority, and grant funds.

## Technical choices to brainstorm

- [ ] Choose the two content carriers. Strong candidates are IPFS plus Arweave, Filecoin, HTTPS, or onchain bytes; do not promise a carrier before testing it.
- [ ] Choose one real public file or small corpus with a credible preservation need.
- [ ] Choose the exact v2 surface to prototype without binding unresolved architecture.
- [ ] Define disappearance, substitution, stale-mirror, and tampering behavior.
- [ ] Decide what is verified by Ethereum, by a content address, or only claimed by a publisher.
- [ ] Name one external person or project willing to reproduce the proof. If none exists, say so.
- [ ] Commit to a maintenance period and public reporting location.

## Five-minute reviewer proof

- [EFS website](https://efs.eth.limo)
- [EFS v1 devnet](https://app.efs.eth.limo)
- [EFS GitHub organization](https://github.com/efs-project)
- [EFS KarmaHQ page](https://www.karmahq.xyz/project/ethereum-file-system/about)
- [EFS overview video](https://www.youtube.com/watch?v=GIJpvk1XzT8)
- [Introducing the Ethereum File System](https://paragraph.com/@ethereumfilesystem.eth/introducing-the-ethereum-file-system)
- [ ] Add one inspectable v1 Sepolia record or transaction.
- [ ] Add one current test command and its passing output.
- [ ] Add a short v1-versus-v2 maturity note.
- [ ] Confirm that public demos are visibly labeled v1 where appropriate.

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
