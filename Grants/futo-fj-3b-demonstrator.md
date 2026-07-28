---
cssclasses:
  - grants-wide-tables
---

# FJ-3b: Tiny Walk-Away Demonstrator

This is the pre-submission proof for [[futo-microgrant-application]]. It should take hours, not weeks. It does not define EFS v2 and it does not build the full grant deliverable.

## ELI10

We make one exact EFS package and put identical copies in two different storage systems: IPFS and Arweave.

We then make a signed instruction card saying:

> This exact file has this fingerprint and size. Here is where to find each copy. James signed this card, and its fingerprint was posted publicly on Ethereum's Sepolia test network.

A small verifier follows the card, downloads either copy, and checks the file. Another person repeats the test on their own computer. That is the evidence added to the grant application.

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
- the manifest fingerprint has a public Sepolia timestamp/receipt;
- corruption is distinguishable from carrier unavailability;
- another human can reproduce the result from a clean machine.

It deliberately omits:

- a production EFS v2 implementation;
- a UI;
- mainnet deployment;
- a dedicated receipt or revocation contract;
- long-term availability claims;
- support for every wallet or storage backend.

The funded project would turn this proof into a maintained, documented tool with publish/revoke behavior, broader failure testing, and a proper comparison report.

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

- Use James's personal Ethereum signing address for this prototype.
- Sign the manifest digest as EIP-712 typed data.
- Record the signer address, EIP-712 domain, typed-data definition, message, and signature in `proof.json`.
- Verify the signature locally before continuing.

The EFS treasury Safe is not required for this proof. Supporting Safe/ERC-1271 signatures can remain part of the funded implementation.

### 6. Put the receipt on Sepolia

- Send a zero-value Sepolia transaction from the same signing address to itself.
- Put the manifest digest in the transaction data.
- Record the transaction hash in `proof.json`.
- Wait for a successful receipt.

The verifier checks the chain ID, successful receipt, sender, recipient, zero value, and transaction data. This gives the grant reviewer a public timestamped receipt without prematurely designing a permanent EFS contract.

### 7. Build the smallest verifier

The CLI accepts `manifest.json`, `proof.json`, and configurable IPFS, Arweave, and Sepolia endpoints. It checks:

1. RFC 8785 canonicalization and manifest digest;
2. EIP-712 signature and signer;
3. Sepolia transaction receipt and embedded manifest digest;
4. retrieval through the selected carrier;
5. downloaded byte length and SHA-256.

It prints exactly one final state:

| State | Meaning |
|---|---|
| `VERIFIED` | The signature, receipt, retrieved bytes, size, and fingerprint match. |
| `UNAVAILABLE` | No selected carrier returned bytes. This is not called tampering. |
| `INVALID` | A returned or declared value conflicts with the signed proof. |

### 8. Run the evidence matrix

- [ ] IPFS succeeds while Arweave access is disabled.
- [ ] Arweave succeeds while IPFS access is disabled.
- [ ] One changed artifact byte returns `INVALID`.
- [ ] A changed manifest field returns `INVALID`.
- [ ] A changed signature returns `INVALID`.
- [ ] A substituted CID or Arweave ID returns `INVALID`.
- [ ] A wrong Sepolia transaction returns `INVALID`.
- [ ] Both carriers disabled returns `UNAVAILABLE`.

Save the commands and compact output as `EVIDENCE.md`.

### 9. Get independent reproduction

Ask one human who did not build the demo to:

1. start from a clean checkout on their own computer;
2. follow only the public README;
3. run the IPFS-only and Arweave-only success cases;
4. run at least one `INVALID` case;
5. report their OS, commit, commands, result, and any confusing instruction.

CI is useful but does not replace this human check. Fix unclear instructions and have the person rerun them.

### 10. Strengthen and send the application

Add these to [[futo-microgrant-email]]:

- public demo repository and commit;
- IPFS CID;
- Arweave ID;
- Sepolia transaction;
- one-line independent reproduction result;
- one command a reviewer can run;
- a clear sentence that this is a deliberately small proof and the grant funds the robust publish/revoke tool, tests, documentation, and maintenance.

Then complete the remaining gates in [[futo-microgrant-application]] and submit.

## Division of Labor

**James**

- approves the artifact;
- signs the manifest and sends the Sepolia receipt;
- pays any Arweave upload cost;
- recruits the independent human reproducer;
- reviews and sends the final grant email.

**Codex and implementation agents**

- scaffold the tiny demo repository;
- build the deterministic packager, manifest generator, verifier, and tests;
- document the reproducible commands;
- prepare the evidence links and update the application.

**Independent human**

- follows the public instructions without private help;
- records what worked and what was confusing.

## Time Box

Estimated effort:

| Work | Target |
|---|---:|
| James's reading and scope approval | 30-45 minutes |
| Artifact, manifest, signature, and receipt | 1-2 hours |
| Verifier and evidence matrix | 2-4 hours |
| Independent reproduction and fixes | 30-90 minutes |
| Grant update and final review | 30 minutes |

Stop and reassess if the pre-grant demo grows beyond one focused day. Its job is to make the application tangible, not to consume the proposed grant.

## Decisions Needed to Start

- [ ] Confirm the pilot artifact: contracts source plus generated ABIs, or source only.
- [ ] Choose the personal Ethereum address used to sign and send the Sepolia receipt.
- [ ] Confirm that address has a small amount of Sepolia ETH.
- [ ] Choose the Arweave upload route and payment wallet.
- [ ] Name the independent human reproducer.
