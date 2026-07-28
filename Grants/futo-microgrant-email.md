# FUTO Microgrant Email

Expert-reviewed draft for [[futo-microgrant-application]]. Proposal status remains in [[proposals]].

**To:** `grantapps@futo.org`

**Subject:** Microgrant application: portable file verification without platform lock-in

**Draft state:** Updated in James's Gmail on 2026-07-28; not sent. Hold until the remaining quality gates in [[futo-microgrant-application]] are resolved.

---

Hello FUTO team,

I'm James Carnley, an open-source developer in Chicago. I'm seeking a one-time USD 5,000 microgrant to build **EFS Walk-Away Proof v0**, a six-week experiment that lets an open-source maintainer publish a signed file reference and lets anyone later verify the exact bytes through either IPFS or Arweave after the original website, platform account, and EFS services disappear.

Open-source release files and their metadata commonly depend on accounts and URLs controlled by hosting platforms. If an account is suspended, abandoned, or compromised, users may retain copies but lose a reliable way to determine which Ethereum address signed the reference, which bytes it identified, where valid copies were published, or whether the reference was revoked.

The prototype will define a deterministic signed manifest containing a common SHA-256 digest and byte length plus separate IPFS and Arweave locations. A minimal experimental Sepolia receipt will commit to the manifest digest and its revocation status. An MIT-licensed command-line verifier will check the signature, public-chain receipt, revocation state, and retrieved bytes without requiring an EFS account or EFS-operated server.

Ethereum has one narrow, testable role: providing a shared receipt and revocation log that no application vendor controls. It will not store files or promise permanence. The final report will compare this design with a simpler signed-manifest-only baseline and document whether Ethereum provides enough value to justify its cost and dependencies.

The first pilot will publish a tagged EFS source release and generated ABI bundle. Success means:

- verification succeeds through IPFS when Arweave is unavailable, and through Arweave when IPFS is unavailable;
- modified bytes, signatures, manifests, locators, revoked references, and wrong chain receipts are rejected;
- unavailable carriers are reported as unavailable rather than mislabeled as tampering;
- a second person reproduces the result from a clean machine using replaceable RPC and gateway endpoints.

Over six weeks I will specify the manifest and threat model, build the publisher, Sepolia receipt, and verifier, run the failure tests, and publish the source, test vectors, reproducible instructions, short video, independent reproduction result, and final comparison report.

The budget is 100 hours at USD 50 per hour: USD 750 for specification and tests, USD 2,500 for implementation, USD 1,000 for failure and independence testing, and USD 750 for documentation and publication. I will maintain critical defects in the funded code for at least twelve months.

I have developed EFS publicly since early 2025 and previously delivered public contracts plus an experimental Sepolia deployment. The broader EFS v2 architecture is still being designed; this grant funds only the self-contained experiment described here.

All funded work will be MIT-licensed and independently usable. It will include no advertising, telemetry, token issuance, financial product, storage marketplace, or required proprietary service.

Current work and prior implementation:

- https://github.com/efs-project/contracts
- https://github.com/efs-project/contracts/blob/main/docs/CHAINS.md
- https://github.com/JamesCarnley
- https://github.com/efs-project

Thank you for considering the application. I would be glad to provide a one-page technical specification or walk through the existing deployment.

James Carnley
Chicago, Illinois
JamesCarnley@gmail.com
