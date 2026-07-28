# FUTO Microgrant Email

Send-ready draft for [[futo-microgrant-application]]. Proposal status remains in [[proposals]].

**To:** `grantapps@futo.org`

**Subject:** Microgrant application: EFS Walk-Away File Proof

**Draft state:** Created in James's Gmail on 2026-07-28; not sent.

---

Hello FUTO team,

I'm James Carnley, an open-source builder in Chicago who leads and maintains Ethereum File System (EFS). I'm applying personally for a USD 5,000 microgrant to build the **EFS Walk-Away File Proof**, a six-week open-source prototype focused on user control and exit.

Public files are often reachable only through a platform-owned URL or API. IPFS and Arweave can make the bytes independently addressable, but applications still need a portable way to record who published a reference, which mirrors are available, and how another person can verify the result without depending on the original application.

EFS is exploring an Ethereum-native coordination layer for paths, provenance, and mirrors above storage systems. EFS v1 produced public code and a Safe-controlled Sepolia deployment. EFS v2 is a clean redesign, not a production implementation. This grant would fund one bounded proof rather than claiming the full system is complete.

The acceptance test is simple:

> A clean machine can reconstruct and verify a portable file reference from public Ethereum data, IPFS, and Arweave without an EFS account, an EFS-operated server, or a privileged EFS key.

The proposed work is:

- define the threat model, portable proof format, and executable acceptance tests;
- implement a minimal publisher and command-line verifier;
- verify the same file through IPFS and Arweave and document disappearance, stale-mirror, substitution, and tampering behavior;
- publish test vectors, reproducible instructions, a short demonstration video, a final report, and a maintenance note.

The budget is 100 hours at USD 50 per hour:

- scope and acceptance tests: USD 750;
- prototype implementation: USD 2,500;
- independence and failure testing: USD 1,000;
- documentation, demo, and publication: USD 750.

All grant-funded output will be released as open-source software under the MIT license. The verification path will not require a proprietary client, hosted EFS service, advertising, token, or irreplaceable operator. I currently control the EFS GitHub organization and `efs.eth` through a Safe-based deployment authority; the Safe is intended to become shared multisig control as additional human team members join.

Current public evidence:

- Website: https://efs.eth.limo
- GitHub: https://github.com/efs-project
- Karma project profile: https://www.karmahq.xyz/project/ethereum-file-system/about
- Sepolia deployment registry: https://github.com/efs-project/contracts/blob/main/docs/CHAINS.md
- EFSIndexer on Sepolia: https://sepolia.etherscan.io/address/0xc4DeaBB482C2FA74690629eEa662efb166BD658a
- GitHub profile: https://github.com/JamesCarnley

The requested prototype does not exist yet; producing and documenting that independently reproducible proof is the purpose of the grant. I would be glad to provide any additional format, technical detail, or progress reporting FUTO prefers.

Thank you for considering it,

James Carnley
Chicago, Illinois
JamesCarnley@gmail.com
