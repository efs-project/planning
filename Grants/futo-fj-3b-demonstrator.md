---
cssclasses:
  - grants-wide-tables
---

# FJ-3b: Tiny Walk-Away Demonstrator

This is the pre-submission proof for [[futo-microgrant-application]]. It should take hours, not weeks. It does not define EFS v2 and it does not build the full grant deliverable.

## Result

Completed 2026-07-29 using the deployed EFS Sepolia contracts and
`JamesCarnley.eth`.

- Public source: [walk-away-proof at evidence commit](https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof)
- Artifact: `efs-sepolia-deployment-reference-v0.tar.gz`
- Bytes: `63,245`
- SHA-256: `9c5bbda410deea8714a37b5ab82d3e22982cee79d1d1320cd43a91d562f34d39`
- IPFS CID: `bafkreie4lo62ieg65kdrji33lk4c2prctawo46or2ezazvb2shkwf42nhe`
- Arweave ID: `-34W1UeEynCbiM_wSU-v2vCw_M7SUeBnUF2xPco0M1k`
- EFS DATA UID: `0xcb848af3a9508e4cf9bac6948d2221a0a8ef2c74887a637260ee10ffe83f8e49`
- Sepolia transactions: [values](https://sepolia.etherscan.io/tx/0xb718f21d58fee081c73128b6af721cfa97fb87b93105d8731381c9b75300a933), [paths and mirrors](https://sepolia.etherscan.io/tx/0x72619bc19e4b822815ae9741a00781a0a1f4d73796d810d5b7778e545f3f1a16), [pins](https://sepolia.etherscan.io/tx/0x5f6fce39b8efc2463f007a61012fe41a089ee320b721053700aaa0ca7cc3a701)
- Compact evidence bundle: [IPFS](https://w3s.link/ipfs/bafkreiblww44k5hmyimnlktnyf27rmdazxs7hajk65gcqydqhxsguelwwe), [Arweave](https://ardrive.net/LwXdLNPkpHMAlDdhfbHnSndkz_5igAW7L8kTkhqoX0U)

Independent verification returned `VERIFIED` through both carriers. Negative
checks returned `INVALID` for changed bytes, manifest, signature, locator, and
EFS UID, while an unreachable selected carrier returned `UNAVAILABLE`.

## ELI10

We make one exact EFS package and put identical copies in two different storage systems: IPFS and Arweave.

We then make a signed instruction card saying:

> This exact file has this fingerprint and size. Here is where to find each copy. James signed this card, and its fingerprint was posted publicly on Ethereum's Sepolia test network.

A small verifier follows the card, downloads either copy, and checks the file. A fresh public CI runner repeats the test using only the repository instructions and public endpoints. That is the evidence added to the grant application.

## Read this first

James only needs the first four items. The remaining links are builder references.

1. [IPFS content addressing](https://docs.ipfs.tech/concepts/content-addressing/) - read through "Content addressing and CIDs." A CID identifies IPFS content and includes more than a plain file hash, so the proof records both the CID and an ordinary SHA-256 fingerprint.
2. [RFC 8785: JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785.html) - read the abstract and introduction. It explains why JSON must have one repeatable byte representation before it can be hashed and signed.
3. [EIP-712](https://eips.ethereum.org/EIPS/eip-712) - read the abstract and specification overview. This is the standard way an Ethereum wallet signs structured information that a program can verify.
4. [Ethereum networks](https://ethereum.org/developers/docs/networks/) - read the Sepolia section. Sepolia is the application-development testnet used for the public receipt.
5. [Kubo basic CLI operations](https://docs.ipfs.tech/how-to/kubo-basic-cli/) - builder reference for `ipfs add`, `ipfs cat`, and retrieval.
6. [Turbo SDK](https://docs.ar.io/sdks/turbo-sdk) - builder reference for uploading the same bytes to Arweave and recording the returned retrievable ID.
7. [Viem `signTypedData`](https://viem.sh/docs/actions/wallet/signTypedData) and [`verifyTypedData`](https://viem.sh/docs/utilities/verifyTypedData) - builder references for the signature.

## Scope Lock

The tiny demonstrator proves:

- identical bytes can be retrieved through either IPFS or Arweave;
- one signed manifest describes those bytes and both carrier locations;
- the manifest and carrier records are published through the deployed EFS contracts on Sepolia;
- corruption is distinguishable from carrier unavailability;
- a clean public CI runner can reproduce the result without private EFS infrastructure.

It deliberately omits:

- a production EFS v2 implementation;
- a UI;
- mainnet deployment;
- a dedicated receipt or revocation contract;
- long-term availability claims;
- support for every wallet or storage backend.

The funded project would turn this proof into a maintained, documented tool
with coherent publish/supersede/revoke behavior, broader failure testing, and a
proper comparison report. Contract-wallet coverage and a lightweight
reviewer-facing page are stretch goals after the core acceptance criteria.

## Recommended Pilot Artifact

Use one compressed archive containing:

- an exact snapshot of one EFS repository at a recorded commit;
- the generated contract ABI files needed by an outside developer to inspect or call that snapshot;
- a short `ARTIFACT.md` naming the source repository and commit.

An ABI is an instruction sheet that tells software how to talk to a smart contract. Including it makes the package useful rather than merely symbolic.

A Git tag is a human-friendly bookmark such as `walk-away-demo-v0`. It is optional for this pre-grant proof: an exact Git commit hash is sufficient and avoids presenting the current work as an EFS v2 release.

## Build Steps

### 1. Lock the artifact

- Choose the repository and exact commit.
- Decide whether generated ABIs are already stable enough to include.
- Record the source URL and commit hash in `ARTIFACT.md`.
- Name the result `efs-walk-away-demo-v0.tar.gz`.

**Recommended choice:** use a small contracts source snapshot plus its generated ABIs. If the ABI set is in flux, use the source snapshot alone and say why.

### 2. Produce deterministic bytes

- Build the archive from the exact Git commit with `git archive`.
- Compress it without embedding the current time, for example with deterministic gzip (`gzip -n`).
- Run the build twice in clean directories.
- Confirm both runs produce the same SHA-256 and byte length.

Record:

```text
artifact file:
source repository:
source commit:
sha256:
byte length:
build command:
```

### 3. Upload the identical file to both carriers

- Add the `.tar.gz` file to IPFS with Kubo and record its CID.
- Retrieve it with `ipfs cat` or `ipfs get`; confirm its SHA-256 and size.
- Upload the same `.tar.gz` file through an Arweave uploader such as Turbo.
- Record the exact retrievable Arweave data-item or transaction ID returned by the uploader.
- Retrieve it through an independently configurable gateway; confirm its SHA-256 and size.

The IPFS CID and Arweave identifier are different carrier-specific addresses. Neither replaces the common SHA-256 fingerprint of the exact downloaded bytes.

### 4. Create the unsigned manifest

Create `manifest.json` with at least:

```json
{
  "format": "efs-walk-away-proof/v0",
  "artifactName": "efs-walk-away-demo-v0.tar.gz",
  "artifactSha256": "<64 lowercase hex characters>",
  "artifactByteLength": 0,
  "sourceRepository": "https://github.com/efs-project/<repo>",
  "sourceCommit": "<40-character commit>",
  "signer": "0x...",
  "ipfsCid": "<CID>",
  "arweaveId": "<retrievable ID>"
}
```

- Canonicalize the JSON using RFC 8785.
- Compute the SHA-256 of those canonical bytes.
- Keep the signature outside `manifest.json` so the manifest does not try to contain its own signature.

### 5. Sign the manifest

- Use `JamesCarnley.eth`, which resolved to `0xaCf4C2950107eF9b1C37faA1F9a866C8F0da88b9` on 2026-07-28. Confirm MetaMask displays the same address immediately before signing.
- Sign the manifest digest as EIP-712 typed data.
- Record the signer address, EIP-712 domain, typed-data definition, message, and signature in `proof.json`.
- Verify the signature locally before continuing.

The EFS treasury Safe is not required for this proof. Supporting Safe/ERC-1271 signatures can remain part of the funded implementation.

### 6. Publish the proof through deployed EFS

Use the frozen, live EFS schemas on Sepolia rather than a dummy self-transaction. A publisher script prepares the calls and pauses only for MetaMask approval.

1. Create an empty EFS `DATA` attestation and the standalone PROPERTY values.
2. Create `contentHash`, `size`, and `cid` key anchors under the DATA; add `ipfs://` and `ar://` MIRROR attestations.
3. PIN the PROPERTY values to their key anchors and optionally PIN the DATA at a human-readable EFS path.

Record the EFS DATA UID, attestation UIDs, transaction hashes, schema UIDs, chain ID, and contract addresses in `proof.json`.

The three stages are separate because later attestations refer to UIDs created by earlier transactions. The deployed EFS contracts supply meaningful public receipts, publisher identity, mirror discovery, and revocable claims without introducing a new permanent contract for this demo.

### 7. Build the smallest verifier

The CLI accepts `manifest.json`, `proof.json`, and configurable IPFS, Arweave, and Sepolia endpoints. It checks:

1. RFC 8785 canonicalization and manifest digest;
2. EIP-712 signature and signer;
3. deployed EFS DATA, PROPERTY, PIN, and MIRROR attestations on Sepolia;
4. the EFS publisher address and transaction receipts;
5. retrieval through the selected carrier;
6. downloaded byte length and SHA-256.

It prints exactly one final state:

| State | Meaning |
|---|---|
| `VERIFIED` | The signature, EFS records, retrieved bytes, size, and fingerprint match. |
| `UNAVAILABLE` | No selected carrier returned bytes. This is not called tampering. |
| `INVALID` | A returned or declared value conflicts with the signed proof. |

### 8. Run the evidence matrix

- [x] IPFS verification succeeds without accessing Arweave.
- [x] Arweave verification succeeds without accessing IPFS.
- [x] One changed artifact byte returns `INVALID`.
- [x] A changed manifest field returns `INVALID`.
- [x] A changed signature returns `INVALID`.
- [x] A substituted CID or Arweave ID returns `INVALID`.
- [x] A wrong EFS DATA UID returns `INVALID`; the verifier also checks schema, publisher, and transaction receipts.
- [x] An unreachable selected carrier returns `UNAVAILABLE`.

Commands and compact results are published in
[EVIDENCE.md](https://github.com/efs-project/contracts/blob/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof/EVIDENCE.md).

### 9. Run clean-room automation

The public GitHub Actions workflow now:

1. starts from a fresh hosted runner;
2. checks out only the public repository;
3. installs pinned dependencies;
4. verifies the EFS records through a public Sepolia RPC;
5. runs the IPFS-only and Arweave-only success cases;
6. runs at least one `INVALID` case;
7. publishes the commit, environment, commands, and result in the workflow log.

No private EFS server, local artifact, publishing key, or unpublished configuration may be available to the workflow.

- [x] Workflow committed and triggered from the public proof branch.
- [x] Final five-job run passed on Ubuntu/macOS and Node.js 22/26, including live verification through both carriers: [run 30423222694](https://github.com/efs-project/contracts/actions/runs/30423222694).

### 10. Strengthen and send the application

Add these to [[futo-microgrant-email]]:

- public demo repository and commit;
- IPFS CID;
- Arweave ID;
- EFS DATA UID and Sepolia transactions;
- one-line clean-runner reproduction result;
- one command a reviewer can run;
- a clear sentence that this is a deliberately small proof and the grant funds the robust publish/revoke tool, tests, documentation, and maintenance.

Then complete the remaining gates in [[futo-microgrant-application]] and submit.

## Division of Labor

**James**

- approves the artifact;
- signs the manifest and approves the deployed-EFS Sepolia attestations;
- pays any Arweave upload cost;
- reviews and sends the final grant email.

**Codex and implementation agents**

- scaffold the tiny demo repository;
- build the deterministic packager, manifest generator, verifier, and tests;
- build the deployed-EFS publisher and public clean-runner workflow;
- document the reproducible commands;
- prepare the evidence links and update the application.

## Time Box

Estimated effort:

| Work | Target |
|---|---:|
| James's reading and scope approval | 30-45 minutes |
| Artifact, manifest, signature, and EFS publication | 1-2 hours |
| Verifier and evidence matrix | 2-4 hours |
| Clean-runner reproduction and fixes | 30-60 minutes |
| Grant update and final review | 30 minutes |

Stop and reassess if the pre-grant demo grows beyond one focused day. Its job is to make the application tangible, not to consume the proposed grant.

## Decisions Needed to Start

- [x] Pilot artifact: deterministic contracts source, deployment registry, and generated ABI reference bundle.
- [x] Use `JamesCarnley.eth` (`0xaCf4C2950107eF9b1C37faA1F9a866C8F0da88b9`) as the signer and EFS publisher.
- [x] Confirmed MetaMask showed the expected address and approved all three Sepolia transactions.
- [x] Uploaded through Turbo's free small-file path with an ephemeral upload key; no payment wallet or fee was required.
